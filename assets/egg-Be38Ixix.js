import{a as e,b as t,c as n,d as r,s as i,u as a,y as o}from"./index.esm-D8prxbkJ.js";import{n as s}from"./firebase-BOShkvR0.js";import{n as c}from"./modalManager-Z4b2ihO9.js";import{A as l,K as u,S as d,T as f,et as p,j as m,v as h}from"./index-FIdn_-93.js";import{o as g,s as _}from"./manualMovementLogic-B7xM1mhV.js";import{t as v}from"./movementNote-BTKDyL6c.js";import{t as y}from"./statusToast-DAQ_Eu62.js";import{i as b,n as x,r as S,t as C}from"./movementForm-BOK_b4hn.js";import{t as w}from"./statsAutomationRuntime-DtF7b5bW.js";import{t as T}from"./closingGuard-ByO2OCit.js";import{n as ee}from"./activityLogs-BiSzJsvh.js";import{t as E}from"./readCommand-DHa9Wtv1.js";import{t as D}from"./pageRefresh-BUau7Lmj.js";var O=h(`egg`);async function k(e,n,r=null,i=null,a=null,c=null){return E(O,async l=>{if(a&&await T(a,l))return!1;if(r)await b({db:s,command:l,name:`eggLogs`,stockId:`global`,log:r,selection:c,expectedBefore:Number(e.currentQty||0),uid:p?.uid||null});else{let a=t(s,`eggStock`,`global`),c=r?t(o(s,`eggLogs`)):null;await l.transaction(s,async t=>{let o=await t.get(a),s=o.exists()?o.data():{currentQty:0,minimumQty:0};if(Number(s.currentQty||0)!==Number(e.currentQty||0)||Number(s.minimumQty||0)!==Number(e.minimumQty||0))throw Error(`다른 작업으로 계란 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.`);t.set(a,n),r&&t.set(c,r),i&&await ee(i,{batch:t})},{targets:[a,...c?[c]:[]]})}return!0},{roles:[`admin`,`office`,`production`]})}async function A(e){try{return await e()}catch(e){console.error(`[계란 저장]`,e),alert(e.message)}}var j=!1,M=null,N=`out`,P=``,F=``;async function I({force:e=!1}={}){m(()=>{F=``,P=``,N=`out`});let t=document.getElementById(`mainContent`);t.innerHTML=`<div style="padding:24px;"><p>계란 로딩 중...</p></div>`;let n=await O.load(e=>$(e),{force:e,onChange:D(O,I,{draftSelector:`.egg-entry-form`})});!n||!t.isConnected||(M=null,j&&(M=await R({getDocs:i},null)),l()?.isCurrent()&&(X=n.staff,te(n.stock,n.logs)))}async function L(n={getDoc:e}){let r=await n.getDoc(t(s,`eggStock`,`global`));return r.exists()?r.data():{currentQty:0,minimumQty:0}}async function R(e={getDocs:i},t=50){let c=[a(`timestamp`,`desc`)];return t!==null&&c.push(n(t)),(await e.getDocs(r(o(s,`eggLogs`),...c))).docs.map(e=>({id:e.id,...e.data()}))}function te(e,t){let n=document.getElementById(`mainContent`),r=Number(e.currentQty||0),a=Number(e.minimumQty||0),o=r<a,s=j?V(M,r):null,c=W(t).slice(0,50),f=c.filter(e=>e.date===u());n.innerHTML=`
    <div class="page-wrap egg-page egg-workspace-page">
      <div class="page-header">
        <div class="egg-page-heading"><h2 class="page-title">계란</h2><span>오늘 ${q(u())}</span></div>
        <div class="egg-page-actions">
          <button class="btn-secondary" id="btnAdjustEgg">수동조정</button>
          <details class="egg-other-actions"><summary>기타 입출고</summary><div>
            <button class="btn-secondary" id="btnEggOut">계란 출고 · 실사·테스트</button>
            <button class="btn-secondary" id="btnEggIn">계란 입고 · 테스트</button>
          </div></details>
        </div>
      </div>
      <div class="egg-workspace">
        <section class="egg-current-card" aria-label="현재 계란 재고">
          <div class="egg-current-label">현재 재고 <span class="egg-status egg-status--${r<=0?`empty`:o?`low`:`normal`}">${r<=0?`재고 없음`:o?`최소 미달`:`정상`}</span></div>
          <div class="egg-current-quantity"><strong>${q(r.toLocaleString())}</strong><span>개</span></div>
          <div class="egg-minimum-line">최소재고 <b>${q(K(a))}</b><button type="button" class="egg-link" id="btnSetMinEgg">설정</button></div>
          <p class="egg-threshold-text">${r===a?`최소재고와 같음`:`최소재고보다 ${q(K(Math.abs(r-a)))} ${o?`부족`:`많음`}`}</p>
          <button class="egg-link egg-lots-button" id="btnToggleEggFifo" type="button" aria-controls="eggFifoHost" aria-expanded="${j}">${j?`입고별 잔량 접기 ▲`:`입고별 잔량 · 참고 ▼`}</button>
        </section>
        <section class="egg-entry-card" id="eggEntryHost" aria-label="계란 사용·입고 입력"></section>
      </div>
      <div id="eggFifoHost" ${j?``:`hidden`}>${j?H(s,r):``}</div>
      <section class="egg-today-card" aria-label="오늘 계란 기록">
        <div class="egg-record-heading"><h3>오늘 기록</h3><span>최근 50건 중 오늘 날짜 기록 ${f.length}건</span><div id="eggTodayPaging"></div></div>
        <div class="table-wrap"><table class="data-table egg-today-table"><thead><tr><th>구분</th><th>수량(개)</th><th>변경 전 → 후</th><th>담당자</th><th>비고</th></tr></thead><tbody id="eggTodayRows"></tbody></table></div>
      </section>
      <details class="egg-history-card">
        <summary>입출고 이력 <span>최근 ${c.length}건 · 펼쳐보기</span></summary>
        <div class="table-wrap">
          <table class="data-table egg-history-table">
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
                    <td>${q(e.date||`-`)}</td>
                    <td>
                      <span class="tag stock-movement-badge" data-movement-label="${q(g(e,e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`))}">
                        ${g(e,e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`)}
                      </span>
                    </td>
                    <td class="stock-quantity--${e.qty>0?`increase`:e.qty<0?`decrease`:`zero`}" style="font-weight:600">
                      ${e.qty>0?`+`:``}${q(e.qty)}
                    </td>
                    <td>${q(e.before??`-`)}</td>
                    <td>${q(e.after??`-`)}</td>
                    <td>${q(e.staffName||`-`)}</td>
                    <td>${q(v(e.note||e.reason||`-`,`eggLogs`,t,e=>e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`))}</td>
                  </tr>
                `).join(``)}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  `,B(e),z(f,t);let p=async t=>{let n=l();!await d()||n&&!n.isCurrent()||(B(e),t())};document.getElementById(`btnEggIn`).addEventListener(`click`,()=>p(()=>J(`in`,e))),document.getElementById(`btnEggOut`).addEventListener(`click`,()=>p(()=>J(`out`,e))),document.getElementById(`btnAdjustEgg`).addEventListener(`click`,()=>p(()=>ne(e))),document.getElementById(`btnSetMinEgg`).addEventListener(`click`,()=>p(()=>re(e))),document.getElementById(`btnToggleEggFifo`).addEventListener(`click`,async e=>{let t=e.currentTarget;if(j)j=!1;else{if(t.disabled)return;t.disabled=!0;let e=l();try{if(M=await R({getDocs:i},null),!e?.isCurrent())return;j=!0}catch(e){t.disabled=!1,console.error(`[계란 FIFO 이력]`,e),alert(`잔량 이력을 불러오지 못했습니다. 다시 시도해주세요.`);return}}let n=document.getElementById(`eggFifoHost`);n.hidden=!j,n.innerHTML=j?H(V(M,r),r):``,t.disabled=!1,t.setAttribute(`aria-expanded`,String(j)),t.textContent=j?`입고별 잔량 접기 ▲`:`입고별 잔량 · 참고 ▼`})}function z(e,t){let n=0,r=()=>{document.getElementById(`eggTodayRows`).innerHTML=e.length?e.slice(n*5,n*5+5).map(e=>`<tr>
      <td><span class="tag stock-movement-badge" data-movement-label="${q(g(e,e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`))}">${q(g(e,e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`))}</span></td>
      <td class="stock-quantity--${e.qty>0?`increase`:e.qty<0?`decrease`:`zero`}">${e.qty>0?`+`:``}${q(e.qty)}</td>
      <td>${q(e.before??`-`)} → <b>${q(e.after??`-`)}</b></td>
      <td>${q(e.staffName||`-`)}</td><td>${q(v(e.note||e.reason||`-`,`eggLogs`,t,e=>e.type===`in`?`입고`:e.type===`out`?`출고`:`수동조정`))}</td>
    </tr>`).join(``):`<tr><td colspan="5" class="egg-empty-records">최근 조회한 이력에 오늘 기록이 없습니다.</td></tr>`;let i=document.getElementById(`eggTodayPaging`);i.innerHTML=e.length>5?`<button type="button" class="btn-secondary" data-egg-prev ${n===0?`disabled`:``}>이전</button><span>${n+1} / ${Math.ceil(e.length/5)}</span><button type="button" class="btn-secondary" data-egg-next ${(n+1)*5>=e.length?`disabled`:``}>다음</button>`:``,i.querySelector(`[data-egg-prev]`)?.addEventListener(`click`,()=>{n--,r()}),i.querySelector(`[data-egg-next]`)?.addEventListener(`click`,()=>{n++,r()})};r()}function B(e){let n=document.getElementById(`eggEntryHost`),r=N===`in`,i=Number(e.currentQty||0);n.innerHTML=`<div class="egg-entry-heading"><h3 id="eggEntryTitle">오늘 입력</h3><div class="egg-entry-tabs" role="group" aria-label="입력 종류">
    <button type="button" data-egg-mode="out" aria-pressed="${!r}">사용 기록</button><button type="button" data-egg-mode="in" aria-pressed="${r}">입고 기록</button>
  </div></div>
  <form class="egg-entry-form">
    <div class="egg-entry-fields">
      <div class="form-group"><label for="eggEntryQty">이번 ${r?`입고량`:`사용량`} (개) *</label><input id="eggEntryQty" type="number" min="1" step="1" inputmode="numeric" placeholder="개수 입력" autocomplete="off" required></div>
      <div class="form-group"><label for="eggEntryDate">기록 날짜 *</label><input id="eggEntryDate" type="date" value="${q(F||u())}" required></div>
      <div class="form-group"><label for="eggEntryStaff">담당자 *</label><select id="eggEntryStaff" required><option value="">담당자 선택</option>${Z([`senior`,`office`])}</select></div>
    </div>
    <p class="egg-entry-help">${r?`실제로 들어온 개수만 입력`:`이미 기록한 수량을 제외하고, 추가로 사용한 개수만 입력`}</p>
    <div class="egg-entry-savebar"><div id="eggEntryPreview" aria-live="polite"></div><button type="submit" class="btn-primary" id="btnSaveEggEntry">${r?`입고`:`사용`} 기록 저장</button></div>
    <details class="egg-entry-note"><summary>비고 추가 (선택)</summary><div class="form-group"><label for="eggEntryNote">비고</label><input id="eggEntryNote" maxlength="200" placeholder="필요한 경우에만 입력해주세요"></div></details>
  </form>`;let a=n.querySelector(`form`),c=document.getElementById(`eggEntryQty`),p=document.getElementById(`eggEntryDate`),m=document.getElementById(`eggEntryStaff`),h=document.getElementById(`eggEntryNote`),g=document.getElementById(`btnSaveEggEntry`);[...m.options].some(e=>e.value===P)&&(m.value=P);let v=t(o(s,`eggLogs`)).id,y=!1,b=()=>{let t=Number(c.value),n=i+(r?t:-t),a=c.value!==``&&Number.isInteger(t)&&t>0&&n>=0;document.getElementById(`eggEntryTitle`).textContent=p.value===u()?`오늘 입력`:`기록 입력`,document.getElementById(`eggEntryPreview`).innerHTML=`<span>저장 후 현재 재고</span><div>${q(K(i))} → <strong>${a?q(K(n)):`—`}</strong></div>${c.value!==``&&!a?`<small class="egg-entry-warning">수량을 확인해주세요.</small>`:a&&n<Number(e.minimumQty||0)?`<small class="egg-entry-warning">최소재고 미만</small>`:``}`,g.disabled=y||!a||!p.value||!m.value};for(let e of[c,p,m])e.addEventListener(`input`,b),e.addEventListener(`change`,b);for(let t of n.querySelectorAll(`[data-egg-mode]`))t.addEventListener(`click`,async()=>{if(y||t.dataset.eggMode===N)return;let r=l();!await d()||r&&!r.isCurrent()||!n.isConnected||(P=m.value,F=p.value,N=t.dataset.eggMode,B(e))});let x=async t=>{if(t.preventDefault(),y||g.disabled)return;y=!0,b();let i=[...n.querySelectorAll(`input,select,button`),...document.querySelectorAll(`.egg-page-actions button,#btnSetMinEgg`)];i.forEach(e=>e.disabled=!0);try{await A(()=>Y({type:N,eggStock:e,selection:{kind:r?`receipt`:`usage`,reason:_(r?`receipt`:`usage`,h.value),cancelOf:null,operationId:v},qtyValue:Number(c.value).toLocaleString(`en-US`,{useGrouping:!1,maximumFractionDigits:0}),date:p.value,staff:m.value,note:h.value,onSaved:()=>{P=m.value,F=p.value}}))}finally{y=!1,a.isConnected&&(i.forEach(e=>e.disabled=!1),b())}};a.addEventListener(`submit`,x),g.addEventListener(`click`,x),b(),f(a)}function V(e,t){let n=[],r=0;for(let t of U(e)){let e=Number(t.qty||0);if(e){if(t.type===`in`||t.type===`adjust`&&e>0){n.push({id:t.id||`${t.date||``}-${n.length}`,date:t.date||`-`,staffName:t.staffName||`-`,source:t.type===`adjust`?`조정`:`입고`,initialQty:e,remainingQty:e,order:n.length});continue}if(t.type===`out`||e<0){let t=Math.abs(e);for(let e of n){if(t<=0)break;if(e.remainingQty<=0)continue;let n=Math.min(e.remainingQty,t);e.remainingQty-=n,t-=n}r+=t}}}let i=n.filter(e=>e.remainingQty>0),a=i.reduce((e,t)=>e+t.remainingQty,0);return{lots:i,fifoTotalQty:a,currentQty:t,diffQty:a-t,unallocatedOutQty:r}}function H(e,t){let n=e.diffQty===0,r=e.lots.length===0?`<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>`:e.lots.map((t,n)=>`
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${n===e.lots.length-1?`└`:`├`}</span>
          <span class="egg-fifo-date">${q(t.date)}</span>
          <span class="egg-fifo-staff">${q(t.staffName)}</span>
          <span class="egg-fifo-source">${t.source}</span>
          <span class="egg-fifo-qty">+${K(t.initialQty)} → ${K(t.remainingQty)} 남음</span>
        </div>
      `).join(``),i=n?``:`<div class="egg-fifo-warning">FIFO 분해 합계 ${K(e.fifoTotalQty)} / 현재 재고 ${K(t)}로 ${K(Math.abs(e.diffQty))} 차이가 있습니다.</div>`,a=e.unallocatedOutQty>0?`<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${K(e.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`:``;return`
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${r}
      <div class="egg-fifo-total">분해 합계 ${K(e.fifoTotalQty)} / 현재 재고 ${K(t)}</div>
      ${i}
      ${a}
    </div>
  `}function U(e){return[...e].sort((e,t)=>{let n=G(e)-G(t);return n===0?String(e.id||``).localeCompare(String(t.id||``)):n})}function W(e){return[...e].sort((e,t)=>{let n=G(t)-G(e);return n===0?String(t.id||``).localeCompare(String(e.id||``)):n})}function G(e){let t=e.timestamp;if(t?.toMillis)return t.toMillis();if(t instanceof Date)return t.getTime();if(typeof t==`number`)return t;let n=Date.parse(e.date||``);return Number.isFinite(n)?n:0}function K(e){return`${Number(e||0).toLocaleString()}개`}function q(e){return String(e??``).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#39;`)}function J(e,t){let n=e===`in`,r=Number(t.currentQty||0),i=n?`
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
  `;if(Q(`
    <h3 class="modal-title">계란 ${n?`입고`:`출고`}</h3>
    ${x({incoming:n,allowed:n?[`receipt`,`test`]:[`usage`,`reconciliation`,`test`],defaultKind:n?`receipt`:`usage`,reasonField:!1})}
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
        ${Z([`senior`,`office`])}
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
  `),!n){let e=document.getElementById(`movement_kind`),t=()=>{let t=e.value===`usage`;for(let[e,n]of[[`m_usageGroup`,t],[`m_remainingGroup`,!t]]){let t=document.getElementById(e);t.hidden=!n,t.style.display=n?`block`:`none`}let n=Number(document.getElementById(t?`m_usageQty`:`m_remaining`).value),i=document.getElementById(t?`m_usageQty`:`m_remaining`).value===``,a=t?r-n:n;document.getElementById(`m_outPreview`).textContent=i?`출고량: -`:a<0||a>r?`수량을 확인해주세요`:`사용량: ${r-a}개 · 남은 재고: ${a}개`};e.addEventListener(`change`,t),document.getElementById(`m_usageQty`).addEventListener(`input`,t),document.getElementById(`m_remaining`).addEventListener(`input`,t)}let a=C({db:s,name:`eggLogs`,filter:{},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e);let t=document.getElementById(`m_adjustType`);t&&(t.value=e>0?`plus`:`minus`)},reasonInput:document.getElementById(`m_note`)});document.getElementById(`btnSaveEgg`).addEventListener(`click`,()=>A(async()=>{let r=S(a);if(r)return Y({type:e,eggStock:t,selection:r,qtyValue:document.getElementById(n?`m_qty`:`m_usageQty`)?.value,remainingValue:document.getElementById(`m_remaining`)?.value,date:document.getElementById(`m_date`).value,staff:document.getElementById(`m_staff`).value,note:document.getElementById(`m_note`).value})}))}async function Y({type:e,eggStock:t,selection:n,qtyValue:r,remainingValue:i,date:a,staff:o,note:s,onSaved:c}){let u=e===`in`,d=Number(t.currentQty||0),f=l(),p;if(u){if(p=parseInt(r),!p){alert(`수량을 입력해주세요.`);return}}else if(n.kind===`usage`){if(p=Number(r),!Number.isInteger(p)||p<=0){alert(`사용량은 1 이상의 정수로 입력해주세요.`);return}if(p>d){alert(`사용량이 현재 재고(${d}개)보다 많을 수 없습니다.`);return}}else{let e=parseInt(i);if(isNaN(e)||e<0){alert(`남은 재고를 입력해주세요.`);return}if(e>d){alert(`남은 재고가 현재 재고(${d}개)보다 많을 수 없습니다.`);return}if(p=d-e,p===0){alert(`변동이 없습니다. (출고량 0개)`);return}}if(!a){alert(`날짜는 필수입니다.`);return}if(!o){alert(`담당자는 필수입니다.`);return}if(await T(a)||f&&!f.isCurrent())return;let m=u?p:-p,h=n.kind===`test`?{approved:!0}:await w({itemId:`eggLogs:egg`,name:`계란`,date:a,qty:p,unit:`개`,stage:u?`계란`:`계란 출고`,direction:u?`supply`:`usage`},()=>!f||f.isCurrent());if(!h.approved||f&&!f.isCurrent())return;let g=t.currentQty,_=g+m;await k(t,{currentQty:_,minimumQty:t.minimumQty,updatedAt:new Date},{date:a,timestamp:new Date,type:u?`in`:`out`,...h.review?{statsQuantityReview:h.review}:{},qty:m,before:g,after:_,staffName:o,note:s},{action:`egg`,subAction:u?`in`:`out`,date:a,staff:o,message:`계란 ${u?`입고`:`출고`} — ${u?`+`:`-`}${p}개 / 담당: ${o}`,details:{delta:m,before:g,after:_,note:s||null}},a,n)&&(f&&!f.isCurrent()||(c?c():closeModal(),await I({force:!0}),y(`${u?`입고`:`출고`} 완료!`)))}function ne(e){Q(`
    <h3 class="modal-title">수동 재고 조정</h3>
    ${x({reasonField:!1})}
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${q(e.currentQty)}개</p>
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
        ${Z([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);let t=C({db:s,name:`eggLogs`,filter:{},onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e);let t=document.getElementById(`m_adjustType`);t&&(t.value=e>0?`plus`:`minus`)},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveAdjust`).addEventListener(`click`,()=>A(async()=>{let n=l(),r=S(t);if(!r)return;let i=document.getElementById(`m_adjustType`).value,a=parseInt(document.getElementById(`m_qty`).value),o=r.reason,s=document.getElementById(`m_staff`).value;if(!a||!s){alert(`조정량과 담당자는 필수입니다.`);return}let c=u();if(await T(c))return;let d=i===`plus`?a:-a,f=e.currentQty,p=f+d;if(p<0&&r.kind!==`test`){alert(`조정 후 잔량이 ${p}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${f}개에서 최대 ${f}개까지만 감소 가능합니다.`);return}await k(e,{currentQty:p,minimumQty:e.minimumQty,updatedAt:new Date},{date:u(),timestamp:new Date,type:`adjust`,qty:d,before:f,after:p,staffName:s,reason:o},{action:`egg`,subAction:`adjust`,date:c,staff:s,message:`계란 수동조정 — ${d>=0?`+`:``}${d}개 / 사유: ${o} / 담당: ${s}`,details:{delta:d,before:f,after:p,reason:o}},c,r)&&(n&&!n.isCurrent()||(closeModal(),await I({force:!0}),y(`조정 완료!`)))}))}function re(e){Q(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${q(e.minimumQty||0)}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `),document.getElementById(`btnSaveMin`).addEventListener(`click`,()=>A(async()=>{let t=l(),n=parseInt(document.getElementById(`m_minQty`).value)||0;await k(e,{currentQty:e.currentQty,minimumQty:n,updatedAt:new Date})&&(t&&!t.isCurrent()||(closeModal(),await I({force:!0}),alert(`설정 완료!`)))}))}var X={};function Z(e){let t=``;for(let n of e)(X[n]||[]).forEach(e=>{t+=`<option value="${q(e.name)}">${q(e.name)}</option>`});return t}function Q(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n),n.addEventListener(`click`,e=>{})}c(`egg`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function $(e){let[n,r,...i]=await Promise.all([L(e),R(e),...[`senior`,`lead`,`office`].map(n=>e.getDoc(t(s,`staffGroups`,n)))]);return{stock:n,logs:r,staff:Object.fromEntries([`senior`,`lead`,`office`].map((e,t)=>[e,i[t].exists()&&i[t].data().members||[]]))}}function ie({cacheOnly:e=!0}={}){return O.prepare?.(`default`,$,{cacheOnly:e})}export{ie as preparePage,I as renderEgg};