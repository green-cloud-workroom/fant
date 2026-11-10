import{a as e,b as t,c as n,d as r,g as i,m as a,s as o,u as s,y as c}from"./index.esm-D8prxbkJ.js";import{n as l}from"./firebase-BOShkvR0.js";import{i as u}from"./staffText-DBRrEFyl.js";import{n as d}from"./modalManager-D53QKIlh.js";import{A as f,O as p,lt as m,st as h,tt as g,ut as _,v}from"./index-Bh9FXGZY.js";import{o as y}from"./manualMovementLogic-QqxDPXEB.js";import{t as b}from"./movementNote-mZSZ7bXO.js";import{t as x}from"./statusToast-B9R20x7w.js";import{i as S,n as C,r as ee,t as w}from"./movementForm-DmFHTy5B.js";import{t as te}from"./statsAutomationRuntime-CEwlVDfy.js";import{t as T}from"./closingGuard-zKXRPjFY.js";import{t as ne}from"./sortable-DorCW0pf.js";import{t as re}from"./pageRefresh-z5GoWSTh.js";import"./meatLogs-Dy6PEfZP.js";import{t as E}from"./pageCommand-DMcws7c_.js";import{t as D}from"./commandWrites-Bp-R1mHU.js";import{n as ie,t as ae}from"./atomicStockOperation-MQLQNoWw.js";import{t as oe}from"./pageStaff-D2JwyrmN.js";var O=[],k=[],A=`frozen`,j=null,se=[],ce=null,M=new Set,le=new Map,ue=new Set,N=100,de=new Map,fe=new Map,P=new Map,pe=null,me=0;function he(){de.clear(),P.clear(),me++}h.onClear(()=>{he(),fe.clear(),pe=null});async function ge({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=f();pe!==n&&(pe=n),he(),t.innerHTML=`<p style="padding:24px">원료 재고 로딩 중...</p>`,await mt({force:e}),f()?.isCurrent()&&await Ke()}async function F(t={getDocs:o,getDoc:e}){let n=r(c(l,`meatTypes`),s(`sortOrder`));return(await t.getDocs(n)).docs.map(e=>({id:e.id,...e.data()}))}function _e(e){return(Array.isArray(e)?e:[]).map((e,t)=>({id:String(e?.id||``).trim(),name:String(e?.name||``).trim(),sortOrder:Number.isFinite(Number(e?.sortOrder))?Number(e.sortOrder):t,scope:e?.scope===`produce`?`produce`:`meat`})).filter(e=>e.id&&e.name).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)||e.name.localeCompare(t.name,`ko`))}async function I(n={getDocs:o,getDoc:e}){let r=await n.getDoc(t(l,`settings`,`meatStockCategories`));return r.exists()?_e(r.data().groups):[]}async function L(e,n){if(!n)return R(async t=>(await L(e,t),await z(t),!0));let r=_e(e).map((e,t)=>({...e,sortOrder:t})),i=t(l,`settings`,`meatStockCategories`),a=p(k);await n.transaction(l,async e=>{let t=await e.get(i);if(p(_e(t.exists()?t.data().groups:[]))!==a)throw Error(`다른 작업으로 카테고리가 변경되었습니다. 최신 자료를 다시 불러와주세요.`);e.set(i,{groups:r,updatedAt:new Date},{merge:!0})},{targets:[i]}),k=r}var ve=Promise.resolve();function R(e){let t=f(),n=ve.then(()=>{if(!(t&&!t.isCurrent()))return E($,e,{roles:[`admin`,`office`]})});return ve=n.catch(()=>{}),n}async function z(e,t=O,n=k){if(!e.isCurrent())return;let r=p({types:t,categories:n});try{if(await mt({force:!0}),p({types:O,categories:k})!==r)throw Error(`저장은 완료됐지만 다른 품목 변경도 확인됐습니다. 입력을 보존한 뒤 최신 자료를 다시 불러와주세요.`)}catch(e){throw $.blocked=!0,e}}function ye(){return A===`produce`?`produce`:`meat`}function B(e=ye()){return k.filter(t=>(t.scope||`meat`)===e)}function be(){return O.filter(e=>e.active!==!1)}function xe(e){return O.find(t=>t.id===e)?.category||`meat`}function V(e){return xe(e)===`produce`}function Se(e){return!V(e.meatTypeId)}function Ce(e){return V(e.meatTypeId)}function we(e){return!V(e.meatTypeId)}function Te(e){return V(e.meatTypeId)}async function Ee(t,a={getDocs:o,getDoc:e}){let u=r(c(l,`meatLogs`),i(`stage`,`==`,t),s(`timestamp`,`desc`),n(N)),d=await a.getDocs(u);return fe.set(t,d.docs.at(-1)||null),d.docs.map(e=>({id:e.id,...e.data()}))}function De(e){return{frozenIncoming:`입고`,incomingQuantityCorrection:`입고량 이력 정정 · 재고 변동 없음`,frozenOut:`전처리로 출고`,processedIn:`전처리`,processedOut:`재포장으로 출고`,repackedIn:`재포장`,repackedOut:`출고`,productionDeduct:`생산차감`,productionRollback:`생산복원`,adjust:`수동조정`}[e]||`작업 구분 확인 필요`}function Oe(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function ke(e){return typeof e==`number`?`${e>0?`+`:``}${(e/1e3).toFixed(2)}kg`:`-`}async function H(t,n={getDocs:o,getDoc:e}){let i=r(c(l,`meatStocks`),s(`incomingDate`));return(await n.getDocs(i)).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.stage===t&&!e.closed)}function Ae(e,t){let n=O.find(e=>e.id===t)?.minimumQtyG||0;return n<=0?`#1a1a1a`:e<n?`#e53e3e`:e<n*1.5?`#dd6b20`:`#1a1a1a`}function je(e){let t=new Map;return(e||[]).forEach(e=>{let n=e.meatTypeId||e.meatNameSnapshot||e.id,r=t.get(n);r?(r.totalG+=Number(e.remaining||0),r.lots.push(e)):t.set(n,{name:e.meatNameSnapshot||`원료`,totalG:Number(e.remaining||0),meatTypeId:e.meatTypeId,lots:[e]})}),t}function U(e=``){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function Me(){return`cat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}function Ne(e){return O.find(t=>t.id===e)?.groupId||null}function W(e){let t=O.find(t=>t.id===e)?.groupSortOrder;return Number.isFinite(Number(t))?Number(t):2**53-1}function Pe(e){let t=B().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return[...e.values()].forEach(e=>{let t=e.meatTypeId?Ne(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>{let n=W(e.meatTypeId),r=W(t.meatTypeId);return n===r?(e.name||``).localeCompare(t.name||``,`ko`):n-r})}),r.items.length>0?[...t,r]:t}function Fe(e){let t=Ae(e.totalG,e.meatTypeId),n=_===`admin`||_===`office`,r=e.meatTypeId||e.name,i=!M.has(r),a=[...e.lots||[]].sort((e,t)=>{let n=String(e.incomingDate||e.processedDate||e.repackedDate||``),r=String(t.incomingDate||t.processedDate||t.repackedDate||``);return n.localeCompare(r)});return`
    <div class="stock-summary-cell" data-meat-type-id="${U(e.meatTypeId||``)}" data-summary-id="${U(r)}">
      <div class="stock-summary-main">
        ${n?`<span class="stock-summary-drag-handle" style="cursor:grab;color:#bbb;font-size:11px;flex-shrink:0;">::</span>`:``}
        <span style="color:#888;font-size:11px;flex-shrink:0;width:10px;text-align:center;">${i?`-`:`+`}</span>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">${U(e.name)}</span>
        <b style="color:${t};font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${(e.totalG/1e3).toFixed(2)}kg</b>
      </div>
      ${i?`
        <div class="stock-summary-lots">
          ${a.map(t=>{let n=t.incomingDate||t.processedDate||t.repackedDate||`-`,r=t.remaining<0?`#e53e3e`:`#333`;return`
              <div class="stock-summary-lot">
                <div style="display:flex;align-items:center;gap:5px;">
                  <span style="color:#777;font-size:11px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${U(n)}</span>
                  <b style="color:${r};font-size:11px;white-space:nowrap;">${(Number(t.remaining||0)/1e3).toFixed(2)}kg</b>
                  <button class="btn-adjust stock-summary-adjust" data-id="${U(t.id)}" data-name="${U(t.meatNameSnapshot||e.name||``)}" data-remaining="${U(t.remaining)}">&#51312;&#51221;</button>
                </div>
              </div>
            `}).join(``)}
        </div>
      `:``}
    </div>
  `}function G(e){let t=je(e),n=Pe(t);le=new Map([...t.values()].map(e=>[e.meatTypeId||e.name,e]));let r=_===`admin`||_===`office`;return`
    <div class="stock-summary-wrap" style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:13px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <div style="color:#666;font-weight:600;">원료별 합계</div>
        ${r?`<button type="button" class="btn-secondary" id="btnMeatStockCategories" style="padding:4px 8px;font-size:12px;">카테고리 관리</button>`:``}
      </div>
      <div class="stock-summary-columns">
        ${n.map(e=>`
          <div class="stock-summary-category-column" data-category-id="${U(e.id)}" data-virtual="${e.virtual?`true`:`false`}">
            <div class="stock-summary-category-header">
              ${r&&!e.virtual?`<span class="stock-summary-category-handle" style="cursor:grab;color:#aaa;">⠿</span>`:``}
              <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${U(e.name)}</span>
              <span style="font-size:11px;color:#888;">${e.items.length}종</span>
            </div>
            <div class="stock-summary-category-items" data-category-id="${U(e.id)}" style="display:flex;flex-direction:column;gap:4px;min-height:28px;padding:5px;">
              ${e.items.length===0?`<div class="stock-summary-empty" style="font-size:11px;color:#bbb;padding:3px 2px;">비어 있음</div>`:e.items.map(Fe).join(``)}
            </div>
          </div>
        `).join(``)}
      </div>
    </div>
  `}function K(e,t={}){return``}function q(e){if(e?.timestamp?.toMillis)return e.timestamp.toMillis();let t=e?.timestamp instanceof Date?e.timestamp.getTime():new Date(e?.timestamp||0).getTime();return Number.isFinite(t)?t:0}function Ie(e){return e.meatTypeId||`name:`+(e.meatNameSnapshot||`-`)}function Le(e){let t=new Map;return(e||[]).forEach(e=>{let n=Ie(e);t.has(n)||t.set(n,{key:n,meatTypeId:e.meatTypeId||null,name:e.meatNameSnapshot||`-`,latestTime:0,items:[]});let r=t.get(n);r.items.push(e),r.latestTime=Math.max(r.latestTime,q(e))}),[...t.values()].map(e=>({...e,items:e.items.sort((e,t)=>q(t)-q(e))})).sort((e,t)=>{let n=W(e.meatTypeId),r=W(t.meatTypeId);if(n!==r)return n-r;let i=(e.name||``).localeCompare(t.name||``,`ko`);return i===0?t.latestTime-e.latestTime:i})}function Re(e){let t=B().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return(e||[]).forEach(e=>{let t=e.meatTypeId?Ne(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>q(t)-q(e))}),r.items.length>0?[...t,r]:t}function ze(e,t,n){return`<div style="border:1px solid #ececec;border-radius:5px;background:#fff;padding:4px 5px;"><div style="display:flex;align-items:center;gap:5px;min-width:0;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">`+U(e.meatNameSnapshot||t||`-`)+`</span><span style="color:#777;font-size:11px;white-space:nowrap;">`+U(Oe(e.timestamp))+`</span><b style="color:`+(e.delta<0?`#e53e3e`:`#2d7a3a`)+`;font-size:12px;white-space:nowrap;">`+(e.type===`incomingQuantityCorrection`?U(Number(e.originalQtyG/1e3).toLocaleString(`ko-KR`,{maximumFractionDigits:3})+`kg → `+Number(e.correctedQtyG/1e3).toLocaleString(`ko-KR`,{maximumFractionDigits:3})+`kg`):ke(e.delta))+`</b></div><div style="display:flex;justify-content:space-between;gap:6px;margin-top:2px;color:#777;font-size:11px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">`+U(e.staff||`-`)+` / `+U(b(e.reason||`-`,`meatLogs`,n,e=>De(e.type)))+`</span><span style="white-space:nowrap;">`+U(y(e,De(e.type)))+`</span></div></div>`}function Be(e,t,n){let r=[A,e.id,t.key].join(`:`),i=ue.has(r);return`<div class="meat-log-type-group" style="border:1px solid #ececec;border-radius:5px;background:#fff;overflow:hidden;"><button type="button" class="meat-log-type-toggle" data-log-type-id="`+U(r)+`" style="width:100%;border:0;background:#fff;display:flex;align-items:center;gap:5px;padding:5px 6px;cursor:pointer;text-align:left;"><span style="color:#888;font-size:11px;width:10px;text-align:center;flex-shrink:0;">`+(i?`-`:`+`)+`</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;font-size:12px;font-weight:700;flex:1;">`+U(t.name)+`</span><span style="color:#888;font-size:11px;white-space:nowrap;">`+t.items.length+`&#44148;</span></button>`+(i?`<div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid #eee;background:#fafafa;padding:4px;">`+t.items.map(e=>ze(e,t.name,n)).join(``)+`</div>`:``)+`</div>`}function J(e){if(!e||e.length===0)return`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`;let t=Re(e).filter(e=>e.items.length>0);return t.length===0?`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`:`<div class="meat-log-group-wrap" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">`+t.map(t=>{let n=Le(t.items);return`<div class="meat-log-group" style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;"><div style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">`+U(t.name)+`</span><span style="font-size:11px;color:#888;">`+t.items.length+`</span></div><div style="display:flex;flex-direction:column;gap:4px;padding:5px;">`+n.map(n=>Be(t,n,e)).join(``)+`</div></div>`}).join(``)+`</div>`}function Ve(){document.querySelectorAll(`.meat-log-type-toggle`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logTypeId;t&&(ue.has(t)?ue.delete(t):ue.add(t),Y(A))})})}function He(){[...se,ce].filter(Boolean).forEach(e=>{try{e.destroy()}catch(e){console.warn(`[meat] stock summary sortable destroy skipped:`,e)}}),se=[],ce=null}async function Ue(){return E($,async e=>{let{writeBatch:n}=D(e),r=n(l),i=new Date,a=new Map;document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let n=e.dataset.categoryId===`__other__`?null:e.dataset.categoryId;Array.from(e.querySelectorAll(`.stock-summary-cell[data-meat-type-id]`)).forEach((e,o)=>{let s=e.dataset.meatTypeId;s&&(r.update(t(l,`meatTypes`,s),{groupId:n,groupSortOrder:o,updatedAt:i}),a.set(s,{groupId:n,groupSortOrder:o,updatedAt:i}))})}),await r.commit(),O=await F(),e.isCurrent()&&await Y(A)},{roles:[`admin`,`office`]})}async function We(){let e=ye(),t=Array.from(document.querySelectorAll(`.stock-summary-category-column[data-virtual="false"]`)).map(e=>e.dataset.categoryId).filter(Boolean),n=new Map(t.map((e,t)=>[e,t]));await L(k.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)))}function Ge(){He();let e=_===`admin`||_===`office`;if(document.getElementById(`btnMeatStockCategories`)?.addEventListener(`click`,()=>at()),document.querySelector(`.stock-summary-wrap`)?.addEventListener(`click`,e=>{if(!e.target.closest(`.stock-summary-main`)||e.target.closest(`.stock-summary-drag-handle`))return;let t=e.target.closest(`.stock-summary-cell`),n=t?.dataset.summaryId,r=le.get(n);if(!r)return;M.has(n)?M.delete(n):M.add(n),t.insertAdjacentHTML(`afterend`,Fe(r));let i=t.nextElementSibling;t.remove(),i.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>X(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}),!e)return;let t=document.querySelector(`.stock-summary-columns`);t&&(ce=ne.create(t,{animation:150,handle:`.stock-summary-category-handle`,draggable:`.stock-summary-category-column[data-virtual="false"]`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await We()}catch(e){console.error(`[meat] stock category order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(u(e)||e)),k=await I(),Y(A)}}})),document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let t=ne.create(e,{group:`meatStockShared`,animation:150,handle:`.stock-summary-drag-handle`,draggable:`.stock-summary-cell`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await Ue()}catch(e){console.error(`[meat] stock group save failed:`,e),alert(`원료 카테고리 저장 실패: `+(u(e)||e)),O=await F(),Y(A)}}});se.push(t)})}async function Ke(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원료 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${A===`frozen`?`active`:``}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${A===`processed`?`active`:``}" data-tab="processed">전처리</button>
          <button class="tab-btn ${A===`repacked`?`active`:``}" data-tab="repacked">재포장</button>
          <button class="tab-btn ${A===`produce`?`active`:``}" data-tab="produce">채소/과일</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{A=e.dataset.tab,document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),Y(A)})}),await Y(A)}function qe(e,t){let n=t.map(e=>e.id).join(`\0`),r=de.get(e);return(!r||r.firstIds!==n)&&(r={firstIds:n,rows:[...t],ids:new Set(t.map(e=>e.id)),cursorId:t.at(-1)?.id||null,cursor:fe.get(e)?.id===t.at(-1)?.id?fe.get(e):null,exhausted:t.length<N},de.set(e,r)),r}function Je(e,t){return t===`produce`?Te(e):t===`frozen`?we(e):!0}async function Ye(u,d,f,p,m){for(;!p.exhausted&&p.rows.filter(e=>Je(e,d)).length<f;){if(!m())return;let d=p.cursor||await e(t(l,`meatLogs`,p.cursorId));if(!d.exists())throw Error(`이력 위치가 변경되었습니다. 화면을 다시 불러와주세요.`);let f=await o(r(c(l,`meatLogs`),i(`stage`,`==`,u),s(`timestamp`,`desc`),a(d),n(N)));if(!m())return;for(let e of f.docs)p.ids.has(e.id)||(p.ids.add(e.id),p.rows.push({id:e.id,...e.data()}));p.cursorId=f.docs.at(-1)?.id||p.cursorId,p.cursor=f.docs.at(-1)||p.cursor,p.exhausted=f.docs.length<N}}async function Y(e,{moreFrom:t=null}={}){let n=document.getElementById(`tabContent`);if(!n)return;let r=f(),i=++me,a=()=>r?.isCurrent()&&i===me&&A===e&&n.isConnected&&document.getElementById(`tabContent`)===n;t===null&&(n.innerHTML=`<div style="padding:24px;"><p>로딩 중...</p></div>`);try{let r=await mt();if(!r||!a())return;let{stocks:i,logs:o}=r,s=e===`produce`?`frozen`:e,c=qe(s,o),l=P.get(e)||N,u=c.rows.filter(t=>Je(t,e)).slice(0,l);t===null&&(e===`frozen`?Xe(i,u):e===`processed`?Qe(i,u):e===`produce`?Ze(i,u):$e(i,u),Ge(),Ve());let d=n.querySelector(`[data-meat-history-section]`);if(!d)return;let f=()=>{if(!a())return;let n=c.rows.filter(t=>Je(t,e));if((t!==null||p)&&(d.querySelector(`[data-meat-history-content]`).innerHTML=J(n.slice(0,l)),Ve()),d.dataset.meatHistoryState=`ready`,d.querySelector(`[data-meat-log-more]`)?.remove(),d.querySelector(`[data-meat-log-error]`)?.remove(),d.querySelector(`[data-meat-history-retry]`)?.remove(),c.exhausted&&n.length<=l)return;let r=document.createElement(`button`);r.className=`btn-secondary`,r.dataset.meatLogMore=s,r.textContent=`이전 이력 더 보기 (${N}건씩)`,r.style.cssText=`display:block;margin:16px auto;`,r.addEventListener(`click`,async()=>{r.disabled||(r.disabled=!0,P.set(e,l+N),await Y(e,{moreFrom:l}))}),d.appendChild(r)},p=!c.exhausted&&u.length<l;if(!p){f();return}d.dataset.meatHistoryState=`loading`,t===null?d.querySelector(`[data-meat-history-content]`).innerHTML=`<p role="status">이전 이력 조회 중...</p>`:d.querySelector(`[data-meat-history-content]`).insertAdjacentHTML(`beforeend`,`<p role="status" data-meat-history-loading>이전 이력 조회 중...</p>`);let m=Ye(s,e,l,c,a).then(f).catch(n=>{if(t!==null&&P.set(e,t),!a())return;console.error(`[원료 이력]`,n),d.dataset.meatHistoryState=`error`,d.querySelector(`[data-meat-history-loading]`)?.remove(),d.insertAdjacentHTML(`beforeend`,`<p role="alert" data-meat-log-error>이전 이력을 불러오지 못했습니다.</p>`);let r=document.createElement(`button`);r.className=`btn-secondary`,r.textContent=`이력 다시 시도`,r.dataset.meatHistoryRetry=`true`,r.addEventListener(`click`,()=>{t!==null&&P.set(e,t+N),Y(e,{moreFrom:t})}),d.appendChild(r)});t!==null&&await m}catch(r){if(t!==null&&P.set(e,t),!a())return;if(console.error(`[원료 이력]`,r),t!==null){let e=n.querySelector(`[data-meat-log-more]`);e&&(e.disabled=!1);let t=document.createElement(`p`);t.dataset.meatLogError=`true`,t.setAttribute(`role`,`alert`),t.textContent=`이전 이력을 불러오지 못했습니다. 다시 시도해주세요.`,n.querySelector(`[data-meat-log-error]`)?.remove(),n.appendChild(t)}else{n.innerHTML=`<p role="alert">원료 자료를 불러오지 못했습니다.</p>`;let t=document.createElement(`button`);t.className=`btn-secondary`,t.textContent=`다시 시도`,t.addEventListener(`click`,()=>Y(e)),n.appendChild(t)}}}function Xe(e,t){let n=document.getElementById(`tabContent`),r=_===`admin`||_===`office`,i=e.filter(Se),a=t.filter(we),o=je(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${G(i)}
      ${K(i,{emptyText:`등록된 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,typeTotals:o,useTypeColor:!0})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${J(a)}</div>
    </div>
  `,document.getElementById(`btnAddFrozen`).addEventListener(`click`,()=>et()),document.getElementById(`btnMeatTypes`)?.addEventListener(`click`,()=>{if(_!==`admin`&&_!==`office`){alert(`원육 종류 관리는 대표/사무실 계정만 가능합니다.`);return}Z()}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>X(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ze(e,t){let n=document.getElementById(`tabContent`),r=_===`admin`||_===`office`,i=e.filter(Ce),a=t.filter(Te),o=je(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProduce">+ 채소/과일 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnProduceTypes">채소/과일 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${G(i)}
      ${K(i,{emptyText:`등록된 채소/과일 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,showInitial:!0,showStaffNote:!0,typeTotals:o,useTypeColor:!0})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${J(a)}</div>
    </div>
  `,document.getElementById(`btnAddProduce`).addEventListener(`click`,()=>{et({categoryFilter:`produce`,title:`채소/과일 입고 등록`,returnTab:`produce`})}),document.getElementById(`btnProduceTypes`)?.addEventListener(`click`,()=>{if(_!==`admin`&&_!==`office`){alert(`채소/과일 종류 관리는 대표/사무실 계정만 가능합니다.`);return}Z({categoryFilter:`produce`})}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>X(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Qe(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${G(e)}
      ${K(e,{emptyText:`등록된 전처리 재고 없음`,dateField:`processedDate`,dateLabel:`작업일`})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${J(t)}</div>
    </div>
  `,document.getElementById(`btnAddProcessed`).addEventListener(`click`,tt),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>X(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function $e(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${G(e)}
      ${K(e,{emptyText:`등록된 재포장 재고 없음`,dateField:`repackedDate`,dateLabel:`작업일`})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${J(t)}</div>
    </div>
  `,document.getElementById(`btnAddRepacked`).addEventListener(`click`,nt),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>X(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function et(e={}){let{categoryFilter:n=`meat`,title:r=n===`produce`?`채소/과일 입고 등록`:`원육 입고 등록`,returnTab:i=`frozen`}=e,a=n===`produce`?`채소/과일`:`원육`,o=be().filter(e=>n===`produce`?e.category===`produce`:(e.category||`meat`)===`meat`);Q(`
    <h3 class="modal-title">${r}</h3>
    ${C({incoming:!0,reasonField:!1})}
    <div class="form-group">
      <label>${a} 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${o.map(e=>`<option value="${U(e.id)}" data-weight="${U(e.defaultUnitWeightG)}">${U(e.name)}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${g()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ft([`lead`,`office`])}
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
  `);let s=w({db:l,name:`meatLogs`,filter:{},reasonInput:document.getElementById(`m_note`)});document.getElementById(`btnSaveFrozen`).addEventListener(`click`,async()=>E($,async e=>{let{addDoc:n,recordActivity:r,recordMeatLog:o}=D(e),u=ee(s);if(!u)return;let d=document.getElementById(`m_meatType`).value,f=document.getElementById(`m_meatType`),p=f.options[f.selectedIndex]?.text,h=parseFloat(document.getElementById(`m_weight`).value),g=document.getElementById(`m_unit`).value,_=document.getElementById(`m_date`).value,v=document.getElementById(`m_staff`).value,y=document.getElementById(`m_note`).value;if(!d||!h||!_){alert(`${a} 종류, 중량, 날짜는 필수입니다.`);return}if(!(h>0)){alert(`중량은 0보다 커야 합니다.`);return}if(!v){alert(`담당자를 선택해주세요.`);return}if(await T(_,e))return;let b=g===`kg`?h*1e3:h,C=u.kind===`test`?{approved:!0}:await te({itemId:`meatLogs:`+d,name:p,date:_,qty:b/1e3,unit:`kg`,stage:`원료`},e.isCurrent);if(!C.approved)return;let w=t(c(l,`meatStocks`));await S({db:l,command:e,name:`meatLogs`,stockId:w.id,selection:u,uid:m?.uid||null,stockData:{meatTypeId:d,meatNameSnapshot:p,stage:`frozen`,incomingDate:_,initialQtyG:b,remaining:0,staffName:v,note:y,closed:!1,createdAt:new Date},log:{type:`frozenIncoming`,date:_,meatTypeId:d,meatNameSnapshot:p,stage:`frozen`,meatStockId:w.id,delta:b,staff:v,reason:y||null,...C.review?{statsQuantityReview:C.review}:{}}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(Y(i),x(`입고 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function tt(){Q(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${be().map(e=>`<option value="${U(e.id)}" data-weight="${U(e.defaultUnitWeightG)}">${U(e.name)}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${g()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ft([`lead`,`office`])}
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveProcessed`).addEventListener(`click`,async()=>E($,async e=>{let{addDoc:n,updateDoc:r,recordMeatLog:i}=D(e),a=document.getElementById(`m_meatType`).value,o=document.getElementById(`m_meatType`),s=o.options[o.selectedIndex]?.text,u=parseFloat(document.getElementById(`m_unitWeight`).value),d=parseInt(document.getElementById(`m_count`).value),f=document.getElementById(`m_date`).value,p=document.getElementById(`m_staff`).value,m=document.getElementById(`m_note`).value;if(!a||!u||!d||!f){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(u>0)||!(d>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!p){alert(`담당자를 선택해주세요.`);return}if(await T(f,e))return;let h=u*d,g=await H(`frozen`);await ae({db:l,command:e,operationId:ie(l,document.getElementById(`btnSaveProcessed`)),actionType:`meatProcessed`,date:f,request:{meatTypeId:a,totalG:h,unitWeight:u,count:d,staff:p,note:m},inputs:{meatStocks:g.filter(e=>e.meatTypeId===a)},build:async({writer:e,fresh:n})=>{let{addDoc:r,updateDoc:i,recordMeatLog:o}=e,g=n.meatStocks.filter(e=>e.meatTypeId===a&&e.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``)),_=g.reduce((e,t)=>e+t.remaining,0);if(_<h)throw Error(`냉동창고 잔량이 부족합니다.\n${s}: 필요 ${(h/1e3).toFixed(1)}kg / 현재 ${(_/1e3).toFixed(1)}kg`);let v=Date.now().toString(),y=lt(),b=h;for(let e of g){if(b<=0)break;let n=Math.min(e.remaining,b),r=e.remaining-n;await i(t(l,`meatStocks`,e.id),{remaining:r,closed:r===0,updatedAt:new Date}),await o({type:`frozenOut`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`frozen`,meatStockId:e.id,delta:-n,before:e.remaining,after:r,staff:p,reason:`전처리 등록 자동차감`,batchId:v}),b-=n}await o({type:`processedIn`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`processed`,meatStockId:(await r(c(l,`meatStocks`),{meatTypeId:a,meatNameSnapshot:s,stage:`processed`,incomingDate:f,processedDate:f,unitWeightG:u,unitCount:d,initialQtyG:h,remaining:h,batchId:v,batchColor:y,staffName:p,note:m,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:h,before:0,after:h,staff:p,reason:m||null,batchId:v})}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(Y(`processed`),x(`전처리 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function nt(){Q(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${be().map(e=>`<option value="${U(e.id)}" data-weight="${U(e.defaultUnitWeightG)}">${U(e.name)}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${g()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${ft([`lead`,`office`])}
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveRepacked`).addEventListener(`click`,async()=>E($,async e=>{let{addDoc:n,updateDoc:r,recordMeatLog:i}=D(e),a=document.getElementById(`m_meatType`).value,o=document.getElementById(`m_meatType`),s=o.options[o.selectedIndex]?.text,u=parseFloat(document.getElementById(`m_unitWeight`).value),d=parseInt(document.getElementById(`m_count`).value),f=document.getElementById(`m_date`).value,p=document.getElementById(`m_staff`).value,m=document.getElementById(`m_note`).value;if(!a||!u||!d||!f){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(u>0)||!(d>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!p){alert(`담당자를 선택해주세요.`);return}if(await T(f,e))return;let h=u*d,g=(await H(`repacked`)).find(e=>e.meatTypeId===a&&e.remaining>0);if(g){alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${s}: 기존 잔량 ${(g.remaining/1e3).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);return}let _=(await H(`processed`)).filter(e=>e.meatTypeId===a);await ae({db:l,command:e,operationId:ie(l,document.getElementById(`btnSaveRepacked`)),actionType:`meatRepacked`,date:f,request:{meatTypeId:a,totalG:h,unitWeight:u,count:d,staff:p,note:m},inputs:{meatStocks:_},build:async({writer:e,fresh:n})=>{let{addDoc:r,updateDoc:i,recordMeatLog:o}=e,g=n.meatStocks;if(_.some(e=>(g.find(t=>t.id===e.id)?.remaining??0)!==e.remaining))throw Error(`전처리 재고가 변경되었습니다. 활성 재포장 행을 다시 확인해주세요.`);let v=g.filter(e=>e.meatTypeId===a&&e.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)),y=v.reduce((e,t)=>e+t.remaining,0);if(y<h)throw Error(`전처리 잔량이 부족합니다.\n${s}: 필요 ${(h/1e3).toFixed(1)}kg / 현재 ${(y/1e3).toFixed(1)}kg`);let b=Date.now().toString(),x=lt(),S=h;for(let e of v){if(S<=0)break;let n=Math.min(e.remaining,S),r=e.remaining-n;await i(t(l,`meatStocks`,e.id),{remaining:r,closed:r===0,updatedAt:new Date}),await o({type:`processedOut`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`processed`,meatStockId:e.id,delta:-n,before:e.remaining,after:r,staff:p,reason:`재포장 등록 자동차감`,batchId:b}),S-=n}await o({type:`repackedIn`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`repacked`,meatStockId:(await r(c(l,`meatStocks`),{meatTypeId:a,meatNameSnapshot:s,stage:`repacked`,incomingDate:f,repackedDate:f,unitWeightG:u,unitCount:d,initialQtyG:h,remaining:h,batchId:b,batchColor:x,staffName:p,note:m,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:h,before:0,after:h,staff:p,reason:m||null,batchId:b})}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(Y(`repacked`),x(`재포장 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function X(e,n,r){Q(`
    <h3 class="modal-title">수동 재고 조정 — ${U(n)}</h3>
    ${C({reasonField:!1})}
    <p style="font-size:12px;color:#888;margin-bottom:16px;">기존 잔량: <strong>${(r/1e3).toFixed(1)}kg</strong> (${U(r)}g)</p>
    <div class="form-group" id="m_usageGroup" hidden style="display:none">
      <label>사용량 (g) *</label>
      <input type="number" id="m_usageQty" min="0" step="any" placeholder="사용한 중량(g) 입력" />
      <p id="m_usagePreview" style="font-size:12px;color:#666"></p>
    </div>
    <div class="form-group" id="m_remainingGroup">
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
        ${ft([`lead`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);let i=()=>{let e=document.getElementById(`movement_kind`).value===`usage`;for(let[t,n]of[[`m_usageGroup`,e],[`m_remainingGroup`,!e]]){let e=document.getElementById(t);e.hidden=!n,e.style.display=n?`block`:`none`}let t=document.getElementById(`m_usageQty`);document.getElementById(`m_usagePreview`).textContent=t.value===``?``:`남은 재고: ${r-Number(t.value)}g`};document.getElementById(`movement_kind`).addEventListener(`change`,i),document.getElementById(`m_usageQty`).addEventListener(`input`,i);let a=w({db:l,name:`meatLogs`,filter:{meatStockId:e},onCancel:e=>{document.getElementById(`m_actualRemaining`).value=r+e},reasonInput:document.getElementById(`m_adjustReason`)});document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>E($,async i=>{let{getDoc:o,updateDoc:s,recordActivity:c,recordMeatLog:u}=D(i),d=ee(a);if(!d)return;let f=document.getElementById(d.kind===`usage`?`m_usageQty`:`m_actualRemaining`).value,p=d.reason,h=document.getElementById(`m_staff`).value;if(f===``||isNaN(parseFloat(f))){alert(d.kind===`usage`?`사용량을 입력해주세요.`:`실제 잔량을 입력해주세요.`);return}let _=Number(f);if(!Number.isFinite(_)||_<0||d.kind===`usage`&&_===0){alert(`유효한 수량을 입력해주세요.`);return}let v=d.kind===`usage`?r-_:_;if(v<0){alert(`실제 잔량은 0 이상이어야 합니다.
잔량이 음수가 될 수 없습니다.`);return}if(!h){alert(`담당자는 필수입니다.`);return}let y=v-r;if(y===0){alert(`기존 잔량과 동일합니다. 변경할 값을 입력해주세요.`);return}let b=g();if(await T(b,i))return;let C=await o(t(l,`meatStocks`,e)),w=C.exists()?C.data():{},te=w.meatTypeId||null;await S({db:l,command:i,name:`meatLogs`,stockId:e,selection:d,expectedBefore:r,uid:m?.uid||null,log:{type:`adjust`,date:b,meatTypeId:te,meatNameSnapshot:n,stage:w.stage||`frozen`,meatStockId:e,delta:y,staff:h,reason:p}}),i.isCurrent()&&(closeModal(),i.isCurrent()&&(Y(A),x(`조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function rt(){let e=B();return e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">등록된 카테고리 없음</td></tr>`:e.map(e=>{let t=O.filter(t=>t.groupId===e.id).length;return`
      <tr data-id="${U(e.id)}">
        <td class="master-table-drag-cell">
          <span class="drag-handle" title="순서 변경" aria-label="순서 변경">⠿</span>
        </td>
        <td>
          <input type="text" class="stock-category-name" data-id="${U(e.id)}" value="${U(e.name)}"
                 style="width:100%;padding:5px 6px;" />
        </td>
        <td style="text-align:right;color:#666;">${t}</td>
        <td>
          <button type="button" class="btn-secondary btn-delete-stock-category" data-id="${U(e.id)}">삭제</button>
        </td>
      </tr>
    `}).join(``)}async function it(){O=await F(),k=await I(),await Y(A),at()}function at(){if(_!==`admin`&&_!==`office`){alert(`카테고리 관리는 대표/사무실 계정만 가능합니다.`);return}Q(`
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
          ${rt()}
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
  `);let e=ye(),n=B(e),r=document.getElementById(`meatStockCategoryList`);r&&n.length>0&&ne.create(r,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{let t=Array.from(r.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id),n=new Map(t.map((e,t)=>[e,t]));try{if(!await L(k.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t)))return;await Y(A)}catch(e){console.error(`[meat] stock category modal order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(u(e)||e)),k=await I(),at()}}}),document.querySelectorAll(`.stock-category-name`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,r=e.target.value.trim(),i=n.find(e=>e.id===t);if(i){if(!r){alert(`카테고리명을 입력해주세요.`),e.target.value=i.name;return}try{await R(async n=>{if(e.target.isConnected)return await L(k.map(e=>e.id===t?{...e,name:r}:e),n),await z(n),!0})&&await Y(A)}catch(t){console.error(`[meat] stock category rename failed:`,t),alert(`카테고리명 저장 실패: `+(u(t)||t)),e.target.value=i.name}}})}),document.getElementById(`btnAddStockCategory`)?.addEventListener(`click`,async()=>{let t=document.getElementById(`newStockCategoryName`).value.trim();if(!t){alert(`카테고리명을 입력해주세요.`);return}let r=[...k,{id:Me(),name:t,sortOrder:n.length,scope:e}];try{if(!await L(r))return;await it()}catch(e){console.error(`[meat] stock category add failed:`,e),alert(`카테고리 추가 실패: `+(u(e)||e))}}),document.querySelectorAll(`.btn-delete-stock-category`).forEach(e=>{e.addEventListener(`click`,async()=>E($,async r=>{let{writeBatch:i}=D(r),a=e.dataset.id;if(n.find(e=>e.id===a))try{let e=new Date,n=i(l);if(O.filter(e=>e.groupId===a).forEach(r=>{n.update(t(l,`meatTypes`,r.id),{groupId:null,groupSortOrder:0,updatedAt:e})}),await n.commit(),await L(k.filter(e=>e.id!==a),r),!r.isCurrent())return;await it()}catch(e){console.error(`[meat] stock category delete failed:`,e),alert(`카테고리 삭제 실패: `+(u(e)||e))}},{roles:[`admin`,`office`]}))})}function Z(e={}){let{categoryFilter:n=null}=e,r=n||`meat`,i=r===`meat`&&(_===`admin`||_===`office`),a=O.filter(e=>xe(e.id)===r),o=r===`produce`,s=o?`채소/과일`:`원육`,d=o?`채소/과일 종류 관리`:`원육 종류 관리`,m=o?`g`:`kg`;Q(`
    <h3 class="modal-title">${d}</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>${s}명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(${m})</th>
            <th>\uD65C\uC131</th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${a.map(e=>{let t=e.active!==!1,n=o?e.minimumQtyG||0:((e.minimumQtyG||0)/1e3).toFixed(1);return`
              <tr class="${t?``:`inactive-master`}" data-id="${U(e.id)}">
                <td class="master-table-drag-cell">
                  ${i?`<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>`:``}
                </td>
                <td>
                  ${U(e.name)}
                  ${t?``:`<span class="tag tag-inactive" style="margin-left:6px;">비활성</span>`}
                </td>
                <td>
                  <input type="number" class="m-unit-weight" data-id="${U(e.id)}"
                         value="${U(e.defaultUnitWeightG)}" min="1" step="any"
                         style="width:70px;padding:3px 4px;text-align:right;" />
                </td>
                <td>
                  <input type="number" class="m-min-qty" data-id="${U(e.id)}"
                         value="${U(n)}" min="0" step="any"
                         style="width:70px;padding:3px 4px;text-align:right;" />
                </td>
                <td>
                  <label class="toggle-switch" title="${t?`활성`:`비활성`}">
                    <input type="checkbox" class="m-active-toggle" data-id="${U(e.id)}" ${t?`checked`:``}>
                    <span class="toggle-slider"></span>
                  </label>
                </td>
              </tr>
            `}).join(``)}
        </tbody>
      </table>
    </div>
    <div style="background:#f9f9f9;border-radius:6px;padding:14px;border:1px solid #eee;">
      <p style="font-size:12px;font-weight:600;margin-bottom:10px;">새 ${s} 종류 추가</p>
      <div class="form-row">
        <div class="form-group">
          <label>${s}명 *</label>
          <input type="text" id="m_newMeatName" placeholder="예: 닭가슴살" />
        </div>
        <div class="form-group">
          <label>기본 단위중량(g)</label>
          <input type="number" id="m_newUnitWeight" placeholder="예: 500" />
        </div>
        <div class="form-group">
          <label>최소재고(${m})</label>
          <input type="number" id="m_newMinQty" placeholder="${o?`예: 500`:`예: 5`}" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),ot();let h=f(),v=(e,n,r)=>{let i=e.dataset.id;return R(async a=>{if(!e.isConnected||h&&!h.isCurrent())return;let o=O.find(e=>e.id===i),s=t(l,`meatTypes`,i),c={[n]:r,updatedAt:new Date};await a.transaction(l,async e=>{let t=await e.get(s);if(!o||!t.exists()||p({id:t.id,...t.data()})!==p(o))throw Error(`다른 작업으로 원본이 변경되었습니다. 입력을 보존한 뒤 최신 자료를 다시 불러와주세요.`);e.update(s,c)},{targets:[s]}),await z(a,O.map(e=>e.id===i?{...e,...c}:e))})};document.querySelectorAll(`.m-unit-weight`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,n=O.find(e=>e.id===t)?.defaultUnitWeightG,r=parseFloat(e.target.value);if(!isFinite(r)||r<=0){alert(`기본 단위중량은 양수(g)여야 합니다.`),e.target.value=n??``;return}return v(e.target,`defaultUnitWeightG`,r)})}),document.querySelectorAll(`.m-min-qty`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,n=O.find(e=>e.id===t)?.minimumQtyG??0,r=parseFloat(e.target.value);if(!isFinite(r)||r<0){alert(`최소재고는 0 이상(${m})이어야 합니다.`),e.target.value=o?n:(n/1e3).toFixed(1);return}let i=Math.round(o?r:r*1e3);return v(e.target,`minimumQtyG`,i)})}),document.querySelectorAll(`.m-active-toggle`).forEach(e=>{e.addEventListener(`change`,async e=>{let n=e.target.dataset.id,r=e.target.checked;return R(async i=>{let{updateDoc:a,recordActivity:o}=D(i),s=O.find(e=>e.id===n),c=s?.active!==!1;try{let u={active:r,updatedAt:new Date};if(await a(t(l,`meatTypes`,n),u),s&&Object.assign(s,u),c!==r&&await o({action:`meat`,subAction:`activeToggle`,date:g(),staff:dt(),message:`원료 ${r?`사용 시작`:`사용 중지`} — ${s?.name||`원료명 확인 필요`}`,details:{meatTypeId:n,meatName:s?.name||``,active:r}}),await z(i),!i.isCurrent())return;let d=e.target.closest(`tr`),f=e.target.closest(`label`);d?.classList.toggle(`inactive-master`,!r),f&&(f.title=r?`활성`:`비활성`);let p=d?.querySelector(`.tag-inactive`);if(r)p?.remove();else if(d&&!p){let e=document.createElement(`span`);e.className=`tag tag-inactive`,e.style.marginLeft=`6px`,e.textContent=`비활성`,d.children[1].append(e)}}catch(t){console.error(`[meat] active save failed:`,t),alert(`저장 중 오류가 발생했습니다: `+(u(t)||t)),i.committed||(e.target.checked=!r)}})})}),document.getElementById(`btnAddMeatType`).addEventListener(`click`,async()=>R(async t=>{let{addDoc:n}=D(t),i=document.getElementById(`m_newMeatName`).value.trim(),a=parseFloat(document.getElementById(`m_newUnitWeight`).value)||0,u=parseFloat(document.getElementById(`m_newMinQty`).value)||0,d=r;if(!i){alert(`${s}명은 필수입니다.`);return}let f={name:i,defaultUnitWeightG:a,minimumQtyG:Math.round(o?u:u*1e3),category:d,sortOrder:Math.max(-1,...O.map(e=>Number(e.sortOrder)||0))+1,active:!0,showInStats:!0,createdAt:new Date,updatedAt:new Date},p=await n(c(l,`meatTypes`),f);await z(t,[...O,{id:p.id,...f}]),t.isCurrent()&&(closeModal(),t.isCurrent()&&Z(e))}))}function ot(){if(st(),_!==`admin`&&_!==`office`)return;let e=document.getElementById(`meatTypesList`);e&&(j=ne.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await ct()}}))}function st(){if(j){try{j.destroy()}catch(e){console.warn(`[meat] sortable destroy skipped:`,e)}j=null}}async function ct(){return R(async e=>{let{writeBatch:n}=D(e),r=document.getElementById(`meatTypesList`);if(!r)return;let i=Array.from(r.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id).filter(Boolean),a=new Date,o=n(l);i.forEach((e,n)=>{o.update(t(l,`meatTypes`,e),{sortOrder:n,updatedAt:a})});try{await o.commit();let t=new Map(i.map((e,t)=>[e,t]));O=O.map(e=>t.has(e.id)?{...e,sortOrder:t.get(e.id),updatedAt:a}:e).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)),await z(e)}catch(t){if(console.error(`[meat] reorder save failed:`,t),alert(`순번 저장 실패: `+(u(t)||t)),O=await F(),!e.isCurrent()||(closeModal(),!e.isCurrent()))return;Z()}},{roles:[`admin`,`office`]})}function lt(){let e=[`#e8f4ea`,`#e8eef8`,`#fef0e8`,`#f0e8fe`,`#fff0e8`,`#e8f8f4`];return e[Math.floor(Math.random()*e.length)]}var ut={};function dt(){return _===`admin`?`대표`:_===`office`?`사무실`:_===`production`?`생산실`:`시스템`}function ft(e){let t=``;for(let n of e)(ut[n]||[]).forEach(e=>{t+=`<option value="${U(e.name)}">${U(e.name)}</option>`});return t}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}d(`meat`,function(){st();let e=document.getElementById(`modalOverlay`);e&&e.remove()});var $=v(`meat`);$.refresh=ge;var pt=null;async function mt({force:e=!1}={}){let t=A===`produce`?`frozen`:A,n=JSON.stringify([t,N]);n!==pt&&(pt=n,e||=!$.prepare);let r=await $.load(e=>ht(e,t),{key:n,force:e,onChange:re($,ge)});return r&&(O=r.types,k=r.categories,ut=r.staff),r}async function ht(e,t){let[n,r,i,a,o]=await Promise.all([F(e),I(e),oe(e),H(t,e),Ee(t,e)]);return{types:n,categories:r,staff:i,stocks:a,logs:o}}function gt({cacheOnly:e=!0,stage:t=`frozen`}={}){return $.prepare?.(JSON.stringify([t,N]),e=>ht(e,t),{cacheOnly:e})}export{gt as preparePage,ge as renderMeat};