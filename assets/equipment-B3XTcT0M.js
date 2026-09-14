import{a as e,c as t,f as n,g as r,h as i,i as a,m as o,n as s,p as c}from"./index.esm-Cf9DaHbi.js";import{n as l}from"./firebase-BQPCO7kq.js";import{a as u,c as d,f,i as p,j as m,l as h,m as g,o as _,p as v,r as ee,s as te,u as ne,w as y}from"./index-CMgkQ4he.js";import{n as b}from"./activityLogs-Mn_dgBRB.js";import{t as re}from"./sortable.esm-D0d_dJ5t.js";var x=`__all__`,S=[],C=[],w=x,T=null,E=!1,D=!1,O=[];async function ie(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>설비 부품 로딩 중...</p></div>`,await k(),document.getElementById(`mainContent`)===e&&M()}async function k(){[S,C]=await Promise.all([ne(),h(),ve()])}function A(){return m===`admin`||m===`office`}function j(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function M(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">기계 목록</span>
          <div style="display:flex;gap:6px;">
            ${A()?`<button class="btn-secondary" id="btnCategoryManage" title="종류 이름 변경">⚙</button>`:``}
            ${A()?`<button class="btn-primary" id="btnNewEquipment">+ 기계</button>`:``}
          </div>
        </div>
        <div class="recipe-list" id="equipmentList">${I()}</div>
      </div>
      <div class="recipe-detail-panel" id="equipmentDetail"></div>
    </div>
  `,R(),z(),document.getElementById(`btnNewEquipment`)?.addEventListener(`click`,()=>G(null)),document.getElementById(`btnCategoryManage`)?.addEventListener(`click`,pe),B()}function N(){let e=document.getElementById(`equipmentList`);e&&(e.innerHTML=I(),R(),z())}function P(e){let t=[];return e.forEach(e=>{t.includes(e.category)||t.push(e.category)}),t}function ae(e){let t=y(),n=null,r=0;return C.filter(t=>t.equipmentId===e&&t.active!==!1).forEach(e=>{let i=d(e,t);i.dday!==null&&(n===null||i.dday<n)&&(n=i.dday),i.low&&(r+=1)}),{worst:n,lowCount:r}}function F(e){return e==null?`<span class="eq-pill eq-pill-gray">-</span>`:`<span class="eq-pill ${e<0?`eq-pill-red`:e<=7?`eq-pill-amber`:`eq-pill-gray`}">${te(e)}</span>`}function I(){let e=u(C),t=`
    <div class="recipe-list-item eq-all-item ${w===x?`active`:``}" data-id="${x}">
      <div class="recipe-list-info" style="padding-left:8px;">
        <span class="recipe-name" style="color:${e.length?`#b91c1c`:`#555`}">⚠ 전체 임박·부족</span>
      </div>
      <span class="eq-pill ${e.length?`eq-pill-red`:`eq-pill-gray`}">${e.length}</span>
    </div>
  `;if(S.length===0)return t+=`<div class="list-empty">등록된 기계 없음</div>`,t;let n=S.filter(e=>e.active!==!1),r=S.filter(e=>e.active===!1);return P(n).forEach(e=>{let r=n.filter(t=>t.category===e);t+=`<div class="list-group-label">${j(e)}</div>`,t+=`<div class="sortable-master-list eq-sortable" data-category="${j(e)}">${r.map(L).join(``)}</div>`}),r.length>0&&(t+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,t+=`<div class="master-inactive-list">${r.map(L).join(``)}</div>`),t}function L(e){let t=e.active===!1,{worst:n,lowCount:r}=ae(e.id);return`
    <div class="recipe-list-item ${w===e.id?`active`:``} ${t?`inactive-master`:``}" data-id="${e.id}">
      ${A()&&!t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:`<span style="width:8px;display:inline-block;"></span>`}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${t?`#999`:`#1a1a1a`}">${j(e.alias)}</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-right:6px;">
        ${t?``:F(n)}
        ${r>0&&!t?`<span class="eq-pill eq-pill-amber">부족 ${r}</span>`:``}
      </div>
    </div>
  `}function R(){document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(w=e.dataset.id,T=null,document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),B())})})}function z(){O.forEach(e=>e.destroy()),O=[],A()&&document.querySelectorAll(`#equipmentList .eq-sortable`).forEach(e=>{O.push(re.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await oe()}}))})}async function oe(){let e=Array.from(document.querySelectorAll(`#equipmentList .eq-sortable .recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),t=new Date,n=o(l);e.forEach((e,i)=>n.update(r(l,`equipments`,e),{sortOrder:i,updatedAt:t}));try{await n.commit();let t=new Map(e.map((e,t)=>[e,t]));S=S.map(e=>t.has(e.id)?{...e,sortOrder:t.get(e.id)}:e).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){console.error(`[equipment] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),S=await ne(),N()}}function B(){let e=document.getElementById(`equipmentDetail`);if(!e)return;if(w===x){le(e);return}let t=S.find(e=>e.id===w);if(!t){e.innerHTML=`<div class="detail-empty">기계를 선택해주세요</div>`;return}ce(e,t)}function se(e){let t=y();return[...e].sort((e,n)=>{let r=d(e,t).dday??99999,i=d(n,t).dday??99999;return r===i?(e.sortOrder??0)-(n.sortOrder??0):r-i})}function V(e,{showMachine:t=!1}={}){let n=d(e),r=e.active===!1,i=n.overdue?`background:#fef2f2;`:n.dueSoon?`background:#fffbeb;`:``,a=n.low?`#e53e3e`:`#1a1a1a`,o=!r;return`
    <tr class="eq-part-row ${T===e.id?`eq-part-row-selected`:``} ${r?`inactive-master`:``}" data-part-id="${e.id}" style="${i}cursor:pointer;">
      ${t?`<td>${j(f(e.equipmentCategory,e.equipmentAlias))}</td>`:``}
      <td style="font-weight:500;">${j(e.name)}${r?` <span class="tag tag-inactive">비활성</span>`:``}</td>
      <td style="color:#666;">${j(e.spec||`-`)}</td>
      <td>${_(e)}</td>
      <td>${e.lastReplacedAt||`-`}</td>
      <td>${e.nextDueAt||`-`}</td>
      <td>${F(n.dday)}</td>
      <td style="color:${a};${n.low?`font-weight:600;`:``}">${Number(e.currentQty||0)} / ${Number(e.minimumQty||0)}</td>
      <td style="white-space:nowrap;">
        ${o?`
          <button class="eq-act" data-act="replace" data-part-id="${e.id}">교체</button>
          <button class="eq-act" data-act="in" data-part-id="${e.id}">입고</button>
          <button class="eq-act" data-act="adjust" data-part-id="${e.id}">조정</button>
        `:``}
        ${A()?`<button class="eq-act" data-act="edit" data-part-id="${e.id}" title="부품 수정">✎</button>`:``}
      </td>
    </tr>
  `}function H(e){return`
    <thead>
      <tr>
        ${e?`<th>기계</th>`:``}
        <th>부품</th><th>규격</th><th>주기</th><th>마지막 교체</th><th>다음 예정</th><th>D-day</th><th>재고 / 최소</th><th></th>
      </tr>
    </thead>
  `}function ce(e,t){let n=y(),r=C.filter(e=>e.equipmentId===t.id),i=r.length;E&&(r=r.filter(e=>{let t=d(e,n);return t.overdue||t.dueSoon})),D&&(r=r.filter(e=>d(e,n).low)),r=se(r);let a=t.active===!1;e.innerHTML=`
    <div class="detail-header">
      <div>
        <span class="detail-title">${j(t.alias)}</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">${j(t.category)} · 부품 ${i}개${a?` · 비활성`:``}</span>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary eq-filter ${E?`eq-filter-on`:``}" id="btnFilterDue">임박만</button>
        <button class="btn-secondary eq-filter ${D?`eq-filter-on`:``}" id="btnFilterLow">부족만</button>
        ${A()?`<button class="btn-secondary" id="btnEditEquipment">기계 수정</button>`:``}
        ${A()&&!a?`<button class="btn-primary" id="btnNewPart">+ 부품 추가</button>`:``}
      </div>
    </div>
    <div class="detail-body">
      ${t.memo?`<p style="font-size:12px;color:#666;margin:0 0 12px;">${j(t.memo)}</p>`:``}
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${H(!1)}
            <tbody>
              ${r.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">${i===0?`등록된 부품 없음`:`조건에 맞는 부품 없음`}</td></tr>`:r.map(e=>V(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,document.getElementById(`btnFilterDue`).addEventListener(`click`,()=>{E=!E,B()}),document.getElementById(`btnFilterLow`).addEventListener(`click`,()=>{D=!D,B()}),document.getElementById(`btnEditEquipment`)?.addEventListener(`click`,()=>G(t)),document.getElementById(`btnNewPart`)?.addEventListener(`click`,()=>K(null,t)),U(),T&&W()}function le(e){let t=u(C),n=new Set,r=[];t.forEach(e=>{n.has(e.part.id)||(n.add(e.part.id),r.push(e.part))}),e.innerHTML=`
    <div class="detail-header">
      <div>
        <span class="detail-title">전체 임박·부족</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">교체 D-7 이내·지남 또는 재고 부족 부품 ${r.length}개</span>
      </div>
    </div>
    <div class="detail-body">
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${H(!0)}
            <tbody>
              ${r.length===0?`<tr><td colspan="9" style="text-align:center;color:#aaa;padding:20px;">확인할 부품 없음</td></tr>`:r.map(e=>V(e,{showMachine:!0})).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,U(),T&&W()}function U(){document.querySelectorAll(`.eq-part-row`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.eq-act`)||(T=T===e.dataset.partId?null:e.dataset.partId,document.querySelectorAll(`.eq-part-row`).forEach(e=>e.classList.toggle(`eq-part-row-selected`,e.dataset.partId===T)),W())})}),document.querySelectorAll(`.eq-act`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=C.find(t=>t.id===e.dataset.partId);if(!n)return;let r=e.dataset.act;r===`replace`?he(n):r===`in`?ge(n):r===`adjust`?_e(n):r===`edit`&&K(n,S.find(e=>e.id===n.equipmentId))})})}var ue={replace:`교체`,in:`입고`,adjust:`조정`};async function W(){let n=document.getElementById(`partHistory`);if(!n)return;let r=C.find(e=>e.id===T);if(!r){n.innerHTML=``;return}n.innerHTML=`<p style="font-size:12px;color:#888;padding:8px 0;">이력 로딩 중...</p>`;let a=[];try{a=(await e(t(i(l,`equipmentPartLogs`),c(`partId`,`==`,r.id)))).docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0)).slice(0,50)}catch(e){console.error(`[equipment] history load failed:`,e)}document.getElementById(`partHistory`)!==n||T!==r.id||(n.innerHTML=`
    <div class="form-section">
      <div class="section-header">
        <span class="section-title">${j(v(r))} · 이력</span>
        ${r.memo?`<span style="font-size:12px;color:#888;">${j(r.memo)}</span>`:``}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>날짜</th><th>구분</th><th>수량</th><th>전→후</th><th>담당자</th><th>비고</th></tr></thead>
          <tbody>
            ${a.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:a.map(e=>`
                <tr>
                  <td>${e.date||`-`}</td>
                  <td><span class="tag ${e.type===`in`?`tag-raw`:e.type===`replace`?`tag-freezeDry`:`tag-cat`}">${ue[e.type]||e.type}</span></td>
                  <td style="color:${e.qty>0?`#2d7a3a`:e.qty<0?`#e53e3e`:`#666`}">${e.qty>0?`+`:``}${e.qty??0}</td>
                  <td style="color:#888;">${e.before??`-`} → ${e.after??`-`}</td>
                  <td>${j(e.staffName||`-`)}</td>
                  <td>${j(e.note||`-`)}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `)}function G(e){if(!A())return;let t=!e,a=P(S),c=S.filter(e=>e.active!==!1);Q(`
    <h3 class="modal-title">${t?`기계 추가`:`기계 수정`}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_category">
          ${a.map(t=>`<option value="${j(t)}" ${e?.category===t?`selected`:``}>${j(t)}</option>`).join(``)}
          <option value="__new__">+ 새 종류</option>
        </select>
      </div>
      <div class="form-group" id="m_newCategoryWrap" style="display:${a.length===0?`block`:`none`};">
        <label>새 종류 이름</label>
        <input type="text" id="m_newCategory" placeholder="예: 민서기" />
      </div>
    </div>
    <div class="form-group">
      <label>별칭 *</label>
      <input type="text" id="m_alias" value="${j(e?.alias||``)}" placeholder="예: 민서기 1호" />
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_memo" value="${j(e?.memo||``)}" placeholder="위치, 모델명 등" />
    </div>
    ${t&&c.length>0?`
      <div class="form-group">
        <label>다른 기계 부품 구성 복사</label>
        <select id="m_copyFrom">
          <option value="">복사 안 함</option>
          ${c.map(e=>`<option value="${e.id}">${j(f(e.category,e.alias))}</option>`).join(``)}
        </select>
        <p style="font-size:11px;color:#888;margin:4px 0 0;">부품명·규격·주기·최소재고만 복사. 재고 0, 교체일 없음으로 생성.</p>
      </div>
    `:``}
    ${t?``:`
      <div class="form-group">
        <label><input type="checkbox" id="m_active" ${e.active===!1?``:`checked`} /> 활성</label>
      </div>
    `}
    <div class="modal-actions">
      ${t?``:`<button class="btn-danger" id="btnDeleteEquipment" style="margin-right:auto;">삭제</button>`}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveEquipment">${t?`추가`:`저장`}</button>
    </div>
  `);let u=document.getElementById(`m_category`),d=document.getElementById(`m_newCategoryWrap`);a.length===0&&(u.value=`__new__`),u.addEventListener(`change`,()=>{d.style.display=u.value===`__new__`?`block`:`none`}),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeleteEquipment`)?.addEventListener(`click`,()=>fe(e)),document.getElementById(`btnSaveEquipment`).addEventListener(`click`,async()=>{let a=u.value;a===`__new__`&&(a=document.getElementById(`m_newCategory`).value.trim());let c=document.getElementById(`m_alias`).value.trim(),d=document.getElementById(`m_memo`).value.trim();if(!a||!c){alert(`종류와 별칭은 필수입니다.`);return}if(S.find(t=>t.id!==e?.id&&t.category===a&&t.alias===c)){alert(`같은 종류에 같은 별칭의 기계가 이미 있습니다.`);return}let p=new Date;try{if(t){let e=await s(i(l,`equipments`),{category:a,alias:c,memo:d,active:!0,sortOrder:S.length,createdAt:p,updatedAt:p}),t=document.getElementById(`m_copyFrom`)?.value||``;t&&await de(t,{id:e.id,category:a,alias:c}),await b({action:`equipment`,subAction:`create`,date:y(),staff:X(),message:`기계 추가 — ${f(a,c)}`,details:{equipmentId:e.id,category:a,alias:c,copiedFrom:t||null}}),w=e.id}else{let t=document.getElementById(`m_active`).checked;if(await n(r(l,`equipments`,e.id),{category:a,alias:c,memo:d,active:t,updatedAt:p}),a!==e.category||c!==e.alias){let t=o(l);C.filter(t=>t.equipmentId===e.id).forEach(e=>{t.update(r(l,`equipmentParts`,e.id),{equipmentCategory:a,equipmentAlias:c,updatedAt:p})}),await t.commit()}await b({action:`equipment`,subAction:`update`,date:y(),staff:X(),message:`기계 수정 — ${f(a,c)}${t?``:` (비활성)`}`,details:{equipmentId:e.id,category:a,alias:c,active:t}})}$(),await k(),M()}catch(e){console.error(`[equipment] save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}})}async function de(e,t){let n=C.filter(t=>t.equipmentId===e&&t.active!==!1);if(n.length===0)return;let a=new Date,s=o(l);n.forEach((e,n)=>{let o=r(i(l,`equipmentParts`));s.set(o,{equipmentId:t.id,equipmentCategory:t.category,equipmentAlias:t.alias,name:e.name,spec:e.spec||``,cycleValue:e.cycleValue||0,cycleUnit:e.cycleUnit||`day`,lastReplacedAt:null,nextDueAt:null,currentQty:0,minimumQty:e.minimumQty||0,memo:``,active:!0,sortOrder:n,createdAt:a,updatedAt:a})}),await s.commit()}async function fe(e){if(!A())return;let t=C.filter(t=>t.equipmentId===e.id);if(t.length>0){alert(`부품 ${t.length}개가 등록되어 있어 삭제할 수 없습니다.\n부품을 먼저 삭제하거나 기계를 비활성으로 바꿔주세요.`);return}if(await g({title:`기계 삭제`,message:`${f(e.category,e.alias)}을(를) 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))try{let t=o(l);t.delete(r(l,`equipments`,e.id)),await t.commit(),await b({action:`equipment`,subAction:`delete`,date:y(),staff:X(),message:`기계 삭제 — ${f(e.category,e.alias)}`,details:{equipmentId:e.id,category:e.category,alias:e.alias}}),$(),w=x,await k(),M()}catch(e){console.error(`[equipment] delete failed:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}function pe(){if(!A())return;let e=P(S);Q(`
    <h3 class="modal-title">기계 종류 이름 변경</h3>
    ${e.length===0?`<p style="font-size:13px;color:#888;">등록된 종류가 없습니다.</p>`:e.map((e,t)=>`
      <div class="form-group">
        <label>${j(e)} <span style="color:#aaa;font-weight:400;">(기계 ${S.filter(t=>t.category===e).length}대)</span></label>
        <input type="text" class="m_catRename" data-index="${t}" data-original="${j(e)}" value="${j(e)}" />
      </div>
    `).join(``)}
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveCategories">저장</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveCategories`).addEventListener(`click`,async()=>{let e=[];if(document.querySelectorAll(`.m_catRename`).forEach(t=>{let n=t.dataset.original,r=t.value.trim();r&&r!==n&&e.push({from:n,to:r})}),e.length===0){$();return}let t=new Date;try{let n=o(l);e.forEach(({from:e,to:i})=>{S.filter(t=>t.category===e).forEach(e=>n.update(r(l,`equipments`,e.id),{category:i,updatedAt:t})),C.filter(t=>t.equipmentCategory===e).forEach(e=>n.update(r(l,`equipmentParts`,e.id),{equipmentCategory:i,updatedAt:t}))}),await n.commit(),await b({action:`equipment`,subAction:`renameCategory`,date:y(),staff:X(),message:`기계 종류 이름 변경 — ${e.map(e=>`${e.from}→${e.to}`).join(`, `)}`,details:{changes:e}}),$(),await k(),M()}catch(e){console.error(`[equipment] rename category failed:`,e),alert(`저장 중 오류가 발생했습니다.`)}})}function K(e,t){if(!A()||!t)return;let a=!e;Q(`
    <h3 class="modal-title">${a?`부품 추가`:`부품 수정`} — ${j(f(t.category,t.alias))}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>부품명 *</label>
        <input type="text" id="m_name" value="${j(e?.name||``)}" placeholder="예: 날" />
      </div>
      <div class="form-group">
        <label>규격</label>
        <input type="text" id="m_spec" value="${j(e?.spec||``)}" placeholder="예: Ø120" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>교체 주기 *</label>
        <div style="display:flex;gap:6px;">
          <input type="number" id="m_cycleValue" min="1" value="${e?.cycleValue||``}" placeholder="숫자" style="flex:1;" />
          <select id="m_cycleUnit" style="width:90px;">
            ${Object.entries(ee).map(([t,n])=>`<option value="${t}" ${(e?.cycleUnit||`month`)===t?`selected`:``}>${n}</option>`).join(``)}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>마지막 교체일</label>
        <input type="date" id="m_lastReplacedAt" value="${e?.lastReplacedAt||``}" />
      </div>
    </div>
    <div class="form-row">
      ${a?`
        <div class="form-group">
          <label>현재 재고</label>
          <input type="number" id="m_currentQty" min="0" value="0" />
        </div>
      `:``}
      <div class="form-group">
        <label>최소 재고</label>
        <input type="number" id="m_minimumQty" min="0" value="${e?.minimumQty??1}" />
      </div>
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_partMemo" value="${j(e?.memo||``)}" placeholder="구매처, 단가 등" />
    </div>
    ${a?``:`
      <div class="form-group">
        <label><input type="checkbox" id="m_partActive" ${e.active===!1?``:`checked`} /> 활성</label>
      </div>
    `}
    <div class="modal-actions">
      ${a?``:`<button class="btn-danger" id="btnDeletePart" style="margin-right:auto;">삭제</button>`}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSavePart">${a?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeletePart`)?.addEventListener(`click`,()=>me(e)),document.getElementById(`btnSavePart`).addEventListener(`click`,async()=>{let o=document.getElementById(`m_name`).value.trim(),c=document.getElementById(`m_spec`).value.trim(),u=parseInt(document.getElementById(`m_cycleValue`).value)||0,d=document.getElementById(`m_cycleUnit`).value,m=document.getElementById(`m_lastReplacedAt`).value||null,h=Math.max(0,parseInt(document.getElementById(`m_minimumQty`).value)||0),g=document.getElementById(`m_partMemo`).value.trim();if(!o){alert(`부품명은 필수입니다.`);return}if(u<=0){alert(`교체 주기를 입력해주세요.`);return}let _=new Date,v={name:o,spec:c,cycleValue:u,cycleUnit:d,lastReplacedAt:m,minimumQty:h,memo:g,nextDueAt:p(m,u,d),updatedAt:_};try{if(a){let e=Math.max(0,parseInt(document.getElementById(`m_currentQty`).value)||0),n=await s(i(l,`equipmentParts`),{...v,equipmentId:t.id,equipmentCategory:t.category,equipmentAlias:t.alias,currentQty:e,active:!0,sortOrder:C.filter(e=>e.equipmentId===t.id).length,createdAt:_});await b({action:`equipment`,subAction:`partCreate`,date:y(),staff:X(),message:`부품 추가 — ${f(t.category,t.alias)} · ${o} (재고 ${e})`,details:{partId:n.id,equipmentId:t.id,name:o,cycleValue:u,cycleUnit:d,currentQty:e,minimumQty:h}})}else v.active=document.getElementById(`m_partActive`).checked,await n(r(l,`equipmentParts`,e.id),v),await b({action:`equipment`,subAction:`partUpdate`,date:y(),staff:X(),message:`부품 수정 — ${f(t.category,t.alias)} · ${o}${v.active?``:` (비활성)`}`,details:{partId:e.id,equipmentId:t.id,name:o,cycleValue:u,cycleUnit:d,minimumQty:h,active:v.active}});$(),await k(),N(),B()}catch(e){console.error(`[equipment] part save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}})}async function me(n){if(!A())return;let a=[];try{a=(await e(t(i(l,`equipmentPartLogs`),c(`partId`,`==`,n.id)))).docs}catch(e){console.error(`[equipment] log lookup failed:`,e)}if(await g({title:`부품 삭제`,message:`${v(n)}을(를) 삭제하시겠습니까?${a.length?`\n이력 ${a.length}건이 함께 삭제됩니다.`:``}`,confirmText:`삭제`,danger:!0}))try{let e=o(l);e.delete(r(l,`equipmentParts`,n.id)),a.forEach(t=>e.delete(r(l,`equipmentPartLogs`,t.id))),await e.commit(),await b({action:`equipment`,subAction:`partDelete`,date:y(),staff:X(),message:`부품 삭제 — ${v(n)}`,details:{partId:n.id,equipmentId:n.equipmentId,name:n.name,logCount:a.length}}),$(),T===n.id&&(T=null),await k(),N(),B()}catch(e){console.error(`[equipment] part delete failed:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}function q(e){return`
    <select id="${e}">
      <option value="">선택</option>
      ${ye([`senior`,`lead`,`office`])}
    </select>
  `}function he(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">부품 교체 — ${j(v(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">
      현재 재고 ${t}개 · 주기 ${_(e)} · 마지막 교체 ${e.lastReplacedAt||`없음`}
      ${t<=0?`<br><span style="color:#e53e3e;">재고가 0이라 차감 없이 교체만 기록됩니다.</span>`:``}
    </p>
    <div class="form-row">
      <div class="form-group">
        <label>교체일 *</label>
        <input type="date" id="m_date" value="${y()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${q(`m_staff`)}
      </div>
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_note" placeholder="예: 마모 심함" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveReplace">교체 기록</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveReplace`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!n||!r){alert(`교체일과 담당자는 필수입니다.`);return}let a=t,o=a>0?-1:0,s=a+o,c=p(n,e.cycleValue,e.cycleUnit);await J(e,{type:`replace`,qty:o,before:a,after:s,date:n,staff:r,note:i,partPatch:{currentQty:s,lastReplacedAt:n,nextDueAt:c},message:`부품 교체 — ${v(e)} (재고 ${a}→${s}, 다음 ${c||`-`}) / 담당: ${r}`})})}function ge(e){Q(`
    <h3 class="modal-title">부품 입고 — ${j(v(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${Number(e.currentQty||0)}개 · 최소 ${Number(e.minimumQty||0)}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>수량 *</label>
        <input type="number" id="m_qty" min="1" placeholder="개" />
      </div>
      <div class="form-group">
        <label>입고일 *</label>
        <input type="date" id="m_date" value="${y()}" />
      </div>
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      ${q(`m_staff`)}
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="예: 발주분" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveIn">입고</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveIn`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_qty`).value),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!t||t<=0||!n){alert(`수량과 입고일은 필수입니다.`);return}if(!r){alert(`담당자는 필수입니다.`);return}let a=Number(e.currentQty||0),o=a+t;await J(e,{type:`in`,qty:t,before:a,after:o,date:n,staff:r,note:i,partPatch:{currentQty:o},message:`부품 입고 — ${v(e)} +${t} (재고 ${a}→${o}) / 담당: ${r}`})})}function _e(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">재고 조정 — ${j(v(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${t}개. 실사 수량을 입력하면 차이만큼 조정됩니다.</p>
    <div class="form-row">
      <div class="form-group">
        <label>실제 재고 *</label>
        <input type="number" id="m_actual" min="0" value="${t}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${q(`m_staff`)}
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_note" placeholder="예: 실사 차이" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=parseInt(document.getElementById(`m_actual`).value),r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(Number.isNaN(n)||n<0){alert(`실제 재고를 입력해주세요.`);return}if(!r||!i){alert(`담당자와 사유는 필수입니다.`);return}let a=n-t;if(a===0){alert(`현재 재고와 같습니다.`);return}await J(e,{type:`adjust`,qty:a,before:t,after:n,date:y(),staff:r,note:i,partPatch:{currentQty:n},message:`부품 재고 조정 — ${v(e)} ${a>0?`+`:``}${a} (${t}→${n}) / 사유: ${i} / 담당: ${r}`})})}async function J(e,{type:t,qty:a,before:o,after:c,date:u,staff:d,note:f,partPatch:p,message:m}){try{await n(r(l,`equipmentParts`,e.id),{...p,updatedAt:new Date}),await s(i(l,`equipmentPartLogs`),{partId:e.id,partName:e.name,equipmentId:e.equipmentId,equipmentCategory:e.equipmentCategory||``,equipmentAlias:e.equipmentAlias||``,type:t,qty:a,before:o,after:c,date:u,staffName:d,note:f||``,timestamp:new Date}),await b({action:`equipment`,subAction:t,date:u,staff:d,message:m,details:{partId:e.id,equipmentId:e.equipmentId,partName:e.name,qty:a,before:o,after:c,note:f||null}}),$(),T=e.id,await k(),N(),B()}catch(e){console.error(`[equipment] change failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}}var Y={};async function ve(){if(Object.keys(Y).length>0)return Y;for(let e of[`senior`,`lead`,`office`]){let t=await a(r(l,`staffGroups`,e));t.exists()&&(Y[e]=t.data().members||[])}return Y}function ye(e){let t=[];return e.forEach(e=>(Y[e]||[]).forEach(e=>{e.name&&!t.includes(e.name)&&t.push(e.name)})),t.map(e=>`<option value="${j(e)}">${j(e)}</option>`).join(``)}function X(){return m===`admin`?`대표`:m===`office`?`사무실`:m===`production`?`생산실`:`시스템`}var Z=`equipmentModalOverlay`;function Q(e){$();let t=document.createElement(`div`);t.id=Z,t.className=`modal-overlay`,t.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(t)}function $(){document.getElementById(Z)?.remove()}export{ie as renderEquipment};