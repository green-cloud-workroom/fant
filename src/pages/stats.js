import { db } from '../firebase.js';
import { collection, getDocsFromServer as getDocs, query, where } from 'firebase/firestore';
import { getTodayKST } from '../utils/date.js';
import { Chart, registerables } from 'chart.js';
import { registerPageCleanup, getPageContext } from '../utils/pageLifecycle.js';
import { pageResource } from '../state/pageResources.js';
import { sessionStore } from '../state/sessionStore.js';
import { validDate, productionEvents, supplyEvents, usageEvents, summarize, periodRows } from '../services/statsLogic.js';
import { visualChoices, visualFilter, renderStatsVisuals, compactSection } from './statsVisuals.js';

Chart.register(...registerables);
const statsResource = pageResource('stats');
const TABS = [{ id: 'production', label: '제품 생산' }, { id: 'supply', label: '원료 수급' }, { id: 'usage', label: '원료 사용' }];
let activeTab = 'production', startDate = '', endDate = '', aggregation = 'daily', periodMode = '1';
let queryToken = 0, refreshTimer, statsRefreshTimer, statsResourceKey = '', loadedStatsKey = null;
let lastData = null, lastView = null, lastProductionCount = 0, filterTerm = '', XLSX;
const charts = [], tableLimits = new Map();
const visualSelections = Object.fromEntries(TABS.map(t => [t.id, { scope: '', item: '', initialized: false }]));
let calendarOffset = 0, calendarLimit = 20;
const visualKey = () => JSON.stringify(visualSelections[activeTab]);
const statsKey = () => JSON.stringify([activeTab, startDate, endDate, aggregation]);
const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const display = value => value == null ? '확인 불가' : typeof value === 'number' ? value.toLocaleString('ko-KR', { maximumFractionDigits: 3 }) : String(value);
const matches = row => !filterTerm || String(row.name || '').toLocaleLowerCase().includes(filterTerm.toLocaleLowerCase());
const currentRange = () => ({ startDate, endDate, today: getTodayKST() });
function destroyAllCharts() { for (const chart of charts.splice(0)) chart.destroy(); }
function preset(months) {
  endDate = getTodayKST();
  const date = new Date(endDate + 'T00:00:00Z');
  // Complete calendar months, including the current month through today.
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - Number(months) + 1);
  startDate = date.toISOString().slice(0, 10);
}
export async function renderStats() {
  if (!document.getElementById('mainContent')) return;
  queryToken++; clearTimeout(refreshTimer); clearTimeout(statsRefreshTimer); destroyAllCharts();
  activeTab = 'production'; aggregation = 'daily'; periodMode = '1'; filterTerm = '';
  for (const selection of Object.values(visualSelections)) Object.assign(selection, { scope: '', item: '', initialized: false });
  calendarOffset = 0; calendarLimit = 20;
  loadedStatsKey = null; lastData = null; lastView = null; lastProductionCount = 0;
  tableLimits.clear(); preset(1);
  registerPageCleanup(() => {
    queryToken++; clearTimeout(refreshTimer); clearTimeout(statsRefreshTimer); destroyAllCharts();
    lastData = null; lastView = null; loadedStatsKey = null;
  });
  renderStatsLayout();
  await refreshStats();
}
function renderStatsLayout() {
  const host = document.getElementById('mainContent');
  delete host.dataset.statsReadyTab; delete host.dataset.statsReadyKey;
  host.innerHTML = '<div class="stats-wrap">' +
    '<div class="stats-tabs">' + TABS.map(t => '<button class="stats-tab ' + (t.id === activeTab ? 'active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>').join('') + '</div>' +
    '<div class="stats-controls"><div class="stats-control-row"><span class="stats-control-label">기간</span><div class="stats-mode-group">' +
    [1, 3, 6].map(n => '<button class="stats-mode-btn ' + (periodMode === String(n) ? 'active' : '') + '" data-months="' + n + '">' + n + '개월</button>').join('') +
    '</div><input aria-label="통계 시작일" type="date" class="stats-date-input" id="statsStartDate" value="' + startDate + '"> ~ <input aria-label="통계 종료일" type="date" class="stats-date-input" id="statsEndDate" value="' + endDate + '" max="' + getTodayKST() + '"></div>' +
    '<div class="stats-control-row"><span class="stats-control-label">집계</span><div class="stats-mode-group">' +
    [['daily', '일별'], ['weekly', '주별'], ['monthly', '월별']].map(([id, label]) => '<button class="stats-agg-btn ' + (aggregation === id ? 'active' : '') + '" data-agg="' + id + '">' + label + '</button>').join('') +
    '</div><input id="statsFilter" class="stats-date-input" aria-label="제품·원료 이름 검색" placeholder="제품·원료 이름 검색" value="' + escapeHtml(filterTerm) + '">' +
    '<button class="stats-download-btn" id="statsDownloadBtn" disabled>Excel 다운로드</button><button class="stats-download-btn" id="statsDownloadAllBtn" disabled>전체 다운로드</button>' +
    '<button class="stats-download-btn" id="statsReloadBtn">새로고침</button>' +
    '<button class="stats-download-btn" id="statsAutomationPreviewBtn">알림 검증 · 발송 없음</button></div></div>' +
    '<div id="statsAutomationPreviewArea" aria-live="polite"></div>' +
    '<div class="stats-summary" id="statsSummary" role="status"></div><div class="stats-visual-area" id="statsChartArea"></div>' +
    '<div class="stats-detail-area" id="statsOverviewArea"></div>' +
    '<div class="stats-detail-area" id="statsDetailArea"></div></div>';
  host.querySelectorAll('.stats-tab').forEach(button => button.addEventListener('click', async () => {
    activeTab = button.dataset.tab; tableLimits.clear(); invalidateView(); renderStatsLayout(); await refreshStats();
  }));
  host.querySelectorAll('[data-months]').forEach(button => button.addEventListener('click', async () => {
    periodMode = button.dataset.months; preset(periodMode); calendarOffset = 0; tableLimits.clear(); invalidateView(); renderStatsLayout(); await refreshStats();
  }));
  for (const id of ['statsStartDate', 'statsEndDate']) document.getElementById(id).addEventListener('change', async event => {
    if (id === 'statsStartDate') startDate = event.target.value; else endDate = event.target.value;
    periodMode = 'custom'; calendarOffset = 0; tableLimits.clear(); invalidateView(); renderStatsLayout(); await refreshStats();
  });
  host.querySelectorAll('[data-agg]').forEach(button => button.addEventListener('click', async () => {
    aggregation = button.dataset.agg; tableLimits.clear(); invalidateView(); renderStatsLayout(); await refreshStats();
  }));
  document.getElementById('statsFilter').addEventListener('input', event => {
    filterTerm = event.target.value; tableLimits.clear();
    if (loadedStatsKey === statsKey() && lastData) renderModel();
  });
  document.getElementById('statsReloadBtn').addEventListener('click', () => refreshStats({ force: true }));
  document.getElementById('statsAutomationPreviewBtn').addEventListener('click', async () => {
    const host = document.getElementById('statsAutomationPreviewArea'), page = getPageContext();
    const button = document.getElementById('statsAutomationPreviewBtn');
    if (!host || button.disabled) return;
    button.disabled = true;
    const current = () => (!page || page.isCurrent()) && document.getElementById('statsAutomationPreviewArea') === host;
    try {
      const { openStatsAutomationPreview } = await import('./statsAutomationPreview.js');
      if (current()) await openStatsAutomationPreview(host, current);
    } catch {
      if (current()) host.textContent = '알림 검증 화면을 불러오지 못했습니다. 다시 시도해주세요.';
    } finally { if (current()) button.disabled = false; }
  });
  document.getElementById('statsDownloadBtn').addEventListener('click', () => download(false));
  document.getElementById('statsDownloadAllBtn').addEventListener('click', () => download(true));
}
function invalidateView() {
  queryToken++; loadedStatsKey = null; lastData = null; lastView = null;
  destroyAllCharts();
  for (const id of ['statsOverviewArea', 'statsChartArea', 'statsDetailArea']) document.getElementById(id)?.replaceChildren();
  const host = document.getElementById('mainContent');
  if (host?.dataset) { delete host.dataset.statsReadyTab; delete host.dataset.statsReadyKey; }
  for (const id of ['statsDownloadBtn', 'statsDownloadAllBtn']) { const button = document.getElementById(id); if (button) button.disabled = true; }
}
function scheduleRefresh({ immediate = false } = {}) {
  invalidateView(); clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refreshStats(), immediate ? 0 : 300);
}
async function readRows(scope, name, range, history = false) {
  const conditions = [where('date', '<=', range.endDate)];
  if (!history) conditions.push(where('date', '>=', range.startDate));
  const snapshot = await scope.getDocs(query(collection(db, name), ...conditions));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}
