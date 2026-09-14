import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers/modules.mjs';

async function setup(){
  const e=await environment({session:true,instrument:{'src/pages/stats.js':'\nexport {loadStatsTab};export function setPeriodForTest(a,b){startDate=a;endDate=b;}'}});
  e.synthetic('chart.js',{Chart:class {static register(){}},registerables:[]});
  const stats=await e.load('src/pages/stats.js');stats.setPeriodForTest('2026-09-01','2026-09-30');
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.nodes.mainContent,'stats');
  return {...e,stats,resource:(await e.load('src/state/pageResources.js')).pageResource('stats')};
}
test('all six statistical tabs preserve the fresh-server data with retained reads',async()=>{
  const e=await setup(),server=(await e.load('src/services/serverReadScope.js')).createServerReadScope();
  for(const tab of ['production','meat','bag','egg','daily','supplement']){
    const expected=await e.stats.loadStatsTab(tab,server);
    const actual=await e.resource.load(scope=>e.stats.loadStatsTab(tab,scope),{force:true});
    assert.equal(JSON.stringify(actual),JSON.stringify(expected),tab);
    const before=e.state.reads.length;
    for(let i=0;i<20;i++)await e.resource.load(scope=>e.stats.loadStatsTab(tab,scope));
    assert.equal(e.state.reads.length,before,tab+' warm reads');
  }
});
test('switching date ranges releases old statistical queries and rejects a late result',async()=>{
  const e=await setup();
  for(let i=0;i<100;i++){e.stats.setPeriodForTest('2026-09-'+String(i%28+1).padStart(2,'0'),'2026-09-30');await e.resource.load(scope=>e.stats.loadStatsTab('production',scope),{force:true});}
  assert.equal((await e.load('src/state/displayReads.js')).displayPool.inspect().listeners,1);
});
