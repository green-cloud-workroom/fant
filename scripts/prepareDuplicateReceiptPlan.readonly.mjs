// Read-only repair planning. Operational records are never changed here.
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
const require = createRequire('C:/dev/fantapet-inventory/functions/package.json');
const {initializeApp, applicationDefault} = require('firebase-admin/app');
const {getFirestore} = require('firebase-admin/firestore');
if (process.env.FIRESTORE_EMULATOR_HOST) throw Error('This script audits the explicit operational project only.');
const db = getFirestore(initializeApp({credential: applicationDefault(), projectId: 'fant-e5ae5'}));
const old = JSON.parse(await readFile('output/deploy-review/duplicate-stock-trace.json', 'utf8'));
const cases = await Promise.all(old.rows.map(async source => {
  const p = (await db.doc(`productions/${source.sourceId}`).get()).data();
  const requests = await Promise.all(source.lots.map(async original => {
    const request = (await db.doc(`productTransferRequests/${original.requestId}`).get()).data();
    const lots = await Promise.all([request?.createdStockLotId, request?.createdSampleStockLotId].filter(Boolean).map(async id => {
      const snap = await db.doc(`stockLots/${id}`).get();
      const data = snap.data();
      const movements = (await db.collection('stockMovements').where('stockLotId', '==', id).get()).docs.map(doc => doc.data());
      return {id, exists: snap.exists, unit: data?.unit, initialQty: data?.initialQty, totalQty: data?.totalQty, reservedQty: data?.reservedQty,
        untouched: !!data && data.totalQty === data.initialQty && data.reservedQty === 0 && movements.every(row => row.type === 'inbound'),
        movementCount: movements.length};
    }));
    return {id: original.requestId, revision: request?.revision, status: request?.status, boxes: request?.actualBoxes ?? request?.boxes, remainderPacks: request?.actualRemainderPacks ?? request?.remainderPacks ?? 0, lots};
  }));
  const completed = requests.filter(row => ['completed', '입고완료'].includes(row.status));
  const sameQuantity = completed.length === 2 && completed.every(row => row.boxes === p?.receivedBox && row.remainderPacks === (p?.receivedRemainder ?? 0));
  const reversible = completed.find(row => row.lots.length > 0 && row.lots.every(lot => lot.untouched));
  let strategy = 'historical-ledger-reconciliation';
  if (requests.some(row => row.lots.some(lot => !lot.exists))) strategy = 'missing-lot-audit';
  else if (sameQuantity && reversible) strategy = 'remove-untouched-duplicate';
  return {sourceId: source.sourceId, date: p?.date, name: p?.recipeName, sourceRevision: p?.receivedRevision, sourceBoxes: p?.receivedBox,
    requests, strategy, duplicateRequest: strategy === 'remove-untouched-duplicate' ? reversible.id : null,
    stockDelta: strategy === 'remove-untouched-duplicate' ? reversible.lots.map(lot => ({lotId: lot.id, unit: lot.unit, qty: -lot.totalQty})) : [],
    procedure: strategy === 'remove-untouched-duplicate'
      ? ['Confirm physical stock and reservations immediately before execution', 'In one admin transaction recheck production revision, both requests, stock and ledger observations', 'Record negative adjust movements only for untouched duplicate lots; preserve reserved stock', 'Mark only duplicate request rejected with duplicateOf and audit reason; preserve all documents and shipment history', 'Verify resulting product stock, request history and production source again']
      : ['Keep existing shipment and count histories intact', 'Match both receipts to actual production, shipment and physical counts', 'Do not subtract historical initial quantities from current stock', 'After evidence review mark duplicated request reconciled/rejected with an immutable audit record; adjust present stock only if a count proves a discrepancy'],
    execution: 'not-authorized-by-this-plan; no operational writes performed'};
}));
const report = {readOnly: true, checkedAt: new Date().toISOString(), cases, executionGuards: ['expected versions', 'inventory admin only', 'atomic stock/movement/request/audit commit', 'idempotency key per resolution', 'no negative or reserved-stock deduction', 'abort on any evidence change']};
await mkdir('output/deploy-review', {recursive: true});
await writeFile('output/deploy-review/duplicate-receipt-resolution-plan.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({cases: cases.length, strategies: cases.map(row => ({date: row.date, name: row.name, strategy: row.strategy, stockDelta: row.stockDelta}))}, null, 2));
