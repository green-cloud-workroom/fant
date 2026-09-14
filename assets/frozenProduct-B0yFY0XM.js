import{a as e,b as t,c as n,f as r,g as i,h as a,i as o,m as s,n as c,p as l,r as u,s as d,u as f}from"./index.esm-Cf9DaHbi.js";import{n as p}from"./firebase-BQPCO7kq.js";import{g as m,j as h,m as g,w as _}from"./index-CMgkQ4he.js";import{n as v}from"./activityLogs-Mn_dgBRB.js";import{t as y}from"./closingGuard-CS1p4aoM.js";import{t as b}from"./sortable.esm-D0d_dJ5t.js";import{n as x,t as S}from"./recipe--2Kq0z71.js";var C=[],w=null,T=`frozenProductCategoryCollapsed`,E=[{key:`cat-product`,label:`고양이`,target:`cat`,kind:`product`},{key:`dog-product`,label:`강아지`,target:`dog`,kind:`product`},{key:`common-product`,label:`공용`,target:`common`,kind:`product`},{key:`cat-sample`,label:`고양이샘플`,target:`cat`,kind:`sample`},{key:`dog-sample`,label:`강아지샘플`,target:`dog`,kind:`sample`},{key:`common-sample`,label:`공용샘플`,target:`common`,kind:`sample`},{key:`sample-set`,label:`샘플세트`,target:null,kind:`sampleSet`}];async function D(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결제품 입고 로딩 중...</p></div>`;let[t]=await Promise.all([O(),oe()]);e.isConnected&&(C=t,A())}async function O(){return(await e(n(a(p,`frozenProducts`),d(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function k(t){return(await e(n(a(p,`frozenLogs`),d(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.productId===t&&e.status!==`deleted`).slice(0,30)}function A(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${h===`admin`||h===`office`?`<button class="btn-primary" id="btnNewProduct">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="productList">
          ${re()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `,L(),F(),document.getElementById(`btnNewProduct`)?.addEventListener(`click`,V)}function j(e){let t=e?.name||``;return[`cat`,`dog`,`common`].includes(e?.target)?e.target:t.startsWith(`고양이 `)?`cat`:t.startsWith(`강아지 `)?`dog`:`common`}function M(e){return[`product`,`sample`,`sampleSet`].includes(e?.kind)?e.kind:`product`}function N(e){let t=M(e);return t===`sampleSet`?`sample-set`:`${j(e)}-${t}`}function P(){try{let e=JSON.parse(localStorage.getItem(T)||`{}`);return e&&typeof e==`object`?e:{}}catch{return{}}}function ee(e,t){let n=P();n[e]=t,localStorage.setItem(T,JSON.stringify(n))}function te(e){let t=h===`admin`||h===`office`;return`
    <div class="recipe-list-item ${w===e.id?`active`:``}"
      data-id="${e.id}" style="padding:3px 8px;min-height:28px;">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>`:``}
      <div class="recipe-list-info" style="gap:0;">
        <span class="recipe-name" style="font-size:12.5px;line-height:1.2;">${e.name}</span>
      </div>
    </div>
  `}function ne(){let e=P();return E.map(t=>{let n=C.filter(e=>N(e)===t.key),r=e[t.key]===!0;return`
        <div class="frozen-product-category" data-category="${t.key}">
          <button type="button" class="frozen-product-category-header" data-category="${t.key}"
            style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin:3px 0 1px;border:0;background:#f5f5f5;border-radius:6px;cursor:pointer;font-weight:700;font-size:12.5px;color:#333;">
            <span>${r?`▶`:`▼`} ${t.label}</span>
            <span style="font-size:11px;color:#777;">${n.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${t.key}" style="${r?`display:none;`:``}">
            ${n.length===0?`<div style="padding:4px 8px;color:#aaa;font-size:11.5px;">등록된 제품 없음</div>`:n.map(te).join(``)}
          </div>
        </div>
      `}).join(``)}function re(){return ne()}function F(){h!==`admin`&&h!==`office`||document.querySelectorAll(`.frozen-product-category-items`).forEach(e=>{b.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,group:{name:`frozenProduct-${e.dataset.category||`group`}`,pull:!1,put:!1},onEnd:async e=>{e.oldIndex!==e.newIndex&&await I()}})})}async function I(){let e=document.getElementById(`productList`);if(!e)return;let t=Array.from(e.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),n=new Date,r=s(p);t.forEach((e,t)=>{r.update(i(p,`frozenProducts`,e),{sortOrder:t,updatedAt:n})});try{await r.commit();let e=new Map(t.map((e,t)=>[e,t]));C=C.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:n}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){if(console.error(`[frozenProduct] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),C=await O(),A(),w){let e=C.find(e=>e.id===w);e&&await B(e)}}}function L(){document.querySelectorAll(`.frozen-product-category-header`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.category,n=document.querySelector(`.frozen-product-category-items[data-category="${t}"]`);if(!(!t||!n)&&(ee(t,n.style.display!==`none`),A(),w)){let e=C.find(e=>e.id===w);e&&B(e)}})}),document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,async t=>{t.target.closest(`.drag-handle`)||(w=e.dataset.id,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await B(C.find(e=>e.id===w)))})})}async function R(t){return(await e(n(a(p,`frozenLogs`),l(`productId`,`==`,t)))).docs.map(e=>e.data()).filter(e=>e.status!==`deleted`).length}async function z(e){if(h!==`admin`&&h!==`office`){alert(`동결제품 삭제는 관리자/사무 계정만 가능합니다.`);return}let t=await R(e.id);if(t>0){alert(`사용 이력이 ${t}건 있어 삭제할 수 없습니다.`);return}await g({title:`동결제품 삭제`,message:`${e.name} 제품을 삭제하시겠습니까?\n입고 이력이 없는 제품만 완전히 삭제됩니다.`,confirmText:`삭제`,danger:!0})&&(await u(i(p,`frozenProducts`,e.id)),await v({action:`frozenProduct`,subAction:`delete`,date:_(),staff:se(),message:`동결제품 삭제 — ${e.name}`,details:{productId:e.id,productName:e.name,bagTypeId:e.bagTypeId||null}}),C=C.filter(t=>t.id!==e.id),w===e.id&&(w=null),A(),alert(`삭제 완료!`))}async function B(e){let t=document.getElementById(`productDetail`),n=await k(e.id),s=h===`admin`||h===`office`;t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        ${s?`<button class="btn-secondary" id="btnEditProduct">수정</button>`:``}
        ${s?`<button class="btn-secondary" id="btnDeleteProduct">삭제</button>`:``}
        <button class="btn-primary" id="btnAddIncoming">+ \uC785\uACE0 \uB4F1\uB85D</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 입고 이력 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>유통기한</th>
                <th>수량(개)</th>
                <th>차감봉투(장)</th>
                <th>담당자</th>
                <th>비고</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${n.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:n.map(t=>`
                  <tr>
                    <td>${t.date||`-`}</td>
                    <td>${t.expiryDate||`-`}</td>
                    <td>${t.qty}</td>
                    <td>${t.deductedBagQty||`-`}</td>
                    <td>${t.staffName||`-`}</td>
                    <td>${t.note||`-`}</td>
                    <td>
                      ${s?`
                        <button class="btn-edit-row" data-logid="${t.id}" style="margin-right:4px;">수정</button>
                        <button class="btn-del-row" data-logid="${t.id}" data-qty="${t.qty}" data-bagqty="${t.deductedBagQty||0}" data-bagid="${e.bagTypeId||``}">삭제</button>
                      `:``}
                    </td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddIncoming`)?.addEventListener(`click`,()=>X(e)),document.getElementById(`btnEditProduct`)?.addEventListener(`click`,()=>H(e)),document.getElementById(`btnDeleteProduct`)?.addEventListener(`click`,()=>z(e)),document.querySelectorAll(`.btn-edit-row`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.dataset.logid,r=await o(i(p,`frozenLogs`,n));if(!r.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}ie(e,{id:n,...r.data()})})}),document.querySelectorAll(`.btn-del-row`).forEach(t=>{t.addEventListener(`click`,async()=>{if(h!==`admin`&&h!==`office`){alert(`동결제품 입고 삭제는 대표/사무실 계정만 가능합니다.`);return}if(!await g({title:`동결제품 입고 삭제`,message:`삭제하시겠습니까?
차감된 봉투 재고가 복원됩니다.`,confirmText:`삭제`,danger:!0}))return;let n=t.dataset.logid,s=await o(i(p,`frozenLogs`,n));if(!s.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}let l=s.data();if(await y(l.date))return;if(l.ledgerId){let e=await o(i(p,`stockLedger`,l.ledgerId));if(e.exists()&&e.data().status===`active`){let t=e.data().items||[];for(let e of t){let t=await o(i(p,e.collection,e.docId));if(!t.exists())continue;let n=t.data()[e.field]||0;if(n!==e.after&&!await g({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))continue;let s=n-e.delta;await r(i(p,e.collection,e.docId),{[e.field]:s,updatedAt:new Date}),e.collection===`bagTypes`&&await c(a(p,`bagLogs`),{date:_(),timestamp:new Date,bagTypeId:e.docId,bagNameSnapshot:t.data().name||``,type:`autoDeductReverse`,qty:-e.delta,before:n,after:s,staffName:l.staffName||``,note:`동결제품 입고 삭제 복원 - ${l.productNameSnapshot||``}`})}await r(i(p,`stockLedger`,l.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(l.bagTypeId&&(l.deductedBagQty||0)>0){let e=await o(i(p,`bagTypes`,l.bagTypeId));if(e.exists()){let t=e.data().currentQty||0;await r(i(p,`bagTypes`,l.bagTypeId),{currentQty:t+l.deductedBagQty,updatedAt:new Date})}}await r(i(p,`frozenLogs`,n),{status:`deleted`});let u=l.componentDeductLogIds||[];for(let e of u)await r(i(p,`frozenLogs`,e),{status:`deleted`});await B(e),alert(`삭제 완료!`)})})}function V(){Y(null)}function H(e){Y(e)}function U(e){return Array.isArray(e)?e.map(e=>({frozenProductId:e?.frozenProductId||``,qty:Number(e?.qty)||0})).filter(e=>e.frozenProductId&&e.qty>0):[]}function W(e){return C.filter(t=>M(t)===`sample`&&t.id!==e)}function G(e=``,t=null){return[`<option value="">샘플 선택</option>`,...W(t).map(t=>`<option value="${t.id}" ${e===t.id?`selected`:``}>${t.name}</option>`)].join(``)}function K(e={},t=null){let n=Number(e.qty)>0?Number(e.qty):1;return`
    <div class="sample-set-component-row" style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;align-items:center;margin-bottom:6px;">
      <select class="component-product-id">
        ${G(e.frozenProductId||``,t)}
      </select>
      <input type="number" class="component-qty" min="1" step="1" value="${n}" />
      <button type="button" class="btn-secondary btn-remove-component">삭제</button>
    </div>
  `}function q(e=``){return String(e).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function J({product:e,frozenLogId:n,date:r,expiry:a,qty:o,staff:s}){let c=M(e);if(c!==`product`&&c!==`sample`)return;let l=`frozenLogs:${n}:1`;try{await f(i(p,`productTransferRequests`,l),{idempotencyKey:l,sourceApp:`production`,sourceCollection:`frozenLogs`,sourceId:n,eventType:`productReceipt`,category:`freezeDry`,revision:1,supersedesRevision:null,status:`pending`,frozenProductId:e.id,productName:e.name,recipeName:e.recipeTitleRef||e.name,unitType:c===`sample`?`sample`:`main`,quantity:o,expiryDate:a,producedDate:r,staff:s,createdAt:t()})}catch(e){console.error(`동결제품 입고 productTransferRequests 전송 실패`,e)}}async function Y(t){let o=!t,s=(await e(n(a(p,`bagTypes`),d(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.category===`freezeDry`&&(e.active!==!1||!o&&e.id===t?.bagTypeId)),l=await S(),u=j(t),f=M(t),m=U(t?.components),g=(e,t=``)=>e===`sampleSet`?`<input type="text" id="m_name" value="${q(t)}" placeholder="샘플세트 이름 입력" />`:`
      <select id="m_name">
        ${x(l,t)}
      </select>
    `;$(`
    <h3 class="modal-title">${o?`동결제품 추가`:`동결제품 수정`}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <div id="m_name_wrap">
        ${g(f,t?.name||``)}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종 *</label>
        <select id="m_target">
          <option value="cat" ${u===`cat`?`selected`:``}>고양이</option>
          <option value="dog" ${u===`dog`?`selected`:``}>강아지</option>
          <option value="common" ${u===`common`?`selected`:``}>공용</option>
        </select>
      </div>
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_kind">
          <option value="product" ${f===`product`?`selected`:``}>본품</option>
          <option value="sample" ${f===`sample`?`selected`:``}>샘플</option>
          <option value="sampleSet" ${f===`sampleSet`?`selected`:``}>샘플세트</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>연결 봉투 *</label>
      <select id="m_bagType">
        <option value="">선택</option>
        ${s.map(e=>`<option value="${e.id}" ${t?.bagTypeId===e.id?`selected`:``}>${e.name}${e.active===!1?` (비활성)`:``}</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>분리작업 필요</label>
      <select id="m_separation">
        <option value="false" ${t?.requiresSeparation?``:`selected`}>아니오</option>
        <option value="true" ${t?.requiresSeparation?`selected`:``}>예</option>
      </select>
    </div>
    <div class="form-group" id="m_components_section" style="${f===`sampleSet`?``:`display:none;`}">
      <label>샘플세트 구성</label>
      <div id="m_components_rows">
        ${(m.length>0?m:[{}]).map(e=>K(e,t?.id||null)).join(``)}
      </div>
      <button type="button" class="btn-secondary" id="btnAddComponentRow">+ 구성 샘플 추가</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${o?`추가`:`저장`}</button>
    </div>
  `);let _=()=>{let e=document.getElementById(`m_kind`).value===`sampleSet`;document.getElementById(`m_components_section`).style.display=e?``:`none`},v=()=>{let e=document.getElementById(`m_name`)?.value||``,t=document.getElementById(`m_kind`).value;document.getElementById(`m_name_wrap`).innerHTML=g(t,e)};document.getElementById(`m_kind`)?.addEventListener(`change`,()=>{_(),v()}),document.getElementById(`btnAddComponentRow`)?.addEventListener(`click`,()=>{document.getElementById(`m_components_rows`).insertAdjacentHTML(`beforeend`,K({},t?.id||null))}),document.getElementById(`m_components_rows`)?.addEventListener(`click`,e=>{let t=e.target.closest(`.btn-remove-component`);if(!t)return;let n=t.closest(`.sample-set-component-row`);if(document.querySelectorAll(`.sample-set-component-row`).length<=1){n.querySelector(`.component-product-id`).value=``,n.querySelector(`.component-qty`).value=`1`;return}n.remove()}),document.getElementById(`btnSaveProduct`).addEventListener(`click`,async()=>{if(h!==`admin`&&h!==`office`){alert(`동결제품 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let e=document.getElementById(`m_name`).value.trim(),n=e,s=document.getElementById(`m_target`).value,l=document.getElementById(`m_kind`).value,u=document.getElementById(`m_bagType`).value,d=document.getElementById(`m_separation`).value===`true`,f=o?!0:t.active!==!1;if(!e||!u){alert(`제품명과 연결 봉투는 필수입니다.`);return}let m=l===`sampleSet`?Array.from(document.querySelectorAll(`.sample-set-component-row`)).map(e=>({frozenProductId:e.querySelector(`.component-product-id`).value,qty:Number(e.querySelector(`.component-qty`).value)||0})).filter(e=>e.frozenProductId&&e.qty>0):[];if(l===`sampleSet`&&m.length===0){alert(`샘플세트 구성 샘플을 1개 이상 입력해주세요.`);return}let g={name:e,recipeTitleRef:n,target:s,kind:l,components:m,bagTypeId:u,requiresSeparation:d,active:f,sortOrder:o?C.length:t.sortOrder,updatedAt:new Date};o?(g.createdAt=new Date,await c(a(p,`frozenProducts`),g)):await r(i(p,`frozenProducts`,t.id),g),C=await O(),closeModal(),A(),alert(o?`추가 완료!`:`수정 완료!`)})}function ie(e,t){$(`
    <h3 class="modal-title">입고 수정 — ${e.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜 (수정 불가)</label>
        <input type="date" id="m_date" value="${t.date||``}" disabled />
      </div>
      <div class="form-group">
        <label>유통기한</label>
        <input type="date" id="m_expiry" value="${t.expiryDate||``}" />
      </div>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" value="${t.qty||0}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`lead`,`office`]).replace(`value="${t.staffName}"`,`value="${t.staffName}" selected`)}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" value="${t.note||``}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEditIncoming">저장</button>
    </div>
  `),document.getElementById(`btnSaveEditIncoming`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_expiry`).value,s=parseInt(document.getElementById(`m_qty`).value),l=document.getElementById(`m_staff`).value,u=document.getElementById(`m_note`).value;if(!s||s<=0){alert(`수량은 1개 이상이어야 합니다.`);return}if(await y(t.date))return;if(h!==`admin`&&h!==`office`){alert(`동결제품 입고 수정은 대표/사무실 계정만 가능합니다.`);return}t.qty;let d=t.deductedBagQty||0;if(t.ledgerId){let n=await o(i(p,`stockLedger`,t.ledgerId));if(n.exists()&&n.data().status===`active`){let s=n.data().items||[];for(let t of s){let n=await o(i(p,t.collection,t.docId));if(!n.exists())continue;let s=n.data()[t.field]||0;if(s!==t.after&&!await g({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${t.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))return;let u=s-t.delta;await r(i(p,t.collection,t.docId),{[t.field]:u,updatedAt:new Date}),t.collection===`bagTypes`&&await c(a(p,`bagLogs`),{date:_(),timestamp:new Date,bagTypeId:t.docId,bagNameSnapshot:n.data().name||``,type:`autoDeductReverse`,qty:-t.delta,before:s,after:u,staffName:l,note:`동결제품 입고 수정(롤백) - ${e.name}`})}await r(i(p,`stockLedger`,t.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(t.bagTypeId&&d>0){let e=await o(i(p,`bagTypes`,t.bagTypeId));if(e.exists()){let n=e.data().currentQty||0;await r(i(p,`bagTypes`,t.bagTypeId),{currentQty:n+d,updatedAt:new Date})}}let f=0,m=[];if(e.bagTypeId){let n=await o(i(p,`bagTypes`,e.bagTypeId));if(n.exists()){let o=n.data(),u=o.currentQty||0;if(u<s){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${u}장\n필요 수량: ${s}장\n\n수정이 중단되었습니다. 봉투 재고는 이전 상태로 이미 복원되었습니다.`),closeModal(),await B(e);return}let d=u-s,h=new Date;await r(i(p,`bagTypes`,e.bagTypeId),{currentQty:d,updatedAt:h}),f=s;let g=await c(a(p,`bagLogs`),{date:t.date,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:o.name,type:`autoDeduct`,qty:-s,before:u,after:d,staffName:l,note:`동결제품 입고 수정(재차감) - ${e.name}`});m.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-s,before:u,after:d,label:`${o.name} 봉투`,stockUpdatedAtSnapshot:h,bagLogId:g.id})}}let v=null;m.length>0&&(v=(await c(a(p,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:t.id,timestamp:new Date,date:t.date,status:`active`,items:m})).id),await r(i(p,`frozenLogs`,t.id),{qty:s,expiryDate:n,staffName:l,note:u,deductedBagQty:f,ledgerId:v,updatedAt:new Date}),closeModal(),await B(e),alert(`수정 완료!`)})}async function ae(){let t=await e(a(p,`frozenLogs`)),n={};return t.docs.forEach(e=>{let t=e.data();t.status!==`deleted`&&t.productId&&(n[t.productId]=(n[t.productId]||0)+Number(t.qty||0))}),n}async function X(e){let t=_(),n=m(18),s=M(e)===`sampleSet`?U(e.components):[],l=s.length>0?await ae():{},u=e=>C.find(t=>t.id===e)?.name||`(삭제된 제품)`;$(`
    <h3 class="modal-title">입고 등록 — ${e.name}</h3>
    <div class="form-group">
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${t}" max="${t}" />
    </div>
    <div class="form-group">
      <label>유통기한 *</label>
      <input type="date" id="m_expiry" value="${n}" />
    </div>
    <div class="form-group">
      <label>봉지수 *</label>
      <input type="number" id="m_qty" placeholder="봉지수 입력" />
    </div>
    ${s.length>0?`
      <div class="form-group" id="m_compPreview" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:12.5px;color:#555;">
        세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.
      </div>
    `:``}
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),s.length>0&&document.getElementById(`m_qty`).addEventListener(`input`,e=>{let t=parseInt(e.target.value)||0,n=document.getElementById(`m_compPreview`);if(n){if(t<=0){n.innerHTML=`세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.`,n.style.color=`#555`;return}n.innerHTML=s.map(e=>{let n=t*e.qty,r=l[e.frozenProductId]||0,i=r-n,a=i<0;return`<div style="margin-bottom:2px;${a?`color:#e53e3e;font-weight:600;`:``}">
          ${u(e.frozenProductId)} -${n}개 (현재 ${r} → ${i})${a?` ⚠️ 재고 부족`:``}
        </div>`}).join(``)}}),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_date`).value,d=document.getElementById(`m_expiry`).value,f=parseInt(document.getElementById(`m_qty`).value),m=document.getElementById(`m_staff`).value;if(!n){alert(`날짜를 입력해주세요.`);return}if(n>t){alert(`미래 날짜는 입력할 수 없습니다.`);return}if(!d){alert(`유통기한을 입력해주세요.`);return}if(d<n){alert(`유통기한이 입고일보다 빠릅니다.`);return}if(!f||f<=0){alert(`봉지수를 입력해주세요.`);return}if(!m){alert(`담당자는 필수입니다.`);return}if(await y(n))return;if(s.length>0){let e=s.map(e=>({name:u(e.frozenProductId),need:f*e.qty,cur:l[e.frozenProductId]||0})).filter(e=>e.cur<e.need);if(e.length>0&&!await g({title:`구성품 재고 부족`,message:`다음 구성품 재고가 부족합니다:\n\n${e.map(e=>`${e.name}: 현재 ${e.cur}개 / 필요 ${e.need}개`).join(`
`)}\n\n그래도 진행하면 재고가 음수로 기록됩니다.\n계속하시겠습니까?`,confirmText:`진행`,danger:!0}))return}let h=0,_=[];if(e.bagTypeId){let t=await o(i(p,`bagTypes`,e.bagTypeId));if(t.exists()){let o=t.data(),s=o.currentQty||0;if(s<f){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${s}장\n필요 수량: ${f}장`);return}let l=s-f,u=new Date;await r(i(p,`bagTypes`,e.bagTypeId),{currentQty:l,updatedAt:u}),h=f;let d=await c(a(p,`bagLogs`),{date:n,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:o.name,type:`autoDeduct`,qty:-f,before:s,after:l,staffName:m,note:`동결제품 입고 자동차감 - ${e.name}`});_.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-f,before:s,after:l,label:`${o.name} 봉투`,stockUpdatedAtSnapshot:u,bagLogId:d.id})}}let b=await c(a(p,`frozenLogs`),{date:n,timestamp:new Date,productId:e.id,productNameSnapshot:e.name,componentsSnapshot:M(e)===`sampleSet`?U(e.components):null,expiryDate:d,qty:f,bagTypeId:e.bagTypeId||null,deductedBagQty:h,staffName:m,note:``,status:`active`,ledgerId:null}),x=[];for(let t of s){let r=f*t.qty,i=await c(a(p,`frozenLogs`),{date:n,timestamp:new Date,productId:t.frozenProductId,productNameSnapshot:u(t.frozenProductId),componentsSnapshot:null,expiryDate:null,qty:-r,bagTypeId:null,deductedBagQty:0,staffName:m,note:`샘플세트 제작 자동차감 - ${e.name} ${f}세트`,status:`active`,ledgerId:null,sampleSetLogId:b.id});x.push(i.id)}if(x.length>0&&await r(i(p,`frozenLogs`,b.id),{componentDeductLogIds:x}),await J({product:e,frozenLogId:b.id,date:n,expiry:d,qty:f,staff:m}),_.length>0){let e=await c(a(p,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:b.id,timestamp:new Date,date:n,status:`active`,items:_});await r(i(p,`frozenLogs`,b.id),{ledgerId:e.id})}await v({action:`frozenProduct`,subAction:`incoming`,date:n,staff:m,message:`동결제품 입고 — ${e.name} +${f}봉 / 담당: ${m}`,details:{frozenLogId:b.id,productId:e.id,productName:e.name,componentsSnapshot:M(e)===`sampleSet`?U(e.components):null,qty:f,expiryDate:d||null,deductedBagQty:h,bagTypeId:e.bagTypeId||null,note:null}}),closeModal(),await B(e),alert(`입고 등록 완료!`)})}var Z={};async function oe(){Object.keys(Z).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await o(i(p,`staffGroups`,e));t.exists()&&(Z[e]=t.data().members||[])}))}function Q(e){let t=``;for(let n of e)(Z[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function se(){return h===`admin`?`대표`:h===`office`?`사무실`:h===`production`?`생산실`:`시스템`}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};export{D as renderFrozenProduct};