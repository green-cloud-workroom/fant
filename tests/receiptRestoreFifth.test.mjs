import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pageEnvironment} from './helpers/pageDom.mjs';

const artifacts='C:/dev/fant-production/output/stage2-fix/restore/';
const flagFile=artifacts+'fifth-flag-on.js';
writeFileSync(flagFile,readFileSync('src/services/inventoryReceiptCorrection.js','utf8').replace("import.meta.env?.VITE_INVENTORY_RECEIPT_CORRECTION_ENABLED === 'true'",'true'));

test('flag off category names, expanded/collapsed arrows match third-round DOM',async()=>{
 const baseline=await pageEnvironment('frozenProduct',{sourceFiles:{'src/pages/frozenProduct.js':artifacts+'third-frozenProduct.js'}});
 const current=await pageEnvironment('frozenProduct');
 try{
  for(const e of [baseline,current]){const saved=new Map();e.context.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};}
  const headers=e=>[...e.document.querySelectorAll('.frozen-product-category-header')].map(h=>h.textContent.replace(/\s+/g,' ').trim());
  await baseline.page.renderFrozenProduct();await current.page.renderFrozenProduct();
  assert.deepEqual(headers(current),headers(baseline));assert.ok(headers(current).every(h=>h.startsWith('▼')));
  await baseline.fire('.frozen-product-category-header');await current.fire('.frozen-product-category-header');
  assert.deepEqual(headers(current),headers(baseline));assert.ok(headers(current)[0].startsWith('▶'));
  assert.ok(!current.document.getElementById('mainContent').textContent.includes('정정·취소는'));
 }finally{await baseline.cleanup();await current.cleanup();}
});

for(const status of ['pending','pending_handoff','completed','입고완료'])test(`flag on production role raw ${status} card uses correct edit gate`,async()=>{
 const e=await pageEnvironment('main',{role:'production',instantRoutes:['main'],sourceFiles:{'src/services/inventoryReceiptCorrection.js':flagFile},instrument:'\nexport {selectProductionDate,openProductReceiptModal,renderInstantMain};'});
 try{
  const date=e.today;
  e.state.rows.productions=[{id:'raw',date,recipeId:'r1',recipeName:'검증',category:'raw',target:'cat',status:'completed',received:true,receivedRevision:1,receivedPlates:1,receivedLoosePacks:0,receivedTotalPacks:100,receivedBox:5,receivedRemainder:0,ingredientsSnapshot:[]}];
  e.state.rows.recipes[0].packsPerPlate=100;
  e.state.rows.productTransferRequests=[{id:'productions:raw:1',status:status==='pending_handoff'?'pending':status}];
  if(status==='pending_handoff')e.state.rows.receiptHandoffs=[{id:'productions:raw:1',status:'completed'}];
  const calls=[];e.cache.get('firebase/functions').setExport('httpsCallable',(_f,name)=>async data=>{calls.push({name,data});return {data:{intents:[]}};});
  await e.page.renderInstantMain();await e.page.selectProductionDate(date);
  await e.fire('.main-production-card');
  for(let i=0;i<50&&!e.document.getElementById('pr_plates')&&!e.alerts.length;i++)await new Promise(resolve=>setTimeout(resolve,10));
  if(status.startsWith('pending')){
   assert.ok(e.document.getElementById('pr_plates'),'pending raw receipt lost existing edit form');
   e.fill('#pr_plates',2);await e.fire('#pr_confirm');
   assert.ok(e.state.writes.includes('productions/raw'),'legacy pending edit did not save');
  }else{
   assert.equal(e.document.getElementById('pr_plates'),null);assert.ok(e.alerts.some(t=>t.includes('대표·사무실')));
  }
  assert.equal(calls.filter(c=>c.name.startsWith('inventoryReceiptCorrection')).length,0);
 }finally{await e.cleanup();}
});
