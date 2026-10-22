// Explicit production read-only audit. No data repair, app writes or alerts.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { productionEvents, supplyEvents, usageEvents, summarize, periodRows } from '../src/services/statsLogic.js';

if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Expected explicit operational read-only context, not emulator.');
const projectId = 'fant-e5ae5';
const replay = process.argv.includes('--replay');
const db = replay ? null : getFirestore(initializeApp({ credential: applicationDefault(), projectId }));
const collections = ['productions', 'frozenLogs', 'frozenProducts', 'meatLogs', 'bagLogs', 'eggLogs', 'supplementLogs', 'supplementTypes', 'schedules', 'productTransferRequests'];
// One consistent snapshot across collections; readOnly disallows transaction writes.
const saved = replay ? JSON.parse(await readFile('output/stats-live-audit/snapshot.json', 'utf8'),
  (_, value) => value && typeof value._seconds === 'number' ? new Timestamp(value._seconds, value._nanoseconds || 0) : value) : null;
const snapshots = replay ? null : await db.runTransaction(tx => Promise.all(collections.map(name => tx.get(db.collection(name)))), { readOnly: true });
const data = saved?.data || Object.fromEntries(snapshots.map((snap, i) => [collections[i], snap.docs.map(d => ({ ...d.data(), id: d.id }))]));
const observedAt = saved?.observedAt || snapshots[0].readTime.toDate().toISOString();
const today = new Date(Date.parse(observedAt) + 9 * 3600000).toISOString().slice(0, 10);
const isDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const number = value => typeof value === 'number' && Number.isFinite(value);
const alive = row => !['deleted', 'cancelled', 'canceled'].includes(row.status);
const dateOf = value => value?.toDate ? new Date(value.toDate().getTime() + 9 * 3600000).toISOString().slice(0, 10)
  : value?.seconds != null ? new Date(value.seconds * 1000 + 9 * 3600000).toISOString().slice(0, 10) : null;
