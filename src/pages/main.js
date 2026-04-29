import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, getDoc, query, orderBy, setDoc
} from 'firebase/firestore';
import { getTodayKST as getToday, getNextBusinessDay } from '../utils/date.js';

let productions = [];
let nextProductions = [];
let recipes = [];
let meatStocks = [];
let eggStock = { currentQty: 0, minimumQty: 0 };
let completionDoc = null;

export async function renderMain() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>메인 로딩 중...</p></div>`;
  await loadAllData();
  renderMainLayout();
}

async function loadAllData() {
  const today = getToday();
  const nextBizDay = getNextBusinessDay(today);

  const prodSnap = await getDocs(query(collection(db, 'productions'), orderBy('sortOrder')));
  const allProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  productions = allProds.filter(p => p.date === today && p.status !== 'deleted');
  nextProductions = allProds.filter(p => p.date === nextBizDay && p.status !== 'deleted');

  const recipeSnap = await getDocs(collection(db, 'recipes'));
  recipes = recipeSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const meatSnap = await getDocs(collection(db, 'meatStocks'));
  meatStocks = meatSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.closed);

  const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
  if (eggSnap.exists()) eggStock = eggSnap.data();

  const compSnap = await getDoc(doc(db, 'productionCompletion', today));
  completionDoc = compSnap.exists() ? { id: compSnap.id, ...compSnap.data() } : null;
}



function renderMainLayout() {
  const content = document.getElementById('mainContent');
  const today = getToday();
  const nextBizDay = getNextBusinessDay(today);
  const isCompleted = completionDoc?.status === 'completed';
  const activeProductions = isCompleted ? nextProductions : productions;
  const activeDateLabel = isCompleted ? `불러온 다음 영업일 생산 (${nextBizDay})` : '오늘 생산';
  const meatNeedsTitle = isCompleted ? '🥩 불러온 생산 원육 출고' : '🥩 오늘 원육 출고';

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayDate = new Date(today + 'T00:00:00');
  const todayStr = `${todayDate.getMonth()+1}/${todayDate.getDate()} (${days[todayDate.getDay()]})`;

  content.innerHTML = `
    <div class="main-layout">
      <div class="main-panel-left">
        <div class="main-panel-header">
          <span class="main-panel-title">📅 ${todayStr} 생산</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-secondary" id="btnBigView" style="font-size:11px;padding:3px 10px;">크게보기</button>
            ${isCompleted
              ? `<button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>`
              : `<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;">내일생산불러오기</button>`
            }
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${activeDateLabel}</span>
            ${isCompleted ? '<span class="main-completed-pill">내일생산불러오기 완료</span>' : ''}
          </div>
          <div class="main-production-grid">
            ${activeProductions.length === 0
              ? `<div class="main-empty">${isCompleted ? '불러온 다음 영업일 생산 없음' : '오늘 생산 없음'}</div>`
              : activeProductions.map(p => renderProductionTableCard(p)).join('')}
          </div>
        </div>
      </div>

      <div class="main-panel-right-top">
        <div class="main-panel-header">
          <span class="main-panel-title">${meatNeedsTitle}</span>
        </div>
        <div style="padding:12px;font-size:12px;">
          ${renderMeatNeeds(activeProductions, isCompleted)}
        </div>
      </div>

      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">🔔 알림</span>
        </div>
        <div style="padding:12px;">
          ${renderQuickInfo(isCompleted)}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnBigView')?.addEventListener('click', showBigView);
  document.getElementById('btnTomorrowLoad')?.addEventListener('click', handleTomorrowLoad);
  document.getElementById('btnCancelCompletion')?.addEventListener('click', handleCancelCompletion);
}

