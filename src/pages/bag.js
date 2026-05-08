import { db } from '../firebase.js';
import {
  collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { recordActivity } from '../services/activityLogs.js';

let bagTypes = [];

export async function renderBag() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`;
  bagTypes = await loadBagTypes();
  renderBagLayout();
}

async function loadBagTypes() {
  const q = query(collection(db, 'bagTypes'), orderBy('sortOrder'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

let selectedBagId = null;

function renderBagLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          <button class="btn-primary" id="btnNewBag">+ 추가</button>
        </div>
        <div class="recipe-list" id="bagList">
          ${renderBagList()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="bagDetail">
        <div class="detail-empty">봉투를 선택해주세요</div>
      </div>
    </div>
  `;

  bindBagListEvents();
  document.getElementById('btnNewBag').addEventListener('click', showNewBagModal);
}

function renderBagList() {
  if (bagTypes.length === 0) return '<div class="list-empty">등록된 봉투 없음</div>';

  const raw = bagTypes.filter(b => b.category === 'raw');
  const freeze = bagTypes.filter(b => b.category === 'freezeDry');

  let html = '';
  if (raw.length > 0) {
    html += `<div class="list-group-label">생식</div>`;
    html += raw.map(b => renderBagItem(b)).join('');
  }
  if (freeze.length > 0) {
    html += `<div class="list-group-label">동결건조</div>`;
    html += freeze.map(b => renderBagItem(b)).join('');
  }
  return html;
}

function renderBagItem(b) {
  const isLow = b.currentQty < (b.minimumQty || 0);
  return `
    <div class="recipe-list-item ${selectedBagId === b.id ? 'active' : ''}" data-id="${b.id}">
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${isLow ? '#e53e3e' : '#1a1a1a'}">${b.name}</span>
        <div class="recipe-tags">
          <span class="tag tag-${b.category}">${b.category === 'raw' ? '생식' : '동결'}</span>
          <span style="font-size:11px;color:${isLow ? '#e53e3e' : '#888'}">
            ${Math.floor((b.currentQty || 0) / (b.piecesPerBox || 1))}박스 (${b.currentQty || 0}장)
          </span>
        </div>
      </div>
    </div>
  `;
}

