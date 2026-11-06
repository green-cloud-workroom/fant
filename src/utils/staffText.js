// Presentation only: never change stored identifiers, quantities or command results.
export const quantityText = value => Number.isFinite(Number(value)) && value !== null && value !== ''
  ? Number(value).toLocaleString('ko-KR', {maximumFractionDigits:6}) : '수량 확인 필요';
export const stockUnit = collection => ({bagLogs:'장',eggLogs:'개',supplementLogs:'봉',meatLogs:'kg',breadPanLogs:'개',frozenPanLogs:'판'}[collection] || '');
export const unitText = unit => ({box:'박스',pack:'봉',packs:'봉',piece:'개',pcs:'개',pan:'판',g:'g',kg:'kg'}[unit] || unit || '단위 확인 필요');
export function itemName(value, fallback = '품목명 확인 필요') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
export function readableNote(value) {
  return String(value || '').replace(/(?:취소 원본|원본):\s*[A-Za-z]+Logs\/[^\s·/]+/g,'취소 대상: 이전 입출고 기록')
    .replace(/\blot\b/gi,'재고 건').replace(/\bFIFO\b/g,'먼저 입고된 순서').replace(/롤백/g,'차감 복원');
}
export function staffError(error) {
  const message = typeof error === 'string' ? error : String(error?.message || '');
  const code = String(error?.code || '').replace(/^(?:firestore|functions|auth)\//,'');
  if(code === 'outcome-unknown') return '저장 결과를 아직 확인하지 못했습니다. 입력값을 보존하고 기존 작업의 결과를 확인해주세요. 새로 저장하면 중복 처리될 수 있습니다.';
  // Keep application instructions (including a partially completed operation) intact.
  if(/[가-힣]/.test(message) && !/(?:Firebase|Firestore|recordActivity:|acknowledgeLog:|getUnacknowledgedLogs:|[A-Za-z]+\/[A-Za-z0-9_-]{16,})/.test(message))
    return readableNote(message).replace(/같은 작업 ID/g,'기존 작업').replace(/기존 작업 ID/g,'기존 작업').replace(/snapshot/g,'저장 당시 정보');
  if(code==='permission-denied'||/insufficient permissions/i.test(message))return '이 작업을 처리할 권한이 없습니다. 로그인 계정과 담당 권한을 확인해주세요.';
  if(code==='unauthenticated')return '로그인이 만료되었습니다. 입력값을 보관한 뒤 다시 로그인해주세요.';
  if(code==='unavailable'||/network|offline|fetch/i.test(message))return '서버 연결을 확인하지 못했습니다. 연결을 확인하고 최신 기록에서 처리 여부를 먼저 확인해주세요.';
  if(code==='deadline-exceeded'||/timeout|timed out/i.test(message))return '응답이 늦어 처리 결과를 확인하지 못했습니다. 다시 저장하기 전에 기존 기록을 확인해주세요.';
  return '작업을 완료했는지 확인하지 못했습니다. 입력값을 보관하고 최신 기록을 확인해주세요. 문제가 계속되면 관리자에게 문의해주세요.';
}
