import { db } from '../firebase.js';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, getDoc, where, writeBatch,
  runTransaction, serverTimestamp
} from 'firebase/firestore';
import { getTodayKST as getToday, getHolidaysCache } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUser, currentUserRole } from '../app.js';
import { showConfirmModal } from '../utils/modal.js';

let recipes = [];
let productions = [];
let selectedDate = getToday();
let selectedProductionId = null;

function isTenderFreezeDry(item) {
  return item?.category === 'freezeDry' && item.requiresSeparation === false;
}

function renderFreezeDryQtyLine(item) {
  const parts = [`${item.freezeDryBagQty || 0}봉`];
  if (!isTenderFreezeDry(item)) parts.push(`${item.breadPanQty || 0}빵판`);
  parts.push(`${item.freezePanQty || 0}동결판`);
  return parts.join(' / ');
}

function getUnitPresets(recipe) {
  return Array.isArray(recipe?.unitPresets) ? recipe.unitPresets : [];
}

function makeSupplementId(recipeId, unit) {
  return `${recipeId}_${unit}`;
}

function getSupplementSaveErrorMessage(code, supplementName) {
  if (code === 'SKU_NOT_FOUND') {
    return '이 (레시피, 생산단위) 조합의 영양제가 등록되어 있지 않습니다. 레시피 관리에서 프리셋을 확인해주세요.';
  }
  if (code === 'SKU_INACTIVE') {
    return '이 영양제는 비활성 상태입니다.';
  }
  if (code === 'STOCK_INSUFFICIENT') {
    return `${supplementName || '영양제'} 재고가 부족합니다. 영양제 재고를 먼저 입고해주세요.`;
  }
  return '저장 중 오류가 발생했습니다. 다시 시도해주세요.';
}

