import{b as e,d as t,s as n,u as r,y as i}from"./index.esm-D8prxbkJ.js";import{n as a}from"./firebase-BOShkvR0.js";import{i as o,r as s}from"./pageLifecycle-_b6L3DA3.js";import{n as c}from"./modalManager-D53QKIlh.js";import{n as l}from"./modal-IG9zwovL.js";import{G as u,L as d,W as f,f as p}from"./index-DE9IO9n-.js";import{t as m}from"./statusToast-DAQ_Eu62.js";import{i as h,n as g,r as _,t as v}from"./movementForm-wdw7orji.js";import{l as y,n as b}from"./statsLogic-2OOo3En5.js";import{t as x}from"./statsAutomationRuntime-BGZxVf0T.js";import{t as S}from"./closingGuard-C76odSIk.js";import{t as C}from"./readCommand-BwpaJaUL.js";import{t as w}from"./pageRefresh-CxDpQJ6i.js";import{t as T}from"./commandBatch-DvIN61TH.js";var E=p(`schedule`),D=[],O=[];async function k(e,t=[`admin`,`office`]){let n=s();try{return await C(E,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[입고 예정 저장]`,e),alert(e.message)}}async function A({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`;let n=await E.load(e=>X(e),{force:e,onChange:w(E,A)});!n||!t.isConnected||(D=n.meatTypes,O=n.bagTypes,q=n.staff,P(n.schedules))}async function j(e={getDocs:n}){let o=t(i(a,`schedules`),r(`date`,`asc`)),s=(await e.getDocs(o)).docs.map(e=>({id:e.id,...e.data()}));return s.sort((e,t)=>{if(e.date!==t.date)return e.date.localeCompare(t.date);let n=e.createdAt?.toMillis?e.createdAt.toMillis():0;return(t.createdAt?.toMillis?t.createdAt.toMillis():0)-n}),s}async function M(e={getDocs:n}){return(await e.getDocs(i(a,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()}))}async function N(e={getDocs:n}){return(await e.getDocs(i(a,`bagTypes`))).docs.map(e=>({id:e.id,...e.data()}))}function P(e){let t=document.getElementById(`mainContent`),n=s(),r=d(),i=F(),a=e.filter(e=>e.status===`scheduled`),o=e.filter(e=>e.status!==`scheduled`),c=!1;t.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">입고 예정관리</h2>
        ${i?`<button class="btn-primary" id="btnAddSchedule">+ 입고 예정 등록</button>`:``}
      </div>

      <!-- 활성 목록 -->
      <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;margin-bottom:16px;">
        <table class="data-table">
          <thead>
            <tr>
              <th>예정일</th>
              <th>구분</th>
              <th>품목명</th>
              <th>발주수량</th>
              <th>발주담당자</th>
              <th>입고메모</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${a.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>`:a.map(e=>I(e,r,i)).join(``)}
          </tbody>
        </table>
      </div>

      <!-- 완료/취소 토글 -->
      <div style="margin-bottom:12px;">
        <button class="btn-secondary" id="btnToggleDone">완료/취소 항목 보기</button>
      </div>
      <div id="doneSection" style="display:none;">
        <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>예정일</th>
                <th>구분</th>
                <th>품목명</th>
                <th>발주수량</th>
                <th>실제수량</th>
                <th>실제 입고일</th>
                <th>입고담당자</th>
                <th>상태</th>
                <th>완료메모</th>
              </tr>
            </thead>
            <tbody>
              ${o.length===0?`<tr><td colspan="9" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>`:o.map(e=>L(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddSchedule`)?.addEventListener(`click`,()=>H()),document.getElementById(`btnToggleDone`).addEventListener(`click`,()=>{let e=document.getElementById(`doneSection`);c=!c,e.style.display=c?``:`none`,document.getElementById(`btnToggleDone`).textContent=c?`완료/취소 항목 숨기기`:`완료/취소 항목 보기`}),document.querySelectorAll(`.btn-complete`).forEach(t=>{t.addEventListener(`click`,async()=>{try{let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`일정을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.`);return}G(r)}catch(e){console.error(`완료 버튼 오류:`,e),alert(`오류가 발생했습니다: `+e.message)}})}),document.querySelectorAll(`.btn-edit-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!F()){alert(`입고 예정 수정 권한이 없습니다.`);return}let r=t.dataset.id,i=e.find(e=>e.id===r);if(!i){alert(`입고 예정을 찾을 수 없습니다.`);return}await S(i.date)||n&&!n.isCurrent()||H(i)})}),document.querySelectorAll(`.btn-cancel-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!F()){alert(`입고 예정 취소 권한이 없습니다.`);return}let r=t.dataset.id,i=e.find(e=>e.id===r);if(!i){alert(`입고 예정을 찾을 수 없습니다.`);return}await S(i.date)||n&&!n.isCurrent()||W(i)})})}function F(){return u===`admin`||u===`office`}function I(e,t,n=!1){let r=e.date<t;return`
    <tr style="background:${r?`#fffdf0`:`white`}">
      <td style="color:${r?`#e67e22`:`#1a1a1a`}">${e.date} ${r?`⚠️`:``}</td>
      <td><span class="tag tag-raw">${V(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${B(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.orderStaffName||`-`}</td>
      <td>${e.orderMemo||`-`}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        ${n?`<button class="btn-secondary btn-edit-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">수정</button>`:``}
        <button class="btn-primary btn-complete" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        ${n?`<button class="btn-secondary btn-cancel-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">취소</button>`:``}
      </td>
    </tr>
  `}function L(e){let t=e.status===`completed`;return`
    <tr style="opacity:0.8">
      <td>${e.date}</td>
      <td><span class="tag tag-raw">${V(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${B(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.actualQty?B(e.actualQty,e.actualUnit||e.orderedUnit,e.orderedUnitGrams):`-`}</td>
      <td>${t?y(e.receiptDate)?e.receiptDate:b(e.completedAt)||`-`:`-`}</td>
      <td>${e.incomingStaffName||`-`}</td>
      <td>
        <span style="color:${t?`#2d7a3a`:`#e53e3e`};font-size:12px">
          ${t?`✅ 완료`:`❌ 취소`}
        </span>
      </td>
      <td>${e.completeMemo||e.cancelReason||`-`}</td>
    </tr>
  `}function R(e){return e===`마리`}function z(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function B(e,t,n){if(t===`g`)return z(e);let r=`${e}${t}`;return!R(t)||!n?r:`${r} (${z(Number(e||0)*Number(n||0))})`}function V(e){return e===`meat`?`원육`:e===`bag`?`봉투`:`계란`}async function H(t=null,n=null){let r=!!t;o(()=>delete window.updateScheduleItem);let s=D,c=O;Y(`
    <h3 class="modal-title">입고 예정 ${r?`수정`:`등록`}</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${t?.date||n?.date||d()}" />
    </div>
    <div class="form-group">
      <label>구분 *</label>
      <select id="m_type" onchange="updateScheduleItem()" ${r?`disabled`:``}>
        <option value="">선택</option>
        <option value="meat">원육</option>
        <option value="bag">봉투</option>
        <option value="egg">계란</option>
      </select>
    </div>
    <div class="form-group" id="itemSelectWrap" style="display:none;">
      <label>품목 *</label>
      <select id="m_item" ${r?`disabled`:``}>
        <option value="">선택</option>
      </select>
      ${r?`<p style="margin:6px 0 0;color:#888;font-size:11px;">구분/품목 변경은 기존 항목 취소 후 새로 등록해주세요.</p>`:``}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>발주수량 *</label>
        <input type="number" id="m_qty" placeholder="수량" value="${t?.orderedQty??``}" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <!-- [묶음 5D] 구분 선택에 따라 옵션 자동 제한 (updateScheduleItem에서 갱신) -->
        <select id="m_unit">
          <option value="">구분을 먼저 선택</option>
        </select>
      </div>
    </div>
    <div class="form-group" id="unitGramsWrap" style="display:none;">
      <label>1마리당 g *</label>
      <input type="number" id="m_unit_grams" placeholder="예: 1500" min="0" step="1" value="${t?.orderedUnitGrams??``}" />
    </div>
    <div class="form-group">
      <label>발주 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${J([`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" value="${K(t?.orderMemo||``)}" />
    </div>
    ${r?``:`<label style="display:block;margin:12px 0;"><input type="checkbox" id="m_continue" /> 저장 후 다음 품목 계속 입력 (예정일·구분·단위·담당자 유지)</label>`}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">${r?`수정`:`등록`}</button>
    </div>
  `),window.updateScheduleItem=()=>{let e=document.getElementById(`m_type`).value,n=document.getElementById(`itemSelectWrap`),i=document.getElementById(`m_item`),a=document.getElementById(`m_unit`),o={meat:{options:[[`kg`,`kg`],[`g`,`g`],[`마리`,`마리`]],default:`kg`},bag:{options:[[`박스`,`박스`],[`장`,`장`]],default:`박스`},egg:{options:[[`개`,`개`],[`판`,`판`]],default:`개`}};if(e&&o[e]){let t=o[e];a.innerHTML=t.options.map(([e,t])=>`<option value="${e}">${t}</option>`).join(``),a.value=t.default}else a.innerHTML=`<option value="">구분을 먼저 선택</option>`;if(e===`egg`){n.style.display=`none`,l();return}n.style.display=``,i.innerHTML=`<option value="">선택</option>`,(e===`meat`?s:c).filter(e=>e.active!==!1||r&&t?.itemId===e.id).forEach(e=>{i.innerHTML+=`<option value="${e.id}" data-name="${e.name}">${e.name}</option>`}),l()};let l=()=>{let e=document.getElementById(`unitGramsWrap`),t=document.getElementById(`m_unit_grams`),n=document.getElementById(`m_type`)?.value===`meat`&&document.getElementById(`m_unit`)?.value===`마리`;if(e&&(e.style.display=n?``:`none`),!n&&t&&(t.value=``),n&&t&&!t.value){let e=s.find(e=>e.id===document.getElementById(`m_item`)?.value);Number(e?.defaultUnitWeightG)>0&&(t.value=e.defaultUnitWeightG)}};document.getElementById(`m_unit`)?.addEventListener(`change`,l),document.getElementById(`m_item`)?.addEventListener(`change`,()=>{document.getElementById(`m_unit_grams`).value=``,l()}),r?(document.getElementById(`m_type`).value=t.type||``,window.updateScheduleItem(),t.type!==`egg`&&(document.getElementById(`m_item`).value=t.itemId||``),document.getElementById(`m_unit`).value=t.orderedUnit||``,document.getElementById(`m_unit_grams`).value=t.orderedUnitGrams||``,l(),document.getElementById(`m_staff`).value=t.orderStaffName||``):n&&(document.getElementById(`m_type`).value=n.type,window.updateScheduleItem(),document.getElementById(`m_unit`).value=n.unit,document.getElementById(`m_staff`).value=n.staff,document.getElementById(`m_continue`).checked=!0,l()),document.getElementById(`btnSaveSchedule`).addEventListener(`click`,()=>U(async n=>{let o=T(n,a),{addDoc:s,updateDoc:c,recordActivity:l,recordMeatLog:u}=o,{getDoc:f}=n;if(!F()){alert(`입고 예정 ${r?`수정`:`등록`} 권한이 없습니다.`);return}let p=document.getElementById(`m_date`).value,h=r?t.type:document.getElementById(`m_type`).value,g=parseFloat(document.getElementById(`m_qty`).value),_=document.getElementById(`m_unit`).value,v=R(_)?parseFloat(document.getElementById(`m_unit_grams`)?.value):null,b=document.getElementById(`m_staff`).value,x=document.getElementById(`m_memo`).value;if(!y(p)||!h||!Number.isFinite(g)||g<=0){alert(`유효한 날짜, 구분, 양수인 수량은 필수입니다.`);return}if(!b){alert(`담당자는 필수입니다.`);return}if(R(_)&&(!v||v<=0)){alert(`1마리당 g을 입력해주세요.`);return}if(r&&(await S(t.date,n)||p!==t.date&&await S(p,n)))return;let C=r&&t.itemId||null,w=r&&t.itemNameSnapshot||`계란`;if(!r&&h!==`egg`){let e=document.getElementById(`m_item`);if(C=e.value,w=e.options[e.selectedIndex]?.dataset?.name||``,!C){alert(`품목을 선택해주세요.`);return}}let E=(await j(n)).find(e=>r&&e.id===t.id||e.status!==`scheduled`||e.date!==p||e.type!==h?!1:h===`egg`?!0:e.itemId===C);if(E){alert(`이미 ${p}에 [${h===`egg`?`계란`:w}] 입고예정이 등록되어 있습니다.\n(기존: ${E.orderedQty}${E.orderedUnit})\n\n같은 날짜의 같은 품목은 중복 등록할 수 없습니다.`);return}if(r){let r={date:t.date,orderedQty:t.orderedQty,orderedUnit:t.orderedUnit,orderStaffName:t.orderStaffName||``,orderMemo:t.orderMemo||``};if(await c(e(a,`schedules`,t.id),{date:p,orderedQty:g,orderedUnit:_,orderedUnitGrams:v,orderStaffName:b,orderMemo:x,updatedAt:new Date}),await l({action:`schedule`,subAction:`edit`,date:d(),staff:b,message:`입고예정 수정 — ${w} ${r.orderedQty}${r.orderedUnit} → ${g}${_} (예정일 ${r.date} → ${p}) / 담당: ${b}`,details:{scheduleId:t.id,type:h,itemId:C,itemName:w,before:r,after:{date:p,orderedQty:g,orderedUnit:_,orderedUnitGrams:v,orderStaffName:b,orderMemo:x||``}}}),await o.commit(),!n.isCurrent())return;closeModal(),await A({force:!0}),m(`입고 예정 수정 완료!`);return}let D=await s(i(a,`schedules`),{date:p,type:h,itemId:C,itemNameSnapshot:w,orderedQty:g,orderedUnit:_,orderedUnitGrams:v,status:`scheduled`,orderStaffName:b,orderMemo:x,createdAt:new Date,updatedAt:new Date}),O=h===`egg`?`계란`:`${h===`meat`?`원육`:h===`bag`?`봉투`:``} ${w}`;await l({action:`schedule`,subAction:`register`,date:d(),staff:b,message:`입고예정 등록 — ${O} ${g}${_} (예정일 ${p}) / 담당: ${b}`,details:{scheduleId:D.id,type:h,itemId:C,itemName:w,orderedQty:g,orderedUnit:_,orderedUnitGrams:v,scheduledDate:p,memo:x||null}});let k=document.getElementById(`m_continue`)?.checked?{date:p,type:h,unit:_,staff:b}:null;if(await o.commit(),n.isCurrent())return closeModal(),await A({force:!0}),m(`입고 예정 등록 완료!`),{continueWith:k}}))}async function U(e){let t=s(),n=await k(e);n?.continueWith&&!E.blocked&&(!t||t.isCurrent())&&await H(null,n.continueWith)}function W(t){Y(`
    <h3 class="modal-title">입고예정 취소 — ${t.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${B(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>취소 사유 *</label>
      <input type="text" id="m_reason" placeholder="사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${J([`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveCancelSchedule">확인</button>
    </div>
  `),document.getElementById(`btnSaveCancelSchedule`).addEventListener(`click`,()=>k(async n=>{let r=T(n,a),{addDoc:i,updateDoc:o,recordActivity:s,recordMeatLog:c}=r,{getDoc:l}=n;if(await S(t.date,n))return;let u=document.getElementById(`m_reason`).value.trim(),f=document.getElementById(`m_staff`).value;if(!u){alert(`취소 사유는 필수입니다.`);return}if(!f){alert(`담당자는 필수입니다.`);return}await o(e(a,`schedules`,t.id),{status:`cancelled`,cancelReason:u,cancelStaffName:f,cancelledAt:new Date,updatedAt:new Date}),await s({action:`schedule`,subAction:`cancel`,date:d(),staff:f,message:`${t.itemNameSnapshot} 입고 예정 취소 / 사유: ${u} / 담당: ${f}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,unit:t.orderedUnit,scheduledDate:t.date,cancelReason:u}}),await r.commit(),n.isCurrent()&&(closeModal(),await A({force:!0}),m(`취소 완료!`))}))}function G(t){let n=t.type===`meat`&&R(t.orderedUnit),r=t.type===`meat`?n?[`마리`,`kg`,`g`]:[`kg`,`g`]:t.type===`bag`?[`박스`,`장`]:[`개`,`판`];Y(`
    <h3 class="modal-title">입고 완료 처리 — ${t.itemNameSnapshot}</h3>
    ${g({incoming:!0,reasonField:!1})}
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${B(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>실제 입고일 *</label>
      <input type="date" id="m_receipt_date" value="${d()}" max="${d()}" />
      <p style="font-size:12px;color:#888;margin:6px 0;">실제로 입고된 날짜를 선택해주세요. 마감된 날짜에는 입력할 수 없습니다.</p>
    </div>
    <div class="form-group">
      <label>실제 수량 *</label>
      <input type="number" id="m_actual" placeholder="실제 입고 수량 입력" min="0" step="any" />
    </div>
      <div class="form-group">
        <label>실제 단위</label>
        <select id="m_actual_unit">
          ${r.map(e=>`<option value="${e}" ${e===t.orderedUnit?`selected`:``}>${e}</option>`).join(``)}
        </select>
      </div>
    ${n&&!(Number(t.orderedUnitGrams)>0)?`<p style="font-size:12px;color:#805c16">총중량을 아는 경우 실제 단위에서 kg 또는 g을 선택해 입고할 수 있습니다. 개당 중량 정보가 없어 발주 중량과의 비교는 생략됩니다.</p>`:``}
    <div class="form-group">
      <label>입고 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${J(t.type===`egg`?[`senior`]:[`lead`])}
      </select>
    </div>
    <div class="form-group">
      <label>완료메모</label>
      <input type="text" id="m_memo" placeholder="메모" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveComplete">완료 처리</button>
    </div>
  `);let o=v({db:a,name:t.type===`meat`?`meatLogs`:t.type===`bag`?`bagLogs`:`eggLogs`,filter:{},reasonInput:document.getElementById(`m_memo`)});document.getElementById(`btnSaveComplete`).addEventListener(`click`,()=>k(async s=>{let{getDoc:c}=s;try{let u=_(o);if(!u)return;let p=parseFloat(document.getElementById(`m_actual`).value),g=document.getElementById(`m_actual_unit`)?.value||t.orderedUnit,v=document.getElementById(`m_staff`).value,b=document.getElementById(`m_memo`).value,C=document.getElementById(`m_receipt_date`).value;if(!Number.isFinite(p)||p<=0||!v){alert(`양수인 실제 수량과 담당자는 필수입니다.`);return}if(!r.includes(g)){alert(`실제 단위를 선택해주세요.`);return}if(!y(C)||C>d()){alert(`실제 입고일은 오늘까지의 유효한 날짜를 선택해주세요.`);return}if(n&&g===`마리`&&(!t.orderedUnitGrams||t.orderedUnitGrams<=0)){alert(`이 발주의 1마리당 g 정보가 없습니다. 발주를 수정해 1마리당 g을 입력해주세요.`);return}if(await S(C,s))return;let w=null;if(t.type===`bag`){let n=await c(e(a,`bagTypes`,t.itemId));if(!n.exists())throw Error(`봉투를 찾을 수 없습니다.`);w=n.data()}let T=(e,n)=>t.type===`meat`?n===`g`?e:n===`kg`?e*1e3:n===`마리`&&Number(t.orderedUnitGrams)>0?e*Number(t.orderedUnitGrams):NaN:t.type===`bag`?n===`장`?e:n===`박스`&&Number.isInteger(w?.piecesPerBox)&&w.piecesPerBox>0?e*w.piecesPerBox:NaN:n===`개`?e:n===`판`?e*30:NaN,E=T(p,g),D=T(Number(t.orderedQty),t.orderedUnit);if(!Number.isFinite(E)||E<=0||t.type!==`meat`&&!Number.isInteger(E)){alert(t.type===`bag`&&g===`박스`&&!Number.isFinite(E)?`박스당 수량 정보가 없습니다. 실제 장수로 입력해주세요.`:`입고 수량·단위를 확인해주세요.`);return}let O=Number.isFinite(D),k=O?Math.abs(E-D)>2**-52*8*Math.max(1,Math.abs(E),Math.abs(D)):null;if(k&&!await l({title:`수량 차이 확인`,message:`발주 수량과 실제 수량이 다릅니다.\n\n발주: ${B(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}\n실제: ${B(p,g,t.orderedUnitGrams)}\n\n이대로 완료 처리하시겠습니까?`,confirmText:`완료 처리`}))return;let j=t.type===`meat`?`meatLogs`:t.type===`bag`?`bagLogs`:`eggLogs`,M,N=null,P=0,F;if(t.type===`meat`)M=e(i(a,`meatStocks`)).id,N={meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,incomingDate:C,initialQtyG:E,remaining:0,staffName:v,note:`입고예정 완료`,createdAt:new Date},F={type:`frozenIncoming`,date:C,meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,meatStockId:M,delta:E,staff:v,reason:`입고예정 완료`};else if(t.type===`bag`)M=t.itemId,P=Number(w.currentQty||0),F={type:`incoming`,date:C,bagTypeId:M,bagNameSnapshot:t.itemNameSnapshot,qty:E,staffName:v,note:`입고예정 완료`};else{M=`global`;let t=await c(e(a,`eggStock`,M));P=t.exists()?Number(t.data().currentQty||0):0,N={currentQty:0,minimumQty:0},F={type:`in`,date:C,qty:E,staffName:v,note:`입고예정 완료`}}if(!Number.isFinite(E)||E<=0||t.type!==`meat`&&!Number.isInteger(E))throw Error(`입고 수량·단위를 확인해주세요.`);let I=u.kind===`test`?{approved:!0}:await x({itemId:j+`:`+(t.type===`egg`?`egg`:t.itemId),date:C,qty:t.type===`meat`?E/1e3:E,unit:t.type===`meat`?`kg`:t.type===`bag`?`장`:`개`,stage:t.type===`meat`?`원료`:t.type===`bag`?`봉투`:`계란`},s.isCurrent);if(!I.approved||(I.review&&(F.statsQuantityReview=I.review),await h({db:a,command:s,name:j,stockId:M,stockData:N,expectedBefore:P,log:F,selection:u,uid:f?.uid||null,activity:u.kind===`test`?null:{action:`schedule`,subAction:k?`completeDiff`:`complete`,message:O?k?`${t.itemNameSnapshot} 입고 완료 ⚠️ 발주 ${B(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)} → 실제 ${B(p,g,t.orderedUnitGrams)} / 담당: ${v}`:`${t.itemNameSnapshot} 입고 완료 차이 없음 / 담당: ${v}`:`${t.itemNameSnapshot} 입고 완료 · 발주 ${t.type===`meat`?`중량`:`수량`} 비교 불가 (환산 정보 없음) / 담당: ${v}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,actualQty:p,unit:g,orderedUnit:t.orderedUnit,orderedUnitGrams:t.orderedUnitGrams||null,receiptDate:C,hasDiff:k,comparisonAvailable:O,memo:b||null}},scheduleChange:{id:t.id,expected:{type:t.type,itemId:t.itemId||null,date:t.date,orderedQty:t.orderedQty,orderedUnit:t.orderedUnit,orderedUnitGrams:t.orderedUnitGrams||null},patch:{status:`completed`,actualQty:p,actualUnit:g,actualQtyG:t.type===`meat`?E:null,receiptDate:C,incomingStaffName:v,completeMemo:b}}}),!s.isCurrent()))return;closeModal(),await A({force:!0}),m(`완료 처리되었습니다!`)}catch(e){console.error(`입고 완료 처리 오류:`,e),alert(`완료 처리 중 오류가 발생했습니다.\n\n${e.code||``} ${e.message}\n\n이 메시지를 관리자에게 전달해주세요.`)}},[`admin`,`office`,`production`]))}function K(e){return String(e??``).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var q={};function J(e){let t=``;for(let n of e)(q[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Y(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`schedule`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function X(t){let n=[`senior`,`lead`,`office`],[r,i,o,...s]=await Promise.all([j(t),M(t),N(t),...n.map(n=>t.getDoc(e(a,`staffGroups`,n)))]);return{schedules:r,meatTypes:i,bagTypes:o,staff:Object.fromEntries(n.map((e,t)=>[e,s[t].exists()&&s[t].data().members||[]]))}}function Z({cacheOnly:e=!0}={}){return E.prepare?.(`default`,X,{cacheOnly:e})}export{Z as preparePage,A as renderSchedule};