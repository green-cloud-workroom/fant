// Bounded repair: only equal-quantity receipts for one production with an
// untouched duplicate lot can be resolved without reconstructing shipments.
const completed=row=>['completed','입고완료'].includes(row.status);
const version=s=>s.updateTime ? `${s.updateTime.seconds}:${s.updateTime.nanoseconds}` : null;
const boxes=row=>row.actualBoxes??row.boxes;
const packs=row=>row.actualRemainderPacks??row.remainderPacks??0;
const lotIds=row=>[row.createdStockLotId,row.createdSampleStockLotId].filter(Boolean);
const key=(sourceId,duplicateId)=>`receipt-duplicate-v1-${sourceId}-${duplicateId.split(':').at(-1)}`;

export async function inspectDuplicateReceipt(db,sourceId,duplicateId,reader=db){
 const read=ref=>reader.get?reader.get(ref):ref.get();
 const production=await read(db.doc('productions/'+sourceId));
 const history=await read(db.collection('productTransferRequests').where('sourceId','==',sourceId));
 const requests=history.docs.filter(s=>s.data().sourceApp==='production'&&s.data().sourceCollection==='productions');
 const rows=requests.map(s=>({id:s.id,...s.data()}));
 const done=rows.filter(completed),duplicate=done.find(r=>r.id===duplicateId),keeper=done.find(r=>r.id!==duplicateId);
 if(!production.exists||done.length!==2||!duplicate||!keeper)throw Error('Expected exactly two completed receipts for this production.');
 const p=production.data();
 if(p.category!=='raw'||p.status==='deleted'||[duplicate,keeper].some(r=>r.category!=='raw'||r.recipeId!==p.recipeId||r.target!==p.target||r.producedDate!==p.date||!Number.isSafeInteger(r.revision)||r.id!==`productions:${sourceId}:${r.revision}`))throw Error('Receipt source metadata is inconsistent.');
 if(p.receivedRevision!==Math.max(...rows.map(r=>r.revision||0))||duplicate.receiptMode==='adjustment'||keeper.receiptMode==='adjustment')throw Error('Receipt head or adjustment history changed.');
 if(!Number.isFinite(boxes(duplicate))||boxes(duplicate)!==boxes(keeper)||packs(duplicate)!==packs(keeper)||boxes(keeper)!==p.receivedBox||packs(keeper)!==(p.receivedRemainder??0))throw Error('Quantities need manual ledger reconciliation.');
 const duplicateLots=lotIds(duplicate),keptLots=lotIds(keeper);
 if(!duplicateLots.length||!keptLots.length||duplicateLots.some(id=>keptLots.includes(id)))throw Error('Missing or shared receipt lots.');
 const snapshots=[production,...requests],queries=[{path:'productTransferRequests',sourceId,ids:history.docs.map(s=>s.id).sort()}],lots=[];
 const keptProducts=new Map();
 for(const id of [...new Set([...duplicateLots,...keptLots])]){
  const snapshot=await read(db.doc('stockLots/'+id));
  if(!snapshot.exists)throw Error('Missing receipt lot requires manual audit.');
  snapshots.push(snapshot);
  const movements=await read(db.collection('stockMovements').where('stockLotId','==',id));
  snapshots.push(...movements.docs);queries.push({path:'stockMovements',stockLotId:id,ids:movements.docs.map(s=>s.id).sort()});
  const data=snapshot.data();
  if(!duplicateLots.includes(id)){keptProducts.set(data.unit,data.productId);continue;}
  const inbound=movements.docs[0]?.data();
  const expected=id===duplicate.createdStockLotId?boxes(duplicate):packs(duplicate);
  const expectedUnit=id===duplicate.createdStockLotId?'box':'pack';
  if(data.category!=='raw'||data.unit!==expectedUnit||!data.productId||!Number.isFinite(data.totalQty)||data.totalQty<=0||data.totalQty!==data.initialQty||data.totalQty!==expected||data.reservedQty!==0||data.availableQty!==data.totalQty||movements.size!==1||inbound?.type!=='inbound'||inbound.qty!==data.totalQty||inbound.refId!==duplicate.id)throw Error('Duplicate lot is not untouched and unreserved; manual audit required.');
  lots.push({id,data});
 }
 if(lots.some(l=>keptProducts.get(l.data.unit)!==l.data.productId))throw Error('Receipt lots refer to different inventory products.');
 return {sourceId,duplicateId,keeperId:keeper.id,resolutionId:key(sourceId,duplicateId),lots,observations:snapshots.map(s=>({path:s.ref.path,version:version(s),data:s.data()})),queries};
}

export async function applyDuplicateReceiptResolution(db,plan,serverTimestamp){
 return db.runTransaction(async tx=>{
  const auditRef=db.doc('activityLogs/'+plan.resolutionId),audit=await tx.get(auditRef);
  if(audit.exists){
   if(audit.data().details?.duplicateId!==plan.duplicateId||audit.data().details?.sourceId!==plan.sourceId)throw Error('Conflicting resolution identifier.');
   return {alreadyApplied:true,resolutionId:plan.resolutionId};
  }
  const fresh=await inspectDuplicateReceipt(db,plan.sourceId,plan.duplicateId,tx);
  if(plan.resolutionId!==fresh.resolutionId||plan.keeperId!==fresh.keeperId)throw Error('Resolution identity changed.');
  const signature=p=>JSON.stringify({documents:p.observations.map(s=>({path:s.path,version:s.version})).sort((a,b)=>a.path.localeCompare(b.path)),queries:p.queries});
  if(signature(fresh)!==signature(plan))throw Error('Receipt, stock or ledger changed after preparation; no repair applied.');
  const stamp=serverTimestamp();
  for(const lot of fresh.lots){
   tx.update(db.doc('stockLots/'+lot.id),{totalQty:0,availableQty:0,reservedQty:0,status:'소진',updatedAt:stamp});
   const id=plan.resolutionId+'-'+lot.id;
   tx.create(db.doc('stockMovements/'+id),{id,stockLotId:lot.id,productId:lot.data.productId,type:'adjust',qty:-lot.data.totalQty,unit:lot.data.unit,beforeQty:lot.data.totalQty,afterQty:0,refType:'frozen_set_receipt',refId:plan.duplicateId,performedBy:'관리자(중복 입고 정리)',performedAt:stamp,createdAt:stamp,memo:'동일 생산·동일 수량의 미사용 중복 입고 취소',resolutionId:plan.resolutionId});
  }
  tx.update(db.doc('productTransferRequests/'+plan.duplicateId),{status:'rejected',rejectReason:'동일 생산·동일 수량 미사용 중복 입고 정리',duplicateOf:plan.keeperId,resolvedAt:stamp,resolutionId:plan.resolutionId});
  tx.create(auditRef,{action:'productReceipt',subAction:'duplicateResolution',date:new Date(Date.now()+9*3600000).toISOString().slice(0,10),staff:'관리자(중복 입고 정리)',uid:null,timestamp:stamp,message:'미사용 중복 입고 정리',details:{app:'inventory',sourceId:plan.sourceId,duplicateId:plan.duplicateId,keeperId:plan.keeperId,stockDelta:fresh.lots.map(l=>({lotId:l.id,unit:l.data.unit,qty:-l.data.totalQty}))},read:false,acknowledged:false,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null});
  return {alreadyApplied:false,resolutionId:plan.resolutionId,sourceId:plan.sourceId,stockDelta:fresh.lots.map(l=>({lotId:l.id,qty:-l.data.totalQty,unit:l.data.unit}))};
 });
}
