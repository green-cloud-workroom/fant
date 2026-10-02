import test from 'node:test';import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const setupReceipt=async()=>{
 const e=await pageEnvironment('frozenProduct',{instrument:'\nexport {showIncomingModal};'});
 await e.page.renderFrozenProduct();await e.page.showIncomingModal(e.state.rows.frozenProducts[0]);
 for(const [id,value]of Object.entries({m_qty:4,m_date:e.today,m_expiry:'2027-09-14',m_staff:'검증 담당자'}))e.fill('#'+id,value);
 return e;
};
test('receipt acknowledgement loss stops the multi-step operation and another click cannot repeat deduction',async()=>{
 const e=await setupReceipt();try{
  e.state.failNextCommit='after';await e.fire('#btnSaveIncoming');const writes=e.state.writes.length;
  assert.equal(e.state.rows.bagTypes[0].currentQty,96);assert.equal(e.state.commits.length,1);
  assert.equal(e.document.querySelector('#m_qty').value,'4');await e.fire('#btnSaveIncoming');
  assert.equal(e.state.writes.length,writes);assert.equal(e.state.rows.frozenLogs?.length||0,0);
 }finally{await e.cleanup();}
});
test('changed product and a closed date stop a receipt before any write',async()=>{
 for(const kind of ['product','closing']){const e=await setupReceipt();try{
  if(kind==='product')e.state.rows.frozenProducts[0].bagTypeId='another';else e.state.rows.closings.push({id:e.today,status:'closed'});
  await e.fire('#btnSaveIncoming');assert.equal(e.state.writes.length,0);assert.equal(e.document.querySelector('#m_qty').value,'4');
 }finally{await e.cleanup();}}
});
test('settings entry performs zero reads; a changed system value is not overwritten',async()=>{
 const e=await pageEnvironment('settings',{instrument:'\nexport {handleNumberBlur};'});
 try{
  await e.page.renderSettings();assert.equal(e.state.reads.length,0);assert.equal(e.document.querySelectorAll('details').length,8);
  const input={value:'60'},values={maxPansPerBatch:45};await e.page.handleNumberBlur(input,{key:'maxPansPerBatch',type:'integer'},values);
  assert.equal(e.state.rows.settings.find(s=>s.id==='systemValues').maxPansPerBatch,60);
  e.state.rows.settings.find(s=>s.id==='systemValues').maxPansPerBatch=90;input.value='75';const count=e.state.writes.length;
  await e.page.handleNumberBlur(input,{key:'maxPansPerBatch',type:'integer'},values);assert.equal(e.state.writes.length,count);assert.equal(e.state.rows.settings.find(s=>s.id==='systemValues').maxPansPerBatch,90);assert.equal(input.value,'75');
 }finally{await e.cleanup();}
});
test('disabled retained reads still validate production role and changed stock before receipt',async()=>{
 const e=await pageEnvironment('frozenProduct',{retained:false,instrument:'\nexport {showIncomingModal};'});
 try{
  await e.page.renderFrozenProduct();const before=e.state.reads.length;await e.page.renderFrozenProduct();assert.ok(e.state.reads.length>before);
  await e.page.showIncomingModal(e.state.rows.frozenProducts[0]);for(const [id,value]of Object.entries({m_qty:4,m_date:e.today,m_expiry:'2027-09-14',m_staff:'검증 담당자'}))e.fill('#'+id,value);
  e.state.rows.frozenProducts[0].bagTypeId='changed';await e.fire('#btnSaveIncoming');assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
