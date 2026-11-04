import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('stock workspace switches recipes without writes, retains selection on refresh, and filters decimal units',async()=>{
 const e=await pageEnvironment('supplement');
 try{
  e.state.rows.supplementTypes.push({id:'r2_7.5',recipeId:'r2',recipeName:'다른 제품',name:'다른 제품 7.5용 영양제',unit:7.5,active:true,sortOrder:100});
  e.state.rows.supplementStock.push({id:'r2_7.5',currentQty:3});
  await e.page.renderSupplement();
  assert.equal(e.document.querySelectorAll('[data-recipe]').length,2);
  assert.equal(e.document.querySelectorAll('.supplement-work-table tbody tr').length,2);
  await e.fire('[data-recipe="r2"]');
  assert.equal(e.document.querySelector('.supplement-action-in').dataset.id,'r2_7.5');
  await e.page.renderSupplement({force:true});
  assert.equal(e.document.querySelector('[data-recipe="r2"]').getAttribute('aria-pressed'),'true');
  e.fill('#supplementSearch','다른 7.5');await e.fire('#supplementSearch','input');
  assert.equal(e.document.querySelectorAll('.supplement-work-table tbody tr').length,1);
  assert.match(e.document.querySelector('.supplement-td-qty').textContent,/3봉/);
  e.fill('#supplementSearch','없음');await e.fire('#supplementSearch','input');assert.match(e.document.querySelector('.list-empty').textContent,/조건에 맞는/);
  assert.equal(e.state.commits.length,0);
 }finally{await e.cleanup();}
});

for(const role of ['office','production'])test(`stock workspace retains inactive rows and role-specific operations: ${role}`,async()=>{
 const e=await pageEnvironment('supplement',{role});
 try{
  e.state.rows.supplementTypes[1].active=false;
  await e.page.renderSupplement();
  assert.equal(e.document.querySelectorAll('.supplement-work-table tbody tr').length,2);
  assert.equal(e.document.querySelectorAll('.supplement-action-in').length,1);
  assert.equal(e.document.querySelectorAll('.supplement-action-adjust').length,role==='office'?1:0);
  e.fill('#supplementFilter','danger');await e.fire('#supplementFilter','change');
  assert.equal(e.document.querySelectorAll('.supplement-work-table tbody tr').length,1);
  assert.equal(e.document.querySelectorAll('.supplement-action-in').length,0);
  assert.equal(e.state.commits.length,0);
 }finally{await e.cleanup();}
});
