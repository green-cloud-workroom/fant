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
    processedIn: '전처리 입고',
    processedOut: '소분으로 출고',
    repackedIn: '소분 입고',
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
          <button class="tab-btn ${currentTab === 'repacked' ? 'active' : ''}" data-tab="repacked">소분</button>
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

// ?됰룞李쎄퀬 ??
function renderFrozenTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      <button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">목록</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>용량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">?깅줉???ш퀬 ?놁쓬</td></tr>` :
              stocks.map(s => `
                <tr>
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.incomingDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">議곗젙</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">?대젰</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>?좎쭨</th>
              <th>?먮즺紐?/th>
              <th>援щ텇</th>
              <th>?섎웾</th>
              <th>?대떦??/th>
              <th>?ъ쑀</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">?대젰 ?놁쓬</td></tr>` :
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
      alert('?먯쑁 醫낅쪟 愿由щ뒗 ????щТ??怨꾩젙留?媛?ν빀?덈떎.');
      return;
    }
    showMeatTypesModal();
  });
  document.querySelectorAll('.btn-adjust').forEach(btn => {
    btn.addEventListener('click', () => showAdjustModal(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.remaining)));
  });
}

// ?꾩쿂由???
function renderProcessedTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">목록</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>?먯쑁紐?/th>
              <th>?묒뾽??/th>
              <th>?붾웾</th>
              <th>?섎룞議곗젙</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">?깅줉???꾩쿂由??ш퀬 ?놁쓬</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.processedDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">議곗젙</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">?대젰</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>?좎쭨</th>
              <th>?먮즺紐?/th>
              <th>援щ텇</th>
              <th>?섎웾</th>
              <th>?대떦??/th>
              <th>?ъ쑀</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">?대젰 ?놁쓬</td></tr>` :
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

