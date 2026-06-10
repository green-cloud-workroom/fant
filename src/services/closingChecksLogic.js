// src/services/closingChecksLogic.js
//
// 마감 차단/경고 항목 판정 — 순수 함수 + 집계 함수.
// firebase 의존성 없음. 데이터 배열을 인자로 받아 판정만 수행.
// 단위 테스트(test.js)는 이 파일만 import해서 검증한다.

export const DEFAULT_CLOSING_FLAGS = {
  blockTomorrowProd: true,
  blockFrozenOrder: true,
  blockScheduleDue: true,
  blockAutoRepack: true,
  blockProdLog: true,
  blockOfficeLog: true,
  blockEggOut: true,
  blockProductReceipt: true,
  warnNoTomorrowProd: true,
  warnBagMin: true,
  warnMeatMin: true,
  warnSupplementMin: true,
};

/**
 * 1. 내일생산불러오기 처리 안 됨
 *
 * 차단 조건: 다음 영업일에 생산이 1개 이상 있고 + dateStr의
 * productionCompletion이 'completed' 상태로 존재하지 않으면 차단.
 * 다음 영업일에 생산이 없으면 처리할 게 없으므로 통과.
 *
 * @param {Array} nextDayProductions - 다음 영업일에 해당하는 productions 문서 배열 (status!=='deleted' 사전 필터됨)
 * @param {Array} completions - productionCompletion 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD' 마감하려는 날짜
 * @returns {{blocked: boolean, reason: string, count: number}}
 */
export function judgeTomorrowProductionLoaded(nextDayProductions, completions, dateStr) {
  // 다음 영업일에 production 없으면 처리할 게 없으므로 통과
  if (!nextDayProductions || nextDayProductions.length === 0) {
    return { blocked: false, reason: '', count: 0 };
  }

  // 해당 날짜에 productionCompletion이 'completed' 상태로 존재하는지
  const isCompleted = (completions || []).some(c =>
    c.runDate === dateStr && c.status === 'completed'
  );

  if (isCompleted) {
    return { blocked: false, reason: '', count: 0 };
  }

  return {
    blocked: true,
    reason: `다음 영업일 생산 ${nextDayProductions.length}건이 있는데 내일생산불러오기를 진행하지 않았습니다`,
    count: nextDayProductions.length
  };
}

/**
 * 2. 동결건조 발주 확인 처리 안 됨
 *
 * 차단 조건: type==='order' && date===dateStr 인 frozenPanStock 행 중
 * status가 'confirmed' 또는 'cancelled'가 아닌 것이 1개 이상 있으면 차단.
 *
 * (기존 데이터 호환을 위해 status 필드가 없거나 'pending', 빈 문자열인 경우도
 *  '미확인'으로 본다.)
 *
 * @param {Array} rows - frozenPanStock 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeFrozenOrdersConfirmed(rows, dateStr) {
  const unconfirmed = (rows || []).filter(r =>
    r.type === 'order' &&
    r.date === dateStr &&
    r.status !== 'confirmed' &&
    r.status !== 'cancelled'
  );

  return {
    blocked: unconfirmed.length > 0,
    reason: unconfirmed.length > 0
      ? `오늘 동결건조 발주 ${unconfirmed.length}건이 확인되지 않았습니다`
      : '',
    count: unconfirmed.length
  };
}

/**
 * 3. 입고 예정 완료/취소 처리 안 됨
 *
 * 차단 조건: date===dateStr && status==='scheduled' 인 schedules 행이
 * 1개 이상 있으면 차단.
 *
 * @param {Array} schedules - schedules 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeSchedulesProcessed(schedules, dateStr) {
  const unprocessed = (schedules || []).filter(s =>
    s.date === dateStr && s.status === 'scheduled'
  );

  return {
    blocked: unprocessed.length > 0,
    reason: unprocessed.length > 0
      ? `오늘 입고 예정 ${unprocessed.length}건이 완료/취소 처리되지 않았습니다`
      : '',
    count: unprocessed.length
  };
}

/**
 * 7. 계란 출고 미입력
 *
 * 차단 조건: date===dateStr && status!=='deleted' 인 productions 중
 * ingredientsSnapshot[i].name에 '노른자'가 포함된 항목이 있는 production이
 * 1개 이상 있고 + 같은 날짜에 eggLogs.type==='out' 기록이 0건이면 차단.
 *
 * 노른자 사용 production이 0이면 처리할 필요 없으므로 통과.
 *
 * @param {Array} productions - productions 컬렉션 전체 문서 배열
 * @param {Array} eggLogs - eggLogs 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeEggOutputForProduction(productions, eggLogs, dateStr) {
  // 1) 해당 날짜에 노른자 사용한 생산 카운트
  const eggUsingProductions = (productions || []).filter(p =>
    p.date === dateStr &&
    p.status !== 'deleted' &&
    (p.ingredientsSnapshot || []).some(ing =>
      (ing.name || '').includes('노른자')
    )
  );

  if (eggUsingProductions.length === 0) {
    return { blocked: false, reason: '', count: 0 };
  }

  // 2) 해당 날짜에 계란 출고 기록 있는지
  const hasEggOutput = (eggLogs || []).some(l =>
    l.date === dateStr && l.type === 'out'
  );

  if (hasEggOutput) {
    return { blocked: false, reason: '', count: 0 };
  }

  return {
    blocked: true,
    reason: `오늘 노른자 사용 생산 ${eggUsingProductions.length}건인데 계란 출고가 입력되지 않았습니다`,
    count: eggUsingProductions.length
  };
}

/**
 * 8. 생식 제품입고 미완료.
 *
 * 마감하려는 날짜의 raw 생산 중 제품입고가 완료되지 않은 카드가 있으면 차단한다.
 *
 * @param {Array} productions - productions 컬렉션 전체 문서 배열
 * @param {string} dateStr - 'YYYY-MM-DD'
 */
