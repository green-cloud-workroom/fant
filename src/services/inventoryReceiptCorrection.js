import {getFunctions,httpsCallable} from 'firebase/functions';
import {auth} from '../firebase.js';
import {openAction} from './actionGateway.js';
import {sessionStore} from '../state/sessionStore.js';
import {getPageContext} from '../utils/pageLifecycle.js';

// Release switch: absent or false keeps the inventory correction path off.
export const INVENTORY_RECEIPT_CORRECTION_ENABLED = import.meta.env?.VITE_INVENTORY_RECEIPT_CORRECTION_ENABLED === 'true';
export function inventoryReceiptCorrectionLink(receiptId, sourceId) {
  return Object.freeze({enabled: INVENTORY_RECEIPT_CORRECTION_ENABLED,
    callable: 'inventoryReceiptCorrection', region: 'asia-northeast3', contractVersion: 1,
    receiptId, sourceId, contract: 'restore/inventory-contract.md'});
}
const messages={used_stock:'이미 출고·사용한 수량이라 줄일 수 없습니다.',reserved_stock:'예약된 재고를 먼저 확인해주세요.',count_conflict:'확정 실사와 겹쳐 정정할 수 없습니다.',component_shortage:'세트 구성품 재고가 부족합니다.',stale_context:'재고 상태가 바뀌었습니다. 준비부터 다시 확인해주세요.',unsupported_state:'이 입고 상태는 수량 정정을 지원하지 않습니다.',ambiguous_legacy:'로트·최초 원장 근거를 확인해주세요.',lot_key_mismatch:'입고 로트 연결이 다릅니다.'};
export function inventoryCorrectionMessage(blocked){return messages[blocked?.reason]||blocked?.message||'입력·권한 또는 서버 결과를 확인해주세요.';}
const copy=value=>JSON.parse(JSON.stringify(value));
// Transport is injected so the identical recovery state machine can be tested
// against both real local callable handlers and a lost-response transport.
export async function createInventoryReceiptCorrectionFlow({invoke,sourceCollection,sourceId,pending=null,savePending=()=>{},clearPending=()=>{},newId=()=>crypto.randomUUID()}){
 let context=pending?.context,prepared=null,request=pending?.request,busy=false,inventoryResult=pending?.inventoryResult;
 if(!request){context=await invoke('productionReceiptCommand',{action:'inventoryCorrectionContext',sourceCollection,sourceId});prepared=await invoke('inventoryReceiptCorrectionPrepare',{contractVersion:1,receiptId:context.receiptId,sourceFingerprint:context.sourceFingerprint});}
 const remember=()=>savePending(copy({context,request,...(inventoryResult?{inventoryResult}:{})}));
 const finalize=async result=>{
  if(result?.ok===false){clearPending();request=null;if(prepared){prepared.ok=false;prepared.blocked=result.blocked;}throw Error(inventoryCorrectionMessage(result.blocked));}
  if(result?.ok!==true)throw Error('재고 성공 결과가 없습니다.');
  if(result.operationId!==request.operationId||result.receiptId!==request.receiptId||result.receiptRevision!==request.expected.receiptRevision)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  inventoryResult=copy(result);remember();
  const confirmed=await invoke('productionReceiptCommand',{action:'finalizeInventoryReceiptCorrection',sourceCollection,sourceId,receiptId:request.receiptId,operationId:request.operationId,sourceFingerprint:context.sourceFingerprint,inventoryResult});
  if(confirmed?.sourceConfirmed!==true||confirmed.operationId!==request.operationId||confirmed.receiptId!==request.receiptId)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  clearPending();return confirmed;
 };
 async function recover(){
  if(!request)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  if(inventoryResult)return finalize(inventoryResult);
  const status=await invoke('inventoryReceiptCorrectionStatus',{contractVersion:1,operationId:request.operationId});
  if(status.state==='completed')return finalize(status.result);
  if(status.state!=='not_found')throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  // A retry uses the exact frozen request and ID; never prepare or generate here.
  return finalize(await invoke('inventoryReceiptCorrection',request));
 }
 return {context,prepared,get pending(){return !!request;},get operationId(){return request?.operationId;},
  async recover(){if(busy)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');busy=true;try{return await recover();}finally{busy=false;}},
  async submit({mode,quantities=[],reason}){
   if(busy||request)throw Error('기존 작업 ID의 서버 결과를 먼저 확인해주세요.');
   if(!prepared?.ok)throw Error(inventoryCorrectionMessage(prepared?.blocked));
   if(!['edit','cancel'].includes(mode)||!reason?.trim()||reason.trim().length>500)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
   const lines=mode==='cancel'?[]:prepared.lots.map((lot,index)=>{
    const qty=Number(quantities[index]);
    const valid=lot.unit==='box'?Number.isFinite(qty)&&qty>0&&Number.isInteger(qty*2):lot.unit==='pack'?Number.isSafeInteger(qty)&&qty>=0&&qty<=9:Number.isSafeInteger(qty)&&qty>0;
    if(!valid)throw Error('생식 본품은 0.5박스, 낱팩은 0~9 정수, 동결은 1 이상 정수로 입력해주세요.');
    return {productId:lot.productId,lotKey:lot.lotKey,qty};
   });
   if(mode==='edit'&&lines.every((l,i)=>l.qty===prepared.lots[i].receivedQty))throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
   request=copy({contractVersion:1,operationId:newId(),receiptId:context.receiptId,mode,lines,reason:reason.trim(),expected:{receiptRevision:prepared.receiptRevision,sourceFingerprint:context.sourceFingerprint,contextHash:prepared.contextHash}});
   remember();busy=true;
   try{
    let result;
    try{result=await invoke('inventoryReceiptCorrection',request);}catch(cause){
     try{return await recover();}catch{throw new Error('응답 미확정: 같은 작업 ID로 결과 확인을 눌러주세요. 새 작업을 만들지 않습니다.',{cause});}
    }
    return await finalize(result);
   }finally{busy=false;}
  }
 };
}
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function openInventoryReceiptCorrection({sourceCollection,sourceId,mode='edit',onComplete=()=>{},showModal,closeModal,onMetadata}){
 if(!INVENTORY_RECEIPT_CORRECTION_ENABLED)return false;
 const user=auth.currentUser,epoch=sessionStore.epoch,page=getPageContext();
 if(!user)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
 const check=()=>{if(auth.currentUser?.uid!==user.uid||sessionStore.epoch!==epoch||page&&!page.isCurrent())throw Error('입력·권한 또는 서버 결과를 확인해주세요.');};
 const gate=await openAction({refs:[sourceCollection+'/'+sourceId],roles:['admin','office'],reusableConfirm:true});
 const invoke=async(name,data)=>{check();const token=await user.getIdTokenResult();if(!['admin','office'].includes(token.claims.roles?.production))throw Error('입력·권한 또는 서버 결과를 확인해주세요.');const result=await httpsCallable(getFunctions(auth.app,'asia-northeast3'),name)(data);check();return result.data;};
 // Keep an unresolved ID across closing the modal and reloading this tab.
 const key=`inventoryReceiptCorrection:${user.uid}:${sourceCollection}:${sourceId}`,storage=globalThis.sessionStorage;
 const pending=JSON.parse(storage?.getItem(key)||'null');
 const flow=await createInventoryReceiptCorrectionFlow({invoke,sourceCollection,sourceId,pending,savePending:value=>storage?.setItem(key,JSON.stringify(value)),clearPending:()=>storage?.removeItem(key)});
 check();await gate.confirm();
 const prepared=flow.prepared,lots=prepared?.lots||[];
 showModal(`<h3>재고 입고 수량 ${mode==='cancel'?'취소':'정정'}</h3><p>수량만 정정합니다. 재고 반영 후 생산 원본을 확정합니다.</p>
 ${prepared&&!prepared.ok?`<p role="alert">${escape(inventoryCorrectionMessage(prepared.blocked))}</p>`:''}
 ${flow.pending?`<p>미확정 작업 ${escape(flow.operationId)} — 같은 작업 결과를 확인합니다.</p>`:''}
 ${lots.map((l,i)=>`<div><label>${escape(l.productName)} (${escape(l.unit)})</label><p>받은 수량 ${escape(l.receivedQty)} · 현재 ${escape(l.currentQty)} · 예약 ${escape(l.reservedQty)} · 최대 감소 ${escape(l.maxDecreaseQty)}</p><label>정정 후 <input id="irc_qty_${i}" type="number" step="${l.unit==='box'?'0.5':'1'}" value="${mode==='cancel'?0:escape(l.receivedQty)}" ${mode==='cancel'?'disabled':''}></label></div>`).join('')}
 ${onMetadata?'<button id="irc_metadata" class="btn-secondary">메모·표시 담당자 수정</button>':''}
 <label>사유 <input id="irc_reason" maxlength="500"></label><p id="irc_status" role="status"></p>
 <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button><button id="irc_confirm" ${!flow.pending&&!prepared?.ok?'disabled':''}>${flow.pending?'같은 작업 결과 확인':'위 수량 확인 후 '+(mode==='cancel'?'취소':'정정')}</button></div>`);
 document.getElementById('irc_metadata')?.addEventListener('click',()=>{if(!flow.pending)onMetadata();});
 const button=document.getElementById('irc_confirm'),status=document.getElementById('irc_status');
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{if(flow.pending)await flow.recover();else {await gate.confirm();await flow.submit({mode,quantities:lots.map((_,i)=>document.getElementById('irc_qty_'+i).value),reason:document.getElementById('irc_reason').value});}check();closeModal();await onComplete();}
  catch(error){if(!page||page.isCurrent()){status.textContent=error.message;button.textContent=flow.pending?'같은 작업 결과 확인':'입력 확인 후 다시 시도';}}
  finally{button.disabled=!flow.pending&&flow.prepared?.ok!==true;}
 });
 return true;
}