async function readMaster(scope, name) {
  const snapshot = await scope.getDocs(collection(db, name));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}
async function loadStatsTab(tab, scope = { getDocs }, range = currentRange()) {
  if (tab === 'production') {
    const [productions, frozenLogs, frozenProducts] = await Promise.all([
      readRows(scope, 'productions', range), readRows(scope, 'frozenLogs', range), readMaster(scope, 'frozenProducts')]);
    return { productions, frozenLogs, frozenProducts };
  }
  const names = tab === 'supply' ? ['meatLogs', 'bagLogs', 'eggLogs', 'supplementLogs'] : ['productions', 'meatLogs', 'bagLogs', 'eggLogs', 'supplementLogs'];
  // Correction evidence can follow its source outside the selected dates.
  // Read complete historical logs; apply the date cohort only in the projection.
  const tasks = names.map(name => readMaster(scope, name));
  names.push('statsCorrections', 'stockLedger');
  tasks.push(readMaster(scope, 'statsCorrections'), readMaster(scope, 'stockLedger'));
  tasks.push(readMaster(scope, 'supplementTypes'));
  names.push('supplementTypes');
  if (tab === 'supply') {
    // Completion date is the cohort. Scheduled dates can be changed or later
    // than actual processing, so a scheduled-date query would lose early receipts.
    names.push('schedules');
    tasks.push(scope.getDocs(query(collection(db, 'schedules'), where('status', '==', 'completed')))
      .then(snapshot => snapshot.docs.map(d => ({ ...d.data(), id: d.id }))));
  }
  return Object.fromEntries((await Promise.all(tasks)).map((rows, i) => [names[i], rows]));
}
async function refreshStats({ force = false } = {}) {
  invalidateView();
  const token = queryToken, page = getPageContext(), tab = activeTab, range = currentRange();
  const key = JSON.stringify([tab, range.startDate, range.endDate]);
  const summary = document.getElementById('statsSummary');
  const isCurrent = () => token === queryToken && (!page || page.isCurrent());
  if (summary) summary.textContent = '통계 로딩 중…';
  for (const id of ['statsOverviewArea', 'statsChartArea', 'statsDetailArea']) { const node = document.getElementById(id); if (node) node.replaceChildren(); }
  if (!validDate(range.startDate) || !validDate(range.endDate) || range.startDate > range.endDate || range.endDate > range.today) {
    if (summary) summary.textContent = '오늘까지의 날짜로 시작일과 종료일을 확인해주세요.';
    return;
  }
  const host = document.getElementById('mainContent');
  if (host?.dataset) delete host.dataset.pageFailed;
  try {
    const readForce = force || (!statsResource.prepare && key !== statsResourceKey);
    statsResourceKey = key;
    const data = await statsResource.load(scope => loadStatsTab(tab, scope, range), { key, force: readForce, onChange: ({ error } = {}) => {
      if (!isCurrent()) return;
      if (error) {
        invalidateView();
        if (host?.dataset) host.dataset.pageFailed = 'stats';
        for (const id of ['statsOverviewArea', 'statsChartArea', 'statsDetailArea']) document.getElementById(id)?.replaceChildren();
        if (summary) summary.textContent = '최신 통계를 확인하지 못했습니다. 새로고침해주세요.';
        return;
      }
      invalidateView(); clearTimeout(statsRefreshTimer);
      statsRefreshTimer = setTimeout(() => refreshStats(), 120);
    } });
    if (!data || !isCurrent()) return;
    lastData = data; loadedStatsKey = statsKey();
    renderModel();
    if (host?.dataset) { host.dataset.statsReadyTab = tab; host.dataset.statsReadyKey = key; }
    for (const id of ['statsDownloadBtn', 'statsDownloadAllBtn']) { const button = document.getElementById(id); if (button) button.disabled = false; }
  } catch (error) {
    if (!isCurrent()) return;
    invalidateView();
    if (host?.dataset) host.dataset.pageFailed = 'stats';
    if (summary) summary.textContent = '통계 자료를 불러오지 못했습니다. 연결과 권한을 확인한 뒤 새로고침해주세요.';
    console.error('[stats] 로드 실패', error);
  }
}
function section(title, headers, rows, note = '') { return { title, headers, rows, note }; }
const distribution = stats => [stats.mean, stats.min, stats.max, stats.count];
const eventRows = events => [...events].sort((a, b) => b.date.localeCompare(a.date)).map(e => [
  e.date, e.name, e.stage, e.qty, e.unit, e.source, e.product || '', e.note || '',
]);
function buildView(tab, data, range, agg, filter = matches) {
  if (tab === 'production') {
    const projection = productionEvents(data, range), events = projection.events.filter(filter), groups = summarize(events, range);
    const unknown = projection.unconfirmed.filter(filter);
    return { events, groups, summary: '확정 기록 ' + events.length + '건 · 제품·단계·단위별 ' + groups.length + '항목 · 실적·유형 미확인 ' + unknown.length + '건',
      note: '생산일 기준. 생산 입력량은 참고값이며 실적 합계에 더하지 않습니다. 동결 생산(판), 포장(봉), 세트 조립을 각각 봅니다. 간격과 마지막 생산일은 조회기간 내 기록 기준입니다.',
      sections: [
        section('제품별 생산 실적', ['제품', '단계', '단위', '합계', '건수', '생산일수', '마지막 생산일', '회당 평균', '회당 최소', '회당 최대', '평균 간격(일)', '최소 간격', '최대 간격', '간격 표본 수'],
          groups.map(g => [g.name, g.stage, g.unit, g.total, g.amounts.count, g.interval.days, g.interval.lastDate, g.amounts.mean, g.amounts.min, g.amounts.max, ...distribution(g.interval)])),
        periodSection(events, agg),
        section('생산 기록 상세', ['생산일', '제품', '단계', '확정 수량', '단위', '원본 기록', '입력량(참고)', '입력 단위'],
          [...events].sort((a, b) => b.date.localeCompare(a.date)).map(e => [e.date, e.name, e.stage, e.qty, e.unit, e.source, e.inputQty, e.inputUnit])),
        section('실적·유형 미확인 기록', ['날짜', '제품', '확인 사항', '원본 기록'], unknown.map(r => [r.date, r.name, r.reason, r.source]), '미확인 건은 실적 합계와 평균에서 제외합니다. 0으로 계산하지 않습니다.'),
      ] };
  }
  if (tab === 'supply') {
    const projection = supplyEvents(data, range), events = projection.events.filter(filter);
    const groups = projection.summaries.filter(filter), registrations = projection.registrations.filter(filter);
    return { events, groups, registrationGroups: projection.registrationSummary.filter(filter), summary: '외부 입고 기록 ' + events.length + '건 · 품목·단위별 ' + groups.length + '항목 · 기간 내 입고 완료처리 ' + registrations.length + '건',
      note: '입고 기록일 기준이며 실제 도착일이 보장되지 않습니다. 검증된 취소는 제외하고 입고 사유의 조정은 별도 근거로 반영합니다. 확인 대기 건이 있는 합계는 원본 기록 기준 잠정값입니다. 마지막 입고와 경과일은 조회 종료일 기준, 평균 간격은 조회기간 내 서로 다른 입고일 사이입니다.',
      sections: [
        section('통계 정정·확인 대기', ['원본 기록', '처리', '사유'], [
          ...projection.adjustments.map(c => [c.source, c.kind === 'excludeSupply' ? '취소 입고 제외' : '입고 분류 반영', c.reason]),
          ...projection.pending.map(c => [c.source, '확인 대기 · 관련 자동 판단 보류', c.reason]),
        ], '현재 재고와 원본 이력은 변경하지 않습니다. 확인 대기는 오류로 확정한 것이 아닙니다.'),
        section('원료·봉투 입고', ['품목', '구분', '단위', '기간 입고 합계', '건당 평균', '입고 건수', '입고일수', '평균 간격(일)', '최소 간격', '최대 간격', '간격 표본 수', '종료일 기준 마지막 입고', '경과일'],
          groups.map(g => [g.name, g.stage, g.unit, g.total, g.amounts.mean, g.amounts.count, g.interval.days, ...distribution(g.interval), g.lastDate, g.elapsed])),
        periodSection(events, agg),
        section('입고예정 사전 등록 통계', ['품목', '구분', '사전 등록 평균(일)', '최소', '최대', '유효 표본 수', '완료처리 소요 평균(일)', '최소', '최대', '유효 표본 수', '완료 건수'],
          projection.registrationSummary.filter(filter).map(g => [g.name, g.stage, ...distribution(g.prior), ...distribution(g.processing), g.rows.length]),
          '완료 처리일이 조회기간에 포함된 완료건 기준. 사전 등록일수 = 최종 예정일 − 최초 등록일(KST). 완료처리 소요일수 = 완료 처리일 − 최초 등록일. 실제 발주일·도착일·배송 지연 지표가 아닙니다. 직접 입고·취소·미완료는 제외합니다.'),
        section('입고예정 등록 근거', ['품목', '구분', '최초 등록일(KST)', '최종 예정일', '완료 처리일(KST)', '사전 등록일수', '완료처리 소요일수', '확인 사항', '원본 기록'],
          registrations.map(r => [r.name, r.stage, r.createdDate, r.scheduledDate, r.date, r.prior, r.processing, r.note, r.source]),
          '최초 예정일은 추정하지 않습니다. 등록일 누락·날짜 역전 건은 해당 평균에서 제외합니다. 완료일 누락으로 제외된 예정일 기준 기간 내 기록: ' + projection.excludedSchedules.length + '건. 날짜 필드 자체가 없는 입고 이력의 완전성은 보장되지 않습니다.'),
        section('외부 입고 기록 상세', ['입고 기록일', '품목', '구분', '수량', '단위', '원본 기록', '제품 연결', '비고'], eventRows(events)),
        section('입고 집계 확인 사항', ['날짜', '품목', '원본 기록'], projection.excludedReceipts.filter(filter).map(e => [e.date, e.name, e.source]),
          '입고 유형이지만 수량·날짜가 유효하지 않은 기록은 합계·평균에서 제외합니다. 원본 기록을 확인해주세요.'),
      ] };
  }
  const projection = usageEvents(data, range), events = projection.events.filter(filter), groups = summarize(events, range);
  const calculated = events.filter(e => e.stage === '계산상 사용량');
  const productGroups = summarize(calculated.map(e => ({ ...e, itemId: JSON.stringify([e.itemId, e.product]), stage: e.product })), range);
  return { events, groups, productGroups, summary: '계산상 원료 사용 기록 ' + calculated.length + '건 · 재고 변동 기록 ' + (events.length - calculated.length) + '건 · 수량·스냅샷 누락 ' + projection.missing.length + '건',
    note: '계산상 사용량은 실적 확인 생산의 당시 레시피 스냅샷 기준입니다. 순차감은 검증된 자동 재포장 반환·복원을 부호대로 반영합니다. 확인 대기가 있는 품목의 합계는 잠정값이며 실제 투입 측정량과 다릅니다. 계산상 사용량과 더하지 않습니다.',
    sections: [
      section('원료·봉투 사용 내역', ['품목', '기준', '단위', '기간 합계', '달력 일평균', '생산일·변동일 평균', '생산일·변동일수', '기록 수'],
        groups.map(g => [g.name, g.stage, g.unit, g.total, g.calendarMean, g.workingMean, g.interval.days, g.events.length]),
        '달력 일평균은 조회기간 전체 일수, 계산상 사용량의 생산일 평균은 해당 원료가 기록된 실적 확인 생산일 수로 나눕니다. 재고 이력은 변동일 평균입니다.'),
      periodSection(events, agg),
      section('제품별 계산상 원료 사용량', ['원료', '제품', '단위', '계산상 사용량'], productGroups.map(g => [g.name, g.stage, g.unit, g.total])),
      section('사용량 근거 기록', ['기준 날짜', '품목', '기준', '수량', '단위', '원본 기록', '제품·생산 연결', '비고'], eventRows(events)),
      section('집계 확인 사항', ['구분', '원본 기록'], [
        ...projection.classifications.map(c => [({test:'테스트 확인',stockReconciliation:'실사 보정 확인',cancelledExecution:'취소된 실행',processingError:'시스템 처리 오류 · 실제 사용량 확인 불가'}[c.classification] || '분류 확인') + ' · 실제 사용량 합산 제외 · ' + c.reason, c.source]),
        ...projection.pending.map(c => ['확인 대기 · ' + c.reason, c.source]),
        ...projection.missing.map(source => ['수량·스냅샷 누락', source]),
        ...projection.unconfirmed.filter(filter).map(r => ['실적 미확인 · 계산상 사용량 제외', r.source]),
      ], '품목 ID가 없는 원료는 이름만으로 다른 생산의 원료와 합치지 않습니다. 미확인·누락 값을 0으로 대체하지 않습니다.'),
    ] };
}
function periodSection(events, agg) {
  return section('기간별 집계', ['기간 시작일', '품목', '단계·기준', '수량', '단위'],
    periodRows(events, agg).map(r => [r.period, r.name, r.stage, r.qty, r.unit]),
    '주는 월요일 시작입니다. 기록이 없는 날짜는 0으로 보간하지 않습니다.');
}
function tableMarkup(s, index) {
  const limit = tableLimits.get(index) || 50;
  return '<section class="stats-section"><h3 class="stats-detail-title">' + escapeHtml(s.title) + '</h3>' +
    (s.note ? '<p class="stats-detail-note">' + escapeHtml(s.note) + '</p>' : '') +
    '<div class="stats-table-scroll"><table class="stats-table"><thead><tr>' + s.headers.map(h => '<th scope="col">' + escapeHtml(h) + '</th>').join('') +
    '</tr></thead><tbody>' + (s.rows.length ? s.rows.slice(0, limit).map(row => '<tr>' + row.map(cell => '<td>' + escapeHtml(display(cell)) + '</td>').join('') + '</tr>').join('')
      : '<tr><td colspan="' + s.headers.length + '">집계 가능한 기록 없음</td></tr>') + '</tbody></table></div>' +
    '<p class="stats-detail-note">표시 ' + Math.min(limit, s.rows.length) + ' / ' + s.rows.length + '행</p>' +
    (s.rows.length > limit ? '<button class="stats-download-btn" data-more="' + index + '">50행 더 보기</button>' : '') + '</section>';
}
function renderModel() {
  if (!lastData || loadedStatsKey !== statsKey()) return;
  const evidenceOpen = document.getElementById('statsEvidenceFold')?.open;
  destroyAllCharts();
  const fullView = buildView(activeTab, lastData, currentRange(), aggregation);
  const selection = visualSelections[activeTab], choices = visualChoices(fullView, selection, activeTab);
  lastView = buildView(activeTab, lastData, currentRange(), aggregation, visualFilter(selection, matches));
  lastView.selectionLabel = [choices.scopes.find(s => s.id === selection.scope)?.label,
    choices.items.find(i => i.id === selection.item)?.label || '전체 품목'].filter(Boolean).join(' / ');
  lastProductionCount = activeTab === 'production' ? lastView.events.length : 0;
  const summary = document.getElementById('statsSummary'), overview = document.getElementById('statsOverviewArea'), detail = document.getElementById('statsDetailArea');
  if (summary) summary.innerHTML = '<div class="stats-summary-row">' + escapeHtml(lastView.summary) + '</div><p class="stats-detail-note">' + escapeHtml(lastView.note) +
    ' 미확인·누락 건수에는 선택 단계·품목과 연결되지 않은 조회 원본 기록이 포함될 수 있습니다.</p>';
  renderStatsVisuals({ host: document.getElementById('statsChartArea'), tab: activeTab, view: lastView, fullView, choices, selection,
    range: currentRange(), aggregation, calendarOffset, calendarLimit,
    onSelect: (field, value) => {
      selection[field] = value;
      if (field === 'scope') selection.item = '';
      calendarOffset = 0; calendarLimit = 20; tableLimits.clear(); renderModel();
    },
    onCalendar: (action, step) => {
      if (action === 'more') calendarLimit += 20;
      else calendarOffset = Math.max(0, calendarOffset + step);
      renderModel();
    },
    createChart: (node, config) => charts.push(new Chart(node, config)),
  });
  if (overview) overview.innerHTML = tableMarkup(compactSection(activeTab, lastView.sections[0]), 0);
  if (detail) detail.innerHTML = '<details class="stats-evidence-fold" id="statsEvidenceFold"' + (evidenceOpen ? ' open' : '') + '><summary>상세 지표 · 원본 기록 · 집계 확인 사항</summary>' +
    lastView.sections.map((s, i) => tableMarkup(s, i)).join('') + '</details>';
  for (const area of [overview, detail]) {
    area?.querySelectorAll('[data-more]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.more); tableLimits.set(index, (tableLimits.get(index) || 50) + 50); renderModel();
    }));
  }
}
function sheetRows(view, tab) {
  return [[TABS.find(t => t.id === tab).label], ['기간', startDate, endDate], ['집계', aggregation], ['품목 검색', filterTerm],
    ['조회 범위', view.selectionLabel || '모든 단계·품목'], [view.summary], [view.note], ...view.sections.flatMap(s => [[], [s.title], [s.note], s.headers, ...s.rows.map(row => row.map(value => value == null ? '확인 불가' : value))])];
}
async function download(all) {
  if (loadedStatsKey !== statsKey() || !lastData) return;
  const page = getPageContext(), token = queryToken, epoch = sessionStore.epoch, key = statsKey(), selected = visualKey(), term = filterTerm, range = currentRange(), agg = aggregation, tab = activeTab;
  const button = document.getElementById(all ? 'statsDownloadAllBtn' : 'statsDownloadBtn');
  const stillCurrent = () => (!page || page.isCurrent()) && epoch === sessionStore.epoch && token === queryToken && key === statsKey() && term === filterTerm && selected === visualKey();
  if (button) button.disabled = true;
  try {
    XLSX ||= await import('../utils/spreadsheet.js');
    if (!stillCurrent()) return;
    const data = all ? await Promise.all(TABS.map(t => loadStatsTab(t.id, { getDocs }, range))) : [lastData];
    if (!stillCurrent()) return;
    const workbook = XLSX.utils.book_new();
    (all ? TABS : TABS.filter(t => t.id === tab)).forEach((t, i) => {
      const view = all ? buildView(t.id, data[i], range, agg) : lastView;
      const sheet = XLSX.utils.aoa_to_sheet(sheetRows(view, t.id));
      sheet['!cols'] = Array.from({ length: 14 }, () => ({ wch: 22 }));
      XLSX.utils.book_append_sheet(workbook, sheet, t.label);
    });
    XLSX.writeFile(workbook, '생산통계_' + startDate + '~' + endDate + '.xlsx');
  } catch (error) {
    if (stillCurrent()) alert('통계를 다운로드하지 못했습니다. 연결과 권한을 확인해주세요.');
    console.error('[stats] 다운로드 실패', error);
  } finally {
    // A local selection may cancel export while the same loaded screen remains usable.
    if (button && (!page || page.isCurrent()) && epoch === sessionStore.epoch &&
      document.getElementById(button.id) === button && loadedStatsKey === statsKey()) button.disabled = false;
  }
}
export function preparePage({ cacheOnly = true } = {}) {
  const today = getTodayKST(), range = { startDate: today.slice(0, 7) + '-01', endDate: today, today };
  const key = JSON.stringify(['production', range.startDate, range.endDate]);
  return statsResource.prepare?.(key, scope => loadStatsTab('production', scope, range), { cacheOnly });
}
