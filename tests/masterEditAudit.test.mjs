import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

const instrument={meat:'showMeatTypesModal,showMeatStockCategoriesModal',egg:'showSetMinModal',frozenProduct:'showProductModal',equipment:'showEquipmentModal,showPartModal,showCategoryManageModal',recipe:'showRecipeDetail'};
async function setup(route,{role='office'}={}){
  const e=await pageEnvironment(route,{role,instantRoutes:[route],instrument:`\nexport {${instrument[route]}};`});
  // structuredClone in the isolated Firestore returns native Date instances.
  // Share that constructor so Date/Timestamp fingerprints match real SDK data.
  e.context.Date=Date;
  Object.assign(e.state.rows,{
    eggStock:[{id:'global',currentQty:233,minimumQty:100}],
    equipments:[{id:'eq',category:'민서기',alias:'1호',active:true,sortOrder:0}],
    equipmentParts:[{id:'part',equipmentId:'eq',equipmentCategory:'민서기',equipmentAlias:'1호',name:'날',currentQty:5,minimumQty:1,cycleValue:1,cycleUnit:'month',lastReplacedAt:'2026-09-01',nextDueAt:'2026-10-01',active:true,sortOrder:0}],
    meatLogs:[{id:'old-meat',delta:1000}],bagLogs:[{id:'old-bag',qty:100}],eggLogs:[{id:'old-egg',qty:20}],
    frozenLogs:[{id:'old-frozen',qty:100}],supplementLogs:[{id:'old-sup',qty:3}],equipmentPartLogs:[{id:'old-part',qty:2}],
    confirmRequests:[{id:'old-confirm',status:'confirmed',replies:[{text:'preserve'}]}],
    settings:[{id:'meatStockCategories',groups:[{id:'group1',name:'기존 분류',scope:'meat',sortOrder:0}]}],
  });
  const names=['meatStocks','eggStock','bagTypes','supplementStock','frozenPanLots','meatLogs','bagLogs','eggLogs','frozenLogs','supplementLogs','equipmentPartLogs','confirmRequests'];
  e.protectedBefore=Object.fromEntries(names.map(name=>[name,JSON.stringify(e.state.rows[name])]));
  e.assertPreserved=(except=[])=>{for(const [name,value]of Object.entries(e.protectedBefore))if(!except.includes(name))assert.equal(JSON.stringify(e.state.rows[name]),value,name);};
  await e.page['render'+route[0].toUpperCase()+route.slice(1)]();
  return e;
}

for(const category of ['meat','produce'])test(`${category}: consecutive inline saves advance own baseline and preserve drafts`,async()=>{
  const e=await setup('meat');try{
    e.state.rows.meatTypes[0].category=category;
    // Refresh the displayed source after assigning the fixture's category.
    await e.page.renderMeat({force:true});e.page.showMeatTypesModal({categoryFilter:category});
    e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');
    assert.equal(e.state.rows.meatTypes[0].defaultUnitWeightG,750,e.alerts.join('\n'));
    e.fill('.m-min-qty','2.5');await e.fire('.m-min-qty','change');
    assert.equal(e.state.rows.meatTypes[0].minimumQtyG,category==='meat'?2500:3,e.alerts.join('\n'));
    e.fill('.m-unit-weight','800');await e.fire('.m-unit-weight','change');
    assert.equal(e.state.rows.meatTypes[0].defaultUnitWeightG,800,e.alerts.join('\n'));
    assert.equal(e.state.writes.length,3);assert.deepEqual(e.alerts,[]);
    assert.equal(e.document.querySelector('.m-min-qty').value,'2.5');
    e.assertPreserved();
  }finally{await e.cleanup();}
});

for(const category of ['meat','produce'])test(`${category}: rapid edits keep event values and unsaved draft text`,async()=>{
  const e=await setup('meat');try{
    e.state.rows.meatTypes[0].category=category;await e.page.renderMeat({force:true});e.page.showMeatTypesModal({categoryFilter:category});
    e.fill('.m-min-qty','1234');
    e.fill('.m-unit-weight','750');const first=e.fire('.m-unit-weight','change');
    e.fill('.m-unit-weight','800');const second=e.fire('.m-unit-weight','change');
    await Promise.all([first,second]);
    assert.equal(e.state.rows.meatTypes[0].defaultUnitWeightG,800,e.alerts.join('\n'));
    assert.equal(e.state.commits[0][0].data.defaultUnitWeightG,750);
    assert.equal(e.document.querySelector('.m-min-qty').value,'1234');
    assert.equal(e.state.rows.meatTypes[0].minimumQtyG,undefined);assert.deepEqual(e.alerts,[]);e.assertPreserved();
  }finally{await e.cleanup();}
});

