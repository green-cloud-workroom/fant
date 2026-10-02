import test from 'node:test';
import assert from 'node:assert/strict';
import { patchReceiptRules } from '../scripts/receiptRulesPatch.mjs';
const base=`rules_version = '2';
// Unrelated cross-app rule bytes must survive.
    match /productions/{productionId} {
      allow read: if isProductionApp();
      allow create, update: if isProductionStaff();
      allow delete: if isProductionWriter();
    }
    match /productTransferRequests/{reqId} {
      allow read: if isProductionApp() || isInventoryApp();
      allow create: if isProductionStaff();
      allow update: if isInventoryApp();
      allow delete: if false;
    }
    match /otherApp/{id} { allow read: if otherAppReader(); }
`;
test('receipt patch preserves unrelated rules and is idempotent with either line ending',()=>{
 for(const source of [base,base.replaceAll('\n','\r\n')]){
  const patched=patchReceiptRules(source);
  assert.ok(patched.startsWith(source.slice(0,source.indexOf('    match /productions'))));
  assert.ok(patched.endsWith(source.slice(source.indexOf('    match /otherApp'))));
  assert.equal(patchReceiptRules(patched),patched);
  assert.match(patched,/receiptRevisionAllowed\(productionId\)/);
 }
});
test('changed, duplicate or partial receipt blocks fail closed',()=>{
 for(const source of [base.replace('allow create, update: if isProductionStaff();','allow create, update: if true;'),base+base,base+'function rawReceipt(data) {}'])assert.throws(()=>patchReceiptRules(source));
});
