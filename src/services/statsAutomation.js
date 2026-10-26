// Additive, read-only decisions. The statistical projections remain authoritative.
import { validDate, daysBetween, supplyEvents, usageEvents, productionEvents, summarize, periodKey } from './statsLogic.js';
import {manualMovementIndex} from './manualMovementLogic.js';
import { cancellationChecks, duplicateReceiptChecks, explicitlyRemovedReceipt } from './receiptIntegrity.js';

export const AUTOMATION_VERSION = 'stats-shadow-v1';
// Release requires a separate reviewed code change. No UI/config can enable delivery.
export const DELIVERY_RELEASED = false;
export const AUTOMATION_SOURCES = Object.freeze(['productions', 'frozenLogs', 'frozenProducts', 'meatLogs',
  'bagLogs', 'eggLogs', 'supplementLogs', 'supplementTypes', 'schedules', 'bagTypes', 'eggStock', 'stockLedger', 'statsCorrections']);
export const DEFAULT_POLICY = Object.freeze({ lookbackDays: 90, minIntervals: 5, minAmounts: 6,
  anomalyRatio: 10, registrationBufferDays: 2, escalationWorkingDays: 2 });
const number = x => typeof x === 'number' && Number.isFinite(x);
export function addDays(date, count) {
  if (!validDate(date) || !Number.isInteger(count)) throw Error('Invalid date offset');
  return new Date(Date.parse(date) + count * 86400000).toISOString().slice(0, 10);
}
export function automationRange(today) {
  return { today, endDate: today, startDate: addDays(today, 1 - DEFAULT_POLICY.lookbackDays) };
}
const median = xs => { const sorted = [...xs].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
const linked = id => typeof id === 'string' && !id.includes('unlinked:');
const eventKey = e => JSON.stringify([e.itemId, e.stage, e.unit,
  e.stage === '계산상 사용량' ? [e.product, e.batchQty, e.batchUnit] : '']);
const issue = (kind, key, title, evidence, extra = {}) => ({ kind, key: JSON.stringify([kind, key]), title,
  evidence, severity: 'attention', target: kind === 'registration' ? 'schedule' : 'stats',
  recipientRoles: kind === 'registration' ? ['office'] : ['office', 'owner'], ...extra });
const integrityIssue = row => issue(row.kind, row.identity, row.title, row.evidence, { severity: 'review' });
const datedKinds = ['quantity', 'duplicateReceipt', 'cancellation'];

function timestampMillis(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const seconds = value?.seconds ?? value?._seconds;
  if (number(seconds)) return seconds * 1000 + (value.nanoseconds ?? value._nanoseconds ?? 0) / 1e6;
  return typeof value === 'string' ? Date.parse(value) : NaN;
}
export function followingStockAdjustments(data, event, today) {
  if (!event.source?.startsWith('meatLogs/')) return [];
  const source = (data.meatLogs || []).find(row => 'meatLogs/' + row.id === event.source);
  const started = timestampMillis(source?.timestamp);
  if (source?.type !== 'frozenIncoming' || !source.meatStockId || !source.meatTypeId || !source.stage || !Number.isFinite(started)) return [];
  return (data.meatLogs || []).filter(row => row.type === 'adjust' && row.id
    && !['deleted', 'cancelled', 'canceled'].includes(row.status)
    && row.meatStockId === source.meatStockId && row.meatTypeId === source.meatTypeId && row.stage === source.stage
    && validDate(row.date) && row.date >= source.date && row.date <= today
    && timestampMillis(row.timestamp) > started
    && timestampMillis(row.timestamp) <= Date.parse(today + 'T23:59:59.999+09:00')
    && [row.before, row.after, row.delta].every(number) && Math.abs(row.after - row.before - row.delta) < 1e-6)
    .sort((a, b) => timestampMillis(a.timestamp) - timestampMillis(b.timestamp) || String(a.id).localeCompare(String(b.id)))
    .map(row => ({ source: 'meatLogs/' + row.id, stockSource: 'meatStocks/' + source.meatStockId,
      at: new Date(timestampMillis(row.timestamp)).toISOString(), before: row.before / 1000, after: row.after / 1000,
      unit: 'kg', staff: typeof row.staff === 'string' && row.staff.trim() ? row.staff : '미기재',
      reason: typeof row.reason === 'string' && row.reason.trim() ? row.reason : '미기재' }));
}

export function adjustmentContextText(item) {
  const rows = item.kind === 'quantity' ? item.evidence.followingAdjustments || [] : [];
  if (!rows.length) return '';
  const fmt = n => n.toLocaleString('ko-KR', { maximumFractionDigits: 3 });
  return ['[같은 재고 건의 후속 조정 이력]', ...rows.map(row =>
    `${new Date(Date.parse(row.at) + 9 * 3600000).toISOString().slice(0, 19).replace('T', ' ')} KST · ${fmt(row.before)}${row.unit} → ${fmt(row.after)}${row.unit}\n담당: ${row.staff} / 사유: ${row.reason}\n조정 원본: ${row.source}`),
    '재고 조정 이력이며, 원본 입고량이 정정됐다는 의미는 아닙니다.'].join('\n');
}

// Supplement existing system text without reopening, acknowledging or overwriting a conversation.
export function confirmAdjustmentPatch(existing, item) {
  if (['duplicateReceipt', 'cancellation'].includes(item.kind)) {
    if (existing.cancelled || existing.statsResolvedAt || typeof existing.body !== 'string') return null;
    const next = '[입고·취소 추가 확인]\n' + evidenceText(item), previous = existing.statsIntegrityContextText || '';
    if (next === previous || previous && !existing.body.endsWith('\n\n' + previous)) return null;
    const base = previous ? existing.body.slice(0, -previous.length - 2) : existing.body;
    return { body: base + '\n\n' + next, statsIntegrityContextText: next };
  }
  if (item.kind !== 'quantity' || existing.cancelled || existing.statsResolvedAt || typeof existing.body !== 'string') return null;
  const next = adjustmentContextText(item), previous = existing.statsAdjustmentContextText || '';
  if (next === previous) return null;
  if (previous && !existing.body.endsWith('\n\n' + previous)) return null;
  const base = previous ? existing.body.slice(0, -previous.length - 2) : existing.body;
  return { body: base + (next ? '\n\n' + next : ''), statsAdjustmentContextText: next };
}

// Same item, unit, stage and (for calculated use) product, using only earlier days.
// Restorations are not compared to positive deductions; corrections are applied by supplyEvents.
export function quantityAssessment(candidate, history, policy = DEFAULT_POLICY) {
  if (!linked(candidate.itemId) || !validDate(candidate.date) || !number(candidate.qty) || candidate.qty <= 0) {
    return { state: 'unknown', reason: '유효한 품목·날짜·양수 수량 필요' };
  }
  if (candidate.stage === '계산상 사용량' && (!number(candidate.batchQty) || candidate.batchQty <= 0 || !candidate.batchUnit)) {
    return { state: 'unknown', reason: '생산 입력량·단위가 같은 비교 표본 필요' };
  }
  const rows = [...new Map(history.filter(e => eventKey(e) === eventKey(candidate) && e.source !== candidate.source
    && validDate(e.date) && e.date < candidate.date && number(e.qty) && e.qty > 0).map(e => [e.source, e])).values()];
  if (rows.length < policy.minAmounts) return { state: 'unknown', reason: '비교 표본 부족', samples: rows.length };
  const baseline = median(rows.map(e => e.qty));
  const ratio = candidate.qty / baseline;
  return { state: ratio >= policy.anomalyRatio || ratio <= 1 / policy.anomalyRatio ? 'review' : 'normal',
    baseline, ratio, samples: rows.length, unit: candidate.unit,
    reason: '이전 기록 중앙값 대비 수량 확인 · 오류 확정 아님' };
}

function scheduleItem(s) {
  return ({ meat: 'meatLogs:', bag: 'bagLogs:', egg: 'eggLogs:' })[s.type] + (s.type === 'egg' ? 'egg' : s.itemId);
}
function currentStocks(data) {
  // Only direct units with unambiguous current stock. Meat stages and supplement
  // half-bag equivalents are deliberately not summed into an invented stock basis.
  return [
    ...(data.eggStock || []).filter(s => s.id === 'global').map(s => ({ itemId: 'eggLogs:egg', name: '계란',
      unit: '개', qty: s.currentQty, minimum: s.minimumQty ?? null, source: 'eggStock/global' })),
    ...(data.bagTypes || []).filter(s => s.active !== false).map(s => ({ itemId: 'bagLogs:' + s.id,
      name: s.name || s.id, unit: '장', qty: s.currentQty, minimum: s.minimumQty ?? null, source: 'bagTypes/' + s.id })),
  ];
}
function comparableUsage(data, usage) {
  const productions = new Map((data.productions || []).map(p => ['productions/' + p.id, p]));
  // Automatic lot deductions can be split arbitrarily by FIFO and restoration.
  // Comparing one lot line with another is not an input-anomaly detector.
  return usage.events.filter(e => ['계란 출고', '계산상 사용량'].includes(e.stage)).map(e => {
    const p = productions.get(e.source);
    return e.stage === '계산상 사용량' ? { ...e, batchQty: p?.productionUnitQty, batchUnit: p?.productionUnitName } : e;
  });
}
function stockUsageUncertain(stock, data, usage) {
  const collection = stock.itemId.split(':')[0], types = collection === 'eggLogs' ? ['out'] : ['autoDeduct', 'autoDeductReverse'];
  return [...usage.pending, ...usage.classifications.filter(c => c.classification === 'stockReconciliation')].some(c => {
    const [name, id] = c.source.split('/'), row = data[name]?.find(r => r.id === id);
    return name === collection && stock.itemId === name + ':' + (row?.bagTypeId || (name === 'eggLogs' ? 'egg' : ''));
  }) || usage.missing.some(source => source.startsWith(collection + '/'))
    || (data[collection] || []).some(log => types.includes(log.type)
      && !['deleted', 'cancelled', 'canceled'].includes(log.status) && !validDate(log.date));
}
export function weeklySummary(data, today) {
  const monday = periodKey(today, 'weekly'), endDate = addDays(monday, -1), startDate = addDays(monday, -7);
  const range = { startDate, endDate, today };
  const production = productionEvents(data, range), supply = supplyEvents(data, range), usage = usageEvents(data, range);
  const clean = rows => rows.map(({ name, stage, unit, total }) => ({ name, stage, unit, total }));
  const due=(data.schedules||[]).filter(s=>validDate(s.date)&&s.date>=startDate&&s.date<=endDate
    && ['scheduled','completed'].includes(s.status)&&!supply.excludedSchedules.includes(s.id));
  return { key: 'weekly:' + startDate, startDate, endDate, kind: '공유',
    production: clean(summarize(production.events, range)), supply: clean(summarize(supply.events, range)),
    usage: clean(summarize(usage.events, range)),
    outlook: weeklyOutlook(data, today),
    scheduleCompletion:{due:due.length,completed:due.filter(s=>s.status==='completed').length},
    unknown: { production: production.unconfirmed.length, supply: supply.excludedReceipts.length + supply.pending.length, usage: usage.missing.length + usage.pending.length },
    note: '단계·단위를 합산하지 않음. 계산상 사용량과 재고 순차감은 별도. 기록 없음은 사용 0의 증거가 아님.' };
}

function scheduledAmount(s) {
  const q = s.orderedQty;
  if (!number(q) || q <= 0) return null;
  if (s.type === 'meat' && s.orderedUnit === 'kg') return { qty: q, unit: 'kg' };
  if (s.type === 'meat' && s.orderedUnit === 'g') return { qty: q / 1000, unit: 'kg' };
  if (s.type === 'egg' && ['개', '판'].includes(s.orderedUnit)) return { qty: q * (s.orderedUnit === '판' ? 30 : 1), unit: '개' };
  if (s.type === 'bag' && s.orderedUnit === '장') return { qty: q, unit: '장' };
  // Count-weight and box conversion must never be guessed from current masters.
  return null;
}

export function weeklyOutlook(data, today) {
  const range = automationRange(today), usage = usageEvents(data, range);
  const weekEnd = addDays(periodKey(today, 'weekly'), 6);
  const schedules = (data.schedules || []).filter(s => s.status === 'scheduled').map(s => ({
    source: 'schedules/' + s.id, itemId: scheduleItem(s), name: s.itemNameSnapshot || s.itemId || '품목 확인 필요',
    date: validDate(s.date) ? s.date : null, qty: number(s.orderedQty) ? s.orderedQty : null,
    unit: s.orderedUnit || '단위 확인 필요', amount: scheduledAmount(s) })).sort((a,b) => String(a.date).localeCompare(String(b.date)) || a.source.localeCompare(b.source));
  const forecasts = [], minimum = [], unavailable = [];
  for (const stock of currentStocks(data)) {
    const pending = schedules.filter(s => s.itemId === stock.itemId);
    if (number(stock.qty) && number(stock.minimum) && stock.minimum > 0 && stock.qty < stock.minimum) minimum.push({
      ...stock, hasSchedule: pending.length > 0, schedules: pending.map(s => ({ date:s.date, qty:s.qty, unit:s.unit })) });
    const events = usage.events.filter(e => e.itemId === stock.itemId && e.unit === stock.unit);
    const total = events.reduce((n,e) => n + e.qty, 0), days = new Set(events.filter(e => e.qty > 0).map(e => e.date)).size;
    const last = events.map(e => e.date).sort().at(-1);
    if (stockUsageUncertain(stock,data,usage) || !number(stock.qty) || stock.qty < 0 || total <= 0 || days < DEFAULT_POLICY.minAmounts
      || !last || daysBetween(last,today) > 14) { unavailable.push(stock.name); continue; }
    const daily = total / DEFAULT_POLICY.lookbackDays;
    const arrivals = pending.filter(s => s.date && s.date >= today && s.amount?.unit === stock.unit);
    // An arrival later than the first deficit cannot erase that earlier shortage.
    let available = stock.qty, shortageDate = null;
    for (let offset = 0; offset < 21; offset++) {
      const date = addDays(today,offset);
      available += arrivals.filter(s => s.date === date).reduce((n,s) => n + s.amount.qty,0);
      available -= daily;
      if (available < -1e-9) { shortageDate=date; break; }
    }
    if (shortageDate) forecasts.push({ ...stock, daily, daysWithoutReceipts: stock.qty / daily, shortageDate,
      horizon: daysBetween(today,shortageDate) < 14 ? 'twoWeeks' : 'thirdWeek',
      urgent: daysBetween(today,shortageDate) < 2, hasSchedule: pending.length > 0,
      uncertainSchedule: pending.some(s => !s.date || !s.amount || s.date < today),
      action: pending.length ? '예정 입고일·수량으로 부족을 막을 수 있는지 확인' : '발주 여부·입고 가능일 확인' });
  }
  return { schemaVersion:1, today, weekEnd, urgent:forecasts.filter(s => s.urgent),
    twoWeeks:forecasts.filter(s => !s.urgent && s.horizon === 'twoWeeks'), thirdWeek:forecasts.filter(s => s.horizon === 'thirdWeek'),
    minimum:minimum.filter(s => !forecasts.some(f => f.itemId === s.itemId)), unavailable,
    thisWeek:schedules.filter(s => s.date && s.date >= today && s.date <= weekEnd),
    later:schedules.filter(s => s.date && s.date > weekEnd && s.date < addDays(today,21)),
    overdue:schedules.filter(s => !s.date || s.date < today),
    coverageNote:'최근 90일 달력 일평균 순사용량과 등록된 입고 예정 기준 추정입니다. 원료·영양제 및 일부 봉투는 근거 부족으로 예측 보류하며, 전체 품목이 3주간 충분하다는 뜻은 아닙니다.' };
}

export function weeklyOutlookText(e) {
  const o=e.outlook, fmt=n => number(n) ? n.toLocaleString('ko-KR',{maximumFractionDigits:1}) : '확인 필요';
  if (!o) return `${e.startDate} ~ ${e.endDate}\n주간 상세는 생산앱 통계에서 확인해주세요.`;
  const row=s => `${s.name} ${s.qty === null ? '?' : fmt(s.qty)}${s.unit}`;
  const risk=s => `${s.name}: 재고 ${fmt(s.qty)}${s.unit} · ${s.shortageDate} 부족 예상 · ${s.hasSchedule?'입고 예정 있음':'입고 예정 없음'}\n→ ${s.action}`;
  const totals=new Map();for(const s of e.supply){const key=s.stage+' '+s.unit;totals.set(key,(totals.get(key)||0)+s.total);}
  return [`이번 주 입고·발주 확인｜${o.today} ~ ${o.weekEnd}`,
    ...(o.urgent.length?['🔴 즉시 확인',...o.urgent.map(risk)]:[]),
    ...([...o.twoWeeks,...o.thirdWeek].length?['🟠 2~3주 내 발주 확인',...[...o.twoWeeks,...o.thirdWeek].map(risk)]:[]),
    ...(o.minimum.length?['🟠 최소재고 미만',...o.minimum.map(s=>`${s.name}: ${fmt(s.qty)} / ${fmt(s.minimum)}${s.unit} · ${s.hasSchedule?'입고 예정 있음':'입고 예정 없음'}`)]:[]),
    '이번 주 입고 예정',...(o.thisWeek.length?o.thisWeek.map(s=>`${s.date} · ${row(s)}`):['등록된 예정 없음']),
    '2~3주 전망',`2주 내: ${[...o.urgent,...o.twoWeeks].length}품목 / 3주 차: ${o.thirdWeek.length}품목 (예측 가능한 범위)`,
    ...o.later.map(s=>`${s.date} 예정 · ${row(s)}`),o.coverageNote,
    ...(o.overdue.length?[`지난 날짜 또는 날짜 미확인 예정 ${o.overdue.length}건 확인 필요`]:[]),
    `지난주 입고: ${[...totals].map(([key,n])=>`${key.split(' ')[0]} ${fmt(n)}${key.split(' ')[1]}`).join(' · ')||'확인된 기록 없음'}`,
    ...(e.scheduleCompletion?[`지난주 예정 ${e.scheduleCompletion.due}건 중 ${e.scheduleCompletion.completed}건 완료`]:[])].join('\n\n');
}

export function evaluateStatsAutomation(data, { today, complete = false, policy = DEFAULT_POLICY } = {}) {
  if (!validDate(today)) throw Error('오늘 날짜가 필요합니다.');
  const range = automationRange(today), held = [], candidates = [];
  if (!complete || AUTOMATION_SOURCES.some(name => !Array.isArray(data[name]))) return { version: AUTOMATION_VERSION, mode: 'shadow', range, candidates,
    held: [{ reason: '전체 원본 읽기 완료 확인 필요' }], weekly: null, deliveryEnabled: false };
  const cancellation = cancellationChecks(data, range);
  candidates.push(...cancellation.issues.map(integrityIssue));
  // Broken cancellation evidence must not be silently removed to manufacture statistics.
  // Keep existing issues held, but allow the independent integrity checks to be delivered.
  if (cancellation.invalid.length) return { version: AUTOMATION_VERSION, mode: 'shadow', range,
    candidates, held: [{ reason: '취소 근거 불일치: 통계 기반 판단 보류', sources: cancellation.invalid }],
    weekly: null, integrityComplete: true, deliveryEnabled: false };
  const supply = supplyEvents(data, range), usage = usageEvents(data, range);
  const pendingSupply = new Set(supply.pending.map(c => c.event.itemId));
  const receiptHistory = supplyEvents(data, { ...range, startDate: '2000-01-01' });
  const duplicates = duplicateReceiptChecks(data, receiptHistory.events.filter(e => !pendingSupply.has(e.itemId)), range.startDate);
  candidates.push(...duplicates.map(integrityIssue));
  const duplicateSources = new Set(duplicates.map(row => row.evidence.source));
  held.push(...supply.pending.map(c => ({ source: c.source, itemId: c.event.itemId, reason: c.reason })),
    ...usage.pending.map(c => ({ source: c.source, reason: c.reason })));
  const schedules = data.schedules || [];
  for (const group of supply.summaries) {
    if (!linked(group.events[0]?.itemId)) continue;
    const itemId = group.events[0].itemId;
    if (pendingSupply.has(itemId)) continue;
    if (supply.excludedReceipts.some(e => e.itemId === itemId)) {
      held.push({ itemId, name: group.name, reason: '입고 이력에 유효하지 않은 수량·날짜 포함' }); continue;
    }
    if (group.interval.count < policy.minIntervals || group.elapsed > group.interval.mean * 3) {
      held.push({ itemId, name: group.name, reason: '입고 간격 표본 부족 또는 오래된 수급 패턴' }); continue;
    }
    const dueDate = addDays(group.lastDate, Math.ceil(group.interval.mean));
    const pending = schedules.filter(s => s.status === 'scheduled' && scheduleItem(s) === itemId);
    const upcoming = pending.some(s => validDate(s.date) && s.date >= today && s.date <= addDays(dueDate, policy.registrationBufferDays));
    if (!upcoming && today >= addDays(dueDate, -policy.registrationBufferDays)) {
      candidates.push(issue('registration', itemId, group.name + ' 입고예정 등록 확인',
        { itemId, lastDate: group.lastDate, meanInterval: group.interval.mean, samples: group.interval.count,
          suggestedDate: dueDate, pendingSources: pending.map(s => 'schedules/' + s.id),
          note: '입고 기록일 간격에 따른 확인 권고. 실제 발주일·도착일·납품 지연 판단 아님.' }));
    }
  }
  for (const events of [supply.events, comparableUsage(data, usage)]) {
    const comparisons = new Map();
    for (const event of events) {
      const key = eventKey(event);
      if (!comparisons.has(key)) comparisons.set(key, []);
      comparisons.get(key).push(event);
    }
    for (const event of events) {
      if (pendingSupply.has(event.itemId)) continue;
      if (duplicateSources.has(event.source)) continue;
      const assessment = quantityAssessment(event, comparisons.get(eventKey(event)), policy);
      if (assessment.state === 'review') candidates.push(issue('quantity', [event.source, event.itemId, event.stage],
        event.name + ' 수량 확인', { ...assessment, source: event.source, itemId: event.itemId, qty: event.qty,
          date: event.date, stage: event.stage, followingAdjustments: followingStockAdjustments(data, event, today) }, { severity: 'review', target: event.itemId.startsWith('meatLogs:') ? 'meat' : 'stats' }));
    }
  }
  for (const stock of currentStocks(data)) {
    if (stockUsageUncertain(stock, data, usage)) {
      held.push({ itemId: stock.itemId, name: stock.name, reason: '실사 보정 또는 미확인·누락 이력: 부분 사용량으로 소진 예측 안 함' }); continue;
    }
    const events = usage.events.filter(e => e.itemId === stock.itemId && e.unit === stock.unit);
    const total = events.reduce((sum, e) => sum + e.qty, 0);
    const distinctDays = new Set(events.filter(e => e.qty > 0).map(e => e.date)).size;
    const lastDate = events.map(e => e.date).sort().at(-1);
    if (!number(stock.qty) || stock.qty < 0 || distinctDays < policy.minAmounts || total <= 0
      || !lastDate || daysBetween(lastDate, today) > 14) {
      held.push({ itemId: stock.itemId, name: stock.name, reason: '재고·사용 표본·최근성 부족' }); continue;
    }
    // Calendar average and signed reversals follow the existing usage contract.
    const daily = total / (daysBetween(range.startDate, range.endDate) + 1);
    const daysLeft = stock.qty / daily;
    if (number(stock.minimum) && stock.minimum > 0 && stock.qty < stock.minimum) {
      held.push({ itemId: stock.itemId, name: stock.name, reason: '기존 최소재고 알림 담당 · 중복 전달 제외', daysLeft }); continue;
    }
    if (daysLeft <= policy.registrationBufferDays) candidates.push(issue('shortage', stock.itemId,
      stock.name + ' 소진 위험 검토', { ...stock, calendarDailyMean: daily, estimatedDaysLeft: daysLeft,
        note: '최근 90일 기록상 순사용 추정. 수동 보충 여유 2일 기준 · 납품 소요일 아님.' }, { severity: 'urgent' }));
  }
  held.push({ reason: '원육 단계별 재고·영양제 환산 단위의 사용량 대응 검증 전: 소진 예측 보류' });
  held.push({ reason: '자동 차감의 lot 분할·복원은 수량 이상 비교 제외. 계산상 사용량은 같은 제품·생산 입력량·입력 단위끼리만 비교' });
  if (!(data.eggStock || []).some(s => s.id === 'global')) held.push({ name: '계란', reason: '현재 재고 문서 미확인' });
  return { version: AUTOMATION_VERSION, mode: 'shadow', range, candidates, held,
    weekly: weeklySummary(data, today), deliveryEnabled: false,
    coverage: { excludedReceipts: supply.excludedReceipts.length, missingUsage: usage.missing.length } };
}

export function workingDaysBetween(start, end, holidays) {
  if (!validDate(start) || !validDate(end) || !Array.isArray(holidays)) return null;
  let count = 0;
  for (let day = addDays(start, 1); day <= end; day = addDays(day, 1)) {
    const weekday = new Date(day).getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !holidays.includes(day)) count++;
  }
  return count;
}

