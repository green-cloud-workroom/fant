import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {supplyEvents} from '../src/services/statsLogic.js';
const staff='검증 담당자';
const instrument='\nexport {showScheduleModal,showCompleteModal,showCancelScheduleModal};';
const base={id:'sc1',date:'2026-09-14',type:'bag',itemId:'b1',itemNameSnapshot:'검증 봉투',orderedQty:2,orderedUnit:'박스',status:'scheduled',orderStaffName:staff,createdAt:new Date('2026-09-01T00:00:00+09:00')};
async function setup(patch={},role='office'){
 const e=await pageEnvironment('schedule',{role,instrument,instantRoutes:process.env.SCHEDULE_INSTANT==='1'?['schedule']:[]});
 e.state.rows.schedules=[{...base,...patch}];
 e.state.rows.confirmRequests=[{id:'protected',acknowledged:true,dialogue:[{text:'기존 대화'}]}];
 e.state.rows.bagLogs=[{id:'old',type:'incoming',date:'2026-09-01',bagTypeId:'b1',qty:100}];
 await e.page.renderSchedule();return e;
}
const guard=e=>JSON.stringify({confirms:e.state.rows.confirmRequests,history:e.state.rows.bagLogs[0],other:e.state.rows.meatStocks.filter(s=>s.id==='ms1')});
function complete(e,qty=20,unit='장',date=e.today){
 e.page.showCompleteModal(e.state.rows.schedules[0]);e.fill('#m_actual',qty);e.fill('#m_actual_unit',unit);e.fill('#m_receipt_date',date);e.fill('#m_staff',staff);
}
function confirmations(e,approve=true){const seen=[];e.cache.get(resolve('src/utils/modal.js')).setExport('showConfirmModal',async x=>{seen.push(x);return approve;});return seen;}

test('manage buttons match unchanged office/admin write permissions; production can still complete',async()=>{
 for(const role of ['admin','office','production']){
  const e=await setup({},role);try{
   const manage=role!=='production';assert.equal(!!e.document.getElementById('btnAddSchedule'),manage);
   for(const action of ['edit','cancel'])assert.equal(!!e.document.querySelector('.btn-'+action+'-schedule'),manage);
   assert.ok(e.document.querySelector('.btn-complete'));
   if(role==='production'){complete(e);await e.fire('#btnSaveComplete');assert.equal(e.state.rows.schedules[0].status,'completed',e.alerts.join('\n'));}
  }finally{await e.cleanup();}
 }
});

for(const [type,orderedQty,orderedUnit,actual,actualUnit,expected] of [
 ['bag',2,'박스',20,'장',20],['bag',20,'장',2,'박스',20],
 ['egg',2,'판',60,'개',60],['egg',60,'개',2,'판',60],
 ['meat',2,'kg',2000,'g',2000],['meat',2000,'g',2,'kg',2000],
 ['meat',2,'마리',2,'kg',2000],['meat',2,'마리',2000,'g',2000],
])test(`equivalent ${type} ${orderedUnit} -> ${actualUnit} adds once without difference prompt`,async()=>{
 const e=await setup({type,orderedQty,orderedUnit,itemId:type==='egg'?null:type==='meat'?'m1':'b1',orderedUnitGrams:1000});
 try{const before=guard(e),seen=confirmations(e);complete(e,actual,actualUnit);await e.fire('#btnSaveComplete');
  assert.equal(e.state.rows.schedules[0].status,'completed',e.alerts.join('\n'));assert.equal(seen.length,0);assert.deepEqual(e.alerts,[]);
  const name=type==='meat'?'meatLogs':type==='bag'?'bagLogs':'eggLogs',log=e.state.rows[name].at(-1);
  assert.equal(log[type==='meat'?'delta':'qty'],expected);assert.equal(e.state.commits.length,1);assert.equal(guard(e),before);
  assert.equal(e.state.rows.activityLogs.at(-1).details.hasDiff,false);
  assert.equal(e.state.writes.some(p=>p.startsWith('confirmRequests/')),false);
 }finally{await e.cleanup();}
});

test('actual difference prompts once; declining preserves input and writes nothing',async()=>{
 const e=await setup();try{const seen=confirmations(e,false);complete(e,19);await e.fire('#btnSaveComplete');assert.equal(seen.length,1);assert.equal(e.state.writes.length,0);assert.equal(e.document.getElementById('m_actual').value,'19');}finally{await e.cleanup();}
});

