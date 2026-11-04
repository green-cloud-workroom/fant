import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {resolve} from 'node:path';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {assertWriter,assertExpected,assertTransition,createRequest,requestItems,requestPatch,lockAvailable,assertOwnedLock,stockOperationId,stockInRemaining,assertStockInReplay,canReopenRequest,requestDisplayStatus} from '../src/services/supplementRequestLogic.js';

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

async function uiFixture(role,{staffOptions='<option value="사무">사무</option>',saveError=null,loadStocks}={}) {
  const {document,window}=parseHTML('<html><body><div id="requests"></div></body></html>');
  Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(value){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===value)?.setAttribute('selected','');}});
  const context=vm.createContext({document,console,Date,Map,Set,Error,Object});let listener,stopped=0,eventStopped=0;const saves=[];const eventListeners=new Map();
  const deps={
    '../utils/formDraft.js':{markFieldsSaved:()=>{},hasDirtyFields:()=>false,canLeavePage:async()=>true},
    '../utils/modalManager.js':{registerModalDismiss:()=>()=>{}},
    '../app.js':{currentUserRole:role},
    '../services/supplementRequests.js':{saveRequest:async(...args)=>{saves.push(args);if(saveError)throw saveError;},watchRequestEvents:(id,next)=>{eventListeners.set(id,next);return ()=>eventStopped++;},watchRequests:next=>{listener=next;return ()=>stopped++;},requestActor:name=>({uid:'office',name}),stockInRequest:async()=>{}},
    '../services/supplementRequestLogic.js':{requestStatuses:{requested:'신청',preparing:'준비중',done:'완료',cancelled:'취소'},stockOperationId,canReopenRequest,requestDisplayStatus},
    '../utils/date.js':{getTodayKST:()=> '2026-11-03'},
    '../utils/pageLifecycle.js':{getPageContext:()=>null,registerPageCleanup:()=>()=>{}},
  };
  const module=new vm.SourceTextModule(readFileSync('src/pages/supplementRequests.js','utf8'),{context});
  await module.link(async name=>{if(name==='../utils/formDraft.js'){const draft=new vm.SourceTextModule(readFileSync('src/utils/formDraft.js','utf8'),{context});await draft.link(()=>new vm.SyntheticModule(['registerModalDismiss'],function(){this.setExport('registerModalDismiss',()=>()=>{});},{context}));return draft;}const exports=deps[name];assert.ok(exports,name);return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v);},{context});});
  await module.evaluate();const host=document.getElementById('requests');
  const dispose=module.namespace.mountSupplementRequests(host,{types:[{id:'later',recipeId:'r2',recipeName:'나중',unit:2,sortOrder:100,active:true},{id:'inactive',recipeId:'r',recipeName:'비활성',unit:3,sortOrder:-1,active:false},{id:'first',recipeId:'r',recipeName:'먼저',unit:1,sortOrder:0,active:true}],staffOptions,loadStocks,getStockQty:id=>id==='first'?17:0,incoming:async()=>{},onStockChanged:()=>{}});
  return {host,document,window,dispose,saves,matches:module.namespace.matchesRequestSearch,emit:rows=>listener(rows),emitEvents:(id,events)=>eventListeners.get(id)(events),stopped:()=>stopped,eventStopped:()=>eventStopped};
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
  assert.equal(f.host.querySelector('form'),null);f.host.querySelector('[data-new]').click();
  assert.deepEqual([...f.document.querySelectorAll('[data-type]')].map(el=>el.dataset.type),['first','later']);
  f.document.querySelector('[data-close]').click();
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
    assert.deepEqual(Array.from(await options.loadStocks(),r=>r.currentQty),[22,23]);
    const count=e.state.commits.length;
    await assert.rejects(incoming(first),/이미 존재/);
    assert.equal(e.state.commits.length,count);
    assert.equal(e.state.rows.supplementLogs.length,2);
    assert.ok(e.state.rows.supplementLogs.every(r=>r.type==='in'&&r.manualMovement.kind==='receipt'));
  } finally {await e.cleanup();}
});

