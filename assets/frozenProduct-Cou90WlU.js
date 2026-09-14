import{T as e,_ as t,b as n,d as r,g as i,h as a,i as o,n as s,o as c,p as l,r as u,u as d,y as f}from"./index.esm-rHmxwfvm.js";import{n as p}from"./firebase-qGjqjNvO.js";import{n as m}from"./modalManager-Z4b2ihO9.js";import{E as h,H as g,P as _,g as v}from"./index-ihWgJTcM.js";import{n as y}from"./activityLogs-Jg2Ymepu.js";import{t as b}from"./closingGuard-BCSnBl5U.js";import{t as x}from"./sortable-DoCboJo0.js";import{n as S,t as ee}from"./recipe-Cc33zif5.js";var C=[],w=null,T=`frozenProductCategoryCollapsed`,E=[{key:`cat-product`,label:`고양이`,target:`cat`,kind:`product`},{key:`dog-product`,label:`강아지`,target:`dog`,kind:`product`},{key:`common-product`,label:`공용`,target:`common`,kind:`product`},{key:`cat-sample`,label:`고양이샘플`,target:`cat`,kind:`sample`},{key:`dog-sample`,label:`강아지샘플`,target:`dog`,kind:`sample`},{key:`common-sample`,label:`공용샘플`,target:`common`,kind:`sample`},{key:`sample-set`,label:`샘플세트`,target:null,kind:`sampleSet`}];async function D(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결제품 입고 로딩 중...</p></div>`;let[t]=await Promise.all([O(),se()]);e.isConnected&&(C=t,A())}async function O(){return(await c(r(f(p,`frozenProducts`),d(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function k(e){return(await c(r(f(p,`frozenLogs`),d(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.productId===e&&t.status!==`deleted`).slice(0,30)}function A(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${g===`admin`||g===`office`?`<button class="btn-primary" id="btnNewProduct">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="productList">
          ${F()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `,R(),I(),document.getElementById(`btnNewProduct`)?.addEventListener(`click`,H)}function j(e){let t=e?.name||``;return[`cat`,`dog`,`common`].includes(e?.target)?e.target:t.startsWith(`고양이 `)?`cat`:t.startsWith(`강아지 `)?`dog`:`common`}function M(e){return[`product`,`sample`,`sampleSet`].includes(e?.kind)?e.kind:`product`}function te(e){let t=M(e);return t===`sampleSet`?`sample-set`:`${j(e)}-${t}`}function N(){try{let e=JSON.parse(localStorage.getItem(T)||`{}`);return e&&typeof e==`object`?e:{}}catch{return{}}}function ne(e,t){let n=N();n[e]=t,localStorage.setItem(T,JSON.stringify(n))}function re(e){let t=g===`admin`||g===`office`;return`
    <div class="recipe-list-item ${w===e.id?`active`:``}"
      data-id="${e.id}" style="padding:3px 8px;min-height:28px;">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>`:``}
      <div class="recipe-list-info" style="gap:0;">
        <span class="recipe-name" style="font-size:12.5px;line-height:1.2;">${e.name}</span>
      </div>
    </div>
  `}function P(){let e=N();return E.map(t=>{let n=C.filter(e=>te(e)===t.key),r=e[t.key]===!0;return`
        <div class="frozen-product-category" data-category="${t.key}">
          <button type="button" class="frozen-product-category-header" data-category="${t.key}"
            style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin:3px 0 1px;border:0;background:#f5f5f5;border-radius:6px;cursor:pointer;font-weight:700;font-size:12.5px;color:#333;">
            <span>${r?`▶`:`▼`} ${t.label}</span>
            <span style="font-size:11px;color:#777;">${n.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${t.key}" style="${r?`display:none;`:``}">
            ${n.length===0?`<div style="padding:4px 8px;color:#aaa;font-size:11.5px;">등록된 제품 없음</div>`:n.map(re).join(``)}
          </div>
        </div>
      `}).join(``)}function F(){return P()}function I(){g!==`admin`&&g!==`office`||document.querySelectorAll(`.frozen-product-category-items`).forEach(e=>{x.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,group:{name:`frozenProduct-${e.dataset.category||`group`}`,pull:!1,put:!1},onEnd:async e=>{e.oldIndex!==e.newIndex&&await L()}})})}async function L(){let e=document.getElementById(`productList`);if(!e)return;let r=Array.from(e.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),i=new Date,a=t(p);r.forEach((e,t)=>{a.update(n(p,`frozenProducts`,e),{sortOrder:t,updatedAt:i})});try{await a.commit();let e=new Map(r.map((e,t)=>[e,t]));C=C.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:i}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){if(console.error(`[frozenProduct] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),C=await O(),A(),w){let e=C.find(e=>e.id===w);e&&await V(e)}}}function R(){document.querySelectorAll(`.frozen-product-category-header`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.category,n=document.querySelector(`.frozen-product-category-items[data-category="${t}"]`);if(!(!t||!n)&&(ne(t,n.style.display!==`none`),A(),w)){let e=C.find(e=>e.id===w);e&&V(e)}})}),document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,async t=>{t.target.closest(`.drag-handle`)||(w=e.dataset.id,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await V(C.find(e=>e.id===w)))})})}async function z(e){return(await c(r(f(p,`frozenLogs`),i(`productId`,`==`,e)))).docs.map(e=>e.data()).filter(e=>e.status!==`deleted`).length}async function B(e){if(g!==`admin`&&g!==`office`){alert(`동결제품 삭제는 관리자/사무 계정만 가능합니다.`);return}let t=await z(e.id);if(t>0){alert(`사용 이력이 ${t}건 있어 삭제할 수 없습니다.`);return}await v({title:`동결제품 삭제`,message:`${e.name} 제품을 삭제하시겠습니까?\n입고 이력이 없는 제품만 완전히 삭제됩니다.`,confirmText:`삭제`,danger:!0})&&(await u(n(p,`frozenProducts`,e.id)),await y({action:`frozenProduct`,subAction:`delete`,date:_(),staff:ce(),message:`동결제품 삭제 — ${e.name}`,details:{productId:e.id,productName:e.name,bagTypeId:e.bagTypeId||null}}),C=C.filter(t=>t.id!==e.id),w===e.id&&(w=null),A(),alert(`삭제 완료!`))}async function V(e){let t=document.getElementById(`productDetail`),r=await k(e.id),i=g===`admin`||g===`office`;t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        ${i?`<button class="btn-secondary" id="btnEditProduct">수정</button>`:``}
        ${i?`<button class="btn-secondary" id="btnDeleteProduct">삭제</button>`:``}
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
              ${r.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:r.map(t=>`
                  <tr>
                    <td>${t.date||`-`}</td>
                    <td>${t.expiryDate||`-`}</td>
                    <td>${t.qty}</td>
                    <td>${t.deductedBagQty||`-`}</td>
                    <td>${t.staffName||`-`}</td>
                    <td>${t.note||`-`}</td>
                    <td>
                      ${i?`
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
  `,document.getElementById(`btnAddIncoming`)?.addEventListener(`click`,()=>oe(e)),document.getElementById(`btnEditProduct`)?.addEventListener(`click`,()=>U(e)),document.getElementById(`btnDeleteProduct`)?.addEventListener(`click`,()=>B(e)),document.querySelectorAll(`.btn-edit-row`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.logid,i=await o(n(p,`frozenLogs`,r));if(!i.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}ie(e,{id:r,...i.data()})})}),document.querySelectorAll(`.btn-del-row`).forEach(t=>{t.addEventListener(`click`,async()=>{if(g!==`admin`&&g!==`office`){alert(`동결제품 입고 삭제는 대표/사무실 계정만 가능합니다.`);return}if(!await v({title:`동결제품 입고 삭제`,message:`삭제하시겠습니까?
차감된 봉투 재고가 복원됩니다.`,confirmText:`삭제`,danger:!0}))return;let r=t.dataset.logid,i=await o(n(p,`frozenLogs`,r));if(!i.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}let c=i.data();if(await b(c.date))return;if(c.ledgerId){let e=await o(n(p,`stockLedger`,c.ledgerId));if(e.exists()&&e.data().status===`active`){let t=e.data().items||[];for(let e of t){let t=await o(n(p,e.collection,e.docId));if(!t.exists())continue;let r=t.data()[e.field]||0;if(r!==e.after&&!await v({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))continue;let i=r-e.delta;await a(n(p,e.collection,e.docId),{[e.field]:i,updatedAt:new Date}),e.collection===`bagTypes`&&await s(f(p,`bagLogs`),{date:_(),timestamp:new Date,bagTypeId:e.docId,bagNameSnapshot:t.data().name||``,type:`autoDeductReverse`,qty:-e.delta,before:r,after:i,staffName:c.staffName||``,note:`동결제품 입고 삭제 복원 - ${c.productNameSnapshot||``}`})}await a(n(p,`stockLedger`,c.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(c.bagTypeId&&(c.deductedBagQty||0)>0){let e=await o(n(p,`bagTypes`,c.bagTypeId));if(e.exists()){let t=e.data().currentQty||0;await a(n(p,`bagTypes`,c.bagTypeId),{currentQty:t+c.deductedBagQty,updatedAt:new Date})}}await a(n(p,`frozenLogs`,r),{status:`deleted`});let l=c.componentDeductLogIds||[];for(let e of l)await a(n(p,`frozenLogs`,e),{status:`deleted`});await V(e),alert(`삭제 완료!`)})})}function H(){X(null)}function U(e){X(e)}function W(e){return Array.isArray(e)?e.map(e=>({frozenProductId:e?.frozenProductId||``,qty:Number(e?.qty)||0})).filter(e=>e.frozenProductId&&e.qty>0):[]}function G(e){return C.filter(t=>M(t)===`sample`&&t.id!==e)}function K(e=``,t=null){return[`<option value="">샘플 선택</option>`,...G(t).map(t=>`<option value="${t.id}" ${e===t.id?`selected`:``}>${t.name}</option>`)].join(``)}function q(e={},t=null){let n=Number(e.qty)>0?Number(e.qty):1;return`
    <div class="sample-set-component-row" style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;align-items:center;margin-bottom:6px;">
      <select class="component-product-id">
        ${K(e.frozenProductId||``,t)}
      </select>
      <input type="number" class="component-qty" min="1" step="1" value="${n}" />
      <button type="button" class="btn-secondary btn-remove-component">삭제</button>
    </div>
  `}function J(e=``){return String(e).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function Y({product:t,frozenLogId:r,date:i,expiry:a,qty:o,staff:s}){let c=M(t);if(c!==`product`&&c!==`sample`)return;let u=`frozenLogs:${r}:1`;try{await l(n(p,`productTransferRequests`,u),{idempotencyKey:u,sourceApp:`production`,sourceCollection:`frozenLogs`,sourceId:r,eventType:`productReceipt`,category:`freezeDry`,revision:1,supersedesRevision:null,status:`pending`,frozenProductId:t.id,productName:t.name,recipeName:t.recipeTitleRef||t.name,unitType:c===`sample`?`sample`:`main`,quantity:o,expiryDate:a,producedDate:i,staff:s,createdAt:e()})}catch(e){console.error(`동결제품 입고 productTransferRequests 전송 실패`,e)}}async function X(e){let t=!e,i=(await c(r(f(p,`bagTypes`),d(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(n=>n.category===`freezeDry`&&(n.active!==!1||!t&&n.id===e?.bagTypeId)),o=await ee(),l=j(e),u=M(e),m=W(e?.components),h=(e,t=``)=>e===`sampleSet`?`<input type="text" id="m_name" value="${J(t)}" placeholder="샘플세트 이름 입력" />`:`
      <select id="m_name">
        ${S(o,t)}
      </select>
    `;$(`
    <h3 class="modal-title">${t?`동결제품 추가`:`동결제품 수정`}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <div id="m_name_wrap">
        ${h(u,e?.name||``)}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종 *</label>
        <select id="m_target">
          <option value="cat" ${l===`cat`?`selected`:``}>고양이</option>
          <option value="dog" ${l===`dog`?`selected`:``}>강아지</option>
          <option value="common" ${l===`common`?`selected`:``}>공용</option>
        </select>
      </div>
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_kind">
          <option value="product" ${u===`product`?`selected`:``}>본품</option>
          <option value="sample" ${u===`sample`?`selected`:``}>샘플</option>
          <option value="sampleSet" ${u===`sampleSet`?`selected`:``}>샘플세트</option>
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
    <div class="form-group" id="m_components_section" style="${u===`sampleSet`?``:`display:none;`}">
      <label>샘플세트 구성</label>
      <div id="m_components_rows">
        ${(m.length>0?m:[{}]).map(t=>q(t,e?.id||null)).join(``)}
      </div>
      <button type="button" class="btn-secondary" id="btnAddComponentRow">+ 구성 샘플 추가</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${t?`추가`:`저장`}</button>
    </div>
  `);let _=()=>{let e=document.getElementById(`m_kind`).value===`sampleSet`;document.getElementById(`m_components_section`).style.display=e?``:`none`},v=()=>{let e=document.getElementById(`m_name`)?.value||``,t=document.getElementById(`m_kind`).value;document.getElementById(`m_name_wrap`).innerHTML=h(t,e)};document.getElementById(`m_kind`)?.addEventListener(`change`,()=>{_(),v()}),document.getElementById(`btnAddComponentRow`)?.addEventListener(`click`,()=>{document.getElementById(`m_components_rows`).insertAdjacentHTML(`beforeend`,q({},e?.id||null))}),document.getElementById(`m_components_rows`)?.addEventListener(`click`,e=>{let t=e.target.closest(`.btn-remove-component`);if(!t)return;let n=t.closest(`.sample-set-component-row`);if(document.querySelectorAll(`.sample-set-component-row`).length<=1){n.querySelector(`.component-product-id`).value=``,n.querySelector(`.component-qty`).value=`1`;return}n.remove()}),document.getElementById(`btnSaveProduct`).addEventListener(`click`,async()=>{if(g!==`admin`&&g!==`office`){alert(`동결제품 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let r=document.getElementById(`m_name`).value.trim(),i=r,o=document.getElementById(`m_target`).value,c=document.getElementById(`m_kind`).value,l=document.getElementById(`m_bagType`).value,u=document.getElementById(`m_separation`).value===`true`,d=t?!0:e.active!==!1;if(!r||!l){alert(`제품명과 연결 봉투는 필수입니다.`);return}let m=c===`sampleSet`?Array.from(document.querySelectorAll(`.sample-set-component-row`)).map(e=>({frozenProductId:e.querySelector(`.component-product-id`).value,qty:Number(e.querySelector(`.component-qty`).value)||0})).filter(e=>e.frozenProductId&&e.qty>0):[];if(c===`sampleSet`&&m.length===0){alert(`샘플세트 구성 샘플을 1개 이상 입력해주세요.`);return}let h={name:r,recipeTitleRef:i,target:o,kind:c,components:m,bagTypeId:l,requiresSeparation:u,active:d,sortOrder:t?C.length:e.sortOrder,updatedAt:new Date};t?(h.createdAt=new Date,await s(f(p,`frozenProducts`),h)):await a(n(p,`frozenProducts`,e.id),h),C=await O(),closeModal(),A(),alert(t?`추가 완료!`:`수정 완료!`)})}function ie(e,t){$(`
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
  `),document.getElementById(`btnSaveEditIncoming`).addEventListener(`click`,async()=>{let r=document.getElementById(`m_expiry`).value,i=parseInt(document.getElementById(`m_qty`).value),c=document.getElementById(`m_staff`).value,l=document.getElementById(`m_note`).value;if(!i||i<=0){alert(`수량은 1개 이상이어야 합니다.`);return}if(await b(t.date))return;if(g!==`admin`&&g!==`office`){alert(`동결제품 입고 수정은 대표/사무실 계정만 가능합니다.`);return}t.qty;let u=t.deductedBagQty||0;if(t.ledgerId){let r=await o(n(p,`stockLedger`,t.ledgerId));if(r.exists()&&r.data().status===`active`){let i=r.data().items||[];for(let t of i){let r=await o(n(p,t.collection,t.docId));if(!r.exists())continue;let i=r.data()[t.field]||0;if(i!==t.after&&!await v({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${t.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))return;let l=i-t.delta;await a(n(p,t.collection,t.docId),{[t.field]:l,updatedAt:new Date}),t.collection===`bagTypes`&&await s(f(p,`bagLogs`),{date:_(),timestamp:new Date,bagTypeId:t.docId,bagNameSnapshot:r.data().name||``,type:`autoDeductReverse`,qty:-t.delta,before:i,after:l,staffName:c,note:`동결제품 입고 수정(롤백) - ${e.name}`})}await a(n(p,`stockLedger`,t.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(t.bagTypeId&&u>0){let e=await o(n(p,`bagTypes`,t.bagTypeId));if(e.exists()){let r=e.data().currentQty||0;await a(n(p,`bagTypes`,t.bagTypeId),{currentQty:r+u,updatedAt:new Date})}}let d=0,m=[];if(e.bagTypeId){let r=await o(n(p,`bagTypes`,e.bagTypeId));if(r.exists()){let o=r.data(),l=o.currentQty||0;if(l<i){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${l}장\n필요 수량: ${i}장\n\n수정이 중단되었습니다. 봉투 재고는 이전 상태로 이미 복원되었습니다.`),closeModal(),await V(e);return}let u=l-i,h=new Date;await a(n(p,`bagTypes`,e.bagTypeId),{currentQty:u,updatedAt:h}),d=i;let g=await s(f(p,`bagLogs`),{date:t.date,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:o.name,type:`autoDeduct`,qty:-i,before:l,after:u,staffName:c,note:`동결제품 입고 수정(재차감) - ${e.name}`});m.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-i,before:l,after:u,label:`${o.name} 봉투`,stockUpdatedAtSnapshot:h,bagLogId:g.id})}}let h=null;m.length>0&&(h=(await s(f(p,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:t.id,timestamp:new Date,date:t.date,status:`active`,items:m})).id),await a(n(p,`frozenLogs`,t.id),{qty:i,expiryDate:r,staffName:c,note:l,deductedBagQty:d,ledgerId:h,updatedAt:new Date}),closeModal(),await V(e),alert(`수정 완료!`)})}async function ae(){let e=await c(f(p,`frozenLogs`)),t={};return e.docs.forEach(e=>{let n=e.data();n.status!==`deleted`&&n.productId&&(t[n.productId]=(t[n.productId]||0)+Number(n.qty||0))}),t}async function oe(e){let t=_(),r=h(18),i=M(e)===`sampleSet`?W(e.components):[],c=i.length>0?await ae():{},l=e=>C.find(t=>t.id===e)?.name||`(삭제된 제품)`;$(`
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
        ${Q([`senior`,`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),i.length>0&&document.getElementById(`m_qty`).addEventListener(`input`,e=>{let t=parseInt(e.target.value)||0,n=document.getElementById(`m_compPreview`);if(n){if(t<=0){n.innerHTML=`세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.`,n.style.color=`#555`;return}n.innerHTML=i.map(e=>{let n=t*e.qty,r=c[e.frozenProductId]||0,i=r-n,a=i<0;return`<div style="margin-bottom:2px;${a?`color:#e53e3e;font-weight:600;`:``}">
          ${l(e.frozenProductId)} -${n}개 (현재 ${r} → ${i})${a?` ⚠️ 재고 부족`:``}
        </div>`}).join(``)}}),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>{let r=document.getElementById(`m_date`).value,u=document.getElementById(`m_expiry`).value,d=parseInt(document.getElementById(`m_qty`).value),m=document.getElementById(`m_staff`).value;if(!r){alert(`날짜를 입력해주세요.`);return}if(r>t){alert(`미래 날짜는 입력할 수 없습니다.`);return}if(!u){alert(`유통기한을 입력해주세요.`);return}if(u<r){alert(`유통기한이 입고일보다 빠릅니다.`);return}if(!d||d<=0){alert(`봉지수를 입력해주세요.`);return}if(!m){alert(`담당자는 필수입니다.`);return}if(await b(r))return;if(i.length>0){let e=i.map(e=>({name:l(e.frozenProductId),need:d*e.qty,cur:c[e.frozenProductId]||0})).filter(e=>e.cur<e.need);if(e.length>0&&!await v({title:`구성품 재고 부족`,message:`다음 구성품 재고가 부족합니다:\n\n${e.map(e=>`${e.name}: 현재 ${e.cur}개 / 필요 ${e.need}개`).join(`
`)}\n\n그래도 진행하면 재고가 음수로 기록됩니다.\n계속하시겠습니까?`,confirmText:`진행`,danger:!0}))return}let h=0,g=[];if(e.bagTypeId){let t=await o(n(p,`bagTypes`,e.bagTypeId));if(t.exists()){let i=t.data(),o=i.currentQty||0;if(o<d){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${o}장\n필요 수량: ${d}장`);return}let c=o-d,l=new Date;await a(n(p,`bagTypes`,e.bagTypeId),{currentQty:c,updatedAt:l}),h=d;let u=await s(f(p,`bagLogs`),{date:r,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:i.name,type:`autoDeduct`,qty:-d,before:o,after:c,staffName:m,note:`동결제품 입고 자동차감 - ${e.name}`});g.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-d,before:o,after:c,label:`${i.name} 봉투`,stockUpdatedAtSnapshot:l,bagLogId:u.id})}}let _=await s(f(p,`frozenLogs`),{date:r,timestamp:new Date,productId:e.id,productNameSnapshot:e.name,componentsSnapshot:M(e)===`sampleSet`?W(e.components):null,expiryDate:u,qty:d,bagTypeId:e.bagTypeId||null,deductedBagQty:h,staffName:m,note:``,status:`active`,ledgerId:null}),x=[];for(let t of i){let n=d*t.qty,i=await s(f(p,`frozenLogs`),{date:r,timestamp:new Date,productId:t.frozenProductId,productNameSnapshot:l(t.frozenProductId),componentsSnapshot:null,expiryDate:null,qty:-n,bagTypeId:null,deductedBagQty:0,staffName:m,note:`샘플세트 제작 자동차감 - ${e.name} ${d}세트`,status:`active`,ledgerId:null,sampleSetLogId:_.id});x.push(i.id)}if(x.length>0&&await a(n(p,`frozenLogs`,_.id),{componentDeductLogIds:x}),await Y({product:e,frozenLogId:_.id,date:r,expiry:u,qty:d,staff:m}),g.length>0){let e=await s(f(p,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:_.id,timestamp:new Date,date:r,status:`active`,items:g});await a(n(p,`frozenLogs`,_.id),{ledgerId:e.id})}await y({action:`frozenProduct`,subAction:`incoming`,date:r,staff:m,message:`동결제품 입고 — ${e.name} +${d}봉 / 담당: ${m}`,details:{frozenLogId:_.id,productId:e.id,productName:e.name,componentsSnapshot:M(e)===`sampleSet`?W(e.components):null,qty:d,expiryDate:u||null,deductedBagQty:h,bagTypeId:e.bagTypeId||null,note:null}}),closeModal(),await V(e),alert(`입고 등록 완료!`)})}var Z={};async function se(){Object.keys(Z).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await o(n(p,`staffGroups`,e));t.exists()&&(Z[e]=t.data().members||[])}))}function Q(e){let t=``;for(let n of e)(Z[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function ce(){return g===`admin`?`대표`:g===`office`?`사무실`:g===`production`?`생산실`:`시스템`}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}m(`frozenProduct`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{D as renderFrozenProduct};