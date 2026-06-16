import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc, where, writeBatch
} from 'firebase/firestore';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { recordActivity } from '../services/activityLogs.js';
import { recordMeatLog } from '../services/meatLogs.js';
import { getTodayKST as getToday } from '../utils/date.js';
import Sortable from 'sortablejs';

let meatTypes = [];
let currentTab = 'frozen';
let meatTypesSortable = null;
let stockSummarySortable = null;

const STOCK_SUMMARY_ORDER_KEY = 'meatStockSummaryOrder';

export async function renderMeat() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>원료 재고 로딩 중...</p></div>`;
  await loadStaffCache();
  meatTypes = await loadMeatTypes();
  renderMeatLayout();
}

async function loadMeatTypes() {
  const q = query(collection(db, 'meatTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function getActiveMeatTypes() {
  return meatTypes.filter(m => m.active !== false);
}

function getMeatTypeCategory(meatTypeId) {
  return meatTypes.find(m => m.id === meatTypeId)?.category || 'meat';
}

function isProduceMeatType(meatTypeId) {
  return getMeatTypeCategory(meatTypeId) === 'produce';
}

function isMeatCategoryStock(stock) {
  return !isProduceMeatType(stock.meatTypeId);
}

function isProduceCategoryStock(stock) {
  return isProduceMeatType(stock.meatTypeId);
}

function isMeatCategoryLog(log) {
  return !isProduceMeatType(log.meatTypeId);
}

function isProduceCategoryLog(log) {
  return isProduceMeatType(log.meatTypeId);
}

async function loadMeatLogs(stage) {
  const q = query(
    collection(db, 'meatLogs'),
    where('stage', '==', stage),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function getMeatLogTypeLabel(type) {
  const map = {
    frozenIncoming: '입고',
    frozenOut: '전처리로 출고',
    processedIn: '전처리',
    processedOut: '재포장으로 출고',
    repackedIn: '재포장',
    repackedOut: '출고',
    productionDeduct: '생산차감',
    productionRollback: '생산복원',
    adjust: '수동조정',
  };
  return map[type] || type;
}

function formatMeatLogTimestamp(ts) {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatMeatLogQty(grams) {
  if (typeof grams !== 'number') return '-';
  const sign = grams > 0 ? '+' : '';
  const kg = grams / 1000;
  return `${sign}${kg.toFixed(2)}kg`;
}

async function loadMeatStocks(stage) {
  const q = query(collection(db, 'meatStocks'), orderBy('incomingDate'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.stage === stage && !s.closed);
}

function getStockColor(totalG, meatTypeId) {
  const mt = meatTypes.find(m => m.id === meatTypeId);
  const minG = mt?.minimumQtyG || 0;
  if (minG <= 0) return '#1a1a1a';
  if (totalG < minG) return '#e53e3e';
  if (totalG < minG * 1.5) return '#dd6b20';
  return '#1a1a1a';
}

function buildTotalByType(stocks) {
  const map = new Map();
  (stocks || []).forEach(s => {
    const key = s.meatTypeId || s.meatNameSnapshot || s.id;
    const cur = map.get(key);
    if (cur) cur.totalG += Number(s.remaining || 0);
    else map.set(key, { name: s.meatNameSnapshot || '원료', totalG: Number(s.remaining || 0), meatTypeId: s.meatTypeId });
  });
  return map;
}

function getStockSummaryOrder() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STOCK_SUMMARY_ORDER_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function renderStockSummary(stocks) {
  const byType = buildTotalByType(stocks);
  if (byType.size === 0) return '';

  const savedOrder = getStockSummaryOrder();
  const orderIndex = new Map(savedOrder.map((id, idx) => [id, idx]));
  const cells = [...byType.values()]
    .sort((a, b) => {
      const aRank = orderIndex.has(a.meatTypeId) ? orderIndex.get(a.meatTypeId) : Number.MAX_SAFE_INTEGER;
      const bRank = orderIndex.has(b.meatTypeId) ? orderIndex.get(b.meatTypeId) : Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return b.totalG - a.totalG;
    })
    .map(g => {
      const color = getStockColor(g.totalG, g.meatTypeId);
      return `
        <div class="stock-summary-cell" data-meat-type-id="${g.meatTypeId || ''}" style="display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;border:1px solid #e8e8e8;border-radius:5px;padding:4px 6px;background:#fff;cursor:grab;">
          <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;">${g.name}</span>
          <b style="color:${color};font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${(g.totalG / 1000).toFixed(2)}kg</b>
        </div>
      `;
    })
    .join('');

  return `
    <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:13px;">
      <div style="color:#666;font-weight:600;margin-bottom:6px;">원료별 합계</div>
      <div class="stock-summary-grid" style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;">
        ${cells}
      </div>
    </div>
  `;
}

function saveStockSummaryOrderFromGrid(gridEl) {
  const visibleIds = Array.from(gridEl.querySelectorAll('.stock-summary-cell'))
    .map(cell => cell.dataset.meatTypeId)
    .filter(Boolean);
  const visibleSet = new Set(visibleIds);
  const preservedIds = getStockSummaryOrder().filter(id => !visibleSet.has(id));
  try {
    localStorage.setItem(STOCK_SUMMARY_ORDER_KEY, JSON.stringify([...visibleIds, ...preservedIds]));
  } catch (err) {
    console.warn('[meat] stock summary order save skipped:', err);
  }
}

function initStockSummarySortable() {
  if (stockSummarySortable) {
    try {
      stockSummarySortable.destroy();
    } catch (err) {
      console.warn('[meat] stock summary sortable destroy skipped:', err);
    }
    stockSummarySortable = null;
  }

  const gridEl = document.querySelector('.stock-summary-grid');
  if (!gridEl) return;

  stockSummarySortable = Sortable.create(gridEl, {
    animation: 150,
    draggable: '.stock-summary-cell',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: () => saveStockSummaryOrderFromGrid(gridEl),
  });
}

function renderMeatLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원료 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${currentTab === 'frozen' ? 'active' : ''}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${currentTab === 'processed' ? 'active' : ''}" data-tab="processed">전처리</button>
          <button class="tab-btn ${currentTab === 'repacked' ? 'active' : ''}" data-tab="repacked">재포장</button>
          <button class="tab-btn ${currentTab === 'produce' ? 'active' : ''}" data-tab="produce">채소/과일</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(currentTab);
    });
  });

  renderTab(currentTab);
}

async function renderTab(tab) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `<div style="padding:24px;"><p>로딩 중...</p></div>`;

  const dataStage = tab === 'produce' ? 'frozen' : tab;
  const [stocks, logs] = await Promise.all([
    loadMeatStocks(dataStage),
    loadMeatLogs(dataStage),
  ]);

  if (tab === 'frozen') {
    renderFrozenTab(stocks, logs);
  } else if (tab === 'processed') {
    renderProcessedTab(stocks, logs);
  } else if (tab === 'produce') {
    renderProduceTab(stocks, logs);
  } else {
    renderRepackedTab(stocks, logs);
  }

  initStockSummarySortable();
}

// 냉동창고 탭
function renderFrozenTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  const canManageMeatTypes = currentUserRole === 'admin' || currentUserRole === 'office';
  const meatStocks = stocks.filter(isMeatCategoryStock);
  const meatLogs = logs.filter(isMeatCategoryLog);
  const meatTotals = buildTotalByType(meatStocks);
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      ${canManageMeatTypes ? '<button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>' : ''}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${renderStockSummary(meatStocks)}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${meatStocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>` :
              meatStocks.map(s => {
                const typeTotal = meatTotals.get(s.meatTypeId || s.meatNameSnapshot || s.id)?.totalG ?? s.remaining;
                const color = getStockColor(typeTotal, s.meatTypeId);
                return `
                <tr>
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.incomingDate || '-'}</td>
                  <td style="font-weight:600;color:${color}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${meatLogs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              meatLogs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddFrozen').addEventListener('click', () => showAddFrozenModal());
  document.getElementById('btnMeatTypes')?.addEventListener('click', () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('원육 종류 관리는 대표/사무실 계정만 가능합니다.');
      return;
    }
    showMeatTypesModal();
  });
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 채소/과일 탭
function renderProduceTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  const canManageMeatTypes = currentUserRole === 'admin' || currentUserRole === 'office';
  const produceStocks = stocks.filter(isProduceCategoryStock);
  const produceLogs = logs.filter(isProduceCategoryLog);
  const produceTotals = buildTotalByType(produceStocks);

  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProduce">+ 채소/과일 입고 등록</button>
      ${canManageMeatTypes ? '<button class="btn-secondary" id="btnProduceTypes">채소/과일 종류 관리</button>' : ''}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${renderStockSummary(produceStocks)}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>입고일</th>
              <th>초기량</th>
              <th>잔량</th>
              <th>담당</th>
              <th>비고</th>
              <th>조정</th>
            </tr>
          </thead>
          <tbody>
            ${produceStocks.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">등록된 채소/과일 재고 없음</td></tr>` :
              produceStocks.map(s => {
                const typeTotal = produceTotals.get(s.meatTypeId || s.meatNameSnapshot || s.id)?.totalG ?? s.remaining;
                const color = getStockColor(typeTotal, s.meatTypeId);
                return `
                <tr>
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.incomingDate || '-'}</td>
                  <td>${((s.initialQtyG || 0) / 1000).toFixed(2)}kg</td>
                  <td style="font-weight:600;color:${color}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td>${s.staffName || '-'}</td>
                  <td>${s.note || '-'}</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${produceLogs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              produceLogs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddProduce').addEventListener('click', () => {
    showAddFrozenModal({
      categoryFilter: 'produce',
      title: '채소/과일 입고 등록',
      returnTab: 'produce',
    });
  });
  document.getElementById('btnProduceTypes')?.addEventListener('click', () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('채소/과일 종류 관리는 대표/사무실 계정만 가능합니다.');
      return;
    }
    showMeatTypesModal({ categoryFilter: 'produce' });
  });
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 전처리 탭
function renderProcessedTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${renderStockSummary(stocks)}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 전처리 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.processedDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              logs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddProcessed').addEventListener('click', showAddProcessedModal);
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 재포장 탭
function renderRepackedTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${renderStockSummary(stocks)}
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재포장 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.repackedDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              logs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddRepacked').addEventListener('click', showAddRepackedModal);
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 원육 입고 등록 모달
function showAddFrozenModal(options = {}) {
  const {
    categoryFilter = 'meat',
    title = categoryFilter === 'produce' ? '채소/과일 입고 등록' : '원육 입고 등록',
    returnTab = 'frozen',
  } = options;
  const itemLabel = categoryFilter === 'produce' ? '채소/과일' : '원육';
  const activeMeatTypes = getActiveMeatTypes().filter(m => (
    categoryFilter === 'produce'
      ? m.category === 'produce'
      : (m.category || 'meat') === 'meat'
  ));

  showModal(`
    <h3 class="modal-title">${title}</h3>
    <div class="form-group">
      <label>${itemLabel} 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${activeMeatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>중량 *</label>
        <input type="number" id="m_weight" placeholder="중량" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>입고일</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozen">추가</button>
    </div>
  `);

  document.getElementById('btnSaveFrozen').addEventListener('click', async () => {
    const meatTypeId = document.getElementById('m_meatType').value;
    const meatTypeEl = document.getElementById('m_meatType');
    const meatName = meatTypeEl.options[meatTypeEl.selectedIndex]?.text;
    const weight = parseFloat(document.getElementById('m_weight').value);
    const unit = document.getElementById('m_unit').value;
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!meatTypeId || !weight || !date) {
      alert(`${itemLabel} 종류, 중량, 날짜는 필수입니다.`);
      return;
    }
    if (!staff) {
      alert('담당자를 선택해주세요.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const qtyG = unit === 'kg' ? weight * 1000 : weight;

    const stockRef = await addDoc(collection(db, 'meatStocks'), {
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'frozen',
      incomingDate: date,
      initialQtyG: qtyG,
      remaining: qtyG,
      staffName: staff,
      note,
      closed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await recordMeatLog({
      type: 'frozenIncoming',
      date,
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'frozen',
      meatStockId: stockRef.id,
      delta: qtyG,
      before: 0,
      after: qtyG,
      staff,
      reason: note || null,
    });

    // [묶음 5A] 사무 로그 발행 — 원육 입고 (운영자가 메인 화면에서 변동 추적 가능하게)
    await recordActivity({
      action: 'meat',
      subAction: 'incoming',
      date,
      staff,
      message: `${itemLabel} 입고 (냉동창고) - ${meatName} +${(qtyG/1000).toFixed(1)}kg / 담당: ${staff}`,
      details: {
        meatStockId: stockRef.id,
        meatTypeId,
        meatName,
        stage: 'frozen',
        qtyG,
        note: note || null,
      },
    });

    closeModal();
    renderTab(returnTab);
    alert('입고 등록 완료!');
  });
}

// 전처리 등록 모달
function showAddProcessedModal() {
  showModal(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${getActiveMeatTypes().map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>전처리일</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProcessed">추가</button>
    </div>
  `);

  // 원육 선택 시 기본 개당중량 자동 세팅
  document.getElementById('m_meatType').addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    const defaultWeight = opt.dataset.weight;
    if (defaultWeight) document.getElementById('m_unitWeight').value = defaultWeight;
  });

  document.getElementById('btnSaveProcessed').addEventListener('click', async () => {
    const meatTypeId = document.getElementById('m_meatType').value;
    const meatTypeEl = document.getElementById('m_meatType');
    const meatName = meatTypeEl.options[meatTypeEl.selectedIndex]?.text;
    const unitWeight = parseFloat(document.getElementById('m_unitWeight').value);
    const count = parseInt(document.getElementById('m_count').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!meatTypeId || !unitWeight || !count || !date) {
      alert('원육 종류, 개당 중량, 개수, 날짜는 필수입니다.');
      return;
    }
    if (!staff) {
      alert('담당자를 선택해주세요.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const totalG = unitWeight * count;

    // 냉동창고 잔량 확인 (FIFO 순서: incomingDate 오름차순)
    const allFrozen = await loadMeatStocks('frozen');
    const candidates = allFrozen
      .filter(s => s.meatTypeId === meatTypeId && s.remaining > 0)
      .sort((a, b) => (a.incomingDate || '').localeCompare(b.incomingDate || ''));

    const totalAvailable = candidates.reduce((sum, s) => sum + s.remaining, 0);
    if (totalAvailable < totalG) {
      alert(`냉동창고 잔량이 부족합니다.\n${meatName}: 필요 ${(totalG/1000).toFixed(1)}kg / 현재 ${(totalAvailable/1000).toFixed(1)}kg`);
      return;
    }

    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    // 냉동창고 FIFO 차감 + frozenOut 로그
    let remainingToDeduct = totalG;
    for (const lot of candidates) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(lot.remaining, remainingToDeduct);
      const newRemaining = lot.remaining - deduct;

      await updateDoc(doc(db, 'meatStocks', lot.id), {
        remaining: newRemaining,
        closed: newRemaining === 0,
        updatedAt: new Date(),
      });

      await recordMeatLog({
        type: 'frozenOut',
        date,
        meatTypeId,
        meatNameSnapshot: meatName,
        stage: 'frozen',
        meatStockId: lot.id,
        delta: -deduct,
        before: lot.remaining,
        after: newRemaining,
        staff,
        reason: '전처리 등록 자동차감',
        batchId,
      });

      remainingToDeduct -= deduct;
    }

    // 전처리 신규 행 추가
    const newStockRef = await addDoc(collection(db, 'meatStocks'), {
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'processed',
      incomingDate: date,
      processedDate: date,
      unitWeightG: unitWeight,
      unitCount: count,
      initialQtyG: totalG,
      remaining: totalG,
      batchId,
      batchColor,
      staffName: staff,
      note,
      closed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await recordMeatLog({
      type: 'processedIn',
      date,
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'processed',
      meatStockId: newStockRef.id,
      delta: totalG,
      before: 0,
      after: totalG,
      staff,
      reason: note || null,
      batchId,
    });

    closeModal();
    renderTab('processed');
    alert('전처리 등록 완료!');
  });
}

// 재포장 등록 모달
function showAddRepackedModal() {
  showModal(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${getActiveMeatTypes().map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>재포장일</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveRepacked">추가</button>
    </div>
  `);

  document.getElementById('m_meatType').addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    const defaultWeight = opt.dataset.weight;
    if (defaultWeight) document.getElementById('m_unitWeight').value = defaultWeight;
  });

  document.getElementById('btnSaveRepacked').addEventListener('click', async () => {
    const meatTypeId = document.getElementById('m_meatType').value;
    const meatTypeEl = document.getElementById('m_meatType');
    const meatName = meatTypeEl.options[meatTypeEl.selectedIndex]?.text;
    const unitWeight = parseFloat(document.getElementById('m_unitWeight').value);
    const count = parseInt(document.getElementById('m_count').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!meatTypeId || !unitWeight || !count || !date) {
      alert('원육 종류, 개당 중량, 개수, 날짜는 필수입니다.');
      return;
    }
    if (!staff) {
      alert('담당자를 선택해주세요.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const totalG = unitWeight * count;

    // 같은 원육 활성 재포장 행 중복 차단 (spec 9절 탭3)
    const allRepacked = await loadMeatStocks('repacked');
    const existingActive = allRepacked.find(s => s.meatTypeId === meatTypeId && s.remaining > 0);
    if (existingActive) {
      alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${meatName}: 기존 잔량 ${(existingActive.remaining/1000).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);
      return;
    }

    // 전처리 잔량 확인 (FIFO 순서: processedDate 오름차순)
    const allProcessed = await loadMeatStocks('processed');
    const candidates = allProcessed
      .filter(s => s.meatTypeId === meatTypeId && s.remaining > 0)
      .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));

    const totalAvailable = candidates.reduce((sum, s) => sum + s.remaining, 0);
    if (totalAvailable < totalG) {
      alert(`전처리 잔량이 부족합니다.\n${meatName}: 필요 ${(totalG/1000).toFixed(1)}kg / 현재 ${(totalAvailable/1000).toFixed(1)}kg`);
      return;
    }

    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    // 전처리 FIFO 차감 + processedOut 로그
    let remainingToDeduct = totalG;
    for (const lot of candidates) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(lot.remaining, remainingToDeduct);
      const newRemaining = lot.remaining - deduct;

      await updateDoc(doc(db, 'meatStocks', lot.id), {
        remaining: newRemaining,
        closed: newRemaining === 0,
        updatedAt: new Date(),
      });

      await recordMeatLog({
        type: 'processedOut',
        date,
        meatTypeId,
        meatNameSnapshot: meatName,
        stage: 'processed',
        meatStockId: lot.id,
        delta: -deduct,
        before: lot.remaining,
        after: newRemaining,
        staff,
        reason: '재포장 등록 자동차감',
        batchId,
      });

      remainingToDeduct -= deduct;
    }

    // 재포장 신규 행 추가
    const newStockRef = await addDoc(collection(db, 'meatStocks'), {
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'repacked',
      incomingDate: date,
      repackedDate: date,
      unitWeightG: unitWeight,
      unitCount: count,
      initialQtyG: totalG,
      remaining: totalG,
      batchId,
      batchColor,
      staffName: staff,
      note,
      closed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await recordMeatLog({
      type: 'repackedIn',
      date,
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'repacked',
      meatStockId: newStockRef.id,
      delta: totalG,
      before: 0,
      after: totalG,
      staff,
      reason: note || null,
      batchId,
    });

    closeModal();
    renderTab('repacked');
    alert('재포장 등록 완료!');
  });
}

// 수동 조정 모달
function showAdjustModal(id, name, remaining) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정 — ${name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">기존 잔량: <strong>${(remaining/1000).toFixed(1)}kg</strong> (${remaining}g)</p>
    <div class="form-group">
      <label>실제 잔량 (g) *</label>
      <input type="number" id="m_actualRemaining" placeholder="실제 잔량(g) 입력" min="0" step="1" />
      <p style="font-size:11px;color:#aaa;margin-top:4px;">실제로 남아있는 양을 g 단위로 입력하세요. 0 이상만 가능.</p>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_adjustReason" placeholder="조정 사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);

  document.getElementById('btnSaveAdjust').addEventListener('click', async () => {
    const inputVal = document.getElementById('m_actualRemaining').value;
    const reason = document.getElementById('m_adjustReason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (inputVal === '' || isNaN(parseFloat(inputVal))) {
      alert('실제 잔량을 입력해주세요.');
      return;
    }
    const newRemaining = parseFloat(inputVal);
    if (newRemaining < 0) {
      alert('실제 잔량은 0 이상이어야 합니다.\n잔량이 음수가 될 수 없습니다.');
      return;
    }
    if (!reason || !staff) {
      alert('사유와 담당자는 필수입니다.');
      return;
    }
    const delta = newRemaining - remaining;
    if (delta === 0) {
      alert('기존 잔량과 동일합니다. 변경할 값을 입력해주세요.');
      return;
    }

    const adjustDate = getToday();
    if (await blockIfClosed(adjustDate)) return;

    // meatStocks 문서에서 meatTypeId 가져오기 (meatLogs 기록용)
    const stockSnap = await getDoc(doc(db, 'meatStocks', id));
    const stockData = stockSnap.exists() ? stockSnap.data() : {};
    const meatTypeId = stockData.meatTypeId || null;

    await updateDoc(doc(db, 'meatStocks', id), {
      remaining: newRemaining,
      closed: newRemaining === 0,
      updatedAt: new Date(),
    });

    const logStage = currentTab === 'produce' ? 'frozen' : currentTab;
    const stageKor = currentTab === 'frozen' ? '냉동창고' : currentTab === 'processed' ? '전처리' : currentTab === 'produce' ? '채소/과일' : '재포장';
    await recordActivity({
      action: 'meat',
      subAction: 'adjust',
      date: adjustDate,
      staff,
      message: `원육 수동조정 (${stageKor}) — ${name} ${(remaining/1000).toFixed(1)}kg → ${(newRemaining/1000).toFixed(1)}kg / 사유: ${reason} / 담당: ${staff}`,
      details: {
        meatStockId: id,
        meatName: name,
        stage: stageKor,
        delta,
        before: remaining,
        after: newRemaining,
        reason,
      },
    });

    await recordMeatLog({
      type: 'adjust',
      date: adjustDate,
      meatTypeId,
      meatNameSnapshot: name,
      stage: logStage,
      meatStockId: id,
      delta,
      before: remaining,
      after: newRemaining,
      staff,
      reason,
    });

    closeModal();
    renderTab(currentTab);
    alert('조정 완료!');
  });
}

// 원육 종류 관리 모달
function showMeatTypesModal(options = {}) {
  const { categoryFilter = null } = options;
  const canReorderMeatTypes = !categoryFilter && (currentUserRole === 'admin' || currentUserRole === 'office');
  const filteredMeatTypes = categoryFilter
    ? meatTypes.filter(m => getMeatTypeCategory(m.id) === categoryFilter)
    : meatTypes;
  const itemLabel = categoryFilter === 'produce' ? '채소/과일' : '원육';
  const modalTitle = categoryFilter === 'produce' ? '채소/과일 종류 관리' : '원육 종류 관리';
  showModal(`
    <h3 class="modal-title">${modalTitle}</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>${itemLabel}명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(kg)</th>
            <th>구분</th>
            <th>통계 표시</th>
            <th>\uD65C\uC131</th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${filteredMeatTypes.map(m => {
            const showInStats = m.showInStats !== false;
            const active = m.active !== false;
            return `
              <tr class="${active ? '' : 'inactive-master'}" data-id="${m.id}">
                <td class="master-table-drag-cell">
                  ${canReorderMeatTypes ? '<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>' : ''}
                </td>
                <td>
                  ${m.name}
                  ${active ? '' : '<span class="tag tag-inactive" style="margin-left:6px;">\uBE44\uD65C\uC131</span>'}
                </td>
                <td>
                  <input type="number" class="m-unit-weight" data-id="${m.id}"
                         value="${m.defaultUnitWeightG}" min="1" step="any"
                         style="width:80px;padding:4px;text-align:right;" />
                  <span style="margin-left:4px;color:#666;font-size:12px;">g</span>
                </td>
                <td>
                  <input type="number" class="m-min-qty" data-id="${m.id}"
                         value="${((m.minimumQtyG || 0) / 1000).toFixed(1)}" min="0" step="any"
                         style="width:80px;padding:4px;text-align:right;" />
                  <span style="margin-left:4px;color:#666;font-size:12px;">kg</span>
                </td>
                <td>
                  <select class="m-category meat-category" data-id="${m.id}" style="padding:4px;font-size:12px;" ${categoryFilter ? 'disabled' : ''}>
                    <option value="meat" ${(m.category || 'meat') === 'meat' ? 'selected' : ''}>원육</option>
                    <option value="produce" ${m.category === 'produce' ? 'selected' : ''}>채소/과일</option>
                  </select>
                </td>
                <td>
                  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
                    <input type="checkbox" class="m-show-in-stats" data-id="${m.id}" ${showInStats ? 'checked' : ''}>
                    <span>통계에 표시</span>
                  </label>
                </td>
                <td>
                  <label class="toggle-switch" title="${active ? '\uD65C\uC131' : '\uBE44\uD65C\uC131'}">
                    <input type="checkbox" class="m-active-toggle" data-id="${m.id}" ${active ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                  </label>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="background:#f9f9f9;border-radius:6px;padding:14px;border:1px solid #eee;">
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 ${itemLabel} 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>${itemLabel}명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(kg)</label>
          <input type="number" id="m_newMinQty" placeholder="예: 5" />
        </div>
        <div class="form-group">
          <label>구분</label>
          <select id="m_newCategory" class="meat-category" ${categoryFilter ? 'disabled' : ''}>
            <option value="meat" ${categoryFilter === 'meat' ? 'selected' : ''}>원육</option>
            <option value="produce" ${categoryFilter === 'produce' ? 'selected' : ''}>채소/과일</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);

  initMeatTypeSortable();
  const baseCloseModal = window.closeModal;
  window.closeModal = function() {
    destroyMeatTypeSortable();
    baseCloseModal?.();
    window.closeModal = baseCloseModal;
  };

  document.querySelectorAll('.m-show-in-stats').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const showInStats = e.target.checked;
      try {
        await updateDoc(doc(db, 'meatTypes', id), {
          showInStats,
          updatedAt: new Date(),
        });
        const target = meatTypes.find(m => m.id === id);
        if (target) target.showInStats = showInStats;
      } catch (err) {
        console.error('[meat] showInStats 저장 실패:', err);
        alert('저장 실패: ' + (err.message || err));
        e.target.checked = !showInStats;
      }
    });
  });

  document.querySelectorAll('.m-category').forEach(select => {
    select.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const category = e.target.value === 'produce' ? 'produce' : 'meat';
      const target = meatTypes.find(m => m.id === id);
      const previous = target?.category || 'meat';
      try {
        await updateDoc(doc(db, 'meatTypes', id), {
          category,
          updatedAt: new Date(),
        });
        if (target) target.category = category;
      } catch (err) {
        console.error('[meat] category save failed:', err);
        alert('저장 실패: ' + (err.message || err));
        e.target.value = previous;
      }
    });
  });

  document.querySelectorAll('.m-unit-weight').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const target = meatTypes.find(m => m.id === id);
      const prev = target?.defaultUnitWeightG;
      const value = parseFloat(e.target.value);
      if (!isFinite(value) || value <= 0) {
        alert('기본 단위중량은 양수(g)여야 합니다.');
        e.target.value = prev ?? '';
        return;
      }
      try {
        await updateDoc(doc(db, 'meatTypes', id), {
          defaultUnitWeightG: value,
          updatedAt: new Date(),
        });
        if (target) target.defaultUnitWeightG = value;
      } catch (err) {
        console.error('[meat] defaultUnitWeightG 저장 실패:', err);
        alert('저장 실패: ' + (err.message || err));
        e.target.value = prev ?? '';
      }
    });
  });

  document.querySelectorAll('.m-min-qty').forEach(input => {
    input.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const target = meatTypes.find(m => m.id === id);
      const prevG = target?.minimumQtyG ?? 0;
      const kg = parseFloat(e.target.value);
      if (!isFinite(kg) || kg < 0) {
        alert('최소재고는 0 이상(kg)이어야 합니다.');
        e.target.value = (prevG / 1000).toFixed(1);
        return;
      }
      const grams = Math.round(kg * 1000);
      try {
        await updateDoc(doc(db, 'meatTypes', id), {
          minimumQtyG: grams,
          updatedAt: new Date(),
        });
        if (target) target.minimumQtyG = grams;
      } catch (err) {
        console.error('[meat] minimumQtyG 저장 실패:', err);
        alert('저장 실패: ' + (err.message || err));
        e.target.value = (prevG / 1000).toFixed(1);
      }
    });
  });

  document.querySelectorAll('.m-active-toggle').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const active = e.target.checked;
      const target = meatTypes.find(m => m.id === id);
      const previousActive = target?.active !== false;
      try {
        await updateDoc(doc(db, 'meatTypes', id), {
          active,
          updatedAt: new Date(),
        });
        if (target) target.active = active;
        if (previousActive !== active) {
          await recordActivity({
            action: 'meat',
            subAction: 'activeToggle',
            date: getToday(),
            staff: getRoleStaffLabel(),
            message: `Meat type ${active ? 'active' : 'inactive'} — ${target?.name || id}`,
            details: {
              meatTypeId: id,
              meatName: target?.name || '',
              active,
            },
          });
        }
        closeModal();
        showMeatTypesModal(options);
      } catch (err) {
        console.error('[meat] active save failed:', err);
        alert('Save failed: ' + (err.message || err));
        e.target.checked = !active;
      }
    });
  });

  document.getElementById('btnAddMeatType').addEventListener('click', async () => {
    const name = document.getElementById('m_newMeatName').value.trim();
    const unitWeight = parseFloat(document.getElementById('m_newUnitWeight').value) || 0;
    const minQty = parseFloat(document.getElementById('m_newMinQty').value) || 0;
    const category = categoryFilter || (document.getElementById('m_newCategory').value === 'produce' ? 'produce' : 'meat');

    if (!name) { alert(`${itemLabel}명은 필수입니다.`); return; }

    await addDoc(collection(db, 'meatTypes'), {
      name,
      defaultUnitWeightG: unitWeight,
      minimumQtyG: minQty * 1000,
      category,
      sortOrder: meatTypes.length,
      active: true,
      showInStats: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    meatTypes = await loadMeatTypes();
    closeModal();
    showMeatTypesModal(options);
  });
}

// 유틸

function initMeatTypeSortable() {
  destroyMeatTypeSortable();
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;
  const el = document.getElementById('meatTypesList');
  if (!el) return;
  meatTypesSortable = Sortable.create(el, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      await persistMeatTypeOrder();
    },
  });
}

function destroyMeatTypeSortable() {
  if (!meatTypesSortable) return;
  try {
    meatTypesSortable.destroy();
  } catch (err) {
    console.warn('[meat] sortable destroy skipped:', err);
  }
  meatTypesSortable = null;
}

async function persistMeatTypeOrder() {
  const listEl = document.getElementById('meatTypesList');
  if (!listEl) return;
  const orderedIds = Array.from(listEl.querySelectorAll('tr[data-id]'))
    .map(row => row.dataset.id)
    .filter(Boolean);
  const now = new Date();
  const batch = writeBatch(db);

  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'meatTypes', id), {
      sortOrder: idx,
      updatedAt: now,
    });
  });

  try {
    await batch.commit();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    meatTypes = meatTypes
      .map(m => orderMap.has(m.id) ? { ...m, sortOrder: orderMap.get(m.id), updatedAt: now } : m)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (err) {
    console.error('[meat] reorder save failed:', err);
    alert('순번 저장 실패: ' + (err.message || err));
    meatTypes = await loadMeatTypes();
    closeModal();
    showMeatTypesModal();
  }
}

function getRandomColor() {
  const colors = ['#e8f4ea', '#e8eef8', '#fef0e8', '#f0e8fe', '#fff0e8', '#e8f8f4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

let staffCache = {};
async function loadStaffCache() {
  if (Object.keys(staffCache).length > 0) return;
  for (const key of ['senior', 'lead', 'office']) {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) staffCache[key] = snap.data().members || [];
  }
}

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '\uB300\uD45C';
  if (currentUserRole === 'office') return '\uC0AC\uBB34\uC2E4';
  if (currentUserRole === 'production') return '\uC0DD\uC0B0\uC2E4';
  return '\uC2DC\uC2A4\uD15C';
}

function getStaffOptions(groups) {
  let options = '';
  for (const g of groups) {
    const members = staffCache[g] || [];
    members.forEach(m => {
      options += `<option value="${m.name}">${m.name}</option>`;
    });
  }
  return options;
}

// 모달
function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
