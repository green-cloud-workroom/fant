import test from 'node:test';
import assert from 'node:assert/strict';
import { environment } from './helpers/modules.mjs';

test('closing: shared refresh performs one read per query, preserves all 14 dates', async()=>{
  const env=await environment();const api=await env.load('src/services/closingChecks.js');
  const {createReadScope}=await env.load('src/services/readScope.js');const scope=createReadScope();
  const result=await Promise.all(Array.from({length:3},()=>api.findActionableClosingDate(env.today,null,scope)));
  assert.deepEqual(result,[null,null,null]);
  assert.equal(env.state.reads.filter(r=>r.kind==='query'&&r.path==='productions').length,1);
  assert.equal(env.state.reads.filter(r=>r.kind==='query'&&r.path==='activityLogs').length,14);
  assert.ok(env.state.reads.length<=41,`reads: ${env.state.reads.length}`);
});

for(const scenario of ['schedule','receipt','egg','productionLog','officeLog','autoRepack','frozenOrder','unclosed'])test('closing preserves '+scenario,async()=>{
  const env=await environment();const date=env.dates[5];
  if(scenario==='schedule')env.state.rows.schedules.push({id:'pending',date,status:'scheduled'});
  if(scenario==='receipt')env.state.rows.productions[5].received=false;
  if(scenario==='egg')env.state.rows.productions[5].ingredientsSnapshot=[{name:'노른자'}];
  if(scenario==='unclosed')env.state.rows.closings[5].status='released';
  if(scenario==='frozenOrder')env.state.rows.frozenPanStock=[{id:'order',date,type:'order',status:'pending'}];
  const logActions={productionLog:['production','add'],officeLog:['egg','out'],autoRepack:['autoRepack','trigger']};
  if(logActions[scenario]){const [action,subAction]=logActions[scenario];env.state.rows.activityLogs.push({id:'unread',date,action,subAction,acknowledged:false});}
  const api=await env.load('src/services/closingChecks.js');const result=await api.findActionableClosingDate(env.today);
  assert.equal(result.date,date);assert.equal(result.closed,scenario!=='unclosed');
  assert.equal(result.blockingData.totalBlocked,scenario==='unclosed'?0:1);
});

test('closing keeps earliest result despite a later candidate read failure',async()=>{
  const env=await environment();env.state.rows.productions[0].received=false;env.state.failures.add('closings/'+env.dates[10]);
  const api=await env.load('src/services/closingChecks.js');assert.equal((await api.findActionableClosingDate(env.today)).date,env.dates[0]);
});

test('closing fails when an earlier date cannot be checked',async()=>{
  const env=await environment();env.state.failures.add('closings/'+env.dates[0]);
  const api=await env.load('src/services/closingChecks.js');await assert.rejects(()=>api.findActionableClosingDate(env.today),/fixture read failed/);
});

test('fresh action sees writes instead of reusing screen snapshot',async()=>{
  const env=await environment();const api=await env.load('src/services/closingChecks.js');
  assert.equal(await api.findActionableClosingDate(env.today),null);
  env.state.rows.productions[3].received=false;
  assert.equal((await api.findActionableClosingDate(env.today)).date,env.dates[3]);
});

test('failed reads are evicted from refresh scope',async()=>{
  const env=await environment();const {createReadScope}=await env.load('src/services/readScope.js');const scope=createReadScope();
  const ref=env.api.collection({},'recipes');env.state.failures.add('recipes');
  await assert.rejects(()=>scope.getDocs(ref));env.state.failures.clear();assert.equal((await scope.getDocs(ref)).size,1);
});

test('existing 80 alerts require no individual document reads or writes',async()=>{
  const env=await environment();const {createAutoLogBatch}=await env.load('src/services/autoLogs.js');
  const batch=createAutoLogBatch(env.state.rows.activityLogs);
  for(let i=0;i<80;i++)batch.enqueue({action:'minStock',subAction:'alert',date:env.today,dedupKey:'supplementMin:alert:s'+i});
  assert.equal(await batch.flush(),false);assert.equal(env.state.reads.length,0);assert.equal(env.state.writes.length,0);
});

