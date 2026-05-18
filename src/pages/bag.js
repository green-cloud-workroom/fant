import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, query, orderBy, getDoc, where, writeBatch
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { recordActivity } from '../services/activityLogs.js';
import { showConfirmModal } from '../utils/modal.js';
import Sortable from 'sortablejs';

let bagTypes = [];

export async function renderBag() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`;
  [bagTypes] = await Promise.all([
    loadBagTypes(),
    loadStaffCache(),
  ]);
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
  const canManageBagTypes = currentUserRole === 'admin' || currentUserRole === 'office';
  content.innerHTML = `
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          ${canManageBagTypes ? '<button class="btn-primary" id="btnNewBag">+ 추가</button>' : ''}
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
  initBagSortables();
  document.getElementById('btnNewBag')?.addEventListener('click', showNewBagModal);
}

function renderBagList() {
  if (bagTypes.length === 0) return '<div class="list-empty">등록된 봉투 없음</div>';

  const raw = bagTypes.filter(b => b.category === 'raw');
  const freeze = bagTypes.filter(b => b.category === 'freezeDry');

  let html = '';
  if (raw.length > 0) {
    html += `<div class="list-group-label">생식</div>`;
    html += `<div class="sortable-master-list" id="bagListRaw" data-category="raw">${raw.map(b => renderBagItem(b)).join('')}</div>`;
  }
  if (freeze.length > 0) {
    html += `<div class="list-group-label">동결건조</div>`;
    html += `<div class="sortable-master-list" id="bagListFreezeDry" data-category="freezeDry">${freeze.map(b => renderBagItem(b)).join('')}</div>`;
  }
  return html;
}

function renderBagItem(b) {
  const isLow = b.currentQty < (b.minimumQty || 0);
  const inactive = b.active === false;
  const canReorder = currentUserRole === 'admin' || currentUserRole === 'office';
  return `
    <div class="recipe-list-item ${selectedBagId === b.id ? 'active' : ''} ${inactive ? 'inactive-master' : ''}" data-id="${b.id}">
      ${canReorder ? '<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>' : ''}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${inactive ? '#999' : isLow ? '#e53e3e' : '#1a1a1a'}">${b.name}</span>
        <div class="recipe-tags">
          <span class="tag tag-${b.category}">${b.category === 'raw' ? '생식' : '동결'}</span>
          ${inactive ? '<span class="tag tag-inactive">비활성</span>' : ''}
          <span style="font-size:11px;color:${isLow ? '#e53e3e' : '#888'}">
            ${Math.floor((b.currentQty || 0) / (b.piecesPerBox || 1))}박스 (${b.currentQty || 0}장)
          </span>
        </div>
      </div>
      ${currentUserRole === 'admin' || currentUserRole === 'office' ? `
        <label class="toggle-switch" title="${inactive ? '비활성' : '활성'}" onclick="event.stopPropagation()">
          <input type="checkbox" class="bag-active-toggle" data-id="${b.id}" ${inactive ? '' : 'checked'}>
          <span class="toggle-slider"></span>
        </label>
      ` : ''}
    </div>
  `;
}

function initBagSortables() {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;

  [
    ['bagListRaw', 'raw'],
    ['bagListFreezeDry', 'freezeDry'],
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
        await persistBagOrder(category);
      },
    });
  });
}

async function persistBagOrder(category) {
  const listEl = document.getElementById(category === 'raw' ? 'bagListRaw' : 'bagListFreezeDry');
  if (!listEl) return;

  const orderedIds = Array.from(listEl.querySelectorAll('.recipe-list-item'))
    .map(item => item.dataset.id)
    .filter(Boolean);
  const rawCount = bagTypes.filter(b => b.category === 'raw').length;
  const offset = category === 'freezeDry' ? rawCount : 0;
  const now = new Date();
  const batch = writeBatch(db);

  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'bagTypes', id), {
      sortOrder: offset + idx,
      updatedAt: now,
    });
  });

  try {
    await batch.commit();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, offset + idx]));
    bagTypes = bagTypes
      .map(b => orderMap.has(b.id) ? { ...b, sortOrder: orderMap.get(b.id), updatedAt: now } : b)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (err) {
    console.error('[bag] reorder save failed:', err);
    alert('순번 저장 실패: ' + (err.message || err));
    bagTypes = await loadBagTypes();
    renderBagLayout();
    if (selectedBagId) {
      const selected = bagTypes.find(b => b.id === selectedBagId);
      if (selected) await showBagDetail(selected);
    }
  }
}

