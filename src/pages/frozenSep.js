import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { recordActivity } from '../services/activityLogs.js';

let freezeDryRecipes = [];

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
    summary[s.productName][s.stockType] += s.remaining;
  });
  return summary;
}

function renderFrozenSepLayout(stocks) {
  const content = document.getElementById('mainContent');
  const summary = getSummary(stocks);

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
                ${s.notSeparated > 0 ? `<div style="font-size:11px;color:#666">분리X: ${s.notSeparated}개</div>` : ''}
                ${s.separated > 0 ? `<div style="font-size:11px;color:#2d7a3a">분리O: ${s.separated}개</div>` : ''}
                ${s.noSplit > 0 ? `<div style="font-size:11px;color:#2d4a8a">소분X: ${s.noSplit}개</div>` : ''}
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
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ?
              `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr>
                  <td>${s.date}</td>
                  <td>${s.productName}</td>
                  <td>
                    <span class="tag ${s.stockType === 'notSeparated' ? 'tag-cat' : s.stockType === 'separated' ? 'tag-raw' : 'tag-freezeDry'}">
                      ${s.stockType === 'notSeparated' ? '분리X' : s.stockType === 'separated' ? '분리O' : '소분X'}
                    </span>
                  </td>
                  <td style="font-weight:600">${s.remaining}개</td>
                  <td>${s.staffName || '-'}</td>
                  <td>${s.note || '-'}</td>
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
}

function showIncomingModal(stocks) {
  showModal(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name">${getRecipeOptionsHtml(freezeDryRecipes)}</select>
    </div>
    <div class="form-group">
      <label>분리작업 필요 여부</label>
      <select id="m_sepNeeded">
        <option value="true">분리 필요 (분리X로 입고)</option>
        <option value="false">분리 불필요 (소분X로 입고)</option>
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수" />
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

  document.getElementById('btnSaveIncoming').addEventListener('click', async () => {
    const name = document.getElementById('m_name').value.trim();
    const sepNeeded = document.getElementById('m_sepNeeded').value === 'true';
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!name || !qty || !date) { alert('제품명, 수량, 날짜는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    await addDoc(collection(db, 'frozenSeparation'), {
      date, productName: name,
      stockType: sepNeeded ? 'notSeparated' : 'noSplit',
      initialQty: qty, remaining: qty,
      staffName: staff, note, closed: false,
      createdAt: new Date(), updatedAt: new Date(),
    });

    await addDoc(collection(db, 'frozenSeparationLogs'), {
      date, timestamp: new Date(),
      type: 'incoming', productName: name,
      toStockType: sepNeeded ? 'notSeparated' : 'noSplit',
      qty, staffName: staff, note,
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
          const total = notSepStocks.filter(s => s.productName === p).reduce((sum, s) => sum + s.remaining, 0);
          return `<option value="${p}">${p} (분리X: ${total}개)</option>`;
        }).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="분리할 개수" />
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
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;

    if (!productName || !qty || !date) { alert('제품, 수량, 날짜는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    const productStocks = notSepStocks
      .filter(s => s.productName === productName)
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalAvail = productStocks.reduce((sum, s) => sum + s.remaining, 0);

    if (qty > totalAvail) { alert(`분리X 재고가 부족합니다. (현재: ${totalAvail}개)`); return; }

    // FIFO 차감
    let remaining = qty;
    for (const s of productStocks) {
      if (remaining <= 0) break;
      const deduct = Math.min(s.remaining, remaining);
      await updateDoc(doc(db, 'frozenSeparation', s.id), {
        remaining: s.remaining - deduct,
        closed: s.remaining - deduct <= 0,
        updatedAt: new Date(),
      });
      remaining -= deduct;
    }

    // 분리O 추가
    await addDoc(collection(db, 'frozenSeparation'), {
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
    <div class="form-group">
      <label>재고 종류 *</label>
      <select id="m_stockType">
        <option value="">선택</option>
        <option value="separated">분리O</option>
        <option value="noSplit">소분X</option>
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수" />
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

  document.getElementById('btnSaveOut').addEventListener('click', async () => {
    const productName = document.getElementById('m_product').value;
    const stockType = document.getElementById('m_stockType').value;
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;

    if (!productName || !stockType || !qty || !date) { alert('모든 필수 항목을 입력해주세요.'); return; }
    if (await blockIfClosed(date)) return;

    const targetStocks = outStocks
      .filter(s => s.productName === productName && s.stockType === stockType)
      .sort((a, b) => a.date.localeCompare(b.date));
    const totalAvail = targetStocks.reduce((sum, s) => sum + s.remaining, 0);

    if (qty > totalAvail) { alert(`재고가 부족합니다. (현재: ${totalAvail}개)`); return; }

    let remaining = qty;
    for (const s of targetStocks) {
      if (remaining <= 0) break;
      const deduct = Math.min(s.remaining, remaining);
      await updateDoc(doc(db, 'frozenSeparation', s.id), {
        remaining: s.remaining - deduct,
        closed: s.remaining - deduct <= 0,
        updatedAt: new Date(),
      });
      remaining -= deduct;
    }

    await addDoc(collection(db, 'frozenSeparationLogs'), {
      date, timestamp: new Date(),
      type: 'out', productName,
      fromStockType: stockType,
      qty, staffName: staff,
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
        <input type="number" id="m_qty" placeholder="개수" />
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
    const qty = parseInt(document.getElementById('m_qty').value);
    const reason = document.getElementById('m_reason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (!productName || !qty || !reason || !staff) { alert('모든 필수 항목을 입력해주세요.'); return; }
    const today = getToday();
    if (await blockIfClosed(today)) return;

    const delta = adjustType === 'plus' ? qty : -qty;
    const targetStocks = stocks
      .filter(s => s.productName === productName && s.stockType === stockType)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (targetStocks.length > 0) {
      const s = targetStocks[0];
      await updateDoc(doc(db, 'frozenSeparation', s.id), {
        remaining: s.remaining + delta,
        closed: s.remaining + delta <= 0,
        updatedAt: new Date(),
      });
    } else {
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
    
    const stockTypeLabel = stockType === 'notSeparated' ? '분리X' : stockType === 'separated' ? '분리O' : '소분X';
    const sign = delta >= 0 ? '+' : '';
    await recordActivity({
      action: 'frozenSep',
      subAction: 'adjust',
      date: today,
      staff,
      message: `동결 분리작업 수동조정 — ${productName} (${stockTypeLabel}) ${sign}${delta}개 / 사유: ${reason} / 담당: ${staff}`,
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
    if (e.target === overlay) closeModal();
  });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};