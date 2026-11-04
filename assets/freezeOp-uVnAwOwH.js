import{C as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-D8prxbkJ.js";import{n as o}from"./firebase-BOShkvR0.js";import{n as s}from"./modal-CCKYLKMo.js";import{A as c,K as l,j as u,tt as d,v as f}from"./index-Cu9Z_zO4.js";import{t as p}from"./pageRefresh-Do5Wbg3x.js";import{t as m}from"./pageCommand-CVO48Ghm.js";import{t as h}from"./commandWrites-C3qnuYMO.js";async function g(e,n,r,i,a=new Date){let o=t(n,`freezeOrders`,r),s=await e.get(o);if(!s.exists()||s.data().status!==`active`)throw Error(`발주서가 이미 변경되거나 취소되었습니다. 최신 자료를 확인해주세요.`);let c=s.data().deductions;if(!Array.isArray(c))throw Error(`발주서 차감 기록을 확인할 수 없습니다.`);let l=new Map;for(let e of c){if(typeof e?.lotId!=`string`||!e.lotId||e.lotId.includes(`/`)||typeof e.productName!=`string`||!e.productName||typeof e.amount!=`number`||!Number.isFinite(e.amount)||e.amount<=0)throw Error(`발주서 차감 기록이 올바르지 않습니다.`);let t=l.get(e.lotId);if(t&&t.productName!==e.productName)throw Error(`발주서 차감 기록이 서로 충돌합니다.`);let n=(t?.amount||0)+e.amount;if(!Number.isFinite(n))throw Error(`발주서 차감 기록의 수량이 올바르지 않습니다.`);l.set(e.lotId,{productName:e.productName,amount:n})}let u=[];for(let[r,i]of l){let a=t(n,`frozenPanLots`,r),o=await e.get(a),s=o.data();if(!o.exists()||s.productName!==i.productName||typeof s.remaining!=`number`||!Number.isFinite(s.remaining)||s.remaining<0||!Number.isFinite(s.remaining+i.amount))throw Error(`동결판 재고가 변경되었거나 유효하지 않습니다. 최신 자료를 확인해주세요.`);u.push({ref:a,remaining:s.remaining+i.amount})}for(let t of u)e.update(t.ref,{remaining:t.remaining,closed:!1,updatedAt:a});e.update(o,{status:`cancelled`,cancelledAt:a,cancelledBy:i})}var _=f(`freezeOp`);_.refresh=I;var v=[`#4299E1`,`#48BB78`,`#ED8936`,`#9F7AEA`,`#F56565`,`#38B2AC`,`#ECC94B`,`#667EEA`,`#FC8181`,`#68D391`,`#63B3ED`,`#F6AD55`,`#B794F4`,`#FBD38D`,`#90CDF4`],y=45,b=3,x=Array(y).fill(null),S=null,C=null,w=Object.create(null),T=!1;function E(){return T?document.getElementById(`freezeOpContent`):document.getElementById(`mainContent`)}function D(){return d}function O(){let e=D();return e===`admin`||e===`office`}async function k({force:e=!1}={}){T=!1;let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>동결가동 로딩 중...</p></div>`;let n=await P({force:e});if(!n)return;let{orders:r,lots:i}=n;document.getElementById(`mainContent`)===t&&L(r,i,{container:t,tabMode:!1})}async function A({force:e=!1}={}){T=!0;let t=document.getElementById(`freezeOpContent`);if(!t)return;t.innerHTML=`<p style="color:#888;font-size:13px;padding:8px 0;">로딩 중...</p>`;let n=await P({force:e});if(!n)return;let{orders:r,lots:i}=n;document.getElementById(`freezeOpContent`)===t&&L(r,i,{container:t,tabMode:!0})}async function j(e={getDocs:r}){return(await e.getDocs(n(a(o,`freezeOrders`),i(`date`,`desc`)))).docs.map(e=>({...e.data(),id:e.id}))}async function M(e={getDocs:r}){return(await e.getDocs(a(o,`frozenPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed&&Number(e.remaining||0)>0)}function N(e){let t=Object.create(null);return e.forEach(e=>{t[e.productName]=(t[e.productName]||0)+Number(e.remaining||0)}),t}async function P({force:e=!1}={}){return u(()=>{x=Array(y).fill(null),C=null,S=null,w=Object.create(null)}),_.load(e=>Z(e),{force:e,onChange:p(_,e=>T?A(e):k(e))})}function F(){_.active=!1,_.disconnect(),C=null,x=Array(y).fill(null),S=null,w=Object.create(null)}async function I({force:e=!1}={}){let t=E(),n=T,r=c(),i=await P({force:e});!i||!t?.isConnected||r&&!r.isCurrent()||L(i.orders,i.lots,{container:t,tabMode:n})}function L(e,t,n={}){let r=n.container||E();if(!r)return;let i=n.tabMode??T,a=O(),o=N(t),c=a?`<button class="btn-primary" id="btnCreateOrder">+ 발주서 제작</button>`:``,l=`
    <div class="form-section" style="background:white;border-radius:8px;padding:14px 18px;margin-bottom:14px;border:1px solid #e8e8e8;">
      <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">현재 동결판 재고</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${Object.keys(o).length===0?`<span style="color:#aaa;font-size:13px;">재고 없음</span>`:Object.entries(o).map(([e,t])=>`<span style="background:#f0f4ff;border:1px solid #c3d0f5;border-radius:6px;padding:4px 10px;font-size:12px;">${K(e)} <strong>${t}판</strong></span>`).join(``)}
      </div>
    </div>
  `,u=`
    <div class="form-section" style="background:white;border-radius:8px;padding:20px;border:1px solid #e8e8e8;">
      ${i?`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-size:14px;font-weight:600;">발주서 목록</div>
        ${c}
       </div>`:`<div style="font-size:14px;font-weight:600;margin-bottom:14px;">발주서 목록</div>`}
      ${e.length===0?`<p style="color:#aaa;font-size:13px;text-align:center;padding:20px 0;">등록된 발주서 없음</p>`:`<div style="display:flex;flex-direction:column;gap:8px;">${e.map(e=>R(e,a)).join(``)}</div>`}
    </div>
  `;r.innerHTML=i?l+u:`<div class="page-wrap">
        <div class="page-header">
          <h2 class="page-title">동결가동</h2>
          ${c}
        </div>
        ${l}
        ${u}
       </div>`,a&&(r.querySelector(`#btnCreateOrder`)?.addEventListener(`click`,()=>z(o,t)),r.querySelectorAll(`.btn-build-layout`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.id===t.dataset.id);n&&U(n)})}),r.querySelectorAll(`.btn-cancel-order`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=e.find(e=>e.id===t.dataset.id);if(n&&await s({title:`발주서 취소`,message:`${n.date} 발주서를 취소하시겠습니까?\n차감된 동결판 재고가 복구됩니다.`,confirmText:`취소 확정`}))try{if(!await Y(n))return;await I(),alert(`발주서가 취소되었습니다.`)}catch(e){alert(`취소 실패: `+e.message)}})})),r.querySelectorAll(`.btn-view-order`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.id===t.dataset.id);n&&B(n,a)})})}function R(e,t){let n=e.status===`cancelled`,r=!!e.layout,i=(e.items||[]).reduce((e,t)=>e+Number(t.panCount||0),0),a=(e.items||[]).map(e=>`${K(e.productName)} ${K(e.panCount)}판${e.isVirtual?` <span style="color:#e67e22;font-size:10px;">[가상]</span>`:``}`).join(` · `),o=n?`<span style="color:#e53e3e;font-weight:600;font-size:12px;">취소됨</span>`:r?`<span style="color:#2d7a3a;font-weight:600;">✅ 배치완료</span>`:`<span style="color:#e67e22;font-weight:600;">⏳ 배치대기</span>`;return`
    <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;background:#fafafa;opacity:${n?`0.55`:`1`};">
      <div style="min-width:100px;font-size:13px;font-weight:600;">${K(e.date)}</div>
      <div style="flex:1;font-size:12px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a}</div>
      <div style="min-width:55px;text-align:right;font-size:12px;color:#888;">총 ${i}판</div>
      <div style="min-width:75px;text-align:right;font-size:12px;">${o}</div>
      <div style="display:flex;gap:6px;white-space:nowrap;">
        <button class="btn-secondary btn-view-order" data-id="${K(e.id)}" style="font-size:11px;padding:3px 10px;">발주서</button>
        ${!n&&t?`<button class="btn-primary btn-build-layout" data-id="${K(e.id)}" style="font-size:11px;padding:3px 10px;">${r?`배치판`:`배치판 생성`}</button>`:``}
        ${!n&&t?`<button class="btn-secondary btn-cancel-order" data-id="${K(e.id)}" style="font-size:11px;padding:3px 10px;color:#e53e3e;">취소</button>`:``}
      </div>
    </div>
  `}function z(n,r){let i=Object.entries(n).sort((e,t)=>e[0].localeCompare(t[0])).map(([e,t])=>`<option value="${K(e)}">${K(e)} (${t}판)</option>`).join(``);q(`
    <h3 class="modal-title">발주서 제작</h3>
    <div class="form-group">
      <label>동결건조 날짜 *</label>
      <input type="date" id="fo_date" value="${l()}" />
    </div>
    <div style="font-size:13px;font-weight:600;margin:12px 0 8px;">발주 항목</div>
    <div id="fo_items" style="margin-bottom:8px;"></div>
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <button class="btn-secondary" id="fo_addStock" style="font-size:12px;">+ 재고 항목 추가</button>
      <button class="btn-secondary" id="fo_addVirtual" style="font-size:12px;color:#e67e22;">+ 가상 재고 추가</button>
    </div>
    <div style="font-size:13px;font-weight:600;margin-bottom:16px;">
      총합: <span id="fo_total" style="color:#e67e22;">0</span>판
      <span style="font-size:11px;color:#aaa;margin-left:6px;">(기준 45판)</span>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="fo_save">저장</button>
    </div>
  `);function c(){let e=0;document.querySelectorAll(`#fo_items .fo-qty`).forEach(t=>{e+=parseInt(t.value)||0});let t=document.getElementById(`fo_total`);t&&(t.textContent=e,t.style.color=e>45?`#e53e3e`:`#e67e22`)}function u(){let e=document.createElement(`div`);e.className=`fo-row`,e.style.cssText=`display:flex;gap:8px;margin-bottom:8px;align-items:center;`,e.innerHTML=`
      <select class="fo-name cell-input" style="flex:1;">
        <option value="">제품 선택</option>
        ${i}
      </select>
      <input type="number" class="fo-qty cell-input" placeholder="판수" style="width:80px;" min="1" />
      <span class="fo-hint" style="font-size:11px;color:#888;min-width:55px;"></span>
      <button class="fo-del btn-secondary" style="font-size:11px;padding:2px 8px;">✕</button>
    `,document.getElementById(`fo_items`).appendChild(e),e.querySelector(`.fo-name`).addEventListener(`change`,t=>{e.querySelector(`.fo-hint`).textContent=t.target.value?`재고 ${n[t.target.value]||0}판`:``}),e.querySelector(`.fo-qty`).addEventListener(`input`,c),e.querySelector(`.fo-del`).addEventListener(`click`,()=>{e.remove(),c()})}function d(){let e=document.createElement(`div`);e.className=`fo-row fo-virtual`,e.style.cssText=`display:flex;gap:8px;margin-bottom:8px;align-items:center;`,e.innerHTML=`
      <input type="text" class="fo-name cell-input" placeholder="품목명 (가상 재고)" style="flex:1;" />
      <input type="number" class="fo-qty cell-input" placeholder="판수" style="width:80px;" min="1" />
      <span style="font-size:11px;color:#e67e22;min-width:55px;">가상 재고</span>
      <button class="fo-del btn-secondary" style="font-size:11px;padding:2px 8px;">✕</button>
    `,document.getElementById(`fo_items`).appendChild(e),e.querySelector(`.fo-qty`).addEventListener(`input`,c),e.querySelector(`.fo-del`).addEventListener(`click`,()=>{e.remove(),c()})}document.getElementById(`fo_addStock`).addEventListener(`click`,u),document.getElementById(`fo_addVirtual`).addEventListener(`click`,d),u(),document.getElementById(`fo_save`).addEventListener(`click`,async()=>m(_,async i=>{let{writeBatch:c}=h(i),l=document.getElementById(`fo_date`).value;if(!l){alert(`날짜를 입력해주세요.`);return}let u=[],d=!1;if(document.querySelectorAll(`#fo_items .fo-row`).forEach(e=>{let t=e.classList.contains(`fo-virtual`),r=(e.querySelector(`.fo-name`).value||``).trim(),i=parseInt(e.querySelector(`.fo-qty`).value)||0;if(!(!r||i<=0)){if(!t){let e=n[r]||0;i>e&&(alert(`${r}: 재고 ${e}판 / 발주 ${i}판 — 재고 부족`),d=!0)}u.push({productName:r,panCount:i,isVirtual:t})}}),d)return;if(u.length===0){alert(`발주 항목을 추가해주세요.`);return}let f=u.reduce((e,t)=>e+t.panCount,0);if(f>45&&!await s({title:`판수 초과`,message:`총 ${f}판은 45판 기준을 초과합니다. 그래도 저장하시겠습니까?`,confirmText:`저장`}))return;let p;try{p=J(u,r)}catch(e){alert(e.message);return}let m=c(o);p.forEach(n=>{let i=r.find(e=>e.id===n.lotId),a=i&&Number(i.remaining||0)-n.amount<=0;m.update(t(o,`frozenPanLots`,n.lotId),{remaining:e(-n.amount),...a?{closed:!0}:{},updatedAt:new Date})});let g=t(a(o,`freezeOrders`));m.set(g,{date:l,items:u,totalPans:f,deductions:p,status:`active`,layout:null,layoutConfirmedAt:null,layoutConfirmedBy:null,createdAt:new Date,createdBy:D()||``}),await m.commit(),i.isCurrent()&&(closeModal(),i.isCurrent()&&(await I(),alert(`발주서 저장 완료! 동결판 재고가 차감되었습니다.`)))},{roles:[`admin`,`office`]}))}function B(e,t){let n=(e.items||[]).reduce((e,t)=>e+Number(t.panCount||0),0),r=(e.items||[]).map(e=>`
    <tr>
      <td>${K(e.productName)}</td>
      <td>${e.isVirtual?`<span style="color:#e67e22;font-size:11px;">가상 재고</span>`:`실 재고`}</td>
      <td style="text-align:right;font-weight:600;">${K(e.panCount)}판</td>
    </tr>
  `).join(``),i=e.layout?`<div style="font-size:13px;font-weight:600;margin:16px 0 10px;">동결건조기 자리 배치</div>${H(e.layout,e.items)}`:`<p style="color:#aaa;font-size:13px;margin-top:12px;">배치판 미생성</p>`;q(`
    <h3 class="modal-title">발주서 — ${K(e.date)}</h3>
    <table class="data-table" style="margin-bottom:8px;">
      <thead><tr><th>제품</th><th>구분</th><th>판수</th></tr></thead>
      <tbody>
        ${r}
        <tr style="border-top:2px solid #e0e0e0;font-weight:700;">
          <td colspan="2">합계</td>
          <td style="text-align:right;">${n}판</td>
        </tr>
      </tbody>
    </table>
    ${i}
    <div class="modal-actions">
      ${t&&!e.layout?`<button class="btn-primary" id="dv_toBuilder">배치판 생성 →</button>`:``}
      ${e.layout?`<button class="btn-secondary" id="dv_print">🖨 인쇄</button>`:``}
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `,!0),t&&!e.layout&&document.getElementById(`dv_toBuilder`)?.addEventListener(`click`,()=>{closeModal(),U(e)}),e.layout&&document.getElementById(`dv_print`)?.addEventListener(`click`,()=>{let t=V(e.items);X(e,e.layout,t)})}function V(e){let t=Object.create(null);return(e||[]).forEach((e,n)=>{t[e.productName]=v[n%v.length]}),t}function H(e,t){let n=V(t),r=`
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      ${(t||[]).map((t,n)=>{let r=v[n%v.length],i=(e||[]).filter(e=>e===t.productName).length;return`<div style="display:flex;align-items:center;gap:4px;font-size:12px;">
          <div style="width:12px;height:12px;border-radius:3px;background:${r};flex-shrink:0;"></div>
          <span>${K(t.productName)}</span>
          <span style="color:#888;">${i}/${K(t.panCount)}판</span>
        </div>`}).join(``)}
    </div>
  `,i=`<div style="display:grid;grid-template-columns:repeat(3,60px);gap:3px;margin-bottom:12px;">`;for(let t=0;t<y;t++){let r=e?e[t]:null,a=r?n[r]:null,o=Math.floor(t/b)+1,s=t%b+1;i+=`
      <div style="
        width:60px;height:40px;border-radius:4px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
        border:1px solid ${a?`transparent`:`#e0e0e0`};
        background:${a||`#f5f5f5`};
      ">
        <span style="font-size:8px;color:${a?`rgba(255,255,255,0.6)`:`#ccc`};">${String(o).padStart(2,`0`)}-${s}</span>
        ${r?`<span style="font-size:7px;color:white;font-weight:700;text-align:center;line-height:1.1;max-width:56px;overflow:hidden;white-space:nowrap;">${K(r.slice(0,9))}</span>`:``}
      </div>
    `}return i+=`</div>`,r+i}function U(e){x=e.layout?[...e.layout]:Array(y).fill(null),S=null,C=e,w=V(e.items),q(`
    <h3 class="modal-title">배치판 생성 — ${K(e.date)}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:12px;">품목을 클릭해 선택 후, 오른쪽 칸을 눌러 배치합니다. 배치된 칸을 다시 클릭하면 해제됩니다.</p>
    <div style="display:flex;gap:24px;align-items:flex-start;">
      <div style="min-width:170px;">
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:8px;">품목</div>
        <div id="bp_products"></div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:600;color:#555;margin-bottom:6px;">배치판 (15줄 × 3칸)</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;color:#555;margin-bottom:4px;padding:0 2px;">
          <span>← 도어쪽</span>
          <span>기계 내부쪽 →</span>
        </div>
        <div id="bp_grid"></div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-secondary" id="bp_reset">초기화</button>
      <button class="btn-secondary" id="bp_print">🖨 인쇄</button>
      <button class="btn-primary" id="bp_confirm">배치 확정</button>
    </div>
  `,!0,`1060px`),W(),G(),document.getElementById(`bp_print`).addEventListener(`click`,()=>X(e,x,w)),document.getElementById(`bp_reset`).addEventListener(`click`,async()=>{await s({title:`초기화`,message:`배치를 모두 초기화할까요?`,confirmText:`초기화`})&&(x=Array(y).fill(null),S=null,W(),G())}),document.getElementById(`bp_confirm`).addEventListener(`click`,async()=>m(_,async n=>{let{updateDoc:r}=h(n),i=x.filter(Boolean).length;if(i===0){alert(`배치된 항목이 없습니다.`);return}await s({title:`배치 확정`,message:`${i}/45칸 배치 상태로 확정하시겠습니까?`,confirmText:`확정`})&&(await r(t(o,`freezeOrders`,e.id),{layout:x,layoutConfirmedAt:new Date,layoutConfirmedBy:D()||``,updatedAt:new Date}),n.isCurrent()&&(closeModal(),n.isCurrent()&&(await I(),alert(`배치 확정 완료!`))))},{roles:[`admin`,`office`]}))}function W(){let e=document.getElementById(`bp_products`);e&&(e.innerHTML=(C.items||[]).map(e=>{let t=w[e.productName]||`#ccc`,n=x.filter(t=>t===e.productName).length,r=e.panCount-n,i=S===e.productName;return`
      <div class="bp-product" data-name="${K(e.productName)}" style="
        border:2px solid ${i?t:`#e0e0e0`};
        border-radius:8px;padding:8px 10px;margin-bottom:8px;cursor:pointer;
        background:${i?t+`18`:`white`};
      ">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <div style="width:10px;height:10px;border-radius:2px;background:${t};flex-shrink:0;"></div>
          <span style="font-size:12px;font-weight:600;">${K(e.productName)}</span>
        </div>
        <div style="font-size:11px;color:#888;">${n}/${K(e.panCount)}판</div>
        ${r>0?`<div style="font-size:10px;color:${t};font-weight:600;">${r}판 남음</div>`:`<div style="font-size:10px;color:#2d7a3a;font-weight:600;">✓ 완료</div>`}
      </div>
    `}).join(``),e.querySelectorAll(`.bp-product`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.name;S=S===t?null:t,W(),G()})}))}function G(){let e=document.getElementById(`bp_grid`);if(!e)return;let t=C.items?.find(e=>e.productName===S),n=S?x.filter(e=>e===S).length:0,r=t?n<t.panCount:!1,i=S?w[S]:null,a=`<div style="display:grid;grid-template-columns:repeat(3,66px);gap:3px;">`;for(let e=0;e<y;e++){let t=Math.floor(e/b)+1,n=e%b+1,o=x[e],s=o?w[o]:null,c=o===S&&S!==null,l=s||`#f0f0f0`,u=s?`1px solid transparent`:`1px solid #ddd`,d=`default`,f=`1`;S&&(c?(u=`2px solid ${i}`,d=`pointer`):!o&&r?(l=i+`18`,u=`1px dashed ${i}`,d=`pointer`):o&&!c&&(f=`0.4`)),a+=`
      <div class="bp-slot" data-idx="${e}" style="
        width:66px;height:44px;border-radius:4px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
        border:${u};background:${l};opacity:${f};
        cursor:${d};user-select:none;
      ">
        <span style="font-size:8px;color:${s?`rgba(255,255,255,0.6)`:`#bbb`};">${String(t).padStart(2,`0`)}-${n}</span>
        ${o?`<span style="font-size:7px;color:white;font-weight:700;text-align:center;line-height:1.1;max-width:62px;overflow:hidden;white-space:nowrap;">${K(o.slice(0,9))}</span>`:``}
      </div>
    `}a+=`</div>`,e.innerHTML=a,e.querySelectorAll(`.bp-slot`).forEach(e=>{e.addEventListener(`click`,()=>{if(!S)return;let t=parseInt(e.dataset.idx);if(x[t]===S)x[t]=null;else if(!x[t]&&r)x[t]=S;else return;W(),G()})})}function K(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function q(e,t=!1,n=null){let r=document.getElementById(`modalOverlay`);r&&r.remove();let i=n||(t?`780px`:``),a=document.createElement(`div`);a.id=`modalOverlay`,a.className=`modal-overlay`,a.innerHTML=`<div class="modal-box" style="${i?`max-width:${i};`:``}max-height:92vh;overflow-y:auto;">${e}</div>`,document.body.appendChild(a)}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};function J(e,t){let n=[],r=Object.create(null);t.forEach(e=>{r[e.productName]||(r[e.productName]=[]),r[e.productName].push({lotId:e.id,remaining:e.remaining})}),t.forEach(e=>{r[e.productName]&&r[e.productName].sort((e,n)=>{let r=t.find(t=>t.id===e.lotId),i=t.find(e=>e.id===n.lotId);return(r?.date||``).localeCompare(i?.date||``)})});for(let t of e){if(t.isVirtual)continue;let e=t.panCount,i=r[t.productName]||[];for(let r of i){if(e<=0)break;let i=Math.min(e,r.remaining);i<=0||(n.push({lotId:r.lotId,productName:t.productName,amount:i}),r.remaining-=i,e-=i)}if(e>0)throw Error(`${t.productName}: 재고 부족 (${e}판 모자람)`)}return n}async function Y(e){return m(_,async t=>{let{runTransaction:n}=h(t);return await n(o,t=>g(t,o,e.id,D()||``)),!0},{roles:[`admin`,`office`]})}function X(e,t,n){let r=e.items||[],i=(t||[]).filter(Boolean).length,a=Array.from({length:y},(e,r)=>{let i=Math.floor(r/b)+1,a=r%b+1,o=t?t[r]:null,s=o?n[o]||`#ccc`:null;return`<div class="cell" style="border-color:${s||`#ccc`};background:${s||`#f9f9f9`};">
      <span class="cell-num" style="color:${s?`rgba(255,255,255,0.6)`:`#bbb`};">${String(i).padStart(2,`0`)}-${a}</span>
      ${o?`<span class="cell-name">${K(o)}</span>`:``}
    </div>`}).join(``),o=r.map((e,r)=>{let i=n[e.productName]||v[r%v.length],a=(t||[]).filter(t=>t===e.productName).length;return`<div class="legend-item">
      <div class="legend-dot" style="background:${i};"></div>
      <span>${K(e.productName)}</span>
      <span class="legend-count">${a}/${K(e.panCount)}판${e.isVirtual?` [가상]`:``}</span>
    </div>`}).join(``),s=`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>배치판 ${K(e.date)}</title>
<style>
  @page { size: A4 portrait; margin: 9mm 10mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 190mm; height: 277mm; overflow: hidden; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; }
  .header { margin-bottom: 3mm; }
  .header h2 { font-size: 11.5pt; font-weight: 700; }
  .header p  { font-size: 7.5pt; color: #555; margin-top: 0.8mm; }
  .direction { display:flex; justify-content:space-between; font-size:8pt; font-weight:700; color:#333; margin-bottom:1.5mm; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1mm; width:100%; }
  .cell {
    height: 13.5mm;
    border-radius: 1.5mm;
    border: 0.3mm solid;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5mm;
  }
  .cell-num  { font-size: 6.5pt; }
  .cell-name { font-size: 6pt; color: white; font-weight: 700; text-align: center; line-height: 1.2; padding: 0 1mm; word-break: keep-all; max-width: 100%; overflow: hidden; }
  .legend { margin-top: 3.5mm; display:flex; flex-wrap:wrap; gap:2mm 5mm; }
  .legend-item { display:flex; align-items:center; gap:1.5mm; font-size:7.5pt; }
  .legend-dot { width:5.5mm; height:3.5mm; border-radius:0.8mm; flex-shrink:0; }
  .legend-count { color:#666; }
</style>
</head><body>
<div class="header">
  <h2>동결건조기 배치판 — ${K(e.date)}</h2>
  <p>총 ${i}/45칸 배치</p>
</div>
<div class="direction"><span>← 도어쪽</span><span>기계 내부쪽 →</span></div>
<div class="grid">${a}</div>
<div class="legend">${o}</div>
</body></html>`,c=window.open(``,`_blank`,`width=820,height=1000`);if(!c){alert(`팝업이 차단되었습니다. 팝업을 허용해주세요.`);return}c.document.write(s),c.document.close(),c.focus(),c.print()}async function Z(e){let[t,n]=await Promise.all([j(e),M(e)]);return{orders:t,lots:n}}function Q({cacheOnly:e=!0}={}){return _.prepare?.(`default`,Z,{cacheOnly:e})}export{F as disposeFreezeOpTab,Q as preparePage,k as renderFreezeOp,A as renderFreezeOpInTab};