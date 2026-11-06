import test from 'node:test';
import assert from 'node:assert/strict';
import {stockAlertCatalog,stockAlertModel,isStockAlert} from '../src/domain/stockAlerts.js';
import {pageEnvironment} from './helpers/pageDom.mjs';
const item=(current=4)=>({key:'bag:b',kind:'bag',itemId:'b',name:'고양이 덕포켓',current,minimum:10,unit:'장',route:'bag',schedules:[],status:current>=10?'normal':current<=0?'empty':'low'});
const rows=model=>model.plans.map(p=>({...p,id:p.eventId}));
test('one shortage persists across days and acknowledgement, with no daily duplicate',()=>{
 const first=stockAlertModel([item()],[],'2026-11-05'),history=rows(first);assert.equal(history.length,1);
 for(const day of ['2026-11-06','2027-01-01'])assert.equal(stockAlertModel([item(3)],history,day).plans.length,0);
 history[0].acknowledged=true;const next=stockAlertModel([item(2)],history,'2027-01-02');assert.equal(next.items[0].unseen,false);assert.equal(next.items.length,1);
});
test('zero stock alerts once; recovery and later shortage start a new event',()=>{
 let history=rows(stockAlertModel([item()],[],'2026-11-05'));history[0].acknowledged=true;
 const zero=stockAlertModel([item(0)],history,'2026-11-06');assert.equal(zero.items[0].unseen,true);assert.equal(zero.plans.length,1);history.push(...rows(zero));
 assert.equal(stockAlertModel([item(0)],history,'2026-11-07').plans.length,0);
 const normal=stockAlertModel([item(10)],history,'2026-11-07');assert.equal(normal.items.length,0);assert.equal(normal.plans[0].acknowledged,true);history.push(...rows(normal));
 const again=stockAlertModel([item(4)],history,'2026-11-08');assert.equal(again.plans.length,1);assert.notEqual(again.items[0].eventId,history[0].id);
});
test('legacy daily duplicates including old dates use the latest review status without deleting history',()=>{
 const history=Array.from({length:20},(_,i)=>({id:'old'+i,date:'2025-01-'+String(i+1).padStart(2,'0'),action:'minStock',subAction:'alert',acknowledged:i===19,details:{kind:'bag',bagTypeId:'b',current:4}}));
 const before=JSON.stringify(history),model=stockAlertModel([item()],history,'2026-11-06');assert.equal(model.items.length,1);assert.equal(model.plans.length,0);assert.equal(model.items[0].unseen,false);assert.equal(JSON.stringify(history),before);
});
test('names do not merge distinct products; unreadable quantities do not resolve previous warnings',()=>{
 const model=stockAlertModel([item(),{...item(),key:'bag:other',itemId:'other'}],[],'2026-11-06');assert.equal(model.items.length,2);
 const bad=stockAlertModel([{...item(),current:null,status:'unknown'}],rows(model),'2026-11-07');assert.equal(bad.unknown.length,1);assert.equal(bad.plans.filter(p=>p.details.stockAlert.key==='bag:b').length,0);
});
test('only minimum stock alerts are grouped; operational warnings retain their meaning',()=>{
 for(const action of ['autoRepack','frozenStockLow','scheduleDue','partDue','closing'])assert.equal(isStockAlert({action,subAction:'alert'}),false);
 assert.equal(isStockAlert({action:'minStock',subAction:'alert'}),true);
});
test('stock thresholds and units match current inventory criteria; source numbers are untouched',()=>{
 const data={eggStock:{currentQty:4,minimumQty:10},meatTypes:[{id:'m',name:'닭',minimumQtyG:10000}],meatStocks:[{meatTypeId:'m',remaining:4000},{meatTypeId:'m',remaining:90000,closed:true}],bagTypes:[{id:'b',currentQty:4,minimumQty:10}],supplementTypes:[{id:'s',name:'영양제',active:true},{id:'off',active:false}],supplementStock:[{id:'s',currentQty:4}],equipmentParts:[{id:'p',name:'필터',currentQty:4,minimumQty:10,active:true}],schedules:[{type:'bag',itemId:'b',status:'scheduled',date:'2026-11-08',orderedQty:30,orderedUnit:'장'}]};
 const before=JSON.stringify(data),catalog=stockAlertCatalog(data);assert.equal(catalog.length,5);assert.equal(catalog.find(i=>i.kind==='meat').current,4);assert.equal(catalog.find(i=>i.kind==='meat').unit,'kg');assert.equal(catalog.find(i=>i.kind==='supplement').minimum,5);assert.equal(catalog.find(i=>i.kind==='bag').schedules.length,1);assert.equal(JSON.stringify(data),before);
});
async function setup(){const e=await pageEnvironment('main',{instrument:'\nexport {renderLogSection};'});e.state.rows.bagTypes[0].currentQty=4;e.state.rows.bagTypes[0].minimumQty=10;return e;}
test('shared state survives refresh and bulk review touches only the shown stock alert',async()=>{
 const e=await setup();try{const api=await e.load('src/services/stockAlerts.js'),stock=JSON.stringify(e.state.rows.bagTypes);e.state.rows.activityLogs.push({id:'mandatory',action:'autoRepack',subAction:'trigger',date:e.today,acknowledged:false,message:'재포장 확인'});
 const first=await api.syncStockAlerts();assert.equal(first.items.length,1);const count=e.state.writes.length;await api.syncStockAlerts();assert.equal(e.state.writes.length,count);
 await api.acknowledgeStockAlerts(first.items,'담당');const next=await api.syncStockAlerts();assert.equal(next.items[0].unseen,false);assert.equal(e.state.rows.activityLogs.find(l=>l.id==='mandatory').acknowledged,false);assert.equal(JSON.stringify(e.state.rows.bagTypes),stock);assert.ok(e.state.writes.every(p=>p.startsWith('activityLogs/')));
 }finally{await e.cleanup()}
});
test('changed quantity/zero while dialog is open cannot be silently acknowledged',async()=>{
 const e=await setup();try{const api=await e.load('src/services/stockAlerts.js'),first=await api.syncStockAlerts();e.state.rows.bagTypes[0].currentQty=0;await assert.rejects(()=>api.acknowledgeStockAlerts(first.items,'담당'),/바뀌어/);const next=await api.loadStockAlerts();assert.equal(next.items[0].unseen,true);assert.notEqual(next.items[0].eventId,first.items[0].eventId);
 }finally{await e.cleanup()}
});
test('a failed stock read does not publish recovery or write anything',async()=>{
 const e=await setup();try{const api=await e.load('src/services/stockAlerts.js');await api.syncStockAlerts();const count=e.state.writes.length;e.state.failures.add('bagTypes');await assert.rejects(()=>api.syncStockAlerts());assert.equal(e.state.writes.length,count);
 }finally{await e.cleanup()}
});
test('obsolete view cannot acknowledge and existing confirmation is never overwritten by a repeated flush',async()=>{
 const e=await setup();try{const api=await e.load('src/services/stockAlerts.js'),first=await api.syncStockAlerts();await assert.rejects(()=>api.acknowledgeStockAlerts(first.items,'담당',()=>false),/화면/);
 const {createAutoLogBatch}=await e.load('src/services/autoLogs.js'),batch=createAutoLogBatch([]),record=e.state.rows.activityLogs.find(r=>r.id===first.items[0].eventId);record.acknowledged=true;batch.enqueue({...record,eventId:record.id,acknowledged:false});await batch.flush();assert.equal(record.acknowledged,true);
 }finally{await e.cleanup()}
});
test('main hides repeated shortage rows but keeps processing alerts and stock modal escapes names',async()=>{
 const e=await setup();try{e.state.rows.bagTypes[0].name='<img src=x onerror=bad()> 덕포켓';e.state.rows.activityLogs.push({id:'mandatory',action:'autoRepack',subAction:'trigger',date:e.today,acknowledged:false,message:'재포장 확인'});await e.page.loadAllData();
 const html=e.page.renderLogSection('production');assert.ok(html.includes('재포장 확인'));assert.ok(!html.includes('덕포켓'));
 const view=await e.load('src/utils/stockAlertsView.js');await view.openStockAlerts();const modal=e.document.getElementById('stockAlertsOverlay');assert.ok(modal.textContent.includes('덕포켓'));assert.equal(modal.querySelectorAll('img').length,0);assert.ok(modal.textContent.includes('6장'));assert.equal(modal.querySelectorAll('[data-stock-ack]:not([data-stock-ack=all])').length,1);
 await modal.querySelector('[data-stock-ack=all]').onclick();assert.ok(modal.textContent.includes('확인 완료'));assert.equal(e.state.rows.activityLogs.find(r=>r.id==='mandatory').acknowledged,false);
 }finally{await e.cleanup()}
});