const tick=()=>new Promise(resolve=>setImmediate(resolve));
function input(f,el,value){el.value=value;el.dispatchEvent(new f.window.Event('input',{bubbles:true}));}
test('status filter preserves inline change request and restores the previous filter until saved',async()=>{
 const f=await uiFixture('office');
 f.emit([{...fresh(),id:'req',status:'preparing'},{...fresh(),id:'done',status:'done'}]);
 const filter=f.host.querySelector('[data-request-filter]');
 const changeFilter=value=>{filter.value=value;filter.dispatchEvent(new f.window.Event('change',{bubbles:true}));};
 changeFilter('preparing');
 const detail=f.host.querySelector('details'),draft=detail.querySelector('[data-change]');detail.open=true;
 input(f,draft,'변경 요청 작성 중');
 changeFilter('done');
 assert.equal(filter.value,'preparing');assert.equal(f.host.querySelector('[data-change]'),draft);
 assert.equal(draft.value,'변경 요청 작성 중');assert.equal(detail.open,true);
 assert.match(f.host.querySelector('[data-request-status]').textContent,/저장하거나 닫은 뒤/);
 f.host.querySelector('[data-list-staff]').value='사무';
 f.host.querySelector('[data-list-staff]').dispatchEvent(new f.window.Event('change'));
 detail.querySelector('[data-action="changeRequest"]').click();await tick();
 assert.equal(f.saves[0][2].changeRequestNote,'변경 요청 작성 중');
 changeFilter('done');assert.equal(filter.value,'done');assert.equal(f.host.querySelector('details').dataset.id,'done');f.dispose();
});

test('status filter keeps opened stock-in form, date, staff and DOM intact',async()=>{
 const f=await uiFixture('office');f.emit([{...fresh(),id:'done',status:'done'}]);
 f.host.querySelector('[data-action="stockIn"]').click();
 const form=f.host.querySelector('[data-stock-form]'),detail=form.closest('details');
 form.querySelector('[data-date]').value='2026-11-01';form.querySelector('[data-staff]').value='사무';
 const filter=f.host.querySelector('[data-request-filter]');filter.value='requested';filter.dispatchEvent(new f.window.Event('change'));
 assert.equal(filter.value,'all');assert.equal(f.host.querySelector('[data-stock-form]'),form);
 assert.equal(form.hidden,false);assert.equal(detail.open,true);
 assert.equal(form.querySelector('[data-date]').value,'2026-11-01');assert.equal(form.querySelector('[data-staff]').value,'사무');
 assert.equal(f.saves.length,0);f.dispose();
});

test('status filter keeps modal draft and resumes normally after closing it',async()=>{
 const f=await uiFixture('office');f.emit([{...fresh(),id:'req'}]);f.host.querySelector('[data-new]').click();
 const form=f.document.querySelector('form'),filter=f.host.querySelector('[data-request-filter]');
 filter.value='done';filter.dispatchEvent(new f.window.Event('change'));
 assert.equal(filter.value,'all');assert.equal(f.document.querySelector('form'),form);
 form.querySelector('[data-close]').click();await tick();
 filter.value='done';filter.dispatchEvent(new f.window.Event('change'));
 assert.equal(filter.value,'done');assert.equal(f.host.querySelector('details'),null);f.dispose();
});

test('product switching, search and live updates preserve all quantities and submit hidden selections',async()=>{
 const f=await uiFixture('office');
 assert.equal(f.matches('고양이 치킨',60,' 치킨  60 '),true);
 assert.equal(f.matches('고양이 치킨',60,'치킨 100'),false);
 f.host.querySelector('[data-new]').click();const form=f.document.querySelector('form');
 const groups=[...form.querySelectorAll('[data-group]')],first=form.querySelector('[data-type="first"]');
 assert.equal(groups[0].hidden,false);assert.equal(groups[1].hidden,true);
 assert.match(groups[0].textContent,/17봉/);
 input(f,first,'3');form.querySelector('[data-pick-group="1"]').click();
 assert.equal(groups[0].hidden,true);assert.equal(groups[1].hidden,false);
 input(f,form.querySelector('[data-type="later"]'),'2');
 assert.equal(form.querySelector('[data-pick-group="0"] [data-count]').textContent,'1 입력');
 form.querySelector('[data-pick-group="0"]').click();assert.equal(first.value,'3');
 input(f,form.querySelector('[data-search]'),'나중 2');assert.equal(groups[0].hidden,true);assert.equal(groups[1].hidden,false);
 input(f,form.querySelector('[data-search]'),'');
 assert.equal(form.querySelector('[data-total]').textContent,'선택 2품목 · 합계 5봉');
 assert.match(form.querySelector('[data-selected-review]').textContent,/먼저.*3봉.*나중.*2봉/);
 const select=form.querySelector('[data-group-select]');select.value='0';select.dispatchEvent(new f.window.Event('change'));
 assert.equal(groups[0].hidden,false);assert.equal(form.querySelector('[data-type="first"]'),first);
 input(f,form.querySelector('[data-search]'),'없음');
 form.querySelector('[name="staff"]').value='사무';
 f.emit([{...fresh(),id:'external'}]);assert.equal(f.document.querySelector('form'),form);
 form.dispatchEvent(new f.window.Event('submit',{bubbles:true,cancelable:true}));
 assert.ok([...form.querySelectorAll('input,button,textarea,select')].every(el=>el.disabled));
 form.querySelector('[data-pick-group="0"]').click();assert.equal(groups[0].hidden,true);await tick();
 assert.equal(f.saves.length,1);assert.deepEqual(Array.from(f.saves[0][2].items,i=>[i.supplementTypeId,i.qty]),[['first',3],['later',2]]);
 assert.equal(f.document.querySelector('form'),null);f.dispose();
});

