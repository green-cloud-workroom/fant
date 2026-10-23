import test from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
import { supplyEvents, usageEvents, productionEvents, periodRows } from '../src/services/statsLogic.js';
import { resolveStatsCorrections, canonicalEvidence } from '../src/services/statsCorrections.js';
import { evaluateStatsAutomation, AUTOMATION_SOURCES, provenResolutions, deliveryIdentity, reconcileIssues, planStatsDeliveries } from '../src/services/statsAutomation.js';
const range = { startDate: '2026-09-01', endDate: '2026-09-30', today: '2026-09-30' };
const incoming = { id: 'source', type: 'frozenIncoming', date: '2026-09-05', meatTypeId: 'm', meatStockId: 'stock', stage: 'frozen', delta: 960000 };
function correction(kind, collection, row, patch = {}) {
  return { id: kind + '-' + row.id, schemaVersion: 1, status: 'active', changesStock: false, kind,
    source: collection + '/' + row.id, reason: '검증된 근거', evidence: [{ path: collection + '/' + row.id, expected: structuredClone(row) }], ...patch };
}
const base = () => ({ ...Object.fromEntries(AUTOMATION_SOURCES.map(k => [k, []])), meatLogs: [structuredClone(incoming)] });
test('invalidated incoming is absent from totals and median history, yet original and stock stay immutable', () => {
  const data = base(); data.meatStocks = [{ id: 'stock', remaining: 123 }];
  data.statsCorrections.push(correction('excludeSupply', 'meatLogs', incoming));
  const before = structuredClone(data), view = supplyEvents(data, range);
  assert.equal(view.events.length, 0); assert.equal(view.summaries.length, 0);
  assert.equal(view.adjustments.length, 1); assert.deepEqual(data, before);
});
test('evidence outside the selected dates is mandatory and cannot silently fall back to old numbers', () => {
  const data = base(), basis = { id: 'basis', type: 'adjust', date: '2026-10-01', delta: -960000 };
  data.meatLogs.push(basis);
  data.statsCorrections.push(correction('excludeSupply', 'meatLogs', incoming, { evidence: [
    { path: 'meatLogs/source', expected: incoming }, { path: 'meatLogs/basis', expected: basis }] }));
  assert.equal(supplyEvents(data, range).events.length, 0);
  data.meatLogs.pop(); assert.throws(() => supplyEvents(data, range), /근거가 변경/);
  // Product output is independent even while material corrections fail closed.
  assert.deepEqual(productionEvents(data, range).events, []);
});
test('duplicate, competing, malformed or changed decisions stop projection instead of double-counting', () => {
  const data = base(), c = correction('excludeSupply', 'meatLogs', incoming);
  for (const records of [[c, c], [c, { ...c, id: 'other' }], [{ ...c, changesStock: true }], [{ ...c, supersedes: 'unknown' }]]) {
    data.statsCorrections = records; assert.throws(() => resolveStatsCorrections(data));
  }
  data.statsCorrections = [c]; data.meatLogs[0].delta++;
  assert.throws(() => resolveStatsCorrections(data), /근거가 변경/);
});
test('timestamp evidence compares identically for SDK, serialized and Web Timestamp shapes', () => {
  const a = new Timestamp(123, 456);
  assert.deepEqual(canonicalEvidence({ timestamp: a }), canonicalEvidence({ timestamp: { seconds: 123, nanoseconds: 456 } }));
  assert.deepEqual(canonicalEvidence(a), canonicalEvidence({ _seconds: 123, _nanoseconds: 456 }));
});
test('only verified supply classification includes a positive manual incoming once', () => {
  const data = base(), r = { id: 'manual', type: 'adjust', date: '2026-09-06', qty: 4000, bagTypeId: 'b', reason: '입고' };
  data.bagLogs.push(r); data.statsCorrections.push(correction('includeSupply', 'bagLogs', r));
  assert.equal(supplyEvents(data, range).events.find(e => e.source === 'bagLogs/manual').qty, 4000);
  r.reason = '실셈'; data.statsCorrections[0] = correction('includeSupply', 'bagLogs', r);
  assert.throws(() => supplyEvents(data, range), /종류/);
});
test('production returns and next-month rollback remain signed on their own event dates', () => {
  const data = base(); data.meatLogs = [
    { ...incoming, id: 'deduct', type: 'productionDeduct', delta: -1000 },
    { ...incoming, id: 'return', type: 'repackedIn', batchId: 'productionCompletion:2026-09-05', delta: 100 },
    { ...incoming, id: 'rollback', date: '2026-10-01', type: 'productionRollback', delta: 900 },
  ];
  data.statsCorrections.push(correction('includeUsage', 'meatLogs', data.meatLogs[1]));
  assert.equal(usageEvents(data, range).events.reduce((n, e) => n + e.qty, 0), .9);
  const october = { ...range, startDate: '2026-10-01', endDate: '2026-10-31', today: '2026-10-31' };
  assert.equal(usageEvents(data, october).events.reduce((n, e) => n + e.qty, 0), -.9);
  assert.ok(Math.abs(usageEvents(data, { ...october, startDate: range.startDate }).events.reduce((n, e) => n + e.qty, 0)) < 1e-12);
  assert.equal(periodRows(usageEvents(data, range).events, 'monthly')[0].qty, .9);
});
test('pending supply retains recorded totals with an explicit hold and never closes or sends an issue', () => {
  const data = base();
  for (let i = 0; i < 6; i++) data.meatLogs.push({ ...incoming, id: 'prior' + i, date: '2026-09-0' + (i + 1), delta: 1000 });
  data.statsCorrections = [correction('hold', 'meatLogs', incoming, { metric: 'supply' })];
  const result = evaluateStatsAutomation(data, { today: range.today, complete: true });
  assert.equal(result.candidates.filter(c => c.evidence.itemId === 'meatLogs:m').length, 0);
  assert.ok(result.held.some(c => c.source === 'meatLogs/source'));
  assert.equal(supplyEvents(data, range).events.length, 7);
  const old = { x: { key: 'x', state: 'open', kind: 'quantity', episode: 1, acknowledgements: { office: 'seen' },
    evidence: { source: 'meatLogs/source', itemId: 'meatLogs:m', stage: '원료' }, history: [] } };
  assert.deepEqual(provenResolutions(old, data, range.today), []);
  const updated = reconcileIssues(old, result, { today: range.today });
  assert.equal(updated.x.state, 'open'); assert.equal(updated.x.evaluationState, 'held');
  assert.deepEqual(updated.x.acknowledgements, old.x.acknowledgements);
  assert.equal(deliveryIdentity(old.x, 'office'), deliveryIdentity(updated.x, 'office'));
});
test('manual bag adjustments cannot become zero use or produce a depletion prediction', () => {
  const data = base(), r = { id: 'manual', type: 'adjust', date: '2026-09-20', qty: -100, bagTypeId: 'b', reason: '재고차감' };
  data.bagLogs.push(r); data.bagTypes.push({ id: 'b', currentQty: 1 });
  for (let i = 0; i < 7; i++) data.bagLogs.push({ ...r, id: 'auto' + i, type: 'autoDeduct', date: '2026-09-' + (20 + i) });
  data.statsCorrections.push(correction('hold', 'bagLogs', r, { metric: 'usage' }));
  const result = evaluateStatsAutomation(data, { today: range.today, complete: true });
  assert.ok(result.held.some(c => c.itemId === 'bagLogs:b'));
  assert.equal(result.candidates.filter(c => c.kind === 'shortage').length, 0);
});
test('weekly report with unresolved source data is withheld rather than sent as a complete total', () => {
  const weekly = { key: 'weekly', endDate: '2026-09-27', unknown: { supply: 1, usage: 0 } };
  assert.deepEqual(planStatsDeliveries({}, weekly, { today: '2026-09-28', activationDate: '2026-09-01' }), []);
});

