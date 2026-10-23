import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pageEnvironment} from './helpers/pageDom.mjs';
const title='고양이 검증 큐브',staff='검증 담당자';
const sepRows=()=>[{id:'a',date:'2026-09-12',productName:title,stockType:'separated',remaining:.2,initialQty:.2,closed:false},{id:'b',date:'2026-09-13',productName:title,stockType:'separated',remaining:.8,initialQty:.8,closed:false}];
async function sep(rows=sepRows()) {
 const e=await pageEnvironment('frozenSep',{instantRoutes:process.env.FROZEN_WORKFLOW_INSTANT==='1'?['frozenSep']:[],instrument:'\nexport {showAdjustModal,showIncomingModal,showSeparateModal,showOutModal};'});
 e.state.rows.frozenSeparation=structuredClone(rows);e.state.rows.frozenSeparationLogs=[{id:'historical',date:'2026-09-12',productName:title,qty:1,type:'incoming',toStockType:'separated'}];
 e.state.rows.confirmRequests=[{id:'protected',acknowledged:true,dialogue:[{text:'기존 대화'}]}];
 await e.page.renderFrozenSep();return e;
}
function adjust(e,{mode='delta',qty=.5,direction='minus',product=title,type='separated'}={}) {
 e.page.showAdjustModal(e.state.rows.frozenSeparation.filter(s=>!s.closed));
 e.fill('#m_product',product);e.fill('#m_stockType',type);e.fill('#m_entryMode',mode);e.fill('#m_adjustType',direction);e.fill('#m_qty',qty);e.fill('#m_staff',staff);e.fill('#m_reason','실사 확인');
}
const total=e=>e.state.rows.frozenSeparation.filter(s=>!s.closed).reduce((n,s)=>n+s.remaining,0);
const preserved=e=>JSON.stringify({confirm:e.state.rows.confirmRequests,history:e.state.rows.frozenSeparationLogs[0],other:e.state.rows.meatStocks});

