import test from 'node:test';import assert from 'node:assert/strict';
import{supplyEvents,usageEvents,productionEvents}from'../src/services/statsLogic.js';
import{canonicalEvidence,resolveStatsCorrections}from'../src/services/statsCorrections.js';
const range={startDate:'2026-06-01',endDate:'2026-07-31',today:'2026-10-23'};
function fixture(){
 const row={id:'receipt',type:'incoming',date:'2026-06-24',qty:96000,bagTypeId:'bag',bagNameSnapshot:'봉투'};
 const schedule={id:'schedule',type:'bag',itemId:'bag',date:'2026-06-24',status:'completed',createdAt:new Date('2026-06-15T00:00:00+09:00'),completedAt:new Date('2026-06-24T00:00:00+09:00')};
 const ledger={id:'ledger',actionType:'scheduleComplete',actionId:'schedule',items:[{bagLogId:'receipt',delta:96000}]};
 const ev=(name,r)=>({path:name+'/'+r.id,expected:canonicalEvidence(r)});
 const correction={id:'decision',schemaVersion:1,status:'active',changesStock:false,source:'bagLogs/receipt',kind:'retainSupply',reason:'사용자 확인 실제 입고일',decisionBasis:'6/23에 96,000장 한 번 입고',receiptDate:'2026-06-23',scheduleSource:'schedules/schedule',ledgerSource:'stockLedger/ledger',evidence:[ev('bagLogs',row),ev('schedules',schedule),ev('stockLedger',ledger)]};
 return{bagLogs:[row],schedules:[schedule],stockLedger:[ledger],statsCorrections:[correction]};
}
test('confirmed date changes statistics only; registration-to-receipt uses actual date and planned interval stays intact',()=>{
 const d=fixture(),before=canonicalEvidence(d);const view=supplyEvents(d,range);assert.equal(view.events[0].date,'2026-06-23');assert.equal(view.events[0].qty,96000);assert.equal(view.registrations[0].date,'2026-06-23');assert.equal(view.registrations[0].processing,8);assert.equal(view.registrations[0].prior,9);assert.equal(d.bagLogs[0].date,'2026-06-24');assert.deepEqual(canonicalEvidence(d),before);
 assert.equal(supplyEvents(d,{...range,startDate:'2026-06-23',endDate:'2026-06-23'}).events.length,1);assert.equal(supplyEvents(d,{...range,startDate:'2026-06-24',endDate:'2026-06-24'}).events.length,0);
});
test('retained receipt can resolve an administratively cancelled schedule without changing its status',()=>{
 const d=fixture();d.schedules[0].status='cancelled';d.statsCorrections[0].evidence[1].expected.status='cancelled';const view=supplyEvents(d,range);assert.equal(view.registrations.length,1);assert.equal(view.registrations[0].processing,8);assert.equal(d.schedules[0].status,'cancelled');
});
test('invalid date, unsupported kind, missing evidence and mismatched ledger fail closed',()=>{
 for(const change of [c=>c.receiptDate='2026-02-30',c=>c.kind='excludeSupply',c=>c.evidence.pop(),c=>c.scheduleSource='schedules/other',c=>c.ledgerSource='stockLedger/other',c=>c.decisionBasis='']){const d=fixture();change(d.statsCorrections[0]);assert.throws(()=>resolveStatsCorrections(d));}
 const d=fixture();d.stockLedger[0].items[0].bagLogId='other';d.statsCorrections[0].evidence[2].expected=canonicalEvidence(d.stockLedger[0]);assert.throws(()=>resolveStatsCorrections(d),/원본 연결/);
});
test('a schedule cannot have two canonical physical receipts',()=>{
 const d=fixture();d.bagLogs.push({...d.bagLogs[0],id:'other'});const other=structuredClone(d.statsCorrections[0]);other.id='other-decision';other.source='bagLogs/other';other.evidence[0]={path:other.source,expected:canonicalEvidence(d.bagLogs[1])};d.stockLedger[0].items.push({bagLogId:'other',delta:96000});for(const c of[d.statsCorrections[0],other])c.evidence[2].expected=canonicalEvidence(d.stockLedger[0]);d.statsCorrections.push(other);assert.throws(()=>resolveStatsCorrections(d),/중복/);
});
test('production and consumption are unchanged by physical receipt-date confirmation',()=>{
 const d=fixture(),without={...d,statsCorrections:[]};assert.deepEqual(productionEvents(d,range),productionEvents(without,range));assert.deepEqual(usageEvents(d,range),usageEvents(without,range));
});
