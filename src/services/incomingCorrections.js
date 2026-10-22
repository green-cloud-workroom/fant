// Append-only quantity corrections. These are not stock movements.
export const INCOMING_CORRECTION_TYPE = 'incomingQuantityCorrection';
export const incomingCorrectionId = sourceId => 'incomingQuantity_v1_' + sourceId;
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
export function applyIncomingCorrections(logs = []) {
  const byId = new Map(logs.map(log => [log.id, log]));
  const corrections = new Map();
  for (const correction of byId.values()) {
    if (correction.type !== INCOMING_CORRECTION_TYPE) continue;
    const source = byId.get(correction.correctionOf), basis = byId.get(correction.basisAdjustmentId);
    if (!source || source.type !== 'frozenIncoming' || !positive(source.delta)
      || correction.id !== incomingCorrectionId(source.id) || corrections.has(source.id)
      || correction.schemaVersion !== 1 || correction.scope !== 'incomingQuantity'
      || correction.status !== 'active' || correction.changesStock !== false || correction.delta !== 0
      || correction.originalQtyG !== source.delta || !positive(correction.correctedQtyG)
      || correction.date !== source.date || correction.meatTypeId !== source.meatTypeId
      || correction.meatStockId !== source.meatStockId || correction.stage !== source.stage
      || typeof correction.reason !== 'string' || !correction.reason.trim()
      || !basis || basis.type !== 'adjust' || basis.meatStockId !== source.meatStockId
      || basis.meatTypeId !== source.meatTypeId || basis.before !== source.delta
      || basis.after !== correction.correctedQtyG || basis.delta !== basis.after - basis.before) {
      throw new Error('입고 정정 이력이 원본·근거와 일치하지 않습니다. 원본 이력을 확인해주세요.');
    }
    corrections.set(source.id, correction);
  }
  return [...byId.values()].filter(log => log.type !== INCOMING_CORRECTION_TYPE).map(log => {
    const correction = corrections.get(log.id);
    return correction ? { ...log, delta: correction.correctedQtyG, incomingCorrection: {
      id: correction.id, originalQtyG: log.delta, correctedQtyG: correction.correctedQtyG, reason: correction.reason,
    } } : log;
  });
}
