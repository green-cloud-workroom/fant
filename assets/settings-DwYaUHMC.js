import{T as e,a as t,b as n,d as r,n as i,s as a,u as o,y as s}from"./index.esm-rHmxwfvm.js";import{n as c}from"./firebase-qGjqjNvO.js";import{B as l,G as u,L as d,V as f,W as p,b as m,f as h,g,m as _,p as v,z as y}from"./index-C3J_bQqC.js";import"./activityLogs-CRxSouBf.js";import{t as ee}from"./sortable-DIR4yJqN.js";import{t as te}from"./pageRefresh-33o9kkfx.js";import{t as b}from"./pageCommand-DPbnNpe7.js";import{t as x}from"./commandWrites-D8jwKhUE.js";import{t as S}from"./closingChecksLogic-BVN2WQRU.js";import{a as ne,c as re,i as ie,n as ae,o as C,r as w,s as T,t as oe}from"./menuStaffGroups-Bn-EyNew.js";function E(e){return e?typeof e.toMillis==`function`?e.toMillis():typeof e.seconds==`number`?e.seconds*1e3:0:0}function D(e,t){return(e||[]).filter(e=>e.effectiveDate&&(!t||e.effectiveDate<=t)).sort((e,t)=>{let n=String(t.effectiveDate).localeCompare(String(e.effectiveDate));return n===0?E(t.createdAt)-E(e.createdAt):n})[0]||null}async function se(e,t={getDocs:a}){let n=(await t.getDocs(r(s(c,`meatTypes`),o(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.active!==!1);return Promise.all(n.map(async n=>{let r=(await t.getDocs(s(c,`meatTypes`,n.id,`priceHistory`))).docs.map(e=>({id:e.id,...e.data()}));return{meatType:n,latest:D(r,e),history:r}}))}async function O(t,n,r={addDoc:i}){return r.addDoc(s(c,`meatTypes`,t,`priceHistory`),{unitPrice:n.unitPrice,effectiveDate:n.effectiveDate,prevUnitPrice:n.prevUnitPrice??null,reason:n.reason||`manual`,createdAt:e(),createdBy:n.createdBy||``})}async function k(e,t,r,i,a={}){let o=await e.getDoc(n(c,t)),s={...a,...o.exists()?o.data():{}}[r];if(m(s)!==m(i))throw Error(`다른 작업으로 설정이 변경되었습니다. 입력을 보존하고 최신 자료를 다시 확인해주세요.`)}var A=[`rawCat`,`rawDog`,`freezeCat`,`freezeDog`,`freezeCommon`],ce={rawCat:`생식 - 고양이`,rawDog:`생식 - 강아지`,freezeCat:`동결건조 - 고양이`,freezeDog:`동결건조 - 강아지`,freezeCommon:`동결건조 - 공용`},j=null,M=450,le=[{key:`blockTomorrowProd`,label:`내일생산불러오기 미완료 시 마감 차단`,desc:`다음 영업일 생산이 있는데 내일생산불러오기를 안 했으면 차단`},{key:`blockFrozenOrder`,label:`동결건조 발주 미확인 시 마감 차단`,desc:`오늘 등록된 발주 행이 확인/취소되지 않으면 차단`},{key:`blockScheduleDue`,label:`입고예정 미처리 시 마감 차단`,desc:`오늘 도착 예정 입고가 완료/취소 처리되지 않으면 차단`},{key:`blockAutoRepack`,label:`자동 재포장 미확인 시 마감 차단`,desc:`자동 재포장 trigger/diff 로그가 확인되지 않으면 차단`},{key:`blockProdLog`,label:`생산 로그 미확인 시 마감 차단`,desc:`생산 카테고리 로그 (생산/재포장/전처리 등) 미확인 시 차단`},{key:`blockOfficeLog`,label:`사무 로그 미확인 시 마감 차단`,desc:`사무 카테고리 로그 (봉투/계란/원육/입고예정 등) 미확인 시 차단`},{key:`blockEggOut`,label:`계란 출고 미입력 시 마감 차단`,desc:`노른자 사용 생산이 있는데 계란 출고가 입력되지 않으면 차단`},{key:`blockProductReceipt`,label:`생식 제품입고 미완료 → 마감 차단`,desc:`생식 생산 카드 중 제품입고가 완료되지 않은 항목이 있으면 차단`}],ue=[{key:`warnNoTomorrowProd`,label:`내일 생산 입력 없을 시 마감 경고`,desc:`다음 영업일 생산이 0건이면 마감 시 확인 모달`},{key:`warnBagMin`,label:`봉투 최소재고 미달 시 마감 경고`,desc:`봉투 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnMeatMin`,label:`원육 최소재고 미달 시 마감 경고`,desc:`원육 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnSupplementMin`,label:`영양제 최소재고 미달 시 마감 경고`,desc:`영양제 SKU 중 5봉 미만이 있으면 마감 시 확인 모달 (임계값 추후 변경 가능)`}];async function N(){if(![`admin`,`office`].includes(u)||!await Z.load(async()=>({}),{force:!0}))return;let e=document.getElementById(`mainContent`);e.innerHTML=`<div class="settings-wrap"><h2 class="settings-title">설정</h2>`+[`담당자 관리`,`메뉴별 담당자 그룹`,`마감 차단/경고 설정`,`공휴일 관리`,`생산지시서 카테고리 순서`,`원료 명칭 통합`,`시스템 설정값`,`원료 단가 관리`].map(e=>`<details class="settings-section"><summary class="settings-section-summary"><span class="settings-section-title">`+e+`</span><span class="settings-section-toggle">펼치기</span></summary><div class="settings-section-body"></div></details>`).join(``)+`</div>`,e.querySelectorAll(`.settings-section`).forEach((e,t)=>{let n=!1,r=!1,i=e.querySelector(`.settings-section-body`);async function a(o={}){if(!(!e.open||n||r)){n=!0,i.textContent=`불러오는 중…`;try{let n=Q[t],s=n?await n.load(e=>$(t,e),{force:o.force===!0,onChange:te(n,async e=>{r=!1,await a(e)},{draftSelector:`.settings-section-body`})}):await $(t);if(!e.isConnected||n&&s==null)return;switch(t){case 0:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <div class="staff-groups">
          ${H(`senior`,`선임`,t.senior,!0)}
          ${H(`lead`,`주임`,t.lead,!0)}
          ${H(`office`,`사무`,t.office,!0)}
        </div>
        `,U(t);break}case 1:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          각 메뉴의 담당자 선택에 어떤 그룹을 노출할지 설정합니다. 최소 1개 그룹을 선택해야 합니다.
        </p>
        <div class="menu-staff-group-list">
          ${ae.map(e=>Oe(e,t[e.key],!0)).join(``)}
        </div>
        `,ke(t);break}case 2:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          ON인 항목만 마감 시 차단/경고로 동작합니다. OFF로 두면 해당 항목을 무시하고 마감 가능합니다.
        </p>

        <h4 class="closing-flag-subtitle">차단 항목 (마감 자체를 막음)</h4>
        <div class="closing-flag-list">
          ${le.map(e=>z(e,t[e.key],!0)).join(``)}
        </div>

        <h4 class="closing-flag-subtitle">경고 항목 (마감 시 확인 모달만 표시)</h4>
        <div class="closing-flag-list">
          ${ue.map(e=>z(e,t[e.key],!0)).join(``)}
        </div>
        `,Ce(t);break}case 3:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${Me(t)}
        `,Ne();break}case 4:{let t=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">생산지시서 복사 시 카테고리 출력 순서입니다.</p>
          ${fe(t,!0)}
        `,be(!0);break}case 5:{let[t,n]=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">레시피에 적힌 원료명을 실제로 통합합니다. 오늘 이후 생산 카드의 원료명도 함께 갱신되고, 과거 기록은 보존됩니다.</p>
          ${me(t,!0)}
        `,I(t,n,!0);break}case 6:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          생산/재고 계산에 쓰이는 기준값입니다. 변경 시 이후 계산부터 적용됩니다.
        </p>
        <div class="system-value-list">
          ${T.map(e=>we(e,t[e.key],!0)).join(``)}
        </div>
        `,Te(t);break}case 7:{let t=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">원육 단가를 원/kg 기준 effectiveDate 이력으로 관리합니다.</p>
          ${_e(t,!0)}
        `,ve(t,!0);break}}r=!0}catch(t){e.isConnected&&(i.innerHTML=`<p>자료를 불러오지 못했습니다.</p><button class="btn-secondary">다시 시도</button>`,i.querySelector(`button`).addEventListener(`click`,a)),console.error(`[설정 영역 로드]`,t)}finally{n=!1}}}e.addEventListener(`toggle`,a)})}function P(e){let t=Array.isArray(e)?e.filter(e=>A.includes(e)):[],n=A.filter(e=>!t.includes(e));return[...t,...n]}async function de(e={getDoc:t,getDocs:a}){try{let t=await e.getDoc(n(c,`settings`,`copySheetOrder`));return t.exists()?P(t.data().order):[...A]}catch(t){if(e.displayOwner)throw t;return console.warn(`[settings] copySheetOrder load failed:`,t),[...A]}}function fe(e,t){return`
    <ul id="copySheetOrderList" class="copy-sheet-order-list sortable-master-list">
      ${P(e).map(e=>`
        <li class="copy-sheet-order-item" data-key="${e}">
          ${t?`<span class="drag-handle">≡</span>`:``}
          <span>${ce[e]||e}</span>
        </li>
      `).join(``)}
    </ul>
  `}function F(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}async function pe(e={getDoc:t,getDocs:a}){let n=await e.getDocs(s(c,`recipes`)),r=new Map;return n.docs.forEach(e=>{let t={id:e.id,...e.data()};(t.ingredients||[]).forEach(e=>{let n=(e.name||``).trim();if(!n)return;r.has(n)||r.set(n,{name:n,recipes:[],activeCount:0,inactiveCount:0});let i=r.get(n);if(i.recipes.some(e=>e.id===t.id))return;let a=t.status===`inactive`||t.active===!1;i.recipes.push({id:t.id,name:t.name||t.recipeName||`(이름 없음)`,inactive:a}),a?i.inactiveCount+=1:i.activeCount+=1})}),[...r.values()].sort((e,t)=>e.name.localeCompare(t.name,`ko-KR`))}function me(e,t){if(!e.length)return`<div class="cal-modal-empty">등록된 원료명이 없습니다.</div>`;let n=t?``:`disabled`;return`
    <div class="ingredient-merge-list" style="display:flex;flex-direction:column;gap:6px;">
      ${e.map(e=>`
        <details class="ingredient-merge-row" style="border:1px solid #eee;border-radius:6px;background:#fff;">
          <summary style="display:grid;grid-template-columns:28px 1fr 80px 90px 48px;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;font-size:13px;">
            <input type="checkbox" class="ingredient-merge-checkbox" data-name="${F(e.name)}" ${n}>
            <span style="font-weight:600;">${F(e.name)}</span>
            <span style="color:#555;text-align:right;">${e.recipes.length}개 레시피</span>
            <span style="color:${e.inactiveCount?`#b7791f`:`#999`};font-size:12px;">${e.inactiveCount?`비활성 포함`:``}</span>
            <button class="btn-secondary ingredient-rename-btn" data-name="${F(e.name)}"
              style="font-size:11px;padding:2px 8px;" ${n}>수정</button>
          </summary>
          <div style="padding:0 10px 10px 46px;color:#666;font-size:12px;line-height:1.7;">
            ${e.recipes.map(e=>`${F(e.name)}${e.inactive?` (비활성)`:``}`).join(`<br>`)}
          </div>
        </details>
      `).join(``)}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <button class="btn-primary" id="btnMergeIngredientNames" ${n} disabled>선택 통합</button>
    </div>
    ${t?``:`<p class="staff-empty">읽기 전용입니다. 통합은 대표/사무 계정에서 가능합니다.</p>`}
  `}function he(e){let t=[];Object.values(e||{}).forEach(e=>{(e||[]).forEach(e=>{let n=(e?.name||``).trim();n&&!t.includes(n)&&t.push(n)})});let n=p?.email||p?.uid||``;return n&&!t.includes(n)&&t.push(n),t}function I(e,t,n){let r=[...document.querySelectorAll(`.ingredient-merge-checkbox`)],i=document.getElementById(`btnMergeIngredientNames`);i&&(r.forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,()=>{i.disabled=!n||r.filter(e=>e.checked).length===0})}),n&&(document.querySelectorAll(`.ingredient-rename-btn`).forEach(n=>{n.addEventListener(`click`,r=>{r.stopPropagation(),r.preventDefault();let i=n.dataset.name;i&&L([i],e,t)})}),i.addEventListener(`click`,()=>{let n=r.filter(e=>e.checked).map(e=>e.dataset.name).filter(Boolean);n.length!==0&&L(n,e,t)})))}function L(e,t,n){let r=document.getElementById(`ingredientNameMergeModal`);r&&r.remove();let i=e.length===1,a=he(n).map(e=>`<option value="${F(e)}">${F(e)}</option>`).join(``),o=e.map(e=>`<li>${F(e)}</li>`).join(``),s=document.createElement(`div`);s.className=`modal-overlay`,s.id=`ingredientNameMergeModal`,s.innerHTML=`
    <div class="modal-box" style="width:520px;">
      <h3 class="modal-title">${i?`원료명 수정`:`원료 명칭 통합`}</h3>
      <p style="font-size:13px;color:#555;margin:0 0 10px;line-height:1.6;">${i?`이 원료명을 새 이름으로 변경합니다.`:`선택한 원료명을 새 이름 하나로 통합합니다.`} 오늘 이후 생산 카드의 원료명도 함께 갱신됩니다. 과거 기록은 보존됩니다.</p>
      <div style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">
        <div style="font-weight:600;margin-bottom:6px;">선택 원료명</div>
        <ul style="margin:0;padding-left:18px;">${o}</ul>
      </div>
      <div class="form-group">
        <label>새 원료명 *</label>
        <input type="text" id="ingredientMergeToName" value="${F(e[0]||``)}" />
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
  `,document.body.appendChild(s);let c=()=>s.remove();s.querySelector(`#ingredientMergeCancel`).addEventListener(`click`,c),s.addEventListener(`click`,e=>{e.target===s&&c()}),s.querySelector(`#ingredientMergeConfirm`).addEventListener(`click`,async()=>{let t=s.querySelector(`#ingredientMergeToName`).value.trim(),n=s.querySelector(`#ingredientMergeStaff`).value||p?.email||p?.uid||``;if(!t){alert(`새 원료명을 입력해주세요.`);return}await R(e,t,n,c)})}async function R(t,r,i,a){return b(Z,async o=>{let{getDocs:l,writeBatch:u,recordActivity:f}=x(o),p=new Set(t);try{let o=await l(s(c,`recipes`)),m=[],h=[];if(o.docs.forEach(e=>{let t={id:e.id,...e.data()},n=t.ingredients||[],i=n.filter(e=>p.has((e.name||``).trim())).length,a=n.some(e=>{let t=(e.name||``).trim();return t===r&&!p.has(t)});i>1||i===1&&a?h.push(t.name||t.recipeName||t.id):i===1&&m.push({doc:e,recipe:t,ingredients:n})}),h.length>0){alert(`한 레시피에 통합 대상 원료가 2개 이상 있어 중복 원료가 생깁니다.\n레시피에서 먼저 정리해주세요.\n\n${h.join(`
`)}`);return}let g=[];m.forEach(t=>{let i=t.ingredients.map(e=>p.has((e.name||``).trim())?{...e,name:r}:e);g.push({ref:n(c,`recipes`,t.doc.id),data:{ingredients:i,updatedAt:e()}})});let _=d(),v=await l(s(c,`productions`)),y=[];if(v.docs.forEach(t=>{let i=t.data();if(!i.date||i.date<_||i.status===`deleted`)return;let a=i.ingredientsSnapshot||[],o=!1,s=a.map(e=>p.has((e.name||``).trim())?(o=!0,{...e,name:r}):e);o&&(y.push(t.id),g.push({ref:n(c,`productions`,t.id),data:{ingredientsSnapshot:s,updatedAt:e()}}))}),g.length===0){alert(`변경할 레시피나 생산 카드가 없습니다.`);return}for(let e=0;e<g.length;e+=M){let t=u(c);g.slice(e,e+M).forEach(e=>{t.update(e.ref,e.data)}),await t.commit()}await f({date:d(),action:`recipe`,subAction:`ingredientRename`,staff:i,message:`원료 명칭 ${t.length>1?`통합`:`수정`} — [${t.join(`, `)}] → ${r} (레시피 ${m.length}건, 생산 ${y.length}건 동기화) / 담당: ${i}`,details:{fromNames:t,toName:r,recipeIds:m.map(e=>e.doc.id),productionIds:y}}),a?.(),await N()}catch(e){console.error(`[settings] ingredient name merge failed:`,e),alert(`원료 명칭 통합 실패: `+e.message)}},{roles:[`admin`,`office`]})}function ge(e){return typeof e==`number`?`${e.toLocaleString(`ko-KR`)}원/kg`:`-`}function _e(e,t){return e.length?`
    <div class="meat-price-list">
      ${e.map(e=>{let n=e.meatType,r=e.latest;return`
          <div class="closing-flag-row meat-price-row" data-meat-id="${n.id}">
            <div class="closing-flag-meta">
              <div class="closing-flag-label">${F(n.name)}</div>
              <div class="closing-flag-desc">현재 적용일: ${F(r?.effectiveDate||`-`)}</div>
            </div>
            <div class="meat-price-current">${ge(r?.unitPrice)}</div>
            ${t?`<button class="btn-secondary btn-edit-meat-price" data-meat-id="${n.id}">수정</button>`:``}
          </div>
        `}).join(``)}
    </div>
  `:`<div class="cal-modal-empty">활성 원육 없음</div>`}function ve(e,t){t&&document.querySelectorAll(`.btn-edit-meat-price`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.meatType.id===t.dataset.meatId);n&&ye(n)})})}function ye(t){let n=t.meatType,r=t.latest,i=d(),a=document.createElement(`div`);a.className=`modal-overlay`,a.innerHTML=`
    <div class="modal-box">
      <h3 class="modal-title">원료 단가 수정</h3>
      <div class="modal-form">
        <label class="modal-field">
          <span>원료명</span>
          <input class="cell-input" value="${F(n.name)}" readonly>
        </label>
        <label class="modal-field">
          <span>새 단가 (원/kg)</span>
          <input class="cell-input" id="meatPriceUnitPrice" type="number" min="0" step="1" value="${r?.unitPrice??``}">
        </label>
        <label class="modal-field">
          <span>적용일</span>
          <input class="cell-input" id="meatPriceEffectiveDate" type="date" value="${i}">
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
  `,document.body.appendChild(a);let o=()=>a.remove();a.querySelector(`#meatPriceCancel`).addEventListener(`click`,o),a.addEventListener(`click`,e=>{e.target===a&&o()}),a.querySelector(`#meatPriceSave`).addEventListener(`click`,async()=>b(Z,async t=>{let{getDocs:r,addDoc:i}=x(t),l=Number(a.querySelector(`#meatPriceUnitPrice`).value),u=a.querySelector(`#meatPriceEffectiveDate`).value,f=a.querySelector(`#meatPriceReason`).value.trim()||`manual`;if(!Number.isFinite(l)||l<0){alert(`0 이상의 단가를 입력해주세요.`);return}if(!u){alert(`적용일을 입력해주세요.`);return}try{let a=D((await r(s(c,`meatTypes`,n.id,`priceHistory`))).docs.map(e=>({id:e.id,...e.data()})),u);await O(n.id,{unitPrice:l,effectiveDate:u,prevUnitPrice:a?.unitPrice??null,reason:f,createdBy:p?.email||p?.uid||``},x(t)),await i(s(c,`activityLogs`),{date:d(),timestamp:e(),action:`meatPrice`,subAction:`manualEdit`,details:{meatTypeId:n.id,meatTypeName:n.name||``,prevUnitPrice:a?.unitPrice??null,newUnitPrice:l,effectiveDate:u},staffName:p?.email||p?.uid||``,acknowledged:!1}),o(),await N()}catch(e){console.error(`[settings] meat price save failed:`,e),alert(`원료 단가 저장 실패: `+e.message)}},{roles:[`admin`,`office`]}))}function be(e){if(j&&=(j.destroy(),null),!e)return;let t=document.getElementById(`copySheetOrderList`);t&&(j=ee.create(t,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await xe()}}))}async function xe(){return b(Z,async t=>{let{setDoc:r}=x(t),i=document.getElementById(`copySheetOrderList`);if(!i)return;let a=Array.from(i.querySelectorAll(`.copy-sheet-order-item`)).map(e=>e.dataset.key).filter(e=>A.includes(e));try{await r(n(c,`settings`,`copySheetOrder`),{order:P(a),updatedAt:e(),updatedBy:p?.uid||null})}catch(e){console.error(`[settings] copySheetOrder save failed:`,e),alert(`카테고리 순서 저장 실패: `+e.message),await N()}},{roles:[`admin`,`office`]})}async function Se(e={getDoc:t,getDocs:a}){try{let t=await e.getDoc(n(c,`settings`,`closingFlags`));return t.exists()?{...S,...t.data()}:{...S}}catch(t){if(e.displayOwner)throw t;return console.warn(`[settings] closingFlags load failed:`,t),{...S}}}function z(e,t,n){let r=t===!1?``:`checked`,i=n?``:`disabled`;return`
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
  `}function Ce(t){document.querySelectorAll(`.closing-flag-list input[type="checkbox"]`).forEach(r=>{r.addEventListener(`change`,async r=>b(Z,async i=>{let{addDoc:a,setDoc:o}=x(i),l=r.target.dataset.flagKey,u=t[l]!==!1,f=r.target.checked;try{await k(i,`settings/closingFlags`,l,u,S),await o(n(c,`settings`,`closingFlags`),{[l]:f},{merge:!0}),t[l]=f,await a(s(c,`activityLogs`),{date:d(),timestamp:e(),action:`settings`,subAction:`closingFlagToggle`,details:{flagKey:l,before:u,after:f},staffName:p?.email||p?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] closingFlags save failed:`,e),alert(`저장 실패: `+e.message),r.target.checked=u}},{roles:[`admin`,`office`]}))})}function we(e,t,n){let r=n?``:`disabled`,i;if(e.type===`fraction`){let n=t||{numerator:0,denominator:1};i=`
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
  `}function Te(e){document.querySelectorAll(`.system-value-input`).forEach(t=>{t.addEventListener(`blur`,async t=>{let n=t.target.dataset.valueKey,r=T.find(e=>e.key===n);r&&(r.type===`fraction`?await De(t.target,r,e):await Ee(t.target,r,e))})})}async function Ee(e,t,r){return b(Z,async i=>{let{setDoc:a}=x(i),o=t.key,s=r[o],l=t.type===`decimal`?parseFloat(e.value):parseInt(e.value,10);if(isNaN(l)||l<0){alert(`0 이상의 숫자를 입력해주세요.`),e.value=s;return}if(l!==s)try{await k(i,`settings/systemValues`,o,s,C),await a(n(c,`settings`,`systemValues`),{[o]:l},{merge:!0}),r[o]=l,await B(o,s,l,i)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function De(e,t,r){return b(Z,async e=>{let{setDoc:i}=x(e),a=t.key,o=r[a]||{numerator:0,denominator:1},s=document.querySelector(`.system-value-input[data-value-key="${a}"][data-frac-part="numerator"]`),l=document.querySelector(`.system-value-input[data-value-key="${a}"][data-frac-part="denominator"]`),u=parseInt(s.value,10),d=parseInt(l.value,10);if(isNaN(u)||u<0){alert(`분자는 0 이상의 정수여야 합니다.`),s.value=o.numerator;return}if(isNaN(d)||d<1){alert(`분모는 1 이상의 정수여야 합니다.`),l.value=o.denominator;return}let f={numerator:u,denominator:d};if(!(f.numerator===o.numerator&&f.denominator===o.denominator))try{await k(e,`settings/systemValues`,a,o,C),await i(n(c,`settings`,`systemValues`),{[a]:f},{merge:!0}),r[a]=f,await B(a,o,f,e)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function B(t,n,r,i){let{addDoc:a}=x(i);await a(s(c,`activityLogs`),{date:d(),timestamp:e(),action:`settings`,subAction:`systemValueChange`,details:{valueKey:t,before:n,after:r},staffName:p?.email||p?.uid||``,acknowledged:!1})}function Oe(e,t=[],n){let r=n?``:`disabled`,i=Array.isArray(t)?t:[];return`
    <div class="closing-flag-row menu-staff-group-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${e.label}</div>
        <div class="closing-flag-desc">담당자 드롭다운에 표시할 그룹</div>
      </div>
      <div class="menu-staff-group-options" data-menu-key="${e.key}">
        ${w.map(t=>`
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
  `}function ke(t){document.querySelectorAll(`.menu-staff-group-checkbox`).forEach(r=>{r.addEventListener(`change`,async r=>b(Z,async i=>{let{addDoc:a,setDoc:o}=x(i),l=r.target.dataset.menuKey,u=r.target.dataset.groupKey,f=Array.isArray(t[l])?[...t[l]]:[],m=new Set(f);r.target.checked?m.add(u):m.delete(u);let h=w.filter(e=>m.has(e));if(h.length===0){alert(`담당자 그룹은 최소 1개 이상 선택해야 합니다.`),r.target.checked=!0;return}if(!Ae(f,h))try{await k(i,`settings/menuStaffGroups`,l,f,oe),await o(n(c,`settings`,`menuStaffGroups`),{[l]:h},{merge:!0}),t[l]=h,await a(s(c,`activityLogs`),{date:d(),timestamp:e(),action:`settings`,subAction:`menuStaffGroupChange`,details:{menuKey:l,before:f,after:h},staffName:p?.email||p?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] menuStaffGroups save failed:`,e),alert(`저장 실패: `+e.message),r.target.checked=f.includes(u)}},{roles:[`admin`,`office`]}))})}function Ae(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}async function V(e={getDoc:t,getDocs:a}){let r={senior:[],lead:[],office:[]};return await Promise.all(Object.keys(r).map(async t=>{let i=await e.getDoc(n(c,`staffGroups`,t));i.exists()&&(r[t]=i.data().members||[])})),r}function H(e,t,n,r=!1){return`
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
  `}function U(e){document.querySelectorAll(`.btn-add-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=await v({title:`담당자 추가`,label:`담당자 이름`,placeholder:`예: 홍길동`,required:!0});if(r===null||!r||!r.trim())return;let i=[...e[n],{id:Date.now().toString(),name:r.trim(),active:!0,sortOrder:e[n].length}];await W(n,i,e[n])&&(e[n]=i,G(e))})}),document.querySelectorAll(`.btn-del-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=parseInt(t.dataset.index,10);if(!await h({title:`담당자 삭제`,message:`담당자를 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))return;let i=e[n].filter((e,t)=>t!==r);await W(n,i,e[n])&&(e[n]=i,G(e))})})}async function W(e,t,r){return b(Z,async i=>{let{getDoc:a,setDoc:o}=x(i),s=await i.getDoc(n(c,`staffGroups`,e));if(m(s.exists()&&s.data().members||[])!==m(r))throw Error(`담당자 목록이 변경되었습니다. 다시 불러와주세요.`);return await o(n(c,`staffGroups`,e),{name:{senior:`선임`,lead:`주임`,office:`사무`}[e],sortOrder:[`senior`,`lead`,`office`].indexOf(e),members:t,updatedAt:new Date}),i.isCurrent()},{roles:[`admin`,`office`]})}function G(e){let t=u===`admin`||u===`office`;document.getElementById(`staffList-senior`).innerHTML=K(`senior`,e.senior,t),document.getElementById(`staffList-lead`).innerHTML=K(`lead`,e.lead,t),document.getElementById(`staffList-office`).innerHTML=K(`office`,e.office,t),t&&U(e)}function K(e,t,n=!1){return t.map((t,r)=>`
    <div class="staff-item" data-group="${e}" data-index="${r}">
      <span>${t.name}</span>
      ${n?`<button class="btn-del-staff" data-group="${e}" data-index="${r}">삭제</button>`:``}
    </div>
  `).join(``)||`<p class="staff-empty">담당자 없음</p>`}async function je(e={getDoc:t,getDocs:a}){let n=(await e.getDocs(s(c,`holidays`))).docs.map(e=>q(e.id,e.data())).filter(e=>e.status!==`deleted`);return n.sort((e,t)=>t.id.localeCompare(e.id)),n}function q(e,t={}){let n=t.title||t.label||t.name||``;return{id:e,date:t.date||e,title:n,label:t.label||n,description:t.description||``,holidayType:t.holidayType||(t.isAutoGenerated?`publicHoliday`:`internalOff`),affectsProduction:t.affectsProduction===void 0?!0:t.affectsProduction===!0,affectsShipping:t.affectsShipping===void 0?!0:t.affectsShipping===!0,shippingClosedFromEnabled:t.shippingClosedFromEnabled===void 0?!0:t.shippingClosedFromEnabled===!0,isAutoGenerated:t.isAutoGenerated===!0,recurrenceRule:t.recurrenceRule||null,status:t.status||`active`}}function Me(e){let t=u===`admin`||u===`office`,n=`${l.startYear}~${l.endYear}`;return(t?`
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
    `)}function Ne(){let e=document.getElementById(`btnImportPublicHolidays`);e&&e.addEventListener(`click`,Pe);let t=document.getElementById(`btnAddHoliday`);t&&t.addEventListener(`click`,J),document.querySelectorAll(`.btn-del-holiday`).forEach(e=>{e.addEventListener(`click`,()=>Ie(e.dataset.id))}),document.querySelectorAll(`.btn-edit-holiday`).forEach(e=>{e.addEventListener(`click`,()=>Fe(e.dataset.id))})}async function J(){return b(Z,async t=>{let{getDoc:r,setDoc:i}=x(t),a=document.getElementById(`hd_start`),o=document.getElementById(`hd_end`),s=document.getElementById(`hd_label`),l=document.getElementById(`hd_desc`),u=document.getElementById(`hd_affectsProduction`),d=document.getElementById(`hd_affectsShipping`),f=document.getElementById(`hd_shippingAvailablePrev`),m=a.value,h=o.value||m,g=s.value.trim(),_=l.value.trim();if(!m){alert(`시작일을 선택해주세요.`),a.focus();return}if(h<m){alert(`종료일은 시작일 이후여야 합니다.`),o.focus();return}if(!g){alert(`휴무일명을 입력해주세요.`),s.focus();return}let v=Le(m,h);try{let a=0,o=0;for(let t of v){let s=n(c,`holidays`,t);if((await r(s)).exists()){o+=1;continue}await i(s,{date:t,holidayType:`internalOff`,title:g,label:g,description:_,affectsProduction:u.checked,affectsShipping:d.checked,shippingClosedFromEnabled:!f.checked,isAutoGenerated:!1,recurrenceRule:null,status:`active`,createdAt:e(),createdBy:p?.uid||null,updatedAt:e(),updatedBy:p?.uid||null}),a+=1}if(await X(`create`,{startDate:m,endDate:h,title:g,created:a,skipped:o,total:v.length},t),await y(),a===0&&o>0){alert(`등록된 날짜가 없습니다. 선택한 ${o}개 날짜가 이미 등록되어 있습니다.`);return}alert(`회사 휴무일 등록 완료: ${a}건${o?` / 기존 항목 건너뜀 ${o}건`:``}`),await N()}catch(e){console.error(e),alert(`등록 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function Pe(){return b(Z,async t=>{let{getDoc:r,setDoc:i}=x(t),a=f();if(await h({title:`한국 공휴일 자동 등록`,message:`${l.startYear}~${l.endYear}년 한국 공휴일 ${a.length}건을 등록합니다.\n이미 등록된 날짜는 덮어쓰지 않습니다.`,confirmText:`등록`}))try{let o=0,s=0;for(let t of a){let a=n(c,`holidays`,t.date),l=await r(a);if(l.exists()&&l.data().status!==`deleted`){s+=1;continue}await i(a,{...t,label:t.title,status:`active`,createdAt:e(),createdBy:p?.uid||null,updatedAt:e(),updatedBy:p?.uid||null}),o+=1}await X(`autoImport`,{startYear:l.startYear,endYear:l.endYear,created:o,skipped:s,total:a.length},t),await y(),alert(`한국 공휴일 자동 등록 완료: 신규 ${o}건 / 기존 유지 ${s}건`),await N()}catch(e){console.error(e),alert(`자동 등록 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function Fe(t){return b(Z,async r=>{let{getDoc:i,setDoc:a}=x(r),o=await i(n(c,`holidays`,t));if(!o.exists()){alert(`휴일 정보를 찾을 수 없습니다.`);return}let s=q(t,o.data()),l=await v({title:`휴일명 수정`,label:`휴일명`,defaultValue:s.title||s.label||``,required:!0});if(l===null)return;let u=await v({title:`메모 수정`,label:`메모`,defaultValue:s.description||``,required:!1,multiline:!0});if(u===null)return;let d=await h({title:`생산 영향`,message:`${t}에 생산하지 않음으로 설정할까요?`,confirmText:`생산 안 함`,cancelText:`생산 가능`}),f=await h({title:`배송 영향`,message:`${t}에 배송하지 않음으로 설정할까요?`,confirmText:`배송 안 함`,cancelText:`배송 가능`}),m=await h({title:`전날 배송`,message:`${t} 전날 배송 가능으로 설정할까요?`,confirmText:`전날 배송 가능`,cancelText:`전날 배송 불가`}),g={title:l,label:l,description:u,affectsProduction:d,affectsShipping:f,shippingClosedFromEnabled:!m,updatedAt:e(),updatedBy:p?.uid||null};try{await a(n(c,`holidays`,t),g,{merge:!0}),await X(`edit`,{date:t,before:Y(s),after:{title:l,description:u,affectsProduction:d,affectsShipping:f,shippingClosedFromEnabled:!m}},r),await y(),alert(`휴일 수정 완료!`),await N()}catch(e){console.error(e),alert(`수정 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function Ie(t){return b(Z,async r=>{let{getDoc:i,setDoc:a}=x(r),o=await i(n(c,`holidays`,t)),s=o.exists()?q(t,o.data()):{id:t};if(await h({title:s.isAutoGenerated?`자동 공휴일 비활성`:`회사 휴무일 삭제`,message:`${t} ${s.isAutoGenerated?`자동 공휴일을 비활성 처리`:`회사 휴무일을 삭제 처리`}하시겠습니까?`,confirmText:s.isAutoGenerated?`비활성`:`삭제`,danger:!0}))try{await a(n(c,`holidays`,t),{date:t,status:`deleted`,updatedAt:e(),updatedBy:p?.uid||null,deletedAt:e(),deletedBy:p?.uid||null},{merge:!0}),await X(`delete`,{date:t,holiday:Y(s),mode:s.isAutoGenerated?`disableAutoGenerated`:`softDelete`},r),await y(),alert(s.isAutoGenerated?`자동 공휴일 비활성 완료!`:`회사 휴무일 삭제 완료!`),await N()}catch(e){console.error(e),alert(`삭제 실패: `+e.message)}},{roles:[`admin`,`office`]})}function Le(e,t){let n=[],r=new Date(`${e}T00:00:00+09:00`),i=new Date(`${t}T00:00:00+09:00`);for(let e=0;e<370&&r<=i;e+=1){let e=new Date(r.getTime()+540*60*1e3);n.push(e.toISOString().slice(0,10)),r=new Date(r.getTime()+1440*60*1e3)}return n}function Y(e){return{date:e.date||e.id,title:e.title||e.label||``,holidayType:e.holidayType||``,affectsProduction:e.affectsProduction,affectsShipping:e.affectsShipping,shippingClosedFromEnabled:e.shippingClosedFromEnabled,isAutoGenerated:e.isAutoGenerated===!0,status:e.status||`active`}}async function X(t,n,r){let{addDoc:i}=x(r);await i(s(c,`activityLogs`),{date:d(),timestamp:e(),action:`holiday`,subAction:t,details:n,staffName:p?.email||p?.uid||``,acknowledged:!1})}var Z=_(`settings`),Q=Z.prepare?Array.from({length:8},(e,t)=>g(`settings/section/`+t)):[];if(Q.length){let e=Z.invalidate.bind(Z);Z.invalidate=()=>{e(),Q.forEach(e=>e.invalidate())}}function $(e,t){return[V,ne,Se,je,de,e=>Promise.all([pe(e),V(e)]),re,e=>se(d(),e)][e](t)}async function Re({cacheOnly:e=!0}={}){for(let t=0;t<Q.length;t++)try{await Q[t].prepare(`default`,e=>$(t,e),{cacheOnly:e})}catch(e){if(e.code!==`cache-miss`)throw e}}export{Re as preparePage,N as renderSettings};