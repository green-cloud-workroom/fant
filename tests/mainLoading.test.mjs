import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers/modules.mjs';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {makeFirestore} from './fixtures/firestore.mjs';

test('read-only production preview does not wait for today logs or enable incomplete commands',async()=>{
 const fake=makeFirestore({alertCount:0});
 const original=fake.api.getDocsFromServer;let release,held=false;
 const gate=new Promise(resolve=>{release=resolve;});
 fake.api.getDocsFromServer=async ref=>{
  if(ref.path==='activityLogs'&&ref.conditions.some(c=>c.field==='date'&&c.op==='=='&&c.value===fake.today)){held=true;await gate;}
  return original(ref);
 };
 const e=await environment({session:true,instantRoutes:['main'],firestore:fake,instrument:{'src/pages/main.js':'\nexport {prepareMainModel};'}});
 const page=await e.load('src/pages/main.js'),before=JSON.stringify(page.testState());
 let ready,finished=false,timer;
 const preview=new Promise(resolve=>{ready=resolve;});
 const pending=page.prepareMainModel((await e.load('src/services/serverReadScope.js')).createServerReadScope(),{onProductionReady:ready}).then(model=>{finished=true;return model;});
 try{
  const data=await Promise.race([preview,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('preview waited for unrelated today logs')),2000);})]);
  assert.equal(held,true);assert.equal(finished,false);assert.equal(JSON.stringify(page.testState()),before);assert.equal(e.state.writes.length,0);
  release();const full=await pending;assert.equal(full.overdueClosingDate,data.overdueClosing?.date||null);
  assert.ok(full.blockingData);assert.equal(e.state.writes.length,0);
 }finally{clearTimeout(timer);release();await pending;(await e.load('src/state/sessionStore.js')).sessionStore.clear();}
});

test('summary re-renders reuse shell queries and still reflect stock updates',async()=>{
 const e=await pageEnvironment('main',{instantRoutes:['main']});
 try{
  e.state.rows.bagTypes[0].minimumQty=200;
  const {loadStockAlerts}=await e.load('src/services/stockAlerts.js');
  const {createDisplayScope}=await e.load('src/state/displayReads.js');
  await loadStockAlerts(createDisplayScope('shell'));
  const view=await e.load('src/utils/stockAlertsView.js');const reads=e.state.reads.length;
  for(let i=0;i<3;i++){e.nodes.mainContent.innerHTML=view.stockAlertSummaryHtml;await view.mountStockAlertSummary();}
  assert.equal(e.state.reads.length,reads);assert.match(e.nodes.mainContent.textContent,/부족재고 1종/);
  e.state.rows.bagTypes[0].currentQty=200;await e.state.notify('bagTypes');const pushedReads=e.state.reads.length;await view.mountStockAlertSummary();
  assert.match(e.nodes.mainContent.textContent,/부족재고 0종/);assert.equal(e.state.reads.length,pushedReads);assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});

test('recording an observed shortage creates only notification transactions without reloading inventories',async()=>{
 const e=await pageEnvironment('main');try{
  e.state.rows.bagTypes[0].minimumQty=200;
  const api=await e.load('src/services/stockAlerts.js');const model=await api.loadStockAlerts();
  const reads=e.state.reads.length,stock=JSON.stringify(e.state.rows.bagTypes);
  const result=await api.recordStockAlertTransitions(model,()=>true);assert.equal(result.createdIds.length,1);
  assert.ok(e.state.reads.slice(reads).every(r=>r.path.startsWith('activityLogs/')));
  assert.equal(JSON.stringify(e.state.rows.bagTypes),stock);assert.ok(e.state.writes.every(p=>p.startsWith('activityLogs/')));
  const writes=e.state.writes.length;await assert.rejects(()=>api.recordStockAlertTransitions(model,()=>false),/화면/);assert.equal(e.state.writes.length,writes);
 }finally{await e.cleanup();}
});

test('modal confirmation still performs fresh server reads after summary caching',async()=>{
 const e=await pageEnvironment('main');try{
  e.state.rows.bagTypes[0].minimumQty=200;
  const api=await e.load('src/services/stockAlerts.js'),shown=await api.syncStockAlerts();
  const {createDisplayScope}=await e.load('src/state/displayReads.js');await api.loadStockAlerts(createDisplayScope('shell'));
  const reads=e.state.reads.length;
  // Deliberately do not notify the display cache: commands must see this change anyway.
  e.state.rows.bagTypes[0].currentQty=0;
  await assert.rejects(()=>api.acknowledgeStockAlerts(shown.items,'사무실'),/바뀌어/);
  assert.ok(e.state.reads.slice(reads).some(r=>r.path==='bagTypes'));
  assert.ok(e.state.rows.activityLogs.every(log=>log.acknowledged!==true));
 }finally{await e.cleanup();}
});
