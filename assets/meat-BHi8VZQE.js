import{a as e,b as t,c as n,d as r,g as i,m as a,s as o,u as s,y as c}from"./index.esm-CWp5uCwe.js";import{n as l}from"./firebase-Bm8Fqw4J.js";import{r as u}from"./pageLifecycle-_b6L3DA3.js";import{n as d}from"./modalManager-D53QKIlh.js";import{G as f,H as p,L as m,W as h,f as g}from"./index-Clwx-vcP.js";import"./activityLogs-BD4I99hw.js";import{o as _}from"./manualMovementLogic-CyiPHR26.js";import{i as v,n as y,r as b,t as x}from"./movementForm-bYgru0eq.js";import{t as ee}from"./statsAutomationRuntime-CB6dtjck.js";import{t as S}from"./closingGuard-CrMNvzFI.js";import{t as C}from"./sortable-D_RYdYSn.js";import{t as w}from"./pageRefresh-B3Z8m4hZ.js";import"./meatLogs-Bb6UVQyn.js";import{t as T}from"./pageCommand-CeJK64ur.js";import{t as E}from"./commandWrites-DQhZRqdY.js";import{t as te}from"./pageStaff-DWhJZX5M.js";var D=[],O=[],k=`frozen`,A=null,ne=[],re=null,j=new Set,ie=new Map,M=new Set,N=100,ae=new Map,P=new Map,F=new Map,oe=null,se=0;function ce(){ae.clear(),F.clear(),se++}p.onClear(()=>{ce(),P.clear(),oe=null});async function le({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=u();oe!==n&&(oe=n),ce(),t.innerHTML=`<p style="padding:24px">원료 재고 로딩 중...</p>`,await at({force:e}),u()?.isCurrent()&&await Re()}async function I(t={getDocs:o,getDoc:e}){let n=r(c(l,`meatTypes`),s(`sortOrder`));return(await t.getDocs(n)).docs.map(e=>({id:e.id,...e.data()}))}function ue(e){return(Array.isArray(e)?e:[]).map((e,t)=>({id:String(e?.id||``).trim(),name:String(e?.name||``).trim(),sortOrder:Number.isFinite(Number(e?.sortOrder))?Number(e.sortOrder):t,scope:e?.scope===`produce`?`produce`:`meat`})).filter(e=>e.id&&e.name).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)||e.name.localeCompare(t.name,`ko`))}async function L(n={getDocs:o,getDoc:e}){let r=await n.getDoc(t(l,`settings`,`meatStockCategories`));return r.exists()?ue(r.data().groups):[]}async function R(e,n){if(!n)return T($,t=>R(e,t));let{setDoc:r}=E(n),i=ue(e).map((e,t)=>({...e,sortOrder:t}));await r(t(l,`settings`,`meatStockCategories`),{groups:i,updatedAt:new Date},{merge:!0}),O=i}function de(){return k===`produce`?`produce`:`meat`}function z(e=de()){return O.filter(t=>(t.scope||`meat`)===e)}function fe(){return D.filter(e=>e.active!==!1)}function pe(e){return D.find(t=>t.id===e)?.category||`meat`}function B(e){return pe(e)===`produce`}function me(e){return!B(e.meatTypeId)}function he(e){return B(e.meatTypeId)}function ge(e){return!B(e.meatTypeId)}function _e(e){return B(e.meatTypeId)}async function ve(t,a={getDocs:o,getDoc:e}){let u=r(c(l,`meatLogs`),i(`stage`,`==`,t),s(`timestamp`,`desc`),n(N)),d=await a.getDocs(u);return P.set(t,d.docs.at(-1)||null),d.docs.map(e=>({id:e.id,...e.data()}))}function ye(e){return{frozenIncoming:`입고`,incomingQuantityCorrection:`입고량 이력 정정 · 재고 변동 없음`,frozenOut:`전처리로 출고`,processedIn:`전처리`,processedOut:`재포장으로 출고`,repackedIn:`재포장`,repackedOut:`출고`,productionDeduct:`생산차감`,productionRollback:`생산복원`,adjust:`수동조정`}[e]||e}function be(e){if(!e)return`-`;let t=e.toDate?e.toDate():new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}`}function xe(e){return typeof e==`number`?`${e>0?`+`:``}${(e/1e3).toFixed(2)}kg`:`-`}async function V(t,n={getDocs:o,getDoc:e}){let i=r(c(l,`meatStocks`),s(`incomingDate`));return(await n.getDocs(i)).docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.stage===t&&!e.closed)}function Se(e,t){let n=D.find(e=>e.id===t)?.minimumQtyG||0;return n<=0?`#1a1a1a`:e<n?`#e53e3e`:e<n*1.5?`#dd6b20`:`#1a1a1a`}function Ce(e){let t=new Map;return(e||[]).forEach(e=>{let n=e.meatTypeId||e.meatNameSnapshot||e.id,r=t.get(n);r?(r.totalG+=Number(e.remaining||0),r.lots.push(e)):t.set(n,{name:e.meatNameSnapshot||`원료`,totalG:Number(e.remaining||0),meatTypeId:e.meatTypeId,lots:[e]})}),t}function H(e=``){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function we(){return`cat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}function Te(e){return D.find(t=>t.id===e)?.groupId||null}function U(e){let t=D.find(t=>t.id===e)?.groupSortOrder;return Number.isFinite(Number(t))?Number(t):2**53-1}function Ee(e){let t=z().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return[...e.values()].forEach(e=>{let t=e.meatTypeId?Te(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>{let n=U(e.meatTypeId),r=U(t.meatTypeId);return n===r?(e.name||``).localeCompare(t.name||``,`ko`):n-r})}),r.items.length>0?[...t,r]:t}function De(e){let t=Se(e.totalG,e.meatTypeId),n=f===`admin`||f===`office`,r=e.meatTypeId||e.name,i=!j.has(r),a=[...e.lots||[]].sort((e,t)=>{let n=String(e.incomingDate||e.processedDate||e.repackedDate||``),r=String(t.incomingDate||t.processedDate||t.repackedDate||``);return n.localeCompare(r)});return`
    <div class="stock-summary-cell" data-meat-type-id="${e.meatTypeId||``}" data-summary-id="${H(r)}" style="min-width:0;border:1px solid #e8e8e8;border-radius:5px;padding:0;background:#fff;overflow:hidden;">
      <div class="stock-summary-main" style="display:flex;align-items:center;gap:4px;min-width:0;padding:3px 5px;cursor:pointer;">
        ${n?`<span class="stock-summary-drag-handle" style="cursor:grab;color:#bbb;font-size:11px;flex-shrink:0;">::</span>`:``}
        <span style="color:#888;font-size:11px;flex-shrink:0;width:10px;text-align:center;">${i?`-`:`+`}</span>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">${H(e.name)}</span>
        <b style="color:${t};font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap;">${(e.totalG/1e3).toFixed(2)}kg</b>
      </div>
      ${i?`
        <div class="stock-summary-lots" style="border-top:1px solid #eee;background:#fafafa;padding:4px 5px;display:flex;flex-direction:column;gap:3px;">
          ${a.map(t=>{let n=t.incomingDate||t.processedDate||t.repackedDate||`-`,r=t.remaining<0?`#e53e3e`:`#333`;return`
              <div style="border:1px solid #ececec;border-radius:4px;background:#fff;padding:4px;">
                <div style="display:flex;align-items:center;gap:5px;">
                  <span style="color:#777;font-size:11px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${H(n)}</span>
                  <b style="color:${r};font-size:11px;white-space:nowrap;">${(Number(t.remaining||0)/1e3).toFixed(2)}kg</b>
                  <button class="btn-adjust" data-id="${t.id}" data-name="${H(t.meatNameSnapshot||e.name||``)}" data-remaining="${t.remaining}" style="padding:1px 6px;font-size:11px;">&#51312;&#51221;</button>
                </div>
              </div>
            `}).join(``)}
        </div>
      `:``}
    </div>
  `}function W(e){let t=Ce(e),n=Ee(t);ie=new Map([...t.values()].map(e=>[e.meatTypeId||e.name,e]));let r=f===`admin`||f===`office`;return`
    <div class="stock-summary-wrap" style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:13px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <div style="color:#666;font-weight:600;">원료별 합계</div>
        ${r?`<button type="button" class="btn-secondary" id="btnMeatStockCategories" style="padding:4px 8px;font-size:12px;">카테고리 관리</button>`:``}
      </div>
      <div class="stock-summary-columns" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">
        ${n.map(e=>`
          <div class="stock-summary-category-column" data-category-id="${e.id}" data-virtual="${e.virtual?`true`:`false`}"
               style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">
            <div class="stock-summary-category-header" style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;">
              ${r&&!e.virtual?`<span class="stock-summary-category-handle" style="cursor:grab;color:#aaa;">⠿</span>`:``}
              <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${H(e.name)}</span>
              <span style="font-size:11px;color:#888;">${e.items.length}</span>
            </div>
            <div class="stock-summary-category-items" data-category-id="${e.id}" style="display:flex;flex-direction:column;gap:4px;min-height:28px;padding:5px;">
              ${e.items.length===0?`<div class="stock-summary-empty" style="font-size:11px;color:#bbb;padding:3px 2px;">비어 있음</div>`:e.items.map(De).join(``)}
            </div>
          </div>
        `).join(``)}
      </div>
    </div>
  `}function G(e,t={}){return``}function K(e){if(e?.timestamp?.toMillis)return e.timestamp.toMillis();let t=e?.timestamp instanceof Date?e.timestamp.getTime():new Date(e?.timestamp||0).getTime();return Number.isFinite(t)?t:0}function Oe(e){return e.meatTypeId||`name:`+(e.meatNameSnapshot||`-`)}function ke(e){let t=new Map;return(e||[]).forEach(e=>{let n=Oe(e);t.has(n)||t.set(n,{key:n,meatTypeId:e.meatTypeId||null,name:e.meatNameSnapshot||`-`,latestTime:0,items:[]});let r=t.get(n);r.items.push(e),r.latestTime=Math.max(r.latestTime,K(e))}),[...t.values()].map(e=>({...e,items:e.items.sort((e,t)=>K(t)-K(e))})).sort((e,t)=>{let n=U(e.meatTypeId),r=U(t.meatTypeId);if(n!==r)return n-r;let i=(e.name||``).localeCompare(t.name||``,`ko`);return i===0?t.latestTime-e.latestTime:i})}function Ae(e){let t=z().map(e=>({...e,items:[],virtual:!1})),n=new Map(t.map(e=>[e.id,e])),r={id:`__other__`,name:`기타`,sortOrder:2**53-1,items:[],virtual:!0};return(e||[]).forEach(e=>{let t=e.meatTypeId?Te(e.meatTypeId):null;(t&&n.has(t)?n.get(t):r).items.push(e)}),[...t,r].forEach(e=>{e.items.sort((e,t)=>K(t)-K(e))}),r.items.length>0?[...t,r]:t}function je(e,t){return`<div style="border:1px solid #ececec;border-radius:5px;background:#fff;padding:4px 5px;"><div style="display:flex;align-items:center;gap:5px;min-width:0;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#444;font-size:12px;flex:1;">`+H(e.meatNameSnapshot||t||`-`)+`</span><span style="color:#777;font-size:11px;white-space:nowrap;">`+H(be(e.timestamp))+`</span><b style="color:`+(e.delta<0?`#e53e3e`:`#2d7a3a`)+`;font-size:12px;white-space:nowrap;">`+(e.type===`incomingQuantityCorrection`?H(Number(e.originalQtyG/1e3).toLocaleString(`ko-KR`,{maximumFractionDigits:3})+`kg → `+Number(e.correctedQtyG/1e3).toLocaleString(`ko-KR`,{maximumFractionDigits:3})+`kg`):xe(e.delta))+`</b></div><div style="display:flex;justify-content:space-between;gap:6px;margin-top:2px;color:#777;font-size:11px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">`+H(e.staff||`-`)+` / `+H(e.reason||`-`)+`</span><span style="white-space:nowrap;">`+H(_(e,ye(e.type)))+`</span></div></div>`}function Me(e,t){let n=[k,e.id,t.key].join(`:`),r=M.has(n);return`<div class="meat-log-type-group" style="border:1px solid #ececec;border-radius:5px;background:#fff;overflow:hidden;"><button type="button" class="meat-log-type-toggle" data-log-type-id="`+H(n)+`" style="width:100%;border:0;background:#fff;display:flex;align-items:center;gap:5px;padding:5px 6px;cursor:pointer;text-align:left;"><span style="color:#888;font-size:11px;width:10px;text-align:center;flex-shrink:0;">`+(r?`-`:`+`)+`</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;font-size:12px;font-weight:700;flex:1;">`+H(t.name)+`</span><span style="color:#888;font-size:11px;white-space:nowrap;">`+t.items.length+`&#44148;</span></button>`+(r?`<div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid #eee;background:#fafafa;padding:4px;">`+t.items.map(e=>je(e,t.name)).join(``)+`</div>`:``)+`</div>`}function q(e){if(!e||e.length===0)return`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`;let t=Ae(e).filter(e=>e.items.length>0);return t.length===0?`<div style="text-align:center;color:#aaa;padding:20px;border:1px solid #eee;border-radius:6px;background:#fff;">&#51060;&#47141; &#50630;&#51020;</div>`:`<div class="meat-log-group-wrap" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">`+t.map(e=>{let t=ke(e.items);return`<div class="meat-log-group" style="flex:0 0 calc((100% - 50px) / 6);flex-grow:0;flex-shrink:0;min-width:0;max-width:calc((100% - 50px) / 6);background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;"><div style="display:flex;align-items:center;gap:6px;padding:5px 7px;background:#f1f3f5;border-bottom:1px solid #e8e8e8;font-weight:700;color:#444;font-size:12px;"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">`+H(e.name)+`</span><span style="font-size:11px;color:#888;">`+e.items.length+`</span></div><div style="display:flex;flex-direction:column;gap:4px;padding:5px;">`+t.map(t=>Me(e,t)).join(``)+`</div></div>`}).join(``)+`</div>`}function Ne(){document.querySelectorAll(`.meat-log-type-toggle`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logTypeId;t&&(M.has(t)?M.delete(t):M.add(t),J(k))})})}function Pe(){[...ne,re].filter(Boolean).forEach(e=>{try{e.destroy()}catch(e){console.warn(`[meat] stock summary sortable destroy skipped:`,e)}}),ne=[],re=null}async function Fe(){return T($,async e=>{let{writeBatch:n}=E(e),r=n(l),i=new Date,a=new Map;document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let n=e.dataset.categoryId===`__other__`?null:e.dataset.categoryId;Array.from(e.querySelectorAll(`.stock-summary-cell[data-meat-type-id]`)).forEach((e,o)=>{let s=e.dataset.meatTypeId;s&&(r.update(t(l,`meatTypes`,s),{groupId:n,groupSortOrder:o,updatedAt:i}),a.set(s,{groupId:n,groupSortOrder:o,updatedAt:i}))})}),await r.commit(),D=await I(),e.isCurrent()&&await J(k)},{roles:[`admin`,`office`]})}async function Ie(){let e=de(),t=Array.from(document.querySelectorAll(`.stock-summary-category-column[data-virtual="false"]`)).map(e=>e.dataset.categoryId).filter(Boolean),n=new Map(t.map((e,t)=>[e,t]));await R(O.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0)))}function Le(){Pe();let e=f===`admin`||f===`office`;if(document.getElementById(`btnMeatStockCategories`)?.addEventListener(`click`,()=>Ze()),document.querySelector(`.stock-summary-wrap`)?.addEventListener(`click`,e=>{if(!e.target.closest(`.stock-summary-main`)||e.target.closest(`.stock-summary-drag-handle`))return;let t=e.target.closest(`.stock-summary-cell`),n=t?.dataset.summaryId,r=ie.get(n);if(!r)return;j.has(n)?j.delete(n):j.add(n),t.insertAdjacentHTML(`afterend`,De(r));let i=t.nextElementSibling;t.remove(),i.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}),!e)return;let t=document.querySelector(`.stock-summary-columns`);t&&(re=C.create(t,{animation:150,handle:`.stock-summary-category-handle`,draggable:`.stock-summary-category-column[data-virtual="false"]`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await Ie()}catch(e){console.error(`[meat] stock category order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),O=await L(),J(k)}}})),document.querySelectorAll(`.stock-summary-category-items`).forEach(e=>{let t=C.create(e,{group:`meatStockShared`,animation:150,handle:`.stock-summary-drag-handle`,draggable:`.stock-summary-cell`,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{try{await Fe()}catch(e){console.error(`[meat] stock group save failed:`,e),alert(`원료 카테고리 저장 실패: `+(e.message||e)),D=await I(),J(k)}}});ne.push(t)})}async function Re(){let e=document.getElementById(`mainContent`);e.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">원료 재고</h2>
        <div class="tab-group">
          <button class="tab-btn ${k===`frozen`?`active`:``}" data-tab="frozen">냉동창고</button>
          <button class="tab-btn ${k===`processed`?`active`:``}" data-tab="processed">전처리</button>
          <button class="tab-btn ${k===`repacked`?`active`:``}" data-tab="repacked">재포장</button>
          <button class="tab-btn ${k===`produce`?`active`:``}" data-tab="produce">채소/과일</button>
        </div>
      </div>
      <div id="tabContent"></div>
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(e=>{e.addEventListener(`click`,()=>{k=e.dataset.tab,document.querySelectorAll(`.tab-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),J(k)})}),await J(k)}function ze(e,t){let n=t.map(e=>e.id).join(`\0`),r=ae.get(e);return(!r||r.firstIds!==n)&&(r={firstIds:n,rows:[...t],ids:new Set(t.map(e=>e.id)),cursorId:t.at(-1)?.id||null,cursor:P.get(e)?.id===t.at(-1)?.id?P.get(e):null,exhausted:t.length<N},ae.set(e,r)),r}function Be(e,t){return t===`produce`?_e(e):t===`frozen`?ge(e):!0}async function Ve(u,d,f,p,m){for(;!p.exhausted&&p.rows.filter(e=>Be(e,d)).length<f;){if(!m())return;let d=p.cursor||await e(t(l,`meatLogs`,p.cursorId));if(!d.exists())throw Error(`이력 위치가 변경되었습니다. 화면을 다시 불러와주세요.`);let f=await o(r(c(l,`meatLogs`),i(`stage`,`==`,u),s(`timestamp`,`desc`),a(d),n(N)));if(!m())return;for(let e of f.docs)p.ids.has(e.id)||(p.ids.add(e.id),p.rows.push({id:e.id,...e.data()}));p.cursorId=f.docs.at(-1)?.id||p.cursorId,p.cursor=f.docs.at(-1)||p.cursor,p.exhausted=f.docs.length<N}}async function J(e,{moreFrom:t=null}={}){let n=document.getElementById(`tabContent`);if(!n)return;let r=u(),i=++se,a=()=>r?.isCurrent()&&i===se&&k===e&&n.isConnected&&document.getElementById(`tabContent`)===n;t===null&&(n.innerHTML=`<div style="padding:24px;"><p>로딩 중...</p></div>`);try{let r=await at();if(!r||!a())return;let{stocks:i,logs:o}=r,s=e===`produce`?`frozen`:e,c=ze(s,o),l=F.get(e)||N,u=c.rows.filter(t=>Be(t,e)).slice(0,l);t===null&&(e===`frozen`?He(i,u):e===`processed`?We(i,u):e===`produce`?Ue(i,u):Ge(i,u),Le(),Ne());let d=n.querySelector(`[data-meat-history-section]`);if(!d)return;let f=()=>{if(!a())return;let n=c.rows.filter(t=>Be(t,e));if((t!==null||p)&&(d.querySelector(`[data-meat-history-content]`).innerHTML=q(n.slice(0,l)),Ne()),d.dataset.meatHistoryState=`ready`,d.querySelector(`[data-meat-log-more]`)?.remove(),d.querySelector(`[data-meat-log-error]`)?.remove(),d.querySelector(`[data-meat-history-retry]`)?.remove(),c.exhausted&&n.length<=l)return;let r=document.createElement(`button`);r.className=`btn-secondary`,r.dataset.meatLogMore=s,r.textContent=`이전 이력 더 보기 (${N}건씩)`,r.style.cssText=`display:block;margin:16px auto;`,r.addEventListener(`click`,async()=>{r.disabled||(r.disabled=!0,F.set(e,l+N),await J(e,{moreFrom:l}))}),d.appendChild(r)},p=!c.exhausted&&u.length<l;if(!p){f();return}d.dataset.meatHistoryState=`loading`,t===null?d.querySelector(`[data-meat-history-content]`).innerHTML=`<p role="status">이전 이력 조회 중...</p>`:d.querySelector(`[data-meat-history-content]`).insertAdjacentHTML(`beforeend`,`<p role="status" data-meat-history-loading>이전 이력 조회 중...</p>`);let m=Ve(s,e,l,c,a).then(f).catch(n=>{if(t!==null&&F.set(e,t),!a())return;console.error(`[원료 이력]`,n),d.dataset.meatHistoryState=`error`,d.querySelector(`[data-meat-history-loading]`)?.remove(),d.insertAdjacentHTML(`beforeend`,`<p role="alert" data-meat-log-error>이전 이력을 불러오지 못했습니다.</p>`);let r=document.createElement(`button`);r.className=`btn-secondary`,r.textContent=`이력 다시 시도`,r.dataset.meatHistoryRetry=`true`,r.addEventListener(`click`,()=>{t!==null&&F.set(e,t+N),J(e,{moreFrom:t})}),d.appendChild(r)});t!==null&&await m}catch(r){if(t!==null&&F.set(e,t),!a())return;if(console.error(`[원료 이력]`,r),t!==null){let e=n.querySelector(`[data-meat-log-more]`);e&&(e.disabled=!1);let t=document.createElement(`p`);t.dataset.meatLogError=`true`,t.setAttribute(`role`,`alert`),t.textContent=`이전 이력을 불러오지 못했습니다. 다시 시도해주세요.`,n.querySelector(`[data-meat-log-error]`)?.remove(),n.appendChild(t)}else{n.innerHTML=`<p role="alert">원료 자료를 불러오지 못했습니다.</p>`;let t=document.createElement(`button`);t.className=`btn-secondary`,t.textContent=`다시 시도`,t.addEventListener(`click`,()=>J(e)),n.appendChild(t)}}}function He(e,t){let n=document.getElementById(`tabContent`),r=f===`admin`||f===`office`,i=e.filter(me),a=t.filter(ge),o=Ce(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddFrozen">+ 원육 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnMeatTypes">원육 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${W(i)}
      ${G(i,{emptyText:`등록된 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,typeTotals:o,useTypeColor:!0})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${q(a)}</div>
    </div>
  `,document.getElementById(`btnAddFrozen`).addEventListener(`click`,()=>Ke()),document.getElementById(`btnMeatTypes`)?.addEventListener(`click`,()=>{if(f!==`admin`&&f!==`office`){alert(`원육 종류 관리는 대표/사무실 계정만 가능합니다.`);return}X()}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ue(e,t){let n=document.getElementById(`tabContent`),r=f===`admin`||f===`office`,i=e.filter(he),a=t.filter(_e),o=Ce(i);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProduce">+ 채소/과일 입고 등록</button>
      ${r?`<button class="btn-secondary" id="btnProduceTypes">채소/과일 종류 관리</button>`:``}
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${W(i)}
      ${G(i,{emptyText:`등록된 채소/과일 재고 없음`,dateField:`incomingDate`,dateLabel:`입고일`,showInitial:!0,showStaffNote:!0,typeTotals:o,useTypeColor:!0})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${q(a)}</div>
    </div>
  `,document.getElementById(`btnAddProduce`).addEventListener(`click`,()=>{Ke({categoryFilter:`produce`,title:`채소/과일 입고 등록`,returnTab:`produce`})}),document.getElementById(`btnProduceTypes`)?.addEventListener(`click`,()=>{if(f!==`admin`&&f!==`office`){alert(`채소/과일 종류 관리는 대표/사무실 계정만 가능합니다.`);return}X({categoryFilter:`produce`})}),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function We(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddProcessed">+ 전처리 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${W(e)}
      ${G(e,{emptyText:`등록된 전처리 재고 없음`,dateField:`processedDate`,dateLabel:`작업일`})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${q(t)}</div>
    </div>
  `,document.getElementById(`btnAddProcessed`).addEventListener(`click`,qe),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ge(e,t){let n=document.getElementById(`tabContent`);n.innerHTML=`
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn-primary" id="btnAddRepacked">+ 재포장 등록</button>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">잔량</span>
      </div>
      ${W(e)}
      ${G(e,{emptyText:`등록된 재포장 재고 없음`,dateField:`repackedDate`,dateLabel:`작업일`})}
    </div>

    <div class="form-section" data-meat-history-section data-meat-history-state="ready">
      <div class="section-header">
        <span class="section-title">이력</span>
      </div>
      <div data-meat-history-content>${q(t)}</div>
    </div>
  `,document.getElementById(`btnAddRepacked`).addEventListener(`click`,Je),document.querySelectorAll(`.btn-adjust`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.id,e.dataset.name,parseFloat(e.dataset.remaining)))})}function Ke(e={}){let{categoryFilter:n=`meat`,title:r=n===`produce`?`채소/과일 입고 등록`:`원육 입고 등록`,returnTab:i=`frozen`}=e,a=n===`produce`?`채소/과일`:`원육`,o=fe().filter(e=>n===`produce`?e.category===`produce`:(e.category||`meat`)===`meat`);Q(`
    <h3 class="modal-title">${r}</h3>
    ${y({incoming:!0})}
    <div class="form-group">
      <label>${a} 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${o.map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
  `);let s=x({db:l,name:`meatLogs`,filter:{}});document.getElementById(`btnSaveFrozen`).addEventListener(`click`,async()=>T($,async e=>{let{addDoc:n,recordActivity:r,recordMeatLog:o}=E(e),u=b(s);if(!u)return;let d=document.getElementById(`m_meatType`).value,f=document.getElementById(`m_meatType`),p=f.options[f.selectedIndex]?.text,m=parseFloat(document.getElementById(`m_weight`).value),g=document.getElementById(`m_unit`).value,_=document.getElementById(`m_date`).value,y=document.getElementById(`m_staff`).value,x=document.getElementById(`m_note`).value;if(!d||!m||!_){alert(`${a} 종류, 중량, 날짜는 필수입니다.`);return}if(!(m>0)){alert(`중량은 0보다 커야 합니다.`);return}if(!y){alert(`담당자를 선택해주세요.`);return}if(await S(_,e))return;let C=g===`kg`?m*1e3:m,w=u.kind===`test`?{approved:!0}:await ee({itemId:`meatLogs:`+d,name:p,date:_,qty:C/1e3,unit:`kg`,stage:`원료`},e.isCurrent);if(!w.approved)return;let T=t(c(l,`meatStocks`));await v({db:l,command:e,name:`meatLogs`,stockId:T.id,selection:u,uid:h?.uid||null,stockData:{meatTypeId:d,meatNameSnapshot:p,stage:`frozen`,incomingDate:_,initialQtyG:C,remaining:0,staffName:y,note:x,closed:!1,createdAt:new Date},log:{type:`frozenIncoming`,date:_,meatTypeId:d,meatNameSnapshot:p,stage:`frozen`,meatStockId:T.id,delta:C,staff:y,reason:x||null,...w.review?{statsQuantityReview:w.review}:{}}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(J(i),alert(`입고 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function qe(){Q(`
    <h3 class="modal-title">전처리 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${fe().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveProcessed`).addEventListener(`click`,async()=>T($,async e=>{let{addDoc:n,updateDoc:r,recordMeatLog:i}=E(e),a=document.getElementById(`m_meatType`).value,o=document.getElementById(`m_meatType`),s=o.options[o.selectedIndex]?.text,u=parseFloat(document.getElementById(`m_unitWeight`).value),d=parseInt(document.getElementById(`m_count`).value),f=document.getElementById(`m_date`).value,p=document.getElementById(`m_staff`).value,m=document.getElementById(`m_note`).value;if(!a||!u||!d||!f){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(u>0)||!(d>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!p){alert(`담당자를 선택해주세요.`);return}if(await S(f,e))return;let h=u*d,g=(await V(`frozen`)).filter(e=>e.meatTypeId===a&&e.remaining>0).sort((e,t)=>(e.incomingDate||``).localeCompare(t.incomingDate||``)),_=g.reduce((e,t)=>e+t.remaining,0);if(_<h){alert(`냉동창고 잔량이 부족합니다.\n${s}: 필요 ${(h/1e3).toFixed(1)}kg / 현재 ${(_/1e3).toFixed(1)}kg`);return}let v=Date.now().toString(),y=tt(),b=h;for(let e of g){if(b<=0)break;let n=Math.min(e.remaining,b),o=e.remaining-n;await r(t(l,`meatStocks`,e.id),{remaining:o,closed:o===0,updatedAt:new Date}),await i({type:`frozenOut`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`frozen`,meatStockId:e.id,delta:-n,before:e.remaining,after:o,staff:p,reason:`전처리 등록 자동차감`,batchId:v}),b-=n}await i({type:`processedIn`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`processed`,meatStockId:(await n(c(l,`meatStocks`),{meatTypeId:a,meatNameSnapshot:s,stage:`processed`,incomingDate:f,processedDate:f,unitWeightG:u,unitCount:d,initialQtyG:h,remaining:h,batchId:v,batchColor:y,staffName:p,note:m,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:h,before:0,after:h,staff:p,reason:m||null,batchId:v}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(J(`processed`),alert(`전처리 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function Je(){Q(`
    <h3 class="modal-title">재포장 등록</h3>
    <div class="form-group">
      <label>원육 종류 *</label>
      <select id="m_meatType">
        <option value="">선택</option>
        ${fe().map(e=>`<option value="${e.id}" data-weight="${e.defaultUnitWeightG}">${e.name}</option>`).join(``)}
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
  `),document.getElementById(`m_meatType`).addEventListener(`change`,e=>{let t=e.target.options[e.target.selectedIndex].dataset.weight;t&&(document.getElementById(`m_unitWeight`).value=t)}),document.getElementById(`btnSaveRepacked`).addEventListener(`click`,async()=>T($,async e=>{let{addDoc:n,updateDoc:r,recordMeatLog:i}=E(e),a=document.getElementById(`m_meatType`).value,o=document.getElementById(`m_meatType`),s=o.options[o.selectedIndex]?.text,u=parseFloat(document.getElementById(`m_unitWeight`).value),d=parseInt(document.getElementById(`m_count`).value),f=document.getElementById(`m_date`).value,p=document.getElementById(`m_staff`).value,m=document.getElementById(`m_note`).value;if(!a||!u||!d||!f){alert(`원육 종류, 개당 중량, 개수, 날짜는 필수입니다.`);return}if(!(u>0)||!(d>0)){alert(`개당 중량과 개수는 0보다 커야 합니다.`);return}if(!p){alert(`담당자를 선택해주세요.`);return}if(await S(f,e))return;let h=u*d,g=(await V(`repacked`)).find(e=>e.meatTypeId===a&&e.remaining>0);if(g){alert(`같은 원육의 재포장 행이 이미 존재합니다.\n${s}: 기존 잔량 ${(g.remaining/1e3).toFixed(1)}kg\n기존 재포장을 모두 사용한 후 등록하세요.`);return}let _=(await V(`processed`)).filter(e=>e.meatTypeId===a&&e.remaining>0).sort((e,t)=>(e.processedDate||``).localeCompare(t.processedDate||``)),v=_.reduce((e,t)=>e+t.remaining,0);if(v<h){alert(`전처리 잔량이 부족합니다.\n${s}: 필요 ${(h/1e3).toFixed(1)}kg / 현재 ${(v/1e3).toFixed(1)}kg`);return}let y=Date.now().toString(),b=tt(),x=h;for(let e of _){if(x<=0)break;let n=Math.min(e.remaining,x),o=e.remaining-n;await r(t(l,`meatStocks`,e.id),{remaining:o,closed:o===0,updatedAt:new Date}),await i({type:`processedOut`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`processed`,meatStockId:e.id,delta:-n,before:e.remaining,after:o,staff:p,reason:`재포장 등록 자동차감`,batchId:y}),x-=n}await i({type:`repackedIn`,date:f,meatTypeId:a,meatNameSnapshot:s,stage:`repacked`,meatStockId:(await n(c(l,`meatStocks`),{meatTypeId:a,meatNameSnapshot:s,stage:`repacked`,incomingDate:f,repackedDate:f,unitWeightG:u,unitCount:d,initialQtyG:h,remaining:h,batchId:y,batchColor:b,staffName:p,note:m,closed:!1,createdAt:new Date,updatedAt:new Date})).id,delta:h,before:0,after:h,staff:p,reason:m||null,batchId:y}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(J(`repacked`),alert(`재포장 등록 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function Y(e,n,r){Q(`
    <h3 class="modal-title">수동 재고 조정 — ${n}</h3>
    ${y({reasonField:!1})}
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
  `);let i=x({db:l,name:`meatLogs`,filter:{meatStockId:e},onCancel:e=>{document.getElementById(`m_actualRemaining`).value=r+e},reasonInput:document.getElementById(`m_adjustReason`)});document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>T($,async a=>{let{getDoc:o,updateDoc:s,recordActivity:c,recordMeatLog:u}=E(a),d=b(i);if(!d)return;let f=document.getElementById(`m_actualRemaining`).value,p=document.getElementById(`m_adjustReason`).value.trim(),g=document.getElementById(`m_staff`).value;if(f===``||isNaN(parseFloat(f))){alert(`실제 잔량을 입력해주세요.`);return}let _=parseFloat(f);if(_<0){alert(`실제 잔량은 0 이상이어야 합니다.
잔량이 음수가 될 수 없습니다.`);return}if(!p||!g){alert(`사유와 담당자는 필수입니다.`);return}let y=_-r;if(y===0){alert(`기존 잔량과 동일합니다. 변경할 값을 입력해주세요.`);return}let x=m();if(await S(x,a))return;let ee=await o(t(l,`meatStocks`,e)),C=ee.exists()?ee.data():{},w=C.meatTypeId||null;await v({db:l,command:a,name:`meatLogs`,stockId:e,selection:d,expectedBefore:r,uid:h?.uid||null,log:{type:`adjust`,date:x,meatTypeId:w,meatNameSnapshot:n,stage:C.stage||`frozen`,meatStockId:e,delta:y,staff:g,reason:p}}),a.isCurrent()&&(closeModal(),a.isCurrent()&&(J(k),alert(`조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function Ye(){let e=z();return e.length===0?`<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">등록된 카테고리 없음</td></tr>`:e.map(e=>{let t=D.filter(t=>t.groupId===e.id).length;return`
      <tr data-id="${e.id}">
        <td class="master-table-drag-cell">
          <span class="drag-handle" title="순서 변경" aria-label="순서 변경">⠿</span>
        </td>
        <td>
          <input type="text" class="stock-category-name" data-id="${e.id}" value="${H(e.name)}"
                 style="width:100%;padding:5px 6px;" />
        </td>
        <td style="text-align:right;color:#666;">${t}</td>
        <td>
          <button type="button" class="btn-secondary btn-delete-stock-category" data-id="${e.id}">삭제</button>
        </td>
      </tr>
    `}).join(``)}async function Xe(){D=await I(),O=await L(),await J(k),Ze()}function Ze(){if(f!==`admin`&&f!==`office`){alert(`카테고리 관리는 대표/사무실 계정만 가능합니다.`);return}Q(`
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
          ${Ye()}
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
  `);let e=de(),n=z(e),r=document.getElementById(`meatStockCategoryList`);r&&n.length>0&&C.create(r,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async()=>{let t=Array.from(r.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id),n=new Map(t.map((e,t)=>[e,t]));try{await R(O.map(t=>(t.scope||`meat`)===e?{...t,sortOrder:n.has(t.id)?n.get(t.id):t.sortOrder}:t)),await J(k)}catch(e){console.error(`[meat] stock category modal order save failed:`,e),alert(`카테고리 순서 저장 실패: `+(e.message||e)),O=await L(),Ze()}}}),document.querySelectorAll(`.stock-category-name`).forEach(e=>{e.addEventListener(`change`,async e=>{let t=e.target.dataset.id,r=e.target.value.trim(),i=n.find(e=>e.id===t);if(i){if(!r){alert(`카테고리명을 입력해주세요.`),e.target.value=i.name;return}try{await R(O.map(e=>e.id===t?{...e,name:r}:e)),await J(k)}catch(t){console.error(`[meat] stock category rename failed:`,t),alert(`카테고리명 저장 실패: `+(t.message||t)),e.target.value=i.name}}})}),document.getElementById(`btnAddStockCategory`)?.addEventListener(`click`,async()=>{let t=document.getElementById(`newStockCategoryName`).value.trim();if(!t){alert(`카테고리명을 입력해주세요.`);return}let r=[...O,{id:we(),name:t,sortOrder:n.length,scope:e}];try{await R(r),await Xe()}catch(e){console.error(`[meat] stock category add failed:`,e),alert(`카테고리 추가 실패: `+(e.message||e))}}),document.querySelectorAll(`.btn-delete-stock-category`).forEach(e=>{e.addEventListener(`click`,async()=>T($,async r=>{let{writeBatch:i}=E(r),a=e.dataset.id;if(n.find(e=>e.id===a))try{let e=new Date,n=i(l);if(D.filter(e=>e.groupId===a).forEach(r=>{n.update(t(l,`meatTypes`,r.id),{groupId:null,groupSortOrder:0,updatedAt:e})}),await n.commit(),await R(O.filter(e=>e.id!==a),r),!r.isCurrent())return;await Xe()}catch(e){console.error(`[meat] stock category delete failed:`,e),alert(`카테고리 삭제 실패: `+(e.message||e))}},{roles:[`admin`,`office`]}))})}function X(e={}){let{categoryFilter:n=null}=e,r=n||`meat`,i=r===`meat`&&(f===`admin`||f===`office`),a=D.filter(e=>pe(e.id)===r),o=r===`produce`,s=o?`채소/과일`:`원육`,u=o?`채소/과일 종류 관리`:`원육 종류 관리`,d=o?`g`:`kg`;Q(`
    <h3 class="modal-title">${u}</h3>
    <div class="table-wrap" style="margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th class="master-table-drag-col"></th>
            <th>${s}명</th>
            <th>기본 단위중량(g)</th>
            <th>최소재고(${d})</th>
            <th>\uD65C\uC131</th>
          </tr>
        </thead>
        <tbody id="meatTypesList">
          ${a.map(e=>{let t=e.active!==!1,n=o?e.minimumQtyG||0:((e.minimumQtyG||0)/1e3).toFixed(1);return`
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
          <label>최소재고(${d})</label>
          <input type="number" id="m_newMinQty" placeholder="${o?`예: 500`:`예: 5`}" />
        </div>
      </div>
      <button class="btn-primary" id="btnAddMeatType">추가</button>
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),Qe(),document.querySelectorAll(`.m-unit-weight`).forEach(e=>{e.addEventListener(`change`,async e=>T($,async n=>{let{updateDoc:r}=E(n),i=e.target.dataset.id,a=D.find(e=>e.id===i),o=a?.defaultUnitWeightG,s=parseFloat(e.target.value);if(!isFinite(s)||s<=0){alert(`기본 단위중량은 양수(g)여야 합니다.`),e.target.value=o??``;return}try{await r(t(l,`meatTypes`,i),{defaultUnitWeightG:s,updatedAt:new Date}),a&&(a.defaultUnitWeightG=s)}catch(t){console.error(`[meat] defaultUnitWeightG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=o??``}},{roles:[`admin`,`office`]}))}),document.querySelectorAll(`.m-min-qty`).forEach(e=>{e.addEventListener(`change`,async e=>T($,async n=>{let{updateDoc:r}=E(n),i=e.target.dataset.id,a=D.find(e=>e.id===i),s=a?.minimumQtyG??0,c=parseFloat(e.target.value);if(!isFinite(c)||c<0){alert(`최소재고는 0 이상(${d})이어야 합니다.`),e.target.value=o?s:(s/1e3).toFixed(1);return}let u=Math.round(o?c:c*1e3);try{await r(t(l,`meatTypes`,i),{minimumQtyG:u,updatedAt:new Date}),a&&(a.minimumQtyG=u)}catch(t){console.error(`[meat] minimumQtyG 저장 실패:`,t),alert(`저장 실패: `+(t.message||t)),e.target.value=o?s:(s/1e3).toFixed(1)}},{roles:[`admin`,`office`]}))}),document.querySelectorAll(`.m-active-toggle`).forEach(n=>{n.addEventListener(`change`,async n=>T($,async r=>{let{updateDoc:i,recordActivity:a}=E(r),o=n.target.dataset.id,s=n.target.checked,c=D.find(e=>e.id===o),u=c?.active!==!1;try{if(await i(t(l,`meatTypes`,o),{active:s,updatedAt:new Date}),c&&(c.active=s),u!==s&&await a({action:`meat`,subAction:`activeToggle`,date:m(),staff:rt(),message:`Meat type ${s?`active`:`inactive`} — ${c?.name||o}`,details:{meatTypeId:o,meatName:c?.name||``,active:s}}),!r.isCurrent()||(closeModal(),!r.isCurrent()))return;X(e)}catch(e){console.error(`[meat] active save failed:`,e),alert(`Save failed: `+(e.message||e)),n.target.checked=!s}},{roles:[`admin`,`office`]}))}),document.getElementById(`btnAddMeatType`).addEventListener(`click`,async()=>T($,async t=>{let{addDoc:n}=E(t),i=document.getElementById(`m_newMeatName`).value.trim(),a=parseFloat(document.getElementById(`m_newUnitWeight`).value)||0,u=parseFloat(document.getElementById(`m_newMinQty`).value)||0,d=r;if(!i){alert(`${s}명은 필수입니다.`);return}await n(c(l,`meatTypes`),{name:i,defaultUnitWeightG:a,minimumQtyG:Math.round(o?u:u*1e3),category:d,sortOrder:D.length,active:!0,showInStats:!0,createdAt:new Date,updatedAt:new Date}),D=await I(),t.isCurrent()&&(closeModal(),t.isCurrent()&&X(e))},{roles:[`admin`,`office`]}))}function Qe(){if($e(),f!==`admin`&&f!==`office`)return;let e=document.getElementById(`meatTypesList`);e&&(A=C.create(e,{handle:`.drag-handle`,animation:150,ghostClass:`sortable-ghost`,chosenClass:`sortable-chosen`,onEnd:async e=>{e.oldIndex!==e.newIndex&&await et()}}))}function $e(){if(A){try{A.destroy()}catch(e){console.warn(`[meat] sortable destroy skipped:`,e)}A=null}}async function et(){return T($,async e=>{let{writeBatch:n}=E(e),r=document.getElementById(`meatTypesList`);if(!r)return;let i=Array.from(r.querySelectorAll(`tr[data-id]`)).map(e=>e.dataset.id).filter(Boolean),a=new Date,o=n(l);i.forEach((e,n)=>{o.update(t(l,`meatTypes`,e),{sortOrder:n,updatedAt:a})});try{await o.commit();let e=new Map(i.map((e,t)=>[e,t]));D=D.map(t=>e.has(t.id)?{...t,sortOrder:e.get(t.id),updatedAt:a}:t).sort((e,t)=>(e.sortOrder??0)-(t.sortOrder??0))}catch(t){if(console.error(`[meat] reorder save failed:`,t),alert(`순번 저장 실패: `+(t.message||t)),D=await I(),!e.isCurrent()||(closeModal(),!e.isCurrent()))return;X()}},{roles:[`admin`,`office`]})}function tt(){let e=[`#e8f4ea`,`#e8eef8`,`#fef0e8`,`#f0e8fe`,`#fff0e8`,`#e8f8f4`];return e[Math.floor(Math.random()*e.length)]}var nt={};function rt(){return f===`admin`?`대표`:f===`office`?`사무실`:f===`production`?`생산실`:`시스템`}function Z(e){let t=``;for(let n of e)(nt[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}d(`meat`,function(){$e();let e=document.getElementById(`modalOverlay`);e&&e.remove()});var $=g(`meat`);$.refresh=le;var it=null;async function at({force:e=!1}={}){let t=k===`produce`?`frozen`:k,n=JSON.stringify([t,N]);n!==it&&(it=n,e||=!$.prepare);let r=await $.load(e=>ot(e,t),{key:n,force:e,onChange:w($,le)});return r&&(D=r.types,O=r.categories,nt=r.staff),r}async function ot(e,t){let[n,r,i,a,o]=await Promise.all([I(e),L(e),te(e),V(t,e),ve(t,e)]);return{types:n,categories:r,staff:i,stocks:a,logs:o}}function st({cacheOnly:e=!0,stage:t=`frozen`}={}){return $.prepare?.(JSON.stringify([t,N]),e=>ot(e,t),{cacheOnly:e})}export{st as preparePage,le as renderMeat};