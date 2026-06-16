import { db } from '../firebase.js';
import {
  collection, getDocs, getDoc, doc, updateDoc, query, orderBy, where, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { currentUser, currentUserRole } from '../app.js';
import { recordActivity } from '../services/activityLogs.js';
import { getTodayKST as getToday } from '../utils/date.js';
import { makeSupplementId, makeSupplementName, makeSupplementSortOrder } from '../utils/supplement.js';
import { showConfirmModal } from '../utils/modal.js';
import Sortable from 'sortablejs';

let recipes = [];
let selectedRecipeId = null;

let meatTypes = [];
// [봉투 연동] raw 카테고리에서 선택 가능한 봉투 목록
let bagTypes = [];
let currentUnitPresets = [];
let currentProductionMethods = [];

const PRODUCTION_METHOD_OPTIONS = [
  { methodKey: 'rotary', label: '로터리' },
  { methodKey: 'manual', label: '수동' },
];

async function loadMeatTypes() {
  const q = query(collection(db, 'meatTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
// [봉투 연동] 봉투 목록 로드 (drag-drop 순번 유지하려고 sortOrder 정렬, active만)
async function loadBagTypes() {
  const q = query(collection(db, 'bagTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function renderRecipe() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>레시피 로딩 중...</p></div>`;

  recipes = await loadRecipes();
  meatTypes = await loadMeatTypes();
  bagTypes = await loadBagTypes();  // [봉투 연동] raw 카테고리 봉투 선택용
  renderRecipeLayout();
}

async function loadRecipes() {
  const q = query(collection(db, 'recipes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderRecipeLayout() {
  const content = document.getElementById('mainContent');
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'office';
  content.innerHTML = `
    <div class="recipe-wrap">
      <!-- 왼쪽: 레시피 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">레시피 목록</span>
          ${canEdit ? '<button class="btn-primary" id="btnNewRecipe">+ 신규 추가</button>' : ''}
        </div>
        <div class="recipe-list" id="recipeList">
          ${renderRecipeList()}
        </div>
      </div>

      <!-- 오른쪽: 레시피 상세 -->
      <div class="recipe-detail-panel" id="recipeDetail">
        <div class="detail-empty">레시피를 선택하거나 새로 추가해주세요</div>
      </div>
    </div>
  `;

  bindRecipeListEvents();
  initRecipeSortables();
  document.getElementById('btnNewRecipe')?.addEventListener('click', showNewRecipeForm);
}

function renderRecipeListItem(r) {
  const canReorder = currentUserRole === 'admin' || currentUserRole === 'office';
  return `
    <div class="recipe-list-item ${selectedRecipeId === r.id ? 'active' : ''}" data-id="${r.id}" style="border-left-color: ${r.color || '#4A7C59'}">
      ${canReorder ? '<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>' : ''}
      <div class="recipe-list-info">
        <span class="recipe-name">${getDisplayName(r)}</span>
        <div class="recipe-tags">
          <span class="tag tag-${r.category}">${r.category === 'raw' ? '생식' : '동결'}</span>
          <span class="tag tag-${r.target}">${getTargetLabel(r.target)}</span>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" class="recipe-active-toggle" data-id="${r.id}" ${r.active ? 'checked' : ''} ${canReorder ? '' : 'disabled'}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

function renderRecipeList() {
  if (recipes.length === 0) return '<div class="list-empty">등록된 레시피 없음</div>';

  // 활성/비활성 분리: 활성은 카테고리별 sortable 섹션, 비활성은 하단 별도 섹션.
  const active = recipes.filter(r => r.active !== false);
  const inactive = recipes.filter(r => r.active === false);
  const rawActive = active.filter(r => r.category === 'raw');
  const freezeActive = active.filter(r => r.category === 'freezeDry');

  let html = '';
  if (rawActive.length > 0) {
    html += `<div class="list-group-label">생식</div>`;
    html += `<div class="sortable-master-list" id="recipeListRaw" data-category="raw">${rawActive.map(r => renderRecipeListItem(r)).join('')}</div>`;
  }
  if (freezeActive.length > 0) {
    html += `<div class="list-group-label">동결건조</div>`;
    html += `<div class="sortable-master-list" id="recipeListFreezeDry" data-category="freezeDry">${freezeActive.map(r => renderRecipeListItem(r)).join('')}</div>`;
  }
  if (inactive.length > 0) {
    html += `<div class="list-group-label list-group-label--inactive">비활성</div>`;
    html += `<div class="master-inactive-list">${inactive.map(r => renderRecipeListItem(r)).join('')}</div>`;
  }
  return html;
}

function getDisplayName(r) {
  const targetPrefix = r.target === 'cat' ? '고양이 ' : r.target === 'dog' ? '강아지 ' : '';
  return targetPrefix + r.name;
}

function getTargetLabel(target) {
  return target === 'cat' ? '고양이' : target === 'dog' ? '강아지' : '공용';
}

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '대표';
  if (currentUserRole === 'office') return '사무실';
  if (currentUserRole === 'production') return '생산실';
  return '시스템';
}

function getProductionMethodLabel(methodKey) {
  return PRODUCTION_METHOD_OPTIONS.find(m => m.methodKey === methodKey)?.label || methodKey;
}

function normalizeProductionMethods(methods) {
  if (!Array.isArray(methods)) return [];
  const seen = new Set();
  return methods
    .map(method => {
      const methodKey = method?.methodKey;
      if (!PRODUCTION_METHOD_OPTIONS.some(option => option.methodKey === methodKey) || seen.has(methodKey)) return null;
      seen.add(methodKey);
      const unitToBox = Number(method.unitToBox);
      return {
        methodKey,
        label: getProductionMethodLabel(methodKey),
        unitToBox: Number.isFinite(unitToBox) ? unitToBox : 0,
        effectiveDate: method.effectiveDate || getToday(),
        active: method.active !== false,
      };
    })
    .filter(Boolean);
}

function renderProductionMethodsSection(category) {
  const hiddenStyle = category === 'raw' ? '' : 'style="display:none"';
  return `
    <div class="form-row production-methods-row" id="productionMethodsSection" ${hiddenStyle}>
      <div class="form-group production-methods-group">
        <label>생산 방식별 환산값 (생식 한정)</label>
        <div class="production-methods-table" id="productionMethodsTable">
          ${renderProductionMethodRows()}
        </div>
        <div class="production-methods-actions">
          <select id="productionMethodAddSelect" class="production-method-add-select"></select>
          <button type="button" class="btn-secondary" id="btnAddProductionMethod">+ 방식 추가</button>
          <span class="production-methods-hint" id="productionMethodsHint"></span>
        </div>
      </div>
    </div>
  `;
}

function renderProductionMethodRows() {
  if (currentProductionMethods.length === 0) {
    return '<div class="production-methods-empty">등록된 생산 방식별 환산값이 없습니다.</div>';
  }
  return `
    <div class="production-methods-header">
      <span>방식</span>
      <span>단위 1 → 박스</span>
      <span>적용 시작일</span>
      <span>활성</span>
    </div>
    ${currentProductionMethods.map(method => `
      <div class="production-method-row" data-method-key="${method.methodKey}">
        <div class="production-method-label">${method.label || getProductionMethodLabel(method.methodKey)}</div>
        <input type="number" class="production-method-unit" value="${method.unitToBox || ''}" min="0.01" step="0.01" placeholder="0.83" />
        <input type="date" class="production-method-date" value="${method.effectiveDate || getToday()}" />
        <label class="production-method-active">
          <input type="checkbox" class="production-method-active-input" ${method.active !== false ? 'checked' : ''} />
        </label>
      </div>
    `).join('')}
  `;
}

function refreshProductionMethodsEditor() {
  const table = document.getElementById('productionMethodsTable');
  if (table) table.innerHTML = renderProductionMethodRows();

  const addSelect = document.getElementById('productionMethodAddSelect');
  const addButton = document.getElementById('btnAddProductionMethod');
  const hint = document.getElementById('productionMethodsHint');
  if (!addSelect || !addButton || !hint) return;

  const used = new Set(currentProductionMethods.map(m => m.methodKey));
  const unused = PRODUCTION_METHOD_OPTIONS.filter(option => !used.has(option.methodKey));
  addSelect.innerHTML = unused.map(option => `<option value="${option.methodKey}">${option.label}</option>`).join('');
  addSelect.disabled = unused.length === 0;
  addButton.disabled = unused.length === 0;
  hint.textContent = unused.length === 0 ? '더 추가할 방식이 없습니다' : '';
}

function bindProductionMethodEvents() {
  refreshProductionMethodsEditor();
  document.getElementById('btnAddProductionMethod')?.addEventListener('click', () => {
    const select = document.getElementById('productionMethodAddSelect');
    const methodKey = select?.value;
    if (!methodKey || currentProductionMethods.some(m => m.methodKey === methodKey)) return;
    currentProductionMethods.push({
      methodKey,
      label: getProductionMethodLabel(methodKey),
      unitToBox: 0,
      effectiveDate: getToday(),
      active: true,
    });
    refreshProductionMethodsEditor();
  });
}

function collectProductionMethods() {
  const rows = Array.from(document.querySelectorAll('.production-method-row'));
  const seen = new Set();
  const methods = [];
  for (const row of rows) {
    const methodKey = row.dataset.methodKey;
    if (!methodKey || seen.has(methodKey)) {
      alert('같은 생산방식은 중복 등록할 수 없습니다.');
      return null;
    }
    seen.add(methodKey);
    const unitToBox = Number(row.querySelector('.production-method-unit')?.value);
    const effectiveDate = row.querySelector('.production-method-date')?.value || '';
    if (!Number.isFinite(unitToBox) || unitToBox <= 0) {
      alert('환산값은 0보다 큰 숫자로 입력해주세요.');
      return null;
    }
    if (!effectiveDate) {
      alert('환산값 적용 시작일을 입력해주세요.');
      return null;
    }
    methods.push({
      methodKey,
      label: getProductionMethodLabel(methodKey),
      unitToBox,
      effectiveDate,
      active: row.querySelector('.production-method-active-input')?.checked !== false,
    });
  }
  return methods;
}

function getProductionMethodChanges(previousMethods, nextMethods) {
  const prevMap = new Map(normalizeProductionMethods(previousMethods).map(method => [method.methodKey, method]));
  return nextMethods
    .map(method => {
      const prev = prevMap.get(method.methodKey);
      if (!prev) {
        return {
          methodKey: method.methodKey,
          from: null,
          to: method.unitToBox,
          effectiveDate: method.effectiveDate,
        };
      }
      if (Number(prev.unitToBox) !== Number(method.unitToBox)) {
        return {
          methodKey: method.methodKey,
          from: Number(prev.unitToBox),
          to: method.unitToBox,
          effectiveDate: method.effectiveDate,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function addConversionHistoryToBatch(batch, recipeId, changes) {
  changes.forEach(change => {
    const ref = doc(collection(db, 'recipes', recipeId, 'conversionHistory'));
    batch.set(ref, {
      methodKey: change.methodKey,
      unitToBox: change.to,
      prevUnitToBox: change.from,
      effectiveDate: change.effectiveDate,
      reason: 'manual',
      basedOnAvgOfRecent5: false,
      createdAt: serverTimestamp(),
      createdBy: currentUser?.uid || null,
    });
  });
}

function getSupplementBaseDoc(recipeId, recipeData, unit, unitIndex) {
  const recipeName = recipeData.displayName || getDisplayName(recipeData);
  return {
    recipeId,
    recipeName,
    unit,
    name: makeSupplementName(recipeName, unit),
    active: recipeData.active !== false,
    sortOrder: makeSupplementSortOrder(recipeData.sortOrder, unitIndex),
    updatedAt: new Date(),
    updatedBy: currentUser?.uid || null,
  };
}

async function loadRecipeDeleteContext(recipe) {
  const [productionSnap, scheduleSnap, supplementTypeSnap] = await Promise.all([
    getDocs(query(collection(db, 'productions'), where('recipeId', '==', recipe.id))),
    getDocs(query(collection(db, 'schedules'), where('recipeId', '==', recipe.id))),
    getDocs(query(collection(db, 'supplementTypes'), where('recipeId', '==', recipe.id))),
  ]);

  const supplementSummaries = [];
  for (const skuDoc of supplementTypeSnap.docs) {
    const sku = { id: skuDoc.id, ...skuDoc.data() };
    const [stockSnap, logSnap] = await Promise.all([
      getDoc(doc(db, 'supplementStock', sku.id)),
      getDocs(query(collection(db, 'supplementLogs'), where('supplementTypeId', '==', sku.id))),
    ]);
    const stockQty = Number(stockSnap.data()?.currentQty || 0);
    supplementSummaries.push({
      sku,
      stockQty,
      stockExists: stockSnap.exists(),
      logDocs: logSnap.docs,
    });
  }

  return {
    productionCount: productionSnap.size,
    scheduleCount: scheduleSnap.size,
    supplementSummaries,
  };
}

async function loadSupplementDeleteSummaries(recipe, removedUnits) {
  const summaries = [];
  for (const unit of removedUnits) {
    const supplementTypeId = makeSupplementId(recipe.id, unit);
    const stockSnap = await getDoc(doc(db, 'supplementStock', supplementTypeId));
    const logSnap = await getDocs(query(
      collection(db, 'supplementLogs'),
      where('supplementTypeId', '==', supplementTypeId)
    ));
    const stockQty = Number(stockSnap.data()?.currentQty || 0);
    summaries.push({
      unit,
      supplementTypeId,
      name: makeSupplementName(getDisplayName(recipe), unit),
      stockQty,
      logCount: logSnap.size,
      logDocs: logSnap.docs,
    });
  }
  return summaries;
}

async function confirmSupplementPresetDeletion(recipe, removedUnits) {
  if (removedUnits.length === 0) return true;

  const summaries = await loadSupplementDeleteSummaries(recipe, removedUnits);
  const hasStock = summaries.some(s => s.stockQty > 0);

  if (hasStock && typeof window.openBlockingModal === 'function') {
    const ok = await window.openBlockingModal({
      variant: 'warning',
      data: {
        date: getToday(),
        warnings: summaries.map(s => ({
          reason: s.stockQty > 0
            ? `영양제 ${s.name} ${s.stockQty}봉이 있는데 정말 삭제하시겠습니까?`
            : `영양제 ${s.name}을 삭제합니다.`,
          details: [
            `생산단위: ${s.unit}`,
            `현재 재고: ${s.stockQty}봉`,
            `차감 이력: ${s.logCount}건`,
            '영양제 SKU, 재고, 이력이 함께 삭제됩니다.',
          ],
        })),
      },
    });
    return ok ? summaries : false;
  }

  const hasLogs = summaries.some(s => s.logCount > 0);
  const message = hasLogs
    ? summaries.map(s => s.logCount > 0
      ? `생산단위 ${s.unit}의 차감 이력이 ${s.logCount}건 있습니다. 삭제 시 이력도 함께 삭제됩니다.`
      : `생산단위 ${s.unit}을 프리셋에서 삭제합니다. 영양제 SKU도 함께 삭제됩니다.`
    ).join('\n')
    : summaries.map(s => `생산단위 ${s.unit}을 프리셋에서 삭제합니다. 영양제 SKU도 함께 삭제됩니다.`).join('\n');
  return window.confirm(`${message}\n진행하시겠습니까?`) ? summaries : false;
}

function bindRecipeListEvents() {
  document.querySelectorAll('.recipe-list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.toggle-switch')) return;
      if (e.target.closest('.drag-handle')) return;
      const id = item.dataset.id;
      selectedRecipeId = id;
      const recipe = recipes.find(r => r.id === id);
      showRecipeDetail(recipe);
      document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  document.querySelectorAll('.recipe-active-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;
      const id = e.target.dataset.id;
      const active = e.target.checked;
      const recipe = recipes.find(r => r.id === id);
      const previousActive = recipe?.active !== false;
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'recipes', id), {
          active,
          updatedAt: new Date(),
        });
        const skuSnap = await getDocs(query(
          collection(db, 'supplementTypes'),
          where('recipeId', '==', id)
        ));
        skuSnap.docs.forEach(skuDoc => {
          batch.update(doc(db, 'supplementTypes', skuDoc.id), {
            active,
            updatedAt: new Date(),
            updatedBy: currentUser?.uid || null,
          });
        });
        await batch.commit();
        if (recipe) recipe.active = active;
        if (previousActive !== active) {
          await recordActivity({
            action: 'recipe',
            subAction: 'activeToggle',
            date: getToday(),
            staff: getRoleStaffLabel(),
            message: `Recipe ${active ? 'active' : 'inactive'} — ${recipe ? getDisplayName(recipe) : id}`,
            details: {
              recipeId: id,
              recipeName: recipe ? getDisplayName(recipe) : null,
              active,
            },
          });
        }
      } catch (err) {
        console.error('[recipe] active save failed:', err);
        alert('활성 상태 저장 중 오류가 발생했습니다.');
        e.target.checked = !active;
      }
    });
  });
}

function initRecipeSortables() {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;

  [
    ['recipeListRaw', 'raw'],
    ['recipeListFreezeDry', 'freezeDry'],
  ].forEach(([elementId, category]) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: async (evt) => {
        if (evt.oldIndex === evt.newIndex) return;
        await persistRecipeOrder(category);
      },
    });
  });
}

async function persistRecipeOrder(category) {
  const rawItems = Array.from(document.getElementById('recipeListRaw')?.querySelectorAll('.recipe-list-item') || []);
  const freezeDryItems = Array.from(document.getElementById('recipeListFreezeDry')?.querySelectorAll('.recipe-list-item') || []);
  const ordered = [
    ...rawItems.map((item, idx) => ({ id: item.dataset.id, sortOrder: idx })),
    ...freezeDryItems.map((item, idx) => ({ id: item.dataset.id, sortOrder: rawItems.length + idx })),
  ].filter(item => item.id);
  if (ordered.length === 0) return;
  if (ordered.length > 450) {
    alert('순번 저장 항목이 너무 많습니다. 관리자에게 문의해주세요.');
    return;
  }

  const now = new Date();
  const batch = writeBatch(db);
  const sortMap = new Map(ordered.map(item => [item.id, item.sortOrder]));
  const affectedRecipes = recipes.filter(recipe => sortMap.has(recipe.id));
  const supplementSnapshots = await Promise.all(affectedRecipes.map(async recipe => ({
    recipe,
    snap: await getDocs(query(collection(db, 'supplementTypes'), where('recipeId', '==', recipe.id))),
  })));
  let opCount = 0;

  ordered.forEach(({ id, sortOrder }) => {
    batch.update(doc(db, 'recipes', id), {
      sortOrder,
      updatedAt: now,
    });
    opCount += 1;
  });

  supplementSnapshots.forEach(({ recipe, snap }) => {
    const sortOrder = sortMap.get(recipe.id);
    const unitPresets = Array.isArray(recipe.unitPresets) ? recipe.unitPresets : [];
    snap.docs.forEach(skuDoc => {
      const unitIndex = unitPresets.indexOf(skuDoc.data().unit);
      if (unitIndex < 0) return;
      batch.update(doc(db, 'supplementTypes', skuDoc.id), {
        sortOrder: makeSupplementSortOrder(sortOrder, unitIndex),
        updatedAt: now,
        updatedBy: currentUser?.uid || null,
      });
      opCount += 1;
    });
  });

  if (opCount > 500) {
    alert('순번 저장 항목이 너무 많습니다. 관리자에게 문의해주세요.');
    return;
  }

  try {
    await batch.commit();
    recipes = recipes
      .map(recipe => sortMap.has(recipe.id) ? { ...recipe, sortOrder: sortMap.get(recipe.id), updatedAt: now } : recipe)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (err) {
    console.error('[recipe] reorder save failed:', err);
    alert('순번 저장 실패: ' + (err.message || err));
    recipes = await loadRecipes();
    renderRecipeLayout();
    if (selectedRecipeId) {
      const selected = recipes.find(r => r.id === selectedRecipeId);
      if (selected) showRecipeDetail(selected);
    }
  }
}

function showNewRecipeForm() {
  selectedRecipeId = null;
  document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
  showRecipeDetail(null);
}

function showRecipeDetail(recipe) {
  const detail = document.getElementById('recipeDetail');
  const isNew = !recipe;
  const canEdit = currentUserRole === 'admin' || currentUserRole === 'office';
  currentUnitPresets = Array.isArray(recipe?.unitPresets) ? [...recipe.unitPresets] : [];
  currentProductionMethods = normalizeProductionMethods(recipe?.productionMethods);

  detail.innerHTML = `
    <div class="detail-header">
      <span class="detail-title">${isNew ? '새 레시피' : getDisplayName(recipe)}</span>
      <div class="detail-actions">
        ${canEdit ? '<button class="btn-primary" id="btnSaveRecipe">저장</button>' : ''}
        ${!isNew && canEdit ? '<button class="btn-danger" id="btnDeleteRecipe">삭제</button>' : ''}
      </div>
    </div>

    <div class="detail-body">
      <!-- 기본 정보 -->
      <div class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>레시피명 *</label>
            <input type="text" id="recipeName" value="${recipe?.name || ''}" placeholder="레시피명 입력" />
          </div>
          <div class="form-group">
            <label>카테고리 *</label>
            <select id="recipeCategory">
              <option value="">선택</option>
              <option value="raw" ${recipe?.category === 'raw' ? 'selected' : ''}>생식</option>
              <option value="freezeDry" ${recipe?.category === 'freezeDry' ? 'selected' : ''}>동결건조</option>
            </select>
          </div>
          <div class="form-group">
            <label>대상 *</label>
            <select id="recipeTarget">
              <option value="">선택</option>
              <option value="cat" ${recipe?.target === 'cat' ? 'selected' : ''}>고양이</option>
              <option value="dog" ${recipe?.target === 'dog' ? 'selected' : ''}>강아지</option>
              <option value="common" ${recipe?.target === 'common' ? 'selected' : ''}>공용</option>
            </select>
          </div>
          <div class="form-group">
            <label>카드 색상</label>
            <input type="color" id="recipeColor" value="${recipe?.color || '#4A7C59'}" style="height:36px;width:60px;padding:2px;" />
          </div>
        </div>
        <!-- [봉투 연동] raw 카테고리 폼: 팩당 중량 + 봉투 선택 -->
        <div class="form-row" id="rawFields" style="${recipe?.category !== 'raw' && recipe?.category ? 'display:none' : ''}">
          <div class="form-group">
            <label>팩당 중량 (g)</label>
            <input type="number" id="packWeightG" value="${recipe?.packWeightG || ''}" placeholder="예: 75" />
          </div>
          <div class="form-group">
            <label>판당 팩수 (팩/판)</label>
            <input type="number" id="recipePacksPerPlate" value="${recipe?.packsPerPlate || ''}" placeholder="비우면 설정 기본값" />
          </div>
          <div class="form-group">
            <label>사용 봉투 *</label>
            <select id="recipeBagType">
              <option value="">선택</option>
              ${bagTypes
                .filter(b => b.active !== false || recipe?.bagTypeId === b.id)
                .map(b => `<option value="${b.id}" ${recipe?.bagTypeId === b.id ? 'selected' : ''}>${b.name}${b.active === false ? ' (비활성)' : ''}</option>`)
                .join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>비고</label>
            <input type="text" id="recipeNote" value="${recipe?.note || ''}" placeholder="비고" />
          </div>
        </div>
        <div id="freezeDryFields" style="${recipe?.category !== 'freezeDry' ? 'display:none' : ''}">
          <div class="form-row">
            <div class="form-group">
              <label>생산단위 1당 봉지수</label>
              <input type="number" id="freezeDryBagCount" value="${recipe?.freezeDryBagCountPerUnit || ''}" />
            </div>
            <div class="form-group" id="breadPanCountGroup" style="${recipe?.requiresSeparation === false ? 'display:none' : ''}">
              <label>생산단위 1당 빵판수</label>
              <input type="number" id="breadPanCount" value="${recipe?.breadPanCountPerUnit || ''}" />
            </div>
            <div class="form-group">
              <label>생산단위 1당 동결판수</label>
              <input type="number" id="freezePanCount" value="${recipe?.freezePanCountPerUnit || ''}" />
            </div>
            <div class="form-group">
              <label>분리작업 필요</label>
              <select id="requiresSeparation">
                <option value="false" ${!recipe?.requiresSeparation ? 'selected' : ''}>아니오</option>
                <option value="true" ${recipe?.requiresSeparation ? 'selected' : ''}>예</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group unit-preset-group">
            <label>생산단위 프리셋</label>
            <div class="unit-preset-input-row">
              <input type="text" id="unitPresetInput" inputmode="decimal" placeholder="예: 10" />
              <button type="button" class="btn-secondary" id="btnAddUnitPreset">+ 추가</button>
            </div>
            <div class="unit-preset-chip-list" id="unitPresetChipList">
              ${renderUnitPresetChips()}
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="recipeUsesSupplement" ${recipe?.usesSupplement === false ? '' : 'checked'}>
              <span>영양제 사용</span>
            </label>
            <p class="hint-text" style="margin-top:4px;">체크 해제 시 이 레시피는 영양제 SKU·자동차감을 쓰지 않습니다 (예: 텐더동결).</p>
          </div>
        </div>
        ${renderProductionMethodsSection(recipe?.category)}
      </div>

      <!-- 원료 테이블 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">원료 목록</span>
          <button class="btn-secondary" id="btnAddIngredient">+ 행 추가</button>
        </div>
        <div class="table-wrap">
          <table class="data-table" id="ingredientTable">
            <thead>
              <tr>
                <th>원료명</th>
                <th>기준 중량</th>
                <th>생산단위</th>
                <th>단위명</th>
                <th>재고연동</th>
                <th>원육 종류</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="ingredientBody">
              ${renderIngredientRows(recipe?.ingredients || [])}
            </tbody>
          </table>
        </div>
        <p class="hint-text">💡 엑셀에서 원료명, 기준중량 복사 후 첫 셀에 붙여넣기 가능</p>
      </div>
    </div>
  `;

  const updateFieldVisibility = () => {
    const category = document.getElementById('recipeCategory').value;
    const requiresSeparation = document.getElementById('requiresSeparation')?.value === 'true';
    document.getElementById('rawFields').style.display = category === 'raw' ? '' : 'none';
    document.getElementById('freezeDryFields').style.display = category === 'freezeDry' ? '' : 'none';
    const productionMethodsSection = document.getElementById('productionMethodsSection');
    if (productionMethodsSection) productionMethodsSection.style.display = category === 'raw' ? '' : 'none';
    const breadPanGroup = document.getElementById('breadPanCountGroup');
    if (breadPanGroup) {
      breadPanGroup.style.display = category === 'freezeDry' && requiresSeparation ? '' : 'none';
    }
  };
  document.getElementById('recipeCategory').addEventListener('change', updateFieldVisibility);
  document.getElementById('requiresSeparation')?.addEventListener('change', updateFieldVisibility);
  updateFieldVisibility();
  bindUnitPresetEvents();
  bindProductionMethodEvents();

  // 행 추가
  document.getElementById('btnAddIngredient').addEventListener('click', () => {
    const tbody = document.getElementById('ingredientBody');
    const idx = tbody.querySelectorAll('tr').length;
    tbody.insertAdjacentHTML('beforeend', renderIngredientRow({}, idx));
    bindIngredientEvents();
  });

  // 엑셀 붙여넣기
  document.getElementById('ingredientBody').addEventListener('paste', handleIngredientPaste);

  bindIngredientEvents();

  // 저장
  document.getElementById('btnSaveRecipe')?.addEventListener('click', () => saveRecipe(recipe?.id));

  // 삭제
  document.getElementById('btnDeleteRecipe')?.addEventListener('click', () => deleteRecipe(recipe));
}

function getRecipeDeleteMessage(recipe, supplementSummaries) {
  const supplementSkuCount = supplementSummaries.length;
  const supplementTotalQty = supplementSummaries.reduce((sum, s) => sum + s.stockQty, 0);
  const supplementLogCount = supplementSummaries.reduce((sum, s) => sum + s.logDocs.length, 0);
  const stockLines = supplementSummaries
    .filter(s => s.stockQty > 0)
    .map(s => `${s.sku.name || s.sku.id} ${s.stockQty}봉`);

  if (stockLines.length > 0) {
    return `영양제 재고가 남아있습니다.\n${stockLines.join('\n')}\n\n레시피와 영양제 SKU ${supplementSkuCount}개, 영양제 이력 ${supplementLogCount}건이 모두 삭제됩니다.\n진행하시겠습니까?`;
  }
  if (supplementLogCount > 0) {
    return `영양제 이력 ${supplementLogCount}건이 함께 삭제됩니다.\n레시피와 영양제 SKU ${supplementSkuCount}개를 삭제하시겠습니까?`;
  }
  if (supplementSkuCount > 0) {
    return `레시피와 영양제 SKU ${supplementSkuCount}개를 삭제하시겠습니까?`;
  }
  return `${getDisplayName(recipe)} 레시피를 삭제하시겠습니까?`;
}

async function deleteRecipe(recipe) {
  if (!recipe?.id) return;
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
    alert('레시피 삭제는 대표/사무실 계정만 가능합니다.');
    return;
  }

  try {
    const context = await loadRecipeDeleteContext(recipe);
    if (context.productionCount > 0) {
      alert(`이 레시피로 만든 생산 기록이 ${context.productionCount}건 있어 삭제할 수 없습니다.\n비활성화로 처리해주세요.`);
      return;
    }
    if (context.scheduleCount > 0) {
      alert(`입고 예정 ${context.scheduleCount}건이 있어 삭제할 수 없습니다.`);
      return;
    }

    const confirmed = await showConfirmModal({
      title: '레시피 삭제',
      message: getRecipeDeleteMessage(recipe, context.supplementSummaries),
      confirmText: '삭제',
      danger: true,
    });
    if (!confirmed) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'recipes', recipe.id));
    context.supplementSummaries.forEach(summary => {
      batch.delete(doc(db, 'supplementTypes', summary.sku.id));
      if (summary.stockExists) {
        batch.delete(doc(db, 'supplementStock', summary.sku.id));
      }
      summary.logDocs.forEach(logDoc => {
        batch.delete(doc(db, 'supplementLogs', logDoc.id));
      });
    });
    await batch.commit();

    const supplementSkuCount = context.supplementSummaries.length;
    const supplementTotalQty = context.supplementSummaries.reduce((sum, s) => sum + s.stockQty, 0);
    const supplementLogCount = context.supplementSummaries.reduce((sum, s) => sum + s.logDocs.length, 0);
    await recordActivity({
      action: 'recipe',
      subAction: 'delete',
      date: getToday(),
      staff: getRoleStaffLabel(),
      message: `레시피 삭제 — ${getDisplayName(recipe)}`,
      details: {
        recipeId: recipe.id,
        recipeName: getDisplayName(recipe),
        category: recipe.category === 'freezeDry' ? 'dried' : 'raw',
        supplementSkuCount,
        supplementTotalQty,
        supplementLogCount,
      },
    });

    selectedRecipeId = null;
    recipes = await loadRecipes();
    renderRecipeLayout();
    alert('레시피가 삭제되었습니다.');
  } catch (err) {
    console.error('[recipe] delete failed:', err);
    alert('레시피 삭제 중 오류가 발생했습니다.');
  }
}

function renderUnitPresetChips() {
  if (!currentUnitPresets.length) {
    return '<div class="unit-preset-empty">등록된 프리셋 없음</div>';
  }

  return currentUnitPresets.map((unit, idx) => `
    <span class="unit-preset-chip">
      <span>${unit}</span>
      <button type="button" class="unit-preset-remove" data-idx="${idx}" aria-label="${unit} 삭제">×</button>
    </span>
  `).join('');
}

function refreshUnitPresetChips() {
  const list = document.getElementById('unitPresetChipList');
  if (list) {
    list.innerHTML = renderUnitPresetChips();
  }
}

function addUnitPresetFromInput() {
  const input = document.getElementById('unitPresetInput');
  if (!input) return;

  const rawValue = input.value.trim();
  if (!rawValue) return;

  const unit = Number(rawValue);
  if (Number.isNaN(unit)) {
    alert('숫자만 입력 가능합니다');
    return;
  }
  if (unit <= 0) {
    alert('0보다 큰 숫자를 입력해주세요');
    return;
  }
  if (currentUnitPresets.includes(unit)) {
    alert('이미 추가된 생산단위입니다');
    return;
  }

  currentUnitPresets.push(unit);
  input.value = '';
  refreshUnitPresetChips();
}

function bindUnitPresetEvents() {
  const addButton = document.getElementById('btnAddUnitPreset');
  const input = document.getElementById('unitPresetInput');
  const chipList = document.getElementById('unitPresetChipList');

  addButton?.addEventListener('click', addUnitPresetFromInput);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addUnitPresetFromInput();
    }
  });
  chipList?.addEventListener('click', (e) => {
    const button = e.target.closest('.unit-preset-remove');
    if (!button) return;
    currentUnitPresets.splice(Number(button.dataset.idx), 1);
    refreshUnitPresetChips();
  });
}

function renderIngredientRows(ingredients) {
  if (ingredients.length === 0) return renderIngredientRow({}, 0);
  return ingredients.map((ing, i) => renderIngredientRow(ing, i)).join('');
}

function getIngredientWeightDisplay(ing) {
  const baseWeightG = Number(ing.baseWeightG || 0);
  if (!baseWeightG) return '';
  return ing.weightDisplayUnit === 'kg' ? baseWeightG / 1000 : baseWeightG;
}

function renderIngredientRow(ing, idx) {
  // 기본값: 신규 행은 재고연동 ON, 기존 행은 저장된 값 유지
  const isLinked = ing.linkedToInventory === true || ing.autoDeductInventory === true || (ing.linkedToInventory === undefined && ing.autoDeductInventory === undefined);
  const weightDisplayUnit = ing.weightDisplayUnit === 'kg' ? 'kg' : 'g';
  const displayWeight = getIngredientWeightDisplay(ing);
  const meatOptions = meatTypes
    .filter(m => m.active !== false || ing.meatTypeId === m.id)
    .map(m => `<option value="${m.id}" ${ing.meatTypeId === m.id ? 'selected' : ''}>${m.name}</option>`)
    .join('');

  return `
    <tr data-idx="${idx}">
      <td><input type="text" class="ing-name cell-input" value="${ing.name || ''}" placeholder="원료명" /></td>
      <td>
        <div class="ingredient-weight-control">
          <input type="number" class="ing-weight cell-input" value="${displayWeight}" placeholder="${weightDisplayUnit}" step="0.001" />
          <select class="ing-weight-unit">
            <option value="g" ${weightDisplayUnit === 'g' ? 'selected' : ''}>g</option>
            <option value="kg" ${weightDisplayUnit === 'kg' ? 'selected' : ''}>kg</option>
          </select>
        </div>
      </td>
      <td style="text-align:center">
        <input type="radio" name="productionUnit" class="ing-unit-radio" value="${idx}" ${ing.isProductionUnit ? 'checked' : ''} />
      </td>
      <td><input type="text" class="ing-unit-name cell-input" value="${ing.unitName || ''}" placeholder="예: 마리" /></td>
      <td style="text-align:center">
        <input type="checkbox" class="ing-linked" ${isLinked ? 'checked' : ''} />
      </td>
      <td>
        <select class="ing-meat-type" ${isLinked ? '' : 'style="display:none"'}>
          <option value="">선택</option>
          ${meatOptions}
        </select>
      </td>
      <td><button class="btn-del-row">✕</button></td>
    </tr>
  `;
}

function bindIngredientEvents() {
  document.querySelectorAll('.btn-del-row').forEach(btn => {
    btn.onclick = () => {
      const tr = btn.closest('tr');
      tr.remove();
    };
  });

  // 재고연동 토글 → 드롭다운 표시/숨김
  document.querySelectorAll('.ing-linked').forEach(cb => {
    cb.onchange = (e) => {
      const tr = e.target.closest('tr');
      const select = tr.querySelector('.ing-meat-type');
      if (e.target.checked) {
        select.style.display = '';
      } else {
        select.style.display = 'none';
        select.value = '';
      }
    };
  });

  document.querySelectorAll('.ing-weight-unit').forEach(select => {
    select.onchange = (e) => {
      const tr = e.target.closest('tr');
      const input = tr.querySelector('.ing-weight');
      const previousUnit = e.target.dataset.previousUnit || 'g';
      const nextUnit = e.target.value;
      const value = parseFloat(input.value);
      if (Number.isFinite(value)) {
        const weightG = value * (previousUnit === 'kg' ? 1000 : 1);
        input.value = nextUnit === 'kg'
          ? Number((weightG / 1000).toFixed(3))
          : Number(weightG.toFixed(1));
      }
      e.target.dataset.previousUnit = nextUnit;
      input.placeholder = nextUnit;
    };
    select.dataset.previousUnit = select.value;
  });
}

function handleIngredientPaste(e) {
  const text = e.clipboardData.getData('text');
  // 단일 값(탭/줄바꿈 없음)은 기본 붙여넣기를 허용한다.
  if (!text.includes('\t') && !text.includes('\n')) return;
  e.preventDefault();
  const rows = text.trim().split('\n');
  const tbody = document.getElementById('ingredientBody');
  const startTr = e.target.closest('tr');
  const startIdx = startTr ? [...tbody.querySelectorAll('tr')].indexOf(startTr) : 0;

  rows.forEach((row, i) => {
    const cols = row.split('\t');
    const name = cols[0]?.trim() || '';
    const weight = cols[1]?.trim() || '';

    // 원육명 매칭 → 재고연동 자동 ON + meatTypeId 세팅
    const matchedMeat = meatTypes.find(m => m.active !== false && m.name === name);
    const linkedToInventory = !!matchedMeat;
    const meatTypeId = matchedMeat?.id || null;

    const existingRows = tbody.querySelectorAll('tr');
    const targetIdx = startIdx + i;
    if (existingRows[targetIdx]) {
      const tr = existingRows[targetIdx];
      tr.querySelector('.ing-name').value = name;
      tr.querySelector('.ing-weight').value = weight;
      const weightUnitSelect = tr.querySelector('.ing-weight-unit');
      if (weightUnitSelect) {
        weightUnitSelect.value = 'g';
        weightUnitSelect.dataset.previousUnit = 'g';
      }
      const linkedCb = tr.querySelector('.ing-linked');
      const meatSelect = tr.querySelector('.ing-meat-type');
      linkedCb.checked = linkedToInventory;
      if (linkedToInventory) {
        meatSelect.style.display = '';
        meatSelect.value = meatTypeId;
      } else {
        meatSelect.style.display = 'none';
        meatSelect.value = '';
      }
    } else {
      const idx = tbody.querySelectorAll('tr').length;
      tbody.insertAdjacentHTML('beforeend', renderIngredientRow({
        name,
        baseWeightG: weight,
        weightDisplayUnit: 'g',
        linkedToInventory,
        meatTypeId,
      }, idx));
      bindIngredientEvents();
    }
  });
}

function getIngredients() {
  const rows = document.querySelectorAll('#ingredientBody tr');
  return Array.from(rows).map((row, idx) => {
    const linked = row.querySelector('.ing-linked').checked;
    const meatTypeId = linked ? (row.querySelector('.ing-meat-type').value || null) : null;
    const weightDisplayUnit = row.querySelector('.ing-weight-unit')?.value === 'kg' ? 'kg' : 'g';
    const displayWeight = parseFloat(row.querySelector('.ing-weight').value) || 0;
    // baseWeightG is always grams per 1 production unit.
    const baseWeightG = displayWeight * (weightDisplayUnit === 'kg' ? 1000 : 1);
    return {
      id: Date.now().toString() + idx,
      name: row.querySelector('.ing-name').value.trim(),
      baseWeightG,
      weightDisplayUnit,
      isProductionUnit: row.querySelector('.ing-unit-radio').checked,
      unitName: row.querySelector('.ing-unit-name').value.trim(),
      autoDeductInventory: linked,
      linkedToInventory: linked,
      meatTypeId,
      sortOrder: idx,
    };
  }).filter(ing => ing.name);
}

async function saveRecipe(id) {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
    alert('레시피 저장은 대표/사무실 계정만 가능합니다.');
    return;
  }
  const name = document.getElementById('recipeName').value.trim();
  const category = document.getElementById('recipeCategory').value;
  const target = document.getElementById('recipeTarget').value;
  const existingRecipe = id ? recipes.find(r => r.id === id) : null;
  const previousUnitPresets = Array.isArray(existingRecipe?.unitPresets) ? existingRecipe.unitPresets : [];
  const previousProductionMethods = normalizeProductionMethods(existingRecipe?.productionMethods);

  if (!name || !category || !target) {
    alert('레시피명, 카테고리, 대상은 필수입니다.');
    return;
  }

  const usesSupplement = document.getElementById('recipeUsesSupplement')?.checked ?? true;
  const targetPrefix = target === 'cat' ? '고양이 ' : target === 'dog' ? '강아지 ' : '';
  const data = {
    name,
    displayName: targetPrefix + name,
    category,
    target,
    color: document.getElementById('recipeColor').value,
    note: document.getElementById('recipeNote').value.trim(),
    active: id ? existingRecipe?.active !== false : true,
    sortOrder: id ? existingRecipe?.sortOrder ?? recipes.length : recipes.length,
    ingredients: getIngredients(),
    unitPresets: [...currentUnitPresets],
    usesSupplement,
    version: 1,
    updatedAt: new Date(),
  };

  // 영양제 미사용 레시피는 supplementType을 만들지 않음 (예: 텐더동결).
  // toggle을 끄면 supplementUnits=[] → 기존 SKU/재고/이력이 removedUnits로 정리됨.
  const supplementUnits = usesSupplement ? data.unitPresets : [];

  if (category === 'raw') {
    data.packWeightG = parseFloat(document.getElementById('packWeightG').value) || null;
    // 판당 팩수 레시피별 오버라이드 — 비우면 null(설정 기본값 사용). 예: 램/래빗 55g = 180
    data.packsPerPlate = parseInt(document.getElementById('recipePacksPerPlate')?.value, 10) || null;
    // [봉투 연동] 사용 봉투 필수 — 빈값이면 저장 차단
    const selectedBagId = document.getElementById('recipeBagType')?.value || '';
    if (!selectedBagId) {
      alert('생식 레시피는 사용 봉투를 선택해야 합니다.');
      return;
    }
    data.bagTypeId = selectedBagId;
    const productionMethods = collectProductionMethods();
    if (productionMethods === null) return;
    data.productionMethods = productionMethods;
  } else {
    data.productionMethods = [];
  }

  if (category === 'freezeDry') {
    const requiresSeparation = document.getElementById('requiresSeparation').value === 'true';
    data.freezeDryBagCountPerUnit = parseFloat(document.getElementById('freezeDryBagCount').value) || null;
    data.breadPanCountPerUnit = requiresSeparation ? (parseFloat(document.getElementById('breadPanCount').value) || null) : 0;
    data.freezePanCountPerUnit = parseFloat(document.getElementById('freezePanCount').value) || null;
    data.requiresSeparation = requiresSeparation;
  }

  const conversionChanges = category === 'raw'
    ? getProductionMethodChanges(previousProductionMethods, data.productionMethods)
    : [];

  try {
    if (id) {
      const removedUnits = previousUnitPresets.filter(unit => !supplementUnits.includes(unit));
      const deleteSummaries = await confirmSupplementPresetDeletion({ id, ...existingRecipe }, removedUnits);
      if (deleteSummaries === false) {
        currentUnitPresets = [...previousUnitPresets];
        refreshUnitPresetChips();
        return;
      }

      const existingSkuStates = await Promise.all(supplementUnits.map(async (unit) => {
        const supplementTypeId = makeSupplementId(id, unit);
        const [typeSnap, stockSnap] = await Promise.all([
          getDoc(doc(db, 'supplementTypes', supplementTypeId)),
          getDoc(doc(db, 'supplementStock', supplementTypeId)),
        ]);
        return { unit, supplementTypeId, hasType: typeSnap.exists(), hasStock: stockSnap.exists() };
      }));
      const existingSkuStateMap = new Map(existingSkuStates.map(s => [s.unit, s]));

      const batch = writeBatch(db);
      batch.update(doc(db, 'recipes', id), data);
      addConversionHistoryToBatch(batch, id, conversionChanges);

      const deleteSummaryMap = new Map((Array.isArray(deleteSummaries) ? deleteSummaries : []).map(s => [s.unit, s]));
      supplementUnits.forEach((unit, idx) => {
        const supplementTypeId = makeSupplementId(id, unit);
        const baseDoc = getSupplementBaseDoc(id, data, unit, idx);
        const skuState = existingSkuStateMap.get(unit);
        if (previousUnitPresets.includes(unit) && skuState?.hasType) {
          batch.update(doc(db, 'supplementTypes', supplementTypeId), baseDoc);
        } else {
          batch.set(doc(db, 'supplementTypes', supplementTypeId), {
            id: supplementTypeId,
            ...baseDoc,
            createdAt: new Date(),
            createdBy: currentUser?.uid || null,
          });
        }
        if (!previousUnitPresets.includes(unit) || !skuState?.hasStock) {
          batch.set(doc(db, 'supplementStock', supplementTypeId), {
            id: supplementTypeId,
            supplementTypeId,
            currentQty: 0,
            updatedAt: new Date(),
          });
        }
      });

      removedUnits.forEach(unit => {
        const summary = deleteSummaryMap.get(unit);
        const supplementTypeId = makeSupplementId(id, unit);
        batch.delete(doc(db, 'supplementTypes', supplementTypeId));
        batch.delete(doc(db, 'supplementStock', supplementTypeId));
        (summary?.logDocs || []).forEach(logDoc => {
          batch.delete(doc(db, 'supplementLogs', logDoc.id));
        });
      });

      await batch.commit();
      selectedRecipeId = id;
    } else {
      data.createdAt = new Date();
      data.createdBy = currentUser?.uid || null;
      data.updatedBy = currentUser?.uid || null;
      const ref = doc(collection(db, 'recipes'));
      const batch = writeBatch(db);
      batch.set(ref, data);
      addConversionHistoryToBatch(batch, ref.id, conversionChanges);
      supplementUnits.forEach((unit, idx) => {
        const supplementTypeId = makeSupplementId(ref.id, unit);
        const baseDoc = getSupplementBaseDoc(ref.id, data, unit, idx);
        batch.set(doc(db, 'supplementTypes', supplementTypeId), {
          id: supplementTypeId,
          ...baseDoc,
          createdAt: new Date(),
          createdBy: currentUser?.uid || null,
        });
        batch.set(doc(db, 'supplementStock', supplementTypeId), {
          id: supplementTypeId,
          supplementTypeId,
          currentQty: 0,
          updatedAt: new Date(),
        });
      });
      await batch.commit();
      selectedRecipeId = ref.id;
    }
  } catch (err) {
    console.error('[recipe] save failed:', err);
    alert('레시피 저장 중 오류가 발생했습니다.');
    return;
  }

  if (conversionChanges.length > 0) {
    try {
      await recordActivity({
        action: 'conversion',
        subAction: 'manualEdit',
        date: getToday(),
        staff: getRoleStaffLabel(),
        message: `환산값 변경 - ${data.displayName}`,
        details: {
          recipeId: selectedRecipeId,
          recipeName: data.displayName,
          changes: conversionChanges,
        },
      });
    } catch (err) {
      console.error('[recipe] conversion activity log failed:', err);
    }
  }

  recipes = await loadRecipes();
  renderRecipeLayout();

  // 저장 후 해당 레시피 선택 상태 유지
  if (selectedRecipeId) {
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (recipe) {
      showRecipeDetail(recipe);
      document.querySelector(`[data-id="${selectedRecipeId}"]`)?.classList.add('active');
    }
  }

  alert('저장되었습니다.');
}
