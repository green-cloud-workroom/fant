import{b as e,d as t,g as n,s as r,u as i,y as a}from"./index.esm-rHmxwfvm.js";import{n as o}from"./firebase-qGjqjNvO.js";import{G as s,L as c,S as l,a as u,c as d,d as f,f as p,i as m,m as h,n as g,o as _,r as ee,s as v,u as y}from"./index-C3J_bQqC.js";import{n as b}from"./activityLogs-CRxSouBf.js";import{t as x}from"./sortable-DIR4yJqN.js";import{t as S}from"./readCommand-BBDmLRkl.js";import{t as te}from"./pageRefresh-33o9kkfx.js";import{t as C}from"./commandBatch-Cevana-n.js";var w=h(`equipment`);async function T(e,t=[`admin`,`office`]){let n=l();try{return await S(w,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[설비 저장]`,e),alert(e.message)}}var E=`__all__`,D=[],O=[],k=E,A=null,j=!1,M=!1,N=[];async function P(e={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>설비 부품 로딩 중...</p></div>`,await F(e),document.getElementById(`mainContent`)===t&&R()}async function ne(e={getDocs:r}){return(await e.getDocs(t(a(o,`equipments`),i(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function F({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=await w.load(e=>De(e),{force:e,onChange:te(w,P)});!n||document.getElementById(`mainContent`)!==t||(D=n.equipment,O=n.parts,we=n.staff)}function I(){return s===`admin`||s===`office`}function L(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function R(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap">
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">기계 목록</span>
          <div style="display:flex;gap:6px;">
            ${I()?`<button class="btn-secondary" id="btnCategoryManage" title="종류 이름 변경">⚙</button>`:``}
            ${I()?`<button class="btn-primary" id="btnNewEquipment">+ 기계</button>`:``}
          </div>
        </div>
        <div class="recipe-list" id="equipmentList">${ae()}</div>
      </div>
      <div class="recipe-detail-panel" id="equipmentDetail"></div>
    </div>
  `,H(),U(),document.getElementById(`btnNewEquipment`)?.addEventListener(`click`,()=>fe(null)),document.getElementById(`btnCategoryManage`)?.addEventListener(`click`,ge),W()}function z(){let e=document.getElementById(`equipmentList`);e&&(e.innerHTML=ae(),H(),U())}function B(e){let t=[];return e.forEach(e=>{t.includes(e.category)||t.push(e.category)}),t}function re(e){let t=c(),n=null,r=0;return O.filter(t=>t.equipmentId===e&&t.active!==!1).forEach(e=>{let i=v(e,t);i.dday!==null&&(n===null||i.dday<n)&&(n=i.dday),i.low&&(r+=1)}),{worst:n,lowCount:r}}function ie(e){return e==null?`<span class="eq-pill eq-pill-gray">-</span>`:`<span class="eq-pill ${e<0?`eq-pill-red`:e<=7?`eq-pill-amber`:`eq-pill-gray`}">${_(e)}</span>`}function ae(){let e=m(O),t=`
    <div class="recipe-list-item eq-all-item ${k===E?`active`:``}" data-id="${E}">
      <div class="recipe-list-info" style="padding-left:8px;">
        <span class="recipe-name" style="color:${e.length?`#b91c1c`:`#555`}">⚠ 전체 임박·부족</span>
      </div>
      <span class="eq-pill ${e.length?`eq-pill-red`:`eq-pill-gray`}">${e.length}</span>
    </div>
  `;if(D.length===0)return t+=`<div class="list-empty">등록된 기계 없음</div>`,t;let n=D.filter(e=>e.active!==!1),r=D.filter(e=>e.active===!1);return B(n).forEach(e=>{let r=n.filter(t=>t.category===e);t+=`<div class="list-group-label">${L(e)}</div>`,t+=`<div class="sortable-master-list eq-sortable" data-category="${L(e)}">${r.map(V).join(``)}</div>`}),r.length>0&&(t+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,t+=`<div class="master-inactive-list">${r.map(V).join(``)}</div>`),t}function V(e){let t=e.active===!1,{worst:n,lowCount:r}=re(e.id);return`
    <div class="recipe-list-item ${k===e.id?`active`:``} ${t?`inactive-master`:``}" data-id="${e.id}">
      ${I()&&!t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:`<span style="width:8px;display:inline-block;"></span>`}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${t?`#999`:`#1a1a1a`}">${L(e.alias)}</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-right:6px;">
        ${t?``:ie(n)}
        ${r>0&&!t?`<span class="eq-pill eq-pill-amber">부족 ${r}</span>`:``}
      </div>
    </div>
  `}function H(){document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(k=e.dataset.id,A=null,document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),W())})})}function U(){N.forEach(e=>e.destroy()),N=[],I()&&document.querySelectorAll(`#equipmentList .eq-sortable`).forEach(e=>{N.push(x.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await oe()}}))})}async function oe(){return T(e=>se(e))}async function se(t){let n=C(t,o),{batch:r,recordActivity:i}=n,{getDocs:a}=t,s=Array.from(document.querySelectorAll(`#equipmentList .eq-sortable .recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),c=new Date;s.forEach((t,n)=>r.update(e(o,`equipments`,t),{sortOrder:n,updatedAt:c}));try{if(await n.commit(),!t.isCurrent())return;let e=new Map(s.map((e,t)=>[e,t]));D=D.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id)}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)),await F({force:!0})}catch(e){console.error(`[equipment] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e));let n=await ne();if(!t.isCurrent())return;D=n,z()}}function W(){let e=document.getElementById(`equipmentDetail`);if(!e)return;if(k===E){ue(e);return}let t=D.find(e=>e.id===k);if(!t){e.innerHTML=`<div class="detail-empty">기계를 선택해주세요</div>`;return}le(e,t)}function ce(e){let t=c();return[...e].sort((e,n)=>{let r=v(e,t).dday??99999,i=v(n,t).dday??99999;return r===i?(e.sortOrder??0)-(n.sortOrder??0):r-i})}function G(e,{showMachine:t=!1}={}){let n=v(e),r=e.active===!1,i=n.overdue?`background:#fef2f2;`:n.dueSoon?`background:#fffbeb;`:``,a=n.low?`#e53e3e`:`#1a1a1a`,o=!r;return`
    <tr class="eq-part-row ${A===e.id?`eq-part-row-selected`:``} ${r?`inactive-master`:``}" data-part-id="${e.id}" style="${i}cursor:pointer;">
      ${t?`<td>${L(y(e.equipmentCategory,e.equipmentAlias))}</td>`:``}
      <td style="font-weight:500;">${L(e.name)}${r?` <span class="tag tag-inactive">비활성</span>`:``}</td>
      <td style="color:#666;">${L(e.spec||`-`)}</td>
      <td>${u(e)}</td>
      <td>${e.lastReplacedAt||`-`}</td>
      <td>${e.nextDueAt||`-`}</td>
      <td>${ie(n.dday)}</td>
      <td style="color:${a};${n.low?`font-weight:600;`:``}">${Number(e.currentQty||0)} / ${Number(e.minimumQty||0)}</td>
      <td style="white-space:nowrap;">
        ${o?`
          <button class="eq-act" data-act="replace" data-part-id="${e.id}">교체</button>
          <button class="eq-act" data-act="in" data-part-id="${e.id}">입고</button>
          <button class="eq-act" data-act="adjust" data-part-id="${e.id}">조정</button>
        `:``}
        ${I()?`<button class="eq-act" data-act="edit" data-part-id="${e.id}" title="부품 수정">✎</button>`:``}
      </td>
    </tr>
  `}function K(e){return`
    <thead>
      <tr>
        ${e?`<th>기계</th>`:``}
        <th>부품</th><th>규격</th><th>주기</th><th>마지막 교체</th><th>다음 예정</th><th>D-day</th><th>재고 / 최소</th><th></th>
      </tr>
    </thead>
  `}function le(e,t){let n=c(),r=O.filter(e=>e.equipmentId===t.id),i=r.length;j&&(r=r.filter(e=>{let t=v(e,n);return t.overdue||t.dueSoon})),M&&(r=r.filter(e=>v(e,n).low)),r=ce(r);let a=t.active===!1;e.innerHTML=`
    <div class="detail-header">
      <div>
        <span class="detail-title">${L(t.alias)}</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">${L(t.category)} · 부품 ${i}개${a?` · 비활성`:``}</span>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary eq-filter ${j?`eq-filter-on`:``}" id="btnFilterDue">임박만</button>
        <button class="btn-secondary eq-filter ${M?`eq-filter-on`:``}" id="btnFilterLow">부족만</button>
        ${I()?`<button class="btn-secondary" id="btnEditEquipment">기계 수정</button>`:``}
        ${I()&&!a?`<button class="btn-primary" id="btnNewPart">+ 부품 추가</button>`:``}
      </div>
    </div>
    <div class="detail-body">
      ${t.memo?`<p style="font-size:12px;color:#666;margin:0 0 12px;">${L(t.memo)}</p>`:``}
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${K(!1)}
            <tbody>
              ${r.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">${i===0?`등록된 부품 없음`:`조건에 맞는 부품 없음`}</td></tr>`:r.map(e=>G(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,document.getElementById(`btnFilterDue`).addEventListener(`click`,()=>{j=!j,W()}),document.getElementById(`btnFilterLow`).addEventListener(`click`,()=>{M=!M,W()}),document.getElementById(`btnEditEquipment`)?.addEventListener(`click`,()=>fe(t)),document.getElementById(`btnNewPart`)?.addEventListener(`click`,()=>_e(null,t)),q(),A&&J()}function ue(e){let t=m(O),n=new Set,r=[];t.forEach(e=>{n.has(e.part.id)||(n.add(e.part.id),r.push(e.part))}),e.innerHTML=`
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
            ${K(!0)}
            <tbody>
              ${r.length===0?`<tr><td colspan="9" style="text-align:center;color:#aaa;padding:20px;">확인할 부품 없음</td></tr>`:r.map(e=>G(e,{showMachine:!0})).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,q(),A&&J()}function q(){document.querySelectorAll(`.eq-part-row`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.eq-act`)||(A=A===e.dataset.partId?null:e.dataset.partId,document.querySelectorAll(`.eq-part-row`).forEach(e=>e.classList.toggle(`eq-part-row-selected`,e.dataset.partId===A)),J())})}),document.querySelectorAll(`.eq-act`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=O.find(t=>t.id===e.dataset.partId);if(!n)return;let r=e.dataset.act;r===`replace`?be(n):r===`in`?xe(n):r===`adjust`?Se(n):r===`edit`&&_e(n,D.find(e=>e.id===n.equipmentId))})})}var de={replace:`교체`,in:`입고`,adjust:`조정`};async function J(){let e=document.getElementById(`partHistory`);if(!e)return;let i=O.find(e=>e.id===A);if(!i){e.innerHTML=``;return}e.innerHTML=`<p style="font-size:12px;color:#888;padding:8px 0;">이력 로딩 중...</p>`;let s=[];try{s=(await r(t(a(o,`equipmentPartLogs`),n(`partId`,`==`,i.id)))).docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0)).slice(0,50)}catch(e){console.error(`[equipment] history load failed:`,e)}document.getElementById(`partHistory`)!==e||A!==i.id||(e.innerHTML=`
    <div class="form-section">
      <div class="section-header">
        <span class="section-title">${L(f(i))} · 이력</span>
        ${i.memo?`<span style="font-size:12px;color:#888;">${L(i.memo)}</span>`:``}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>날짜</th><th>구분</th><th>수량</th><th>전→후</th><th>담당자</th><th>비고</th></tr></thead>
          <tbody>
            ${s.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:s.map(e=>`
                <tr>
                  <td>${e.date||`-`}</td>
                  <td><span class="tag ${e.type===`in`?`tag-raw`:e.type===`replace`?`tag-freezeDry`:`tag-cat`}">${de[e.type]||e.type}</span></td>
                  <td style="color:${e.qty>0?`#2d7a3a`:e.qty<0?`#e53e3e`:`#666`}">${e.qty>0?`+`:``}${e.qty??0}</td>
                  <td style="color:#888;">${e.before??`-`} → ${e.after??`-`}</td>
                  <td>${L(e.staffName||`-`)}</td>
                  <td>${L(e.note||`-`)}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `)}function fe(t){if(!I())return;let n=!t,r=B(D),i=D.filter(e=>e.active!==!1);Q(`
    <h3 class="modal-title">${n?`기계 추가`:`기계 수정`}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_category">
          ${r.map(e=>`<option value="${L(e)}" ${t?.category===e?`selected`:``}>${L(e)}</option>`).join(``)}
          <option value="__new__">+ 새 종류</option>
        </select>
      </div>
      <div class="form-group" id="m_newCategoryWrap" style="display:${r.length===0?`block`:`none`};">
        <label>새 종류 이름</label>
        <input type="text" id="m_newCategory" placeholder="예: 민서기" />
      </div>
    </div>
    <div class="form-group">
      <label>별칭 *</label>
      <input type="text" id="m_alias" value="${L(t?.alias||``)}" placeholder="예: 민서기 1호" />
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_memo" value="${L(t?.memo||``)}" placeholder="위치, 모델명 등" />
    </div>
    ${n&&i.length>0?`
      <div class="form-group">
        <label>다른 기계 부품 구성 복사</label>
        <select id="m_copyFrom">
          <option value="">복사 안 함</option>
          ${i.map(e=>`<option value="${e.id}">${L(y(e.category,e.alias))}</option>`).join(``)}
        </select>
        <p style="font-size:11px;color:#888;margin:4px 0 0;">부품명·규격·주기·최소재고만 복사. 재고 0, 교체일 없음으로 생성.</p>
      </div>
    `:``}
    ${n?``:`
      <div class="form-group">
        <label><input type="checkbox" id="m_active" ${t.active===!1?``:`checked`} /> 활성</label>
      </div>
    `}
    <div class="modal-actions">
      ${n?``:`<button class="btn-danger" id="btnDeleteEquipment" style="margin-right:auto;">삭제</button>`}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveEquipment">${n?`추가`:`저장`}</button>
    </div>
  `);let s=document.getElementById(`m_category`),l=document.getElementById(`m_newCategoryWrap`);r.length===0&&(s.value=`__new__`),s.addEventListener(`change`,()=>{l.style.display=s.value===`__new__`?`block`:`none`}),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeleteEquipment`)?.addEventListener(`click`,()=>me(t)),document.getElementById(`btnSaveEquipment`).addEventListener(`click`,()=>T(async r=>{let i=C(r,o),{batch:l,addDoc:u,updateDoc:d,recordActivity:f}=i,p=s.value;p===`__new__`&&(p=document.getElementById(`m_newCategory`).value.trim());let m=document.getElementById(`m_alias`).value.trim(),h=document.getElementById(`m_memo`).value.trim();if(!p||!m){alert(`종류와 별칭은 필수입니다.`);return}if(D.find(e=>e.id!==t?.id&&e.category===p&&e.alias===m)){alert(`같은 종류에 같은 별칭의 기계가 이미 있습니다.`);return}let g=k,_=new Date;try{if(n){let e=await u(a(o,`equipments`),{category:p,alias:m,memo:h,active:!0,sortOrder:D.length,createdAt:_,updatedAt:_}),t=document.getElementById(`m_copyFrom`)?.value||``;t&&await pe(t,{id:e.id,category:p,alias:m},l),await f({action:`equipment`,subAction:`create`,date:c(),staff:Z(),message:`기계 추가 — ${y(p,m)}`,details:{equipmentId:e.id,category:p,alias:m,copiedFrom:t||null}}),g=e.id}else{let n=document.getElementById(`m_active`).checked;await d(e(o,`equipments`,t.id),{category:p,alias:m,memo:h,active:n,updatedAt:_}),(p!==t.category||m!==t.alias)&&O.filter(e=>e.equipmentId===t.id).forEach(t=>{l.update(e(o,`equipmentParts`,t.id),{equipmentCategory:p,equipmentAlias:m,updatedAt:_})}),await f({action:`equipment`,subAction:`update`,date:c(),staff:Z(),message:`기계 수정 — ${y(p,m)}${n?``:` (비활성)`}`,details:{equipmentId:t.id,category:p,alias:m,active:n}})}if(await i.commit(),!r.isCurrent()||(k=g,$(),await F({force:!0}),!r.isCurrent()))return;R()}catch(e){console.error(`[equipment] save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}}))}async function pe(t,n,r){let i=O.filter(e=>e.equipmentId===t&&e.active!==!1);if(i.length===0)return;let s=new Date;i.forEach((t,i)=>{let c=e(a(o,`equipmentParts`));r.set(c,{equipmentId:n.id,equipmentCategory:n.category,equipmentAlias:n.alias,name:t.name,spec:t.spec||``,cycleValue:t.cycleValue||0,cycleUnit:t.cycleUnit||`day`,lastReplacedAt:null,nextDueAt:null,currentQty:0,minimumQty:t.minimumQty||0,memo:``,active:!0,sortOrder:i,createdAt:s,updatedAt:s})})}async function me(e){return T(t=>he(e,t))}async function he(t,n){let r=C(n,o),{batch:i,recordActivity:a}=r,{getDocs:s}=n;if(!I())return;let l=O.filter(e=>e.equipmentId===t.id);if(l.length>0){alert(`부품 ${l.length}개가 등록되어 있어 삭제할 수 없습니다.\n부품을 먼저 삭제하거나 기계를 비활성으로 바꿔주세요.`);return}if(await p({title:`기계 삭제`,message:`${y(t.category,t.alias)}을(를) 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))try{if(i.delete(e(o,`equipments`,t.id)),await a({action:`equipment`,subAction:`delete`,date:c(),staff:Z(),message:`기계 삭제 — ${y(t.category,t.alias)}`,details:{equipmentId:t.id,category:t.category,alias:t.alias}}),await r.commit(),!n.isCurrent()||($(),k=E,await F({force:!0}),!n.isCurrent()))return;R()}catch(e){console.error(`[equipment] delete failed:`,e),alert(e.message||`삭제 중 오류가 발생했습니다.`)}}function ge(){if(!I())return;let t=B(D);Q(`
    <h3 class="modal-title">기계 종류 이름 변경</h3>
    ${t.length===0?`<p style="font-size:13px;color:#888;">등록된 종류가 없습니다.</p>`:t.map((e,t)=>`
      <div class="form-group">
        <label>${L(e)} <span style="color:#aaa;font-weight:400;">(기계 ${D.filter(t=>t.category===e).length}대)</span></label>
        <input type="text" class="m_catRename" data-index="${t}" data-original="${L(e)}" value="${L(e)}" />
      </div>
    `).join(``)}
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveCategories">저장</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveCategories`).addEventListener(`click`,()=>T(async t=>{let n=C(t,o),{batch:r,addDoc:i,updateDoc:a,recordActivity:s}=n,l=[];if(document.querySelectorAll(`.m_catRename`).forEach(e=>{let t=e.dataset.original,n=e.value.trim();n&&n!==t&&l.push({from:t,to:n})}),l.length===0){$();return}let u=new Date;try{if(l.forEach(({from:t,to:n})=>{D.filter(e=>e.category===t).forEach(t=>r.update(e(o,`equipments`,t.id),{category:n,updatedAt:u})),O.filter(e=>e.equipmentCategory===t).forEach(t=>r.update(e(o,`equipmentParts`,t.id),{equipmentCategory:n,updatedAt:u}))}),await s({action:`equipment`,subAction:`renameCategory`,date:c(),staff:Z(),message:`기계 종류 이름 변경 — ${l.map(e=>`${e.from}→${e.to}`).join(`, `)}`,details:{changes:l}}),await n.commit(),!t.isCurrent()||($(),await F({force:!0}),!t.isCurrent()))return;R()}catch(e){console.error(`[equipment] rename category failed:`,e),alert(e.message||`저장 중 오류가 발생했습니다.`)}}))}function _e(t,n){if(!I()||!n)return;let r=!t;Q(`
    <h3 class="modal-title">${r?`부품 추가`:`부품 수정`} — ${L(y(n.category,n.alias))}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>부품명 *</label>
        <input type="text" id="m_name" value="${L(t?.name||``)}" placeholder="예: 날" />
      </div>
      <div class="form-group">
        <label>규격</label>
        <input type="text" id="m_spec" value="${L(t?.spec||``)}" placeholder="예: Ø120" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>교체 주기 *</label>
        <div style="display:flex;gap:6px;">
          <input type="number" id="m_cycleValue" min="1" value="${t?.cycleValue||``}" placeholder="숫자" style="flex:1;" />
          <select id="m_cycleUnit" style="width:90px;">
            ${Object.entries(g).map(([e,n])=>`<option value="${e}" ${(t?.cycleUnit||`month`)===e?`selected`:``}>${n}</option>`).join(``)}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>마지막 교체일</label>
        <input type="date" id="m_lastReplacedAt" value="${t?.lastReplacedAt||``}" />
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
        <input type="number" id="m_minimumQty" min="0" value="${t?.minimumQty??1}" />
      </div>
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_partMemo" value="${L(t?.memo||``)}" placeholder="구매처, 단가 등" />
    </div>
    ${r?``:`
      <div class="form-group">
        <label><input type="checkbox" id="m_partActive" ${t.active===!1?``:`checked`} /> 활성</label>
      </div>
    `}
    <div class="modal-actions">
      ${r?``:`<button class="btn-danger" id="btnDeletePart" style="margin-right:auto;">삭제</button>`}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSavePart">${r?`추가`:`저장`}</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeletePart`)?.addEventListener(`click`,()=>ve(t)),document.getElementById(`btnSavePart`).addEventListener(`click`,()=>T(async i=>{let s=C(i,o),{batch:l,addDoc:u,updateDoc:d,recordActivity:f}=s,p=document.getElementById(`m_name`).value.trim(),m=document.getElementById(`m_spec`).value.trim(),h=parseInt(document.getElementById(`m_cycleValue`).value)||0,g=document.getElementById(`m_cycleUnit`).value,_=document.getElementById(`m_lastReplacedAt`).value||null,v=Math.max(0,parseInt(document.getElementById(`m_minimumQty`).value)||0),b=document.getElementById(`m_partMemo`).value.trim();if(!p){alert(`부품명은 필수입니다.`);return}if(h<=0){alert(`교체 주기를 입력해주세요.`);return}let x=new Date,S={name:p,spec:m,cycleValue:h,cycleUnit:g,lastReplacedAt:_,minimumQty:v,memo:b,nextDueAt:ee(_,h,g),updatedAt:x};try{if(r){let e=Math.max(0,parseInt(document.getElementById(`m_currentQty`).value)||0),t=await u(a(o,`equipmentParts`),{...S,equipmentId:n.id,equipmentCategory:n.category,equipmentAlias:n.alias,currentQty:e,active:!0,sortOrder:O.filter(e=>e.equipmentId===n.id).length,createdAt:x});await f({action:`equipment`,subAction:`partCreate`,date:c(),staff:Z(),message:`부품 추가 — ${y(n.category,n.alias)} · ${p} (재고 ${e})`,details:{partId:t.id,equipmentId:n.id,name:p,cycleValue:h,cycleUnit:g,currentQty:e,minimumQty:v}})}else S.active=document.getElementById(`m_partActive`).checked,await d(e(o,`equipmentParts`,t.id),S),await f({action:`equipment`,subAction:`partUpdate`,date:c(),staff:Z(),message:`부품 수정 — ${y(n.category,n.alias)} · ${p}${S.active?``:` (비활성)`}`,details:{partId:t.id,equipmentId:n.id,name:p,cycleValue:h,cycleUnit:g,minimumQty:v,active:S.active}});if(await s.commit(),!i.isCurrent()||($(),await F({force:!0}),!i.isCurrent()))return;z(),W()}catch(e){console.error(`[equipment] part save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(e.message||e))}}))}async function ve(e){return T(t=>ye(e,t))}async function ye(r,i){let s=C(i,o),{batch:l,recordActivity:u}=s,{getDocs:d}=i;if(!I())return;let m=[];try{m=(await d(t(a(o,`equipmentPartLogs`),n(`partId`,`==`,r.id)))).docs}catch(e){throw e}if(await p({title:`부품 삭제`,message:`${f(r)}을(를) 삭제하시겠습니까?${m.length?`\n이력 ${m.length}건이 함께 삭제됩니다.`:``}`,confirmText:`삭제`,danger:!0}))try{if(l.delete(e(o,`equipmentParts`,r.id)),m.forEach(t=>l.delete(e(o,`equipmentPartLogs`,t.id))),await u({action:`equipment`,subAction:`partDelete`,date:c(),staff:Z(),message:`부품 삭제 — ${f(r)}`,details:{partId:r.id,equipmentId:r.equipmentId,name:r.name,logCount:m.length}}),await s.commit(),!i.isCurrent()||($(),A===r.id&&(A=null),await F({force:!0}),!i.isCurrent()))return;z(),W()}catch(e){console.error(`[equipment] part delete failed:`,e),alert(e.message||`삭제 중 오류가 발생했습니다.`)}}function Y(e){return`
    <select id="${e}">
      <option value="">선택</option>
      ${Te([`senior`,`lead`,`office`])}
    </select>
  `}function be(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">부품 교체 — ${L(f(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">
      현재 재고 ${t}개 · 주기 ${u(e)} · 마지막 교체 ${e.lastReplacedAt||`없음`}
      ${t<=0?`<br><span style="color:#e53e3e;">재고가 0이라 차감 없이 교체만 기록됩니다.</span>`:``}
    </p>
    <div class="form-row">
      <div class="form-group">
        <label>교체일 *</label>
        <input type="date" id="m_date" value="${c()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${Y(`m_staff`)}
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveReplace`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!n||!r){alert(`교체일과 담당자는 필수입니다.`);return}let a=t,o=a>0?-1:0,s=a+o,c=ee(n,e.cycleValue,e.cycleUnit);await X(e,{type:`replace`,qty:o,before:a,after:s,date:n,staff:r,note:i,partPatch:{currentQty:s,lastReplacedAt:n,nextDueAt:c},message:`부품 교체 — ${f(e)} (재고 ${a}→${s}, 다음 ${c||`-`}) / 담당: ${r}`})})}function xe(e){Q(`
    <h3 class="modal-title">부품 입고 — ${L(f(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${Number(e.currentQty||0)}개 · 최소 ${Number(e.minimumQty||0)}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>수량 *</label>
        <input type="number" id="m_qty" min="1" placeholder="개" />
      </div>
      <div class="form-group">
        <label>입고일 *</label>
        <input type="date" id="m_date" value="${c()}" />
      </div>
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      ${Y(`m_staff`)}
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="예: 발주분" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveIn">입고</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveIn`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_qty`).value),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!t||t<=0||!n){alert(`수량과 입고일은 필수입니다.`);return}if(!r){alert(`담당자는 필수입니다.`);return}let a=Number(e.currentQty||0),o=a+t;await X(e,{type:`in`,qty:t,before:a,after:o,date:n,staff:r,note:i,partPatch:{currentQty:o},message:`부품 입고 — ${f(e)} +${t} (재고 ${a}→${o}) / 담당: ${r}`})})}function Se(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">재고 조정 — ${L(f(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${t}개. 실사 수량을 입력하면 차이만큼 조정됩니다.</p>
    <div class="form-row">
      <div class="form-group">
        <label>실제 재고 *</label>
        <input type="number" id="m_actual" min="0" value="${t}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${Y(`m_staff`)}
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=parseInt(document.getElementById(`m_actual`).value),r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(Number.isNaN(n)||n<0){alert(`실제 재고를 입력해주세요.`);return}if(!r||!i){alert(`담당자와 사유는 필수입니다.`);return}let a=n-t;if(a===0){alert(`현재 재고와 같습니다.`);return}await X(e,{type:`adjust`,qty:a,before:t,after:n,date:c(),staff:r,note:i,partPatch:{currentQty:n},message:`부품 재고 조정 — ${f(e)} ${a>0?`+`:``}${a} (${t}→${n}) / 사유: ${i} / 담당: ${r}`})})}async function X(e,t){let n=l();!await T(n=>Ce(e,t,n),[`admin`,`office`,`production`])||n&&!n.isCurrent()||($(),A=e.id,await F({force:!0}),!(n&&!n.isCurrent())&&(z(),W()))}async function Ce(t,{type:n,qty:r,before:i,after:s,date:c,staff:l,note:u,partPatch:d,message:f},p){let m=e(o,`equipmentParts`,t.id),h=e(a(o,`equipmentPartLogs`));return await p.transaction(o,async e=>{let a=await e.get(m);if(!a.exists()||Number(a.data().currentQty||0)!==Number(i))throw Error(`다른 작업으로 부품 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);e.update(m,{...d,updatedAt:new Date}),e.set(h,{partId:t.id,partName:t.name,equipmentId:t.equipmentId,equipmentCategory:t.equipmentCategory||``,equipmentAlias:t.equipmentAlias||``,type:n,qty:r,before:i,after:s,date:c,staffName:l,note:u||``,timestamp:new Date}),await b({action:`equipment`,subAction:n,date:c,staff:l,message:f,details:{partId:t.id,equipmentId:t.equipmentId,partName:t.name,qty:r,before:i,after:s,note:u||null}},{batch:e})},{targets:[m,h]}),!0}var we={};function Te(e){let t=[];return e.forEach(e=>(we[e]||[]).forEach(e=>{e.name&&!t.includes(e.name)&&t.push(e.name)})),t.map(e=>`<option value="${L(e)}">${L(e)}</option>`).join(``)}function Z(){return s===`admin`?`대표`:s===`office`?`사무실`:s===`production`?`생산실`:`시스템`}var Ee=`equipmentModalOverlay`;function Q(e){$();let t=document.createElement(`div`);t.id=Ee,t.className=`modal-overlay`,t.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(t)}function $(){document.getElementById(Ee)?.remove()}async function De(t){let n=[`senior`,`lead`,`office`],[r,i,...a]=await Promise.all([ne(t),d(t),...n.map(n=>t.getDoc(e(o,`staffGroups`,n)))]);return{equipment:r,parts:i,staff:Object.fromEntries(n.map((e,t)=>[e,a[t].exists()&&a[t].data().members||[]]))}}function Oe({cacheOnly:e=!0}={}){return w.prepare?.(`default`,De,{cacheOnly:e})}export{Oe as preparePage,P as renderEquipment};