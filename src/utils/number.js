// 숫자 처리 공통 유틸
// 사용처: 빵판 단위 (소수 2자리), 부동소수점 오차 가드

/**
 * 소수 2자리까지 반올림.
 * 빵판 입고/차감/조정 시 항상 이 함수로 정규화 후 저장.
 * 
 * @param {number} n - 원본 숫자
 * @returns {number} - 소수 2자리로 반올림된 값
 * 
 * 예시:
 *   round2(4.555) → 4.56
 *   round2(2.222) → 2.22
 *   round2(4 * 4 / 9) → 1.78  (이론값 표시용)
 */
export function round2(n) {
  if (typeof n !== 'number' || isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * 빵판 lot이 소진되었는지 판정.
 * 부동소수점 오차 허용 (0.005 이하면 소진으로 간주).
 * 
 * @param {number} remaining - lot의 현재 잔량
 * @returns {boolean}
 * 
 * 예시:
 *   isExhausted(0)        → true
 *   isExhausted(0.001)    → true  (오차로 0이 안 된 케이스)
 *   isExhausted(0.01)     → false
 */
export function isExhausted(remaining) {
  return remaining <= 0.005;
}

/**
 * 빵판 → 동결판 환산 (이론값).
 * 빵판 1개 = 동결판 4/9개
 * 
 * @param {number} breadPanQty - 빵판 수
 * @returns {number} - 동결판 이론값 (소수 2자리)
 * 
 * 예시:
 *   breadToFrozenPan(9) → 4
 *   breadToFrozenPan(4.5) → 2
 *   breadToFrozenPan(5) → 2.22
 */
export function breadToFrozenPan(breadPanQty) {
  return round2(breadPanQty * 4 / 9);
}

/**
 * 빵판 → 실리콘 환산 (참고 표시용).
 * 빵판 1개 = 실리콘 4판
 * 
 * @param {number} breadPanQty
 * @returns {number}
 */
export function breadToSilicon(breadPanQty) {
  return round2(breadPanQty * 4);
}

/**
 * 원료 수량 표시 통일 포맷(숫자만, 단위 미포함).
 * g: 소수 1자리, kg: 소수 2자리. 정수면 소수점 생략.
 *
 * @param {number} grams - 원료량(g)
 * @param {'kg'|'g'} unit
 * @returns {string}
 */
export function formatIngredientQtyValue(grams, unit) {
  const g = Number(grams) || 0;
  const value = unit === 'kg' ? g / 1000 : g;
  const maxDecimals = unit === 'kg' ? 2 : 1;
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString('ko-KR', { maximumFractionDigits: maxDecimals });
}
