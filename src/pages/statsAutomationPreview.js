import { loadAutomationPreview } from '../services/statsAutomationPreview.js';
import { registerPageCleanup } from '../utils/pageLifecycle.js';
import { adjustmentContextText } from '../services/statsAutomation.js';

const esc = v => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const fmt = v => typeof v === 'number' ? v.toLocaleString('ko-KR', { maximumFractionDigits: 3 }) : String(v ?? '확인 불가');
const card = (title, content) => '<section class="stats-section"><h3>' + esc(title) + '</h3>' + content + '</section>';
const table = (headers, rows) => '<div style="overflow:auto"><table class="stats-table"><thead><tr>'
  + headers.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>'
  + rows.map(row => '<tr>' + row.map(v => '<td>' + esc(fmt(v)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
export function previewMarkup(result) {
  const candidates = result.candidates.map(c => [c.title, c.severity === 'urgent' ? '긴급 검토' : '확인 권고',
    c.recipientRoles.map(r => r === 'owner' ? '대표' : '사무팀').join('·'),
    c.kind === 'registration' ? `최근 ${c.evidence.lastDate} / 평균 ${fmt(c.evidence.meanInterval)}일 / 표본 ${c.evidence.samples}`
      : c.kind === 'quantity' ? `${c.evidence.date} / ${fmt(c.evidence.qty)}${c.evidence.unit} / 중앙값 ${fmt(c.evidence.baseline)} / 표본 ${c.evidence.samples}`
        : c.kind === 'duplicateReceipt' ? `${c.evidence.originalDate} ↔ ${c.evidence.date} / ${fmt(c.evidence.originalQty)} ↔ ${fmt(c.evidence.qty)}${c.evidence.unit} / ${c.evidence.basis}`
        : c.kind === 'cancellation' ? `${c.evidence.originalSource} / 원본 ${fmt(c.evidence.qty)}${c.evidence.unit} / 취소 ${fmt(c.evidence.cancelQty)}${c.evidence.unit} / ${c.evidence.problem}`
        : `추정 ${fmt(c.evidence.estimatedDaysLeft)}일 / ${fmt(c.evidence.qty)}${c.evidence.unit}`, c.evidence.source || c.evidence.itemId,
    adjustmentContextText(c) || '해당 이력 없음']);
  const weekly = result.weekly;
  return card('발송 없는 알림 검증', '<p>이 검증 화면에서는 컨펌을 발송하지 않습니다. 자동 발송 여부는 서버 운영 설정을 따릅니다. 기존 알림은 그대로 유지합니다.</p>'
    + '<p>통계의 탭·조회기간과 별도로 최근 90일을 검증합니다. 조회 ' + esc(result.range.startDate) + ' ~ ' + esc(result.range.endDate)
    + ' · 후보 ' + candidates.length + '건 · 기준: 입고 간격 5개 이상, 수량 비교 6건 이상·중앙값 대비 10배 차이. 같은 입고예정 중복·3일 이내 동일 수량 반복·취소 원본과 반대 수량도 확인합니다. 오류 확정이 아닌 확인 권고입니다.</p>'
    + '<p>' + esc(result.snapshotNote || '') + '</p>'
    + '<p>입고 집계 제외 ' + (result.coverage?.excludedReceipts ?? '미확인')
    + '건 · 사용량 근거 누락 ' + (result.coverage?.missingUsage ?? '미확인') + '건</p>')
    + card('알림 후보 · 발송 안 함', candidates.length ? table(['내용', '등급', '예정 수신자', '판단 근거', '원본', '후속 조정'], candidates) : '<p>현재 조건에 맞는 후보가 없습니다. 데이터 완전성·미확인 항목도 확인해주세요.</p>')
    + card('판단 보류·기존 알림과 중복 제외', table(['품목', '이유'], result.held.map(r => [r.name || '공통', r.reason])))
    + (weekly ? card(`지난주 공유 미리보기 (${weekly.startDate} ~ ${weekly.endDate})`, '<p>주간 요약도 운영앱 개인 컨펌으로 전달할 예정입니다. ' + esc(weekly.note) + '</p>'
      + table(['구분', '품목', '단계·기준', '수량', '단위'], ['production', 'supply', 'usage'].flatMap((key, i) => weekly[key].map(r => [['생산', '입고', '사용'][i], r.name, r.stage, r.total, r.unit])))
      + '<p>미확인: 생산 ' + weekly.unknown.production + '건 · 입고 ' + weekly.unknown.supply + '건 · 사용 ' + weekly.unknown.usage + '건</p>') : '');
}
export async function openStatsAutomationPreview(host, isCurrent) {
  if (!host || !isCurrent()) return;
  let disposed = false;
  const unregister = registerPageCleanup(() => { disposed = true; });
  const current = () => !disposed && host.isConnected !== false && isCurrent();
  host.innerHTML = '<section class="stats-section" role="status">서버 원본으로 알림 후보를 검증하고 있습니다. 실제 발송은 없습니다.</section>';
  try {
    const result = await loadAutomationPreview(current);
    if (current()) {
      host.innerHTML = '<button type="button" class="stats-download-btn" data-close-preview>검증 닫기</button>' + previewMarkup(result);
      host.querySelector('[data-close-preview]').addEventListener('click', () => {
        disposed = true; unregister(); host.replaceChildren();
      });
    }
  }
  catch { if (current()) host.innerHTML = '<section class="stats-section" role="alert">검증 자료를 모두 읽지 못했습니다. 연결·권한을 확인한 뒤 다시 검증해주세요. 부분 자료로 판단하지 않습니다.</section>'; }
}
