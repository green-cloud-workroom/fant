import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const staff=(e,id='#m_staff')=>e.document.querySelector(id).innerHTML='<option selected value="검증">검증</option>';
async function scheduleCase(actualUnit='g',kind='receipt'){
 const e=await pageEnvironment('schedule',{instrument:'\nexport {showCompleteModal};'});
 const row={id:'s1',status:'scheduled',date:e.today,type:'meat',itemId:'m1',itemNameSnapshot:'닭',orderedQty:10,orderedUnit:'마리',orderedUnitGrams:null};
 e.state.rows.schedules=[row];await e.page.renderSchedule();e.page.showCompleteModal(row);
 e.fill('#m_actual',actualUnit==='g'?'12345':'10');e.fill('#m_actual_unit',actualUnit);staff(e);
 e.fill('#movement_kind',kind);await e.fire('#movement_kind','change');
 if(kind==='test')e.fill('#m_memo','입력 테스트');return e;
}
test('actual grams without per-piece weight save measured stock and unknown comparison, retry cannot duplicate receipt',async()=>{
 const e=await scheduleCase();try{
 const original=JSON.stringify(e.state.rows.meatStocks[0]);await e.fire('#btnSaveComplete');
 assert.deepEqual(e.alerts,[]);assert.equal(e.document.querySelector('#actionStatus').textContent,'완료 처리되었습니다!');
 const log=e.state.rows.meatLogs.at(-1);assert.equal(log.delta,12345);assert.equal(log.manualMovement.kind,'receipt');
 assert.equal(e.state.rows.schedules[0].status,'completed');assert.equal(e.state.rows.schedules[0].actualQtyG,12345);
 const activity=e.state.rows.activityLogs.at(-1);assert.equal(activity.details.comparisonAvailable,false);assert.equal(activity.details.hasDiff,null);
 assert.match(activity.message,/비교 불가/);assert.equal(JSON.stringify(e.state.rows.meatStocks[0]),original);
 const count=e.state.rows.meatLogs.length;
 e.page.showCompleteModal({...e.state.rows.schedules[0],status:'scheduled'});e.fill('#m_actual','12345');e.fill('#m_actual_unit','g');staff(e);
 await e.fire('#btnSaveComplete');assert.equal(e.state.rows.meatLogs.length,count);
 }finally{await e.cleanup();}
});
test('piece-count input still requires conversion; test grams never change stock or complete schedule',async()=>{
 const e=await scheduleCase('마리');try{await e.fire('#btnSaveComplete');assert.match(e.alerts[0],/1마리당/);assert.equal(e.state.writes.length,0);}finally{await e.cleanup();}
 const t=await scheduleCase('g','test');try{const before=JSON.stringify(t.state.rows.meatStocks);await t.fire('#btnSaveComplete');assert.equal(JSON.stringify(t.state.rows.meatStocks),before);assert.equal(t.state.rows.schedules[0].status,'scheduled');assert.equal(t.state.rows.meatLogs.at(-1).delta,0);}finally{await t.cleanup();}
});
test('material use accepts a positive quantity, preserves original history and blocks excess use',async()=>{
 const e=await pageEnvironment('meat',{instrument:'\nexport {showAdjustModal};'});
 try{e.state.rows.meatLogs=[{id:'old',delta:10000,date:e.today,meatStockId:'ms1',type:'frozenIncoming'}];const original=JSON.stringify(e.state.rows.meatLogs[0]);
 await e.page.renderMeat();e.page.showAdjustModal('ms1','닭',10000);e.fill('#movement_kind','usage');await e.fire('#movement_kind','change');
 assert.equal(e.document.querySelector('#m_remainingGroup').hidden,true);e.fill('#m_usageQty','10001');staff(e);await e.fire('#btnSaveAdjust');assert.equal(e.state.writes.length,0);
 e.fill('#m_usageQty','2500');await e.fire('#btnSaveAdjust');assert.equal(e.state.rows.meatStocks[0].remaining,7500,e.alerts.join('\n'));
 assert.equal(e.state.rows.meatLogs.at(-1).delta,-2500);assert.equal(JSON.stringify(e.state.rows.meatLogs[0]),original);
 assert.equal(e.document.querySelector('#actionStatus').textContent,'조정 완료!');
 }finally{await e.cleanup();}
});
test('egg uses one memo field, previews remaining count, rejects excess and preserves count correction input',async()=>{
 const e=await pageEnvironment('egg',{instrument:'\nexport {showEggModal};'});
 try{e.state.rows.eggStock=[{id:'global',currentQty:100,minimumQty:0}];await e.page.renderEgg();e.page.showEggModal('out',e.state.rows.eggStock[0]);
 assert.equal(e.document.querySelector('#movement_reason'),null);assert.equal(e.document.querySelector('#m_remainingGroup').style.display,'none');
 e.fill('#m_usageQty','10');await e.fire('#m_usageQty','input');assert.match(e.document.querySelector('#m_outPreview').textContent,/남은 재고: 90개/);assert.equal(e.document.querySelector('#m_outPreview').closest('#m_remainingGroup'),null);
 e.fill('#m_usageQty','101');staff(e);await e.fire('#btnSaveEgg');assert.equal(e.state.writes.length,0);
 e.fill('#movement_kind','reconciliation');await e.fire('#movement_kind','change');assert.equal(e.document.querySelector('#m_usageGroup').hidden,true);
 e.fill('#m_remaining','90');e.fill('#m_note','실사 차이');await e.fire('#btnSaveEgg');assert.equal(e.state.rows.eggStock[0].currentQty,90);assert.equal(e.state.rows.eggLogs.at(-1).manualMovement.kind,'reconciliation');
 }finally{await e.cleanup();}
});
test('additional same-day supplement receipt appends new history and keeps the original unchanged',async()=>{
 const e=await pageEnvironment('supplement',{instrument:'\nexport {renderDateCells,openIncomingModal};'});
 try{e.state.rows.supplementLogs=[{id:'original',type:'in',date:e.today,qty:5,supplementTypeId:'r1_1',staffName:'검증'}];const original=JSON.stringify(e.state.rows.supplementLogs[0]);
 await e.page.renderSupplement();const cell=e.page.renderDateCells(e.state.rows.supplementTypes[0],e.today,false);assert.match(cell,/추가 입고/);assert.match(cell,/supplement-add-in/);
 e.page.openIncomingModal('r1_1','영양제',e.today);e.fill('#sup_in_qty','3');staff(e,'#sup_in_staff');await e.fire('#btnSaveSupIn');
 assert.equal(e.state.rows.supplementStock[0].currentQty,23,e.alerts.join('\n'));assert.equal(e.state.rows.supplementLogs.length,2);assert.equal(JSON.stringify(e.state.rows.supplementLogs[0]),original);
 assert.equal(e.state.rows.supplementLogs[1].manualMovement.kind,'receipt');assert.equal(e.document.querySelector('#actionStatus').textContent,'입고 완료');
 }finally{await e.cleanup();}
});
test('invalid supplement cell input is preserved for correction and produces no write',async()=>{
 const e=await pageEnvironment('supplement',{instrument:'\nexport {handleIncomingCellBlur,handleAdjustCellBlur};'});
 try{await e.page.renderSupplement();for(const fn of ['handleIncomingCellBlur','handleAdjustCellBlur']){
 const input=e.document.createElement('input');input.value='1.5';input.dataset.typeId='r1_1';input.dataset.date=e.today;
 await e.page[fn](input);assert.equal(input.value,'1.5');assert.equal(e.state.writes.length,0);
 }}finally{await e.cleanup();}
});
