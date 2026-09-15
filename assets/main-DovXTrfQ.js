import{_ as e,a as t,c as n,d as r,f as i,g as a,h as o,m as s,n as c,p as l,r as u,s as d,u as f,v as p,w as m,y as h}from"./index.esm-ESivpAya.js";import{n as g}from"./firebase-I0rBIq9V.js";import{n as _}from"./modalManager-Z4b2ihO9.js";import{A as v,B as y,C as b,D as x,L as S,M as C,N as ee,P as w,R as te,S as T,T as ne,V as re,_ as ie,b as ae,g as E,h as D,i as oe,j as O,k as se,l as ce,n as le,p as ue,r as k,t as de,x as fe,y as pe}from"./index-BMnUILA5.js";import{n as me,t as he}from"./activityLogs-Dl6VA3lF.js";import{t as ge}from"./closingGuard-CmDbUY7v.js";import{i as A,r as _e}from"./number-BaNMt7D8.js";import{findActionableClosingDate as ve,getAllBlockingItems as ye}from"./closingChecks-rYtteFTA.js";import{t as j}from"./meatLogs-BqyMhJQu.js";function be({today:e,nextBizDay:t,overdueNextBizDay:n,allProds:r,recipeRows:i,meatTypeRows:a,meatRows:o,eggStock:s,equipmentAlerts:c,completionDoc:l,overdueCompletionDoc:u,overdueClosing:d,blocks:f,calendar:p,logs:m}){let h=d?.date||null,g=e=>e?r.filter(t=>t.date===e&&t.status!==`deleted`):[];return{productions:g(e),nextProductions:g(t),recipes:i,meatTypeRows:a,meatStocks:o.filter(e=>!e.closed),eggStock:s,equipmentAlerts:c,completionDoc:l,overdueCompletionDoc:u,blockingData:f,overdueClosingDate:h,overdueClosingAlreadyClosed:!!d?.closed,overdueProductions:g(h),overdueNextProductions:g(n),...p,combinedLogs:m}}function xe(e){return typeof e!=`object`||!e||typeof e.toMillis==`function`?e:e instanceof Date?new Date(e.getTime()):Array.isArray(e)?e.map(xe):Object.fromEntries(Object.entries(e).map(([e,t])=>[e,xe(t)]))}function Se(){let e=new Map;return{run(t,n){if(!e.has(t)){let r=Promise.resolve().then(n);e.set(t,r),r.finally(()=>{e.get(t)===r&&e.delete(t)}).catch(()=>{})}return e.get(t)},clear(){e.clear()}}}function Ce(e){let t=new Set(e.map(e=>e.id)),n=new Map;return{pendingIds:()=>[...n.keys()],enqueue({action:e,subAction:r,date:i,message:a,details:o,dedupKey:s}){let c=`auto_${`${e}_${r}_${i}_${s}`.replace(/[^\w-]/g,`_`)}`;t.has(c)||n.set(c,{action:e,subAction:r,date:i,staff:`시스템`,uid:null,message:a,details:{...o||{},dedupKey:s,autoTriggered:!0},read:!1,acknowledged:!1,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null})},async flush(){let e=[...n.entries()],t={createdIds:[],existingIds:[],failedIds:[]},r=0;return await Promise.all(Array.from({length:Math.min(4,e.length)},async()=>{for(;r<e.length;){let[n,a]=e[r++];try{let e=h(g,`activityLogs`,n);t[await i(g,async t=>{let n=await t.get(e);return n.exists()||t.set(e,{...a,timestamp:m()}),!n.exists()})?`createdIds`:`existingIds`].push(n)}catch(e){t.failedIds.push(n),console.error(`[자동 알림 생성 실패]`,n,e)}}})),t}}}var we=Se(),Te,M=!0;S.onClear(()=>{M=!0,we.clear(),clearTimeout(Te)});var N=[],P=[],F=[],I=[],Ee=new Map,L={currentQty:0,minimumQty:0},R=null,De={totalBlocked:0,items:[]},z=null,Oe=!1,ke=[],Ae=[],je=null,Me=[],B=[],Ne=[],V=0,H=null,U=[],W=null;function Pe(e){return e?.category===`freezeDry`&&e.requiresSeparation===!1}function Fe(e){let t=[`<span>${e.freezeDryBagQty||0}봉</span>`];return Pe(e)||t.push(`<span>${e.breadPanQty||0}빵판</span>`),t.push(`<span>${e.freezePanQty||0}동결판</span>`),t.join(``)}var Ie=[],G=[];async function Le({scope:e=T()}={}){let t=b(`main`);t&&(e=ae(`main`));let n=document.getElementById(`mainContent`);n.innerHTML=`<div style="padding:24px;"><p>메인 로딩 중...</p></div>`,H=null,U=[],W=null;let r=t&&!M&&S.peek(`main:model`);if(r)Ve(r.model);else if(!await K(e))return;if(t){let e=({error:e}={})=>{if(M=!0,clearTimeout(Te),e){e.code===`permission-denied`?(S.clear(),n.innerHTML=`<p>접근 권한을 다시 확인하려면 새로고침해주세요.</p>`):Re(n);return}Te=setTimeout(async()=>{if(!(te!==`main`||document.getElementById(`mainContent`)!==n)&&!(document.querySelector(`.modal-overlay`)||H))try{await K(ae(`main`))&&q()}catch(e){e.code===`permission-denied`?(S.clear(),n.replaceChildren()):(console.error(`[메인 갱신 실패]`,e),Re(n))}},120)};fe.onChange(`main`,e);let t=new MutationObserver(()=>{M&&!document.querySelector(`.modal-overlay`)&&e()});t.observe(document.body,{childList:!0}),pe(()=>{t.disconnect(),clearTimeout(Te)})}te!==`main`||document.getElementById(`mainContent`)!==n||(q(),hn())}function Re(e){if(!e.isConnected||e.querySelector(`[data-refresh-error]`))return;let t=document.createElement(`div`);t.dataset.refreshError=`true`,t.textContent=`최신 정보를 확인하지 못했습니다. 표시된 내용은 이전 자료입니다. `;let n=document.createElement(`button`);n.className=`btn-secondary`,n.textContent=`다시 불러오기`,n.addEventListener(`click`,()=>{M=!0,de()}),t.appendChild(n),e.prepend(t)}var ze=0;async function Be(){let e=oe(),t=C(),[n,i,o]=await Promise.all([e.getDocs(r(p(g,`activityLogs`),a(`date`,`==`,t))),e.getDoc(h(g,`eggStock`,`global`)),ue(t,e)]),s=Ce(n.docs.map(e=>({id:e.id,...e.data()})));if(await Gt(t,s,e,{eggStock:i.exists()?i.data():{},equipmentAlerts:o}),s.pendingIds().length)throw Error(`새 자동 알림을 확인해야 합니다. 메인을 다시 불러온 후 처리해주세요.`)}async function K(e=oe(),{autoLogsEnabled:t=!0}={}){let n=++ze,i=document.getElementById(`mainContent`),o=()=>n===ze&&i===document.getElementById(`mainContent`),s=C();await ne(e);let c=ft(e);c.catch(()=>{}),e.getDocs(r(p(g,`events`),a(`date`,`==`,s))).catch(()=>{}),e.getDocs(r(p(g,`schedules`),a(`date`,`==`,s))).catch(()=>{}),e.getDocs(r(p(g,`supplementTypes`),a(`active`,`==`,!0))).catch(()=>{}),e.getDocs(p(g,`supplementStock`)).catch(()=>{});let l=O(s),[u,d,m,_,v,y,x,ee,w]=await Promise.all([e.getDocs(r(p(g,`productions`),f(`sortOrder`))),e.getDocs(p(g,`recipes`)),e.getDocs(p(g,`meatTypes`)),e.getDocs(p(g,`meatStocks`)),e.getDoc(h(g,`eggStock`,`global`)),e.getDoc(h(g,`productionCompletion`,s)),ve(s,null,e),Ge(V,e),e.once(`equipmentAlerts:`+s,()=>ue(s,e))]);if(!o())return!1;let te=u.docs.map(e=>({id:e.id,...e.data()})),T=x?.date||null,[re,ie]=await Promise.all([T?e.getDoc(h(g,`productionCompletion`,T)):null,x?.blockingData||ye(s,e)]);if(!o())return!1;let ae={eggStock:v.exists()?v.data():{currentQty:0,minimumQty:0},equipmentAlerts:w},E=Ce((await e.getDocs(r(p(g,`activityLogs`),a(`date`,`==`,s)))).docs.map(e=>({id:e.id,...e.data()})));if(!o())return!1;let D=t?await we.run(`main:`+s,async()=>(await Gt(s,E,e,ae),o()?E.flush():{createdIds:[],existingIds:[],failedIds:[]})):{createdIds:[],existingIds:[],failedIds:[]};if(D.failedIds.length)throw Error(`일부 자동 알림을 저장하지 못했습니다. 다시 불러와주세요.`);let se=await c;if((D.createdIds.length||D.existingIds.length)&&(se=[...(await oe().getDocs(r(p(g,`activityLogs`),a(`date`,`==`,s)))).docs.map(e=>({id:e.id,...e.data()})),...se.filter(e=>e.date!==s)].sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0))),!o())return!1;let ce=e=>e.docs.map(e=>({id:e.id,...e.data()})),le=e=>e?.exists()?{id:e.id,...e.data()}:null,k=be({today:s,nextBizDay:l,overdueNextBizDay:T?O(T):null,allProds:te,recipeRows:ce(d),meatTypeRows:ce(m),meatRows:ce(_),eggStock:ae.eggStock,equipmentAlerts:w,completionDoc:le(y),overdueCompletionDoc:le(re),overdueClosing:x,blocks:ie,calendar:ee,logs:se});return Ve(k),M=!1,b(`main`)&&S.publish(`main:model`,{model:k}),!0}function Ve(e){let t=xe(e);({productions:N,nextProductions:P,recipes:F,meatStocks:I,eggStock:L,completionDoc:R,blockingData:De,overdueClosingDate:z,overdueClosingAlreadyClosed:Oe,overdueProductions:ke,overdueNextProductions:Ae,overdueCompletionDoc:je,calendarSchedules:Me,calendarProductions:B,calendarEvents:Ne,combinedLogs:Ie,equipmentAlerts:G}=t),Ee=new Map(t.meatTypeRows.map(e=>[e.id,e.category===`produce`?`produce`:`meat`]))}function q(){if(te!==`main`)return;let e=document.getElementById(`mainContent`),t=C(),n=O(t),r=R?.status===`completed`,i=y===`admin`||y===`office`,a=H!==null,o=!a&&z!==null,s=a&&W?W:De,c=Oe?`마감 후 미처리 확인 필요`:`미마감 처리 필요`,l=a?U:o?ke:r?P:N,u=a?`${H} 생산 (선택 날짜)`:o?`${z} 생산 (${c})`:r?`불러온 다음 영업일 생산 (${n})`:`오늘 생산`,d=a?`🥩 ${H} 출고원료`:o?`🥩 ${z} 출고원료`:`🥩 금일 출고원료`,f=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],p=a?H:o?z:r?n:t,m=new Date(p+`T00:00:00`),h=`${m.getMonth()+1}/${m.getDate()} (${f[m.getDay()]})`;e.innerHTML=`
    ${He()}
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
              `:o?je?.status===`completed`?`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;opacity:0.5;cursor:not-allowed;" disabled title="이미 처리되었습니다">이미 처리됨</button>`:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${Ae.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기 (${z} 소급)</button>`:r?`
                  ${i?`<button class="btn-secondary" id="btnRefreshCompletion" style="font-size:11px;padding:3px 10px;color:#3182ce;" title="롤백 후 변경된 생산 기준으로 재차감">새로고침</button>`:``}
                  <button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>
                `:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${P.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기</button>`}
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${u}</span>
            ${r&&!a&&!o?`<span class="main-completed-pill">내일생산불러오기 완료</span>`:``}
          </div>
          <div class="main-production-grid">
            ${l.length===0?`<div class="main-empty">${a?`선택한 날짜에 생산 없음`:o?`처리 필요 날짜에 생산 없음`:r?`불러온 다음 영업일 생산 없음`:`오늘 생산 없음`}</div>`:l.map(e=>qt(e)).join(``)}
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
            ${pn(l,r&&!a)}
          </div>
        </div>

        <!-- 3번 화면 = 차단 영역 + 생산 로그 + 사무 로그 -->
        <div class="main-panel-3">
          ${pt(s)}
          <div class="main-log-columns">
            ${mt(`production`)}
            ${mt(`office`)}
          </div>
        </div>
      </div>

      <!-- [묶음 6B-1] 우하단 = 4번 캘린더 -->
      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">📆 2주 캘린더</span>
        </div>
        <div class="main-calendar-body">
          ${Ke()}
        </div>
      </div>
    </div>
  `,document.getElementById(`btnBigView`)?.addEventListener(`click`,Cn),document.getElementById(`btnTodayReceiptSummary`)?.addEventListener(`click`,()=>Yt(l,p)),document.getElementById(`btnTomorrowLoad`)?.addEventListener(`click`,()=>gn(o?z:void 0)),document.getElementById(`btnCancelCompletion`)?.addEventListener(`click`,bn),document.getElementById(`btnRefreshCompletion`)?.addEventListener(`click`,xn),document.getElementById(`btnBackToToday`)?.addEventListener(`click`,Sn),(y===`admin`||y===`office`||y===`production`)&&(o||a||!r)&&document.querySelectorAll(`.main-production-card.receivable`).forEach(e=>{e.style.cursor=`pointer`,e.title=`클릭하여 제품 입고`,e.addEventListener(`click`,()=>{[...U,...ke,...N,...P].find(t=>t.id===e.dataset.id)?.category===`freezeDry`?en(e.dataset.id):Qt(e.dataset.id)})}),document.querySelectorAll(`.alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;re(t),de()})}),Ye(),xt()}function He(){if(y===`production`)return``;let e=x(C());return e?`
    <div class="holiday-data-notice holiday-data-notice--${e.level}">
      ${e.message}
    </div>
  `:``}function Ue(e=0){let t=new Date(C()+`T00:00:00`),n=(t.getDay()+6)%7,r=new Date(t);r.setDate(r.getDate()-n+e*7);let i=[];for(let e=0;e<14;e++){let t=new Date(r);t.setDate(t.getDate()+e);let n=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,`0`),o=String(t.getDate()).padStart(2,`0`);i.push(`${n}-${a}-${o}`)}return{dates:i,startDate:i[0],endDate:i[13]}}async function We(e=0){let t=await Ge(e);({calendarSchedules:Me,calendarProductions:B,calendarEvents:Ne}=t)}async function Ge(e=0,t=T()){let{startDate:n,endDate:i}=Ue(e),o=e=>r(p(g,e),a(`date`,`>=`,n),a(`date`,`<=`,i)),[s,c,l]=await Promise.all([t.getDocs(o(`schedules`)),t.getDocs(o(`productions`)),t.getDocs(o(`events`)).catch(e=>(console.warn(`[캘린더] events 컬렉션 로드 실패:`,e.message),null))]);return{calendarSchedules:s.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status===`scheduled`),calendarProductions:c.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status!==`deleted`),calendarEvents:l?l.docs.map(e=>({id:e.id,...e.data()})):[]}}function Ke(){let{dates:e}=Ue(V),t=C(),n=v(),r=se();return`
    <div class="cal-container">
      <div class="cal-toolbar">
        <button class="cal-nav-btn" id="btnCalPrev" title="이전 주">◀</button>
        <span class="cal-range-label">${Ze(e[0],e[13])}</span>
        <button class="cal-nav-btn" id="btnCalNext" title="다음 주">▶</button>
        ${V===0?``:`<button class="cal-today-btn" id="btnCalToday">오늘로</button>`}
      </div>
      <div class="cal-weekday-row">
        ${[`월`,`화`,`수`,`목`,`금`,`토`,`일`].map((e,t)=>`<div class="cal-weekday ${t>=5?`cal-weekday-weekend`:``}">${e}</div>`).join(``)}
      </div>
      <div class="cal-grid">
        ${e.map(e=>qe(e,t,n,r)).join(``)}
      </div>
    </div>
  `}function qe(e,t,n,r){let i=(new Date(e+`T00:00:00`).getDay()+6)%7>=5,a=r[e]||null,o=r[Je(e,1)]||null,s=!i&&a?.affectsProduction!==!0&&(a?.affectsShipping===!0||o?.affectsShipping===!0&&o.shippingClosedFromEnabled===!0),c=!s&&(i||a?.affectsProduction===!0||!a&&n.includes(e)),l=e===t,u=Ne.filter(t=>t.date===e),d=Me.filter(t=>t.date===e),f=B.filter(t=>t.date===e),p=[];u.forEach(e=>{let t=e.title||``;p.push(`<div class="cal-tag cal-tag-event" title="${J(t)}">📌 ${J(t)}</div>`)}),d.forEach(e=>{let t=Qe(e);p.push(`<div class="cal-tag cal-tag-schedule" title="${J(t)}">📦 ${J(t)}</div>`)}),f.slice(0,3).forEach(e=>{let t=e.productionUnitQty==null?``:` ${un(e.productionUnitQty)}${on(e)}`,n=`${e.recipeName||``}${t}`;p.push(`<div class="cal-tag cal-tag-production" title="${J(n)}">🏭 ${J(n)}</div>`)}),f.length>3&&p.push(`<div class="cal-tag-more">+${f.length-3}</div>`);let m=e.split(`-`),h=parseInt(m[2],10),g=h===1?`${parseInt(m[1],10)}/${h}`:String(h),_=s?`배송불가일`:``;return`
    <div class="${[`cal-cell`,c?`cal-cell-holiday`:``,s?`cal-cell-shipping-closed`:``,l?`cal-cell-today`:``].filter(Boolean).join(` `)}" data-date="${e}">
      <div class="cal-cell-date-row">
        <span class="cal-cell-date">${g}</span>
        ${_?`<span class="cal-shipping-closed-label">(${_})</span>`:``}
      </div>
      <div class="cal-cell-tags">${p.join(``)}</div>
    </div>
  `}function Je(e,t){let n=new Date(e+`T00:00:00`);return n.setDate(n.getDate()+t),`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,`0`)}-${String(n.getDate()).padStart(2,`0`)}`}function Ye(){document.getElementById(`btnCalPrev`)?.addEventListener(`click`,()=>{--V,Xe()}),document.getElementById(`btnCalNext`)?.addEventListener(`click`,()=>{V+=1,Xe()}),document.getElementById(`btnCalToday`)?.addEventListener(`click`,()=>{V=0,Xe()}),document.querySelectorAll(`.cal-cell`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date;t&&$e(t)})})}async function Xe(){await We(V);let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=Ke(),Ye())}function Ze(e,t){let n=e.split(`-`),r=t.split(`-`);return`${parseInt(n[1])}/${parseInt(n[2])} ~ ${parseInt(r[1])}/${parseInt(r[2])}`}function Qe(e){let t=e.itemNameSnapshot||``,n=e.orderedQty==null?``:e.orderedQty,r=e.orderedUnit||``;return e.type===`egg`?`계란 ${n}${r}`:e.type===`meat`?`${t||`원육`} ${n}${r}`:e.type===`bag`?`${t||`봉투`} ${n}${r}`:`${t} ${n}${r}`}function $e(e){let t=y===`admin`||y===`office`,n=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],r=new Date(e+`T00:00:00`),i=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${n[r.getDay()]})`,a=v(),o=r.getDay(),s=o===0||o===6,c=a.includes(e),l=s||c?`<span class="cal-modal-holiday-pill">휴일</span>`:``,u=Ne.filter(t=>t.date===e),d=Me.filter(t=>t.date===e),f=B.filter(t=>t.date===e),p=u.length===0?`<div class="cal-modal-empty">등록된 이벤트 없음</div>`:u.map(e=>`
        <div class="cal-modal-list-item cal-event-item" data-event-id="${e.id}">
          <div class="cal-event-row">
            <span class="cal-event-title">📌 ${J(e.title||``)}</span>
            ${t?`
              <span class="cal-event-actions">
                <button class="cal-event-btn" data-event-act="edit" data-event-id="${e.id}">수정</button>
                <button class="cal-event-btn cal-event-btn-danger" data-event-act="delete" data-event-id="${e.id}">삭제</button>
              </span>
            `:``}
          </div>
          ${e.content?`<div class="cal-modal-list-sub">${J(e.content)}</div>`:``}
        </div>
      `).join(``),m=d.length===0?`<div class="cal-modal-empty">예정 없음</div>`:d.map(e=>`<div class="cal-modal-list-item">📦 ${J(Qe(e))}</div>`).join(``),h=f.length===0?`<div class="cal-modal-empty">생산 없음</div>`:f.map(e=>{let t=e.batchNo?` <span style="color:#888;">(${e.batchNo}차)</span>`:e.round>1?` <span style="color:#888;">(${e.round}회차)</span>`:``;return`<div class="cal-modal-list-item">🏭 ${J(e.recipeName||``)}${t}</div>`}).join(``),g;g=s?`<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;">
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
  `),document.getElementById(`btnAddEvent`)?.addEventListener(`click`,()=>{tt(e,null)}),document.querySelectorAll(`[data-event-act]`).forEach(t=>{t.addEventListener(`click`,async n=>{let r=t.dataset.eventAct,i=t.dataset.eventId;r===`edit`?tt(e,i):r===`delete`&&await rt(i,e)})}),document.getElementById(`chkManualHoliday`)?.addEventListener(`change`,async t=>{await it(e,t.target.checked)}),document.getElementById(`btnViewThisDate`)?.addEventListener(`click`,async()=>{if(z&&e>z){alert(`${z} 처리가 아직 끝나지 않았습니다.\n먼저 해당 날짜를 처리한 뒤 다음 날짜를 확인하세요.`),H=null,U=[],W=null,closeModal(),q();return}H=e,U=B.filter(t=>t.date===e),W=await ye(e),closeModal(),q()})}function J(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function et(e){return Number(e||0).toLocaleString(`ko-KR`)}async function tt(e,t){let n;try{n=await k({refs:t?[`events/`+t]:[`holidays/`+e],roles:[`admin`,`office`]})}catch(e){alert(e.message);return}let r=!!t,i=r?n.values[0]:null;if(r&&!i){alert(`삭제된 이벤트입니다. 다시 불러와주세요.`);return}let a=i?.title||``,o=i?.content||``,s=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],c=new Date(e+`T00:00:00`),l=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${s[c.getDay()]})`;$(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${r?`이벤트 수정`:`이벤트 등록`} — ${l}</h3>

    <div style="margin-bottom:10px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">제목 (필수)</label>
      <input type="text" id="evTitle" maxlength="50" value="${J(a)}"
             style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">내용 (선택)</label>
      <textarea id="evContent" rows="3" maxlength="300"
                style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;resize:vertical;">${J(o)}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      ${r?`<button class="btn-secondary" id="btnEvDelete" style="color:#c92a2a;border-color:#ffc9c9;">삭제</button>`:``}
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnEvSave">${r?`저장`:`등록`}</button>
    </div>
  `),setTimeout(()=>document.getElementById(`evTitle`)?.focus(),50),document.getElementById(`btnEvSave`)?.addEventListener(`click`,async()=>{let r=document.getElementById(`evTitle`).value.trim(),i=document.getElementById(`evContent`).value.trim();if(!r){alert(`제목을 입력해주세요.`);return}let a=document.getElementById(`btnEvSave`);a.disabled=!0;try{await n.submit(()=>nt({id:t,date:e,title:r,content:i}))}catch(e){alert(e.message)}finally{a.disabled=!1}}),r&&document.getElementById(`btnEvDelete`)?.addEventListener(`click`,async()=>{await E({title:`이벤트 삭제`,message:`"${a}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`})&&await rt(t,e)})}async function nt({id:e,date:t,title:n,content:r}){try{e?await o(h(g,`events`,e),{title:n,content:r||``,updatedAt:m()}):await c(p(g,`events`),{date:t,title:n,content:r||``,createdAt:m()}),closeModal(),await We(V),at(),$e(t)}catch(e){console.error(`[6B-2] 이벤트 저장 실패:`,e),alert(`저장 중 오류가 발생했습니다.`)}}async function rt(e,t){let n;try{n=await k({refs:[`events/`+e],roles:[`admin`,`office`]})}catch(e){alert(e.message);return}let r=n.values[0];if(r&&await E({title:`이벤트 삭제`,message:`"${r.title||`(제목 없음)`}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`}))try{await n.confirm(),await u(h(g,`events`,e)),closeModal(),await We(V),at(),$e(t)}catch(e){console.error(`[6B-2] 이벤트 삭제 실패:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}async function it(e,t){try{await(await k({refs:[`holidays/`+e],roles:[`admin`,`office`]})).confirm(),t?await l(h(g,`holidays`,e),{date:e,holidayType:`internalOff`,title:`수동 휴일`,label:`수동 휴일`,affectsProduction:!0,affectsShipping:!0,shippingClosedFromEnabled:!0,isAutoGenerated:!1,status:`active`,createdAt:m(),updatedAt:m()}):await l(h(g,`holidays`,e),{date:e,status:`deleted`,updatedAt:m(),deletedAt:m()},{merge:!0}),await w(),at()}catch(e){console.error(`[6B-2] 휴일 토글 실패:`,e),alert(`휴일 설정 중 오류가 발생했습니다.`)}}function at(){let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=Ke(),Ye())}var ot=[`bag`,`egg`,`meat`,`frozenProduct`,`frozenSep`,`schedule`,`frozenPan`,`closing`,`supplementStock`,`recipe`,`settings`,`holiday`,`conversion`,`equipment`],st=[`production`,`repackaging`,`pretreat`,`event`,`scheduleDue`,`autoRepack`,`minStock`,`frozenStockLow`,`partDue`],ct={"meat:adjust":`production`},lt=new Set([`scheduleDue:trigger`,`autoRepack:trigger`,`autoRepack:diff`,`minStock:alert`,`frozenStockLow:alert`,`partDue:alert`,`schedule:completeDiff`,`closing:refresh`]);function ut(e){let t=`${e.action}:${e.subAction}`;return ct[t]?ct[t]:st.includes(e.action)?`production`:ot.includes(e.action)?`office`:`ignore`}function Y(e){return lt.has(`${e.action}:${e.subAction}`)}function dt(e){let t=new Date(new Date().getTime()-e*24*60*60*1e3);return new Date(t.getTime()+540*60*1e3).toISOString().split(`T`)[0]}async function X(){Ie=await ft()}async function ft(e=T()){let t=C(),n=dt(10),[i,o]=await Promise.all([e.getDocs(r(p(g,`activityLogs`),a(`date`,`==`,t))).catch(e=>{throw console.error(`[6C-1] 당일 로그 로드 실패:`,e),e}),e.getDocs(r(p(g,`activityLogs`),a(`date`,`>=`,n),a(`date`,`<`,t))).catch(e=>{throw console.error(`[6C-1] 과거 로그 로드 실패:`,e),e})]),s=i?i.docs.map(e=>({id:e.id,...e.data()})):[],c=o?o.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.acknowledged!==!0&&Y(e)):[];return[...s,...c].sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}function pt(e=De){let t=[];(e.items||[]).forEach(e=>{t.push(`
      <div class="alert-card alert-card-blocker">
        <span class="alert-card-label">⛔ ${e.reason||e.label}</span>
        <button class="alert-card-jump" data-jump="${e.jumpMenu}">처리하러 가기 →</button>
      </div>
    `)}),L.minimumQty>0&&L.currentQty<L.minimumQty&&t.push(`
      <div class="alert-card alert-card-warning">
        <span class="alert-card-label">⚠️ 계란 부족 (현재: ${L.currentQty}개 / 최소: ${L.minimumQty}개)</span>
        <button class="alert-card-jump" data-jump="egg">처리하러 가기 →</button>
      </div>
    `);let n=mn();return n&&t.push(n),t.length===0?``:`
    <div class="log-blocker-area">
      ${t.join(``)}
    </div>
  `}function mt(e){let t=e===`production`?`🏭 생산 로그`:`🗒️ 사무 로그`,n=Ie.filter(t=>ut(t)===e);n.sort((e,t)=>{let n=Y(e)&&e.acknowledged!==!0?1:0,r=Y(t)&&t.acknowledged!==!0?1:0;if(n!==r)return r-n;let i=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-i});let r=n.some(e=>e.acknowledged!==!0&&!Y(e)),i=n.length===0?`<div class="log-empty">${e===`production`?`오늘 생산 로그 없음`:`오늘 사무 로그 없음`}</div>`:n.map(e=>ht(e)).join(``);return`
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
  `}function ht(e){let t=e.acknowledged!==!0,n=Y(e),r=C(),i=ee(),a;if(e.date===r)a=yt(e.timestamp);else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[1])}/${parseInt(t[2])}`:e.date||``}let o=[`log-row`,t?`log-row-unack`:``,n?`log-row-critical`:``].filter(Boolean).join(` `),s=t?`<button class="log-ack-btn" data-log-act="ack" data-log-id="${e.id}">확인</button>`:`<span class="log-ack-done" title="${e.acknowledgedBy||``} 확인">✓</span>`,c=n&&t?`<span class="log-critical-badge">⚠️</span>`:``,l=vt(e);return`
    <div class="${o}">
      <span class="log-row-time">${a}</span>
      <span class="log-row-msg">${c}${J(l)}</span>
      <span class="log-row-action">${s}</span>
    </div>
  `}function gt(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function _t(e,t,n){if(t===`g`)return gt(e);let r=`${e}${t}`;return t!==`마리`||!n?r:`${r} (${gt(Number(e||0)*Number(n||0))})`}function vt(e){if(e.action!==`schedule`||e.subAction!==`completeDiff`)return e.message||`(메시지 없음)`;let t=e.details||{};if(t.orderedQty==null||t.actualQty==null)return e.message||`(메시지 없음)`;let n=t.orderedUnit||t.unit||``,r=t.unit||n,i=_t(t.orderedQty,n,t.orderedUnitGrams),a=_t(t.actualQty,r,t.orderedUnitGrams),o=t.itemName||`입고 예정`,s=e.staff||``;return`${o} 입고 완료 ⚠️ 발주 ${i} → 실제 ${a}${s?` / 담당: ${s}`:``}`}function yt(e){if(!e||!e.toMillis)return`—`;let t=new Date(e.toMillis()),n=new Date(t.getTime()+540*60*1e3);return`${String(n.getUTCHours()).padStart(2,`0`)}:${String(n.getUTCMinutes()).padStart(2,`0`)}`}function bt(){return y===`admin`?`대표`:y===`office`?`사무실`:y===`production`?`생산실`:`운영자`}function xt(){document.querySelectorAll(`[data-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;await St(t)})}),document.querySelectorAll(`[data-log-act="ackAll"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logCat;await Et(t)})}),document.querySelectorAll(`[data-log-act="all"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;Mt(t)})}),document.querySelectorAll(`[data-log-act="history"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;Nt(t)})})}async function St(e){try{let n=await k({refs:[`activityLogs/`+e]}),r=await t(h(g,`activityLogs`,e));if(!r.exists()){alert(`로그를 찾을 수 없습니다.`);return}let i={id:e,...r.data()};if(i.action===`autoRepack`&&i.subAction===`trigger`&&i.acknowledged!==!0){await wt(e,i);return}await n.submit(()=>he(e,bt())),await X(),Dt()}catch(e){console.error(`[6C-1] 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}}async function Ct(){let e=await t(h(g,`staffGroups`,`lead`));return(e.exists()&&e.data().members||[]).filter(e=>e&&e.active!==!1&&e.name).sort((e,t)=>(e.sortOrder||0)-(t.sortOrder||0)).map(e=>e.name)}async function wt(e,t){let n=await k({refs:[`activityLogs/`+e,`meatStocks/`+t.details?.repackedStockId],roles:[`admin`,`production`]});if(t=n.values[0],!t||t.acknowledged===!0){alert(`이미 처리되었거나 삭제된 로그입니다.`);return}if(y===`office`){alert(`자동 재포장 확인은 생산실/대표 계정에서만 처리할 수 있습니다.`);return}let r=t.details||{},i=r.meatName||`?`,a=Number(r.surplusG)||0,o=Number(r.processedUnitWeightG)||0,s=r.repackedStockId,c=r.mode;if(!s||!o){alert(`자동 재포장 로그 데이터가 손상되어 처리할 수 없습니다. (운영자에게 문의)`);return}let l=a/o,u=Number.isInteger(l)?`${l}개`:`약 ${l.toFixed(2)}개`,d=await Ct();if(d.length===0){alert(`주임 그룹 담당자가 등록되어 있지 않습니다. 설정에서 추가해주세요.`);return}$(`
    <div style="padding:16px; min-width:440px; max-width:560px;">
      <h3 style="margin:0 0 12px;">자동 재포장 확인 — ${J(i)}</h3>
      <div style="background:#f5f5f5; padding:12px; border-radius:4px; margin-bottom:16px; line-height:1.7;">
        <div><b>시스템 자동 재포장 수량 (수정 불가)</b></div>
        <div style="font-size:15px; font-weight:600; color:#1f2937;">${et(a)}g (${(a/1e3).toFixed(2)}kg)</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">
          단위중량 ${et(o)}g 기준 ${u}<br>
          모드: ${c===`merged`?`기존 lot 합산`:`신규 lot 생성`}
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
          ${d.map(e=>`<option value="${J(e)}">${J(e)}</option>`).join(``)}
        </select>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="ar-cancel" style="padding:8px 16px; background:#e5e7eb; border:none; border-radius:4px; cursor:pointer;">취소</button>
        <button id="ar-confirm" style="padding:8px 16px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">확인</button>
      </div>
    </div>
  `);let f=document.getElementById(`ar-actual-count`),p=document.getElementById(`ar-actual-g`);f.addEventListener(`input`,()=>{let e=parseInt(f.value,10);if(isNaN(e)||e<0){p.textContent=`→ 개수 입력 시 환산 g 자동 표시`;return}let t=e*o,n=t-a,r=n===0?` (시스템과 동일)`:` (차이 ${n>0?`+`:``}${et(n)}g)`;p.textContent=`→ ${et(t)}g (${(t/1e3).toFixed(2)}kg)${r}`}),document.getElementById(`ar-cancel`).addEventListener(`click`,()=>{closeModal()}),document.getElementById(`ar-confirm`).addEventListener(`click`,async()=>{let r=parseInt(f.value,10),i=document.getElementById(`ar-staff`).value;if(!i){alert(`담당자를 선택해주세요.`);return}if(isNaN(r)||r<0){alert(`실제 수량은 0 이상의 정수여야 합니다.`);return}if(r===0&&!await E({title:`실제 재포장 수량 0개`,message:`실제 재포장 수량이 0개입니다.
자동 재포장 lot을 0g으로 만들고 마감 처리합니다.
진행할까요?`,confirmText:`진행`,cancelText:`취소`,danger:!0}))return;let s=document.getElementById(`ar-confirm`);s.disabled=!0;try{await n.submit(()=>Tt({logId:e,log:t,actualCount:r,surplusG:a,processedUnitWeightG:o,staffName:i})),closeModal()}catch(e){console.error(`[묶음 9 #9] 자동 재포장 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다: `+(e.message||e))}finally{s.disabled=!1}})}async function Tt({logId:e,log:n,actualCount:r,surplusG:i,processedUnitWeightG:a,staffName:s}){let c=n.details||{},l=c.repackedStockId,u=c.meatTypeId,d=c.meatName,f=C(),p=r*a,m=p-i;if(m===0){await he(e,s),await X(),Dt();return}let _=h(g,`meatStocks`,l),v=await t(_);if(!v.exists())throw Error(`자동 재포장 lot 문서를 찾을 수 없습니다.`);let y=v.data(),b=Number(y.remaining)||0,x=b+m;if(x<0)throw Error(`자동 재포장 lot 잔량이 음수가 됩니다 (현재 ${b}g, 보정 ${m}g).`);await o(_,{remaining:x,closed:r===0&&x===0,updatedAt:new Date}),await me({action:`autoRepack`,subAction:`diff`,date:f,staff:s,message:`자동 재포장 차이 — ${d} 시스템 ${i}g / 실제 ${p}g (${m>0?`+`:``}${m}g) — 담당: ${s}`,details:{meatTypeId:u,meatName:d,repackedStockId:l,processedUnitWeightG:a,systemG:i,actualCount:r,actualG:p,diffG:m,sourceLogId:e}}),await he(e,s),await X(),Dt()}async function Et(e){try{await X()}catch(e){alert(e.message);return}let t=Ie.filter(t=>ut(t)===e&&t.acknowledged!==!0&&!Y(t));if(t.length!==0&&await E({title:`모두 확인`,message:`${e===`production`?`생산`:`사무`} 로그 ${t.length}건을 모두 확인 처리하시겠습니까?\n(확인 필수 항목은 제외됩니다)`,confirmText:`확인 처리`,cancelText:`취소`}))try{let e=await k({refs:t.map(e=>`activityLogs/`+e.id)}),n=bt();await e.submit(e=>Promise.all(e.filter(e=>e&&e.acknowledged!==!0&&!Y(e)).map(e=>he(e.id,n)))),await X(),Dt()}catch(e){console.error(`[6C-1] 모두 확인 실패:`,e),alert(`일괄 확인 중 오류가 발생했습니다.`)}}function Dt(){let e=document.querySelector(`.main-panel-3`);e&&(e.innerHTML=`
    ${pt()}
    ${mt(`production`)}
    ${mt(`office`)}
  `,document.querySelectorAll(`.main-panel-3 .alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;re(t),de()})}),xt())}var Z=[],Ot=null,kt=``,Q=`all`,At=null,jt=!1;async function Mt(e){Ot=e,Q=`all`,kt=``,Z=[],await Pt(),It()}async function Nt(e){Ot=e,Q=`history`,kt=``,Z=[],At=null,jt=!1,await Ft(),It()}async function Pt(){let e=C(),t=dt(10);try{Z=(await d(r(p(g,`activityLogs`),a(`date`,`>=`,t),a(`date`,`<=`,e)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>ut(e)===Ot).sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}catch(e){console.error(`[6C-1B] 전체보기 로드 실패:`,e),alert(`전체보기 로드 실패: 관리자에게 문의해주세요.`)}}async function Ft(){if(!jt)try{let e=[f(`timestamp`,`desc`),n(100)];At&&e.push(s(At));let t=await d(r(p(g,`activityLogs`),...e));t.docs.length<100&&(jt=!0),t.docs.length>0&&(At=t.docs[t.docs.length-1]);let i=t.docs.map(e=>({id:e.id,...e.data()})).filter(e=>ut(e)===Ot);Z=[...Z,...i]}catch(e){console.error(`[6C-1B] 히스토리 로드 실패:`,e),alert(`히스토리 로드 실패: 관리자에게 문의해주세요.`)}}function It(){$(`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;">${Ot===`production`?`생산 로그`:`사무 로그`} — ${Q===`all`?`전체보기 (10일)`:`히스토리 (전체)`}</h3>
      ${Q===`all`?`<button class="btn-secondary" id="btnLogModalSwitch" style="font-size:11px;">히스토리로 전환 →</button>`:``}
    </div>

    <div style="margin-bottom:8px;">
      <input type="text" id="logModalSearch" placeholder="메시지 검색 (담당자명, 품목명 등)"
             style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:12px;box-sizing:border-box;"
             value="${J(kt)}">
    </div>

    <div id="logModalList" class="log-modal-list">
      ${zt()}
    </div>

    <div id="logModalFooter" style="display:flex;gap:8px;justify-content:space-between;margin-top:12px;">
      <div>
        ${Q===`history`&&!jt?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
      </div>
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.getElementById(`logModalSearch`)?.addEventListener(`input`,e=>{kt=e.target.value,Lt()}),document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await Ft(),Lt(),Rt()}),document.getElementById(`btnLogModalSwitch`)?.addEventListener(`click`,async()=>{Q=`history`,kt=``,Z=[],At=null,jt=!1,await Ft(),It()}),Vt()}function Lt(){let e=document.getElementById(`logModalList`);e&&(e.innerHTML=zt(),Vt())}function Rt(){let e=document.getElementById(`logModalFooter`);e&&(e.innerHTML=`
    <div>
      ${Q===`history`&&!jt?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
    </div>
    <button class="btn-secondary" onclick="closeModal()">닫기</button>
  `,document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await Ft(),Lt(),Rt()}))}function zt(){let e=kt.trim().toLowerCase(),t=e?Z.filter(t=>(t.message||``).toLowerCase().includes(e)):Z;if(t.length===0)return`<div class="log-empty" style="padding:24px 8px;">${e?`검색 결과 없음`:`표시할 로그 없음`}</div>`;let n=null,r=[];return t.forEach(e=>{if(e.date!==n){n=e.date;let t=C(),i=ee(),a;if(e.date===t)a=`오늘`;else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[0])}.${parseInt(t[1])}.${parseInt(t[2])}`:e.date||``}r.push(`<div class="log-modal-date-header">${a}</div>`)}r.push(Bt(e))}),r.join(``)}function Bt(e){let t=e.acknowledged!==!0,n=Y(e),r=yt(e.timestamp),i=[`log-modal-row`,t?`log-row-unack`:``,n?`log-row-critical`:``].filter(Boolean).join(` `),a=t?`<button class="log-ack-btn" data-modal-log-act="ack" data-log-id="${e.id}">확인</button>`:`<span class="log-ack-done" title="${e.acknowledgedBy||``} 확인">✓ ${J(e.acknowledgedBy||``)}</span>`;return`
    <div class="${i}">
      <span class="log-row-time">${r}</span>
      <span class="log-row-msg">${n&&t?`<span class="log-critical-badge">⚠️</span>`:``}${J(vt(e))}</span>
      <span class="log-row-action">${a}</span>
    </div>
  `}function Vt(){document.querySelectorAll(`[data-modal-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;try{let e=Z.find(e=>e.id===t);if(e&&e.action===`autoRepack`&&e.subAction===`trigger`&&e.acknowledged!==!0){await wt(t,e);return}await he(t,bt()),e&&(e.acknowledged=!0,e.acknowledgedBy=bt()),await X(),Dt(),Lt()}catch(e){console.error(`[6C-1B] 모달 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}})})}async function Ht(e,t,n,i){try{let i=await n.getDocs(r(p(g,`events`),a(`date`,`==`,e)));for(let n of i.docs){let r={id:n.id,...n.data()};t.enqueue({action:`event`,subAction:`dueToday`,date:e,message:`📅 오늘 일정 — ${r.title||`(제목 없음)`}`,details:{eventId:r.id,title:r.title||``},dedupKey:`event:${r.id}`})}}catch(e){throw console.warn(`[6C-3] 이벤트 자동 발행 실패:`,e.message),e}}async function Ut(e,t,n,i){try{let i=await n.getDocs(r(p(g,`schedules`),a(`date`,`==`,e)));for(let n of i.docs){let r={id:n.id,...n.data()};if(r.status!==`scheduled`)continue;let i=r.type===`egg`?`계란`:r.itemNameSnapshot||`(품목)`;t.enqueue({action:`scheduleDue`,subAction:`trigger`,date:e,message:`📦 입고 예정일 도래 — ${i} ${r.orderedQty}${r.orderedUnit}`,details:{scheduleId:r.id,type:r.type,itemName:r.itemNameSnapshot,orderedQty:r.orderedQty,orderedUnit:r.orderedUnit},dedupKey:`scheduleDue:${r.id}`})}}catch(e){throw console.error(`[6C-3] 입고 예정 자동 발행 실패:`,e),e}}async function Wt(e,t,n,i){try{i.eggStock.minimumQty>0&&i.eggStock.currentQty<i.eggStock.minimumQty&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ 계란 부족 — 현재 ${i.eggStock.currentQty}개 / 최소 ${i.eggStock.minimumQty}개`,details:{kind:`egg`,current:i.eggStock.currentQty,minimum:i.eggStock.minimumQty},dedupKey:`minStock:egg`});let o=await n.getDocs(p(g,`meatTypes`)),s=(await n.getDocs(p(g,`meatStocks`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed);for(let n of o.docs){let r={id:n.id,...n.data()};if(!r.minimumQtyG)continue;let i=s.filter(e=>e.meatTypeId===r.id).reduce((e,t)=>e+(t.remaining||0),0);i<r.minimumQtyG&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`원육`} 부족 — 현재 ${(i/1e3).toFixed(1)}kg / 최소 ${(r.minimumQtyG/1e3).toFixed(1)}kg`,details:{kind:`meat`,meatTypeId:r.id,name:r.name,current:i,minimum:r.minimumQtyG},dedupKey:`minStock:meat:${r.id}`})}let c=await n.getDocs(p(g,`bagTypes`));for(let n of c.docs){let r={id:n.id,...n.data()};r.minimumQty&&(r.currentQty||0)<r.minimumQty&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`봉투`} 부족 — 현재 ${r.currentQty||0}장 / 최소 ${r.minimumQty}장`,details:{kind:`bag`,bagTypeId:r.id,name:r.name,current:r.currentQty||0,minimum:r.minimumQty},dedupKey:`minStock:bag:${r.id}`})}let l=await n.getDocs(r(p(g,`supplementTypes`),a(`active`,`==`,!0))),u=await n.getDocs(p(g,`supplementStock`)),d=new Map(u.docs.map(e=>[e.id,{id:e.id,...e.data()}]));for(let n of l.docs){let r={id:n.id,...n.data()},i=d.get(r.id),a=i?Number(i.currentQty||0):0;a>=5||t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`영양제`} 부족 — 현재 ${a}봉 / 최소 5봉`,details:{kind:`supplement`,supplementTypeId:r.id,name:r.name,current:a,minimum:5},dedupKey:`supplementMin:alert:${r.id}`})}}catch(e){throw console.error(`[6C-3] 최소재고 자동 발행 실패:`,e),e}}async function Gt(e,t,n,r){await Promise.all([Ht(e,t,n,r),Ut(e,t,n,r),Wt(e,t,n,r),Kt(e,t,n,r)])}async function Kt(e,t,n,r){for(let n of r.equipmentAlerts){let r=n.part;n.kind===`due`?t.enqueue({action:`partDue`,subAction:`alert`,date:e,message:`🔧 ${D(r)} 교체 ${n.overdue?`예정일 ${Math.abs(n.dday)}일 지남`:ce(n.dday)} (예정 ${r.nextDueAt})`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,nextDueAt:r.nextDueAt,dday:n.dday},dedupKey:`partDue:${r.id}`}):n.kind===`low`&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${D(r)} 부품 부족 — 현재 ${Number(r.currentQty||0)}개 / 최소 ${Number(r.minimumQty||0)}개`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,current:Number(r.currentQty||0),minimum:Number(r.minimumQty||0)},dedupKey:`minStock:part:${r.id}`})}}function qt(e){let t=e.ingredientsSnapshot||[],n=an(e,t),r=e.batchNo?` <span>${e.batchNo}차</span>`:e.round>1?` <span>${e.round}회차</span>`:``;return`
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
            <td>${un(e.productionUnitQty)}</td>
            <td>${on(e)}</td>
          </tr>
          ${t.map(t=>`
            <tr>
              <td>${t.name}</td>
              <td>${cn(e,t)}</td>
              <td>${ln(e,t)}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${e.category===`raw`?`<span>${e.rawBoxQty||0}박스</span>`:``}
        ${e.category===`freezeDry`?Fe(e):``}
        ${e.received?Jt(e):``}
      </div>
    </div>
  `}function Jt(e){if(e.category===`freezeDry`){let t=e.receivedFreezeType===`breadPan`?`빵판`:`동결판`;return`<span class="main-received-badge">✅ 입고완료 ${e.receivedFreezeQty||0}${t}</span>`}return`<span class="main-received-badge">✅ 입고완료 ${e.receivedBox||0}박스${e.receivedRemainder?` +${e.receivedRemainder}낱개`:``}</span>`}function Yt(e,t){let n=(e||[]).filter(e=>e.category===`raw`||e.category===`freezeDry`),r=0,i=0,a=0,o=0,s=n.length===0?`<div style="color:#aaa;text-align:center;padding:18px;">입고 대상 생산이 없습니다.</div>`:n.map(e=>{let t=`<span style="color:#c53030;">미입고</span>`;if(e.received)if(e.category===`raw`){let n=Number(e.receivedBox||0),a=Number(e.receivedRemainder||0);r+=n,i+=a,t=`${n}박스${a?` + ${a}낱개`:``}`}else{let n=Number(e.receivedFreezeQty||0);e.receivedFreezeType===`breadPan`?(a=A(a+n),t=`${n}빵판`):(o+=n,t=`${n}동결판`)}return`
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
  `)}async function Xt(e){try{let t=await oe().getDoc(h(g,`productions`,e));if(!t.exists())throw Error(`생산 자료가 삭제되었습니다.`);let n=t.data(),r=await k({refs:[`productions/`+e,`recipes/`+n.recipeId,`settings/systemValues`,`closings/`+n.date]}),[i,a,o]=r.values;if(!i||i.status===`deleted`||i.recipeId!==n.recipeId||i.date!==n.date)throw Error(`생산 정보가 변경되었습니다. 다시 열어주세요.`);return{action:r,p:i,recipe:a,sysVals:o||{}}}catch(e){return alert(e.message),null}}async function Zt(e){let t=await k({roles:e});if(!await K(oe(),{autoLogsEnabled:!1}))throw Error(`화면이 변경되었습니다.`);let n=()=>le({nextProductions:P,overdueNextProductions:Ae,recipes:F,completionDoc:R,overdueCompletionDoc:je,blockingData:De,meatStocks:I,eggStock:L}),r=n();return async()=>{if(await t.confirm(),!await K(oe(),{autoLogsEnabled:!1}))throw Error(`화면이 변경되었습니다.`);if(n()!==r)throw Error(`생산·재고·마감 조건이 변경되었습니다. 입력을 확인하고 다시 시도해주세요.`)}}async function Qt(t){let n=await Xt(t);if(!n)return;let{action:r,p:i,recipe:a,sysVals:o}=n;if(!i||i.category!==`raw`)return;if(i.date>C()){alert(`미래 날짜의 제품 입고는 입력할 수 없습니다.`);return}if(await ge(i.date)||i.received&&!await E({title:`입고완료 수정`,message:`현재 입력: 판수 ${i.receivedPlates??`-`} / 낱개 ${i.receivedLoosePacks??0} → 총 ${i.receivedTotalPacks??`-`}팩 = ${i.receivedBox??`-`}박스 + ${i.receivedRemainder??0}낱개

입고완료 내용을 수정하시겠습니까?
저장하면 수정 이력이 재고앱으로 다시 전송됩니다.`,confirmText:`수정하기`}))return;let s=a?.target||i.target||``,c=Number(a?.packsPerPlate),l=Number.isFinite(c)&&c>0,u=s===`cat`?`packsPerPlateCat`:s===`dog`?`packsPerPlateDog`:null,d=l?c:Number(u?o[u]:NaN);if(!Number.isFinite(d)||d<=0){alert(`설정 > 시스템 설정값에서 ${s===`cat`?`고양이`:s===`dog`?`강아지`:`대상`} 판당 팩수를 먼저 등록해주세요.`);return}let f=Array.isArray(a?.productionMethods)?a.productionMethods.filter(e=>e&&e.methodKey&&e.active!==!1):[],p=f.length>0?f.map(e=>`<option value="${e.methodKey}" ${i.receivedMethod===e.methodKey?`selected`:``}>${e.label||e.methodKey}</option>`).join(``):`<option value="">방식 없음</option>`;document.getElementById(`productReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="productReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">제품 입고 — ${i.recipeName}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">판당 팩수 ${d}팩/판${l?` (레시피 지정)`:``} · 1박스 = 20팩</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">생산방식 (기록용)</label>
          <select id="pr_method" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">${p}</select>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">판수 *</label>
            <input type="number" id="pr_plates" min="0" step="1" value="${i.receivedPlates??``}" placeholder="판수" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">낱개(자투리 팩)</label>
            <input type="number" id="pr_loose" min="0" step="1" value="${i.receivedLoosePacks??0}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
        </div>
        <div id="pr_result" style="font-size:13px;color:#1a1a1a;background:#f5f7f5;border-radius:6px;padding:10px;margin-bottom:14px;">판수를 입력하세요.</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="pr_cancel">취소</button>
          <button class="btn-primary" id="pr_confirm">제품 입고</button>
        </div>
      </div>
    </div>
  `);let _=document.getElementById(`productReceiptModal`),v=document.getElementById(`pr_plates`),y=document.getElementById(`pr_loose`),b=document.getElementById(`pr_result`),x=()=>_?.remove();function S(){let e=parseInt(v.value,10),t=parseInt(y.value,10)||0;if(!Number.isInteger(e)||e<0||t<0)return b.textContent=`판수를 입력하세요.`,null;let n=e*d+t,r=Math.floor(n/10)/2,i=n%10;return b.innerHTML=`총 <b>${n}</b>팩 → <b>${r}</b>박스 + <b>${i}</b>낱개`,{plates:e,loose:t,totalPacks:n,boxes:r,remainder:i}}v.addEventListener(`input`,S),y.addEventListener(`input`,S),S(),document.getElementById(`pr_cancel`).addEventListener(`click`,x),document.getElementById(`pr_confirm`).addEventListener(`click`,async t=>{let n=S();if(!n){v.focus();return}let a=document.getElementById(`pr_method`).value||null,o=(i.receivedRevision||0)+1,c=t.currentTarget;if(!c.disabled){c.disabled=!0;try{if(await r.confirm(),await ge(i.date))return;let t=e(g);t.update(h(g,`productions`,i.id),{received:!0,receivedMethod:a,receivedPlates:n.plates,receivedLoosePacks:n.loose,receivedTotalPacks:n.totalPacks,receivedBox:n.boxes,receivedRemainder:n.remainder,receivedRevision:o,receivedAt:m(),updatedAt:m()});let c=`productions:${i.id}:${o}`;t.set(h(g,`productTransferRequests`,c),{idempotencyKey:c,sourceApp:`production`,sourceCollection:`productions`,sourceId:i.id,eventType:`productReceipt`,revision:o,supersedesRevision:o>1?o-1:null,status:`pending`,category:`raw`,recipeId:i.recipeId,recipeName:i.recipeName,target:s,plates:n.plates,packs:n.totalPacks,boxes:n.boxes,remainderPacks:n.remainder,producedDate:i.date,staff:i.staffName||``,createdAt:m()}),await t.commit(),x(),await K(),H&&(U=B.filter(e=>e.date===H),W=await ye(H)),q()}catch(e){console.error(`[receipt] save failed:`,e),alert(`제품 입고 저장 중 오류가 발생했습니다: `+(e.message||e))}finally{c.disabled=!1}}})}async function $t(e=[`senior`,`office`]){let n=[];for(let r of e){let e=await t(h(g,`staffGroups`,r));e.exists()&&(e.data().members||[]).forEach(e=>{e?.name&&n.push(`<option value="${e.name}">${e.name}</option>`)})}return n.join(``)}async function en(e){let t=await Xt(e);if(!t)return;let{action:n,p:r,recipe:i,sysVals:a}=t;if(!r||r.category!==`freezeDry`)return;if(r.date>C()){alert(`미래 날짜의 동결건조 입고는 입력할 수 없습니다.`);return}if(await ge(r.date))return;let o=i?.displayName||r.recipeName||i?.name||`동결건조`,s=r.received?r.receivedFreezeType===`frozenPan`:r.requiresSeparation===!1||i?.requiresSeparation===!1,c=s?`동결판`:`빵판`;if(r.received){if(!await E({title:`입고완료 수정`,message:`현재 입력된 수량: ${r.receivedFreezeQty??`-`}${c}\n\n입고완료 내용을 수정하시겠습니까?\n수정 차이만큼 ${c} 재고 lot을 조정합니다.`,confirmText:`수정하기`}))return;if(!r.receivedLotId){alert(`원본 lot을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`);return}}let l=s?Math.round(Number(r.received?r.receivedFreezeQty:r.freezePanQty||0)):A(Number(r.received?r.receivedFreezeQty:r.breadPanQty||0)),u=await $t([`senior`,`office`]);document.getElementById(`freezeDryReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="freezeDryReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">동결건조 입고 — ${o}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">${s?`분리작업 불필요 → 동결판 재고 입고`:`분리작업 필요 → 빵판 재고 입고`}</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">${c} 수량 *</label>
          <input type="number" id="fd_qty" min="${s?`1`:`0.01`}" step="${s?`1`:`0.01`}" value="${l||``}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
        </div>
        <div class="form-group" style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">담당자 *</label>
          <select id="fd_staff" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">
            <option value="">선택</option>
            ${u}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="fd_cancel">취소</button>
          <button class="btn-primary" id="fd_confirm">${r.received?`수정 저장`:`입고`}</button>
        </div>
      </div>
    </div>
  `);let d=document.getElementById(`freezeDryReceiptModal`),f=()=>d?.remove();document.getElementById(`fd_cancel`).addEventListener(`click`,f),document.getElementById(`fd_confirm`).addEventListener(`click`,async()=>{let e=s?parseInt(document.getElementById(`fd_qty`).value,10):A(parseFloat(document.getElementById(`fd_qty`).value)||0),t=document.getElementById(`fd_staff`).value;if(!Number.isFinite(e)||e<=0){alert(`${c} 수량은 0보다 커야 합니다.`);return}if(!t){alert(`담당자를 선택해주세요.`);return}if(await ge(r.date))return;let i=document.getElementById(`fd_confirm`);if(!i.disabled){i.disabled=!0;try{if(await n.confirm(),r.received&&r.receivedLotId){if(!await tn({p:r,productName:o,qty:e,staffName:t,isTender:s}))return}else s?await rn({p:r,productName:o,qty:e,staffName:t}):await nn({p:r,productName:o,qty:e,staffName:t});f(),await K(),H&&(U=B.filter(e=>e.date===H),W=await ye(H)),q()}catch(e){console.error(`[freezeDryReceipt] save failed:`,e),alert(`동결건조 입고 저장 중 오류가 발생했습니다: `+(e.message||e))}finally{i.disabled=!1}}})}async function tn({p:n,productName:r,qty:i,staffName:a,isTender:o}){let s=o?`frozenPanLots`:`breadPanLots`,c=o?`frozenPanLogs`:`breadPanLogs`,l=h(g,s,n.receivedLotId),u=await t(l);if(!u.exists())return alert(`원본 lot을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`),!1;let d=u.data(),f=Number(d.remaining||0),_=Number(n.receivedFreezeQty||0),v=o?i-_:A(i-_);if(v===0)return alert(`변경된 수량이 없습니다.`),!1;let y=o?f+v:A(f+v);if(y<0){let e=A(Number(d.initialQty||0)-f);return alert(`이미 ${e}개가 사용되어 ${i}${o?`동결판`:`빵판`}으로 줄일 수 없습니다.`),!1}let b=new Date,x=e(g),S=h(p(g,c)),ee=o?Number(d.initialQty||0)+v:A(Number(d.initialQty||0)+v);x.update(l,{initialQty:ee,remaining:y,closed:o?y<=0:y<=.005,updatedAt:b});let w={type:`adjust`,date:C(),productName:d.productName||r,qty:v,before:f,after:y,lotId:n.receivedLotId,staffName:a,uid:null,note:null,reason:`제품입고 수정`,batchId:null,ledgerId:null,timestamp:b};return o||(w.lotDate=d.date,w.expectedFrozenQty=null,w.actualFrozenQty=null,w.diff=null),x.set(S,w),x.update(h(g,`productions`,n.id),{receivedFreezeQty:i,receivedAt:m(),updatedAt:m()}),await x.commit(),!0}async function nn({p:t,productName:n,qty:r,staffName:i}){let a=new Date,o=e(g),s=h(p(g,`breadPanLots`)),c=h(p(g,`breadPanLogs`));o.set(s,{productName:n,date:t.date,staffName:i,initialQty:r,remaining:r,closed:!1,note:null,createdAt:a,updatedAt:a}),o.set(c,{type:`incoming`,date:t.date,productName:n,qty:r,before:0,after:r,lotId:s.id,lotDate:t.date,expectedFrozenQty:null,actualFrozenQty:null,diff:null,staffName:i,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:a}),o.update(h(g,`productions`,t.id),{received:!0,receivedFreezeType:`breadPan`,receivedFreezeQty:r,receivedLotId:s.id,receivedAt:m(),updatedAt:m()}),await o.commit()}async function rn({p:t,productName:n,qty:r,staffName:i}){let a=new Date,o=e(g),s=h(p(g,`frozenPanLots`)),c=h(p(g,`frozenPanLogs`)),l=h(p(g,`stockLedger`));o.set(s,{productName:n,date:t.date,staffName:i,initialQty:r,remaining:r,closed:!1,source:`tenderIn`,sourceRefId:c.id,note:null,createdAt:a,updatedAt:a}),o.set(c,{type:`tenderIn`,date:t.date,productName:n,qty:r,before:0,after:r,lotId:s.id,staffName:i,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:a}),o.set(l,{actionType:`frozenPanTenderIn`,actionId:c.id,timestamp:a,date:t.date,status:`active`,items:[{collection:`frozenPanLots`,docId:s.id,field:`remaining`,delta:r,before:0,after:r,label:`${n} 동결판(텐더동결 입고)`,stockUpdatedAtSnapshot:a,isNewDoc:!0}]}),o.update(h(g,`productions`,t.id),{received:!0,receivedFreezeType:`frozenPan`,receivedFreezeQty:r,receivedLotId:s.id,receivedAt:m(),updatedAt:m()}),await o.commit()}function an(e,t){let n=t.find(e=>e.isProductionUnit);return n?n.name:F.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit)?.name||e.productionUnitName||`생산단위`}function on(e){if(e.productionUnitName)return e.productionUnitName;let t=F.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit);return t?.unitName||t?.weightDisplayUnit||``}function sn(e,t){if(t.weightDisplayUnit===`kg`||t.weightDisplayUnit===`g`)return t.weightDisplayUnit;let n=F.find(t=>t.id===e.recipeId),r=n?.ingredients?.find(e=>e.name===t.name&&(!t.meatTypeId||e.meatTypeId===t.meatTypeId))||n?.ingredients?.find(e=>e.name===t.name);return r?.weightDisplayUnit===`kg`||r?.weightDisplayUnit===`g`?r.weightDisplayUnit:t.meatTypeId?`kg`:`g`}function cn(e,t){return _e(Number(t.requiredQtyG||0),sn(e,t))}function ln(e,t){return sn(e,t)}function un(e,t=1){let n=Number(e||0);return Number.isInteger(n)?String(n):n.toLocaleString(`ko-KR`,{maximumFractionDigits:t})}function dn(e=N){let t=new Map;return e.forEach(e=>{(e.ingredientsSnapshot||[]).forEach(n=>{let r=n.name||``;if(r===`물`||r.includes(`노른자`))return;let i=r.trim();if(!i)return;let a=sn(e,n),o=Number(n.requiredQtyG||0),s=t.get(i);s?(s.totalG+=o,a===`kg`&&(s.unit=`kg`),!s.meatTypeId&&n.meatTypeId&&(s.meatTypeId=n.meatTypeId)):t.set(i,{name:n.name,totalG:o,unit:a,meatTypeId:n.meatTypeId||null})})}),t}function fn(e){let t=e=>e.meatTypeId&&Ee.get(e.meatTypeId)===`produce`?1:0;return[...e.values()].sort((e,n)=>t(e)-t(n)||n.totalG-e.totalG)}function pn(e=N,t=!1){if(e.length===0)return`<div style="color:#aaa;">${t?`불러온 생산 없음`:`오늘 생산 없음`}</div>`;let n=dn(e);return n.size===0?`<div style="color:#aaa;">원료 출고 없음</div>`:fn(n).map(e=>{let t=_e(e.totalG,e.unit);return`
    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f5f5f5;">
      <span>${e.name}</span>
      <span style="font-weight:600;">${t} ${e.unit}</span>
    </div>
  `}).join(``)}function mn(){if(!G.length)return``;let e=G.filter(e=>e.kind===`due`),t=e.filter(e=>e.overdue).length,n=G.filter(e=>e.kind===`low`).length,r=[t?`교체 지남 ${t}`:``,e.length-t?`교체 임박 ${e.length-t}`:``,n?`재고 부족 ${n}`:``].filter(Boolean).join(` · `),i=e[0]||G[0];return`
      <div class="alert-card ${t?`alert-card-blocker`:`alert-card-warning`}">
        <span class="alert-card-label">🔧 설비 부품 확인 필요 — ${r} (${J(D(i.part))} 등)</span>
        <button class="alert-card-jump" data-jump="equipment">처리하러 가기 →</button>
      </div>
  `}function hn(){if(!G.length)return;let e=`equipmentPopupShown_${C()}`;try{if(sessionStorage.getItem(e))return;sessionStorage.setItem(e,`1`)}catch{}let t=document.getElementById(`equipmentAlertPopup`);t&&t.remove();let n=G.slice(0,12).map(e=>{let t=e.part,n=e.kind===`low`?`<span class="eq-pill eq-pill-amber">재고 ${Number(t.currentQty||0)}</span>`:`<span class="eq-pill ${e.overdue?`eq-pill-red`:`eq-pill-amber`}">${J(ce(e.dday))}</span>`,r=e.kind===`low`?` <span style="color:#888;">(최소 ${Number(t.minimumQty||0)})</span>`:``;return`<div>${n}${J(D(t))}${r}</div>`}).join(``),r=G.length>12?`<div style="color:#888;font-size:12px;">외 ${G.length-12}건</div>`:``;document.body.insertAdjacentHTML(`beforeend`,`
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
  `);let i=document.getElementById(`equipmentAlertPopup`);document.getElementById(`equipmentPopupClose`).addEventListener(`click`,()=>i.remove()),document.getElementById(`equipmentPopupGo`).addEventListener(`click`,()=>{i.remove(),re(`equipment`),de()})}async function gn(e){let n;try{n=await Zt()}catch(e){alert(e.message);return}let r=C(),i=e||r,a=i!==r,o=a?Ae:P,s=a?je:R;if(o.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(s?.status===`completed`){alert(`내일생산불러오기는 하루 1회만 가능합니다.`);return}let c=await _n(i,o);if(c.length>0){vn(c);return}let l=await t(h(g,`staffGroups`,`lead`)),u=l.exists()&&l.data().members||[];$(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      ${a?`※ ${i} 소급 실행입니다. 해당일에 했어야 할 차감을 지금 수행합니다.<br>`:``}
      다음 영업일(${O(i)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
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
  `),document.getElementById(`btnConfirmLoad`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}let t=document.getElementById(`btnConfirmLoad`);if(!t.disabled){t.disabled=!0;try{await n();let t=await _n(i,o);if(t.length){vn(t);return}closeModal(),await yn(i,e,o)}catch(e){alert(e.message)}finally{t.disabled=!1}}})}async function _n(e,n=P){let i=[];De.items.forEach(e=>{e.jumpMenu===`schedule`?i.push({kind:`schedule`,text:`📦 ${e.reason||e.label}`,jumpMenu:`schedule`}):e.jumpMenu===`egg`?i.push({kind:`egg`,text:`🥚 ${e.reason||e.label}`,jumpMenu:`egg`}):e.label===`제품입고 미완료`&&i.push({kind:`productTransfer`,text:`📦 ${e.reason||e.label}`,jumpMenu:`main`})});let o={},s={};for(let e of n){(e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(o[e.meatTypeId]||(o[e.meatTypeId]={neededG:0,name:e.name}),o[e.meatTypeId].neededG+=e.requiredQtyG)});let n=F.find(t=>t.id===e.recipeId);if(n?.category===`raw`&&n.bagTypeId){let r=e.rawBoxQty||0;(await t(h(g,`bagTypes`,n.bagTypeId))).exists()&&(s[n.bagTypeId]=(s[n.bagTypeId]||0)+r*20)}}for(let[e,n]of Object.entries(s)){let r=await t(h(g,`bagTypes`,e));if(!r.exists())continue;let a=r.data(),o=a.currentQty||0;o<n&&i.push({kind:`bag`,text:`🛍️ ${a.name||``} 봉투 재고 부족 — 필요 ${n}장 / 현재 ${o}장`,jumpMenu:`bag`})}let c={},l=Object.entries(o).filter(([,e])=>!e.name).map(([e])=>e);await Promise.all(l.map(async e=>{try{let n=await t(h(g,`meatTypes`,e));n.exists()?c[e]=n.data().name||e:c[e]=e}catch{c[e]=e}}));for(let[e,{neededG:t,name:n}]of Object.entries(o)){let r=I.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),a=I.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),o=I.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),s=r+a+o;if(s<t){let l=I.find(t=>t.meatTypeId===e)?.meatNameSnapshot||n||c[e]||e;i.push({kind:`meat`,text:`🥩 ${l} 원료 재고 부족 — 필요 ${(t/1e3).toFixed(1)}kg / 현재 ${(s/1e3).toFixed(1)}kg (재포장 ${(r/1e3).toFixed(1)} + 전처리 ${(a/1e3).toFixed(1)} + 냉동창고 ${(o/1e3).toFixed(1)})`,jumpMenu:`meat`})}}let u=(await d(r(p(g,`activityLogs`),a(`date`,`==`,e),a(`action`,`==`,`autoRepack`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>(e.subAction===`trigger`||e.subAction===`diff`)&&e.acknowledged!==!0);return u.length>0&&i.push({kind:`autoRepack`,text:`🔄 자동 재포장 확인 미완료 ${u.length}건`,jumpMenu:`main`}),i}function vn(e){$(`
    <h3 class="modal-title">내일생산불러오기를 진행할 수 없습니다</h3>
    <p style="font-size:12px;color:#666;margin-bottom:12px;">
      아래 항목을 확인해주세요.
    </p>
    <div class="tload-blocker-list">
      ${e.map((e,t)=>`
      <div class="tload-blocker-row">
        <span class="tload-blocker-num">${[`①`,`②`,`③`,`④`,`⑤`,`⑥`,`⑦`,`⑧`,`⑨`,`⑩`][t]||`${t+1}.`}</span>
        <span class="tload-blocker-text">${J(e.text)}</span>
        <button class="tload-blocker-jump" data-jump="${e.jumpMenu}">처리하러 →</button>
      </div>
    `).join(``)}
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">확인</button>
    </div>
  `),document.querySelectorAll(`.tload-blocker-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;closeModal(),re(t),de()})})}async function yn(e,n,r=P){let i=O(e);try{let a={},s={};for(let e of r){let n=F.find(t=>t.id===e.recipeId);if(n&&((e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(a[e.meatTypeId]=(a[e.meatTypeId]||0)+e.requiredQtyG)}),n.category===`raw`&&n.bagTypeId)){let r=e.rawBoxQty||0;(await t(h(g,`bagTypes`,n.bagTypeId))).exists()&&(s[n.bagTypeId]=(s[n.bagTypeId]||0)+r*20)}}for(let[e,n]of Object.entries(s)){let r=await t(h(g,`bagTypes`,e));if(r.exists()){let e=r.data().currentQty||0;if(e<n){alert(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${r.data().name||``} 봉투: 현재 ${e}장 / 필요 ${n}장`);return}}}for(let[e,t]of Object.entries(a)){let n=I.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),r=I.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)).reduce((e,t)=>e+t.remaining,0),i=I.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),a=n+r+i;if(a<t){let o=I.find(t=>t.meatTypeId===e)?.meatNameSnapshot||e;alert(`${o} 재고가 부족하여 내일 생산을 불러올 수 없습니다.\n\n필요량: ${(t/1e3).toFixed(1)}kg\n현재 합계: ${(a/1e3).toFixed(1)}kg\n  - 재포장: ${(n/1e3).toFixed(1)}kg\n  - 전처리: ${(r/1e3).toFixed(1)}kg\n  - 냉동창고: ${(i/1e3).toFixed(1)}kg`);return}}let u=[],d=`productionCompletion:${e}`;for(let[t,r]of Object.entries(a)){let i=r,a=I.filter(e=>e.meatTypeId===t&&e.stage===`repacked`&&e.remaining>0).sort((e,t)=>(e.repackedDate||``).localeCompare(t.repackedDate||``));for(let r of a){if(i<=0)break;let a=Math.min(r.remaining,i),s=r.remaining-a;await o(h(g,`meatStocks`,r.id),{remaining:s,closed:s<=0,updatedAt:new Date}),u.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:-a,before:r.remaining,after:s,label:`${r.meatNameSnapshot} 재포장`,stockUpdatedAtSnapshot:new Date}),await j({type:`productionDeduct`,date:e,meatTypeId:t,meatNameSnapshot:r.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:-a,before:r.remaining,after:s,staff:n,reason:`내일생산불러오기 차감`,batchId:d}),i-=a}if(i>0){let r=I.filter(e=>e.meatTypeId===t&&e.stage===`processed`&&e.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``));for(let a of r){if(i<=0)break;let r=a.unitWeightG||1,s=Math.min(a.remaining,Math.ceil(i/r)*r),l=a.remaining-s;await o(h(g,`meatStocks`,a.id),{remaining:l,closed:l<=0,updatedAt:new Date}),u.push({collection:`meatStocks`,docId:a.id,field:`remaining`,delta:-s,before:a.remaining,after:l,label:`${a.meatNameSnapshot} 전처리`,stockUpdatedAtSnapshot:new Date}),await j({type:`productionDeduct`,date:e,meatTypeId:t,meatNameSnapshot:a.meatNameSnapshot,stage:`processed`,meatStockId:a.id,delta:-s,before:a.remaining,after:l,staff:n,reason:`내일생산불러오기 차감`,batchId:d});let f=s-i;if(f>0){let r=I.find(e=>e.meatTypeId===t&&e.stage===`repacked`&&e.remaining>0);if(r){let i=r.remaining+f;await o(h(g,`meatStocks`,r.id),{remaining:i,closed:!1,updatedAt:new Date}),u.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:f,before:r.remaining,after:i,label:`${a.meatNameSnapshot} 재포장 자동입고`,stockUpdatedAtSnapshot:new Date}),await j({type:`repackedIn`,date:e,meatTypeId:t,meatNameSnapshot:a.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:f,before:r.remaining,after:i,staff:n,reason:`생산 자동 재포장 (기존 lot 합산)`,batchId:d}),await me({action:`autoRepack`,subAction:`trigger`,date:e,staff:`시스템`,message:`🔄 생산 자동 재포장 — ${a.meatNameSnapshot} ${(f/1e3).toFixed(2)}kg (전처리 ${a.unitWeightG}g 단위 차감 후 잔여, 기존 재포장 lot 합산)`,details:{meatTypeId:t,meatName:a.meatNameSnapshot,surplusG:f,processedUnitWeightG:a.unitWeightG,processedStockId:a.id,repackedStockId:r.id,mode:`merged`,batchId:d}}),r.remaining=i}else{let r=await c(p(g,`meatStocks`),{meatTypeId:t,meatNameSnapshot:a.meatNameSnapshot,stage:`repacked`,incomingDate:e,repackedDate:e,unitWeightG:null,unitCount:null,initialQtyG:f,remaining:f,batchId:d,staffName:n,note:`생산 자동 재포장`,closed:!1,createdAt:new Date,updatedAt:new Date});u.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:f,before:0,after:f,label:`${a.meatNameSnapshot} 재포장 자동신규`,stockUpdatedAtSnapshot:new Date,isNewDoc:!0}),await j({type:`repackedIn`,date:e,meatTypeId:t,meatNameSnapshot:a.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:f,before:0,after:f,staff:n,reason:`생산 자동 재포장 (신규 lot)`,batchId:d}),await me({action:`autoRepack`,subAction:`trigger`,date:e,staff:`시스템`,message:`🔄 생산 자동 재포장 — ${a.meatNameSnapshot} ${(f/1e3).toFixed(2)}kg (전처리 ${a.unitWeightG}g 단위 차감 후 잔여, 신규 재포장 lot)`,details:{meatTypeId:t,meatName:a.meatNameSnapshot,surplusG:f,processedUnitWeightG:a.unitWeightG,processedStockId:a.id,repackedStockId:r.id,mode:`newLot`,batchId:d}}),I.push({id:r.id,meatTypeId:t,meatNameSnapshot:a.meatNameSnapshot,stage:`repacked`,remaining:f,unitWeightG:null})}}i-=s}}if(i>0){let r=I.filter(e=>e.meatTypeId===t&&e.stage===`frozen`&&e.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``));for(let a of r){if(i<=0)break;let r=Math.min(a.remaining,i),s=a.remaining-r;await o(h(g,`meatStocks`,a.id),{remaining:s,closed:s<=0,updatedAt:new Date}),u.push({collection:`meatStocks`,docId:a.id,field:`remaining`,delta:-r,before:a.remaining,after:s,label:`${a.meatNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:new Date}),await j({type:`productionDeduct`,date:e,meatTypeId:t,meatNameSnapshot:a.meatNameSnapshot,stage:`frozen`,meatStockId:a.id,delta:-r,before:a.remaining,after:s,staff:n,reason:`내일생산불러오기 차감`,batchId:d}),i-=r}}}for(let[r,i]of Object.entries(s)){let a=await t(h(g,`bagTypes`,r));if(a.exists()){let t=a.data().currentQty||0,s=t-i;await o(h(g,`bagTypes`,r),{currentQty:s,updatedAt:new Date}),u.push({collection:`bagTypes`,docId:r,field:`currentQty`,delta:-i,before:t,after:s,label:`${a.data().name} 봉투`,stockUpdatedAtSnapshot:new Date}),await c(p(g,`bagLogs`),{date:e,timestamp:new Date,bagTypeId:r,bagNameSnapshot:a.data().name,type:`autoDeduct`,qty:-i,before:t,after:s,staffName:n,note:`내일생산불러오기 자동차감`})}}let f=await c(p(g,`stockLedger`),{actionType:`productionCompletion`,actionId:e,timestamp:new Date,runDate:e,status:`active`,items:u});await l(h(g,`productionCompletion`,e),{runDate:e,targetProductionDate:i,status:`completed`,idempotencyKey:`productionCompletion:${e}`,staffName:n,ledgerId:f.id,completedAt:new Date});for(let e of r)await o(h(g,`productions`,e.id),{lockedByCompletion:!0});await K(),q(),alert(`내일생산불러오기 완료!`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function bn(){let e;try{e=await Zt()}catch(e){alert(e.message);return}if(!await E({title:`내일생산불러오기 취소`,message:`내일생산불러오기를 취소하시겠습니까?
차감된 재고가 복원됩니다.`,confirmText:`취소`,danger:!0}))return;let n=await ie({title:`내일생산불러오기 취소`,message:`재고가 전부 롤백되고 마감 차단 항목이 다시 활성화됩니다.`,label:`취소 사유`,placeholder:`예: 생산 일정 변경`,required:!0,multiline:!0});if(n===null||!n)return;let r=C();try{await e()}catch(e){alert(e.message);return}let i=R?.staffName||`unknown`,a=`productionCompletion:${R?.runDate||r}`;try{if(R?.ledgerId){let e=await t(h(g,`stockLedger`,R.ledgerId));if(e.exists()){let s=e.data().items||[];for(let e of s){let s=await t(h(g,e.collection,e.docId));if(!s.exists())continue;let c=s.data()[e.field];if(!(c!==e.after&&!await E({title:`재고 변동 감지`,message:`내일생산불러오기 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n내일생산불러오기 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))){if(e.isNewDoc){let t=c-e.delta;await o(h(g,e.collection,e.docId),{[e.field]:t,closed:!0,updatedAt:new Date})}else await o(h(g,e.collection,e.docId),{[e.field]:c-e.delta,closed:!1,updatedAt:new Date});if(e.collection===`meatStocks`){let t=s.data();await j({type:`productionRollback`,date:r,meatTypeId:t.meatTypeId||null,meatNameSnapshot:t.meatNameSnapshot||``,stage:t.stage||`frozen`,meatStockId:e.docId,delta:-e.delta,before:c,after:c-e.delta,staff:i,reason:`내일생산불러오기 취소 - ${n}`,batchId:a})}}}await o(h(g,`stockLedger`,R.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}R?.id&&await o(h(g,`productionCompletion`,R.id),{status:`cancelled`,cancelReason:n,cancelledAt:new Date});for(let e of P)await o(h(g,`productions`,e.id),{lockedByCompletion:!1});await K(),q(),alert(`취소 완료! 재고가 복원되었습니다.`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function xn(){let e;try{e=await Zt([`admin`,`office`])}catch(e){alert(e.message);return}if(y!==`admin`&&y!==`office`){alert(`새로고침은 대표/사무실 계정만 가능합니다.`);return}if(R?.status!==`completed`){alert(`마감 상태에서만 새로고침이 가능합니다.`);return}if(P.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(!await E({title:`내일생산불러오기 새로고침`,message:`기존 차감을 롤백하고 변경된 다음 영업일 생산 기준으로 다시 차감합니다.
진행하시겠습니까?`,confirmText:`진행`,danger:!1}))return;let n=await ie({title:`내일생산불러오기 새로고침`,message:`롤백 후 차단 항목이 다시 검사됩니다.`,label:`새로고침 사유`,placeholder:`예: 다음 영업일 생산 추가`,required:!0,multiline:!0});if(n===null||!n)return;let r=C();try{await e()}catch(e){alert(e.message);return}let i=R?.staffName||`unknown`,a=`productionCompletion:${R?.runDate||r}`;try{if(R?.ledgerId){let e=await t(h(g,`stockLedger`,R.ledgerId));if(e.exists()){let s=e.data().items||[];for(let e of s){let s=await t(h(g,e.collection,e.docId));if(!s.exists())continue;let c=s.data()[e.field];if(!(c!==e.after&&!await E({title:`재고 변동 감지`,message:`이전 마감 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n마감 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))){if(e.isNewDoc){let t=c-e.delta;await o(h(g,e.collection,e.docId),{[e.field]:t,closed:!0,updatedAt:new Date})}else await o(h(g,e.collection,e.docId),{[e.field]:c-e.delta,closed:!1,updatedAt:new Date});if(e.collection===`meatStocks`){let t=s.data();await j({type:`productionRollback`,date:r,meatTypeId:t.meatTypeId||null,meatNameSnapshot:t.meatNameSnapshot||``,stage:t.stage||`frozen`,meatStockId:e.docId,delta:-e.delta,before:c,after:c-e.delta,staff:i,reason:`새로고침 롤백 - ${n}`,batchId:a})}}}await o(h(g,`stockLedger`,R.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}R?.id&&await o(h(g,`productionCompletion`,R.id),{status:`cancelled`,cancelReason:`새로고침: ${n}`,cancelledAt:new Date});for(let e of P)await o(h(g,`productions`,e.id),{lockedByCompletion:!1});await K();let e=await _n(r);if(e.length>0){q(),alert(`롤백은 완료됐습니다.
차단 항목이 발견되어 재차감을 진행할 수 없습니다.
차단 항목 처리 후 [내일생산불러오기] 버튼으로 다시 진행해주세요.`),vn(e);return}let s=await t(h(g,`staffGroups`,`lead`)),c=s.exists()&&s.data().members||[];$(`
      <h3 class="modal-title">새로고침 — 담당자 선택</h3>
      <p style="font-size:12px;color:#888;margin-bottom:16px;">
        롤백 완료. 다음 영업일(${O(r)}) 생산 기준으로 재차감합니다.
      </p>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_refresh_staff">
          <option value="">선택</option>
          ${c.map(e=>`<option value="${e.name}">${e.name}</option>`).join(``)}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal()">취소 (마감 안 된 상태로 유지)</button>
        <button class="btn-primary" id="btnConfirmRefresh">재차감 진행</button>
      </div>
    `),document.getElementById(`btnConfirmRefresh`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_refresh_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}closeModal(),await yn(r,e);try{await me({action:`closing`,subAction:`refresh`,date:r,staff:e,message:`🔄 내일생산불러오기 새로고침 — 사유: ${n} / 담당: ${e} (이전 담당: ${i})`,details:{previousStaff:i,newStaff:e,reason:n,runDate:O(r)}}),await X(),Dt()}catch(e){console.warn(`[6E-3] 새로고침 활동 로그 발행 실패:`,e)}})}catch(e){console.error(`[6E-3] 새로고침 실패:`,e),alert(`오류가 발생했습니다: `+e.message),await K(),q()}}function Sn(){H=null,U=[],W=null,q()}function Cn(){let e=R?.status===`completed`,t=H!==null,n=!t&&z!==null,r=t?U:n?ke:e?P:N;$(`
    <h3 class="modal-title">${t?`${H} 생산 현황`:n?`${z} 생산 현황`:e?`${O(C())} 불러온 생산`:`${C()} 생산 현황`}</h3>
    <div class="main-production-grid big-view">
      ${r.length===0?`<p style="color:#aaa">생산 없음</p>`:r.map(e=>qt(e)).join(``)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`),r=e.includes(`main-production-grid big-view`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box ${r?`modal-wide`:``}">${e}</div>`,document.body.appendChild(n)}_(`main`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{Be as assertAutomaticAlertsReady,Le as renderMain};