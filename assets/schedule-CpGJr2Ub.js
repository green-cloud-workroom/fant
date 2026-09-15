import{a as e,c as t,f as n,g as r,h as i,i as a,n as o,s}from"./index.esm-Cf9DaHbi.js";import{n as c}from"./firebase-BQPCO7kq.js";import{j as l,m as u,w as d}from"./index-CMgkQ4he.js";import{n as f}from"./activityLogs-Mn_dgBRB.js";import{t as p}from"./closingGuard-CS1p4aoM.js";import{t as m}from"./meatLogs-5RqsF683.js";async function h(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>입고 예정관리 로딩 중...</p></div>`;let[t]=await Promise.all([g(),M()]);e.isConnected&&y(t)}async function g(){let n=(await e(t(i(c,`schedules`),s(`date`,`asc`)))).docs.map(e=>({id:e.id,...e.data()}));return n.sort((e,t)=>{if(e.date!==t.date)return e.date.localeCompare(t.date);let n=e.createdAt?.toMillis?e.createdAt.toMillis():0;return(t.createdAt?.toMillis?t.createdAt.toMillis():0)-n}),n}async function _(){return(await e(i(c,`meatTypes`))).docs.map(e=>({id:e.id,...e.data()}))}async function v(){return(await e(i(c,`bagTypes`))).docs.map(e=>({id:e.id,...e.data()}))}function y(e){let t=document.getElementById(`mainContent`),n=d(),r=b(),i=e.filter(e=>e.status===`scheduled`),a=e.filter(e=>e.status!==`scheduled`),o=!1;t.innerHTML=`
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
            ${i.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">입고 예정 없음</td></tr>`:i.map(e=>x(e,n,r)).join(``)}
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
              ${a.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">없음</td></tr>`:a.map(e=>S(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddSchedule`)?.addEventListener(`click`,()=>D()),document.getElementById(`btnToggleDone`).addEventListener(`click`,()=>{let e=document.getElementById(`doneSection`);o=!o,e.style.display=o?``:`none`,document.getElementById(`btnToggleDone`).textContent=o?`완료/취소 항목 숨기기`:`완료/취소 항목 보기`}),document.querySelectorAll(`.btn-complete`).forEach(t=>{t.addEventListener(`click`,async()=>{try{let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`일정을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.`);return}k(r)}catch(e){console.error(`완료 버튼 오류:`,e),alert(`오류가 발생했습니다: `+e.message)}})}),document.querySelectorAll(`.btn-edit-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!b()){alert(`입고 예정 수정 권한이 없습니다.`);return}let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`입고 예정을 찾을 수 없습니다.`);return}await p(r.date)||D(r)})}),document.querySelectorAll(`.btn-cancel-schedule`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!b()){alert(`입고 예정 취소 권한이 없습니다.`);return}let n=t.dataset.id,r=e.find(e=>e.id===n);if(!r){alert(`입고 예정을 찾을 수 없습니다.`);return}await p(r.date)||O(r)})})}function b(){return l===`admin`||l===`office`||l===`production`}function x(e,t,n=!1){let r=e.date<t;return`
    <tr style="background:${r?`#fffdf0`:`white`}">
      <td style="color:${r?`#e67e22`:`#1a1a1a`}">${e.date} ${r?`⚠️`:``}</td>
      <td><span class="tag tag-raw">${E(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${T(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.orderStaffName||`-`}</td>
      <td>${e.orderMemo||`-`}</td>
      <td><span style="color:#e67e22;font-size:12px">⏳ 예정</span></td>
      <td style="white-space:nowrap">
        ${n?`<button class="btn-secondary btn-edit-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">수정</button>`:``}
        <button class="btn-primary btn-complete" data-id="${e.id}" style="font-size:11px;padding:3px 10px;margin-right:4px;">완료</button>
        ${n?`<button class="btn-secondary btn-cancel-schedule" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">취소</button>`:``}
      </td>
    </tr>
  `}function S(e){let t=e.status===`completed`;return`
    <tr style="opacity:0.8">
      <td>${e.date}</td>
      <td><span class="tag tag-raw">${E(e.type)}</span></td>
      <td>${e.itemNameSnapshot}</td>
      <td>${T(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</td>
      <td>${e.actualQty?T(e.actualQty,e.actualUnit||e.orderedUnit,e.orderedUnitGrams):`-`}</td>
      <td>${e.incomingStaffName||`-`}</td>
      <td>
        <span style="color:${t?`#2d7a3a`:`#e53e3e`};font-size:12px">
          ${t?`✅ 완료`:`❌ 취소`}
        </span>
      </td>
      <td>${e.completeMemo||e.cancelReason||`-`}</td>
    </tr>
  `}function C(e){return e===`마리`}function w(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function T(e,t,n){if(t===`g`)return w(e);let r=`${e}${t}`;return!C(t)||!n?r:`${r} (${w(Number(e||0)*Number(n||0))})`}function E(e){return e===`meat`?`원육`:e===`bag`?`봉투`:`계란`}async function D(e=null){let t=!!e,a=await _(),s=await v();P(`
    <h3 class="modal-title">입고 예정 ${t?`수정`:`등록`}</h3>
    <div class="form-group">
      <label>예정일 *</label>
      <input type="date" id="m_date" value="${e?.date||d()}" />
    </div>
    <div class="form-group">
      <label>구분 *</label>
      <select id="m_type" onchange="updateScheduleItem()" ${t?`disabled`:``}>
        <option value="">선택</option>
        <option value="meat">원육</option>
        <option value="bag">봉투</option>
        <option value="egg">계란</option>
      </select>
    </div>
    <div class="form-group" id="itemSelectWrap" style="display:none;">
      <label>품목 *</label>
      <select id="m_item" ${t?`disabled`:``}>
        <option value="">선택</option>
      </select>
      ${t?`<p style="margin:6px 0 0;color:#888;font-size:11px;">구분/품목 변경은 기존 항목 취소 후 새로 등록해주세요.</p>`:``}
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>발주수량 *</label>
        <input type="number" id="m_qty" placeholder="수량" value="${e?.orderedQty??``}" />
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
      <input type="number" id="m_unit_grams" placeholder="예: 1500" min="0" step="1" value="${e?.orderedUnitGrams??``}" />
    </div>
    <div class="form-group">
      <label>발주 담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${N([`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>입고메모</label>
      <input type="text" id="m_memo" placeholder="메모" value="${A(e?.orderMemo||``)}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSchedule">${t?`수정`:`등록`}</button>
    </div>
  `),window.updateScheduleItem=()=>{let n=document.getElementById(`m_type`).value,r=document.getElementById(`itemSelectWrap`),i=document.getElementById(`m_item`),o=document.getElementById(`m_unit`),c={meat:{options:[[`kg`,`kg`],[`g`,`g`],[`마리`,`마리`]],default:`kg`},bag:{options:[[`박스`,`박스`],[`장`,`장`]],default:`박스`},egg:{options:[[`개`,`개`],[`판`,`판`]],default:`개`}};if(n&&c[n]){let e=c[n];o.innerHTML=e.options.map(([e,t])=>`<option value="${e}">${t}</option>`).join(``),o.value=e.default}else o.innerHTML=`<option value="">구분을 먼저 선택</option>`;if(n===`egg`){r.style.display=`none`,l();return}r.style.display=``,i.innerHTML=`<option value="">선택</option>`,(n===`meat`?a:s).filter(n=>n.active!==!1||t&&e?.itemId===n.id).forEach(e=>{i.innerHTML+=`<option value="${e.id}" data-name="${e.name}">${e.name}</option>`}),l()};let l=()=>{let e=document.getElementById(`unitGramsWrap`),t=document.getElementById(`m_unit_grams`),n=document.getElementById(`m_type`)?.value===`meat`&&document.getElementById(`m_unit`)?.value===`마리`;e&&(e.style.display=n?``:`none`),!n&&t&&(t.value=``)};document.getElementById(`m_unit`)?.addEventListener(`change`,l),t&&(document.getElementById(`m_type`).value=e.type||``,window.updateScheduleItem(),e.type!==`egg`&&(document.getElementById(`m_item`).value=e.itemId||``),document.getElementById(`m_unit`).value=e.orderedUnit||``,document.getElementById(`m_unit_grams`).value=e.orderedUnitGrams||``,l(),document.getElementById(`m_staff`).value=e.orderStaffName||``),document.getElementById(`btnSaveSchedule`).addEventListener(`click`,async()=>{if(!b()){alert(`입고 예정 ${t?`수정`:`등록`} 권한이 없습니다.`);return}let a=document.getElementById(`m_date`).value,s=t?e.type:document.getElementById(`m_type`).value,l=parseFloat(document.getElementById(`m_qty`).value),u=document.getElementById(`m_unit`).value,m=C(u)?parseFloat(document.getElementById(`m_unit_grams`)?.value):null,h=document.getElementById(`m_staff`).value,_=document.getElementById(`m_memo`).value;if(!a||!s||!l){alert(`날짜, 구분, 수량은 필수입니다.`);return}if(!h){alert(`담당자는 필수입니다.`);return}if(C(u)&&(!m||m<=0)){alert(`1마리당 g을 입력해주세요.`);return}if(t&&(await p(e.date)||a!==e.date&&await p(a)))return;let v=t&&e.itemId||null,x=t&&e.itemNameSnapshot||`계란`;if(!t&&s!==`egg`){let e=document.getElementById(`m_item`);if(v=e.value,x=e.options[e.selectedIndex]?.dataset?.name||``,!v){alert(`품목을 선택해주세요.`);return}}let S=(await g()).find(n=>t&&n.id===e.id||n.status!==`scheduled`||n.date!==a||n.type!==s?!1:s===`egg`?!0:n.itemId===v);if(S){alert(`이미 ${a}에 [${s===`egg`?`계란`:x}] 입고예정이 등록되어 있습니다.\n(기존: ${S.orderedQty}${S.orderedUnit})\n\n같은 날짜의 같은 품목은 중복 등록할 수 없습니다.`);return}if(t){let t={date:e.date,orderedQty:e.orderedQty,orderedUnit:e.orderedUnit,orderStaffName:e.orderStaffName||``,orderMemo:e.orderMemo||``};await n(r(c,`schedules`,e.id),{date:a,orderedQty:l,orderedUnit:u,orderedUnitGrams:m,orderStaffName:h,orderMemo:_,updatedAt:new Date}),await f({action:`schedule`,subAction:`edit`,date:d(),staff:h,message:`입고예정 수정 — ${x} ${t.orderedQty}${t.orderedUnit} → ${l}${u} (예정일 ${t.date} → ${a}) / 담당: ${h}`,details:{scheduleId:e.id,type:s,itemId:v,itemName:x,before:t,after:{date:a,orderedQty:l,orderedUnit:u,orderedUnitGrams:m,orderStaffName:h,orderMemo:_||``}}}),closeModal(),y(await g()),alert(`입고 예정 수정 완료!`);return}let w=await o(i(c,`schedules`),{date:a,type:s,itemId:v,itemNameSnapshot:x,orderedQty:l,orderedUnit:u,orderedUnitGrams:m,status:`scheduled`,orderStaffName:h,orderMemo:_,createdAt:new Date,updatedAt:new Date}),T=s===`egg`?`계란`:`${s===`meat`?`원육`:s===`bag`?`봉투`:``} ${x}`;await f({action:`schedule`,subAction:`register`,date:d(),staff:h,message:`입고예정 등록 — ${T} ${l}${u} (예정일 ${a}) / 담당: ${h}`,details:{scheduleId:w.id,type:s,itemId:v,itemName:x,orderedQty:l,orderedUnit:u,orderedUnitGrams:m,scheduledDate:a,memo:_||null}}),closeModal(),y(await g()),alert(`입고 예정 등록 완료!`)})}function O(e){P(`
    <h3 class="modal-title">입고예정 취소 — ${e.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${T(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>취소 사유 *</label>
      <input type="text" id="m_reason" placeholder="사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${N([`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveCancelSchedule">확인</button>
    </div>
  `),document.getElementById(`btnSaveCancelSchedule`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_reason`).value.trim(),i=document.getElementById(`m_staff`).value;if(!t){alert(`취소 사유는 필수입니다.`);return}if(!i){alert(`담당자는 필수입니다.`);return}await n(r(c,`schedules`,e.id),{status:`cancelled`,cancelReason:t,cancelStaffName:i,cancelledAt:new Date,updatedAt:new Date}),await f({action:`schedule`,subAction:`cancel`,date:d(),staff:i,message:`${e.itemNameSnapshot} 입고 예정 취소 / 사유: ${t} / 담당: ${i}`,details:{scheduleId:e.id,type:e.type,itemId:e.itemId||null,itemName:e.itemNameSnapshot,orderedQty:e.orderedQty,unit:e.orderedUnit,scheduledDate:e.date,cancelReason:t}}),closeModal(),y(await g()),alert(`취소 완료!`)})}function k(e){let t=e.type===`meat`&&C(e.orderedUnit);P(`
    <h3 class="modal-title">입고 완료 처리 — ${e.itemNameSnapshot}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">발주수량: ${T(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}</p>
    <div class="form-group">
      <label>실제 수량 *</label>
      <input type="number" id="m_actual" placeholder="실제 입고 수량 입력" />
    </div>
    ${t?`
      <div class="form-group">
        <label>실제 단위</label>
        <select id="m_actual_unit">
          <option value="${e.orderedUnit}">${e.orderedUnit}</option>
          <option value="g">g</option>
        </select>
      </div>
    `:``}
    <div class="form-group">
      <label>입고 담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${N(e.type===`egg`?[`senior`]:[`lead`])}
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
  `),document.getElementById(`btnSaveComplete`).addEventListener(`click`,async()=>{try{let s=parseFloat(document.getElementById(`m_actual`).value),l=document.getElementById(`m_actual_unit`)?.value||e.orderedUnit,h=document.getElementById(`m_staff`).value,_=document.getElementById(`m_memo`).value;if(!s||!h){alert(`실제 수량과 담당자는 필수입니다.`);return}if(t&&(!e.orderedUnitGrams||e.orderedUnitGrams<=0)){alert(`이 발주의 1마리당 g 정보가 없습니다. 발주를 수정해 1마리당 g을 입력해주세요.`);return}let v=d();if(await p(v))return;let b=C(e.orderedUnit)&&l===`g`?Number(e.orderedQty||0)*Number(e.orderedUnitGrams||0):Number(e.orderedQty||0);if(s!==b&&!await u({title:`수량 차이 확인`,message:`발주 수량과 실제 수량이 다릅니다.\n\n발주: ${T(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)}\n실제: ${T(s,l,e.orderedUnitGrams)}\n\n이대로 완료 처리하시겠습니까?`,confirmText:`완료 처리`}))return;let x=[];if(e.type===`meat`&&e.itemId){if((await a(r(c,`meatTypes`,e.itemId))).exists()){let t=C(e.orderedUnit)?l===`g`?s:s*Number(e.orderedUnitGrams||0):e.orderedUnit===`kg`?s*1e3:s,n=new Date,r=await o(i(c,`meatStocks`),{meatTypeId:e.itemId,meatNameSnapshot:e.itemNameSnapshot,stage:`frozen`,incomingDate:v,initialQtyG:t,remaining:t,staffName:h,note:`입고예정 완료: ${e.orderMemo||``}`,closed:!1,createdAt:new Date,updatedAt:n});await m({type:`frozenIncoming`,date:v,meatTypeId:e.itemId,meatNameSnapshot:e.itemNameSnapshot,stage:`frozen`,meatStockId:r.id,delta:t,before:0,after:t,staff:h,reason:`입고예정 완료${e.orderMemo?` - ${e.orderMemo}`:``}`}),x.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:t,before:0,after:t,label:`${e.itemNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:n,isNewDoc:!0})}}else if(e.type===`bag`&&e.itemId){let t=await a(r(c,`bagTypes`,e.itemId));if(t.exists()){let a=t.data(),l=e.orderedUnit===`박스`?s*(a.piecesPerBox||1):s,u=a.currentQty||0,d=u+l,f=new Date;await n(r(c,`bagTypes`,e.itemId),{currentQty:d,updatedAt:f});let p=await o(i(c,`bagLogs`),{date:v,timestamp:new Date,bagTypeId:e.itemId,bagNameSnapshot:e.itemNameSnapshot,type:`incoming`,qty:l,before:u,after:d,staffName:h,note:`입고예정 완료`});x.push({collection:`bagTypes`,docId:e.itemId,field:`currentQty`,delta:l,before:u,after:d,label:`${e.itemNameSnapshot} 봉투`,stockUpdatedAtSnapshot:f,bagLogId:p.id})}}else if(e.type===`egg`){let t=await a(r(c,`eggStock`,`global`)),l=t.exists()?t.data().currentQty:0,u=t.exists()?t.data().minimumQty:0,d=e.orderedUnit===`판`?s*30:s,f=l+d,p=new Date;await n(r(c,`eggStock`,`global`),{currentQty:f,minimumQty:u,updatedAt:p});let m=await o(i(c,`eggLogs`),{date:v,timestamp:new Date,type:`in`,qty:d,before:l,after:f,staffName:h,note:`입고예정 완료`});x.push({collection:`eggStock`,docId:`global`,field:`currentQty`,delta:d,before:l,after:f,label:`계란`,stockUpdatedAtSnapshot:p,eggLogId:m.id})}let S=null;x.length>0&&(S=(await o(i(c,`stockLedger`),{actionType:`scheduleComplete`,actionId:e.id,timestamp:new Date,date:v,status:`active`,items:x})).id),await n(r(c,`schedules`,e.id),{status:`completed`,actualQty:s,actualUnit:l,actualQtyG:e.type===`meat`?C(e.orderedUnit)?l===`g`?s:s*Number(e.orderedUnitGrams||0):e.orderedUnit===`kg`?s*1e3:s:null,incomingStaffName:h,completeMemo:_,completedAt:new Date,ledgerId:S,updatedAt:new Date});let w=s!==b;await f({action:`schedule`,subAction:w?`completeDiff`:`complete`,date:v,staff:h,message:w?`${e.itemNameSnapshot} 입고 완료 ⚠️ 발주 ${T(e.orderedQty,e.orderedUnit,e.orderedUnitGrams)} → 실제 ${T(s,l,e.orderedUnitGrams)} / 담당: ${h}`:`${e.itemNameSnapshot} 입고 완료 차이 없음 / 담당: ${h}`,details:{scheduleId:e.id,type:e.type,itemId:e.itemId||null,itemName:e.itemNameSnapshot,orderedQty:e.orderedQty,actualQty:s,unit:l,orderedUnit:e.orderedUnit,orderedUnitGrams:e.orderedUnitGrams||null,hasDiff:w,memo:_||null}}),closeModal(),y(await g()),alert(`완료 처리되었습니다!`)}catch(e){console.error(`입고 완료 처리 오류:`,e),alert(`완료 처리 중 오류가 발생했습니다.\n\n${e.code||``} ${e.message}\n\n이 메시지를 관리자에게 전달해주세요.`)}})}function A(e){return String(e??``).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}var j={};async function M(){Object.keys(j).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await a(r(c,`staffGroups`,e));t.exists()&&(j[e]=t.data().members||[])}))}function N(e){let t=``;for(let n of e)(j[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function P(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};export{h as renderSchedule};