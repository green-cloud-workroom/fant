import { auth } from './firebase.js';
import { signOut } from 'firebase/auth';

// 현재 사용자 정보
export let currentUser = null;
export let currentUserRole = null;

// 사용자 정보 로드
export async function loadUserInfo(user) {
  currentUser = user;
  const tokenResult = await user.getIdTokenResult(true);
  currentUserRole = tokenResult.claims.roles?.production || null;
}

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
  { id: 'recipe', label: '레시피 관리', roles: ['admin', 'office'] },
  { id: 'stats', label: '통계', roles: ['admin', 'office'] },
  { id: 'settings', label: '설정', roles: ['admin', 'office'] },
];

// 현재 활성 메뉴
export let currentMenu = 'main';

export function setCurrentMenu(menuId) {
  currentMenu = menuId;
}

// 로그아웃
export async function handleLogout() {
  await signOut(auth);
}
