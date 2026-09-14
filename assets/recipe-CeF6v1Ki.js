import{a as e,b as t,c as n,g as r,h as i,i as a,m as o,p as s,s as c}from"./index.esm-Cf9DaHbi.js";import{n as l}from"./firebase-BQPCO7kq.js";import{A as u,j as d,m as f,w as p}from"./index-CMgkQ4he.js";import{n as m}from"./activityLogs-Mn_dgBRB.js";import{t as h}from"./sortable.esm-D0d_dJ5t.js";import{n as g,r as _,t as v}from"./supplement-CmmVBqes.js";var y=[],b=null,x=[],S=[],C=[],w=[],T=[{methodKey:`rotary`,label:`로터리`},{methodKey:`manual`,label:`수동`}];async function ee(){return(await e(n(i(l,`meatTypes`),c(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function te(){return(await e(n(i(l,`bagTypes`),c(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function ne(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>레시피 로딩 중...</p></div>`;let t=await Promise.all([E(),ee(),te()]);e.isConnected&&([y,x,S]=t,D())}async function E(){return(await e(n(i(l,`recipes`),c(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}function D(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 레시피 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">레시피 목록</span>
          ${d===`admin`||d===`office`?`<button class="btn-primary" id="btnNewRecipe">+ 신규 추가</button>`:``}
        </div>
        <div class="recipe-list" id="recipeList">
          ${re()}
        </div>
      </div>

      <!-- 오른쪽: 레시피 상세 -->
      <div class="recipe-detail-panel" id="recipeDetail">
        <div class="detail-empty">레시피를 선택하거나 새로 추가해주세요</div>
      </div>
    </div>
  `,W(),G(),document.getElementById(`btnNewRecipe`)?.addEventListener(`click`,q)}function O(e){let t=d===`admin`||d===`office`;return`
    <div class="recipe-list-item ${b===e.id?`active`:``}" data-id="${e.id}" style="border-left-color: ${e.color||`#4A7C59`}">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
      <div class="recipe-list-info">
        <span class="recipe-name">${k(e)}</span>
        <div class="recipe-tags">
          <span class="tag tag-${e.category}">${e.category===`raw`?`생식`:`동결`}</span>
          <span class="tag tag-${e.target}">${ie(e.target)}</span>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" class="recipe-active-toggle" data-id="${e.id}" ${e.active?`checked`:``} ${t?``:`disabled`}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `}function re(){if(y.length===0)return`<div class="list-empty">등록된 레시피 없음</div>`;let e=y.filter(e=>e.active!==!1),t=y.filter(e=>e.active===!1),n=e.filter(e=>e.category===`raw`),r=e.filter(e=>e.category===`freezeDry`),i=``;return n.length>0&&(i+=`<div class="list-group-label">생식</div>`,i+=`<div class="sortable-master-list" id="recipeListRaw" data-category="raw">${n.map(e=>O(e)).join(``)}</div>`),r.length>0&&(i+=`<div class="list-group-label">동결건조</div>`,i+=`<div class="sortable-master-list" id="recipeListFreezeDry" data-category="freezeDry">${r.map(e=>O(e)).join(``)}</div>`),t.length>0&&(i+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,i+=`<div class="master-inactive-list">${t.map(e=>O(e)).join(``)}</div>`),i}function k(e){return(e.target===`cat`?`고양이 `:e.target===`dog`?`강아지 `:``)+e.name}function ie(e){return e===`cat`?`고양이`:e===`dog`?`강아지`:`공용`}function A(){return d===`admin`?`대표`:d===`office`?`사무실`:d===`production`?`생산실`:`시스템`}function j(e){return T.find(t=>t.methodKey===e)?.label||e}function M(e){if(!Array.isArray(e))return[];let t=new Set;return e.map(e=>{let n=e?.methodKey;if(!T.some(e=>e.methodKey===n)||t.has(n))return null;t.add(n);let r=Number(e.unitToBox);return{methodKey:n,label:j(n),unitToBox:Number.isFinite(r)?r:0,effectiveDate:e.effectiveDate||p(),active:e.active!==!1}}).filter(Boolean)}function N(e){return`
    <div class="form-row production-methods-row" id="productionMethodsSection" ${e===`raw`?``:`style="display:none"`}>
      <div class="form-group production-methods-group">
        <label>생산 방식별 환산값 (생식 한정)</label>
        <div class="production-methods-table" id="productionMethodsTable">
          ${P()}
        </div>
        <div class="production-methods-actions">
          <select id="productionMethodAddSelect" class="production-method-add-select"></select>
          <button type="button" class="btn-secondary" id="btnAddProductionMethod">+ 방식 추가</button>
          <span class="production-methods-hint" id="productionMethodsHint"></span>
        </div>
      </div>
    </div>
  `}function P(){return w.length===0?`<div class="production-methods-empty">등록된 생산 방식별 환산값이 없습니다.</div>`:`
    <div class="production-methods-header">
      <span>방식</span>
      <span>단위 1 → 박스</span>
      <span>적용 시작일</span>
      <span>활성</span>
    </div>
    ${w.map(e=>`
      <div class="production-method-row" data-method-key="${e.methodKey}">
        <div class="production-method-label">${e.label||j(e.methodKey)}</div>
        <input type="number" class="production-method-unit" value="${e.unitToBox||``}" min="0.01" step="0.01" placeholder="0.83" />
        <input type="date" class="production-method-date" value="${e.effectiveDate||p()}" />
        <label class="production-method-active">
          <input type="checkbox" class="production-method-active-input" ${e.active===!1?``:`checked`} />
        </label>
      </div>
    `).join(``)}
  `}function F(){let e=document.getElementById(`productionMethodsTable`);e&&(e.innerHTML=P());let t=document.getElementById(`productionMethodAddSelect`),n=document.getElementById(`btnAddProductionMethod`),r=document.getElementById(`productionMethodsHint`);if(!t||!n||!r)return;let i=new Set(w.map(e=>e.methodKey)),a=T.filter(e=>!i.has(e.methodKey));t.innerHTML=a.map(e=>`<option value="${e.methodKey}">${e.label}</option>`).join(``),t.disabled=a.length===0,n.disabled=a.length===0,r.textContent=a.length===0?`더 추가할 방식이 없습니다`:``}function I(){F(),document.getElementById(`btnAddProductionMethod`)?.addEventListener(`click`,()=>{let e=document.getElementById(`productionMethodAddSelect`)?.value;!e||w.some(t=>t.methodKey===e)||(w.push({methodKey:e,label:j(e),unitToBox:0,effectiveDate:p(),active:!0}),F())})}function L(){let e=Array.from(document.querySelectorAll(`.production-method-row`)),t=new Set,n=[];for(let r of e){let e=r.dataset.methodKey;if(!e||t.has(e))return alert(`같은 생산방식은 중복 등록할 수 없습니다.`),null;t.add(e);let i=Number(r.querySelector(`.production-method-unit`)?.value),a=r.querySelector(`.production-method-date`)?.value||``;if(!Number.isFinite(i)||i<=0)return alert(`환산값은 0보다 큰 숫자로 입력해주세요.`),null;if(!a)return alert(`환산값 적용 시작일을 입력해주세요.`),null;n.push({methodKey:e,label:j(e),unitToBox:i,effectiveDate:a,active:r.querySelector(`.production-method-active-input`)?.checked!==!1})}return n}function R(e,t){let n=new Map(M(e).map(e=>[e.methodKey,e]));return t.map(e=>{let t=n.get(e.methodKey);return t?Number(t.unitToBox)===Number(e.unitToBox)?null:{methodKey:e.methodKey,from:Number(t.unitToBox),to:e.unitToBox,effectiveDate:e.effectiveDate}:{methodKey:e.methodKey,from:null,to:e.unitToBox,effectiveDate:e.effectiveDate}}).filter(Boolean)}function z(e,n,a){a.forEach(a=>{let o=r(i(l,`recipes`,n,`conversionHistory`));e.set(o,{methodKey:a.methodKey,unitToBox:a.to,prevUnitToBox:a.from,effectiveDate:a.effectiveDate,reason:`manual`,basedOnAvgOfRecent5:!1,createdAt:t(),createdBy:u?.uid||null})})}function B(e,t,n,r){let i=t.displayName||k(t);return{recipeId:e,recipeName:i,unit:n,name:g(i,n),active:t.active!==!1,sortOrder:_(t.sortOrder,r),updatedAt:new Date,updatedBy:u?.uid||null}}async function V(t){let[o,c,u]=await Promise.all([e(n(i(l,`productions`),s(`recipeId`,`==`,t.id))),e(n(i(l,`schedules`),s(`recipeId`,`==`,t.id))),e(n(i(l,`supplementTypes`),s(`recipeId`,`==`,t.id)))]),d=[];for(let t of u.docs){let o={id:t.id,...t.data()},[c,u]=await Promise.all([a(r(l,`supplementStock`,o.id)),e(n(i(l,`supplementLogs`),s(`supplementTypeId`,`==`,o.id)))]),f=Number(c.data()?.currentQty||0);d.push({sku:o,stockQty:f,stockExists:c.exists(),logDocs:u.docs})}return{productionCount:o.size,scheduleCount:c.size,supplementSummaries:d}}async function H(t,o){let c=[];for(let u of o){let o=v(t.id,u),d=await a(r(l,`supplementStock`,o)),f=await e(n(i(l,`supplementLogs`),s(`supplementTypeId`,`==`,o))),p=Number(d.data()?.currentQty||0);c.push({unit:u,supplementTypeId:o,name:g(k(t),u),stockQty:p,logCount:f.size,logDocs:f.docs})}return c}async function U(e,t){if(t.length===0)return!0;let n=await H(e,t);if(n.some(e=>e.stockQty>0)&&typeof window.openBlockingModal==`function`)return await window.openBlockingModal({variant:`warning`,data:{date:p(),warnings:n.map(e=>({reason:e.stockQty>0?`영양제 ${e.name} ${e.stockQty}봉이 있는데 정말 삭제하시겠습니까?`:`영양제 ${e.name}을 삭제합니다.`,details:[`생산단위: ${e.unit}`,`현재 재고: ${e.stockQty}봉`,`차감 이력: ${e.logCount}건`,`영양제 SKU, 재고, 이력이 함께 삭제됩니다.`]}))}})?n:!1;let r=n.some(e=>e.logCount>0)?n.map(e=>e.logCount>0?`생산단위 ${e.unit}의 차감 이력이 ${e.logCount}건 있습니다. 삭제 시 이력도 함께 삭제됩니다.`:`생산단위 ${e.unit}을 프리셋에서 삭제합니다. 영양제 SKU도 함께 삭제됩니다.`).join(`
`):n.map(e=>`생산단위 ${e.unit}을 프리셋에서 삭제합니다. 영양제 SKU도 함께 삭제됩니다.`).join(`
`);return window.confirm(`${r}\n진행하시겠습니까?`)?n:!1}function W(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.toggle-switch`)||t.target.closest(`.drag-handle`))return;let n=e.dataset.id;b=n,J(y.find(e=>e.id===n)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`)})}),document.querySelectorAll(`.recipe-active-toggle`).forEach(t=>{t.addEventListener(`change`,async t=>{if(d!==`admin`&&d!==`office`)return;let a=t.target.dataset.id,c=t.target.checked,f=y.find(e=>e.id===a),h=f?.active!==!1;try{let t=o(l);t.update(r(l,`recipes`,a),{active:c,updatedAt:new Date}),(await e(n(i(l,`supplementTypes`),s(`recipeId`,`==`,a)))).docs.forEach(e=>{t.update(r(l,`supplementTypes`,e.id),{active:c,updatedAt:new Date,updatedBy:u?.uid||null})}),await t.commit(),f&&(f.active=c),h!==c&&await m({action:`recipe`,subAction:`activeToggle`,date:p(),staff:A(),message:`Recipe ${c?`active`:`inactive`} — ${f?k(f):a}`,details:{recipeId:a,recipeName:f?k(f):null,active:c}})}catch(e){console.error(`[recipe] active save failed:`,e),alert(`활성 상태 저장 중 오류가 발생했습니다.`),t.target.checked=!c}})})}function G(){d!==`admin`&&d!==`office`||[[`recipeListRaw`,`raw`],[`recipeListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&h.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await K(t)}})})}async function K(t){let a=Array.from(document.getElementById(`recipeListRaw`)?.querySelectorAll(`.recipe-list-item`)||[]),c=Array.from(document.getElementById(`recipeListFreezeDry`)?.querySelectorAll(`.recipe-list-item`)||[]),d=[...a.map((e,t)=>({id:e.dataset.id,sortOrder:t})),...c.map((e,t)=>({id:e.dataset.id,sortOrder:a.length+t}))].filter(e=>e.id);if(d.length===0)return;if(d.length>450){alert(`순번 저장 항목이 너무 많습니다. 관리자에게 문의해주세요.`);return}let f=new Date,p=o(l),m=new Map(d.map(e=>[e.id,e.sortOrder])),h=y.filter(e=>m.has(e.id)),g=await Promise.all(h.map(async t=>({recipe:t,snap:await e(n(i(l,`supplementTypes`),s(`recipeId`,`==`,t.id)))}))),v=0;if(d.forEach(({id:e,sortOrder:t})=>{p.update(r(l,`recipes`,e),{sortOrder:t,updatedAt:f}),v+=1}),g.forEach(({recipe:e,snap:t})=>{let n=m.get(e.id),i=Array.isArray(e.unitPresets)?e.unitPresets:[];t.docs.forEach(e=>{let t=i.indexOf(e.data().unit);t<0||(p.update(r(l,`supplementTypes`,e.id),{sortOrder:_(n,t),updatedAt:f,updatedBy:u?.uid||null}),v+=1)})}),v>500){alert(`순번 저장 항목이 너무 많습니다. 관리자에게 문의해주세요.`);return}try{await p.commit(),y=y.map(e=>m.has(e.id)?{...e,sortOrder:m.get(e.id),updatedAt:f}:e).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){if(console.error(`[recipe] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),y=await E(),D(),b){let e=y.find(e=>e.id===b);e&&J(e)}}}function q(){b=null,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),J(null)}function J(e){let t=document.getElementById(`recipeDetail`),n=!e,r=d===`admin`||d===`office`;C=Array.isArray(e?.unitPresets)?[...e.unitPresets]:[],w=M(e?.productionMethods),t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${n?`새 레시피`:k(e)}</span>
      <div class="detail-actions">
        ${r?`<button class="btn-primary" id="btnSaveRecipe">저장</button>`:``}
        ${!n&&r?`<button class="btn-danger" id="btnDeleteRecipe">삭제</button>`:``}
      </div>
    </div>

    <div class="detail-body">
      <!-- 기본 정보 -->
      <div class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>레시피명 *</label>
            <input type="text" id="recipeName" value="${e?.name||``}" placeholder="레시피명 입력" />
          </div>
          <div class="form-group">
            <label>카테고리 *</label>
            <select id="recipeCategory">
              <option value="">선택</option>
              <option value="raw" ${e?.category===`raw`?`selected`:``}>생식</option>
              <option value="freezeDry" ${e?.category===`freezeDry`?`selected`:``}>동결건조</option>
            </select>
          </div>
          <div class="form-group">
            <label>대상 *</label>
            <select id="recipeTarget">
              <option value="">선택</option>
              <option value="cat" ${e?.target===`cat`?`selected`:``}>고양이</option>
              <option value="dog" ${e?.target===`dog`?`selected`:``}>강아지</option>
              <option value="common" ${e?.target===`common`?`selected`:``}>공용</option>
            </select>
          </div>
          <div class="form-group">
            <label>카드 색상</label>
            <input type="color" id="recipeColor" value="${e?.color||`#4A7C59`}" style="height:36px;width:60px;padding:2px;" />
          </div>
        </div>
        <!-- [봉투 연동] raw 카테고리 폼: 팩당 중량 + 봉투 선택 -->
        <div class="form-row" id="rawFields" style="${e?.category!==`raw`&&e?.category?`display:none`:``}">
          <div class="form-group">
            <label>팩당 중량 (g)</label>
            <input type="number" id="packWeightG" value="${e?.packWeightG||``}" placeholder="예: 75" />
          </div>
          <div class="form-group">
            <label>판당 팩수 (팩/판)</label>
            <input type="number" id="recipePacksPerPlate" value="${e?.packsPerPlate||``}" placeholder="비우면 설정 기본값" />
          </div>
          <div class="form-group">
            <label>사용 봉투 *</label>
            <select id="recipeBagType">
              <option value="">선택</option>
              ${S.filter(t=>t.active!==!1||e?.bagTypeId===t.id).map(t=>`<option value="${t.id}" ${e?.bagTypeId===t.id?`selected`:``}>${t.name}${t.active===!1?` (비활성)`:``}</option>`).join(``)}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>비고</label>
            <input type="text" id="recipeNote" value="${e?.note||``}" placeholder="비고" />
          </div>
        </div>
        <div id="freezeDryFields" style="${e?.category===`freezeDry`?``:`display:none`}">
          <div class="form-row">
            <div class="form-group">
              <label>생산단위 1당 봉지수</label>
              <input type="number" id="freezeDryBagCount" value="${e?.freezeDryBagCountPerUnit||``}" />
            </div>
            <div class="form-group" id="breadPanCountGroup" style="${e?.requiresSeparation===!1?`display:none`:``}">
              <label>생산단위 1당 빵판수</label>
              <input type="number" id="breadPanCount" value="${e?.breadPanCountPerUnit||``}" />
            </div>
            <div class="form-group">
              <label>생산단위 1당 동결판수</label>
              <input type="number" id="freezePanCount" value="${e?.freezePanCountPerUnit||``}" />
            </div>
            <div class="form-group">
              <label>분리작업 필요</label>
              <select id="requiresSeparation">
                <option value="false" ${e?.requiresSeparation?``:`selected`}>아니오</option>
                <option value="true" ${e?.requiresSeparation?`selected`:``}>예</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group unit-preset-group">
            <label>생산단위 프리셋</label>
            <div class="unit-preset-input-row">
              <input type="text" id="unitPresetInput" inputmode="decimal" placeholder="예: 10" />
              <button type="button" class="btn-secondary" id="btnAddUnitPreset">+ 추가</button>
            </div>
            <div class="unit-preset-chip-list" id="unitPresetChipList">
              ${Y()}
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="recipeUsesSupplement" ${e?.usesSupplement===!1?``:`checked`}>
              <span>영양제 사용</span>
            </label>
            <p class="hint-text" style="margin-top:4px;">체크 해제 시 이 레시피는 영양제 SKU·자동차감을 쓰지 않습니다 (예: 텐더동결).</p>
          </div>
        </div>
        ${N(e?.category)}
      </div>

      <!-- 원료 테이블 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">원료 목록</span>
          <button class="btn-secondary" id="btnAddIngredient">+ 행 추가</button>
        </div>
        <div class="table-wrap">
          <table class="data-table" id="ingredientTable">
            <thead>
              <tr>
                <th>원료명</th>
                <th>기준 중량</th>
                <th>생산단위</th>
                <th>단위명</th>
                <th>재고연동</th>
                <th>원육 종류</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="ingredientBody">
              ${ce(e?.ingredients||[])}
            </tbody>
          </table>
        </div>
        <p class="hint-text">💡 엑셀에서 원료명, 기준중량 복사 후 첫 셀에 붙여넣기 가능</p>
      </div>
    </div>
  `;let i=()=>{let e=document.getElementById(`recipeCategory`).value,t=document.getElementById(`requiresSeparation`)?.value===`true`;document.getElementById(`rawFields`).style.display=e===`raw`?``:`none`,document.getElementById(`freezeDryFields`).style.display=e===`freezeDry`?``:`none`;let n=document.getElementById(`productionMethodsSection`);n&&(n.style.display=e===`raw`?``:`none`);let r=document.getElementById(`breadPanCountGroup`);r&&(r.style.display=e===`freezeDry`&&t?``:`none`)};document.getElementById(`recipeCategory`).addEventListener(`change`,i),document.getElementById(`requiresSeparation`)?.addEventListener(`change`,i),i(),se(),I(),document.getElementById(`btnAddIngredient`).addEventListener(`click`,()=>{let e=document.getElementById(`ingredientBody`),t=e.querySelectorAll(`tr`).length;e.insertAdjacentHTML(`beforeend`,Q({},t)),$()}),document.getElementById(`ingredientBody`).addEventListener(`paste`,ue),$(),document.getElementById(`btnSaveRecipe`)?.addEventListener(`click`,()=>fe(e?.id)),document.getElementById(`btnDeleteRecipe`)?.addEventListener(`click`,()=>oe(e))}function ae(e,t){let n=t.length;t.reduce((e,t)=>e+t.stockQty,0);let r=t.reduce((e,t)=>e+t.logDocs.length,0),i=t.filter(e=>e.stockQty>0).map(e=>`${e.sku.name||e.sku.id} ${e.stockQty}봉`);return i.length>0?`영양제 재고가 남아있습니다.\n${i.join(`
`)}\n\n레시피와 영양제 SKU ${n}개, 영양제 이력 ${r}건이 모두 삭제됩니다.\n진행하시겠습니까?`:r>0?`영양제 이력 ${r}건이 함께 삭제됩니다.\n레시피와 영양제 SKU ${n}개를 삭제하시겠습니까?`:n>0?`레시피와 영양제 SKU ${n}개를 삭제하시겠습니까?`:`${k(e)} 레시피를 삭제하시겠습니까?`}async function oe(e){if(e?.id){if(d!==`admin`&&d!==`office`){alert(`레시피 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let t=await V(e);if(t.productionCount>0){alert(`이 레시피로 만든 생산 기록이 ${t.productionCount}건 있어 삭제할 수 없습니다.\n비활성화로 처리해주세요.`);return}if(t.scheduleCount>0){alert(`입고 예정 ${t.scheduleCount}건이 있어 삭제할 수 없습니다.`);return}if(!await f({title:`레시피 삭제`,message:ae(e,t.supplementSummaries),confirmText:`삭제`,danger:!0}))return;let n=o(l);n.delete(r(l,`recipes`,e.id)),t.supplementSummaries.forEach(e=>{n.delete(r(l,`supplementTypes`,e.sku.id)),e.stockExists&&n.delete(r(l,`supplementStock`,e.sku.id)),e.logDocs.forEach(e=>{n.delete(r(l,`supplementLogs`,e.id))})}),await n.commit();let i=t.supplementSummaries.length,a=t.supplementSummaries.reduce((e,t)=>e+t.stockQty,0),s=t.supplementSummaries.reduce((e,t)=>e+t.logDocs.length,0);await m({action:`recipe`,subAction:`delete`,date:p(),staff:A(),message:`레시피 삭제 — ${k(e)}`,details:{recipeId:e.id,recipeName:k(e),category:e.category===`freezeDry`?`dried`:`raw`,supplementSkuCount:i,supplementTotalQty:a,supplementLogCount:s}}),b=null,y=await E(),D(),alert(`레시피가 삭제되었습니다.`)}catch(e){console.error(`[recipe] delete failed:`,e),alert(`레시피 삭제 중 오류가 발생했습니다.`)}}}function Y(){return C.length?C.map((e,t)=>`
    <span class="unit-preset-chip">
      <span>${e}</span>
      <button type="button" class="unit-preset-remove" data-idx="${t}" aria-label="${e} 삭제">×</button>
    </span>
  `).join(``):`<div class="unit-preset-empty">등록된 프리셋 없음</div>`}function X(){let e=document.getElementById(`unitPresetChipList`);e&&(e.innerHTML=Y())}function Z(){let e=document.getElementById(`unitPresetInput`);if(!e)return;let t=e.value.trim();if(!t)return;let n=Number(t);if(Number.isNaN(n)){alert(`숫자만 입력 가능합니다`);return}if(n<=0){alert(`0보다 큰 숫자를 입력해주세요`);return}if(C.includes(n)){alert(`이미 추가된 생산단위입니다`);return}C.push(n),e.value=``,X()}function se(){let e=document.getElementById(`btnAddUnitPreset`),t=document.getElementById(`unitPresetInput`),n=document.getElementById(`unitPresetChipList`);e?.addEventListener(`click`,Z),t?.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),Z())}),n?.addEventListener(`click`,e=>{let t=e.target.closest(`.unit-preset-remove`);t&&(C.splice(Number(t.dataset.idx),1),X())})}function ce(e){return e.length===0?Q({},0):e.map((e,t)=>Q(e,t)).join(``)}function le(e){let t=Number(e.baseWeightG||0);return t?e.weightDisplayUnit===`kg`?t/1e3:t:``}function Q(e,t){let n=e.linkedToInventory===!0||e.autoDeductInventory===!0||e.linkedToInventory===void 0&&e.autoDeductInventory===void 0,r=e.weightDisplayUnit===`kg`?`kg`:`g`,i=le(e),a=x.filter(t=>t.active!==!1||e.meatTypeId===t.id).map(t=>`<option value="${t.id}" ${e.meatTypeId===t.id?`selected`:``}>${t.name}</option>`).join(``);return`
    <tr data-idx="${t}">
      <td><input type="text" class="ing-name cell-input" value="${e.name||``}" placeholder="원료명" /></td>
      <td>
        <div class="ingredient-weight-control">
          <input type="number" class="ing-weight cell-input" value="${i}" placeholder="${r}" step="0.001" />
          <select class="ing-weight-unit">
            <option value="g" ${r===`g`?`selected`:``}>g</option>
            <option value="kg" ${r===`kg`?`selected`:``}>kg</option>
          </select>
        </div>
      </td>
      <td style="text-align:center">
        <input type="radio" name="productionUnit" class="ing-unit-radio" value="${t}" ${e.isProductionUnit?`checked`:``} />
      </td>
      <td><input type="text" class="ing-unit-name cell-input" value="${e.unitName||``}" placeholder="예: 마리" /></td>
      <td style="text-align:center">
        <input type="checkbox" class="ing-linked" ${n?`checked`:``} />
      </td>
      <td>
        <select class="ing-meat-type" ${n?``:`style="display:none"`}>
          <option value="">선택</option>
          ${a}
        </select>
      </td>
      <td><button class="btn-del-row">✕</button></td>
    </tr>
  `}function $(){document.querySelectorAll(`.btn-del-row`).forEach(e=>{e.onclick=()=>{e.closest(`tr`).remove()}}),document.querySelectorAll(`.ing-linked`).forEach(e=>{e.onchange=e=>{let t=e.target.closest(`tr`).querySelector(`.ing-meat-type`);e.target.checked?t.style.display=``:(t.style.display=`none`,t.value=``)}}),document.querySelectorAll(`.ing-weight-unit`).forEach(e=>{e.onchange=e=>{let t=e.target.closest(`tr`).querySelector(`.ing-weight`),n=e.target.dataset.previousUnit||`g`,r=e.target.value,i=parseFloat(t.value);if(Number.isFinite(i)){let e=i*(n===`kg`?1e3:1);t.value=Number(r===`kg`?(e/1e3).toFixed(3):e.toFixed(1))}e.target.dataset.previousUnit=r,t.placeholder=r},e.dataset.previousUnit=e.value})}function ue(e){let t=e.clipboardData.getData(`text`);if(!t.includes(`	`)&&!t.includes(`
`))return;e.preventDefault();let n=t.trim().split(`
`),r=document.getElementById(`ingredientBody`),i=e.target.closest(`tr`),a=i?[...r.querySelectorAll(`tr`)].indexOf(i):0;n.forEach((e,t)=>{let n=e.split(`	`),i=n[0]?.trim()||``,o=n[1]?.trim()||``,s=x.find(e=>e.active!==!1&&e.name===i),c=!!s,l=s?.id||null,u=r.querySelectorAll(`tr`),d=a+t;if(u[d]){let e=u[d];e.querySelector(`.ing-name`).value=i,e.querySelector(`.ing-weight`).value=o;let t=e.querySelector(`.ing-weight-unit`);t&&(t.value=`g`,t.dataset.previousUnit=`g`);let n=e.querySelector(`.ing-linked`),r=e.querySelector(`.ing-meat-type`);n.checked=c,c?(r.style.display=``,r.value=l):(r.style.display=`none`,r.value=``)}else{let e=r.querySelectorAll(`tr`).length;r.insertAdjacentHTML(`beforeend`,Q({name:i,baseWeightG:o,weightDisplayUnit:`g`,linkedToInventory:c,meatTypeId:l},e)),$()}})}function de(){let e=document.querySelectorAll(`#ingredientBody tr`);return Array.from(e).map((e,t)=>{let n=e.querySelector(`.ing-linked`).checked,r=n&&e.querySelector(`.ing-meat-type`).value||null,i=e.querySelector(`.ing-weight-unit`)?.value===`kg`?`kg`:`g`,a=(parseFloat(e.querySelector(`.ing-weight`).value)||0)*(i===`kg`?1e3:1);return{id:Date.now().toString()+t,name:e.querySelector(`.ing-name`).value.trim(),baseWeightG:a,weightDisplayUnit:i,isProductionUnit:e.querySelector(`.ing-unit-radio`).checked,unitName:e.querySelector(`.ing-unit-name`).value.trim(),autoDeductInventory:n,linkedToInventory:n,meatTypeId:r,sortOrder:t}}).filter(e=>e.name)}async function fe(e){if(d!==`admin`&&d!==`office`){alert(`레시피 저장은 대표/사무실 계정만 가능합니다.`);return}let t=document.getElementById(`recipeName`).value.trim(),n=document.getElementById(`recipeCategory`).value,s=document.getElementById(`recipeTarget`).value,c=e?y.find(t=>t.id===e):null,f=Array.isArray(c?.unitPresets)?c.unitPresets:[],h=M(c?.productionMethods);if(!t||!n||!s){alert(`레시피명, 카테고리, 대상은 필수입니다.`);return}let g=document.getElementById(`recipeUsesSupplement`)?.checked??!0,_={name:t,displayName:(s===`cat`?`고양이 `:s===`dog`?`강아지 `:``)+t,category:n,target:s,color:document.getElementById(`recipeColor`).value,note:document.getElementById(`recipeNote`).value.trim(),active:e?c?.active!==!1:!0,sortOrder:e?c?.sortOrder??y.length:y.length,ingredients:de(),unitPresets:[...C],usesSupplement:g,version:1,updatedAt:new Date},x=g?_.unitPresets:[];if(n===`raw`){_.packWeightG=parseFloat(document.getElementById(`packWeightG`).value)||null,_.packsPerPlate=parseInt(document.getElementById(`recipePacksPerPlate`)?.value,10)||null;let e=document.getElementById(`recipeBagType`)?.value||``;if(!e){alert(`생식 레시피는 사용 봉투를 선택해야 합니다.`);return}_.bagTypeId=e;let t=L();if(t===null)return;_.productionMethods=t}else _.productionMethods=[];if(n===`freezeDry`){let e=document.getElementById(`requiresSeparation`).value===`true`;_.freezeDryBagCountPerUnit=parseFloat(document.getElementById(`freezeDryBagCount`).value)||null,_.breadPanCountPerUnit=e?parseFloat(document.getElementById(`breadPanCount`).value)||null:0,_.freezePanCountPerUnit=parseFloat(document.getElementById(`freezePanCount`).value)||null,_.requiresSeparation=e}let S=n===`raw`?R(h,_.productionMethods):[];try{if(e){let t=f.filter(e=>!x.includes(e)),n=await U({id:e,...c},t);if(n===!1){C=[...f],X();return}let i=await Promise.all(x.map(async t=>{let n=v(e,t),[i,o]=await Promise.all([a(r(l,`supplementTypes`,n)),a(r(l,`supplementStock`,n))]);return{unit:t,supplementTypeId:n,hasType:i.exists(),hasStock:o.exists()}})),s=new Map(i.map(e=>[e.unit,e])),d=o(l);d.update(r(l,`recipes`,e),_),z(d,e,S);let p=new Map((Array.isArray(n)?n:[]).map(e=>[e.unit,e]));x.forEach((t,n)=>{let i=v(e,t),a=B(e,_,t,n),o=s.get(t);f.includes(t)&&o?.hasType?d.update(r(l,`supplementTypes`,i),a):d.set(r(l,`supplementTypes`,i),{id:i,...a,createdAt:new Date,createdBy:u?.uid||null}),(!f.includes(t)||!o?.hasStock)&&d.set(r(l,`supplementStock`,i),{id:i,supplementTypeId:i,currentQty:0,updatedAt:new Date})}),t.forEach(t=>{let n=p.get(t),i=v(e,t);d.delete(r(l,`supplementTypes`,i)),d.delete(r(l,`supplementStock`,i)),(n?.logDocs||[]).forEach(e=>{d.delete(r(l,`supplementLogs`,e.id))})}),await d.commit(),b=e}else{_.createdAt=new Date,_.createdBy=u?.uid||null,_.updatedBy=u?.uid||null;let e=r(i(l,`recipes`)),t=o(l);t.set(e,_),z(t,e.id,S),x.forEach((n,i)=>{let a=v(e.id,n),o=B(e.id,_,n,i);t.set(r(l,`supplementTypes`,a),{id:a,...o,createdAt:new Date,createdBy:u?.uid||null}),t.set(r(l,`supplementStock`,a),{id:a,supplementTypeId:a,currentQty:0,updatedAt:new Date})}),await t.commit(),b=e.id}}catch(e){console.error(`[recipe] save failed:`,e),alert(`레시피 저장 중 오류가 발생했습니다.`);return}if(S.length>0)try{await m({action:`conversion`,subAction:`manualEdit`,date:p(),staff:A(),message:`환산값 변경 - ${_.displayName}`,details:{recipeId:b,recipeName:_.displayName,changes:S}})}catch(e){console.error(`[recipe] conversion activity log failed:`,e)}if(y=await E(),D(),b){let e=y.find(e=>e.id===b);e&&(J(e),document.querySelector(`[data-id="${b}"]`)?.classList.add(`active`))}alert(`저장되었습니다.`)}export{ne as renderRecipe};