import{T as e,a as t,b as n,d as r,g as i,s as a,u as o,y as s}from"./index.esm-D8prxbkJ.js";import{n as c,t as l}from"./firebase-BOShkvR0.js";import{n as u}from"./modalManager-Z4b2ihO9.js";import{n as d}from"./modal-CCKYLKMo.js";import{A as f,K as p,Q as m,k as h,n as g,o as _,s as v,tt as y,v as b,z as x}from"./index-Cu9Z_zO4.js";import{t as S}from"./statusToast-DAQ_Eu62.js";import{t as C}from"./closingGuard-FaY3B162.js";import{n as w}from"./activityLogs-BMMD2gWR.js";import{t as T}from"./sortable-BsVIR2Q-.js";import{t as E}from"./pageRefresh-Do5Wbg3x.js";import{t as D}from"./pageCommand-CVO48Ghm.js";import{t as O}from"./commandWrites-C3qnuYMO.js";import{n as k,t as ee}from"./recipe-w8hkZn1R.js";import{t as te}from"./pageStaff-D2JwyrmN.js";import{i as A,n as ne,r as re,t as ie}from"./inventoryHandoff-BQq38vWg.js";var j=e=>Array.isArray(e)?e.map(j):e&&typeof e==`object`?Object.fromEntries(Object.entries(e).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,j(t)])):e;async function ae(e){return[...new Uint8Array(await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode(JSON.stringify(j(e)))))].map(e=>e.toString(16).padStart(2,`0`)).join(``)}async function oe(e){let t=l.currentUser,r=m.epoch,i=f(),a=p();if(!t)throw Error(`로그인 상태를 확인해주세요.`);let o=()=>{if(l.currentUser?.uid!==t.uid||m.epoch!==r||p()!==a||i&&!i.isCurrent())throw Error(`로그인·화면 또는 날짜가 변경되었습니다. 다시 열어주세요.`)},s=await h({refs:[`frozenProducts/`+e],roles:[`admin`,`office`,`production`],reusableConfirm:!0}),u=crypto.randomUUID(),g=async e=>{o();let t=await v(_(l.app,`asia-northeast3`),`productionReceiptCommand`)(e);return o(),t.data},y;try{y=await g({action:`identity`})}catch(e){throw e.code===`functions/permission-denied`?Error(`샘플세트 입고 본인·QC 계정 설정을 관리자에게 확인해주세요.`,{cause:e}):e}if(!y?.production)throw Error(`생산 권한을 확인해주세요.`);let b=!1,x=!1,S=null,C=null;async function w(){if(o(),!S)return{confirmed:!1};let n=await g({...S,action:`sampleSetIncomingContext`});o();let r=n.operation;if(!r)return{confirmed:!1};let i=r.result;if(r.status!==`completed`||r.actorUid!==t.uid||r.actorEmployeeId!==S.employeeId||r.inputHash!==C||i?.status!==`created`||i?.operationId!==u||i?.quantity!==S.quantity||i?.productId!==e)throw Error(`본인 작업 결과가 요청과 일치하지 않습니다.`);return{confirmed:!0,result:{...i,recovered:!0}}}return{actor:y,operationId:u,inspectResult:w,get dispatched(){return x},async submit({date:t,expiry:r,quantity:i,employeeId:a,command:l}){if(o(),b||x)throw Error(`이미 전송한 작업입니다. 서버 결과를 확인해주세요.`);if(y.sharedQc?!y.staffOptions?.some(e=>e.employeeId===a):a!==y.employeeId)throw Error(`본인 또는 등록된 QC 실제 담당자를 선택해주세요.`);b=!0;try{let o=await g({action:`sampleSetIncomingContext`,productId:e,date:t,expiry:r,quantity:i,employeeId:a}),f=o.stocks.filter(e=>e.after<0),p=f.length>0&&await d({title:`구성품 재고 부족`,message:f.map(e=>`${e.name}: 현재 ${e.before}봉 → 입고 후 ${e.after}봉`).join(`
`)+`
음수 재고로 기록해도 진행하시겠습니까?`,confirmText:`부족 확인 후 진행`,danger:!0});if(f.length&&!p)throw Error(`구성품 부족으로 저장하지 않았습니다.`);let m=p?{allowComponentShortage:!0}:{};S={...m,action:`createSampleSetIncoming`,productId:e,date:t,expiry:r,quantity:i,employeeId:a,operationId:u,expectedContext:JSON.parse(JSON.stringify(o.context))},C=await ae({...m,productId:e,date:t,expiry:r,quantity:i,employeeId:a,expectedContext:S.expectedContext});let h=()=>s.submit(async()=>{x=!0;try{return await g(S)}catch(e){try{let e=await w();if(e.confirmed)return e.result}catch{}throw Error(`샘플세트 서버 결과를 확인하지 못했습니다. 자동 재전송하지 않습니다. 원래 작업 결과를 확인해주세요.`,{cause:e})}});return await(l?l.commit({commit:h},{targets:[n(c,`frozenProducts`,e)],atomic:!1}):h())}finally{b=!1}}}}var se=[`admin`,`office`],ce=e=>typeof e==`string`&&e.length>0&&e.length<=220&&!/[\/\u0000-\u001f]/.test(e)&&![`.`,`..`].includes(e);function M(e){return Array.isArray(e)?e.map(M):e&&typeof e==`object`?Object.fromEntries(Object.entries(e).sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>[e,M(t)])):e}async function le(e){let t=new TextEncoder().encode(JSON.stringify(M(e)));return[...new Uint8Array(await crypto.subtle.digest(`SHA-256`,t))].map(e=>e.toString(16).padStart(2,`0`)).join(``)}function N(e){let t=JSON.parse(JSON.stringify(e)),n=e=>(e&&typeof e==`object`&&(Object.values(e).forEach(n),Object.freeze(e)),e);return n(t)}function P(e=[]){return e.some(e=>e.includes(`COMPONENT`))?`구성품 snapshot·자식 원장 근거를 확인해야 합니다.`:e.some(e=>e.includes(`HANDOFF`)||e.includes(`INVENTORY`)||e.includes(`WORKFLOW`)||e.includes(`REQUEST_NOT_PENDING`))?`재고앱 처리 필요: 인계·입고·사용·실사 기록이 연결되어 있습니다. 재고앱 입고 관리에 원본 ID와 수정 항목을 전달해주세요.`:e.includes(`SOURCE_DATE_CLOSED`)?`마감된 날짜의 입고입니다. 마감 및 재고앱 기록을 먼저 확인해 주세요.`:`입고 요청·원본·봉투 근거가 일치하지 않아 정정·취소를 보류합니다. 원본을 유지하고 재고앱 입고 관리에서 확인해 주세요.`}async function ue(e,{expectedProductId:t}={}){if(!ce(e))throw Error(`입고 기록 ID를 확인해주세요.`);let r=l.currentUser,i=m.epoch,a=f(),o=p();if(!r)throw Error(`로그인 상태를 확인해주세요.`);let s=()=>{if(l.currentUser?.uid!==r.uid||m.epoch!==i||p()!==o||a&&!a.isCurrent())throw Error(`로그인·화면 또는 날짜가 변경되었습니다. 입고를 다시 열어주세요.`)},u=await h({refs:[`frozenLogs/`+e],roles:se,reusableConfirm:!0}),d=async e=>{s();let t=await v(_(l.app,`asia-northeast3`),`productionReceiptCommand`)(e);return s(),t.data},g,y;try{[g,y]=await Promise.all([d({action:`identity`}),d({action:`frozenSourceContext`,sourceId:e})])}catch(e){throw e.code===`functions/permission-denied`?Error(`본인 계정·회사·창고 권한을 관리자에게 확인해주세요.`,{cause:e}):e}if(g=N(g),y=N(y),s(),await u.confirm(),!g?.production||g.sharedQc||!ce(g.employeeId)||y?.context?.sourceId!==e||y?.source?.sourceId!==e)throw Error(`본인 생산 대표·사무의 입고 정보를 확인해주세요.`);if(t&&y.source.productId!==t)throw Error(`선택한 제품과 실제 입고 원본이 다릅니다. 다시 불러와주세요.`);let b=N(y.context),x=crypto.randomUUID(),S=!1,C=!1,w=null,T=null;async function E(){s();let t=await r.getIdTokenResult();if(!se.includes(t.claims.roles?.production))throw Error(`처리 권한이 변경되었습니다.`);if(!w||!T)return{confirmed:!1};let n=await d({action:`frozenSourceContext`,sourceId:e,employeeId:g.employeeId,operationId:x});s();let i=n.operation;if(!i)return{confirmed:!1};let a=i.result;if(i.status!==`completed`||i.actorUid!==r.uid||i.actorEmployeeId!==g.employeeId||i.sourceId!==e||i.inputHash!==T||a?.sourceId!==e||a?.operationId!==x||a?.revision!==(a.metadataOnly?b.revision:b.revision+1)||a?.receiptId!==`frozenLogs:${e}:${a.metadataOnly?b.revision:b.revision+1}`||a?.status!==(w.action===`correctFrozenSource`?`corrected`:`cancelled`))throw Error(`이 작업의 서버 결과가 요청과 일치하지 않습니다. 재고앱에서 확인해주세요.`);return{confirmed:!0,result:{...a,recovered:!0}}}return{inventoryCorrection:re(y.source.receiptId,e),source:y.source,context:b,actor:g,operationId:x,eligible:y.eligible===!0,metadataEligible:y.metadataEligible===!0,holdMessage:P(y.blockers),get dispatched(){return C},inspectResult:E,async submit(t,{quantity:r,expiryDate:i,staffName:a,note:o,allowComponentShortage:l=!1,reason:f,command:p}={}){if(s(),S||C)throw Error(`이미 전송한 작업입니다. 서버 결과를 확인해주세요.`);let m=t===`correct`&&r===y.source.quantity&&(i===void 0||i===y.source.expiryDate);if(y.eligible!==!0&&!(m&&y.metadataEligible===!0))throw Error(P(y.blockers));if(![`correct`,`cancel`].includes(t))throw Error(`입고 처리 구분을 확인해주세요.`);let h=typeof f==`string`?f.trim():``;if(!h||h.length>500)throw Error(`정정·취소 사유를 1~500자로 입력해주세요.`);if(t===`correct`&&(!Number.isSafeInteger(r)||r<=0))throw Error(`1봉 이상의 안전한 정수를 입력해주세요.`);let _=t===`correct`?{expiryDate:i,staffName:a,note:o}:{};Object.keys(_).forEach(e=>{_[e]===void 0&&delete _[e]});let v=Object.keys(_).length?{changes:_}:{},D=l===!0?{allowComponentShortage:!0}:{};S=!0;try{w=N({action:t===`correct`?`correctFrozenSource`:`cancelFrozenSource`,sourceId:e,employeeId:g.employeeId,operationId:x,reason:h,..._,...D,...t===`correct`?{quantity:r}:{},expectedContext:b}),T=await le({...v,...D,action:w.action,sourceId:e,employeeId:g.employeeId,quantity:t===`correct`?r:null,reason:h,expectedContext:b});let i=()=>u.submit(async()=>{C=!0;try{return await d(w)}catch(e){try{let e=await E();if(e.confirmed)return e.result}catch{}let t=Error(`서버 결과를 확인하지 못했습니다. 자동으로 다시 보내지 않습니다. 원래 작업의 서버 결과를 확인해주세요.`,{cause:e});throw t.code=`outcome-unknown`,t}});return await(p?p.commit({commit:i},{targets:[n(c,`frozenLogs`,e)],atomic:!1}):i())}finally{S=!1}}}}var F=[],I=null,L={},R=`frozenProductCategoryCollapsed`,de=[{key:`cat-product`,label:`고양이`,target:`cat`,kind:`product`},{key:`dog-product`,label:`강아지`,target:`dog`,kind:`product`},{key:`common-product`,label:`공용`,target:`common`,kind:`product`},{key:`cat-sample`,label:`고양이샘플`,target:`cat`,kind:`sample`},{key:`dog-sample`,label:`강아지샘플`,target:`dog`,kind:`sample`},{key:`common-sample`,label:`공용샘플`,target:`common`,kind:`sample`},{key:`sample-set`,label:`샘플세트`,target:null,kind:`sampleSet`}];async function z({force:e=!1}={}){L.promise=null,ie();let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">동결제품 입고 로딩 중...</p>`;let n=await Q.load(e=>$(e),{force:e,onChange:E(Q,z)});if(!(!n||!t.isConnected)){if(F=n.products,X=n.staff,V(),I){let e=F.find(e=>e.id===I);e&&await G(e)}A({sourceCollection:`frozenLogs`,role:y,recoveryCache:L,showModal:Z,closeModal:()=>window.closeModal(),onComplete:()=>z({force:!0})})}}async function B(e={getDocs:a,getDoc:t}){let n=r(s(c,`frozenProducts`),o(`sortOrder`));return(await e.getDocs(n)).docs.map(e=>({...e.data(),id:e.id}))}async function fe(e){return(await a(r(s(c,`frozenLogs`),o(`timestamp`,`desc`)))).docs.map(e=>({...e.data(),id:e.id})).filter(t=>t.productId===e&&t.status!==`deleted`).slice(0,30)}function V(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap frozen-product-page">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${y===`admin`||y===`office`?`<button class="btn-secondary" id="btnNewProduct">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="productList">
          ${_e()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `,be(),ve(),document.getElementById(`btnNewProduct`)?.addEventListener(`click`,we)}function H(e){let t=e?.name||``;return[`cat`,`dog`,`common`].includes(e?.target)?e.target:t.startsWith(`고양이 `)?`cat`:t.startsWith(`강아지 `)?`dog`:`common`}function U(e){return[`product`,`sample`,`sampleSet`].includes(e?.kind)?e.kind:`product`}function pe(e){let t=U(e);return t===`sampleSet`?`sample-set`:`${H(e)}-${t}`}function W(){try{let e=JSON.parse(localStorage.getItem(R)||`{}`);return e&&typeof e==`object`?e:{}}catch{return{}}}function me(e,t){let n=W();n[e]=t,localStorage.setItem(R,JSON.stringify(n))}function he(e){let t=y===`admin`||y===`office`;return`
    <div class="recipe-list-item ${I===e.id?`active`:``}"
      data-id="${g(e.id)}" style="padding:3px 8px 3px 13px;min-height:28px;">
      ${t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>`:``}
      <div class="recipe-list-info" style="gap:0;">
        <span class="recipe-name" style="font-size:12.5px;line-height:1.2;">${g(e.name)}</span>
      </div>
    </div>
  `}function ge(){let e=W();return de.map(t=>{let n=F.filter(e=>pe(e)===t.key),r=e[t.key]===!0;return`
        <div class="frozen-product-category" data-category="${t.key}">
          <button type="button" class="frozen-product-category-header list-category-header" data-category="${t.key}"
            >
            <span>${r?`▶`:`▼`} ${t.label}</span>
            <span style="font-size:11px;color:#777;">${n.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${t.key}" style="${r?`display:none;`:``}">
            ${n.length===0?`<div style="padding:4px 8px;color:#aaa;font-size:11.5px;">등록된 제품 없음</div>`:n.map(he).join(``)}
          </div>
        </div>
      `}).join(``)}function _e(){return ge()}function ve(){y!==`admin`&&y!==`office`||document.querySelectorAll(`.frozen-product-category-items`).forEach(e=>{T.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,group:{name:`frozenProduct-${e.dataset.category||`group`}`,pull:!1,put:!1},onEnd:async e=>{e.oldIndex!==e.newIndex&&await ye()}})})}async function ye(){return D(Q,async e=>{let{writeBatch:t}=O(e),r=document.getElementById(`productList`);if(!r)return;let i=Array.from(r.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),a=new Date,o=t(c);i.forEach((e,t)=>{o.update(n(c,`frozenProducts`,e),{sortOrder:t,updatedAt:a})});try{await o.commit();let e=new Map(i.map((e,t)=>[e,t]));F=F.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:a}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(t){if(console.error(`[frozenProduct] reorder save failed:`,t),alert(`순번 저장 실패: `+(t.message||t)),F=await B(),!e.isCurrent())return;if(V(),I){let e=F.find(e=>e.id===I);e&&await G(e)}}},{roles:[`admin`,`office`]})}function be(){document.querySelectorAll(`.frozen-product-category-header`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.category,n=document.querySelector(`.frozen-product-category-items[data-category="${t}"]`);if(!(!t||!n)&&(me(t,n.style.display!==`none`),V(),I)){let e=F.find(e=>e.id===I);e&&G(e)}})}),document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,async t=>{t.target.closest(`.drag-handle`)||(I=e.dataset.id,document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),await G(F.find(e=>e.id===I)))})})}async function xe(e,t={getDocs:a}){return(await t.getDocs(r(s(c,`frozenLogs`),i(`productId`,`==`,e)))).docs.map(e=>e.data()).filter(e=>e.status!==`deleted`).length}async function Se(e){return D(Q,async t=>{let{deleteDoc:r,recordActivity:i}=O(t);if(y!==`admin`&&y!==`office`){alert(`동결제품 삭제는 관리자/사무 계정만 가능합니다.`);return}let a=await xe(e.id,t);if(a>0){alert(`사용 이력이 ${a}건 있어 삭제할 수 없습니다.`);return}await d({title:`동결제품 삭제`,message:`${e.name} 제품을 삭제하시겠습니까?\n입고 이력이 없는 제품만 완전히 삭제됩니다.`,confirmText:`삭제`,danger:!0})&&(await r(n(c,`frozenProducts`,e.id)),await i({action:`frozenProduct`,subAction:`delete`,date:p(),staff:Pe(),message:`동결제품 삭제 — ${e.name}`,details:{productId:e.id,productName:e.name,bagTypeId:e.bagTypeId||null}}),F=F.filter(t=>t.id!==e.id),I===e.id&&(I=null),t.isCurrent()&&(V(),alert(`삭제 완료!`)))},{roles:[`admin`,`office`]})}async function G(e){let t=document.getElementById(`productDetail`),n=await fe(e.id);if(!t?.isConnected||I!==e.id)return;let r=y===`admin`||y===`office`;t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${g(e.name)}</span>
      <div class="detail-actions">
        ${r?`<button class="btn-secondary" id="btnEditProduct">수정</button>`:``}
        ${r?`<button class="btn-secondary" id="btnDeleteProduct">삭제</button>`:``}
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
                    <td>${g(t.date||`-`)}</td>
                    <td>${g(t.expiryDate||`-`)}</td>
                    <td>${g(t.qty)}</td>
                    <td>${g(t.deductedBagQty||`-`)}</td>
                    <td>${g(t.staffName||`-`)}</td>
                    <td>${g(t.note||`-`)}</td>
                    <td>
                      ${ne(`frozenLogs:${t.id}:${Number.isSafeInteger(t.receiptRevision)&&t.receiptRevision>0?t.receiptRevision:1}`)}
                      ${r?`
                        <button class="btn-edit-row" data-logid="${g(t.id)}" style="margin-right:4px;">수정</button>
                        <button class="btn-del-row" data-logid="${g(t.id)}" data-qty="${g(t.qty)}" data-bagqty="${g(t.deductedBagQty||0)}" data-bagid="${g(e.bagTypeId||``)}">취소</button>
                      `:``}
                    </td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,A({sourceCollection:`frozenLogs`,role:y,recoveryCache:L,showModal:Z,closeModal:()=>window.closeModal(),onComplete:()=>z({force:!0})}),document.getElementById(`btnAddIncoming`)?.addEventListener(`click`,()=>Me(e)),document.getElementById(`btnEditProduct`)?.addEventListener(`click`,()=>Te(e)),document.getElementById(`btnDeleteProduct`)?.addEventListener(`click`,()=>Se(e)),document.querySelectorAll(`.btn-edit-row`).forEach(t=>{t.addEventListener(`click`,()=>K(e,t.dataset.logid,`correct`).catch(e=>alert(e.message)))}),document.querySelectorAll(`.btn-del-row`).forEach(t=>{t.addEventListener(`click`,()=>K(e,t.dataset.logid,`cancel`).catch(e=>alert(e.message)))})}async function K(e,r,i){if(![`admin`,`office`].includes(y))throw Error(`입고 정정·취소는 대표·사무실 계정만 가능합니다.`);let a=f(),o=await t(n(c,`frozenLogs`,r));if(a&&!a.isCurrent())return;if(!o.exists())throw Error(`입고 원본을 찾을 수 없습니다.`);let s={...o.data(),id:o.id};if(s.productId!==e.id)throw Error(`선택한 제품과 입고 원본이 다릅니다. 다시 불러와주세요.`);let l=await ue(s.id,{expectedProductId:e.id});if(!(a&&!a.isCurrent())){if(!l.eligible&&!(i===`correct`&&l.metadataEligible)){Z(`<h3 class="modal-title">재고앱 처리 필요 / 근거 확인</h3><p>${g(l.holdMessage)}</p><p>원본 ID: ${g(s.id)} · 요청 버전: ${g(l.source.revision)}</p><p>원본 수량과 봉투 재고를 자동으로 바꾸지 않습니다.</p><div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button></div>`);return}Ce(e,s,l,i)}}function Ce(e,t,n,r=`correct`){let i=f(),a=r===`cancel`;Z(`<h3 class="modal-title">입고 ${a?`취소`:`수정`} — ${g(e.name)}</h3>
    <input id="m_date" type="date" value="${g(n.source.date)}" disabled>
    <p>제조 ${g(n.source.date)} · 현재 ${g(n.source.quantity)}봉 · 입고 버전 ${g(n.source.revision)}</p>
    <p>담당자: ${g(n.actor.name)} (본인 계정)</p>
    ${n.eligible?``:`<p>${g(n.holdMessage)} 메모·표시 담당자는 여기서 수정할 수 있습니다.</p>`}
    ${a?`<p>미인계 입고를 취소하고 확인된 봉투 차감분만 원자적으로 환급합니다. 과거 원장·로그는 보존합니다.</p>`:`<div class="form-group"><label>정정할 절대 수량(봉)</label><input id="m_source_qty" type="number" min="1" step="1" value="${g(n.source.quantity)}"></div>
    <div class="form-group"><label>유통기한</label><input id="m_source_expiry" type="date" value="${g(n.source.expiryDate)}"></div>
    <div class="form-group"><label>표시 담당자</label><select id="m_source_staff"><option value="">선택</option>${Ne([`senior`,`lead`,`office`],n.source.staffName)}</select></div>
    <div class="form-group"><label>메모</label><input id="m_source_note" maxlength="2000" value="${g(n.source.note)}"></div>`}
    ${n.source.components?.length?`<p>저장 당시 구성비로 함께 정정합니다. ${n.source.components.map(e=>`${g(e.productId)}: 현재 ${g(e.before)}봉, 세트당 ${g(e.ratio)}봉`).join(` / `)}</p><label><input id="m_component_shortage" type="checkbox">구성품이 부족해 음수가 되어도 진행할 것을 확인합니다.</label>`:``}
    <div class="form-group"><label>${a?`취소`:`정정`} 사유</label><input id="m_source_reason" maxlength="500" type="text"></div>
    <p id="m_source_status" role="status"></p>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button><button id="btnInspectFrozenSource" class="btn-secondary" hidden>서버 결과 확인</button><button id="btnSubmitFrozenSource" class="btn-primary">${a?`입고 취소`:`수정 저장`}</button></div>`);let o=document.getElementById(`btnSubmitFrozenSource`),s=document.getElementById(`btnInspectFrozenSource`),c=document.getElementById(`m_source_status`),l=!1,u=async()=>{i&&!i.isCurrent()||(closeModal(),await z({force:!0}),S(a?`입고 취소를 확인했습니다.`:`입고 수정을 확인했습니다.`))};s.addEventListener(`click`,async()=>{if(!l){l=!0,s.disabled=!0;try{let e=await n.inspectResult();if(i&&!i.isCurrent())return;e.confirmed?await u():c.textContent=`아직 이 작업의 서버 결과를 확인하지 못했습니다. 새 요청을 만들지 말고 잠시 후 다시 확인해주세요.`}catch(e){(!i||i.isCurrent())&&(c.textContent=e.message)}finally{l=!1,s.disabled=!1}}}),o.addEventListener(`click`,async()=>{if(l||n.dispatched)return;let e=document.getElementById(`m_source_reason`).value.trim(),t=a?void 0:J(document.getElementById(`m_source_qty`).value);if(!e||e.length>500){c.textContent=`사유를 1~500자로 입력해주세요.`;return}if(!a&&!Number.isSafeInteger(t)){c.textContent=`1봉 이상의 안전한 정수를 입력해주세요.`;return}l=!0,o.disabled=!0,document.querySelectorAll(`#modalOverlay input`).forEach(e=>e.disabled=!0),await D(Q,async o=>{try{if(await C(n.source.date,o))return;await n.submit(r,{quantity:t,reason:e,command:o,...a?{}:{expiryDate:document.getElementById(`m_source_expiry`).value,staffName:document.getElementById(`m_source_staff`).value,note:document.getElementById(`m_source_note`).value},allowComponentShortage:document.getElementById(`m_component_shortage`)?.checked===!0}),o.isCurrent()&&await u()}catch(e){(!i||i.isCurrent())&&(c.textContent=e.message,s.hidden=!1)}},{roles:[`admin`,`office`]}),l=!1,!n.dispatched&&(!i||i.isCurrent())&&(c.textContent||=`입고 상태를 다시 확인한 뒤 창을 새로 열어주세요.`)})}function we(){Ae(null)}function Te(e){Ae(e)}function q(e){return Array.isArray(e)?e.map(e=>({frozenProductId:e?.frozenProductId||``,qty:Number(e?.qty)||0})).filter(e=>e.frozenProductId&&e.qty>0):[]}function J(e){if(typeof e!=`string`||!/^[0-9]+$/.test(e))return null;let t=Number(e);return Number.isSafeInteger(t)&&t>0?t:null}function Ee(e){return F.filter(t=>U(t)===`sample`&&t.id!==e)}function De(e=``,t=null){return[`<option value="">샘플 선택</option>`,...Ee(t).map(t=>`<option value="${g(t.id)}" ${e===t.id?`selected`:``}>${g(t.name)}</option>`)].join(``)}function Y(e={},t=null){let n=Number(e.qty)>0?Number(e.qty):1;return`
    <div class="sample-set-component-row" style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;align-items:center;margin-bottom:6px;">
      <select class="component-product-id">
        ${De(e.frozenProductId||``,t)}
      </select>
      <input type="number" class="component-qty" min="1" step="1" value="${n}" />
      <button type="button" class="btn-secondary btn-remove-component">삭제</button>
    </div>
  `}function Oe(e=``){return String(e).replace(/&/g,`&amp;`).replace(/"/g,`&quot;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`)}function ke({product:t,frozenLogId:n,date:r,expiry:i,qty:a,staff:o}){let s=U(t);return s!==`product`&&s!==`sample`?null:{idempotencyKey:`frozenLogs:${n}:1`,sourceApp:`production`,sourceCollection:`frozenLogs`,sourceId:n,eventType:`productReceipt`,category:`freezeDry`,revision:1,supersedesRevision:null,status:`pending`,frozenProductId:t.id,productName:t.name,recipeName:t.recipeTitleRef||t.name,unitType:s===`sample`?`sample`:`main`,quantity:a,expiryDate:i,producedDate:r,staff:o,createdAt:e()}}async function Ae(e){let t=!e,i=(await a(r(s(c,`bagTypes`),o(`sortOrder`)))).docs.map(e=>({...e.data(),id:e.id})).filter(n=>n.category===`freezeDry`&&(n.active!==!1||!t&&n.id===e?.bagTypeId)),l=await ee(),u=H(e),d=U(e),f=q(e?.components),p=(e,t=``)=>e===`sampleSet`?`<input type="text" id="m_name" value="${Oe(t)}" placeholder="샘플세트 이름 입력" />`:`
      <select id="m_name">
        ${k(l,t)}
      </select>
    `;Z(`
    <h3 class="modal-title">${t?`동결제품 추가`:`동결제품 수정`}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <div id="m_name_wrap">
        ${p(d,e?.name||``)}
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
        ${i.map(t=>`<option value="${g(t.id)}" ${e?.bagTypeId===t.id?`selected`:``}>${g(t.name)}${t.active===!1?` (비활성)`:``}</option>`).join(``)}
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
        ${(f.length>0?f:[{}]).map(t=>Y(t,e?.id||null)).join(``)}
      </div>
      <button type="button" class="btn-secondary" id="btnAddComponentRow">+ 구성 샘플 추가</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${t?`추가`:`저장`}</button>
    </div>
  `);let m=()=>{let e=document.getElementById(`m_kind`).value===`sampleSet`;document.getElementById(`m_components_section`).style.display=e?``:`none`},h=()=>{let e=document.getElementById(`m_name`)?.value||``,t=document.getElementById(`m_kind`).value;document.getElementById(`m_name_wrap`).innerHTML=p(t,e)};document.getElementById(`m_kind`)?.addEventListener(`change`,()=>{m(),h()}),document.getElementById(`btnAddComponentRow`)?.addEventListener(`click`,()=>{document.getElementById(`m_components_rows`).insertAdjacentHTML(`beforeend`,Y({},e?.id||null))}),document.getElementById(`m_components_rows`)?.addEventListener(`click`,e=>{let t=e.target.closest(`.btn-remove-component`);if(!t)return;let n=t.closest(`.sample-set-component-row`);if(document.querySelectorAll(`.sample-set-component-row`).length<=1){n.querySelector(`.component-product-id`).value=``,n.querySelector(`.component-qty`).value=`1`;return}n.remove()}),document.getElementById(`btnSaveProduct`).addEventListener(`click`,async()=>D(Q,async r=>{let{addDoc:i,updateDoc:a}=O(r);if(y!==`admin`&&y!==`office`){alert(`동결제품 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let o=document.getElementById(`m_name`).value.trim(),l=o,u=document.getElementById(`m_target`).value,d=document.getElementById(`m_kind`).value,f=document.getElementById(`m_bagType`).value,p=document.getElementById(`m_separation`).value===`true`,m=t?!0:e.active!==!1;if(!o||!f){alert(`제품명과 연결 봉투는 필수입니다.`);return}let h=d===`sampleSet`?Array.from(document.querySelectorAll(`.sample-set-component-row`)).map(e=>({frozenProductId:e.querySelector(`.component-product-id`).value,qty:Number(e.querySelector(`.component-qty`).value)||0})).filter(e=>e.frozenProductId&&e.qty>0):[];if(d===`sampleSet`&&h.length===0){alert(`샘플세트 구성 샘플을 1개 이상 입력해주세요.`);return}let g={name:o,recipeTitleRef:l,target:u,kind:d,components:h,bagTypeId:f,requiresSeparation:p,active:m,sortOrder:t?F.length:e.sortOrder,updatedAt:new Date};t?(g.createdAt=new Date,await i(s(c,`frozenProducts`),g)):await a(n(c,`frozenProducts`,e.id),g),F=await B(),r.isCurrent()&&(closeModal(),r.isCurrent()&&(V(),alert(t?`추가 완료!`:`수정 완료!`)))},{roles:[`admin`,`office`]}))}async function je(){let e=await a(s(c,`frozenLogs`)),t={};return e.docs.forEach(e=>{let n=e.data();n.status!==`deleted`&&n.productId&&(t[n.productId]=(t[n.productId]||0)+Number(n.qty||0))}),t}async function Me(e){let r=f(),i=p(),a=x(18),o=null;if(e.bagTypeId)try{let r=await t(n(c,`bagTypes`,e.bagTypeId));r.exists()&&Number.isFinite(Number(r.data().currentQty))&&(o={name:r.data().name||`연결 봉투`,qty:Number(r.data().currentQty)})}catch{}let l=U(e)===`sampleSet`,u=l?q(e.components):[],d=null;if(l)try{d=await oe(e.id)}catch(e){alert(e.message);return}let m=u.length>0?await je():{};if(r&&!r.isCurrent())return;let h=e=>F.find(t=>t.id===e)?.name||`(삭제된 제품)`;Z(`
    <h3 class="modal-title">입고 등록 — ${g(e.name)}</h3>
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
        ${d?(d.actor.sharedQc?d.actor.staffOptions:[{employeeId:d.actor.employeeId,name:d.actor.name}]).map(e=>`<option value="${Oe(e.employeeId)}">${g(e.name)}</option>`).join(``):Ne([`senior`,`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `);let _=()=>{let e=document.getElementById(`m_bagPreview`);if(!e)return;if(!o){e.textContent=`봉투 재고를 확인하지 못했습니다. 저장 시 다시 확인합니다.`;return}let t=J(document.getElementById(`m_qty`).value)||0;e.textContent=t>0?`${o.name} · 현재 ${o.qty}장 · 필요 ${t}장 · 예상 잔량 ${o.qty-t}장${t>o.qty?` (부족)`:``}`:`${o.name} · 현재 ${o.qty}장 (저장 시 최신 재고 재확인)`,e.style.color=t>o.qty?`#b33333`:`#555`};document.getElementById(`m_qty`).addEventListener(`input`,_),_(),u.length>0&&document.getElementById(`m_qty`).addEventListener(`input`,e=>{let t=J(e.target.value)||0,n=document.getElementById(`m_compPreview`);if(n){if(t<=0){n.innerHTML=`세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.`,n.style.color=`#555`;return}n.innerHTML=u.map(e=>{let n=t*e.qty,r=m[e.frozenProductId]||0,i=r-n,a=i<0;return`<div style="margin-bottom:2px;${a?`color:#e53e3e;font-weight:600;`:``}">
          ${g(h(e.frozenProductId))} -${n}개 (현재 ${r} → ${i})${a?` ⚠️ 재고 부족`:``}
        </div>`}).join(``)}}),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>D(Q,async t=>{let{runTransaction:r}=O(t),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_expiry`).value,l=J(document.getElementById(`m_qty`).value),f=document.getElementById(`m_staff`).value;if(!a){alert(`날짜를 입력해주세요.`);return}if(a>i){alert(`미래 날짜는 입력할 수 없습니다.`);return}if(!o){alert(`유통기한을 입력해주세요.`);return}if(o<a){alert(`유통기한이 입고일보다 빠릅니다.`);return}if(!Number.isSafeInteger(l)||l<=0){alert(`봉지수는 1봉 이상의 안전한 정수로 입력해주세요.`);return}if(!f){alert(`담당자는 필수입니다.`);return}if(await C(a,t))return;if(d){try{if(await d.submit({date:a,expiry:o,quantity:l,employeeId:f,command:t}),!t.isCurrent())return;closeModal(),await G(e),S(`샘플세트 입고 완료!`)}catch(n){if(alert(n.message),d.dispatched){document.getElementById(`btnSaveIncoming`).disabled=!0;let n=document.createElement(`button`);n.className=`btn-secondary`,n.textContent=`원래 작업 결과 확인`,n.addEventListener(`click`,async()=>{try{(await d.inspectResult()).confirmed&&t.isCurrent()?(closeModal(),await G(e)):alert(`아직 결과를 확인하지 못했습니다. 자동 재전송하지 않습니다.`)}catch(e){alert(e.message)}}),document.getElementById(`btnSaveIncoming`).after(n)}}return}if(u.length>440||u.some(e=>!Number.isSafeInteger(l*e.qty)))throw Error(`구성품 수량 또는 거래 크기가 허용 범위를 벗어났습니다.`);let p=n(s(c,`frozenLogs`)),m=n(s(c,`activityLogs`)),g=u.map(()=>n(s(c,`frozenLogs`))),_=e.bagTypeId?n(s(c,`bagLogs`)):null,v=e.bagTypeId?n(s(c,`stockLedger`)):null,y=ke({product:e,frozenLogId:p.id,date:a,expiry:o,qty:l,staff:f}),b=y?n(c,`productTransferRequests`,y.idempotencyKey):null,x=n(c,`frozenProducts`,e.id),T=n(c,`closings`,a),E=e.bagTypeId?n(c,`bagTypes`,e.bagTypeId):null,D=new Date,k=JSON.stringify({name:e.name,kind:U(e),bagTypeId:e.bagTypeId||null,recipeTitleRef:e.recipeTitleRef||null,components:u});await r(c,async t=>{let[n,r,i,...s]=await Promise.all([t.get(x),t.get(T),E?t.get(E):Promise.resolve(null),...[p,...g,_,v,b,m].filter(Boolean).map(e=>t.get(e))]);if(s.some(e=>e.exists()))throw Error(`입고 문서 ID가 이미 사용 중입니다. 저장을 중단했습니다.`);if(r.exists()&&r.data().status===`closed`)throw Error(`${a}는 이미 마감된 날짜입니다.`);if(!n.exists()||n.data().active===!1)throw Error(`제품이 변경되거나 비활성화되었습니다. 다시 불러와주세요.`);let c=n.data();if(JSON.stringify({name:c.name,kind:U(c),bagTypeId:c.bagTypeId||null,recipeTitleRef:c.recipeTitleRef||null,components:U(c)===`sampleSet`?q(c.components):[]})!==k)throw Error(`제품 구성이 변경되었습니다. 다시 불러와주세요.`);if(E&&!i?.exists())throw Error(`연결된 봉투 문서가 없습니다. 입고를 중단하고 봉투 마스터를 확인해주세요.`);let d=0;if(i?.exists()){let n=i.data(),r=Number(n.currentQty??0);if(!Number.isFinite(r)||r<l)throw Error(`봉투 재고가 부족하거나 유효하지 않습니다. 현재 ${n.currentQty}장, 필요 ${l}장`);let o=r-l;t.update(E,{currentQty:o,updatedAt:D}),t.set(_,{date:a,timestamp:D,bagTypeId:e.bagTypeId,bagNameSnapshot:n.name,type:`autoDeduct`,qty:-l,before:r,after:o,staffName:f,note:`동결제품 입고 자동차감 - ${e.name}`}),t.set(v,{actionType:`frozenProductIncoming`,actionId:p.id,timestamp:D,date:a,status:`active`,items:[{collection:`bagTypes`,docId:e.bagTypeId,field:`currentQty`,delta:-l,before:r,after:o,label:`${n.name} 봉투`,stockUpdatedAtSnapshot:D,bagLogId:_.id}]}),d=l}t.set(p,{date:a,timestamp:D,productId:e.id,productNameSnapshot:e.name,componentsSnapshot:U(e)===`sampleSet`?u:null,expiryDate:o,qty:l,bagTypeId:e.bagTypeId||null,deductedBagQty:d,staffName:f,note:``,status:`active`,ledgerId:d?v.id:null,...g.length?{componentDeductLogIds:g.map(e=>e.id)}:{}}),u.forEach((n,r)=>{t.set(g[r],{date:a,timestamp:D,productId:n.frozenProductId,productNameSnapshot:h(n.frozenProductId),componentsSnapshot:null,expiryDate:null,qty:-(l*n.qty),bagTypeId:null,deductedBagQty:0,staffName:f,note:`샘플세트 제작 자동차감 - ${e.name} ${l}세트`,status:`active`,ledgerId:null,sampleSetLogId:p.id})}),b&&t.set(b,y),await w({action:`frozenProduct`,subAction:`incoming`,date:a,staff:f,message:`동결제품 입고 — ${e.name} +${l}봉 / 담당: ${f}`,details:{frozenLogId:p.id,productId:e.id,productName:e.name,componentsSnapshot:U(e)===`sampleSet`?q(e.components):null,qty:l,expiryDate:o||null,deductedBagQty:d,bagTypeId:e.bagTypeId||null,note:null}},{batch:t,ref:m})}),t.isCurrent()&&(closeModal(),t.isCurrent()&&(await G(e),S(`입고 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}var X={};function Ne(e,t=null){let n=``;for(let r of e)(X[r]||[]).forEach(e=>{n+=`<option value="${g(e.name)}"${t!==null&&t===e.name?` selected`:``}>${g(e.name)}</option>`});return n}function Pe(){return y===`admin`?`대표`:y===`office`?`사무실`:y===`production`?`생산실`:`시스템`}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}u(`frozenProduct`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var Q=b(`frozenProduct`);Q.refresh=z;async function $(e){let[t,n]=await Promise.all([B(e),te(e)]);return{products:t,staff:n}}function Fe({cacheOnly:e=!0}={}){return Q.prepare?.(`default`,$,{cacheOnly:e})}export{Fe as preparePage,z as renderFrozenProduct};