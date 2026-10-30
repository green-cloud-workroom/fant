import {sourceFlow} from './helpers/frozenSourceFlow.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pageEnvironment } from './helpers/pageDom.mjs';

async function incoming() {
  const e = await pageEnvironment('frozenProduct', {
    instrument: '\nexport {showIncomingModal};\nexport function __staff(){staffCache={senior:[{name:"검증 담당"}]};}',
  });
  const product = e.state.rows.frozenProducts[0];
  await e.page.renderFrozenProduct();
  e.page.__staff();
  await e.page.showIncomingModal(product);
  e.fill('#m_date', e.today);
  e.fill('#m_expiry', '2027-09-14');
  e.fill('#m_staff', '검증 담당');
  return e;
}

async function edit() {
  const e = await pageEnvironment('frozenProduct', {
    instrument: '\nexport {showEditIncomingModal};',
  });
  const product = e.state.rows.frozenProducts[0];
  const log = { id: 'receipt-qty', productId: product.id, productNameSnapshot: product.name,
    date: e.today, qty: 1, deductedBagQty: 0, bagTypeId: product.bagTypeId, ledgerId: null,
    status: 'active', staffName: '검증 담당', note: '' };
  e.state.rows.frozenLogs = [log];
  await e.page.renderFrozenProduct();
  e.page.showEditIncomingModal(product, log,sourceFlow(e,log));
  e.fill('#m_source_note', '정정 메모');e.fill('#m_source_reason','정정 사유');
  return e;
}

for (const value of ['', '1.5', '1e3', '1abc', '0', '-1', '9007199254740992']) {
  test(`incoming rejects non-positive or non-decimal integer ${JSON.stringify(value)} without writes`, async () => {
    const e = await incoming();
    try {
      e.fill('#m_qty', value);
      await e.fire('#btnSaveIncoming');
      assert.deepEqual(e.state.writes, []);
      assert.equal(e.state.commits.length, 0);
      assert.equal(e.state.rows.frozenLogs?.length || 0, 0);
    } finally { await e.cleanup(); }
  });

  test(`metadata edit rejects invalid ${JSON.stringify(value)} before a write`, async () => {
    const e = await edit();
    try {
      e.fill('#m_source_qty', value);
      await e.fire('#btnSubmitFrozenSource');
      assert.deepEqual(e.state.writes, []);
      assert.equal(e.state.rows.frozenLogs[0].note, '');
    } finally { await e.cleanup(); }
  });
}

test('positive decimal integer still creates an incoming receipt', async () => {
  const e = await incoming();
  try {
    e.fill('#m_qty', '1');
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 1, e.alerts.join('\n'));
    assert.equal(e.state.rows.frozenLogs.find(row => row.qty === 1)?.qty, 1);
  } finally { await e.cleanup(); }
});

test('unchanged positive integer still permits metadata edit', async () => {
  const e = await edit();
  try {
    e.fill('#m_source_qty', '1');
    await e.fire('#btnSubmitFrozenSource');
    assert.deepEqual(e.state.writes, ['frozenLogs/receipt-qty'], e.alerts.join('\n'));
    assert.equal(e.state.rows.frozenLogs[0].note, '정정 메모');
  } finally { await e.cleanup(); }
});

test('different valid integer reaches the restored quantity command', async () => {
  const e = await edit();
  try {
    e.fill('#m_source_qty', '2');
    await e.fire('#btnSubmitFrozenSource');
    assert.deepEqual(e.state.writes,['frozenLogs/receipt-qty']);
    assert.equal(e.state.rows.frozenLogs[0].qty,2);
  } finally { await e.cleanup(); }
});