export async function renderProduction() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>생산 입력 로딩 중...</p></div>`;
  await loadStaffCache();
  recipes = await loadRecipes();
  productions = await loadProductions(selectedDate);
  renderProductionLayout();
}

async function loadRecipes() {
  const q = query(collection(db, 'recipes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.active !== false);
}

async function loadProductions(date) {
  const q = query(collection(db, 'productions'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.date === date && p.status !== 'deleted');
}

// [묶음 4A] 회차/차수 재계산 (B안: round + batchNo 둘 다 DB 저장)
// - round: 같은 레시피의 sortOrder 순 등록 순번 (1부터)
// - batchNo: 동일 레시피 + 동일 productionUnitQty 묶음의 순번 (2건 이상일 때만 부여, 아니면 null)
function recalcRoundsAndBatches(list) {
  const sorted = [...list].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const byRecipe = {};
  sorted.forEach(p => {
    if (!byRecipe[p.recipeId]) byRecipe[p.recipeId] = [];
    byRecipe[p.recipeId].push(p);
  });

  const updates = [];
  for (const recipeId in byRecipe) {
    const group = byRecipe[recipeId];
    group.forEach((p, idx) => {
      const newRound = idx + 1;
      const sameQty = group.filter(g => g.productionUnitQty === p.productionUnitQty);
      const newBatchNo = sameQty.length >= 2
        ? sameQty.findIndex(g => g.id === p.id) + 1
        : null;
      const oldBatchNo = p.batchNo ?? null;
      if (p.round !== newRound || oldBatchNo !== newBatchNo) {
        updates.push({ id: p.id, round: newRound, batchNo: newBatchNo });
      }
    });
  }
  return updates;
}

async function applyRoundsAndBatches(date) {
  productions = await loadProductions(date);
  const updates = recalcRoundsAndBatches(productions);
  if (updates.length > 0) {
    const batch = writeBatch(db);
    updates.forEach(u => {
      batch.update(doc(db, 'productions', u.id), {
        round: u.round,
        batchNo: u.batchNo,
      });
    });
    await batch.commit();
    productions = await loadProductions(date);
  }
}

// [묶음 4A] 회차/차수 표시 헬퍼
// - batchNo 있으면 "1차" / 없고 round>1이면 "1회차" / round==1 + batchNo null이면 표시 없음
function getRoundBadgeHtml(p) {
  if (p.batchNo) return ` <span style="font-size:10px;color:#aaa">${p.batchNo}차</span>`;
  if (p.round > 1) return ` <span style="font-size:10px;color:#aaa">${p.round}회차</span>`;
  return '';
}

function renderProductionLayout() {
  const content = document.getElementById('mainContent');
  const canManageProduction = currentUserRole === 'admin' || currentUserRole === 'office';
  content.innerHTML = `
    <div class="production-wrap">
      <!-- 왼쪽 3/4 -->
      <div class="production-left">
        <div class="production-date-bar">
          <input type="date" id="productionDate" value="${selectedDate}" />
          <span id="holidayBadge">${renderHolidayBadge(selectedDate)}</span>
          <span id="holidayMonthList">${renderHolidaysOfMonth(selectedDate)}</span>
          <button class="btn-secondary" id="btnBigView" style="margin-left:auto;">크게보기</button>
        </div>
        <div class="production-cards" id="productionCards">
          ${renderProductionCards()}
        </div>
      </div>

      <!-- 오른쪽 1/4 -->
      <div class="production-right">
        <div class="production-form-header">
          <span style="font-size:13px;font-weight:600;color:#333;">생산 입력</span>
          <button class="btn-secondary" id="btnCopySheet" style="font-size:11px;padding:3px 10px;">생산지시서 복사</button>
        </div>
        <div id="productionForm">
          <div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">
            카드를 선택하거나 아래에서 새 생산을 추가하세요
          </div>
        </div>
        ${canManageProduction ? '<button class="btn-primary" id="btnNewProduction" style="width:100%;margin-top:12px;">+ 새 생산 추가</button>' : ''}
      </div>
    </div>
  `;

  // 날짜 변경
  document.getElementById('productionDate').addEventListener('change', async (e) => {
    selectedDate = e.target.value;
    productions = await loadProductions(selectedDate);
    document.getElementById('productionCards').innerHTML = renderProductionCards();
    document.getElementById('holidayBadge').innerHTML = renderHolidayBadge(selectedDate);
    document.getElementById('holidayMonthList').innerHTML = renderHolidaysOfMonth(selectedDate);
    bindCardEvents();
  });

  document.getElementById('btnNewProduction')?.addEventListener('click', () => showProductionForm(null));
  document.getElementById('btnCopySheet').addEventListener('click', showCopySheetModal);
  document.getElementById('btnBigView').addEventListener('click', showBigViewModal);

  bindCardEvents();
}
// [Phase 7B-2] 휴일 배지 렌더 (read-only)
// 선택한 날짜가 holidays 캐시에 있으면 휴일명 배지 표시. 토/일은 자동 처리되므로 별도 표시 안 함.
function renderHolidayBadge(dateStr) {
  if (!dateStr) return '';

  // 토/일 자동 표시
  const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return `<span class="holiday-badge holiday-badge-weekend">${dayOfWeek === 0 ? '일요일' : '토요일'}</span>`;
  }

  // 등록된 공휴일 표시
  const holidays = getHolidaysCache();
  if (holidays.includes(dateStr)) {
    return `<span class="holiday-badge holiday-badge-registered">🔴 등록 공휴일</span>`;
  }

  return '';
}

// [Phase 7B-2] 선택한 날짜의 같은 달 공휴일 목록 표시
function renderHolidaysOfMonth(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const prefix = `${year}-${month}-`;
  const all = getHolidaysCache();
  const monthly = all.filter(d => d.startsWith(prefix)).sort();

  if (monthly.length === 0) return '';

  const items = monthly.map(d => {
    const day = parseInt(d.split('-')[2], 10);
    return `${month}/${day}`;
  }).join(', ');

  return `<span class="holiday-month-list">이번 달 공휴일: ${items}</span>`;
}
function renderProductionCards() {
  const canManageProduction = currentUserRole === 'admin' || currentUserRole === 'office';
  if (productions.length === 0) {
    return '<div style="color:#aaa;font-size:13px;padding:20px;text-align:center;">오늘 생산 없음</div>';
  }
  return productions.map(p => `
    <div class="production-card ${selectedProductionId === p.id ? 'active' : ''}"
         data-id="${p.id}"
         style="border-left:4px solid ${p.color || '#4A7C59'}">
      <div class="card-title">${p.recipeName}${getRoundBadgeHtml(p)}</div>
      <div class="card-info">${p.productionUnitQty} ${p.productionUnitName}</div>
      ${p.category === 'raw' ? `<div class="card-sub">${p.rawBoxQty || 0}박스</div>` : ''}
      ${p.category === 'freezeDry' ? `<div class="card-sub">${renderFreezeDryQtyLine(p)}</div>` : ''}
      ${canManageProduction ? `<button class="card-del" data-id="${p.id}">✕</button>` : ''}
    </div>
  `).join('');
}

function bindCardEvents() {
  document.querySelectorAll('.production-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-del')) return;
      selectedProductionId = card.dataset.id;
      const p = productions.find(pr => pr.id === selectedProductionId);
      showProductionForm(p);
      document.querySelectorAll('.production-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  document.querySelectorAll('.card-del').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
        alert('생산 카드 삭제는 대표/사무실 계정만 가능합니다.');
        return;
      }
      const __c = await showConfirmModal({ title:'삭제 확인', message:'정말 삭제하시겠습니까?', confirmText:'삭제', danger:true }); if (!__c) return;
      if (await blockIfClosed(selectedDate)) return;
      const deletedId = btn.dataset.id;
      await updateDoc(doc(db, 'productions', deletedId), { status: 'deleted' });
      // [묶음 4A] 삭제 후 회차/차수 재정렬
      await applyRoundsAndBatches(selectedDate);
      document.getElementById('productionCards').innerHTML = renderProductionCards();
      bindCardEvents();
      if (selectedProductionId === deletedId) {
        selectedProductionId = null;
        document.getElementById('productionForm').innerHTML = `<div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">카드를 선택하거나 아래에서 새 생산을 추가하세요</div>`;
      }
    });
  });
}

