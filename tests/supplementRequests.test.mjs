import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {resolve} from 'node:path';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {assertWriter,assertExpected,assertTransition,createRequest,requestItems,requestPatch,lockAvailable,assertOwnedLock,stockOperationId,stockInRemaining,assertStockInReplay,canReopenRequest} from '../src/services/supplementRequestLogic.js';

const by={uid:'office',name:'사무',injected:true};
const item={supplementTypeId:'r_10',recipeId:'r',recipeName:'레시피',unit:10,qty:2,injected:true};
const fresh=()=>createRequest({items:[item],note:'메모',injected:true},by,1,1);
test('production-side transition guards cover every status/action/role combination',()=>{
  const actions=['editItems','editNote','cancel','changeRequest','stockIn','start','adjustQty','complete','reopen'];
  for(const role of ['office','admin','production',null])for(const status of ['requested','preparing','done','cancelled'])for(const action of actions){
    const allowed=['office','admin'].includes(role)&&(status==='requested'&&['editItems','editNote','cancel'].includes(action)||status==='preparing'&&action==='changeRequest'||status==='done'&&action==='stockIn');
    if(allowed)assert.doesNotThrow(()=>assertTransition({status},action,role));
    else assert.throws(()=>assertTransition({status},action,role));
  }
  assert.throws(()=>assertWriter('production'));
  assert.throws(()=>assertExpected({status:'preparing',version:1},{status:'requested',version:1}),/다른 사람/);
  assert.throws(()=>assertExpected({status:'requested',version:2},{status:'requested',version:1}),/다른 사람/);
});
test('create and update omit history and preserve identity',()=>{
  const row=fresh(),patch=requestPatch(row,'editItems',{items:[{...item,qty:3}],note:'수정'},by,2,2,'office');
  assert.equal(row.history,undefined);assert.equal(patch.history,undefined);
  assert.equal(patch.version,2);assert.equal(patch.items[0].qty,3);assert.equal(row.items[0].qty,2);
  assert.equal(patch.requestedBy,undefined);
});
test('request validation rejects invalid quantities, duplicate items, oversized lists and notes',()=>{
  for(const qty of [0,1000,1.5,NaN])assert.throws(()=>requestItems([{...item,qty}]));
  assert.throws(()=>requestItems([]));assert.throws(()=>requestItems([item,item]));
  for(const invalid of [null,{...item,recipeId:3},{...item,supplementTypeId:{id:'r_10'}}])assert.throws(()=>requestItems([invalid]));
  assert.throws(()=>requestItems(Array.from({length:61},(_,i)=>({...item,supplementTypeId:'s'+i}))));
  assert.throws(()=>createRequest({items:[item],note:'x'.repeat(501)},by,1,1));
});
test('lease display expiry is separate from write ownership',()=>{
  const lock={uid:'office',at:1000};
  assert.equal(lockAvailable(lock,120999),false);assert.equal(lockAvailable(lock,121000),true);
  assert.equal(lockAvailable(null,0),true);
  assert.doesNotThrow(()=>assertOwnedLock({stockInLock:lock},lock,1001));
  assert.throws(()=>assertOwnedLock({stockInLock:lock},{uid:'office',at:1001},1002));
  assert.throws(()=>assertOwnedLock({stockInLock:lock},{uid:'other',at:1000},1002));
  assert.doesNotThrow(()=>assertOwnedLock({stockInLock:lock},lock,121000));
});
test('stockIn skips markers, resumes partial failure, and releases the lock',async()=>{
  const row={items:['a','b','c'].map(supplementTypeId=>({...item,supplementTypeId})),stockIn:{a:{logId:'old'}}};
  let locked=false,fail=true,completed=false;const writes=[];
  const options={acquire:async()=>{if(locked)throw Error('locked');locked=true;return {};},refresh:async()=>row,
    incoming:async i=>{if(i.supplementTypeId==='c'&&fail)throw Error('partial');writes.push(i.supplementTypeId);return {id:i.supplementTypeId};},
    mark:async(i,result)=>{row.stockIn[i.supplementTypeId]={logId:result.id};return row;},complete:async()=>{completed=true;},release:async()=>{locked=false;}};
  await assert.rejects(stockInRemaining(options),/partial/);assert.equal(locked,false);assert.equal(completed,false);assert.deepEqual(writes,['b']);
  fail=false;await stockInRemaining(options);assert.deepEqual(writes,['b','c']);assert.equal(completed,true);assert.equal(locked,false);
  locked=true;await assert.rejects(stockInRemaining(options),/locked/);assert.deepEqual(writes,['b','c']);
});
test('stable stock operation ID survives commit-to-marker gap without a duplicate stock write',async()=>{
  const row={items:[item],stockIn:{}};const logs=new Map();let fail=true,stock=0;
  const run=()=>stockInRemaining({acquire:async()=>({}),refresh:async()=>row,
    incoming:async i=>{const id=stockOperationId('request',i.supplementTypeId);if(!logs.has(id)){stock+=i.qty;logs.set(id,{id});}return logs.get(id);},
    mark:async(i,r)=>{if(fail)throw Error('marker failed');row.stockIn[i.supplementTypeId]={logId:r.id};return row;},complete:async()=>{},release:async()=>{}});
  await assert.rejects(run(),/marker failed/);assert.equal(stock,2);
  fail=false;await run();assert.equal(stock,2);assert.equal(logs.size,1);assert.ok(row.stockIn[item.supplementTypeId]);
});
test('commit-gap recovery requires exact immutable stock proof and receipt payload',()=>{
  const operationId=stockOperationId('request',item.supplementTypeId);
  const log={uid:'original-office',movementSchemaVersion:3,supplementTypeId:item.supplementTypeId,qty:2,before:10,after:12,type:'in',
    manualMovement:{version:1,kind:'receipt',operationId,enteredAmount:2}};
  const proof={kind:'manual',version:1,logId:operationId,supplementTypeId:item.supplementTypeId,qty:2,before:10,after:12,uid:log.uid};
  assert.doesNotThrow(()=>assertStockInReplay(item,log,proof,operationId));
  assert.throws(()=>assertStockInReplay(item,log,null,operationId));
  for(const patch of [{qty:3},{before:9},{after:13},{uid:'other'},{supplementTypeId:'other'},{logId:'other'},{kind:'deduction'}])
    assert.throws(()=>assertStockInReplay(item,log,{...proof,...patch},operationId));
  for(const patch of [{qty:3},{type:'manualTest'},{movementSchemaVersion:2},{manualMovement:{...log.manualMovement,kind:'test'}},{manualMovement:{...log.manualMovement,operationId:'other'}}])
    assert.throws(()=>assertStockInReplay(item,{...log,...patch},proof,operationId));
});

