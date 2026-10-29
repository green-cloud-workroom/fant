import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {trustSupplementReservationFixture} from './helpers/supplementReservationFixture.mjs';

async function setup(logs) {
  const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});
  e.state.rows.supplementTypes.forEach((sku,index)=>Object.assign(sku,{recipeId:'r1',unit:index+1}));
  e.state.rows.productions=[{id:'p1',date:e.today,recipeId:'r1',recipeName:'검증 레시피',
    category:'raw',target:'cat',status:'active',sortOrder:0,round:1,batchNo:null,
    productionUnitQty:1,productionUnitName:'kg',ingredientsSnapshot:[],
    supplementReservation:{version:1,skuId:logs?.length===0?null:'r1_1',quantity:logs?.length===0?0:1},
    supplementMovement:{version:1,refundLogId:null,deductLogId:logs?.length===0?null:'deduct'}}];
  e.state.rows.supplementStock[0].currentQty=9;
  e.state.rows.supplementLogs=logs || [{id:'deduct',date:e.today,type:'autoDeduct',
    supplementTypeId:'r1_1',qty:-1,before:10,after:9,relatedProductionId:'p1'}];
  trustSupplementReservationFixture(e);
  await e.page.renderProduction();
  return e;
}

for(const [name,change] of [
  ['SKU changed',row=>{row.supplementTypeId='other';}],
  ['source ID changed',row=>{row.relatedProductionId='p2';}],
]) test(`delete rejects ${name} after prequery with zero writes`,async()=>{
  const e=await setup();
  try {
    const original=e.api.runTransaction;
    e.cache.get('firebase/firestore').setExport('runTransaction',async (...args)=>{
      change(e.state.rows.supplementLogs[0]);
      return original(...args);
    });
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');
    assert.equal(e.state.rows.supplementStock[0].currentQty,9);
    assert.match(e.alerts.at(-1),/영양제 환급 로그가 변경/);
  } finally {await e.cleanup();}
});

test('query failure before deletion leaves source and stock untouched',async()=>{
  const e=await setup();
  try {
    const original=e.api.getDocsFromServer;
    e.cache.get('firebase/firestore').setExport('getDocsFromServer',async q=>{
      if(String(q?._query?.path||q?.path||'').includes('supplementLogs'))throw Error('isolated query failure');
      return original(q);
    });
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');
    assert.equal(e.state.rows.supplementStock[0].currentQty,9);
  } finally {await e.cleanup();}
});

test('zero refund evidence still performs one guarded soft deletion',async()=>{
  const e=await setup([]);
  try {
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,1);
    assert.equal(e.state.rows.productions[0].status,'deleted');
    assert.equal(e.state.rows.supplementStock[0].currentQty,9);
    assert.equal(e.state.rows.supplementLogs.length,0);
  } finally {await e.cleanup();}
});

test('multiple outstanding SKU evidence mismatching the reservation refuses deletion',async()=>{
  const e=await setup();
  try {
    e.state.rows.supplementStock.push({id:'r2_1',currentQty:5});
    e.state.rows.supplementLogs.push({id:'deduct-2',date:e.today,type:'autoDeduct',
      supplementTypeId:'r2_1',qty:-2,before:7,after:5,relatedProductionId:'p1'});
    await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');
    assert.equal(e.state.rows.supplementStock.find(row=>row.id==='r1_1').currentQty,9);
    assert.equal(e.state.rows.supplementStock.find(row=>row.id==='r2_1').currentQty,5);
    assert.equal(e.state.rows.supplementLogs.filter(row=>row.reason==='production deleted').length,0);
    assert.match(e.alerts.at(-1),/예약과 차감 이력이 일치하지/);
  } finally {await e.cleanup();}
});

test('a retried transaction rejects refund evidence changed after its first callback',async()=>{
  const e=await setup();
  try {
    const original=e.api.runTransaction;
    let callbacks=0;
    e.cache.get('firebase/firestore').setExport('runTransaction',async (db,callback)=>{
      const dry={get:e.api.getDocFromServer};
      for(const kind of ['set','update','delete'])dry[kind]=()=>dry;
      await callback(dry);callbacks++;
      e.state.rows.supplementLogs[0].qty=-2;
      return original(db,async tx=>{callbacks++;return callback(tx);});
    });
    await e.fire('.card-del');
    assert.equal(callbacks,2);
    assert.equal(e.state.commits.length,0);
    assert.equal(e.state.rows.productions[0].status,'active');
    assert.equal(e.state.rows.supplementStock[0].currentQty,9);
    assert.match(e.alerts.at(-1),/영양제 환급 로그가 변경/);
  } finally {await e.cleanup();}
});
