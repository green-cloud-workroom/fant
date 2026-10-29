import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {trustSupplementReservationFixture} from './helpers/supplementReservationFixture.mjs';

async function setup({legacy=false}={}) {
  const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});
  e.state.rows.supplementTypes.forEach((sku,index)=>Object.assign(sku,{recipeId:'r1',unit:index+1}));
  e.state.rows.productions=[{id:'p1',date:e.today,recipeId:'r1',recipeName:'검증 레시피',category:'raw',target:'cat',status:'active',sortOrder:0,round:1,batchNo:null,productionUnitQty:1,productionUnitName:'kg',ingredientsSnapshot:[],
    ...(!legacy?{supplementReservation:{version:1,skuId:'r1_1',quantity:1},supplementMovement:{version:1,refundLogId:null,deductLogId:'deduct'}}:{})}];
  e.state.rows.supplementStock[0].currentQty=9;
  e.state.rows.supplementLogs=[{id:'deduct',date:e.today,type:'autoDeduct',supplementTypeId:'r1_1',qty:-1,before:10,after:9,relatedProductionId:'p1'}];
  trustSupplementReservationFixture(e);await e.page.renderProduction();await e.page.showProductionForm(e.state.rows.productions[0]);return e;
}

for(const action of ['edit','delete'])test(`legacy production ${action} requires trusted reservation migration`,async()=>{
  const e=await setup({legacy:true});try{
    if(action==='edit'){e.fill('#pf_qty_select','2');await e.fire('#btnSaveProduction');}else await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);assert.equal(e.state.rows.supplementStock[0].currentQty,9);assert.match(e.alerts.at(-1),/예약 근거가 없습니다/);
  }finally{await e.cleanup();}
});
for(const action of ['edit','delete'])test(`a reservation marker without an independently protected proof cannot authorize ${action}`,async()=>{
  const e=await setup();try{
    e.state.rows.supplementContractProofs=[];
    if(action==='edit'){e.fill('#pf_qty_select','2');await e.fire('#btnSaveProduction');}else await e.fire('.card-del');
    assert.equal(e.state.commits.length,0);assert.equal(e.state.rows.supplementStock[0].currentQty,9);assert.match(e.alerts.at(-1),/신뢰된 영양제 예약 증거/);
  }finally{await e.cleanup();}
});

test('legacy same-quantity metadata save does not silently initialize a reservation',async()=>{
  const e=await setup({legacy:true});try{await e.fire('#btnSaveProduction');assert.equal(e.state.commits.length,1);assert.equal(e.state.rows.productions[0].supplementReservation,undefined);assert.equal(e.state.rows.supplementLogs.length,1);}finally{await e.cleanup();}
});

test('quantity edit followed by deletion refunds only the outstanding new SKU',async()=>{
  const e=await setup();try{
    e.fill('#pf_qty_select','2');await e.fire('#btnSaveProduction');
    assert.equal(e.state.rows.productions[0].supplementReservation.skuId,'r1_2');
    assert.deepEqual(e.state.rows.supplementStock.map(r=>r.currentQty),[10,19]);
    await e.fire('.card-del');assert.deepEqual(e.state.rows.supplementStock.map(r=>r.currentQty),[10,20]);
    assert.equal(e.state.rows.productions[0].status,'deleted');assert.equal(e.state.rows.productions[0].supplementReservation.quantity,0);
    assert.equal(e.state.rows.supplementLogs.length,4);assert.ok(e.state.rows.supplementLogs.slice(1).every(r=>r.movementSchemaVersion===3&&r.uid&&r.productionOrderRevision));
  }finally{await e.cleanup();}
});

test('recipe disabling supplements releases a previous reservation on quantity edit',async()=>{
  const e=await setup();try{
    e.state.rows.recipes[0].usesSupplement=false;await e.page.renderProduction({force:true});await e.page.showProductionForm(e.state.rows.productions[0]);
    e.fill('#pf_qty_select','2');await e.fire('#btnSaveProduction');assert.deepEqual(e.state.rows.supplementStock.map(r=>r.currentQty),[10,20]);
    assert.equal(e.state.rows.productions[0].supplementReservation.skuId,null);const logCount=e.state.rows.supplementLogs.length;
    await e.fire('.card-del');assert.equal(e.state.rows.productions[0].status,'deleted');assert.equal(e.state.rows.supplementLogs.length,logCount);
  }finally{await e.cleanup();}
});

test('orphan active SKU outside recipe presets cannot be reserved',async()=>{
  const e=await setup();try{
    const helper=await e.load('src/services/productionSupplementReservation.js');
    e.state.rows.supplementTypes.push({id:'r1_3',recipeId:'r1',unit:3,active:true});
    await assert.rejects(helper.planProductionSupplementChanges({db:{},date:e.today,transaction:{get:e.api.getDocFromServer},rows:e.state.rows.productions,changes:[{id:'p1',kind:'update',data:{productionUnitQty:3}}],actorUid:'fixture',logRefs:new Map(),nextRevision:1}),/등록된 영양제 생산단위/);
    assert.equal(e.state.commits.length,0);
  }finally{await e.cleanup();}
});
