import{_ as e,b as t,c as n,d as r,g as i,s as a,u as o,y as s}from"./index.esm-D8prxbkJ.js";import{n as c}from"./firebase-BOShkvR0.js";import{i as l}from"./staffText-DBRrEFyl.js";import{n as u}from"./modalManager-D53QKIlh.js";import{n as d}from"./modal-5yNlUCJi.js";import{A as f,U as p,lt as m,n as h,tt as g,ut as _,v as ee}from"./index-TLO2tC01.js";import{o as te}from"./manualMovementLogic-QqxDPXEB.js";import{t as v}from"./movementNote-mZSZ7bXO.js";import{t as y}from"./statusToast-B9R20x7w.js";import{i as ne,n as b,r as x,t as S}from"./movementForm-DmFHTy5B.js";import{t as C}from"./statsAutomationRuntime-DlTvtlE5.js";import{t as w}from"./closingGuard-WjhTk_vW.js";import{t as T}from"./sortable-fSutADEa.js";import{t as E}from"./readCommand-B6bzjvc3.js";import{t as D}from"./pageRefresh-Cgv25mcB.js";var O=ee(`bag`);async function k(e,t=[`admin`,`office`]){let n=f();try{return await E(O,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[봉투 저장]`,e),alert(l(e))}}async function A(e,t,n,r,i,a){return k(async t=>await w(i,t)?!1:(await ne({db:c,command:t,name:`bagLogs`,stockId:e.id,log:n,selection:a,expectedBefore:Number(e.currentQty||0),uid:m?.uid||null}),!0),[`admin`,`office`,`production`])}var j=[];async function M({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=t.querySelector(`.bag-workspace`),r=O.model;n||(t.innerHTML=`<p class="list-empty">봉투 재고를 불러오는 중입니다.</p>`);let i=await O.load($,{force:e,onChange:D(O,M)});!i||!t.isConnected||!e&&n?.isConnected&&n.dataset.role===_&&r===O.model||(j=i.bags,Y=i.staff,await B())}async function N(e={getDocs:a}){return(await e.getDocs(r(s(c,`bagTypes`),o(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}var P=null,F=`all`,I=!1,L=0;function R(e=F){return j.filter(t=>e===`inactive`?t.active===!1:t.active!==!1&&(e===`all`||t.category===e))}function z(e){let t=Number(e);return e!=null&&Number.isFinite(t)?t.toLocaleString(`ko-KR`):String(e??`—`)}function B({keepDetail:e=!1}={}){let t=document.getElementById(`mainContent`),n=[`admin`,`office`].includes(_),r=R(),i=r.find(e=>e.id===P)||r[0],a=e&&i&&i.id===P?document.getElementById(`bagDetail`):null;P=i?.id??null,t.innerHTML=`
    <section class="bag-workspace" data-role="${h(_)}">
      <header class="bag-page-heading"><h2>봉투 재고</h2>
        ${n?`<button type="button" id="btnBagManage" class="btn-secondary" aria-pressed="${I}">${I?`관리 끝내기`:`품목 관리`}</button>`:``}
      </header>
      <div class="bag-columns">
        <aside class="bag-catalog" aria-label="봉투 목록">
          <div class="bag-filters" role="group" aria-label="봉투 종류">
            ${[[`all`,`전체`],[`raw`,`생식`],[`freezeDry`,`동결건조`],[`inactive`,`비활성`]].map(([e,t])=>`<button type="button" data-bag-filter="${e}" aria-pressed="${e===F}">${t} <b>${R(e).length}</b></button>`).join(``)}
          </div>
          <div class="bag-catalog-heading"><strong>봉투명</strong><span>현재 재고 (장)</span></div>
          ${n&&I?`<div class="bag-manage-tools"><span>품목 관리</span><button type="button" class="btn-secondary" id="btnNewBag">+ 추가</button></div>`:``}
          <div id="bagList">${re(r)}</div>
        </aside>
        <section id="bagDetail" aria-label="선택 봉투 이력">
          ${i?``:`<p class="list-empty">이 종류에 등록된 봉투가 없습니다.</p>`}
        </section>
      </div>
    </section>`,a&&document.getElementById(`bagDetail`).replaceWith(a);for(let e of t.querySelectorAll(`[data-bag-filter]`))e.addEventListener(`click`,()=>{if(F===e.dataset.bagFilter)return;F=e.dataset.bagFilter;let n=B({keepDetail:!0});return t.querySelector(`[data-bag-filter][aria-pressed="true"]`).focus({preventScroll:!0}),n});if(document.getElementById(`btnBagManage`)?.addEventListener(`click`,()=>(I=!I,B())),document.getElementById(`btnNewBag`)?.addEventListener(`click`,me),se(),n&&I&&ie(),i&&!a)return K(i)}function re(e){return e.length?F===`inactive`?e.map(V).join(``):[[`raw`,`생식`,`bagListRaw`],[`freezeDry`,`동결건조`,`bagListFreezeDry`]].map(([t,n,r])=>{let i=e.filter(e=>e.category===t);return i.length?`<div class="bag-group-name">${n} <span>${i.length}</span></div>
      <div id="${r}" class="sortable-master-list" data-category="${t}">${i.map(V).join(``)}</div>`:``}).join(``):`<p class="list-empty">표시할 봉투가 없습니다.</p>`}function V(e){let t=I&&[`admin`,`office`].includes(_),n=e.active!==!1,r=e.id===P,i=Number(e.currentQty)<Number(e.minimumQty||0);return`<div class="recipe-list-item bag-row${r?` active`:``}" data-id="${h(e.id)}" data-category="${h(e.category)}">
    ${t&&n?`<span class="drag-handle" aria-label="순서 변경" title="순서 변경">≡</span>`:``}
    <button type="button" class="bag-pick" aria-pressed="${r}">
      <span class="bag-item-name">${h(e.name)}</span>
      <strong class="bag-item-qty${i?` bag-low`:``}" aria-label="현재 ${h(z(e.currentQty))}장">${h(z(e.currentQty))}</strong>
    </button>
    ${t?`<label class="toggle-switch" title="${n?`활성`:`비활성`}" onclick="event.stopPropagation()"><input type="checkbox" class="bag-active-toggle" aria-label="${h(e.name)} 활성" data-id="${h(e.id)}" ${n?`checked`:``}><span class="toggle-slider"></span></label>`:``}
  </div>`}function ie(){_!==`admin`&&_!==`office`||[[`bagListRaw`,`raw`],[`bagListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&T.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await ae(t)}})})}async function ae(e){return k(t=>oe(e,t))}async function oe(n,r){let i=document.getElementById(n===`raw`?`bagListRaw`:`bagListFreezeDry`);if(!i)return;let a=Array.from(i.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),o=j.filter(e=>e.category===`raw`).length,s=n===`freezeDry`?o:0,u=new Date,d=e(c);a.forEach((e,n)=>{d.update(t(c,`bagTypes`,e),{sortOrder:s+n,updatedAt:u})});try{if(await r.commit(d,{targets:a.map(e=>t(c,`bagTypes`,e))}),!r.isCurrent())return;let e=new Map(a.map((e,t)=>[e,s+t]));j=j.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:u}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)),await M({force:!0})}catch(e){console.error(`[bag] reorder save failed:`,e),alert(`순번 저장 실패: `+(l(e)||e));let t=await N();if(!r.isCurrent())return;j=t,await B()}}function se(){let n=document.getElementById(`bagList`);for(let e of n.querySelectorAll(`.bag-pick`))e.addEventListener(`click`,()=>{let t=e.closest(`.bag-row`),r=j.find(e=>e.id===t.dataset.id);if(!r||P===r.id)return;P=r.id;for(let e of n.querySelectorAll(`.bag-row`)){let n=e===t;e.classList.toggle(`active`,n),e.querySelector(`.bag-pick`).setAttribute(`aria-pressed`,String(n))}let i=K(r);return window.matchMedia?.(`(max-width:700px)`).matches&&document.getElementById(`bagDetail`).scrollIntoView({block:`start`}),i});document.querySelectorAll(`.bag-active-toggle`).forEach(n=>{n.addEventListener(`click`,e=>e.stopPropagation()),n.addEventListener(`change`,async n=>{if(_!==`admin`&&_!==`office`){alert(`봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.`),n.target.checked=!n.target.checked;return}let r=n.target.dataset.id,i=n.target.checked,a=j.find(e=>e.id===r),o=a?.active!==!1;try{await E(O,async n=>{let s=f(),l=e(c);l.update(t(c,`bagTypes`,r),{active:i,updatedAt:new Date}),o!==i&&await p({action:`bag`,subAction:`activeToggle`,date:g(),staff:Q(),message:`봉투 종류 ${i?`활성`:`비활성`} — ${a?.name||`봉투 품목명 확인 필요`}`,details:{bagTypeId:r,bagName:a?.name||null,active:i}},{batch:l}),await n.commit(l,{targets:[t(c,`bagTypes`,r)]}),a&&(a.active=i),!(s&&!s.isCurrent())&&await M({force:!0})})}catch(e){console.error(`[bag] active save failed:`,e),alert(l(e)||`활성 상태 저장 중 오류가 발생했습니다.`),n.target.checked=!i}})})}var H=!0;async function U(e,t=a){let l;if(H)try{l=await t(r(s(c,`bagLogs`),i(`bagTypeId`,`==`,e),o(`timestamp`,`desc`),n(30)))}catch(e){if(e.code!==`failed-precondition`)throw e;H=!1}l||=await t(r(s(c,`bagLogs`),i(`bagTypeId`,`==`,e)));let u=e=>e?.toMillis?.()??(e?.seconds?e.seconds*1e3:new Date(e).getTime()||0);return l.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.timestamp!==void 0).sort((e,t)=>u(t.timestamp)-u(e.timestamp)||t.id.localeCompare(e.id)).slice(0,30)}function W(e){return te(e,{incoming:`입고`,in:`입고`,out:`사용`,autoDeduct:`자동차감`,autoDeductReverse:`자동차감 복원`}[e.type]||`수동조정`)}function G(e){let t=String(e.note||e.reason||``);return e.type===`autoDeductReverse`?`생산 취소·복원`:/^동결제품 입고/.test(t)||e.sampleSetLogId?`동결제품 입고`:/^내일생산불러오기/.test(t)||e.type===`autoDeduct`&&e.executionId?`생산 불러오기`:/입고예정|입고 예정/.test(t)?`입고 예정`:e.type===`incoming`||e.type===`in`?`봉투 입고`:e.type===`adjust`||e.manualMovement?`수동조정`:`경로 미기록`}function ce(e,t){let n=W(e),r=e.qty??e.delta,i=r>0?`stock-quantity--increase`:r<0?`stock-quantity--decrease`:``,a=v(e.note||e.reason||e.manualMovement?.reason||`—`,`bagLogs`,t,W),o=Number.isFinite(e.before)&&Number.isFinite(e.after);return`<tr>
    <td>${h(e.date||`—`)}</td>
    <td><span class="tag stock-movement-badge" data-movement-label="${h(n)}">${h(n)}</span></td>
    <td class="bag-history-qty ${i}">${r>0?`+`:``}${h(z(r))}</td>
    <td>${h(G(e))}</td><td>${h(e.staffName||e.staff||`—`)}</td>
    <td class="bag-note">${h(a)}${o?`<details><summary>변경 전후</summary>${h(z(e.before))}장 → ${h(z(e.after))}장</details>`:``}</td>
  </tr>`}function le(e,t){let n=[...new Set(t.map(W))];e.innerHTML=`<div class="bag-history-heading"><h3>입출고·변동 이력</h3><span>최근 ${t.length}건</span>
    <div class="bag-history-filters">
      <select aria-label="이력 구분"><option value="">전체 구분</option>${n.map(e=>`<option value="${h(e)}">${h(e)}</option>`).join(``)}</select>
      <input type="search" aria-label="비고·담당자·처리 경로 검색" placeholder="비고·담당자·경로 검색">
    </div></div>
    <table class="bag-history-table"><thead><tr><th>날짜</th><th>구분</th><th>증감 (장)</th><th>처리 경로</th><th>담당자</th><th>비고·사유</th></tr></thead><tbody></tbody></table>
    <div class="bag-paging"><span aria-live="polite"></span><button type="button" class="btn-secondary" data-prev>이전</button><button type="button" class="btn-secondary" data-next>다음</button></div>`;let r=0,i=e.querySelector(`select`),a=e.querySelector(`input`),o=e.querySelector(`[data-prev]`),s=e.querySelector(`[data-next]`);function c(){let n=a.value.trim().toLowerCase(),c=t.filter(e=>i.value&&W(e)!==i.value?!1:n?`${v(e.note||e.reason||e.manualMovement?.reason||``,`bagLogs`,t,W)} ${e.staffName||e.staff||``} ${G(e)}`.toLowerCase().includes(n):!0),l=r*8,u=c.slice(l,l+8);e.querySelector(`tbody`).innerHTML=u.map(e=>ce(e,t)).join(``)||`<tr><td colspan="6">표시할 이력이 없습니다.</td></tr>`,e.querySelector(`.bag-paging span`).textContent=c.length?`${l+1}–${l+u.length} / ${c.length}건`:`0건`,o.disabled=r===0,s.disabled=l+u.length>=c.length}let l=()=>{r=0,c()};i.addEventListener(`change`,l),a.addEventListener(`input`,l),o.addEventListener(`click`,()=>{r--,c()}),s.addEventListener(`click`,()=>{r++,c()}),c()}async function K(e){let t=document.getElementById(`bagDetail`);if(!t?.isConnected||P!==e.id)return;let n=++L,r=Number(e.currentQty??0),i=Number(e.minimumQty??0),a=Number(e.piecesPerBox),o=r<=0?`empty`:r<i?`low`:`normal`,s=I&&[`admin`,`office`].includes(_);t.innerHTML=`<div class="bag-selected-card">
    <div class="bag-selected-heading"><div><span class="bag-category">${e.active===!1?`비활성`:e.category===`raw`?`생식`:`동결건조`}</span>
      <h3 class="detail-title">${h(e.name)}</h3></div><div class="bag-actions">
      ${s?`<button type="button" class="btn-secondary" id="btnEditBag">수정</button><button type="button" class="btn-danger" id="btnDeleteBag">삭제</button>`:``}
      <button type="button" class="btn-secondary" id="btnAdjustBag">수동조정</button><button type="button" class="btn-primary" id="btnAddBagIncoming">+ 입고 등록</button>
    </div></div>
    <div class="detail-body bag-balance"><span>현재 재고 <b>${h(z(e.currentQty??0))}</b>장</span>
      <span class="egg-status egg-status--${o}">${o===`empty`?`0장`:o===`low`?`부족`:`정상`}</span>
      <span>${a>0?`환산 ${h(z(Math.floor(r/a)))}박스분 + ${h(z(r%a))}장`:`박스 환산 기준 없음`}</span>
      <span>1박스 ${h(z(e.piecesPerBox))}장 · 최소 ${h(z(i))}장${i>0?` (기준 대비 ${r>=i?`+`:``}${h(z(r-i))}장)`:``}</span>
    </div></div><section class="bag-history"><p role="status">이력을 불러오는 중입니다.</p></section>`,t.querySelector(`#btnAddBagIncoming`).addEventListener(`click`,()=>J(e)),t.querySelector(`#btnAdjustBag`).addEventListener(`click`,()=>ge(e)),t.querySelector(`#btnEditBag`)?.addEventListener(`click`,()=>he(e)),t.querySelector(`#btnDeleteBag`)?.addEventListener(`click`,()=>fe(e));let c=t.querySelector(`.bag-history`);try{let t=await U(e.id);n===L&&c.isConnected&&P===e.id&&le(c,t)}catch(t){if(n!==L||!c.isConnected||P!==e.id)return;console.error(`[봉투 이력]`,t),c.innerHTML=`<p role="status">이력을 불러오지 못했습니다. <button type="button" class="btn-secondary">다시 불러오기</button></p>`,c.querySelector(`button`).addEventListener(`click`,()=>K(e))}}async function ue(e,t={getDocs:a}){let{getDocs:n}=t,[o,l,u]=await Promise.all([n(r(s(c,`recipes`),i(`bagTypeId`,`==`,e.id))),n(r(s(c,`frozenProducts`),i(`bagTypeId`,`==`,e.id))),n(r(s(c,`bagLogs`),i(`bagTypeId`,`==`,e.id)))]);return{linkedRecipes:o.docs.map(e=>({id:e.id,...e.data()})),linkedProducts:l.docs.map(e=>({id:e.id,...e.data()})),logDocs:u.docs}}function de(e,t){let n=Number(e.currentQty||0);return n>0?`${e.name} 재고 ${n}장이 남아있습니다.\n봉투 재고 및 이력 ${t}건이 모두 삭제됩니다.\n진행하시겠습니까?`:t>0?`입고/조정 이력 ${t}건이 함께 삭제됩니다.\n진행하시겠습니까?`:`${e.name} 봉투를 삭제하시겠습니까?`}async function fe(e){return k(t=>pe(e,t))}async function pe(n,r){if(_!==`admin`&&_!==`office`){alert(`봉투 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let{linkedRecipes:i,linkedProducts:a,logDocs:o}=await ue(n,r),s=[...i.map(e=>e.displayName||e.name||`레시피명 확인 필요`),...a.map(e=>e.name||`제품명 확인 필요`)];if(s.length>0){alert(`${s.join(`, `)}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);return}let l=o.length;if(!await d({title:`봉투 삭제`,message:de(n,l),confirmText:`삭제`,danger:!0}))return;if(o.length>498)throw Error(`삭제할 이력이 너무 많습니다. 관리자에게 문의해주세요.`);let u=e(c);if(u.delete(t(c,`bagTypes`,n.id)),o.forEach(e=>u.delete(t(c,`bagLogs`,e.id))),await p({action:`bag`,subAction:`delete`,date:g(),staff:Q(),message:`봉투 삭제 — ${n.name}`,details:{bagTypeId:n.id,bagName:n.name,bagType:n.category===`freezeDry`?`dried`:`raw`,currentQty:Number(n.currentQty||0),logCount:l}},{batch:u}),await r.commit(u,{targets:[t(c,`bagTypes`,n.id)]}),!r.isCurrent())return;P=null,await M({force:!0}),alert(`봉투가 삭제되었습니다.`)}catch(e){console.error(`[bag] delete failed:`,e),alert(l(e)||`봉투 삭제 중 오류가 발생했습니다.`)}}function me(){q(null)}function q(n){let r=!n;Z(`
    <h3 class="modal-title">${r?`봉투 추가`:`봉투 수정`}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${h(n?.name||``)}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${r?``:`disabled`}>
          <option value="">선택</option>
          <option value="raw" ${n?.category===`raw`?`selected`:``}>생식</option>
          <option value="freezeDry" ${n?.category===`freezeDry`?`selected`:``}>동결건조</option>
        </select>
      </div>
      <div class="form-group">
        <label>박스당 장수</label>
        <input type="number" id="m_piecesPerBox" min="0" step="1" value="${h(n?.piecesPerBox||``)}" placeholder="장" />
      </div>
      <div class="form-group">
        <label>최소재고(박스)</label>
        <input type="number" id="m_minBox" min="0" step="1" value="${h(n?.minimumBoxQty||``)}" placeholder="박스" />
      </div>
    </div>
    <p id="m_bagMinimumPreview" class="text-muted" aria-live="polite"></p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBag">${r?`추가`:`저장`}</button>
    </div>
  `);let i=()=>{let e=Number(document.getElementById(`m_piecesPerBox`).value),t=Number(document.getElementById(`m_minBox`).value);return[e,t,e*t].every(e=>Number.isSafeInteger(e)&&e>=0)?t>0&&e===0?{error:`최소재고를 환산하려면 박스당 장수를 입력해주세요.`}:{piecesPerBox:e,minBox:t}:{error:`박스당 장수와 최소재고는 0 이상의 정수로 입력해주세요.`}},a=()=>{let e=i();document.getElementById(`m_bagMinimumPreview`).textContent=e.error||`최소재고 ${e.minBox.toLocaleString()}박스 = ${(e.minBox*e.piecesPerBox).toLocaleString()}장${r?``:` · 현재 재고와 입출고 이력은 바뀌지 않습니다.`}`};for(let e of[`m_piecesPerBox`,`m_minBox`])document.getElementById(e).addEventListener(`input`,a);a(),document.getElementById(`btnSaveBag`).addEventListener(`click`,()=>k(async a=>{let o=e(c);if(_!==`admin`&&_!==`office`){alert(`봉투 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let l=document.getElementById(`m_bagName`).value.trim(),u=document.getElementById(`m_bagCategory`).value,d=i();if(d.error){alert(d.error);return}let{piecesPerBox:f,minBox:p}=d;if(!l||!u){alert(`봉투명과 종류는 필수입니다.`);return}let m={name:l,category:u,piecesPerBox:f,minimumBoxQty:p,minimumQty:p*f,sortOrder:r?j.length:n.sortOrder,active:r?!0:n.active!==!1,updatedAt:new Date},h=r?t(s(c,`bagTypes`)):t(c,`bagTypes`,n.id);r?(m.currentQty=0,m.createdAt=new Date,o.set(h,m)):o.update(h,m),await a.commit(o,{targets:[h]}),a.isCurrent()&&(closeModal(),await M({force:!0}),alert(r?`봉투 추가 완료!`:`수정 완료!`))}))}function he(e){q(e)}function J(e){Z(`
    <h3 class="modal-title">봉투 입고 등록 — ${h(e.name)}</h3>
    ${b({incoming:!0,reasonField:!1})}
    <div class="form-row">
      <div class="form-group">
        <label>수량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수 입력" />
      </div>
      <div class="form-group">
        <label>박스 환산</label>
        <span id="m_boxCalc" style="line-height:36px;font-size:12px;color:#888;">- 박스</span>
      </div>
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${g()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`lead`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBagIncoming">추가</button>
    </div>
  `),document.getElementById(`m_qty`).addEventListener(`input`,t=>{let n=parseInt(t.target.value)||0;document.getElementById(`m_boxCalc`).textContent=`${Math.floor(n/e.piecesPerBox)}박스`});let t=S({db:c,name:`bagLogs`,filter:{bagTypeId:e.id},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_note`)});document.getElementById(`btnSaveBagIncoming`).addEventListener(`click`,async()=>{let n=f(),r=x(t);if(!r)return;let i=parseInt(document.getElementById(`m_qty`).value),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!i||!a){alert(`수량과 날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await w(a)||n&&!n.isCurrent())return;let c=e.currentQty||0,l=r.kind===`test`?{approved:!0}:await C({itemId:`bagLogs:`+e.id,name:e.name,date:a,qty:i,unit:`장`,stage:`봉투`},()=>!n||n.isCurrent());if(!l.approved||n&&!n.isCurrent())return;let u=c+i;await A(e,{currentQty:u,updatedAt:new Date},{date:a,timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`incoming`,...l.review?{statsQuantityReview:l.review}:{},qty:i,before:c,after:u,staffName:o,note:s},{action:`bag`,subAction:`incoming`,date:a,staff:o,message:`봉투 입고 — ${e.name} +${i}장 / 담당: ${o}`,details:{bagTypeId:e.id,bagName:e.name,qty:i,before:c,after:u,note:s||null}},a,r)&&(n&&!n.isCurrent()||(closeModal(),await M({force:!0}),y(`입고 등록 완료!`)))})}function ge(e){Z(`
    <h3 class="modal-title">수동 재고 조정 — ${h(e.name)}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${h(e.currentQty||0)}장</p>
    ${b({incoming:!1,reasonField:!1})}
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);let t=S({db:c,name:`bagLogs`,filter:{bagTypeId:e.id},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=f(),r=x(t);if(!r)return;let i=document.getElementById(`m_adjustType`).value,a=parseInt(document.getElementById(`m_qty`).value),o=r.reason,s=document.getElementById(`m_staff`).value;if(!a||!s){alert(`조정량과 담당자는 필수입니다.`);return}let c=g();if(await w(c))return;let l=i===`plus`?a:-a,u=e.currentQty||0,d=u+l;if(d<0&&r.kind!==`test`){alert(`조정 후 잔량이 ${d}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${u}장에서 최대 ${u}장까지만 감소 가능합니다.`);return}let p={currentQty:d,updatedAt:new Date},m={date:g(),timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`adjust`,qty:l,before:u,after:d,staffName:s,reason:o},h=l>=0?`+`:``;await A(e,p,m,{action:`bag`,subAction:`adjust`,date:c,staff:s,message:`봉투 수동조정 — ${e.name} ${h}${l}장 / 사유: ${o} / 담당: ${s}`,details:{bagTypeId:e.id,bagName:e.name,delta:l,before:u,after:d,reason:o}},c,r)&&(n&&!n.isCurrent()||(closeModal(),await M({force:!0}),y(`조정 완료!`)))})}var Y={};function X(e){let t=``;for(let n of e)(Y[n]||[]).forEach(e=>{t+=`<option value="${h(e.name)}">${h(e.name)}</option>`});return t}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}function Q(){return _===`admin`?`대표`:_===`office`?`사무실`:_===`production`?`생산실`:`시스템`}u(`bag`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function $(e){let n=[`senior`,`lead`,`office`],[r,...i]=await Promise.all([N(e),...n.map(n=>e.getDoc(t(c,`staffGroups`,n)))]);return{bags:r,staff:Object.fromEntries(n.map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function _e({cacheOnly:e=!0}={}){return O.prepare?.(`default`,$,{cacheOnly:e})}export{_e as preparePage,M as renderBag};