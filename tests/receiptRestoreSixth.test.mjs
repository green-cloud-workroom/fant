import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const artifacts='C:/dev/fant-production/output/stage2-fix/restore/';
for(const name of ['frozenProduct','main'])test(`flag off ${name} full DOM snapshot equals third-round baseline`,async()=>{
 const baseline=await pageEnvironment(name,{sourceFiles:{[`src/pages/${name}.js`]:artifacts+`third-${name}.js`}}),current=await pageEnvironment(name);
 try{
  for(const e of [baseline,current]){e.context.MutationObserver=class{observe(){}disconnect(){}};const saved=new Map();e.context.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};}
  const render=async e=>name==='frozenProduct'?e.page.renderFrozenProduct():e.page.renderMain();
  const html=e=>e.document.getElementById('mainContent').innerHTML.replace(/\s+/g,' ').trim();
  await render(baseline);await render(current);assert.equal(html(current),html(baseline));
  if(name==='frozenProduct'){
   await baseline.fire('.frozen-product-category-header');await current.fire('.frozen-product-category-header');assert.equal(html(current),html(baseline));
   await baseline.fire('.recipe-list-item');await current.fire('.recipe-list-item');assert.equal(html(current),html(baseline));
  }
 }finally{await baseline.cleanup();await current.cleanup();}
});
