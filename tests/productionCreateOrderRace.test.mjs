import test from 'node:test';
import assert from 'node:assert/strict';
import { pageEnvironment } from './helpers/pageDom.mjs';

test('two stale create forms can leave duplicate sortOrder after round recalculation', async () => {
  const e = await pageEnvironment('production', {
    instrument: '\nexport {recalcRoundsAndBatches};',
  });
  try {
    const existing = [{id:'existing',recipeId:'recipe',productionUnitQty:1,sortOrder:0,round:1,batchNo:null}];
    const staleForms = [structuredClone(existing), structuredClone(existing)];
    const created = staleForms.map((view, i) => ({
      id:`created-${i}`, recipeId:'recipe', productionUnitQty:1,
      sortOrder:view.length, round:view.length+1, batchNo:null,
    }));
    const rows = [...existing, ...created];
    const updates = e.page.recalcRoundsAndBatches(rows);
    assert.equal(created[0].sortOrder, created[1].sortOrder);
    assert.ok(updates.some(row => row.round === 3));
    // The current recalculator writes only round and batchNo, never sortOrder.
    assert.ok(updates.every(row => !Object.hasOwn(row, 'sortOrder')));
  } finally { await e.cleanup(); }
});

test('duplicate sortOrder uses stable ID ordering for round and batch recalculation', async () => {
  const e = await pageEnvironment('production', {
    instrument: '\nexport {recalcRoundsAndBatches,compareProductionOrder};',
  });
  try {
    const a = { id:'a', recipeId:'recipe', productionUnitQty:1, sortOrder:1, round:2, batchNo:null };
    const z = { id:'z', recipeId:'recipe', productionUnitQty:1, sortOrder:1, round:2, batchNo:null };
    const existing = { id:'existing', recipeId:'recipe', productionUnitQty:1, sortOrder:0, round:1, batchNo:null };
    const first = e.page.recalcRoundsAndBatches([existing,z,a]);
    const second = e.page.recalcRoundsAndBatches([a,existing,z]);
    assert.deepEqual(first,second);
    assert.equal(e.page.compareProductionOrder(a,z),-e.page.compareProductionOrder(z,a));
    assert.ok(e.page.compareProductionOrder(existing,a)<0);
    assert.equal(e.page.compareProductionOrder(a,a),0);
    const nullOrder = {id:'null',sortOrder:null};
    const missingOrder = {id:'missing'};
    const invalidOrder = {id:'invalid',sortOrder:NaN};
    assert.ok(e.page.compareProductionOrder(nullOrder,existing)<0);
    assert.ok(e.page.compareProductionOrder(existing,missingOrder)<0);
    assert.equal(e.page.compareProductionOrder(missingOrder,invalidOrder),
      -e.page.compareProductionOrder(invalidOrder,missingOrder));
    assert.deepEqual(JSON.parse(JSON.stringify(first.map(row=>[row.id,row.round,row.batchNo]))),[
      ['existing',1,1],['a',2,2],['z',3,3],
    ]);
  } finally { await e.cleanup(); }
});