test('confirmed inventory reconciliation is classified without becoming production use or enabling depletion', () => {
  const data = base(), r = { id: 'manual', type: 'adjust', date: '2026-09-20', qty: -100, bagTypeId: 'b', reason: '재고차감' };
  data.bagLogs.push(r); data.bagTypes.push({ id: 'b', currentQty: 1 });
  for (let i = 0; i < 7; i++) data.bagLogs.push({ ...r, id: 'auto' + i, type: 'autoDeduct', date: '2026-09-' + (20 + i) });
  data.statsCorrections.push(correction('classifyUsage', 'bagLogs', r, { classification: 'stockReconciliation' }));
  const before = structuredClone(data), view = usageEvents(data, range);
  assert.equal(view.pending.length, 0); assert.equal(view.classifications.length, 1);
  assert.ok(!view.events.some(e => e.source === 'bagLogs/manual'));
  assert.equal(view.events.reduce((n, e) => n + e.qty, 0), 700);
  const result = evaluateStatsAutomation(data, { today: range.today, complete: true });
  assert.ok(result.held.some(c => c.itemId === 'bagLogs:b'));
  assert.equal(result.candidates.filter(c => c.kind === 'shortage').length, 0);
  assert.deepEqual(data, before);
});

test('confirmed supplement tests are excluded once while valid consumption and original logs stay preserved', () => {
  const data = base();
  data.supplementLogs = ['a', 'b', 'c', 'real'].map(id => ({ id, date: '2026-09-10', type: 'autoDeduct', qty: -1, supplementTypeId: 's' }));
  data.statsCorrections = data.supplementLogs.slice(0, 3).map(r => correction('excludeUsage', 'supplementLogs', r, { classification: 'test' }));
  const before = structuredClone(data), view = usageEvents(data, range);
  assert.equal(view.events.filter(e => e.stage === '영양제 순차감').reduce((n, e) => n + e.qty, 0), 1);
  assert.equal(view.classifications.length, 3); assert.equal(view.pending.length, 0);
  assert.deepEqual(data, before);
  data.statsCorrections[0].classification = 'stockReconciliation';
  assert.throws(() => usageEvents(data, range), /분류/);
});
