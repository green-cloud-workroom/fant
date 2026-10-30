import { pageEnvironment } from '../helpers/pageDom.mjs';

// Real main renderer, isolated Firestore fixture; no Firebase calls or credentials.
export async function mainV2Fixture() {
  const e = await pageEnvironment('main', { instrument: `
    export { stockLogSeverity, renderLogRow, renderProductionTableCard, renderCalendarCell, bindLogMenus };
    export function installV2Fixture(data) {
      productions = data.productions; recipes = data.recipes; combinedLogs = data.logs;
      blockingData = data.blocking; overdueClosingDate = data.overdueDate;
      overdueProductions = data.productions;
      calendarProductions = data.productions; calendarSchedules = data.schedules;
      calendarWeekOffset = -1;
      renderMainLayout();
    }
  ` });
  const names = ['고양이 본+치킨', '강아지 램', '고양이 미디엄프로틴치킨', '고양이 치킨', '강아지 치킨', '고양이 퀘일+치킨'];
  const colors = ['#d2e8c2', '#f2d4b2', '#cce6f3', '#e7d6ef', '#d5e9f2', '#f1e5c4'];
  const productions = names.map((recipeName, i) => ({ id: 'ui2-' + i, date: '2026-09-11', recipeId: 'r1', recipeName,
    category: 'raw', color: colors[i], productionUnitQty: i === 0 ? 15 : i + 1, productionUnitName: 'kg',
    productionUnit: 'kg', rawBoxQty: i + 2, sortOrder: i, received: i === 0 || i === 4,
    receivedRevision: 1, receivedBox: i + 2,
    ingredientsSnapshot: [
      { name: '닭가슴살', isProductionUnit: true, meatTypeId: 'm1', requiredQtyG: (i + 1) * 1000, weightDisplayUnit: 'kg' },
      { name: '노른자', requiredQtyG: 1250, weightDisplayUnit: 'g' },
      { name: '닭간', meatTypeId: 'm2', requiredQtyG: 2500, weightDisplayUnit: 'kg' },
      { name: '닭염통', meatTypeId: 'm3', requiredQtyG: 1750, weightDisplayUnit: 'kg' },
    ] }));
  const logs = [0, 1, 4].map((current, i) => ({ id: 'stock-' + i, date: e.today,
    action: 'minStock', subAction: 'alert', acknowledged: false,
    timestamp: { toMillis: () => Date.parse('2026-09-14T02:30:00Z') + i * 60000 },
    details: { kind: 'supplement', current, minimum: 5 },
    message: `영양제 ${names[i]} — 현재 ${current}봉 / 최소 5봉` }));
  logs.push({ id: 'office-1', date: e.today, action: 'schedule', subAction: 'update', acknowledged: false,
    message: '입고예정 수정 — 양간 15kg → 31kg', timestamp: { toMillis: () => Date.parse('2026-09-14T02:32:00Z') } },
  { id: 'office-2', date: e.today, action: 'supplementStock', subAction: 'incoming', acknowledged: true,
    message: '실제 입고 — 치킨 영양제 2봉', timestamp: { toMillis: () => Date.parse('2026-09-14T02:28:00Z') } });
  const data = { productions, recipes: e.state.rows.recipes, logs, overdueDate: '2026-09-11',
    blocking: { totalBlocked: 1, items: [{ id: 6, count: 1, reason: '사무 로그 미확인 항목 1건 있습니다', jumpMenu: 'main' }] },
    schedules: [{ id: 'arrival', date: e.today, type: 'meat', itemNameSnapshot: '양간', orderedQty: 31, orderedUnit: 'kg', status: 'scheduled' }] };
  e.page.installV2Fixture(data);
  return { ...e, data };
}
