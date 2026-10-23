import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

async function bagForm(){
 const e=await pageEnvironment('bag',{instrument:'\nexport {showBagAdjustModal,showBagIncomingModal};'});
 await e.page.renderBag();return e;
}
test('adjustment requires classification; cancel requires an exact original and fills its inverse',async()=>{
 const e=await bagForm();try{
  e.state.rows.bagLogs=[{id:'original',bagTypeId:'b1',type:'incoming',date:e.today,qty:20,staffName:'검증',note:'기존 입고'}];
  e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);
  assert.equal(e.document.querySelector('#movement_source_group').style.display,'none');
  const form=await e.load('src/utils/movementForm.js');
  let delta;const get=form.bindMovementForm({db:{},name:'bagLogs',filter:{bagTypeId:'b1'},onCancel:n=>{delta=n;},reasonInput:e.document.querySelector('#m_reason')});
  assert.throws(get,/처리 구분/);
  e.fill('#movement_kind','cancel');await e.fire('#movement_kind','change');
  assert.throws(get,/원본/);assert.match(e.document.querySelector('#movement_source').textContent,/original/);
  e.fill('#movement_source','original');await e.fire('#movement_source','change');assert.equal(delta,-20);
  e.fill('#m_reason','중복 입력 취소');assert.equal(get().cancelOf,'original');assert.equal(get().reason,'중복 입력 취소');
  assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
test('incoming offers receipt or test; a test saves a zero movement without changing inventory',async()=>{
 const e=await bagForm();try{
  e.page.showBagIncomingModal(e.state.rows.bagTypes[0]);
  const select=e.document.querySelector('#movement_kind');assert.equal(select.value,'receipt');
  assert(select.querySelector('option[value="cancel"]').hasAttribute('disabled'));
  e.fill('#movement_kind','test');e.fill('#movement_reason','입력 동작 테스트');e.fill('#m_qty','20');
  const staff=e.document.querySelector('#m_staff');staff.innerHTML='<option value="검증" selected>검증</option>';
  await e.fire('#btnSaveBagIncoming');
  assert.equal(e.state.rows.bagTypes[0].currentQty,100,e.alerts.join('\n'));
  assert.equal(e.state.rows.bagLogs.at(-1).manualMovement.kind,'test');assert.equal(e.state.rows.bagLogs.at(-1).qty,0);
 }finally{await e.cleanup();}
});
test('original lookup failure cannot be submitted as a cancellation',async()=>{
 const e=await bagForm();try{
  e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);
  const form=await e.load('src/utils/movementForm.js');const get=form.bindMovementForm({db:{},name:'notAllowed',filter:{}});
  e.fill('#movement_kind','cancel');await e.fire('#movement_kind','change');
  assert.throws(get,/원본/);assert.match(e.document.querySelector('#movement_source').textContent,/조회 실패/);assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
