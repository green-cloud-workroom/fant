import test from 'node:test';
import assert from 'node:assert/strict';
import { pageEnvironment } from './helpers/pageDom.mjs';

async function receipt(kind = 'product', { unlinkedBag = false, retryTransactionCallbackOnce = false } = {}) {
  const e = await pageEnvironment('frozenProduct', {
    instrument: '\nexport {showIncomingModal};\nexport function __staff(){staffCache={senior:[{name:"검증 담당"}]};}',
    retryTransactionCallbackOnce,
  });
  const product = e.state.rows.frozenProducts[0];
  product.kind = kind;
  if (unlinkedBag) product.bagTypeId = null;
  if (kind === 'sampleSet') {
    product.components = [{ frozenProductId: 'sample1', qty: 2 }];
    e.state.rows.frozenProducts.push({ id: 'sample1', name: '검증 샘플', kind: 'sample', active: true, sortOrder: 1 });
  }
  await e.page.renderFrozenProduct();
  e.page.__staff();
  await e.page.showIncomingModal(product);
  e.fill('#m_date', e.today);
  e.fill('#m_expiry', '2027-09-14');
  e.fill('#m_qty', 4);
  e.fill('#m_staff', '검증 담당');
  return { e, product };
}

// Sample-set creation is now a server command; its real SDK tests live separately.
for (const kind of ['product', 'sample']) {
  test(`${kind} receipt writes one atomic commit with existing document contract`, async () => {
    const { e } = await receipt(kind);
    try {
      await e.fire('#btnSaveIncoming');
      assert.equal(e.state.commits.length, 1, e.alerts.join('\n'));
      const log = e.state.rows.frozenLogs.find(row => row.qty === 4);
      assert.ok(log);
      assert.equal(e.state.rows.bagTypes[0].currentQty, 96);
      assert.equal(e.state.rows.bagLogs.length, 1);
      assert.equal(e.state.rows.stockLedger.length, 1);
      assert.equal(log.ledgerId, e.state.rows.stockLedger[0].id);
      assert.equal(e.state.rows.activityLogs.length, 1);
      assert.equal(e.state.rows.activityLogs[0].details.frozenLogId, log.id);
      if (kind === 'sampleSet') {
        assert.equal(e.state.rows.productTransferRequests?.length || 0, 0);
        assert.equal(log.componentDeductLogIds.length, 1);
        assert.equal(e.state.rows.frozenLogs.find(row => row.id === log.componentDeductLogIds[0]).qty, -8);
      } else {
        assert.equal(e.state.rows.productTransferRequests.length, 1);
        assert.equal(e.state.rows.productTransferRequests[0].id, `frozenLogs:${log.id}:1`);
      }
    } finally { await e.cleanup(); }
  });
}

test('rejected transaction leaves no partial stock, log, outbox, ledger or activity writes', async () => {
  const { e } = await receipt();
  try {
    e.state.failNextCommit = 'before';
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
    assert.deepEqual(e.state.writes, []);
    for (const name of ['frozenLogs', 'bagLogs', 'stockLedger', 'activityLogs', 'productTransferRequests'])
      assert.equal(e.state.rows[name]?.length || 0, 0, name);
  } finally { await e.cleanup(); }
});

test('latest bag quantity rejects and closed date preflight rejects without writes', async () => {
  const { e } = await receipt();
  try {
    e.state.rows.bagTypes[0].currentQty = 3;
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 0);
    assert.equal(e.state.rows.frozenLogs?.length || 0, 0);
  } finally { await e.cleanup(); }
  const { e: closed } = await receipt();
  try {
    closed.state.rows.closings = [{ id: closed.today, date: closed.today, status: 'closed' }];
    await closed.fire('#btnSaveIncoming');
    assert.equal(closed.state.commits.length, 0);
  } finally { await closed.cleanup(); }
});

test('unknown response does not replay the transaction automatically', async () => {
  const { e } = await receipt();
  try {
    e.state.failNextCommit = 'after';
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 1);
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 1);
  } finally { await e.cleanup(); }
});

test('missing linked bag aborts all receipt, transfer, stock and activity writes', async () => {
  const { e } = await receipt();
  try {
    e.state.rows.bagTypes = [];
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 0);
    assert.equal(e.state.writes.length, 0);
    for (const name of ['frozenLogs', 'bagLogs', 'stockLedger', 'activityLogs', 'productTransferRequests'])
      assert.equal(e.state.rows[name]?.length || 0, 0, name);
    assert.ok(e.alerts.some(message => message.includes('연결된 봉투 문서가 없습니다')));
  } finally { await e.cleanup(); }
});

test('product without a linked bag keeps receipt and transfer with no bag ledger', async () => {
  const { e } = await receipt('product', { unlinkedBag: true });
  try {
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 1, e.alerts.join('\n'));
    assert.equal(e.state.rows.frozenLogs[0].bagTypeId, null);
    assert.equal(e.state.rows.frozenLogs[0].deductedBagQty, 0);
    assert.equal(e.state.rows.frozenLogs[0].ledgerId, null);
    assert.equal(e.state.rows.bagLogs?.length || 0, 0);
    assert.equal(e.state.rows.stockLedger?.length || 0, 0);
    assert.equal(e.state.rows.productTransferRequests.length, 1);
  } finally { await e.cleanup(); }
});

test('transaction callback retry uses the same pre-read activity document ID', async () => {
  const { e } = await receipt('product', { retryTransactionCallbackOnce: true });
  try {
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 1, e.alerts.join('\n'));
    const firstActivity = e.state.transactionRetryPaths.find(path => path.startsWith('activityLogs/'));
    const committedActivity = e.state.commits[0].find(operation => operation.target.path.startsWith('activityLogs/'))?.target.path;
    assert.ok(firstActivity);
    assert.equal(committedActivity, firstActivity);
    assert.equal(e.state.rows.activityLogs.length, 1);
  } finally { await e.cleanup(); }
});

test('server product change aborts before any receipt write', async () => {
  const { e } = await receipt();
  try {
    e.state.rows.frozenProducts[0].name = '변경된 제품';
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 0);
    assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
  } finally { await e.cleanup(); }
});

test('generated frozenLog ID collision aborts instead of overwriting an existing receipt', async () => {
  const { e } = await receipt();
  try {
    e.state.rows.frozenLogs = [{ id: 'fixture-1', qty: 99, status: 'active' }];
    await e.fire('#btnSaveIncoming');
    assert.equal(e.state.commits.length, 0);
    assert.equal(e.state.rows.frozenLogs[0].qty, 99);
    assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
  } finally { await e.cleanup(); }
});
