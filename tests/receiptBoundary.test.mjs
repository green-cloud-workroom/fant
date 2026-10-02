// Read actual current app code; all reads/writes below use an in-memory fake.
// Inventory stock helpers are captured at their transaction boundary.
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pageEnvironment } from '../tests/helpers/pageDom.mjs';
const e=await pageEnvironment('main',{instantRoutes:['main'],instrument:'\nexport {openProductReceiptModal,renderInstantMain};'});
const p={id:'audit',date:'2026-07-01',recipeId:'r1',recipeName:'검증',target:'cat',category:'raw',status:'active',received:true,receivedRevision:1,receivedTotalPacks:100,receivedPlates:1,ingredientsSnapshot:[]};
e.state.rows.productions=[p];e.state.rows.recipes[0].packsPerPlate=100;
e.state.rows.closings.push({id:p.date,status:'closed'});
e.state.rows.productTransferRequests=[{id:'productions:audit:1',idempotencyKey:'productions:audit:1',sourceApp:'production',sourceCollection:'productions',sourceId:p.id,eventType:'productReceipt',revision:1,status:'pending',category:'raw',recipeId:'r1',recipeName:'검증',target:'cat',packs:100,boxes:5,remainderPacks:0,producedDate:p.date}];
await e.page.renderInstantMain();await e.page.openProductReceiptModal(p.id);e.fill('#pr_plates',2);await e.fire('#pr_confirm');
const ctx=vm.createContext({console,Date,Map,Set,Math,Number,Promise});
const mods=new Map();
function synthetic(id,exports){const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v);},{context:ctx,identifier:id});mods.set(id,m);return m;}
const root='C:/dev/fantapet-inventory/src';
async function source(id,path){const m=new vm.SourceTextModule(stripTypeScriptTypes(await readFile(root+'/'+path,'utf8')),{context:ctx,identifier:id});mods.set(id,m);return m;}
const types=await source('../../types/productReceipts','types/productReceipts.ts');await types.link(()=>{throw Error('Unexpected type import');});await types.evaluate();
const wrap=(ref,s)=>ref.path.startsWith('productTransferRequests/')&&s.exists()?{...s,data:()=>types.namespace.normalizeProductTransferRequest(s.id,s.data())}:s;
const api={...e.api,Timestamp:{fromMillis:n=>({toMillis:()=>n})},
  getDocs:async ref=>{const s=await e.api.getDocsFromServer(ref);const docs=s.docs.map(item=>ref.path==='productTransferRequests'?{...item,data:()=>types.namespace.normalizeProductTransferRequest(item.id,item.data())}:item);return {...s,docs,forEach:fn=>docs.forEach(fn)};},
  getDoc:async ref=>wrap(ref,await e.api.getDocFromServer(ref)),
  runTransaction:(_db,fn)=>e.api.runTransaction({},tx=>fn({...tx,get:async ref=>wrap(ref,await tx.get(ref))})),
};
synthetic('firebase/firestore',api);synthetic('../../lib/firebase',{db:{},auth:null});
synthetic('../../lib/firestore',{
  getProductReceiptDoc:id=>e.api.doc({},'productTransferRequests',id),
  productReceiptsCollection:()=>e.api.collection({},'productTransferRequests'),
  stockLotsCollection:()=>e.api.collection({},'stockLots'),stockMovementsCollection:()=>e.api.collection({},'stockMovements'),
});
for(const [id,path] of [['../../lib/units','lib/units.ts'],['../../types/bundleE','types/bundleE.ts'],['../../types/recipes','types/recipes.ts']])await source(id,path);
const received=[];
synthetic('../inventory/stockLotService',{STOCK_LOT_STATUS:{depleted:'depleted',shippable:'shippable'},createInboundStockLotWithGenesisMovementInTransaction:args=>{received.push({refId:args.refId,input:args.input});args.transaction.set(args.lotRef,JSON.parse(JSON.stringify(args.input)));}});
synthetic('../inventory/stockMovementService',{getFifoStockLotRefs:async()=>[],recordStockMovementForReadLotInTransaction:()=>{throw Error('Not part of raw audit');}});
const inventory=await source('inventory','features/productReceipts/productReceiptService.ts');
await inventory.link(id=>{if(!mods.has(id))throw Error('Unexpected import '+id);return mods.get(id);});await inventory.evaluate();
const normalize=()=>e.state.rows.productTransferRequests.map(row=>types.namespace.normalizeProductTransferRequest(row.id,row));
const pending=()=>Array.from(inventory.namespace.selectLatestPendingProductReceipts(normalize())).map(r=>r.revision);
const before=pending();
await inventory.namespace.reviewProductReceipt({receiptId:'productions:audit:2',reviewedBy:'audit',productId:'sku',productName:'검증'});
const afterLatest=pending();
const listedAfterLatest=await inventory.namespace.listPendingProductReceipts();
if (listedAfterLatest.length) throw Error('Pending server query resurrected old revision');
let staleRejected=false;try {await inventory.namespace.reviewProductReceipt({receiptId:'productions:audit:1',reviewedBy:'audit',productId:'sku',productName:'검증'});}catch(error){if (!error.message.includes('정정되었거나')) throw error;staleRejected=true;}
if (!staleRejected || afterLatest.length || received.length!==1 || received[0].input.initialQty!==10) throw Error('Cross-app duplicate guard failed');
const report={staleRejected,productionRevision:e.state.rows.productions[0].receivedRevision,pendingBeforeReceiving:before,pendingAfterReceivingLatest:afterLatest,received,completedRevisions:e.state.rows.productTransferRequests.filter(r=>r.status==='completed').map(r=>r.revision),limitation:'Actual production and inventory service code with in-memory Firestore; stock helper captured at transaction boundary; no production connection.'};
console.log(JSON.stringify(report,null,2));await writeFile(resolve('output/receipt-boundary-audit.json'),JSON.stringify(report,null,2));await e.cleanup();
