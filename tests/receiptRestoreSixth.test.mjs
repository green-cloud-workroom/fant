import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const artifacts='C:/dev/fant-production/output/stage2-fix/restore/';
for(const name of ['frozenProduct','main'])test(`flag off ${name} preserves the baseline receipt controls`,async()=>{
 const baseline=await pageEnvironment(name,{sourceFiles:{[`src/pages/${name}.js`]:artifacts+`third-${name}.js`}}),current=await pageEnvironment(name);
 try{
  for(const e of [baseline,current]){e.context.MutationObserver=class{observe(){}disconnect(){}};const saved=new Map();e.context.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};}
  const render=async e=>name==='frozenProduct'?e.page.renderFrozenProduct():e.page.renderMain();
  const html=e=>e.document.getElementById('mainContent').innerHTML.replace(/\s+/g,' ').trim();
  if(name==='frozenProduct') for(const e of [baseline,current]){
   const product=e.state.rows.frozenProducts[0];
   e.state.rows.frozenLogs=[{id:'r',productId:product.id,date:e.today,timestamp:1,status:'active',qty:4,deductedBagQty:4}];
  }
  await render(baseline);await render(current);
  if(name==='main') assert.equal(html(current),html(baseline));
  if(name==='frozenProduct'){
   await baseline.fire('.recipe-list-item');
   await current.fire('[data-log-details="0"]');
   for(const selector of ['[data-inventory-handoff]','.btn-edit-row','.btn-del-row']){
    const action=e=>{
     const button=e.document.querySelector(selector);
     assert.ok(button,selector);
     return {...button.dataset};
    };
    assert.deepEqual(action(current),action(baseline),selector);
   }
   assert.equal(current.document.querySelector('[data-inventory-correction-recovery]'),null);
   assert.equal(current.state.writes.length,0);
  }
 }finally{await baseline.cleanup();await current.cleanup();}
});
