import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';
async function setup(route){
  const fake=makeEditableFirestore();fake.state.rows.bagTypes=[{id:'bag',name:'bag',currentQty:100,minimumQty:0,sortOrder:0}];fake.state.rows.equipmentParts=[{id:'part',name:'part',equipmentId:'machine',currentQty:3,sortOrder:0}];
  const e=await environment({session:true,firestore:fake,instrument:{'src/pages/bag.js':'\nexport {saveBagStockChange,loadBagDeleteContext};','src/pages/equipment.js':'\nexport {commitPartChange,copyPartsFrom};export function seedPartsForTest(rows){parts=rows;}'}});
  const alerts=[];e.context.alert=message=>alerts.push(message);
  e.synthetic(resolve('src/firebase.js'),{db:{},auth:{currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})}}});
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.nodes.mainContent,route);
  const resource=(await e.load('src/state/pageResources.js')).pageResource(route);
  await resource.load(async scope=>(await scope.getDocs(e.api.collection({},route==='bag'?'bagTypes':'equipmentParts'))).docs.map(d=>({id:d.id,...d.data()})));
  return {...e,alerts,resource,page:await e.load('src/pages/'+route+'.js'),command:await e.load('src/services/readCommand.js')};
}
test('bag incoming keeps stock, bag history and activity in one transaction',async()=>{
  const e=await setup('bag');const bag=e.state.rows.bagTypes[0];
  assert.equal(await e.page.saveBagStockChange(bag,{currentQty:120},{bagTypeId:'bag',before:100,after:120,qty:20,type:'incoming',date:'2026-09-14'},{action:'bag',subAction:'incoming',date:'2026-09-14',staff:'fixture'},'2026-09-14'),true);
  assert.equal(e.state.rows.bagTypes[0].currentQty,120);assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,3);
});
test('bag conflict keeps the attempted input and sends no write',async()=>{
  const e=await setup('bag'),bag={...e.state.rows.bagTypes[0]};e.state.rows.bagTypes[0].currentQty=99;
  await e.page.saveBagStockChange(bag,{currentQty:120},{},{action:'bag',subAction:'incoming',staff:'fixture'},'2026-09-14');assert.equal(e.state.commits.length,0);assert.match(e.alerts[0],/原本|원본/);
});
test('equipment replacement retains dates and atomically records the exact inventory delta',async()=>{
  const e=await setup('equipment'),part=e.state.rows.equipmentParts[0];
  const change={type:'replace',qty:-1,before:3,after:2,date:'2026-09-14',staff:'fixture',note:'test',partPatch:{currentQty:2,lastReplacedAt:'2026-09-14',nextDueAt:'2026-10-14'},message:'replace'};
  await e.command.withReadCommand(e.resource,c=>e.page.commitPartChange(part,change,c));
  assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,3);assert.equal(e.state.rows.equipmentParts[0].nextDueAt,'2026-10-14');assert.equal(e.state.rows.equipmentPartLogs[0].qty,-1);assert.equal(e.state.rows.equipmentPartLogs[0].before,3);
});
test('copying parts stays staged with the new machine until the command commits',async()=>{
  const e=await setup('equipment');e.page.seedPartsForTest(e.state.rows.equipmentParts);
  const {commandBatch}=await e.load('src/services/commandBatch.js');
  await e.command.withReadCommand(e.resource,async c=>{const staged=commandBatch(c,{});staged.batch.set(e.api.doc({},'equipments','copy'),{category:'copy',alias:'copy'});await e.page.copyPartsFrom('machine',{id:'copy',category:'copy',alias:'copy'},staged.batch);assert.equal(e.state.commits.length,0);await staged.commit();});
  assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].length,2);const copy=e.state.rows.equipmentParts.find(p=>p.equipmentId==='copy');assert.equal(copy.currentQty,0);assert.equal(copy.lastReplacedAt,null);
});
