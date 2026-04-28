import { MENUS, currentUserRole, currentMenu, setCurrentMenu, handleLogout } from './app.js';
import { renderPage } from './router.js';

export function renderLayout() {
  const visibleMenus = MENUS.filter(m => m.roles.includes(currentUserRole));

  document.getElementById('app').innerHTML = `
    <div class="app-wrapper">
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

  updateSubbar();
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

    // 계란 재고
    const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
    const eggQty = eggSnap.exists() ? eggSnap.data().currentQty : 0;
    document.getElementById('subEgg').textContent = `🥚 ${eggQty}개`;

    // 부족재고
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

    // 입고예정
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