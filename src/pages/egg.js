import { db } from '../firebase.js';
import {
  collection, getDocs, doc, setDoc, addDoc, updateDoc, getDoc, query, orderBy
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { recordActivity } from '../services/activityLogs.js';

export async function renderEgg() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;

  await loadStaffCache();
  const eggStock = await loadEggStock();
  const logs = await loadEggLogs();
  renderEggLayout(eggStock, logs);
}

async function loadEggStock() {
  const snap = await getDoc(doc(db, 'eggStock', 'global'));
  if (snap.exists()) return snap.data();
  return { currentQty: 0, minimumQty: 0 };
}

async function loadEggLogs() {
  const q = query(collection(db, 'eggLogs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 50);
}

function renderEggLayout(eggStock, logs) {
  const content = document.getElementById('mainContent');
  const isLow = eggStock.currentQty < eggStock.minimumQty;

  content.innerHTML = `
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">계란</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnSetMinEgg">최소재고 설정</button>
          <button class="btn-secondary" id="btnAdjustEgg">수동조정</button>
          <button class="btn-secondary" id="btnEggOut">계란 출고</button>
          <button class="btn-primary" id="btnEggIn">+ 계란 입고</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 재고</span>
            <span class="stat-value" style="font-size:24px;color:${isLow ? '#e53e3e' : '#1a1a1a'}">${eggStock.currentQty}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value">${eggStock.minimumQty}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">상태</span>
            <span class="stat-value" style="color:${isLow ? '#e53e3e' : '#2d7a3a'}">${isLow ? '⚠️ 부족' : '✅ 정상'}</span>
          </div>
        </div>
      </div>

      <!-- 이력 테이블 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:20px;border:1px solid #e8e8e8;">
        <div class="section-header">
          <span class="section-title">입출고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>수량(개)</th>
                <th>변경 전</th>
                <th>변경 후</th>
                <th>담당자</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
                logs.map(l => `
                  <tr>
                    <td>${l.date || '-'}</td>
                    <td>
                      <span class="tag ${l.type === 'in' ? 'tag-raw' : l.type === 'out' ? 'tag-cat' : ''}"
                            style="${l.type === 'adjust' ? 'background:#fff0e8;color:#8a4a2d' : ''}">
                        ${l.type === 'in' ? '입고' : l.type === 'out' ? '출고' : '수동조정'}
                      </span>
                    </td>
                    <td style="color:${l.qty > 0 ? '#2d7a3a' : '#e53e3e'};font-weight:600">
                      ${l.qty > 0 ? '+' : ''}${l.qty}
                    </td>
                    <td>${l.before ?? '-'}</td>
                    <td>${l.after ?? '-'}</td>
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

  document.getElementById('btnEggIn').addEventListener('click', () => showEggModal('in', eggStock));
  document.getElementById('btnEggOut').addEventListener('click', () => showEggModal('out', eggStock));
  document.getElementById('btnAdjustEgg').addEventListener('click', () => showEggAdjustModal(eggStock));
  document.getElementById('btnSetMinEgg').addEventListener('click', () => showSetMinModal(eggStock));
}

function showEggModal(type, eggStock) {
  const isIn = type === 'in';
  showModal(`
    <h3 class="modal-title">계란 ${isIn ? '입고' : '출고'}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${eggStock.currentQty}개</p>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['senior', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEgg">${isIn ? '입고' : '출고'}</button>
    </div>
  `);

  document.getElementById('btnSaveEgg').addEventListener('click', async () => {
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!qty || !date) { alert('수량과 날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (!isIn && qty > eggStock.currentQty) { alert('재고가 부족합니다.'); return; }
    if (await blockIfClosed(date)) return;

    const delta = isIn ? qty : -qty;
    const before = eggStock.currentQty;
    const after = before + delta;

    await setDoc(doc(db, 'eggStock', 'global'), {
      currentQty: after,
      minimumQty: eggStock.minimumQty,
      updatedAt: new Date(),
    });

    await addDoc(collection(db, 'eggLogs'), {
      date,
      timestamp: new Date(),
      type: isIn ? 'in' : 'out',
      qty: delta,
      before,
      after,
      staffName: staff,
      note,
    });

    // [묶음 5A] 사무 로그 발행 — 계란 입고/출고 (운영자가 메인 화면에서 변동 추적 가능하게)
    const sign = isIn ? '+' : '-';
    await recordActivity({
      action: 'egg',
      subAction: isIn ? 'in' : 'out',
      date,
      staff,
      message: `계란 ${isIn ? '입고' : '출고'} — ${sign}${qty}개 / 담당: ${staff}`,
      details: {
        delta,
        before,
        after,
        note: note || null,
      },
    });

    closeModal();
    const newStock = await loadEggStock();
    const logs = await loadEggLogs();
    renderEggLayout(newStock, logs);
    alert(`${isIn ? '입고' : '출고'} 완료!`);
  });
}


function showEggAdjustModal(eggStock) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${eggStock.currentQty}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(개) *</label>
        <input type="number" id="m_qty" placeholder="개수" />
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
        ${getStaffOptions(['senior', 'office'])}
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
    const before = eggStock.currentQty;
    const after = before + delta;

    // [음수 차단]
    if (after < 0) {
      alert(`조정 후 잔량이 ${after}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${before}개에서 최대 ${before}개까지만 감소 가능합니다.`);
      return;
    }

    await setDoc(doc(db, 'eggStock', 'global'), {
      currentQty: after,
      minimumQty: eggStock.minimumQty,
      updatedAt: new Date(),
    });

    await addDoc(collection(db, 'eggLogs'), {
      date: getToday(),
      timestamp: new Date(),
      type: 'adjust',
      qty: delta,
      before,
      after,
      staffName: staff,
      reason,
    });
    const sign = delta >= 0 ? '+' : '';
    await recordActivity({
      action: 'egg',
      subAction: 'adjust',
      date: today,
      staff,
      message: `계란 수동조정 — ${sign}${delta}개 / 사유: ${reason} / 담당: ${staff}`,
      details: {
        delta,
        before,
        after,
        reason,
      },
    });

    closeModal();
    const newStock = await loadEggStock();
    const logs = await loadEggLogs();
    renderEggLayout(newStock, logs);
    alert('조정 완료!');
  });
}

function showSetMinModal(eggStock) {
  showModal(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${eggStock.minimumQty || 0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `);

  document.getElementById('btnSaveMin').addEventListener('click', async () => {
    const minQty = parseInt(document.getElementById('m_minQty').value) || 0;
    await setDoc(doc(db, 'eggStock', 'global'), {
      currentQty: eggStock.currentQty,
      minimumQty: minQty,
      updatedAt: new Date(),
    });
    closeModal();
    const newStock = await loadEggStock();
    const logs = await loadEggLogs();
    renderEggLayout(newStock, logs);
    alert('설정 완료!');
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

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};