import{_ as e,b as t,d as n,g as r,h as i,i as a,n as o,o as s,y as c}from"./index.esm-rHmxwfvm.js";import{n as l}from"./firebase-qGjqjNvO.js";import{H as u,P as d,a as f,c as p,d as m,f as h,g,h as _,l as ee,m as v,o as y,s as b,u as x}from"./index-ihWgJTcM.js";import{n as S}from"./activityLogs-Jg2Ymepu.js";import{t as te}from"./sortable-DoCboJo0.js";var C=`__all__`,w=[],T=[],E=C,D=null,O=!1,k=!1,A=[];async function ne(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>설비 부품 로딩 중...</p></div>`,await j(),document.getElementById(`mainContent`)===e&&P()}async function j(){let e=document.getElementById(`mainContent`),t=await Promise.all([h(),m(),_e()]);document.getElementById(`mainContent`)===e&&([w,T]=t)}function M(){return u===`admin`||u===`office`}function N(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function P(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">기계 목록</span>
          <div style="display:flex;gap:6px;">
            ${M()?`<button class="btn-secondary" id="btnCategoryManage" title="종류 이름 변경">⚙</button>`:``}
            ${M()?`<button class="btn-primary" id="btnNewEquipment">+ 기계</button>`:``}
          </div>
        </div>
        <div class="recipe-list" id="equipmentList">${R()}</div>
      </div>
      <div class="recipe-detail-panel" id="equipmentDetail"></div>
    </div>
  `,ie(),B(),document.getElementById(`btnNewEquipment`)?.addEventListener(`click`,()=>K(null)),document.getElementById(`btnCategoryManage`)?.addEventListener(`click`,fe),V()}function F(){let e=document.getElementById(`equipmentList`);e&&(e.innerHTML=R(),ie(),B())}function I(e){let t=[];return e.forEach(e=>{t.includes(e.category)||t.push(e.category)}),t}function re(e){let t=d(),n=null,r=0;return T.filter(t=>t.equipmentId===e&&t.active!==!1).forEach(e=>{let i=x(e,t);i.dday!==null&&(n===null||i.dday<n)&&(n=i.dday),i.low&&(r+=1)}),{worst:n,lowCount:r}}function L(e){return e==null?`<span class="eq-pill eq-pill-gray">-</span>`:`<span class="eq-pill ${e<0?`eq-pill-red`:e<=7?`eq-pill-amber`:`eq-pill-gray`}">${ee(e)}</span>`}function R(){let e=b(T),t=`
    <div class="recipe-list-item eq-all-item ${E===C?`active`:``}" data-id="${C}">
      <div class="recipe-list-info" style="padding-left:8px;">
        <span class="recipe-name" style="color:${e.length?`#b91c1c`:`#555`}">⚠ 전체 임박·부족</span>
      </div>
      <span class="eq-pill ${e.length?`eq-pill-red`:`eq-pill-gray`}">${e.length}</span>
    </div>
  `;if(w.length===0)return t+=`<div class="list-empty">등록된 기계 없음</div>`,t;let n=w.filter(e=>e.active!==!1),r=w.filter(e=>e.active===!1);return I(n).forEach(e=>{let r=n.filter(t=>t.category===e);t+=`<div class="list-group-label">${N(e)}</div>`,t+=`<div class="sortable-master-list eq-sortable" data-category="${N(e)}">${r.map(z).join(``)}</div>`}),r.length>0&&(t+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,t+=`<div class="master-inactive-list">${r.map(z).join(``)}</div>`),t}function z(e){let t=e.active===!1,{worst:n,lowCount:r}=re(e.id);return`
    <div class="recipe-list-item ${E===e.id?`active`:``} ${t?`inactive-master`:``}" data-id="${e.id}">
      ${M()&&!t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:`<span style="width:8px;display:inline-block;"></span>`}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${t?`#999`:`#1a1a1a`}">${N(e.alias)}</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-right:6px;">
        ${t?``:L(n)}
        ${r>0&&!t?`<span class="eq-pill eq-pill-amber">부족 ${r}</span>`:``}
      </div>
    </div>
  `}function ie(){document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(E=e.dataset.id,D=null,document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),V())})})}function B(){A.forEach(e=>e.destroy()),A=[],M()&&document.querySelectorAll(`#equipmentList .eq-sortable`).forEach(e=>{A.push(te.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await ae()}}))})}async function ae(){let n=Array.from(document.querySelectorAll(`#equipmentList .eq-sortable .recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),r=new Date,i=e(l);n.forEach((e,n)=>i.update(t(l,`equipments`,e),{sortOrder:n,updatedAt:r}));try{await i.commit();let e=new Map(n.map((e,t)=>[e,t]));w=w.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id)}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){console.error(`[equipment] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),w=await h(),F()}}function V(){let e=document.getElementById(`equipmentDetail`);if(!e)return;if(E===C){ce(e);return}let t=w.find(e=>e.id===E);if(!t){e.innerHTML=`<div class="detail-empty">기계를 선택해주세요</div>`;return}se(e,t)}function oe(e){let t=d();return[...e].sort((e,n)=>{let r=x(e,t).dday??99999,i=x(n,t).dday??99999;return r===i?(e.sortOrder??0)-(n.sortOrder??0):r-i})}function H(e,{showMachine:t=!1}={}){let n=x(e),r=e.active===!1,i=n.overdue?`background:#fef2f2;`:n.dueSoon?`background:#fffbeb;`:``,a=n.low?`#e53e3e`:`#1a1a1a`,o=!r;return`
    <tr class="eq-part-row ${D===e.id?`eq-part-row-selected`:``} ${r?`inactive-master`:``}" data-part-id="${e.id}" style="${i}cursor:pointer;">
      ${t?`<td>${N(v(e.equipmentCategory,e.equipmentAlias))}</td>`:``}
      <td style="font-weight:500;">${N(e.name)}${r?` <span class="tag tag-inactive">비활성</span>`:``}</td>
      <td style="color:#666;">${N(e.spec||`-`)}</td>
      <td>${p(e)}</td>
      <td>${e.lastReplacedAt||`-`}</td>
      <td>${e.nextDueAt||`-`}</td>
      <td>${L(n.dday)}</td>
      <td style="color:${a};${n.low?`font-weight:600;`:``}">${Number(e.currentQty||0)} / ${Number(e.minimumQty||0)}</td>
      <td style="white-space:nowrap;">
        ${o?`
          <button class="eq-act" data-act="replace" data-part-id="${e.id}">교체</button>
          <button class="eq-act" data-act="in" data-part-id="${e.id}">입고</button>
          <button class="eq-act" data-act="adjust" data-part-id="${e.id}">조정</button>
        `:``}
        ${M()?`<button class="eq-act" data-act="edit" data-part-id="${e.id}" title="부품 수정">✎</button>`:``}
      </td>
    </tr>
  `}function U(e){return`
    <thead>
      <tr>
        ${e?`<th>기계</th>`:``}
        <th>부품</th><th>규격</th><th>주기</th><th>마지막 교체</th><th>다음 예정</th><th>D-day</th><th>재고 / 최소</th><th></th>
      </tr>
    </thead>
  `}function se(e,t){let n=d(),r=T.filter(e=>e.equipmentId===t.id),i=r.length;O&&(r=r.filter(e=>{let t=x(e,n);return t.overdue||t.dueSoon})),k&&(r=r.filter(e=>x(e,n).low)),r=oe(r);let a=t.active===!1;e.innerHTML=`
    <div class="detail-header">
      <div>
        <span class="detail-title">${N(t.alias)}</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">${N(t.category)} · 부품 ${i}개${a?` · 비활성`:``}</span>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary eq-filter ${O?`eq-filter-on`:``}" id="btnFilterDue">임박만</button>
        <button class="btn-secondary eq-filter ${k?`eq-filter-on`:``}" id="btnFilterLow">부족만</button>
        ${M()?`<button class="btn-secondary" id="btnEditEquipment">기계 수정</button>`:``}
        ${M()&&!a?`<button class="btn-primary" id="btnNewPart">+ 부품 추가</button>`:``}
      </div>
    </div>
    <div class="detail-body">
      ${t.memo?`<p style="font-size:12px;color:#666;margin:0 0 12px;">${N(t.memo)}</p>`:``}
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${U(!1)}
            <tbody>
              ${r.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">${i===0?`등록된 부품 없음`:`조건에 맞는 부품 없음`}</td></tr>`:r.map(e=>H(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,document.getElementById(`btnFilterDue`).addEventListener(`click`,()=>{O=!O,V()}),document.getElementById(`btnFilterLow`).addEventListener(`click`,()=>{k=!k,V()}),document.getElementById(`btnEditEquipment`)?.addEventListener(`click`,()=>K(t)),document.getElementById(`btnNewPart`)?.addEventListener(`click`,()=>q(null,t)),W(),D&&G()}function ce(e){let t=b(T),n=new Set,r=[];t.forEach(e=>{n.has(e.part.id)||(n.add(e.part.id),r.push(e.part))}),e.innerHTML=`
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
            ${U(!0)}
            <tbody>
              ${r.length===0?`<tr><td colspan="9" style="text-align:center;color:#aaa;padding:20px;">확인할 부품 없음</td></tr>`:r.map(e=>H(e,{showMachine:!0})).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,W(),D&&G()}function W(){document.querySelectorAll(`.eq-part-row`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.eq-act`)||(D=D===e.dataset.partId?null:e.dataset.partId,document.querySelectorAll(`.eq-part-row`).forEach(e=>e.classList.toggle(`eq-part-row-selected`,e.dataset.partId===D)),G())})}),document.querySelectorAll(`.eq-act`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=T.find(t=>t.id===e.dataset.partId);if(!n)return;let r=e.dataset.act;r===`replace`?me(n):r===`in`?he(n):r===`adjust`?ge(n):r===`edit`&&q(n,w.find(e=>e.id===n.equipmentId))})})}var le={replace:`교체`,in:`입고`,adjust:`조정`};async function G(){let e=document.getElementById(`partHistory`);if(!e)return;let t=T.find(e=>e.id===D);if(!t){e.innerHTML=``;return}e.innerHTML=`<p style="font-size:12px;color:#888;padding:8px 0;">이력 로딩 중...</p>`;let i=[];try{i=(await s(n(c(l,`equipmentPartLogs`),r(`partId`,`==`,t.id)))).docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0)).slice(0,50)}catch(e){console.error(`[equipment] history load failed:`,e)}document.getElementById(`partHistory`)!==e||D!==t.id||(e.innerHTML=`
    <div class="form-section">
      <div class="section-header">
        <span class="section-title">${N(_(t))} · 이력</span>
        ${t.memo?`<span style="font-size:12px;color:#888;">${N(t.memo)}</span>`:``}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>날짜</th><th>구분</th><th>수량</th><th>전→후</th><th>담당자</th><th>비고</th></tr></thead>
          <tbody>
            ${i.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:i.map(e=>`
                <tr>
                  <td>${e.date||`-`}</td>
                  <td><span class="tag ${e.type===`in`?`tag-raw`:e.type===`replace`?`tag-freezeDry`:`tag-cat`}">${le[e.type]||e.type}</span></td>
                  <td style="color:${e.qty>0?`#2d7a3a`:e.qty<0?`#e53e3e`:`#666`}">${e.qty>0?`+`:``}${e.qty??0}</td>
                  <td style="color:#888;">${e.before??`-`} → ${e.after??`-`}</td>
                  <td>${N(e.staffName||`-`)}</td>
                  <td>${N(e.note||`-`)}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `)}function K(n){if(!M())return;let r=!n,a=I(w),s=w.filter(e=>e.active!==!1);Q(`
    <h3 class="modal-title">${r?`기계 추가`:`기계 수정`}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_category">
          ${a.map(e=>`<option value="${N(e)}" ${n?.category===e?`selected`:``}>${N(e)}</option>`).join(``)}
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
      <input type="text" id="m_alias" value="${N(n?.alias||``)}" placeholder="예: 민서기 1호" />
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_memo" value="${N(n?.memo||``)}" placeholder="위치, 모델명 등" />
    </div>
    ${r&&s.length>0?`
      <div class="form-group">
        <label>다른 기계 부품 구성 복사</label>
        <select id="m_copyFrom">
          <option value="">복사 안 함</option>
          ${s.map(e=>`<option value="${e.id}">${N(v(e.category,e.alias))}</option>`).join(``)}
        </select>
        <p style="font-size:11px;color:#888;margin:4px 0 0;">부품명·규격·주기·최소재고만 복사. 재고 0, 교체일 없음으로 생성.</p>
      </div>
    `:``}
    ${r?``:`
      <div class="form-group">
        <label><input type="checkbox" id="m_active" ${n.active===!1?``:`checked`} /> 활성</label>
      </div>
    `}
    <div class="modal-actions">
      ${r?``:`<button class="btn-danger" id="btnDeleteEquipment" style="margin-right:auto;">삭제</button>`}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveEquipment">${r?`추가`:`저장`}</button>
    </div>
  `);let u=document.getElementById(`m_category`),f=document.getElementById(`m_newCategoryWrap`);a.length===0&&(u.value=`__new__`),u.addEventListener(`change`,()=>{f.style.display=u.value===`__new__`?`block`:`none`}),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeleteEquipment`)?.addEventListener(`click`,()=>de(n)),document.getElementById(`btnSaveEquipment`).addEventListener(`click`,async()=>{let a=u.value;a===`__new__`&&(a=document.getElementById(`m_newCategory`).value.trim());let s=document.getElementById(`m_alias`).value.trim(),f=document.getElementById(`m_memo`).value.trim();if(!a||!s){alert(`종류와 별칭은 필수입니다.`);return}if(w.find(e=>e.id!==n?.id&&e.category===a&&e.alias===s)){alert(`같은 종류에 같은 별칭의 기계가 이미 있습니다.`);return}let p=new Date;try{if(r){let e=await o(c(l,`equipments`),{category:a,alias:s,memo:f,active:!0,sortOrder:w.length,createdAt:p,updatedAt:p}),t=document.getElementById(`m_copyFrom`)?.value||``;t&&await ue(t,{id:e.id,category:a,alias:s}),await S({action:`equipment`,subAction:`create`,date:d(),staff:Z(),message:`기계 추가 — ${v(a,s)}`,details:{equipmentId:e.id,category:a,alias:s,copiedFrom:t||null}}),E=e.id}else{let r=document.getElementById(`m_active`).checked;if(await i(t(l,`equipments`,n.id),{category:a,alias:s,memo:f,active:r,updatedAt:p}),a!==n.category||s!==n.alias){let r=e(l);T.filter(e=>e.equipmentId===n.id).forEach(e=>{r.update(t(l,`equipmentParts`,e.id),{equipmentCategory:a,equipmentAlias:s,updatedAt:p})}),await r.commit()}await S({action:`equipment`,subAction:`update`,date:d(),staff:Z(),message:`기계 수정 — ${v(a,s)}${r?``:` (비활성)`}`,details:{equipmentId:n.id,category:a,alias:s,active:r}})}$(),await j(),P()}catch(e){console.error(`[equipment] save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}})}async function ue(n,r){let i=T.filter(e=>e.equipmentId===n&&e.active!==!1);if(i.length===0)return;let a=new Date,o=e(l);i.forEach((e,n)=>{let i=t(c(l,`equipmentParts`));o.set(i,{equipmentId:r.id,equipmentCategory:r.category,equipmentAlias:r.alias,name:e.name,spec:e.spec||``,cycleValue:e.cycleValue||0,cycleUnit:e.cycleUnit||`day`,lastReplacedAt:null,nextDueAt:null,currentQty:0,minimumQty:e.minimumQty||0,memo:``,active:!0,sortOrder:n,createdAt:a,updatedAt:a})}),await o.commit()}async function de(n){if(!M())return;let r=T.filter(e=>e.equipmentId===n.id);if(r.length>0){alert(`부품 ${r.length}개가 등록되어 있어 삭제할 수 없습니다.\n부품을 먼저 삭제하거나 기계를 비활성으로 바꿔주세요.`);return}if(await g({title:`기계 삭제`,message:`${v(n.category,n.alias)}을(를) 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))try{let r=e(l);r.delete(t(l,`equipments`,n.id)),await r.commit(),await S({action:`equipment`,subAction:`delete`,date:d(),staff:Z(),message:`기계 삭제 — ${v(n.category,n.alias)}`,details:{equipmentId:n.id,category:n.category,alias:n.alias}}),$(),E=C,await j(),P()}catch(e){console.error(`[equipment] delete failed:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}function fe(){if(!M())return;let n=I(w);Q(`
    <h3 class="modal-title">기계 종류 이름 변경</h3>
    ${n.length===0?`<p style="font-size:13px;color:#888;">등록된 종류가 없습니다.</p>`:n.map((e,t)=>`
      <div class="form-group">
        <label>${N(e)} <span style="color:#aaa;font-weight:400;">(기계 ${w.filter(t=>t.category===e).length}대)</span></label>
        <input type="text" class="m_catRename" data-index="${t}" data-original="${N(e)}" value="${N(e)}" />
      </div>
    `).join(``)}
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveCategories">저장</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveCategories`).addEventListener(`click`,async()=>{let n=[];if(document.querySelectorAll(`.m_catRename`).forEach(e=>{let t=e.dataset.original,r=e.value.trim();r&&r!==t&&n.push({from:t,to:r})}),n.length===0){$();return}let r=new Date;try{let i=e(l);n.forEach(({from:e,to:n})=>{w.filter(t=>t.category===e).forEach(e=>i.update(t(l,`equipments`,e.id),{category:n,updatedAt:r})),T.filter(t=>t.equipmentCategory===e).forEach(e=>i.update(t(l,`equipmentParts`,e.id),{equipmentCategory:n,updatedAt:r}))}),await i.commit(),await S({action:`equipment`,subAction:`renameCategory`,date:d(),staff:Z(),message:`기계 종류 이름 변경 — ${n.map(e=>`${e.from}→${e.to}`).join(`, `)}`,details:{changes:n}}),$(),await j(),P()}catch(e){console.error(`[equipment] rename category failed:`,e),alert(`저장 중 오류가 발생했습니다.`)}})}function q(e,n){if(!M()||!n)return;let r=!e;Q(`
    <h3 class="modal-title">${r?`부품 추가`:`부품 수정`} — ${N(v(n.category,n.alias))}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>부품명 *</label>
        <input type="text" id="m_name" value="${N(e?.name||``)}" placeholder="예: 날" />
      </div>
      <div class="form-group">
        <label>규격</label>
        <input type="text" id="m_spec" value="${N(e?.spec||``)}" placeholder="예: Ø120" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>교체 주기 *</label>
        <div style="display:flex;gap:6px;">
          <input type="number" id="m_cycleValue" min="1" value="${e?.cycleValue||``}" placeholder="숫자" style="flex:1;" />
          <select id="m_cycleUnit" style="width:90px;">
            ${Object.entries(f).map(([t,n])=>`<option value="${t}" ${(e?.cycleUnit||`month`)===t?`selected`:``}>${n}</option>`).join(``)}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>마지막 교체일</label>
        <input type="date" id="m_lastReplacedAt" value="${e?.lastReplacedAt||``}" />
      </div>
    </div>
    <div class="form-row">
      ${r?`
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
      <input type="text" id="m_partMemo" value="${N(e?.memo||``)}" placeholder="구매처, 단가 등" />
    </div>
    ${r?``:`
      <div class="form-group">
        <label><input type="checkbox" id="m_partActive" ${e.active===!1?``:`checked`} /> 활성</label>
      </div>
    `}
    <div class="modal-actions">
      ${r?``:`<button class="btn-danger" id="btnDeletePart" style="margin-right:auto;">삭제</button>`}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSavePart">${r?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeletePart`)?.addEventListener(`click`,()=>pe(e)),document.getElementById(`btnSavePart`).addEventListener(`click`,async()=>{let a=document.getElementById(`m_name`).value.trim(),s=document.getElementById(`m_spec`).value.trim(),u=parseInt(document.getElementById(`m_cycleValue`).value)||0,f=document.getElementById(`m_cycleUnit`).value,p=document.getElementById(`m_lastReplacedAt`).value||null,m=Math.max(0,parseInt(document.getElementById(`m_minimumQty`).value)||0),h=document.getElementById(`m_partMemo`).value.trim();if(!a){alert(`부품명은 필수입니다.`);return}if(u<=0){alert(`교체 주기를 입력해주세요.`);return}let g=new Date,_={name:a,spec:s,cycleValue:u,cycleUnit:f,lastReplacedAt:p,minimumQty:m,memo:h,nextDueAt:y(p,u,f),updatedAt:g};try{if(r){let e=Math.max(0,parseInt(document.getElementById(`m_currentQty`).value)||0),t=await o(c(l,`equipmentParts`),{..._,equipmentId:n.id,equipmentCategory:n.category,equipmentAlias:n.alias,currentQty:e,active:!0,sortOrder:T.filter(e=>e.equipmentId===n.id).length,createdAt:g});await S({action:`equipment`,subAction:`partCreate`,date:d(),staff:Z(),message:`부품 추가 — ${v(n.category,n.alias)} · ${a} (재고 ${e})`,details:{partId:t.id,equipmentId:n.id,name:a,cycleValue:u,cycleUnit:f,currentQty:e,minimumQty:m}})}else _.active=document.getElementById(`m_partActive`).checked,await i(t(l,`equipmentParts`,e.id),_),await S({action:`equipment`,subAction:`partUpdate`,date:d(),staff:Z(),message:`부품 수정 — ${v(n.category,n.alias)} · ${a}${_.active?``:` (비활성)`}`,details:{partId:e.id,equipmentId:n.id,name:a,cycleValue:u,cycleUnit:f,minimumQty:m,active:_.active}});$(),await j(),F(),V()}catch(e){console.error(`[equipment] part save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}})}async function pe(i){if(!M())return;let a=[];try{a=(await s(n(c(l,`equipmentPartLogs`),r(`partId`,`==`,i.id)))).docs}catch(e){console.error(`[equipment] log lookup failed:`,e)}if(await g({title:`부품 삭제`,message:`${_(i)}을(를) 삭제하시겠습니까?${a.length?`\n이력 ${a.length}건이 함께 삭제됩니다.`:``}`,confirmText:`삭제`,danger:!0}))try{let n=e(l);n.delete(t(l,`equipmentParts`,i.id)),a.forEach(e=>n.delete(t(l,`equipmentPartLogs`,e.id))),await n.commit(),await S({action:`equipment`,subAction:`partDelete`,date:d(),staff:Z(),message:`부품 삭제 — ${_(i)}`,details:{partId:i.id,equipmentId:i.equipmentId,name:i.name,logCount:a.length}}),$(),D===i.id&&(D=null),await j(),F(),V()}catch(e){console.error(`[equipment] part delete failed:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}function J(e){return`
    <select id="${e}">
      <option value="">선택</option>
      ${ve([`senior`,`lead`,`office`])}
    </select>
  `}function me(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">부품 교체 — ${N(_(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">
      현재 재고 ${t}개 · 주기 ${p(e)} · 마지막 교체 ${e.lastReplacedAt||`없음`}
      ${t<=0?`<br><span style="color:#e53e3e;">재고가 0이라 차감 없이 교체만 기록됩니다.</span>`:``}
    </p>
    <div class="form-row">
      <div class="form-group">
        <label>교체일 *</label>
        <input type="date" id="m_date" value="${d()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${J(`m_staff`)}
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveReplace`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!n||!r){alert(`교체일과 담당자는 필수입니다.`);return}let a=t,o=a>0?-1:0,s=a+o,c=y(n,e.cycleValue,e.cycleUnit);await Y(e,{type:`replace`,qty:o,before:a,after:s,date:n,staff:r,note:i,partPatch:{currentQty:s,lastReplacedAt:n,nextDueAt:c},message:`부품 교체 — ${_(e)} (재고 ${a}→${s}, 다음 ${c||`-`}) / 담당: ${r}`})})}function he(e){Q(`
    <h3 class="modal-title">부품 입고 — ${N(_(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${Number(e.currentQty||0)}개 · 최소 ${Number(e.minimumQty||0)}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>수량 *</label>
        <input type="number" id="m_qty" min="1" placeholder="개" />
      </div>
      <div class="form-group">
        <label>입고일 *</label>
        <input type="date" id="m_date" value="${d()}" />
      </div>
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      ${J(`m_staff`)}
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="예: 발주분" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveIn">입고</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveIn`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_qty`).value),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!t||t<=0||!n){alert(`수량과 입고일은 필수입니다.`);return}if(!r){alert(`담당자는 필수입니다.`);return}let a=Number(e.currentQty||0),o=a+t;await Y(e,{type:`in`,qty:t,before:a,after:o,date:n,staff:r,note:i,partPatch:{currentQty:o},message:`부품 입고 — ${_(e)} +${t} (재고 ${a}→${o}) / 담당: ${r}`})})}function ge(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">재고 조정 — ${N(_(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${t}개. 실사 수량을 입력하면 차이만큼 조정됩니다.</p>
    <div class="form-row">
      <div class="form-group">
        <label>실제 재고 *</label>
        <input type="number" id="m_actual" min="0" value="${t}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${J(`m_staff`)}
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=parseInt(document.getElementById(`m_actual`).value),r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(Number.isNaN(n)||n<0){alert(`실제 재고를 입력해주세요.`);return}if(!r||!i){alert(`담당자와 사유는 필수입니다.`);return}let a=n-t;if(a===0){alert(`현재 재고와 같습니다.`);return}await Y(e,{type:`adjust`,qty:a,before:t,after:n,date:d(),staff:r,note:i,partPatch:{currentQty:n},message:`부품 재고 조정 — ${_(e)} ${a>0?`+`:``}${a} (${t}→${n}) / 사유: ${i} / 담당: ${r}`})})}async function Y(e,{type:n,qty:r,before:a,after:s,date:u,staff:d,note:f,partPatch:p,message:m}){try{await i(t(l,`equipmentParts`,e.id),{...p,updatedAt:new Date}),await o(c(l,`equipmentPartLogs`),{partId:e.id,partName:e.name,equipmentId:e.equipmentId,equipmentCategory:e.equipmentCategory||``,equipmentAlias:e.equipmentAlias||``,type:n,qty:r,before:a,after:s,date:u,staffName:d,note:f||``,timestamp:new Date}),await S({action:`equipment`,subAction:n,date:u,staff:d,message:m,details:{partId:e.id,equipmentId:e.equipmentId,partName:e.name,qty:r,before:a,after:s,note:f||null}}),$(),D=e.id,await j(),F(),V()}catch(e){console.error(`[equipment] change failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}}var X={};async function _e(){let e=document.getElementById(`mainContent`),n=[`senior`,`lead`,`office`],r=await Promise.all(n.map(e=>a(t(l,`staffGroups`,e))));return document.getElementById(`mainContent`)===e?(X=Object.fromEntries(r.map((e,t)=>[n[t],e.exists()&&e.data().members||[]])),X):{}}function ve(e){let t=[];return e.forEach(e=>(X[e]||[]).forEach(e=>{e.name&&!t.includes(e.name)&&t.push(e.name)})),t.map(e=>`<option value="${N(e)}">${N(e)}</option>`).join(``)}function Z(){return u===`admin`?`대표`:u===`office`?`사무실`:u===`production`?`생산실`:`시스템`}var ye=`equipmentModalOverlay`;function Q(e){$();let t=document.createElement(`div`);t.id=ye,t.className=`modal-overlay`,t.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(t)}function $(){document.getElementById(ye)?.remove()}export{ne as renderEquipment};