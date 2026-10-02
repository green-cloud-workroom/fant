// Operational audit only. No repair, stock update, or receipt status write.
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(resolve(process.env.INVENTORY_RULES_REPO || 'C:/dev/fantapet-inventory', 'functions/package.json'));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('Operational audit requires the explicit production read-only context.');
const db = getFirestore(initializeApp({ credential: applicationDefault(), projectId: 'fant-e5ae5' }));
const snapshot = await db.collection('productTransferRequests').where('category', '==', 'raw').get();
const groups = new Map(), issues = [];
for (const doc of snapshot.docs) {
  const row = doc.data();
  if (row.sourceCollection !== 'productions' || row.sourceApp !== 'production' || !row.sourceId || !Number.isSafeInteger(row.revision) || row.revision < 1) {
    issues.push({ id: doc.id, issue: 'missingSourceMetadata' });
    continue;
  }
  if (!groups.has(row.sourceId)) groups.set(row.sourceId, []);
  groups.get(row.sourceId).push({ id: doc.id, ...row });
}
for (const [sourceId, rows] of groups) {
  const completed = rows.filter(row => ['completed', '입고완료'].includes(row.status));
  if (completed.length > 1) {
    const lots = await Promise.all(completed.map(async row => {
      const lot = row.createdStockLotId ? await db.doc(`stockLots/${row.createdStockLotId}`).get() : null;
      const data = lot?.data();
      return { requestId: row.id, revision: row.revision, boxes: row.actualBoxes ?? row.boxes ?? null,
        lotId: row.createdStockLotId ?? null, lotExists: lot?.exists ?? false,
        initialQty: data?.initialQty ?? null, totalQty: data?.totalQty ?? null, availableQty: data?.availableQty ?? null, reservedQty: data?.reservedQty ?? null, status: data?.status ?? null };
    }));
    issues.push({ sourceId, issue: 'multipleCompletedRevisions', ids: completed.map(row => row.id), lots });
  }
  const latest = Math.max(...rows.map(row => row.revision));
  const source = await db.doc(`productions/${sourceId}`).get();
  if (!source.exists || source.data().receivedRevision !== latest) issues.push({ sourceId, issue: 'sourceHeadMismatch', latest, sourceRevision: source.data()?.receivedRevision ?? null });
  if (completed.some(row => row.revision < latest)) issues.push({ sourceId, issue: 'completedOlderRevision', ids: completed.filter(row => row.revision < latest).map(row => row.id) });
}
const report = { readOnly: true, duplicateSources: issues.filter(row => row.issue === 'multipleCompletedRevisions').length, checkedAt: new Date().toISOString(), projectId: 'fant-e5ae5', rawRequests: snapshot.size, sources: groups.size, issues };
await mkdir('output', { recursive: true });
await writeFile('output/receipt-revisions-live-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
