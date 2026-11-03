import {collection,doc,getDocFromServer,runTransaction,serverTimestamp,Timestamp,onSnapshot,query,where} from 'firebase/firestore';
import {db} from '../firebase.js';
import {currentUser,currentUserRole} from '../app.js';
import {recordActivity} from './activityLogs.js';
import {getTodayKST} from '../utils/date.js';
import {assertWriter,assertExpected,createRequest,requestPatch,assertOwnedLock,stockInRemaining,requestEvent,stockOperationId} from './supplementRequestLogic.js';

export function watchRequests(next, error) {
  return onSnapshot(query(collection(db,'supplementRequests'),where('requestedAt','>=',Timestamp.fromMillis(Date.now()-60*86400000))),
    snap=>next(snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(b.requestedAt?.seconds||0)-(a.requestedAt?.seconds||0))),error);
}
export function watchRequestEvents(id,next,error) {
  return onSnapshot(collection(db,'supplementRequests',id,'events'),snap=>next(snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.version-b.version)),error);
}
export function requestActor(name) { return {uid:currentUser?.uid,name}; }
async function writeRequest(ref, expected, action, input, by, stockPatch) {
  const role=currentUserRole;
  assertWriter(role);
  if(by.uid!==currentUser?.uid) throw Error('로그인 상태가 변경됐습니다.');
  return runTransaction(db,async tx=>{
    if(by.uid!==currentUser?.uid || role!==currentUserRole) throw Error('로그인 상태가 변경됐습니다.');
    const snap=await tx.get(ref),row=snap.exists()?snap.data():null;
    if(by.uid!==currentUser?.uid || role!==currentUserRole) throw Error('로그인 상태가 변경됐습니다.');
    const time=serverTimestamp(),at=time;
    let value;
    if(expected) {
      assertExpected(row,expected);
      value=requestPatch(row,action,input,by,time,at,role);
      if(stockPatch) Object.assign(value,stockPatch(row,at));
      tx.update(ref,value);
    } else {
      if(row) throw Error('이미 저장된 신청입니다.');
      value=createRequest(input,by,time,at);tx.set(ref,value);
    }
    tx.set(doc(collection(ref,'events')),requestEvent(row,value,action,by,time));
    await recordActivity({action:'supplementRequest',subAction:action,date:getTodayKST(),staff:by.name,
      message:`영양제 신청 ${action}`,details:{app:'production',requestId:ref.id}}, {batch:tx});
    return {...row,...value,id:ref.id};
  });
}
export async function saveRequest(row,action,input,by) {
  if(!row&&action!=='create')throw Error('새 신청은 생성 작업만 가능합니다.');
  const ref=row?doc(db,'supplementRequests',row.id):doc(collection(db,'supplementRequests'));
  return writeRequest(ref,row,action,input,by);
}
export async function stockInRequest(initial,by,incoming) {
  by={uid:by.uid,name:by.name};
  const ref=doc(db,'supplementRequests',initial.id);
  assertWriter(currentUserRole);
  if(by.uid!==currentUser?.uid)throw Error('로그인 상태가 변경됐습니다.');
  const latest=await getDocFromServer(ref);
  if(latest.data()?.stockInCompletedAt)return;
  let expected=initial;
  const write=async patch=>{
    const result=await writeRequest(ref,expected,'stockIn',{},by,patch);
    expected=result;return result;
  };
  return stockInRemaining({
    acquire:async()=>{
      try {
        await write(row=>{
          if(row.stockInCompletedAt)throw Error('이미 입고 완료된 신청입니다.');
          // Only rules may decide whether an existing lease has expired.
          return {stockInLock:{uid:by.uid,at:serverTimestamp()}};
        });
      } catch(error) {
        if(['permission-denied','firestore/permission-denied'].includes(error.code))
          throw Error('다른 사람이 입고 중입니다. 2분 후 다시 시도해주세요.',{cause:error});
        throw error;
      }
      // Resolve the transform from the server before using this lease identity.
      const snap=await getDocFromServer(ref),row=snap.exists()?snap.data():null;
      assertExpected(row,expected);
      const lock=row.stockInLock;
      if(lock?.uid!==by.uid || !Number.isInteger(lock.at?.seconds))throw Error('입고 잠금을 확인할 수 없습니다.');
      expected={...row,id:ref.id};
      return lock;
    },
    refresh:async lock=>{
      // Read-only server check; each actual request write still checks again in
      // its transaction. Avoid committing Firestore verify-writes just to read.
      const snap=await getDocFromServer(ref),row=snap.exists()?snap.data():null;
      if(by.uid!==currentUser?.uid)throw Error('로그인 상태가 변경됐습니다.');
      assertWriter(currentUserRole);
      assertExpected(row,expected);assertOwnedLock(row,lock);return row;
    },
    incoming:async(item)=>{
      let next;
      await incoming(item,async tx=>{
        const snap=await tx.get(ref),row=snap.exists()?snap.data():null;
        if(by.uid!==currentUser?.uid)throw Error('로그인 상태가 변경됐습니다.');
        assertWriter(currentUserRole);
        // The key is authoritative even if a UX lease expired or was replaced.
        if(Object.hasOwn(row?.stockIn||{},item.supplementTypeId))throw Error('이미 기록된 입고입니다.');
        assertExpected(row,expected);assertOwnedLock(row,expected.stockInLock);
        const time=serverTimestamp(),patch=requestPatch(row,'stockIn',{},by,time,time,currentUserRole);
        patch.stockIn={...row.stockIn,[item.supplementTypeId]:{at:time,by,logId:stockOperationId(initial.id,item.supplementTypeId)}};
        tx.update(ref,patch);
        tx.set(doc(collection(ref,'events')),requestEvent(row,patch,'stockIn',by,time));
        await recordActivity({action:'supplementRequest',subAction:'stockIn',date:getTodayKST(),staff:by.name,
          message:'영양제 신청 stockIn',details:{app:'production',requestId:ref.id}}, {batch:tx});
        next={...row,...patch,id:ref.id};
      });
      if(!next)throw Error('원자적 입고 콜백이 실행되지 않았습니다.');
      expected=next;return next;
    },
    mark:async(_item,result)=>result,
    complete:async lock=>write(row=>{
      assertOwnedLock(row,lock);
      if(!row.items.every(i=>Object.hasOwn(row.stockIn||{},i.supplementTypeId)))throw Error('남은 입고 품목이 있습니다.');
      return {stockInCompletedAt:serverTimestamp(),stockInLock:null};
    }),
    release:async lock=>{
      if(expected.stockInCompletedAt)return;
      try {await write(row=>{assertOwnedLock(row,lock);return {stockInLock:null};});}
      catch { /* Never overwrite a competing/newer lease. Expiry permits recovery. */ }
    },
  });
}
