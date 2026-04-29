// KST(Asia/Seoul) 기준 날짜 유틸
// 스펙 18장: 모든 날짜는 Asia/Seoul 기준 YYYY-MM-DD 문자열로 저장

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 주어진 Date 객체를 KST 기준 YYYY-MM-DD 문자열로 변환
 * @param {Date} date - 변환할 Date 객체 (기본값: 현재 시각)
 * @returns {string} YYYY-MM-DD
 */
export function formatKstDate(date = new Date()) {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.toISOString().split('T')[0];
}

/**
 * KST 기준 오늘 날짜 (YYYY-MM-DD)
 * 기존 9개 페이지에 흩어져 있던 getToday()의 KST 정정 버전
 */
export function getTodayKST() {
  return formatKstDate(new Date());
}

/**
 * KST 기준 어제 날짜 (YYYY-MM-DD)
 */
export function getYesterdayKST() {
  const now = new Date();
  return formatKstDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

/**
 * 다음 영업일 (토/일 + 휴일 제외, KST 기준)
 *
 * @param {string} dateStr - 기준 날짜 YYYY-MM-DD
 * @param {string[]} holidays - 휴일 배열 (YYYY-MM-DD), 기본 빈 배열
 *                              (Phase 1 V1: 토일만, 추후 holidays 컬렉션 연결 예정)
 * @returns {string} 다음 영업일 YYYY-MM-DD
 */
export function getNextBusinessDay(dateStr, holidays = []) {
  // KST 자정 anchor (UTC 기준 -9시간)
  let cursor = new Date(dateStr + 'T00:00:00+09:00');

  for (let i = 0; i < 365; i++) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    // KST 시간으로 본 요일 = (UTC + 9h)의 UTC 요일
    const kstDay = new Date(cursor.getTime() + KST_OFFSET_MS).getUTCDay();
    const candidate = formatKstDate(cursor);

    if (kstDay !== 0 && kstDay !== 6 && !holidays.includes(candidate)) {
      return candidate;
    }
  }
  throw new Error('getNextBusinessDay: 365일 초과 — 입력값 확인');
}

/**
 * 두 날짜의 일수 차이 (KST 기준)
 * @returns {number} dateAStr - dateBStr (양수면 A가 더 미래)
 */
export function diffDaysKST(dateAStr, dateBStr) {
  const a = new Date(dateAStr + 'T00:00:00+09:00');
  const b = new Date(dateBStr + 'T00:00:00+09:00');
  return Math.round((a - b) / (24 * 60 * 60 * 1000));
}