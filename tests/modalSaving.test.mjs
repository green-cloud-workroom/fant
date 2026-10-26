import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {lockModalWhileSaving} from '../src/utils/modalSaving.js';

test('modal lock restores original states and values without unlocking a replacement modal', () => {
  const previous = globalThis.document;
  const {document} = parseHTML('<html><body><div id="modalOverlay" aria-busy="false"><div class="modal-box"><input value="17"><select><option>담당</option></select><textarea>메모</textarea><button>저장</button><button disabled>기존 비활성</button></div></div></body></html>');
  globalThis.document = document;
  try {
    const old = document.getElementById('modalOverlay');
    const input = old.querySelector('input');
    const unlock = lockModalWhileSaving();
    assert.equal(old.getAttribute('aria-busy'), 'true');
    assert.ok(input.closest('[inert]'));
    for (const field of old.querySelectorAll('input,select,textarea,button')) assert.ok(field.hasAttribute('disabled'));
    assert.match(old.querySelector('[role="status"]').textContent, /저장 중/);
    old.remove();
    document.body.innerHTML = '<div id="modalOverlay"><div class="modal-box" inert><input disabled value="99"></div></div>';
    unlock();
    assert.equal(input.value, '17');
    assert.equal(old.querySelector('textarea').value, '메모');
    assert.equal(old.getAttribute('aria-busy'), 'false');
    assert.equal(old.querySelector('.modal-box').hasAttribute('inert'), false);
    assert.equal(input.hasAttribute('disabled'), false);
    assert.equal(old.querySelectorAll('button')[1].hasAttribute('disabled'), true);
    assert.equal(old.querySelector('[role="status"]'), null);
    assert.ok(document.querySelector('input').hasAttribute('disabled'));
    assert.ok(document.querySelector('.modal-box').hasAttribute('inert'));
    assert.equal(document.querySelector('input').value, '99');
  } finally { globalThis.document = previous; }
});

test('equipment modal restores pre-existing inert state and does not require a modal', () => {
  const previous = globalThis.document;
  const {document} = parseHTML('<html><body><div id="equipmentModalOverlay"><div class="modal-box" inert><input value="2"></div></div></body></html>');
  globalThis.document = document;
  try {
    const unlock = lockModalWhileSaving();
    assert.equal(document.getElementById('equipmentModalOverlay').getAttribute('aria-busy'), 'true');
    unlock();
    assert.ok(document.querySelector('.modal-box').hasAttribute('inert'));
    assert.equal(document.querySelector('input').hasAttribute('disabled'), false);
    assert.equal(document.getElementById('equipmentModalOverlay').hasAttribute('aria-busy'), false);
    document.body.innerHTML = '';
    lockModalWhileSaving()();
  } finally { globalThis.document = previous; }
});
