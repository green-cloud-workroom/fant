import{_ as e,b as t,c as n,d as r,g as i,s as a,u as o,y as s}from"./index.esm-CWp5uCwe.js";import{n as c}from"./firebase-Bm8Fqw4J.js";import{r as l}from"./pageLifecycle-_b6L3DA3.js";import{n as u}from"./modalManager-D53QKIlh.js";import{n as d}from"./modal-IG9zwovL.js";import{G as f,L as p,W as m,f as h}from"./index-WVQYLYD7.js";import{n as g}from"./activityLogs-CardV55_.js";import{o as _}from"./manualMovementLogic-B9kgw8lO.js";import{i as v,n as y,r as b,t as x}from"./movementForm-Hd8q4b7f.js";import{t as S}from"./statsAutomationRuntime-CzcmBCkg.js";import{t as C}from"./closingGuard-BT4nsCZO.js";import{t as w}from"./sortable-D_RYdYSn.js";import{t as T}from"./readCommand-N-uwOIPL.js";import{t as ee}from"./pageRefresh-Cp-wQ0-e.js";var E=h(`bag`);async function D(e,t=[`admin`,`office`]){let n=l();try{return await T(E,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[봉투 저장]`,e),alert(e.message)}}async function O(e,t,n,r,i,a){return D(async t=>await C(i,t)?!1:(await v({db:c,command:t,name:`bagLogs`,stockId:e.id,log:n,selection:a,expectedBefore:Number(e.currentQty||0),uid:m?.uid||null}),!0),[`admin`,`office`,`production`])}var k=[];async function A({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>봉투 재고 로딩 중...</p></div>`;let n=await E.load(e=>$(e),{force:e,onChange:ee(E,A)});!n||!t.isConnected||(k=n.bags,Y=n.staff,N())}async function j(e={getDocs:a}){return(await e.getDocs(r(s(c,`bagTypes`),o(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}var M=null;function N(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <!-- 왼쪽: 봉투 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">봉투 목록</span>
          ${f===`admin`||f===`office`?`<button class="btn-primary" id="btnNewBag">+ 추가</button>`:``}
        </div>
        <div class="recipe-list" id="bagList">
          ${P()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="bagDetail">
        <div class="detail-empty">봉투를 선택해주세요</div>
      </div>
    </div>
  `,I(),te(),document.getElementById(`btnNewBag`)?.addEventListener(`click`,W)}function P(){if(k.length===0)return`<div class="list-empty">등록된 봉투 없음</div>`;let e=k.filter(e=>e.active!==!1),t=k.filter(e=>e.active===!1),n=e.filter(e=>e.category===`raw`),r=e.filter(e=>e.category===`freezeDry`),i=``;return n.length>0&&(i+=`<div class="list-group-label">생식</div>`,i+=`<div class="sortable-master-list" id="bagListRaw" data-category="raw">${n.map(e=>F(e)).join(``)}</div>`),r.length>0&&(i+=`<div class="list-group-label">동결건조</div>`,i+=`<div class="sortable-master-list" id="bagListFreezeDry" data-category="freezeDry">${r.map(e=>F(e)).join(``)}</div>`),t.length>0&&(i+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,i+=`<div class="master-inactive-list">${t.map(e=>F(e)).join(``)}</div>`),i}function F(e){let t=e.currentQty<(e.minimumQty||0),n=e.active===!1,r=f===`admin`||f===`office`;return`
    <div class="recipe-list-item ${M===e.id?`active`:``} ${n?`inactive-master`:``}" data-id="${e.id}">
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
  `}function te(){f!==`admin`&&f!==`office`||[[`bagListRaw`,`raw`],[`bagListFreezeDry`,`freezeDry`]].forEach(([e,t])=>{let n=document.getElementById(e);n&&w.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await ne(t)}})})}async function ne(e){return D(t=>re(e,t))}async function re(n,r){let i=document.getElementById(n===`raw`?`bagListRaw`:`bagListFreezeDry`);if(!i)return;let a=Array.from(i.querySelectorAll(`.recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),o=k.filter(e=>e.category===`raw`).length,s=n===`freezeDry`?o:0,l=new Date,u=e(c);a.forEach((e,n)=>{u.update(t(c,`bagTypes`,e),{sortOrder:s+n,updatedAt:l})});try{if(await r.commit(u,{targets:a.map(e=>t(c,`bagTypes`,e))}),!r.isCurrent())return;let e=new Map(a.map((e,t)=>[e,s+t]));k=k.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:l}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)),await A({force:!0})}catch(e){console.error(`[bag] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e));let t=await j();if(!r.isCurrent())return;if(k=t,N(),M){let e=k.find(e=>e.id===M);e&&await z(e)}}}function I(){document.querySelectorAll(`.recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(M=e.dataset.id,z(k.find(e=>e.id===M)),document.querySelectorAll(`.recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`))})}),document.querySelectorAll(`.bag-active-toggle`).forEach(n=>{n.addEventListener(`click`,e=>e.stopPropagation()),n.addEventListener(`change`,async n=>{if(f!==`admin`&&f!==`office`){alert(`봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.`),n.target.checked=!n.target.checked;return}let r=n.target.dataset.id,i=n.target.checked,a=k.find(e=>e.id===r),o=a?.active!==!1;try{await T(E,async n=>{let s=l(),u=e(c);if(u.update(t(c,`bagTypes`,r),{active:i,updatedAt:new Date}),o!==i&&await g({action:`bag`,subAction:`activeToggle`,date:p(),staff:Q(),message:`봉투 종류 ${i?`활성`:`비활성`} — ${a?.name||r}`,details:{bagTypeId:r,bagName:a?.name||null,active:i}},{batch:u}),await n.commit(u,{targets:[t(c,`bagTypes`,r)]}),a&&(a.active=i),!(s&&!s.isCurrent())&&(await A({force:!0}),M)){let e=k.find(e=>e.id===M);e&&await z(e)}})}catch(e){console.error(`[bag] active save failed:`,e),alert(e.message||`활성 상태 저장 중 오류가 발생했습니다.`),n.target.checked=!i}})})}var L=!0;async function R(e,t=a){let l;if(L)try{l=await t(r(s(c,`bagLogs`),i(`bagTypeId`,`==`,e),o(`timestamp`,`desc`),n(30)))}catch(e){if(e.code!==`failed-precondition`)throw e;L=!1}l||=await t(r(s(c,`bagLogs`),i(`bagTypeId`,`==`,e)));let u=e=>e?.toMillis?.()??(e?.seconds?e.seconds*1e3:new Date(e).getTime()||0);return l.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.timestamp!==void 0).sort((e,t)=>u(t.timestamp)-u(e.timestamp)||t.id.localeCompare(e.id)).slice(0,30)}async function z(e){let t=document.getElementById(`bagDetail`),n=f===`admin`||f===`office`,r=await R(e.id);!t.isConnected||M!==e.id||(t.innerHTML=`
    <div class="detail-header">
      <span class="detail-title">${e.name}</span>
      <div class="detail-actions">
        ${n?`<button class="btn-secondary" id="btnEditBag">수정</button>`:``}
        ${n?`<button class="btn-danger" id="btnDeleteBag">삭제</button>`:``}
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
              ${r.length===0?`<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:r.map(e=>`
                  <tr>
                    <td>${e.date||`-`}</td>
                    <td>
                      <span class="tag ${e.type===`incoming`?`tag-raw`:e.type===`autoDeduct`?``:`tag-cat`}"
                            style="${e.type===`autoDeduct`?`background:#f0f0f0;color:#666`:``}">
                        ${_(e,e.type===`incoming`?`입고`:e.type===`autoDeduct`?`자동차감`:`수동조정`)}
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
  `,document.getElementById(`btnAddBagIncoming`).addEventListener(`click`,()=>q(e)),document.getElementById(`btnAdjustBag`).addEventListener(`click`,()=>J(e)),document.getElementById(`btnEditBag`)?.addEventListener(`click`,()=>K(e)),document.getElementById(`btnDeleteBag`)?.addEventListener(`click`,()=>H(e)))}async function B(e,t={getDocs:a}){let{getDocs:n}=t,[o,l,u]=await Promise.all([n(r(s(c,`recipes`),i(`bagTypeId`,`==`,e.id))),n(r(s(c,`frozenProducts`),i(`bagTypeId`,`==`,e.id))),n(r(s(c,`bagLogs`),i(`bagTypeId`,`==`,e.id)))]);return{linkedRecipes:o.docs.map(e=>({id:e.id,...e.data()})),linkedProducts:l.docs.map(e=>({id:e.id,...e.data()})),logDocs:u.docs}}function V(e,t){let n=Number(e.currentQty||0);return n>0?`${e.name} 재고 ${n}장이 남아있습니다.\n봉투 재고 및 이력 ${t}건이 모두 삭제됩니다.\n진행하시겠습니까?`:t>0?`입고/조정 이력 ${t}건이 함께 삭제됩니다.\n진행하시겠습니까?`:`${e.name} 봉투를 삭제하시겠습니까?`}async function H(e){return D(t=>U(e,t))}async function U(n,r){if(f!==`admin`&&f!==`office`){alert(`봉투 삭제는 대표/사무실 계정만 가능합니다.`);return}try{let{linkedRecipes:i,linkedProducts:a,logDocs:o}=await B(n,r),s=[...i.map(e=>e.displayName||e.name||e.id),...a.map(e=>e.name||e.id)];if(s.length>0){alert(`${s.join(`, `)}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);return}let l=o.length;if(!await d({title:`봉투 삭제`,message:V(n,l),confirmText:`삭제`,danger:!0}))return;if(o.length>498)throw Error(`삭제할 이력이 너무 많습니다. 관리자에게 문의해주세요.`);let u=e(c);if(u.delete(t(c,`bagTypes`,n.id)),o.forEach(e=>u.delete(t(c,`bagLogs`,e.id))),await g({action:`bag`,subAction:`delete`,date:p(),staff:Q(),message:`봉투 삭제 — ${n.name}`,details:{bagTypeId:n.id,bagName:n.name,bagType:n.category===`freezeDry`?`dried`:`raw`,currentQty:Number(n.currentQty||0),logCount:l}},{batch:u}),await r.commit(u,{targets:[t(c,`bagTypes`,n.id)]}),!r.isCurrent())return;M=null,await A({force:!0}),alert(`봉투가 삭제되었습니다.`)}catch(e){console.error(`[bag] delete failed:`,e),alert(e.message||`봉투 삭제 중 오류가 발생했습니다.`)}}function W(){G(null)}function G(n){let r=!n;Z(`
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
  `),document.getElementById(`btnSaveBag`).addEventListener(`click`,()=>D(async i=>{let a=e(c);if(f!==`admin`&&f!==`office`){alert(`봉투 등록/수정은 대표/사무실 계정만 가능합니다.`);return}let o=document.getElementById(`m_bagName`).value.trim(),s=document.getElementById(`m_bagCategory`).value,l=parseInt(document.getElementById(`m_piecesPerBox`).value)||0,u=parseInt(document.getElementById(`m_minBox`).value)||0;if(!o||!s){alert(`봉투명과 종류는 필수입니다.`);return}let d={name:o,category:s,piecesPerBox:l,minimumBoxQty:u,minimumQty:u*l,sortOrder:r?k.length:n.sortOrder,active:r?!0:n.active!==!1,updatedAt:new Date};r?(d.currentQty=0,d.createdAt=new Date,a.set(target,d)):a.update(t(c,`bagTypes`,n.id),d),await i.commit(a,{targets:[target]}),i.isCurrent()&&(closeModal(),await A({force:!0}),alert(r?`봉투 추가 완료!`:`수정 완료!`))}))}function K(e){G(e)}function q(e){Z(`
    <h3 class="modal-title">봉투 입고 등록 — ${e.name}</h3>
    ${y({incoming:!0})}
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
        ${X([`lead`])}
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
  `),document.getElementById(`m_qty`).addEventListener(`input`,t=>{let n=parseInt(t.target.value)||0;document.getElementById(`m_boxCalc`).textContent=`${Math.floor(n/e.piecesPerBox)}박스`});let t=x({db:c,name:`bagLogs`,filter:{bagTypeId:e.id},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveBagIncoming`).addEventListener(`click`,async()=>{let n=l(),r=b(t);if(!r)return;let i=parseInt(document.getElementById(`m_qty`).value),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!i||!a){alert(`수량과 날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await C(a)||n&&!n.isCurrent())return;let c=e.currentQty||0,u=r.kind===`test`?{approved:!0}:await S({itemId:`bagLogs:`+e.id,name:e.name,date:a,qty:i,unit:`장`,stage:`봉투`},()=>!n||n.isCurrent());if(!u.approved||n&&!n.isCurrent())return;let d=c+i;if(!await O(e,{currentQty:d,updatedAt:new Date},{date:a,timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`incoming`,...u.review?{statsQuantityReview:u.review}:{},qty:i,before:c,after:d,staffName:o,note:s},{action:`bag`,subAction:`incoming`,date:a,staff:o,message:`봉투 입고 — ${e.name} +${i}장 / 담당: ${o}`,details:{bagTypeId:e.id,bagName:e.name,qty:i,before:c,after:d,note:s||null}},a,r)||n&&!n.isCurrent())return;closeModal(),await A({force:!0});let f=k.find(t=>t.id===e.id);f&&await z(f),alert(`입고 등록 완료!`)})}function J(e){Z(`
    <h3 class="modal-title">수동 재고 조정 — ${e.name}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${e.currentQty||0}장</p>
    ${y({incoming:!1,reasonField:!1})}
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
        ${X([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);let t=x({db:c,name:`bagLogs`,filter:{bagTypeId:e.id},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=l(),r=b(t);if(!r)return;let i=document.getElementById(`m_adjustType`).value,a=parseInt(document.getElementById(`m_qty`).value),o=r.reason,s=document.getElementById(`m_staff`).value;if(!a||!s){alert(`조정량과 담당자는 필수입니다.`);return}let c=p();if(await C(c))return;let u=i===`plus`?a:-a,d=e.currentQty||0,f=d+u;if(f<0&&r.kind!==`test`){alert(`조정 후 잔량이 ${f}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${d}장에서 최대 ${d}장까지만 감소 가능합니다.`);return}let m={currentQty:f,updatedAt:new Date},h={date:p(),timestamp:new Date,bagTypeId:e.id,bagNameSnapshot:e.name,type:`adjust`,qty:u,before:d,after:f,staffName:s,reason:o},g=u>=0?`+`:``;if(!await O(e,m,h,{action:`bag`,subAction:`adjust`,date:c,staff:s,message:`봉투 수동조정 — ${e.name} ${g}${u}장 / 사유: ${o} / 담당: ${s}`,details:{bagTypeId:e.id,bagName:e.name,delta:u,before:d,after:f,reason:o}},c,r)||n&&!n.isCurrent())return;closeModal(),await A({force:!0});let _=k.find(t=>t.id===e.id);_&&await z(_),alert(`조정 완료!`)})}var Y={};function X(e){let t=``;for(let n of e)(Y[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}function Q(){return f===`admin`?`대표`:f===`office`?`사무실`:f===`production`?`생산실`:`시스템`}u(`bag`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function $(e){let n=[`senior`,`lead`,`office`],[r,...i]=await Promise.all([j(e),...n.map(n=>e.getDoc(t(c,`staffGroups`,n)))]);return{bags:r,staff:Object.fromEntries(n.map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function ie({cacheOnly:e=!0}={}){return E.prepare?.(`default`,$,{cacheOnly:e})}export{ie as preparePage,A as renderBag};