import { MENUS, currentUser, currentUserRole, currentMenu, setCurrentMenu, handleLogout } from './app.js';
import { renderPage } from './router.js';
import { formatKstDate, formatKstDateWithDay, getTodayKST } from './utils/date.js';
import { db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

// [Phase 3d] 모달 자동 오픈 1회 플래그 — 모듈 레벨에서 유지
let blockingModalAutoShown = false;

// 로그인 사용자 표시: "alice (대표)" 형태
function getUserBadgeText() {
  const email = currentUser?.email || '';
  const localPart = email.split('@')[0] || '?';
  const roleLabel = {
    admin: '대표',
    office: '사무실',
    production: '생산실',
  }[currentUserRole] || '?';
  return `${localPart} (${roleLabel})`;
}

export function renderLayout() {
  const visibleMenus = MENUS.filter(m => m.roles.includes(currentUserRole));

  document.getElementById('app').innerHTML = `
    <div class="app-wrapper">
      <div class="block-banner" id="blockBanner" style="display:none"></div>

      <nav class="navbar">
        <div class="navbar-menus">
          ${visibleMenus.map(m => `
            <button class="nav-btn ${currentMenu === m.id ? 'active' : ''}" data-menu="${m.id}">
              ${m.label}
            </button>
          `).join('')}
        </div>
        <div class="navbar-right">
          <span class="user-badge" id="userBadge">${getUserBadgeText()}</span>
          <button class="close-btn" id="closingBtn" disabled>마감</button>
          <button class="logout-btn" id="logoutBtn" title="로그아웃">↗</button>
        </div>
      </nav>

      <div class="subbar">
        <span class="subbar-item" id="subToday">📅 --</span>
        <span class="subbar-item" id="sub18months">⏳ --</span>
        <span class="subbar-item" id="subEgg">🥚 --개</span>
        <span class="subbar-item" id="subLowStock">⚠️ 부족재고 --개</span>
        <span class="subbar-item" id="subSchedule">📦 입고예정 --건</span>
        <span class="subbar-item" id="subUnread">🔔 미확인로그 --건</span>
      </div>

      <main class="main-content" id="mainContent"></main>
    </div>
  `;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const menuId = btn.dataset.menu;
      setCurrentMenu(menuId);
      renderLayout();
      renderPage(menuId);
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', handleLogoutClick);
  document.getElementById('closingBtn').addEventListener('click', handleClosingClick);

  // 배너 클릭 핸들러 — Phase 3d에서 window.openBlockingModal 등록되면 모달, 없으면 fallback alert
  const banner = document.getElementById('blockBanner');
  if (banner) {
    banner.addEventListener('click', handleBannerClick);
  }

  updateSubbar();
  updateBlockingBanner();
  updateClosingButton();
  renderPage(currentMenu);
}

async function updateSubbar() {
  // KST 정확한 오늘 + 18개월 후 표시
  const todayKst = getTodayKST();
  const today = formatKstDateWithDay(todayKst);

  const todayAnchor = new Date(todayKst + 'T12:00:00+09:00');
  todayAnchor.setUTCMonth(todayAnchor.getUTCMonth() + 18);
  const futureKstStr = formatKstDate(todayAnchor);
  const [fy, fm, fd] = futureKstStr.split('-').map(Number);
  const futureStr = `${String(fy).slice(2)}/${fm}/${fd}`;

  document.getElementById('subToday').textContent = `📅 ${today}`;
  document.getElementById('sub18months').textContent = `⏳ ${futureStr}`;

  try {
    const { db } = await import('./firebase.js');
    const { getDoc, getDocs, doc, collection } = await import('firebase/firestore');

    const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
    const eggQty = eggSnap.exists() ? eggSnap.data().currentQty : 0;
    document.getElementById('subEgg').textContent = `🥚 ${eggQty}개`;

    const meatTypesSnap = await getDocs(collection(db, 'meatTypes'));
    const meatTypes = meatTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const meatStocksSnap = await getDocs(collection(db, 'meatStocks'));
    const meatStocks = meatStocksSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.closed);

    let lowCount = 0;
    meatTypes.forEach(mt => {
      if (!mt.minimumQtyG) return;
      const total = meatStocks
        .filter(s => s.meatTypeId === mt.id)
        .reduce((sum, s) => sum + (s.remaining || 0), 0);
      if (total < mt.minimumQtyG) lowCount++;
    });

    const bagSnap = await getDocs(collection(db, 'bagTypes'));
    bagSnap.docs.forEach(d => {
      const b = d.data();
      if (b.minimumQty && (b.currentQty || 0) < b.minimumQty) lowCount++;
    });
    document.getElementById('subLowStock').textContent = `⚠️ 부족재고 ${lowCount}개`;

    const scheduleSnap = await getDocs(collection(db, 'schedules'));
    const pendingSchedules = scheduleSnap.docs
      .map(d => d.data())
      .filter(s => s.status === 'scheduled' && s.date <= todayKst);
    document.getElementById('subSchedule').textContent = `📦 입고예정 ${pendingSchedules.length}건`;

    document.getElementById('subUnread').textContent = `🔔 미확인로그 0건`;

  } catch (err) {
    console.error('서브바 업데이트 오류:', err);
  }
}

