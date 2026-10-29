import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {trustSupplementReservationFixture} from './helpers/supplementReservationFixture.mjs';

async function setup() {
  const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});
  e.state.rows.supplementTypes.forEach((sku,index)=>Object.assign(sku,{recipeId:'r1',unit:index+1}));
  e.state.rows.productions=[{id:'p1',date:e.today,recipeId:'r1',recipeName:'검증 레시피',
    category:'raw',target:'cat',status:'active',sortOrder:0,round:1,batchNo:null,
    productionUnitQty:1,productionUnitName:'kg',ingredientsSnapshot:[],
    supplementReservation:{version:1,skuId:'r1_1',quantity:1},
    supplementMovement:{version:1,refundLogId:null,deductLogId:'deduct'}}];
  e.state.rows.supplementStock[0].currentQty=9;
  e.state.rows.supplementLogs=[{id:'deduct',date:e.today,type:'autoDeduct',
    supplementTypeId:'r1_1',qty:-1,before:10,after:9,relatedProductionId:'p1'}];
  trustSupplementReservationFixture(e);
  await e.page.renderProduction();
  return e;
}

function mutateBeforeTransaction(e,mutate) {
  const original=e.api.runTransaction;
  e.cache.get('firebase/firestore').setExport('runTransaction',async (...args)=>{
    mutate();
    return original(...args);
  });
}

for(const [name,mutate] of [
  ['quantity changed',e=>{e.state.rows.supplementLogs[0].qty=-2;}],
  ['log removed',e=>{e.state.rows.supplementLogs=[];}],
  ['type changed',e=>{e.state.rows.supplementLogs[0].type='adjust';}],
  ['document id changed',e=>{e.state.rows.supplementLogs[0].id='spoofed';}],
  ['non-deduction log changed',e=>{e.state.rows.supplementLogs[1].note='changed';}],
]) test(`delete rejects existing refund evidence ${name} before any write`,async()=>{
  const e=await setup();
  try {
    if(name==='non-deduction log changed')e.state.rows.supplementLogs.push({id:'other',date:e.today,
      type:'adjust',qty:1,relatedProductionId:'p1',note:'before'});
    mutateBeforeTransaction(e,()=>mutate(e));
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');
    assert.equal(e.state.rows.supplementStock[0].currentQty,9);
    assert.match(e.alerts.at(-1),/영양제 환급 로그가 변경/);
  } finally {await e.cleanup();}
});

test('delete refuses a query with over 200 related logs before any write',async()=>{
  const e=await setup();
  try {
    for(let i=1;i<=200;i++)e.state.rows.supplementLogs.push({id:`other${i}`,date:e.today,
      type:'adjust',qty:0,relatedProductionId:'p1'});
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');
    assert.match(e.alerts.at(-1),/영양제 로그 상태가 비정상/);
  } finally {await e.cleanup();}
});

test('unchanged evidence still allows one atomic deletion and refund',async()=>{
  const e=await setup();
  try {
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,1);
    assert.equal(e.state.rows.productions[0].status,'deleted');
    assert.equal(e.state.rows.supplementStock[0].currentQty,10);
  } finally {await e.cleanup();}
});
