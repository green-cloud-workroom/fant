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
 let context=pending?.context,prepared=null,request=pending?.request,busy=false,inventoryResult=pending?.inventoryResult,createdAt=pending?.createdAt;
 if(!request){let cursor=null;do{const recovered=await invoke('productionReceiptCommand',{action:'inventoryCorrectionRecovery',sourceCollection,sourceId,...(cursor?{cursor}:{})});pending=recovered.intents?.find(i=>i.sourceId===sourceId);cursor=recovered.nextCursor;}while(!pending&&cursor);if(pending){context=pending.context;request=pending.request;inventoryResult=pending.inventoryResult;createdAt=pending.createdAt;}}
 if(!request){context=await invoke('productionReceiptCommand',{action:'inventoryCorrectionContext',sourceCollection,sourceId});prepared=await invoke('inventoryReceiptCorrectionPrepare',{contractVersion:1,receiptId:context.receiptId,sourceFingerprint:context.sourceFingerprint});}
 const remember=()=>savePending(copy({context,request,createdAt,...(inventoryResult?{inventoryResult}:{})}));
 const finalize=async result=>{
  if(result?.ok===false){await invoke('productionReceiptCommand',{action:'saveInventoryCorrectionIntent',sourceCollection,sourceId,request,blocked:true});clearPending();request=null;if(prepared){prepared.ok=false;prepared.blocked=result.blocked;}throw Error(inventoryCorrectionMessage(result.blocked));}
  if(result?.ok!==true)throw Error('재고 성공 결과가 없습니다.');
  if(result.operationId!==request.operationId||result.receiptId!==request.receiptId||result.receiptRevision!==request.expected.receiptRevision)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  inventoryResult=copy(result);remember();
  const confirmed=await invoke('productionReceiptCommand',{action:'finalizeInventoryReceiptCorrection',sourceCollection,sourceId,receiptId:request.receiptId,operationId:request.operationId,sourceFingerprint:context.sourceFingerprint,inventoryResult});
  if(confirmed?.sourceConfirmed!==true||confirmed.operationId!==request.operationId||confirmed.receiptId!==request.receiptId)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  clearPending();return confirmed;
 };
 async function recover({resume=false}={}){
  if(!request)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  const status=await invoke('inventoryReceiptCorrectionStatus',{contractVersion:1,operationId:request.operationId});
  if(status.state==='completed')return finalize(status.result);
  if(status.state!=='not_found')throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
  if(!resume)throw Error('재고 결과가 없습니다. 저장된 수량·모드·시각을 확인한 뒤 이어서 실행 또는 폐기를 선택해주세요.');
  // Only an explicit resume may submit the frozen request again.
  await invoke('productionReceiptCommand',{action:'saveInventoryCorrectionIntent',sourceCollection,sourceId,request});
  return finalize(await invoke('inventoryReceiptCorrection',request));
 }
 return {context,prepared,get savedRequest(){return request?copy(request):null;},get createdAt(){return createdAt;},get hasInventoryResult(){return inventoryResult?.ok===true;},get pending(){return !!request;},get operationId(){return request?.operationId;},
  async recover(options){if(busy)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');busy=true;try{return await recover(options);}finally{busy=false;}},
  async discard(){
   if(busy||!request)throw Error('작업 상태를 확인해주세요.');busy=true;
   try{await invoke('productionReceiptCommand',{action:'saveInventoryCorrectionIntent',sourceCollection,sourceId,request,blocked:true});clearPending();request=null;}finally{busy=false;}
  },
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
   createdAt=new Date().toISOString();remember();busy=true;
   try{
    try{await invoke('productionReceiptCommand',{action:'saveInventoryCorrectionIntent',sourceCollection,sourceId,request});}catch(error){clearPending();request=null;throw error;}
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
export async function openInventoryReceiptCorrection({sourceCollection,sourceId,mode='edit',onComplete=()=>{},showModal,closeModal,onMetadata,pending=null}){
 if(!INVENTORY_RECEIPT_CORRECTION_ENABLED)return false;
 const user=auth.currentUser,epoch=sessionStore.epoch,page=getPageContext();
 if(!user)throw Error('입력·권한 또는 서버 결과를 확인해주세요.');
 const check=()=>{if(auth.currentUser?.uid!==user.uid||sessionStore.epoch!==epoch||page&&!page.isCurrent())throw Error('입력·권한 또는 서버 결과를 확인해주세요.');};
 const gate=await openAction({refs:[sourceCollection+'/'+sourceId],roles:['admin','office'],reusableConfirm:true});
 const invoke=async(name,data)=>{check();const token=await user.getIdTokenResult();if(!['admin','office'].includes(token.claims.roles?.production))throw Error('입력·권한 또는 서버 결과를 확인해주세요.');const result=await httpsCallable(getFunctions(auth.app,'asia-northeast3'),name)(data);check();return result.data;};
 const flow=await createInventoryReceiptCorrectionFlow({invoke,sourceCollection,sourceId,pending});
 check();await gate.confirm();
 const prepared=flow.prepared,lots=prepared?.lots||[];
 const pendingLabel=()=>flow.hasInventoryResult?'확정 마저 하기':'이어서 실행';
 const saved=flow.savedRequest;
 showModal(`<h3>재고 입고 수량 ${mode==='cancel'?'취소':'정정'}</h3><p>수량만 정정합니다. 재고 반영 후 생산 원본을 확정합니다.</p>
 ${prepared&&!prepared.ok?`<p role="alert">${escape(inventoryCorrectionMessage(prepared.blocked))}</p>`:''}
 <div id="irc_pending_details">${flow.pending?`<p>미확정 작업 ${escape(flow.operationId)}</p><p>저장 시각: ${escape(flow.createdAt??'확인 필요')} · 모드: ${saved.mode==='cancel'?'취소':'수량 정정'}</p><p>저장 수량: ${saved.mode==='cancel'?'전체 취소 (0)':saved.lines.map(l=>`${escape(l.productId)} / ${escape(l.lotKey)}: ${escape(l.qty)}`).join(' · ')}</p><p>사유: ${escape(saved.reason)}</p>`:''}</div>
 ${lots.map((l,i)=>`<div><label>${escape(l.productName)} (${escape(l.unit)})</label><p>받은 수량 ${escape(l.receivedQty)} · 현재 ${escape(l.currentQty)} · 예약 ${escape(l.reservedQty)} · 최대 감소 ${escape(l.maxDecreaseQty)}</p><label>정정 후 <input id="irc_qty_${i}" type="number" step="${l.unit==='box'?'0.5':'1'}" value="${mode==='cancel'?0:escape(l.receivedQty)}" ${mode==='cancel'?'disabled':''}></label></div>`).join('')}
 ${onMetadata?'<button id="irc_metadata" class="btn-secondary">메모·표시 담당자 수정</button>':''}
 <label>사유 <input id="irc_reason" maxlength="500"></label><p id="irc_status" role="status"></p>
 <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button><button id="irc_confirm" ${!flow.pending&&!prepared?.ok?'disabled':''}>${flow.pending?pendingLabel():'위 수량 확인 후 '+(mode==='cancel'?'취소':'정정')}</button><button id="irc_discard" class="btn-secondary" ${flow.pending&&!flow.hasInventoryResult?'':'hidden'}>폐기</button></div>`);
 document.getElementById('irc_metadata')?.addEventListener('click',()=>{if(!flow.pending)onMetadata();});
 const button=document.getElementById('irc_confirm'),status=document.getElementById('irc_status'),discard=document.getElementById('irc_discard');
 discard?.addEventListener('click',async()=>{button.disabled=true;discard.disabled=true;try{await gate.confirm();await flow.discard();check();closeModal();await onComplete();}catch(error){status.textContent=error.message;button.disabled=false;discard.disabled=false;}});
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{if(flow.pending){await gate.confirm();await flow.recover({resume:!flow.hasInventoryResult});}else {await gate.confirm();await flow.submit({mode,quantities:lots.map((_,i)=>document.getElementById('irc_qty_'+i).value),reason:document.getElementById('irc_reason').value});}check();closeModal();await onComplete();}
  catch(error){if(!page||page.isCurrent()){status.textContent=error.message;button.textContent=flow.pending?pendingLabel():'입력 확인 후 다시 시도';if(flow.pending){const old=flow.savedRequest;document.getElementById('irc_pending_details').textContent=`미확정 작업 ${flow.operationId} · 저장 시각: ${flow.createdAt??'확인 필요'} · 모드: ${old.mode==='cancel'?'취소':'수량 정정'} · 저장 수량: ${old.mode==='cancel'?'전체 취소 (0)':old.lines.map(l=>l.productId+' / '+l.lotKey+': '+l.qty).join(' · ')} · 사유: ${old.reason}`;discard.hidden=flow.hasInventoryResult;}}}
  finally{button.disabled=!flow.pending&&flow.prepared?.ok!==true;}
 });
 return true;
}

// Production-owned server intents survive tab closure and another device login.
export async function mountInventoryCorrectionRecovery({sourceCollection,role,root=document.getElementById('mainContent'),recoveryCache=null,...options}){
 if(!INVENTORY_RECEIPT_CORRECTION_ENABLED||!['admin','office'].includes(role)||!root)return;
 root.querySelector('[data-inventory-correction-recovery]')?.remove();
 const user=auth.currentUser,epoch=sessionStore.epoch,page=getPageContext();
 if(!user)return;
 const holder=document.createElement('div');holder.dataset.inventoryCorrectionRecovery='true';root.prepend(holder);
 const current=()=>auth.currentUser?.uid===user.uid&&sessionStore.epoch===epoch&&(!page||page.isCurrent())&&holder.parentNode;
 try{
  const token=await user.getIdTokenResult();if(!['admin','office'].includes(token.claims.roles?.production))return;
  const key=user.uid+':'+epoch+':'+sourceCollection;
  const load=()=>httpsCallable(getFunctions(auth.app,'asia-northeast3'),'productionReceiptCommand')({action:'inventoryCorrectionRecovery',sourceCollection});
  if(recoveryCache&&(recoveryCache.key!==key||!recoveryCache.promise)){recoveryCache.key=key;recoveryCache.promise=load();}
  const response=await (recoveryCache?recoveryCache.promise:load());
  if(!current())return;
  const appendIntents=intents=>{
   for(const pending of intents||[]){
    const button=document.createElement('button');button.className='btn-secondary';
    button.textContent=`${pending.inventoryResult?.ok===true?'확정 마저 하기':'미실행 정정 확인'} (${pending.request.operationId})`;
    button.addEventListener('click',()=>openInventoryReceiptCorrection({sourceCollection,sourceId:pending.sourceId,mode:pending.request.mode,pending,...options}).catch(error=>alert(error.message)));
    holder.appendChild(button);
   }
  };
  appendIntents(response.data.intents);
  let cursor=response.data.nextCursor;
  if(cursor){
   const more=document.createElement('button');more.textContent='미확정 작업 더 보기';
   more.addEventListener('click',async()=>{
    more.disabled=true;
    try{
     const token=await user.getIdTokenResult();if(!current()||!['admin','office'].includes(token.claims.roles?.production))return;
     const next=await httpsCallable(getFunctions(auth.app,'asia-northeast3'),'productionReceiptCommand')({action:'inventoryCorrectionRecovery',sourceCollection,cursor});
     if(!current())return;
     appendIntents(next.data.intents);cursor=next.data.nextCursor;
     if(!cursor)more.remove();
    }catch(error){if(current())alert('미확정 작업 조회 실패: '+error.message);}
    finally{more.disabled=false;}
   });
   holder.appendChild(more);
  }
  if(!holder.childNodes.length)holder.remove();
 }catch(error){if(recoveryCache)recoveryCache.promise=null;if(current())holder.textContent='미확정 작업 조회 실패: '+error.message;}
}
