import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTOMATION_SOURCES, DELIVERY_RELEASED, DEFAULT_POLICY, addDays, automationRange,
  evaluateStatsAutomation, quantityAssessment, weeklySummary, reconcileIssues, provenResolutions,
  deliveryIdentity, confirmPayload, workingDaysBetween, planStatsDeliveries, followingStockAdjustments, confirmAdjustmentPatch } from '../src/services/statsAutomation.js';

export function fixture() {
  const data = Object.fromEntries(AUTOMATION_SOURCES.map(k => [k, []]));
  for (let i = 0; i < 7; i++) data.meatLogs.push({ id: 'receipt' + i, type: 'frozenIncoming', meatTypeId: 'lamb',
    meatNameSnapshot: '양제비추리', date: addDays('2026-09-03', i * 7), delta: 82973, stage: 'frozen', meatStockId: 'lot' + i });
  data.eggStock = [{ id: 'global', currentQty: 1, minimumQty: 0 }];
  for (let i = 0; i < 6; i++) data.eggLogs.push({ id: 'out' + i, type: 'out', date: addDays('2026-10-10', i), qty: -90 });
  return data;
}
const evaluate = data => evaluateStatsAutomation(data, { today: '2026-10-22', complete: true });
const quantity = (qty, source = 'meatLogs/candidate', date = '2026-10-22') => ({ itemId: 'meatLogs:lamb',
  stage: '원료', unit: 'kg', qty, source, date });
const history = () => Array.from({ length: 6 }, (_, i) => quantity(82.973, 'meatLogs/' + i, addDays('2026-10-01', i)));

