import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('egg opens quickly with recent logs and uses complete logs for FIFO',async()=>{
 const e=await pageEnvironment('egg',{instantRoutes:['egg']});
 try{
  e.state.rows.eggLogs=Array.from({length:60},(_,i)=>({id:`egg${i}`,date:i===59?'2026-01-01':'2026-09-14',type:'in',qty:1,timestamp:60-i,staffName:'검증'}));
  await e.page.renderEgg();
  const reads=()=>e.state.reads.filter(r=>r.path==='eggLogs'&&r.kind==='query');
  assert.equal(reads().at(-1).conditions.find(c=>c.type==='limit')?.n,50);
  assert.equal(e.document.querySelector('.egg-fifo-panel'),null);
  await e.fire('#btnToggleEggFifo');
  assert.equal(reads().at(-1).conditions.some(c=>c.type==='limit'),false);
  assert.ok(e.document.querySelector('.egg-fifo-panel').textContent.includes('2026-01-01'));
  assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