test('editing preserves inactive and snapshot-only items while switching product panels',async()=>{
 const f=await uiFixture('office');const items=[{...item,supplementTypeId:'inactive',recipeId:'old',recipeName:'비활성',qty:4},{...item,supplementTypeId:'gone',recipeId:'gone',recipeName:'삭제된 스냅샷',qty:5}];
 f.emit([{...fresh(),id:'old-request',items}]);f.host.querySelector('[data-action="edit"]').click();
 const form=f.document.querySelector('form');
 for(const id of ['inactive','gone']){const el=form.querySelector(`[data-type="${id}"]`),index=el.closest('[data-group]').dataset.group;form.querySelector(`[data-pick-group="${index}"]`).click();assert.equal(el.closest('[data-group]').hidden,false);}
 form.querySelector('[name="staff"]').value='사무';form.dispatchEvent(new f.window.Event('submit',{cancelable:true}));await tick();
 assert.deepEqual(JSON.parse(JSON.stringify(f.saves[0][2].items)),items);f.dispose();
});

test('detail pagination leaves inline drafts and request snapshot untouched; history starts collapsed',async()=>{
 const f=await uiFixture('office'),items=Array.from({length:23},(_,n)=>({...item,supplementTypeId:'sku'+n,unit:n+1}));
 f.emit([{...fresh(),id:'long',status:'preparing',items}]);
 const detail=f.host.querySelector('.supplement-request-row'),draft=detail.querySelector('[data-change]');
 input(f,draft,'수량 확인 중');assert.equal(detail.querySelector('.supplement-request-history').hasAttribute('open'),false);
 assert.equal([...detail.querySelectorAll('[data-detail-item]')].filter(el=>!el.hidden).length,10);
 detail.querySelector('[data-item-page="2"]').click();
 assert.equal([...detail.querySelectorAll('[data-detail-item]')].filter(el=>!el.hidden).length,3);
 assert.equal(detail.querySelector('[data-change]'),draft);assert.equal(draft.value,'수량 확인 중');
 f.emit([{...fresh(),id:'long',version:2,status:'done',items}]);
 assert.equal(detail.querySelector('[data-change]'),draft);assert.equal(f.saves.length,0);f.dispose();
});

test('missing actor is visible at the list action and event codes are Korean',async()=>{
 const f=await uiFixture('office');f.emit([{...fresh(),id:'req',note:''}]);f.emitEvents('req',[{action:'create',by}]);
 assert.match(f.host.querySelector('ol').textContent,/신청 생성/);assert.doesNotMatch(f.host.textContent,/메모:/);
 f.host.querySelector('[data-action="cancel"]').click();f.host.querySelector('[data-action="cancelSave"]').click();await tick();
 assert.match(f.host.querySelector('[data-row-status]').textContent,/신청자.*선택/);assert.equal(f.saves.length,0);f.dispose();
});
test('request staff options use the office group independently of stock-in menu configuration',async()=>{
 const e=await pageEnvironment('supplement',{instrument:'\nexport {openRequestsTab};\nexport function setRequestStaffFixture(){supplementStaffCache={office:[{name:"사무1"},{name:"사무2"}],senior:[{name:"선임"}]};supplementMenuStaffGroups={supplementStockIn:["senior"]};}'});let options;
 e.synthetic(resolve('src/pages/supplementRequests.js'),{mountSupplementRequests:(_host,input)=>{options=input;return ()=>{};}});
 try{await e.page.renderSupplement();e.page.setRequestStaffFixture();await e.page.openRequestsTab();assert.match(options.staffOptions,/사무1/);assert.match(options.staffOptions,/사무2/);assert.doesNotMatch(options.staffOptions,/선임/);}finally{await e.cleanup();}
});

