import test from 'node:test';
import assert from 'node:assert/strict';
import {supplyEvents,usageEvents} from '../src/services/statsLogic.js';
import {manualMovementIndex} from '../src/services/manualMovementLogic.js';
const range={startDate:'2026-10-01',endDate:'2026-10-23',today:'2026-10-23'};
const metadata=(kind,n,extra={})=>({version:1,kind,enteredAmount:n,changesStock:kind!=='test',reason:'검증 사유',...extra});
const source={id:'original',type:'incoming',date:'2026-10-01',bagTypeId:'bag',bagNameSnapshot:'봉투',qty:100};
const cancel={id:'cancel_v1_original',type:'adjust',date:'2026-10-23',bagTypeId:'bag',qty:-100,before:200,after:100,manualMovement:metadata('cancel',-100,{cancelOf:'original',originalKind:'receipt'})};
test('receipt cancellation removes the selected original from amount and interval samples only',()=>{
 const good={...source,id:'good',qty:30,date:'2026-10-10'};
 const original=JSON.stringify(source);const view=supplyEvents({bagLogs:[source,good,cancel]},range);
 assert.equal(view.events.length,1);assert.equal(view.events[0].qty,30);assert.equal(JSON.stringify(source),original);
});
test('usage reversal is signed on its own date; reconciliation and test are never usage or receipts',()=>{
 const usage={...source,id:'use',type:'adjust',qty:-10,manualMovement:metadata('usage',-10)};
 const reversal={...cancel,id:'cancel_v1_use',qty:10,before:100,after:110,manualMovement:metadata('cancel',10,{cancelOf:'use',originalKind:'usage'})};
 const count={...source,id:'count',qty:500,type:'adjust',manualMovement:metadata('reconciliation',500)};
 const demo={...source,id:'demo',qty:0,before:1,after:1,manualMovement:metadata('test',999)};
 const data={bagLogs:[usage,reversal,count,demo]};const view=usageEvents(data,range);
 assert.deepEqual(view.events.map(e=>e.qty),[10,-10]);assert.equal(supplyEvents(data,range).events.length,0);
 assert.equal(usageEvents(data,{...range,startDate:'2026-10-23'}).events[0].qty,-10);
 assert.equal(view.classifications.filter(c=>['test','stockReconciliation'].includes(c.classification)).length,2);
});
test('a forged or duplicated cancellation fails closed',()=>{
 for(const patch of [{qty:-99},{bagTypeId:'other'},{manualMovement:{...cancel.manualMovement,cancelOf:'missing'}}])assert.throws(()=>manualMovementIndex({bagLogs:[source,{...cancel,...patch}]}),/취소/);
 assert.throws(()=>manualMovementIndex({bagLogs:[source,cancel,cancel]}),/중복/);
});
test('legacy receipts retain their existing results without new metadata',()=>{
 const original=supplyEvents({bagLogs:[source]},range);assert.equal(original.events[0].qty,100);
 const unknown={...source,id:'old-adjust',type:'adjust',qty:-3};assert.equal(usageEvents({bagLogs:[unknown]},range).events.length,0);
});
