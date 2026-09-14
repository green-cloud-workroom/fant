import{_ as e,d as t,i as n,n as r,o as i,p as a,u as o,v as s,w as c,y as l}from"./index.esm-ESivpAya.js";import{n as u}from"./firebase-I0rBIq9V.js";import{B as d,F as f,I as p,M as m,P as h,_ as g,g as _,z as v}from"./index-BMnUILA5.js";import{n as ee}from"./activityLogs-Dl6VA3lF.js";import{t as te}from"./sortable-BlBt-ybB.js";import{t as y}from"./closingChecksLogic-r1IrF0-V.js";import{a as b,i as ne,n as x,o as re,r as ie,t as ae}from"./menuStaffGroups-C31mo2ya.js";function S(e){return e?typeof e.toMillis==`function`?e.toMillis():typeof e.seconds==`number`?e.seconds*1e3:0:0}function C(e,t){return(e||[]).filter(e=>e.effectiveDate&&(!t||e.effectiveDate<=t)).sort((e,t)=>{let n=String(t.effectiveDate).localeCompare(String(e.effectiveDate));return n===0?S(t.createdAt)-S(e.createdAt):n})[0]||null}async function w(e){let n=(await i(t(s(u,`meatTypes`),o(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.active!==!1);return Promise.all(n.map(async t=>{let n=(await i(s(u,`meatTypes`,t.id,`priceHistory`))).docs.map(e=>({id:e.id,...e.data()}));return{meatType:t,latest:C(n,e),history:n}}))}async function oe(e,t){return r(s(u,`meatTypes`,e,`priceHistory`),{unitPrice:t.unitPrice,effectiveDate:t.effectiveDate,prevUnitPrice:t.prevUnitPrice??null,reason:t.reason||`manual`,createdAt:c(),createdBy:t.createdBy||``})}var T=[`rawCat`,`rawDog`,`freezeCat`,`freezeDog`,`freezeCommon`],se={rawCat:`생식 - 고양이`,rawDog:`생식 - 강아지`,freezeCat:`동결건조 - 고양이`,freezeDog:`동결건조 - 강아지`,freezeCommon:`동결건조 - 공용`},E=null,D=450,ce=[{key:`blockTomorrowProd`,label:`내일생산불러오기 미완료 시 마감 차단`,desc:`다음 영업일 생산이 있는데 내일생산불러오기를 안 했으면 차단`},{key:`blockFrozenOrder`,label:`동결건조 발주 미확인 시 마감 차단`,desc:`오늘 등록된 발주 행이 확인/취소되지 않으면 차단`},{key:`blockScheduleDue`,label:`입고예정 미처리 시 마감 차단`,desc:`오늘 도착 예정 입고가 완료/취소 처리되지 않으면 차단`},{key:`blockAutoRepack`,label:`자동 재포장 미확인 시 마감 차단`,desc:`자동 재포장 trigger/diff 로그가 확인되지 않으면 차단`},{key:`blockProdLog`,label:`생산 로그 미확인 시 마감 차단`,desc:`생산 카테고리 로그 (생산/재포장/전처리 등) 미확인 시 차단`},{key:`blockOfficeLog`,label:`사무 로그 미확인 시 마감 차단`,desc:`사무 카테고리 로그 (봉투/계란/원육/입고예정 등) 미확인 시 차단`},{key:`blockEggOut`,label:`계란 출고 미입력 시 마감 차단`,desc:`노른자 사용 생산이 있는데 계란 출고가 입력되지 않으면 차단`},{key:`blockProductReceipt`,label:`생식 제품입고 미완료 → 마감 차단`,desc:`생식 생산 카드 중 제품입고가 완료되지 않은 항목이 있으면 차단`}],le=[{key:`warnNoTomorrowProd`,label:`내일 생산 입력 없을 시 마감 경고`,desc:`다음 영업일 생산이 0건이면 마감 시 확인 모달`},{key:`warnBagMin`,label:`봉투 최소재고 미달 시 마감 경고`,desc:`봉투 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnMeatMin`,label:`원육 최소재고 미달 시 마감 경고`,desc:`원육 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnSupplementMin`,label:`영양제 최소재고 미달 시 마감 경고`,desc:`영양제 SKU 중 5봉 미만이 있으면 마감 시 확인 모달 (임계값 추후 변경 가능)`}];async function O(){if(![`admin`,`office`].includes(d))return;let e=document.getElementById(`mainContent`);e.innerHTML=`<div class="settings-wrap"><h2 class="settings-title">설정</h2>`+[`담당자 관리`,`메뉴별 담당자 그룹`,`마감 차단/경고 설정`,`공휴일 관리`,`생산지시서 카테고리 순서`,`원료 명칭 통합`,`시스템 설정값`,`원료 단가 관리`].map(e=>`<details class="settings-section"><summary class="settings-section-summary"><span class="settings-section-title">`+e+`</span><span class="settings-section-toggle">펼치기</span></summary><div class="settings-section-body"></div></details>`).join(``)+`</div>`,e.querySelectorAll(`.settings-section`).forEach((e,t)=>{let n=!1,r=!1,i=e.querySelector(`.settings-section-body`);async function a(){if(!(!e.open||n||r)){n=!0,i.textContent=`불러오는 중…`;try{switch(t){case 0:{let t=await W();if(!e.isConnected)return;i.innerHTML=`
        <div class="staff-groups">
          ${G(`senior`,`선임`,t.senior,!0)}
          ${G(`lead`,`주임`,t.lead,!0)}
          ${G(`office`,`사무`,t.office,!0)}
        </div>
        `,K(t);break}case 1:{let t=await ne();if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          각 메뉴의 담당자 선택에 어떤 그룹을 노출할지 설정합니다. 최소 1개 그룹을 선택해야 합니다.
        </p>
        <div class="menu-staff-group-list">
          ${ae.map(e=>ye(e,t[e.key],!0)).join(``)}
        </div>
        `,be(t);break}case 2:{let t=await pe();if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          ON인 항목만 마감 시 차단/경고로 동작합니다. OFF로 두면 해당 항목을 무시하고 마감 가능합니다.
        </p>

        <h4 class="closing-flag-subtitle">차단 항목 (마감 자체를 막음)</h4>
        <div class="closing-flag-list">
          ${ce.map(e=>H(e,t[e.key],!0)).join(``)}
        </div>

        <h4 class="closing-flag-subtitle">경고 항목 (마감 시 확인 모달만 표시)</h4>
        <div class="closing-flag-list">
          ${le.map(e=>H(e,t[e.key],!0)).join(``)}
        </div>
        `,me(t);break}case 3:{let t=await Se();if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${Ce(t)}
        `,we();break}case 4:{let t=await ue();if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">생산지시서 복사 시 카테고리 출력 순서입니다.</p>
          ${de(t,!0)}
        `,B(!0);break}case 5:{let t=await fe(),n=await W();if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">레시피에 적힌 원료명을 실제로 통합합니다. 오늘 이후 생산 카드의 원료명도 함께 갱신되고, 과거 기록은 보존됩니다.</p>
          ${j(t,!0)}
        `,N(t,n,!0);break}case 6:{let t=await re();if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          생산/재고 계산에 쓰이는 기준값입니다. 변경 시 이후 계산부터 적용됩니다.
        </p>
        <div class="system-value-list">
          ${b.map(e=>he(e,t[e.key],!0)).join(``)}
        </div>
        `,ge(t);break}case 7:{let t=await w(m());if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">원육 단가를 원/kg 기준 effectiveDate 이력으로 관리합니다.</p>
          ${L(t,!0)}
        `,R(t,!0);break}}r=!0}catch(t){e.isConnected&&(i.innerHTML=`<p>자료를 불러오지 못했습니다.</p><button class="btn-secondary">다시 시도</button>`,i.querySelector(`button`).addEventListener(`click`,a)),console.error(`[설정 영역 로드]`,t)}finally{n=!1}}}e.addEventListener(`toggle`,a)})}function k(e){let t=Array.isArray(e)?e.filter(e=>T.includes(e)):[],n=T.filter(e=>!t.includes(e));return[...t,...n]}async function ue(){try{let e=await n(l(u,`settings`,`copySheetOrder`));return e.exists()?k(e.data().order):[...T]}catch(e){return console.warn(`[settings] copySheetOrder load failed:`,e),[...T]}}function de(e,t){return`
    <ul id="copySheetOrderList" class="copy-sheet-order-list sortable-master-list">
      ${k(e).map(e=>`
        <li class="copy-sheet-order-item" data-key="${e}">
          ${t?`<span class="drag-handle">≡</span>`:``}
          <span>${se[e]||e}</span>
        </li>
      `).join(``)}
    </ul>
  `}function A(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}async function fe(){let e=await i(s(u,`recipes`)),t=new Map;return e.docs.forEach(e=>{let n={id:e.id,...e.data()};(n.ingredients||[]).forEach(e=>{let r=(e.name||``).trim();if(!r)return;t.has(r)||t.set(r,{name:r,recipes:[],activeCount:0,inactiveCount:0});let i=t.get(r);if(i.recipes.some(e=>e.id===n.id))return;let a=n.status===`inactive`||n.active===!1;i.recipes.push({id:n.id,name:n.name||n.recipeName||`(이름 없음)`,inactive:a}),a?i.inactiveCount+=1:i.activeCount+=1})}),[...t.values()].sort((e,t)=>e.name.localeCompare(t.name,`ko-KR`))}function j(e,t){if(!e.length)return`<div class="cal-modal-empty">등록된 원료명이 없습니다.</div>`;let n=t?``:`disabled`;return`
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
  `}function M(e){let t=[];Object.values(e||{}).forEach(e=>{(e||[]).forEach(e=>{let n=(e?.name||``).trim();n&&!t.includes(n)&&t.push(n)})});let n=v?.email||v?.uid||``;return n&&!t.includes(n)&&t.push(n),t}function N(e,t,n){let r=[...document.querySelectorAll(`.ingredient-merge-checkbox`)],i=document.getElementById(`btnMergeIngredientNames`);i&&(r.forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,()=>{i.disabled=!n||r.filter(e=>e.checked).length===0})}),n&&(document.querySelectorAll(`.ingredient-rename-btn`).forEach(n=>{n.addEventListener(`click`,r=>{r.stopPropagation(),r.preventDefault();let i=n.dataset.name;i&&P([i],e,t)})}),i.addEventListener(`click`,()=>{let n=r.filter(e=>e.checked).map(e=>e.dataset.name).filter(Boolean);n.length!==0&&P(n,e,t)})))}function P(e,t,n){let r=document.getElementById(`ingredientNameMergeModal`);r&&r.remove();let i=e.length===1,a=M(n).map(e=>`<option value="${A(e)}">${A(e)}</option>`).join(``),o=e.map(e=>`<li>${A(e)}</li>`).join(``),s=document.createElement(`div`);s.className=`modal-overlay`,s.id=`ingredientNameMergeModal`,s.innerHTML=`
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
  `,document.body.appendChild(s);let c=()=>s.remove();s.querySelector(`#ingredientMergeCancel`).addEventListener(`click`,c),s.addEventListener(`click`,e=>{e.target===s&&c()}),s.querySelector(`#ingredientMergeConfirm`).addEventListener(`click`,async()=>{let t=s.querySelector(`#ingredientMergeToName`).value.trim(),n=s.querySelector(`#ingredientMergeStaff`).value||v?.email||v?.uid||``;if(!t){alert(`새 원료명을 입력해주세요.`);return}await F(e,t,n,c)})}async function F(t,n,r,a){let o=new Set(t);try{let d=await i(s(u,`recipes`)),f=[],p=[];if(d.docs.forEach(e=>{let t={id:e.id,...e.data()},r=t.ingredients||[],i=r.filter(e=>o.has((e.name||``).trim())).length,a=r.some(e=>{let t=(e.name||``).trim();return t===n&&!o.has(t)});i>1||i===1&&a?p.push(t.name||t.recipeName||t.id):i===1&&f.push({doc:e,recipe:t,ingredients:r})}),p.length>0){alert(`한 레시피에 통합 대상 원료가 2개 이상 있어 중복 원료가 생깁니다.\n레시피에서 먼저 정리해주세요.\n\n${p.join(`
`)}`);return}let h=[];f.forEach(e=>{let t=e.ingredients.map(e=>o.has((e.name||``).trim())?{...e,name:n}:e);h.push({ref:l(u,`recipes`,e.doc.id),data:{ingredients:t,updatedAt:c()}})});let g=m(),_=await i(s(u,`productions`)),v=[];if(_.docs.forEach(e=>{let t=e.data();if(!t.date||t.date<g||t.status===`deleted`)return;let r=t.ingredientsSnapshot||[],i=!1,a=r.map(e=>o.has((e.name||``).trim())?(i=!0,{...e,name:n}):e);i&&(v.push(e.id),h.push({ref:l(u,`productions`,e.id),data:{ingredientsSnapshot:a,updatedAt:c()}}))}),h.length===0){alert(`변경할 레시피나 생산 카드가 없습니다.`);return}for(let t=0;t<h.length;t+=D){let n=e(u);h.slice(t,t+D).forEach(e=>{n.update(e.ref,e.data)}),await n.commit()}await ee({date:m(),action:`recipe`,subAction:`ingredientRename`,staff:r,message:`원료 명칭 ${t.length>1?`통합`:`수정`} — [${t.join(`, `)}] → ${n} (레시피 ${f.length}건, 생산 ${v.length}건 동기화) / 담당: ${r}`,details:{fromNames:t,toName:n,recipeIds:f.map(e=>e.doc.id),productionIds:v}}),a?.(),await O()}catch(e){console.error(`[settings] ingredient name merge failed:`,e),alert(`원료 명칭 통합 실패: `+e.message)}}function I(e){return typeof e==`number`?`${e.toLocaleString(`ko-KR`)}원/kg`:`-`}function L(e,t){return e.length?`
    <div class="meat-price-list">
      ${e.map(e=>{let n=e.meatType,r=e.latest;return`
          <div class="closing-flag-row meat-price-row" data-meat-id="${n.id}">
            <div class="closing-flag-meta">
              <div class="closing-flag-label">${A(n.name)}</div>
              <div class="closing-flag-desc">현재 적용일: ${A(r?.effectiveDate||`-`)}</div>
            </div>
            <div class="meat-price-current">${I(r?.unitPrice)}</div>
            ${t?`<button class="btn-secondary btn-edit-meat-price" data-meat-id="${n.id}">수정</button>`:``}
          </div>
        `}).join(``)}
    </div>
  `:`<div class="cal-modal-empty">활성 원육 없음</div>`}function R(e,t){t&&document.querySelectorAll(`.btn-edit-meat-price`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.meatType.id===t.dataset.meatId);n&&z(n)})})}function z(e){let t=e.meatType,n=e.latest,a=m(),o=document.createElement(`div`);o.className=`modal-overlay`,o.innerHTML=`
    <div class="modal-box">
      <h3 class="modal-title">원료 단가 수정</h3>
      <div class="modal-form">
        <label class="modal-field">
          <span>원료명</span>
          <input class="cell-input" value="${A(t.name)}" readonly>
        </label>
        <label class="modal-field">
          <span>새 단가 (원/kg)</span>
          <input class="cell-input" id="meatPriceUnitPrice" type="number" min="0" step="1" value="${n?.unitPrice??``}">
        </label>
        <label class="modal-field">
          <span>적용일</span>
          <input class="cell-input" id="meatPriceEffectiveDate" type="date" value="${a}">
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
  `,document.body.appendChild(o);let l=()=>o.remove();o.querySelector(`#meatPriceCancel`).addEventListener(`click`,l),o.addEventListener(`click`,e=>{e.target===o&&l()}),o.querySelector(`#meatPriceSave`).addEventListener(`click`,async()=>{let e=Number(o.querySelector(`#meatPriceUnitPrice`).value),n=o.querySelector(`#meatPriceEffectiveDate`).value,a=o.querySelector(`#meatPriceReason`).value.trim()||`manual`;if(!Number.isFinite(e)||e<0){alert(`0 이상의 단가를 입력해주세요.`);return}if(!n){alert(`적용일을 입력해주세요.`);return}try{let o=C((await i(s(u,`meatTypes`,t.id,`priceHistory`))).docs.map(e=>({id:e.id,...e.data()})),n);await oe(t.id,{unitPrice:e,effectiveDate:n,prevUnitPrice:o?.unitPrice??null,reason:a,createdBy:v?.email||v?.uid||``}),await r(s(u,`activityLogs`),{date:m(),timestamp:c(),action:`meatPrice`,subAction:`manualEdit`,details:{meatTypeId:t.id,meatTypeName:t.name||``,prevUnitPrice:o?.unitPrice??null,newUnitPrice:e,effectiveDate:n},staffName:v?.email||v?.uid||``,acknowledged:!1}),l(),await O()}catch(e){console.error(`[settings] meat price save failed:`,e),alert(`원료 단가 저장 실패: `+e.message)}})}function B(e){if(E&&=(E.destroy(),null),!e)return;let t=document.getElementById(`copySheetOrderList`);t&&(E=te.create(t,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await V()}}))}async function V(){let e=document.getElementById(`copySheetOrderList`);if(!e)return;let t=Array.from(e.querySelectorAll(`.copy-sheet-order-item`)).map(e=>e.dataset.key).filter(e=>T.includes(e));try{await a(l(u,`settings`,`copySheetOrder`),{order:k(t),updatedAt:c(),updatedBy:v?.uid||null})}catch(e){console.error(`[settings] copySheetOrder save failed:`,e),alert(`카테고리 순서 저장 실패: `+e.message),await O()}}async function pe(){try{let e=await n(l(u,`settings`,`closingFlags`));return e.exists()?{...y,...e.data()}:{...y}}catch(e){return console.warn(`[settings] closingFlags load failed:`,e),{...y}}}function H(e,t,n){let r=t===!1?``:`checked`,i=n?``:`disabled`;return`
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
  `}function me(e){document.querySelectorAll(`.closing-flag-list input[type="checkbox"]`).forEach(t=>{t.addEventListener(`change`,async t=>{let n=t.target.dataset.flagKey,i=e[n]!==!1,o=t.target.checked;try{await a(l(u,`settings`,`closingFlags`),{[n]:o},{merge:!0}),e[n]=o,await r(s(u,`activityLogs`),{date:m(),timestamp:c(),action:`settings`,subAction:`closingFlagToggle`,details:{flagKey:n,before:i,after:o},staffName:v?.email||v?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] closingFlags save failed:`,e),alert(`저장 실패: `+e.message),t.target.checked=i}})})}function he(e,t,n){let r=n?``:`disabled`,i;if(e.type===`fraction`){let n=t||{numerator:0,denominator:1};i=`
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
  `}function ge(e){document.querySelectorAll(`.system-value-input`).forEach(t=>{t.addEventListener(`blur`,async t=>{let n=t.target.dataset.valueKey,r=b.find(e=>e.key===n);r&&(r.type===`fraction`?await ve(t.target,r,e):await _e(t.target,r,e))})})}async function _e(e,t,n){let r=t.key,i=n[r],o=t.type===`decimal`?parseFloat(e.value):parseInt(e.value,10);if(isNaN(o)||o<0){alert(`0 이상의 숫자를 입력해주세요.`),e.value=i;return}if(o!==i)try{await a(l(u,`settings`,`systemValues`),{[r]:o},{merge:!0}),n[r]=o,await U(r,i,o)}catch(t){console.error(`[settings] systemValue save failed:`,t),alert(`저장 실패: `+t.message),e.value=i}}async function ve(e,t,n){let r=t.key,i=n[r]||{numerator:0,denominator:1},o=document.querySelector(`.system-value-input[data-value-key="${r}"][data-frac-part="numerator"]`),s=document.querySelector(`.system-value-input[data-value-key="${r}"][data-frac-part="denominator"]`),c=parseInt(o.value,10),d=parseInt(s.value,10);if(isNaN(c)||c<0){alert(`분자는 0 이상의 정수여야 합니다.`),o.value=i.numerator;return}if(isNaN(d)||d<1){alert(`분모는 1 이상의 정수여야 합니다.`),s.value=i.denominator;return}let f={numerator:c,denominator:d};if(!(f.numerator===i.numerator&&f.denominator===i.denominator))try{await a(l(u,`settings`,`systemValues`),{[r]:f},{merge:!0}),n[r]=f,await U(r,i,f)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+e.message),o.value=i.numerator,s.value=i.denominator}}async function U(e,t,n){await r(s(u,`activityLogs`),{date:m(),timestamp:c(),action:`settings`,subAction:`systemValueChange`,details:{valueKey:e,before:t,after:n},staffName:v?.email||v?.uid||``,acknowledged:!1})}function ye(e,t=[],n){let r=n?``:`disabled`,i=Array.isArray(t)?t:[];return`
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
  `}function be(e){document.querySelectorAll(`.menu-staff-group-checkbox`).forEach(t=>{t.addEventListener(`change`,async t=>{let n=t.target.dataset.menuKey,i=t.target.dataset.groupKey,o=Array.isArray(e[n])?[...e[n]]:[],d=new Set(o);t.target.checked?d.add(i):d.delete(i);let f=x.filter(e=>d.has(e));if(f.length===0){alert(`담당자 그룹은 최소 1개 이상 선택해야 합니다.`),t.target.checked=!0;return}if(!xe(o,f))try{await a(l(u,`settings`,`menuStaffGroups`),{[n]:f},{merge:!0}),e[n]=f,await r(s(u,`activityLogs`),{date:m(),timestamp:c(),action:`settings`,subAction:`menuStaffGroupChange`,details:{menuKey:n,before:o,after:f},staffName:v?.email||v?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] menuStaffGroups save failed:`,e),alert(`저장 실패: `+e.message),t.target.checked=o.includes(i)}})})}function xe(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}async function W(){let e={senior:[],lead:[],office:[]};return await Promise.all(Object.keys(e).map(async t=>{let r=await n(l(u,`staffGroups`,t));r.exists()&&(e[t]=r.data().members||[])})),e}function G(e,t,n,r=!1){return`
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
  `}function K(e){document.querySelectorAll(`.btn-add-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=await g({title:`담당자 추가`,label:`담당자 이름`,placeholder:`예: 홍길동`,required:!0});r!==null&&(!r||!r.trim()||(e[n].push({id:Date.now().toString(),name:r.trim(),active:!0,sortOrder:e[n].length}),await q(n,e[n]),J(e)))})}),document.querySelectorAll(`.btn-del-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=parseInt(t.dataset.index,10);await _({title:`담당자 삭제`,message:`담당자를 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0})&&(e[n].splice(r,1),await q(n,e[n]),J(e))})})}async function q(e,t){await a(l(u,`staffGroups`,e),{name:{senior:`선임`,lead:`주임`,office:`사무`}[e],sortOrder:[`senior`,`lead`,`office`].indexOf(e),members:t,updatedAt:new Date})}function J(e){let t=d===`admin`||d===`office`;document.getElementById(`staffList-senior`).innerHTML=Y(`senior`,e.senior,t),document.getElementById(`staffList-lead`).innerHTML=Y(`lead`,e.lead,t),document.getElementById(`staffList-office`).innerHTML=Y(`office`,e.office,t),t&&K(e)}function Y(e,t,n=!1){return t.map((t,r)=>`
    <div class="staff-item" data-group="${e}" data-index="${r}">
      <span>${t.name}</span>
      ${n?`<button class="btn-del-staff" data-group="${e}" data-index="${r}">삭제</button>`:``}
    </div>
  `).join(``)||`<p class="staff-empty">담당자 없음</p>`}async function Se(){let e=(await i(s(u,`holidays`))).docs.map(e=>X(e.id,e.data())).filter(e=>e.status!==`deleted`);return e.sort((e,t)=>t.id.localeCompare(e.id)),e}function X(e,t={}){let n=t.title||t.label||t.name||``;return{id:e,date:t.date||e,title:n,label:t.label||n,description:t.description||``,holidayType:t.holidayType||(t.isAutoGenerated?`publicHoliday`:`internalOff`),affectsProduction:t.affectsProduction===void 0?!0:t.affectsProduction===!0,affectsShipping:t.affectsShipping===void 0?!0:t.affectsShipping===!0,shippingClosedFromEnabled:t.shippingClosedFromEnabled===void 0?!0:t.shippingClosedFromEnabled===!0,isAutoGenerated:t.isAutoGenerated===!0,recurrenceRule:t.recurrenceRule||null,status:t.status||`active`}}function Ce(e){let t=d===`admin`||d===`office`,n=`${f.startYear}~${f.endYear}`;return(t?`
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
    `)}function we(){let e=document.getElementById(`btnImportPublicHolidays`);e&&e.addEventListener(`click`,Z);let t=document.getElementById(`btnAddHoliday`);t&&t.addEventListener(`click`,Te),document.querySelectorAll(`.btn-del-holiday`).forEach(e=>{e.addEventListener(`click`,()=>De(e.dataset.id))}),document.querySelectorAll(`.btn-edit-holiday`).forEach(e=>{e.addEventListener(`click`,()=>Ee(e.dataset.id))})}async function Te(){let e=document.getElementById(`hd_start`),t=document.getElementById(`hd_end`),r=document.getElementById(`hd_label`),i=document.getElementById(`hd_desc`),o=document.getElementById(`hd_affectsProduction`),s=document.getElementById(`hd_affectsShipping`),d=document.getElementById(`hd_shippingAvailablePrev`),f=e.value,p=t.value||f,m=r.value.trim(),g=i.value.trim();if(!f){alert(`시작일을 선택해주세요.`),e.focus();return}if(p<f){alert(`종료일은 시작일 이후여야 합니다.`),t.focus();return}if(!m){alert(`휴무일명을 입력해주세요.`),r.focus();return}let _=Oe(f,p);try{let e=0,t=0;for(let r of _){let i=l(u,`holidays`,r);if((await n(i)).exists()){t+=1;continue}await a(i,{date:r,holidayType:`internalOff`,title:m,label:m,description:g,affectsProduction:o.checked,affectsShipping:s.checked,shippingClosedFromEnabled:!d.checked,isAutoGenerated:!1,recurrenceRule:null,status:`active`,createdAt:c(),createdBy:v?.uid||null,updatedAt:c(),updatedBy:v?.uid||null}),e+=1}if(await $(`create`,{startDate:f,endDate:p,title:m,created:e,skipped:t,total:_.length}),await h(),e===0&&t>0){alert(`등록된 날짜가 없습니다. 선택한 ${t}개 날짜가 이미 등록되어 있습니다.`);return}alert(`회사 휴무일 등록 완료: ${e}건${t?` / 기존 항목 건너뜀 ${t}건`:``}`),await O()}catch(e){console.error(e),alert(`등록 실패: `+e.message)}}async function Z(){let e=p();if(await _({title:`한국 공휴일 자동 등록`,message:`${f.startYear}~${f.endYear}년 한국 공휴일 ${e.length}건을 등록합니다.\n이미 등록된 날짜는 덮어쓰지 않습니다.`,confirmText:`등록`}))try{let t=0,r=0;for(let i of e){let e=l(u,`holidays`,i.date),o=await n(e);if(o.exists()&&o.data().status!==`deleted`){r+=1;continue}await a(e,{...i,label:i.title,status:`active`,createdAt:c(),createdBy:v?.uid||null,updatedAt:c(),updatedBy:v?.uid||null}),t+=1}await $(`autoImport`,{startYear:f.startYear,endYear:f.endYear,created:t,skipped:r,total:e.length}),await h(),alert(`한국 공휴일 자동 등록 완료: 신규 ${t}건 / 기존 유지 ${r}건`),await O()}catch(e){console.error(e),alert(`자동 등록 실패: `+e.message)}}async function Ee(e){let t=await n(l(u,`holidays`,e));if(!t.exists()){alert(`휴일 정보를 찾을 수 없습니다.`);return}let r=X(e,t.data()),i=await g({title:`휴일명 수정`,label:`휴일명`,defaultValue:r.title||r.label||``,required:!0});if(i===null)return;let o=await g({title:`메모 수정`,label:`메모`,defaultValue:r.description||``,required:!1,multiline:!0});if(o===null)return;let s=await _({title:`생산 영향`,message:`${e}에 생산하지 않음으로 설정할까요?`,confirmText:`생산 안 함`,cancelText:`생산 가능`}),d=await _({title:`배송 영향`,message:`${e}에 배송하지 않음으로 설정할까요?`,confirmText:`배송 안 함`,cancelText:`배송 가능`}),f=await _({title:`전날 배송`,message:`${e} 전날 배송 가능으로 설정할까요?`,confirmText:`전날 배송 가능`,cancelText:`전날 배송 불가`}),p={title:i,label:i,description:o,affectsProduction:s,affectsShipping:d,shippingClosedFromEnabled:!f,updatedAt:c(),updatedBy:v?.uid||null};try{await a(l(u,`holidays`,e),p,{merge:!0}),await $(`edit`,{date:e,before:Q(r),after:{title:i,description:o,affectsProduction:s,affectsShipping:d,shippingClosedFromEnabled:!f}}),await h(),alert(`휴일 수정 완료!`),await O()}catch(e){console.error(e),alert(`수정 실패: `+e.message)}}async function De(e){let t=await n(l(u,`holidays`,e)),r=t.exists()?X(e,t.data()):{id:e};if(await _({title:r.isAutoGenerated?`자동 공휴일 비활성`:`회사 휴무일 삭제`,message:`${e} ${r.isAutoGenerated?`자동 공휴일을 비활성 처리`:`회사 휴무일을 삭제 처리`}하시겠습니까?`,confirmText:r.isAutoGenerated?`비활성`:`삭제`,danger:!0}))try{await a(l(u,`holidays`,e),{date:e,status:`deleted`,updatedAt:c(),updatedBy:v?.uid||null,deletedAt:c(),deletedBy:v?.uid||null},{merge:!0}),await $(`delete`,{date:e,holiday:Q(r),mode:r.isAutoGenerated?`disableAutoGenerated`:`softDelete`}),await h(),alert(r.isAutoGenerated?`자동 공휴일 비활성 완료!`:`회사 휴무일 삭제 완료!`),await O()}catch(e){console.error(e),alert(`삭제 실패: `+e.message)}}function Oe(e,t){let n=[],r=new Date(`${e}T00:00:00+09:00`),i=new Date(`${t}T00:00:00+09:00`);for(let e=0;e<370&&r<=i;e+=1){let e=new Date(r.getTime()+540*60*1e3);n.push(e.toISOString().slice(0,10)),r=new Date(r.getTime()+1440*60*1e3)}return n}function Q(e){return{date:e.date||e.id,title:e.title||e.label||``,holidayType:e.holidayType||``,affectsProduction:e.affectsProduction,affectsShipping:e.affectsShipping,shippingClosedFromEnabled:e.shippingClosedFromEnabled,isAutoGenerated:e.isAutoGenerated===!0,status:e.status||`active`}}async function $(e,t){await r(s(u,`activityLogs`),{date:m(),timestamp:c(),action:`holiday`,subAction:e,details:t,staffName:v?.email||v?.uid||``,acknowledged:!1})}export{O as renderSettings};