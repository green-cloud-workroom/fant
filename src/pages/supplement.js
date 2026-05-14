import { db } from '../firebase.js';
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, where, runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { currentUser, currentUserRole } from '../app.js';
import { getTodayKST } from '../utils/date.js';
import { loadMenuStaffGroups, STAFF_GROUP_LABELS } from '../services/menuStaffGroups.js';
import { loadSystemValues } from '../services/systemValues.js';

// 표에 표시할 과거 일자 범위 (일). 오늘 포함 N일.
const SUPPLEMENT_TABLE_DAYS = 14;

// 색상 임계값. systemValues 로드 후 갱신된다. 로드 실패 시 이 디폴트 사용.
let supplementThresholdYellow = 10;
let supplementThresholdRed = 5;

let supplementTypes = [];
let supplementStocks = [];
let supplementLogs = [];
let supplementFilter = 'all';
let supplementStaffCache = {};
let supplementMenuStaffGroups = null;

// 상단 고정 담당자 select 현재 선택값. 표 다시 그려도 유지.
let selectedInStaff = '';
let selectedAdjustStaff = '';

export async function renderSupplement() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;

  await Promise.all([
    loadSupplementData(),
    loadSupplementMenuStaffGroups(),
    loadSupplementThresholds(),
  ]);
  await loadSupplementStaffCache();
  renderSupplementLayout();
}

async function loadSupplementThresholds() {
  const values = await loadSystemValues();
  supplementThresholdYellow = Number(values.supplementThresholdYellow) || 10;
  supplementThresholdRed = Number(values.supplementThresholdRed) || 5;
}

async function loadSupplementData() {
  const dateColumns = getSupplementDateColumns();
  const rangeStart = dateColumns[dateColumns.length - 1]; // 가장 과거 일자

  const [typeSnap, stockSnap, logSnap] = await Promise.all([
    getDocs(query(collection(db, 'supplementTypes'), orderBy('sortOrder'))),
    getDocs(collection(db, 'supplementStock')),
    // 복합 인덱스 회피: where만 사용하고 정렬은 클라이언트에서 처리.
    getDocs(query(collection(db, 'supplementLogs'), where('date', '>=', rangeStart))),
  ]);

  supplementTypes = typeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  supplementStocks = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  supplementLogs = logSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      // 최신순: date desc, 같은 날이면 timestamp desc.
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      const ta = a.timestamp?.seconds || 0;
      const tb = b.timestamp?.seconds || 0;
      return tb - ta;
    });
}

// 표에 표시할 날짜 열 목록. 오늘(맨 앞) ~ 과거 순. YYYY-MM-DD 문자열 배열.
function getSupplementDateColumns() {
  const today = getTodayKST(); // 'YYYY-MM-DD'
  const base = new Date(`${today}T00:00:00`);
  const cols = [];
  for (let i = 0; i < SUPPLEMENT_TABLE_DAYS; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    cols.push(`${yyyy}-${mm}-${dd}`);
  }
  return cols;
}

