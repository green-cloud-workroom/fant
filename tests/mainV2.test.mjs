import test from 'node:test';
import assert from 'node:assert/strict';
import { mainV2Fixture } from './fixtures/mainV2.mjs';

test('V2 stock severity uses finite structured values, preserves unknown logs and escapes text', async () => {
  const e = await mainV2Fixture();
  try {
    const log = { id: 'x', date: e.today, action: 'minStock', subAction: 'alert', message: '<img src=x> 현재 0', acknowledged: false };
    for (const [details, expected] of [[{current:0,minimum:5},'zero'], [{current:2,minimum:5},'low'],
      [{current:5,minimum:5},''], [{current:null,minimum:5},''], [{current:'0',minimum:5},''], [{minimum:5},''], [{current:0,minimum:NaN},'']]) {
      const input = {...log, details}, before = JSON.stringify(input);
      assert.equal(e.page.stockLogSeverity(input), expected);
      const html = e.page.renderLogRow(input);
      assert.ok(html.includes('&lt;img')); assert.ok(!html.includes('<img'));
      assert.equal(html.includes('log-stock-label'), !!expected);
      assert.equal(JSON.stringify(input), before);
    }
    assert.equal(e.page.stockLogSeverity({...log, action:'supplementStock', details:{current:0,minimum:5}}), '');
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('V2 retains action targets, moves only office blocker, formats quantities and calendar states', async () => {
  const e = await mainV2Fixture();
  try {
    const root = e.document;
    assert.equal(root.querySelectorAll('.log-office-strip').length, 1);
    assert.equal(root.querySelectorAll('.log-blocker-area .alert-card-blocker').length, 0);
    assert.equal(root.querySelector('.log-office-strip [data-jump]').dataset.jump, 'main');
    assert.equal(root.querySelectorAll('[data-log-act="ackAll"]').length, 2);
    assert.equal(root.querySelectorAll('.log-more-menu[hidden]').length, 2);
    assert.equal(root.querySelector('.log-ack-done').textContent, '확인됨');
    assert.equal(root.querySelector('.main-production-quantity strong').textContent, '15');
    assert.ok(root.querySelector('.main-production-card').textContent.includes('1,250'));
    assert.equal(root.querySelectorAll('.main-meat-need').length, 3); // 기존 노른자 제외 정책 유지
    assert.equal(root.querySelectorAll('.cal-cell-today .cal-today-label').length, 1);
    const overdue = e.page.renderCalendarCell('2026-09-11', e.today, [], {});
    assert.match(overdue, /cal-cell-overdue/); assert.match(overdue, /미처리/);
    assert.ok(root.querySelector('.cal-tag-schedule').textContent.startsWith('입고 · '));
    assert.equal(e.state.writes.length, 0);
  } finally { await e.cleanup(); }
});

test('V2 dropdown toggles, Escape and outside clicks close it, and rerender removes listeners', async () => {
  const e = await mainV2Fixture();
  try {
    const toggle = e.document.querySelector('.log-more-toggle');
    await e.fire(toggle);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(toggle.nextElementSibling.hidden, false);
    const esc = new e.document.defaultView.Event('keydown'); Object.defineProperty(esc, 'key', { value:'Escape' });
    e.document.dispatchEvent(esc);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    await e.fire(toggle);
    e.document.body.dispatchEvent(new e.document.defaultView.Event('click', { bubbles:true }));
    assert.equal(toggle.nextElementSibling.hidden, true);
    await e.fire(toggle);
    e.page.installV2Fixture(e.data);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(e.document.querySelector('.log-more-toggle').getAttribute('aria-expanded'), 'false');
  } finally { await e.cleanup(); }
});
