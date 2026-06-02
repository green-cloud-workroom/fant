import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc, writeBatch
} from 'firebase/firestore';
import { currentUserRole } from '../app.js';
import { getTodayKST as getToday } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { showConfirmModal } from '../utils/modal.js';
import { recordActivity } from '../services/activityLogs.js';

let freezeDryRecipes = [];
const QTY_EPSILON = 0.000001;

export async function renderFrozenSep() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>동결 분리작업 로딩 중...</p></div>`;
  await loadStaffCache();
  freezeDryRecipes = await getActiveFreezeDryRecipes();
  const stocks = await loadFrozenSepStocks();
  renderFrozenSepLayout(stocks);
}

async function loadFrozenSepStocks() {
  const q = query(collection(db, 'frozenSeparation'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.closed);
}

function getSummary(stocks) {
  const summary = {};
  stocks.forEach(s => {
    if (!summary[s.productName]) {
      summary[s.productName] = { notSeparated: 0, separated: 0, noSplit: 0 };
    }
    summary[s.productName][s.stockType] += Number(s.remaining || 0);
  });
  return summary;
}

function normalizeQty(qty) {
  return Math.round((Number(qty) || 0) * 1000000) / 1000000;
}

function formatQty(qty) {
  return normalizeQty(qty).toLocaleString('ko-KR', {
    maximumFractionDigits: 3,
  });
}

function parseQtyInput(id = 'm_qty') {
  const qty = Number(document.getElementById(id).value);
  return Number.isFinite(qty) ? qty : NaN;
}

function canDeleteFrozenSepStock() {
  return currentUserRole === 'admin' || currentUserRole === 'office';
}

function getStockTypeLabel(stockType) {
  if (stockType === 'notSeparated') return '분리X';
  if (stockType === 'separated') return '분리O';
  return '소분X';
}

function getStockTypeTagClass(stockType) {
  if (stockType === 'notSeparated') return 'tag-cat';
  if (stockType === 'separated') return 'tag-raw';
  return 'tag-freezeDry';
}

function renderFrozenSepLayout(stocks) {
  const content = document.getElementById('mainContent');
  const summary = getSummary(stocks);
  const canDelete = canDeleteFrozenSepStock();

  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결 분리작업</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnAdjust">수동 조정</button>
          <button class="btn-secondary" id="btnOut">출고</button>
          <button class="btn-secondary" id="btnSeparate">분리 작업</button>
          <button class="btn-primary" id="btnIncoming">+ 원물 입고</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          ${Object.entries(summary).length === 0 ? '<span style="color:#aaa;font-size:13px">재고 없음</span>' :
            Object.entries(summary).map(([name, s]) => `
              <div>
                <div style="font-size:12px;font-weight:600;color:#333;margin-bottom:6px;">${name}</div>
                ${s.notSeparated > 0 ? `<div style="font-size:11px;color:#666">분리X: ${formatQty(s.notSeparated)}개</div>` : ''}
                ${s.separated > 0 ? `<div style="font-size:11px;color:#2d7a3a">분리O: ${formatQty(s.separated)}개</div>` : ''}
                ${s.noSplit > 0 ? `<div style="font-size:11px;color:#2d4a8a">소분X: ${formatQty(s.noSplit)}개</div>` : ''}
              </div>
            `).join('')}
        </div>
      </div>

      <!-- 테이블 -->
      <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>제품명</th>
              <th>재고 종류</th>
              <th>수량</th>
              <th>담당자</th>
              <th>비고</th>
              ${canDelete ? '<th>작업</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ?
              `<tr><td colspan="${canDelete ? 7 : 6}" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr>
                  <td>${s.date}</td>
                  <td>${s.productName}</td>
                  <td>
                    <span class="tag ${getStockTypeTagClass(s.stockType)}">
                      ${getStockTypeLabel(s.stockType)}
                    </span>
                  </td>
                  <td style="font-weight:600">${formatQty(s.remaining)}개</td>
                  <td>${s.staffName || '-'}</td>
                  <td>${s.note || '-'}</td>
                  ${canDelete ? `
                    <td>
                      <button class="btn-del-row btnDeleteFrozenSep" data-id="${s.id}">삭제</button>
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnIncoming').addEventListener('click', () => showIncomingModal(stocks));
  document.getElementById('btnSeparate').addEventListener('click', () => showSeparateModal(stocks));
  document.getElementById('btnOut').addEventListener('click', () => showOutModal(stocks));
  document.getElementById('btnAdjust').addEventListener('click', () => showAdjustModal(stocks));
  document.querySelectorAll('.btnDeleteFrozenSep').forEach(btn => {
    btn.addEventListener('click', () => {
      const stock = stocks.find(s => s.id === btn.dataset.id);
      if (stock) deleteFrozenSepStock(stock);
    });
  });
}

async function deleteFrozenSepStock(stock) {
  if (!canDeleteFrozenSepStock()) {
    alert('삭제 권한이 없습니다.');
    return;
  }

  if (await blockIfClosed(stock.date)) return;

  const initialQty = Number(stock.initialQty || 0);
  const remainingQty = Number(stock.remaining || 0);
  if (remainingQty <= 0) {
    alert('삭제할 남은 수량이 없습니다.');
    return;
  }
  if (Math.abs(initialQty - remainingQty) > QTY_EPSILON) {
    alert('이미 일부 사용된 항목은 바로 삭제할 수 없습니다.\n관련 출고/분리 작업을 먼저 되돌리거나 수동 조정을 사용해주세요.');
    return;
  }

  const staff = window.prompt('삭제 담당자 이름을 입력해주세요.');
  if (!staff || !staff.trim()) return;

  const stockTypeLabel = getStockTypeLabel(stock.stockType);
  const ok = await showConfirmModal({
    title: '동결 분리작업 삭제',
    message: `${stock.productName} / ${stockTypeLabel} / ${formatQty(remainingQty)}개 항목을 삭제합니다.\n잘못 입력한 항목일 때만 진행해주세요.`,
    confirmText: '삭제',
    cancelText: '취소',
    danger: true,
  });
  if (!ok) return;

  const batch = writeBatch(db);
  const stockRef = doc(db, 'frozenSeparation', stock.id);
  const logRef = doc(collection(db, 'frozenSeparationLogs'));
  const now = new Date();
  const deleteStaff = staff.trim();

  batch.update(stockRef, {
    remaining: 0,
    closed: true,
    status: 'deleted',
    deletedAt: now,
    deletedBy: deleteStaff,
    updatedAt: now,
  });
  batch.set(logRef, {
    date: getToday(),
    timestamp: now,
    type: 'delete',
    productName: stock.productName,
    fromStockType: stock.stockType,
    qty: -remainingQty,
    staffName: deleteStaff,
    note: 'wrong input delete',
    sourceStockId: stock.id,
  });

  await batch.commit();

  await recordActivity({
    action: 'frozenSep',
    subAction: 'delete',
    date: getToday(),
    staff: deleteStaff,
    message: `동결 분리작업 삭제 — ${stock.productName} ${formatQty(remainingQty)}개 (${stockTypeLabel}) / 담당: ${deleteStaff}`,
    details: {
      frozenSeparationId: stock.id,
      productName: stock.productName,
      qty: remainingQty,
      stockType: stock.stockType,
      note: stock.note || null,
    },
  });

  const newStocks = await loadFrozenSepStocks();
  renderFrozenSepLayout(newStocks);
  alert('삭제 완료!');
}

function showIncomingModal(stocks) {
  showModal(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name" onchange="updateSepGuide()">${getRecipeOptionsHtml(freezeDryRecipes)}</select>
    </div>
    <!-- [묶음 5C] 분리 필요/불필요 운영자 입력 제거 → 레시피 설정으로 자동 결정 + 안내 표시 -->
    <div class="form-group" id="m_sepGuide" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:13px;color:#555;">
      제품을 선택하면 자동으로 결정됩니다.
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
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
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `);

  // [묶음 5C] 제품 선택 시 안내 텍스트 자동 업데이트
  // freezeDryRecipes에서 displayName으로 찾아서 requiresSeparation 보고 결정
  window.updateSepGuide = function() {
    const name = document.getElementById('m_name').value;
    const guideEl = document.getElementById('m_sepGuide');
    if (!name) {
      guideEl.innerHTML = '제품을 선택하면 자동으로 결정됩니다.';
      guideEl.style.color = '#555';
      return;
    }
    const recipe = freezeDryRecipes.find(r => r.displayName === name);
    if (!recipe) {
      guideEl.innerHTML = '⚠️ 레시피를 찾을 수 없습니다.';
      guideEl.style.color = '#c0392b';
      return;
    }
    if (recipe.requiresSeparation) {
      guideEl.innerHTML = `📌 이 제품은 <b>분리 작업이 필요</b>합니다 → <b style="color:#c0392b;">분리X</b>로 입고됩니다.`;
      guideEl.style.color = '#555';
    } else {
      guideEl.innerHTML = `📌 이 제품은 분리 작업이 불필요합니다 → <b style="color:#2d4a8a;">소분X</b>로 입고됩니다.`;
      guideEl.style.color = '#555';
    }
  };
  // 초기 1회 호출 (첫 옵션이 placeholder면 비고, 자동 선택된 게 있으면 안내 표시)
  updateSepGuide();

  document.getElementById('btnSaveIncoming').addEventListener('click', async () => {
    const name = document.getElementById('m_name').value.trim();
    const qty = parseQtyInput();
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!name || !Number.isFinite(qty) || qty <= 0 || !date) { alert('제품명, 수량, 날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    // [묶음 5C] 분리 필요 여부 자동 결정 (운영자 입력 대신 레시피 설정 사용)
    const recipe = freezeDryRecipes.find(r => r.displayName === name);
    if (!recipe) { alert('레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.'); return; }
    const sepNeeded = recipe.requiresSeparation === true;

    const stockType = sepNeeded ? 'notSeparated' : 'noSplit';
    const stockTypeLabel = sepNeeded ? '분리X' : '소분X';

    const sepRef = await addDoc(collection(db, 'frozenSeparation'), {
      date, productName: name,
      stockType,
      initialQty: qty, remaining: qty,
      staffName: staff, note, closed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    await addDoc(collection(db, 'frozenSeparationLogs'), {
      date, timestamp: new Date(),
      type: 'incoming', productName: name,
      toStockType: stockType,
      qty, staffName: staff, note,
    });

    // [묶음 5A] 사무 로그 발행 — 분리작업 원물 입고
    await recordActivity({
      action: 'frozenSep',
      subAction: 'incoming',
      date,
      staff,
      message: `분리작업 입고 — ${name} +${formatQty(qty)}개 (${stockTypeLabel}) / 담당: ${staff}`,
      details: {
        frozenSeparationId: sepRef.id,
        productName: name,
        qty,
        stockType,
        sepNeeded,
        autoDecided: true,  // [묶음 5C] 자동 결정 표시
        note: note || null,
      },
    });

    closeModal();
    const newStocks = await loadFrozenSepStocks();
    renderFrozenSepLayout(newStocks);
    alert('입고 완료!');
  });
}

function showSeparateModal(stocks) {
  const notSepStocks = stocks.filter(s => s.stockType === 'notSeparated');
  const products = [...new Set(notSepStocks.map(s => s.productName))];

  showModal(`
    <h3 class="modal-title">분리 작업</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${products.map(p => {
          const total = notSepStocks
            .filter(s => s.productName === p)
            .reduce((sum, s) => sum + Number(s.remaining || 0), 0);
          return `<option value="${p}">${p} (분리X: ${formatQty(total)}개)</option>`;
        }).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
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
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSeparate">작업 완료</button>
    </div>
  `);

  document.getElementById('btnSaveSeparate').addEventListener('click', async () => {
    const productName = document.getElementById('m_product').value;
    const qty = parseQtyInput();
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;

    if (!productName || !Number.isFinite(qty) || qty <= 0 || !date) { alert('제품, 수량, 날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    const productStocks = notSepStocks
      .filter(s => s.productName === productName)
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalAvail = productStocks.reduce((sum, s) => sum + Number(s.remaining || 0), 0);

    if (qty - totalAvail > QTY_EPSILON) { alert(`분리X 재고가 부족합니다. (현재: ${formatQty(totalAvail)}개)`); return; }

    // FIFO 차감
    let remaining = qty;
    for (const s of productStocks) {
      if (remaining <= 0) break;
      const currentRemaining = Number(s.remaining || 0);
      const deduct = Math.min(currentRemaining, remaining);
      const after = normalizeQty(currentRemaining - deduct);
      await updateDoc(doc(db, 'frozenSeparation', s.id), {
        remaining: after,
        closed: after <= QTY_EPSILON,
        updatedAt: new Date(),
      });
      remaining = normalizeQty(remaining - deduct);
    }

    // 분리O 추가
    const sepRef = await addDoc(collection(db, 'frozenSeparation'), {
      date, productName,
      stockType: 'separated',
      initialQty: qty, remaining: qty,
      staffName: staff, note: '', closed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    await addDoc(collection(db, 'frozenSeparationLogs'), {
      date, timestamp: new Date(),
      type: 'separate', productName,
      fromStockType: 'notSeparated',
      toStockType: 'separated',
      qty, staffName: staff,
    });

    // [묶음 5A] 사무 로그 발행 — 분리 작업 (분리X → 분리O 전환)
    await recordActivity({
      action: 'frozenSep',
      subAction: 'separate',
      date,
      staff,
      message: `분리 작업 — ${productName} ${formatQty(qty)}개 (분리X → 분리O) / 담당: ${staff}`,
      details: {
        newSeparatedId: sepRef.id,
        productName,
        qty,
        fromStockType: 'notSeparated',
        toStockType: 'separated',
      },
    });

    closeModal();
    const newStocks = await loadFrozenSepStocks();
    renderFrozenSepLayout(newStocks);
    alert('분리 작업 완료!');
  });
}

function showOutModal(stocks) {
  const outStocks = stocks.filter(s => s.stockType === 'separated' || s.stockType === 'noSplit');
  const products = [...new Set(outStocks.map(s => s.productName))];

  showModal(`
    <h3 class="modal-title">출고</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product" onchange="updateOutType()">
        <option value="">선택</option>
        ${products.map(p => `<option value="${p}">${p}</option>`).join('')}
      </select>
    </div>
    <!-- [묶음 5C] 재고 종류 운영자 입력 제거 → 레시피 설정으로 자동 결정 + 재고 안내 -->
    <div class="form-group" id="m_outGuide" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:13px;color:#555;">
      제품을 선택하면 자동으로 결정됩니다.
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
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
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOut">출고</button>
    </div>
  `);

  // [묶음 5C] 출고 재고 종류 자동 결정 + 안내 표시
  // 분리 필요 제품 → 분리O 재고에서 출고 / 분리 불필요 제품 → 소분X 재고에서 출고
  window.updateOutType = function() {
    const productName = document.getElementById('m_product').value;
    const guideEl = document.getElementById('m_outGuide');
    if (!productName) {
      guideEl.innerHTML = '제품을 선택하면 자동으로 결정됩니다.';
      guideEl.style.color = '#555';
      return;
    }
    const recipe = freezeDryRecipes.find(r => r.displayName === productName);
    if (!recipe) {
      guideEl.innerHTML = '⚠️ 레시피를 찾을 수 없습니다.';
      guideEl.style.color = '#c0392b';
      return;
    }
    const stockType = recipe.requiresSeparation ? 'separated' : 'noSplit';
    const stockTypeLabel = recipe.requiresSeparation ? '분리O' : '소분X';
    const labelColor = recipe.requiresSeparation ? '#2d7a3a' : '#2d4a8a';

    // 해당 재고 종류 잔량 계산 (사전 경고용)
    const avail = outStocks
      .filter(s => s.productName === productName && s.stockType === stockType)
      .reduce((sum, s) => sum + Number(s.remaining || 0), 0);

    if (avail <= QTY_EPSILON) {
      const hint = recipe.requiresSeparation
        ? '먼저 분리 작업이 필요합니다.'
        : '소분X 재고가 없습니다.';
      guideEl.innerHTML = `⚠️ <b style="color:${labelColor};">${stockTypeLabel}</b> 재고 없음 — ${hint}`;
      guideEl.style.color = '#c0392b';
    } else {
      guideEl.innerHTML = `📌 <b style="color:${labelColor};">${stockTypeLabel}</b> 재고에서 출고됩니다 (현재 ${formatQty(avail)}개 보유)`;
      guideEl.style.color = '#555';
    }
  };
  updateOutType();

  document.getElementById('btnSaveOut').addEventListener('click', async () => {
    const productName = document.getElementById('m_product').value;
    const qty = parseQtyInput();
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;

    if (!productName || !Number.isFinite(qty) || qty <= 0 || !date) { alert('제품, 수량, 날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    // [묶음 5C] 재고 종류 자동 결정 (운영자 입력 대신 레시피 설정 사용)
    const recipe = freezeDryRecipes.find(r => r.displayName === productName);
    if (!recipe) { alert('레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.'); return; }
    const stockType = recipe.requiresSeparation ? 'separated' : 'noSplit';
    const stockTypeLabel = recipe.requiresSeparation ? '분리O' : '소분X';

    const targetStocks = outStocks
      .filter(s => s.productName === productName && s.stockType === stockType)
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalAvail = targetStocks.reduce((sum, s) => sum + Number(s.remaining || 0), 0);

    if (qty - totalAvail > QTY_EPSILON) {
      const hint = recipe.requiresSeparation
        ? '\n\n분리 작업을 먼저 진행해주세요.'
        : '';
      alert(`${stockTypeLabel} 재고가 부족합니다. (현재: ${formatQty(totalAvail)}개)${hint}`);
      return;
    }

    let remaining = qty;
    for (const s of targetStocks) {
      if (remaining <= 0) break;
      const currentRemaining = Number(s.remaining || 0);
      const deduct = Math.min(currentRemaining, remaining);
      const after = normalizeQty(currentRemaining - deduct);
      await updateDoc(doc(db, 'frozenSeparation', s.id), {
        remaining: after,
        closed: after <= QTY_EPSILON,
        updatedAt: new Date(),
      });
      remaining = normalizeQty(remaining - deduct);
    }

    await addDoc(collection(db, 'frozenSeparationLogs'), {
      date, timestamp: new Date(),
      type: 'out', productName,
      fromStockType: stockType,
      qty, staffName: staff,
    });

    // [묶음 5A] 사무 로그 발행 — 분리작업 출고
    await recordActivity({
      action: 'frozenSep',
      subAction: 'out',
      date,
      staff,
      message: `분리작업 출고 — ${productName} -${formatQty(qty)}개 (${stockTypeLabel}) / 담당: ${staff}`,
      details: {
        productName,
        qty,
        fromStockType: stockType,
        autoDecided: true,  // [묶음 5C] 자동 결정 표시
      },
    });

    closeModal();
    const newStocks = await loadFrozenSepStocks();
    renderFrozenSepLayout(newStocks);
    alert('출고 완료!');
  });
}

function showAdjustModal(stocks) {
  const products = [...new Set(stocks.map(s => s.productName))];

  showModal(`
    <h3 class="modal-title">수동 조정</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${products.map(p => `<option value="${p}">${p}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>재고 종류 *</label>
      <select id="m_stockType">
        <option value="notSeparated">분리X</option>
        <option value="separated">분리O</option>
        <option value="noSplit">소분X</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량(개) *</label>
        <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
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
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);

  document.getElementById('btnSaveAdjust').addEventListener('click', async () => {
    const productName = document.getElementById('m_product').value;
    const stockType = document.getElementById('m_stockType').value;
    const adjustType = document.getElementById('m_adjustType').value;
    const qty = parseQtyInput();
    const reason = document.getElementById('m_reason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (!productName || !Number.isFinite(qty) || qty <= 0 || !reason || !staff) { alert('모든 필수 항목을 입력해주세요.'); return; }
    const today = getToday();
    if (await blockIfClosed(today)) return;

    const delta = adjustType === 'plus' ? qty : -qty;
    const targetStocks = stocks
      .filter(s => s.productName === productName && s.stockType === stockType)
      .sort((a, b) => a.date.localeCompare(b.date));

    // [음수 차단] 기존 lot이 있으면 그 lot의 잔량 + delta가 음수면 차단.
    // 신규 생성 분기는 마이너스로 신규 생성 자체를 차단해야 함.
    if (targetStocks.length > 0) {
      const s = targetStocks[0];
      const currentRemaining = Number(s.remaining || 0);
      const after = normalizeQty(currentRemaining + delta);
      if (after < -QTY_EPSILON) {
        alert(`조정 후 잔량이 ${formatQty(after)}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${formatQty(currentRemaining)}개에서 최대 ${formatQty(currentRemaining)}개까지만 감소 가능합니다.`);
        return;
      }
      await updateDoc(doc(db, 'frozenSeparation', s.id), {
        remaining: after,
        closed: after <= QTY_EPSILON,
        updatedAt: new Date(),
      });
    } else {
      // 기존 lot 없는데 마이너스 조정 → 음수로 신규 생성 시도 → 차단
      if (delta < 0) {
        alert(`해당 제품/구분의 재고가 없습니다.\n수동조정으로 음수 재고를 만들 수 없습니다.`);
        return;
      }
      await addDoc(collection(db, 'frozenSeparation'), {
        date: getToday(), productName, stockType,
        initialQty: delta, remaining: delta,
        staffName: staff, note: reason, closed: false,
        createdAt: new Date(), updatedAt: new Date(),
      });
    }

    await addDoc(collection(db, 'frozenSeparationLogs'), {
      date: getToday(), timestamp: new Date(),
      type: 'adjust', productName,
      fromStockType: stockType,
      qty: delta, staffName: staff, reason,
    });
    
    const stockTypeLabel = getStockTypeLabel(stockType);
    const sign = delta >= 0 ? '+' : '';
    await recordActivity({
      action: 'frozenSep',
      subAction: 'adjust',
      date: today,
      staff,
      message: `동결 분리작업 수동조정 — ${productName} (${stockTypeLabel}) ${sign}${formatQty(delta)}개 / 사유: ${reason} / 담당: ${staff}`,
      details: {
        productName,
        stockType,
        delta,
        reason,
      },
    });

    closeModal();
    const newStocks = await loadFrozenSepStocks();
    renderFrozenSepLayout(newStocks);
    alert('조정 완료!');
  });
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
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
