import { db } from '../firebase.js';
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { currentUser } from '../app.js';
import { getTodayKST } from '../utils/date.js';

const SUPPLEMENT_THRESHOLD_WARNING = 10;
const SUPPLEMENT_THRESHOLD_DANGER = 5;
const SUPPLEMENT_IN_GROUP_KEY = 'senior';
const SUPPLEMENT_IN_GROUP_NAME = '선임';
const SUPPLEMENT_ADJUST_GROUP_KEY = 'office';
const SUPPLEMENT_ADJUST_GROUP_NAME = '사무';

let supplementTypes = [];
let supplementStocks = [];
let supplementLogs = [];
let supplementFilter = 'all';
let supplementStaffCache = {};

export async function renderSupplement() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;

  await Promise.all([
    loadSupplementData(),
    loadSupplementStaffCache(),
  ]);
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
  document.getElementById('btnSupplementIncoming')?.addEventListener('click', showSupplementIncomingModal);
  document.getElementById('btnSupplementAdjust')?.addEventListener('click', showSupplementAdjustModal);
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

function showSupplementIncomingModal() {
  const activeTypes = supplementTypes
    .filter(type => type.active !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const staffMembers = supplementStaffCache[SUPPLEMENT_IN_GROUP_KEY] || [];
  const today = getTodayKST();

  showModal(`
    <h3 class="modal-title">영양제 입고 등록</h3>
    ${activeTypes.length === 0 ? `
      <div class="list-empty supplement-log-empty">
        등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.
      </div>
    ` : `
      <div class="form-group">
        <label>영양제 SKU *</label>
        <select id="m_supplementType">
          <option value="">선택</option>
          ${activeTypes.map(type => `<option value="${escapeHtml(type.id)}">${escapeHtml(type.name || type.id)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>수량 (봉) *</label>
        <input type="number" id="m_qty" min="1" step="1" placeholder="입고 수량" />
      </div>
      <div class="form-group">
        <label>입고일 *</label>
        <input type="date" id="m_date" value="${today}" />
      </div>
      <div class="form-group">
        <label>담당자 (${SUPPLEMENT_IN_GROUP_NAME}) *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${staffMembers.map(member => `<option value="${escapeHtml(member.name)}">${escapeHtml(member.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>비고</label>
        <textarea id="m_note" maxlength="500" placeholder="비고" rows="3"></textarea>
      </div>
    `}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupplementIncoming" ${activeTypes.length === 0 ? 'disabled' : ''}>저장</button>
    </div>
  `);

  document.getElementById('btnSaveSupplementIncoming')?.addEventListener('click', saveSupplementIncoming);
}

async function saveSupplementIncoming() {
  const supplementTypeId = document.getElementById('m_supplementType')?.value || '';
  const qtyRaw = document.getElementById('m_qty')?.value || '';
  const date = document.getElementById('m_date')?.value || '';
  const staffName = document.getElementById('m_staff')?.value || '';
  const note = document.getElementById('m_note')?.value.trim() || '';
  const qty = Number(qtyRaw);

  if (!supplementTypeId) { alert('영양제 SKU를 선택해주세요.'); return; }
  if (!qtyRaw || !Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    alert('수량은 1 이상의 정수로 입력해주세요.');
    return;
  }
  if (!date) { alert('입고일을 선택해주세요.'); return; }
  if (!staffName) { alert('담당자를 선택해주세요.'); return; }

  const saveButton = document.getElementById('btnSaveSupplementIncoming');
  saveButton.disabled = true;

  try {
    const stockRef = doc(db, 'supplementStock', supplementTypeId);
    const logRef = doc(collection(db, 'supplementLogs'));

    await runTransaction(db, async (transaction) => {
      const stockSnap = await transaction.get(stockRef);
      const before = Number(stockSnap.exists() ? stockSnap.data().currentQty || 0 : 0);
      const after = before + qty;

      transaction.set(stockRef, {
        id: supplementTypeId,
        supplementTypeId,
        currentQty: after,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const logData = {
        date,
        timestamp: serverTimestamp(),
        supplementTypeId,
        type: 'in',
        qty,
        before,
        after,
        staffName,
      };
      if (note) logData.note = note;
      transaction.set(logRef, logData);
    });

    closeModal();
    await renderSupplement();
    alert('입고 등록 완료');
  } catch (err) {
    console.error('[supplement] incoming save failed:', err);
    alert(`입고 등록 중 오류가 발생했습니다: ${err.message || err}`);
    saveButton.disabled = false;
  }
}

function showSupplementAdjustModal() {
  const activeTypes = supplementTypes
    .filter(type => type.active !== false)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const staffMembers = supplementStaffCache[SUPPLEMENT_ADJUST_GROUP_KEY] || [];
  const today = getTodayKST();

  showModal(`
    <h3 class="modal-title">영양제 수동 조정</h3>
    ${activeTypes.length === 0 ? `
      <div class="list-empty supplement-log-empty">
        등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.
      </div>
    ` : `
      <div class="form-group">
        <label>영양제 SKU *</label>
        <select id="m_adjustSupplementType">
          <option value="">선택</option>
          ${activeTypes.map(type => `<option value="${escapeHtml(type.id)}">${escapeHtml(type.name || type.id)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>조정 유형 *</label>
          <select id="m_adjustType">
            <option value="">선택</option>
            <option value="plus">+ 증가</option>
            <option value="minus">- 감소</option>
          </select>
        </div>
        <div class="form-group">
          <label>수량 (봉) *</label>
          <input type="number" id="m_adjustQty" min="1" step="1" placeholder="조정 수량" />
        </div>
      </div>
      <div class="form-group">
        <label>사유 *</label>
        <input type="text" id="m_adjustReason" maxlength="200" placeholder="조정 사유" />
      </div>
      <div class="form-group">
        <label>담당자 (${SUPPLEMENT_ADJUST_GROUP_NAME}) *</label>
        <select id="m_adjustStaff">
          <option value="">선택</option>
          ${staffMembers.map(member => `<option value="${escapeHtml(member.name)}">${escapeHtml(member.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>비고</label>
        <textarea id="m_adjustNote" maxlength="500" placeholder="비고" rows="3"></textarea>
      </div>
      <input type="hidden" id="m_adjustDate" value="${today}" />
    `}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupplementAdjust" ${activeTypes.length === 0 ? 'disabled' : ''}>저장</button>
    </div>
  `);

  document.getElementById('btnSaveSupplementAdjust')?.addEventListener('click', saveSupplementAdjust);
}

async function saveSupplementAdjust() {
  const supplementTypeId = document.getElementById('m_adjustSupplementType')?.value || '';
  const adjustType = document.getElementById('m_adjustType')?.value || '';
  const qtyRaw = document.getElementById('m_adjustQty')?.value || '';
  const reason = document.getElementById('m_adjustReason')?.value.trim() || '';
  const staffName = document.getElementById('m_adjustStaff')?.value || '';
  const note = document.getElementById('m_adjustNote')?.value.trim() || '';
  const date = document.getElementById('m_adjustDate')?.value || getTodayKST();
  const qty = Number(qtyRaw);

  if (!supplementTypeId) { alert('영양제 SKU를 선택해주세요.'); return; }
  if (!adjustType) { alert('조정 유형을 선택해주세요.'); return; }
  if (!qtyRaw || !Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    alert('수량은 1 이상의 정수로 입력해주세요.');
    return;
  }
  if (!reason) { alert('사유를 입력해주세요.'); return; }
  if (!staffName) { alert('담당자를 선택해주세요.'); return; }

  const saveButton = document.getElementById('btnSaveSupplementAdjust');
  saveButton.disabled = true;

  try {
    const signedQty = adjustType === 'minus' ? -qty : qty;
    const stockRef = doc(db, 'supplementStock', supplementTypeId);
    const logRef = doc(collection(db, 'supplementLogs'));
    const activityRef = doc(collection(db, 'activityLogs'));
    const supplement = supplementTypes.find(type => type.id === supplementTypeId);
    const supplementName = supplement?.name || supplementTypeId;
    const sign = signedQty > 0 ? '+' : '';

    await runTransaction(db, async (transaction) => {
      const stockSnap = await transaction.get(stockRef);
      const before = Number(stockSnap.exists() ? stockSnap.data().currentQty || 0 : 0);
      const after = before + signedQty;

      if (after < 0) {
        throw new Error('NEGATIVE_SUPPLEMENT_STOCK');
      }

      transaction.set(stockRef, {
        id: supplementTypeId,
        supplementTypeId,
        currentQty: after,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const logData = {
        date,
        timestamp: serverTimestamp(),
        supplementTypeId,
        type: 'adjust',
        qty: signedQty,
        before,
        after,
        staffName,
        reason,
      };
      if (note) logData.note = note;
      transaction.set(logRef, logData);

      transaction.set(activityRef, {
        action: 'supplementStock',
        subAction: 'manualAdjust',
        date,
        staff: staffName,
        uid: currentUser?.uid || null,
        timestamp: serverTimestamp(),
        message: `영양제 수동조정 — ${supplementName} ${sign}${signedQty}봉 / 사유: ${reason} / 담당: ${staffName}`,
        details: {
          supplementTypeId,
          supplementName,
          signedQty,
          before,
          after,
          reason,
          note: note || null,
        },
        read: false,
        acknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null,
        acknowledgedByUid: null,
      });
    });

    closeModal();
    await renderSupplement();
    alert('수동 조정 완료');
  } catch (err) {
    console.error('[supplement] adjust save failed:', err);
    if (err.message === 'NEGATIVE_SUPPLEMENT_STOCK') {
      alert('재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.');
    } else {
      alert(`수동 조정 중 오류가 발생했습니다: ${err.message || err}`);
    }
    saveButton.disabled = false;
  }
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

async function loadSupplementStaffCache() {
  const groupKeys = [SUPPLEMENT_IN_GROUP_KEY, SUPPLEMENT_ADJUST_GROUP_KEY];
  const missingKeys = groupKeys.filter(key => !supplementStaffCache[key]);
  if (missingKeys.length === 0) return;

  await Promise.all(missingKeys.map(async (key) => {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    supplementStaffCache[key] = snap.exists() ? snap.data().members || [] : [];
  }));
}

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
