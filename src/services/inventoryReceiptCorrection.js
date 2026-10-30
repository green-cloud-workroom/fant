// Contract v1 integration seam. Enable only after inventory acceptance and release.
export const INVENTORY_RECEIPT_CORRECTION_ENABLED = false;
export function inventoryReceiptCorrectionLink(receiptId, sourceId) {
  return Object.freeze({enabled: INVENTORY_RECEIPT_CORRECTION_ENABLED,
    callable: 'inventoryReceiptCorrection', region: 'asia-northeast3', contractVersion: 1,
    receiptId, sourceId, contract: 'restore/inventory-contract.md'});
}
