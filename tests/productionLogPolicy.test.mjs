import test from 'node:test';
import assert from 'node:assert/strict';
import {isHistoryOnlyActivity} from '../src/domain/activityLogPolicy.js';
import {judgeProductionLogsAcknowledged,judgeAutoRepackLogsAcknowledged,judgeOfficeLogsAcknowledged,isClosingLogPending} from '../src/services/closingChecksLogic.js';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {environment} from './helpers/modules.mjs';
import {patchProductionCreateLogPolicy} from '../scripts/productionCreateLogPolicyPatch.mjs';

const date='2026-09-14';
const entry=(action,subAction,id=action+subAction)=>({id,date,action,subAction,acknowledged:false,message:id,timestamp:{seconds:1789340200}});
const created=entry('production','create','생산 추가 — 고양이 치킨 18kg');
const actionable=[entry('production','update'),entry('production','delete'),entry('production','add'),entry('production','unknown'),entry('pretreat','create'),entry('repackaging','create'),entry('scheduleDue','trigger'),entry('frozenStockLow','alert'),entry('meat','adjust')];

test('only successful production creation becomes history; other actions retain closing requirements',()=>{
 const before=JSON.stringify([created,...actionable]);
 assert.equal(isHistoryOnlyActivity(created),true);assert.equal(isHistoryOnlyActivity(null),false);
 assert.equal(judgeProductionLogsAcknowledged([created],date).blocked,false);
 for(const id of [4,5,6])assert.equal(isClosingLogPending(created,date,id),false);
 for(const log of actionable){assert.equal(isHistoryOnlyActivity(log),false);assert.equal(judgeProductionLogsAcknowledged([created,log],date).count,1);assert.equal(isClosingLogPending(log,date,5),true);}
 const repack=entry('autoRepack','trigger');assert.equal(judgeAutoRepackLogsAcknowledged([created,repack],date).count,1);
 for(const log of [entry('schedule','completeDiff'),entry('production','receiptEmergencyEdit')])assert.equal(judgeOfficeLogsAcknowledged([created,log],date).count,1);
 assert.equal(JSON.stringify([created,...actionable]),before);
});

test('historical creates no longer force an overdue closing date; actual blockers still do',async()=>{
 const e=await environment();const api=await e.load('src/services/closingChecks.js');
 e.state.rows.activityLogs=[{...created,date:e.dates[5]}];
 assert.equal(await api.findActionableClosingDate(e.today),null);
 e.state.rows.activityLogs.push({...actionable[0],date:e.dates[5]});
 const overdue=await api.findActionableClosingDate(e.today);assert.equal(overdue.date,e.dates[5]);assert.equal(overdue.blockingData.totalBlocked,1);
 assert.equal(e.state.writes.length,0);
});

async function setup(){const e=await pageEnvironment('main',{instrument:'\nexport {renderLogSection,showAllLogsModal,showHistoryLogsModal,ackAllInSection};'});e.state.rows.activityLogs=[created,entry('autoRepack','trigger','실측 확인 필요'),entry('production','update','생산 수량 수정')];return e;}
test('main hides creation rows while full history retains names and removes the acknowledgement affordance',async()=>{
 const e=await setup();try{
  const stock=JSON.stringify(e.state.rows.bagTypes);await e.page.loadAllData();
  const html=e.page.renderLogSection('production');assert.ok(!html.includes('생산 추가'));assert.match(html,/실측 확인 필요/);assert.match(html,/생산 수량 수정/);
  for(const open of ['showAllLogsModal','showHistoryLogsModal']){
   await e.page[open]('production');const overlay=e.document.getElementById('modalOverlay');
   const row=[...overlay.querySelectorAll('.log-modal-row')].find(r=>r.textContent.includes('생산 추가'));
   assert.ok(row);assert.match(row.textContent,/고양이 치킨 18kg/);assert.match(row.textContent,/이력/);
   assert.equal(row.querySelectorAll('button').length,0);assert.equal(row.classList.contains('log-row-unack'),false);
   assert.equal(overlay.querySelectorAll('[data-modal-log-act=ack]').length,2);
  }
  assert.equal(e.state.rows.activityLogs[0].acknowledged,false);assert.equal(JSON.stringify(e.state.rows.bagTypes),stock);assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
test('bulk acknowledgement leaves audit-only creation and required processing alerts untouched',async()=>{
 const e=await setup();try{await e.page.ackAllInSection('production');
  assert.equal(e.state.rows.activityLogs.find(l=>l.id===created.id).acknowledged,false);
  assert.equal(e.state.rows.activityLogs.find(l=>l.id==='실측 확인 필요').acknowledged,false);
  assert.equal(e.state.rows.activityLogs.find(l=>l.id==='생산 수량 수정').acknowledged,true);
  assert.deepEqual([...new Set(e.state.writes)],['activityLogs/생산 수량 수정']);
 }finally{await e.cleanup();}
});

test('live server patch is narrow, refuses drift/reapplication and preserves other closing predicates',async()=>{
 // A compact copy of the deployed filter shape is sufficient to verify fail-closed patching.
 const source="export function judgeProductionLogsAcknowledged(logs) {\n return logs.filter(log =>\n  log.acknowledged !== true &&\n  classifyClosingLog(log) === 'production' &&\n  !isAutoRepackAckLog(log));\n}\nexport const untouched = 'stock arithmetic';";
 const patched=patchProductionCreateLogPolicy(source);
 assert.equal(patched.replace("\n  !(log.action === 'production' && log.subAction === 'create') &&",''),source);
 assert.throws(()=>patchProductionCreateLogPolicy(patched),/changed/);assert.throws(()=>patchProductionCreateLogPolicy(source+source),/changed/);
});
