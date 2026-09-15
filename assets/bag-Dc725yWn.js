import{a as e,c as t,f as n,g as r,h as i,i as a,m as o,n as s,p as c,s as l}from"./index.esm-Cf9DaHbi.js";import{n as u}from"./firebase-BQPCO7kq.js";import{j as d,m as f,w as p}from"./index-CMgkQ4he.js";import{n as m}from"./activityLogs-Mn_dgBRB.js";import{t as h}from"./closingGuard-CS1p4aoM.js";import{t as g}from"./sortable.esm-D0d_dJ5t.js";var _=[];async function v(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`;let t=await Promise.all([y(),L()]);e.isConnected&&([_]=t,x())}async function y(){return(await e(t(i(u,`bagTypes`),l(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}var b=null;function x(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          ${d===`admin`||d===`office`?`<button class="btn-primary" id="btnNewBag">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="bagList">
          ${S()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="bagDetail">
        <div class="detail-empty">봉투를 선택해주세요</div>
      </div>
    </div>
  `,E(),w(),document.getElementById(`btnNewBag`)?.addEventListener(`click`,j)}function S(){if(_.length===0)return`<div class="list-empty">등록된 봉투 없음</div>`;let e=_.filter(e=>e.active!==!1),t=_.filter(e=>e.active===!1),n=e.filter(e=>e.category===`raw`),r=e.filter(e=>e.category===`freezeDry`),i=``;return n.length>0&&(i+=`<div class="list-group-label">생식</div>`,i+=`<div class="sortable-master-list" id="bagListRaw" data-category="raw">${n.map(e=>C(e)).join(``)}</div>`),r.length>0&&(i+=`<div class="list-group-label">동결건조</div>`,i+=`<div class="sortable-master-list" id="bagListFreezeDry" data-category="freezeDry">${r.map(e=>C(e)).join(``)}</div>`),t.length>0&&(i+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,i+=`<div class="master-inactive-list">${t.map(e=>C(e)).join(``)}</div>`),i}function C(e){let t=e.currentQty<(e.minimumQty||0),n=e.active===!1,r=d===`admin`||d===`office`;return`
    <div class="recipe-list-item ${b===e.id?`active`:``} ${n?`inactive-master`:``}" data-id="${e.id}">
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
      ${d===`admin`||d===`office`?`
        <label class="toggle-switch" title="${n?`비활성`:`활성`}" onclick="event.stopPropagation()">
          <input type="checkbox" class="bag-active-toggle" data-id="${e.id}" ${n?``:`checked`}>
          <span class="toggle-slider"></span>
        </label>
      `:``}
    </div>
  `}function w(){d!==`admin`&&d!==`office`||[[`bagListRaw`,`raw`],[`bagListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&g.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await T(t)}})})}async function T(e){let t=document.getElementById(e===`raw`?`bagListRaw`:`bagListFreezeDry`);if(!t)return;let n=Array.from(t.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),i=_.filter(e=>e.category===`raw`).length,a=e===`freezeDry`?i:0,s=new Date,c=o(u);n.forEach((e,t)=>{c.update(r(u,`bagTypes`,e),{sortOrder:a+t,updatedAt:s})});try{await c.commit();let e=new Map(n.map((e,t)=>[e,a+t]));_=_.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:s}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){if(console.error(`[bag] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),_=await y(),x(),b){let e=_.find(e=>e.id===b);e&&await D(e)}}}function E(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(b=e.dataset.id,D(_.find(e=>e.id===b)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`))})}),document.querySelectorAll(`.bag-active-toggle`).forEach(e=>{e.addEventListener(`click`,e=>e.stopPropagation()),e.addEventListener(`change`,async e=>{if(d!==`admin`&&d!==`office`){alert(`봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.`),e.target.checked=!e.target.checked;return}let t=e.target.dataset.id,i=e.target.checked,a=_.find(e=>e.id===t),o=a?.active!==!1;try{if(await n(r(u,`bagTypes`,t),{active:i,updatedAt:new Date}),a&&(a.active=i),o!==i&&await m({action:`bag`,subAction:`activeToggle`,date:p(),staff:B(),message:`봉투 종류 ${i?`활성`:`비활성`} — ${a?.name||t}`,details:{bagTypeId:t,bagName:a?.name||null,active:i}}),x(),b){let e=_.find(e=>e.id===b);e&&await D(e)}}catch(t){console.error(`[bag] active save failed:`,t),alert(`활성 상태 저장 중 오류가 발생했습니다.`),e.target.checked=!i}})})}async function D(n){let r=document.getElementById(`bagDetail`),a=d===`admin`||d===`office`,o=(await e(t(i(u,`bagLogs`),l(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.bagTypeId===n.id).slice(0,30);r.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${n.name}</span>
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
            <span class="stat-value">${n.currentQty||0}장 (${Math.floor((n.currentQty||0)/(n.piecesPerBox||1))}박스)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">박스당 장수</span>
            <span class="stat-value">${n.piecesPerBox||`-`}장</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value" style="color:${(n.currentQty||0)<(n.minimumQty||0)?`#e53e3e`:`#1a1a1a`}">
              ${Math.floor((n.minimumQty||0)/(n.piecesPerBox||1))}박스
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
              ${o.length===0?`<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:o.map(e=>`
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
  `,document.getElementById(`btnAddBagIncoming`).addEventListener(`click`,()=>P(n)),document.getElementById(`btnAdjustBag`).addEventListener(`click`,()=>F(n)),document.getElementById(`btnEditBag`)?.addEventListener(`click`,()=>N(n)),document.getElementById(`btnDeleteBag`)?.addEventListener(`click`,()=>A(n))}async function O(n){let[r,a,o]=await Promise.all([e(t(i(u,`recipes`),c(`bagTypeId`,`==`,n.id))),e(t(i(u,`frozenProducts`),c(`bagTypeId`,`==`,n.id))),e(t(i(u,`bagLogs`),c(`bagTypeId`,`==`,n.id)))]);return{linkedRecipes:r.docs.map(e=>({id:e.id,...e.data()})),linkedProducts:a.docs.map(e=>({id:e.id,...e.data()})),logDocs:o.docs}}function k(e,t){let n=Number(e.currentQty||0);return n>0?`${e.name} 재고 ${n}장이 남아있습니다.\n봉투 재고 및 이력 ${t}건이 모두 삭제됩니다.\n진행하시겠습니까?`:t>0?`입고/조정 이력 ${t}건이 함께 삭제됩니다.\n진행하시겠습니까?`:`${e.name} 봉투를 삭제하시겠습니까?`}async function A(e){if(d!==`admin`&&d!==`office`){alert(`봉투 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let{linkedRecipes:t,linkedProducts:n,logDocs:i}=await O(e),a=[...t.map(e=>e.displayName||e.name||e.id),...n.map(e=>e.name||e.id)];if(a.length>0){alert(`${a.join(`, `)}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);return}let s=i.length;if(!await f({title:`봉투 삭제`,message:k(e,s),confirmText:`삭제`,danger:!0}))return;let c=o(u);c.delete(r(u,`bagTypes`,e.id)),i.forEach(e=>c.delete(r(u,`bagLogs`,e.id))),await c.commit(),await m({action:`bag`,subAction:`delete`,date:p(),staff:B(),message:`봉투 삭제 — ${e.name}`,details:{bagTypeId:e.id,bagName:e.name,bagType:e.category===`freezeDry`?`dried`:`raw`,currentQty:Number(e.currentQty||0),logCount:s}}),b=null,_=await y(),x(),alert(`봉투가 삭제되었습니다.`)}catch(e){console.error(`[bag] delete failed:`,e),alert(`봉투 삭제 중 오류가 발생했습니다.`)}}function j(){M(null)}function M(e){let t=!e;z(`
    <h3 class="modal-title">${t?`봉투 추가`:`봉투 수정`}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${e?.name||``}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${t?``:`disabled`}>
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
      <button class="btn-primary" id="btnSaveBag">${t?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnSaveBag`).addEventListener(`click`,async()=>{if(d!==`admin`&&d!==`office`){alert(`봉투 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let a=document.getElementById(`m_bagName`).value.trim(),o=document.getElementById(`m_bagCategory`).value,c=parseInt(document.getElementById(`m_piecesPerBox`).value)||0,l=parseInt(document.getElementById(`m_minBox`).value)||0;if(!a||!o){alert(`봉투명과 종류는 필수입니다.`);return}let f={name:a,category:o,piecesPerBox:c,minimumBoxQty:l,minimumQty:l*c,sortOrder:t?_.length:e.sortOrder,active:t?!0:e.active!==!1,updatedAt:new Date};t?(f.currentQty=0,f.createdAt=new Date,await s(i(u,`bagTypes`),f)):await n(r(u,`bagTypes`,e.id),f),_=await y(),closeModal(),x(),alert(t?`봉투 추가 완료!`:`수정 완료!`)})}function N(e){M(e)}function P(e){z(`
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
        ${R([`lead`])}
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
  `),document.getElementById(`m_qty`).addEventListener(`input`,t=>{let n=parseInt(t.target.value)||0;document.getElementById(`m_boxCalc`).textContent=`${Math.floor(n/e.piecesPerBox)}박스`}),document.getElementById(`btnSaveBagIncoming`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_qty`).value),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,c=document.getElementById(`m_note`).value;if(!t||!a){alert(`수량과 날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await h(a))return;let l=e.currentQty||0,d=l+t;await n(r(u,`bagTypes`,e.id),{currentQty:d,updatedAt:new Date}),await s(i(u,`bagLogs`),{date:a,timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`incoming`,qty:t,before:l,after:d,staffName:o,note:c}),await m({action:`bag`,subAction:`incoming`,date:a,staff:o,message:`봉투 입고 — ${e.name} +${t}장 / 담당: ${o}`,details:{bagTypeId:e.id,bagName:e.name,qty:t,before:l,after:d,note:c||null}}),_=await y(),closeModal(),D(_.find(t=>t.id===e.id)),S(),document.getElementById(`bagList`).innerHTML=S(),E(),alert(`입고 등록 완료!`)})}function F(e){z(`
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
        ${R([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_adjustType`).value,a=parseInt(document.getElementById(`m_qty`).value),o=document.getElementById(`m_reason`).value.trim(),c=document.getElementById(`m_staff`).value;if(!a||!o||!c){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let l=p();if(await h(l))return;let d=t===`plus`?a:-a,f=e.currentQty||0,g=f+d;if(g<0){alert(`조정 후 잔량이 ${g}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${f}장에서 최대 ${f}장까지만 감소 가능합니다.`);return}await n(r(u,`bagTypes`,e.id),{currentQty:g,updatedAt:new Date}),await s(i(u,`bagLogs`),{date:p(),timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`adjust`,qty:d,before:f,after:g,staffName:c,reason:o});let v=d>=0?`+`:``;await m({action:`bag`,subAction:`adjust`,date:l,staff:c,message:`봉투 수동조정 — ${e.name} ${v}${d}장 / 사유: ${o} / 담당: ${c}`,details:{bagTypeId:e.id,bagName:e.name,delta:d,before:f,after:g,reason:o}}),_=await y(),closeModal(),D(_.find(t=>t.id===e.id)),document.getElementById(`bagList`).innerHTML=S(),E(),alert(`조정 완료!`)})}var I={};async function L(){Object.keys(I).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await a(r(u,`staffGroups`,e));t.exists()&&(I[e]=t.data().members||[])}))}function R(e){let t=``;for(let n of e)(I[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}function B(){return d===`admin`?`대표`:d===`office`?`사무실`:d===`production`?`생산실`:`시스템`}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};export{v as renderBag};