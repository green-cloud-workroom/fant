import {quantityText,stockUnit} from '../utils/staffText.js';
import {collection,doc,getDocFromServer,getDocsFromServer,query,where,runTransaction,serverTimestamp} from 'firebase/firestore';
import {MOVEMENT_LABELS,movementAmount,movementKind,cancellableMovement,originalMovementKind,movementReason,movementReasonRequired} from './manualMovementLogic.js';

const specs = {
  meatLogs:{stock:'meatStocks',field:'remaining',keys:['meatTypeId','meatStockId','stage']},
  bagLogs:{stock:'bagTypes',field:'currentQty',keys:['bagTypeId']},
  eggLogs:{stock:'eggStock',field:'currentQty',keys:[]},
  supplementLogs:{stock:'supplementStock',field:'currentQty',keys:['supplementTypeId']},
  breadPanLogs:{stock:'breadPanLots',field:'remaining',keys:['lotId']},
  frozenPanLogs:{stock:'frozenPanLots',field:'remaining',keys:['lotId']},
};
function supplementProofMatches(proof,id,row) {
  if(!proof?.exists())return false;
  const p=proof.data();
  return p.kind==='manual'&&p.version===1&&p.logId===id&&p.supplementTypeId===row.supplementTypeId
    &&p.qty===row.qty&&p.before===row.before&&p.after===row.after&&p.uid===row.uid;
}
function permissionDenied(error) {
  const seen=new Set();
  for(let depth=0;error&&depth<4&&!seen.has(error);depth++,error=error.cause){
    seen.add(error);
    if(error.code==='permission-denied'||error.code==='firestore/permission-denied')return true;
  }
  return false;
}
export async function listCancellationSources(db,name,filter) {
  if (!specs[name]) throw Error('지원하지 않는 기록입니다.');
  const conditions = Object.entries(filter).map(([key,value])=>where(key,'==',value));
  const [snap,decisions]=await Promise.all([getDocsFromServer(query(collection(db,name),...conditions)),getDocsFromServer(collection(db,'statsCorrections'))]);
  const rows=snap.docs.map(d=>({...d.data(),id:d.id}));
  const cancelled=new Set(rows.filter(r=>r.manualMovement?.kind==='cancel').map(r=>r.manualMovement.cancelOf));
  for(const r of rows)if(r.type==='incomingQuantityCorrection'&&r.status==='active')cancelled.add(r.correctionOf);
  const corrections=decisions.docs.map(d=>({...d.data(),id:d.id})),replaced=new Set(corrections.map(c=>c.supersedes).filter(Boolean));
  for(const c of corrections)if(!replaced.has(c.id)&&c.source?.startsWith(name+'/'))cancelled.add(c.source.slice(name.length+1));
  return rows.filter(r=>cancellableMovement(r)&&!cancelled.has(r.id)).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||a.id.localeCompare(b.id));
}

