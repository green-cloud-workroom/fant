// src/services/closingChecks.js
//
// 마감 차단/경고 항목 체크 wrapper.
//
// Firestore에서 데이터를 fetch한 뒤 closingChecksLogic.js의 순수 함수로 판정.
// 각 함수 시그니처: (dateStr) => Promise<{ blocked: boolean, reason: string, count: number }>
//
import { createReadScope } from './readScope.js';
import { createServerReadScope } from './serverReadScope.js';
import { db } from '../firebase.js';
import { collection, doc, query, where, documentId } from 'firebase/firestore';
import { getNextBusinessDayByType, ensureHolidaysCache } from '../utils/date.js';
import { getEarliestUnclosedWorkday, isDateClosed } from '../closing.js';
import {
  DEFAULT_CLOSING_FLAGS,
  judgeTomorrowProductionLoaded,
  judgeFrozenOrdersConfirmed,
  judgeSchedulesProcessed,
  judgeEggOutputForProduction,
  judgeProductReceiptsCompleted,
  judgeAutoRepackLogsAcknowledged,
  judgeProductionLogsAcknowledged,
  judgeOfficeLogsAcknowledged,
  judgeNoTomorrowProduction,
  judgeBagMinimumStock,
  judgeMeatMinimumStock,
  judgeSupplementMinimumStock,
  aggregateBlockingItems
} from './closingChecksLogic.js';

/**
 * 1. 내일생산불러오기 처리 안 됨
 */
export async function checkTomorrowProductionLoaded(dateStr, scope = createReadScope()) {
  const nextDayProductions = await loadNextDayProductions(dateStr, scope);

  // dateStr 시점의 productionCompletion 전체 (judge에서 필터)
  const compSnap = await scope.getDocs(collection(db, 'productionCompletion'));
  const completions = compSnap.docs.map(d => d.data());

  return judgeTomorrowProductionLoaded(nextDayProductions, completions, dateStr);
}

/**
 * 2. 동결건조 발주 확인 처리 안 됨
 */
export async function checkFrozenOrdersConfirmed(dateStr, scope = createReadScope()) {
  const snap = await scope.getDocs(collection(db, 'frozenPanStock'));
  const rows = snap.docs.map(d => d.data());
  return judgeFrozenOrdersConfirmed(rows, dateStr);
}

/**
 * 3. 입고 예정 완료/취소 처리 안 됨
 */
export async function checkSchedulesProcessed(dateStr, scope = createReadScope()) {
  const snap = await scope.getDocs(collection(db, 'schedules'));
  const schedules = snap.docs.map(d => d.data());
  return judgeSchedulesProcessed(schedules, dateStr);
}

/**
 * 7. 계란 출고 미입력 (노른자 사용 생산이 있을 때만)
 */
export async function checkEggOutputForProduction(dateStr, scope = createReadScope()) {
  const prodSnap = await scope.getDocs(collection(db, 'productions'));
  const productions = prodSnap.docs.map(d => d.data());

  const eggSnap = await scope.getDocs(collection(db, 'eggLogs'));
  const eggLogs = eggSnap.docs.map(d => d.data());

  return judgeEggOutputForProduction(productions, eggLogs, dateStr);
}

/**
 * 8. 생식 제품입고 미완료
 */
export async function checkProductReceiptsCompleted(dateStr, scope = createReadScope()) {
  const prodSnap = await scope.getDocs(collection(db, 'productions'));
  const productions = prodSnap.docs.map(d => d.data());
  return judgeProductReceiptsCompleted(productions, dateStr);
}

export async function checkAutoRepackLogsAcknowledged(dateStr, scope = createReadScope()) {
  const logs = await loadActivityLogsByDate(dateStr, scope);
  return judgeAutoRepackLogsAcknowledged(logs, dateStr);
}

export async function checkProductionLogsAcknowledged(dateStr, scope = createReadScope()) {
  const logs = await loadActivityLogsByDate(dateStr, scope);
  return judgeProductionLogsAcknowledged(logs, dateStr);
}

export async function checkOfficeLogsAcknowledged(dateStr, scope = createReadScope()) {
  const logs = await loadActivityLogsByDate(dateStr, scope);
  return judgeOfficeLogsAcknowledged(logs, dateStr);
}

