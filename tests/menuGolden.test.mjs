import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

const baselineRef='61af19a2d1e48f81877ab2f28fbe07774ebeca84';
const title='고양이 검증 큐브';
const fill=(e,values)=>Object.entries(values).forEach(([id,value])=>e.fill('#'+id,value));
const scenarios=[
 {route:'production',name:'create, change SKU and delete with net zero supplement deduction',exports:'showProductionForm',render:'renderProduction',collections:['productions','supplementStock','supplementLogs','activityLogs'],async run(e){
  await e.page.showProductionForm(null);fill(e,{pf_recipe:'r1'});await e.fire('#pf_recipe','change');fill(e,{pf_qty_select:1});await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
  assert.equal(e.state.rows.productions.length,1,e.alerts.join('\n'));
  assert.equal(e.state.rows.supplementStock[0].currentQty,19);
  const production=e.state.rows.productions[0];await e.page.showProductionForm(production);fill(e,{pf_qty_select:2});await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
  assert.equal(e.state.rows.supplementStock[0].currentQty,20);assert.equal(e.state.rows.supplementStock[1].currentQty,19);
  await e.fire('.card-del');assert.equal(e.state.rows.productions[0].status,'deleted');
  assert.equal(e.state.rows.supplementStock[1].currentQty,20);
 }},
 {route:'frozenPan',name:'bread incoming',movement:{stock:'breadPanLots',logs:'breadPanLogs',kind:'receipt',before:0,after:4.5,delta:4.5},exports:'showBreadPanIncomingModal',render:'renderFrozenPan',collections:['breadPanLots','breadPanLogs'],async run(e){
  e.page.showBreadPanIncomingModal();fill(e,{m_recipe:title,m_qty:4.5,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveBreadPanIncoming');
 }},
 {route:'frozenPan',name:'FIFO order confirmation',exports:'confirmOrder',render:'renderFrozenPan',collections:['frozenPanLots','frozenPanStock','stockLedger','activityLogs'],async run(e){
  await e.page.confirmOrder(structuredClone(e.state.rows.frozenPanStock[0]),structuredClone(e.state.rows.frozenPanLots),'검증 담당자');
 }},
 {route:'frozenProduct',name:'receipt and bag deduction / transfer request',exports:'showIncomingModal',render:'renderFrozenProduct',collections:['bagTypes','bagLogs','frozenLogs','stockLedger','productTransferRequests','activityLogs'],async run(e){
  await e.page.showIncomingModal(e.state.rows.frozenProducts[0]);fill(e,{m_qty:4,m_date:e.today,m_expiry:'2027-09-14',m_staff:'검증 담당자'});await e.fire('#btnSaveIncoming');
 }},
 {route:'meat',name:'raw meat incoming',movement:{stock:'meatStocks',logs:'meatLogs',kind:'receipt',before:0,after:2000,delta:2000},exports:'showAddFrozenModal',render:'renderMeat',collections:['meatStocks','meatLogs','activityLogs'],async run(e){
  e.page.showAddFrozenModal();fill(e,{m_meatType:'m1',m_weight:2,m_unit:'kg',m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveFrozen');
 }},
 {route:'meat',name:'manual remaining adjustment',movement:{stock:'meatStocks',logs:'meatLogs',kind:'reconciliation',before:10000,after:9000,delta:-1000},exports:'showAdjustModal',render:'renderMeat',collections:['meatStocks','meatLogs','activityLogs'],async run(e){
  e.page.showAdjustModal('ms1','닭',10000);
  if(e.document.querySelector('#movement_kind')){e.fill('#movement_kind','reconciliation');await e.fire('#movement_kind','change');}
  fill(e,{m_actualRemaining:9000,m_adjustReason:'검증 사유',m_staff:'검증 담당자'});await e.fire('#btnSaveAdjust');
 }},
 {route:'meat',name:'processed meat FIFO and repacking',exports:'showAddProcessedModal,showAddRepackedModal',render:'renderMeat',collections:['meatStocks','meatLogs','activityLogs'],async run(e){
  e.page.showAddProcessedModal();fill(e,{m_meatType:'m1',m_unitWeight:1000,m_count:3,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveProcessed');
  await e.page.renderMeat();await new Promise(r=>setTimeout(r,0));
  e.page.showAddRepackedModal();fill(e,{m_meatType:'m1',m_unitWeight:500,m_count:4,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveRepacked');
  assert.equal(e.state.rows.meatStocks.find(s=>s.id==='ms1').remaining,7000);
  assert.equal(e.state.rows.meatStocks.find(s=>s.stage==='processed').remaining,1000);
  assert.equal(e.state.rows.meatStocks.find(s=>s.stage==='repacked').remaining,2000);
 }},
 {route:'frozenSep',name:'fractional separation',exports:'showSeparateModal',render:'renderFrozenSep',collections:['frozenSeparation','frozenSeparationLogs','activityLogs'],seed(e){e.state.rows.frozenSeparation=[{id:'sep1',date:e.today,productName:title,stockType:'notSeparated',remaining:4,initialQty:4,closed:false}];},async run(e){
  e.page.showSeparateModal(structuredClone(e.state.rows.frozenSeparation));fill(e,{m_product:title,m_qty:0.25,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveSeparate');
 }},
 {route:'frozenSep',name:'fractional outbound',exports:'showOutModal',render:'renderFrozenSep',collections:['frozenSeparation','frozenSeparationLogs','activityLogs'],seed(e){e.state.rows.frozenSeparation=[{id:'sep1',date:e.today,productName:title,stockType:'separated',remaining:4,initialQty:4,closed:false}];},async run(e){
  e.page.showOutModal(structuredClone(e.state.rows.frozenSeparation));fill(e,{m_product:title,m_qty:0.25,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveOut');
 }},
 {route:'freezeOp',name:'cancellation stock restoration',exports:'cancelOrder',render:'renderFreezeOp',collections:['frozenPanLots','freezeOrders'],seed(e){e.state.rows.freezeOrders=[{id:'fo1',date:e.today,status:'active',deductions:[{lotId:'lot1',productName:title,amount:3}],items:[]}];},async run(e){await e.page.cancelOrder(e.state.rows.freezeOrders[0]);}},
];
// Unchanged flows keep exact historical-payload comparison. Classified manual
// movements intentionally added an atomic ledger and audit fields; for these,
// compare historical business quantities and independently verify the new links.
function verifyMovement(e, spec) {
 const log=e.state.rows[spec.logs].at(-1),stockId=log.meatStockId||log.lotId;
 const stock=e.state.rows[spec.stock].find(r=>r.id===stockId);
 assert(stock,'saved log must reference its stock');
 assert.equal(stock.remaining,spec.after);assert.equal(log.delta??log.qty,spec.delta);
 assert.equal(log.before,spec.before);assert.equal(log.after,spec.after);
 assert.equal(log.date,e.today);assert.equal(log.staff||log.staffName,'검증 담당자');
 assert.equal(log.manualMovement.version,1);assert.equal(log.manualMovement.kind,spec.kind);
 assert.equal(log.manualMovement.changesStock,true);assert.equal(log.manualMovement.enteredAmount,spec.delta);
 assert.equal(log.manualMovement.operationId,log.id);
 if(spec.kind==='reconciliation')assert.equal(log.manualMovement.reason,'검증 사유');
 const ledger=e.state.rows.stockLedger.find(r=>r.id===log.ledgerId);
 assert(ledger);assert.equal(ledger.actionId,log.id);assert.equal(ledger.status,'active');assert.equal(ledger.items.length,1);
 const item=ledger.items[0];
 assert.equal(item.collection,spec.stock);assert.equal(item.docId,stock.id);assert.equal(item.field,'remaining');
 assert.equal(item.sourceCollection,spec.logs);assert.equal(item.sourceLogId,log.id);
 assert.equal(item.before,spec.before);assert.equal(item.after,spec.after);assert.equal(item.delta,spec.delta);
 const activity=e.state.rows.activityLogs.at(-1);
 assert.equal(activity.details.sourceLogId,log.id);assert.equal(activity.details.sourceCollection,spec.logs);
 assert.equal(activity.details.before,spec.before);assert.equal(activity.details.after,spec.after);
 assert.equal(activity.acknowledged,false);assert.equal(activity.read,false);
 assert.equal(e.state.commits.length,1,'stock, log, ledger and activity must be committed together');
 assert.equal(e.state.commits[0].length,4);
 if(spec.logs==='meatLogs'){
  assert.equal(log.meatNameSnapshot,'닭');assert.equal(stock.meatNameSnapshot,'닭');
  assert.equal(log.meatTypeId,stock.meatTypeId);assert.equal(log.stage,stock.stage);
  assert.match(activity.message,/닭/);assert.doesNotMatch(activity.message,/계란|undefined/);
 }else assert.equal(stock.productName,title);
}
function verifyProductionContract(e) {
 const production=e.state.rows.productions[0],logs=e.state.rows.supplementLogs;
 assert.equal(e.state.commits.length,3,'new/edit/delete each commits one complete transaction');
 assert.deepEqual(logs.map(row=>[row.supplementTypeId,row.qty,row.before,row.after]),
  [['r1_1',-1,20,19],['r1_1',1,19,20],['r1_2',-1,20,19],['r1_2',1,19,20]]);
 assert.deepEqual(logs.map(row=>row.productionOrderRevision),[1,2,2,3]);
 for(const row of logs){assert.equal(row.movementSchemaVersion,3);assert.equal(row.uid,'fixture');assert.equal(row.relatedProductionId,production.id);}
 for(const [index,commit]of e.state.commits.entries()){
  const anchor=commit.find(op=>op.target.path===`productionOrderDays/${e.today}`);
  const parent=commit.find(op=>op.target.path===`productions/${production.id}`);
  const proof=commit.find(op=>op.target.path===`supplementContractProofs/p_${production.id}`);
  assert(anchor&&parent&&proof,'anchor, parent and protected reservation proof are atomic');
  assert.equal(anchor.data.revision,index+1);assert.equal(parent.data.orderRevision,index+1);
  assert.equal(proof.data.orderRevision,index+1);assert.equal(proof.data.updatedBy,'fixture');
  assert.equal(proof.data.skuId,['r1_1','r1_2',null][index]);assert.equal(proof.data.quantity,[1,1,0][index]);
  const stockWrites=commit.filter(op=>op.target.path.startsWith('supplementStock/'));
  const logWrites=commit.filter(op=>op.target.path.startsWith('supplementLogs/'));
  assert.equal(stockWrites.length,[1,2,1][index]);assert.equal(logWrites.length,stockWrites.length);
  for(const stock of stockWrites){
   const log=logWrites.find(op=>op.target.id===stock.data.lastMovementId);
   assert(log,'stock points to its fresh movement in the same transaction');
   assert.equal(log.data.supplementTypeId,stock.target.id);assert.equal(log.data.after,stock.data.currentQty);
   assert.equal(log.data.before+log.data.qty,log.data.after);
  }
 }
 const proof=e.state.rows.supplementContractProofs.find(row=>row.id==='p_'+production.id);
 assert.deepEqual(production.supplementReservation,{version:1,skuId:null,quantity:0});
 assert.equal(production.supplementMovement.refundLogId,logs[3].id);assert.equal(production.supplementMovement.deductLogId,null);
 assert.equal(proof.skuId,null);assert.equal(proof.quantity,0);assert.equal(proof.orderRevision,3);
 assert.equal(e.state.rows.productionOrderDays[0].revision,3);
 for(const stock of e.state.rows.supplementStock){
  const last=logs.filter(row=>row.supplementTypeId===stock.id).at(-1);
  assert.equal(stock.lastMovementId,last.id);assert.equal(stock.currentQty,last.after);
 }
}
function verifyFrozenReceiptLinks(e) {
 const receipt=e.state.rows.frozenLogs[0],bag=e.state.rows.bagLogs[0],ledger=e.state.rows.stockLedger[0];
 const request=e.state.rows.productTransferRequests[0],activity=e.state.rows.activityLogs[0];
 assert.equal(receipt.ledgerId,ledger.id);assert.equal(ledger.actionId,receipt.id);
 assert.equal(ledger.items.length,1);assert.equal(ledger.items[0].bagLogId,bag.id);
 assert.equal(ledger.items[0].docId,'b1');assert.equal(ledger.items[0].before,100);assert.equal(ledger.items[0].after,96);
 assert.equal(bag.qty,-4);assert.equal(receipt.qty,4);assert.equal(request.quantity,receipt.qty);
 assert.equal(request.id,`frozenLogs:${receipt.id}:1`);assert.equal(request.idempotencyKey,request.id);
 assert.equal(request.sourceId,receipt.id);assert.equal(activity.details.frozenLogId,receipt.id);
 assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,6);
}
// Generated IDs may be allocated in another order after an atomic service is
// introduced. Rename every generated ID and every occurrence of its references
// consistently; never erase IDs or cross-links from the golden payload.
function alphaRenameGeneratedIds(payload) {
 const ids=new Map();
 for(const [collection,rows]of Object.entries(payload))for(const [index,row]of rows.entries()){
  if(/^fixture-\d+$/.test(row.id)){
   assert(!ids.has(row.id),'one generated document ID cannot identify two documents');
   ids.set(row.id,`generated:${collection}:${index}`);
  }
 }
 const visit=value=>typeof value==='string'?value.replace(/fixture-\d+/g,id=>ids.get(id)||id)
  :Array.isArray(value)?value.map(visit):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,visit(item)])):value;
 return visit(payload);
}
const businessMovement=(e,spec)=>{
 const log=e.state.rows[spec.logs].at(-1),stock=e.state.rows[spec.stock].find(r=>r.id===(log.meatStockId||log.lotId));
 return {date:log.date,type:log.type,amount:log.delta??log.qty,before:log.before,after:log.after,
  stockRemaining:stock.remaining,meatTypeId:log.meatTypeId??null,stage:log.stage??null,productName:log.productName??null};
};
test('generated-ID alpha equivalence retains exact cross-links and idempotency keys',()=>{
 const left={bagLogs:[{id:'fixture-1',qty:-4}],frozenLogs:[{id:'fixture-2',qty:4,ledgerId:'fixture-3'}],
  stockLedger:[{id:'fixture-3',actionId:'fixture-2',items:[{bagLogId:'fixture-1'}]}],
  productTransferRequests:[{id:'frozenLogs:fixture-2:1',idempotencyKey:'frozenLogs:fixture-2:1',sourceId:'fixture-2',quantity:4}]};
 const right={bagLogs:[{id:'fixture-3',qty:-4}],frozenLogs:[{id:'fixture-1',qty:4,ledgerId:'fixture-4'}],
  stockLedger:[{id:'fixture-4',actionId:'fixture-1',items:[{bagLogId:'fixture-3'}]}],
  productTransferRequests:[{id:'frozenLogs:fixture-1:1',idempotencyKey:'frozenLogs:fixture-1:1',sourceId:'fixture-1',quantity:4}]};
 assert.deepEqual(alphaRenameGeneratedIds(right),alphaRenameGeneratedIds(left));
 for(const mutate of [
  row=>{row.stockLedger[0].items[0].bagLogId='fixture-1';},
  row=>{row.frozenLogs[0].ledgerId='fixture-3';},
  row=>{row.productTransferRequests[0].sourceId='fixture-3';},
  row=>{row.productTransferRequests[0].idempotencyKey='frozenLogs:fixture-1:2';},
  row=>{row.productTransferRequests[0].quantity=5;},
 ]){const broken=structuredClone(right);mutate(broken);assert.notDeepEqual(alphaRenameGeneratedIds(broken),alphaRenameGeneratedIds(left));}
 assert.throws(()=>alphaRenameGeneratedIds({a:[{id:'fixture-1'}],b:[{id:'fixture-1'}]}),/two documents/);
});
for(const scenario of scenarios)test(`${scenario.route}: ${scenario.name} ${scenario.movement?'preserves business values and atomic movement links':'matches the historical business payload'}`,async()=>{
 const results=[];
 for(const baseline of [true,false]){
  const e=await pageEnvironment(scenario.route,{baselineRef:baseline?baselineRef:undefined,instrument:`\nexport {${scenario.exports}};`});
  try{
   scenario.seed?.(e);await e.page[scenario.render]();await new Promise(r=>setTimeout(r,0));
   const originalStock=JSON.stringify(e.state.rows.meatStocks?.find(r=>r.id==='ms1'));
   await scenario.run(e);assert.ok(e.state.commits.length>0,e.alerts.join('\n'));
   if(scenario.movement){
    results.push(businessMovement(e,scenario.movement));
    if(!baseline){verifyMovement(e,scenario.movement);
     if(scenario.movement.kind==='receipt')assert.equal(JSON.stringify(e.state.rows.meatStocks?.find(r=>r.id==='ms1')),originalStock);
    }
   }else {
    const payload=JSON.parse(JSON.stringify(Object.fromEntries(scenario.collections.map(c=>[c,e.state.rows[c]||[]]))));
    if(scenario.route==='production'){
     if(!baseline){
      verifyProductionContract(e);
      const tokens=e.state.commits.flat().filter(op=>op.target.path.startsWith('productions/')).map(op=>op.data.mutationToken);
      assert.ok(tokens.length>=3);assert.equal(new Set(tokens).size,tokens.length);
      assert.ok(tokens.every(t=>typeof t==='string'&&t.length>=16&&t.length<=64));
     }
     // New protected reservation/ordering metadata is checked above, while all
     // historical production/stock/log business values retain exact comparison.
     payload.productions.forEach(row=>{for(const key of ['mutationToken','orderRevision','supplementReservation','supplementMovement'])delete row[key];});
     payload.supplementStock.forEach(row=>delete row.lastMovementId);
     payload.supplementLogs.forEach(row=>{for(const key of ['movementSchemaVersion','productionOrderRevision','uid'])delete row[key];});
     const deletedRefund=payload.supplementLogs.find(row=>row.reason==='production deleted');
     assert.equal(deletedRefund.staffName,baseline?'system':e.state.rows.productions[0].staffName||'');
     // The new service attributes the release to the original production staff
     // and authenticated UID (asserted above), replacing the old 'system' label.
     deletedRefund.staffName='validated deletion attribution';
    }
    if(scenario.route==='frozenProduct'&&!baseline)verifyFrozenReceiptLinks(e);
    results.push(['production','frozenProduct'].includes(scenario.route)?alphaRenameGeneratedIds(payload):payload);
   }
  }finally{await e.cleanup();}
 }
 assert.deepEqual(results[1],results[0]);
});

test('manual adjustment still blocks missing classification before any inventory write',async()=>{
 const e=await pageEnvironment('meat',{instrument:'\nexport {showAdjustModal};'});
 try{await e.page.renderMeat();e.page.showAdjustModal('ms1','닭',10000);
 fill(e,{m_actualRemaining:9000,m_adjustReason:'검증 사유',m_staff:'검증 담당자'});
 await e.fire('#btnSaveAdjust');assert.match(e.alerts.at(-1),/처리 구분/);
 assert.equal(e.state.writes.length,0);assert.equal(e.state.rows.meatStocks[0].remaining,10000);
 }finally{await e.cleanup();}
});

test('select options expose the browser text property without querying each option',async()=>{
 const e=await pageEnvironment('meat',{instrument:'\nexport {showAddFrozenModal};'});
 try{await e.page.renderMeat();e.page.showAddFrozenModal();e.fill('#m_meatType','m1');
 const select=e.document.querySelector('#m_meatType');assert.equal(select.options[select.selectedIndex].text,'닭');
 assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
