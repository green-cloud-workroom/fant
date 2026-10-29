import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {captureSettingsBagViews,attackText,ordinaryText} from './helpers/settingsBagXssViews.mjs';
import {pageEnvironment} from './helpers/pageDom.mjs';
for(const role of ['admin','office','production'])for(const text of [attackText,ordinaryText])test(`settings/bag output ${role} ${text===attackText?'attack':'ordinary'}`,async()=>{
 const views=await captureSettingsBagViews({role,text});assert.ok(views.length>15);
 for(const v of views){const {document}=parseHTML('<html><body>'+v.html+'</body></html>');assert.equal(document.querySelector('img,iframe,script,object,embed'),null,v.name);for(const node of document.querySelectorAll('*'))for(const a of node.attributes)assert.ok(!/^on(error|load|focus|mouseover)$/i.test(a.name),v.name);
  const el=document.querySelector(v.selector);assert.ok(el,v.name);if(v.expected!==null){const value=v.attribute?el.getAttribute(v.attribute):['INPUT','TEXTAREA'].includes(el.tagName)?el.value:el.textContent;assert.ok(value.includes(v.expected),v.name+': text/attribute changed');}
 }
});
for(const name of [ordinaryText,attackText])test('bag master edit saves literal '+(name===attackText?'attack':'ordinary')+' name, retaining box/minimum calculations',async()=>{
 const e=await pageEnvironment('bag',{instrument:'\nexport {showBagModal};'});
 try{await e.page.renderBag();e.page.showBagModal(e.state.rows.bagTypes[0]);e.fill('#m_bagName',name);e.fill('#m_piecesPerBox','20');e.fill('#m_minBox','3');await e.fire('#btnSaveBag');const b=e.state.rows.bagTypes[0];assert.equal(b.name,name,e.alerts.join('\n'));assert.equal(b.minimumQty,60);assert.equal(b.currentQty,100);assert.equal(e.document.querySelector('img'),null);}finally{await e.cleanup();}
});
test('production-role bag adjustment stores raw reason and admin history displays inert text',async()=>{
 const e=await pageEnvironment('bag',{role:'production',instrument:'\nexport {showBagAdjustModal};'});
 try{await e.page.renderBag();e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);e.fill('#m_qty','2');e.fill('#m_reason',attackText);e.fill('#m_staff','담당');
  if(!e.document.querySelector('#m_staff option[value="담당"]')){const o=e.document.createElement('option');o.value='담당';o.textContent='담당';e.document.querySelector('#m_staff').append(o);e.fill('#m_staff','담당');}
  e.fill('#movement_kind','reconciliation');await e.fire('#movement_kind','change');await e.fire('#btnSaveAdjust');assert.equal((e.state.rows.bagLogs||[]).at(-1)?.reason,attackText,e.alerts.join('\n'));assert.equal(e.state.rows.bagTypes[0].currentQty,102);
  const higher=await pageEnvironment('bag',{role:'admin',instrument:'\nexport async function __showBagHistory(id){selectedBagId=id;await showBagDetail(bagTypes.find(b=>b.id===id));}'});try{higher.state.rows.bagTypes=structuredClone(e.state.rows.bagTypes);higher.state.rows.bagLogs=structuredClone(e.state.rows.bagLogs);await higher.page.renderBag();await higher.page.__showBagHistory('b1');assert.equal(higher.document.querySelector('img'),null);assert.ok(higher.document.querySelector('#bagDetail').textContent.includes(attackText));}finally{await higher.cleanup();}
 }finally{await e.cleanup();}
});
test('office staff command preserves literal name for admin display',async()=>{
 const e=await pageEnvironment('settings',{role:'office',instrument:'\nexport {saveStaffGroup,renderStaffList};'});
 try{await e.page.renderSettings();const before=e.state.rows.staffGroups.find(g=>g.id==='lead').members;const members=[...before,{id:'literal',name:attackText,active:true,sortOrder:99}];await e.page.saveStaffGroup('lead',members,before);const saved=e.state.rows.staffGroups.find(g=>g.id==='lead').members;assert.equal(saved.at(-1).name,attackText,e.alerts.join('\n'));const {document}=parseHTML(e.page.renderStaffList('lead',saved,true));assert.equal(document.querySelector('img'),null);assert.ok([...document.querySelectorAll('.staff-item span')].some(n=>n.textContent===attackText));}finally{await e.cleanup();}
});
test('holiday creation preserves literal title and description without changing flags',async()=>{
 const e=await pageEnvironment('settings',{role:'office',instrument:'\nexport {handleAddHoliday,renderHolidaysSection};'});
 try{await e.page.renderSettings();e.state.rows.holidays=[];e.document.querySelector('#mainContent').innerHTML=e.page.renderHolidaysSection([]);e.fill('#hd_start',e.today);e.fill('#hd_end',e.today);e.fill('#hd_label',attackText);e.fill('#hd_desc',ordinaryText);for(const id of ['hd_affectsProduction','hd_affectsShipping','hd_shippingAvailablePrev'])e.document.getElementById(id).checked=true;await e.page.handleAddHoliday();const row=e.state.rows.holidays.find(h=>h.id===e.today);assert.ok(row,e.alerts.join('\n'));assert.equal(row.title,attackText);assert.equal(row.description,ordinaryText);assert.equal(row.affectsProduction,true);assert.equal(row.shippingClosedFromEnabled,false);const {document}=parseHTML(e.page.renderHolidaysSection([row]));assert.equal(document.querySelector('.holiday-label').textContent,attackText);assert.equal(document.querySelector('img'),null);}finally{await e.cleanup();}
});
test('valid bag category classes retain existing labels',async()=>{
 const e=await pageEnvironment('bag',{instrument:'\nexport {renderBagItem};'});try{for(const category of ['raw','freezeDry']){const {document}=parseHTML(e.page.renderBagItem({...e.state.rows.bagTypes[0],category}));assert.equal(document.querySelector('.tag').getAttribute('class'),'tag tag-'+category);}}finally{await e.cleanup();}
});
for(const role of ['admin','office'])test(`actual lazy settings sections safely render stored values (${role})`,async()=>{
 const e=await pageEnvironment('settings',{role,instantRoutes:['settings']});
 try{for(const g of e.state.rows.staffGroups)g.members=[{name:attackText}];e.state.rows.holidays=[{id:'2026-09-14',date:'2026-09-14',title:attackText,status:'active'}];e.state.rows.settings=[{id:'systemValues',maxPansPerBatch:attackText,breadToFreezeRatio:{numerator:attackText,denominator:attackText}}];await e.page.renderSettings();for(const i of [0,3,6]){const section=e.document.querySelectorAll('.settings-section')[i];section.open=true;await e.fire(section,'toggle');assert.ok(!section.textContent.includes('자료를 불러오지 못했습니다'));}
  assert.equal(e.document.querySelector('img'),null);assert.equal(e.document.querySelector('.staff-item span').textContent,attackText);assert.equal(e.document.querySelector('.holiday-label').textContent,attackText);assert.equal(e.document.querySelector('input[data-value-key="maxPansPerBatch"]').getAttribute('value'),attackText);assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
test('production role cannot render privileged settings or initiate its reads',async()=>{
 const e=await pageEnvironment('settings',{role:'production'});try{const before=e.nodes.mainContent.innerHTML;assert.equal(e.state.reads.length,0);await e.page.renderSettings();assert.equal(e.nodes.mainContent.innerHTML,before);assert.equal(e.state.reads.length,0);assert.equal(e.state.writes.length,0);}finally{await e.cleanup();}
});