// ?ы룷????
function renderRepackedTab(stocks, logs) {
  const tabContent = document.getElementById('tabContent');
  tabContent.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 소분 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">목록</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>?먯쑁紐?/th>
              <th>?묒뾽??/th>
              <th>?붾웾</th>
              <th>?섎룞議곗젙</th>
            </tr>
          </thead>
          <tbody>
            ${stocks.length === 0 ? `<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">?깅줉???ы룷???ш퀬 ?놁쓬</td></tr>` :
              stocks.map(s => `
                <tr style="background:${s.batchColor || 'white'}11">
                  <td>${s.meatNameSnapshot}</td>
                  <td>${s.repackedDate || '-'}</td>
                  <td style="font-weight:600;color:${s.remaining < 0 ? '#e53e3e' : '#1a1a1a'}">${(s.remaining / 1000).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${s.id}" data-name="${s.meatNameSnapshot}" data-remaining="${s.remaining}">議곗젙</button></td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">?대젰</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>?좎쭨</th>
              <th>?먮즺紐?/th>
              <th>援щ텇</th>
              <th>?섎웾</th>
              <th>?대떦??/th>
              <th>?ъ쑀</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">?대젰 ?놁쓬</td></tr>` :
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

// ?먯쑁 ?낃퀬 ?깅줉 紐⑤떖
function showAddFrozenModal() {
  showModal(`
    <h3 class="modal-title">?먯쑁 ?낃퀬 ?깅줉</h3>
    <div class="form-group">
      <label>?먯쑁 醫낅쪟 *</label>
      <select id="m_meatType">
        <option value="">?좏깮</option>
        ${meatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>以묐웾 *</label>
        <input type="number" id="m_weight" placeholder="以묐웾" />
      </div>
      <div class="form-group">
        <label>?⑥쐞</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>?낃퀬??/label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>?대떦??/label>
      <select id="m_staff">
        <option value="">?좏깮</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>鍮꾧퀬</label>
      <input type="text" id="m_note" placeholder="鍮꾧퀬" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">痍⑥냼</button>
      <button class="btn-primary" id="btnSaveFrozen">異붽?</button>
    </div>
  `);

  document.getElementById('btnSaveFrozen').addEventListener('click', async () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('?먯쑁 ?낃퀬 ?깅줉? ????щТ??怨꾩젙留?媛?ν빀?덈떎.');
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
      alert('?먯쑁 醫낅쪟, 以묐웾, ?좎쭨???꾩닔?낅땲??');
      return;
    }
    if (!staff) {
      alert('?대떦?먮? ?좏깮?댁＜?몄슂.');
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

    // [臾띠쓬 5A] ?щТ 濡쒓렇 諛쒗뻾 ???먯쑁 ?낃퀬 (?댁쁺?먭? 硫붿씤 ?붾㈃?먯꽌 蹂??異붿쟻 媛?ν븯寃?
    await recordActivity({
      action: 'meat',
      subAction: 'incoming',
      date,
      staff,
      message: `?먯쑁 ?낃퀬 (?됰룞李쎄퀬) ??${meatName} +${(qtyG/1000).toFixed(1)}kg / ?대떦: ${staff}`,
      details: {
        meatStockId: stockRef.id,
        meatTypeId,
        meatName,
        stage: 'frozen',
        qtyG,
        note: note || null,
      },
    });

    closeModal();
    renderTab('frozen');
    alert('?낃퀬 ?깅줉 ?꾨즺!');
  });
}

// ?꾩쿂由??깅줉 紐⑤떖
function showAddProcessedModal() {
  showModal(`
    <h3 class="modal-title">?꾩쿂由??깅줉</h3>
    <div class="form-group">
      <label>?먯쑁 醫낅쪟 *</label>
      <select id="m_meatType">
        <option value="">?좏깮</option>
        ${meatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>媛쒕떦 以묐웾(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>媛쒖닔 *</label>
        <input type="number" id="m_count" placeholder="媛쒖닔" />
      </div>
    </div>
    <div class="form-group">
      <label>?꾩쿂由ъ씪</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>?대떦??/label>
      <select id="m_staff">
        <option value="">?좏깮</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>鍮꾧퀬</label>
      <input type="text" id="m_note" placeholder="鍮꾧퀬" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">痍⑥냼</button>
      <button class="btn-primary" id="btnSaveProcessed">異붽?</button>
    </div>
  `);

  // ?먯쑁 ?좏깮 ??湲곕낯 媛쒕떦以묐웾 ?먮룞 ?명똿
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
      alert('?먯쑁 醫낅쪟, 媛쒕떦 以묐웾, 媛쒖닔, ?좎쭨???꾩닔?낅땲??');
      return;
    }
    if (!staff) {
      alert('?대떦?먮? ?좏깮?댁＜?몄슂.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const totalG = unitWeight * count;

    // ?됰룞李쎄퀬 ?붾웾 ?뺤씤 (FIFO ?쒖꽌: incomingDate ?ㅻ쫫李⑥닚)
    const allFrozen = await loadMeatStocks('frozen');
    const candidates = allFrozen
      .filter(s => s.meatTypeId === meatTypeId && s.remaining > 0)
      .sort((a, b) => (a.incomingDate || '').localeCompare(b.incomingDate || ''));

    const totalAvailable = candidates.reduce((sum, s) => sum + s.remaining, 0);
    if (totalAvailable < totalG) {
      alert(`?됰룞李쎄퀬 ?붾웾??遺議깊빀?덈떎.\n${meatName}: ?꾩슂 ${(totalG/1000).toFixed(1)}kg / ?꾩옱 ${(totalAvailable/1000).toFixed(1)}kg`);
      return;
    }

    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    // ?됰룞李쎄퀬 FIFO 李④컧 + frozenOut 濡쒓렇
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
        reason: '?꾩쿂由??깅줉 ?먮룞李④컧',
        batchId,
      });

      remainingToDeduct -= deduct;
    }

    // ?꾩쿂由??좉퇋 ??異붽?
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
    alert('?꾩쿂由??깅줉 ?꾨즺!');
  });
}