const diff = (a, b) => (Date.parse(b) - Date.parse(a)) / 86400000;
const failures = [];
let comparisons = 0;
function difference(a, b, path = '') {
  if (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-7) return null;
  if (a === b) return null;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return { path, expected: a, actual: b };
  const keys = Object.keys(a).sort(), otherKeys = Object.keys(b).sort();
  if (JSON.stringify(keys) !== JSON.stringify(otherKeys)) return { path, expectedKeys: keys, actualKeys: otherKeys };
  for (const key of keys) { const result = difference(a[key], b[key], path + '/' + key); if (result) return result; }
  return null;
}
function equal(label, expected, actual) {
  comparisons++;
  const mismatch = difference(expected, actual);
  if (mismatch) failures.push({ label, ...mismatch });
}
// Independent source projection: deliberately does not call stats helpers.
function independent(range) {
  const within = date => isDate(date) && date >= range.startDate && date <= range.endDate && date <= today;
  const production = [], usage = [], supply = [], registrations = [];
  const take = (list, row, source, qty, unit, stage, itemId) => list.push({ source, date: row.date, qty, unit, stage, itemId });
  for (const p of data.productions) {
    if (!['active', 'completed'].includes(p.status) || !within(p.date) || p.received !== true) continue;
    let qty, unit, stage;
    if (p.category === 'raw') { qty = p.receivedTotalPacks; unit = '팩'; stage = '생식 완성'; }
    if (p.category === 'freezeDry' && ['breadPan', 'frozenPan'].includes(p.receivedFreezeType)) {
      qty = p.receivedFreezeQty; unit = p.receivedFreezeType === 'breadPan' ? '빵판' : '동결판'; stage = '동결 생산';
    }
    if (!number(qty) || qty < 0) continue;
    take(production, p, 'productions/' + p.id, qty, unit, stage, 'recipe:' + (p.recipeId || p.id));
    for (const [index, ingredient] of (p.ingredientsSnapshot || []).entries()) {
      if (!number(ingredient.requiredQtyG) || ingredient.requiredQtyG < 0) continue;
      take(usage, p, 'productions/' + p.id, ingredient.requiredQtyG / 1000, 'kg', '계산상 사용량',
        'ingredient:' + (ingredient.meatTypeId || 'unlinked:' + p.id + ':' + index));
    }
  }
  for (const log of data.frozenLogs) {
    if (log.status !== 'active' || !within(log.date) || log.sampleSetLogId || !number(log.qty) || log.qty < 0) continue;
    const assembly = Array.isArray(log.componentsSnapshot) && log.componentsSnapshot.length > 0;
    if (!assembly && data.frozenProducts.some(p => p.id === log.productId && p.kind === 'sampleSet')) continue;
    take(production, log, 'frozenLogs/' + log.id, log.qty, assembly ? '세트' : '봉', assembly ? '샘플세트 조립' : '동결 포장', 'frozen:' + (log.productId || log.id));
  }
  const specs = [
    ['meatLogs', 'meatTypeId', 'frozenIncoming', ['productionDeduct', 'productionRollback'], 'kg', 1000, '원료', '재고 순차감'],
    ['bagLogs', 'bagTypeId', 'incoming', ['autoDeduct', 'autoDeductReverse'], '장', 1, '봉투', '봉투 순차감'],
    ['eggLogs', null, 'in', ['out'], '개', 1, '계란', '계란 출고'],
    ['supplementLogs', 'supplementTypeId', 'in', ['autoDeduct'], '봉', 1, '영양제', '영양제 순차감'],
  ];
  for (const [collection, id, incoming, deducted, unit, divisor, incomingStage, usedStage] of specs) for (const log of data[collection]) {
    if (!alive(log) || !within(log.date)) continue;
    const amount = collection === 'meatLogs' ? log.delta : log.qty;
    if (!number(amount)) continue;
    const itemId = collection + ':' + (id ? log[id] || 'unlinked:' + log.id : 'egg');
    if (log.type === incoming && amount > 0) {
      let incomingAmount = amount;
      if (collection === 'meatLogs') {
        const amendments = data.meatLogs.filter(r => r.type === 'incomingQuantityCorrection' && r.correctionOf === log.id);
        equal('correction uniqueness/' + log.id, true, amendments.length <= 1);
        if (amendments.length === 1) {
          const amendment = amendments[0], basis = data.meatLogs.find(r => r.id === amendment.basisAdjustmentId);
          equal('correction original quantity/' + log.id, amount, amendment.originalQtyG);
          equal('correction changes no stock/' + log.id, false, amendment.changesStock);
          equal('correction stock delta/' + log.id, 0, amendment.delta);
          equal('correction evidence quantity/' + log.id, basis?.after, amendment.correctedQtyG);
          equal('correction source date/' + log.id, log.date, amendment.date);
          incomingAmount = amendment.correctedQtyG;
        }
      }
      take(supply, log, collection + '/' + log.id, incomingAmount / divisor, unit, incomingStage, itemId);
    }
    if (deducted.includes(log.type)) take(usage, log, collection + '/' + log.id, -amount / divisor, unit, usedStage, itemId);
  }
  for (const s of data.schedules) {
    const completed = dateOf(s.completedAt), created = dateOf(s.createdAt);
    if (s.status !== 'completed' || !within(completed)) continue;
    const prior = created && isDate(s.date) ? diff(created, s.date) : null;
    const processing = created ? diff(created, completed) : null;
    registrations.push({ source: 'schedules/' + s.id, date: completed,
      prior: prior !== null && prior >= 0 ? prior : null, processing: processing !== null && processing >= 0 ? processing : null });
  }
  return { production, supply, usage, registrations };
}
const canonical = rows => rows.map(e => ({ source: e.source, date: e.date, qty: e.qty, unit: e.unit, stage: e.stage, itemId: e.itemId }))
  .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
function sourceGroups(rows, mode) {
  const result = new Map();
  for (const row of rows) {
    let period = '';
    if (mode === 'daily') period = row.date;
    if (mode === 'monthly') period = row.date.substring(0, 7);
    if (mode === 'weekly') { const d = new Date(row.date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1); period = d.toISOString().substring(0, 10); }
    const key = JSON.stringify([period, row.itemId, row.stage, row.unit]);
    result.set(key, (result.get(key) || 0) + row.qty);
  }
  return result;
}
const earliest = Object.values(data).flat().map(row => row.date).filter(d => isDate(d) && d <= today).sort()[0] || today;
const month = new Date(today + 'T00:00:00Z'); month.setUTCDate(1); month.setUTCMonth(month.getUTCMonth() - 2);
const ranges = [{ label: 'currentMonth', startDate: today.slice(0, 7) + '-01', endDate: today, today },
  { label: 'threeMonths', startDate: month.toISOString().slice(0, 10), endDate: today, today },
  { label: 'allHistory', startDate: earliest, endDate: today, today }];
