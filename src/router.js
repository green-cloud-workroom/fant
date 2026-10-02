import { currentMenu } from './app.js';
import { startNavigation, observeNavigationContent, finishNavigation, failNavigation, measurePhase } from './perf/metrics.js';
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
let warmTimer, warmRevision = 0;
let idleQueue = [];
let lastIntentRoute = null, lastIntentAt = 0;
function cancelMenuCodePreparation() {
  warmRevision++;
  clearTimeout(warmTimer);
  if (typeof cancelIdleCallback === 'function') cancelIdleCallback(warmTimer);
  warmTimer = null;
}
sessionStore.onClear(cancelMenuCodePreparation);
function mayPrepareMenuCode() {
  return !document.hidden && navigator.onLine !== false && !navigator.connection?.saveData &&
    !document.querySelector('.modal-overlay');
}
function canOpenRoute(route) {
  return MENUS.some(menu => menu.id === route && menu.roles.includes(currentUserRole)) &&
    flags.instantRoutes?.includes(route);
}
function scheduleIdlePreparation(revision) {
  if (revision !== warmRevision || !idleQueue.length) return;
  const next = async () => {
    if (revision !== warmRevision || !mayPrepareMenuCode()) return;
    const route = idleQueue.shift();
    try {
      if (canOpenRoute(route)) {
        await preloadPage(route);
        if (revision === warmRevision) await preparations.get(route)?.({cacheOnly:true});
      }
    } catch { /* Foreground handles misses and module errors. */ }
    if (revision === warmRevision) scheduleIdlePreparation(revision);
  };
  if (typeof requestIdleCallback === 'function') {
    warmTimer = requestIdleCallback(deadline => {
      if (deadline.timeRemaining() < 8) { scheduleIdlePreparation(revision); return; }
      next();
    });
  } else {
    warmTimer = setTimeout(next, 1200);
  }
}
function prepareMenuCode() {
  cancelMenuCodePreparation();
  idleQueue = MENUS.filter(menu => canOpenRoute(menu.id)).map(menu => menu.id);
  scheduleIdlePreparation(warmRevision);
}
function prepareIntendedRoute(route) {
  if (!canOpenRoute(route) || !mayPrepareMenuCode()) return;
  const at = Date.now();
  if (lastIntentRoute === route && at - lastIntentAt < 1500) return;
  lastIntentRoute = route; lastIntentAt = at;
  preloadPage(route).then(() => preparations.get(route)?.({cacheOnly:true})).catch(() => {});
}
function resumeMenuCodeAfterInput() {
  cancelMenuCodePreparation();
  const revision = warmRevision;
  warmTimer = setTimeout(() => {
    if (revision === warmRevision && mayPrepareMenuCode()) scheduleIdlePreparation(revision);
  }, 1000);
}
if (typeof document !== 'undefined') {
  document.addEventListener('pointerover', event => {
    const route = event.target.closest?.('[data-menu]')?.dataset.menu;
    prepareIntendedRoute(route);
  });
  document.addEventListener('focusin', event => {
    const route = event.target.closest?.('[data-menu]')?.dataset.menu;
    prepareIntendedRoute(route);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMenuCodePreparation(); });
  document.addEventListener('pointerdown', resumeMenuCodeAfterInput, true);
  document.addEventListener('keydown', resumeMenuCodeAfterInput, true);
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
  cancelMenuCodePreparation();
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
  observeNavigationContent(measurement,content,context.isCurrent);
  try {
    const [render] = await Promise.all([
      measurePhase('route:module', () => flags.instantRoutes?.includes(menuId) ? preloadPage(menuId) : load(), { route: menuId }),
      options.ready?.(),
    ]);
    if (!context.isCurrent() || document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    await render(options);
    if (!context.isCurrent() || document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    if(content.dataset?.pageFailed)failNavigation(measurement);
    else {
      finishNavigation(measurement, context.isCurrent);
      options.onReady?.();
    }
    if(context.isCurrent())prepareMenuCode();
  } catch (err) {
    failNavigation(measurement);
    console.error('[페이지 로딩 실패]', menuId, err);
    if (!context.isCurrent() || document.getElementById('mainContent') !== content || currentMenu !== menuId) return;
    const reloadApp=isModuleLoadError(err);
    content.innerHTML = '<div style="padding:24px;"><p>'+ (reloadApp?'업데이트된 화면을 불러오려면 앱을 새로고침해주세요.':'화면을 불러오지 못했습니다. 다시 시도해주세요.') +'</p><button class="btn-secondary" id="retryPageLoad">'+(reloadApp?'앱 새로고침':'다시 불러오기')+'</button></div>';
    document.getElementById('retryPageLoad').addEventListener('click', () => reloadApp?window.location.reload():renderPage(menuId, options));
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
