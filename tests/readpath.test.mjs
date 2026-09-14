import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createSessionStore } from '../src/state/sessionStore.js';
import { createQueryRegistry } from '../src/state/queryRegistry.js';
import { createListenerPool } from '../src/state/listenerPool.js';
import { environment } from './helpers/modules.mjs';

function setup(options = {}) {
  const store = createSessionStore(); store.clear('user:office:2026-09-14');
  const listeners = []; let released = 0;
  const pool = createListenerPool({ store, registry: createQueryRegistry((a,b)=>JSON.stringify(a)===JSON.stringify(b)),
    listen(ref,next,error) { listeners.push({ref,next,error}); return ()=>released++; }, graceMs: 5, timeoutMs: 1000, ...options });
  return {store,pool,listeners,get released(){return released;}};
}
const snap = (value, fromCache=false, hasPendingWrites=false) => ({ value, metadata:{fromCache,hasPendingWrites} });

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
test('holiday result from old session never publishes',async()=>{
  const e=await environment();const dates=await e.load('src/utils/date.js');const {sessionStore}=await e.load('src/state/sessionStore.js');let release;
  const pending=dates.loadHolidaysCache({getDocs:()=>new Promise(r=>release=r)});sessionStore.clear('other');release({docs:[]});
  await assert.rejects(pending,/세션/);assert.equal(dates.isHolidaysCacheLoaded(),false);
});
test('closing guard blocks errors and invalid dates',async()=>{
  const e=await environment();e.context.alert=()=>{};const guard=await e.load('src/utils/closingGuard.js');
  e.state.failures.add('closings/'+e.today);assert.equal(await guard.blockIfClosed(e.today),true);assert.equal(await guard.blockIfClosed(''),true);assert.equal(e.state.writes.length,0);
});
