import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc, where
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';

let recipes = [];
let productions = [];
let selectedDate = getToday();
let selectedProductionId = null;

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

function renderProductionLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="production-wrap">
      <!-- 왼쪽 3/4 -->
      <div class="production-left">
        <div class="production-date-bar">
          <input type="date" id="productionDate" value="${selectedDate}" />
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#555;">
            <input type="checkbox" id="isHoliday" /> 휴일 지정
          </label>
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
        <button class="btn-primary" id="btnNewProduction" style="width:100%;margin-top:12px;">+ 새 생산 추가</button>
      </div>
    </div>
  `;

  // 날짜 변경
  document.getElementById('productionDate').addEventListener('change', async (e) => {
    selectedDate = e.target.value;
    productions = await loadProductions(selectedDate);
    document.getElementById('productionCards').innerHTML = renderProductionCards();
    bindCardEvents();
  });

  document.getElementById('btnNewProduction').addEventListener('click', () => showProductionForm(null));
  document.getElementById('btnCopySheet').addEventListener('click', showCopySheetModal);
  document.getElementById('btnBigView').addEventListener('click', showBigViewModal);

  bindCardEvents();
}

function renderProductionCards() {
  if (productions.length === 0) {
    return '<div style="color:#aaa;font-size:13px;padding:20px;text-align:center;">오늘 생산 없음</div>';
  }
  return productions.map(p => `
    <div class="production-card ${selectedProductionId === p.id ? 'active' : ''}"
         data-id="${p.id}"
         style="border-left:4px solid ${p.color || '#4A7C59'}">
      <div class="card-title">${p.recipeName} ${p.round > 1 ? `<span style="font-size:10px;color:#aaa">${p.round}회</span>` : ''}</div>
      <div class="card-info">${p.productionUnitQty} ${p.productionUnitName}</div>
      ${p.category === 'raw' ? `<div class="card-sub">${p.rawBoxQty || 0}박스</div>` : ''}
      ${p.category === 'freezeDry' ? `<div class="card-sub">${p.freezeDryBagQty || 0}봉 / ${p.breadPanQty || 0}빵판 / ${p.freezePanQty || 0}동결판</div>` : ''}
      <button class="card-del" data-id="${p.id}">✕</button>
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
      if (!confirm('삭제하시겠습니까?')) return;
      await updateDoc(doc(db, 'productions', btn.dataset.id), { status: 'deleted' });
      productions = await loadProductions(selectedDate);
      document.getElementById('productionCards').innerHTML = renderProductionCards();
      bindCardEvents();
      if (selectedProductionId === btn.dataset.id) {
        selectedProductionId = null;
        document.getElementById('productionForm').innerHTML = `<div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">카드를 선택하거나 아래에서 새 생산을 추가하세요</div>`;
      }
    });
  });
}

