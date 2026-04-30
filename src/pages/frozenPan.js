import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';

let freezeDryRecipes = [];

export async function renderFrozenPan() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>동결판 재고 로딩 중...</p></div>`;
  freezeDryRecipes = await getActiveFreezeDryRecipes();
  await loadStaffCache();
  const rows = await loadFrozenPanRows();
  const lots = await loadFrozenPanLots();
  renderFrozenPanLayout(rows, lots);
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

function renderFrozenPanLayout(rows, lots) {
  const content = document.getElementById('mainContent');

  // 제품별 lot 집계
  const lotSummary = {};
  lots.forEach(l => {
    if (!lotSummary[l.productName]) lotSummary[l.productName] = [];
    lotSummary[l.productName].push({ date: l.date, remaining: l.remaining });
  });

  // 총 동결판
  const totalPan = lots.reduce((sum, l) => sum + l.remaining, 0);

  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결판 재고</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnAddOrderRow">+ 발주 행 추가</button>
          <button class="btn-primary" id="btnAddWorkRow">+ 작업 행 추가</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 총 동결판</span>
            <span class="stat-value" style="font-size:20px;color:${totalPan < 10 ? '#e53e3e' : '#1a1a1a'}">${totalPan}판</span>
          </div>
          ${Object.entries(lotSummary).map(([name, lotList]) => `
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
      </div>

      <!-- 테이블 -->
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
    </div>
  `;

  document.getElementById('btnAddWorkRow').addEventListener('click', () => showWorkRowModal(rows, lots));
  document.getElementById('btnAddOrderRow').addEventListener('click', () => showOrderRowModal(rows, lots));

  // 발주 확인 버튼
  document.querySelectorAll('.btn-order-confirm').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rowId = btn.dataset.id;
      const row = rows.find(r => r.id === rowId);
      if (row) await confirmOrder(row, lots);
      if (row && await blockIfClosed(row.date)) return;
    });
  });

  // 발주 삭제 버튼
  document.querySelectorAll('.btn-order-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('발주 행을 삭제하시겠습니까?')) return;
      const targetRow = rows.find(r => r.id === btn.dataset.id);
      if (targetRow && await blockIfClosed(targetRow.date)) return;
      await updateDoc(doc(db, 'frozenPanStock', btn.dataset.id), { status: 'cancelled' });
      const newRows = await loadFrozenPanRows();
      const newLots = await loadFrozenPanLots();
      renderFrozenPanLayout(newRows, newLots);
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
    const newRows = await loadFrozenPanRows();
    const newLots = await loadFrozenPanLots();
    renderFrozenPanLayout(newRows, newLots);
    alert('작업 행 추가 완료!');
  });
}

function bindWorkItemEvents() {
  document.querySelectorAll('.wi-del').forEach(btn => {
    btn.onclick = () => btn.closest('.work-item').remove();
  });
}

function showOrderRowModal(rows, lots) {
  showModal(`
    <h3 class="modal-title">발주 행 추가</h3>
    <div class="form-group">
      <label>날짜 (동결건조 돌리는 날짜)</label>
      <input type="date" id="m_date" value="${getToday()}" min="${getToday()}" />
    </div>
    <div id="orderItems">
      <div class="order-item" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
        <select class="oi-name cell-input" style="flex:1">${getRecipeOptionsHtml(freezeDryRecipes)}</select>
        <input type="number" class="oi-qty cell-input" placeholder="돌릴 판수" style="width:100px" oninput="updateOrderTotal()" />
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
        <select class="oi-name cell-input" style="flex:1">${getRecipeOptionsHtml(freezeDryRecipes)}</select>
        <input type="number" class="oi-qty cell-input" placeholder="돌릴 판수" style="width:100px" oninput="updateOrderTotal()" />
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

    await addDoc(collection(db, 'frozenPanStock'), {
      date, type: 'order', status: 'pending',
      items, createdAt: new Date(), updatedAt: new Date(),
    });

    closeModal();
    const newRows = await loadFrozenPanRows();
    const newLots = await loadFrozenPanLots();
    renderFrozenPanLayout(newRows, newLots);
    alert('발주 행 추가 완료!');
  });
}

function bindOrderItemEvents() {
  document.querySelectorAll('.oi-del').forEach(btn => {
    btn.onclick = () => { btn.closest('.order-item').remove(); updateOrderTotal(); };
  });
}

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
  for (const item of items) {
    let remaining = item.orderPanQty;
    const productLots = lots
      .filter(l => l.productName === item.productName)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const lot of productLots) {
      if (remaining <= 0) break;
      const deduct = Math.min(lot.remaining, remaining);
      await updateDoc(doc(db, 'frozenPanLots', lot.id), {
        remaining: lot.remaining - deduct,
        closed: lot.remaining - deduct <= 0,
        updatedAt: new Date(),
      });
      remaining -= deduct;
    }
  }

  await updateDoc(doc(db, 'frozenPanStock', row.id), {
    status: 'confirmed', updatedAt: new Date(),
  });

  const newRows = await loadFrozenPanRows();
  const newLots = await loadFrozenPanLots();
  renderFrozenPanLayout(newRows, newLots);
  alert('발주 확인 완료!');
}

async function cancelOrder(row, lots) {
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

  await updateDoc(doc(db, 'frozenPanStock', row.id), {
    status: 'pending', updatedAt: new Date(),
  });

  const newRows = await loadFrozenPanRows();
  const newLots = await loadFrozenPanLots();
  renderFrozenPanLayout(newRows, newLots);
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