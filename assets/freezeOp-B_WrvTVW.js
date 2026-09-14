import{S as e,_ as t,d as n,h as r,o as i,u as a,v as o,y as s}from"./index.esm-ESivpAya.js";import{n as c}from"./firebase-I0rBIq9V.js";import{B as l,M as u,g as d}from"./index-BMnUILA5.js";var f=[`#4299E1`,`#48BB78`,`#ED8936`,`#9F7AEA`,`#F56565`,`#38B2AC`,`#ECC94B`,`#667EEA`,`#FC8181`,`#68D391`,`#63B3ED`,`#F6AD55`,`#B794F4`,`#FBD38D`,`#90CDF4`],p=45,m=3,h=Array(p).fill(null),g=null,_=null,v={},y=!1;function b(){return y?document.getElementById(`freezeOpContent`):document.getElementById(`mainContent`)}function x(){return l}function S(){let e=x();return e===`admin`||e===`office`}async function C(){y=!1;let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결가동 로딩 중...</p></div>`;let[t,n]=await Promise.all([T(),E()]);document.getElementById(`mainContent`)===e&&k(t,n,{container:e,tabMode:!1})}async function w(){y=!0;let e=document.getElementById(`freezeOpContent`);if(!e)return;e.innerHTML=`<p style="color:#888;font-size:13px;padding:8px 0;">로딩 중...</p>`;let[t,n]=await Promise.all([T(),E()]);document.getElementById(`freezeOpContent`)===e&&k(t,n,{container:e,tabMode:!0})}async function T(){return(await i(n(o(c,`freezeOrders`),a(`date`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}async function E(){return(await i(o(c,`frozenPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed&&Number(e.remaining||0)>0)}function D(e){let t={};return e.forEach(e=>{t[e.productName]=(t[e.productName]||0)+Number(e.remaining||0)}),t}async function O(){let[e,t]=await Promise.all([T(),E()]);k(e,t,{container:b(),tabMode:y})}function k(e,t,n={}){let r=n.container||b();if(!r)return;let i=n.tabMode??y,a=S(),o=D(t),s=a?`<button class="btn-primary" id="btnCreateOrder">+ 발주서 제작</button>`:``,c=`
    <div class="form-section" style="background:white;border-radius:8px;padding:14px 18px;margin-bottom:14px;border:1px solid #e8e8e8;">
      <div style="font-size:13px;font-weight:600;color:#555;margin-bottom:8px;">현재 동결판 재고</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${Object.keys(o).length===0?`<span style="color:#aaa;font-size:13px;">재고 없음</span>`:Object.entries(o).map(([e,t])=>`<span style="background:#f0f4ff;border:1px solid #c3d0f5;border-radius:6px;padding:4px 10px;font-size:12px;">${R(e)} <strong>${t}판</strong></span>`).join(``)}
      </div>
    </div>
  `,l=`
    <div class="form-section" style="background:white;border-radius:8px;padding:20px;border:1px solid #e8e8e8;">
      ${i?`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-size:14px;font-weight:600;">발주서 목록</div>
        ${s}
       </div>`:`<div style="font-size:14px;font-weight:600;margin-bottom:14px;">발주서 목록</div>`}
      ${e.length===0?`<p style="color:#aaa;font-size:13px;text-align:center;padding:20px 0;">등록된 발주서 없음</p>`:`<div style="display:flex;flex-direction:column;gap:8px;">${e.map(e=>A(e,a)).join(``)}</div>`}
    </div>
  `;r.innerHTML=i?c+l:`<div class="page-wrap">
        <div class="page-header">
          <h2 class="page-title">동결가동</h2>
          ${s}
        </div>
        ${c}
        ${l}
       </div>`,a&&(r.querySelector(`#btnCreateOrder`)?.addEventListener(`click`,()=>j(o,t)),r.querySelectorAll(`.btn-build-layout`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.id===t.dataset.id);n&&F(n)})}),r.querySelectorAll(`.btn-cancel-order`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=e.find(e=>e.id===t.dataset.id);if(n&&await d({title:`발주서 취소`,message:`${n.date} 발주서를 취소하시겠습니까?\n차감된 동결판 재고가 복구됩니다.`,confirmText:`취소 확정`}))try{await V(n),await O(),alert(`발주서가 취소되었습니다.`)}catch(e){alert(`취소 실패: `+e.message)}})})),r.querySelectorAll(`.btn-view-order`).forEach(t=>{t.addEventListener(`click`,()=>{let n=e.find(e=>e.id===t.dataset.id);n&&M(n,a)})})}function A(e,t){let n=e.status===`cancelled`,r=!!e.layout,i=(e.items||[]).reduce((e,t)=>e+Number(t.panCount||0),0),a=(e.items||[]).map(e=>`${R(e.productName)} ${e.panCount}판${e.isVirtual?` <span style="color:#e67e22;font-size:10px;">[가상]</span>`:``}`).join(` · `),o=n?`<span style="color:#e53e3e;font-weight:600;font-size:12px;">취소됨</span>`:r?`<span style="color:#2d7a3a;font-weight:600;">✅ 배치완료</span>`:`<span style="color:#e67e22;font-weight:600;">⏳ 배치대기</span>`;return`
    <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;background:#fafafa;opacity:${n?`0.55`:`1`};">
      <div style="min-width:100px;font-size:13px;font-weight:600;">${R(e.date)}</div>
      <div style="flex:1;font-size:12px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a}</div>
      <div style="min-width:55px;text-align:right;font-size:12px;color:#888;">총 ${i}판</div>
      <div style="min-width:75px;text-align:right;font-size:12px;">${o}</div>
      <div style="display:flex;gap:6px;white-space:nowrap;">
        <button class="btn-secondary btn-view-order" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">발주서</button>
        ${!n&&t?`<button class="btn-primary btn-build-layout" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">${r?`배치판`:`배치판 생성`}</button>`:``}
        ${!n&&t?`<button class="btn-secondary btn-cancel-order" data-id="${e.id}" style="font-size:11px;padding:3px 10px;color:#e53e3e;">취소</button>`:``}
      </div>
    </div>
  `}function j(n,r){let i=Object.entries(n).sort((e,t)=>e[0].localeCompare(t[0])).map(([e,t])=>`<option value="${R(e)}">${R(e)} (${t}판)</option>`).join(``);z(`
    <h3 class="modal-title">발주서 제작</h3>
    <div class="form-group">
      <label>동결건조 날짜 *</label>
      <input type="date" id="fo_date" value="${u()}" />
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
  `);function a(){let e=0;document.querySelectorAll(`#fo_items .fo-qty`).forEach(t=>{e+=parseInt(t.value)||0});let t=document.getElementById(`fo_total`);t&&(t.textContent=e,t.style.color=e>45?`#e53e3e`:`#e67e22`)}function l(){let e=document.createElement(`div`);e.className=`fo-row`,e.style.cssText=`display:flex;gap:8px;margin-bottom:8px;align-items:center;`,e.innerHTML=`
      <select class="fo-name cell-input" style="flex:1;">
        <option value="">제품 선택</option>
        ${i}
      </select>
      <input type="number" class="fo-qty cell-input" placeholder="판수" style="width:80px;" min="1" />
      <span class="fo-hint" style="font-size:11px;color:#888;min-width:55px;"></span>
      <button class="fo-del btn-secondary" style="font-size:11px;padding:2px 8px;">✕</button>
    `,document.getElementById(`fo_items`).appendChild(e),e.querySelector(`.fo-name`).addEventListener(`change`,t=>{e.querySelector(`.fo-hint`).textContent=t.target.value?`재고 ${n[t.target.value]||0}판`:``}),e.querySelector(`.fo-qty`).addEventListener(`input`,a),e.querySelector(`.fo-del`).addEventListener(`click`,()=>{e.remove(),a()})}function f(){let e=document.createElement(`div`);e.className=`fo-row fo-virtual`,e.style.cssText=`display:flex;gap:8px;margin-bottom:8px;align-items:center;`,e.innerHTML=`
      <input type="text" class="fo-name cell-input" placeholder="품목명 (가상 재고)" style="flex:1;" />
      <input type="number" class="fo-qty cell-input" placeholder="판수" style="width:80px;" min="1" />
      <span style="font-size:11px;color:#e67e22;min-width:55px;">가상 재고</span>
      <button class="fo-del btn-secondary" style="font-size:11px;padding:2px 8px;">✕</button>
    `,document.getElementById(`fo_items`).appendChild(e),e.querySelector(`.fo-qty`).addEventListener(`input`,a),e.querySelector(`.fo-del`).addEventListener(`click`,()=>{e.remove(),a()})}document.getElementById(`fo_addStock`).addEventListener(`click`,l),document.getElementById(`fo_addVirtual`).addEventListener(`click`,f),l(),document.getElementById(`fo_save`).addEventListener(`click`,async()=>{let i=document.getElementById(`fo_date`).value;if(!i){alert(`날짜를 입력해주세요.`);return}let a=[],l=!1;if(document.querySelectorAll(`#fo_items .fo-row`).forEach(e=>{let t=e.classList.contains(`fo-virtual`),r=(e.querySelector(`.fo-name`).value||``).trim(),i=parseInt(e.querySelector(`.fo-qty`).value)||0;if(!(!r||i<=0)){if(!t){let e=n[r]||0;i>e&&(alert(`${r}: 재고 ${e}판 / 발주 ${i}판 — 재고 부족`),l=!0)}a.push({productName:r,panCount:i,isVirtual:t})}}),l)return;if(a.length===0){alert(`발주 항목을 추가해주세요.`);return}let u=a.reduce((e,t)=>e+t.panCount,0);if(u>45&&!await d({title:`판수 초과`,message:`총 ${u}판은 45판 기준을 초과합니다. 그래도 저장하시겠습니까?`,confirmText:`저장`}))return;let f;try{f=B(a,r)}catch(e){alert(e.message);return}let p=t(c);f.forEach(t=>{let n=r.find(e=>e.id===t.lotId),i=n&&Number(n.remaining||0)-t.amount<=0;p.update(s(c,`frozenPanLots`,t.lotId),{remaining:e(-t.amount),...i?{closed:!0}:{},updatedAt:new Date})});let m=s(o(c,`freezeOrders`));p.set(m,{date:i,items:a,totalPans:u,deductions:f,status:`active`,layout:null,layoutConfirmedAt:null,layoutConfirmedBy:null,createdAt:new Date,createdBy:x()||``}),await p.commit(),closeModal(),await O(),alert(`발주서 저장 완료! 동결판 재고가 차감되었습니다.`)})}function M(e,t){let n=(e.items||[]).reduce((e,t)=>e+Number(t.panCount||0),0),r=(e.items||[]).map(e=>`
    <tr>
      <td>${R(e.productName)}</td>
      <td>${e.isVirtual?`<span style="color:#e67e22;font-size:11px;">가상 재고</span>`:`실 재고`}</td>
      <td style="text-align:right;font-weight:600;">${e.panCount}판</td>
    </tr>
  `).join(``),i=e.layout?`<div style="font-size:13px;font-weight:600;margin:16px 0 10px;">동결건조기 자리 배치</div>${P(e.layout,e.items)}`:`<p style="color:#aaa;font-size:13px;margin-top:12px;">배치판 미생성</p>`;z(`
    <h3 class="modal-title">발주서 — ${R(e.date)}</h3>
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
  `,!0),t&&!e.layout&&document.getElementById(`dv_toBuilder`)?.addEventListener(`click`,()=>{closeModal(),F(e)}),e.layout&&document.getElementById(`dv_print`)?.addEventListener(`click`,()=>{let t=N(e.items);H(e,e.layout,t)})}function N(e){let t={};return(e||[]).forEach((e,n)=>{t[e.productName]=f[n%f.length]}),t}function P(e,t){let n=N(t),r=`
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      ${(t||[]).map((t,n)=>{let r=f[n%f.length],i=(e||[]).filter(e=>e===t.productName).length;return`<div style="display:flex;align-items:center;gap:4px;font-size:12px;">
          <div style="width:12px;height:12px;border-radius:3px;background:${r};flex-shrink:0;"></div>
          <span>${R(t.productName)}</span>
          <span style="color:#888;">${i}/${t.panCount}판</span>
        </div>`}).join(``)}
    </div>
  `,i=`<div style="display:grid;grid-template-columns:repeat(3,60px);gap:3px;margin-bottom:12px;">`;for(let t=0;t<p;t++){let r=e?e[t]:null,a=r?n[r]:null,o=Math.floor(t/m)+1,s=t%m+1;i+=`
      <div style="
        width:60px;height:40px;border-radius:4px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
        border:1px solid ${a?`transparent`:`#e0e0e0`};
        background:${a||`#f5f5f5`};
      ">
        <span style="font-size:8px;color:${a?`rgba(255,255,255,0.6)`:`#ccc`};">${String(o).padStart(2,`0`)}-${s}</span>
        ${r?`<span style="font-size:7px;color:white;font-weight:700;text-align:center;line-height:1.1;max-width:56px;overflow:hidden;white-space:nowrap;">${R(r.slice(0,9))}</span>`:``}
      </div>
    `}return i+=`</div>`,r+i}function F(e){h=e.layout?[...e.layout]:Array(p).fill(null),g=null,_=e,v=N(e.items),z(`
    <h3 class="modal-title">배치판 생성 — ${R(e.date)}</h3>
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
  `,!0,`1060px`),I(),L(),document.getElementById(`bp_print`).addEventListener(`click`,()=>H(e,h,v)),document.getElementById(`bp_reset`).addEventListener(`click`,async()=>{await d({title:`초기화`,message:`배치를 모두 초기화할까요?`,confirmText:`초기화`})&&(h=Array(p).fill(null),g=null,I(),L())}),document.getElementById(`bp_confirm`).addEventListener(`click`,async()=>{let t=h.filter(Boolean).length;if(t===0){alert(`배치된 항목이 없습니다.`);return}await d({title:`배치 확정`,message:`${t}/45칸 배치 상태로 확정하시겠습니까?`,confirmText:`확정`})&&(await r(s(c,`freezeOrders`,e.id),{layout:h,layoutConfirmedAt:new Date,layoutConfirmedBy:x()||``,updatedAt:new Date}),closeModal(),await O(),alert(`배치 확정 완료!`))})}function I(){let e=document.getElementById(`bp_products`);e&&(e.innerHTML=(_.items||[]).map(e=>{let t=v[e.productName]||`#ccc`,n=h.filter(t=>t===e.productName).length,r=e.panCount-n,i=g===e.productName;return`
      <div class="bp-product" data-name="${R(e.productName)}" style="
        border:2px solid ${i?t:`#e0e0e0`};
        border-radius:8px;padding:8px 10px;margin-bottom:8px;cursor:pointer;
        background:${i?t+`18`:`white`};
      ">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <div style="width:10px;height:10px;border-radius:2px;background:${t};flex-shrink:0;"></div>
          <span style="font-size:12px;font-weight:600;">${R(e.productName)}</span>
        </div>
        <div style="font-size:11px;color:#888;">${n}/${e.panCount}판</div>
        ${r>0?`<div style="font-size:10px;color:${t};font-weight:600;">${r}판 남음</div>`:`<div style="font-size:10px;color:#2d7a3a;font-weight:600;">✓ 완료</div>`}
      </div>
    `}).join(``),e.querySelectorAll(`.bp-product`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.name;g=g===t?null:t,I(),L()})}))}function L(){let e=document.getElementById(`bp_grid`);if(!e)return;let t=_.items?.find(e=>e.productName===g),n=g?h.filter(e=>e===g).length:0,r=t?n<t.panCount:!1,i=g?v[g]:null,a=`<div style="display:grid;grid-template-columns:repeat(3,66px);gap:3px;">`;for(let e=0;e<p;e++){let t=Math.floor(e/m)+1,n=e%m+1,o=h[e],s=o?v[o]:null,c=o===g&&g!==null,l=s||`#f0f0f0`,u=s?`1px solid transparent`:`1px solid #ddd`,d=`default`,f=`1`;g&&(c?(u=`2px solid ${i}`,d=`pointer`):!o&&r?(l=i+`18`,u=`1px dashed ${i}`,d=`pointer`):o&&!c&&(f=`0.4`)),a+=`
      <div class="bp-slot" data-idx="${e}" style="
        width:66px;height:44px;border-radius:4px;
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
        border:${u};background:${l};opacity:${f};
        cursor:${d};user-select:none;
      ">
        <span style="font-size:8px;color:${s?`rgba(255,255,255,0.6)`:`#bbb`};">${String(t).padStart(2,`0`)}-${n}</span>
        ${o?`<span style="font-size:7px;color:white;font-weight:700;text-align:center;line-height:1.1;max-width:62px;overflow:hidden;white-space:nowrap;">${R(o.slice(0,9))}</span>`:``}
      </div>
    `}a+=`</div>`,e.innerHTML=a,e.querySelectorAll(`.bp-slot`).forEach(e=>{e.addEventListener(`click`,()=>{if(!g)return;let t=parseInt(e.dataset.idx);if(h[t]===g)h[t]=null;else if(!h[t]&&r)h[t]=g;else return;I(),L()})})}function R(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function z(e,t=!1,n=null){let r=document.getElementById(`modalOverlay`);r&&r.remove();let i=n||(t?`780px`:``),a=document.createElement(`div`);a.id=`modalOverlay`,a.className=`modal-overlay`,a.innerHTML=`<div class="modal-box" style="${i?`max-width:${i};`:``}max-height:92vh;overflow-y:auto;">${e}</div>`,document.body.appendChild(a)}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};function B(e,t){let n=[],r={};t.forEach(e=>{r[e.productName]||(r[e.productName]=[]),r[e.productName].push({lotId:e.id,remaining:e.remaining})}),t.forEach(e=>{r[e.productName]&&r[e.productName].sort((e,n)=>{let r=t.find(t=>t.id===e.lotId),i=t.find(e=>e.id===n.lotId);return(r?.date||``).localeCompare(i?.date||``)})});for(let t of e){if(t.isVirtual)continue;let e=t.panCount,i=r[t.productName]||[];for(let r of i){if(e<=0)break;let i=Math.min(e,r.remaining);i<=0||(n.push({lotId:r.lotId,productName:t.productName,amount:i}),r.remaining-=i,e-=i)}if(e>0)throw Error(`${t.productName}: 재고 부족 (${e}판 모자람)`)}return n}async function V(n){let r=t(c);(n.deductions||[]).forEach(t=>{r.update(s(c,`frozenPanLots`,t.lotId),{remaining:e(t.amount),closed:!1,updatedAt:new Date})}),r.update(s(c,`freezeOrders`,n.id),{status:`cancelled`,cancelledAt:new Date,cancelledBy:x()||``}),await r.commit()}function H(e,t,n){let r=e.items||[],i=(t||[]).filter(Boolean).length,a=Array.from({length:p},(e,r)=>{let i=Math.floor(r/m)+1,a=r%m+1,o=t?t[r]:null,s=o?n[o]||`#ccc`:null;return`<div class="cell" style="border-color:${s||`#ccc`};background:${s||`#f9f9f9`};">
      <span class="cell-num" style="color:${s?`rgba(255,255,255,0.6)`:`#bbb`};">${String(i).padStart(2,`0`)}-${a}</span>
      ${o?`<span class="cell-name">${R(o)}</span>`:``}
    </div>`}).join(``),o=r.map((e,r)=>{let i=n[e.productName]||f[r%f.length],a=(t||[]).filter(t=>t===e.productName).length;return`<div class="legend-item">
      <div class="legend-dot" style="background:${i};"></div>
      <span>${R(e.productName)}</span>
      <span class="legend-count">${a}/${e.panCount}판${e.isVirtual?` [가상]`:``}</span>
    </div>`}).join(``),s=`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>배치판 ${R(e.date)}</title>
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
  <h2>동결건조기 배치판 — ${R(e.date)}</h2>
  <p>총 ${i}/45칸 배치</p>
</div>
<div class="direction"><span>← 도어쪽</span><span>기계 내부쪽 →</span></div>
<div class="grid">${a}</div>
<div class="legend">${o}</div>
</body></html>`,c=window.open(``,`_blank`,`width=820,height=1000`);if(!c){alert(`팝업이 차단되었습니다. 팝업을 허용해주세요.`);return}c.document.write(s),c.document.close(),c.focus(),c.print()}export{C as renderFreezeOp,w as renderFreezeOpInTab};