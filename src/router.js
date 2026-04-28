import { renderSettings } from './pages/settings.js';

export async function renderPage(menuId) {
  const content = document.getElementById('mainContent');
  if (!content) return;

  switch(menuId) {
    case 'settings':
      await renderSettings();
      break;
    default:
      content.innerHTML = `
        <div class="page-placeholder">
          <h2>${getMenuLabel(menuId)}</h2>
          <p>준비 중</p>
        </div>
      `;
  }
}

function getMenuLabel(menuId) {
  const labels = {
    main: '메인 대시보드',
    production: '생산 입력',
    meat: '원육 재고',
    egg: '계란',
    bag: '봉투 재고',
    frozenProduct: '동결제품 입고',
    frozenPan: '동결판 재고',
    frozenSep: '동결 분리작업',
    schedule: '입고 예정관리',
    recipe: '레시피 관리',
    stats: '통계',
    settings: '설정',
  };
  return labels[menuId] || menuId;
}