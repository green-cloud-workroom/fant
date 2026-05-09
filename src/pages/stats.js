// src/pages/stats.js
// [묶음 7A] 통계 페이지 — 페이지 골격 + 데이터 로드 + 클라이언트 집계
// 차트는 묶음 7B~7D, Excel 다운로드는 7E에서 도입

import { db } from '../firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { formatKstDate, getTodayKST } from '../utils/date.js';

// ===== 모듈 변수 =====
let activeTab = 'production';        // 'production' | 'meat' | 'bag' | 'egg' | 'daily'
let periodMode = 'monthly';          // 'weekly' | 'monthly' | 'custom'
let startDate = '';
let endDate = '';
let aggregation = 'daily';           // 'daily' | 'weekly' | 'monthly' | 'yearly'

// [묶음 7A-2] 디바운스 + race 방지
// queryToken: 호출마다 +1. 응답 도착 시 token이 최신이 아니면 폐기 → 빠른 연속 변경 시 옛 응답이 새 화면 덮어쓰는 사고 차단
let refreshTimer = null;
let queryToken = 0;
const DEBOUNCE_MS = 300;

const TABS = [
  { id: 'production', label: '생산량' },
  { id: 'meat',       label: '원료 소모량' },
  { id: 'bag',        label: '봉투 소모량' },
  { id: 'egg',        label: '계란 사용량' },
  { id: 'daily',      label: '일별 생산 현황' },
];

// ===== 진입점 =====
export async function renderStats() {
  const content = document.getElementById('mainContent');
  if (!content) return;
  content.innerHTML = `<div style="padding:24px;"><p>통계 로딩 중...</p></div>`;
  initMonthlyPeriod();
  renderStatsLayout();
  await refreshStats(); // 첫 진입은 즉시 (디바운스 우회)
}

// ===== 기간 계산 =====
function initMonthlyPeriod() {
  const today = getTodayKST();
  const [y, m] = today.split('-').map(Number);
  const mm = String(m).padStart(2, '0');
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  startDate = `${y}-${mm}-01`;
  endDate = `${y}-${mm}-${String(lastDay).padStart(2, '0')}`;
}