// Seen/ack is per recipient, never issue resolution. Missing/partial evaluations
// cannot close an existing issue. Reappearance after source resolution is a new episode.
export function reconcileIssues(previous, evaluation, { today, holidays = [], calendarComplete = false } = {}) {
  if ((!evaluation.weekly && !evaluation.integrityComplete) || evaluation.mode !== 'shadow') return previous;
  const next = structuredClone(previous), active = new Set();
  for (const candidate of evaluation.candidates) {
    // Reuse an already delivered quantity issue for the very same source; do not
    // create another personal confirm just because a stronger integrity rule now applies.
    const reused = candidate.kind === 'duplicateReceipt' && Object.values(previous).find(row =>
      (row.state === 'open' || row.resolution?.type === 'normal') && ['quantity', 'duplicateReceipt'].includes(row.kind) && row.evidence.source === candidate.evidence.source);
    const item = reused ? { ...candidate, key: reused.key } : candidate;
    active.add(item.key);
    const old = next[item.key];
    if (old?.state === 'resolved' && old.resolution?.type === 'normal'
      && old.resolution.fingerprint === normalIssueFingerprint(item)) continue;
    const episode = old?.state === 'open' ? old.episode : (old?.episode || 0) + 1;
    const started = old?.state === 'open' ? old.firstSeen : today;
    const escalated = item.kind === 'registration' && calendarComplete
      && workingDaysBetween(started, today, holidays) >= DEFAULT_POLICY.escalationWorkingDays;
    const level = item.kind === 'quantity' ? Math.min(6, Math.floor(Math.log10(Math.max(item.evidence.ratio, 1 / item.evidence.ratio))))
      : item.kind === 'shortage' ? item.evidence.estimatedDaysLeft <= 0.5 ? 2 : item.evidence.estimatedDaysLeft <= 1 ? 1 : 0 : 0;
    next[item.key] = { ...item, episode, state: 'open', firstSeen: started, lastSeen: today,
      // Aging is a single escalation, not a daily notification revision.
      escalation: escalated || (old?.state === 'open' && old.escalation === 1) ? 1 : 0,
      notificationLevel: Math.max(level, old?.state === 'open' ? old.notificationLevel || 0 : 0),
      recipientRoles: escalated || (old?.state === 'open' && old.escalation === 1) ? ['office', 'owner'] : item.recipientRoles,
      acknowledgements: old?.state === 'open' ? old.acknowledgements || {} : {},
      history: old?.history || [] };
  }
  // Source resolution must be explicitly proven, not inferred from a new hold or missing baseline.
  for (const [key, row] of Object.entries(next)) if (row.state === 'open' && !active.has(key)) {
    if (evaluation.resolvedKeys?.includes(key)) next[key] = { ...row, state: 'resolved', resolvedAt: today,
      history: [...row.history, { episode: row.episode, firstSeen: row.firstSeen, resolvedAt: today }] };
    else next[key] = { ...row, evaluationState: 'held', lastEvaluated: today };
  }
  return next;
}

