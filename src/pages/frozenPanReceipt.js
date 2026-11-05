import {escapeHtml as h} from '../utils/html.js';
import {sectionName} from './frozenPanDesk.js';

// Each choice mounts the original receipt form and its save handler.
// Drafts belong to the current visit and are never written to the stock store.
export function openPanReceipt({recipes, drafts, showModal, openBread, openTender}) {
  let selected = null;
  const byGroup = ['주식','간식'].map(group=>[group,recipes.filter(r=>sectionName(r.displayName)===group)]);

  function capture() {
    if (!selected) return;
    const field = id=>document.getElementById(id)?.value ?? '';
    const kind = field('movement_kind') || 'receipt';
    const draft = drafts.get(selected.id) || {};
    Object.assign(draft,{qty:field('m_qty'),date:field('m_date'),staff:field('m_staff'),kind});
    draft[kind === 'test' ? 'testNote' : 'note'] = field('m_note');
    const dateField=document.getElementById('m_date');
    if (draft.qty || draft.staff || draft.note || draft.testNote || kind==='test' || draft.date!==dateField?.defaultValue) drafts.set(selected.id,draft);
    else drafts.delete(selected.id);
  }
  function picker() {
    return '<div class="pan-pick"><h4>입고할 품목</h4>'+byGroup.filter(([,rows])=>rows.length)
      .map(([group,rows])=>'<section><h5>'+group+' <small>'+rows.length+'종</small></h5><div>'
      +rows.map(r=>'<button type="button" data-recipe="'+h(r.id)+'" aria-pressed="'+(selected?.id===r.id)+'">'
        +h(r.displayName)+(drafts.has(r.id)?'<small>초안</small>':'')+'</button>').join('')+'</div></section>').join('')
      +(!recipes.length?'<p>입고 가능한 동결건조 레시피가 없습니다.</p>':'')+'</div>';
  }
  function render(recipe, focusChoice = false) {
    selected = recipe;
    if (recipe) (recipe.requiresSeparation ? openBread : openTender)();
    else showModal('');
    const overlay = document.getElementById('modalOverlay');
    const box = overlay.querySelector('.modal-box');
    overlay.classList.add('pan-receipt-overlay');
    box.classList.add('pan-receipt-box');
    box.setAttribute('role','dialog');
    box.setAttribute('aria-modal','true');
    box.setAttribute('aria-labelledby','panReceiptTitle');
    const form = document.createElement('div');
    form.className = 'pan-receipt-form';
    while (box.firstChild) form.appendChild(box.firstChild);
    box.innerHTML = '<header><div><h3 id="panReceiptTitle">동결판 재고 입고</h3></div><button type="button" class="btn-secondary" data-dismiss aria-label="입고 닫기">닫기</button></header>'
      +'<div class="pan-receipt-body">'+picker()+'</div>';
    box.querySelector('.pan-receipt-body').appendChild(form);
    if (recipe) {
      box.classList.add('has-choice');
      const selector = form.querySelector('#m_recipe');
      selector.value = recipe.displayName;
      selector.closest('.form-group').hidden=true;
      const title = form.querySelector('.modal-title');
      title.textContent=recipe.displayName;
      title.insertAdjacentHTML('afterend','<p class="pan-form-kind">'+(recipe.requiresSeparation?'빵판 입고 · 개':'텐더동결 입고 · 판')+'</p>');
      form.prepend(title);
      title.insertAdjacentHTML('beforebegin','<button type="button" data-repick class="btn-secondary pan-repick">‹ 품목 변경</button>');
      const draft=drafts.get(recipe.id);
      const movement=form.querySelector('#movement_kind');
      const note=form.querySelector('#m_note');
      const quantity=form.querySelector('#m_qty');
      quantity.required=true;
      form.querySelector('.btn-primary').addEventListener('click',event=>{
        if (!quantity.reportValidity()) { event.preventDefault(); event.stopImmediatePropagation(); }
      },true);
      if (movement) {
        // Keep the native movement binding, including reason validation and the test-only path.
        movement.closest('.form-group').hidden=true;
        const toggle=document.createElement('button');
        toggle.type='button';toggle.className='pan-test-toggle';
        form.querySelector('.modal-actions').prepend(toggle);
        const setMode=kind=>{
          movement.value=kind;
          movement.dispatchEvent(new Event('change',{bubbles:true}));
          toggle.textContent=kind==='test'?'실제 입고로 돌아가기':'테스트 기록';
          const save=form.querySelector('#btnSaveBreadPanIncoming');
          save.textContent=kind==='test'?'테스트 기록 저장':'입고 등록';
        };
        setMode(draft?.kind==='test'?'test':'receipt');
        toggle.onclick=()=>{
          capture();
          const next=movement.value==='test'?'receipt':'test';
          setMode(next);
          note.value=drafts.get(recipe.id)?.[next==='test'?'testNote':'note'] || '';
          capture();
        };
      } else form.querySelector('#btnSaveTenderIn').textContent='입고 등록';
      if (draft) {
        form.querySelector('#m_qty').value=draft.qty;
        form.querySelector('#m_date').value=draft.date;
        form.querySelector('#m_staff').value=draft.staff;
        note.value=draft[draft.kind==='test'?'testNote':'note'] || '';
      }
      form.querySelector('[data-repick]').onclick=()=>{capture();render(null,true);};
      form.addEventListener('input',capture);
      form.addEventListener('change',capture);
      form.querySelectorAll('.form-group').forEach(g=>{
        const label=g.querySelector('label'),field=g.querySelector('input,select');
        if (label && field) label.htmlFor=field.id;
      });
    } else {
      form.innerHTML='<p>왼쪽에서 입고할 품목을 선택하세요.</p>';
    }
    const dismiss=()=>window.closeModal();
    box.querySelector('[data-dismiss]').onclick=dismiss;
    box.querySelectorAll('[data-recipe]').forEach(btn=>btn.onclick=()=>{
      if (btn.dataset.recipe===selected?.id) return;
      const next=recipes.find(r=>r.id===btn.dataset.recipe);
      if (next) { capture(); render(next); }
    });
    overlay.addEventListener('keydown',event=>{
      if (overlay.getAttribute('aria-busy')==='true') return;
      if (event.key==='Escape') {event.preventDefault();dismiss();return;}
      if (event.key!=='Tab') return;
      const focusable=[...box.querySelectorAll('button,input,select')].filter(el=>!el.disabled&&el.getClientRects().length);
      const target=event.shiftKey?focusable[0]:focusable.at(-1);
      if (target && document.activeElement===target) {event.preventDefault();(event.shiftKey?focusable.at(-1):focusable[0]).focus();}
    });
    const initial=recipe
      ? (window.matchMedia?.('(max-width:700px)').matches?form.querySelector('[data-repick]'):form.querySelector('#m_qty'))
      : box.querySelector('[data-recipe]') || box.querySelector('[data-dismiss]');
    initial?.focus({preventScroll:!focusChoice});
  }
  render(null);
}
