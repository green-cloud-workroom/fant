const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/supplementRequests-XBkXxvbJ.js","assets/index-Bh9FXGZY.js","assets/firebase-BOShkvR0.js","assets/rolldown-runtime-lhHHWwHU.js","assets/index.esm-D8prxbkJ.js","assets/modal-5yNlUCJi.js","assets/modalManager-D53QKIlh.js","assets/staffText-DBRrEFyl.js","assets/index-C-8giyN6.css","assets/activityDisplay-DKUvzoas.js","assets/manualMovementLogic-QqxDPXEB.js"])))=>i.map(i=>d[i]);
import{b as e,c as t,d as n,g as r,s as i,u as a,y as o}from"./index.esm-D8prxbkJ.js";import{n as s}from"./firebase-BOShkvR0.js";import{i as c}from"./staffText-DBRrEFyl.js";import{n as l}from"./modalManager-D53QKIlh.js";import{A as u,S as d,lt as f,tt as p,ut as m,v as h,x as g}from"./index-Bh9FXGZY.js";import{o as ee}from"./manualMovementLogic-QqxDPXEB.js";import{t as te}from"./movementNote-mZSZ7bXO.js";import{t as _}from"./statusToast-B9R20x7w.js";import{i as v,n as y,r as b,t as x}from"./movementForm-DmFHTy5B.js";import{t as ne}from"./statsAutomationRuntime-CEwlVDfy.js";import{t as S}from"./readCommand-BxChJT5U.js";import{t as re}from"./pageRefresh-z5GoWSTh.js";import{o as ie,t as ae}from"./menuStaffGroups-DjYkTlmf.js";var C=h(`supplement`),w=null,T=`stock`;async function oe(){let e=u(),{mountSupplementRequests:t}=await g(async()=>{let{mountSupplementRequests:e}=await import(`./supplementRequests-XBkXxvbJ.js`);return{mountSupplementRequests:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));if(e&&!e.isCurrent())return;let n=document.getElementById(`supplementRequestsHost`);n&&(w?.(),document.getElementById(`supplementStockHost`).hidden=!0,n.hidden=!1,T=`requests`,B(),w=t(n,{types:O,loadStocks:async()=>{let e=await C.load(z,{force:!0});if(!e)throw Error(`재고 조회가 변경되었습니다. 신청 창을 다시 열어주세요.`);return e.stocks},staffOptions:Me([`office`]).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``),incoming:async(t,{date:r,staffName:i,selection:a,extraWrites:o})=>{if(e&&!e.isCurrent()||!n.isConnected||!await C.load(z,{force:!0})||e&&!e.isCurrent()||!n.isConnected)throw Error(`화면이 변경됐습니다.`);return Te(t.supplementTypeId,r,t.qty,i,a,o)},onStockChanged:()=>C.invalidate?.()}))}var se=14,E=10,D=5,O=[],k=[],A=[],j=`all`,M=``,N=``,P={},F=null,I=``,L=``;async function R({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;let n=await C.load(z,{force:e,onChange:re(C,R,{draftSelector:`.supplement-page`})});!n||!t.isConnected||([O,k,A]=[n.types,n.stocks,n.logs],F=n.groups,P=n.staff,E=Number(n.values.supplementThresholdYellow)||10,D=Number(n.values.supplementThresholdRed)||5,ue())}function ce({cacheOnly:e=!0}={}){return C.prepare?.(`default`,z,{cacheOnly:e})}async function z(t){let i=le().at(-1),c=[`senior`,`lead`,`office`],[l,u,d,f,p,...m]=await Promise.all([t.getDocs(n(o(s,`supplementTypes`),a(`sortOrder`))),t.getDocs(o(s,`supplementStock`)),t.getDocs(n(o(s,`supplementLogs`),r(`date`,`>=`,i))),t.getDoc(e(s,`settings`,`menuStaffGroups`)),t.getDoc(e(s,`settings`,`systemValues`)),...c.map(n=>t.getDoc(e(s,`staffGroups`,n)))]),h=e=>e.docs.map(e=>({id:e.id,...e.data()}));return{types:h(l),stocks:h(u),logs:h(d).sort((e,t)=>e.date===t.date?(t.timestamp?.seconds||0)-(e.timestamp?.seconds||0):e.date<t.date?1:-1),groups:{...ae,...f.exists()?f.data():{}},values:{...ie,...p.exists()?p.data():{}},staff:Object.fromEntries(c.map((e,t)=>[e,m[t].exists()&&m[t].data().members||[]]))}}function le(){let e=p(),t=new Date(`${e}T00:00:00`),n=[];for(let e=0;e<se;e++){let r=new Date(t);r.setDate(t.getDate()-e);let i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`);n.push(`${i}-${a}-${o}`)}return n}function B(){document.getElementById(`supplementStockTab`)?.setAttribute(`aria-pressed`,String(T===`stock`)),document.getElementById(`supplementRequestsTab`)?.setAttribute(`aria-pressed`,String(T===`requests`))}function ue(){let e=document.getElementById(`mainContent`);w?.(),w=null,e.innerHTML=`
    <div class="supplement-page">
      <nav class="supplement-subnav" aria-label="영양제 하위 메뉴"><button class="btn-secondary" id="supplementStockTab">영양제 재고</button><button class="btn-secondary" id="supplementRequestsTab">영양제 신청</button></nav>
      <div id="supplementRequestsHost" hidden></div>
      <div id="supplementStockHost">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <label class="supplement-search-label">품목 검색 <input id="supplementSearch" type="search" value="${$(M)}" placeholder="제품명 또는 단위" /></label>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${j===`all`?`selected`:``}>전체</option>
            <option value="warning" ${j===`warning`?`selected`:``}>${E}봉 미만만</option>
            <option value="danger" ${j===`danger`?`selected`:``}>${D}봉 미만만</option>
          </select>
          <button class="btn-secondary" id="btnSupplementExcel">엑셀 다운로드</button>
          <button class="btn-secondary" id="btnSupplementAllLogs">전체보기</button>
          <button class="btn-secondary" id="btnSupplementRefresh">새로고침</button>
        </div>
      </div>

      <div class="supplement-table-wrap" id="supplementTableWrap">
        ${K()}
      </div>
      </div>
    </div>
  `,B(),Se(),document.getElementById(`supplementRequestsTab`)?.addEventListener(`click`,()=>oe().catch(e=>alert(c(e)))),document.getElementById(`supplementStockTab`)?.addEventListener(`click`,async()=>{w?.(),w=null,T=`stock`,await R({force:!0})}),T===`requests`&&oe().catch(e=>alert(c(e)))}function V(e){let t=k.find(t=>t.id===e||t.supplementTypeId===e);return Number(t?.currentQty||0)}function de(e){return O.find(t=>t.id===e)?.name||`영양제 품목명 확인 필요`}function H(){return O.filter(e=>{if(e.active===!1)return!0;let t=V(e.id);return j===`warning`?t<E:j===`danger`?t<D:!0})}async function fe(){let e=await g(()=>import(`./spreadsheet-BNhIIvo9.js`),[]),t=H();if(t.length===0){alert(`다운로드할 영양제 SKU가 없습니다.`);return}let n=[[`영양제 SKU`,`재고`,`영양제 SKU`,`재고`]];for(let e=0;e<t.length;e+=2){let r=t[e],i=t[e+1];n.push([r?.name||r?.id||``,r?`${V(r.id)}봉`:``,i?.name||i?.id||``,i?`${V(i.id)}봉`:``])}let r=e.utils.aoa_to_sheet(n);r[`!cols`]=[{wch:34},{wch:10},{wch:34},{wch:10}];let i=e.utils.book_new();e.utils.book_append_sheet(i,r,`영양제재고`),e.writeFile(i,`영양제재고_${p().replaceAll(`-`,``)}.xlsx`)}function U(e){let t=Number(e.unit);return Number.isFinite(t)?t:0}function W(e){let t=Number(e.sortOrder);return Number.isFinite(t)?Math.floor(t/100):999999}function pe(e){let t=new Map;for(let n of e){let e=n.recipeId||`__ungrouped_${n.id}`;t.has(e)||t.set(e,{recipeId:e,recipeName:n.recipeName||n.name||`영양제 품목명 확인 필요`,sortOrder:W(n),types:[]});let r=t.get(e);r.types.push(n),r.sortOrder=Math.min(r.sortOrder,W(n)),n.recipeName&&(r.recipeName=n.recipeName)}return[...t.values()].map(e=>({...e,types:e.types.sort((e,t)=>U(e)-U(t))})).sort((e,t)=>e.sortOrder-t.sortOrder||e.recipeName.localeCompare(t.recipeName))}function G(e){return e.reduce((e,t)=>{let n=V(t.id);return e.totalStock+=n,t.active!==!1&&n<D?e.danger+=1:t.active!==!1&&n<E&&(e.warning+=1),e},{totalStock:0,danger:0,warning:0})}function me(e){return A.find(t=>t.supplementTypeId===e)}function he(e,t){return t?{label:`비활성`,className:`supplement-status--inactive`}:e<D?{label:`부족`,className:`supplement-status--danger`}:e<E?{label:`주의`,className:`supplement-status--warning`}:{label:`정상`,className:`supplement-status--normal`}}function ge(e,t){let n=he(e,t),r=!t&&e===0,i=r?`egg-status--empty`:n.className===`supplement-status--danger`?`egg-status--low`:n.className===`supplement-status--warning`?`egg-status--warning`:``;return`<span class="supplement-status ${n.className} egg-status ${i}">${r?`0개`:n.label}</span>`}function _e(e){let t=me(e);if(!t)return`<span class="supplement-muted">-</span>`;let n=Number.isFinite(Number(t.after))?` / 잔량 ${Number(t.after)}봉`:``;return`
    <div class="supplement-recent-change">
      <span class="supplement-recent-date">${$(t.date||`-`)}</span>
      ${q(t.type,t,!0)}
      <span class="supplement-recent-qty ${Number(t.qty)<0?`stock-quantity--decrease`:Number(t.qty)>0?`stock-quantity--increase`:``}">${Ne(t.qty)}</span><span class="supplement-muted">${n}</span>
    </div>
  `}function ve(e){let t=V(e.id),n=e.active===!1,r=n?``:t<D?`supplement-qty--danger`:t<E?`supplement-qty--warning`:``;return`
    <tr class="${n?`supplement-row--inactive`:``}">
      <td class="supplement-td-name">
        <span title="${$(e.name||`영양제 품목명 확인 필요`)}">${$(e.unit??e.name??`단위 확인 필요`)}</span>
        ${n?`<span class="tag tag-inactive">비활성</span>`:``}
      </td>
      <td class="supplement-td-qty ${r} ${t===0?`supplement-qty--empty`:``}">${t}봉</td>
      <td class="supplement-td-status">${ge(t,n)}</td>
      <td class="supplement-td-actions">
        ${!n&&be()?`<button class="btn-secondary supplement-action-in" data-id="${$(e.id)}" data-name="${$(e.name||`영양제 품목명 확인 필요`)}">입고</button>`:``}
        ${!n&&ye()?`<button class="btn-secondary supplement-action-adjust" data-id="${$(e.id)}" data-name="${$(e.name||`영양제 품목명 확인 필요`)}">수동조정</button>`:``}
      </td>
    </tr>
  `}function ye(){return m===`admin`||m===`office`}function be(){return m===`admin`||m===`office`||m===`production`}function K(){let e=M.trim().toLocaleLowerCase().split(/\s+/),t=H().filter(t=>e.every(e=>`${t.recipeName||``} ${t.name||``} ${t.unit??``}`.toLocaleLowerCase().includes(e)));if(!O.length)return`<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>`;if(!t.length)return`<div class="list-empty">검색·필터 조건에 맞는 영양제가 없습니다.</div>`;let n=pe(t),r=n.find(e=>e.recipeId===N)||n[0];N=r.recipeId;let i=G(r.types);return`<div class="supplement-workspace">
    <aside class="supplement-picker" aria-label="영양제 제품 선택">
      <div class="supplement-panel-heading"><strong>제품</strong><span>${n.length}개 · ${t.length}품목</span></div>
      <select class="supplement-mobile-picker" data-recipe-select aria-label="작업할 제품">${n.map(e=>`<option value="${$(e.recipeId)}" ${e===r?`selected`:``}>${$(e.recipeName)}</option>`).join(``)}</select>
      <div class="supplement-picker-grid">${n.map(e=>{let t=G(e.types),n=t.danger+t.warning;return`<button type="button" class="supplement-pick" data-recipe="${$(e.recipeId)}" aria-pressed="${e===r}" title="${$(e.recipeName)} · ${e.types.length}품목${n?` · 부족·주의 ${n}품목`:``}"><span>${$(e.recipeName)}</span><small class="${n?`supplement-pick-alert`:``}">${n?`! ${n}`:e.types.length}</small></button>`}).join(``)}</div>
      <p class="supplement-picker-note">숫자: 단위 수 · !: 부족·주의 단위 수</p>
    </aside>
    <section class="supplement-work-detail" aria-label="선택 제품 재고">
      <div class="supplement-panel-heading"><strong>${$(r.recipeName)}</strong><span>${r.types.length}품목 · 합계 ${i.totalStock}봉</span></div>
      <table class="supplement-table supplement-work-table"><thead><tr><th>생산 단위</th><th>현재 재고</th><th>상태</th><th>작업</th></tr></thead><tbody>${r.types.map(ve).join(``)}</tbody></table>
      <details class="supplement-recent-panel"><summary>최근 변동 · ${se}일</summary><div class="supplement-recent-list">${r.types.map(e=>`<div><strong>${$(e.unit??e.name)}</strong>${_e(e.id)}</div>`).join(``)}</div></details>
    </section>
  </div>`}function xe(e){return e.length===0?`<div class="list-empty supplement-log-empty">이력이 없습니다</div>`:`
    <table class="data-table supplement-log-table">
      <thead>
        <tr>
          <th>날짜</th>
          <th>시간</th>
          <th>SKU</th>
          <th>유형</th>
          <th>수량</th>
          <th>잔량</th>
          <th>담당자</th>
          <th>사유·비고</th>
        </tr>
      </thead>
      <tbody>
        ${e.map(e=>`
          <tr>
            <td>${$(e.date||`-`)}</td>
            <td>${Pe(e.timestamp)}</td>
            <td>${$(de(e.supplementTypeId))}</td>
            <td>${q(e.type,e)}</td>
            <td style="color:${Number(e.qty||0)<0?`#e53e3e`:`#2d7a3a`}">${Ne(e.qty)}</td>
            <td>${Number.isFinite(Number(e.after))?Number(e.after):`-`}</td>
            <td>${$(e.staffName||`-`)}</td>
            <td>${$(te([e.reason,e.note].filter(Boolean).join(` / `)||`-`,`supplementLogs`,A,e=>({in:`입고`,autoDeduct:`자동차감`,adjust:`수동조정`})[e.type]||e.type||`-`))}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function q(e,t,n=!1){if(n){let n=ee(t,{in:`입고`,autoDeduct:`자동차감`,adjust:`수동조정`}[e]||`작업 구분 확인 필요`);return`<span class="tag stock-movement-badge" data-movement-label="${$(n)}">${$(n)}</span>`}return t?.manualMovement?`<span class="tag tag-common">${$(ee(t,e))}</span>`:e===`in`?`<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>`:e===`autoDeduct`?`<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>`:e===`adjust`?`<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>`:`<span class="tag tag-common">${$(e||`-`)}</span>`}function Se(){document.getElementById(`btnSupplementRefresh`)?.addEventListener(`click`,async()=>{await d()&&await R({force:!0})}),document.getElementById(`supplementSearch`)?.addEventListener(`input`,e=>{M=e.target.value,e.target.defaultValue=e.target.value,document.getElementById(`supplementTableWrap`).innerHTML=K(),J()}),document.getElementById(`supplementFilter`)?.addEventListener(`change`,e=>{j=e.target.value;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=K()),J()}),document.getElementById(`btnSupplementAllLogs`)?.addEventListener(`click`,Ae),document.getElementById(`btnSupplementExcel`)?.addEventListener(`click`,fe),document.getElementById(`supplementInStaff`)?.addEventListener(`change`,e=>{e.target.value}),document.getElementById(`supplementAdjustStaff`)?.addEventListener(`change`,e=>{I=e.target.value}),document.getElementById(`supplementAdjustReason`)?.addEventListener(`input`,e=>{L=e.target.value}),J()}function J(){let e=e=>{N=e;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=K(),J())};document.querySelectorAll(`[data-recipe]`).forEach(t=>t.addEventListener(`click`,()=>{e(t.dataset.recipe),[...document.querySelectorAll(`[data-recipe]`)].find(e=>e.dataset.recipe===N)?.focus()})),document.querySelector(`[data-recipe-select]`)?.addEventListener(`change`,t=>{e(t.target.value),document.querySelector(`[data-recipe-select]`)?.focus()}),document.querySelectorAll(`.supplement-action-in`).forEach(e=>{e.addEventListener(`click`,()=>Z(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-action-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Ce(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-cell-input[data-cell="in"]`).forEach(e=>{e.addEventListener(`blur`,e=>we(e.target))}),document.querySelectorAll(`.supplement-cell-input[data-cell="adjust"]`).forEach(e=>{e.addEventListener(`blur`,e=>De(e.target))}),document.querySelectorAll(`.supplement-add-in`).forEach(e=>{e.addEventListener(`click`,()=>{let t=O.find(t=>t.id===e.dataset.id);Z(e.dataset.id,t?.name||e.dataset.id,e.dataset.date)})})}function Y(e){return Me(je(e)).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``)}async function X(){let e=u(),t=[...document.querySelectorAll(`.supplement-cell-input`)].filter(e=>e.value).map(e=>({type:e.dataset.typeId,date:e.dataset.date,cell:e.dataset.cell,value:e.value}));if(await R({force:!0}),!(e&&!e.isCurrent()))for(let e of document.querySelectorAll(`.supplement-cell-input`)){let n=t.find(t=>t.type===e.dataset.typeId&&t.date===e.dataset.date&&t.cell===e.dataset.cell);n&&(e.value=n.value)}}function Z(e,t,n=p(),r=null){Q(`
    <h3 class="modal-title">영양제 입고 — ${$(t)}</h3>
    ${y({incoming:!0,reasonField:!0})}
    <div class="form-group">
      <label>수량(봉) *</label>
      <input type="number" id="sup_in_qty" min="1" step="1" placeholder="봉 수" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="sup_in_staff">
        <option value="">선택</option>
        ${Y(`supplementStockIn`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupIn">저장</button>
    </div>
  `);let i=x({db:s,name:`supplementLogs`,filter:{supplementTypeId:e},onCancel:e=>{document.getElementById(`sup_adj_qty`).value=e},reasonInput:document.getElementById(`sup_adj_reason`)});r!==null&&(document.getElementById(`sup_in_qty`).value=r),document.getElementById(`btnSaveSupIn`)?.addEventListener(`click`,async()=>{let t=b(i);if(!t)return;let r=Number(document.getElementById(`sup_in_qty`)?.value||``),a=document.getElementById(`sup_in_staff`)?.value||``;if(!Number.isFinite(r)||r<=0||!Number.isInteger(r)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}if(!a){alert(`입고 담당자를 선택해주세요.`);return}let o=document.getElementById(`btnSaveSupIn`);o.disabled=!0;try{let i=u();if(await Te(e,n,r,a,t),i&&!i.isCurrent())return;closeModal(),await X(),_(`입고 완료`)}catch(e){console.error(`[supplement] incoming modal save failed:`,e),alert(`입고 등록 중 오류가 발생했습니다: ${c(e)||e}`),o.disabled=!1}})}function Ce(e,t,n=p(),r=null){Q(`
    <h3 class="modal-title">영양제 수동조정 — ${$(t)}</h3>
    ${y({incoming:!1,reasonField:!1})}
    <div class="form-group">
      <label>증감(봉) *</label>
      <input type="number" id="sup_adj_qty" step="1" placeholder="증가: +5  감소: -3" />
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="sup_adj_reason" maxlength="200" placeholder="사유" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="sup_adj_staff">
        <option value="">선택</option>
        ${Y(`supplementAdjust`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupAdj">저장</button>
    </div>
  `);let i=x({db:s,name:`supplementLogs`,filter:{supplementTypeId:e},onCancel:e=>{document.getElementById(`sup_adj_qty`).value=e},reasonInput:document.getElementById(`sup_adj_reason`)});r!==null&&(document.getElementById(`sup_adj_qty`).value=r),document.getElementById(`btnSaveSupAdj`)?.addEventListener(`click`,async()=>{let t=b(i);if(!t)return;let r=Number(document.getElementById(`sup_adj_qty`)?.value||``),a=t.kind===`usage`?-Math.abs(r):t.kind===`receipt`?Math.abs(r):r,o=t.reason,s=document.getElementById(`sup_adj_staff`)?.value||``;if(!Number.isFinite(a)||a===0||!Number.isInteger(a)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`);return}if(!s){alert(`수동조정 담당자를 선택해주세요.`);return}let l=document.getElementById(`btnSaveSupAdj`);l.disabled=!0;try{let r=u();if(await Oe(e,n,a,o,s,t),r&&!r.isCurrent())return;closeModal(),await X(),_(`조정 완료`)}catch(e){console.error(`[supplement] adjust modal save failed:`,e),e.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${c(e)||e}`),l.disabled=!1}})}async function we(e){let t=e.value.trim();if(!t)return;let n=Number(t);if(!Number.isInteger(n)||n<=0){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}e.value=``;let r=O.find(t=>t.id===e.dataset.typeId);Z(e.dataset.typeId,r?.name||e.dataset.typeId,e.dataset.date,n)}async function Te(e,t,n,r,i,a){return S(C,o=>Ee(e,t,n,r,o,i,a),{roles:[`admin`,`office`,`production`]})}async function Ee(e,t,n,r,i,a,o){if(!a)throw Error(`처리 구분을 선택해주세요.`);let c=a.kind===`test`?{approved:!0}:await ne({itemId:`supplementLogs:`+e,date:t,qty:n,unit:`봉`,stage:`영양제`},()=>!u()||u().isCurrent());if(!c.approved)throw Error(`입고 저장을 취소했습니다.`);return v({db:s,command:i,extraWrites:o,name:`supplementLogs`,stockId:e,selection:a,uid:f?.uid||null,supplementName:O.find(t=>t.id===e)?.name,stockData:{id:e,supplementTypeId:e,currentQty:0},log:{type:`in`,date:t,qty:n,supplementTypeId:e,staffName:r,...c.review?{statsQuantityReview:c.review}:{}}})}async function De(e){let t=e.value.trim();if(!t)return;let n=Number(t);if(!Number.isInteger(n)||n===0){alert(`0이 아닌 정수를 입력해주세요.`);return}e.value=``;let r=O.find(t=>t.id===e.dataset.typeId);Ce(e.dataset.typeId,r?.name||e.dataset.typeId,e.dataset.date,n);let i=document.getElementById(`sup_adj_reason`),a=document.getElementById(`sup_adj_staff`);i&&(i.value=L||``),a&&(a.value=I||``)}async function Oe(e,t,n,r,i,a){return S(C,o=>ke(e,t,n,r,i,o,a),{roles:[`admin`,`office`]})}async function ke(e,t,n,r,i,a,o){return v({db:s,command:a,name:`supplementLogs`,stockId:e,selection:o,uid:f?.uid||null,supplementName:O.find(t=>t.id===e)?.name,stockData:{id:e,supplementTypeId:e,currentQty:0},log:{type:`adjust`,date:t,qty:n,supplementTypeId:e,reason:r,staffName:i}})}async function Ae(){Q(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${xe((await i(n(o(s,`supplementLogs`),a(`timestamp`,`desc`),t(200)))).docs.map(e=>({id:e.id,...e.data()})))}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,`modal-wide`)}function Q(e,t=``){let n=document.querySelector(`.modal-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`modalOverlay`,r.className=`modal-overlay`,r.innerHTML=`<div class="modal-box ${t}">${e}</div>`,document.body.appendChild(r),r.addEventListener(`click`,e=>{e.target===r&&closeModal()})}l(`supplement`,function(){document.querySelector(`.modal-overlay`)?.remove()});function je(e){let t=F?.[e];return Array.isArray(t)&&t.length>0?t:[]}function Me(e){let t=new Map;return e.forEach(e=>{(P[e]||[]).forEach(e=>{e?.name&&!t.has(e.name)&&t.set(e.name,e)})}),Array.from(t.values())}function Ne(e){let t=Number(e||0);return`${t>0?`+`:``}${t}`}function Pe(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return Number.isNaN(t.getTime())?`-`:t.toLocaleTimeString(`ko-KR`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})}function $(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}export{ce as preparePage,R as renderSupplement};