/**
 * [Phase 3b]
 * 빨간 배너 표시/숨김 결정.
 *
 * 표시 조건: getEarliestUnclosedWorkday() < today
 *   - 지난 영업일 미마감이면 표시
 *   - 오늘이 미마감인 건 정상 (영업 중) → 안 표시
 *   - 모두 마감되어 있으면 안 표시
 *
 * 표시할 때:
 *   - 차단 항목 데이터를 window.__blockingItems에 저장
 *   - updateMenuWarnings() 호출 (Phase 3c)
 *   - 첫 호출이면 모달 자동 오픈 (Phase 3d)
 */
async function updateBlockingBanner() {
  const banner = document.getElementById('blockBanner');
  if (!banner) return;

  try {
    const { getEarliestUnclosedWorkday } = await import('./closing.js');
    const { getAllBlockingItems } = await import('./services/closingChecks.js');

    const earliest = await getEarliestUnclosedWorkday();
    const today = getTodayKST();

    if (!earliest || earliest >= today) {
      banner.style.display = 'none';
      window.__blockingItems = null;
      updateMenuWarnings();
      return;
    }

    // 지난 영업일 미마감 → 차단 항목 조회 + 배너 표시
    const blocking = await getAllBlockingItems(earliest);
    window.__blockingItems = blocking;

    banner.textContent = `⚠️ ${formatKstDateWithDay(earliest)} 마감 미처리 — 신규 등록이 차단되었습니다 (클릭하여 상세보기)`;
    banner.style.display = 'block';

    updateMenuWarnings();

    // [Phase 3d] 첫 호출이면 모달 자동 오픈
    if (!blockingModalAutoShown) {
      blockingModalAutoShown = true;
      showBlockingModal();
    }
  } catch (err) {
    console.error('배너 업데이트 오류:', err);
    banner.style.display = 'none';
    window.__blockingItems = null;
    updateMenuWarnings();
  }
}

/**
 * [Phase 3c]
 * 메뉴 버튼에 ⚠️ 아이콘 추가/제거.
 */
function updateMenuWarnings() {
  document.querySelectorAll('.nav-btn .warning-icon').forEach(el => el.remove());

  const data = window.__blockingItems;
  if (!data || data.totalBlocked === 0) return;

  const blockedMenus = new Set(data.items.map(it => it.jumpMenu));

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const menuId = btn.dataset.menu;
    if (blockedMenus.has(menuId)) {
      const span = document.createElement('span');
      span.className = 'warning-icon';
      span.textContent = ' ⚠️';
      btn.appendChild(span);
    }
  });
}

/**
 * [Phase 3d]
 * 마감 차단 모달 표시.
 *
 * 데이터 소스: window.__blockingItems (Phase 3b에서 캐싱).
 * 호출 시점:
 *   1) 첫 updateBlockingBanner 호출에서 미마감 감지 시 자동 1회
 *   2) 배너 클릭 시 (handleBannerClick → window.openBlockingModal)
 *
 * 차단 항목 0개와 1개 이상 두 가지 본문 분기.
 * 점프 버튼 클릭 시 메뉴 전환 + 모달 닫기.
 */
