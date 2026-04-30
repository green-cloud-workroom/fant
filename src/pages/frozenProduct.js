import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';

let frozenProducts = [];
let selectedProductId = null;

export async function renderFrozenProduct() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>동결제품 입고 로딩 중...</p></div>`;
  await loadStaffCache();
  frozenProducts = await loadFrozenProducts();
  renderFrozenProductLayout();
}

async function loadFrozenProducts() {
  const q = query(collection(db, 'frozenProducts'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadFrozenLogs(productId) {
  const q = query(collection(db, 'frozenLogs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(l => l.productId === productId && l.status !== 'deleted')
    .slice(0, 30);
}

function renderFrozenProductLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          <button class="btn-primary" id="btnNewProduct">+ 추가</button>
        </div>
        <div class="recipe-list" id="productList">
          ${renderProductList()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `;

  bindProductListEvents();
  document.getElementById('btnNewProduct').addEventListener('click', showNewProductModal);
}

function renderProductList() {
  if (frozenProducts.length === 0) return '<div class="list-empty">등록된 제품 없음</div>';
  return frozenProducts
    .filter(p => p.active !== false)
    .map(p => `
      <div class="recipe-list-item ${selectedProductId === p.id ? 'active' : ''}" data-id="${p.id}">
        <div class="recipe-list-info">
          <span class="recipe-name">${p.name}</span>
          <div class="recipe-tags">
            <span style="font-size:11px;color:#888">${p.recipeTitleRef || '-'}</span>
          </div>
        </div>
      </div>
    `).join('');
}

function bindProductListEvents() {
  document.querySelectorAll('.recipe-list-item').forEach(item => {
    item.addEventListener('click', async () => {
      selectedProductId = item.dataset.id;
      document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const product = frozenProducts.find(p => p.id === selectedProductId);
      await showProductDetail(product);
    });
  });
}

async function showProductDetail(product) {
  const detail = document.getElementById('productDetail');
  const logs = await loadFrozenLogs(product.id);

  // 연결 봉투 정보
  let bagName = '-';
  if (product.bagTypeId) {
    const bagSnap = await getDoc(doc(db, 'bagTypes', product.bagTypeId));
    if (bagSnap.exists()) bagName = bagSnap.data().name;
  }

  detail.innerHTML = `
    <div class="detail-header">
      <span class="detail-title">${product.name}</span>
      <div class="detail-actions">
        <button class="btn-secondary" id="btnEditProduct">수정</button>
        <button class="btn-primary" id="btnAddIncoming">+ 입고 등록</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 제품 정보 -->
      <div class="form-section">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">연결 레시피</span>
            <span class="stat-value">${product.recipeTitleRef || '-'}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">연결 봉투</span>
            <span class="stat-value">${bagName}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">분리작업</span>
            <span class="stat-value">${product.requiresSeparation ? '필요' : '불필요'}</span>
          </div>
        </div>
      </div>

      <!-- 입고 이력 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>유통기한</th>
                <th>수량(개)</th>
                <th>차감봉투(장)</th>
                <th>담당자</th>
                <th>비고</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
                logs.map(l => `
                  <tr>
                    <td>${l.date || '-'}</td>
                    <td>${l.expiryDate || '-'}</td>
                    <td>${l.qty}</td>
                    <td>${l.deductedBagQty || '-'}</td>
                    <td>${l.staffName || '-'}</td>
                    <td>${l.note || '-'}</td>
                    <td>
                      <button class="btn-del-row" data-logid="${l.id}" data-qty="${l.qty}" data-bagqty="${l.deductedBagQty || 0}" data-bagid="${product.bagTypeId || ''}">삭제</button>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnAddIncoming').addEventListener('click', () => showIncomingModal(product));
  document.getElementById('btnEditProduct').addEventListener('click', () => showEditProductModal(product));

  document.querySelectorAll('.btn-del-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('삭제하시겠습니까? 차감된 봉투 재고가 복원됩니다.')) return;
      const logId = btn.dataset.logid;
      const bagId = btn.dataset.bagid;
      const bagQty = parseInt(btn.dataset.bagqty) || 0;

      await updateDoc(doc(db, 'frozenLogs', logId), { status: 'deleted' });

      if (bagId && bagQty > 0) {
        const bagSnap = await getDoc(doc(db, 'bagTypes', bagId));
        if (bagSnap.exists()) {
          const current = bagSnap.data().currentQty || 0;
          await updateDoc(doc(db, 'bagTypes', bagId), { currentQty: current + bagQty });
        }
      }

      await showProductDetail(product);
      alert('삭제 완료!');
    });
  });
}

