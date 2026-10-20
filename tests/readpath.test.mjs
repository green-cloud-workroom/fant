import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createSessionStore } from '../src/state/sessionStore.js';
import { createQueryRegistry } from '../src/state/queryRegistry.js';
import { createListenerPool } from '../src/state/listenerPool.js';
import { environment } from './helpers/modules.mjs';
import { parseHTML } from 'linkedom';

async function routedLayout(instant) {
 const e=await environment({session:true,realRouter:true,instantRoutes:instant?['main']:[],
  instrument:{'src/layout.js':'\nexport {updateProductionDateButton};'}});
 e.cache.delete(resolve('src/layout.js'));
 e.synthetic(resolve('src/config/performanceFlags.js'),{flags:{shell:instant,store:instant,instantRoutes:instant?['main']:[]},performanceDisabled:()=>!instant,useSessionReads:()=>instant});
 const app=e.synthetic(resolve('src/app.js'),{currentMenu:'main',currentUser:{uid:'fixture'},currentUserRole:'office',MENUS:[],setCurrentMenu(){},handleLogout(){},commitCurrentMenu(){},registerNavigationHandler(){}});
 const {document}=parseHTML('<html><body><main id="mainContent"></main><button id="subToday"></button></body></html>');
 e.context.document=document;e.context.window.addEventListener=()=>{};e.context.requestAnimationFrame=()=>{};
 e.context.console={...console,error:()=>{}};
 let render=async()=>{document.getElementById('mainContent').textContent='main data';};
 e.synthetic(resolve('src/pages/main.js'),{renderMain:()=>render()});
 const layout=await e.load('src/layout.js'),router=await e.load('src/router.js');
 layout.updateProductionDateButton();
 return {...e,app,document,layout,router,setRender:fn=>{render=fn;},
  cleanup:async()=>{(await e.load('src/utils/pageLifecycle.js')).disposePage();(await e.load('src/state/sessionStore.js')).sessionStore.clear();}};
}

for(const instant of [false,true])test(`header date button waits for page readiness (${instant?'instant':'legacy'})`,async()=>{
 const e=await routedLayout(instant);
 try {
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const pending=e.router.renderPage('main',{ready:()=>gate,onReady:e.layout.updateProductionDateButton});
  assert.equal(e.document.getElementById('subToday').disabled,true);
  release();await pending;
  assert.equal(e.document.getElementById('mainContent').dataset.pageReady,'main');
  assert.equal(e.document.getElementById('subToday').disabled,false);
 } finally {await e.cleanup();}
});

test('failed main load keeps date selection disabled and retry enables it',async()=>{
 const e=await routedLayout(false);
 try {
  e.setRender(async()=>{throw Error('offline');});
  const options={onReady:e.layout.updateProductionDateButton};
  await e.router.renderPage('main',options);
  assert.ok(e.document.getElementById('retryPageLoad'));
  assert.equal(e.document.getElementById('subToday').disabled,true);
  e.setRender(async()=>{});await e.router.renderPage('main',options);
  assert.equal(e.document.getElementById('subToday').disabled,false);
 } finally {await e.cleanup();}
});

test('a main render finishing after navigation cannot enable the date button',async()=>{
 const e=await routedLayout(true);
 try {
  let release,started;const gate=new Promise(resolve=>{release=resolve;}),entered=new Promise(resolve=>{started=resolve;});
  e.setRender(async()=>{started();await gate;});
  const pending=e.router.renderPage('main',{onReady:e.layout.updateProductionDateButton});
  await entered;e.app.setExport('currentMenu','egg');
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.document.getElementById('mainContent'),'egg');
  release();await pending;
  assert.equal(e.document.getElementById('subToday').disabled,true);
  assert.notEqual(e.document.getElementById('mainContent').dataset.pageReady,'main');
 } finally {await e.cleanup();}
});

function setup(options = {}) {
  const store = createSessionStore(); store.clear('user:office:2026-09-14');
  const listeners = []; let released = 0;
  const pool = createListenerPool({ store, registry: createQueryRegistry((a,b)=>JSON.stringify(a)===JSON.stringify(b)),
    listen(ref,next,error) { listeners.push({ref,next,error}); return ()=>released++; }, graceMs: 5, timeoutMs: 1000, ...options });
  return {store,pool,listeners,get released(){return released;}};
}
const snap = (value, fromCache=false, hasPendingWrites=false) => ({
 value, metadata:{fromCache,hasPendingWrites},
 ...(Array.isArray(value)
  ? {docs:value.map((data,index)=>({id:String(index),data:()=>data})),size:value.length,empty:value.length===0}
  : {exists:()=>value!=null,data:()=>value}),
});

