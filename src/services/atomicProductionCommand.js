import { collection, doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';

// Execute the existing FIFO calculation against fresh snapshots; commit its
// stock, movement logs, ledger and completion together or commit nothing.
export async function atomicProductionLoad({ db, date, productionIds, stockIds, recipeIds,
  assertCurrent, build }) {
  if (!productionIds.length || !recipeIds.length) throw Error('처리할 생산이 없습니다.');
  const ledgerRef = doc(collection(db, 'stockLedger'));
  const executionId = `productionCompletion:${date}:${ledgerRef.id}`;
  return runTransaction(db, async tx => {
    await assertCurrent();
    const completionRef = doc(db, 'productionCompletion', date);
    const completion = await tx.get(completionRef);
    if (completion.exists() && completion.data().status === 'completed') return { alreadyCompleted: true };
    const cache = new Map();
    const preload = async (name, ids) => Promise.all([...new Set(ids)].map(async id => {
      const ref = doc(db, name, id), snap = await tx.get(ref);
      cache.set(ref.path, snap); return snap;
    }));
    const [stocks, recipes, productions] = await Promise.all([
      preload('meatStocks', stockIds), preload('recipes', recipeIds), preload('productions', productionIds),
    ]);
    if (productions.some(s => !s.exists() || s.data().lockedByCompletion || ['deleted', 'cancelled'].includes(s.data().status))) {
      throw Error('생산 기록이 변경됐습니다. 새로고침 후 다시 진행해주세요.');
    }
    if (recipes.some(s => !s.exists())) throw Error('레시피를 다시 확인해주세요.');
    const recipeSet = new Set(recipes.map(s => s.id));
    for (const p of productions) {
      const row = p.data();
      if (!recipeSet.has(row.recipeId) || !Array.isArray(row.ingredientsSnapshot)
        || row.ingredientsSnapshot.some(i => i.autoDeductInventory && i.meatTypeId && (!Number.isFinite(i.requiredQtyG) || i.requiredQtyG < 0))) {
        throw Error('생산 원료 스냅샷이 변경됐거나 수량이 누락됐습니다. 새로고침해주세요.');
      }
    }
    const bags = await preload('bagTypes', recipes.filter(s => s.exists()).map(s => s.data().bagTypeId).filter(Boolean));
    if (bags.some(s => !s.exists())) throw Error('봉투 재고 문서가 없습니다.');
    cache.set(completionRef.path, completion);
    const staged = new Map(), logs = [];
    const writable = new Set(['meatStocks','bagTypes','meatLogs','bagLogs','stockLedger','productionCompletion','productions','activityLogs']);
    const put = (ref, data, update) => {
      const name = ref.path.split('/')[0];
      if (!writable.has(name)) throw Error('생산 저장 범위를 벗어났습니다.');
      const old = staged.get(ref.path);
      staged.set(ref.path, { ref, data: old ? { ...old.data, ...data } : data, update: old ? old.update : update });
    };
    const writer = {
      getDoc: async ref => {
        if (!cache.has(ref.path)) throw Error('검증되지 않은 재고를 읽을 수 없습니다.');
        return cache.get(ref.path);
      },
      updateDoc: async (ref, data) => put(ref, data, true),
      setDoc: async (ref, data) => put(ref, { ...data, executionId, ledgerId: ledgerRef.id, movementSchemaVersion: 2 }, false),
      addDoc: async (parent, data) => {
        const ref = parent.path === 'stockLedger' ? ledgerRef : doc(parent);
        const value = { ...data, executionId, ledgerId: ledgerRef.id, movementSchemaVersion: 2,
          ...(parent.path === 'stockLedger' ? { productionIds } : {}) };
        if (['meatLogs','bagLogs'].includes(parent.path)) logs.push({ ref, value });
        put(ref, value, false); return ref;
      },
    };
    const rows = snaps => snaps.filter(s => s.exists()).map(s => ({ ...s.data(), id: s.id }));
    const result = await build({ writer, executionId, meatStocks: rows(stocks).filter(s => !s.closed && s.status !== 'deleted'), recipes: rows(recipes),
      targetProductions: rows(productions) });
    if (result === false) return { aborted: true };
    const ledger = staged.get(ledgerRef.path), completed = staged.get(completionRef.path);
    if (!ledger || !completed || completed.data.status !== 'completed') throw Error('생산 완료 근거가 누락됐습니다.');
    const movementEnds = new Map();
    for (const item of ledger.data.items) {
      const path = `${item.collection}/${item.docId}`;
      const before = movementEnds.has(path) ? movementEnds.get(path) : cache.get(path)?.data()?.[item.field] ?? 0;
      if (!Number.isFinite(item.delta) || Math.abs(before-item.before)>1e-6
        || Math.abs(item.before+item.delta-item.after)>1e-6 || item.after < -1e-6) throw Error('재고 차감·반환 수량이 이어지지 않습니다. 저장을 중단합니다.');
      movementEnds.set(path,item.after);
      const matched = logs.filter(l => (item.collection === 'meatStocks' ? l.value.meatStockId : l.value.bagTypeId) === item.docId
        && (l.value.delta ?? l.value.qty) === item.delta && l.value.before === item.before && l.value.after === item.after);
      if (matched.length !== 1) throw Error('재고 변동과 기록이 일치하지 않습니다.');
      item.sourceLogId = matched[0].ref.id;
      item.sourceCollection = matched[0].ref.parent.id;
    }
    for (const [path,end] of movementEnds) {
      const item = ledger.data.items.find(i => `${i.collection}/${i.docId}` === path);
      if (staged.get(path)?.data[item.field] !== end) throw Error('최종 재고와 작업 원장이 일치하지 않습니다.');
    }
    if (staged.size > 450) throw Error('한 번에 처리할 생산 기록이 너무 많습니다. 담당자에게 문의해주세요.');
    await assertCurrent();
    for (const op of staged.values()) op.update ? tx.update(op.ref, op.data) : tx.set(op.ref, op.data);
    return { executionId, ledgerId: ledgerRef.id, writes: staged.size };
  });
}

export async function atomicProductionRollback({ db, date, ledgerId, productionIds, staff, uid,
  reason, assertCurrent, confirmChanged }) {
  await assertCurrent();
  const ledgerRef = doc(db, 'stockLedger', ledgerId), preview = await getDocFromServer(ledgerRef);
  if (!preview.exists()) throw Error('취소할 작업 원장이 없습니다.');
  const items = preview.data().items || [], expected = new Map(), final = new Map();
  for (const i of items) {
    if (!['meatStocks','bagTypes'].includes(i.collection)) throw Error('취소 대상 재고 종류를 확인해주세요.');
    final.set(`${i.collection}/${i.docId}`, i);
  }
  for (const [path, i] of final) {
    const snap = await getDocFromServer(doc(db, path));
    if (!snap.exists()) throw Error('취소 대상 재고가 없습니다.');
    const value = snap.data()[i.field];
    if (!Number.isFinite(value)) throw Error('취소 대상 재고 수량을 확인해주세요.');
    if (value !== i.after && !await confirmChanged(i)) throw Error('취소를 중단했습니다. 재고는 변경되지 않았습니다.');
    expected.set(path, value);
  }
  return runTransaction(db, async tx => {
    await assertCurrent();
    const completionRef = doc(db, 'productionCompletion', date);
    const [completion, ledger] = await Promise.all([tx.get(completionRef), tx.get(ledgerRef)]);
    if (!completion.exists() || completion.data().ledgerId !== ledgerId) throw Error('생산 완료 상태가 변경됐습니다.');
    if (completion.data().status === 'cancelled' && ledger.data()?.status === 'rolledBack') return { alreadyCancelled: true };
    if (completion.data().status !== 'completed' || ledger.data()?.status !== 'active'
      || JSON.stringify(ledger.data().items) !== JSON.stringify(items)) throw Error('취소 근거가 변경됐습니다.');
    const rows = new Map();
    for (const [path, i] of final) {
      const snap = await tx.get(doc(db, path));
      if (!snap.exists() || snap.data()[i.field] !== expected.get(path)) throw Error('재고가 변경됐습니다. 취소를 다시 확인해주세요.');
      rows.set(path, { ...snap.data() });
    }
    const ids = ledger.data().productionIds || productionIds;
    const productions = await Promise.all(ids.map(id => tx.get(doc(db, 'productions', id))));
    const operations = [], batchId = completion.data().executionId || `productionCompletion:${date}`;
    for (const i of [...items].reverse()) {
      const path = `${i.collection}/${i.docId}`, r = rows.get(path), before = r[i.field], after = before - i.delta;
      if (!Number.isFinite(after) || after < -1e-6) throw Error('복원 후 재고가 음수가 됩니다. 담당자 확인이 필요합니다.');
      r[i.field] = Math.max(0, after);
      const meat = i.collection === 'meatStocks', name = meat ? 'meatLogs' : 'bagLogs';
      const entry = { type: meat ? 'productionRollback' : 'autoDeductReverse', date,
        ...(meat ? { meatTypeId:r.meatTypeId, meatNameSnapshot:r.meatNameSnapshot || '', meatStockId:i.docId,
          stage:r.stage, delta:-i.delta } : { bagTypeId:i.docId, bagNameSnapshot:r.name || '', qty:-i.delta }),
        before, after:r[i.field], staff, uid, reason, batchId, executionId:batchId, ledgerId,
        reversalOf:i.sourceLogId || null, movementSchemaVersion:2, timestamp:serverTimestamp() };
      operations.push({ ref:doc(collection(db,name)), entry });
    }
    if (operations.length + rows.size + productions.length + 2 > 450) throw Error('취소 항목이 너무 많습니다.');
    await assertCurrent();
    for (const [path, r] of rows) {
      const i = final.get(path);
      tx.update(doc(db,path), { [i.field]:r[i.field], ...(i.collection === 'meatStocks' ? {closed:r[i.field]<=0}:{}), updatedAt:serverTimestamp() });
    }
    for (const op of operations) tx.set(op.ref,op.entry);
    tx.update(ledgerRef,{status:'rolledBack',rolledBackAt:serverTimestamp(),rollbackReason:reason});
    tx.update(completionRef,{status:'cancelled',cancelReason:reason,cancelledAt:serverTimestamp()});
    for (const p of productions) if(p.exists())tx.update(p.ref,{lockedByCompletion:false});
    return { restored:true, movementLogs:operations.length };
  });
}
