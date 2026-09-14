import{a as e,b as t,c as n,d as r,f as i,g as a,h as o,i as s,l as c,m as l,n as u,o as d,p as f,r as p,s as m,u as h}from"./index.esm-Cf9DaHbi.js";import{n as g}from"./firebase-BQPCO7kq.js";import{C as _,E as v,M as y,S as b,T as x,_ as ee,d as te,h as S,j as C,k as ne,m as w,n as re,p as T,s as ie,t as ae,w as E,x as oe,y as se}from"./index-CMgkQ4he.js";import{n as ce,t as le}from"./activityLogs-Mn_dgBRB.js";import{t as ue}from"./closingGuard-CS1p4aoM.js";import{i as D,r as de}from"./number-Cbi_r2jv.js";import{findActionableClosingDate as fe,getAllBlockingItems as pe}from"./closingChecks-4AUr8wLv.js";import{t as O}from"./meatLogs-5RqsF683.js";function me(e){let n=new Set(e.map(e=>e.id)),r=new Map;return{enqueue({action:e,subAction:t,date:i,message:a,details:o,dedupKey:s}){let c=`auto_${`${e}_${t}_${i}_${s}`.replace(/[^\w-]/g,`_`)}`;n.has(c)||r.set(c,{action:e,subAction:t,date:i,staff:`시스템`,uid:null,message:a,details:{...o||{},dedupKey:s,autoTriggered:!0},read:!1,acknowledged:!1,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null})},async flush(){let e=[...r.entries()],n=0;return await Promise.all(Array.from({length:Math.min(4,e.length)},async()=>{for(;n<e.length;){let[r,i]=e[n++];try{let e=a(g,`activityLogs`,r);await c(g,async n=>{(await n.get(e)).exists()||n.set(e,{...i,timestamp:t()})})}catch(e){console.error(`[자동 알림 생성 실패]`,r,e)}}})),e.length>0}}}var k=[],A=[],j=[],M=[],he=new Map,N={currentQty:0,minimumQty:0},P=null,ge={totalBlocked:0,items:[]},F=null,_e=!1,I=[],ve=[],ye=null,be=[],L=[],R=[],z=0,B=null,V=[],H=null;function xe(e){return e?.category===`freezeDry`&&e.requiresSeparation===!1}function Se(e){let t=[`<span>${e.freezeDryBagQty||0}봉</span>`];return xe(e)||t.push(`<span>${e.breadPanQty||0}빵판</span>`),t.push(`<span>${e.freezePanQty||0}동결판</span>`),t.join(``)}var Ce=[],U=[];async function we({scope:e=re()}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>메인 로딩 중...</p></div>`,B=null,V=[],H=null,await W(e)&&(ne!==`main`||document.getElementById(`mainContent`)!==t||(G(),Jt()))}var Te=0;async function W(e=re()){let t=++Te,r=document.getElementById(`mainContent`),i=()=>t===Te&&r===document.getElementById(`mainContent`),s=E();await ee();let c=_(s),[l,u,d,p,h,v,y,b,x]=await Promise.all([e.getDocs(n(o(g,`productions`),m(`sortOrder`))),e.getDocs(o(g,`recipes`)),e.getDocs(o(g,`meatTypes`)),e.getDocs(o(g,`meatStocks`)),e.getDoc(a(g,`eggStock`,`global`)),e.getDoc(a(g,`productionCompletion`,s)),fe(s,null,e),ke(z,e),e.once(`equipmentAlerts:`+s,()=>te(s)).catch(e=>(console.error(`[equipment] 알림 로드 실패:`,e),[]))]);if(!i())return!1;let S=l.docs.map(e=>({id:e.id,...e.data()})),C=y?.date||null,[ne,w]=await Promise.all([C?e.getDoc(a(g,`productionCompletion`,C)):null,y?.blockingData||pe(s,e)]);if(!i())return!1;let T={eggStock:h.exists()?h.data():{currentQty:0,minimumQty:0},equipmentAlerts:x},ie=me((await e.getDocs(n(o(g,`activityLogs`),f(`date`,`==`,s)))).docs.map(e=>({id:e.id,...e.data()})));if(await Dt(s,ie,e,T),!i())return!1;let ae=await Xe(await ie.flush()?re():e);if(!i())return!1;F=C,_e=!!y?.closed,I=C?S.filter(e=>e.date===C&&e.status!==`deleted`):[];let oe=C?_(C):null;return ve=oe?S.filter(e=>e.date===oe&&e.status!==`deleted`):[],k=S.filter(e=>e.date===s&&e.status!==`deleted`),A=S.filter(e=>e.date===c&&e.status!==`deleted`),j=u.docs.map(e=>({id:e.id,...e.data()})),he=new Map(d.docs.map(e=>[e.id,e.data().category===`produce`?`produce`:`meat`])),M=p.docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed),N=T.eggStock,U=x,P=v.exists()?{id:v.id,...v.data()}:null,ye=ne?.exists()?{id:ne.id,...ne.data()}:null,ge=w,{calendarSchedules:be,calendarProductions:L,calendarEvents:R}=b,Ce=ae,!0}function G(){if(ne!==`main`)return;let e=document.getElementById(`mainContent`),t=E(),n=_(t),r=P?.status===`completed`,i=C===`admin`||C===`office`,a=B!==null,o=!a&&F!==null,s=a&&H?H:ge,c=_e?`마감 후 미처리 확인 필요`:`미마감 처리 필요`,l=a?V:o?I:r?A:k,u=a?`${B} 생산 (선택 날짜)`:o?`${F} 생산 (${c})`:r?`불러온 다음 영업일 생산 (${n})`:`오늘 생산`,d=a?`🥩 ${B} 출고원료`:o?`🥩 ${F} 출고원료`:`🥩 금일 출고원료`,f=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],p=a?B:o?F:r?n:t,m=new Date(p+`T00:00:00`),h=`${m.getMonth()+1}/${m.getDate()} (${f[m.getDay()]})`;e.innerHTML=`
    ${Ee()}
    <div class="main-layout">
      <div class="main-panel-left">
        <div class="main-panel-header">
          <span class="main-panel-title">📅 ${h} 생산${a?` <span style="font-size:11px;color:#3182ce;font-weight:normal;">(선택 날짜)</span>`:``}${o?` <span style="font-size:11px;color:#c53030;font-weight:normal;">(${c})</span>`:``}</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-secondary" id="btnBigView" style="font-size:11px;padding:3px 10px;">크게보기</button>
            <button class="btn-secondary" id="btnTodayReceiptSummary" style="font-size:11px;padding:3px 10px;">입고 현황 전체 보기</button>
            ${a?`
                <button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;opacity:0.5;cursor:not-allowed;" disabled title="오늘 화면에서만 가능">내일생산불러오기</button>
                <button class="btn-secondary" id="btnBackToToday" style="font-size:11px;padding:3px 10px;color:#3182ce;">↩ 오늘로 돌아가기</button>
              `:o?ye?.status===`completed`?`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;opacity:0.5;cursor:not-allowed;" disabled title="이미 처리되었습니다">이미 처리됨</button>`:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${ve.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기 (${F} 소급)</button>`:r?`
                  ${i?`<button class="btn-secondary" id="btnRefreshCompletion" style="font-size:11px;padding:3px 10px;color:#3182ce;" title="롤백 후 변경된 생산 기준으로 재차감">새로고침</button>`:``}
                  <button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>
                `:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${A.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기</button>`}
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${u}</span>
            ${r&&!a&&!o?`<span class="main-completed-pill">내일생산불러오기 완료</span>`:``}
          </div>
          <div class="main-production-grid">
            ${l.length===0?`<div class="main-empty">${a?`선택한 날짜에 생산 없음`:o?`처리 필요 날짜에 생산 없음`:r?`불러온 다음 영업일 생산 없음`:`오늘 생산 없음`}</div>`:l.map(e=>kt(e)).join(``)}
          </div>
        </div>
      </div>

      <!-- [묶음 6A] 우상단 = 2번(원육) + 3번(로그) 가로 분할 -->
      <div class="main-panel-right-top">
        <div class="main-panel-2">
          <div class="main-panel-header">
            <span class="main-panel-title">${d}</span>
          </div>
          <div style="padding:8px;font-size:12px;">
            ${Kt(l,r&&!a)}
          </div>
        </div>

        <!-- 3번 화면 = 차단 영역 + 생산 로그 + 사무 로그 -->
        <div class="main-panel-3">
          ${Ze(s)}
          <div class="main-log-columns">
            ${Qe(`production`)}
            ${Qe(`office`)}
          </div>
        </div>
      </div>

      <!-- [묶음 6B-1] 우하단 = 4번 캘린더 -->
      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">📆 2주 캘린더</span>
        </div>
        <div class="main-calendar-body">
          ${Ae()}
        </div>
      </div>
    </div>
  `,document.getElementById(`btnBigView`)?.addEventListener(`click`,nn),document.getElementById(`btnTodayReceiptSummary`)?.addEventListener(`click`,()=>jt(l,p)),document.getElementById(`btnTomorrowLoad`)?.addEventListener(`click`,()=>Yt(o?F:void 0)),document.getElementById(`btnCancelCompletion`)?.addEventListener(`click`,$t),document.getElementById(`btnRefreshCompletion`)?.addEventListener(`click`,en),document.getElementById(`btnBackToToday`)?.addEventListener(`click`,tn),(C===`admin`||C===`office`||C===`production`)&&(o||a||!r)&&document.querySelectorAll(`.main-production-card.receivable`).forEach(e=>{e.style.cursor=`pointer`,e.title=`클릭하여 제품 입고`,e.addEventListener(`click`,()=>{[...V,...I,...k,...A].find(t=>t.id===e.dataset.id)?.category===`freezeDry`?Pt(e.dataset.id):Mt(e.dataset.id)})}),document.querySelectorAll(`.alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;y(t),ae()})}),Ne(),at()}function Ee(){if(C===`production`)return``;let e=se(E());return e?`
    <div class="holiday-data-notice holiday-data-notice--${e.level}">
      ${e.message}
    </div>
  `:``}function De(e=0){let t=new Date(E()+`T00:00:00`),n=(t.getDay()+6)%7,r=new Date(t);r.setDate(r.getDate()-n+e*7);let i=[];for(let e=0;e<14;e++){let t=new Date(r);t.setDate(t.getDate()+e);let n=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,`0`),o=String(t.getDate()).padStart(2,`0`);i.push(`${n}-${a}-${o}`)}return{dates:i,startDate:i[0],endDate:i[13]}}async function Oe(e=0){let t=await ke(e);({calendarSchedules:be,calendarProductions:L,calendarEvents:R}=t)}async function ke(e=0,t=re()){let{startDate:r,endDate:i}=De(e),a=e=>n(o(g,e),f(`date`,`>=`,r),f(`date`,`<=`,i)),[s,c,l]=await Promise.all([t.getDocs(a(`schedules`)),t.getDocs(a(`productions`)),t.getDocs(a(`events`)).catch(e=>(console.warn(`[캘린더] events 컬렉션 로드 실패:`,e.message),null))]);return{calendarSchedules:s.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status===`scheduled`),calendarProductions:c.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status!==`deleted`),calendarEvents:l?l.docs.map(e=>({id:e.id,...e.data()})):[]}}function Ae(){let{dates:e}=De(z),t=E(),n=b(),r=oe();return`
    <div class="cal-container">
      <div class="cal-toolbar">
        <button class="cal-nav-btn" id="btnCalPrev" title="이전 주">◀</button>
        <span class="cal-range-label">${Fe(e[0],e[13])}</span>
        <button class="cal-nav-btn" id="btnCalNext" title="다음 주">▶</button>
        ${z===0?``:`<button class="cal-today-btn" id="btnCalToday">오늘로</button>`}
      </div>
      <div class="cal-weekday-row">
        ${[`월`,`화`,`수`,`목`,`금`,`토`,`일`].map((e,t)=>`<div class="cal-weekday ${t>=5?`cal-weekday-weekend`:``}">${e}</div>`).join(``)}
      </div>
      <div class="cal-grid">
        ${e.map(e=>je(e,t,n,r)).join(``)}
      </div>
    </div>
  `}function je(e,t,n,r){let i=(new Date(e+`T00:00:00`).getDay()+6)%7>=5,a=r[e]||null,o=r[Me(e,1)]||null,s=!i&&a?.affectsProduction!==!0&&(a?.affectsShipping===!0||o?.affectsShipping===!0&&o.shippingClosedFromEnabled===!0),c=!s&&(i||a?.affectsProduction===!0||!a&&n.includes(e)),l=e===t,u=R.filter(t=>t.date===e),d=be.filter(t=>t.date===e),f=L.filter(t=>t.date===e),p=[];u.forEach(e=>{let t=e.title||``;p.push(`<div class="cal-tag cal-tag-event" title="${K(t)}">📌 ${K(t)}</div>`)}),d.forEach(e=>{let t=Ie(e);p.push(`<div class="cal-tag cal-tag-schedule" title="${K(t)}">📦 ${K(t)}</div>`)}),f.slice(0,3).forEach(e=>{let t=e.productionUnitQty==null?``:` ${Ut(e.productionUnitQty)}${zt(e)}`,n=`${e.recipeName||``}${t}`;p.push(`<div class="cal-tag cal-tag-production" title="${K(n)}">🏭 ${K(n)}</div>`)}),f.length>3&&p.push(`<div class="cal-tag-more">+${f.length-3}</div>`);let m=e.split(`-`),h=parseInt(m[2],10),g=h===1?`${parseInt(m[1],10)}/${h}`:String(h),_=s?`배송불가일`:``;return`
    <div class="${[`cal-cell`,c?`cal-cell-holiday`:``,s?`cal-cell-shipping-closed`:``,l?`cal-cell-today`:``].filter(Boolean).join(` `)}" data-date="${e}">
      <div class="cal-cell-date-row">
        <span class="cal-cell-date">${g}</span>
        ${_?`<span class="cal-shipping-closed-label">(${_})</span>`:``}
      </div>
      <div class="cal-cell-tags">${p.join(``)}</div>
    </div>
  `}function Me(e,t){let n=new Date(e+`T00:00:00`);return n.setDate(n.getDate()+t),`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,`0`)}-${String(n.getDate()).padStart(2,`0`)}`}function Ne(){document.getElementById(`btnCalPrev`)?.addEventListener(`click`,()=>{--z,Pe()}),document.getElementById(`btnCalNext`)?.addEventListener(`click`,()=>{z+=1,Pe()}),document.getElementById(`btnCalToday`)?.addEventListener(`click`,()=>{z=0,Pe()}),document.querySelectorAll(`.cal-cell`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date;t&&Le(t)})})}async function Pe(){await Oe(z);let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=Ae(),Ne())}function Fe(e,t){let n=e.split(`-`),r=t.split(`-`);return`${parseInt(n[1])}/${parseInt(n[2])} ~ ${parseInt(r[1])}/${parseInt(r[2])}`}function Ie(e){let t=e.itemNameSnapshot||``,n=e.orderedQty==null?``:e.orderedQty,r=e.orderedUnit||``;return e.type===`egg`?`계란 ${n}${r}`:e.type===`meat`?`${t||`원육`} ${n}${r}`:e.type===`bag`?`${t||`봉투`} ${n}${r}`:`${t} ${n}${r}`}function Le(e){let t=C===`admin`||C===`office`,n=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],r=new Date(e+`T00:00:00`),i=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${n[r.getDay()]})`,a=b(),o=r.getDay(),s=o===0||o===6,c=a.includes(e),l=s||c?`<span class="cal-modal-holiday-pill">휴일</span>`:``,u=R.filter(t=>t.date===e),d=be.filter(t=>t.date===e),f=L.filter(t=>t.date===e),p=u.length===0?`<div class="cal-modal-empty">등록된 이벤트 없음</div>`:u.map(e=>`
        <div class="cal-modal-list-item cal-event-item" data-event-id="${e.id}">
          <div class="cal-event-row">
            <span class="cal-event-title">📌 ${K(e.title||``)}</span>
            ${t?`
              <span class="cal-event-actions">
                <button class="cal-event-btn" data-event-act="edit" data-event-id="${e.id}">수정</button>
                <button class="cal-event-btn cal-event-btn-danger" data-event-act="delete" data-event-id="${e.id}">삭제</button>
              </span>
            `:``}
          </div>
          ${e.content?`<div class="cal-modal-list-sub">${K(e.content)}</div>`:``}
        </div>
      `).join(``),m=d.length===0?`<div class="cal-modal-empty">예정 없음</div>`:d.map(e=>`<div class="cal-modal-list-item">📦 ${K(Ie(e))}</div>`).join(``),h=f.length===0?`<div class="cal-modal-empty">생산 없음</div>`:f.map(e=>{let t=e.batchNo?` <span style="color:#888;">(${e.batchNo}차)</span>`:e.round>1?` <span style="color:#888;">(${e.round}회차)</span>`:``;return`<div class="cal-modal-list-item">🏭 ${K(e.recipeName||``)}${t}</div>`}).join(``),g;g=s?`<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;">
         <input type="checkbox" checked disabled> 휴일 (토/일은 자동)
       </label>`:t?`<label class="cal-holiday-toggle">
         <input type="checkbox" id="chkManualHoliday" ${c?`checked`:``}> 이 날을 휴일로 지정
       </label>`:`<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;" title="대표/사무실만 변경 가능">
         <input type="checkbox" ${c?`checked`:``} disabled> 이 날을 휴일로 지정
       </label>`,$(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${i} ${l}</h3>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">📌 이벤트</div>
      ${p}
    </div>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">📦 입고 예정</div>
      ${m}
    </div>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">🏭 생산</div>
      ${h}
    </div>

    <div class="cal-modal-section" style="border-top:1px solid #eee;padding-top:8px;">
      ${g}
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;">
      ${t?`<button class="btn-secondary" id="btnAddEvent">+ 이벤트 추가</button>`:`<span style="color:#888;font-size:12px;align-self:center;">이벤트 등록은 대표/사무실만 가능</span>`}
      ${f.length>0?`<button class="btn-secondary" id="btnViewThisDate">이 날짜로 보기</button>`:`<button class="btn-secondary" disabled title="생산 없음" style="opacity:0.5;cursor:not-allowed;">이 날짜로 보기</button>`}
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.getElementById(`btnAddEvent`)?.addEventListener(`click`,()=>{ze(e,null)}),document.querySelectorAll(`[data-event-act]`).forEach(t=>{t.addEventListener(`click`,async n=>{let r=t.dataset.eventAct,i=t.dataset.eventId;r===`edit`?ze(e,i):r===`delete`&&await Ve(i,e)})}),document.getElementById(`chkManualHoliday`)?.addEventListener(`change`,async t=>{await He(e,t.target.checked)}),document.getElementById(`btnViewThisDate`)?.addEventListener(`click`,async()=>{if(F&&e>F){alert(`${F} 처리가 아직 끝나지 않았습니다.\n먼저 해당 날짜를 처리한 뒤 다음 날짜를 확인하세요.`),B=null,V=[],H=null,closeModal(),G();return}B=e,V=L.filter(t=>t.date===e),H=await pe(e),closeModal(),G()})}function K(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function Re(e){return Number(e||0).toLocaleString(`ko-KR`)}function ze(e,t){let n=!!t,r=n?R.find(e=>e.id===t):null,i=r?.title||``,a=r?.content||``,o=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],s=new Date(e+`T00:00:00`),c=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${o[s.getDay()]})`;$(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${n?`이벤트 수정`:`이벤트 등록`} — ${c}</h3>

    <div style="margin-bottom:10px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">제목 (필수)</label>
      <input type="text" id="evTitle" maxlength="50" value="${K(i)}"
             style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">내용 (선택)</label>
      <textarea id="evContent" rows="3" maxlength="300"
                style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;resize:vertical;">${K(a)}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      ${n?`<button class="btn-secondary" id="btnEvDelete" style="color:#c92a2a;border-color:#ffc9c9;">삭제</button>`:``}
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnEvSave">${n?`저장`:`등록`}</button>
    </div>
  `),setTimeout(()=>document.getElementById(`evTitle`)?.focus(),50),document.getElementById(`btnEvSave`)?.addEventListener(`click`,async()=>{let n=document.getElementById(`evTitle`).value.trim(),r=document.getElementById(`evContent`).value.trim();if(!n){alert(`제목을 입력해주세요.`);return}await Be({id:t,date:e,title:n,content:r})}),n&&document.getElementById(`btnEvDelete`)?.addEventListener(`click`,async()=>{await w({title:`이벤트 삭제`,message:`"${i}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`})&&await Ve(t,e)})}async function Be({id:e,date:n,title:r,content:s}){try{e?await i(a(g,`events`,e),{title:r,content:s||``,updatedAt:t()}):await u(o(g,`events`),{date:n,title:r,content:s||``,createdAt:t()}),closeModal(),await Oe(z),Ue(),Le(n)}catch(e){console.error(`[6B-2] 이벤트 저장 실패:`,e),alert(`저장 중 오류가 발생했습니다.`)}}async function Ve(e,t){let n=R.find(t=>t.id===e);if(n&&await w({title:`이벤트 삭제`,message:`"${n.title||`(제목 없음)`}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`}))try{await p(a(g,`events`,e)),closeModal(),await Oe(z),Ue(),Le(t)}catch(e){console.error(`[6B-2] 이벤트 삭제 실패:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}async function He(e,n){try{n?await h(a(g,`holidays`,e),{date:e,holidayType:`internalOff`,title:`수동 휴일`,label:`수동 휴일`,affectsProduction:!0,affectsShipping:!0,shippingClosedFromEnabled:!0,isAutoGenerated:!1,status:`active`,createdAt:t(),updatedAt:t()}):await h(a(g,`holidays`,e),{date:e,status:`deleted`,updatedAt:t(),deletedAt:t()},{merge:!0}),await v(),Ue()}catch(e){console.error(`[6B-2] 휴일 토글 실패:`,e),alert(`휴일 설정 중 오류가 발생했습니다.`)}}function Ue(){let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=Ae(),Ne())}var We=[`bag`,`egg`,`meat`,`frozenProduct`,`frozenSep`,`schedule`,`frozenPan`,`closing`,`supplementStock`,`recipe`,`settings`,`holiday`,`conversion`,`equipment`],Ge=[`production`,`repackaging`,`pretreat`,`event`,`scheduleDue`,`autoRepack`,`minStock`,`frozenStockLow`,`partDue`],Ke={"meat:adjust":`production`},qe=new Set([`scheduleDue:trigger`,`autoRepack:trigger`,`autoRepack:diff`,`minStock:alert`,`frozenStockLow:alert`,`partDue:alert`,`schedule:completeDiff`,`closing:refresh`]);function Je(e){let t=`${e.action}:${e.subAction}`;return Ke[t]?Ke[t]:Ge.includes(e.action)?`production`:We.includes(e.action)?`office`:`ignore`}function q(e){return qe.has(`${e.action}:${e.subAction}`)}function Ye(e){let t=new Date(new Date().getTime()-e*24*60*60*1e3);return new Date(t.getTime()+540*60*1e3).toISOString().split(`T`)[0]}async function J(){Ce=await Xe()}async function Xe(e=re()){let t=E(),r=Ye(10),[i,a]=await Promise.all([e.getDocs(n(o(g,`activityLogs`),f(`date`,`==`,t))).catch(e=>(console.error(`[6C-1] 당일 로그 로드 실패:`,e),null)),e.getDocs(n(o(g,`activityLogs`),f(`date`,`>=`,r),f(`date`,`<`,t))).catch(e=>(console.error(`[6C-1] 과거 로그 로드 실패:`,e),null))]),s=i?i.docs.map(e=>({id:e.id,...e.data()})):[],c=a?a.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.acknowledged!==!0&&q(e)):[];return[...s,...c].sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}function Ze(e=ge){let t=[];(e.items||[]).forEach(e=>{t.push(`
      <div class="alert-card alert-card-blocker">
        <span class="alert-card-label">⛔ ${e.reason||e.label}</span>
        <button class="alert-card-jump" data-jump="${e.jumpMenu}">처리하러 가기 →</button>
      </div>
    `)}),N.minimumQty>0&&N.currentQty<N.minimumQty&&t.push(`
      <div class="alert-card alert-card-warning">
        <span class="alert-card-label">⚠️ 계란 부족 (현재: ${N.currentQty}개 / 최소: ${N.minimumQty}개)</span>
        <button class="alert-card-jump" data-jump="egg">처리하러 가기 →</button>
      </div>
    `);let n=qt();return n&&t.push(n),t.length===0?``:`
    <div class="log-blocker-area">
      ${t.join(``)}
    </div>
  `}function Qe(e){let t=e===`production`?`🏭 생산 로그`:`🗒️ 사무 로그`,n=Ce.filter(t=>Je(t)===e);n.sort((e,t)=>{let n=q(e)&&e.acknowledged!==!0?1:0,r=q(t)&&t.acknowledged!==!0?1:0;if(n!==r)return r-n;let i=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-i});let r=n.some(e=>e.acknowledged!==!0&&!q(e)),i=n.length===0?`<div class="log-empty">${e===`production`?`오늘 생산 로그 없음`:`오늘 사무 로그 없음`}</div>`:n.map(e=>$e(e)).join(``);return`
    <div class="log-section">
      <div class="log-section-header">
        <span class="log-section-title">${t}</span>
        <div class="log-section-actions">
          <button class="log-action-btn" data-log-act="ackAll" data-log-cat="${e}" ${r?``:`disabled`}>모두 확인</button>
          <button class="log-action-btn" data-log-act="all" data-log-cat="${e}">전체보기</button>
          <button class="log-action-btn" data-log-act="history" data-log-cat="${e}">히스토리</button>
        </div>
      </div>
      <div class="log-section-body">
        ${i}
      </div>
    </div>
  `}function $e(e){let t=e.acknowledged!==!0,n=q(e),r=E(),i=x(),a;if(e.date===r)a=rt(e.timestamp);else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[1])}/${parseInt(t[2])}`:e.date||``}let o=[`log-row`,t?`log-row-unack`:``,n?`log-row-critical`:``].filter(Boolean).join(` `),s=t?`<button class="log-ack-btn" data-log-act="ack" data-log-id="${e.id}">확인</button>`:`<span class="log-ack-done" title="${e.acknowledgedBy||``} 확인">✓</span>`,c=n&&t?`<span class="log-critical-badge">⚠️</span>`:``,l=nt(e);return`
    <div class="${o}">
      <span class="log-row-time">${a}</span>
      <span class="log-row-msg">${c}${K(l)}</span>
      <span class="log-row-action">${s}</span>
    </div>
  `}function et(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function tt(e,t,n){if(t===`g`)return et(e);let r=`${e}${t}`;return t!==`마리`||!n?r:`${r} (${et(Number(e||0)*Number(n||0))})`}function nt(e){if(e.action!==`schedule`||e.subAction!==`completeDiff`)return e.message||`(메시지 없음)`;let t=e.details||{};if(t.orderedQty==null||t.actualQty==null)return e.message||`(메시지 없음)`;let n=t.orderedUnit||t.unit||``,r=t.unit||n,i=tt(t.orderedQty,n,t.orderedUnitGrams),a=tt(t.actualQty,r,t.orderedUnitGrams),o=t.itemName||`입고 예정`,s=e.staff||``;return`${o} 입고 완료 ⚠️ 발주 ${i} → 실제 ${a}${s?` / 담당: ${s}`:``}`}function rt(e){if(!e||!e.toMillis)return`—`;let t=new Date(e.toMillis()),n=new Date(t.getTime()+540*60*1e3);return`${String(n.getUTCHours()).padStart(2,`0`)}:${String(n.getUTCMinutes()).padStart(2,`0`)}`}function it(){return C===`admin`?`대표`:C===`office`?`사무실`:C===`production`?`생산실`:`운영자`}function at(){document.querySelectorAll(`[data-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;await ot(t)})}),document.querySelectorAll(`[data-log-act="ackAll"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logCat;await ut(t)})}),document.querySelectorAll(`[data-log-act="all"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;mt(t)})}),document.querySelectorAll(`[data-log-act="history"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;ht(t)})})}async function ot(e){try{let t=await s(a(g,`activityLogs`,e));if(!t.exists()){alert(`로그를 찾을 수 없습니다.`);return}let n={id:e,...t.data()};if(n.action===`autoRepack`&&n.subAction===`trigger`&&n.acknowledged!==!0){await ct(e,n);return}await le(e,it()),await J(),Y()}catch(e){console.error(`[6C-1] 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}}async function st(){let e=await s(a(g,`staffGroups`,`lead`));return(e.exists()&&e.data().members||[]).filter(e=>e&&e.active!==!1&&e.name).sort((e,t)=>(e.sortOrder||0)-(t.sortOrder||0)).map(e=>e.name)}async function ct(e,t){if(C===`office`){alert(`자동 재포장 확인은 생산실/대표 계정에서만 처리할 수 있습니다.`);return}let n=t.details||{},r=n.meatName||`?`,i=Number(n.surplusG)||0,a=Number(n.processedUnitWeightG)||0,o=n.repackedStockId,s=n.mode;if(!o||!a){alert(`자동 재포장 로그 데이터가 손상되어 처리할 수 없습니다. (운영자에게 문의)`);return}let c=i/a,l=Number.isInteger(c)?`${c}개`:`약 ${c.toFixed(2)}개`,u=await st();if(u.length===0){alert(`주임 그룹 담당자가 등록되어 있지 않습니다. 설정에서 추가해주세요.`);return}$(`
    <div style="padding:16px; min-width:440px; max-width:560px;">
      <h3 style="margin:0 0 12px;">자동 재포장 확인 — ${K(r)}</h3>
      <div style="background:#f5f5f5; padding:12px; border-radius:4px; margin-bottom:16px; line-height:1.7;">
        <div><b>시스템 자동 재포장 수량 (수정 불가)</b></div>
        <div style="font-size:15px; font-weight:600; color:#1f2937;">${Re(i)}g (${(i/1e3).toFixed(2)}kg)</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">
          단위중량 ${Re(a)}g 기준 ${l}<br>
          모드: ${s===`merged`?`기존 lot 합산`:`신규 lot 생성`}
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block; margin-bottom:4px;"><b>실제 재포장 수량 (개)</b></label>
        <input type="number" id="ar-actual-count" min="0" step="1" value="" placeholder="실제 만든 개수 입력" style="width:100%; padding:8px; box-sizing:border-box;">
        <div id="ar-actual-g" style="font-size:13px; color:#6b7280; margin-top:4px;">→ 개수 입력 시 환산 g 자동 표시</div>
      </div>
      <div style="margin-bottom:16px;">
        <label style="display:block; margin-bottom:4px;"><b>실제 재포장 담당자 (주임)</b></label>
        <select id="ar-staff" style="width:100%; padding:8px; box-sizing:border-box;">
          <option value="">담당자 선택...</option>
          ${u.map(e=>`<option value="${K(e)}">${K(e)}</option>`).join(``)}
        </select>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="ar-cancel" style="padding:8px 16px; background:#e5e7eb; border:none; border-radius:4px; cursor:pointer;">취소</button>
        <button id="ar-confirm" style="padding:8px 16px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">확인</button>
      </div>
    </div>
  `);let d=document.getElementById(`ar-actual-count`),f=document.getElementById(`ar-actual-g`);d.addEventListener(`input`,()=>{let e=parseInt(d.value,10);if(isNaN(e)||e<0){f.textContent=`→ 개수 입력 시 환산 g 자동 표시`;return}let t=e*a,n=t-i,r=n===0?` (시스템과 동일)`:` (차이 ${n>0?`+`:``}${Re(n)}g)`;f.textContent=`→ ${Re(t)}g (${(t/1e3).toFixed(2)}kg)${r}`}),document.getElementById(`ar-cancel`).addEventListener(`click`,()=>{closeModal()}),document.getElementById(`ar-confirm`).addEventListener(`click`,async()=>{let n=parseInt(d.value,10),r=document.getElementById(`ar-staff`).value;if(!r){alert(`담당자를 선택해주세요.`);return}if(isNaN(n)||n<0){alert(`실제 수량은 0 이상의 정수여야 합니다.`);return}if(!(n===0&&!await w({title:`실제 재포장 수량 0개`,message:`실제 재포장 수량이 0개입니다.
자동 재포장 lot을 0g으로 만들고 마감 처리합니다.
진행할까요?`,confirmText:`진행`,cancelText:`취소`,danger:!0}))){closeModal();try{await lt({logId:e,log:t,actualCount:n,surplusG:i,processedUnitWeightG:a,staffName:r})}catch(e){console.error(`[묶음 9 #9] 자동 재포장 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다: `+(e.message||e))}}})}async function lt({logId:e,log:t,actualCount:n,surplusG:r,processedUnitWeightG:o,staffName:c}){let l=t.details||{},u=l.repackedStockId,d=l.meatTypeId,f=l.meatName,p=E(),m=n*o,h=m-r;if(h===0){await le(e,c),await J(),Y();return}let _=a(g,`meatStocks`,u),v=await s(_);if(!v.exists())throw Error(`자동 재포장 lot 문서를 찾을 수 없습니다.`);let y=v.data(),b=Number(y.remaining)||0,x=b+h;if(x<0)throw Error(`자동 재포장 lot 잔량이 음수가 됩니다 (현재 ${b}g, 보정 ${h}g).`);await i(_,{remaining:x,closed:n===0&&x===0,updatedAt:new Date}),await ce({action:`autoRepack`,subAction:`diff`,date:p,staff:c,message:`자동 재포장 차이 — ${f} 시스템 ${r}g / 실제 ${m}g (${h>0?`+`:``}${h}g) — 담당: ${c}`,details:{meatTypeId:d,meatName:f,repackedStockId:u,processedUnitWeightG:o,systemG:r,actualCount:n,actualG:m,diffG:h,sourceLogId:e}}),await le(e,c),await J(),Y()}async function ut(e){let t=Ce.filter(t=>Je(t)===e&&t.acknowledged!==!0&&!q(t));if(t.length!==0&&await w({title:`모두 확인`,message:`${e===`production`?`생산`:`사무`} 로그 ${t.length}건을 모두 확인 처리하시겠습니까?\n(확인 필수 항목은 제외됩니다)`,confirmText:`확인 처리`,cancelText:`취소`}))try{let e=it();await Promise.all(t.map(t=>le(t.id,e))),await J(),Y()}catch(e){console.error(`[6C-1] 모두 확인 실패:`,e),alert(`일괄 확인 중 오류가 발생했습니다.`)}}function Y(){let e=document.querySelector(`.main-panel-3`);e&&(e.innerHTML=`
    ${Ze()}
    ${Qe(`production`)}
    ${Qe(`office`)}
  `,document.querySelectorAll(`.main-panel-3 .alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;y(t),ae()})}),at())}var X=[],dt=null,Z=``,Q=`all`,ft=null,pt=!1;async function mt(e){dt=e,Q=`all`,Z=``,X=[],await gt(),vt()}async function ht(e){dt=e,Q=`history`,Z=``,X=[],ft=null,pt=!1,await _t(),vt()}async function gt(){let t=E(),r=Ye(10);try{X=(await e(n(o(g,`activityLogs`),f(`date`,`>=`,r),f(`date`,`<=`,t)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>Je(e)===dt).sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}catch(e){console.error(`[6C-1B] 전체보기 로드 실패:`,e),alert(`전체보기 로드 실패: 관리자에게 문의해주세요.`)}}async function _t(){if(!pt)try{let t=[m(`timestamp`,`desc`),d(100)];ft&&t.push(r(ft));let i=await e(n(o(g,`activityLogs`),...t));i.docs.length<100&&(pt=!0),i.docs.length>0&&(ft=i.docs[i.docs.length-1]);let a=i.docs.map(e=>({id:e.id,...e.data()})).filter(e=>Je(e)===dt);X=[...X,...a]}catch(e){console.error(`[6C-1B] 히스토리 로드 실패:`,e),alert(`히스토리 로드 실패: 관리자에게 문의해주세요.`)}}function vt(){$(`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;">${dt===`production`?`생산 로그`:`사무 로그`} — ${Q===`all`?`전체보기 (10일)`:`히스토리 (전체)`}</h3>
      ${Q===`all`?`<button class="btn-secondary" id="btnLogModalSwitch" style="font-size:11px;">히스토리로 전환 →</button>`:``}
    </div>

    <div style="margin-bottom:8px;">
      <input type="text" id="logModalSearch" placeholder="메시지 검색 (담당자명, 품목명 등)"
             style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:12px;box-sizing:border-box;"
             value="${K(Z)}">
    </div>

    <div id="logModalList" class="log-modal-list">
      ${xt()}
    </div>

    <div id="logModalFooter" style="display:flex;gap:8px;justify-content:space-between;margin-top:12px;">
      <div>
        ${Q===`history`&&!pt?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
      </div>
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.getElementById(`logModalSearch`)?.addEventListener(`input`,e=>{Z=e.target.value,yt()}),document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await _t(),yt(),bt()}),document.getElementById(`btnLogModalSwitch`)?.addEventListener(`click`,async()=>{Q=`history`,Z=``,X=[],ft=null,pt=!1,await _t(),vt()}),Ct()}function yt(){let e=document.getElementById(`logModalList`);e&&(e.innerHTML=xt(),Ct())}function bt(){let e=document.getElementById(`logModalFooter`);e&&(e.innerHTML=`
    <div>
      ${Q===`history`&&!pt?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
    </div>
    <button class="btn-secondary" onclick="closeModal()">닫기</button>
  `,document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await _t(),yt(),bt()}))}function xt(){let e=Z.trim().toLowerCase(),t=e?X.filter(t=>(t.message||``).toLowerCase().includes(e)):X;if(t.length===0)return`<div class="log-empty" style="padding:24px 8px;">${e?`검색 결과 없음`:`표시할 로그 없음`}</div>`;let n=null,r=[];return t.forEach(e=>{if(e.date!==n){n=e.date;let t=E(),i=x(),a;if(e.date===t)a=`오늘`;else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[0])}.${parseInt(t[1])}.${parseInt(t[2])}`:e.date||``}r.push(`<div class="log-modal-date-header">${a}</div>`)}r.push(St(e))}),r.join(``)}function St(e){let t=e.acknowledged!==!0,n=q(e),r=rt(e.timestamp),i=[`log-modal-row`,t?`log-row-unack`:``,n?`log-row-critical`:``].filter(Boolean).join(` `),a=t?`<button class="log-ack-btn" data-modal-log-act="ack" data-log-id="${e.id}">확인</button>`:`<span class="log-ack-done" title="${e.acknowledgedBy||``} 확인">✓ ${K(e.acknowledgedBy||``)}</span>`;return`
    <div class="${i}">
      <span class="log-row-time">${r}</span>
      <span class="log-row-msg">${n&&t?`<span class="log-critical-badge">⚠️</span>`:``}${K(nt(e))}</span>
      <span class="log-row-action">${a}</span>
    </div>
  `}function Ct(){document.querySelectorAll(`[data-modal-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;try{let e=X.find(e=>e.id===t);if(e&&e.action===`autoRepack`&&e.subAction===`trigger`&&e.acknowledged!==!0){await ct(t,e);return}await le(t,it()),e&&(e.acknowledged=!0,e.acknowledgedBy=it()),await J(),Y(),yt()}catch(e){console.error(`[6C-1B] 모달 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}})})}async function wt(e,t,r,i){try{let i=await r.getDocs(n(o(g,`events`),f(`date`,`==`,e)));for(let n of i.docs){let r={id:n.id,...n.data()};t.enqueue({action:`event`,subAction:`dueToday`,date:e,message:`📅 오늘 일정 — ${r.title||`(제목 없음)`}`,details:{eventId:r.id,title:r.title||``},dedupKey:`event:${r.id}`})}}catch(e){console.warn(`[6C-3] 이벤트 자동 발행 skip:`,e.message)}}async function Tt(e,t,r,i){try{let i=await r.getDocs(n(o(g,`schedules`),f(`date`,`==`,e)));for(let n of i.docs){let r={id:n.id,...n.data()};if(r.status!==`scheduled`)continue;let i=r.type===`egg`?`계란`:r.itemNameSnapshot||`(품목)`;t.enqueue({action:`scheduleDue`,subAction:`trigger`,date:e,message:`📦 입고 예정일 도래 — ${i} ${r.orderedQty}${r.orderedUnit}`,details:{scheduleId:r.id,type:r.type,itemName:r.itemNameSnapshot,orderedQty:r.orderedQty,orderedUnit:r.orderedUnit},dedupKey:`scheduleDue:${r.id}`})}}catch(e){console.error(`[6C-3] 입고 예정 자동 발행 실패:`,e)}}async function Et(e,t,r,i){try{i.eggStock.minimumQty>0&&i.eggStock.currentQty<i.eggStock.minimumQty&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ 계란 부족 — 현재 ${i.eggStock.currentQty}개 / 최소 ${i.eggStock.minimumQty}개`,details:{kind:`egg`,current:i.eggStock.currentQty,minimum:i.eggStock.minimumQty},dedupKey:`minStock:egg`});let a=await r.getDocs(o(g,`meatTypes`)),s=(await r.getDocs(o(g,`meatStocks`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed);for(let n of a.docs){let r={id:n.id,...n.data()};if(!r.minimumQtyG)continue;let i=s.filter(e=>e.meatTypeId===r.id).reduce((e,t)=>e+(t.remaining||0),0);i<r.minimumQtyG&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`원육`} 부족 — 현재 ${(i/1e3).toFixed(1)}kg / 최소 ${(r.minimumQtyG/1e3).toFixed(1)}kg`,details:{kind:`meat`,meatTypeId:r.id,name:r.name,current:i,minimum:r.minimumQtyG},dedupKey:`minStock:meat:${r.id}`})}let c=await r.getDocs(o(g,`bagTypes`));for(let n of c.docs){let r={id:n.id,...n.data()};r.minimumQty&&(r.currentQty||0)<r.minimumQty&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`봉투`} 부족 — 현재 ${r.currentQty||0}장 / 최소 ${r.minimumQty}장`,details:{kind:`bag`,bagTypeId:r.id,name:r.name,current:r.currentQty||0,minimum:r.minimumQty},dedupKey:`minStock:bag:${r.id}`})}let l=await r.getDocs(n(o(g,`supplementTypes`),f(`active`,`==`,!0))),u=await r.getDocs(o(g,`supplementStock`)),d=new Map(u.docs.map(e=>[e.id,{id:e.id,...e.data()}]));for(let n of l.docs){let r={id:n.id,...n.data()},i=d.get(r.id),a=i?Number(i.currentQty||0):0;a>=5||t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`영양제`} 부족 — 현재 ${a}봉 / 최소 5봉`,details:{kind:`supplement`,supplementTypeId:r.id,name:r.name,current:a,minimum:5},dedupKey:`supplementMin:alert:${r.id}`})}}catch(e){console.error(`[6C-3] 최소재고 자동 발행 실패:`,e)}}async function Dt(e,t,n,r){await Promise.all([wt(e,t,n,r),Tt(e,t,n,r),Et(e,t,n,r),Ot(e,t,n,r)])}async function Ot(e,t,n,r){for(let n of r.equipmentAlerts){let r=n.part;n.kind===`due`?t.enqueue({action:`partDue`,subAction:`alert`,date:e,message:`🔧 ${T(r)} 교체 ${n.overdue?`예정일 ${Math.abs(n.dday)}일 지남`:ie(n.dday)} (예정 ${r.nextDueAt})`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,nextDueAt:r.nextDueAt,dday:n.dday},dedupKey:`partDue:${r.id}`}):n.kind===`low`&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${T(r)} 부품 부족 — 현재 ${Number(r.currentQty||0)}개 / 최소 ${Number(r.minimumQty||0)}개`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,current:Number(r.currentQty||0),minimum:Number(r.minimumQty||0)},dedupKey:`minStock:part:${r.id}`})}}function kt(e){let t=e.ingredientsSnapshot||[],n=Rt(e,t),r=e.batchNo?` <span>${e.batchNo}차</span>`:e.round>1?` <span>${e.round}회차</span>`:``;return`
    <div class="main-production-card${e.category===`raw`||e.category===`freezeDry`?` receivable`:``}${e.received?` received`:``}" data-id="${e.id}" style="--recipe-color:${e.color||`#ef7bd0`}">
      ${e.received?`<div class="main-received-stamp">입고완료</div>`:``}
      <div class="main-production-card-title">
        ${e.recipeName}${r}
      </div>
      <table class="main-ingredient-table">
        <thead>
          <tr>
            <th>부위</th>
            <th>생산수량</th>
            <th>단위</th>
          </tr>
        </thead>
        <tbody>
          <tr class="unit-row">
            <td>${n}</td>
            <td>${Ut(e.productionUnitQty)}</td>
            <td>${zt(e)}</td>
          </tr>
          ${t.map(t=>`
            <tr>
              <td>${t.name}</td>
              <td>${Vt(e,t)}</td>
              <td>${Ht(e,t)}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${e.category===`raw`?`<span>${e.rawBoxQty||0}박스</span>`:``}
        ${e.category===`freezeDry`?Se(e):``}
        ${e.received?At(e):``}
      </div>
    </div>
  `}function At(e){if(e.category===`freezeDry`){let t=e.receivedFreezeType===`breadPan`?`빵판`:`동결판`;return`<span class="main-received-badge">✅ 입고완료 ${e.receivedFreezeQty||0}${t}</span>`}return`<span class="main-received-badge">✅ 입고완료 ${e.receivedBox||0}박스${e.receivedRemainder?` +${e.receivedRemainder}낱개`:``}</span>`}function jt(e,t){let n=(e||[]).filter(e=>e.category===`raw`||e.category===`freezeDry`),r=0,i=0,a=0,o=0,s=n.length===0?`<div style="color:#aaa;text-align:center;padding:18px;">입고 대상 생산이 없습니다.</div>`:n.map(e=>{let t=`<span style="color:#c53030;">미입고</span>`;if(e.received)if(e.category===`raw`){let n=Number(e.receivedBox||0),a=Number(e.receivedRemainder||0);r+=n,i+=a,t=`${n}박스${a?` + ${a}낱개`:``}`}else{let n=Number(e.receivedFreezeQty||0);e.receivedFreezeType===`breadPan`?(a=D(a+n),t=`${n}빵판`):(o+=n,t=`${n}동결판`)}return`
        <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eee;">
          <span>${e.recipeName||e.id||`생산`}</span>
          <span style="font-weight:600;">${t}</span>
        </div>
      `}).join(``);$(`
    <h3 class="modal-title">생산 입고 현황 — ${t}</h3>
    <div style="background:#f8f9fa;border:1px solid #e5e5e5;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">
      <div>생식 합계: <b>${r}</b>박스${i?` + <b>${i}</b>낱개`:``}</div>
      <div>빵판 합계: <b>${a}</b>빵판</div>
      <div>동결판 합계: <b>${o}</b>동결판</div>
    </div>
    <div style="font-size:13px;max-height:420px;overflow:auto;">
      ${s}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}async function Mt(e){let n=[...V,...I,...k,...A].find(t=>t.id===e);if(!n||n.category!==`raw`)return;if(n.date>E()){alert(`미래 날짜의 제품 입고는 입력할 수 없습니다.`);return}if(await ue(n.date)||n.received&&!await w({title:`입고완료 수정`,message:`현재 입력: 판수 ${n.receivedPlates??`-`} / 낱개 ${n.receivedLoosePacks??0} → 총 ${n.receivedTotalPacks??`-`}팩 = ${n.receivedBox??`-`}박스 + ${n.receivedRemainder??0}낱개

입고완료 내용을 수정하시겠습니까?
저장하면 수정 이력이 재고앱으로 다시 전송됩니다.`,confirmText:`수정하기`}))return;let r=j.find(e=>e.id===n.recipeId),i=r?.target||n.target||``,o={};try{let e=await s(a(g,`settings`,`systemValues`));e.exists()&&(o=e.data())}catch(e){console.error(`[receipt] systemValues load failed:`,e)}let c=Number(r?.packsPerPlate),u=Number.isFinite(c)&&c>0,d=i===`cat`?`packsPerPlateCat`:i===`dog`?`packsPerPlateDog`:null,f=u?c:Number(d?o[d]:NaN);if(!Number.isFinite(f)||f<=0){alert(`설정 > 시스템 설정값에서 ${i===`cat`?`고양이`:i===`dog`?`강아지`:`대상`} 판당 팩수를 먼저 등록해주세요.`);return}let p=Array.isArray(r?.productionMethods)?r.productionMethods.filter(e=>e&&e.methodKey&&e.active!==!1):[],m=p.length>0?p.map(e=>`<option value="${e.methodKey}" ${n.receivedMethod===e.methodKey?`selected`:``}>${e.label||e.methodKey}</option>`).join(``):`<option value="">방식 없음</option>`;document.getElementById(`productReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="productReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">제품 입고 — ${n.recipeName}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">판당 팩수 ${f}팩/판${u?` (레시피 지정)`:``} · 1박스 = 20팩</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">생산방식 (기록용)</label>
          <select id="pr_method" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">${m}</select>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">판수 *</label>
            <input type="number" id="pr_plates" min="0" step="1" value="${n.receivedPlates??``}" placeholder="판수" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">낱개(자투리 팩)</label>
            <input type="number" id="pr_loose" min="0" step="1" value="${n.receivedLoosePacks??0}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
        </div>
        <div id="pr_result" style="font-size:13px;color:#1a1a1a;background:#f5f7f5;border-radius:6px;padding:10px;margin-bottom:14px;">판수를 입력하세요.</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="pr_cancel">취소</button>
          <button class="btn-primary" id="pr_confirm">제품 입고</button>
        </div>
      </div>
    </div>
  `);let h=document.getElementById(`productReceiptModal`),_=document.getElementById(`pr_plates`),v=document.getElementById(`pr_loose`),y=document.getElementById(`pr_result`),b=()=>h?.remove();function x(){let e=parseInt(_.value,10),t=parseInt(v.value,10)||0;if(!Number.isInteger(e)||e<0||t<0)return y.textContent=`판수를 입력하세요.`,null;let n=e*f+t,r=Math.floor(n/10)/2,i=n%10;return y.innerHTML=`총 <b>${n}</b>팩 → <b>${r}</b>박스 + <b>${i}</b>낱개`,{plates:e,loose:t,totalPacks:n,boxes:r,remainder:i}}_.addEventListener(`input`,x),v.addEventListener(`input`,x),x(),document.getElementById(`pr_cancel`).addEventListener(`click`,b),document.getElementById(`pr_confirm`).addEventListener(`click`,async()=>{let e=x();if(!e){_.focus();return}let r=document.getElementById(`pr_method`).value||null,o=(n.receivedRevision||0)+1;try{let s=l(g);s.update(a(g,`productions`,n.id),{received:!0,receivedMethod:r,receivedPlates:e.plates,receivedLoosePacks:e.loose,receivedTotalPacks:e.totalPacks,receivedBox:e.boxes,receivedRemainder:e.remainder,receivedRevision:o,receivedAt:t(),updatedAt:t()});let c=`productions:${n.id}:${o}`;s.set(a(g,`productTransferRequests`,c),{idempotencyKey:c,sourceApp:`production`,sourceCollection:`productions`,sourceId:n.id,eventType:`productReceipt`,revision:o,supersedesRevision:o>1?o-1:null,status:`pending`,category:`raw`,recipeId:n.recipeId,recipeName:n.recipeName,target:i,plates:e.plates,packs:e.totalPacks,boxes:e.boxes,remainderPacks:e.remainder,producedDate:n.date,staff:n.staffName||``,createdAt:t()}),await s.commit(),b(),await W(),B&&(V=L.filter(e=>e.date===B),H=await pe(B)),G()}catch(e){console.error(`[receipt] save failed:`,e),alert(`제품 입고 저장 중 오류가 발생했습니다: `+(e.message||e))}})}async function Nt(e=[`senior`,`office`]){let t=[];for(let n of e){let e=await s(a(g,`staffGroups`,n));e.exists()&&(e.data().members||[]).forEach(e=>{e?.name&&t.push(`<option value="${e.name}">${e.name}</option>`)})}return t.join(``)}async function Pt(e){let t=[...V,...I,...k,...A].find(t=>t.id===e);if(!t||t.category!==`freezeDry`)return;if(t.date>E()){alert(`미래 날짜의 동결건조 입고는 입력할 수 없습니다.`);return}if(await ue(t.date))return;let n=j.find(e=>e.id===t.recipeId),r=n?.displayName||t.recipeName||n?.name||`동결건조`,i=t.received?t.receivedFreezeType===`frozenPan`:t.requiresSeparation===!1||n?.requiresSeparation===!1,a=i?`동결판`:`빵판`;if(t.received){if(!await w({title:`입고완료 수정`,message:`현재 입력된 수량: ${t.receivedFreezeQty??`-`}${a}\n\n입고완료 내용을 수정하시겠습니까?\n수정 차이만큼 ${a} 재고 lot을 조정합니다.`,confirmText:`수정하기`}))return;if(!t.receivedLotId){alert(`원본 lot을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`);return}}let o=i?Math.round(Number(t.received?t.receivedFreezeQty:t.freezePanQty||0)):D(Number(t.received?t.receivedFreezeQty:t.breadPanQty||0)),s=await Nt([`senior`,`office`]);document.getElementById(`freezeDryReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="freezeDryReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">동결건조 입고 — ${r}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">${i?`분리작업 불필요 → 동결판 재고 입고`:`분리작업 필요 → 빵판 재고 입고`}</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">${a} 수량 *</label>
          <input type="number" id="fd_qty" min="${i?`1`:`0.01`}" step="${i?`1`:`0.01`}" value="${o||``}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
        </div>
        <div class="form-group" style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">담당자 *</label>
          <select id="fd_staff" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">
            <option value="">선택</option>
            ${s}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="fd_cancel">취소</button>
          <button class="btn-primary" id="fd_confirm">${t.received?`수정 저장`:`입고`}</button>
        </div>
      </div>
    </div>
  `);let c=document.getElementById(`freezeDryReceiptModal`),l=()=>c?.remove();document.getElementById(`fd_cancel`).addEventListener(`click`,l),document.getElementById(`fd_confirm`).addEventListener(`click`,async()=>{let e=i?parseInt(document.getElementById(`fd_qty`).value,10):D(parseFloat(document.getElementById(`fd_qty`).value)||0),n=document.getElementById(`fd_staff`).value;if(!Number.isFinite(e)||e<=0){alert(`${a} 수량은 0보다 커야 합니다.`);return}if(!n){alert(`담당자를 선택해주세요.`);return}if(!await ue(t.date))try{if(t.received&&t.receivedLotId){if(!await Ft({p:t,productName:r,qty:e,staffName:n,isTender:i}))return}else i?await Lt({p:t,productName:r,qty:e,staffName:n}):await It({p:t,productName:r,qty:e,staffName:n});l(),await W(),B&&(V=L.filter(e=>e.date===B),H=await pe(B)),G()}catch(e){console.error(`[freezeDryReceipt] save failed:`,e),alert(`동결건조 입고 저장 중 오류가 발생했습니다: `+(e.message||e))}})}async function Ft({p:e,productName:n,qty:r,staffName:i,isTender:c}){let u=c?`frozenPanLots`:`breadPanLots`,d=c?`frozenPanLogs`:`breadPanLogs`,f=a(g,u,e.receivedLotId),p=await s(f);if(!p.exists())return alert(`원본 lot을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`),!1;let m=p.data(),h=Number(m.remaining||0),_=Number(e.receivedFreezeQty||0),v=c?r-_:D(r-_);if(v===0)return alert(`변경된 수량이 없습니다.`),!1;let y=c?h+v:D(h+v);if(y<0){let e=D(Number(m.initialQty||0)-h);return alert(`이미 ${e}개가 사용되어 ${r}${c?`동결판`:`빵판`}으로 줄일 수 없습니다.`),!1}let b=new Date,x=l(g),ee=a(o(g,d)),te=c?Number(m.initialQty||0)+v:D(Number(m.initialQty||0)+v);x.update(f,{initialQty:te,remaining:y,closed:c?y<=0:y<=.005,updatedAt:b});let S={type:`adjust`,date:E(),productName:m.productName||n,qty:v,before:h,after:y,lotId:e.receivedLotId,staffName:i,uid:null,note:null,reason:`제품입고 수정`,batchId:null,ledgerId:null,timestamp:b};return c||(S.lotDate=m.date,S.expectedFrozenQty=null,S.actualFrozenQty=null,S.diff=null),x.set(ee,S),x.update(a(g,`productions`,e.id),{receivedFreezeQty:r,receivedAt:t(),updatedAt:t()}),await x.commit(),!0}async function It({p:e,productName:n,qty:r,staffName:i}){let s=new Date,c=l(g),u=a(o(g,`breadPanLots`)),d=a(o(g,`breadPanLogs`));c.set(u,{productName:n,date:e.date,staffName:i,initialQty:r,remaining:r,closed:!1,note:null,createdAt:s,updatedAt:s}),c.set(d,{type:`incoming`,date:e.date,productName:n,qty:r,before:0,after:r,lotId:u.id,lotDate:e.date,expectedFrozenQty:null,actualFrozenQty:null,diff:null,staffName:i,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:s}),c.update(a(g,`productions`,e.id),{received:!0,receivedFreezeType:`breadPan`,receivedFreezeQty:r,receivedLotId:u.id,receivedAt:t(),updatedAt:t()}),await c.commit()}async function Lt({p:e,productName:n,qty:r,staffName:i}){let s=new Date,c=l(g),u=a(o(g,`frozenPanLots`)),d=a(o(g,`frozenPanLogs`)),f=a(o(g,`stockLedger`));c.set(u,{productName:n,date:e.date,staffName:i,initialQty:r,remaining:r,closed:!1,source:`tenderIn`,sourceRefId:d.id,note:null,createdAt:s,updatedAt:s}),c.set(d,{type:`tenderIn`,date:e.date,productName:n,qty:r,before:0,after:r,lotId:u.id,staffName:i,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:s}),c.set(f,{actionType:`frozenPanTenderIn`,actionId:d.id,timestamp:s,date:e.date,status:`active`,items:[{collection:`frozenPanLots`,docId:u.id,field:`remaining`,delta:r,before:0,after:r,label:`${n} 동결판(텐더동결 입고)`,stockUpdatedAtSnapshot:s,isNewDoc:!0}]}),c.update(a(g,`productions`,e.id),{received:!0,receivedFreezeType:`frozenPan`,receivedFreezeQty:r,receivedLotId:u.id,receivedAt:t(),updatedAt:t()}),await c.commit()}function Rt(e,t){let n=t.find(e=>e.isProductionUnit);return n?n.name:j.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit)?.name||e.productionUnitName||`생산단위`}function zt(e){if(e.productionUnitName)return e.productionUnitName;let t=j.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit);return t?.unitName||t?.weightDisplayUnit||``}function Bt(e,t){if(t.weightDisplayUnit===`kg`||t.weightDisplayUnit===`g`)return t.weightDisplayUnit;let n=j.find(t=>t.id===e.recipeId),r=n?.ingredients?.find(e=>e.name===t.name&&(!t.meatTypeId||e.meatTypeId===t.meatTypeId))||n?.ingredients?.find(e=>e.name===t.name);return r?.weightDisplayUnit===`kg`||r?.weightDisplayUnit===`g`?r.weightDisplayUnit:t.meatTypeId?`kg`:`g`}function Vt(e,t){return de(Number(t.requiredQtyG||0),Bt(e,t))}function Ht(e,t){return Bt(e,t)}function Ut(e,t=1){let n=Number(e||0);return Number.isInteger(n)?String(n):n.toLocaleString(`ko-KR`,{maximumFractionDigits:t})}function Wt(e=k){let t=new Map;return e.forEach(e=>{(e.ingredientsSnapshot||[]).forEach(n=>{let r=n.name||``;if(r===`물`||r.includes(`노른자`))return;let i=r.trim();if(!i)return;let a=Bt(e,n),o=Number(n.requiredQtyG||0),s=t.get(i);s?(s.totalG+=o,a===`kg`&&(s.unit=`kg`),!s.meatTypeId&&n.meatTypeId&&(s.meatTypeId=n.meatTypeId)):t.set(i,{name:n.name,totalG:o,unit:a,meatTypeId:n.meatTypeId||null})})}),t}function Gt(e){let t=e=>e.meatTypeId&&he.get(e.meatTypeId)===`produce`?1:0;return[...e.values()].sort((e,n)=>t(e)-t(n)||n.totalG-e.totalG)}function Kt(e=k,t=!1){if(e.length===0)return`<div style="color:#aaa;">${t?`불러온 생산 없음`:`오늘 생산 없음`}</div>`;let n=Wt(e);return n.size===0?`<div style="color:#aaa;">원료 출고 없음</div>`:Gt(n).map(e=>{let t=de(e.totalG,e.unit);return`
    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f5f5f5;">
      <span>${e.name}</span>
      <span style="font-weight:600;">${t} ${e.unit}</span>
    </div>
  `}).join(``)}function qt(){if(!U.length)return``;let e=U.filter(e=>e.kind===`due`),t=e.filter(e=>e.overdue).length,n=U.filter(e=>e.kind===`low`).length,r=[t?`교체 지남 ${t}`:``,e.length-t?`교체 임박 ${e.length-t}`:``,n?`재고 부족 ${n}`:``].filter(Boolean).join(` · `),i=e[0]||U[0];return`
      <div class="alert-card ${t?`alert-card-blocker`:`alert-card-warning`}">
        <span class="alert-card-label">🔧 설비 부품 확인 필요 — ${r} (${K(T(i.part))} 등)</span>
        <button class="alert-card-jump" data-jump="equipment">처리하러 가기 →</button>
      </div>
  `}function Jt(){if(!U.length)return;let e=`equipmentPopupShown_${E()}`;try{if(sessionStorage.getItem(e))return;sessionStorage.setItem(e,`1`)}catch{}let t=document.getElementById(`equipmentAlertPopup`);t&&t.remove();let n=U.slice(0,12).map(e=>{let t=e.part,n=e.kind===`low`?`<span class="eq-pill eq-pill-amber">재고 ${Number(t.currentQty||0)}</span>`:`<span class="eq-pill ${e.overdue?`eq-pill-red`:`eq-pill-amber`}">${K(ie(e.dday))}</span>`,r=e.kind===`low`?` <span style="color:#888;">(최소 ${Number(t.minimumQty||0)})</span>`:``;return`<div>${n}${K(T(t))}${r}</div>`}).join(``),r=U.length>12?`<div style="color:#888;font-size:12px;">외 ${U.length-12}건</div>`:``;document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="equipmentAlertPopup">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title" style="margin-bottom:4px;">🔧 설비 부품 확인 필요</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">교체 예정일 7일 이내·지남 또는 재고 부족 부품입니다.</p>
        <div class="eq-popup-list">${n}${r}</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="equipmentPopupClose">닫기</button>
          <button class="btn-primary" id="equipmentPopupGo">설비 부품으로 가기</button>
        </div>
      </div>
    </div>
  `);let i=document.getElementById(`equipmentAlertPopup`);document.getElementById(`equipmentPopupClose`).addEventListener(`click`,()=>i.remove()),document.getElementById(`equipmentPopupGo`).addEventListener(`click`,()=>{i.remove(),y(`equipment`),ae()})}async function Yt(e){let t=E(),n=e||t,r=n!==t,i=r?ve:A,o=r?ye:P;if(i.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(o?.status===`completed`){alert(`내일생산불러오기는 하루 1회만 가능합니다.`);return}let c=await Xt(n,i);if(c.length>0){Zt(c);return}let l=await s(a(g,`staffGroups`,`lead`)),u=l.exists()&&l.data().members||[];$(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      ${r?`※ ${n} 소급 실행입니다. 해당일에 했어야 할 차감을 지금 수행합니다.<br>`:``}
      다음 영업일(${_(n)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
    </p>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${u.map(e=>`<option value="${e.name}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnConfirmLoad">확인</button>
    </div>
  `),document.getElementById(`btnConfirmLoad`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}closeModal(),await Qt(n,e,i)})}async function Xt(t,r=A){let i=[];ge.items.forEach(e=>{e.jumpMenu===`schedule`?i.push({kind:`schedule`,text:`📦 ${e.reason||e.label}`,jumpMenu:`schedule`}):e.jumpMenu===`egg`?i.push({kind:`egg`,text:`🥚 ${e.reason||e.label}`,jumpMenu:`egg`}):e.label===`제품입고 미완료`&&i.push({kind:`productTransfer`,text:`📦 ${e.reason||e.label}`,jumpMenu:`main`})});let c={},l={};for(let e of r){(e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(c[e.meatTypeId]||(c[e.meatTypeId]={neededG:0,name:e.name}),c[e.meatTypeId].neededG+=e.requiredQtyG)});let t=j.find(t=>t.id===e.recipeId);if(t?.category===`raw`&&t.bagTypeId){let n=e.rawBoxQty||0;(await s(a(g,`bagTypes`,t.bagTypeId))).exists()&&(l[t.bagTypeId]=(l[t.bagTypeId]||0)+n*20)}}for(let[e,t]of Object.entries(l)){let n=await s(a(g,`bagTypes`,e));if(!n.exists())continue;let r=n.data(),o=r.currentQty||0;o<t&&i.push({kind:`bag`,text:`🛍️ ${r.name||``} 봉투 재고 부족 — 필요 ${t}장 / 현재 ${o}장`,jumpMenu:`bag`})}let u={},d=Object.entries(c).filter(([,e])=>!e.name).map(([e])=>e);await Promise.all(d.map(async e=>{try{let t=await s(a(g,`meatTypes`,e));t.exists()?u[e]=t.data().name||e:u[e]=e}catch{u[e]=e}}));for(let[e,{neededG:t,name:n}]of Object.entries(c)){let r=M.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),a=M.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),o=M.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),s=r+a+o;if(s<t){let c=M.find(t=>t.meatTypeId===e)?.meatNameSnapshot||n||u[e]||e;i.push({kind:`meat`,text:`🥩 ${c} 원료 재고 부족 — 필요 ${(t/1e3).toFixed(1)}kg / 현재 ${(s/1e3).toFixed(1)}kg (재포장 ${(r/1e3).toFixed(1)} + 전처리 ${(a/1e3).toFixed(1)} + 냉동창고 ${(o/1e3).toFixed(1)})`,jumpMenu:`meat`})}}let p=(await e(n(o(g,`activityLogs`),f(`date`,`==`,t),f(`action`,`==`,`autoRepack`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>(e.subAction===`trigger`||e.subAction===`diff`)&&e.acknowledged!==!0);return p.length>0&&i.push({kind:`autoRepack`,text:`🔄 자동 재포장 확인 미완료 ${p.length}건`,jumpMenu:`main`}),i}function Zt(e){$(`
    <h3 class="modal-title">내일생산불러오기를 진행할 수 없습니다</h3>
    <p style="font-size:12px;color:#666;margin-bottom:12px;">
      아래 항목을 확인해주세요.
    </p>
    <div class="tload-blocker-list">
      ${e.map((e,t)=>`
      <div class="tload-blocker-row">
        <span class="tload-blocker-num">${[`①`,`②`,`③`,`④`,`⑤`,`⑥`,`⑦`,`⑧`,`⑨`,`⑩`][t]||`${t+1}.`}</span>
        <span class="tload-blocker-text">${K(e.text)}</span>
        <button class="tload-blocker-jump" data-jump="${e.jumpMenu}">처리하러 →</button>
      </div>
    `).join(``)}
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">확인</button>
    </div>
  `),document.querySelectorAll(`.tload-blocker-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;closeModal(),y(t),ae()})})}async function Qt(e,t,n=A){let r=_(e);try{let c={},l={};for(let e of n){let t=j.find(t=>t.id===e.recipeId);if(t&&((e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(c[e.meatTypeId]=(c[e.meatTypeId]||0)+e.requiredQtyG)}),t.category===`raw`&&t.bagTypeId)){let n=e.rawBoxQty||0;(await s(a(g,`bagTypes`,t.bagTypeId))).exists()&&(l[t.bagTypeId]=(l[t.bagTypeId]||0)+n*20)}}for(let[e,t]of Object.entries(l)){let n=await s(a(g,`bagTypes`,e));if(n.exists()){let e=n.data().currentQty||0;if(e<t){alert(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${n.data().name||``} 봉투: 현재 ${e}장 / 필요 ${t}장`);return}}}for(let[e,t]of Object.entries(c)){let n=M.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),r=M.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)).reduce((e,t)=>e+t.remaining,0),i=M.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),a=n+r+i;if(a<t){let o=M.find(t=>t.meatTypeId===e)?.meatNameSnapshot||e;alert(`${o} 재고가 부족하여 내일 생산을 불러올 수 없습니다.\n\n필요량: ${(t/1e3).toFixed(1)}kg\n현재 합계: ${(a/1e3).toFixed(1)}kg\n  - 재포장: ${(n/1e3).toFixed(1)}kg\n  - 전처리: ${(r/1e3).toFixed(1)}kg\n  - 냉동창고: ${(i/1e3).toFixed(1)}kg`);return}}let d=[],f=`productionCompletion:${e}`;for(let[n,r]of Object.entries(c)){let s=r,c=M.filter(e=>e.meatTypeId===n&&e.stage===`repacked`&&e.remaining>0).sort((e,t)=>(e.repackedDate||``).localeCompare(t.repackedDate||``));for(let r of c){if(s<=0)break;let o=Math.min(r.remaining,s),c=r.remaining-o;await i(a(g,`meatStocks`,r.id),{remaining:c,closed:c<=0,updatedAt:new Date}),d.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:-o,before:r.remaining,after:c,label:`${r.meatNameSnapshot} 재포장`,stockUpdatedAtSnapshot:new Date}),await O({type:`productionDeduct`,date:e,meatTypeId:n,meatNameSnapshot:r.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:-o,before:r.remaining,after:c,staff:t,reason:`내일생산불러오기 차감`,batchId:f}),s-=o}if(s>0){let r=M.filter(e=>e.meatTypeId===n&&e.stage===`processed`&&e.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``));for(let c of r){if(s<=0)break;let r=c.unitWeightG||1,l=Math.min(c.remaining,Math.ceil(s/r)*r),p=c.remaining-l;await i(a(g,`meatStocks`,c.id),{remaining:p,closed:p<=0,updatedAt:new Date}),d.push({collection:`meatStocks`,docId:c.id,field:`remaining`,delta:-l,before:c.remaining,after:p,label:`${c.meatNameSnapshot} 전처리`,stockUpdatedAtSnapshot:new Date}),await O({type:`productionDeduct`,date:e,meatTypeId:n,meatNameSnapshot:c.meatNameSnapshot,stage:`processed`,meatStockId:c.id,delta:-l,before:c.remaining,after:p,staff:t,reason:`내일생산불러오기 차감`,batchId:f});let m=l-s;if(m>0){let r=M.find(e=>e.meatTypeId===n&&e.stage===`repacked`&&e.remaining>0);if(r){let o=r.remaining+m;await i(a(g,`meatStocks`,r.id),{remaining:o,closed:!1,updatedAt:new Date}),d.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:m,before:r.remaining,after:o,label:`${c.meatNameSnapshot} 재포장 자동입고`,stockUpdatedAtSnapshot:new Date}),await O({type:`repackedIn`,date:e,meatTypeId:n,meatNameSnapshot:c.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:m,before:r.remaining,after:o,staff:t,reason:`생산 자동 재포장 (기존 lot 합산)`,batchId:f}),await ce({action:`autoRepack`,subAction:`trigger`,date:e,staff:`시스템`,message:`🔄 생산 자동 재포장 — ${c.meatNameSnapshot} ${(m/1e3).toFixed(2)}kg (전처리 ${c.unitWeightG}g 단위 차감 후 잔여, 기존 재포장 lot 합산)`,details:{meatTypeId:n,meatName:c.meatNameSnapshot,surplusG:m,processedUnitWeightG:c.unitWeightG,processedStockId:c.id,repackedStockId:r.id,mode:`merged`,batchId:f}}),r.remaining=o}else{let r=await u(o(g,`meatStocks`),{meatTypeId:n,meatNameSnapshot:c.meatNameSnapshot,stage:`repacked`,incomingDate:e,repackedDate:e,unitWeightG:null,unitCount:null,initialQtyG:m,remaining:m,batchId:f,staffName:t,note:`생산 자동 재포장`,closed:!1,createdAt:new Date,updatedAt:new Date});d.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:m,before:0,after:m,label:`${c.meatNameSnapshot} 재포장 자동신규`,stockUpdatedAtSnapshot:new Date,isNewDoc:!0}),await O({type:`repackedIn`,date:e,meatTypeId:n,meatNameSnapshot:c.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:m,before:0,after:m,staff:t,reason:`생산 자동 재포장 (신규 lot)`,batchId:f}),await ce({action:`autoRepack`,subAction:`trigger`,date:e,staff:`시스템`,message:`🔄 생산 자동 재포장 — ${c.meatNameSnapshot} ${(m/1e3).toFixed(2)}kg (전처리 ${c.unitWeightG}g 단위 차감 후 잔여, 신규 재포장 lot)`,details:{meatTypeId:n,meatName:c.meatNameSnapshot,surplusG:m,processedUnitWeightG:c.unitWeightG,processedStockId:c.id,repackedStockId:r.id,mode:`newLot`,batchId:f}}),M.push({id:r.id,meatTypeId:n,meatNameSnapshot:c.meatNameSnapshot,stage:`repacked`,remaining:m,unitWeightG:null})}}s-=l}}if(s>0){let r=M.filter(e=>e.meatTypeId===n&&e.stage===`frozen`&&e.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``));for(let o of r){if(s<=0)break;let r=Math.min(o.remaining,s),c=o.remaining-r;await i(a(g,`meatStocks`,o.id),{remaining:c,closed:c<=0,updatedAt:new Date}),d.push({collection:`meatStocks`,docId:o.id,field:`remaining`,delta:-r,before:o.remaining,after:c,label:`${o.meatNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:new Date}),await O({type:`productionDeduct`,date:e,meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`frozen`,meatStockId:o.id,delta:-r,before:o.remaining,after:c,staff:t,reason:`내일생산불러오기 차감`,batchId:f}),s-=r}}}for(let[n,r]of Object.entries(l)){let c=await s(a(g,`bagTypes`,n));if(c.exists()){let s=c.data().currentQty||0,l=s-r;await i(a(g,`bagTypes`,n),{currentQty:l,updatedAt:new Date}),d.push({collection:`bagTypes`,docId:n,field:`currentQty`,delta:-r,before:s,after:l,label:`${c.data().name} 봉투`,stockUpdatedAtSnapshot:new Date}),await u(o(g,`bagLogs`),{date:e,timestamp:new Date,bagTypeId:n,bagNameSnapshot:c.data().name,type:`autoDeduct`,qty:-r,before:s,after:l,staffName:t,note:`내일생산불러오기 자동차감`})}}let p=await u(o(g,`stockLedger`),{actionType:`productionCompletion`,actionId:e,timestamp:new Date,runDate:e,status:`active`,items:d});await h(a(g,`productionCompletion`,e),{runDate:e,targetProductionDate:r,status:`completed`,idempotencyKey:`productionCompletion:${e}`,staffName:t,ledgerId:p.id,completedAt:new Date});for(let e of n)await i(a(g,`productions`,e.id),{lockedByCompletion:!0});await W(),G(),alert(`내일생산불러오기 완료!`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function $t(){if(!await w({title:`내일생산불러오기 취소`,message:`내일생산불러오기를 취소하시겠습니까?
차감된 재고가 복원됩니다.`,confirmText:`취소`,danger:!0}))return;let e=await S({title:`내일생산불러오기 취소`,message:`재고가 전부 롤백되고 마감 차단 항목이 다시 활성화됩니다.`,label:`취소 사유`,placeholder:`예: 생산 일정 변경`,required:!0,multiline:!0});if(e===null||!e)return;let t=E(),n=P?.staffName||`unknown`,r=`productionCompletion:${P?.runDate||t}`;try{if(P?.ledgerId){let o=await s(a(g,`stockLedger`,P.ledgerId));if(o.exists()){let c=o.data().items||[];for(let o of c){let c=await s(a(g,o.collection,o.docId));if(!c.exists())continue;let l=c.data()[o.field];if(!(l!==o.after&&!await w({title:`재고 변동 감지`,message:`내일생산불러오기 이후 ${o.label} 재고가 변경된 이력이 있습니다.\n내일생산불러오기 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))){if(o.isNewDoc){let e=l-o.delta;await i(a(g,o.collection,o.docId),{[o.field]:e,closed:!0,updatedAt:new Date})}else await i(a(g,o.collection,o.docId),{[o.field]:l-o.delta,closed:!1,updatedAt:new Date});if(o.collection===`meatStocks`){let i=c.data();await O({type:`productionRollback`,date:t,meatTypeId:i.meatTypeId||null,meatNameSnapshot:i.meatNameSnapshot||``,stage:i.stage||`frozen`,meatStockId:o.docId,delta:-o.delta,before:l,after:l-o.delta,staff:n,reason:`내일생산불러오기 취소 - ${e}`,batchId:r})}}}await i(a(g,`stockLedger`,P.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}P?.id&&await i(a(g,`productionCompletion`,P.id),{status:`cancelled`,cancelReason:e,cancelledAt:new Date});for(let e of A)await i(a(g,`productions`,e.id),{lockedByCompletion:!1});await W(),G(),alert(`취소 완료! 재고가 복원되었습니다.`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function en(){if(C!==`admin`&&C!==`office`){alert(`새로고침은 대표/사무실 계정만 가능합니다.`);return}if(P?.status!==`completed`){alert(`마감 상태에서만 새로고침이 가능합니다.`);return}if(A.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(!await w({title:`내일생산불러오기 새로고침`,message:`기존 차감을 롤백하고 변경된 다음 영업일 생산 기준으로 다시 차감합니다.
진행하시겠습니까?`,confirmText:`진행`,danger:!1}))return;let e=await S({title:`내일생산불러오기 새로고침`,message:`롤백 후 차단 항목이 다시 검사됩니다.`,label:`새로고침 사유`,placeholder:`예: 다음 영업일 생산 추가`,required:!0,multiline:!0});if(e===null||!e)return;let t=E(),n=P?.staffName||`unknown`,r=`productionCompletion:${P?.runDate||t}`;try{if(P?.ledgerId){let o=await s(a(g,`stockLedger`,P.ledgerId));if(o.exists()){let c=o.data().items||[];for(let o of c){let c=await s(a(g,o.collection,o.docId));if(!c.exists())continue;let l=c.data()[o.field];if(!(l!==o.after&&!await w({title:`재고 변동 감지`,message:`이전 마감 이후 ${o.label} 재고가 변경된 이력이 있습니다.\n마감 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))){if(o.isNewDoc){let e=l-o.delta;await i(a(g,o.collection,o.docId),{[o.field]:e,closed:!0,updatedAt:new Date})}else await i(a(g,o.collection,o.docId),{[o.field]:l-o.delta,closed:!1,updatedAt:new Date});if(o.collection===`meatStocks`){let i=c.data();await O({type:`productionRollback`,date:t,meatTypeId:i.meatTypeId||null,meatNameSnapshot:i.meatNameSnapshot||``,stage:i.stage||`frozen`,meatStockId:o.docId,delta:-o.delta,before:l,after:l-o.delta,staff:n,reason:`새로고침 롤백 - ${e}`,batchId:r})}}}await i(a(g,`stockLedger`,P.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}P?.id&&await i(a(g,`productionCompletion`,P.id),{status:`cancelled`,cancelReason:`새로고침: ${e}`,cancelledAt:new Date});for(let e of A)await i(a(g,`productions`,e.id),{lockedByCompletion:!1});await W();let o=await Xt(t);if(o.length>0){G(),alert(`롤백은 완료됐습니다.
차단 항목이 발견되어 재차감을 진행할 수 없습니다.
차단 항목 처리 후 [내일생산불러오기] 버튼으로 다시 진행해주세요.`),Zt(o);return}let c=await s(a(g,`staffGroups`,`lead`)),l=c.exists()&&c.data().members||[];$(`
      <h3 class="modal-title">새로고침 — 담당자 선택</h3>
      <p style="font-size:12px;color:#888;margin-bottom:16px;">
        롤백 완료. 다음 영업일(${_(t)}) 생산 기준으로 재차감합니다.
      </p>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_refresh_staff">
          <option value="">선택</option>
          ${l.map(e=>`<option value="${e.name}">${e.name}</option>`).join(``)}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal()">취소 (마감 안 된 상태로 유지)</button>
        <button class="btn-primary" id="btnConfirmRefresh">재차감 진행</button>
      </div>
    `),document.getElementById(`btnConfirmRefresh`).addEventListener(`click`,async()=>{let r=document.getElementById(`m_refresh_staff`).value;if(!r){alert(`담당자를 선택해주세요.`);return}closeModal(),await Qt(t,r);try{await ce({action:`closing`,subAction:`refresh`,date:t,staff:r,message:`🔄 내일생산불러오기 새로고침 — 사유: ${e} / 담당: ${r} (이전 담당: ${n})`,details:{previousStaff:n,newStaff:r,reason:e,runDate:_(t)}}),await J(),Y()}catch(e){console.warn(`[6E-3] 새로고침 활동 로그 발행 실패:`,e)}})}catch(e){console.error(`[6E-3] 새로고침 실패:`,e),alert(`오류가 발생했습니다: `+e.message),await W(),G()}}function tn(){B=null,V=[],H=null,G()}function nn(){let e=P?.status===`completed`,t=B!==null,n=!t&&F!==null,r=t?V:n?I:e?A:k;$(`
    <h3 class="modal-title">${t?`${B} 생산 현황`:n?`${F} 생산 현황`:e?`${_(E())} 불러온 생산`:`${E()} 생산 현황`}</h3>
    <div class="main-production-grid big-view">
      ${r.length===0?`<p style="color:#aaa">생산 없음</p>`:r.map(e=>kt(e)).join(``)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`),r=e.includes(`main-production-grid big-view`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box ${r?`modal-wide`:``}">${e}</div>`,document.body.appendChild(n)}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};export{we as renderMain};