// A cancelled source may disappear from its normal list before its ACK arrives.
// Keep recovery reachable from the page even after that row is hidden.
export function mountInventoryCorrectionRecovery({sourceCollection,role,root=document.getElementById('mainContent'),...options}){
 if(!INVENTORY_RECEIPT_CORRECTION_ENABLED||!['admin','office'].includes(role)||!root)return;
 root.querySelector('[data-inventory-correction-recovery]')?.remove();
 const storage=globalThis.sessionStorage,prefix=`inventoryReceiptCorrection:${auth.currentUser?.uid}:${sourceCollection}:`;
 const holder=document.createElement('div');holder.dataset.inventoryCorrectionRecovery='true';
 for(let i=0;i<(storage?.length??0);i++){
  const key=storage.key(i);if(!key?.startsWith(prefix))continue;
  const pending=JSON.parse(storage.getItem(key)||'null');if(!pending?.request)continue;
  const button=document.createElement('button');button.className='btn-secondary';
  button.textContent=`미확정 재고 정정 결과 확인 (${pending.request.operationId})`;
  button.addEventListener('click',()=>openInventoryReceiptCorrection({sourceCollection,sourceId:key.slice(prefix.length),mode:pending.request.mode,...options}).catch(error=>alert(error.message)));
  holder.appendChild(button);
 }
 if(holder.childNodes.length)root.prepend(holder);
}
