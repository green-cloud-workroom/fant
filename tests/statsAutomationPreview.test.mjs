import test from 'node:test';
import assert from 'node:assert/strict';
import { environment } from './helpers/modules.mjs';

test('manual preview reads complete server sources and never writes or delivers', async () => {
  const e = await environment({ session: true });
  const preview = await e.load('src/services/statsAutomationPreview.js');
  const result = await preview.loadAutomationPreview();
  assert.equal(result.mode, 'shadow'); assert.equal(result.deliveryEnabled, false);
  assert.ok(e.state.reads.length >= 11); assert.equal(e.state.writes.length, 0);
});
test('production-only page or invalid session fence prevents I/O; logout discards late reads', async () => {
  const e = await environment({ session: true }), preview = await e.load('src/services/statsAutomationPreview.js');
  await assert.rejects(preview.loadAutomationPreview(() => false)); assert.equal(e.state.reads.length, 0);
  e.state.latencyMs = 30;
  const pending = preview.loadAutomationPreview();
  (await e.load('src/state/sessionStore.js')).sessionStore.clear(null);
  await assert.rejects(pending); assert.equal(e.state.writes.length, 0);
});
test('disabled runtime and presave guard do no reads, writes, popups or callable imports', async () => {
  const e = await environment({ session: true }), runtime = await e.load('src/services/statsAutomationRuntime.js');
  assert.equal(runtime.startStatsPopupRuntime, undefined);
  const result = await runtime.checkQuantityBeforeSave({ itemId: 'meatLogs:lamb', qty: 82973 });
  assert.equal(result.approved, true); assert.equal(result.review, null); 
  assert.equal(e.state.reads.length, 0); assert.equal(e.state.writes.length, 0);
});
test('preview escapes source labels and explains holds rather than treating unknown as zero', async () => {
  const e = await environment({ session: true }), page = await e.load('src/pages/statsAutomationPreview.js');
  const html = page.previewMarkup({ range: { startDate: '2026-10-01', endDate: '2026-10-22' },
    candidates: [], held: [{ name: '<img onerror=evil()>', reason: '표본 부족' }], weekly: null });
  assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img'));
  assert.match(html, /발송은 차단/); assert.match(html, /표본 부족/);
});
test('one denied source aborts complete preview instead of treating missing stock as empty', async () => {
  const e = await environment({ session: true }), preview = await e.load('src/services/statsAutomationPreview.js');
  e.state.failures.add('eggStock');
  await assert.rejects(preview.loadAutomationPreview()); assert.equal(e.state.writes.length, 0);
});