test('release remains blocked, incomplete data cannot invent results', () => {
  assert.equal(DELIVERY_RELEASED, false);
  const data = fixture(); delete data.schedules;
  assert.equal(evaluate(data).weekly, null);
  assert.deepEqual(evaluate(data).candidates, []);
  assert.equal(evaluateStatsAutomation(fixture(), { today: '2026-10-22' }).weekly, null);
});
test('invalid date rejected and lookback includes exactly 90 calendar days', () => {
  assert.throws(() => automationRange('2026-02-30'));
  assert.equal((Date.parse(automationRange('2026-10-22').endDate) - Date.parse(automationRange('2026-10-22').startDate)) / 86400000 + 1, 90);
});
test('receipt pattern triggers registration review, never a shipping-delay claim', () => {
  const result = evaluate(fixture()), item = result.candidates.find(c => c.kind === 'registration');
  assert.equal(item.evidence.meanInterval, 7); assert.equal(item.evidence.samples, 6);
  assert.deepEqual(item.recipientRoles, ['office']); assert.match(item.evidence.note, /판단 아님/);
});
test('only scheduled matching item with a relevant valid future date suppresses registration', () => {
  for (const [type, date, status, expected] of [['meat', '2026-10-23', 'scheduled', false],
    ['bag', '2026-10-23', 'scheduled', true], ['meat', '2026-10-10', 'scheduled', true],
    ['meat', '2026-10-23', 'cancelled', true], ['meat', '2026-10-23', 'completed', true]]) {
    const data = fixture(); data.schedules = [{ id: 's', type, date, status, itemId: 'lamb' }];
    assert.equal(evaluate(data).candidates.some(c => c.kind === 'registration'), expected);
  }
});
test('sparse, stale, invalid and unlinked receipt histories are held', () => {
  const sparse = fixture(); sparse.meatLogs = sparse.meatLogs.slice(0, 3);
  assert.equal(evaluate(sparse).candidates.filter(c => c.kind === 'registration').length, 0);
  const stale = fixture(); stale.meatLogs.forEach((r, i) => r.date = addDays('2026-08-01', i));
  assert.equal(evaluate(stale).candidates.filter(c => c.kind === 'registration').length, 0);
  const invalid = fixture(); invalid.meatLogs.push({ ...invalid.meatLogs[0], id: 'broken', delta: null });
  assert.equal(evaluate(invalid).candidates.filter(c => c.kind === 'registration').length, 0);
});
test('same-day receipts produce one interval date and duplicate source IDs are not extra samples', () => {
  const data = fixture(); data.meatLogs.push(...data.meatLogs.map(r => ({ ...r })));
  const item = evaluate(data).candidates.find(c => c.kind === 'registration');
  assert.equal(item.evidence.samples, 6);
});
test('1000-fold g/kg mistake is a review, ordinary quantity is normal; inputs immutable', () => {
  const rows = history(), before = JSON.stringify(rows);
  assert.equal(quantityAssessment(quantity(82973), rows).state, 'review');
  assert.equal(quantityAssessment(quantity(82.973), rows).state, 'normal');
  assert.equal(JSON.stringify(rows), before);
});
test('anomaly comparison excludes future records, same day, other units, negative restorations and product stages', () => {
  const candidate = quantity(82973);
  for (const rows of [history().slice(0, 5), history().map(e => ({ ...e, unit: 'g' })),
    history().map(e => ({ ...e, date: '2026-10-23' })), history().map(e => ({ ...e, date: candidate.date })),
    history().map(e => ({ ...e, qty: -e.qty })), history().map(e => ({ ...e, stage: '재고 순차감' }))]) {
    assert.equal(quantityAssessment(candidate, rows).state, 'unknown');
  }
  const calculated = { ...candidate, stage: '계산상 사용량', product: '제품 A' };
  assert.equal(quantityAssessment(calculated, history().map(e => ({ ...e, stage: '계산상 사용량', product: '제품 B' }))).state, 'unknown');
});
test('reversal signs are included in depletion and existing minimum-stock alerts suppress duplicates', () => {
  const data = fixture(), before = JSON.stringify(data);
  assert.equal(evaluate(data).candidates.some(c => c.kind === 'shortage'), true);
  data.eggLogs.push({ id: 'restored', type: 'out', date: '2026-10-21', qty: 540 });
  assert.equal(evaluate(data).candidates.some(c => c.kind === 'shortage'), false);
  const existing = fixture(); existing.eggStock[0].minimumQty = 10;
  assert.equal(evaluate(existing).candidates.some(c => c.kind === 'shortage'), false);
  assert.match(evaluate(existing).held.find(h => h.itemId === 'eggLogs:egg').reason, /중복/);
  assert.equal(JSON.stringify(fixture()), before);
});
test('missing quantities block depletion and absence of meat-stage alignment never invents a shortage', () => {
  const data = fixture(); data.eggLogs.push({ id: 'unknown', type: 'out', qty: null, date: '2026-10-21' });
  assert.equal(evaluate(data).candidates.some(c => c.kind === 'shortage'), false);
  assert.match(evaluate(data).held.find(h => h.itemId === 'eggLogs:egg').reason, /부분/);
  assert.ok(!evaluate(data).candidates.some(c => c.kind === 'shortage' && c.evidence.itemId === 'meatLogs:lamb'));
});
test('validated correction preserves source and eliminates 82973kg false quantity alert', () => {
  const data = fixture(), source = data.meatLogs.at(-1); source.delta = 82973000;
  assert.ok(evaluate(data).candidates.some(c => c.kind === 'quantity'));
  data.meatLogs.push({ id: 'basis', type: 'adjust', meatStockId: source.meatStockId, meatTypeId: 'lamb',
    before: source.delta, after: 82973, delta: 82973 - source.delta });
  data.meatLogs.push({ id: 'incomingQuantity_v1_' + source.id, type: 'incomingQuantityCorrection', correctionOf: source.id,
    basisAdjustmentId: 'basis', schemaVersion: 1, scope: 'incomingQuantity', status: 'active', changesStock: false,
    delta: 0, originalQtyG: source.delta, correctedQtyG: 82973, date: source.date, stage: source.stage,
    meatTypeId: 'lamb', meatStockId: source.meatStockId, reason: '단위 정정' });
  const before = JSON.stringify(data);
  assert.ok(!evaluate(data).candidates.some(c => c.kind === 'quantity'));
  assert.equal(JSON.stringify(data), before); assert.equal(source.delta, 82973000);
});
test('weekly report covers last completed Mon-Sun, keeps units/stages and does not popup', () => {
  const report = weeklySummary(fixture(), '2026-10-22');
  assert.equal(report.startDate, '2026-10-12'); assert.equal(report.endDate, '2026-10-18');
  assert.equal(report.popup, undefined); assert.equal(report.kind, '공유');
  assert.equal(report.usage.find(r => r.unit === '개').total, 360);
});
test('seen by office never resolves shared issue or affects representative acknowledgement', () => {
  const result = evaluate(fixture()), item = result.candidates.find(c => c.kind === 'registration');
  const state = reconcileIssues({}, result, { today: '2026-10-22' });
  state[item.key].acknowledgements.office = 'seen';
  const next = reconcileIssues(state, result, { today: '2026-10-23' });
  assert.equal(next[item.key].state, 'open'); assert.equal(next[item.key].acknowledgements.owner, undefined);
  assert.equal(next[item.key].acknowledgements.office, 'seen');
});
test('escalation requires verified calendar and counts working days excluding holidays', () => {
  assert.equal(workingDaysBetween('2026-10-23', '2026-10-28', ['2026-10-26']), 2);
  const result = evaluate(fixture()), item = result.candidates.find(c => c.kind === 'registration');
  const state = reconcileIssues({}, result, { today: '2026-10-22' });
  assert.equal(reconcileIssues(state, result, { today: '2026-10-26' })[item.key].escalation, 0);
  assert.equal(reconcileIssues(state, result, { today: '2026-10-26', calendarComplete: true })[item.key].escalation, 1);
});
test('retries/dates preserve delivery identity, recipients and escalation have independent IDs', () => {
  const result = evaluate(fixture()), item = result.candidates[0];
  const a = reconcileIssues({}, result, { today: '2026-10-22' });
  const b = reconcileIssues(a, result, { today: '2026-10-23' });
  assert.equal(deliveryIdentity(a[item.key], 'office'), deliveryIdentity(b[item.key], 'office'));
  assert.notEqual(deliveryIdentity(a[item.key], 'office'), deliveryIdentity(a[item.key], 'owner'));
  assert.notEqual(deliveryIdentity(a[item.key], 'office'), deliveryIdentity({ ...a[item.key], escalation: 1 }, 'office'));
});
test('absent candidate or incomplete evaluation does not silently resolve issues; explicit source resolution does', () => {
  const data = fixture(), result = evaluate(data), state = reconcileIssues({}, result, { today: '2026-10-22' });
  const row = result.candidates.find(c => c.kind === 'registration');
  const empty = { ...result, candidates: [] };
  assert.equal(reconcileIssues(state, empty, { today: '2026-10-23' })[row.key].state, 'open');
  data.schedules.push({ id: 'new', type: 'meat', itemId: 'lamb', date: '2026-10-23', status: 'scheduled' });
  empty.resolvedKeys = provenResolutions(state, data, '2026-10-22');
  const resolved = reconcileIssues(state, empty, { today: '2026-10-22' });
  assert.equal(resolved[row.key].state, 'resolved'); assert.equal(resolved[row.key].history.length, 1);
  const recurrence = reconcileIssues(resolved, result, { today: '2026-10-24' });
  assert.equal(recurrence[row.key].episode, 2); assert.equal(recurrence[row.key].history.length, 1);
});
test('confirm payload is private per-recipient and shares no global activityLogs ack', () => {
  const item = evaluate(fixture()).candidates[0];
  const office = confirmPayload(item, { uid: 'office', name: '사무' }, '2026-10-22', 'fixed-office');
  const owner = confirmPayload(item, { uid: 'owner', name: '대표' }, '2026-10-22', 'fixed-owner');
  assert.equal(office.boardPublic, false); assert.deepEqual(office.participantUids, ['system:production-stats', 'office']);
  assert.notDeepEqual(office.participantUids, owner.participantUids);
  assert.equal(office.acknowledged, undefined); assert.match(office.body, /별도/);
});
test('delivery activation excludes old quantity warnings, held issues and weekly backfill', () => {
  const old = { kind: 'quantity', key: 'old', state: 'open', evidence: { date: '2026-10-21' } };
  const recent = { ...old, key: 'new', evidence: { date: '2026-10-22' } };
  const issues = { old, recent, held: { ...recent, key: 'held', evaluationState: 'held' } };
  const weekly = weeklySummary(fixture(), '2026-10-26');
  const plan = planStatsDeliveries(issues, weekly, { today: '2026-10-22', activationDate: '2026-10-22' });
  assert.deepEqual(plan.map(r => r.key), ['new']);
  assert.equal(planStatsDeliveries(issues, weekly, { today: '2026-10-22', activationDate: '2026-10-23' }).length, 0);
  const monday = planStatsDeliveries({}, weekly, { today: '2026-10-26', activationDate: '2026-10-22' });
  assert.equal(monday.length, 1); assert.equal(monday[0].popup, undefined);
  assert.equal(confirmPayload(monday[0], { uid: 'u', name: '사무' }, '2026-10-26', 'weekly').kind, '공유');
});
test('FIFO split deduction lines are not manual quantity errors', () => {
  const data = fixture();
  for (let i = 0; i < 10; i++) data.meatLogs.push({ id: 'lot-use-' + i, type: 'productionDeduct',
    meatTypeId: 'lamb', date: addDays('2026-10-01', i), delta: i === 9 ? -1 : -10000 });
  assert.equal(evaluate(data).candidates.filter(c => c.kind === 'quantity').length, 0);
});
test('calculated use compares only equal batch input amounts and units', () => {
  const candidate = { ...quantity(82973), stage: '계산상 사용량', product: 'A', batchQty: 10, batchUnit: 'kg' };
  const base = history().map(e => ({ ...e, stage: candidate.stage, product: 'A', batchQty: 10, batchUnit: 'kg' }));
  assert.equal(quantityAssessment(candidate, base).state, 'review');
  assert.equal(quantityAssessment({ ...candidate, batchQty: 1 }, base).state, 'unknown');
  assert.equal(quantityAssessment({ ...candidate, batchUnit: '박스' }, base).state, 'unknown');
  assert.equal(quantityAssessment({ ...candidate, batchQty: undefined }, base).state, 'unknown');
});
test('meaningful worsening creates one new notification level and improvement does not reset it', () => {
  const result = evaluate(fixture());
  const shortage = result.candidates.find(c => c.kind === 'shortage');
  const first = reconcileIssues({}, { ...result, candidates: [{ ...shortage, evidence: { ...shortage.evidence, estimatedDaysLeft: 1.5 } }] }, { today: '2026-10-22' });
  const worse = reconcileIssues(first, { ...result, candidates: [{ ...shortage, evidence: { ...shortage.evidence, estimatedDaysLeft: 0.4 } }] }, { today: '2026-10-23' });
  assert.notEqual(deliveryIdentity(first[shortage.key], 'office'), deliveryIdentity(worse[shortage.key], 'office'));
  const better = reconcileIssues(worse, { ...result, candidates: [{ ...shortage, evidence: { ...shortage.evidence, estimatedDaysLeft: 0.8 } }] }, { today: '2026-10-24' });
  assert.equal(deliveryIdentity(worse[shortage.key], 'office'), deliveryIdentity(better[shortage.key], 'office'));
});