function renderSupplementLayout() {
  const content = document.getElementById('mainContent');
  const inStaffMembers = getSupplementStaffMembers(getSupplementStaffGroupKeys('supplementStockIn'));
  const adjustStaffMembers = getSupplementStaffMembers(getSupplementStaffGroupKeys('supplementAdjust'));
  const inStaffLabel = getSupplementStaffGroupLabel(getSupplementStaffGroupKeys('supplementStockIn'));
  const adjustStaffLabel = getSupplementStaffGroupLabel(getSupplementStaffGroupKeys('supplementAdjust'));

  content.innerHTML = `
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <span class="supplement-toolbar-title">영양제 재고</span>
        </div>
        <div class="supplement-toolbar-actions">
          ${isProductionRole() ? `
            <label class="supplement-staff-label">입고 담당자 (${escapeHtml(inStaffLabel)})</label>
            <select id="supplementInStaff" class="supplement-staff-select">
              <option value="">선택</option>
              ${inStaffMembers.map(m => `<option value="${escapeHtml(m.name)}" ${selectedInStaff === m.name ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}
            </select>
          ` : ''}
          ${isWriterRole() ? `
            <label class="supplement-staff-label">수동조정 담당자 (${escapeHtml(adjustStaffLabel)})</label>
            <select id="supplementAdjustStaff" class="supplement-staff-select">
              <option value="">선택</option>
              ${adjustStaffMembers.map(m => `<option value="${escapeHtml(m.name)}" ${selectedAdjustStaff === m.name ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}
            </select>
          ` : ''}
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${supplementFilter === 'all' ? 'selected' : ''}>전체</option>
            <option value="warning" ${supplementFilter === 'warning' ? 'selected' : ''}>${supplementThresholdYellow}봉 미만만</option>
            <option value="danger" ${supplementFilter === 'danger' ? 'selected' : ''}>${supplementThresholdRed}봉 미만만</option>
          </select>
          <button class="btn-secondary" id="btnSupplementAllLogs">전체보기</button>
          <button class="btn-secondary" id="btnSupplementRefresh">새로고침</button>
        </div>
      </div>

      <div class="supplement-table-wrap" id="supplementTableWrap">
        ${renderSupplementTable()}
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
    if (supplementFilter === 'warning') return qty < supplementThresholdYellow;
    if (supplementFilter === 'danger') return qty < supplementThresholdRed;
    return true;
  });
}

// 해당 날짜+SKU+유형의 로그 합계. 입고/자동차감/수동조정 모두 사용.
function getCellSum(typeId, date, type) {
  return supplementLogs
    .filter(log => log.supplementTypeId === typeId && log.date === date && log.type === type)
    .reduce((sum, log) => sum + Number(log.qty || 0), 0);
}

// 해당 날짜+SKU에 특정 유형 로그가 1건이라도 있는지.
function hasCellLog(typeId, date, type) {
  return supplementLogs.some(
    log => log.supplementTypeId === typeId && log.date === date && log.type === type
  );
}

function isWriterRole() {
  return currentUserRole === 'admin' || currentUserRole === 'office';
}

function isProductionRole() {
  return currentUserRole === 'production';
}

// 표 렌더링. 좌측 고정(SKU명 + 현재재고) + 날짜별 3열(입고/수동조정/자동차감).
function renderSupplementTable() {
  const filtered = getFilteredSupplementTypes();
  if (supplementTypes.length === 0) {
    return '<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>';
  }
  if (filtered.length === 0) {
    return '<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>';
  }

  const dateColumns = getSupplementDateColumns();

  const headerDateCells = dateColumns.map(date => `
    <th class="supplement-th-date" colspan="3">${formatColumnDate(date)}</th>
  `).join('');

  const headerTypeCells = dateColumns.map(date => {
    const reason = getAdjustReasonForColumn(date);
    return `
      <th class="supplement-th-type supplement-th-in">입고</th>
      <th class="supplement-th-type supplement-th-adjust" title="${escapeHtml(reason || '')}">
        수동조정${reason ? `<span class="supplement-th-reason">${escapeHtml(reason)}</span>` : ''}
      </th>
      <th class="supplement-th-type supplement-th-auto">자동차감</th>
    `;
  }).join('');

  const bodyRows = filtered.map(type => {
    const qty = getStockQty(type.id);
    const inactive = type.active === false;
    const qtyClass = inactive ? ''
      : qty < supplementThresholdRed ? 'supplement-qty--danger'
      : qty < supplementThresholdYellow ? 'supplement-qty--warning'
      : '';

    const dateCells = dateColumns.map(date => renderDateCells(type, date, inactive)).join('');

    return `
      <tr class="${inactive ? 'supplement-row--inactive' : ''}">
        <td class="supplement-td-name">
          ${escapeHtml(type.name || type.id)}
          ${inactive ? '<span class="tag tag-inactive">비활성</span>' : ''}
        </td>
        <td class="supplement-td-qty ${qtyClass}">${qty}봉</td>
        ${dateCells}
      </tr>
    `;
  }).join('');

  return `
    <table class="supplement-table">
      <thead>
        <tr>
          <th class="supplement-th-name" rowspan="2">영양제 SKU</th>
          <th class="supplement-th-qty" rowspan="2">현재 재고</th>
          ${headerDateCells}
        </tr>
        <tr>
          ${headerTypeCells}
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;
}

// 한 SKU × 한 날짜의 3개 셀 (입고/수동조정/자동차감).
function renderDateCells(type, date, inactive) {
  const typeId = type.id;
  const inSum = getCellSum(typeId, date, 'in');
  const adjustSum = getCellSum(typeId, date, 'adjust');
  const autoSum = getCellSum(typeId, date, 'autoDeduct');

  const hasIn = hasCellLog(typeId, date, 'in');
  const canEditIn = !inactive && isProductionRole();
  const canEditAdjust = !inactive && isWriterRole();

  // 입고 셀: 그날 입고 로그 있으면 read-only 합계 표시, 없으면 입력 가능(production).
  let inCell;
  if (hasIn) {
    inCell = `<td class="supplement-cell supplement-cell--in supplement-cell--locked"
      data-type-id="${escapeHtml(typeId)}" data-date="${date}" data-cell="in"
      title="이미 입고 기록이 있습니다. 추가·정정은 수동조정을 사용해주세요.">
      ${inSum > 0 ? `+${inSum}` : inSum}
    </td>`;
  } else if (canEditIn) {
    inCell = `<td class="supplement-cell supplement-cell--in">
      <input type="number" class="supplement-cell-input" data-type-id="${escapeHtml(typeId)}"
        data-date="${date}" data-cell="in" min="1" step="1" placeholder="" />
    </td>`;
  } else {
    inCell = `<td class="supplement-cell supplement-cell--in supplement-cell--readonly"></td>`;
  }

  // 수동조정 셀: writer면 부호 입력 가능. 그날 기존 조정 합계는 표시만 (델타 입력은 새 로그).
  let adjustCell;
  if (canEditAdjust) {
    adjustCell = `<td class="supplement-cell supplement-cell--adjust">
      <input type="text" class="supplement-cell-input supplement-cell-input--adjust"
        data-type-id="${escapeHtml(typeId)}" data-date="${date}" data-cell="adjust"
        placeholder="" inputmode="numeric" />
      ${adjustSum !== 0 ? `<span class="supplement-cell-sum">누적 ${adjustSum > 0 ? '+' : ''}${adjustSum}</span>` : ''}
    </td>`;
  } else {
    adjustCell = `<td class="supplement-cell supplement-cell--adjust supplement-cell--readonly">
      ${adjustSum !== 0 ? `${adjustSum > 0 ? '+' : ''}${adjustSum}` : ''}
    </td>`;
  }

  // 자동차감 셀: 항상 read-only.
  const autoCell = `<td class="supplement-cell supplement-cell--auto supplement-cell--readonly">
    ${autoSum !== 0 ? autoSum : ''}
  </td>`;

  return inCell + adjustCell + autoCell;
}

// 열 헤더 날짜 표기. 'M/D (요일)'.
function formatColumnDate(date) {
  const d = new Date(`${date}T00:00:00`);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}

// 해당 날짜 수동조정 열의 사유 (열 전체 공통, 1개).
// 같은 날 여러 조정 로그가 있으면 가장 최근(timestamp desc 정렬 기준 첫 번째) 것을 표시.
function getAdjustReasonForColumn(date) {
  const log = supplementLogs.find(
    l => l.date === date && l.type === 'adjust' && l.reason
  );
  return log?.reason || '';
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
  document.getElementById('btnSupplementRefresh')?.addEventListener('click', async () => {
    await renderSupplement();
  });
  document.getElementById('supplementFilter')?.addEventListener('change', (e) => {
    supplementFilter = e.target.value;
    const wrap = document.getElementById('supplementTableWrap');
    if (wrap) wrap.innerHTML = renderSupplementTable();
    bindSupplementCellEvents();
  });
  document.getElementById('btnSupplementAllLogs')?.addEventListener('click', showAllSupplementLogsModal);

  document.getElementById('supplementInStaff')?.addEventListener('change', (e) => {
    selectedInStaff = e.target.value;
  });
  document.getElementById('supplementAdjustStaff')?.addEventListener('change', (e) => {
    selectedAdjustStaff = e.target.value;
  });

  bindSupplementCellEvents();
}

function bindSupplementCellEvents() {
  // 입고 셀: 비어있는 입력칸만 존재. blur 시 저장.
  document.querySelectorAll('.supplement-cell-input[data-cell="in"]').forEach(input => {
    input.addEventListener('blur', (e) => handleIncomingCellBlur(e.target));
  });

  // 수동조정 셀: blur 시 델타 저장.
  document.querySelectorAll('.supplement-cell-input[data-cell="adjust"]').forEach(input => {
    input.addEventListener('blur', (e) => handleAdjustCellBlur(e.target));
  });

  // 입고 잠금 셀: 클릭 시 안내.
  document.querySelectorAll('.supplement-cell--in.supplement-cell--locked').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      const typeId = cell.dataset.typeId;
      const sum = getCellSum(typeId, date, 'in');
      alert(`이미 ${sum}봉 입고 기록이 있습니다. 추가·정정은 수동조정을 사용해주세요.`);
    });
  });
}