export function judgeProductReceiptsCompleted(productions, dateStr) {
  const unreceived = (productions || []).filter(p =>
    p.date === dateStr &&
    p.status !== 'deleted' &&
    (p.category === 'raw' || p.category === 'freezeDry') &&
    p.received !== true
  );

  return {
    blocked: unreceived.length > 0,
    reason: unreceived.length > 0
      ? `${dateStr} 제품입고 ${unreceived.length}건이 완료되지 않았습니다`
      : '',
    count: unreceived.length,
    details: unreceived.map(p => p.recipeName || p.id || '생산')
  };
}

/**
 * 4. 미확인 자동 재포장 로그 있음
 *
 * autoRepack:trigger / autoRepack:diff 는 전용 확인 모달/흐름이 있으므로
 * 생산 로그 미확인 항목(5번)에서 제외하고 여기서 전담한다.
 */
export function judgeAutoRepackLogsAcknowledged(activityLogs, dateStr) {
  const pending = (activityLogs || []).filter(log =>
    log.date === dateStr &&
    log.action === 'autoRepack' &&
    (log.subAction === 'trigger' || log.subAction === 'diff') &&
    log.acknowledged !== true
  );

  return {
    blocked: pending.length > 0,
    reason: pending.length > 0
      ? `자동 재포장 확인 ${pending.length}건 미완료`
      : '',
    count: pending.length
  };
}

const PRODUCTION_LOG_ACTIONS = new Set([
  'production',
  'repackaging',
  'pretreat',
  'event',
  'scheduleDue',
  'autoRepack',
  'minStock',
  'frozenStockLow',
]);

const OFFICE_LOG_ACTIONS = new Set([
  'bag',
  'egg',
  'meat',
  'frozenProduct',
  'frozenSep',
  'schedule',
  'frozenPan',
  'closing',
  'conversion',
]);

function classifyClosingLog(log) {
  const key = `${log.action}:${log.subAction}`;
  if (key === 'meat:adjust') return 'production';
  if (PRODUCTION_LOG_ACTIONS.has(log.action)) return 'production';
  if (OFFICE_LOG_ACTIONS.has(log.action)) return 'office';
  return 'ignore';
}

function isAutoRepackAckLog(log) {
  return log.action === 'autoRepack' &&
    (log.subAction === 'trigger' || log.subAction === 'diff');
}

function isMinimumStockAlertLog(log) {
  return log.action === 'minStock' && log.subAction === 'alert';
}

function summarizeClosingLog(log) {
  const action = log.action || 'unknown';
  const subAction = log.subAction || '-';
  const message = log.message || log.title || log.text || '(메시지 없음)';
  return `${action}:${subAction} — ${message}`;
}

/**
 * 5. 생산 로그 미확인 항목 있음
 */
export function judgeProductionLogsAcknowledged(activityLogs, dateStr) {
  const pending = (activityLogs || []).filter(log =>
    log.date === dateStr &&
    log.acknowledged !== true &&
    classifyClosingLog(log) === 'production' &&
    !isAutoRepackAckLog(log) &&
    !isMinimumStockAlertLog(log)
  );

  return {
    blocked: pending.length > 0,
    reason: pending.length > 0
      ? `생산 로그 미확인 항목 ${pending.length}건 있습니다`
      : '',
    count: pending.length,
    details: pending.map(summarizeClosingLog)
  };
}

