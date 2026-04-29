import { db } from '../firebase.js';
import {
  collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';

let meatTypes = [];
let currentTab = 'frozen';

export async function renderMeat() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>원육 재고 로딩 중...</p></div>`;
  meatTypes = await loadMeatTypes();
  renderMeatLayout();
}

async function loadMeatTypes() {
  const q = query(collection(db, 'meatTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

  const stocks = await loadMeatStocks(tab);

  if (tab === 'frozen') {
    renderFrozenTab(stocks);
  } else if (tab === 'processed') {
    renderProcessedTab(stocks);
  } else {
    renderRepackedTab(stocks);
  }
}

// 냉동창고 탭
function renderFrozenTab(stocks) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div class="tab-content-wrap">
      <div class="tab-actions">
        <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
        <button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>입고일</th>
              <th>입고량</th>
              <th>잔량</th>
              <th>담당자</th>
              <th>비고</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr>
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.incomingDate}</td>
                  <td>${(s.initialQtyG / 1000).toFixed(1)}kg</td>
                  <td style="font-weight:600;color:${s.remaining < 1000 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(1)}kg</td>
                  <td>${s.staffName || '-'}</td>
                  <td>${s.note || '-'}</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnAddFrozen').addEventListener('click', showAddFrozenModal);
  document.getElementById('btnMeatTypes').addEventListener('click', showMeatTypesModal);
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// 전처리 탭
function renderProcessedTab(stocks) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div class="tab-content-wrap">
      <div class="tab-actions">
        <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>입고일</th>
              <th>전처리일</th>
              <th>개당중량</th>
              <th>개수</th>
              <th>총중량</th>
              <th>잔량</th>
              <th>담당자</th>
              <th>비고</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px;">등록된 전처리 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.incomingDate}</td>
                  <td>${s.processedDate || '-'}</td>
                  <td>${s.unitWeightG ? s.unitWeightG + 'g' : '-'}</td>
                  <td>${s.unitCount || '-'}</td>
                  <td>${(s.initialQtyG / 1000).toFixed(1)}kg</td>
                  <td style="font-weight:600">${(s.remaining / 1000).toFixed(1)}kg</td>
                  <td>${s.staffName || '-'}</td>
                  <td>${s.note || '-'}</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
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
function renderRepackedTab(stocks) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div class="tab-content-wrap">
      <div class="tab-actions">
        <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>전처리일</th>
              <th>재포장일</th>
              <th>개당중량</th>
              <th>개수</th>
              <th>총중량</th>
              <th>잔량</th>
              <th>담당자</th>
              <th>비고</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px;">등록된 재포장 재고 없음</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.processedDate || '-'}</td>
                  <td>${s.repackedDate || '-'}</td>
                  <td>${s.unitWeightG ? s.unitWeightG + 'g' : '-'}</td>
                  <td>${s.unitCount || '-'}</td>
                  <td>${(s.initialQtyG / 1000).toFixed(1)}kg</td>
                  <td style="font-weight:600">${(s.remaining / 1000).toFixed(1)}kg</td>
                  <td>${s.staffName || '-'}</td>
                  <td>${s.note || '-'}</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">조정</button></td>
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

    const qtyG = unit === 'kg' ? weight * 1000 : weight;

    await addDoc(collection(db, 'meatStocks'), {
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

    const totalG = unitWeight * count;
    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    await addDoc(collection(db, 'meatStocks'), {
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

    const totalG = unitWeight * count;
    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    await addDoc(collection(db, 'meatStocks'), {
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

    closeModal();
    renderTab('repacked');
    alert('재포장 등록 완료!');
  });
}

// 수동 조정 모달
function showAdjustModal(id, name, remaining) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정 — ${name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 잔량: ${(remaining/1000).toFixed(1)}kg</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량 (g)</label>
        <input type="number" id="m_adjustQty" placeholder="g" />
      </div>
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
    const type = document.getElementById('m_adjustType').value;
    const qty = parseFloat(document.getElementById('m_adjustQty').value);
    const reason = document.getElementById('m_adjustReason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (!qty || !reason || !staff) {
      alert('조정량, 사유, 담당자는 필수입니다.');
      return;
    }

    const delta = type === 'plus' ? qty : -qty;
    const newRemaining = remaining + delta;

    await updateDoc(doc(db, 'meatStocks', id), {
      remaining: newRemaining,
      closed: newRemaining <= 0,
      updatedAt: new Date(),
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
      if (!confirm('삭제하시겠습니까?')) return;
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
    if (e.target === overlay) closeModal();
  });

  loadStaffCache();
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};