function showBlockingModal() {
  const data = window.__blockingItems;
  if (!data) return;

  // 기존 모달 제거 (idempotent)
  const existing = document.getElementById('blockingModalOverlay');
  if (existing) existing.remove();

  const dateLabel = formatKstDateWithDay(data.date);

  let bodyHtml;
  if (data.totalBlocked === 0) {
    bodyHtml = `
      <p class="blocking-modal-desc">
        ${dateLabel} 마감이 완료되지 않아 신규 등록이 차단됩니다.
      </p>
      <p class="blocking-modal-desc">
        처리할 차단 항목은 없으니, QC 계정에서 마감 버튼만 누르면 해제됩니다.
      </p>
    `;
  } else {
    const numerals = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
    const itemsHtml = data.items.map((it, i) => {
      const num = numerals[i] || `${i + 1}.`;
      return `
        <div class="blocking-modal-item">
          <span class="blocking-modal-item-num">${num}</span>
          <span class="blocking-modal-item-label">${it.label}</span>
          <button class="btn-primary blocking-modal-jump" data-jump="${it.jumpMenu}">처리하러 가기</button>
        </div>
      `;
    }).join('');

    bodyHtml = `
      <p class="blocking-modal-desc">
        ${dateLabel} 마감이 완료되지 않아 다음 작업들이 차단됩니다:
      </p>
      <ul class="blocking-modal-blocked">
        <li>모든 페이지의 신규 등록 (생산 추가, 입고 등록, 발주 추가 등)</li>
        <li>마감 버튼 (아래 항목 처리 후 가능)</li>
      </ul>
      <p class="blocking-modal-desc-strong">
        마감을 위해 처리해야 할 항목:
      </p>
      <div class="blocking-modal-items">
        ${itemsHtml}
      </div>
      <p class="blocking-modal-foot">
        위 항목 처리 후 QC 계정에서 마감 버튼을 눌러주세요.
      </p>
    `;
  }

  const html = `
    <div class="modal-overlay" id="blockingModalOverlay">
      <div class="modal-box modal-blocking">
        <h3 class="blocking-modal-title">⚠️ 지난 영업일 마감이 처리되지 않았습니다</h3>
        ${bodyHtml}
        <div class="modal-actions">
          <button class="btn-secondary" id="blockingModalClose">닫기</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const overlay = document.getElementById('blockingModalOverlay');

  // 닫기 버튼
  document.getElementById('blockingModalClose').addEventListener('click', () => {
    overlay.remove();
  });

  // 오버레이 바깥 클릭 시 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // 점프 버튼들 — 메뉴 전환 + 모달 닫기
  overlay.querySelectorAll('.blocking-modal-jump').forEach(btn => {
    btn.addEventListener('click', () => {
      const menuId = btn.dataset.jump;
      overlay.remove();
      setCurrentMenu(menuId);
      renderLayout();
      renderPage(menuId);
    });
  });
}

// [Phase 3d] 전역 등록 — Phase 3b의 handleBannerClick이 사용
window.openBlockingModal = showBlockingModal;
/**
 * [Phase 4a]
 * 마감 버튼 라벨 + disabled 상태 갱신.
 *
 * earliest === null → "마감해제" (오늘이 이미 마감됨)
 * earliest === today → "오늘 마감"
 * earliest < today → "어제 마감" (실제로는 가장 빠른 미마감 영업일)
 */
async function updateClosingButton() {
  const btn = document.getElementById('closingBtn');
  if (!btn) return;

  try {
    const { getEarliestUnclosedWorkday } = await import('./closing.js');
    const today = getTodayKST();
    const earliest = await getEarliestUnclosedWorkday();

    if (earliest === null) {
      btn.textContent = '마감해제';
      btn.disabled = false;
      btn.dataset.mode = 'release';
      btn.dataset.targetDate = today;
    } else if (earliest === today) {
      btn.textContent = '오늘 마감';
      btn.disabled = false;
      btn.dataset.mode = 'close';
      btn.dataset.targetDate = today;
    } else {
      btn.textContent = '어제 마감';
      btn.disabled = false;
      btn.dataset.mode = 'close';
      btn.dataset.targetDate = earliest;
    }
  } catch (e) {
    console.error('updateClosingButton error', e);
    btn.textContent = '마감';
    btn.disabled = true;
  }
}

/**
 * [Phase 4b]
 * 마감 버튼 클릭 핸들러.
 *
 * 1. 권한 체크 (production만 가능)
 * 2. mode === 'close' → 차단 항목 체크 후 담당자 선택 모달 → closeDate
 * 3. mode === 'release' → Phase 4c에서 구현
 */
async function handleClosingClick() {
  const btn = document.getElementById('closingBtn');
  if (!btn) return;
  const mode = btn.dataset.mode;
  const targetDate = btn.dataset.targetDate;

  // 권한 체크
  if (currentUserRole !== 'production') {
    alert('마감은 생산실(QC) 계정에서만 가능합니다.');
    return;
  }

  if (mode === 'release') {
    showReleaseConfirmModal(targetDate);
    return;
  }

  if (mode !== 'close') return;

  // 차단 항목 체크
  try {
    const { getAllBlockingItems } = await import('./services/closingChecks.js');
    const result = await getAllBlockingItems(targetDate);

    if (result.totalBlocked > 0) {
      window.__blockingItems = result;
      if (typeof window.openBlockingModal === 'function') {
        window.openBlockingModal();
      }
      return;
    }

    // 차단 없음 → 담당자 선택 모달
    showCloseConfirmModal(targetDate);
  } catch (e) {
    console.error('handleClosingClick error', e);
    alert('마감 처리 중 오류가 발생했습니다. 콘솔 확인.');
  }
}
/**
 * [Phase 4d]
 * 로그아웃 버튼 클릭 핸들러.
 *
 * 오늘 미마감 상태면 confirm 띄움 → 사용자가 OK해야 로그아웃.
 * 오늘 마감 완료 상태면 confirm 없이 바로 로그아웃.
 */
async function handleLogoutClick() {
  try {
    const { isDateClosed } = await import('./closing.js');
    const today = getTodayKST();
    const closed = await isDateClosed(today);

    if (!closed) {
      const ok = confirm(
        '오늘 아직 마감되지 않았습니다.\n' +
        '로그아웃해도 자동으로 마감되지 않습니다.\n\n' +
        '로그아웃 하시겠습니까?'
      );
      if (!ok) return;
    }

    await handleLogout();
  } catch (e) {
    console.error('handleLogoutClick error', e);
    // 마감 상태 체크 실패해도 로그아웃은 진행
    await handleLogout();
  }
}
/**
 * [Phase 4b]
 * 마감 확인 모달 — 담당자 드롭다운 + 확인/취소.
 * 전체 담당자(senior+lead+office) 선택 가능.
 */
async function showCloseConfirmModal(targetDate) {
  // 기존 모달 제거
  const existing = document.getElementById('closeConfirmOverlay');
  if (existing) existing.remove();

  // 담당자 캐시 로드
  const groups = ['senior', 'lead', 'office'];
  const staffByGroup = {};
  for (const key of groups) {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) staffByGroup[key] = snap.data().members || [];
  }

  let staffOptions = '<option value="">선택하세요</option>';
  for (const key of groups) {
    const members = staffByGroup[key] || [];
    members.forEach(m => {
      staffOptions += `<option value="${m.name}">${m.name}</option>`;
    });
  }

  const dateLabel = formatKstDateWithDay(targetDate);

  const html = `
    <div class="modal-overlay" id="closeConfirmOverlay">
      <div class="modal-box">
        <h3 style="margin-top:0">${dateLabel} 마감</h3>
        <p>담당자를 선택해주세요.</p>
        <div style="margin: 16px 0">
          <label style="display:block; margin-bottom:6px; font-size:13px; color:#555">담당자</label>
          <select id="closeStaffSelect" style="width:100%; padding:6px; font-size:14px">
            ${staffOptions}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="closeConfirmCancel">취소</button>
          <button class="btn-primary" id="closeConfirmOk">마감</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  const overlay = document.getElementById('closeConfirmOverlay');

  document.getElementById('closeConfirmCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('closeConfirmOk').addEventListener('click', async () => {
    const staffName = document.getElementById('closeStaffSelect').value;
    if (!staffName) {
      alert('담당자를 선택해주세요.');
      return;
    }

    const okBtn = document.getElementById('closeConfirmOk');
    okBtn.disabled = true;
    okBtn.textContent = '처리 중...';

    try {
      const { closeDate } = await import('./closing.js');
      await closeDate(targetDate, staffName);
      overlay.remove();
      alert(`${dateLabel} 마감 완료`);
      // 라벨/배너 갱신
      updateClosingButton();
      updateBlockingBanner();
    } catch (e) {
      console.error('closeDate error', e);
      alert(`마감 실패: ${e.message}`);
      okBtn.disabled = false;
      okBtn.textContent = '마감';
    }
  });
}
/**
 * [Phase 4c]
 * 마감해제 모달 — 사유(필수) + 담당자(필수).
 * 전체 담당자(senior+lead+office) 선택 가능.
 */
