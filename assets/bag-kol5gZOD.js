import{_ as e,b as t,d as n,g as r,s as i,u as a,y as o}from"./index.esm-rHmxwfvm.js";import{n as s}from"./firebase-qGjqjNvO.js";import{a as c}from"./formDraft-DoA-Ia7D.js";import{G as l,L as u,S as d,f,m as p}from"./index-C3J_bQqC.js";import{n as m}from"./activityLogs-CRxSouBf.js";import{t as h}from"./closingGuard-Cs6mxhOl.js";import{t as g}from"./sortable-DIR4yJqN.js";import{t as _}from"./readCommand-BBDmLRkl.js";import{t as v}from"./pageRefresh-33o9kkfx.js";var y=p(`bag`);async function b(e,t=[`admin`,`office`]){let n=d();try{return await _(y,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[봉투 저장]`,e),alert(e.message)}}async function x(e,n,r,i,a){return b(async c=>{if(await h(a,c))return!1;let l=t(s,`bagTypes`,e.id),u=t(o(s,`bagLogs`));return await c.transaction(s,async t=>{let a=await t.get(l);if(!a.exists()||Number(a.data().currentQty||0)!==Number(e.currentQty||0))throw Error(`다른 작업으로 봉투 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);t.update(l,n),t.set(u,r),await m(i,{batch:t})},{targets:[l,u]}),!0},[`admin`,`office`,`production`])}var S=[];async function C({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`;let n=await y.load(e=>q(e),{force:e,onChange:v(y,C)});!n||!t.isConnected||(S=n.bags,U=n.staff,E())}async function w(e={getDocs:i}){return(await e.getDocs(n(o(s,`bagTypes`),a(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}var T=null;function E(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          ${l===`admin`||l===`office`?`<button class="btn-primary" id="btnNewBag">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="bagList">
          ${D()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="bagDetail">
        <div class="detail-empty">봉투를 선택해주세요</div>
      </div>
    </div>
  `,M(),k(),document.getElementById(`btnNewBag`)?.addEventListener(`click`,R)}function D(){if(S.length===0)return`<div class="list-empty">등록된 봉투 없음</div>`;let e=S.filter(e=>e.active!==!1),t=S.filter(e=>e.active===!1),n=e.filter(e=>e.category===`raw`),r=e.filter(e=>e.category===`freezeDry`),i=``;return n.length>0&&(i+=`<div class="list-group-label">생식</div>`,i+=`<div class="sortable-master-list" id="bagListRaw" data-category="raw">${n.map(e=>O(e)).join(``)}</div>`),r.length>0&&(i+=`<div class="list-group-label">동결건조</div>`,i+=`<div class="sortable-master-list" id="bagListFreezeDry" data-category="freezeDry">${r.map(e=>O(e)).join(``)}</div>`),t.length>0&&(i+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,i+=`<div class="master-inactive-list">${t.map(e=>O(e)).join(``)}</div>`),i}function O(e){let t=e.currentQty<(e.minimumQty||0),n=e.active===!1,r=l===`admin`||l===`office`;return`
    <div class="recipe-list-item ${T===e.id?`active`:``} ${n?`inactive-master`:``}" data-id="${e.id}">
      ${r?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${n?`#999`:t?`#e53e3e`:`#1a1a1a`}">${e.name}</span>
        <div class="recipe-tags">
          <span class="tag tag-${e.category}">${e.category===`raw`?`생식`:`동결`}</span>
          ${n?`<span class="tag tag-inactive">비활성</span>`:``}
          <span style="font-size:11px;color:${t?`#e53e3e`:`#888`}">
            ${Math.floor((e.currentQty||0)/(e.piecesPerBox||1))}박스 (${e.currentQty||0}장)
          </span>
        </div>
      </div>
      ${l===`admin`||l===`office`?`
        <label class="toggle-switch" title="${n?`비활성`:`활성`}" onclick="event.stopPropagation()">
          <input type="checkbox" class="bag-active-toggle" data-id="${e.id}" ${n?``:`checked`}>
          <span class="toggle-slider"></span>
        </label>
      `:``}
    </div>
  `}function k(){l!==`admin`&&l!==`office`||[[`bagListRaw`,`raw`],[`bagListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&g.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await A(t)}})})}async function A(e){return b(t=>j(e,t))}async function j(n,r){let i=document.getElementById(n===`raw`?`bagListRaw`:`bagListFreezeDry`);if(!i)return;let a=Array.from(i.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),o=S.filter(e=>e.category===`raw`).length,c=n===`freezeDry`?o:0,l=new Date,u=e(s);a.forEach((e,n)=>{u.update(t(s,`bagTypes`,e),{sortOrder:c+n,updatedAt:l})});try{if(await r.commit(u,{targets:a.map(e=>t(s,`bagTypes`,e))}),!r.isCurrent())return;let e=new Map(a.map((e,t)=>[e,c+t]));S=S.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:l}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)),await C({force:!0})}catch(e){console.error(`[bag] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e));let t=await w();if(!r.isCurrent())return;if(S=t,E(),T){let e=S.find(e=>e.id===T);e&&await N(e)}}}function M(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(T=e.dataset.id,N(S.find(e=>e.id===T)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`))})}),document.querySelectorAll(`.bag-active-toggle`).forEach(n=>{n.addEventListener(`click`,e=>e.stopPropagation()),n.addEventListener(`change`,async n=>{if(l!==`admin`&&l!==`office`){alert(`봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.`),n.target.checked=!n.target.checked;return}let r=n.target.dataset.id,i=n.target.checked,a=S.find(e=>e.id===r),o=a?.active!==!1;try{await _(y,async n=>{let c=d(),l=e(s);if(l.update(t(s,`bagTypes`,r),{active:i,updatedAt:new Date}),o!==i&&await m({action:`bag`,subAction:`activeToggle`,date:u(),staff:K(),message:`봉투 종류 ${i?`활성`:`비활성`} — ${a?.name||r}`,details:{bagTypeId:r,bagName:a?.name||null,active:i}},{batch:l}),await n.commit(l,{targets:[t(s,`bagTypes`,r)]}),a&&(a.active=i),!(c&&!c.isCurrent())&&(await C({force:!0}),T)){let e=S.find(e=>e.id===T);e&&await N(e)}})}catch(e){console.error(`[bag] active save failed:`,e),alert(e.message||`활성 상태 저장 중 오류가 발생했습니다.`),n.target.checked=!i}})})}async function N(e){let t=document.getElementById(`bagDetail`),a=l===`admin`||l===`office`,c=(await i(n(o(s,`bagLogs`),r(`bagTypeId`,`==`,e.id)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.timestamp!==void 0).sort((e,t)=>{let n=e=>e?.toMillis?.()??(e?.seconds?e.seconds*1e3:new Date(e).getTime()||0);return n(t.timestamp)-n(e.timestamp)||t.id.localeCompare(e.id)}).slice(0,30);!t.isConnected||T!==e.id||(t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        ${a?`<button class="btn-secondary" id="btnEditBag">수정</button>`:``}
        ${a?`<button class="btn-danger" id="btnDeleteBag">삭제</button>`:``}
        <button class="btn-secondary" id="btnAdjustBag">수동조정</button>
        <button class="btn-primary" id="btnAddBagIncoming">+ 입고 등록</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 요약 -->
      <div class="form-section">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 재고</span>
            <span class="stat-value">${e.currentQty||0}장 (${Math.floor((e.currentQty||0)/(e.piecesPerBox||1))}박스)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">박스당 장수</span>
            <span class="stat-value">${e.piecesPerBox||`-`}장</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value" style="color:${(e.currentQty||0)<(e.minimumQty||0)?`#e53e3e`:`#1a1a1a`}">
              ${Math.floor((e.minimumQty||0)/(e.piecesPerBox||1))}박스
            </span>
          </div>
        </div>
      </div>

      <!-- 이력 테이블 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>수량(장)</th>
                <th>담당자</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${c.length===0?`<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:c.map(e=>`
                  <tr>
                    <td>${e.date||`-`}</td>
                    <td>
                      <span class="tag ${e.type===`incoming`?`tag-raw`:e.type===`autoDeduct`?``:`tag-cat`}"
                            style="${e.type===`autoDeduct`?`background:#f0f0f0;color:#666`:``}">
                        ${e.type===`incoming`?`입고`:e.type===`autoDeduct`?`자동차감`:`수동조정`}
                      </span>
                    </td>
                    <td style="color:${e.qty>0?`#2d7a3a`:`#e53e3e`}">${e.qty>0?`+`:``}${e.qty}</td>
                    <td>${e.staffName||`-`}</td>
                    <td>${e.note||e.reason||`-`}</td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnAddBagIncoming`).addEventListener(`click`,()=>V(e)),document.getElementById(`btnAdjustBag`).addEventListener(`click`,()=>H(e)),document.getElementById(`btnEditBag`)?.addEventListener(`click`,()=>B(e)),document.getElementById(`btnDeleteBag`)?.addEventListener(`click`,()=>I(e)))}async function P(e,t={getDocs:i}){let{getDocs:a}=t,[c,l,u]=await Promise.all([a(n(o(s,`recipes`),r(`bagTypeId`,`==`,e.id))),a(n(o(s,`frozenProducts`),r(`bagTypeId`,`==`,e.id))),a(n(o(s,`bagLogs`),r(`bagTypeId`,`==`,e.id)))]);return{linkedRecipes:c.docs.map(e=>({id:e.id,...e.data()})),linkedProducts:l.docs.map(e=>({id:e.id,...e.data()})),logDocs:u.docs}}function F(e,t){let n=Number(e.currentQty||0);return n>0?`${e.name} 재고 ${n}장이 남아있습니다.\n봉투 재고 및 이력 ${t}건이 모두 삭제됩니다.\n진행하시겠습니까?`:t>0?`입고/조정 이력 ${t}건이 함께 삭제됩니다.\n진행하시겠습니까?`:`${e.name} 봉투를 삭제하시겠습니까?`}async function I(e){return b(t=>L(e,t))}async function L(n,r){if(l!==`admin`&&l!==`office`){alert(`봉투 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let{linkedRecipes:i,linkedProducts:a,logDocs:o}=await P(n,r),c=[...i.map(e=>e.displayName||e.name||e.id),...a.map(e=>e.name||e.id)];if(c.length>0){alert(`${c.join(`, `)}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);return}let l=o.length;if(!await f({title:`봉투 삭제`,message:F(n,l),confirmText:`삭제`,danger:!0}))return;if(o.length>498)throw Error(`삭제할 이력이 너무 많습니다. 관리자에게 문의해주세요.`);let d=e(s);if(d.delete(t(s,`bagTypes`,n.id)),o.forEach(e=>d.delete(t(s,`bagLogs`,e.id))),await m({action:`bag`,subAction:`delete`,date:u(),staff:K(),message:`봉투 삭제 — ${n.name}`,details:{bagTypeId:n.id,bagName:n.name,bagType:n.category===`freezeDry`?`dried`:`raw`,currentQty:Number(n.currentQty||0),logCount:l}},{batch:d}),await r.commit(d,{targets:[t(s,`bagTypes`,n.id)]}),!r.isCurrent())return;T=null,await C({force:!0}),alert(`봉투가 삭제되었습니다.`)}catch(e){console.error(`[bag] delete failed:`,e),alert(e.message||`봉투 삭제 중 오류가 발생했습니다.`)}}function R(){z(null)}function z(n){let r=!n;G(`
    <h3 class="modal-title">${r?`봉투 추가`:`봉투 수정`}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${n?.name||``}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${r?``:`disabled`}>
          <option value="">선택</option>
          <option value="raw" ${n?.category===`raw`?`selected`:``}>생식</option>
          <option value="freezeDry" ${n?.category===`freezeDry`?`selected`:``}>동결건조</option>
        </select>
      </div>
      <div class="form-group">
        <label>박스당 장수</label>
        <input type="number" id="m_piecesPerBox" value="${n?.piecesPerBox||``}" placeholder="장" />
      </div>
      <div class="form-group">
        <label>최소재고(박스)</label>
        <input type="number" id="m_minBox" value="${n?.minimumBoxQty||``}" placeholder="박스" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBag">${r?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnSaveBag`).addEventListener(`click`,()=>b(async i=>{let a=e(s);if(l!==`admin`&&l!==`office`){alert(`봉투 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let o=document.getElementById(`m_bagName`).value.trim(),c=document.getElementById(`m_bagCategory`).value,u=parseInt(document.getElementById(`m_piecesPerBox`).value)||0,d=parseInt(document.getElementById(`m_minBox`).value)||0;if(!o||!c){alert(`봉투명과 종류는 필수입니다.`);return}let f={name:o,category:c,piecesPerBox:u,minimumBoxQty:d,minimumQty:d*u,sortOrder:r?S.length:n.sortOrder,active:r?!0:n.active!==!1,updatedAt:new Date};r?(f.currentQty=0,f.createdAt=new Date,a.set(target,f)):a.update(t(s,`bagTypes`,n.id),f),await i.commit(a,{targets:[target]}),i.isCurrent()&&(closeModal(),await C({force:!0}),alert(r?`봉투 추가 완료!`:`수정 완료!`))}))}function B(e){z(e)}function V(e){G(`
    <h3 class="modal-title">봉투 입고 등록 — ${e.name}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>수량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수 입력" />
      </div>
      <div class="form-group">
        <label>박스 환산</label>
        <span id="m_boxCalc" style="line-height:36px;font-size:12px;color:#888;">- 박스</span>
      </div>
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${u()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${W([`lead`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBagIncoming">추가</button>
    </div>
  `),document.getElementById(`m_qty`).addEventListener(`input`,t=>{let n=parseInt(t.target.value)||0;document.getElementById(`m_boxCalc`).textContent=`${Math.floor(n/e.piecesPerBox)}박스`}),document.getElementById(`btnSaveBagIncoming`).addEventListener(`click`,async()=>{let t=d(),n=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_date`).value,i=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value;if(!n||!r){alert(`수량과 날짜는 필수입니다.`);return}if(!i){alert(`담당자는 필수입니다.`);return}if(await h(r)||t&&!t.isCurrent())return;let o=e.currentQty||0,s=o+n;if(!await x(e,{currentQty:s,updatedAt:new Date},{date:r,timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`incoming`,qty:n,before:o,after:s,staffName:i,note:a},{action:`bag`,subAction:`incoming`,date:r,staff:i,message:`봉투 입고 — ${e.name} +${n}장 / 담당: ${i}`,details:{bagTypeId:e.id,bagName:e.name,qty:n,before:o,after:s,note:a||null}},r)||t&&!t.isCurrent())return;closeModal(),await C({force:!0});let c=S.find(t=>t.id===e.id);c&&await N(c),alert(`입고 등록 완료!`)})}function H(e){G(`
    <h3 class="modal-title">수동 재고 조정 — ${e.name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${e.currentQty||0}장</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="조정 사유" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${W([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=d(),n=document.getElementById(`m_adjustType`).value,r=parseInt(document.getElementById(`m_qty`).value),i=document.getElementById(`m_reason`).value.trim(),a=document.getElementById(`m_staff`).value;if(!r||!i||!a){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let o=u();if(await h(o))return;let s=n===`plus`?r:-r,c=e.currentQty||0,l=c+s;if(l<0){alert(`조정 후 잔량이 ${l}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${c}장에서 최대 ${c}장까지만 감소 가능합니다.`);return}let f={currentQty:l,updatedAt:new Date},p={date:u(),timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`adjust`,qty:s,before:c,after:l,staffName:a,reason:i},m=s>=0?`+`:``;if(!await x(e,f,p,{action:`bag`,subAction:`adjust`,date:o,staff:a,message:`봉투 수동조정 — ${e.name} ${m}${s}장 / 사유: ${i} / 담당: ${a}`,details:{bagTypeId:e.id,bagName:e.name,delta:s,before:c,after:l,reason:i}},o)||t&&!t.isCurrent())return;closeModal(),await C({force:!0});let g=S.find(t=>t.id===e.id);g&&await N(g),alert(`조정 완료!`)})}var U={};function W(e){let t=``;for(let n of e)(U[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function G(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}function K(){return l===`admin`?`대표`:l===`office`?`사무실`:l===`production`?`생산실`:`시스템`}c(`bag`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function q(e){let n=[`senior`,`lead`,`office`],[r,...i]=await Promise.all([w(e),...n.map(n=>e.getDoc(t(s,`staffGroups`,n)))]);return{bags:r,staff:Object.fromEntries(n.map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function J({cacheOnly:e=!0}={}){return y.prepare?.(`default`,q,{cacheOnly:e})}export{J as preparePage,C as renderBag};