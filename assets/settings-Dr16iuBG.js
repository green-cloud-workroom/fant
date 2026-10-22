import{T as e,a as t,b as n,s as r,y as i}from"./index.esm-CWp5uCwe.js";import{n as a}from"./firebase-Bm8Fqw4J.js";import{n as o,r as s}from"./modal-IG9zwovL.js";import{B as c,G as l,L as u,V as d,W as f,f as p,m,x as h,z as g}from"./index-DoGo6-SM.js";import"./activityLogs-B3oMJE13.js";import{t as _}from"./sortable-Cm6zC-6h.js";import{t as v}from"./pageRefresh-_7GHvL_Z.js";import{t as y}from"./pageCommand-DqOn3nvX.js";import{t as b}from"./commandWrites-Cpe6tnvE.js";import{t as x}from"./closingChecksLogic-B3ksH7J9.js";import{a as ee,c as S,i as te,n as ne,o as C,r as w,s as T,t as re}from"./menuStaffGroups-C6jNaMpk.js";async function E(e,t,r,i,o={}){let s=await e.getDoc(n(a,t)),c={...o,...s.exists()?s.data():{}}[r];if(h(c)!==h(i))throw Error(`다른 작업으로 설정이 변경되었습니다. 입력을 보존하고 최신 자료를 다시 확인해주세요.`)}var D=[`rawCat`,`rawDog`,`freezeCat`,`freezeDog`,`freezeCommon`],ie={rawCat:`생식 - 고양이`,rawDog:`생식 - 강아지`,freezeCat:`동결건조 - 고양이`,freezeDog:`동결건조 - 강아지`,freezeCommon:`동결건조 - 공용`},O=null,k=450,ae=[{key:`blockTomorrowProd`,label:`내일생산불러오기 미완료 시 마감 차단`,desc:`다음 영업일 생산이 있는데 내일생산불러오기를 안 했으면 차단`},{key:`blockFrozenOrder`,label:`동결건조 발주 미확인 시 마감 차단`,desc:`오늘 등록된 발주 행이 확인/취소되지 않으면 차단`},{key:`blockScheduleDue`,label:`입고예정 미처리 시 마감 차단`,desc:`오늘 도착 예정 입고가 완료/취소 처리되지 않으면 차단`},{key:`blockAutoRepack`,label:`자동 재포장 미확인 시 마감 차단`,desc:`자동 재포장 trigger/diff 로그가 확인되지 않으면 차단`},{key:`blockProdLog`,label:`생산 로그 미확인 시 마감 차단`,desc:`생산 카테고리 로그 (생산/재포장/전처리 등) 미확인 시 차단`},{key:`blockOfficeLog`,label:`사무 로그 미확인 시 마감 차단`,desc:`사무 카테고리 로그 (봉투/계란/원육/입고예정 등) 미확인 시 차단`},{key:`blockEggOut`,label:`계란 출고 미입력 시 마감 차단`,desc:`노른자 사용 생산이 있는데 계란 출고가 입력되지 않으면 차단`},{key:`blockProductReceipt`,label:`생식 제품입고 미완료 → 마감 차단`,desc:`생식 생산 카드 중 제품입고가 완료되지 않은 항목이 있으면 차단`}],oe=[{key:`warnNoTomorrowProd`,label:`내일 생산 입력 없을 시 마감 경고`,desc:`다음 영업일 생산이 0건이면 마감 시 확인 모달`},{key:`warnBagMin`,label:`봉투 최소재고 미달 시 마감 경고`,desc:`봉투 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnMeatMin`,label:`원육 최소재고 미달 시 마감 경고`,desc:`원육 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnSupplementMin`,label:`영양제 최소재고 미달 시 마감 경고`,desc:`영양제 SKU 중 5봉 미만이 있으면 마감 시 확인 모달 (임계값 추후 변경 가능)`}];async function A(){if(![`admin`,`office`].includes(l)||!await Z.load(async()=>({}),{force:!0}))return;let e=document.getElementById(`mainContent`);e.innerHTML=`<div class="settings-wrap"><h2 class="settings-title">설정</h2>`+[`담당자 관리`,`메뉴별 담당자 그룹`,`마감 차단/경고 설정`,`공휴일 관리`,`생산지시서 카테고리 순서`,`원료 명칭 통합`,`시스템 설정값`].map(e=>`<details class="settings-section"><summary class="settings-section-summary"><span class="settings-section-title">`+e+`</span><span class="settings-section-toggle">펼치기</span></summary><div class="settings-section-body"></div></details>`).join(``)+`</div>`,e.querySelectorAll(`.settings-section`).forEach((e,t)=>{let n=!1,r=!1,i=e.querySelector(`.settings-section-body`);async function a(o={}){if(!(!e.open||n||r)){n=!0,i.textContent=`불러오는 중…`;try{let n=Q[t],s=n?await n.load(e=>$(t,e),{force:o.force===!0,onChange:v(n,async e=>{r=!1,await a(e)},{draftSelector:`.settings-section-body`})}):await $(t);if(!e.isConnected||n&&s==null)return;switch(t){case 0:{let t=s;if(!e.isConnected)return;i.innerHTML=`
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
          ${ne.map(e=>_e(e,t[e.key],!0)).join(``)}
        </div>
        `,ve(t);break}case 2:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          ON인 항목만 마감 시 차단/경고로 동작합니다. OFF로 두면 해당 항목을 무시하고 마감 가능합니다.
        </p>

        <h4 class="closing-flag-subtitle">차단 항목 (마감 자체를 막음)</h4>
        <div class="closing-flag-list">
          ${ae.map(e=>I(e,t[e.key],!0)).join(``)}
        </div>

        <h4 class="closing-flag-subtitle">경고 항목 (마감 시 확인 모달만 표시)</h4>
        <div class="closing-flag-list">
          ${oe.map(e=>I(e,t[e.key],!0)).join(``)}
        </div>
        `,L(t);break}case 3:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${xe(t)}
        `,Se();break}case 4:{let t=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">생산지시서 복사 시 카테고리 출력 순서입니다.</p>
          ${ce(t,!0)}
        `,me(!0);break}case 5:{let[t,n]=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">레시피에 적힌 원료명을 실제로 통합합니다. 오늘 이후 생산 카드의 원료명도 함께 갱신되고, 과거 기록은 보존됩니다.</p>
          ${ue(t,!0)}
        `,fe(t,n,!0);break}case 6:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          생산/재고 계산에 쓰이는 기준값입니다. 변경 시 이후 계산부터 적용됩니다.
        </p>
        <div class="system-value-list">
          ${T.map(e=>R(e,t[e.key],!0)).join(``)}
        </div>
        `,z(t);break}}r=!0}catch(t){e.isConnected&&(i.innerHTML=`<p>자료를 불러오지 못했습니다.</p><button class="btn-secondary">다시 시도</button>`,i.querySelector(`button`).addEventListener(`click`,a)),console.error(`[설정 영역 로드]`,t)}finally{n=!1}}}e.addEventListener(`toggle`,a)})}function j(e){let t=Array.isArray(e)?e.filter(e=>D.includes(e)):[],n=D.filter(e=>!t.includes(e));return[...t,...n]}async function se(e={getDoc:t,getDocs:r}){try{let t=await e.getDoc(n(a,`settings`,`copySheetOrder`));return t.exists()?j(t.data().order):[...D]}catch(t){if(e.displayOwner)throw t;return console.warn(`[settings] copySheetOrder load failed:`,t),[...D]}}function ce(e,t){return`
    <ul id="copySheetOrderList" class="copy-sheet-order-list sortable-master-list">
      ${j(e).map(e=>`
        <li class="copy-sheet-order-item" data-key="${e}">
          ${t?`<span class="drag-handle">≡</span>`:``}
          <span>${ie[e]||e}</span>
        </li>
      `).join(``)}
    </ul>
  `}function M(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}async function le(e={getDoc:t,getDocs:r}){let n=await e.getDocs(i(a,`recipes`)),o=new Map;return n.docs.forEach(e=>{let t={id:e.id,...e.data()};(t.ingredients||[]).forEach(e=>{let n=(e.name||``).trim();if(!n)return;o.has(n)||o.set(n,{name:n,recipes:[],activeCount:0,inactiveCount:0});let r=o.get(n);if(r.recipes.some(e=>e.id===t.id))return;let i=t.status===`inactive`||t.active===!1;r.recipes.push({id:t.id,name:t.name||t.recipeName||`(이름 없음)`,inactive:i}),i?r.inactiveCount+=1:r.activeCount+=1})}),[...o.values()].sort((e,t)=>e.name.localeCompare(t.name,`ko-KR`))}function ue(e,t){if(!e.length)return`<div class="cal-modal-empty">등록된 원료명이 없습니다.</div>`;let n=t?``:`disabled`;return`
    <div class="ingredient-merge-list" style="display:flex;flex-direction:column;gap:6px;">
      ${e.map(e=>`
        <details class="ingredient-merge-row" style="border:1px solid #eee;border-radius:6px;background:#fff;">
          <summary style="display:grid;grid-template-columns:28px 1fr 80px 90px 48px;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;font-size:13px;">
            <input type="checkbox" class="ingredient-merge-checkbox" data-name="${M(e.name)}" ${n}>
            <span style="font-weight:600;">${M(e.name)}</span>
            <span style="color:#555;text-align:right;">${e.recipes.length}개 레시피</span>
            <span style="color:${e.inactiveCount?`#b7791f`:`#999`};font-size:12px;">${e.inactiveCount?`비활성 포함`:``}</span>
            <button class="btn-secondary ingredient-rename-btn" data-name="${M(e.name)}"
              style="font-size:11px;padding:2px 8px;" ${n}>수정</button>
          </summary>
          <div style="padding:0 10px 10px 46px;color:#666;font-size:12px;line-height:1.7;">
            ${e.recipes.map(e=>`${M(e.name)}${e.inactive?` (비활성)`:``}`).join(`<br>`)}
          </div>
        </details>
      `).join(``)}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <button class="btn-primary" id="btnMergeIngredientNames" ${n} disabled>선택 통합</button>
    </div>
    ${t?``:`<p class="staff-empty">읽기 전용입니다. 통합은 대표/사무 계정에서 가능합니다.</p>`}
  `}function de(e){let t=[];Object.values(e||{}).forEach(e=>{(e||[]).forEach(e=>{let n=(e?.name||``).trim();n&&!t.includes(n)&&t.push(n)})});let n=f?.email||f?.uid||``;return n&&!t.includes(n)&&t.push(n),t}function fe(e,t,n){let r=[...document.querySelectorAll(`.ingredient-merge-checkbox`)],i=document.getElementById(`btnMergeIngredientNames`);i&&(r.forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,()=>{i.disabled=!n||r.filter(e=>e.checked).length===0})}),n&&(document.querySelectorAll(`.ingredient-rename-btn`).forEach(n=>{n.addEventListener(`click`,r=>{r.stopPropagation(),r.preventDefault();let i=n.dataset.name;i&&N([i],e,t)})}),i.addEventListener(`click`,()=>{let n=r.filter(e=>e.checked).map(e=>e.dataset.name).filter(Boolean);n.length!==0&&N(n,e,t)})))}function N(e,t,n){let r=document.getElementById(`ingredientNameMergeModal`);r&&r.remove();let i=e.length===1,a=de(n).map(e=>`<option value="${M(e)}">${M(e)}</option>`).join(``),o=e.map(e=>`<li>${M(e)}</li>`).join(``),s=document.createElement(`div`);s.className=`modal-overlay`,s.id=`ingredientNameMergeModal`,s.innerHTML=`
    <div class="modal-box" style="width:520px;">
      <h3 class="modal-title">${i?`원료명 수정`:`원료 명칭 통합`}</h3>
      <p style="font-size:13px;color:#555;margin:0 0 10px;line-height:1.6;">${i?`이 원료명을 새 이름으로 변경합니다.`:`선택한 원료명을 새 이름 하나로 통합합니다.`} 오늘 이후 생산 카드의 원료명도 함께 갱신됩니다. 과거 기록은 보존됩니다.</p>
      <div style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">
        <div style="font-weight:600;margin-bottom:6px;">선택 원료명</div>
        <ul style="margin:0;padding-left:18px;">${o}</ul>
      </div>
      <div class="form-group">
        <label>새 원료명 *</label>
        <input type="text" id="ingredientMergeToName" value="${M(e[0]||``)}" />
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
  `,document.body.appendChild(s);let c=()=>s.remove();s.querySelector(`#ingredientMergeCancel`).addEventListener(`click`,c),s.addEventListener(`click`,e=>{e.target===s&&c()}),s.querySelector(`#ingredientMergeConfirm`).addEventListener(`click`,async()=>{let t=s.querySelector(`#ingredientMergeToName`).value.trim(),n=s.querySelector(`#ingredientMergeStaff`).value||f?.email||f?.uid||``;if(!t){alert(`새 원료명을 입력해주세요.`);return}await pe(e,t,n,c)})}async function pe(t,r,o,s){return y(Z,async c=>{let{getDocs:l,writeBatch:d,recordActivity:f}=b(c),p=new Set(t);try{let c=await l(i(a,`recipes`)),m=[],h=[];if(c.docs.forEach(e=>{let t={id:e.id,...e.data()},n=t.ingredients||[],i=n.filter(e=>p.has((e.name||``).trim())).length,a=n.some(e=>{let t=(e.name||``).trim();return t===r&&!p.has(t)});i>1||i===1&&a?h.push(t.name||t.recipeName||t.id):i===1&&m.push({doc:e,recipe:t,ingredients:n})}),h.length>0){alert(`한 레시피에 통합 대상 원료가 2개 이상 있어 중복 원료가 생깁니다.\n레시피에서 먼저 정리해주세요.\n\n${h.join(`
`)}`);return}let g=[];m.forEach(t=>{let i=t.ingredients.map(e=>p.has((e.name||``).trim())?{...e,name:r}:e);g.push({ref:n(a,`recipes`,t.doc.id),data:{ingredients:i,updatedAt:e()}})});let _=u(),v=await l(i(a,`productions`)),y=[];if(v.docs.forEach(t=>{let i=t.data();if(!i.date||i.date<_||i.status===`deleted`)return;let o=i.ingredientsSnapshot||[],s=!1,c=o.map(e=>p.has((e.name||``).trim())?(s=!0,{...e,name:r}):e);s&&(y.push(t.id),g.push({ref:n(a,`productions`,t.id),data:{ingredientsSnapshot:c,updatedAt:e()}}))}),g.length===0){alert(`변경할 레시피나 생산 카드가 없습니다.`);return}for(let e=0;e<g.length;e+=k){let t=d(a);g.slice(e,e+k).forEach(e=>{t.update(e.ref,e.data)}),await t.commit()}await f({date:u(),action:`recipe`,subAction:`ingredientRename`,staff:o,message:`원료 명칭 ${t.length>1?`통합`:`수정`} — [${t.join(`, `)}] → ${r} (레시피 ${m.length}건, 생산 ${y.length}건 동기화) / 담당: ${o}`,details:{fromNames:t,toName:r,recipeIds:m.map(e=>e.doc.id),productionIds:y}}),s?.(),await A()}catch(e){console.error(`[settings] ingredient name merge failed:`,e),alert(`원료 명칭 통합 실패: `+e.message)}},{roles:[`admin`,`office`]})}function me(e){if(O&&=(O.destroy(),null),!e)return;let t=document.getElementById(`copySheetOrderList`);t&&(O=_.create(t,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await P()}}))}async function P(){return y(Z,async t=>{let{setDoc:r}=b(t),i=document.getElementById(`copySheetOrderList`);if(!i)return;let o=Array.from(i.querySelectorAll(`.copy-sheet-order-item`)).map(e=>e.dataset.key).filter(e=>D.includes(e));try{await r(n(a,`settings`,`copySheetOrder`),{order:j(o),updatedAt:e(),updatedBy:f?.uid||null})}catch(e){console.error(`[settings] copySheetOrder save failed:`,e),alert(`카테고리 순서 저장 실패: `+e.message),await A()}},{roles:[`admin`,`office`]})}async function F(e={getDoc:t,getDocs:r}){try{let t=await e.getDoc(n(a,`settings`,`closingFlags`));return t.exists()?{...x,...t.data()}:{...x}}catch(t){if(e.displayOwner)throw t;return console.warn(`[settings] closingFlags load failed:`,t),{...x}}}function I(e,t,n){let r=t===!1?``:`checked`,i=n?``:`disabled`;return`
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
  `}function L(t){document.querySelectorAll(`.closing-flag-list input[type="checkbox"]`).forEach(r=>{r.addEventListener(`change`,async r=>y(Z,async o=>{let{addDoc:s,setDoc:c}=b(o),l=r.target.dataset.flagKey,d=t[l]!==!1,p=r.target.checked;try{await E(o,`settings/closingFlags`,l,d,x),await c(n(a,`settings`,`closingFlags`),{[l]:p},{merge:!0}),t[l]=p,await s(i(a,`activityLogs`),{date:u(),timestamp:e(),action:`settings`,subAction:`closingFlagToggle`,details:{flagKey:l,before:d,after:p},staffName:f?.email||f?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] closingFlags save failed:`,e),alert(`저장 실패: `+e.message),r.target.checked=d}},{roles:[`admin`,`office`]}))})}function R(e,t,n){let r=n?``:`disabled`,i;if(e.type===`fraction`){let n=t||{numerator:0,denominator:1};i=`
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
  `}function z(e){document.querySelectorAll(`.system-value-input`).forEach(t=>{t.addEventListener(`blur`,async t=>{let n=t.target.dataset.valueKey,r=T.find(e=>e.key===n);r&&(r.type===`fraction`?await ge(t.target,r,e):await he(t.target,r,e))})})}async function he(e,t,r){return y(Z,async i=>{let{setDoc:o}=b(i),s=t.key,c=r[s],l=t.type===`decimal`?parseFloat(e.value):parseInt(e.value,10);if(isNaN(l)||l<0){alert(`0 이상의 숫자를 입력해주세요.`),e.value=c;return}if(l!==c)try{await E(i,`settings/systemValues`,s,c,C),await o(n(a,`settings`,`systemValues`),{[s]:l},{merge:!0}),r[s]=l,await B(s,c,l,i)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function ge(e,t,r){return y(Z,async e=>{let{setDoc:i}=b(e),o=t.key,s=r[o]||{numerator:0,denominator:1},c=document.querySelector(`.system-value-input[data-value-key="${o}"][data-frac-part="numerator"]`),l=document.querySelector(`.system-value-input[data-value-key="${o}"][data-frac-part="denominator"]`),u=parseInt(c.value,10),d=parseInt(l.value,10);if(isNaN(u)||u<0){alert(`분자는 0 이상의 정수여야 합니다.`),c.value=s.numerator;return}if(isNaN(d)||d<1){alert(`분모는 1 이상의 정수여야 합니다.`),l.value=s.denominator;return}let f={numerator:u,denominator:d};if(!(f.numerator===s.numerator&&f.denominator===s.denominator))try{await E(e,`settings/systemValues`,o,s,C),await i(n(a,`settings`,`systemValues`),{[o]:f},{merge:!0}),r[o]=f,await B(o,s,f,e)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function B(t,n,r,o){let{addDoc:s}=b(o);await s(i(a,`activityLogs`),{date:u(),timestamp:e(),action:`settings`,subAction:`systemValueChange`,details:{valueKey:t,before:n,after:r},staffName:f?.email||f?.uid||``,acknowledged:!1})}function _e(e,t=[],n){let r=n?``:`disabled`,i=Array.isArray(t)?t:[];return`
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
            <span>${te[t]}</span>
          </label>
        `).join(``)}
      </div>
    </div>
  `}function ve(t){document.querySelectorAll(`.menu-staff-group-checkbox`).forEach(r=>{r.addEventListener(`change`,async r=>y(Z,async o=>{let{addDoc:s,setDoc:c}=b(o),l=r.target.dataset.menuKey,d=r.target.dataset.groupKey,p=Array.isArray(t[l])?[...t[l]]:[],m=new Set(p);r.target.checked?m.add(d):m.delete(d);let h=w.filter(e=>m.has(e));if(h.length===0){alert(`담당자 그룹은 최소 1개 이상 선택해야 합니다.`),r.target.checked=!0;return}if(!ye(p,h))try{await E(o,`settings/menuStaffGroups`,l,p,re),await c(n(a,`settings`,`menuStaffGroups`),{[l]:h},{merge:!0}),t[l]=h,await s(i(a,`activityLogs`),{date:u(),timestamp:e(),action:`settings`,subAction:`menuStaffGroupChange`,details:{menuKey:l,before:p,after:h},staffName:f?.email||f?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] menuStaffGroups save failed:`,e),alert(`저장 실패: `+e.message),r.target.checked=p.includes(d)}},{roles:[`admin`,`office`]}))})}function ye(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}async function V(e={getDoc:t,getDocs:r}){let i={senior:[],lead:[],office:[]};return await Promise.all(Object.keys(i).map(async t=>{let r=await e.getDoc(n(a,`staffGroups`,t));r.exists()&&(i[t]=r.data().members||[])})),i}function H(e,t,n,r=!1){return`
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
  `}function U(e){document.querySelectorAll(`.btn-add-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=await s({title:`담당자 추가`,label:`담당자 이름`,placeholder:`예: 홍길동`,required:!0});if(r===null||!r||!r.trim())return;let i=[...e[n],{id:Date.now().toString(),name:r.trim(),active:!0,sortOrder:e[n].length}];await W(n,i,e[n])&&(e[n]=i,G(e))})}),document.querySelectorAll(`.btn-del-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=parseInt(t.dataset.index,10);if(!await o({title:`담당자 삭제`,message:`담당자를 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))return;let i=e[n].filter((e,t)=>t!==r);await W(n,i,e[n])&&(e[n]=i,G(e))})})}async function W(e,t,r){return y(Z,async i=>{let{getDoc:o,setDoc:s}=b(i),c=await i.getDoc(n(a,`staffGroups`,e));if(h(c.exists()&&c.data().members||[])!==h(r))throw Error(`담당자 목록이 변경되었습니다. 다시 불러와주세요.`);return await s(n(a,`staffGroups`,e),{name:{senior:`선임`,lead:`주임`,office:`사무`}[e],sortOrder:[`senior`,`lead`,`office`].indexOf(e),members:t,updatedAt:new Date}),i.isCurrent()},{roles:[`admin`,`office`]})}function G(e){let t=l===`admin`||l===`office`;document.getElementById(`staffList-senior`).innerHTML=K(`senior`,e.senior,t),document.getElementById(`staffList-lead`).innerHTML=K(`lead`,e.lead,t),document.getElementById(`staffList-office`).innerHTML=K(`office`,e.office,t),t&&U(e)}function K(e,t,n=!1){return t.map((t,r)=>`
    <div class="staff-item" data-group="${e}" data-index="${r}">
      <span>${t.name}</span>
      ${n?`<button class="btn-del-staff" data-group="${e}" data-index="${r}">삭제</button>`:``}
    </div>
  `).join(``)||`<p class="staff-empty">담당자 없음</p>`}async function be(e={getDoc:t,getDocs:r}){let n=(await e.getDocs(i(a,`holidays`))).docs.map(e=>q(e.id,e.data())).filter(e=>e.status!==`deleted`);return n.sort((e,t)=>t.id.localeCompare(e.id)),n}function q(e,t={}){let n=t.title||t.label||t.name||``;return{id:e,date:t.date||e,title:n,label:t.label||n,description:t.description||``,holidayType:t.holidayType||(t.isAutoGenerated?`publicHoliday`:`internalOff`),affectsProduction:t.affectsProduction===void 0?!0:t.affectsProduction===!0,affectsShipping:t.affectsShipping===void 0?!0:t.affectsShipping===!0,shippingClosedFromEnabled:t.shippingClosedFromEnabled===void 0?!0:t.shippingClosedFromEnabled===!0,isAutoGenerated:t.isAutoGenerated===!0,recurrenceRule:t.recurrenceRule||null,status:t.status||`active`}}function xe(e){let t=l===`admin`||l===`office`,n=`${c.startYear}~${c.endYear}`;return(t?`
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
    `)}function Se(){let e=document.getElementById(`btnImportPublicHolidays`);e&&e.addEventListener(`click`,we);let t=document.getElementById(`btnAddHoliday`);t&&t.addEventListener(`click`,Ce),document.querySelectorAll(`.btn-del-holiday`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.id))}),document.querySelectorAll(`.btn-edit-holiday`).forEach(e=>{e.addEventListener(`click`,()=>Te(e.dataset.id))})}async function Ce(){return y(Z,async t=>{let{getDoc:r,setDoc:i}=b(t),o=document.getElementById(`hd_start`),s=document.getElementById(`hd_end`),c=document.getElementById(`hd_label`),l=document.getElementById(`hd_desc`),u=document.getElementById(`hd_affectsProduction`),d=document.getElementById(`hd_affectsShipping`),p=document.getElementById(`hd_shippingAvailablePrev`),m=o.value,h=s.value||m,_=c.value.trim(),v=l.value.trim();if(!m){alert(`시작일을 선택해주세요.`),o.focus();return}if(h<m){alert(`종료일은 시작일 이후여야 합니다.`),s.focus();return}if(!_){alert(`휴무일명을 입력해주세요.`),c.focus();return}let y=Ee(m,h);try{let o=0,s=0;for(let t of y){let c=n(a,`holidays`,t);if((await r(c)).exists()){s+=1;continue}await i(c,{date:t,holidayType:`internalOff`,title:_,label:_,description:v,affectsProduction:u.checked,affectsShipping:d.checked,shippingClosedFromEnabled:!p.checked,isAutoGenerated:!1,recurrenceRule:null,status:`active`,createdAt:e(),createdBy:f?.uid||null,updatedAt:e(),updatedBy:f?.uid||null}),o+=1}if(await X(`create`,{startDate:m,endDate:h,title:_,created:o,skipped:s,total:y.length},t),await g(),o===0&&s>0){alert(`등록된 날짜가 없습니다. 선택한 ${s}개 날짜가 이미 등록되어 있습니다.`);return}alert(`회사 휴무일 등록 완료: ${o}건${s?` / 기존 항목 건너뜀 ${s}건`:``}`),await A()}catch(e){console.error(e),alert(`등록 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function we(){return y(Z,async t=>{let{getDoc:r,setDoc:i}=b(t),s=d();if(await o({title:`한국 공휴일 자동 등록`,message:`${c.startYear}~${c.endYear}년 한국 공휴일 ${s.length}건을 등록합니다.\n이미 등록된 날짜는 덮어쓰지 않습니다.`,confirmText:`등록`}))try{let o=0,l=0;for(let t of s){let s=n(a,`holidays`,t.date),c=await r(s);if(c.exists()&&c.data().status!==`deleted`){l+=1;continue}await i(s,{...t,label:t.title,status:`active`,createdAt:e(),createdBy:f?.uid||null,updatedAt:e(),updatedBy:f?.uid||null}),o+=1}await X(`autoImport`,{startYear:c.startYear,endYear:c.endYear,created:o,skipped:l,total:s.length},t),await g(),alert(`한국 공휴일 자동 등록 완료: 신규 ${o}건 / 기존 유지 ${l}건`),await A()}catch(e){console.error(e),alert(`자동 등록 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function Te(t){return y(Z,async r=>{let{getDoc:i,setDoc:c}=b(r),l=await i(n(a,`holidays`,t));if(!l.exists()){alert(`휴일 정보를 찾을 수 없습니다.`);return}let u=q(t,l.data()),d=await s({title:`휴일명 수정`,label:`휴일명`,defaultValue:u.title||u.label||``,required:!0});if(d===null)return;let p=await s({title:`메모 수정`,label:`메모`,defaultValue:u.description||``,required:!1,multiline:!0});if(p===null)return;let m=await o({title:`생산 영향`,message:`${t}에 생산하지 않음으로 설정할까요?`,confirmText:`생산 안 함`,cancelText:`생산 가능`}),h=await o({title:`배송 영향`,message:`${t}에 배송하지 않음으로 설정할까요?`,confirmText:`배송 안 함`,cancelText:`배송 가능`}),_=await o({title:`전날 배송`,message:`${t} 전날 배송 가능으로 설정할까요?`,confirmText:`전날 배송 가능`,cancelText:`전날 배송 불가`}),v={title:d,label:d,description:p,affectsProduction:m,affectsShipping:h,shippingClosedFromEnabled:!_,updatedAt:e(),updatedBy:f?.uid||null};try{await c(n(a,`holidays`,t),v,{merge:!0}),await X(`edit`,{date:t,before:Y(u),after:{title:d,description:p,affectsProduction:m,affectsShipping:h,shippingClosedFromEnabled:!_}},r),await g(),alert(`휴일 수정 완료!`),await A()}catch(e){console.error(e),alert(`수정 실패: `+e.message)}},{roles:[`admin`,`office`]})}async function J(t){return y(Z,async r=>{let{getDoc:i,setDoc:s}=b(r),c=await i(n(a,`holidays`,t)),l=c.exists()?q(t,c.data()):{id:t};if(await o({title:l.isAutoGenerated?`자동 공휴일 비활성`:`회사 휴무일 삭제`,message:`${t} ${l.isAutoGenerated?`자동 공휴일을 비활성 처리`:`회사 휴무일을 삭제 처리`}하시겠습니까?`,confirmText:l.isAutoGenerated?`비활성`:`삭제`,danger:!0}))try{await s(n(a,`holidays`,t),{date:t,status:`deleted`,updatedAt:e(),updatedBy:f?.uid||null,deletedAt:e(),deletedBy:f?.uid||null},{merge:!0}),await X(`delete`,{date:t,holiday:Y(l),mode:l.isAutoGenerated?`disableAutoGenerated`:`softDelete`},r),await g(),alert(l.isAutoGenerated?`자동 공휴일 비활성 완료!`:`회사 휴무일 삭제 완료!`),await A()}catch(e){console.error(e),alert(`삭제 실패: `+e.message)}},{roles:[`admin`,`office`]})}function Ee(e,t){let n=[],r=new Date(`${e}T00:00:00+09:00`),i=new Date(`${t}T00:00:00+09:00`);for(let e=0;e<370&&r<=i;e+=1){let e=new Date(r.getTime()+540*60*1e3);n.push(e.toISOString().slice(0,10)),r=new Date(r.getTime()+1440*60*1e3)}return n}function Y(e){return{date:e.date||e.id,title:e.title||e.label||``,holidayType:e.holidayType||``,affectsProduction:e.affectsProduction,affectsShipping:e.affectsShipping,shippingClosedFromEnabled:e.shippingClosedFromEnabled,isAutoGenerated:e.isAutoGenerated===!0,status:e.status||`active`}}async function X(t,n,r){let{addDoc:o}=b(r);await o(i(a,`activityLogs`),{date:u(),timestamp:e(),action:`holiday`,subAction:t,details:n,staffName:f?.email||f?.uid||``,acknowledged:!1})}var Z=p(`settings`),Q=Z.prepare?Array.from({length:7},(e,t)=>m(`settings/section/`+t)):[];if(Q.length){let e=Z.invalidate.bind(Z);Z.invalidate=()=>{e(),Q.forEach(e=>e.invalidate())}}function $(e,t){return[V,ee,F,be,se,e=>Promise.all([le(e),V(e)]),S][e](t)}async function De({cacheOnly:e=!0}={}){for(let t=0;t<Q.length;t++)try{await Q[t].prepare(`default`,e=>$(t,e),{cacheOnly:e})}catch(e){if(e.code!==`cache-miss`)throw e}}export{De as preparePage,A as renderSettings};