test('dirty close uses the existing stay/leave dialog and preserves input while staying',async()=>{
 const f=await uiFixture('office');f.host.querySelector('[data-new]').click();const form=f.document.querySelector('form');
 input(f,form.querySelector('[data-type="first"]'),'7');form.querySelector('[data-close]').click();
 assert.ok(f.document.querySelector('#navigationConfirm'));f.document.querySelector('[data-stay]').click();await tick();
 assert.equal(form.querySelector('[data-type="first"]').value,'7');assert.equal(form.isConnected,true);
 form.querySelector('[data-close]').click();f.document.querySelector('[data-leave]').click();await tick();assert.equal(form.isConnected,false);f.dispose();
});
test('conflict resubscribes without replacing modal quantities and unlocks controls',async()=>{
 const error=Object.assign(new Error('충돌'),{code:'supplement-request-conflict'});const f=await uiFixture('office',{saveError:error});
 f.host.querySelector('[data-new]').click();const form=f.document.querySelector('form');input(f,form.querySelector('[data-type="first"]'),'9');form.querySelector('[name="staff"]').value='사무';
 form.dispatchEvent(new f.window.Event('submit',{cancelable:true}));await tick();assert.equal(f.stopped(),1);assert.equal(f.document.querySelector('form'),form);assert.equal(form.querySelector('[data-type="first"]').value,'9');assert.equal(form.querySelector('button[type="submit"]').disabled,false);assert.match(form.querySelector('[data-form-status]').textContent,/충돌/);f.dispose();assert.equal(form.isConnected,false);
});
test('office empty guidance appears in list and modal; stock-in gets the same office options',async()=>{
 const f=await uiFixture('office',{staffOptions:''});assert.match(f.host.textContent,/등록된 사무 직원이 없습니다/);f.host.querySelector('[data-new]').click();assert.match(f.document.querySelector('form').textContent,/등록된 사무 직원이 없습니다/);f.dispose();
 const g=await uiFixture('office');g.emit([{...fresh(),id:'done',status:'done'}]);assert.deepEqual([...g.host.querySelector('[data-staff]').options].map(o=>o.value),['','사무']);g.dispose();
});

test('mobile product navigation without business edits closes without a discard prompt',async()=>{
 const f=await uiFixture('office');f.host.querySelector('[data-new]').click();
 const form=f.document.querySelector('form'),picker=form.querySelector('[data-group-select]');
 picker.value='1';picker.dispatchEvent(new f.window.Event('change'));form.querySelector('[data-close]').click();await tick();
 assert.equal(f.document.querySelector('#navigationConfirm'),null);assert.equal(form.isConnected,false);f.dispose();
});
test('request detail clamps its page after an external edit reduces the item count',async()=>{
 const f=await uiFixture('office'),items=Array.from({length:23},(_,n)=>({...item,supplementTypeId:'s'+n}));
 f.emit([{...fresh(),id:'req',items}]);f.host.querySelector('[data-item-page="2"]').click();
 f.emit([{...fresh(),id:'req',version:2,items:items.slice(0,1)}]);
 assert.equal(f.host.querySelectorAll('[data-detail-item]').length,1);
 assert.equal(f.host.querySelector('[data-detail-item]').hidden,false);f.dispose();
});

test('fresh request stock display preserves in-flight input and distinguishes a missing stock document',async()=>{
 let resolveStocks;const pending=new Promise(resolve=>resolveStocks=resolve);
 const f=await uiFixture('office',{loadStocks:()=>pending});f.host.querySelector('[data-new]').click();
 const form=f.document.querySelector('form'),qty=form.querySelector('[data-type="first"]');input(f,qty,'8');
 assert.equal(form.querySelector('[data-stock-type="first"]').textContent,'조회 중');
 resolveStocks([{id:'first',currentQty:25}]);await tick();
 assert.equal(form.querySelector('[data-stock-type="first"]').textContent,'25봉');
 assert.equal(form.querySelector('[data-stock-type="later"]').textContent,'재고 정보 없음');
 assert.equal(form.querySelector('[data-type="first"]'),qty);assert.equal(qty.value,'8');assert.equal(f.saves.length,0);f.dispose();
});
test('late stock display response never overwrites a newer request form',async()=>{
 let resolveStocks,calls=0;const pending=new Promise(resolve=>resolveStocks=resolve);
 const f=await uiFixture('office',{loadStocks:()=>++calls===1?pending:Promise.resolve([{id:'first',currentQty:40}])});
 f.host.querySelector('[data-new]').click();await tick();
 f.document.querySelector('[data-close]').click();await tick();f.host.querySelector('[data-new]').click();await tick();
 const form=f.document.querySelector('form');resolveStocks([{id:'first',currentQty:1}]);await tick();
 assert.equal(form.querySelector('[data-stock-type="first"]').textContent,'40봉');f.dispose();
});