export async function checkNoTomorrowProduction(dateStr, scope = createReadScope()) {
  const nextDayProductions = await loadNextDayProductions(dateStr, scope);
  return judgeNoTomorrowProduction(nextDayProductions);
}

export async function checkBagMinimumStock(scope = createReadScope()) {
  const bagSnap = await scope.getDocs(collection(db, 'bagTypes'));
  const bagTypes = bagSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  return judgeBagMinimumStock(bagTypes);
}

export async function checkMeatMinimumStock(scope = createReadScope()) {
  const meatTypesSnap = await scope.getDocs(collection(db, 'meatTypes'));
  const meatTypes = meatTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const meatStocksSnap = await scope.getDocs(collection(db, 'meatStocks'));
  const meatStocks = meatStocksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return judgeMeatMinimumStock(meatTypes, meatStocks);
}

export async function checkSupplementMinimumStock(scope = createReadScope()) {
  const typesSnap = await scope.getDocs(query(
    collection(db, 'supplementTypes'),
    where('active', '==', true)
  ));
  const supplementTypes = typesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const stockSnap = await scope.getDocs(collection(db, 'supplementStock'));
  const supplementStocks = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return judgeSupplementMinimumStock(supplementTypes, supplementStocks);
}

async function loadNextDayProductions(dateStr, scope = createReadScope()) {
  const nextBizDay = getNextBusinessDayByType(dateStr, 'production');
  const prodSnap = await scope.getDocs(collection(db, 'productions'));
  return prodSnap.docs
    .map(d => d.data())
    .filter(p => p.date === nextBizDay && p.status !== 'deleted');
}

