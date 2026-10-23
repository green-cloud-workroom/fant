// Append-only statistical decisions. Never mutate operational rows or balances.
// Evidence is compared field-for-field, including Timestamp seconds/nanoseconds.
export const STATS_CORRECTION_VERSION = 1;
export function canonicalEvidence(value) {
  if (value instanceof Date) return { seconds: Math.floor(value.getTime() / 1000), nanoseconds: value.getMilliseconds() * 1e6 };
  if (value && typeof value === 'object') {
    const seconds = value.seconds ?? value._seconds;
    if (typeof seconds === 'number') return { seconds, nanoseconds: value.nanoseconds ?? value._nanoseconds ?? 0 };
    if (Array.isArray(value)) return value.map(canonicalEvidence);
    return Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, canonicalEvidence(value[k])]));
  }
  return value;
}
export const evidenceKey = value => JSON.stringify(canonicalEvidence(value));
const kinds = new Set(['excludeSupply', 'retainSupply', 'includeSupply', 'includeUsage', 'excludeUsage', 'classifyUsage', 'hold']);
const allowed = new Set(['meatLogs', 'bagLogs', 'eggLogs', 'supplementLogs', 'stockLedger', 'productions', 'schedules']);
export function resolveStatsCorrections(data) {
  const decisions = [], dimensions = new Set(), seen = new Set(), superseded = new Set();
  const records = new Map((data.statsCorrections || []).map(c => [c.id,c]));
  const metric = c => c.kind === 'hold' ? c.metric : c.kind.includes('Supply') ? 'supply' : 'usage';
  for (const c of records.values()) if (c.supersedes) {
    const old = records.get(c.supersedes);
    if (!old || old.source !== c.source || metric(old) !== metric(c) || superseded.has(old.id)) throw Error('통계 정정 대체 근거가 충돌합니다.');
    superseded.add(old.id);
    const trail = new Set([c.id]); let p = old;
    while (p) { if (trail.has(p.id)) throw Error('통계 정정 대체 연결이 순환합니다.'); trail.add(p.id); p = records.get(p.supersedes); }
  }
  for (const c of data.statsCorrections || []) {
    if (seen.has(c.id)) throw Error('통계 정정 ID가 중복되었습니다.');
    seen.add(c.id);
    if (!c.id || c.schemaVersion !== STATS_CORRECTION_VERSION || c.changesStock !== false
      || !kinds.has(c.kind) || !c.reason?.trim() || !c.source || !Array.isArray(c.evidence) || !c.evidence.length
      || c.status !== 'active' || c.kind === 'hold' && !['supply', 'usage'].includes(c.metric)) throw Error('통계 정정 형식을 확인해주세요.');
    const dimension = c.source + ':' + (c.kind === 'hold' ? 'hold:' + c.metric : c.kind.includes('Supply') ? 'supply' : 'usage');
    if (!superseded.has(c.id)) {
      if (dimensions.has(dimension)) throw Error('같은 원본의 통계 정정이 충돌합니다.');
      dimensions.add(dimension);
    }
    for (const e of c.evidence) {
      const parts = e.path?.split('/') || [];
      if (parts.length !== 2 || !allowed.has(parts[0]) || !Array.isArray(data[parts[0]])) throw Error('통계 정정 근거 읽기가 완료되지 않았습니다.');
      const matches = data[parts[0]].filter(row => row.id === parts[1]);
      const actual = matches.length === 1 ? Object.fromEntries(Object.keys(e.expected || {}).map(k => [k, matches[0][k] ?? null])) : null;
      if (!actual || !Object.keys(e.expected || {}).length || evidenceKey(actual) !== evidenceKey(e.expected)) throw Error('통계 정정 원본·근거가 변경됐습니다. 정정을 다시 검증해주세요.');
    }
    if (!c.evidence.some(e => e.path === c.source)) throw Error('통계 정정 원본 근거가 없습니다.');
    if (c.kind === 'excludeSupply' || c.kind === 'retainSupply') {
      const [collection, id] = c.source.split('/'), source = data[collection]?.find(row => row.id === id);
      const type = { meatLogs: 'frozenIncoming', bagLogs: 'incoming', eggLogs: 'in', supplementLogs: 'in' }[collection];
      const qty = collection === 'meatLogs' ? source?.delta : source?.qty;
      if (!type || source?.type !== type || typeof qty !== 'number' || !Number.isFinite(qty) || qty <= 0) throw Error('취소 입고의 원본 종류·수량이 일치하지 않습니다.');
    }
    if (c.kind === 'excludeUsage' || c.kind === 'classifyUsage') {
      const [collection, id] = c.source.split('/'), source = data[collection]?.find(row => row.id === id);
      const amount = collection === 'meatLogs' ? source?.delta : source?.qty;
      if (typeof amount !== 'number' || !Number.isFinite(amount)) throw Error('사용 통계 분류 수량을 확인해주세요.');
      const cancelled = c.kind === 'excludeUsage' && collection === 'bagLogs' && source.type === 'autoDeduct' && amount < 0 && c.classification === 'cancelledExecution';
      const processing = c.kind === 'excludeUsage' && collection === 'meatLogs' && ['productionDeduct','repackedIn'].includes(source.type)
        && source.batchId === 'productionCompletion:2026-07-29' && c.classification === 'processingError' && c.unresolvedQuantity === true;
      if (c.kind === 'excludeUsage'
        ? !cancelled && !processing && (collection !== 'supplementLogs' || source?.type !== 'autoDeduct' || !(source.qty < 0) || c.classification !== 'test')
        : collection !== 'bagLogs' || source?.type !== 'adjust' || !(source.qty < 0) || c.classification !== 'stockReconciliation') {
        throw Error('사용 통계 분류의 원본 종류·수량이 일치하지 않습니다.');
      }
    }
    if (!superseded.has(c.id)) decisions.push(c);
  }
  return decisions;
}

export function correctedEvent(c, data) {
  const [collection, id] = c.source.split('/'), row = data[collection]?.find(r => r.id === id);
  const spec = {
    meatLogs: ['meatTypeId', 'meatNameSnapshot', 'kg', .001, '원료', '재고 순차감'],
    bagLogs: ['bagTypeId', 'bagNameSnapshot', '장', 1, '봉투', '봉투 순차감'],
    eggLogs: [null, null, '개', 1, '계란', '계란 출고'],
  }[collection];
  if (!row || !spec) throw Error('통계 정정 대상 종류를 확인해주세요.');
  const [idField, nameField, unit, scale, supplyStage, usageStage] = spec;
  const raw = collection === 'meatLogs' ? row.delta : row.qty;
  const valid = typeof raw === 'number' && Number.isFinite(raw)
    && (c.kind === 'includeSupply' ? row.type === 'adjust' && row.reason === '입고' && raw > 0
      : c.kind === 'includeUsage' ? collection === 'meatLogs' && row.type === 'repackedIn' && raw > 0
        && row.batchId?.startsWith('productionCompletion:') : false);
  if (!valid) throw Error('통계 정정 사건의 수량·종류가 일치하지 않습니다.');
  return { itemId: collection + ':' + (idField ? row[idField] || 'unlinked:' + id : 'egg'),
    name: row[nameField] || (collection === 'eggLogs' ? '계란' : row.id), date: row.date,
    qty: raw * scale * (c.kind === 'includeUsage' ? -1 : 1), unit,
    stage: c.kind === 'includeUsage' ? usageStage : supplyStage, source: c.source,
    product: row.relatedProductionId || '제품 연결 미기록', note: '통계 정정: ' + c.reason + ' · ' + c.id + ' · 재고 변동 없음' };
}
