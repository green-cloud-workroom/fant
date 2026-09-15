import{T as e,_ as t,a as n,b as r,d as i,g as a,s as o,u as s,y as c}from"./index.esm-rHmxwfvm.js";import{n as l}from"./firebase-qGjqjNvO.js";import{n as u,r as d,t as f}from"./formDraft-DoA-Ia7D.js";import{C as p,G as m,L as h,S as g,W as _,f as v,m as y}from"./index-C3J_bQqC.js";import{n as b}from"./activityLogs-CRxSouBf.js";import{t as x}from"./sortable-DIR4yJqN.js";import{t as ee}from"./readCommand-BBDmLRkl.js";import{n as S,r as te,t as C}from"./supplement-DLu3QLV3.js";var w=y(`recipe`),T,ne=()=>clearTimeout(T);async function E(e){let t=g(),n=!1;try{return await ee(w,async r=>{r.isCurrent=()=>!t||t.isCurrent();try{return await e(r)}finally{n=r.committed}})}catch(e){throw console.error(`[레시피 저장 검증]`,e),alert(n?`저장은 완료됐지만 후속 화면 갱신을 확인하지 못했습니다. 최신 자료를 다시 확인해주세요.`:e.message),e.recipeReported=!0,e}finally{if(n&&(w.disconnect(),!t||t.isCurrent())){let e=document.querySelector(`.recipe-detail-panel`);(!e||!u(e))&&await N({force:!0})}}}var D=[],O=null,k=[],re=[],A=[],j=[],M=[{methodKey:`rotary`,label:`로터리`},{methodKey:`manual`,label:`수동`}];async function ie(e={getDocs:o}){let t=i(c(l,`meatTypes`),s(`sortOrder`));return(await e.getDocs(t)).docs.map(e=>({id:e.id,...e.data()}))}async function ae(e={getDocs:o}){let t=i(c(l,`bagTypes`),s(`sortOrder`));return(await e.getDocs(t)).docs.map(e=>({id:e.id,...e.data()}))}async function N({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>레시피 로딩 중...</p></div>`,p(ne);let n=({error:e}={})=>{if(clearTimeout(T),!t.isConnected)return;if(e?.code===`permission-denied`){t.replaceChildren();return}let r=t.querySelector(`.recipe-detail-panel`);if(e||w.busy||document.querySelector(`.modal-overlay`)||r?.contains(document.activeElement)||r&&u(r)){if(!t.querySelector(`[data-recipe-refresh]`)){let n=document.createElement(`p`);n.dataset.recipeRefresh=`true`,n.textContent=e?`최신 자료를 확인하지 못했습니다. 입력은 유지됩니다.`:`다른 작업에서 자료가 변경되었습니다. 작성 중인 입력은 유지됩니다.`;let r=document.createElement(`button`);r.className=`btn-secondary`,r.textContent=`최신 자료 다시 불러오기`,r.addEventListener(`click`,async()=>{await f()&&await N({force:!0})}),n.append(r),t.prepend(n)}return}T=setTimeout(()=>N().catch(e=>n({error:e})),120)},r=await w.load(P,{onChange:n,force:e});if(!(!r||!t.isConnected)&&([D,k,re]=r,I(),O)){let e=D.find(e=>e.id===O);e&&Y(e)}}function P(e){return Promise.all([F(e),ie(e),ae(e)])}function oe({cacheOnly:e=!0}={}){return w.prepare?.(`default`,P,{cacheOnly:e})}async function F(e={getDocs:o}){let t=i(c(l,`recipes`),s(`sortOrder`));return(await e.getDocs(t)).docs.map(e=>({id:e.id,...e.data()}))}function I(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 레시피 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">레시피 목록</span>
          ${m===`admin`||m===`office`?`<button class="btn-primary" id="btnNewRecipe">+ 신규 추가</button>`:``}
        </div>
        <div class="recipe-list" id="recipeList">
          ${R()}
        </div>
      </div>

      <!-- 오른쪽: 레시피 상세 -->
      <div class="recipe-detail-panel" id="recipeDetail">
        <div class="detail-empty">레시피를 선택하거나 새로 추가해주세요</div>
      </div>
    </div>
  `,q(),J(),document.getElementById(`btnNewRecipe`)?.addEventListener(`click`,_e)}function L(e){let t=m===`admin`||m===`office`;return`
    <div class="recipe-list-item ${O===e.id?`active`:``}" data-id="${e.id}" style="border-left-color: ${e.color||`#4A7C59`}">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
      <div class="recipe-list-info">
        <span class="recipe-name">${z(e)}</span>
        <div class="recipe-tags">
          <span class="tag tag-${e.category}">${e.category===`raw`?`생식`:`동결`}</span>
          <span class="tag tag-${e.target}">${se(e.target)}</span>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" class="recipe-active-toggle" data-id="${e.id}" ${e.active?`checked`:``} ${t?``:`disabled`}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `}function R(){if(D.length===0)return`<div class="list-empty">등록된 레시피 없음</div>`;let e=D.filter(e=>e.active!==!1),t=D.filter(e=>e.active===!1),n=e.filter(e=>e.category===`raw`),r=e.filter(e=>e.category===`freezeDry`),i=``;return n.length>0&&(i+=`<div class="list-group-label">생식</div>`,i+=`<div class="sortable-master-list" id="recipeListRaw" data-category="raw">${n.map(e=>L(e)).join(``)}</div>`),r.length>0&&(i+=`<div class="list-group-label">동결건조</div>`,i+=`<div class="sortable-master-list" id="recipeListFreezeDry" data-category="freezeDry">${r.map(e=>L(e)).join(``)}</div>`),t.length>0&&(i+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,i+=`<div class="master-inactive-list">${t.map(e=>L(e)).join(``)}</div>`),i}function z(e){return(e.target===`cat`?`고양이 `:e.target===`dog`?`강아지 `:``)+e.name}function se(e){return e===`cat`?`고양이`:e===`dog`?`강아지`:`공용`}function B(){return m===`admin`?`대표`:m===`office`?`사무실`:m===`production`?`생산실`:`시스템`}function V(e){return M.find(t=>t.methodKey===e)?.label||e}function H(e){if(!Array.isArray(e))return[];let t=new Set;return e.map(e=>{let n=e?.methodKey;if(!M.some(e=>e.methodKey===n)||t.has(n))return null;t.add(n);let r=Number(e.unitToBox);return{methodKey:n,label:V(n),unitToBox:Number.isFinite(r)?r:0,effectiveDate:e.effectiveDate||h(),active:e.active!==!1}}).filter(Boolean)}function ce(e){return`
    <div class="form-row production-methods-row" id="productionMethodsSection" ${e===`raw`?``:`style="display:none"`}>
      <div class="form-group production-methods-group">
        <label>생산 방식별 환산값 (생식 한정)</label>
        <div class="production-methods-table" id="productionMethodsTable">
          ${U()}
        </div>
        <div class="production-methods-actions">
          <select id="productionMethodAddSelect" class="production-method-add-select"></select>
          <button type="button" class="btn-secondary" id="btnAddProductionMethod">+ 방식 추가</button>
          <span class="production-methods-hint" id="productionMethodsHint"></span>
        </div>
      </div>
    </div>
  `}function U(){return j.length===0?`<div class="production-methods-empty">등록된 생산 방식별 환산값이 없습니다.</div>`:`
    <div class="production-methods-header">
      <span>방식</span>
      <span>단위 1 → 박스</span>
      <span>적용 시작일</span>
      <span>활성</span>
    </div>
    ${j.map(e=>`
      <div class="production-method-row" data-method-key="${e.methodKey}">
        <div class="production-method-label">${e.label||V(e.methodKey)}</div>
        <input type="number" class="production-method-unit" value="${e.unitToBox||``}" min="0.01" step="0.01" placeholder="0.83" />
        <input type="date" class="production-method-date" value="${e.effectiveDate||h()}" />
        <label class="production-method-active">
          <input type="checkbox" class="production-method-active-input" ${e.active===!1?``:`checked`} />
        </label>
      </div>
    `).join(``)}
  `}function W(){let e=document.getElementById(`productionMethodsTable`);e&&(e.innerHTML=U());let t=document.getElementById(`productionMethodAddSelect`),n=document.getElementById(`btnAddProductionMethod`),r=document.getElementById(`productionMethodsHint`);if(!t||!n||!r)return;let i=new Set(j.map(e=>e.methodKey)),a=M.filter(e=>!i.has(e.methodKey));t.innerHTML=a.map(e=>`<option value="${e.methodKey}">${e.label}</option>`).join(``),t.disabled=a.length===0,n.disabled=a.length===0,r.textContent=a.length===0?`더 추가할 방식이 없습니다`:``}function le(){W(),document.getElementById(`btnAddProductionMethod`)?.addEventListener(`click`,()=>{let e=document.getElementById(`productionMethodAddSelect`)?.value;!e||j.some(t=>t.methodKey===e)||(j.push({methodKey:e,label:V(e),unitToBox:0,effectiveDate:h(),active:!0}),W())})}function ue(){let e=Array.from(document.querySelectorAll(`.production-method-row`)),t=new Set,n=[];for(let r of e){let e=r.dataset.methodKey;if(!e||t.has(e))return alert(`같은 생산방식은 중복 등록할 수 없습니다.`),null;t.add(e);let i=Number(r.querySelector(`.production-method-unit`)?.value),a=r.querySelector(`.production-method-date`)?.value||``;if(!Number.isFinite(i)||i<=0)return alert(`환산값은 0보다 큰 숫자로 입력해주세요.`),null;if(!a)return alert(`환산값 적용 시작일을 입력해주세요.`),null;n.push({methodKey:e,label:V(e),unitToBox:i,effectiveDate:a,active:r.querySelector(`.production-method-active-input`)?.checked!==!1})}return n}function de(e,t){let n=new Map(H(e).map(e=>[e.methodKey,e]));return t.map(e=>{let t=n.get(e.methodKey);return t?Number(t.unitToBox)===Number(e.unitToBox)?null:{methodKey:e.methodKey,from:Number(t.unitToBox),to:e.unitToBox,effectiveDate:e.effectiveDate}:{methodKey:e.methodKey,from:null,to:e.unitToBox,effectiveDate:e.effectiveDate}}).filter(Boolean)}function G(t,n,i){i.forEach(i=>{let a=r(c(l,`recipes`,n,`conversionHistory`));t.set(a,{methodKey:i.methodKey,unitToBox:i.to,prevUnitToBox:i.from,effectiveDate:i.effectiveDate,reason:`manual`,basedOnAvgOfRecent5:!1,createdAt:e(),createdBy:_?.uid||null})})}function K(e,t,n,r){let i=t.displayName||z(t);return{recipeId:e,recipeName:i,unit:n,name:S(i,n),active:t.active!==!1,sortOrder:te(t.sortOrder,r),updatedAt:new Date,updatedBy:_?.uid||null}}async function fe(e,t={getDocs:o,getDoc:n}){let{getDocs:s,getDoc:u}=t,[d,f,p]=await Promise.all([s(i(c(l,`productions`),a(`recipeId`,`==`,e.id))),s(i(c(l,`schedules`),a(`recipeId`,`==`,e.id))),s(i(c(l,`supplementTypes`),a(`recipeId`,`==`,e.id)))]),m=[];for(let e of p.docs){let t={id:e.id,...e.data()},[n,o]=await Promise.all([u(r(l,`supplementStock`,t.id)),s(i(c(l,`supplementLogs`),a(`supplementTypeId`,`==`,t.id)))]),d=Number(n.data()?.currentQty||0);m.push({sku:t,stockQty:d,stockExists:n.exists(),logDocs:o.docs})}return{productionCount:d.size,scheduleCount:f.size,supplementSummaries:m}}async function pe(e,t,s={getDocs:o,getDoc:n}){let{getDocs:u,getDoc:d}=s,f=[];for(let n of t){let t=C(e.id,n),o=await d(r(l,`supplementStock`,t)),s=await u(i(c(l,`supplementLogs`),a(`supplementTypeId`,`==`,t))),p=Number(o.data()?.currentQty||0);f.push({unit:n,supplementTypeId:t,name:S(z(e),n),stockQty:p,logCount:s.size,logDocs:s.docs})}return f}async function me(e,t,r={getDocs:o,getDoc:n}){if(t.length===0)return!0;let i=await pe(e,t,r);return i.some(e=>e.stockQty>0)&&typeof window.openBlockingModal==`function`?await window.openBlockingModal({variant:`warning`,data:{date:h(),warnings:i.map(e=>({reason:e.stockQty>0?`영양제 ${e.name} ${e.stockQty}봉이 있는데 정말 삭제하시겠습니까?`:`영양제 ${e.name}을 삭제합니다.`,details:[`생산단위: ${e.unit}`,`현재 재고: ${e.stockQty}봉`,`차감 이력: ${e.logCount}건`,`영양제 SKU, 재고, 이력이 함께 삭제됩니다.`]}))}})?i:!1:await v({title:`생산단위 삭제`,message:`${i.some(e=>e.logCount>0)?i.map(e=>e.logCount>0?`생산단위 ${e.unit}의 차감 이력이 ${e.logCount}건 있습니다. 삭제 시 이력도 함께 삭제됩니다.`:`생산단위 ${e.unit}을 프리셋에서 삭제합니다. 영양제 SKU도 함께 삭제됩니다.`).join(`
`):i.map(e=>`생산단위 ${e.unit}을 프리셋에서 삭제합니다. 영양제 SKU도 함께 삭제됩니다.`).join(`
`)}\n진행하시겠습니까?`,confirmText:`삭제`,danger:!0})?i:!1}function q(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.toggle-switch`)||t.target.closest(`.drag-handle`))return;let n=e.dataset.id;O=n,Y(D.find(e=>e.id===n)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`)})}),document.querySelectorAll(`.recipe-active-toggle`).forEach(e=>{e.addEventListener(`change`,async e=>{if(m!==`admin`&&m!==`office`)return;let n=e.target.dataset.id,o=e.target.checked,s=D.find(e=>e.id===n),u=s?.active!==!1;try{await E(async e=>{let d=t(l);d.update(r(l,`recipes`,n),{active:o,updatedAt:new Date}),(await e.getDocs(i(c(l,`supplementTypes`),a(`recipeId`,`==`,n)))).docs.forEach(e=>{d.update(r(l,`supplementTypes`,e.id),{active:o,updatedAt:new Date,updatedBy:_?.uid||null})}),await e.commit(d,{targets:[r(l,`recipes`,n)]}),s&&(s.active=o),u!==o&&await b({action:`recipe`,subAction:`activeToggle`,date:h(),staff:B(),message:`Recipe ${o?`active`:`inactive`} — ${s?z(s):n}`,details:{recipeId:n,recipeName:s?z(s):null,active:o}})})}catch(t){console.error(`[recipe] active save failed:`,t),t.recipeReported||alert(t.message||`활성 상태 저장 중 오류가 발생했습니다.`),e.target.checked=u}})})}function J(){m!==`admin`&&m!==`office`||[[`recipeListRaw`,`raw`],[`recipeListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&x.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await he(t)}})})}async function he(e){return E(t=>ge(e,t)).catch(()=>{let e=document.getElementById(`recipeList`);e&&(e.innerHTML=R(),q(),J())})}async function ge(e,n){let o=Array.from(document.getElementById(`recipeListRaw`)?.querySelectorAll(`.recipe-list-item`)||[]),s=Array.from(document.getElementById(`recipeListFreezeDry`)?.querySelectorAll(`.recipe-list-item`)||[]),u=[...o.map((e,t)=>({id:e.dataset.id,sortOrder:t})),...s.map((e,t)=>({id:e.dataset.id,sortOrder:o.length+t}))].filter(e=>e.id);if(u.length===0)return;if(u.length>450){alert(`순번 저장 항목이 너무 많습니다. 관리자에게 문의해주세요.`);return}let d=new Date,f=t(l),p=new Map(u.map(e=>[e.id,e.sortOrder])),m=D.filter(e=>p.has(e.id)),h=await Promise.all(m.map(async e=>({recipe:e,snap:await n.getDocs(i(c(l,`supplementTypes`),a(`recipeId`,`==`,e.id)))}))),g=0;if(u.forEach(({id:e,sortOrder:t})=>{f.update(r(l,`recipes`,e),{sortOrder:t,updatedAt:d}),g+=1}),h.forEach(({recipe:e,snap:t})=>{let n=p.get(e.id),i=Array.isArray(e.unitPresets)?e.unitPresets:[];t.docs.forEach(e=>{let t=i.indexOf(e.data().unit);t<0||(f.update(r(l,`supplementTypes`,e.id),{sortOrder:te(n,t),updatedAt:d,updatedBy:_?.uid||null}),g+=1)})}),g>500){alert(`순번 저장 항목이 너무 많습니다. 관리자에게 문의해주세요.`);return}try{if(await n.commit(f,{targets:u.map(e=>r(l,`recipes`,e.id))}),!n.isCurrent())return;D=D.map(e=>p.has(e.id)?{...e,sortOrder:p.get(e.id),updatedAt:d}:e).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){throw console.error(`[recipe] reorder save failed:`,e),e}}function _e(){O=null,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),Y(null)}function Y(e){let t=document.getElementById(`recipeDetail`),n=!e,r=m===`admin`||m===`office`;A=Array.isArray(e?.unitPresets)?[...e.unitPresets]:[],j=H(e?.productionMethods),t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${n?`새 레시피`:z(e)}</span>
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
              ${re.filter(t=>t.active!==!1||e?.bagTypeId===t.id).map(t=>`<option value="${t.id}" ${e?.bagTypeId===t.id?`selected`:``}>${t.name}${t.active===!1?` (비활성)`:``}</option>`).join(``)}
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
              ${X()}
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
        ${ce(e?.category)}
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
              ${Ce(e?.ingredients||[])}
            </tbody>
          </table>
        </div>
        <p class="hint-text">💡 엑셀에서 원료명, 기준중량 복사 후 첫 셀에 붙여넣기 가능</p>
      </div>
    </div>
  `;let i=()=>{let e=document.getElementById(`recipeCategory`).value,t=document.getElementById(`requiresSeparation`)?.value===`true`;document.getElementById(`rawFields`).style.display=e===`raw`?``:`none`,document.getElementById(`freezeDryFields`).style.display=e===`freezeDry`?``:`none`;let n=document.getElementById(`productionMethodsSection`);n&&(n.style.display=e===`raw`?``:`none`);let r=document.getElementById(`breadPanCountGroup`);r&&(r.style.display=e===`freezeDry`&&t?``:`none`)};document.getElementById(`recipeCategory`).addEventListener(`change`,i),document.getElementById(`requiresSeparation`)?.addEventListener(`change`,i),i(),Se(),le(),document.getElementById(`btnAddIngredient`).addEventListener(`click`,()=>{let e=document.getElementById(`ingredientBody`),t=e.querySelectorAll(`tr`).length;e.insertAdjacentHTML(`beforeend`,Q({},t)),$()}),document.getElementById(`ingredientBody`).addEventListener(`paste`,Te),$(),document.getElementById(`btnSaveRecipe`)?.addEventListener(`click`,()=>De(e?.id)),document.getElementById(`btnDeleteRecipe`)?.addEventListener(`click`,()=>ye(e)),d(t,{extra:()=>A})}function ve(e,t){let n=t.length;t.reduce((e,t)=>e+t.stockQty,0);let r=t.reduce((e,t)=>e+t.logDocs.length,0),i=t.filter(e=>e.stockQty>0).map(e=>`${e.sku.name||e.sku.id} ${e.stockQty}봉`);return i.length>0?`영양제 재고가 남아있습니다.\n${i.join(`
`)}\n\n레시피와 영양제 SKU ${n}개, 영양제 이력 ${r}건이 모두 삭제됩니다.\n진행하시겠습니까?`:r>0?`영양제 이력 ${r}건이 함께 삭제됩니다.\n레시피와 영양제 SKU ${n}개를 삭제하시겠습니까?`:n>0?`레시피와 영양제 SKU ${n}개를 삭제하시겠습니까?`:`${z(e)} 레시피를 삭제하시겠습니까?`}async function ye(e){return E(t=>be(e,t)).catch(()=>{})}async function be(e,n){if(e?.id){if(m!==`admin`&&m!==`office`){alert(`레시피 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let i=await fe(e,n);if(i.productionCount>0){alert(`이 레시피로 만든 생산 기록이 ${i.productionCount}건 있어 삭제할 수 없습니다.\n비활성화로 처리해주세요.`);return}if(i.scheduleCount>0){alert(`입고 예정 ${i.scheduleCount}건이 있어 삭제할 수 없습니다.`);return}if(!await v({title:`레시피 삭제`,message:ve(e,i.supplementSummaries),confirmText:`삭제`,danger:!0}))return;let a=t(l);a.delete(r(l,`recipes`,e.id)),i.supplementSummaries.forEach(e=>{a.delete(r(l,`supplementTypes`,e.sku.id)),e.stockExists&&a.delete(r(l,`supplementStock`,e.sku.id)),e.logDocs.forEach(e=>{a.delete(r(l,`supplementLogs`,e.id))})}),await n.commit(a,{targets:[r(l,`recipes`,e.id)]});let o=i.supplementSummaries.length,s=i.supplementSummaries.reduce((e,t)=>e+t.stockQty,0),c=i.supplementSummaries.reduce((e,t)=>e+t.logDocs.length,0);if(await b({action:`recipe`,subAction:`delete`,date:h(),staff:B(),message:`레시피 삭제 — ${z(e)}`,details:{recipeId:e.id,recipeName:z(e),category:e.category===`freezeDry`?`dried`:`raw`,supplementSkuCount:o,supplementTotalQty:s,supplementLogCount:c}}),!n.isCurrent())return;O=null;let u=await F();if(!n.isCurrent())return;D=u,I(),alert(`레시피가 삭제되었습니다.`)}catch(e){console.error(`[recipe] delete failed:`,e),alert(e.message||`레시피 삭제 중 오류가 발생했습니다.`)}}}function X(){return A.length?A.map((e,t)=>`
    <span class="unit-preset-chip">
      <span>${e}</span>
      <button type="button" class="unit-preset-remove" data-idx="${t}" aria-label="${e} 삭제">×</button>
    </span>
  `).join(``):`<div class="unit-preset-empty">등록된 프리셋 없음</div>`}function Z(){let e=document.getElementById(`unitPresetChipList`);e&&(e.innerHTML=X())}function xe(){let e=document.getElementById(`unitPresetInput`);if(!e)return;let t=e.value.trim();if(!t)return;let n=Number(t);if(Number.isNaN(n)){alert(`숫자만 입력 가능합니다`);return}if(n<=0){alert(`0보다 큰 숫자를 입력해주세요`);return}if(A.includes(n)){alert(`이미 추가된 생산단위입니다`);return}A.push(n),e.value=``,Z()}function Se(){let e=document.getElementById(`btnAddUnitPreset`),t=document.getElementById(`unitPresetInput`),n=document.getElementById(`unitPresetChipList`);e?.addEventListener(`click`,xe),t?.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),xe())}),n?.addEventListener(`click`,e=>{let t=e.target.closest(`.unit-preset-remove`);t&&(A.splice(Number(t.dataset.idx),1),Z())})}function Ce(e){return e.length===0?Q({},0):e.map((e,t)=>Q(e,t)).join(``)}function we(e){let t=Number(e.baseWeightG||0);return t?e.weightDisplayUnit===`kg`?t/1e3:t:``}function Q(e,t){let n=e.linkedToInventory===!0||e.autoDeductInventory===!0||e.linkedToInventory===void 0&&e.autoDeductInventory===void 0,r=e.weightDisplayUnit===`kg`?`kg`:`g`,i=we(e),a=k.filter(t=>t.active!==!1||e.meatTypeId===t.id).map(t=>`<option value="${t.id}" ${e.meatTypeId===t.id?`selected`:``}>${t.name}</option>`).join(``);return`
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
  `}function $(){document.querySelectorAll(`.btn-del-row`).forEach(e=>{e.onclick=()=>{e.closest(`tr`).remove()}}),document.querySelectorAll(`.ing-linked`).forEach(e=>{e.onchange=e=>{let t=e.target.closest(`tr`).querySelector(`.ing-meat-type`);e.target.checked?t.style.display=``:(t.style.display=`none`,t.value=``)}}),document.querySelectorAll(`.ing-weight-unit`).forEach(e=>{e.onchange=e=>{let t=e.target.closest(`tr`).querySelector(`.ing-weight`),n=e.target.dataset.previousUnit||`g`,r=e.target.value,i=parseFloat(t.value);if(Number.isFinite(i)){let e=i*(n===`kg`?1e3:1);t.value=Number(r===`kg`?(e/1e3).toFixed(3):e.toFixed(1))}e.target.dataset.previousUnit=r,t.placeholder=r},e.dataset.previousUnit=e.value})}function Te(e){let t=e.clipboardData.getData(`text`);if(!t.includes(`	`)&&!t.includes(`
`))return;e.preventDefault();let n=t.trim().split(`
`),r=document.getElementById(`ingredientBody`),i=e.target.closest(`tr`),a=i?[...r.querySelectorAll(`tr`)].indexOf(i):0;n.forEach((e,t)=>{let n=e.split(`	`),i=n[0]?.trim()||``,o=n[1]?.trim()||``,s=k.find(e=>e.active!==!1&&e.name===i),c=!!s,l=s?.id||null,u=r.querySelectorAll(`tr`),d=a+t;if(u[d]){let e=u[d];e.querySelector(`.ing-name`).value=i,e.querySelector(`.ing-weight`).value=o;let t=e.querySelector(`.ing-weight-unit`);t&&(t.value=`g`,t.dataset.previousUnit=`g`);let n=e.querySelector(`.ing-linked`),r=e.querySelector(`.ing-meat-type`);n.checked=c,c?(r.style.display=``,r.value=l):(r.style.display=`none`,r.value=``)}else{let e=r.querySelectorAll(`tr`).length;r.insertAdjacentHTML(`beforeend`,Q({name:i,baseWeightG:o,weightDisplayUnit:`g`,linkedToInventory:c,meatTypeId:l},e)),$()}})}function Ee(){let e=document.querySelectorAll(`#ingredientBody tr`);return Array.from(e).map((e,t)=>{let n=e.querySelector(`.ing-linked`).checked,r=n&&e.querySelector(`.ing-meat-type`).value||null,i=e.querySelector(`.ing-weight-unit`)?.value===`kg`?`kg`:`g`,a=(parseFloat(e.querySelector(`.ing-weight`).value)||0)*(i===`kg`?1e3:1);return{id:Date.now().toString()+t,name:e.querySelector(`.ing-name`).value.trim(),baseWeightG:a,weightDisplayUnit:i,isProductionUnit:e.querySelector(`.ing-unit-radio`).checked,unitName:e.querySelector(`.ing-unit-name`).value.trim(),autoDeductInventory:n,linkedToInventory:n,meatTypeId:r,sortOrder:t}}).filter(e=>e.name)}async function De(e){return E(t=>Oe(e,t)).catch(()=>{})}async function Oe(e,n){let{getDoc:i}=n;if(m!==`admin`&&m!==`office`){alert(`레시피 저장은 대표/사무실 계정만 가능합니다.`);return}let a=document.getElementById(`recipeName`).value.trim(),o=document.getElementById(`recipeCategory`).value,s=document.getElementById(`recipeTarget`).value,u=e?D.find(t=>t.id===e):null,d=Array.isArray(u?.unitPresets)?u.unitPresets:[],f=H(u?.productionMethods);if(!a||!o||!s){alert(`레시피명, 카테고리, 대상은 필수입니다.`);return}let p=document.getElementById(`recipeUsesSupplement`)?.checked??!0,g={name:a,displayName:(s===`cat`?`고양이 `:s===`dog`?`강아지 `:``)+a,category:o,target:s,color:document.getElementById(`recipeColor`).value,note:document.getElementById(`recipeNote`).value.trim(),active:e?u?.active!==!1:!0,sortOrder:e?u?.sortOrder??D.length:D.length,ingredients:Ee(),unitPresets:[...A],usesSupplement:p,version:1,updatedAt:new Date},v=p?g.unitPresets:[];if(o===`raw`){g.packWeightG=parseFloat(document.getElementById(`packWeightG`).value)||null,g.packsPerPlate=parseInt(document.getElementById(`recipePacksPerPlate`)?.value,10)||null;let e=document.getElementById(`recipeBagType`)?.value||``;if(!e){alert(`생식 레시피는 사용 봉투를 선택해야 합니다.`);return}g.bagTypeId=e;let t=ue();if(t===null)return;g.productionMethods=t}else g.productionMethods=[];if(o===`freezeDry`){let e=document.getElementById(`requiresSeparation`).value===`true`;g.freezeDryBagCountPerUnit=parseFloat(document.getElementById(`freezeDryBagCount`).value)||null,g.breadPanCountPerUnit=e?parseFloat(document.getElementById(`breadPanCount`).value)||null:0,g.freezePanCountPerUnit=parseFloat(document.getElementById(`freezePanCount`).value)||null,g.requiresSeparation=e}let y=o===`raw`?de(f,g.productionMethods):[];try{if(e){let a=d.filter(e=>!v.includes(e)),o=await me({id:e,...u},a,n);if(o===!1){A=[...d],Z();return}let s=await Promise.all(v.map(async t=>{let n=C(e,t),[a,o]=await Promise.all([i(r(l,`supplementTypes`,n)),i(r(l,`supplementStock`,n))]);return{unit:t,supplementTypeId:n,hasType:a.exists(),hasStock:o.exists()}})),c=new Map(s.map(e=>[e.unit,e])),f=t(l);f.update(r(l,`recipes`,e),g),G(f,e,y);let p=new Map((Array.isArray(o)?o:[]).map(e=>[e.unit,e]));if(v.forEach((t,n)=>{let i=C(e,t),a=K(e,g,t,n),o=c.get(t);d.includes(t)&&o?.hasType?f.update(r(l,`supplementTypes`,i),a):f.set(r(l,`supplementTypes`,i),{id:i,...a,createdAt:new Date,createdBy:_?.uid||null}),o?.hasStock||f.set(r(l,`supplementStock`,i),{id:i,supplementTypeId:i,currentQty:0,updatedAt:new Date})}),a.forEach(t=>{let n=p.get(t),i=C(e,t);f.delete(r(l,`supplementTypes`,i)),f.delete(r(l,`supplementStock`,i)),(n?.logDocs||[]).forEach(e=>{f.delete(r(l,`supplementLogs`,e.id))})}),await n.commit(f,{targets:[r(l,`recipes`,e)]}),!n.isCurrent())return;O=e}else{g.createdAt=new Date,g.createdBy=_?.uid||null,g.updatedBy=_?.uid||null;let e=r(c(l,`recipes`)),i=t(l);if(i.set(e,g),G(i,e.id,y),v.forEach((t,n)=>{let a=C(e.id,t),o=K(e.id,g,t,n);i.set(r(l,`supplementTypes`,a),{id:a,...o,createdAt:new Date,createdBy:_?.uid||null}),i.set(r(l,`supplementStock`,a),{id:a,supplementTypeId:a,currentQty:0,updatedAt:new Date})}),await n.commit(i,{targets:[e]}),!n.isCurrent())return;O=e.id}}catch(e){console.error(`[recipe] save failed:`,e),alert(e.message||`레시피 저장 중 오류가 발생했습니다.`);return}if(y.length>0)try{await b({action:`conversion`,subAction:`manualEdit`,date:h(),staff:B(),message:`환산값 변경 - ${g.displayName}`,details:{recipeId:O,recipeName:g.displayName,changes:y}})}catch(e){console.error(`[recipe] conversion activity log failed:`,e)}let x=await F();if(n.isCurrent()){if(D=x,I(),O){let e=D.find(e=>e.id===O);e&&(Y(e),document.querySelector(`[data-id="${O}"]`)?.classList.add(`active`))}alert(`저장되었습니다.`)}}export{oe as preparePage,N as renderRecipe};