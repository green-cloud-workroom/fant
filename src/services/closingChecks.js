// src/services/closingChecks.js
//
// 마감 차단/경고 항목 체크 wrapper.
//
// Firestore에서 데이터를 fetch한 뒤 closingChecksLogic.js의 순수 함수로 판정.
// 각 함수 시그니처: (dateStr) => Promise<{ blocked: boolean, reason: string, count: number }>
//
import { db } from '../firebase.js';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { getNextBusinessDayByType } from '../utils/date.js';
import {
  DEFAULT_CLOSING_FLAGS,
  judgeTomorrowProductionLoaded,
  judgeFrozenOrdersConfirmed,
  judgeSchedulesProcessed,
  judgeEggOutputForProduction,
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
export async function checkTomorrowProductionLoaded(dateStr) {
  const nextDayProductions = await loadNextDayProductions(dateStr);

  // dateStr 시점의 productionCompletion 전체 (judge에서 필터)
  const compSnap = await getDocs(collection(db, 'productionCompletion'));
  const completions = compSnap.docs.map(d => d.data());

  return judgeTomorrowProductionLoaded(nextDayProductions, completions, dateStr);
}

/**
 * 2. 동결건조 발주 확인 처리 안 됨
 */
export async function checkFrozenOrdersConfirmed(dateStr) {
  const snap = await getDocs(collection(db, 'frozenPanStock'));
  const rows = snap.docs.map(d => d.data());
  return judgeFrozenOrdersConfirmed(rows, dateStr);
}

/**
 * 3. 입고 예정 완료/취소 처리 안 됨
 */
export async function checkSchedulesProcessed(dateStr) {
  const snap = await getDocs(collection(db, 'schedules'));
  const schedules = snap.docs.map(d => d.data());
  return judgeSchedulesProcessed(schedules, dateStr);
}

/**
 * 7. 계란 출고 미입력 (노른자 사용 생산이 있을 때만)
 */
export async function checkEggOutputForProduction(dateStr) {
  const prodSnap = await getDocs(collection(db, 'productions'));
  const productions = prodSnap.docs.map(d => d.data());

  const eggSnap = await getDocs(collection(db, 'eggLogs'));
  const eggLogs = eggSnap.docs.map(d => d.data());

  return judgeEggOutputForProduction(productions, eggLogs, dateStr);
}

export async function checkAutoRepackLogsAcknowledged(dateStr) {
  const logs = await loadActivityLogsByDate(dateStr);
  return judgeAutoRepackLogsAcknowledged(logs, dateStr);
}

export async function checkProductionLogsAcknowledged(dateStr) {
  const logs = await loadActivityLogsByDate(dateStr);
  return judgeProductionLogsAcknowledged(logs, dateStr);
}

export async function checkOfficeLogsAcknowledged(dateStr) {
  const logs = await loadActivityLogsByDate(dateStr);
  return judgeOfficeLogsAcknowledged(logs, dateStr);
}

export async function checkNoTomorrowProduction(dateStr) {
  const nextDayProductions = await loadNextDayProductions(dateStr);
  return judgeNoTomorrowProduction(nextDayProductions);
}

export async function checkBagMinimumStock() {
  const bagSnap = await getDocs(collection(db, 'bagTypes'));
  const bagTypes = bagSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  return judgeBagMinimumStock(bagTypes);
}

export async function checkMeatMinimumStock() {
  const meatTypesSnap = await getDocs(collection(db, 'meatTypes'));
  const meatTypes = meatTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const meatStocksSnap = await getDocs(collection(db, 'meatStocks'));
  const meatStocks = meatStocksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return judgeMeatMinimumStock(meatTypes, meatStocks);
}

export async function checkSupplementMinimumStock() {
  const typesSnap = await getDocs(query(
    collection(db, 'supplementTypes'),
    where('active', '==', true)
  ));
  const supplementTypes = typesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const stockSnap = await getDocs(collection(db, 'supplementStock'));
  const supplementStocks = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return judgeSupplementMinimumStock(supplementTypes, supplementStocks);
}

async function loadNextDayProductions(dateStr) {
  const nextBizDay = getNextBusinessDayByType(dateStr, 'production');
  const prodSnap = await getDocs(collection(db, 'productions'));
  return prodSnap.docs
    .map(d => d.data())
    .filter(p => p.date === nextBizDay && p.status !== 'deleted');
}

async function loadActivityLogsByDate(dateStr) {
  const snap = await getDocs(query(
    collection(db, 'activityLogs'),
    where('date', '==', dateStr)
  ));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadClosingFlags() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'closingFlags'));
    if (!snap.exists()) return DEFAULT_CLOSING_FLAGS;
    return { ...DEFAULT_CLOSING_FLAGS, ...snap.data() };
  } catch (err) {
    console.warn('[closingChecks] closingFlags 로드 실패, 기본값 ON 사용:', err);
    return DEFAULT_CLOSING_FLAGS;
  }
}

/**
 * [Phase 3a 신규]
 * 지정 날짜의 모든 마감 차단 항목 조회 — wrapper.
 *
 * V1 차단 항목 4개(1, 2, 3, 7)를 동시 조회 후 집계.
 * Promise.all로 병렬 호출 → 단일 호출 4번보다 빠름.
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
export async function getAllBlockingItems(dateStr) {
  const [
    item1,
    item2,
    item3,
    item4,
    item5,
    item6,
    item7,
    warn1,
    warn2,
    warn3,
    warn4,
    flags
  ] = await Promise.all([
    checkTomorrowProductionLoaded(dateStr),
    checkFrozenOrdersConfirmed(dateStr),
    checkSchedulesProcessed(dateStr),
    checkAutoRepackLogsAcknowledged(dateStr),
    checkProductionLogsAcknowledged(dateStr),
    checkOfficeLogsAcknowledged(dateStr),
    checkEggOutputForProduction(dateStr),
    checkNoTomorrowProduction(dateStr),
    checkBagMinimumStock(),
    checkMeatMinimumStock(),
    checkSupplementMinimumStock(),
    loadClosingFlags()
  ]);

  const aggregated = aggregateBlockingItems({
    item1,
    item2,
    item3,
    item4,
    item5,
    item6,
    item7,
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
