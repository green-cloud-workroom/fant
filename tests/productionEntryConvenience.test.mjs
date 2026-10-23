import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
async function production(){const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});await e.page.renderProduction();await e.page.showProductionForm(null);e.fill('#pf_recipe','r1');await e.fire('#pf_recipe','change');return e;}
test('direct production quantity survives preset switches but resets for another recipe',async()=>{
 const e=await production();try{
 e.fill('#pf_qty_select','custom');await e.fire('#pf_qty_select','change');e.fill('#pf_qty_direct','2.5');await e.fire('#pf_qty_direct','input');
 e.fill('#pf_qty_select','1');await e.fire('#pf_qty_select','change');e.fill('#pf_qty_select','custom');await e.fire('#pf_qty_select','change');
 assert.equal(e.document.querySelector('#pf_qty_direct').value,'2.5');assert.equal(e.state.writes.length,0);
 e.fill('#pf_recipe','fd1');await e.fire('#pf_recipe','change');assert.equal(e.document.querySelector('#pf_qty_direct').value,'');
 }finally{await e.cleanup();}
});
test('opt-in continuation reopens the same production recipe and quantity without creating another production',async()=>{
 const e=await production();try{
 e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');e.document.querySelector('#pf_continue').checked=true;
 await e.fire('#btnSaveProduction');assert.equal(e.state.rows.productions.length,1,e.alerts.join('\n'));assert.equal(e.state.rows.supplementStock[1].currentQty,19);
 assert.equal(e.document.querySelector('#pf_recipe').value,'r1');assert.equal(e.document.querySelector('#pf_qty_select').value,'2');
 assert(e.document.querySelector('#pf_continue').hasAttribute('checked'));assert.equal(e.document.querySelector('#actionStatus').textContent,'저장 완료!');assert.deepEqual(e.alerts,[]);
 const original=JSON.stringify(e.state.rows.productions[0]);
 e.document.querySelector('#pf_continue').checked=false;await e.fire('#btnSaveProduction');
 assert.equal(e.state.rows.productions.length,2);assert.equal(e.state.rows.supplementStock[1].currentQty,18);
 assert.equal(e.document.querySelector('#pf_recipe'),null);assert.equal(e.state.rows.productions[1].recipeId,'r1');
 assert.equal(e.state.rows.productions[0].productionUnitQty,2);assert.equal(e.state.rows.productions[0].id,JSON.parse(original).id);
 }finally{await e.cleanup();}
});
test('continuation retains direct-input mode and default saves still finish the form',async()=>{
 const e=await production();try{
 e.state.rows.recipes[0].usesSupplement=false;await e.page.renderProduction({force:true});await e.page.showProductionForm(null);e.fill('#pf_recipe','r1');await e.fire('#pf_recipe','change');
 e.fill('#pf_qty_select','custom');await e.fire('#pf_qty_select','change');e.fill('#pf_qty_direct','2.5');e.document.querySelector('#pf_continue').checked=true;
 await e.fire('#btnSaveProduction');assert.equal(e.state.rows.productions.length,1);assert.equal(e.document.querySelector('#pf_qty_select').value,'custom');assert.equal(e.document.querySelector('#pf_qty_direct').value,'2.5');
 }finally{await e.cleanup();}
 const d=await production();try{await d.fire('#btnSaveProduction');assert.equal(d.state.rows.productions.length,1);assert.equal(d.document.querySelector('#pf_recipe'),null);}finally{await d.cleanup();}
});
test('failed save never opens a continuation form or automatically retries',async()=>{
 const e=await production();try{
 e.document.querySelector('#pf_continue').checked=true;e.state.failNextCommit='before';await e.fire('#btnSaveProduction');
 assert.equal(e.state.rows.productions.length,0);assert.equal(e.state.rows.supplementStock[0].currentQty,20);assert.equal(e.document.querySelector('#pf_recipe').value,'r1');assert.notEqual(e.alerts.length,0);
 }finally{await e.cleanup();}
});
async function frozen(){const e=await pageEnvironment('frozenProduct',{instrument:'\nexport {showIncomingModal};'});await e.page.renderFrozenProduct();await e.page.showIncomingModal(e.state.rows.frozenProducts[0]);return e;}
test('frozen receipt previews bag quantity without writes; insufficient stock keeps existing save guard',async()=>{
 const e=await frozen();try{
 assert.match(e.document.querySelector('#m_bagPreview').textContent,/100장/);assert.equal(e.state.writes.length,0);
 e.fill('#m_qty','101');await e.fire('#m_qty','input');assert.match(e.document.querySelector('#m_bagPreview').textContent,/부족/);
 e.document.querySelector('#m_staff').innerHTML='<option selected value="검증">검증</option>';
 await e.fire('#btnSaveIncoming');assert.match(e.alerts.at(-1),/봉투 재고가 부족/);assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
test('bag preview is advisory: changed stock is read at save, receipt history and expiry contract remain unchanged',async()=>{
 const e=await frozen();try{
 const expiry=e.document.querySelector('#m_expiry').value;e.fill('#m_date','2026-09-13');await e.fire('#m_date','change');assert.equal(e.document.querySelector('#m_expiry').value,expiry);
 e.fill('#m_date',e.today);e.fill('#m_qty','4');await e.fire('#m_qty','input');assert.match(e.document.querySelector('#m_bagPreview').textContent,/96장/);
 e.state.rows.bagTypes[0].currentQty=2;e.document.querySelector('#m_staff').innerHTML='<option selected value="검증">검증</option>';await e.fire('#btnSaveIncoming');assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
 const s=await frozen();try{const initial=s.document.querySelector('#m_expiry').value;s.fill('#m_qty','4');s.document.querySelector('#m_staff').innerHTML='<option selected value="검증">검증</option>';
 await s.fire('#btnSaveIncoming');assert.deepEqual(s.alerts,[]);assert.equal(s.document.querySelector('#actionStatus').textContent,'입고 등록 완료!');assert.equal(s.state.rows.bagTypes[0].currentQty,96);assert.equal(s.state.rows.frozenLogs[0].qty,4);assert.equal(s.state.rows.frozenLogs[0].expiryDate,initial);assert.equal(s.state.rows.productTransferRequests.length,1);
 }finally{await s.cleanup();}
});
