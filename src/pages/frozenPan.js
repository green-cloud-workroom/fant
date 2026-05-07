import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { round2, breadToSilicon } from '../utils/number.js';

let freezeDryRecipes = [];
let activeTab = 'breadPan';  // 'breadPan' | 'frozenPan' — 묶음 3D 추가

export async function renderFrozenPan() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>동결판 재고 로딩 중...</p></div>`;
  freezeDryRecipes = await getActiveFreezeDryRecipes();
  await loadStaffCache();
  activeTab = 'breadPan';  // 진입 시 default 탭 리셋
  await refreshFrozenPanLayout();
}

async function loadFrozenPanRows() {
  const q = query(collection(db, 'frozenPanStock'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadFrozenPanLots() {
  const snap = await getDocs(collection(db, 'frozenPanLots'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => !l.closed);
}

async function loadBreadPanLots() {
  const snap = await getDocs(collection(db, 'breadPanLots'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => !l.closed);
}

async function loadBreadPanLogs() {
  const q = query(collection(db, 'breadPanLogs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function refreshFrozenPanLayout() {
  const rows = await loadFrozenPanRows();
  const lots = await loadFrozenPanLots();
  const breadPanLots = await loadBreadPanLots();
  const breadPanLogs = await loadBreadPanLogs();
  renderFrozenPanLayout(rows, lots, breadPanLots, breadPanLogs);
}

function renderFrozenPanLayout(rows, lots, breadPanLots, breadPanLogs) {
  const content = document.getElementById('mainContent');

  // 동결판 제품별 lot 집계
  const lotSummary = {};
  lots.forEach(l => {
    if (!lotSummary[l.productName]) lotSummary[l.productName] = [];
    lotSummary[l.productName].push({ date: l.date, remaining: l.remaining });
  });

  // 빵판 제품별 lot 집계
  const breadLotSummary = {};
  breadPanLots.forEach(l => {
    if (!breadLotSummary[l.productName]) breadLotSummary[l.productName] = [];
    breadLotSummary[l.productName].push({ date: l.date, remaining: l.remaining });
  });

  // 합계 — 빵판 / 실리콘 / 동결판
  const totalBreadPan = round2(breadPanLots.reduce((sum, l) => sum + (l.remaining || 0), 0));
  const totalSilicon = breadToSilicon(totalBreadPan);
  const totalPan = lots.reduce((sum, l) => sum + (l.remaining || 0), 0);

  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결판 재고</h2>
      </div>

      <!-- 합계 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 빵판</span>
            <span class="stat-value" style="font-size:20px;color:#1a1a1a">${totalBreadPan}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">실리콘 환산</span>
            <span class="stat-value" style="font-size:14px;color:#888">${totalSilicon}판</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">현재 총 동결판</span>
            <span class="stat-value" style="font-size:20px;color:${totalPan < 10 ? '#e53e3e' : '#1a1a1a'}">${totalPan}판</span>
          </div>
        </div>
      </div>

      <!-- 탭 nav -->
      <div class="tab-nav" style="display:flex;gap:0;border-bottom:2px solid #e8e8e8;margin-bottom:16px;">
        <button class="tab-btn" data-tab="breadPan"
          style="padding:10px 20px;background:${activeTab === 'breadPan' ? '#fff' : '#f5f5f5'};border:1px solid #e8e8e8;border-bottom:${activeTab === 'breadPan' ? '2px solid white' : 'none'};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${activeTab === 'breadPan' ? '600' : '400'};color:${activeTab === 'breadPan' ? '#1a1a1a' : '#888'};">
          빵판 재고
        </button>
        <button class="tab-btn" data-tab="frozenPan"
          style="padding:10px 20px;background:${activeTab === 'frozenPan' ? '#fff' : '#f5f5f5'};border:1px solid #e8e8e8;border-bottom:${activeTab === 'frozenPan' ? '2px solid white' : 'none'};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${activeTab === 'frozenPan' ? '600' : '400'};color:${activeTab === 'frozenPan' ? '#1a1a1a' : '#888'};">
          동결판 재고
        </button>
      </div>

      <!-- 탭 콘텐츠 -->
      ${activeTab === 'breadPan' ? renderBreadPanTab(breadLotSummary, breadPanLogs) : renderFrozenPanTab(rows, lotSummary)}
    </div>
  `;

  // 탭 nav 이벤트
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      renderFrozenPanLayout(rows, lots, breadPanLots, breadPanLogs);
    });
  });

  // 탭별 이벤트 바인딩
  if (activeTab === 'breadPan') {
    bindBreadPanTabEvents(rows, lots);
  } else {
    bindFrozenPanTabEvents(rows, lots);
  }
}

