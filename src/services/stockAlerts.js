import {collection,doc,query,where,orderBy} from 'firebase/firestore';
import {db,auth} from '../firebase.js';
import {createServerReadScope} from './serverReadScope.js';
import {createAutoLogBatch} from './autoLogs.js';
import {acknowledgeLog} from './activityLogs.js';
import {sessionStore} from '../state/sessionStore.js';
import {getTodayKST} from '../utils/date.js';
import {stockAlertCatalog,stockAlertModel,stockAlertFingerprint} from '../domain/stockAlerts.js';

export function loadStockAlerts(scope=createServerReadScope(),today=getTodayKST()) {
  return scope.once('stock-alerts:'+today,async()=>{
    const [egg,...snapshots]=await Promise.all([
      scope.getDoc(doc(db,'eggStock','global')),
      ...['meatTypes','meatStocks','bagTypes'].map(name=>scope.getDocs(collection(db,name))),
      scope.getDocs(query(collection(db,'supplementTypes'),where('active','==',true))),
      scope.getDocs(collection(db,'supplementStock')),
      scope.getDocs(query(collection(db,'equipmentParts'),orderBy('sortOrder'))),
      scope.getDocs(collection(db,'schedules')),
      scope.getDocs(query(collection(db,'activityLogs'),where('action','==','minStock'))),
    ]);
    const rows=snap=>snap.docs.map(d=>({...d.data(),id:d.id}));
    const names=['meatTypes','meatStocks','bagTypes','supplementTypes','supplementStock','equipmentParts','schedules','history'];
    const data=Object.fromEntries(names.map((name,i)=>[name,rows(snapshots[i])]));
    data.eggStock=egg.exists()?egg.data():{};
    return {...stockAlertModel(stockAlertCatalog(data),data.history,today),history:data.history,supplementTypes:data.supplementTypes};
  });
}
// Display observers already own a server-confirmed snapshot. Persist only the
// derived notification transitions; do not download all inventory/history again.
export async function recordStockAlertTransitions(model,isCurrent) {
  if(!isCurrent())throw Error('화면이나 로그인 상태가 변경됐습니다. 다시 열어주세요.');
  const batch=createAutoLogBatch(model.history);
  model.plans.forEach(plan=>batch.enqueue(plan));
  const result=await batch.flush();
  if(result.failedIds.length)throw Error('부족재고 알림을 갱신하지 못했습니다. 확인 완료는 보류하고 다시 조회해주세요.');
  return result;
}
export async function syncStockAlerts() {
  const epoch=sessionStore.epoch,uid=auth.currentUser?.uid;
  const model=await loadStockAlerts();
  const result=await recordStockAlertTransitions(model,()=>epoch===sessionStore.epoch&&uid===auth.currentUser?.uid);
  return result.createdIds.length||result.existingIds.length?loadStockAlerts():model;
}
export async function acknowledgeStockAlerts(shown,staff,isCurrent=()=>true) {
  const epoch=sessionStore.epoch,uid=auth.currentUser?.uid,latest=await syncStockAlerts();
  if(!isCurrent()||epoch!==sessionStore.epoch||uid!==auth.currentUser?.uid)throw Error('화면이나 로그인 상태가 변경됐습니다. 다시 열어주세요.');
  const targets=shown.filter(i=>i.unseen);
  if(targets.some(item=>!latest.items.some(next=>stockAlertFingerprint(next)===stockAlertFingerprint(item))))
    throw Error('재고 상태가 바뀌어 목록을 갱신했습니다. 변경 내용을 확인해주세요.');
  // Only the displayed shortage records are acknowledged. Operational alerts are untouched.
  const results=await Promise.allSettled(targets.map(item=>acknowledgeLog(item.eventId,staff)));
  if(results.some(result=>result.status==='rejected'))throw Error('일부 항목의 확인 결과를 확인하지 못했습니다. 목록을 다시 조회해주세요.');
  return loadStockAlerts();
}
