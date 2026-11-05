import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('전체 이력 combines lots once per product and keeps undated legacy log timestamps optional', async()=>{
  const e=await pageEnvironment('frozenPan',{instantRoutes:['frozenPan']});
  try {
    e.state.rows.breadPanLogs=[{id:'legacy',type:'incoming',date:'2026-09-11',qty:4.5,productName:'기존 품목'}];
    e.state.rows.freezeOrders=[{id:'dry',status:'cancelled',date:'2026-09-20',
      createdAt:new Date('2026-09-11T15:00:00Z'),cancelledAt:new Date('2026-09-12T15:00:00Z'),
      items:[{productName:'가상 품목',isVirtual:true,panCount:40}],
      deductions:[{productName:'옛 이름',amount:2,lotId:'a'},{productName:'옛 이름',amount:3,lotId:'b'}]}];
    await e.page.renderFrozenPan();
    await e.fire('[data-tab="history"]');
    const rows=[...e.document.querySelectorAll('.pan-log tbody tr')].map(r=>r.textContent);
    assert.equal(rows.length,3);
    assert.match(rows[0],/2026-09-13[\s\S]*동결가동 복원[\s\S]*옛 이름[\s\S]*\+5판/);
    assert.match(rows[1],/2026-09-12[\s\S]*동결가동 차감[\s\S]*-5판/);
    assert.match(rows[2],/기존 품목[\s\S]*\+4.5개/);
    assert.equal(e.state.writes.length,0);
  } finally {await e.cleanup();}
});

test('unavailable freeze operation history leaves stock, receiving and ordinary logs accessible',async()=>{
  const e=await pageEnvironment('frozenPan',{instantRoutes:['frozenPan']});
  try {
    e.state.failures.add('freezeOrders');
    e.state.rows.breadPanLogs=[{id:'receipt',type:'incoming',date:e.today,qty:2,productName:'기존 품목'}];
    await e.page.renderFrozenPan();
    assert.ok(e.document.querySelector('#panIncoming'));
    await e.fire('[data-tab="history"]');
    assert.match(e.document.querySelector('.pan-warning').textContent,/동결가동 발주서/);
    assert.match(e.document.querySelector('.pan-log tbody').textContent,/기존 품목/);
    assert.equal(e.state.writes.length,0);
  } finally {await e.cleanup();}
});
