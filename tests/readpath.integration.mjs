import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createSessionStore } from '../src/state/sessionStore.js';
import { createQueryRegistry } from '../src/state/queryRegistry.js';
import { createListenerPool } from '../src/state/listenerPool.js';
import { environment } from './helpers/modules.mjs';
const host=process.env.FIRESTORE_EMULATOR_HOST;
if(host!=='127.0.0.1:8088'||!process.env.GCLOUD_PROJECT?.startsWith('demo-'))throw Error('Integration requires the isolated demo emulator.');
const require=createRequire(resolve('package.json'));
const sdk=require('firebase/firestore');
// SDK validation rejects plain objects created in a different Node vm realm.
// Normalize only data containers at that test boundary; retain SDK sentinels/refs.
const nativeData=value=>Array.isArray(value)?value.map(nativeData):value&&value.constructor?.name==='Object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,nativeData(v)])):value;
const transactionSdk={...sdk,runTransaction:(db,callback)=>sdk.runTransaction(db,transaction=>callback({
  get:ref=>transaction.get(ref),set:(ref,data,options)=>options?transaction.set(ref,nativeData(data),nativeData(options)):transaction.set(ref,nativeData(data)),
  update:(ref,data)=>transaction.update(ref,nativeData(data)),delete:ref=>transaction.delete(ref),
}))};
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const env=await initializeTestEnvironment({projectId:'demo-fant-readpath',firestore:{host:'127.0.0.1',port:8088,rules:await readFile('output/readpath/emulator/firestore.rules','utf8')}});
const claims=role=>({app:['production'],roles:{production:role}});
const admin=env.authenticatedContext('readpath-admin',claims('admin')).firestore();
const reader=env.authenticatedContext('readpath-office',claims('office')).firestore();
test.after(async()=>env.cleanup());

