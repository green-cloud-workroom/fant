import{b as e,d as t,g as n,s as r,u as i,y as a}from"./index.esm-D8prxbkJ.js";import{n as o}from"./firebase-BOShkvR0.js";import{i as s}from"./staffText-DBRrEFyl.js";import{n as c}from"./modal-5yNlUCJi.js";import{A as l,U as u,_ as d,c as f,d as p,f as m,g as h,l as g,m as _,p as v,tt as y,u as b,ut as x,v as ee}from"./index-DMbsnGtS.js";import{t as S}from"./sortable-BeuTbalv.js";import{t as C}from"./readCommand-tA6ed58e.js";import{t as te}from"./pageRefresh-C4hOMVoH.js";import{t as w}from"./commandBatch-BubRIHqL.js";var T=ee(`equipment`);async function E(e,t=[`admin`,`office`]){let n=l();try{return await C(T,t=>(t.isCurrent=()=>!n||n.isCurrent(),e(t)),{roles:t})}catch(e){console.error(`[설비 저장]`,e),alert(s(e))}}var D=`__all__`,O=[],k=[],A=D,j=null,M=!1,N=!1,P=[];async function ne(e={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>설비 부품 로딩 중...</p></div>`,await I(e),document.getElementById(`mainContent`)===t&&z()}async function F(e={getDocs:r}){return(await e.getDocs(t(a(o,`equipments`),i(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}async function I({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=await T.load(e=>Oe(e),{force:e,onChange:te(T,ne)});!n||document.getElementById(`mainContent`)!==t||(O=n.equipment,k=n.parts,Te=n.staff)}function L(){return x===`admin`||x===`office`}function R(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function z(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="recipe-wrap equipment-page">
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">기계 목록</span>
          <div style="display:flex;gap:6px;">
            ${L()?`<button class="btn-secondary" id="btnCategoryManage" title="종류 이름 변경">⚙</button>`:``}
            ${L()?`<button class="btn-primary" id="btnNewEquipment">+ 기계</button>`:``}
          </div>
        </div>
        <div class="recipe-list" id="equipmentList">${U()}</div>
      </div>
      <div class="recipe-detail-panel" id="equipmentDetail"></div>
    </div>
  `,G(),K(),document.getElementById(`btnNewEquipment`)?.addEventListener(`click`,()=>pe(null)),document.getElementById(`btnCategoryManage`)?.addEventListener(`click`,_e),q()}function B(){let e=document.getElementById(`equipmentList`);e&&(e.innerHTML=U(),G(),K())}function V(e){let t=[];return e.forEach(e=>{t.includes(e.category)||t.push(e.category)}),t}function re(e){let t=y(),n=null,r=0;return k.filter(t=>t.equipmentId===e&&t.active!==!1).forEach(e=>{let i=v(e,t);i.dday!==null&&(n===null||i.dday<n)&&(n=i.dday),i.low&&(r+=1)}),{worst:n,lowCount:r}}function H(e){return e==null?`<span class="eq-pill eq-pill-gray">-</span>`:`<span class="eq-pill ${e<0?`eq-pill-red`:e<=7?`eq-pill-amber`:`eq-pill-gray`}">${m(e)}</span>`}function U(){let e=b(k),t=`
    <div class="recipe-list-item eq-all-item ${A===D?`active`:``}" data-id="${D}">
      <div class="recipe-list-info" style="padding-left:8px;">
        <span class="recipe-name" style="color:${e.length?`#b91c1c`:`#555`}">⚠ 전체 임박·부족</span>
      </div>
      <span class="eq-pill ${e.length?`eq-pill-red`:`eq-pill-gray`}">${e.length}</span>
    </div>
  `;if(O.length===0)return t+=`<div class="list-empty">등록된 기계 없음</div>`,t;let n=O.filter(e=>e.active!==!1),r=O.filter(e=>e.active===!1);return V(n).forEach(e=>{let r=n.filter(t=>t.category===e);t+=`<div class="list-group-label">${R(e)}</div>`,t+=`<div class="sortable-master-list eq-sortable" data-category="${R(e)}">${r.map(W).join(``)}</div>`}),r.length>0&&(t+=`<div class="list-group-label list-group-label--inactive">비활성</div>`,t+=`<div class="master-inactive-list">${r.map(W).join(``)}</div>`),t}function W(e){let t=e.active===!1,{worst:n,lowCount:r}=re(e.id);return`
    <div class="recipe-list-item ${A===e.id?`active`:``} ${t?`inactive-master`:``}" data-id="${e.id}">
      ${L()&&!t?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:`<span style="width:8px;display:inline-block;"></span>`}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${t?`#999`:`#1a1a1a`}">${R(e.alias)}</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-right:6px;">
        ${t?``:H(n)}
        ${r>0&&!t?`<span class="eq-pill eq-pill-amber">부족 ${r}</span>`:``}
      </div>
    </div>
  `}function G(){document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.drag-handle`)||(A=e.dataset.id,j=null,document.querySelectorAll(`#equipmentList .recipe-list-item`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),q())})})}function K(){P.forEach(e=>e.destroy()),P=[],L()&&document.querySelectorAll(`#equipmentList .eq-sortable`).forEach(e=>{P.push(S.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await ie()}}))})}async function ie(){return E(e=>ae(e))}async function ae(t){let n=w(t,o),{batch:r,recordActivity:i}=n,{getDocs:a}=t,c=Array.from(document.querySelectorAll(`#equipmentList .eq-sortable .recipe-list-item`)).map(e=>e.dataset.id).filter(Boolean),l=new Date;c.forEach((t,n)=>r.update(e(o,`equipments`,t),{sortOrder:n,updatedAt:l}));try{if(await n.commit(),!t.isCurrent())return;let e=new Map(c.map((e,t)=>[e,t]));O=O.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id)}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)),await I({force:!0})}catch(e){console.error(`[equipment] reorder save failed:`,e),alert(`순번 저장 실패: `+(s(e)||e));let n=await F();if(!t.isCurrent())return;O=n,B()}}function q(){let e=document.getElementById(`equipmentDetail`);if(!e)return;if(A===D){ue(e);return}let t=O.find(e=>e.id===A);if(!t){e.innerHTML=`<div class="detail-empty">기계를 선택해주세요</div>`;return}le(e,t)}function oe(e){let t=y();return[...e].sort((e,n)=>{let r=v(e,t).dday??99999,i=v(n,t).dday??99999;return r===i?(e.sortOrder??0)-(n.sortOrder??0):r-i})}function se(e,{showMachine:t=!1}={}){let n=v(e),r=e.active===!1,i=n.overdue?`background:#fef2f2;`:n.dueSoon?`background:#fffbeb;`:``,a=Number(e.currentQty||0)===0?`egg-status egg-status--empty`:n.low?`egg-status egg-status--low`:``,o=!r;return`
    <tr class="eq-part-row ${j===e.id?`eq-part-row-selected`:``} ${r?`inactive-master`:``}" data-part-id="${e.id}" style="${i}cursor:pointer;">
      ${t?`<td>${R(h(e.equipmentCategory,e.equipmentAlias))}</td>`:``}
      <td style="font-weight:500;">${R(e.name)}${r?` <span class="tag tag-inactive">비활성</span>`:``}</td>
      <td style="color:#666;">${R(e.spec||`-`)}</td>
      <td>${p(e)}</td>
      <td>${e.lastReplacedAt||`-`}</td>
      <td>${e.nextDueAt||`-`}</td>
      <td>${H(n.dday)}</td>
      <td><span class="${a}">${Number(e.currentQty||0)} / ${Number(e.minimumQty||0)}</span></td>
      <td style="white-space:nowrap;">
        ${o?`
          <button class="eq-act" data-act="replace" data-part-id="${e.id}">교체</button>
          <button class="eq-act" data-act="in" data-part-id="${e.id}">입고</button>
          <button class="eq-act" data-act="adjust" data-part-id="${e.id}">조정</button>
        `:``}
        ${L()?`<button class="eq-act" data-act="edit" data-part-id="${e.id}" title="부품 수정">✎</button>`:``}
      </td>
    </tr>
  `}function ce(e){return`
    <thead>
      <tr>
        ${e?`<th>기계</th>`:``}
        <th>부품</th><th>규격</th><th>주기</th><th>마지막 교체</th><th>다음 예정</th><th>D-day</th><th>재고 / 최소</th><th></th>
      </tr>
    </thead>
  `}function le(e,t){let n=y(),r=k.filter(e=>e.equipmentId===t.id),i=r.length;M&&(r=r.filter(e=>{let t=v(e,n);return t.overdue||t.dueSoon})),N&&(r=r.filter(e=>v(e,n).low)),r=oe(r);let a=t.active===!1;e.innerHTML=`
    <div class="detail-header">
      <div>
        <span class="detail-title">${R(t.alias)}</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">${R(t.category)} · 부품 ${i}개${a?` · 비활성`:``}</span>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary eq-filter ${M?`eq-filter-on`:``}" id="btnFilterDue">임박만</button>
        <button class="btn-secondary eq-filter ${N?`eq-filter-on`:``}" id="btnFilterLow">부족만</button>
        ${L()?`<button class="btn-secondary" id="btnEditEquipment">기계 수정</button>`:``}
        ${L()&&!a?`<button class="btn-secondary" id="btnNewPart">+ 부품 추가</button>`:``}
      </div>
    </div>
    <div class="detail-body">
      ${t.memo?`<p style="font-size:12px;color:#666;margin:0 0 12px;">${R(t.memo)}</p>`:``}
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${ce(!1)}
            <tbody>
              ${r.length===0?`<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">${i===0?`등록된 부품 없음`:`조건에 맞는 부품 없음`}</td></tr>`:r.map(e=>se(e)).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,document.getElementById(`btnFilterDue`).addEventListener(`click`,()=>{M=!M,q()}),document.getElementById(`btnFilterLow`).addEventListener(`click`,()=>{N=!N,q()}),document.getElementById(`btnEditEquipment`)?.addEventListener(`click`,()=>pe(t)),document.getElementById(`btnNewPart`)?.addEventListener(`click`,()=>ve(null,t)),de(),j&&J()}function ue(e){let t=b(k),n=new Set,r=[];t.forEach(e=>{n.has(e.part.id)||(n.add(e.part.id),r.push(e.part))}),e.innerHTML=`
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
            ${ce(!0)}
            <tbody>
              ${r.length===0?`<tr><td colspan="9" style="text-align:center;color:#aaa;padding:20px;">확인할 부품 없음</td></tr>`:r.map(e=>se(e,{showMachine:!0})).join(``)}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `,de(),j&&J()}function de(){document.querySelectorAll(`.eq-part-row`).forEach(e=>{e.addEventListener(`click`,t=>{t.target.closest(`.eq-act`)||(j=j===e.dataset.partId?null:e.dataset.partId,document.querySelectorAll(`.eq-part-row`).forEach(e=>e.classList.toggle(`eq-part-row-selected`,e.dataset.partId===j)),J())})}),document.querySelectorAll(`.eq-act`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=k.find(t=>t.id===e.dataset.partId);if(!n)return;let r=e.dataset.act;r===`replace`?xe(n):r===`in`?Se(n):r===`adjust`?Ce(n):r===`edit`&&ve(n,O.find(e=>e.id===n.equipmentId))})})}var fe={replace:`교체`,in:`입고`,adjust:`조정`};async function J(){let e=document.getElementById(`partHistory`);if(!e)return;let i=k.find(e=>e.id===j);if(!i){e.innerHTML=``;return}e.innerHTML=`<p style="font-size:12px;color:#888;padding:8px 0;">이력 로딩 중...</p>`;let s=[];try{s=(await r(t(a(o,`equipmentPartLogs`),n(`partId`,`==`,i.id)))).docs.map(e=>({id:e.id,...e.data()})).sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0)).slice(0,50)}catch(e){console.error(`[equipment] history load failed:`,e)}document.getElementById(`partHistory`)!==e||j!==i.id||(e.innerHTML=`
    <div class="form-section">
      <div class="section-header">
        <span class="section-title">${R(d(i))} · 이력</span>
        ${i.memo?`<span style="font-size:12px;color:#888;">${R(i.memo)}</span>`:``}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>날짜</th><th>구분</th><th>수량</th><th>전→후</th><th>담당자</th><th>비고</th></tr></thead>
          <tbody>
            ${s.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>`:s.map(e=>`
                <tr>
                  <td>${e.date||`-`}</td>
                  <td><span class="tag ${e.type===`in`?`tag-raw`:e.type===`replace`?`tag-freezeDry`:`tag-cat`}">${fe[e.type]||`작업 구분 확인 필요`}</span></td>
                  <td class="${e.qty>0?`stock-quantity--increase`:e.qty<0?`stock-quantity--decrease`:``}">${e.qty>0?`+`:``}${e.qty??0}</td>
                  <td style="color:#888;">${e.before??`-`} → ${e.after??`-`}</td>
                  <td>${R(e.staffName||`-`)}</td>
                  <td>${R(e.note||`-`)}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `)}function pe(t){if(!L())return;let n=!t,r=V(O),i=O.filter(e=>e.active!==!1);Q(`
    <h3 class="modal-title">${n?`기계 추가`:`기계 수정`}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_category">
          ${r.map(e=>`<option value="${R(e)}" ${t?.category===e?`selected`:``}>${R(e)}</option>`).join(``)}
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
      <input type="text" id="m_alias" value="${R(t?.alias||``)}" placeholder="예: 민서기 1호" />
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_memo" value="${R(t?.memo||``)}" placeholder="위치, 모델명 등" />
    </div>
    ${n&&i.length>0?`
      <div class="form-group">
        <label>다른 기계 부품 구성 복사</label>
        <select id="m_copyFrom">
          <option value="">복사 안 함</option>
          ${i.map(e=>`<option value="${e.id}">${R(h(e.category,e.alias))}</option>`).join(``)}
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
  `);let c=document.getElementById(`m_category`),l=document.getElementById(`m_newCategoryWrap`);r.length===0&&(c.value=`__new__`),c.addEventListener(`change`,()=>{l.style.display=c.value===`__new__`?`block`:`none`}),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeleteEquipment`)?.addEventListener(`click`,()=>he(t)),document.getElementById(`btnSaveEquipment`).addEventListener(`click`,()=>E(async r=>{let i=w(r,o),{batch:l,addDoc:u,updateDoc:d,recordActivity:f}=i,p=c.value;p===`__new__`&&(p=document.getElementById(`m_newCategory`).value.trim());let m=document.getElementById(`m_alias`).value.trim(),g=document.getElementById(`m_memo`).value.trim();if(!p||!m){alert(`종류와 별칭은 필수입니다.`);return}if(O.find(e=>e.id!==t?.id&&e.category===p&&e.alias===m)){alert(`같은 종류에 같은 별칭의 기계가 이미 있습니다.`);return}let _=A,v=new Date;try{if(n){let e=await u(a(o,`equipments`),{category:p,alias:m,memo:g,active:!0,sortOrder:O.length,createdAt:v,updatedAt:v}),t=document.getElementById(`m_copyFrom`)?.value||``;t&&await me(t,{id:e.id,category:p,alias:m},l),await f({action:`equipment`,subAction:`create`,date:y(),staff:Z(),message:`기계 추가 — ${h(p,m)}`,details:{equipmentId:e.id,category:p,alias:m,copiedFrom:t||null}}),_=e.id}else{let n=document.getElementById(`m_active`).checked;await d(e(o,`equipments`,t.id),{category:p,alias:m,memo:g,active:n,updatedAt:v}),(p!==t.category||m!==t.alias)&&k.filter(e=>e.equipmentId===t.id).forEach(t=>{l.update(e(o,`equipmentParts`,t.id),{equipmentCategory:p,equipmentAlias:m,updatedAt:v})}),await f({action:`equipment`,subAction:`update`,date:y(),staff:Z(),message:`기계 수정 — ${h(p,m)}${n?``:` (비활성)`}`,details:{equipmentId:t.id,category:p,alias:m,active:n}})}if(await i.commit(),!r.isCurrent()||(A=_,$(),await I({force:!0}),!r.isCurrent()))return;z()}catch(e){console.error(`[equipment] save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(s(e)||e))}}))}async function me(t,n,r){let i=k.filter(e=>e.equipmentId===t&&e.active!==!1);if(i.length===0)return;let s=new Date;i.forEach((t,i)=>{let c=e(a(o,`equipmentParts`));r.set(c,{equipmentId:n.id,equipmentCategory:n.category,equipmentAlias:n.alias,name:t.name,spec:t.spec||``,cycleValue:t.cycleValue||0,cycleUnit:t.cycleUnit||`day`,lastReplacedAt:null,nextDueAt:null,currentQty:0,minimumQty:t.minimumQty||0,memo:``,active:!0,sortOrder:i,createdAt:s,updatedAt:s})})}async function he(e){return E(t=>ge(e,t))}async function ge(t,n){let r=w(n,o),{batch:i,recordActivity:a}=r,{getDocs:l}=n;if(!L())return;let u=k.filter(e=>e.equipmentId===t.id);if(u.length>0){alert(`부품 ${u.length}개가 등록되어 있어 삭제할 수 없습니다.\n부품을 먼저 삭제하거나 기계를 비활성으로 바꿔주세요.`);return}if(await c({title:`기계 삭제`,message:`${h(t.category,t.alias)}을(를) 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))try{if(i.delete(e(o,`equipments`,t.id)),await a({action:`equipment`,subAction:`delete`,date:y(),staff:Z(),message:`기계 삭제 — ${h(t.category,t.alias)}`,details:{equipmentId:t.id,category:t.category,alias:t.alias}}),await r.commit(),!n.isCurrent()||($(),A=D,await I({force:!0}),!n.isCurrent()))return;z()}catch(e){console.error(`[equipment] delete failed:`,e),alert(s(e)||`삭제 중 오류가 발생했습니다.`)}}function _e(){if(!L())return;let t=V(O);Q(`
    <h3 class="modal-title">기계 종류 이름 변경</h3>
    ${t.length===0?`<p style="font-size:13px;color:#888;">등록된 종류가 없습니다.</p>`:t.map((e,t)=>`
      <div class="form-group">
        <label>${R(e)} <span style="color:#aaa;font-weight:400;">(기계 ${O.filter(t=>t.category===e).length}대)</span></label>
        <input type="text" class="m_catRename" data-index="${t}" data-original="${R(e)}" value="${R(e)}" />
      </div>
    `).join(``)}
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveCategories">저장</button>
    </div>
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveCategories`).addEventListener(`click`,()=>E(async t=>{let n=w(t,o),{batch:r,addDoc:i,updateDoc:a,recordActivity:c}=n,l=[];if(document.querySelectorAll(`.m_catRename`).forEach(e=>{let t=e.dataset.original,n=e.value.trim();n&&n!==t&&l.push({from:t,to:n})}),l.length===0){$();return}let u=new Date;try{if(l.forEach(({from:t,to:n})=>{O.filter(e=>e.category===t).forEach(t=>r.update(e(o,`equipments`,t.id),{category:n,updatedAt:u})),k.filter(e=>e.equipmentCategory===t).forEach(t=>r.update(e(o,`equipmentParts`,t.id),{equipmentCategory:n,updatedAt:u}))}),await c({action:`equipment`,subAction:`renameCategory`,date:y(),staff:Z(),message:`기계 종류 이름 변경 — ${l.map(e=>`${e.from}→${e.to}`).join(`, `)}`,details:{changes:l}}),await n.commit(),!t.isCurrent()||($(),await I({force:!0}),!t.isCurrent()))return;z()}catch(e){console.error(`[equipment] rename category failed:`,e),alert(s(e)||`저장 중 오류가 발생했습니다.`)}}))}function ve(t,n){if(!L()||!n)return;let r=!t;Q(`
    <h3 class="modal-title">${r?`부품 추가`:`부품 수정`} — ${R(h(n.category,n.alias))}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>부품명 *</label>
        <input type="text" id="m_name" value="${R(t?.name||``)}" placeholder="예: 날" />
      </div>
      <div class="form-group">
        <label>규격</label>
        <input type="text" id="m_spec" value="${R(t?.spec||``)}" placeholder="예: Ø120" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>교체 주기 *</label>
        <div style="display:flex;gap:6px;">
          <input type="number" id="m_cycleValue" min="1" value="${t?.cycleValue||``}" placeholder="숫자" style="flex:1;" />
          <select id="m_cycleUnit" style="width:90px;">
            ${Object.entries(f).map(([e,n])=>`<option value="${e}" ${(t?.cycleUnit||`month`)===e?`selected`:``}>${n}</option>`).join(``)}
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
      <input type="text" id="m_partMemo" value="${R(t?.memo||``)}" placeholder="구매처, 단가 등" />
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnDeletePart`)?.addEventListener(`click`,()=>ye(t)),document.getElementById(`btnSavePart`).addEventListener(`click`,()=>E(async i=>{let c=w(i,o),{batch:l,addDoc:u,updateDoc:d,recordActivity:f}=c,p=document.getElementById(`m_name`).value.trim(),m=document.getElementById(`m_spec`).value.trim(),_=parseInt(document.getElementById(`m_cycleValue`).value)||0,v=document.getElementById(`m_cycleUnit`).value,b=document.getElementById(`m_lastReplacedAt`).value||null,x=Math.max(0,parseInt(document.getElementById(`m_minimumQty`).value)||0),ee=document.getElementById(`m_partMemo`).value.trim();if(!p){alert(`부품명은 필수입니다.`);return}if(_<=0){alert(`교체 주기를 입력해주세요.`);return}let S=new Date,C={name:p,spec:m,cycleValue:_,cycleUnit:v,lastReplacedAt:b,minimumQty:x,memo:ee,nextDueAt:g(b,_,v),updatedAt:S};try{if(r){let e=Math.max(0,parseInt(document.getElementById(`m_currentQty`).value)||0),t=await u(a(o,`equipmentParts`),{...C,equipmentId:n.id,equipmentCategory:n.category,equipmentAlias:n.alias,currentQty:e,active:!0,sortOrder:k.filter(e=>e.equipmentId===n.id).length,createdAt:S});await f({action:`equipment`,subAction:`partCreate`,date:y(),staff:Z(),message:`부품 추가 — ${h(n.category,n.alias)} · ${p} (재고 ${e})`,details:{partId:t.id,equipmentId:n.id,name:p,cycleValue:_,cycleUnit:v,currentQty:e,minimumQty:x}})}else C.active=document.getElementById(`m_partActive`).checked,await d(e(o,`equipmentParts`,t.id),C),await f({action:`equipment`,subAction:`partUpdate`,date:y(),staff:Z(),message:`부품 수정 — ${h(n.category,n.alias)} · ${p}${C.active?``:` (비활성)`}`,details:{partId:t.id,equipmentId:n.id,name:p,cycleValue:_,cycleUnit:v,minimumQty:x,active:C.active}});if(await c.commit(),!i.isCurrent()||($(),await I({force:!0}),!i.isCurrent()))return;B(),q()}catch(e){console.error(`[equipment] part save failed:`,e),alert(`저장 중 오류가 발생했습니다: `+(s(e)||e))}}))}async function ye(e){return E(t=>be(e,t))}async function be(r,i){let l=w(i,o),{batch:u,recordActivity:f}=l,{getDocs:p}=i;if(!L())return;let m=[];try{m=(await p(t(a(o,`equipmentPartLogs`),n(`partId`,`==`,r.id)))).docs}catch(e){throw e}if(await c({title:`부품 삭제`,message:`${d(r)}을(를) 삭제하시겠습니까?${m.length?`\n이력 ${m.length}건이 함께 삭제됩니다.`:``}`,confirmText:`삭제`,danger:!0}))try{if(u.delete(e(o,`equipmentParts`,r.id)),m.forEach(t=>u.delete(e(o,`equipmentPartLogs`,t.id))),await f({action:`equipment`,subAction:`partDelete`,date:y(),staff:Z(),message:`부품 삭제 — ${d(r)}`,details:{partId:r.id,equipmentId:r.equipmentId,name:r.name,logCount:m.length}}),await l.commit(),!i.isCurrent()||($(),j===r.id&&(j=null),await I({force:!0}),!i.isCurrent()))return;B(),q()}catch(e){console.error(`[equipment] part delete failed:`,e),alert(s(e)||`삭제 중 오류가 발생했습니다.`)}}function Y(e){return`
    <select id="${e}">
      <option value="">선택</option>
      ${Ee([`senior`,`lead`,`office`])}
    </select>
  `}function xe(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">부품 교체 — ${R(d(e))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">
      현재 재고 ${t}개 · 주기 ${p(e)} · 마지막 교체 ${e.lastReplacedAt||`없음`}
      ${t<=0?`<br><span style="color:#e53e3e;">재고가 0이라 차감 없이 교체만 기록됩니다.</span>`:``}
    </p>
    <div class="form-row">
      <div class="form-group">
        <label>교체일 *</label>
        <input type="date" id="m_date" value="${y()}" />
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveReplace`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!n||!r){alert(`교체일과 담당자는 필수입니다.`);return}let a=t,o=a>0?-1:0,s=a+o,c=g(n,e.cycleValue,e.cycleUnit);await X(e,{type:`replace`,qty:o,before:a,after:s,date:n,staff:r,note:i,partPatch:{currentQty:s,lastReplacedAt:n,nextDueAt:c},message:`부품 교체 — ${d(e)} (재고 ${a}→${s}, 다음 ${c||`-`}) / 담당: ${r}`})})}function Se(e){Q(`
    <h3 class="modal-title">부품 입고 — ${R(d(e))}</h3>
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveIn`).addEventListener(`click`,async()=>{let t=parseInt(document.getElementById(`m_qty`).value),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(!t||t<=0||!n){alert(`수량과 입고일은 필수입니다.`);return}if(!r){alert(`담당자는 필수입니다.`);return}let a=Number(e.currentQty||0),o=a+t;await X(e,{type:`in`,qty:t,before:a,after:o,date:n,staff:r,note:i,partPatch:{currentQty:o},message:`부품 입고 — ${d(e)} +${t} (재고 ${a}→${o}) / 담당: ${r}`})})}function Ce(e){let t=Number(e.currentQty||0);Q(`
    <h3 class="modal-title">재고 조정 — ${R(d(e))}</h3>
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
  `),document.getElementById(`btnModalCancel`).addEventListener(`click`,$),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=parseInt(document.getElementById(`m_actual`).value),r=document.getElementById(`m_staff`).value,i=document.getElementById(`m_note`).value.trim();if(Number.isNaN(n)||n<0){alert(`실제 재고를 입력해주세요.`);return}if(!r||!i){alert(`담당자와 사유는 필수입니다.`);return}let a=n-t;if(a===0){alert(`현재 재고와 같습니다.`);return}await X(e,{type:`adjust`,qty:a,before:t,after:n,date:y(),staff:r,note:i,partPatch:{currentQty:n},message:`부품 재고 조정 — ${d(e)} ${a>0?`+`:``}${a} (${t}→${n}) / 사유: ${i} / 담당: ${r}`})})}async function X(e,t){let n=l();!await E(n=>we(e,t,n),[`admin`,`office`,`production`])||n&&!n.isCurrent()||($(),j=e.id,await I({force:!0}),!(n&&!n.isCurrent())&&(B(),q()))}async function we(t,{type:n,qty:r,before:i,after:s,date:c,staff:l,note:d,partPatch:f,message:p},m){let h=e(o,`equipmentParts`,t.id),g=e(a(o,`equipmentPartLogs`));return await m.transaction(o,async e=>{let a=await e.get(h);if(!a.exists()||Number(a.data().currentQty||0)!==Number(i))throw Error(`다른 작업으로 부품 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);e.update(h,{...f,updatedAt:new Date}),e.set(g,{partId:t.id,partName:t.name,equipmentId:t.equipmentId,equipmentCategory:t.equipmentCategory||``,equipmentAlias:t.equipmentAlias||``,type:n,qty:r,before:i,after:s,date:c,staffName:l,note:d||``,timestamp:new Date}),await u({action:`equipment`,subAction:n,date:c,staff:l,message:p,details:{partId:t.id,equipmentId:t.equipmentId,partName:t.name,qty:r,before:i,after:s,note:d||null}},{batch:e})},{targets:[h,g]}),!0}var Te={};function Ee(e){let t=[];return e.forEach(e=>(Te[e]||[]).forEach(e=>{e.name&&!t.includes(e.name)&&t.push(e.name)})),t.map(e=>`<option value="${R(e)}">${R(e)}</option>`).join(``)}function Z(){return x===`admin`?`대표`:x===`office`?`사무실`:x===`production`?`생산실`:`시스템`}var De=`equipmentModalOverlay`;function Q(e){$();let t=document.createElement(`div`);t.id=De,t.className=`modal-overlay`,t.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(t)}function $(){document.getElementById(De)?.remove()}async function Oe(t){let n=[`senior`,`lead`,`office`],[r,i,...a]=await Promise.all([F(t),_(t),...n.map(n=>t.getDoc(e(o,`staffGroups`,n)))]);return{equipment:r,parts:i,staff:Object.fromEntries(n.map((e,t)=>[e,a[t].exists()&&a[t].data().members||[]]))}}function ke({cacheOnly:e=!0}={}){return T.prepare?.(`default`,Oe,{cacheOnly:e})}export{ke as preparePage,ne as renderEquipment};