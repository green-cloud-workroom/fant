import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {trustSupplementReservationFixture} from './helpers/supplementReservationFixture.mjs';

async function setup({usesSupplement=true,locked=false}={}) {
  const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});
  e.state.rows.supplementTypes.forEach((sku,index)=>Object.assign(sku,{recipeId:'r1',unit:index+1}));
  e.state.rows.recipes[0].usesSupplement=usesSupplement;
  e.state.rows.productions=[{id:'p1',date:e.today,recipeId:'r1',recipeName:'검증 레시피',
    category:'raw',target:'cat',status:'active',sortOrder:0,round:1,batchNo:null,
    productionUnitQty:1,productionUnitName:'kg',ingredientsSnapshot:[],lockedByCompletion:locked,
    supplementReservation:{version:1,skuId:usesSupplement?'r1_1':null,quantity:usesSupplement?1:0},
    supplementMovement:{version:1,refundLogId:null,deductLogId:usesSupplement?'deduct':null}}];
  e.state.rows.supplementStock[0].currentQty=9;
  e.state.rows.supplementLogs=usesSupplement?[{id:'deduct',date:e.today,type:'autoDeduct',
    supplementTypeId:'r1_1',qty:-1,before:10,after:9,relatedProductionId:'p1'}]:[];
  trustSupplementReservationFixture(e);
  await e.page.renderProduction();
  await e.page.showProductionForm(e.state.rows.productions[0]);
  return e;
}
function beforeTransaction(e,change) {
  const original=e.api.runTransaction;
  e.cache.get('firebase/firestore').setExport('runTransaction',async (...args)=>{change();return original(...args);});
}
test('definitive Rules rejection preserves draft without unknown-outcome lock',async()=>{
  const e=await setup();try{
    e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');
    e.cache.get('firebase/firestore').setExport('runTransaction',async()=>{throw Object.assign(Error('Rules denied'),{code:'permission-denied'});});
    await e.fire('#btnSaveProduction');assert.equal(e.state.commits.length,0);
    assert.equal(e.document.querySelector('#pf_qty_select').value,'2');
    assert.match(e.alerts.at(-1),/서버가 저장을 거부/);assert.doesNotMatch(e.alerts.at(-1),/결과를 확정하지 못/);
    const resource=(await e.load('src/state/pageResources.js')).pageResource('production');assert.equal(resource.blocked,false);
  }finally{await e.cleanup();}
});

test('later definitive transaction rejection retains earlier workflow commit and lock',async()=>{
  const e=await setup();try{
    const {withReadWorkflow}=await e.load('src/services/readCommand.js');
    const resource={observations:[],blocked:false,busy:false,invalidate(){}};
    const original=e.api.runTransaction;let calls=0;
    e.cache.get('firebase/firestore').setExport('runTransaction',(...args)=>{if(++calls===2)throw Object.assign(Error('Rules denied'),{code:'permission-denied'});return original(...args);});
    await assert.rejects(withReadWorkflow(resource,async command=>{
      await command.transaction({},async tx=>{tx.update(e.api.doc({},'productions','p1'),{staffName:'first confirmed'});});
      await command.transaction({},async()=>{});
    }),error=>error.code==='permission-denied');
    assert.equal(e.state.commits.length,1);assert.equal(resource.blocked,true);assert.equal(calls,2);
  }finally{await e.cleanup();}
});