test('real SDK concurrent closed receipt corrections commit exactly one revision and log',async()=>{
  const date='2026-07-01',id='receipt-concurrent';
  const refs=[`productions/${id}`,'recipes/receipt-recipe','settings/systemValues',`closings/${date}`,`productTransferRequests/productions:${id}:1`];
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await Promise.all([
      sdk.setDoc(sdk.doc(db,refs[0]),{date,recipeId:'receipt-recipe',recipeName:'검증',category:'raw',target:'cat',status:'active',received:true,receivedRevision:1,receivedTotalPacks:100}),
      sdk.setDoc(sdk.doc(db,refs[1]),{name:'검증',packsPerPlate:100}),
      sdk.setDoc(sdk.doc(db,refs[2]),{packsPerPlateCat:100}),
      sdk.setDoc(sdk.doc(db,refs[3]),{status:'closed'}),
      sdk.setDoc(sdk.doc(db,refs[4]),{status:'pending'}),
    ]);
  });
  const vm=await environment();vm.synthetic('firebase/firestore',transactionSdk);
  vm.synthetic(resolve('src/firebase.js'),{db:reader,auth:{currentUser:{uid:'readpath-office',getIdTokenResult:async()=>({claims:claims('office')})}}});
  const {openAction}=await vm.load('src/services/actionGateway.js');
  const {saveProductReceipt}=await vm.load('src/services/productReceipt.js');
  const actions=await Promise.all([openAction({refs}),openAction({refs})]);
  const results=await Promise.allSettled(actions.map(action=>saveProductReceipt({action,refs,p:action.values[0],target:'cat',result:{plates:2,loose:0,totalPacks:200,boxes:10,remainder:0},method:null,emergency:{reason:'동시 수정 검증'},staff:'사무실'})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await sdk.getDocFromServer(sdk.doc(reader,refs[0]))).data().receivedRevision,2);
  assert.equal((await sdk.getDocFromServer(sdk.doc(reader,`productTransferRequests/productions:${id}:2`))).data().packs,200);
  const logs=await sdk.getDocsFromServer(sdk.query(sdk.collection(reader,'activityLogs'),sdk.where('subAction','==','receiptEmergencyEdit')));
  assert.equal(logs.docs.filter(d=>d.data().details?.productionId===id).length,1);
});
test('real SDK background revision cannot authorize a stale displayed form',async()=>{
 const vm=await environment({session:true,instantRoutes:['egg']});vm.synthetic('firebase/firestore',transactionSdk);
 vm.synthetic(resolve('src/firebase.js'),{db:reader,auth:{currentUser:{uid:'readpath-office',getIdTokenResult:async()=>({claims:claims('office')})}}});
 (await vm.load('src/utils/pageLifecycle.js')).beginPage(vm.nodes.mainContent,'egg');
 const resource=(await vm.load('src/state/pageResources.js')).pageResource('egg');
 const ref=sdk.doc(reader,'eggStock/global');
 await env.withSecurityRulesDisabled(async context=>sdk.setDoc(sdk.doc(context.firestore(),'eggStock/global'),{currentQty:10,minimumQty:0}));
 const loader=async scope=>(await scope.getDoc(ref)).data();
 await resource.load(loader);
 await sdk.updateDoc(sdk.doc(admin,'eggStock/global'),{currentQty:20});
 await resource.prepare('default',loader,{force:true});
 assert.equal(resource.model.currentQty,10);
 let writes=0;
 const {withReadCommand}=await vm.load('src/services/readCommand.js');
 await assert.rejects(()=>withReadCommand(resource,command=>command.commit({commit:async()=>writes++})),/원본이 변경/);
 assert.equal(writes,0);
 (await vm.load('src/state/sessionStore.js')).sessionStore.clear();
});
test('shared rules retain production role access and deny another app',async()=>{
  await env.withSecurityRulesDisabled(async context=>sdk.setDoc(sdk.doc(context.firestore(),'eggStock/global'),{currentQty:10,minimumQty:0}));
  for(const role of ['admin','office','production'])await assertSucceeds(sdk.getDocFromServer(sdk.doc(env.authenticatedContext('reader-'+role,claims(role)).firestore(),'eggStock/global')));
  await assertFails(sdk.getDocFromServer(sdk.doc(env.unauthenticatedContext().firestore(),'eggStock/global')));
  await assertFails(sdk.getDocFromServer(sdk.doc(env.authenticatedContext('inventory-only',{app:['inventory'],roles:{inventory:'owner'}}).firestore(),'eggStock/global')));
});
test('two clients: update/create/delete observed with one shared listener and logout cleanup',async()=>{
  const store=createSessionStore();store.clear('office');let count=0;let notice;
  const pool=createListenerPool({store,registry:createQueryRegistry(sdk.queryEqual),listen:(ref,next,error)=>{count++;return sdk.onSnapshot(ref,{includeMetadataChanges:true},next,error);}});
  const ref=sdk.collection(reader,'events');const first=await pool.getDocs(ref,'main');assert.equal(first.size,0);
  await pool.getDocs(sdk.collection(reader,'events'),'shell');assert.equal(count,1);
  pool.onChange('main',()=>notice?.());
  async function change(write,predicate){const next=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('listener update timeout')),5000);notice=async()=>{const s=await pool.getDocs(ref,'main');if(predicate(s)){clearTimeout(timer);resolve();}};});await write();await next;}
  await change(()=>sdk.setDoc(sdk.doc(admin,'events/test'),{date:'2026-09-14',title:'fixture'}),s=>s.size===1);
  await change(()=>sdk.updateDoc(sdk.doc(admin,'events/test'),{title:'updated'}),s=>s.docs[0]?.data().title==='updated');
  await change(()=>sdk.deleteDoc(sdk.doc(admin,'events/test')),s=>s.size===0);
  store.clear();assert.deepEqual(pool.inspect(),{listeners:0,owners:0,waiting:0});
});
test('real SDK command rejects changed source and offline before writing',async()=>{
  const vm=await environment();vm.synthetic('firebase/firestore',sdk);
  vm.synthetic(resolve('src/firebase.js'),{db:reader,auth:{currentUser:{uid:'readpath-office',getIdTokenResult:async()=>({claims:claims('office')})}}});
  const {openAction}=await vm.load('src/services/actionGateway.js');const action=await openAction({refs:['eggStock/global']});
  await sdk.updateDoc(sdk.doc(admin,'eggStock/global'),{currentQty:20});let writes=0;
  await assert.rejects(()=>action.submit(()=>writes++),/원본이 변경/);
  const offline=await openAction({refs:['eggStock/global']});await sdk.disableNetwork(reader);
  await assert.rejects(()=>offline.submit(()=>writes++));await sdk.enableNetwork(reader);assert.equal(writes,0);
});
test('date IN queries preserve missing closing docs and actual server semantics',async()=>{
  await env.withSecurityRulesDisabled(async context=>sdk.setDoc(sdk.doc(context.firestore(),'closings/2026-09-11'),{status:'closed'}));
  const s=await sdk.getDocsFromServer(sdk.query(sdk.collection(reader,'closings'),sdk.where(sdk.documentId(),'in',['2026-09-10','2026-09-11'])));
  assert.deepEqual(s.docs.map(d=>d.id),['2026-09-11']);
});

