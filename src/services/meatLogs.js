// meatLogs 서비스
// 원육 재고 변동(입고/전처리/재포장/자동출고/생산차감/수동조정) 통합 이력.
// 한 번 작성된 로그는 수정/삭제 금지 (감사 추적 신뢰성).
//
// 사용처: pages/meat.js, pages/schedule.js, pages/main.js
// 스키마: src/utils/firestoreSchemas.md

import { db } from '../firebase.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { currentUser } from '../app.js';

/**
 * 원육 재고 변동을 한 줄 기록한다.
 *
 * @param {object} entry
 * @param {string} entry.type             - frozenIncoming | processedIn | processedOut | repackedIn | repackedOut | productionDeduct | productionRollback | adjust
 * @param {string} entry.date             - 작업일 YYYY-MM-DD
 * @param {string} entry.meatTypeId       - 원육 종류 ID
 * @param {string} entry.meatNameSnapshot - 원육명 (당시 이름)
 * @param {string} entry.stage            - frozen | processed | repacked
 * @param {string} [entry.meatStockId]    - 변동된 meatStocks 문서 ID
 * @param {number} entry.delta            - g 단위 변화량 (양수=증가, 음수=감소)
 * @param {number} [entry.before]         - 변동 전 잔량 g
 * @param {number} [entry.after]          - 변동 후 잔량 g
 * @param {string} entry.staff            - 담당자 표시명
 * @param {string} [entry.reason]         - 사유 (수동조정/자동출고/생산차감에서 사용)
 * @param {string} [entry.batchId]        - 같은 트랜잭션 묶음 식별
 * @returns {Promise<string>}             - 생성된 로그 문서 ID
 */
export async function recordMeatLog(entry) {
  if (!entry || !entry.type) throw new Error('recordMeatLog: type 필수');
  if (!entry.date) throw new Error('recordMeatLog: date 필수');
  if (!entry.meatTypeId) throw new Error('recordMeatLog: meatTypeId 필수');
  if (!entry.stage) throw new Error('recordMeatLog: stage 필수');
  if (typeof entry.delta !== 'number') throw new Error('recordMeatLog: delta(number) 필수');
  if (!entry.staff) throw new Error('recordMeatLog: staff 필수');

  const uid = currentUser?.uid || null;

  const docData = {
    type: entry.type,
    date: entry.date,
    meatTypeId: entry.meatTypeId,
    meatNameSnapshot: entry.meatNameSnapshot || '',
    stage: entry.stage,
    meatStockId: entry.meatStockId || null,
    delta: entry.delta,
    before: typeof entry.before === 'number' ? entry.before : null,
    after: typeof entry.after === 'number' ? entry.after : null,
    staff: entry.staff,
    uid,
    reason: entry.reason || null,
    batchId: entry.batchId || null,
    timestamp: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'meatLogs'), docData);
  return ref.id;
}
