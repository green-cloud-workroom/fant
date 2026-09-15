import{a as e,c as t,f as n,g as r,h as i,i as a,m as o,n as s,p as c,s as l,u}from"./index.esm-Cf9DaHbi.js";import{n as d}from"./firebase-BQPCO7kq.js";import{j as f,w as p}from"./index-CMgkQ4he.js";import{n as m}from"./activityLogs-Mn_dgBRB.js";import{t as h}from"./closingGuard-CS1p4aoM.js";import{t as g}from"./sortable.esm-D0d_dJ5t.js";import{t as _}from"./meatLogs-5RqsF683.js";var v=[],y=[],b=`frozen`,x=null,S=[],C=null,w=new Set,T=new Set;async function ee(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>원료 재고 로딩 중...</p></div>`;let t=await Promise.all([E(),D(),Pe()]);e.isConnected&&([v,y]=t,xe())}async function E(){return(await e(t(i(d,`meatTypes`),l(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}function te(e){return(Array.isArray(e)?e:[]).map((e,t)=>({id:String(e?.id||``).trim(),name:String(e?.name||``).trim(),sortOrder:Number.isFinite(Number(e?.sortOrder))?Number(e.sortOrder):t,scope:e?.scope===`produce`?`produce`:`meat`})).filter(e=>e.id&&e.name).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)||e.name.localeCompare(t.name,`ko`))}async function D(){let e=await a(r(d,`settings`,`meatStockCategories`));return e.exists()?te(e.data().groups):[]}async function O(e){let t=te(e).map((e,t)=>({...e,sortOrder:t}));await u(r(d,`settings`,`meatStockCategories`),{groups:t,updatedAt:new Date},{merge:!0}),y=t}function k(){return b===`produce`?`produce`:`meat`}function A(e=k()){return y.filter(t=>(t.scope||`meat`)===e)}function j(){return v.filter(e=>e.active!==!1)}function M(e){return v.find(t=>t.id===e)?.category||`meat`}function N(e){return M(e)===`produce`}function ne(e){return!N(e.meatTypeId)}function re(e){return N(e.meatTypeId)}function ie(e){return!N(e.meatTypeId)}function ae(e){return N(e.meatTypeId)}async function oe(n){return(await e(t(i(d,`meatLogs`),c(`stage`,`==`,n),l(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}function P(e){return{frozenIncoming:`입고`,frozenOut:`전처리로 출고`,processedIn:`전처리`,processedOut:`재포장으로 출고`,repackedIn:`재포장`,repackedOut:`출고`,productionDeduct:`생산차감`,productionRollback:`생산복원`,adjust:`수동조정`}[e]||e}function F(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function I(e){return typeof e==`number`?`${e>0?`+`:``}${(e/1e3).toFixed(2)}kg`:`-`}async function L(n){return(await e(t(i(d,`meatStocks`),l(`incomingDate`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.stage===n&&!e.closed)}function R(e,t){let n=v.find(e=>e.id===t)?.minimumQtyG||0;return n<=0?`#1a1a1a`:e<n?`#e53e3e`:e<n*1.5?`#dd6b20`:`#1a1a1a`}function z(e){let t=new Map;return(e||[]).forEach(e=>{let n=e.meatTypeId||e.meatNameSnapshot||e.id,r=t.get(n);r?(r.totalG+=Number(e.remaining||0),r.lots.push(e)):t.set(n,{name:e.meatNameSnapshot||`원료`,totalG:Number(e.remaining||0),meatTypeId:e.meatTypeId,lots:[e]})}),t}function B(e=``){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function se(){return`cat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}function ce(e){return v.find(t=>t.id===e)?.groupId||null}function V(e){let t=v.find(t=>t.id===e)?.groupSortOrder;return Number.isFinite(Number(t))?Number(t):2**53-1}function le(e){let t=A().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return[...e.values()].forEach(e=>{let t=e.meatTypeId?ce(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>{let n=V(e.meatTypeId),r=V(t.meatTypeId);return n===r?(e.name||``).localeCompare(t.name||``,`ko`):n-r})}),r.items.length>0?[...t,r]:t}function ue(e){let t=R(e.totalG,e.meatTypeId),n=f===`admin`||f===`office`,r=e.meatTypeId||e.name,i=!w.has(r),a=[...e.lots||[]].sort((e,t)=>{let n=String(e.incomingDate||e.processedDate||e.repackedDate||``),r=String(t.incomingDate||t.processedDate||t.repackedDate||``);return n.localeCompare(r)});return`
    <div class="stock-summary-cell" data-meat-type-id="${e.meatTypeId||``}" data-summary-id="${B(r)}" style="min-width:0;border:1px solid #e8e8e8;border-radius:5px;padding:0;background:#fff;overflow:hidden;">
      <div class="stock-summary-main" style="display:flex;align-items:center;gap:4px;min-width:0;padding:3px 5px;cursor:pointer;">
        ${n?`<span class="stock-summary-drag-handle" style="cursor:grab;color:#bbb;font-size:11px;flex-shrink:0;">::</span>`:``}
        <span style="color:#888;font-size:11px;flex-shrink:0;width:10px;text-align:center;">${i?`-`:`+`}</span>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">${B(e.name)}</span>
        <b style="color:${t};font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${(e.totalG/1e3).toFixed(2)}kg</b>
      </div>
      ${i?`
        <div class="stock-summary-lots" style="border-top:1px solid #eee;background:#fafafa;padding:4px 5px;display:flex;flex-direction:column;gap:3px;">
          ${a.map(t=>{let n=t.incomingDate||t.processedDate||t.repackedDate||`-`,r=t.remaining<0?`#e53e3e`:`#333`;return`
              <div style="border:1px solid #ececec;border-radius:4px;background:#fff;padding:4px;">
                <div style="display:flex;align-items:center;gap:5px;">
                  <span style="color:#777;font-size:11px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${B(n)}</span>
                  <b style="color:${r};font-size:11px;white-space:nowrap;">${(Number(t.remaining||0)/1e3).toFixed(2)}kg</b>
                  <button class="btn-adjust" data-id="${t.id}" data-name="${B(t.meatNameSnapshot||e.name||``)}" data-remaining="${t.remaining}" style="padding:1px 6px;font-size:11px;">&#51312;&#51221;</button>
                </div>
              </div>
            `}).join(``)}
        </div>
      `:``}
    </div>
  `}function H(e){let t=le(z(e)),n=f===`admin`||f===`office`;return`
    <div class="stock-summary-wrap" style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:13px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <div style="color:#666;font-weight:600;">원료별 합계</div>
        ${n?`<button type="button" class="btn-secondary" id="btnMeatStockCategories" style="padding:4px 8px;font-size:12px;">카테고리 관리</button>`:``}
      </div>
      <div class="stock-summary-columns" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">
        ${t.map(e=>`
          <div class="stock-summary-category-column" data-category-id="${e.id}" data-virtual="${e.virtual?`true`:`false`}"
               style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">
            <div class="stock-summary-category-header" style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;">
              ${n&&!e.virtual?`<span class="stock-summary-category-handle" style="cursor:grab;color:#aaa;">⠿</span>`:``}
              <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${B(e.name)}</span>
              <span style="font-size:11px;color:#888;">${e.items.length}</span>
            </div>
            <div class="stock-summary-category-items" data-category-id="${e.id}" style="display:flex;flex-direction:column;gap:4px;min-height:28px;padding:5px;">
              ${e.items.length===0?`<div class="stock-summary-empty" style="font-size:11px;color:#bbb;padding:3px 2px;">비어 있음</div>`:e.items.map(ue).join(``)}
            </div>
          </div>
        `).join(``)}
      </div>
    </div>
  `}function U(e,t={}){return``}function W(e){if(e?.timestamp?.toMillis)return e.timestamp.toMillis();let t=e?.timestamp instanceof Date?e.timestamp.getTime():new Date(e?.timestamp||0).getTime();return Number.isFinite(t)?t:0}function de(e){return e.meatTypeId||`name:`+(e.meatNameSnapshot||`-`)}function fe(e){let t=new Map;return(e||[]).forEach(e=>{let n=de(e);t.has(n)||t.set(n,{key:n,meatTypeId:e.meatTypeId||null,name:e.meatNameSnapshot||`-`,latestTime:0,items:[]});let r=t.get(n);r.items.push(e),r.latestTime=Math.max(r.latestTime,W(e))}),[...t.values()].map(e=>({...e,items:e.items.sort((e,t)=>W(t)-W(e))})).sort((e,t)=>{let n=V(e.meatTypeId),r=V(t.meatTypeId);if(n!==r)return n-r;let i=(e.name||``).localeCompare(t.name||``,`ko`);return i===0?t.latestTime-e.latestTime:i})}function pe(e){let t=A().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return(e||[]).forEach(e=>{let t=e.meatTypeId?ce(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>W(t)-W(e))}),r.items.length>0?[...t,r]:t}function me(e,t){return`<div style="border:1px solid #ececec;border-radius:5px;background:#fff;padding:4px 5px;"><div style="display:flex;align-items:center;gap:5px;min-width:0;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">`+B(e.meatNameSnapshot||t||`-`)+`</span><span style="color:#777;font-size:11px;white-space:nowrap;">`+B(F(e.timestamp))+`</span><b style="color:`+(e.delta<0?`#e53e3e`:`#2d7a3a`)+`;font-size:12px;white-space:nowrap;">`+I(e.delta)+`</b></div><div style="display:flex;justify-content:space-between;gap:6px;margin-top:2px;color:#777;font-size:11px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">`+B(e.staff||`-`)+` / `+B(e.reason||`-`)+`</span><span style="white-space:nowrap;">`+B(P(e.type))+`</span></div></div>`}function he(e,t){let n=[b,e.id,t.key].join(`:`),r=T.has(n);return`<div class="meat-log-type-group" style="border:1px solid #ececec;border-radius:5px;background:#fff;overflow:hidden;"><button type="button" class="meat-log-type-toggle" data-log-type-id="`+B(n)+`" style="width:100%;border:0;background:#fff;display:flex;align-items:center;gap:5px;padding:5px 6px;cursor:pointer;text-align:left;"><span style="color:#888;font-size:11px;width:10px;text-align:center;flex-shrink:0;">`+(r?`-`:`+`)+`</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;font-size:12px;font-weight:700;flex:1;">`+B(t.name)+`</span><span style="color:#888;font-size:11px;white-space:nowrap;">`+t.items.length+`&#44148;</span></button>`+(r?`<div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid #eee;background:#fafafa;padding:4px;">`+t.items.map(e=>me(e,t.name)).join(``)+`</div>`:``)+`</div>`}function G(e){if(!e||e.length===0)return`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`;let t=pe(e).filter(e=>e.items.length>0);return t.length===0?`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`:`<div class="meat-log-group-wrap" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">`+t.map(e=>{let t=fe(e.items);return`<div class="meat-log-group" style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;"><div style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">`+B(e.name)+`</span><span style="font-size:11px;color:#888;">`+e.items.length+`</span></div><div style="display:flex;flex-direction:column;gap:4px;padding:5px;">`+t.map(t=>he(e,t)).join(``)+`</div></div>`}).join(``)+`</div>`}function ge(){document.querySelectorAll(`.meat-log-type-toggle`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logTypeId;t&&(T.has(t)?T.delete(t):T.add(t),K(b))})})}function _e(){[...S,C].filter(Boolean).forEach(e=>{try{e.destroy()}catch(e){console.warn(`[meat] stock summary sortable destroy skipped:`,e)}}),S=[],C=null}async function ve(){let e=o(d),t=new Date,n=new Map;document.querySelectorAll(`.stock-summary-category-items`).forEach(i=>{let a=i.dataset.categoryId===`__other__`?null:i.dataset.categoryId;Array.from(i.querySelectorAll(`.stock-summary-cell[data-meat-type-id]`)).forEach((i,o)=>{let s=i.dataset.meatTypeId;s&&(e.update(r(d,`meatTypes`,s),{groupId:a,groupSortOrder:o,updatedAt:t}),n.set(s,{groupId:a,groupSortOrder:o,updatedAt:t}))})}),await e.commit(),v=await E(),await K(b)}async function ye(){let e=k(),t=Array.from(document.querySelectorAll(`.stock-summary-category-column[data-virtual="false"]`)).map(e=>e.dataset.categoryId).filter(Boolean),n=new Map(t.map((e,t)=>[e,t]));await O(y.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)))}function be(){_e();let e=f===`admin`||f===`office`;if(document.getElementById(`btnMeatStockCategories`)?.addEventListener(`click`,()=>J()),document.querySelectorAll(`.stock-summary-main`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.stock-summary-drag-handle`))return;let n=e.closest(`.stock-summary-cell`)?.dataset.summaryId;n&&(w.has(n)?w.delete(n):w.add(n),K(b))})}),!e)return;let t=document.querySelector(`.stock-summary-columns`);t&&(C=g.create(t,{animation:150,handle:`.stock-summary-category-handle`,draggable:`.stock-summary-category-column[data-virtual="false"]`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await ye()}catch(e){console.error(`[meat] stock category order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),y=await D(),K(b)}}})),document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let t=g.create(e,{group:`meatStockShared`,animation:150,handle:`.stock-summary-drag-handle`,draggable:`.stock-summary-cell`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await ve()}catch(e){console.error(`[meat] stock group save failed:`,e),alert(`원료 카테고리 저장 실패: `+(e.message||e)),v=await E(),K(b)}}});S.push(t)})}function xe(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원료 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${b===`frozen`?`active`:``}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${b===`processed`?`active`:``}" data-tab="processed">전처리</button>
          <button class="tab-btn ${b===`repacked`?`active`:``}" data-tab="repacked">재포장</button>
          <button class="tab-btn ${b===`produce`?`active`:``}" data-tab="produce">채소/과일</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{b=e.dataset.tab,document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),K(b)})}),K(b)}async function K(e){let t=document.getElementById(`tabContent`);t.innerHTML=`<div style="padding:24px;"><p>로딩 중...</p></div>`;let n=e===`produce`?`frozen`:e,[r,i]=await Promise.all([L(n),oe(n)]);!t.isConnected||e!==b||(e===`frozen`?Se(r,i):e===`processed`?we(r,i):e===`produce`?Ce(r,i):Te(r,i),be(),ge())}function Se(e,t){let n=document.getElementById(`tabContent`),r=f===`admin`||f===`office`,i=e.filter(ne),a=t.filter(ie),o=z(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${H(i)}
      ${U(i,{emptyText:`등록된 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,typeTotals:o,useTypeColor:!0})}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${i.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>`:i.map(e=>{let t=R(o.get(e.meatTypeId||e.meatNameSnapshot||e.id)?.totalG??e.remaining,e.meatTypeId);return`
                <tr>
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.incomingDate||`-`}</td>
                  <td style="font-weight:600;color:${t}">${(e.remaining/1e3).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>`}).join(``)}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      ${G(a)}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${a.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:a.map(e=>`
                <tr>
                  <td>${F(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${P(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${I(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddFrozen`).addEventListener(`click`,()=>Ee()),document.getElementById(`btnMeatTypes`)?.addEventListener(`click`,()=>{if(f!==`admin`&&f!==`office`){alert(`원육 종류 관리는 대표/사무실 계정만 가능합니다.`);return}Y()}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ce(e,t){let n=document.getElementById(`tabContent`),r=f===`admin`||f===`office`,i=e.filter(re),a=t.filter(ae),o=z(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProduce">+ 채소/과일 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnProduceTypes">채소/과일 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${H(i)}
      ${U(i,{emptyText:`등록된 채소/과일 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,showInitial:!0,showStaffNote:!0,typeTotals:o,useTypeColor:!0})}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>입고일</th>
              <th>초기량</th>
              <th>잔량</th>
              <th>담당</th>
              <th>비고</th>
              <th>조정</th>
            </tr>
          </thead>
          <tbody>
            ${i.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">등록된 채소/과일 재고 없음</td></tr>`:i.map(e=>{let t=R(o.get(e.meatTypeId||e.meatNameSnapshot||e.id)?.totalG??e.remaining,e.meatTypeId);return`
                <tr>
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.incomingDate||`-`}</td>
                  <td>${((e.initialQtyG||0)/1e3).toFixed(2)}kg</td>
                  <td style="font-weight:600;color:${t}">${(e.remaining/1e3).toFixed(2)}kg</td>
                  <td>${e.staffName||`-`}</td>
                  <td>${e.note||`-`}</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>`}).join(``)}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      ${G(a)}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${a.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:a.map(e=>`
                <tr>
                  <td>${F(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${P(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${I(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddProduce`).addEventListener(`click`,()=>{Ee({categoryFilter:`produce`,title:`채소/과일 입고 등록`,returnTab:`produce`})}),document.getElementById(`btnProduceTypes`)?.addEventListener(`click`,()=>{if(f!==`admin`&&f!==`office`){alert(`채소/과일 종류 관리는 대표/사무실 계정만 가능합니다.`);return}Y({categoryFilter:`produce`})}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function we(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${H(e)}
      ${U(e,{emptyText:`등록된 전처리 재고 없음`,dateField:`processedDate`,dateLabel:`작업일`})}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 전처리 재고 없음</td></tr>`:e.map(e=>`
                <tr style="background:${e.batchColor||`white`}11">
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.processedDate||`-`}</td>
                  <td style="font-weight:600;color:${e.remaining<0?`#e53e3e`:`#1a1a1a`}">${(e.remaining/1e3).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      ${G(t)}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${t.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:t.map(e=>`
                <tr>
                  <td>${F(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${P(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${I(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddProcessed`).addEventListener(`click`,De),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Te(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${H(e)}
      ${U(e,{emptyText:`등록된 재포장 재고 없음`,dateField:`repackedDate`,dateLabel:`작업일`})}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>원육명</th>
              <th>작업일</th>
              <th>잔량</th>
              <th>수동조정</th>
            </tr>
          </thead>
          <tbody>
            ${e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재포장 재고 없음</td></tr>`:e.map(e=>`
                <tr style="background:${e.batchColor||`white`}11">
                  <td>${e.meatNameSnapshot}</td>
                  <td>${e.repackedDate||`-`}</td>
                  <td style="font-weight:600;color:${e.remaining<0?`#e53e3e`:`#1a1a1a`}">${(e.remaining/1e3).toFixed(2)}kg</td>
                  <td><button class="btn-adjust" data-id="${e.id}" data-name="${e.meatNameSnapshot}" data-remaining="${e.remaining}">조정</button></td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      ${G(t)}
      <div class="table-wrap" style="display:none;">
        <table class="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>원료명</th>
              <th>구분</th>
              <th>수량</th>
              <th>담당자</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            ${t.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:t.map(e=>`
                <tr>
                  <td>${F(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${P(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${I(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddRepacked`).addEventListener(`click`,Oe),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ee(e={}){let{categoryFilter:t=`meat`,title:n=t===`produce`?`채소/과일 입고 등록`:`원육 입고 등록`,returnTab:r=`frozen`}=e,a=t===`produce`?`채소/과일`:`원육`;$(`
    <h3 class="modal-title">${n}</h3>
    <div class="form-group">
      <label>${a} 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${j().filter(e=>t===`produce`?e.category===`produce`:(e.category||`meat`)===`meat`).map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>중량 *</label>
        <input type="number" id="m_weight" placeholder="중량" />
      </div>
      <div class="form-group">
        <label>단위</label>
        <select id="m_unit">
          <option value="kg">kg</option>
          <option value="g">g</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>입고일</label>
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozen">추가</button>
    </div>
  `),document.getElementById(`btnSaveFrozen`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),n=t.options[t.selectedIndex]?.text,o=parseFloat(document.getElementById(`m_weight`).value),c=document.getElementById(`m_unit`).value,l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,f=document.getElementById(`m_note`).value;if(!e||!o||!l){alert(`${a} 종류, 중량, 날짜는 필수입니다.`);return}if(!(o>0)){alert(`중량은 0보다 커야 합니다.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}if(await h(l))return;let p=c===`kg`?o*1e3:o,g=await s(i(d,`meatStocks`),{meatTypeId:e,meatNameSnapshot:n,stage:`frozen`,incomingDate:l,initialQtyG:p,remaining:p,staffName:u,note:f,closed:!1,createdAt:new Date,updatedAt:new Date});await _({type:`frozenIncoming`,date:l,meatTypeId:e,meatNameSnapshot:n,stage:`frozen`,meatStockId:g.id,delta:p,before:0,after:p,staff:u,reason:f||null}),await m({action:`meat`,subAction:`incoming`,date:l,staff:u,message:`${a} 입고 (냉동창고) - ${n} +${(p/1e3).toFixed(1)}kg / 담당: ${u}`,details:{meatStockId:g.id,meatTypeId:e,meatName:n,stage:`frozen`,qtyG:p,note:f||null}}),closeModal(),K(r),alert(`입고 등록 완료!`)})}function De(){$(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${j().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>전처리일</label>
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProcessed">추가</button>
    </div>
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveProcessed`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),a=t.options[t.selectedIndex]?.text,o=parseFloat(document.getElementById(`m_unitWeight`).value),c=parseInt(document.getElementById(`m_count`).value),l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,f=document.getElementById(`m_note`).value;if(!e||!o||!c||!l){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(o>0)||!(c>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}if(await h(l))return;let p=o*c,m=(await L(`frozen`)).filter(t=>t.meatTypeId===e&&t.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``)),g=m.reduce((e,t)=>e+t.remaining,0);if(g<p){alert(`냉동창고 잔량이 부족합니다.\n${a}: 필요 ${(p/1e3).toFixed(1)}kg / 현재 ${(g/1e3).toFixed(1)}kg`);return}let v=Date.now().toString(),y=Ne(),b=p;for(let t of m){if(b<=0)break;let i=Math.min(t.remaining,b),o=t.remaining-i;await n(r(d,`meatStocks`,t.id),{remaining:o,closed:o===0,updatedAt:new Date}),await _({type:`frozenOut`,date:l,meatTypeId:e,meatNameSnapshot:a,stage:`frozen`,meatStockId:t.id,delta:-i,before:t.remaining,after:o,staff:u,reason:`전처리 등록 자동차감`,batchId:v}),b-=i}await _({type:`processedIn`,date:l,meatTypeId:e,meatNameSnapshot:a,stage:`processed`,meatStockId:(await s(i(d,`meatStocks`),{meatTypeId:e,meatNameSnapshot:a,stage:`processed`,incomingDate:l,processedDate:l,unitWeightG:o,unitCount:c,initialQtyG:p,remaining:p,batchId:v,batchColor:y,staffName:u,note:f,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:p,before:0,after:p,staff:u,reason:f||null,batchId:v}),closeModal(),K(`processed`),alert(`전처리 등록 완료!`)})}function Oe(){$(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${j().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>개당 중량(g) *</label>
        <input type="number" id="m_unitWeight" placeholder="g" />
      </div>
      <div class="form-group">
        <label>개수 *</label>
        <input type="number" id="m_count" placeholder="개수" />
      </div>
    </div>
    <div class="form-group">
      <label>재포장일</label>
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`lead`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveRepacked">추가</button>
    </div>
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveRepacked`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),a=t.options[t.selectedIndex]?.text,o=parseFloat(document.getElementById(`m_unitWeight`).value),c=parseInt(document.getElementById(`m_count`).value),l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,f=document.getElementById(`m_note`).value;if(!e||!o||!c||!l){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(o>0)||!(c>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}if(await h(l))return;let p=o*c,m=(await L(`repacked`)).find(t=>t.meatTypeId===e&&t.remaining>0);if(m){alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${a}: 기존 잔량 ${(m.remaining/1e3).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);return}let g=(await L(`processed`)).filter(t=>t.meatTypeId===e&&t.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)),v=g.reduce((e,t)=>e+t.remaining,0);if(v<p){alert(`전처리 잔량이 부족합니다.\n${a}: 필요 ${(p/1e3).toFixed(1)}kg / 현재 ${(v/1e3).toFixed(1)}kg`);return}let y=Date.now().toString(),b=Ne(),x=p;for(let t of g){if(x<=0)break;let i=Math.min(t.remaining,x),o=t.remaining-i;await n(r(d,`meatStocks`,t.id),{remaining:o,closed:o===0,updatedAt:new Date}),await _({type:`processedOut`,date:l,meatTypeId:e,meatNameSnapshot:a,stage:`processed`,meatStockId:t.id,delta:-i,before:t.remaining,after:o,staff:u,reason:`재포장 등록 자동차감`,batchId:y}),x-=i}await _({type:`repackedIn`,date:l,meatTypeId:e,meatNameSnapshot:a,stage:`repacked`,meatStockId:(await s(i(d,`meatStocks`),{meatTypeId:e,meatNameSnapshot:a,stage:`repacked`,incomingDate:l,repackedDate:l,unitWeightG:o,unitCount:c,initialQtyG:p,remaining:p,batchId:y,batchColor:b,staffName:u,note:f,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:p,before:0,after:p,staff:u,reason:f||null,batchId:y}),closeModal(),K(`repacked`),alert(`재포장 등록 완료!`)})}function q(e,t,i){$(`
    <h3 class="modal-title">수동 재고 조정 — ${t}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">기존 잔량: <strong>${(i/1e3).toFixed(1)}kg</strong> (${i}g)</p>
    <div class="form-group">
      <label>실제 잔량 (g) *</label>
      <input type="number" id="m_actualRemaining" placeholder="실제 잔량(g) 입력" min="0" step="1" />
      <p style="font-size:11px;color:#aaa;margin-top:4px;">실제로 남아있는 양을 g 단위로 입력하세요. 0 이상만 가능.</p>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_adjustReason" placeholder="조정 사유 입력" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let o=document.getElementById(`m_actualRemaining`).value,s=document.getElementById(`m_adjustReason`).value.trim(),c=document.getElementById(`m_staff`).value;if(o===``||isNaN(parseFloat(o))){alert(`실제 잔량을 입력해주세요.`);return}let l=parseFloat(o);if(l<0){alert(`실제 잔량은 0 이상이어야 합니다.
잔량이 음수가 될 수 없습니다.`);return}if(!s||!c){alert(`사유와 담당자는 필수입니다.`);return}let u=l-i;if(u===0){alert(`기존 잔량과 동일합니다. 변경할 값을 입력해주세요.`);return}let f=p();if(await h(f))return;let g=await a(r(d,`meatStocks`,e)),v=(g.exists()?g.data():{}).meatTypeId||null;await n(r(d,`meatStocks`,e),{remaining:l,closed:l===0,updatedAt:new Date});let y=b===`produce`?`frozen`:b,x=b===`frozen`?`냉동창고`:b===`processed`?`전처리`:b===`produce`?`채소/과일`:`재포장`;await m({action:`meat`,subAction:`adjust`,date:f,staff:c,message:`원육 수동조정 (${x}) — ${t} ${(i/1e3).toFixed(1)}kg → ${(l/1e3).toFixed(1)}kg / 사유: ${s} / 담당: ${c}`,details:{meatStockId:e,meatName:t,stage:x,delta:u,before:i,after:l,reason:s}}),await _({type:`adjust`,date:f,meatTypeId:v,meatNameSnapshot:t,stage:y,meatStockId:e,delta:u,before:i,after:l,staff:c,reason:s}),closeModal(),K(b),alert(`조정 완료!`)})}function ke(){let e=A();return e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">등록된 카테고리 없음</td></tr>`:e.map(e=>{let t=v.filter(t=>t.groupId===e.id).length;return`
      <tr data-id="${e.id}">
        <td class="master-table-drag-cell">
          <span class="drag-handle" title="순서 변경" aria-label="순서 변경">⠿</span>
        </td>
        <td>
          <input type="text" class="stock-category-name" data-id="${e.id}" value="${B(e.name)}"
                 style="width:100%;padding:5px 6px;" />
        </td>
        <td style="text-align:right;color:#666;">${t}</td>
        <td>
          <button type="button" class="btn-secondary btn-delete-stock-category" data-id="${e.id}">삭제</button>
        </td>
      </tr>
    `}).join(``)}async function Ae(){v=await E(),y=await D(),await K(b),J()}function J(){if(f!==`admin`&&f!==`office`){alert(`카테고리 관리는 대표/사무실 계정만 가능합니다.`);return}$(`
    <h3 class="modal-title">원료 잔량표 카테고리 관리</h3>
    <div class="table-wrap" style="margin-bottom:14px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>카테고리명</th>
            <th style="text-align:right;">원료 수</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody id="meatStockCategoryList">
          ${ke()}
        </tbody>
      </table>
    </div>
    <div style="background:#f9f9f9;border-radius:6px;padding:12px;border:1px solid #eee;">
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;">새 카테고리</label>
      <div style="display:flex;gap:8px;">
        <input type="text" id="newStockCategoryName" placeholder="예: 닭 / 오리 / 생선" style="flex:1;" />
        <button type="button" class="btn-primary" id="btnAddStockCategory">추가</button>
      </div>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);let e=k(),t=A(e),n=document.getElementById(`meatStockCategoryList`);n&&t.length>0&&g.create(n,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{let t=Array.from(n.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id),r=new Map(t.map((e,t)=>[e,t]));try{await O(y.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:r.has(t.id)?r.get(t.id):t.sortOrder}:t)),await K(b)}catch(e){console.error(`[meat] stock category modal order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),y=await D(),J()}}}),document.querySelectorAll(`.stock-category-name`).forEach(e=>{e.addEventListener(`change`,async e=>{let n=e.target.dataset.id,r=e.target.value.trim(),i=t.find(e=>e.id===n);if(i){if(!r){alert(`카테고리명을 입력해주세요.`),e.target.value=i.name;return}try{await O(y.map(e=>e.id===n?{...e,name:r}:e)),await K(b)}catch(t){console.error(`[meat] stock category rename failed:`,t),alert(`카테고리명 저장 실패: `+(t.message||t)),e.target.value=i.name}}})}),document.getElementById(`btnAddStockCategory`)?.addEventListener(`click`,async()=>{let n=document.getElementById(`newStockCategoryName`).value.trim();if(!n){alert(`카테고리명을 입력해주세요.`);return}let r=[...y,{id:se(),name:n,sortOrder:t.length,scope:e}];try{await O(r),await Ae()}catch(e){console.error(`[meat] stock category add failed:`,e),alert(`카테고리 추가 실패: `+(e.message||e))}}),document.querySelectorAll(`.btn-delete-stock-category`).forEach(e=>{e.addEventListener(`click`,async()=>{let n=e.dataset.id;if(t.find(e=>e.id===n))try{let e=new Date,t=o(d);v.filter(e=>e.groupId===n).forEach(n=>{t.update(r(d,`meatTypes`,n.id),{groupId:null,groupSortOrder:0,updatedAt:e})}),await t.commit(),await O(y.filter(e=>e.id!==n)),await Ae()}catch(e){console.error(`[meat] stock category delete failed:`,e),alert(`카테고리 삭제 실패: `+(e.message||e))}})})}function Y(e={}){let{categoryFilter:t=null}=e,a=t||`meat`,o=a===`meat`&&(f===`admin`||f===`office`),c=v.filter(e=>M(e.id)===a),l=a===`produce`,u=l?`채소/과일`:`원육`,h=l?`채소/과일 종류 관리`:`원육 종류 관리`,g=l?`g`:`kg`;$(`
    <h3 class="modal-title">${h}</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>${u}명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(${g})</th>
            <th>\uD65C\uC131</th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${c.map(e=>{let t=e.active!==!1,n=l?e.minimumQtyG||0:((e.minimumQtyG||0)/1e3).toFixed(1);return`
              <tr class="${t?``:`inactive-master`}" data-id="${e.id}">
                <td class="master-table-drag-cell">
                  ${o?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
                </td>
                <td>
                  ${e.name}
                  ${t?``:`<span class="tag tag-inactive" style="margin-left:6px;">비활성</span>`}
                </td>
                <td>
                  <input type="number" class="m-unit-weight" data-id="${e.id}"
                         value="${e.defaultUnitWeightG}" min="1" step="any"
                         style="width:70px;padding:3px 4px;text-align:right;" />
                </td>
                <td>
                  <input type="number" class="m-min-qty" data-id="${e.id}"
                         value="${n}" min="0" step="any"
                         style="width:70px;padding:3px 4px;text-align:right;" />
                </td>
                <td>
                  <label class="toggle-switch" title="${t?`활성`:`비활성`}">
                    <input type="checkbox" class="m-active-toggle" data-id="${e.id}" ${t?`checked`:``}>
                    <span class="toggle-slider"></span>
                  </label>
                </td>
              </tr>
            `}).join(``)}
        </tbody>
      </table>
    </div>
    <div style="background:#f9f9f9;border-radius:6px;padding:14px;border:1px solid #eee;">
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 ${u} 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>${u}명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(${g})</label>
          <input type="number" id="m_newMinQty" placeholder="${l?`예: 500`:`예: 5`}" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),je();let _=window.closeModal;window.closeModal=function(){X(),_?.(),window.closeModal=_},document.querySelectorAll(`.m-unit-weight`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,i=v.find(e=>e.id===t),a=i?.defaultUnitWeightG,o=parseFloat(e.target.value);if(!isFinite(o)||o<=0){alert(`기본 단위중량은 양수(g)여야 합니다.`),e.target.value=a??``;return}try{await n(r(d,`meatTypes`,t),{defaultUnitWeightG:o,updatedAt:new Date}),i&&(i.defaultUnitWeightG=o)}catch(t){console.error(`[meat] defaultUnitWeightG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=a??``}})}),document.querySelectorAll(`.m-min-qty`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,i=v.find(e=>e.id===t),a=i?.minimumQtyG??0,o=parseFloat(e.target.value);if(!isFinite(o)||o<0){alert(`최소재고는 0 이상(${g})이어야 합니다.`),e.target.value=l?a:(a/1e3).toFixed(1);return}let s=Math.round(l?o:o*1e3);try{await n(r(d,`meatTypes`,t),{minimumQtyG:s,updatedAt:new Date}),i&&(i.minimumQtyG=s)}catch(t){console.error(`[meat] minimumQtyG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=l?a:(a/1e3).toFixed(1)}})}),document.querySelectorAll(`.m-active-toggle`).forEach(t=>{t.addEventListener(`change`,async t=>{let i=t.target.dataset.id,a=t.target.checked,o=v.find(e=>e.id===i),s=o?.active!==!1;try{await n(r(d,`meatTypes`,i),{active:a,updatedAt:new Date}),o&&(o.active=a),s!==a&&await m({action:`meat`,subAction:`activeToggle`,date:p(),staff:Fe(),message:`Meat type ${a?`active`:`inactive`} — ${o?.name||i}`,details:{meatTypeId:i,meatName:o?.name||``,active:a}}),closeModal(),Y(e)}catch(e){console.error(`[meat] active save failed:`,e),alert(`Save failed: `+(e.message||e)),t.target.checked=!a}})}),document.getElementById(`btnAddMeatType`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_newMeatName`).value.trim(),n=parseFloat(document.getElementById(`m_newUnitWeight`).value)||0,r=parseFloat(document.getElementById(`m_newMinQty`).value)||0,o=a;if(!t){alert(`${u}명은 필수입니다.`);return}await s(i(d,`meatTypes`),{name:t,defaultUnitWeightG:n,minimumQtyG:Math.round(l?r:r*1e3),category:o,sortOrder:v.length,active:!0,showInStats:!0,createdAt:new Date,updatedAt:new Date}),v=await E(),closeModal(),Y(e)})}function je(){if(X(),f!==`admin`&&f!==`office`)return;let e=document.getElementById(`meatTypesList`);e&&(x=g.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await Me()}}))}function X(){if(x){try{x.destroy()}catch(e){console.warn(`[meat] sortable destroy skipped:`,e)}x=null}}async function Me(){let e=document.getElementById(`meatTypesList`);if(!e)return;let t=Array.from(e.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id).filter(Boolean),n=new Date,i=o(d);t.forEach((e,t)=>{i.update(r(d,`meatTypes`,e),{sortOrder:t,updatedAt:n})});try{await i.commit();let e=new Map(t.map((e,t)=>[e,t]));v=v.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:n}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){console.error(`[meat] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),v=await E(),closeModal(),Y()}}function Ne(){let e=[`#e8f4ea`,`#e8eef8`,`#fef0e8`,`#f0e8fe`,`#fff0e8`,`#e8f8f4`];return e[Math.floor(Math.random()*e.length)]}var Z={};async function Pe(){Object.keys(Z).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await a(r(d,`staffGroups`,e));t.exists()&&(Z[e]=t.data().members||[])}))}function Fe(){return f===`admin`?`대표`:f===`office`?`사무실`:f===`production`?`생산실`:`시스템`}function Q(e){let t=``;for(let n of e)(Z[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};export{ee as renderMeat};