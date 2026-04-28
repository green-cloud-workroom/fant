import { db, auth } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, getDoc, query, orderBy, runTransaction
} from 'firebase/firestore';

let productions = [];
let nextProductions = [];
let recipes = [];
let meatStocks = [];
let eggStock = { currentQty: 0 };
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

  // 오늘 생산
  const prodSnap = await getDocs(query(collection(db, 'productions'), orderBy('sortOrder')));
  productions = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.date === today && p.status !== 'deleted');

  // 다음 영업일 생산
  nextProductions = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.date === nextBizDay && p.status !== 'deleted');

  // 레시피
  const recipeSnap = await getDocs(collection(db, 'recipes'));
  recipes = recipeSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 원육 재고
  const meatSnap = await getDocs(collection(db, 'meatStocks'));
  meatStocks = meatSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.closed);

  // 계란
  const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
  if (eggSnap.exists()) eggStock = eggSnap.data();

  // 오늘 완료 기록
  const compSnap = await getDoc(doc(db, 'productionCompletion', today));
  completionDoc = compSnap.exists() ? { id: compSnap.id, ...compSnap.data() } : null;
}

function getToday() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().split('T')[0];
}

function getNextBusinessDay(dateStr) {
  const date = new Date(dateStr);
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return date.toISOString().split('T')[0];
}