test('new alerts are deduplicated, bounded to 4 concurrent transactions, and never overwrite acknowledgement',async()=>{
  const env=await environment({latencyMs:2});const {createAutoLogBatch}=await env.load('src/services/autoLogs.js');
  const batch=createAutoLogBatch([]);
  for(let i=0;i<12;i++){const log={action:'minStock',subAction:'alert',date:env.today,dedupKey:'new'+i,message:'test'};batch.enqueue(log);batch.enqueue(log);}
  env.state.rows.activityLogs.push({id:`auto_minStock_alert_${env.today}_new0`,date:env.today,acknowledged:true,acknowledgedBy:'other-tab'});
  assert.equal(await batch.flush(),true);assert.equal(env.state.transactions,12);assert.equal(env.state.writes.length,11);
  assert.ok(env.state.peakTransactions<=4);assert.equal(env.state.rows.activityLogs.find(r=>r.id.endsWith('_new0')).acknowledgedBy,'other-tab');
});

test('main retains production/calendar/log contents with under 65 reads and no existing-alert writes',async()=>{
  const env=await environment();const api=await env.load('src/pages/main.js');
  assert.equal(await api.loadAllData(),true);const state=api.testState();
  assert.equal(state.productions.length,1);assert.equal(state.productions[0].date,env.today);
  assert.equal(state.calendarProductions.length,1);assert.equal(state.combinedLogs.length,80);
  assert.equal(state.blockingData.totalBlocked,1);assert.equal(state.overdueClosingDate,null);
  assert.equal(env.state.writes.length,0);assert.ok(env.state.reads.length<65,`reads: ${env.state.reads.length}`);
});

test('main does not install stale state after navigating away',async()=>{
  const env=await environment({latencyMs:5});const api=await env.load('src/pages/main.js');
  const pending=api.loadAllData();env.nodes.mainContent={isConnected:true,innerHTML:'other page'};
  assert.equal(await pending,false);assert.equal(api.testState().productions.length,0);assert.equal(env.state.writes.length,0);
});

test('main includes equipment due/stock alerts and reloads newly created logs',async()=>{
  const env=await environment();env.state.rows.equipmentParts.push({id:'part1',sortOrder:0,active:true,name:'검증 부품',nextDueAt:'2026-09-13',minimumQty:2,currentQty:0});
  const api=await env.load('src/pages/main.js');await api.loadAllData();
  assert.equal(api.testState().equipmentAlerts.length,2);assert.equal(api.testState().combinedLogs.length,82);
  assert.equal(env.state.writes.length,2);
  await api.loadAllData();assert.equal(env.state.writes.length,2);
});

test('closing flag overrides and soft-deleted production are preserved',async()=>{
  const env=await environment();env.state.rows.productions[4].received=false;env.state.rows.productions[4].status='deleted';
  env.state.rows.productions[7].received=false;
  env.state.rows.settings.push({id:'closingFlags',blockProductReceipt:false});
  const api=await env.load('src/services/closingChecks.js');assert.equal(await api.findActionableClosingDate(env.today),null);
});

test('production reads selected date only, preserving card order and deleted/missing-order exclusions',async()=>{
  const env=await environment();env.state.rows.productions=[
    {id:'b',date:env.today,sortOrder:2},{id:'a',date:env.today,sortOrder:1},
    {id:'c',date:env.today,sortOrder:2},{id:'deleted',date:env.today,sortOrder:0,status:'deleted'},
    {id:'missing',date:env.today},{id:'other-day',date:env.dates[0],sortOrder:0},
  ];
  const api=await env.load('src/pages/production.js');const rows=await api.loadProductions(env.today);
  assert.deepEqual(Array.from(rows,r=>r.id),['a','b','c']);
  assert.deepEqual(env.state.reads[0].conditions,[{type:'where',field:'date',op:'==',value:env.today}]);
});