test('following adjustment context requires the same stock, material, stage, later timestamp and valid arithmetic', () => {
  const original = {id:'receipt',type:'frozenIncoming',meatStockId:'lot',meatTypeId:'heart',stage:'frozen',date:'2026-10-22',timestamp:'2026-10-22T05:13:58Z',delta:47500};
  const adjustment = {id:'adjustment',type:'adjust',meatStockId:'lot',meatTypeId:'heart',stage:'frozen',date:'2026-10-22',timestamp:'2026-10-22T05:14:33Z',before:47500,after:475000,delta:427500,staff:'담당자',reason:'실수'};
  const invalid = [{meatStockId:'another-lot'},{meatTypeId:'other'},{stage:'processed'},{timestamp:'2026-10-22T05:13:58Z'},
    {timestamp:'2026-10-22T05:12:00Z'},{timestamp:null},{date:'2026-10-23'},{timestamp:'2026-10-23T05:00:00Z'},{delta:1},{status:'deleted'}];
  const data={meatLogs:[original,adjustment,...invalid.map((patch,i)=>({...adjustment,id:'invalid-'+i,...patch}))]};
  const before=JSON.stringify(data), rows=followingStockAdjustments(data,{source:'meatLogs/receipt'},'2026-10-22');
  assert.equal(rows.length,1); assert.equal(rows[0].before,47.5); assert.equal(rows[0].after,475);
  assert.equal(rows[0].staff,'담당자'); assert.equal(rows[0].reason,'실수'); assert.equal(rows[0].source,'meatLogs/adjustment');
  assert.equal(JSON.stringify(data),before); assert.deepEqual(followingStockAdjustments(data,{source:'bagLogs/receipt'},'2026-10-22'),[]);
});

