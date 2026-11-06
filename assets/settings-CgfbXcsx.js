import{T as e,a as t,b as n,s as r,y as i}from"./index.esm-D8prxbkJ.js";import{n as a}from"./firebase-BOShkvR0.js";import{i as o}from"./staffText-DBRrEFyl.js";import{n as s,r as c}from"./modal-5yNlUCJi.js";import{O as l,a as u,at as d,b as f,it as p,lt as m,n as h,ot as g,tt as _,ut as v,v as y}from"./index-TLO2tC01.js";import{t as b}from"./sortable-fSutADEa.js";import{t as ee}from"./pageRefresh-Cgv25mcB.js";import{t as x}from"./pageCommand-i-P3fgNt.js";import{t as S}from"./commandWrites-bBvXK-bw.js";import{t as C}from"./closingChecksLogic-DxgeAf4w.js";import{a as te,c as ne,i as re,n as w,o as T,r as E,s as D,t as ie}from"./menuStaffGroups-DjYkTlmf.js";async function O(e,t,r,i,o={}){let s=await e.getDoc(n(a,t)),c={...o,...s.exists()?s.data():{}}[r];if(l(c)!==l(i))throw Error(`다른 작업으로 설정이 변경되었습니다. 입력을 보존하고 최신 자료를 다시 확인해주세요.`)}var k=[`rawCat`,`rawDog`,`freezeCat`,`freezeDog`,`freezeCommon`],ae={rawCat:`생식 - 고양이`,rawDog:`생식 - 강아지`,freezeCat:`동결건조 - 고양이`,freezeDog:`동결건조 - 강아지`,freezeCommon:`동결건조 - 공용`},A=null,j=450,oe=[{key:`blockTomorrowProd`,label:`내일생산불러오기 미완료 시 마감 차단`,desc:`다음 영업일 생산이 있는데 내일생산불러오기를 안 했으면 차단`},{key:`blockFrozenOrder`,label:`동결건조 발주 미확인 시 마감 차단`,desc:`오늘 등록된 발주 행이 확인/취소되지 않으면 차단`},{key:`blockScheduleDue`,label:`입고예정 미처리 시 마감 차단`,desc:`오늘 도착 예정 입고가 완료/취소 처리되지 않으면 차단`},{key:`blockAutoRepack`,label:`자동 재포장 미확인 시 마감 차단`,desc:`자동 재포장 trigger/diff 로그가 확인되지 않으면 차단`},{key:`blockProdLog`,label:`생산 로그 미확인 시 마감 차단`,desc:`생산 카테고리 로그 (생산/재포장/전처리 등) 미확인 시 차단`},{key:`blockOfficeLog`,label:`사무 로그 미확인 시 마감 차단`,desc:`사무 카테고리 로그 (봉투/계란/원육/입고예정 등) 미확인 시 차단`},{key:`blockEggOut`,label:`계란 출고 미입력 시 마감 차단`,desc:`노른자 사용 생산이 있는데 계란 출고가 입력되지 않으면 차단`},{key:`blockProductReceipt`,label:`생식 제품입고 미완료 → 마감 차단`,desc:`생식 생산 카드 중 제품입고가 완료되지 않은 항목이 있으면 차단`}],se=[{key:`warnNoTomorrowProd`,label:`내일 생산 입력 없을 시 마감 경고`,desc:`다음 영업일 생산이 0건이면 마감 시 확인 모달`},{key:`warnBagMin`,label:`봉투 최소재고 미달 시 마감 경고`,desc:`봉투 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnMeatMin`,label:`원육 최소재고 미달 시 마감 경고`,desc:`원육 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달`},{key:`warnSupplementMin`,label:`영양제 최소재고 미달 시 마감 경고`,desc:`영양제 SKU 중 5봉 미만이 있으면 마감 시 확인 모달 (임계값 추후 변경 가능)`}];async function M(){if(![`admin`,`office`].includes(v)||!await Z.load(async()=>({}),{force:!0}))return;let e=document.getElementById(`mainContent`);e.innerHTML=`<div class="settings-wrap"><h2 class="settings-title">설정</h2>`+[`담당자 관리`,`메뉴별 담당자 그룹`,`마감 차단/경고 설정`,`공휴일 관리`,`생산지시서 카테고리 순서`,`원료 명칭 통합`,`시스템 설정값`].map(e=>`<details class="settings-section"><summary class="settings-section-summary"><span class="settings-section-title">`+e+`</span><span class="settings-section-toggle">펼치기</span></summary><div class="settings-section-body"></div></details>`).join(``)+`</div>`,e.querySelectorAll(`.settings-section`).forEach((e,t)=>{let n=!1,r=!1,i=e.querySelector(`.settings-section-body`);async function a(o={}){if(!(!e.open||n||r)){n=!0,i.textContent=`불러오는 중…`;try{let n=Q[t],s=n?await n.load(e=>$(t,e),{force:o.force===!0,onChange:ee(n,async e=>{r=!1,await a(e)},{draftSelector:`.settings-section-body`})}):await $(t);if(!e.isConnected||n&&s==null)return;switch(t){case 0:{let t=s;if(!e.isConnected)return;i.innerHTML=`
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
          ${w.map(e=>ye(e,t[e.key],!0)).join(``)}
        </div>
        `,be(t);break}case 2:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          ON인 항목만 마감 시 차단/경고로 동작합니다. OFF로 두면 해당 항목을 무시하고 마감 가능합니다.
        </p>

        <h4 class="closing-flag-subtitle">차단 항목 (마감 자체를 막음)</h4>
        <div class="closing-flag-list">
          ${oe.map(e=>R(e,t[e.key],!0)).join(``)}
        </div>

        <h4 class="closing-flag-subtitle">경고 항목 (마감 시 확인 모달만 표시)</h4>
        <div class="closing-flag-list">
          ${se.map(e=>R(e,t[e.key],!0)).join(``)}
        </div>
        `,z(t);break}case 3:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${Ce(t)}
        `,we();break}case 4:{let t=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">생산지시서 복사 시 카테고리 출력 순서입니다.</p>
          ${le(t,!0)}
        `,F(!0);break}case 5:{let[t,n]=s;if(!e.isConnected)return;i.innerHTML=`
          <p class="settings-section-desc">레시피에 적힌 원료명을 실제로 통합합니다. 오늘 이후 생산 카드의 원료명도 함께 갱신되고, 과거 기록은 보존됩니다.</p>
          ${de(t,!0)}
        `,pe(t,n,!0);break}case 6:{let t=s;if(!e.isConnected)return;i.innerHTML=`
        <p class="settings-section-desc">
          생산/재고 계산에 쓰이는 기준값입니다. 변경 시 이후 계산부터 적용됩니다.
        </p>
        <div class="system-value-list">
          ${D.map(e=>he(e,t[e.key],!0)).join(``)}
        </div>
        `,ge(t);break}}r=!0}catch(t){e.isConnected&&(i.innerHTML=`<p>자료를 불러오지 못했습니다.</p><button class="btn-secondary">다시 시도</button>`,i.querySelector(`button`).addEventListener(`click`,a)),console.error(`[설정 영역 로드]`,t)}finally{n=!1}}}e.addEventListener(`toggle`,a)})}function N(e){let t=Array.isArray(e)?e.filter(e=>k.includes(e)):[],n=k.filter(e=>!t.includes(e));return[...t,...n]}async function ce(e={getDoc:t,getDocs:r}){try{let t=await e.getDoc(n(a,`settings`,`copySheetOrder`));return t.exists()?N(t.data().order):[...k]}catch(t){if(e.displayOwner)throw t;return console.warn(`[settings] copySheetOrder load failed:`,t),[...k]}}function le(e,t){return`
    <ul id="copySheetOrderList" class="copy-sheet-order-list sortable-master-list">
      ${N(e).map(e=>`
        <li class="copy-sheet-order-item" data-key="${e}">
          ${t?`<span class="drag-handle">≡</span>`:``}
          <span>${ae[e]||e}</span>
        </li>
      `).join(``)}
    </ul>
  `}async function ue(e={getDoc:t,getDocs:r}){let n=await e.getDocs(i(a,`recipes`)),o=new Map;return n.docs.forEach(e=>{let t={id:e.id,...e.data()};(t.ingredients||[]).forEach(e=>{let n=(e.name||``).trim();if(!n)return;o.has(n)||o.set(n,{name:n,recipes:[],activeCount:0,inactiveCount:0});let r=o.get(n);if(r.recipes.some(e=>e.id===t.id))return;let i=t.status===`inactive`||t.active===!1;r.recipes.push({id:t.id,name:t.name||t.recipeName||`(이름 없음)`,inactive:i}),i?r.inactiveCount+=1:r.activeCount+=1})}),[...o.values()].sort((e,t)=>e.name.localeCompare(t.name,`ko-KR`))}function de(e,t){if(!e.length)return`<div class="cal-modal-empty">등록된 원료명이 없습니다.</div>`;let n=t?``:`disabled`;return`
    <div class="ingredient-merge-list" style="display:flex;flex-direction:column;gap:6px;">
      ${e.map(e=>`
        <details class="ingredient-merge-row" style="border:1px solid #eee;border-radius:6px;background:#fff;">
          <summary style="display:grid;grid-template-columns:28px 1fr 80px 90px 48px;gap:8px;align-items:center;padding:8px 10px;cursor:pointer;font-size:13px;">
            <input type="checkbox" class="ingredient-merge-checkbox" data-name="${h(e.name)}" ${n}>
            <span style="font-weight:600;">${h(e.name)}</span>
            <span style="color:#555;text-align:right;">${e.recipes.length}개 레시피</span>
            <span style="color:${e.inactiveCount?`#b7791f`:`#999`};font-size:12px;">${e.inactiveCount?`비활성 포함`:``}</span>
            <button class="btn-secondary ingredient-rename-btn" data-name="${h(e.name)}"
              style="font-size:11px;padding:2px 8px;" ${n}>수정</button>
          </summary>
          <div style="padding:0 10px 10px 46px;color:#666;font-size:12px;line-height:1.7;">
            ${e.recipes.map(e=>`${h(e.name)}${e.inactive?` (비활성)`:``}`).join(`<br>`)}
          </div>
        </details>
      `).join(``)}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <button class="btn-primary" id="btnMergeIngredientNames" ${n} disabled>선택 통합</button>
    </div>
    ${t?``:`<p class="staff-empty">읽기 전용입니다. 통합은 대표/사무 계정에서 가능합니다.</p>`}
  `}function fe(e){let t=[];Object.values(e||{}).forEach(e=>{(e||[]).forEach(e=>{let n=(e?.name||``).trim();n&&!t.includes(n)&&t.push(n)})});let n=m?.email||m?.uid||``;return n&&!t.includes(n)&&t.push(n),t}function pe(e,t,n){let r=[...document.querySelectorAll(`.ingredient-merge-checkbox`)],i=document.getElementById(`btnMergeIngredientNames`);i&&(r.forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,()=>{i.disabled=!n||r.filter(e=>e.checked).length===0})}),n&&(document.querySelectorAll(`.ingredient-rename-btn`).forEach(n=>{n.addEventListener(`click`,r=>{r.stopPropagation(),r.preventDefault();let i=n.dataset.name;i&&P([i],e,t)})}),i.addEventListener(`click`,()=>{let n=r.filter(e=>e.checked).map(e=>e.dataset.name).filter(Boolean);n.length!==0&&P(n,e,t)})))}function P(e,t,n){let r=document.getElementById(`ingredientNameMergeModal`);r&&r.remove();let i=e.length===1,a=fe(n).map(e=>`<option value="${h(e)}">${h(e)}</option>`).join(``),o=e.map(e=>`<li>${h(e)}</li>`).join(``),s=document.createElement(`div`);s.className=`modal-overlay`,s.id=`ingredientNameMergeModal`,s.innerHTML=`
    <div class="modal-box" style="width:520px;">
      <h3 class="modal-title">${i?`원료명 수정`:`원료 명칭 통합`}</h3>
      <p style="font-size:13px;color:#555;margin:0 0 10px;line-height:1.6;">${i?`이 원료명을 새 이름으로 변경합니다.`:`선택한 원료명을 새 이름 하나로 통합합니다.`} 오늘 이후 생산 카드의 원료명도 함께 갱신됩니다. 과거 기록은 보존됩니다.</p>
      <div style="background:#f8f8f8;border:1px solid #eee;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">
        <div style="font-weight:600;margin-bottom:6px;">선택 원료명</div>
        <ul style="margin:0;padding-left:18px;">${o}</ul>
      </div>
      <div class="form-group">
        <label>새 원료명 *</label>
        <input type="text" id="ingredientMergeToName" value="${h(e[0]||``)}" />
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
  `,document.body.appendChild(s);let c=()=>s.remove();s.querySelector(`#ingredientMergeCancel`).addEventListener(`click`,c),s.addEventListener(`click`,e=>{e.target===s&&c()}),s.querySelector(`#ingredientMergeConfirm`).addEventListener(`click`,async()=>{let t=s.querySelector(`#ingredientMergeToName`).value.trim(),n=s.querySelector(`#ingredientMergeStaff`).value||m?.email||m?.uid||``;if(!t){alert(`새 원료명을 입력해주세요.`);return}await me(e,t,n,c)})}async function me(t,r,s,c){return x(Z,async l=>{let{getDocs:d,writeBatch:f,recordActivity:p}=S(l),m=new Set(t);try{let o=await d(i(a,`recipes`)),l=[],h=[];if(o.docs.forEach(e=>{let t={id:e.id,...e.data()},n=t.ingredients||[],i=n.filter(e=>m.has((e.name||``).trim())).length,a=n.some(e=>{let t=(e.name||``).trim();return t===r&&!m.has(t)});i>1||i===1&&a?h.push(t.name||t.recipeName||t.id):i===1&&l.push({doc:e,recipe:t,ingredients:n})}),h.length>0){alert(`한 레시피에 통합 대상 원료가 2개 이상 있어 중복 원료가 생깁니다.\n레시피에서 먼저 정리해주세요.\n\n${h.join(`
`)}`);return}let g=[];l.forEach(t=>{let i=t.ingredients.map(e=>m.has((e.name||``).trim())?{...e,name:r}:e);g.push({ref:n(a,`recipes`,t.doc.id),data:{ingredients:i,updatedAt:e()}})});let v=_(),y=await d(i(a,`productions`)),b=[];if(y.docs.forEach(t=>{let i=t.data();if(!i.date||i.date<v||i.status===`deleted`)return;let o=i.ingredientsSnapshot||[],s=!1,c=o.map(e=>m.has((e.name||``).trim())?(s=!0,{...e,name:r}):e);s&&(b.push(t.id),g.push({ref:n(a,`productions`,t.id),data:{mutationToken:u(),ingredientsSnapshot:c,updatedAt:e()}}))}),g.length===0){alert(`변경할 레시피나 생산 카드가 없습니다.`);return}for(let e=0;e<g.length;e+=j){let t=f(a);g.slice(e,e+j).forEach(e=>{t.update(e.ref,e.data)}),await t.commit()}await p({date:_(),action:`recipe`,subAction:`ingredientRename`,staff:s,message:`원료 명칭 ${t.length>1?`통합`:`수정`} — [${t.join(`, `)}] → ${r} (레시피 ${l.length}건, 생산 ${b.length}건 동기화) / 담당: ${s}`,details:{fromNames:t,toName:r,recipeIds:l.map(e=>e.doc.id),productionIds:b}}),c?.(),await M()}catch(e){console.error(`[settings] ingredient name merge failed:`,e),alert(`원료 명칭 통합 실패: `+o(e))}},{roles:[`admin`,`office`]})}function F(e){if(A&&=(A.destroy(),null),!e)return;let t=document.getElementById(`copySheetOrderList`);t&&(A=b.create(t,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await I()}}))}async function I(){return x(Z,async t=>{let{setDoc:r}=S(t),i=document.getElementById(`copySheetOrderList`);if(!i)return;let s=Array.from(i.querySelectorAll(`.copy-sheet-order-item`)).map(e=>e.dataset.key).filter(e=>k.includes(e));try{await r(n(a,`settings`,`copySheetOrder`),{order:N(s),updatedAt:e(),updatedBy:m?.uid||null})}catch(e){console.error(`[settings] copySheetOrder save failed:`,e),alert(`카테고리 순서 저장 실패: `+o(e)),await M()}},{roles:[`admin`,`office`]})}async function L(e={getDoc:t,getDocs:r}){try{let t=await e.getDoc(n(a,`settings`,`closingFlags`));return t.exists()?{...C,...t.data()}:{...C}}catch(t){if(e.displayOwner)throw t;return console.warn(`[settings] closingFlags load failed:`,t),{...C}}}function R(e,t,n){let r=t===!1?``:`checked`,i=n?``:`disabled`;return`
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
  `}function z(t){document.querySelectorAll(`.closing-flag-list input[type="checkbox"]`).forEach(r=>{r.addEventListener(`change`,async r=>x(Z,async s=>{let{addDoc:c,setDoc:l}=S(s),u=r.target.dataset.flagKey,d=t[u]!==!1,f=r.target.checked;try{await O(s,`settings/closingFlags`,u,d,C),await l(n(a,`settings`,`closingFlags`),{[u]:f},{merge:!0}),t[u]=f,await c(i(a,`activityLogs`),{date:_(),timestamp:e(),action:`settings`,subAction:`closingFlagToggle`,details:{flagKey:u,before:d,after:f},staffName:m?.email||m?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] closingFlags save failed:`,e),alert(`저장 실패: `+o(e)),r.target.checked=d}},{roles:[`admin`,`office`]}))})}function he(e,t,n){let r=n?``:`disabled`,i;if(e.type===`fraction`){let n=t||{numerator:0,denominator:1};i=`
      <div class="system-value-fraction">
        <input type="number" class="system-value-input system-value-input-frac"
          data-value-key="${e.key}" data-frac-part="numerator"
          value="${h(n.numerator)}" step="1" min="0" ${r}>
        <span class="system-value-frac-sep">/</span>
        <input type="number" class="system-value-input system-value-input-frac"
          data-value-key="${e.key}" data-frac-part="denominator"
          value="${h(n.denominator)}" step="1" min="1" ${r}>
      </div>
    `}else{let n=e.type===`decimal`?`0.1`:`1`;i=`
      <div class="system-value-input-wrap">
        <input type="number" class="system-value-input"
          data-value-key="${e.key}"
          value="${h(t??``)}" step="${n}" min="0" ${r}>
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
  `}function ge(e){document.querySelectorAll(`.system-value-input`).forEach(t=>{t.addEventListener(`blur`,async t=>{let n=t.target.dataset.valueKey,r=D.find(e=>e.key===n);r&&(r.type===`fraction`?await ve(t.target,r,e):await _e(t.target,r,e))})})}async function _e(e,t,r){return x(Z,async i=>{let{setDoc:s}=S(i),c=t.key,l=r[c],u=t.type===`decimal`?parseFloat(e.value):parseInt(e.value,10);if(isNaN(u)||u<0){alert(`0 이상의 숫자를 입력해주세요.`),e.value=l;return}if(u!==l)try{await O(i,`settings/systemValues`,c,l,T),await s(n(a,`settings`,`systemValues`),{[c]:u},{merge:!0}),r[c]=u,await B(c,l,u,i)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+o(e))}},{roles:[`admin`,`office`]})}async function ve(e,t,r){return x(Z,async e=>{let{setDoc:i}=S(e),s=t.key,c=r[s]||{numerator:0,denominator:1},l=document.querySelector(`.system-value-input[data-value-key="${s}"][data-frac-part="numerator"]`),u=document.querySelector(`.system-value-input[data-value-key="${s}"][data-frac-part="denominator"]`),d=parseInt(l.value,10),f=parseInt(u.value,10);if(isNaN(d)||d<0){alert(`분자는 0 이상의 정수여야 합니다.`),l.value=c.numerator;return}if(isNaN(f)||f<1){alert(`분모는 1 이상의 정수여야 합니다.`),u.value=c.denominator;return}let p={numerator:d,denominator:f};if(!(p.numerator===c.numerator&&p.denominator===c.denominator))try{await O(e,`settings/systemValues`,s,c,T),await i(n(a,`settings`,`systemValues`),{[s]:p},{merge:!0}),r[s]=p,await B(s,c,p,e)}catch(e){console.error(`[settings] systemValue save failed:`,e),alert(`저장 실패: `+o(e))}},{roles:[`admin`,`office`]})}async function B(t,n,r,o){let{addDoc:s}=S(o);await s(i(a,`activityLogs`),{date:_(),timestamp:e(),action:`settings`,subAction:`systemValueChange`,details:{valueKey:t,before:n,after:r},staffName:m?.email||m?.uid||``,acknowledged:!1})}function ye(e,t=[],n){let r=n?``:`disabled`,i=Array.isArray(t)?t:[];return`
    <div class="closing-flag-row menu-staff-group-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${e.label}</div>
        <div class="closing-flag-desc">담당자 드롭다운에 표시할 그룹</div>
      </div>
      <div class="menu-staff-group-options" data-menu-key="${e.key}">
        ${E.map(t=>`
          <label class="menu-staff-group-option">
            <input
              type="checkbox"
              class="menu-staff-group-checkbox"
              data-menu-key="${e.key}"
              data-group-key="${t}"
              ${i.includes(t)?`checked`:``}
              ${r}
            >
            <span>${re[t]}</span>
          </label>
        `).join(``)}
      </div>
    </div>
  `}function be(t){document.querySelectorAll(`.menu-staff-group-checkbox`).forEach(r=>{r.addEventListener(`change`,async r=>x(Z,async s=>{let{addDoc:c,setDoc:l}=S(s),u=r.target.dataset.menuKey,d=r.target.dataset.groupKey,f=Array.isArray(t[u])?[...t[u]]:[],p=new Set(f);r.target.checked?p.add(d):p.delete(d);let h=E.filter(e=>p.has(e));if(h.length===0){alert(`담당자 그룹은 최소 1개 이상 선택해야 합니다.`),r.target.checked=!0;return}if(!xe(f,h))try{await O(s,`settings/menuStaffGroups`,u,f,ie),await l(n(a,`settings`,`menuStaffGroups`),{[u]:h},{merge:!0}),t[u]=h,await c(i(a,`activityLogs`),{date:_(),timestamp:e(),action:`settings`,subAction:`menuStaffGroupChange`,details:{menuKey:u,before:f,after:h},staffName:m?.email||m?.uid||``,acknowledged:!1})}catch(e){console.error(`[settings] menuStaffGroups save failed:`,e),alert(`저장 실패: `+o(e)),r.target.checked=f.includes(d)}},{roles:[`admin`,`office`]}))})}function xe(e,t){return e.length===t.length&&e.every((e,n)=>e===t[n])}async function V(e={getDoc:t,getDocs:r}){let i={senior:[],lead:[],office:[]};return await Promise.all(Object.keys(i).map(async t=>{let r=await e.getDoc(n(a,`staffGroups`,t));r.exists()&&(i[t]=r.data().members||[])})),i}function H(e,t,n,r=!1){return`
    <div class="staff-group" data-group="${e}">
      <div class="staff-group-header">
        <span class="staff-group-label">${t}</span>
        ${r?`<button class="btn-add-staff" data-group="${e}">+ 추가</button>`:``}
      </div>
      <div class="staff-list" id="staffList-${e}">
        ${n.map((t,n)=>`
          <div class="staff-item" data-group="${e}" data-index="${n}">
            <span>${h(t.name)}</span>
            ${r?`<button class="btn-del-staff" data-group="${e}" data-index="${n}">삭제</button>`:``}
          </div>
        `).join(``)}
        ${n.length===0?`<p class="staff-empty">담당자 없음</p>`:``}
      </div>
    </div>
  `}function U(e){document.querySelectorAll(`.btn-add-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=await c({title:`담당자 추가`,label:`담당자 이름`,placeholder:`예: 홍길동`,required:!0});if(r===null||!r||!r.trim())return;let i=[...e[n],{id:Date.now().toString(),name:r.trim(),active:!0,sortOrder:e[n].length}];await W(n,i,e[n])&&(e[n]=i,G(e))})}),document.querySelectorAll(`.btn-del-staff`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.group,r=parseInt(t.dataset.index,10);if(!await s({title:`담당자 삭제`,message:`담당자를 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))return;let i=e[n].filter((e,t)=>t!==r);await W(n,i,e[n])&&(e[n]=i,G(e))})})}async function W(e,t,r){return x(Z,async i=>{let{getDoc:o,setDoc:s}=S(i),c=await i.getDoc(n(a,`staffGroups`,e));if(l(c.exists()&&c.data().members||[])!==l(r))throw Error(`담당자 목록이 변경되었습니다. 다시 불러와주세요.`);return await s(n(a,`staffGroups`,e),{name:{senior:`선임`,lead:`주임`,office:`사무`}[e],sortOrder:[`senior`,`lead`,`office`].indexOf(e),members:t,updatedAt:new Date}),i.isCurrent()},{roles:[`admin`,`office`]})}function G(e){let t=v===`admin`||v===`office`;document.getElementById(`staffList-senior`).innerHTML=K(`senior`,e.senior,t),document.getElementById(`staffList-lead`).innerHTML=K(`lead`,e.lead,t),document.getElementById(`staffList-office`).innerHTML=K(`office`,e.office,t),t&&U(e)}function K(e,t,n=!1){return t.map((t,r)=>`
    <div class="staff-item" data-group="${e}" data-index="${r}">
      <span>${h(t.name)}</span>
      ${n?`<button class="btn-del-staff" data-group="${e}" data-index="${r}">삭제</button>`:``}
    </div>
  `).join(``)||`<p class="staff-empty">담당자 없음</p>`}async function Se(e={getDoc:t,getDocs:r}){let n=(await e.getDocs(i(a,`holidays`))).docs.map(e=>q(e.id,e.data())).filter(e=>e.status!==`deleted`);return n.sort((e,t)=>t.id.localeCompare(e.id)),n}function q(e,t={}){let n=t.title||t.label||t.name||``;return{id:e,date:t.date||e,title:n,label:t.label||n,description:t.description||``,holidayType:t.holidayType||(t.isAutoGenerated?`publicHoliday`:`internalOff`),affectsProduction:t.affectsProduction===void 0?!0:t.affectsProduction===!0,affectsShipping:t.affectsShipping===void 0?!0:t.affectsShipping===!0,shippingClosedFromEnabled:t.shippingClosedFromEnabled===void 0?!0:t.shippingClosedFromEnabled===!0,isAutoGenerated:t.isAutoGenerated===!0,recurrenceRule:t.recurrenceRule||null,status:t.status||`active`}}function Ce(e){let t=v===`admin`||v===`office`,n=`${d.startYear}~${d.endYear}`;return(t?`
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
          <div class="holiday-item" data-id="${h(e.id)}">
            <span class="holiday-date">${h(e.id)}</span>
            <span class="holiday-label">${h(e.title||e.label||``)}</span>
            <span class="holiday-badge">${e.isAutoGenerated?`자동`:`회사`}</span>
            <span class="holiday-flags">
              ${e.affectsProduction?`생산휴무`:`생산가능`}
              · ${e.affectsShipping?`배송휴무`:`배송가능`}
              · ${e.shippingClosedFromEnabled?`전날배송불가`:`전날배송가능`}
            </span>
            ${t?`
              <button class="btn-edit-holiday" data-id="${h(e.id)}">수정</button>
              <button class="btn-del-holiday" data-id="${h(e.id)}">${e.isAutoGenerated?`비활성`:`삭제`}</button>
            `:``}
          </div>
        `).join(``)}
      </div>
    `)}function we(){let e=document.getElementById(`btnImportPublicHolidays`);e&&e.addEventListener(`click`,Ee);let t=document.getElementById(`btnAddHoliday`);t&&t.addEventListener(`click`,Te),document.querySelectorAll(`.btn-del-holiday`).forEach(e=>{e.addEventListener(`click`,()=>Oe(e.dataset.id))}),document.querySelectorAll(`.btn-edit-holiday`).forEach(e=>{e.addEventListener(`click`,()=>De(e.dataset.id))})}async function Te(){return x(Z,async t=>{let{getDoc:r,setDoc:i}=S(t),s=document.getElementById(`hd_start`),c=document.getElementById(`hd_end`),l=document.getElementById(`hd_label`),u=document.getElementById(`hd_desc`),d=document.getElementById(`hd_affectsProduction`),f=document.getElementById(`hd_affectsShipping`),h=document.getElementById(`hd_shippingAvailablePrev`),g=s.value,_=c.value||g,v=l.value.trim(),y=u.value.trim();if(!g){alert(`시작일을 선택해주세요.`),s.focus();return}if(_<g){alert(`종료일은 시작일 이후여야 합니다.`),c.focus();return}if(!v){alert(`휴무일명을 입력해주세요.`),l.focus();return}let b=J(g,_);try{let o=0,s=0;for(let t of b){let c=n(a,`holidays`,t);if((await r(c)).exists()){s+=1;continue}await i(c,{date:t,holidayType:`internalOff`,title:v,label:v,description:y,affectsProduction:d.checked,affectsShipping:f.checked,shippingClosedFromEnabled:!h.checked,isAutoGenerated:!1,recurrenceRule:null,status:`active`,createdAt:e(),createdBy:m?.uid||null,updatedAt:e(),updatedBy:m?.uid||null}),o+=1}if(await X(`create`,{startDate:g,endDate:_,title:v,created:o,skipped:s,total:b.length},t),await p(),o===0&&s>0){alert(`등록된 날짜가 없습니다. 선택한 ${s}개 날짜가 이미 등록되어 있습니다.`);return}alert(`회사 휴무일 등록 완료: ${o}건${s?` / 기존 항목 건너뜀 ${s}건`:``}`),await M()}catch(e){console.error(e),alert(`등록 실패: `+o(e))}},{roles:[`admin`,`office`]})}async function Ee(){return x(Z,async t=>{let{getDoc:r,setDoc:i}=S(t),c=g();if(await s({title:`한국 공휴일 자동 등록`,message:`${d.startYear}~${d.endYear}년 한국 공휴일 ${c.length}건을 등록합니다.\n이미 등록된 날짜는 덮어쓰지 않습니다.`,confirmText:`등록`}))try{let o=0,s=0;for(let t of c){let c=n(a,`holidays`,t.date),l=await r(c);if(l.exists()&&l.data().status!==`deleted`){s+=1;continue}await i(c,{...t,label:t.title,status:`active`,createdAt:e(),createdBy:m?.uid||null,updatedAt:e(),updatedBy:m?.uid||null}),o+=1}await X(`autoImport`,{startYear:d.startYear,endYear:d.endYear,created:o,skipped:s,total:c.length},t),await p(),alert(`한국 공휴일 자동 등록 완료: 신규 ${o}건 / 기존 유지 ${s}건`),await M()}catch(e){console.error(e),alert(`자동 등록 실패: `+o(e))}},{roles:[`admin`,`office`]})}async function De(t){return x(Z,async r=>{let{getDoc:i,setDoc:l}=S(r),u=await i(n(a,`holidays`,t));if(!u.exists()){alert(`휴일 정보를 찾을 수 없습니다.`);return}let d=q(t,u.data()),f=await c({title:`휴일명 수정`,label:`휴일명`,defaultValue:d.title||d.label||``,required:!0});if(f===null)return;let h=await c({title:`메모 수정`,label:`메모`,defaultValue:d.description||``,required:!1,multiline:!0});if(h===null)return;let g=await s({title:`생산 영향`,message:`${t}에 생산하지 않음으로 설정할까요?`,confirmText:`생산 안 함`,cancelText:`생산 가능`}),_=await s({title:`배송 영향`,message:`${t}에 배송하지 않음으로 설정할까요?`,confirmText:`배송 안 함`,cancelText:`배송 가능`}),v=await s({title:`전날 배송`,message:`${t} 전날 배송 가능으로 설정할까요?`,confirmText:`전날 배송 가능`,cancelText:`전날 배송 불가`}),y={title:f,label:f,description:h,affectsProduction:g,affectsShipping:_,shippingClosedFromEnabled:!v,updatedAt:e(),updatedBy:m?.uid||null};try{await l(n(a,`holidays`,t),y,{merge:!0}),await X(`edit`,{date:t,before:Y(d),after:{title:f,description:h,affectsProduction:g,affectsShipping:_,shippingClosedFromEnabled:!v}},r),await p(),alert(`휴일 수정 완료!`),await M()}catch(e){console.error(e),alert(`수정 실패: `+o(e))}},{roles:[`admin`,`office`]})}async function Oe(t){return x(Z,async r=>{let{getDoc:i,setDoc:c}=S(r),l=await i(n(a,`holidays`,t)),u=l.exists()?q(t,l.data()):{id:t};if(await s({title:u.isAutoGenerated?`자동 공휴일 비활성`:`회사 휴무일 삭제`,message:`${t} ${u.isAutoGenerated?`자동 공휴일을 비활성 처리`:`회사 휴무일을 삭제 처리`}하시겠습니까?`,confirmText:u.isAutoGenerated?`비활성`:`삭제`,danger:!0}))try{await c(n(a,`holidays`,t),{date:t,status:`deleted`,updatedAt:e(),updatedBy:m?.uid||null,deletedAt:e(),deletedBy:m?.uid||null},{merge:!0}),await X(`delete`,{date:t,holiday:Y(u),mode:u.isAutoGenerated?`disableAutoGenerated`:`softDelete`},r),await p(),alert(u.isAutoGenerated?`자동 공휴일 비활성 완료!`:`회사 휴무일 삭제 완료!`),await M()}catch(e){console.error(e),alert(`삭제 실패: `+o(e))}},{roles:[`admin`,`office`]})}function J(e,t){let n=[],r=new Date(`${e}T00:00:00+09:00`),i=new Date(`${t}T00:00:00+09:00`);for(let e=0;e<370&&r<=i;e+=1){let e=new Date(r.getTime()+540*60*1e3);n.push(e.toISOString().slice(0,10)),r=new Date(r.getTime()+1440*60*1e3)}return n}function Y(e){return{date:e.date||e.id,title:e.title||e.label||``,holidayType:e.holidayType||``,affectsProduction:e.affectsProduction,affectsShipping:e.affectsShipping,shippingClosedFromEnabled:e.shippingClosedFromEnabled,isAutoGenerated:e.isAutoGenerated===!0,status:e.status||`active`}}async function X(t,n,r){let{addDoc:o}=S(r);await o(i(a,`activityLogs`),{date:_(),timestamp:e(),action:`holiday`,subAction:t,details:n,staffName:m?.email||m?.uid||``,acknowledged:!1})}var Z=y(`settings`),Q=Z.prepare?Array.from({length:7},(e,t)=>f(`settings/section/`+t)):[];if(Q.length){let e=Z.invalidate.bind(Z);Z.invalidate=()=>{e(),Q.forEach(e=>e.invalidate())}}function $(e,t){return[V,te,L,Se,ce,e=>Promise.all([ue(e),V(e)]),ne][e](t)}async function ke({cacheOnly:e=!0}={}){for(let t=0;t<Q.length;t++)try{await Q[t].prepare(`default`,e=>$(t,e),{cacheOnly:e})}catch(e){if(e.code!==`cache-miss`)throw e}}export{ke as preparePage,M as renderSettings};