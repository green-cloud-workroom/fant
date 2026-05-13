import { db } from '../firebase.js';
import {
  collection, getDocs, query, orderBy, limit,
} from 'firebase/firestore';

const SUPPLEMENT_THRESHOLD_WARNING = 10;
const SUPPLEMENT_THRESHOLD_DANGER = 5;

let supplementTypes = [];
let supplementStocks = [];
let supplementLogs = [];
let supplementFilter = 'all';

export async function renderSupplement() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;

  await loadSupplementData();
  renderSupplementLayout();
}

async function loadSupplementData() {
  const [typeSnap, stockSnap, logSnap] = await Promise.all([
    getDocs(query(collection(db, 'supplementTypes'), orderBy('sortOrder'))),
    getDocs(collection(db, 'supplementStock')),
    getDocs(query(collection(db, 'supplementLogs'), orderBy('timestamp', 'desc'), limit(50))),
  ]);

  supplementTypes = typeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  supplementStocks = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  supplementLogs = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderSupplementLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <button class="btn-primary" id="btnSupplementIncoming">영양제 입고 등록</button>
          <button class="btn-secondary" id="btnSupplementAdjust">수동 조정</button>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${supplementFilter === 'all' ? 'selected' : ''}>전체</option>
            <option value="warning" ${supplementFilter === 'warning' ? 'selected' : ''}>10봉 미만만</option>
            <option value="danger" ${supplementFilter === 'danger' ? 'selected' : ''}>5봉 미만만</option>
          </select>
          <button class="btn-secondary" id="btnSupplementRefresh">새로고침</button>
        </div>
      </div>

      <div class="recipe-wrap supplement-wrap">
        <div class="recipe-list-panel supplement-list-panel">
          <div class="panel-header">
            <span class="panel-title">영양제 SKU</span>
          </div>
          <div class="recipe-list" id="supplementList">
            ${renderSupplementList()}
          </div>
        </div>

        <div class="recipe-detail-panel supplement-history-panel">
          <div class="detail-header">
            <span class="detail-title">영양제 이력</span>
            <div class="detail-actions">
              <button class="btn-secondary" id="btnSupplementAllLogs">전체보기</button>
            </div>
          </div>
          <div class="detail-body">
            <div class="form-section">
              <div class="table-wrap">
                ${renderSupplementLogTable(supplementLogs)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindSupplementEvents();
}

function getStockQty(typeId) {
  const stock = supplementStocks.find(s => s.id === typeId || s.supplementTypeId === typeId);
  return Number(stock?.currentQty || 0);
}

function getSupplementName(typeId) {
  return supplementTypes.find(t => t.id === typeId)?.name || typeId || '-';
}

function getFilteredSupplementTypes() {
  return supplementTypes.filter(type => {
    if (type.active === false) return true;
    const qty = getStockQty(type.id);
    if (supplementFilter === 'warning') return qty < SUPPLEMENT_THRESHOLD_WARNING;
    if (supplementFilter === 'danger') return qty < SUPPLEMENT_THRESHOLD_DANGER;
    return true;
  });
}

function renderSupplementList() {
  const filtered = getFilteredSupplementTypes();
  if (supplementTypes.length === 0) {
    return '<div class="list-empty">등록된 영양제가 없습니다</div>';
  }
  if (filtered.length === 0) {
    return '<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>';
  }

  return filtered.map(type => {
    const qty = getStockQty(type.id);
    const inactive = type.active === false;
    const classes = [
      'recipe-list-item',
      'supplement-card',
      inactive ? 'supplement-card--inactive' : '',
      !inactive && qty < SUPPLEMENT_THRESHOLD_DANGER ? 'supplement-card--danger' : '',
      !inactive && qty >= SUPPLEMENT_THRESHOLD_DANGER && qty < SUPPLEMENT_THRESHOLD_WARNING ? 'supplement-card--warning' : '',
    ].filter(Boolean).join(' ');

    return `
      <div class="${classes}" data-id="${type.id}">
        <div class="recipe-list-info">
          <span class="recipe-name">${escapeHtml(type.name || type.id)}</span>
          <div class="recipe-tags">
            <span class="tag tag-common">현재 ${qty}봉</span>
            ${inactive ? '<span class="tag tag-inactive">비활성</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSupplementLogTable(logs) {
  if (logs.length === 0) {
    return '<div class="list-empty supplement-log-empty">이력이 없습니다</div>';
  }

  return `
    <table class="data-table supplement-log-table">
      <thead>
        <tr>
          <th>날짜</th>
          <th>시간</th>
          <th>SKU</th>
          <th>유형</th>
          <th>수량</th>
          <th>잔량</th>
          <th>담당자</th>
          <th>사유·비고</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(log => `
          <tr>
            <td>${escapeHtml(log.date || '-')}</td>
            <td>${formatLogTime(log.timestamp)}</td>
            <td>${escapeHtml(getSupplementName(log.supplementTypeId))}</td>
            <td>${renderLogTypeTag(log.type)}</td>
            <td style="color:${Number(log.qty || 0) < 0 ? '#e53e3e' : '#2d7a3a'}">${formatSignedQty(log.qty)}</td>
            <td>${Number.isFinite(Number(log.after)) ? Number(log.after) : '-'}</td>
            <td>${escapeHtml(log.staffName || '-')}</td>
            <td>${escapeHtml([log.reason, log.note].filter(Boolean).join(' / ') || '-')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderLogTypeTag(type) {
  if (type === 'in') return '<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>';
  if (type === 'autoDeduct') return '<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>';
  if (type === 'adjust') return '<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>';
  return `<span class="tag tag-common">${escapeHtml(type || '-')}</span>`;
}

function bindSupplementEvents() {
  document.getElementById('btnSupplementIncoming')?.addEventListener('click', () => {
    alert('입고 등록은 단위 6에서 구현됩니다');
  });
  document.getElementById('btnSupplementAdjust')?.addEventListener('click', () => {
    alert('수동 조정은 단위 7에서 구현됩니다');
  });
  document.getElementById('btnSupplementRefresh')?.addEventListener('click', async () => {
    await renderSupplement();
  });
  document.getElementById('supplementFilter')?.addEventListener('change', (e) => {
    supplementFilter = e.target.value;
    const list = document.getElementById('supplementList');
    if (list) list.innerHTML = renderSupplementList();
  });
  document.getElementById('btnSupplementAllLogs')?.addEventListener('click', showAllSupplementLogsModal);
}

async function showAllSupplementLogsModal() {
  const snap = await getDocs(query(collection(db, 'supplementLogs'), orderBy('timestamp', 'desc'), limit(200)));
  const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  showModal(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${renderSupplementLogTable(logs)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `, 'modal-wide');
}

function showModal(html, extraClass = '') {
  const existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box ${extraClass}">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

window.closeModal = function() {
  document.querySelector('.modal-overlay')?.remove();
};

function formatSignedQty(value) {
  const qty = Number(value || 0);
  return `${qty > 0 ? '+' : ''}${qty}`;
}

function formatLogTime(ts) {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
