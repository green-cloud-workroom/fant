import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import * as firestore from 'firebase/firestore';
import {stockOperationId,assertOwnedLock} from '../src/services/supplementRequestLogic.js';

// Fail closed: this suite only connects to the runner's loopback emulator.
const host='127.0.0.1',port=8786,projectId='demo-supreq-app-e2e';
const rulesPath=resolve(process.env.SUPREQ_RULES_PATH || 'C:/dev/fant-production/output/supreq/rules/candidate-live.rules');
const {doc,collection,getDocFromServer,getDocsFromServer,runTransaction,serverTimestamp,Timestamp,setDoc}=firestore;
firestore.setLogLevel('silent');
const actor=uid=>({uid,name:uid});
const items=Array.from({length:3},(_,i)=>({supplementTypeId:`e2e${i}_10`,recipeId:`e2e${i}`,recipeName:`Recipe ${i}`,unit:10,qty:i+2}));
let env;
const dbs={};

// Only the app shell (identity/db) is replaced. Firestore SDK, request logic,
// activityLogs and manualMovements are the real implementations, unmodified.
async function app(uid,role,clockOffset=0) {
  const db=env.authenticatedContext(uid,{app:['production'],roles:{production:role}}).firestore();
  dbs[uid]=db;
  class ClientDate extends Date { static now(){return Date.now()+clockOffset;} }
  const context=vm.createContext({console,Date:ClientDate,setTimeout,clearTimeout});
  const cache=new Map();
  function synthetic(id,exports){cache.set(id,new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v);},{context,identifier:id}));}
  // VM literals have a different Object.prototype. Re-home only plain data
  // at the SDK boundary; preserve real SDK transforms/timestamps/references.
  const hostData=value=>Array.isArray(value)?Array.from(value,hostData)
    : value && Object.getPrototypeOf(value)?.constructor?.name==='Object'
      ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,hostData(v)])):value;
  const sdk={...firestore,runTransaction:(db,callback,options)=>runTransaction(db,tx=>callback({
    get:ref=>tx.get(ref),
    set:(ref,data,...args)=>tx.set(ref,hostData(data),...args),
    update:(ref,data)=>tx.update(ref,hostData(data)),
    delete:ref=>tx.delete(ref),
  }),options)};
  synthetic('firebase/firestore',sdk);
  synthetic(resolve('src/firebase.js'),{db});
  synthetic(resolve('src/app.js'),{currentUser:{uid},currentUserRole:role});
  function moduleFor(id){
    if(!cache.has(id))cache.set(id,new vm.SourceTextModule(readFileSync(id,'utf8'),{context,identifier:id}));
    return cache.get(id);
  }
  async function load(path){
    const m=moduleFor(resolve(path));
    if(m.status==='unlinked')await m.link((specifier,parent)=>moduleFor(specifier.startsWith('.')?resolve(dirname(parent.identifier),specifier):specifier));
    if(m.status==='linked')await m.evaluate();
    return m.namespace;
  }
  return {db,by:actor(uid),requests:await load('src/services/supplementRequests.js'),manual:await load('src/services/manualMovements.js')};
}
async function row(client,id){const snap=await getDocFromServer(doc(client.db,'supplementRequests',id));return {...snap.data(),id};}
async function seed(path,data){
  // UI rows carry an id, but it is not a stored request schema field.
  const {id,...stored}=data;
  await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),path),stored));
}
// Handler lives in the separate recipe app. Model only its authorized start/done
// transaction here; do not bypass rules or seed a pre-completed request.
async function handler(admin,id,status,action){
  const ref=doc(admin.db,'supplementRequests',id);
  await runTransaction(admin.db,async tx=>{
    const before=(await tx.get(ref)).data();
    const patch={status,version:before.version+1,updatedAt:serverTimestamp(),updatedBy:admin.by};
    tx.update(ref,patch);
    tx.set(doc(collection(ref,'events')),{at:serverTimestamp(),by:admin.by,action,version:patch.version,from:before.status,to:status});
  });
}
async function ready(client,admin){
  const created=await client.requests.saveRequest(null,'create',{items,note:'E2E'},client.by);
  await handler(admin,created.id,'preparing','start');
  await handler(admin,created.id,'done','complete');
  return row(client,created.id);
}
function incoming(client,id,hook=async()=>{}){
  return async(item,extraWrites)=>{
    await hook(item);
    return client.manual.saveManualMovement({db:client.db,name:'supplementLogs',stockId:item.supplementTypeId,uid:client.by.uid,
      log:{type:'in',date:'2026-11-03',qty:item.qty,supplementTypeId:item.supplementTypeId,staffName:client.by.name},
      selection:{kind:'receipt',reason:'',cancelOf:null,operationId:stockOperationId(id,item.supplementTypeId)},extraWrites});
  };
}
async function evidence(client,id,n=3){
  const request=await row(client,id);
  assert.equal(Object.keys(request.stockIn||{}).length,n);
  const logs=(await getDocsFromServer(collection(client.db,'supplementLogs'))).docs;
  assert.equal(logs.length,n);
  for(const [index,item] of items.entries()){
    const stock=(await getDocFromServer(doc(client.db,'supplementStock',item.supplementTypeId))).data();
    assert.equal(stock.currentQty,10+(index<n?item.qty:0));
    const logId=stockOperationId(id,item.supplementTypeId);
    assert.equal(logs.filter(s=>s.id===logId).length,index<n?1:0);
    if(index<n){
      const log=logs.find(s=>s.id===logId).data();
      assert.equal(request.stockIn[item.supplementTypeId].logId,logId);
      assert.equal(log.before,10);assert.equal(log.after,10+item.qty);
      const proof=(await getDocFromServer(doc(client.db,'supplementContractProofs','m_'+logId))).data();
      assert.equal(proof.logId,logId);assert.equal(proof.after,log.after);
      assert.equal((await getDocFromServer(doc(client.db,'stockLedger','manual_v1_'+logId))).exists(),true);
    }
  }
  return request;
}