test('aggregate adjustment consumes FIFO across lots atomically and preserves prior history/confirm',async()=>{
 const e=await sep();try{const before=preserved(e);adjust(e);await e.fire('#m_qty','input');assert.match(e.document.querySelector('#m_adjustPreview').textContent,/현재 잔량 1개 → 조정 후 0.5개/);await e.fire('#btnSaveAdjust');
 assert.equal(total(e),.5,e.alerts.join('\n'));assert.equal(e.state.rows.frozenSeparation[0].remaining,0);assert.equal(e.state.rows.frozenSeparation[1].remaining,.5);assert.equal(e.state.rows.frozenSeparationLogs.at(-1).qty,-.5);assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,4);assert.equal(preserved(e),before);assert.deepEqual(e.alerts,[]);
 }finally{await e.cleanup();}
});
for(const qty of [0,.4,1,1.5])test(`actual count ${qty} calculates exact delta, including zero/no-change`,async()=>{
 const e=await sep();try{adjust(e,{mode:'actual',qty});await e.fire('#btnSaveAdjust');assert.equal(total(e),qty,e.alerts.join('\n'));assert.equal(e.state.rows.frozenSeparationLogs.length,qty===1?1:2);if(qty!==1)assert.equal(e.state.rows.frozenSeparationLogs.at(-1).qty,qty-1);assert.deepEqual(e.alerts,[]);}finally{await e.cleanup();}
});
test('zero balance product can be corrected without changing its closed original lot',async()=>{
 const e=await sep([{id:'closed',date:'2026-09-10',productName:title,stockType:'separated',remaining:0,initialQty:2,closed:true}]);try{
 const original=JSON.stringify(e.state.rows.frozenSeparation[0]);adjust(e,{mode:'actual',qty:.3});assert([...e.document.querySelector('#m_product').options].some(o=>o.value===title));await e.fire('#btnSaveAdjust');assert.equal(total(e),.3,e.alerts.join('\n'));assert.equal(JSON.stringify(e.state.rows.frozenSeparation[0]),original);assert.equal(e.state.rows.frozenSeparationLogs.at(-1).type,'adjust');
 }finally{await e.cleanup();}
});
test('negative/blank/missing reason/closed date still block adjustment and preserve entered values',async()=>{
 for(const scenario of ['shortage','blank','reason','closed']){
 const e=await sep();try{if(scenario==='closed'){e.state.rows.closings.push({id:e.today,status:'closed'});await e.page.renderFrozenSep({force:true});}adjust(e,{qty:scenario==='shortage'?2:.5});if(scenario==='blank')e.fill('#m_qty','');if(scenario==='reason')e.fill('#m_reason','');await e.fire('#btnSaveAdjust');assert.equal(e.state.writes.length,0,scenario);assert(e.document.querySelector('#m_qty'));assert(e.alerts.length>0,scenario);}finally{await e.cleanup();}}
});
test('concurrent stock changes block stale counted balances',async()=>{
 const e=await sep();try{adjust(e,{mode:'actual',qty:0});e.state.rows.frozenSeparation[1].remaining=.7;await e.fire('#btnSaveAdjust');assert.equal(e.state.writes.length,0);assert.equal(e.document.querySelector('#m_qty').value,'0');}finally{await e.cleanup();}
});
for(const failure of ['before','after'])test(`adjustment ${failure} commit failure cannot partially apply or replay`,async()=>{
 const e=await sep();try{adjust(e);const original=preserved(e);e.state.failNextCommit=failure;await e.fire('#btnSaveAdjust');assert.equal(total(e),failure==='before'?1:.5);assert.equal(e.state.rows.frozenSeparationLogs.length,failure==='before'?1:2);const writes=e.state.writes.length;await e.fire('#btnSaveAdjust');assert.equal(e.state.writes.length,writes);assert.equal(preserved(e),original);}finally{await e.cleanup();}
});
test('double-click adjustment writes only one log',async()=>{
 const e=await sep();try{adjust(e);await Promise.all([e.fire('#btnSaveAdjust'),e.fire('#btnSaveAdjust')]);assert.equal(total(e),.5);assert.equal(e.state.rows.frozenSeparationLogs.length,2);assert.equal(e.state.commits.length,1);}finally{await e.cleanup();}
});
for(const [method,button,type,productField]of [['showIncomingModal','btnSaveIncoming','notSeparated','m_name'],['showSeparateModal','btnSaveSeparate','notSeparated','m_product'],['showOutModal','btnSaveOut','separated','m_product']])test(`${method}: opt-in continuation retains date/staff, clears product/quantity, and saves only once`,async()=>{
 const rows=[{id:'source',date:'2026-09-12',productName:title,stockType:type,remaining:2,initialQty:2,closed:false}];const e=await sep(rows);try{
 e.page[method](e.state.rows.frozenSeparation);assert(!e.document.querySelector('#m_continue').checked);e.fill('#'+productField,title);e.fill('#m_qty',.2);e.fill('#m_date','2026-09-13');e.fill('#m_staff',staff);e.document.querySelector('#m_continue').checked=true;
 await e.fire('#'+button);assert.equal(e.state.rows.frozenSeparationLogs.length,2,e.alerts.join('\n'));assert.equal(e.document.querySelector('#m_date').value,'2026-09-13');assert.equal(e.document.querySelector('#m_staff').value,staff);assert.equal(e.document.querySelector('#'+productField).value,'');assert.equal(e.document.querySelector('#m_qty').value,'');assert(e.document.querySelector('#m_continue').checked);assert.deepEqual(e.alerts,[]);
 e.fill('#'+productField,title);e.fill('#m_qty',.1);e.document.querySelector('#m_continue').checked=false;await e.fire('#'+button);assert.equal(e.state.rows.frozenSeparationLogs.length,3);assert.equal(e.document.querySelector('#modalOverlay'),null);
 }finally{await e.cleanup();}
});
test('failed continuation never reopens or resubmits',async()=>{
 const e=await sep();try{e.page.showIncomingModal(e.state.rows.frozenSeparation);e.fill('#m_name',title);e.fill('#m_qty',.2);e.fill('#m_staff',staff);e.document.querySelector('#m_continue').checked=true;e.state.failNextCommit='after';await e.fire('#btnSaveIncoming');assert.equal(e.document.querySelector('#m_name').value,title);const count=e.state.writes.length;await e.fire('#btnSaveIncoming');assert.equal(e.state.writes.length,count);assert.equal(e.state.rows.frozenSeparationLogs.length,1);}finally{await e.cleanup();}
});
async function pan(seed=()=>{},role='office'){
 const e=await pageEnvironment('frozenPan',{role,instantRoutes:process.env.FROZEN_WORKFLOW_INSTANT==='1'?['frozenPan']:[],instrument:'\nexport {showWorkRowModal,handleWorkRowSave,showFrozenPanAdjustModal,showBreadPanAdjustModal,cancelOrder,showStaffPickerModal};'});seed(e);await e.page.renderFrozenPan();return e;
}
test('preprocessing recipe change clears measured output and rejects blank/zero/fraction distinctly',async()=>{
 const e=await pan(e=>{e.state.rows.recipes.push({...e.state.rows.recipes[1],id:'fd2',name:'두번째'});e.state.rows.breadPanLots=[{id:'b1',date:e.today,productName:title,remaining:9},{id:'b2',date:e.today,productName:'고양이 두번째',remaining:18}];});try{
 await e.page.showWorkRowModal([],[]);const r=e.document.querySelector('.work-item'),select=r.querySelector('.wi-name');select.value=title;select.onchange();r.querySelector('.wi-actual').value='4';select.value='고양이 두번째';select.onchange();assert.equal(r.querySelector('.wi-actual').value,'');assert.equal(r.querySelector('.wi-expected').value,'8');assert.equal(r.querySelector('.wi-actual').getAttribute('min'),'1');e.fill('#m_staff',staff);
 for(const value of ['',0,2.5]){r.querySelector('.wi-actual').value=String(value);await e.page.handleWorkRowSave();assert.equal(e.state.writes.length,0);assert.match(e.alerts.at(-1),value===''?/입력해주세요/:/1 이상의 정수/);}
 }finally{await e.cleanup();}
});
for(const [stock,show,log]of [['frozenPanLots','showFrozenPanAdjustModal','frozenPanLogs'],['breadPanLots','showBreadPanAdjustModal','breadPanLogs']])test(`${stock}: zero-lot reconciliation keeps original fields and prior log`,async()=>{
 const e=await pan(e=>{e.state.rows[stock]=[{id:'zero',date:'2026-09-10',productName:title,initialQty:10,remaining:0,closed:true,note:'original'}];e.state.rows[log]=[{id:'old',type:'incoming',qty:10}];});try{
 await e.page[show]();e.fill('#movement_kind','reconciliation');await e.fire('#movement_kind','change');e.fill('#m_lot','zero');e.fill('#m_adjustType','plus');e.fill('#m_qty','1');e.fill('#m_staff',staff);e.fill('#m_reason','실사 확인');await e.fire(stock==='frozenPanLots'?'#btnSaveFrozenPanAdjust':'#btnSaveBreadPanAdjust');assert.equal(e.state.rows[stock][0].remaining,1,e.alerts.join('\n'));assert.equal(e.state.rows[stock][0].initialQty,10);assert.equal(e.state.rows[stock][0].note,'original');assert.equal(e.state.rows[log][0].qty,10);assert.equal(e.state.rows[log].at(-1).manualMovement.kind,'reconciliation');assert.equal(e.state.commits.length,1);
 }finally{await e.cleanup();}
});
const cancelSeed=e=>{e.state.rows.frozenPanStock[0].status='confirmed';e.state.rows.frozenPanStock[0].ledgerId='ledger';e.state.rows.frozenPanLots=[{id:'lot1',remaining:7,date:e.today,productName:title},{id:'lot2',remaining:6,date:e.today,productName:title}];e.state.rows.stockLedger=[{id:'ledger',status:'active',items:[{collection:'frozenPanLots',docId:'lot1',field:'remaining',before:10,after:7,delta:-3},{collection:'frozenPanLots',docId:'lot2',field:'remaining',before:10,after:8,delta:-2}]}];};
test('combined cancellation requires both staff and reason in one modal',async()=>{
 const e=await pan();try{const pending=e.page.showStaffPickerModal({title:'발주 확인 취소',message:'재고 복원',groups:['office'],requireReason:true});await new Promise(r=>setTimeout(r,0));await e.fire('#sp_ok');assert(e.document.querySelector('#sp_reason'));e.fill('#sp_staff',staff);await e.fire('#sp_ok');assert.match(e.alerts.at(-1),/사유/);e.fill('#sp_reason','일정 변경');await e.fire('#sp_ok');const result=await pending;assert.equal(result.staff,staff);assert.equal(result.reason,'일정 변경');assert.equal(e.state.writes.length,0);}finally{await e.cleanup();}
});
for(const allow of [false,true])test(`changed-stock cancellation prompts once before any writes (${allow})`,async()=>{
 const e=await pan(cancelSeed);try{const prompts=[];e.cache.get(resolve('src/utils/modal.js')).setExport('showConfirmModal',async options=>{assert.equal(e.state.writes.length,0);prompts.push(options);return allow;});await e.page.cancelOrder(e.state.rows.frozenPanStock[0],e.state.rows.frozenPanLots,staff,'일정 변경');assert.equal(prompts.length,1);assert.match(prompts[0].title,/재고 변경/);assert.doesNotMatch(prompts[0].message,/로그아웃/);assert.equal(e.state.commits.length,allow?1:0);assert.equal(e.state.rows.frozenPanLots[0].remaining,allow?10:7);assert.equal(e.state.rows.frozenPanLots[1].remaining,allow?8:6);if(allow){assert.equal(e.state.rows.stockLedger[0].status,'rolledBack');assert.equal(e.state.rows.activityLogs.length,1);const count=e.state.writes.length;await e.page.cancelOrder(e.state.rows.frozenPanStock[0],e.state.rows.frozenPanLots,staff,'일정 변경');assert.equal(e.state.writes.length,count);}
 }finally{await e.cleanup();}
});
for(const failure of ['before','after'])test(`order cancel ${failure} failure is atomic and cannot duplicate restoration`,async()=>{
 const e=await pan(cancelSeed);try{e.state.failNextCommit=failure;const row=structuredClone(e.state.rows.frozenPanStock[0]);await e.page.cancelOrder(row,e.state.rows.frozenPanLots,staff,'취소');assert.equal(e.state.rows.frozenPanLots[0].remaining,failure==='before'?7:10);assert.equal(e.state.rows.stockLedger[0].status,failure==='before'?'active':'rolledBack');const count=e.state.writes.length;await e.page.cancelOrder(row,e.state.rows.frozenPanLots,staff,'취소');assert.equal(e.state.writes.length,count);}finally{await e.cleanup();}
});
test('production role cannot cancel a confirmed order',async()=>{const e=await pan(cancelSeed,'production');try{await e.page.cancelOrder(e.state.rows.frozenPanStock[0],e.state.rows.frozenPanLots,staff,'취소');assert.equal(e.state.writes.length,0);}finally{await e.cleanup();}});


test('manual correction defaults to counted balance without a second direction choice',async()=>{
 const e=await sep();try{e.page.showAdjustModal(e.state.rows.frozenSeparation);assert.equal(e.document.querySelector('#m_entryMode').value,'actual');assert.equal(e.document.querySelector('#m_directionGroup').style.display,'none');assert.match(e.document.querySelector('#m_qtyLabel').textContent,/실제로 센 잔량/);assert.equal(e.state.writes.length,0);}finally{await e.cleanup();}
});
