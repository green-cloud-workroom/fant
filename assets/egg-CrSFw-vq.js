import{a as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-rHmxwfvm.js";import{n as o}from"./firebase-qGjqjNvO.js";import{n as s}from"./modalManager-Z4b2ihO9.js";import{L as c,x as l}from"./index-DRMzawyA.js";import{n as u}from"./activityLogs-DYC0UZD3.js";import{t as d}from"./closingGuard-Dfuw_srM.js";import{t as f}from"./pageResources-BE3e2wtt.js";import{t as p}from"./readCommand-zTaCVxIR.js";import{t as m}from"./pageRefresh-D3ZSodaR.js";var h=f(`egg`);async function g(e,n,r=null,i=null,s=null){return p(h,async c=>{if(s&&await d(s,c))return!1;let l=t(o,`eggStock`,`global`),f=r?t(a(o,`eggLogs`)):null;return await c.transaction(o,async t=>{let a=await t.get(l),o=a.exists()?a.data():{currentQty:0,minimumQty:0};if(Number(o.currentQty||0)!==Number(e.currentQty||0)||Number(o.minimumQty||0)!==Number(e.minimumQty||0))throw Error(`다른 작업으로 계란 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);t.set(l,n),r&&t.set(f,r),i&&await u(i,{batch:t})},{targets:[l,...f?[f]:[]]}),!0},{roles:[`admin`,`office`,`production`]})}async function _(e){try{return await e()}catch(e){console.error(`[계란 저장]`,e),alert(e.message)}}var v=!1;async function y({force:e=!1}={}){let n=document.getElementById(`mainContent`);n.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;let r=await h.load(async e=>{let[n,r,...i]=await Promise.all([b(e),x(e),...[`senior`,`lead`,`office`].map(n=>e.getDoc(t(o,`staffGroups`,n)))]);return{stock:n,logs:r,staff:Object.fromEntries([`senior`,`lead`,`office`].map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}},{force:e,onChange:m(h,y)});!r||!n.isConnected||(N=r.staff,S(r.stock,r.logs))}async function b(n={getDoc:e}){let r=await n.getDoc(t(o,`eggStock`,`global`));return r.exists()?r.data():{currentQty:0,minimumQty:0}}async function x(e={getDocs:r}){return(await e.getDocs(n(a(o,`eggLogs`),i(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}function S(e,t){let n=document.getElementById(`mainContent`),r=Number(e.currentQty||0),i=Number(e.minimumQty||0),a=r<i,o=C(t,r),s=E(t).slice(0,50);n.innerHTML=`
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
            <button class="egg-fifo-toggle" id="btnToggleEggFifo" type="button" aria-expanded="${v?`true`:`false`}">
              <span class="stat-label">현재 재고</span>
              <span class="stat-value" style="font-size:24px;color:${a?`#e53e3e`:`#1a1a1a`}">${r}개</span>
              <span class="egg-fifo-caret">${v?`접기 ▲`:`잔량 보기 ▼`}</span>
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
        ${v?w(o,r):``}
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
  `,document.getElementById(`btnEggIn`).addEventListener(`click`,()=>A(`in`,e)),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>A(`out`,e)),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>j(e)),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>M(e)),document.getElementById(`btnToggleEggFifo`).addEventListener(`click`,()=>{v=!v,S(e,t)})}function C(e,t){let n=[],r=0;for(let t of T(e)){let e=Number(t.qty||0);if(e){if(t.type===`in`||t.type===`adjust`&&e>0){n.push({id:t.id||`${t.date||``}-${n.length}`,date:t.date||`-`,staffName:t.staffName||`-`,source:t.type===`adjust`?`조정`:`입고`,initialQty:e,remainingQty:e,order:n.length});continue}if(t.type===`out`||e<0){let t=Math.abs(e);for(let e of n){if(t<=0)break;if(e.remainingQty<=0)continue;let n=Math.min(e.remainingQty,t);e.remainingQty-=n,t-=n}r+=t}}}let i=n.filter(e=>e.remainingQty>0),a=i.reduce((e,t)=>e+t.remainingQty,0);return{lots:i,fifoTotalQty:a,currentQty:t,diffQty:a-t,unallocatedOutQty:r}}function w(e,t){let n=e.diffQty===0,r=e.lots.length===0?`<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>`:e.lots.map((t,n)=>`
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${n===e.lots.length-1?`└`:`├`}</span>
          <span class="egg-fifo-date">${k(t.date)}</span>
          <span class="egg-fifo-staff">${k(t.staffName)}</span>
          <span class="egg-fifo-source">${t.source}</span>
          <span class="egg-fifo-qty">+${O(t.initialQty)} → ${O(t.remainingQty)} 남음</span>
        </div>
      `).join(``),i=n?``:`<div class="egg-fifo-warning">FIFO 분해 합계 ${O(e.fifoTotalQty)} / 현재 재고 ${O(t)}로 ${O(Math.abs(e.diffQty))} 차이가 있습니다.</div>`,a=e.unallocatedOutQty>0?`<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${O(e.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`:``;return`
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${r}
      <div class="egg-fifo-total">분해 합계 ${O(e.fifoTotalQty)} / 현재 재고 ${O(t)}</div>
      ${i}
      ${a}
    </div>
  `}function T(e){return[...e].sort((e,t)=>{let n=D(e)-D(t);return n===0?String(e.id||``).localeCompare(String(t.id||``)):n})}function E(e){return[...e].sort((e,t)=>{let n=D(t)-D(e);return n===0?String(t.id||``).localeCompare(String(e.id||``)):n})}function D(e){let t=e.timestamp;if(t?.toMillis)return t.toMillis();if(t instanceof Date)return t.getTime();if(typeof t==`number`)return t;let n=Date.parse(e.date||``);return Number.isFinite(n)?n:0}function O(e){return`${Number(e||0).toLocaleString()}개`}function k(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function A(e,t){let n=e===`in`,r=Number(t.currentQty||0),i=n?`
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
  `;F(`
    <h3 class="modal-title">계란 ${n?`입고`:`출고`}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${r}개</p>
    ${i}
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${c()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${P([`senior`,`office`])}
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
  `),n||document.getElementById(`m_remaining`).addEventListener(`input`,e=>{let t=parseInt(e.target.value),n=document.getElementById(`m_outPreview`);if(isNaN(t)||t<0)n.textContent=`출고량: -`,n.style.color=`#888`;else{let e=r-t;e<0?(n.textContent=`남은 재고가 현재(${r}개)보다 많습니다`,n.style.color=`#e53e3e`):e===0?(n.textContent=`출고량: 0개 (변동 없음)`,n.style.color=`#888`):(n.textContent=`출고량: ${e}개`,n.style.color=`#2d7a3a`)}}),document.getElementById(`btnSaveEgg`).addEventListener(`click`,()=>_(async()=>{let e=l(),i;if(n){if(i=parseInt(document.getElementById(`m_qty`).value),!i){alert(`수량을 입력해주세요.`);return}}else{let e=parseInt(document.getElementById(`m_remaining`).value);if(isNaN(e)||e<0){alert(`남은 재고를 입력해주세요.`);return}if(e>r){alert(`남은 재고가 현재 재고(${r}개)보다 많을 수 없습니다.`);return}if(i=r-e,i===0){alert(`변동이 없습니다. (출고량 0개)`);return}}let a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!a){alert(`날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await d(a)||e&&!e.isCurrent())return;let c=n?i:-i,u=t.currentQty,f=u+c;await g(t,{currentQty:f,minimumQty:t.minimumQty,updatedAt:new Date},{date:a,timestamp:new Date,type:n?`in`:`out`,qty:c,before:u,after:f,staffName:o,note:s},{action:`egg`,subAction:n?`in`:`out`,date:a,staff:o,message:`계란 ${n?`입고`:`출고`} — ${n?`+`:`-`}${i}개 / 담당: ${o}`,details:{delta:c,before:u,after:f,note:s||null}},a)&&(e&&!e.isCurrent()||(closeModal(),await y({force:!0}),alert(`${n?`입고`:`출고`} 완료!`)))}))}function j(e){F(`
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
        ${P([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,()=>_(async()=>{let t=l(),n=document.getElementById(`m_adjustType`).value,r=parseInt(document.getElementById(`m_qty`).value),i=document.getElementById(`m_reason`).value.trim(),a=document.getElementById(`m_staff`).value;if(!r||!i||!a){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let o=c();if(await d(o))return;let s=n===`plus`?r:-r,u=e.currentQty,f=u+s;if(f<0){alert(`조정 후 잔량이 ${f}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${u}개에서 최대 ${u}개까지만 감소 가능합니다.`);return}await g(e,{currentQty:f,minimumQty:e.minimumQty,updatedAt:new Date},{date:c(),timestamp:new Date,type:`adjust`,qty:s,before:u,after:f,staffName:a,reason:i},{action:`egg`,subAction:`adjust`,date:o,staff:a,message:`계란 수동조정 — ${s>=0?`+`:``}${s}개 / 사유: ${i} / 담당: ${a}`,details:{delta:s,before:u,after:f,reason:i}},o)&&(t&&!t.isCurrent()||(closeModal(),await y({force:!0}),alert(`조정 완료!`)))}))}function M(e){F(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${e.minimumQty||0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,()=>_(async()=>{let t=l(),n=parseInt(document.getElementById(`m_minQty`).value)||0;await g(e,{currentQty:e.currentQty,minimumQty:n,updatedAt:new Date})&&(t&&!t.isCurrent()||(closeModal(),await y({force:!0}),alert(`설정 완료!`)))}))}var N={};function P(e){let t=``;for(let n of e)(N[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function F(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}s(`egg`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});export{y as renderEgg};