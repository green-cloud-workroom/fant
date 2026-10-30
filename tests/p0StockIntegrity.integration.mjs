// Real SDK transactions against an explicitly loopback, demo-only emulator.
// UI calculation modules remain isolated through the existing VM page harness.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,collection,getDoc,getDocs,setDoc,runTransaction,query,where} from 'firebase/firestore';
import {pageEnvironment} from './helpers/pageDom.mjs';
import {cases,setupCase,runCase} from './helpers/p0StockCases.mjs';
const projectId='demo-fant-p0';
const env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:8097,
 rules:'rules_version = "2"; service cloud.firestore { match /databases/{database}/documents { match /{path=**} { allow read, write: if true; } } }'}});
const db=env.authenticatedContext('fixture').firestore(),checks=[];
async function seed(rows){for(const [name,list]of Object.entries(rows))for(const row of list){const {id,...data}=row;await setDoc(doc(db,name,id),data);}}
function bridge(e,{failure=false,rendezvous}={}){
 const module=e.cache.get('firebase/firestore'),baseDoc=e.api.doc;
 module.setExport('doc',(parent,...parts)=>parts.length?baseDoc(parent,...parts):baseDoc(parent,randomUUID()));
 let attempts=0;
 module.setExport('runTransaction',async(_,callback)=>runTransaction(db,async tx=>{
  attempts++;
  let writing=false;
  const mapped={get:ref=>{assert.equal(writing,false,'SDK reads must precede every write');return tx.get(doc(db,ref.path));}};
  for(const kind of ['set','update','delete'])mapped[kind]=(ref,...args)=>{writing=true;tx[kind](doc(db,ref.path),...args.map(value=>structuredClone(value)));return mapped;};
  const result=await callback(mapped);if(rendezvous && attempts===1)await rendezvous();if(failure)throw Error('injected failure after staging native transaction writes');return result;
 }));
 return ()=>attempts;
}
async function rows(name){return (await getDocs(collection(db,name))).docs.map(s=>({id:s.id,...s.data()}));}
try{
 for(const spec of cases){
  await env.clearFirestore();
  const a=await setupCase(spec), b=await setupCase(spec);
  try{
   await seed(a.state.rows);const attemptsA=bridge(a),attemptsB=bridge(b);
   if(spec.name==='tender receipt'){
    a.document.querySelector(spec.button).dataset.operationId='same-receipt';
    b.document.querySelector(spec.button).dataset.operationId='same-receipt';
   }
   await Promise.all([runCase(a,spec),runCase(b,spec)]);
   const ledgers=await rows('stockLedger');assert.equal(ledgers.length,1,`${spec.name}: two sessions must produce one accepted movement`);
   if(spec.source)assert.equal((await getDoc(doc(db,spec.source,spec.sourceId))).data().remaining,spec.before-spec.used);
   const logsBefore=JSON.stringify(await Promise.all(['meatLogs','breadPanLogs','frozenPanLogs','frozenSeparationLogs','activityLogs'].map(rows)));
   const ledger=ledgers[0], saved=JSON.parse(ledger.requestFingerprint), service=await a.load('src/services/atomicStockOperation.js');
   const replay=await service.atomicStockOperation({db:{},operationId:ledger.operationId,...saved,build:async()=>{throw Error('duplicate must not run build');}});
   assert.equal(replay.alreadyCompleted,true);
   assert.equal(JSON.stringify(await Promise.all(['meatLogs','breadPanLogs','frozenPanLogs','frozenSeparationLogs','activityLogs'].map(rows))),logsBefore);
   for(const item of ledger.items){assert.equal((await getDoc(doc(db,item.collection,item.docId))).data().remaining,item.after);assert.ok(Math.abs(item.before+item.delta-item.after)<1e-6);assert.ok(item.after>=0);}
   checks.push({name:spec.name,concurrentSessions:2,acceptedLedgers:1,attempts:attemptsA()+attemptsB(),replay:true});
  }finally{await a.cleanup();await b.cleanup();}
  await env.clearFirestore();
  const failure=await setupCase(spec);try{
   await seed(failure.state.rows);const before=JSON.stringify(await Promise.all(['meatStocks','breadPanLots','frozenPanLots','frozenPanStock','frozenSeparation','meatLogs','breadPanLogs','frozenPanLogs','frozenSeparationLogs','stockLedger','activityLogs'].map(rows)));
   bridge(failure,{failure:true});await runCase(failure,spec);
   assert.equal(JSON.stringify(await Promise.all(['meatStocks','breadPanLots','frozenPanLots','frozenPanStock','frozenSeparation','meatLogs','breadPanLogs','frozenPanLogs','frozenSeparationLogs','stockLedger','activityLogs'].map(rows))),before);
   assert.equal((await rows('stockLedger')).length,0);
   checks.push({name:spec.name,midFailure:true,unchanged:true});
  }finally{await failure.cleanup();}
 }
 // Two confirmations of the same auto-repack source must apply diff once.
 await env.clearFirestore();
 const autoA=await pageEnvironment('main'),autoB=await pageEnvironment('main');
 try{
  const source={id:'source',acknowledged:false,details:{repackedStockId:'auto-lot',meatTypeId:'m1',meatName:'닭',processedUnitWeightG:1000,surplusG:10000}};
  await seed({meatStocks:[{id:'auto-lot',stage:'repacked',meatTypeId:'m1',remaining:10000}],activityLogs:[source]});
  bridge(autoA);bridge(autoB);
  const invoke=async e=>(await e.load('src/services/autoRepackConfirm.js')).confirmAutoRepack({db:{},logId:'source',log:source,actualCount:8,staffName:'검증 담당자',date:e.today,uid:'fixture'});
  await Promise.all([invoke(autoA),invoke(autoB)]);
  assert.equal((await getDoc(doc(db,'meatStocks','auto-lot'))).data().remaining,8000);
  assert.equal((await rows('meatLogs')).length,1);assert.equal((await rows('stockLedger')).length,1);
  assert.equal((await getDoc(doc(db,'activityLogs','source'))).data().acknowledged,true);
  assert.equal((await invoke(autoA)).alreadyCompleted,true);
  checks.push({name:'auto-repack',concurrentSessions:2,acceptedLedgers:1,replay:true,remaining:8000});
  await env.clearFirestore();
  await seed({meatStocks:[{id:'auto-lot',stage:'repacked',meatTypeId:'m1',remaining:10000}],activityLogs:[source]});
  bridge(autoA,{failure:true});await assert.rejects(invoke(autoA),/injected failure/);
  assert.equal((await getDoc(doc(db,'meatStocks','auto-lot'))).data().remaining,10000);
  assert.equal((await getDoc(doc(db,'activityLogs','source'))).data().acknowledged,false);
  assert.equal((await rows('meatLogs')).length,0);assert.equal((await rows('stockLedger')).length,0);
  checks.push({name:'auto-repack',midFailure:true,unchanged:true});
 }finally{await autoA.cleanup();await autoB.cleanup();}
 // Distinct requests must compete on the lot, rather than the ledger ID.
 for(const used of [4,6]){
  await env.clearFirestore();await seed({meatStocks:[{id:'shared',stage:'frozen',meatTypeId:'m1',remaining:10,closed:false}]});
  const a=await pageEnvironment('meat'),b=await pageEnvironment('meat');
  try{
   let arrived=0,release;const ready=new Promise(r=>{release=r;});
   const rendezvous=async()=>{if(++arrived===2)release();await ready;};
   const attemptsA=bridge(a,{rendezvous}),attemptsB=bridge(b,{rendezvous});
   const invoke=async(e,id)=>(await e.load('src/services/atomicStockOperation.js')).atomicStockOperation({db:{},operationId:id,actionType:'race',date:e.today,request:{used},inputs:{meatStocks:[{id:'shared',stage:'frozen',meatTypeId:'m1'}]},build:async({writer,fresh})=>{
    const lot=fresh.meatStocks[0];if(!lot || lot.remaining<used)throw Error('insufficient stock');
    await writer.updateDoc(e.api.doc({},'meatStocks','shared'),{remaining:lot.remaining-used});
   }});
   const outcomes=await Promise.allSettled([invoke(a,'different-a'),invoke(b,'different-b')]);
   const accepted=outcomes.filter(r=>r.status==='fulfilled').length;
   assert.equal(accepted,used===4?2:1,outcomes.map(r=>r.reason?.stack||r.status).join('\n'));
   if(used===6)assert.match(outcomes.find(r=>r.status==='rejected').reason.message,/insufficient/);
   const ledgers=await rows('stockLedger'),remaining=(await getDoc(doc(db,'meatStocks','shared'))).data().remaining;
   assert.equal(ledgers.length,accepted);assert.equal(remaining,10-used*accepted);assert.ok(remaining>=0);
   const items=ledgers.flatMap(l=>l.items).sort((a,b)=>b.before-a.before);
   let before=10;for(const item of items){assert.equal(item.before,before);assert.equal(item.after,item.before+item.delta);before=item.after;}
   assert.equal(before,remaining);assert.ok(attemptsA()+attemptsB()>2,'lot conflict must actually retry');
   checks.push({name:`distinct operation IDs shared lot used=${used}`,accepted,remaining,attempts:attemptsA()+attemptsB(),ledgerChain:true});
  }finally{await a.cleanup();await b.cleanup();}
 }
 // Create a previously absent completion document WITHOUT touching the
 // production row. Its fixed-ID read alone must invalidate the transaction.
 await env.clearFirestore();
 const production=await pageEnvironment('production');
 try{
  const date=production.today;
  await seed({productions:[{id:'p',date,status:'active',sortOrder:0,round:1,batchNo:null,recipeId:'r1',productionUnitQty:1,lockedByCompletion:false}]});
  bridge(production);
  const native=production.cache.get('firebase/firestore').namespace;
  const command={getDoc:ref=>getDoc(doc(db,ref.path)),getDocs:ref=>getDocs(query(collection(db,ref.path),...(ref.conditions||[]).filter(c=>c.type==='where').map(c=>where(c.field,c.op,c.value)))),transaction:(_,callback)=>native.runTransaction({},callback)};
  const service=await production.load('src/services/productionOrderTransaction.js');
  let readComplete,continueEdit;
  const ready=new Promise(resolve=>{readComplete=resolve;}),resume=new Promise(resolve=>{continueEdit=resolve;});
  const editing=service.runProductionOrderTransaction({db:{},date,command,prepare:async()=>{readComplete();await resume;return {changes:[{kind:'update',id:'p',data:{staffName:'edited'}}]};}});
  // Attach rejection handling immediately; no unhandled promise window.
  const denied=assert.rejects(editing,/변경|완료/);
  await ready;
  await setDoc(doc(db,'productionCompletion','2026-09-13'),{status:'completed',targetProductionDate:date});
  continueEdit();await denied;
  assert.equal((await getDoc(doc(db,'productions','p'))).data().staffName,undefined);
  assert.equal((await getDoc(doc(db,'productionOrderDays',date))).exists(),false);
  assert.equal((await getDoc(doc(db,'productions','p'))).data().lockedByCompletion,false);
  checks.push({name:'production edit versus new completion only (no production lock write)',rejected:true,unchanged:true});
  await setDoc(doc(db,'productions','p'),{date,status:'active',sortOrder:0,round:1,batchNo:null,recipeId:'r1',productionUnitQty:1,lockedByCompletion:false});
  await assert.rejects(service.runProductionOrderTransaction({db:{},date,command,prepare:async()=>({changes:[{kind:'update',id:'p',data:{status:'deleted'}}]})}),/완료/);
  assert.equal((await getDoc(doc(db,'productions','p'))).data().status,'active');
  checks.push({name:'completion-only legacy production delete',rejected:true,unchanged:true});
 }finally{await production.cleanup();}
 const result={passed:true,projectId,host:'127.0.0.1:8097',rules:'synthetic permissive rules; atomicity only, not production authorization',checks};
 await writeFile('output/p0-emulator-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await env.cleanup();}

