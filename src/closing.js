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
// 권한 체크는 호출 측에서 처리 (UI 레이어 책임).

import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, orderBy, limit, where,
  serverTimestamp,
} from 'firebase/firestore';
import { currentUser } from './app.js';
import { getTodayKST, getNextBusinessDay, formatKstDate } from './utils/date.js';
import { recordActivity } from './services/activityLogs.js';

// ===== 상태 판정 =====

/**
 * 해당 날짜가 마감되었는지 판정.
 * 모든 페이지에서 마감 여부 판단 시 반드시 이 함수만 사용.
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Promise<boolean>}
 */
export async function isDateClosed(dateStr) {
  if (!dateStr) return false;
  const snap = await getDoc(doc(db, 'closings', dateStr));
  if (!snap.exists()) return false;
  return snap.data().status === 'closed';
}

/**
 * 마지막으로 마감된 날짜 (status === 'closed')를 반환.
 * 마감된 날짜가 하나도 없으면 null.
 *
 * @returns {Promise<string|null>} YYYY-MM-DD or null
 */
export async function getLastClosedDate() {
  const q = query(
    collection(db, 'closings'),
    where('status', '==', 'closed'),
    orderBy('__name__', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
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
export async function getEarliestUnclosedWorkday(holidays = []) {
  const today = getTodayKST();
  const lastClosed = await getLastClosedDate();

  let candidate;
  if (lastClosed === null) {
    // 마감 이력 자체가 없음 → 오늘부터 시작
    // (단 오늘이 휴일/주말이면 다음 영업일까지 미루지는 않음 — 오늘 데이터가 있으면 마감 가능해야 함)
    return today;
  }

  // 마지막 마감일 다음 영업일부터 시작
  candidate = getNextBusinessDay(lastClosed, holidays);

  // 미래는 반환하지 않음
  if (candidate > today) return null;

  return candidate;
}

// ===== 스냅샷 SUM =====

/**
 * 마감 시점 잔량 스냅샷을 모든 stock에서 모은다.
 * 호출 시점의 Firestore 상태를 그대로 캡처.
 *
 * @returns {Promise<object>} closings 문서의 snapshots 필드 그대로
 */
async function buildSnapshots() {
  const snapshots = {
    egg: { currentQty: 0 },
    bags: {},
    meatByStage: { frozen: {}, processed: {}, repacked: {} },
    frozenPan: {},
    frozenSep: {},
  };

  // 1. 계란
  const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
  if (eggSnap.exists()) {
    snapshots.egg.currentQty = eggSnap.data().currentQty || 0;
  }

  // 2. 봉투
  const bagSnap = await getDocs(collection(db, 'bagTypes'));
  bagSnap.docs.forEach(d => {
    const data = d.data();
    snapshots.bags[d.id] = data.currentQty || 0;
  });

  // 3. 원육 (stage별)
  const meatSnap = await getDocs(collection(db, 'meatStocks'));
  meatSnap.docs.forEach(d => {
    const data = d.data();
    if (data.closed) return; // 소진된 lot 제외
    const stage = data.stage; // 'frozen' | 'processed' | 'repacked'
    const meatId = data.meatTypeId;
    const remaining = data.remaining || 0;
    if (!stage || !meatId || remaining <= 0) return;
    if (!snapshots.meatByStage[stage]) return;
    snapshots.meatByStage[stage][meatId] =
      (snapshots.meatByStage[stage][meatId] || 0) + remaining;
  });

  // 4. 동결판 (factory별)
  const fpLotsSnap = await getDocs(collection(db, 'frozenPanLots'));
  fpLotsSnap.docs.forEach(d => {
    const data = d.data();
    const remaining = data.remaining || 0;
    if (remaining <= 0) return;
    const factory = data.factory || '미지정';
    snapshots.frozenPan[factory] =
      (snapshots.frozenPan[factory] || 0) + remaining;
  });

  // 5. 동결 분리작업 (productName + separationType별)
  const fsSnap = await getDocs(collection(db, 'frozenSeparation'));
  fsSnap.docs.forEach(d => {
    const data = d.data();
    const remaining = data.remaining || 0;
    if (remaining <= 0) return;
    const product = data.productName || '미지정';
    const sepType = data.separationType || '미지정';
    if (!snapshots.frozenSep[product]) snapshots.frozenSep[product] = {};
    snapshots.frozenSep[product][sepType] =
      (snapshots.frozenSep[product][sepType] || 0) + remaining;
  });

  return snapshots;
}

// ===== 마감 처리 =====

/**
 * 해당 날짜를 마감 처리한다.
 *
 * 동작:
 * 1. 이미 마감된 날짜면 에러
 * 2. 미래 날짜는 마감 불가
 * 3. 스냅샷 SUM 후 closings/{date} 문서 생성
 * 4. activityLogs 한 줄 기록
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} staffName - 담당자 표시명
 * @returns {Promise<void>}
 */
export async function closeDate(dateStr, staffName) {
  if (!dateStr) throw new Error('closeDate: dateStr 필수');
  if (!staffName) throw new Error('closeDate: staffName 필수');

  const today = getTodayKST();
  if (dateStr > today) {
    throw new Error(`미래 날짜는 마감 불가: ${dateStr}`);
  }

  // 이미 마감된 날짜인지 체크 (released 상태에서 재마감은 허용)
  const existing = await getDoc(doc(db, 'closings', dateStr));
  if (existing.exists() && existing.data().status === 'closed') {
    throw new Error(`이미 마감된 날짜: ${dateStr}`);
  }

  // 스냅샷 SUM
  const snapshots = await buildSnapshots();

  // closings 문서 작성
  const uid = currentUser?.uid || null;
  await setDoc(doc(db, 'closings', dateStr), {
    status: 'closed',
    closed: true,
    closedAt: serverTimestamp(),
    closedBy: staffName,
    closedByUid: uid,
    releasedAt: null,
    releasedBy: null,
    releasedByUid: null,
    releaseReason: null,
    snapshots,
  });

  // activityLogs 기록
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  await recordActivity({
    action: 'closing',
    subAction: 'close',
    date: dateStr,
    staff: staffName,
    message: `${mm}/${dd} ${hh}:${mi} 마감 / 담당: ${staffName}`,
    details: {},
  });
}

/**
 * 마감을 해제한다.
 *
 * 동작:
 * 1. 마감 안 된 날짜면 에러
 * 2. status를 released로 변경, 사유와 담당자 기록
 * 3. 스냅샷은 그대로 유지 (재마감 시 덮어씀)
 * 4. activityLogs 한 줄 기록
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} staffName - 해제 담당자 표시명
 * @param {string} reason - 사유 (필수)
 * @returns {Promise<void>}
 */
export async function releaseClosing(dateStr, staffName, reason) {
  if (!dateStr) throw new Error('releaseClosing: dateStr 필수');
  if (!staffName) throw new Error('releaseClosing: staffName 필수');
  if (!reason || !reason.trim()) {
    throw new Error('releaseClosing: 사유 필수');
  }

  const ref = doc(db, 'closings', dateStr);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().status !== 'closed') {
    throw new Error(`마감되지 않은 날짜는 해제 불가: ${dateStr}`);
  }

  const uid = currentUser?.uid || null;
  await updateDoc(ref, {
    status: 'released',
    releasedAt: serverTimestamp(),
    releasedBy: staffName,
    releasedByUid: uid,
    releaseReason: reason.trim(),
  });

  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  await recordActivity({
    action: 'closing',
    subAction: 'release',
    date: dateStr,
    staff: staffName,
    message: `${mm}/${dd} ${hh}:${mi} 마감해제 / 담당: ${staffName} / 사유: ${reason.trim()}`,
    details: { reason: reason.trim() },
  });
}