// ?ы룷???깅줉 紐⑤떖
function showAddRepackedModal() {
  showModal(`
    <h3 class="modal-title">?ы룷???깅줉</h3>
    <div class="form-group">
      <label>?먯쑁 醫낅쪟 *</label>
      <select id="m_meatType">
        <option value="">?좏깮</option>
        ${meatTypes.map(m => `<option value="${m.id}" data-weight="${m.defaultUnitWeightG}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>媛쒕떦 以묐웾(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>媛쒖닔 *</label>
        <input type="number" id="m_count" placeholder="媛쒖닔" />
      </div>
    </div>
    <div class="form-group">
      <label>?ы룷?μ씪</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>?대떦??/label>
      <select id="m_staff">
        <option value="">?좏깮</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>鍮꾧퀬</label>
      <input type="text" id="m_note" placeholder="鍮꾧퀬" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">痍⑥냼</button>
      <button class="btn-primary" id="btnSaveRepacked">異붽?</button>
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
      alert('?먯쑁 醫낅쪟, 媛쒕떦 以묐웾, 媛쒖닔, ?좎쭨???꾩닔?낅땲??');
      return;
    }
    if (!staff) {
      alert('?대떦?먮? ?좏깮?댁＜?몄슂.');
      return;
    }
    if (await blockIfClosed(date)) return;

    const totalG = unitWeight * count;

    // 媛숈? ?먯쑁 ?쒖꽦 ?ы룷????以묐났 李⑤떒 (spec 9????)
    const allRepacked = await loadMeatStocks('repacked');
    const existingActive = allRepacked.find(s => s.meatTypeId === meatTypeId && s.remaining > 0);
    if (existingActive) {
      alert(`媛숈? ?먯쑁???ы룷???됱씠 ?대? 議댁옱?⑸땲??\n${meatName}: 湲곗〈 ?붾웾 ${(existingActive.remaining/1000).toFixed(1)}kg\n湲곗〈 ?ы룷?μ쓣 紐⑤몢 ?ъ슜?????깅줉?섏꽭??`);
      return;
    }

    // ?꾩쿂由??붾웾 ?뺤씤 (FIFO ?쒖꽌: processedDate ?ㅻ쫫李⑥닚)
    const allProcessed = await loadMeatStocks('processed');
    const candidates = allProcessed
      .filter(s => s.meatTypeId === meatTypeId && s.remaining > 0)
      .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));

    const totalAvailable = candidates.reduce((sum, s) => sum + s.remaining, 0);
    if (totalAvailable < totalG) {
      alert(`?꾩쿂由??붾웾??遺議깊빀?덈떎.\n${meatName}: ?꾩슂 ${(totalG/1000).toFixed(1)}kg / ?꾩옱 ${(totalAvailable/1000).toFixed(1)}kg`);
      return;
    }

    const batchId = Date.now().toString();
    const batchColor = getRandomColor();

    // ?꾩쿂由?FIFO 李④컧 + processedOut 濡쒓렇
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
        reason: '?ы룷???깅줉 ?먮룞李④컧',
        batchId,
      });

      remainingToDeduct -= deduct;
    }

    // ?ы룷???좉퇋 ??異붽?
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
    alert('?ы룷???깅줉 ?꾨즺!');
  });
}

