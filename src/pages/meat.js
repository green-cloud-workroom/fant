import { db } from '../firebase.js';
import {
  collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc, where
} from 'firebase/firestore';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { recordActivity } from '../services/activityLogs.js';
import { recordMeatLog } from '../services/meatLogs.js';
import { getTodayKST as getToday } from '../utils/date.js';
import { showConfirmModal } from '../utils/modal.js';

let meatTypes = [];
let currentTab = 'frozen';

export async function renderMeat() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>원육 재고 로딩 중...</p></div>`;
  await loadStaffCache();
  meatTypes = await loadMeatTypes();
  renderMeatLayout();
}

async function loadMeatTypes() {
  const q = query(collection(db, 'meatTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadMeatLogs(stage) {
  const q = query(
    collection(db, 'meatLogs'),
    where('stage', '==', stage),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function getMeatLogTypeLabel(type) {
  const map = {
    frozenIncoming: '입고',
    frozenOut: '전처리로 출고',
    processedIn: '전처리',
    processedOut: '재포장으로 출고',
    repackedIn: '재포장',
    repackedOut: '출고',
    productionDeduct: '생산차감',
    productionRollback: '생산복원',
    adjust: '수동조정',
  };
  return map[type] || type;
}

function formatMeatLogTimestamp(ts) {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatMeatLogQty(grams) {
  if (typeof grams !== 'number') return '-';
  const sign = grams > 0 ? '+' : '';
  const kg = grams / 1000;
  return `${sign}${kg.toFixed(2)}kg`;
}

async function loadMeatStocks(stage) {
  const q = query(collection(db, 'meatStocks'), orderBy('incomingDate'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.stage === stage && !s.closed);
}

function renderMeatLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원육 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${currentTab === 'frozen' ? 'active' : ''}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${currentTab === 'processed' ? 'active' : ''}" data-tab="processed">전처리</button>
          <button class="tab-btn ${currentTab === 'repacked' ? 'active' : ''}" data-tab="repacked">재포장</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTab(currentTab);
    });
  });

  renderTab(currentTab);
}

async function renderTab(tab) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `<div style="padding:24px;"><p>로딩 중...</p></div>`;

  const [stocks, logs] = await Promise.all([
    loadMeatStocks(tab),
    loadMeatLogs(tab),
  ]);

  if (tab === 'frozen') {
    renderFrozenTab(stocks, logs);
  } else if (tab === 'processed') {
    renderProcessedTab(stocks, logs);
  } else {
    renderRepackedTab(stocks, logs);
  }
}

// 냉동창고 탭
function renderFrozenTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      <button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr>
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.incomingDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              logs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddFrozen').addEventListener('click', showAddFrozenModal);
  document.getElementById('btnMeatTypes').addEventListener('click', () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('원육 종류 관리는 대표/사무실 계정만 가능합니다.');
      return;
    }
    showMeatTypesModal();
  });
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 전처리 탭
function renderProcessedTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 전처리 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.processedDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              logs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddProcessed').addEventListener('click', showAddProcessedModal);
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 재포장 탭
function renderRepackedTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재포장 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.repackedDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
              logs.map(l => `
                <tr>
                  <td>${formatMeatLogTimestamp(l.timestamp)}</td>
                  <td>${l.meatNameSnapshot || '-'}</td>
                  <td>${getMeatLogTypeLabel(l.type)}</td>
                  <td style="color:${l.delta < 0 ? '#e53e3e' : '#2d7a3a'};font-weight:600;">${formatMeatLogQty(l.delta)}</td>
                  <td>${l.staff || '-'}</td>
                  <td>${l.reason || '-'}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddRepacked').addEventListener('click', showAddRepackedModal);
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 원육 입고 등록 모달
function showAddFrozenModal() {
  showModal(`
    <h3 class="modal-title">원육 입고 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${meatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>중량 *</label>
        <input type="number" id="m_weight" placeholder="중량" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>입고일</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozen">추가</button>
    </div>
  `);

  document.getElementById('btnSaveFrozen').addEventListener('click', async () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('원육 입고 등록은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const meatTypeId = document.getElementById('m_meatType').value;
    const meatTypeEl = document.getElementById('m_meatType');
    const meatName = meatTypeEl.options[meatTypeEl.selectedIndex]?.text;
    const weight = parseFloat(document.getElementById('m_weight').value);
    const unit = document.getElementById('m_unit').value;
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!meatTypeId || !weight || !date) {
      alert('원육 종류, 중량, 날짜는 필수입니다.');
      return;
    }
    if (!staff) {
      alert('담당자를 선택해주세요.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const qtyG = unit === 'kg' ? weight * 1000 : weight;

    const stockRef = await addDoc(collection(db, 'meatStocks'), {
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'frozen',
      incomingDate: date,
      initialQtyG: qtyG,
      remaining: qtyG,
      staffName: staff,
      note,
      closed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await recordMeatLog({
      type: 'frozenIncoming',
      date,
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'frozen',
      meatStockId: stockRef.id,
      delta: qtyG,
      before: 0,
      after: qtyG,
      staff,
      reason: note || null,
    });

    closeModal();
    renderTab('frozen');
    alert('입고 등록 완료!');
  });
}

// 전처리 등록 모달
function showAddProcessedModal() {
  showModal(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${meatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>전처리일</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProcessed">추가</button>
    </div>
  `);

  // 원육 선택 시 기본 개당중량 자동 세팅
  document.getElementById('m_meatType').addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    const defaultWeight = opt.dataset.weight;
    if (defaultWeight) document.getElementById('m_unitWeight').value = defaultWeight;
  });

  document.getElementById('btnSaveProcessed').addEventListener('click', async () => {
    const meatTypeId = document.getElementById('m_meatType').value;
    const meatTypeEl = document.getElementById('m_meatType');
    const meatName = meatTypeEl.options[meatTypeEl.selectedIndex]?.text;
    const unitWeight = parseFloat(document.getElementById('m_unitWeight').value);
    const count = parseInt(document.getElementById('m_count').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!meatTypeId || !unitWeight || !count || !date) {
      alert('원육 종류, 개당 중량, 개수, 날짜는 필수입니다.');
      return;
    }
    if (!staff) {
      alert('담당자를 선택해주세요.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const totalG = unitWeight * count;

    // 냉동창고 잔량 확인 (FIFO 순서: incomingDate 오름차순)
    const allFrozen = await loadMeatStocks('frozen');
    const candidates = allFrozen
      .filter(s => s.meatTypeId === meatTypeId && s.remaining > 0)
      .sort((a, b) => (a.incomingDate || '').localeCompare(b.incomingDate || ''));

    const totalAvailable = candidates.reduce((sum, s) => sum + s.remaining, 0);
    if (totalAvailable < totalG) {
      alert(`냉동창고 잔량이 부족합니다.\n${meatName}: 필요 ${(totalG/1000).toFixed(1)}kg / 현재 ${(totalAvailable/1000).toFixed(1)}kg`);
      return;
    }

    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    // 냉동창고 FIFO 차감 + frozenOut 로그
    let remainingToDeduct = totalG;
    for (const lot of candidates) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(lot.remaining, remainingToDeduct);
      const newRemaining = lot.remaining - deduct;

      await updateDoc(doc(db, 'meatStocks', lot.id), {
        remaining: newRemaining,
        closed: newRemaining === 0,
        updatedAt: new Date(),
      });

      await recordMeatLog({
        type: 'frozenOut',
        date,
        meatTypeId,
        meatNameSnapshot: meatName,
        stage: 'frozen',
        meatStockId: lot.id,
        delta: -deduct,
        before: lot.remaining,
        after: newRemaining,
        staff,
        reason: '전처리 등록 자동차감',
        batchId,
      });

      remainingToDeduct -= deduct;
    }

    // 전처리 신규 행 추가
    const newStockRef = await addDoc(collection(db, 'meatStocks'), {
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'processed',
      incomingDate: date,
      processedDate: date,
      unitWeightG: unitWeight,
      unitCount: count,
      initialQtyG: totalG,
      remaining: totalG,
      batchId,
      batchColor,
      staffName: staff,
      note,
      closed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await recordMeatLog({
      type: 'processedIn',
      date,
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'processed',
      meatStockId: newStockRef.id,
      delta: totalG,
      before: 0,
      after: totalG,
      staff,
      reason: note || null,
      batchId,
    });

    closeModal();
    renderTab('processed');
    alert('전처리 등록 완료!');
  });
}

// 재포장 등록 모달
function showAddRepackedModal() {
  showModal(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${meatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>재포장일</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveRepacked">추가</button>
    </div>
  `);

  document.getElementById('m_meatType').addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    const defaultWeight = opt.dataset.weight;
    if (defaultWeight) document.getElementById('m_unitWeight').value = defaultWeight;
  });

  document.getElementById('btnSaveRepacked').addEventListener('click', async () => {
    const meatTypeId = document.getElementById('m_meatType').value;
    const meatTypeEl = document.getElementById('m_meatType');
    const meatName = meatTypeEl.options[meatTypeEl.selectedIndex]?.text;
    const unitWeight = parseFloat(document.getElementById('m_unitWeight').value);
    const count = parseInt(document.getElementById('m_count').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!meatTypeId || !unitWeight || !count || !date) {
      alert('원육 종류, 개당 중량, 개수, 날짜는 필수입니다.');
      return;
    }
    if (!staff) {
      alert('담당자를 선택해주세요.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const totalG = unitWeight * count;

    // 같은 원육 활성 재포장 행 중복 차단 (spec 9절 탭3)
    const allRepacked = await loadMeatStocks('repacked');
    const existingActive = allRepacked.find(s => s.meatTypeId === meatTypeId && s.remaining > 0);
    if (existingActive) {
      alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${meatName}: 기존 잔량 ${(existingActive.remaining/1000).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);
      return;
    }

    // 전처리 잔량 확인 (FIFO 순서: processedDate 오름차순)
    const allProcessed = await loadMeatStocks('processed');
    const candidates = allProcessed
      .filter(s => s.meatTypeId === meatTypeId && s.remaining > 0)
      .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));

    const totalAvailable = candidates.reduce((sum, s) => sum + s.remaining, 0);
    if (totalAvailable < totalG) {
      alert(`전처리 잔량이 부족합니다.\n${meatName}: 필요 ${(totalG/1000).toFixed(1)}kg / 현재 ${(totalAvailable/1000).toFixed(1)}kg`);
      return;
    }

    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    // 전처리 FIFO 차감 + processedOut 로그
    let remainingToDeduct = totalG;
    for (const lot of candidates) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(lot.remaining, remainingToDeduct);
      const newRemaining = lot.remaining - deduct;

      await updateDoc(doc(db, 'meatStocks', lot.id), {
        remaining: newRemaining,
        closed: newRemaining === 0,
        updatedAt: new Date(),
      });

      await recordMeatLog({
        type: 'processedOut',
        date,
        meatTypeId,
        meatNameSnapshot: meatName,
        stage: 'processed',
        meatStockId: lot.id,
        delta: -deduct,
        before: lot.remaining,
        after: newRemaining,
        staff,
        reason: '재포장 등록 자동차감',
        batchId,
      });

      remainingToDeduct -= deduct;
    }

    // 재포장 신규 행 추가
    const newStockRef = await addDoc(collection(db, 'meatStocks'), {
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'repacked',
      incomingDate: date,
      repackedDate: date,
      unitWeightG: unitWeight,
      unitCount: count,
      initialQtyG: totalG,
      remaining: totalG,
      batchId,
      batchColor,
      staffName: staff,
      note,
      closed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await recordMeatLog({
      type: 'repackedIn',
      date,
      meatTypeId,
      meatNameSnapshot: meatName,
      stage: 'repacked',
      meatStockId: newStockRef.id,
      delta: totalG,
      before: 0,
      after: totalG,
      staff,
      reason: note || null,
      batchId,
    });

    closeModal();
    renderTab('repacked');
    alert('재포장 등록 완료!');
  });
}

// 수동 조정 모달
function showAdjustModal(id, name, remaining) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정 — ${name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">기존 잔량: <strong>${(remaining/1000).toFixed(1)}kg</strong> (${remaining}g)</p>
    <div class="form-group">
      <label>실제 잔량 (g) *</label>
      <input type="number" id="m_actualRemaining" placeholder="실제 잔량(g) 입력" min="0" step="1" />
      <p style="font-size:11px;color:#aaa;margin-top:4px;">실제로 남아있는 양을 g 단위로 입력하세요. 0 이상만 가능.</p>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_adjustReason" placeholder="조정 사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);

  document.getElementById('btnSaveAdjust').addEventListener('click', async () => {
    const inputVal = document.getElementById('m_actualRemaining').value;
    const reason = document.getElementById('m_adjustReason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (inputVal === '' || isNaN(parseFloat(inputVal))) {
      alert('실제 잔량을 입력해주세요.');
      return;
    }
    const newRemaining = parseFloat(inputVal);
    if (newRemaining < 0) {
      alert('실제 잔량은 0 이상이어야 합니다.\n잔량이 음수가 될 수 없습니다.');
      return;
    }
    if (!reason || !staff) {
      alert('사유와 담당자는 필수입니다.');
      return;
    }
    const delta = newRemaining - remaining;
    if (delta === 0) {
      alert('기존 잔량과 동일합니다. 변경할 값을 입력해주세요.');
      return;
    }

    const adjustDate = getToday();
    if (await blockIfClosed(adjustDate)) return;

    // meatStocks 문서에서 meatTypeId 가져오기 (meatLogs 기록용)
    const stockSnap = await getDoc(doc(db, 'meatStocks', id));
    const stockData = stockSnap.exists() ? stockSnap.data() : {};
    const meatTypeId = stockData.meatTypeId || null;

    await updateDoc(doc(db, 'meatStocks', id), {
      remaining: newRemaining,
      closed: newRemaining === 0,
      updatedAt: new Date(),
    });

    const stageKor = currentTab === 'frozen' ? '냉동창고' : currentTab === 'processed' ? '전처리' : '재포장';
    await recordActivity({
      action: 'meat',
      subAction: 'adjust',
      date: adjustDate,
      staff,
      message: `원육 수동조정 (${stageKor}) — ${name} ${(remaining/1000).toFixed(1)}kg → ${(newRemaining/1000).toFixed(1)}kg / 사유: ${reason} / 담당: ${staff}`,
      details: {
        meatStockId: id,
        meatName: name,
        stage: stageKor,
        delta,
        before: remaining,
        after: newRemaining,
        reason,
      },
    });

    await recordMeatLog({
      type: 'adjust',
      date: adjustDate,
      meatTypeId,
      meatNameSnapshot: name,
      stage: currentTab,
      meatStockId: id,
      delta,
      before: remaining,
      after: newRemaining,
      staff,
      reason,
    });

    closeModal();
    renderTab(currentTab);
    alert('조정 완료!');
  });
}

// 원육 종류 관리 모달
function showMeatTypesModal() {
  showModal(`
    <h3 class="modal-title">원육 종류 관리</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>원육명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(kg)</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${meatTypes.map(m => `
            <tr>
              <td>${m.name}</td>
              <td>${m.defaultUnitWeightG}g</td>
              <td>${(m.minimumQtyG / 1000).toFixed(1)}kg</td>
              <td><button class="btn-del-row" data-id="${m.id}">삭제</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="background:#f9f9f9;border-radius:6px;padding:14px;border:1px solid #eee;">
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 원육 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>원육명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(kg)</label>
          <input type="number" id="m_newMinQty" placeholder="예: 5" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);

  document.querySelectorAll('.btn-del-row').forEach(btn => {
    btn.addEventListener('click', async () => {
      const __c = await showConfirmModal({ title:'삭제 확인', message:'정말 삭제하시겠습니까?', confirmText:'삭제', danger:true }); if (!__c) return;
      await deleteDoc(doc(db, 'meatTypes', btn.dataset.id));
      meatTypes = await loadMeatTypes();
      closeModal();
      showMeatTypesModal();
    });
  });

  document.getElementById('btnAddMeatType').addEventListener('click', async () => {
    const name = document.getElementById('m_newMeatName').value.trim();
    const unitWeight = parseFloat(document.getElementById('m_newUnitWeight').value) || 0;
    const minQty = parseFloat(document.getElementById('m_newMinQty').value) || 0;

    if (!name) { alert('원육명은 필수입니다.'); return; }

    await addDoc(collection(db, 'meatTypes'), {
      name,
      defaultUnitWeightG: unitWeight,
      minimumQtyG: minQty * 1000,
      sortOrder: meatTypes.length,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    meatTypes = await loadMeatTypes();
    closeModal();
    showMeatTypesModal();
  });
}

// 유틸

function getRandomColor() {
  const colors = ['#e8f4ea', '#e8eef8', '#fef0e8', '#f0e8fe', '#fff0e8', '#e8f8f4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

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

// 모달
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

  loadStaffCache();
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};