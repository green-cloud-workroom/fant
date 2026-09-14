import{b as e,d as t,h as n,i as r,n as i,o as a,u as o,y as s}from"./index.esm-rHmxwfvm.js";import{n as c}from"./firebase-qGjqjNvO.js";import{n as l}from"./modalManager-Z4b2ihO9.js";import{H as u,P as d,g as f}from"./index-ihWgJTcM.js";import{n as p}from"./activityLogs-Jg2Ymepu.js";import{t as m}from"./closingGuard-BCSnBl5U.js";import{t as h}from"./meatLogs-DJmpQ7lB.js";async function g(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`;let[t]=await Promise.all([_(),N()]);e.isConnected&&b(t)}async function _(){let e=(await a(t(s(c,`schedules`),o(`date`,`asc`)))).docs.map(e=>({id:e.id,...e.data()}));return e.sort((e,t)=>{if(e.date!==t.date)return e.date.localeCompare(t.date);let n=e.createdAt?.toMillis?e.createdAt.toMillis():0;return(t.createdAt?.toMillis?t.createdAt.toMillis():0)-n}),e}async function v(){return(await a(s(c,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()}))}async function y(){return(await a(s(c,`bagTypes`))).docs.map(e=>({id:e.id,...e.data()}))}function b(e){let t=document.getElementById(`mainContent`),n=d(),r=x(),i=e.filter(e=>e.status===`scheduled`),a=e.filter(e=>e.status!==`scheduled`),o=!1;t.innerHTML=`
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
            ${i.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>`:i.map(e=>S(e,n,r)).join(``)}
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
              ${a.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>`:a.map(e=>C(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddSchedule`)?.addEventListener(`click`,()=>O()),document.getElementById(`btnToggleDone`).addEventListener(`click`,()=>{let e=document.getElementById(`doneSection`);o=!o,e.style.display=o?``:`none`,document.getElementById(`btnToggleDone`).textContent=o?`완료/취소 항목 숨기기`:`완료/취소 항목 보기`}),document.querySelectorAll(`.btn-complete`).forEach(t=>{t.addEventListener(`click`,async()=>{try{let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`일정을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.`);return}A(r)}catch(e){console.error(`완료 버튼 오류:`,e),alert(`오류가 발생했습니다: `+e.message)}})}),document.querySelectorAll(`.btn-edit-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!x()){alert(`입고 예정 수정 권한이 없습니다.`);return}let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`입고 예정을 찾을 수 없습니다.`);return}await m(r.date)||O(r)})}),document.querySelectorAll(`.btn-cancel-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!x()){alert(`입고 예정 취소 권한이 없습니다.`);return}let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`입고 예정을 찾을 수 없습니다.`);return}await m(r.date)||k(r)})})}function x(){return u===`admin`||u===`office`||u===`production`}function S(e,t,n=!1){let r=e.date<t;return`
    <tr style="background:${r?`#fffdf0`:`white`}">
      <td style="color:${r?`#e67e22`:`#1a1a1a`}">${e.date} ${r?`⚠️`:``}</td>
      <td><span class="tag tag-raw">${D(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${E(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.orderStaffName||`-`}</td>
      <td>${e.orderMemo||`-`}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        ${n?`<button class="btn-secondary btn-edit-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">수정</button>`:``}
        <button class="btn-primary btn-complete" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        ${n?`<button class="btn-secondary btn-cancel-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">취소</button>`:``}
      </td>
    </tr>
  `}function C(e){let t=e.status===`completed`;return`
    <tr style="opacity:0.8">
      <td>${e.date}</td>
      <td><span class="tag tag-raw">${D(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${E(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.actualQty?E(e.actualQty,e.actualUnit||e.orderedUnit,e.orderedUnitGrams):`-`}</td>
      <td>${e.incomingStaffName||`-`}</td>
      <td>
        <span style="color:${t?`#2d7a3a`:`#e53e3e`};font-size:12px">
          ${t?`✅ 완료`:`❌ 취소`}
        </span>
      </td>
      <td>${e.completeMemo||e.cancelReason||`-`}</td>
    </tr>
  `}function w(e){return e===`마리`}function T(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function E(e,t,n){if(t===`g`)return T(e);let r=`${e}${t}`;return!w(t)||!n?r:`${r} (${T(Number(e||0)*Number(n||0))})`}function D(e){return e===`meat`?`원육`:e===`bag`?`봉투`:`계란`}async function O(t=null){let r=!!t,a=await v(),o=await y();F(`
    <h3 class="modal-title">입고 예정 ${r?`수정`:`등록`}</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${t?.date||d()}" />
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
      <label>발주 담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${P([`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" value="${j(t?.orderMemo||``)}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">${r?`수정`:`등록`}</button>
    </div>
  `),window.updateScheduleItem=()=>{let e=document.getElementById(`m_type`).value,n=document.getElementById(`itemSelectWrap`),i=document.getElementById(`m_item`),s=document.getElementById(`m_unit`),c={meat:{options:[[`kg`,`kg`],[`g`,`g`],[`마리`,`마리`]],default:`kg`},bag:{options:[[`박스`,`박스`],[`장`,`장`]],default:`박스`},egg:{options:[[`개`,`개`],[`판`,`판`]],default:`개`}};if(e&&c[e]){let t=c[e];s.innerHTML=t.options.map(([e,t])=>`<option value="${e}">${t}</option>`).join(``),s.value=t.default}else s.innerHTML=`<option value="">구분을 먼저 선택</option>`;if(e===`egg`){n.style.display=`none`,l();return}n.style.display=``,i.innerHTML=`<option value="">선택</option>`,(e===`meat`?a:o).filter(e=>e.active!==!1||r&&t?.itemId===e.id).forEach(e=>{i.innerHTML+=`<option value="${e.id}" data-name="${e.name}">${e.name}</option>`}),l()};let l=()=>{let e=document.getElementById(`unitGramsWrap`),t=document.getElementById(`m_unit_grams`),n=document.getElementById(`m_type`)?.value===`meat`&&document.getElementById(`m_unit`)?.value===`마리`;e&&(e.style.display=n?``:`none`),!n&&t&&(t.value=``)};document.getElementById(`m_unit`)?.addEventListener(`change`,l),r&&(document.getElementById(`m_type`).value=t.type||``,window.updateScheduleItem(),t.type!==`egg`&&(document.getElementById(`m_item`).value=t.itemId||``),document.getElementById(`m_unit`).value=t.orderedUnit||``,document.getElementById(`m_unit_grams`).value=t.orderedUnitGrams||``,l(),document.getElementById(`m_staff`).value=t.orderStaffName||``),document.getElementById(`btnSaveSchedule`).addEventListener(`click`,async()=>{if(!x()){alert(`입고 예정 ${r?`수정`:`등록`} 권한이 없습니다.`);return}let a=document.getElementById(`m_date`).value,o=r?t.type:document.getElementById(`m_type`).value,l=parseFloat(document.getElementById(`m_qty`).value),u=document.getElementById(`m_unit`).value,f=w(u)?parseFloat(document.getElementById(`m_unit_grams`)?.value):null,h=document.getElementById(`m_staff`).value,g=document.getElementById(`m_memo`).value;if(!a||!o||!l){alert(`날짜, 구분, 수량은 필수입니다.`);return}if(!h){alert(`담당자는 필수입니다.`);return}if(w(u)&&(!f||f<=0)){alert(`1마리당 g을 입력해주세요.`);return}if(r&&(await m(t.date)||a!==t.date&&await m(a)))return;let v=r&&t.itemId||null,y=r&&t.itemNameSnapshot||`계란`;if(!r&&o!==`egg`){let e=document.getElementById(`m_item`);if(v=e.value,y=e.options[e.selectedIndex]?.dataset?.name||``,!v){alert(`품목을 선택해주세요.`);return}}let S=(await _()).find(e=>r&&e.id===t.id||e.status!==`scheduled`||e.date!==a||e.type!==o?!1:o===`egg`?!0:e.itemId===v);if(S){alert(`이미 ${a}에 [${o===`egg`?`계란`:y}] 입고예정이 등록되어 있습니다.\n(기존: ${S.orderedQty}${S.orderedUnit})\n\n같은 날짜의 같은 품목은 중복 등록할 수 없습니다.`);return}if(r){let r={date:t.date,orderedQty:t.orderedQty,orderedUnit:t.orderedUnit,orderStaffName:t.orderStaffName||``,orderMemo:t.orderMemo||``};await n(e(c,`schedules`,t.id),{date:a,orderedQty:l,orderedUnit:u,orderedUnitGrams:f,orderStaffName:h,orderMemo:g,updatedAt:new Date}),await p({action:`schedule`,subAction:`edit`,date:d(),staff:h,message:`입고예정 수정 — ${y} ${r.orderedQty}${r.orderedUnit} → ${l}${u} (예정일 ${r.date} → ${a}) / 담당: ${h}`,details:{scheduleId:t.id,type:o,itemId:v,itemName:y,before:r,after:{date:a,orderedQty:l,orderedUnit:u,orderedUnitGrams:f,orderStaffName:h,orderMemo:g||``}}}),closeModal(),b(await _()),alert(`입고 예정 수정 완료!`);return}let C=await i(s(c,`schedules`),{date:a,type:o,itemId:v,itemNameSnapshot:y,orderedQty:l,orderedUnit:u,orderedUnitGrams:f,status:`scheduled`,orderStaffName:h,orderMemo:g,createdAt:new Date,updatedAt:new Date}),T=o===`egg`?`계란`:`${o===`meat`?`원육`:o===`bag`?`봉투`:``} ${y}`;await p({action:`schedule`,subAction:`register`,date:d(),staff:h,message:`입고예정 등록 — ${T} ${l}${u} (예정일 ${a}) / 담당: ${h}`,details:{scheduleId:C.id,type:o,itemId:v,itemName:y,orderedQty:l,orderedUnit:u,orderedUnitGrams:f,scheduledDate:a,memo:g||null}}),closeModal(),b(await _()),alert(`입고 예정 등록 완료!`)})}function k(t){F(`
    <h3 class="modal-title">입고예정 취소 — ${t.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${E(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>취소 사유 *</label>
      <input type="text" id="m_reason" placeholder="사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${P([`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveCancelSchedule">확인</button>
    </div>
  `),document.getElementById(`btnSaveCancelSchedule`).addEventListener(`click`,async()=>{let r=document.getElementById(`m_reason`).value.trim(),i=document.getElementById(`m_staff`).value;if(!r){alert(`취소 사유는 필수입니다.`);return}if(!i){alert(`담당자는 필수입니다.`);return}await n(e(c,`schedules`,t.id),{status:`cancelled`,cancelReason:r,cancelStaffName:i,cancelledAt:new Date,updatedAt:new Date}),await p({action:`schedule`,subAction:`cancel`,date:d(),staff:i,message:`${t.itemNameSnapshot} 입고 예정 취소 / 사유: ${r} / 담당: ${i}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,unit:t.orderedUnit,scheduledDate:t.date,cancelReason:r}}),closeModal(),b(await _()),alert(`취소 완료!`)})}function A(t){let a=t.type===`meat`&&w(t.orderedUnit);F(`
    <h3 class="modal-title">입고 완료 처리 — ${t.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${E(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>실제 수량 *</label>
      <input type="number" id="m_actual" placeholder="실제 입고 수량 입력" />
    </div>
    ${a?`
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
        ${P(t.type===`egg`?[`senior`]:[`lead`])}
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
  `),document.getElementById(`btnSaveComplete`).addEventListener(`click`,async()=>{try{let o=parseFloat(document.getElementById(`m_actual`).value),l=document.getElementById(`m_actual_unit`)?.value||t.orderedUnit,u=document.getElementById(`m_staff`).value,g=document.getElementById(`m_memo`).value;if(!o||!u){alert(`실제 수량과 담당자는 필수입니다.`);return}if(a&&(!t.orderedUnitGrams||t.orderedUnitGrams<=0)){alert(`이 발주의 1마리당 g 정보가 없습니다. 발주를 수정해 1마리당 g을 입력해주세요.`);return}let v=d();if(await m(v))return;let y=w(t.orderedUnit)&&l===`g`?Number(t.orderedQty||0)*Number(t.orderedUnitGrams||0):Number(t.orderedQty||0);if(o!==y&&!await f({title:`수량 차이 확인`,message:`발주 수량과 실제 수량이 다릅니다.\n\n발주: ${E(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)}\n실제: ${E(o,l,t.orderedUnitGrams)}\n\n이대로 완료 처리하시겠습니까?`,confirmText:`완료 처리`}))return;let x=[];if(t.type===`meat`&&t.itemId){if((await r(e(c,`meatTypes`,t.itemId))).exists()){let e=w(t.orderedUnit)?l===`g`?o:o*Number(t.orderedUnitGrams||0):t.orderedUnit===`kg`?o*1e3:o,n=new Date,r=await i(s(c,`meatStocks`),{meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,incomingDate:v,initialQtyG:e,remaining:e,staffName:u,note:`입고예정 완료: ${t.orderMemo||``}`,closed:!1,createdAt:new Date,updatedAt:n});await h({type:`frozenIncoming`,date:v,meatTypeId:t.itemId,meatNameSnapshot:t.itemNameSnapshot,stage:`frozen`,meatStockId:r.id,delta:e,before:0,after:e,staff:u,reason:`입고예정 완료${t.orderMemo?` - ${t.orderMemo}`:``}`}),x.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:e,before:0,after:e,label:`${t.itemNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:n,isNewDoc:!0})}}else if(t.type===`bag`&&t.itemId){let a=await r(e(c,`bagTypes`,t.itemId));if(a.exists()){let r=a.data(),l=t.orderedUnit===`박스`?o*(r.piecesPerBox||1):o,d=r.currentQty||0,f=d+l,p=new Date;await n(e(c,`bagTypes`,t.itemId),{currentQty:f,updatedAt:p});let m=await i(s(c,`bagLogs`),{date:v,timestamp:new Date,bagTypeId:t.itemId,bagNameSnapshot:t.itemNameSnapshot,type:`incoming`,qty:l,before:d,after:f,staffName:u,note:`입고예정 완료`});x.push({collection:`bagTypes`,docId:t.itemId,field:`currentQty`,delta:l,before:d,after:f,label:`${t.itemNameSnapshot} 봉투`,stockUpdatedAtSnapshot:p,bagLogId:m.id})}}else if(t.type===`egg`){let a=await r(e(c,`eggStock`,`global`)),l=a.exists()?a.data().currentQty:0,d=a.exists()?a.data().minimumQty:0,f=t.orderedUnit===`판`?o*30:o,p=l+f,m=new Date;await n(e(c,`eggStock`,`global`),{currentQty:p,minimumQty:d,updatedAt:m});let h=await i(s(c,`eggLogs`),{date:v,timestamp:new Date,type:`in`,qty:f,before:l,after:p,staffName:u,note:`입고예정 완료`});x.push({collection:`eggStock`,docId:`global`,field:`currentQty`,delta:f,before:l,after:p,label:`계란`,stockUpdatedAtSnapshot:m,eggLogId:h.id})}let S=null;x.length>0&&(S=(await i(s(c,`stockLedger`),{actionType:`scheduleComplete`,actionId:t.id,timestamp:new Date,date:v,status:`active`,items:x})).id),await n(e(c,`schedules`,t.id),{status:`completed`,actualQty:o,actualUnit:l,actualQtyG:t.type===`meat`?w(t.orderedUnit)?l===`g`?o:o*Number(t.orderedUnitGrams||0):t.orderedUnit===`kg`?o*1e3:o:null,incomingStaffName:u,completeMemo:g,completedAt:new Date,ledgerId:S,updatedAt:new Date});let C=o!==y;await p({action:`schedule`,subAction:C?`completeDiff`:`complete`,date:v,staff:u,message:C?`${t.itemNameSnapshot} 입고 완료 ⚠️ 발주 ${E(t.orderedQty,t.orderedUnit,t.orderedUnitGrams)} → 실제 ${E(o,l,t.orderedUnitGrams)} / 담당: ${u}`:`${t.itemNameSnapshot} 입고 완료 차이 없음 / 담당: ${u}`,details:{scheduleId:t.id,type:t.type,itemId:t.itemId||null,itemName:t.itemNameSnapshot,orderedQty:t.orderedQty,actualQty:o,unit:l,orderedUnit:t.orderedUnit,orderedUnitGrams:t.orderedUnitGrams||null,hasDiff:C,memo:g||null}}),closeModal(),b(await _()),alert(`완료 처리되었습니다!`)}catch(e){console.error(`입고 완료 처리 오류:`,e),alert(`완료 처리 중 오류가 발생했습니다.\n\n${e.code||``} ${e.message}\n\n이 메시지를 관리자에게 전달해주세요.`)}})}function j(e){return String(e??``).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var M={};async function N(){Object.keys(M).length>0||await Promise.all([`senior`,`lead`,`office`].map(async t=>{let n=await r(e(c,`staffGroups`,t));n.exists()&&(M[t]=n.data().members||[])}))}function P(e){let t=``;for(let n of e)(M[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function F(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}l(`schedule`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{g as renderSchedule};