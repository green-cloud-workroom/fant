import { currentMenu } from './app.js';
import { startNavigation, finishNavigation } from './perf/metrics.js';
import { beginPage } from './utils/pageLifecycle.js';
import { setModalOwner } from './utils/modalManager.js';

const pages = {
  settings: () => import('./pages/settings.js').then(module => module.renderSettings),
  recipe: () => import('./pages/recipe.js').then(module => module.renderRecipe),
  meat: () => import('./pages/meat.js').then(module => module.renderMeat),
  bag: () => import('./pages/bag.js').then(module => module.renderBag),
  supplement: () => import('./pages/supplement.js').then(module => module.renderSupplement),
  egg: () => import('./pages/egg.js').then(module => module.renderEgg),
  frozenProduct: () => import('./pages/frozenProduct.js').then(module => module.renderFrozenProduct),
  frozenPan: () => import('./pages/frozenPan.js').then(module => module.renderFrozenPan),
  frozenSep: () => import('./pages/frozenSep.js').then(module => module.renderFrozenSep),
  freezeOp: () => import('./pages/freezeOp.js').then(module => module.renderFreezeOp),
  schedule: () => import('./pages/schedule.js').then(module => module.renderSchedule),
  production: () => import('./pages/production.js').then(module => module.renderProduction),
  main: () => import('./pages/main.js').then(module => module.renderMain),
  stats: () => import('./pages/stats.js').then(module => module.renderStats),
  equipment: () => import('./pages/equipment.js').then(module => module.renderEquipment),
};

export async function renderPage(menuId, options = {}) {
  const content = document.getElementById('mainContent');
  if (!content) return;
  const context = beginPage(content, menuId);
  setModalOwner(menuId);
  const measurement = startNavigation(menuId);
  const load = pages[menuId];
  if (!load) {
    content.innerHTML = '<div class="page-placeholder"><h2>' + getMenuLabel(menuId) + '</h2><p>준비 중</p></div>';
    return;
  }
  content.innerHTML = '<div style="padding:24px;"><p>' + getMenuLabel(menuId) + ' 로딩 중...</p></div>';
  try {
    const render = await load();
    if (document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    await render(options);
    finishNavigation(measurement, context.isCurrent);
  } catch (err) {
    console.error('[페이지 로딩 실패]', menuId, err);
    if (document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    content.innerHTML = '<div style="padding:24px;"><p>화면을 불러오지 못했습니다. 다시 시도해주세요.</p><button class="btn-secondary" id="retryPageLoad">다시 불러오기</button></div>';
    document.getElementById('retryPageLoad').addEventListener('click', () => renderPage(menuId));
  }
}

function getMenuLabel(menuId) {
  const labels = {
    main: '메인 대시보드',
    production: '생산 입력',
    meat: '원료 재고',
    egg: '계란',
    bag: '봉투 재고',
    supplement: '영양제 재고',
    frozenProduct: '동결제품 입고',
    frozenPan: '동결판 재고',
    frozenSep: '동결 분리작업',
    schedule: '입고 예정관리',
    equipment: '설비 부품',
    recipe: '레시피 관리',
    stats: '통계',
    settings: '설정',
  };
  return labels[menuId] || menuId;
}