/**
 * 6. 사무 로그 미확인 항목 있음
 */
export function judgeOfficeLogsAcknowledged(activityLogs, dateStr) {
  const pending = (activityLogs || []).filter(log =>
    log.date === dateStr &&
    log.acknowledged !== true &&
    classifyClosingLog(log) === 'office' &&
    !isMinimumStockAlertLog(log)
  );

  return {
    blocked: pending.length > 0,
    reason: pending.length > 0
      ? `사무 로그 미확인 항목 ${pending.length}건 있습니다`
      : '',
    count: pending.length,
    details: pending.map(summarizeClosingLog)
  };
}

/**
 * 경고 1. 내일 생산 입력 없음
 */
export function judgeNoTomorrowProduction(nextDayProductions) {
  const count = (nextDayProductions || []).length;
  return {
    warned: count === 0,
    reason: count === 0 ? '내일 생산 입력이 없습니다' : '',
    count: count === 0 ? 1 : 0
  };
}

/**
 * 경고 2. 봉투 최소재고 미달
 */
export function judgeBagMinimumStock(bagTypes) {
  const lowItems = (bagTypes || []).filter(b =>
    b.minimumQty && (b.currentQty || 0) < b.minimumQty
  );

  return {
    warned: lowItems.length > 0,
    reason: lowItems.length > 0
      ? `봉투 최소재고 미달 ${lowItems.length}건 있습니다`
      : '',
    count: lowItems.length,
    details: lowItems.map(b => {
      const current = b.currentQty || 0;
      const minimum = b.minimumQty || 0;
      const piecesPerBox = b.piecesPerBox || 0;
      const currentBox = piecesPerBox ? Math.floor(current / piecesPerBox) : null;
      const minimumBox = piecesPerBox ? Math.ceil(minimum / piecesPerBox) : null;
      const boxText = currentBox !== null && minimumBox !== null
        ? ` (${currentBox}박스 / 최소 ${minimumBox}박스)`
        : '';
      return `${b.name || b.id || '봉투'}: ${current}장 / 최소 ${minimum}장${boxText}`;
    })
  };
}

/**
 * 경고 3. 원육 최소재고 미달
 */
export function judgeMeatMinimumStock(meatTypes, meatStocks) {
  const openStocks = (meatStocks || []).filter(s => !s.closed);
  const lowItems = (meatTypes || []).map(mt => {
    if (!mt.minimumQtyG) return false;
    const total = openStocks
      .filter(s => s.meatTypeId === mt.id)
      .reduce((sum, s) => sum + (s.remaining || 0), 0);
    return total < mt.minimumQtyG
      ? { ...mt, currentQtyG: total }
      : null;
  }).filter(Boolean);

  return {
    warned: lowItems.length > 0,
    reason: lowItems.length > 0
      ? `원육 최소재고 미달 ${lowItems.length}건 있습니다`
      : '',
    count: lowItems.length,
    details: lowItems.map(mt => {
      const currentKg = ((mt.currentQtyG || 0) / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
      const minimumKg = ((mt.minimumQtyG || 0) / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 2 });
      return `${mt.name || mt.id || '원육'}: ${currentKg}kg / 최소 ${minimumKg}kg`;
    })
  };
}

export function judgeSupplementMinimumStock(supplementTypes, supplementStocks, minQty = 5) {
  const stockMap = new Map((supplementStocks || []).map(s => [s.id, s]));
  const lowItems = (supplementTypes || [])
    .filter(type => type.active !== false)
    .map(type => {
      const stock = stockMap.get(type.id);
      return {
        ...type,
        currentQty: stock ? Number(stock.currentQty || 0) : 0,
        minQty,
      };
    })
    .filter(type => type.currentQty < minQty);

  return {
    warned: lowItems.length > 0,
    reason: lowItems.length > 0
      ? `영양제 5봉 미만 ${lowItems.length}건 있습니다`
      : '',
    count: lowItems.length,
    details: lowItems.map(s =>
      `${s.name || s.id || '영양제'}: 현재 ${s.currentQty}봉 / 최소 ${s.minQty}봉`
    )
  };
}

