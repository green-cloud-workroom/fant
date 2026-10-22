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
    await e.page.renderStats();
    assert.equal(e.state.reads.length, reads);
    e.fire('[data-tab="supply"]'); await e.ready('supply');
    assert.equal(e.page.viewForTest().events[0].qty, 10);
    assert.match(e.nodes.mainContent.textContent, /입고예정 사전 등록 통계/);
    e.fire('[data-tab="usage"]'); await e.ready('usage');
    assert.equal(e.page.viewForTest().events[0].qty, 1);
    assert.match(e.nodes.mainContent.textContent, /생산일·변동일 평균/);
    assert.equal(e.state.writes.length, 0);
    assert.ok(!e.state.reads.some(r => /equipment|forecast|Transfer|stockLedger/.test(r.path)));
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
    e.document.getElementById('statsChartFold').open = true; e.fire('#statsChartFold', 'toggle');
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
