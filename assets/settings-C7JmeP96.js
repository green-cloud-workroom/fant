import{a as e,b as t,c as n,g as r,h as i,i as a,m as o,n as s,s as c,u as l}from"./index.esm-Cf9DaHbi.js";import{n as u}from"./firebase-BQPCO7kq.js";import{A as d,D as f,E as p,O as m,h,j as g,m as _,w as v}from"./index-CMgkQ4he.js";import{n as ee}from"./activityLogs-Mn_dgBRB.js";import{t as te}from"./sortable.esm-D0d_dJ5t.js";import{t as y}from"./closingChecksLogic-CchwpBis.js";import{a as b,i as ne,n as x,o as re,r as ie,t as ae}from"./menuStaffGroups-Cqf_Tdsi.js";function S(e){return e?typeof e.toMillis==`function`?e.toMillis():typeof e.seconds==`number`?e.seconds*1e3:0:0}function C(e,t){return(e||[]).filter(e=>e.effectiveDate&&(!t||e.effectiveDate<=t)).sort((e,t)=>{let n=String(t.effectiveDate).localeCompare(String(e.effectiveDate));return n===0?S(t.createdAt)-S(e.createdAt):n})[0]||null}async function w(t){let r=(await e(n(i(u,`meatTypes`),c(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.active!==!1);return Promise.all(r.map(async n=>{let r=(await e(i(u,`meatTypes`,n.id,`priceHistory`))).docs.map(e=>({id:e.id,...e.data()}));return{meatType:n,latest:C(r,t),history:r}}))}async function oe(e,n){return s(i(u,`meatTypes`,e,`priceHistory`),{unitPrice:n.unitPrice,effectiveDate:n.effectiveDate,prevUnitPrice:n.prevUnitPrice??null,reason:n.reason||`manual`,createdAt:t(),createdBy:n.createdBy||``})}var T=[`rawCat`,`rawDog`,`freezeCat`,`freezeDog`,`freezeCommon`],se={rawCat:`생식 - 고양이`,rawDog:`생식 - 강아지`,freezeCat:`동결건조 - 고양이`,freezeDog:`동결건조 - 강아지`,freezeCommon:`동결건조 - 공용`},E=null,D=450,ce=[{key:`blockTomorrowProd`,label:`내일생산불러오기 미완료 시 마감 차단`,desc:`다음 영업일 생산이 있는데 내일생산불러오기를 안 했으면 차단`},{key:`blockFrozenOrder`,label:`동결건조 발주 미확인 시 마감 차단`,desc:`오늘 등록된 발주 행이 확인/취소되지 않으면 차단`},{key:`blockScheduleDue`,label:`입고예정 미처리 시 마감 차단`,desc:`오늘 도착 예정 입고가 완료/취소 처리되지 않으면 차단`},{key:`blockAutoRepack`,label:`자동 재포장 미확인 시 마감 차단`,desc:`자동 재포장 trigger/diff 로그가 확인되지 않으면 차단`},{key:`blockProdLog`,label:`생산 로그 미확인 시 마감 차단`,desc:`생산 카테고리 로그 (생산/재포장/전처리 등) 미확인 시 차단`},{key:`blockOfficeLog`,label:`사무 로그 미확인 시 마감 차단`,desc:`사무 카테고리 로그 (봉투/계란/원육/입고예정 등) 미확인 시 차단`},{key:`blockEggOut`,label:`계란 출고 미입력 시 마감 차단`,desc:`노른자 사용 생산이 있는데 계란 출고가 입력되지 않으면 차단`},{key:`blockProductReceipt`,label:`생식 제품입고 미완료 → 마감 차단`,desc:`생식 생산 카드 중 제품입고가 완료되지 않은 항목이 있으면 차단`}],le=[{key:`warnNoTomorrowProd`,label:`내일 생산 입력 없을 시 마감 경고`,desc:`다음 영업일 생산이 0건이면 마감 시 확인 모달`},{key:`warnBagMin`,label:`봉투 최소재고 미달 시 마감 경고`,desc:`봉투 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnMeatMin`,label:`원육 최소재고 미달 시 마감 경고`,desc:`원육 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnSupplementMin`,label:`영양제 최소재고 미달 시 마감 경고`,desc:`영양제 SKU 중 5봉 미만이 있으면 마감 시 확인 모달 (임계값 추후 변경 가능)`}];async function O(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>설정 로딩 중...</p></div>`;let[t,n,r,i,a,o,s,c]=await Promise.all([xe(),Se(),fe(),re(),ne(),ue(),w(v()),j()]);if(!e.isConnected)return;let l=g===`admin`||g===`office`,u=l;e.innerHTML=`
    <div class="settings-wrap">
      <h2 class="settings-title">설정</h2>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">담당자 관리</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <div class="staff-groups">
          ${G(`senior`,`선임`,t.senior,l)}
          ${G(`lead`,`주임`,t.lead,l)}
          ${G(`office`,`사무`,t.office,l)}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">메뉴별 담당자 그룹</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">
          각 메뉴의 담당자 선택에 어떤 그룹을 노출할지 설정합니다. 최소 1개 그룹을 선택해야 합니다.
        </p>
        <div class="menu-staff-group-list">
          ${ae.map(e=>ve(e,a[e.key],l)).join(``)}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">마감 차단/경고 설정</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">
          ON인 항목만 마감 시 차단/경고로 동작합니다. OFF로 두면 해당 항목을 무시하고 마감 가능합니다.
        </p>

        <h4 class="closing-flag-subtitle">차단 항목 (마감 자체를 막음)</h4>
        <div class="closing-flag-list">
          ${ce.map(e=>U(e,r[e.key],l)).join(``)}
        </div>

        <h4 class="closing-flag-subtitle">경고 항목 (마감 시 확인 모달만 표시)</h4>
        <div class="closing-flag-list">
          ${le.map(e=>U(e,r[e.key],l)).join(``)}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">공휴일 관리</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${Ce(n)}
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">생산지시서 카테고리 순서</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
          <p class="settings-section-desc">생산지시서 복사 시 카테고리 출력 순서입니다.</p>
          ${de(o,l)}
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">원료 명칭 통합</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
          <p class="settings-section-desc">레시피에 적힌 원료명을 실제로 통합합니다. 오늘 이후 생산 카드의 원료명도 함께 갱신되고, 과거 기록은 보존됩니다.</p>
          ${M(c,l)}
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">시스템 설정값</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">
          생산/재고 계산에 쓰이는 기준값입니다. 변경 시 이후 계산부터 적용됩니다.
        </p>
        <div class="system-value-list">
          ${b.map(e=>me(e,i[e.key],l)).join(``)}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">원료 단가 관리</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
          <p class="settings-section-desc">원육 단가를 원/kg 기준 effectiveDate 이력으로 관리합니다.</p>
          ${R(s,u)}
        </div>
      </details>
    </div>
  `,l&&K(t),l&&pe(r),l&&he(i),l&&ye(a),V(l),P(c,t,l),we(),z(s,u)}function k(e){let t=Array.isArray(e)?e.filter(e=>T.includes(e)):[],n=T.filter(e=>!t.includes(e));return[...t,...n]}async function ue(){try{let e=await a(r(u,`settings`,`copySheetOrder`));return e.exists()?k(e.data().order):[...T]}catch(e){return console.warn(`[settings] copySheetOrder load failed:`,e),[...T]}}function de(e,t){return`
    <ul id="copySheetOrderList" class="copy-sheet-order-list sortable-master-list">
      ${k(e).map(e=>`
        <li class="copy-sheet-order-item" data-key="${e}">
          ${t?`<span class="drag-handle">≡</span>`:``}
          <span>${se[e]||e}</span>
        </li>
      `).join(``)}
    </ul>
  `}function A(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}async function j(){let t=await e(i(u,`recipes`)),n=new Map;return t.docs.forEach(e=>{let t={id:e.id,...e.data()};(t.ingredients||[]).forEach(e=>{let r=(e.name||``).trim();if(!r)return;n.has(r)||n.set(r,{name:r,recipes:[],activeCount:0,inactiveCount:0});let i=n.get(r);if(i.recipes.some(e=>e.id===t.id))return;let a=t.status===`inactive`||t.active===!1;i.recipes.push({id:t.id,name:t.name||t.recipeName||`(이름 없음)`,inactive:a}),a?i.inactiveCount+=1:i.activeCount+=1})}),[...n.values()].sort((e,t)=>e.name.localeCompare(t.name,`ko-KR`))}function M(e,t){if(!e.length)return`<div class="cal-modal-empty">등록된 원료명이 없습니다.</div>`;let n=t?``:`disabled`;return`
    <div class="ingredient-merge-list" style="display:flex;flex-direction:column;gap:6px;">
      ${e.map(e=>`
        <details class="ingredient-merge-row" style="border:1px solid #eee;border-radius:6px;background:#fff;">
          <summary style="display:grid;grid-template-columns:28px 1fr 80px 90px 48px;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;font-size:13px;">
            <input type="checkbox" class="ingredient-merge-checkbox" data-name="${A(e.name)}" ${n}>
            <span style="font-weight:600;">${A(e.name)}</span>
            <span style="color:#555;text-align:right;">${e.recipes.length}개 레시피</span>
            <span style="color:${e.inactiveCount?`#b7791f`:`#999`};font-size:12px;">${e.inactiveCount?`비활성 포함`:``}</span>
            <button class="btn-secondary ingredient-rename-btn" data-name="${A(e.name)}"
              style="font-size:11px;padding:2px 8px;" ${n}>수정</button>
          </summary>
          <div style="padding:0 10px 10px 46px;color:#666;font-size:12px;line-height:1.7;">
            ${e.recipes.map(e=>`${A(e.name)}${e.inactive?` (비활성)`:``}`).join(`<br>`)}
          </div>
        </details>
      `).join(``)}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <button class="btn-primary" id="btnMergeIngredientNames" ${n} disabled>선택 통합</button>
    </div>
    ${t?``:`<p class="staff-empty">읽기 전용입니다. 통합은 대표/사무 계정에서 가능합니다.</p>`}
  `}function N(e){let t=[];Object.values(e||{}).forEach(e=>{(e||[]).forEach(e=>{let n=(e?.name||``).trim();n&&!t.includes(n)&&t.push(n)})});let n=d?.email||d?.uid||``;return n&&!t.includes(n)&&t.push(n),t}function P(e,t,n){let r=[...document.querySelectorAll(`.ingredient-merge-checkbox`)],i=document.getElementById(`btnMergeIngredientNames`);i&&(r.forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,()=>{i.disabled=!n||r.filter(e=>e.checked).length===0})}),n&&(document.querySelectorAll(`.ingredient-rename-btn`).forEach(n=>{n.addEventListener(`click`,r=>{r.stopPropagation(),r.preventDefault();let i=n.dataset.name;i&&F([i],e,t)})}),i.addEventListener(`click`,()=>{let n=r.filter(e=>e.checked).map(e=>e.dataset.name).filter(Boolean);n.length!==0&&F(n,e,t)})))}function F(e,t,n){let r=document.getElementById(`ingredientNameMergeModal`);r&&r.remove();let i=e.length===1,a=N(n).map(e=>`<option value="${A(e)}">${A(e)}</option>`).join(``),o=e.map(e=>`<li>${A(e)}</li>`).join(``),s=document.createElement(`div`);s.className=`modal-overlay`,s.id=`ingredientNameMergeModal`,s.innerHTML=`
    <div class="modal-box" style="width:520px;">
      <h3 class="modal-title">${i?`원료명 수정`:`원료 명칭 통합`}</h3>
      <p style="font-size:13px;color:#555;margin:0 0 10px;line-height:1.6;">${i?`이 원료명을 새 이름으로 변경합니다.`:`선택한 원료명을 새 이름 하나로 통합합니다.`} 오늘 이후 생산 카드의 원료명도 함께 갱신됩니다. 과거 기록은 보존됩니다.</p>
      <div style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">
        <div style="font-weight:600;margin-bottom:6px;">선택 원료명</div>
        <ul style="margin:0;padding-left:18px;">${o}</ul>
      </div>
      <div class="form-group">
        <label>새 원료명 *</label>
        <input type="text" id="ingredientMergeToName" value="${A(e[0]||``)}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="ingredientMergeStaff" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">
          ${a}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="ingredientMergeCancel">취소</button>
        <button class="btn-primary" id="ingredientMergeConfirm">${i?`변경`:`통합`}</button>
      </div>
    </div>
  `,document.body.appendChild(s);let c=()=>s.remove();s.querySelector(`#ingredientMergeCancel`).addEventListener(`click`,c),s.addEventListener(`click`,e=>{e.target===s&&c()}),s.querySelector(`#ingredientMergeConfirm`).addEventListener(`click`,async()=>{let t=s.querySelector(`#ingredientMergeToName`).value.trim(),n=s.querySelector(`#ingredientMergeStaff`).value||d?.email||d?.uid||``;if(!t){alert(`새 원료명을 입력해주세요.`);return}await I(e,t,n,c)})}async function I(n,a,s,c){let l=new Set(n);try{let d=await e(i(u,`recipes`)),f=[],p=[];if(d.docs.forEach(e=>{let t={id:e.id,...e.data()},n=t.ingredients||[],r=n.filter(e=>l.has((e.name||``).trim())).length,i=n.some(e=>{let t=(e.name||``).trim();return t===a&&!l.has(t)});r>1||r===1&&i?p.push(t.name||t.recipeName||t.id):r===1&&f.push({doc:e,recipe:t,ingredients:n})}),p.length>0){alert(`한 레시피에 통합 대상 원료가 2개 이상 있어 중복 원료가 생깁니다.\n레시피에서 먼저 정리해주세요.\n\n${p.join(`
`)}`);return}let m=[];f.forEach(e=>{let n=e.ingredients.map(e=>l.has((e.name||``).trim())?{...e,name:a}:e);m.push({ref:r(u,`recipes`,e.doc.id),data:{ingredients:n,updatedAt:t()}})});let h=v(),g=await e(i(u,`productions`)),_=[];if(g.docs.forEach(e=>{let n=e.data();if(!n.date||n.date<h||n.status===`deleted`)return;let i=n.ingredientsSnapshot||[],o=!1,s=i.map(e=>l.has((e.name||``).trim())?(o=!0,{...e,name:a}):e);o&&(_.push(e.id),m.push({ref:r(u,`productions`,e.id),data:{ingredientsSnapshot:s,updatedAt:t()}}))}),m.length===0){alert(`변경할 레시피나 생산 카드가 없습니다.`);return}for(let e=0;e<m.length;e+=D){let t=o(u);m.slice(e,e+D).forEach(e=>{t.update(e.ref,e.data)}),await t.commit()}await ee({date:v(),action:`recipe`,subAction:`ingredientRename`,staff:s,message:`원료 명칭 ${n.length>1?`통합`:`수정`} — [${n.join(`, `)}] → ${a} (레시피 ${f.length}건, 생산 ${_.length}건 동기화) / 담당: ${s}`,details:{fromNames:n,toName:a,recipeIds:f.map(e=>e.doc.id),productionIds:_}}),c?.(),await O()}catch(e){console.error(`[settings] ingredient name merge failed:`,e),alert(`원료 명칭 통합 실패: `+e.message)}}function L(e){return typeof e==`number`?`${e.toLocaleString(`ko-KR`)}원/kg`:`-`}function R(e,t){return e.length?`
    <div class="meat-price-list">
      ${e.map(e=>{let n=e.meatType,r=e.latest;return`
          <div class="closing-flag-row meat-price-row" data-meat-id="${n.id}">
            <div class="closing-flag-meta">
              <div class="closing-flag-label">${A(n.name)}</div>
              <div class="closing-flag-desc">현재 적용일: ${A(r?.effectiveDate||`-`)}</div>
            </div>
            <div class="meat-price-current">${L(r?.unitPrice)}</div>
            ${t?`<button class="btn-secondary btn-edit-meat-price" data-meat-id="${n.id}">수정</button>`:``}
          </div>
        `}).join(``)}
    </div>
  `:`<div class="cal-modal-empty">활성 원육 없음</div>`}function z(e,t){t&&document.querySelectorAll(`.btn-edit-meat-price`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.meatType.id===t.dataset.meatId);n&&B(n)})})}function B(n){let r=n.meatType,a=n.latest,o=v(),c=document.createElement(`div`);c.className=`modal-overlay`,c.innerHTML=`
    <div class="modal-box">
      <h3 class="modal-title">원료 단가 수정</h3>
      <div class="modal-form">
        <label class="modal-field">
          <span>원료명</span>
          <input class="cell-input" value="${A(r.name)}" readonly>
        </label>
        <label class="modal-field">
          <span>새 단가 (원/kg)</span>
          <input class="cell-input" id="meatPriceUnitPrice" type="number" min="0" step="1" value="${a?.unitPrice??``}">
        </label>
        <label class="modal-field">
          <span>적용일</span>
          <input class="cell-input" id="meatPriceEffectiveDate" type="date" value="${o}">
        </label>
        <label class="modal-field">
          <span>사유</span>
          <input class="cell-input" id="meatPriceReason" value="manual">
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="meatPriceCancel">취소</button>
        <button class="btn-primary" id="meatPriceSave">저장</button>
      </div>
    </div>
  `,document.body.appendChild(c);let l=()=>c.remove();c.querySelector(`#meatPriceCancel`).addEventListener(`click`,l),c.addEventListener(`click`,e=>{e.target===c&&l()}),c.querySelector(`#meatPriceSave`).addEventListener(`click`,async()=>{let n=Number(c.querySelector(`#meatPriceUnitPrice`).value),a=c.querySelector(`#meatPriceEffectiveDate`).value,o=c.querySelector(`#meatPriceReason`).value.trim()||`manual`;if(!Number.isFinite(n)||n<0){alert(`0 이상의 단가를 입력해주세요.`);return}if(!a){alert(`적용일을 입력해주세요.`);return}try{let c=C((await e(i(u,`meatTypes`,r.id,`priceHistory`))).docs.map(e=>({id:e.id,...e.data()})),a);await oe(r.id,{unitPrice:n,effectiveDate:a,prevUnitPrice:c?.unitPrice??null,reason:o,createdBy:d?.email||d?.uid||``}),await s(i(u,`activityLogs`),{date:v(),timestamp:t(),action:`meatPrice`,subAction:`manualEdit`,details:{meatTypeId:r.id,meatTypeName:r.name||``,prevUnitPrice:c?.unitPrice??null,newUnitPrice:n,effectiveDate:a},staffName:d?.email||d?.uid||``,acknowledged:!1}),l(),await O()}catch(e){console.error(`[settings] meat price save failed:`,e),alert(`원료 단가 저장 실패: `+e.message)}})}function V(e){if(E&&=(E.destroy(),null),!e)return;let t=document.getElementById(`copySheetOrderList`);t&&(E=te.create(t,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await H()}}))}async function H(){let e=document.getElementById(`copySheetOrderList`);if(!e)return;let n=Array.from(e.querySelectorAll(`.copy-sheet-order-item`)).map(e=>e.dataset.key).filter(e=>T.includes(e));try{await l(r(u,`settings`,`copySheetOrder`),{order:k(n),updatedAt:t(),updatedBy:d?.uid||null})}catch(e){console.error(`[settings] copySheetOrder save failed:`,e),alert(`카테고리 순서 저장 실패: `+e.message),await O()}}async function fe(){try{let e=await a(r(u,`settings`,`closingFlags`));return e.exists()?{...y,...e.data()}:{...y}}catch(e){return console.warn(`[settings] closingFlags load failed:`,e),{...y}}}function U(e,t,n){let r=t===!1?``:`checked`,i=n?``:`disabled`;return`
    <div class="closing-flag-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${e.label}</div>
        <div class="closing-flag-desc">${e.desc}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" data-flag-key="${e.key}" ${r} ${i}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `}function pe(e){document.querySelectorAll(`.closing-flag-list input[type="checkbox"]`).forEach(n=>{n.addEventListener(`change`,async n=>{let a=n.target.dataset.flagKey,o=e[a]!==!1,c=n.target.checked;try{await l(r(u,`settings`,`closingFlags`),{[a]:c},{merge:!0}),e[a]=c,await s(i(u,`activityLogs`),{date:v(),timestamp:t(),action:`settings`,subAction:`closingFlagToggle`,details:{flagKey:a,before:o,after:c},staffName:d?.email||d?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] closingFlags save failed:`,e),alert(`저장 실패: `+e.message),n.target.checked=o}})})}function me(e,t,n){let r=n?``:`disabled`,i;if(e.type===`fraction`){let n=t||{numerator:0,denominator:1};i=`
      <div class="system-value-fraction">
        <input type="number" class="system-value-input system-value-input-frac"
          data-value-key="${e.key}" data-frac-part="numerator"
          value="${n.numerator}" step="1" min="0" ${r}>
        <span class="system-value-frac-sep">/</span>
        <input type="number" class="system-value-input system-value-input-frac"
          data-value-key="${e.key}" data-frac-part="denominator"
          value="${n.denominator}" step="1" min="1" ${r}>
      </div>
    `}else{let n=e.type===`decimal`?`0.1`:`1`;i=`
      <div class="system-value-input-wrap">
        <input type="number" class="system-value-input"
          data-value-key="${e.key}"
          value="${t??``}" step="${n}" min="0" ${r}>
        ${e.unit?`<span class="system-value-unit">${e.unit}</span>`:``}
      </div>
    `}return`
    <div class="closing-flag-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${e.label}</div>
        <div class="closing-flag-desc">${e.desc}</div>
      </div>
      ${i}
    </div>
  `}function he(e){document.querySelectorAll(`.system-value-input`).forEach(t=>{t.addEventListener(`blur`,async t=>{let n=t.target.dataset.valueKey,r=b.find(e=>e.key===n);r&&(r.type===`fraction`?await _e(t.target,r,e):await ge(t.target,r,e))})})}async function ge(e,t,n){let i=t.key,a=n[i],o=t.type===`decimal`?parseFloat(e.value):parseInt(e.value,10);if(isNaN(o)||o<0){alert(`0 이상의 숫자를 입력해주세요.`),e.value=a;return}if(o!==a)try{await l(r(u,`settings`,`systemValues`),{[i]:o},{merge:!0}),n[i]=o,await W(i,a,o)}catch(t){console.error(`[settings] systemValue save failed:`,t),alert(`저장 실패: `+t.message),e.value=a}}async function _e(e,t,n){let i=t.key,a=n[i]||{numerator:0,denominator:1},o=document.querySelector(`.system-value-input[data-value-key="${i}"][data-frac-part="numerator"]`),s=document.querySelector(`.system-value-input[data-value-key="${i}"][data-frac-part="denominator"]`),c=parseInt(o.value,10),d=parseInt(s.value,10);if(isNaN(c)||c<0){alert(`분자는 0 이상의 정수여야 합니다.`),o.value=a.numerator;return}if(isNaN(d)||d<1){alert(`분모는 1 이상의 정수여야 합니다.`),s.value=a.denominator;return}let f={numerator:c,denominator:d};if(!(f.numerator===a.numerator&&f.denominator===a.denominator))try{await l(r(u,`settings`,`systemValues`),{[i]:f},{merge:!0}),n[i]=f,await W(i,a,f)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+e.message),o.value=a.numerator,s.value=a.denominator}}async function W(e,n,r){await s(i(u,`activityLogs`),{date:v(),timestamp:t(),action:`settings`,subAction:`systemValueChange`,details:{valueKey:e,before:n,after:r},staffName:d?.email||d?.uid||``,acknowledged:!1})}function ve(e,t=[],n){let r=n?``:`disabled`,i=Array.isArray(t)?t:[];return`
    <div class="closing-flag-row menu-staff-group-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${e.label}</div>
        <div class="closing-flag-desc">담당자 드롭다운에 표시할 그룹</div>
      </div>
      <div class="menu-staff-group-options" data-menu-key="${e.key}">
        ${x.map(t=>`
          <label class="menu-staff-group-option">
            <input
              type="checkbox"
              class="menu-staff-group-checkbox"
              data-menu-key="${e.key}"
              data-group-key="${t}"
              ${i.includes(t)?`checked`:``}
              ${r}
            >
            <span>${ie[t]}</span>
          </label>
        `).join(``)}
      </div>
    </div>
  `}function ye(e){document.querySelectorAll(`.menu-staff-group-checkbox`).forEach(n=>{n.addEventListener(`change`,async n=>{let a=n.target.dataset.menuKey,o=n.target.dataset.groupKey,c=Array.isArray(e[a])?[...e[a]]:[],f=new Set(c);n.target.checked?f.add(o):f.delete(o);let p=x.filter(e=>f.has(e));if(p.length===0){alert(`담당자 그룹은 최소 1개 이상 선택해야 합니다.`),n.target.checked=!0;return}if(!be(c,p))try{await l(r(u,`settings`,`menuStaffGroups`),{[a]:p},{merge:!0}),e[a]=p,await s(i(u,`activityLogs`),{date:v(),timestamp:t(),action:`settings`,subAction:`menuStaffGroupChange`,details:{menuKey:a,before:c,after:p},staffName:d?.email||d?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] menuStaffGroups save failed:`,e),alert(`저장 실패: `+e.message),n.target.checked=c.includes(o)}})})}function be(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}async function xe(){let e={senior:[],lead:[],office:[]};return await Promise.all(Object.keys(e).map(async t=>{let n=await a(r(u,`staffGroups`,t));n.exists()&&(e[t]=n.data().members||[])})),e}function G(e,t,n,r=!1){return`
    <div class="staff-group" data-group="${e}">
      <div class="staff-group-header">
        <span class="staff-group-label">${t}</span>
        ${r?`<button class="btn-add-staff" data-group="${e}">+ 추가</button>`:``}
      </div>
      <div class="staff-list" id="staffList-${e}">
        ${n.map((t,n)=>`
          <div class="staff-item" data-group="${e}" data-index="${n}">
            <span>${t.name}</span>
            ${r?`<button class="btn-del-staff" data-group="${e}" data-index="${n}">삭제</button>`:``}
          </div>
        `).join(``)}
        ${n.length===0?`<p class="staff-empty">담당자 없음</p>`:``}
      </div>
    </div>
  `}function K(e){document.querySelectorAll(`.btn-add-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=await h({title:`담당자 추가`,label:`담당자 이름`,placeholder:`예: 홍길동`,required:!0});r!==null&&(!r||!r.trim()||(e[n].push({id:Date.now().toString(),name:r.trim(),active:!0,sortOrder:e[n].length}),await q(n,e[n]),J(e)))})}),document.querySelectorAll(`.btn-del-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=parseInt(t.dataset.index,10);await _({title:`담당자 삭제`,message:`담당자를 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0})&&(e[n].splice(r,1),await q(n,e[n]),J(e))})})}async function q(e,t){await l(r(u,`staffGroups`,e),{name:{senior:`선임`,lead:`주임`,office:`사무`}[e],sortOrder:[`senior`,`lead`,`office`].indexOf(e),members:t,updatedAt:new Date})}function J(e){let t=g===`admin`||g===`office`;document.getElementById(`staffList-senior`).innerHTML=Y(`senior`,e.senior,t),document.getElementById(`staffList-lead`).innerHTML=Y(`lead`,e.lead,t),document.getElementById(`staffList-office`).innerHTML=Y(`office`,e.office,t),t&&K(e)}function Y(e,t,n=!1){return t.map((t,r)=>`
    <div class="staff-item" data-group="${e}" data-index="${r}">
      <span>${t.name}</span>
      ${n?`<button class="btn-del-staff" data-group="${e}" data-index="${r}">삭제</button>`:``}
    </div>
  `).join(``)||`<p class="staff-empty">담당자 없음</p>`}async function Se(){let t=(await e(i(u,`holidays`))).docs.map(e=>X(e.id,e.data())).filter(e=>e.status!==`deleted`);return t.sort((e,t)=>t.id.localeCompare(e.id)),t}function X(e,t={}){let n=t.title||t.label||t.name||``;return{id:e,date:t.date||e,title:n,label:t.label||n,description:t.description||``,holidayType:t.holidayType||(t.isAutoGenerated?`publicHoliday`:`internalOff`),affectsProduction:t.affectsProduction===void 0?!0:t.affectsProduction===!0,affectsShipping:t.affectsShipping===void 0?!0:t.affectsShipping===!0,shippingClosedFromEnabled:t.shippingClosedFromEnabled===void 0?!0:t.shippingClosedFromEnabled===!0,isAutoGenerated:t.isAutoGenerated===!0,recurrenceRule:t.recurrenceRule||null,status:t.status||`active`}}function Ce(e){let t=g===`admin`||g===`office`,n=`${f.startYear}~${f.endYear}`;return(t?`
    <div class="holiday-import-row">
      <button class="btn-secondary" id="btnImportPublicHolidays">한국 공휴일 자동 등록 (${n})</button>
      <span class="settings-section-desc">이미 등록된 날짜는 덮어쓰지 않습니다.</span>
    </div>
    <div class="holiday-form">
      <div class="holiday-form-fields">
        <label class="holiday-field">시작일
          <input type="date" id="hd_start" class="cell-input" />
        </label>
        <label class="holiday-field">종료일
          <input type="date" id="hd_end" class="cell-input" />
        </label>
        <label class="holiday-field holiday-field--name">휴무일명
          <input type="text" id="hd_label" class="cell-input" placeholder="예: 회사 휴무" />
        </label>
        <label class="holiday-field holiday-field--memo">메모
          <input type="text" id="hd_desc" class="cell-input" placeholder="선택 입력" />
        </label>
      </div>
      <div class="holiday-form-actions">
        <div class="holiday-options">
          <label class="holiday-check"><input type="checkbox" id="hd_affectsProduction" checked> 생산 안 함</label>
          <label class="holiday-check"><input type="checkbox" id="hd_affectsShipping" checked> 배송 안 함</label>
          <label class="holiday-check"><input type="checkbox" id="hd_shippingAvailablePrev" checked> 휴일 전날 배송 가능</label>
        </div>
        <button class="btn-primary" id="btnAddHoliday">+ 회사 휴무일 등록</button>
      </div>
    </div>
  `:`<p class="staff-empty">읽기 전용입니다. 등록은 대표/사무 계정에서 가능합니다.</p>`)+(e.length===0?`<p class="staff-empty">등록된 공휴일 없음</p>`:`
      <div class="holiday-list" id="holidayList">
        ${e.map(e=>`
          <div class="holiday-item" data-id="${e.id}">
            <span class="holiday-date">${e.id}</span>
            <span class="holiday-label">${e.title||e.label||``}</span>
            <span class="holiday-badge">${e.isAutoGenerated?`자동`:`회사`}</span>
            <span class="holiday-flags">
              ${e.affectsProduction?`생산휴무`:`생산가능`}
              · ${e.affectsShipping?`배송휴무`:`배송가능`}
              · ${e.shippingClosedFromEnabled?`전날배송불가`:`전날배송가능`}
            </span>
            ${t?`
              <button class="btn-edit-holiday" data-id="${e.id}">수정</button>
              <button class="btn-del-holiday" data-id="${e.id}">${e.isAutoGenerated?`비활성`:`삭제`}</button>
            `:``}
          </div>
        `).join(``)}
      </div>
    `)}function we(){let e=document.getElementById(`btnImportPublicHolidays`);e&&e.addEventListener(`click`,Z);let t=document.getElementById(`btnAddHoliday`);t&&t.addEventListener(`click`,Te),document.querySelectorAll(`.btn-del-holiday`).forEach(e=>{e.addEventListener(`click`,()=>De(e.dataset.id))}),document.querySelectorAll(`.btn-edit-holiday`).forEach(e=>{e.addEventListener(`click`,()=>Ee(e.dataset.id))})}async function Te(){let e=document.getElementById(`hd_start`),n=document.getElementById(`hd_end`),i=document.getElementById(`hd_label`),o=document.getElementById(`hd_desc`),s=document.getElementById(`hd_affectsProduction`),c=document.getElementById(`hd_affectsShipping`),f=document.getElementById(`hd_shippingAvailablePrev`),m=e.value,h=n.value||m,g=i.value.trim(),_=o.value.trim();if(!m){alert(`시작일을 선택해주세요.`),e.focus();return}if(h<m){alert(`종료일은 시작일 이후여야 합니다.`),n.focus();return}if(!g){alert(`휴무일명을 입력해주세요.`),i.focus();return}let v=Oe(m,h);try{let e=0,n=0;for(let i of v){let o=r(u,`holidays`,i);if((await a(o)).exists()){n+=1;continue}await l(o,{date:i,holidayType:`internalOff`,title:g,label:g,description:_,affectsProduction:s.checked,affectsShipping:c.checked,shippingClosedFromEnabled:!f.checked,isAutoGenerated:!1,recurrenceRule:null,status:`active`,createdAt:t(),createdBy:d?.uid||null,updatedAt:t(),updatedBy:d?.uid||null}),e+=1}if(await $(`create`,{startDate:m,endDate:h,title:g,created:e,skipped:n,total:v.length}),await p(),e===0&&n>0){alert(`등록된 날짜가 없습니다. 선택한 ${n}개 날짜가 이미 등록되어 있습니다.`);return}alert(`회사 휴무일 등록 완료: ${e}건${n?` / 기존 항목 건너뜀 ${n}건`:``}`),await O()}catch(e){console.error(e),alert(`등록 실패: `+e.message)}}async function Z(){let e=m();if(await _({title:`한국 공휴일 자동 등록`,message:`${f.startYear}~${f.endYear}년 한국 공휴일 ${e.length}건을 등록합니다.\n이미 등록된 날짜는 덮어쓰지 않습니다.`,confirmText:`등록`}))try{let n=0,i=0;for(let o of e){let e=r(u,`holidays`,o.date),s=await a(e);if(s.exists()&&s.data().status!==`deleted`){i+=1;continue}await l(e,{...o,label:o.title,status:`active`,createdAt:t(),createdBy:d?.uid||null,updatedAt:t(),updatedBy:d?.uid||null}),n+=1}await $(`autoImport`,{startYear:f.startYear,endYear:f.endYear,created:n,skipped:i,total:e.length}),await p(),alert(`한국 공휴일 자동 등록 완료: 신규 ${n}건 / 기존 유지 ${i}건`),await O()}catch(e){console.error(e),alert(`자동 등록 실패: `+e.message)}}async function Ee(e){let n=await a(r(u,`holidays`,e));if(!n.exists()){alert(`휴일 정보를 찾을 수 없습니다.`);return}let i=X(e,n.data()),o=await h({title:`휴일명 수정`,label:`휴일명`,defaultValue:i.title||i.label||``,required:!0});if(o===null)return;let s=await h({title:`메모 수정`,label:`메모`,defaultValue:i.description||``,required:!1,multiline:!0});if(s===null)return;let c=await _({title:`생산 영향`,message:`${e}에 생산하지 않음으로 설정할까요?`,confirmText:`생산 안 함`,cancelText:`생산 가능`}),f=await _({title:`배송 영향`,message:`${e}에 배송하지 않음으로 설정할까요?`,confirmText:`배송 안 함`,cancelText:`배송 가능`}),m=await _({title:`전날 배송`,message:`${e} 전날 배송 가능으로 설정할까요?`,confirmText:`전날 배송 가능`,cancelText:`전날 배송 불가`}),g={title:o,label:o,description:s,affectsProduction:c,affectsShipping:f,shippingClosedFromEnabled:!m,updatedAt:t(),updatedBy:d?.uid||null};try{await l(r(u,`holidays`,e),g,{merge:!0}),await $(`edit`,{date:e,before:Q(i),after:{title:o,description:s,affectsProduction:c,affectsShipping:f,shippingClosedFromEnabled:!m}}),await p(),alert(`휴일 수정 완료!`),await O()}catch(e){console.error(e),alert(`수정 실패: `+e.message)}}async function De(e){let n=await a(r(u,`holidays`,e)),i=n.exists()?X(e,n.data()):{id:e};if(await _({title:i.isAutoGenerated?`자동 공휴일 비활성`:`회사 휴무일 삭제`,message:`${e} ${i.isAutoGenerated?`자동 공휴일을 비활성 처리`:`회사 휴무일을 삭제 처리`}하시겠습니까?`,confirmText:i.isAutoGenerated?`비활성`:`삭제`,danger:!0}))try{await l(r(u,`holidays`,e),{date:e,status:`deleted`,updatedAt:t(),updatedBy:d?.uid||null,deletedAt:t(),deletedBy:d?.uid||null},{merge:!0}),await $(`delete`,{date:e,holiday:Q(i),mode:i.isAutoGenerated?`disableAutoGenerated`:`softDelete`}),await p(),alert(i.isAutoGenerated?`자동 공휴일 비활성 완료!`:`회사 휴무일 삭제 완료!`),await O()}catch(e){console.error(e),alert(`삭제 실패: `+e.message)}}function Oe(e,t){let n=[],r=new Date(`${e}T00:00:00+09:00`),i=new Date(`${t}T00:00:00+09:00`);for(let e=0;e<370&&r<=i;e+=1){let e=new Date(r.getTime()+540*60*1e3);n.push(e.toISOString().slice(0,10)),r=new Date(r.getTime()+1440*60*1e3)}return n}function Q(e){return{date:e.date||e.id,title:e.title||e.label||``,holidayType:e.holidayType||``,affectsProduction:e.affectsProduction,affectsShipping:e.affectsShipping,shippingClosedFromEnabled:e.shippingClosedFromEnabled,isAutoGenerated:e.isAutoGenerated===!0,status:e.status||`active`}}async function $(e,n){await s(i(u,`activityLogs`),{date:v(),timestamp:t(),action:`holiday`,subAction:e,details:n,staffName:d?.email||d?.uid||``,acknowledged:!1})}export{O as renderSettings};