async function loadActivityLogsByDate(dateStr, scope = createReadScope()) {
  return scope.once('activityLogsForDate:' + dateStr, async () => {
    const snap = await scope.getDocs(query(
    collection(db, 'activityLogs'),
    where('date', '==', dateStr)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
}

async function loadClosingFlags(scope = createReadScope()) {
  try {
    const snap = await scope.getDoc(doc(db, 'settings', 'closingFlags'));
    if (!snap.exists()) return DEFAULT_CLOSING_FLAGS;
    return { ...DEFAULT_CLOSING_FLAGS, ...snap.data() };
  } catch (err) {
    if (scope.serverOnly) throw err;
    console.warn('[closingChecks] closingFlags 로드 실패, 기본값 ON 사용:', err);
    return DEFAULT_CLOSING_FLAGS;
  }
}

/**
 * [Phase 3a 신규]
 * 지정 날짜의 모든 마감 차단 항목 조회 — wrapper.
 *
 * 차단/경고 항목을 병렬 판정하며 같은 갱신 범위의 조회 결과를 공유한다.
 * 인자를 생략한 저장/마감 검사는 매번 새 scope로 최신 데이터를 읽는다.
 *
 * 사용처(예정):
 *   - Phase 3b: 빨간 배너 (차단 항목 N개 표시)
 *   - Phase 3c: 메뉴 ⚠️ 아이콘 (jumpMenu 매핑 사용)
 *   - Phase 3d: 로그인 직후 모달 (items 리스트 + 점프 버튼)
 *   - Phase 4: 마감 버튼 (totalBlocked > 0이면 마감 차단)
 *
 * @param {string} dateStr - 'YYYY-MM-DD' 마감하려는 날짜
 * @returns {Promise<{
 *   date: string,
 *   totalBlocked: number,
 *   items: Array<{ id: number, label: string, reason: string, count: number, jumpMenu: string }>
 * }>}
 */
export async function getAllBlockingItems(dateStr, scope = createServerReadScope()) {
  await scope.once('holidaysReady', () => ensureHolidaysCache(scope));
  const [
    item1,
    item2,
    item3,
    item4,
    item5,
    item6,
    item7,
    item8,
    warn1,
    warn2,
    warn3,
    warn4,
    flags
  ] = await Promise.all([
    checkTomorrowProductionLoaded(dateStr, scope),
    checkFrozenOrdersConfirmed(dateStr, scope),
    checkSchedulesProcessed(dateStr, scope),
    checkAutoRepackLogsAcknowledged(dateStr, scope),
    checkProductionLogsAcknowledged(dateStr, scope),
    checkOfficeLogsAcknowledged(dateStr, scope),
    checkEggOutputForProduction(dateStr, scope),
    checkProductReceiptsCompleted(dateStr, scope),
    checkNoTomorrowProduction(dateStr, scope),
    checkBagMinimumStock(scope),
    checkMeatMinimumStock(scope),
    checkSupplementMinimumStock(scope),
    loadClosingFlags(scope)
  ]);

  const aggregated = aggregateBlockingItems({
    item1,
    item2,
    item3,
    item4,
    item5,
    item6,
    item7,
    item8,
    warn1,
    warn2,
    warn3,
    warn4,
  }, flags);

  return {
    date: dateStr,
    totalBlocked: aggregated.totalBlocked,
    items: aggregated.items,
    totalWarnings: aggregated.totalWarnings,
    warnings: aggregated.warnings,
    flags: aggregated.flags
  };
}

/**
 * 오늘 화면/마감 버튼이 우선 처리해야 할 날짜를 찾는다.
 * - 과거 미마감 영업일
 * - 이미 마감됐지만 과거 생산일에 차단 항목이 남아 있는 날짜
 *
 * @param {string} today - 'YYYY-MM-DD'
 * @param {Array|null} productions - 이미 로드한 productions 배열(선택)
 * @returns {Promise<{date:string, closed:boolean, blockingData:Object}|null>}
 */
export function findActionableClosingDate(today, productions = null, scope = createServerReadScope()) {
  return scope.once('actionable:' + today, () => findActionableWithScope(today, productions, scope));
}

async function findActionableWithScope(today, productions, scope) {
  await scope.once('holidaysReady', () => ensureHolidaysCache(scope));
  const [earliestUnclosed, allProductions] = await Promise.all([
    scope.once('earliestUnclosed', () => getEarliestUnclosedWorkday([], scope)),
    productions || loadAllProductions(scope),
  ]);
  const productionDates = [...new Set((allProductions || [])
    .filter(p => p.date && p.date < today && p.status !== 'deleted')
    .map(p => p.date))]
    .sort()
    .slice(-14);

  const candidates = new Set(productionDates);
  if (earliestUnclosed && earliestUnclosed < today) candidates.add(earliestUnclosed);

  // At most 14 distinct production days plus the earliest unclosed day.
  // A failed batch falls back per day so a later failure cannot hide an earlier blocker.
  const dates = [...candidates].sort();
  if (!dates.length) return null;
  const closings = scope.getDocs(query(collection(db, 'closings'), where(documentId(), 'in', dates))).catch(() => null);
  const logs = scope.getDocs(query(collection(db, 'activityLogs'), where('date', 'in', dates))).catch(() => null);
  for (const date of dates) {
    scope.once('closed:' + date, async () => {
      const batch = await closings;
      if (!batch) return isDateClosed(date, scope);
      return batch.docs.find(d => d.id === date)?.data().status === 'closed';
    });
    scope.once('activityLogsForDate:' + date, async () => {
      const batch = await logs;
      const snapshot = batch || await scope.getDocs(query(collection(db, 'activityLogs'), where('date', '==', date)));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(row => row.date === date);
    });
  }

  // Fetch concurrently, but preserve the original earliest-date/error order.
  // Every candidate reuses the same refresh-scoped production/stock/log reads.
  const results = await Promise.allSettled([...candidates].sort().map(async date => {
    const [closed, blockingData] = await Promise.all([
      scope.once('closed:' + date, () => isDateClosed(date, scope)),
      getAllBlockingItems(date, scope),
    ]);
    return { date, closed, blockingData };
  }));
  for (const result of results) {
    if (result.status === 'rejected') throw result.reason;
    const candidate = result.value;
    if (!candidate.closed || candidate.blockingData.totalBlocked > 0) return candidate;
  }

  return null;
}

async function loadAllProductions(scope = createReadScope()) {
  const prodSnap = await scope.getDocs(collection(db, 'productions'));
  return prodSnap.docs.map(d => d.data());
}
