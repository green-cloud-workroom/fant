import{a as e,b as t,c as n,d as r,s as i,u as a,y as o}from"./index.esm-rHmxwfvm.js";import{n as s}from"./firebase-qGjqjNvO.js";import{a as c}from"./formDraft-DoA-Ia7D.js";import{S as l,m as u,z as d}from"./index-C0F4R5BE.js";import{n as f}from"./activityLogs-CBnFtTM9.js";import{t as p}from"./closingGuard-BktCEkKr.js";import{t as m}from"./readCommand-DWCWH4qi.js";import{t as h}from"./pageRefresh-MG18mYlu.js";var g=u(`egg`);async function _(e,n,r=null,i=null,a=null){return m(g,async c=>{if(a&&await p(a,c))return!1;let l=t(s,`eggStock`,`global`),u=r?t(o(s,`eggLogs`)):null;return await c.transaction(s,async t=>{let a=await t.get(l),o=a.exists()?a.data():{currentQty:0,minimumQty:0};if(Number(o.currentQty||0)!==Number(e.currentQty||0)||Number(o.minimumQty||0)!==Number(e.minimumQty||0))throw Error(`다른 작업으로 계란 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);t.set(l,n),r&&t.set(u,r),i&&await f(i,{batch:t})},{targets:[l,...u?[u]:[]]}),!0},{roles:[`admin`,`office`,`production`]})}async function v(e){try{return await e()}catch(e){console.error(`[계란 저장]`,e),alert(e.message)}}var y=!1,b=null;async function x({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;let n=await g.load(e=>R(e),{force:e,onChange:h(g,x)});!n||!t.isConnected||(b=null,y&&(b=await C({getDocs:i},null)),l()?.isCurrent()&&(F=n.staff,w(n.stock,n.logs)))}async function S(n={getDoc:e}){let r=await n.getDoc(t(s,`eggStock`,`global`));return r.exists()?r.data():{currentQty:0,minimumQty:0}}async function C(e={getDocs:i},t=50){let c=[a(`timestamp`,`desc`)];return t!==null&&c.push(n(t)),(await e.getDocs(r(o(s,`eggLogs`),...c))).docs.map(e=>({id:e.id,...e.data()}))}function w(e,t){let n=document.getElementById(`mainContent`),r=Number(e.currentQty||0),a=Number(e.minimumQty||0),o=r<a,s=y?T(b,r):null,c=O(t).slice(0,50);n.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">계란</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" id="btnSetMinEgg">최소재고 설정</button>
          <button class="btn-secondary" id="btnAdjustEgg">수동조정</button>
          <button class="btn-secondary" id="btnEggOut">계란 출고</button>
          <button class="btn-primary" id="btnEggIn">+ 계란 입고</button>
        </div>
      </div>

      <!-- 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <button class="egg-fifo-toggle" id="btnToggleEggFifo" type="button" aria-expanded="${y?`true`:`false`}">
              <span class="stat-label">현재 재고</span>
              <span class="stat-value" style="font-size:24px;color:${o?`#e53e3e`:`#1a1a1a`}">${r}개</span>
              <span class="egg-fifo-caret">${y?`접기 ▲`:`잔량 보기 ▼`}</span>
            </button>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value">${a}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">상태</span>
            <span class="stat-value" style="color:${o?`#e53e3e`:`#2d7a3a`}">${o?`⚠️ 부족`:`✅ 정상`}</span>
          </div>
        </div>
        ${y?E(s,r):``}
      </div>

      <!-- 이력 테이블 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:20px;border:1px solid #e8e8e8;">
        <div class="section-header">
          <span class="section-title">입출고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>수량(개)</th>
                <th>변경 전</th>
                <th>변경 후</th>
                <th>담당자</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              ${c.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:c.map(e=>`
                  <tr>
                    <td>${e.date||`-`}</td>
                    <td>
                      <span class="tag ${e.type===`in`?`tag-raw`:e.type===`out`?`tag-cat`:``}"
                            style="${e.type===`adjust`?`background:#fff0e8;color:#8a4a2d`:``}">
                        ${e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`}
                      </span>
                    </td>
                    <td style="color:${e.qty>0?`#2d7a3a`:`#e53e3e`};font-weight:600">
                      ${e.qty>0?`+`:``}${e.qty}
                    </td>
                    <td>${e.before??`-`}</td>
                    <td>${e.after??`-`}</td>
                    <td>${e.staffName||`-`}</td>
                    <td>${e.note||e.reason||`-`}</td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,document.getElementById(`btnEggIn`).addEventListener(`click`,()=>M(`in`,e)),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>M(`out`,e)),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>N(e)),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>P(e)),document.getElementById(`btnToggleEggFifo`).addEventListener(`click`,async n=>{if(y)y=!1;else{let e=n.currentTarget;if(e.disabled)return;e.disabled=!0;let t=l();try{if(b=await C({getDocs:i},null),!t?.isCurrent())return;y=!0}catch(t){e.disabled=!1,console.error(`[계란 FIFO 이력]`,t),alert(`잔량 이력을 불러오지 못했습니다. 다시 시도해주세요.`);return}}w(e,t)})}function T(e,t){let n=[],r=0;for(let t of D(e)){let e=Number(t.qty||0);if(e){if(t.type===`in`||t.type===`adjust`&&e>0){n.push({id:t.id||`${t.date||``}-${n.length}`,date:t.date||`-`,staffName:t.staffName||`-`,source:t.type===`adjust`?`조정`:`입고`,initialQty:e,remainingQty:e,order:n.length});continue}if(t.type===`out`||e<0){let t=Math.abs(e);for(let e of n){if(t<=0)break;if(e.remainingQty<=0)continue;let n=Math.min(e.remainingQty,t);e.remainingQty-=n,t-=n}r+=t}}}let i=n.filter(e=>e.remainingQty>0),a=i.reduce((e,t)=>e+t.remainingQty,0);return{lots:i,fifoTotalQty:a,currentQty:t,diffQty:a-t,unallocatedOutQty:r}}function E(e,t){let n=e.diffQty===0,r=e.lots.length===0?`<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>`:e.lots.map((t,n)=>`
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${n===e.lots.length-1?`└`:`├`}</span>
          <span class="egg-fifo-date">${j(t.date)}</span>
          <span class="egg-fifo-staff">${j(t.staffName)}</span>
          <span class="egg-fifo-source">${t.source}</span>
          <span class="egg-fifo-qty">+${A(t.initialQty)} → ${A(t.remainingQty)} 남음</span>
        </div>
      `).join(``),i=n?``:`<div class="egg-fifo-warning">FIFO 분해 합계 ${A(e.fifoTotalQty)} / 현재 재고 ${A(t)}로 ${A(Math.abs(e.diffQty))} 차이가 있습니다.</div>`,a=e.unallocatedOutQty>0?`<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${A(e.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`:``;return`
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${r}
      <div class="egg-fifo-total">분해 합계 ${A(e.fifoTotalQty)} / 현재 재고 ${A(t)}</div>
      ${i}
      ${a}
    </div>
  `}function D(e){return[...e].sort((e,t)=>{let n=k(e)-k(t);return n===0?String(e.id||``).localeCompare(String(t.id||``)):n})}function O(e){return[...e].sort((e,t)=>{let n=k(t)-k(e);return n===0?String(t.id||``).localeCompare(String(e.id||``)):n})}function k(e){let t=e.timestamp;if(t?.toMillis)return t.toMillis();if(t instanceof Date)return t.getTime();if(typeof t==`number`)return t;let n=Date.parse(e.date||``);return Number.isFinite(n)?n:0}function A(e){return`${Number(e||0).toLocaleString()}개`}function j(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function M(e,t){let n=e===`in`,r=Number(t.currentQty||0),i=n?`
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
  `:`
    <div class="form-group">
      <label>남은 재고(개) *</label>
      <input type="number" id="m_remaining" placeholder="실사 후 남은 개수" min="0" max="${r}" />
      <div id="m_outPreview" style="font-size:12px;color:#888;margin-top:4px;">출고량: -</div>
    </div>
  `;L(`
    <h3 class="modal-title">계란 ${n?`입고`:`출고`}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${r}개</p>
    ${i}
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${d()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${I([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEgg">${n?`입고`:`출고`}</button>
    </div>
  `),n||document.getElementById(`m_remaining`).addEventListener(`input`,e=>{let t=parseInt(e.target.value),n=document.getElementById(`m_outPreview`);if(isNaN(t)||t<0)n.textContent=`출고량: -`,n.style.color=`#888`;else{let e=r-t;e<0?(n.textContent=`남은 재고가 현재(${r}개)보다 많습니다`,n.style.color=`#e53e3e`):e===0?(n.textContent=`출고량: 0개 (변동 없음)`,n.style.color=`#888`):(n.textContent=`출고량: ${e}개`,n.style.color=`#2d7a3a`)}}),document.getElementById(`btnSaveEgg`).addEventListener(`click`,()=>v(async()=>{let e=l(),i;if(n){if(i=parseInt(document.getElementById(`m_qty`).value),!i){alert(`수량을 입력해주세요.`);return}}else{let e=parseInt(document.getElementById(`m_remaining`).value);if(isNaN(e)||e<0){alert(`남은 재고를 입력해주세요.`);return}if(e>r){alert(`남은 재고가 현재 재고(${r}개)보다 많을 수 없습니다.`);return}if(i=r-e,i===0){alert(`변동이 없습니다. (출고량 0개)`);return}}let a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!a){alert(`날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await p(a)||e&&!e.isCurrent())return;let c=n?i:-i,u=t.currentQty,d=u+c;await _(t,{currentQty:d,minimumQty:t.minimumQty,updatedAt:new Date},{date:a,timestamp:new Date,type:n?`in`:`out`,qty:c,before:u,after:d,staffName:o,note:s},{action:`egg`,subAction:n?`in`:`out`,date:a,staff:o,message:`계란 ${n?`입고`:`출고`} — ${n?`+`:`-`}${i}개 / 담당: ${o}`,details:{delta:c,before:u,after:d,note:s||null}},a)&&(e&&!e.isCurrent()||(closeModal(),await x({force:!0}),alert(`${n?`입고`:`출고`} 완료!`)))}))}function N(e){L(`
    <h3 class="modal-title">수동 재고 조정</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${e.currentQty}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(개) *</label>
        <input type="number" id="m_qty" placeholder="개수" />
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
        ${I([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,()=>v(async()=>{let t=l(),n=document.getElementById(`m_adjustType`).value,r=parseInt(document.getElementById(`m_qty`).value),i=document.getElementById(`m_reason`).value.trim(),a=document.getElementById(`m_staff`).value;if(!r||!i||!a){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let o=d();if(await p(o))return;let s=n===`plus`?r:-r,c=e.currentQty,u=c+s;if(u<0){alert(`조정 후 잔량이 ${u}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${c}개에서 최대 ${c}개까지만 감소 가능합니다.`);return}await _(e,{currentQty:u,minimumQty:e.minimumQty,updatedAt:new Date},{date:d(),timestamp:new Date,type:`adjust`,qty:s,before:c,after:u,staffName:a,reason:i},{action:`egg`,subAction:`adjust`,date:o,staff:a,message:`계란 수동조정 — ${s>=0?`+`:``}${s}개 / 사유: ${i} / 담당: ${a}`,details:{delta:s,before:c,after:u,reason:i}},o)&&(t&&!t.isCurrent()||(closeModal(),await x({force:!0}),alert(`조정 완료!`)))}))}function P(e){L(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${e.minimumQty||0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,()=>v(async()=>{let t=l(),n=parseInt(document.getElementById(`m_minQty`).value)||0;await _(e,{currentQty:e.currentQty,minimumQty:n,updatedAt:new Date})&&(t&&!t.isCurrent()||(closeModal(),await x({force:!0}),alert(`설정 완료!`)))}))}var F={};function I(e){let t=``;for(let n of e)(F[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function L(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`egg`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function R(e){let[n,r,...i]=await Promise.all([S(e),C(e),...[`senior`,`lead`,`office`].map(n=>e.getDoc(t(s,`staffGroups`,n)))]);return{stock:n,logs:r,staff:Object.fromEntries([`senior`,`lead`,`office`].map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function z({cacheOnly:e=!0}={}){return g.prepare?.(`default`,R,{cacheOnly:e})}export{z as preparePage,x as renderEgg};