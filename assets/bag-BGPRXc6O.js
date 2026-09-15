import{_ as e,b as t,d as n,g as r,h as i,i as a,n as o,o as s,u as c,y as l}from"./index.esm-rHmxwfvm.js";import{n as u}from"./firebase-qGjqjNvO.js";import{n as d}from"./modalManager-Z4b2ihO9.js";import{H as f,P as p,g as m}from"./index-ihWgJTcM.js";import{n as h}from"./activityLogs-Jg2Ymepu.js";import{t as g}from"./closingGuard-BCSnBl5U.js";import{t as _}from"./sortable-DoCboJo0.js";var v=[];async function y(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`;let t=await Promise.all([b(),R()]);e.isConnected&&([v]=t,S())}async function b(){return(await s(n(l(u,`bagTypes`),c(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}var x=null;function S(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          ${f===`admin`||f===`office`?`<button class="btn-primary" id="btnNewBag">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="bagList">
          ${C()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="bagDetail">
        <div class="detail-empty">봉투를 선택해주세요</div>
      </div>
    </div>
  `,D(),T(),document.getElementById(`btnNewBag`)?.addEventListener(`click`,M)}function C(){if(v.length===0)return`<div class="list-empty">등록된 봉투 없음</div>`;let e=v.filter(e=>e.active!==!1),t=v.filter(e=>e.active===!1),n=e.filter(e=>e.category===`raw`),r=e.filter(e=>e.category===`freezeDry`),i=``;return n.length>0&&(i+=`<div class="list-group-label">생식</div>`,i+=`<div class="sortable-master-list" id="bagListRaw" data-category="raw">${n.map(e=>w(e)).join(``)}</div>`),r.length>0&&(i+=`<div class="list-group-label">동결건조</div>`,i+=`<div class="sortable-master-list" id="bagListFreezeDry" data-category="freezeDry">${r.map(e=>w(e)).join(``)}</div>`),t.length>0&&(i+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,i+=`<div class="master-inactive-list">${t.map(e=>w(e)).join(``)}</div>`),i}function w(e){let t=e.currentQty<(e.minimumQty||0),n=e.active===!1,r=f===`admin`||f===`office`;return`
    <div class="recipe-list-item ${x===e.id?`active`:``} ${n?`inactive-master`:``}" data-id="${e.id}">
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
      ${f===`admin`||f===`office`?`
        <label class="toggle-switch" title="${n?`비활성`:`활성`}" onclick="event.stopPropagation()">
          <input type="checkbox" class="bag-active-toggle" data-id="${e.id}" ${n?``:`checked`}>
          <span class="toggle-slider"></span>
        </label>
      `:``}
    </div>
  `}function T(){f!==`admin`&&f!==`office`||[[`bagListRaw`,`raw`],[`bagListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&_.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await E(t)}})})}async function E(n){let r=document.getElementById(n===`raw`?`bagListRaw`:`bagListFreezeDry`);if(!r)return;let i=Array.from(r.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),a=v.filter(e=>e.category===`raw`).length,o=n===`freezeDry`?a:0,s=new Date,c=e(u);i.forEach((e,n)=>{c.update(t(u,`bagTypes`,e),{sortOrder:o+n,updatedAt:s})});try{await c.commit();let e=new Map(i.map((e,t)=>[e,o+t]));v=v.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:s}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){if(console.error(`[bag] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),v=await b(),S(),x){let e=v.find(e=>e.id===x);e&&await O(e)}}}function D(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(x=e.dataset.id,O(v.find(e=>e.id===x)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`))})}),document.querySelectorAll(`.bag-active-toggle`).forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,async e=>{if(f!==`admin`&&f!==`office`){alert(`봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.`),e.target.checked=!e.target.checked;return}let n=e.target.dataset.id,r=e.target.checked,a=v.find(e=>e.id===n),o=a?.active!==!1;try{if(await i(t(u,`bagTypes`,n),{active:r,updatedAt:new Date}),a&&(a.active=r),o!==r&&await h({action:`bag`,subAction:`activeToggle`,date:p(),staff:V(),message:`봉투 종류 ${r?`활성`:`비활성`} — ${a?.name||n}`,details:{bagTypeId:n,bagName:a?.name||null,active:r}}),S(),x){let e=v.find(e=>e.id===x);e&&await O(e)}}catch(t){console.error(`[bag] active save failed:`,t),alert(`활성 상태 저장 중 오류가 발생했습니다.`),e.target.checked=!r}})})}async function O(e){let t=document.getElementById(`bagDetail`),r=f===`admin`||f===`office`,i=(await s(n(l(u,`bagLogs`),c(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.bagTypeId===e.id).slice(0,30);t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        ${r?`<button class="btn-secondary" id="btnEditBag">수정</button>`:``}
        ${r?`<button class="btn-danger" id="btnDeleteBag">삭제</button>`:``}
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
              ${i.length===0?`<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:i.map(e=>`
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
  `,document.getElementById(`btnAddBagIncoming`).addEventListener(`click`,()=>F(e)),document.getElementById(`btnAdjustBag`).addEventListener(`click`,()=>I(e)),document.getElementById(`btnEditBag`)?.addEventListener(`click`,()=>P(e)),document.getElementById(`btnDeleteBag`)?.addEventListener(`click`,()=>j(e))}async function k(e){let[t,i,a]=await Promise.all([s(n(l(u,`recipes`),r(`bagTypeId`,`==`,e.id))),s(n(l(u,`frozenProducts`),r(`bagTypeId`,`==`,e.id))),s(n(l(u,`bagLogs`),r(`bagTypeId`,`==`,e.id)))]);return{linkedRecipes:t.docs.map(e=>({id:e.id,...e.data()})),linkedProducts:i.docs.map(e=>({id:e.id,...e.data()})),logDocs:a.docs}}function A(e,t){let n=Number(e.currentQty||0);return n>0?`${e.name} 재고 ${n}장이 남아있습니다.\n봉투 재고 및 이력 ${t}건이 모두 삭제됩니다.\n진행하시겠습니까?`:t>0?`입고/조정 이력 ${t}건이 함께 삭제됩니다.\n진행하시겠습니까?`:`${e.name} 봉투를 삭제하시겠습니까?`}async function j(n){if(f!==`admin`&&f!==`office`){alert(`봉투 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let{linkedRecipes:r,linkedProducts:i,logDocs:a}=await k(n),o=[...r.map(e=>e.displayName||e.name||e.id),...i.map(e=>e.name||e.id)];if(o.length>0){alert(`${o.join(`, `)}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);return}let s=a.length;if(!await m({title:`봉투 삭제`,message:A(n,s),confirmText:`삭제`,danger:!0}))return;let c=e(u);c.delete(t(u,`bagTypes`,n.id)),a.forEach(e=>c.delete(t(u,`bagLogs`,e.id))),await c.commit(),await h({action:`bag`,subAction:`delete`,date:p(),staff:V(),message:`봉투 삭제 — ${n.name}`,details:{bagTypeId:n.id,bagName:n.name,bagType:n.category===`freezeDry`?`dried`:`raw`,currentQty:Number(n.currentQty||0),logCount:s}}),x=null,v=await b(),S(),alert(`봉투가 삭제되었습니다.`)}catch(e){console.error(`[bag] delete failed:`,e),alert(`봉투 삭제 중 오류가 발생했습니다.`)}}function M(){N(null)}function N(e){let n=!e;B(`
    <h3 class="modal-title">${n?`봉투 추가`:`봉투 수정`}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${e?.name||``}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${n?``:`disabled`}>
          <option value="">선택</option>
          <option value="raw" ${e?.category===`raw`?`selected`:``}>생식</option>
          <option value="freezeDry" ${e?.category===`freezeDry`?`selected`:``}>동결건조</option>
        </select>
      </div>
      <div class="form-group">
        <label>박스당 장수</label>
        <input type="number" id="m_piecesPerBox" value="${e?.piecesPerBox||``}" placeholder="장" />
      </div>
      <div class="form-group">
        <label>최소재고(박스)</label>
        <input type="number" id="m_minBox" value="${e?.minimumBoxQty||``}" placeholder="박스" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBag">${n?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnSaveBag`).addEventListener(`click`,async()=>{if(f!==`admin`&&f!==`office`){alert(`봉투 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let r=document.getElementById(`m_bagName`).value.trim(),a=document.getElementById(`m_bagCategory`).value,s=parseInt(document.getElementById(`m_piecesPerBox`).value)||0,c=parseInt(document.getElementById(`m_minBox`).value)||0;if(!r||!a){alert(`봉투명과 종류는 필수입니다.`);return}let d={name:r,category:a,piecesPerBox:s,minimumBoxQty:c,minimumQty:c*s,sortOrder:n?v.length:e.sortOrder,active:n?!0:e.active!==!1,updatedAt:new Date};n?(d.currentQty=0,d.createdAt=new Date,await o(l(u,`bagTypes`),d)):await i(t(u,`bagTypes`,e.id),d),v=await b(),closeModal(),S(),alert(n?`봉투 추가 완료!`:`수정 완료!`)})}function P(e){N(e)}function F(e){B(`
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
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${z([`lead`])}
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
  `),document.getElementById(`m_qty`).addEventListener(`input`,t=>{let n=parseInt(t.target.value)||0;document.getElementById(`m_boxCalc`).textContent=`${Math.floor(n/e.piecesPerBox)}박스`}),document.getElementById(`btnSaveBagIncoming`).addEventListener(`click`,async()=>{let n=parseInt(document.getElementById(`m_qty`).value),r=document.getElementById(`m_date`).value,a=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!n||!r){alert(`수량과 날짜는 필수입니다.`);return}if(!a){alert(`담당자는 필수입니다.`);return}if(await g(r))return;let c=e.currentQty||0,d=c+n;await i(t(u,`bagTypes`,e.id),{currentQty:d,updatedAt:new Date}),await o(l(u,`bagLogs`),{date:r,timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`incoming`,qty:n,before:c,after:d,staffName:a,note:s}),await h({action:`bag`,subAction:`incoming`,date:r,staff:a,message:`봉투 입고 — ${e.name} +${n}장 / 담당: ${a}`,details:{bagTypeId:e.id,bagName:e.name,qty:n,before:c,after:d,note:s||null}}),v=await b(),closeModal(),O(v.find(t=>t.id===e.id)),C(),document.getElementById(`bagList`).innerHTML=C(),D(),alert(`입고 등록 완료!`)})}function I(e){B(`
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
        ${z([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_adjustType`).value,r=parseInt(document.getElementById(`m_qty`).value),a=document.getElementById(`m_reason`).value.trim(),s=document.getElementById(`m_staff`).value;if(!r||!a||!s){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let c=p();if(await g(c))return;let d=n===`plus`?r:-r,f=e.currentQty||0,m=f+d;if(m<0){alert(`조정 후 잔량이 ${m}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${f}장에서 최대 ${f}장까지만 감소 가능합니다.`);return}await i(t(u,`bagTypes`,e.id),{currentQty:m,updatedAt:new Date}),await o(l(u,`bagLogs`),{date:p(),timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`adjust`,qty:d,before:f,after:m,staffName:s,reason:a});let _=d>=0?`+`:``;await h({action:`bag`,subAction:`adjust`,date:c,staff:s,message:`봉투 수동조정 — ${e.name} ${_}${d}장 / 사유: ${a} / 담당: ${s}`,details:{bagTypeId:e.id,bagName:e.name,delta:d,before:f,after:m,reason:a}}),v=await b(),closeModal(),O(v.find(t=>t.id===e.id)),document.getElementById(`bagList`).innerHTML=C(),D(),alert(`조정 완료!`)})}var L={};async function R(){Object.keys(L).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let n=await a(t(u,`staffGroups`,e));n.exists()&&(L[e]=n.data().members||[])}))}function z(e){let t=``;for(let n of e)(L[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function B(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}function V(){return f===`admin`?`대표`:f===`office`?`사무실`:f===`production`?`생산실`:`시스템`}d(`bag`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{y as renderBag};