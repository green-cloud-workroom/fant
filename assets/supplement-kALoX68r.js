import{a as e,b as t,c as n,g as r,h as i,i as a,l as o,o as s,p as c,s as l}from"./index.esm-Cf9DaHbi.js";import{n as u}from"./firebase-BQPCO7kq.js";import{A as ee,j as d,w as f}from"./index-CMgkQ4he.js";import{i as p,o as m}from"./menuStaffGroups-Cqf_Tdsi.js";import{n as h,t as g}from"./xlsx-BNghBQ_B.js";var te=14,_=10,v=5,y=[],b=[],x=[],S=`all`,C={},w=null,T=``,E=``,D=``;async function O(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>영양제 재고 로딩 중...</p></div>`,await Promise.all([k(),X(),ne()]),await ve(),e.isConnected&&A()}async function ne(){let e=await m();_=Number(e.supplementThresholdYellow)||10,v=Number(e.supplementThresholdRed)||5}async function k(){let t=re(),r=t[t.length-1],[a,o,s]=await Promise.all([e(n(i(u,`supplementTypes`),l(`sortOrder`))),e(i(u,`supplementStock`)),e(n(i(u,`supplementLogs`),c(`date`,`>=`,r)))]);y=a.docs.map(e=>({id:e.id,...e.data()})),b=o.docs.map(e=>({id:e.id,...e.data()})),x=s.docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>{if(e.date!==t.date)return e.date<t.date?1:-1;let n=e.timestamp?.seconds||0;return(t.timestamp?.seconds||0)-n})}function re(){let e=f(),t=new Date(`${e}T00:00:00`),n=[];for(let e=0;e<te;e++){let r=new Date(t);r.setDate(t.getDate()-e);let i=r.getFullYear(),a=String(r.getMonth()+1).padStart(2,`0`),o=String(r.getDate()).padStart(2,`0`);n.push(`${i}-${a}-${o}`)}return n}function A(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="supplement-page">
      <div class="supplement-toolbar">
        <div class="supplement-toolbar-actions">
          <span class="supplement-toolbar-title">영양제 재고</span>
        </div>
        <div class="supplement-toolbar-actions">
          <select id="supplementFilter" class="supplement-filter-select" aria-label="영양제 재고 필터">
            <option value="all" ${S===`all`?`selected`:``}>전체</option>
            <option value="warning" ${S===`warning`?`selected`:``}>${_}봉 미만만</option>
            <option value="danger" ${S===`danger`?`selected`:``}>${v}봉 미만만</option>
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
  `,pe()}function j(e){let t=b.find(t=>t.id===e||t.supplementTypeId===e);return Number(t?.currentQty||0)}function ie(e){return y.find(t=>t.id===e)?.name||e||`-`}function M(){return y.filter(e=>{if(e.active===!1)return!0;let t=j(e.id);return S===`warning`?t<_:S===`danger`?t<v:!0})}function ae(){let e=M();if(e.length===0){alert(`다운로드할 영양제 SKU가 없습니다.`);return}let t=[[`영양제 SKU`,`재고`,`영양제 SKU`,`재고`]];for(let n=0;n<e.length;n+=2){let r=e[n],i=e[n+1];t.push([r?.name||r?.id||``,r?`${j(r.id)}봉`:``,i?.name||i?.id||``,i?`${j(i.id)}봉`:``])}let n=g.aoa_to_sheet(t);n[`!cols`]=[{wch:34},{wch:10},{wch:34},{wch:10}];let r=g.book_new();g.book_append_sheet(r,n,`영양제재고`),h(r,`영양제재고_${f().replaceAll(`-`,``)}.xlsx`)}function N(e){let t=Number(e.unit);return Number.isFinite(t)?t:0}function P(e){let t=Number(e.sortOrder);return Number.isFinite(t)?Math.floor(t/100):999999}function oe(e){let t=new Map;for(let n of e){let e=n.recipeId||`__ungrouped_${n.id}`;t.has(e)||t.set(e,{recipeId:e,recipeName:n.recipeName||n.name||e,sortOrder:P(n),types:[]});let r=t.get(e);r.types.push(n),r.sortOrder=Math.min(r.sortOrder,P(n)),n.recipeName&&(r.recipeName=n.recipeName)}return[...t.values()].map(e=>({...e,types:e.types.sort((e,t)=>N(e)-N(t))})).sort((e,t)=>e.sortOrder-t.sortOrder||e.recipeName.localeCompare(t.recipeName))}function se(e){return e.reduce((e,t)=>{let n=j(t.id);return e.totalStock+=n,t.active!==!1&&n<v?e.danger+=1:t.active!==!1&&n<_&&(e.warning+=1),e},{totalStock:0,danger:0,warning:0})}function ce(e,t,n){return x.filter(r=>r.supplementTypeId===e&&r.date===t&&r.type===n).reduce((e,t)=>e+Number(t.qty||0),0)}function le(e,t,n){return x.some(r=>r.supplementTypeId===e&&r.date===t&&r.type===n)}function ue(e){return x.find(t=>t.supplementTypeId===e)}function de(e,t){return t?{label:`비활성`,className:`supplement-status--inactive`}:e<v?{label:`부족`,className:`supplement-status--danger`}:e<_?{label:`주의`,className:`supplement-status--warning`}:{label:`정상`,className:`supplement-status--normal`}}function F(e,t){let n=de(e,t);return`<span class="supplement-status ${n.className}">${n.label}</span>`}function I(e){let t=ue(e);if(!t)return`<span class="supplement-muted">-</span>`;let n=Number.isFinite(Number(t.after))?` / 잔량 ${Number(t.after)}봉`:``;return`
    <div class="supplement-recent-change">
      <span class="supplement-recent-date">${$(t.date||`-`)}</span>
      ${H(t.type)}
      <span class="supplement-recent-qty">${Q(t.qty)}${n}</span>
    </div>
  `}function L(e){let t=j(e.id),n=e.active===!1,r=n?``:t<v?`supplement-qty--danger`:t<_?`supplement-qty--warning`:``;return`
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
  `}function R(e){let t=se(e.types),n=t.danger>0||t.warning>0,r=[t.danger>0?`부족 ${t.danger}`:``,t.warning>0?`주의 ${t.warning}`:``].filter(Boolean).join(` · `);return`
    <details class="supplement-recipe-group"${S===`all`?``:` open`} data-recipe-id="${$(e.recipeId)}">
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
  `}function z(){return d===`admin`||d===`office`}function B(){return d===`admin`||d===`office`||d===`production`}function V(){let e=M();return y.length===0?`<div class="list-empty">등록된 영양제가 없습니다. 레시피 관리에서 생산단위 프리셋을 설정해주세요.</div>`:e.length===0?`<div class="list-empty">필터 조건에 맞는 영양제가 없습니다</div>`:`
    <div class="supplement-recipe-groups">
      ${oe(e).map(e=>R(e)).join(``)}
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
            <td>${$(ie(e.supplementTypeId))}</td>
            <td>${H(e.type)}</td>
            <td style="color:${Number(e.qty||0)<0?`#e53e3e`:`#2d7a3a`}">${Q(e.qty)}</td>
            <td>${Number.isFinite(Number(e.after))?Number(e.after):`-`}</td>
            <td>${$(e.staffName||`-`)}</td>
            <td>${$([e.reason,e.note].filter(Boolean).join(` / `)||`-`)}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function H(e){return e===`in`?`<span class="tag supplement-log-tag supplement-log-tag--in">입고</span>`:e===`autoDeduct`?`<span class="tag supplement-log-tag supplement-log-tag--auto">자동차감</span>`:e===`adjust`?`<span class="tag supplement-log-tag supplement-log-tag--adjust">수동조정</span>`:`<span class="tag tag-common">${$(e||`-`)}</span>`}function pe(){document.getElementById(`btnSupplementRefresh`)?.addEventListener(`click`,async()=>{await O()}),document.getElementById(`supplementFilter`)?.addEventListener(`change`,e=>{S=e.target.value;let t=document.getElementById(`supplementTableWrap`);t&&(t.innerHTML=V()),U()}),document.getElementById(`btnSupplementAllLogs`)?.addEventListener(`click`,_e),document.getElementById(`btnSupplementExcel`)?.addEventListener(`click`,ae),document.getElementById(`supplementInStaff`)?.addEventListener(`change`,e=>{T=e.target.value}),document.getElementById(`supplementAdjustStaff`)?.addEventListener(`change`,e=>{E=e.target.value}),document.getElementById(`supplementAdjustReason`)?.addEventListener(`input`,e=>{D=e.target.value}),U()}function U(){document.querySelectorAll(`.supplement-action-in`).forEach(e=>{e.addEventListener(`click`,()=>me(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-action-adjust`).forEach(e=>{e.addEventListener(`click`,()=>he(e.dataset.id,e.dataset.name))}),document.querySelectorAll(`.supplement-cell-input[data-cell="in"]`).forEach(e=>{e.addEventListener(`blur`,e=>ge(e.target))}),document.querySelectorAll(`.supplement-cell-input[data-cell="adjust"]`).forEach(e=>{e.addEventListener(`blur`,e=>q(e.target))}),document.querySelectorAll(`.supplement-cell--in.supplement-cell--locked`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date,n=e.dataset.typeId,r=ce(n,t,`in`);alert(`이미 ${r}봉 입고 기록이 있습니다. 추가·정정은 수동조정을 사용해주세요.`)})})}function W(e){return ye(Z(e)).map(e=>`<option value="${$(e.name)}">${$(e.name)}</option>`).join(``)}async function G(){await k();let e=document.getElementById(`supplementTableWrap`);e&&(e.innerHTML=V(),U())}function me(e,t){Y(`
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
  `),document.getElementById(`btnSaveSupIn`)?.addEventListener(`click`,async()=>{let t=Number(document.getElementById(`sup_in_qty`)?.value||``),n=document.getElementById(`sup_in_staff`)?.value||``;if(!Number.isFinite(t)||t<=0||!Number.isInteger(t)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`);return}if(!n){alert(`입고 담당자를 선택해주세요.`);return}let r=document.getElementById(`btnSaveSupIn`);r.disabled=!0;try{await K(e,f(),t,n),closeModal(),await G(),alert(`입고 완료`)}catch(e){console.error(`[supplement] incoming modal save failed:`,e),alert(`입고 등록 중 오류가 발생했습니다: ${e.message||e}`),r.disabled=!1}})}function he(e,t){Y(`
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
  `),document.getElementById(`btnSaveSupAdj`)?.addEventListener(`click`,async()=>{let t=Number(document.getElementById(`sup_adj_qty`)?.value||``),n=document.getElementById(`sup_adj_reason`)?.value.trim()||``,r=document.getElementById(`sup_adj_staff`)?.value||``;if(!Number.isFinite(t)||t===0||!Number.isInteger(t)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`);return}if(!n){alert(`수동조정 사유를 입력해주세요.`);return}if(!r){alert(`수동조정 담당자를 선택해주세요.`);return}let i=document.getElementById(`btnSaveSupAdj`);i.disabled=!0;try{await J(e,f(),t,n,r),closeModal(),await G(),alert(`조정 완료`)}catch(e){console.error(`[supplement] adjust modal save failed:`,e),e.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${e.message||e}`),i.disabled=!1}})}async function ge(e){let t=e.dataset.typeId,n=e.dataset.date,r=e.value.trim();if(!r)return;let i=Number(r);if(!Number.isFinite(i)||i<=0||!Number.isInteger(i)){alert(`입고 수량은 1 이상의 정수로 입력해주세요.`),e.value=``;return}if(le(t,n,`in`)){alert(`이미 입고 기록이 있습니다. 새로고침 후 확인해주세요.`),e.value=``;return}let a=T;if(!a){alert(`입고 담당자를 선택해주세요.`),e.value=``;return}e.disabled=!0;try{await K(t,n,i,a),await O()}catch(t){console.error(`[supplement] incoming cell save failed:`,t),alert(`입고 등록 중 오류가 발생했습니다: ${t.message||t}`),e.disabled=!1}}async function K(e,n,a,s){let c=r(u,`supplementStock`,e),l=r(i(u,`supplementLogs`));await o(u,async r=>{let i=await r.get(c),o=Number(i.exists()&&i.data().currentQty||0),u=o+a;r.set(c,{id:e,supplementTypeId:e,currentQty:u,updatedAt:t()},{merge:!0}),r.set(l,{date:n,timestamp:t(),supplementTypeId:e,type:`in`,qty:a,before:o,after:u,staffName:s})})}async function q(e){let t=e.dataset.typeId,n=e.dataset.date,r=e.value.trim();if(!r)return;let i=Number(r);if(!Number.isFinite(i)||i===0||!Number.isInteger(i)){alert(`수동조정 수량은 0이 아닌 정수로 입력해주세요. (예: +5, -3)`),e.value=``;return}let a=D.trim();if(!a){alert(`수동조정 사유를 입력해주세요.`),e.value=``;return}let o=E;if(!o){alert(`수동조정 담당자를 선택해주세요.`),e.value=``;return}e.disabled=!0;try{await J(t,n,i,a,o),await O()}catch(t){console.error(`[supplement] adjust cell save failed:`,t),t.message===`NEGATIVE_SUPPLEMENT_STOCK`?alert(`재고가 마이너스가 됩니다. 조정 수량을 확인해주세요.`):alert(`수동 조정 중 오류가 발생했습니다: ${t.message||t}`),e.disabled=!1}}async function J(e,n,a,s,c){let l=r(u,`supplementStock`,e),d=r(i(u,`supplementLogs`)),f=r(i(u,`activityLogs`)),p=y.find(t=>t.id===e)?.name||e,m=a>0?`+`:``;await o(u,async r=>{let i=await r.get(l),o=Number(i.exists()&&i.data().currentQty||0),u=o+a;if(u<0)throw Error(`NEGATIVE_SUPPLEMENT_STOCK`);r.set(l,{id:e,supplementTypeId:e,currentQty:u,updatedAt:t()},{merge:!0}),r.set(d,{date:n,timestamp:t(),supplementTypeId:e,type:`adjust`,qty:a,before:o,after:u,staffName:c,reason:s}),r.set(f,{action:`supplementStock`,subAction:`manualAdjust`,date:n,staff:c,uid:ee?.uid||null,timestamp:t(),message:`영양제 수동조정 — ${p} ${m}${a}봉 / 사유: ${s} / 담당: ${c}`,details:{supplementTypeId:e,supplementName:p,signedQty:a,before:o,after:u,reason:s,note:null},read:!1,acknowledged:!1,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null})})}async function _e(){Y(`
    <h3 class="modal-title">영양제 전체 이력</h3>
    <div class="table-wrap">
      ${fe((await e(n(i(u,`supplementLogs`),l(`timestamp`,`desc`),s(200)))).docs.map(e=>({id:e.id,...e.data()})))}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,`modal-wide`)}function Y(e,t=``){let n=document.querySelector(`.modal-overlay`);n&&n.remove();let r=document.createElement(`div`);r.id=`modalOverlay`,r.className=`modal-overlay`,r.innerHTML=`<div class="modal-box ${t}">${e}</div>`,document.body.appendChild(r),r.addEventListener(`click`,e=>{e.target===r&&closeModal()})}window.closeModal=function(){document.querySelector(`.modal-overlay`)?.remove()};async function X(){w=await p()}async function ve(){w||await X();let e=[...Z(`supplementStockIn`),...Z(`supplementAdjust`)].filter((e,t,n)=>n.indexOf(e)===t).filter(e=>!C[e]);e.length!==0&&await Promise.all(e.map(async e=>{let t=await a(r(u,`staffGroups`,e));C[e]=t.exists()&&t.data().members||[]}))}function Z(e){let t=w?.[e];return Array.isArray(t)&&t.length>0?t:[]}function ye(e){let t=new Map;return e.forEach(e=>{(C[e]||[]).forEach(e=>{e?.name&&!t.has(e.name)&&t.set(e.name,e)})}),Array.from(t.values())}function Q(e){let t=Number(e||0);return`${t>0?`+`:``}${t}`}function be(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e.seconds?e.seconds*1e3:e);return Number.isNaN(t.getTime())?`-`:t.toLocaleTimeString(`ko-KR`,{hour:`2-digit`,minute:`2-digit`,hour12:!1})}function $(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}export{O as renderSupplement};