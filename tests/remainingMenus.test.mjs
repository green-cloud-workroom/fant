import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

const renderers={frozenProduct:'renderFrozenProduct',frozenPan:'renderFrozenPan',frozenSep:'renderFrozenSep',freezeOp:'renderFreezeOp',schedule:'renderSchedule',production:'renderProduction'};
test('100 actual page transitions release old DOM, models and listener owners',async()=>{
 const e=await pageEnvironment('schedule');
 const lifecycle=await e.load('src/utils/pageLifecycle.js'),{displayPool}=await e.load('src/state/displayReads.js'),resources=await e.load('src/state/pageResources.js');
 try{
  const entries=Object.entries(renderers);
  for(let i=0;i<100;i++){
   const [route,render]=entries[i%entries.length];const old=e.document.getElementById('mainContent');
   const host=e.document.createElement('div');host.id='mainContent';old.replaceWith(host);lifecycle.beginPage(host,route);
   const page=await e.load(`src/pages/${route}.js`);await page[render]();
   assert.equal(old.isConnected,false);assert.ok(resources.inspectPageResources().filter(r=>r.cached).length<=3);
   assert.ok(displayPool.inspect().owners<=3);assert.ok(displayPool.inspect().listeners<=20);
  }
  assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
 assert.equal(displayPool.inspect().listeners,0);
});
for(const [route,render]of Object.entries(renderers))test(`${route}: 20 warm entries reuse the model and render without writes`,async()=>{
 const e=await pageEnvironment(route);
 try{
  await e.page[render]();const before=e.state.reads.length;
  for(let i=0;i<20;i++)await e.page[render]();
  assert.equal(e.state.reads.length,before);assert.equal(e.state.commits.length,0);
  assert.ok(e.nodes.mainContent.textContent.length>20);
 }finally{await e.cleanup();}
});

test('schedule completion publishes stock, ledger, activity and schedule in one batch',async()=>{
 const e=await pageEnvironment('schedule',{instrument:'\nexport {showCompleteModal};'});
 try{
  const s={id:'sc1',date:e.today,type:'bag',itemId:'b1',itemNameSnapshot:'검증 봉투',orderedQty:2,orderedUnit:'박스',status:'scheduled'};
  e.state.rows.schedules=[s];await e.page.renderSchedule();e.page.showCompleteModal(s);
  e.fill('#m_actual',2);e.fill('#m_staff','검증 담당자');await e.fire('#btnSaveComplete');
  assert.equal(e.state.rows.bagTypes[0].currentQty,120,e.alerts.join('\n'));
  assert.equal(e.state.rows.schedules[0].status,'completed');assert.equal(e.state.commits.length,1);
  assert.equal(e.state.rows.stockLedger.length,1);assert.equal(e.state.rows.activityLogs.length,1);
 }finally{await e.cleanup();}
});

test('production creation keeps ingredient calculation, supplement deduction and round recalculation',async()=>{
 const e=await pageEnvironment('production');
 try{
  await e.page.renderProduction();await e.fire('#btnNewProduction');e.fill('#pf_recipe','r1');await e.fire('#pf_recipe','change');e.fill('#pf_qty_select','1');await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
  assert.equal(e.state.rows.productions.length,1,e.alerts.join('\n'));
  assert.equal(e.state.rows.productions[0].ingredientsSnapshot[0].requiredQtyG,1000);
  assert.equal(e.state.rows.supplementStock[0].currentQty,19);
  assert.equal(e.state.rows.productions[0].round,1);
 }finally{await e.cleanup();}
});

test('frozen separation incoming preserves quantities and source links',async()=>{
 const e=await pageEnvironment('frozenSep',{instrument:'\nexport {showIncomingModal};'});
 try{
  await e.page.renderFrozenSep();e.page.showIncomingModal([]);
  e.fill('#m_name','고양이 검증 큐브');e.fill('#m_qty','4');e.fill('#m_date',e.today);e.fill('#m_staff','검증 담당자');await e.fire('#btnSaveIncoming');
  assert.equal(e.state.rows.frozenSeparation.length,1,e.alerts.join('\n'));
  assert.equal(e.state.rows.frozenSeparation[0].remaining,4);assert.equal(e.state.rows.frozenSeparation[0].stockType,'notSeparated');
  assert.equal(e.state.rows.frozenSeparationLogs.length,1);assert.equal(e.state.rows.activityLogs.length,1);
 }finally{await e.cleanup();}
});
