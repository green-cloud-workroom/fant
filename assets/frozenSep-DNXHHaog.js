import{a as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-CWp5uCwe.js";import{n as o}from"./firebase-Bm8Fqw4J.js";import{r as s}from"./pageLifecycle-_b6L3DA3.js";import{n as c}from"./modalManager-D53QKIlh.js";import{n as l}from"./modal-IG9zwovL.js";import{G as u,L as d,f}from"./index-D_UGCn0E.js";import{n as p}from"./activityLogs-BTtaVYAg.js";import{t as m}from"./statusToast-DAQ_Eu62.js";import{t as h}from"./closingGuard-Bl-YyKoI.js";import{t as g}from"./sortable-D4-rSntl.js";import{t as _}from"./pageRefresh-CTQeqqTA.js";import{t as v}from"./pageCommand-DFDSdQot.js";import{t as y}from"./commandWrites-CRLDlIM1.js";import{n as b,t as x}from"./recipe-DZIBRSu5.js";import{t as S}from"./pageStaff-CCF6NjM9.js";var C=[],w=1e-6;async function T({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">동결 분리작업 로딩 중...</p>`;let n=await Q.load(e=>$(e),{force:e,onChange:_(Q,T)});!n||!t.isConnected||(C=n.recipes,Y=n.staff,L=n.order,z(n.stocks,n.logs))}async function E(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenSeparation`),i(`date`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed)}async function D(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenSeparationLogs`),i(`timestamp`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()}))}function O(e){return Math.round((Number(e)||0)*1e6)/1e6}function k(e){return O(e).toLocaleString(`ko-KR`,{maximumFractionDigits:3})}function A(e=`m_qty`){let t=Number(document.getElementById(e).value);return Number.isFinite(t)?t:NaN}function j(){return u===`admin`||u===`office`}function M(e){return e===`notSeparated`?`분리X`:e===`separated`?`분리O`:`소분X`}function ee(e){return e===`notSeparated`?`tag-cat`:e===`separated`?`tag-raw`:`tag-freezeDry`}function N(e){let t=Number(e.qty||0);switch(e.type){case`incoming`:return[{stockType:e.toStockType,delta:t}];case`separate`:return[{stockType:e.fromStockType,delta:-t},{stockType:e.toStockType,delta:t}];case`out`:return[{stockType:e.fromStockType,delta:-t}];case`adjust`:return[{stockType:e.fromStockType,delta:t}];case`delete`:return[{stockType:e.fromStockType,delta:t}];default:return[]}}function te(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=O((n[t]||0)+Number(e.remaining||0))});let r={};for(let e of t){let t=N(e),i={};t.forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;i[t.stockType]=O(n[r]||0),n[r]=O((n[r]||0)-t.delta)}),r[e.id]=i}return r}function ne(e){return{incoming:`입고`,separate:`분리`,out:`출고`,adjust:`조정`,delete:`삭제`}[e]||e}function re(e){return{incoming:`#2d7a3a`,separate:`#1f6fb2`,out:`#b97a1f`,adjust:`#8a5fbf`,delete:`#e53e3e`}[e]||`#555`}var P={notSeparated:{bar:`#EF9F27`,bg:`#fdf3e0`,text:`#b97a1f`},separated:{bar:`#1D9E75`,bg:`#e8f5ea`,text:`#2d7a3a`},noSplit:{bar:`#378ADD`,bg:`#e8f0fc`,text:`#2d4a8a`}},F=new Set,I=`daily`,L=[];function R(e){return[...e].sort((e,t)=>{let n=L.indexOf(e),r=L.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t,`ko`):1:-1})}function ie(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=O((n[t]||0)+Number(e.remaining||0))});let r=[...new Set(t.map(e=>e.date).filter(Boolean))].sort().reverse(),i=d(),a=r.includes(i)?r:[i,...r.filter(e=>e<i)],o=[...t].filter(e=>e.date).sort((e,t)=>t.date.localeCompare(e.date)),s=0,c={},l={};for(let e of a){for(;s<o.length&&o[s].date>e;){let e=o[s];N(e).forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;n[r]=O((n[r]||0)-t.delta)}),s++}c[e]={...n},l[e]=[...new Set(t.filter(t=>t.date===e).map(e=>e.staffName).filter(Boolean))].join(`, `)}return{dates:a,snapshots:c,staffByDate:l}}function z(e,n=[]){let r=document.getElementById(`mainContent`),i=j(),a=te(e,n),s=R([...new Set([...e.map(e=>e.productName),...n.map(e=>e.productName).filter(Boolean)])]);r.innerHTML=`
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
          style="padding:10px 20px;background:${I===`daily`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${I===`daily`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${I===`daily`?`600`:`400`};color:${I===`daily`?`#1a1a1a`:`#888`};">
          일별 현황
        </button>
        <button class="sep-view-tab" data-view="product"
          style="padding:10px 20px;background:${I===`product`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${I===`product`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${I===`product`?`600`:`400`};color:${I===`product`?`#1a1a1a`:`#888`};">
          제품별 이력
        </button>
      </div>

      ${I===`daily`?B(e,n,s):`<div style="display:flex;flex-direction:column;gap:12px;">
            ${s.length===0?`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`:s.map(t=>ae(t,e,n,a,i)).join(``)}
          </div>`}
    </div>
  `,document.getElementById(`btnIncoming`).addEventListener(`click`,()=>V(e)),document.getElementById(`btnSeparate`).addEventListener(`click`,()=>H(e)),document.getElementById(`btnOut`).addEventListener(`click`,()=>U(e)),document.getElementById(`btnAdjust`).addEventListener(`click`,()=>W(e));let c=document.getElementById(`sepMatrixHeadRow`);c&&i&&new g(c,{animation:150,draggable:`.sep-col-th`,direction:`horizontal`,onEnd:async()=>v(Q,async r=>{let{setDoc:i}=y(r),a=[...c.querySelectorAll(`.sep-col-th`)].map(e=>e.dataset.product);L=a;try{await i(t(o,`settings`,`frozenSepProductOrder`),{order:a,updatedAt:new Date})}catch(e){console.error(`saveSepProductOrder:`,e),alert(`순서 저장 실패: `+e.message)}r.isCurrent()&&z(e,n)},{roles:[`admin`,`office`]})}),document.querySelectorAll(`.sep-view-tab`).forEach(t=>{t.addEventListener(`click`,()=>{I=t.dataset.view,z(e,n)})}),document.querySelectorAll(`.sep-card-header`).forEach(t=>{t.addEventListener(`click`,()=>{let r=t.dataset.product;F.has(r)?F.delete(r):F.add(r),z(e,n)})}),document.querySelectorAll(`.btnDeleteFrozenSep`).forEach(t=>{t.addEventListener(`click`,n=>{n.stopPropagation();let r=e.find(e=>e.id===t.dataset.id);r&&oe(r)})})}function B(e,t,n){if(n.length===0)return`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`;let{dates:r,snapshots:i,staffByDate:a}=ie(e,t),o=[`separated`,`notSeparated`,`noSplit`],s={};n.forEach(e=>{s[e]=new Set}),e.forEach(e=>s[e.productName]?.add(e.stockType)),t.forEach(e=>{N(e).forEach(t=>{t.stockType&&s[e.productName]?.add(t.stockType)})});let c=[];n.forEach(e=>{let t=o.filter(t=>s[e].has(t));(t.length?t:[`notSeparated`]).forEach(t=>c.push({product:e,stockType:t}))});let l=[`#fdf3e0`,`#e8f0fc`,`#e8f5ea`,`#f3ecfa`,`#fbeaea`,`#e9f6f4`],u=j();return`
    <div style="background:white;border-radius:12px;border:1px solid #e8e8e8;overflow-x:auto;">
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr id="sepMatrixHeadRow">
            <th rowspan="2" style="background:#fbfaf5;font-size:12px;padding:8px;border:1px solid #e0e0e0;min-width:56px;">날짜</th>
            <th rowspan="2" style="background:#fbfaf5;font-size:12px;padding:8px;border:1px solid #e0e0e0;min-width:80px;">작업 담당자</th>
            ${n.map((e,t)=>{let n=o.filter(t=>s[e].has(t)).length||1;return`<th colspan="${n}" class="sep-col-th" data-product="${e}" style="background:${l[t%l.length]};font-size:12px;padding:8px 6px;border:1px solid #e0e0e0;text-align:center;min-width:${n*58}px;${u?`cursor:grab;`:``}" ${u?`title="드래그로 순서 변경"`:``}>${e}</th>`}).join(``)}
          </tr>
          <tr>${c.map(e=>{let t=P[e.stockType]||P.notSeparated;return`<th style="background:${t.bg};color:${t.text};font-size:11px;padding:5px 4px;border:1px solid #e0e0e0;text-align:center;">${M(e.stockType)}</th>`}).join(``)}</tr>
        </thead>
        <tbody>${r.map(e=>{let t=i[e]||{},n=c.map(e=>{let n=t[`${e.product}|${e.stockType}`]||0;return`<td style="border:1px solid #eee;text-align:center;padding:8px 4px;font-size:12.5px;${n>w?`font-weight:600;color:#333;`:`color:#ddd;`}">${n>w?k(n):``}</td>`}).join(``);return`
      <tr>
        <td style="border:1px solid #eee;text-align:center;padding:8px 6px;font-size:12px;font-weight:600;color:#555;white-space:nowrap;">${e.slice(5).replace(`-`,`/`)}</td>
        <td style="border:1px solid #eee;text-align:center;padding:8px 6px;font-size:12px;color:#888;white-space:nowrap;">${a[e]||`-`}</td>
        ${n}
      </tr>
    `}).join(``)}</tbody>
      </table>
    </div>
    <p style="font-size:11px;color:#aaa;margin-top:8px;">각 칸은 해당 날짜 마감 시점의 잔량입니다. 현재 재고에서 작업 이력을 역산해 계산됩니다.</p>
  `}function ae(e,t,n,r,i){let a=F.has(e),o=t.filter(t=>t.productName===e),s=n.filter(t=>t.productName===e),c={};o.forEach(e=>{c[e.stockType]=O((c[e.stockType]||0)+Number(e.remaining||0))});let l=0,u=0,d=0,f=0;s.forEach(e=>{let t=Number(e.qty||0);e.type===`incoming`?l+=t:e.type===`separate`?u+=t:e.type===`out`?d+=t:(e.type===`adjust`||e.type===`delete`)&&(f+=t)});let p=[`누적 입고 <b style="font-weight:600;color:#333;">${k(l)}개</b>`];u>0&&p.push(`분리 완료 <b style="font-weight:600;color:#333;">${k(u)}개</b>`),p.push(`출고 <b style="font-weight:600;color:#333;">${k(d)}개</b>`),Math.abs(f)>w&&p.push(`조정 <b style="font-weight:600;color:#333;">${f>0?`+`:``}${k(f)}개</b>`);let m=Object.entries(c).filter(([,e])=>e>w).map(([e,t])=>{let n=P[e]||P.notSeparated;return`<span style="background:${n.bg};color:${n.text};font-size:11px;padding:3px 10px;border-radius:10px;white-space:nowrap;">${M(e)} ${k(t)}</span>`}).join(``),h=Object.values(c).reduce((e,t)=>e+t,0),g=h>w?Object.entries(c).filter(([,e])=>e>w).map(([e,t])=>{let n=P[e]||P.notSeparated;return{st:e,pct:t/h*100,color:n.bar}}):[],_=g.length>0?`
    <div style="padding:0 18px 8px;">
      <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:#f5f5f5;">
        ${g.map(e=>`<div style="width:${e.pct}%;background:${e.color};"></div>`).join(``)}
      </div>
      <div style="display:flex;gap:14px;margin-top:5px;font-size:11px;color:#999;">
        ${g.map(e=>`<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${e.color};margin-right:4px;"></span>${M(e.st)} ${Math.round(e.pct)}%</span>`).join(``)}
      </div>
    </div>
  `:``,v=s.map(e=>{let t=Number(e.qty||0),n=r[e.id]||{},i=N(e),a=``;e.type===`incoming`?a=`${M(e.toStockType)} +${k(t)}개`:e.type===`separate`?a=`분리X → 분리O ${k(t)}개`:e.type===`out`?a=`${M(e.fromStockType)} -${k(t)}개`:e.type===`adjust`?a=`${M(e.fromStockType)} ${t>=0?`+`:``}${k(t)}개`:e.type===`delete`&&(a=`${M(e.fromStockType)} ${k(t)}개`);let o=i.filter(e=>e.stockType&&n[e.stockType]!==void 0).map(e=>{let t=n[e.stockType],r=O(t-e.delta);return`${M(e.stockType)} ${k(r)} → <b style="font-weight:600;color:#333;">${k(t)}</b>`}).join(` · `)||`-`;return`
      <tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:7px 0;color:#999;font-size:12px;width:76px;">${(e.date||``).slice(5)||`-`}</td>
        <td style="width:48px;"><span style="color:${re(e.type)};font-weight:600;font-size:12px;">${ne(e.type)}</span></td>
        <td style="font-size:12.5px;">${a}</td>
        <td style="text-align:right;color:#888;font-size:12px;">${o}</td>
        <td style="text-align:right;color:#999;font-size:12px;width:64px;">${e.staffName||`-`}</td>
      </tr>
    `}).join(``),y=o.map(e=>`
    <tr style="border-top:1px solid #f0f0f0;">
      <td style="padding:6px 0;color:#999;font-size:12px;width:90px;">${e.date}</td>
      <td style="width:60px;"><span class="tag ${ee(e.stockType)}" style="font-size:10px;">${M(e.stockType)}</span></td>
      <td style="font-size:12.5px;font-weight:600;">${k(e.remaining)}개 <span style="font-weight:400;font-size:11px;color:#999;">/ 최초 ${k(e.initialQty)}개</span></td>
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
  `}async function oe(e){return v(Q,async n=>{let{writeBatch:r,recordActivity:i}=y(n);if(!j()){alert(`삭제 권한이 없습니다.`);return}if(await h(e.date,n))return;let s=Number(e.initialQty||0),c=Number(e.remaining||0);if(c<=0){alert(`삭제할 남은 수량이 없습니다.`);return}if(Math.abs(s-c)>w){alert(`이미 일부 사용된 항목은 바로 삭제할 수 없습니다.
관련 출고/분리 작업을 먼저 되돌리거나 수동 조정을 사용해주세요.`);return}let u=window.prompt(`삭제 담당자 이름을 입력해주세요.`);if(!u||!u.trim())return;let f=M(e.stockType);if(!await l({title:`동결 분리작업 삭제`,message:`${e.productName} / ${f} / ${k(c)}개 항목을 삭제합니다.\n잘못 입력한 항목일 때만 진행해주세요.`,confirmText:`삭제`,cancelText:`취소`,danger:!0}))return;let p=r(o),m=t(o,`frozenSeparation`,e.id),g=t(a(o,`frozenSeparationLogs`)),_=new Date,v=u.trim();p.update(m,{remaining:0,closed:!0,status:`deleted`,deletedAt:_,deletedBy:v,updatedAt:_}),p.set(g,{date:d(),timestamp:_,type:`delete`,productName:e.productName,fromStockType:e.stockType,qty:-c,staffName:v,note:`wrong input delete`,sourceStockId:e.id}),await p.commit(),await i({action:`frozenSep`,subAction:`delete`,date:d(),staff:v,message:`동결 분리작업 삭제 — ${e.productName} ${k(c)}개 (${f}) / 담당: ${v}`,details:{frozenSeparationId:e.id,productName:e.productName,qty:c,stockType:e.stockType,note:e.note||null}});let[b,x]=await Promise.all([E(),D()]);n.isCurrent()&&(z(b,x),alert(`삭제 완료!`))},{roles:[`admin`,`office`]})}function V(e,t=null){Z(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name" onchange="updateSepGuide()">${b(C)}</select>
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
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${d()}" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    ${G()}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),K(t),window.updateSepGuide=function(){let e=document.getElementById(`m_name`).value,t=document.getElementById(`m_sepGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let n=C.find(t=>t.displayName===e);if(!n){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}n.requiresSeparation?(t.innerHTML=`📌 이 제품은 <b>분리 작업이 필요</b>합니다 → <b style="color:#c0392b;">분리X</b>로 입고됩니다.`,t.style.color=`#555`):(t.innerHTML=`📌 이 제품은 분리 작업이 불필요합니다 → <b style="color:#2d4a8a;">소분X</b>로 입고됩니다.`,t.style.color=`#555`)},updateSepGuide(),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>J(async e=>{let{addDoc:t,recordActivity:n}=y(e),r=document.getElementById(`m_name`).value.trim(),i=A(),s=document.getElementById(`m_date`).value,c=document.getElementById(`m_staff`).value,l=document.getElementById(`m_note`).value;if(!r||!Number.isFinite(i)||i<=0||!s){alert(`제품명, 수량, 날짜는 필수입니다.`);return}if(!c){alert(`담당자는 필수입니다.`);return}if(await h(s,e))return;let u=C.find(e=>e.displayName===r);if(!u){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let d=u.requiresSeparation===!0,f=d?`notSeparated`:`noSplit`,p=d?`분리X`:`소분X`,g=await t(a(o,`frozenSeparation`),{date:s,productName:r,stockType:f,initialQty:i,remaining:i,staffName:c,note:l,closed:!1,createdAt:new Date,updatedAt:new Date});if(await t(a(o,`frozenSeparationLogs`),{date:s,timestamp:new Date,type:`incoming`,productName:r,toStockType:f,qty:i,staffName:c,note:l}),await n({action:`frozenSep`,subAction:`incoming`,date:s,staff:c,message:`분리작업 입고 — ${r} +${k(i)}개 (${p}) / 담당: ${c}`,details:{frozenSeparationId:g.id,productName:r,qty:i,stockType:f,sepNeeded:d,autoDecided:!0,note:l||null}}),!e.isCurrent())return;let _=q();closeModal();let[v,b]=await Promise.all([E(),D()]);if(e.isCurrent())return z(v,b),m(`입고 완료!`),{continueWith:_}},V))}function H(e,n=null){let r=e.filter(e=>e.stockType===`notSeparated`);Z(`
    <h3 class="modal-title">분리 작업</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(r.map(e=>e.productName))].map(e=>`<option value="${e}">${e} (분리X: ${k(r.filter(t=>t.productName===e).reduce((e,t)=>e+Number(t.remaining||0),0))}개)</option>`).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
    <div class="form-group">
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${d()}" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`office`])}
      </select>
    </div>
    ${G()}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSeparate">작업 완료</button>
    </div>
  `),K(n),document.getElementById(`btnSaveSeparate`).addEventListener(`click`,async()=>J(async e=>{let{addDoc:n,updateDoc:i,recordActivity:s}=y(e),c=document.getElementById(`m_product`).value,l=A(),u=document.getElementById(`m_date`).value,d=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(l)||l<=0||!u){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!d){alert(`담당자는 필수입니다.`);return}if(await h(u,e))return;let f=r.filter(e=>e.productName===c).sort((e,t)=>e.date.localeCompare(t.date)),p=f.reduce((e,t)=>e+Number(t.remaining||0),0);if(l-p>w){alert(`분리X 재고가 부족합니다. (현재: ${k(p)}개)`);return}let g=l;for(let e of f){if(g<=0)break;let n=Number(e.remaining||0),r=Math.min(n,g),a=O(n-r);await i(t(o,`frozenSeparation`,e.id),{remaining:a,closed:a<=w,updatedAt:new Date}),g=O(g-r)}let _=await n(a(o,`frozenSeparation`),{date:u,productName:c,stockType:`separated`,initialQty:l,remaining:l,staffName:d,note:``,closed:!1,createdAt:new Date,updatedAt:new Date});if(await n(a(o,`frozenSeparationLogs`),{date:u,timestamp:new Date,type:`separate`,productName:c,fromStockType:`notSeparated`,toStockType:`separated`,qty:l,staffName:d}),await s({action:`frozenSep`,subAction:`separate`,date:u,staff:d,message:`분리 작업 — ${c} ${k(l)}개 (분리X → 분리O) / 담당: ${d}`,details:{newSeparatedId:_.id,productName:c,qty:l,fromStockType:`notSeparated`,toStockType:`separated`}}),!e.isCurrent())return;let v=q();closeModal();let[b,x]=await Promise.all([E(),D()]);if(e.isCurrent())return z(b,x),m(`분리 작업 완료!`),{continueWith:v}},H))}function U(e,n=null){let r=e.filter(e=>e.stockType===`separated`||e.stockType===`noSplit`);Z(`
    <h3 class="modal-title">출고</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product" onchange="updateOutType()">
        <option value="">선택</option>
        ${[...new Set(r.map(e=>e.productName))].map(e=>`<option value="${e}">${e}</option>`).join(``)}
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
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${d()}" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${X([`senior`,`office`])}
      </select>
    </div>
    ${G()}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOut">출고</button>
    </div>
  `),K(n),window.updateOutType=function(){let e=document.getElementById(`m_product`).value,t=document.getElementById(`m_outGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let n=C.find(t=>t.displayName===e);if(!n){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}let i=n.requiresSeparation?`separated`:`noSplit`,a=n.requiresSeparation?`분리O`:`소분X`,o=n.requiresSeparation?`#2d7a3a`:`#2d4a8a`,s=r.filter(t=>t.productName===e&&t.stockType===i).reduce((e,t)=>e+Number(t.remaining||0),0);s<=w?(t.innerHTML=`⚠️ <b style="color:${o};">${a}</b> 재고 없음 — ${n.requiresSeparation?`먼저 분리 작업이 필요합니다.`:`소분X 재고가 없습니다.`}`,t.style.color=`#c0392b`):(t.innerHTML=`📌 <b style="color:${o};">${a}</b> 재고에서 출고됩니다 (현재 ${k(s)}개 보유)`,t.style.color=`#555`)},updateOutType(),document.getElementById(`btnSaveOut`).addEventListener(`click`,async()=>J(async e=>{let{addDoc:n,updateDoc:i,recordActivity:s}=y(e),c=document.getElementById(`m_product`).value,l=A(),u=document.getElementById(`m_date`).value,d=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(l)||l<=0||!u){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!d){alert(`담당자는 필수입니다.`);return}if(await h(u,e))return;let f=C.find(e=>e.displayName===c);if(!f){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let p=f.requiresSeparation?`separated`:`noSplit`,g=f.requiresSeparation?`분리O`:`소분X`,_=r.filter(e=>e.productName===c&&e.stockType===p).sort((e,t)=>e.date.localeCompare(t.date)),v=_.reduce((e,t)=>e+Number(t.remaining||0),0);if(l-v>w){let e=f.requiresSeparation?`

분리 작업을 먼저 진행해주세요.`:``;alert(`${g} 재고가 부족합니다. (현재: ${k(v)}개)${e}`);return}let b=l;for(let e of _){if(b<=0)break;let n=Number(e.remaining||0),r=Math.min(n,b),a=O(n-r);await i(t(o,`frozenSeparation`,e.id),{remaining:a,closed:a<=w,updatedAt:new Date}),b=O(b-r)}if(await n(a(o,`frozenSeparationLogs`),{date:u,timestamp:new Date,type:`out`,productName:c,fromStockType:p,qty:l,staffName:d}),await s({action:`frozenSep`,subAction:`out`,date:u,staff:d,message:`분리작업 출고 — ${c} -${k(l)}개 (${g}) / 담당: ${d}`,details:{productName:c,qty:l,fromStockType:p,autoDecided:!0}}),!e.isCurrent())return;let x=q();closeModal();let[S,T]=await Promise.all([E(),D()]);if(e.isCurrent())return z(S,T),m(`출고 완료!`),{continueWith:x}},U))}function W(e){let n=R([...new Set([...e.map(e=>e.productName),...C.map(e=>e.displayName),...(Q.model?.logs||[]).map(e=>e.productName)].filter(Boolean))]),r=t(a(o,`frozenSeparationLogs`));Z(`
    <h3 class="modal-title">수동 조정</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${n.map(e=>`<option value="${e}">${e}</option>`).join(``)}
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
    <div class="form-group"><label for="m_entryMode">입력 방식</label><select id="m_entryMode"><option value="actual">실제로 센 잔량 입력</option><option value="delta">증가·감소량 입력</option></select></div>
    <div id="m_adjustPreview" role="status" style="padding:10px;background:#f7f7f7;margin-bottom:12px;">제품과 재고 종류를 선택해주세요.</div>
    <div class="form-row">
      <div class="form-group" id="m_directionGroup">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label id="m_qtyLabel">증가·감소량(개) *</label>
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
  `);let i=()=>e.filter(e=>e.productName===document.getElementById(`m_product`).value&&e.stockType===document.getElementById(`m_stockType`).value),s=()=>{let e=document.getElementById(`m_entryMode`).value===`actual`;document.getElementById(`m_directionGroup`).style.display=e?`none`:``,document.getElementById(`m_qtyLabel`).textContent=e?`실제로 센 잔량(개) *`:`증가·감소량(개) *`;let t=document.getElementById(`m_qty`),n=O(i().reduce((e,t)=>e+Number(t.remaining||0),0));if(!document.getElementById(`m_product`).value){document.getElementById(`m_adjustPreview`).textContent=`제품과 재고 종류를 선택해주세요.`;return}let r=Number(t.value),a=e?r:O(n+(document.getElementById(`m_adjustType`).value===`minus`?-r:r));document.getElementById(`m_adjustPreview`).textContent=`현재 잔량 ${k(n)}개`+(t.value!==``&&Number.isFinite(r)?` → 조정 후 ${k(a)}개${a<0?` (재고 부족)`:``}`:``)};for(let e of[`m_product`,`m_stockType`,`m_entryMode`])document.getElementById(e).addEventListener(`change`,()=>{document.getElementById(`m_qty`).value=``,s()});document.getElementById(`m_adjustType`).addEventListener(`change`,s),document.getElementById(`m_qty`).addEventListener(`input`,s),s(),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>v(Q,async e=>{let n=document.getElementById(`m_product`).value,s=document.getElementById(`m_stockType`).value,c=document.getElementById(`m_adjustType`).value,l=A(),u=document.getElementById(`m_reason`).value.trim(),f=document.getElementById(`m_staff`).value,g=document.getElementById(`m_entryMode`).value===`actual`;if(!n||document.getElementById(`m_qty`).value===``||!Number.isFinite(l)||(g?l<0:l<=0)||!u||!f){alert(`모든 필수 항목을 입력해주세요.`);return}let _=d();if(await h(_,e))return;let v=i().sort((e,t)=>e.date.localeCompare(t.date)||e.id.localeCompare(t.id)),y=O(v.reduce((e,t)=>e+Number(t.remaining||0),0)),b=g?O(l-y):c===`plus`?l:-l;if(Math.abs(b)<=w){m(`현재 재고와 같아 조정할 내용이 없습니다.`);return}if(y+b<-w){alert(`현재 재고 ${k(y)}개보다 많이 감소할 수 없습니다.`);return}let x=t(a(o,`frozenSeparation`)),S=v.map(e=>t(o,`frozenSeparation`,e.id));if(await e.transaction(o,async e=>{let[i,a,...c]=await Promise.all([e.get(r),e.get(t(o,`closings`,_)),...S.map(t=>e.get(t))]);if(!i.exists()){if(a.exists()&&a.data().status===`closed`)throw Error(`마감된 날짜에는 입력할 수 없습니다.`);for(let e=0;e<c.length;e++){let t=c[e].exists()?c[e].data():null,r=v[e];if(!t||t.closed||t.productName!==n||t.stockType!==s||Number(t.remaining)!==Number(r.remaining))throw Error(`재고가 변경됐습니다. 최신 자료를 확인해주세요.`)}if(b<0){let t=-b;for(let n=0;n<v.length&&t>w;n++){let r=Math.min(Number(v[n].remaining),t),i=O(Number(v[n].remaining)-r);e.update(S[n],{remaining:i,closed:i<=w,updatedAt:new Date}),t=O(t-r)}}else v.length?e.update(S[0],{remaining:O(Number(v[0].remaining)+b),closed:!1,updatedAt:new Date}):e.set(x,{date:_,productName:n,stockType:s,initialQty:b,remaining:b,staffName:f,note:u,closed:!1,createdAt:new Date,updatedAt:new Date});e.set(r,{date:_,timestamp:new Date,type:`adjust`,productName:n,fromStockType:s,qty:b,staffName:f,reason:u}),await p({action:`frozenSep`,subAction:`adjust`,date:_,staff:f,message:`동결 분리작업 수동조정 — ${n} (${M(s)}) ${b>=0?`+`:``}${k(b)}개 / 사유: ${u} / 담당: ${f}`,details:{productName:n,stockType:s,delta:b,reason:u}},{batch:e})}},{targets:[...S,x,r]}),!e.isCurrent())return;closeModal();let[C,T]=await Promise.all([E(),D()]);e.isCurrent()&&(z(C,T),m(`조정 완료!`))},{roles:[`admin`,`office`,`production`]}))}function G(){return`<label style="display:block;margin:12px 0;"><input type="checkbox" id="m_continue" /> 저장 후 다음 품목 계속 입력 (날짜·담당자 유지)</label>`}function K(e){e&&(document.getElementById(`m_date`).value=e.date,document.getElementById(`m_staff`).value=e.staff,document.getElementById(`m_continue`).checked=!0)}function q(){return document.getElementById(`m_continue`)?.checked?{date:document.getElementById(`m_date`).value,staff:document.getElementById(`m_staff`).value}:null}async function J(e,t){let n=s(),r=await v(Q,e,{roles:[`admin`,`office`,`production`]});r?.continueWith&&!Q.blocked&&(!n||n.isCurrent())&&Q.model&&t(Q.model.stocks,r.continueWith)}var Y={};function X(e){let t=``;for(let n of e)(Y[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`frozenSep`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var Q=f(`frozenSep`);Q.refresh=T;async function $(e){let[n,r,i,a,s]=await Promise.all([x(e),E(e),D(e),S(e),e.getDoc(t(o,`settings`,`frozenSepProductOrder`))]);return{recipes:n,stocks:r,logs:i,staff:a,order:s.exists()&&s.data().order||[]}}function se({cacheOnly:e=!0}={}){return Q.prepare?.(`default`,$,{cacheOnly:e})}export{se as preparePage,T as renderFrozenSep};