test('real application modules against configured rules (emulator only)',async t=>{
  env=await initializeTestEnvironment({projectId,firestore:{host,port,rules:readFileSync(rulesPath,'utf8')}});
  try {
    const admin=await app('e2e-admin','admin'),office=await app('e2e-office','office');
    async function reset(){
      await env.clearFirestore();
      for(const item of items){
        // Live smStockMath requires an existing SKU; the old broad draft did not.
        await seed('supplementTypes/'+item.supplementTypeId,{recipeId:item.recipeId,unit:item.unit});
        await seed('supplementStock/'+item.supplementTypeId,{supplementTypeId:item.supplementTypeId,currentQty:10});
      }
    }
    for(const client of [admin,office]){
      await t.test(client.by.uid+': real create/edit/cancel',async()=>{
        await reset();
        let r=await client.requests.saveRequest(null,'create',{items,note:'new'},client.by);
        r=await client.requests.saveRequest(r,'editItems',{items:items.slice(0,2),note:'edit'},client.by);
        r=await client.requests.saveRequest(r,'editNote',{note:'memo'},client.by);
        await client.requests.saveRequest(r,'cancel',{},client.by);
        const stored=await row(client,r.id);assert.equal(stored.status,'cancelled');assert.equal(stored.version,4);assert.equal(stored.items.length,2);
        assert.equal((await getDocsFromServer(collection(client.db,'supplementRequests',r.id,'events'))).size,4);
      });
      await t.test(client.by.uid+': create -> handler start -> done -> three receipts; second click writes nothing',async()=>{
        await reset();const r=await ready(client,admin);
        let lock;
        await client.requests.stockInRequest(r,client.by,incoming(client,r.id,async()=>{lock=(await row(client,r.id)).stockInLock;assert.ok(lock.at instanceof Timestamp);}));
        assert.equal(lock.uid,client.by.uid);
        const done=await evidence(client,r.id);assert.ok(done.stockInCompletedAt);assert.equal(done.stockInLock,null);
        const before=(await getDocsFromServer(collection(client.db,'activityLogs'))).size;
        await client.requests.stockInRequest(r,client.by,()=>{throw Error('second click must not enter writer');});
        assert.equal((await row(client,r.id)).version,done.version);
        assert.equal((await getDocsFromServer(collection(client.db,'activityLogs'))).size,before);
        await evidence(client,r.id);
      });
    }
    await t.test('failure after item 2; release and resume writes only item 3',async()=>{
      await reset();const r=await ready(office,admin);
      await assert.rejects(office.requests.stockInRequest(r,office.by,incoming(office,r.id,async item=>{if(item===undefined)throw Error('invalid');if(item.supplementTypeId===items[2].supplementTypeId)throw Error('simulated failure after item 2');})),/simulated failure/);
      const partial=await evidence(office,r.id,2);assert.equal(partial.stockInLock,null);assert.equal(partial.stockInCompletedAt,undefined);
      const called=[];
      await office.requests.stockInRequest(partial,office.by,incoming(office,r.id,async item=>called.push(item.supplementTypeId)));
      assert.deepEqual(called,[items[2].supplementTypeId]);await evidence(office,r.id);
    });
    for(const sameUser of [false,true])await t.test(`concurrent stock-in (${sameUser?'same uid, two tabs':'office/admin'}) exactly one log per item`,async()=>{
      await reset();const r=await ready(office,admin),other=sameUser?await app(office.by.uid,'office'):admin;
      // Both clicks start from the exact same version. Let the SDK arbitrate.
      const results=await Promise.allSettled([office.requests.stockInRequest(r,office.by,incoming(office,r.id)),other.requests.stockInRequest(r,other.by,incoming(other,r.id))]);
      assert.equal(results.filter(x=>x.status==='fulfilled').length,1,JSON.stringify(results));
      assert.equal(results.filter(x=>x.status==='rejected').length,1);
      const done=await evidence(office,r.id);assert.ok(done.stockInCompletedAt);
    });
    await t.test('clock ahead cannot steal active lock; server-expired lock can be taken over despite clock behind',async()=>{
      await reset();const r=await ready(office,admin);
      await seed('supplementRequests/'+r.id,{...r,stockInLock:{uid:admin.by.uid,at:Timestamp.now()}});
      const fast=await app('e2e-fast','office',86400000);
      await assert.rejects(fast.requests.stockInRequest(r,fast.by,incoming(fast,r.id)),/다른 사람이 입고 중/);
      assert.equal((await getDocsFromServer(collection(office.db,'supplementLogs'))).size,0);
      await seed('supplementRequests/'+r.id,{...r,stockInLock:{uid:admin.by.uid,at:Timestamp.fromMillis(Date.now()-180000)}});
      const slow=await app('e2e-slow','office',-86400000);
      await slow.requests.stockInRequest(r,slow.by,incoming(slow,r.id));await evidence(slow,r.id);
    });
    await t.test('release denied for foreign/expired leases, allowed for live owner; client timestamp acquire denied',async()=>{
      await reset();const r=await ready(office,admin),ref=doc(office.db,'supplementRequests',r.id);
      const change=patch=>runTransaction(office.db,async tx=>{
        const b=(await tx.get(ref)).data();tx.update(ref,{...patch,version:b.version+1,updatedAt:serverTimestamp(),updatedBy:office.by});
        tx.set(doc(collection(ref,'events')),{action:'stockIn',at:serverTimestamp(),by:office.by,version:b.version+1,from:'done',to:'done'});
      });
      await assertFails(change({stockInLock:{uid:office.by.uid,at:Timestamp.fromMillis(1)}}));
      for(const [uid,at,allowed] of [[admin.by.uid,Timestamp.now(),false],[office.by.uid,Timestamp.fromMillis(1),false],[office.by.uid,Timestamp.now(),true]]){
        await seed('supplementRequests/'+r.id,{...r,stockInLock:{uid,at}});
        if(allowed)await change({stockInLock:null});else await assertFails(change({stockInLock:null}));
      }
    });
    await t.test('ownership compares nanoseconds, independently of client expiry',()=>{
      const at=new Timestamp(100,1),lock={uid:'owner',at};
      assert.doesNotThrow(()=>assertOwnedLock({stockInLock:lock},{uid:'owner',at:new Timestamp(100,1)},Infinity));
      assert.throws(()=>assertOwnedLock({stockInLock:lock},{uid:'owner',at:new Timestamp(100,2)}));
    });
    await t.test('proof cannot be forged, updated, deleted or created by unrelated roles',async()=>{
      await reset();const r=await ready(office,admin);await office.requests.stockInRequest(r,office.by,incoming(office,r.id));
      const id='m_'+stockOperationId(r.id,items[0].supplementTypeId),ref=doc(office.db,'supplementContractProofs',id),p=(await getDocFromServer(ref)).data();
      await assertFails(firestore.updateDoc(ref,{after:999}));await assertFails(firestore.deleteDoc(ref));
      await assertFails(setDoc(doc(office.db,'supplementContractProofs','m_supreq_fake'),{...p,logId:'supreq_fake'}));
      const production=await app('e2e-production','production');
      await assertFails(setDoc(doc(production.db,'supplementContractProofs','m_supreq_fake'),{...p,uid:production.by.uid,logId:'supreq_fake'}));
    });
  } finally {await env.cleanup();}
});
