import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleSummary,assembleSummary,publicHash } from '../src/domain/summaryContract.js';
import { serializePublicModel } from '../src/domain/publicMainModel.js';
const arrays=['productions','nextProductions','overdueProductions','overdueNextProductions','calendarProductions','recipes','meatTypeRows','meatStocks','equipmentAlerts','calendarSchedules','calendarEvents','combinedLogs'];
async function fixture(){const model={...Object.fromEntries(arrays.map(key=>[key,[]])),eggStock:{currentQty:1,minimumQty:0},blockingData:{totalBlocked:0,items:[]}};return {schemaVersion:1,logicVersion:'reviewed',date:'2026-09-14',readModelMode:'serve',rebuildState:'ready',generation:1,requestedGeneration:1,buildId:'build',model,chunks:[],modelHash:await publicHash(model)}}
test('summary eligibility rejects modes, schema, logic, date and incomplete generation',async()=>{
  const root=await fixture(),context={date:root.date,logicVersion:'reviewed'};assert.equal(eligibleSummary(root,context),true);
  for(const change of [{readModelMode:'off'},{readModelMode:'shadow'},{schemaVersion:2},{logicVersion:'other'},{date:'2026-09-15'},{requestedGeneration:2},{rebuildState:'updating'},{model:null}])assert.equal(eligibleSummary({...root,...change},context),false);
});
test('inline summary validates without any chunk request',async()=>{
  const root=await fixture();let reads=0;const model=await assembleSummary(root,async()=>{reads++;},n=>({toMillis:()=>n}));assert.equal(reads,0);assert.deepEqual(model,root.model);
});
test('complete chunks reconstruct one generation without mutating the root',async()=>{
  const root=await fixture(),payload=[{id:'p',date:root.date}],id='1__build__productions__0';const info={id,section:'productions',index:0,rowCount:1,payloadHash:await publicHash(payload)};
  root.chunks=[info];root.modelHash=await publicHash({...root.model,productions:payload});const chunk={...info,payload,schemaVersion:1,generation:1,buildId:'build',logicVersion:'reviewed'};
  const result=await assembleSummary(root,async()=>chunk,n=>n);assert.deepEqual(result.productions,payload);assert.deepEqual(root.model.productions,[]);
  for(const change of [null,{...chunk,generation:2},{...chunk,buildId:'old'},{...chunk,payload:[{id:'changed'}]}])await assert.rejects(()=>assembleSummary(root,async()=>change,n=>n),/invalid-chunk/);
});
test('tampered manifest, partial model and modified inline payload are refused',async()=>{
  const root=await fixture();await assert.rejects(()=>assembleSummary({...root,model:{...root.model,productions:undefined}},async()=>null,n=>n),/missing-section/);
  await assert.rejects(()=>assembleSummary({...root,model:{...root.model,eggStock:{currentQty:999}}},async()=>null,n=>n),/invalid-model/);
  await assert.rejects(()=>assembleSummary({...root,chunks:[{id:'../../productions/p',section:'productions',index:0}]},async()=>null,n=>n),/invalid-manifest/);
});
test('timestamp transport and canonical hash are independent of map key ordering',async()=>{
  const root=await fixture();root.model.combinedLogs=[{timestamp:{toMillis:()=>12345},message:'same'}];root.model=serializePublicModel(root.model);root.modelHash=await publicHash(root.model);
  const result=await assembleSummary(root,async()=>null,n=>({toMillis:()=>n}));assert.equal(result.combinedLogs[0].timestamp.toMillis(),12345);
  assert.equal(await publicHash({a:1,b:2}),await publicHash({b:2,a:1}));
});
