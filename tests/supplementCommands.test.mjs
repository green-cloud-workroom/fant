import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';
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
test('incoming and adjustment retain atomic stock/log/activity payloads',async()=>{
  const e=await setup();await e.page.saveIncomingCell('sku','2026-09-14',5,'fixture');assert.equal(e.state.rows.supplementStock[0].currentQty,15);
  const incoming=e.state.rows.supplementLogs.find(l=>l.supplementTypeId==='sku');assert.deepEqual([incoming.before,incoming.after,incoming.qty,incoming.type],[10,15,5,'in']);assert.equal(e.state.commits[0].length,2);
  await e.refresh();await e.page.saveAdjustCell('sku','2026-09-14',-3,'fixture reason','fixture');assert.equal(e.state.rows.supplementStock[0].currentQty,12);assert.equal(e.state.commits[1].length,3);assert.equal(e.state.commits[1][2].data.action,'supplementStock');
});
test('negative stock validation aborts without writes and remains a usable command',async()=>{
  const e=await setup();await assert.rejects(()=>e.page.saveAdjustCell('sku','2026-09-14',-11,'reason','fixture'),/NEGATIVE_SUPPLEMENT_STOCK/);assert.equal(e.resource.blocked,false);assert.equal(e.state.commits.length,0);await e.page.saveAdjustCell('sku','2026-09-14',-2,'reason','fixture');assert.equal(e.state.rows.supplementStock[0].currentQty,8);
});
test('response loss cannot issue a second incoming transaction',async()=>{
  const e=await setup();e.state.failNextCommit='after';await assert.rejects(()=>e.page.saveIncomingCell('sku','2026-09-14',5,'fixture'),error=>error.code==='outcome-unknown');await assert.rejects(()=>e.page.saveIncomingCell('sku','2026-09-14',5,'fixture'),/직전 저장 결과/);assert.equal(e.state.rows.supplementStock[0].currentQty,15);assert.equal(e.state.commits.length,1);
});
