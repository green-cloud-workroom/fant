import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';

export async function renderSchedule() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`;
  await loadStaffCache();
  const schedules = await loadSchedules();
  renderScheduleLayout(schedules);
}

async function loadSchedules() {
  const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadMeatTypes() {
  const snap = await getDocs(collection(db, 'meatTypes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadBagTypes() {
  const snap = await getDocs(collection(db, 'bagTypes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function renderScheduleLayout(schedules) {
  const content = document.getElementById('mainContent');
  const today = getToday();

  const active = schedules.filter(s => s.status === 'scheduled');
  const done = schedules.filter(s => s.status !== 'scheduled');

  let showDone = false;

  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">입고 예정관리</h2>
        <button class="btn-primary" id="btnAddSchedule">+ 입고 예정 등록</button>
      </div>

      <!-- 활성 목록 -->
      <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;margin-bottom:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>예정일</th>
              <th>구분</th>
              <th>품목명</th>
              <th>발주수량</th>
              <th>발주담당자</th>
              <th>입고메모</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${active.length === 0 ?
              `<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>` :
              active.map(s => renderScheduleRow(s, today)).join('')}
          </tbody>
        </table>
      </div>

      <!-- 완료/취소 토글 -->
      <div style="margin-bottom:12px;">
        <button class="btn-secondary" id="btnToggleDone">완료/취소 항목 보기</button>
      </div>
      <div id="doneSection" style="display:none;">
        <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>예정일</th>
                <th>구분</th>
                <th>품목명</th>
                <th>발주수량</th>
                <th>실제수량</th>
                <th>입고담당자</th>
                <th>상태</th>
                <th>완료메모</th>
              </tr>
            </thead>
            <tbody>
              ${done.length === 0 ?
                `<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>` :
                done.map(s => renderDoneRow(s)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnAddSchedule').addEventListener('click', showAddScheduleModal);
  document.getElementById('btnToggleDone').addEventListener('click', () => {
    const section = document.getElementById('doneSection');
    showDone = !showDone;
    section.style.display = showDone ? '' : 'none';
    document.getElementById('btnToggleDone').textContent = showDone ? '완료/취소 항목 숨기기' : '완료/취소 항목 보기';
  });

  document.querySelectorAll('.btn-complete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const s = schedules.find(sc => sc.id === id);
      if (s) showCompleteModal(s);
    });
  });

  document.querySelectorAll('.btn-cancel-schedule').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const reason = prompt('취소 사유를 입력해주세요:');
      if (!reason) return;
      await updateDoc(doc(db, 'schedules', id), {
        status: 'cancelled',
        cancelReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      });
      const newSchedules = await loadSchedules();
      renderScheduleLayout(newSchedules);
    });
  });
}

function renderScheduleRow(s, today) {
  const isOverdue = s.date < today;
  return `
    <tr style="background:${isOverdue ? '#fffdf0' : 'white'}">
      <td style="color:${isOverdue ? '#e67e22' : '#1a1a1a'}">${s.date} ${isOverdue ? '⚠️' : ''}</td>
      <td><span class="tag tag-raw">${getTypeLabel(s.type)}</span></td>
      <td>${s.itemNameSnapshot}</td>
      <td>${s.orderedQty}${s.orderedUnit}</td>
      <td>${s.orderStaffName || '-'}</td>
      <td>${s.orderMemo || '-'}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        <button class="btn-primary btn-complete" data-id="${s.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        <button class="btn-secondary btn-cancel-schedule" data-id="${s.id}" style="font-size:11px;padding:3px 10px;">취소</button>
      </td>
    </tr>
  `;
}

function renderDoneRow(s) {
  const isComplete = s.status === 'completed';
  return `
    <tr style="opacity:0.8">
      <td>${s.date}</td>
      <td><span class="tag tag-raw">${getTypeLabel(s.type)}</span></td>
      <td>${s.itemNameSnapshot}</td>
      <td>${s.orderedQty}${s.orderedUnit}</td>
      <td>${s.actualQty || '-'}</td>
      <td>${s.incomingStaffName || '-'}</td>
      <td>
        <span style="color:${isComplete ? '#2d7a3a' : '#e53e3e'};font-size:12px">
          ${isComplete ? '✅ 완료' : '❌ 취소'}
        </span>
      </td>
      <td>${s.completeMemo || s.cancelReason || '-'}</td>
    </tr>
  `;
}

function getTypeLabel(type) {
  return type === 'meat' ? '원육' : type === 'bag' ? '봉투' : '계란';
}

async function showAddScheduleModal() {
  const meatTypes = await loadMeatTypes();
  const bagTypes = await loadBagTypes();

  showModal(`
    <h3 class="modal-title">입고 예정 등록</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>구분 *</label>
      <select id="m_type" onchange="updateScheduleItem()">
        <option value="">선택</option>
        <option value="meat">원육</option>
        <option value="bag">봉투</option>
        <option value="egg">계란</option>
      </select>
    </div>
    <div class="form-group" id="itemSelectWrap" style="display:none;">
      <label>품목 *</label>
      <select id="m_item">
        <option value="">선택</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>발주수량 *</label>
        <input type="number" id="m_qty" placeholder="수량" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="장">장</option>
          <option value="박스">박스</option>
          <option value="개">개</option>
          <option value="판">판</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>발주 담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['office'])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">등록</button>
    </div>
  `);

  window.updateScheduleItem = () => {
    const type = document.getElementById('m_type').value;
    const wrap = document.getElementById('itemSelectWrap');
    const select = document.getElementById('m_item');

    if (type === 'egg') {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = '';
    select.innerHTML = '<option value="">선택</option>';

    const items = type === 'meat' ? meatTypes : bagTypes;
    items.forEach(item => {
      select.innerHTML += `<option value="${item.id}" data-name="${item.name}">${item.name}</option>`;
    });
  };

  document.getElementById('btnSaveSchedule').addEventListener('click', async () => {
    const date = document.getElementById('m_date').value;
    const type = document.getElementById('m_type').value;
    const qty = parseFloat(document.getElementById('m_qty').value);
    const unit = document.getElementById('m_unit').value;
    const staff = document.getElementById('m_staff').value;
    const memo = document.getElementById('m_memo').value;

    if (!date || !type || !qty) { alert('날짜, 구분, 수량은 필수입니다.'); return; }

    let itemId = null;
    let itemName = '계란';

    if (type !== 'egg') {
      const itemSelect = document.getElementById('m_item');
      itemId = itemSelect.value;
      const opt = itemSelect.options[itemSelect.selectedIndex];
      itemName = opt?.dataset?.name || '';
      if (!itemId) { alert('품목을 선택해주세요.'); return; }
    }

    await addDoc(collection(db, 'schedules'), {
      date, type,
      itemId,
      itemNameSnapshot: itemName,
      orderedQty: qty,
      orderedUnit: unit,
      status: 'scheduled',
      orderStaffName: staff,
      orderMemo: memo,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    closeModal();
    const newSchedules = await loadSchedules();
    renderScheduleLayout(newSchedules);
    alert('입고 예정 등록 완료!');
  });
}

function showCompleteModal(s) {
  showModal(`
    <h3 class="modal-title">입고 완료 처리 — ${s.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${s.orderedQty}${s.orderedUnit}</p>
    <div class="form-group">
      <label>실제 수량 *</label>
      <input type="number" id="m_actual" value="${s.orderedQty}" />
    </div>
    <div class="form-group">
      <label>입고 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead'])}
      </select>
    </div>
    <div class="form-group">
      <label>완료메모</label>
      <input type="text" id="m_memo" placeholder="메모" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveComplete">완료 처리</button>
    </div>
  `);

  document.getElementById('btnSaveComplete').addEventListener('click', async () => {
    const actual = parseFloat(document.getElementById('m_actual').value);
    const staff = document.getElementById('m_staff').value;
    const memo = document.getElementById('m_memo').value;

    if (!actual || !staff) { alert('실제 수량과 담당자는 필수입니다.'); return; }

    // 재고 자동 입고
    const today = getToday();
    if (s.type === 'meat' && s.itemId) {
      const meatSnap = await getDoc(doc(db, 'meatTypes', s.itemId));
      if (meatSnap.exists()) {
        const qtyG = s.orderedUnit === 'kg' ? actual * 1000 : actual;
        await addDoc(collection(db, 'meatStocks'), {
          meatTypeId: s.itemId,
          meatNameSnapshot: s.itemNameSnapshot,
          stage: 'frozen',
          incomingDate: today,
          initialQtyG: qtyG,
          remaining: qtyG,
          staffName: staff,
          note: `입고예정 완료: ${s.orderMemo || ''}`,
          closed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else if (s.type === 'bag' && s.itemId) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', s.itemId));
      if (bagSnap.exists()) {
        const bagData = bagSnap.data();
        const qtyPcs = s.orderedUnit === '박스' ? actual * (bagData.piecesPerBox || 1) : actual;
        const before = bagData.currentQty || 0;
        await updateDoc(doc(db, 'bagTypes', s.itemId), {
          currentQty: before + qtyPcs,
          updatedAt: new Date(),
        });
        await addDoc(collection(db, 'bagLogs'), {
          date: today, timestamp: new Date(),
          bagTypeId: s.itemId,
          bagNameSnapshot: s.itemNameSnapshot,
          type: 'incoming', qty: qtyPcs,
          before, after: before + qtyPcs,
          staffName: staff,
          note: `입고예정 완료`,
        });
      }
    } else if (s.type === 'egg') {
      const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
      const current = eggSnap.exists() ? eggSnap.data().currentQty : 0;
      const minQty = eggSnap.exists() ? eggSnap.data().minimumQty : 0;
      const qtyEgg = s.orderedUnit === '판' ? actual * 30 : actual;
      await updateDoc(doc(db, 'eggStock', 'global'), {
        currentQty: current + qtyEgg,
        minimumQty: minQty,
        updatedAt: new Date(),
      });
      await addDoc(collection(db, 'eggLogs'), {
        date: today, timestamp: new Date(),
        type: 'in', qty: qtyEgg,
        before: current, after: current + qtyEgg,
        staffName: staff, note: '입고예정 완료',
      });
    }

    await updateDoc(doc(db, 'schedules', s.id), {
      status: 'completed',
      actualQty: actual,
      incomingStaffName: staff,
      completeMemo: memo,
      completedAt: new Date(),
      updatedAt: new Date(),
    });

    closeModal();
    const newSchedules = await loadSchedules();
    renderScheduleLayout(newSchedules);
    alert('완료 처리되었습니다!');
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