function renderMainLayout() {
  const content = document.getElementById('mainContent');
  const today = getToday();
  const nextBizDay = getNextBusinessDay(today);
  const isCompleted = completionDoc?.status === 'completed';

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayDate = new Date(today);
  const todayStr = `${todayDate.getMonth()+1}/${todayDate.getDate()} (${days[todayDate.getDay()]})`;

  content.innerHTML = `
    <div class="main-layout">
      <!-- 1번: 생산 현황 -->
      <div class="main-panel-left">
        <div class="main-panel-header">
          <span class="main-panel-title">📅 ${todayStr} 생산</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-secondary" id="btnBigView" style="font-size:11px;padding:3px 10px;">크게보기</button>
            ${isCompleted ?
              `<button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>` :
              `<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;">내일생산불러오기</button>`
            }
          </div>
        </div>

        <!-- 오늘 생산 카드 -->
        <div style="padding:12px;">
          <div style="font-size:11px;color:#888;margin-bottom:8px;">오늘 생산</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${productions.length === 0 ?
              '<div style="color:#aaa;font-size:12px;">오늘 생산 없음</div>' :
              productions.map(p => renderMiniCard(p, false)).join('')}
          </div>
        </div>

        <!-- 다음 영업일 생산 -->
        <div style="padding:12px;border-top:1px solid #f0f0f0;">
          <div style="font-size:11px;color:#888;margin-bottom:8px;">
            다음 영업일 생산
            <span style="color:#aaa;margin-left:4px;">(${nextBizDay})</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${nextProductions.length === 0 ?
              '<div style="color:#aaa;font-size:12px;">다음 영업일 생산 없음</div>' :
              nextProductions.map(p => renderMiniCard(p, isCompleted)).join('')}
          </div>
        </div>
      </div>

      <!-- 2번: 원육 창고 -->
      <div class="main-panel-right-top">
        <div class="main-panel-header">
          <span class="main-panel-title">🥩 오늘 원육 출고</span>
        </div>
        <div style="padding:12px;font-size:12px;">
          ${renderMeatNeeds()}
        </div>
      </div>

      <!-- 3번: 로그 -->
      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">🔔 알림</span>
        </div>
        <div style="padding:12px;">
          ${renderQuickInfo()}
        </div>
      </div>
    </div>
  `;

  // 내일생산불러오기 버튼
  const btnLoad = document.getElementById('btnTomorrowLoad');
  if (btnLoad) {
    btnLoad.addEventListener('click', handleTomorrowLoad);
  }

  // 내일생산취소 버튼
  const btnCancel = document.getElementById('btnCancelCompletion');
  if (btnCancel) {
    btnCancel.addEventListener('click', handleCancelCompletion);
  }

  // 크게보기
  document.getElementById('btnBigView')?.addEventListener('click', showBigView);
}

function renderMiniCard(p, isNextDay) {
  return `
    <div style="
      background:${isNextDay ? '#fffdf0' : 'white'};
      border:1px solid #e8e8e8;
      border-left:4px solid ${p.color || '#4A7C59'};
      border-radius:6px;
      padding:8px 12px;
      min-width:120px;
    ">
      <div style="font-size:12px;font-weight:600;margin-bottom:2px;">${p.recipeName}</div>
      <div style="font-size:11px;color:#555;">${p.productionUnitQty} ${p.productionUnitName}</div>
      ${p.category === 'raw' ? `<div style="font-size:10px;color:#888;">${p.rawBoxQty || 0}박스</div>` : ''}
    </div>
  `;
}

function renderMeatNeeds() {
  if (productions.length === 0) return '<div style="color:#aaa;">오늘 생산 없음</div>';

  const needs = [];
  productions.forEach(p => {
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

function renderQuickInfo() {
  const today = getToday();
  const items = [];

  if (eggStock.minimumQty > 0 && eggStock.currentQty < eggStock.minimumQty) {
    items.push(`<div style="color:#e53e3e;font-size:12px;padding:4px 0;">⚠️ 계란 부족 (현재: ${eggStock.currentQty}개)</div>`);
  }

  if (completionDoc?.status === 'completed') {
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

  if (nextProductions.length === 0) {
    if (!confirm('다음 영업일 생산이 없습니다. 그래도 진행하시겠습니까?')) return;
  }

  // 담당자 선택 팝업
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
    // productionCompletion 저장
    await updateDoc(doc(db, 'productionCompletion', today), {
      status: 'completed',
      staffName,
      targetProductionDate: nextBizDay,
      completedAt: new Date(),
    }).catch(async () => {
      await addDoc(collection(db, 'productionCompletion'), {
        runDate: today,
        targetProductionDate: nextBizDay,
        status: 'completed',
        idempotencyKey: `productionCompletion:${today}`,
        staffName,
        completedAt: new Date(),
      });
    });

    // 다음 영업일 생산 lockedByCompletion 설정
    for (const p of nextProductions) {
      await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: true });
    }

    await loadAllData();
    renderMainLayout();
    alert('내일생산불러오기 완료!');
  } catch (err) {
    console.error(err);
    alert('오류가 발생했습니다. 다시 시도해주세요.');
  }
}

async function handleCancelCompletion() {
  const reason = prompt('취소 사유를 입력해주세요:');
  if (!reason) return;

  const today = getToday();
  await updateDoc(doc(db, 'productionCompletion', today), {
    status: 'cancelled',
    cancelReason: reason,
    cancelledAt: new Date(),
  }).catch(() => {});

  for (const p of nextProductions) {
    await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: false });
  }

  completionDoc = null;
  await loadAllData();
  renderMainLayout();
  alert('취소 완료!');
}

function showBigView() {
  const today = getToday();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(today);
  const dateStr = `${d.getMonth()+1}/${d.getDate()} (${days[d.getDay()]})`;

  showModal(`
    <h3 class="modal-title">${dateStr} 생산 현황</h3>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">
      ${productions.length === 0 ? '<p style="color:#aaa">생산 없음</p>' :
        productions.map(p => `
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;min-width:160px;border-left:4px solid ${p.color || '#4A7C59'}">
            <div style="font-size:14px;font-weight:600;margin-bottom:6px;">${p.recipeName}</div>
            <div style="font-size:13px;color:#555;">${p.productionUnitQty} ${p.productionUnitName}</div>
            ${p.category === 'raw' ? `<div style="font-size:12px;color:#888;margin-top:2px;">${p.rawBoxQty || 0}박스</div>` : ''}
            ${p.category === 'freezeDry' ? `<div style="font-size:12px;color:#888;margin-top:2px;">${p.freezeDryBagQty || 0}봉 / ${p.breadPanQty || 0}빵판</div>` : ''}
          </div>
        `).join('')}
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