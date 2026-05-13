// src/pages/stats.js
// [묶음 7A~7F-2] 통계 페이지: 차트, Excel 다운로드, 봉투 박스 환산, 원료 통계 표시 필터

import { db } from '../firebase.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { formatKstDate, getTodayKST } from '../utils/date.js';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

let activeTab = 'production';
let periodMode = 'monthly';
let startDate = '';
let endDate = '';
let aggregation = 'daily';

let refreshTimer = null;
let queryToken = 0;
const DEBOUNCE_MS = 300;

let productionChart = null;
let meatChart = null;
let bagChart = null;
let eggChart = null;

let visibleRecipeIds = new Set();
let knownRecipeIds = new Set();
let visibleMeatIds = new Set();
let knownMeatIds = new Set();
let visibleBagIds = new Set();
let knownBagIds = new Set();
let visibleSupplementIds = new Set();
let knownSupplementIds = new Set();

let lastProductionAgg = null;
let lastProductionCount = 0;
let lastMeatAgg = null;
let lastBagAgg = null;
let lastEggAgg = null;
let lastDailyItems = null;
let lastSupplementAgg = null;
let includeInactiveSupplements = false;

let bagPiecesPerBoxMap = {};
let meatTypeAutoDeductMap = {};
let meatTypeShowInStatsMap = {};

const EGG_COLOR = '#E8B339';
const BAG_PALETTE = [
  '#4A7C59', '#E8B339', '#5B89C9', '#C95B7A', '#8A6FB5',
  '#3DA89E', '#E07A5F', '#7A8B5B', '#A85AB5', '#5BA8E0',
];
const MEAT_PALETTE = [
  '#C0392B', '#E67E22', '#16A085', '#2980B9', '#8E44AD',
  '#D35400', '#27AE60', '#F39C12', '#7F8C8D', '#34495E',
];

function bagColorByIndex(idx) { return BAG_PALETTE[idx % BAG_PALETTE.length]; }
function meatColorByIndex(idx) { return MEAT_PALETTE[idx % MEAT_PALETTE.length]; }

const TABS = [
  { id: 'production', label: '생산량' },
  { id: 'meat', label: '원료 소모량' },
  { id: 'bag', label: '봉투 소모량' },
  { id: 'egg', label: '계란 사용량' },
  { id: 'daily', label: '일별 생산 현황' },
  { id: 'supplement', label: '영양제' },
];

export async function renderStats() {
  const content = document.getElementById('mainContent');
  if (!content) return;
  content.innerHTML = `<div style="padding:24px;"><p>통계 로딩 중...</p></div>`;

  destroyAllCharts();
  activeTab = 'production';
  periodMode = 'monthly';
  aggregation = 'daily';
  visibleRecipeIds = new Set();
  knownRecipeIds = new Set();
  visibleMeatIds = new Set();
  knownMeatIds = new Set();
  visibleBagIds = new Set();
  knownBagIds = new Set();
  visibleSupplementIds = new Set();
  knownSupplementIds = new Set();
  lastProductionAgg = null;
  lastProductionCount = 0;
  lastMeatAgg = null;
  lastBagAgg = null;
  lastEggAgg = null;
  lastDailyItems = null;
  lastSupplementAgg = null;
  includeInactiveSupplements = false;
  bagPiecesPerBoxMap = {};
  meatTypeAutoDeductMap = {};
  meatTypeShowInStatsMap = {};

  initMonthlyPeriod();
  renderStatsLayout();
  await refreshStats();
}

function destroyAllCharts() {
  if (productionChart) { productionChart.destroy(); productionChart = null; }
  if (meatChart) { meatChart.destroy(); meatChart = null; }
  if (bagChart) { bagChart.destroy(); bagChart = null; }
  if (eggChart) { eggChart.destroy(); eggChart = null; }
}

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
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(anchor.getTime() + offsetToMonday * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  startDate = formatKstDate(monday);
  endDate = formatKstDate(sunday);
}

function applyPeriodMode() {
  if (periodMode === 'monthly') initMonthlyPeriod();
  else if (periodMode === 'weekly') initWeeklyPeriod();
}

function renderStatsLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="stats-wrap">
      <div class="stats-tabs">
        ${TABS.map(t => `<button class="stats-tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
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
          <button class="stats-download-btn stats-download-btn-all" id="statsDownloadAllBtn">📥 전체 다운로드</button>
        </div>
      </div>

      <div class="stats-summary" id="statsSummary"></div>
      <div class="stats-chart-area" id="statsChartArea"><div class="stats-placeholder">차트 로딩 중...</div></div>
      <div class="stats-detail-area" id="statsDetailArea"></div>
    </div>
  `;
  bindStatsEvents();
}

function bindStatsEvents() {
  document.querySelectorAll('.stats-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      destroyAllCharts();
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
  if (sd) sd.addEventListener('change', e => {
    startDate = e.target.value;
    periodMode = 'custom';
    renderStatsLayout();
    scheduleRefresh();
  });
  if (ed) ed.addEventListener('change', e => {
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
  if (dl) dl.addEventListener('click', handleExcelDownload);
  const dlAll = document.getElementById('statsDownloadAllBtn');
  if (dlAll) dlAll.addEventListener('click', handleExcelDownloadAll);
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refreshStats();
  }, DEBOUNCE_MS);
}

async function loadProductionsInRange() {
  const q = query(collection(db, 'productions'), where('date', '>=', startDate), where('date', '<=', endDate));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.status === 'active');
}

async function loadBagLogsInRange() {
  const q = query(collection(db, 'bagLogs'), where('date', '>=', startDate), where('date', '<=', endDate));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadEggLogsInRange() {
  const q = query(collection(db, 'eggLogs'), where('date', '>=', startDate), where('date', '<=', endDate));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadFrozenLogsInRange() {
  const q = query(collection(db, 'frozenLogs'), where('date', '>=', startDate), where('date', '<=', endDate));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.status === 'active');
}

async function loadSupplementLogsInRange() {
  const q = query(collection(db, 'supplementLogs'), where('date', '>=', startDate), where('date', '<=', endDate));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadSupplementTypes() {
  const snap = await getDocs(collection(db, 'supplementTypes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadSupplementStocks() {
  const snap = await getDocs(collection(db, 'supplementStock'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadBagPiecesPerBoxMap() {
  const snap = await getDocs(collection(db, 'bagTypes'));
  const map = {};
  for (const d of snap.docs) map[d.id] = Number(d.data().piecesPerBox || 0);
  return map;
}

async function loadMeatTypeShowInStatsMap() {
  const snap = await getDocs(collection(db, 'meatTypes'));
  const map = {};
  for (const d of snap.docs) map[d.id] = d.data().showInStats !== false;
  return map;
}

function buildMeatAutoDeductMap(productions) {
  const map = {};
  for (const p of productions) {
    for (const ing of (p.ingredientsSnapshot || [])) {
      const id = ing.meatTypeId || ing.name;
      const currentAuto = ing.autoDeductInventory !== false;
      if (map[id] === undefined) map[id] = currentAuto;
      else map[id] = map[id] && currentAuto;
    }
  }
  return map;
}

function getPeriodKey(dateStr, agg) {
  if (agg === 'daily') return dateStr;
  if (agg === 'weekly') return getWeekMondayKey(dateStr);
  if (agg === 'monthly') return dateStr.slice(0, 7);
  if (agg === 'yearly') return dateStr.slice(0, 4);
  return dateStr;
}

function getWeekMondayKey(dateStr) {
  const anchor = new Date(dateStr + 'T12:00:00+09:00');
  const dow = anchor.getUTCDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(anchor.getTime() + offsetToMonday * 86400000);
  return formatKstDate(monday);
}

function buildPeriodKeys(start, end, agg) {
  const keys = [];
  if (agg === 'daily') {
    let cursor = new Date(start + 'T12:00:00+09:00');
    const endAnchor = new Date(end + 'T12:00:00+09:00');
    while (cursor <= endAnchor) {
      keys.push(formatKstDate(cursor));
      cursor = new Date(cursor.getTime() + 86400000);
    }
  } else if (agg === 'weekly') {
    let cursor = new Date(getWeekMondayKey(start) + 'T12:00:00+09:00');
    const endAnchor = new Date(getWeekMondayKey(end) + 'T12:00:00+09:00');
    while (cursor <= endAnchor) {
      keys.push(formatKstDate(cursor));
      cursor = new Date(cursor.getTime() + 7 * 86400000);
    }
  } else if (agg === 'monthly') {
    const [startY, startM] = start.split('-').slice(0, 2).map(Number);
    const [endY, endM] = end.split('-').slice(0, 2).map(Number);
    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      keys.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else if (agg === 'yearly') {
    const startY = parseInt(start.split('-')[0], 10);
    const endY = parseInt(end.split('-')[0], 10);
    for (let y = startY; y <= endY; y++) keys.push(String(y));
  }
  return keys;
}

function aggregateProductions(productions, agg) {
  const byPeriod = {};
  const byRecipe = {};
  let totalRaw = 0, totalFreezeDry = 0;
  for (const p of productions) {
    const key = getPeriodKey(p.date, agg);
    const qty = Number(p.productionUnitQty || 0);
    if (!byPeriod[key]) byPeriod[key] = {};
    if (!byPeriod[key][p.recipeId]) byPeriod[key][p.recipeId] = { qty: 0, name: p.recipeName, color: p.color };
    byPeriod[key][p.recipeId].qty += qty;
    if (!byRecipe[p.recipeId]) {
      byRecipe[p.recipeId] = { qty: 0, name: p.recipeName, color: p.color || '#4A7C59', unit: p.productionUnitName || '', category: p.category };
    }
    byRecipe[p.recipeId].qty += qty;
    if (p.category === 'raw') totalRaw += qty;
    else if (p.category === 'freezeDry') totalFreezeDry += qty;
  }
  return { byPeriod, byRecipe, totalRaw, totalFreezeDry };
}

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

function filterMeatAggByShowInStats(agg, showInStatsMap) {
  const byMeat = {};
  let totalG = 0;
  for (const [id, meat] of Object.entries(agg.byMeat)) {
    if (showInStatsMap[id] === false) continue;
    byMeat[id] = meat;
    totalG += meat.qtyG;
  }
  const byPeriod = {};
  for (const [period, perMeat] of Object.entries(agg.byPeriod)) {
    byPeriod[period] = {};
    for (const [id, meat] of Object.entries(perMeat)) {
      if (showInStatsMap[id] !== false) byPeriod[period][id] = meat;
    }
  }
  return { byPeriod, byMeat, totalG };
}

function aggregateBagsFromLogs(bagLogs, agg) {
  const netByPeriod = {};
  const netByBag = {};
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
  const byPeriod = {};
  for (const [period, perBag] of Object.entries(netByPeriod)) {
    byPeriod[period] = {};
    for (const [bagId, bag] of Object.entries(perBag)) byPeriod[period][bagId] = { qty: Math.abs(bag.net), name: bag.name };
  }
  const byBag = {};
  let total = 0;
  for (const [bagId, bag] of Object.entries(netByBag)) {
    const qty = Math.abs(bag.net);
    byBag[bagId] = { qty, name: bag.name };
    total += qty;
  }
  return { byPeriod, byBag, total };
}

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

function aggregateSupplements(supplementTypes, supplementStocks, supplementLogs) {
  const stockMap = new Map((supplementStocks || []).map(s => [s.id, Number(s.currentQty || 0)]));
  const logAgg = new Map();
  for (const log of supplementLogs || []) {
    const skuId = log.supplementTypeId;
    if (!skuId) continue;
    if (!logAgg.has(skuId)) logAgg.set(skuId, { in: 0, used: 0, adjust: 0 });
    const row = logAgg.get(skuId);
    const qty = Number(log.qty || 0);
    if (log.type === 'in') row.in += qty;
    else if (log.type === 'autoDeduct') row.used += -qty;
    else if (log.type === 'adjust') row.adjust += qty;
  }

  const rows = (supplementTypes || []).map(type => {
    const a = logAgg.get(type.id) || { in: 0, used: 0, adjust: 0 };
    return {
      skuId: type.id,
      name: type.name || type.id,
      active: type.active !== false,
      sortOrder: Number(type.sortOrder ?? 999999),
      in: a.in,
      used: a.used,
      adjust: a.adjust,
      currentQty: stockMap.get(type.id) || 0,
    };
  }).sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name, 'ko'));

  const totals = rows.reduce((sum, row) => ({
    in: sum.in + row.in,
    used: sum.used + row.used,
    adjust: sum.adjust + row.adjust,
    currentQty: sum.currentQty + row.currentQty,
  }), { in: 0, used: 0, adjust: 0, currentQty: 0 });

  return { rows, totals };
}

function aggregateDailyView(productions, frozenLogs) {
  const map = new Map();
  function add(date, type, name, qty, unit) {
    const key = `${date}|${type}|${name}`;
    const existing = map.get(key);
    if (existing) existing.qty += qty;
    else map.set(key, { date, type, name, qty, unit });
  }
  for (const p of productions) {
    if (p.category !== 'raw') continue;
    add(p.date, '생식', p.recipeName, Number(p.productionUnitQty || 0), p.productionUnitName || '');
  }
  for (const log of frozenLogs) add(log.date, '동결건조', log.productNameSnapshot, Number(log.qty || 0), '봉');
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

async function refreshStats() {
  const myToken = ++queryToken;
  const summary = document.getElementById('statsSummary');
  const detail = document.getElementById('statsDetailArea');
  if (summary) summary.innerHTML = `<div class="stats-placeholder">로딩 중...</div>`;
  if (detail) detail.innerHTML = '';

  try {
    if (activeTab === 'production') {
      const productions = await loadProductionsInRange();
      if (myToken !== queryToken) return;
      const agg = aggregateProductions(productions, aggregation);
      lastProductionAgg = agg;
      lastProductionCount = productions.length;
      registerNewRecipes(agg.byRecipe);
      renderProductionTab(agg, productions.length);
    } else if (activeTab === 'meat') {
      const [productions, showInStatsMap] = await Promise.all([loadProductionsInRange(), loadMeatTypeShowInStatsMap()]);
      if (myToken !== queryToken) return;
      meatTypeShowInStatsMap = showInStatsMap;
      meatTypeAutoDeductMap = buildMeatAutoDeductMap(productions);
      const agg = filterMeatAggByShowInStats(aggregateMeatFromProductions(productions, aggregation), showInStatsMap);
      lastMeatAgg = agg;
      registerNewMeats(agg.byMeat);
      renderMeatTab(agg);
    } else if (activeTab === 'bag') {
      const [bagLogs, bagMap] = await Promise.all([loadBagLogsInRange(), loadBagPiecesPerBoxMap()]);
      if (myToken !== queryToken) return;
      bagPiecesPerBoxMap = bagMap;
      const agg = aggregateBagsFromLogs(bagLogs, aggregation);
      lastBagAgg = agg;
      registerNewBags(agg.byBag);
      renderBagTab(agg);
    } else if (activeTab === 'egg') {
      const eggLogs = await loadEggLogsInRange();
      if (myToken !== queryToken) return;
      const agg = aggregateEggsFromLogs(eggLogs, aggregation);
      lastEggAgg = agg;
      renderEggTab(agg);
    } else if (activeTab === 'daily') {
      const [productions, frozenLogs] = await Promise.all([loadProductionsInRange(), loadFrozenLogsInRange()]);
      if (myToken !== queryToken) return;
      const items = aggregateDailyView(productions, frozenLogs);
      lastDailyItems = items;
      renderDailyTab(items);
    } else if (activeTab === 'supplement') {
      const [types, stocks, logs] = await Promise.all([loadSupplementTypes(), loadSupplementStocks(), loadSupplementLogsInRange()]);
      if (myToken !== queryToken) return;
      const agg = aggregateSupplements(types, stocks, logs);
      lastSupplementAgg = agg;
      registerNewSupplements(agg.rows);
      renderSupplementTab(agg);
    }
  } catch (err) {
    console.error('[stats] 로드 실패:', err);
    if (myToken !== queryToken) return;
    if (summary) summary.innerHTML = `<div class="stats-placeholder" style="color:#c0392b">로드 실패: ${err.message || err}</div>`;
    if (detail) detail.innerHTML = '';
  }
}

function registerNewRecipes(byRecipe) {
  for (const id of Object.keys(byRecipe)) if (!knownRecipeIds.has(id)) { knownRecipeIds.add(id); visibleRecipeIds.add(id); }
}
function registerNewMeats(byMeat) {
  for (const id of Object.keys(byMeat)) if (!knownMeatIds.has(id)) { knownMeatIds.add(id); visibleMeatIds.add(id); }
}
function registerNewBags(byBag) {
  for (const id of Object.keys(byBag)) if (!knownBagIds.has(id)) { knownBagIds.add(id); visibleBagIds.add(id); }
}
function registerNewSupplements(rows) {
  for (const row of rows) if (!knownSupplementIds.has(row.skuId)) { knownSupplementIds.add(row.skuId); visibleSupplementIds.add(row.skuId); }
}

function formatBagQty(piecesQty, piecesPerBox) {
  const pcs = Math.round(Number(piecesQty || 0));
  const ppb = Number(piecesPerBox || 0);
  if (!ppb) return `${formatNumber(pcs)}장 *`;
  const boxes = Math.floor(pcs / ppb);
  const remainder = pcs - boxes * ppb;
  if (remainder === 0) return `${formatNumber(boxes)}박스 (${formatNumber(pcs)}장)`;
  return `${formatNumber(boxes)}박스 ${formatNumber(remainder)}장 (${formatNumber(pcs)}장)`;
}

function piecesToBoxesFloat(piecesQty, piecesPerBox) {
  const ppb = Number(piecesPerBox || 0);
  if (!ppb) return 0;
  return Number(piecesQty || 0) / ppb;
}

function calculateBagTotalDisplay(byBag) {
  let totalBoxes = 0, totalPieces = 0, hasUnconvertible = false;
  for (const [id, bag] of Object.entries(byBag)) {
    const qty = Math.round(Number(bag.qty || 0));
    const ppb = Number(bagPiecesPerBoxMap[id] || 0);
    totalPieces += qty;
    if (ppb > 0) totalBoxes += Math.floor(qty / ppb);
    else hasUnconvertible = true;
  }
  return { totalBoxes, totalPieces, hasUnconvertible };
}

function renderProductionTab(agg, count) {
  const summary = document.getElementById('statsSummary');
  const chartArea = document.getElementById('statsChartArea');
  const detail = document.getElementById('statsDetailArea');
  destroyAllCharts();
  if (count === 0) { showEmpty(summary, detail); if (chartArea) chartArea.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`; return; }

  summary.innerHTML = `<div class="stats-summary-row"><span>생식 합계: <b>${formatNumber(agg.totalRaw)}</b></span><span>동결건조 합계: <b>${formatNumber(agg.totalFreezeDry)}</b></span><span>레시피 수: <b>${Object.keys(agg.byRecipe).length}</b></span><span>생산 건수: <b>${count}</b></span></div>`;
  const recipeChips = Object.entries(agg.byRecipe).sort((a, b) => b[1].qty - a[1].qty).map(([id, r]) => `<label class="stats-recipe-chip" style="--recipe-color: ${r.color}"><input type="checkbox" data-recipe-id="${id}" ${visibleRecipeIds.has(id) ? 'checked' : ''}><span class="stats-recipe-chip-dot"></span><span class="stats-recipe-chip-label">${escapeHtml(r.name)}</span></label>`).join('');
  chartArea.innerHTML = `<div class="stats-recipe-toggles">${recipeChips}</div><div class="stats-chart-canvas-wrap"><canvas id="statsProductionChart"></canvas></div>`;
  drawProductionChart(agg);
  chartArea.querySelectorAll('.stats-recipe-chip input').forEach(cb => cb.addEventListener('change', e => {
    const id = e.target.dataset.recipeId;
    if (e.target.checked) visibleRecipeIds.add(id);
    else visibleRecipeIds.delete(id);
    updateProductionChartVisibility();
  }));
  const rows = Object.values(agg.byRecipe).sort((a, b) => b.qty - a.qty).map(r => `<tr><td><span class="stats-color-dot" style="background:${r.color}"></span>${escapeHtml(r.name)}</td><td><span class="stats-tag stats-tag-${r.category}">${r.category === 'raw' ? '생식' : '동결'}</span></td><td style="text-align:right"><b>${formatNumber(r.qty)}</b> ${escapeHtml(r.unit)}</td></tr>`).join('');
  detail.innerHTML = `<div class="stats-detail-title">레시피별 생산량 (기간 합계)</div><table class="stats-table"><thead><tr><th>레시피</th><th>구분</th><th style="text-align:right">생산량</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function drawProductionChart(agg) {
  const canvas = document.getElementById('statsProductionChart');
  if (!canvas) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  productionChart = new Chart(canvas, { type: 'line', data: { labels: periodKeys, datasets: buildProductionChartDatasets(agg, periodKeys) }, options: chartLineOptions(ctx => `${ctx.dataset.label}: ${formatNumber(ctx.parsed.y)}`) });
}

function buildProductionChartDatasets(agg, periodKeys) {
  return Object.entries(agg.byRecipe)
    .filter(([id]) => visibleRecipeIds.has(id))
    .map(([id, r]) => ({
      label: r.name,
      data: periodKeys.map(k => agg.byPeriod[k]?.[id]?.qty || 0),
      borderColor: r.color,
      backgroundColor: r.color,
      tension: 0.2,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: false,
    }));
}

function updateProductionChartVisibility() {
  if (!productionChart || !lastProductionAgg) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  productionChart.data.labels = periodKeys;
  productionChart.data.datasets = buildProductionChartDatasets(lastProductionAgg, periodKeys);
  productionChart.update();
}

function renderMeatTab(agg) {
  const summary = document.getElementById('statsSummary');
  const chartArea = document.getElementById('statsChartArea');
  const detail = document.getElementById('statsDetailArea');
  destroyAllCharts();
  if (agg.totalG === 0) { showEmpty(summary, detail); if (chartArea) chartArea.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`; return; }

  summary.innerHTML = `<div class="stats-summary-row"><span>총 원료 소모량: <b>${(agg.totalG / 1000).toFixed(1)} kg</b></span><span>원료 종류: <b>${Object.keys(agg.byMeat).length}</b></span><span style="font-size:11px;color:#888">통계 비표시 원료는 자동 제외됨</span></div>`;
  const sortedMeats = Object.entries(agg.byMeat).sort((a, b) => b[1].qtyG - a[1].qtyG);
  const meatColorMap = {};
  sortedMeats.forEach(([id], i) => { meatColorMap[id] = meatColorByIndex(i); });

  const chips = sortedMeats.map(([id, m]) => {
    const expectedTag = meatTypeAutoDeductMap[id] === false ? '<span class="stats-expected-tag">예상</span>' : '';
    return `<label class="stats-recipe-chip" style="--recipe-color: ${meatColorMap[id]}"><input type="checkbox" data-meat-id="${id}" ${visibleMeatIds.has(id) ? 'checked' : ''}><span class="stats-recipe-chip-dot"></span><span class="stats-recipe-chip-label">${escapeHtml(m.name)}${expectedTag}</span></label>`;
  }).join('');
  chartArea.innerHTML = `<div class="stats-recipe-toggles">${chips}</div><div class="stats-chart-canvas-wrap"><canvas id="statsMeatChart"></canvas></div>`;
  drawMeatChart(agg, meatColorMap);
  chartArea.querySelectorAll('.stats-recipe-chip input').forEach(cb => cb.addEventListener('change', e => {
    const id = e.target.dataset.meatId;
    if (e.target.checked) visibleMeatIds.add(id);
    else visibleMeatIds.delete(id);
    updateMeatChartVisibility(meatColorMap);
  }));

  const rows = sortedMeats.map(([id, m]) => {
    const note = meatTypeAutoDeductMap[id] === false ? '<span class="stats-expected-note">예상 사용량 (재고 차감 없음)</span>' : '';
    return `<tr><td><span class="stats-color-dot" style="background:${meatColorMap[id]}"></span>${escapeHtml(m.name)} ${note}</td><td style="text-align:right"><b>${(m.qtyG / 1000).toFixed(1)}</b> kg</td></tr>`;
  }).join('');
  detail.innerHTML = `<div class="stats-detail-title">원료별 소모량 (기간 합계)</div><div class="stats-detail-note">레시피 ingredientsSnapshot 기준 / 통계 비표시 원료는 제외됨 / "예상 사용량" = 재고 차감 안 하는 원료</div><table class="stats-table"><thead><tr><th>원료</th><th style="text-align:right">소모량</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function drawMeatChart(agg, colorMap) {
  const canvas = document.getElementById('statsMeatChart');
  if (!canvas) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  meatChart = new Chart(canvas, { type: 'line', data: { labels: periodKeys, datasets: buildMeatChartDatasets(agg, periodKeys, colorMap) }, options: chartLineOptions(ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} kg`) });
}

function buildMeatChartDatasets(agg, periodKeys, colorMap) {
  return Object.entries(agg.byMeat)
    .filter(([id]) => visibleMeatIds.has(id))
    .map(([id, m]) => ({
      label: m.name,
      data: periodKeys.map(k => (agg.byPeriod[k]?.[id]?.qtyG || 0) / 1000),
      borderColor: colorMap[id],
      backgroundColor: colorMap[id],
      tension: 0.2,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: false,
    }));
}

function updateMeatChartVisibility(colorMap) {
  if (!meatChart || !lastMeatAgg) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  meatChart.data.labels = periodKeys;
  meatChart.data.datasets = buildMeatChartDatasets(lastMeatAgg, periodKeys, colorMap);
  meatChart.update();
}

function renderBagTab(agg) {
  const summary = document.getElementById('statsSummary');
  const chartArea = document.getElementById('statsChartArea');
  const detail = document.getElementById('statsDetailArea');
  destroyAllCharts();
  if (agg.total === 0) { showEmpty(summary, detail); if (chartArea) chartArea.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`; return; }

  const totalDisplay = calculateBagTotalDisplay(agg.byBag);
  summary.innerHTML = `<div class="stats-summary-row"><span>박스 환산 합계: <b>${formatNumber(totalDisplay.totalBoxes)}박스</b> / 총 <b>${formatNumber(totalDisplay.totalPieces)}장</b></span><span>봉투 종류: <b>${Object.keys(agg.byBag).length}</b></span>${totalDisplay.hasUnconvertible ? '<span style="color:#c0392b;font-size:11px">* 박스당 장수 미설정 봉투 포함</span>' : ''}</div>`;
  const sortedBags = Object.entries(agg.byBag).sort((a, b) => b[1].qty - a[1].qty);
  const bagColorMap = {};
  sortedBags.forEach(([id], i) => { bagColorMap[id] = bagColorByIndex(i); });
  const chips = sortedBags.map(([id, b]) => `<label class="stats-recipe-chip" style="--recipe-color: ${bagColorMap[id]}"><input type="checkbox" data-bag-id="${id}" ${visibleBagIds.has(id) ? 'checked' : ''}><span class="stats-recipe-chip-dot"></span><span class="stats-recipe-chip-label">${escapeHtml(b.name || '-')}${(bagPiecesPerBoxMap[id] || 0) > 0 ? '' : ' *'}</span></label>`).join('');
  chartArea.innerHTML = `<div class="stats-recipe-toggles">${chips}</div><div class="stats-chart-canvas-wrap"><canvas id="statsBagChart"></canvas></div>`;
  drawBagChart(agg, bagColorMap);
  chartArea.querySelectorAll('.stats-recipe-chip input').forEach(cb => cb.addEventListener('change', e => {
    const id = e.target.dataset.bagId;
    if (e.target.checked) visibleBagIds.add(id);
    else visibleBagIds.delete(id);
    updateBagChartVisibility(bagColorMap);
  }));
  const rows = sortedBags.map(([id, b]) => `<tr><td><span class="stats-color-dot" style="background:${bagColorMap[id]}"></span>${escapeHtml(b.name || '-')}</td><td style="text-align:right"><b>${formatBagQty(b.qty, bagPiecesPerBoxMap[id] || 0)}</b></td></tr>`).join('');
  detail.innerHTML = `<div class="stats-detail-title">봉투별 소모량 (기간 합계)</div><div class="stats-detail-note">autoDeduct + autoDeductReverse 의 abs(net), 수동조정 제외 / * 박스당 장수 미설정 봉투는 장 단위만</div><table class="stats-table"><thead><tr><th>봉투</th><th style="text-align:right">소모량</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function drawBagChart(agg, colorMap) {
  const canvas = document.getElementById('statsBagChart');
  if (!canvas) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  bagChart = new Chart(canvas, {
    type: 'bar',
    data: { labels: periodKeys, datasets: buildBagChartDatasets(agg, periodKeys, colorMap) },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const ppb = bagPiecesPerBoxMap[ctx.dataset.bagId] || 0;
              if (!ppb) return `${ctx.dataset.label}: (박스 변환 불가) *`;
              return `${ctx.dataset.label}: ${formatBagQty(Math.round(ctx.parsed.y * ppb), ppb)}`;
            },
          },
        },
      },
      scales: {
        x: { stacked: true, ticks: { maxRotation: 45, autoSkip: true, autoSkipPadding: 8 } },
        y: { stacked: true, beginAtZero: true, ticks: { callback: v => `${formatNumber(v)}박스` } },
      },
    },
  });
}

function buildBagChartDatasets(agg, periodKeys, colorMap) {
  return Object.entries(agg.byBag)
    .filter(([id]) => visibleBagIds.has(id))
    .map(([id, b]) => ({
      label: b.name || '-',
      data: periodKeys.map(k => piecesToBoxesFloat(agg.byPeriod[k]?.[id]?.qty || 0, bagPiecesPerBoxMap[id] || 0)),
      backgroundColor: colorMap[id],
      borderColor: colorMap[id],
      borderWidth: 0,
      stack: 'bagStack',
      bagId: id,
    }));
}

function updateBagChartVisibility(colorMap) {
  if (!bagChart || !lastBagAgg) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  bagChart.data.labels = periodKeys;
  bagChart.data.datasets = buildBagChartDatasets(lastBagAgg, periodKeys, colorMap);
  bagChart.update();
}

function renderEggTab(agg) {
  const summary = document.getElementById('statsSummary');
  const chartArea = document.getElementById('statsChartArea');
  const detail = document.getElementById('statsDetailArea');
  destroyAllCharts();
  if (agg.total === 0) { showEmpty(summary, detail); if (chartArea) chartArea.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`; return; }
  summary.innerHTML = `<div class="stats-summary-row"><span>총 계란 사용량: <b>${formatNumber(agg.total)} 개</b></span><span>집계 구간 수: <b>${Object.keys(agg.byPeriod).length}</b></span></div>`;
  chartArea.innerHTML = `<div class="stats-chart-canvas-wrap"><canvas id="statsEggChart"></canvas></div>`;
  drawEggChart(agg);
  const rows = Object.keys(agg.byPeriod).sort().map(k => `<tr><td>${escapeHtml(k)}</td><td style="text-align:right"><b>${formatNumber(agg.byPeriod[k])}</b> 개</td></tr>`).join('');
  detail.innerHTML = `<div class="stats-detail-title">기간별 계란 사용량</div><div class="stats-detail-note">eggLogs.type === 'out' 만 합산 (입고/수동조정 제외)</div><table class="stats-table"><thead><tr><th>기간</th><th style="text-align:right">사용량</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function drawEggChart(agg) {
  const canvas = document.getElementById('statsEggChart');
  if (!canvas) return;
  const periodKeys = buildPeriodKeys(startDate, endDate, aggregation);
  eggChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: periodKeys,
      datasets: [{
        label: '계란 사용량',
        data: periodKeys.map(k => agg.byPeriod[k] || 0),
        borderColor: EGG_COLOR,
        backgroundColor: EGG_COLOR,
        tension: 0.2,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: false,
        fill: false,
      }],
    },
    options: chartLineOptions(ctx => `계란: ${formatNumber(ctx.parsed.y)} 개`),
  });
}

function renderDailyTab(items) {
  const summary = document.getElementById('statsSummary');
  const chartArea = document.getElementById('statsChartArea');
  const detail = document.getElementById('statsDetailArea');
  destroyAllCharts();
  if (chartArea) chartArea.innerHTML = `<div class="stats-placeholder">탭5는 차트 없음 (테이블 전용)</div>`;
  if (items.length === 0) { showEmpty(summary, detail); return; }
  const rawCount = items.filter(i => i.type === '생식').length;
  const freezeCount = items.filter(i => i.type === '동결건조').length;
  summary.innerHTML = `<div class="stats-summary-row"><span>생식 행: <b>${rawCount}</b></span><span>동결건조 행: <b>${freezeCount}</b></span><span>총 <b>${items.length}</b> 행 (같은 날 같은 제품 합산됨)</span></div>`;
  const rows = items.map(i => `<tr><td>${escapeHtml(i.date)}</td><td><span class="stats-tag stats-tag-${i.type === '생식' ? 'raw' : 'freezeDry'}">${i.type}</span></td><td>${escapeHtml(i.name || '')}</td><td style="text-align:right"><b>${formatNumber(i.qty)}</b> ${escapeHtml(i.unit)}</td></tr>`).join('');
  detail.innerHTML = `<div class="stats-detail-title">일별 생산 현황 (날짜 내림차순, 같은 날+같은 제품 합산)</div><div class="stats-detail-note">생식: productions.status='active' / 동결건조: frozenLogs.status='active'</div><table class="stats-table"><thead><tr><th>날짜</th><th>구분</th><th>제품명</th><th style="text-align:right">수량</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function getVisibleSupplementRows(agg = lastSupplementAgg) {
  if (!agg) return [];
  return agg.rows.filter(row => row.active || includeInactiveSupplements);
}

function renderSupplementTab(agg) {
  const summary = document.getElementById('statsSummary');
  const chartArea = document.getElementById('statsChartArea');
  const detail = document.getElementById('statsDetailArea');
  destroyAllCharts();
  if (chartArea) {
    chartArea.innerHTML = `
      <div class="stats-recipe-toggles">
        <label class="stats-recipe-chip" style="--recipe-color:#4A7C59">
          <input type="checkbox" id="statsSupplementInactiveToggle" ${includeInactiveSupplements ? 'checked' : ''}>
          <span class="stats-recipe-chip-dot"></span>
          <span class="stats-recipe-chip-label">비활성 포함</span>
        </label>
      </div>
    `;
  }

  const rows = getVisibleSupplementRows(agg);
  const totals = rows.reduce((sum, row) => ({
    in: sum.in + row.in,
    used: sum.used + row.used,
    adjust: sum.adjust + row.adjust,
    currentQty: sum.currentQty + row.currentQty,
  }), { in: 0, used: 0, adjust: 0, currentQty: 0 });

  if (summary) {
    const inactiveCount = agg.rows.filter(row => !row.active).length;
    summary.innerHTML = `<div class="stats-summary-row"><span>표시 SKU: <b>${formatNumber(rows.length)}</b></span><span>입고 <b>${formatNumber(totals.in)}봉</b></span><span>사용 <b>${formatNumber(totals.used)}봉</b></span><span>수동조정 <b>${formatNumber(totals.adjust)}봉</b></span><span>현재재고 <b>${formatNumber(totals.currentQty)}봉</b></span>${inactiveCount ? `<span>비활성 ${formatNumber(inactiveCount)}개</span>` : ''}</div>`;
  }

  if (rows.length === 0) {
    if (detail) detail.innerHTML = `<div class="stats-placeholder">데이터 없음</div>`;
  } else if (detail) {
    const bodyRows = rows.map(row => `
      <tr class="${row.active ? '' : 'stats-row-muted'}">
        <td>${escapeHtml(row.name)}${row.active ? '' : ' <span class="stats-tag">비활성</span>'}</td>
        <td style="text-align:right">${formatNumber(row.in)}</td>
        <td style="text-align:right">${formatNumber(row.used)}</td>
        <td style="text-align:right">${formatNumber(row.adjust)}</td>
        <td style="text-align:right"><b>${formatNumber(row.currentQty)}</b></td>
      </tr>
    `).join('');
    detail.innerHTML = `
      <div class="stats-detail-title">영양제 통계 (기간 합계)</div>
      <div class="stats-detail-note">사용 = supplementLogs autoDeduct qty의 net(-sum). 환불은 사용량에서 차감되어 음수도 표시될 수 있음.</div>
      <table class="stats-table">
        <thead><tr><th>SKU명</th><th style="text-align:right">입고</th><th style="text-align:right">사용</th><th style="text-align:right">수동조정</th><th style="text-align:right">현재재고</th></tr></thead>
        <tbody>${bodyRows}</tbody>
        <tfoot><tr><th>총계</th><th style="text-align:right">${formatNumber(totals.in)}</th><th style="text-align:right">${formatNumber(totals.used)}</th><th style="text-align:right">${formatNumber(totals.adjust)}</th><th style="text-align:right">${formatNumber(totals.currentQty)}</th></tr></tfoot>
      </table>
    `;
  }

  document.getElementById('statsSupplementInactiveToggle')?.addEventListener('change', e => {
    includeInactiveSupplements = e.target.checked;
    renderSupplementTab(lastSupplementAgg || agg);
  });
}

function chartLineOptions(labelCallback) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: labelCallback } } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: v => formatNumber(v) } },
      x: { ticks: { maxRotation: 45, autoSkip: true, autoSkipPadding: 8 } },
    },
  };
}

function handleExcelDownload() {
  const tab = TABS.find(t => t.id === activeTab);
  if (!tab) return;
  let rows = null;
  if (activeTab === 'production') {
    if (!lastProductionAgg || lastProductionCount === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    rows = buildSheetProductionRows(lastProductionAgg, lastProductionCount);
  } else if (activeTab === 'meat') {
    if (!lastMeatAgg || lastMeatAgg.totalG === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    rows = buildSheetMeatRows(lastMeatAgg);
  } else if (activeTab === 'bag') {
    if (!lastBagAgg || lastBagAgg.total === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    rows = buildSheetBagRows(lastBagAgg);
  } else if (activeTab === 'egg') {
    if (!lastEggAgg || lastEggAgg.total === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    rows = buildSheetEggRows(lastEggAgg);
  } else if (activeTab === 'daily') {
    if (!lastDailyItems || lastDailyItems.length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    rows = buildSheetDailyRows(lastDailyItems);
  } else if (activeTab === 'supplement') {
    if (!lastSupplementAgg || getVisibleSupplementRows().length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    rows = buildSheetSupplementRows(lastSupplementAgg);
  }
  if (!rows) return;
  const wb = XLSX.utils.book_new();
  appendStatsSheet(wb, tab.label, rows);
  XLSX.writeFile(wb, `통계_${tab.label}_${startDate}~${endDate}.xlsx`);
}

async function handleExcelDownloadAll() {
  const dlBtn = document.getElementById('statsDownloadAllBtn');
  if (!dlBtn) return;
  const originalText = dlBtn.textContent;
  dlBtn.disabled = true;
  dlBtn.textContent = '⏳ 데이터 로딩 중...';
  try {
    const [productions, bagLogs, eggLogs, frozenLogs, showInStatsMap, bagMap, supplementTypes, supplementStocks, supplementLogs] = await Promise.all([
      loadProductionsInRange(),
      loadBagLogsInRange(),
      loadEggLogsInRange(),
      loadFrozenLogsInRange(),
      loadMeatTypeShowInStatsMap(),
      loadBagPiecesPerBoxMap(),
      loadSupplementTypes(),
      loadSupplementStocks(),
      loadSupplementLogsInRange(),
    ]);
    bagPiecesPerBoxMap = bagMap;
    meatTypeShowInStatsMap = showInStatsMap;
    meatTypeAutoDeductMap = buildMeatAutoDeductMap(productions);
    const prodAgg = aggregateProductions(productions, aggregation);
    const meatAgg = filterMeatAggByShowInStats(aggregateMeatFromProductions(productions, aggregation), showInStatsMap);
    const bagAgg = aggregateBagsFromLogs(bagLogs, aggregation);
    const eggAgg = aggregateEggsFromLogs(eggLogs, aggregation);
    const dailyItems = aggregateDailyView(productions, frozenLogs);
    const supplementAgg = aggregateSupplements(supplementTypes, supplementStocks, supplementLogs);
    const wb = XLSX.utils.book_new();
    appendStatsSheet(wb, '생산량', productions.length === 0 ? [['데이터 없음']] : buildSheetProductionRows(prodAgg, productions.length));
    appendStatsSheet(wb, '원료 소모량', meatAgg.totalG === 0 ? [['데이터 없음']] : buildSheetMeatRows(meatAgg));
    appendStatsSheet(wb, '봉투 소모량', bagAgg.total === 0 ? [['데이터 없음']] : buildSheetBagRows(bagAgg));
    appendStatsSheet(wb, '계란 사용량', eggAgg.total === 0 ? [['데이터 없음']] : buildSheetEggRows(eggAgg));
    appendStatsSheet(wb, '일별 생산 현황', dailyItems.length === 0 ? [['데이터 없음']] : buildSheetDailyRows(dailyItems));
    appendStatsSheet(wb, '영양제', supplementAgg.rows.length === 0 ? [['데이터 없음']] : buildSheetSupplementRows(supplementAgg));
    XLSX.writeFile(wb, `Fantapet_통계_${startDate}~${endDate}.xlsx`);
  } catch (err) {
    console.error('[stats] 일괄 다운로드 실패:', err);
    alert('다운로드 실패: ' + (err.message || err));
  } finally {
    dlBtn.disabled = false;
    dlBtn.textContent = originalText;
  }
}

function appendStatsSheet(wb, tabLabel, dataRows) {
  const aggLabel = ({ daily: '일별', weekly: '주별', monthly: '월별', yearly: '연별' })[aggregation] || aggregation;
  const sheetData = [
    [`통계 — ${tabLabel}`],
    [`기간: ${startDate} ~ ${endDate}`],
    [`집계 단위: ${aggLabel}`],
    [`생성일시: ${new Date().toLocaleString('ko-KR')}`],
    [],
    ...dataRows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = computeColWidths(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, tabLabel.replace(/[\[\]:*?/\\]/g, '').slice(0, 30));
}

function computeColWidths(rows) {
  const widths = [];
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      const len = row[i] == null ? 0 : String(row[i]).length;
      if (!widths[i] || widths[i].wch < len) widths[i] = { wch: len };
    }
  }
  return widths.map(w => ({ wch: Math.min(40, Math.max(8, (w?.wch || 8) + 2)) }));
}

function buildSheetProductionRows(agg, count) {
  const rows = [[`생식 합계: ${agg.totalRaw}`, `동결건조 합계: ${agg.totalFreezeDry}`, `생산 건수: ${count}`], [], ['레시피', '구분', '단위', '생산량']];
  for (const r of Object.values(agg.byRecipe).sort((a, b) => b.qty - a.qty)) rows.push([r.name, r.category === 'raw' ? '생식' : '동결건조', r.unit || '', r.qty]);
  return rows;
}

function buildSheetMeatRows(agg) {
  const rows = [[`총 원료 소모량: ${(agg.totalG / 1000).toFixed(1)} kg`, `원료 종류: ${Object.keys(agg.byMeat).length}`, '통계 비표시 원료 제외됨'], [], ['원료', '소모량(kg)', '비고']];
  for (const [id, m] of Object.entries(agg.byMeat).sort((a, b) => b[1].qtyG - a[1].qtyG)) rows.push([m.name, Number((m.qtyG / 1000).toFixed(1)), meatTypeAutoDeductMap[id] === false ? '예상 사용량 (재고 차감 없음)' : '']);
  return rows;
}

function buildSheetBagRows(agg) {
  const total = calculateBagTotalDisplay(agg.byBag);
  const rows = [[`박스 환산 합계: ${total.totalBoxes}박스 / 총 ${total.totalPieces}장${total.hasUnconvertible ? ' (* 일부 봉투 박스당 장수 미설정)' : ''}`, `봉투 종류: ${Object.keys(agg.byBag).length}`], [], ['봉투', '박스', '잔여 장', '총 장', '박스당 장수']];
  for (const [id, b] of Object.entries(agg.byBag).sort((a, b) => b[1].qty - a[1].qty)) {
    const ppb = bagPiecesPerBoxMap[id] || 0;
    if (ppb > 0) {
      const boxes = Math.floor(b.qty / ppb);
      rows.push([b.name || '-', boxes, b.qty - boxes * ppb, b.qty, ppb]);
    } else {
      rows.push([(b.name || '-') + ' *', '', '', b.qty, '미설정']);
    }
  }
  return rows;
}

function buildSheetEggRows(agg) {
  const rows = [[`총 계란 사용량: ${agg.total} 개`, `집계 구간 수: ${Object.keys(agg.byPeriod).length}`], [], ['기간', '사용량(개)']];
  for (const k of Object.keys(agg.byPeriod).sort()) rows.push([k, agg.byPeriod[k]]);
  return rows;
}

function buildSheetDailyRows(items) {
  const rawCount = items.filter(i => i.type === '생식').length;
  const freezeCount = items.filter(i => i.type === '동결건조').length;
  const rows = [[`생식 ${rawCount} 행`, `동결건조 ${freezeCount} 행`, `총 ${items.length} 행 (같은 날 같은 제품 합산)`], [], ['날짜', '구분', '제품명', '수량', '단위']];
  for (const item of items) rows.push([item.date, item.type, item.name || '', item.qty, item.unit || '']);
  return rows;
}

function buildSheetSupplementRows(agg) {
  const rowsData = getVisibleSupplementRows(agg);
  const totals = rowsData.reduce((sum, row) => ({
    in: sum.in + row.in,
    used: sum.used + row.used,
    adjust: sum.adjust + row.adjust,
    currentQty: sum.currentQty + row.currentQty,
  }), { in: 0, used: 0, adjust: 0, currentQty: 0 });
  const rows = [[`표시 SKU: ${rowsData.length}`, `입고 ${totals.in}봉`, `사용 ${totals.used}봉`, `수동조정 ${totals.adjust}봉`, `현재재고 ${totals.currentQty}봉`], [], ['SKU명', '입고', '사용', '수동조정', '현재재고']];
  for (const row of rowsData) rows.push([`${row.name}${row.active ? '' : ' (비활성)'}`, row.in, row.used, row.adjust, row.currentQty]);
  rows.push(['총계', totals.in, totals.used, totals.adjust, totals.currentQty]);
  return rows;
}

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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
