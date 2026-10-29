import { doc } from 'firebase/firestore';

// The transaction owns the current order and stock values. Displayed order data
// is used only to identify the document, never as the refund plan.
export async function cancelFreezeOrderTransaction(tx, db, orderId, cancelledBy, now = new Date()) {
  const orderRef = doc(db, 'freezeOrders', orderId);
  const current = await tx.get(orderRef);
  if (!current.exists() || current.data().status !== 'active') {
    throw new Error('발주서가 이미 변경되거나 취소되었습니다. 최신 자료를 확인해주세요.');
  }
  const deductions = current.data().deductions;
  if (!Array.isArray(deductions)) throw new Error('발주서 차감 기록을 확인할 수 없습니다.');
  const byLot = new Map();
  for (const deduction of deductions) {
    if (typeof deduction?.lotId !== 'string' || !deduction.lotId || deduction.lotId.includes('/') ||
      typeof deduction.productName !== 'string' || !deduction.productName ||
      typeof deduction.amount !== 'number' || !Number.isFinite(deduction.amount) || deduction.amount <= 0) {
      throw new Error('발주서 차감 기록이 올바르지 않습니다.');
    }
    const previous = byLot.get(deduction.lotId);
    if (previous && previous.productName !== deduction.productName) {
      throw new Error('발주서 차감 기록이 서로 충돌합니다.');
    }
    const amount = (previous?.amount || 0) + deduction.amount;
    if (!Number.isFinite(amount)) throw new Error('발주서 차감 기록의 수량이 올바르지 않습니다.');
    byLot.set(deduction.lotId, { productName: deduction.productName, amount });
  }
  const lots = [];
  for (const [lotId, deduction] of byLot) {
    const ref = doc(db, 'frozenPanLots', lotId);
    const snapshot = await tx.get(ref);
    const data = snapshot.data();
    if (!snapshot.exists() || data.productName !== deduction.productName ||
      typeof data.remaining !== 'number' || !Number.isFinite(data.remaining) || data.remaining < 0 ||
      !Number.isFinite(data.remaining + deduction.amount)) {
      throw new Error('동결판 재고가 변경되었거나 유효하지 않습니다. 최신 자료를 확인해주세요.');
    }
    lots.push({ ref, remaining: data.remaining + deduction.amount });
  }
  for (const lot of lots) tx.update(lot.ref, { remaining: lot.remaining, closed: false, updatedAt: now });
  tx.update(orderRef, { status: 'cancelled', cancelledAt: now, cancelledBy });
}
