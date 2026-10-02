import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {inspectDuplicateReceipt,applyDuplicateReceiptResolution} from '../scripts/duplicateReceiptResolution.mjs';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8088'||!process.env.GCLOUD_PROJECT?.startsWith('demo-'))throw Error('Isolated demo emulator required.');
const app=initializeApp({projectId:'demo-fant-readpath'},'repair-test'),db=getFirestore(app);
test.after(async()=>{await db.terminate();await deleteApp(app);});
let sequence=0;
async function seed(){
 const id='repair-test-'+(++sequence),date='2026-09-30',batch=db.batch();
 batch.set(db.doc('productions/'+id),{category:'raw',date,recipeId:'r1',target:'cat',receivedRevision:2,receivedBox:4,receivedRemainder:3});
 for(const revision of [1,2]){
  const requestId=`productions:${id}:${revision}`;
  batch.set(db.doc('productTransferRequests/'+requestId),{category:'raw',sourceApp:'production',sourceCollection:'productions',sourceId:id,recipeId:'r1',target:'cat',producedDate:date,revision,status:'completed',boxes:4,remainderPacks:3,createdStockLotId:id+'-'+revision+'-box',createdSampleStockLotId:id+'-'+revision+'-pack'});
  for(const [unit,qty]of [['box',4],['pack',3]]){
   const lotId=id+'-'+revision+'-'+unit;
   batch.set(db.doc('stockLots/'+lotId),{id:lotId,category:'raw',productId:'sku-'+unit,unit,initialQty:qty,totalQty:qty,availableQty:qty,reservedQty:0,status:'출고가능'});
   batch.set(db.doc('stockMovements/'+lotId+'-inbound'),{stockLotId:lotId,type:'inbound',qty,refId:requestId});
  }
 }
 await batch.commit();return {id,duplicateId:`productions:${id}:1`,box:id+'-1-box',pack:id+'-1-pack'};
}
const apply=plan=>applyDuplicateReceiptResolution(db,plan,()=>FieldValue.serverTimestamp());
test('duplicate repair removes only the untouched lots, keeps history and is idempotent',async()=>{
 const row=await seed(),plan=await inspectDuplicateReceipt(db,row.id,row.duplicateId);
 assert.equal((await apply(plan)).alreadyApplied,false);
 assert.equal((await apply(JSON.parse(JSON.stringify(plan)))).alreadyApplied,true);
 for(const lotId of [row.box,row.pack])assert.equal((await db.doc('stockLots/'+lotId).get()).data().totalQty,0);
 assert.equal((await db.doc('stockLots/'+row.id+'-2-box').get()).data().totalQty,4);
 assert.equal((await db.doc('productTransferRequests/'+row.duplicateId).get()).data().status,'rejected');
 assert.equal((await db.collection('stockMovements').where('resolutionId','==',plan.resolutionId).get()).size,2);
 const history=await db.collection('productTransferRequests').where('sourceId','==',row.id).get();assert.equal(history.size,2);
});
test('a source change after preparation aborts with no repair writes',async()=>{
 const row=await seed(),plan=await inspectDuplicateReceipt(db,row.id,row.duplicateId);
 await db.doc('productions/'+row.id).update({note:'concurrent change'});
 await assert.rejects(apply(plan),/changed after preparation/);
 assert.equal((await db.doc('stockLots/'+row.box).get()).data().totalQty,4);
 assert.equal((await db.doc('activityLogs/'+plan.resolutionId).get()).exists,false);
});
test('new ledger activity after preparation aborts without subtracting stock',async()=>{
 const row=await seed(),plan=await inspectDuplicateReceipt(db,row.id,row.duplicateId);
 await db.doc('stockMovements/'+row.box+'-late').set({stockLotId:row.box,type:'outbound',qty:-1});
 await assert.rejects(apply(plan),/not untouched/);
 assert.equal((await db.doc('stockLots/'+row.box).get()).data().totalQty,4);
});
test('reserved or differently quantified stock cannot be selected for automatic repair',async()=>{
 const row=await seed();await db.doc('stockLots/'+row.box).update({reservedQty:1,availableQty:3});
 await assert.rejects(inspectDuplicateReceipt(db,row.id,row.duplicateId),/not untouched/);
 const other=await seed();await db.doc('productTransferRequests/'+other.duplicateId).update({boxes:5});
 await assert.rejects(inspectDuplicateReceipt(db,other.id,other.duplicateId),/manual ledger reconciliation/);
});
test('a missing lot cannot be repaired by inferring its original quantity',async()=>{
 const row=await seed();await db.doc('stockLots/'+row.box).delete();
 await assert.rejects(inspectDuplicateReceipt(db,row.id,row.duplicateId),/Missing receipt lot/);
});