async function showReleaseConfirmModal(targetDate) {
  // 기존 모달 제거
  const existing = document.getElementById('releaseConfirmOverlay');
  if (existing) existing.remove();

  // 담당자 캐시 로드
  const groups = ['senior', 'lead', 'office'];
  const staffByGroup = {};
  for (const key of groups) {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) staffByGroup[key] = snap.data().members || [];
  }

  let staffOptions = '<option value="">선택하세요</option>';
  for (const key of groups) {
    const members = staffByGroup[key] || [];
    members.forEach(m => {
      staffOptions += `<option value="${m.name}">${m.name}</option>`;
    });
  }

  const dateLabel = formatKstDateWithDay(targetDate);

  const html = `
    <div class="modal-overlay" id="releaseConfirmOverlay">
      <div class="modal-box">
        <h3 style="margin-top:0">${dateLabel} 마감해제</h3>
        <p style="color:#c0392b; font-size:13px">마감을 해제하면 해당 날짜의 데이터를 다시 수정할 수 있게 됩니다.</p>
        <div style="margin: 16px 0">
          <label style="display:block; margin-bottom:6px; font-size:13px; color:#555">사유 *</label>
          <textarea id="releaseReason" rows="3" style="width:100%; padding:6px; font-size:14px; font-family:inherit; box-sizing:border-box; resize:vertical" placeholder="해제 사유 입력"></textarea>
        </div>
        <div style="margin: 16px 0">
          <label style="display:block; margin-bottom:6px; font-size:13px; color:#555">담당자 *</label>
          <select id="releaseStaffSelect" style="width:100%; padding:6px; font-size:14px">
            ${staffOptions}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="releaseConfirmCancel">취소</button>
          <button class="btn-primary" id="releaseConfirmOk">마감해제</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  const overlay = document.getElementById('releaseConfirmOverlay');

  document.getElementById('releaseConfirmCancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('releaseConfirmOk').addEventListener('click', async () => {
    const reason = document.getElementById('releaseReason').value.trim();
    const staffName = document.getElementById('releaseStaffSelect').value;

    if (!reason) {
      alert('사유를 입력해주세요.');
      return;
    }
    if (!staffName) {
      alert('담당자를 선택해주세요.');
      return;
    }

    const okBtn = document.getElementById('releaseConfirmOk');
    okBtn.disabled = true;
    okBtn.textContent = '처리 중...';

    try {
      const { releaseClosing } = await import('./closing.js');
      await releaseClosing(targetDate, staffName, reason);
      overlay.remove();
      alert(`${dateLabel} 마감해제 완료`);
      // 라벨/배너 갱신
      updateClosingButton();
      updateBlockingBanner();
    } catch (e) {
      console.error('releaseClosing error', e);
      alert(`마감해제 실패: ${e.message}`);
      okBtn.disabled = false;
      okBtn.textContent = '마감해제';
    }
  });
}
/**
 * [Phase 3b]
 * 배너 클릭 핸들러.
 * window.openBlockingModal이 등록되어 있으면 모달, 없으면 fallback alert.
 */

function handleBannerClick() {
  if (typeof window.openBlockingModal === 'function') {
    window.openBlockingModal();
    return;
  }

  // fallback (Phase 3d 미적용 상태 대비, 실제로는 같은 모듈에서 등록되므로 안 탐)
  const data = window.__blockingItems;
  if (!data) {
    alert('차단 항목 데이터 없음 (페이지 새로고침 필요할 수 있음).');
    return;
  }
  if (data.totalBlocked === 0) {
    alert(`${data.date} 마감 미처리\n처리할 차단 항목 없음.\nQC 계정에서 마감 버튼만 누르면 해제됩니다.`);
    return;
  }
  const lines = data.items.map((it, i) => `${i + 1}. ${it.label}`);
  alert(`${data.date} 마감 차단 항목 ${data.totalBlocked}개\n\n${lines.join('\n')}`);
}
