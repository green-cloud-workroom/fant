import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {requestItems} from '../src/services/supplementRequestItems.js';
import {canReopenRequest,createRequest,stockOperationId} from '../src/services/supplementRequestLogic.js';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';

const by={uid:'fixture',name:'사무'},item={supplementTypeId:'r_10',recipeId:'r',recipeName:'레시피',unit:10,qty:2};
async function fixture(options={}) {
  const fake=makeEditableFirestore(options),e=await environment({firestore:fake});
  e.synthetic('firebase/firestore',{...fake.api,Timestamp:{now:()=>({seconds:1789347600}),fromMillis:ms=>({seconds:ms/1000})}});
  const api=await e.load('src/services/supplementRequests.js'),manual=await e.load('src/services/manualMovements.js');
  fake.state.rows.supplementStock=[{id:item.supplementTypeId,currentQty:10}];
  fake.state.rows.supplementRequests=[{...createRequest({items:[item]},by,1,1),id:'req',status:'done'}];
  const row=()=>fake.state.rows.supplementRequests[0];
  const incoming=async(i,extraWrites)=>manual.saveManualMovement({db:{},name:'supplementLogs',stockId:i.supplementTypeId,uid:by.uid,
    log:{type:'in',date:'2026-09-14',qty:i.qty,supplementTypeId:i.supplementTypeId,staffName:by.name},
    selection:{kind:'receipt',operationId:stockOperationId('req',i.supplementTypeId)},extraWrites});
  return {...fake,e,api,manual,row,incoming};
}
test('R1 shared validator is verbatim-copyable without imports and handles 60 items',async()=>{
  const source=readFileSync('src/services/supplementRequestItems.js','utf8');
  const m=new vm.SourceTextModule(source);await m.link(()=>{throw Error('dependency');});await m.evaluate();
  const items=Array.from({length:60},(_,n)=>({...item,supplementTypeId:'id'+n}));
  assert.equal(requestItems(items).length,60);assert.equal(m.namespace.requestItems(items).length,60);
  for(const bad of [[],[null],[item,item],items.concat(item),[{...item,qty:0}],[{...item,qty:1000}],[{...item,qty:1.5}],[{...item,unit:Infinity}],[{...item,recipeName:1}]])assert.throws(()=>requestItems(bad));
  assert.deepEqual(requestItems([{...item,extra:true}]),[item]);assert.equal(items.length,60);
});
test('R2 create and edit each commit one event with the new parent version and no history',async()=>{
  const f=await fixture();f.state.rows.supplementRequests=[];
  const items=Array.from({length:60},(_,n)=>({...item,supplementTypeId:'sku'+n}));
  const created=await f.api.saveRequest(null,'create',{items},by);
  const edited=await f.api.saveRequest(created,'editItems',{items:items.map(i=>({...i,qty:3}))},by);
  assert.equal(created.items.length,60);assert.equal(edited.items.length,60);
  assert.equal(edited.version,2);assert.equal(edited.history,undefined);
  for(const operations of f.state.commits){
    const parent=operations.find(o=>o.target.path.startsWith('supplementRequests/')&&!o.target.path.includes('/events/'));
    const events=operations.filter(o=>o.target.path.includes('/events/'));
    assert.equal(events.length,1);assert.equal(events[0].data.version,parent.data.version);
    assert.deepEqual(events[0].data.at,parent.data.updatedAt);assert.equal(parent.data.history,undefined);
  }
});
test('R3 omitted extraWrites preserves exact legacy return values and writes',async()=>{
  async function run(legacy){
    const f=await fixture();
    const old=readFileSync('tests/fixtures/manualMovements-before-extraWrites.source.txt','utf8');
    // Load the unchanged a8009a0 source under an isolated module environment.
    const service=legacy?await (async()=>{
      const g=await environment({firestore:{...f,api:f.e.api}});
      const id=(await import('node:path')).resolve('src/services/manualMovements.js');
      const module=new vm.SourceTextModule(old,{context:g.context,identifier:id});
      await module.link(async spec=>spec==='firebase/firestore'?g.cache.get(spec): (await g.load('src/services/manualMovementLogic.js'),g.cache.get((await import('node:path')).resolve('src/services/manualMovementLogic.js'))));
      await module.evaluate();return module.namespace;
    })():f.manual;
    const result=await service.saveManualMovement({db:{},name:'supplementLogs',stockId:item.supplementTypeId,uid:by.uid,
      log:{type:'in',date:'2026-09-14',qty:2,supplementTypeId:item.supplementTypeId,staffName:by.name},selection:{kind:'receipt',operationId:'legacy-regression'}});
    return JSON.stringify({result,commits:f.state.commits});
  }
  assert.equal(await run(false),await run(true));
});
test('R3 stock/log/key/event commit together, retry callback and subsequent run never duplicate',async()=>{
  const f=await fixture({retryTransactionCallbackOnce:true});
  await f.api.stockInRequest(f.row(),by,f.incoming);
  assert.equal(f.state.rows.supplementStock[0].currentQty,12);
  const commit=f.state.commits.find(ops=>ops.some(o=>o.target.path.startsWith('supplementLogs/')));
  assert.ok(commit.some(o=>o.target.path==='supplementRequests/req'&&o.data.stockIn.r_10));
  assert.equal(commit.filter(o=>o.target.path.includes('/events/')).length,1);
  assert.equal(f.row().stockIn.r_10.logId,stockOperationId('req','r_10'));
  await f.api.stockInRequest(f.row(),by,f.incoming);
  assert.equal(f.state.rows.supplementStock[0].currentQty,12);
});
test('R3 event/marker commit failure rolls back stock and resumes safely',async()=>{
  const f=await fixture();let fail=true;
  const incoming=async(i,extra)=>{if(fail)f.state.failNextCommit='before';return f.incoming(i,extra);};
  await assert.rejects(f.api.stockInRequest(f.row(),by,incoming),/before commit/);
  assert.equal(f.state.rows.supplementStock[0].currentQty,10);assert.equal(f.row().stockIn,undefined);
  assert.equal((f.state.rows.supplementLogs||[]).length,0);
  fail=false;await f.api.stockInRequest(f.row(),by,incoming);assert.equal(f.state.rows.supplementStock[0].currentQty,12);
});
test('R3 key appearing after refresh aborts inside the stock transaction without writing stock',async()=>{
  const f=await fixture();
  await assert.rejects(f.api.stockInRequest(f.row(),by,async(i,extra)=>{
    f.row().stockIn={r_10:{logId:'competing'}};return f.incoming(i,extra);
  }),/이미 기록/);
  assert.equal(f.state.rows.supplementStock[0].currentQty,10);assert.equal((f.state.rows.supplementLogs||[]).length,0);
});
test('R4 any stockIn key blocks reopen including falsey marker values',()=>{
  assert.equal(canReopenRequest({status:'done'}),true);
  for(const stockIn of [{x:{}},{x:null},{x:false}])assert.equal(canReopenRequest({status:'done',stockIn}),false);
  const rules=readFileSync('C:/dev/fant-production/output/supreq/rules/candidate.rules','utf8');
  assert.match(rules,/b.get\('stockIn', \{\}\).size\(\) == 0/);
});
