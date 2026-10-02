import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

for(const action of ['edit','cancel'])for(const closed of [false,true])test(`schedule ${action} button opens only for an unclosed date (${closed})`,async()=>{
 const e=await pageEnvironment('schedule',{instantRoutes:['schedule']});
 try{
  e.state.rows.schedules=[{id:'sc1',date:e.today,type:'bag',itemId:'b1',itemNameSnapshot:'검증 봉투',orderedQty:2,orderedUnit:'박스',status:'scheduled'}];
  e.state.rows.closings=closed?[{id:e.today,status:'closed'}]:[];
  await e.page.renderSchedule();
  await e.fire('.btn-'+action+'-schedule');
  const save=e.document.getElementById(action==='edit'?'btnSaveSchedule':'btnSaveCancelSchedule');
  assert.equal(Boolean(save),!closed,e.alerts.join('\n'));
  assert.equal(e.state.writes.length,0);
  if(closed)assert.ok(e.alerts.some(message=>message.includes('마감된 날짜')));
 }finally{await e.cleanup();}
});