test('a generic publication wrapper throwing permission-denied after a write remains unknown',async()=>{
  const e=await setup();try{
    const {withReadWorkflow}=await e.load('src/services/readCommand.js');const resource={observations:[],blocked:false,busy:false,invalidate(){}};
    await assert.rejects(withReadWorkflow(resource,command=>command.commit({commit:async()=>{
      await e.api.updateDoc(e.api.doc({},'productions','p1'),{staffName:'already written'});
      throw Object.assign(Error('later read denied'),{code:'permission-denied'});
    }})),error=>error.code==='outcome-unknown');
    assert.equal(e.state.commits.length,1);assert.equal(resource.blocked,true);
  }finally{await e.cleanup();}
});
for(const earlier of [false,true])test(`native batch denial is definitive; earlier workflow commit=${earlier}`,async()=>{
  const e=await setup();try{
    const {withReadWorkflow}=await e.load('src/services/readCommand.js');
    const {commandWrites}=await e.load('src/services/commandWrites.js');
    const resource={observations:[],blocked:false,busy:false,invalidate(){}};
    e.cache.get('firebase/firestore').setExport('writeBatch',()=>({update(){return this;},commit:async()=>{throw Object.assign(Error('Rules denied'),{code:'permission-denied'});}}));
    await assert.rejects(withReadWorkflow(resource,async command=>{
      if(earlier)await command.transaction({},async tx=>{tx.update(e.api.doc({},'productions','p1'),{staffName:'first confirmed'});});
      const batch=commandWrites(command).writeBatch({});batch.update(e.api.doc({},'productions','p1'),{round:2});await batch.commit();
    }),error=>error.code==='permission-denied');
    assert.equal(e.state.commits.length,earlier?1:0);assert.equal(resource.blocked,earlier);
  }finally{await e.cleanup();}
});
const stocks=e=>e.state.rows.supplementStock.map(s=>s.currentQty);

for(const [name,change,message] of [
  ['deleted source',e=>{e.state.rows.productions[0].status='deleted';},/생산 (원본이|순서가).*변경/],
  ['changed quantity',e=>{e.state.rows.productions[0].productionUnitQty=2;},/생산 (원본이|순서가).*변경/],
  ['late closing',e=>{e.state.rows.closings.push({id:e.today,status:'closed'});},/마감된 날짜/],
])test(`delete rejects ${name} arriving after preflight without refund`,async()=>{
  const e=await setup();try{
    beforeTransaction(e,()=>change(e));await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);assert.deepEqual(stocks(e),[9,20]);
    assert.equal(e.state.rows.supplementLogs.length,1);assert.match(e.alerts.at(-1),message);
  }finally{await e.cleanup();}
});

for(const usesSupplement of [true,false])test(`same-SKU/no-supplement edit cannot revive deleted source (${usesSupplement})`,async()=>{
  const e=await setup({usesSupplement});try{
    beforeTransaction(e,()=>{e.state.rows.productions[0].status='deleted';});
    await e.fire('#btnSaveProduction');
    assert.equal(e.state.rows.productions[0].status,'deleted');assert.equal(e.state.commits.length,0);
    assert.equal(e.document.querySelector('#pf_recipe').value,'r1');
    assert.match(e.alerts.at(-1),/생산 (원본이|순서가).*변경/);
  }finally{await e.cleanup();}
});

test('SKU edit rejects a recipe changed after preflight and preserves input',async()=>{
  const e=await setup();try{
    e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');
    beforeTransaction(e,()=>{e.state.rows.recipes[0].usesSupplement=false;});
    await e.fire('#btnSaveProduction');assert.equal(e.state.commits.length,0);
    assert.deepEqual(stocks(e),[9,20]);assert.equal(e.document.querySelector('#pf_qty_select').value,'2');
    assert.match(e.alerts.at(-1),/레시피가 변경/);
  }finally{await e.cleanup();}
});

for(const kind of ['delete','edit'])test(`${kind} with missing refund stock aborts all writes`,async()=>{
  const e=await setup();try{
    if(kind==='edit'){e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');}
    beforeTransaction(e,()=>{e.state.rows.supplementStock=e.state.rows.supplementStock.filter(s=>s.id!=='r1_1');});
    await e.fire(kind==='delete'?'.card-del':'#btnSaveProduction');
    assert.equal(e.state.commits.length,0);assert.equal(e.state.rows.productions[0].status,'active');
    assert.equal(e.state.rows.supplementLogs.length,1);assert.match(e.alerts.at(-1),/환급할 영양제 재고 근거/);
  }finally{await e.cleanup();}
});

test('invalid supplement log is not silently treated as no refund',async()=>{
  const e=await setup();try{
    e.state.rows.supplementLogs[0].qty='bad';await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);assert.match(e.alerts.at(-1),/로그 상태가 비정상/);
  }finally{await e.cleanup();}
});

