import { db } from '../firebase.js';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { fingerprint, openAction } from './actionGateway.js';
import { recordActivity } from './activityLogs.js';
import { getTodayKST } from '../utils/date.js';

// The transaction rechecks the same documents used to open the form. A retry
// cannot silently save a newer production or create a second inventory receipt.
export async function saveProductReceipt({ action, refs, p, target, result, method, emergency, staff, correctionReason }) {
  if (emergency && !emergency.reason?.trim()) throw new Error('긴급 수정 사유를 입력해주세요.');
  return action.submit(async baseline => {
    if (emergency) await openAction({ roles: ['admin', 'office'] });
    return runTransaction(db, async transaction => {
      const snapshots = await Promise.all(refs.map(path => transaction.get(doc(db, path))));
      const latest = snapshots.map(s => s.exists() ? { id: s.id, ...s.data() } : null);
      if (fingerprint(latest) !== fingerprint(baseline)) throw new Error('생산·입고·마감 조건이 변경되었습니다. 화면을 다시 열어주세요.');
      if (latest[3]?.status === 'closed' && !emergency) throw new Error('마감된 날짜입니다. 화면을 다시 열어주세요.');
      // 저장 직후 화면 갱신을 기다리지 못하고 같은 수량으로 다시 저장하면 재고앱에 같은 입고가 한 번 더 갔다
      // (9/30 2건·10/16 1건, 6~17초 간격). 마지막으로 보낸 입고가 아직 살아 있고(대기·완료) 수량이 같으면 다시 보내지 않는다.
      // 재고앱이 반려한 입고는 같은 수량이라도 다시 보낼 수 있다.
      const lastSent = latest.slice(4).filter(Boolean).sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
      if (lastSent && ['pending', 'completed', '입고완료'].includes(lastSent.status) &&
          lastSent.plates === result.plates && lastSent.packs === result.totalPacks) {
        // 생산방식은 기록용이라 재고앱으로 보내지 않는다 — 바뀌었으면 생산 기록만 고친다.
        if ((p.receivedMethod ?? null) !== (method ?? null))
          transaction.update(doc(db, 'productions', p.id), { receivedMethod: method, updatedAt: serverTimestamp() });
        return { unchanged: true };
      }
      const completed = latest.slice(4).filter(item => item?.status === 'completed' || item?.status === '입고완료');
      let correction = {};
      if (completed.length) {
        const previous = [...completed].sort((a, b) => (b.revision || 0) - (a.revision || 0))[0];
        const previousId = previous.id;
        const chain = new Set();
        let cursor = previous;
        while (cursor && !chain.has(cursor.id)) {
          chain.add(cursor.id);
          cursor = cursor.receiptMode === 'adjustment' ? completed.find(item => item.id === cursor.correctionOf) : null;
        }
        if (!previous || completed.some(item => !chain.has(item.id)) || !Number.isFinite(previous.actualBoxes ?? previous.boxes))
          throw new Error('중복 완료되었거나 입고 이력이 불완전합니다. 재고앱에서 이력 확인·되돌리기 또는 중복 정리를 먼저 진행해주세요.');
        const reason = correctionReason || emergency?.reason;
        if (!reason?.trim()) throw new Error('입고 정정 사유를 입력해주세요.');
        correction = { receiptMode: 'adjustment', correctionOf: previousId,
          basisBoxes: previous.actualBoxes ?? previous.boxes,
          basisRemainderPacks: previous.actualRemainderPacks ?? previous.remainderPacks ?? 0, correctionReason: reason.trim() };
      }
      const revision = (p.receivedRevision || 0) + 1;
      const idempotencyKey = `productions:${p.id}:${revision}`;
      const requestRef = doc(db, 'productTransferRequests', idempotencyKey);
      if ((await transaction.get(requestRef)).exists()) throw new Error('이미 전송된 입고입니다. 저장 결과를 다시 확인해주세요.');
      transaction.update(doc(db, 'productions', p.id), {
        received: true, receivedMethod: method, receivedPlates: result.plates,
        receivedLoosePacks: result.loose, receivedTotalPacks: result.totalPacks,
        receivedBox: result.boxes, receivedRemainder: result.remainder,
        receivedRevision: revision, receivedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      transaction.set(requestRef, {
        idempotencyKey, sourceApp: 'production', sourceCollection: 'productions', sourceId: p.id,
        eventType: 'productReceipt', revision, supersedesRevision: revision > 1 ? revision - 1 : null,
        ...correction, status: 'pending', category: 'raw', recipeId: p.recipeId, recipeName: p.recipeName,
        target, plates: result.plates, packs: result.totalPacks, boxes: result.boxes,
        remainderPacks: result.remainder, producedDate: p.date, staff: p.staffName || '', createdAt: serverTimestamp(),
      });
      if (emergency) await recordActivity({
        action: 'production', subAction: 'receiptEmergencyEdit', date: getTodayKST(), staff,
        message: `마감된 입고 수량 긴급 수정 — ${p.date} ${p.recipeName} ${p.receivedTotalPacks ?? '-'}팩 → ${result.totalPacks}팩 / 사유: ${emergency.reason} / 담당: ${staff}`,
        details: {
          productionId: p.id, producedDate: p.date, recipeId: p.recipeId, recipeName: p.recipeName,
          beforeTotalPacks: p.receivedTotalPacks ?? null, afterTotalPacks: result.totalPacks,
          beforePlates: p.receivedPlates ?? null, afterPlates: result.plates,
          beforeLoosePacks: p.receivedLoosePacks ?? null, afterLoosePacks: result.loose,
          beforeMethod: p.receivedMethod ?? null, afterMethod: method, revision, reason: emergency.reason,
        },
      }, { batch: transaction });
    });
  });
}
