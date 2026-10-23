import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTOMATION_SOURCES, evaluateStatsAutomation, reconcileIssues, provenResolutions,
  planStatsDeliveries, deliveryIdentity, confirmPayload, confirmAdjustmentPatch } from '../src/services/statsAutomation.js';
import { supplyEvents, usageEvents, productionEvents } from '../src/services/statsLogic.js';

const today = '2026-10-23';
const range = { today, startDate: '2026-07-26', endDate: today };
const receipt = (id, date = today, qty = 96000, extra = {}) => ({ id, date, qty, type: 'incoming', bagTypeId: 'b', bagNameSnapshot: '치킨포켓', ...extra });
const fixture = () => ({ ...Object.fromEntries(AUTOMATION_SOURCES.map(k => [k, []])), bagLogs: [receipt('a'), receipt('b')] });
const evaluate = data => evaluateStatsAutomation(data, { today, complete: true });
const checks = data => evaluate(data).candidates.filter(r => ['duplicateReceipt', 'cancellation'].includes(r.kind));
function cancel(original, qty = -original.qty) {
  return { ...original, id: 'cancel_v1_' + original.id, type: 'adjust', qty, before: 200000, after: 200000 + qty,
    manualMovement: { version: 1, kind: 'cancel', cancelOf: original.id, originalKind: 'receipt',
      enteredAmount: qty, changesStock: true, reason: '중복 입력 취소' } };
}
test('same ordinary amount on nearby different dates is a review without needing median samples', () => {
  const d = fixture(); d.bagLogs[0].date = '2026-10-21';
  const before = structuredClone(d), [c] = checks(d);
  assert.equal(c.kind, 'duplicateReceipt'); assert.equal(c.evidence.qty, 96000);
  assert.match(c.evidence.basis, /정상 입고일 수도/);
  assert.match(confirmPayload(c, { uid: 'office', name: '사무' }, today, 'id').body, /2026-10-21/);
  assert.deepEqual(d, before);
});
test('all four supply units are checked separately; meat cancellation amounts are displayed in kg', () => {
  for (const [collection, type, keys, field, amount, expected, unit] of [
    ['meatLogs', 'frozenIncoming', { meatTypeId: 'm', meatStockId: 's', stage: 'frozen' }, 'delta', 47500, 47.5, 'kg'],
    ['bagLogs', 'incoming', { bagTypeId: 'b' }, 'qty', 96000, 96000, '장'],
    ['eggLogs', 'in', {}, 'qty', 300, 300, '개'],
    ['supplementLogs', 'in', { supplementTypeId: 's' }, 'qty', 3, 3, '봉'],
  ]) {
    const d = Object.fromEntries(AUTOMATION_SOURCES.map(k => [k, []]));
    const original = { id: 'a', date: today, type, ...keys, [field]: amount };
    d[collection] = [original, { ...original, id: 'b' }];
    assert.equal(checks(d)[0].evidence.unit, unit);
    d[collection].push({ ...original, id: 'cancel_v1_b', type: 'adjust', [field]: -amount + 1,
      before: amount * 2, after: amount + 1, manualMovement: { version: 1, kind: 'cancel',
        cancelOf: 'b', originalKind: 'receipt', enteredAmount: -amount + 1, changesStock: true, reason: '수량 검증' } });
    const [c] = checks(d); assert.equal(c.kind, 'cancellation');
    assert.equal(c.evidence.qty, expected); assert.equal(c.evidence.unit, unit);
  }
});
test('same schedule duplicates are detected despite different amounts and dates', () => {
  const d = fixture(); d.schedules = [{ id: 's', type: 'bag', itemId: 'b' }];
  d.bagLogs[0].date = '2026-09-01'; d.bagLogs[1].qty = 95000;
  d.stockLedger = d.bagLogs.map((r, i) => ({ id: 'l' + i, actionType: 'scheduleComplete', actionId: 's', items: [{ bagLogId: r.id }] }));
  assert.deepEqual(checks(d)[0].evidence.scheduleIds, ['s']);
});
test('older linked source remains comparison evidence for a recent duplicate', () => {
  const d = fixture(); d.bagLogs[0].date = '2026-06-23';
  d.schedules = [{ id: 's', type: 'bag', itemId: 'b' }];
  d.stockLedger = d.bagLogs.map(r => ({ actionType: 'scheduleComplete', actionId: 's', items: [{ bagLogId: r.id }] }));
  assert.equal(checks(d)[0].evidence.originalDate, '2026-06-23');
});
test('distinct schedules, distant dates, different items and units do not invent duplicates', () => {
  for (const change of [d => d.bagLogs[0].date = '2026-10-19', d => d.bagLogs[1].bagTypeId = 'other',
    d => { d.schedules = ['s1', 's2'].map(id => ({ id, type: 'bag', itemId: 'b' }));
      d.stockLedger = d.bagLogs.map((r, i) => ({ actionType: 'scheduleComplete', actionId: 's' + (i + 1), items: [{ bagLogId: r.id }] })); }]) {
    const d = fixture(); change(d); assert.equal(checks(d).length, 0);
  }
});
test('valid full cancellation removes duplicate from review and proves resolution, no stock writes', () => {
  const d = fixture(), [c] = checks(d), prior = reconcileIssues({}, evaluate(d), { today });
  d.bagLogs.push(cancel(d.bagLogs[1])); const before = structuredClone(d);
  assert.equal(checks(d).length, 0);
  assert.ok(provenResolutions(prior, d, today).includes(c.key)); assert.deepEqual(d, before);
});
test('partial/over cancellation, missing original, wrong item and bad balance all produce independent alerts', () => {
  for (const mutate of [r => { r.qty = -95000; r.after = 105000; }, r => { r.qty = -97000; r.after = 103000; },
    r => r.manualMovement.cancelOf = 'missing', r => r.bagTypeId = 'wrong', r => r.after++]) {
    const d = fixture(); const r = cancel(d.bagLogs[1]); mutate(r); d.bagLogs.push(r);
    const before = structuredClone(d), result = evaluate(d), c = result.candidates.find(c => c.kind === 'cancellation');
    assert.ok(c); assert.equal(result.weekly, null); assert.equal(result.integrityComplete, true);
    assert.throws(() => supplyEvents(d, range)); // Never make corrupt data appear valid in statistics.
    assert.equal(planStatsDeliveries(reconcileIssues({}, result, { today }), null, { today, activationDate: today }).length, 1);
    assert.match(confirmPayload(c, { uid: 'office', name: '사무' }, today, 'id').body, /合算|合|합산 잔량/);
    assert.deepEqual(d, before);
  }
});
test('invalid cancellation holds existing alerts and cannot imply that they are resolved', () => {
  const d = fixture(), prior = reconcileIssues({}, evaluate(d), { today });
  const r = cancel(d.bagLogs[1], -10); d.bagLogs.push(r);
  const e = evaluate(d); e.resolvedKeys = provenResolutions(prior, d, today);
  const next = reconcileIssues(prior, e, { today });
  assert.equal(e.resolvedKeys.length, 0);
  for (const key of Object.keys(prior)) assert.equal(next[key].state, 'open');
});
test('same issue keeps identity across daily retries, extra similar receipts and quantity worsening', () => {
  const d = fixture(), result = evaluate(d), first = reconcileIssues({}, result, { today });
  const c = checks(d)[0]; first[c.key].acknowledgements = { office: 'read' };
  const again = reconcileIssues(first, result, { today: '2026-10-24' });
  assert.equal(deliveryIdentity(first[c.key], 'office'), deliveryIdentity(again[c.key], 'office'));
  assert.deepEqual(again[c.key].acknowledgements, { office: 'read' });
  d.bagLogs.push(receipt('c')); assert.equal(checks(d).find(x => x.evidence.source === 'bagLogs/b').key, c.key);
});
test('historical warnings are not backfilled and missing records or aging cannot close an issue', () => {
  const d = fixture(); d.bagLogs.forEach(r => r.date = '2026-10-20');
  const e = evaluate(d), prior = reconcileIssues({}, e, { today });
  assert.equal(planStatsDeliveries(prior, null, { today, activationDate: '2026-10-22' }).length, 0);
  d.bagLogs = []; assert.deepEqual(provenResolutions(prior, d, today), []);
});
test('read-only alerts do not change any existing production, supply or usage projections', () => {
  const d = fixture(), expected = [productionEvents(d, range), supplyEvents(d, range), usageEvents(d, range)];
  evaluate(d); assert.deepEqual([productionEvents(d, range), supplyEvents(d, range), usageEvents(d, range)], expected);
});
test('existing quantity confirm for the same receipt is reused, with additive evidence and read history preserved', () => {
  const d = fixture(), candidate = checks(d)[0], old = { ...candidate, kind: 'quantity', key: 'existing-quantity',
    episode: 1, state: 'open', firstSeen: today, notificationLevel: 2, escalation: 0, acknowledgements: { office: 'read' } };
  const next = reconcileIssues({ [old.key]: old }, evaluate(d), { today });
  assert.deepEqual(Object.keys(next), [old.key]);
  assert.equal(deliveryIdentity(old, 'office'), deliveryIdentity(next[old.key], 'office'));
  const daily = reconcileIssues(next, evaluate(d), { today: '2026-10-24' });
  assert.deepEqual(Object.keys(daily), [old.key]);
  assert.equal(deliveryIdentity(old, 'office'), deliveryIdentity(daily[old.key], 'office'));
  const confirm = { body: '기존 본문', status: '확인', replies: ['대화'], approverAcknowledgedAt: 'read' };
  const patched = { ...confirm, ...confirmAdjustmentPatch(confirm, next[old.key]) };
  assert.equal(patched.status, '확인'); assert.deepEqual(patched.replies, ['대화']);
  assert.equal(patched.approverAcknowledgedAt, 'read'); assert.ok(patched.body.startsWith('기존 본문'));
  assert.equal(confirmAdjustmentPatch(patched, next[old.key]), null);
});