function bindBagListEvents() {
  document.querySelectorAll('.recipe-list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.drag-handle')) return;
      selectedBagId = item.dataset.id;
      const bag = bagTypes.find(b => b.id === selectedBagId);
      showBagDetail(bag);
      document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  document.querySelectorAll('.bag-active-toggle').forEach(cb => {
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', async (e) => {
      if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
        alert('봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.');
        e.target.checked = !e.target.checked;
        return;
      }
      const id = e.target.dataset.id;
      const active = e.target.checked;
      const target = bagTypes.find(b => b.id === id);
      const previousActive = target?.active !== false;
      try {
        await updateDoc(doc(db, 'bagTypes', id), {
          active,
          updatedAt: new Date(),
        });
        if (target) target.active = active;
        if (previousActive !== active) {
          await recordActivity({
            action: 'bag',
            subAction: 'activeToggle',
            date: getToday(),
            staff: getRoleStaffLabel(),
            message: `봉투 종류 ${active ? '활성' : '비활성'} — ${target?.name || id}`,
            details: {
              bagTypeId: id,
              bagName: target?.name || null,
              active,
            },
          });
        }
        renderBagLayout();
        if (selectedBagId) {
          const selected = bagTypes.find(b => b.id === selectedBagId);
          if (selected) await showBagDetail(selected);
        }
      } catch (err) {
        console.error('[bag] active save failed:', err);
        alert('활성 상태 저장 중 오류가 발생했습니다.');
        e.target.checked = !active;
      }
    });
  });
}

async function showBagDetail(bag) {
  const detail = document.getElementById('bagDetail');
  const canManageBagTypes = currentUserRole === 'admin' || currentUserRole === 'office';

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
        ${canManageBagTypes ? '<button class="btn-secondary" id="btnEditBag">수정</button>' : ''}
        ${canManageBagTypes ? '<button class="btn-danger" id="btnDeleteBag">삭제</button>' : ''}
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
  document.getElementById('btnEditBag')?.addEventListener('click', () => showEditBagModal(bag));
  document.getElementById('btnDeleteBag')?.addEventListener('click', () => deleteBagType(bag));
}

async function loadBagDeleteContext(bag) {
  const [recipeSnap, frozenProductSnap, logSnap] = await Promise.all([
    getDocs(query(collection(db, 'recipes'), where('bagTypeId', '==', bag.id))),
    getDocs(query(collection(db, 'frozenProducts'), where('bagTypeId', '==', bag.id))),
    getDocs(query(collection(db, 'bagLogs'), where('bagTypeId', '==', bag.id))),
  ]);

  return {
    linkedRecipes: recipeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    linkedProducts: frozenProductSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    logDocs: logSnap.docs,
  };
}

function getBagDeleteMessage(bag, logCount) {
  const currentQty = Number(bag.currentQty || 0);
  if (currentQty > 0) {
    return `${bag.name} 재고 ${currentQty}장이 남아있습니다.\n봉투 재고 및 이력 ${logCount}건이 모두 삭제됩니다.\n진행하시겠습니까?`;
  }
  if (logCount > 0) {
    return `입고/조정 이력 ${logCount}건이 함께 삭제됩니다.\n진행하시겠습니까?`;
  }
  return `${bag.name} 봉투를 삭제하시겠습니까?`;
}

async function deleteBagType(bag) {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
    alert('봉투 삭제는 대표/사무실 계정만 가능합니다.');
    return;
  }

  try {
    const { linkedRecipes, linkedProducts, logDocs } = await loadBagDeleteContext(bag);
    const linkedNames = [
      ...linkedRecipes.map(r => r.displayName || r.name || r.id),
      ...linkedProducts.map(p => p.name || p.id),
    ];
    if (linkedNames.length > 0) {
      alert(`${linkedNames.join(', ')}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);
      return;
    }

    const logCount = logDocs.length;
    const confirmed = await showConfirmModal({
      title: '봉투 삭제',
      message: getBagDeleteMessage(bag, logCount),
      confirmText: '삭제',
      danger: true,
    });
    if (!confirmed) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'bagTypes', bag.id));
    logDocs.forEach(logDoc => batch.delete(doc(db, 'bagLogs', logDoc.id)));
    await batch.commit();

    await recordActivity({
      action: 'bag',
      subAction: 'delete',
      date: getToday(),
      staff: getRoleStaffLabel(),
      message: `봉투 삭제 — ${bag.name}`,
      details: {
        bagTypeId: bag.id,
        bagName: bag.name,
        bagType: bag.category === 'freezeDry' ? 'dried' : 'raw',
        currentQty: Number(bag.currentQty || 0),
        logCount,
      },
    });

    selectedBagId = null;
    bagTypes = await loadBagTypes();
    renderBagLayout();
    alert('봉투가 삭제되었습니다.');
  } catch (err) {
    console.error('[bag] delete failed:', err);
    alert('봉투 삭제 중 오류가 발생했습니다.');
  }
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
      active: isNew ? true : bag.active !== false,
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
}

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '대표';
  if (currentUserRole === 'office') return '사무실';
  if (currentUserRole === 'production') return '생산실';
  return '시스템';
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
