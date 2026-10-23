// One persisted classification contract for entry, statistics and notifications.
export const MOVEMENT_LABELS = Object.freeze({receipt:'실제 입고',usage:'사용',reconciliation:'실사 보정',cancel:'오입력 취소',test:'테스트'});
export const movementReasonRequired = kind => ['reconciliation','cancel','test'].includes(kind);
// Keep persisted usage records compatible with existing readers that require a reason.
export const movementReason = (kind, reason) => String(reason ?? '').trim() || (kind === 'usage' ? '사용' : '');
export const movementAmount = row => row?.delta ?? row?.qty;
export const movementLabel = (row,fallback) => MOVEMENT_LABELS[row?.manualMovement?.kind] || fallback;
export function movementKind(row) {
  if (!row?.manualMovement) return null;
  const m = row.manualMovement;
  if (m.version !== 1 || !MOVEMENT_LABELS[m.kind] || !Number.isFinite(m.enteredAmount)) throw Error('입출고 처리 구분을 확인해주세요.');
  if(m.kind==='test'&&(m.changesStock!==false||movementAmount(row)!==0||row.before!==row.after))throw Error('테스트 기록에 실제 재고 변동이 있습니다.');
  if(m.kind!=='test'&&m.changesStock!==true)throw Error('재고 변동 구분이 올바르지 않습니다.');
  if(m.kind!=='receipt'&&!m.reason?.trim())throw Error('처리 사유가 누락됐습니다.');
  if(m.kind==='receipt'&&!(movementAmount(row)>0)||m.kind==='usage'&&!(movementAmount(row)<0))throw Error('입고·사용 수량의 부호가 올바르지 않습니다.');
  return m.kind;
}
export function originalMovementKind(row) {
  const kind = movementKind(row);
  if (kind) return kind;
  if (['frozenIncoming','incoming','in'].includes(row.type)) return 'receipt';
  if (row.type === 'out') return 'usage';
  return 'legacyAdjustment';
}
export function cancellableMovement(row) {
  return !!row && !['deleted','cancelled','canceled'].includes(row.status)
    && ['frozenIncoming','incoming','in','out','adjust'].includes(row.type)
    && !row.batchId && !row.relatedProductionId && !row.productionId && !row.sourceProductionId && !row.sampleSetLogId
    && !['cancel','test'].includes(movementKind(row))
    && Number.isFinite(movementAmount(row)) && movementAmount(row) !== 0;
}
export function manualMovementIndex(data) {
  const cancelled = new Map();
  for (const name of ['meatLogs','bagLogs','eggLogs','supplementLogs']) for (const row of data[name] || []) {
    const kind = movementKind(row);
    if (kind !== 'cancel') continue;
    const m = row.manualMovement, source = (data[name] || []).find(r => r.id === m.cancelOf);
    if (!source || !cancellableMovement(source) || !m.reason?.trim() || row.id !== 'cancel_v1_' + source.id
      || m.originalKind !== originalMovementKind(source) || movementAmount(row) !== -movementAmount(source)
      || row.before + movementAmount(row) !== row.after || row.after < 0
      || ['meatStockId','meatTypeId','stage','bagTypeId','supplementTypeId'].some(k => (source[k]??null)!==(row[k]??null))) {
      throw Error('오입력 취소 원본·수량 연결을 다시 확인해주세요.');
    }
    const key = name + '/' + source.id;
    if (cancelled.has(key)) throw Error('동일 원본의 취소 기록이 중복되었습니다.');
    cancelled.set(key,row);
  }
  return cancelled;
}
