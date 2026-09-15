import{T as e,_ as t,a as n,b as r,c as i,d as a,f as o,g as s,h as c,m as l,n as u,p as d,r as f,s as p,u as m,v as h,y as g}from"./index.esm-rHmxwfvm.js";import{n as _}from"./firebase-qGjqjNvO.js";import{a as v}from"./formDraft-DoA-Ia7D.js";import{A as y,C as b,D as x,E as S,F as ee,G as C,H as w,I as T,K as E,L as D,M as te,O as ne,P as re,R as ie,S as ae,T as oe,U as O,b as se,d as ce,f as k,l as le,m as ue,o as de,p as fe,t as pe,v as me,w as A,x as j,y as he,z as ge}from"./index-C3J_bQqC.js";import{n as _e,t as ve}from"./activityLogs-CRxSouBf.js";import{t as ye}from"./closingGuard-Cs6mxhOl.js";import{t as be}from"./pageRefresh-33o9kkfx.js";import{t as M}from"./meatLogs-DqUudnNK.js";import{i as N,r as xe}from"./number-DTi70YXs.js";import{findActionableClosingDate as Se,getAllBlockingItems as Ce}from"./closingChecks-DUVNHogb.js";function we({today:e,nextBizDay:t,overdueNextBizDay:n,allProds:r,recipeRows:i,meatTypeRows:a,meatRows:o,eggStock:s,equipmentAlerts:c,completionDoc:l,overdueCompletionDoc:u,overdueClosing:d,blocks:f,calendar:p,logs:m}){let h=d?.date||null,g=e=>e?r.filter(t=>t.date===e&&t.status!==`deleted`):[];return{productions:g(e),nextProductions:g(t),recipes:i,meatTypeRows:a,meatStocks:o.filter(e=>!e.closed),eggStock:s,equipmentAlerts:c,completionDoc:l,overdueCompletionDoc:u,blockingData:f,overdueClosingDate:h,overdueClosingAlreadyClosed:!!d?.closed,overdueProductions:g(h),overdueNextProductions:g(n),...p,combinedLogs:m}}function Te(e){return typeof e!=`object`||!e||typeof e.toMillis==`function`?e:e instanceof Date?new Date(e.getTime()):Array.isArray(e)?e.map(Te):Object.fromEntries(Object.entries(e).map(([e,t])=>[e,Te(t)]))}function Ee(){let e=new Map;return{run(t,n){if(!e.has(t)){let r=Promise.resolve().then(n);e.set(t,r),r.finally(()=>{e.get(t)===r&&e.delete(t)}).catch(()=>{})}return e.get(t)},clear(){e.clear()}}}function De(e){return typeof e!=`object`||!e?e:typeof e.toMillis==`function`?{$timestampMillis:e.toMillis()}:e instanceof Date?{$timestampMillis:e.getTime()}:Array.isArray(e)?e.map(De):Object.fromEntries(Object.keys(e).sort().map(t=>[t,De(e[t])]))}var Oe=e=>JSON.stringify(De(e));function ke(e,t){return typeof e!=`object`||!e?e:Object.keys(e).length===1&&Number.isFinite(e.$timestampMillis)?t(e.$timestampMillis):Array.isArray(e)?e.map(e=>ke(e,t)):Object.fromEntries(Object.entries(e).map(([e,n])=>[e,ke(n,t)]))}var Ae=[`productions`,`nextProductions`,`overdueProductions`,`overdueNextProductions`,`calendarProductions`,`recipes`,`meatTypeRows`,`meatStocks`,`equipmentAlerts`,`calendarSchedules`,`calendarEvents`,`combinedLogs`];async function je(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(Oe(e)));return Array.from(new Uint8Array(t),e=>e.toString(16).padStart(2,`0`)).join(``)}function Me(e,{date:t,logicVersion:n,allowShadow:r=!1}){return!!e&&e.schemaVersion===1&&!!n&&e.logicVersion===n&&e.date===t&&(e.readModelMode===`serve`||r&&e.readModelMode===`shadow`)&&e.rebuildState===`ready`&&Number.isSafeInteger(e.generation)&&e.generation>0&&typeof e.buildId==`string`&&e.requestedGeneration===e.generation&&Array.isArray(e.chunks)&&e.chunks.length<=100&&!!e.model}async function Ne(e,t,n){let r={...e.model},i=new Set,a=new Map;for(let e of Ae)if(!Array.isArray(r[e]))throw Error(`summary-missing-section`);for(let n of e.chunks){if(!Ae.includes(n.section)||typeof n.id!=`string`||n.id.includes(`/`)||n.id!==`${e.generation}__${e.buildId}__${n.section}__${n.index}`||i.has(n.id)||n.index!==(a.get(n.section)||0))throw Error(`summary-invalid-manifest`);i.add(n.id),a.set(n.section,n.index+1);let o=await t(n.id);if(!o||o.schemaVersion!==1||o.logicVersion!==e.logicVersion||o.buildId!==e.buildId||o.generation!==e.generation||o.section!==n.section||o.index!==n.index||!Array.isArray(o.payload)||o.payload.length!==n.rowCount||await je(o.payload)!==n.payloadHash)throw Error(`summary-invalid-chunk`);r[n.section]=[...r[n.section],...o.payload]}if(await je(r)!==e.modelHash)throw Error(`summary-invalid-model`);return ke(r,n)}function Pe(){return S.viewMode===`summary`&&!x()&&!0}var Fe=new WeakMap;async function Ie(e){let t=Fe.get(e);if(!t||t.epoch!==w.epoch)return!1;let n=await he.getDoc(r(_,`productionDashboardViews`,`v1__`+t.date),`main-summary`),i=n.exists()?n.data():null;return t.epoch===w.epoch&&Me(i,{date:t.date,logicVersion:`ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`})&&i.generation===t.generation&&i.buildId===t.buildId&&i.controlRevision===t.controlRevision}async function Le(e){if(!Pe())return null;let t=w.epoch;try{let i=await he.getDoc(r(_,`productionDashboardViews`,`v1__`+e),`main-summary`);if(t!==w.epoch)return null;let a=i.exists()?i.data():null;if(!Me(a,{date:e,logicVersion:`ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`}))return null;let o=await Ne(a,async t=>{let i=await n(r(_,`productionDashboardViews`,`v1__`+e,`chunks`,t));return i.exists()?i.data():null},e=>h.fromMillis(e)),s=await he.getDoc(r(_,`productionDashboardViews`,`v1__`+e),`main-summary`),c=s.exists()?s.data():null;return!Me(c,{date:e,logicVersion:`ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`})||c.generation!==a.generation||c.buildId!==a.buildId||c.controlRevision!==a.controlRevision?null:(Fe.set(o,{epoch:t,date:e,generation:a.generation,buildId:a.buildId,controlRevision:a.controlRevision}),t===w.epoch?o:null)}catch(e){if(e.code===`permission-denied`)throw e;return console.warn(`[메인 요약 대체]`,e.code||e.message),null}}function Re(t){let n=new Set(t.map(e=>e.id)),i=new Map;return{pendingIds:()=>[...i.keys()],enqueue({action:e,subAction:t,date:r,message:a,details:o,dedupKey:s}){let c=`auto_${`${e}_${t}_${r}_${s}`.replace(/[^\w-]/g,`_`)}`;n.has(c)||i.set(c,{action:e,subAction:t,date:r,staff:`시스템`,uid:null,message:a,details:{...o||{},dedupKey:s,autoTriggered:!0},read:!1,acknowledged:!1,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null})},async flush(){let t=[...i.entries()],n={createdIds:[],existingIds:[],failedIds:[]},a=0;return await Promise.all(Array.from({length:Math.min(4,t.length)},async()=>{for(;a<t.length;){let[i,s]=t[a++];try{let t=r(_,`activityLogs`,i);n[await o(_,async n=>{let r=await n.get(t);return r.exists()||n.set(t,{...s,timestamp:e()}),!r.exists()})?`createdIds`:`existingIds`].push(i)}catch(e){n.failedIds.push(i),console.error(`[자동 알림 생성 실패]`,i,e)}}})),n}}}var P=ue(`main`),ze=null,Be=Ee(),Ve,F=!0;w.onClear(()=>{F=!0,Be.clear(),clearTimeout(Ve)});var He=[],I=[],L=[],R=[],Ue=new Map,z={currentQty:0,minimumQty:0},B=null,We={totalBlocked:0,items:[]},V=null,Ge=!1,Ke=[],qe=[],Je=null,Ye=[],H=[],Xe=[],U=0,W=null,G=[],K=null;function Ze(e){return e?.category===`freezeDry`&&e.requiresSeparation===!1}function Qe(e){let t=[`<span>${e.freezeDryBagQty||0}봉</span>`];return Ze(e)||t.push(`<span>${e.breadPanQty||0}빵판</span>`),t.push(`<span>${e.freezePanQty||0}동결판</span>`),t.join(``)}var $e=[],q=[];async function et({scope:e=oe()}={}){if(P.prepare)return Gn();let t=ne(`main`);t&&(e=me(`main`));let n=document.getElementById(`mainContent`);n.innerHTML=`<div style="padding:24px;"><p>메인 로딩 중...</p></div>`,W=null,G=[],K=null;let r=t&&!F&&w.peek(`main:model`);if(r)it(r.model);else if(!await J(e))return;if(t){let e=({error:e}={})=>{if(F=!0,clearTimeout(Ve),e){e.code===`permission-denied`?(w.clear(),n.innerHTML=`<p>접근 권한을 다시 확인하려면 새로고침해주세요.</p>`):tt(n);return}Ve=setTimeout(async()=>{if(!(O!==`main`||document.getElementById(`mainContent`)!==n)&&!(document.querySelector(`.modal-overlay`)||W))try{await J(me(`main`))&&Y()}catch(e){e.code===`permission-denied`?(w.clear(),n.replaceChildren()):(console.error(`[메인 갱신 실패]`,e),tt(n))}},120)};he.onChange(`main`,e),he.onChange(`main-summary`,e);let t=new MutationObserver(()=>{F&&!document.querySelector(`.modal-overlay`)&&e()});t.observe(document.body,{childList:!0}),b(()=>{t.disconnect(),clearTimeout(Ve)})}O!==`main`||document.getElementById(`mainContent`)!==n||(Y(),Pn())}function tt(e){if(!e.isConnected||e.querySelector(`[data-refresh-error]`))return;let t=document.createElement(`div`);t.dataset.refreshError=`true`,t.textContent=`최신 정보를 확인하지 못했습니다. 표시된 내용은 이전 자료입니다. `;let n=document.createElement(`button`);n.className=`btn-secondary`,n.textContent=`다시 불러오기`,n.addEventListener(`click`,()=>{F=!0,pe()}),t.appendChild(n),e.prepend(t)}var nt=0;async function rt(){let e=A(),t=D(),[n,i,o]=await Promise.all([e.getDocs(a(g(_,`activityLogs`),s(`date`,`==`,t))),e.getDoc(r(_,`eggStock`,`global`)),le(t,e)]),c=Re(n.docs.map(e=>({id:e.id,...e.data()})));if(await dn(t,c,e,{eggStock:i.exists()?i.data():{},equipmentAlerts:o}),c.pendingIds().length)throw Error(`새 자동 알림을 확인해야 합니다. 메인을 다시 불러온 후 처리해주세요.`)}async function J(e=A(),{autoLogsEnabled:t=!0}={}){P.prepare&&P.invalidate();let n=++nt,i=document.getElementById(`mainContent`),o=()=>n===nt&&i===document.getElementById(`mainContent`),c=D();if(await y(e),e.displayOwner===`main`&&U===0&&Pe()){let n=await Le(c);if(!o())return!1;if(n){let[i,l,u]=await Promise.all([e.getDocs(a(g(_,`activityLogs`),s(`date`,`==`,c))),e.getDoc(r(_,`eggStock`,`global`)),le(c,e)]),d=Re(i.docs.map(e=>({id:e.id,...e.data()}))),f=t?await Be.run(`main:`+c,async()=>(await dn(c,d,e,{eggStock:l.exists()?l.data():{},equipmentAlerts:u}),o()?d.flush():{createdIds:[],existingIds:[],failedIds:[]})):{createdIds:[],existingIds:[],failedIds:[]};if(!o())return!1;if(f.failedIds.length)throw Error(`일부 자동 알림을 저장하지 못했습니다. 다시 불러와주세요.`);return f.createdIds.length||f.existingIds.length||!await Ie(n)?J(A(),{autoLogsEnabled:!1}):o()?(it(n),F=!1,w.publish(`main:model`,{model:n}),!0):!1}}let l=At(e);l.catch(()=>{}),e.getDocs(a(g(_,`events`),s(`date`,`==`,c))).catch(()=>{}),e.getDocs(a(g(_,`schedules`),s(`date`,`==`,c))).catch(()=>{}),e.getDocs(a(g(_,`supplementTypes`),s(`active`,`==`,!0))).catch(()=>{}),e.getDocs(g(_,`supplementStock`)).catch(()=>{});let u=T(c),[d,f,p,h,v,b,x,S,ee]=await Promise.all([e.getDocs(a(g(_,`productions`),m(`sortOrder`))),e.getDocs(g(_,`recipes`)),e.getDocs(g(_,`meatTypes`)),e.getDocs(g(_,`meatStocks`)),e.getDoc(r(_,`eggStock`,`global`)),e.getDoc(r(_,`productionCompletion`,c)),Se(c,null,e),ct(U,e),e.once(`equipmentAlerts:`+c,()=>le(c,e))]);if(!o())return!1;let C=d.docs.map(e=>({id:e.id,...e.data()})),E=x?.date||null,[te,re]=await Promise.all([E?e.getDoc(r(_,`productionCompletion`,E)):null,x?.blockingData||Ce(c,e)]);if(!o())return!1;let ie={eggStock:v.exists()?v.data():{currentQty:0,minimumQty:0},equipmentAlerts:ee},ae=Re((await e.getDocs(a(g(_,`activityLogs`),s(`date`,`==`,c)))).docs.map(e=>({id:e.id,...e.data()})));if(!o())return!1;let oe=t?await Be.run(`main:`+c,async()=>(await dn(c,ae,e,ie),o()?ae.flush():{createdIds:[],existingIds:[],failedIds:[]})):{createdIds:[],existingIds:[],failedIds:[]};if(oe.failedIds.length)throw Error(`일부 자동 알림을 저장하지 못했습니다. 다시 불러와주세요.`);let O=await l;if((oe.createdIds.length||oe.existingIds.length)&&(O=[...(await A().getDocs(a(g(_,`activityLogs`),s(`date`,`==`,c)))).docs.map(e=>({id:e.id,...e.data()})),...O.filter(e=>e.date!==c)].sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0))),!o())return!1;let se=e=>e.docs.map(e=>({id:e.id,...e.data()})),ce=e=>e?.exists()?{id:e.id,...e.data()}:null,k=we({today:c,nextBizDay:u,overdueNextBizDay:E?T(E):null,allProds:C,recipeRows:se(f),meatTypeRows:se(p),meatRows:se(h),eggStock:ie.eggStock,equipmentAlerts:ee,completionDoc:ce(b),overdueCompletionDoc:ce(te),overdueClosing:x,blocks:re,calendar:S,logs:O});return it(k),F=!1,ne(`main`)&&w.publish(`main:model`,{model:k}),!0}function it(e,{detached:t=!1}={}){let n=t?e:Te(e);({productions:He,nextProductions:I,recipes:L,meatStocks:R,eggStock:z,completionDoc:B,blockingData:We,overdueClosingDate:V,overdueClosingAlreadyClosed:Ge,overdueProductions:Ke,overdueNextProductions:qe,overdueCompletionDoc:Je,calendarSchedules:Ye,calendarProductions:H,calendarEvents:Xe,combinedLogs:$e,equipmentAlerts:q}=n),Ue=new Map(n.meatTypeRows.map(e=>[e.id,e.category===`produce`?`produce`:`meat`]))}function Y(){if(O!==`main`)return;let e=document.getElementById(`mainContent`),t=D(),n=T(t),r=B?.status===`completed`,i=C===`admin`||C===`office`,a=W!==null,o=!a&&V!==null,s=a&&K?K:We,c=Ge?`마감 후 미처리 확인 필요`:`미마감 처리 필요`,l=a?G:o?Ke:r?I:He,u=a?`${W} 생산 (선택 날짜)`:o?`${V} 생산 (${c})`:r?`불러온 다음 영업일 생산 (${n})`:`오늘 생산`,d=a?`🥩 ${W} 출고원료`:o?`🥩 ${V} 출고원료`:`🥩 금일 출고원료`,f=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],p=a?W:o?V:r?n:t,m=new Date(p+`T00:00:00`),h=`${m.getMonth()+1}/${m.getDate()} (${f[m.getDay()]})`;e.innerHTML=`
    ${at()}
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
              `:o?Je?.status===`completed`?`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;opacity:0.5;cursor:not-allowed;" disabled title="이미 처리되었습니다">이미 처리됨</button>`:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${qe.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기 (${V} 소급)</button>`:r?`
                  ${i?`<button class="btn-secondary" id="btnRefreshCompletion" style="font-size:11px;padding:3px 10px;color:#3182ce;" title="롤백 후 변경된 생산 기준으로 재차감">새로고침</button>`:``}
                  <button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>
                `:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${I.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기</button>`}
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${u}</span>
            ${r&&!a&&!o?`<span class="main-completed-pill">내일생산불러오기 완료</span>`:``}
          </div>
          <div class="main-production-grid">
            ${l.length===0?`<div class="main-empty">${a?`선택한 날짜에 생산 없음`:o?`처리 필요 날짜에 생산 없음`:r?`불러온 다음 영업일 생산 없음`:`오늘 생산 없음`}</div>`:l.map(e=>pn(e)).join(``)}
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
            ${Mn(l,r&&!a)}
          </div>
        </div>

        <!-- 3번 화면 = 차단 영역 + 생산 로그 + 사무 로그 -->
        <div class="main-panel-3">
          ${jt(s)}
          <div class="main-log-columns">
            ${Mt(`production`)}
            ${Mt(`office`)}
          </div>
        </div>
      </div>

      <!-- [묶음 6B-1] 우하단 = 4번 캘린더 -->
      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">📆 2주 캘린더</span>
        </div>
        <div class="main-calendar-body">
          ${lt()}
        </div>
      </div>
    </div>
  `,document.getElementById(`btnBigView`)?.addEventListener(`click`,Hn),document.getElementById(`btnTodayReceiptSummary`)?.addEventListener(`click`,()=>hn(l,p)),document.getElementById(`btnTomorrowLoad`)?.addEventListener(`click`,()=>Fn(o?V:void 0)),document.getElementById(`btnCancelCompletion`)?.addEventListener(`click`,zn),document.getElementById(`btnRefreshCompletion`)?.addEventListener(`click`,Bn),document.getElementById(`btnBackToToday`)?.addEventListener(`click`,Vn),(C===`admin`||C===`office`||C===`production`)&&(o||a||!r)&&document.querySelectorAll(`.main-production-card.receivable`).forEach(e=>{e.style.cursor=`pointer`,e.title=`클릭하여 제품 입고`,e.addEventListener(`click`,()=>{[...G,...Ke,...He,...I].find(t=>t.id===e.dataset.id)?.category===`freezeDry`?bn(e.dataset.id):vn(e.dataset.id)})}),document.querySelectorAll(`.alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;E(t),pe()})}),ft(),zt()}function at(){if(C===`production`)return``;let e=te(D());return e?`
    <div class="holiday-data-notice holiday-data-notice--${e.level}">
      ${e.message}
    </div>
  `:``}function ot(e=0){let t=new Date(D()+`T00:00:00`),n=(t.getDay()+6)%7,r=new Date(t);r.setDate(r.getDate()-n+e*7);let i=[];for(let e=0;e<14;e++){let t=new Date(r);t.setDate(t.getDate()+e);let n=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,`0`),o=String(t.getDate()).padStart(2,`0`);i.push(`${n}-${a}-${o}`)}return{dates:i,startDate:i[0],endDate:i[13]}}async function st(e=0){let t=await ct(e);({calendarSchedules:Ye,calendarProductions:H,calendarEvents:Xe}=t)}async function ct(e=0,t=oe()){let{startDate:n,endDate:r}=ot(e),i=e=>a(g(_,e),s(`date`,`>=`,n),s(`date`,`<=`,r)),[o,c,l]=await Promise.all([t.getDocs(i(`schedules`)),t.getDocs(i(`productions`)),t.getDocs(i(`events`)).catch(e=>(e.code!==`cache-miss`&&console.warn(`[캘린더] events 컬렉션 로드 실패:`,e.message),null))]);return{calendarSchedules:o.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status===`scheduled`),calendarProductions:c.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status!==`deleted`),calendarEvents:l?l.docs.map(e=>({id:e.id,...e.data()})):[]}}function lt(){let{dates:e}=ot(U),t=D(),n=ee(),r=re();return`
    <div class="cal-container">
      <div class="cal-toolbar">
        <button class="cal-nav-btn" id="btnCalPrev" title="이전 주">◀</button>
        <span class="cal-range-label">${mt(e[0],e[13])}</span>
        <button class="cal-nav-btn" id="btnCalNext" title="다음 주">▶</button>
        ${U===0?``:`<button class="cal-today-btn" id="btnCalToday">오늘로</button>`}
      </div>
      <div class="cal-weekday-row">
        ${[`월`,`화`,`수`,`목`,`금`,`토`,`일`].map((e,t)=>`<div class="cal-weekday ${t>=5?`cal-weekday-weekend`:``}">${e}</div>`).join(``)}
      </div>
      <div class="cal-grid">
        ${e.map(e=>ut(e,t,n,r)).join(``)}
      </div>
    </div>
  `}function ut(e,t,n,r){let i=(new Date(e+`T00:00:00`).getDay()+6)%7>=5,a=r[e]||null,o=r[dt(e,1)]||null,s=!i&&a?.affectsProduction!==!0&&(a?.affectsShipping===!0||o?.affectsShipping===!0&&o.shippingClosedFromEnabled===!0),c=!s&&(i||a?.affectsProduction===!0||!a&&n.includes(e)),l=e===t,u=Xe.filter(t=>t.date===e),d=Ye.filter(t=>t.date===e),f=H.filter(t=>t.date===e),p=[];u.forEach(e=>{let t=e.title||``;p.push(`<div class="cal-tag cal-tag-event" title="${X(t)}">📌 ${X(t)}</div>`)}),d.forEach(e=>{let t=ht(e);p.push(`<div class="cal-tag cal-tag-schedule" title="${X(t)}">📦 ${X(t)}</div>`)}),f.slice(0,3).forEach(e=>{let t=e.productionUnitQty==null?``:` ${kn(e.productionUnitQty)}${Tn(e)}`,n=`${e.recipeName||``}${t}`;p.push(`<div class="cal-tag cal-tag-production" title="${X(n)}">🏭 ${X(n)}</div>`)}),f.length>3&&p.push(`<div class="cal-tag-more">+${f.length-3}</div>`);let m=e.split(`-`),h=parseInt(m[2],10),g=h===1?`${parseInt(m[1],10)}/${h}`:String(h),_=s?`배송불가일`:``;return`
    <div class="${[`cal-cell`,c?`cal-cell-holiday`:``,s?`cal-cell-shipping-closed`:``,l?`cal-cell-today`:``].filter(Boolean).join(` `)}" data-date="${e}">
      <div class="cal-cell-date-row">
        <span class="cal-cell-date">${g}</span>
        ${_?`<span class="cal-shipping-closed-label">(${_})</span>`:``}
      </div>
      <div class="cal-cell-tags">${p.join(``)}</div>
    </div>
  `}function dt(e,t){let n=new Date(e+`T00:00:00`);return n.setDate(n.getDate()+t),`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,`0`)}-${String(n.getDate()).padStart(2,`0`)}`}function ft(){document.getElementById(`btnCalPrev`)?.addEventListener(`click`,()=>{--U,pt()}),document.getElementById(`btnCalNext`)?.addEventListener(`click`,()=>{U+=1,pt()}),document.getElementById(`btnCalToday`)?.addEventListener(`click`,()=>{U=0,pt()}),document.querySelectorAll(`.cal-cell`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date;t&&gt(t)})})}async function pt(){await st(U);let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=lt(),ft())}function mt(e,t){let n=e.split(`-`),r=t.split(`-`);return`${parseInt(n[1])}/${parseInt(n[2])} ~ ${parseInt(r[1])}/${parseInt(r[2])}`}function ht(e){let t=e.itemNameSnapshot||``,n=e.orderedQty==null?``:e.orderedQty,r=e.orderedUnit||``;return e.type===`egg`?`계란 ${n}${r}`:e.type===`meat`?`${t||`원육`} ${n}${r}`:e.type===`bag`?`${t||`봉투`} ${n}${r}`:`${t} ${n}${r}`}function gt(e){let t=C===`admin`||C===`office`,n=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],r=new Date(e+`T00:00:00`),i=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${n[r.getDay()]})`,a=ee(),o=r.getDay(),s=o===0||o===6,c=a.includes(e),l=s||c?`<span class="cal-modal-holiday-pill">휴일</span>`:``,u=Xe.filter(t=>t.date===e),d=Ye.filter(t=>t.date===e),f=H.filter(t=>t.date===e),p=u.length===0?`<div class="cal-modal-empty">등록된 이벤트 없음</div>`:u.map(e=>`
        <div class="cal-modal-list-item cal-event-item" data-event-id="${e.id}">
          <div class="cal-event-row">
            <span class="cal-event-title">📌 ${X(e.title||``)}</span>
            ${t?`
              <span class="cal-event-actions">
                <button class="cal-event-btn" data-event-act="edit" data-event-id="${e.id}">수정</button>
                <button class="cal-event-btn cal-event-btn-danger" data-event-act="delete" data-event-id="${e.id}">삭제</button>
              </span>
            `:``}
          </div>
          ${e.content?`<div class="cal-modal-list-sub">${X(e.content)}</div>`:``}
        </div>
      `).join(``),m=d.length===0?`<div class="cal-modal-empty">예정 없음</div>`:d.map(e=>`<div class="cal-modal-list-item">📦 ${X(ht(e))}</div>`).join(``),h=f.length===0?`<div class="cal-modal-empty">생산 없음</div>`:f.map(e=>{let t=e.batchNo?` <span style="color:#888;">(${e.batchNo}차)</span>`:e.round>1?` <span style="color:#888;">(${e.round}회차)</span>`:``;return`<div class="cal-modal-list-item">🏭 ${X(e.recipeName||``)}${t}</div>`}).join(``),g;g=s?`<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;">
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
  `),document.getElementById(`btnAddEvent`)?.addEventListener(`click`,()=>{vt(e,null)}),document.querySelectorAll(`[data-event-act]`).forEach(t=>{t.addEventListener(`click`,async n=>{let r=t.dataset.eventAct,i=t.dataset.eventId;r===`edit`?vt(e,i):r===`delete`&&await bt(i,e)})}),document.getElementById(`chkManualHoliday`)?.addEventListener(`change`,async t=>{await xt(e,t.target.checked)}),document.getElementById(`btnViewThisDate`)?.addEventListener(`click`,async()=>{if(V&&e>V){alert(`${V} 처리가 아직 끝나지 않았습니다.\n먼저 해당 날짜를 처리한 뒤 다음 날짜를 확인하세요.`),W=null,G=[],K=null,closeModal(),Y();return}W=e,G=H.filter(t=>t.date===e),K=await Ce(e),closeModal(),Y()})}function X(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function _t(e){return Number(e||0).toLocaleString(`ko-KR`)}async function vt(e,t){let n;try{n=await j({refs:t?[`events/`+t]:[`holidays/`+e],roles:[`admin`,`office`]})}catch(e){alert(e.message);return}let r=!!t,i=r?n.values[0]:null;if(r&&!i){alert(`삭제된 이벤트입니다. 다시 불러와주세요.`);return}let a=i?.title||``,o=i?.content||``,s=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],c=new Date(e+`T00:00:00`),l=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${s[c.getDay()]})`;$(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${r?`이벤트 수정`:`이벤트 등록`} — ${l}</h3>

    <div style="margin-bottom:10px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">제목 (필수)</label>
      <input type="text" id="evTitle" maxlength="50" value="${X(a)}"
             style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">내용 (선택)</label>
      <textarea id="evContent" rows="3" maxlength="300"
                style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;resize:vertical;">${X(o)}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      ${r?`<button class="btn-secondary" id="btnEvDelete" style="color:#c92a2a;border-color:#ffc9c9;">삭제</button>`:``}
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnEvSave">${r?`저장`:`등록`}</button>
    </div>
  `),setTimeout(()=>document.getElementById(`evTitle`)?.focus(),50),document.getElementById(`btnEvSave`)?.addEventListener(`click`,async()=>{let r=document.getElementById(`evTitle`).value.trim(),i=document.getElementById(`evContent`).value.trim();if(!r){alert(`제목을 입력해주세요.`);return}let a=document.getElementById(`btnEvSave`);a.disabled=!0;try{await n.submit(()=>yt({id:t,date:e,title:r,content:i}))}catch(e){alert(e.message)}finally{a.disabled=!1}}),r&&document.getElementById(`btnEvDelete`)?.addEventListener(`click`,async()=>{await k({title:`이벤트 삭제`,message:`"${a}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`})&&await bt(t,e)})}async function yt({id:t,date:n,title:i,content:a}){try{t?await c(r(_,`events`,t),{title:i,content:a||``,updatedAt:e()}):await u(g(_,`events`),{date:n,title:i,content:a||``,createdAt:e()}),closeModal(),await st(U),St(),gt(n)}catch(e){console.error(`[6B-2] 이벤트 저장 실패:`,e),alert(`저장 중 오류가 발생했습니다.`)}}async function bt(e,t){let n;try{n=await j({refs:[`events/`+e],roles:[`admin`,`office`]})}catch(e){alert(e.message);return}let i=n.values[0];if(i&&await k({title:`이벤트 삭제`,message:`"${i.title||`(제목 없음)`}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`}))try{await n.confirm(),await f(r(_,`events`,e)),closeModal(),await st(U),St(),gt(t)}catch(e){console.error(`[6B-2] 이벤트 삭제 실패:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}async function xt(t,n){try{await(await j({refs:[`holidays/`+t],roles:[`admin`,`office`]})).confirm(),n?await d(r(_,`holidays`,t),{date:t,holidayType:`internalOff`,title:`수동 휴일`,label:`수동 휴일`,affectsProduction:!0,affectsShipping:!0,shippingClosedFromEnabled:!0,isAutoGenerated:!1,status:`active`,createdAt:e(),updatedAt:e()}):await d(r(_,`holidays`,t),{date:t,status:`deleted`,updatedAt:e(),deletedAt:e()},{merge:!0}),await ge(),St()}catch(e){console.error(`[6B-2] 휴일 토글 실패:`,e),alert(`휴일 설정 중 오류가 발생했습니다.`)}}function St(){let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=lt(),ft())}var Ct=[`bag`,`egg`,`meat`,`frozenProduct`,`frozenSep`,`schedule`,`frozenPan`,`closing`,`supplementStock`,`recipe`,`settings`,`holiday`,`conversion`,`equipment`],wt=[`production`,`repackaging`,`pretreat`,`event`,`scheduleDue`,`autoRepack`,`minStock`,`frozenStockLow`,`partDue`],Tt={"meat:adjust":`production`},Et=new Set([`scheduleDue:trigger`,`autoRepack:trigger`,`autoRepack:diff`,`minStock:alert`,`frozenStockLow:alert`,`partDue:alert`,`schedule:completeDiff`,`closing:refresh`]);function Dt(e){let t=`${e.action}:${e.subAction}`;return Tt[t]?Tt[t]:wt.includes(e.action)?`production`:Ct.includes(e.action)?`office`:`ignore`}function Z(e){return Et.has(`${e.action}:${e.subAction}`)}function Ot(e){let t=new Date(new Date().getTime()-e*24*60*60*1e3);return new Date(t.getTime()+540*60*1e3).toISOString().split(`T`)[0]}async function kt(){$e=await At()}async function At(e=oe()){let t=D(),n=Ot(10),[r,i]=await Promise.all([e.getDocs(a(g(_,`activityLogs`),s(`date`,`==`,t))).catch(e=>{throw e.code!==`cache-miss`&&console.error(`[6C-1] 당일 로그 로드 실패:`,e),e}),e.getDocs(a(g(_,`activityLogs`),s(`date`,`>=`,n),s(`date`,`<`,t))).catch(e=>{throw e.code!==`cache-miss`&&console.error(`[6C-1] 과거 로그 로드 실패:`,e),e})]),o=r?r.docs.map(e=>({id:e.id,...e.data()})):[],c=i?i.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.acknowledged!==!0&&Z(e)):[];return[...o,...c].sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}function jt(e=We){let t=[];(e.items||[]).forEach(e=>{t.push(`
      <div class="alert-card alert-card-blocker">
        <span class="alert-card-label">⛔ ${e.reason||e.label}</span>
        <button class="alert-card-jump" data-jump="${e.jumpMenu}">처리하러 가기 →</button>
      </div>
    `)}),z.minimumQty>0&&z.currentQty<z.minimumQty&&t.push(`
      <div class="alert-card alert-card-warning">
        <span class="alert-card-label">⚠️ 계란 부족 (현재: ${z.currentQty}개 / 최소: ${z.minimumQty}개)</span>
        <button class="alert-card-jump" data-jump="egg">처리하러 가기 →</button>
      </div>
    `);let n=Nn();return n&&t.push(n),t.length===0?``:`
    <div class="log-blocker-area">
      ${t.join(``)}
    </div>
  `}function Mt(e){let t=e===`production`?`🏭 생산 로그`:`🗒️ 사무 로그`,n=$e.filter(t=>Dt(t)===e);n.sort((e,t)=>{let n=Z(e)&&e.acknowledged!==!0?1:0,r=Z(t)&&t.acknowledged!==!0?1:0;if(n!==r)return r-n;let i=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-i});let r=n.some(e=>e.acknowledged!==!0&&!Z(e)),i=n.length===0?`<div class="log-empty">${e===`production`?`오늘 생산 로그 없음`:`오늘 사무 로그 없음`}</div>`:n.map(e=>Nt(e)).join(``);return`
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
  `}function Nt(e){let t=e.acknowledged!==!0,n=Z(e),r=D(),i=ie(),a;if(e.date===r)a=Lt(e.timestamp);else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[1])}/${parseInt(t[2])}`:e.date||``}let o=[`log-row`,t?`log-row-unack`:``,n?`log-row-critical`:``].filter(Boolean).join(` `),s=t?`<button class="log-ack-btn" data-log-act="ack" data-log-id="${e.id}">확인</button>`:`<span class="log-ack-done" title="${e.acknowledgedBy||``} 확인">✓</span>`,c=n&&t?`<span class="log-critical-badge">⚠️</span>`:``,l=It(e);return`
    <div class="${o}">
      <span class="log-row-time">${a}</span>
      <span class="log-row-msg">${c}${X(l)}</span>
      <span class="log-row-action">${s}</span>
    </div>
  `}function Pt(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function Ft(e,t,n){if(t===`g`)return Pt(e);let r=`${e}${t}`;return t!==`마리`||!n?r:`${r} (${Pt(Number(e||0)*Number(n||0))})`}function It(e){if(e.action!==`schedule`||e.subAction!==`completeDiff`)return e.message||`(메시지 없음)`;let t=e.details||{};if(t.orderedQty==null||t.actualQty==null)return e.message||`(메시지 없음)`;let n=t.orderedUnit||t.unit||``,r=t.unit||n,i=Ft(t.orderedQty,n,t.orderedUnitGrams),a=Ft(t.actualQty,r,t.orderedUnitGrams),o=t.itemName||`입고 예정`,s=e.staff||``;return`${o} 입고 완료 ⚠️ 발주 ${i} → 실제 ${a}${s?` / 담당: ${s}`:``}`}function Lt(e){if(!e||!e.toMillis)return`—`;let t=new Date(e.toMillis()),n=new Date(t.getTime()+540*60*1e3);return`${String(n.getUTCHours()).padStart(2,`0`)}:${String(n.getUTCMinutes()).padStart(2,`0`)}`}function Rt(){return C===`admin`?`대표`:C===`office`?`사무실`:C===`production`?`생산실`:`운영자`}function zt(){document.querySelectorAll(`[data-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;await Bt(t)})}),document.querySelectorAll(`[data-log-act="ackAll"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logCat;await Wt(t)})}),document.querySelectorAll(`[data-log-act="all"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;Zt(t)})}),document.querySelectorAll(`[data-log-act="history"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;Qt(t)})})}async function Bt(e){try{let t=await j({refs:[`activityLogs/`+e]}),i=await n(r(_,`activityLogs`,e));if(!i.exists()){alert(`로그를 찾을 수 없습니다.`);return}let a={id:e,...i.data()};if(a.action===`autoRepack`&&a.subAction===`trigger`&&a.acknowledged!==!0){await Ht(e,a);return}await t.submit(()=>ve(e,Rt())),await kt(),Gt()}catch(e){console.error(`[6C-1] 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}}async function Vt(){let e=await n(r(_,`staffGroups`,`lead`));return(e.exists()&&e.data().members||[]).filter(e=>e&&e.active!==!1&&e.name).sort((e,t)=>(e.sortOrder||0)-(t.sortOrder||0)).map(e=>e.name)}async function Ht(e,t){let n=await j({refs:[`activityLogs/`+e,`meatStocks/`+t.details?.repackedStockId],roles:[`admin`,`production`]});if(t=n.values[0],!t||t.acknowledged===!0){alert(`이미 처리되었거나 삭제된 로그입니다.`);return}if(C===`office`){alert(`자동 재포장 확인은 생산실/대표 계정에서만 처리할 수 있습니다.`);return}let r=t.details||{},i=r.meatName||`?`,a=Number(r.surplusG)||0,o=Number(r.processedUnitWeightG)||0,s=r.repackedStockId,c=r.mode;if(!s||!o){alert(`자동 재포장 로그 데이터가 손상되어 처리할 수 없습니다. (운영자에게 문의)`);return}let l=a/o,u=Number.isInteger(l)?`${l}개`:`약 ${l.toFixed(2)}개`,d=await Vt();if(d.length===0){alert(`주임 그룹 담당자가 등록되어 있지 않습니다. 설정에서 추가해주세요.`);return}$(`
    <div style="padding:16px; min-width:440px; max-width:560px;">
      <h3 style="margin:0 0 12px;">자동 재포장 확인 — ${X(i)}</h3>
      <div style="background:#f5f5f5; padding:12px; border-radius:4px; margin-bottom:16px; line-height:1.7;">
        <div><b>시스템 자동 재포장 수량 (수정 불가)</b></div>
        <div style="font-size:15px; font-weight:600; color:#1f2937;">${_t(a)}g (${(a/1e3).toFixed(2)}kg)</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">
          단위중량 ${_t(o)}g 기준 ${u}<br>
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
          ${d.map(e=>`<option value="${X(e)}">${X(e)}</option>`).join(``)}
        </select>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="ar-cancel" style="padding:8px 16px; background:#e5e7eb; border:none; border-radius:4px; cursor:pointer;">취소</button>
        <button id="ar-confirm" style="padding:8px 16px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">확인</button>
      </div>
    </div>
  `);let f=document.getElementById(`ar-actual-count`),p=document.getElementById(`ar-actual-g`);f.addEventListener(`input`,()=>{let e=parseInt(f.value,10);if(isNaN(e)||e<0){p.textContent=`→ 개수 입력 시 환산 g 자동 표시`;return}let t=e*o,n=t-a,r=n===0?` (시스템과 동일)`:` (차이 ${n>0?`+`:``}${_t(n)}g)`;p.textContent=`→ ${_t(t)}g (${(t/1e3).toFixed(2)}kg)${r}`}),document.getElementById(`ar-cancel`).addEventListener(`click`,()=>{closeModal()}),document.getElementById(`ar-confirm`).addEventListener(`click`,async()=>{let r=parseInt(f.value,10),i=document.getElementById(`ar-staff`).value;if(!i){alert(`담당자를 선택해주세요.`);return}if(isNaN(r)||r<0){alert(`실제 수량은 0 이상의 정수여야 합니다.`);return}if(r===0&&!await k({title:`실제 재포장 수량 0개`,message:`실제 재포장 수량이 0개입니다.
자동 재포장 lot을 0g으로 만들고 마감 처리합니다.
진행할까요?`,confirmText:`진행`,cancelText:`취소`,danger:!0}))return;let s=document.getElementById(`ar-confirm`);s.disabled=!0;try{await n.submit(()=>Ut({logId:e,log:t,actualCount:r,surplusG:a,processedUnitWeightG:o,staffName:i})),closeModal()}catch(e){console.error(`[묶음 9 #9] 자동 재포장 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다: `+(e.message||e))}finally{s.disabled=!1}})}async function Ut({logId:e,log:t,actualCount:i,surplusG:a,processedUnitWeightG:o,staffName:s}){let l=t.details||{},u=l.repackedStockId,d=l.meatTypeId,f=l.meatName,p=D(),m=i*o,h=m-a;if(h===0){await ve(e,s),await kt(),Gt();return}let g=r(_,`meatStocks`,u),v=await n(g);if(!v.exists())throw Error(`자동 재포장 lot 문서를 찾을 수 없습니다.`);let y=v.data(),b=Number(y.remaining)||0,x=b+h;if(x<0)throw Error(`자동 재포장 lot 잔량이 음수가 됩니다 (현재 ${b}g, 보정 ${h}g).`);await c(g,{remaining:x,closed:i===0&&x===0,updatedAt:new Date}),await _e({action:`autoRepack`,subAction:`diff`,date:p,staff:s,message:`자동 재포장 차이 — ${f} 시스템 ${a}g / 실제 ${m}g (${h>0?`+`:``}${h}g) — 담당: ${s}`,details:{meatTypeId:d,meatName:f,repackedStockId:u,processedUnitWeightG:o,systemG:a,actualCount:i,actualG:m,diffG:h,sourceLogId:e}}),await ve(e,s),await kt(),Gt()}async function Wt(e){try{await kt()}catch(e){alert(e.message);return}let t=$e.filter(t=>Dt(t)===e&&t.acknowledged!==!0&&!Z(t));if(t.length!==0&&await k({title:`모두 확인`,message:`${e===`production`?`생산`:`사무`} 로그 ${t.length}건을 모두 확인 처리하시겠습니까?\n(확인 필수 항목은 제외됩니다)`,confirmText:`확인 처리`,cancelText:`취소`}))try{let e=await j({refs:t.map(e=>`activityLogs/`+e.id)}),n=Rt();await e.submit(e=>Promise.all(e.filter(e=>e&&e.acknowledged!==!0&&!Z(e)).map(e=>ve(e.id,n)))),await kt(),Gt()}catch(e){console.error(`[6C-1] 모두 확인 실패:`,e),alert(`일괄 확인 중 오류가 발생했습니다.`)}}function Gt(){let e=document.querySelector(`.main-panel-3`);e&&(e.innerHTML=`
    ${jt()}
    ${Mt(`production`)}
    ${Mt(`office`)}
  `,document.querySelectorAll(`.main-panel-3 .alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;E(t),pe()})}),zt())}var Q=[],Kt=null,qt=``,Jt=`all`,Yt=null,Xt=!1;async function Zt(e){Kt=e,Jt=`all`,qt=``,Q=[],await $t(),tn()}async function Qt(e){Kt=e,Jt=`history`,qt=``,Q=[],Yt=null,Xt=!1,await en(),tn()}async function $t(){let e=D(),t=Ot(10);try{Q=(await p(a(g(_,`activityLogs`),s(`date`,`>=`,t),s(`date`,`<=`,e)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>Dt(e)===Kt).sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}catch(e){console.error(`[6C-1B] 전체보기 로드 실패:`,e),alert(`전체보기 로드 실패: 관리자에게 문의해주세요.`)}}async function en(){if(!Xt)try{let e=[m(`timestamp`,`desc`),i(100)];Yt&&e.push(l(Yt));let t=await p(a(g(_,`activityLogs`),...e));t.docs.length<100&&(Xt=!0),t.docs.length>0&&(Yt=t.docs[t.docs.length-1]);let n=t.docs.map(e=>({id:e.id,...e.data()})).filter(e=>Dt(e)===Kt);Q=[...Q,...n]}catch(e){console.error(`[6C-1B] 히스토리 로드 실패:`,e),alert(`히스토리 로드 실패: 관리자에게 문의해주세요.`)}}function tn(){$(`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;">${Kt===`production`?`생산 로그`:`사무 로그`} — ${Jt===`all`?`전체보기 (10일)`:`히스토리 (전체)`}</h3>
      ${Jt===`all`?`<button class="btn-secondary" id="btnLogModalSwitch" style="font-size:11px;">히스토리로 전환 →</button>`:``}
    </div>

    <div style="margin-bottom:8px;">
      <input type="text" id="logModalSearch" placeholder="메시지 검색 (담당자명, 품목명 등)"
             style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:12px;box-sizing:border-box;"
             value="${X(qt)}">
    </div>

    <div id="logModalList" class="log-modal-list">
      ${an()}
    </div>

    <div id="logModalFooter" style="display:flex;gap:8px;justify-content:space-between;margin-top:12px;">
      <div>
        ${Jt===`history`&&!Xt?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
      </div>
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.getElementById(`logModalSearch`)?.addEventListener(`input`,e=>{qt=e.target.value,nn()}),document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await en(),nn(),rn()}),document.getElementById(`btnLogModalSwitch`)?.addEventListener(`click`,async()=>{Jt=`history`,qt=``,Q=[],Yt=null,Xt=!1,await en(),tn()}),sn()}function nn(){let e=document.getElementById(`logModalList`);e&&(e.innerHTML=an(),sn())}function rn(){let e=document.getElementById(`logModalFooter`);e&&(e.innerHTML=`
    <div>
      ${Jt===`history`&&!Xt?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
    </div>
    <button class="btn-secondary" onclick="closeModal()">닫기</button>
  `,document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await en(),nn(),rn()}))}function an(){let e=qt.trim().toLowerCase(),t=e?Q.filter(t=>(t.message||``).toLowerCase().includes(e)):Q;if(t.length===0)return`<div class="log-empty" style="padding:24px 8px;">${e?`검색 결과 없음`:`표시할 로그 없음`}</div>`;let n=null,r=[];return t.forEach(e=>{if(e.date!==n){n=e.date;let t=D(),i=ie(),a;if(e.date===t)a=`오늘`;else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[0])}.${parseInt(t[1])}.${parseInt(t[2])}`:e.date||``}r.push(`<div class="log-modal-date-header">${a}</div>`)}r.push(on(e))}),r.join(``)}function on(e){let t=e.acknowledged!==!0,n=Z(e),r=Lt(e.timestamp),i=[`log-modal-row`,t?`log-row-unack`:``,n?`log-row-critical`:``].filter(Boolean).join(` `),a=t?`<button class="log-ack-btn" data-modal-log-act="ack" data-log-id="${e.id}">확인</button>`:`<span class="log-ack-done" title="${e.acknowledgedBy||``} 확인">✓ ${X(e.acknowledgedBy||``)}</span>`;return`
    <div class="${i}">
      <span class="log-row-time">${r}</span>
      <span class="log-row-msg">${n&&t?`<span class="log-critical-badge">⚠️</span>`:``}${X(It(e))}</span>
      <span class="log-row-action">${a}</span>
    </div>
  `}function sn(){document.querySelectorAll(`[data-modal-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;try{let e=Q.find(e=>e.id===t);if(e&&e.action===`autoRepack`&&e.subAction===`trigger`&&e.acknowledged!==!0){await Ht(t,e);return}await ve(t,Rt()),e&&(e.acknowledged=!0,e.acknowledgedBy=Rt()),await kt(),Gt(),nn()}catch(e){console.error(`[6C-1B] 모달 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}})})}async function cn(e,t,n,r){try{let r=await n.getDocs(a(g(_,`events`),s(`date`,`==`,e)));for(let n of r.docs){let r={id:n.id,...n.data()};t.enqueue({action:`event`,subAction:`dueToday`,date:e,message:`📅 오늘 일정 — ${r.title||`(제목 없음)`}`,details:{eventId:r.id,title:r.title||``},dedupKey:`event:${r.id}`})}}catch(e){throw console.warn(`[6C-3] 이벤트 자동 발행 실패:`,e.message),e}}async function ln(e,t,n,r){try{let r=await n.getDocs(a(g(_,`schedules`),s(`date`,`==`,e)));for(let n of r.docs){let r={id:n.id,...n.data()};if(r.status!==`scheduled`)continue;let i=r.type===`egg`?`계란`:r.itemNameSnapshot||`(품목)`;t.enqueue({action:`scheduleDue`,subAction:`trigger`,date:e,message:`📦 입고 예정일 도래 — ${i} ${r.orderedQty}${r.orderedUnit}`,details:{scheduleId:r.id,type:r.type,itemName:r.itemNameSnapshot,orderedQty:r.orderedQty,orderedUnit:r.orderedUnit},dedupKey:`scheduleDue:${r.id}`})}}catch(e){throw console.error(`[6C-3] 입고 예정 자동 발행 실패:`,e),e}}async function un(e,t,n,r){try{r.eggStock.minimumQty>0&&r.eggStock.currentQty<r.eggStock.minimumQty&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ 계란 부족 — 현재 ${r.eggStock.currentQty}개 / 최소 ${r.eggStock.minimumQty}개`,details:{kind:`egg`,current:r.eggStock.currentQty,minimum:r.eggStock.minimumQty},dedupKey:`minStock:egg`});let i=await n.getDocs(g(_,`meatTypes`)),o=(await n.getDocs(g(_,`meatStocks`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed);for(let n of i.docs){let r={id:n.id,...n.data()};if(!r.minimumQtyG)continue;let i=o.filter(e=>e.meatTypeId===r.id).reduce((e,t)=>e+(t.remaining||0),0);i<r.minimumQtyG&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`원육`} 부족 — 현재 ${(i/1e3).toFixed(1)}kg / 최소 ${(r.minimumQtyG/1e3).toFixed(1)}kg`,details:{kind:`meat`,meatTypeId:r.id,name:r.name,current:i,minimum:r.minimumQtyG},dedupKey:`minStock:meat:${r.id}`})}let c=await n.getDocs(g(_,`bagTypes`));for(let n of c.docs){let r={id:n.id,...n.data()};r.minimumQty&&(r.currentQty||0)<r.minimumQty&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`봉투`} 부족 — 현재 ${r.currentQty||0}장 / 최소 ${r.minimumQty}장`,details:{kind:`bag`,bagTypeId:r.id,name:r.name,current:r.currentQty||0,minimum:r.minimumQty},dedupKey:`minStock:bag:${r.id}`})}let l=await n.getDocs(a(g(_,`supplementTypes`),s(`active`,`==`,!0))),u=await n.getDocs(g(_,`supplementStock`)),d=new Map(u.docs.map(e=>[e.id,{id:e.id,...e.data()}]));for(let n of l.docs){let r={id:n.id,...n.data()},i=d.get(r.id),a=i?Number(i.currentQty||0):0;a>=5||t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${r.name||`영양제`} 부족 — 현재 ${a}봉 / 최소 5봉`,details:{kind:`supplement`,supplementTypeId:r.id,name:r.name,current:a,minimum:5},dedupKey:`supplementMin:alert:${r.id}`})}}catch(e){throw console.error(`[6C-3] 최소재고 자동 발행 실패:`,e),e}}async function dn(e,t,n,r){await Promise.all([cn(e,t,n,r),ln(e,t,n,r),un(e,t,n,r),fn(e,t,n,r)])}async function fn(e,t,n,r){for(let n of r.equipmentAlerts){let r=n.part;n.kind===`due`?t.enqueue({action:`partDue`,subAction:`alert`,date:e,message:`🔧 ${ce(r)} 교체 ${n.overdue?`예정일 ${Math.abs(n.dday)}일 지남`:de(n.dday)} (예정 ${r.nextDueAt})`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,nextDueAt:r.nextDueAt,dday:n.dday},dedupKey:`partDue:${r.id}`}):n.kind===`low`&&t.enqueue({action:`minStock`,subAction:`alert`,date:e,message:`⚠️ ${ce(r)} 부품 부족 — 현재 ${Number(r.currentQty||0)}개 / 최소 ${Number(r.minimumQty||0)}개`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,current:Number(r.currentQty||0),minimum:Number(r.minimumQty||0)},dedupKey:`minStock:part:${r.id}`})}}function pn(e){let t=e.ingredientsSnapshot||[],n=wn(e,t),r=e.batchNo?` <span>${e.batchNo}차</span>`:e.round>1?` <span>${e.round}회차</span>`:``;return`
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
            <td>${kn(e.productionUnitQty)}</td>
            <td>${Tn(e)}</td>
          </tr>
          ${t.map(t=>`
            <tr>
              <td>${t.name}</td>
              <td>${Dn(e,t)}</td>
              <td>${On(e,t)}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${e.category===`raw`?`<span>${e.rawBoxQty||0}박스</span>`:``}
        ${e.category===`freezeDry`?Qe(e):``}
        ${e.received?mn(e):``}
      </div>
    </div>
  `}function mn(e){if(e.category===`freezeDry`){let t=e.receivedFreezeType===`breadPan`?`빵판`:`동결판`;return`<span class="main-received-badge">✅ 입고완료 ${e.receivedFreezeQty||0}${t}</span>`}return`<span class="main-received-badge">✅ 입고완료 ${e.receivedBox||0}박스${e.receivedRemainder?` +${e.receivedRemainder}낱개`:``}</span>`}function hn(e,t){let n=(e||[]).filter(e=>e.category===`raw`||e.category===`freezeDry`),r=0,i=0,a=0,o=0,s=n.length===0?`<div style="color:#aaa;text-align:center;padding:18px;">입고 대상 생산이 없습니다.</div>`:n.map(e=>{let t=`<span style="color:#c53030;">미입고</span>`;if(e.received)if(e.category===`raw`){let n=Number(e.receivedBox||0),a=Number(e.receivedRemainder||0);r+=n,i+=a,t=`${n}박스${a?` + ${a}낱개`:``}`}else{let n=Number(e.receivedFreezeQty||0);e.receivedFreezeType===`breadPan`?(a=N(a+n),t=`${n}빵판`):(o+=n,t=`${n}동결판`)}return`
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
  `)}async function gn(e){try{let t=await A().getDoc(r(_,`productions`,e));if(!t.exists())throw Error(`생산 자료가 삭제되었습니다.`);let n=t.data(),i=await j({refs:[`productions/`+e,`recipes/`+n.recipeId,`settings/systemValues`,`closings/`+n.date]}),[a,o,s]=i.values;if(!a||a.status===`deleted`||a.recipeId!==n.recipeId||a.date!==n.date)throw Error(`생산 정보가 변경되었습니다. 다시 열어주세요.`);return{action:i,p:a,recipe:o,sysVals:s||{}}}catch(e){return alert(e.message),null}}async function _n(e){let t=await j({roles:e});if(!await J(A(),{autoLogsEnabled:!1}))throw Error(`화면이 변경되었습니다.`);let n=()=>se({nextProductions:I,overdueNextProductions:qe,recipes:L,completionDoc:B,overdueCompletionDoc:Je,blockingData:We,meatStocks:R,eggStock:z}),r=n();return async()=>{if(await t.confirm(),!await J(A(),{autoLogsEnabled:!1}))throw Error(`화면이 변경되었습니다.`);if(n()!==r)throw Error(`생산·재고·마감 조건이 변경되었습니다. 입력을 확인하고 다시 시도해주세요.`)}}async function vn(n){let i=await gn(n);if(!i)return;let{action:a,p:o,recipe:s,sysVals:c}=i;if(!o||o.category!==`raw`)return;if(o.date>D()){alert(`미래 날짜의 제품 입고는 입력할 수 없습니다.`);return}if(await ye(o.date)||o.received&&!await k({title:`입고완료 수정`,message:`현재 입력: 판수 ${o.receivedPlates??`-`} / 낱개 ${o.receivedLoosePacks??0} → 총 ${o.receivedTotalPacks??`-`}팩 = ${o.receivedBox??`-`}박스 + ${o.receivedRemainder??0}낱개

입고완료 내용을 수정하시겠습니까?
저장하면 수정 이력이 재고앱으로 다시 전송됩니다.`,confirmText:`수정하기`}))return;let l=s?.target||o.target||``,u=Number(s?.packsPerPlate),d=Number.isFinite(u)&&u>0,f=l===`cat`?`packsPerPlateCat`:l===`dog`?`packsPerPlateDog`:null,p=d?u:Number(f?c[f]:NaN);if(!Number.isFinite(p)||p<=0){alert(`설정 > 시스템 설정값에서 ${l===`cat`?`고양이`:l===`dog`?`강아지`:`대상`} 판당 팩수를 먼저 등록해주세요.`);return}let m=Array.isArray(s?.productionMethods)?s.productionMethods.filter(e=>e&&e.methodKey&&e.active!==!1):[],h=m.length>0?m.map(e=>`<option value="${e.methodKey}" ${o.receivedMethod===e.methodKey?`selected`:``}>${e.label||e.methodKey}</option>`).join(``):`<option value="">방식 없음</option>`;document.getElementById(`productReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="productReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">제품 입고 — ${o.recipeName}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">판당 팩수 ${p}팩/판${d?` (레시피 지정)`:``} · 1박스 = 20팩</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">생산방식 (기록용)</label>
          <select id="pr_method" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">${h}</select>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">판수 *</label>
            <input type="number" id="pr_plates" min="0" step="1" value="${o.receivedPlates??``}" placeholder="판수" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">낱개(자투리 팩)</label>
            <input type="number" id="pr_loose" min="0" step="1" value="${o.receivedLoosePacks??0}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
        </div>
        <div id="pr_result" style="font-size:13px;color:#1a1a1a;background:#f5f7f5;border-radius:6px;padding:10px;margin-bottom:14px;">판수를 입력하세요.</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="pr_cancel">취소</button>
          <button class="btn-primary" id="pr_confirm">제품 입고</button>
        </div>
      </div>
    </div>
  `);let g=document.getElementById(`productReceiptModal`),v=document.getElementById(`pr_plates`),y=document.getElementById(`pr_loose`),b=document.getElementById(`pr_result`),x=()=>g?.remove();function S(){let e=parseInt(v.value,10),t=parseInt(y.value,10)||0;if(!Number.isInteger(e)||e<0||t<0)return b.textContent=`판수를 입력하세요.`,null;let n=e*p+t,r=Math.floor(n/10)/2,i=n%10;return b.innerHTML=`총 <b>${n}</b>팩 → <b>${r}</b>박스 + <b>${i}</b>낱개`,{plates:e,loose:t,totalPacks:n,boxes:r,remainder:i}}v.addEventListener(`input`,S),y.addEventListener(`input`,S),S(),document.getElementById(`pr_cancel`).addEventListener(`click`,x),document.getElementById(`pr_confirm`).addEventListener(`click`,async n=>{let i=S();if(!i){v.focus();return}let s=document.getElementById(`pr_method`).value||null,c=(o.receivedRevision||0)+1,u=n.currentTarget;if(!u.disabled){u.disabled=!0;try{if(await a.confirm(),await ye(o.date))return;let n=t(_);n.update(r(_,`productions`,o.id),{received:!0,receivedMethod:s,receivedPlates:i.plates,receivedLoosePacks:i.loose,receivedTotalPacks:i.totalPacks,receivedBox:i.boxes,receivedRemainder:i.remainder,receivedRevision:c,receivedAt:e(),updatedAt:e()});let u=`productions:${o.id}:${c}`;n.set(r(_,`productTransferRequests`,u),{idempotencyKey:u,sourceApp:`production`,sourceCollection:`productions`,sourceId:o.id,eventType:`productReceipt`,revision:c,supersedesRevision:c>1?c-1:null,status:`pending`,category:`raw`,recipeId:o.recipeId,recipeName:o.recipeName,target:l,plates:i.plates,packs:i.totalPacks,boxes:i.boxes,remainderPacks:i.remainder,producedDate:o.date,staff:o.staffName||``,createdAt:e()}),await n.commit(),x(),await J(),W&&(G=H.filter(e=>e.date===W),K=await Ce(W)),Y()}catch(e){console.error(`[receipt] save failed:`,e),alert(`제품 입고 저장 중 오류가 발생했습니다: `+(e.message||e))}finally{u.disabled=!1}}})}async function yn(e=[`senior`,`office`]){let t=[];for(let i of e){let e=await n(r(_,`staffGroups`,i));e.exists()&&(e.data().members||[]).forEach(e=>{e?.name&&t.push(`<option value="${e.name}">${e.name}</option>`)})}return t.join(``)}async function bn(e){let t=await gn(e);if(!t)return;let{action:n,p:r,recipe:i,sysVals:a}=t;if(!r||r.category!==`freezeDry`)return;if(r.date>D()){alert(`미래 날짜의 동결건조 입고는 입력할 수 없습니다.`);return}if(await ye(r.date))return;let o=i?.displayName||r.recipeName||i?.name||`동결건조`,s=r.received?r.receivedFreezeType===`frozenPan`:r.requiresSeparation===!1||i?.requiresSeparation===!1,c=s?`동결판`:`빵판`;if(r.received){if(!await k({title:`입고완료 수정`,message:`현재 입력된 수량: ${r.receivedFreezeQty??`-`}${c}\n\n입고완료 내용을 수정하시겠습니까?\n수정 차이만큼 ${c} 재고 lot을 조정합니다.`,confirmText:`수정하기`}))return;if(!r.receivedLotId){alert(`원본 lot을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`);return}}let l=s?Math.round(Number(r.received?r.receivedFreezeQty:r.freezePanQty||0)):N(Number(r.received?r.receivedFreezeQty:r.breadPanQty||0)),u=await yn([`senior`,`office`]);document.getElementById(`freezeDryReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
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
  `);let d=document.getElementById(`freezeDryReceiptModal`),f=()=>d?.remove();document.getElementById(`fd_cancel`).addEventListener(`click`,f),document.getElementById(`fd_confirm`).addEventListener(`click`,async()=>{let e=s?parseInt(document.getElementById(`fd_qty`).value,10):N(parseFloat(document.getElementById(`fd_qty`).value)||0),t=document.getElementById(`fd_staff`).value;if(!Number.isFinite(e)||e<=0){alert(`${c} 수량은 0보다 커야 합니다.`);return}if(!t){alert(`담당자를 선택해주세요.`);return}if(await ye(r.date))return;let i=document.getElementById(`fd_confirm`);if(!i.disabled){i.disabled=!0;try{if(await n.confirm(),r.received&&r.receivedLotId){if(!await xn({p:r,productName:o,qty:e,staffName:t,isTender:s}))return}else s?await Cn({p:r,productName:o,qty:e,staffName:t}):await Sn({p:r,productName:o,qty:e,staffName:t});f(),await J(),W&&(G=H.filter(e=>e.date===W),K=await Ce(W)),Y()}catch(e){console.error(`[freezeDryReceipt] save failed:`,e),alert(`동결건조 입고 저장 중 오류가 발생했습니다: `+(e.message||e))}finally{i.disabled=!1}}})}async function xn({p:i,productName:a,qty:o,staffName:s,isTender:c}){let l=c?`frozenPanLots`:`breadPanLots`,u=c?`frozenPanLogs`:`breadPanLogs`,d=r(_,l,i.receivedLotId),f=await n(d);if(!f.exists())return alert(`원본 lot을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`),!1;let p=f.data(),m=Number(p.remaining||0),h=Number(i.receivedFreezeQty||0),v=c?o-h:N(o-h);if(v===0)return alert(`변경된 수량이 없습니다.`),!1;let y=c?m+v:N(m+v);if(y<0){let e=N(Number(p.initialQty||0)-m);return alert(`이미 ${e}개가 사용되어 ${o}${c?`동결판`:`빵판`}으로 줄일 수 없습니다.`),!1}let b=new Date,x=t(_),S=r(g(_,u)),ee=c?Number(p.initialQty||0)+v:N(Number(p.initialQty||0)+v);x.update(d,{initialQty:ee,remaining:y,closed:c?y<=0:y<=.005,updatedAt:b});let C={type:`adjust`,date:D(),productName:p.productName||a,qty:v,before:m,after:y,lotId:i.receivedLotId,staffName:s,uid:null,note:null,reason:`제품입고 수정`,batchId:null,ledgerId:null,timestamp:b};return c||(C.lotDate=p.date,C.expectedFrozenQty=null,C.actualFrozenQty=null,C.diff=null),x.set(S,C),x.update(r(_,`productions`,i.id),{receivedFreezeQty:o,receivedAt:e(),updatedAt:e()}),await x.commit(),!0}async function Sn({p:n,productName:i,qty:a,staffName:o}){let s=new Date,c=t(_),l=r(g(_,`breadPanLots`)),u=r(g(_,`breadPanLogs`));c.set(l,{productName:i,date:n.date,staffName:o,initialQty:a,remaining:a,closed:!1,note:null,createdAt:s,updatedAt:s}),c.set(u,{type:`incoming`,date:n.date,productName:i,qty:a,before:0,after:a,lotId:l.id,lotDate:n.date,expectedFrozenQty:null,actualFrozenQty:null,diff:null,staffName:o,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:s}),c.update(r(_,`productions`,n.id),{received:!0,receivedFreezeType:`breadPan`,receivedFreezeQty:a,receivedLotId:l.id,receivedAt:e(),updatedAt:e()}),await c.commit()}async function Cn({p:n,productName:i,qty:a,staffName:o}){let s=new Date,c=t(_),l=r(g(_,`frozenPanLots`)),u=r(g(_,`frozenPanLogs`)),d=r(g(_,`stockLedger`));c.set(l,{productName:i,date:n.date,staffName:o,initialQty:a,remaining:a,closed:!1,source:`tenderIn`,sourceRefId:u.id,note:null,createdAt:s,updatedAt:s}),c.set(u,{type:`tenderIn`,date:n.date,productName:i,qty:a,before:0,after:a,lotId:l.id,staffName:o,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:s}),c.set(d,{actionType:`frozenPanTenderIn`,actionId:u.id,timestamp:s,date:n.date,status:`active`,items:[{collection:`frozenPanLots`,docId:l.id,field:`remaining`,delta:a,before:0,after:a,label:`${i} 동결판(텐더동결 입고)`,stockUpdatedAtSnapshot:s,isNewDoc:!0}]}),c.update(r(_,`productions`,n.id),{received:!0,receivedFreezeType:`frozenPan`,receivedFreezeQty:a,receivedLotId:l.id,receivedAt:e(),updatedAt:e()}),await c.commit()}function wn(e,t){let n=t.find(e=>e.isProductionUnit);return n?n.name:L.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit)?.name||e.productionUnitName||`생산단위`}function Tn(e){if(e.productionUnitName)return e.productionUnitName;let t=L.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit);return t?.unitName||t?.weightDisplayUnit||``}function En(e,t){if(t.weightDisplayUnit===`kg`||t.weightDisplayUnit===`g`)return t.weightDisplayUnit;let n=L.find(t=>t.id===e.recipeId),r=n?.ingredients?.find(e=>e.name===t.name&&(!t.meatTypeId||e.meatTypeId===t.meatTypeId))||n?.ingredients?.find(e=>e.name===t.name);return r?.weightDisplayUnit===`kg`||r?.weightDisplayUnit===`g`?r.weightDisplayUnit:t.meatTypeId?`kg`:`g`}function Dn(e,t){return xe(Number(t.requiredQtyG||0),En(e,t))}function On(e,t){return En(e,t)}function kn(e,t=1){let n=Number(e||0);return Number.isInteger(n)?String(n):n.toLocaleString(`ko-KR`,{maximumFractionDigits:t})}function An(e=He){let t=new Map;return e.forEach(e=>{(e.ingredientsSnapshot||[]).forEach(n=>{let r=n.name||``;if(r===`물`||r.includes(`노른자`))return;let i=r.trim();if(!i)return;let a=En(e,n),o=Number(n.requiredQtyG||0),s=t.get(i);s?(s.totalG+=o,a===`kg`&&(s.unit=`kg`),!s.meatTypeId&&n.meatTypeId&&(s.meatTypeId=n.meatTypeId)):t.set(i,{name:n.name,totalG:o,unit:a,meatTypeId:n.meatTypeId||null})})}),t}function jn(e){let t=e=>e.meatTypeId&&Ue.get(e.meatTypeId)===`produce`?1:0;return[...e.values()].sort((e,n)=>t(e)-t(n)||n.totalG-e.totalG)}function Mn(e=He,t=!1){if(e.length===0)return`<div style="color:#aaa;">${t?`불러온 생산 없음`:`오늘 생산 없음`}</div>`;let n=An(e);return n.size===0?`<div style="color:#aaa;">원료 출고 없음</div>`:jn(n).map(e=>{let t=xe(e.totalG,e.unit);return`
    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f5f5f5;">
      <span>${e.name}</span>
      <span style="font-weight:600;">${t} ${e.unit}</span>
    </div>
  `}).join(``)}function Nn(){if(!q.length)return``;let e=q.filter(e=>e.kind===`due`),t=e.filter(e=>e.overdue).length,n=q.filter(e=>e.kind===`low`).length,r=[t?`교체 지남 ${t}`:``,e.length-t?`교체 임박 ${e.length-t}`:``,n?`재고 부족 ${n}`:``].filter(Boolean).join(` · `),i=e[0]||q[0];return`
      <div class="alert-card ${t?`alert-card-blocker`:`alert-card-warning`}">
        <span class="alert-card-label">🔧 설비 부품 확인 필요 — ${r} (${X(ce(i.part))} 등)</span>
        <button class="alert-card-jump" data-jump="equipment">처리하러 가기 →</button>
      </div>
  `}function Pn(){if(!q.length)return;let e=`equipmentPopupShown_${D()}`;try{if(sessionStorage.getItem(e))return;sessionStorage.setItem(e,`1`)}catch{}let t=document.getElementById(`equipmentAlertPopup`);t&&t.remove();let n=q.slice(0,12).map(e=>{let t=e.part,n=e.kind===`low`?`<span class="eq-pill eq-pill-amber">재고 ${Number(t.currentQty||0)}</span>`:`<span class="eq-pill ${e.overdue?`eq-pill-red`:`eq-pill-amber`}">${X(de(e.dday))}</span>`,r=e.kind===`low`?` <span style="color:#888;">(최소 ${Number(t.minimumQty||0)})</span>`:``;return`<div>${n}${X(ce(t))}${r}</div>`}).join(``),r=q.length>12?`<div style="color:#888;font-size:12px;">외 ${q.length-12}건</div>`:``;document.body.insertAdjacentHTML(`beforeend`,`
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
  `);let i=document.getElementById(`equipmentAlertPopup`);document.getElementById(`equipmentPopupClose`).addEventListener(`click`,()=>i.remove()),document.getElementById(`equipmentPopupGo`).addEventListener(`click`,()=>{i.remove(),E(`equipment`),pe()})}async function Fn(e){let t;try{t=await _n()}catch(e){alert(e.message);return}let i=D(),a=e||i,o=a!==i,s=o?qe:I,c=o?Je:B;if(s.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(c?.status===`completed`){alert(`내일생산불러오기는 하루 1회만 가능합니다.`);return}let l=await In(a,s);if(l.length>0){Ln(l);return}let u=await n(r(_,`staffGroups`,`lead`)),d=u.exists()&&u.data().members||[];$(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      ${o?`※ ${a} 소급 실행입니다. 해당일에 했어야 할 차감을 지금 수행합니다.<br>`:``}
      다음 영업일(${T(a)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
    </p>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${d.map(e=>`<option value="${e.name}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnConfirmLoad">확인</button>
    </div>
  `),document.getElementById(`btnConfirmLoad`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}let n=document.getElementById(`btnConfirmLoad`);if(!n.disabled){n.disabled=!0;try{await t();let n=await In(a,s);if(n.length){Ln(n);return}closeModal(),await Rn(a,e,s)}catch(e){alert(e.message)}finally{n.disabled=!1}}})}async function In(e,t=I){let i=[];We.items.forEach(e=>{e.jumpMenu===`schedule`?i.push({kind:`schedule`,text:`📦 ${e.reason||e.label}`,jumpMenu:`schedule`}):e.jumpMenu===`egg`?i.push({kind:`egg`,text:`🥚 ${e.reason||e.label}`,jumpMenu:`egg`}):e.label===`제품입고 미완료`&&i.push({kind:`productTransfer`,text:`📦 ${e.reason||e.label}`,jumpMenu:`main`})});let o={},c={};for(let e of t){(e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(o[e.meatTypeId]||(o[e.meatTypeId]={neededG:0,name:e.name}),o[e.meatTypeId].neededG+=e.requiredQtyG)});let t=L.find(t=>t.id===e.recipeId);if(t?.category===`raw`&&t.bagTypeId){let i=e.rawBoxQty||0;(await n(r(_,`bagTypes`,t.bagTypeId))).exists()&&(c[t.bagTypeId]=(c[t.bagTypeId]||0)+i*20)}}for(let[e,t]of Object.entries(c)){let a=await n(r(_,`bagTypes`,e));if(!a.exists())continue;let o=a.data(),s=o.currentQty||0;s<t&&i.push({kind:`bag`,text:`🛍️ ${o.name||``} 봉투 재고 부족 — 필요 ${t}장 / 현재 ${s}장`,jumpMenu:`bag`})}let l={},u=Object.entries(o).filter(([,e])=>!e.name).map(([e])=>e);await Promise.all(u.map(async e=>{try{let t=await n(r(_,`meatTypes`,e));t.exists()?l[e]=t.data().name||e:l[e]=e}catch{l[e]=e}}));for(let[e,{neededG:t,name:n}]of Object.entries(o)){let r=R.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),a=R.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),o=R.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),s=r+a+o;if(s<t){let c=R.find(t=>t.meatTypeId===e)?.meatNameSnapshot||n||l[e]||e;i.push({kind:`meat`,text:`🥩 ${c} 원료 재고 부족 — 필요 ${(t/1e3).toFixed(1)}kg / 현재 ${(s/1e3).toFixed(1)}kg (재포장 ${(r/1e3).toFixed(1)} + 전처리 ${(a/1e3).toFixed(1)} + 냉동창고 ${(o/1e3).toFixed(1)})`,jumpMenu:`meat`})}}let d=(await p(a(g(_,`activityLogs`),s(`date`,`==`,e),s(`action`,`==`,`autoRepack`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>(e.subAction===`trigger`||e.subAction===`diff`)&&e.acknowledged!==!0);return d.length>0&&i.push({kind:`autoRepack`,text:`🔄 자동 재포장 확인 미완료 ${d.length}건`,jumpMenu:`main`}),i}function Ln(e){$(`
    <h3 class="modal-title">내일생산불러오기를 진행할 수 없습니다</h3>
    <p style="font-size:12px;color:#666;margin-bottom:12px;">
      아래 항목을 확인해주세요.
    </p>
    <div class="tload-blocker-list">
      ${e.map((e,t)=>`
      <div class="tload-blocker-row">
        <span class="tload-blocker-num">${[`①`,`②`,`③`,`④`,`⑤`,`⑥`,`⑦`,`⑧`,`⑨`,`⑩`][t]||`${t+1}.`}</span>
        <span class="tload-blocker-text">${X(e.text)}</span>
        <button class="tload-blocker-jump" data-jump="${e.jumpMenu}">처리하러 →</button>
      </div>
    `).join(``)}
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">확인</button>
    </div>
  `),document.querySelectorAll(`.tload-blocker-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;closeModal(),E(t),pe()})})}async function Rn(e,t,i=I){let a=T(e);try{let o={},s={};for(let e of i){let t=L.find(t=>t.id===e.recipeId);if(t&&((e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(o[e.meatTypeId]=(o[e.meatTypeId]||0)+e.requiredQtyG)}),t.category===`raw`&&t.bagTypeId)){let i=e.rawBoxQty||0;(await n(r(_,`bagTypes`,t.bagTypeId))).exists()&&(s[t.bagTypeId]=(s[t.bagTypeId]||0)+i*20)}}for(let[e,t]of Object.entries(s)){let i=await n(r(_,`bagTypes`,e));if(i.exists()){let e=i.data().currentQty||0;if(e<t){alert(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${i.data().name||``} 봉투: 현재 ${e}장 / 필요 ${t}장`);return}}}for(let[e,t]of Object.entries(o)){let n=R.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),r=R.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)).reduce((e,t)=>e+t.remaining,0),i=R.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),a=n+r+i;if(a<t){let o=R.find(t=>t.meatTypeId===e)?.meatNameSnapshot||e;alert(`${o} 재고가 부족하여 내일 생산을 불러올 수 없습니다.\n\n필요량: ${(t/1e3).toFixed(1)}kg\n현재 합계: ${(a/1e3).toFixed(1)}kg\n  - 재포장: ${(n/1e3).toFixed(1)}kg\n  - 전처리: ${(r/1e3).toFixed(1)}kg\n  - 냉동창고: ${(i/1e3).toFixed(1)}kg`);return}}let l=[],f=`productionCompletion:${e}`;for(let[n,i]of Object.entries(o)){let a=i,o=R.filter(e=>e.meatTypeId===n&&e.stage===`repacked`&&e.remaining>0).sort((e,t)=>(e.repackedDate||``).localeCompare(t.repackedDate||``));for(let i of o){if(a<=0)break;let o=Math.min(i.remaining,a),s=i.remaining-o;await c(r(_,`meatStocks`,i.id),{remaining:s,closed:s<=0,updatedAt:new Date}),l.push({collection:`meatStocks`,docId:i.id,field:`remaining`,delta:-o,before:i.remaining,after:s,label:`${i.meatNameSnapshot} 재포장`,stockUpdatedAtSnapshot:new Date}),await M({type:`productionDeduct`,date:e,meatTypeId:n,meatNameSnapshot:i.meatNameSnapshot,stage:`repacked`,meatStockId:i.id,delta:-o,before:i.remaining,after:s,staff:t,reason:`내일생산불러오기 차감`,batchId:f}),a-=o}if(a>0){let i=R.filter(e=>e.meatTypeId===n&&e.stage===`processed`&&e.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``));for(let o of i){if(a<=0)break;let i=o.unitWeightG||1,s=Math.min(o.remaining,Math.ceil(a/i)*i),d=o.remaining-s;await c(r(_,`meatStocks`,o.id),{remaining:d,closed:d<=0,updatedAt:new Date}),l.push({collection:`meatStocks`,docId:o.id,field:`remaining`,delta:-s,before:o.remaining,after:d,label:`${o.meatNameSnapshot} 전처리`,stockUpdatedAtSnapshot:new Date}),await M({type:`productionDeduct`,date:e,meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`processed`,meatStockId:o.id,delta:-s,before:o.remaining,after:d,staff:t,reason:`내일생산불러오기 차감`,batchId:f});let p=s-a;if(p>0){let i=R.find(e=>e.meatTypeId===n&&e.stage===`repacked`&&e.remaining>0);if(i){let a=i.remaining+p;await c(r(_,`meatStocks`,i.id),{remaining:a,closed:!1,updatedAt:new Date}),l.push({collection:`meatStocks`,docId:i.id,field:`remaining`,delta:p,before:i.remaining,after:a,label:`${o.meatNameSnapshot} 재포장 자동입고`,stockUpdatedAtSnapshot:new Date}),await M({type:`repackedIn`,date:e,meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`repacked`,meatStockId:i.id,delta:p,before:i.remaining,after:a,staff:t,reason:`생산 자동 재포장 (기존 lot 합산)`,batchId:f}),await _e({action:`autoRepack`,subAction:`trigger`,date:e,staff:`시스템`,message:`🔄 생산 자동 재포장 — ${o.meatNameSnapshot} ${(p/1e3).toFixed(2)}kg (전처리 ${o.unitWeightG}g 단위 차감 후 잔여, 기존 재포장 lot 합산)`,details:{meatTypeId:n,meatName:o.meatNameSnapshot,surplusG:p,processedUnitWeightG:o.unitWeightG,processedStockId:o.id,repackedStockId:i.id,mode:`merged`,batchId:f}}),i.remaining=a}else{let r=await u(g(_,`meatStocks`),{meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`repacked`,incomingDate:e,repackedDate:e,unitWeightG:null,unitCount:null,initialQtyG:p,remaining:p,batchId:f,staffName:t,note:`생산 자동 재포장`,closed:!1,createdAt:new Date,updatedAt:new Date});l.push({collection:`meatStocks`,docId:r.id,field:`remaining`,delta:p,before:0,after:p,label:`${o.meatNameSnapshot} 재포장 자동신규`,stockUpdatedAtSnapshot:new Date,isNewDoc:!0}),await M({type:`repackedIn`,date:e,meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`repacked`,meatStockId:r.id,delta:p,before:0,after:p,staff:t,reason:`생산 자동 재포장 (신규 lot)`,batchId:f}),await _e({action:`autoRepack`,subAction:`trigger`,date:e,staff:`시스템`,message:`🔄 생산 자동 재포장 — ${o.meatNameSnapshot} ${(p/1e3).toFixed(2)}kg (전처리 ${o.unitWeightG}g 단위 차감 후 잔여, 신규 재포장 lot)`,details:{meatTypeId:n,meatName:o.meatNameSnapshot,surplusG:p,processedUnitWeightG:o.unitWeightG,processedStockId:o.id,repackedStockId:r.id,mode:`newLot`,batchId:f}}),R.push({id:r.id,meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`repacked`,remaining:p,unitWeightG:null})}}a-=s}}if(a>0){let i=R.filter(e=>e.meatTypeId===n&&e.stage===`frozen`&&e.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``));for(let o of i){if(a<=0)break;let i=Math.min(o.remaining,a),s=o.remaining-i;await c(r(_,`meatStocks`,o.id),{remaining:s,closed:s<=0,updatedAt:new Date}),l.push({collection:`meatStocks`,docId:o.id,field:`remaining`,delta:-i,before:o.remaining,after:s,label:`${o.meatNameSnapshot} 냉동창고`,stockUpdatedAtSnapshot:new Date}),await M({type:`productionDeduct`,date:e,meatTypeId:n,meatNameSnapshot:o.meatNameSnapshot,stage:`frozen`,meatStockId:o.id,delta:-i,before:o.remaining,after:s,staff:t,reason:`내일생산불러오기 차감`,batchId:f}),a-=i}}}for(let[i,a]of Object.entries(s)){let o=await n(r(_,`bagTypes`,i));if(o.exists()){let n=o.data().currentQty||0,s=n-a;await c(r(_,`bagTypes`,i),{currentQty:s,updatedAt:new Date}),l.push({collection:`bagTypes`,docId:i,field:`currentQty`,delta:-a,before:n,after:s,label:`${o.data().name} 봉투`,stockUpdatedAtSnapshot:new Date}),await u(g(_,`bagLogs`),{date:e,timestamp:new Date,bagTypeId:i,bagNameSnapshot:o.data().name,type:`autoDeduct`,qty:-a,before:n,after:s,staffName:t,note:`내일생산불러오기 자동차감`})}}let p=await u(g(_,`stockLedger`),{actionType:`productionCompletion`,actionId:e,timestamp:new Date,runDate:e,status:`active`,items:l});await d(r(_,`productionCompletion`,e),{runDate:e,targetProductionDate:a,status:`completed`,idempotencyKey:`productionCompletion:${e}`,staffName:t,ledgerId:p.id,completedAt:new Date});for(let e of i)await c(r(_,`productions`,e.id),{lockedByCompletion:!0});await J(),Y(),alert(`내일생산불러오기 완료!`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function zn(){let e;try{e=await _n()}catch(e){alert(e.message);return}if(!await k({title:`내일생산불러오기 취소`,message:`내일생산불러오기를 취소하시겠습니까?
차감된 재고가 복원됩니다.`,confirmText:`취소`,danger:!0}))return;let t=await fe({title:`내일생산불러오기 취소`,message:`재고가 전부 롤백되고 마감 차단 항목이 다시 활성화됩니다.`,label:`취소 사유`,placeholder:`예: 생산 일정 변경`,required:!0,multiline:!0});if(t===null||!t)return;let i=D();try{await e()}catch(e){alert(e.message);return}let a=B?.staffName||`unknown`,o=`productionCompletion:${B?.runDate||i}`;try{if(B?.ledgerId){let e=await n(r(_,`stockLedger`,B.ledgerId));if(e.exists()){let s=e.data().items||[];for(let e of s){let s=await n(r(_,e.collection,e.docId));if(!s.exists())continue;let l=s.data()[e.field];if(!(l!==e.after&&!await k({title:`재고 변동 감지`,message:`내일생산불러오기 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n내일생산불러오기 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))){if(e.isNewDoc){let t=l-e.delta;await c(r(_,e.collection,e.docId),{[e.field]:t,closed:!0,updatedAt:new Date})}else await c(r(_,e.collection,e.docId),{[e.field]:l-e.delta,closed:!1,updatedAt:new Date});if(e.collection===`meatStocks`){let n=s.data();await M({type:`productionRollback`,date:i,meatTypeId:n.meatTypeId||null,meatNameSnapshot:n.meatNameSnapshot||``,stage:n.stage||`frozen`,meatStockId:e.docId,delta:-e.delta,before:l,after:l-e.delta,staff:a,reason:`내일생산불러오기 취소 - ${t}`,batchId:o})}}}await c(r(_,`stockLedger`,B.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}B?.id&&await c(r(_,`productionCompletion`,B.id),{status:`cancelled`,cancelReason:t,cancelledAt:new Date});for(let e of I)await c(r(_,`productions`,e.id),{lockedByCompletion:!1});await J(),Y(),alert(`취소 완료! 재고가 복원되었습니다.`)}catch(e){console.error(e),alert(`오류가 발생했습니다: `+e.message)}}async function Bn(){let e;try{e=await _n([`admin`,`office`])}catch(e){alert(e.message);return}if(C!==`admin`&&C!==`office`){alert(`새로고침은 대표/사무실 계정만 가능합니다.`);return}if(B?.status!==`completed`){alert(`마감 상태에서만 새로고침이 가능합니다.`);return}if(I.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(!await k({title:`내일생산불러오기 새로고침`,message:`기존 차감을 롤백하고 변경된 다음 영업일 생산 기준으로 다시 차감합니다.
진행하시겠습니까?`,confirmText:`진행`,danger:!1}))return;let t=await fe({title:`내일생산불러오기 새로고침`,message:`롤백 후 차단 항목이 다시 검사됩니다.`,label:`새로고침 사유`,placeholder:`예: 다음 영업일 생산 추가`,required:!0,multiline:!0});if(t===null||!t)return;let i=D();try{await e()}catch(e){alert(e.message);return}let a=B?.staffName||`unknown`,o=`productionCompletion:${B?.runDate||i}`;try{if(B?.ledgerId){let e=await n(r(_,`stockLedger`,B.ledgerId));if(e.exists()){let s=e.data().items||[];for(let e of s){let s=await n(r(_,e.collection,e.docId));if(!s.exists())continue;let l=s.data()[e.field];if(!(l!==e.after&&!await k({title:`재고 변동 감지`,message:`이전 마감 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n마감 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))){if(e.isNewDoc){let t=l-e.delta;await c(r(_,e.collection,e.docId),{[e.field]:t,closed:!0,updatedAt:new Date})}else await c(r(_,e.collection,e.docId),{[e.field]:l-e.delta,closed:!1,updatedAt:new Date});if(e.collection===`meatStocks`){let n=s.data();await M({type:`productionRollback`,date:i,meatTypeId:n.meatTypeId||null,meatNameSnapshot:n.meatNameSnapshot||``,stage:n.stage||`frozen`,meatStockId:e.docId,delta:-e.delta,before:l,after:l-e.delta,staff:a,reason:`새로고침 롤백 - ${t}`,batchId:o})}}}await c(r(_,`stockLedger`,B.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}B?.id&&await c(r(_,`productionCompletion`,B.id),{status:`cancelled`,cancelReason:`새로고침: ${t}`,cancelledAt:new Date});for(let e of I)await c(r(_,`productions`,e.id),{lockedByCompletion:!1});await J();let e=await In(i);if(e.length>0){Y(),alert(`롤백은 완료됐습니다.
차단 항목이 발견되어 재차감을 진행할 수 없습니다.
차단 항목 처리 후 [내일생산불러오기] 버튼으로 다시 진행해주세요.`),Ln(e);return}let s=await n(r(_,`staffGroups`,`lead`)),l=s.exists()&&s.data().members||[];$(`
      <h3 class="modal-title">새로고침 — 담당자 선택</h3>
      <p style="font-size:12px;color:#888;margin-bottom:16px;">
        롤백 완료. 다음 영업일(${T(i)}) 생산 기준으로 재차감합니다.
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
    `),document.getElementById(`btnConfirmRefresh`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_refresh_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}closeModal(),await Rn(i,e);try{await _e({action:`closing`,subAction:`refresh`,date:i,staff:e,message:`🔄 내일생산불러오기 새로고침 — 사유: ${t} / 담당: ${e} (이전 담당: ${a})`,details:{previousStaff:a,newStaff:e,reason:t,runDate:T(i)}}),await kt(),Gt()}catch(e){console.warn(`[6E-3] 새로고침 활동 로그 발행 실패:`,e)}})}catch(e){console.error(`[6E-3] 새로고침 실패:`,e),alert(`오류가 발생했습니다: `+e.message),await J(),Y()}}function Vn(){W=null,G=[],K=null,Y()}function Hn(){let e=B?.status===`completed`,t=W!==null,n=!t&&V!==null,r=t?G:n?Ke:e?I:He;$(`
    <h3 class="modal-title">${t?`${W} 생산 현황`:n?`${V} 생산 현황`:e?`${T(D())} 불러온 생산`:`${D()} 생산 현황`}</h3>
    <div class="main-production-grid big-view">
      ${r.length===0?`<p style="color:#aaa">생산 없음</p>`:r.map(e=>pn(e)).join(``)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`),r=e.includes(`main-production-grid big-view`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box ${r?`modal-wide`:``}">${e}</div>`,document.body.appendChild(n)}v(`main`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function Un(e,{today:t=D(),weekOffset:n=0}={}){await y(e);let i=At(e);i.catch(()=>{}),e.getDocs(a(g(_,`events`),s(`date`,`==`,t))).catch(()=>{}),e.getDocs(a(g(_,`schedules`),s(`date`,`==`,t))).catch(()=>{}),e.getDocs(a(g(_,`supplementTypes`),s(`active`,`==`,!0))).catch(()=>{}),e.getDocs(g(_,`supplementStock`)).catch(()=>{});let o=T(t),[c,l,u,d,f,p,h,v,b]=await Promise.all([e.getDocs(a(g(_,`productions`),m(`sortOrder`))),e.getDocs(g(_,`recipes`)),e.getDocs(g(_,`meatTypes`)),e.getDocs(g(_,`meatStocks`)),e.getDoc(r(_,`eggStock`,`global`)),e.getDoc(r(_,`productionCompletion`,t)),Se(t,null,e),ct(n,e),e.once(`equipmentAlerts:`+t,()=>le(t,e))]),x=c.docs.map(e=>({id:e.id,...e.data()})),S=h?.date||null,[ee,C]=await Promise.all([S?e.getDoc(r(_,`productionCompletion`,S)):null,h?.blockingData||Ce(t,e)]),w=await i,E=e=>e.docs.map(e=>({id:e.id,...e.data()})),te=e=>e?.exists()?{id:e.id,...e.data()}:null;return we({today:t,nextBizDay:o,overdueNextBizDay:S?T(S):null,allProds:x,recipeRows:E(l),meatTypeRows:E(u),meatRows:E(d),eggStock:f.exists()?f.data():{currentQty:0,minimumQty:0},equipmentAlerts:b,completionDoc:te(p),overdueCompletionDoc:te(ee),overdueClosing:h,blocks:C,calendar:v,logs:w})}function Wn({cacheOnly:e=!0}={}){let t=D();return P.prepare?.(JSON.stringify([t,0]),e=>Un(e,{today:t,weekOffset:0}),{cacheOnly:e})}async function Gn({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=D(),r=U,i=JSON.stringify([n,r]);W=null,G=[],K=null;let o=be(P,Gn),c=await P.load(e=>Un(e,{today:n,weekOffset:r}),{key:i,force:e,onChange:e=>{if(W){tt(t);return}o(e)}});if(!c||!t.isConnected||O!==`main`)return;it(c,{detached:!0}),Y(),Pn();let l=P.viewRevision,u=ae();ze!==l.id&&(ze=l.id,Be.run(`main:`+n,async()=>{let e=me(`instant:main:`+i),t=Re((await e.getDocs(a(g(_,`activityLogs`),s(`date`,`==`,n)))).docs.map(e=>({id:e.id,...e.data()})));if(await dn(n,t,e,{eggStock:c.eggStock,equipmentAlerts:c.equipmentAlerts}),!(!u?.isCurrent()||l.epoch!==w.epoch)&&(await t.flush()).failedIds.length)throw Error(`일부 자동 알림을 확인하지 못했습니다. 다시 불러와주세요.`)}).catch(e=>{ze=null,u?.isCurrent()&&tt(t),console.error(`[메인 자동 알림]`,e)}))}export{rt as assertAutomaticAlertsReady,Wn as preparePage,et as renderMain};