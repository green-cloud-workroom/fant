// Read-only statistical projections. Quantities come from historical records,
// never from today's recipe, conversion, or stock balance.
import { applyIncomingCorrections } from './incomingCorrections.js';
import { resolveStatsCorrections, correctedEvent } from './statsCorrections.js';
const DAY = 86400000;
export const quantity = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function kstDate(value) {
  if (!value) return null;
  const ms = typeof value.toMillis === 'function' ? value.toMillis()
    : typeof value.seconds === 'number' ? value.seconds * 1000
    : value instanceof Date ? value.getTime() : NaN;
  return Number.isFinite(ms) ? new Date(ms + 9 * 3600000).toISOString().slice(0, 10) : null;
}
export const daysBetween = (a, b) => validDate(a) && validDate(b) ? (Date.parse(b) - Date.parse(a)) / DAY : null;
export const inRange = (date, range) => validDate(date) && date >= range.startDate && date <= range.endDate;
const active = row => row.status === 'active' || row.status === 'completed';
const unique = rows => [...new Map(rows.map(row => [row.id, row])).values()];
export function sample(values) {
  const xs = values.filter(value => quantity(value) !== null);
  const stats = xs.reduce((s, value) => ({ sum: s.sum + value, min: Math.min(s.min, value), max: Math.max(s.max, value) }),
    { sum: 0, min: Infinity, max: -Infinity });
  return { count: xs.length, mean: xs.length ? stats.sum / xs.length : null,
    min: xs.length ? stats.min : null, max: xs.length ? stats.max : null };
}
export function intervalSample(events) {
  const dates = [...new Set(events.map(e => e.date).filter(validDate))].sort();
  return { ...sample(dates.slice(1).map((date, i) => daysBetween(dates[i], date))), days: dates.length, lastDate: dates.at(-1) || null };
}
export function periodKey(date, aggregation) {
  if (aggregation === 'monthly') return date.slice(0, 7);
  if (aggregation === 'weekly') {
    const day = new Date(date + 'T00:00:00Z');
    day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
    return day.toISOString().slice(0, 10);
  }
  return date;
}
export function summarize(events, range) {
  const groups = new Map();
  for (const e of events) {
    const key = JSON.stringify([e.itemId, e.stage, e.unit]);
    if (!groups.has(key)) groups.set(key, { key, name: e.name, stage: e.stage, unit: e.unit, events: [] });
    groups.get(key).events.push(e);
  }
  return [...groups.values()].map(group => {
    const amounts = sample(group.events.map(e => e.qty));
    const interval = intervalSample(group.events);
    return { ...group, total: group.events.reduce((sum, e) => sum + e.qty, 0), amounts, interval,
      calendarMean: group.events.reduce((sum, e) => sum + e.qty, 0) / (daysBetween(range.startDate, range.endDate) + 1),
      workingMean: group.events.reduce((sum, e) => sum + e.qty, 0) / interval.days };
  }).sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.stage.localeCompare(b.stage, 'ko'));
}
export function periodRows(events, aggregation) {
  const groups = new Map();
  for (const e of events) {
    const period = periodKey(e.date, aggregation), key = JSON.stringify([period, e.itemId, e.stage, e.unit]);
    if (!groups.has(key)) groups.set(key, { period, itemId: e.itemId, name: e.name, stage: e.stage, unit: e.unit, qty: 0 });
    groups.get(key).qty += e.qty;
  }
  return [...groups.values()].sort((a, b) => a.period.localeCompare(b.period) || a.name.localeCompare(b.name, 'ko'));
}
export function productionEvents(data, range) {
  const events = [], unconfirmed = [], confirmed = [];
  for (const p of unique(data.productions || [])) {
    if (!active(p) || !inRange(p.date, range)) continue;
    let qty = null, unit = '', stage = '';
    if (p.received === true && p.date <= range.today) {
      if (p.category === 'raw') { qty = quantity(p.receivedTotalPacks); unit = '팩'; stage = '생식 완성'; }
      if (p.category === 'freezeDry' && ['breadPan', 'frozenPan'].includes(p.receivedFreezeType)) {
        qty = quantity(p.receivedFreezeQty); unit = p.receivedFreezeType === 'breadPan' ? '빵판' : '동결판'; stage = '동결 생산';
      }
    }
    if (qty === null || qty < 0) {
      unconfirmed.push({ date: p.date, name: p.recipeName || p.id, source: `productions/${p.id}`,
        reason: p.date > range.today ? '미래 생산 등록' : p.received !== true ? '실적 미확인' : '확정 수량 또는 단위 누락' });
      continue;
    }
    confirmed.push(p);
    events.push({ itemId: `recipe:${p.recipeId || p.id}`, name: p.recipeName || p.id, date: p.date,
      qty, unit, stage, source: `productions/${p.id}`, productionId: p.id,
      inputQty: quantity(p.productionUnitQty), inputUnit: p.productionUnitName || '단위 미기록' });
  }
  const masters = new Map((data.frozenProducts || []).map(p => [p.id, p]));
  for (const log of unique(data.frozenLogs || [])) {
    if (log.status !== 'active' || !inRange(log.date, range) || log.sampleSetLogId) continue;
    const qty = quantity(log.qty);
    const assembly = Array.isArray(log.componentsSnapshot) && log.componentsSnapshot.length > 0;
    if (qty === null || qty < 0 || log.date > range.today || (!assembly && masters.get(log.productId)?.kind === 'sampleSet')) {
      unconfirmed.push({ date: log.date, name: log.productNameSnapshot || log.id, source: `frozenLogs/${log.id}`, reason: '생산량 집계 제외: 수량·날짜·조립 유형 확인 필요' });
      continue;
    }
    events.push({ itemId: `frozen:${log.productId || log.id}`, name: log.productNameSnapshot || log.id, date: log.date,
      qty, unit: assembly ? '세트' : '봉', stage: assembly ? '샘플세트 조립' : '동결 포장', source: `frozenLogs/${log.id}`,
      inputQty: null, inputUnit: '' });
  }
  return { events, unconfirmed, confirmed };
}
function logEvents(data, corrections) {
  const excluded = new Set(corrections.filter(c => c.kind === 'excludeSupply').map(c => c.source));
  const meatLogs = applyIncomingCorrections(data.meatLogs || []);
  const supplements = new Map((data.supplementTypes || []).map(s => [s.id, s.name]));
  const specs = [
    ['meatLogs', 'frozenIncoming', 'meatTypeId', 'meatNameSnapshot', 'kg', 0.001, '원료'],
    ['bagLogs', 'incoming', 'bagTypeId', 'bagNameSnapshot', '장', 1, '봉투'],
    ['eggLogs', 'in', null, null, '개', 1, '계란'],
    ['supplementLogs', 'in', 'supplementTypeId', null, '봉', 1, '영양제'],
  ];
  return specs.flatMap(([collection, type, idField, nameField, unit, scale, stage]) => unique(collection === 'meatLogs' ? meatLogs : data[collection] || [])
    .filter(log => log.type === type && !excluded.has(collection + '/' + log.id) && !['deleted', 'cancelled', 'canceled'].includes(log.status))
    .map(log => ({ itemId: `${collection}:${idField ? log[idField] || 'unlinked:' + log.id : 'egg'}`,
      name: log[nameField] || (collection === 'supplementLogs' ? supplements.get(log.supplementTypeId) || log.supplementTypeId : null) || (stage === '계란' ? '계란' : `품목 미연결 (${log.id})`),
      date: log.date, qty: quantity(collection === 'meatLogs' ? log.delta : log.qty), unit, scale, stage, source: `${collection}/${log.id}`,
      note: log.incomingCorrection ? '입고량 정정: ' + log.incomingCorrection.originalQtyG / 1000 + 'kg → ' + log.incomingCorrection.correctedQtyG / 1000
        + 'kg · 재고 변동 없음 · 근거 meatLogs/' + log.incomingCorrection.id + ' · ' + log.incomingCorrection.reason : '' }))
    .map(e => ({ ...e, qty: e.qty === null ? null : e.qty * e.scale })))
    .concat(corrections.filter(c => c.kind === 'includeSupply').map(c => correctedEvent(c, data)));
}
export function supplyEvents(data, range) {
  const corrections = resolveStatsCorrections(data), candidates = logEvents(data, corrections);
  const pending = corrections.filter(c => c.kind === 'hold' && c.metric === 'supply').map(c => ({ ...c,
    event: candidates.find(e => e.source === c.source) })).filter(c => c.event && c.event.date <= range.endDate);
  const invalid = e => e.qty === null || e.qty <= 0 || !validDate(e.date);
  const excludedReceipts = candidates.filter(e => invalid(e) && (!validDate(e.date) || inRange(e.date, range)));
  const history = candidates.filter(e => !invalid(e) && e.date <= range.endDate && e.date <= range.today);
  const events = history.filter(e => inRange(e.date, range));
  const summaries = summarize(events, range);
  // Include items whose last receipt predates the selected period, without inventing a zero receipt.
  for (const group of summarize(history, range)) {
    let row = summaries.find(s => s.key === group.key);
    if (!row) { row = { ...group, events: [], total: null, amounts: sample([]), interval: intervalSample([]) }; summaries.push(row); }
    row.lastDate = group.interval.lastDate;
    row.elapsed = daysBetween(row.lastDate, range.endDate < range.today ? range.endDate : range.today);
  }
  const registrations = [], excludedSchedules = [];
  for (const s of unique(data.schedules || [])) {
    if (s.status !== 'completed') continue;
    const completedDate = kstDate(s.completedAt);
    if (!completedDate) { if (inRange(s.date, range)) excludedSchedules.push(s.id); continue; }
    if (!inRange(completedDate, range) || completedDate > range.today) continue;
    const createdDate = kstDate(s.createdAt);
    const prior = daysBetween(createdDate, s.date), processing = daysBetween(createdDate, completedDate);
    registrations.push({ date: completedDate, createdDate, scheduledDate: validDate(s.date) ? s.date : null,
      name: s.itemNameSnapshot || s.itemId || s.id, itemId: `${s.type}:${s.itemId || (s.type === 'egg' ? 'egg' : s.id)}`,
      stage: s.type === 'meat' ? '원료' : s.type === 'bag' ? '봉투' : s.type === 'egg' ? '계란' : s.type,
      prior: prior !== null && prior >= 0 ? prior : null, processing: processing !== null && processing >= 0 ? processing : null,
      source: `schedules/${s.id}`, note: !createdDate ? '등록일 누락' : prior < 0 || processing < 0 ? '날짜 순서 확인 필요' : '최종 예정일 기준' });
  }
  const registrationGroups = new Map();
  for (const row of registrations) {
    if (!registrationGroups.has(row.itemId)) registrationGroups.set(row.itemId, { name: row.name, stage: row.stage, rows: [] });
    registrationGroups.get(row.itemId).rows.push(row);
  }
  const adjustments = corrections.filter(c => c.kind !== 'hold' && c.kind.includes('Supply')).filter(c => {
    const [collection, id] = c.source.split('/'); return inRange(data[collection]?.find(r => r.id === id)?.date, range);
  });
  return { events, summaries, registrations, excludedSchedules, excludedReceipts, adjustments, pending,
    registrationSummary: [...registrationGroups.values()].map(g => ({ ...g, prior: sample(g.rows.map(r => r.prior)), processing: sample(g.rows.map(r => r.processing)) })) };
}
export function usageEvents(data, range) {
  const corrections = resolveStatsCorrections(data);
  const excluded = new Set(corrections.filter(c => c.kind === 'excludeUsage').map(c => c.source));
  const { confirmed, unconfirmed } = productionEvents({ productions: data.productions }, range);
  const events = [], missing = [];
  for (const p of confirmed) {
    if (!Array.isArray(p.ingredientsSnapshot) || !p.ingredientsSnapshot.length) missing.push(`productions/${p.id}`);
    for (const [i, ing] of (p.ingredientsSnapshot || []).entries()) {
      const qty = quantity(ing.requiredQtyG);
      if (qty === null || qty < 0) { missing.push(`productions/${p.id} ingredients[${i}]`); continue; }
      events.push({ itemId: `ingredient:${ing.meatTypeId || 'unlinked:' + p.id + ':' + i}`, name: ing.name || ing.meatTypeId || '원료명 미기록',
        date: p.date, qty: qty / 1000, unit: 'kg', stage: '계산상 사용량', product: p.recipeName || p.recipeId || p.id,
        source: `productions/${p.id}`, note: ing.meatTypeId ? '' : '품목 ID 미연결 · 다른 기록과 합산 제외' });
    }
  }
  const supplements = new Map((data.supplementTypes || []).map(s => [s.id, s.name]));
  for (const [collection, types, idField, nameField, unit, scale, stage] of [
    ['meatLogs', ['productionDeduct', 'productionRollback'], 'meatTypeId', 'meatNameSnapshot', 'kg', 0.001, '재고 순차감'],
    ['bagLogs', ['autoDeduct', 'autoDeductReverse'], 'bagTypeId', 'bagNameSnapshot', '장', 1, '봉투 순차감'],
    ['eggLogs', ['out'], null, null, '개', 1, '계란 출고'],
    ['supplementLogs', ['autoDeduct'], 'supplementTypeId', null, '봉', 1, '영양제 순차감'],
  ]) for (const log of unique(data[collection] || [])) {
    if (excluded.has(collection + '/' + log.id)) continue;
    if (!types.includes(log.type) || !inRange(log.date, range) || log.date > range.today || ['deleted', 'cancelled', 'canceled'].includes(log.status)) continue;
    const qty = quantity(collection === 'meatLogs' ? log.delta : log.qty);
    if (qty === null) { missing.push(`${collection}/${log.id}`); continue; }
    events.push({ itemId: `${collection}:${idField ? log[idField] || 'unlinked:' + log.id : 'egg'}`,
      name: log[nameField] || supplements.get(log.supplementTypeId) || log.supplementTypeId || (collection === 'eggLogs' ? '계란' : `품목 미연결 (${log.id})`),
      date: log.date, qty: -qty * scale, unit, stage, product: log.relatedProductionId || '제품 연결 미기록',
      source: `${collection}/${log.id}`, note: '기록일 기준 · 실제 투입 측정량과 다름' });
  }
  const additions = corrections.filter(c => c.kind === 'includeUsage').map(c => correctedEvent(c, data))
    .filter(e => inRange(e.date, range) && e.date <= range.today);
  events.push(...additions);
  const pending = corrections.filter(c => c.kind === 'hold' && c.metric === 'usage').filter(c => {
    const [collection, id] = c.source.split('/'); return inRange(data[collection]?.find(r => r.id === id)?.date, range);
  });
  const classifications = corrections.filter(c => ['excludeUsage', 'classifyUsage'].includes(c.kind)).filter(c => {
    const [collection, id] = c.source.split('/'); return inRange(data[collection]?.find(r => r.id === id)?.date, range);
  });
  return { events, missing, unconfirmed, pending, adjustments: additions, classifications };
}
