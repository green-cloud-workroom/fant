import{T as e,b as t,c as n,d as r,g as i,s as a,u as o,y as s}from"./index.esm-CWp5uCwe.js";import{n as c}from"./firebase-Bm8Fqw4J.js";import{r as l}from"./pageLifecycle-_b6L3DA3.js";import{n as u}from"./modalManager-D53QKIlh.js";import{G as d,L as f,W as p,f as m,g as h,h as ee}from"./index-Dw5m2H8y.js";import{t as te}from"./statsAutomationRuntime-DO3haCfh.js";import{t as g}from"./readCommand-D-QT5zkC.js";import{t as ne}from"./pageRefresh-BUR6sjuR.js";import{o as _,t as re}from"./menuStaffGroups-C6jNaMpk.js";var v=m(`supplement`),ie=14,y=10,b=5,x=[],S=[],C=[],w=`all`,T={},E=null,D=``,O=``,k=``;async function A({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`;let n=await v.load(j,{force:e,onChange:ne(v,A,{draftSelector:`.supplement-page`})});!n||!t.isConnected||([x,S,C]=[n.types,n.stocks,n.logs],E=n.groups,T=n.staff,y=Number(n.values.supplementThresholdYellow)||10,b=Number(n.values.supplementThresholdRed)||5,se())}function ae({cacheOnly:e=!0}={}){return v.prepare?.(`default`,j,{cacheOnly:e})}async function j(e){let n=oe().at(-1),a=[`senior`,`lead`,`office`],[l,u,d,f,p,...m]=await Promise.all([e.getDocs(r(s(c,`supplementTypes`),o(`sortOrder`))),e.getDocs(s(c,`supplementStock`)),e.getDocs(r(s(c,`supplementLogs`),i(`date`,`>=`,n))),e.getDoc(t(c,`settings`,`menuStaffGroups`)),e.getDoc(t(c,`settings`,`systemValues`)),...a.map(n=>e.getDoc(t(c,`staffGroups`,n)))]),h=e=>e.docs.map(e=>({id:e.id,...e.data()}));return{types:h(l),stocks:h(u),logs:h(d).sort((e,t)=>e.date===t.date?(t.timestamp?.seconds||0)-(e.timestamp?.seconds||0):e.date<t.date?1:-1),groups:{...re,...f.exists()?f.data():{}},values:{..._,...p.exists()?p.data():{}},staff:Object.fromEntries(a.map((e,t)=>[e,m[t].exists()&&m[t].data().members||[]]))}}function oe(){let e=f(),t=new Date(`${e}T00:00:00`),n=[];for(let e=0;e<ie;e++){let r=new Date(t);r.setDate(t.getDate()-e);let i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`);n.push(`${i}-${a}-${o}`)}return n}function se(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <span class="supplement-toolbar-title">영양제 재고</span>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${w===`all`?`selected`:``}>전체</option>
            <option value="warning" ${w===`warning`?`selected`:``}>${y}봉 미만만</option>
            <option value="danger" ${w===`danger`?`selected`:``}>${b}봉 미만만</option>
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
  `,he()}function M(e){let t=S.find(t=>t.id===e||t.supplementTypeId===e);return Number(t?.currentQty||0)}function ce(e){return x.find(t=>t.id===e)?.name||e||`-`}function N(){return x.filter(e=>{if(e.active===!1)return!0;let t=M(e.id);return w===`warning`?t<y:w===`danger`?t<b:!0})}async function le(){let e=await ee(()=>import(`./spreadsheet-CiTVr7o_.js`),[]),t=N();if(t.length===0){alert(`다운로드할 영양제 SKU가 없습니다.`);return}let n=[[`영양제 SKU`,`재고`,`영양제 SKU`,`재고`]];for(let e=0;e<t.length;e+=2){let r=t[e],i=t[e+1];n.push([r?.name||r?.id||``,r?`${M(r.id)}봉`:``,i?.name||i?.id||``,i?`${M(i.id)}봉`:``])}let r=e.utils.aoa_to_sheet(n);r[`!cols`]=[{wch:34},{wch:10},{wch:34},{wch:10}];let i=e.utils.book_new();e.utils.book_append_sheet(i,r,`영양제재고`),e.writeFile(i,`영양제재고_${f().replaceAll(`-`,``)}.xlsx`)}function P(e){let t=Number(e.unit);return Number.isFinite(t)?t:0}function F(e){let t=Number(e.sortOrder);return Number.isFinite(t)?Math.floor(t/100):999999}function ue(e){let t=new Map;for(let n of e){let e=n.recipeId||`__ungrouped_${n.id}`;t.has(e)||t.set(e,{recipeId:e,recipeName:n.recipeName||n.name||e,sortOrder:F(n),types:[]});let r=t.get(e);r.types.push(n),r.sortOrder=Math.min(r.sortOrder,F(n)),n.recipeName&&(r.recipeName=n.recipeName)}return[...t.values()].map(e=>({...e,types:e.types.sort((e,t)=>P(e)-P(t))})).sort((e,t)=>e.sortOrder-t.sortOrder||e.recipeName.localeCompare(t.recipeName))}function I(e){return e.reduce((e,t)=>{let n=M(t.id);return e.totalStock+=n,t.active!==!1&&n<b?e.danger+=1:t.active!==!1&&n<y&&(e.warning+=1),e},{totalStock:0,danger:0,warning:0})}function L(e,t,n){return C.filter(r=>r.supplementTypeId===e&&r.date===t&&r.type===n).reduce((e,t)=>e+Number(t.qty||0),0)}function R(e,t,n){return C.some(r=>r.supplementTypeId===e&&r.date===t&&r.type===n)}function z(e){return C.find(t=>t.supplementTypeId===e)}function B(e,t){return t?{label:`비활성`,className:`supplement-status--inactive`}:e<b?{label:`부족`,className:`supplement-status--danger`}:e<y?{label:`주의`,className:`supplement-status--warning`}:{label:`정상`,className:`supplement-status--normal`}}function V(e,t){let n=B(e,t);return`<span class="supplement-status ${n.className}">${n.label}</span>`}function H(e){let t=z(e);if(!t)return`<span class="supplement-muted">-</span>`;let n=Number.isFinite(Number(t.after))?` / 잔량 ${Number(t.after)}봉`:``;return`
    <div class="supplement-recent-change">
      <span class="supplement-recent-date">${$(t.date||`-`)}</span>
      ${G(t.type)}
      <span class="supplement-recent-qty">${Q(t.qty)}${n}</span>
    </div>
  `}function U(e){let t=M(e.id),n=e.active===!1,r=n?``:t<b?`supplement-qty--danger`:t<y?`supplement-qty--warning`:``;return`
    <tr class="${n?`supplement-row--inactive`:``}">
      <td class="supplement-td-name">
        ${$(e.name||e.id)}
        ${n?`<span class="tag tag-inactive">비활성</span>`:``}
      </td>
      <td class="supplement-td-qty ${r}">${t}봉</td>
      <td class="supplement-td-status">${V(t,n)}</td>
      <td class="supplement-td-recent">${H(e.id)}</td>
      <td class="supplement-td-actions">
        ${!n&&pe()?`<button class="btn-secondary supplement-action-in" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">입고</button>`:``}
        ${!n&&fe()?`<button class="btn-secondary supplement-action-adjust" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">수동조정</button>`:``}
      </td>
    </tr>
  `}function de(e){let t=I(e.types),n=t.danger>0||t.warning>0,r=[t.danger>0?`부족 ${t.danger}`:``,t.warning>0?`주의 ${t.warning}`:``].filter(Boolean).join(` · `);return`
    <details class="supplement-recipe-group"${w===`all`?``:` open`} data-recipe-id="${$(e.recipeId)}">
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
            ${e.types.map(e=>U(e)).join(``)}
          </tbody>
        </table>
      </div>
    </details>
  `}function fe(){return d===`admin`||d===`office`}function pe(){return d===`admin`||d===`office`||d===`production`}function W(){let e=N();return x.length===0?`<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>`:e.length===0?`<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>`:`
    <div class="supplement-recipe-groups">
      ${ue(e).map(e=>de(e)).join(``)}
    </div>
  `}function me(e){return e.length===0?`<div class="list-empty supplement-log-empty">이력이 없습니다</div>`:`
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
            <td>${Te(e.timestamp)}</td>
            <td>${$(ce(e.supplementTypeId))}</td>
            <td>${G(e.type)}</td>
            <td style="color:${Number(e.qty||0)<0?`#e53e3e`:`#2d7a3a`}">${Q(e.qty)}</td>
            <td>${Number.isFinite(Number(e.after))?Number(e.after):`-`}</td>
            <td>${$(e.staffName||`-`)}</td>
            <td>${$([e.reason,e.note].filter(Boolean).join(` / `)||`-`)}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function G(e){return e===`in`?`<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>`:e===`autoDeduct`?`<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>`:e===`adjust`?`<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>`:`<span class="tag tag-common">${$(e||`-`)}</span>`}function he(){document.getElementById(`btnSupplementRefresh`)?.addEventListener(`click`,async()=>{await h()&&await A({force:!0})}),document.getElementById(`supplementFilter`)?.addEventListener(`change`,e=>{w=e.target.value;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=W()),K()}),document.getElementById(`btnSupplementAllLogs`)?.addEventListener(`click`,Se),document.getElementById(`btnSupplementExcel`)?.addEventListener(`click`,le),document.getElementById(`supplementInStaff`)?.addEventListener(`change`,e=>{D=e.target.value}),document.getElementById(`supplementAdjustStaff`)?.addEventListener(`change`,e=>{O=e.target.value}),document.getElementById(`supplementAdjustReason`)?.addEventListener(`input`,e=>{k=e.target.value}),K()}function K(){document.querySelectorAll(`.supplement-action-in`).forEach(e=>{e.addEventListener(`click`,()=>ge(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-action-adjust`).forEach(e=>{e.addEventListener(`click`,()=>_e(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-cell-input[data-cell="in"]`).forEach(e=>{e.addEventListener(`blur`,e=>ve(e.target))}),document.querySelectorAll(`.supplement-cell-input[data-cell="adjust"]`).forEach(e=>{e.addEventListener(`blur`,e=>be(e.target))}),document.querySelectorAll(`.supplement-cell--in.supplement-cell--locked`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date,n=e.dataset.typeId,r=L(n,t,`in`);alert(`이미 ${r}봉 입고 기록이 있습니다. 추가·정정은 수동조정을 사용해주세요.`)})})}function q(e){return we(Ce(e)).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``)}async function J(){let e=l(),t=[...document.querySelectorAll(`.supplement-cell-input`)].filter(e=>e.value).map(e=>({type:e.dataset.typeId,date:e.dataset.date,cell:e.dataset.cell,value:e.value}));if(await A({force:!0}),!(e&&!e.isCurrent()))for(let e of document.querySelectorAll(`.supplement-cell-input`)){let n=t.find(t=>t.type===e.dataset.typeId&&t.date===e.dataset.date&&t.cell===e.dataset.cell);n&&(e.value=n.value)}}function ge(e,t){Z(`
    <h3 class="modal-title">영양제 입고 — ${$(t)}</h3>
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
  `),document.getElementById(`btnSaveSupIn`)?.addEventListener(`click`,async()=>{let t=Number(document.getElementById(`sup_in_qty`)?.value||``),n=document.getElementById(`sup_in_staff`)?.value||``;if(!Number.isFinite(t)||t<=0||!Number.isInteger(t)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}if(!n){alert(`입고 담당자를 선택해주세요.`);return}let r=document.getElementById(`btnSaveSupIn`);r.disabled=!0;try{let r=l();if(await Y(e,f(),t,n),r&&!r.isCurrent())return;closeModal(),await J(),alert(`입고 완료`)}catch(e){console.error(`[supplement] incoming modal save failed:`,e),alert(`입고 등록 중 오류가 발생했습니다: ${e.message||e}`),r.disabled=!1}})}function _e(e,t){Z(`
    <h3 class="modal-title">영양제 수동조정 — ${$(t)}</h3>
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
  `),document.getElementById(`btnSaveSupAdj`)?.addEventListener(`click`,async()=>{let t=Number(document.getElementById(`sup_adj_qty`)?.value||``),n=document.getElementById(`sup_adj_reason`)?.value.trim()||``,r=document.getElementById(`sup_adj_staff`)?.value||``;if(!Number.isFinite(t)||t===0||!Number.isInteger(t)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`);return}if(!n){alert(`수동조정 사유를 입력해주세요.`);return}if(!r){alert(`수동조정 담당자를 선택해주세요.`);return}let i=document.getElementById(`btnSaveSupAdj`);i.disabled=!0;try{let i=l();if(await X(e,f(),t,n,r),i&&!i.isCurrent())return;closeModal(),await J(),alert(`조정 완료`)}catch(e){console.error(`[supplement] adjust modal save failed:`,e),e.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${e.message||e}`),i.disabled=!1}})}async function ve(e){let t=e.dataset.typeId,n=e.dataset.date,r=e.value.trim();if(!r)return;let i=Number(r);if(!Number.isFinite(i)||i<=0||!Number.isInteger(i)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`),e.value=``;return}if(R(t,n,`in`)){alert(`이미 입고 기록이 있습니다. 새로고침 후 확인해주세요.`),e.value=``;return}let a=D;if(!a){alert(`입고 담당자를 선택해주세요.`),e.value=``;return}e.disabled=!0;try{let r=l();if(await Y(t,n,i,a),r&&!r.isCurrent())return;e.value=``,await J()}catch(t){console.error(`[supplement] incoming cell save failed:`,t),alert(`입고 등록 중 오류가 발생했습니다: ${t.message||t}`),e.disabled=!1}}async function Y(e,t,n,r){return g(v,i=>ye(e,t,n,r,i),{roles:[`admin`,`office`,`production`]})}async function ye(n,r,i,a,o){let u=l(),d=await te({itemId:`supplementLogs:`+n,date:r,qty:i,unit:`봉`,stage:`영양제`},()=>!u||u.isCurrent());if(!d.approved||u&&!u.isCurrent())throw Error(`입고 저장을 취소했습니다.`);let f=t(c,`supplementStock`,n),p=t(s(c,`supplementLogs`));await o.transaction(c,async t=>{let o=await t.get(f),s=Number(o.exists()&&o.data().currentQty||0),c=s+i;t.set(f,{id:n,supplementTypeId:n,currentQty:c,updatedAt:e()},{merge:!0}),t.set(p,{date:r,timestamp:e(),supplementTypeId:n,type:`in`,...d.review?{statsQuantityReview:d.review}:{},qty:i,before:s,after:c,staffName:a})},{targets:[f,p]})}async function be(e){let t=e.dataset.typeId,n=e.dataset.date,r=e.value.trim();if(!r)return;let i=Number(r);if(!Number.isFinite(i)||i===0||!Number.isInteger(i)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`),e.value=``;return}let a=k.trim();if(!a){alert(`수동조정 사유를 입력해주세요.`),e.value=``;return}let o=O;if(!o){alert(`수동조정 담당자를 선택해주세요.`),e.value=``;return}e.disabled=!0;try{let r=l();if(await X(t,n,i,a,o),r&&!r.isCurrent())return;e.value=``,await J()}catch(t){console.error(`[supplement] adjust cell save failed:`,t),t.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${t.message||t}`),e.disabled=!1}}async function X(e,t,n,r,i){return g(v,a=>xe(e,t,n,r,i,a),{roles:[`admin`,`office`,`production`]})}async function xe(n,r,i,a,o,l){let u=t(c,`supplementStock`,n),d=t(s(c,`supplementLogs`)),f=t(s(c,`activityLogs`)),m=x.find(e=>e.id===n)?.name||n,h=i>0?`+`:``;await l.transaction(c,async t=>{let s=await t.get(u),c=Number(s.exists()&&s.data().currentQty||0),l=c+i;if(l<0)throw Error(`NEGATIVE_SUPPLEMENT_STOCK`);t.set(u,{id:n,supplementTypeId:n,currentQty:l,updatedAt:e()},{merge:!0}),t.set(d,{date:r,timestamp:e(),supplementTypeId:n,type:`adjust`,qty:i,before:c,after:l,staffName:o,reason:a}),t.set(f,{action:`supplementStock`,subAction:`manualAdjust`,date:r,staff:o,uid:p?.uid||null,timestamp:e(),message:`영양제 수동조정 — ${m} ${h}${i}봉 / 사유: ${a} / 담당: ${o}`,details:{supplementTypeId:n,supplementName:m,signedQty:i,before:c,after:l,reason:a,note:null},read:!1,acknowledged:!1,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null})},{targets:[u,d]})}async function Se(){Z(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${me((await a(r(s(c,`supplementLogs`),o(`timestamp`,`desc`),n(200)))).docs.map(e=>({id:e.id,...e.data()})))}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,`modal-wide`)}function Z(e,t=``){let n=document.querySelector(`.modal-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`modalOverlay`,r.className=`modal-overlay`,r.innerHTML=`<div class="modal-box ${t}">${e}</div>`,document.body.appendChild(r),r.addEventListener(`click`,e=>{e.target===r&&closeModal()})}u(`supplement`,function(){document.querySelector(`.modal-overlay`)?.remove()});function Ce(e){let t=E?.[e];return Array.isArray(t)&&t.length>0?t:[]}function we(e){let t=new Map;return e.forEach(e=>{(T[e]||[]).forEach(e=>{e?.name&&!t.has(e.name)&&t.set(e.name,e)})}),Array.from(t.values())}function Q(e){let t=Number(e||0);return`${t>0?`+`:``}${t}`}function Te(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return Number.isNaN(t.getTime())?`-`:t.toLocaleTimeString(`ko-KR`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})}function $(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}export{ae as preparePage,A as renderSupplement};