// 설비 부품 서비스
// 기계(equipments) → 부품(equipmentParts) → 이력(equipmentPartLogs).
// 페이지(equipment.js)와 메인 알림(main.js, layout.js)이 공용으로 쓰는 로더 + 계산 함수.
// 스키마: src/utils/firestoreSchemas.md

import { db } from '../firebase.js';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getTodayKST, diffDaysKST } from '../utils/date.js';

// 교체 임박 기준 (D-7 이내면 임박)
export const PART_DUE_SOON_DAYS = 7;

export const CYCLE_UNIT_LABEL = { day: '일', week: '주', month: '개월' };

// ─── 로더 ──────────────────────────────────────────────────────────

export async function loadEquipments() {
  const snap = await getDocs(query(collection(db, 'equipments'), orderBy('sortOrder')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function loadEquipmentParts(scope = { getDocs }) {
  const snap = await scope.getDocs(query(collection(db, 'equipmentParts'), orderBy('sortOrder')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── 날짜/주기 계산 ───────────────────────────────────────────────

/**
 * 주기 → 일수 환산 (표시·정렬용 근사치. 실제 다음 예정일은 addCycleToDate로 계산).
 */
export function cycleToDays(cycleValue, cycleUnit) {
  const v = Number(cycleValue || 0);
  if (cycleUnit === 'week') return v * 7;
  if (cycleUnit === 'month') return v * 30;
  return v;
}

/**
 * 기준일(YYYY-MM-DD)에 주기를 더한 날짜 문자열. 개월 단위는 달력 기준으로 더함.
 */
export function addCycleToDate(dateStr, cycleValue, cycleUnit) {
  if (!dateStr) return null;
  const v = Number(cycleValue || 0);
  if (!v) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  let result;
  if (cycleUnit === 'month') {
    result = new Date(Date.UTC(y, m - 1 + v, d));
    // 말일 넘침 보정 (예: 1/31 + 1개월 → 2/28)
    if (result.getUTCDate() !== d) result = new Date(Date.UTC(y, m - 1 + v + 1, 0));
  } else {
    const days = cycleUnit === 'week' ? v * 7 : v;
    result = new Date(Date.UTC(y, m - 1, d + days));
  }
  return result.toISOString().slice(0, 10);
}

export function formatCycle(part) {
  if (!part?.cycleValue) return '-';
  return `${part.cycleValue}${CYCLE_UNIT_LABEL[part.cycleUnit] || '일'}`;
}

// ─── 상태 판정 ────────────────────────────────────────────────────

/**
 * 부품 1개의 상태.
 * @returns {{ dday: number|null, overdue: boolean, dueSoon: boolean, low: boolean }}
 */
export function getPartStatus(part, today = getTodayKST()) {
  const dday = part.nextDueAt ? diffDaysKST(part.nextDueAt, today) : null;
  const overdue = dday !== null && dday < 0;
  const dueSoon = dday !== null && dday >= 0 && dday <= PART_DUE_SOON_DAYS;
  const minimumQty = Number(part.minimumQty || 0);
  const low = minimumQty > 0 && Number(part.currentQty || 0) < minimumQty;
  return { dday, overdue, dueSoon, low };
}

export function formatDday(dday) {
  if (dday === null || dday === undefined) return '-';
  if (dday < 0) return `지남 ${Math.abs(dday)}일`;
  if (dday === 0) return 'D-day';
  return `D-${dday}`;
}

/**
 * 활성 부품 중 교체 임박/지남/재고 부족 항목만 추려서 반환 (급한 순).
 * 메인 팝업·알림 카드·메뉴 배지 공용.
 */
export function collectPartAlerts(parts, today = getTodayKST()) {
  const alerts = [];
  parts.forEach(p => {
    if (p.active === false) return;
    const s = getPartStatus(p, today);
    if (s.overdue || s.dueSoon) {
      alerts.push({ kind: 'due', part: p, dday: s.dday, overdue: s.overdue });
    }
    if (s.low) {
      alerts.push({ kind: 'low', part: p, dday: s.dday, overdue: s.overdue });
    }
  });
  // 지남 → 임박(D-day 작은 순) → 재고 부족
  alerts.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'due' ? -1 : 1;
    return (a.dday ?? 9999) - (b.dday ?? 9999);
  });
  return alerts;
}

export async function loadPartAlerts(today = getTodayKST(), scope) {
  const parts = await loadEquipmentParts(scope);
  return collectPartAlerts(parts, today);
}

/** 기계 표시명 — 별칭이 종류명을 이미 포함하면 별칭만 (예: "민서기 1호"), 아니면 "종류 별칭" (예: "민서기 A"). */
export function machineLabel(category, alias) {
  const c = (category || '').trim();
  const a = (alias || '').trim();
  if (!a) return c;
  if (!c || a.includes(c)) return a;
  return `${c} ${a}`;
}

export function partLabel(part) {
  const machine = machineLabel(part.equipmentCategory, part.equipmentAlias);
  return machine ? `${machine} · ${part.name}` : part.name;
}
