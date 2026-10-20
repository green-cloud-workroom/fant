import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('meat history loads 100 recent rows first and exposes older rows on demand',async()=>{
 const e=await pageEnvironment('meat',{instantRoutes:['meat']});
 try{
  e.state.rows.meatLogs=Array.from({length:105},(_,i)=>({id:`log${String(i).padStart(3,'0')}`,stage:'frozen',meatTypeId:'m1',meatNameSnapshot:'닭',type:'frozenIncoming',delta:1000,timestamp:105-i,staff:'검증',reason:i===104?'가장 오래된 검증 이력':''}));
  await e.page.renderMeat();
  const reads=()=>e.state.reads.filter(r=>r.path==='meatLogs'&&r.kind==='query');
  assert.equal(reads().at(-1).conditions.find(c=>c.type==='limit')?.n,100);
  assert.ok(e.document.querySelector('[data-meat-log-more]'));
  await e.fire('[data-meat-log-more]');
  assert.equal(reads().at(-1).conditions.find(c=>c.type==='limit')?.n,100);
  assert.ok(reads().at(-1).conditions.some(c=>c.type==='cursor'));
  assert.equal(e.state.reads.filter(r=>r.path.startsWith('meatLogs/')&&r.kind==='doc').length,0);
  assert.equal(e.document.querySelector('[data-meat-log-more]'),null);
  await e.fire('.meat-log-type-toggle');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(e.document.querySelector('#tabContent').textContent.includes('가장 오래된 검증 이력'));
  assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});

test('produce history is found beyond 100 newer meat entries',async()=>{
 const e=await pageEnvironment('meat',{instantRoutes:['meat'],instrument:'\nexport function reviewTab(tab){currentTab=tab;return renderTab(tab);}'});
 try{
  e.state.rows.meatTypes.push({id:'produce',name:'검증 채소',category:'produce',sortOrder:1,active:true});
  e.state.rows.meatStocks=[{id:'produce-lot',meatTypeId:'produce',meatNameSnapshot:'검증 채소',stage:'frozen',incomingDate:'2026-09-14',remaining:10000,closed:false}];
  e.state.rows.meatLogs=Array.from({length:101},(_,i)=>({id:`log${String(i).padStart(3,'0')}`,stage:'frozen',meatTypeId:i===100?'produce':'m1',meatNameSnapshot:i===100?'검증 채소':'닭',type:'frozenIncoming',delta:1000,timestamp:101-i,reason:i===100?'채소 확인':''}));
  await e.page.renderMeat();
  await e.page.reviewTab('produce');
  assert.ok(e.document.querySelector('#tabContent').textContent.includes('검증 채소'));
  assert.equal(e.document.querySelector('[data-meat-history-section]').dataset.meatHistoryState,'loading');
  for(let i=0;i<100 && e.document.querySelector('[data-meat-history-section]').dataset.meatHistoryState==='loading';i++)
    await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(e.document.querySelector('[data-meat-history-section]').dataset.meatHistoryState,'ready');
  await e.fire('.meat-log-type-toggle');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(e.document.querySelector('#tabContent').textContent.includes('채소 확인'));
  assert.equal(e.state.reads.filter(r=>r.path==='meatLogs'&&r.kind==='query').at(-1).conditions.find(c=>c.type==='limit')?.n,100);
 }finally{await e.cleanup();}
});

test('an older history failure cannot replace the newly selected tab',async()=>{
 const e=await pageEnvironment('meat',{instantRoutes:['meat'],instrument:'\nexport function reviewTab(tab){currentTab=tab;return renderTab(tab);}'});
 try{
  e.state.rows.meatLogs=Array.from({length:101},(_,i)=>({id:`log${i}`,stage:'frozen',meatTypeId:'m1',meatNameSnapshot:'닭',type:'frozenIncoming',delta:1000,timestamp:101-i}));
  await e.page.renderMeat();
  e.state.latencyMs=80;
  const pending=e.fire('[data-meat-log-more]');
  await new Promise(resolve=>setTimeout(resolve,10));
  e.state.latencyMs=0;
  await e.page.reviewTab('processed');
  e.state.failures.add('meatLogs');
  await pending;
  assert.ok(e.document.querySelector('#tabContent').textContent.includes('전처리'));
  assert.equal(e.document.querySelector('[data-meat-log-error]'),null);
 }finally{await e.cleanup();}
});
