import test from 'node:test';
import assert from 'node:assert/strict';
import { pageEnvironment } from './helpers/pageDom.mjs';

async function setup(role = 'office', { outsideMainQueries = false } = {}) {
  const e = await pageEnvironment('main', { role, instantRoutes: ['main'], instrument: '\nexport { selectProductionDate, openProductReceiptModal, handleBackToToday, renderInstantMain }; export const selectedState=()=>({date:selectedProductionDate,rows:selectedDateProductions});' });
  e.state.rows.productions = [{ id:'past',date:'2026-07-01',recipeId:'r1',recipeName:'과거 생산',category:'raw',target:'cat',status:'completed',received:true,receivedRevision:1,receivedPlates:1,receivedLoosePacks:0,receivedTotalPacks:100,receivedBox:5,receivedRemainder:0,ingredientsSnapshot:[] }];
  if (outsideMainQueries) e.state.rows.productions.push(...Array.from({length:100},(_,i)=>({
    id:'recent'+i,date:`2026-08-${String(i%14+1).padStart(2,'0')}`,recipeId:'r1',recipeName:'최근 생산',
    category:'raw',target:'cat',status:'completed',received:true,ingredientsSnapshot:[],
  })));
  e.state.rows.recipes[0].packsPerPlate=100;
  e.state.rows.closings.push({id:'2026-07-01',status:'closed'});
  e.state.rows.productTransferRequests=[{id:'productions:past:1',status:'pending'}];
  await e.page.renderInstantMain();
  return e;
}

test('date picker queries outside calendar, hides deleted rows and returns to default',async()=>{
  const e=await setup();
  try {
    e.state.rows.productions.push({...e.state.rows.productions[0],id:'deleted',status:'deleted'});
    await e.fire('#btnProductionDate');e.fill('#productionDateInput','2026-07-01');await e.fire('#productionDateConfirm');
    assert.equal(e.page.selectedState().date,'2026-07-01');assert.equal(e.page.selectedState().rows.length,1);
    assert.match(e.document.getElementById('mainContent').textContent,/과거 생산/);
    await e.page.renderInstantMain({force:true});assert.equal(e.page.selectedState().date,'2026-07-01');
    await e.fire('#btnBackToToday');assert.equal(e.page.selectedState().date,null);
  } finally {await e.cleanup();}
});

test('late historical query cannot replace the view after returning to today',async()=>{
  const e=await setup();
  try { const pending=e.page.selectProductionDate('2026-07-01');e.page.handleBackToToday();assert.equal(await pending,false);assert.equal(e.page.selectedState().date,null); }
  finally {await e.cleanup();}
});

test('selected historical date refreshes without navigating the shell',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    e.state.rows.productions[0].receivedTotalPacks=777;
    await e.state.notify('productions');
    for(let i=0;i<30&&e.page.selectedState().rows[0].receivedTotalPacks!==777;i++)await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(e.page.selectedState().date,'2026-07-01');
    assert.equal(e.page.selectedState().rows[0].receivedTotalPacks,777);
    assert.ok(!e.document.querySelector('[data-refresh-error]'));
  } finally {await e.cleanup();}
});

test('a selected production outside main queries updates after an external change',async()=>{
  const e=await setup('office',{outsideMainQueries:true});
  try {
    await e.page.selectProductionDate('2026-07-01');
    e.state.rows.productions[0].receivedTotalPacks=777;
    await e.state.notify('productions');
    for(let i=0;i<30&&e.page.selectedState().rows[0].receivedTotalPacks!==777;i++)await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(e.page.selectedState().rows[0].receivedTotalPacks,777);
    assert.ok(!e.document.querySelector('[data-refresh-error]'),'normal change was labeled as a refresh error');
  } finally {await e.cleanup();}
});

test('a normal main-data change does not report an error while a past date is selected',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    e.state.rows.eggStock[0].currentQty++;
    await e.state.notify('eggStock');
    await new Promise(resolve=>setTimeout(resolve,180));
    assert.ok(!e.document.querySelector('[data-refresh-error]'),'normal change was labeled as a refresh error');
    assert.equal(e.page.selectedState().date,'2026-07-01');
  } finally {await e.cleanup();}
});

test('external receipt change preserves an open form and prevents a stale save',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    await e.page.openProductReceiptModal('past');
    e.fill('#pr_plates',2);
    const writes=e.state.writes.length;
    e.state.rows.productions[0].receivedTotalPacks=777;
    await e.state.notify('productions');
    assert.equal(e.document.getElementById('pr_plates').value,'2');
    assert.match(e.document.querySelector('[data-refresh-notice]')?.textContent||'',/자료가 변경/);
    assert.ok(!e.document.querySelector('[data-refresh-error]'));
    await e.fire('#pr_confirm');
    assert.equal(e.state.writes.length,writes);
    assert.equal(e.document.getElementById('pr_plates').value,'2');
  } finally {await e.cleanup();}
});

