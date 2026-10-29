import test from 'node:test';
import assert from 'node:assert/strict';
import {captureXssViews,attackText,ordinaryText} from './helpers/xssViews.mjs';
import {parseHTML} from 'linkedom';
import {escapeHtml,recipeColor} from '../src/utils/html.js';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('plain text and quoted attributes retain exact text without executable markup',()=>{
 for(const text of [attackText,ordinaryText,'',null,42,'가'.repeat(4000)]) {
  const escaped=escapeHtml(text),{document}=parseHTML(`<div id="text">${escaped}</div><input value="${escaped}">`);
  assert.equal(document.querySelector('#text').textContent,String(text??''));
  assert.equal(document.querySelector('input').value,String(text??''));assert.equal(document.querySelector('img'),null);
 }
 assert.equal(recipeColor('#Ab12cd'),'#Ab12cd');assert.equal(recipeColor('#fff'),'#fff');
 for(const color of ['red','red;background-image:url(/xss-probe)','" onmouseover="alert(1)',null])assert.equal(recipeColor(color),'#4A7C59');
});

test('recipe edit saves literal names and notes, without escaping persisted data',async()=>{
 const e=await pageEnvironment('recipe',{instrument:'\nexport {showRecipeDetail};'});
 try {
  e.state.rows.recipes[0].bagTypeId='b1';await e.page.renderRecipe();e.page.showRecipeDetail(e.state.rows.recipes[0]);
  e.fill('#recipeName',ordinaryText);e.fill('#recipeNote',attackText);await e.fire('#btnSaveRecipe');
  assert.equal(e.state.rows.recipes[0].name,ordinaryText,e.alerts.join('\n'));assert.equal(e.state.rows.recipes[0].note,attackText);
 } finally {await e.cleanup();}
});

test('production submission keeps original recipe and ingredient text in snapshots',async()=>{
 const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});
 try {
  Object.assign(e.state.rows.recipes[0],{name:ordinaryText,usesSupplement:false});e.state.rows.recipes[0].ingredients[0].name=attackText;
  await e.page.renderProduction();await e.page.showProductionForm(null);e.fill('#pf_recipe','r1');await e.fire('#pf_recipe','change');e.fill('#pf_qty_select','2');await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
  const row=e.state.rows.productions[0];assert.ok(row,e.alerts.join('\n'));assert.equal(row.recipeName,'고양이 '+ordinaryText);assert.equal(row.ingredientsSnapshot[0].name,attackText);assert.ok(row.mutationToken);
 } finally {await e.cleanup();}
});

test('schedule edit preserves raw memo and staff text for later safe rendering',async()=>{
 const e=await pageEnvironment('schedule');
 try {
  e.state.rows.schedules=[{id:'sc1',date:e.today,type:'bag',itemId:'b1',itemNameSnapshot:ordinaryText,orderedQty:2,orderedUnit:'박스',status:'scheduled'}];
  await e.page.renderSchedule();await e.fire('.btn-edit-schedule');e.document.querySelector('#m_staff').innerHTML='<option value="">선택</option>';
  const opt=e.document.createElement('option');opt.value=ordinaryText;opt.textContent=ordinaryText;e.document.querySelector('#m_staff').append(opt);e.fill('#m_staff',ordinaryText);e.fill('#m_memo',attackText);await e.fire('#btnSaveSchedule');
  assert.equal(e.state.rows.schedules[0].orderMemo,attackText,e.alerts.join('\n'));assert.equal(e.state.rows.schedules[0].orderStaffName,ordinaryText);
 } finally {await e.cleanup();}
});

test('production-role completion preserves literal shared activity text and admin sees inert memo',async()=>{
 const e=await pageEnvironment('schedule',{role:'production',instrument:'\nexport {showCompleteModal};'});
 try {
  const row={id:'sc1',date:e.today,type:'meat',itemId:'m1',itemNameSnapshot:ordinaryText,orderedQty:10,orderedUnit:'마리',status:'scheduled'};
  e.state.rows.schedules=[row];await e.page.renderSchedule();e.page.showCompleteModal(row);
  e.fill('#m_actual','1000');e.fill('#m_actual_unit','g');e.document.querySelector('#m_staff').innerHTML='<option value="담당" selected>담당</option>';
  e.fill('#m_memo',attackText);e.fill('#movement_kind','receipt');await e.fire('#movement_kind','change');await e.fire('#btnSaveComplete');
  assert.equal(e.state.rows.schedules[0].status,'completed',e.alerts.join('\n'));assert.equal(e.state.rows.schedules[0].completeMemo,attackText);
  assert.ok(e.state.rows.activityLogs.at(-1).message.startsWith(ordinaryText+' 입고'));
  const higher=await pageEnvironment('schedule',{role:'admin'});
  try {higher.state.rows.schedules=structuredClone(e.state.rows.schedules);await higher.page.renderSchedule();await higher.fire('#btnToggleDone');assert.equal(higher.document.querySelector('img'),null);assert.ok(higher.document.querySelector('#doneSection').textContent.includes(attackText));}finally{await higher.cleanup();}
 } finally {await e.cleanup();}
});

test('copy action sends plain text and keeps notes literal',async()=>{
 const e=await pageEnvironment('production',{instrument:'\nexport {showCopySheetModal};'});
 try {
  e.state.rows.productions=[{id:'p1',date:e.today,sortOrder:0,recipeId:'r1',recipeName:'고양이 '+ordinaryText,category:'raw',target:'cat',productionUnitQty:2,status:'active'}];
  e.context.navigator.clipboard={writeText:async value=>{e.context.copied=value;}};await e.page.renderProduction();await e.page.showCopySheetModal();
  const original=e.document.querySelector('#sheetText').value;e.fill('#sheetNote',attackText);await e.fire('#btnCopy');
  assert.equal(e.context.copied,original.replace(/\n+$/,'')+'\n'+attackText);assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
for(const role of ['admin','office','production'])for(const text of [attackText,ordinaryText])test(`real page outputs preserve stored text (${role}, ${text===attackText?'attack':'ordinary'})`,async()=>{
 const views=await captureXssViews({role,text});
 for(const view of views) {
  const {document}=parseHTML('<html><body>'+view.html+'</body></html>');
  assert.equal(document.querySelector('img,iframe,script,object,embed'),null,view.name);
  for(const node of document.querySelectorAll('*'))for(const attribute of node.attributes)assert.ok(!/^on(?:error|load|focus|mouseover)$/i.test(attribute.name),view.name+':'+attribute.name);
  if(view.expected!==null) {
   const node=document.querySelector(view.selector);assert.ok(node,view.name);
   const actual=node.tagName==='INPUT'||node.tagName==='TEXTAREA'?node.value:node.textContent.trim();
   assert.ok(actual.includes(view.expected),view.name+': displayed text changed');
  }
 }
});
