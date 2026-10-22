// Local statistical UI evidence only. Imported exclusively by previewStats.mjs.
import { fixture } from './firestore.mjs';
const rows = fixture.state.rows;
const dates = ['2026-09-01', '2026-09-04', '2026-09-10'];
rows.productions = dates.flatMap((date, i) => [
  { id: 'p' + i, date, status: 'active', category: 'raw', recipeId: 'r1', recipeName: '치킨 생식', received: true,
    receivedTotalPacks: 100 + i * 30, productionUnitQty: 10 + i, productionUnitName: 'kg',
    ingredientsSnapshot: [{ name: '닭가슴살', meatTypeId: 'm1', requiredQtyG: 8000 + i * 1000 }, { name: '당근', meatTypeId: 'm2', requiredQtyG: 2000 }] },
  { id: 'fd' + i, date, status: 'active', category: 'freezeDry', recipeId: 'r2', recipeName: '치킨 큐브', received: true,
    receivedFreezeType: 'breadPan', receivedFreezeQty: 3 + i, productionUnitQty: 4, productionUnitName: 'kg',
    ingredientsSnapshot: [{ name: '닭가슴살', meatTypeId: 'm1', requiredQtyG: 4000 }] },
]);
rows.productions.push({ id: 'unknown', date: '2026-09-11', status: 'active', category: 'raw', recipeId: 'r1', recipeName: '치킨 생식', received: false });
rows.frozenProducts = [{ id: 'f1', name: '치킨 큐브', kind: 'product' }, { id: 'set', name: '큐브 샘플세트', kind: 'sampleSet' }];
rows.frozenLogs = dates.map((date, i) => ({ id: 'f' + i, productId: 'f1', productNameSnapshot: '치킨 큐브', status: 'active', date, qty: 20 + i * 5 }));
rows.frozenLogs.push({ id: 'set', productId: 'set', productNameSnapshot: '큐브 샘플세트', date: '2026-09-10', status: 'active', qty: 5, componentsSnapshot: [{ frozenProductId: 'f1', qty: 2 }] },
  { id: 'component', productId: 'f1', productNameSnapshot: '치킨 큐브', date: '2026-09-10', status: 'active', qty: -10, sampleSetLogId: 'set' });
rows.meatLogs = dates.flatMap((date, i) => [
  { id: 'in' + i, type: 'frozenIncoming', date, meatTypeId: 'm1', meatNameSnapshot: '닭가슴살', delta: 20000 + i * 2000 },
  { id: 'out' + i, type: 'productionDeduct', date, meatTypeId: 'm1', meatNameSnapshot: '닭가슴살', delta: -12000 - i * 1000 },
]);
rows.meatLogs.push({ id: 'older', type: 'frozenIncoming', date: '2026-08-20', meatTypeId: 'm2', meatNameSnapshot: '당근', delta: 2000 });
rows.bagLogs = [{ id: 'b1', type: 'incoming', date: '2026-09-01', bagTypeId: 'b', bagNameSnapshot: '생식 봉투', qty: 1000 },
  { id: 'b2', type: 'autoDeduct', date: '2026-09-03', bagTypeId: 'b', bagNameSnapshot: '생식 봉투', qty: -120 },
  { id: 'b3', type: 'autoDeductReverse', date: '2026-09-04', bagTypeId: 'b', bagNameSnapshot: '생식 봉투', qty: 20 }];
rows.eggLogs = [{ id: 'eggIn', date: '2026-09-01', type: 'in', qty: 30 }, { id: 'eggOut', date: '2026-09-02', type: 'out', qty: -10 }];
rows.supplementTypes = [{ id: 's1', name: '치킨 영양제', active: false }];
rows.supplementLogs = [{ id: 'sin', date: '2026-09-01', type: 'in', supplementTypeId: 's1', qty: 10 },
  { id: 'sout', date: '2026-09-02', type: 'autoDeduct', supplementTypeId: 's1', qty: -1, relatedProductionId: 'p0' }];
rows.schedules = dates.map((date, i) => ({ id: 'sc' + i, type: 'meat', itemId: 'm1', itemNameSnapshot: '닭가슴살', date, status: 'completed',
  createdAt: { seconds: (Date.parse(date) - (3 + i) * 86400000) / 1000 }, completedAt: { seconds: Date.parse(date) / 1000 } }));
