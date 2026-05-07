import { db } from '../firebase.js';
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, query, orderBy
} from 'firebase/firestore';
import { showConfirmModal } from '../utils/modal.js';

let recipes = [];
let selectedRecipeId = null;

let meatTypes = [];

async function loadMeatTypes() {
  const q = query(collection(db, 'meatTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function renderRecipe() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>레시피 로딩 중...</p></div>`;

  recipes = await loadRecipes();
  meatTypes = await loadMeatTypes();
  renderRecipeLayout();
}

async function loadRecipes() {
  const q = query(collection(db, 'recipes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderRecipeLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="recipe-wrap">
      <!-- 왼쪽: 레시피 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">레시피 목록</span>
          <button class="btn-primary" id="btnNewRecipe">+ 신규 추가</button>
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
  document.getElementById('btnNewRecipe').addEventListener('click', showNewRecipeForm);
}

function renderRecipeList() {
  if (recipes.length === 0) return '<div class="list-empty">등록된 레시피 없음</div>';
  
  return recipes.map(r => `
    <div class="recipe-list-item ${selectedRecipeId === r.id ? 'active' : ''}" data-id="${r.id}" style="border-left-color: ${r.color || '#4A7C59'}">
      <div class="recipe-list-info">
        <span class="recipe-name">${getDisplayName(r)}</span>
        <div class="recipe-tags">
          <span class="tag tag-${r.category}">${r.category === 'raw' ? '생식' : '동결'}</span>
          <span class="tag tag-${r.target}">${getTargetLabel(r.target)}</span>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" class="recipe-active-toggle" data-id="${r.id}" ${r.active ? 'checked' : ''}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `).join('');
}

function getDisplayName(r) {
  const targetPrefix = r.target === 'cat' ? '고양이 ' : r.target === 'dog' ? '강아지 ' : '';
  return targetPrefix + r.name;
}

function getTargetLabel(target) {
  return target === 'cat' ? '고양이' : target === 'dog' ? '강아지' : '공용';
}

function bindRecipeListEvents() {
  document.querySelectorAll('.recipe-list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.toggle-switch')) return;
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
      const id = e.target.dataset.id;
      const active = e.target.checked;
      await updateDoc(doc(db, 'recipes', id), { active });
      const recipe = recipes.find(r => r.id === id);
      if (recipe) recipe.active = active;
    });
  });
}

function showNewRecipeForm() {
  selectedRecipeId = null;
  document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
  showRecipeDetail(null);
}

function showRecipeDetail(recipe) {
  const detail = document.getElementById('recipeDetail');
  const isNew = !recipe;

  detail.innerHTML = `
    <div class="detail-header">
      <span class="detail-title">${isNew ? '새 레시피' : getDisplayName(recipe)}</span>
      <div class="detail-actions">
        ${!isNew ? `<button class="btn-danger" id="btnDeleteRecipe">삭제</button>` : ''}
        <button class="btn-primary" id="btnSaveRecipe">저장</button>
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
        <div class="form-row">
          <div class="form-group" id="rawFields" style="${recipe?.category !== 'raw' && recipe?.category ? 'display:none' : ''}">
            <label>팩당 중량 (g)</label>
            <input type="number" id="packWeightG" value="${recipe?.packWeightG || ''}" placeholder="예: 75" />
          </div>
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
            <div class="form-group">
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
                <th>기준 중량 (g)</th>
                <th>생산단위</th>
                <th>단위명</th>
                <th>자동차감</th>
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

  // 카테고리 변경 시 필드 표시/숨김
  document.getElementById('recipeCategory').addEventListener('change', (e) => {
    const val = e.target.value;
    document.getElementById('rawFields').style.display = val === 'raw' ? '' : 'none';
    document.getElementById('freezeDryFields').style.display = val === 'freezeDry' ? '' : 'none';
  });

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
  document.getElementById('btnSaveRecipe').addEventListener('click', () => saveRecipe(recipe?.id));

  // 삭제
  if (!isNew) {
    document.getElementById('btnDeleteRecipe').addEventListener('click', () => deleteRecipe(recipe.id));
  }
}

function renderIngredientRows(ingredients) {
  if (ingredients.length === 0) return renderIngredientRow({}, 0);
  return ingredients.map((ing, i) => renderIngredientRow(ing, i)).join('');
}

function renderIngredientRow(ing, idx) {
  // 기본값: 신규 행은 재고연동 ON, 기존 행은 저장된 값 유지
  const isLinked = ing.linkedToInventory === undefined ? true : ing.linkedToInventory;
  const meatOptions = meatTypes
    .map(m => `<option value="${m.id}" ${ing.meatTypeId === m.id ? 'selected' : ''}>${m.name}</option>`)
    .join('');

  return `
    <tr data-idx="${idx}">
      <td><input type="text" class="ing-name cell-input" value="${ing.name || ''}" placeholder="원료명" /></td>
      <td><input type="number" class="ing-weight cell-input" value="${ing.baseWeightG || ''}" placeholder="g" /></td>
      <td style="text-align:center">
        <input type="radio" name="productionUnit" class="ing-unit-radio" value="${idx}" ${ing.isProductionUnit ? 'checked' : ''} />
      </td>
      <td><input type="text" class="ing-unit-name cell-input" value="${ing.unitName || ''}" placeholder="예: 마리" /></td>
      <td style="text-align:center">
        <input type="checkbox" class="ing-auto-deduct" ${ing.autoDeductInventory !== false ? 'checked' : ''} />
      </td>
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
}

