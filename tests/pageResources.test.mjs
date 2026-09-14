import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {environment} from './helpers/modules.mjs';
async function setup(){
  const env=await environment({session:true});
  const auth={currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})}};
  env.synthetic(resolve('src/firebase.js'),{db:{},auth});
  const lifecycle=await env.load('src/utils/pageLifecycle.js');lifecycle.beginPage(env.nodes.mainContent,'recipe');
  const resources=await env.load('src/state/pageResources.js'),resource=resources.pageResource('recipe');
  const ref=env.api.collection({},'recipes');
  const loader=async scope=>(await scope.getDocs(ref)).docs.map(d=>({id:d.id,...d.data()}));
  const model=await resource.load(loader);
  return {...env,auth,lifecycle,resources,resource,ref,loader,model,command:await env.load('src/services/readCommand.js')};
}
test('warm page models reuse reads and isolate mutable form copies',async()=>{
  const e=await setup(),reads=e.state.reads.length;e.model[0].name='draft';
  for(let i=0;i<20;i++){const model=await e.resource.load(e.loader);assert.notEqual(model[0].name,'draft');}
  assert.equal(e.state.reads.length,reads);
});
test('inactive external changes invalidate a model; returning reads the same listener',async()=>{
  const e=await setup();e.lifecycle.beginPage({isConnected:true},'other');
  e.state.rows.recipes[0].name='changed';await e.state.notify('recipes');
  assert.equal(e.resource.dirty,true);const count=e.state.reads.length;
  e.lifecycle.beginPage(e.nodes.mainContent,'recipe');assert.equal((await e.resource.load(e.loader))[0].name,'changed');
  assert.equal(e.state.reads.length,count);
});
test('models and inactive listener owners are bounded across 100 route entries',async()=>{
  const e=await setup();
  for(let i=0;i<100;i++){const route='test-'+i%5;e.lifecycle.beginPage({isConnected:true},route);await e.resources.pageResource(route).load(e.loader);}
  const stats=e.resources.inspectPageResources();assert.ok(stats.filter(r=>r.cached).length<=3);assert.equal(stats.filter(r=>r.active).length,1);
  const {displayPool}=await e.load('src/state/displayReads.js');assert.ok(displayPool.inspect().owners<=3);
});
test('changed bootstrap data stops commands before any write',async()=>{
  const e=await setup();e.state.rows.recipes[0].name='external';let writes=0;
  await assert.rejects(()=>e.command.withReadCommand(e.resource,c=>c.commit({commit:async()=>writes++})),/원본이 변경/);assert.equal(writes,0);
});
test('confirmation read set detects inserted rows and quantity changes',async()=>{
  const e=await setup();let writes=0;
  await assert.rejects(()=>e.command.withReadCommand(e.resource,async c=>{await c.getDocs(e.api.collection({},'supplementStock'));e.state.rows.supplementStock.push({id:'new',currentQty:1});await c.commit({commit:async()=>writes++});}),/원본이 변경/);assert.equal(writes,0);
});
test('permission, session changes and offline reads fail closed',async()=>{
  for(const kind of ['permission','session','offline']){const e=await setup();let writes=0;
    await assert.rejects(()=>e.command.withReadCommand(e.resource,async c=>{if(kind==='permission')e.auth.currentUser.getIdTokenResult=async()=>({claims:{roles:{production:'production'}}});if(kind==='session')(await e.load('src/state/sessionStore.js')).sessionStore.clear();if(kind==='offline')e.state.failures.add('recipes');await c.commit({commit:async()=>writes++});}));assert.equal(writes,0);
  }
});
test('ambiguous commit reads back and cannot be retried by another handler',async()=>{
  const e=await setup();let writes=0,readBack;
  await assert.rejects(()=>e.command.withReadCommand(e.resource,c=>c.commit({commit:async()=>{writes++;throw Error('transport interrupted');}},{targets:[e.api.doc({},'recipes','r1')]})),error=>{readBack=error.readBack;return error.code==='outcome-unknown';});
  assert.equal(writes,1);assert.equal(readBack[0].serverObserved,true);assert.equal(e.resource.blocked,true);
  await assert.rejects(()=>e.command.withReadCommand(e.resource,()=>writes++),/직전 저장 결과/);assert.equal(writes,1);
});
test('concurrent commands and repeated commits dispatch exactly once',async()=>{
  const e=await setup();let release,writes=0;const first=e.command.withReadCommand(e.resource,async c=>{await new Promise(r=>release=r);await c.commit({commit:async()=>writes++});await assert.rejects(()=>c.commit({commit:async()=>writes++}),/이미 전송/);});
  await assert.rejects(()=>e.command.withReadCommand(e.resource,()=>writes++),/처리 중/);
  while(!release)await new Promise(r=>setTimeout(r,0));release();await first;assert.equal(writes,1);
});
test('parallel commits within one command dispatch once after asynchronous validation',async()=>{
  const e=await setup();let writes=0;
  await e.command.withReadCommand(e.resource,async c=>{const results=await Promise.allSettled([c.commit({commit:async()=>writes++}),c.commit({commit:async()=>writes++})]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);});assert.equal(writes,1);
});
test('a never-acknowledged write times out into read-back without sending again',async()=>{
  const e=await setup();let writes=0;
  await assert.rejects(()=>e.command.withReadCommand(e.resource,c=>c.commit({commit:()=>{writes++;return new Promise(()=>{});}},{targets:[e.api.doc({},'recipes','r1')]}),{timeoutMs:5}),error=>error.code==='outcome-unknown');
  assert.equal(writes,1);assert.equal(e.resource.blocked,true);
});

test('a late load cannot replace a newer model in the same page',async()=>{
  const e=await setup();let finish;
  const old=e.resource.load(()=>new Promise(resolve=>finish=resolve),{force:true});
  const newer=await e.resource.load(async()=>['new'],{force:true});finish(['old']);
  assert.equal(await old,null);assert.equal(newer[0],'new');assert.equal(e.resource.model[0],'new');
});

test('eviction also releases fingerprints, query registry refs and Sortable.create instances',async()=>{
  const e=await setup();
  const registry=(await e.load('src/state/queryRegistry.js')).createQueryRegistry(e.api.queryEqual);
  const {createListenerPool}=await e.load('src/state/listenerPool.js');
  const {createSessionStore}=await e.load('src/state/sessionStore.js');
  const pool=createListenerPool({store:createSessionStore(),registry,listen:(ref,next,error)=>e.api.onSnapshot(ref,{},next,error)});
  for(let i=0;i<100;i++){await pool.getDocs(e.api.query(e.ref,e.api.where('name','==',String(i))),'test');pool.releaseOwner('test',true);}
  assert.equal(registry.inspect(),0);
  for(let i=0;i<5;i++){e.lifecycle.beginPage({isConnected:true},'r'+i);await e.resources.pageResource('r'+i).load(e.loader);}
  assert.equal(e.resource.observations.length,0);
  const {default:Sortable}=await e.load('src/utils/sortable.js');const instance=Sortable.create({});e.lifecycle.disposePage();assert.equal(instance._disposed,true);
});