test('real SDK supports dated production and timestamp-cursor history reads',async()=>{
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await Promise.all([
      sdk.setDoc(sdk.doc(db,'productions/paged-a'),{date:'2026-08-12',sortOrder:1,status:'active'}),
      sdk.setDoc(sdk.doc(db,'productions/paged-b'),{date:'2026-08-11',sortOrder:2,status:'active'}),
      sdk.setDoc(sdk.doc(db,'meatLogs/paged-a'),{stage:'frozen',timestamp:sdk.Timestamp.fromMillis(2000),meatTypeId:'m1'}),
      sdk.setDoc(sdk.doc(db,'meatLogs/paged-b'),{stage:'frozen',timestamp:sdk.Timestamp.fromMillis(1000),meatTypeId:'m1'}),
      sdk.setDoc(sdk.doc(db,'bagLogs/paged-a'),{bagTypeId:'b1',timestamp:sdk.Timestamp.fromMillis(2000)}),
      sdk.setDoc(sdk.doc(db,'bagLogs/paged-b'),{bagTypeId:'b1',timestamp:sdk.Timestamp.fromMillis(1000)}),
    ]);
  });
  const productions=sdk.collection(reader,'productions');
  const productionQuery=sdk.query(productions,sdk.where('date','<','2026-08-13'),sdk.orderBy('date','desc'),sdk.limit(1));
  const first=await sdk.getDocsFromServer(productionQuery);
  assert.equal(first.docs[0].id,'paged-a');
  const second=await sdk.getDocsFromServer(sdk.query(productions,sdk.where('date','<','2026-08-13'),sdk.orderBy('date','desc'),sdk.startAfter(first.docs[0]),sdk.limit(1)));
  assert.equal(second.docs[0].id,'paged-b');
  const dated=await sdk.getDocsFromServer(sdk.query(productions,sdk.where('date','in',['2026-08-11','2026-08-12'])));
  assert.deepEqual(dated.docs.map(doc=>doc.id),['paged-a','paged-b']);
  const meat=sdk.collection(reader,'meatLogs');
  const recent=await sdk.getDocsFromServer(sdk.query(meat,sdk.where('stage','==','frozen'),sdk.orderBy('timestamp','desc'),sdk.limit(1)));
  assert.equal(recent.docs[0].id,'paged-a');
  const older=await sdk.getDocsFromServer(sdk.query(meat,sdk.where('stage','==','frozen'),sdk.orderBy('timestamp','desc'),sdk.startAfter(recent.docs[0]),sdk.limit(1)));
  assert.equal(older.docs[0].id,'paged-b');
  const bag=await sdk.getDocsFromServer(sdk.query(sdk.collection(reader,'bagLogs'),sdk.where('bagTypeId','==','b1'),sdk.orderBy('timestamp','desc'),sdk.limit(30)));
  assert.equal(bag.docs[0].id,'paged-a');
});