// 입고 셀 blur — 그날 입고 로그가 없을 때만 입력 가능. 기존 트랜잭션 재사용.
async function handleIncomingCellBlur(input) {
  const typeId = input.dataset.typeId;
  const date = input.dataset.date;
  const raw = input.value.trim();
  if (!raw) return; // 빈 입력은 무시

  const qty = Number(raw);
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    alert('입고 수량은 1 이상의 정수로 입력해주세요.');
    input.value = '';
    return;
  }

  // 동시 입력 방어: blur 시점에 이미 로그가 생겼으면 차단.
  if (hasCellLog(typeId, date, 'in')) {
    alert('이미 입고 기록이 있습니다. 새로고침 후 확인해주세요.');
    input.value = '';
    return;
  }

  // 담당자 = 상단 입고 담당자 select 값.
  const staffName = selectedInStaff;
  if (!staffName) {
    alert('입고 담당자를 선택해주세요.');
    input.value = '';
    return;
  }

  input.disabled = true;
  try {
    await saveIncomingCell(typeId, date, qty, staffName);
    await renderSupplement();
  } catch (err) {
    console.error('[supplement] incoming cell save failed:', err);
    alert(`입고 등록 중 오류가 발생했습니다: ${err.message || err}`);
    input.disabled = false;
  }
}

