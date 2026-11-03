import {currentUserRole} from '../app.js';
import {saveRequest,watchRequests,requestActor,stockInRequest,watchRequestEvents} from '../services/supplementRequests.js';
import {requestStatuses,stockOperationId,canReopenRequest} from '../services/supplementRequestLogic.js';
import {getTodayKST} from '../utils/date.js';
import {getPageContext,registerPageCleanup} from '../utils/pageLifecycle.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountSupplementRequests(host,{types,staffOptions,incoming,onStockChanged}) {
  const writer=['admin','office'].includes(currentUserRole),page=getPageContext();
  const eventRows=new Map(), eventStops=new Map();
  let rows=[],visibleRows=[],editing=null,busy=false,disposed=false,filter='all',unsubscribe;
  const current=()=>!disposed&&host.isConnected&&(!page||page.isCurrent());
  const active=types.filter(t=>t.active!==false).sort((a,b)=>(a.sortOrder??999999)-(b.sortOrder??999999));
  host.innerHTML=`<p>최근 60일 영양제 신청</p><p role="status" data-request-status></p>
    ${writer?`<form data-request-form><h3 data-form-title>영양제 신청</h3><label>신청자 (직원 표시명) <select name="staff" required><option value="">선택</option>${staffOptions}</select></label>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>레시피 / 단위</th><th>개수(봉)</th></tr></thead><tbody data-request-items></tbody></table></div>
    <label>메모 <textarea name="note" maxlength="500"></textarea></label><p><button class="btn-primary" type="submit">저장</button> <button class="btn-secondary" type="button" data-new>새 신청</button></p></form>`:''}
    <label>상태 <select data-request-filter><option value="all">전체</option>${Object.entries(requestStatuses).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><div data-request-list></div>`;
  const status=message=>{if(current())host.querySelector('[data-request-status]').textContent=message;};
  const form=host.querySelector('form');
  function fillForm(row=null) {
    editing=row;
    if(!form)return;
    form.querySelector('[data-form-title]').textContent=row?'신청 수정':'영양제 신청';
    const options=[...active];
    // Keep snapshot-only/deactivated items visible when editing; never silently drop them.
    for(const i of row?.items||[])if(!options.some(t=>t.id===i.supplementTypeId))options.push({id:i.supplementTypeId,...i});
    form.querySelector('[data-request-items]').innerHTML=options.map(t=>{
      const item=row?.items.find(i=>i.supplementTypeId===t.id);
      return `<tr><td>${esc(t.recipeName||t.name)} / ${esc(t.unit)}</td><td><input aria-label="${esc(t.recipeName||t.name)} ${esc(t.unit)} 개수" data-type="${esc(t.id)}" type="number" min="0" max="999" step="1" value="${item?.qty||0}"></td></tr>`;
    }).join('');
    form.querySelector('[name="note"]').value=row?.note||'';
  }
  function actor() {
    const name=form?.querySelector('[name="staff"]').value;
    if(!name)throw Error('신청자(직원 표시명)를 선택해주세요.');
    return requestActor(name);
  }
  async function perform(task) {
    if(busy)return;
    busy=true;host.querySelectorAll('button').forEach(b=>b.disabled=true);
    try {await task();status('저장했습니다.');}
    catch(error){
      status(error.message||String(error));
      if(error.code==='supplement-request-conflict'&&current()){unsubscribe?.();subscribe();}
    }
    finally {busy=false;if(current()){host.querySelectorAll('button').forEach(b=>b.disabled=false);renderList();}}
  }
  function renderList() {
    if(!current())return;
    const target=host.querySelector('[data-request-list]');
    const open=new Set([...target.querySelectorAll('details[open]')].map(el=>el.dataset.id));
    visibleRows=rows;
    target.innerHTML=rows.filter(r=>filter==='all'||r.status===filter).map(r=>`<details data-id="${esc(r.id)}"><summary>${esc(requestStatuses[r.status]||r.status)} · ${esc(r.requestedBy?.name)} · ${esc(r.requestedAt?.toDate?.().toLocaleString('ko-KR')||'저장 중')} · ${r.items.length}품목</summary>
      <ul>${r.items.map(i=>`<li>${esc(i.recipeName)} / ${esc(i.unit)}: ${i.qty}봉 ${r.stockIn?.[i.supplementTypeId]?'(입고됨)':''}</li>`).join('')}</ul>
      ${r.status==='done'&&!canReopenRequest(r)?'<p>입고 기록이 있어 신청 상태로 되돌릴 수 없습니다.</p>':''}
      <p>메모: ${esc(r.note)}</p><p>변경 요청: ${esc(r.changeRequestNote)}</p><p>처리자 메모: ${esc(r.handlerNote)}</p>
      <ol>${(eventRows.get(r.id)||[]).map(h=>`<li>${esc(h.at?.toDate?.().toLocaleString('ko-KR')||'')} ${esc(h.by?.name)} · ${esc(h.action)} ${esc(h.note||'')}${h.itemsAfter?`<ul>${h.itemsAfter.map(i=>`<li>${esc(i.recipeName)} / ${esc(i.unit)}: ${i.qty}봉</li>`).join('')}</ul>`:''}</li>`).join('')}</ol>
      ${writer&&r.status==='requested'?'<button data-action="edit">수정</button> <button data-action="cancel">취소</button>':''}
      ${writer&&r.status==='preparing'?`<label>변경 요청 <textarea maxlength="500" data-change>${esc(r.changeRequestNote)}</textarea></label><button data-action="changeRequest">변경 요청 저장</button>`:''}
      ${writer&&r.status==='done'?`<button data-action="stockIn" ${r.stockInCompletedAt?'disabled':''}>${r.stockInCompletedAt?'입고 완료':'전체 입고'}</button>
        ${!r.stockInCompletedAt?`<div data-stock-form hidden><label>입고일 <input type="date" data-date value="${getTodayKST()}"></label><label>담당자 <select data-staff><option value="">선택</option>${staffOptions}</select></label><label>처리 구분 <select data-kind><option value="receipt">실제 입고</option></select></label><p>이미 입고된 품목은 제외하고 남은 품목을 요청 수량대로 입고합니다. 품목별 수량 확인이 표시될 수 있습니다.</p><button data-action="stockSave">전체 입고 실행</button></div>`:''}`:''}
      ${writer&&r.status==='requested'?'<div data-cancel-form hidden><p>신청을 취소합니다.</p><button data-action="cancelSave">취소 확정</button></div>':''}</details>`).join('')||'<p>신청이 없습니다.</p>';
    if(busy)target.querySelectorAll('button').forEach(b=>b.disabled=true);
    target.querySelectorAll('details').forEach(el=>{el.open=open.has(el.dataset.id);});
  }
  fillForm();
  form?.addEventListener('submit',e=>{e.preventDefault();perform(async()=>{
    const by=actor(),items=[...form.querySelectorAll('[data-type]')].filter(el=>Number(el.value)!==0).map(el=>{
      const old=editing?.items.find(i=>i.supplementTypeId===el.dataset.type),t=active.find(t=>t.id===el.dataset.type);
      return {...(old||{supplementTypeId:t.id,recipeId:t.recipeId,recipeName:t.recipeName||t.name,unit:Number(t.unit)}),qty:Number(el.value)};
    });
    await saveRequest(editing,editing?'editItems':'create',{items,note:form.querySelector('[name="note"]').value},by);
    if(current())fillForm();
  });});
  host.querySelector('[data-new]')?.addEventListener('click',()=>{if(!busy)fillForm();});
  host.querySelector('[data-request-filter]').addEventListener('change',e=>{filter=e.target.value;renderList();});
  host.querySelector('[data-request-list]').addEventListener('click',e=>{
    const button=e.target.closest('[data-action]');if(!button||busy)return;
    const detail=button.closest('details'),row=visibleRows.find(r=>r.id===detail.dataset.id),action=button.dataset.action;
    if(action==='edit'){fillForm(row);form.scrollIntoView?.();return;}
    if(action==='cancel'){detail.querySelector('[data-cancel-form]').hidden=false;return;}
    if(action==='stockIn'){detail.querySelector('[data-stock-form]').hidden=false;return;}
    const change=detail.querySelector('[data-change]')?.value;
    const date=detail.querySelector('[data-date]')?.value,staff=detail.querySelector('[data-staff]')?.value;
    perform(async()=>{
      if(action==='stockSave') {
        if(!date||!staff)throw Error('입고일과 담당자를 선택해주세요.');
        await stockInRequest(row,requestActor(staff),(item,extraWrites)=>{
          if(!current())throw Error('화면이 변경되어 입고를 중단했습니다. 남은 품목은 다시 실행해주세요.');
          return incoming(item,{date,staffName:staff,extraWrites,selection:{kind:'receipt',reason:'',cancelOf:null,operationId:stockOperationId(row.id,item.supplementTypeId)}});
        });
        onStockChanged();
      } else await saveRequest(row,action==='cancelSave'?'cancel':'changeRequest',{changeRequestNote:change},actor());
    });
  });
  function isDrafting() {
    const list=host.querySelector('[data-request-list]');
    return list.contains(document.activeElement)||[...list.querySelectorAll('[data-stock-form],[data-cancel-form]')].some(el=>!el.hidden)
      ||[...list.querySelectorAll('[data-change]')].some(el=>el.value!==(visibleRows.find(r=>r.id===el.closest('details').dataset.id)?.changeRequestNote||''));
  }
  function subscribe() { unsubscribe=watchRequests(next=>{
    rows=next;
    for(const [id,stop] of eventStops)if(!rows.some(r=>r.id===id)){stop();eventStops.delete(id);eventRows.delete(id);}
    for(const row of rows)if(!eventStops.has(row.id))eventStops.set(row.id,watchRequestEvents(row.id,events=>{
      eventRows.set(row.id,events);if(!busy&&!isDrafting())renderList();
    },error=>status(`신청 이력을 읽지 못했습니다: ${error.message}`)));

    // Keep the displayed version while an inline action is being edited.
    // Its transaction must reject stale input, rather than silently rebase it.
    const drafting=isDrafting();
    if(!busy&&!drafting)renderList();
    else if(!busy)status('목록이 변경되었습니다. 입력 중인 작업은 저장 시 상태·버전을 다시 확인합니다.');
  },error=>status(`신청 목록을 읽지 못했습니다: ${error.message}`)); }
  subscribe();
  const dispose=()=>{disposed=true;unsubscribe?.();for(const stop of eventStops.values())stop();eventStops.clear();};
  const unregister=registerPageCleanup(dispose);
  return ()=>{dispose();unregister();};
}
