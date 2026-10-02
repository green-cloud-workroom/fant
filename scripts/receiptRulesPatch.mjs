import { RECEIPT_RULE_HELPERS, RECEIPT_TRANSFER_RULES } from './receiptRuleBlocks.mjs';

const productionBefore = `    match /productions/{productionId} {
      allow read: if isProductionApp();
      allow create, update: if isProductionStaff();
      allow delete: if isProductionWriter();
    }`;
const productionAfter = `    match /productions/{productionId} {
      allow read: if isProductionApp();
      allow create: if isProductionStaff();
      allow update: if isProductionStaff() && receiptRevisionAllowed(productionId);
      allow delete: if isProductionWriter();
    }`;
const transferBefore = `    match /productTransferRequests/{reqId} {
      allow read: if isProductionApp() || isInventoryApp();
      allow create: if isProductionStaff();
      allow update: if isInventoryApp();
      allow delete: if false;
    }`;

function replaceExactlyOnce(source, before, after) {
  if (source.split(before).length !== 2) throw Error('Shared rules changed; inspect the new live source before patching.');
  return source.replace(before, after);
}
export function patchReceiptRules(source) {
  const normalized = source.replaceAll('\r\n', '\n');
  if (normalized.includes(RECEIPT_RULE_HELPERS) && normalized.includes(productionAfter) && normalized.includes(RECEIPT_TRANSFER_RULES)) return source;
  if (/function (rawReceipt|currentRawReceipt|receiptRevisionAllowed)\(/.test(normalized)) throw Error('Partial receipt guards exist; manual reconciliation required.');
  const patched = replaceExactlyOnce(replaceExactlyOnce(normalized, productionBefore, RECEIPT_RULE_HELPERS + productionAfter), transferBefore, RECEIPT_TRANSFER_RULES);
  return source.includes('\r\n') ? patched.replaceAll('\n', '\r\n') : patched;
}
