import test from 'node:test';
import assert from 'node:assert/strict';
import { pageEnvironment } from './helpers/pageDom.mjs';

const requestPath = 'productTransferRequests/frozenLogs:receipt-1:1';

async function setup(action, requestStatus, kind = 'product') {
  const e = await pageEnvironment('frozenProduct', {
    instrument: '\nexport {showEditIncomingModal};',
  });
  const product = e.state.rows.frozenProducts[0];
  product.kind = kind;
  if (kind === 'sampleSet') product.components = [];
  const log = {
    id: 'receipt-1', productId: product.id, productNameSnapshot: product.name,
    date: e.today, timestamp: new Date('2026-09-14T00:00:00Z'),
    qty: 4, deductedBagQty: 4, bagTypeId: 'b1', ledgerId: 'ledger-1',
    status: 'active', staffName: '검증 담당자',
  };
  e.state.rows.frozenLogs = [log];
  e.state.rows.stockLedger = [{ id: 'ledger-1', actionType: 'frozenProductIncoming',
    actionId: log.id, status: 'active', items: [{
      collection: 'bagTypes', docId: 'b1', field: 'currentQty', delta: -4,
      before: 104, after: 100, bagLogId: 'baglog-1',
    }] }];
  e.state.rows.bagLogs = [{ id: 'baglog-1', bagTypeId: 'b1', type: 'autoDeduct',
    qty: -4, before: 104, after: 100 }];
  if (requestStatus) e.state.rows.productTransferRequests = [{
    id: 'frozenLogs:receipt-1:1', sourceCollection: 'frozenLogs',
    sourceId: log.id, revision: 1, status: requestStatus,
  }];
  await e.page.renderFrozenProduct();
  if (action === 'edit') {
    e.page.showEditIncomingModal(product, log);
    e.fill('#m_qty', 5);
  } else {
    await e.fire('.recipe-list-item');
  }
  return e;
}

test('sample set without an outbox blocks quantity change before component drift', async () => {
  const e = await setup('edit', null, 'sampleSet');
  try {
    await e.fire('#btnSaveEditIncoming');
    assert.ok(e.state.reads.some(read => read.path === requestPath));
    assert.equal(e.state.rows.frozenLogs[0].qty, 4);
    assert.deepEqual(e.state.writes, []);
    assert.ok(e.alerts.some(message => message.includes('수량 정정')));
  } finally { await e.cleanup(); }
});

test('legacy quantity correction leaves bag, ledger and parent untouched', async () => {
  const e = await setup('edit');
  try {
    e.state.rows.frozenLogs[0].ledgerId = 'ledger-1';
    e.state.rows.stockLedger = [{ id: 'ledger-1', status: 'active', actionId: 'receipt-1',
      items: [{ collection: 'bagTypes', docId: 'b1', field: 'currentQty', delta: -4, after: 100 }] }];
    await e.fire('#btnSaveEditIncoming');
    assert.deepEqual(e.state.writes, []);
    assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
    assert.equal(e.state.rows.stockLedger[0].status, 'active');
    assert.equal(e.state.rows.frozenLogs[0].qty, 4);
  } finally { await e.cleanup(); }
});

test('legacy metadata correction commits only the parent once', async () => {
  const e = await setup('edit');
  try {
    e.fill('#m_qty', 4);
    e.fill('#m_note', '메모 정정');
    await e.fire('#btnSaveEditIncoming');
    assert.equal(e.state.commits.length, 1, e.alerts.join('\n'));
    assert.deepEqual(e.state.writes, ['frozenLogs/receipt-1']);
    assert.equal(e.state.rows.frozenLogs[0].note, '메모 정정');
    assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
    assert.equal(e.state.rows.bagLogs?.length || 0, 1);
  } finally { await e.cleanup(); }
});

test('stale legacy receipt is rejected before metadata write', async () => {
  const e = await setup('edit');
  try {
    e.fill('#m_qty', 4);
    e.fill('#m_note', '메모 정정');
    e.state.rows.frozenLogs[0] = { ...e.state.rows.frozenLogs[0], ledgerId: 'changed-ledger' };
    await e.fire('#btnSaveEditIncoming');
    assert.deepEqual(e.state.writes, []);
    assert.equal(e.state.rows.frozenLogs[0].note, undefined);
  } finally { await e.cleanup(); }
});

test('sample set component snapshot drift blocks metadata edit', async () => {
  const e = await setup('edit', null, 'sampleSet');
  try {
    e.fill('#m_qty', 4);
    e.fill('#m_note', '메모 정정');
    e.state.rows.frozenLogs[0] = { ...e.state.rows.frozenLogs[0],
      componentsSnapshot: [{ frozenProductId: 'sample2', qty: 2 }] };
    await e.fire('#btnSaveEditIncoming');
    assert.deepEqual(e.state.writes, []);
  } finally { await e.cleanup(); }
});

