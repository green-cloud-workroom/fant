import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

async function setup(role='office') {
  const e=await pageEnvironment('bag',{role,instrument:'\nexport {showBagModal};'});
  Object.assign(e.state.rows.bagTypes[0],{currentQty:2868,piecesPerBox:4000,minimumBoxQty:1,minimumQty:4000});
  e.state.rows.bagLogs=[{id:'original',bagTypeId:'b1',type:'incoming',qty:4000,date:'2026-10-01'}];
  await e.page.renderBag();
  e.page.showBagModal(e.state.rows.bagTypes[0]);
  return e;
}

test('box-size edit saves threshold only and preserves current stock and history',async()=>{
  const e=await setup();try {
    const logs=JSON.stringify(e.state.rows.bagLogs);
    e.fill('#m_piecesPerBox','3000');await e.fire('#m_piecesPerBox','input');
    assert.match(e.document.querySelector('#m_bagMinimumPreview').textContent,/1박스 = 3,000장/);
    await e.fire('#btnSaveBag');
    assert.equal(e.state.rows.bagTypes[0].piecesPerBox,3000,e.alerts.join('\n'));
    assert.equal(e.state.rows.bagTypes[0].minimumQty,3000);
    assert.equal(e.state.rows.bagTypes[0].currentQty,2868);
    assert.equal(JSON.stringify(e.state.rows.bagLogs),logs);
    assert.deepEqual(e.state.writes,['bagTypes/b1']);
    assert.equal(Object.hasOwn(e.state.commits[0][0].data,'currentQty'),false);
  } finally {await e.cleanup();}
});

test('minimum box count uses the new box size, not current stock or historical receipt sizes',async()=>{
  const e=await setup();try {
    e.fill('#m_piecesPerBox','2500');e.fill('#m_minBox','2');await e.fire('#m_minBox','input');
    assert.match(e.document.querySelector('#m_bagMinimumPreview').textContent,/2박스 = 5,000장/);
    await e.fire('#btnSaveBag');assert.equal(e.state.rows.bagTypes[0].minimumQty,5000);
    assert.equal(e.state.rows.bagTypes[0].currentQty,2868);
  } finally {await e.cleanup();}
});

test('new bag has a valid generated target and zero initial stock',async()=>{
  const e=await setup();try {
    e.page.showBagModal(null);e.fill('#m_bagName','새 봉투');e.fill('#m_bagCategory','raw');
    e.fill('#m_piecesPerBox','2000');e.fill('#m_minBox','3');await e.fire('#btnSaveBag');
    const bag=e.state.rows.bagTypes.find(row=>row.name==='새 봉투');
    assert.ok(bag,e.alerts.join('\n'));assert.equal(bag.currentQty,0);assert.equal(bag.minimumQty,6000);
    assert.equal(e.state.rows.bagLogs.length,1);assert.equal(e.state.writes.length,1);
  } finally {await e.cleanup();}
});

test('empty optional box values stay allowed when minimum is zero',async()=>{
  const e=await setup();try {
    e.fill('#m_piecesPerBox','');e.fill('#m_minBox','');await e.fire('#btnSaveBag');
    assert.equal(e.state.rows.bagTypes[0].minimumQty,0);assert.equal(e.state.writes.length,1);
  } finally {await e.cleanup();}
});

test('invalid conversion is never silently truncated or saved',async()=>{
  for (const [pieces,minimum] of [['1.5','1'],['1000','-1'],['','1'],['1000','1.5'],['9007199254740991','2']]) {
    const e=await setup();try {
      e.fill('#m_piecesPerBox',pieces);e.fill('#m_minBox',minimum);await e.fire('#btnSaveBag');
      assert.equal(e.state.writes.length,0);assert.ok(e.alerts.length);assert.equal(e.document.querySelector('#m_piecesPerBox').value,pieces);
    } finally {await e.cleanup();}
  }
});

test('production role cannot change bag master',async()=>{
  const e=await setup('production');try {await e.fire('#btnSaveBag');assert.equal(e.state.writes.length,0);assert.ok(e.alerts.length);} finally {await e.cleanup();}
});

test('concurrent stock change is preserved and requires a fresh view',async()=>{
  const e=await setup();try {
    e.state.rows.bagTypes[0].currentQty=2800;e.fill('#m_piecesPerBox','3000');await e.fire('#btnSaveBag');
    assert.equal(e.state.writes.length,0);assert.equal(e.state.rows.bagTypes[0].currentQty,2800);assert.match(e.alerts.join('\n'),/원본/);
  } finally {await e.cleanup();}
});
