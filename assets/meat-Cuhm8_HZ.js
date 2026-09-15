import{a as e,b as t,d as n,g as r,s as i,u as a,y as o}from"./index.esm-rHmxwfvm.js";import{n as s}from"./firebase-qGjqjNvO.js";import{a as c}from"./formDraft-DoA-Ia7D.js";import{G as l,L as u,S as d,m as f}from"./index-C3J_bQqC.js";import"./activityLogs-CRxSouBf.js";import{t as p}from"./closingGuard-Cs6mxhOl.js";import{t as m}from"./sortable-DIR4yJqN.js";import{t as h}from"./pageRefresh-33o9kkfx.js";import"./meatLogs-DqUudnNK.js";import{t as g}from"./pageCommand-DPbnNpe7.js";import{t as _}from"./commandWrites-D8jwKhUE.js";import{t as v}from"./pageStaff-C1JCr7Fo.js";var y=[],b=[],x=`frozen`,S=null,C=[],w=null,T=new Set,E=new Set;async function D({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">원료 재고 로딩 중...</p>`,await Re({force:e}),d()?.isCurrent()&&await xe()}async function O(t={getDocs:i,getDoc:e}){let r=n(o(s,`meatTypes`),a(`sortOrder`));return(await t.getDocs(r)).docs.map(e=>({id:e.id,...e.data()}))}function ee(e){return(Array.isArray(e)?e:[]).map((e,t)=>({id:String(e?.id||``).trim(),name:String(e?.name||``).trim(),sortOrder:Number.isFinite(Number(e?.sortOrder))?Number(e.sortOrder):t,scope:e?.scope===`produce`?`produce`:`meat`})).filter(e=>e.id&&e.name).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)||e.name.localeCompare(t.name,`ko`))}async function k(n={getDocs:i,getDoc:e}){let r=await n.getDoc(t(s,`settings`,`meatStockCategories`));return r.exists()?ee(r.data().groups):[]}async function A(e,n){if(!n)return g($,t=>A(e,t));let{setDoc:r}=_(n),i=ee(e).map((e,t)=>({...e,sortOrder:t}));await r(t(s,`settings`,`meatStockCategories`),{groups:i,updatedAt:new Date},{merge:!0}),b=i}function j(){return x===`produce`?`produce`:`meat`}function M(e=j()){return b.filter(t=>(t.scope||`meat`)===e)}function N(){return y.filter(e=>e.active!==!1)}function te(e){return y.find(t=>t.id===e)?.category||`meat`}function P(e){return te(e)===`produce`}function ne(e){return!P(e.meatTypeId)}function re(e){return P(e.meatTypeId)}function ie(e){return!P(e.meatTypeId)}function ae(e){return P(e.meatTypeId)}async function oe(t,c={getDocs:i,getDoc:e}){let l=n(o(s,`meatLogs`),r(`stage`,`==`,t),a(`timestamp`,`desc`));return(await c.getDocs(l)).docs.map(e=>({id:e.id,...e.data()}))}function F(e){return{frozenIncoming:`입고`,frozenOut:`전처리로 출고`,processedIn:`전처리`,processedOut:`재포장으로 출고`,repackedIn:`재포장`,repackedOut:`출고`,productionDeduct:`생산차감`,productionRollback:`생산복원`,adjust:`수동조정`}[e]||e}function I(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function L(e){return typeof e==`number`?`${e>0?`+`:``}${(e/1e3).toFixed(2)}kg`:`-`}async function R(t,r={getDocs:i,getDoc:e}){let c=n(o(s,`meatStocks`),a(`incomingDate`));return(await r.getDocs(c)).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.stage===t&&!e.closed)}function z(e,t){let n=y.find(e=>e.id===t)?.minimumQtyG||0;return n<=0?`#1a1a1a`:e<n?`#e53e3e`:e<n*1.5?`#dd6b20`:`#1a1a1a`}function B(e){let t=new Map;return(e||[]).forEach(e=>{let n=e.meatTypeId||e.meatNameSnapshot||e.id,r=t.get(n);r?(r.totalG+=Number(e.remaining||0),r.lots.push(e)):t.set(n,{name:e.meatNameSnapshot||`원료`,totalG:Number(e.remaining||0),meatTypeId:e.meatTypeId,lots:[e]})}),t}function V(e=``){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function se(){return`cat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}function ce(e){return y.find(t=>t.id===e)?.groupId||null}function H(e){let t=y.find(t=>t.id===e)?.groupSortOrder;return Number.isFinite(Number(t))?Number(t):2**53-1}function le(e){let t=M().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return[...e.values()].forEach(e=>{let t=e.meatTypeId?ce(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>{let n=H(e.meatTypeId),r=H(t.meatTypeId);return n===r?(e.name||``).localeCompare(t.name||``,`ko`):n-r})}),r.items.length>0?[...t,r]:t}function ue(e){let t=z(e.totalG,e.meatTypeId),n=l===`admin`||l===`office`,r=e.meatTypeId||e.name,i=!T.has(r),a=[...e.lots||[]].sort((e,t)=>{let n=String(e.incomingDate||e.processedDate||e.repackedDate||``),r=String(t.incomingDate||t.processedDate||t.repackedDate||``);return n.localeCompare(r)});return`
    <div class="stock-summary-cell" data-meat-type-id="${e.meatTypeId||``}" data-summary-id="${V(r)}" style="min-width:0;border:1px solid #e8e8e8;border-radius:5px;padding:0;background:#fff;overflow:hidden;">
      <div class="stock-summary-main" style="display:flex;align-items:center;gap:4px;min-width:0;padding:3px 5px;cursor:pointer;">
        ${n?`<span class="stock-summary-drag-handle" style="cursor:grab;color:#bbb;font-size:11px;flex-shrink:0;">::</span>`:``}
        <span style="color:#888;font-size:11px;flex-shrink:0;width:10px;text-align:center;">${i?`-`:`+`}</span>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">${V(e.name)}</span>
        <b style="color:${t};font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${(e.totalG/1e3).toFixed(2)}kg</b>
      </div>
      ${i?`
        <div class="stock-summary-lots" style="border-top:1px solid #eee;background:#fafafa;padding:4px 5px;display:flex;flex-direction:column;gap:3px;">
          ${a.map(t=>{let n=t.incomingDate||t.processedDate||t.repackedDate||`-`,r=t.remaining<0?`#e53e3e`:`#333`;return`
              <div style="border:1px solid #ececec;border-radius:4px;background:#fff;padding:4px;">
                <div style="display:flex;align-items:center;gap:5px;">
                  <span style="color:#777;font-size:11px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${V(n)}</span>
                  <b style="color:${r};font-size:11px;white-space:nowrap;">${(Number(t.remaining||0)/1e3).toFixed(2)}kg</b>
                  <button class="btn-adjust" data-id="${t.id}" data-name="${V(t.meatNameSnapshot||e.name||``)}" data-remaining="${t.remaining}" style="padding:1px 6px;font-size:11px;">&#51312;&#51221;</button>
                </div>
              </div>
            `}).join(``)}
        </div>
      `:``}
    </div>
  `}function U(e){let t=le(B(e)),n=l===`admin`||l===`office`;return`
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
              <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${V(e.name)}</span>
              <span style="font-size:11px;color:#888;">${e.items.length}</span>
            </div>
            <div class="stock-summary-category-items" data-category-id="${e.id}" style="display:flex;flex-direction:column;gap:4px;min-height:28px;padding:5px;">
              ${e.items.length===0?`<div class="stock-summary-empty" style="font-size:11px;color:#bbb;padding:3px 2px;">비어 있음</div>`:e.items.map(ue).join(``)}
            </div>
          </div>
        `).join(``)}
      </div>
    </div>
  `}function W(e,t={}){return``}function G(e){if(e?.timestamp?.toMillis)return e.timestamp.toMillis();let t=e?.timestamp instanceof Date?e.timestamp.getTime():new Date(e?.timestamp||0).getTime();return Number.isFinite(t)?t:0}function de(e){return e.meatTypeId||`name:`+(e.meatNameSnapshot||`-`)}function fe(e){let t=new Map;return(e||[]).forEach(e=>{let n=de(e);t.has(n)||t.set(n,{key:n,meatTypeId:e.meatTypeId||null,name:e.meatNameSnapshot||`-`,latestTime:0,items:[]});let r=t.get(n);r.items.push(e),r.latestTime=Math.max(r.latestTime,G(e))}),[...t.values()].map(e=>({...e,items:e.items.sort((e,t)=>G(t)-G(e))})).sort((e,t)=>{let n=H(e.meatTypeId),r=H(t.meatTypeId);if(n!==r)return n-r;let i=(e.name||``).localeCompare(t.name||``,`ko`);return i===0?t.latestTime-e.latestTime:i})}function pe(e){let t=M().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return(e||[]).forEach(e=>{let t=e.meatTypeId?ce(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>G(t)-G(e))}),r.items.length>0?[...t,r]:t}function me(e,t){return`<div style="border:1px solid #ececec;border-radius:5px;background:#fff;padding:4px 5px;"><div style="display:flex;align-items:center;gap:5px;min-width:0;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">`+V(e.meatNameSnapshot||t||`-`)+`</span><span style="color:#777;font-size:11px;white-space:nowrap;">`+V(I(e.timestamp))+`</span><b style="color:`+(e.delta<0?`#e53e3e`:`#2d7a3a`)+`;font-size:12px;white-space:nowrap;">`+L(e.delta)+`</b></div><div style="display:flex;justify-content:space-between;gap:6px;margin-top:2px;color:#777;font-size:11px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">`+V(e.staff||`-`)+` / `+V(e.reason||`-`)+`</span><span style="white-space:nowrap;">`+V(F(e.type))+`</span></div></div>`}function he(e,t){let n=[x,e.id,t.key].join(`:`),r=E.has(n);return`<div class="meat-log-type-group" style="border:1px solid #ececec;border-radius:5px;background:#fff;overflow:hidden;"><button type="button" class="meat-log-type-toggle" data-log-type-id="`+V(n)+`" style="width:100%;border:0;background:#fff;display:flex;align-items:center;gap:5px;padding:5px 6px;cursor:pointer;text-align:left;"><span style="color:#888;font-size:11px;width:10px;text-align:center;flex-shrink:0;">`+(r?`-`:`+`)+`</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;font-size:12px;font-weight:700;flex:1;">`+V(t.name)+`</span><span style="color:#888;font-size:11px;white-space:nowrap;">`+t.items.length+`&#44148;</span></button>`+(r?`<div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid #eee;background:#fafafa;padding:4px;">`+t.items.map(e=>me(e,t.name)).join(``)+`</div>`:``)+`</div>`}function K(e){if(!e||e.length===0)return`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`;let t=pe(e).filter(e=>e.items.length>0);return t.length===0?`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`:`<div class="meat-log-group-wrap" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">`+t.map(e=>{let t=fe(e.items);return`<div class="meat-log-group" style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;"><div style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">`+V(e.name)+`</span><span style="font-size:11px;color:#888;">`+e.items.length+`</span></div><div style="display:flex;flex-direction:column;gap:4px;padding:5px;">`+t.map(t=>he(e,t)).join(``)+`</div></div>`}).join(``)+`</div>`}function ge(){document.querySelectorAll(`.meat-log-type-toggle`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logTypeId;t&&(E.has(t)?E.delete(t):E.add(t),q(x))})})}function _e(){[...C,w].filter(Boolean).forEach(e=>{try{e.destroy()}catch(e){console.warn(`[meat] stock summary sortable destroy skipped:`,e)}}),C=[],w=null}async function ve(){return g($,async e=>{let{writeBatch:n}=_(e),r=n(s),i=new Date,a=new Map;document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let n=e.dataset.categoryId===`__other__`?null:e.dataset.categoryId;Array.from(e.querySelectorAll(`.stock-summary-cell[data-meat-type-id]`)).forEach((e,o)=>{let c=e.dataset.meatTypeId;c&&(r.update(t(s,`meatTypes`,c),{groupId:n,groupSortOrder:o,updatedAt:i}),a.set(c,{groupId:n,groupSortOrder:o,updatedAt:i}))})}),await r.commit(),y=await O(),e.isCurrent()&&await q(x)},{roles:[`admin`,`office`]})}async function ye(){let e=j(),t=Array.from(document.querySelectorAll(`.stock-summary-category-column[data-virtual="false"]`)).map(e=>e.dataset.categoryId).filter(Boolean),n=new Map(t.map((e,t)=>[e,t]));await A(b.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)))}function be(){_e();let e=l===`admin`||l===`office`;if(document.getElementById(`btnMeatStockCategories`)?.addEventListener(`click`,()=>Y()),document.querySelectorAll(`.stock-summary-main`).forEach(e=>{e.addEventListener(`click`,t=>{if(t.target.closest(`.stock-summary-drag-handle`))return;let n=e.closest(`.stock-summary-cell`)?.dataset.summaryId;n&&(T.has(n)?T.delete(n):T.add(n),q(x))})}),!e)return;let t=document.querySelector(`.stock-summary-columns`);t&&(w=m.create(t,{animation:150,handle:`.stock-summary-category-handle`,draggable:`.stock-summary-category-column[data-virtual="false"]`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await ye()}catch(e){console.error(`[meat] stock category order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),b=await k(),q(x)}}})),document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let t=m.create(e,{group:`meatStockShared`,animation:150,handle:`.stock-summary-drag-handle`,draggable:`.stock-summary-cell`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await ve()}catch(e){console.error(`[meat] stock group save failed:`,e),alert(`원료 카테고리 저장 실패: `+(e.message||e)),y=await O(),q(x)}}});C.push(t)})}async function xe(){let e=document.getElementById(`mainContent`);e.innerHTML=`
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
  `,document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{x=e.dataset.tab,document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),q(x)})}),await q(x)}async function q(e){let t=document.getElementById(`tabContent`);t.innerHTML=`<div style="padding:24px;"><p>로딩 중...</p></div>`;let n=await Re();if(!n)return;let{stocks:r,logs:i}=n;!t.isConnected||e!==x||(e===`frozen`?Se(r,i):e===`processed`?we(r,i):e===`produce`?Ce(r,i):Te(r,i),be(),ge())}function Se(e,t){let n=document.getElementById(`tabContent`),r=l===`admin`||l===`office`,i=e.filter(ne),a=t.filter(ie),o=B(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${U(i)}
      ${W(i,{emptyText:`등록된 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,typeTotals:o,useTypeColor:!0})}
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
            ${i.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px;">등록된 재고 없음</td></tr>`:i.map(e=>{let t=z(o.get(e.meatTypeId||e.meatNameSnapshot||e.id)?.totalG??e.remaining,e.meatTypeId);return`
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
      ${K(a)}
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
                  <td>${I(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${F(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${L(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddFrozen`).addEventListener(`click`,()=>Ee()),document.getElementById(`btnMeatTypes`)?.addEventListener(`click`,()=>{if(l!==`admin`&&l!==`office`){alert(`원육 종류 관리는 대표/사무실 계정만 가능합니다.`);return}X()}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ce(e,t){let n=document.getElementById(`tabContent`),r=l===`admin`||l===`office`,i=e.filter(re),a=t.filter(ae),o=B(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProduce">+ 채소/과일 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnProduceTypes">채소/과일 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${U(i)}
      ${W(i,{emptyText:`등록된 채소/과일 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,showInitial:!0,showStaffNote:!0,typeTotals:o,useTypeColor:!0})}
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
            ${i.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">등록된 채소/과일 재고 없음</td></tr>`:i.map(e=>{let t=z(o.get(e.meatTypeId||e.meatNameSnapshot||e.id)?.totalG??e.remaining,e.meatTypeId);return`
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
      ${K(a)}
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
                  <td>${I(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${F(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${L(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddProduce`).addEventListener(`click`,()=>{Ee({categoryFilter:`produce`,title:`채소/과일 입고 등록`,returnTab:`produce`})}),document.getElementById(`btnProduceTypes`)?.addEventListener(`click`,()=>{if(l!==`admin`&&l!==`office`){alert(`채소/과일 종류 관리는 대표/사무실 계정만 가능합니다.`);return}X({categoryFilter:`produce`})}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function we(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${U(e)}
      ${W(e,{emptyText:`등록된 전처리 재고 없음`,dateField:`processedDate`,dateLabel:`작업일`})}
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
      ${K(t)}
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
                  <td>${I(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${F(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${L(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddProcessed`).addEventListener(`click`,De),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Te(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${U(e)}
      ${W(e,{emptyText:`등록된 재포장 재고 없음`,dateField:`repackedDate`,dateLabel:`작업일`})}
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
      ${K(t)}
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
                  <td>${I(e.timestamp)}</td>
                  <td>${e.meatNameSnapshot||`-`}</td>
                  <td>${F(e.type)}</td>
                  <td style="color:${e.delta<0?`#e53e3e`:`#2d7a3a`};font-weight:600;">${L(e.delta)}</td>
                  <td>${e.staff||`-`}</td>
                  <td>${e.reason||`-`}</td>
                </tr>
              `).join(``)}
          </tbody>
        </table>
      </div>
    </div>
  `,document.getElementById(`btnAddRepacked`).addEventListener(`click`,Oe),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>J(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ee(e={}){let{categoryFilter:t=`meat`,title:n=t===`produce`?`채소/과일 입고 등록`:`원육 입고 등록`,returnTab:r=`frozen`}=e,i=t===`produce`?`채소/과일`:`원육`;Q(`
    <h3 class="modal-title">${n}</h3>
    <div class="form-group">
      <label>${i} 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${N().filter(e=>t===`produce`?e.category===`produce`:(e.category||`meat`)===`meat`).map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${u()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`lead`,`office`])}
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
  `),document.getElementById(`btnSaveFrozen`).addEventListener(`click`,async()=>g($,async e=>{let{addDoc:t,recordActivity:n,recordMeatLog:a}=_(e),c=document.getElementById(`m_meatType`).value,l=document.getElementById(`m_meatType`),u=l.options[l.selectedIndex]?.text,d=parseFloat(document.getElementById(`m_weight`).value),f=document.getElementById(`m_unit`).value,m=document.getElementById(`m_date`).value,h=document.getElementById(`m_staff`).value,g=document.getElementById(`m_note`).value;if(!c||!d||!m){alert(`${i} 종류, 중량, 날짜는 필수입니다.`);return}if(!(d>0)){alert(`중량은 0보다 커야 합니다.`);return}if(!h){alert(`담당자를 선택해주세요.`);return}if(await p(m,e))return;let v=f===`kg`?d*1e3:d,y=await t(o(s,`meatStocks`),{meatTypeId:c,meatNameSnapshot:u,stage:`frozen`,incomingDate:m,initialQtyG:v,remaining:v,staffName:h,note:g,closed:!1,createdAt:new Date,updatedAt:new Date});await a({type:`frozenIncoming`,date:m,meatTypeId:c,meatNameSnapshot:u,stage:`frozen`,meatStockId:y.id,delta:v,before:0,after:v,staff:h,reason:g||null}),await n({action:`meat`,subAction:`incoming`,date:m,staff:h,message:`${i} 입고 (냉동창고) - ${u} +${(v/1e3).toFixed(1)}kg / 담당: ${h}`,details:{meatStockId:y.id,meatTypeId:c,meatName:u,stage:`frozen`,qtyG:v,note:g||null}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(q(r),alert(`입고 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function De(){Q(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${N().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${u()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`lead`,`office`])}
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveProcessed`).addEventListener(`click`,async()=>g($,async e=>{let{addDoc:n,updateDoc:r,recordMeatLog:i}=_(e),a=document.getElementById(`m_meatType`).value,c=document.getElementById(`m_meatType`),l=c.options[c.selectedIndex]?.text,u=parseFloat(document.getElementById(`m_unitWeight`).value),d=parseInt(document.getElementById(`m_count`).value),f=document.getElementById(`m_date`).value,m=document.getElementById(`m_staff`).value,h=document.getElementById(`m_note`).value;if(!a||!u||!d||!f){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(u>0)||!(d>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!m){alert(`담당자를 선택해주세요.`);return}if(await p(f,e))return;let g=u*d,v=(await R(`frozen`)).filter(e=>e.meatTypeId===a&&e.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``)),y=v.reduce((e,t)=>e+t.remaining,0);if(y<g){alert(`냉동창고 잔량이 부족합니다.\n${l}: 필요 ${(g/1e3).toFixed(1)}kg / 현재 ${(y/1e3).toFixed(1)}kg`);return}let b=Date.now().toString(),x=Pe(),S=g;for(let e of v){if(S<=0)break;let n=Math.min(e.remaining,S),o=e.remaining-n;await r(t(s,`meatStocks`,e.id),{remaining:o,closed:o===0,updatedAt:new Date}),await i({type:`frozenOut`,date:f,meatTypeId:a,meatNameSnapshot:l,stage:`frozen`,meatStockId:e.id,delta:-n,before:e.remaining,after:o,staff:m,reason:`전처리 등록 자동차감`,batchId:b}),S-=n}await i({type:`processedIn`,date:f,meatTypeId:a,meatNameSnapshot:l,stage:`processed`,meatStockId:(await n(o(s,`meatStocks`),{meatTypeId:a,meatNameSnapshot:l,stage:`processed`,incomingDate:f,processedDate:f,unitWeightG:u,unitCount:d,initialQtyG:g,remaining:g,batchId:b,batchColor:x,staffName:m,note:h,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:g,before:0,after:g,staff:m,reason:h||null,batchId:b}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(q(`processed`),alert(`전처리 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function Oe(){Q(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${N().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${u()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`lead`,`office`])}
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveRepacked`).addEventListener(`click`,async()=>g($,async e=>{let{addDoc:n,updateDoc:r,recordMeatLog:i}=_(e),a=document.getElementById(`m_meatType`).value,c=document.getElementById(`m_meatType`),l=c.options[c.selectedIndex]?.text,u=parseFloat(document.getElementById(`m_unitWeight`).value),d=parseInt(document.getElementById(`m_count`).value),f=document.getElementById(`m_date`).value,m=document.getElementById(`m_staff`).value,h=document.getElementById(`m_note`).value;if(!a||!u||!d||!f){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(u>0)||!(d>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!m){alert(`담당자를 선택해주세요.`);return}if(await p(f,e))return;let g=u*d,v=(await R(`repacked`)).find(e=>e.meatTypeId===a&&e.remaining>0);if(v){alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${l}: 기존 잔량 ${(v.remaining/1e3).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);return}let y=(await R(`processed`)).filter(e=>e.meatTypeId===a&&e.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)),b=y.reduce((e,t)=>e+t.remaining,0);if(b<g){alert(`전처리 잔량이 부족합니다.\n${l}: 필요 ${(g/1e3).toFixed(1)}kg / 현재 ${(b/1e3).toFixed(1)}kg`);return}let x=Date.now().toString(),S=Pe(),C=g;for(let e of y){if(C<=0)break;let n=Math.min(e.remaining,C),o=e.remaining-n;await r(t(s,`meatStocks`,e.id),{remaining:o,closed:o===0,updatedAt:new Date}),await i({type:`processedOut`,date:f,meatTypeId:a,meatNameSnapshot:l,stage:`processed`,meatStockId:e.id,delta:-n,before:e.remaining,after:o,staff:m,reason:`재포장 등록 자동차감`,batchId:x}),C-=n}await i({type:`repackedIn`,date:f,meatTypeId:a,meatNameSnapshot:l,stage:`repacked`,meatStockId:(await n(o(s,`meatStocks`),{meatTypeId:a,meatNameSnapshot:l,stage:`repacked`,incomingDate:f,repackedDate:f,unitWeightG:u,unitCount:d,initialQtyG:g,remaining:g,batchId:x,batchColor:S,staffName:m,note:h,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:g,before:0,after:g,staff:m,reason:h||null,batchId:x}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(q(`repacked`),alert(`재포장 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function J(e,n,r){Q(`
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
        ${Z([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>g($,async i=>{let{getDoc:a,updateDoc:o,recordActivity:c,recordMeatLog:l}=_(i),d=document.getElementById(`m_actualRemaining`).value,f=document.getElementById(`m_adjustReason`).value.trim(),m=document.getElementById(`m_staff`).value;if(d===``||isNaN(parseFloat(d))){alert(`실제 잔량을 입력해주세요.`);return}let h=parseFloat(d);if(h<0){alert(`실제 잔량은 0 이상이어야 합니다.
잔량이 음수가 될 수 없습니다.`);return}if(!f||!m){alert(`사유와 담당자는 필수입니다.`);return}let g=h-r;if(g===0){alert(`기존 잔량과 동일합니다. 변경할 값을 입력해주세요.`);return}let v=u();if(await p(v,i))return;let y=await a(t(s,`meatStocks`,e)),b=(y.exists()?y.data():{}).meatTypeId||null;await o(t(s,`meatStocks`,e),{remaining:h,closed:h===0,updatedAt:new Date});let S=x===`produce`?`frozen`:x,C=x===`frozen`?`냉동창고`:x===`processed`?`전처리`:x===`produce`?`채소/과일`:`재포장`;await c({action:`meat`,subAction:`adjust`,date:v,staff:m,message:`원육 수동조정 (${C}) — ${n} ${(r/1e3).toFixed(1)}kg → ${(h/1e3).toFixed(1)}kg / 사유: ${f} / 담당: ${m}`,details:{meatStockId:e,meatName:n,stage:C,delta:g,before:r,after:h,reason:f}}),await l({type:`adjust`,date:v,meatTypeId:b,meatNameSnapshot:n,stage:S,meatStockId:e,delta:g,before:r,after:h,staff:m,reason:f}),i.isCurrent()&&(closeModal(),i.isCurrent()&&(q(x),alert(`조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function ke(){let e=M();return e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">등록된 카테고리 없음</td></tr>`:e.map(e=>{let t=y.filter(t=>t.groupId===e.id).length;return`
      <tr data-id="${e.id}">
        <td class="master-table-drag-cell">
          <span class="drag-handle" title="순서 변경" aria-label="순서 변경">⠿</span>
        </td>
        <td>
          <input type="text" class="stock-category-name" data-id="${e.id}" value="${V(e.name)}"
                 style="width:100%;padding:5px 6px;" />
        </td>
        <td style="text-align:right;color:#666;">${t}</td>
        <td>
          <button type="button" class="btn-secondary btn-delete-stock-category" data-id="${e.id}">삭제</button>
        </td>
      </tr>
    `}).join(``)}async function Ae(){y=await O(),b=await k(),await q(x),Y()}function Y(){if(l!==`admin`&&l!==`office`){alert(`카테고리 관리는 대표/사무실 계정만 가능합니다.`);return}Q(`
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
  `);let e=j(),n=M(e),r=document.getElementById(`meatStockCategoryList`);r&&n.length>0&&m.create(r,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{let t=Array.from(r.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id),n=new Map(t.map((e,t)=>[e,t]));try{await A(b.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t)),await q(x)}catch(e){console.error(`[meat] stock category modal order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),b=await k(),Y()}}}),document.querySelectorAll(`.stock-category-name`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,r=e.target.value.trim(),i=n.find(e=>e.id===t);if(i){if(!r){alert(`카테고리명을 입력해주세요.`),e.target.value=i.name;return}try{await A(b.map(e=>e.id===t?{...e,name:r}:e)),await q(x)}catch(t){console.error(`[meat] stock category rename failed:`,t),alert(`카테고리명 저장 실패: `+(t.message||t)),e.target.value=i.name}}})}),document.getElementById(`btnAddStockCategory`)?.addEventListener(`click`,async()=>{let t=document.getElementById(`newStockCategoryName`).value.trim();if(!t){alert(`카테고리명을 입력해주세요.`);return}let r=[...b,{id:se(),name:t,sortOrder:n.length,scope:e}];try{await A(r),await Ae()}catch(e){console.error(`[meat] stock category add failed:`,e),alert(`카테고리 추가 실패: `+(e.message||e))}}),document.querySelectorAll(`.btn-delete-stock-category`).forEach(e=>{e.addEventListener(`click`,async()=>g($,async r=>{let{writeBatch:i}=_(r),a=e.dataset.id;if(n.find(e=>e.id===a))try{let e=new Date,n=i(s);if(y.filter(e=>e.groupId===a).forEach(r=>{n.update(t(s,`meatTypes`,r.id),{groupId:null,groupSortOrder:0,updatedAt:e})}),await n.commit(),await A(b.filter(e=>e.id!==a),r),!r.isCurrent())return;await Ae()}catch(e){console.error(`[meat] stock category delete failed:`,e),alert(`카테고리 삭제 실패: `+(e.message||e))}},{roles:[`admin`,`office`]}))})}function X(e={}){let{categoryFilter:n=null}=e,r=n||`meat`,i=r===`meat`&&(l===`admin`||l===`office`),a=y.filter(e=>te(e.id)===r),c=r===`produce`,d=c?`채소/과일`:`원육`,f=c?`채소/과일 종류 관리`:`원육 종류 관리`,p=c?`g`:`kg`;Q(`
    <h3 class="modal-title">${f}</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>${d}명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(${p})</th>
            <th>\uD65C\uC131</th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${a.map(e=>{let t=e.active!==!1,n=c?e.minimumQtyG||0:((e.minimumQtyG||0)/1e3).toFixed(1);return`
              <tr class="${t?``:`inactive-master`}" data-id="${e.id}">
                <td class="master-table-drag-cell">
                  ${i?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
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
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 ${d} 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>${d}명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(${p})</label>
          <input type="number" id="m_newMinQty" placeholder="${c?`예: 500`:`예: 5`}" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),je(),document.querySelectorAll(`.m-unit-weight`).forEach(e=>{e.addEventListener(`change`,async e=>g($,async n=>{let{updateDoc:r}=_(n),i=e.target.dataset.id,a=y.find(e=>e.id===i),o=a?.defaultUnitWeightG,c=parseFloat(e.target.value);if(!isFinite(c)||c<=0){alert(`기본 단위중량은 양수(g)여야 합니다.`),e.target.value=o??``;return}try{await r(t(s,`meatTypes`,i),{defaultUnitWeightG:c,updatedAt:new Date}),a&&(a.defaultUnitWeightG=c)}catch(t){console.error(`[meat] defaultUnitWeightG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=o??``}},{roles:[`admin`,`office`]}))}),document.querySelectorAll(`.m-min-qty`).forEach(e=>{e.addEventListener(`change`,async e=>g($,async n=>{let{updateDoc:r}=_(n),i=e.target.dataset.id,a=y.find(e=>e.id===i),o=a?.minimumQtyG??0,l=parseFloat(e.target.value);if(!isFinite(l)||l<0){alert(`최소재고는 0 이상(${p})이어야 합니다.`),e.target.value=c?o:(o/1e3).toFixed(1);return}let u=Math.round(c?l:l*1e3);try{await r(t(s,`meatTypes`,i),{minimumQtyG:u,updatedAt:new Date}),a&&(a.minimumQtyG=u)}catch(t){console.error(`[meat] minimumQtyG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=c?o:(o/1e3).toFixed(1)}},{roles:[`admin`,`office`]}))}),document.querySelectorAll(`.m-active-toggle`).forEach(n=>{n.addEventListener(`change`,async n=>g($,async r=>{let{updateDoc:i,recordActivity:a}=_(r),o=n.target.dataset.id,c=n.target.checked,l=y.find(e=>e.id===o),d=l?.active!==!1;try{if(await i(t(s,`meatTypes`,o),{active:c,updatedAt:new Date}),l&&(l.active=c),d!==c&&await a({action:`meat`,subAction:`activeToggle`,date:u(),staff:Ie(),message:`Meat type ${c?`active`:`inactive`} — ${l?.name||o}`,details:{meatTypeId:o,meatName:l?.name||``,active:c}}),!r.isCurrent()||(closeModal(),!r.isCurrent()))return;X(e)}catch(e){console.error(`[meat] active save failed:`,e),alert(`Save failed: `+(e.message||e)),n.target.checked=!c}},{roles:[`admin`,`office`]}))}),document.getElementById(`btnAddMeatType`).addEventListener(`click`,async()=>g($,async t=>{let{addDoc:n}=_(t),i=document.getElementById(`m_newMeatName`).value.trim(),a=parseFloat(document.getElementById(`m_newUnitWeight`).value)||0,l=parseFloat(document.getElementById(`m_newMinQty`).value)||0,u=r;if(!i){alert(`${d}명은 필수입니다.`);return}await n(o(s,`meatTypes`),{name:i,defaultUnitWeightG:a,minimumQtyG:Math.round(c?l:l*1e3),category:u,sortOrder:y.length,active:!0,showInStats:!0,createdAt:new Date,updatedAt:new Date}),y=await O(),t.isCurrent()&&(closeModal(),t.isCurrent()&&X(e))},{roles:[`admin`,`office`]}))}function je(){if(Me(),l!==`admin`&&l!==`office`)return;let e=document.getElementById(`meatTypesList`);e&&(S=m.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await Ne()}}))}function Me(){if(S){try{S.destroy()}catch(e){console.warn(`[meat] sortable destroy skipped:`,e)}S=null}}async function Ne(){return g($,async e=>{let{writeBatch:n}=_(e),r=document.getElementById(`meatTypesList`);if(!r)return;let i=Array.from(r.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id).filter(Boolean),a=new Date,o=n(s);i.forEach((e,n)=>{o.update(t(s,`meatTypes`,e),{sortOrder:n,updatedAt:a})});try{await o.commit();let e=new Map(i.map((e,t)=>[e,t]));y=y.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:a}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(t){if(console.error(`[meat] reorder save failed:`,t),alert(`순번 저장 실패: `+(t.message||t)),y=await O(),!e.isCurrent()||(closeModal(),!e.isCurrent()))return;X()}},{roles:[`admin`,`office`]})}function Pe(){let e=[`#e8f4ea`,`#e8eef8`,`#fef0e8`,`#f0e8fe`,`#fff0e8`,`#e8f8f4`];return e[Math.floor(Math.random()*e.length)]}var Fe={};function Ie(){return l===`admin`?`대표`:l===`office`?`사무실`:l===`production`?`생산실`:`시스템`}function Z(e){let t=``;for(let n of e)(Fe[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`meat`,function(){Me();let e=document.getElementById(`modalOverlay`);e&&e.remove()});var $=f(`meat`);$.refresh=D;var Le=null;async function Re({force:e=!1}={}){let t=x===`produce`?`frozen`:x;t!==Le&&(Le=t,e||=!$.prepare);let n=await $.load(e=>ze(e,t),{key:t,force:e,onChange:h($,D)});return n&&(y=n.types,b=n.categories,Fe=n.staff),n}async function ze(e,t){let[n,r,i,a,o]=await Promise.all([O(e),k(e),v(e),R(t,e),oe(t,e)]);return{types:n,categories:r,staff:i,stocks:a,logs:o}}function Be({cacheOnly:e=!0,stage:t=`frozen`}={}){return $.prepare?.(t,e=>ze(e,t),{cacheOnly:e})}export{Be as preparePage,D as renderMeat};