function showProductionForm(production) {
  const isNew = !production;
  const canManageProduction = currentUserRole === 'admin' || currentUserRole === 'office';
  const form = document.getElementById('productionForm');

  form.innerHTML = `
    <div style="padding:16px 0;">
      <div class="form-group" style="margin-bottom:12px;">
        <label>생산 담당자</label>
        <select id="pf_staff">
          <option value="">선택</option>
          ${getStaffOptions(['office'])}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>레시피 *</label>
        <select id="pf_recipe" ${!isNew ? 'disabled' : ''}>
          <option value="">선택</option>
          ${recipes.map(r => `
            <option value="${r.id}"
              data-name="${getRecipeDisplayName(r)}"
              data-category="${r.category}"
              data-color="${r.color || '#4A7C59'}"
              ${production?.recipeId === r.id ? 'selected' : ''}>
              ${getRecipeDisplayName(r)}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>생산단위 *</label>
        <div class="production-unit-control">
          <select id="pf_qty_select" disabled>
            <option value="">레시피 선택</option>
          </select>
          <input type="number" id="pf_qty_direct" value="" placeholder="직접 입력" style="display:none;" />
          <span id="pf_unitName" style="font-size:12px;color:#888;min-width:30px;">${production?.productionUnitName || ''}</span>
        </div>
        <div class="production-unit-message" id="pf_qty_message" style="display:none;"></div>
      </div>

      <!-- 원료 목록 -->
      <div id="pf_ingredients" style="margin-bottom:12px;max-height:200px;overflow-y:auto;font-size:12px;"></div>

      <!-- 참고 수치 -->
      <div id="pf_refs" style="font-size:11px;color:#888;margin-bottom:12px;"></div>

      ${canManageProduction ? `<button class="btn-primary" id="btnSaveProduction" style="width:100%;">${isNew ? '저장' : '수정'}</button>` : ''}
    </div>
  `;

  // 레시피 선택 시 원료 자동 계산
  const recipeSelect = document.getElementById('pf_recipe');
  const qtySelect = document.getElementById('pf_qty_select');
  const qtyDirectInput = document.getElementById('pf_qty_direct');
  const qtyMessage = document.getElementById('pf_qty_message');
  const saveButton = document.getElementById('btnSaveProduction');

  function getSelectedQty() {
    if (!qtySelect || qtySelect.disabled) return 0;
    if (qtySelect.value === 'custom') {
      return parseFloat(qtyDirectInput.value) || 0;
    }
    return parseFloat(qtySelect.value) || 0;
  }

  function renderProductionUnitControl(recipe) {
    const presets = getUnitPresets(recipe);
    const currentQty = production?.productionUnitQty;
    const hasCurrentQty = currentQty !== undefined && currentQty !== null && currentQty !== '';
    const allowLegacyEdit = !isNew && hasCurrentQty;
    const unitName = recipe?.ingredients?.find(i => i.isProductionUnit)?.unitName || '';

    document.getElementById('pf_unitName').textContent = unitName;
    qtyDirectInput.value = '';
    qtyDirectInput.style.display = 'none';
    qtyMessage.style.display = 'none';
    qtyMessage.textContent = '';

    if (!recipe) {
      qtySelect.innerHTML = '<option value="">레시피 선택</option>';
      qtySelect.disabled = true;
      if (saveButton) saveButton.disabled = false;
      return;
    }

    if (presets.length === 0 && !allowLegacyEdit) {
      qtySelect.innerHTML = '<option value="">선택 불가</option>';
      qtySelect.disabled = true;
      qtyMessage.textContent = '⚠ 레시피 관리에서 생산단위 프리셋을 먼저 설정해주세요.';
      qtyMessage.style.display = '';
      if (saveButton) saveButton.disabled = true;
      return;
    }

    const options = presets.map(unit => `<option value="${unit}">${unit}</option>`).join('');
    qtySelect.innerHTML = `${options}<option value="custom">직접 입력...</option>`;
    qtySelect.disabled = false;
    if (saveButton) saveButton.disabled = false;

    if (allowLegacyEdit && !presets.includes(Number(currentQty))) {
      qtySelect.value = 'custom';
      qtyDirectInput.value = currentQty;
      qtyDirectInput.style.display = '';
      return;
    }

    if (hasCurrentQty && presets.includes(Number(currentQty))) {
      qtySelect.value = String(currentQty);
      return;
    }

    qtySelect.value = presets.length > 0 ? String(presets[0]) : 'custom';
    if (qtySelect.value === 'custom') {
      qtyDirectInput.style.display = '';
    }
  }

  function handleQtyModeChange() {
    qtyDirectInput.style.display = qtySelect.value === 'custom' ? '' : 'none';
    if (qtySelect.value !== 'custom') {
      qtyDirectInput.value = '';
    }
    updateIngredients();
  }

  function updateIngredients() {
    const recipeId = recipeSelect.value;
    const recipe = recipes.find(r => r.id === recipeId);
    const qty = getSelectedQty();
    if (!recipe || !qty) {
      document.getElementById('pf_ingredients').innerHTML = '';
      document.getElementById('pf_refs').innerHTML = '';
      return;
    }

    document.getElementById('pf_unitName').textContent = recipe.ingredients?.find(i => i.isProductionUnit)?.unitName || '';

    const productionUnitIng = recipe.ingredients?.find(i => i.isProductionUnit);
const baseWeight = productionUnitIng?.baseWeightG || 1;
const totalProductionG = qty * 1000;

const ingHtml = (recipe.ingredients || []).map(ing => {
  const total = ing.isProductionUnit
    ? totalProductionG.toFixed(1)
    : ((ing.baseWeightG / baseWeight) * totalProductionG).toFixed(1);
      return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5;">
        <span>${ing.name}</span>
        <span style="color:#333;font-weight:500">${total}g</span>
      </div>`;
    }).join('');
    document.getElementById('pf_ingredients').innerHTML = ingHtml;

    // 참고 수치
    let refs = '';
    if (recipe.category === 'raw' && recipe.packWeightG) {
      const totalG = (recipe.ingredients?.find(i => i.isProductionUnit)?.baseWeightG || 0) * qty;
      const boxes = Math.ceil(totalG / recipe.packWeightG / 20);
      refs = `📦 박스수: ${boxes}박스`;
    } else if (recipe.category === 'freezeDry') {
      const parts = [`봉지: ${(recipe.freezeDryBagCountPerUnit || 0) * qty}`];
      if (!isTenderFreezeDry(recipe)) parts.push(`빵판: ${(recipe.breadPanCountPerUnit || 0) * qty}`);
      parts.push(`동결판: ${(recipe.freezePanCountPerUnit || 0) * qty}`);
      refs = parts.join(' / ');
    }
    document.getElementById('pf_refs').textContent = refs;
  }

  recipeSelect.addEventListener('change', () => {
    const recipe = recipes.find(r => r.id === recipeSelect.value);
    renderProductionUnitControl(recipe);
    updateIngredients();
  });
  qtySelect.addEventListener('change', handleQtyModeChange);
  qtyDirectInput.addEventListener('input', updateIngredients);

  renderProductionUnitControl(recipes.find(r => r.id === recipeSelect.value));
  updateIngredients();

  document.getElementById('btnSaveProduction')?.addEventListener('click', async () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('생산 입력은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const recipeId = recipeSelect.value;
    const recipe = recipes.find(r => r.id === recipeId);
    const qty = getSelectedQty();
    const staff = document.getElementById('pf_staff').value;

    if (!recipeId) { alert('레시피와 생산단위는 필수입니다.'); return; }
    if (!staff) { alert('생산 담당자는 필수입니다.'); return; }
    if (isNew && recipe && getUnitPresets(recipe).length === 0) {
      alert('레시피 관리에서 생산단위 프리셋을 먼저 설정해주세요.');
      return;
    }
    if (qtySelect.value === 'custom' && (!qty || qty <= 0)) {
      alert('0보다 큰 생산단위를 입력해주세요.');
      return;
    }
    if (!qty || qty <= 0) { alert('레시피와 생산단위는 필수입니다.'); return; }
    if (await blockIfClosed(selectedDate)) return;

    const unitName = recipe.ingredients?.find(i => i.isProductionUnit)?.unitName || '';
    const displayName = getRecipeDisplayName(recipe);
    const productionUnitIng = recipe.ingredients?.find(i => i.isProductionUnit);
const baseWeight = productionUnitIng?.baseWeightG || 1;

    // 재고 부족 경고
    const shortages = checkShortages(recipe, qty);
    if (shortages.length > 0) {
      const msg = shortages.map(s => `⚠️ ${s}`).join('\n');
      const __c = await showConfirmModal({ title:'재고 부족 경고', message:`재고가 부족합니다:\n${msg}\n\n그래도 저장하시겠습니까?`, confirmText:'저장', danger:true }); if (!__c) return;
    }

    // [묶음 4A] 회차/차수는 임시값으로 저장 후 applyRoundsAndBatches에서 일괄 재계산
    // 신규는 임시 round (sameRecipe.length+1), 수정은 기존값 유지
    const sameRecipe = productions.filter(p => p.recipeId === recipeId);
    const round = isNew ? sameRecipe.length + 1 : (production.round || 1);
    const batchNo = isNew ? null : (production.batchNo ?? null);

    const data = {
      date: selectedDate,
      recipeId,
      recipeName: displayName,
      category: recipe.category,
      requiresSeparation: recipe.requiresSeparation === true,
      target: recipe.target,
      color: recipe.color || '#4A7C59',
      round,
      batchNo,
      productionUnitQty: qty,
      productionUnitName: unitName,
      ingredientsSnapshot: (recipe.ingredients || []).map(ing => ({
        name: ing.name,
        meatTypeId: ing.meatTypeId || null,
        requiredQtyG: ing.isProductionUnit
  ? qty * 1000
  : (ing.baseWeightG / baseWeight) * qty * 1000,
        autoDeductInventory: ing.autoDeductInventory !== false,
        linkedToInventory: ing.linkedToInventory !== false,
      })),
      staffName: staff,
      sortOrder: isNew ? productions.length : production.sortOrder,
      lockedByCompletion: false,
      status: 'active',
      updatedAt: new Date(),
    };

    // 참고 수치
    if (recipe.category === 'raw' && recipe.packWeightG) {
      const totalG = (recipe.ingredients?.find(i => i.isProductionUnit)?.baseWeightG || 0) * qty;
      data.rawBoxQty = Math.ceil(totalG / recipe.packWeightG / 20);
    }
    if (recipe.category === 'freezeDry') {
      data.freezeDryBagQty = (recipe.freezeDryBagCountPerUnit || 0) * qty;
      data.breadPanQty = isTenderFreezeDry(recipe) ? 0 : (recipe.breadPanCountPerUnit || 0) * qty;
      data.freezePanQty = (recipe.freezePanCountPerUnit || 0) * qty;
    }

    if (isNew) {
      data.createdAt = new Date();
      const supplementTypeId = makeSupplementId(recipeId, qty);
      const productionRef = doc(collection(db, 'productions'));
      const supplementTypeRef = doc(db, 'supplementTypes', supplementTypeId);
      const supplementStockRef = doc(db, 'supplementStock', supplementTypeId);
      const supplementLogRef = doc(collection(db, 'supplementLogs'));
      const activityLogRef = doc(collection(db, 'activityLogs'));

      try {
        await runTransaction(db, async (transaction) => {
          const supplementTypeSnap = await transaction.get(supplementTypeRef);
          const supplementStockSnap = await transaction.get(supplementStockRef);

          if (!supplementTypeSnap.exists()) {
            throw new Error('SKU_NOT_FOUND');
          }

          const supplementType = supplementTypeSnap.data();
          if (supplementType.active === false) {
            throw new Error('SKU_INACTIVE');
          }

          if (!supplementStockSnap.exists()) {
            const err = new Error('STOCK_INSUFFICIENT');
            err.supplementName = supplementType.name;
            throw err;
          }

          const before = Number(supplementStockSnap.data().currentQty || 0);
          if (before < 1) {
            const err = new Error('STOCK_INSUFFICIENT');
            err.supplementName = supplementType.name;
            throw err;
          }

          const after = before - 1;
          transaction.set(productionRef, data);
          transaction.update(supplementStockRef, {
            currentQty: after,
            updatedAt: serverTimestamp(),
          });
          transaction.set(supplementLogRef, {
            date: selectedDate,
            timestamp: serverTimestamp(),
            supplementTypeId,
            type: 'autoDeduct',
            qty: -1,
            before,
            after,
            staffName: staff,
            relatedProductionId: productionRef.id,
          });

          // [묶음 6C-2] 생산 추가 발행 — 추가만 발행, 수정/삭제는 단위 9 검토.
          transaction.set(activityLogRef, {
            action: 'production',
            subAction: 'create',
            date: selectedDate,
            staff,
            uid: currentUser?.uid || null,
            timestamp: serverTimestamp(),
            message: `생산 추가 — ${displayName} ${qty}${unitName} / 담당: ${staff}`,
            details: {
              productionId: productionRef.id,
              recipeId,
              recipeName: displayName,
              category: recipe.category,
              target: recipe.target,
              productionUnitQty: qty,
              productionUnitName: unitName,
            },
            read: false,
            acknowledged: false,
            acknowledgedAt: null,
            acknowledgedBy: null,
            acknowledgedByUid: null,
          });
        });
      } catch (err) {
        console.error('[production] save with supplement deduct failed:', err);
        alert(getSupplementSaveErrorMessage(err.message, err.supplementName));
        return;
      }
    } else {
      await updateDoc(doc(db, 'productions', production.id), data);
    }

    // [묶음 4A] 저장 후 같은 날 productions의 round/batchNo 일괄 재계산
    // 수량 수정으로 동일 수량 묶음이 새로 생기거나 깨지는 경우도 자동 반영
    await applyRoundsAndBatches(selectedDate);
    document.getElementById('productionCards').innerHTML = renderProductionCards();
    bindCardEvents();
    alert(isNew ? '저장 완료!' : '수정 완료!');
  });
}

