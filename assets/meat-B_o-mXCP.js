import{_ as e,b as t,d as n,g as r,h as i,i as a,n as o,o as s,p as c,u as l,y as u}from"./index.esm-rHmxwfvm.js";import{n as d}from"./firebase-qGjqjNvO.js";import{n as f}from"./modalManager-Z4b2ihO9.js";import{H as p,P as m}from"./index-ihWgJTcM.js";import{n as h}from"./activityLogs-Jg2Ymepu.js";import{t as g}from"./closingGuard-BCSnBl5U.js";import{t as _}from"./sortable-DoCboJo0.js";import{t as v}from"./meatLogs-DJmpQ7lB.js";var y=[],b=[],x=`frozen`,S=null,C=[],w=null,T=new Set,E=new Set;async function ee(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>원료 재고 로딩 중...</p></div>`;let t=await Promise.all([D(),O(),Fe()]);e.isConnected&&([y,b]=t,Se())}async function D(){return(await s(n(u(d,`meatTypes`),l(`sortOrder`)))).docs.map(e=>({id:e.id,...e.data()}))}function te(e){return(Array.isArray(e)?e:[]).map((e,t)=>({id:String(e?.id||``).trim(),name:String(e?.name||``).trim(),sortOrder:Number.isFinite(Number(e?.sortOrder))?Number(e.sortOrder):t,scope:e?.scope===`produce`?`produce`:`meat`})).filter(e=>e.id&&e.name).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)||e.name.localeCompare(t.name,`ko`))}async function O(){let e=await a(t(d,`settings`,`meatStockCategories`));return e.exists()?te(e.data().groups):[]}async function k(e){let n=te(e).map((e,t)=>({...e,sortOrder:t}));await c(t(d,`settings`,`meatStockCategories`),{groups:n,updatedAt:new Date},{merge:!0}),b=n}function A(){return x===`produce`?`produce`:`meat`}function j(e=A()){return b.filter(t=>(t.scope||`meat`)===e)}function M(){return y.filter(e=>e.active!==!1)}function ne(e){return y.find(t=>t.id===e)?.category||`meat`}function N(e){return ne(e)===`produce`}function re(e){return!N(e.meatTypeId)}function ie(e){return N(e.meatTypeId)}function ae(e){return!N(e.meatTypeId)}function oe(e){return N(e.meatTypeId)}async function se(e){return(await s(n(u(d,`meatLogs`),r(`stage`,`==`,e),l(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}function P(e){return{frozenIncoming:`입고`,frozenOut:`전처리로 출고`,processedIn:`전처리`,processedOut:`재포장으로 출고`,repackedIn:`재포장`,repackedOut:`출고`,productionDeduct:`생산차감`,productionRollback:`생산복원`,adjust:`수동조정`}[e]||e}function F(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function I(e){return typeof e==`number`?`${e>0?`+`:``}${(e/1e3).toFixed(2)}kg`:`-`}async function L(e){return(await s(n(u(d,`meatStocks`),l(`incomingDate`)))).docs.map(e=>({id:e.id,...e.data()})).filter(t=>t.stage===e&&!t.closed)}function R(e,t){let n=y.find(e=>e.id===t)?.minimumQtyG||0;return n<=0?`#1a1a1a`:e<n?`#e53e3e`:e<n*1.5?`#dd6b20`:`#1a1a1a`}function z(e){let t=new Map;return(e||[]).forEach(e=>{let n=e.meatTypeId||e.meatNameSnapshot||e.id,r=t.get(n);r?(r.totalG+=Number(e.remaining||0),r.lots.push(e)):t.set(n,{name:e.meatNameSnapshot||`원료`,totalG:Number(e.remaining||0),meatTypeId:e.meatTypeId,lots:[e]})}),t}function B(e=``){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function ce(){return`cat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}function le(e){return y.find(t=>t.id===e)?.groupId||null}function V(e){let t=y.find(t=>t.id===e)?.groupSortOrder;return Number.isFinite(Number(t))?Number(t):2**53-1}function ue(e){let t=j().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return[...e.values()].forEach(e=>{let t=e.meatTypeId?le(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>{let n=V(e.meatTypeId),r=V(t.meatTypeId);return n===r?(e.name||``).localeCompare(t.name||``,`ko`):n-r})}),r.items.length>0?[...t,r]:t}function de(e){let t=R(e.totalG,e.meatTypeId),n=p===`admin`||p===`office`,r=e.meatTypeId||e.name,i=!T.has(r),a=[...e.lots||[]].sort((e,t)=>{let n=String(e.incomingDate||e.processedDate||e.repackedDate||``),r=String(t.incomingDate||t.processedDate||t.repackedDate||``);return n.localeCompare(r)});return`
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
  `}function H(e){let t=ue(z(e)),n=p===`admin`||p===`office`;return`
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
              ${e.items.length===0?`<div class="stock-summary-empty" style="font-size:11px;color:#bbb;padding:3px 2px;">비어 있음</div>`:e.items.map(de).join(``)}
            </div>
          </div>
        `).join(``)}
      </div>
    </div>
  `}function U(e,t={}){return``}function W(e){if(e?.timestamp?.toMillis)return e.timestamp.toMillis();let t=e?.timestamp instanceof Date?e.timestamp.getTime():new Date(e?.timestamp||0).getTime();return Number.isFinite(t)?t:0}function fe(e){return e.meatTypeId||`name:`+(e.meatNameSnapshot||`-`)}function pe(e){let t=new Map;return(e||[]).forEach(e=>{let n=fe(e);t.has(n)||t.set(n,{key:n,meatTypeId:e.meatTypeId||null,name:e.meatNameSnapshot||`-`,latestTime:0,items:[]});let r=t.get(n);r.items.push(e),r.latestTime=Math.max(r.latestTime,W(e))}),[...t.values()].map(e=>({...e,items:e.items.sort((e,t)=>W(t)-W(e))})).sort((e,t)=>{let n=V(e.meatTypeId),r=V(t.meatTypeId);if(n!==r)return n-r;let i=(e.name||``).localeCompare(t.name||``,`ko`);return i===0?t.latestTime-e.latestTime:i})}function me(e){let t=j().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return(e||[]).forEach(e=>{let t=e.meatTypeId?le(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>W(t)-W(e))}),r.items.length>0?[...t,r]:t}function he(e,t){return`<div style="border:1px solid #ececec;border-radius:5px;background:#fff;padding:4px 5px;"><div style="display:flex;align-items:center;gap:5px;min-width:0;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">`+B(e.meatNameSnapshot||t||`-`)+`</span><span style="color:#777;font-size:11px;white-space:nowrap;">`+B(F(e.timestamp))+`</span><b style="color:`+(e.delta<0?`#e53e3e`:`#2d7a3a`)+`;font-size:12px;white-space:nowrap;">`+I(e.delta)+`</b></div><div style="display:flex;justify-content:space-between;gap:6px;margin-top:2px;color:#777;font-size:11px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">`+B(e.staff||`-`)+` / `+B(e.reason||`-`)+`</span><span style="white-space:nowrap;">`+B(P(e.type))+`</span></div></div>`}function ge(e,t){let n=[x,e.id,t.key].join(`:`),r=E.has(n);return`<div class="meat-log-type-group" style="border:1px solid #ececec;border-radius:5px;background:#fff;overflow:hidden;"><button type="button" class="meat-log-type-toggle" data-log-type-id="`+B(n)+`" style="width:100%;border:0;background:#fff;display:flex;align-items:center;gap:5px;padding:5px 6px;cursor:pointer;text-align:left;"><span style="color:#888;font-size:11px;width:10px;text-align:center;flex-shrink:0;">`+(r?`-`:`+`)+`</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;font-size:12px;font-weight:700;flex:1;">`+B(t.name)+`</span><span style="color:#888;font-size:11px;white-space:nowrap;">`+t.items.length+`&#44148;</span></button>`+(r?`<div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid #eee;background:#fafafa;padding:4px;">`+t.items.map(e=>he(e,t.name)).join(``)+`</div>`:``)+`</div>`}function G(e){if(!e||e.length===0)return`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`;let t=me(e).filter(e=>e.items.length>0);return t.length===0?`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`:`<div class="meat-log-group-wrap" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">`+t.map(e=>{let t=pe(e.items);return`<div class="meat-log-group" style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;"><div style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">`+B(e.name)+`</span><span style="font-size:11px;color:#888;">`+e.items.length+`</span></div><div style="display:flex;flex-direction:column;gap:4px;padding:5px;">`+t.map(t=>ge(e,t)).join(``)+`</div></div>`}).join(``)+`</div>`}function _e(){document.querySelectorAll(`.meat-log-type-toggle`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logTypeId;t&&(E.has(t)?E.delete(t):E.add(t),K(x))})})}function ve(){[...C,w].filter(Boolean).forEach(e=>{try{e.destroy()}catch(e){console.warn(`[meat] stock summary sortable destroy skipped:`,e)}}),C=[],w=null}async function ye(){let n=e(d),r=new Date,i=new Map;document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let a=e.dataset.categoryId===`__other__`?null:e.dataset.categoryId;Array.from(e.querySelectorAll(`.stock-summary-cell[data-meat-type-id]`)).forEach((e,o)=>{let s=e.dataset.meatTypeId;s&&(n.update(t(d,`meatTypes`,s),{groupId:a,groupSortOrder:o,updatedAt:r}),i.set(s,{groupId:a,groupSortOrder:o,updatedAt:r}))})}),await n.commit(),y=await D(),await K(x)}async function be(){let e=A(),t=Array.from(document.querySelectorAll(`.stock-summary-category-column[data-virtual="false"]`)).map(e=>e.dataset.categoryId).filter(Boolean),n=new Map(t.map((e,t)=>[e,t]));await k(b.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)))}function xe(){ve();let e=p===`admin`||p===`office`;if(document.getElementById(`btnMeatStockCategories`)?.addEventListener(`click`,()=>J()),document.querySelectorAll(`.stock-summary-main`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.stock-summary-drag-handle`))return;let n=e.closest(`.stock-summary-cell`)?.dataset.summaryId;n&&(T.has(n)?T.delete(n):T.add(n),K(x))})}),!e)return;let t=document.querySelector(`.stock-summary-columns`);t&&(w=_.create(t,{animation:150,handle:`.stock-summary-category-handle`,draggable:`.stock-summary-category-column[data-virtual="false"]`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await be()}catch(e){console.error(`[meat] stock category order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),b=await O(),K(x)}}})),document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let t=_.create(e,{group:`meatStockShared`,animation:150,handle:`.stock-summary-drag-handle`,draggable:`.stock-summary-cell`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await ye()}catch(e){console.error(`[meat] stock group save failed:`,e),alert(`원료 카테고리 저장 실패: `+(e.message||e)),y=await D(),K(x)}}});C.push(t)})}function Se(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원료 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${x===`frozen`?`active`:``}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${x===`processed`?`active`:``}" data-tab="processed">전처리</button>
          <button class="tab-btn ${x===`repacked`?`active`:``}" data-tab="repacked">재포장</button>
          <button class="tab-btn ${x===`produce`?`active`:``}" data-tab="produce">채소/과일</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{x=e.dataset.tab,document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),K(x)})}),K(x)}async function K(e){let t=document.getElementById(`tabContent`);t.innerHTML=`<div style="padding:24px;"><p>로딩 중...</p></div>`;let n=e===`produce`?`frozen`:e,[r,i]=await Promise.all([L(n),se(n)]);!t.isConnected||e!==x||(e===`frozen`?Ce(r,i):e===`processed`?Te(r,i):e===`produce`?we(r,i):Ee(r,i),xe(),_e())}function Ce(e,t){let n=document.getElementById(`tabContent`),r=p===`admin`||p===`office`,i=e.filter(re),a=t.filter(ae),o=z(i);n.innerHTML=`
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
  `,document.getElementById(`btnAddFrozen`).addEventListener(`click`,()=>De()),document.getElementById(`btnMeatTypes`)?.addEventListener(`click`,()=>{if(p!==`admin`&&p!==`office`){alert(`원육 종류 관리는 대표/사무실 계정만 가능합니다.`);return}Y()}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function we(e,t){let n=document.getElementById(`tabContent`),r=p===`admin`||p===`office`,i=e.filter(ie),a=t.filter(oe),o=z(i);n.innerHTML=`
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
  `,document.getElementById(`btnAddProduce`).addEventListener(`click`,()=>{De({categoryFilter:`produce`,title:`채소/과일 입고 등록`,returnTab:`produce`})}),document.getElementById(`btnProduceTypes`)?.addEventListener(`click`,()=>{if(p!==`admin`&&p!==`office`){alert(`채소/과일 종류 관리는 대표/사무실 계정만 가능합니다.`);return}Y({categoryFilter:`produce`})}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Te(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
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
  `,document.getElementById(`btnAddProcessed`).addEventListener(`click`,Oe),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ee(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
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
  `,document.getElementById(`btnAddRepacked`).addEventListener(`click`,ke),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>q(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function De(e={}){let{categoryFilter:t=`meat`,title:n=t===`produce`?`채소/과일 입고 등록`:`원육 입고 등록`,returnTab:r=`frozen`}=e,i=t===`produce`?`채소/과일`:`원육`;$(`
    <h3 class="modal-title">${n}</h3>
    <div class="form-group">
      <label>${i} 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${M().filter(e=>t===`produce`?e.category===`produce`:(e.category||`meat`)===`meat`).map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${m()}" />
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
  `),document.getElementById(`btnSaveFrozen`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,t=document.getElementById(`m_meatType`),n=t.options[t.selectedIndex]?.text,a=parseFloat(document.getElementById(`m_weight`).value),s=document.getElementById(`m_unit`).value,c=document.getElementById(`m_date`).value,l=document.getElementById(`m_staff`).value,f=document.getElementById(`m_note`).value;if(!e||!a||!c){alert(`${i} 종류, 중량, 날짜는 필수입니다.`);return}if(!(a>0)){alert(`중량은 0보다 커야 합니다.`);return}if(!l){alert(`담당자를 선택해주세요.`);return}if(await g(c))return;let p=s===`kg`?a*1e3:a,m=await o(u(d,`meatStocks`),{meatTypeId:e,meatNameSnapshot:n,stage:`frozen`,incomingDate:c,initialQtyG:p,remaining:p,staffName:l,note:f,closed:!1,createdAt:new Date,updatedAt:new Date});await v({type:`frozenIncoming`,date:c,meatTypeId:e,meatNameSnapshot:n,stage:`frozen`,meatStockId:m.id,delta:p,before:0,after:p,staff:l,reason:f||null}),await h({action:`meat`,subAction:`incoming`,date:c,staff:l,message:`${i} 입고 (냉동창고) - ${n} +${(p/1e3).toFixed(1)}kg / 담당: ${l}`,details:{meatStockId:m.id,meatTypeId:e,meatName:n,stage:`frozen`,qtyG:p,note:f||null}}),closeModal(),K(r),alert(`입고 등록 완료!`)})}function Oe(){$(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${M().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${m()}" />
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveProcessed`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,n=document.getElementById(`m_meatType`),r=n.options[n.selectedIndex]?.text,a=parseFloat(document.getElementById(`m_unitWeight`).value),s=parseInt(document.getElementById(`m_count`).value),c=document.getElementById(`m_date`).value,l=document.getElementById(`m_staff`).value,f=document.getElementById(`m_note`).value;if(!e||!a||!s||!c){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(a>0)||!(s>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!l){alert(`담당자를 선택해주세요.`);return}if(await g(c))return;let p=a*s,m=(await L(`frozen`)).filter(t=>t.meatTypeId===e&&t.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``)),h=m.reduce((e,t)=>e+t.remaining,0);if(h<p){alert(`냉동창고 잔량이 부족합니다.\n${r}: 필요 ${(p/1e3).toFixed(1)}kg / 현재 ${(h/1e3).toFixed(1)}kg`);return}let _=Date.now().toString(),y=Pe(),b=p;for(let n of m){if(b<=0)break;let a=Math.min(n.remaining,b),o=n.remaining-a;await i(t(d,`meatStocks`,n.id),{remaining:o,closed:o===0,updatedAt:new Date}),await v({type:`frozenOut`,date:c,meatTypeId:e,meatNameSnapshot:r,stage:`frozen`,meatStockId:n.id,delta:-a,before:n.remaining,after:o,staff:l,reason:`전처리 등록 자동차감`,batchId:_}),b-=a}await v({type:`processedIn`,date:c,meatTypeId:e,meatNameSnapshot:r,stage:`processed`,meatStockId:(await o(u(d,`meatStocks`),{meatTypeId:e,meatNameSnapshot:r,stage:`processed`,incomingDate:c,processedDate:c,unitWeightG:a,unitCount:s,initialQtyG:p,remaining:p,batchId:_,batchColor:y,staffName:l,note:f,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:p,before:0,after:p,staff:l,reason:f||null,batchId:_}),closeModal(),K(`processed`),alert(`전처리 등록 완료!`)})}function ke(){$(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${M().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${m()}" />
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveRepacked`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_meatType`).value,n=document.getElementById(`m_meatType`),r=n.options[n.selectedIndex]?.text,a=parseFloat(document.getElementById(`m_unitWeight`).value),s=parseInt(document.getElementById(`m_count`).value),c=document.getElementById(`m_date`).value,l=document.getElementById(`m_staff`).value,f=document.getElementById(`m_note`).value;if(!e||!a||!s||!c){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(a>0)||!(s>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!l){alert(`담당자를 선택해주세요.`);return}if(await g(c))return;let p=a*s,m=(await L(`repacked`)).find(t=>t.meatTypeId===e&&t.remaining>0);if(m){alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${r}: 기존 잔량 ${(m.remaining/1e3).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);return}let h=(await L(`processed`)).filter(t=>t.meatTypeId===e&&t.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)),_=h.reduce((e,t)=>e+t.remaining,0);if(_<p){alert(`전처리 잔량이 부족합니다.\n${r}: 필요 ${(p/1e3).toFixed(1)}kg / 현재 ${(_/1e3).toFixed(1)}kg`);return}let y=Date.now().toString(),b=Pe(),x=p;for(let n of h){if(x<=0)break;let a=Math.min(n.remaining,x),o=n.remaining-a;await i(t(d,`meatStocks`,n.id),{remaining:o,closed:o===0,updatedAt:new Date}),await v({type:`processedOut`,date:c,meatTypeId:e,meatNameSnapshot:r,stage:`processed`,meatStockId:n.id,delta:-a,before:n.remaining,after:o,staff:l,reason:`재포장 등록 자동차감`,batchId:y}),x-=a}await v({type:`repackedIn`,date:c,meatTypeId:e,meatNameSnapshot:r,stage:`repacked`,meatStockId:(await o(u(d,`meatStocks`),{meatTypeId:e,meatNameSnapshot:r,stage:`repacked`,incomingDate:c,repackedDate:c,unitWeightG:a,unitCount:s,initialQtyG:p,remaining:p,batchId:y,batchColor:b,staffName:l,note:f,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:p,before:0,after:p,staff:l,reason:f||null,batchId:y}),closeModal(),K(`repacked`),alert(`재포장 등록 완료!`)})}function q(e,n,r){$(`
    <h3 class="modal-title">수동 재고 조정 — ${n}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">기존 잔량: <strong>${(r/1e3).toFixed(1)}kg</strong> (${r}g)</p>
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
잔량이 음수가 될 수 없습니다.`);return}if(!s||!c){alert(`사유와 담당자는 필수입니다.`);return}let u=l-r;if(u===0){alert(`기존 잔량과 동일합니다. 변경할 값을 입력해주세요.`);return}let f=m();if(await g(f))return;let p=await a(t(d,`meatStocks`,e)),_=(p.exists()?p.data():{}).meatTypeId||null;await i(t(d,`meatStocks`,e),{remaining:l,closed:l===0,updatedAt:new Date});let y=x===`produce`?`frozen`:x,b=x===`frozen`?`냉동창고`:x===`processed`?`전처리`:x===`produce`?`채소/과일`:`재포장`;await h({action:`meat`,subAction:`adjust`,date:f,staff:c,message:`원육 수동조정 (${b}) — ${n} ${(r/1e3).toFixed(1)}kg → ${(l/1e3).toFixed(1)}kg / 사유: ${s} / 담당: ${c}`,details:{meatStockId:e,meatName:n,stage:b,delta:u,before:r,after:l,reason:s}}),await v({type:`adjust`,date:f,meatTypeId:_,meatNameSnapshot:n,stage:y,meatStockId:e,delta:u,before:r,after:l,staff:c,reason:s}),closeModal(),K(x),alert(`조정 완료!`)})}function Ae(){let e=j();return e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">등록된 카테고리 없음</td></tr>`:e.map(e=>{let t=y.filter(t=>t.groupId===e.id).length;return`
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
    `}).join(``)}async function je(){y=await D(),b=await O(),await K(x),J()}function J(){if(p!==`admin`&&p!==`office`){alert(`카테고리 관리는 대표/사무실 계정만 가능합니다.`);return}$(`
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
          ${Ae()}
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
  `);let n=A(),r=j(n),i=document.getElementById(`meatStockCategoryList`);i&&r.length>0&&_.create(i,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{let e=Array.from(i.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id),t=new Map(e.map((e,t)=>[e,t]));try{await k(b.map(e=>(e.scope||`meat`)===n?{...e,sortOrder:t.has(e.id)?t.get(e.id):e.sortOrder}:e)),await K(x)}catch(e){console.error(`[meat] stock category modal order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),b=await O(),J()}}}),document.querySelectorAll(`.stock-category-name`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,n=e.target.value.trim(),i=r.find(e=>e.id===t);if(i){if(!n){alert(`카테고리명을 입력해주세요.`),e.target.value=i.name;return}try{await k(b.map(e=>e.id===t?{...e,name:n}:e)),await K(x)}catch(t){console.error(`[meat] stock category rename failed:`,t),alert(`카테고리명 저장 실패: `+(t.message||t)),e.target.value=i.name}}})}),document.getElementById(`btnAddStockCategory`)?.addEventListener(`click`,async()=>{let e=document.getElementById(`newStockCategoryName`).value.trim();if(!e){alert(`카테고리명을 입력해주세요.`);return}let t=[...b,{id:ce(),name:e,sortOrder:r.length,scope:n}];try{await k(t),await je()}catch(e){console.error(`[meat] stock category add failed:`,e),alert(`카테고리 추가 실패: `+(e.message||e))}}),document.querySelectorAll(`.btn-delete-stock-category`).forEach(n=>{n.addEventListener(`click`,async()=>{let i=n.dataset.id;if(r.find(e=>e.id===i))try{let n=new Date,r=e(d);y.filter(e=>e.groupId===i).forEach(e=>{r.update(t(d,`meatTypes`,e.id),{groupId:null,groupSortOrder:0,updatedAt:n})}),await r.commit(),await k(b.filter(e=>e.id!==i)),await je()}catch(e){console.error(`[meat] stock category delete failed:`,e),alert(`카테고리 삭제 실패: `+(e.message||e))}})})}function Y(e={}){let{categoryFilter:n=null}=e,r=n||`meat`,a=r===`meat`&&(p===`admin`||p===`office`),s=y.filter(e=>ne(e.id)===r),c=r===`produce`,l=c?`채소/과일`:`원육`,f=c?`채소/과일 종류 관리`:`원육 종류 관리`,g=c?`g`:`kg`;$(`
    <h3 class="modal-title">${f}</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>${l}명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(${g})</th>
            <th>\uD65C\uC131</th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${s.map(e=>{let t=e.active!==!1,n=c?e.minimumQtyG||0:((e.minimumQtyG||0)/1e3).toFixed(1);return`
              <tr class="${t?``:`inactive-master`}" data-id="${e.id}">
                <td class="master-table-drag-cell">
                  ${a?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
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
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 ${l} 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>${l}명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(${g})</label>
          <input type="number" id="m_newMinQty" placeholder="${c?`예: 500`:`예: 5`}" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),Me(),document.querySelectorAll(`.m-unit-weight`).forEach(e=>{e.addEventListener(`change`,async e=>{let n=e.target.dataset.id,r=y.find(e=>e.id===n),a=r?.defaultUnitWeightG,o=parseFloat(e.target.value);if(!isFinite(o)||o<=0){alert(`기본 단위중량은 양수(g)여야 합니다.`),e.target.value=a??``;return}try{await i(t(d,`meatTypes`,n),{defaultUnitWeightG:o,updatedAt:new Date}),r&&(r.defaultUnitWeightG=o)}catch(t){console.error(`[meat] defaultUnitWeightG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=a??``}})}),document.querySelectorAll(`.m-min-qty`).forEach(e=>{e.addEventListener(`change`,async e=>{let n=e.target.dataset.id,r=y.find(e=>e.id===n),a=r?.minimumQtyG??0,o=parseFloat(e.target.value);if(!isFinite(o)||o<0){alert(`최소재고는 0 이상(${g})이어야 합니다.`),e.target.value=c?a:(a/1e3).toFixed(1);return}let s=Math.round(c?o:o*1e3);try{await i(t(d,`meatTypes`,n),{minimumQtyG:s,updatedAt:new Date}),r&&(r.minimumQtyG=s)}catch(t){console.error(`[meat] minimumQtyG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=c?a:(a/1e3).toFixed(1)}})}),document.querySelectorAll(`.m-active-toggle`).forEach(n=>{n.addEventListener(`change`,async n=>{let r=n.target.dataset.id,a=n.target.checked,o=y.find(e=>e.id===r),s=o?.active!==!1;try{await i(t(d,`meatTypes`,r),{active:a,updatedAt:new Date}),o&&(o.active=a),s!==a&&await h({action:`meat`,subAction:`activeToggle`,date:m(),staff:Ie(),message:`Meat type ${a?`active`:`inactive`} — ${o?.name||r}`,details:{meatTypeId:r,meatName:o?.name||``,active:a}}),closeModal(),Y(e)}catch(e){console.error(`[meat] active save failed:`,e),alert(`Save failed: `+(e.message||e)),n.target.checked=!a}})}),document.getElementById(`btnAddMeatType`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_newMeatName`).value.trim(),n=parseFloat(document.getElementById(`m_newUnitWeight`).value)||0,i=parseFloat(document.getElementById(`m_newMinQty`).value)||0,a=r;if(!t){alert(`${l}명은 필수입니다.`);return}await o(u(d,`meatTypes`),{name:t,defaultUnitWeightG:n,minimumQtyG:Math.round(c?i:i*1e3),category:a,sortOrder:y.length,active:!0,showInStats:!0,createdAt:new Date,updatedAt:new Date}),y=await D(),closeModal(),Y(e)})}function Me(){if(X(),p!==`admin`&&p!==`office`)return;let e=document.getElementById(`meatTypesList`);e&&(S=_.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await Ne()}}))}function X(){if(S){try{S.destroy()}catch(e){console.warn(`[meat] sortable destroy skipped:`,e)}S=null}}async function Ne(){let n=document.getElementById(`meatTypesList`);if(!n)return;let r=Array.from(n.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id).filter(Boolean),i=new Date,a=e(d);r.forEach((e,n)=>{a.update(t(d,`meatTypes`,e),{sortOrder:n,updatedAt:i})});try{await a.commit();let e=new Map(r.map((e,t)=>[e,t]));y=y.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:i}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(e){console.error(`[meat] reorder save failed:`,e),alert(`순번 저장 실패: `+(e.message||e)),y=await D(),closeModal(),Y()}}function Pe(){let e=[`#e8f4ea`,`#e8eef8`,`#fef0e8`,`#f0e8fe`,`#fff0e8`,`#e8f8f4`];return e[Math.floor(Math.random()*e.length)]}var Z={};async function Fe(){Object.keys(Z).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let n=await a(t(d,`staffGroups`,e));n.exists()&&(Z[e]=n.data().members||[])}))}function Ie(){return p===`admin`?`대표`:p===`office`?`사무실`:p===`production`?`생산실`:`시스템`}function Q(e){let t=``;for(let n of e)(Z[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}f(`meat`,function(){X();let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{ee as renderMeat};