function renderBreadPanTab(breadLotSummary, breadPanLogs) {
  const lotEntries = Object.entries(breadLotSummary);
  return `
    <div class="page-header" style="margin-bottom:12px;">
      <span style="font-size:14px;color:#555;font-weight:600;">빵판 lot 잔량</span>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" id="btnBreadPanAdjust">+ 수동 조정</button>
        <button class="btn-secondary" id="btnAddWorkRow">+ 작업 행 추가</button>
        <button class="btn-primary" id="btnBreadPanIncoming">+ 빵판 입고</button>
      </div>
    </div>

    <!-- 빵판 lot 잔량 -->
    <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
      ${lotEntries.length === 0 ? '<div style="color:#aaa;text-align:center;padding:8px;">빵판 lot 없음</div>' : `
        <div class="stat-row">
          ${lotEntries.map(([name, lotList]) => `
            <div class="stat-item">
              <span class="stat-label">${name}</span>
              <div>
                ${lotList.sort((a,b) => a.date.localeCompare(b.date)).map(l => `
                  <div style="font-size:12px;color:#555">${l.remaining}개 <span style="color:#aaa">(${l.date})</span></div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- 빵판 이력 -->
    <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>구분</th>
            <th>제품</th>
            <th>수량</th>
            <th>담당자</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          ${breadPanLogs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
            breadPanLogs.map(l => renderBreadPanLogRow(l)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderBreadPanLogRow(log) {
  const typeLabel = {
    incoming: '입고',
    preprocess: '전처리',
    adjust: '수동조정',
    rollback: '롤백',
  }[log.type] || log.type;

  const typeColor = {
    incoming: 'tag-raw',       // 파란색
    preprocess: '',            // 회색
    adjust: 'tag-cat',         // 노란색
    rollback: 'tag-cat',
  }[log.type] || '';

  const qtyColor = log.qty > 0 ? '#2d7a3a' : '#e53e3e';
  const qtySign = log.qty > 0 ? '+' : '';

  // 비고 — preprocess는 expected/actual 표시, 아니면 note/reason
  let noteText = '-';
  if (log.type === 'preprocess' && log.expectedFrozenQty != null && log.actualFrozenQty != null) {
    const diffText = log.diff > 0 ? `+${log.diff}` : log.diff < 0 ? `${log.diff}` : '0';
    noteText = `이론 ${log.expectedFrozenQty} / 실측 ${log.actualFrozenQty} (차 ${diffText})`;
  } else if (log.note) {
    noteText = log.note;
  } else if (log.reason) {
    noteText = log.reason;
  }

  return `
    <tr>
      <td>${log.date || '-'}</td>
      <td><span class="tag ${typeColor}" style="${log.type === 'preprocess' ? 'background:#f0f0f0;color:#666' : ''}">${typeLabel}</span></td>
      <td>${log.productName || '-'}</td>
      <td style="color:${qtyColor};font-weight:500;">${qtySign}${log.qty || 0}개</td>
      <td>${log.staffName || '-'}</td>
      <td style="font-size:12px;color:#666;">${noteText}</td>
    </tr>
  `;
}

function renderFrozenPanTab(rows, lotSummary) {
  const lotEntries = Object.entries(lotSummary);
  return `
    <div class="page-header" style="margin-bottom:12px;">
      <span style="font-size:14px;color:#555;font-weight:600;">동결판 lot 잔량</span>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" id="btnFrozenPanAdjust">+ 수동 조정</button>
        <button class="btn-secondary" id="btnAddOrderRow">+ 발주 행 추가</button>
        <button class="btn-primary" id="btnTenderIn">+ 텐더동결 입고</button>
      </div>
    </div>

    <!-- 동결판 lot 잔량 -->
    <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
      ${lotEntries.length === 0 ? '<div style="color:#aaa;text-align:center;padding:8px;">동결판 lot 없음</div>' : `
        <div class="stat-row">
          ${lotEntries.map(([name, lotList]) => `
            <div class="stat-item">
              <span class="stat-label">${name}</span>
              <div>
                ${lotList.sort((a,b) => a.date.localeCompare(b.date)).map(l => `
                  <div style="font-size:12px;color:#555">${l.remaining}판 <span style="color:#aaa">(${l.date})</span></div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- 작업/발주 테이블 -->
    <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>구분</th>
            <th>담당자</th>
            <th>내용</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">등록된 내역 없음</td></tr>` :
            rows.map(r => renderPanRow(r)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindBreadPanTabEvents(rows, lots) {
  const btnIncoming = document.getElementById('btnBreadPanIncoming');
  if (btnIncoming) btnIncoming.addEventListener('click', () => showBreadPanIncomingModal());

  const btnAdjust = document.getElementById('btnBreadPanAdjust');
  if (btnAdjust) btnAdjust.addEventListener('click', () => showBreadPanAdjustModal());

  const btnWorkRow = document.getElementById('btnAddWorkRow');
  if (btnWorkRow) btnWorkRow.addEventListener('click', () => showWorkRowModal(rows, lots));
}

function bindFrozenPanTabEvents(rows, lots) {
  const btnTender = document.getElementById('btnTenderIn');
  if (btnTender) btnTender.addEventListener('click', () => {
    alert('텐더동결 입고 기능은 3G에서 추가 예정입니다.');
  });

  const btnAdjust = document.getElementById('btnFrozenPanAdjust');
  if (btnAdjust) btnAdjust.addEventListener('click', () => {
    alert('동결판 수동 조정 기능은 추후 추가 예정입니다.');
  });

  const btnOrderRow = document.getElementById('btnAddOrderRow');
  if (btnOrderRow) btnOrderRow.addEventListener('click', () => showOrderRowModal(rows, lots));

  // 발주 확인 버튼
  document.querySelectorAll('.btn-order-confirm').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rowId = btn.dataset.id;
      const row = rows.find(r => r.id === rowId);
      if (!row) return;
      if (await blockIfClosed(row.date)) return;
      await confirmOrder(row, lots);
    });
  });

  // 발주 삭제 버튼
  document.querySelectorAll('.btn-order-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('발주 행을 삭제하시겠습니까?')) return;
      const targetRow = rows.find(r => r.id === btn.dataset.id);
      if (targetRow && await blockIfClosed(targetRow.date)) return;
      await updateDoc(doc(db, 'frozenPanStock', btn.dataset.id), { status: 'cancelled' });
      await refreshFrozenPanLayout();
    });
  });

  // 발주 취소 버튼
  document.querySelectorAll('.btn-order-cancel').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('발주 확인을 취소하시겠습니까? 차감된 동결판 재고가 복원됩니다.')) return;
      const rowId = btn.dataset.id;
      const row = rows.find(r => r.id === rowId);
      if (row && await blockIfClosed(row.date)) return;
      if (row) await cancelOrder(row, lots);
    });
  });
}

