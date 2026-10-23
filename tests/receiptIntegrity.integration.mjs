// Real SDK/transaction concurrency against a demo Firestore only. No production credentials or sends.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { AUTOMATION_SOURCES, AUTOMATION_VERSION, evaluateStatsAutomation, reconcileIssues } from '../src/services/statsAutomation.js';
if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8091'
  || process.env.GCLOUD_PROJECT !== 'demo-fant-receipt-integrity') throw Error('Demo emulator only');
const require = createRequire(resolve('output/stats-confirm-backend/functions/package.json'));
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const db = getFirestore(app);
process.env.PRODUCTION_STATS_CONFIRM_DELIVERY = 'enabled';
const server = await import(pathToFileURL(resolve('output/stats-confirm-backend/functions/lib/server.js')).href);
const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
try {
  const control = { mode: 'live', deliveryEnabled: true, ownerUid: 'owner', activationDate: today, validatedVersion: AUTOMATION_VERSION };
  await db.doc('productionStatsAutomation/control').set(control);
  const preserved = {
    'bagTypes/b': { currentQty: 192000 },
    'equipmentParts/part': { replacementIntervalDays: 90, replacedAt: '2026-09-01' },
    'confirmRequests/old': { body: '기존 컨펌', status: '확인', approverAcknowledgedAt: 'READ', replies: [{ text: '기존 대화' }] },
  };
  for (const [path, row] of Object.entries(preserved)) await db.doc(path).set(row);
  const d = Object.fromEntries(AUTOMATION_SOURCES.map(k => [k, []]));
  d.bagLogs = ['a', 'b'].map(id => ({ id, date: today, type: 'incoming', bagTypeId: 'b', qty: 96000 }));
  const recipients = async () => [{ uid: 'owner', name: '테스트 대표', role: 'owner' }, { uid: 'office', name: '테스트 사무', role: 'office' }];
  const results = [];
  for (const broken of [false, true]) {
    if (broken) d.bagLogs.push({ id: 'cancel_v1_b', date: today, type: 'adjust', bagTypeId: 'b', qty: -95000,
      before: 192000, after: 97000, manualMovement: { version: 1, kind: 'cancel', cancelOf: 'b', originalKind: 'receipt',
        enteredAmount: -95000, reason: '부분 취소 검증', changesStock: true } });
    for (const row of d.bagLogs) await db.doc('bagLogs/' + row.id).set(row);
    const evaluation = evaluateStatsAutomation(d, { today, complete: true });
    const issues = reconcileIssues({}, evaluation, { today });
    const item = Object.values(issues).find(r => r.kind === (broken ? 'cancellation' : 'duplicateReceipt'));
    assert.ok(item);
    const attempts = await Promise.all([1, 2, 3].map(() => server.deliverStatsIssue(item, control, recipients)));
    assert.equal(attempts.reduce((n, r) => n + r.created, 0), 2);
    const originals = (await db.collection('confirmRequests').where('statsSource.key', '==', item.key).get()).docs;
    assert.equal(originals.length, 2);
    for (const r of originals) await r.ref.update({ status: '확인', approverAcknowledgedAt: 'READ', answer: '확인', replies: [{ text: '대화 보존' }] });
    const before = await Promise.all(originals.map(async r => (await r.ref.get()).data()));
    const next = reconcileIssues(issues, evaluation, { today: '2099-01-01' })[item.key];
    const retries = await Promise.all([1, 2, 3].map(() => server.deliverStatsIssue(next, control, recipients)));
    assert.ok(retries.every(r => r.created === 0));
    assert.deepEqual(await Promise.all(originals.map(async r => (await r.ref.get()).data())), before);
    results.push({ kind: item.kind, concurrentAttempts: 3, createdDemoConfirms: 2, retriesCreated: 0, readAndConversationPreserved: true });
  }
  for (const [path, row] of Object.entries(preserved)) assert.deepEqual((await db.doc(path).get()).data(), row);
  for (const row of d.bagLogs) assert.deepEqual((await db.doc('bagLogs/' + row.id).get()).data(), row);
  assert.equal((await db.collection('activityLogs').get()).size, 0);
  assert.equal((await db.collection('productionStatsDeliveries').get()).size, 0);
  await writeFile('output/receipt-integrity/emulator-result.json', JSON.stringify({ passed: true, demoOnly: true,
    productionWrites: 0, actualNotifications: 0, results }, null, 2));
  console.log('PASS: actual SDK concurrent retries, stock/source preservation, read/conversation preservation; demo only.');
} finally { await db.terminate(); await deleteApp(app); }