test('response metrics count only the first authoritative query and document snapshots',async()=>{
 const results=[],t=setup({onReadResult:result=>results.push(result)});
 const rows=t.pool.getDocs({path:'recipes'},'main');
 t.listeners[0].next(snap([],true));t.listeners[0].next(snap(['pending'],false,true));
 assert.equal(results.length,0);
 t.listeners[0].next(snap(['a','b']));await rows;
 t.listeners[0].next(snap(['a','b','c']));
 assert.equal(results.length,1);assert.equal(results[0].documents,2);
 const missing=t.pool.getDoc({path:'eggStock/missing'},'main');
 t.listeners[1].next(snap(null));await missing;
 assert.equal(results[1].documents,0);
 const found=t.pool.getDoc({path:'eggStock/global'},'main');
 t.listeners[2].next(snap({currentQty:1}));await found;
 assert.equal(results[2].documents,1);t.pool.dispose();
});

test('session epoch rejects old responses and clears all subscribers',()=>{
  const s=createSessionStore();s.clear('A');const epoch=s.epoch;let calls=0;
  s.subscribe('data',()=>calls++);s.publish('data',{value:1},epoch);s.clear('B');
  assert.equal(s.publish('data',{value:2},epoch),false);assert.equal(s.peek('data'),undefined);assert.equal(calls,1);
});
test('same semantic query shares one listener across owners and warm reads',async()=>{
  const t=setup();const a=t.pool.getDocs({path:'recipes'},'main');const b=t.pool.getDocs({path:'recipes'},'shell');
  assert.equal(t.listeners.length,1);t.listeners[0].next(snap(['r1']));assert.equal(await a,await b);
  assert.equal((await t.pool.getDocs({path:'recipes'},'main')).value[0],'r1');assert.equal(t.listeners.length,1);
  t.pool.releaseOwner('main',true);assert.equal(t.released,0);t.pool.releaseOwner('shell',true);assert.equal(t.released,1);assert.equal(t.pool.inspect().owners,0);
});
test('ordered and unordered queries remain separate',async()=>{
  const t=setup();const a=t.pool.getDocs({path:'productions'},'main');const b=t.pool.getDocs({path:'productions',order:'sortOrder'},'main');
  assert.equal(t.listeners.length,2);t.listeners.forEach(l=>l.next(snap([])));await Promise.all([a,b]);t.pool.dispose();
});
test('initial cache-only empty and pending-write snapshots do not claim authoritative readiness',async()=>{
  const t=setup();let ready=false;const p=t.pool.getDocs({path:'productions'},'main').then(()=>ready=true);
  t.listeners[0].next(snap([],true));await Promise.resolve();assert.equal(ready,false);
  t.listeners[0].next(snap([],false,true));await Promise.resolve();assert.equal(ready,false);
  t.listeners[0].next(snap([]));await p;assert.equal(ready,true);t.pool.dispose();
});
test('offline first load times out, explicit retry opens a new listener',async()=>{
  const t=setup({timeoutMs:10});const keepAlive=setTimeout(()=>{},100);
  await assert.rejects(t.pool.getDocs({path:'recipes'},'main'),e=>e.code==='unavailable');
  const retry=t.pool.getDocs({path:'recipes'},'main');assert.equal(t.listeners.length,2);t.listeners[1].next(snap([]));await retry;
  clearTimeout(keepAlive);t.pool.dispose();assert.equal(t.released,2);
});
test('permission error evicts data and retry recovers without owner leaks',async()=>{
  const t=setup();const p=t.pool.getDocs({path:'recipes'},'main');t.listeners[0].error(Object.assign(Error('denied'),{code:'permission-denied'}));
  await assert.rejects(p,/denied/);const retry=t.pool.getDocs({path:'recipes'},'main');t.listeners[1].next(snap([]));await retry;
  t.pool.releaseOwner('main',true);assert.deepEqual(t.pool.inspect(),{listeners:0,owners:0,waiting:0});
});
test('logout rejects outstanding reads and ignores late callbacks',async()=>{
  const t=setup();const p=t.pool.getDoc({path:'eggStock/global'},'main');t.store.clear('B');
  await assert.rejects(p,e=>e.code==='session-ended');t.listeners[0].next(snap({qty:999}));assert.equal(t.store.inspect().entries,0);assert.equal(t.released,1);
});
test('release grace cancels on reacquisition and expires without owners',async()=>{
  const t=setup();const p=t.pool.getDocs({path:'recipes'},'main');t.listeners[0].next(snap([]));await p;
  t.pool.releaseOwner('main');await t.pool.getDocs({path:'recipes'},'main');await new Promise(r=>setTimeout(r,10));assert.equal(t.released,0);
  t.pool.releaseOwner('main');await new Promise(r=>setTimeout(r,10));assert.equal(t.released,1);assert.equal(t.pool.inspect().listeners,0);
});
test('100 repeated owner acquisitions never duplicate a physical listener',async()=>{
  const t=setup();for(let i=0;i<100;i++){const p=t.pool.getDocs({path:'recipes'},'main');if(!i)t.listeners[0].next(snap([]));await p;t.pool.releaseOwner('main');}
  assert.equal(t.listeners.length,1);t.pool.dispose();assert.equal(t.pool.inspect().owners,0);
});

