import {markFieldsSaved,hasChanged,canLeavePage} from '../utils/formDraft.js';
import {registerModalDismiss} from '../utils/modalManager.js';
import {currentUserRole} from '../app.js';
import {saveRequest,watchRequests,requestActor,stockInRequest,watchRequestEvents} from '../services/supplementRequests.js';
import {requestStatuses,requestDisplayStatus,stockOperationId,canReopenRequest} from '../services/supplementRequestLogic.js';
import {getTodayKST} from '../utils/date.js';
import {getPageContext,registerPageCleanup} from '../utils/pageLifecycle.js';

const actionLabels={create:'신청 생성',editItems:'품목 수정',editNote:'메모 수정',changeRequest:'변경 요청',start:'준비 시작',adjustQty:'수량 조정',complete:'입고 요청',cancel:'취소',reopen:'다시 신청',stockIn:'입고'};
export const matchesRequestSearch=(name,unit,query)=>query.trim().toLocaleLowerCase().split(/\s+/).every(word=>`${name} ${unit}`.toLocaleLowerCase().includes(word));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountSupplementRequests(host,{types,staffOptions,incoming,onStockChanged,getStockQty=()=>null,loadStocks}) {
  const writer=['admin','office'].includes(currentUserRole),page=getPageContext();
  const eventRows=new Map(), eventStops=new Map();
  let rows=[],visibleRows=[],editing=null,busy=false,disposed=false,filter='all',unsubscribe;
  const current=()=>!disposed&&host.isConnected&&(!page||page.isCurrent());
  const active=types.filter(t=>t.active!==false).sort((a,b)=>(a.sortOrder??999999)-(b.sortOrder??999999));
  host.classList.add('supplement-request-host');
  host.innerHTML=`<header class="supplement-request-header"><h3>신청 목록</h3><div class="supplement-request-actions"><label>상태 <select data-request-filter><option value="all">전체</option>${Object.entries(requestStatuses).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>${writer?'<button class="btn-primary" data-new>+ 새 신청</button>':''}</div></header>
    <p class="supplement-request-hint">최근 60일 영양제 신청</p><p role="status" data-request-status></p>
    ${writer?`<label class="supplement-request-actor">신청자 (취소·변경 요청 시 사용) <select data-list-staff><option value="">선택</option>${staffOptions}</select></label>${!staffOptions?'<p>등록된 사무 직원이 없습니다. 설정에서 사무 직원을 등록해주세요.</p>':''}`:''}<div data-request-list></div>`;
  let form=null,overlay=null,unregisterModal=null,selectedStaff='',actionStatus=null;
  const rowMessages=new Map(),itemPages=new Map();
  const status=message=>{
    if(!current())return;
    host.querySelector('[data-request-status]').textContent=message;
    if(actionStatus?.isConnected){actionStatus.textContent=message;rowMessages.set(actionStatus.closest('details').dataset.id,message);}
    if(form)form.querySelector('[data-form-status]').textContent=message;
  };
  function closeModal() {
    unregisterModal?.();unregisterModal=null;
    overlay?.remove();overlay=null;form=null;editing=null;
  }
  async function requestClose() {
    if(busy||!form)return;
    if([...form.querySelectorAll('[data-type],[name="staff"],[name="note"]')].some(hasChanged)&&!await canLeavePage())return;
    closeModal();if(current())renderList();
  }
  function fillForm(row=null) {
    if(!writer||busy||form)return;
    editing=row;
    overlay=document.createElement('div');overlay.className='modal-overlay supplement-request-overlay';
    overlay.innerHTML=`<form class="modal-box supplement-request-modal" data-request-form role="dialog" aria-modal="true" aria-label="영양제 신청 작성">
      <h3 class="modal-title">${row?'신청 수정':'새 영양제 신청'}</h3>
      <div class="supplement-request-body"><label>품목 검색 <input type="search" data-search placeholder="레시피명 또는 단위 (예: 치킨 60)"></label>
      <div class="supplement-workspace supplement-request-workspace"><aside class="supplement-picker"><div class="supplement-panel-heading"><strong>제품 선택</strong><span>입력 수량은 유지됩니다</span></div><select class="supplement-mobile-picker" data-group-select aria-label="신청할 제품"></select><div class="supplement-picker-grid" data-request-picker></div></aside><div class="supplement-request-units"><div data-request-items></div><p data-empty-search hidden>검색 결과가 없습니다.</p></div></div>
      <details class="supplement-selected-review"><summary data-total></summary><ul data-selected-review></ul></details><div class="supplement-request-meta">
      <label>신청자 <select name="staff" required><option value="">선택</option>${staffOptions}</select></label>
      ${!staffOptions?'<p>등록된 사무 직원이 없습니다. 설정에서 사무 직원을 등록해주세요.</p>':''}
      <label>메모 <textarea name="note" maxlength="500" rows="1"></textarea></label></div></div>
      <footer class="supplement-request-footer"><p role="status" data-form-status></p><div class="modal-actions"><button class="btn-secondary" type="button" data-close>닫기</button><button class="btn-primary" type="submit">신청 저장</button></div></footer></form>`;
    document.body.appendChild(overlay);form=overlay.querySelector('form');
    unregisterModal=registerModalDismiss(closeModal);
    const options=[...active];
    for(const i of row?.items||[])if(!options.some(t=>t.id===i.supplementTypeId))options.push({id:i.supplementTypeId,...i});
    const groups=new Map();
    for(const t of options){const key=t.recipeId||t.recipeName||t.name;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t);}
    const groupList=[...groups.values()];
    let selectedGroup=Math.max(0,groupList.findIndex(group=>group.some(t=>row?.items.some(i=>i.supplementTypeId===t.id&&i.qty>0))));
    form.querySelector('[data-request-picker]').innerHTML=groupList.map((group,index)=>`<button type="button" class="supplement-pick" data-pick-group="${index}" title="${esc(group[0].recipeName||group[0].name)}"><span>${esc(group[0].recipeName||group[0].name)}</span><small data-count></small></button>`).join('');
    form.querySelector('[data-group-select]').innerHTML=groupList.map((group,index)=>`<option value="${index}">${esc(group[0].recipeName||group[0].name)}</option>`).join('');
    form.querySelector('[data-request-items]').innerHTML=groupList.map((group,index)=>`<section class="supplement-request-group" data-group="${index}"><div class="supplement-panel-heading"><strong>${esc(group[0].recipeName||group[0].name)}</strong><span>${group.length}품목</span></div><table class="data-table"><thead><tr><th>생산 단위</th><th>현재 재고</th><th>신청 수량(봉)</th></tr></thead><tbody>${group.map(t=>{
      const stock=getStockQty(t.id);
      return `<tr data-item><td>${esc(t.unit)}</td><td data-stock-type="${esc(t.id)}">${loadStocks?'조회 중':stock===null?'재고 정보 없음':`${esc(stock)}봉`}</td><td><input aria-label="${esc(t.recipeName||t.name)} ${esc(t.unit)} 개수" data-type="${esc(t.id)}" type="number" min="0" max="999" step="1" value="${esc(row?.items.find(i=>i.supplementTypeId===t.id)?.qty||0)}"></td></tr>`;
    }).join('')}</tbody></table></section>`).join('');
    form.querySelector('[name="note"]').value=row?.note||'';
    form.querySelector('[name="staff"]').value=selectedStaff;
    function updateView() {
      const query=form.querySelector('[data-search]').value;let count=0,total=0;
      const selected=[],matchedGroups=[];
      for(const group of form.querySelectorAll('[data-group]')){
        let entered=0,matched=0;
        for(const tr of group.querySelectorAll('[data-item]')){
          const input=tr.querySelector('input'),t=options.find(t=>t.id===input.dataset.type),qty=Number(input.value);
          if(qty>0){entered++;count++;total+=qty;selected.push(`<li><span>${esc(t.recipeName||t.name)} / ${esc(t.unit)}</span><strong>${esc(qty)}봉</strong></li>`);}
          tr.hidden=!matchesRequestSearch(t.recipeName||t.name,t.unit,query);if(!tr.hidden)matched++;
        }
        const index=Number(group.dataset.group),button=form.querySelector(`[data-pick-group="${index}"]`);
        button.hidden=!matched;button.querySelector('[data-count]').textContent=entered?`${entered} 입력`:'';
        const option=form.querySelector('[data-group-select]').options[index];option.hidden=!matched;option.disabled=!matched;
        if(matched)matchedGroups.push(index);
      }
      if(!matchedGroups.includes(selectedGroup))selectedGroup=matchedGroups[0]??-1;
      for(const group of form.querySelectorAll('[data-group]')){
        const chosen=Number(group.dataset.group)===selectedGroup;
        group.hidden=!chosen;
        form.querySelector(`[data-pick-group="${group.dataset.group}"]`).setAttribute('aria-pressed',String(chosen));
      }
      form.querySelector('[data-group-select]').value=String(selectedGroup);
      form.querySelector('[data-total]').textContent=`선택 ${count}품목 · 합계 ${total}봉`;
      form.querySelector('[data-selected-review]').innerHTML=selected.join('')||'<li>신청할 수량을 입력해주세요.</li>';
      form.querySelector('[data-empty-search]').hidden=matchedGroups.length>0;
    }
    form.addEventListener('invalid',e=>{
      if(e.target.matches('[data-type]')){
        form.querySelector('[data-search]').value='';
        selectedGroup=Number(e.target.closest('[data-group]').dataset.group);updateView();
      }
    },true);
    form.addEventListener('input',updateView);
    form.addEventListener('click',e=>{const button=e.target.closest('[data-pick-group]');if(button&&!busy){selectedGroup=Number(button.dataset.pickGroup);updateView();}});
    form.querySelector('[data-group-select]').addEventListener('change',e=>{if(!busy){selectedGroup=Number(e.target.value);updateView();}});
    form.querySelector('[name="staff"]').addEventListener('change',e=>{selectedStaff=e.target.value;host.querySelector('[data-list-staff]').value=selectedStaff;});
    form.querySelector('[data-close]').addEventListener('click',requestClose);
    overlay.addEventListener('click',e=>{if(e.target===overlay)requestClose();});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();requestClose();}});
    form.addEventListener('submit',e=>{e.preventDefault();perform(async()=>{
      const by=actor(),items=[...form.querySelectorAll('[data-type]')].filter(el=>Number(el.value)!==0).map(el=>{
        const old=editing?.items.find(i=>i.supplementTypeId===el.dataset.type),t=active.find(t=>t.id===el.dataset.type);
        return {...(old||{supplementTypeId:t.id,recipeId:t.recipeId,recipeName:t.recipeName||t.name,unit:Number(t.unit)}),qty:Number(el.value)};
      });
      await saveRequest(editing,editing?'editItems':'create',{items,note:form.querySelector('[name="note"]').value},by);
      if(current())closeModal();
    });});
    updateView();markFieldsSaved(form);markFieldsSaved(overlay);
    form.querySelector('[data-search]').focus();
    // Refresh display-only quantities without replacing any draft inputs or
    // changing the transaction baseline/stock-in command path.
    if(loadStocks){
      const openedForm=form;
      Promise.resolve().then(loadStocks).then(stocks=>{
        if(!current()||form!==openedForm)return;
        for(const cell of form.querySelectorAll('[data-stock-type]')){
          const stock=stocks.find(row=>row.id===cell.dataset.stockType||row.supplementTypeId===cell.dataset.stockType);
          cell.textContent=stock?`${Number(stock.currentQty||0)}봉`:'재고 정보 없음';
        }
      }).catch(error=>{
        if(!current()||form!==openedForm)return;
        form.querySelectorAll('[data-stock-type]').forEach(cell=>cell.textContent='조회 실패');
        status(`현재 재고를 불러오지 못했습니다: ${error.message}`);
      });
    }
  }
  function actor() {
    const name=form?.querySelector('[name="staff"]').value||selectedStaff;
    if(!name)throw Error('신청자(직원 표시명)를 선택해주세요.');
    return requestActor(name);
  }
  async function perform(task) {
    if(busy)return;
    busy=true;
    const controls=[...host.querySelectorAll('button,input,select,textarea'),...(form?[...form.querySelectorAll('button,input,select,textarea')]:[])];
    const disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);
    let succeeded=false;
    try {await task();succeeded=true;status('저장했습니다.');}
    catch(error){
      status(error.message||String(error));
      if(error.code==='supplement-request-conflict'&&current()){unsubscribe?.();subscribe();}
    }
    finally {busy=false;if(current()){controls.forEach((el,i)=>el.disabled=disabled[i]);if(succeeded||!isDrafting())renderList();}}
  }
  function renderList() {
    if(!current())return;
    const target=host.querySelector('[data-request-list]');
    const open=new Set([...target.querySelectorAll('.supplement-request-row[open]')].map(el=>el.dataset.id));
    visibleRows=rows;
    for(const row of rows)itemPages.set(row.id,Math.min(itemPages.get(row.id)||0,Math.max(0,Math.ceil(row.items.length/10)-1)));
    target.innerHTML=rows.filter(r=>filter==='all'||r.status===filter).map(r=>`<details class="supplement-request-row" data-id="${esc(r.id)}"><summary><span class="supplement-request-badge" data-state="${esc(r.status)}">${esc(requestDisplayStatus(r))}</span><span class="supplement-request-summary">${esc(r.requestedBy?.name)} · ${esc(r.requestedAt?.toDate?.().toLocaleString('ko-KR')||'저장 중')} · ${r.items.length}품목 · ${esc(r.items[0]?.recipeName)} ${esc(r.items[0]?.unit)}${r.items.length>1?` 외 ${r.items.length-1}품목`:''}</span><span class="supplement-request-actions">${writer&&r.status==='requested'?'<button class="btn-secondary" data-action="edit">수정</button><button class="btn-secondary" data-action="cancel">취소</button>':writer&&r.status==='done'?`<button class="btn-primary" data-action="stockIn" ${r.stockInCompletedAt?'disabled':''}>${r.stockInCompletedAt?'입고 완료':requestDisplayStatus(r)==='일부 입고'?'남은 품목 입고':'전체 입고'}</button>`:'<span>상세</span>'}</span></summary><div class="supplement-request-detail"><p role="status" data-row-status>${esc(rowMessages.get(r.id)||'')}</p>
      <div class="supplement-request-items-heading"><strong>신청 품목 ${r.items.length}개 · ${r.items.reduce((sum,i)=>sum+Number(i.qty),0)}봉</strong><span>입고 ${r.items.filter(i=>Object.hasOwn(r.stockIn||{},i.supplementTypeId)).length}/${r.items.length}품목</span></div><ul class="supplement-request-item-grid">${r.items.map((i,index)=>`<li data-detail-item="${index}" ${Math.floor(index/10)===(itemPages.get(r.id)||0)?'':'hidden'}>${esc(i.recipeName)} / ${esc(i.unit)}: ${esc(i.qty)}봉 ${r.stockIn?.[i.supplementTypeId]?'(입고됨)':''}</li>`).join('')}</ul>${r.items.length>10?`<nav class="supplement-item-pages" aria-label="신청 품목 페이지">${Array.from({length:Math.ceil(r.items.length/10)},(_,index)=>`<button type="button" class="btn-secondary" data-item-page="${index}" aria-pressed="${index===(itemPages.get(r.id)||0)}">${index+1}</button>`).join('')}</nav>`:''}
      ${r.status==='done'&&!canReopenRequest(r)?'<p>입고 기록이 있어 신청 상태로 되돌릴 수 없습니다.</p>':''}
      ${[['메모',r.note],['변경 요청',r.changeRequestNote],['처리자 메모',r.handlerNote]].filter(([,value])=>value).map(([label,value])=>`<p>${label}: ${esc(value)}</p>`).join('')}
      <details class="supplement-request-history"><summary>변경 이력 ${(eventRows.get(r.id)||[]).length}건</summary><ol>${(eventRows.get(r.id)||[]).map(h=>`<li>${esc(h.at?.toDate?.().toLocaleString('ko-KR')||'')} ${esc(h.by?.name)} · ${esc(actionLabels[h.action]||'이력')} ${esc(h.note||'')}${h.itemsAfter?`<ul>${h.itemsAfter.map(i=>`<li>${esc(i.recipeName)} / ${esc(i.unit)}: ${esc(i.qty)}봉</li>`).join('')}</ul>`:''}</li>`).join('')}</ol></details>
      ${writer&&r.status==='preparing'?`<label>변경 요청 <textarea maxlength="500" data-change>${esc(r.changeRequestNote)}</textarea></label><button class="btn-secondary" data-action="changeRequest">변경 요청 저장</button>`:''}
      ${writer&&r.status==='done'?`
        ${!r.stockInCompletedAt?`<div data-stock-form hidden><label>입고일 <input type="date" data-date value="${getTodayKST()}"></label><label>담당자 <select data-staff><option value="">선택</option>${staffOptions}</select></label><label>처리 구분 <select data-kind><option value="receipt">실제 입고</option></select></label><p>이미 입고된 품목은 제외하고 남은 품목을 요청 수량대로 입고합니다. 품목별 수량 확인이 표시될 수 있습니다.</p><button class="btn-secondary" data-action="stockSave">전체 입고 실행</button></div>`:''}`:''}
      ${writer&&r.status==='requested'?'<div data-cancel-form hidden><p>신청을 취소합니다.</p><button class="btn-secondary" data-action="cancelSave">취소 확정</button></div>':''}</div></details>`).join('')||'<p>신청이 없습니다.</p>';
    if(busy)target.querySelectorAll('button').forEach(b=>b.disabled=true);
    target.querySelectorAll('.supplement-request-row').forEach(el=>{el.open=open.has(el.dataset.id);});
  }
  host.querySelector('[data-new]')?.addEventListener('click',()=>{if(!busy)fillForm();});
  host.querySelector('[data-list-staff]')?.addEventListener('change',e=>{selectedStaff=e.target.value;});
  host.querySelector('[data-request-filter]').addEventListener('change',e=>{
    if(busy||isDrafting()){
      e.target.value=filter;
      status('입력 중인 작업을 저장하거나 닫은 뒤 상태 필터를 변경해주세요.');
      return;
    }
    filter=e.target.value;renderList();
  });
  host.querySelector('[data-request-list]').addEventListener('click',e=>{
    const pager=e.target.closest('[data-item-page]');
    if(pager&&!busy){
      const detail=pager.closest('.supplement-request-row'),index=Number(pager.dataset.itemPage);
      itemPages.set(detail.dataset.id,index);
      detail.querySelectorAll('[data-detail-item]').forEach(el=>el.hidden=Math.floor(Number(el.dataset.detailItem)/10)!==index);
      detail.querySelectorAll('[data-item-page]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.itemPage)===index)));
      return;
    }
    const button=e.target.closest('[data-action]');if(!button||busy)return;
    const detail=button.closest('details'),row=visibleRows.find(r=>r.id===detail.dataset.id),action=button.dataset.action;
    e.preventDefault();actionStatus=detail.querySelector('[data-row-status]');
    if(action==='edit'){fillForm(row);return;}
    detail.open=true;
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
    return !!form||list.contains(document.activeElement)||[...list.querySelectorAll('[data-stock-form],[data-cancel-form]')].some(el=>!el.hidden)
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
  const dispose=()=>{closeModal();disposed=true;unsubscribe?.();for(const stop of eventStops.values())stop();eventStops.clear();};
  const unregister=registerPageCleanup(dispose);
  return ()=>{dispose();unregister();};
}
