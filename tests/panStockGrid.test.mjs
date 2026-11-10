import test from 'node:test';
import assert from 'node:assert/strict';
import {panStockGridModel,renderPanStockGrid,validatePanCategories} from '../src/pages/panStockGrid.js';
import {groupLots} from '../src/pages/frozenPanDesk.js';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('grid groups dates descending, aggregates same-day lots and preserves unknown stock and fractional bread units',()=>{
 const recipes=['주식치킨캣','치킨텐더','치킨캐서롤파티'].map(displayName=>({displayName}));
 const rows=[{productName:'주식치킨캣',date:'2026-11-10',remaining:6.1},{productName:'주식치킨캣',date:'2026-11-10',remaining:0.1},{productName:'주식치킨캣',date:'2026-11-09',remaining:10},{productName:'constructor',remaining:3}];
 const before=JSON.stringify(rows),model=panStockGridModel(recipes,groupLots(rows),groupLots([{productName:'주식치킨캣',date:'2026-11-06',remaining:42}]),null);
 assert.deepEqual(model.dates,['2026-11-10','2026-11-09','2026-11-06','날짜 미상']);assert.equal(model.quantity('주식치킨캣','bread','2026-11-10'),6.2);assert.equal(model.total('주식치킨캣','bread'),16.2);
 assert.equal(model.categories.find(c=>c.id==='other').names[0],'constructor');assert.equal(JSON.stringify(rows),before);
 const html=renderPanStockGrid(model);assert.ok(html.includes('빵(개)</th>'));assert.ok(html.includes('동결(판)</th>'));assert.ok(!html.includes('<br>'));assert.ok(!html.includes('<details'));
 assert.ok(html.indexOf('2026-11-10')<html.indexOf('2026-11-09'));
});
test('category and product labels are escaped and mappings use literal names',()=>{
 const name='<img src=x onerror=bad()>',config={version:1,categories:[{id:'custom',label:name}],assignments:[{productName:name,categoryId:'custom'}]};
 const model=panStockGridModel([{displayName:name}],groupLots([{productName:name,date:'2026-11-10',remaining:4}]),{},config);
 const html=renderPanStockGrid(model);assert.ok(!html.includes('<img'));assert.ok(html.includes('&lt;img'));assert.equal(model.total(name,'bread'),4);
 assert.throws(()=>validatePanCategories({...config,categories:[{id:'a',label:'중복'},{id:'b',label:'중복'}]}),/중복/);
 assert.throws(()=>validatePanCategories({...config,assignments:[{productName:name,categoryId:'missing'}]}),/품목/);
});
async function setup(role='office'){
 const e=await pageEnvironment('frozenPan',{role,instantRoutes:['frozenPan'],instrument:'\nexport {savePanCategories};'});
 e.state.rows.breadPanLots=[{id:'bread',productName:'고양이 검증 큐브',date:'2026-09-14',remaining:16.2,closed:false}];
 await e.page.renderFrozenPan();return e;
}
test('folding removes product columns only, preserves all totals and existing detail/history navigation',async()=>{
 const e=await setup();try{
  const before=JSON.stringify(e.state.rows.breadPanLots);assert.match(e.nodes.mainContent.textContent,/16.2개/);
  await e.fire('[data-pan-fold=treat]');assert.equal(e.document.querySelectorAll('[data-product]').length,0);assert.match(e.nodes.mainContent.textContent,/16.2개/);
  await e.fire('[data-pan-fold=treat]');await e.fire('[data-product]');assert.match(e.document.querySelector('.pan-detail').textContent,/16.2개/);
  await e.fire('[data-history]');assert.ok(e.document.querySelector('.pan-log'));
  assert.equal(e.state.writes.length,0);assert.equal(JSON.stringify(e.state.rows.breadPanLots),before);
 }finally{await e.cleanup();}
});
test('category editor persists only its settings document and survives page reload',async()=>{
 const e=await setup();try{
  const before=JSON.stringify([e.state.rows.breadPanLots,e.state.rows.frozenPanLots]);
  await e.fire('#panCategories');assert.equal(e.document.querySelectorAll('[data-category-product]').length,1);
  e.fill('[data-category-name="0"]','주식류');await e.fire('#panCategorySave');
  assert.equal(e.document.getElementById('modalOverlay'),null);assert.equal(e.state.rows.settings.find(s=>s.id==='panStockCategories').categories[0].label,'주식류');
  assert.ok(e.state.writes.every(p=>p==='settings/panStockCategories'));assert.equal(JSON.stringify([e.state.rows.breadPanLots,e.state.rows.frozenPanLots]),before);
  await e.page.renderFrozenPan();assert.match(e.nodes.mainContent.textContent,/주식류/);
 }finally{await e.cleanup();}
});
test('another category save prevents overwrite and keeps attempted editor values',async()=>{
 const e=await setup();try{
  await e.fire('#panCategories');e.fill('[data-category-name="0"]','나의 분류');
  e.state.rows.settings.push({id:'panStockCategories',version:1,categories:[{id:'main',label:'다른 분류'}],assignments:[]});
  await e.fire('#panCategorySave');assert.equal(e.state.writes.length,0);assert.equal(e.document.querySelector('[data-category-name="0"]').value,'나의 분류');assert.ok(e.alerts.length);
 }finally{await e.cleanup();}
});
test('production role can read categories but cannot save category settings',async()=>{
 const e=await setup('production');try{
  assert.equal(e.document.querySelector('#panCategories'),null);
  await e.page.savePanCategories({version:1,categories:[{id:'main',label:'주식'}],assignments:[]},null);
  assert.equal(e.state.writes.length,0);assert.ok(e.alerts.length);
 }finally{await e.cleanup();}
});