function renderProductionTableCard(p) {
  const ingredients = p.ingredientsSnapshot || [];
  const unitRowName = getProductionUnitRowName(p, ingredients);

  return `
    <div class="main-production-card" style="--recipe-color:${p.color || '#ef7bd0'}">
      <div class="main-production-card-title">
        ${p.recipeName}${p.round > 1 ? ` <span>${p.round}회</span>` : ''}
      </div>
      <table class="main-ingredient-table">
        <thead>
          <tr>
            <th>부위</th>
            <th>생산수량</th>
            <th>단위</th>
          </tr>
        </thead>
        <tbody>
          <tr class="unit-row">
            <td>${unitRowName}</td>
            <td>${formatQty(p.productionUnitQty)}</td>
            <td>${p.productionUnitName || ''}</td>
          </tr>
          ${ingredients.map(ing => `
            <tr>
              <td>${ing.name}</td>
              <td>${formatIngredientQty(ing)}</td>
              <td>${getIngredientUnit(ing)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${p.category === 'raw' ? `<span>${p.rawBoxQty || 0}박스</span>` : ''}
        ${p.category === 'freezeDry' ? `<span>${p.freezeDryBagQty || 0}봉</span><span>${p.breadPanQty || 0}빵판</span><span>${p.freezePanQty || 0}동결판</span>` : ''}
      </div>
    </div>
  `;
}

function getProductionUnitRowName(p, ingredients) {
  const unitName = (p.productionUnitName || '').trim();
  const matched = ingredients.find(ing => ing.name === unitName);
  if (matched) return matched.name;
  const inventoryIngredient = ingredients.find(ing => ing.meatTypeId);
  return inventoryIngredient?.name || unitName || '생산단위';
}

function formatIngredientQty(ing) {
  const grams = Number(ing.requiredQtyG || 0);
  if (ing.meatTypeId) return formatQty(grams / 1000, 1);
  return formatQty(Math.round(grams));
}

function getIngredientUnit(ing) {
  return ing.meatTypeId ? 'kg' : 'g';
}

function formatQty(value, maxDecimals = 1) {
  const num = Number(value || 0);
  if (Number.isInteger(num)) return String(num);
  return num.toLocaleString('ko-KR', { maximumFractionDigits: maxDecimals });
}

function renderMeatNeeds(targetProductions = productions, isCompleted = false) {
  if (targetProductions.length === 0) return `<div style="color:#aaa;">${isCompleted ? '불러온 생산 없음' : '오늘 생산 없음'}</div>`;
  const needs = [];
  targetProductions.forEach(p => {
    (p.ingredientsSnapshot || []).forEach(ing => {
      if (ing.autoDeductInventory && ing.linkedToInventory) {
        needs.push({ name: ing.name, requiredG: ing.requiredQtyG });
      }
    });
  });
  if (needs.length === 0) return '<div style="color:#aaa;">원육 출고 없음</div>';
  return needs.map(n => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5;">
      <span>${n.name}</span>
      <span style="font-weight:600;">${(n.requiredG / 1000).toFixed(1)}kg</span>
    </div>
  `).join('');
}

function renderQuickInfo(isCompleted) {
  const items = [];
  if (eggStock.minimumQty > 0 && eggStock.currentQty < eggStock.minimumQty) {
    items.push(`<div style="color:#e53e3e;font-size:12px;padding:4px 0;">⚠️ 계란 부족 (현재: ${eggStock.currentQty}개)</div>`);
  }
  if (isCompleted) {
    items.push(`<div style="color:#2d7a3a;font-size:12px;padding:4px 0;">✅ 내일생산불러오기 완료</div>`);
  }
  if (items.length === 0) {
    items.push('<div style="color:#aaa;font-size:12px;">알림 없음</div>');
  }
  return items.join('');
}

