import{T as e,a as t,b as n,d as r,g as i,s as a,u as o,y as s}from"./index.esm-CWp5uCwe.js";import{n as c}from"./firebase-Bm8Fqw4J.js";import{r as l}from"./pageLifecycle-_b6L3DA3.js";import{n as u}from"./modalManager-D53QKIlh.js";import{n as d}from"./modal-IG9zwovL.js";import{A as f,G as p,L as m,f as h}from"./index-Bz29BJQj.js";import"./activityLogs-DF7fKjgJ.js";import{t as g}from"./statusToast-DAQ_Eu62.js";import{t as _}from"./closingGuard-DfB1_vDK.js";import{t as v}from"./sortable-D4-rSntl.js";import{t as y}from"./pageRefresh-CdW1Snoh.js";import{t as b}from"./pageCommand-Bi0DQ4tv.js";import{t as x}from"./commandWrites-WiNRguqH.js";import{n as S,t as C}from"./recipe-DZIBRSu5.js";import{t as w}from"./pageStaff-CCF6NjM9.js";var T=[],E=null,D=`frozenProductCategoryCollapsed`,ee=[{key:`cat-product`,label:`고양이`,target:`cat`,kind:`product`},{key:`dog-product`,label:`강아지`,target:`dog`,kind:`product`},{key:`common-product`,label:`공용`,target:`common`,kind:`product`},{key:`cat-sample`,label:`고양이샘플`,target:`cat`,kind:`sample`},{key:`dog-sample`,label:`강아지샘플`,target:`dog`,kind:`sample`},{key:`common-sample`,label:`공용샘플`,target:`common`,kind:`sample`},{key:`sample-set`,label:`샘플세트`,target:null,kind:`sampleSet`}];async function O({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">동결제품 입고 로딩 중...</p>`;let n=await Q.load(e=>$(e),{force:e,onChange:y(Q,O)});if(!(!n||!t.isConnected)&&(T=n.products,Y=n.staff,j(),E)){let e=T.find(e=>e.id===E);e&&await W(e)}}async function k(e={getDocs:a,getDoc:t}){let n=r(s(c,`frozenProducts`),o(`sortOrder`));return(await e.getDocs(n)).docs.map(e=>({id:e.id,...e.data()}))}async function A(e){return(await a(r(s(c,`frozenLogs`),o(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.productId===e&&t.status!==`deleted`).slice(0,30)}function j(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${p===`admin`||p===`office`?`<button class="btn-primary" id="btnNewProduct">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="productList">
          ${R()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `,V(),z(),document.getElementById(`btnNewProduct`)?.addEventListener(`click`,G)}function M(e){let t=e?.name||``;return[`cat`,`dog`,`common`].includes(e?.target)?e.target:t.startsWith(`고양이 `)?`cat`:t.startsWith(`강아지 `)?`dog`:`common`}function N(e){return[`product`,`sample`,`sampleSet`].includes(e?.kind)?e.kind:`product`}function te(e){let t=N(e);return t===`sampleSet`?`sample-set`:`${M(e)}-${t}`}function P(){try{let e=JSON.parse(localStorage.getItem(D)||`{}`);return e&&typeof e==`object`?e:{}}catch{return{}}}function F(e,t){let n=P();n[e]=t,localStorage.setItem(D,JSON.stringify(n))}function I(e){let t=p===`admin`||p===`office`;return`
    <div class="recipe-list-item ${E===e.id?`active`:``}"
      data-id="${e.id}" style="padding:3px 8px;min-height:28px;">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>`:``}
      <div class="recipe-list-info" style="gap:0;">
        <span class="recipe-name" style="font-size:12.5px;line-height:1.2;">${e.name}</span>
      </div>
    </div>
  `}function L(){let e=P();return ee.map(t=>{let n=T.filter(e=>te(e)===t.key),r=e[t.key]===!0;return`
        <div class="frozen-product-category" data-category="${t.key}">
          <button type="button" class="frozen-product-category-header" data-category="${t.key}"
            style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin:3px 0 1px;border:0;background:#f5f5f5;border-radius:6px;cursor:pointer;font-weight:700;font-size:12.5px;color:#333;">
            <span>${r?`▶`:`▼`} ${t.label}</span>
            <span style="font-size:11px;color:#777;">${n.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${t.key}" style="${r?`display:none;`:``}">
            ${n.length===0?`<div style="padding:4px 8px;color:#aaa;font-size:11.5px;">등록된 제품 없음</div>`:n.map(I).join(``)}
          </div>
        </div>
      `}).join(``)}function R(){return L()}function z(){p!==`admin`&&p!==`office`||document.querySelectorAll(`.frozen-product-category-items`).forEach(e=>{v.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,group:{name:`frozenProduct-${e.dataset.category||`group`}`,pull:!1,put:!1},onEnd:async e=>{e.oldIndex!==e.newIndex&&await B()}})})}async function B(){return b(Q,async e=>{let{writeBatch:t}=x(e),r=document.getElementById(`productList`);if(!r)return;let i=Array.from(r.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),a=new Date,o=t(c);i.forEach((e,t)=>{o.update(n(c,`frozenProducts`,e),{sortOrder:t,updatedAt:a})});try{await o.commit();let e=new Map(i.map((e,t)=>[e,t]));T=T.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:a}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(t){if(console.error(`[frozenProduct] reorder save failed:`,t),alert(`순번 저장 실패: `+(t.message||t)),T=await k(),!e.isCurrent())return;if(j(),E){let e=T.find(e=>e.id===E);e&&await W(e)}}},{roles:[`admin`,`office`]})}function V(){document.querySelectorAll(`.frozen-product-category-header`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.category,n=document.querySelector(`.frozen-product-category-items[data-category="${t}"]`);if(!(!t||!n)&&(F(t,n.style.display!==`none`),j(),E)){let e=T.find(e=>e.id===E);e&&W(e)}})}),document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,async t=>{t.target.closest(`.drag-handle`)||(E=e.dataset.id,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await W(T.find(e=>e.id===E)))})})}async function H(e,t={getDocs:a}){return(await t.getDocs(r(s(c,`frozenLogs`),i(`productId`,`==`,e)))).docs.map(e=>e.data()).filter(e=>e.status!==`deleted`).length}async function U(e){return b(Q,async t=>{let{deleteDoc:r,recordActivity:i}=x(t);if(p!==`admin`&&p!==`office`){alert(`동결제품 삭제는 관리자/사무 계정만 가능합니다.`);return}let a=await H(e.id,t);if(a>0){alert(`사용 이력이 ${a}건 있어 삭제할 수 없습니다.`);return}await d({title:`동결제품 삭제`,message:`${e.name} 제품을 삭제하시겠습니까?\n입고 이력이 없는 제품만 완전히 삭제됩니다.`,confirmText:`삭제`,danger:!0})&&(await r(n(c,`frozenProducts`,e.id)),await i({action:`frozenProduct`,subAction:`delete`,date:m(),staff:ue(),message:`동결제품 삭제 — ${e.name}`,details:{productId:e.id,productName:e.name,bagTypeId:e.bagTypeId||null}}),T=T.filter(t=>t.id!==e.id),E===e.id&&(E=null),t.isCurrent()&&(j(),alert(`삭제 완료!`)))},{roles:[`admin`,`office`]})}async function W(e){let r=document.getElementById(`productDetail`),i=await A(e.id);if(!r?.isConnected||E!==e.id)return;let a=p===`admin`||p===`office`;r.innerHTML=`
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
  `,document.getElementById(`btnAddIncoming`)?.addEventListener(`click`,()=>le(e)),document.getElementById(`btnEditProduct`)?.addEventListener(`click`,()=>ne(e)),document.getElementById(`btnDeleteProduct`)?.addEventListener(`click`,()=>U(e)),document.querySelectorAll(`.btn-edit-row`).forEach(r=>{r.addEventListener(`click`,async()=>{let i=r.dataset.logid,a=await t(n(c,`frozenLogs`,i));if(!a.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}se(e,{id:i,...a.data()})})}),document.querySelectorAll(`.btn-del-row`).forEach(t=>{t.addEventListener(`click`,async()=>b(Q,async r=>{let{getDoc:i,addDoc:a,updateDoc:o}=x(r);if(p!==`admin`&&p!==`office`){alert(`동결제품 입고 삭제는 대표/사무실 계정만 가능합니다.`);return}if(!await d({title:`동결제품 입고 삭제`,message:`삭제하시겠습니까?
차감된 봉투 재고가 복원됩니다.`,confirmText:`삭제`,danger:!0}))return;let l=t.dataset.logid,u=await i(n(c,`frozenLogs`,l));if(!u.exists()){alert(`입고 로그를 찾을 수 없습니다.`);return}let f=u.data();if(await _(f.date,r))return;if(f.ledgerId){let e=await i(n(c,`stockLedger`,f.ledgerId));if(e.exists()&&e.data().status===`active`){let t=e.data().items||[];for(let e of t){let t=await i(n(c,e.collection,e.docId));if(!t.exists())continue;let r=t.data()[e.field]||0;if(r!==e.after&&!await d({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${e.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))continue;let l=r-e.delta;await o(n(c,e.collection,e.docId),{[e.field]:l,updatedAt:new Date}),e.collection===`bagTypes`&&await a(s(c,`bagLogs`),{date:m(),timestamp:new Date,bagTypeId:e.docId,bagNameSnapshot:t.data().name||``,type:`autoDeductReverse`,qty:-e.delta,before:r,after:l,staffName:f.staffName||``,note:`동결제품 입고 삭제 복원 - ${f.productNameSnapshot||``}`})}await o(n(c,`stockLedger`,f.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(f.bagTypeId&&(f.deductedBagQty||0)>0){let e=await i(n(c,`bagTypes`,f.bagTypeId));if(e.exists()){let t=e.data().currentQty||0;await o(n(c,`bagTypes`,f.bagTypeId),{currentQty:t+f.deductedBagQty,updatedAt:new Date})}}await o(n(c,`frozenLogs`,l),{status:`deleted`});let h=f.componentDeductLogIds||[];for(let e of h)await o(n(c,`frozenLogs`,e),{status:`deleted`});r.isCurrent()&&(await W(e),alert(`삭제 완료!`))},{roles:[`admin`,`office`]}))})}function G(){J(null)}function ne(e){J(e)}function K(e){return Array.isArray(e)?e.map(e=>({frozenProductId:e?.frozenProductId||``,qty:Number(e?.qty)||0})).filter(e=>e.frozenProductId&&e.qty>0):[]}function re(e){return T.filter(t=>N(t)===`sample`&&t.id!==e)}function ie(e=``,t=null){return[`<option value="">샘플 선택</option>`,...re(t).map(t=>`<option value="${t.id}" ${e===t.id?`selected`:``}>${t.name}</option>`)].join(``)}function q(e={},t=null){let n=Number(e.qty)>0?Number(e.qty):1;return`
    <div class="sample-set-component-row" style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;align-items:center;margin-bottom:6px;">
      <select class="component-product-id">
        ${ie(e.frozenProductId||``,t)}
      </select>
      <input type="number" class="component-qty" min="1" step="1" value="${n}" />
      <button type="button" class="btn-secondary btn-remove-component">삭제</button>
    </div>
  `}function ae(e=``){return String(e).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}async function oe({product:t,frozenLogId:r,date:i,expiry:a,qty:o,staff:s},l){let{setDoc:u}=x(l),d=N(t);if(d!==`product`&&d!==`sample`)return;let f=`frozenLogs:${r}:1`;try{await u(n(c,`productTransferRequests`,f),{idempotencyKey:f,sourceApp:`production`,sourceCollection:`frozenLogs`,sourceId:r,eventType:`productReceipt`,category:`freezeDry`,revision:1,supersedesRevision:null,status:`pending`,frozenProductId:t.id,productName:t.name,recipeName:t.recipeTitleRef||t.name,unitType:d===`sample`?`sample`:`main`,quantity:o,expiryDate:a,producedDate:i,staff:s,createdAt:e()})}catch(e){throw console.error(`동결제품 입고 productTransferRequests 전송 실패`,e),e}}async function J(e){let t=!e,i=(await a(r(s(c,`bagTypes`),o(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()})).filter(n=>n.category===`freezeDry`&&(n.active!==!1||!t&&n.id===e?.bagTypeId)),l=await C(),u=M(e),d=N(e),f=K(e?.components),m=(e,t=``)=>e===`sampleSet`?`<input type="text" id="m_name" value="${ae(t)}" placeholder="샘플세트 이름 입력" />`:`
      <select id="m_name">
        ${S(l,t)}
      </select>
    `;Z(`
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
        ${(f.length>0?f:[{}]).map(t=>q(t,e?.id||null)).join(``)}
      </div>
      <button type="button" class="btn-secondary" id="btnAddComponentRow">+ 구성 샘플 추가</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${t?`추가`:`저장`}</button>
    </div>
  `);let h=()=>{let e=document.getElementById(`m_kind`).value===`sampleSet`;document.getElementById(`m_components_section`).style.display=e?``:`none`},g=()=>{let e=document.getElementById(`m_name`)?.value||``,t=document.getElementById(`m_kind`).value;document.getElementById(`m_name_wrap`).innerHTML=m(t,e)};document.getElementById(`m_kind`)?.addEventListener(`change`,()=>{h(),g()}),document.getElementById(`btnAddComponentRow`)?.addEventListener(`click`,()=>{document.getElementById(`m_components_rows`).insertAdjacentHTML(`beforeend`,q({},e?.id||null))}),document.getElementById(`m_components_rows`)?.addEventListener(`click`,e=>{let t=e.target.closest(`.btn-remove-component`);if(!t)return;let n=t.closest(`.sample-set-component-row`);if(document.querySelectorAll(`.sample-set-component-row`).length<=1){n.querySelector(`.component-product-id`).value=``,n.querySelector(`.component-qty`).value=`1`;return}n.remove()}),document.getElementById(`btnSaveProduct`).addEventListener(`click`,async()=>b(Q,async r=>{let{addDoc:i,updateDoc:a}=x(r);if(p!==`admin`&&p!==`office`){alert(`동결제품 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let o=document.getElementById(`m_name`).value.trim(),l=o,u=document.getElementById(`m_target`).value,d=document.getElementById(`m_kind`).value,f=document.getElementById(`m_bagType`).value,m=document.getElementById(`m_separation`).value===`true`,h=t?!0:e.active!==!1;if(!o||!f){alert(`제품명과 연결 봉투는 필수입니다.`);return}let g=d===`sampleSet`?Array.from(document.querySelectorAll(`.sample-set-component-row`)).map(e=>({frozenProductId:e.querySelector(`.component-product-id`).value,qty:Number(e.querySelector(`.component-qty`).value)||0})).filter(e=>e.frozenProductId&&e.qty>0):[];if(d===`sampleSet`&&g.length===0){alert(`샘플세트 구성 샘플을 1개 이상 입력해주세요.`);return}let _={name:o,recipeTitleRef:l,target:u,kind:d,components:g,bagTypeId:f,requiresSeparation:m,active:h,sortOrder:t?T.length:e.sortOrder,updatedAt:new Date};t?(_.createdAt=new Date,await i(s(c,`frozenProducts`),_)):await a(n(c,`frozenProducts`,e.id),_),T=await k(),r.isCurrent()&&(closeModal(),r.isCurrent()&&(j(),alert(t?`추가 완료!`:`수정 완료!`)))},{roles:[`admin`,`office`]}))}function se(e,t){Z(`
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
        ${X([`senior`,`lead`,`office`]).replace(`value="${t.staffName}"`,`value="${t.staffName}" selected`)}
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
  `),document.getElementById(`btnSaveEditIncoming`).addEventListener(`click`,async()=>b(Q,async r=>{let{getDoc:i,addDoc:a,updateDoc:o}=x(r),l=document.getElementById(`m_expiry`).value,u=parseInt(document.getElementById(`m_qty`).value),f=document.getElementById(`m_staff`).value,h=document.getElementById(`m_note`).value;if(!u||u<=0){alert(`수량은 1개 이상이어야 합니다.`);return}if(await _(t.date,r))return;if(p!==`admin`&&p!==`office`){alert(`동결제품 입고 수정은 대표/사무실 계정만 가능합니다.`);return}t.qty;let v=t.deductedBagQty||0;if(t.ledgerId){let r=await i(n(c,`stockLedger`,t.ledgerId));if(r.exists()&&r.data().status===`active`){let l=r.data().items||[];for(let t of l){let r=await i(n(c,t.collection,t.docId));if(!r.exists())continue;let l=r.data()[t.field]||0;if(l!==t.after&&!await d({title:`재고 변동 감지`,message:`동결제품 입고 이후 ${t.label} 재고가 변경된 이력이 있습니다.\n입고 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,confirmText:`강제 복원`,danger:!0}))return;let u=l-t.delta;await o(n(c,t.collection,t.docId),{[t.field]:u,updatedAt:new Date}),t.collection===`bagTypes`&&await a(s(c,`bagLogs`),{date:m(),timestamp:new Date,bagTypeId:t.docId,bagNameSnapshot:r.data().name||``,type:`autoDeductReverse`,qty:-t.delta,before:l,after:u,staffName:f,note:`동결제품 입고 수정(롤백) - ${e.name}`})}await o(n(c,`stockLedger`,t.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else if(t.bagTypeId&&v>0){let e=await i(n(c,`bagTypes`,t.bagTypeId));if(e.exists()){let r=e.data().currentQty||0;await o(n(c,`bagTypes`,t.bagTypeId),{currentQty:r+v,updatedAt:new Date})}}let y=0,b=[];if(e.bagTypeId){let l=await i(n(c,`bagTypes`,e.bagTypeId));if(l.exists()){let i=l.data(),d=i.currentQty||0;if(d<u){if(alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${d}장\n필요 수량: ${u}장\n\n수정이 중단되었습니다. 봉투 재고는 이전 상태로 이미 복원되었습니다.`),!r.isCurrent()||(closeModal(),!r.isCurrent()))return;await W(e);return}let p=d-u,m=new Date;await o(n(c,`bagTypes`,e.bagTypeId),{currentQty:p,updatedAt:m}),y=u;let h=await a(s(c,`bagLogs`),{date:t.date,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:i.name,type:`autoDeduct`,qty:-u,before:d,after:p,staffName:f,note:`동결제품 입고 수정(재차감) - ${e.name}`});b.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-u,before:d,after:p,label:`${i.name} 봉투`,stockUpdatedAtSnapshot:m,bagLogId:h.id})}}let S=null;b.length>0&&(S=(await a(s(c,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:t.id,timestamp:new Date,date:t.date,status:`active`,items:b})).id),await o(n(c,`frozenLogs`,t.id),{qty:u,expiryDate:l,staffName:f,note:h,deductedBagQty:y,ledgerId:S,updatedAt:new Date}),r.isCurrent()&&(closeModal(),r.isCurrent()&&(await W(e),g(`수정 완료!`)))},{roles:[`admin`,`office`]}))}async function ce(){let e=await a(s(c,`frozenLogs`)),t={};return e.docs.forEach(e=>{let n=e.data();n.status!==`deleted`&&n.productId&&(t[n.productId]=(t[n.productId]||0)+Number(n.qty||0))}),t}async function le(e){let r=l(),i=m(),a=f(18),o=null;if(e.bagTypeId)try{let r=await t(n(c,`bagTypes`,e.bagTypeId));r.exists()&&Number.isFinite(Number(r.data().currentQty))&&(o={name:r.data().name||`연결 봉투`,qty:Number(r.data().currentQty)})}catch{}let u=N(e)===`sampleSet`?K(e.components):[],p=u.length>0?await ce():{};if(r&&!r.isCurrent())return;let h=e=>T.find(t=>t.id===e)?.name||`(삭제된 제품)`;Z(`
    <h3 class="modal-title">입고 등록 — ${e.name}</h3>
    <div class="form-group">
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${i}" max="${i}" />
    </div>
    <div class="form-group">
      <label>유통기한 *</label>
      <input type="date" id="m_expiry" value="${a}" />
    </div>
    <div class="form-group">
      <label>봉지수 *</label>
      <input type="number" id="m_qty" placeholder="봉지수 입력" />
    </div>
    ${e.bagTypeId?`<p id="m_bagPreview" role="status" aria-live="polite" style="font-size:12px;margin:8px 0"></p>`:``}
    ${u.length>0?`
      <div class="form-group" id="m_compPreview" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:12.5px;color:#555;">
        세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.
      </div>
    `:``}
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `);let v=()=>{let e=document.getElementById(`m_bagPreview`);if(!e)return;if(!o){e.textContent=`봉투 재고를 확인하지 못했습니다. 저장 시 다시 확인합니다.`;return}let t=parseInt(document.getElementById(`m_qty`).value)||0;e.textContent=t>0?`${o.name} · 현재 ${o.qty}장 · 필요 ${t}장 · 예상 잔량 ${o.qty-t}장${t>o.qty?` (부족)`:``}`:`${o.name} · 현재 ${o.qty}장 (저장 시 최신 재고 재확인)`,e.style.color=t>o.qty?`#b33333`:`#555`};document.getElementById(`m_qty`).addEventListener(`input`,v),v(),u.length>0&&document.getElementById(`m_qty`).addEventListener(`input`,e=>{let t=parseInt(e.target.value)||0,n=document.getElementById(`m_compPreview`);if(n){if(t<=0){n.innerHTML=`세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.`,n.style.color=`#555`;return}n.innerHTML=u.map(e=>{let n=t*e.qty,r=p[e.frozenProductId]||0,i=r-n,a=i<0;return`<div style="margin-bottom:2px;${a?`color:#e53e3e;font-weight:600;`:``}">
          ${h(e.frozenProductId)} -${n}개 (현재 ${r} → ${i})${a?` ⚠️ 재고 부족`:``}
        </div>`}).join(``)}}),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>b(Q,async t=>{let{getDoc:r,addDoc:a,updateDoc:o,recordActivity:l}=x(t),f=document.getElementById(`m_date`).value,m=document.getElementById(`m_expiry`).value,v=parseInt(document.getElementById(`m_qty`).value),y=document.getElementById(`m_staff`).value;if(!f){alert(`날짜를 입력해주세요.`);return}if(f>i){alert(`미래 날짜는 입력할 수 없습니다.`);return}if(!m){alert(`유통기한을 입력해주세요.`);return}if(m<f){alert(`유통기한이 입고일보다 빠릅니다.`);return}if(!v||v<=0){alert(`봉지수를 입력해주세요.`);return}if(!y){alert(`담당자는 필수입니다.`);return}if(await _(f,t))return;if(u.length>0){let e=u.map(e=>({name:h(e.frozenProductId),need:v*e.qty,cur:p[e.frozenProductId]||0})).filter(e=>e.cur<e.need);if(e.length>0&&!await d({title:`구성품 재고 부족`,message:`다음 구성품 재고가 부족합니다:\n\n${e.map(e=>`${e.name}: 현재 ${e.cur}개 / 필요 ${e.need}개`).join(`
`)}\n\n그래도 진행하면 재고가 음수로 기록됩니다.\n계속하시겠습니까?`,confirmText:`진행`,danger:!0}))return}let b=0,S=[];if(e.bagTypeId){let t=await r(n(c,`bagTypes`,e.bagTypeId));if(t.exists()){let r=t.data(),i=r.currentQty||0;if(i<v){alert(`봉투 재고가 부족합니다.\n현재 봉투 재고: ${i}장\n필요 수량: ${v}장`);return}let l=i-v,u=new Date;await o(n(c,`bagTypes`,e.bagTypeId),{currentQty:l,updatedAt:u}),b=v;let d=await a(s(c,`bagLogs`),{date:f,timestamp:new Date,bagTypeId:e.bagTypeId,bagNameSnapshot:r.name,type:`autoDeduct`,qty:-v,before:i,after:l,staffName:y,note:`동결제품 입고 자동차감 - ${e.name}`});S.push({collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-v,before:i,after:l,label:`${r.name} 봉투`,stockUpdatedAtSnapshot:u,bagLogId:d.id})}}let C=await a(s(c,`frozenLogs`),{date:f,timestamp:new Date,productId:e.id,productNameSnapshot:e.name,componentsSnapshot:N(e)===`sampleSet`?K(e.components):null,expiryDate:m,qty:v,bagTypeId:e.bagTypeId||null,deductedBagQty:b,staffName:y,note:``,status:`active`,ledgerId:null}),w=[];for(let t of u){let n=v*t.qty,r=await a(s(c,`frozenLogs`),{date:f,timestamp:new Date,productId:t.frozenProductId,productNameSnapshot:h(t.frozenProductId),componentsSnapshot:null,expiryDate:null,qty:-n,bagTypeId:null,deductedBagQty:0,staffName:y,note:`샘플세트 제작 자동차감 - ${e.name} ${v}세트`,status:`active`,ledgerId:null,sampleSetLogId:C.id});w.push(r.id)}if(w.length>0&&await o(n(c,`frozenLogs`,C.id),{componentDeductLogIds:w}),await oe({product:e,frozenLogId:C.id,date:f,expiry:m,qty:v,staff:y},t),S.length>0){let e=await a(s(c,`stockLedger`),{actionType:`frozenProductIncoming`,actionId:C.id,timestamp:new Date,date:f,status:`active`,items:S});await o(n(c,`frozenLogs`,C.id),{ledgerId:e.id})}await l({action:`frozenProduct`,subAction:`incoming`,date:f,staff:y,message:`동결제품 입고 — ${e.name} +${v}봉 / 담당: ${y}`,details:{frozenLogId:C.id,productId:e.id,productName:e.name,componentsSnapshot:N(e)===`sampleSet`?K(e.components):null,qty:v,expiryDate:m||null,deductedBagQty:b,bagTypeId:e.bagTypeId||null,note:null}}),t.isCurrent()&&(closeModal(),t.isCurrent()&&(await W(e),g(`입고 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}var Y={};function X(e){let t=``;for(let n of e)(Y[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function ue(){return p===`admin`?`대표`:p===`office`?`사무실`:p===`production`?`생산실`:`시스템`}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}u(`frozenProduct`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var Q=h(`frozenProduct`);Q.refresh=O;async function $(e){let[t,n]=await Promise.all([k(e),w(e)]);return{products:t,staff:n}}function de({cacheOnly:e=!0}={}){return Q.prepare?.(`default`,$,{cacheOnly:e})}export{de as preparePage,O as renderFrozenProduct};