/**
 * [Phase 3a 신규]
 * 차단 항목 메타데이터 — V1 차단 항목 1, 2, 3, 7번.
 *
 * label: 모달/배너에 표시할 짧은 고정 라벨
 * jumpMenu: 차단 항목 처리하러 갈 메뉴 ID (app.js MENUS의 id와 일치)
 *   1 → 메인 (내일생산불러오기 버튼이 메인에 있음)
 *   2 → 동결판 재고 (발주 행 확인)
 *   3 → 입고 예정관리 (완료/취소 처리)
 *   7 → 계란 (출고 입력)
 */
export const BLOCKING_ITEM_META = {
  1: { label: '내일생산불러오기 처리 안 됨', jumpMenu: 'main' },
  2: { label: '동결건조 발주 확인 처리 안 됨', jumpMenu: 'frozenPan' },
  3: { label: '입고 예정 완료/취소 처리 안 됨', jumpMenu: 'schedule' },
  4: { label: '자동 재포장 확인 미완료', jumpMenu: 'main' },
  5: { label: '생산 로그 미확인 항목 있음', jumpMenu: 'main' },
  6: { label: '사무 로그 미확인 항목 있음', jumpMenu: 'main' },
  7: { label: '계란 출고 미입력', jumpMenu: 'egg' },
  8: { label: '제품입고 미완료', jumpMenu: 'main' }
};

export const WARNING_ITEM_META = {
  1: { label: '내일 생산 입력 없음', jumpMenu: 'production' },
  2: { label: '봉투 최소재고 미달', jumpMenu: 'bag' },
  3: { label: '원육 최소재고 미달', jumpMenu: 'meat' },
  4: { label: '영양제 5봉 미만', jumpMenu: 'supplement' },
};

/**
 * [Phase 3a 신규]
 * 4개 차단 항목 결과를 집계해서 모달/배너용 데이터로 변환.
 *
 * blocked=true인 항목만 items에 포함. 항목 ID 순(1→2→3→7) 정렬.
 * 순수 함수 — Firestore 의존성 없음. 단위 테스트는 이 함수에서 수행.
 *
 * @param {Object} item1 - judgeTomorrowProductionLoaded 결과
 * @param {Object} item2 - judgeFrozenOrdersConfirmed 결과
 * @param {Object} item3 - judgeSchedulesProcessed 결과
 * @param {Object} item7 - judgeEggOutputForProduction 결과
 * @returns {{
 *   totalBlocked: number,
 *   items: Array<{ id: number, label: string, reason: string, count: number, jumpMenu: string }>
 * }}
 */
export function aggregateBlockingItems(results = {}, flags = DEFAULT_CLOSING_FLAGS) {
  const mergedFlags = { ...DEFAULT_CLOSING_FLAGS, ...(flags || {}) };
  const blockerMap = {
    1: { result: results.item1, flag: 'blockTomorrowProd' },
    2: { result: results.item2, flag: 'blockFrozenOrder' },
    3: { result: results.item3, flag: 'blockScheduleDue' },
    4: { result: results.item4, flag: 'blockAutoRepack' },
    5: { result: results.item5, flag: 'blockProdLog' },
    6: { result: results.item6, flag: 'blockOfficeLog' },
    7: { result: results.item7, flag: 'blockEggOut' },
    8: { result: results.item8, flag: 'blockProductReceipt' },
  };
  const warningMap = {
    1: { result: results.warn1, flag: 'warnNoTomorrowProd' },
    2: { result: results.warn2, flag: 'warnBagMin' },
    3: { result: results.warn3, flag: 'warnMeatMin' },
    4: { result: results.warn4, flag: 'warnSupplementMin' },
  };
  const items = [];
  const warnings = [];

  for (const id of [3, 2, 8, 7, 4, 5, 6, 1]) {
    const entry = blockerMap[id];
    const result = entry?.result;
    if (mergedFlags[entry.flag] && result && result.blocked) {
      items.push({
        id,
        label: BLOCKING_ITEM_META[id].label,
        reason: result.reason || '',
        count: result.count || 0,
        details: result.details || [],
        jumpMenu: BLOCKING_ITEM_META[id].jumpMenu
      });
    }
  }

  for (const id of [1, 2, 3, 4]) {
    const entry = warningMap[id];
    const result = entry?.result;
    if (mergedFlags[entry.flag] && result && result.warned) {
      warnings.push({
        id,
        label: WARNING_ITEM_META[id].label,
        reason: result.reason || '',
        count: result.count || 0,
        details: result.details || [],
        jumpMenu: WARNING_ITEM_META[id].jumpMenu
      });
    }
  }

  return {
    totalBlocked: items.length,
    items,
    totalWarnings: warnings.length,
    warnings,
    flags: mergedFlags
  };
}
