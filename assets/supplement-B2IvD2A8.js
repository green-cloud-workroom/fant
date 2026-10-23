import{b as e,c as t,d as n,g as r,s as i,u as a,y as o}from"./index.esm-CWp5uCwe.js";import{n as s}from"./firebase-Bm8Fqw4J.js";import{r as c}from"./pageLifecycle-_b6L3DA3.js";import{n as l}from"./modalManager-D53QKIlh.js";import{G as u,L as d,W as f,f as p,g as m,h}from"./index-Db-fHZZ2.js";import{o as ee}from"./manualMovementLogic-CyiPHR26.js";import{i as g,n as _,r as v,t as y}from"./movementForm-CpqURIA-.js";import{t as te}from"./statsAutomationRuntime-DF8wRGpR.js";import{t as b}from"./readCommand-CdhxqzcL.js";import{t as ne}from"./pageRefresh-BRFW7OkF.js";import{o as re,t as ie}from"./menuStaffGroups-CFYoumXb.js";var x=p(`supplement`),ae=14,S=10,C=5,w=[],T=[],E=[],D=`all`,O={},k=null,A=``,j=``;async function M({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;let n=await x.load(N,{force:e,onChange:ne(x,M,{draftSelector:`.supplement-page`})});!n||!t.isConnected||([w,T,E]=[n.types,n.stocks,n.logs],k=n.groups,O=n.staff,S=Number(n.values.supplementThresholdYellow)||10,C=Number(n.values.supplementThresholdRed)||5,ce())}function oe({cacheOnly:e=!0}={}){return x.prepare?.(`default`,N,{cacheOnly:e})}async function N(t){let i=se().at(-1),c=[`senior`,`lead`,`office`],[l,u,d,f,p,...m]=await Promise.all([t.getDocs(n(o(s,`supplementTypes`),a(`sortOrder`))),t.getDocs(o(s,`supplementStock`)),t.getDocs(n(o(s,`supplementLogs`),r(`date`,`>=`,i))),t.getDoc(e(s,`settings`,`menuStaffGroups`)),t.getDoc(e(s,`settings`,`systemValues`)),...c.map(n=>t.getDoc(e(s,`staffGroups`,n)))]),h=e=>e.docs.map(e=>({id:e.id,...e.data()}));return{types:h(l),stocks:h(u),logs:h(d).sort((e,t)=>e.date===t.date?(t.timestamp?.seconds||0)-(e.timestamp?.seconds||0):e.date<t.date?1:-1),groups:{...ie,...f.exists()?f.data():{}},values:{...re,...p.exists()?p.data():{}},staff:Object.fromEntries(c.map((e,t)=>[e,m[t].exists()&&m[t].data().members||[]]))}}function se(){let e=d(),t=new Date(`${e}T00:00:00`),n=[];for(let e=0;e<ae;e++){let r=new Date(t);r.setDate(t.getDate()-e);let i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`);n.push(`${i}-${a}-${o}`)}return n}function ce(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <span class="supplement-toolbar-title">영양제 재고</span>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${D===`all`?`selected`:``}>전체</option>
            <option value="warning" ${D===`warning`?`selected`:``}>${S}봉 미만만</option>
            <option value="danger" ${D===`danger`?`selected`:``}>${C}봉 미만만</option>
          </select>
          <button class="btn-secondary" id="btnSupplementExcel">엑셀 다운로드</button>
          <button class="btn-secondary" id="btnSupplementAllLogs">전체보기</button>
          <button class="btn-secondary" id="btnSupplementRefresh">새로고침</button>
        </div>
      </div>

      <div class="supplement-table-wrap" id="supplementTableWrap">
        ${U()}
      </div>
    </div>
  `,ve()}function P(e){let t=T.find(t=>t.id===e||t.supplementTypeId===e);return Number(t?.currentQty||0)}function le(e){return w.find(t=>t.id===e)?.name||e||`-`}function F(){return w.filter(e=>{if(e.active===!1)return!0;let t=P(e.id);return D===`warning`?t<S:D===`danger`?t<C:!0})}async function ue(){let e=await h(()=>import(`./spreadsheet-BI1bvlp9.js`),[]),t=F();if(t.length===0){alert(`다운로드할 영양제 SKU가 없습니다.`);return}let n=[[`영양제 SKU`,`재고`,`영양제 SKU`,`재고`]];for(let e=0;e<t.length;e+=2){let r=t[e],i=t[e+1];n.push([r?.name||r?.id||``,r?`${P(r.id)}봉`:``,i?.name||i?.id||``,i?`${P(i.id)}봉`:``])}let r=e.utils.aoa_to_sheet(n);r[`!cols`]=[{wch:34},{wch:10},{wch:34},{wch:10}];let i=e.utils.book_new();e.utils.book_append_sheet(i,r,`영양제재고`),e.writeFile(i,`영양제재고_${d().replaceAll(`-`,``)}.xlsx`)}function I(e){let t=Number(e.unit);return Number.isFinite(t)?t:0}function L(e){let t=Number(e.sortOrder);return Number.isFinite(t)?Math.floor(t/100):999999}function de(e){let t=new Map;for(let n of e){let e=n.recipeId||`__ungrouped_${n.id}`;t.has(e)||t.set(e,{recipeId:e,recipeName:n.recipeName||n.name||e,sortOrder:L(n),types:[]});let r=t.get(e);r.types.push(n),r.sortOrder=Math.min(r.sortOrder,L(n)),n.recipeName&&(r.recipeName=n.recipeName)}return[...t.values()].map(e=>({...e,types:e.types.sort((e,t)=>I(e)-I(t))})).sort((e,t)=>e.sortOrder-t.sortOrder||e.recipeName.localeCompare(t.recipeName))}function R(e){return e.reduce((e,t)=>{let n=P(t.id);return e.totalStock+=n,t.active!==!1&&n<C?e.danger+=1:t.active!==!1&&n<S&&(e.warning+=1),e},{totalStock:0,danger:0,warning:0})}function z(e,t,n){return E.filter(r=>r.supplementTypeId===e&&r.date===t&&r.type===n).reduce((e,t)=>e+Number(t.qty||0),0)}function B(e){return E.find(t=>t.supplementTypeId===e)}function V(e,t){return t?{label:`비활성`,className:`supplement-status--inactive`}:e<C?{label:`부족`,className:`supplement-status--danger`}:e<S?{label:`주의`,className:`supplement-status--warning`}:{label:`정상`,className:`supplement-status--normal`}}function H(e,t){let n=V(e,t);return`<span class="supplement-status ${n.className}">${n.label}</span>`}function fe(e){let t=B(e);if(!t)return`<span class="supplement-muted">-</span>`;let n=Number.isFinite(Number(t.after))?` / 잔량 ${Number(t.after)}봉`:``;return`
    <div class="supplement-recent-change">
      <span class="supplement-recent-date">${$(t.date||`-`)}</span>
      ${W(t.type,t)}
      <span class="supplement-recent-qty">${Q(t.qty)}${n}</span>
    </div>
  `}function pe(e){let t=P(e.id),n=e.active===!1,r=n?``:t<C?`supplement-qty--danger`:t<S?`supplement-qty--warning`:``;return`
    <tr class="${n?`supplement-row--inactive`:``}">
      <td class="supplement-td-name">
        ${$(e.name||e.id)}
        ${n?`<span class="tag tag-inactive">비활성</span>`:``}
      </td>
      <td class="supplement-td-qty ${r}">${t}봉</td>
      <td class="supplement-td-status">${H(t,n)}</td>
      <td class="supplement-td-recent">${fe(e.id)}</td>
      <td class="supplement-td-actions">
        ${!n&&ge()?`<button class="btn-secondary supplement-action-in" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">입고</button>`:``}
        ${!n&&he()?`<button class="btn-secondary supplement-action-adjust" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">수동조정</button>`:``}
      </td>
    </tr>
  `}function me(e){let t=R(e.types),n=t.danger>0||t.warning>0,r=[t.danger>0?`부족 ${t.danger}`:``,t.warning>0?`주의 ${t.warning}`:``].filter(Boolean).join(` · `);return`
    <details class="supplement-recipe-group"${D===`all`?``:` open`} data-recipe-id="${$(e.recipeId)}">
      <summary class="supplement-recipe-header ${n?`supplement-recipe-header--has-alert`:``}">
        <span class="recipe-name">${$(e.recipeName)}</span>
        <span class="preset-count">${e.types.length} 프리셋</span>
        <span class="total-stock">합계 ${t.totalStock}봉</span>
        ${n?`<span class="alert-summary">⚠ ${r}</span>`:``}
      </summary>
      <div class="supplement-list">
        <table class="supplement-table">
          <thead>
            <tr>
              <th class="supplement-th-name">영양제 SKU</th>
              <th class="supplement-th-qty">현재 재고</th>
              <th class="supplement-th-status">상태</th>
              <th class="supplement-th-recent">최근 변동</th>
              <th class="supplement-th-actions">작업</th>
            </tr>
          </thead>
          <tbody>
            ${e.types.map(e=>pe(e)).join(``)}
          </tbody>
        </table>
      </div>
    </details>
  `}function he(){return u===`admin`||u===`office`}function ge(){return u===`admin`||u===`office`||u===`production`}function U(){let e=F();return w.length===0?`<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>`:e.length===0?`<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>`:`
    <div class="supplement-recipe-groups">
      ${de(e).map(e=>me(e)).join(``)}
    </div>
  `}function _e(e){return e.length===0?`<div class="list-empty supplement-log-empty">이력이 없습니다</div>`:`
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
            <td>${De(e.timestamp)}</td>
            <td>${$(le(e.supplementTypeId))}</td>
            <td>${W(e.type,e)}</td>
            <td style="color:${Number(e.qty||0)<0?`#e53e3e`:`#2d7a3a`}">${Q(e.qty)}</td>
            <td>${Number.isFinite(Number(e.after))?Number(e.after):`-`}</td>
            <td>${$(e.staffName||`-`)}</td>
            <td>${$([e.reason,e.note].filter(Boolean).join(` / `)||`-`)}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function W(e,t){return t?.manualMovement?`<span class="tag tag-common">${$(ee(t,e))}</span>`:e===`in`?`<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>`:e===`autoDeduct`?`<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>`:e===`adjust`?`<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>`:`<span class="tag tag-common">${$(e||`-`)}</span>`}function ve(){document.getElementById(`btnSupplementRefresh`)?.addEventListener(`click`,async()=>{await m()&&await M({force:!0})}),document.getElementById(`supplementFilter`)?.addEventListener(`change`,e=>{D=e.target.value;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=U()),G()}),document.getElementById(`btnSupplementAllLogs`)?.addEventListener(`click`,X),document.getElementById(`btnSupplementExcel`)?.addEventListener(`click`,ue),document.getElementById(`supplementInStaff`)?.addEventListener(`change`,e=>{e.target.value}),document.getElementById(`supplementAdjustStaff`)?.addEventListener(`change`,e=>{A=e.target.value}),document.getElementById(`supplementAdjustReason`)?.addEventListener(`input`,e=>{j=e.target.value}),G()}function G(){document.querySelectorAll(`.supplement-action-in`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-action-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-cell-input[data-cell="in"]`).forEach(e=>{e.addEventListener(`blur`,e=>ye(e.target))}),document.querySelectorAll(`.supplement-cell-input[data-cell="adjust"]`).forEach(e=>{e.addEventListener(`blur`,e=>Se(e.target))}),document.querySelectorAll(`.supplement-cell--in.supplement-cell--locked`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date,n=e.dataset.typeId,r=z(n,t,`in`);alert(`이미 ${r}봉 입고 기록이 있습니다. 추가·정정은 수동조정을 사용해주세요.`)})})}function K(e){return Ee(Te(e)).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``)}async function q(){let e=c(),t=[...document.querySelectorAll(`.supplement-cell-input`)].filter(e=>e.value).map(e=>({type:e.dataset.typeId,date:e.dataset.date,cell:e.dataset.cell,value:e.value}));if(await M({force:!0}),!(e&&!e.isCurrent()))for(let e of document.querySelectorAll(`.supplement-cell-input`)){let n=t.find(t=>t.type===e.dataset.typeId&&t.date===e.dataset.date&&t.cell===e.dataset.cell);n&&(e.value=n.value)}}function J(e,t,n=d(),r=null){Z(`
    <h3 class="modal-title">영양제 입고 — ${$(t)}</h3>
    ${_({incoming:!0,reasonField:!0})}
    <div class="form-group">
      <label>수량(봉) *</label>
      <input type="number" id="sup_in_qty" min="1" step="1" placeholder="봉 수" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="sup_in_staff">
        <option value="">선택</option>
        ${K(`supplementStockIn`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupIn">저장</button>
    </div>
  `);let i=y({db:s,name:`supplementLogs`,filter:{supplementTypeId:e},onCancel:e=>{document.getElementById(`sup_adj_qty`).value=e},reasonInput:document.getElementById(`sup_adj_reason`)});r!==null&&(document.getElementById(`sup_in_qty`).value=r),document.getElementById(`btnSaveSupIn`)?.addEventListener(`click`,async()=>{let t=v(i);if(!t)return;let r=Number(document.getElementById(`sup_in_qty`)?.value||``),a=document.getElementById(`sup_in_staff`)?.value||``;if(!Number.isFinite(r)||r<=0||!Number.isInteger(r)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}if(!a){alert(`입고 담당자를 선택해주세요.`);return}let o=document.getElementById(`btnSaveSupIn`);o.disabled=!0;try{let i=c();if(await be(e,n,r,a,t),i&&!i.isCurrent())return;closeModal(),await q(),alert(`입고 완료`)}catch(e){console.error(`[supplement] incoming modal save failed:`,e),alert(`입고 등록 중 오류가 발생했습니다: ${e.message||e}`),o.disabled=!1}})}function Y(e,t,n=d(),r=null){Z(`
    <h3 class="modal-title">영양제 수동조정 — ${$(t)}</h3>
    ${_({incoming:!1,reasonField:!1})}
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
        ${K(`supplementAdjust`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupAdj">저장</button>
    </div>
  `);let i=y({db:s,name:`supplementLogs`,filter:{supplementTypeId:e},onCancel:e=>{document.getElementById(`sup_adj_qty`).value=e},reasonInput:document.getElementById(`sup_adj_reason`)});r!==null&&(document.getElementById(`sup_adj_qty`).value=r),document.getElementById(`btnSaveSupAdj`)?.addEventListener(`click`,async()=>{let t=v(i);if(!t)return;let r=Number(document.getElementById(`sup_adj_qty`)?.value||``),a=document.getElementById(`sup_adj_reason`)?.value.trim()||``,o=document.getElementById(`sup_adj_staff`)?.value||``;if(!Number.isFinite(r)||r===0||!Number.isInteger(r)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`);return}if(!a){alert(`수동조정 사유를 입력해주세요.`);return}if(!o){alert(`수동조정 담당자를 선택해주세요.`);return}let s=document.getElementById(`btnSaveSupAdj`);s.disabled=!0;try{let i=c();if(await Ce(e,n,r,a,o,t),i&&!i.isCurrent())return;closeModal(),await q(),alert(`조정 완료`)}catch(e){console.error(`[supplement] adjust modal save failed:`,e),e.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${e.message||e}`),s.disabled=!1}})}async function ye(e){let t=e.value.trim();if(!t)return;let n=Number(t);if(!Number.isInteger(n)||n<=0){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`),e.value=``;return}e.value=``;let r=w.find(t=>t.id===e.dataset.typeId);J(e.dataset.typeId,r?.name||e.dataset.typeId,e.dataset.date,n)}async function be(e,t,n,r,i){return b(x,a=>xe(e,t,n,r,a,i),{roles:[`admin`,`office`,`production`]})}async function xe(e,t,n,r,i,a){if(!a)throw Error(`처리 구분을 선택해주세요.`);let o=a.kind===`test`?{approved:!0}:await te({itemId:`supplementLogs:`+e,date:t,qty:n,unit:`봉`,stage:`영양제`},()=>!c()||c().isCurrent());if(!o.approved)throw Error(`입고 저장을 취소했습니다.`);return g({db:s,command:i,name:`supplementLogs`,stockId:e,selection:a,uid:f?.uid||null,stockData:{id:e,supplementTypeId:e,currentQty:0},log:{type:`in`,date:t,qty:n,supplementTypeId:e,staffName:r,...o.review?{statsQuantityReview:o.review}:{}}})}async function Se(e){let t=e.value.trim();if(!t)return;let n=Number(t);if(!Number.isInteger(n)||n===0){alert(`0이 아닌 정수를 입력해주세요.`),e.value=``;return}e.value=``;let r=w.find(t=>t.id===e.dataset.typeId);Y(e.dataset.typeId,r?.name||e.dataset.typeId,e.dataset.date,n);let i=document.getElementById(`sup_adj_reason`),a=document.getElementById(`sup_adj_staff`);i&&(i.value=j||``),a&&(a.value=A||``)}async function Ce(e,t,n,r,i,a){return b(x,o=>we(e,t,n,r,i,o,a),{roles:[`admin`,`office`,`production`]})}async function we(e,t,n,r,i,a,o){return g({db:s,command:a,name:`supplementLogs`,stockId:e,selection:o,uid:f?.uid||null,stockData:{id:e,supplementTypeId:e,currentQty:0},log:{type:`adjust`,date:t,qty:n,supplementTypeId:e,reason:r,staffName:i}})}async function X(){Z(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${_e((await i(n(o(s,`supplementLogs`),a(`timestamp`,`desc`),t(200)))).docs.map(e=>({id:e.id,...e.data()})))}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,`modal-wide`)}function Z(e,t=``){let n=document.querySelector(`.modal-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`modalOverlay`,r.className=`modal-overlay`,r.innerHTML=`<div class="modal-box ${t}">${e}</div>`,document.body.appendChild(r),r.addEventListener(`click`,e=>{e.target===r&&closeModal()})}l(`supplement`,function(){document.querySelector(`.modal-overlay`)?.remove()});function Te(e){let t=k?.[e];return Array.isArray(t)&&t.length>0?t:[]}function Ee(e){let t=new Map;return e.forEach(e=>{(O[e]||[]).forEach(e=>{e?.name&&!t.has(e.name)&&t.set(e.name,e)})}),Array.from(t.values())}function Q(e){let t=Number(e||0);return`${t>0?`+`:``}${t}`}function De(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return Number.isNaN(t.getTime())?`-`:t.toLocaleTimeString(`ko-KR`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})}function $(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}export{oe as preparePage,M as renderSupplement};