async function uiFixture(role) {
  const {document,window}=parseHTML('<html><body><div id="requests"></div></body></html>');
  const context=vm.createContext({document,console,Date,Map,Set,Error,Object});let listener,stopped=0,eventStopped=0;const eventListeners=new Map();
  const deps={
    '../app.js':{currentUserRole:role},
    '../services/supplementRequests.js':{saveRequest:async()=>{},watchRequestEvents:(id,next)=>{eventListeners.set(id,next);return ()=>eventStopped++;},watchRequests:next=>{listener=next;return ()=>stopped++;},requestActor:name=>({uid:'office',name}),stockInRequest:async()=>{}},
    '../services/supplementRequestLogic.js':{requestStatuses:{requested:'신청',preparing:'준비중',done:'완료',cancelled:'취소'},stockOperationId,canReopenRequest},
    '../utils/date.js':{getTodayKST:()=> '2026-11-03'},
    '../utils/pageLifecycle.js':{getPageContext:()=>null,registerPageCleanup:()=>()=>{}},
  };
  const module=new vm.SourceTextModule(readFileSync('src/pages/supplementRequests.js','utf8'),{context});
  await module.link(async name=>{const exports=deps[name];assert.ok(exports,name);return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v);},{context});});
  await module.evaluate();const host=document.getElementById('requests');
  const dispose=module.namespace.mountSupplementRequests(host,{types:[{id:'later',recipeId:'r',recipeName:'나중',unit:2,sortOrder:100,active:true},{id:'inactive',recipeId:'r',recipeName:'비활성',unit:3,sortOrder:-1,active:false},{id:'first',recipeId:'r',recipeName:'먼저',unit:1,sortOrder:0,active:true}],staffOptions:'<option value="사무">사무</option>',incoming:async()=>{},onStockChanged:()=>{}});
  return {host,document,window,dispose,emit:rows=>listener(rows),emitEvents:(id,events)=>eventListeners.get(id)(events),stopped:()=>stopped,eventStopped:()=>eventStopped};
}

