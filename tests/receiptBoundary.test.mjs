// Read actual current app code; all reads/writes below use an in-memory fake.
// Inventory stock helpers are captured at their transaction boundary.
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Explicit cross-repository manual gate. Never part of the public default suite.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire,syncBuiltinESMExports} from 'node:module';
import {dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const required=['--production-root','--inventory-root','--pins','--expected-pins-sha256','--output'];
const argv=process.argv.slice(2),args=new Map();
if(argv.length!==required.length*2)throw Error('Explicit production/inventory roots, reviewed pins and expected SHA256, and new output are required.');
for(let i=0;i<argv.length;i+=2){const key=argv[i],value=argv[i+1];if(!required.includes(key)||args.has(key)||!value||value.startsWith('--'))throw Error('Unknown, duplicate or incomplete manual gate arguments.');args.set(key,value);}
if(!/^[a-f0-9]{64}$/.test(args.get('--expected-pins-sha256')))throw Error('Expected reviewed pins SHA256 is required.');
const config={productionRoot:fs.realpathSync(args.get('--production-root')),inventoryRoot:fs.realpathSync(args.get('--inventory-root')),pins:resolve(args.get('--pins')),expectedPinsSha256:args.get('--expected-pins-sha256'),output:resolve(args.get('--output'))};
if(config.productionRoot===config.inventoryRoot)throw Error('Separate production and inventory roots are required.');
if(fs.realpathSync(fileURLToPath(import.meta.url))!==fs.realpathSync(resolve(config.productionRoot,'tests/receiptBoundary.test.mjs')))throw Error('Run the manual gate from the explicitly selected production checkout.');
const outputRelative=relative(resolve(config.productionRoot,'output'),config.output);if(!outputRelative||outputRelative.startsWith('..')||isAbsolute(outputRelative)||fs.existsSync(config.output))throw Error('A new output file inside the selected production output directory is required.');
const sha=b=>createHash('sha256').update(b).digest('hex'),pinBytes=fs.readFileSync(config.pins);if(sha(pinBytes)!==config.expectedPinsSha256)throw Error('Reviewed pin manifest SHA256 mismatch.');const pins=JSON.parse(pinBytes);
if(pins.version!==1||!pins.production||!pins.inventory||Object.keys(pins).some(k=>!['version','production','inventory'].includes(k)))throw Error('Unknown manual gate pin manifest schema.');
const rawRead=fs.readFileSync.bind(fs),rawLstat=fs.lstatSync.bind(fs),rawRealpath=fs.realpathSync.bind(fs);
function relativePath(p){return typeof p==='string'&&p.length>0&&!p.includes('\\')&&!p.includes(':')&&!p.split('/').some(x=>!x||x==='.'||x==='..');}
function allFiles(root,part){const target=resolve(root,part),found=[];for(const entry of fs.readdirSync(target,{withFileTypes:true})){const path=part+'/'+entry.name,stat=rawLstat(resolve(root,path));if(stat.isSymbolicLink())throw Error('Symlink in pinned source tree.');if(stat.isDirectory())found.push(...allFiles(root,path));else if(/\.(?:js|mjs|ts|json|css)$/.test(path))found.push(path);}return found;}
const publicRequired=[...allFiles(config.productionRoot,'src'),...allFiles(config.productionRoot,'tests/helpers'),...allFiles(config.productionRoot,'tests/fixtures').filter(p=>p.endsWith('.mjs')),'package.json','package-lock.json','tests/receiptBoundary.test.mjs'].sort();
const privateRequired=['src/types/productReceipts.ts','src/lib/units.ts','src/types/bundleE.ts','src/types/recipes.ts','src/features/productReceipts/receiptWorkflowClient.ts','src/features/productReceipts/productReceiptService.ts'].sort();
for(const [kind,requiredFiles]of [['production',publicRequired],['inventory',privateRequired]]){const entries=pins[kind];if(Object.keys(entries).some(p=>!relativePath(p)||! /^[a-f0-9]{64}$/.test(entries[p]))||JSON.stringify(Object.keys(entries).sort())!==JSON.stringify(requiredFiles))throw Error('Reviewed '+kind+' source scope is incomplete or unexpected.');}
const allowedSources=new Map();for(const [kind,root]of [['production',config.productionRoot],['inventory',config.inventoryRoot]])for(const [p,h]of Object.entries(pins[kind]))allowedSources.set(resolve(root,p),h);
async function verifyPins(){for(const [path,h]of allowedSources){if(rawLstat(path).isSymbolicLink()||rawRealpath(path)!==path||sha(rawRead(path))!==h)throw Error('Pinned source changed: '+relative(config.productionRoot,path));}}
await verifyPins();
let networkAttempts=0,forbiddenFileReadAttempts=0;
const require=createRequire(import.meta.url),denyNetwork=()=>{networkAttempts++;throw Error('Network is forbidden in the manual in-memory gate.');};
for(const [module,names]of [['node:http',['request','get']],['node:https',['request','get']],['node:net',['connect','createConnection']],['node:tls',['connect']],['node:dgram',['createSocket']]])for(const name of names)require(module)[name]=denyNetwork;
globalThis.fetch=denyNetwork;
const checkFile=path=>{const p=resolve(path instanceof URL?fileURLToPath(path):String(path));if(allowedSources.has(p)){if(sha(rawRead(p))!==allowedSources.get(p))throw Error('Pinned source changed before read.');return;}const dep=relative(resolve(config.productionRoot,'node_modules'),p);if(dep&&!dep.startsWith('..')&&!isAbsolute(dep))return;forbiddenFileReadAttempts++;throw Error('Non-source file read is forbidden in this manual gate.');};
const oldAsync=fsp.readFile.bind(fsp),oldCallback=fs.readFile.bind(fs);fs.readFileSync=(p,...rest)=>{checkFile(p);return rawRead(p,...rest);};fsp.readFile=async(p,...rest)=>{checkFile(p);return oldAsync(p,...rest);};fs.readFile=(p,...rest)=>{checkFile(p);return oldCallback(p,...rest);};syncBuiltinESMExports();
for(let p=dirname(config.output);p.startsWith(resolve(config.productionRoot,'output'));p=dirname(p)){if(fs.existsSync(p)&&rawLstat(p).isSymbolicLink())throw Error('Output parent must not be a symlink.');if(p===resolve(config.productionRoot,'output'))break;}
process.chdir(config.productionRoot);


async function runAudit(){
// Load the selected production checkout after its full reviewed pin check.
const {pageEnvironment}=await import(pathToFileURL(resolve(config.productionRoot,'tests/helpers/pageDom.mjs')).href);
e=await pageEnvironment('main',{instantRoutes:['main'],instrument:'\nexport {openProductReceiptModal,renderInstantMain};'});
const p={id:'audit',date:'2026-07-01',recipeId:'r1',recipeName:'검증',target:'cat',category:'raw',status:'active',received:true,receivedRevision:1,receivedTotalPacks:100,receivedPlates:1,ingredientsSnapshot:[]};
e.state.rows.productions=[p];e.state.rows.recipes[0].packsPerPlate=100;
e.state.rows.closings.push({id:p.date,status:'closed'});
e.state.rows.productTransferRequests=[{id:'productions:audit:1',idempotencyKey:'productions:audit:1',sourceApp:'production',sourceCollection:'productions',sourceId:p.id,eventType:'productReceipt',revision:1,status:'pending',category:'raw',recipeId:'r1',recipeName:'검증',target:'cat',packs:100,boxes:5,remainderPacks:0,producedDate:p.date}];
await e.page.renderInstantMain();await e.page.openProductReceiptModal(p.id);e.fill('#pr_plates',2);await e.fire('#pr_confirm');
const ctx=vm.createContext({console,Date,Map,Set,Math,Number,Promise});
const mods=new Map();
function synthetic(id,exports){const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v);},{context:ctx,identifier:id});mods.set(id,m);return m;}
const root=resolve(config.inventoryRoot,'src');
async function source(id,path){const m=new vm.SourceTextModule(stripTypeScriptTypes(await readFile(root+'/'+path,'utf8')),{context:ctx,identifier:id});mods.set(id,m);return m;}
const types=await source('../../types/productReceipts','types/productReceipts.ts');await types.link(()=>{throw Error('Unexpected type import');});await types.evaluate();
const wrap=(ref,s)=>ref.path.startsWith('productTransferRequests/')&&s.exists()?{...s,data:()=>types.namespace.normalizeProductTransferRequest(s.id,s.data())}:s;
const api={...e.api,Timestamp:{fromMillis:n=>({toMillis:()=>n,toDate:()=>new Date(n)})},
  getDocs:async ref=>{const s=await e.api.getDocsFromServer(ref);const docs=s.docs.map(item=>ref.path==='productTransferRequests'?{...item,data:()=>types.namespace.normalizeProductTransferRequest(item.id,item.data())}:item);return {...s,docs,forEach:fn=>docs.forEach(fn)};},
  getDoc:async ref=>wrap(ref,await e.api.getDocFromServer(ref)),
  runTransaction:(_db,fn)=>e.api.runTransaction({},tx=>fn({...tx,get:async ref=>wrap(ref,await tx.get(ref))})),
};
synthetic('firebase/firestore',api);synthetic('../../lib/firebase',{db:{},auth:null,functions:{}});
// Load the real date helper module, but fail closed if this isolated audit
// ever attempts its server-call path. No Firebase Functions SDK is loaded.
synthetic('firebase/functions',{httpsCallable:()=>{throw Error('Server calls are forbidden in the receipt boundary audit');}});
synthetic('../../lib/date',{todayKstDateInput:()=> '2026-09-14'});
synthetic('./receiptCountCoverage',{loadReceiptCountCoverage:async()=>[],readReceiptCountCoverage:async()=>[],findReceiptAbsorbingCount:()=>null});
synthetic('../shipping/outboundSettlementScopeService',{readOutboundScopes:async()=>[],prepareOutboundScopeWrite:async()=>({protocol:{version:1,scopes:{}},write(){}}),retryOutboundScope:callback=>callback()});
synthetic('../../lib/firestore',{
  getProductReceiptDoc:id=>e.api.doc({},'productTransferRequests',id),
  productReceiptsCollection:()=>e.api.collection({},'productTransferRequests'),
  stockLotsCollection:()=>e.api.collection({},'stockLots'),stockMovementsCollection:()=>e.api.collection({},'stockMovements'),
});
for(const [id,path] of [['../../lib/units','lib/units.ts'],['../../types/bundleE','types/bundleE.ts'],['../../types/recipes','types/recipes.ts']])await source(id,path);
await source('./receiptWorkflowClient','features/productReceipts/receiptWorkflowClient.ts');
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
return report;
}

let e,report;
try{report=await runAudit();}finally{if(e)await e.cleanup();await verifyPins();}
if(networkAttempts||forbiddenFileReadAttempts)throw Error('Forbidden network/file access was attempted.');
const result={...report,sourcePinsSha256:config.expectedPinsSha256,pinnedProductionFiles:Object.keys(pins.production).length,pinnedInventoryFiles:Object.keys(pins.inventory).length,networkAttempts,forbiddenFileReadAttempts,credentialReads:0,operatingWrites:0,limitation:'Legacy cross-repo in-memory consumer audit. Actual source is loaded from both pinned roots; stock creation is captured at a synthetic helper boundary. Not equivalent to actual SDK/HTTP/provider verification.'};
await mkdir(dirname(config.output),{recursive:true});await writeFile(config.output,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result,null,2));
