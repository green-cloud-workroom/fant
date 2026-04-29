// src/services/closingChecks.js
//
// 마감 차단 항목 체크 함수 4개 (Phase 2 — V1).
//
// Firestore에서 데이터를 fetch한 뒤 closingChecksLogic.js의 순수 함수로 판정.
// 각 함수 시그니처: (dateStr) => Promise<{ blocked: boolean, reason: string, count: number }>
//
// 차단 항목 4·5·6번은 알림 인프라(미확인 로그 시스템)가 만들어진 이후에 추가 예정.

import { db } from '../firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import { getNextBusinessDay } from '../utils/date.js';
import {
  judgeTomorrowProductionLoaded,
  judgeFrozenOrdersConfirmed,
  judgeSchedulesProcessed,
  judgeEggOutputForProduction
} from './closingChecksLogic.js';

/**
 * 1. 내일생산불러오기 처리 안 됨
 */
export async function checkTomorrowProductionLoaded(dateStr) {
  const nextBizDay = getNextBusinessDay(dateStr);

  // 다음 영업일 productions
  const prodSnap = await getDocs(collection(db, 'productions'));
  const nextDayProductions = prodSnap.docs
    .map(d => d.data())
    .filter(p => p.date === nextBizDay && p.status !== 'deleted');

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
