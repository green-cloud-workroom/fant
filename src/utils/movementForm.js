import {collection,doc} from 'firebase/firestore';
import {listCancellationSources} from '../services/manualMovements.js';
import {MOVEMENT_LABELS,movementAmount} from '../services/manualMovementLogic.js';
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
  kind?.addEventListener('change',async()=>{
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
    const reason=(document.getElementById('movement_reason')?.value||reasonInput?.value||'').trim();
    if(kind.value!=='receipt'&&!reason)throw Error('처리 사유를 입력해주세요.');
    return {kind:kind.value,reason,cancelOf:kind.value==='cancel'?source.value:null,operationId};
  };
}