test('unknown count conversion accepts kg but comparison remains unknown',async()=>{
 const e=await setup({type:'meat',itemId:'m1',orderedUnit:'마리',orderedUnitGrams:null});try{
  complete(e,1.25,'kg');await e.fire('#btnSaveComplete');assert.equal(e.state.rows.meatLogs.at(-1).delta,1250,e.alerts.join('\n'));assert.equal(e.state.rows.activityLogs.at(-1).details.hasDiff,null);
 }finally{await e.cleanup();}
});

test('missing box conversion never assumes one piece; actual pieces can be entered',async()=>{
 const e=await setup();try{
  delete e.state.rows.bagTypes[0].piecesPerBox;await e.page.renderSchedule({force:true});complete(e,2,'박스');await e.fire('#btnSaveComplete');assert.equal(e.state.writes.length,0);assert.match(e.alerts.at(-1),/박스당/);
  e.fill('#m_actual',20);e.fill('#m_actual_unit','장');await e.fire('#btnSaveComplete');assert.equal(e.state.rows.bagTypes[0].currentQty,120);assert.equal(e.state.rows.activityLogs.at(-1).details.hasDiff,null);
 }finally{await e.cleanup();}
});

test('selected actual date is shared by receipt, ledger, activity and statistics; processed timestamp stays separate',async()=>{
 const e=await setup();try{complete(e,20,'장','2026-09-13');await e.fire('#btnSaveComplete');
  assert.equal(e.state.rows.schedules[0].receiptDate,'2026-09-13',e.alerts.join('\n'));
  for(const name of ['bagLogs','stockLedger','activityLogs'])assert.equal(e.state.rows[name].at(-1).date,'2026-09-13');
  assert.ok(e.state.rows.schedules[0].completedAt);
  const projection=supplyEvents(e.state.rows,{startDate:'2026-09-01',endDate:e.today,today:e.today});
  assert.equal(projection.registrations[0].date,'2026-09-13');assert.equal(projection.registrations[0].processing,12);
  assert.match(e.document.getElementById('doneSection').textContent,/2026-09-13/);
 }finally{await e.cleanup();}
});

for(const scenario of ['future','invalid','blank','closed','negative','fractional'])test(`${scenario} receipt is blocked with entered values retained`,async()=>{
 const e=await setup();try{
  const date=scenario==='future'?'2026-09-15':scenario==='invalid'?'2026-02-30':scenario==='blank'?'':'2026-09-13';
  if(scenario==='closed'){e.state.rows.closings=[{id:date,status:'closed'}];await e.page.renderSchedule({force:true});}
  complete(e,scenario==='negative'?-1:scenario==='fractional'?1.5:20,'장',date);await e.fire('#btnSaveComplete');
  assert.equal(e.state.writes.length,0);assert.ok(e.document.getElementById('m_actual'));assert.ok(e.alerts.length);
 }finally{await e.cleanup();}
});

test('successful continuation retains only selected context, clears quantity/product and shows nonblocking status',async()=>{
 const e=await setup();try{await e.page.showScheduleModal();e.fill('#m_date','2026-09-21');e.fill('#m_type','meat');e.context.updateScheduleItem();e.fill('#m_item','m1');e.fill('#m_qty',5);e.fill('#m_unit','kg');e.fill('#m_staff',staff);e.document.getElementById('m_continue').checked=true;
  assert.match(e.document.getElementById('m_staff').parentElement.textContent,/담당자 \*/);await e.fire('#btnSaveSchedule');
  assert.deepEqual(e.alerts,[]);assert.ok(e.document.getElementById('actionStatus'));
  assert.equal(e.document.getElementById('m_date').value,'2026-09-21');assert.equal(e.document.getElementById('m_type').value,'meat');assert.equal(e.document.getElementById('m_unit').value,'kg');assert.equal(e.document.getElementById('m_staff').value,staff);
  assert.equal(e.document.getElementById('m_item').value,'');assert.equal(e.document.getElementById('m_qty').value,'');assert.equal(e.document.getElementById('m_unit_grams').value,'');
  assert.equal(e.state.rows.schedules.length,2);
 }finally{await e.cleanup();}
});