function showBreadPanIncomingModal() {
  const breadPanRecipes = freezeDryRecipes.filter(r => r.requiresSeparation === true);

  if (breadPanRecipes.length === 0) {
    alert('동결생식 레시피가 없습니다.\n\n레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.');
    return;
  }

  showModal(`
    <h3 class="modal-title">빵판 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>레시피 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${breadPanRecipes.map(r => `<option value="${r.displayName}">${r.displayName}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>빵판 수 * (소수 2자리)</label>
        <input type="number" id="m_qty" step="0.01" min="0.01" placeholder="예: 4.5" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${getStaffOptions(['senior', 'office'])}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanIncoming">저장</button>
    </div>
  `);

  document.getElementById('btnSaveBreadPanIncoming').addEventListener('click', async () => {
    const productName = document.getElementById('m_recipe').value.trim();
    const qty = round2(parseFloat(document.getElementById('m_qty').value) || 0);
    const date = document.getElementById('m_date').value;
    const staffName = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value.trim();

    if (!productName) { alert('레시피를 선택해주세요.'); return; }
    if (qty <= 0) { alert('빵판 수는 0보다 커야 합니다.'); return; }
    if (!date) { alert('날짜를 입력해주세요.'); return; }
    if (!staffName) { alert('담당자를 선택해주세요.'); return; }

    if (await blockIfClosed(date)) return;

    const now = new Date();

    // 1. breadPanLots 신규 lot
    const lotRef = await addDoc(collection(db, 'breadPanLots'), {
      productName,
      date,
      staffName,
      initialQty: qty,
      remaining: qty,
      closed: false,
      note: note || null,
      createdAt: now,
      updatedAt: now,
    });

    // 2. breadPanLogs 기록
    await addDoc(collection(db, 'breadPanLogs'), {
      type: 'incoming',
      date,
      productName,
      qty,
      before: 0,
      after: qty,
      lotId: lotRef.id,
      expectedFrozenQty: null,
      actualFrozenQty: null,
      diff: null,
      staffName,
      uid: null,
      note: note || null,
      reason: null,
      batchId: null,
      ledgerId: null,
      timestamp: now,
    });

    closeModal();
    await refreshFrozenPanLayout();
    alert('빵판 입고 완료!');
  });
}

async function showBreadPanAdjustModal() {
  // 활성 lot 로드
  const allBreadLots = await loadBreadPanLots();

  if (allBreadLots.length === 0) {
    alert('조정할 빵판 lot이 없습니다.\n빵판 입고를 먼저 진행해주세요.');
    return;
  }

  // 제품별 lot 그룹핑 (드롭다운에 lot ID + 잔량 표시)
  const lotOptions = allBreadLots
    .sort((a, b) => {
      const nameDiff = a.productName.localeCompare(b.productName);
      if (nameDiff !== 0) return nameDiff;
      return a.date.localeCompare(b.date);
    })
    .map(l => `<option value="${l.id}">${l.productName} / ${l.date} / 잔량 ${l.remaining}개</option>`)
    .join('');

  showModal(`
    <h3 class="modal-title">빵판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${lotOptions}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형 *</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량 * (소수 2자리)</label>
        <input type="number" id="m_qty" step="0.01" min="0.01" placeholder="예: 0.5" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="예: 실측 차이 보정 / 분실" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['senior', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanAdjust">저장</button>
    </div>
  `);

  document.getElementById('btnSaveBreadPanAdjust').addEventListener('click', async () => {
    const lotId = document.getElementById('m_lot').value;
    const adjustType = document.getElementById('m_adjustType').value;
    const qtyInput = round2(parseFloat(document.getElementById('m_qty').value) || 0);
    const reason = document.getElementById('m_reason').value.trim();
    const staffName = document.getElementById('m_staff').value;

    if (!lotId) { alert('대상 lot을 선택해주세요.'); return; }
    if (qtyInput <= 0) { alert('수량은 0보다 커야 합니다.'); return; }
    if (!reason) { alert('사유를 입력해주세요.'); return; }
    if (!staffName) { alert('담당자를 선택해주세요.'); return; }

    // 부호 적용
    const delta = adjustType === 'plus' ? qtyInput : -qtyInput;

    // lot 현재값 조회
    const lotSnap = await getDoc(doc(db, 'breadPanLots', lotId));
    if (!lotSnap.exists()) { alert('lot을 찾을 수 없습니다.'); return; }
    const lot = lotSnap.data();
    const lotDate = lot.date;

    if (await blockIfClosed(lotDate)) return;

    const before = lot.remaining || 0;
    const after = round2(before + delta);

    // 음수 차감 시 경고 (마이너스 허용은 하지만 확인은 받음)
    if (after < 0) {
      if (!confirm(`조정 후 잔량이 ${after}개로 음수가 됩니다. 그대로 진행하시겠습니까?`)) return;
    }

    const now = new Date();
    const today = getToday();

    // 1. lot 갱신
    await updateDoc(doc(db, 'breadPanLots', lotId), {
      remaining: after,
      closed: after <= 0.005,
      updatedAt: now,
    });

    // 2. breadPanLogs 기록
    await addDoc(collection(db, 'breadPanLogs'), {
      type: 'adjust',
      date: today,
      productName: lot.productName,
      qty: delta,
      before,
      after,
      lotId,
      expectedFrozenQty: null,
      actualFrozenQty: null,
      diff: null,
      staffName,
      uid: null,
      note: null,
      reason,
      batchId: null,
      ledgerId: null,
      timestamp: now,
    });

    closeModal();
    await refreshFrozenPanLayout();
    alert('수동 조정 완료!');
  });
}

function renderPanRow(r) {
  if (r.status === 'cancelled') return '';

  const isOrder = r.type === 'order';
  const isConfirmed = r.status === 'confirmed';

  let contentHtml = '';
  if (isOrder) {
    const total = (r.items || []).reduce((sum, i) => sum + (i.orderPanQty || 0), 0);
    const color = total === 45 ? '#2d7a3a' : total > 45 ? '#e53e3e' : '#e67e22';
    contentHtml = `
      ${(r.items || []).map(i => `<span style="font-size:11px;margin-right:8px">${i.productName}: ${i.orderPanQty}판</span>`).join('')}
      <span style="font-weight:600;color:${color}">총 ${total}판</span>
    `;
  } else {
    contentHtml = (r.items || []).map(i =>
      `<span style="font-size:11px;margin-right:8px">${i.productName}: 빵판${i.breadPanQty} / 동결판${i.freezePanQty}</span>`
    ).join('');
  }

  let actionHtml = '';
  if (isOrder && !isConfirmed) {
    actionHtml = `
      <button class="btn-primary btn-order-confirm" data-id="${r.id}" style="font-size:11px;padding:3px 10px;">발주 확인</button>
      <button class="btn-del-row btn-order-delete" data-id="${r.id}">삭제</button>
    `;
  } else if (isOrder && isConfirmed) {
    actionHtml = `<button class="btn-secondary btn-order-cancel" data-id="${r.id}" style="font-size:11px;padding:3px 10px;">발주 취소</button>`;
  }

  return `
    <tr style="background:${isOrder ? '#fffdf0' : 'white'}">
      <td>${r.date}</td>
      <td><span class="tag ${isOrder ? 'tag-cat' : 'tag-raw'}">${isOrder ? '발주' : '작업'}</span></td>
      <td>${r.staffName || '-'}</td>
      <td>${contentHtml}</td>
      <td>
        ${isConfirmed ? '<span style="color:#2d7a3a;font-size:12px">✅ 확인완료</span>' :
          isOrder ? '<span style="color:#e67e22;font-size:12px">⏳ 대기중</span>' : '-'}
      </td>
      <td style="white-space:nowrap">${actionHtml}</td>
    </tr>
  `;
}

function showWorkRowModal(rows, lots) {
  showModal(`
    <h3 class="modal-title">작업 행 추가</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${getStaffOptions(['senior', 'office'])}
        </select>
      </div>
    </div>
    <div id="workItems">
      <div class="work-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <select class="wi-name cell-input" style="flex:1">${getRecipeOptionsHtml(freezeDryRecipes)}</select>
        <input type="number" class="wi-bread cell-input" placeholder="빵판수" style="width:80px" />
        <input type="number" class="wi-freeze cell-input" placeholder="동결판수" style="width:80px" />
        <button class="btn-del-row wi-del">✕</button>
      </div>
    </div>
    <button class="btn-secondary" id="btnAddWorkItem" style="margin-bottom:16px;">+ 제품 추가</button>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveWorkRow">저장</button>
    </div>
  `);

  bindWorkItemEvents();

  document.getElementById('btnAddWorkItem').addEventListener('click', () => {
    document.getElementById('workItems').insertAdjacentHTML('beforeend', `
      <div class="work-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <select class="wi-name cell-input" style="flex:1">${getRecipeOptionsHtml(freezeDryRecipes)}</select>
        <input type="number" class="wi-bread cell-input" placeholder="빵판수" style="width:80px" />
        <input type="number" class="wi-freeze cell-input" placeholder="동결판수" style="width:80px" />
        <button class="btn-del-row wi-del">✕</button>
      </div>
    `);
    bindWorkItemEvents();
  });

  document.getElementById('btnSaveWorkRow').addEventListener('click', async () => {
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const items = Array.from(document.querySelectorAll('.work-item')).map(row => ({
      productName: row.querySelector('.wi-name').value.trim(),
      breadPanQty: parseInt(row.querySelector('.wi-bread').value) || 0,
      freezePanQty: parseInt(row.querySelector('.wi-freeze').value) || 0,
    })).filter(i => i.productName);

    if (!date || items.length === 0) { alert('날짜와 제품을 입력해주세요.'); return; }
    if (await blockIfClosed(date)) return;

    const rowRef = await addDoc(collection(db, 'frozenPanStock'), {
      date, type: 'work', status: 'done',
      staffName: staff, items,
      createdAt: new Date(), updatedAt: new Date(),
    });

    // lot 생성
    for (const item of items) {
      if (item.freezePanQty > 0) {
        await addDoc(collection(db, 'frozenPanLots'), {
          productName: item.productName,
          date,
          initialQty: item.freezePanQty,
          remaining: item.freezePanQty,
          sourceRowId: rowRef.id,
          closed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    closeModal();
    await refreshFrozenPanLayout();
    alert('작업 행 추가 완료!');
  });
}

function bindWorkItemEvents() {
  document.querySelectorAll('.wi-del').forEach(btn => {
    btn.onclick = () => btn.closest('.work-item').remove();
  });
}

function showOrderRowModal(rows, lots) {
  // 제품별 현재 재고 계산 (자체 lot 합계)
  const stockByProduct = {};
  lots.forEach(l => {
    if (!stockByProduct[l.productName]) stockByProduct[l.productName] = 0;
    stockByProduct[l.productName] += l.remaining;
  });


  // 재고 표시 옵션 HTML 생성기
  function getOptionsWithStock() {
    return freezeDryRecipes.map(r => {
      const stock = stockByProduct[r.displayName] || 0;
      return `<option value="${r.displayName}" data-stock="${stock}">${r.displayName} (재고 ${stock}판)</option>`;
    }).join('');
  }

  showModal(`
    <h3 class="modal-title">발주 행 추가</h3>
    <div class="form-group">
      <label>날짜 (동결건조 돌리는 날짜)</label>
      <input type="date" id="m_date" value="${getToday()}" min="${getToday()}" />
    </div>
    <div id="orderItems">
      <div class="order-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <select class="oi-name cell-input" style="flex:1" onchange="updateOrderItemMax(this)">
          <option value="">선택</option>
          ${getOptionsWithStock()}
        </select>
        <input type="number" class="oi-qty cell-input" placeholder="돌릴 판수" style="width:100px" oninput="updateOrderTotal()" />
        <span class="oi-stock-info" style="font-size:11px;color:#888;min-width:60px;"></span>
        <button class="btn-del-row oi-del">✕</button>
      </div>
    </div>
    <button class="btn-secondary" id="btnAddOrderItem" style="margin-bottom:8px;">+ 제품 추가</button>
    <div style="font-size:13px;font-weight:600;margin-bottom:16px;">
      총합: <span id="orderTotal" style="color:#e67e22">0</span>판
      <span style="font-size:11px;color:#aaa;margin-left:8px">(기준: 45판)</span>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOrderRow">저장</button>
    </div>
  `);

  bindOrderItemEvents();

  document.getElementById('btnAddOrderItem').addEventListener('click', () => {
    document.getElementById('orderItems').insertAdjacentHTML('beforeend', `
      <div class="order-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <select class="oi-name cell-input" style="flex:1" onchange="updateOrderItemMax(this)">
          <option value="">선택</option>
          ${getOptionsWithStock()}
        </select>
        <input type="number" class="oi-qty cell-input" placeholder="돌릴 판수" style="width:100px" oninput="updateOrderTotal()" />
        <span class="oi-stock-info" style="font-size:11px;color:#888;min-width:60px;"></span>
        <button class="btn-del-row oi-del">✕</button>
      </div>
    `);
    bindOrderItemEvents();
  });

  document.getElementById('btnSaveOrderRow').addEventListener('click', async () => {
    const date = document.getElementById('m_date').value;
    const items = Array.from(document.querySelectorAll('.order-item')).map(row => ({
      productName: row.querySelector('.oi-name').value.trim(),
      orderPanQty: parseInt(row.querySelector('.oi-qty').value) || 0,
    })).filter(i => i.productName);

    if (!date || items.length === 0) { alert('날짜와 제품을 입력해주세요.'); return; }
    if (await blockIfClosed(date)) return;

    // 재고 부족 검증 (저장 시점 차단)
    const shortages = [];
    for (const item of items) {
      const avail = stockByProduct[item.productName] || 0;
      if (item.orderPanQty > avail) {
        shortages.push(`${item.productName}: 재고 ${avail}판 / 발주 ${item.orderPanQty}판`);
      }
    }
    if (shortages.length > 0) {
      alert(`재고가 부족한 제품이 있습니다.\n\n${shortages.join('\n')}`);
      return;
    }

    await addDoc(collection(db, 'frozenPanStock'), {
      date, type: 'order', status: 'pending',
      items, createdAt: new Date(), updatedAt: new Date(),
    });

    closeModal();
    await refreshFrozenPanLayout();
    alert('발주 행 추가 완료!');
  });
}

function bindOrderItemEvents() {
  document.querySelectorAll('.oi-del').forEach(btn => {
    btn.onclick = () => { btn.closest('.order-item').remove(); updateOrderTotal(); };
  });
}

window.updateOrderItemMax = function(selectEl) {
  const stock = parseInt(selectEl.options[selectEl.selectedIndex]?.dataset?.stock || 0);
  const item = selectEl.closest('.order-item');
  const qtyInput = item.querySelector('.oi-qty');
  const stockInfo = item.querySelector('.oi-stock-info');

  qtyInput.max = stock;
  if (stockInfo) {
    stockInfo.textContent = stock > 0 ? `최대 ${stock}판` : '재고 없음';
    stockInfo.style.color = stock === 0 ? '#e53e3e' : '#888';
  }

  // 현재 입력값이 재고 초과면 빨간색
  qtyInput.oninput = () => {
    const v = parseInt(qtyInput.value) || 0;
    qtyInput.style.color = v > stock ? '#e53e3e' : '#1a1a1a';
    qtyInput.style.borderColor = v > stock ? '#e53e3e' : '#e0e0e0';
    updateOrderTotal();
  };
};

window.updateOrderTotal = function() {
  const total = Array.from(document.querySelectorAll('.oi-qty'))
    .reduce((sum, el) => sum + (parseInt(el.value) || 0), 0);
  const el = document.getElementById('orderTotal');
  if (el) {
    el.textContent = total;
    el.style.color = total === 45 ? '#2d7a3a' : total > 45 ? '#e53e3e' : '#e67e22';
  }
};

async function confirmOrder(row, lots) {
  const items = row.items || [];

  // 발주 확인 시점 재고 재검증 (등록 후 시간 경과로 재고 변동 가능)
  const shortages = [];
  for (const item of items) {
    const productLots = lots.filter(l => l.productName === item.productName);
    const totalAvail = productLots.reduce((sum, l) => sum + l.remaining, 0);
    if (item.orderPanQty > totalAvail) {
      shortages.push(`${item.productName}: 현재 재고 ${totalAvail}판 / 발주 ${item.orderPanQty}판`);
    }
  }
  if (shortages.length > 0) {
    alert(`재고가 부족하여 발주 확인할 수 없습니다.\n\n${shortages.join('\n')}\n\n발주를 삭제하거나 작업 행을 먼저 추가하세요.`);
    return;
  }

  // FIFO 차감 + ledger items 누적
  const ledgerItems = [];
  for (const item of items) {
    let remaining = item.orderPanQty;
    const productLots = lots
      .filter(l => l.productName === item.productName)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const lot of productLots) {
      if (remaining <= 0) break;
      const deduct = Math.min(lot.remaining, remaining);
      const before = lot.remaining;
      const after = before - deduct;
      const stockUpdatedAt = new Date();

      await updateDoc(doc(db, 'frozenPanLots', lot.id), {
        remaining: after,
        closed: after <= 0,
        updatedAt: stockUpdatedAt,
      });

      ledgerItems.push({
        collection: 'frozenPanLots',
        docId: lot.id,
        field: 'remaining',
        delta: -deduct,
        before,
        after,
        label: `${item.productName} (${lot.date || '-'})`,
        stockUpdatedAtSnapshot: stockUpdatedAt,
      });

      remaining -= deduct;
    }
  }

  // ledger 저장
  let ledgerId = null;
  if (ledgerItems.length > 0) {
    const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
      actionType: 'frozenPanOrder',
      actionId: row.id,
      timestamp: new Date(),
      date: row.date || '',
      status: 'active',
      items: ledgerItems,
    });
    ledgerId = ledgerRef.id;
  }

  await updateDoc(doc(db, 'frozenPanStock', row.id), {
    status: 'confirmed',
    ledgerId,
    confirmedAt: new Date(),
    updatedAt: new Date(),
  });

  // activityLogs 기록
  await addDoc(collection(db, 'activityLogs'), {
    type: 'office',
    subType: 'frozenPanOrderConfirm',
    date: row.date || '',
    timestamp: new Date(),
    title: `동결판 발주 확인 — ${(row.date || '')}`,
    description: items.map(it => `${it.productName} ${it.orderPanQty}판`).join(', '),
    acknowledged: true,
    actionId: row.id,
  });

  await refreshFrozenPanLayout();
  alert('발주 확인 완료!');
}

async function cancelOrder(row, lots) {
  const reason = prompt('발주 취소 사유를 입력해주세요:');
  if (!reason) return;

  // ledger 기반 정확 복원
  if (row.ledgerId) {
    const ledgerSnap = await getDoc(doc(db, 'stockLedger', row.ledgerId));
    if (ledgerSnap.exists() && ledgerSnap.data().status === 'active') {
      const ledgerItems = ledgerSnap.data().items || [];
      for (const item of ledgerItems) {
        const docSnap = await getDoc(doc(db, item.collection, item.docId));
        if (!docSnap.exists()) continue;
        const currentVal = docSnap.data()[item.field] || 0;

        if (currentVal !== item.after) {
          if (!confirm(`발주 확인 이후 ${item.label} 재고가 변경된 이력이 있습니다.\n발주 당시 차감분만 복원됩니다.\n강제 복원하시겠습니까?`)) continue;
        }

        const restoredVal = currentVal - item.delta;
        await updateDoc(doc(db, item.collection, item.docId), {
          [item.field]: restoredVal,
          closed: restoredVal <= 0,
          updatedAt: new Date(),
        });
      }
      await updateDoc(doc(db, 'stockLedger', row.ledgerId), {
        status: 'rolledBack',
        rolledBackAt: new Date(),
      });
    }
  } else {
    // fallback: ledger 없는 기존 데이터 — 옛 분배 로직 (lot capacity 무시) 그대로 사용
    const items = row.items || [];
    for (const item of items) {
      const productLots = lots
        .filter(l => l.productName === item.productName && l.sourceRowId)
        .sort((a, b) => b.date.localeCompare(a.date));

      let toRestore = item.orderPanQty;
      for (const lot of productLots) {
        if (toRestore <= 0) break;
        const restore = Math.min(item.orderPanQty, toRestore);
        await updateDoc(doc(db, 'frozenPanLots', lot.id), {
          remaining: lot.remaining + restore,
          closed: false,
          updatedAt: new Date(),
        });
        toRestore -= restore;
      }
    }
  }

  await updateDoc(doc(db, 'frozenPanStock', row.id), {
    status: 'pending',
    cancelReason: reason,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  });

  // activityLogs 기록
  const items = row.items || [];
  await addDoc(collection(db, 'activityLogs'), {
    type: 'office',
    subType: 'frozenPanOrderCancel',
    date: row.date || '',
    timestamp: new Date(),
    title: `동결판 발주 취소 — ${(row.date || '')}`,
    description: `${items.map(it => `${it.productName} ${it.orderPanQty}판`).join(', ')} / 사유: ${reason}`,
    acknowledged: false,
    actionId: row.id,
  });

  await refreshFrozenPanLayout();
  alert('발주 취소 완료!');
}

// 유틸

let staffCache = {};
async function loadStaffCache() {
  if (Object.keys(staffCache).length > 0) return;
  for (const key of ['senior', 'lead', 'office']) {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) staffCache[key] = snap.data().members || [];
  }
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

function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};