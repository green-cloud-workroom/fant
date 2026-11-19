import{a as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-eiUBzuYc.js";import{n as o}from"./firebase-Dpb5TxpT.js";import{i as s}from"./staffText-DBRrEFyl.js";import{n as c}from"./modalManager-D53QKIlh.js";import{n as l,r as u}from"./modal-5yNlUCJi.js";import{A as d,O as f,U as p,n as m,tt as h,ut as g,v as _}from"./index-OopjTXxK.js";import{t as v}from"./statusToast-B9R20x7w.js";import{t as y}from"./closingGuard-DyQpxifZ.js";import{t as b}from"./sortable-86SCnTX3.js";import{t as x}from"./pageRefresh-xLPeF9ex.js";import{t as S}from"./pageCommand-BhWO87G5.js";import{t as C}from"./commandWrites-CGGOhBM6.js";import{n as w,t as T}from"./atomicStockOperation-CHnj1ZA5.js";import{n as ee,t as te}from"./recipe-DHGLS4ty.js";import{t as ne}from"./pageStaff-4krvzfbz.js";var E=[],D=1e-6;async function O({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<p style="padding:24px">동결 분리작업 로딩 중...</p>`;let n=await $.load(e=>fe(e),{force:e,onChange:x($,O)});!n||!t.isConnected||(E=n.recipes,X=n.staff,B=n.order,H(n.stocks,n.logs))}async function k(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenSeparation`),i(`date`,`desc`));return(await t.getDocs(s)).docs.map(e=>({...e.data(),id:e.id})).filter(e=>!e.closed)}async function A(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenSeparationLogs`),i(`timestamp`,`desc`));return(await t.getDocs(s)).docs.map(e=>({...e.data(),id:e.id}))}function j(e){return Math.round((Number(e)||0)*1e6)/1e6}function M(e){return j(e).toLocaleString(`ko-KR`,{maximumFractionDigits:3})}function N(e=`m_qty`){let t=Number(document.getElementById(e).value);return Number.isFinite(t)?t:NaN}function P(){return g===`admin`||g===`office`}function F(e){return e===`notSeparated`?`분리X`:e===`separated`?`분리O`:`소분X`}function re(e){return e===`notSeparated`?`tag-cat`:e===`separated`?`tag-raw`:`tag-freezeDry`}function I(e){let t=Number(e.qty||0);switch(e.type){case`incoming`:return[{stockType:e.toStockType,delta:t}];case`separate`:return[{stockType:e.fromStockType,delta:-t},{stockType:e.toStockType,delta:t}];case`out`:return[{stockType:e.fromStockType,delta:-t}];case`adjust`:return[{stockType:e.fromStockType,delta:t}];case`delete`:return[{stockType:e.fromStockType,delta:t}];default:return[]}}function ie(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=j((n[t]||0)+Number(e.remaining||0))});let r={};for(let e of t){let t=I(e),i={};t.forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;i[t.stockType]=j(n[r]||0),n[r]=j((n[r]||0)-t.delta)}),r[e.id]=i}return r}function ae(e){return{incoming:`입고`,separate:`분리`,out:`출고`,adjust:`조정`,delete:`삭제`}[e]||`작업 구분 확인 필요`}function oe(e){return{incoming:`#1F4E8C`,separate:`#1f6fb2`,out:`#b97a1f`,adjust:`#8a5fbf`,delete:`#e53e3e`}[e]||`#555`}var L={notSeparated:{bar:`#EF9F27`,bg:`#fdf3e0`,text:`#b97a1f`},separated:{bar:`#8B5E3C`,bg:`#EFE2D3`,text:`#4A2F1C`},noSplit:{bar:`#378ADD`,bg:`#e8f0fc`,text:`#2d4a8a`}},R=new Set,z=`daily`,B=[];function V(e){return[...e].sort((e,t)=>{let n=B.indexOf(e),r=B.indexOf(t);return n!==-1&&r!==-1?n-r:n===-1?r===-1?e.localeCompare(t,`ko`):1:-1})}function se(e,t){let n={};e.forEach(e=>{let t=`${e.productName}|${e.stockType}`;n[t]=j((n[t]||0)+Number(e.remaining||0))});let r=[...new Set(t.map(e=>e.date).filter(Boolean))].sort().reverse(),i=h(),a=r.includes(i)?r:[i,...r.filter(e=>e<i)],o=[...t].filter(e=>e.date).sort((e,t)=>t.date.localeCompare(e.date)),s=0,c={},l={};for(let e of a){for(;s<o.length&&o[s].date>e;){let e=o[s];I(e).forEach(t=>{if(!t.stockType)return;let r=`${e.productName}|${t.stockType}`;n[r]=j((n[r]||0)-t.delta)}),s++}c[e]={...n},l[e]=[...new Set(t.filter(t=>t.date===e).map(e=>e.staffName).filter(Boolean))].join(`, `)}return{dates:a,snapshots:c,staffByDate:l}}function H(e,n=[]){let r=document.getElementById(`mainContent`),i=P(),a=ie(e,n),c=V([...new Set([...e.map(e=>e.productName),...n.map(e=>e.productName).filter(Boolean)])]);r.innerHTML=`
    <div class="page-wrap frozen-sep-page">
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
          style="padding:10px 20px;background:${z===`daily`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${z===`daily`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${z===`daily`?`600`:`400`};color:${z===`daily`?`#1a1a1a`:`#888`};">
          일별 현황
        </button>
        <button class="sep-view-tab" data-view="product"
          style="padding:10px 20px;background:${z===`product`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${z===`product`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${z===`product`?`600`:`400`};color:${z===`product`?`#1a1a1a`:`#888`};">
          제품별 이력
        </button>
      </div>

      ${z===`daily`?ce(e,n,c):`<div style="display:flex;flex-direction:column;gap:12px;">
            ${c.length===0?`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`:c.map(t=>le(t,e,n,a,i)).join(``)}
          </div>`}
    </div>
  `,document.getElementById(`btnIncoming`).addEventListener(`click`,()=>U(e)),document.getElementById(`btnSeparate`).addEventListener(`click`,()=>W(e)),document.getElementById(`btnOut`).addEventListener(`click`,()=>G(e)),document.getElementById(`btnAdjust`).addEventListener(`click`,()=>de(e));let l=document.getElementById(`sepMatrixHeadRow`);l&&i&&new b(l,{animation:150,draggable:`.sep-col-th`,direction:`horizontal`,onEnd:async()=>S($,async r=>{let{setDoc:i}=C(r),a=[...l.querySelectorAll(`.sep-col-th`)].map(e=>e.dataset.product);B=a;try{await i(t(o,`settings`,`frozenSepProductOrder`),{order:a,updatedAt:new Date})}catch(e){console.error(`saveSepProductOrder:`,e),alert(`순서 저장 실패: `+s(e))}r.isCurrent()&&H(e,n)},{roles:[`admin`,`office`]})}),document.querySelectorAll(`.sep-view-tab`).forEach(t=>{t.addEventListener(`click`,()=>{z=t.dataset.view,H(e,n)})}),document.querySelectorAll(`.sep-card-header`).forEach(t=>{t.addEventListener(`click`,()=>{let r=t.dataset.product;R.has(r)?R.delete(r):R.add(r),H(e,n)})}),document.querySelectorAll(`.btnDeleteFrozenSep`).forEach(t=>{t.addEventListener(`click`,n=>{n.stopPropagation();let r=e.find(e=>e.id===t.dataset.id);r&&ue(r)})})}function ce(e,t,n){if(n.length===0)return`<div style="background:white;border-radius:12px;border:1px solid #e8e8e8;padding:32px;text-align:center;color:#aaa;font-size:13px;">등록된 재고/이력 없음</div>`;let{dates:r,snapshots:i,staffByDate:a}=se(e,t),o=[`separated`,`notSeparated`,`noSplit`],s=Object.create(null);n.forEach(e=>{s[e]=new Set}),e.forEach(e=>s[e.productName]?.add(e.stockType)),t.forEach(e=>{I(e).forEach(t=>{t.stockType&&s[e.productName]?.add(t.stockType)})});let c=[];n.forEach(e=>{let t=o.filter(t=>s[e].has(t));(t.length?t:[`notSeparated`]).forEach(t=>c.push({product:e,stockType:t}))});let l=[`#fdf3e0`,`#e8f0fc`,`#EFE2D3`,`#f3ecfa`,`#fbeaea`,`#EEEAF4`],u=P();return`
    <div style="background:white;border-radius:12px;border:1px solid #e8e8e8;overflow-x:auto;">
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr id="sepMatrixHeadRow">
            <th rowspan="2" style="background:#fbfaf5;font-size:12px;padding:8px;border:1px solid #e0e0e0;min-width:56px;">날짜</th>
            <th rowspan="2" style="background:#fbfaf5;font-size:12px;padding:8px;border:1px solid #e0e0e0;min-width:80px;">작업 담당자</th>
            ${n.map((e,t)=>{let n=o.filter(t=>s[e].has(t)).length||1;return`<th colspan="${n}" class="sep-col-th" data-product="${m(e)}" style="background:${l[t%l.length]};font-size:12px;padding:8px 6px;border:1px solid #e0e0e0;text-align:center;min-width:${n*58}px;${u?`cursor:grab;`:``}" ${u?`title="드래그로 순서 변경"`:``}>${m(e)}</th>`}).join(``)}
          </tr>
          <tr>${c.map(e=>{let t=L[e.stockType]||L.notSeparated;return`<th style="background:${t.bg};color:${t.text};font-size:11px;padding:5px 4px;border:1px solid #e0e0e0;text-align:center;">${F(e.stockType)}</th>`}).join(``)}</tr>
        </thead>
        <tbody>${r.map(e=>{let t=i[e]||{},n=c.map(e=>{let n=t[`${e.product}|${e.stockType}`]||0;return`<td style="border:1px solid #eee;text-align:center;padding:8px 4px;font-size:12.5px;${n>D?`font-weight:600;color:#333;`:`color:#ddd;`}">${n>D?M(n):``}</td>`}).join(``);return`
      <tr>
        <td style="border:1px solid #eee;text-align:center;padding:8px 6px;font-size:12px;font-weight:600;color:#555;white-space:nowrap;">${m(e.slice(5).replace(`-`,`/`))}</td>
        <td style="border:1px solid #eee;text-align:center;padding:8px 6px;font-size:12px;color:#888;white-space:nowrap;">${m(a[e]||`-`)}</td>
        ${n}
      </tr>
    `}).join(``)}</tbody>
      </table>
    </div>
    <p style="font-size:11px;color:#aaa;margin-top:8px;">각 칸은 해당 날짜 마감 시점의 잔량입니다. 현재 재고에서 작업 이력을 역산해 계산됩니다.</p>
  `}function le(e,t,n,r,i){let a=R.has(e),o=t.filter(t=>t.productName===e),s=n.filter(t=>t.productName===e),c={};o.forEach(e=>{c[e.stockType]=j((c[e.stockType]||0)+Number(e.remaining||0))});let l=0,u=0,d=0,f=0;s.forEach(e=>{let t=Number(e.qty||0);e.type===`incoming`?l+=t:e.type===`separate`?u+=t:e.type===`out`?d+=t:(e.type===`adjust`||e.type===`delete`)&&(f+=t)});let p=[`누적 입고 <b style="font-weight:600;color:#333;">${M(l)}개</b>`];u>0&&p.push(`분리 완료 <b style="font-weight:600;color:#333;">${M(u)}개</b>`),p.push(`출고 <b style="font-weight:600;color:#333;">${M(d)}개</b>`),Math.abs(f)>D&&p.push(`조정 <b style="font-weight:600;color:#333;">${f>0?`+`:``}${M(f)}개</b>`);let h=Object.entries(c).filter(([,e])=>e>D).map(([e,t])=>{let n=L[e]||L.notSeparated;return`<span style="background:${n.bg};color:${n.text};font-size:11px;padding:3px 10px;border-radius:10px;white-space:nowrap;">${F(e)} ${M(t)}</span>`}).join(``),g=Object.values(c).reduce((e,t)=>e+t,0),_=g>D?Object.entries(c).filter(([,e])=>e>D).map(([e,t])=>{let n=L[e]||L.notSeparated;return{st:e,pct:t/g*100,color:n.bar}}):[],v=_.length>0?`
    <div style="padding:0 18px 8px;">
      <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:#f5f5f5;">
        ${_.map(e=>`<div style="width:${e.pct}%;background:${e.color};"></div>`).join(``)}
      </div>
      <div style="display:flex;gap:14px;margin-top:5px;font-size:11px;color:#999;">
        ${_.map(e=>`<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${e.color};margin-right:4px;"></span>${F(e.st)} ${Math.round(e.pct)}%</span>`).join(``)}
      </div>
    </div>
  `:``,y=s.map(e=>{let t=Number(e.qty||0),n=r[e.id]||{},i=I(e),a=``;e.type===`incoming`?a=`${F(e.toStockType)} +${M(t)}개`:e.type===`separate`?a=`분리X → 분리O ${M(t)}개`:e.type===`out`?a=`${F(e.fromStockType)} -${M(t)}개`:e.type===`adjust`?a=`${F(e.fromStockType)} ${t>=0?`+`:``}${M(t)}개`:e.type===`delete`&&(a=`${F(e.fromStockType)} ${M(t)}개`);let o=i.filter(e=>e.stockType&&n[e.stockType]!==void 0).map(e=>{let t=n[e.stockType],r=j(t-e.delta);return`${F(e.stockType)} ${M(r)} → <b style="font-weight:600;color:#333;">${M(t)}</b>`}).join(` · `)||`-`;return`
      <tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:7px 0;color:#999;font-size:12px;width:76px;">${m((e.date||``).slice(5)||`-`)}</td>
        <td style="width:48px;"><span style="color:${oe(e.type)};font-weight:600;font-size:12px;">${m(ae(e.type))}</span></td>
        <td style="font-size:12.5px;">${a}</td>
        <td style="text-align:right;color:#888;font-size:12px;">${o}</td>
        <td style="text-align:right;color:#999;font-size:12px;width:64px;">${m(e.staffName||`-`)}</td>
      </tr>
    `}).join(``),b=o.map(e=>`
    <tr style="border-top:1px solid #f0f0f0;">
      <td style="padding:6px 0;color:#999;font-size:12px;width:90px;">${m(e.date)}</td>
      <td style="width:60px;"><span class="tag ${re(e.stockType)}" style="font-size:10px;">${F(e.stockType)}</span></td>
      <td style="font-size:12.5px;font-weight:600;">${M(e.remaining)}개 <span style="font-weight:400;font-size:11px;color:#999;">/ 최초 ${M(e.initialQty)}개</span></td>
      <td style="color:#999;font-size:12px;">${m(e.staffName||`-`)}</td>
      <td style="color:#999;font-size:12px;">${m(e.note||`-`)}</td>
      ${i?`<td style="text-align:right;width:52px;"><button class="btn-del-row btnDeleteFrozenSep" data-id="${m(e.id)}">삭제</button></td>`:``}
    </tr>
  `).join(``);return`
    <div style="background:white;border:1px solid #e8e8e8;border-radius:12px;overflow:hidden;">
      <div class="sep-card-header" data-product="${m(e)}" style="padding:14px 18px;display:flex;align-items:center;gap:14px;cursor:pointer;user-select:none;">
        <span style="font-size:13px;color:#bbb;transform:rotate(${a?`90deg`:`0deg`});transition:transform 0.15s;">▶</span>
        <span style="font-size:15px;font-weight:600;min-width:150px;">${m(e)}</span>
        <span style="font-size:12px;color:#888;">${p.join(` · `)}</span>
        <span style="margin-left:auto;display:flex;gap:6px;">${h||`<span style="font-size:11px;color:#ccc;">재고 없음</span>`}</span>
      </div>
      ${a?`
        ${v}
        <div style="border-top:1px solid #f0f0f0;padding:10px 18px 14px;">
          <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:4px;">작업 이력</div>
          <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
            ${y||`<tr><td style="padding:8px 0;color:#ccc;font-size:12px;">이력 없음</td></tr>`}
          </table>
        </div>
        ${o.length>0?`
          <div style="border-top:1px solid #f0f0f0;padding:10px 18px 14px;background:#fafafa;">
            <div style="font-size:12px;font-weight:600;color:#888;margin-bottom:4px;">현재 lot</div>
            <table style="width:100%;font-size:12.5px;border-collapse:collapse;">
              ${b}
            </table>
          </div>
        `:``}
      `:``}
    </div>
  `}async function ue(e){return S($,async n=>{if(!P()){alert(`삭제 권한이 없습니다.`);return}if(await y(e.date,n))return;let r=Number(e.initialQty||0),i=Number(e.remaining||0);if(i<=0){alert(`삭제할 남은 수량이 없습니다.`);return}if(Math.abs(r-i)>D){alert(`이미 일부 사용된 항목은 바로 삭제할 수 없습니다.
관련 출고/분리 작업을 먼저 되돌리거나 수동 조정을 사용해주세요.`);return}let s=await u({title:`동결 분리작업 삭제`,label:`삭제 담당자 이름`,required:!0});if(!s||!s.trim())return;let c=F(e.stockType);if(!await l({title:`동결 분리작업 삭제`,message:`${e.productName} / ${c} / ${M(i)}개 항목을 삭제합니다.\n잘못 입력한 항목일 때만 진행해주세요.`,confirmText:`삭제`,cancelText:`취소`,danger:!0}))return;let d=t(o,`frozenSeparation`,e.id),m=t(a(o,`frozenSeparationLogs`)),g=t(a(o,`activityLogs`)),_=new Date,v=s.trim();await C(n).runTransaction(o,async t=>{let n=await t.get(d),r=n.exists()?n.data():null;if(!r||r.status===`deleted`||r.closed===!0||e.updatedAt!=null&&r.updatedAt!=null&&f(e.updatedAt)!==f(r.updatedAt)||Math.abs(Number(r.remaining||0)-i)>D||Math.abs(Number(r.initialQty||0)-Number(r.remaining||0))>D)throw Error(`삭제하려는 항목이 방금 변경되었습니다. 최신 자료를 확인한 뒤 다시 시도해주세요.`);t.update(d,{remaining:0,closed:!0,status:`deleted`,deletedAt:_,deletedBy:v,updatedAt:_}),t.set(m,{date:h(),timestamp:_,type:`delete`,productName:e.productName,fromStockType:e.stockType,qty:-i,staffName:v,note:`wrong input delete`,sourceStockId:e.id}),await p({action:`frozenSep`,subAction:`delete`,date:h(),staff:v,message:`동결 분리작업 삭제 — ${e.productName} ${M(i)}개 (${c}) / 담당: ${v}`,details:{frozenSeparationId:e.id,productName:e.productName,qty:i,stockType:e.stockType,note:e.note||null}},{batch:t,ref:g})});let[b,x]=await Promise.all([k(),A()]);n.isCurrent()&&(H(b,x),alert(`삭제 완료!`))},{roles:[`admin`,`office`]})}function U(e,t=null){Q(`
    <h3 class="modal-title">원물 입고</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <select id="m_name" onchange="updateSepGuide()">${ee(E)}</select>
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
      <input type="date" id="m_date" value="${h()}" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    ${K()}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `),q(t),window.updateSepGuide=function(){let e=document.getElementById(`m_name`).value,t=document.getElementById(`m_sepGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let n=E.find(t=>t.displayName===e);if(!n){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}n.requiresSeparation?(t.innerHTML=`📌 이 제품은 <b>분리 작업이 필요</b>합니다 → <b style="color:#c0392b;">분리X</b>로 입고됩니다.`,t.style.color=`#555`):(t.innerHTML=`📌 이 제품은 분리 작업이 불필요합니다 → <b style="color:#2d4a8a;">소분X</b>로 입고됩니다.`,t.style.color=`#555`)},updateSepGuide(),document.getElementById(`btnSaveIncoming`).addEventListener(`click`,async()=>Y(async e=>{let t=document.getElementById(`m_name`).value.trim(),n=N(),r=document.getElementById(`m_date`).value,i=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!t||!Number.isFinite(n)||n<=0||!r){alert(`제품명, 수량, 날짜는 필수입니다.`);return}if(!i){alert(`담당자는 필수입니다.`);return}if(await y(r,e))return;let c=E.find(e=>e.displayName===t);if(!c){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let l=c.requiresSeparation===!0,u=l?`notSeparated`:`noSplit`,d=l?`분리X`:`소분X`;if(await T({db:o,command:e,operationId:w(o,document.getElementById(`btnSaveIncoming`)),actionType:`frozenSepIncoming`,date:r,request:{productName:t,qty:n,staff:i,stockType:u,note:s},build:async({writer:e})=>{let{addDoc:c,recordActivity:f}=e,p=await c(a(o,`frozenSeparation`),{date:r,productName:t,stockType:u,initialQty:n,remaining:n,staffName:i,note:s,closed:!1,createdAt:new Date,updatedAt:new Date});await c(a(o,`frozenSeparationLogs`),{date:r,timestamp:new Date,type:`incoming`,productName:t,toStockType:u,qty:n,staffName:i,note:s}),await f({action:`frozenSep`,subAction:`incoming`,date:r,staff:i,message:`분리작업 입고 — ${t} +${M(n)}개 (${d}) / 담당: ${i}`,details:{frozenSeparationId:p.id,productName:t,qty:n,stockType:u,sepNeeded:l,autoDecided:!0,note:s||null}})}}),!e.isCurrent())return;let f=J();closeModal();let[p,m]=await Promise.all([k(),A()]);if(e.isCurrent())return H(p,m),v(`입고 완료!`),{continueWith:f}},U))}function W(e,n=null){let r=e.filter(e=>e.stockType===`notSeparated`);Q(`
    <h3 class="modal-title">분리 작업</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${[...new Set(r.map(e=>e.productName))].map(e=>{let t=r.filter(t=>t.productName===e).reduce((e,t)=>e+Number(t.remaining||0),0);return`<option value="${m(e)}">${m(e)} (분리X: ${M(t)}개)</option>`}).join(``)}
      </select>
    </div>
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="예: 0.2" min="0" step="0.01" />
    </div>
    <div class="form-group">
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${h()}" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`senior`,`office`])}
      </select>
    </div>
    ${K()}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveSeparate">작업 완료</button>
    </div>
  `),q(n),document.getElementById(`btnSaveSeparate`).addEventListener(`click`,async()=>Y(async e=>{let{addDoc:n,updateDoc:i,recordActivity:s}=C(e),c=document.getElementById(`m_product`).value,l=N(),u=document.getElementById(`m_date`).value,d=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(l)||l<=0||!u){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!d){alert(`담당자는 필수입니다.`);return}if(await y(u,e)||(await T({db:o,command:e,operationId:w(o,document.getElementById(`btnSaveSeparate`)),actionType:`frozenSepSeparate`,date:u,request:{productName:c,qty:l,staff:d},inputs:{frozenSeparation:r.filter(e=>e.productName===c)},build:async({writer:e,fresh:n})=>{let{addDoc:r,updateDoc:i,recordActivity:s}=e,f=n.frozenSeparation.filter(e=>e.productName===c).sort((e,t)=>e.date.localeCompare(t.date)),p=f.reduce((e,t)=>e+Number(t.remaining||0),0);if(l-p>D)throw Error(`분리X 재고가 부족합니다. (현재: ${M(p)}개)`);let m=l;for(let e of f){if(m<=0)break;let n=Number(e.remaining||0),r=Math.min(n,m),a=j(n-r);await i(t(o,`frozenSeparation`,e.id),{remaining:a,closed:a<=D,updatedAt:new Date}),m=j(m-r)}let h=await r(a(o,`frozenSeparation`),{date:u,productName:c,stockType:`separated`,initialQty:l,remaining:l,staffName:d,note:``,closed:!1,createdAt:new Date,updatedAt:new Date});await r(a(o,`frozenSeparationLogs`),{date:u,timestamp:new Date,type:`separate`,productName:c,fromStockType:`notSeparated`,toStockType:`separated`,qty:l,staffName:d}),await s({action:`frozenSep`,subAction:`separate`,date:u,staff:d,message:`분리 작업 — ${c} ${M(l)}개 (분리X → 분리O) / 담당: ${d}`,details:{newSeparatedId:h.id,productName:c,qty:l,fromStockType:`notSeparated`,toStockType:`separated`}})}}),!e.isCurrent()))return;let f=J();closeModal();let[p,m]=await Promise.all([k(),A()]);if(e.isCurrent())return H(p,m),v(`분리 작업 완료!`),{continueWith:f}},W))}function G(e,n=null){let r=e.filter(e=>e.stockType===`separated`||e.stockType===`noSplit`);Q(`
    <h3 class="modal-title">출고</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product" onchange="updateOutType()">
        <option value="">선택</option>
        ${[...new Set(r.map(e=>e.productName))].map(e=>`<option value="${m(e)}">${m(e)}</option>`).join(``)}
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
      <input type="date" id="m_date" value="${h()}" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Z([`senior`,`office`])}
      </select>
    </div>
    ${K()}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveOut">출고</button>
    </div>
  `),q(n),window.updateOutType=function(){let e=document.getElementById(`m_product`).value,t=document.getElementById(`m_outGuide`);if(!e){t.innerHTML=`제품을 선택하면 자동으로 결정됩니다.`,t.style.color=`#555`;return}let n=E.find(t=>t.displayName===e);if(!n){t.innerHTML=`⚠️ 레시피를 찾을 수 없습니다.`,t.style.color=`#c0392b`;return}let i=n.requiresSeparation?`separated`:`noSplit`,a=n.requiresSeparation?`분리O`:`소분X`,o=n.requiresSeparation?`ui-success`:`sep-no-split-label`,s=r.filter(t=>t.productName===e&&t.stockType===i).reduce((e,t)=>e+Number(t.remaining||0),0);s<=D?(t.innerHTML=`⚠️ <b class="${o}">${a}</b> 재고 없음 — ${n.requiresSeparation?`먼저 분리 작업이 필요합니다.`:`소분X 재고가 없습니다.`}`,t.style.color=`#c0392b`):(t.innerHTML=`📌 <b class="${o}">${a}</b> 재고에서 출고됩니다 (현재 ${M(s)}개 보유)`,t.style.color=`#555`)},updateOutType(),document.getElementById(`btnSaveOut`).addEventListener(`click`,async()=>Y(async e=>{let{addDoc:n,updateDoc:i,recordActivity:s}=C(e),c=document.getElementById(`m_product`).value,l=N(),u=document.getElementById(`m_date`).value,d=document.getElementById(`m_staff`).value;if(!c||!Number.isFinite(l)||l<=0||!u){alert(`제품, 수량, 날짜는 필수입니다.`);return}if(!d){alert(`담당자는 필수입니다.`);return}if(await y(u,e))return;let f=E.find(e=>e.displayName===c);if(!f){alert(`레시피를 찾을 수 없습니다. 레시피 관리에서 등록 여부를 확인해주세요.`);return}let p=f.requiresSeparation?`separated`:`noSplit`,m=f.requiresSeparation?`분리O`:`소분X`;if(await T({db:o,command:e,operationId:w(o,document.getElementById(`btnSaveOut`)),actionType:`frozenSepOut`,date:u,request:{productName:c,qty:l,staff:d,stockType:p},inputs:{frozenSeparation:r.filter(e=>e.productName===c&&e.stockType===p)},build:async({writer:e,fresh:n})=>{let{addDoc:r,updateDoc:i,recordActivity:s}=e,h=n.frozenSeparation.filter(e=>e.productName===c&&e.stockType===p).sort((e,t)=>e.date.localeCompare(t.date)),g=h.reduce((e,t)=>e+Number(t.remaining||0),0);if(l-g>D){let e=f.requiresSeparation?`

분리 작업을 먼저 진행해주세요.`:``;throw Error(`${m} 재고가 부족합니다. (현재: ${M(g)}개)${e}`)}let _=l;for(let e of h){if(_<=0)break;let n=Number(e.remaining||0),r=Math.min(n,_),a=j(n-r);await i(t(o,`frozenSeparation`,e.id),{remaining:a,closed:a<=D,updatedAt:new Date}),_=j(_-r)}await r(a(o,`frozenSeparationLogs`),{date:u,timestamp:new Date,type:`out`,productName:c,fromStockType:p,qty:l,staffName:d}),await s({action:`frozenSep`,subAction:`out`,date:u,staff:d,message:`분리작업 출고 — ${c} -${M(l)}개 (${m}) / 담당: ${d}`,details:{productName:c,qty:l,fromStockType:p,autoDecided:!0}})}}),!e.isCurrent())return;let h=J();closeModal();let[g,_]=await Promise.all([k(),A()]);if(e.isCurrent())return H(g,_),v(`출고 완료!`),{continueWith:h}},G))}function de(e){let n=V([...new Set([...e.map(e=>e.productName),...E.map(e=>e.displayName),...($.model?.logs||[]).map(e=>e.productName)].filter(Boolean))]),r=t(a(o,`frozenSeparationLogs`));Q(`
    <h3 class="modal-title">수동 조정</h3>
    <div class="form-group">
      <label>제품 *</label>
      <select id="m_product">
        <option value="">선택</option>
        ${n.map(e=>`<option value="${m(e)}">${m(e)}</option>`).join(``)}
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
        ${Z([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);let i=()=>e.filter(e=>e.productName===document.getElementById(`m_product`).value&&e.stockType===document.getElementById(`m_stockType`).value),s=()=>{let e=document.getElementById(`m_entryMode`).value===`actual`;document.getElementById(`m_directionGroup`).style.display=e?`none`:``,document.getElementById(`m_qtyLabel`).textContent=e?`실제로 센 잔량(개) *`:`증가·감소량(개) *`;let t=document.getElementById(`m_qty`),n=j(i().reduce((e,t)=>e+Number(t.remaining||0),0));if(!document.getElementById(`m_product`).value){document.getElementById(`m_adjustPreview`).textContent=`제품과 재고 종류를 선택해주세요.`;return}let r=Number(t.value),a=e?r:j(n+(document.getElementById(`m_adjustType`).value===`minus`?-r:r));document.getElementById(`m_adjustPreview`).textContent=`현재 잔량 ${M(n)}개`+(t.value!==``&&Number.isFinite(r)?` → 조정 후 ${M(a)}개${a<0?` (재고 부족)`:``}`:``)};for(let e of[`m_product`,`m_stockType`,`m_entryMode`])document.getElementById(e).addEventListener(`change`,()=>{document.getElementById(`m_qty`).value=``,s()});document.getElementById(`m_adjustType`).addEventListener(`change`,s),document.getElementById(`m_qty`).addEventListener(`input`,s),s(),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>S($,async e=>{let n=document.getElementById(`m_product`).value,s=document.getElementById(`m_stockType`).value,c=document.getElementById(`m_adjustType`).value,l=N(),u=document.getElementById(`m_reason`).value.trim(),d=document.getElementById(`m_staff`).value,f=document.getElementById(`m_entryMode`).value===`actual`;if(!n||document.getElementById(`m_qty`).value===``||!Number.isFinite(l)||(f?l<0:l<=0)||!u||!d){alert(`모든 필수 항목을 입력해주세요.`);return}let m=h();if(await y(m,e))return;let g=i().sort((e,t)=>e.date.localeCompare(t.date)||e.id.localeCompare(t.id)),_=j(g.reduce((e,t)=>e+Number(t.remaining||0),0)),b=f?j(l-_):c===`plus`?l:-l;if(Math.abs(b)<=D){v(`현재 재고와 같아 조정할 내용이 없습니다.`);return}if(_+b<-D){alert(`현재 재고 ${M(_)}개보다 많이 감소할 수 없습니다.`);return}let x=t(a(o,`frozenSeparation`)),S=g.map(e=>t(o,`frozenSeparation`,e.id));if(await e.transaction(o,async e=>{let[i,a,...c]=await Promise.all([e.get(r),e.get(t(o,`closings`,m)),...S.map(t=>e.get(t))]);if(!i.exists()){if(a.exists()&&a.data().status===`closed`)throw Error(`마감된 날짜에는 입력할 수 없습니다.`);for(let e=0;e<c.length;e++){let t=c[e].exists()?c[e].data():null,r=g[e];if(!t||t.closed||t.productName!==n||t.stockType!==s||Number(t.remaining)!==Number(r.remaining))throw Error(`재고가 변경됐습니다. 최신 자료를 확인해주세요.`)}if(b<0){let t=-b;for(let n=0;n<g.length&&t>D;n++){let r=Math.min(Number(g[n].remaining),t),i=j(Number(g[n].remaining)-r);e.update(S[n],{remaining:i,closed:i<=D,updatedAt:new Date}),t=j(t-r)}}else g.length?e.update(S[0],{remaining:j(Number(g[0].remaining)+b),closed:!1,updatedAt:new Date}):e.set(x,{date:m,productName:n,stockType:s,initialQty:b,remaining:b,staffName:d,note:u,closed:!1,createdAt:new Date,updatedAt:new Date});e.set(r,{date:m,timestamp:new Date,type:`adjust`,productName:n,fromStockType:s,qty:b,staffName:d,reason:u}),await p({action:`frozenSep`,subAction:`adjust`,date:m,staff:d,message:`동결 분리작업 수동조정 — ${n} (${F(s)}) ${b>=0?`+`:``}${M(b)}개 / 사유: ${u} / 담당: ${d}`,details:{productName:n,stockType:s,delta:b,reason:u}},{batch:e})}},{targets:[...S,x,r]}),!e.isCurrent())return;closeModal();let[C,w]=await Promise.all([k(),A()]);e.isCurrent()&&(H(C,w),v(`조정 완료!`))},{roles:[`admin`,`office`,`production`]}))}function K(){return`<label style="display:block;margin:12px 0;"><input type="checkbox" id="m_continue" /> 저장 후 다음 품목 계속 입력 (날짜·담당자 유지)</label>`}function q(e){e&&(document.getElementById(`m_date`).value=e.date,document.getElementById(`m_staff`).value=e.staff,document.getElementById(`m_continue`).checked=!0)}function J(){return document.getElementById(`m_continue`)?.checked?{date:document.getElementById(`m_date`).value,staff:document.getElementById(`m_staff`).value}:null}async function Y(e,t){let n=d(),r=await S($,e,{roles:[`admin`,`office`,`production`]});r?.continueWith&&!$.blocked&&(!n||n.isCurrent())&&$.model&&t($.model.stocks,r.continueWith)}var X={};function Z(e){let t=``;for(let n of e)(X[n]||[]).forEach(e=>{t+=`<option value="${m(e.name)}">${m(e.name)}</option>`});return t}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`frozenSep`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var $=_(`frozenSep`);$.refresh=O;async function fe(e){let[n,r,i,a,s]=await Promise.all([te(e),k(e),A(e),ne(e),e.getDoc(t(o,`settings`,`frozenSepProductOrder`))]);return{recipes:n,stocks:r,logs:i,staff:a,order:s.exists()&&s.data().order||[]}}function pe({cacheOnly:e=!0}={}){return $.prepare?.(`default`,fe,{cacheOnly:e})}export{pe as preparePage,O as renderFrozenSep};