test('editing several rows consecutively keeps each row and unit conversion correct',async()=>{
  const e=await setup('meat');try{
    e.state.rows.meatTypes.push({...e.state.rows.meatTypes[0],id:'m2',name:'소',sortOrder:1});await e.page.renderMeat({force:true});e.page.showMeatTypesModal();
    e.fill('.m-unit-weight[data-id="m1"]','750');await e.fire('.m-unit-weight[data-id="m1"]','change');
    e.fill('.m-min-qty[data-id="m2"]','3.25');await e.fire('.m-min-qty[data-id="m2"]','change');
    assert.equal(e.state.rows.meatTypes.find(row=>row.id==='m1').defaultUnitWeightG,750);
    assert.equal(e.state.rows.meatTypes.find(row=>row.id==='m2').minimumQtyG,3250,e.alerts.join('\n'));assert.deepEqual(e.alerts,[]);e.assertPreserved();
  }finally{await e.cleanup();}
});

test('another staff edit after first save is still rejected without overwriting input or data',async()=>{
  const e=await setup('meat');try{
    e.page.showMeatTypesModal();e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');
    e.state.rows.meatTypes[0].minimumQtyG=9000;
    e.fill('.m-min-qty','3');await e.fire('.m-min-qty','change');
    assert.equal(e.state.rows.meatTypes[0].minimumQtyG,9000);assert.equal(e.state.writes.length,1);
    assert.equal(e.document.querySelector('.m-min-qty').value,'3');assert.match(e.alerts.join('\n'),/원본이 변경/);e.assertPreserved();
  }finally{await e.cleanup();}
});

test('external master change during post-save refresh is not silently adopted',async()=>{
  const e=await setup('meat');try{
    e.page.showMeatTypesModal();const notify=e.state.notify;
    e.state.notify=async path=>{if(path==='meatTypes')e.state.rows.meatTypes[0].name='외부 변경';return notify(path);};
    e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');
    e.fill('.m-min-qty','3');await e.fire('.m-min-qty','change');
    assert.equal(e.state.rows.meatTypes[0].name,'외부 변경');assert.equal(e.state.rows.meatTypes[0].minimumQtyG,undefined);
    assert.equal(e.state.writes.length,1);assert.match(e.alerts.join('\n'),/다른 품목 변경/);e.assertPreserved();
  }finally{await e.cleanup();}
});

test('lost write acknowledgement blocks queued edits without a duplicate dispatch',async()=>{
  const e=await setup('meat');try{
    e.page.showMeatTypesModal();e.state.failNextCommit='after';
    e.fill('.m-unit-weight','750');const first=e.fire('.m-unit-weight','change');
    e.fill('.m-min-qty','3');const second=e.fire('.m-min-qty','change');await Promise.all([first,second]);
    assert.equal(e.state.writes.length,1);assert.equal(e.state.rows.meatTypes[0].minimumQtyG,undefined);assert.match(e.alerts.join('\n'),/자동 재전송하지 않습니다/);e.assertPreserved();
  }finally{await e.cleanup();}
});

test('production role cannot write the material master',async()=>{
  const e=await setup('meat',{role:'production'});try{
    e.page.showMeatTypesModal();e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');assert.equal(e.state.writes.length,0);assert.match(e.alerts.join('\n'),/권한/);e.assertPreserved();
  }finally{await e.cleanup();}
});

for(const category of ['meat','produce'])test(`${category} minimum saves correctly as first edit`,async()=>{
  const e=await setup('meat');try{
    e.state.rows.meatTypes[0].category=category;await e.page.renderMeat({force:true});e.page.showMeatTypesModal({categoryFilter:category});
    e.fill('.m-min-qty',category==='meat'?'2.5':'2500');await e.fire('.m-min-qty','change');
    assert.equal(e.state.rows.meatTypes[0].minimumQtyG,2500,e.alerts.join('\n'));assert.equal(e.state.writes.length,1);e.assertPreserved();
  }finally{await e.cleanup();}
});

