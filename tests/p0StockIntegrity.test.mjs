import test from 'node:test';
import assert from 'node:assert/strict';
import {cases,setupCase,runCase,verifyCase} from './helpers/p0StockCases.mjs';

test('same button receives a new operation after success, but retains ID after failure or lost response',async()=>{
 const spec=cases.find(s=>s.name==='tender receipt'),e=await setupCase(spec);
 try{
  const service=await e.load('src/services/atomicStockOperation.js');
  const button=e.document.querySelector(spec.button);
  const invoke=()=>service.atomicStockOperation({db:{},operationId:service.stockOperationId({},button),actionType:'id-test',date:e.today,request:{qty:1},build:async()=>{}});
  await invoke();assert.equal(button.dataset.operationId,undefined);
  const first=e.state.rows.stockLedger[0].operationId;
  await invoke();assert.equal(e.state.rows.stockLedger.length,2);assert.notEqual(e.state.rows.stockLedger[1].operationId,first);
  for(const failure of ['before','after']){
   const id=service.stockOperationId({},button),before=e.state.rows.stockLedger.length;
   e.state.failNextCommit=failure;await assert.rejects(invoke());assert.equal(button.dataset.operationId,id);
   await invoke();assert.equal(button.dataset.operationId,undefined);assert.equal(e.state.rows.stockLedger.length,before+1);
   assert.equal(e.state.rows.stockLedger.filter(l=>l.operationId===id).length,1);
  }
 }finally{await e.cleanup();}
});

test('zero-remaining open processed lot does not falsely block repacking',async()=>{
 const spec=cases.find(s=>s.name==='meat repack'),e=await setupCase(spec);
 try{
  e.state.rows.meatStocks.push({id:'empty',stage:'processed',meatTypeId:'m1',remaining:0,closed:false});
  await runCase(e,spec);verifyCase(e,spec);
 }finally{await e.cleanup();}
});

test('shortage shows one alert and makes no writes',async()=>{
 const spec=cases.find(s=>s.name==='separation out'),e=await setupCase({...spec,seed(e){spec.seed(e);e.state.rows.frozenSeparation[0].remaining=1;}});
 try{
  await runCase(e,spec);assert.equal(e.state.commits.length,0);assert.equal(e.alerts.length,1);assert.match(e.alerts[0],/부족/);
 }finally{await e.cleanup();}
});

for(const spec of cases){
 test(`${spec.name}: one atomic commit and SDK callback retry`,async()=>{
  const e=await setupCase(spec,{retryTransactionCallbackOnce:true});try{await runCase(e,spec);verifyCase(e,spec);}finally{await e.cleanup();}
 });
 test(`${spec.name}: staged failure leaves all collections unchanged`,async()=>{
  const e=await setupCase(spec);try{
   const before=JSON.stringify(e.state.rows),original=e.api.runTransaction;
   // Fail after the calculation has staged every write, before publication.
   e.cache.get('firebase/firestore').setExport('runTransaction',async(db,callback)=>original(db,async tx=>{await callback(tx);throw Error('injected failure after staged writes');}));
   await runCase(e,spec);assert.equal(JSON.stringify(e.state.rows),before);assert.equal(e.state.commits.length,0);
  }finally{await e.cleanup();}
 });
 test(`${spec.name}: same operationId replay changes no quantity or log`,async()=>{
  const e=await setupCase(spec);try{
   const {atomicStockOperation}=await e.load('src/services/atomicStockOperation.js');
   await runCase(e,spec);verifyCase(e,spec);const ledger=e.state.rows.stockLedger[0],before=JSON.stringify(e.state.rows);
   const request=JSON.parse(ledger.requestFingerprint);
   const result=await atomicStockOperation({db:{},operationId:ledger.operationId,actionType:request.actionType,date:request.date,request:request.request,
    build:async()=>{throw Error('replay must never calculate or write');}});
   assert.equal(result.alreadyCompleted,true);assert.equal(JSON.stringify(e.state.rows),before);
   await assert.rejects(atomicStockOperation({db:{},operationId:ledger.operationId,actionType:request.actionType,date:request.date,request:{changed:true},build:async()=>{}}),/요청 내용/);
  }finally{await e.cleanup();}
 });
}

test('order confirm checks pending state inside transaction and cannot deduct an already confirmed row without a ledger',async()=>{
 const spec=cases.find(s=>s.name==='frozen order'),e=await setupCase(spec);try{
  const original=e.api.runTransaction;
  e.cache.get('firebase/firestore').setExport('runTransaction',(_,callback)=>{e.state.rows.frozenPanStock[0].status='confirmed';return original({},callback);});
  await runCase(e,spec);assert.equal(e.state.rows.frozenPanLots[0].remaining,10);assert.equal(e.state.commits.length,0);assert.match(e.alerts.at(-1),/상태가 변경/);
 }finally{await e.cleanup();}
});
test('existing order cancellation returns to pending and can be confirmed in a new operation cycle',async()=>{
 const spec=cases.find(s=>s.name==='frozen order'),e=await setupCase(spec,{instrument:'\nexport {showTenderInModal,showWorkRowModal,confirmOrder,cancelOrder};'});try{
  await runCase(e,spec);const first=e.state.rows.stockLedger[0].id;
  await e.page.cancelOrder(structuredClone(e.state.rows.frozenPanStock[0]),structuredClone(e.state.rows.frozenPanLots),'검증 담당자','입력 정정');
  assert.equal(e.state.rows.frozenPanStock[0].status,'pending');assert.equal(e.state.rows.frozenPanLots[0].remaining,10);
  await runCase(e,spec);assert.equal(e.state.rows.frozenPanLots[0].remaining,4);
  assert.equal(e.state.rows.stockLedger.length,2);assert.notEqual(e.state.rows.frozenPanStock[0].ledgerId,first);
  assert.equal(e.state.rows.stockLedger.find(l=>l.id===first).status,'rolledBack');
 }finally{await e.cleanup();}
});
