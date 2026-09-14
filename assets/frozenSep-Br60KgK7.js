import{_ as e,d as t,h as n,i as r,n as i,o as a,p as o,u as s,v as c,y as l}from"./index.esm-ESivpAya.js";import{n as u}from"./firebase-I0rBIq9V.js";import{n as d}from"./modalManager-Z4b2ihO9.js";import{B as f,M as p,g as m}from"./index-BMnUILA5.js";import{n as h}from"./activityLogs-Dl6VA3lF.js";import{t as g}from"./closingGuard-CmDbUY7v.js";import{t as _}from"./sortable-BlBt-ybB.js";import{n as v,t as y}from"./recipe-ByOjZMRJ.js";var b=[],x=1e-6;async function S(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결 분리작업 로딩 중...</p></div>`;let[t,n,r]=await Promise.all([y(),C(),w(),Z(),z()]);e.isConnected&&(b=t,H(n,r))}async function C(){return(await a(t(c(u,`frozenSeparation`),s(`date`,`desc`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed)}async function w(){return(await a(t(c(u,`frozenSeparationLogs`),s(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}function T(e){return Math.round((Number(e)||0)*1e6)/1e6}function E(e){return T(e).toLocaleString(`ko-KR`,{maximumFractionDigits:3})}function D(e=`m_qty`){let t=Number(document.getElementById(e).value);return Number.isFinite(t)?t:NaN}function O(){return f===`admin`||f===`office`}function k(e){return e===`notSeparated`?`분리X`:e===`separated`?`분리O`:`소분X`}function A(e){return e===`notSeparated`?`tag-cat`:e===`separated`?`tag-raw`:`tag-freezeDry`}function j(e){let t=Number(e.qty||0);switch(e.type){case`incoming`:return[{stockType:e.toStockType,delta:t}];case`separate`:return[{stockType:e.fromStockType,delta:-t},{stockType:e.toStockType,delta:t}];case`out`:return[{stockType:e.fromStockType,delta:-t}];case`adjust`:return[{stockType:e.fromStockType,delta:t}];case`delete`:return[{stockType:e.fromStockType,delta:t}];default:return[]}}function M(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=T((n[t]||0)+Number(e.remaining||0))});let r={};for(let e of t){let t=j(e),i={};t.forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;i[t.stockType]=T(n[r]||0),n[r]=T((n[r]||0)-t.delta)}),r[e.id]=i}return r}function N(e){return{incoming:`입고`,separate:`분리`,out:`출고`,adjust:`조정`,delete:`삭제`}[e]||e}function P(e){return{incoming:`#2d7a3a`,separate:`#1f6fb2`,out:`#b97a1f`,adjust:`#8a5fbf`,delete:`#e53e3e`}[e]||`#555`}var F={notSeparated:{bar:`#EF9F27`,bg:`#fdf3e0`,text:`#b97a1f`},separated:{bar:`#1D9E75`,bg:`#e8f5ea`,text:`#2d7a3a`},noSplit:{bar:`#378ADD`,bg:`#e8f0fc`,text:`#2d4a8a`}},I=new Set,L=`daily`,R=[];async function z(){try{let e=await r(l(u,`settings`,`frozenSepProductOrder`));R=e.exists()&&e.data().order||[]}catch(e){console.error(`loadSepProductOrder:`,e),R=[]}}function B(e){return[...e].sort((e,t)=>{let n=R.indexOf(e),r=R.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t,`ko`):1:-1})}function V(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=T((n[t]||0)+Number(e.remaining||0))});let r=[...new Set(t.map(e=>e.date).filter(Boolean))].sort().reverse(),i=p(),a=r.includes(i)?r:[i,...r.filter(e=>e<i)],o=[...t].filter(e=>e.date).sort((e,t)=>t.date.localeCompare(e.date)),s=0,c={},l={};for(let e of a){for(;s<o.length&&o[s].date>e;){let e=o[s];j(e).forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;n[r]=T((n[r]||0)-t.delta)}),s++}c[e]={...n},l[e]=[...new Set(t.filter(t=>t.date===e).map(e=>e.staffName).filter(Boolean))].join(`, `)}return{dates:a,snapshots:c,staffByDate:l}}function H(e,t=[]){let n=document.getElementById(`mainContent`),r=O(),i=M(e,t),a=B([...new Set([...e.map(e=>e.productName),...t.map(e=>e.productName).filter(Boolean)])]);n.innerHTML=`
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

      ${L===`daily`?U(e,t,a):`<div style="display:flex;flex-direction:column;gap:12px;">
            ${a.length===0?`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`:a.map(n=>W(n,e,t,i,r)).join(``)}
          </div>`}
    </div>
  `,document.getElementById(`btnIncoming`).addEventListener(`click`,()=>K(e)),document.getElementById(`btnSeparate`).addEventListener(`click`,()=>q(e)),document.getElementById(`btnOut`).addEventListener(`click`,()=>J(e)),document.getElementById(`btnAdjust`).addEventListener(`click`,()=>Y(e));let s=document.getElementById(`sepMatrixHeadRow`);s&&r&&new _(s,{animation:150,draggable:`.sep-col-th`,direction:`horizontal`,onEnd:async()=>{let n=[...s.querySelectorAll(`.sep-col-th`)].map(e=>e.dataset.product);R=n;try{await o(l(u,`settings`,`frozenSepProductOrder`),{order:n,updatedAt:new Date})}catch(e){console.error(`saveSepProductOrder:`,e),alert(`순서 저장 실패: `+e.message)}H(e,t)}}),document.querySelectorAll(`.sep-view-tab`).forEach(n=>{n.addEventListener(`click`,()=>{L=n.dataset.view,H(e,t)})}),document.querySelectorAll(`.sep-card-header`).forEach(n=>{n.addEventListener(`click`,()=>{let r=n.dataset.product;I.has(r)?I.delete(r):I.add(r),H(e,t)})}),document.querySelectorAll(`.btnDeleteFrozenSep`).forEach(t=>{t.addEventListener(`click`,n=>{n.stopPropagation();let r=e.find(e=>e.id===t.dataset.id);r&&G(r)})})}function U(e,t,n){if(n.length===0)return`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`;let{dates:r,snapshots:i,staffByDate:a}=V(e,t),o=[`separated`,`notSeparated`,`noSplit`],s={};n.forEach(e=>{s[e]=new Set}),e.forEach(e=>s[e.productName]?.add(e.stockType)),t.forEach(e=>{j(e).forEach(t=>{t.stockType&&s[e.productName]?.add(t.stockType)})});let c=[];n.forEach(e=>{let t=o.filter(t=>s[e].has(t));(t.length?t:[`notSeparated`]).forEach(t=>c.push({product:e,stockType:t}))});let l=[`#fdf3e0`,`#e8f0fc`,`#e8f5ea`,`#f3ecfa`,`#fbeaea`,`#e9f6f4`],u=O();return`
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
  `}function W(e,t,n,r,i){let a=I.has(e),o=t.filter(t=>t.productName===e),s=n.filter(t=>t.productName===e),c={};o.forEach(e=>{c[e.stockType]=T((c[e.stockType]||0)+Number(e.remaining||0))});let l=0,u=0,d=0,f=0;s.forEach(e=>{let t=Number(e.qty||0);e.type===`incoming`?l+=t:e.type===`separate`?u+=t:e.type===`out`?d+=t:(e.type===`adjust`||e.type===`delete`)&&(f+=t)});let p=[`누적 입고 <b style="font-weight:600;color:#333;">${E(l)}개</b>`];u>0&&p.push(`분리 완료 <b style="font-weight:600;color:#333;">${E(u)}개</b>`),p.push(`출고 <b style="font-weight:600;color:#333;">${E(d)}개</b>`),Math.abs(f)>x&&p.push(`조정 <b style="font-weight:600;color:#333;">${f>0?`+`:``}${E(f)}개</b>`);let m=Object.entries(c).filter(([,e])=>e>x).map(([e,t])=>{let n=F[e]||F.notSeparated;return`<span style="background:${n.bg};color:${n.text};font-size:11px;padding:3px 10px;border-radius:10px;white-space:nowrap;">${k(e)} ${E(t)}</span>`}).join(``),h=Object.values(c).reduce((e,t)=>e+t,0),g=h>x?Object.entries(c).filter(([,e])=>e>x).map(([e,t])=>{let n=F[e]||F.notSeparated;return{st:e,pct:t/h*100,color:n.bar}}):[],_=g.length>0?`
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
  `}async function G(t){if(!O()){alert(`삭제 권한이 없습니다.`);return}if(await g(t.date))return;let n=Number(t.initialQty||0),r=Number(t.remaining||0);if(r<=0){alert(`삭제할 남은 수량이 없습니다.`);return}if(Math.abs(n-r)>x){alert(`이미 일부 사용된 항목은 바로 삭제할 수 없습니다.
관련 출고/분리 작업을 먼저 되돌리거나 수동 조정을 사용해주세요.`);return}let i=window.prompt(`삭제 담당자 이름을 입력해주세요.`);if(!i||!i.trim())return;let a=k(t.stockType);if(!await m({title:`동결 분리작업 삭제`,message:`${t.productName} / ${a} / ${E(r)}개 항목을 삭제합니다.\n잘못 입력한 항목일 때만 진행해주세요.`,confirmText:`삭제`,cancelText:`취소`,danger:!0}))return;let o=e(u),s=l(u,`frozenSeparation`,t.id),d=l(c(u,`frozenSeparationLogs`)),f=new Date,_=i.trim();o.update(s,{remaining:0,closed:!0,status:`deleted`,deletedAt:f,deletedBy:_,updatedAt:f}),o.set(d,{date:p(),timestamp:f,type:`delete`,productName:t.productName,fromStockType:t.stockType,qty:-r,staffName:_,note:`wrong input delete`,sourceStockId:t.id}),await o.commit(),await h({action:`frozenSep`,subAction:`delete`,date:p(),staff:_,message:`동결 분리작업 삭제 — ${t.productName} ${E(r)}개 (${a}) / 담당: ${_}`,details:{frozenSeparationId:t.id,productName:t.productName,qty:r,stockType:t.stockType,note:t.note||null}});let[v,y]=await Promise.all([C(),w()]);H(v,y),alert(`삭제 완료!`)}function K(e){$(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name" onchange="updateSepGuide()">${v(b)}</select>
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
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`office`])}
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
  `),window.updateSepGuide=function(){let e=document.getElementById(`m_name`).value,t=document.getElementById(`m_sepGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let n=b.find(t=>t.displayName===e);if(!n){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}n.requiresSeparation?(t.innerHTML=`📌 이 제품은 <b>분리 작업이 필요</b>합니다 → <b style="color:#c0392b;">분리X</b>로 입고됩니다.`,t.style.color=`#555`):(t.innerHTML=`📌 이 제품은 분리 작업이 불필요합니다 → <b style="color:#2d4a8a;">소분X</b>로 입고됩니다.`,t.style.color=`#555`)},updateSepGuide(),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_name`).value.trim(),t=D(),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value;if(!e||!Number.isFinite(t)||t<=0||!n){alert(`제품명, 수량, 날짜는 필수입니다.`);return}if(!r){alert(`담당자는 필수입니다.`);return}if(await g(n))return;let o=b.find(t=>t.displayName===e);if(!o){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let s=o.requiresSeparation===!0,l=s?`notSeparated`:`noSplit`,d=s?`분리X`:`소분X`,f=await i(c(u,`frozenSeparation`),{date:n,productName:e,stockType:l,initialQty:t,remaining:t,staffName:r,note:a,closed:!1,createdAt:new Date,updatedAt:new Date});await i(c(u,`frozenSeparationLogs`),{date:n,timestamp:new Date,type:`incoming`,productName:e,toStockType:l,qty:t,staffName:r,note:a}),await h({action:`frozenSep`,subAction:`incoming`,date:n,staff:r,message:`분리작업 입고 — ${e} +${E(t)}개 (${d}) / 담당: ${r}`,details:{frozenSeparationId:f.id,productName:e,qty:t,stockType:l,sepNeeded:s,autoDecided:!0,note:a||null}}),closeModal();let[p,m]=await Promise.all([C(),w()]);H(p,m),alert(`입고 완료!`)})}function q(e){let t=e.filter(e=>e.stockType===`notSeparated`);$(`
    <h3 class="modal-title">분리 작업</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(t.map(e=>e.productName))].map(e=>`<option value="${e}">${e} (분리X: ${E(t.filter(t=>t.productName===e).reduce((e,t)=>e+Number(t.remaining||0),0))}개)</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSeparate">작업 완료</button>
    </div>
  `),document.getElementById(`btnSaveSeparate`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_product`).value,r=D(),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value;if(!e||!Number.isFinite(r)||r<=0||!a){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await g(a))return;let s=t.filter(t=>t.productName===e).sort((e,t)=>e.date.localeCompare(t.date)),d=s.reduce((e,t)=>e+Number(t.remaining||0),0);if(r-d>x){alert(`분리X 재고가 부족합니다. (현재: ${E(d)}개)`);return}let f=r;for(let e of s){if(f<=0)break;let t=Number(e.remaining||0),r=Math.min(t,f),i=T(t-r);await n(l(u,`frozenSeparation`,e.id),{remaining:i,closed:i<=x,updatedAt:new Date}),f=T(f-r)}let p=await i(c(u,`frozenSeparation`),{date:a,productName:e,stockType:`separated`,initialQty:r,remaining:r,staffName:o,note:``,closed:!1,createdAt:new Date,updatedAt:new Date});await i(c(u,`frozenSeparationLogs`),{date:a,timestamp:new Date,type:`separate`,productName:e,fromStockType:`notSeparated`,toStockType:`separated`,qty:r,staffName:o}),await h({action:`frozenSep`,subAction:`separate`,date:a,staff:o,message:`분리 작업 — ${e} ${E(r)}개 (분리X → 분리O) / 담당: ${o}`,details:{newSeparatedId:p.id,productName:e,qty:r,fromStockType:`notSeparated`,toStockType:`separated`}}),closeModal();let[m,_]=await Promise.all([C(),w()]);H(m,_),alert(`분리 작업 완료!`)})}function J(e){let t=e.filter(e=>e.stockType===`separated`||e.stockType===`noSplit`);$(`
    <h3 class="modal-title">출고</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product" onchange="updateOutType()">
        <option value="">선택</option>
        ${[...new Set(t.map(e=>e.productName))].map(e=>`<option value="${e}">${e}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${p()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOut">출고</button>
    </div>
  `),window.updateOutType=function(){let e=document.getElementById(`m_product`).value,n=document.getElementById(`m_outGuide`);if(!e){n.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,n.style.color=`#555`;return}let r=b.find(t=>t.displayName===e);if(!r){n.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,n.style.color=`#c0392b`;return}let i=r.requiresSeparation?`separated`:`noSplit`,a=r.requiresSeparation?`분리O`:`소분X`,o=r.requiresSeparation?`#2d7a3a`:`#2d4a8a`,s=t.filter(t=>t.productName===e&&t.stockType===i).reduce((e,t)=>e+Number(t.remaining||0),0);s<=x?(n.innerHTML=`⚠️ <b style="color:${o};">${a}</b> 재고 없음 — ${r.requiresSeparation?`먼저 분리 작업이 필요합니다.`:`소분X 재고가 없습니다.`}`,n.style.color=`#c0392b`):(n.innerHTML=`📌 <b style="color:${o};">${a}</b> 재고에서 출고됩니다 (현재 ${E(s)}개 보유)`,n.style.color=`#555`)},updateOutType(),document.getElementById(`btnSaveOut`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_product`).value,r=D(),a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value;if(!e||!Number.isFinite(r)||r<=0||!a){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await g(a))return;let s=b.find(t=>t.displayName===e);if(!s){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let d=s.requiresSeparation?`separated`:`noSplit`,f=s.requiresSeparation?`분리O`:`소분X`,p=t.filter(t=>t.productName===e&&t.stockType===d).sort((e,t)=>e.date.localeCompare(t.date)),m=p.reduce((e,t)=>e+Number(t.remaining||0),0);if(r-m>x){let e=s.requiresSeparation?`

분리 작업을 먼저 진행해주세요.`:``;alert(`${f} 재고가 부족합니다. (현재: ${E(m)}개)${e}`);return}let _=r;for(let e of p){if(_<=0)break;let t=Number(e.remaining||0),r=Math.min(t,_),i=T(t-r);await n(l(u,`frozenSeparation`,e.id),{remaining:i,closed:i<=x,updatedAt:new Date}),_=T(_-r)}await i(c(u,`frozenSeparationLogs`),{date:a,timestamp:new Date,type:`out`,productName:e,fromStockType:d,qty:r,staffName:o}),await h({action:`frozenSep`,subAction:`out`,date:a,staff:o,message:`분리작업 출고 — ${e} -${E(r)}개 (${f}) / 담당: ${o}`,details:{productName:e,qty:r,fromStockType:d,autoDecided:!0}}),closeModal();let[v,y]=await Promise.all([C(),w()]);H(v,y),alert(`출고 완료!`)})}function Y(e){$(`
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
        ${Q([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let t=document.getElementById(`m_product`).value,r=document.getElementById(`m_stockType`).value,a=document.getElementById(`m_adjustType`).value,o=D(),s=document.getElementById(`m_reason`).value.trim(),d=document.getElementById(`m_staff`).value;if(!t||!Number.isFinite(o)||o<=0||!s||!d){alert(`모든 필수 항목을 입력해주세요.`);return}let f=p();if(await g(f))return;let m=a===`plus`?o:-o,_=e.filter(e=>e.productName===t&&e.stockType===r).sort((e,t)=>e.date.localeCompare(t.date));if(_.length>0){let e=_[0],t=Number(e.remaining||0),r=T(t+m);if(r<-x){alert(`조정 후 잔량이 ${E(r)}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${E(t)}개에서 최대 ${E(t)}개까지만 감소 가능합니다.`);return}await n(l(u,`frozenSeparation`,e.id),{remaining:r,closed:r<=x,updatedAt:new Date})}else{if(m<0){alert(`해당 제품/구분의 재고가 없습니다.
수동조정으로 음수 재고를 만들 수 없습니다.`);return}await i(c(u,`frozenSeparation`),{date:p(),productName:t,stockType:r,initialQty:m,remaining:m,staffName:d,note:s,closed:!1,createdAt:new Date,updatedAt:new Date})}await i(c(u,`frozenSeparationLogs`),{date:p(),timestamp:new Date,type:`adjust`,productName:t,fromStockType:r,qty:m,staffName:d,reason:s}),await h({action:`frozenSep`,subAction:`adjust`,date:f,staff:d,message:`동결 분리작업 수동조정 — ${t} (${k(r)}) ${m>=0?`+`:``}${E(m)}개 / 사유: ${s} / 담당: ${d}`,details:{productName:t,stockType:r,delta:m,reason:s}}),closeModal();let[v,y]=await Promise.all([C(),w()]);H(v,y),alert(`조정 완료!`)})}var X={};async function Z(){Object.keys(X).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await r(l(u,`staffGroups`,e));t.exists()&&(X[e]=t.data().members||[])}))}function Q(e){let t=``;for(let n of e)(X[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}d(`frozenSep`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{S as renderFrozenSep};