function handleIngredientPaste(e) {
  e.preventDefault();
  const text = e.clipboardData.getData('text');
  const rows = text.trim().split('\n');
  const tbody = document.getElementById('ingredientBody');

  rows.forEach((row, i) => {
    const cols = row.split('\t');
    const name = cols[0]?.trim() || '';
    const weight = cols[1]?.trim() || '';

    // 원육명 매칭 → 재고연동 자동 ON + meatTypeId 세팅
    const matchedMeat = meatTypes.find(m => m.name === name);
    const linkedToInventory = !!matchedMeat;
    const meatTypeId = matchedMeat?.id || null;

    const existingRows = tbody.querySelectorAll('tr');
    if (existingRows[i]) {
      const tr = existingRows[i];
      tr.querySelector('.ing-name').value = name;
      tr.querySelector('.ing-weight').value = weight;
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
    return {
      id: Date.now().toString() + idx,
      name: row.querySelector('.ing-name').value.trim(),
      baseWeightG: parseFloat(row.querySelector('.ing-weight').value) || 0,
      isProductionUnit: row.querySelector('.ing-unit-radio').checked,
      unitName: row.querySelector('.ing-unit-name').value.trim(),
      autoDeductInventory: row.querySelector('.ing-auto-deduct').checked,
      linkedToInventory: linked,
      meatTypeId,
      sortOrder: idx,
    };
  }).filter(ing => ing.name);
}

async function saveRecipe(id) {
  const name = document.getElementById('recipeName').value.trim();
  const category = document.getElementById('recipeCategory').value;
  const target = document.getElementById('recipeTarget').value;

  if (!name || !category || !target) {
    alert('레시피명, 카테고리, 대상은 필수입니다.');
    return;
  }

  const targetPrefix = target === 'cat' ? '고양이 ' : target === 'dog' ? '강아지 ' : '';
  const data = {
    name,
    displayName: targetPrefix + name,
    category,
    target,
    color: document.getElementById('recipeColor').value,
    note: document.getElementById('recipeNote').value.trim(),
    active: true,
    sortOrder: id ? recipes.find(r => r.id === id)?.sortOrder ?? recipes.length : recipes.length,
    ingredients: getIngredients(),
    version: 1,
    updatedAt: new Date(),
  };

  if (category === 'raw') {
    data.packWeightG = parseFloat(document.getElementById('packWeightG').value) || null;
    data.bagTypeId = null;
  }

  if (category === 'freezeDry') {
    data.freezeDryBagCountPerUnit = parseFloat(document.getElementById('freezeDryBagCount').value) || null;
    data.breadPanCountPerUnit = parseFloat(document.getElementById('breadPanCount').value) || null;
    data.freezePanCountPerUnit = parseFloat(document.getElementById('freezePanCount').value) || null;
    data.requiresSeparation = document.getElementById('requiresSeparation').value === 'true';
  }

  if (id) {
    await updateDoc(doc(db, 'recipes', id), data);
  } else {
    data.createdAt = new Date();
    const ref = await addDoc(collection(db, 'recipes'), data);
    selectedRecipeId = ref.id;
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

async function deleteRecipe(id) {
  const __c = await showConfirmModal({ title:'레시피 삭제', message:'레시피를 삭제하시겠습니까?\n(비활성화를 권장합니다)', confirmText:'삭제', danger:true }); if (!__c) return;
  await deleteDoc(doc(db, 'recipes', id));
  recipes = await loadRecipes();
  selectedRecipeId = null;
  renderRecipeLayout();
}