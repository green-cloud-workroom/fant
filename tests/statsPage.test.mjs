import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import { environment } from './helpers/modules.mjs';

async function setup({ instant = true } = {}) {
  const e = await environment({ session: true, instantRoutes: instant ? ['stats'] : [],
    instrument: { 'src/pages/stats.js': '\nexport {refreshStats,buildView,download}; export function viewForTest(){return lastView;}' } });
  const { document, Event } = parseHTML('<html><body><div id="mainContent"></div></body></html>');
  const chartInstances = [], downloads = [];
  e.context.document = document;
  e.context.alert = message => { throw Error(message); };
  e.nodes.mainContent = document.getElementById('mainContent');
  e.synthetic('chart.js', { registerables: [], Chart: class {
    static register() {}
    constructor(node, config) { this.node = node; this.config = config; chartInstances.push(this); }
    destroy() { this.destroyed = true; }
  } });
  e.synthetic(resolve('src/utils/spreadsheet.js'), {
    utils: { book_new: () => ({ sheets: [] }), aoa_to_sheet: rows => ({ rows }),
      book_append_sheet: (book, sheet, name) => book.sheets.push({ name, ...sheet }) },
    writeFile: (book, name) => downloads.push({ book, name }),
  });
  e.state.rows.productions = [
    { id: 'confirmed', date: '2026-09-03', status: 'active', category: 'raw', recipeId: 'r1', recipeName: '확정 치킨',
      received: true, receivedTotalPacks: 120, productionUnitQty: 5, productionUnitName: 'kg',
      ingredientsSnapshot: [{ name: '닭', meatTypeId: 'm', requiredQtyG: 1000 }] },
    { id: 'unconfirmed', date: '2026-09-03', status: 'active', category: 'raw', recipeId: 'r1', recipeName: '미확인 치킨',
      received: false, productionUnitQty: 999, ingredientsSnapshot: [{ name: '닭', meatTypeId: 'm', requiredQtyG: 999000 }] },
  ];
  Object.assign(e.state.rows, {
    meatLogs: [{ id: 'in', date: '2026-09-02', type: 'frozenIncoming', meatTypeId: 'm', meatNameSnapshot: '닭', delta: 10000 }],
    bagLogs: [], eggLogs: [], supplementLogs: [], frozenLogs: [], frozenProducts: [],
    schedules: [{ id: 'schedule', status: 'completed', type: 'meat', itemId: 'm', itemNameSnapshot: '닭', date: '2026-09-02',
      createdAt: { seconds: Date.parse('2026-09-01T00:00:00+09:00') / 1000 },
      completedAt: { seconds: Date.parse('2026-09-02T00:00:00+09:00') / 1000 } }],
  });
  const lifecycle = await e.load('src/utils/pageLifecycle.js');
  lifecycle.beginPage(e.nodes.mainContent, 'stats');
  const page = await e.load('src/pages/stats.js');
  const fire = (selector, type = 'click') => {
    const node = document.querySelector(selector); assert.ok(node, selector);
    node.dispatchEvent(new Event(type, { bubbles: true }));
  };
  const ready = async tab => {
    for (let i = 0; i < 100; i++) {
      if (e.nodes.mainContent.dataset.statsReadyTab === tab) return;
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw Error('stats not ready: ' + tab + ' / ' + e.nodes.mainContent.textContent);
  };
  const cleanup = async () => { lifecycle.disposePage(); (await e.load('src/state/sessionStore.js')).sessionStore.clear(); };
  return { ...e, document, page, fire, ready, cleanup, downloads, chartInstances };
}

for (const instant of [true, false]) test('three tabs render confirmed facts, preserve warm reads, and perform zero writes (' + (instant ? 'instant' : 'retained') + ')', async () => {
  const e = await setup({ instant });
  try {
    await e.page.renderStats();
    assert.deepEqual([...e.document.querySelectorAll('.stats-tab')].map(n => n.textContent), ['제품 생산', '원료 수급', '원료 사용']);
    assert.equal(e.page.viewForTest().events[0].qty, 120);
    assert.match(e.nodes.mainContent.textContent, /실적·유형 미확인 1건/);
    const reads = e.state.reads.length;
    assert.ok(!e.state.reads.some(r => /stockLedger|statsCorrections/.test(r.path)), 'product output remains independent of correction evidence');
    await e.page.renderStats();
    assert.equal(e.state.reads.length, reads);
    e.fire('[data-tab="supply"]'); await e.ready('supply');
    assert.equal(e.page.viewForTest().events[0].qty, 10);
    assert.match(e.nodes.mainContent.textContent, /입고예정 사전 등록 통계/);
    e.fire('[data-tab="usage"]'); await e.ready('usage');
    assert.equal(e.page.viewForTest().events[0].qty, 1);
    assert.match(e.nodes.mainContent.textContent, /생산일·변동일 평균/);
    assert.equal(e.state.writes.length, 0);
    assert.ok(!e.state.reads.some(r => /equipment|forecast|Transfer/.test(r.path)));
    assert.ok(e.state.reads.some(r => r.path === 'stockLedger'), 'material statistics validate ledger evidence');
    assert.ok(e.state.reads.some(r => r.path === 'statsCorrections'));
  } finally { await e.cleanup(); }
});

test('Excel uses the same complete filtered tables as the displayed projection', async () => {
  const e = await setup();
  try {
    await e.page.renderStats();
    const input = e.document.getElementById('statsFilter'); input.value = '확정';
    e.fire('#statsFilter', 'input');
    const view = e.page.viewForTest();
    assert.equal(view.events.length, 1);
    assert.equal(view.sections.at(-1).rows.length, 0);
    await e.page.download(false);
    const sheet = e.downloads[0].book.sheets[0];
    const expected = view.sections.flatMap(s => s.rows.map(row => row.map(v => v == null ? '확인 불가' : v)));
    for (const row of expected) assert.ok(sheet.rows.some(actual => JSON.stringify(actual) === JSON.stringify(row)));
    assert.ok(!JSON.stringify(sheet.rows).includes('미확인 치킨'));
    input.value = ''; e.fire('#statsFilter', 'input');
    await e.page.download(true);
    assert.deepEqual(e.downloads[1].book.sheets.map(s => s.name), ['제품 생산', '원료 수급', '원료 사용']);
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('invalid and future date ranges remove old results and disable export without reads', async () => {
  const e = await setup();
  try {
    await e.page.renderStats(); const reads = e.state.reads.length;
    e.document.getElementById('statsEndDate').value = '2026-10-01'; e.fire('#statsEndDate', 'change');
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(e.state.reads.length, reads);
    assert.equal(e.document.getElementById('statsDownloadBtn').disabled, true);
    assert.equal(e.nodes.mainContent.dataset.statsReadyTab, undefined);
    assert.match(e.nodes.mainContent.textContent, /오늘까지의 날짜/);
    assert.equal(e.document.getElementById('statsDetailArea').textContent, '');
  } finally { await e.cleanup(); }
});

test('read failure clears old facts and export, and retry restores the view', async () => {
  const e = await setup();
  try {
    await e.page.renderStats();
    e.state.failures.add('productions');
    await e.page.refreshStats({ force: true });
    assert.equal(e.nodes.mainContent.dataset.statsReadyTab, undefined);
    assert.equal(e.document.getElementById('statsDetailArea').textContent, '');
    assert.equal(e.document.getElementById('statsDownloadBtn').disabled, true);
    e.state.failures.clear(); await e.page.refreshStats({ force: true });
    assert.equal(e.nodes.mainContent.dataset.statsReadyTab, 'production');
    assert.equal(e.page.viewForTest().events.length, 1);
  } finally { await e.cleanup(); }
});

test('page disposal rejects late reads and destroys every chart', async () => {
  const e = await setup();
  try {
    await e.page.renderStats();
    // Charts now render immediately rather than behind a disclosure.
    assert.ok(e.chartInstances.length > 0);
    const before = e.nodes.mainContent.innerHTML;
    e.state.latencyMs = 30;
    const pending = e.page.refreshStats({ force: true });
    await e.cleanup();
    await pending;
    assert.equal(e.nodes.mainContent.dataset.statsReadyTab, undefined);
    assert.equal(e.document.getElementById('statsDetailArea').textContent, '');
    assert.ok(e.chartInstances.every(chart => chart.destroyed));
    assert.notEqual(e.nodes.mainContent.innerHTML, before);
  } finally { await e.cleanup(); }
});

test('production visualization isolates stage/units, follows item selection without reads, and exports the selected full evidence', async () => {
  const e = await setup();
  try {
    e.state.rows.productions.push({ ...e.state.rows.productions[0], id: 'other', recipeId: 'r2', recipeName: '다른 치킨', receivedTotalPacks: 30 });
    e.state.rows.productions.push({ ...e.state.rows.productions[0], id: 'freeze', recipeId: 'r3', recipeName: '동결 치킨', category: 'freezeDry', receivedFreezeType: 'breadPan', receivedFreezeQty: 7 });
    await e.page.renderStats();
    const reads = e.state.reads.length;
    const chart = () => e.chartInstances.filter(c => !c.destroyed).at(-1).config;
    assert.equal(chart().type, 'bar');
    assert.deepEqual(Array.from(chart().data.datasets[0].data), [150]);
    assert.equal(e.page.viewForTest().events.length, 2);
    const item = e.document.querySelector('[data-visual-select="item"]');
    Object.defineProperty(item, 'value', { value: 'recipe:r2', configurable: true });
    e.fire('[data-visual-select="item"]', 'change');
    assert.equal(e.page.viewForTest().events[0]?.qty, 30);
    assert.equal(e.page.viewForTest().events.length, 1);
    await e.page.download(false);
    const text = JSON.stringify(e.downloads[0].book);
    assert.match(text, /다른 치킨/); assert.ok(!text.includes('동결 치킨'));
    assert.match(text, /회당 최소/);
    assert.equal(e.state.reads.length, reads);
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('signed usage charts preserve restorations, ID boundaries and the two average denominators', async () => {
  const e = await setup();
  try {
    e.state.rows.meatLogs.push(
      { id: 'deduct', type: 'productionDeduct', date: '2026-09-02', meatTypeId: 'm', meatNameSnapshot: '닭', delta: -8000 },
      { id: 'restore', type: 'productionRollback', date: '2026-09-03', meatTypeId: 'm', meatNameSnapshot: '닭', delta: 3000 });
    await e.page.renderStats(); e.fire('[data-tab="usage"]'); await e.ready('usage');
    const scope = e.document.querySelector('[data-visual-select="scope"]');
    Object.defineProperty(scope, 'value', { value: JSON.stringify(['재고 순차감', 'kg']), configurable: true });
    e.fire('[data-visual-select="scope"]', 'change');
    const item = e.document.querySelector('[data-visual-select="item"]');
    Object.defineProperty(item, 'value', { value: 'meatLogs:m', configurable: true });
    e.fire('[data-visual-select="item"]', 'change');
    const config = e.chartInstances.filter(c => !c.destroyed).at(-1).config;
    assert.deepEqual(Array.from(config.data.datasets[0].data), [8, -3]);
    assert.equal(config.options.scales.y.beginAtZero, true);
    const g = e.page.viewForTest().groups[0];
    assert.equal(g.total, 5); assert.equal(g.calendarMean, 5 / 14); assert.equal(g.workingMean, 2.5);
    assert.match(e.document.querySelector('#statsChartArea').textContent, /조회기간 전체 14일/);
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('supply keeps prior-period last receipt unknown quantities and filters registration by IDs rather than names', async () => {
  const e = await setup();
  try {
    e.state.rows.meatLogs[0].date = '2026-08-01';
    e.state.rows.meatLogs.push({ id: 'another', type: 'frozenIncoming', date: '2026-09-03', meatTypeId: 'other', meatNameSnapshot: '닭', delta: 1000 });
    e.state.rows.schedules.push({ ...e.state.rows.schedules[0], id: 'other-schedule', itemId: 'other' });
    await e.page.renderStats(); e.fire('[data-tab="supply"]'); await e.ready('supply');
    const item = e.document.querySelector('[data-visual-select="item"]');
    Object.defineProperty(item, 'value', { value: 'meatLogs:m', configurable: true });
    e.fire('[data-visual-select="item"]', 'change');
    const view = e.page.viewForTest();
    assert.equal(view.groups[0].total, null); assert.equal(view.groups[0].lastDate, '2026-08-01');
    assert.equal(view.groups[0].interval.count, 0);
    assert.equal(view.registrationGroups[0].rows.length, 1);
    assert.equal(view.registrationGroups[0].rows[0].source, 'schedules/schedule');
    assert.match(e.document.querySelector('#statsChartArea').textContent, /기간 내 유효한 입고 기록 없음/);
    assert.match(e.document.querySelector('#statsChartArea').textContent, /확인 불가/);
    assert.equal(e.document.querySelector('#statsTimelineChart'), null);
  } finally { await e.cleanup(); }
});

test('calendar shows only recorded days and drilldown, and a query failure removes all visible charts', async () => {
  const e = await setup();
  try {
    await e.page.renderStats();
    assert.equal(e.document.querySelectorAll('[data-calendar-date]').length, 1);
    e.fire('[data-calendar-date="2026-09-03"]');
    assert.match(e.document.querySelector('#statsCalendarSelection').textContent, /120.*productions\/confirmed/s);
    e.state.failures.add('productions');
    await e.page.refreshStats({ force: true });
    assert.equal(e.document.querySelector('#statsChartArea').textContent, '');
    assert.ok(e.chartInstances.every(c => c.destroyed));
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('a local visualization selection during a pending full export cannot export the prior selection', async () => {
  const e = await setup();
  try {
    e.state.rows.productions.push({ ...e.state.rows.productions[0], id: 'other', recipeId: 'r2', recipeName: '다른 치킨' });
    await e.page.renderStats(); await e.page.download(false); e.downloads.length = 0;
    e.state.latencyMs = 30;
    const pending = e.page.download(true);
    await new Promise(resolve => setTimeout(resolve, 5));
    e.fire('[data-visual-item="recipe:r2"]');
    await pending;
    assert.equal(e.downloads.length, 0);
    assert.equal(e.document.getElementById('statsDownloadAllBtn').disabled, false);
  } finally { await e.cleanup(); }
});

test('usage visualization keeps equally named unlinked snapshots selectable as separate source identities', async () => {
  const e = await setup();
  try {
    e.state.rows.productions[0].ingredientsSnapshot.push({ name: '닭', requiredQtyG: 3000 }, { name: '닭', requiredQtyG: 5000 });
    await e.page.renderStats(); e.fire('[data-tab="usage"]'); await e.ready('usage');
    assert.equal(e.page.viewForTest().events.length, 1);
    assert.equal(e.page.viewForTest().events[0].qty, 1); // Linked item is the initial selection.
    const options = [...e.document.querySelectorAll('[data-visual-select="item"] option')];
    assert.equal(options.length, 3); assert.equal(new Set(options.map(o => o.getAttribute('value'))).size, 3);
    assert.equal(options.filter(o => o.textContent.includes('ID 미연결')).length, 2);
    const item = e.document.querySelector('[data-visual-select="item"]');
    Object.defineProperty(item, 'value', { value: 'ingredient:unlinked:confirmed:1', configurable: true });
    e.fire('[data-visual-select="item"]', 'change');
    assert.equal(e.page.viewForTest().groups.length, 1);
    assert.equal(e.page.viewForTest().events[0].qty, 3);
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('a session transition during the full Excel read cannot export the old session data', async () => {
  const e = await setup();
  try {
    await e.page.renderStats();
    await e.page.download(false); e.downloads.length = 0;
    e.state.latencyMs = 30;
    const pending = e.page.download(true);
    await new Promise(resolve => setTimeout(resolve, 5));
    (await e.load('src/state/sessionStore.js')).sessionStore.clear();
    await pending;
    assert.equal(e.downloads.length, 0);
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('supply UI and Excel show an amended quantity and both source references while original and stock remain intact', async () => {
  const e = await setup();
  try {
    const original = e.state.rows.meatLogs[0];
    Object.assign(original, { delta: 82973000, stage: 'frozen', meatStockId: 'lot' });
    e.state.rows.meatLogs.push({ id: 'basis', type: 'adjust', date: original.date, meatTypeId: original.meatTypeId, meatStockId: 'lot',
      before: 82973000, after: 82973, delta: -82890027 });
    e.state.rows.meatLogs.push({ id: 'incomingQuantity_v1_in', type: 'incomingQuantityCorrection', schemaVersion: 1,
      scope: 'incomingQuantity', status: 'active', correctionOf: 'in', basisAdjustmentId: 'basis', date: original.date,
      meatTypeId: original.meatTypeId, meatStockId: 'lot', stage: 'frozen', originalQtyG: 82973000,
      correctedQtyG: 82973, delta: 0, changesStock: false, reason: '승인 정정' });
    const before = JSON.stringify(e.state.rows);
    await e.page.renderStats(); e.fire('[data-tab="supply"]'); await e.ready('supply');
    const view = e.page.viewForTest();
    assert.equal(view.events[0].qty, 82.973);
    assert.match(e.document.getElementById('statsDetailArea').textContent, /meatLogs\/incomingQuantity_v1_in/);
    assert.match(e.document.getElementById('statsDetailArea').textContent, /재고 변동 없음/);
    await e.page.download(false);
    assert.ok(JSON.stringify(e.downloads[0].book.sheets).includes('82.973'));
    assert.equal(JSON.stringify(e.state.rows), before); assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('validated exclusions and production returns agree across table, chart and export; failed evidence blocks both tabs', async () => {
  const e = await setup();
  try {
    const cancelled = { ...e.state.rows.meatLogs[0], id: 'cancelled', delta: 960000 };
    const deduction = { ...e.state.rows.meatLogs[0], id: 'deduction', type: 'productionDeduct', delta: -1000 };
    const returned = { ...e.state.rows.meatLogs[0], id: 'return', type: 'repackedIn', delta: 100, batchId: 'productionCompletion:2026-09-02' };
    e.state.rows.meatLogs.push(cancelled, deduction, returned);
    const c = (kind, row) => ({ id: kind, schemaVersion: 1, status: 'active', changesStock: false, kind,
      source: 'meatLogs/' + row.id, reason: '검증된 정정 근거', evidence: [{ path: 'meatLogs/' + row.id, expected: { ...row } }] });
    e.state.rows.statsCorrections = [c('excludeSupply', cancelled), c('includeUsage', returned)];
    const before = JSON.stringify(e.state.rows);
    await e.page.renderStats(); e.fire('[data-tab="supply"]'); await e.ready('supply');
    assert.equal(e.page.viewForTest().groups[0].total, 10);
    assert.match(e.document.getElementById('statsDetailArea').textContent, /취소 입고 제외/);
    await e.page.download(false);
    assert.ok(!e.page.viewForTest().events.some(r => r.source === 'meatLogs/cancelled'));
    assert.ok(JSON.stringify(e.downloads[0].book).includes('검증된 정정 근거'));
    e.fire('[data-tab="usage"]'); await e.ready('usage');
    const scope = e.document.querySelector('[data-visual-select="scope"]');
    Object.defineProperty(scope, 'value', { value: JSON.stringify(['재고 순차감', 'kg']), configurable: true });
    e.fire('[data-visual-select="scope"]', 'change');
    assert.equal(e.page.viewForTest().groups[0].total, .9);
    const chart = e.chartInstances.filter(c => !c.destroyed).at(-1).config;
    assert.ok(chart.data.datasets[0].data.every(q => Math.abs(q - .9) < 1e-12));
    await e.page.download(false);
    assert.ok(JSON.stringify(e.downloads.at(-1).book).includes('통계 정정'));
    assert.equal(JSON.stringify(e.state.rows), before); assert.equal(e.state.writes.length, 0);
    // A later source edit invalidates the preserved evidence. No stale export is possible.
    e.state.rows.meatLogs.find(r => r.id === 'return').delta++;
    await e.state.notify('meatLogs');
    for (let i = 0; i < 50 && !e.nodes.mainContent.dataset.pageFailed; i++) await new Promise(resolve => setTimeout(resolve, 30));
    assert.match(e.nodes.mainContent.textContent, /통계 자료를 불러오지 못했습니다/);
    assert.ok(e.document.getElementById('statsDownloadBtn').disabled);
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});
