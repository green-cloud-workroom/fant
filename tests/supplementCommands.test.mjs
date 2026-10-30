import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';
import {pageEnvironment} from './helpers/pageDom.mjs';
async function setup(){
  const fake=makeEditableFirestore();fake.state.rows.supplementStock=[{id:'sku',currentQty:10}];
  const e=await environment({session:true,firestore:fake,instrument:{'src/pages/supplement.js':'\nexport {loadSupplementModel,saveIncomingCell,saveAdjustCell};'}});
  e.synthetic(resolve('src/firebase.js'),{db:{},auth:{currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})}}});
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.nodes.mainContent,'supplement');
  const page=await e.load('src/pages/supplement.js');
  const resource=(await e.load('src/state/pageResources.js')).pageResource('supplement');
  const refresh=()=>resource.load(page.loadSupplementModel,{force:true});await refresh();
  return {...e,page,resource,refresh};
}

for(const name of ['고양이 치킨 2용 영양제',undefined])test(`supplement activity uses loaded name with ID fallback: ${name}`,async()=>{
  const e=await pageEnvironment('supplement',{instrument:'\nexport {saveIncomingCell,saveAdjustCell};'});
  try {
  e.state.rows.supplementStock=[{id:'sku',currentQty:10}];
  if(name)e.state.rows.supplementTypes.push({id:'sku',name,active:true,sortOrder:100});
  await e.page.renderSupplement();
  await e.page.saveIncomingCell('sku','2026-09-14',2,'fixture',{kind:'receipt',operationId:'named-in',reason:'재고없음'});
  assert.equal(e.state.rows.activityLogs.at(-1).message,`실제 입고 — ${name||'sku'} 2 / 재고없음`);
  await e.page.renderSupplement({force:true});
  await e.page.saveAdjustCell('sku','2026-09-14',-1,'사용','fixture',{kind:'usage',operationId:'named-out',reason:'사용'});
  const activity=e.state.rows.activityLogs.at(-1);
  assert.equal(activity.message,`사용 — ${name||'sku'} -1 / 사용`);
  assert.deepEqual(Object.keys(activity.details).sort(),['after','app','before','delta','manualMovement','sourceCollection','sourceLogId']);
  assert.equal('supplementName' in e.state.rows.supplementLogs.at(-1),false);
  // Names come from the loaded list, never an additional transaction read.
  assert.equal(e.state.reads.some(r=>String(r.path||r).includes('supplementTypes/sku')),false);
  } finally {await e.cleanup();}
});
test('incoming and adjustment retain atomic stock/log/activity payloads',async()=>{
  const e=await setup();await e.page.saveIncomingCell('sku','2026-09-14',5,'fixture',{kind:'receipt',operationId:'incoming-one',reason:''});assert.equal(e.state.rows.supplementStock[0].currentQty,15);
  const incoming=e.state.rows.supplementLogs.find(l=>l.supplementTypeId==='sku');assert.deepEqual([incoming.before,incoming.after,incoming.qty,incoming.type],[10,15,5,'in']);assert.equal(e.state.commits[0].length,5);
  assert.equal(e.state.rows.supplementContractProofs.find(p=>p.logId===incoming.id).qty,5);
  await e.refresh();await e.page.saveAdjustCell('sku','2026-09-14',-3,'fixture reason','fixture',{kind:'usage',operationId:'usage-one',reason:'fixture reason'});assert.equal(e.state.rows.supplementStock[0].currentQty,12);assert.equal(e.state.commits[1].length,5);assert.equal(e.state.commits[1].find(op=>op.target.path.startsWith('activityLogs/')).data.action,'supplementStock');
});
test('negative stock validation aborts without writes and remains a usable command',async()=>{
  const e=await setup();await assert.rejects(()=>e.page.saveAdjustCell('sku','2026-09-14',-11,'reason','fixture',{kind:'usage',operationId:'usage-one',reason:'reason'}),/음수/);assert.equal(e.resource.blocked,false);assert.equal(e.state.commits.length,0);await e.page.saveAdjustCell('sku','2026-09-14',-2,'reason','fixture',{kind:'usage',operationId:'usage-one',reason:'reason'});assert.equal(e.state.rows.supplementStock[0].currentQty,8);
});
test('response loss cannot issue a second incoming transaction',async()=>{
  const e=await setup();e.state.failNextCommit='after';await assert.rejects(()=>e.page.saveIncomingCell('sku','2026-09-14',5,'fixture',{kind:'receipt',operationId:'incoming-one',reason:''}),error=>error.code==='outcome-unknown');await assert.rejects(()=>e.page.saveIncomingCell('sku','2026-09-14',5,'fixture',{kind:'receipt',operationId:'incoming-one',reason:''}),/직전 저장 결과/);assert.equal(e.state.rows.supplementStock[0].currentQty,15);assert.equal(e.state.commits.length,1);
});
