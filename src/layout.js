import { MENUS, currentUserRole, currentMenu, setCurrentMenu, handleLogout } from './app.js';
import { renderPage } from './router.js';
import { formatKstDateWithDay, getTodayKST } from './utils/date.js';

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

  // 배너 클릭 핸들러 — Phase 3d에서 모달 호출로 교체 예정
  const banner = document.getElementById('blockBanner');
  if (banner) {
    banner.addEventListener('click', handleBannerClick);
  }

  updateSubbar();
  updateBlockingBanner();
  renderPage(currentMenu);
}

async function updateSubbar() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = `${kst.getMonth()+1}/${kst.getDate()} (${days[kst.getDay()]})`;

  const future = new Date(kst);
  future.setMonth(future.getMonth() + 18);
  const futureStr = `${String(future.getFullYear()).slice(2)}/${future.getMonth()+1}/${future.getDate()}`;

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

    const todayStr = kst.toISOString().split('T')[0];
    const scheduleSnap = await getDocs(collection(db, 'schedules'));
    const pendingSchedules = scheduleSnap.docs
      .map(d => d.data())
      .filter(s => s.status === 'scheduled' && s.date <= todayStr);
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
 * 표시할 때 차단 항목 데이터를 window.__blockingItems에 저장 (Phase 3d 모달이 사용).
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
      return;
    }

    // 지난 영업일 미마감 → 차단 항목 조회 + 배너 표시
    const blocking = await getAllBlockingItems(earliest);
    window.__blockingItems = blocking;

    banner.textContent = `⚠️ ${formatKstDateWithDay(earliest)} 마감 미처리 — 신규 등록이 차단되었습니다 (클릭하여 상세보기)`;
    banner.style.display = 'block';
  } catch (err) {
    console.error('배너 업데이트 오류:', err);
    banner.style.display = 'none';
    window.__blockingItems = null;
  }
}

/**
 * [Phase 3b]
 * 배너 클릭 핸들러.
 * Phase 3d에서 window.openBlockingModal()을 등록할 예정.
 * 그 전까지는 임시로 alert에 차단 항목 dump.
 */
function handleBannerClick() {
  if (typeof window.openBlockingModal === 'function') {
    window.openBlockingModal();
    return;
  }

  // Phase 3d 미적용 상태 — 임시 fallback
  const data = window.__blockingItems;
  if (!data) {
    alert('차단 항목 데이터 없음 (페이지 새로고침 필요할 수 있음).');
    return;
  }

  if (data.totalBlocked === 0) {
    alert(`${data.date} 마감 미처리\n\n처리할 차단 항목 없음.\nQC 계정에서 마감 버튼만 누르면 해제됩니다.`);
    return;
  }

  const lines = data.items.map((it, i) => `${i + 1}. ${it.label} (점프: ${it.jumpMenu})`);
  alert(`${data.date} 마감 차단 항목 ${data.totalBlocked}개\n\n${lines.join('\n')}\n\n(Phase 3d 모달 적용 후 정식 UI로 교체됨)`);
}