function showProductionForm(production) {
  const isNew = !production;
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
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="number" id="pf_qty" value="${production?.productionUnitQty || ''}" placeholder="수량" style="flex:1" />
          <span id="pf_unitName" style="font-size:12px;color:#888;min-width:30px;">${production?.productionUnitName || ''}</span>
        </div>
      </div>

      <!-- 원료 목록 -->
      <div id="pf_ingredients" style="margin-bottom:12px;max-height:200px;overflow-y:auto;font-size:12px;"></div>

      <!-- 참고 수치 -->
      <div id="pf_refs" style="font-size:11px;color:#888;margin-bottom:12px;"></div>

      <button class="btn-primary" id="btnSaveProduction" style="width:100%;">${isNew ? '저장' : '수정'}</button>
    </div>
  `;

  // 레시피 선택 시 원료 자동 계산
  const recipeSelect = document.getElementById('pf_recipe');
  const qtyInput = document.getElementById('pf_qty');

  function updateIngredients() {
    const recipeId = recipeSelect.value;
    const recipe = recipes.find(r => r.id === recipeId);
    const qty = parseFloat(qtyInput.value) || 0;
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
      refs = `봉지: ${(recipe.freezeDryBagCountPerUnit || 0) * qty} / 빵판: ${(recipe.breadPanCountPerUnit || 0) * qty} / 동결판: ${(recipe.freezePanCountPerUnit || 0) * qty}`;
    }
    document.getElementById('pf_refs').textContent = refs;
  }

  recipeSelect.addEventListener('change', updateIngredients);
  qtyInput.addEventListener('input', updateIngredients);

  if (production) updateIngredients();

  document.getElementById('btnSaveProduction').addEventListener('click', async () => {
    const recipeId = recipeSelect.value;
    const qty = parseFloat(qtyInput.value);
    const staff = document.getElementById('pf_staff').value;

    if (!recipeId || !qty) { alert('레시피와 생산단위는 필수입니다.'); return; }

    const recipe = recipes.find(r => r.id === recipeId);
    const unitName = recipe.ingredients?.find(i => i.isProductionUnit)?.unitName || '';
    const displayName = getRecipeDisplayName(recipe);
    const productionUnitIng = recipe.ingredients?.find(i => i.isProductionUnit);
const baseWeight = productionUnitIng?.baseWeightG || 1;

    // 재고 부족 경고
    const shortages = checkShortages(recipe, qty);
    if (shortages.length > 0) {
      const msg = shortages.map(s => `⚠️ ${s}`).join('\n');
      if (!confirm(`재고 부족 경고:\n${msg}\n\n그래도 저장하시겠습니까?`)) return;
    }

    // 회차 계산
    const sameRecipe = productions.filter(p => p.recipeId === recipeId);
    const round = isNew ? sameRecipe.length + 1 : production.round;

    const data = {
      date: selectedDate,
      recipeId,
      recipeName: displayName,
      category: recipe.category,
      target: recipe.target,
      color: recipe.color || '#4A7C59',
      round,
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
      data.breadPanQty = (recipe.breadPanCountPerUnit || 0) * qty;
      data.freezePanQty = (recipe.freezePanCountPerUnit || 0) * qty;
    }

    if (isNew) {
      data.createdAt = new Date();
      await addDoc(collection(db, 'productions'), data);
    } else {
      await updateDoc(doc(db, 'productions', production.id), data);
    }

    productions = await loadProductions(selectedDate);
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

  const rawCat = productions.filter(p => p.category === 'raw' && p.target === 'cat');
  const rawDog = productions.filter(p => p.category === 'raw' && p.target === 'dog');
  const freeze = productions.filter(p => p.category === 'freezeDry');

  let sheet = `※ ${dateStr} 생산\n`;

  if (rawCat.length > 0) {
    const items = rawCat.map(p => `${p.recipeName.replace('고양이 ', '')}${p.productionUnitQty}`).join(', ');
    sheet += `- 고양이 생식 : ${items}\n`;
  }
  if (rawDog.length > 0) {
    const items = rawDog.map(p => `${p.recipeName.replace('강아지 ', '')}${p.productionUnitQty}`).join(', ');
    sheet += `- 강아지 생식 : ${items}\n`;
  }
  if (freeze.length > 0) {
    const catFreeze = freeze.filter(p => p.target === 'cat').map(p => `고양이 ${p.recipeName.replace('고양이 ', '')}${p.productionUnitQty}`);
    const dogFreeze = freeze.filter(p => p.target === 'dog').map(p => `강아지 ${p.recipeName.replace('강아지 ', '')}${p.productionUnitQty}`);
    const commonFreeze = freeze.filter(p => p.target === 'common').map(p => `${p.recipeName}${p.productionUnitQty}`);
    const allFreeze = [...catFreeze, ...dogFreeze, ...commonFreeze].join(', ');
    sheet += `- 동결건조 : ${allFreeze}\n`;
  }

  showModal(`
    <h3 class="modal-title">생산지시서 복사</h3>
    <textarea id="sheetText" style="width:100%;height:160px;font-size:13px;padding:12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;resize:none;">${sheet}</textarea>
    <div style="font-size:11px;color:#aaa;margin:8px 0;">비고를 추가하려면 위 텍스트를 직접 수정하세요.</div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
      <button class="btn-primary" id="btnCopy">복사하기</button>
    </div>
  `);

  document.getElementById('btnCopy').addEventListener('click', () => {
    const text = document.getElementById('sheetText').value;
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
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${p.recipeName}</div>
            <div style="font-size:12px;color:#555;">${p.productionUnitQty} ${p.productionUnitName}</div>
            ${p.category === 'raw' ? `<div style="font-size:11px;color:#888;">${p.rawBoxQty || 0}박스</div>` : ''}
            ${p.category === 'freezeDry' ? `<div style="font-size:11px;color:#888;">${p.freezeDryBagQty || 0}봉 / ${p.breadPanQty || 0}빵판</div>` : ''}
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
    if (e.target === overlay) closeModal();
  });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};