import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTOMATION_SOURCES, weeklyOutlook, weeklySummary, weeklyOutlookText, addDays, confirmPayload, deliveryIdentity } from '../src/services/statsAutomation.js';
const today='2026-10-26';
function data(qty=38){const d=Object.fromEntries(AUTOMATION_SOURCES.map(k=>[k,[]]));d.eggStock=[{id:'global',currentQty:qty,minimumQty:140}];d.eggLogs=Array.from({length:6},(_,i)=>({id:'use'+i,type:'out',date:addDays(today,-i),qty:-150}));return d;}
test('compact outlook separates urgent, 2-week and third-week risk without changing aggregates',()=>{
  for(const [qty,section]of[[1,'urgent'],[130,'twoWeeks'],[180,'thirdWeek']]){const d=data(qty),copy=structuredClone(d),o=weeklyOutlook(d,today);assert.equal(o[section].length,1);assert.deepEqual(d,copy);}
  assert.equal(weeklyOutlook(data(220),today).thirdWeek.length,0);
  const summary=weeklySummary(data(1),today),item={kind:'weekly',key:summary.key,episode:1,title:'이번 주 입고·발주 확인',evidence:summary};
  assert.match(weeklyOutlookText(summary),/즉시 확인/);assert.doesNotMatch(weeklyOutlookText(summary),/\[생산\]/);
  assert.ok(confirmPayload(item,{uid:'a',name:'사무'},today,'id').statsWeeklyReport);
  assert.equal(deliveryIdentity(item,'a'),deliveryIdentity({...item,title:'다른 제목',evidence:{}},'a'));
});
test('timely receipt covers forecast, late receipt cannot hide earlier shortage, unknown units are never guessed',()=>{
  const d=data(10);d.schedules=[{id:'onTime',type:'egg',status:'scheduled',date:today,orderedQty:10,orderedUnit:'판'}];
  assert.equal(weeklyOutlook(d,today).urgent.length,0);
  d.schedules[0].date=addDays(today,3);assert.equal(weeklyOutlook(d,today).urgent.length,1);
  d.schedules[0].date=today;d.schedules[0].orderedUnit='박스';const o=weeklyOutlook(d,today);
  assert.equal(o.urgent.length,1);assert.equal(o.urgent[0].uncertainSchedule,true);
});
test('partial use and no recent samples stay unavailable, minimum remains separate and meaningful',()=>{
  const d=data(100);d.eggLogs=[];const o=weeklyOutlook(d,today);assert.equal(o.urgent.length,0);assert.deepEqual(o.unavailable,['계란']);assert.equal(o.minimum.length,1);
  assert.match(o.coverageNote,/전체 품목이 3주간 충분하다는 뜻은 아닙니다/);
});
test('current-week, third-week and overdue schedules preserve original count units and compatible totals',()=>{
  const d=data(500);d.schedules=[{id:'rabbit',type:'meat',itemId:'r',itemNameSnapshot:'토끼',status:'scheduled',date:'2026-11-11',orderedQty:100,orderedUnit:'마리',orderedUnitGrams:800},
    {id:'duck',type:'meat',status:'scheduled',date:today,orderedQty:60,orderedUnit:'kg'},
    {id:'old',type:'meat',status:'scheduled',date:'2026-10-25',orderedQty:10,orderedUnit:'kg'}];
  const o=weeklyOutlook(d,today);assert.equal(o.thisWeek.length,1);assert.equal(o.later[0].unit,'마리');assert.equal(o.later[0].amount,null);assert.equal(o.overdue.length,1);
});
