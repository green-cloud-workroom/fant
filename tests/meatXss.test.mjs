import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {captureMeatViews,attackText,ordinaryText} from './helpers/meatXssViews.mjs';
for(const role of ['admin','office','production'])for(const text of [attackText,ordinaryText,'가'.repeat(2000)+' & "끝"'])test(`meat output literal roundtrip ${role} ${text===attackText?'attack':text===ordinaryText?'ordinary':'long'}`,async()=>{
 for(const v of await captureMeatViews({role,text})){
  const {document}=parseHTML('<html><body>'+v.html+'</body></html>');
  assert.equal(document.querySelectorAll('img,script,iframe,object,embed').length,0,v.name);
  const node=document.querySelector(v.selector);assert.ok(node,v.name);
  assert.ok((v.attribute?node.getAttribute(v.attribute):node.textContent).includes(v.expected),v.name);
 }
});

import {pageEnvironment} from './helpers/pageDom.mjs';
for(const text of [ordinaryText,attackText])test('meat incoming saves original name/staff/note with unchanged grams '+(text===attackText?'attack':'ordinary'),async()=>{
 const e=await pageEnvironment('meat',{instrument:'\nexport {showAddFrozenModal};\nexport function __staff(name){staffCache={lead:[{name}],office:[]};}'});
 try{
  e.state.rows.meatTypes[0].name=text;await e.page.renderMeat();e.page.__staff(text);e.page.showAddFrozenModal();
  for(const [id,value]of Object.entries({m_meatType:'m1',m_weight:2,m_unit:'kg',m_date:e.today,m_staff:text,m_note:text}))e.fill('#'+id,value);
  await e.fire('#btnSaveFrozen');const log=e.state.rows.meatLogs.at(-1);assert.ok(log,e.alerts.join('\n'));
  assert.equal(log.meatNameSnapshot,text);assert.equal(log.staff,text);assert.equal(log.reason,text);assert.equal(log.delta,2000);
  const stock=e.state.rows.meatStocks.find(s=>s.id===log.meatStockId);assert.equal(stock.meatNameSnapshot,text);assert.equal(stock.remaining,2000);assert.equal(stock.staffName,text);assert.equal(stock.note,text);assert.equal(e.state.rows.meatStocks.find(s=>s.id==='ms1').remaining,10000);
 }finally{await e.cleanup();}
});

for(const category of ['meat','produce'])test('quoted master id stays bound to original document '+category,async()=>{
 const id=`id " & <원료>`,e=await pageEnvironment('meat',{instrument:'\nexport {showMeatTypesModal};'});
 try{Object.assign(e.state.rows.meatTypes[0],{id,name:ordinaryText,category});await e.page.renderMeat();e.page.showMeatTypesModal({categoryFilter:category});
  e.fill('.m-unit-weight','750');await e.fire('.m-unit-weight','change');
  assert.equal(e.state.rows.meatTypes[0].id,id);assert.equal(e.state.rows.meatTypes[0].name,ordinaryText);assert.equal(e.state.rows.meatTypes[0].defaultUnitWeightG,750,e.alerts.join('\n'));assert.equal(e.state.writes.length,1);
 }finally{await e.cleanup();}
});
for(const kind of ['processed','adjust'])test('meat '+kind+' preserves original snapshot/staff/reason through rendered selection',async()=>{
 const e=await pageEnvironment('meat',{instrument:'\nexport {showAddProcessedModal};\nexport function __staff(name){staffCache={lead:[{name}],office:[]};}'});
 try{
  e.state.rows.meatTypes[0].name=attackText;e.state.rows.meatStocks[0].meatNameSnapshot=attackText;await e.page.renderMeat();e.page.__staff(attackText);
  if(kind==='processed'){
   e.page.showAddProcessedModal();for(const[id,value]of Object.entries({m_meatType:'m1',m_unitWeight:1000,m_count:3,m_date:e.today,m_staff:attackText}))e.fill('#'+id,value);await e.fire('#btnSaveProcessed');
   assert.equal(e.state.rows.meatStocks.find(s=>s.id==='ms1').remaining,7000,e.alerts.join('\n'));assert.equal(e.state.rows.meatStocks.find(s=>s.stage==='processed').remaining,3000);
   const logs=e.state.rows.meatLogs;assert.ok(logs.length>0);assert.ok(logs.every(l=>l.meatNameSnapshot===attackText));
  }else{
   await e.fire('.btn-adjust');assert.ok(e.document.querySelector('.modal-title').textContent.includes(attackText));assert.equal(e.document.querySelectorAll('#modalOverlay img').length,0);
   e.fill('#movement_kind','reconciliation');await e.fire('#movement_kind','change');for(const[id,value]of Object.entries({m_actualRemaining:9000,m_adjustReason:attackText,m_staff:attackText}))e.fill('#'+id,value);await e.fire('#btnSaveAdjust');
   assert.equal(e.state.rows.meatStocks[0].remaining,9000,e.alerts.join('\n'));const log=e.state.rows.meatLogs.at(-1);assert.equal(log.meatNameSnapshot,attackText);assert.equal(log.staff,attackText);assert.equal(log.reason,attackText);
  }
 }finally{await e.cleanup();}
});