test('real SDK query insert aborts a retained-page command with zero business writes',async()=>{
  const vm=await environment({session:true});vm.synthetic('firebase/firestore',sdk);
  vm.synthetic(resolve('src/firebase.js'),{db:reader,auth:{currentUser:{uid:'readpath-office',getIdTokenResult:async()=>({claims:claims('office')})}}});
  (await vm.load('src/utils/pageLifecycle.js')).beginPage(vm.nodes.mainContent,'recipe');
  const resource=(await vm.load('src/state/pageResources.js')).pageResource('recipe');
  await resource.load(async scope=>(await scope.getDocs(sdk.collection(reader,'events'))).docs.map(d=>({id:d.id,...d.data()})));
  const {withReadCommand}=await vm.load('src/services/readCommand.js');let writes=0;
  await assert.rejects(()=>withReadCommand(resource,async command=>{
    await command.getDocs(sdk.collection(reader,'events'));
    await sdk.setDoc(sdk.doc(admin,'events/phantom'),{date:'2026-09-14',title:'insert during confirmation'});
    await command.commit({commit:async()=>writes++});
  }),/원본이 변경/);assert.equal(writes,0);
  (await vm.load('src/state/sessionStore.js')).sessionStore.clear();
});

test('real SDK supplement commands keep atomic stock/log writes and abort negative quantities',async()=>{
  await env.withSecurityRulesDisabled(async context=>sdk.setDoc(sdk.doc(context.firestore(),'supplementStock/fixture-sku'),{id:'fixture-sku',supplementTypeId:'fixture-sku',currentQty:10}));
  const vm=await environment({session:true,instrument:{'src/pages/supplement.js':'\nexport {saveIncomingCell,saveAdjustCell};'}});vm.synthetic('firebase/firestore',transactionSdk);
  vm.synthetic(resolve('src/firebase.js'),{db:reader,auth:{currentUser:{uid:'readpath-office',getIdTokenResult:async()=>({claims:claims('office')})}}});
  (await vm.load('src/utils/pageLifecycle.js')).beginPage(vm.nodes.mainContent,'supplement');
  const resource=(await vm.load('src/state/pageResources.js')).pageResource('supplement');
  const refresh=()=>resource.load(async scope=>(await scope.getDocs(sdk.collection(reader,'supplementStock'))).docs.map(d=>({id:d.id,...d.data()})),{force:true});
  await refresh();const page=await vm.load('src/pages/supplement.js');
  await page.saveIncomingCell('fixture-sku','2026-09-14',5,'fixture');
  assert.equal((await sdk.getDocFromServer(sdk.doc(reader,'supplementStock/fixture-sku'))).data().currentQty,15);
  await refresh();await assert.rejects(()=>page.saveAdjustCell('fixture-sku','2026-09-14',-16,'fixture','fixture'),/NEGATIVE_SUPPLEMENT_STOCK/);
  assert.equal(resource.blocked,false);assert.equal((await sdk.getDocsFromServer(sdk.query(sdk.collection(reader,'supplementLogs'),sdk.where('supplementTypeId','==','fixture-sku')))).size,1);
  (await vm.load('src/state/sessionStore.js')).sessionStore.clear();
});


