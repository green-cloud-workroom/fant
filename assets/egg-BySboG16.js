import{a as e,b as t,c as n,d as r,s as i,u as a,y as o}from"./index.esm-CWp5uCwe.js";import{n as s}from"./firebase-Bm8Fqw4J.js";import{r as c}from"./pageLifecycle-_b6L3DA3.js";import{n as l}from"./modalManager-D53QKIlh.js";import{L as u,f as d}from"./index-Dw5m2H8y.js";import{n as f}from"./activityLogs-CO0AhHyv.js";import{t as p}from"./statsAutomationRuntime-DO3haCfh.js";import{t as m}from"./closingGuard-Dg5x2dXF.js";import{t as h}from"./readCommand-D-QT5zkC.js";import{t as g}from"./pageRefresh-BUR6sjuR.js";var _=d(`egg`);async function v(e,n,r=null,i=null,a=null){return h(_,async c=>{if(a&&await m(a,c))return!1;let l=t(s,`eggStock`,`global`),u=r?t(o(s,`eggLogs`)):null;return await c.transaction(s,async t=>{let a=await t.get(l),o=a.exists()?a.data():{currentQty:0,minimumQty:0};if(Number(o.currentQty||0)!==Number(e.currentQty||0)||Number(o.minimumQty||0)!==Number(e.minimumQty||0))throw Error(`다른 작업으로 계란 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);t.set(l,n),r&&t.set(u,r),i&&await f(i,{batch:t})},{targets:[l,...u?[u]:[]]}),!0},{roles:[`admin`,`office`,`production`]})}async function y(e){try{return await e()}catch(e){console.error(`[계란 저장]`,e),alert(e.message)}}var b=!1,x=null;async function S({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;let n=await _.load(e=>z(e),{force:e,onChange:g(_,S)});!n||!t.isConnected||(x=null,b&&(x=await w({getDocs:i},null)),c()?.isCurrent()&&(I=n.staff,T(n.stock,n.logs)))}async function C(n={getDoc:e}){let r=await n.getDoc(t(s,`eggStock`,`global`));return r.exists()?r.data():{currentQty:0,minimumQty:0}}async function w(e={getDocs:i},t=50){let c=[a(`timestamp`,`desc`)];return t!==null&&c.push(n(t)),(await e.getDocs(r(o(s,`eggLogs`),...c))).docs.map(e=>({id:e.id,...e.data()}))}function T(e,t){let n=document.getElementById(`mainContent`),r=Number(e.currentQty||0),a=Number(e.minimumQty||0),o=r<a,s=b?E(x,r):null,l=k(t).slice(0,50);n.innerHTML=`
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
            <button class="egg-fifo-toggle" id="btnToggleEggFifo" type="button" aria-expanded="${b?`true`:`false`}">
              <span class="stat-label">현재 재고</span>
              <span class="stat-value" style="font-size:24px;color:${o?`#e53e3e`:`#1a1a1a`}">${r}개</span>
              <span class="egg-fifo-caret">${b?`접기 ▲`:`잔량 보기 ▼`}</span>
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
        ${b?D(s,r):``}
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
              ${l.length===0?`<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:l.map(e=>`
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
  `,document.getElementById(`btnEggIn`).addEventListener(`click`,()=>N(`in`,e)),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>N(`out`,e)),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>P(e)),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>F(e)),document.getElementById(`btnToggleEggFifo`).addEventListener(`click`,async n=>{if(b)b=!1;else{let e=n.currentTarget;if(e.disabled)return;e.disabled=!0;let t=c();try{if(x=await w({getDocs:i},null),!t?.isCurrent())return;b=!0}catch(t){e.disabled=!1,console.error(`[계란 FIFO 이력]`,t),alert(`잔량 이력을 불러오지 못했습니다. 다시 시도해주세요.`);return}}T(e,t)})}function E(e,t){let n=[],r=0;for(let t of O(e)){let e=Number(t.qty||0);if(e){if(t.type===`in`||t.type===`adjust`&&e>0){n.push({id:t.id||`${t.date||``}-${n.length}`,date:t.date||`-`,staffName:t.staffName||`-`,source:t.type===`adjust`?`조정`:`입고`,initialQty:e,remainingQty:e,order:n.length});continue}if(t.type===`out`||e<0){let t=Math.abs(e);for(let e of n){if(t<=0)break;if(e.remainingQty<=0)continue;let n=Math.min(e.remainingQty,t);e.remainingQty-=n,t-=n}r+=t}}}let i=n.filter(e=>e.remainingQty>0),a=i.reduce((e,t)=>e+t.remainingQty,0);return{lots:i,fifoTotalQty:a,currentQty:t,diffQty:a-t,unallocatedOutQty:r}}function D(e,t){let n=e.diffQty===0,r=e.lots.length===0?`<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>`:e.lots.map((t,n)=>`
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${n===e.lots.length-1?`└`:`├`}</span>
          <span class="egg-fifo-date">${M(t.date)}</span>
          <span class="egg-fifo-staff">${M(t.staffName)}</span>
          <span class="egg-fifo-source">${t.source}</span>
          <span class="egg-fifo-qty">+${j(t.initialQty)} → ${j(t.remainingQty)} 남음</span>
        </div>
      `).join(``),i=n?``:`<div class="egg-fifo-warning">FIFO 분해 합계 ${j(e.fifoTotalQty)} / 현재 재고 ${j(t)}로 ${j(Math.abs(e.diffQty))} 차이가 있습니다.</div>`,a=e.unallocatedOutQty>0?`<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${j(e.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`:``;return`
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${r}
      <div class="egg-fifo-total">분해 합계 ${j(e.fifoTotalQty)} / 현재 재고 ${j(t)}</div>
      ${i}
      ${a}
    </div>
  `}function O(e){return[...e].sort((e,t)=>{let n=A(e)-A(t);return n===0?String(e.id||``).localeCompare(String(t.id||``)):n})}function k(e){return[...e].sort((e,t)=>{let n=A(t)-A(e);return n===0?String(t.id||``).localeCompare(String(e.id||``)):n})}function A(e){let t=e.timestamp;if(t?.toMillis)return t.toMillis();if(t instanceof Date)return t.getTime();if(typeof t==`number`)return t;let n=Date.parse(e.date||``);return Number.isFinite(n)?n:0}function j(e){return`${Number(e||0).toLocaleString()}개`}function M(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function N(e,t){let n=e===`in`,r=Number(t.currentQty||0),i=n?`
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
  `;R(`
    <h3 class="modal-title">계란 ${n?`입고`:`출고`}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${r}개</p>
    ${i}
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${u()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${L([`senior`,`office`])}
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
  `),n||document.getElementById(`m_remaining`).addEventListener(`input`,e=>{let t=parseInt(e.target.value),n=document.getElementById(`m_outPreview`);if(isNaN(t)||t<0)n.textContent=`출고량: -`,n.style.color=`#888`;else{let e=r-t;e<0?(n.textContent=`남은 재고가 현재(${r}개)보다 많습니다`,n.style.color=`#e53e3e`):e===0?(n.textContent=`출고량: 0개 (변동 없음)`,n.style.color=`#888`):(n.textContent=`출고량: ${e}개`,n.style.color=`#2d7a3a`)}}),document.getElementById(`btnSaveEgg`).addEventListener(`click`,()=>y(async()=>{let e=c(),i;if(n){if(i=parseInt(document.getElementById(`m_qty`).value),!i){alert(`수량을 입력해주세요.`);return}}else{let e=parseInt(document.getElementById(`m_remaining`).value);if(isNaN(e)||e<0){alert(`남은 재고를 입력해주세요.`);return}if(e>r){alert(`남은 재고가 현재 재고(${r}개)보다 많을 수 없습니다.`);return}if(i=r-e,i===0){alert(`변동이 없습니다. (출고량 0개)`);return}}let a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,s=document.getElementById(`m_note`).value;if(!a){alert(`날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await m(a)||e&&!e.isCurrent())return;let l=n?i:-i,u=await p({itemId:`eggLogs:egg`,name:`계란`,date:a,qty:i,unit:`개`,stage:n?`계란`:`계란 출고`,direction:n?`supply`:`usage`},()=>!e||e.isCurrent());if(!u.approved||e&&!e.isCurrent())return;let d=t.currentQty,f=d+l;await v(t,{currentQty:f,minimumQty:t.minimumQty,updatedAt:new Date},{date:a,timestamp:new Date,type:n?`in`:`out`,...u.review?{statsQuantityReview:u.review}:{},qty:l,before:d,after:f,staffName:o,note:s},{action:`egg`,subAction:n?`in`:`out`,date:a,staff:o,message:`계란 ${n?`입고`:`출고`} — ${n?`+`:`-`}${i}개 / 담당: ${o}`,details:{delta:l,before:d,after:f,note:s||null}},a)&&(e&&!e.isCurrent()||(closeModal(),await S({force:!0}),alert(`${n?`입고`:`출고`} 완료!`)))}))}function P(e){R(`
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
        ${L([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `),document.getElementById(`btnSaveAdjust`).addEventListener(`click`,()=>y(async()=>{let t=c(),n=document.getElementById(`m_adjustType`).value,r=parseInt(document.getElementById(`m_qty`).value),i=document.getElementById(`m_reason`).value.trim(),a=document.getElementById(`m_staff`).value;if(!r||!i||!a){alert(`조정량, 사유, 담당자는 필수입니다.`);return}let o=u();if(await m(o))return;let s=n===`plus`?r:-r,l=e.currentQty,d=l+s;if(d<0){alert(`조정 후 잔량이 ${d}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${l}개에서 최대 ${l}개까지만 감소 가능합니다.`);return}await v(e,{currentQty:d,minimumQty:e.minimumQty,updatedAt:new Date},{date:u(),timestamp:new Date,type:`adjust`,qty:s,before:l,after:d,staffName:a,reason:i},{action:`egg`,subAction:`adjust`,date:o,staff:a,message:`계란 수동조정 — ${s>=0?`+`:``}${s}개 / 사유: ${i} / 담당: ${a}`,details:{delta:s,before:l,after:d,reason:i}},o)&&(t&&!t.isCurrent()||(closeModal(),await S({force:!0}),alert(`조정 완료!`)))}))}function F(e){R(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${e.minimumQty||0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,()=>y(async()=>{let t=c(),n=parseInt(document.getElementById(`m_minQty`).value)||0;await v(e,{currentQty:e.currentQty,minimumQty:n,updatedAt:new Date})&&(t&&!t.isCurrent()||(closeModal(),await S({force:!0}),alert(`설정 완료!`)))}))}var I={};function L(e){let t=``;for(let n of e)(I[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function R(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}l(`egg`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function z(e){let[n,r,...i]=await Promise.all([C(e),w(e),...[`senior`,`lead`,`office`].map(n=>e.getDoc(t(s,`staffGroups`,n)))]);return{stock:n,logs:r,staff:Object.fromEntries([`senior`,`lead`,`office`].map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function B({cacheOnly:e=!0}={}){return _.prepare?.(`default`,z,{cacheOnly:e})}export{B as preparePage,S as renderEgg};