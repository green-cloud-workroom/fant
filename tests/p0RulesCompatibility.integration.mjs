// No live SDK configuration: only a hard-coded loopback demo project.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,writeBatch} from 'firebase/firestore';
import {cases,setupCase,runCase} from './helpers/p0StockCases.mjs';
import {pageEnvironment} from './helpers/pageDom.mjs';

const fixtures=[];
for(const spec of cases){
 const e=await setupCase(spec);
 try{
  const initial=structuredClone(e.state.rows);
  await runCase(e,spec);assert.equal(e.state.commits.length,1,e.alerts.join('\n'));
  fixtures.push({name:spec.name,initial,writes:structuredClone(e.state.commits[0])});
 }finally{await e.cleanup();}
}
for(const actualCount of [8,10]){
 const e=await pageEnvironment('main');
 try{
  const source={id:'source',acknowledged:false,details:{repackedStockId:'auto-lot',meatTypeId:'m1',meatName:'fixture',processedUnitWeightG:1000,surplusG:10000}};
  e.state.rows.meatStocks=[{id:'auto-lot',stage:'repacked',meatTypeId:'m1',remaining:10000,closed:false}];
  e.state.rows.activityLogs=[source];
  const initial=structuredClone(e.state.rows);
  await (await e.load('src/services/autoRepackConfirm.js')).confirmAutoRepack({db:{},logId:'source',log:source,actualCount,staffName:'fixture',date:e.today,uid:'fixture'});
  assert.equal(e.state.commits.length,1);
  fixtures.push({name:`auto-repack-${actualCount}`,initial,writes:structuredClone(e.state.commits[0])});
 }finally{await e.cleanup();}
}
const sources={live:'C:/dev/fant-production/output/rules-v2/live-firestore-rules-20261030-c71dbe60.rules',v2:'C:/dev/fant-production/output/rules-v2/rules-v2.rules'};
const checks=[],hashes={};
for(const [variant,path]of Object.entries(sources)){
 const rules=await readFile(path,'utf8');hashes[variant]={path,sha256:createHash('sha256').update(rules).digest('hex')};
 const env=await initializeTestEnvironment({projectId:'demo-fant-p0',firestore:{host:'127.0.0.1',port:8097,rules}});
 try{
  for(const role of ['production','office','admin'])for(const fixture of fixtures){
   await env.clearFirestore();
   await env.withSecurityRulesDisabled(async context=>{
    const db=context.firestore();
    await setDoc(doc(db,'securityReleaseControl','production'),{mode:'RELEASED'});
    for(const [name,rows]of Object.entries(fixture.initial))for(const {id,...data}of rows)await setDoc(doc(db,name,id),data);
   });
   const db=env.authenticatedContext('fixture',{app:['production'],roles:{production:role}}).firestore();
   // Read absent ledger, closings and source rows as the real transaction does.
   const readPaths=new Set([`closings/2026-09-14`,...fixture.writes.map(w=>w.target.path)]);
   for(const path of readPaths)await getDoc(doc(db,path));
   const batch=writeBatch(db);
   for(const {kind,target,data}of fixture.writes)batch[kind](doc(db,target.path),data);
   let error=null;try{await batch.commit();}catch(e){error={code:e.code,message:e.message};}
   const check={variant,role,name:fixture.name,allowed:!error,error,paths:fixture.writes.map(w=>w.target.path)};
   checks.push(check);
   // Find exact denied paths if the whole atomic write is rejected.
   if(error){check.denied=[];for(const {kind,target,data}of fixture.writes){try{const b=writeBatch(db);b[kind](doc(db,target.path),data);await b.commit();}catch(e){check.denied.push({path:target.path,kind,code:e.code});}}}
  }
 }finally{await env.cleanup();}
}
const result={passed:checks.every(c=>c.allowed),host:'127.0.0.1:8097',hashes,checks};
await writeFile('output/p0-rules-round2.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({passed:result.passed,total:checks.length,denied:checks.filter(c=>!c.allowed)},null,2));
assert.equal(result.passed,true,'Rules compatibility failed; see exact denied paths in evidence');
