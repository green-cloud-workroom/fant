import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday, addMonthsKST } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { showConfirmModal } from '../utils/modal.js';
import { recordActivity } from '../services/activityLogs.js';

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
  const canManageFrozenProduct = currentUserRole === 'admin' || currentUserRole === 'office';
  content.innerHTML = `
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${canManageFrozenProduct ? '<button class="btn-primary" id="btnNewProduct">+ 추가</button>' : ''}
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
  document.getElementById('btnNewProduct')?.addEventListener('click', showNewProductModal);
}

function renderProductList() {
  if (frozenProducts.length === 0) return '<div class="list-empty">\uB4F1\uB85D\uB41C \uC81C\uD488 \uC5C6\uC74C</div>';
  return frozenProducts
    .map(p => {
      const active = p.active !== false;
      return `
      <div class="recipe-list-item ${selectedProductId === p.id ? 'active' : ''} ${active ? '' : 'inactive-master'}" data-id="${p.id}">
        <div class="recipe-list-info">
          <span class="recipe-name">${p.name}</span>
          <div class="recipe-tags">
            <span style="font-size:11px;color:#888">${p.recipeTitleRef || '-'}</span>
            ${active ? '' : '<span class="tag tag-inactive">\uBE44\uD65C\uC131</span>'}
          </div>
        </div>
      </div>
    `;
    }).join('');
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
  const canManageFrozenProduct = currentUserRole === 'admin' || currentUserRole === 'office';
  const productActive = product.active !== false;

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
        ${canManageFrozenProduct ? '<button class="btn-secondary" id="btnEditProduct">수정</button>' : ''}
        ${productActive ? '<button class="btn-primary" id="btnAddIncoming">+ \uC785\uACE0 \uB4F1\uB85D</button>' : '<button class="btn-secondary" disabled>\uBE44\uD65C\uC131</button>'}
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
                      ${canManageFrozenProduct ? `
                        <button class="btn-edit-row" data-logid="${l.id}" style="margin-right:4px;">수정</button>
                        <button class="btn-del-row" data-logid="${l.id}" data-qty="${l.qty}" data-bagqty="${l.deductedBagQty || 0}" data-bagid="${product.bagTypeId || ''}">삭제</button>
                      ` : ''}
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnAddIncoming')?.addEventListener('click', () => showIncomingModal(product));
  document.getElementById('btnEditProduct')?.addEventListener('click', () => showEditProductModal(product));

  document.querySelectorAll('.btn-edit-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      const logId = btn.dataset.logid;
      const logSnap = await getDoc(doc(db, 'frozenLogs', logId));
      if (!logSnap.exists()) {
        alert('입고 로그를 찾을 수 없습니다.');
        return;
      }
      const log = { id: logId, ...logSnap.data() };
      showEditIncomingModal(product, log);
    });
  });

  document.querySelectorAll('.btn-del-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      // [권한 매트릭스 C4] production은 동결제품 입고 삭제 불가
      if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
        alert('동결제품 입고 삭제는 대표/사무실 계정만 가능합니다.');
        return;
      }

      const __c = await showConfirmModal({ title:'동결제품 입고 삭제', message:'삭제하시겠습니까?\n차감된 봉투 재고가 복원됩니다.', confirmText:'삭제', danger:true }); if (!__c) return;
      const logId = btn.dataset.logid;

      const frozenLogSnap = await getDoc(doc(db, 'frozenLogs', logId));
      if (!frozenLogSnap.exists()) {
        alert('입고 로그를 찾을 수 없습니다.');
        return;
      }
      const frozenLog = frozenLogSnap.data();

      if (await blockIfClosed(frozenLog.date)) return;

      if (frozenLog.ledgerId) {
        // ledger 기반 롤백
        const ledgerSnap = await getDoc(doc(db, 'stockLedger', frozenLog.ledgerId));
        if (ledgerSnap.exists() && ledgerSnap.data().status === 'active') {
          const items = ledgerSnap.data().items || [];
          for (const item of items) {
            const docSnap = await getDoc(doc(db, item.collection, item.docId));
            if (!docSnap.exists()) continue;
            const currentVal = docSnap.data()[item.field] || 0;

            if (currentVal !== item.after) {
              const __c = await showConfirmModal({
                title: '재고 변동 감지',
                message: `동결제품 입고 이후 ${item.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,
                confirmText: '강제 복원',
                danger: true,
              });
              if (!__c) continue;
            }

            const restoredVal = currentVal - item.delta;
            await updateDoc(doc(db, item.collection, item.docId), {
              [item.field]: restoredVal,
              updatedAt: new Date(),
            });

            // bagLogs 복원 로그
            if (item.collection === 'bagTypes') {
              await addDoc(collection(db, 'bagLogs'), {
                date: getToday(),
                timestamp: new Date(),
                bagTypeId: item.docId,
                bagNameSnapshot: docSnap.data().name || '',
                type: 'autoDeductReverse',
                qty: -item.delta,
                before: currentVal,
                after: restoredVal,
                staffName: frozenLog.staffName || '',
                note: `동결제품 입고 삭제 복원 - ${frozenLog.productNameSnapshot || ''}`,
              });
            }
          }
          await updateDoc(doc(db, 'stockLedger', frozenLog.ledgerId), {
            status: 'rolledBack',
            rolledBackAt: new Date(),
          });
        }
      } else if (frozenLog.bagTypeId && (frozenLog.deductedBagQty || 0) > 0) {
        // fallback: ledger 없는 기존 데이터 단순 복원
        const bagSnap = await getDoc(doc(db, 'bagTypes', frozenLog.bagTypeId));
        if (bagSnap.exists()) {
          const current = bagSnap.data().currentQty || 0;
          await updateDoc(doc(db, 'bagTypes', frozenLog.bagTypeId), {
            currentQty: current + frozenLog.deductedBagQty,
            updatedAt: new Date(),
          });
        }
      }

      await updateDoc(doc(db, 'frozenLogs', logId), { status: 'deleted' });

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
  const bags = bagSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(b => b.category === 'freezeDry' && (b.active !== false || (!isNew && b.id === product?.bagTypeId)));
  const recipes = await getActiveFreezeDryRecipes();
  const active = isNew ? true : product.active !== false;

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
        ${bags.map(b => `<option value="${b.id}" ${product?.bagTypeId === b.id ? 'selected' : ''}>${b.name}${b.active === false ? ' (\uBE44\uD65C\uC131)' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>분리작업 필요</label>
      <select id="m_separation">
        <option value="false" ${!product?.requiresSeparation ? 'selected' : ''}>아니오</option>
        <option value="true" ${product?.requiresSeparation ? 'selected' : ''}>예</option>
      </select>
    </div>
    ${!isNew ? `
      <div class="form-group">
        <label>\uD65C\uC131 \uC0C1\uD0DC</label>
        <label class="toggle-switch" title="${active ? '\uD65C\uC131' : '\uBE44\uD65C\uC131'}">
          <input type="checkbox" id="m_productActive" ${active ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    ` : ''}
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
    const nextActive = isNew ? true : document.getElementById('m_productActive').checked;
    const previousActive = isNew ? true : product.active !== false;

    if (!name || !bagTypeId) { alert('제품명과 연결 봉투는 필수입니다.'); return; }

    const data = {
      name,
      recipeTitleRef: recipeRef,
      bagTypeId,
      requiresSeparation,
      active: nextActive,
      sortOrder: isNew ? frozenProducts.length : product.sortOrder,
      updatedAt: new Date(),
    };

    if (isNew) {
      data.createdAt = new Date();
      await addDoc(collection(db, 'frozenProducts'), data);
    } else {
      await updateDoc(doc(db, 'frozenProducts', product.id), data);
      if (previousActive !== nextActive) {
        await recordActivity({
          action: 'frozenProduct',
          subAction: 'activeToggle',
          date: getToday(),
          staff: getRoleStaffLabel(),
          message: `Frozen product ${nextActive ? 'active' : 'inactive'} — ${name}`,
          details: {
            productId: product.id,
            productName: name,
            active: nextActive,
          },
        });
      }
    }

    frozenProducts = await loadFrozenProducts();
    closeModal();
    renderFrozenProductLayout();
    alert(isNew ? '추가 완료!' : '수정 완료!');
  });
}
function showEditIncomingModal(product, log) {
  showModal(`
    <h3 class="modal-title">입고 수정 — ${product.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜 (수정 불가)</label>
        <input type="date" id="m_date" value="${log.date || ''}" disabled />
      </div>
      <div class="form-group">
        <label>유통기한</label>
        <input type="date" id="m_expiry" value="${log.expiryDate || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" value="${log.qty || 0}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['senior', 'lead', 'office']).replace(`value="${log.staffName}"`, `value="${log.staffName}" selected`)}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" value="${log.note || ''}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEditIncoming">저장</button>
    </div>
  `);

  document.getElementById('btnSaveEditIncoming').addEventListener('click', async () => {
    const expiry = document.getElementById('m_expiry').value;
    const newQty = parseInt(document.getElementById('m_qty').value);
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!newQty || newQty <= 0) { alert('수량은 1개 이상이어야 합니다.'); return; }
    if (await blockIfClosed(log.date)) return;

    // [권한 매트릭스 C4] production은 동결제품 입고 수정 불가
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('동결제품 입고 수정은 대표/사무실 계정만 가능합니다.');
      return;
    }

    const oldQty = log.qty || 0;
    const oldDeducted = log.deductedBagQty || 0;

    // 1단계: 기존 ledger 롤백 (봉투 재고 복원)
    if (log.ledgerId) {
      const ledgerSnap = await getDoc(doc(db, 'stockLedger', log.ledgerId));
      if (ledgerSnap.exists() && ledgerSnap.data().status === 'active') {
        const items = ledgerSnap.data().items || [];
        for (const item of items) {
          const docSnap = await getDoc(doc(db, item.collection, item.docId));
          if (!docSnap.exists()) continue;
          const currentVal = docSnap.data()[item.field] || 0;

          if (currentVal !== item.after) {
            const __c = await showConfirmModal({
              title: '재고 변동 감지',
              message: `동결제품 입고 이후 ${item.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,
              confirmText: '강제 복원',
              danger: true,
            });
            if (!__c) {
              return;
            }
          }

          const restoredVal = currentVal - item.delta;
          await updateDoc(doc(db, item.collection, item.docId), {
            [item.field]: restoredVal,
            updatedAt: new Date(),
          });

          if (item.collection === 'bagTypes') {
            await addDoc(collection(db, 'bagLogs'), {
              date: getToday(),
              timestamp: new Date(),
              bagTypeId: item.docId,
              bagNameSnapshot: docSnap.data().name || '',
              type: 'autoDeductReverse',
              qty: -item.delta,
              before: currentVal,
              after: restoredVal,
              staffName: staff,
              note: `동결제품 입고 수정(롤백) - ${product.name}`,
            });
          }
        }
        await updateDoc(doc(db, 'stockLedger', log.ledgerId), {
          status: 'rolledBack',
          rolledBackAt: new Date(),
        });
      }
    } else if (log.bagTypeId && oldDeducted > 0) {
      // fallback: ledger 없는 기존 데이터
      const bagSnap = await getDoc(doc(db, 'bagTypes', log.bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        await updateDoc(doc(db, 'bagTypes', log.bagTypeId), {
          currentQty: current + oldDeducted,
          updatedAt: new Date(),
        });
      }
    }

    // 2단계: 새 수량으로 재차감 + 새 ledger 생성
    let newDeducted = 0;
    const ledgerItems = [];

    if (product.bagTypeId) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', product.bagTypeId));
      if (bagSnap.exists()) {
        const bagData = bagSnap.data();
        const currentBag = bagData.currentQty || 0;
        if (currentBag < newQty) {
          alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${currentBag}장\n필요 수량: ${newQty}장\n\n수정이 중단되었습니다. 봉투 재고는 이전 상태로 이미 복원되었습니다.`);
          closeModal();
          await showProductDetail(product);
          return;
        }
        const newBagQty = currentBag - newQty;
        const stockUpdatedAt = new Date();
        await updateDoc(doc(db, 'bagTypes', product.bagTypeId), {
          currentQty: newBagQty,
          updatedAt: stockUpdatedAt,
        });
        newDeducted = newQty;

        const bagLogRef = await addDoc(collection(db, 'bagLogs'), {
          date: log.date,
          timestamp: new Date(),
          bagTypeId: product.bagTypeId,
          bagNameSnapshot: bagData.name,
          type: 'autoDeduct',
          qty: -newQty,
          before: currentBag,
          after: newBagQty,
          staffName: staff,
          note: `동결제품 입고 수정(재차감) - ${product.name}`,
        });

        ledgerItems.push({
          collection: 'bagTypes',
          docId: product.bagTypeId,
          field: 'currentQty',
          delta: -newQty,
          before: currentBag,
          after: newBagQty,
          label: `${bagData.name} 봉투`,
          stockUpdatedAtSnapshot: stockUpdatedAt,
          bagLogId: bagLogRef.id,
        });
      }
    }

    // 3단계: frozenLogs 업데이트
    let newLedgerId = null;
    if (ledgerItems.length > 0) {
      const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
        actionType: 'frozenProductIncoming',
        actionId: log.id,
        timestamp: new Date(),
        date: log.date,
        status: 'active',
        items: ledgerItems,
      });
      newLedgerId = ledgerRef.id;
    }

    await updateDoc(doc(db, 'frozenLogs', log.id), {
      qty: newQty,
      expiryDate: expiry,
      staffName: staff,
      note,
      deductedBagQty: newDeducted,
      ledgerId: newLedgerId,
      updatedAt: new Date(),
    });

    closeModal();
    await showProductDetail(product);
    alert('수정 완료!');
  });
}

function showIncomingModal(product) {
  const today = getToday();
  const futureStr = addMonthsKST(18);

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
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    // 봉투 차감 + ledger items 누적
    let deductedBagQty = 0;
    const ledgerItems = [];

    if (product.bagTypeId) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', product.bagTypeId));
      if (bagSnap.exists()) {
        const bagData = bagSnap.data();
        const currentBag = bagData.currentQty || 0;
        if (currentBag < qty) {
          alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${currentBag}장\n필요 수량: ${qty}장`);
          return;
        }
        const newQty = currentBag - qty;
        const stockUpdatedAt = new Date();
        await updateDoc(doc(db, 'bagTypes', product.bagTypeId), {
          currentQty: newQty,
          updatedAt: stockUpdatedAt,
        });
        deductedBagQty = qty;

        // bagLogs autoDeduct 기록
        const bagLogRef = await addDoc(collection(db, 'bagLogs'), {
          date,
          timestamp: new Date(),
          bagTypeId: product.bagTypeId,
          bagNameSnapshot: bagData.name,
          type: 'autoDeduct',
          qty: -qty,
          before: currentBag,
          after: newQty,
          staffName: staff,
          note: `동결제품 입고 자동차감 - ${product.name}`,
        });

        ledgerItems.push({
          collection: 'bagTypes',
          docId: product.bagTypeId,
          field: 'currentQty',
          delta: -qty,
          before: currentBag,
          after: newQty,
          label: `${bagData.name} 봉투`,
          stockUpdatedAtSnapshot: stockUpdatedAt,
          bagLogId: bagLogRef.id,
        });
      }
    }

    // frozenLogs 저장 (ledgerId는 아래에서 업데이트)
    const frozenLogRef = await addDoc(collection(db, 'frozenLogs'), {
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
      ledgerId: null,
    });

    // ledger 저장 (items 있을 때만)
    if (ledgerItems.length > 0) {
      const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
        actionType: 'frozenProductIncoming',
        actionId: frozenLogRef.id,
        timestamp: new Date(),
        date,
        status: 'active',
        items: ledgerItems,
      });
      await updateDoc(doc(db, 'frozenLogs', frozenLogRef.id), { ledgerId: ledgerRef.id });
    }

    // [묶음 5A] 사무 로그 발행 — 동결제품 입고 (운영자가 메인 화면에서 변동 추적 가능하게)
    await recordActivity({
      action: 'frozenProduct',
      subAction: 'incoming',
      date,
      staff,
      message: `동결제품 입고 — ${product.name} +${qty}봉 / 담당: ${staff}`,
      details: {
        frozenLogId: frozenLogRef.id,
        productId: product.id,
        productName: product.name,
        qty,
        expiryDate: expiry || null,
        deductedBagQty,
        bagTypeId: product.bagTypeId || null,
        note: note || null,
      },
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

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '\uB300\uD45C';
  if (currentUserRole === 'office') return '\uC0AC\uBB34\uC2E4';
  if (currentUserRole === 'production') return '\uC0DD\uC0B0\uC2E4';
  return '\uC2DC\uC2A4\uD15C';
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