test('switching historical dates ignores later changes to the previous date',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    await e.page.selectProductionDate('2026-07-02');
    e.state.rows.productions[0].receivedTotalPacks=777;
    await e.state.notify('productions');
    await new Promise(resolve=>setTimeout(resolve,150));
    assert.equal(e.page.selectedState().date,'2026-07-02');
    assert.equal(e.page.selectedState().rows.length,0);
    assert.ok(!e.document.querySelector('[data-refresh-error],[data-refresh-notice]'));
    e.page.handleBackToToday();
    assert.equal(e.page.selectedState().date,null);
  } finally {await e.cleanup();}
});

test('a selected-date read error keeps the date and recovers through retry',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    e.state.failures.add('productions');
    await e.state.notify('productions');
    assert.equal(e.page.selectedState().date,'2026-07-01');
    assert.match(e.document.querySelector('[data-refresh-notice]')?.textContent||'',/확인하지 못했습니다/);
    e.state.failures.delete('productions');
    e.state.rows.productions[0].receivedTotalPacks=777;
    await e.fire('[data-refresh-notice] button');
    assert.equal(e.page.selectedState().rows[0].receivedTotalPacks,777);
    assert.ok(!e.document.querySelector('[data-refresh-notice]'));
  } finally {await e.cleanup();}
});

test('a failed date switch leaves the previously selected production visible',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    e.state.failures.add('productions');
    await assert.rejects(()=>e.page.selectProductionDate('2026-07-02'),/fixture read failed/);
    assert.equal(e.page.selectedState().date,'2026-07-01');
    assert.equal(e.page.selectedState().rows[0].receivedTotalPacks,100);
  } finally {await e.cleanup();}
});

test('selected historical content is removed on permission denial',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');
    const resource=(await e.load('src/state/pageResources.js')).pageResource('main');
    resource.onChange({error:{code:'permission-denied'}});
    assert.equal(e.document.querySelectorAll('.main-production-card').length,0);
    assert.equal(e.page.selectedState().date,null);
  } finally {await e.cleanup();}
});

test('in-flight historical query cannot restore data after session clearance',async()=>{
  const e=await setup();
  try {
    const pending=e.page.selectProductionDate('2026-07-01');
    (await e.load('src/state/sessionStore.js')).sessionStore.clear();
    assert.equal(await pending,false);
  } finally {await e.cleanup();}
});

test('closed raw receipt saves production, transfer and office log atomically and keeps date',async()=>{
  const e=await setup();
  try {
    await e.page.selectProductionDate('2026-07-01');await e.page.openProductReceiptModal('past');
    e.fill('#pr_plates',2);e.fill('#pr_loose',3);await e.fire('#pr_confirm');
    assert.equal(e.state.rows.productions[0].receivedTotalPacks,203);assert.equal(e.state.rows.productions[0].receivedRevision,2);
    assert.equal(e.state.rows.productTransferRequests.length,2);
    const log=e.state.rows.activityLogs.find(l=>l.subAction==='receiptEmergencyEdit');
    assert.equal(log.date,e.today);assert.equal(log.details.producedDate,'2026-07-01');assert.equal(log.details.beforeTotalPacks,100);
    assert.equal(e.page.selectedState().date,'2026-07-01');assert.equal(e.page.selectedState().rows[0].receivedTotalPacks,203);
    assert.ok(e.state.commits.some(c=>c.length===3&&c.some(o=>o.target.path.startsWith('activityLogs/'))));
    const logic=await e.load('src/services/closingChecksLogic.js');
    assert.equal(logic.judgeProductionLogsAcknowledged([log], e.today).blocked,false);
    assert.equal(logic.judgeOfficeLogsAcknowledged([log], e.today).blocked,true);
  } finally {await e.cleanup();}
});

for (const failure of ['before','after']) test(`receipt ${failure} commit failure cannot duplicate a dispatched request`,async()=>{
  const e=await setup();
  try {
    await e.page.openProductReceiptModal('past');e.fill('#pr_plates',2);e.state.failNextCommit=failure;
    await e.fire('#pr_confirm');await e.fire('#pr_confirm');
    assert.equal(e.state.rows.productTransferRequests.length,failure==='before'?1:2);
    assert.equal(e.state.rows.activityLogs.filter(l=>l.subAction==='receiptEmergencyEdit').length,failure==='before'?0:1);
  } finally {await e.cleanup();}
});

