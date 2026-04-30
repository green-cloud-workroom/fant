import { MENUS, currentUserRole, currentMenu, setCurrentMenu, handleLogout } from './app.js';
import { renderPage } from './router.js';
import { formatKstDate, formatKstDateWithDay, getTodayKST } from './utils/date.js';

// [Phase 3d] 모달 자동 오픈 1회 플래그 — 모듈 레벨에서 유지
let blockingModalAutoShown = false;

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
          <button class="close-btn" id="logoutBtn">마감</button>
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

  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // 배너 클릭 핸들러 — Phase 3d에서 window.openBlockingModal 등록되면 모달, 없으면 fallback alert
  const banner = document.getElementById('blockBanner');
  if (banner) {
    banner.addEventListener('click', handleBannerClick);
  }

  updateSubbar();
  updateBlockingBanner();
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