// Compare source facts, not rolling medians, elapsed days or appended stock context.
// A new source/counterpart/quantity must be reviewed again; unchanged facts stay closed.
export function normalIssueFingerprint(item) {
  if (!['quantity', 'duplicateReceipt', 'cancellation'].includes(item?.kind)) return null;
  const e = item.evidence || {};
  return JSON.stringify([item.kind, ...['source', 'originalSource', 'itemId', 'date', 'originalDate',
    'qty', 'originalQty', 'cancelQty', 'remainingQty', 'unit', 'stage', 'problem'].map(k => e[k] ?? null),
    [...(e.scheduleIds || [])].sort()]);
}

export function normalResolutionReason(item, input, request) {
  const choices = { separateReceipt: '서로 다른 실제 입고입니다', actualAmount: '실제 수량이 맞습니다' };
  if (input.reasonCode === 'separateReceipt' && item.kind !== 'duplicateReceipt') throw Error('중복입고 확인에서만 선택할 수 있습니다.');
  if (input.reasonCode === 'actualAmount' && item.kind !== 'quantity') throw Error('수량 확인에서만 선택할 수 있습니다.');
  if (input.reasonCode === 'existingReply') {
    const reply = request.replies?.[input.replyIndex];
    if (!Number.isInteger(input.replyIndex) || !reply?.text?.trim()) throw Error('사용할 기존 답변을 선택해주세요.');
    if (input.replyText !== reply.text) throw Error('선택한 답변이 변경됐습니다. 다시 선택해주세요.');
    return reply.text.trim();
  }
  if (choices[input.reasonCode]) return choices[input.reasonCode];
  if (input.reasonCode === 'other' && typeof input.reason === 'string' && input.reason.trim().length <= 1000 && input.reason.trim()) return input.reason.trim();
  throw Error('정상으로 판단한 사유를 선택하거나 입력해주세요.');
}

