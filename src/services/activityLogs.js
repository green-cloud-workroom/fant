// activityLogs 서비스
// 운영자 액션 통합 로그. 한 번 작성된 로그는 read/acknowledged 계열 필드 외 수정/삭제 금지.
//
// 사용처: closing.js, 그리고 향후 다른 페이지의 액션 기록.
// 스키마: src/utils/firestoreSchemas.md

import { db } from '../firebase.js';
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { currentUser } from '../app.js';

/**
 * 활동 로그를 한 줄 기록한다.
 *
 * @param {object} entry
 * @param {string} entry.action      - 액션 카테고리 (예: "closing")
 * @param {string} entry.subAction   - 세부 액션 (예: "close", "release")
 * @param {string} entry.date        - 관련 대상 날짜 YYYY-MM-DD (예: "2026-04-29")
 * @param {string} entry.staff       - 담당자 표시명
 * @param {string} entry.message     - 사무 로그 표시용 가공 텍스트
 * @param {object} [entry.details]   - 액션별 추가 정보 (기본 빈 객체)
 * @returns {Promise<string>}        - 생성된 로그 문서 ID
 */
export async function recordActivity(entry) {
  if (!entry || !entry.action || !entry.subAction) {
    throw new Error('recordActivity: action과 subAction 필수');
  }
  if (!entry.staff) {
    throw new Error('recordActivity: staff 필수');
  }

  const uid = currentUser?.uid || null;

  const docData = {
    action: entry.action,
    subAction: entry.subAction,
    date: entry.date || null,
    staff: entry.staff,
    uid,
    timestamp: serverTimestamp(),
    message: entry.message || '',
    details: { ...(entry.details || {}), app: 'production' },
    read: false,
    acknowledged: false,
    acknowledgedAt: null,
    acknowledgedBy: null,
    acknowledgedByUid: null,
  };

  const ref = await addDoc(collection(db, 'activityLogs'), docData);
  return ref.id;
}

/**
 * 활동 로그 단건을 "확인" 처리한다.
 * acknowledged 필드 4개를 일괄 업데이트.
 *
 * @param {string} logId      - activityLogs 문서 ID
 * @param {string} staffName  - 확인 처리한 담당자 표시명
 * @returns {Promise<void>}
 */
export async function acknowledgeLog(logId, staffName) {
  if (!logId) throw new Error('acknowledgeLog: logId 필수');
  if (!staffName) throw new Error('acknowledgeLog: staffName 필수');

  const uid = currentUser?.uid || null;
  const ref = doc(db, 'activityLogs', logId);

  await updateDoc(ref, {
    acknowledged: true,
    acknowledgedAt: serverTimestamp(),
    acknowledgedBy: staffName,
    acknowledgedByUid: uid,
  });
}

/**
 * 특정 날짜의 미확인 활동 로그를 조회한다.
 * acknowledged 필드가 true가 아닌 로그만 반환 (false 또는 필드 누락 모두 포함).
 *
 * 호출 패턴:
 * - 메인 알림: getUnacknowledgedLogs(today)
 * - 마감/차단 모달: getUnacknowledgedLogs(targetDate)
 * - 카테고리 필터: getUnacknowledgedLogs(today, { actions: ['production', 'meat'] })
 *
 * @param {string} dateStr               - YYYY-MM-DD
 * @param {object} [options]
 * @param {string[]} [options.actions]   - 특정 action만 필터링 (없으면 전체)
 * @returns {Promise<Array>}             - 미확인 로그 배열 (timestamp DESC)
 */
export async function getUnacknowledgedLogs(dateStr, options = {}) {
  if (!dateStr) throw new Error('getUnacknowledgedLogs: dateStr 필수');

  const q = query(
    collection(db, 'activityLogs'),
    where('date', '==', dateStr),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  let logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // acknowledged !== true 필터 (false 또는 필드 누락 둘 다 미확인 처리)
  logs = logs.filter(log => log.acknowledged !== true);

  // action 카테고리 필터 (선택)
  if (Array.isArray(options.actions) && options.actions.length > 0) {
    logs = logs.filter(log => options.actions.includes(log.action));
  }

  return logs;
}
