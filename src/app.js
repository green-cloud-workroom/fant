import { auth } from './firebase.js';
import { signOut } from 'firebase/auth';

// 현재 사용자 정보
export let currentUser = null;
export let currentUserRole = null;

// 사용자 정보 로드
let userInfoVersion = 0;
export async function loadUserInfo(user, forceRefresh = true) {
  const version = ++userInfoVersion;
  const tokenResult = await user.getIdTokenResult(forceRefresh);
  if (version !== userInfoVersion || auth.currentUser?.uid !== user.uid) return false;
  currentUser = user;
  currentUserRole = tokenResult.claims.roles?.production || null;
  if (!['admin', 'office', 'production'].includes(currentUserRole)) {
    clearUserInfo(); throw new Error('생산관리 앱 접근 권한이 없습니다.');
  }
  return true;
}
export function clearUserInfo() { userInfoVersion++; currentUser = null; currentUserRole = null; }

// 메뉴 목록
export const MENUS = [
  { id: 'main', label: '메인', roles: ['admin', 'office', 'production'] },
  { id: 'production', label: '생산 입력', roles: ['admin', 'office', 'production'] },
  { id: 'meat', label: '원료 재고', roles: ['admin', 'office', 'production'] },
  { id: 'egg', label: '계란', roles: ['admin', 'office', 'production'] },
  { id: 'bag', label: '봉투 재고', roles: ['admin', 'office', 'production'] },
  { id: 'supplement', label: '영양제 재고', roles: ['admin', 'office', 'production'] },
  { id: 'frozenProduct', label: '동결제품 입고', roles: ['admin', 'office', 'production'] },
  { id: 'frozenPan', label: '동결판 재고', roles: ['admin', 'office', 'production'] },
  { id: 'frozenSep', label: '동결 분리작업', roles: ['admin', 'office', 'production'] },
  { id: 'schedule', label: '입고 예정관리', roles: ['admin', 'office', 'production'] },
  { id: 'equipment', label: '설비 부품', roles: ['admin', 'office', 'production'] },
  { id: 'recipe', label: '레시피 관리', roles: ['admin', 'office'] },
  { id: 'stats', label: '통계', roles: ['admin', 'office'] },
  { id: 'settings', label: '설정', roles: ['admin', 'office'] },
];

// 현재 활성 메뉴 — 우선순위: URL 해시 > 마지막 방문 페이지 > 메인
// 해시 라우팅: 메뉴마다 #menuId 주소가 붙어 북마크/공유/새로고침 복원 가능
function getMenuFromHash() {
  const id = (window.location.hash || '').replace('#', '');
  return MENUS.some(m => m.id === id) ? id : null;
}

export let currentMenu = getMenuFromHash() || sessionStorage.getItem('lastMenu') || 'main';

let navigationHandler = null;
export function registerNavigationHandler(handler) { navigationHandler = handler; }
export function setCurrentMenu(menuId) {
  if (navigationHandler) return navigationHandler(menuId);
  return commitCurrentMenu(menuId);
}
export function commitCurrentMenu(menuId) {
  currentMenu = menuId;
  sessionStorage.setItem('lastMenu', menuId);
  if ((window.location.hash || '').replace('#', '') !== menuId) {
    window.location.hash = menuId;
  }
}

// 로그아웃
export async function handleLogout() {
  await signOut(auth);
}
