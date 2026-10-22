import test from 'node:test';
import assert from 'node:assert/strict';
import { productionEvents, supplyEvents, usageEvents, summarize, intervalSample, periodRows, kstDate } from '../src/services/statsLogic.js';

const range = { startDate: '2026-09-01', endDate: '2026-09-30', today: '2026-09-30' };
const p = (id, patch = {}) => ({ id, date: '2026-09-10', status: 'active', category: 'raw', recipeId: 'r1', recipeName: '치킨',
  received: true, receivedTotalPacks: 100, productionUnitQty: 50, productionUnitName: 'kg',
  ingredientsSnapshot: [{ name: '닭', meatTypeId: 'm1', requiredQtyG: 2000 }], ...patch });
const stamp = date => new Date(date + 'T00:00:00+09:00');
const schedule = (id, patch = {}) => ({ id, type: 'meat', itemId: 'm1', itemNameSnapshot: '닭', status: 'completed',
  createdAt: stamp('2026-09-01'), date: '2026-09-09', completedAt: stamp('2026-09-10'), ...patch });

test('only confirmed current output is production: inputs, locks, missing values and futures are not output', () => {
  const rows = [p('good'), p('latest', { receivedTotalPacks: 120, receivedRevision: 4 }),
    p('planned', { received: false, lockedByCompletion: true }), p('legacy', { receivedTotalPacks: null }),
    p('future', { date: '2026-09-21' }), p('deleted', { status: 'deleted' })];
  const result = productionEvents({ productions: rows }, { ...range, today: '2026-09-20' });
  assert.equal(result.events.reduce((n, e) => n + e.qty, 0), 220);
  assert.equal(result.events[0].inputQty, 50);
  assert.equal(result.events[0].unit, '팩');
  assert.equal(result.unconfirmed.length, 3);
});
test('an explicitly confirmed zero is preserved while absent quantities are unknown', () => {
  const result = productionEvents({ productions: [p('zero', { receivedTotalPacks: 0 }), p('missing', { receivedTotalPacks: undefined })] }, range);
  assert.equal(result.events.length, 1); assert.equal(result.events[0].qty, 0);
  assert.equal(result.unconfirmed.length, 1);
});
test('freeze manufacturing, packaging and sample assembly remain separate; component deductions never reduce output', () => {
  const data = { productions: [p('pan', { category: 'freezeDry', receivedFreezeType: 'breadPan', receivedFreezeQty: 8 })],
    frozenLogs: [
      { id: 'pack', date: '2026-09-10', status: 'active', productId: 'f1', productNameSnapshot: '치킨', qty: 40 },
      { id: 'set', date: '2026-09-10', status: 'active', productId: 's1', qty: 5, componentsSnapshot: [{ frozenProductId: 'f1', qty: 2 }] },
      { id: 'deduction', date: '2026-09-10', status: 'active', productId: 'f1', qty: -10, sampleSetLogId: 'set' },
      { id: 'oldSet', date: '2026-09-10', status: 'active', productId: 's1', qty: 3 },
    ], frozenProducts: [{ id: 's1', kind: 'sampleSet' }] };
  const result = productionEvents(data, range);
  assert.deepEqual(result.events.map(e => [e.stage, e.qty, e.unit]), [['동결 생산', 8, '빵판'], ['동결 포장', 40, '봉'], ['샘플세트 조립', 5, '세트']]);
  assert.equal(result.unconfirmed.length, 1);
});
test('intervals use distinct dates with n-1 gaps, not receipt counts; one date cannot yield an interval', () => {
  assert.deepEqual(intervalSample([{ date: '2026-09-01' }, { date: '2026-09-01' }, { date: '2026-09-11' }, { date: '2026-09-15' }]),
    { count: 2, mean: 7, min: 4, max: 10, days: 3, lastDate: '2026-09-15' });
  assert.equal(intervalSample([{ date: '2026-09-01' }]).mean, null);
});
test('supply uses one canonical external log, excluding processing, repacking, adjustment and deleted rows', () => {
  const log = (id, type, delta = 1000, patch = {}) => ({ id, type, delta, meatTypeId: 'm1', meatNameSnapshot: '닭', date: '2026-09-10', ...patch });
  const data = { meatLogs: [log('receipt', 'frozenIncoming'), log('receipt', 'frozenIncoming'), log('processed', 'processedIn'),
    log('repacked', 'repackedIn'), log('adjust', 'adjust'), log('bad', 'frozenIncoming', null), log('deleted', 'frozenIncoming', 1000, { status: 'deleted' })],
    meatStocks: [{ id: 'stock', initialQtyG: 1000 }], schedules: [schedule('sameReceipt')] };
  const result = supplyEvents(data, range);
  assert.equal(result.events.length, 1); assert.equal(result.summaries[0].total, 1);
  assert.equal(result.events[0].unit, 'kg'); assert.equal(result.registrations.length, 1);
  assert.equal(result.excludedReceipts.length, 1);
});
test('last receipt can predate the range; its quantity is not invented as zero and its old interval is not reused', () => {
  const result = supplyEvents({ meatLogs: [
    { id: 'old', type: 'frozenIncoming', date: '2026-08-25', delta: 2000, meatTypeId: 'm1' },
    { id: 'later', type: 'frozenIncoming', date: '2026-10-01', delta: 5000, meatTypeId: 'm1' },
  ] }, range);
  assert.equal(result.events.length, 0);
  assert.equal(result.summaries[0].lastDate, '2026-08-25'); assert.equal(result.summaries[0].elapsed, 36);
  assert.equal(result.summaries[0].total, null); assert.equal(result.summaries[0].interval.mean, null);
});
test('schedule lead time uses KST registration and completion cohort, final schedule dates, and excludes missing/reversed dates from averages', () => {
  const result = supplyEvents({ schedules: [
    schedule('early', { createdAt: new Date('2026-08-31T15:10:00Z'), date: '2026-10-01' }),
    schedule('missing', { createdAt: null }), schedule('reverse', { createdAt: stamp('2026-09-11') }),
    schedule('pending', { status: 'scheduled' }), schedule('cancelled', { status: 'cancelled' }),
    schedule('outside', { completedAt: stamp('2026-10-10') }), schedule('noCompletion', { completedAt: null }),
  ] }, range);
  assert.equal(kstDate(new Date('2026-08-31T15:10:00Z')), '2026-09-01');
  assert.equal(result.registrations.length, 3); assert.equal(result.registrations[0].prior, 30);
  assert.equal(result.registrations[0].processing, 9);
  assert.equal(result.registrationSummary[0].prior.count, 1);
  assert.equal(result.registrationSummary[0].processing.count, 1);
  assert.deepEqual(result.excludedSchedules, ['noCompletion']);
});
test('supply preserves incompatible units and inactive or missing masters', () => {
  const result = supplyEvents({
    bagLogs: [{ id: 'b', type: 'incoming', date: '2026-09-01', bagTypeId: 'b1', bagNameSnapshot: '옛 봉투', qty: 100 }],
    eggLogs: [{ id: 'e', type: 'in', date: '2026-09-01', qty: 30 }],
    supplementLogs: [{ id: 's', type: 'in', date: '2026-09-01', supplementTypeId: 's1', qty: 2 }],
    supplementTypes: [{ id: 's1', name: '비활성 영양제', active: false }],
  }, range);
  assert.equal(result.summaries.length, 3);
  assert.deepEqual(result.events.map(e => e.unit), ['장', '개', '봉']);
  assert.ok(result.summaries.some(g => g.name === '비활성 영양제'));
});
test('calculated usage comes from confirmed historical snapshots and does not recalculate from current recipes', () => {
  const result = usageEvents({ productions: [p('yes'), p('planned', { received: false }), p('deleted', { status: 'deleted' })],
    recipes: [{ id: 'r1', ingredients: [{ requiredQtyG: 999999 }] }] }, range);
  assert.equal(result.events.length, 1); assert.equal(result.events[0].qty, 2);
  assert.equal(result.events[0].stage, '계산상 사용량');
});
test('restorations stay signed, are not absolute usage, and adjustments are excluded', () => {
  const result = usageEvents({
    bagLogs: [{ id: 'b1', date: '2026-09-01', type: 'autoDeduct', qty: -10, bagTypeId: 'b' },
      { id: 'b2', date: '2026-09-02', type: 'autoDeductReverse', qty: 15, bagTypeId: 'b' },
      { id: 'b3', date: '2026-09-02', type: 'adjust', qty: -999, bagTypeId: 'b' }],
    meatLogs: [{ id: 'm', date: '2026-09-02', type: 'productionRollback', delta: 1000, meatTypeId: 'm' }],
    supplementLogs: [{ id: 's', date: '2026-09-02', type: 'autoDeduct', qty: 1, supplementTypeId: 's' }],
  }, range);
  const groups = summarize(result.events, range);
  assert.equal(groups.find(g => g.stage === '봉투 순차감').total, -5);
  assert.equal(groups.find(g => g.stage === '재고 순차감').total, -1);
  assert.equal(groups.find(g => g.stage === '영양제 순차감').total, -1);
});
test('unlinked names never merge unrelated materials and missing snapshots remain visible', () => {
  const result = usageEvents({ productions: [p('a', { ingredientsSnapshot: [{ name: '닭', requiredQtyG: 1000 }] }),
    p('b', { ingredientsSnapshot: [{ name: '닭', requiredQtyG: 2000 }] }), p('missing', { ingredientsSnapshot: null })] }, range);
  assert.equal(summarize(result.events, range).length, 2); assert.equal(result.missing.length, 1);
});
test('calendar and production-day averages have explicit different denominators; weekly bins start Monday', () => {
  const events = [{ itemId: 'm', name: '닭', stage: '계산상 사용량', unit: 'kg', date: '2026-09-06', qty: 2 },
    { itemId: 'm', name: '닭', stage: '계산상 사용량', unit: 'kg', date: '2026-09-07', qty: 4 }];
  const [g] = summarize(events, range);
  assert.equal(g.calendarMean, 0.2); assert.equal(g.workingMean, 3);
  assert.deepEqual(periodRows(events, 'weekly').map(r => r.period), ['2026-08-31', '2026-09-07']);
});
