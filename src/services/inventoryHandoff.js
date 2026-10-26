import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase.js';
import { openAction } from './actionGateway.js';
import { registerModalDismiss } from '../utils/modalManager.js';

const bound = new WeakSet();
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function inventoryHandoffButton(receiptId) {
  return `<button type="button" class="btn-secondary" data-inventory-handoff="${escape(receiptId)}" style="font-size:11px;padding:3px 7px;margin-left:5px">재고앱 인계 확인</button>`;
}
async function call(data) {
  if (!auth.currentUser) throw Error('로그인하세요.');
  return (await httpsCallable(getFunctions(auth.app, 'asia-northeast3'), 'productReceiptWorkflow')(data)).data;
}
export function bindInventoryHandoff(root = document) {
  if (bound.has(root)) return;
  bound.add(root);
  root.addEventListener('click', event => {
    const button = event.target.closest?.('[data-inventory-handoff]');
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    if (button.disabled) return;
    button.disabled = true;
    showHandoff(button.dataset.inventoryHandoff).catch(error => alert(error.message || String(error))).finally(() => { button.disabled = false; });
  }, true);
}
export async function showHandoff(receiptId) {
  const action = await openAction({refs:[`productTransferRequests/${receiptId}`]});
  const context = await call({action:'context', receiptId});
  if (!['pending','대기'].includes(context.receiptStatus)) throw Error('이미 처리된 입고입니다. 재고앱 이력을 확인하세요.');
  const raw = context.request.category === 'raw', overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:10000;background:#0005;display:flex;align-items:center;justify-content:center;padding:16px';
  overlay.innerHTML=`<section role="dialog" aria-modal="true" aria-label="재고앱 최종 인계 확인" style="background:white;padding:18px;border-radius:6px;width:min(100%,420px);font-size:12px"><h3>재고앱 최종 인계 확인</h3><p>${escape(context.request.recipeName)} · 제조 ${escape(context.request.producedDate)}</p>${context.actor.sharedQc?`<label>실제 담당자<select data-staff style="width:100%"><option value="">담당자 선택</option>${(context.actor.staffOptions||[]).map(p=>`<option value="${escape(p.employeeId)}">${escape(p.name)}</option>`).join('')}</select></label>`:`<p>담당자 ${escape(context.actor.name)}</p>`}<label>인계 수량 (${raw?'박스':'개'})<input data-main type="number" min="${raw?'.5':'1'}" step="${raw?'.5':'1'}" value="${raw?context.request.boxes:context.request.quantity}" style="width:100%"></label>${raw?`<label>잔여팩<input data-packs type="number" min="0" max="9" step="1" value="${context.request.remainderPacks}" style="width:100%"></label>`:''}<label>실물 식별 문구<input data-label type="text" required style="width:100%"></label><label>실제 인계 시각<input data-arrived type="datetime-local" required style="width:100%"></label><label style="display:block;margin:12px 0"><input data-complete type="checkbox"> 실물 인계가 끝났고 추가 인계·운송 중 물량이 없습니다.</label><p data-status role="status"></p><div style="display:flex;justify-content:flex-end;gap:8px"><button data-close type="button">닫기</button><button data-save type="button">인계 확인 기록</button></div></section>`;
  document.body.append(overlay);
  let busy = false, unregister = () => {};
  const close = () => { if (!busy) {unregister(); overlay.remove();} };
  unregister = registerModalDismiss(close);
  overlay.querySelector('[data-close]').onclick = close;
  overlay.addEventListener('keydown', e => {if(e.key==='Escape')close();});
  overlay.querySelector('[data-label]').focus();
  const operationId = crypto.randomUUID();
  overlay.querySelector('[data-save]').onclick = async event => {
    if (busy) return;
    const label=overlay.querySelector('[data-label]').value.trim(), arrived=overlay.querySelector('[data-arrived]').value;
    const complete=overlay.querySelector('[data-complete]').checked, status=overlay.querySelector('[data-status]');
    const main=Number(overlay.querySelector('[data-main]').value),packs=raw?Number(overlay.querySelector('[data-packs]').value):null;
    const employeeId=context.actor.sharedQc?overlay.querySelector('[data-staff]').value:context.actor.employeeId;
    if(context.actor.sharedQc&&!employeeId){status.textContent='실제 담당자를 선택하세요.';return;}
    if(!label||!arrived||!complete){status.textContent='실물 식별·인계 시각·남은 물량 여부를 확인하세요.';return;}
    busy=true;event.currentTarget.disabled=true;
    overlay.querySelectorAll('input, select').forEach(input=>input.disabled=true);
    try {
      await action.submit(()=>call({action:'handoff',receiptId,operationId,employeeId,sourceKey:context.sourceKey,
        actualBoxes:raw?main:null,
        actualRemainderPacks:raw?packs:null,
        actualQuantity:raw?null:main,physicalLabel:label,
        arrivedAtMillis:new Date(arrived+'+09:00').getTime(),completed:true,remainingMain:0,remainingPacks:0,inTransitMain:0,inTransitPacks:0}));
      status.textContent='최종 인계 확인을 기록했습니다. 재고앱에서 입고 수량을 확인할 수 있습니다.';
    } catch(error) {
      // A callable response can be lost after the record commits. Read back this exact operation before offering a new record.
      try {const actual=await call({action:'context',receiptId});status.textContent=actual.handoff?.operationId===operationId?'인계 확인 기록을 서버에서 확인했습니다.':'결과를 확인하지 못했습니다. 창을 닫고 기록을 다시 조회하세요.';}
      catch {status.textContent='결과 확인 중입니다. 다시 인계 기록을 만들기 전에 서버 결과를 확인하세요.';}
    } finally {busy=false;}
  };
}
