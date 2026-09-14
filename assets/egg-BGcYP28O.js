import{b as e,d as t,i as n,n as r,o as i,p as a,u as o,y as s}from"./index.esm-rHmxwfvm.js";import{n as c}from"./firebase-qGjqjNvO.js";import{n as l}from"./modalManager-Z4b2ihO9.js";import{P as u}from"./index-ihWgJTcM.js";import{n as d}from"./activityLogs-Jg2Ymepu.js";import{t as f}from"./closingGuard-BCSnBl5U.js";var p=!1;async function m(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;let[t,n]=await Promise.all([h(),g(),k()]);e.isConnected&&_(t,n)}async function h(){let t=await n(e(c,`eggStock`,`global`));return t.exists()?t.data():{currentQty:0,minimumQty:0}}async function g(){return(await i(t(s(c,`eggLogs`),o(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}function _(e,t){let n=document.getElementById(`mainContent`),r=Number(e.currentQty||0),i=Number(e.minimumQty||0),a=r<i,o=v(t,r),s=x(t).slice(0,50);n.innerHTML=`
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
            <button class="egg-fifo-toggle" id="btnToggleEggFifo" type="button" aria-expanded="${p?`true`:`false`}">
              <span class="stat-label">현재 재고</span>
              <span class="stat-value" style="font-size:24px;color:${a?`#e53e3e`:`#1a1a1a`}">${r}개</span>
              <span class="egg-fifo-caret">${p?`접기 ▲`:`잔량 보기 ▼`}</span>
            </button>
          </div>
          <div class="stat-item">
            <span class="stat-label">최소재고</span>
            <span class="stat-value">${i}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">상태</span>
            <span class="stat-value" style="color:${a?`#e53e3e`:`#2d7a3a`}">${a?`⚠️ 부족`:`✅ 정상`}</span>
          </div>
        </div>
        ${p?y(o,r):``}
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
              ${s.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:s.map(e=>`
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
  `,document.getElementById(`btnEggIn`).addEventListener(`click`,()=>T(`in`,e)),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>T(`out`,e)),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>E(e)),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>D(e)),document.getElementById(`btnToggleEggFifo`).addEventListener(`click`,()=>{p=!p,_(e,t)})}function v(e,t){let n=[],r=0;for(let t of b(e)){let e=Number(t.qty||0);if(e){if(t.type===`in`||t.type===`adjust`&&e>0){n.push({id:t.id||`${t.date||``}-${n.length}`,date:t.date||`-`,staffName:t.staffName||`-`,source:t.type===`adjust`?`조정`:`입고`,initialQty:e,remainingQty:e,order:n.length});continue}if(t.type===`out`||e<0){let t=Math.abs(e);for(let e of n){if(t<=0)break;if(e.remainingQty<=0)continue;let n=Math.min(e.remainingQty,t);e.remainingQty-=n,t-=n}r+=t}}}let i=n.filter(e=>e.remainingQty>0),a=i.reduce((e,t)=>e+t.remainingQty,0);return{lots:i,fifoTotalQty:a,currentQty:t,diffQty:a-t,unallocatedOutQty:r}}function y(e,t){let n=e.diffQty===0,r=e.lots.length===0?`<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>`:e.lots.map((t,n)=>`
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${n===e.lots.length-1?`└`:`├`}</span>
          <span class="egg-fifo-date">${w(t.date)}</span>
          <span class="egg-fifo-staff">${w(t.staffName)}</span>
          <span class="egg-fifo-source">${t.source}</span>
          <span class="egg-fifo-qty">+${C(t.initialQty)} → ${C(t.remainingQty)} 남음</span>
        </div>
      `).join(``),i=n?``:`<div class="egg-fifo-warning">FIFO 분해 합계 ${C(e.fifoTotalQty)} / 현재 재고 ${C(t)}로 ${C(Math.abs(e.diffQty))} 차이가 있습니다.</div>`,a=e.unallocatedOutQty>0?`<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${C(e.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`:``;return`
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${r}
      <div class="egg-fifo-total">분해 합계 ${C(e.fifoTotalQty)} / 현재 재고 ${C(t)}</div>
      ${i}
      ${a}
    </div>
  `}function b(e){return[...e].sort((e,t)=>{let n=S(e)-S(t);return n===0?String(e.id||``).localeCompare(String(t.id||``)):n})}function x(e){return[...e].sort((e,t)=>{let n=S(t)-S(e);return n===0?String(t.id||``).localeCompare(String(e.id||``)):n})}function S(e){let t=e.timestamp;if(t?.toMillis)return t.toMillis();if(t instanceof Date)return t.getTime();if(typeof t==`number`)return t;let n=Date.parse(e.date||``);return Number.isFinite(n)?n:0}function C(e){return`${Number(e||0).toLocaleString()}개`}function w(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function T(t,n){let i=t===`in`,o=Number(n.currentQty||0),l=i?`
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
  `:`
    <div class="form-group">
      <label>남은 재고(개) *</label>
      <input type="number" id="m_remaining" placeholder="실사 후 남은 개수" min="0" max="${o}" />
      <div id="m_outPreview" style="font-size:12px;color:#888;margin-top:4px;">출고량: -</div>
    </div>
  `;j(`
    <h3 class="modal-title">계란 ${i?`입고`:`출고`}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${o}개</p>
    ${l}
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${u()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${A([`senior`,`office`])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEgg">${i?`입고`:`출고`}</button>
    </div>
  `),i||document.getElementById(`m_remaining`).addEventListener(`input`,e=>{let t=parseInt(e.target.value),n=document.getElementById(`m_outPreview`);if(isNaN(t)||t<0)n.textContent=`출고량: -`,n.style.color=`#888`;else{let e=o-t;e<0?(n.textContent=`남은 재고가 현재(${o}개)보다 많습니다`,n.style.color=`#e53e3e`):e===0?(n.textContent=`출고량: 0개 (변동 없음)`,n.style.color=`#888`):(n.textContent=`출고량: ${e}개`,n.style.color=`#2d7a3a`)}}),document.getElementById(`btnSaveEgg`).addEventListener(`click`,async()=>{let t;if(i){if(t=parseInt(document.getElementById(`m_qty`).value),!t){alert(`수량을 입력해주세요.`);return}}else{let e=parseInt(document.getElementById(`m_remaining`).value);if(isNaN(e)||e<0){alert(`남은 재고를 입력해주세요.`);return}if(e>o){alert(`남은 재고가 현재 재고(${o}개)보다 많을 수 없습니다.`);return}if(t=o-e,t===0){alert(`변동이 없습니다. (출고량 0개)`);return}}let l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,p=document.getElementById(`m_note`).value;if(!l){alert(`날짜는 필수입니다.`);return}if(!u){alert(`담당자는 필수입니다.`);return}if(await f(l))return;let m=i?t:-t,v=n.currentQty,y=v+m;await a(e(c,`eggStock`,`global`),{currentQty:y,minimumQty:n.minimumQty,updatedAt:new Date}),await r(s(c,`eggLogs`),{date:l,timestamp:new Date,type:i?`in`:`out`,qty:m,before:v,after:y,staffName:u,note:p}),await d({action:`egg`,subAction:i?`in`:`out`,date:l,staff:u,message:`계란 ${i?`입고`:`출고`} — ${i?`+`:`-`}${t}개 / 담당: ${u}`,details:{delta:m,before:v,after:y,note:p||null}}),closeModal(),_(await h(),await g()),alert(`${i?`입고`:`출고`} 완료!`)})}function E(t){j(`
    <h3 class="modal-title">수동 재고 조정</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${t.currentQty}개</p>
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
        ${A([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,async()=>{let n=document.getElementById(`m_adjustType`).value,i=parseInt(document.getElementById(`m_qty`).value),o=document.getElementById(`m_reason`).value.trim(),l=document.getElementById(`m_staff`).value;if(!i||!o||!l){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let p=u();if(await f(p))return;let m=n===`plus`?i:-i,v=t.currentQty,y=v+m;if(y<0){alert(`조정 후 잔량이 ${y}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${v}개에서 최대 ${v}개까지만 감소 가능합니다.`);return}await a(e(c,`eggStock`,`global`),{currentQty:y,minimumQty:t.minimumQty,updatedAt:new Date}),await r(s(c,`eggLogs`),{date:u(),timestamp:new Date,type:`adjust`,qty:m,before:v,after:y,staffName:l,reason:o}),await d({action:`egg`,subAction:`adjust`,date:p,staff:l,message:`계란 수동조정 — ${m>=0?`+`:``}${m}개 / 사유: ${o} / 담당: ${l}`,details:{delta:m,before:v,after:y,reason:o}}),closeModal(),_(await h(),await g()),alert(`조정 완료!`)})}function D(t){j(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${t.minimumQty||0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,async()=>{let n=parseInt(document.getElementById(`m_minQty`).value)||0;await a(e(c,`eggStock`,`global`),{currentQty:t.currentQty,minimumQty:n,updatedAt:new Date}),closeModal(),_(await h(),await g()),alert(`설정 완료!`)})}var O={};async function k(){Object.keys(O).length>0||await Promise.all([`senior`,`lead`,`office`].map(async t=>{let r=await n(e(c,`staffGroups`,t));r.exists()&&(O[t]=r.data().members||[])}))}function A(e){let t=``;for(let n of e)(O[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function j(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}l(`egg`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{m as renderEgg};