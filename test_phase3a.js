// test_phase3a.js
// Unit tests for aggregateBlockingItems + blocking item metadata.
//
// Run: node test_phase3a.js

import {
  aggregateBlockingItems,
  BLOCKING_ITEM_META
} from './src/services/closingChecksLogic.js';

let pass = 0;
let fail = 0;
const failures = [];

function assert(name, cond, info = '') {
  if (cond) {
    pass++;
    console.log(`  ok ${name}`);
  } else {
    fail++;
    failures.push({ name, info });
    console.log(`  fail ${name}${info ? ` - ${info}` : ''}`);
  }
}

function blocked(reason, count = 1) {
  return { blocked: true, reason, count };
}

function clear() {
  return { blocked: false, reason: '', count: 0 };
}

function idsOf(items) {
  return items.map(item => item.id);
}

console.log('Phase 3a: aggregateBlockingItems\n');

console.log('[1] all clear');
{
  const r = aggregateBlockingItems({
    item1: clear(),
    item2: clear(),
    item3: clear(),
    item7: clear(),
  });
  assert('totalBlocked === 0', r.totalBlocked === 0);
  assert('items is empty', Array.isArray(r.items) && r.items.length === 0);
}

console.log('\n[2] single blocker keeps metadata');
{
  const r = aggregateBlockingItems({
    item1: blocked('tomorrow load pending', 5),
  });
  assert('totalBlocked === 1', r.totalBlocked === 1);
  assert('items[0].id === 1', r.items[0].id === 1);
  assert('items[0].label matches meta', r.items[0].label === BLOCKING_ITEM_META[1].label);
  assert('items[0].jumpMenu === main', r.items[0].jumpMenu === 'main');
  assert('items[0].count === 5', r.items[0].count === 5);
  assert('items[0].reason forwarded', r.items[0].reason === 'tomorrow load pending');
}

console.log('\n[3] workflow order');
{
  const r = aggregateBlockingItems({
    item1: blocked('tomorrow load'),
    item2: blocked('frozen order'),
    item3: blocked('schedule due'),
    item4: blocked('auto repack'),
    item5: blocked('production log'),
    item6: blocked('office log'),
    item7: blocked('egg output'),
    item8: blocked('product receipt'),
  });
  assert('totalBlocked === 8', r.totalBlocked === 8);
  assert(
    'ids follow [3,2,8,7,4,5,6,1]',
    JSON.stringify(idsOf(r.items)) === JSON.stringify([3, 2, 8, 7, 4, 5, 6, 1]),
    JSON.stringify(idsOf(r.items))
  );
}

console.log('\n[4] partial order still follows workflow');
{
  const r = aggregateBlockingItems({
    item1: blocked('tomorrow load'),
    item7: blocked('egg output'),
    item8: blocked('product receipt'),
  });
  assert('totalBlocked === 3', r.totalBlocked === 3);
  assert(
    'ids follow [8,7,1]',
    JSON.stringify(idsOf(r.items)) === JSON.stringify([8, 7, 1]),
    JSON.stringify(idsOf(r.items))
  );
}

console.log('\n[5] flags can disable a blocker');
{
  const r = aggregateBlockingItems({
    item1: blocked('tomorrow load'),
    item7: blocked('egg output'),
  }, {
    blockTomorrowProd: false,
    blockEggOut: true,
  });
  assert('totalBlocked === 1', r.totalBlocked === 1);
  assert('only item7 remains', JSON.stringify(idsOf(r.items)) === JSON.stringify([7]));
}

console.log('\n[6] missing reason/count defaults');
{
  const r = aggregateBlockingItems({
    item3: { blocked: true },
  });
  assert('reason defaults to empty string', r.items[0].reason === '');
  assert('count defaults to 0', r.items[0].count === 0);
}

console.log('\n[7] metadata mapping');
{
  assert('META[1].jumpMenu === main', BLOCKING_ITEM_META[1].jumpMenu === 'main');
  assert('META[2].jumpMenu === frozenPan', BLOCKING_ITEM_META[2].jumpMenu === 'frozenPan');
  assert('META[3].jumpMenu === schedule', BLOCKING_ITEM_META[3].jumpMenu === 'schedule');
  assert('META[7].jumpMenu === egg', BLOCKING_ITEM_META[7].jumpMenu === 'egg');
  assert('META[8].jumpMenu === main', BLOCKING_ITEM_META[8].jumpMenu === 'main');
}

console.log(`\nResult: ${pass}/${pass + fail} pass`);
if (fail > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.name}${f.info ? ` (${f.info})` : ''}`));
  process.exit(1);
}