function checkShortages(recipe, qty) {
  // 간단한 경고만 (실제 차감은 내일생산불러오기에서)
  return [];
}

function getRecipeDisplayName(recipe) {
  const prefix = recipe.target === 'cat' ? '고양이 ' : recipe.target === 'dog' ? '강아지 ' : '';
  return prefix + recipe.name;
}

function showCopySheetModal() {
  const today = new Date(selectedDate);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${String(today.getFullYear()).slice(2)}/${today.getMonth()+1}/${today.getDate()} ${days[today.getDay()]}`;

  // [묶음 4B] sortOrder 순으로 정렬하여 묶음 첫 등장 순서 보장
  const sorted = [...productions].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const rawCat = sorted.filter(p => p.category === 'raw' && p.target === 'cat');
  const rawDog = sorted.filter(p => p.category === 'raw' && p.target === 'dog');
  const freezeCat = sorted.filter(p => p.category === 'freezeDry' && p.target === 'cat');
  const freezeDog = sorted.filter(p => p.category === 'freezeDry' && p.target === 'dog');
  const freezeCommon = sorted.filter(p => p.category === 'freezeDry' && p.target === 'common');

  // [묶음 4B] 동일 (recipeId, productionUnitQty) 묶음 그룹핑
  // 첫 등장 위치를 묶음 위치로 사용. count로 차수 추적.
  function groupForSheet(list) {
    const seen = new Map();
    const ordered = [];
    list.forEach(p => {
      const key = `${p.recipeId}|${p.productionUnitQty}`;
      if (seen.has(key)) {
        seen.get(key).count += 1;
      } else {
        const obj = {
          recipeName: p.recipeName,
          productionUnitQty: p.productionUnitQty,
          count: 1,
        };
        seen.set(key, obj);
        ordered.push(obj);
      }
    });
    return ordered;
  }

  // [묶음 4B] 묶음 단위 텍스트 포맷
  // namePrefix: 출력에 붙일 prefix ("고양이 " / "강아지 " / "")
  // count >= 2면 N번 반복 + " (1차, 2차, ...)" 접미사
  function formatGroup(g, namePrefix) {
    const cleaned = g.recipeName.replace(/^(고양이 |강아지 )/, '');
    const single = `${namePrefix}${cleaned}${g.productionUnitQty}`;
    if (g.count === 1) return single;
    const repeated = Array(g.count).fill(single).join(', ');
    const batches = Array.from({ length: g.count }, (_, i) => `${i + 1}차`).join(', ');
    return `${repeated} (${batches})`;
  }

  let sheet = `※ ${dateStr} 생산\n`;

  if (rawCat.length > 0) {
    const items = groupForSheet(rawCat).map(g => formatGroup(g, '')).join(', ');
    sheet += `- 고양이 생식 : ${items}\n`;
  }
  if (rawDog.length > 0) {
    const items = groupForSheet(rawDog).map(g => formatGroup(g, '')).join(', ');
    sheet += `- 강아지 생식 : ${items}\n`;
  }
  if (freezeCat.length > 0 || freezeDog.length > 0 || freezeCommon.length > 0) {
    const catItems = groupForSheet(freezeCat).map(g => formatGroup(g, '고양이 '));
    const dogItems = groupForSheet(freezeDog).map(g => formatGroup(g, '강아지 '));
    const commonItems = groupForSheet(freezeCommon).map(g => formatGroup(g, ''));
    const allFreeze = [...catItems, ...dogItems, ...commonItems].join(', ');
    sheet += `- 동결건조 : ${allFreeze}\n`;
  }

  showModal(`
    <h3 class="modal-title">생산지시서 복사</h3>
    <textarea id="sheetText" style="width:100%;height:140px;font-size:13px;padding:12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;resize:none;">${sheet}</textarea>
    <!-- [묶음 4C] 비고 입력 UI: textarea와 분리. 복사 시 끝줄에 합성. 비어있으면 줄 생략 -->
    <div class="form-group" style="margin-top:10px;">
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px;">비고</label>
      <input type="text" id="sheetNote" placeholder="입력 시 끝줄에 자동 추가됩니다 (비어 있으면 비고줄 생략)"
        style="width:100%;font-size:13px;padding:8px 12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
      <button class="btn-primary" id="btnCopy">복사하기</button>
    </div>
  `);

  document.getElementById('btnCopy').addEventListener('click', () => {
    let text = document.getElementById('sheetText').value;
    const note = document.getElementById('sheetNote').value.trim();
    // [묶음 4C] 비고 합성: 본문 끝의 개행 정리 후 비고 줄 추가
    if (note) {
      text = text.replace(/\n+$/, '') + '\n' + note;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('복사 완료!');
      closeModal();
    });
  });
}

function showBigViewModal() {
  showModal(`
    <h3 class="modal-title">${selectedDate} 생산 현황</h3>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">
      ${productions.length === 0 ? '<p style="color:#aaa">생산 없음</p>' :
        productions.map(p => `
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;min-width:160px;border-left:4px solid ${p.color || '#4A7C59'}">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${p.recipeName}${getRoundBadgeHtml(p)}</div>
            <div style="font-size:12px;color:#555;">${p.productionUnitQty} ${p.productionUnitName}</div>
            ${p.category === 'raw' ? `<div style="font-size:11px;color:#888;">${p.rawBoxQty || 0}박스</div>` : ''}
            ${p.category === 'freezeDry' ? `<div style="font-size:11px;color:#888;">${renderFreezeDryQtyLine(p)}</div>` : ''}
          </div>
        `).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);
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
  overlay.innerHTML = `<div class="modal-box" style="width:600px;max-width:90vw;">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
