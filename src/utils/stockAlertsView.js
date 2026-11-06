import {escapeHtml as h} from './html.js';
import {quantityText,unitText,staffError} from './staffText.js';
import {registerModalDismiss} from './modalManager.js';
import {getPageContext} from './pageLifecycle.js';
import {currentUser,currentUserRole,setCurrentMenu} from '../app.js';
import {sessionStore} from '../state/sessionStore.js';
import {createDisplayScope} from '../state/displayReads.js';
import {useSessionReads} from '../config/performanceFlags.js';
import {loadStockAlerts,syncStockAlerts,acknowledgeStockAlerts} from '../services/stockAlerts.js';
import {stockAlertKinds} from '../domain/stockAlerts.js';

export const stockAlertSummaryHtml = '<button type="button" class="stock-alert-summary" data-stock-alert-summary>⚠️ 부족재고 확인 중…</button>';
function updateSummaries(model) {
  const count=model.items.length,unseen=model.items.filter(i=>i.unseen).length;
  for(const node of document.querySelectorAll('[data-stock-alert-summary]')) {
    node.innerHTML=`<span>⚠️ 부족재고 <strong>${count}종</strong>${unseen?` · <b>미확인 ${unseen}종</b>`:''}${model.unknown.length?' · 수량 확인 필요':''}</span><span>목록 확인 ›</span>`;
    node.classList.toggle('stock-alert-summary--new',unseen>0);
  }
  const badge=document.getElementById('subLowStock');
  if(badge){badge.textContent=`⚠️ 부족재고 ${count}종${model.unknown.length?' · 수량 확인 필요':''}`;badge.classList.toggle('low-stock-warning',count>0);}
}
export async function mountStockAlertSummary() {
  const node=document.querySelector('[data-stock-alert-summary]');if(!node)return;
  node.onclick=()=>openStockAlerts();
  // The shell already observes these queries. Rendering a row must not start
  // another full server read; opening/acknowledging the modal still does.
  try{const model=await loadStockAlerts(useSessionReads('main')?createDisplayScope('shell'):undefined);if(node.isConnected)updateSummaries(model);}
  catch{if(node.isConnected)node.textContent='⚠️ 부족재고 조회 실패 · 눌러서 다시 확인';}
}
export async function openStockAlerts() {
  document.getElementById('stockAlertsOverlay')?.remove();
  const epoch=sessionStore.epoch,page=getPageContext();
  const overlay=document.createElement('div');overlay.id='stockAlertsOverlay';overlay.className='modal-overlay';
  overlay.innerHTML='<section class="modal-box stock-alert-modal" role="dialog" aria-modal="true" aria-labelledby="stockAlertTitle"><header><div><h3 id="stockAlertTitle">부족재고 확인</h3><p>품목별 현재 재고와 보충 필요 수량을 확인하세요.</p></div><button class="btn-secondary" data-stock-close>닫기</button></header><div data-stock-content role="status">현재 재고를 조회하고 있습니다…</div></section>';
  document.body.appendChild(overlay);
  let model,kind='',search='',busy=false,unregister;
  const current=()=>overlay.isConnected&&epoch===sessionStore.epoch&&(!page||page.isCurrent());
  const close=()=>{overlay.remove();unregister?.();};unregister=registerModalDismiss(close);
  overlay.querySelector('[data-stock-close]').onclick=close;
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape'&&!busy)close();});
  const visible=()=>model.items.filter(i=>(!kind||i.kind===kind)&&(!search||i.name.toLowerCase().includes(search.toLowerCase())));
  const refresh=async()=>{model=await syncStockAlerts();if(current()){updateSummaries(model);render();}};
  const acknowledge=async(items)=>{
    if(busy)return;busy=true;overlay.querySelectorAll('[data-stock-ack]').forEach(b=>b.disabled=true);
    let message='';
    try{model=await acknowledgeStockAlerts(items,currentUser?.email?.split('@')[0]||({admin:'대표',office:'사무실',production:'생산실'}[currentUserRole]),current);}
    catch(error){message=staffError(error);try{model=await loadStockAlerts();}catch{message+=' 최신 목록 조회도 실패했습니다. 창을 닫고 다시 확인해주세요.';}}
    finally{busy=false;if(current()){updateSummaries(model);render();overlay.querySelector('[data-stock-status]').textContent=message;}}
  };
  function render() {
    const items=visible(),unseen=items.filter(i=>i.unseen).length;
    overlay.querySelector('[data-stock-content]').innerHTML=`<div class="stock-alert-tools"><div class="stock-alert-filters">${[['','전체'],...Object.entries(stockAlertKinds)].map(([key,label])=>`<button class="btn-secondary ${kind===key?'selected':''}" data-stock-kind="${key}" aria-pressed="${kind===key}">${label}</button>`).join('')}</div><input data-stock-search aria-label="부족 품목 검색" placeholder="품목명 검색" value="${h(search)}"></div>
      <p class="stock-alert-caption">부족 ${model.items.length}종 · 표시 ${items.length}종 · 미확인 ${unseen}종${model.unknown.length?' · 수량 확인 필요 '+model.unknown.length+'종':''}</p>
      ${model.unknown.length?'<p role="alert">'+model.unknown.map(i=>h(i.name)).join(', ')+'의 수량을 확인하지 못해 부족 여부를 판정하지 않았습니다.</p>':''}
      <div class="stock-alert-table-wrap"><table class="stock-alert-table"><thead><tr><th>품목</th><th>현재</th><th>최소</th><th>부족</th><th>입고 예정</th><th>확인</th></tr></thead><tbody>${items.map(i=>`<tr><td><small>${h(stockAlertKinds[i.kind])}</small><strong>${h(i.name)}</strong><button class="stock-alert-link" data-stock-route="${h(i.route)}">재고 화면 ›</button></td><td data-label="현재" class="${i.current<=0?'stock-alert-empty':''}">${quantityText(i.current)}${h(i.unit)}</td><td data-label="최소">${quantityText(i.minimum)}${h(i.unit)}</td><td data-label="부족"><b>${quantityText(i.shortage)}${h(i.unit)}</b></td><td data-label="입고 예정">${i.schedules.length?i.schedules.map(s=>`${h(s.date)} · ${quantityText(s.orderedQty)}${h(unitText(s.orderedUnit))}`).join('<br>'):['supplement','part'].includes(i.kind)?'별도 신청·발주 확인':'등록 없음'}</td><td>${i.unseen?`<button class="btn-primary" data-stock-ack="${h(i.key)}">확인</button>`:'<span class="stock-alert-reviewed">확인 완료</span>'}</td></tr>`).join('')||'<tr><td colspan="6" class="stock-alert-none">'+(search||kind?'해당 품목이 없습니다.':'현재 부족한 품목이 없습니다.')+'</td></tr>'}</tbody></table></div>
      <footer><p>확인은 내용을 봤다는 표시입니다. 부족 상태와 재고 수량은 그대로 유지됩니다.</p><button class="btn-primary" data-stock-ack="all" ${unseen?'':'disabled'}>표시된 ${unseen}종 확인 완료</button></footer><p data-stock-status role="status"></p>`;
    overlay.querySelectorAll('[data-stock-kind]').forEach(b=>b.onclick=()=>{kind=b.dataset.stockKind;render();});
    overlay.querySelector('[data-stock-search]').oninput=event=>{const input=event.target,pos=input.selectionStart;search=input.value;render();const next=overlay.querySelector('[data-stock-search]');next.focus();next.setSelectionRange?.(pos,pos);};
    overlay.querySelectorAll('[data-stock-ack]').forEach(b=>b.onclick=()=>acknowledge(b.dataset.stockAck==='all'?visible():items.filter(i=>i.key===b.dataset.stockAck)));
    overlay.querySelectorAll('[data-stock-route]').forEach(b=>b.onclick=()=>{close();setCurrentMenu(b.dataset.stockRoute);});
  }
  try{await refresh();}catch(error){if(current())overlay.querySelector('[data-stock-content]').textContent=staffError(error);}
}