// 입고 저장 — 기존 saveSupplementIncoming 트랜잭션 로직 재사용.
async function saveIncomingCell(supplementTypeId, date, qty, staffName) {
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

    transaction.set(logRef, {
      date,
      timestamp: serverTimestamp(),
      supplementTypeId,
      type: 'in',
      qty,
      before,
      after,
      staffName,
    });
  });
}

// 수동조정 셀 blur — 부호 입력(+N / -N / N). 델타로 새 로그 발행.
async function handleAdjustCellBlur(input) {
  const typeId = input.dataset.typeId;
  const date = input.dataset.date;
  const raw = input.value.trim();
  if (!raw) return;

  // '+5', '-3', '5' 모두 허용. 정수만.
  const signedQty = Number(raw);
  if (!Number.isFinite(signedQty) || signedQty === 0 || !Number.isInteger(signedQty)) {
    alert('수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)');
    input.value = '';
    return;
  }

  // 사유 = 열 헤더 1개 공통. 기존 사유가 있으면 디폴트로 제시, 없으면 입력받음.
  const existingReason = getAdjustReasonForColumn(date);
  const reason = prompt(
    `수동조정 사유를 입력해주세요. (${formatColumnDate(date)} 열 전체 공통)`,
    existingReason || ''
  );
  if (reason === null) { // 취소
    input.value = '';
    return;
  }
  if (!reason.trim()) {
    alert('사유를 입력해야 합니다.');
    input.value = '';
    return;
  }

  // 담당자 = 상단 수동조정 담당자 select 값.
  const staffName = selectedAdjustStaff;
  if (!staffName) {
    alert('수동조정 담당자를 선택해주세요.');
    input.value = '';
    return;
  }

  input.disabled = true;
  try {
    await saveAdjustCell(typeId, date, signedQty, reason.trim(), staffName);
    await renderSupplement();
  } catch (err) {
    console.error('[supplement] adjust cell save failed:', err);
    if (err.message === 'NEGATIVE_SUPPLEMENT_STOCK') {
      alert('재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.');
    } else {
      alert(`수동 조정 중 오류가 발생했습니다: ${err.message || err}`);
    }
    input.disabled = false;
  }
}

// 수동조정 저장 — 기존 saveSupplementAdjust 트랜잭션 로직 + activityLogs 풀필드 재사용.
async function saveAdjustCell(supplementTypeId, date, signedQty, reason, staffName) {
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

    transaction.set(logRef, {
      date,
      timestamp: serverTimestamp(),
      supplementTypeId,
      type: 'adjust',
      qty: signedQty,
      before,
      after,
      staffName,
      reason,
    });

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
        note: null,
      },
      read: false,
      acknowledged: false,
      acknowledgedAt: null,
      acknowledgedBy: null,
      acknowledgedByUid: null,
    });
  });
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

async function loadSupplementMenuStaffGroups() {
  supplementMenuStaffGroups = await loadMenuStaffGroups();
}

async function loadSupplementStaffCache() {
  if (!supplementMenuStaffGroups) {
    await loadSupplementMenuStaffGroups();
  }

  const groupKeys = [
    ...getSupplementStaffGroupKeys('supplementStockIn'),
    ...getSupplementStaffGroupKeys('supplementAdjust'),
  ].filter((key, index, list) => list.indexOf(key) === index);
  const missingKeys = groupKeys.filter(key => !supplementStaffCache[key]);
  if (missingKeys.length === 0) return;

  await Promise.all(missingKeys.map(async (key) => {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    supplementStaffCache[key] = snap.exists() ? snap.data().members || [] : [];
  }));
}

function getSupplementStaffGroupKeys(menuKey) {
  const groups = supplementMenuStaffGroups?.[menuKey];
  return Array.isArray(groups) && groups.length > 0 ? groups : [];
}

function getSupplementStaffMembers(groupKeys) {
  const byName = new Map();
  groupKeys.forEach(groupKey => {
    (supplementStaffCache[groupKey] || []).forEach(member => {
      if (member?.name && !byName.has(member.name)) {
        byName.set(member.name, member);
      }
    });
  });
  return Array.from(byName.values());
}

function getSupplementStaffGroupLabel(groupKeys) {
  return groupKeys.map(key => STAFF_GROUP_LABELS[key] || key).join('+');
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
