import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

const baselineRef='61af19a2d1e48f81877ab2f28fbe07774ebeca84';
const title='고양이 검증 큐브';
const fill=(e,values)=>Object.entries(values).forEach(([id,value])=>e.fill('#'+id,value));
const scenarios=[
 {route:'production',name:'create, change SKU and delete with net zero supplement deduction',exports:'showProductionForm',render:'renderProduction',collections:['productions','supplementStock','supplementLogs','activityLogs'],async run(e){
  await e.page.showProductionForm(null);fill(e,{pf_recipe:'r1'});await e.fire('#pf_recipe','change');fill(e,{pf_qty_select:1});await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
  assert.equal(e.state.rows.productions.length,1,e.alerts.join('\n'));
  assert.equal(e.state.rows.supplementStock[0].currentQty,19);
  const production=e.state.rows.productions[0];await e.page.showProductionForm(production);fill(e,{pf_qty_select:2});await e.fire('#pf_qty_select','change');await e.fire('#btnSaveProduction');
  assert.equal(e.state.rows.supplementStock[0].currentQty,20);assert.equal(e.state.rows.supplementStock[1].currentQty,19);
  await e.fire('.card-del');assert.equal(e.state.rows.productions[0].status,'deleted');
  assert.equal(e.state.rows.supplementStock[1].currentQty,20);
 }},
 {route:'frozenPan',name:'bread incoming',exports:'showBreadPanIncomingModal',render:'renderFrozenPan',collections:['breadPanLots','breadPanLogs'],async run(e){
  e.page.showBreadPanIncomingModal();fill(e,{m_recipe:title,m_qty:4.5,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveBreadPanIncoming');
 }},
 {route:'frozenPan',name:'FIFO order confirmation',exports:'confirmOrder',render:'renderFrozenPan',collections:['frozenPanLots','frozenPanStock','stockLedger','activityLogs'],async run(e){
  await e.page.confirmOrder(structuredClone(e.state.rows.frozenPanStock[0]),structuredClone(e.state.rows.frozenPanLots),'검증 담당자');
 }},
 {route:'frozenProduct',name:'receipt and bag deduction / transfer request',exports:'showIncomingModal',render:'renderFrozenProduct',collections:['bagTypes','bagLogs','frozenLogs','stockLedger','productTransferRequests','activityLogs'],async run(e){
  await e.page.showIncomingModal(e.state.rows.frozenProducts[0]);fill(e,{m_qty:4,m_date:e.today,m_expiry:'2027-09-14',m_staff:'검증 담당자'});await e.fire('#btnSaveIncoming');
 }},
 {route:'meat',name:'raw meat incoming',exports:'showAddFrozenModal',render:'renderMeat',collections:['meatStocks','meatLogs','activityLogs'],async run(e){
  e.page.showAddFrozenModal();fill(e,{m_meatType:'m1',m_weight:2,m_unit:'kg',m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveFrozen');
 }},
 {route:'meat',name:'manual remaining adjustment',exports:'showAdjustModal',render:'renderMeat',collections:['meatStocks','meatLogs','activityLogs'],async run(e){
  e.page.showAdjustModal('ms1','닭',10000);fill(e,{m_actualRemaining:9000,m_adjustReason:'검증 사유',m_staff:'검증 담당자'});await e.fire('#btnSaveAdjust');
 }},
 {route:'meat',name:'processed meat FIFO and repacking',exports:'showAddProcessedModal,showAddRepackedModal',render:'renderMeat',collections:['meatStocks','meatLogs','activityLogs'],async run(e){
  e.page.showAddProcessedModal();fill(e,{m_meatType:'m1',m_unitWeight:1000,m_count:3,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveProcessed');
  await e.page.renderMeat();await new Promise(r=>setTimeout(r,0));
  e.page.showAddRepackedModal();fill(e,{m_meatType:'m1',m_unitWeight:500,m_count:4,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveRepacked');
  assert.equal(e.state.rows.meatStocks.find(s=>s.id==='ms1').remaining,7000);
  assert.equal(e.state.rows.meatStocks.find(s=>s.stage==='processed').remaining,1000);
  assert.equal(e.state.rows.meatStocks.find(s=>s.stage==='repacked').remaining,2000);
 }},
 {route:'frozenSep',name:'fractional separation',exports:'showSeparateModal',render:'renderFrozenSep',collections:['frozenSeparation','frozenSeparationLogs','activityLogs'],seed(e){e.state.rows.frozenSeparation=[{id:'sep1',date:e.today,productName:title,stockType:'notSeparated',remaining:4,initialQty:4,closed:false}];},async run(e){
  e.page.showSeparateModal(structuredClone(e.state.rows.frozenSeparation));fill(e,{m_product:title,m_qty:0.25,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveSeparate');
 }},
 {route:'frozenSep',name:'fractional outbound',exports:'showOutModal',render:'renderFrozenSep',collections:['frozenSeparation','frozenSeparationLogs','activityLogs'],seed(e){e.state.rows.frozenSeparation=[{id:'sep1',date:e.today,productName:title,stockType:'separated',remaining:4,initialQty:4,closed:false}];},async run(e){
  e.page.showOutModal(structuredClone(e.state.rows.frozenSeparation));fill(e,{m_product:title,m_qty:0.25,m_date:e.today,m_staff:'검증 담당자'});await e.fire('#btnSaveOut');
 }},
 {route:'freezeOp',name:'cancellation stock restoration',exports:'cancelOrder',render:'renderFreezeOp',collections:['frozenPanLots','freezeOrders'],seed(e){e.state.rows.freezeOrders=[{id:'fo1',date:e.today,status:'active',deductions:[{lotId:'lot1',amount:3}],items:[]}];},async run(e){await e.page.cancelOrder(e.state.rows.freezeOrders[0]);}},
];
for(const scenario of scenarios)test(`${scenario.route}: ${scenario.name} matches the deployed business payload`,async()=>{
 const results=[];
 for(const baseline of [true,false]){
  const e=await pageEnvironment(scenario.route,{baselineRef:baseline?baselineRef:undefined,instrument:`\nexport {${scenario.exports}};`});
  try{
   scenario.seed?.(e);await e.page[scenario.render]();await new Promise(r=>setTimeout(r,0));
   await scenario.run(e);assert.ok(e.state.commits.length>0,e.alerts.join('\n'));
   results.push(JSON.parse(JSON.stringify(Object.fromEntries(scenario.collections.map(c=>[c,e.state.rows[c]||[]])))));
  }finally{await e.cleanup();}
 }
 assert.deepEqual(results[1],results[0]);
});
