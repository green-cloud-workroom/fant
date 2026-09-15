import { currentMenu } from './app.js';
import { startNavigation, finishNavigation, failNavigation } from './perf/metrics.js';
import { beginPage } from './utils/pageLifecycle.js';
import { setModalOwner } from './utils/modalManager.js';
import { isModuleLoadError } from './utils/moduleLoadError.js';
import { MENUS, currentUserRole } from './app.js';
import { flags } from './config/performanceFlags.js';
import { sessionStore } from './state/sessionStore.js';

const modules = new Map();
const preparations = new Map();
function pageModule(module, route, name) {
  preparations.set(route, module.preparePage);
  return module[name];
}
export function preloadPage(menuId) {
  if (!pages[menuId] || !flags.instantRoutes?.includes(menuId)) return Promise.resolve(null);
  if (!modules.has(menuId)) {
    const pending = pages[menuId]().catch(error => { modules.delete(menuId); throw error; });
    modules.set(menuId, pending);
  }
  return modules.get(menuId);
}
let warmTimer;
sessionStore.onClear(()=>clearTimeout(warmTimer));
function prepareMenuCode() {
  clearTimeout(warmTimer);
  const queue = MENUS.filter(menu => menu.roles.includes(currentUserRole) && flags.instantRoutes?.includes(menu.id)).map(menu => menu.id);
  const next = async () => {
    if (document.hidden || !queue.length || navigator.onLine===false || navigator.connection?.saveData || document.querySelector('.modal-overlay')) return;
    try {
      const route=queue.shift();
      if(!MENUS.some(menu=>menu.id===route&&menu.roles.includes(currentUserRole)))return;
      await preloadPage(route);
      // No speculative Firestore requests: derive only from already observed data.
      await preparations.get(route)?.({cacheOnly:true});
    } catch { /* Foreground handles misses and module errors. */ }
    warmTimer = setTimeout(next, 100);
  };
  warmTimer = setTimeout(next, 100);
}

const pages = {
  settings: () => import('./pages/settings.js').then(module => pageModule(module,'settings','renderSettings')),
  recipe: () => import('./pages/recipe.js').then(module => pageModule(module,'recipe','renderRecipe')),
  meat: () => import('./pages/meat.js').then(module => pageModule(module,'meat','renderMeat')),
  bag: () => import('./pages/bag.js').then(module => pageModule(module,'bag','renderBag')),
  supplement: () => import('./pages/supplement.js').then(module => pageModule(module,'supplement','renderSupplement')),
  egg: () => import('./pages/egg.js').then(module => pageModule(module,'egg','renderEgg')),
  frozenProduct: () => import('./pages/frozenProduct.js').then(module => pageModule(module,'frozenProduct','renderFrozenProduct')),
  frozenPan: () => import('./pages/frozenPan.js').then(module => pageModule(module,'frozenPan','renderFrozenPan')),
  frozenSep: () => import('./pages/frozenSep.js').then(module => pageModule(module,'frozenSep','renderFrozenSep')),
  freezeOp: () => import('./pages/freezeOp.js').then(module => pageModule(module,'freezeOp','renderFreezeOp')),
  schedule: () => import('./pages/schedule.js').then(module => pageModule(module,'schedule','renderSchedule')),
  production: () => import('./pages/production.js').then(module => pageModule(module,'production','renderProduction')),
  main: () => import('./pages/main.js').then(module => pageModule(module,'main','renderMain')),
  stats: () => import('./pages/stats.js').then(module => pageModule(module,'stats','renderStats')),
  equipment: () => import('./pages/equipment.js').then(module => pageModule(module,'equipment','renderEquipment')),
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
    const render = await (flags.instantRoutes?.includes(menuId) ? preloadPage(menuId) : load());
    if (document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    await render(options);
    if(content.dataset?.pageFailed)failNavigation(measurement);
    else finishNavigation(measurement, context.isCurrent);
    if(context.isCurrent())prepareMenuCode();
  } catch (err) {
    failNavigation(measurement);
    console.error('[페이지 로딩 실패]', menuId, err);
    if (document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    const reloadApp=isModuleLoadError(err);
    content.innerHTML = '<div style="padding:24px;"><p>'+ (reloadApp?'업데이트된 화면을 불러오려면 앱을 새로고침해주세요.':'화면을 불러오지 못했습니다. 다시 시도해주세요.') +'</p><button class="btn-secondary" id="retryPageLoad">'+(reloadApp?'앱 새로고침':'다시 불러오기')+'</button></div>';
    document.getElementById('retryPageLoad').addEventListener('click', () => reloadApp?window.location.reload():renderPage(menuId));
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