export function deliveryIdentity(item, recipientUid) {
  return JSON.stringify([AUTOMATION_VERSION, item.key, item.episode || 1, item.escalation || 0, item.notificationLevel || 0, recipientUid]);
}
export function confirmPayload(item, recipient, today, requestId) {
  const system = { uid: 'system:production-stats', name: '생산 통계 알림' };
  const weekly = item.kind === 'weekly';
  const context = adjustmentContextText(item);
  const integrity = ['duplicateReceipt', 'cancellation'].includes(item.kind) ? '[입고·취소 추가 확인]\n' + evidenceText(item) : '';
  return { kind: weekly ? '공유' : '요청', requesterUid: system.uid, requesterName: system.name,
    approverUid: recipient.uid, approverName: recipient.name,
    participantUids: [system.uid, recipient.uid], participantNames: { [system.uid]: system.name, [recipient.uid]: recipient.name },
    date: today, effectiveDate: today, deferredFrom: null, title: item.title,
    ...(weekly && item.evidence.outlook ? { statsWeeklyReport: item.evidence } : {}),
    body: [item.title, integrity ? '' : evidenceText(item), weekly ? '' : '확인은 읽음 표시입니다. 원본의 문제 해결 상태와 별도입니다.'].filter(Boolean).join('\n')
      + (context ? '\n\n' + context : '') + (integrity ? '\n\n' + integrity : ''),
    ...(context ? { statsAdjustmentContextText: context } : {}),
    ...(integrity ? { statsIntegrityContextText: integrity } : {}),
    linkUrl: 'https://green-cloud-workroom.github.io/fant/#' + (['schedule', 'meat', 'stats'].includes(item.target) ? item.target : 'stats'),
    statsSource: { version: AUTOMATION_VERSION, key: item.key, episode: item.episode || 1,
      escalation: item.escalation || 0, notificationLevel: item.notificationLevel || 0 },
    boardPublic: false, status: '대기', answer: '', replies: [], lastActorUid: system.uid,
    answerSeen: true, contentRevision: 1, creationCommandId: requestId };
}