async function actionEnv() {
  const env=await environment(); const auth={currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})}};
  env.synthetic(resolve('src/firebase.js'),{db:{},auth});
  return {...env,auth,action:await env.load('src/services/actionGateway.js')};
}
test('command sees server changes and keeps writes at zero on conflict',async()=>{
  const e=await actionEnv();const a=await e.action.openAction({refs:['eggStock/global']});e.state.rows.eggStock[0].currentQty=25;
  await assert.rejects(()=>a.submit(()=>e.state.writes.push('forbidden')),/원본이 변경/);assert.equal(e.state.writes.length,0);
});
test('command fails on offline read and role downgrade',async()=>{
  const e=await actionEnv();e.state.failures.add('eggStock/global');await assert.rejects(()=>e.action.openAction({refs:['eggStock/global']}));
  e.state.failures.clear();const a=await e.action.openAction({refs:['eggStock/global']});e.auth.currentUser.getIdTokenResult=async()=>({claims:{roles:{production:null}}});
  await assert.rejects(()=>a.confirm(),/권한/);assert.equal(e.state.writes.length,0);
});
test('same UID after session invalidation cannot submit an old draft',async()=>{
  const e=await actionEnv();const a=await e.action.openAction({refs:['eggStock/global']});const {sessionStore}=await e.load('src/state/sessionStore.js');sessionStore.clear('changed');
  await assert.rejects(()=>a.confirm(),/세션/);assert.equal(e.state.writes.length,0);
});
test('submitting twice executes callback only once',async()=>{
  const e=await actionEnv();const a=await e.action.openAction({refs:['eggStock/global']});let release;let count=0;
  const first=a.submit(async()=>{count++;await new Promise(r=>release=r);});await assert.rejects(()=>a.submit(()=>count++),/처리 중/);
  while(!release)await new Promise(r=>setTimeout(r,0));release();await first;assert.equal(count,1);
});
test('a receipt confirmation ticket cannot authorize a second attempt after an ambiguous write',async()=>{
  const e=await actionEnv();const action=await e.action.openAction({refs:['eggStock/global']});
  await action.confirm();await assert.rejects(()=>action.confirm(),/이미 확인한/);
  const repeated=await e.action.openAction({refs:['eggStock/global'],reusableConfirm:true});
  await repeated.confirm();await repeated.confirm();let attempts=0;
  await assert.rejects(()=>repeated.submit(()=>{attempts++;throw Error('lost acknowledgement');}),error=>error.readBack?.[0].serverObserved===true);
  await assert.rejects(()=>repeated.submit(()=>attempts++),/이미 전송/);assert.equal(attempts,1);
});
test('holiday result from old session never publishes',async()=>{
  const e=await environment();const dates=await e.load('src/utils/date.js');const {sessionStore}=await e.load('src/state/sessionStore.js');let release;
  const pending=dates.loadHolidaysCache({getDocs:()=>new Promise(r=>release=r)});sessionStore.clear('other');release({docs:[]});
  await assert.rejects(pending,/세션/);assert.equal(dates.isHolidaysCacheLoaded(),false);
});
test('closing guard blocks errors and invalid dates',async()=>{
  const e=await environment();e.context.alert=()=>{};const guard=await e.load('src/utils/closingGuard.js');
  e.state.failures.add('closings/'+e.today);assert.equal(await guard.blockIfClosed(e.today),true);assert.equal(await guard.blockIfClosed(''),true);assert.equal(e.state.writes.length,0);
});
