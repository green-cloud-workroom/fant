// 마감 인프라 모듈 (Phase 1A)
//
// 일자별 마감 상태 관리. 마감 시점에 모든 stock 잔량 스냅샷 기록.
// 스키마: src/utils/firestoreSchemas.md
//
// 핵심 함수:
//   - isDateClosed(dateStr)               : 날짜가 마감되었는지 판정
//   - getLastClosedDate()                 : 마지막 마감 날짜
//   - getEarliestUnclosedWorkday()        : 가장 빠른 미마감 영업일 (마감 버튼 대상)
//   - closeDate(dateStr, staff)           : 마감 처리 + 스냅샷 SUM + activityLog
//   - releaseClosing(dateStr, staff, reason) : 마감 해제 + activityLog
//
// 권한과 스냅샷·마감·로그 원자성은 서버 명령에서 강제한다.

import { db } from './firebase.js';
import {
  doc, getDocFromServer as getDoc,
  collection, getDocsFromServer as getDocs, query, orderBy, limit, where,
} from 'firebase/firestore';
import { getTodayKST, getNextBusinessDayByType } from './utils/date.js';
import { prepareProductionClosing } from './services/productionClosingCommand.js';

// ===== 상태 판정 =====

/**
 * 해당 날짜가 마감되었는지 판정.
 * 모든 페이지에서 마감 여부 판단 시 반드시 이 함수만 사용.
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Promise<boolean>}
 */
export async function isDateClosed(dateStr, scope = { getDoc }) {
  if (!dateStr) return false;
  const snap = await scope.getDoc(doc(db, 'closings', dateStr));
  if (!snap.exists()) return false;
  return snap.data().status === 'closed';
}

/**
 * 마지막으로 마감된 날짜 (status === 'closed')를 반환.
 * 마감된 날짜가 하나도 없으면 null.
 *
 * @returns {Promise<string|null>} YYYY-MM-DD or null
 */
export async function getLastClosedDate(scope = { getDocs }) {
  const q = query(
    collection(db, 'closings'),
    where('status', '==', 'closed'),
    orderBy('__name__', 'desc'),
    limit(1),
  );
  const snap = await scope.getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

/**
 * 가장 빠른 미마감 영업일을 반환.
 *
 * 동작:
 * - 마감된 날짜가 없으면: 오늘이 영업일이면 오늘, 아니면 다음 영업일
 * - 마감된 마지막 날짜 이후의 첫 영업일을 반환
 * - 단 미래 날짜는 반환하지 않음 (오늘까지만)
 * - 모두 마감되어 있으면 null
 *
 * 마감 버튼이 처리할 대상 날짜 결정에 사용됨.
 *
 * @param {string[]} [holidays=[]] - 휴일 목록
 * @returns {Promise<string|null>}
 */
export async function getEarliestUnclosedWorkday(holidays = [], scope) {
  const today = getTodayKST();
  const lastClosed = await getLastClosedDate(scope);

  let candidate;
  if (lastClosed === null) {
    // 마감 이력 자체가 없음 → 오늘부터 시작
    // (단 오늘이 휴일/주말이면 다음 영업일까지 미루지는 않음 — 오늘 데이터가 있으면 마감 가능해야 함)
    return today;
  }

  // 마지막 마감일 다음 영업일부터 시작
  candidate = getNextBusinessDayByType(lastClosed, 'production');

  // 미래는 반환하지 않음
  if (candidate > today) return null;

  return candidate;
}

// ===== 서버 원자 마감 =====

// The modal may pass its prepared command to preserve the version captured
// before confirmation. Other callers still go through the same server owner.
export async function closeDate(dateStr, staffName, preparedCommand) {
  const command = preparedCommand || await prepareProductionClosing(dateStr, 'close');
  return command.submit(staffName);
}

export async function releaseClosing(dateStr, staffName, reason, preparedCommand) {
  const command = preparedCommand || await prepareProductionClosing(dateStr, 'release');
  return command.submit(staffName, reason);
}
