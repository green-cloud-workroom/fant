import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {captureEggViews,attackText,ordinaryText} from './helpers/eggXssViews.mjs';import {pageEnvironment} from './helpers/pageDom.mjs';
for(const role of ['admin','office','production'])for(const text of [attackText,ordinaryText,'가'.repeat(2000)+' & "끝"'])test(`egg output roundtrip ${role} ${text===attackText?'attack':text===ordinaryText?'ordinary':'long'}`,async()=>{
 for(const v of await captureEggViews({role,text})){const{document}=parseHTML('<html><body>'+v.html+'</body></html>');assert.equal(document.querySelectorAll('img,script,iframe,object,embed').length,0,v.name);const n=document.querySelector(v.selector);assert.ok(n,v.name);assert.ok((v.attribute?n.getAttribute(v.attribute):n.textContent).includes(text),v.name);if(v.name.startsWith('staff-'))assert.equal(n.textContent,text,v.name);}
});
for(const kind of ['in','out','adjust'])for(const text of [ordinaryText,attackText])test(`egg ${kind} preserves raw staff/note and inventory ${text===attackText?'attack':'ordinary'}`,async()=>{
 const e=await pageEnvironment('egg',{instrument:'\nexport {showEggModal,showEggAdjustModal};\nexport function __staff(name){staffCache={senior:[{name}],office:[]};}'});
 try{e.state.rows.eggStock=[{id:'global',currentQty:100,minimumQty:20}];await e.page.renderEgg();e.page.__staff(text);const before={...e.state.rows.eggStock[0]};
  if(kind==='adjust')e.page.showEggAdjustModal(before);else e.page.showEggModal(kind,before);
  if(kind==='adjust'){e.fill('#movement_kind','reconciliation');await e.fire('#movement_kind','change');e.fill('#m_adjustType','plus');e.fill('#m_qty',3);e.fill('#m_reason',text);}else{e.fill(kind==='in'?'#m_qty':'#m_usageQty',10);e.fill('#m_date',e.today);e.fill('#m_note',text);}
  e.fill('#m_staff',text);await e.fire(kind==='adjust'?'#btnSaveAdjust':'#btnSaveEgg');
  const after=kind==='in'?110:kind==='out'?90:103,delta=after-100;assert.equal(e.state.rows.eggStock[0].currentQty,after,e.alerts.join('\n'));assert.equal(e.state.rows.eggStock[0].minimumQty,20);const log=e.state.rows.eggLogs.at(-1);assert.equal(log.staffName,text);assert.equal(kind==='adjust'?log.reason:log.note,text);assert.equal(log.qty,delta);assert.equal(log.before,100);assert.equal(log.after,after);assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,4);assert.equal(e.document.querySelectorAll('#mainContent img').length,0);assert.ok(e.document.querySelector('tbody').textContent.includes(text));
 }finally{await e.cleanup();}
});
test('egg FIFO remains unchanged and escapes lot text',async()=>{
 const e=await pageEnvironment('egg',{instrument:'\nexport {buildEggFifoBreakdown,renderEggFifoPanel};'});try{const logs=[{id:'a',type:'in',qty:60,date:'2026-10-28',staffName:'담당',timestamp:1},{id:'b',type:'in',qty:40,date:attackText,staffName:attackText,timestamp:2},{id:'c',type:'out',qty:-70,date:'2026-10-28',timestamp:3}];const fifo=e.page.buildEggFifoBreakdown(logs,30);assert.equal(fifo.fifoTotalQty,30);assert.equal(fifo.diffQty,0);const{document}=parseHTML(e.page.renderEggFifoPanel(fifo,30));assert.equal(document.querySelectorAll('img').length,0);assert.ok(document.querySelector('.egg-fifo-date').textContent.includes(attackText));}finally{await e.cleanup();}
});