const inventoryReader=env.authenticatedContext('receipt-inventory',{app:['inventory'],roles:{inventory:'owner'}}).firestore();
async function seedReceiptHead(id, revision=2, previousStatus='pending') {
 await env.withSecurityRulesDisabled(async context=>{
  const db=context.firestore();
  await sdk.setDoc(sdk.doc(db,`productions/${id}`),{category:'raw',receivedRevision:revision});
  for (let r=1;r<=revision;r++) await sdk.setDoc(sdk.doc(db,`productTransferRequests/productions:${id}:${r}`),{
   category:'raw',sourceApp:'production',sourceCollection:'productions',sourceId:id,eventType:'productReceipt',revision:r,status:r===1?previousStatus:'pending',
  });
 });
}
test('shared rules deny stale and metadata-free raw completion, including an atomic companion write',async()=>{
 const id='rule-stale';await seedReceiptHead(id);
 const batch=sdk.writeBatch(inventoryReader);
 batch.update(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:1`),{status:'completed'});
 batch.update(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:2`),{reviewedBy:'atomic-probe'});
 await assertFails(batch.commit());
 assert.equal((await sdk.getDoc(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:2`))).data().reviewedBy,undefined);
 await assertSucceeds(sdk.updateDoc(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:2`),{status:'completed'}));
 await assertFails(sdk.getDoc(sdk.doc(inventoryReader,`productions/${id}`)));
 await env.withSecurityRulesDisabled(context=>sdk.setDoc(sdk.doc(context.firestore(),'productTransferRequests/legacy-raw'),{category:'raw',status:'pending'}));
 await assertFails(sdk.updateDoc(sdk.doc(inventoryReader,'productTransferRequests/legacy-raw'),{status:'입고완료'}));
});
test('completed receipt requires reversal before production correction',async()=>{
 const id='rule-reversal';await seedReceiptHead(id,1,'입고완료');
 const correct=()=>{
  const batch=sdk.writeBatch(reader);
  batch.update(sdk.doc(reader,`productions/${id}`),{receivedRevision:2});
  batch.set(sdk.doc(reader,`productTransferRequests/productions:${id}:2`),{category:'raw',sourceApp:'production',sourceCollection:'productions',sourceId:id,eventType:'productReceipt',revision:2,status:'pending'});
  return batch.commit();
 };
 await assertFails(correct());
 await assertSucceeds(sdk.updateDoc(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:1`),{status:'pending'}));
 await assertSucceeds(correct());
 await assertFails(sdk.updateDoc(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:1`),{status:'completed'}));
});
test('production correction racing inventory completion permits exactly one commit',async()=>{
 const id='rule-race';await seedReceiptHead(id,1);
 const batch=sdk.writeBatch(reader);
 batch.update(sdk.doc(reader,`productions/${id}`),{receivedRevision:2});
 batch.set(sdk.doc(reader,`productTransferRequests/productions:${id}:2`),{category:'raw',sourceApp:'production',sourceCollection:'productions',sourceId:id,eventType:'productReceipt',revision:2,status:'pending'});
 const results=await Promise.allSettled([batch.commit(),sdk.updateDoc(sdk.doc(inventoryReader,`productTransferRequests/productions:${id}:1`),{status:'completed'})]);
 assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
});


test('real production service creates a linked adjustment using inventory actual quantity as its basis', async()=>{
 const id='receipt-actual-basis', date='2026-07-01';
 const refs=[`productions/${id}`,'recipes/basis-recipe','settings/systemValues',`closings/${date}`,`productTransferRequests/productions:${id}:1`];
 await env.withSecurityRulesDisabled(async context=>{
  const db=context.firestore();
  await sdk.setDoc(sdk.doc(db,refs[0]),{date,recipeId:'basis-recipe',recipeName:'검증',category:'raw',target:'cat',status:'active',received:true,receivedRevision:1,receivedTotalPacks:100});
  await sdk.setDoc(sdk.doc(db,refs[1]),{packsPerPlate:100});
  await sdk.setDoc(sdk.doc(db,refs[2]),{packsPerPlateCat:100});
  await sdk.setDoc(sdk.doc(db,refs[3]),{status:'closed'});
  await sdk.setDoc(sdk.doc(db,refs[4]),{category:'raw',sourceApp:'production',sourceCollection:'productions',sourceId:id,eventType:'productReceipt',revision:1,status:'completed',boxes:5,remainderPacks:0,actualBoxes:6,actualRemainderPacks:2});
 });
 const vm=await environment();vm.synthetic('firebase/firestore',transactionSdk);
 vm.synthetic(resolve('src/firebase.js'),{db:reader,auth:{currentUser:{uid:'readpath-office',getIdTokenResult:async()=>({claims:claims('office')})}}});
 const {openAction}=await vm.load('src/services/actionGateway.js');const action=await openAction({refs});
 const {saveProductReceipt}=await vm.load('src/services/productReceipt.js');
 await saveProductReceipt({action,refs,p:action.values[0],target:'cat',result:{plates:2,loose:0,totalPacks:200,boxes:10,remainder:0},method:null,emergency:{reason:'실측 기준 정정'},staff:'사무실'});
 const request=(await sdk.getDocFromServer(sdk.doc(reader,`productTransferRequests/productions:${id}:2`))).data();
 assert.equal(request.receiptMode,'adjustment');assert.equal(request.correctionOf,`productions:${id}:1`);
 assert.equal(request.basisBoxes,6);assert.equal(request.basisRemainderPacks,2);assert.equal(request.boxes,10);
});
