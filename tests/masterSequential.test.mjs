import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

const exportsByRoute={bag:'showBagModal',egg:'showSetMinModal',frozenProduct:'showProductModal',equipment:'showEquipmentModal,showPartModal,showCategoryManageModal',recipe:'showRecipeDetail',meat:'showMeatTypesModal,showMeatStockCategoriesModal,persistMeatTypeOrder'};
async function setup(route){
 const e=await pageEnvironment(route,{instantRoutes:[route],instrument:`\nexport {${exportsByRoute[route]}};`});e.context.Date=Date;
 Object.assign(e.state.rows,{
  eggStock:[{id:'global',currentQty:233,minimumQty:100}],
  equipments:[{id:'eq',category:'민서기',alias:'1호',active:true,sortOrder:0}],
  equipmentParts:[{id:'p1',equipmentId:'eq',equipmentCategory:'민서기',equipmentAlias:'1호',name:'날',currentQty:5,minimumQty:1,cycleValue:1,cycleUnit:'month',lastReplacedAt:'2026-09-01',nextDueAt:'2026-10-01',active:true,sortOrder:0}],
  settings:[{id:'meatStockCategories',groups:[{id:'g1',name:'분류1',scope:'meat',sortOrder:0},{id:'g2',name:'분류2',scope:'meat',sortOrder:1}]}],
  meatLogs:[{id:'m-old',delta:1000}],bagLogs:[{id:'b-old',qty:10}],eggLogs:[{id:'e-old',qty:20}],frozenLogs:[{id:'f-old',qty:30}],supplementLogs:[{id:'s-old',qty:2}],equipmentPartLogs:[{id:'p-old',qty:1}],
  confirmRequests:[{id:'confirm',status:'confirmed',replies:[{text:'preserve'}]}],
 });
 for(const name of ['bagTypes','meatTypes','frozenProducts','recipes']){
  const row=e.state.rows[name][0];e.state.rows[name].push({...row,id:row.id+'-2',name:row.name+'2',sortOrder:1});
 }
 const fd=e.state.rows.recipes.find(row=>row.id==='fd1');
 e.state.rows.recipes.push({...fd,id:'fd2',name:fd.name+'2',sortOrder:3});
 for(const unit of [1,2]){
  e.state.rows.supplementTypes.push({id:`r1-2_${unit}`,recipeId:'r1-2',unit,name:'두번째 레시피 영양제',active:true,sortOrder:100+unit});
  e.state.rows.supplementStock.push({id:`r1-2_${unit}`,currentQty:30+unit});
 }
 const protectedNames=['meatStocks','eggStock','supplementStock','frozenPanLots','meatLogs','bagLogs','eggLogs','frozenLogs','supplementLogs','equipmentPartLogs','confirmRequests'];
 e.protectedBefore=Object.fromEntries(protectedNames.map(name=>[name,JSON.stringify(e.state.rows[name])]));
 e.assertPreserved=(except=[])=>{for(const [name,value]of Object.entries(e.protectedBefore))if(!except.includes(name))assert.equal(JSON.stringify(e.state.rows[name]),value,name);assert.ok(e.state.rows.bagTypes.every(row=>row.currentQty===100));assert.equal(e.state.rows.equipmentParts[0].currentQty,5);assert.equal(e.state.rows.equipmentParts[0].nextDueAt,'2026-10-01');};
 await e.page['render'+route[0].toUpperCase()+route.slice(1)]();return e;
}

test('bags: save different items and reopen the same item without page refresh',async()=>{
 const e=await setup('bag');try{
  for(const [id,size]of [['b1',20],['b1-2',30],['b1',40]]){e.page.showBagModal(e.state.rows.bagTypes.find(row=>row.id===id));e.fill('#m_piecesPerBox',size);e.fill('#m_minBox','2');await e.fire('#btnSaveBag');assert.equal(e.state.rows.bagTypes.find(row=>row.id===id).piecesPerBox,size,e.alerts.join('\n'));}e.assertPreserved();
 }finally{await e.cleanup();}
});

test('egg minimum: reopen and save three times without page refresh',async()=>{
 const e=await setup('egg');try{
  for(const minimum of [200,300,400]){e.page.showSetMinModal(e.state.rows.eggStock[0]);e.fill('#m_minQty',minimum);await e.fire('#btnSaveMin');assert.equal(e.state.rows.eggStock[0].minimumQty,minimum,e.alerts.join('\n'));}assert.equal(e.state.rows.eggStock[0].currentQty,233);e.assertPreserved(['eggStock']);
 }finally{await e.cleanup();}
});

for(const kind of ['product','sample','sampleSet'])test(`frozen ${kind}: save several products consecutively`,async()=>{
 const e=await setup('frozenProduct');try{
  for(const row of e.state.rows.frozenProducts){row.kind=kind;if(kind==='sampleSet'){row.name='세트'+row.id;row.components=[{frozenProductId:'sample-component',qty:1}];}}
  if(kind==='sampleSet')e.state.rows.frozenProducts.push({id:'sample-component',name:'샘플',kind:'sample',target:'cat',bagTypeId:'b1',sortOrder:3,active:true});
  await e.page.renderFrozenProduct({force:true});
  for(const [id,separation]of [['fp1',false],['fp1-2',false],['fp1',true]]){
   await e.page.showProductModal(e.state.rows.frozenProducts.find(row=>row.id===id));e.fill('#m_separation',String(separation));await e.fire('#btnSaveProduct');
   assert.equal(e.state.rows.frozenProducts.find(row=>row.id===id).requiresSeparation,separation,e.alerts.join('\n'));
  }assert.equal(e.state.writes.length,3);e.assertPreserved();
 }finally{await e.cleanup();}
});

