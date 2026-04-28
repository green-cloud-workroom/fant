import { MENUS, currentUserRole, currentMenu, setCurrentMenu, handleLogout } from './app.js';
import { renderPage } from './router.js';

export function renderLayout() {
  const visibleMenus = MENUS.filter(m => m.roles.includes(currentUserRole));
  
  document.getElementById('app').innerHTML = `
    <div class="app-wrapper">
      <!-- 네비게이션 바 -->
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

      <!-- 서브바 -->
      <div class="subbar">
        <span class="subbar-item" id="subToday">📅 --</span>
        <span class="subbar-item" id="sub18months">⏳ --</span>
        <span class="subbar-item" id="subEgg">🥚 --개</span>
        <span class="subbar-item" id="subLowStock">⚠️ 부족재고 --개</span>
        <span class="subbar-item" id="subSchedule">📦 입고예정 --건</span>
        <span class="subbar-item" id="subUnread">🔔 미확인로그 --건</span>
      </div>

      <!-- 콘텐츠 영역 -->
      <main class="main-content" id="mainContent">
      </main>
    </div>
  `;

  // 메뉴 클릭 이벤트
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const menuId = btn.dataset.menu;
      setCurrentMenu(menuId);
      renderLayout();
      renderPage(menuId);
    });
  });

  // 마감 버튼
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  // 서브바 업데이트
  updateSubbar();

  // 현재 메뉴 페이지 렌더
  renderPage(currentMenu);
}

function updateSubbar() {
  // 오늘 날짜
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = `${now.getMonth()+1}/${now.getDate()} (${days[now.getDay()]})`;
  
  // 18개월 후
  const future = new Date(now);
  future.setMonth(future.getMonth() + 18);
  const futureStr = `${future.getFullYear().toString().slice(2)}/${future.getMonth()+1}/${future.getDate()}`;
  
  document.getElementById('subToday').textContent = `📅 ${today}`;
  document.getElementById('sub18months').textContent = `⏳ ${futureStr}`;
}