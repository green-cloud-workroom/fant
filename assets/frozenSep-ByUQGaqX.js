import{a as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-rHmxwfvm.js";import{n as o}from"./firebase-qGjqjNvO.js";import{a as s}from"./formDraft-DoA-Ia7D.js";import{G as c,L as l,f as u,m as d}from"./index-lv3jHCmD.js";import"./activityLogs-CgS1ycsl.js";import{t as f}from"./closingGuard-CjIlTHvB.js";import{t as p}from"./sortable-Dh9BCo_X.js";import{t as m}from"./pageRefresh-Dkf20J4p.js";import{t as h}from"./pageCommand-DPPNML3F.js";import{t as g}from"./commandWrites-B1DP7c9J.js";import{n as _,t as v}from"./recipe-C9k17zG2.js";import{t as y}from"./pageStaff-C1JCr7Fo.js";var b=[],x=1e-6;async function S({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">동결 분리작업 로딩 중...</p>`;let n=await Q.load(e=>$(e),{force:e,onChange:m(Q,S)});!n||!t.isConnected||(b=n.recipes,Y=n.staff,R=n.order,V(n.stocks,n.logs))}async function C(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenSeparation`),i(`date`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed)}async function w(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenSeparationLogs`),i(`timestamp`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()}))}function T(e){return Math.round((Number(e)||0)*1e6)/1e6}function E(e){return T(e).toLocaleString(`ko-KR`,{maximumFractionDigits:3})}function D(e=`m_qty`){let t=Number(document.getElementById(e).value);return Number.isFinite(t)?t:NaN}function O(){return c===`admin`||c===`office`}function k(e){return e===`notSeparated`?`분리X`:e===`separated`?`분리O`:`소분X`}function A(e){return e===`notSeparated`?`tag-cat`:e===`separated`?`tag-raw`:`tag-freezeDry`}function j(e){let t=Number(e.qty||0);switch(e.type){case`incoming`:return[{stockType:e.toStockType,delta:t}];case`separate`:return[{stockType:e.fromStockType,delta:-t},{stockType:e.toStockType,delta:t}];case`out`:return[{stockType:e.fromStockType,delta:-t}];case`adjust`:return[{stockType:e.fromStockType,delta:t}];case`delete`:return[{stockType:e.fromStockType,delta:t}];default:return[]}}function M(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=T((n[t]||0)+Number(e.remaining||0))});let r={};for(let e of t){let t=j(e),i={};t.forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;i[t.stockType]=T(n[r]||0),n[r]=T((n[r]||0)-t.delta)}),r[e.id]=i}return r}function N(e){return{incoming:`입고`,separate:`분리`,out:`출고`,adjust:`조정`,delete:`삭제`}[e]||e}function P(e){return{incoming:`#2d7a3a`,separate:`#1f6fb2`,out:`#b97a1f`,adjust:`#8a5fbf`,delete:`#e53e3e`}[e]||`#555`}var F={notSeparated:{bar:`#EF9F27`,bg:`#fdf3e0`,text:`#b97a1f`},separated:{bar:`#1D9E75`,bg:`#e8f5ea`,text:`#2d7a3a`},noSplit:{bar:`#378ADD`,bg:`#e8f0fc`,text:`#2d4a8a`}},I=new Set,L=`daily`,R=[];function z(e){return[...e].sort((e,t)=>{let n=R.indexOf(e),r=R.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t,`ko`):1:-1})}function B(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=T((n[t]||0)+Number(e.remaining||0))});let r=[...new Set(t.map(e=>e.date).filter(Boolean))].sort().reverse(),i=l(),a=r.includes(i)?r:[i,...r.filter(e=>e<i)],o=[...t].filter(e=>e.date).sort((e,t)=>t.date.localeCompare(e.date)),s=0,c={},u={};for(let e of a){for(;s<o.length&&o[s].date>e;){let e=o[s];j(e).forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;n[r]=T((n[r]||0)-t.delta)}),s++}c[e]={...n},u[e]=[...new Set(t.filter(t=>t.date===e).map(e=>e.staffName).filter(Boolean))].join(`, `)}return{dates:a,snapshots:c,staffByDate:u}}function V(e,n=[]){let r=document.getElementById(`mainContent`),i=O(),a=M(e,n),s=z([...new Set([...e.map(e=>e.productName),...n.map(e=>e.productName).filter(Boolean)])]);r.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결 분리작업</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnAdjust">수동 조정</button>
          <button class="btn-secondary" id="btnOut">출고</button>
          <button class="btn-secondary" id="btnSeparate">분리 작업</button>
          <button class="btn-primary" id="btnIncoming">+ 원물 입고</button>
        </div>
      </div>

      <!-- 뷰 전환 탭 -->
      <div style="display:flex;gap:0;border-bottom:2px solid #e8e8e8;margin-bottom:16px;">
        <button class="sep-view-tab" data-view="daily"
          style="padding:10px 20px;background:${L===`daily`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${L===`daily`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${L===`daily`?`600`:`400`};color:${L===`daily`?`#1a1a1a`:`#888`};">
          일별 현황
        </button>
        <button class="sep-view-tab" data-view="product"
          style="padding:10px 20px;background:${L===`product`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${L===`product`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${L===`product`?`600`:`400`};color:${L===`product`?`#1a1a1a`:`#888`};">
          제품별 이력
        </button>
      </div>

      ${L===`daily`?H(e,n,s):`<div style="display:flex;flex-direction:column;gap:12px;">
            ${s.length===0?`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`:s.map(t=>U(t,e,n,a,i)).join(``)}
          </div>`}
    </div>
  `,document.getElementById(`btnIncoming`).addEventListener(`click`,()=>G(e)),document.getElementById(`btnSeparate`).addEventListener(`click`,()=>K(e)),document.getElementById(`btnOut`).addEventListener(`click`,()=>q(e)),document.getElementById(`btnAdjust`).addEventListener(`click`,()=>J(e));let c=document.getElementById(`sepMatrixHeadRow`);c&&i&&new p(c,{animation:150,draggable:`.sep-col-th`,direction:`horizontal`,onEnd:async()=>h(Q,async r=>{let{setDoc:i}=g(r),a=[...c.querySelectorAll(`.sep-col-th`)].map(e=>e.dataset.product);R=a;try{await i(t(o,`settings`,`frozenSepProductOrder`),{order:a,updatedAt:new Date})}catch(e){console.error(`saveSepProductOrder:`,e),alert(`순서 저장 실패: `+e.message)}r.isCurrent()&&V(e,n)},{roles:[`admin`,`office`]})}),document.querySelectorAll(`.sep-view-tab`).forEach(t=>{t.addEventListener(`click`,()=>{L=t.dataset.view,V(e,n)})}),document.querySelectorAll(`.sep-card-header`).forEach(t=>{t.addEventListener(`click`,()=>{let r=t.dataset.product;I.has(r)?I.delete(r):I.add(r),V(e,n)})}),document.querySelectorAll(`.btnDeleteFrozenSep`).forEach(t=>{t.addEventListener(`click`,n=>{n.stopPropagation();let r=e.find(e=>e.id===t.dataset.id);r&&W(r)})})}function H(e,t,n){if(n.length===0)return`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`;let{dates:r,snapshots:i,staffByDate:a}=B(e,t),o=[`separated`,`notSeparated`,`noSplit`],s={};n.forEach(e=>{s[e]=new Set}),e.forEach(e=>s[e.productName]?.add(e.stockType)),t.forEach(e=>{j(e).forEach(t=>{t.stockType&&s[e.productName]?.add(t.stockType)})});let c=[];n.forEach(e=>{let t=o.filter(t=>s[e].has(t));(t.length?t:[`notSeparated`]).forEach(t=>c.push({product:e,stockType:t}))});let l=[`#fdf3e0`,`#e8f0fc`,`#e8f5ea`,`#f3ecfa`,`#fbeaea`,`#e9f6f4`],u=O();return`
    <div style="background:white;border-radius:12px;border:1px solid #e8e8e8;overflow-x:auto;">
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr id="sepMatrixHeadRow">
            <th rowspan="2" style="background:#fbfaf5;font-size:12px;padding:8px;border:1px solid #e0e0e0;min-width:56px;">날짜</th>
            <th rowspan="2" style="background:#fbfaf5;font-size:12px;padding:8px;border:1px solid #e0e0e0;min-width:80px;">작업 담당자</th>
            ${n.map((e,t)=>{let n=o.filter(t=>s[e].has(t)).length||1;return`<th colspan="${n}" class="sep-col-th" data-product="${e}" style="background:${l[t%l.length]};font-size:12px;padding:8px 6px;border:1px solid #e0e0e0;text-align:center;min-width:${n*58}px;${u?`cursor:grab;`:``}" ${u?`title="드래그로 순서 변경"`:``}>${e}</th>`}).join(``)}
          </tr>
          <tr>${c.map(e=>{let t=F[e.stockType]||F.notSeparated;return`<th style="background:${t.bg};color:${t.text};font-size:11px;padding:5px 4px;border:1px solid #e0e0e0;text-align:center;">${k(e.stockType)}</th>`}).join(``)}</tr>
        </thead>
        <tbody>${r.map(e=>{let t=i[e]||{},n=c.map(e=>{let n=t[`${e.product}|${e.stockType}`]||0;return`<td style="border:1px solid #eee;text-align:center;padding:8px 4px;font-size:12.5px;${n>x?`font-weight:600;color:#333;`:`color:#ddd;`}">${n>x?E(n):``}</td>`}).join(``);return`
      <tr>
        <td style="border:1px solid #eee;text-align:center;padding:8px 6px;font-size:12px;font-weight:600;color:#555;white-space:nowrap;">${e.slice(5).replace(`-`,`/`)}</td>
        <td style="border:1px solid #eee;text-align:center;padding:8px 6px;font-size:12px;color:#888;white-space:nowrap;">${a[e]||`-`}</td>
        ${n}
      </tr>
    `}).join(``)}</tbody>
      </table>
    </div>
    <p style="font-size:11px;color:#aaa;margin-top:8px;">각 칸은 해당 날짜 마감 시점의 잔량입니다. 현재 재고에서 작업 이력을 역산해 계산됩니다.</p>
  `}function U(e,t,n,r,i){let a=I.has(e),o=t.filter(t=>t.productName===e),s=n.filter(t=>t.productName===e),c={};o.forEach(e=>{c[e.stockType]=T((c[e.stockType]||0)+Number(e.remaining||0))});let l=0,u=0,d=0,f=0;s.forEach(e=>{let t=Number(e.qty||0);e.type===`incoming`?l+=t:e.type===`separate`?u+=t:e.type===`out`?d+=t:(e.type===`adjust`||e.type===`delete`)&&(f+=t)});let p=[`누적 입고 <b style="font-weight:600;color:#333;">${E(l)}개</b>`];u>0&&p.push(`분리 완료 <b style="font-weight:600;color:#333;">${E(u)}개</b>`),p.push(`출고 <b style="font-weight:600;color:#333;">${E(d)}개</b>`),Math.abs(f)>x&&p.push(`조정 <b style="font-weight:600;color:#333;">${f>0?`+`:``}${E(f)}개</b>`);let m=Object.entries(c).filter(([,e])=>e>x).map(([e,t])=>{let n=F[e]||F.notSeparated;return`<span style="background:${n.bg};color:${n.text};font-size:11px;padding:3px 10px;border-radius:10px;white-space:nowrap;">${k(e)} ${E(t)}</span>`}).join(``),h=Object.values(c).reduce((e,t)=>e+t,0),g=h>x?Object.entries(c).filter(([,e])=>e>x).map(([e,t])=>{let n=F[e]||F.notSeparated;return{st:e,pct:t/h*100,color:n.bar}}):[],_=g.length>0?`
    <div style="padding:0 18px 8px;">
      <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:#f5f5f5;">
        ${g.map(e=>`<div style="width:${e.pct}%;background:${e.color};"></div>`).join(``)}
      </div>
      <div style="display:flex;gap:14px;margin-top:5px;font-size:11px;color:#999;">
        ${g.map(e=>`<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${e.color};margin-right:4px;"></span>${k(e.st)} ${Math.round(e.pct)}%</span>`).join(``)}
      </div>
    </div>
  `:``,v=s.map(e=>{let t=Number(e.qty||0),n=r[e.id]||{},i=j(e),a=``;e.type===`incoming`?a=`${k(e.toStockType)} +${E(t)}개`:e.type===`separate`?a=`분리X → 분리O ${E(t)}개`:e.type===`out`?a=`${k(e.fromStockType)} -${E(t)}개`:e.type===`adjust`?a=`${k(e.fromStockType)} ${t>=0?`+`:``}${E(t)}개`:e.type===`delete`&&(a=`${k(e.fromStockType)} ${E(t)}개`);let o=i.filter(e=>e.stockType&&n[e.stockType]!==void 0).map(e=>{let t=n[e.stockType],r=T(t-e.delta);return`${k(e.stockType)} ${E(r)} → <b style="font-weight:600;color:#333;">${E(t)}</b>`}).join(` · `)||`-`;return`
      <tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:7px 0;color:#999;font-size:12px;width:76px;">${(e.date||``).slice(5)||`-`}</td>
        <td style="width:48px;"><span style="color:${P(e.type)};font-weight:600;font-size:12px;">${N(e.type)}</span></td>
        <td style="font-size:12.5px;">${a}</td>
        <td style="text-align:right;color:#888;font-size:12px;">${o}</td>
        <td style="text-align:right;color:#999;font-size:12px;width:64px;">${e.staffName||`-`}</td>
      </tr>
    `}).join(``),y=o.map(e=>`
    <tr style="border-top:1px solid #f0f0f0;">
      <td style="padding:6px 0;color:#999;font-size:12px;width:90px;">${e.date}</td>
      <td style="width:60px;"><span class="tag ${A(e.stockType)}" style="font-size:10px;">${k(e.stockType)}</span></td>
      <td style="font-size:12.5px;font-weight:600;">${E(e.remaining)}개 <span style="font-weight:400;font-size:11px;color:#999;">/ 최초 ${E(e.initialQty)}개</span></td>
      <td style="color:#999;font-size:12px;">${e.staffName||`-`}</td>
      <td style="color:#999;font-size:12px;">${e.note||`-`}</td>
      ${i?`<td style="text-align:right;width:52px;"><button class="btn-del-row btnDeleteFrozenSep" data-id="${e.id}">삭제</button></td>`:``}
    </tr>
  `).join(``);return`
    <div style="background:white;border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
      <div class="sep-card-header" data-product="${e}" style="padding:14px 18px;display:flex;align-items:center;gap:14px;cursor:pointer;user-select:none;">
        <span style="font-size:13px;color:#bbb;transform:rotate(${a?`90deg`:`0deg`});transition:transform 0.15s;">▶</span>
        <span style="font-size:15px;font-weight:600;min-width:150px;">${e}</span>
        <span style="font-size:12px;color:#888;">${p.join(` · `)}</span>
        <span style="margin-left:auto;display:flex;gap:6px;">${m||`<span style="font-size:11px;color:#ccc;">재고 없음</span>`}</span>
      </div>
      ${a?`
        ${_}
        <div style="border-top:1px solid #f0f0f0;padding:10px 18px 14px;">
          <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:4px;">작업 이력</div>
          <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
            ${v||`<tr><td style="padding:8px 0;color:#ccc;font-size:12px;">이력 없음</td></tr>`}
          </table>
        </div>
        ${o.length>0?`
          <div style="border-top:1px solid #f0f0f0;padding:10px 18px 14px;background:#fafafa;">
            <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:4px;">현재 lot</div>
            <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
              ${y}
            </table>
          </div>
        `:``}
      `:``}
    </div>
  `}async function W(e){return h(Q,async n=>{let{writeBatch:r,recordActivity:i}=g(n);if(!O()){alert(`삭제 권한이 없습니다.`);return}if(await f(e.date,n))return;let s=Number(e.initialQty||0),c=Number(e.remaining||0);if(c<=0){alert(`삭제할 남은 수량이 없습니다.`);return}if(Math.abs(s-c)>x){alert(`이미 일부 사용된 항목은 바로 삭제할 수 없습니다.
관련 출고/분리 작업을 먼저 되돌리거나 수동 조정을 사용해주세요.`);return}let d=window.prompt(`삭제 담당자 이름을 입력해주세요.`);if(!d||!d.trim())return;let p=k(e.stockType);if(!await u({title:`동결 분리작업 삭제`,message:`${e.productName} / ${p} / ${E(c)}개 항목을 삭제합니다.\n잘못 입력한 항목일 때만 진행해주세요.`,confirmText:`삭제`,cancelText:`취소`,danger:!0}))return;let m=r(o),h=t(o,`frozenSeparation`,e.id),_=t(a(o,`frozenSeparationLogs`)),v=new Date,y=d.trim();m.update(h,{remaining:0,closed:!0,status:`deleted`,deletedAt:v,deletedBy:y,updatedAt:v}),m.set(_,{date:l(),timestamp:v,type:`delete`,productName:e.productName,fromStockType:e.stockType,qty:-c,staffName:y,note:`wrong input delete`,sourceStockId:e.id}),await m.commit(),await i({action:`frozenSep`,subAction:`delete`,date:l(),staff:y,message:`동결 분리작업 삭제 — ${e.productName} ${E(c)}개 (${p}) / 담당: ${y}`,details:{frozenSeparationId:e.id,productName:e.productName,qty:c,stockType:e.stockType,note:e.note||null}});let[b,S]=await Promise.all([C(),w()]);n.isCurrent()&&(V(b,S),alert(`삭제 완료!`))},{roles:[`admin`,`office`]})}function G(e){Z(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name" onchange="updateSepGuide()">${_(b)}</select>
    </div>
    <!-- [묶음 5C] 분리 필요/불필요 운영자 입력 제거 → 레시피 설정으로 자동 결정 + 안내 표시 -->
    <div class="form-group" id="m_sepGuide" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:13px;color:#555;">
      제품을 선택하면 자동으로 결정됩니다.
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${l()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),window.updateSepGuide=function(){let e=document.getElementById(`m_name`).value,t=document.getElementById(`m_sepGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let n=b.find(t=>t.displayName===e);if(!n){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}n.requiresSeparation?(t.innerHTML=`📌 이 제품은 <b>분리 작업이 필요</b>합니다 → <b style="color:#c0392b;">분리X</b>로 입고됩니다.`,t.style.color=`#555`):(t.innerHTML=`📌 이 제품은 분리 작업이 불필요합니다 → <b style="color:#2d4a8a;">소분X</b>로 입고됩니다.`,t.style.color=`#555`)},updateSepGuide(),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>h(Q,async e=>{let{addDoc:t,recordActivity:n}=g(e),r=document.getElementById(`m_name`).value.trim(),i=D(),s=document.getElementById(`m_date`).value,c=document.getElementById(`m_staff`).value,l=document.getElementById(`m_note`).value;if(!r||!Number.isFinite(i)||i<=0||!s){alert(`제품명, 수량, 날짜는 필수입니다.`);return}if(!c){alert(`담당자는 필수입니다.`);return}if(await f(s,e))return;let u=b.find(e=>e.displayName===r);if(!u){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let d=u.requiresSeparation===!0,p=d?`notSeparated`:`noSplit`,m=d?`분리X`:`소분X`,h=await t(a(o,`frozenSeparation`),{date:s,productName:r,stockType:p,initialQty:i,remaining:i,staffName:c,note:l,closed:!1,createdAt:new Date,updatedAt:new Date});if(await t(a(o,`frozenSeparationLogs`),{date:s,timestamp:new Date,type:`incoming`,productName:r,toStockType:p,qty:i,staffName:c,note:l}),await n({action:`frozenSep`,subAction:`incoming`,date:s,staff:c,message:`분리작업 입고 — ${r} +${E(i)}개 (${m}) / 담당: ${c}`,details:{frozenSeparationId:h.id,productName:r,qty:i,stockType:p,sepNeeded:d,autoDecided:!0,note:l||null}}),!e.isCurrent())return;closeModal();let[_,v]=await Promise.all([C(),w()]);e.isCurrent()&&(V(_,v),alert(`입고 완료!`))},{roles:[`admin`,`office`,`production`]}))}function K(e){let n=e.filter(e=>e.stockType===`notSeparated`);Z(`
    <h3 class="modal-title">분리 작업</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(n.map(e=>e.productName))].map(e=>`<option value="${e}">${e} (분리X: ${E(n.filter(t=>t.productName===e).reduce((e,t)=>e+Number(t.remaining||0),0))}개)</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${l()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSeparate">작업 완료</button>
    </div>
  `),document.getElementById(`btnSaveSeparate`).addEventListener(`click`,async()=>h(Q,async e=>{let{addDoc:r,updateDoc:i,recordActivity:s}=g(e),c=document.getElementById(`m_product`).value,l=D(),u=document.getElementById(`m_date`).value,d=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(l)||l<=0||!u){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!d){alert(`담당자는 필수입니다.`);return}if(await f(u,e))return;let p=n.filter(e=>e.productName===c).sort((e,t)=>e.date.localeCompare(t.date)),m=p.reduce((e,t)=>e+Number(t.remaining||0),0);if(l-m>x){alert(`분리X 재고가 부족합니다. (현재: ${E(m)}개)`);return}let h=l;for(let e of p){if(h<=0)break;let n=Number(e.remaining||0),r=Math.min(n,h),a=T(n-r);await i(t(o,`frozenSeparation`,e.id),{remaining:a,closed:a<=x,updatedAt:new Date}),h=T(h-r)}let _=await r(a(o,`frozenSeparation`),{date:u,productName:c,stockType:`separated`,initialQty:l,remaining:l,staffName:d,note:``,closed:!1,createdAt:new Date,updatedAt:new Date});if(await r(a(o,`frozenSeparationLogs`),{date:u,timestamp:new Date,type:`separate`,productName:c,fromStockType:`notSeparated`,toStockType:`separated`,qty:l,staffName:d}),await s({action:`frozenSep`,subAction:`separate`,date:u,staff:d,message:`분리 작업 — ${c} ${E(l)}개 (분리X → 분리O) / 담당: ${d}`,details:{newSeparatedId:_.id,productName:c,qty:l,fromStockType:`notSeparated`,toStockType:`separated`}}),!e.isCurrent())return;closeModal();let[v,y]=await Promise.all([C(),w()]);e.isCurrent()&&(V(v,y),alert(`분리 작업 완료!`))},{roles:[`admin`,`office`,`production`]}))}function q(e){let n=e.filter(e=>e.stockType===`separated`||e.stockType===`noSplit`);Z(`
    <h3 class="modal-title">출고</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product" onchange="updateOutType()">
        <option value="">선택</option>
        ${[...new Set(n.map(e=>e.productName))].map(e=>`<option value="${e}">${e}</option>`).join(``)}
      </select>
    </div>
    <!-- [묶음 5C] 재고 종류 운영자 입력 제거 → 레시피 설정으로 자동 결정 + 재고 안내 -->
    <div class="form-group" id="m_outGuide" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:13px;color:#555;">
      제품을 선택하면 자동으로 결정됩니다.
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${l()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOut">출고</button>
    </div>
  `),window.updateOutType=function(){let e=document.getElementById(`m_product`).value,t=document.getElementById(`m_outGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let r=b.find(t=>t.displayName===e);if(!r){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}let i=r.requiresSeparation?`separated`:`noSplit`,a=r.requiresSeparation?`분리O`:`소분X`,o=r.requiresSeparation?`#2d7a3a`:`#2d4a8a`,s=n.filter(t=>t.productName===e&&t.stockType===i).reduce((e,t)=>e+Number(t.remaining||0),0);s<=x?(t.innerHTML=`⚠️ <b style="color:${o};">${a}</b> 재고 없음 — ${r.requiresSeparation?`먼저 분리 작업이 필요합니다.`:`소분X 재고가 없습니다.`}`,t.style.color=`#c0392b`):(t.innerHTML=`📌 <b style="color:${o};">${a}</b> 재고에서 출고됩니다 (현재 ${E(s)}개 보유)`,t.style.color=`#555`)},updateOutType(),document.getElementById(`btnSaveOut`).addEventListener(`click`,async()=>h(Q,async e=>{let{addDoc:r,updateDoc:i,recordActivity:s}=g(e),c=document.getElementById(`m_product`).value,l=D(),u=document.getElementById(`m_date`).value,d=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(l)||l<=0||!u){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!d){alert(`담당자는 필수입니다.`);return}if(await f(u,e))return;let p=b.find(e=>e.displayName===c);if(!p){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let m=p.requiresSeparation?`separated`:`noSplit`,h=p.requiresSeparation?`분리O`:`소분X`,_=n.filter(e=>e.productName===c&&e.stockType===m).sort((e,t)=>e.date.localeCompare(t.date)),v=_.reduce((e,t)=>e+Number(t.remaining||0),0);if(l-v>x){let e=p.requiresSeparation?`

분리 작업을 먼저 진행해주세요.`:``;alert(`${h} 재고가 부족합니다. (현재: ${E(v)}개)${e}`);return}let y=l;for(let e of _){if(y<=0)break;let n=Number(e.remaining||0),r=Math.min(n,y),a=T(n-r);await i(t(o,`frozenSeparation`,e.id),{remaining:a,closed:a<=x,updatedAt:new Date}),y=T(y-r)}if(await r(a(o,`frozenSeparationLogs`),{date:u,timestamp:new Date,type:`out`,productName:c,fromStockType:m,qty:l,staffName:d}),await s({action:`frozenSep`,subAction:`out`,date:u,staff:d,message:`분리작업 출고 — ${c} -${E(l)}개 (${h}) / 담당: ${d}`,details:{productName:c,qty:l,fromStockType:m,autoDecided:!0}}),!e.isCurrent())return;closeModal();let[S,O]=await Promise.all([C(),w()]);e.isCurrent()&&(V(S,O),alert(`출고 완료!`))},{roles:[`admin`,`office`,`production`]}))}function J(e){Z(`
    <h3 class="modal-title">수동 조정</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(e.map(e=>e.productName))].map(e=>`<option value="${e}">${e}</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>재고 종류 *</label>
      <select id="m_stockType">
        <option value="notSeparated">분리X</option>
        <option value="separated">분리O</option>
        <option value="noSplit">소분X</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량(개) *</label>
        <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
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
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>h(Q,async n=>{let{addDoc:r,updateDoc:i,recordActivity:s}=g(n),c=document.getElementById(`m_product`).value,u=document.getElementById(`m_stockType`).value,d=document.getElementById(`m_adjustType`).value,p=D(),m=document.getElementById(`m_reason`).value.trim(),h=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(p)||p<=0||!m||!h){alert(`모든 필수 항목을 입력해주세요.`);return}let _=l();if(await f(_,n))return;let v=d===`plus`?p:-p,y=e.filter(e=>e.productName===c&&e.stockType===u).sort((e,t)=>e.date.localeCompare(t.date));if(y.length>0){let e=y[0],n=Number(e.remaining||0),r=T(n+v);if(r<-x){alert(`조정 후 잔량이 ${E(r)}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${E(n)}개에서 최대 ${E(n)}개까지만 감소 가능합니다.`);return}await i(t(o,`frozenSeparation`,e.id),{remaining:r,closed:r<=x,updatedAt:new Date})}else{if(v<0){alert(`해당 제품/구분의 재고가 없습니다.
수동조정으로 음수 재고를 만들 수 없습니다.`);return}await r(a(o,`frozenSeparation`),{date:l(),productName:c,stockType:u,initialQty:v,remaining:v,staffName:h,note:m,closed:!1,createdAt:new Date,updatedAt:new Date})}if(await r(a(o,`frozenSeparationLogs`),{date:l(),timestamp:new Date,type:`adjust`,productName:c,fromStockType:u,qty:v,staffName:h,reason:m}),await s({action:`frozenSep`,subAction:`adjust`,date:_,staff:h,message:`동결 분리작업 수동조정 — ${c} (${k(u)}) ${v>=0?`+`:``}${E(v)}개 / 사유: ${m} / 담당: ${h}`,details:{productName:c,stockType:u,delta:v,reason:m}}),!n.isCurrent())return;closeModal();let[b,S]=await Promise.all([C(),w()]);n.isCurrent()&&(V(b,S),alert(`조정 완료!`))},{roles:[`admin`,`office`,`production`]}))}var Y={};function X(e){let t=``;for(let n of e)(Y[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}s(`frozenSep`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var Q=d(`frozenSep`);Q.refresh=S;async function $(e){let[n,r,i,a,s]=await Promise.all([v(e),C(e),w(e),y(e),e.getDoc(t(o,`settings`,`frozenSepProductOrder`))]);return{recipes:n,stocks:r,logs:i,staff:a,order:s.exists()&&s.data().order||[]}}function ee({cacheOnly:e=!0}={}){return Q.prepare?.(`default`,$,{cacheOnly:e})}export{ee as preparePage,S as renderFrozenSep};