function bindBagListEvents() {
  document.querySelectorAll('.recipe-list-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedBagId = item.dataset.id;
      const bag = bagTypes.find(b => b.id === selectedBagId);
      showBagDetail(bag);
      document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

async function showBagDetail(bag) {
  const detail = document.getElementById('bagDetail');

  // 입고 이력 로드
  const q = query(collection(db, 'bagLogs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  const logs = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(l => l.bagTypeId === bag.id)
    .slice(0, 30);

  detail.innerHTML = `
    <div class="detail-header">
      <span class="detail-title">${bag.name}</span>
      <div class="detail-actions">
        <button class="btn-secondary" id="btnEditBag">수정</button>
        <button class="btn-secondary" id="btnAdjustBag">수동조정</button>
        <button class="btn-primary" id="btnAddBagIncoming">+ 입고 등록</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 요약 -->
      <div class="form-section">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 재고</span>
            <span class="stat-value">${bag.currentQty || 0}장 (${Math.floor((bag.currentQty || 0) / (bag.piecesPerBox || 1))}박스)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">박스당 장수</span>
            <span class="stat-value">${bag.piecesPerBox || '-'}장</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value" style="color:${(bag.currentQty || 0) < (bag.minimumQty || 0) ? '#e53e3e' : '#1a1a1a'}">
              ${Math.floor((bag.minimumQty || 0) / (bag.piecesPerBox || 1))}박스
            </span>
          </div>
        </div>
      </div>

      <!-- 이력 테이블 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>수량(장)</th>
                <th>담당자</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>` :
                logs.map(l => `
                  <tr>
                    <td>${l.date || '-'}</td>
                    <td>
                      <span class="tag ${l.type === 'incoming' ? 'tag-raw' : l.type === 'autoDeduct' ? '' : 'tag-cat'}" 
                            style="${l.type === 'autoDeduct' ? 'background:#f0f0f0;color:#666' : ''}">
                        ${l.type === 'incoming' ? '입고' : l.type === 'autoDeduct' ? '자동차감' : '수동조정'}
                      </span>
                    </td>
                    <td style="color:${l.qty > 0 ? '#2d7a3a' : '#e53e3e'}">${l.qty > 0 ? '+' : ''}${l.qty}</td>
                    <td>${l.staffName || '-'}</td>
                    <td>${l.note || l.reason || '-'}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnAddBagIncoming').addEventListener('click', () => showBagIncomingModal(bag));
  document.getElementById('btnAdjustBag').addEventListener('click', () => showBagAdjustModal(bag));
  document.getElementById('btnEditBag').addEventListener('click', () => showEditBagModal(bag));
}

function showNewBagModal() {
  showBagModal(null);
}

function showBagModal(bag) {
  const isNew = !bag;
  showModal(`
    <h3 class="modal-title">${isNew ? '봉투 추가' : '봉투 수정'}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${bag?.name || ''}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${!isNew ? 'disabled' : ''}>
          <option value="">선택</option>
          <option value="raw" ${bag?.category === 'raw' ? 'selected' : ''}>생식</option>
          <option value="freezeDry" ${bag?.category === 'freezeDry' ? 'selected' : ''}>동결건조</option>
        </select>
      </div>
      <div class="form-group">
        <label>박스당 장수</label>
        <input type="number" id="m_piecesPerBox" value="${bag?.piecesPerBox || ''}" placeholder="장" />
      </div>
      <div class="form-group">
        <label>최소재고(박스)</label>
        <input type="number" id="m_minBox" value="${bag?.minimumBoxQty || ''}" placeholder="박스" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBag">${isNew ? '추가' : '저장'}</button>
    </div>
  `);

  document.getElementById('btnSaveBag').addEventListener('click', async () => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('봉투 등록/수정은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const name = document.getElementById('m_bagName').value.trim();
    const category = document.getElementById('m_bagCategory').value;
    const piecesPerBox = parseInt(document.getElementById('m_piecesPerBox').value) || 0;
    const minBox = parseInt(document.getElementById('m_minBox').value) || 0;

    if (!name || !category) { alert('봉투명과 종류는 필수입니다.'); return; }

    const data = {
      name,
      category,
      piecesPerBox,
      minimumBoxQty: minBox,
      minimumQty: minBox * piecesPerBox,
      sortOrder: isNew ? bagTypes.length : bag.sortOrder,
      active: true,
      updatedAt: new Date(),
    };

    if (isNew) {
      data.currentQty = 0;
      data.createdAt = new Date();
      await addDoc(collection(db, 'bagTypes'), data);
    } else {
      await updateDoc(doc(db, 'bagTypes', bag.id), data);
    }

    bagTypes = await loadBagTypes();
    closeModal();
    renderBagLayout();
    alert(isNew ? '봉투 추가 완료!' : '수정 완료!');
  });
}

function showEditBagModal(bag) {
  showBagModal(bag);
}

function showBagIncomingModal(bag) {
  showModal(`
    <h3 class="modal-title">봉투 입고 등록 — ${bag.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>수량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수 입력" />
      </div>
      <div class="form-group">
        <label>박스 환산</label>
        <span id="m_boxCalc" style="line-height:36px;font-size:12px;color:#888;">- 박스</span>
      </div>
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBagIncoming">추가</button>
    </div>
  `);

  document.getElementById('m_qty').addEventListener('input', (e) => {
    const qty = parseInt(e.target.value) || 0;
    document.getElementById('m_boxCalc').textContent = `${Math.floor(qty / bag.piecesPerBox)}박스`;
  });

  document.getElementById('btnSaveBagIncoming').addEventListener('click', async () => {
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!qty || !date) { alert('수량과 날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;

    const before = bag.currentQty || 0;
    const after = before + qty;

    await updateDoc(doc(db, 'bagTypes', bag.id), {
      currentQty: after,
      updatedAt: new Date(),
    });

    await addDoc(collection(db, 'bagLogs'), {
      date,
      timestamp: new Date(),
      bagTypeId: bag.id,
      bagNameSnapshot: bag.name,
      type: 'incoming',
      qty,
      before,
      after,
      staffName: staff,
      note,
    });

    // [묶음 5A] 사무 로그 발행 — 봉투 입고 (운영자가 메인 화면에서 변동 추적 가능하게)
    await recordActivity({
      action: 'bag',
      subAction: 'incoming',
      date,
      staff,
      message: `봉투 입고 — ${bag.name} +${qty}장 / 담당: ${staff}`,
      details: {
        bagTypeId: bag.id,
        bagName: bag.name,
        qty,
        before,
        after,
        note: note || null,
      },
    });

    bagTypes = await loadBagTypes();
    closeModal();
    const updatedBag = bagTypes.find(b => b.id === bag.id);
    showBagDetail(updatedBag);
    renderBagList();
    document.getElementById('bagList').innerHTML = renderBagList();
    bindBagListEvents();
    alert('입고 등록 완료!');
  });
}

function showBagAdjustModal(bag) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정 — ${bag.name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${bag.currentQty || 0}장</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
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
    const qty = parseInt(document.getElementById('m_qty').value);
    const reason = document.getElementById('m_reason').value.trim();
    const staff = document.getElementById('m_staff').value;

    if (!qty || !reason || !staff) { alert('조정량, 사유, 담당자는 필수입니다.'); return; }
    const today = getToday();
    if (await blockIfClosed(today)) return;

    const delta = type === 'plus' ? qty : -qty;
    const before = bag.currentQty || 0;
    const after = before + delta;

    // [음수 차단] 수동조정 결과가 음수면 차단. 마이너스 재고는 비현실적 + 후속 차감 검사 망가뜨림.
    if (after < 0) {
      alert(`조정 후 잔량이 ${after}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${before}장에서 최대 ${before}장까지만 감소 가능합니다.`);
      return;
    }

    await updateDoc(doc(db, 'bagTypes', bag.id), {
      currentQty: after,
      updatedAt: new Date(),
    });

    await addDoc(collection(db, 'bagLogs'), {
      date: getToday(),
      timestamp: new Date(),
      bagTypeId: bag.id,
      bagNameSnapshot: bag.name,
      type: 'adjust',
      qty: delta,
      before,
      after,
      staffName: staff,
      reason,
    });
    
    const sign = delta >= 0 ? '+' : '';
    await recordActivity({
      action: 'bag',
      subAction: 'adjust',
      date: today,
      staff,
      message: `봉투 수동조정 — ${bag.name} ${sign}${delta}장 / 사유: ${reason} / 담당: ${staff}`,
      details: {
        bagTypeId: bag.id,
        bagName: bag.name,
        delta,
        before,
        after,
        reason,
      },
    });

    bagTypes = await loadBagTypes();
    closeModal();
    const updatedBag = bagTypes.find(b => b.id === bag.id);
    showBagDetail(updatedBag);
    document.getElementById('bagList').innerHTML = renderBagList();
    bindBagListEvents();
    alert('조정 완료!');
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
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });

  loadStaffCache();
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};