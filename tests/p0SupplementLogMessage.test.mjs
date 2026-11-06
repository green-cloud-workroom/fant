import test from 'node:test';
import assert from 'node:assert/strict';
import {displaySupplementLogMessage} from '../src/utils/activityLogMessage.js';
import {pageEnvironment} from './helpers/pageDom.mjs';

const id='nuMVoH4tECvr0Au7uddK_2';
const name='고양이 치킨 2용 영양제';
const legacy=()=>({id:'legacy',date:'2026-09-14',action:'supplementStock',subAction:'incoming',message:`실제 입고 — ${id} 2 / 재고없음`,details:{supplementTypeId:id},acknowledged:true});

test('legacy supplement ID is replaced only for an exact known token without mutating the log',()=>{
  const log=legacy(),before=JSON.stringify(log);
  assert.equal(displaySupplementLogMessage(log,[{id,name}]),`실제 입고 — ${name} 2 / 재고없음`);
  assert.equal(JSON.stringify(log),before);
  for(const row of [[],[{id,name:''}],[{id,name:'   '}]])assert.equal(displaySupplementLogMessage(log,row),log.message);
  assert.equal(displaySupplementLogMessage({...log,action:'other',details:{}},[{id,name}]),log.message);
  assert.equal(displaySupplementLogMessage({...log,message:`${id}0 prefix_${id}`},[{id,name}]),`${id}0 prefix_${id}`);
  assert.equal(displaySupplementLogMessage({...log,message:`실제 입고 — ${name} 2 / 재고없음`},[{id,name:'변경된 이름'}]),`실제 입고 — ${name} 2 / 재고없음`);
  assert.equal(displaySupplementLogMessage({message:'봉투 입고',details:{bagTypeId:id}},[{id,name}]),'봉투 입고');
});

test('manual movement logs without supplementTypeId resolve all independent loaded IDs for either supplement marker',()=>{
  const secondId='other_2.5',secondName='다른 영양제 $&';
  const types=[{id,name:`이름에 ${secondId} 포함`},{id:secondId,name:secondName},{id:'empty_2',name:' '}];
  for(const marker of [{action:'supplementStock'},{action:'other',details:{sourceCollection:'supplementLogs'}}]) {
    const log={...legacy(),...marker,details:{app:'production',sourceCollection:'supplementLogs',sourceLogId:'old-log',manualMovement:{kind:'receipt'},delta:2,before:0,after:2,...marker.details}};
    if(!marker.details)delete log.details.sourceCollection;
    const before=JSON.stringify(log);
    assert.equal(displaySupplementLogMessage(log,[{id,name}]),`실제 입고 — ${name} 2 / 재고없음`);
    assert.equal(displaySupplementLogMessage({...log,message:`${id} / ${secondId} / ${id} / empty_2`},types),`${types[0].name} / ${secondName} / ${types[0].name} / empty_2`);
    for(const message of [`prefix_${id} ${id}0 -${id} ${id}_suffix`, '알 수 없는 영양제 missing_2']) {
      assert.equal(displaySupplementLogMessage({...log,message},types),message);
    }
    assert.equal(displaySupplementLogMessage(log,[]),log.message);
    assert.equal(JSON.stringify(log),before);
  }
});

for(const instant of [false,true])test(`main panels and modal share loaded names and escape text, instant=${instant}`,async()=>{
  const e=await pageEnvironment('main',{instantRoutes:instant?['main']:[],instrument:'\nexport {renderLogRow,renderModalLogRow,getDisplayLogMessage,autoLogCoordinator};'});
  try {
    e.context.MutationObserver=class {observe(){} disconnect(){}};
    const hostile='치킨 <img src=x onerror=alert(1)> 2용 & $& 영양제';
    e.state.rows.supplementTypes=[{id,name:hostile,active:true,sortOrder:0}];
    e.state.rows.supplementStock=[{id,currentQty:10}];
    await e.page.renderMain();
    await e.page.autoLogCoordinator.run('main:'+e.today,async()=>({}));
    const log={...legacy(),details:{app:'production',sourceCollection:'supplementLogs',sourceLogId:'old-log',manualMovement:{kind:'receipt'},delta:2,before:0,after:2}},before=JSON.stringify(log),commits=e.state.commits.length;
    assert.equal(e.page.getDisplayLogMessage(log),`${hostile} · 실제 입고 2봉 / 사유: 재고없음`);
    for(const render of [e.page.renderLogRow,e.page.renderModalLogRow]) {
      const html=render(log);
      assert.ok(html.includes('&lt;img'));
      assert.ok(!html.includes('<img'));
      assert.ok(html.includes('&amp;'));
      assert.ok(!html.includes(id));
      const unknown={...log,details:{supplementTypeId:'missing_2'},message:'실제 입고 — missing_2 2'};
      assert.ok(render(unknown).includes('영양제 품목명 확인 필요'));
      assert.ok(!render(unknown).includes('missing_2'));
    }
    assert.equal(JSON.stringify(log),before);
    assert.equal(e.state.commits.length,commits);
  } finally {await e.cleanup();}
});
