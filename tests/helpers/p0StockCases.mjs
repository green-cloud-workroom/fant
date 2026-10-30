import assert from 'node:assert/strict';
import {pageEnvironment} from './pageDom.mjs';
export const title='고양이 검증 큐브';
const methods={meat:'showAddProcessedModal,showAddRepackedModal',frozenPan:'showTenderInModal,showWorkRowModal,confirmOrder',frozenSep:'showSeparateModal,showOutModal'};
export const cases=[
 {name:'meat preprocess',route:'meat',source:'meatStocks',sourceId:'ms1',before:10000,used:6000,button:'#btnSaveProcessed',newStage:'processed',output:6000,
  async open(e){e.page.showAddProcessedModal();fill(e,{m_meatType:'m1',m_unitWeight:1000,m_count:6});}},
 {name:'meat repack',route:'meat',source:'meatStocks',sourceId:'processed',before:10000,used:4000,button:'#btnSaveRepacked',newStage:'repacked',output:4000,
  seed(e){e.state.rows.meatStocks=[{id:'processed',stage:'processed',meatTypeId:'m1',remaining:10000,closed:false,incomingDate:e.today,processedDate:e.today}];},
  async open(e){e.page.showAddRepackedModal();fill(e,{m_meatType:'m1',m_unitWeight:1000,m_count:4});}},
 {name:'tender receipt',route:'frozenPan',source:null,output:6,button:'#btnSaveTenderIn',
  seed(e){e.state.rows.recipes[1].requiresSeparation=false;},
  async open(e){e.page.showTenderInModal();fill(e,{m_recipe:title,m_qty:6});}},
 {name:'bread to frozen',route:'frozenPan',source:'breadPanLots',sourceId:'bread',before:10,used:6,output:3,button:'#btnSaveWorkRow',
  seed(e){e.state.rows.breadPanLots=[{id:'bread',productName:title,remaining:10,closed:false,date:e.today}];},
  async open(e){await e.page.showWorkRowModal([],[]);e.fill('.wi-name',title);e.fill('.wi-bread',6);e.fill('.wi-actual',3);}},
 {name:'frozen order',route:'frozenPan',source:'frozenPanLots',sourceId:'lot1',before:10,used:6,output:0,
  seed(e){e.state.rows.frozenPanStock[0].items[0].orderPanQty=6;},
  async open(){},async run(e){await e.page.confirmOrder(structuredClone(e.state.rows.frozenPanStock[0]),structuredClone(e.state.rows.frozenPanLots),'검증 담당자');}},
 {name:'separation',route:'frozenSep',source:'frozenSeparation',sourceId:'sep',before:10,used:6,output:6,button:'#btnSaveSeparate',
  seed(e){e.state.rows.frozenSeparation=[{id:'sep',productName:title,stockType:'notSeparated',remaining:10,closed:false,date:e.today}];},
  async open(e){e.page.showSeparateModal(structuredClone(e.state.rows.frozenSeparation));fill(e,{m_product:title,m_qty:6});}},
 {name:'separation out',route:'frozenSep',source:'frozenSeparation',sourceId:'sep',before:10,used:6,output:0,button:'#btnSaveOut',
  seed(e){e.state.rows.frozenSeparation=[{id:'sep',productName:title,stockType:'separated',remaining:10,closed:false,date:e.today}];},
  async open(e){e.page.showOutModal(structuredClone(e.state.rows.frozenSeparation));fill(e,{m_product:title,m_qty:6});}},
];
function fill(e,values){for(const [key,value] of Object.entries(values))e.fill('#'+key,value);}
export async function setupCase(spec,options={}){
 const e=await pageEnvironment(spec.route,{instrument:`\nexport {${methods[spec.route]}};`,...options});
 spec.seed?.(e);await e.page[{meat:'renderMeat',frozenPan:'renderFrozenPan',frozenSep:'renderFrozenSep'}[spec.route]]();
 await spec.open(e);
 if(spec.button)fill(e,{m_date:e.today,m_staff:'검증 담당자'});
 return e;
}
export async function runCase(e,spec){if(spec.run)await spec.run(e);else await e.fire(spec.button);}
export function verifyCase(e,spec){
 const ledgers=e.state.rows.stockLedger||[];assert.equal(ledgers.length,1,e.alerts.join('\n'));
 const ledger=ledgers[0];assert.ok(ledger.operationId);assert.ok(ledger.requestFingerprint);
 if(spec.source){assert.equal(e.state.rows[spec.source].find(s=>s.id===spec.sourceId).remaining,spec.before-spec.used);}
 for(const item of ledger.items){assert.ok(Math.abs(item.before+item.delta-item.after)<1e-6);assert.ok(item.after>=0);}
 const logs=['meatLogs','breadPanLogs','frozenPanLogs','frozenSeparationLogs'].flatMap(c=>e.state.rows[c]||[]);
 assert.ok(logs.length>0);for(const log of logs){assert.equal(log.ledgerId,ledger.id);assert.equal(log.operationId,ledger.operationId);}
 if(spec.output){
  const name=spec.route==='meat'?'meatStocks':spec.route==='frozenSep'?'frozenSeparation':'frozenPanLots';
  const created=e.state.rows[name].filter(s=>s.operationId===ledger.operationId);
  assert.equal(created.length,1);assert.equal(created[0].remaining,spec.output);
 }
 if(spec.name==='frozen order')assert.equal(e.state.rows.frozenPanStock[0].status,'confirmed');
 assert.equal(e.state.commits.length,1,'all stock, logs, ledger and activity use one commit');
}