function showNewProductModal() {
  showProductModal(null);
}

function showEditProductModal(product) {
  showProductModal(product);
}

async function showProductModal(product) {
  const isNew = !product;

  // 봉투 목록 로드
  const bagSnap = await getDocs(query(collection(db, 'bagTypes'), orderBy('sortOrder')));
  const bags = bagSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(b => b.category === 'freezeDry');
  const recipes = await getActiveFreezeDryRecipes();

  showModal(`
    <h3 class="modal-title">${isNew ? '동결제품 추가' : '동결제품 수정'}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name">
        ${getRecipeOptionsHtml(recipes, product?.name || '')}
      </select>
    </div>
    <div class="form-group">
      <label>연결 봉투 *</label>
      <select id="m_bagType">
        <option value="">선택</option>
        ${bags.map(b => `<option value="${b.id}" ${product?.bagTypeId === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>분리작업 필요</label>
      <select id="m_separation">
        <option value="false" ${!product?.requiresSeparation ? 'selected' : ''}>아니오</option>
        <option value="true" ${product?.requiresSeparation ? 'selected' : ''}>예</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${isNew ? '추가' : '저장'}</button>
    </div>
  `);

  document.getElementById('btnSaveProduct').addEventListener('click', async () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('동결제품 등록/수정은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const name = document.getElementById('m_name').value.trim();
    const recipeRef = name;
    const bagTypeId = document.getElementById('m_bagType').value;
    const requiresSeparation = document.getElementById('m_separation').value === 'true';

    if (!name || !bagTypeId) { alert('제품명과 연결 봉투는 필수입니다.'); return; }

    const data = {
      name,
      recipeTitleRef: recipeRef,
      bagTypeId,
      requiresSeparation,
      active: true,
      sortOrder: isNew ? frozenProducts.length : product.sortOrder,
      updatedAt: new Date(),
    };

    if (isNew) {
      data.createdAt = new Date();
      await addDoc(collection(db, 'frozenProducts'), data);
    } else {
      await updateDoc(doc(db, 'frozenProducts', product.id), data);
    }

    frozenProducts = await loadFrozenProducts();
    closeModal();
    renderFrozenProductLayout();
    alert(isNew ? '추가 완료!' : '수정 완료!');
  });
}

function showIncomingModal(product) {
  const today = getToday();
  const future = new Date();
  future.setMonth(future.getMonth() + 18);
  const futureStr = future.toISOString().split('T')[0];

  showModal(`
    <h3 class="modal-title">입고 등록 — ${product.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${today}" />
      </div>
      <div class="form-group">
        <label>유통기한</label>
        <input type="date" id="m_expiry" value="${futureStr}" />
      </div>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['senior', 'lead', 'office'])}
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
    const date = document.getElementById('m_date').value;
    const expiry = document.getElementById('m_expiry').value;
    const qty = parseInt(document.getElementById('m_qty').value);
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!qty || !date) { alert('수량과 날짜는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    // 봉투 차감
    let deductedBagQty = 0;
    if (product.bagTypeId) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', product.bagTypeId));
      if (bagSnap.exists()) {
        const bagData = bagSnap.data();
        const currentBag = bagData.currentQty || 0;
        if (currentBag < qty) {
          alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${currentBag}장\n필요 수량: ${qty}장`);
          return;
        }
        await updateDoc(doc(db, 'bagTypes', product.bagTypeId), {
          currentQty: currentBag - qty,
          updatedAt: new Date(),
        });
        deductedBagQty = qty;
      }
    }

    await addDoc(collection(db, 'frozenLogs'), {
      date,
      timestamp: new Date(),
      productId: product.id,
      productNameSnapshot: product.name,
      expiryDate: expiry,
      qty,
      bagTypeId: product.bagTypeId || null,
      deductedBagQty,
      staffName: staff,
      note,
      status: 'active',
    });

    closeModal();
    await showProductDetail(product);
    alert('입고 등록 완료!');
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