test('inventory completed receipt and production role cannot edit closed receipt',async()=>{
  const e=await setup();
  try {
    e.state.rows.productTransferRequests[0].status='completed';await e.page.openProductReceiptModal('past');e.fill('#pr_plates',2);await e.fire('#pr_confirm');
    assert.equal(e.state.rows.productions[0].receivedRevision,1);assert.ok(e.alerts.some(m=>m.includes('되돌리기')));
  } finally {await e.cleanup();}
  const production=await setup('production');
  try {await production.page.openProductReceiptModal('past');assert.equal(production.document.getElementById('productReceiptModal'),null);}
  finally {await production.cleanup();}
});

test('legacy inventory completed status also blocks correction',async()=>{
  const e=await setup();
  try {
    e.state.rows.productTransferRequests[0].status='입고완료';
    await e.page.openProductReceiptModal('past');e.fill('#pr_plates',2);await e.fire('#pr_confirm');
    assert.equal(e.state.rows.productions[0].receivedRevision,1);
    assert.ok(e.alerts.some(m=>m.includes('되돌리기')));
  } finally {await e.cleanup();}
});

test('decimal receipt inputs and changed production fail without writes',async()=>{
  const e=await setup();
  try {
    await e.page.openProductReceiptModal('past');e.fill('#pr_plates',1.5);await e.fire('#pr_confirm');assert.equal(e.state.rows.productTransferRequests.length,1);
    e.fill('#pr_plates',2);e.state.rows.productions[0].receivedRevision=9;await e.fire('#pr_confirm');assert.equal(e.state.rows.productTransferRequests.length,1);
  } finally {await e.cleanup();}
});


test('older completed revision blocks correction even when immediate predecessor is pending', async()=>{
 const e=await setup();
 try {
  e.state.rows.productions[0].receivedRevision=2;
  e.state.rows.productTransferRequests=[
   {id:'productions:past:1',sourceApp:'production',sourceCollection:'productions',sourceId:'past',revision:1,status:'입고완료'},
   {id:'productions:past:2',sourceApp:'production',sourceCollection:'productions',sourceId:'past',revision:2,status:'pending'},
  ];
  await e.page.openProductReceiptModal('past');e.fill('#pr_plates',2);await e.fire('#pr_confirm');
  assert.equal(e.state.rows.productions[0].receivedRevision,2);
  assert.ok(e.alerts.some(message=>message.includes('되돌리기')));
 } finally {await e.cleanup();}
});


test('completed raw receipt sends only a linked correction request and keeps audit reason', async()=>{
 const e=await setup();
 try {
  e.state.rows.productTransferRequests[0]={id:'productions:past:1',sourceApp:'production',sourceCollection:'productions',sourceId:'past',eventType:'productReceipt',revision:1,boxes:5,remainderPacks:0,status:'completed'};
  await e.page.openProductReceiptModal('past');e.fill('#pr_plates',2);await e.fire('#pr_confirm');
  const request=e.state.rows.productTransferRequests.find(row=>row.revision===2);
  assert.equal(request.receiptMode,'adjustment');assert.equal(request.correctionOf,'productions:past:1');
  assert.equal(request.basisBoxes,5);assert.equal(request.boxes,10);assert.ok(request.correctionReason);
 } finally {await e.cleanup();}
});

test('resolving a duplicate latest receipt preserves the next linked correction path', async()=>{
 const e=await setup();
 try {
  e.state.rows.productions[0].receivedRevision=2;
  e.state.rows.productTransferRequests=[
   {id:'productions:past:1',sourceApp:'production',sourceCollection:'productions',sourceId:'past',eventType:'productReceipt',revision:1,boxes:5,remainderPacks:0,status:'completed'},
   {id:'productions:past:2',sourceApp:'production',sourceCollection:'productions',sourceId:'past',eventType:'productReceipt',revision:2,boxes:5,remainderPacks:0,status:'rejected',duplicateOf:'productions:past:1'},
  ];
  await e.page.openProductReceiptModal('past');e.fill('#pr_plates',2);await e.fire('#pr_confirm');
  const request=e.state.rows.productTransferRequests.find(row=>row.revision===3);
  assert.equal(request.receiptMode,'adjustment');assert.equal(request.correctionOf,'productions:past:1');
  assert.equal(request.basisBoxes,5);assert.equal(request.boxes,10);
 } finally {await e.cleanup();}
});
