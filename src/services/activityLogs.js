// activityLogs 서비스
// 운영자 액션 통합 로그. 한 번 작성된 로그는 read 필드 외 수정/삭제 금지.
//
// 사용처: closing.js, 그리고 향후 다른 페이지의 액션 기록.
// 스키마: src/utils/firestoreSchemas.md

import { db } from '../firebase.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
    details: entry.details || {},
    read: false,
  };

  const ref = await addDoc(collection(db, 'activityLogs'), docData);
  return ref.id;
}
