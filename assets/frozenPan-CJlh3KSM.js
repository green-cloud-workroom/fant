import{a as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-D8prxbkJ.js";import{n as o}from"./firebase-BOShkvR0.js";import{i as s}from"./staffText-DBRrEFyl.js";import{n as c}from"./modalManager-D53QKIlh.js";import{n as l}from"./modal-5yNlUCJi.js";import{A as u,O as d,U as f,Y as p,j as m,lt as h,n as g,tt as _,ut as v,v as y}from"./index-TLO2tC01.js";import{o as b}from"./manualMovementLogic-QqxDPXEB.js";import{t as x}from"./statusToast-B9R20x7w.js";import{i as S,n as C,r as w,t as T}from"./movementForm-DmFHTy5B.js";import{t as E}from"./closingGuard-WjhTk_vW.js";import{t as ee}from"./pageRefresh-Cgv25mcB.js";import{t as D}from"./pageCommand-i-P3fgNt.js";import{t as O}from"./commandWrites-bBvXK-bw.js";import{disposeFreezeOpTab as k,renderFreezeOpInTab as te}from"./freezeOp-BR07JOMM.js";import{n as A,t as j}from"./atomicStockOperation-DyK74RbP.js";import{i as M,n as ne,t as re}from"./number-Dwuf17we.js";import{t as ie}from"./recipe-BtPJ02z6.js";import{t as ae}from"./pageStaff-D2JwyrmN.js";function N(e){let t=Object.create(null);for(let n of e)(t[n.productName]??=[]).push(n);for(let e of Object.values(t))e.sort((e,t)=>String(e.date).localeCompare(String(t.date)));return t}function P(e){return e.includes(`주식`)?`주식`:`간식`}function oe(e,t,n){let r=new Map,i=(e,t)=>{r.has(e)||r.set(e,new Set),r.get(e).add(t)},a=new Set(e.map(e=>e.displayName));for(let e of a)i(P(e),e);for(let e of[...Object.keys(t),...Object.keys(n)])a.has(e)||i(`기타 보유 재고`,e);return[`주식`,`간식`,`기타 보유 재고`].filter(e=>r.has(e)).map(e=>[e,[...r.get(e)]])}function F(e){if(e?.toMillis)return e.toMillis();if(Number.isFinite(e?.seconds))return e.seconds*1e3;if(e==null||e===``)return 0;let t=new Date(e).getTime();return Number.isFinite(t)?t:0}function se(e){let t=[];for(let n of e){let e=new Map;for(let t of n.deductions||[])t.productName&&Number.isFinite(t.amount)&&t.amount>0&&e.set(t.productName,(e.get(t.productName)||0)+t.amount);for(let[r,i]of e){let e={productName:r,note:`동결가동 · `+(n.date||`날짜 미상`)+` 발주서`},a=F(n.createdAt);if(t.push({...e,type:`freezeDeduct`,qty:-i,staffName:n.createdBy,timestamp:a,date:a?p(new Date(a)):n.date}),n.status===`cancelled`){let r=F(n.cancelledAt);t.push({...e,type:`freezeRestore`,qty:i,staffName:n.cancelledBy,timestamp:r,date:r?p(new Date(r)):``})}}}return t}function ce(e,t,n){let r=(e,t)=>e.map(e=>({log:e,kind:t}));return[...r(e,`bread`),...r([...t,...se(n)],`frozen`)].sort((e,t)=>String(t.log.date||``).localeCompare(String(e.log.date||``))||F(t.log.timestamp)-F(e.log.timestamp))}var I=e=>M((e||[]).reduce((e,t)=>e+Number(t.remaining||0),0));function le(e,t){let n=I(e);return`<div class="pan-totals"><span>빵판 <b>`+n+`개</b> <small>실리콘 환산 `+ne(n)+`판</small></span><span>동결판 <b class="`+(I(t)<10?`pan-low`:``)+`">`+I(t)+`판</b></span></div>`}function ue(e,t,n,r){return`<section class="pan-box pan-board"><header><h3>품목별 현재고</h3><small>`+e.reduce((e,[,t])=>e+t.length,0)+`종</small></header><div class="pan-columns"><span>품목</span><span>빵판</span><span>동결판</span></div>`+e.map(([e,i])=>`<div class="pan-group"><h4>`+g(e)+` <small>`+i.length+`종</small></h4><div>`+i.map(e=>`<button type="button" data-product="`+g(e)+`" aria-pressed="`+(t===e)+`"><b>`+g(e)+`</b><span>`+I(n[e])+`개</span><span>`+I(r[e])+`판</span></button>`).join(``)+`</div></div>`).join(``)+(e.length?``:`<p>조회할 품목이 없습니다.</p>`)+`</section>`}function de(e,t,n,r,i){return(i?`<p class="pan-warning" role="status">동결가동 발주서 이력을 불러오지 못했습니다. 빵판·동결판 기록만 표시합니다.</p>`:``)+`<table class="data-table pan-log"><thead><tr><th>날짜</th><th>구분</th><th>품목</th><th>변동 수량</th><th>담당자</th><th>비고</th></tr></thead><tbody>`+e.slice(0,t).map(({log:e,kind:t})=>t===`bread`?n(e):r(e)).join(``)+`</tbody></table>`+(e.length?``:`<p>해당하는 이력이 없습니다.</p>`)+(e.length>t?`<button class="btn-secondary" data-more>이력 더 보기 (`+t+` / `+e.length+`건)</button>`:``)}function fe({recipes:e,drafts:t,showModal:n,openBread:r,openTender:i}){let a=null,o=[`주식`,`간식`].map(t=>[t,e.filter(e=>P(e.displayName)===t)]);function s(){if(!a)return;let e=e=>document.getElementById(e)?.value??``,n=e(`movement_kind`)||`receipt`,r=t.get(a.id)||{};Object.assign(r,{qty:e(`m_qty`),date:e(`m_date`),staff:e(`m_staff`),kind:n}),r[n===`test`?`testNote`:`note`]=e(`m_note`);let i=document.getElementById(`m_date`);r.qty||r.staff||r.note||r.testNote||n===`test`||r.date!==i?.defaultValue?t.set(a.id,r):t.delete(a.id)}function c(){return`<div class="pan-pick"><h4>입고할 품목</h4>`+o.filter(([,e])=>e.length).map(([e,n])=>`<section><h5>`+e+` <small>`+n.length+`종</small></h5><div>`+n.map(e=>`<button type="button" data-recipe="`+g(e.id)+`" aria-pressed="`+(a?.id===e.id)+`">`+g(e.displayName)+(t.has(e.id)?`<small>초안</small>`:``)+`</button>`).join(``)+`</div></section>`).join(``)+(e.length?``:`<p>입고 가능한 동결건조 레시피가 없습니다.</p>`)+`</div>`}function l(o,u=!1){a=o,o?(o.requiresSeparation?r:i)():n(``);let d=document.getElementById(`modalOverlay`),f=d.querySelector(`.modal-box`);d.classList.add(`pan-receipt-overlay`),f.classList.add(`pan-receipt-box`),f.setAttribute(`role`,`dialog`),f.setAttribute(`aria-modal`,`true`),f.setAttribute(`aria-labelledby`,`panReceiptTitle`);let p=document.createElement(`div`);for(p.className=`pan-receipt-form`;f.firstChild;)p.appendChild(f.firstChild);if(f.innerHTML=`<header><div><h3 id="panReceiptTitle">동결판 재고 입고</h3></div><button type="button" class="btn-secondary" data-dismiss aria-label="입고 닫기">닫기</button></header><div class="pan-receipt-body">`+c()+`</div>`,f.querySelector(`.pan-receipt-body`).appendChild(p),o){f.classList.add(`has-choice`);let e=p.querySelector(`#m_recipe`);e.value=o.displayName,e.closest(`.form-group`).hidden=!0;let n=p.querySelector(`.modal-title`);n.textContent=o.displayName,n.insertAdjacentHTML(`afterend`,`<p class="pan-form-kind">`+(o.requiresSeparation?`빵판 입고 · 개`:`텐더동결 입고 · 판`)+`</p>`),p.prepend(n),n.insertAdjacentHTML(`beforebegin`,`<button type="button" data-repick class="btn-secondary pan-repick">‹ 품목 변경</button>`);let r=t.get(o.id),i=p.querySelector(`#movement_kind`),a=p.querySelector(`#m_note`),c=p.querySelector(`#m_qty`);if(c.required=!0,p.querySelector(`.btn-primary`).addEventListener(`click`,e=>{c.reportValidity()||(e.preventDefault(),e.stopImmediatePropagation())},!0),i){i.closest(`.form-group`).hidden=!0;let e=document.createElement(`button`);e.type=`button`,e.className=`pan-test-toggle`,p.querySelector(`.modal-actions`).prepend(e);let n=t=>{i.value=t,i.dispatchEvent(new Event(`change`,{bubbles:!0})),e.textContent=t===`test`?`실제 입고로 돌아가기`:`테스트 기록`;let n=p.querySelector(`#btnSaveBreadPanIncoming`);n.textContent=t===`test`?`테스트 기록 저장`:`입고 등록`};n(r?.kind===`test`?`test`:`receipt`),e.onclick=()=>{s();let e=i.value===`test`?`receipt`:`test`;n(e),a.value=t.get(o.id)?.[e===`test`?`testNote`:`note`]||``,s()}}else p.querySelector(`#btnSaveTenderIn`).textContent=`입고 등록`;r&&(p.querySelector(`#m_qty`).value=r.qty,p.querySelector(`#m_date`).value=r.date,p.querySelector(`#m_staff`).value=r.staff,a.value=r[r.kind===`test`?`testNote`:`note`]||``),p.querySelector(`[data-repick]`).onclick=()=>{s(),l(null,!0)},p.addEventListener(`input`,s),p.addEventListener(`change`,s),p.querySelectorAll(`.form-group`).forEach(e=>{let t=e.querySelector(`label`),n=e.querySelector(`input,select`);t&&n&&(t.htmlFor=n.id)})}else p.innerHTML=`<p>왼쪽에서 입고할 품목을 선택하세요.</p>`;let m=()=>window.closeModal();f.querySelector(`[data-dismiss]`).onclick=m,f.querySelectorAll(`[data-recipe]`).forEach(t=>t.onclick=()=>{if(t.dataset.recipe===a?.id)return;let n=e.find(e=>e.id===t.dataset.recipe);n&&(s(),l(n))}),d.addEventListener(`keydown`,e=>{if(d.getAttribute(`aria-busy`)===`true`)return;if(e.key===`Escape`){e.preventDefault(),m();return}if(e.key!==`Tab`)return;let t=[...f.querySelectorAll(`button,input,select`)].filter(e=>!e.disabled&&e.getClientRects().length),n=e.shiftKey?t[0]:t.at(-1);n&&document.activeElement===n&&(e.preventDefault(),(e.shiftKey?t.at(-1):t[0]).focus())}),(o?window.matchMedia?.(`(max-width:700px)`).matches?p.querySelector(`[data-repick]`):p.querySelector(`#m_qty`):f.querySelector(`[data-recipe]`)||f.querySelector(`[data-dismiss]`))?.focus({preventScroll:!u})}l(null)}var L=[],pe=()=>({tab:`stock`,name:``,detail:!1,kind:`all`,today:!1,limit:60,lots:!1}),R=pe(),z=new Map,B,V;async function me({force:e=!1}={}){R=pe(),z=new Map,document.getElementById(`mainContent`).innerHTML=`<p style="padding:24px">동결판 재고 로딩 중...</p>`,await U({force:e})}async function he(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenPanStock`),i(`date`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()}))}async function ge(t={getDocs:r,getDoc:e},n=!1){return(await t.getDocs(a(o,`frozenPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>n?(!e.closed||Number(e.remaining)===0)&&Number(e.remaining)>=0:!e.closed&&Number(e.remaining||0)>0)}async function H(t={getDocs:r,getDoc:e},n=!1){return(await t.getDocs(a(o,`breadPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>n?(!e.closed||Number(e.remaining)===0)&&Number(e.remaining)>=0:!e.closed)}async function _e(t={getDocs:r,getDoc:e}){return(await t.getDocs(a(o,`breadPanLogs`))).docs.map(e=>({id:e.id,...e.data()}))}async function ve(t={getDocs:r,getDoc:e}){return(await t.getDocs(a(o,`frozenPanLogs`))).docs.map(e=>({id:e.id,...e.data()}))}async function U({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=u(),i=ee($,U);B!==n&&(B=n,m(()=>{B=null,V=null})),(!V||e)&&(V=Re({getDocs:r}));let a=V,[o,s]=await Promise.all([$.load(e=>ze(e),{force:e,onChange:i}),a]);if(!o||a!==V||!t?.isConnected||n&&!n.isCurrent())return;L=o.recipes,X=o.staff;let c=N(o.breadPanLots),l=N(o.lots);ye({...o,...s,breadGroups:c,frozenGroups:l,groups:oe(o.recipes,c,l),records:ce(o.breadPanLogs,o.frozenPanLogs,s.freezeOrders)})}function ye(e){let t=document.getElementById(`mainContent`),{breadGroups:n,frozenGroups:r,groups:i,records:a}=e,o=i.flatMap(([,e])=>e);o.includes(R.name)||(R.name=o[0]||``);let s=e.rows.filter(e=>e.type!==`work`&&e.status!==`cancelled`),c=[[`stock`,`품목별 재고`],[`history`,`전체 이력`],[`frozenPan`,`동결판 발주 확인`],[`freezeOp`,`동결가동`]],l=t=>de(t,R.limit,Ce,we,e.freezeHistoryUnavailable),d=R.name,f=()=>ye(e),p;if(R.tab===`stock`){let e=xe(n,d)+Se(r,d),t=(n[d]?.length||0)+(r[d]?.length||0);p=`<div class="pan-split `+(R.detail?`show-detail`:``)+`">`+ue(i,d,n,r)+`<div class="pan-detail"><section class="pan-box"><button class="btn-secondary pan-back" data-back>‹ 품목 목록</button><header><h3>`+g(d||`품목 없음`)+`</h3><small>현재 재고</small></header><div class="pan-numbers"><span>빵판 <b>`+I(n[d])+`개</b></span><span>동결판 <b>`+I(r[d])+`판</b></span></div><details `+(R.lots?`open`:``)+`><summary>입고일별 잔량 · `+t+`건</summary>`+e+`</details></section><section class="pan-box"><header><h3>품목 이력</h3><button class="btn-secondary" data-history>전체 이력 보기 ›</button></header>`+l(a.filter(e=>e.log.productName===d))+`</section></div></div>`}else if(R.tab===`history`){let e=a.filter(e=>(R.kind===`all`||R.kind===e.kind)&&(!R.today||e.log.date===_()));p=`<section class="pan-box"><header><h3>전체 이력</h3><small>전체 품목 · `+e.length+`건</small></header><div class="pan-filters">`+[[`all`,`전체`],[`bread`,`빵판`],[`frozen`,`동결판`]].map(([e,t])=>`<button class="btn-secondary" data-kind="`+e+`" aria-pressed="`+(e===R.kind)+`">`+t+`</button>`).join(``)+`<label>기간 <select id="panPeriod"><option value="all">전체 기간</option><option value="today" `+(R.today?`selected`:``)+`>오늘</option></select></label></div>`+l(e)+`</section>`}else p=R.tab===`frozenPan`?`<section class="pan-box"><header><h3>동결판 발주 확인</h3></header><div class="table-wrap"><table class="data-table"><thead><tr><th>날짜</th><th>구분</th><th>담당자</th><th>내용</th><th>상태</th><th>작업</th></tr></thead><tbody>`+s.map(je).join(``)+`</tbody></table></div>`+(s.length?``:`<p>발주 내역이 없습니다.</p>`)+`</section>`:`<div id="freezeOpContent">동결가동 자료 로딩 중…</div>`;t.innerHTML=`<div class="frozen-pan-page pan-desk"><header class="pan-heading"><h2>동결판 재고</h2><div><button id="panWork" class="btn-secondary">전처리 기록</button><button id="panAdjust" class="btn-secondary">수동조정</button><button id="panIncoming" class="btn-primary">＋ 입고</button></div></header>`+le(e.breadPanLots,e.lots)+`<nav class="pan-tabs">`+c.map(([e,t])=>`<button class="tab-btn `+(R.tab===e?`active`:``)+`" data-tab="`+e+`" aria-pressed="`+(R.tab===e)+`">`+t+`</button>`).join(``)+`</nav>`+p+`</div>`,t.querySelector(`#panIncoming`).addEventListener(`click`,Ee),t.querySelector(`#panWork`).addEventListener(`click`,()=>Me(s,e.lots)),t.querySelector(`#panAdjust`).addEventListener(`click`,()=>{Q(`<h3 class="modal-title">수동조정</h3><div class="pan-adjust-options"><button id="breadAdjust" class="btn-secondary">빵판 조정 (개)</button><button id="frozenAdjust" class="btn-secondary">동결판 조정 (판)</button></div><div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button></div>`),document.getElementById(`breadAdjust`).onclick=ke,document.getElementById(`frozenAdjust`).onclick=Ae});function m(e){let t=R.tab===`freezeOp`&&e!==R.tab;if(R.tab=e,R.limit=60,e===`stock`&&(R.detail=!1),t)return k(),U({force:!0});if(f(),e===`history`)return V=null,U()}t.querySelectorAll(`[data-tab]`).forEach(e=>e.addEventListener(`click`,()=>m(e.dataset.tab))),t.querySelector(`[data-history]`)?.addEventListener(`click`,()=>{R.kind=`all`,R.today=!1,m(`history`)}),t.querySelectorAll(`[data-product]`).forEach(e=>e.addEventListener(`click`,()=>{R.name=e.dataset.product,R.detail=!0,R.lots=!1,R.limit=60,f(),window.matchMedia?.(`(max-width:700px)`).matches&&(t.querySelector(`.pan-back`)?.focus({preventScroll:!0}),t.scrollTop=0)})),t.querySelector(`[data-back]`)?.addEventListener(`click`,()=>{R.detail=!1,f(),t.querySelector(`.pan-board [aria-pressed="true"]`)?.focus()});let h=t.querySelector(`.pan-detail details`);if(h?.addEventListener(`toggle`,()=>{h.isConnected&&(R.lots=h.open)}),t.querySelectorAll(`[data-kind]`).forEach(e=>e.addEventListener(`click`,()=>{R.kind=e.dataset.kind,R.limit=60,f()})),t.querySelector(`#panPeriod`)?.addEventListener(`change`,e=>{R.today=e.target.value===`today`,R.limit=60,f()}),t.querySelector(`[data-more]`)?.addEventListener(`click`,()=>{R.limit+=60,f()}),R.tab===`frozenPan`&&Te(s,e.lots),R.tab===`freezeOp`){let e=u();te().catch(t=>{let n=document.getElementById(`freezeOpContent`);n&&(!e||e.isCurrent())&&(n.textContent=`동결가동 자료를 불러오지 못했습니다. 탭을 다시 선택해주세요.`,console.error(t))})}else k()}function be(e){if(!e)return``;let t={tenderIn:{label:`텐더`,color:`#1f6fb2`,bg:`#e8f3fc`},preprocess:{label:`전처리`,color:`#6E655C`,bg:`#EFECE8`},adjust:{label:`조정`,color:`#b97a1f`,bg:`#fdf3e0`}}[e];return t?`<span style="display:inline-block;font-size:10px;background:${t.bg};color:${t.color};padding:1px 6px;border-radius:3px;margin-left:4px;font-weight:500;vertical-align:middle;">${t.label}</span>`:``}function W(e,t,n){return(t===void 0?Object.entries(e):[[t,e[t]||[]]]).filter(([,e])=>e.length).map(([e,t])=>`<div class="stat-item"><span class="stat-label">`+g(e)+`</span><div>`+t.map(e=>`<div>`+g(e.date)+` · `+(n===`bread`?`빵판`:`동결판`)+` `+g(e.remaining)+(n===`bread`?`개`:`판`)+(n===`frozen`?be(e.source):``)+`</div>`).join(``)+`</div></div>`).join(``)}function xe(e,t){return W(e,t,`bread`)}function Se(e,t){return W(e,t,`frozen`)}function Ce(e){let t=b(e,{incoming:`입고`,preprocess:`전처리 사용`,adjust:`수동조정`,rollback:`차감 복원`}[e.type]||`작업 구분 확인 필요`),n=e.qty>0?`stock-quantity--increase`:`stock-quantity--decrease`,r=e.qty>0?`+`:``,i=`-`;if(e.type===`preprocess`&&e.expectedFrozenQty!=null&&e.actualFrozenQty!=null){let t=e.diff>0?`+${e.diff}`:e.diff<0?`${e.diff}`:`0`;i=`이론 ${e.expectedFrozenQty} / 실측 ${e.actualFrozenQty} (차 ${t})`,(e.note||e.reason)&&(i+=` · `+(e.note||e.reason))}else e.note?i=e.note:e.reason&&(i=e.reason);let a=e.lotDate&&e.type!==`incoming`?`<span style="font-size:11px;color:#999;margin-left:4px;">(입고 ${g(e.lotDate)})</span>`:``;return`
    <tr>
      <td>${g(e.date||`-`)}</td>
      <td><span class="tag stock-movement-badge" data-movement-label="${g(t)}">${g(t)}</span></td>
      <td>${g(e.productName||`-`)}${a}</td>
      <td class="${n}" style="font-weight:500;">${r}${g(e.qty||0)}개</td>
      <td>${g(e.staffName||`-`)}</td>
      <td style="font-size:12px;color:#666;">${g(i)}</td>
    </tr>
  `}function we(e){let t=b(e,{tenderIn:`텐더동결 입고`,preprocess:`전처리 입고`,orderDeduct:`발주 차감`,orderRollback:`발주 복원`,freezeDeduct:`동결가동 차감`,freezeRestore:`동결가동 복원`,adjust:`수동조정`}[e.type]||`작업 구분 확인 필요`),n=e.qty>0?`stock-quantity--increase`:`stock-quantity--decrease`,r=e.qty>0?`+`:``,i=`-`;return e.note?i=e.note:e.reason&&(i=e.reason),`
    <tr>
      <td>${g(e.date||`-`)}</td>
      <td><span class="tag stock-movement-badge" data-movement-label="${g(t)}">${g(t)}</span></td>
      <td>${g(e.productName||`-`)}</td>
      <td class="${n}" style="font-weight:500;">${r}${g(e.qty||0)}판</td>
      <td>${g(e.staffName||`-`)}</td>
      <td style="font-size:12px;color:#666;">${g(i)}</td>
    </tr>
  `}function Te(e,n){document.querySelectorAll(`.btn-order-confirm`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.id,i=e.find(e=>e.id===r);if(!i||await E(i.date))return;let a=await Ie({title:`발주 확인 — 담당자 선택`,message:`발주 확인을 진행할 담당자를 선택해주세요.`,groups:[`senior`,`office`]});a&&await Pe(i,n,a)})}),document.querySelectorAll(`.btn-order-delete`).forEach(n=>{n.addEventListener(`click`,async()=>D($,async r=>{let{updateDoc:i}=O(r);if(!await l({title:`발주 행 삭제`,message:`발주 행을 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))return;let a=e.find(e=>e.id===n.dataset.id);a&&await E(a.date,r)||(await i(t(o,`frozenPanStock`,n.dataset.id),{status:`cancelled`}),r.isCurrent()&&await U())},{roles:[`admin`,`office`]}))}),document.querySelectorAll(`.btn-order-cancel`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=e.find(e=>e.id===t.dataset.id);if(!r||await E(r.date))return;let i=await Ie({title:`발주 확인 취소`,message:`확인 취소 시 이 발주에서 차감한 동결판 재고가 복원됩니다.`,groups:[`senior`,`office`],requireReason:!0});i&&await Fe(r,n,i.staff,i.reason)})})}function Ee(){fe({recipes:L,drafts:z,showModal:Q,openBread:Oe,openTender:De})}function G(e){let t=L.find(t=>t.displayName===e);t&&z.delete(t.id)}function De(){let e=L.filter(e=>e.requiresSeparation!==!0);if(e.length===0){alert(`동결텐더 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 끈 레시피를 추가해주세요.`);return}Q(`
    <h3 class="modal-title">텐더동결 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>제품 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${e.map(e=>`<option value="${g(e.displayName)}">${g(e.displayName)}</option>`).join(``)}
        </select>
      </div>
      <div class="form-group">
        <label>동결판 수 *</label>
        <input type="number" id="m_qty" step="1" min="1" placeholder="예: 5" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${_()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Z([`senior`,`office`])}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveTenderIn">저장</button>
    </div>
  `),document.getElementById(`btnSaveTenderIn`).addEventListener(`click`,async()=>D($,async e=>{let{addDoc:n,updateDoc:r}=O(e),i=document.getElementById(`m_recipe`).value.trim(),c=parseInt(document.getElementById(`m_qty`).value)||0,l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,d=document.getElementById(`m_note`).value.trim();if(!i){alert(`제품을 선택해주세요.`);return}if(c<=0){alert(`동결판 수는 0보다 커야 합니다.`);return}if(!l){alert(`날짜를 입력해주세요.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}if(await E(l,e))return;let f=new Date;try{if(await j({db:o,command:e,operationId:A(o,document.getElementById(`btnSaveTenderIn`)),actionType:`frozenPanTenderIn`,date:l,request:{productName:i,qty:c,staffName:u,note:d},build:async({writer:e})=>{let{addDoc:n,updateDoc:r}=e,s=await n(a(o,`frozenPanLots`),{productName:i,date:l,staffName:u,initialQty:c,remaining:c,closed:!1,source:`tenderIn`,sourceRefId:null,note:d||null,createdAt:f,updatedAt:f}),p=await n(a(o,`frozenPanLogs`),{type:`tenderIn`,date:l,productName:i,qty:c,before:0,after:c,lotId:s.id,staffName:u,uid:null,note:d||null,reason:null,batchId:null,ledgerId:null,timestamp:f});await r(t(o,`frozenPanLots`,s.id),{sourceRefId:p.id}),await n(a(o,`stockLedger`),{actionType:`frozenPanTenderIn`,actionId:p.id,timestamp:f,date:l,status:`active`,items:[{collection:`frozenPanLots`,docId:s.id,field:`remaining`,delta:c,before:0,after:c,label:`${i} 동결판 (텐더동결 입고)`,stockUpdatedAtSnapshot:f,isNewDoc:!0}]})}}),!e.isCurrent()||(G(i),closeModal(),!e.isCurrent()))return;await U(),x(`텐더동결 입고 완료!`)}catch(e){console.error(`showTenderInModal 저장 에러:`,e),alert(`저장 중 오류가 발생했습니다.\n\n${s(e)}`)}},{roles:[`admin`,`office`,`production`]}))}function Oe(){let e=L.filter(e=>e.requiresSeparation===!0);if(e.length===0){alert(`동결생식 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.`);return}Q(`
    ${C({incoming:!0,reasonField:!1})}
    <h3 class="modal-title">빵판 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>레시피 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${e.map(e=>`<option value="${g(e.displayName)}">${g(e.displayName)}</option>`).join(``)}
        </select>
      </div>
      <div class="form-group">
        <label>빵판 수 * (소수 2자리)</label>
        <input type="number" id="m_qty" step="0.01" min="0.01" placeholder="예: 4.5" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${_()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Z([`senior`,`office`])}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanIncoming">저장</button>
    </div>
  `);let n=T({db:o,name:`breadPanLogs`,filter:()=>({lotId:document.getElementById(`m_lot`)?.value||``}),filterInputs:[document.getElementById(`m_lot`)],onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_note`)});document.getElementById(`btnSaveBreadPanIncoming`).addEventListener(`click`,async()=>D($,async e=>{let{addDoc:r}=O(e),i=w(n);if(!i)return;let s=document.getElementById(`m_recipe`).value.trim(),c=M(parseFloat(document.getElementById(`m_qty`).value)||0),l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,d=document.getElementById(`m_note`).value.trim();if(!s){alert(`레시피를 선택해주세요.`);return}if(c<=0){alert(`빵판 수는 0보다 커야 합니다.`);return}if(!l){alert(`날짜를 입력해주세요.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}if(await E(l,e))return;let f=new Date,p=t(a(o,`breadPanLots`));await S({db:o,command:e,name:`breadPanLogs`,stockId:p.id,selection:i,uid:h?.uid||null,stockData:{productName:s,date:l,staffName:u,initialQty:c,remaining:0,closed:!1,note:d||null,createdAt:f},log:{type:`incoming`,date:l,productName:s,qty:c,lotId:p.id,lotDate:l,staffName:u,note:d||null}}),e.isCurrent()&&(G(s),closeModal(),e.isCurrent()&&(await U(),x(`빵판 입고 완료!`)))},{roles:[`admin`,`office`,`production`]}))}async function ke(){let n=await H({getDocs:r,getDoc:e},!0);if(n.length===0){alert(`조정할 빵판 재고가 없습니다.
빵판 입고를 먼저 진행해주세요.`);return}let i=n.sort((e,t)=>{let n=e.productName.localeCompare(t.productName);return n===0?e.date.localeCompare(t.date):n}).map(e=>`<option value="${g(e.id)}">${g(e.productName)} / ${g(e.date)} / 잔량 ${g(e.remaining)}개</option>`).join(``);Q(`
    ${C({incoming:!1,reasonField:!1})}
    <h3 class="modal-title">빵판 수동 조정</h3>
    <div class="form-group">
      <label>대상 재고 건 *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${i}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형 *</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량 * (소수 2자리)</label>
        <input type="number" id="m_qty" step="0.01" min="0.01" placeholder="예: 0.5" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="예: 실측 차이 보정 / 분실" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanAdjust">저장</button>
    </div>
  `);let a=T({db:o,name:`breadPanLogs`,filter:()=>({lotId:document.getElementById(`m_lot`)?.value||``}),filterInputs:[document.getElementById(`m_lot`)],onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveBreadPanAdjust`).addEventListener(`click`,async()=>D($,async e=>{let{getDoc:n,addDoc:r,updateDoc:i}=O(e),s=w(a);if(!s)return;let c=document.getElementById(`m_lot`).value,l=document.getElementById(`m_adjustType`).value,u=M(parseFloat(document.getElementById(`m_qty`).value)||0),d=s.reason,f=document.getElementById(`m_staff`).value;if(!c){alert(`대상 재고 건을 선택해주세요.`);return}if(u<=0){alert(`수량은 0보다 커야 합니다.`);return}if(!f){alert(`담당자를 선택해주세요.`);return}let p=l===`plus`?u:-u,m=await n(t(o,`breadPanLots`,c));if(!m.exists()){alert(`재고 건을 찾을 수 없습니다.`);return}let g=m.data();if(g.date,await E(_(),e))return;let v=g.remaining||0,y=M(v+p);if(y<0&&s.kind!==`test`){alert(`조정 후 잔량이 ${y}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${v}개에서 최대 ${v}개까지만 감소 가능합니다.`);return}let b=_();await S({db:o,command:e,name:`breadPanLogs`,stockId:c,selection:s,expectedBefore:v,uid:h?.uid||null,log:{type:`adjust`,date:b,productName:g.productName,qty:p,before:v,after:y,lotId:c,lotDate:g.date||null,staffName:f,reason:d}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(await U(),x(`수동 조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}async function Ae(){let n=await ge({getDocs:r,getDoc:e},!0);if(n.length===0){alert(`조정할 동결판 재고가 없습니다.
동결판 입고를 먼저 진행해주세요.`);return}let i=n.sort((e,t)=>{let n=e.productName.localeCompare(t.productName);return n===0?e.date.localeCompare(t.date):n}).map(e=>`<option value="${g(e.id)}">${g(e.productName)} / ${g(e.date)} / 잔량 ${g(e.remaining)}개</option>`).join(``);Q(`
    ${C({incoming:!1,reasonField:!1})}
    <h3 class="modal-title">동결판 수동 조정</h3>
    <div class="form-group">
      <label>대상 재고 건 *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${i}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형 *</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량 * (정수)</label>
        <input type="number" id="m_qty" step="1" min="1" placeholder="예: 5" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="예: 실측 차이 보정 / 분실" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozenPanAdjust">저장</button>
    </div>
  `);let a=T({db:o,name:`frozenPanLogs`,filter:()=>({lotId:document.getElementById(`m_lot`)?.value||``}),filterInputs:[document.getElementById(`m_lot`)],onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveFrozenPanAdjust`).addEventListener(`click`,async()=>D($,async e=>{let{getDoc:n,writeBatch:r}=O(e),i=w(a);if(!i)return;let s=document.getElementById(`m_lot`).value,c=document.getElementById(`m_adjustType`).value,l=parseInt(document.getElementById(`m_qty`).value,10),u=i.reason,d=document.getElementById(`m_staff`).value;if(!s){alert(`대상 재고 건을 선택해주세요.`);return}if(!Number.isInteger(l)||l<=0){alert(`수량은 0보다 큰 정수여야 합니다.`);return}if(!d){alert(`담당자를 선택해주세요.`);return}let f=c===`plus`?l:-l,p=await n(t(o,`frozenPanLots`,s));if(!p.exists()){alert(`재고 건을 찾을 수 없습니다.`);return}let m=p.data();if(await E(_(),e))return;let g=Number(m.remaining||0),v=g+f;if(v<0&&i.kind!==`test`){alert(`조정 후 잔량이 ${v}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${g}개에서 최대 ${g}개까지만 감소 가능합니다.`);return}let y=_();await S({db:o,command:e,name:`frozenPanLogs`,stockId:s,selection:i,expectedBefore:g,uid:h?.uid||null,log:{type:`adjust`,date:y,productName:m.productName,qty:f,before:g,after:v,lotId:s,lotDate:m.date||null,staffName:d,reason:u}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(await U(),x(`수동 조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function je(e){if(e.status===`cancelled`)return``;let t=v===`admin`||v===`office`,n=e.status===`confirmed`,r=(e.items||[]).reduce((e,t)=>e+(t.orderPanQty||0),0),i=r===45?`var(--ui-success-color)`:r>45?`#e53e3e`:`#e67e22`,a=`
    ${(e.items||[]).map(e=>`<span style="font-size:11px;margin-right:8px">${g(e.productName)}: ${g(e.orderPanQty)}판</span>`).join(``)}
    <span style="font-weight:600;color:${i}">총 ${g(r)}판</span>
  `,o=``;return o=n?t?`<button class="btn-secondary btn-order-cancel" data-id="${g(e.id)}" style="font-size:11px;padding:3px 10px;">발주 취소</button>`:``:`
      <button class="btn-primary btn-order-confirm" data-id="${g(e.id)}" style="font-size:11px;padding:3px 10px;">발주 확인</button>
      <button class="btn-del-row btn-order-delete" data-id="${g(e.id)}">삭제</button>
    `,`
    <tr style="background:#fffdf0">
      <td>${g(e.date)}</td>
      <td><span class="tag tag-cat">발주</span></td>
      <td>${g(e.staffName||`-`)}</td>
      <td>${a}</td>
      <td>
        ${n?`<span class="ui-success" style="font-size:12px">✅ 확인완료</span>`:`<span style="color:#e67e22;font-size:12px">⏳ 대기중</span>`}
      </td>
      <td style="white-space:nowrap">${o}</td>
    </tr>
  `}async function Me(e,t){let n=await H(),r=L.filter(e=>e.requiresSeparation===!0);if(r.length===0){alert(`동결생식 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.`);return}let i=Object.create(null);r.forEach(e=>{let t=n.filter(t=>t.productName===e.displayName&&t.remaining>.005).sort((e,t)=>e.date.localeCompare(t.date)),r=M(t.reduce((e,t)=>e+t.remaining,0)),a=t.length>0?t[0].remaining:0;i[e.displayName]={total:r,oldestRemaining:a}}),Q(`
    <h3 class="modal-title">작업 행 추가 (빵판 → 동결판 전처리)</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜 *</label>
        <input type="date" id="m_date" value="${_()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Z([`senior`,`office`])}
        </select>
      </div>
    </div>

    <div style="font-size:12px;color:#666;background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:12px;">
      <strong>환산</strong>: 빵판 1개 → 동결판 4/9개 (≈0.44)<br>
      <strong>먼저 입고된 순서로 사용</strong>: 같은 제품에 여러 입고 건이 있으면 먼저 입고된 재고부터 차감됩니다.<br>
      <strong>실측</strong>: 이론값과 실제 산출 동결판 수가 다르면 차이가 별도 기록됩니다.
    </div>

    <div id="workItems">
      ${K(r,i)}
    </div>
    <button class="btn-secondary" id="btnAddWorkItem" style="margin-bottom:16px;">+ 제품 추가</button>

    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveWorkRow">저장</button>
    </div>
  `),q(i),J(),document.getElementById(`btnAddWorkItem`).addEventListener(`click`,()=>{document.getElementById(`workItems`).insertAdjacentHTML(`beforeend`,K(r,i)),q(i),J()}),document.getElementById(`btnSaveWorkRow`).addEventListener(`click`,async()=>{await Ne()})}async function Ne(){return D($,async e=>{let{addDoc:n,updateDoc:r}=O(e),i=document.getElementById(`m_date`).value,c=document.getElementById(`m_staff`).value,l=document.getElementById(`m_note`).value.trim(),u=Array.from(document.querySelectorAll(`.work-item`)).map(e=>({productName:e.querySelector(`.wi-name`).value.trim(),breadPanQty:M(parseFloat(e.querySelector(`.wi-bread`).value)||0),actualFrozenQty:e.querySelector(`.wi-actual`).value===``?null:Number(e.querySelector(`.wi-actual`).value)})).filter(e=>e.productName);if(!i){alert(`날짜를 입력해주세요.`);return}if(!c){alert(`담당자를 선택해주세요.`);return}if(u.length===0){alert(`제품을 1개 이상 입력해주세요.`);return}for(let e of u){if(e.breadPanQty<=0){alert(`${e.productName}: 출고 빵판 수가 입력되지 않았습니다.`);return}if(!Number.isInteger(e.actualFrozenQty)||e.actualFrozenQty<=0){alert(e.actualFrozenQty===null?`${e.productName}: 실제 산출 동결판 수를 입력해주세요.`:`${e.productName}: 실제 산출 동결판 수는 1 이상의 정수로 입력해주세요.`);return}}if(await E(i,e))return;let d=await H();try{if(await j({db:o,command:e,operationId:A(o,document.getElementById(`btnSaveWorkRow`)),actionType:`breadToFrozenPreprocess`,date:i,request:{items:u,staffName:c,note:l},inputs:{breadPanLots:d.filter(e=>u.some(t=>t.productName===e.productName))},build:async({writer:e,fresh:n})=>{let{addDoc:r,updateDoc:s}=e,d=n.breadPanLots;if(new Set(u.map(e=>e.productName)).size!==u.length)throw Error(`같은 제품은 한 행으로 입력해주세요.`);let f=[];for(let e of u){let t=M(d.filter(t=>t.productName===e.productName).reduce((e,t)=>e+t.remaining,0));e.breadPanQty>t&&f.push(`${e.productName}: 잔량 ${t}개 / 요청 ${e.breadPanQty}개`)}if(f.length>0)throw Error(`빵판 재고가 부족합니다.\n\n${f.join(`
`)}`);let p=`preprocess_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,m=new Date,h=[];for(let e of u){let n=re(e.breadPanQty),u=M(e.actualFrozenQty-n),f=e.breadPanQty,g=d.filter(t=>t.productName===e.productName&&t.remaining>.005).sort((e,t)=>e.date.localeCompare(t.date));for(let d of g){if(f<=.005)break;let _=M(Math.min(d.remaining,f)),v=d.remaining,y=M(v-_),b=new Date;await s(t(o,`breadPanLots`,d.id),{remaining:y,closed:y<=.005,updatedAt:b});let x=d.id===g[0].id;await r(a(o,`breadPanLogs`),{type:`preprocess`,date:i,productName:e.productName,qty:-_,before:v,after:y,lotId:d.id,lotDate:d.date,expectedFrozenQty:x?n:null,actualFrozenQty:x?e.actualFrozenQty:null,diff:x?u:null,staffName:c,uid:null,note:l||null,reason:null,batchId:p,ledgerId:null,timestamp:m}),h.push({collection:`breadPanLots`,docId:d.id,field:`remaining`,delta:-_,before:v,after:y,label:`${e.productName} 빵판 (${d.date})`,stockUpdatedAtSnapshot:b}),f=M(f-_)}let _=await r(a(o,`frozenPanLots`),{productName:e.productName,date:i,staffName:c,initialQty:e.actualFrozenQty,remaining:e.actualFrozenQty,closed:!1,source:`preprocess`,sourceRefId:p,note:l||null,createdAt:m,updatedAt:m});await r(a(o,`frozenPanLogs`),{type:`preprocess`,date:i,productName:e.productName,qty:e.actualFrozenQty,before:0,after:e.actualFrozenQty,lotId:_.id,staffName:c,uid:null,note:l||null,reason:null,batchId:p,ledgerId:null,timestamp:m}),h.push({collection:`frozenPanLots`,docId:_.id,field:`remaining`,delta:e.actualFrozenQty,before:0,after:e.actualFrozenQty,label:`${e.productName} 동결판 (신규 생성)`,stockUpdatedAtSnapshot:m,isNewDoc:!0})}await r(a(o,`stockLedger`),{actionType:`breadToFrozenPreprocess`,actionId:p,timestamp:m,date:i,status:`active`,items:h})}}),!e.isCurrent()||(closeModal(),!e.isCurrent()))return;await U(),x(`전처리 작업 저장 완료!`)}catch(e){console.error(`handleWorkRowSave 에러:`,e),alert(`저장 중 오류가 발생했습니다.\n\n${s(e)}`)}},{roles:[`admin`,`office`,`production`]})}function K(e,t){return`
    <div class="work-item">
      <div style="display:flex;gap:8px;align-items:center;">
        <select class="wi-name cell-input" style="flex:1;min-width:0;">
          <option value="">제품 선택</option>
          ${e.map(e=>`<option value="${g(e.displayName)}">${g(e.displayName)}</option>`).join(``)}
        </select>
        <button class="btn-del-row wi-del" type="button">×</button>
      </div>
      <div class="wi-stock-info" style="font-size:11px;color:#888;padding-left:2px;margin:6px 0;">제품을 선택하세요</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 60px;gap:8px;align-items:end;">
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">출고 빵판 수 *</label>
          <input type="number" class="wi-bread cell-input" step="0.01" min="0.01" placeholder="빵판" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">이론 동결판 (×4/9)</label>
          <input type="number" class="wi-expected cell-input" readonly placeholder="-" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">실제 산출 동결판 *</label>
          <input type="number" class="wi-actual cell-input" step="1" min="1" placeholder="실측" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">차이</label>
          <span class="wi-diff" style="display:inline-block;line-height:32px;font-size:13px;color:#888;">-</span>
        </div>
      </div>
    </div>
  `}function q(e){document.querySelectorAll(`.wi-del`).forEach(e=>{e.onclick=()=>{e.closest(`.work-item`).remove(),J()}}),document.querySelectorAll(`.work-item`).forEach(t=>{let n=t.querySelector(`.wi-name`),r=t.querySelector(`.wi-bread`),i=t.querySelector(`.wi-expected`),a=t.querySelector(`.wi-actual`),o=t.querySelector(`.wi-diff`),s=t.querySelector(`.wi-stock-info`);n.onchange=()=>{let c=n.value,l=e[c];a.value=``,i.value=``,o.textContent=`-`,o.style.color=`#888`,!l||l.total<=0?(s.textContent=c?`⚠️ 빵판 재고 없음`:`제품을 선택하세요`,s.style.color=c?`#e53e3e`:`#888`,r.value=``,r.max=``):(s.textContent=`현재 잔량 ${l.total}개 (가장 오래된 lot ${l.oldestRemaining}개)`,s.style.color=`var(--ui-success-color)`,r.value=l.oldestRemaining,r.max=l.total,Y(t)),J()},r.oninput=()=>{Y(t)},a.oninput=()=>{Y(t)}})}function J(){let e=new Set;document.querySelectorAll(`.work-item .wi-name`).forEach(t=>{t.value&&e.add(t.value)}),document.querySelectorAll(`.work-item .wi-name`).forEach(t=>{let n=t.value;Array.from(t.options).forEach(t=>{t.value&&(t.disabled=t.value!==n&&e.has(t.value))})})}function Y(e){let t=e.querySelector(`.wi-bread`),n=e.querySelector(`.wi-expected`),r=e.querySelector(`.wi-actual`),i=e.querySelector(`.wi-diff`),a=re(M(parseFloat(t.value)||0));n.value=a;let o=parseInt(r.value);if(isNaN(o)||r.value===``){i.textContent=`-`,i.style.color=`#888`;return}let s=M(o-a);i.textContent=`${s>0?`+`:``}${s}`,s===0?i.style.color=`var(--ui-success-color)`:Math.abs(s)<=.5?i.style.color=`#888`:i.style.color=`#e67e22`}async function Pe(e,n,r){return D($,async i=>{let{addDoc:s,updateDoc:c,recordActivity:l}=O(i);await j({db:o,command:i,operationId:`frozenPanOrder_${e.id}_${e.ledgerId||`initial`}`,actionType:`frozenPanOrder`,date:e.date,request:{orderId:e.id,items:e.items,staff:r},inputs:{frozenPanLots:n.filter(t=>(e.items||[]).some(e=>e.productName===t.productName))},readRefs:[t(o,`frozenPanStock`,e.id)],build:async({writer:n,fresh:i})=>{let{addDoc:s,updateDoc:c,recordActivity:l,getDoc:u}=n,f=(await u(t(o,`frozenPanStock`,e.id))).data();if(f.status!==`pending`||d(f.items)!==d(e.items))throw Error(`발주 내용이나 상태가 변경되었습니다.`);let p=f.items||[],m=i.frozenPanLots;if(!p.length||p.some(e=>!Number.isFinite(e.orderPanQty)||e.orderPanQty<=0)||new Set(p.map(e=>e.productName)).size!==p.length)throw Error(`발주 수량이나 품목이 비정상입니다.`);let h=[];for(let e of p){let t=m.filter(t=>t.productName===e.productName).reduce((e,t)=>e+t.remaining,0);e.orderPanQty>t&&h.push(`${e.productName}: 현재 재고 ${t}판 / 발주 ${e.orderPanQty}판`)}if(h.length>0)throw Error(`재고가 부족하여 발주 확인할 수 없습니다.\n\n${h.join(`
`)}\n\n발주를 삭제하거나 작업 행을 먼저 추가하세요.`);let g=[];for(let n of p){let i=n.orderPanQty,l=m.filter(e=>e.productName===n.productName).sort((e,t)=>e.date.localeCompare(t.date));for(let u of l){if(i<=0)break;let l=Math.min(u.remaining,i),d=u.remaining,f=d-l,p=new Date;await c(t(o,`frozenPanLots`,u.id),{remaining:f,closed:f<=0,updatedAt:p}),await s(a(o,`frozenPanLogs`),{type:`orderDeduct`,date:e.date||_(),productName:n.productName,qty:-l,before:d,after:f,lotId:u.id,staffName:r,uid:null,note:null,reason:null,batchId:`frozenPanOrder_${e.id}`,ledgerId:null,timestamp:new Date}),g.push({collection:`frozenPanLots`,docId:u.id,field:`remaining`,delta:-l,before:d,after:f,label:`${n.productName} (${u.date||`-`})`,stockUpdatedAtSnapshot:p}),i-=l}}let v=null;g.length>0&&(v=(await s(a(o,`stockLedger`),{actionType:`frozenPanOrder`,actionId:e.id,timestamp:new Date,date:e.date||``,status:`active`,items:g})).id),await c(t(o,`frozenPanStock`,e.id),{status:`confirmed`,ledgerId:v,confirmStaff:r,confirmedAt:new Date,updatedAt:new Date});let y=p.map(e=>`${e.productName} ${e.orderPanQty}판`).join(`, `);await l({action:`frozenPan`,subAction:`orderConfirm`,date:e.date||_(),staff:r,message:`동결판 발주 확인 — ${y} / 담당: ${r}`,details:{frozenPanStockId:e.id,orderDate:e.date||null,items:p,ledgerId:v}})}}),i.isCurrent()&&(await U(),x(`발주 확인 완료!`))},{roles:[`admin`,`office`,`production`]})}async function Fe(e,n,r,i){return D($,async a=>{let{getDoc:s,writeBatch:c}=O(a),u=c(o);if(v!==`admin`&&v!==`office`){alert(`발주 취소는 대표/사무실 계정만 가능합니다.`);return}if(i=i?.trim(),!r||!i){alert(`담당자와 취소 사유를 입력해주세요.`);return}if(await E(e.date,a))return;let d=await s(t(o,`frozenPanStock`,e.id));if(!d.exists()||d.data().status!==`confirmed`){alert(`이미 취소됐거나 변경된 발주입니다. 최신 자료를 확인해주세요.`);return}if(e.ledgerId){let n=await s(t(o,`stockLedger`,e.ledgerId));if(n.exists()&&n.data().status===`active`){let r=n.data().items||[],i=[];for(let e of r){let n=t(o,e.collection,e.docId),r=await s(n);if(!r.exists())throw Error(`복원할 재고 원본이 없습니다. 사무팀 확인이 필요합니다.`);let a=Number(r.data()[e.field]);if(!Number.isFinite(a)||!Number.isFinite(e.delta)||a-e.delta<0)throw Error(`복원 수량을 확인할 수 없습니다.`);i.push({ref:n,item:e,current:a,after:a-e.delta})}let a=i.filter(e=>e.current!==e.item.after);if(a.length&&!await l({title:`재고 변경 후 발주 취소`,message:`발주 확인 이후 재고가 변경되었습니다. 현재 재고에 이 발주의 차감 수량만 되돌립니다.

`+a.map(e=>`${e.item.label||`동결판`}: 현재 ${e.current} → 복원 후 ${e.after}`).join(`
`),confirmText:`재고 복원 후 취소`,danger:!0}))return;for(let e of i)u.update(e.ref,{[e.item.field]:e.after,closed:e.after<=0,updatedAt:new Date});u.update(t(o,`stockLedger`,e.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}else throw Error(`이미 복원됐거나 유효하지 않은 발주 원장입니다. 최신 자료를 확인해주세요.`)}else{let r=e.items||[];for(let e of r){let r=n.filter(t=>t.productName===e.productName&&t.sourceRowId).sort((e,t)=>t.date.localeCompare(e.date)),i=e.orderPanQty;for(let n of r){if(i<=0)break;let r=Math.min(e.orderPanQty,i);u.update(t(o,`frozenPanLots`,n.id),{remaining:n.remaining+r,closed:!1,updatedAt:new Date}),i-=r}}}u.update(t(o,`frozenPanStock`,e.id),{status:`pending`,cancelReason:i,cancelStaff:r,cancelledAt:new Date,updatedAt:new Date});let p=e.items||[],m=p.map(e=>`${e.productName} ${e.orderPanQty}판`).join(`, `);await f({action:`frozenPan`,subAction:`orderCancel`,date:e.date||_(),staff:r,message:`동결판 발주 취소 — ${m} / 사유: ${i} / 담당: ${r}`,details:{frozenPanStockId:e.id,orderDate:e.date||null,items:p,reason:i}},{batch:u}),await u.commit(),a.isCurrent()&&(await U(),x(`발주 취소 완료!`))},{roles:[`admin`,`office`]})}async function Ie({title:e,message:t,groups:n,requireReason:r=!1}){return await Le(),new Promise(i=>{let a=document.getElementById(`modalOverlay`);a&&a.remove();let o=document.createElement(`div`);o.id=`modalOverlay`,o.className=`modal-overlay`,o.innerHTML=`
      <div class="modal-box" style="max-width:400px;padding:24px;">
        <h3 style="margin:0 0 12px 0;font-size:18px;font-weight:600;">${g(e)}</h3>
        <p style="font-size:13px;color:#666;margin:0 0 20px 0;">${g(t)}</p>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:13px;font-weight:500;color:#333;margin-bottom:8px;">담당자 *</label>
          <select id="sp_staff" style="width:100%;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;">
            <option value="">선택</option>
            ${Z(n)}
          </select>
        </div>
        ${r?`<div class="form-group"><label for="sp_reason">취소 사유 *</label><textarea id="sp_reason" maxlength="200" placeholder="취소 사유를 입력해주세요"></textarea></div>`:``}
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn-secondary" id="sp_cancel">닫기</button>
          <button class="btn-primary" id="sp_ok">${r?`재고 복원 후 취소`:`확인`}</button>
        </div>
      </div>
    `,document.body.appendChild(o);let s=e=>{o.remove(),i(e)};document.getElementById(`sp_cancel`).addEventListener(`click`,()=>s(null)),document.getElementById(`sp_ok`).addEventListener(`click`,()=>{let e=document.getElementById(`sp_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}let t=document.getElementById(`sp_reason`)?.value.trim();if(r&&!t){alert(`취소 사유를 입력해주세요.`);return}s(r?{staff:e,reason:t}:e)})})}var X={};async function Le(){Object.keys(X).length>0||await Promise.all([`senior`,`lead`,`office`].map(async n=>{let r=await e(t(o,`staffGroups`,n));r.exists()&&(X[n]=r.data().members||[])}))}function Z(e){let t=``;for(let n of e)(X[n]||[]).forEach(e=>{t+=`<option value="${g(e.name)}">${g(e.name)}</option>`});return t}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n)}c(`frozenPan`,function(){let e=document.getElementById(`modalOverlay`);if(e){let t=e.classList.contains(`pan-receipt-overlay`);e.remove(),t&&document.getElementById(`panIncoming`)?.focus()}});var $=y(`frozenPan`);$.refresh=U;async function Re(e){try{return{freezeOrders:(await e.getDocs(a(o,`freezeOrders`))).docs.map(e=>({...e.data(),id:e.id})),freezeHistoryUnavailable:!1}}catch(e){return console.warn(`동결가동 이력 조회 실패`,e),{freezeOrders:[],freezeHistoryUnavailable:!0}}}async function ze(e){let[t,n,r,i,a,o,s]=await Promise.all([he(e),ge(e),H(e),_e(e),ve(e),ie(e),ae(e)]);return{rows:t,lots:n,breadPanLots:r,breadPanLogs:i,frozenPanLogs:a,recipes:o,staff:s}}function Be({cacheOnly:e=!0}={}){return $.prepare?.(`default`,ze,{cacheOnly:e})}export{Be as preparePage,me as renderFrozenPan};