async function handleTomorrowLoad() {
  const today = getToday();
  if (completionDoc?.status === 'completed') {
    alert('오늘 내일생산불러오기는 이미 완료되었습니다.');
    return;
  }

  const staffSnap = await getDoc(doc(db, 'staffGroups', 'lead'));
  const members = staffSnap.exists() ? staffSnap.data().members || [] : [];

  showModal(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      다음 영업일(${getNextBusinessDay(today)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
    </p>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${members.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnConfirmLoad">확인</button>
    </div>
  `);

  document.getElementById('btnConfirmLoad').addEventListener('click', async () => {
    const staff = document.getElementById('m_staff').value;
    if (!staff) { alert('담당자를 선택해주세요.'); return; }
    closeModal();
    await executeProductionLoad(today, staff);
  });
}

async function executeProductionLoad(today, staffName) {
  const nextBizDay = getNextBusinessDay(today);
  try {
    const meatNeeds = {};
    const bagNeeds = {};

    for (const p of nextProductions) {
      const recipe = recipes.find(r => r.id === p.recipeId);
      if (!recipe) continue;
      (p.ingredientsSnapshot || []).forEach(ing => {
        if (ing.autoDeductInventory && ing.meatTypeId) {
          meatNeeds[ing.meatTypeId] = (meatNeeds[ing.meatTypeId] || 0) + ing.requiredQtyG;
        }
      });
      if (recipe.category === 'raw' && recipe.bagTypeId) {
        const boxQty = p.rawBoxQty || 0;
        const bagSnap = await getDoc(doc(db, 'bagTypes', recipe.bagTypeId));
        if (bagSnap.exists()) {
          const piecesPerBox = bagSnap.data().piecesPerBox || 1;
          bagNeeds[recipe.bagTypeId] = (bagNeeds[recipe.bagTypeId] || 0) + (boxQty * piecesPerBox);
        }
      }
    }

    // 봉투 재고 체크
    for (const [bagTypeId, needed] of Object.entries(bagNeeds)) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        if (current < needed) {
          alert(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${bagSnap.data().name}: 현재 ${current}장 / 필요 ${needed}장`);
          return;
        }
      }
    }

    const ledgerItems = [];

    // 원육 FIFO 차감
    for (const [meatTypeId, neededG] of Object.entries(meatNeeds)) {
      let remaining = neededG;

      const repackedStocks = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'repacked' && s.remaining > 0)
        .sort((a, b) => (a.repackedDate || '').localeCompare(b.repackedDate || ''));

      for (const s of repackedStocks) {
        if (remaining <= 0) break;
        const deduct = Math.min(s.remaining, remaining);
        const newRemaining = s.remaining - deduct;
        await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
        ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deduct, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 재포장`, stockUpdatedAtSnapshot: new Date() });
        remaining -= deduct;
      }

      if (remaining > 0) {
        const processedStocks = meatStocks
          .filter(s => s.meatTypeId === meatTypeId && s.stage === 'processed' && s.remaining > 0)
          .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));

        for (const s of processedStocks) {
          if (remaining <= 0) break;
          const unitW = s.unitWeightG || 1;
          const deductG = Math.min(s.remaining, Math.ceil(remaining / unitW) * unitW);
          const newRemaining = s.remaining - deductG;
          await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
          ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deductG, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 전처리`, stockUpdatedAtSnapshot: new Date() });
          remaining -= deductG;
        }
      }

      if (remaining > 0) {
        const frozenStocks = meatStocks
          .filter(s => s.meatTypeId === meatTypeId && s.stage === 'frozen' && s.remaining > 0)
          .sort((a, b) => (a.incomingDate || '').localeCompare(b.incomingDate || ''));

        for (const s of frozenStocks) {
          if (remaining <= 0) break;
          const deduct = Math.min(s.remaining, remaining);
          const newRemaining = s.remaining - deduct;
          await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
          ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deduct, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 냉동창고`, stockUpdatedAtSnapshot: new Date() });
          remaining -= deduct;
        }
      }
    }

    // 봉투 차감
    for (const [bagTypeId, neededPcs] of Object.entries(bagNeeds)) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        const newQty = current - neededPcs;
        await updateDoc(doc(db, 'bagTypes', bagTypeId), { currentQty: newQty, updatedAt: new Date() });
        ledgerItems.push({ collection: 'bagTypes', docId: bagTypeId, field: 'currentQty', delta: -neededPcs, before: current, after: newQty, label: `${bagSnap.data().name} 봉투`, stockUpdatedAtSnapshot: new Date() });
        await addDoc(collection(db, 'bagLogs'), { date: today, timestamp: new Date(), bagTypeId, bagNameSnapshot: bagSnap.data().name, type: 'autoDeduct', qty: -neededPcs, before: current, after: newQty, staffName, note: '내일생산불러오기 자동차감' });
      }
    }

    // ledger 저장
    const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
      actionType: 'productionCompletion',
      actionId: today,
      timestamp: new Date(),
      runDate: today,
      status: 'active',
      items: ledgerItems,
    });

    // productionCompletion 저장
    await setDoc(doc(db, 'productionCompletion', today), {
      runDate: today,
      targetProductionDate: nextBizDay,
      status: 'completed',
      idempotencyKey: `productionCompletion:${today}`,
      staffName,
      ledgerId: ledgerRef.id,
      completedAt: new Date(),
    });

    for (const p of nextProductions) {
      await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: true });
    }

    await loadAllData();
    renderMainLayout();
    alert('내일생산불러오기 완료!');

  } catch (err) {
    console.error(err);
    alert('오류가 발생했습니다: ' + err.message);
  }
}

async function handleCancelCompletion() {
  if (!confirm('내일생산불러오기를 취소하시겠습니까?\n차감된 재고가 복원됩니다.')) return;
  const reason = prompt('취소 사유를 입력해주세요:');
  if (!reason) return;

  const today = getToday();
  try {
    if (completionDoc?.ledgerId) {
      const ledgerSnap = await getDoc(doc(db, 'stockLedger', completionDoc.ledgerId));
      if (ledgerSnap.exists()) {
        const items = ledgerSnap.data().items || [];
        for (const item of items) {
          const docSnap = await getDoc(doc(db, item.collection, item.docId));
          if (!docSnap.exists()) continue;
          const currentVal = docSnap.data()[item.field];
          if (currentVal !== item.after) {
            if (!confirm(`내일생산불러오기 이후 ${item.label} 재고가 변경된 이력이 있습니다.\n내일생산불러오기 당시 차감분만 복원됩니다.\n강제 복원하시겠습니까?`)) continue;
          }
          await updateDoc(doc(db, item.collection, item.docId), {
            [item.field]: currentVal - item.delta,
            closed: false,
            updatedAt: new Date(),
          });
        }
        await updateDoc(doc(db, 'stockLedger', completionDoc.ledgerId), { status: 'rolledBack', rolledBackAt: new Date() });
      }
    }

    if (completionDoc?.id) {
      await updateDoc(doc(db, 'productionCompletion', completionDoc.id), { status: 'cancelled', cancelReason: reason, cancelledAt: new Date() });
    }

    for (const p of nextProductions) {
      await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: false });
    }

    await loadAllData();
    renderMainLayout();
    alert('취소 완료! 재고가 복원되었습니다.');

  } catch (err) {
    console.error(err);
    alert('오류가 발생했습니다: ' + err.message);
  }
}

function showBigView() {
  const isCompleted = completionDoc?.status === 'completed';
  const displayProductions = isCompleted ? nextProductions : productions;
  const title = isCompleted ? `${getNextBusinessDay(getToday())} 불러온 생산` : `${getToday()} 생산 현황`;

  showModal(`
    <h3 class="modal-title">${title}</h3>
    <div class="main-production-grid big-view">
      ${displayProductions.length === 0 ? '<p style="color:#aaa">생산 없음</p>' :
        displayProductions.map(p => renderProductionTableCard(p)).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);
}

function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  const isWide = html.includes('main-production-grid big-view');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box ${isWide ? 'modal-wide' : ''}">${html}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
