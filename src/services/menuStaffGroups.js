import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const DEFAULT_MENU_STAFF_GROUPS = {
  meatStock: ['lead', 'office'],
  egg: ['senior', 'office'],
  bagStockIn: ['lead'],
  bagScheduleComplete: ['lead'],
  frozenProductIn: ['senior', 'lead', 'office'],
  frozenPanStock: ['senior', 'office'],
  frozenSeparation: ['senior', 'office'],
  scheduleOrder: ['office'],
  scheduleComplete: ['lead'],
  production: ['office'],
  supplementStockIn: ['senior'],
  supplementAdjust: ['office'],
};

export const STAFF_GROUP_LABELS = {
  senior: '선임',
  lead: '주임',
  office: '사무',
};

export const STAFF_GROUP_KEYS = ['senior', 'lead', 'office'];

export const MENU_STAFF_GROUP_FIELDS = [
  { key: 'meatStock', label: '원육 재고' },
  { key: 'egg', label: '계란' },
  { key: 'bagStockIn', label: '봉투 재고 (입고)' },
  { key: 'bagScheduleComplete', label: '봉투 재고 (입고예정 완료처리)' },
  { key: 'frozenProductIn', label: '동결제품 입고' },
  { key: 'frozenPanStock', label: '동결판 재고' },
  { key: 'frozenSeparation', label: '동결 분리작업' },
  { key: 'scheduleOrder', label: '입고 예정관리 (발주)' },
  { key: 'scheduleComplete', label: '입고 예정관리 (완료처리)' },
  { key: 'production', label: '생산 입력' },
  { key: 'supplementStockIn', label: '영양제 재고 (입고)' },
  { key: 'supplementAdjust', label: '영양제 재고 (수동조정)' },
];

export async function loadMenuStaffGroups() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'menuStaffGroups'));
    return snap.exists()
      ? { ...DEFAULT_MENU_STAFF_GROUPS, ...snap.data() }
      : { ...DEFAULT_MENU_STAFF_GROUPS };
  } catch (err) {
    console.warn('[menuStaffGroups] load failed:', err);
    return { ...DEFAULT_MENU_STAFF_GROUPS };
  }
}