// ?섎룞 議곗젙 紐⑤떖
function showAdjustModal(id, name, remaining) {
  showModal(`
    <h3 class="modal-title">?섎룞 ?ш퀬 議곗젙 ??${name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">湲곗〈 ?붾웾: <strong>${(remaining/1000).toFixed(1)}kg</strong> (${remaining}g)</p>
    <div class="form-group">
      <label>?ㅼ젣 ?붾웾 (g) *</label>
      <input type="number" id="m_actualRemaining" placeholder="?ㅼ젣 ?붾웾(g) ?낅젰" min="0" step="1" />
      <p style="font-size:11px;color:#aaa;margin-top:4px;">?ㅼ젣濡??⑥븘?덈뒗 ?묒쓣 g ?⑥쐞濡??낅젰?섏꽭?? 0 ?댁긽留?媛??</p>
    </div>
    <div class="form-group">
      <label>?ъ쑀 *</label>
      <input type="text" id="m_adjustReason" placeholder="議곗젙 ?ъ쑀 ?낅젰" />
    </div>
    <div class="form-group">
      <label>?대떦??*</label>
      <select id="m_staff">
        <option value="">?좏깮</option>
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">痍⑥냼</button>
      <button class="btn-primary" id="btnSaveAdjust">議곗젙</button>
    </div>
  `);

  document.getElementById('btnSaveAdjust').addEventListener('click', async () => {
    const inputVal = document.getElementById('m_actualRemaining').value;
    const reason = document.getElementById('m_adjustReason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (inputVal === '' || isNaN(parseFloat(inputVal))) {
      alert('?ㅼ젣 ?붾웾???낅젰?댁＜?몄슂.');
      return;
    }
    const newRemaining = parseFloat(inputVal);
    if (newRemaining < 0) {
      alert('?ㅼ젣 ?붾웾? 0 ?댁긽?댁뼱???⑸땲??\n?붾웾???뚯닔媛 ?????놁뒿?덈떎.');
      return;
    }
    if (!reason || !staff) {
      alert('?ъ쑀? ?대떦?먮뒗 ?꾩닔?낅땲??');
      return;
    }
    const delta = newRemaining - remaining;
    if (delta === 0) {
      alert('湲곗〈 ?붾웾怨??숈씪?⑸땲?? 蹂寃쏀븷 媛믪쓣 ?낅젰?댁＜?몄슂.');
      return;
    }

    const adjustDate = getToday();
    if (await blockIfClosed(adjustDate)) return;

    // meatStocks 臾몄꽌?먯꽌 meatTypeId 媛?몄삤湲?(meatLogs 湲곕줉??
    const stockSnap = await getDoc(doc(db, 'meatStocks', id));
    const stockData = stockSnap.exists() ? stockSnap.data() : {};
    const meatTypeId = stockData.meatTypeId || null;

    await updateDoc(doc(db, 'meatStocks', id), {
      remaining: newRemaining,
      closed: newRemaining === 0,
      updatedAt: new Date(),
    });

    const stageKor = currentTab === 'frozen' ? '냉동창고' : currentTab === 'processed' ? '전처리' : '소분';
    await recordActivity({
      action: 'meat',
      subAction: 'adjust',
      date: adjustDate,
      staff,
      message: `?먯쑁 ?섎룞議곗젙 (${stageKor}) ??${name} ${(remaining/1000).toFixed(1)}kg ??${(newRemaining/1000).toFixed(1)}kg / ?ъ쑀: ${reason} / ?대떦: ${staff}`,
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
    alert('議곗젙 ?꾨즺!');
  });
}

// ?먯쑁 醫낅쪟 愿由?紐⑤떖
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
            <th>통계 표시</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${meatTypes.map(m => {
            const showInStats = m.showInStats !== false;
            return `
              <tr>
                <td>${m.name}</td>
                <td>${m.defaultUnitWeightG}g</td>
                <td>${(m.minimumQtyG / 1000).toFixed(1)}kg</td>
                <td>
                  <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
                    <input type="checkbox" class="m-show-in-stats" data-id="${m.id}" ${showInStats ? 'checked' : ''}>
                    <span>통계에 표시</span>
                  </label>
                </td>
                <td><button class="btn-del-row" data-id="${m.id}">삭제</button></td>
              </tr>
            `;
          }).join('')}
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

  document.querySelectorAll('.m-show-in-stats').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const showInStats = e.target.checked;
      try {
        await updateDoc(doc(db, 'meatTypes', id), { showInStats, updatedAt: new Date() });
        const target = meatTypes.find(m => m.id === id);
        if (target) target.showInStats = showInStats;
      } catch (err) {
        console.error('[meat] showInStats 저장 실패:', err);
        alert('저장 실패: ' + (err.message || err));
        e.target.checked = !showInStats;
      }
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
      showInStats: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    meatTypes = await loadMeatTypes();
    closeModal();
    showMeatTypesModal();
  });
}
// ?좏떥

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

// 紐⑤떖
function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    // ?몃? ?대┃ ?ロ옒 鍮꾪솢?깊솕 (臾띠쓬 1F: 紐⑤떖 ?щ씪吏??댁뒋 ?고쉶)
  });

  loadStaffCache();
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
