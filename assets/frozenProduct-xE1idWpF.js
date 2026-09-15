import{T as e,a as t,b as n,d as r,g as i,s as a,u as o,y as s}from"./index.esm-rHmxwfvm.js";import{n as c}from"./firebase-qGjqjNvO.js";import{n as l}from"./modalManager-Z4b2ihO9.js";import{I as u,O as d,W as f,h as p}from"./index-BN9Hd0zI.js";import"./activityLogs-CmbKUaQ7.js";import{t as m}from"./closingGuard-BSTDptsE.js";import{t as h}from"./sortable-DoQlGV4f.js";import{t as g}from"./pageResources-DMiwow9F.js";import{t as _}from"./pageRefresh-CKuZaDgD.js";import{t as v}from"./pageCommand-BEKrd9Ws.js";import{t as y}from"./commandWrites-ByRCNyNl.js";import{n as b,t as x}from"./recipe-cphQcRpb.js";import{t as S}from"./pageStaff-CdJTpDb_.js";var C=[],w=null,T=`frozenProductCategoryCollapsed`,ee=[{key:`cat-product`,label:`고양이`,target:`cat`,kind:`product`},{key:`dog-product`,label:`강아지`,target:`dog`,kind:`product`},{key:`common-product`,label:`공용`,target:`common`,kind:`product`},{key:`cat-sample`,label:`고양이샘플`,target:`cat`,kind:`sample`},{key:`dog-sample`,label:`강아지샘플`,target:`dog`,kind:`sample`},{key:`common-sample`,label:`공용샘플`,target:`common`,kind:`sample`},{key:`sample-set`,label:`샘플세트`,target:null,kind:`sampleSet`}];async function E({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">동결제품 입고 로딩 중...</p>`;let n=await $.load(async e=>{let[t,n]=await Promise.all([D(e),S(e)]);return{products:t,staff:n}},{force:e,onChange:_($,E)});if(!(!n||!t.isConnected)&&(C=n.products,X=n.staff,k(),w)){let e=C.find(e=>e.id===w);e&&await U(e)}}async function D(e={getDocs:a,getDoc:t}){let n=r(s(c,`frozenProducts`),o(`sortOrder`));return(await e.getDocs(n)).docs.map(e=>({id:e.id,...e.data()}))}async function O(e){return(await a(r(s(c,`frozenLogs`),o(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.productId===e&&t.status!==`deleted`).slice(0,30)}function k(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${f===`admin`||f===`office`?`<button class="btn-primary" id="btnNewProduct">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="productList">
          ${L()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `,B(),R(),document.getElementById(`btnNewProduct`)?.addEventListener(`click`,W)}function A(e){let t=e?.name||``;return[`cat`,`dog`,`common`].includes(e?.target)?e.target:t.startsWith(`고양이 `)?`cat`:t.startsWith(`강아지 `)?`dog`:`common`}function j(e){return[`product`,`sample`,`sampleSet`].includes(e?.kind)?e.kind:`product`}function M(e){let t=j(e);return t===`sampleSet`?`sample-set`:`${A(e)}-${t}`}function N(){try{let e=JSON.parse(localStorage.getItem(T)||`{}`);return e&&typeof e==`object`?e:{}}catch{return{}}}function P(e,t){let n=N();n[e]=t,localStorage.setItem(T,JSON.stringify(n))}function F(e){let t=f===`admin`||f===`office`;return`
    <div class="recipe-list-item ${w===e.id?`active`:``}"
      data-id="${e.id}" style="padding:3px 8px;min-height:28px;">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>`:``}
      <div class="recipe-list-info" style="gap:0;">
        <span class="recipe-name" style="font-size:12.5px;line-height:1.2;">${e.name}</span>
      </div>
    </div>
  `}function I(){let e=N();return ee.map(t=>{let n=C.filter(e=>M(e)===t.key),r=e[t.key]===!0;return`
        <div class="frozen-product-category" data-category="${t.key}">
          <button type="button" class="frozen-product-category-header" data-category="${t.key}"
            style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin:3px 0 1px;border:0;background:#f5f5f5;border-radius:6px;cursor:pointer;font-weight:700;font-size:12.5px;color:#333;">
            <span>${r?`▶`:`▼`} ${t.label}</span>
            <span style="font-size:11px;color:#777;">${n.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${t.key}" style="${r?`display:none;`:``}">
            ${n.length===0?`<div style="padding:4px 8px;color:#aaa;font-size:11.5px;">등록된 제품 없음</div>`:n.map(F).join(``)}
          </div>
        </div>
      `}).join(``)}function L(){return I()}function R(){f!==`admin`&&f!==`office`||document.querySelectorAll(`.frozen-product-category-items`).forEach(e=>{h.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,group:{name:`frozenProduct-${e.dataset.category||`group`}`,pull:!1,put:!1},onEnd:async e=>{e.oldIndex!==e.newIndex&&await z()}})})}async function z(){return v($,async e=>{let{writeBatch:t}=y(e),r=document.getElementById(`productList`);if(!r)return;let i=Array.from(r.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),a=new Date,o=t(c);i.forEach((e,t)=>{o.update(n(c,`frozenProducts`,e),{sortOrder:t,updatedAt:a})});try{await o.commit();let e=new Map(i.map((e,t)=>[e,t]));C=C.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:a}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(t){if(console.error(`[frozenProduct] reorder save failed:`,t),alert(`순번 저장 실패: `+(t.message||t)),C=await D(),!e.isCurrent())return;if(k(),w){let e=C.find(e=>e.id===w);e&&await U(e)}}},{roles:[`admin`,`office`]})}function B(){document.querySelectorAll(`.frozen-product-category-header`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.category,n=document.querySelector(`.frozen-product-category-items[data-category="${t}"]`);if(!(!t||!n)&&(P(t,n.style.display!==`none`),k(),w)){let e=C.find(e=>e.id===w);e&&U(e)}})}),document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,async t=>{t.target.closest(`.drag-handle`)||(w=e.dataset.id,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await U(C.find(e=>e.id===w)))})})}async function V(e,t={getDocs:a}){return(await t.getDocs(r(s(c,`frozenLogs`),i(`productId`,`==`,e)))).docs.map(e=>e.data()).filter(e=>e.status!==`deleted`).length}async function H(e){return v($,async t=>{let{deleteDoc:r,recordActivity:i}=y(t);if(f!==`admin`&&f!==`office`){alert(`동결제품 삭제는 관리자/사무 계정만 가능합니다.`);return}let a=await V(e.id,t);if(a>0){alert(`사용 이력이 ${a}건 있어 삭제할 수 없습니다.`);return}await p({title:`동결제품 삭제`,message:`${e.name} 제품을 삭제하시겠습니까?\n입고 이력이 없는 제품만 완전히 삭제됩니다.`,confirmText:`삭제`,danger:!0})&&(await r(n(c,`frozenProducts`,e.id)),await i({action:`frozenProduct`,subAction:`delete`,date:u(),staff:se(),message:`동결제품 삭제 — ${e.name}`,details:{productId:e.id,productName:e.name,bagTypeId:e.bagTypeId||null}}),C=C.filter(t=>t.id!==e.id),w===e.id&&(w=null),t.isCurrent()&&(k(),alert(`삭제 완료!`)))},{roles:[`admin`,`office`]})}async function U(e){let r=document.getElementById(`productDetail`),i=await O(e.id);if(!r?.isConnected||w!==e.id)return;let a=f===`admin`||f===`office`;r.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        ${a?`<button class="btn-secondary" id="btnEditProduct">수정</button>`:``}
        ${a?`<button class="btn-secondary" id="btnDeleteProduct">삭제</button>`:``}
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
              ${i.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:i.map(t=>`
                  <tr>
                    <td>${t.date||`-`}</td>
                    <td>${t.expiryDate||`-`}</td>
                    <td>${t.qty}</td>
                    <td>${t.deductedBagQty||`-`}</td>
                    <td>${t.staffName||`-`}</td>
                    <td>${t.note||`-`}</td>
                    <td>
                      ${a?`
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
  `,document.getElementById(`btnAddIncoming`)?.addEventListener(`click`,()=>oe(e)),document.getElementById(`btnEditProduct`)?.addEventListener(`click`,()=>G(e)),document.getElementById(`btnDeleteProduct`)?.addEventListener(`click`,()=>H(e)),document.querySelectorAll(`.btn-edit-row`).forEach(r=>{r.addEventListener(`click`,async()=>{let i=r.dataset.logid,a=await t(n(c,`frozenLogs`,i));if(!a.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}ie(e,{id:i,...a.data()})})}),document.querySelectorAll(`.btn-del-row`).forEach(t=>{t.addEventListener(`click`,async()=>v($,async r=>{let{getDoc:i,addDoc:a,updateDoc:o}=y(r);if(f!==`admin`&&f!==`office`){alert(`동결제품 입고 삭제는 대표/사무실 계정만 가능합니다.`);return}if(!await p({title:`동결제품 입고 삭제`,message:`삭제하시겠습니까?
차감된 봉투 재고가 복원됩니다.`,confirmText:`삭제`,danger:!0}))return;let l=t.dataset.logid,d=await i(n(c,`frozenLogs`,l));if(!d.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}let h=d.data();if(await m(h.date,r))return;if(h.ledgerId){let e=await i(n(c,`stockLedger`,h.ledgerId));if(e.exists()&&e.data().status===`active`){let t=e.data().items||[];for(let e of t){let t=await i(n(c,e.collection,e.docId));if(!t.exists())continue;let r=t.data()[e.field]||0;if(r!==e.after&&!await p({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))continue;let l=r-e.delta;await o(n(c,e.collection,e.docId),{[e.field]:l,updatedAt:new Date}),e.collection===`bagTypes`&&await a(s(c,`bagLogs`),{date:u(),timestamp:new Date,bagTypeId:e.docId,bagNameSnapshot:t.data().name||``,type:`autoDeductReverse`,qty:-e.delta,before:r,after:l,staffName:h.staffName||``,note:`동결제품 입고 삭제 복원 - ${h.productNameSnapshot||``}`})}await o(n(c,`stockLedger`,h.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(h.bagTypeId&&(h.deductedBagQty||0)>0){let e=await i(n(c,`bagTypes`,h.bagTypeId));if(e.exists()){let t=e.data().currentQty||0;await o(n(c,`bagTypes`,h.bagTypeId),{currentQty:t+h.deductedBagQty,updatedAt:new Date})}}await o(n(c,`frozenLogs`,l),{status:`deleted`});let g=h.componentDeductLogIds||[];for(let e of g)await o(n(c,`frozenLogs`,e),{status:`deleted`});r.isCurrent()&&(await U(e),alert(`삭제 완료!`))},{roles:[`admin`,`office`]}))})}function W(){Y(null)}function G(e){Y(e)}function K(e){return Array.isArray(e)?e.map(e=>({frozenProductId:e?.frozenProductId||``,qty:Number(e?.qty)||0})).filter(e=>e.frozenProductId&&e.qty>0):[]}function q(e){return C.filter(t=>j(t)===`sample`&&t.id!==e)}function te(e=``,t=null){return[`<option value="">샘플 선택</option>`,...q(t).map(t=>`<option value="${t.id}" ${e===t.id?`selected`:``}>${t.name}</option>`)].join(``)}function J(e={},t=null){let n=Number(e.qty)>0?Number(e.qty):1;return`
    <div class="sample-set-component-row" style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;align-items:center;margin-bottom:6px;">
      <select class="component-product-id">
        ${te(e.frozenProductId||``,t)}
      </select>
      <input type="number" class="component-qty" min="1" step="1" value="${n}" />
      <button type="button" class="btn-secondary btn-remove-component">삭제</button>
    </div>
  `}function ne(e=``){return String(e).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function re({product:t,frozenLogId:r,date:i,expiry:a,qty:o,staff:s},l){let{setDoc:u}=y(l),d=j(t);if(d!==`product`&&d!==`sample`)return;let f=`frozenLogs:${r}:1`;try{await u(n(c,`productTransferRequests`,f),{idempotencyKey:f,sourceApp:`production`,sourceCollection:`frozenLogs`,sourceId:r,eventType:`productReceipt`,category:`freezeDry`,revision:1,supersedesRevision:null,status:`pending`,frozenProductId:t.id,productName:t.name,recipeName:t.recipeTitleRef||t.name,unitType:d===`sample`?`sample`:`main`,quantity:o,expiryDate:a,producedDate:i,staff:s,createdAt:e()})}catch(e){throw console.error(`동결제품 입고 productTransferRequests 전송 실패`,e),e}}async function Y(e){let t=!e,i=(await a(r(s(c,`bagTypes`),o(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(n=>n.category===`freezeDry`&&(n.active!==!1||!t&&n.id===e?.bagTypeId)),l=await x(),u=A(e),d=j(e),p=K(e?.components),m=(e,t=``)=>e===`sampleSet`?`<input type="text" id="m_name" value="${ne(t)}" placeholder="샘플세트 이름 입력" />`:`
      <select id="m_name">
        ${b(l,t)}
      </select>
    `;Q(`
    <h3 class="modal-title">${t?`동결제품 추가`:`동결제품 수정`}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <div id="m_name_wrap">
        ${m(d,e?.name||``)}
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
          <option value="product" ${d===`product`?`selected`:``}>본품</option>
          <option value="sample" ${d===`sample`?`selected`:``}>샘플</option>
          <option value="sampleSet" ${d===`sampleSet`?`selected`:``}>샘플세트</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>연결 봉투 *</label>
      <select id="m_bagType">
        <option value="">선택</option>
        ${i.map(t=>`<option value="${t.id}" ${e?.bagTypeId===t.id?`selected`:``}>${t.name}${t.active===!1?` (비활성)`:``}</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>분리작업 필요</label>
      <select id="m_separation">
        <option value="false" ${e?.requiresSeparation?``:`selected`}>아니오</option>
        <option value="true" ${e?.requiresSeparation?`selected`:``}>예</option>
      </select>
    </div>
    <div class="form-group" id="m_components_section" style="${d===`sampleSet`?``:`display:none;`}">
      <label>샘플세트 구성</label>
      <div id="m_components_rows">
        ${(p.length>0?p:[{}]).map(t=>J(t,e?.id||null)).join(``)}
      </div>
      <button type="button" class="btn-secondary" id="btnAddComponentRow">+ 구성 샘플 추가</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${t?`추가`:`저장`}</button>
    </div>
  `);let h=()=>{let e=document.getElementById(`m_kind`).value===`sampleSet`;document.getElementById(`m_components_section`).style.display=e?``:`none`},g=()=>{let e=document.getElementById(`m_name`)?.value||``,t=document.getElementById(`m_kind`).value;document.getElementById(`m_name_wrap`).innerHTML=m(t,e)};document.getElementById(`m_kind`)?.addEventListener(`change`,()=>{h(),g()}),document.getElementById(`btnAddComponentRow`)?.addEventListener(`click`,()=>{document.getElementById(`m_components_rows`).insertAdjacentHTML(`beforeend`,J({},e?.id||null))}),document.getElementById(`m_components_rows`)?.addEventListener(`click`,e=>{let t=e.target.closest(`.btn-remove-component`);if(!t)return;let n=t.closest(`.sample-set-component-row`);if(document.querySelectorAll(`.sample-set-component-row`).length<=1){n.querySelector(`.component-product-id`).value=``,n.querySelector(`.component-qty`).value=`1`;return}n.remove()}),document.getElementById(`btnSaveProduct`).addEventListener(`click`,async()=>v($,async r=>{let{addDoc:i,updateDoc:a}=y(r);if(f!==`admin`&&f!==`office`){alert(`동결제품 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let o=document.getElementById(`m_name`).value.trim(),l=o,u=document.getElementById(`m_target`).value,d=document.getElementById(`m_kind`).value,p=document.getElementById(`m_bagType`).value,m=document.getElementById(`m_separation`).value===`true`,h=t?!0:e.active!==!1;if(!o||!p){alert(`제품명과 연결 봉투는 필수입니다.`);return}let g=d===`sampleSet`?Array.from(document.querySelectorAll(`.sample-set-component-row`)).map(e=>({frozenProductId:e.querySelector(`.component-product-id`).value,qty:Number(e.querySelector(`.component-qty`).value)||0})).filter(e=>e.frozenProductId&&e.qty>0):[];if(d===`sampleSet`&&g.length===0){alert(`샘플세트 구성 샘플을 1개 이상 입력해주세요.`);return}let _={name:o,recipeTitleRef:l,target:u,kind:d,components:g,bagTypeId:p,requiresSeparation:m,active:h,sortOrder:t?C.length:e.sortOrder,updatedAt:new Date};t?(_.createdAt=new Date,await i(s(c,`frozenProducts`),_)):await a(n(c,`frozenProducts`,e.id),_),C=await D(),r.isCurrent()&&(closeModal(),r.isCurrent()&&(k(),alert(t?`추가 완료!`:`수정 완료!`)))},{roles:[`admin`,`office`]}))}function ie(e,t){Q(`
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
        ${Z([`senior`,`lead`,`office`]).replace(`value="${t.staffName}"`,`value="${t.staffName}" selected`)}
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
  `),document.getElementById(`btnSaveEditIncoming`).addEventListener(`click`,async()=>v($,async r=>{let{getDoc:i,addDoc:a,updateDoc:o}=y(r),l=document.getElementById(`m_expiry`).value,d=parseInt(document.getElementById(`m_qty`).value),h=document.getElementById(`m_staff`).value,g=document.getElementById(`m_note`).value;if(!d||d<=0){alert(`수량은 1개 이상이어야 합니다.`);return}if(await m(t.date,r))return;if(f!==`admin`&&f!==`office`){alert(`동결제품 입고 수정은 대표/사무실 계정만 가능합니다.`);return}t.qty;let _=t.deductedBagQty||0;if(t.ledgerId){let r=await i(n(c,`stockLedger`,t.ledgerId));if(r.exists()&&r.data().status===`active`){let l=r.data().items||[];for(let t of l){let r=await i(n(c,t.collection,t.docId));if(!r.exists())continue;let l=r.data()[t.field]||0;if(l!==t.after&&!await p({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${t.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))return;let d=l-t.delta;await o(n(c,t.collection,t.docId),{[t.field]:d,updatedAt:new Date}),t.collection===`bagTypes`&&await a(s(c,`bagLogs`),{date:u(),timestamp:new Date,bagTypeId:t.docId,bagNameSnapshot:r.data().name||``,type:`autoDeductReverse`,qty:-t.delta,before:l,after:d,staffName:h,note:`동결제품 입고 수정(롤백) - ${e.name}`})}await o(n(c,`stockLedger`,t.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(t.bagTypeId&&_>0){let e=await i(n(c,`bagTypes`,t.bagTypeId));if(e.exists()){let r=e.data().currentQty||0;await o(n(c,`bagTypes`,t.bagTypeId),{currentQty:r+_,updatedAt:new Date})}}let v=0,b=[];if(e.bagTypeId){let l=await i(n(c,`bagTypes`,e.bagTypeId));if(l.exists()){let i=l.data(),u=i.currentQty||0;if(u<d){if(alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${u}장\n필요 수량: ${d}장\n\n수정이 중단되었습니다. 봉투 재고는 이전 상태로 이미 복원되었습니다.`),!r.isCurrent()||(closeModal(),!r.isCurrent()))return;await U(e);return}let f=u-d,p=new Date;await o(n(c,`bagTypes`,e.bagTypeId),{currentQty:f,updatedAt:p}),v=d;let m=await a(s(c,`bagLogs`),{date:t.date,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:i.name,type:`autoDeduct`,qty:-d,before:u,after:f,staffName:h,note:`동결제품 입고 수정(재차감) - ${e.name}`});b.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-d,before:u,after:f,label:`${i.name} 봉투`,stockUpdatedAtSnapshot:p,bagLogId:m.id})}}let x=null;b.length>0&&(x=(await a(s(c,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:t.id,timestamp:new Date,date:t.date,status:`active`,items:b})).id),await o(n(c,`frozenLogs`,t.id),{qty:d,expiryDate:l,staffName:h,note:g,deductedBagQty:v,ledgerId:x,updatedAt:new Date}),r.isCurrent()&&(closeModal(),r.isCurrent()&&(await U(e),alert(`수정 완료!`)))},{roles:[`admin`,`office`]}))}async function ae(){let e=await a(s(c,`frozenLogs`)),t={};return e.docs.forEach(e=>{let n=e.data();n.status!==`deleted`&&n.productId&&(t[n.productId]=(t[n.productId]||0)+Number(n.qty||0))}),t}async function oe(e){let t=u(),r=d(18),i=j(e)===`sampleSet`?K(e.components):[],a=i.length>0?await ae():{},o=e=>C.find(t=>t.id===e)?.name||`(삭제된 제품)`;Q(`
    <h3 class="modal-title">입고 등록 — ${e.name}</h3>
    <div class="form-group">
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${t}" max="${t}" />
    </div>
    <div class="form-group">
      <label>유통기한 *</label>
      <input type="date" id="m_expiry" value="${r}" />
    </div>
    <div class="form-group">
      <label>봉지수 *</label>
      <input type="number" id="m_qty" placeholder="봉지수 입력" />
    </div>
    ${i.length>0?`
      <div class="form-group" id="m_compPreview" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:12.5px;color:#555;">
        세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.
      </div>
    `:``}
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`senior`,`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),i.length>0&&document.getElementById(`m_qty`).addEventListener(`input`,e=>{let t=parseInt(e.target.value)||0,n=document.getElementById(`m_compPreview`);if(n){if(t<=0){n.innerHTML=`세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.`,n.style.color=`#555`;return}n.innerHTML=i.map(e=>{let n=t*e.qty,r=a[e.frozenProductId]||0,i=r-n,s=i<0;return`<div style="margin-bottom:2px;${s?`color:#e53e3e;font-weight:600;`:``}">
          ${o(e.frozenProductId)} -${n}개 (현재 ${r} → ${i})${s?` ⚠️ 재고 부족`:``}
        </div>`}).join(``)}}),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>v($,async r=>{let{getDoc:l,addDoc:u,updateDoc:d,recordActivity:f}=y(r),h=document.getElementById(`m_date`).value,g=document.getElementById(`m_expiry`).value,_=parseInt(document.getElementById(`m_qty`).value),v=document.getElementById(`m_staff`).value;if(!h){alert(`날짜를 입력해주세요.`);return}if(h>t){alert(`미래 날짜는 입력할 수 없습니다.`);return}if(!g){alert(`유통기한을 입력해주세요.`);return}if(g<h){alert(`유통기한이 입고일보다 빠릅니다.`);return}if(!_||_<=0){alert(`봉지수를 입력해주세요.`);return}if(!v){alert(`담당자는 필수입니다.`);return}if(await m(h,r))return;if(i.length>0){let e=i.map(e=>({name:o(e.frozenProductId),need:_*e.qty,cur:a[e.frozenProductId]||0})).filter(e=>e.cur<e.need);if(e.length>0&&!await p({title:`구성품 재고 부족`,message:`다음 구성품 재고가 부족합니다:\n\n${e.map(e=>`${e.name}: 현재 ${e.cur}개 / 필요 ${e.need}개`).join(`
`)}\n\n그래도 진행하면 재고가 음수로 기록됩니다.\n계속하시겠습니까?`,confirmText:`진행`,danger:!0}))return}let b=0,x=[];if(e.bagTypeId){let t=await l(n(c,`bagTypes`,e.bagTypeId));if(t.exists()){let r=t.data(),i=r.currentQty||0;if(i<_){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${i}장\n필요 수량: ${_}장`);return}let a=i-_,o=new Date;await d(n(c,`bagTypes`,e.bagTypeId),{currentQty:a,updatedAt:o}),b=_;let l=await u(s(c,`bagLogs`),{date:h,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:r.name,type:`autoDeduct`,qty:-_,before:i,after:a,staffName:v,note:`동결제품 입고 자동차감 - ${e.name}`});x.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-_,before:i,after:a,label:`${r.name} 봉투`,stockUpdatedAtSnapshot:o,bagLogId:l.id})}}let S=await u(s(c,`frozenLogs`),{date:h,timestamp:new Date,productId:e.id,productNameSnapshot:e.name,componentsSnapshot:j(e)===`sampleSet`?K(e.components):null,expiryDate:g,qty:_,bagTypeId:e.bagTypeId||null,deductedBagQty:b,staffName:v,note:``,status:`active`,ledgerId:null}),C=[];for(let t of i){let n=_*t.qty,r=await u(s(c,`frozenLogs`),{date:h,timestamp:new Date,productId:t.frozenProductId,productNameSnapshot:o(t.frozenProductId),componentsSnapshot:null,expiryDate:null,qty:-n,bagTypeId:null,deductedBagQty:0,staffName:v,note:`샘플세트 제작 자동차감 - ${e.name} ${_}세트`,status:`active`,ledgerId:null,sampleSetLogId:S.id});C.push(r.id)}if(C.length>0&&await d(n(c,`frozenLogs`,S.id),{componentDeductLogIds:C}),await re({product:e,frozenLogId:S.id,date:h,expiry:g,qty:_,staff:v},r),x.length>0){let e=await u(s(c,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:S.id,timestamp:new Date,date:h,status:`active`,items:x});await d(n(c,`frozenLogs`,S.id),{ledgerId:e.id})}await f({action:`frozenProduct`,subAction:`incoming`,date:h,staff:v,message:`동결제품 입고 — ${e.name} +${_}봉 / 담당: ${v}`,details:{frozenLogId:S.id,productId:e.id,productName:e.name,componentsSnapshot:j(e)===`sampleSet`?K(e.components):null,qty:_,expiryDate:g||null,deductedBagQty:b,bagTypeId:e.bagTypeId||null,note:null}}),r.isCurrent()&&(closeModal(),r.isCurrent()&&(await U(e),alert(`입고 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}var X={};function Z(e){let t=``;for(let n of e)(X[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function se(){return f===`admin`?`대표`:f===`office`?`사무실`:f===`production`?`생산실`:`시스템`}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}l(`frozenProduct`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var $=g(`frozenProduct`);$.refresh=E;export{E as renderFrozenProduct};