// Client refund/soft-delete retired; server cancellation contract is covered separately.
for (const action of ['edit']) {
  for (const malformedSourceId of [undefined, 'other-receipt']) {
    test(`${action} holds ID-namespaced revision 2 with malformed sourceId ${malformedSourceId}`, async () => {
      const e = await setup(action);
      try {
        e.state.rows.productTransferRequests = [{ id: 'frozenLogs:receipt-1:2',
          sourceCollection: 'frozenLogs', ...(malformedSourceId === undefined ? {} : { sourceId: malformedSourceId }),
          revision: 2, status: 'pending' }];
        if (action === 'edit') { e.fill('#m_qty', 4); e.fill('#m_note', '변경 시도'); }
        await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
        assert.deepEqual(e.state.writes, []);
        assert.ok(e.state.reads.some(read => read.kind === 'query' &&
          read.conditions?.some(condition => condition.field === '__name__' && condition.op === '>=')));
        assert.ok(e.alerts.some(message => message.includes('재고앱으로 보낸')));
      } finally { await e.cleanup(); }
    });
  }

  test(`${action} holds another revision of the same frozen receipt`, async () => {
    const e = await setup(action);
    try {
      e.state.rows.productTransferRequests = [{ id: 'frozenLogs:receipt-1:2',
        sourceCollection: 'frozenLogs', sourceId: 'receipt-1', revision: 2, status: 'pending' }];
      await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
      assert.deepEqual(e.state.writes, []);
      assert.ok(e.state.reads.some(read => read.kind === 'query' && read.path === 'productTransferRequests'));
      assert.ok(e.alerts.some(message => message.includes('재고앱으로 보낸')));
    } finally { await e.cleanup(); }
  });

  test(`${action} fails closed if the revision scan fails`, async () => {
    const e = await setup(action);
    try {
      e.state.failures.add('productTransferRequests');
      await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
      assert.deepEqual(e.state.writes, []);
    } finally { await e.cleanup(); }
  });

  test(`${action} ignores the same source ID from another collection`, async () => {
    const e = await setup(action);
    try {
      if (action === 'edit') { e.fill('#m_qty', 4); e.fill('#m_note', '메모 정정'); }
      e.state.rows.productTransferRequests = [{ id: 'productions:receipt-1:2',
        sourceCollection: 'productions', sourceId: 'receipt-1', revision: 2, status: 'pending' }];
      await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
      assert.ok(e.state.writes.includes('frozenLogs/receipt-1'), e.alerts.join('\n'));
    } finally { await e.cleanup(); }
  });

  for (const status of ['pending', 'completed', 'rejected']) {
    test(`${action} holds sent frozen receipt in ${status}`, async () => {
      const e = await setup(action, status);
      try {
        await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
        assert.ok(e.state.reads.some(read => read.path === requestPath));
        assert.deepEqual(e.state.writes, []);
        assert.equal(e.state.rows.frozenLogs[0].qty, 4);
        assert.equal(e.state.rows.frozenLogs[0].status, 'active');
        assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
        assert.ok(e.alerts.some(message => message.includes('재고앱으로 보낸')));
      } finally { await e.cleanup(); }
    });
  }

  test(`${action} fails closed when transfer lookup fails`, async () => {
    const e = await setup(action);
    try {
      e.state.failures.add(requestPath);
      await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
      assert.deepEqual(e.state.writes, []);
      assert.equal(e.state.rows.frozenLogs[0].qty, 4);
      assert.equal(e.state.rows.frozenLogs[0].status, 'active');
      assert.equal(e.state.rows.bagTypes[0].currentQty, 100);
    } finally { await e.cleanup(); }
  });

  test(`${action} preserves an unsent frozen receipt path`, async () => {
    const e = await setup(action);
    try {
      if (action === 'edit') { e.fill('#m_qty', 4); e.fill('#m_note', '메모 정정'); }
      await e.fire(action === 'edit' ? '#btnSaveEditIncoming' : '.btn-del-row');
      assert.ok(e.state.reads.some(read => read.path === requestPath));
      assert.ok(e.state.writes.includes('frozenLogs/receipt-1'), e.alerts.join('\n'));
      if (action === 'edit') {
        assert.equal(e.state.rows.frozenLogs[0].qty, 4);
        assert.equal(e.state.rows.frozenLogs[0].note, '메모 정정');
      }
      else assert.equal(e.state.rows.frozenLogs[0].status, 'deleted');
    } finally { await e.cleanup(); }
  });
}