test('equipment: alias, category and part metadata saves can follow each other',async()=>{
 const e=await setup('equipment');try{
  e.page.showEquipmentModal(e.state.rows.equipments[0]);e.fill('#m_alias','2호');await e.fire('#btnSaveEquipment');
  e.page.showPartModal(e.state.rows.equipmentParts[0],e.state.rows.equipments[0]);e.fill('#m_spec','120mm');await e.fire('#btnSavePart');
  e.page.showCategoryManageModal();e.fill('.m_catRename','분쇄기');await e.fire('#btnSaveCategories');
  e.page.showPartModal(e.state.rows.equipmentParts[0],e.state.rows.equipments[0]);e.fill('#m_spec','150mm');await e.fire('#btnSavePart');
  assert.equal(e.state.rows.equipmentParts[0].spec,'150mm',e.alerts.join('\n'));assert.equal(e.state.rows.equipmentParts[0].equipmentCategory,'분쇄기');assert.equal(e.state.rows.equipmentParts[0].equipmentAlias,'2호');e.assertPreserved();
 }finally{await e.cleanup();}
});

for(const category of ['raw','freezeDry'])test(`${category} recipes: edit several recipes repeatedly without resetting supplement stock`,async()=>{
 const e=await setup('recipe');try{
  for(const row of e.state.rows.recipes)Object.assign(row,{category,bagTypeId:'b1',usesSupplement:true,productionMethods:[]});await e.page.renderRecipe({force:true});
  for(const [id,note]of [['r1','one'],['r1-2','two'],['r1','three']]){e.page.showRecipeDetail(e.state.rows.recipes.find(row=>row.id===id));e.fill('#recipeNote',note);await e.fire('#btnSaveRecipe');assert.equal(e.state.rows.recipes.find(row=>row.id===id).note,note,e.alerts.join('\n'));}e.assertPreserved();
 }finally{await e.cleanup();}
});

test('material category table: rename two rows and rename first again',async()=>{
 const e=await setup('meat');try{
  e.page.showMeatStockCategoriesModal();
  for(const [id,name]of [['g1','새분류1'],['g2','새분류2'],['g1','최종분류']]){
   e.fill(`.stock-category-name[data-id="${id}"]`,name);await e.fire(`.stock-category-name[data-id="${id}"]`,'change');
   assert.equal(e.state.rows.settings[0].groups.find(row=>row.id===id).name,name,e.alerts.join('\n'));
  }e.assertPreserved();
 }finally{await e.cleanup();}
});

for(const category of ['meat','produce'])test(`${category} type management: activation followed by unit-weight edit`,async()=>{
 const e=await setup('meat');try{
  for(const row of e.state.rows.meatTypes)row.category=category;await e.page.renderMeat({force:true});e.page.showMeatTypesModal({categoryFilter:category});
  e.document.querySelector('.m-active-toggle').checked=false;await e.fire('.m-active-toggle','change');
  e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');
  assert.equal(e.state.rows.meatTypes[0].defaultUnitWeightG,750,e.alerts.join('\n'));e.assertPreserved();
 }finally{await e.cleanup();}
});

for(const category of ['meat','produce'])test(`${category} type management: add a type then edit its minimum`,async()=>{
 const e=await setup('meat');try{
  for(const row of e.state.rows.meatTypes)row.category=category;await e.page.renderMeat({force:true});e.page.showMeatTypesModal({categoryFilter:category});
  e.fill('#m_newMeatName','추가 품목');e.fill('#m_newUnitWeight','500');await e.fire('#btnAddMeatType');
  const created=e.state.rows.meatTypes.find(row=>row.name==='추가 품목');assert.ok(created);
  const selector=`.m-min-qty[data-id="${created.id}"]`;e.fill(selector,'2');await e.fire(selector,'change');
  assert.equal(e.state.rows.meatTypes.find(row=>row.id===created.id).minimumQtyG,category==='meat'?2000:2,e.alerts.join('\n'));e.assertPreserved();
 }finally{await e.cleanup();}
});

test('material type management: reorder then edit unit weight',async()=>{
 const e=await setup('meat');try{
  e.page.showMeatTypesModal();
  const body=e.document.querySelector('#meatTypesList');body.prepend(body.lastElementChild);
  await e.page.persistMeatTypeOrder();
  e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');
  const id=e.document.querySelector('.m-unit-weight').dataset.id;
  assert.equal(e.state.rows.meatTypes.find(row=>row.id===id).defaultUnitWeightG,750,e.alerts.join('\n'));e.assertPreserved();
 }finally{await e.cleanup();}
});