function initWeeklyPeriod() {
  const todayStr = getTodayKST();
  const anchor = new Date(todayStr + 'T12:00:00+09:00');
  const dow = anchor.getUTCDay();
  const offsetToMonday = (dow === 0 ? -6 : 1 - dow);
  const monday = new Date(anchor.getTime() + offsetToMonday * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  startDate = formatKstDate(monday);
  endDate = formatKstDate(sunday);
}

function applyPeriodMode() {
  if (periodMode === 'monthly') initMonthlyPeriod();
  else if (periodMode === 'weekly') initWeeklyPeriod();
  // custom은 사용자 입력 그대로 유지
}

// ===== 레이아웃 =====
function renderStatsLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="stats-wrap">
      <div class="stats-tabs">
        ${TABS.map(t => `
          <button class="stats-tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
            ${t.label}
          </button>
        `).join('')}
      </div>

      <div class="stats-controls">
        <div class="stats-control-row">
          <span class="stats-control-label">기간</span>
          <div class="stats-mode-group">
            <button class="stats-mode-btn ${periodMode === 'weekly' ? 'active' : ''}" data-mode="weekly">주간</button>
            <button class="stats-mode-btn ${periodMode === 'monthly' ? 'active' : ''}" data-mode="monthly">월간</button>
            <button class="stats-mode-btn ${periodMode === 'custom' ? 'active' : ''}" data-mode="custom">직접</button>
          </div>
          <input type="date" class="stats-date-input" id="statsStartDate" value="${startDate}">
          <span class="stats-date-sep">~</span>
          <input type="date" class="stats-date-input" id="statsEndDate" value="${endDate}">
        </div>

        <div class="stats-control-row">
          <span class="stats-control-label">집계</span>
          <div class="stats-mode-group">
            <button class="stats-agg-btn ${aggregation === 'daily' ? 'active' : ''}" data-agg="daily">일별</button>
            <button class="stats-agg-btn ${aggregation === 'weekly' ? 'active' : ''}" data-agg="weekly">주별</button>
            <button class="stats-agg-btn ${aggregation === 'monthly' ? 'active' : ''}" data-agg="monthly">월별</button>
            <button class="stats-agg-btn ${aggregation === 'yearly' ? 'active' : ''}" data-agg="yearly">연별</button>
          </div>
          <button class="stats-download-btn" id="statsDownloadBtn">📥 Excel 다운로드</button>
        </div>
      </div>

      <div class="stats-summary" id="statsSummary"></div>

      <div class="stats-chart-area" id="statsChartArea">
        <div class="stats-placeholder">차트는 묶음 7B에서 도입 예정</div>
      </div>

      <div class="stats-detail-area" id="statsDetailArea"></div>
    </div>
  `;
  bindStatsEvents();
}

// ===== 이벤트 바인딩 =====
function bindStatsEvents() {
  document.querySelectorAll('.stats-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderStatsLayout();
      scheduleRefresh();
    });
  });

  document.querySelectorAll('.stats-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      periodMode = btn.dataset.mode;
      applyPeriodMode();
      renderStatsLayout();
      scheduleRefresh();
    });
  });

  const sd = document.getElementById('statsStartDate');
  const ed = document.getElementById('statsEndDate');
  if (sd) sd.addEventListener('change', (e) => {
    startDate = e.target.value;
    periodMode = 'custom';
    renderStatsLayout();
    scheduleRefresh();
  });
  if (ed) ed.addEventListener('change', (e) => {
    endDate = e.target.value;
    periodMode = 'custom';
    renderStatsLayout();
    scheduleRefresh();
  });

  document.querySelectorAll('.stats-agg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      aggregation = btn.dataset.agg;
      renderStatsLayout();
      scheduleRefresh();
    });
  });

  const dl = document.getElementById('statsDownloadBtn');
  if (dl) dl.addEventListener('click', () => {
    alert('Excel 다운로드는 묶음 7E에서 구현 예정입니다.');
  });
}

// [묶음 7A-2] 디바운스: 빈번한 변경 시 마지막 호출만 실제 쿼리
function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refreshStats();
  }, DEBOUNCE_MS);
}

// ===== 데이터 로드 (탭별 필요한 컬렉션만 쿼리) =====
// where('date', '>=', start) + where('date', '<=', end) — date 필드 단일 인덱스로 충분
async function loadProductionsInRange() {
  const q = query(
    collection(db, 'productions'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  // status 필터는 클라에서 (복합 인덱스 회피)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.status === 'active');
}

async function loadBagLogsInRange() {
  const q = query(
    collection(db, 'bagLogs'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadEggLogsInRange() {
  const q = query(
    collection(db, 'eggLogs'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadFrozenLogsInRange() {
  const q = query(
    collection(db, 'frozenLogs'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(l => l.status === 'active');
}

// ===== 집계 키 변환 =====
function getPeriodKey(dateStr, agg) {
  if (agg === 'daily') return dateStr;
  if (agg === 'weekly') return getWeekMondayKey(dateStr);
  if (agg === 'monthly') return dateStr.slice(0, 7);  // YYYY-MM
  if (agg === 'yearly') return dateStr.slice(0, 4);   // YYYY
  return dateStr;
}

// 그 날짜가 속한 주의 월요일 'YYYY-MM-DD' (월~일을 한 주로)
function getWeekMondayKey(dateStr) {
  const anchor = new Date(dateStr + 'T12:00:00+09:00');
  const dow = anchor.getUTCDay(); // 0(일)~6(토) — KST 정오 anchor라 자정 경계 안전
  const offsetToMonday = (dow === 0 ? -6 : 1 - dow);
  const monday = new Date(anchor.getTime() + offsetToMonday * 86400000);
  return formatKstDate(monday);
}

// ===== 집계 함수 =====

// [탭1] 생산량: 레시피별 + 기간별 합계 (운영자 결정 1: status='active'만)
function aggregateProductions(productions, agg) {
  const byPeriod = {};
  const byRecipe = {};
  let totalRaw = 0, totalFreezeDry = 0;

  for (const p of productions) {
    const key = getPeriodKey(p.date, agg);
    const qty = Number(p.productionUnitQty || 0);
    if (!byPeriod[key]) byPeriod[key] = {};
    if (!byPeriod[key][p.recipeId]) {
      byPeriod[key][p.recipeId] = { qty: 0, name: p.recipeName, color: p.color };
    }
    byPeriod[key][p.recipeId].qty += qty;

    if (!byRecipe[p.recipeId]) {
      byRecipe[p.recipeId] = {
        qty: 0,
        name: p.recipeName,
        color: p.color || '#4A7C59',
        unit: p.productionUnitName || '',
        category: p.category,
      };
    }
    byRecipe[p.recipeId].qty += qty;
    if (p.category === 'raw') totalRaw += qty;
    else if (p.category === 'freezeDry') totalFreezeDry += qty;
  }
  return { byPeriod, byRecipe, totalRaw, totalFreezeDry };
}

// [탭2] 원료 소모량: productions.ingredientsSnapshot 기준
// (운영자 결정 2: meatLogs 아닌 ingredientsSnapshot — autoDeductInventory=false 원료 포함)
function aggregateMeatFromProductions(productions, agg) {
  const byPeriod = {};
  const byMeat = {};
  let totalG = 0;

  for (const p of productions) {
    const key = getPeriodKey(p.date, agg);
    if (!byPeriod[key]) byPeriod[key] = {};

    for (const ing of (p.ingredientsSnapshot || [])) {
      if (!ing.requiredQtyG) continue;
      const ingKey = ing.meatTypeId || ing.name;
      const qtyG = Number(ing.requiredQtyG || 0);

      if (!byPeriod[key][ingKey]) byPeriod[key][ingKey] = { qtyG: 0, name: ing.name };
      byPeriod[key][ingKey].qtyG += qtyG;

      if (!byMeat[ingKey]) byMeat[ingKey] = { qtyG: 0, name: ing.name };
      byMeat[ingKey].qtyG += qtyG;
      totalG += qtyG;
    }
  }
  return { byPeriod, byMeat, totalG };
}

// [탭3] 봉투 소모량: autoDeduct + autoDeductReverse 의 abs(net)
// (운영자 결정 3: 예) deduct=-10, reverse=+3 → abs(-10 + 3) = 7)
function aggregateBagsFromLogs(bagLogs, agg) {
  const netByPeriod = {}; // period → bagId → { net, name }
  const netByBag = {};    // bagId → { net, name }

  for (const log of bagLogs) {
    if (log.type !== 'autoDeduct' && log.type !== 'autoDeductReverse') continue;
    const key = getPeriodKey(log.date, agg);
    const bagId = log.bagTypeId;
    const qty = Number(log.qty || 0);

    if (!netByPeriod[key]) netByPeriod[key] = {};
    if (!netByPeriod[key][bagId]) netByPeriod[key][bagId] = { net: 0, name: log.bagNameSnapshot };
    netByPeriod[key][bagId].net += qty;

    if (!netByBag[bagId]) netByBag[bagId] = { net: 0, name: log.bagNameSnapshot };
    netByBag[bagId].net += qty;
  }

  // sum 후 abs 적용 (운영자 명시)
  const byPeriod = {};
  for (const [k, perBag] of Object.entries(netByPeriod)) {
    byPeriod[k] = {};
    for (const [bk, bv] of Object.entries(perBag)) {
      byPeriod[k][bk] = { qty: Math.abs(bv.net), name: bv.name };
    }
  }
  const byBag = {};
  let total = 0;
  for (const [k, v] of Object.entries(netByBag)) {
    const used = Math.abs(v.net);
    byBag[k] = { qty: used, name: v.name };
    total += used;
  }
  return { byPeriod, byBag, total };
}

// [탭4] 계란 사용량: type='out'만 (운영자 결정 4)
function aggregateEggsFromLogs(eggLogs, agg) {
  const byPeriod = {};
  let total = 0;
  for (const log of eggLogs) {
    if (log.type !== 'out') continue;
    const key = getPeriodKey(log.date, agg);
    const used = Math.abs(Number(log.qty || 0));
    byPeriod[key] = (byPeriod[key] || 0) + used;
    total += used;
  }
  return { byPeriod, total };
}

// [탭5] 일별 생산 현황: 생식 productions + 동결건조 frozenLogs (운영자 결정 5)
function aggregateDailyView(productions, frozenLogs) {
  const items = [];
  for (const p of productions) {
    if (p.category !== 'raw') continue; // 생식만 (freezeDry productions는 frozenLogs로 대체)
    items.push({
      date: p.date, type: '생식', name: p.recipeName,
      qty: Number(p.productionUnitQty || 0), unit: p.productionUnitName || '',
    });
  }
  for (const log of frozenLogs) {
    items.push({
      date: log.date, type: '동결건조', name: log.productNameSnapshot,
      qty: Number(log.qty || 0), unit: '봉',
    });
  }
  items.sort((a, b) => b.date.localeCompare(a.date)); // 날짜 내림차순
  return items;
}

// ===== 메인 갱신 =====
async function refreshStats() {
  const myToken = ++queryToken;
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (summary) summary.innerHTML = `<div class="stats-placeholder">로딩 중...</div>`;
  if (detail) detail.innerHTML = '';

  try {
    if (activeTab === 'production') {
      const productions = await loadProductionsInRange();
      if (myToken !== queryToken) return; // 더 새 호출이 와서 폐기
      renderProductionTab(aggregateProductions(productions, aggregation), productions.length);
    } else if (activeTab === 'meat') {
      const productions = await loadProductionsInRange();
      if (myToken !== queryToken) return;
      renderMeatTab(aggregateMeatFromProductions(productions, aggregation));
    } else if (activeTab === 'bag') {
      const bagLogs = await loadBagLogsInRange();
      if (myToken !== queryToken) return;
      renderBagTab(aggregateBagsFromLogs(bagLogs, aggregation));
    } else if (activeTab === 'egg') {
      const eggLogs = await loadEggLogsInRange();
      if (myToken !== queryToken) return;
      renderEggTab(aggregateEggsFromLogs(eggLogs, aggregation));
    } else if (activeTab === 'daily') {
      const [productions, frozenLogs] = await Promise.all([
        loadProductionsInRange(),
        loadFrozenLogsInRange(),
      ]);
      if (myToken !== queryToken) return;
      renderDailyTab(aggregateDailyView(productions, frozenLogs));
    }
  } catch (err) {
    console.error('[stats] 로드 실패:', err);
    if (myToken !== queryToken) return;
    if (summary) summary.innerHTML = `<div class="stats-placeholder" style="color:#c0392b">로드 실패: ${err.message || err}</div>`;
    if (detail) detail.innerHTML = '';
  }
}

// ===== 탭별 렌더 =====

function renderProductionTab(agg, count) {
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (count === 0) { showEmpty(summary, detail); return; }

  summary.innerHTML = `
    <div class="stats-summary-row">
      <span>생식 합계: <b>${formatNumber(agg.totalRaw)}</b></span>
      <span>동결건조 합계: <b>${formatNumber(agg.totalFreezeDry)}</b></span>
      <span>레시피 수: <b>${Object.keys(agg.byRecipe).length}</b></span>
      <span>생산 건수: <b>${count}</b></span>
    </div>
  `;
  const rows = Object.values(agg.byRecipe)
    .sort((a, b) => b.qty - a.qty)
    .map(r => `
      <tr>
        <td><span class="stats-color-dot" style="background:${r.color}"></span>${escapeHtml(r.name)}</td>
        <td><span class="stats-tag stats-tag-${r.category}">${r.category === 'raw' ? '생식' : '동결'}</span></td>
        <td style="text-align:right"><b>${formatNumber(r.qty)}</b> ${escapeHtml(r.unit)}</td>
      </tr>
    `).join('');
  detail.innerHTML = `
    <div class="stats-detail-title">레시피별 생산량 (기간 합계)</div>
    <table class="stats-table">
      <thead><tr><th>레시피</th><th>구분</th><th style="text-align:right">생산량</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMeatTab(agg) {
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (agg.totalG === 0) { showEmpty(summary, detail); return; }

  summary.innerHTML = `
    <div class="stats-summary-row">
      <span>총 원료 소모량: <b>${(agg.totalG / 1000).toFixed(1)} kg</b></span>
      <span>원료 종류: <b>${Object.keys(agg.byMeat).length}</b></span>
    </div>
  `;
  const rows = Object.values(agg.byMeat)
    .sort((a, b) => b.qtyG - a.qtyG)
    .map(m => `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td style="text-align:right"><b>${(m.qtyG / 1000).toFixed(1)}</b> kg</td>
      </tr>
    `).join('');
  detail.innerHTML = `
    <div class="stats-detail-title">원료별 소모량 (기간 합계)</div>
    <div class="stats-detail-note">레시피 ingredientsSnapshot 기준 (autoDeductInventory=false 원료 포함)</div>
    <table class="stats-table">
      <thead><tr><th>원료</th><th style="text-align:right">소모량</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderBagTab(agg) {
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (agg.total === 0) { showEmpty(summary, detail); return; }

  summary.innerHTML = `
    <div class="stats-summary-row">
      <span>총 봉투 소모량: <b>${formatNumber(agg.total)} 장</b></span>
      <span>봉투 종류: <b>${Object.keys(agg.byBag).length}</b></span>
    </div>
  `;
  const rows = Object.values(agg.byBag)
    .sort((a, b) => b.qty - a.qty)
    .map(b => `
      <tr>
        <td>${escapeHtml(b.name || '-')}</td>
        <td style="text-align:right"><b>${formatNumber(b.qty)}</b> 장</td>
      </tr>
    `).join('');
  detail.innerHTML = `
    <div class="stats-detail-title">봉투별 소모량 (기간 합계)</div>
    <div class="stats-detail-note">autoDeduct + autoDeductReverse 의 abs(net), 수동조정 제외</div>
    <table class="stats-table">
      <thead><tr><th>봉투</th><th style="text-align:right">소모량</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderEggTab(agg) {
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (agg.total === 0) { showEmpty(summary, detail); return; }

  summary.innerHTML = `
    <div class="stats-summary-row">
      <span>총 계란 사용량: <b>${formatNumber(agg.total)} 개</b></span>
      <span>집계 구간 수: <b>${Object.keys(agg.byPeriod).length}</b></span>
    </div>
  `;
  const sortedKeys = Object.keys(agg.byPeriod).sort();
  const rows = sortedKeys.map(k => `
    <tr><td>${escapeHtml(k)}</td><td style="text-align:right"><b>${formatNumber(agg.byPeriod[k])}</b> 개</td></tr>
  `).join('');
  detail.innerHTML = `
    <div class="stats-detail-title">기간별 계란 사용량</div>
    <div class="stats-detail-note">eggLogs.type === 'out' 만 합산 (입고/수동조정 제외)</div>
    <table class="stats-table">
      <thead><tr><th>기간</th><th style="text-align:right">사용량</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderDailyTab(items) {
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (items.length === 0) { showEmpty(summary, detail); return; }

  const rawCount = items.filter(i => i.type === '생식').length;
  const freezeCount = items.filter(i => i.type === '동결건조').length;
  summary.innerHTML = `
    <div class="stats-summary-row">
      <span>생식 생산: <b>${rawCount}</b> 건</span>
      <span>동결건조 입고: <b>${freezeCount}</b> 건</span>
      <span>총 <b>${items.length}</b> 건</span>
    </div>
  `;
  const rows = items.map(i => `
    <tr>
      <td>${escapeHtml(i.date)}</td>
      <td><span class="stats-tag stats-tag-${i.type === '생식' ? 'raw' : 'freezeDry'}">${i.type}</span></td>
      <td>${escapeHtml(i.name || '')}</td>
      <td style="text-align:right"><b>${formatNumber(i.qty)}</b> ${escapeHtml(i.unit)}</td>
    </tr>
  `).join('');
  detail.innerHTML = `
    <div class="stats-detail-title">일별 생산 현황 (날짜 내림차순)</div>
    <div class="stats-detail-note">생식: productions.status='active' / 동결건조: frozenLogs.status='active' (입고 실적)</div>
    <table class="stats-table">
      <thead><tr><th>날짜</th><th>구분</th><th>제품명</th><th style="text-align:right">수량</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ===== 공통 유틸 =====
function showEmpty(summary, detail) {
  if (summary) summary.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`;
  if (detail) detail.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`;
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('ko-KR');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
