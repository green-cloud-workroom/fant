import {initializeApp,applicationDefault,deleteApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {inspectDuplicateReceipt,applyDuplicateReceiptResolution} from './duplicateReceiptResolution.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST)throw Error('Operational repair must use the explicit live project.');
const execute=process.argv.includes('--execute');
const app=initializeApp({credential:applicationDefault(),projectId:'fant-e5ae5'});
const db=getFirestore(app),directory='output/readpath/duplicate-resolution';
await mkdir(directory,{recursive:true});
try {
 if(!execute){
  const audit=JSON.parse(await readFile('output/deploy-review/duplicate-receipt-resolution-plan.json','utf8'));
  const plans=[];
  for(const row of audit.cases.filter(r=>r.strategy==='remove-untouched-duplicate'))plans.push(await inspectDuplicateReceipt(db,row.sourceId,row.duplicateRequest));
  await writeFile(directory+'/prepared.json',JSON.stringify({project:'fant-e5ae5',preparedAt:new Date().toISOString(),plans,remaining:audit.cases.filter(r=>r.strategy!=='remove-untouched-duplicate').map(r=>({sourceId:r.sourceId,date:r.date,name:r.name,strategy:r.strategy}))},null,2));
  console.log(JSON.stringify({prepared:plans.map(p=>({sourceId:p.sourceId,duplicateId:p.duplicateId,keeperId:p.keeperId,stockDelta:p.lots.map(l=>({lotId:l.id,unit:l.data.unit,qty:-l.data.totalQty}))}))}));
 }else{
  const prepared=JSON.parse(await readFile(directory+'/prepared.json','utf8'));
  const age=Date.now()-Date.parse(prepared.preparedAt);
  if(prepared.project!=='fant-e5ae5'||!Number.isFinite(age)||age<0||age>3600000)throw Error('A fresh reviewed repair plan is required.');
  const results=[];
  for(const plan of prepared.plans){results.push(await applyDuplicateReceiptResolution(db,plan,()=>FieldValue.serverTimestamp()));await writeFile(directory+'/applied.json',JSON.stringify({appliedAt:new Date().toISOString(),results},null,2));}
  console.log(JSON.stringify(results));
 }
}finally{await db.terminate();await deleteApp(app);}
