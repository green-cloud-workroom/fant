// KST(Asia/Seoul) 기준 날짜 유틸
// 스펙 18장: 모든 날짜는 Asia/Seoul 기준 YYYY-MM-DD 문자열로 저장

import { db } from '../firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// [Phase 7A] holidays 캐시
// 모듈 레벨 변수 — 앱 시작 시 1회 로드, 휴일 등록/삭제 시 갱신
let holidaysCache = [];
let holidaysCacheLoaded = false;

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
export function getNextBusinessDay(dateStr, holidays = null) {
  // [Phase 7A] holidays 인자 미전달 시 캐시 자동 사용
  const effectiveHolidays = holidays !== null ? holidays : holidaysCache;
  let cursor = new Date(dateStr + 'T00:00:00+09:00');

  for (let i = 0; i < 365; i++) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    // KST 시간으로 본 요일 = (UTC + 9h)의 UTC 요일
    const kstDay = new Date(cursor.getTime() + KST_OFFSET_MS).getUTCDay();
    const candidate = formatKstDate(cursor);

    if (kstDay !== 0 && kstDay !== 6 && !effectiveHolidays.includes(candidate)) {
      return candidate;
    }
  }
  throw new Error('getNextBusinessDay: 365일 초과 — 입력값 확인');
}
/**
 * KST 기준 N개월 후 날짜 (YYYY-MM-DD)
 * 동결제품 유통기한(18개월 후) 등에 사용. toISOString()의 UTC 기준 버그 회피용.
 *
 * @param {number} months - 더할 개월 수 (음수도 가능)
 * @param {Date} baseDate - 기준 시각 (기본값: 현재)
 * @returns {string} YYYY-MM-DD
 */
export function addMonthsKST(months, baseDate = new Date()) {
  // KST 기준의 연/월/일을 추출
  const kst = new Date(baseDate.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth();
  const d = kst.getUTCDate();
  // KST 기준 (y, m+months, d) 만들고 다시 KST YYYY-MM-DD로 포맷
  const target = new Date(Date.UTC(y, m + months, d));
  return formatKstDate(new Date(target.getTime() - KST_OFFSET_MS));
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

/**
 * [Phase 3b 신규]
 * KST 기준 'M/D(요일)' 형식 변환 (배너/모달 표시용).
 * 예: '2026-04-28' -> '4/28(화)'
 *
 * 월/일은 입력 문자열을 그대로 파싱해서 환경 시간대 무관.
 * 요일은 KST 정오를 anchor로 계산해 자정 경계 이슈 회피.
 *
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {string} 'M/D(요일)' 또는 빈 문자열(입력이 falsy일 때)
 */
export function formatKstDateWithDay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(month) || Number.isNaN(day)) return '';

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const kstNoon = new Date(dateStr + 'T12:00:00+09:00');
  const kstDayIdx = new Date(kstNoon.getTime() + KST_OFFSET_MS).getUTCDay();

  return `${month}/${day}(${days[kstDayIdx]})`;
}
/**
 * [Phase 7A]
 * holidays 컬렉션 전체를 fetch해서 캐시에 저장.
 * 앱 시작 시 1회 호출 + 휴일 등록/삭제 시 호출.
 *
 * @returns {Promise<string[]>} 캐시된 휴일 배열 (YYYY-MM-DD)
 */
export async function loadHolidaysCache() {
  const snap = await getDocs(collection(db, 'holidays'));
  holidaysCache = snap.docs.map(d => d.id);
  holidaysCacheLoaded = true;
  return holidaysCache;
}

/**
 * [Phase 7A]
 * 현재 캐시된 휴일 배열을 반환. 캐시 미로드면 빈 배열.
 *
 * @returns {string[]}
 */
export function getHolidaysCache() {
  return holidaysCache;
}

/**
 * [Phase 7A]
 * 캐시 로드 여부 확인.
 *
 * @returns {boolean}
 */
export function isHolidaysCacheLoaded() {
  return holidaysCacheLoaded;
}