test('default grams follow selected item, stay editable, and never carry to another item',async()=>{
 const e=await setup();try{e.state.rows.meatTypes.push({id:'m2',name:'두번째 원료',active:true,defaultUnitWeightG:500});await e.page.renderSchedule({force:true});await e.page.showScheduleModal();e.fill('#m_type','meat');e.context.updateScheduleItem();e.fill('#m_item','m1');e.fill('#m_unit','마리');await e.fire('#m_unit','change');assert.equal(e.document.getElementById('m_unit_grams').value,'1000');
  e.fill('#m_unit_grams',800);await e.fire('#m_unit','change');assert.equal(e.document.getElementById('m_unit_grams').value,'800');
  e.fill('#m_item','m2');await e.fire('#m_item','change');assert.equal(e.document.getElementById('m_unit_grams').value,'500');
 }finally{await e.cleanup();}
});

for(const mode of ['edit','cancel'])test(`${mode} success uses status; historical confirmations and logs stay unchanged`,async()=>{
 const e=await setup();try{const before=guard(e);if(mode==='edit'){await e.page.showScheduleModal(e.state.rows.schedules[0]);e.fill('#m_qty',3);await e.fire('#btnSaveSchedule');}else{e.page.showCancelScheduleModal(e.state.rows.schedules[0]);e.fill('#m_reason','발주 취소');e.fill('#m_staff',staff);await e.fire('#btnSaveCancelSchedule');}
  assert.deepEqual(e.alerts,[]);assert.ok(e.document.getElementById('actionStatus'));assert.equal(guard(e),before);
 }finally{await e.cleanup();}
});

test('acknowledgement lost and repeated completion never add another receipt or notification',async()=>{
 const e=await setup();try{const before=guard(e);complete(e);e.state.failNextCommit='after';await e.fire('#btnSaveComplete');const writes=e.state.writes.length;
  assert.equal(e.state.rows.bagTypes[0].currentQty,120);await e.fire('#btnSaveComplete');assert.equal(e.state.writes.length,writes);assert.equal(e.state.rows.bagLogs.length,2);assert.equal(guard(e),before);
 }finally{await e.cleanup();}
});

test('test entry keeps stock and original schedule pending and preserves old history/confirmation',async()=>{
 const e=await setup();try{const before=guard(e);complete(e);e.fill('#movement_kind','test');await e.fire('#movement_kind','change');e.fill('#m_memo','테스트');await e.fire('#btnSaveComplete');
  assert.equal(e.state.rows.bagTypes[0].currentQty,100);assert.equal(e.state.rows.schedules[0].status,'scheduled');assert.equal(guard(e),before);assert.equal(e.state.rows.bagLogs.at(-1).manualMovement.kind,'test');
 }finally{await e.cleanup();}
});

for(const failure of ['before','after'])test(`registration ${failure} commit failure retains form without continuation or resend`,async()=>{
 const e=await setup();try{await e.page.showScheduleModal();e.fill('#m_date','2026-09-21');e.fill('#m_type','egg');e.context.updateScheduleItem();e.fill('#m_qty',30);e.fill('#m_staff',staff);e.document.getElementById('m_continue').checked=true;e.state.failNextCommit=failure;
  await e.fire('#btnSaveSchedule');const writes=e.state.writes.length;assert.equal(e.document.getElementById('m_qty').value,'30');assert.equal(e.document.getElementById('actionStatus'),null);await e.fire('#btnSaveSchedule');assert.equal(e.state.writes.length,writes);assert.equal(e.state.rows.schedules.length,failure==='after'?2:1);
 }finally{await e.cleanup();}
});

test('unselected continuation closes after registration and duplicate same-day item stays blocked',async()=>{
 const e=await setup();try{await e.page.showScheduleModal();e.fill('#m_date',e.today);e.fill('#m_type','bag');e.context.updateScheduleItem();e.fill('#m_item','b1');e.fill('#m_qty',2);e.fill('#m_staff',staff);await e.fire('#btnSaveSchedule');assert.equal(e.state.writes.length,0);assert.match(e.alerts.at(-1),/중복 등록/);
  e.fill('#m_type','egg');e.context.updateScheduleItem();await e.fire('#btnSaveSchedule');assert.equal(e.state.rows.schedules.length,2);assert.equal(e.document.getElementById('modalOverlay'),null);
 }finally{await e.cleanup();}
});
