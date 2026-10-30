import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';

for(const mode of ['locked','completion-only','late-completion','new-completion','unlock-payload'])for(const deleting of [false,true])test(`production transaction blocks ${mode}, delete=${deleting}`,async()=>{
 const fake=makeEditableFirestore(),e=await environment({firestore:fake});
 const date=fake.today;
 fake.state.rows.productions=[{id:'p',date,status:'active',sortOrder:0,round:1,batchNo:null,recipeId:'r1',productionUnitQty:1,lockedByCompletion:mode==='locked'}];
 fake.state.rows.productionCompletion=mode==='completion-only'?[{id:'2026-09-13',targetProductionDate:date,status:'completed'}]:mode==='late-completion'?[{id:'2026-09-13',targetProductionDate:date,status:'cancelled'}]:[];
 const command={getDoc:fake.api.getDocFromServer,getDocs:fake.api.getDocsFromServer,transaction:(_db,callback)=>{
  if(mode==='late-completion')fake.state.rows.productionCompletion[0].status='completed';
  if(mode==='new-completion')fake.state.rows.productionCompletion.push({id:'2026-09-12',targetProductionDate:date,status:'completed'});
  return fake.api.runTransaction({},callback);
 }};
 const service=await e.load('src/services/productionOrderTransaction.js');
 await assert.rejects(service.runProductionOrderTransaction({db:{},date,command,prepare:async()=>({changes:[{kind:'update',id:'p',data:{
  ...(deleting?{status:'deleted'}:{staffName:'changed'}),...(mode==='unlock-payload'?{lockedByCompletion:false}:{})}}]})}),/완료|잠금/);
 assert.equal(fake.state.commits.length,0);assert.equal(fake.state.rows.productions[0].status,'active');
});

test('completion-only UI disables edit/delete even when the legacy lock flag is false',async()=>{
 const e=await pageEnvironment('production',{instrument:'\nexport {showProductionForm};'});try{
  e.state.rows.productions=[{id:'p',date:e.today,status:'active',sortOrder:0,round:1,recipeId:'r1',productionUnitQty:1,recipeName:'검증 레시피'}];
  e.state.rows.productionCompletion=[{id:'previous-business-day',targetProductionDate:e.today,status:'completed'}];
  await e.page.renderProduction();await e.fire('.production-card');
  assert.equal(e.document.querySelector('.card-del').disabled,true);assert.equal(e.document.querySelector('#btnSaveProduction').disabled,true);
  assert.match(e.document.querySelector('#productionCards').textContent,/완료 취소/);
 }finally{await e.cleanup();}
});

async function autoSetup(){
 const e=await pageEnvironment('main');
 e.state.rows.meatStocks=[{id:'lot',meatTypeId:'m1',stage:'repacked',remaining:10000,closed:false}];
 e.state.rows.activityLogs=[{id:'source',acknowledged:false,details:{repackedStockId:'lot',meatTypeId:'m1',meatName:'닭',processedUnitWeightG:1000,surplusG:10000}}];
 const service=await e.load('src/services/autoRepackConfirm.js');
 const args={db:{},logId:'source',log:structuredClone(e.state.rows.activityLogs[0]),actualCount:8,staffName:'검증 담당자',date:e.today,uid:'fixture'};
 return {e,run:()=>service.confirmAutoRepack(args),args};
}
test('auto repack correction, meat history, activity and ack commit once; replay cannot adjust twice',async()=>{
 const {e,run}=await autoSetup();try{
  await run();assert.equal(e.state.rows.meatStocks[0].remaining,8000);assert.equal(e.state.rows.meatLogs.length,1);
  assert.equal(e.state.rows.meatLogs[0].delta,-2000);assert.equal(e.state.rows.activityLogs[0].acknowledged,true);assert.equal(e.state.commits.length,1);
  const before=JSON.stringify(e.state.rows);assert.equal((await run()).alreadyCompleted,true);assert.equal(JSON.stringify(e.state.rows),before);
  const ack=e.state.commits[0].find(o=>o.target.path==='activityLogs/source');assert.deepEqual(Object.keys(ack.data).sort(),['acknowledged','acknowledgedAt','acknowledgedBy','acknowledgedByUid']);
 }finally{await e.cleanup();}
});
for(const mode of ['acknowledged','negative','mid-failure'])test(`auto repack rejects ${mode} without partial writes`,async()=>{
 const {e,run,args}=await autoSetup();try{
  if(mode==='acknowledged')e.state.rows.activityLogs[0].acknowledged=true;
  if(mode==='negative')e.state.rows.meatStocks[0].remaining=100;
  if(mode==='mid-failure'){const original=e.api.runTransaction;e.cache.get('firebase/firestore').setExport('runTransaction',(_,callback)=>original({},async tx=>{await callback(tx);throw Error('staged failure');}));}
  const before=JSON.stringify(e.state.rows);await assert.rejects(run());assert.equal(JSON.stringify(e.state.rows),before);assert.equal(e.state.commits.length,0);
 }finally{await e.cleanup();}
});
test('auto repack zero difference still checks source and commits ack atomically',async()=>{
 const {e,run,args}=await autoSetup();try{args.actualCount=10;await run();assert.equal(e.state.rows.meatStocks[0].remaining,10000);assert.equal(e.state.rows.meatLogs?.length||0,0);assert.equal(e.state.rows.activityLogs[0].acknowledged,true);assert.equal(e.state.commits.length,1);}finally{await e.cleanup();}
});
test('production role cannot execute the supplement adjustment client command',async()=>{
 const e=await pageEnvironment('supplement',{role:'production',instrument:'\nexport {saveAdjustCell};'});try{
  await e.page.renderSupplement();await assert.rejects(e.page.saveAdjustCell('r1_1',e.today,1,'실사','검증',{kind:'reconciliation',operationId:'role-check',reason:'실사'}),/권한/);assert.equal(e.state.commits.length,0);
 }finally{await e.cleanup();}
});
test('release client requests admin/office explicitly and auto-repack role policy stays intact',()=>{
 const layout=readFileSync('src/layout.js','utf8').split('async function showReleaseConfirmModal')[1];
 assert.match(layout.slice(0,230),/roles:\['admin','office'\]/);
 const main=readFileSync('src/pages/main.js','utf8').split('async function showAutoRepackConfirmModal')[1];
 assert.match(main.slice(0,250),/roles: \['admin', 'production'\]/);
});
test('separation delete uses the existing prompt modal and cancelling creates no write',async()=>{
 const e=await pageEnvironment('frozenSep',{instrument:'\nexport {deleteFrozenSepStock};'});try{
  e.state.rows.frozenSeparation=[{id:'s',date:e.today,productName:'검증',initialQty:1,remaining:1,closed:false,stockType:'notSeparated'}];
  await e.page.renderFrozenSep();let calls=0;e.cache.get(resolve('src/utils/modal.js')).setExport('showPromptModal',async opts=>{calls++;assert.equal(opts.required,true);return null;});
  await e.page.deleteFrozenSepStock(e.state.rows.frozenSeparation[0]);assert.equal(calls,1);assert.equal(e.state.commits.length,0);
 }finally{await e.cleanup();}
});