function evidenceText(item) {
  const e = item.evidence, fmt = v => number(v) ? v.toLocaleString('ko-KR', { maximumFractionDigits: 3 }) : '확인 불가';
  if (item.kind === 'registration') return `최근 입고 기록: ${e.lastDate}\n평균 입고 간격: ${fmt(e.meanInterval)}일 (간격 표본 ${e.samples}개)\n확인 권고 시점: ${e.suggestedDate}\n입고예정관리에서 등록 여부와 일정을 확인해주세요.\n${e.note}`;
  if (item.kind === 'quantity') return `기록일: ${e.date}\n수량: ${fmt(e.qty)}${e.unit}\n이전 수량 중앙값: ${fmt(e.baseline)}${e.unit} (표본 ${e.samples}건)\n입력 수량과 단위를 확인해주세요. 오류로 확정한 알림은 아닙니다.\n원본: ${e.source}`;
  if (item.kind === 'duplicateReceipt') return `먼저 기록된 입고: ${e.originalDate} · ${fmt(e.originalQty)}${e.unit}\n확인이 필요한 입고: ${e.date} · ${fmt(e.qty)}${e.unit}\n판단 근거: ${e.basis}\n${e.scheduleIds.length ? '입고예정: ' + e.scheduleIds.join(', ') + '\n' : ''}실제로 각각 입고됐는지 확인해주세요. 오류 확정이나 자동 재고 조정은 아닙니다.\n비교 원본: ${e.originalSource}\n확인 원본: ${e.source}`;
  if (item.kind === 'cancellation') return `취소 기록일: ${e.date}\n원본 기록일: ${e.originalDate}\n원본 수량: ${fmt(e.qty)}${e.unit}\n취소 수량: ${fmt(e.cancelQty)}${e.unit}\n합산 잔량: ${fmt(e.remainingQty)}${e.unit}\n확인 사항: ${e.problem}\n사유: ${e.reason}\n원본 연결·품목·반대 수량과 처리 이력을 확인해주세요. 자동 재고 조정은 하지 않습니다.\n취소 대상: ${e.originalSource}\n취소 기록: ${e.source}`;
  if (item.kind === 'shortage') return `현재 재고: ${fmt(e.qty)}${e.unit}\n기록상 달력 일평균: ${fmt(e.calendarDailyMean)}${e.unit}\n추정 잔여: ${fmt(e.estimatedDaysLeft)}일\n현재 재고와 보충 필요 여부를 확인해주세요.\n${e.note}`;
  if (item.kind === 'weekly') return weeklyOutlookText(e);
  throw Error('알 수 없는 알림 종류');
}