test('concurrent shortage observers share one event; silent recovery never becomes an acknowledgement task',async()=>{
 const e=await setup();try{const api=await e.load('src/services/stockAlerts.js');
 const [a,b]=await Promise.all([api.syncStockAlerts(),api.syncStockAlerts()]);
 assert.equal(a.items[0].eventId,b.items[0].eventId);assert.equal(e.state.rows.activityLogs.filter(isStockAlert).length,1);
 e.state.rows.bagTypes[0].currentQty=10;const recovered=await api.syncStockAlerts();assert.equal(recovered.items.length,0);
 const history=e.state.rows.activityLogs.filter(isStockAlert);assert.equal(history.length,2);assert.equal(history[1].acknowledged,true);
 const {createAutoLogBatch}=await e.load('src/services/autoLogs.js'),batch=createAutoLogBatch([]);
 batch.enqueue({...history[1],eventId:history[1].id});assert.deepEqual([...batch.pendingIds()],[]);
 }finally{await e.cleanup()}
});

test('new event details retain item identities and original meat gram units',()=>{
 const meat={...item(4),key:'meat:m',kind:'meat',itemId:'m',unit:'kg'};
 const plan=stockAlertModel([meat],[],'2026-11-06').plans[0];
 assert.equal(plan.details.meatTypeId,'m');assert.equal(plan.details.current,4000);assert.equal(plan.details.minimum,10000);assert.equal(plan.details.unit,'g');assert.match(plan.message,/현재 4kg/);
});
