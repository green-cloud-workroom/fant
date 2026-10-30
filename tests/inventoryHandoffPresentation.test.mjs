import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import { environment } from './helpers/modules.mjs';

for (const outcome of ['success', 'response-lost-confirmed', 'unconfirmed']) {
  test(`handoff completion label requires server evidence: ${outcome}`, async () => {
    const e = await environment();
    const { document } = parseHTML('<html><body></body></html>');
    e.context.document = document;
    let operationId, confirmed = 0, handoffs = 0;
    const context = { receiptStatus: 'pending', sourceKey: 'source',
      request: { category: 'raw', recipeName: '합성 생산', boxes: 1, remainderPacks: 0, producedDate: '2026-09-14' },
      actor: { name: '합성 담당자', employeeId: 'fixture' } };
    e.synthetic(resolve('src/firebase.js'), { auth: { app: {}, currentUser: { uid: 'fixture' } } });
    e.synthetic(resolve('src/services/actionGateway.js'), { openAction: async () => ({ submit: action => action() }) });
    e.synthetic(resolve('src/utils/modalManager.js'), { registerModalDismiss: () => () => {} });
    e.synthetic('firebase/functions', { getFunctions: () => ({}), httpsCallable: () => async data => {
      if (data.action === 'context') return { data: { ...context,
        handoff: outcome === 'response-lost-confirmed' && operationId ? { operationId } : null } };
      handoffs++; operationId = data.operationId;
      if (outcome !== 'success') throw Error('synthetic response loss');
      return { data: {} };
    } });
    const service = await e.load('src/services/inventoryHandoff.js');
    await service.showHandoff('productions:fixture:1', { onConfirmed: () => { confirmed++; } });
    assert.equal(confirmed, 0);
    document.querySelector('[data-label]').value = '합성 식별';
    document.querySelector('[data-arrived]').value = '2026-09-14T12:00';
    document.querySelector('[data-complete]').checked = true;
    const button = document.querySelector('[data-save]');
    await button.onclick({ currentTarget: button });
    assert.equal(handoffs, 1);
    assert.equal(confirmed, outcome === 'unconfirmed' ? 0 : 1);
  });
}
