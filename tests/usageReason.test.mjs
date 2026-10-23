import test from 'node:test';
import assert from 'node:assert/strict';
import { pageEnvironment } from './helpers/pageDom.mjs';
import { movementKind } from '../src/services/manualMovementLogic.js';

async function eggForm() {
  const e = await pageEnvironment('egg', { instrument: '\nexport {showEggModal};' });
  e.state.rows.eggStock = [{ id: 'global', currentQty: 100, minimumQty: 0 }];
  await e.page.renderEgg(); e.page.showEggModal('out', e.state.rows.eggStock[0]);
  return e;
}
const staff = e => { e.document.querySelector('#m_staff').innerHTML = '<option value="검증" selected>검증</option>'; };
test('egg usage saves with blank reason, correct deduction and a backward-compatible usage reason', async () => {
  const e = await eggForm();
  try {
    assert.equal(e.document.querySelector('#movement_kind').value, 'usage');
    assert.equal(e.document.querySelector('#m_note').required, false);
    assert.match(e.document.querySelector('#m_note').closest('.form-group').textContent, /선택/);
    assert.match(e.document.querySelector('#movement_hint').textContent, /입력하지 않아도/);
    e.fill('#m_usageQty', '10'); e.fill('#m_note', '작업 메모'); staff(e);
    await e.fire('#btnSaveEgg');
    assert.deepEqual(e.alerts, []);assert.equal(e.document.querySelector('#actionStatus').textContent,'출고 완료!');
    assert.equal(e.state.rows.eggStock[0].currentQty, 90);
    const log = e.state.rows.eggLogs.at(-1);
    assert.equal(log.qty, -10); assert.equal(log.manualMovement.reason, '작업 메모');
    assert.equal(log.note, '작업 메모'); assert.equal(movementKind(log), 'usage');
    assert.equal(e.state.commits.length, 1);
  } finally { await e.cleanup(); }
});
test('count corrections and tests still require an explicit reason and cannot write when blank', async () => {
  for (const kind of ['reconciliation', 'test']) {
    const e = await eggForm();
    try {
      e.fill('#movement_kind', kind); await e.fire('#movement_kind', 'change');
      assert.equal(e.document.querySelector('#m_note').required, true);
      e.fill('#m_remaining', '90'); staff(e); await e.fire('#btnSaveEgg');
      assert.match(e.alerts.at(-1), /사유/); assert.equal(e.state.rows.eggStock[0].currentQty, 100);
      assert.equal(e.state.writes.length, 0);
    } finally { await e.cleanup(); }
  }
});
test('bag manual usage does not retain the old form-level mandatory reason guard', async () => {
  const e = await pageEnvironment('bag', { instrument: '\nexport {showBagAdjustModal};' });
  try {
    await e.page.renderBag(); e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);
    e.fill('#movement_kind', 'usage'); await e.fire('#movement_kind', 'change');
    e.fill('#m_adjustType', 'minus'); e.fill('#m_qty', '2'); staff(e);
    await e.fire('#btnSaveAdjust');
    assert.deepEqual(e.alerts, []);assert.equal(e.document.querySelector('#actionStatus').textContent,'조정 완료!'); assert.equal(e.state.rows.bagTypes[0].currentQty, 98);
    assert.equal(e.state.rows.bagLogs.at(-1).manualMovement.reason, '사용');
  } finally { await e.cleanup(); }
});
test('direct writer also defaults empty usage reason and preserves an explicitly entered reason', async () => {
  const e = await pageEnvironment('bag');
  try {
    const { saveManualMovement } = await e.load('src/services/manualMovements.js');
    for (const [id, reason, expected] of [['blank', '', '사용'], ['detail', '샘플 포장 사용', '샘플 포장 사용']]) {
      await saveManualMovement({ db: {}, name: 'bagLogs', stockId: 'b1',
        log: { type: 'adjust', bagTypeId: 'b1', qty: -1, date: e.today, staffName: '검증' },
        selection: { kind: 'usage', operationId: id, reason } });
      assert.equal(e.state.rows.bagLogs.find(r => r.id === id).manualMovement.reason, expected);
    }
  } finally { await e.cleanup(); }
});
