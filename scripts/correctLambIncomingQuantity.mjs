// One user-authorized, append-only historical correction. Default: dry-run.
// This script never updates stock, the original incoming log, or prior adjustments.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { applyIncomingCorrections, incomingCorrectionId, INCOMING_CORRECTION_TYPE } from '../src/services/incomingCorrections.js';
if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Operational script cannot run against an emulator.');
if (process.argv.slice(2).some(arg => !['--execute', '--dry-run'].includes(arg))) throw Error('Unsupported argument');
const execute = process.argv.includes('--execute');
const projectId = 'fant-e5ae5', sourceId = 'vj204sVCQMi3ZYFIYneb', stockId = 'wKDR6YPCXR4BxGvk1FgJ';
const meatTypeId = 'eKSjeQUQtEnn4Y44bd46', basisId = 'yMzz7k1QFHlzIBJbt07m', correctedQtyG = 82973;
const correctionId = incomingCorrectionId(sourceId);
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId }));
const refs = [db.doc('meatLogs/' + sourceId), db.doc('meatStocks/' + stockId), db.doc('meatLogs/' + basisId),
  db.doc('meatLogs/' + correctionId), db.collection('meatStocks').where('meatTypeId', '==', meatTypeId),
  db.collection('meatLogs').where('meatTypeId', '==', meatTypeId)];
const read = tx => Promise.all(refs.map(ref => tx.get(ref)));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const evidence = snaps => snaps.map(s => s.docs
  ? s.docs.map(d => ({ id: d.id, data: d.data(), version: d.updateTime.toMillis() }))
  : s.exists ? { id: s.id, data: s.data(), version: s.updateTime.toMillis() } : null);
const before = await db.runTransaction(read, { readOnly: true });
const original = before[0].data(), stock = before[1].data(), basis = before[2].data();
if (!original || original.type !== 'frozenIncoming' || original.date !== '2026-06-09' || original.delta !== 82973000
  || original.meatTypeId !== meatTypeId || original.meatStockId !== stockId || original.stage !== 'frozen'
  || !stock || stock.initialQtyG !== 82973000 || stock.remaining !== 0 || stock.closed !== true
  || !basis || basis.type !== 'adjust' || basis.before !== 82973000 || basis.after !== correctedQtyG
  || basis.delta !== correctedQtyG - original.delta || basis.meatStockId !== stockId || basis.meatTypeId !== meatTypeId) {
  throw Error('Source, current stock or correction evidence changed; no write performed.');
}
const payload = {
  schemaVersion: 1, type: INCOMING_CORRECTION_TYPE, scope: 'incomingQuantity', status: 'active',
  correctionOf: sourceId, basisAdjustmentId: basisId, date: original.date,
  meatTypeId, meatNameSnapshot: original.meatNameSnapshot, meatStockId: stockId, stage: original.stage,
  originalQtyG: original.delta, correctedQtyG, delta: 0, before: null, after: null, changesStock: false,
  reason: '사용자 승인에 따른 입고량 정정. 2026-06-09 잔량 조정의 82973g를 근거로 82.973kg 입고로 정정하며 현재 재고는 변경하지 않음.',
  staff: '사용자 승인 이력 정정', uid: null, performedBy: 'correctLambIncomingQuantity.mjs',
};
const beforeEvidence = evidence(before);
const directory = 'output/lamb-correction';
await mkdir(directory, { recursive: true });
await writeFile(directory + '/before-' + Date.now() + '.json', JSON.stringify({ projectId, readAt: new Date().toISOString(), evidence: beforeEvidence }, null, 2));
const ensureExisting = row => {
  for (const [key, value] of Object.entries(payload)) if (JSON.stringify(row[key]) !== JSON.stringify(value)) throw Error('Existing correction differs; no overwrite allowed: ' + key);
};
if (before[3].exists) ensureExisting(before[3].data());
const prospective = before[5].docs.map(d => ({ ...d.data(), id: d.id })).filter(l => l.id !== correctionId)
  .concat({ ...payload, id: correctionId });
const projected = applyIncomingCorrections(prospective).find(l => l.id === sourceId);
if (projected.delta !== correctedQtyG) throw Error('Correction does not project to the authorized quantity');
let created = false;
if (execute) {
  created = await db.runTransaction(async tx => {
    const fresh = await read(tx);
    const freshEvidence = evidence(fresh);
    if (fresh[3].exists) { ensureExisting(fresh[3].data()); return false; }
    // Exact read-set guard includes every stock and old log for this ingredient.
    if (hash(freshEvidence) !== hash(beforeEvidence)) throw Error('Read set changed after preparation; no write performed.');
    tx.create(refs[3], { ...payload, timestamp: FieldValue.serverTimestamp() });
    return true;
  });
}
const after = execute ? await db.runTransaction(read, { readOnly: true }) : before;
const afterEvidence = evidence(after);
for (const index of [0, 1, 2, 4]) if (hash(beforeEvidence[index]) !== hash(afterEvidence[index])) throw Error('Protected source or stock changed during execution; inspect backup.');
const oldLogsAfter = afterEvidence[5].filter(d => d.id !== correctionId);
const oldLogsBefore = beforeEvidence[5].filter(d => d.id !== correctionId);
if (hash(oldLogsAfter) !== hash(oldLogsBefore)) throw Error('Existing logs changed during execution; inspect backup.');
if (execute) {
  ensureExisting(after[3].data());
  if (after[5].size !== oldLogsBefore.length + 1) throw Error('Unexpected correction count');
}
const report = { projectId, mode: execute ? 'execute' : 'dry-run', checkedAt: new Date().toISOString(),
  correctionPath: 'meatLogs/' + correctionId, originalQtyKg: original.delta / 1000, correctedQtyKg: correctedQtyG / 1000,
  writes: created ? 1 : 0, alreadyPresent: before[3].exists, allStockDocumentsUnchanged: true,
  originalIncomingUnchanged: true, allPriorLogsUnchanged: true, stockCount: before[4].size,
  sourceDelta: after[0].data().delta, targetLotRemaining: after[1].data().remaining, targetLotClosed: after[1].data().closed,
  openStockQtyG: after[4].docs.filter(d => !d.data().closed).reduce((sum, d) => sum + d.data().remaining, 0),
};
await writeFile(directory + '/' + report.mode + '-result.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await db.terminate();