test('egg minimum edit saves and keeps physical count/history',async()=>{
  const e=await setup('egg');try{
    e.page.showSetMinModal(e.state.rows.eggStock[0]);e.fill('#m_minQty','200');await e.fire('#btnSaveMin');
    assert.equal(e.state.rows.eggStock[0].minimumQty,200,e.alerts.join('\n'));assert.equal(e.state.rows.eggStock[0].currentQty,233);
    e.assertPreserved(['eggStock']);
  }finally{await e.cleanup();}
});

for(const kind of ['product','sample','sampleSet'])test(`frozen ${kind} master edit saves metadata only`,async()=>{
  const e=await setup('frozenProduct');try{
    const product=e.state.rows.frozenProducts[0];product.kind=kind;
    if(kind==='sampleSet'){
      product.name='검증 세트';product.components=[{frozenProductId:'sample1',qty:1}];
      e.state.rows.frozenProducts.push({...product,id:'sample1',kind:'sample',name:'검증 샘플',components:[]});
    }
    await e.page.renderFrozenProduct({force:true});await e.page.showProductModal(product);
    e.fill('#m_separation','false');await e.fire('#btnSaveProduct');
    assert.equal(e.state.rows.frozenProducts[0].requiresSeparation,false,e.alerts.join('\n'));
    assert.equal(e.state.writes.length,1,e.alerts.join('\n'));assert.equal(e.state.writes[0],'frozenProducts/fp1');e.assertPreserved();
  }finally{await e.cleanup();}
});

test('equipment name edit saves and synchronizes part labels without stock/cycle changes',async()=>{
  const e=await setup('equipment');try{
    e.page.showEquipmentModal(e.state.rows.equipments[0]);e.fill('#m_alias','2호');await e.fire('#btnSaveEquipment');
    assert.equal(e.state.rows.equipments[0].alias,'2호',e.alerts.join('\n'));
    const part=e.state.rows.equipmentParts[0];assert.equal(part.equipmentAlias,'2호');assert.equal(part.currentQty,5);assert.equal(part.nextDueAt,'2026-10-01');e.assertPreserved();
  }finally{await e.cleanup();}
});

test('part specification edit saves while stock, cycle and history remain intact',async()=>{
  const e=await setup('equipment');try{
    e.page.showPartModal(e.state.rows.equipmentParts[0],e.state.rows.equipments[0]);e.fill('#m_spec','120mm');await e.fire('#btnSavePart');
    const part=e.state.rows.equipmentParts[0];assert.equal(part.spec,'120mm',e.alerts.join('\n'));assert.equal(part.currentQty,5);assert.equal(part.cycleValue,1);assert.equal(part.nextDueAt,'2026-10-01');e.assertPreserved();
  }finally{await e.cleanup();}
});

test('equipment category rename saves linked labels and keeps part stock/cycle',async()=>{
  const e=await setup('equipment');try{
    e.page.showCategoryManageModal();e.fill('.m_catRename','분쇄기');await e.fire('#btnSaveCategories');
    assert.equal(e.state.rows.equipments[0].category,'분쇄기',e.alerts.join('\n'));
    const part=e.state.rows.equipmentParts[0];assert.equal(part.equipmentCategory,'분쇄기');assert.equal(part.currentQty,5);assert.equal(part.nextDueAt,'2026-10-01');e.assertPreserved();
  }finally{await e.cleanup();}
});

test('material stock category rename saves with stock/history intact',async()=>{
  const e=await setup('meat');try{
    e.page.showMeatStockCategoriesModal();e.fill('.stock-category-name','새 분류');await e.fire('.stock-category-name','change');
    assert.equal(e.state.rows.settings.find(row=>row.id==='meatStockCategories').groups[0].name,'새 분류',e.alerts.join('\n'));e.assertPreserved();
  }finally{await e.cleanup();}
});

for(const category of ['raw','freezeDry'])test(`${category} recipe edit preserves existing supplement stock/history`,async()=>{
  const e=await setup('recipe');try{
    const recipe=e.state.rows.recipes[0];Object.assign(recipe,{category,bagTypeId:'b1',usesSupplement:true,productionMethods:[]});
    await e.page.renderRecipe({force:true});e.page.showRecipeDetail(recipe);e.fill('#recipeNote','수정 검증');await e.fire('#btnSaveRecipe');
    assert.equal(e.state.rows.recipes[0].note,'수정 검증',e.alerts.join('\n'));e.assertPreserved();
  }finally{await e.cleanup();}
});
