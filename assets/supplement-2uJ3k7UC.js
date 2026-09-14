import{T as e,b as t,c as n,d as r,f as i,g as a,i as o,o as s,u as c,y as l}from"./index.esm-rHmxwfvm.js";import{n as u}from"./firebase-qGjqjNvO.js";import{n as d}from"./modalManager-Z4b2ihO9.js";import{H as f,P as p,V as ee,v as m}from"./index-ihWgJTcM.js";import{i as h,o as te}from"./menuStaffGroups-dX3OUh5s.js";var ne=14,g=10,_=5,v=[],y=[],b=[],x=`all`,S={},C=null,w=``,T=``,E=``;async function D(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`,await Promise.all([O(),X(),re()]),await ve(),e.isConnected&&k()}async function re(){let e=document.getElementById(`mainContent`),t=await te();document.getElementById(`mainContent`)===e&&(g=Number(t.supplementThresholdYellow)||10,_=Number(t.supplementThresholdRed)||5)}async function O(){let e=document.getElementById(`mainContent`),t=ie(),n=t[t.length-1],[i,o,d]=await Promise.all([s(r(l(u,`supplementTypes`),c(`sortOrder`))),s(l(u,`supplementStock`)),s(r(l(u,`supplementLogs`),a(`date`,`>=`,n)))]);document.getElementById(`mainContent`)===e&&(v=i.docs.map(e=>({id:e.id,...e.data()})),y=o.docs.map(e=>({id:e.id,...e.data()})),b=d.docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>{if(e.date!==t.date)return e.date<t.date?1:-1;let n=e.timestamp?.seconds||0;return(t.timestamp?.seconds||0)-n}))}function ie(){let e=p(),t=new Date(`${e}T00:00:00`),n=[];for(let e=0;e<ne;e++){let r=new Date(t);r.setDate(t.getDate()-e);let i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`);n.push(`${i}-${a}-${o}`)}return n}function k(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <span class="supplement-toolbar-title">영양제 재고</span>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${x===`all`?`selected`:``}>전체</option>
            <option value="warning" ${x===`warning`?`selected`:``}>${g}봉 미만만</option>
            <option value="danger" ${x===`danger`?`selected`:``}>${_}봉 미만만</option>
          </select>
          <button class="btn-secondary" id="btnSupplementExcel">엑셀 다운로드</button>
          <button class="btn-secondary" id="btnSupplementAllLogs">전체보기</button>
          <button class="btn-secondary" id="btnSupplementRefresh">새로고침</button>
        </div>
      </div>

      <div class="supplement-table-wrap" id="supplementTableWrap">
        ${V()}
      </div>
    </div>
  `,pe()}function A(e){let t=y.find(t=>t.id===e||t.supplementTypeId===e);return Number(t?.currentQty||0)}function ae(e){return v.find(t=>t.id===e)?.name||e||`-`}function j(){return v.filter(e=>{if(e.active===!1)return!0;let t=A(e.id);return x===`warning`?t<g:x===`danger`?t<_:!0})}async function oe(){let e=await m(()=>import(`./spreadsheet-CHQ96tXg.js`),[]),t=j();if(t.length===0){alert(`다운로드할 영양제 SKU가 없습니다.`);return}let n=[[`영양제 SKU`,`재고`,`영양제 SKU`,`재고`]];for(let e=0;e<t.length;e+=2){let r=t[e],i=t[e+1];n.push([r?.name||r?.id||``,r?`${A(r.id)}봉`:``,i?.name||i?.id||``,i?`${A(i.id)}봉`:``])}let r=e.utils.aoa_to_sheet(n);r[`!cols`]=[{wch:34},{wch:10},{wch:34},{wch:10}];let i=e.utils.book_new();e.utils.book_append_sheet(i,r,`영양제재고`),e.writeFile(i,`영양제재고_${p().replaceAll(`-`,``)}.xlsx`)}function M(e){let t=Number(e.unit);return Number.isFinite(t)?t:0}function N(e){let t=Number(e.sortOrder);return Number.isFinite(t)?Math.floor(t/100):999999}function se(e){let t=new Map;for(let n of e){let e=n.recipeId||`__ungrouped_${n.id}`;t.has(e)||t.set(e,{recipeId:e,recipeName:n.recipeName||n.name||e,sortOrder:N(n),types:[]});let r=t.get(e);r.types.push(n),r.sortOrder=Math.min(r.sortOrder,N(n)),n.recipeName&&(r.recipeName=n.recipeName)}return[...t.values()].map(e=>({...e,types:e.types.sort((e,t)=>M(e)-M(t))})).sort((e,t)=>e.sortOrder-t.sortOrder||e.recipeName.localeCompare(t.recipeName))}function ce(e){return e.reduce((e,t)=>{let n=A(t.id);return e.totalStock+=n,t.active!==!1&&n<_?e.danger+=1:t.active!==!1&&n<g&&(e.warning+=1),e},{totalStock:0,danger:0,warning:0})}function le(e,t,n){return b.filter(r=>r.supplementTypeId===e&&r.date===t&&r.type===n).reduce((e,t)=>e+Number(t.qty||0),0)}function ue(e,t,n){return b.some(r=>r.supplementTypeId===e&&r.date===t&&r.type===n)}function de(e){return b.find(t=>t.supplementTypeId===e)}function P(e,t){return t?{label:`비활성`,className:`supplement-status--inactive`}:e<_?{label:`부족`,className:`supplement-status--danger`}:e<g?{label:`주의`,className:`supplement-status--warning`}:{label:`정상`,className:`supplement-status--normal`}}function F(e,t){let n=P(e,t);return`<span class="supplement-status ${n.className}">${n.label}</span>`}function I(e){let t=de(e);if(!t)return`<span class="supplement-muted">-</span>`;let n=Number.isFinite(Number(t.after))?` / 잔량 ${Number(t.after)}봉`:``;return`
    <div class="supplement-recent-change">
      <span class="supplement-recent-date">${$(t.date||`-`)}</span>
      ${H(t.type)}
      <span class="supplement-recent-qty">${Q(t.qty)}${n}</span>
    </div>
  `}function L(e){let t=A(e.id),n=e.active===!1,r=n?``:t<_?`supplement-qty--danger`:t<g?`supplement-qty--warning`:``;return`
    <tr class="${n?`supplement-row--inactive`:``}">
      <td class="supplement-td-name">
        ${$(e.name||e.id)}
        ${n?`<span class="tag tag-inactive">비활성</span>`:``}
      </td>
      <td class="supplement-td-qty ${r}">${t}봉</td>
      <td class="supplement-td-status">${F(t,n)}</td>
      <td class="supplement-td-recent">${I(e.id)}</td>
      <td class="supplement-td-actions">
        ${!n&&B()?`<button class="btn-secondary supplement-action-in" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">입고</button>`:``}
        ${!n&&z()?`<button class="btn-secondary supplement-action-adjust" data-id="${$(e.id)}" data-name="${$(e.name||e.id)}">수동조정</button>`:``}
      </td>
    </tr>
  `}function R(e){let t=ce(e.types),n=t.danger>0||t.warning>0,r=[t.danger>0?`부족 ${t.danger}`:``,t.warning>0?`주의 ${t.warning}`:``].filter(Boolean).join(` · `);return`
    <details class="supplement-recipe-group"${x===`all`?``:` open`} data-recipe-id="${$(e.recipeId)}">
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
            ${e.types.map(e=>L(e)).join(``)}
          </tbody>
        </table>
      </div>
    </details>
  `}function z(){return f===`admin`||f===`office`}function B(){return f===`admin`||f===`office`||f===`production`}function V(){let e=j();return v.length===0?`<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>`:e.length===0?`<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>`:`
    <div class="supplement-recipe-groups">
      ${se(e).map(e=>R(e)).join(``)}
    </div>
  `}function fe(e){return e.length===0?`<div class="list-empty supplement-log-empty">이력이 없습니다</div>`:`
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
            <td>${be(e.timestamp)}</td>
            <td>${$(ae(e.supplementTypeId))}</td>
            <td>${H(e.type)}</td>
            <td style="color:${Number(e.qty||0)<0?`#e53e3e`:`#2d7a3a`}">${Q(e.qty)}</td>
            <td>${Number.isFinite(Number(e.after))?Number(e.after):`-`}</td>
            <td>${$(e.staffName||`-`)}</td>
            <td>${$([e.reason,e.note].filter(Boolean).join(` / `)||`-`)}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function H(e){return e===`in`?`<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>`:e===`autoDeduct`?`<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>`:e===`adjust`?`<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>`:`<span class="tag tag-common">${$(e||`-`)}</span>`}function pe(){document.getElementById(`btnSupplementRefresh`)?.addEventListener(`click`,async()=>{await D()}),document.getElementById(`supplementFilter`)?.addEventListener(`change`,e=>{x=e.target.value;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=V()),U()}),document.getElementById(`btnSupplementAllLogs`)?.addEventListener(`click`,_e),document.getElementById(`btnSupplementExcel`)?.addEventListener(`click`,oe),document.getElementById(`supplementInStaff`)?.addEventListener(`change`,e=>{w=e.target.value}),document.getElementById(`supplementAdjustStaff`)?.addEventListener(`change`,e=>{T=e.target.value}),document.getElementById(`supplementAdjustReason`)?.addEventListener(`input`,e=>{E=e.target.value}),U()}function U(){document.querySelectorAll(`.supplement-action-in`).forEach(e=>{e.addEventListener(`click`,()=>me(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-action-adjust`).forEach(e=>{e.addEventListener(`click`,()=>he(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-cell-input[data-cell="in"]`).forEach(e=>{e.addEventListener(`blur`,e=>ge(e.target))}),document.querySelectorAll(`.supplement-cell-input[data-cell="adjust"]`).forEach(e=>{e.addEventListener(`blur`,e=>q(e.target))}),document.querySelectorAll(`.supplement-cell--in.supplement-cell--locked`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date,n=e.dataset.typeId,r=le(n,t,`in`);alert(`이미 ${r}봉 입고 기록이 있습니다. 추가·정정은 수동조정을 사용해주세요.`)})})}function W(e){return ye(Z(e)).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``)}async function G(){await O();let e=document.getElementById(`supplementTableWrap`);e&&(e.innerHTML=V(),U())}function me(e,t){Y(`
    <h3 class="modal-title">영양제 입고 — ${$(t)}</h3>
    <div class="form-group">
      <label>수량(봉) *</label>
      <input type="number" id="sup_in_qty" min="1" step="1" placeholder="봉 수" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="sup_in_staff">
        <option value="">선택</option>
        ${W(`supplementStockIn`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupIn">저장</button>
    </div>
  `),document.getElementById(`btnSaveSupIn`)?.addEventListener(`click`,async()=>{let t=Number(document.getElementById(`sup_in_qty`)?.value||``),n=document.getElementById(`sup_in_staff`)?.value||``;if(!Number.isFinite(t)||t<=0||!Number.isInteger(t)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}if(!n){alert(`입고 담당자를 선택해주세요.`);return}let r=document.getElementById(`btnSaveSupIn`);r.disabled=!0;try{await K(e,p(),t,n),closeModal(),await G(),alert(`입고 완료`)}catch(e){console.error(`[supplement] incoming modal save failed:`,e),alert(`입고 등록 중 오류가 발생했습니다: ${e.message||e}`),r.disabled=!1}})}function he(e,t){Y(`
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
        ${W(`supplementAdjust`)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSupAdj">저장</button>
    </div>
  `),document.getElementById(`btnSaveSupAdj`)?.addEventListener(`click`,async()=>{let t=Number(document.getElementById(`sup_adj_qty`)?.value||``),n=document.getElementById(`sup_adj_reason`)?.value.trim()||``,r=document.getElementById(`sup_adj_staff`)?.value||``;if(!Number.isFinite(t)||t===0||!Number.isInteger(t)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`);return}if(!n){alert(`수동조정 사유를 입력해주세요.`);return}if(!r){alert(`수동조정 담당자를 선택해주세요.`);return}let i=document.getElementById(`btnSaveSupAdj`);i.disabled=!0;try{await J(e,p(),t,n,r),closeModal(),await G(),alert(`조정 완료`)}catch(e){console.error(`[supplement] adjust modal save failed:`,e),e.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${e.message||e}`),i.disabled=!1}})}async function ge(e){let t=e.dataset.typeId,n=e.dataset.date,r=e.value.trim();if(!r)return;let i=Number(r);if(!Number.isFinite(i)||i<=0||!Number.isInteger(i)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`),e.value=``;return}if(ue(t,n,`in`)){alert(`이미 입고 기록이 있습니다. 새로고침 후 확인해주세요.`),e.value=``;return}let a=w;if(!a){alert(`입고 담당자를 선택해주세요.`),e.value=``;return}e.disabled=!0;try{await K(t,n,i,a),await D()}catch(t){console.error(`[supplement] incoming cell save failed:`,t),alert(`입고 등록 중 오류가 발생했습니다: ${t.message||t}`),e.disabled=!1}}async function K(n,r,a,o){let s=t(u,`supplementStock`,n),c=t(l(u,`supplementLogs`));await i(u,async t=>{let i=await t.get(s),l=Number(i.exists()&&i.data().currentQty||0),u=l+a;t.set(s,{id:n,supplementTypeId:n,currentQty:u,updatedAt:e()},{merge:!0}),t.set(c,{date:r,timestamp:e(),supplementTypeId:n,type:`in`,qty:a,before:l,after:u,staffName:o})})}async function q(e){let t=e.dataset.typeId,n=e.dataset.date,r=e.value.trim();if(!r)return;let i=Number(r);if(!Number.isFinite(i)||i===0||!Number.isInteger(i)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`),e.value=``;return}let a=E.trim();if(!a){alert(`수동조정 사유를 입력해주세요.`),e.value=``;return}let o=T;if(!o){alert(`수동조정 담당자를 선택해주세요.`),e.value=``;return}e.disabled=!0;try{await J(t,n,i,a,o),await D()}catch(t){console.error(`[supplement] adjust cell save failed:`,t),t.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${t.message||t}`),e.disabled=!1}}async function J(n,r,a,o,s){let c=t(u,`supplementStock`,n),d=t(l(u,`supplementLogs`)),f=t(l(u,`activityLogs`)),p=v.find(e=>e.id===n)?.name||n,m=a>0?`+`:``;await i(u,async t=>{let i=await t.get(c),l=Number(i.exists()&&i.data().currentQty||0),u=l+a;if(u<0)throw Error(`NEGATIVE_SUPPLEMENT_STOCK`);t.set(c,{id:n,supplementTypeId:n,currentQty:u,updatedAt:e()},{merge:!0}),t.set(d,{date:r,timestamp:e(),supplementTypeId:n,type:`adjust`,qty:a,before:l,after:u,staffName:s,reason:o}),t.set(f,{action:`supplementStock`,subAction:`manualAdjust`,date:r,staff:s,uid:ee?.uid||null,timestamp:e(),message:`영양제 수동조정 — ${p} ${m}${a}봉 / 사유: ${o} / 담당: ${s}`,details:{supplementTypeId:n,supplementName:p,signedQty:a,before:l,after:u,reason:o,note:null},read:!1,acknowledged:!1,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null})})}async function _e(){Y(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${fe((await s(r(l(u,`supplementLogs`),c(`timestamp`,`desc`),n(200)))).docs.map(e=>({id:e.id,...e.data()})))}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,`modal-wide`)}function Y(e,t=``){let n=document.querySelector(`.modal-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`modalOverlay`,r.className=`modal-overlay`,r.innerHTML=`<div class="modal-box ${t}">${e}</div>`,document.body.appendChild(r),r.addEventListener(`click`,e=>{e.target===r&&closeModal()})}d(`supplement`,function(){document.querySelector(`.modal-overlay`)?.remove()});async function X(){C=await h()}async function ve(){C||await X();let e=[...Z(`supplementStockIn`),...Z(`supplementAdjust`)].filter((e,t,n)=>n.indexOf(e)===t).filter(e=>!S[e]);e.length!==0&&await Promise.all(e.map(async e=>{let n=await o(t(u,`staffGroups`,e));S[e]=n.exists()&&n.data().members||[]}))}function Z(e){let t=C?.[e];return Array.isArray(t)&&t.length>0?t:[]}function ye(e){let t=new Map;return e.forEach(e=>{(S[e]||[]).forEach(e=>{e?.name&&!t.has(e.name)&&t.set(e.name,e)})}),Array.from(t.values())}function Q(e){let t=Number(e||0);return`${t>0?`+`:``}${t}`}function be(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return Number.isNaN(t.getTime())?`-`:t.toLocaleTimeString(`ko-KR`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})}function $(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}export{D as renderSupplement};