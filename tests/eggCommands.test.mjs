import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';
async function setup(){
  const fake=makeEditableFirestore();fake.state.rows.eggStock=[{id:'global',currentQty:100,minimumQty:20}];
  const e=await environment({session:true,firestore:fake,instrument:{'src/pages/egg.js':'\nexport {saveEggChange};'}});
  e.context.alert=()=>{};
  e.synthetic(resolve('src/firebase.js'),{db:{},auth:{currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})}}});
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.nodes.mainContent,'egg');
  const resource=(await e.load('src/state/pageResources.js')).pageResource('egg');
  await resource.load(async scope=>(await scope.getDoc(e.api.doc({},'eggStock','global'))).data());
  const page=await e.load('src/pages/egg.js');
  const save=()=>page.saveEggChange({currentQty:100,minimumQty:20},{currentQty:110,minimumQty:20},{date:'2026-09-14',type:'in',qty:10,before:100,after:110,staffName:'fixture'},{action:'egg',subAction:'in',date:'2026-09-14',staff:'fixture',message:'test',details:{before:100,after:110}},'2026-09-14');
  return {...e,resource,page,save};
}
test('egg stock, stock log and activity are committed together with the existing activity fields',async()=>{
  const e=await setup();assert.equal(await e.save(),true);assert.equal(e.state.rows.eggStock[0].currentQty,110);assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,3);const activity=e.state.commits[0][2].data;assert.equal(activity.details.app,'production');assert.equal(activity.acknowledged,false);assert.equal(activity.uid,'fixture');
});
test('a changed egg stock or a closed date produces no stock/log writes',async()=>{
  const e=await setup();e.state.rows.eggStock[0].currentQty=90;await assert.rejects(e.save,/원본이 변경/);assert.equal(e.state.commits.length,0);
  const closed=await setup();closed.state.rows.closings.push({id:'2026-09-14',status:'closed'});assert.equal(await closed.save(),false);assert.equal(closed.state.commits.length,0);
});
test('an interrupted egg acknowledgement cannot duplicate receipt logs',async()=>{
  const e=await setup();e.state.failNextCommit='after';await assert.rejects(e.save,error=>error.code==='outcome-unknown');await assert.rejects(e.save,/직전 저장 결과/);assert.equal(e.state.commits.length,1);assert.equal(e.state.rows.eggStock[0].currentQty,110);
});
