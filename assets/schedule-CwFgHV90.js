import{b as e,d as t,s as n,u as r,y as i}from"./index.esm-rHmxwfvm.js";import{n as a}from"./firebase-qGjqjNvO.js";import{a as o}from"./formDraft-DoA-Ia7D.js";import{C as s,G as c,L as l,S as u,f as d,m as f}from"./index-D8R-o4n_.js";import{t as p}from"./closingGuard-BOesWeO7.js";import{t as m}from"./readCommand-BqPIk0V7.js";import{t as h}from"./pageRefresh-CF2RoGUC.js";import{t as g}from"./commandBatch-DV5iGusZ.js";var _=f(`schedule`),v=[],y=[];async function b(e,t=[`admin`,`office`]){let n=u();try{return await m(_,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[입고 예정 저장]`,e),alert(e.message)}}async function x({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`;let n=await _.load(e=>B(e),{force:e,onChange:h(_,x)});!n||!t.isConnected||(v=n.meatTypes,y=n.bagTypes,L=n.staff,T(n.schedules))}async function S(e={getDocs:n}){let o=t(i(a,`schedules`),r(`date`,`asc`)),s=(await e.getDocs(o)).docs.map(e=>({id:e.id,...e.data()}));return s.sort((e,t)=>{if(e.date!==t.date)return e.date.localeCompare(t.date);let n=e.createdAt?.toMillis?e.createdAt.toMillis():0;return(t.createdAt?.toMillis?t.createdAt.toMillis():0)-n}),s}async function C(e={getDocs:n}){return(await e.getDocs(i(a,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()}))}async function w(e={getDocs:n}){return(await e.getDocs(i(a,`bagTypes`))).docs.map(e=>({id:e.id,...e.data()}))}function T(e){let t=document.getElementById(`mainContent`),n=l(),r=E(),i=e.filter(e=>e.status===`scheduled`),a=e.filter(e=>e.status!==`scheduled`),o=!1;t.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">입고 예정관리</h2>
        ${r?`<button class="btn-primary" id="btnAddSchedule">+ 입고 예정 등록</button>`:``}
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
            ${i.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>`:i.map(e=>D(e,n,r)).join(``)}
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
              ${a.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>`:a.map(e=>O(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddSchedule`)?.addEventListener(`click`,()=>N()),document.getElementById(`btnToggleDone`).addEventListener(`click`,()=>{let e=document.getElementById(`doneSection`);o=!o,e.style.display=o?``:`none`,document.getElementById(`btnToggleDone`).textContent=o?`완료/취소 항목 숨기기`:`완료/취소 항목 보기`}),document.querySelectorAll(`.btn-complete`).forEach(t=>{t.addEventListener(`click`,async()=>{try{let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`일정을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.`);return}F(r)}catch(e){console.error(`완료 버튼 오류:`,e),alert(`오류가 발생했습니다: `+e.message)}})}),document.querySelectorAll(`.btn-edit-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!E()){alert(`입고 예정 수정 권한이 없습니다.`);return}let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`입고 예정을 찾을 수 없습니다.`);return}await p(r.date)||page&&!page.isCurrent()||N(r)})}),document.querySelectorAll(`.btn-cancel-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!E()){alert(`입고 예정 취소 권한이 없습니다.`);return}let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`입고 예정을 찾을 수 없습니다.`);return}await p(r.date)||page&&!page.isCurrent()||P(r)})})}function E(){return c===`admin`||c===`office`||c===`production`}function D(e,t,n=!1){let r=e.date<t;return`
    <tr style="background:${r?`#fffdf0`:`white`}">
      <td style="color:${r?`#e67e22`:`#1a1a1a`}">${e.date} ${r?`⚠️`:``}</td>
      <td><span class="tag tag-raw">${M(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${j(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.orderStaffName||`-`}</td>
      <td>${e.orderMemo||`-`}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        ${n?`<button class="btn-secondary btn-edit-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">수정</button>`:``}
        <button class="btn-primary btn-complete" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        ${n?`<button class="btn-secondary btn-cancel-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">취소</button>`:``}
      </td>
    </tr>
  `}function O(e){let t=e.status===`completed`;return`
    <tr style="opacity:0.8">
      <td>${e.date}</td>
      <td><span class="tag tag-raw">${M(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${j(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.actualQty?j(e.actualQty,e.actualUnit||e.orderedUnit,e.orderedUnitGrams):`-`}</td>
      <td>${e.incomingStaffName||`-`}</td>
      <td>
        <span style="color:${t?`#2d7a3a`:`#e53e3e`};font-size:12px">
          ${t?`✅ 완료`:`❌ 취소`}
        </span>
      </td>
      <td>${e.completeMemo||e.cancelReason||`-`}</td>
    </tr>
  `}function k(e){return e===`마리`}function A(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function j(e,t,n){if(t===`g`)return A(e);let r=`${e}${t}`;return!k(t)||!n?r:`${r} (${A(Number(e||0)*Number(n||0))})`}function M(e){return e===`meat`?`원육`:e===`bag`?`봉투`:`계란`}async function N(t=null){let n=!!t;s(()=>delete window.updateScheduleItem);let r=v,o=y;z(`
    <h3 class="modal-title">입고 예정 ${n?`수정`:`등록`}</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${t?.date||l()}" />
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
        ${R([`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" value="${I(t?.orderMemo||``)}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">${n?`수정`:`등록`}</button>
    </div>
  `),window.updateScheduleItem=()=>{let e=document.getElementById(`m_type`).value,i=document.getElementById(`itemSelectWrap`),a=document.getElementById(`m_item`),s=document.getElementById(`m_unit`),l={meat:{options:[[`kg`,`kg`],[`g`,`g`],[`마리`,`마리`]],default:`kg`},bag:{options:[[`박스`,`박스`],[`장`,`장`]],default:`박스`},egg:{options:[[`개`,`개`],[`판`,`판`]],default:`개`}};if(e&&l[e]){let t=l[e];s.innerHTML=t.options.map(([e,t])=>`<option value="${e}">${t}</option>`).join(``),s.value=t.default}else s.innerHTML=`<option value="">구분을 먼저 선택</option>`;if(e===`egg`){i.style.display=`none`,c();return}i.style.display=``,a.innerHTML=`<option value="">선택</option>`,(e===`meat`?r:o).filter(e=>e.active!==!1||n&&t?.itemId===e.id).forEach(e=>{a.innerHTML+=`<option value="${e.id}" data-name="${e.name}">${e.name}</option>`}),c()};let c=()=>{let e=document.getElementById(`unitGramsWrap`),t=document.getElementById(`m_unit_grams`),n=document.getElementById(`m_type`)?.value===`meat`&&document.getElementById(`m_unit`)?.value===`마리`;e&&(e.style.display=n?``:`none`),!n&&t&&(t.value=``)};document.getElementById(`m_unit`)?.addEventListener(`change`,c),n&&(document.getElementById(`m_type`).value=t.type||``,window.updateScheduleItem(),t.type!==`egg`&&(document.getElementById(`m_item`).value=t.itemId||``),document.getElementById(`m_unit`).value=t.orderedUnit||``,document.getElementById(`m_unit_grams`).value=t.orderedUnitGrams||``,c(),document.getElementById(`m_staff`).value=t.orderStaffName||``),document.getElementById(`btnSaveSchedule`).addEventListener(`click`,()=>b(async r=>{let o=g(r,a),{addDoc:s,updateDoc:c,recordActivity:u,recordMeatLog:d}=o,{getDoc:f}=r;if(!E()){alert(`입고 예정 ${n?`수정`:`등록`} 권한이 없습니다.`);return}let m=document.getElementById(`m_date`).value,h=n?t.type:document.getElementById(`m_type`).value,_=parseFloat(document.getElementById(`m_qty`).value),v=document.getElementById(`m_unit`).value,y=k(v)?parseFloat(document.getElementById(`m_unit_grams`)?.value):null,b=document.getElementById(`m_staff`).value,C=document.getElementById(`m_memo`).value;if(!m||!h||!_){alert(`날짜, 구분, 수량은 필수입니다.`);return}if(!b){alert(`담당자는 필수입니다.`);return}if(k(v)&&(!y||y<=0)){alert(`1마리당 g을 입력해주세요.`);return}if(n&&(await p(t.date,r)||m!==t.date&&await p(m,r)))return;let w=n&&t.itemId||null,T=n&&t.itemNameSnapshot||`계란`;if(!n&&h!==`egg`){let e=document.getElementById(`m_item`);if(w=e.value,T=e.options[e.selectedIndex]?.dataset?.name||``,!w){alert(`품목을 선택해주세요.`);return}}let D=(await S(r)).find(e=>n&&e.id===t.id||e.status!==`scheduled`||e.date!==m||e.type!==h?!1:h===`egg`?!0:e.itemId===w);if(D){alert(`이미 ${m}에 [${h===`egg`?`계란`:T}] 입고예정이 등록되어 있습니다.\n(기존: ${D.orderedQty}${D.orderedUnit})\n\n같은 날짜의 같은 품목은 중복 등록할 수 없습니다.`);return}if(n){let n={date:t.date,orderedQty:t.orderedQty,orderedUnit:t.orderedUnit,orderStaffName:t.orderStaffName||``,orderMemo:t.orderMemo||``};if(await c(e(a,`schedules`,t.id),{date:m,orderedQty:_,orderedUnit:v,orderedUnitGrams:y,orderStaffName:b,orderMemo:C,updatedAt:new Date}),await u({action:`schedule`,subAction:`edit`,date:l(),staff:b,message:`입고예정 수정 — ${T} ${n.orderedQty}${n.orderedUnit} → ${_}${v} (예정일 ${n.date} → ${m}) / 담당: ${b}`,details:{scheduleId:t.id,type:h,itemId:w,itemName:T,before:n,after:{date:m,orderedQty:_,orderedUnit:v,orderedUnitGrams:y,orderStaffName:b,orderMemo:C||``}}}),await o.commit(),!r.isCurrent())return;closeModal(),await x({force:!0}),alert(`입고 예정 수정 완료!`);return}let O=await s(i(a,`schedules`),{date:m,type:h,itemId:w,itemNameSnapshot:T,orderedQty:_,orderedUnit:v,orderedUnitGrams:y,status:`scheduled`,orderStaffName:b,orderMemo:C,createdAt:new Date,updatedAt:new Date}),A=h===`egg`?`계란`:`${h===`meat`?`원육`:h===`bag`?`봉투`:``} ${T}`;await u({action:`schedule`,subAction:`register`,date:l(),staff:b,message:`입고예정 등록 — ${A} ${_}${v} (예정일 ${m}) / 담당: ${b}`,details:{scheduleId:O.id,type:h,itemId:w,itemName:T,orderedQty:_,orderedUnit:v,orderedUnitGrams:y,scheduledDate:m,memo:C||null}}),await o.commit(),r.isCurrent()&&(closeModal(),await x({force:!0}),alert(`입고 예정 등록 완료!`))}))}function P(t){z(`
    <h3 class="modal-title">입고예정 취소 — ${t.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${j(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>취소 사유 *</label>
      <input type="text" id="m_reason" placeholder="사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${R([`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveCancelSchedule">확인</button>
    </div>
  `),document.getElementById(`btnSaveCancelSchedule`).addEventListener(`click`,()=>b(async n=>{let r=g(n,a),{addDoc:i,updateDoc:o,recordActivity:s,recordMeatLog:c}=r,{getDoc:u}=n;if(await p(t.date,n))return;let d=document.getElementById(`m_reason`).value.trim(),f=document.getElementById(`m_staff`).value;if(!d){alert(`취소 사유는 필수입니다.`);return}if(!f){alert(`담당자는 필수입니다.`);return}await o(e(a,`schedules`,t.id),{status:`cancelled`,cancelReason:d,cancelStaffName:f,cancelledAt:new Date,updatedAt:new Date}),await s({action:`schedule`,subAction:`cancel`,date:l(),staff:f,message:`${t.itemNameSnapshot} 입고 예정 취소 / 사유: ${d} / 담당: ${f}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,unit:t.orderedUnit,scheduledDate:t.date,cancelReason:d}}),await r.commit(),n.isCurrent()&&(closeModal(),await x({force:!0}),alert(`취소 완료!`))}))}function F(t){let n=t.type===`meat`&&k(t.orderedUnit);z(`
    <h3 class="modal-title">입고 완료 처리 — ${t.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${j(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
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
    <div class="form-group">
      <label>입고 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${R(t.type===`egg`?[`senior`]:[`lead`])}
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
  `),document.getElementById(`btnSaveComplete`).addEventListener(`click`,()=>b(async r=>{let o=g(r,a),{addDoc:s,updateDoc:c,recordActivity:u,recordMeatLog:f}=o,{getDoc:m}=r;try{let h=parseFloat(document.getElementById(`m_actual`).value),g=document.getElementById(`m_actual_unit`)?.value||t.orderedUnit,_=document.getElementById(`m_staff`).value,v=document.getElementById(`m_memo`).value;if(!h||!_){alert(`실제 수량과 담당자는 필수입니다.`);return}if(n&&(!t.orderedUnitGrams||t.orderedUnitGrams<=0)){alert(`이 발주의 1마리당 g 정보가 없습니다. 발주를 수정해 1마리당 g을 입력해주세요.`);return}let y=l();if(await p(y,r))return;let b=k(t.orderedUnit)&&g===`g`?Number(t.orderedQty||0)*Number(t.orderedUnitGrams||0):Number(t.orderedQty||0);if(h!==b&&!await d({title:`수량 차이 확인`,message:`발주 수량과 실제 수량이 다릅니다.\n\n발주: ${j(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}\n실제: ${j(h,g,t.orderedUnitGrams)}\n\n이대로 완료 처리하시겠습니까?`,confirmText:`완료 처리`}))return;let S=[];if(t.type===`meat`&&t.itemId){if((await m(e(a,`meatTypes`,t.itemId))).exists()){let e=k(t.orderedUnit)?g===`g`?h:h*Number(t.orderedUnitGrams||0):t.orderedUnit===`kg`?h*1e3:h,n=new Date,r=await s(i(a,`meatStocks`),{meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,incomingDate:y,initialQtyG:e,remaining:e,staffName:_,note:`입고예정 완료: ${t.orderMemo||``}`,closed:!1,createdAt:new Date,updatedAt:n});await f({type:`frozenIncoming`,date:y,meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,meatStockId:r.id,delta:e,before:0,after:e,staff:_,reason:`입고예정 완료${t.orderMemo?` - ${t.orderMemo}`:``}`}),S.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:e,before:0,after:e,label:`${t.itemNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:n,isNewDoc:!0})}}else if(t.type===`bag`&&t.itemId){let n=await m(e(a,`bagTypes`,t.itemId));if(n.exists()){let r=n.data(),o=t.orderedUnit===`박스`?h*(r.piecesPerBox||1):h,l=r.currentQty||0,u=l+o,d=new Date;await c(e(a,`bagTypes`,t.itemId),{currentQty:u,updatedAt:d});let f=await s(i(a,`bagLogs`),{date:y,timestamp:new Date,bagTypeId:t.itemId,bagNameSnapshot:t.itemNameSnapshot,type:`incoming`,qty:o,before:l,after:u,staffName:_,note:`입고예정 완료`});S.push({collection:`bagTypes`,docId:t.itemId,field:`currentQty`,delta:o,before:l,after:u,label:`${t.itemNameSnapshot} 봉투`,stockUpdatedAtSnapshot:d,bagLogId:f.id})}}else if(t.type===`egg`){let n=await m(e(a,`eggStock`,`global`)),r=n.exists()?n.data().currentQty:0,o=n.exists()?n.data().minimumQty:0,l=t.orderedUnit===`판`?h*30:h,u=r+l,d=new Date;await c(e(a,`eggStock`,`global`),{currentQty:u,minimumQty:o,updatedAt:d});let f=await s(i(a,`eggLogs`),{date:y,timestamp:new Date,type:`in`,qty:l,before:r,after:u,staffName:_,note:`입고예정 완료`});S.push({collection:`eggStock`,docId:`global`,field:`currentQty`,delta:l,before:r,after:u,label:`계란`,stockUpdatedAtSnapshot:d,eggLogId:f.id})}let C=null;S.length>0&&(C=(await s(i(a,`stockLedger`),{actionType:`scheduleComplete`,actionId:t.id,timestamp:new Date,date:y,status:`active`,items:S})).id),await c(e(a,`schedules`,t.id),{status:`completed`,actualQty:h,actualUnit:g,actualQtyG:t.type===`meat`?k(t.orderedUnit)?g===`g`?h:h*Number(t.orderedUnitGrams||0):t.orderedUnit===`kg`?h*1e3:h:null,incomingStaffName:_,completeMemo:v,completedAt:new Date,ledgerId:C,updatedAt:new Date});let w=h!==b;if(await u({action:`schedule`,subAction:w?`completeDiff`:`complete`,date:y,staff:_,message:w?`${t.itemNameSnapshot} 입고 완료 ⚠️ 발주 ${j(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)} → 실제 ${j(h,g,t.orderedUnitGrams)} / 담당: ${_}`:`${t.itemNameSnapshot} 입고 완료 차이 없음 / 담당: ${_}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,actualQty:h,unit:g,orderedUnit:t.orderedUnit,orderedUnitGrams:t.orderedUnitGrams||null,hasDiff:w,memo:v||null}}),await o.commit(),!r.isCurrent())return;closeModal(),await x({force:!0}),alert(`완료 처리되었습니다!`)}catch(e){console.error(`입고 완료 처리 오류:`,e),alert(`완료 처리 중 오류가 발생했습니다.\n\n${e.code||``} ${e.message}\n\n이 메시지를 관리자에게 전달해주세요.`)}},[`admin`,`office`,`production`]))}function I(e){return String(e??``).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var L={};function R(e){let t=``;for(let n of e)(L[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}o(`schedule`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function B(t){let n=[`senior`,`lead`,`office`],[r,i,o,...s]=await Promise.all([S(t),C(t),w(t),...n.map(n=>t.getDoc(e(a,`staffGroups`,n)))]);return{schedules:r,meatTypes:i,bagTypes:o,staff:Object.fromEntries(n.map((e,t)=>[e,s[t].exists()&&s[t].data().members||[]]))}}function V({cacheOnly:e=!0}={}){return _.prepare?.(`default`,B,{cacheOnly:e})}export{V as preparePage,x as renderSchedule};