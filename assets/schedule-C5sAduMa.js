import{b as e,d as t,s as n,u as r,y as i}from"./index.esm-CWp5uCwe.js";import{n as a}from"./firebase-Bm8Fqw4J.js";import{i as o,r as s}from"./pageLifecycle-_b6L3DA3.js";import{n as c}from"./modalManager-D53QKIlh.js";import{n as l}from"./modal-IG9zwovL.js";import{G as u,L as d,W as f,f as p}from"./index-Uw9lmWdC.js";import{t as m}from"./statusToast-DAQ_Eu62.js";import{i as h,n as g,r as _,t as v}from"./movementForm-YdnAH_bu.js";import{t as y}from"./statsAutomationRuntime-DctIed_w.js";import{t as b}from"./closingGuard-D1UC9xqW.js";import{t as x}from"./readCommand-D_ouy8hj.js";import{t as S}from"./pageRefresh-D6fvLpZN.js";import{t as C}from"./commandBatch-CEEFs40g.js";var w=p(`schedule`),T=[],E=[];async function D(e,t=[`admin`,`office`]){let n=s();try{return await x(w,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[입고 예정 저장]`,e),alert(e.message)}}async function O({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`;let n=await w.load(e=>q(e),{force:e,onChange:S(w,O)});!n||!t.isConnected||(T=n.meatTypes,E=n.bagTypes,W=n.staff,M(n.schedules))}async function k(e={getDocs:n}){let o=t(i(a,`schedules`),r(`date`,`asc`)),s=(await e.getDocs(o)).docs.map(e=>({id:e.id,...e.data()}));return s.sort((e,t)=>{if(e.date!==t.date)return e.date.localeCompare(t.date);let n=e.createdAt?.toMillis?e.createdAt.toMillis():0;return(t.createdAt?.toMillis?t.createdAt.toMillis():0)-n}),s}async function A(e={getDocs:n}){return(await e.getDocs(i(a,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()}))}async function j(e={getDocs:n}){return(await e.getDocs(i(a,`bagTypes`))).docs.map(e=>({id:e.id,...e.data()}))}function M(e){let t=document.getElementById(`mainContent`),n=s(),r=d(),i=N(),a=e.filter(e=>e.status===`scheduled`),o=e.filter(e=>e.status!==`scheduled`),c=!1;t.innerHTML=`
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
            ${a.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>`:a.map(e=>P(e,r,i)).join(``)}
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
                <th>입고담당자</th>
                <th>상태</th>
                <th>완료메모</th>
              </tr>
            </thead>
            <tbody>
              ${o.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>`:o.map(e=>F(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddSchedule`)?.addEventListener(`click`,()=>B()),document.getElementById(`btnToggleDone`).addEventListener(`click`,()=>{let e=document.getElementById(`doneSection`);c=!c,e.style.display=c?``:`none`,document.getElementById(`btnToggleDone`).textContent=c?`완료/취소 항목 숨기기`:`완료/취소 항목 보기`}),document.querySelectorAll(`.btn-complete`).forEach(t=>{t.addEventListener(`click`,async()=>{try{let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`일정을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.`);return}H(r)}catch(e){console.error(`완료 버튼 오류:`,e),alert(`오류가 발생했습니다: `+e.message)}})}),document.querySelectorAll(`.btn-edit-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!N()){alert(`입고 예정 수정 권한이 없습니다.`);return}let r=t.dataset.id,i=e.find(e=>e.id===r);if(!i){alert(`입고 예정을 찾을 수 없습니다.`);return}await b(i.date)||n&&!n.isCurrent()||B(i)})}),document.querySelectorAll(`.btn-cancel-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!N()){alert(`입고 예정 취소 권한이 없습니다.`);return}let r=t.dataset.id,i=e.find(e=>e.id===r);if(!i){alert(`입고 예정을 찾을 수 없습니다.`);return}await b(i.date)||n&&!n.isCurrent()||V(i)})})}function N(){return u===`admin`||u===`office`||u===`production`}function P(e,t,n=!1){let r=e.date<t;return`
    <tr style="background:${r?`#fffdf0`:`white`}">
      <td style="color:${r?`#e67e22`:`#1a1a1a`}">${e.date} ${r?`⚠️`:``}</td>
      <td><span class="tag tag-raw">${z(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${R(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.orderStaffName||`-`}</td>
      <td>${e.orderMemo||`-`}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        ${n?`<button class="btn-secondary btn-edit-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">수정</button>`:``}
        <button class="btn-primary btn-complete" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        ${n?`<button class="btn-secondary btn-cancel-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">취소</button>`:``}
      </td>
    </tr>
  `}function F(e){let t=e.status===`completed`;return`
    <tr style="opacity:0.8">
      <td>${e.date}</td>
      <td><span class="tag tag-raw">${z(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${R(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.actualQty?R(e.actualQty,e.actualUnit||e.orderedUnit,e.orderedUnitGrams):`-`}</td>
      <td>${e.incomingStaffName||`-`}</td>
      <td>
        <span style="color:${t?`#2d7a3a`:`#e53e3e`};font-size:12px">
          ${t?`✅ 완료`:`❌ 취소`}
        </span>
      </td>
      <td>${e.completeMemo||e.cancelReason||`-`}</td>
    </tr>
  `}function I(e){return e===`마리`}function L(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function R(e,t,n){if(t===`g`)return L(e);let r=`${e}${t}`;return!I(t)||!n?r:`${r} (${L(Number(e||0)*Number(n||0))})`}function z(e){return e===`meat`?`원육`:e===`bag`?`봉투`:`계란`}async function B(t=null){let n=!!t;o(()=>delete window.updateScheduleItem);let r=T,s=E;K(`
    <h3 class="modal-title">입고 예정 ${n?`수정`:`등록`}</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${t?.date||d()}" />
    </div>
    <div class="form-group">
      <label>구분 *</label>
      <select id="m_type" onchange="updateScheduleItem()" ${n?`disabled`:``}>
        <option value="">선택</option>
        <option value="meat">원육</option>
        <option value="bag">봉투</option>
        <option value="egg">계란</option>
      </select>
    </div>
    <div class="form-group" id="itemSelectWrap" style="display:none;">
      <label>품목 *</label>
      <select id="m_item" ${n?`disabled`:``}>
        <option value="">선택</option>
      </select>
      ${n?`<p style="margin:6px 0 0;color:#888;font-size:11px;">구분/품목 변경은 기존 항목 취소 후 새로 등록해주세요.</p>`:``}
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
      <label>발주 담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${G([`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" value="${U(t?.orderMemo||``)}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">${n?`수정`:`등록`}</button>
    </div>
  `),window.updateScheduleItem=()=>{let e=document.getElementById(`m_type`).value,i=document.getElementById(`itemSelectWrap`),a=document.getElementById(`m_item`),o=document.getElementById(`m_unit`),l={meat:{options:[[`kg`,`kg`],[`g`,`g`],[`마리`,`마리`]],default:`kg`},bag:{options:[[`박스`,`박스`],[`장`,`장`]],default:`박스`},egg:{options:[[`개`,`개`],[`판`,`판`]],default:`개`}};if(e&&l[e]){let t=l[e];o.innerHTML=t.options.map(([e,t])=>`<option value="${e}">${t}</option>`).join(``),o.value=t.default}else o.innerHTML=`<option value="">구분을 먼저 선택</option>`;if(e===`egg`){i.style.display=`none`,c();return}i.style.display=``,a.innerHTML=`<option value="">선택</option>`,(e===`meat`?r:s).filter(e=>e.active!==!1||n&&t?.itemId===e.id).forEach(e=>{a.innerHTML+=`<option value="${e.id}" data-name="${e.name}">${e.name}</option>`}),c()};let c=()=>{let e=document.getElementById(`unitGramsWrap`),t=document.getElementById(`m_unit_grams`),n=document.getElementById(`m_type`)?.value===`meat`&&document.getElementById(`m_unit`)?.value===`마리`;e&&(e.style.display=n?``:`none`),!n&&t&&(t.value=``)};document.getElementById(`m_unit`)?.addEventListener(`change`,c),n&&(document.getElementById(`m_type`).value=t.type||``,window.updateScheduleItem(),t.type!==`egg`&&(document.getElementById(`m_item`).value=t.itemId||``),document.getElementById(`m_unit`).value=t.orderedUnit||``,document.getElementById(`m_unit_grams`).value=t.orderedUnitGrams||``,c(),document.getElementById(`m_staff`).value=t.orderStaffName||``),document.getElementById(`btnSaveSchedule`).addEventListener(`click`,()=>D(async r=>{let o=C(r,a),{addDoc:s,updateDoc:c,recordActivity:l,recordMeatLog:u}=o,{getDoc:f}=r;if(!N()){alert(`입고 예정 ${n?`수정`:`등록`} 권한이 없습니다.`);return}let p=document.getElementById(`m_date`).value,m=n?t.type:document.getElementById(`m_type`).value,h=parseFloat(document.getElementById(`m_qty`).value),g=document.getElementById(`m_unit`).value,_=I(g)?parseFloat(document.getElementById(`m_unit_grams`)?.value):null,v=document.getElementById(`m_staff`).value,y=document.getElementById(`m_memo`).value;if(!p||!m||!h){alert(`날짜, 구분, 수량은 필수입니다.`);return}if(!v){alert(`담당자는 필수입니다.`);return}if(I(g)&&(!_||_<=0)){alert(`1마리당 g을 입력해주세요.`);return}if(n&&(await b(t.date,r)||p!==t.date&&await b(p,r)))return;let x=n&&t.itemId||null,S=n&&t.itemNameSnapshot||`계란`;if(!n&&m!==`egg`){let e=document.getElementById(`m_item`);if(x=e.value,S=e.options[e.selectedIndex]?.dataset?.name||``,!x){alert(`품목을 선택해주세요.`);return}}let w=(await k(r)).find(e=>n&&e.id===t.id||e.status!==`scheduled`||e.date!==p||e.type!==m?!1:m===`egg`?!0:e.itemId===x);if(w){alert(`이미 ${p}에 [${m===`egg`?`계란`:S}] 입고예정이 등록되어 있습니다.\n(기존: ${w.orderedQty}${w.orderedUnit})\n\n같은 날짜의 같은 품목은 중복 등록할 수 없습니다.`);return}if(n){let n={date:t.date,orderedQty:t.orderedQty,orderedUnit:t.orderedUnit,orderStaffName:t.orderStaffName||``,orderMemo:t.orderMemo||``};if(await c(e(a,`schedules`,t.id),{date:p,orderedQty:h,orderedUnit:g,orderedUnitGrams:_,orderStaffName:v,orderMemo:y,updatedAt:new Date}),await l({action:`schedule`,subAction:`edit`,date:d(),staff:v,message:`입고예정 수정 — ${S} ${n.orderedQty}${n.orderedUnit} → ${h}${g} (예정일 ${n.date} → ${p}) / 담당: ${v}`,details:{scheduleId:t.id,type:m,itemId:x,itemName:S,before:n,after:{date:p,orderedQty:h,orderedUnit:g,orderedUnitGrams:_,orderStaffName:v,orderMemo:y||``}}}),await o.commit(),!r.isCurrent())return;closeModal(),await O({force:!0}),alert(`입고 예정 수정 완료!`);return}let T=await s(i(a,`schedules`),{date:p,type:m,itemId:x,itemNameSnapshot:S,orderedQty:h,orderedUnit:g,orderedUnitGrams:_,status:`scheduled`,orderStaffName:v,orderMemo:y,createdAt:new Date,updatedAt:new Date}),E=m===`egg`?`계란`:`${m===`meat`?`원육`:m===`bag`?`봉투`:``} ${S}`;await l({action:`schedule`,subAction:`register`,date:d(),staff:v,message:`입고예정 등록 — ${E} ${h}${g} (예정일 ${p}) / 담당: ${v}`,details:{scheduleId:T.id,type:m,itemId:x,itemName:S,orderedQty:h,orderedUnit:g,orderedUnitGrams:_,scheduledDate:p,memo:y||null}}),await o.commit(),r.isCurrent()&&(closeModal(),await O({force:!0}),alert(`입고 예정 등록 완료!`))}))}function V(t){K(`
    <h3 class="modal-title">입고예정 취소 — ${t.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${R(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>취소 사유 *</label>
      <input type="text" id="m_reason" placeholder="사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${G([`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveCancelSchedule">확인</button>
    </div>
  `),document.getElementById(`btnSaveCancelSchedule`).addEventListener(`click`,()=>D(async n=>{let r=C(n,a),{addDoc:i,updateDoc:o,recordActivity:s,recordMeatLog:c}=r,{getDoc:l}=n;if(await b(t.date,n))return;let u=document.getElementById(`m_reason`).value.trim(),f=document.getElementById(`m_staff`).value;if(!u){alert(`취소 사유는 필수입니다.`);return}if(!f){alert(`담당자는 필수입니다.`);return}await o(e(a,`schedules`,t.id),{status:`cancelled`,cancelReason:u,cancelStaffName:f,cancelledAt:new Date,updatedAt:new Date}),await s({action:`schedule`,subAction:`cancel`,date:d(),staff:f,message:`${t.itemNameSnapshot} 입고 예정 취소 / 사유: ${u} / 담당: ${f}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,unit:t.orderedUnit,scheduledDate:t.date,cancelReason:u}}),await r.commit(),n.isCurrent()&&(closeModal(),await O({force:!0}),alert(`취소 완료!`))}))}function H(t){let n=t.type===`meat`&&I(t.orderedUnit);K(`
    <h3 class="modal-title">입고 완료 처리 — ${t.itemNameSnapshot}</h3>
    ${g({incoming:!0,reasonField:!1})}
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${R(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>실제 수량 *</label>
      <input type="number" id="m_actual" placeholder="실제 입고 수량 입력" />
    </div>
    ${n?`
      <div class="form-group">
        <label>실제 단위</label>
        <select id="m_actual_unit">
          <option value="${t.orderedUnit}">${t.orderedUnit}</option>
          <option value="g">g</option>
        </select>
      </div>
    `:``}
    ${n&&!(Number(t.orderedUnitGrams)>0)?`<p style="font-size:12px;color:#805c16">총중량을 아는 경우 실제 단위에서 g을 선택해 입고할 수 있습니다. 개당 중량 정보가 없어 발주 중량과의 비교는 생략됩니다.</p>`:``}
    <div class="form-group">
      <label>입고 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${G(t.type===`egg`?[`senior`]:[`lead`])}
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
  `);let r=v({db:a,name:t.type===`meat`?`meatLogs`:t.type===`bag`?`bagLogs`:`eggLogs`,filter:{},reasonInput:document.getElementById(`m_memo`)});document.getElementById(`btnSaveComplete`).addEventListener(`click`,()=>D(async o=>{let{getDoc:s}=o;try{let c=_(r);if(!c)return;let u=parseFloat(document.getElementById(`m_actual`).value),p=document.getElementById(`m_actual_unit`)?.value||t.orderedUnit,g=document.getElementById(`m_staff`).value,v=document.getElementById(`m_memo`).value;if(!u||!g){alert(`실제 수량과 담당자는 필수입니다.`);return}if(n&&p!==`g`&&(!t.orderedUnitGrams||t.orderedUnitGrams<=0)){alert(`이 발주의 1마리당 g 정보가 없습니다. 발주를 수정해 1마리당 g을 입력해주세요.`);return}let x=d();if(await b(x,o))return;let S=!(n&&p===`g`&&!(Number(t.orderedUnitGrams)>0)),C=I(t.orderedUnit)&&p===`g`?Number(t.orderedQty||0)*Number(t.orderedUnitGrams||0):Number(t.orderedQty||0),w=S?u!==C:null;if(w&&!await l({title:`수량 차이 확인`,message:`발주 수량과 실제 수량이 다릅니다.\n\n발주: ${R(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}\n실제: ${R(u,p,t.orderedUnitGrams)}\n\n이대로 완료 처리하시겠습니까?`,confirmText:`완료 처리`}))return;let T=t.type===`meat`?`meatLogs`:t.type===`bag`?`bagLogs`:`eggLogs`,E,D=null,k=0,A,j;if(t.type===`meat`)E=e(i(a,`meatStocks`)).id,A=I(t.orderedUnit)?p===`g`?u:u*Number(t.orderedUnitGrams||0):t.orderedUnit===`kg`?u*1e3:u,D={meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,incomingDate:x,initialQtyG:A,remaining:0,staffName:g,note:`입고예정 완료`,createdAt:new Date},j={type:`frozenIncoming`,date:x,meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,meatStockId:E,delta:A,staff:g,reason:`입고예정 완료`};else if(t.type===`bag`){E=t.itemId;let n=await s(e(a,`bagTypes`,E));if(!n.exists())throw Error(`봉투를 찾을 수 없습니다.`);k=Number(n.data().currentQty||0),A=t.orderedUnit===`박스`?u*(n.data().piecesPerBox||1):u,j={type:`incoming`,date:x,bagTypeId:E,bagNameSnapshot:t.itemNameSnapshot,qty:A,staffName:g,note:`입고예정 완료`}}else{E=`global`;let n=await s(e(a,`eggStock`,E));k=n.exists()?Number(n.data().currentQty||0):0,D={currentQty:0,minimumQty:0},A=t.orderedUnit===`판`?u*30:u,j={type:`in`,date:x,qty:A,staffName:g,note:`입고예정 완료`}}if(!Number.isFinite(A)||A<=0||t.type!==`meat`&&!Number.isInteger(A))throw Error(`입고 수량·단위를 확인해주세요.`);let M=c.kind===`test`?{approved:!0}:await y({itemId:T+`:`+(t.type===`egg`?`egg`:t.itemId),date:x,qty:t.type===`meat`?A/1e3:A,unit:t.type===`meat`?`kg`:t.type===`bag`?`장`:`개`,stage:t.type===`meat`?`원료`:t.type===`bag`?`봉투`:`계란`},o.isCurrent);if(!M.approved||(M.review&&(j.statsQuantityReview=M.review),await h({db:a,command:o,name:T,stockId:E,stockData:D,expectedBefore:k,log:j,selection:c,uid:f?.uid||null,activity:c.kind===`test`?null:{action:`schedule`,subAction:w?`completeDiff`:`complete`,message:S?w?`${t.itemNameSnapshot} 입고 완료 ⚠️ 발주 ${R(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)} → 실제 ${R(u,p,t.orderedUnitGrams)} / 담당: ${g}`:`${t.itemNameSnapshot} 입고 완료 차이 없음 / 담당: ${g}`:`${t.itemNameSnapshot} 입고 완료 · 발주 중량 비교 불가 (개당 중량 정보 없음) / 담당: ${g}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,actualQty:u,unit:p,orderedUnit:t.orderedUnit,orderedUnitGrams:t.orderedUnitGrams||null,hasDiff:w,comparisonAvailable:S,memo:v||null}},scheduleChange:{id:t.id,expected:{type:t.type,itemId:t.itemId||null,date:t.date,orderedQty:t.orderedQty,orderedUnit:t.orderedUnit,orderedUnitGrams:t.orderedUnitGrams||null},patch:{status:`completed`,actualQty:u,actualUnit:p,actualQtyG:t.type===`meat`?A:null,incomingStaffName:g,completeMemo:v}}}),!o.isCurrent()))return;closeModal(),await O({force:!0}),m(`완료 처리되었습니다!`)}catch(e){console.error(`입고 완료 처리 오류:`,e),alert(`완료 처리 중 오류가 발생했습니다.\n\n${e.code||``} ${e.message}\n\n이 메시지를 관리자에게 전달해주세요.`)}},[`admin`,`office`,`production`]))}function U(e){return String(e??``).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var W={};function G(e){let t=``;for(let n of e)(W[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function K(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`schedule`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function q(t){let n=[`senior`,`lead`,`office`],[r,i,o,...s]=await Promise.all([k(t),A(t),j(t),...n.map(n=>t.getDoc(e(a,`staffGroups`,n)))]);return{schedules:r,meatTypes:i,bagTypes:o,staff:Object.fromEntries(n.map((e,t)=>[e,s[t].exists()&&s[t].data().members||[]]))}}function J({cacheOnly:e=!0}={}){return w.prepare?.(`default`,q,{cacheOnly:e})}export{J as preparePage,O as renderSchedule};