import test from 'node:test';
import assert from 'node:assert/strict';
import {displayActivity} from '../src/utils/activityDisplay.js';
import {staffError} from '../src/utils/staffText.js';
import {correctionSummary} from '../src/utils/correctionDisplay.js';
import {judgeOfficeLogsAcknowledged,judgeProductionLogsAcknowledged,isClosingLogPending} from '../src/services/closingChecksLogic.js';
import {confirmPayload} from '../src/services/statsAutomation.js';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {environment} from './helpers/modules.mjs';
const log={id:'private-log-id',date:'2026-08-13',action:'bag',subAction:'adjust',acknowledged:false,staff:'예시 담당자',message:'사용 — 고양이 덕포켓 -4000 / 재고차감',
 details:{sourceCollection:'bagLogs',delta:-4000,before:9000,after:5000,manualMovement:{kind:'usage',enteredAmount:-4000,reason:'재고차감'}}};
test('stored movement and closing result remain intact; staff sees item, action, amount and unit',()=>{
 const before=JSON.stringify(log),r=judgeOfficeLogsAcknowledged([log],log.date);
 assert.equal(r.blocked,true);assert.equal(r.count,1);
 assert.match(r.details[0],/고양이 덕포켓 봉투 · 사용 4,000장/);
 assert.ok(!r.details[0].includes('bag:adjust'));assert.equal(JSON.stringify(log),before);
 assert.equal(judgeOfficeLogsAcknowledged([{...log,acknowledged:true}],log.date).blocked,false);
 assert.equal(judgeProductionLogsAcknowledged([log],log.date).blocked,false);
 for(const id of [4,5,6])assert.equal(isClosingLogPending(log,log.date,id),id===6);
 assert.equal(isClosingLogPending(log,'2026-09-14',6),false);
});
test('six inventory units including legacy grams and new kg are displayed without converting stock values',()=>{
 const cases=[['bag','bagLogs','장',4],['egg','eggLogs','개',4],['supplementStock','supplementLogs','봉',4],['breadPan','breadPanLogs','개',4],['frozenPan','frozenPanLogs','판',4],['meat','meatLogs','kg',4000]];
 for(const [action,sourceCollection,unit,entered] of cases) {
  const l={action,message:'실제 입고 — 테스트품 '+entered,details:{sourceCollection,manualMovement:{kind:'receipt',enteredAmount:entered}}};
  assert.match(displayActivity(l),new RegExp('4'+unit));assert.equal(l.details.manualMovement.enteredAmount,entered);
 }
 assert.match(displayActivity({action:'meat',message:'실제 입고 — 원료 4kg / 입고'}),/4kg/);
 assert.match(displayActivity({action:'meat',message:'실제 입고 — 원료 4000 / 입고'}),/4kg/);
});
test('unknown supplement names and original references are not used as staff labels',()=>{
 const l={action:'supplementStock',message:'실제 입고 — missing_2 4 / 취소 원본: supplementLogs/SECRET',details:{supplementTypeId:'missing_2'}};
 assert.match(displayActivity(l),/품목명 확인 필요/);assert.ok(!/missing_2|supplementLogs\/SECRET/.test(displayActivity(l)));
 assert.match(displayActivity({action:'recipe',subAction:'activeToggle',message:'Recipe inactive — 치킨',details:{active:false,recipeName:'치킨'}}),/레시피 사용 중지 · 치킨/);
});
test('cancel selector keeps exact reference values but shows bread count, time, staff and list ordinal',async()=>{
 const e=await environment();const {sourceLabel}=await e.load('src/utils/movementForm.js');
 const a=sourceLabel('breadPanLogs',{id:'SECRET',date:'2026-11-05',qty:4,type:'incoming',staffName:'담당'},2);
 assert.match(a,/4개/);assert.ok(!/4kg|SECRET/.test(a));assert.match(a,/담당.*목록 3번/);
});
test('date jump reads the requested date including general logs older than 10 days; no acknowledge/write',async()=>{
 const e=await pageEnvironment('main',{instrument:'\nexport {getDisplayLogMessage,renderModalLogList}; export function setSearch(value){modalSearch=value;}'});try{
  e.state.rows.activityLogs=[log,{...log,id:'later',date:e.today}];
  await e.page.showClosingLogsModal(log.date,6);
  const modal=e.document.getElementById('modalOverlay');
  assert.match(modal.textContent,/2026-08-13 미확인 기록/);assert.match(modal.textContent,/4,000장/);
  assert.equal(modal.querySelectorAll('[data-modal-log-act=ack]').length,1);
  assert.equal(modal.querySelector('[data-modal-log-act=ack]').dataset.logId,log.id);
  e.page.setSearch('고양이 덕포켓');assert.ok(!e.page.renderModalLogList().includes('검색 결과 없음'));
  assert.equal(e.state.commits.length,0);assert.equal(e.state.rows.activityLogs[0].acknowledged,false);
 }finally{await e.cleanup()}
});
test('requesting a different date with no pending record does not show stale rows',async()=>{
 const e=await pageEnvironment('main');try{
  e.state.rows.activityLogs=[log];await e.page.showClosingLogsModal(log.date,6);
  await e.page.showClosingLogsModal('2025-01-01',6);
  assert.match(e.document.getElementById('modalOverlay').textContent,/남은 미확인 기록이 없습니다/);
  assert.equal(e.document.querySelectorAll('[data-modal-log-act=ack]').length,0);
 }finally{await e.cleanup()}
});
test('recovery display resolves names and hides identifiers in an escaped support disclosure',()=>{
 const request={operationId:'OP_SECRET',mode:'edit',lines:[{productId:'P_SECRET',lotKey:'L_SECRET',qty:4}],reason:'실사'};
 const text=correctionSummary(request,{lots:[{productId:'P_SECRET',lotKey:'L_SECRET',productName:'치킨 <img>',unit:'box'}],createdAt:'2026-11-06T00:00:00Z'});
 assert.match(text,/치킨 &lt;img&gt; · 4박스/);assert.ok(!text.split('<details')[0].includes('SECRET'));assert.match(text,/문의용 번호 보기/);
});
test('server codes translate without encouraging duplicate submissions or changing Korean outcomes',()=>{
 assert.ok(!staffError({code:'permission-denied',message:'Missing or insufficient permissions.'}).includes('permission-denied'));
 assert.match(staffError({code:'outcome-unknown',message:'Unknown'}),/중복/);
 assert.equal(staffError(new Error('저장은 완료됐지만 목록을 다시 읽지 못했습니다.')),'저장은 완료됐지만 목록을 다시 읽지 못했습니다.');
});
test('staff confirm payload omits raw paths without changing source identity or target',()=>{
 const issue={title:'닭 입고 수량 확인',key:'private-source-key',kind:'quantity',target:'meat',evidence:{source:'meatLogs/SECRET',date:log.date,qty:4,unit:'kg',baseline:40,samples:8}};
 const p=confirmPayload(issue,{uid:'test',name:'담당'},log.date,'op');
 assert.match(p.body,/수량: 4kg/);assert.ok(!p.body.includes('meatLogs/'));assert.equal(p.statsSource.key,issue.key);assert.match(p.linkUrl,/#meat$/);
});