export async function saveManualMovement({db,command,name,stockId,log,selection,stockData=null,expectedBefore,uid=null,scheduleChange=null,activity=null,supplementName=null,extraWrites=null}) {
  const spec=specs[name],kind=selection?.kind;
  if (!spec||!MOVEMENT_LABELS[kind]||!selection?.operationId||!log.date||!Number.isFinite(movementAmount(log))||movementAmount(log)===0
    ||!(log.staff||log.staffName))throw Error('처리 구분·수량·날짜·담당자를 확인해주세요.');
  const reason=movementReason(kind, selection.reason||log.reason||log.note||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(log.date)||!Number.isFinite(Date.parse(log.date))||new Date(log.date).toISOString().slice(0,10)!==log.date)throw Error('유효한 날짜를 입력해주세요.');
  if(reason.length>200)throw Error('사유는 200자 이내로 입력해주세요.');
  if (movementReasonRequired(kind)&&!reason)throw Error('처리 사유를 입력해주세요.');
  const entered=movementAmount(log);
  if(name==='supplementLogs' && (!Number.isSafeInteger(entered) || typeof uid!=='string' || !uid))throw Error('영양제 수량 또는 저장 계정을 확인해주세요.');
  const identityKey={meatLogs:'meatStockId',bagLogs:'bagTypeId',supplementLogs:'supplementTypeId',breadPanLogs:'lotId',frozenPanLogs:'lotId'}[name];
  if(!stockId||(identityKey&&log[identityKey]!==stockId)||name==='eggLogs'&&stockId!=='global')throw Error('재고와 기록의 품목 연결이 일치하지 않습니다.');
  if(['bagLogs','eggLogs','supplementLogs','frozenPanLogs'].includes(name)&&!Number.isInteger(entered))throw Error('수량은 정수로 입력해주세요.');
  if (kind==='receipt'&&entered<=0||kind==='usage'&&entered>=0)throw Error('실제 입고는 증가, 사용은 감소 수량으로 입력해주세요.');
  const sourceRef=kind==='cancel'?doc(db,name,selection.cancelOf||'__missing__'):null;
  if (kind==='cancel'&&!selection.cancelOf)throw Error('취소할 원본을 선택해주세요.');
  const logRef=doc(db,name,kind==='cancel'?'cancel_v1_'+selection.cancelOf:selection.operationId);
  // The log is the idempotency marker. Each competing request gets its own
  // create-only activity ref; the losing transaction retries and writes none.
  const stockRef=doc(db,spec.stock,stockId),ledgerRef=doc(db,'stockLedger','manual_v1_'+logRef.id),activityRef=doc(collection(db,'activityLogs'));
  const proofRef=name==='supplementLogs'?doc(db,'supplementContractProofs','m_'+logRef.id):null;
  const sourceProofRef=name==='supplementLogs'&&kind==='cancel'?doc(db,'supplementContractProofs','m_'+selection.cancelOf):null;
  const targets=[stockRef,logRef,ledgerRef,activityRef];
  if(proofRef)targets.push(proofRef);
  const correctionRefs=kind==='cancel'?(await getDocsFromServer(query(collection(db,'statsCorrections'),where('source','==',name+'/'+selection.cancelOf)))).docs.map(d=>d.ref):[];
  const scheduleRef=scheduleChange?doc(db,'schedules',scheduleChange.id):null;
  if(scheduleRef)targets.push(scheduleRef);
  const assertCurrent=()=>{if(command?.isCurrent&&!command.isCurrent())throw Error('화면이나 로그인 상태가 변경됐습니다.');};
  assertCurrent();
  // A successful read-only SDK transaction still commits verify writes. The
  // immutable supplement proof/log must instead abort after validated replay.
  const verifiedReplay=new Error('verified supplement replay');
  let replayResult;
  const validateReplay=(existing,proof)=>{
      if(!existing.exists())throw Error('기존 저장 기록이 없습니다.');
      const m=existing.data().manualMovement;
      const saved=existing.data();
      if(name==='supplementLogs' && (saved.movementSchemaVersion!==3 || saved.uid!==uid
        || (saved.delta??saved.qty)!==saved.qty
        || !Number.isSafeInteger(saved.qty)||!Number.isSafeInteger(saved.before)||!Number.isSafeInteger(saved.after)
        || saved.before<0||saved.after<0||saved.before+saved.qty!==saved.after
        || saved.qty!==(m?.kind==='test'?0:m?.enteredAmount)))throw Error('기존 영양제 저장 근거가 새 수량 계약과 일치하지 않습니다. 관리자에게 문의해주세요.');
      if(name==='supplementLogs'&&!supplementProofMatches(proof,logRef.id,saved))throw Error('기존 영양제 저장의 신뢰된 증거가 없습니다. 검증된 이전 절차가 필요합니다.');
      if(name==='supplementLogs'&&(saved.date!==log.date
        ||(saved.type??null)!==(kind==='test'?'manualTest':log.type??null)
        ||(saved.note??null)!==(log.note??null)
        ||(saved.staff||saved.staffName||'')!==(log.staff||log.staffName||'')
        ||m?.enteredAmount!==entered
        ||kind!=='cancel'&&(m?.scheduleId??null)!==(scheduleChange?.id??null)))throw Error('저장 요청 식별자가 충돌했습니다.');
      const cancelTolerance=Number.EPSILON*8*Math.max(1,Math.abs(entered),Math.abs(m?.enteredAmount||0));
      if(m?.kind!==kind||spec.keys.some(k=>(saved[k]??null)!==(log[k]??null))
        ||kind==='cancel'&&(m.cancelOf!==selection.cancelOf||m.reason!==reason||saved.date!==log.date
          ||(saved.type??null)!==(log.type??null)||(saved.note??null)!==(log.note??null)
          ||(saved.staff||saved.staffName||'')!==(log.staff||log.staffName||'')
          ||(saved.uid??null)!==(uid??null)||!Number.isFinite(m.enteredAmount)
          ||Math.abs(m.enteredAmount-entered)>cancelTolerance)
        ||kind!=='cancel'&&(m.operationId!==selection.operationId||m.enteredAmount!==entered||m.reason!==reason||saved.date!==log.date))throw Error('저장 요청 식별자가 충돌했습니다.');
      return {alreadySaved:true,id:logRef.id};
  };
  const commit=async tx=>{
    assertCurrent();
    const [existing,stock,closing,source,schedule,quantityCorrection,correctionSnaps,proof,sourceProof]=await Promise.all([tx.get(logRef),tx.get(stockRef),tx.get(doc(db,'closings',log.date)),sourceRef?tx.get(sourceRef):null,scheduleRef?tx.get(scheduleRef):null,
      kind==='cancel'&&name==='meatLogs'?tx.get(doc(db,'meatLogs','incomingQuantity_v1_'+selection.cancelOf)):null,Promise.all(correctionRefs.map(r=>tx.get(r))),proofRef?tx.get(proofRef):null,sourceProofRef?tx.get(sourceProofRef):null]);
    if(extraWrites && existing.exists())throw Error('입고 기록 ID가 이미 존재합니다. 신청 입고 상태를 확인해주세요.');
    if(existing.exists()){
      const result=validateReplay(existing,proof);
      if(name==='supplementLogs'){replayResult=result;throw verifiedReplay;}
      return result;
    }
    if(proof?.exists())throw Error('영양제 저장 증거 ID가 이미 사용됐습니다. 관리자에게 문의해주세요.');
    if(closing.exists()&&closing.data().status==='closed')throw Error('마감된 날짜에는 입력할 수 없습니다.');
    if(scheduleRef&&(!schedule.exists()||schedule.data().status!=='scheduled'
      ||Object.entries(scheduleChange.expected).some(([k,v])=>(schedule.data()[k]??null)!==(v??null))))throw Error('입고예정이 이미 완료됐거나 변경됐습니다. 새로고침해주세요.');
    if(!stock.exists()&&!stockData)throw Error('재고 원본이 없습니다.');
    if(name==='supplementLogs' && !stock.exists())throw Error('영양제 초기 재고는 레시피·SKU 등록 절차에서 생성해주세요.');
    const current=stock.exists()?stock.data():stockData,before=stock.exists()?current[spec.field]:0;
    if(name==='supplementLogs' && (!Number.isSafeInteger(before)||before<0))throw Error('영양제 재고 수량이 비정상입니다.');
    if(name==='meatLogs'&&['meatTypeId','stage'].some(k=>current[k]!==log[k]))throw Error('원료 품목·단계가 재고 원본과 다릅니다.');
    if(!Number.isFinite(before)||expectedBefore!==undefined&&before!==expectedBefore)throw Error('재고가 변경됐습니다. 새로고침 후 다시 입력해주세요.');
    let delta=kind==='test'?0:entered,originalKind=null,sourceScheduleId=null;
    if(kind==='cancel'){
      const corrections=correctionSnaps.filter(s=>s.exists()).map(s=>({...s.data(),id:s.id})),replaced=new Set(corrections.map(c=>c.supersedes).filter(Boolean));
      if(quantityCorrection?.exists()||corrections.some(c=>!replaced.has(c.id)))throw Error('이미 통계 정정·검토 중인 원본은 이 화면에서 다시 취소할 수 없습니다.');
      const row=source?.exists()?source.data():null;
      if(name==='supplementLogs' && (row?.movementSchemaVersion!==3 || row?.manualMovement?.version!==1
        || (row?.delta??row?.qty)!==row?.qty
        || !['receipt','usage','reconciliation'].includes(row?.manualMovement?.kind)))throw Error('과거 영양제 기록은 검증된 이전 절차 후 취소할 수 있습니다. 관리자에게 문의해주세요.');
      if(name==='supplementLogs'&&!supplementProofMatches(sourceProof,selection.cancelOf,row))throw Error('취소할 영양제 원본의 신뢰된 증거가 없습니다. 검증된 이전 절차가 필요합니다.');
      if(!cancellableMovement(row)||spec.keys.some(k=>(row[k]??null)!==(log[k]??null)))throw Error('같은 품목·재고의 취소 가능한 원본을 선택해주세요.');
      if(!row.date||row.date>log.date)throw Error('취소일은 원본 기록일보다 빠를 수 없습니다.');
      delta=-movementAmount(row);originalKind=originalMovementKind(row);
      sourceScheduleId=row.manualMovement?.scheduleId||null;
      // Some old meat lots have fractional grams after recipe conversion.
      // Computing (remaining + inverse) - remaining can lose a few ULPs.
      const roundingTolerance=Number.EPSILON*8*Math.max(1,Math.abs(before),Math.abs(before+delta),Math.abs(delta));
      if(Math.abs(entered-delta)>roundingTolerance)throw Error('취소 수량은 원본의 반대 수량이어야 합니다.');
    }
    const after=before+delta;
    if(name==='supplementLogs' && (!Number.isSafeInteger(delta)||!Number.isSafeInteger(after)))throw Error('영양제 이동 수량이 안전한 정수 범위를 벗어났습니다.');
    if(!Number.isFinite(after)||after<0)throw Error('처리 후 재고가 음수입니다. 이미 사용한 입고는 전량 취소할 수 없습니다.');
    const metadata={version:1,kind,reason,enteredAmount:kind==='cancel'?delta:entered,operationId:selection.operationId,
      cancelOf:kind==='cancel'?selection.cancelOf:null,originalKind,changesStock:kind!=='test',scheduleId:scheduleChange?.id||sourceScheduleId};
    const value={...log,reason:kind==='cancel'?`${reason} · 취소 원본: ${name}/${selection.cancelOf}`:reason,
      // Preserve the existing raw-receipt follow-up contract. Test records must
      // never enter the real-time adjustment enrichment handler.
      type:kind==='test'?'manualTest':kind==='receipt'&&name==='meatLogs'?'frozenIncoming':log.type,
      [name==='meatLogs'?'delta':'qty']:delta,before,after,manualMovement:metadata,uid,
      timestamp:serverTimestamp(),ledgerId:ledgerRef.id};
    if(name==='supplementLogs'){
      value.movementSchemaVersion=3;
      // Preserve an optional amount alias only as the actual stock movement;
      // test input remains in manualMovement.enteredAmount while qty is zero.
      if(Object.prototype.hasOwnProperty.call(log,'delta'))value.delta=delta;
    }
    if(name==='meatLogs'&&kind==='test'&&!stock.exists())value.meatStockId=null;
    assertCurrent();
    // Invoke before the first write so the callback can read its request guard.
    if(extraWrites){await extraWrites(tx);assertCurrent();}
    if(kind!=='test'||name==='supplementLogs'){
      const patch={[spec.field]:after,updatedAt:serverTimestamp(),...(spec.field==='remaining'?{closed:after<=0}:{})};
      if(name==='supplementLogs')patch.lastMovementId=logRef.id;
      if(stock.exists())tx.update(stockRef,patch);else tx.set(stockRef,{...stockData,...patch});
    }
    tx.set(logRef,value);
    if(proofRef)tx.set(proofRef,{kind:'manual',version:1,logId:logRef.id,supplementTypeId:stockId,
      qty:delta,before,after,uid,timestamp:serverTimestamp()});
    tx.set(ledgerRef,{actionType:scheduleRef?'scheduleComplete':'manualMovement',actionId:scheduleChange?.id||logRef.id,date:log.date,status:'active',timestamp:serverTimestamp(),
      items:kind==='test'?[]:[{collection:spec.stock,docId:stockId,field:spec.field,delta,before,after,sourceCollection:name,sourceLogId:logRef.id,
        ...(name==='bagLogs'?{bagLogId:logRef.id}:name==='eggLogs'?{eggLogId:logRef.id}:{}),...(!stock.exists()?{isNewDoc:true}:{})}]});
    if(scheduleRef&&kind!=='test')tx.update(scheduleRef,{...scheduleChange.patch,ledgerId:ledgerRef.id,completedAt:serverTimestamp(),updatedAt:serverTimestamp()});
    tx.set(activityRef,{action:activity?.action||({supplementLogs:'supplementStock',meatLogs:'meat',bagLogs:'bag',eggLogs:'egg',breadPanLogs:'breadPan',frozenPanLogs:'frozenPan'}[name]),
      subAction:name==='supplementLogs'?(kind==='receipt'?'incoming':'manualAdjust'):name==='eggLogs'?(kind==='receipt'?'in':kind==='usage'?'out':'adjust'):kind==='receipt'?'incoming':'adjust',date:log.date,staff:log.staff||log.staffName,uid,
      message:`${MOVEMENT_LABELS[kind]} — ${log.meatNameSnapshot||log.bagNameSnapshot||(name==='supplementLogs'&&supplementName)||(name==='supplementLogs'?'영양제 품목명 확인 필요':log.productName)||(name==='eggLogs'?'계란':'품목명 확인 필요')} ${quantityText(name==='meatLogs'?entered/1000:entered)}${stockUnit(name)}${kind==='test'?' (재고 변동 없음)':''} / ${reason}${kind==='cancel'?' / 취소 대상: 이전 입출고 기록':''}`,
      ...(activity?{subAction:activity.subAction,message:activity.message}:{}),
      details:{...activity?.details,app:'production',sourceCollection:name,sourceLogId:logRef.id,manualMovement:metadata,delta,before,after},
      read:false,acknowledged:false,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null,timestamp:serverTimestamp()});
    return {id:logRef.id,delta,before,after};
  };
  try {
    return await (command?command.transaction(db,commit,{targets}):runTransaction(db,commit));
  } catch(error) {
    // readCommand unwraps callback exceptions; accept its direct cause form too.
    // Identity is private to this invocation, so message/code cannot spoof it.
    if(replayResult&&(error===verifiedReplay||error?.cause===verifiedReplay))return replayResult;
    // A competing immutable create can be denied before the SDK retries the
    // callback. Reconcile only an exact, trusted saved request using server
    // reads; never resend a write or turn an unreadable/mismatched result green.
    if(!extraWrites&&name==='supplementLogs'&&permissionDenied(error)){
      try {
        const [existing,proof]=await Promise.all([getDocFromServer(logRef),getDocFromServer(proofRef)]);
        const result=validateReplay(existing,proof);
        assertCurrent();
        return result;
      } catch { /* Preserve the original failed transaction, including cause. */ }
    }
    throw error;
  }
}
