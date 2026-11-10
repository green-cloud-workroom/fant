import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const first='고양이 검증 큐브',second='고양이 트릿';
async function setup(role='office',extra={}){
 const e=await pageEnvironment('frozenPan',{role,instantRoutes:['frozenPan'],...extra});
 e.state.rows.staffGroups=[{id:'senior',members:[{name:'담당'}]},{id:'office',members:[]}];
 e.state.rows.recipes.push({id:'fd2',name:'트릿',target:'cat',category:'freezeDry',active:true,requiresSeparation:true,sortOrder:2});
 e.state.rows.breadPanLots=[{id:'old',productName:first,date:'2026-09-11',remaining:4.5,closed:false},{id:'new',productName:first,date:'2026-09-13',remaining:10,closed:false}];
 await e.page.renderFrozenPan();return e;
}
const edit=(e,name)=>[...e.document.querySelectorAll('[data-pan-bread-edit]')].find(b=>b.dataset.panBreadEdit===name);
const field=(e,name)=>[...e.document.querySelectorAll('[data-pan-bread-input]')].find(b=>b.dataset.panBreadInput===name);
async function amount(e,name,qty){await e.fire(edit(e,name));const input=field(e,name);input.value=String(qty);await e.fire(input,'input');}
test('new row has no blank inputs; one clicked cell opens and drafts survive another cell and folding',async()=>{
 const e=await setup();try{
  await e.fire('#panAddDate');assert.equal(e.document.querySelectorAll('[data-pan-bread-input]').length,0);
  await amount(e,first,2.3);assert.equal(e.document.querySelectorAll('[data-pan-bread-input]').length,1);
  await e.fire(edit(e,second));assert.equal(edit(e,first).textContent,'2.3');assert.equal(e.document.querySelectorAll('[data-pan-bread-input]').length,1);
  await e.fire('[data-pan-fold=treat]');await e.fire('[data-pan-fold=treat]');assert.equal(edit(e,first).textContent,'2.3');
  e.fill('#panEntryStaff','담당');await e.fire('#panEntrySave');
  const lots=e.state.rows.breadPanLots.filter(l=>l.date===e.today);assert.equal(lots.length,1);assert.equal(lots[0].remaining,2.3);assert.equal(lots[0].productName,first);
 }finally{await e.cleanup();}
});
test('several products commit together with receipt metadata, ledger evidence and cancellation-compatible log links',async()=>{
 const e=await setup();try{
  await e.fire('#panAddDate');await amount(e,first,2.5);await amount(e,second,3.25);e.fill('#panEntryStaff','담당');e.fill('#panEntryNote','추가 입고');await e.fire('#panEntrySave');
  assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,7);
  const logs=e.state.rows.breadPanLogs.filter(l=>l.type==='incoming');assert.equal(logs.length,2);
  for(const log of logs){const lot=e.state.rows.breadPanLots.find(l=>l.id===log.lotId);assert.equal(lot.remaining,log.qty);assert.equal(log.before,0);assert.equal(log.after,log.qty);assert.equal(log.manualMovement.kind,'receipt');assert.ok(log.ledgerId);}
  const ledger=e.state.rows.stockLedger.find(l=>l.operationId);assert.equal(ledger.items.length,2);assert.equal(ledger.actionType,'manualMovement');assert.ok(ledger.items.every(i=>logs.some(l=>l.id===i.sourceLogId)));
  const {saveManualMovement}=await e.load('src/services/manualMovements.js');const log=logs[0];
  await saveManualMovement({db:{},name:'breadPanLogs',stockId:log.lotId,selection:{kind:'cancel',cancelOf:log.id,operationId:'cancel-test',reason:'입력 취소'},uid:'fixture',log:{type:'adjust',date:e.today,productName:log.productName,qty:-log.qty,lotId:log.lotId,staffName:'담당'}});
  assert.equal(e.state.rows.breadPanLots.find(l=>l.id===log.lotId).remaining,0);
 }finally{await e.cleanup();}
});
test('closed dates and invalid quantities keep the entered row and send zero writes',async()=>{
 const e=await setup();try{
  await e.fire('#panAddDate');await amount(e,first,-1);e.fill('#panEntryStaff','담당');await e.fire('#panEntrySave');assert.equal(e.state.writes.length,0);assert.ok(e.document.querySelector('.pan-inline-row'));
  field(e,first).value='3';await e.fire(field(e,first),'input');e.state.rows.closings.push({id:e.today,status:'closed'});await e.fire('#panEntrySave');assert.equal(e.state.writes.length,0);assert.ok(e.document.querySelector('.pan-inline-row'));
 }finally{await e.cleanup();}
});
test('lost response cannot publish the receipt twice and retains the entered quantities',async()=>{
 const e=await setup();try{
  await e.fire('#panAddDate');await amount(e,first,2);e.fill('#panEntryStaff','담당');e.state.failNextCommit='after';await e.fire('#panEntrySave');
  assert.equal(e.state.commits.length,1);assert.ok(e.document.querySelector('.pan-inline-row'));assert.equal(field(e,first).value,'2');
  await e.fire('#panEntrySave');assert.equal(e.state.commits.length,1);
 }finally{await e.cleanup();}
});
test('a failed batch publishes none of the entered products and keeps both draft amounts',async()=>{
 const e=await setup();try{
  await e.fire('#panAddDate');await amount(e,first,2);await amount(e,second,3);e.fill('#panEntryStaff','담당');e.state.failNextCommit='before';await e.fire('#panEntrySave');
  assert.equal(e.state.commits.length,0);assert.equal(e.state.rows.breadPanLots.filter(l=>l.date===e.today).length,0);assert.equal(edit(e,first).textContent,'2');assert.equal(field(e,second).value,'3');
 }finally{await e.cleanup();}
});
test('frozen cell selects original preprocessing handler; FIFO and actual integer pans remain unchanged',async()=>{
 const e=await setup('production');try{
  await e.fire([...e.document.querySelectorAll('[data-pan-convert]')].find(b=>b.dataset.panConvert===first));
  assert.equal(e.document.querySelector('.wi-name').value,first);assert.equal(e.document.querySelector('.wi-bread').value,'4.5');
  e.fill('.wi-bread',5).oninput();e.fill('.wi-actual',3).oninput();e.fill('#m_staff','담당');await e.fire('#btnSaveWorkRow');
  assert.equal(e.state.rows.breadPanLots.find(l=>l.id==='old').remaining,0);assert.equal(e.state.rows.breadPanLots.find(l=>l.id==='new').remaining,9.5);
  const log=e.state.rows.frozenPanLogs.find(l=>l.type==='preprocess');assert.equal(log.qty,3);assert.equal(e.state.rows.breadPanLogs.find(l=>l.expectedFrozenQty!==null).expectedFrozenQty,2.22);
 }finally{await e.cleanup();}
});
test('summary shows only positive item quantities and escapes literal names',async()=>{
 const e=await setup();try{const {stockTotals}=await e.load('src/pages/frozenPanDesk.js');const html=stockTotals([{productName:'<img onerror=x>',remaining:2.5},{productName:'zero',remaining:0}],[{productName:'동결 품목',remaining:3}]);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('zero'));assert.ok(html.includes('2.5개'));assert.ok(html.includes('3판'));}finally{await e.cleanup();}
});
