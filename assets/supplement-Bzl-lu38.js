import{b as e,c as t,d as n,g as r,s as i,u as a,y as o}from"./index.esm-D8prxbkJ.js";import{n as s}from"./firebase-BOShkvR0.js";import{n as c}from"./modalManager-Z4b2ihO9.js";import{$ as l,G as u,S as d,et as f,k as p,v as m,x as h}from"./index-CFkaD3P5.js";import{o as g}from"./manualMovementLogic-B7xM1mhV.js";import{t as ee}from"./movementNote-BTKDyL6c.js";import{t as _}from"./statusToast-DAQ_Eu62.js";import{i as v,n as y,r as b,t as x}from"./movementForm-Bek9S1Sv.js";import{t as te}from"./statsAutomationRuntime-phe4YuyF.js";import{t as S}from"./readCommand-BnJ1ktiT.js";import{t as ne}from"./pageRefresh-XPqJCFUI.js";import{o as re,t as ie}from"./menuStaffGroups-CwLTkpk3.js";var C=m(`supplement`),ae=14,w=10,T=5,E=[],D=[],O=[],k=`all`,A={},j=null,M=``,N=``;async function P({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;let n=await C.load(F,{force:e,onChange:ne(C,P,{draftSelector:`.supplement-page`})});!n||!t.isConnected||([E,D,O]=[n.types,n.stocks,n.logs],j=n.groups,A=n.staff,w=Number(n.values.supplementThresholdYellow)||10,T=Number(n.values.supplementThresholdRed)||5,ce())}function oe({cacheOnly:e=!0}={}){return C.prepare?.(`default`,F,{cacheOnly:e})}async function F(t){let i=se().at(-1),c=[`senior`,`lead`,`office`],[l,u,d,f,p,...m]=await Promise.all([t.getDocs(n(o(s,`supplementTypes`),a(`sortOrder`))),t.getDocs(o(s,`supplementStock`)),t.getDocs(n(o(s,`supplementLogs`),r(`date`,`>=`,i))),t.getDoc(e(s,`settings`,`menuStaffGroups`)),t.getDoc(e(s,`settings`,`systemValues`)),...c.map(n=>t.getDoc(e(s,`staffGroups`,n)))]),h=e=>e.docs.map(e=>({id:e.id,...e.data()}));return{types:h(l),stocks:h(u),logs:h(d).sort((e,t)=>e.date===t.date?(t.timestamp?.seconds||0)-(e.timestamp?.seconds||0):e.date<t.date?1:-1),groups:{...ie,...f.exists()?f.data():{}},values:{...re,...p.exists()?p.data():{}},staff:Object.fromEntries(c.map((e,t)=>[e,m[t].exists()&&m[t].data().members||[]]))}}function se(){let e=u(),t=new Date(`${e}T00:00:00`),n=[];for(let e=0;e<ae;e++){let r=new Date(t);r.setDate(t.getDate()-e);let i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`);n.push(`${i}-${a}-${o}`)}return n}function ce(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <span class="supplement-toolbar-title">영양제 재고</span>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${k===`all`?`selected`:``}>전체</option>
            <option value="warning" ${k===`warning`?`selected`:``}>${w}봉 미만만</option>
            <option value="danger" ${k===`danger`?`selected`:``}>${T}봉 미만만</option>
          </select>
          <button class="btn-secondary" id="btnSupplementExcel">엑셀 다운로드</button>
          <button class="btn-secondary" id="btnSupplementAllLogs">전체보기</button>
          <button class="btn-secondary" id="btnSupplementRefresh">새로고침</button>
        </div>
      </div>

      <div class="supplement-table-wrap" id="supplementTableWrap">
        ${W()}
      </div>
    </div>
  `,ve()}function I(e){let t=D.find(t=>t.id===e||t.supplementTypeId===e);return Number(t?.currentQty||0)}function le(e){return E.find(t=>t.id===e)?.name||e||`-`}function L(){return E.filter(e=>{if(e.active===!1)return!0;let t=I(e.id);return k===`warning`?t<w:k===`danger`?t<T:!0})}async function ue(){let e=await h(()=>import(`./spreadsheet-uQWOZaIc.js`),[]),t=L();if(t.length===0){alert(`다운로드할 영양제 SKU가 없습니다.`);return}let n=[[`영양제 SKU`,`재고`,`영양제 SKU`,`재고`]];for(let e=0;e<t.length;e+=2){let r=t[e],i=t[e+1];n.push([r?.name||r?.id||``,r?`${I(r.id)}봉`:``,i?.name||i?.id||``,i?`${I(i.id)}봉`:``])}let r=e.utils.aoa_to_sheet(n);r[`!cols`]=[{wch:34},{wch:10},{wch:34},{wch:10}];let i=e.utils.book_new();e.utils.book_append_sheet(i,r,`영양제재고`),e.writeFile(i,`영양제재고_${u().replaceAll(`-`,``)}.xlsx`)}function R(e){let t=Number(e.unit);return Number.isFinite(t)?t:0}function z(e){let t=Number(e.sortOrder);return Number.isFinite(t)?Math.floor(t/100):999999}function B(e){let t=new Map;for(let n of e){let e=n.recipeId||`__ungrouped_${n.id}`;t.has(e)||t.set(e,{recipeId:e,recipeName:n.recipeName||n.name||e,sortOrder:z(n),types:[]});let r=t.get(e);r.types.push(n),r.sortOrder=Math.min(r.sortOrder,z(n)),n.recipeName&&(r.recipeName=n.recipeName)}return[...t.values()].map(e=>({...e,types:e.types.sort((e,t)=>R(e)-R(t))})).sort((e,t)=>e.sortOrder-t.sortOrder||e.recipeName.localeCompare(t.recipeName))}function V(e){return e.reduce((e,t)=>{let n=I(t.id);return e.totalStock+=n,t.active!==!1&&n<T?e.danger+=1:t.active!==!1&&n<w&&(e.warning+=1),e},{totalStock:0,danger:0,warning:0})}function H(e){return O.find(t=>t.supplementTypeId===e)}function de(e,t){return t?{label:`비활성`,className:`supplement-status--inactive`}:e<T?{label:`부족`,className:`supplement-status--danger`}:e<w?{label:`주의`,className:`supplement-status--warning`}:{label:`정상`,className:`supplement-status--normal`}}function U(e,t){let n=de(e,t),r=!t&&e===0,i=r?`egg-status--empty`:n.className===`supplement-status--danger`?`egg-status--low`:n.className===`supplement-status--warning`?`egg-status--warning`:``;return`<span class="supplement-status ${n.className} egg-status ${i}">${r?`0개`:n.label}</span>`}function fe(e){let t=H(e);if(!t)return`<span class="supplement-muted">-</span>`;let n=Number.isFinite(Number(t.after))?` / 잔량 ${Number(t.after)}봉`:``;return`
    <div class="supplement-recent-change">
      <span class="supplement-recent-date">${$(t.date||`-`)}</span>
      ${G(t.type,t,!0)}
      <span class="supplement-recent-qty ${Number(t.qty)<0?`stock-quantity--decrease`:Number(t.qty)>0?`stock-quantity--increase`:``}">${Q(t.qty)}</span><span class="supplement-muted">${n}</span>
    </div>
  `}function pe(e){let t=I(e.id),n=e.active===!1,r=n?``:t<T?`supplement-qty--danger`:t<w?`supplement-qty--warning`:``;return`
    <tr class="${n?`supplement-row--inactive`:``}">
      <td class="supplement-td-name">
        ${$(e.name||e.id)}
        ${n?`<span class="tag tag-inactive">비활성</span>`:``}
      </td>
      <td class="supplement-td-qty ${r} ${t===0?`supplement-qty--empty`:``}">${t}봉</td>
      <td class="supplement-td-status">${U(t,n)}</td>
      <td class="supplement-td-recent">${fe(e.id)}</td>
      <td class="supplement-td-actions">
        ${!n&&ge()?`<button class="btn-secondary supplement-action-in" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">입고</button>`:``}
        ${!n&&he()?`<button class="btn-secondary supplement-action-adjust" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">수동조정</button>`:``}
      </td>
    </tr>
  `}function me(e){let t=V(e.types),n=t.danger>0||t.warning>0;return`
    <details class="supplement-recipe-group"${k===`all`?``:` open`} data-recipe-id="${$(e.recipeId)}">
      <summary class="supplement-recipe-header ${n?`supplement-recipe-header--has-alert`:``}">
        <span class="recipe-name">${$(e.recipeName)}</span>
        <span class="preset-count">${e.types.length} 프리셋</span>
        <span class="total-stock">합계 ${t.totalStock}봉</span>
        ${t.danger>0?`<span class="alert-summary egg-status egg-status--low">⚠ 부족 ${t.danger}</span>`:``}
        ${t.warning>0?`<span class="alert-summary egg-status egg-status--warning">주의 ${t.warning}</span>`:``}
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
  `}function he(){return f===`admin`||f===`office`}function ge(){return f===`admin`||f===`office`||f===`production`}function W(){let e=L();return E.length===0?`<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>`:e.length===0?`<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>`:`
    <div class="supplement-recipe-groups">
      ${B(e).map(e=>me(e)).join(``)}
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
            <td>${Oe(e.timestamp)}</td>
            <td>${$(le(e.supplementTypeId))}</td>
            <td>${G(e.type,e)}</td>
            <td style="color:${Number(e.qty||0)<0?`#e53e3e`:`#2d7a3a`}">${Q(e.qty)}</td>
            <td>${Number.isFinite(Number(e.after))?Number(e.after):`-`}</td>
            <td>${$(e.staffName||`-`)}</td>
            <td>${$(ee([e.reason,e.note].filter(Boolean).join(` / `)||`-`,`supplementLogs`,O,e=>({in:`입고`,autoDeduct:`자동차감`,adjust:`수동조정`})[e.type]||e.type||`-`))}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function G(e,t,n=!1){if(n){let n=g(t,{in:`입고`,autoDeduct:`자동차감`,adjust:`수동조정`}[e]||e||`-`);return`<span class="tag stock-movement-badge" data-movement-label="${$(n)}">${$(n)}</span>`}return t?.manualMovement?`<span class="tag tag-common">${$(g(t,e))}</span>`:e===`in`?`<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>`:e===`autoDeduct`?`<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>`:e===`adjust`?`<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>`:`<span class="tag tag-common">${$(e||`-`)}</span>`}function ve(){document.getElementById(`btnSupplementRefresh`)?.addEventListener(`click`,async()=>{await d()&&await P({force:!0})}),document.getElementById(`supplementFilter`)?.addEventListener(`change`,e=>{k=e.target.value;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=W()),K()}),document.getElementById(`btnSupplementAllLogs`)?.addEventListener(`click`,Te),document.getElementById(`btnSupplementExcel`)?.addEventListener(`click`,ue),document.getElementById(`supplementInStaff`)?.addEventListener(`change`,e=>{e.target.value}),document.getElementById(`supplementAdjustStaff`)?.addEventListener(`change`,e=>{M=e.target.value}),document.getElementById(`supplementAdjustReason`)?.addEventListener(`input`,e=>{N=e.target.value}),K()}function K(){document.querySelectorAll(`.supplement-action-in`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-action-adjust`).forEach(e=>{e.addEventListener(`click`,()=>X(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-cell-input[data-cell="in"]`).forEach(e=>{e.addEventListener(`blur`,e=>ye(e.target))}),document.querySelectorAll(`.supplement-cell-input[data-cell="adjust"]`).forEach(e=>{e.addEventListener(`blur`,e=>Se(e.target))}),document.querySelectorAll(`.supplement-add-in`).forEach(e=>{e.addEventListener(`click`,()=>{let t=E.find(t=>t.id===e.dataset.id);Y(e.dataset.id,t?.name||e.dataset.id,e.dataset.date)})})}function q(e){return De(Ee(e)).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``)}async function J(){let e=p(),t=[...document.querySelectorAll(`.supplement-cell-input`)].filter(e=>e.value).map(e=>({type:e.dataset.typeId,date:e.dataset.date,cell:e.dataset.cell,value:e.value}));if(await P({force:!0}),!(e&&!e.isCurrent()))for(let e of document.querySelectorAll(`.supplement-cell-input`)){let n=t.find(t=>t.type===e.dataset.typeId&&t.date===e.dataset.date&&t.cell===e.dataset.cell);n&&(e.value=n.value)}}function Y(e,t,n=u(),r=null){Z(`
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
        ${q(`supplementStockIn`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupIn">저장</button>
    </div>
  `);let i=x({db:s,name:`supplementLogs`,filter:{supplementTypeId:e},onCancel:e=>{document.getElementById(`sup_adj_qty`).value=e},reasonInput:document.getElementById(`sup_adj_reason`)});r!==null&&(document.getElementById(`sup_in_qty`).value=r),document.getElementById(`btnSaveSupIn`)?.addEventListener(`click`,async()=>{let t=b(i);if(!t)return;let r=Number(document.getElementById(`sup_in_qty`)?.value||``),a=document.getElementById(`sup_in_staff`)?.value||``;if(!Number.isFinite(r)||r<=0||!Number.isInteger(r)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}if(!a){alert(`입고 담당자를 선택해주세요.`);return}let o=document.getElementById(`btnSaveSupIn`);o.disabled=!0;try{let i=p();if(await be(e,n,r,a,t),i&&!i.isCurrent())return;closeModal(),await J(),_(`입고 완료`)}catch(e){console.error(`[supplement] incoming modal save failed:`,e),alert(`입고 등록 중 오류가 발생했습니다: ${e.message||e}`),o.disabled=!1}})}function X(e,t,n=u(),r=null){Z(`
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
        ${q(`supplementAdjust`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupAdj">저장</button>
    </div>
  `);let i=x({db:s,name:`supplementLogs`,filter:{supplementTypeId:e},onCancel:e=>{document.getElementById(`sup_adj_qty`).value=e},reasonInput:document.getElementById(`sup_adj_reason`)});r!==null&&(document.getElementById(`sup_adj_qty`).value=r),document.getElementById(`btnSaveSupAdj`)?.addEventListener(`click`,async()=>{let t=b(i);if(!t)return;let r=Number(document.getElementById(`sup_adj_qty`)?.value||``),a=t.kind===`usage`?-Math.abs(r):t.kind===`receipt`?Math.abs(r):r,o=t.reason,s=document.getElementById(`sup_adj_staff`)?.value||``;if(!Number.isFinite(a)||a===0||!Number.isInteger(a)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`);return}if(!s){alert(`수동조정 담당자를 선택해주세요.`);return}let c=document.getElementById(`btnSaveSupAdj`);c.disabled=!0;try{let r=p();if(await Ce(e,n,a,o,s,t),r&&!r.isCurrent())return;closeModal(),await J(),_(`조정 완료`)}catch(e){console.error(`[supplement] adjust modal save failed:`,e),e.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${e.message||e}`),c.disabled=!1}})}async function ye(e){let t=e.value.trim();if(!t)return;let n=Number(t);if(!Number.isInteger(n)||n<=0){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}e.value=``;let r=E.find(t=>t.id===e.dataset.typeId);Y(e.dataset.typeId,r?.name||e.dataset.typeId,e.dataset.date,n)}async function be(e,t,n,r,i){return S(C,a=>xe(e,t,n,r,a,i),{roles:[`admin`,`office`,`production`]})}async function xe(e,t,n,r,i,a){if(!a)throw Error(`처리 구분을 선택해주세요.`);let o=a.kind===`test`?{approved:!0}:await te({itemId:`supplementLogs:`+e,date:t,qty:n,unit:`봉`,stage:`영양제`},()=>!p()||p().isCurrent());if(!o.approved)throw Error(`입고 저장을 취소했습니다.`);return v({db:s,command:i,name:`supplementLogs`,stockId:e,selection:a,uid:l?.uid||null,supplementName:E.find(t=>t.id===e)?.name,stockData:{id:e,supplementTypeId:e,currentQty:0},log:{type:`in`,date:t,qty:n,supplementTypeId:e,staffName:r,...o.review?{statsQuantityReview:o.review}:{}}})}async function Se(e){let t=e.value.trim();if(!t)return;let n=Number(t);if(!Number.isInteger(n)||n===0){alert(`0이 아닌 정수를 입력해주세요.`);return}e.value=``;let r=E.find(t=>t.id===e.dataset.typeId);X(e.dataset.typeId,r?.name||e.dataset.typeId,e.dataset.date,n);let i=document.getElementById(`sup_adj_reason`),a=document.getElementById(`sup_adj_staff`);i&&(i.value=N||``),a&&(a.value=M||``)}async function Ce(e,t,n,r,i,a){return S(C,o=>we(e,t,n,r,i,o,a),{roles:[`admin`,`office`]})}async function we(e,t,n,r,i,a,o){return v({db:s,command:a,name:`supplementLogs`,stockId:e,selection:o,uid:l?.uid||null,supplementName:E.find(t=>t.id===e)?.name,stockData:{id:e,supplementTypeId:e,currentQty:0},log:{type:`adjust`,date:t,qty:n,supplementTypeId:e,reason:r,staffName:i}})}async function Te(){Z(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${_e((await i(n(o(s,`supplementLogs`),a(`timestamp`,`desc`),t(200)))).docs.map(e=>({id:e.id,...e.data()})))}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,`modal-wide`)}function Z(e,t=``){let n=document.querySelector(`.modal-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`modalOverlay`,r.className=`modal-overlay`,r.innerHTML=`<div class="modal-box ${t}">${e}</div>`,document.body.appendChild(r),r.addEventListener(`click`,e=>{e.target===r&&closeModal()})}c(`supplement`,function(){document.querySelector(`.modal-overlay`)?.remove()});function Ee(e){let t=j?.[e];return Array.isArray(t)&&t.length>0?t:[]}function De(e){let t=new Map;return e.forEach(e=>{(A[e]||[]).forEach(e=>{e?.name&&!t.has(e.name)&&t.set(e.name,e)})}),Array.from(t.values())}function Q(e){let t=Number(e||0);return`${t>0?`+`:``}${t}`}function Oe(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return Number.isNaN(t.getTime())?`-`:t.toLocaleTimeString(`ko-KR`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})}function $(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}export{oe as preparePage,P as renderSupplement};