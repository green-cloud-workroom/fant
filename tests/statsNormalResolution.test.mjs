import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileIssues, normalIssueFingerprint, normalResolutionReason, planStatsDeliveries } from '../src/services/statsAutomation.js';
const item = { key: 'k', kind: 'quantity', evidence: { source: 'eggLogs/a', itemId: 'egg', qty: 6, unit: '개', stage: '출고', date: '2026-10-22', ratio: 20 }, recipientRoles: ['office'] };
const closed = () => ({ ...item, state: 'resolved', episode: 1, history: [{ episode: 1, resolution: { reason: '실제 사용' } }], resolution: { type: 'normal', fingerprint: normalIssueFingerprint(item), reason: '실제 사용' } });
const run = (old, candidate) => reconcileIssues({ k: old }, { mode: 'shadow', integrityComplete: true, candidates: [candidate] }, { today: '2026-10-26' });
test('normal source stays closed across daily baseline/context drift and weekly delivery filtering', () => {
  const before = closed();
  const after = run(before, { ...item, evidence: { ...item.evidence, baseline: 500, samples: 30, ratio: 90, followingAdjustments: ['new'] } });
  assert.deepEqual(after.k, before);
  assert.deepEqual(planStatsDeliveries(after, null, { today: '2026-10-27', activationDate: '2026-10-22' }), []);
});
test('changed source quantity starts a new episode and retains prior resolution audit', () => {
  const result = run(closed(), { ...item, evidence: { ...item.evidence, qty: 60 } }).k;
  assert.equal(result.state, 'open'); assert.equal(result.episode, 2);
  assert.equal(result.history[0].resolution.reason, '실제 사용');
});
test('reasons reject missing/unsupported choices and use actual stored reply', () => {
  assert.throws(() => normalResolutionReason(item, { reasonCode: 'separateReceipt' }, {}));
  assert.throws(() => normalResolutionReason(item, { reasonCode: 'other', reason: ' ' }, {}));
  assert.throws(() => normalResolutionReason(item, { reasonCode: 'existingReply', replyIndex: -1 }, { replies: [] }));
  assert.throws(() => normalResolutionReason(item, { reasonCode: 'existingReply', replyIndex: 0, replyText: '변경 전' }, { replies: [{ text: '실제 원본 답변' }] }), /변경/);
  assert.equal(normalResolutionReason(item, { reasonCode: 'existingReply', replyIndex: 0, replyText: '실제 원본 답변', reason: 'forged' }, { replies: [{ text: '실제 원본 답변' }] }), '실제 원본 답변');
});
