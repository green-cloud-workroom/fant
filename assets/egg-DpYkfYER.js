import{a as e,b as t,c as n,d as r,s as i,u as a,y as o}from"./index.esm-CWp5uCwe.js";import{n as s}from"./firebase-Bm8Fqw4J.js";import{r as c}from"./pageLifecycle-_b6L3DA3.js";import{n as l}from"./modalManager-D53QKIlh.js";import{L as u,W as d,f}from"./index-Bmv8jSd7.js";import{n as p}from"./activityLogs-DpbQj_09.js";import{t as m}from"./statusToast-DAQ_Eu62.js";import{o as h}from"./manualMovementLogic-BmrH9oK0.js";import{i as g,n as _,r as v,t as y}from"./movementForm-YdnAH_bu.js";import{t as b}from"./statsAutomationRuntime-CGTxkuwd.js";import{t as x}from"./closingGuard-BYnCJfQz.js";import{t as S}from"./readCommand-DXX6Y3E5.js";import{t as C}from"./pageRefresh-DAneIeoi.js";var w=f(`egg`);async function T(e,n,r=null,i=null,a=null,c=null){return S(w,async l=>{if(a&&await x(a,l))return!1;if(r)await g({db:s,command:l,name:`eggLogs`,stockId:`global`,log:r,selection:c,expectedBefore:Number(e.currentQty||0),uid:d?.uid||null});else{let a=t(s,`eggStock`,`global`),c=r?t(o(s,`eggLogs`)):null;await l.transaction(s,async t=>{let o=await t.get(a),s=o.exists()?o.data():{currentQty:0,minimumQty:0};if(Number(s.currentQty||0)!==Number(e.currentQty||0)||Number(s.minimumQty||0)!==Number(e.minimumQty||0))throw Error(`다른 작업으로 계란 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);t.set(a,n),r&&t.set(c,r),i&&await p(i,{batch:t})},{targets:[a,...c?[c]:[]]})}return!0},{roles:[`admin`,`office`,`production`]})}async function E(e){try{return await e()}catch(e){console.error(`[계란 저장]`,e),alert(e.message)}}var D=!1,O=null;async function k({force:e=!1}={}){let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;let n=await w.load(e=>K(e),{force:e,onChange:C(w,k)});!n||!t.isConnected||(O=null,D&&(O=await j({getDocs:i},null)),c()?.isCurrent()&&(U=n.staff,M(n.stock,n.logs)))}async function A(n={getDoc:e}){let r=await n.getDoc(t(s,`eggStock`,`global`));return r.exists()?r.data():{currentQty:0,minimumQty:0}}async function j(e={getDocs:i},t=50){let c=[a(`timestamp`,`desc`)];return t!==null&&c.push(n(t)),(await e.getDocs(r(o(s,`eggLogs`),...c))).docs.map(e=>({id:e.id,...e.data()}))}function M(e,t){let n=document.getElementById(`mainContent`),r=Number(e.currentQty||0),a=Number(e.minimumQty||0),o=r<a,s=D?N(O,r):null,l=I(t).slice(0,50);n.innerHTML=`
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
            <button class="egg-fifo-toggle" id="btnToggleEggFifo" type="button" aria-expanded="${D?`true`:`false`}">
              <span class="stat-label">현재 재고</span>
              <span class="stat-value" style="font-size:24px;color:${o?`#e53e3e`:`#1a1a1a`}">${r}개</span>
              <span class="egg-fifo-caret">${D?`접기 ▲`:`잔량 보기 ▼`}</span>
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
        ${D?P(s,r):``}
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
                        ${h(e,e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`)}
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
  `,document.getElementById(`btnEggIn`).addEventListener(`click`,()=>B(`in`,e)),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>B(`out`,e)),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>V(e)),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>H(e)),document.getElementById(`btnToggleEggFifo`).addEventListener(`click`,async n=>{if(D)D=!1;else{let e=n.currentTarget;if(e.disabled)return;e.disabled=!0;let t=c();try{if(O=await j({getDocs:i},null),!t?.isCurrent())return;D=!0}catch(t){e.disabled=!1,console.error(`[계란 FIFO 이력]`,t),alert(`잔량 이력을 불러오지 못했습니다. 다시 시도해주세요.`);return}}M(e,t)})}function N(e,t){let n=[],r=0;for(let t of F(e)){let e=Number(t.qty||0);if(e){if(t.type===`in`||t.type===`adjust`&&e>0){n.push({id:t.id||`${t.date||``}-${n.length}`,date:t.date||`-`,staffName:t.staffName||`-`,source:t.type===`adjust`?`조정`:`입고`,initialQty:e,remainingQty:e,order:n.length});continue}if(t.type===`out`||e<0){let t=Math.abs(e);for(let e of n){if(t<=0)break;if(e.remainingQty<=0)continue;let n=Math.min(e.remainingQty,t);e.remainingQty-=n,t-=n}r+=t}}}let i=n.filter(e=>e.remainingQty>0),a=i.reduce((e,t)=>e+t.remainingQty,0);return{lots:i,fifoTotalQty:a,currentQty:t,diffQty:a-t,unallocatedOutQty:r}}function P(e,t){let n=e.diffQty===0,r=e.lots.length===0?`<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>`:e.lots.map((t,n)=>`
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${n===e.lots.length-1?`└`:`├`}</span>
          <span class="egg-fifo-date">${z(t.date)}</span>
          <span class="egg-fifo-staff">${z(t.staffName)}</span>
          <span class="egg-fifo-source">${t.source}</span>
          <span class="egg-fifo-qty">+${R(t.initialQty)} → ${R(t.remainingQty)} 남음</span>
        </div>
      `).join(``),i=n?``:`<div class="egg-fifo-warning">FIFO 분해 합계 ${R(e.fifoTotalQty)} / 현재 재고 ${R(t)}로 ${R(Math.abs(e.diffQty))} 차이가 있습니다.</div>`,a=e.unallocatedOutQty>0?`<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${R(e.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`:``;return`
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${r}
      <div class="egg-fifo-total">분해 합계 ${R(e.fifoTotalQty)} / 현재 재고 ${R(t)}</div>
      ${i}
      ${a}
    </div>
  `}function F(e){return[...e].sort((e,t)=>{let n=L(e)-L(t);return n===0?String(e.id||``).localeCompare(String(t.id||``)):n})}function I(e){return[...e].sort((e,t)=>{let n=L(t)-L(e);return n===0?String(t.id||``).localeCompare(String(e.id||``)):n})}function L(e){let t=e.timestamp;if(t?.toMillis)return t.toMillis();if(t instanceof Date)return t.getTime();if(typeof t==`number`)return t;let n=Date.parse(e.date||``);return Number.isFinite(n)?n:0}function R(e){return`${Number(e||0).toLocaleString()}개`}function z(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function B(e,t){let n=e===`in`,r=Number(t.currentQty||0),i=n?`
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
  `:`
    <div class="form-group" id="m_usageGroup">
      <label>사용량(개) *</label>
      <input type="number" id="m_usageQty" min="1" step="1" placeholder="사용한 개수 입력" />
    </div>
    <div class="form-group" id="m_remainingGroup" hidden style="display:none">
      <label>남은 재고(개) *</label>
      <input type="number" id="m_remaining" placeholder="남은 개수 입력" min="0" max="${r}" />
    </div>
    <div id="m_outPreview" style="font-size:12px;color:#888;margin-top:4px;">출고량: -</div>
  `;if(G(`
    <h3 class="modal-title">계란 ${n?`입고`:`출고`}</h3>
    ${_({incoming:n,allowed:n?[`receipt`,`test`]:[`usage`,`reconciliation`,`test`],defaultKind:n?`receipt`:`usage`,reasonField:!1})}
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
        ${W([`senior`,`office`])}
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
  `),!n){let e=document.getElementById(`movement_kind`),t=()=>{let t=e.value===`usage`;for(let[e,n]of[[`m_usageGroup`,t],[`m_remainingGroup`,!t]]){let t=document.getElementById(e);t.hidden=!n,t.style.display=n?`block`:`none`}let n=Number(document.getElementById(t?`m_usageQty`:`m_remaining`).value),i=document.getElementById(t?`m_usageQty`:`m_remaining`).value===``,a=t?r-n:n;document.getElementById(`m_outPreview`).textContent=i?`출고량: -`:a<0||a>r?`수량을 확인해주세요`:`사용량: ${r-a}개 · 남은 재고: ${a}개`};e.addEventListener(`change`,t),document.getElementById(`m_usageQty`).addEventListener(`input`,t),document.getElementById(`m_remaining`).addEventListener(`input`,t)}let a=y({db:s,name:`eggLogs`,filter:{},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e);let t=document.getElementById(`m_adjustType`);t&&(t.value=e>0?`plus`:`minus`)},reasonInput:document.getElementById(`m_note`)});document.getElementById(`btnSaveEgg`).addEventListener(`click`,()=>E(async()=>{let e=c(),i=v(a);if(!i)return;let o;if(n){if(o=parseInt(document.getElementById(`m_qty`).value),!o){alert(`수량을 입력해주세요.`);return}}else if(i.kind===`usage`){if(o=Number(document.getElementById(`m_usageQty`).value),!Number.isInteger(o)||o<=0){alert(`사용량은 1 이상의 정수로 입력해주세요.`);return}if(o>r){alert(`사용량이 현재 재고(${r}개)보다 많을 수 없습니다.`);return}}else{let e=parseInt(document.getElementById(`m_remaining`).value);if(isNaN(e)||e<0){alert(`남은 재고를 입력해주세요.`);return}if(e>r){alert(`남은 재고가 현재 재고(${r}개)보다 많을 수 없습니다.`);return}if(o=r-e,o===0){alert(`변동이 없습니다. (출고량 0개)`);return}}let s=document.getElementById(`m_date`).value,l=document.getElementById(`m_staff`).value,u=document.getElementById(`m_note`).value;if(!s){alert(`날짜는 필수입니다.`);return}if(!l){alert(`담당자는 필수입니다.`);return}if(await x(s)||e&&!e.isCurrent())return;let d=n?o:-o,f=i.kind===`test`?{approved:!0}:await b({itemId:`eggLogs:egg`,name:`계란`,date:s,qty:o,unit:`개`,stage:n?`계란`:`계란 출고`,direction:n?`supply`:`usage`},()=>!e||e.isCurrent());if(!f.approved||e&&!e.isCurrent())return;let p=t.currentQty,h=p+d;await T(t,{currentQty:h,minimumQty:t.minimumQty,updatedAt:new Date},{date:s,timestamp:new Date,type:n?`in`:`out`,...f.review?{statsQuantityReview:f.review}:{},qty:d,before:p,after:h,staffName:l,note:u},{action:`egg`,subAction:n?`in`:`out`,date:s,staff:l,message:`계란 ${n?`입고`:`출고`} — ${n?`+`:`-`}${o}개 / 담당: ${l}`,details:{delta:d,before:p,after:h,note:u||null}},s,i)&&(e&&!e.isCurrent()||(closeModal(),await k({force:!0}),m(`${n?`입고`:`출고`} 완료!`)))}))}function V(e){G(`
    <h3 class="modal-title">수동 재고 조정</h3>
    ${_({reasonField:!1})}
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
        ${W([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);let t=y({db:s,name:`eggLogs`,filter:{},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e);let t=document.getElementById(`m_adjustType`);t&&(t.value=e>0?`plus`:`minus`)},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveAdjust`).addEventListener(`click`,()=>E(async()=>{let n=c(),r=v(t);if(!r)return;let i=document.getElementById(`m_adjustType`).value,a=parseInt(document.getElementById(`m_qty`).value),o=r.reason,s=document.getElementById(`m_staff`).value;if(!a||!s){alert(`조정량과 담당자는 필수입니다.`);return}let l=u();if(await x(l))return;let d=i===`plus`?a:-a,f=e.currentQty,p=f+d;if(p<0&&r.kind!==`test`){alert(`조정 후 잔량이 ${p}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${f}개에서 최대 ${f}개까지만 감소 가능합니다.`);return}await T(e,{currentQty:p,minimumQty:e.minimumQty,updatedAt:new Date},{date:u(),timestamp:new Date,type:`adjust`,qty:d,before:f,after:p,staffName:s,reason:o},{action:`egg`,subAction:`adjust`,date:l,staff:s,message:`계란 수동조정 — ${d>=0?`+`:``}${d}개 / 사유: ${o} / 담당: ${s}`,details:{delta:d,before:f,after:p,reason:o}},l,r)&&(n&&!n.isCurrent()||(closeModal(),await k({force:!0}),m(`조정 완료!`)))}))}function H(e){G(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${e.minimumQty||0}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,()=>E(async()=>{let t=c(),n=parseInt(document.getElementById(`m_minQty`).value)||0;await T(e,{currentQty:e.currentQty,minimumQty:n,updatedAt:new Date})&&(t&&!t.isCurrent()||(closeModal(),await k({force:!0}),alert(`설정 완료!`)))}))}var U={};function W(e){let t=``;for(let n of e)(U[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function G(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}l(`egg`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function K(e){let[n,r,...i]=await Promise.all([A(e),j(e),...[`senior`,`lead`,`office`].map(n=>e.getDoc(t(s,`staffGroups`,n)))]);return{stock:n,logs:r,staff:Object.fromEntries([`senior`,`lead`,`office`].map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function q({cacheOnly:e=!0}={}){return w.prepare?.(`default`,K,{cacheOnly:e})}export{q as preparePage,k as renderEgg};