const reconciliations = [];
for (const range of ranges) {
  const ref = independent(range), actual = { production: productionEvents(data, range), supply: supplyEvents(data, range), usage: usageEvents(data, range) };
  for (const type of ['production', 'supply', 'usage']) {
    const before = failures.length, events = actual[type].events, expected = ref[type];
    equal(range.label + '/' + type + '/events', canonical(expected), canonical(events));
    for (const mode of ['daily', 'weekly', 'monthly']) {
      const groups = sourceGroups(expected, mode);
      const projected = periodRows(events, mode);
      equal(range.label + '/' + type + '/' + mode + '/groups', groups.size, projected.length);
      for (const group of projected) equal(range.label + '/' + type + '/' + mode + '/' + group.name,
        groups.get(JSON.stringify([group.period, group.itemId, group.stage, group.unit])), group.qty);
    }
    for (const summary of summarize(events, range)) {
      const sourceRows = expected.filter(e => e.itemId === summary.events[0].itemId && e.stage === summary.stage && e.unit === summary.unit);
      const dates = [...new Set(sourceRows.map(e => e.date))].sort(), gaps = dates.slice(1).map((date, i) => diff(dates[i], date));
      const mean = gaps.length ? gaps.reduce((sum, n) => sum + n, 0) / gaps.length : null;
      equal(range.label + '/' + type + '/interval/' + summary.name, mean, summary.interval.mean);
      equal(range.label + '/' + type + '/intervalSamples/' + summary.name, gaps.length, summary.interval.count);
    }
    const totals = {};
    for (const e of events) { const key = e.stage + '/' + e.unit; totals[key] = (totals[key] || 0) + e.qty; }
    reconciliations.push({ range: range.label, type, eventCount: events.length, sourceMatch: failures.length === before, totals,
      unconfirmed: actual[type].unconfirmed?.length, missing: actual[type].missing?.length,
      excludedReceipts: actual[type].excludedReceipts?.length, registrationCount: actual[type].registrations?.length });
  }
  equal(range.label + '/registrations', ref.registrations.sort((a, b) => a.source.localeCompare(b.source)),
    actual.supply.registrations.map(r => ({ source: r.source, date: r.date, prior: r.prior, processing: r.processing })).sort((a, b) => a.source.localeCompare(b.source)));
}
const anomalies = {
  incomingQuantityCorrections: data.meatLogs.filter(l => l.type === 'incomingQuantityCorrection').map(l => ({
    id: l.id, source: l.correctionOf, originalQtyG: l.originalQtyG, correctedQtyG: l.correctedQtyG, changesStock: l.changesStock,
  })),
  missingDates: Object.fromEntries(collections.filter(c => !['frozenProducts', 'supplementTypes', 'productTransferRequests'].includes(c))
    .map(c => [c, data[c].filter(r => !isDate(r.date)).map(r => r.id)])),
  unconfirmed: productionEvents(data, ranges.at(-1)).unconfirmed,
  missingUsageSnapshots: usageEvents(data, ranges.at(-1)).missing,
  unlinkedIngredients: data.productions.filter(p => alive(p) && p.received === true)
    .flatMap(p => (p.ingredientsSnapshot || []).filter(i => !i.meatTypeId).map(i => ({ source: 'productions/' + p.id, ingredient: i.name }))),
  receiptBoxMismatches: data.productions.filter(p => alive(p) && p.received && p.category === 'raw' && number(p.receivedTotalPacks) &&
    number(p.receivedBox) && number(p.receivedRemainder) && p.receivedTotalPacks !== p.receivedBox * 20 + p.receivedRemainder).map(p => p.id),
  transferHeadMismatches: [],
};
for (const p of data.productions.filter(p => alive(p) && p.received && p.category === 'raw' && number(p.receivedTotalPacks))) {
  if (!p.receivedRevision) continue;
  const request = data.productTransferRequests.find(r => r.id === 'productions:' + p.id + ':' + p.receivedRevision);
  if (!request || request.packs !== p.receivedTotalPacks || request.producedDate !== p.date) anomalies.transferHeadMismatches.push({ source: p.id, revision: p.receivedRevision, requestExists: !!request });
}
const snapshotJson = JSON.stringify({ projectId, observedAt, data }, null, 2);
const report = { projectId, observedAt, readOnly: true, writeOperations: 0, snapshotHash: createHash('sha256').update(snapshotJson).digest('hex'),
  dateRange: ranges.at(-1), counts: Object.fromEntries(collections.map(c => [c, data[c].length])),
  comparisons, reconciliations, failures, anomalies };
await mkdir('output/stats-live-audit', { recursive: true });
await writeFile('output/stats-live-audit/snapshot.json', snapshotJson);
await writeFile('output/stats-live-audit/report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, failures: failures.slice(0, 10), anomalies: Object.fromEntries(Object.entries(anomalies).map(([name, rows]) => [name, Array.isArray(rows) ? rows.length : rows])) }, null, 2));
await db?.terminate();
if (failures.length || anomalies.receiptBoxMismatches.length || anomalies.transferHeadMismatches.length) process.exitCode = 1;
