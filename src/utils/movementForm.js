import {collection,doc} from 'firebase/firestore';
import {listCancellationSources} from '../services/manualMovements.js';
import {MOVEMENT_LABELS,movementAmount,movementReason,movementReasonRequired} from '../services/manualMovementLogic.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceLabel=(name,row)=>{
  const amount=movementAmount(row),unit={meatLogs:'kg',bagLogs:'장',eggLogs:'개',supplementLogs:'봉',breadPanLogs:'kg',frozenPanLogs:'판'}[name];
  const label=MOVEMENT_LABELS[row.manualMovement?.kind]||({frozenIncoming:'입고',incoming:'입고',in:'입고',out:'사용',adjust:'기존 수동조정'}[row.type])||row.type;
  return `${row.date} · ${label} · ${name==='meatLogs'?amount/1000:amount}${unit} · ${row.reason||row.note||row.staff||row.staffName||''} · ${row.id}`;
};
export function movementFields({incoming=false,allowed=incoming?['receipt','test']:Object.keys(MOVEMENT_LABELS),defaultKind=incoming?'receipt':'',reasonField=true}={}) {
  return `<div class="form-group"><label for="movement_kind">처리 구분 *</label><select id="movement_kind"><option value="">선택해주세요</option>${Object.entries(MOVEMENT_LABELS).map(([k,v])=>`<option value="${k}" ${k===defaultKind?'selected':''} ${!allowed.includes(k)?'disabled':''}>${v}</option>`).join('')}</select><p id="movement_hint" style="font-size:12px;color:#666">입고 외 사용·실사 보정·오입력 취소는 수동조정에서 입력합니다. 테스트는 재고에 반영하지 않습니다.</p></div><div id="movement_source_group" class="form-group" hidden style="display:none"><label for="movement_source">취소할 원본 *</label><select id="movement_source" style="width:100%;max-width:100%;min-width:0;box-sizing:border-box"><option value="">원본을 선택해주세요</option></select></div>${reasonField?'<div class="form-group"><label for="movement_reason">처리 사유</label><input id="movement_reason" maxlength="200" placeholder="실사 보정·취소·테스트 사유를 입력해주세요" /></div>':''}`;
}
export function readMovementForm(getter) {
  try{return getter();}catch(error){alert(error.message);return null;}
}
export function bindMovementForm({db,name,filter,onCancel,reasonInput,filterInputs=[]}) {
  const kind=document.getElementById('movement_kind'),source=document.getElementById('movement_source'),group=document.getElementById('movement_source_group'),host=kind?.closest('.modal-overlay')||kind?.parentElement?.parentElement;
  const operationId=doc(collection(db,name)).id;let rows=[],revision=0,loading=false;
  const updateReasonUi=()=>{
    const direction=document.getElementById('m_adjustType');
    if(direction){
      if(kind.value==='usage')direction.value='minus';
      if(kind.value==='receipt')direction.value='plus';
      direction.disabled=['usage','receipt','cancel'].includes(kind.value);
    }
    const signed=document.getElementById('sup_adj_qty');
    if(signed){
      const fixed=['usage','receipt'].includes(kind.value);
      signed.readOnly=kind.value==='cancel';
      if(fixed&&signed.value!=='')signed.value=Math.abs(Number(signed.value));
      if(fixed)signed.setAttribute('min','1');else signed.removeAttribute('min');
      signed.placeholder=fixed?'수량 입력 (봉)':'증가: +5  감소: -3';
      const label=signed.closest('.form-group')?.querySelector('label');
      if(label)label.textContent=fixed?'수량(봉) *':'증감(봉) *';
    }
    const input=document.getElementById('movement_reason')||reasonInput,required=movementReasonRequired(kind?.value);
    if(input){
      input.required=required;
      const label=input.closest('.form-group')?.querySelector('label');
      if(label)label.textContent=required?'처리 사유 *':input.id==='m_note'||input.id==='m_memo'?'비고·사유 (선택)':'처리 사유 (선택)';
      input.maxLength=200;
      input.placeholder=required?'실사 보정·취소·테스트 사유를 입력해주세요':'필요한 경우에만 입력해주세요';
    }
    const hint=document.getElementById('movement_hint');
    if(hint)hint.textContent=({receipt:'실제 입고로 재고에 반영합니다. 사유는 선택입니다.',
      usage:'실제 사용으로 재고에서 차감합니다. 사유는 입력하지 않아도 됩니다.',
      reconciliation:'실제로 확인한 재고 차이를 보정합니다. 보정 사유를 입력해주세요.',
      cancel:'취소할 원본을 선택해주세요. 원본은 보존하고 반대 수량으로 취소합니다. 취소 사유는 필수입니다.',
      test:'테스트는 재고에 반영하지 않습니다. 테스트 사유를 입력해주세요.'})[kind?.value]||'처리 목적에 맞는 구분을 선택해주세요.';
  };
  updateReasonUi();
  kind?.addEventListener('change',async()=>{
    updateReasonUi();
    const request=++revision;group.hidden=kind.value!=='cancel';group.style.display=kind.value==='cancel'?'block':'none';source.value='';
    if(kind.value!=='cancel')return;
    loading=true;source.disabled=true;source.innerHTML='<option value="">원본 기록 조회 중…</option>';
    try{const found=await listCancellationSources(db,name,typeof filter==='function'?filter():filter);
      if(request!==revision||!host?.isConnected)return;rows=found;source.innerHTML='<option value="">원본을 선택해주세요</option>'+rows.map(r=>`<option value="${esc(r.id)}">${esc(sourceLabel(name,r))}</option>`).join('');
    }catch(e){if(request===revision){source.innerHTML='<option value="">조회 실패 — 구분을 다시 선택해주세요</option>';rows=[];}}
    finally{if(request===revision){loading=false;source.disabled=false;}}
  });
  source?.addEventListener('change',()=>{const row=rows.find(r=>r.id===source.value);if(row)onCancel?.(-movementAmount(row),row);});
  for(const input of filterInputs)input?.addEventListener('change',()=>{if(kind?.value==='cancel')kind.dispatchEvent(new (kind.ownerDocument.defaultView.Event)('change'));});
  return ()=>{
    if(!kind?.value||kind.selectedOptions?.[0]?.disabled)throw Error('처리 구분을 선택해주세요.');
    if(kind.value==='cancel'&&(loading||!rows.some(r=>r.id===source.value)))throw Error('취소할 원본을 선택해주세요.');
    const reason=movementReason(kind.value,document.getElementById('movement_reason')?.value||reasonInput?.value||'');
    if(movementReasonRequired(kind.value)&&!reason)throw Error('처리 사유를 입력해주세요.');
    return {kind:kind.value,reason,cancelOf:kind.value==='cancel'?source.value:null,operationId};
  };
}