// Activation does not backfill historical quantity warnings or old weekly reports.
export function planStatsDeliveries(issues, weekly, { today, activationDate }) {
  if (!validDate(activationDate) || activationDate > today) return [];
  const rows = Object.values(issues).filter(row => row.state === 'open' && row.evaluationState !== 'held'
    && (!datedKinds.includes(row.kind) || row.evidence.date >= activationDate));
  if (new Date(today).getUTCDay() === 1 && weekly && weekly.endDate >= activationDate
    && !weekly.unknown?.supply && !weekly.unknown?.usage) rows.push({
    key: weekly.key, kind: 'weekly', title: '이번 주 입고·발주 확인', evidence: weekly,
    episode: 1, escalation: 0, target: 'stats', recipientRoles: ['office', 'owner'] });
  return rows;
}

export function provenResolutions(previous, data, today) {
  const range = automationRange(today), cancellation = cancellationChecks(data, range);
  const invalid = new Set(cancellation.invalid);
  const cancellationResolved = Object.values(previous).filter(row => row.state === 'open' && row.kind === 'cancellation'
    && !invalid.has(row.evidence.source) && data[row.evidence.source.split('/')[0]]?.some(r =>
      r.id === row.evidence.source.split('/')[1] && r.manualMovement?.kind === 'cancel')).map(row => row.key);
  if (invalid.size) return cancellationResolved;
  const supply = supplyEvents(data, range), usage = usageEvents(data, range);
  return Object.values(previous).filter(row => {
    if (row.state !== 'open') return false;
    if (row.kind === 'cancellation') return cancellationResolved.includes(row.key);
    if (row.kind === 'duplicateReceipt') return [row.evidence.source, row.evidence.originalSource]
      .some(path => explicitlyRemovedReceipt(data, supply, path));
    if (supply.pending.some(c => c.event.itemId === row.evidence.itemId)) return false;
    if (row.kind === 'registration') return (data.schedules || []).some(s => s.status === 'scheduled'
      && scheduleItem(s) === row.evidence.itemId && validDate(s.date) && s.date >= today
      && s.date <= addDays(row.evidence.suggestedDate, DEFAULT_POLICY.registrationBufferDays))
      || supply.events.some(e => e.itemId === row.evidence.itemId && e.date > row.evidence.lastDate);
    if (row.kind === 'quantity') {
      const [collection, id] = row.evidence.source.split('/');
      if ((data[collection] || []).some(s => s.id === id && ['deleted', 'cancelled', 'canceled'].includes(s.status))) return true;
      if (supply.adjustments.some(c => c.kind === 'excludeSupply' && c.source === row.evidence.source)) return true;
      if(manualMovementIndex(data).has(row.evidence.source))return true;
      const events = row.evidence.stage === '계산상 사용량' || row.evidence.stage?.includes('차감')
        || row.evidence.stage === '계란 출고' ? comparableUsage(data, usage) : supply.events;
      const event = events.find(e => e.source === row.evidence.source && e.itemId === row.evidence.itemId && e.stage === row.evidence.stage);
      return event && quantityAssessment(event, events).state === 'normal';
    }
    if (row.kind === 'shortage') {
      const stock = currentStocks(data).find(s => s.itemId === row.evidence.itemId);
      if (!stock || stockUsageUncertain(stock, data, usage)) return false;
      const events = usage.events.filter(e => e.itemId === stock?.itemId && e.unit === stock?.unit);
      const total = events.reduce((sum, e) => sum + e.qty, 0);
      const lastDate = events.map(e => e.date).sort().at(-1);
      return stock && number(stock.qty) && total > 0 && lastDate && daysBetween(lastDate, today) <= 14
        && new Set(events.filter(e => e.qty > 0).map(e => e.date)).size >= DEFAULT_POLICY.minAmounts
        && stock.qty / (total / DEFAULT_POLICY.lookbackDays) > DEFAULT_POLICY.registrationBufferDays;
    }
    return false;
  }).map(row => row.key);
}