test('events render separately, preserve an inline draft, and unsubscribe on disposal',async()=>{
  const f=await uiFixture('office');f.emit([{...fresh(),id:'req',status:'preparing'}]);
  f.emitEvents('req',[{action:'create',note:'<img src=x>',by}]);
  assert.match(f.host.querySelector('ol').textContent,/<img src=x>/);assert.equal(f.host.querySelector('img'),null);
  const input=f.host.querySelector('[data-change]');input.value='작성 중';
  f.emitEvents('req',[{action:'changeRequest',note:'새 이벤트',by}]);
  assert.equal(f.host.querySelector('[data-change]'),input);assert.equal(input.value,'작성 중');
  f.dispose();assert.equal(f.eventStopped(),1);
});
test('production role sees live requests and escaped details but no write controls; listener is disposed',async()=>{
  const f=await uiFixture('production');f.emit([{...fresh(),id:'req',note:'<img src=x onerror=alert(1)>'}]);
  assert.equal(f.host.querySelector('form'),null);assert.equal(f.host.querySelector('[data-action]'),null);
  assert.equal(f.host.querySelector('img'),null);assert.match(f.host.textContent,/<img/);
  f.dispose();assert.equal(f.stopped(),1);
});
test('writer form orders active SKUs and exposes only status-appropriate controls',async()=>{
  const f=await uiFixture('office');
  assert.deepEqual([...f.host.querySelectorAll('[data-type]')].map(el=>el.dataset.type),['first','later']);
  f.emit(['requested','preparing','done','cancelled'].map(status=>({...fresh(),id:status,status})));
  const actions=id=>[...f.host.querySelector(`[data-id="${id}"]`).querySelectorAll('button[data-action]')].map(el=>el.dataset.action);
  assert.ok(actions('requested').includes('edit'));assert.ok(actions('requested').includes('cancel'));
  assert.deepEqual(actions('preparing'),['changeRequest']);assert.deepEqual(actions('cancelled'),[]);
  assert.ok(actions('done').includes('stockIn'));
  const completed={...fresh(),id:'finished',status:'done',stockInCompletedAt:1};f.emit([completed]);
  assert.equal(f.host.querySelector('[data-action="stockIn"]').disabled,true);
  f.dispose();
});

test('request incoming adapter refreshes each stock baseline and passes atomic callback',async()=>{
  const e=await pageEnvironment('supplement',{instrument:'\nexport {openRequestsTab};'});
  let options;
  e.synthetic(resolve('src/pages/supplementRequests.js'),{mountSupplementRequests:(_host,input)=>{options=input;return ()=>{};}});
  try {
    await e.page.renderSupplement();await e.page.openRequestsTab();
    const first={...item,supplementTypeId:'r1_1'},second={...item,supplementTypeId:'r1_2',qty:3};
    const incoming=i=>options.incoming(i,{date:'2026-09-14',staffName:'fixture',selection:{kind:'receipt',reason:'',operationId:stockOperationId('req',i.supplementTypeId)},extraWrites:async tx=>tx.set(e.api.doc({},'atomicMarkers',i.supplementTypeId),{ok:true})});
    const saved=await incoming(first);await incoming(second);
    assert.deepEqual(e.state.rows.supplementStock.map(r=>r.currentQty),[22,23]);
    const count=e.state.commits.length;
    await assert.rejects(incoming(first),/이미 존재/);
    assert.equal(e.state.commits.length,count);
    assert.equal(e.state.rows.supplementLogs.length,2);
    assert.ok(e.state.rows.supplementLogs.every(r=>r.type==='in'&&r.manualMovement.kind==='receipt'));
  } finally {await e.cleanup();}
});