test('adjustment context does not change quantity verdict or delivery identity and updates only its own suffix', () => {
  const data=fixture(); const last=data.meatLogs.at(-1); last.delta=82973000;last.timestamp='2026-10-15T00:00:00Z';
  const original=evaluate(data).candidates.find(c=>c.kind==='quantity');assert.ok(original);
  data.meatLogs.push({id:'later-adjustment',type:'adjust',meatTypeId:last.meatTypeId,meatStockId:last.meatStockId,stage:last.stage,
    date:'2026-10-15',timestamp:'2026-10-15T00:00:35Z',before:82973000,after:82973,delta:82973-82973000,staff:'담당자',reason:'단위 실수'});
  const enriched=evaluate(data).candidates.find(c=>c.kind==='quantity');
  assert.equal(enriched.evidence.qty,original.evidence.qty);assert.equal(enriched.evidence.ratio,original.evidence.ratio);
  assert.equal(deliveryIdentity(enriched,'office'),deliveryIdentity(original,'office'));
  const old=confirmPayload(original,{uid:'office',name:'사무'},'2026-10-22','id');
  const patch=confirmAdjustmentPatch(old,enriched);assert.ok(patch);
  assert.match(patch.body,/단위 실수/);assert.match(patch.body,/82,973kg → 82.973kg/);
  assert.ok(patch.body.startsWith(old.body));assert.deepEqual(Object.keys(patch).sort(),['body','statsAdjustmentContextText']);
  const applied={...old,...patch};assert.equal(confirmAdjustmentPatch(applied,enriched),null);
  assert.equal(confirmAdjustmentPatch({...applied,body:applied.body+'추가 메모'},enriched),null);
  assert.equal(confirmAdjustmentPatch({...old,cancelled:true},enriched),null);
  const fresh=confirmPayload(enriched,{uid:'office',name:'사무'},'2026-10-22','id');assert.equal(fresh.body,patch.body);
});
