import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

async function setup(options={}) {
  const e=await pageEnvironment('egg',{...options,instrument:'\nexport {showEggModal};'});
  e.state.rows.eggStock=[{id:'global',currentQty:247,minimumQty:140}];
  e.state.rows.staffGroups.find(row=>row.id==='senior').members=[{name:'담당'}];
  e.state.rows.eggLogs=[{id:'old',date:e.today,type:'out',qty:-98,before:345,after:247,timestamp:1,staffName:'기존',manualMovement:{kind:'usage'}}];
  await e.page.renderEgg();
  return e;
}
async function fillEntry(e,quantity='20') {
  e.fill('#eggEntryQty',quantity);e.fill('#eggEntryStaff','담당');
  await e.fire('#eggEntryQty','input');
}

test('inline exponent notation saves the exact receipt quantity shown in the preview',async()=>{
  const e=await setup();
  try {
    await e.fire('[data-egg-mode="in"]');await fillEntry(e,'1e2');
    assert.match(e.document.querySelector('#eggEntryPreview').textContent,/347개/);
    await e.fire('#btnSaveEggEntry');
    assert.equal(e.state.rows.eggStock[0].currentQty,347);
    assert.equal(e.state.rows.eggLogs.at(-1).qty,100);
  } finally {await e.cleanup();}
});

for(const type of ['out','in'])test(`inline ${type} uses the same stock, log, ledger and activity transaction as the modal`,async()=>{
  const inline=await setup(),modal=await setup();
  try {
    if(type==='in')await inline.fire('[data-egg-mode="in"]');
    await fillEntry(inline);inline.fill('#eggEntryNote','메모 & <보존>');
    assert.match(inline.document.querySelector('#eggEntryPreview').textContent,new RegExp(type==='in'?'267개':'227개'));
    await inline.fire('#btnSaveEggEntry');
    modal.page.showEggModal(type,modal.state.rows.eggStock[0]);
    modal.fill(type==='in'?'#m_qty':'#m_usageQty','20');modal.fill('#m_staff','담당');modal.fill('#m_note','메모 & <보존>');
    await modal.fire('#btnSaveEgg');
    assert.equal(inline.state.commits.length,1,inline.alerts.join('\n'));
    assert.equal(inline.state.commits[0].length,4);
    const a=inline.state.rows.eggLogs.at(-1),b=modal.state.rows.eggLogs.at(-1);
    for(const key of ['date','type','qty','before','after','staffName','note'])assert.equal(a[key],b[key],key);
    for(const key of ['kind','reason','changesStock','enteredAmount'])assert.equal(a.manualMovement[key],b.manualMovement[key],key);
    assert.equal(inline.state.rows.eggStock[0].currentQty,type==='in'?267:227);
    assert.equal(inline.state.rows.eggStock[0].minimumQty,140);
    assert.equal(inline.document.querySelector('#eggEntryQty').value,'');
    assert.equal(inline.document.querySelector('#eggEntryStaff').value,'담당');
    assert.equal(inline.document.querySelector('#btnSaveEggEntry').disabled,true);
    assert.equal(inline.state.rows.eggLogs[0].qty,-98);
    assert.ok(inline.document.querySelector('#eggTodayRows').textContent.includes('메모 & <보존>'));
  } finally {await inline.cleanup();await modal.cleanup();}
});

test('FIFO expansion preserves the exact entry DOM and values',async()=>{
  const e=await setup();
  try {
    await fillEntry(e);e.fill('#eggEntryNote','보존할 메모');
    const input=e.document.querySelector('#eggEntryQty');
    await e.fire('#btnToggleEggFifo');
    assert.equal(e.document.querySelector('#eggEntryQty'),input);
    assert.equal(input.value,'20');assert.equal(e.document.querySelector('#eggEntryNote').value,'보존할 메모');
    await e.fire('#btnToggleEggFifo');assert.equal(e.document.querySelector('#eggEntryQty'),input);
    assert.equal(e.state.writes.length,0);
  } finally {await e.cleanup();}
});

test('today records page independently and keep all historical fields in the folded history',async()=>{
  const e=await setup();
  try {
    e.state.rows.eggLogs=Array.from({length:8},(_,i)=>({id:`row${i}`,date:e.today,type:'adjust',qty:i,before:100,after:100+i,timestamp:100+i,staffName:`담당${i}`,reason:`사유${i}`,manualMovement:{kind:i===7?'test':'reconciliation'}}));
    await e.page.renderEgg({force:true});await fillEntry(e);
    const input=e.document.querySelector('#eggEntryQty');
    assert.equal(e.document.querySelectorAll('#eggTodayRows tr').length,5);
    assert.match(e.document.querySelector('#eggTodayRows').textContent,/테스트/);
    await e.fire('[data-egg-next]');
    assert.equal(e.document.querySelectorAll('#eggTodayRows tr').length,3);
    assert.equal(e.document.querySelector('#eggEntryQty'),input);
    assert.equal(input.value,'20');
    assert.equal(e.document.querySelectorAll('.egg-history-table tbody tr').length,8);
    assert.equal(e.document.querySelector('.egg-history-card').hasAttribute('open'),false);
    assert.equal(e.state.writes.length,0);
  } finally {await e.cleanup();}
});

test('inline excess quantities, closed dates and changed stock do not write',async()=>{
  for(const blocked of ['quantity','closed','conflict']) {
    const e=await setup();
    try {
      await fillEntry(e,blocked==='quantity'?'248':'20');
      if(blocked==='closed')e.state.rows.closings.push({id:e.today,status:'closed'});
      if(blocked==='conflict')e.state.rows.eggStock[0].currentQty=200;
      await e.fire('#btnSaveEggEntry');
      assert.equal(e.state.commits.length,0,blocked);
      assert.equal(e.document.querySelector('#eggEntryQty').value,blocked==='quantity'?'248':'20');
    } finally {await e.cleanup();}
  }
});

test('inline draft participates in navigation protection and mode cancellation keeps the draft',async()=>{
  const e=await setup();
  try {
    await fillEntry(e);
    const switchMode=e.fire('[data-egg-mode="in"]');
    assert.ok(e.document.querySelector('#navigationConfirm'));
    await e.fire('[data-stay]');await switchMode;
    assert.equal(e.document.querySelector('[data-egg-mode="out"]').getAttribute('aria-pressed'),'true');
    assert.equal(e.document.querySelector('#eggEntryQty').value,'20');
    const accept=e.fire('[data-egg-mode="in"]');await e.fire('[data-leave]');await accept;
    assert.equal(e.document.querySelector('#eggEntryQty').value,'');
    assert.equal(e.document.querySelector('#eggEntryStaff').value,'담당');
  } finally {await e.cleanup();}
});

test('inline submit is locked during guards and an unknown acknowledgement is not retried',async()=>{
  const e=await setup({latencyMs:15});
  try {
    await fillEntry(e);
    e.state.failNextCommit='after';
    const first=e.fire('#btnSaveEggEntry');
    assert.equal(e.document.querySelector('#eggEntryQty').disabled,true);
    await e.fire('#btnSaveEggEntry');await first;
    assert.equal(e.state.commits.length,1);
    await e.fire('#btnSaveEggEntry');
    assert.equal(e.state.commits.length,1);
    assert.equal(e.state.rows.eggStock[0].currentQty,227);
  } finally {await e.cleanup();}
});
