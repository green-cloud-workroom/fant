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
const require=createRequire(resolve(process.env.READPATH_INVENTORY_REPO,'package.json'));
const sdk=require('firebase/firestore');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const env=await initializeTestEnvironment({projectId:'demo-fant-readpath',firestore:{host:'127.0.0.1',port:8088,rules:await readFile('output/readpath/emulator/firestore.rules','utf8')}});
const claims=role=>({app:['production'],roles:{production:role}});
const admin=env.authenticatedContext('readpath-admin',claims('admin')).firestore();
const reader=env.authenticatedContext('readpath-office',claims('office')).firestore();
test.after(async()=>env.cleanup());
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