test('locked production blocks edits and preserves supplement reservation',async()=>{
  const e=await setup({locked:true});try{
    assert.equal(e.document.querySelector('#btnSaveProduction').disabled,true);
    assert.equal(e.document.querySelector('.card-del').disabled,true);
    e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
    assert.match(e.alerts.at(-1),/완료 취소/);assert.deepEqual(stocks(e),[9,20]);
    assert.equal(e.state.rows.productions[0].productionUnitQty,1);
    assert.equal(e.state.rows.supplementLogs.length,1);assert.equal(e.state.commits.length,0);
  }finally{await e.cleanup();}
});

test('lost edit acknowledgement prevents dispatching a second save',async()=>{
  const e=await setup();try{
    e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');e.state.failNextCommit='after';
    await e.fire('#btnSaveProduction');assert.match(e.alerts.at(-1),/자동 재전송하지 않습니다/);
    await e.fire('#btnSaveProduction');
    assert.deepEqual(stocks(e),[10,19]);assert.equal(e.state.commits.length,1);
    assert.equal(e.state.rows.supplementLogs.length,3);assert.match(e.alerts.at(-1),/直前|직전 저장 결과/);
  }finally{await e.cleanup();}
});

for(const value of [NaN,-1,undefined,null])test(`invalid refund stock ${String(value)} aborts without writes`,async()=>{
  const e=await setup();try{
    beforeTransaction(e,()=>{e.state.rows.supplementStock[0].currentQty=value;});
    await e.fire('.card-del');assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');assert.match(e.alerts.at(-1),/수량이 비정상/);
  }finally{await e.cleanup();}
});

test('an auto deduction without SKU is rejected rather than ignored',async()=>{
  const e=await setup();try{
    delete e.state.rows.supplementLogs[0].supplementTypeId;await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);assert.match(e.alerts.at(-1),/로그 상태가 비정상/);
  }finally{await e.cleanup();}
});

test('timeout blocks resubmission while a late commit is still allowed to settle once',async()=>{
  const e=await setup();try{
    const original=e.api.runTransaction;let release,late,dispatches=0;
    const deferred=new Promise(r=>{release=r;});
    e.context.setTimeout=(fn,ms,...args)=>setTimeout(fn,ms===15000?1:ms,...args);
    e.cache.get('firebase/firestore').setExport('runTransaction',(...args)=>{
      dispatches++;late=deferred.then(()=>original(...args));return late;
    });
    e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');
    await e.fire('#btnSaveProduction');assert.equal(e.state.commits.length,0);
    assert.match(e.alerts.at(-1),/자동 재전송하지 않습니다/);
    await e.fire('#btnSaveProduction');assert.equal(dispatches,1);
    release();await late;await Promise.resolve();
    assert.deepEqual(stocks(e),[10,19]);assert.equal(e.state.commits.length,1);
    assert.equal(e.state.rows.supplementLogs.length,3);
    await e.fire('#btnSaveProduction');assert.equal(dispatches,1);
    assert.match(e.alerts.at(-1),/직전 저장 결과/);
    assert.doesNotMatch(e.document.querySelector('#actionStatus')?.textContent||'',/취소/);
  }finally{await e.cleanup();}
});

test('deletion and round recalculation no longer dispatch a separate follow-up write',async()=>{
  const e=await setup();try{
    const original=e.api.getDocsFromServer;let injected=false;
    e.cache.get('firebase/firestore').setExport('getDocsFromServer',async ref=>{
      if(!injected&&e.state.commits.length&&ref.path==='productions'){
        injected=true;throw Error('isolated follow-up read failure');
      }
      return original(ref);
    });
    await e.fire('.card-del');assert.equal(injected,false);assert.equal(e.state.commits.length,1);
    assert.equal(e.state.rows.productions[0].status,'deleted');assert.deepEqual(stocks(e),[10,20]);
    assert.equal(e.state.rows.supplementLogs.length,2);
    assert.equal(e.state.rows.productionOrderDays[0].revision,1);
  }finally{await e.cleanup();}
});
