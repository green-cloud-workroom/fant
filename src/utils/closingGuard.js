// 마감 가드 — 마감된 날짜 데이터의 수정/삭제 차단
//
// 사용 패턴 (각 페이지의 수정·삭제 핸들러 시작에서):
//   if (await blockIfClosed(targetDate)) return;
//
// targetDate = 해당 데이터의 기준 날짜 (생산일/입고일/조정일 등)
// 입고 예정 완료/취소 같이 "오늘 처리"하는 작업은 today를 전달.

import { isDateClosed } from '../closing.js';

/**
 * 날짜가 마감됐는지 판정해서, 마감됐으면 alert 띄우고 true 반환.
 * 호출 측은 true를 받으면 즉시 return하면 됨.
 *
 * @param {string} dateStr - 검사할 날짜 (YYYY-MM-DD)
 * @returns {Promise<boolean>} true=차단됨(호출 측 중단해야 함), false=통과
 */
export async function blockIfClosed(dateStr) {
  if (!dateStr) return false;
  try {
    const closed = await isDateClosed(dateStr);
    if (closed) {
      alert(`${dateStr}는 이미 마감된 날짜입니다.\n수정하려면 마감해제하세요.`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('blockIfClosed error:', err);
    // 에러 시 안전 fallback: 차단하지 않음 (운영자 작업 막히는 것 방지)
    return false;
  }
}