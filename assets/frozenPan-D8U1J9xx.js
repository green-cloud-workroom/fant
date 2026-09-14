import{a as e,c as t,f as n,g as r,h as i,i as a,m as o,n as s,s as c}from"./index.esm-Cf9DaHbi.js";import{n as l}from"./firebase-BQPCO7kq.js";import{h as u,j as d,m as f,w as p}from"./index-CMgkQ4he.js";import{n as m}from"./activityLogs-Mn_dgBRB.js";import{t as h}from"./closingGuard-CS1p4aoM.js";import{renderFreezeOpInTab as g}from"./freezeOp-CzOy4BML.js";import{t as _}from"./recipe--2Kq0z71.js";import{i as v,n as y,t as b}from"./number-Cbi_r2jv.js";var x=[],S=`breadPan`;async function C(){let e=document.getElementById(`mainContent`);e.innerHTML=`<div style="padding:24px;"><p>동결판 재고 로딩 중...</p></div>`;let[t]=await Promise.all([_(),Z()]);e.isConnected&&(x=t,S=`breadPan`,await k())}async function w(){return(await e(t(i(l,`frozenPanStock`),c(`date`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}async function T(){return(await e(i(l,`frozenPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed&&Number(e.remaining||0)>0)}async function E(){return(await e(i(l,`breadPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>!e.closed)}async function D(){return(await e(t(i(l,`breadPanLogs`),c(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}async function O(){return(await e(t(i(l,`frozenPanLogs`),c(`timestamp`,`desc`)))).docs.map(e=>({id:e.id,...e.data()}))}async function k(){let e=document.getElementById(`mainContent`),[t,n,r,i,a]=await Promise.all([w(),T(),E(),D(),O()]);e?.isConnected&&A(t,n,r,i,a)}function A(e,t,n,r,i){let a=document.getElementById(`mainContent`);e=e.filter(e=>e.type!==`work`);let o={};t.forEach(e=>{o[e.productName]||(o[e.productName]=[]),o[e.productName].push({date:e.date,remaining:e.remaining,source:e.source||null})});let s={};n.forEach(e=>{s[e.productName]||(s[e.productName]=[]),s[e.productName].push({date:e.date,remaining:e.remaining})});let c=v(n.reduce((e,t)=>e+(t.remaining||0),0)),l=y(c),u=t.reduce((e,t)=>e+(t.remaining||0),0);a.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결판 재고</h2>
      </div>

      <!-- 합계 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 빵판</span>
            <span class="stat-value" style="font-size:20px;color:#1a1a1a">${c}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">실리콘 환산</span>
            <span class="stat-value" style="font-size:14px;color:#888">${l}판</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">현재 총 동결판</span>
            <span class="stat-value" style="font-size:20px;color:${u<10?`#e53e3e`:`#1a1a1a`}">${u}판</span>
          </div>
        </div>
      </div>

      <!-- 탭 nav -->
      <div class="tab-nav" style="display:flex;gap:0;border-bottom:2px solid #e8e8e8;margin-bottom:16px;">
        <button class="tab-btn" data-tab="breadPan"
          style="padding:10px 20px;background:${S===`breadPan`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${S===`breadPan`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${S===`breadPan`?`600`:`400`};color:${S===`breadPan`?`#1a1a1a`:`#888`};">
          빵판 재고
        </button>
        <button class="tab-btn" data-tab="frozenPan"
          style="padding:10px 20px;background:${S===`frozenPan`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${S===`frozenPan`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${S===`frozenPan`?`600`:`400`};color:${S===`frozenPan`?`#1a1a1a`:`#888`};">
          동결판 재고
        </button>
        <button class="tab-btn" data-tab="freezeOp"
          style="padding:10px 20px;background:${S===`freezeOp`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${S===`freezeOp`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${S===`freezeOp`?`600`:`400`};color:${S===`freezeOp`?`#1a1a1a`:`#888`};">
          동결가동
        </button>
      </div>

      <!-- 탭 콘텐츠 -->
      ${S===`breadPan`?M(s,r):S===`frozenPan`?P(e,o,i):`<div id="freezeOpContent" style="padding:4px 0;">로딩 중...</div>`}
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(a=>{a.addEventListener(`click`,()=>{S=a.dataset.tab,A(e,t,n,r,i)})}),S===`breadPan`?te(e,t):S===`frozenPan`?F(e,t):g()}function j(e){if(!e)return``;let t={tenderIn:{label:`텐더`,color:`#1f6fb2`,bg:`#e8f3fc`},preprocess:{label:`전처리`,color:`#2d7a3a`,bg:`#e8f5ea`},adjust:{label:`조정`,color:`#b97a1f`,bg:`#fdf3e0`}}[e];return t?`<span style="display:inline-block;font-size:10px;background:${t.bg};color:${t.color};padding:1px 6px;border-radius:3px;margin-left:4px;font-weight:500;vertical-align:middle;">${t.label}</span>`:``}function M(e,t){let n=Object.entries(e);return`
    <div class="page-header" style="margin-bottom:12px;">
      <span style="font-size:14px;color:#555;font-weight:600;">빵판 lot 잔량</span>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" id="btnBreadPanAdjust">+ 수동 조정</button>
        <button class="btn-secondary" id="btnAddWorkRow">+ 작업 행 추가</button>
        <button class="btn-primary" id="btnBreadPanIncoming">+ 빵판 입고</button>
      </div>
    </div>

    <!-- 빵판 lot 잔량 -->
    <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
      ${n.length===0?`<div style="color:#aaa;text-align:center;padding:8px;">빵판 lot 없음</div>`:`
        <div class="stat-row">
          ${n.map(([e,t])=>`
            <div class="stat-item">
              <span class="stat-label">${e}</span>
              <div>
                ${t.sort((e,t)=>e.date.localeCompare(t.date)).map(e=>`
                  <div style="font-size:12px;color:#555">${v(e.remaining)}개 <span style="color:#aaa">(${e.date})</span></div>
                `).join(``)}
              </div>
            </div>
          `).join(``)}
        </div>
      `}
    </div>

    <!-- 빵판 이력 -->
    <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>구분</th>
            <th>제품</th>
            <th>수량</th>
            <th>담당자</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          ${t.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:t.map(e=>N(e)).join(``)}
        </tbody>
      </table>
    </div>
  `}function N(e){let t={incoming:`입고`,preprocess:`전처리`,adjust:`수동조정`,rollback:`롤백`}[e.type]||e.type,n={incoming:`tag-raw`,preprocess:``,adjust:`tag-cat`,rollback:`tag-cat`}[e.type]||``,r=e.qty>0?`#2d7a3a`:`#e53e3e`,i=e.qty>0?`+`:``,a=`-`;if(e.type===`preprocess`&&e.expectedFrozenQty!=null&&e.actualFrozenQty!=null){let t=e.diff>0?`+${e.diff}`:e.diff<0?`${e.diff}`:`0`;a=`이론 ${e.expectedFrozenQty} / 실측 ${e.actualFrozenQty} (차 ${t})`}else e.note?a=e.note:e.reason&&(a=e.reason);let o=e.lotDate&&e.type!==`incoming`?`<span style="font-size:11px;color:#999;margin-left:4px;">(입고 ${e.lotDate})</span>`:``;return`
    <tr>
      <td>${e.date||`-`}</td>
      <td><span class="tag ${n}" style="${e.type===`preprocess`?`background:#f0f0f0;color:#666`:``}">${t}</span></td>
      <td>${e.productName||`-`}${o}</td>
      <td style="color:${r};font-weight:500;">${i}${e.qty||0}개</td>
      <td>${e.staffName||`-`}</td>
      <td style="font-size:12px;color:#666;">${a}</td>
    </tr>
  `}function P(e,t,n){let r=Object.entries(t);return`
    <div class="page-header" style="margin-bottom:12px;">
      <span style="font-size:14px;color:#555;font-weight:600;">동결판 lot 잔량</span>
      <div style="display:flex;gap:8px;">
        <button class="btn-secondary" id="btnFrozenPanAdjust">+ 수동 조정</button>
        <button class="btn-primary" id="btnTenderIn">+ 텐더동결 입고</button>
      </div>
    </div>

    <!-- 동결판 lot 잔량 -->
    <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
      ${r.length===0?`<div style="color:#aaa;text-align:center;padding:8px;">동결판 lot 없음</div>`:`
        <div class="stat-row">
          ${r.map(([e,t])=>`
            <div class="stat-item">
              <span class="stat-label">${e}</span>
              <div>
                ${t.sort((e,t)=>e.date.localeCompare(t.date)).map(e=>`
                  <div style="font-size:12px;color:#555">${e.remaining}판 <span style="color:#aaa">(${e.date})</span>${j(e.source)}</div>
                `).join(``)}
              </div>
            </div>
          `).join(``)}
        </div>
      `}
    </div>

    <!-- 발주 테이블 -->
    <div style="font-size:14px;color:#555;font-weight:600;margin-bottom:8px;">발주 내역</div>
    <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>구분</th>
            <th>담당자</th>
            <th>내용</th>
            <th>상태</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${e.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">발주 내역 없음</td></tr>`:e.map(e=>B(e)).join(``)}
        </tbody>
      </table>
    </div>

    <!-- 동결판 이력 -->
    <div style="font-size:14px;color:#555;font-weight:600;margin-bottom:8px;">동결판 이력</div>
    <div class="table-wrap" style="background:white;border-radius:8px;border:1px solid #e8e8e8;overflow:hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>구분</th>
            <th>제품</th>
            <th>수량</th>
            <th>담당자</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          ${n.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:n.map(e=>ee(e)).join(``)}
        </tbody>
      </table>
    </div>
  `}function ee(e){let t={tenderIn:`텐더동결 입고`,preprocess:`전처리 입고`,orderDeduct:`발주 차감`,orderRollback:`발주 복원`,adjust:`수동조정`}[e.type]||e.type,n={tenderIn:`tag-raw`,preprocess:`tag-raw`,orderDeduct:``,orderRollback:`tag-cat`,adjust:`tag-cat`}[e.type]||``,r=e.qty>0?`#2d7a3a`:`#e53e3e`,i=e.qty>0?`+`:``,a=`-`;return e.note?a=e.note:e.reason&&(a=e.reason),`
    <tr>
      <td>${e.date||`-`}</td>
      <td><span class="tag ${n}" style="${e.type===`orderDeduct`?`background:#f0f0f0;color:#666`:``}">${t}</span></td>
      <td>${e.productName||`-`}</td>
      <td style="color:${r};font-weight:500;">${i}${e.qty||0}판</td>
      <td>${e.staffName||`-`}</td>
      <td style="font-size:12px;color:#666;">${a}</td>
    </tr>
  `}function te(e,t){let n=document.getElementById(`btnBreadPanIncoming`);n&&n.addEventListener(`click`,()=>L());let r=document.getElementById(`btnBreadPanAdjust`);r&&r.addEventListener(`click`,()=>R());let i=document.getElementById(`btnAddWorkRow`);i&&i.addEventListener(`click`,()=>V(e,t))}function F(e,t){let i=document.getElementById(`btnTenderIn`);i&&i.addEventListener(`click`,()=>I());let a=document.getElementById(`btnFrozenPanAdjust`);a&&a.addEventListener(`click`,()=>z()),document.querySelectorAll(`.btn-order-confirm`).forEach(n=>{n.addEventListener(`click`,async()=>{let r=n.dataset.id,i=e.find(e=>e.id===r);if(!i||await h(i.date))return;let a=await Y({title:`발주 확인 — 담당자 선택`,message:`발주 확인을 진행할 담당자를 선택해주세요.`,groups:[`senior`,`office`]});a&&await q(i,t,a)})}),document.querySelectorAll(`.btn-order-delete`).forEach(t=>{t.addEventListener(`click`,async()=>{if(!await f({title:`발주 행 삭제`,message:`발주 행을 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))return;let i=e.find(e=>e.id===t.dataset.id);i&&await h(i.date)||(await n(r(l,`frozenPanStock`,t.dataset.id),{status:`cancelled`}),await k())})}),document.querySelectorAll(`.btn-order-cancel`).forEach(n=>{n.addEventListener(`click`,async()=>{if(!await f({title:`발주 확인 취소`,message:`발주 확인을 취소하시겠습니까?
차감된 동결판 재고가 복원됩니다.`,confirmText:`확인`,danger:!0}))return;let r=n.dataset.id,i=e.find(e=>e.id===r);if(!i||await h(i.date))return;let a=await Y({title:`발주 취소 — 담당자 선택`,message:`발주 취소를 진행할 담당자를 선택해주세요.`,groups:[`senior`,`office`]});a&&await J(i,t,a)})})}function I(){let e=x.filter(e=>e.requiresSeparation!==!0);if(e.length===0){alert(`동결텐더 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 끈 레시피를 추가해주세요.`);return}$(`
    <h3 class="modal-title">텐더동결 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>제품 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${e.map(e=>`<option value="${e.displayName}">${e.displayName}</option>`).join(``)}
        </select>
      </div>
      <div class="form-group">
        <label>동결판 수 *</label>
        <input type="number" id="m_qty" step="1" min="1" placeholder="예: 5" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${p()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Q([`senior`,`office`])}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveTenderIn">저장</button>
    </div>
  `),document.getElementById(`btnSaveTenderIn`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_recipe`).value.trim(),t=parseInt(document.getElementById(`m_qty`).value)||0,a=document.getElementById(`m_date`).value,o=document.getElementById(`m_staff`).value,c=document.getElementById(`m_note`).value.trim();if(!e){alert(`제품을 선택해주세요.`);return}if(t<=0){alert(`동결판 수는 0보다 커야 합니다.`);return}if(!a){alert(`날짜를 입력해주세요.`);return}if(!o){alert(`담당자를 선택해주세요.`);return}if(await h(a))return;let u=new Date;try{let d=await s(i(l,`frozenPanLots`),{productName:e,date:a,staffName:o,initialQty:t,remaining:t,closed:!1,source:`tenderIn`,sourceRefId:null,note:c||null,createdAt:u,updatedAt:u}),f=await s(i(l,`frozenPanLogs`),{type:`tenderIn`,date:a,productName:e,qty:t,before:0,after:t,lotId:d.id,staffName:o,uid:null,note:c||null,reason:null,batchId:null,ledgerId:null,timestamp:u});await n(r(l,`frozenPanLots`,d.id),{sourceRefId:f.id}),await s(i(l,`stockLedger`),{actionType:`frozenPanTenderIn`,actionId:f.id,timestamp:u,date:a,status:`active`,items:[{collection:`frozenPanLots`,docId:d.id,field:`remaining`,delta:t,before:0,after:t,label:`${e} 동결판 (텐더동결 입고)`,stockUpdatedAtSnapshot:u,isNewDoc:!0}]}),closeModal(),await k(),alert(`텐더동결 입고 완료!`)}catch(e){console.error(`showTenderInModal 저장 에러:`,e),alert(`저장 중 오류가 발생했습니다.\n\n${e.message}`)}})}function L(){let e=x.filter(e=>e.requiresSeparation===!0);if(e.length===0){alert(`동결생식 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.`);return}$(`
    <h3 class="modal-title">빵판 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>레시피 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${e.map(e=>`<option value="${e.displayName}">${e.displayName}</option>`).join(``)}
        </select>
      </div>
      <div class="form-group">
        <label>빵판 수 * (소수 2자리)</label>
        <input type="number" id="m_qty" step="0.01" min="0.01" placeholder="예: 4.5" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>날짜</label>
        <input type="date" id="m_date" value="${p()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Q([`senior`,`office`])}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanIncoming">저장</button>
    </div>
  `),document.getElementById(`btnSaveBreadPanIncoming`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_recipe`).value.trim(),t=v(parseFloat(document.getElementById(`m_qty`).value)||0),n=document.getElementById(`m_date`).value,r=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value.trim();if(!e){alert(`레시피를 선택해주세요.`);return}if(t<=0){alert(`빵판 수는 0보다 커야 합니다.`);return}if(!n){alert(`날짜를 입력해주세요.`);return}if(!r){alert(`담당자를 선택해주세요.`);return}if(await h(n))return;let o=new Date,c=await s(i(l,`breadPanLots`),{productName:e,date:n,staffName:r,initialQty:t,remaining:t,closed:!1,note:a||null,createdAt:o,updatedAt:o});await s(i(l,`breadPanLogs`),{type:`incoming`,date:n,productName:e,qty:t,before:0,after:t,lotId:c.id,lotDate:n,expectedFrozenQty:null,actualFrozenQty:null,diff:null,staffName:r,uid:null,note:a||null,reason:null,batchId:null,ledgerId:null,timestamp:o}),closeModal(),await k(),alert(`빵판 입고 완료!`)})}async function R(){let e=await E();if(e.length===0){alert(`조정할 빵판 lot이 없습니다.
빵판 입고를 먼저 진행해주세요.`);return}$(`
    <h3 class="modal-title">빵판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${e.sort((e,t)=>{let n=e.productName.localeCompare(t.productName);return n===0?e.date.localeCompare(t.date):n}).map(e=>`<option value="${e.id}">${e.productName} / ${e.date} / 잔량 ${e.remaining}개</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형 *</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량 * (소수 2자리)</label>
        <input type="number" id="m_qty" step="0.01" min="0.01" placeholder="예: 0.5" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="예: 실측 차이 보정 / 분실" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanAdjust">저장</button>
    </div>
  `),document.getElementById(`btnSaveBreadPanAdjust`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_lot`).value,t=document.getElementById(`m_adjustType`).value,o=v(parseFloat(document.getElementById(`m_qty`).value)||0),c=document.getElementById(`m_reason`).value.trim(),u=document.getElementById(`m_staff`).value;if(!e){alert(`대상 lot을 선택해주세요.`);return}if(o<=0){alert(`수량은 0보다 커야 합니다.`);return}if(!c){alert(`사유를 입력해주세요.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}let d=t===`plus`?o:-o,f=await a(r(l,`breadPanLots`,e));if(!f.exists()){alert(`lot을 찾을 수 없습니다.`);return}let m=f.data();if(m.date,await h(p()))return;let g=m.remaining||0,_=v(g+d);if(_<0){alert(`조정 후 잔량이 ${_}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${g}개에서 최대 ${g}개까지만 감소 가능합니다.`);return}let y=new Date,b=p();await n(r(l,`breadPanLots`,e),{remaining:_,closed:_<=.005,updatedAt:y}),await s(i(l,`breadPanLogs`),{type:`adjust`,date:b,productName:m.productName,qty:d,before:g,after:_,lotId:e,lotDate:m.date,expectedFrozenQty:null,actualFrozenQty:null,diff:null,staffName:u,uid:null,note:null,reason:c,batchId:null,ledgerId:null,timestamp:y}),closeModal(),await k(),alert(`수동 조정 완료!`)})}async function z(){let e=await T();if(e.length===0){alert(`조정할 동결판 lot이 없습니다.
동결판 입고를 먼저 진행해주세요.`);return}$(`
    <h3 class="modal-title">동결판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${e.sort((e,t)=>{let n=e.productName.localeCompare(t.productName);return n===0?e.date.localeCompare(t.date):n}).map(e=>`<option value="${e.id}">${e.productName} / ${e.date} / 잔량 ${e.remaining}개</option>`).join(``)}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형 *</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>수량 * (정수)</label>
        <input type="number" id="m_qty" step="1" min="1" placeholder="예: 5" />
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_reason" placeholder="예: 실측 차이 보정 / 분실" />
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${Q([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozenPanAdjust">저장</button>
    </div>
  `),document.getElementById(`btnSaveFrozenPanAdjust`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_lot`).value,t=document.getElementById(`m_adjustType`).value,n=parseInt(document.getElementById(`m_qty`).value,10),s=document.getElementById(`m_reason`).value.trim(),c=document.getElementById(`m_staff`).value;if(!e){alert(`대상 lot을 선택해주세요.`);return}if(!Number.isInteger(n)||n<=0){alert(`수량은 0보다 큰 정수여야 합니다.`);return}if(!s){alert(`사유를 입력해주세요.`);return}if(!c){alert(`담당자를 선택해주세요.`);return}let u=t===`plus`?n:-n,d=await a(r(l,`frozenPanLots`,e));if(!d.exists()){alert(`lot을 찾을 수 없습니다.`);return}let f=d.data();if(await h(p()))return;let m=Number(f.remaining||0),g=m+u;if(g<0){alert(`조정 후 잔량이 ${g}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${m}개에서 최대 ${m}개까지만 감소 가능합니다.`);return}let _=new Date,v=p(),y=o(l);y.update(r(l,`frozenPanLots`,e),{remaining:g,closed:g<=0,updatedAt:_}),y.set(r(i(l,`frozenPanLogs`)),{type:`adjust`,date:v,productName:f.productName,qty:u,before:m,after:g,lotId:e,staffName:c,uid:null,note:null,reason:s,batchId:null,ledgerId:null,timestamp:_}),await y.commit(),closeModal(),await k(),alert(`수동 조정 완료!`)})}function B(e){if(e.status===`cancelled`)return``;let t=d===`admin`||d===`office`,n=e.status===`confirmed`,r=(e.items||[]).reduce((e,t)=>e+(t.orderPanQty||0),0),i=r===45?`#2d7a3a`:r>45?`#e53e3e`:`#e67e22`,a=`
    ${(e.items||[]).map(e=>`<span style="font-size:11px;margin-right:8px">${e.productName}: ${e.orderPanQty}판</span>`).join(``)}
    <span style="font-weight:600;color:${i}">총 ${r}판</span>
  `,o=``;return o=n?t?`<button class="btn-secondary btn-order-cancel" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">발주 취소</button>`:``:`
      <button class="btn-primary btn-order-confirm" data-id="${e.id}" style="font-size:11px;padding:3px 10px;">발주 확인</button>
      <button class="btn-del-row btn-order-delete" data-id="${e.id}">삭제</button>
    `,`
    <tr style="background:#fffdf0">
      <td>${e.date}</td>
      <td><span class="tag tag-cat">발주</span></td>
      <td>${e.staffName||`-`}</td>
      <td>${a}</td>
      <td>
        ${n?`<span style="color:#2d7a3a;font-size:12px">✅ 확인완료</span>`:`<span style="color:#e67e22;font-size:12px">⏳ 대기중</span>`}
      </td>
      <td style="white-space:nowrap">${o}</td>
    </tr>
  `}async function V(e,t){let n=await E(),r=x.filter(e=>e.requiresSeparation===!0);if(r.length===0){alert(`동결생식 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.`);return}let i={};r.forEach(e=>{let t=n.filter(t=>t.productName===e.displayName&&t.remaining>.005).sort((e,t)=>e.date.localeCompare(t.date)),r=v(t.reduce((e,t)=>e+t.remaining,0)),a=t.length>0?t[0].remaining:0;i[e.displayName]={total:r,oldestRemaining:a}}),$(`
    <h3 class="modal-title">작업 행 추가 (빵판 → 동결판 전처리)</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜 *</label>
        <input type="date" id="m_date" value="${p()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${Q([`senior`,`office`])}
        </select>
      </div>
    </div>

    <div style="font-size:12px;color:#666;background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:12px;">
      <strong>환산</strong>: 빵판 1개 → 동결판 4/9개 (≈0.44)<br>
      <strong>FIFO 적용</strong>: 같은 제품에 여러 lot이 있으면 오래된 lot부터 차감됩니다.<br>
      <strong>실측</strong>: 이론값과 실제 산출 동결판 수가 다르면 차이가 별도 기록됩니다.
    </div>

    <div id="workItems">
      ${U(r,i)}
    </div>
    <button class="btn-secondary" id="btnAddWorkItem" style="margin-bottom:16px;">+ 제품 추가</button>

    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="(선택)" />
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveWorkRow">저장</button>
    </div>
  `),W(i),G(),document.getElementById(`btnAddWorkItem`).addEventListener(`click`,()=>{document.getElementById(`workItems`).insertAdjacentHTML(`beforeend`,U(r,i)),W(i),G()}),document.getElementById(`btnSaveWorkRow`).addEventListener(`click`,async()=>{await H()})}async function H(){let e=document.getElementById(`m_date`).value,t=document.getElementById(`m_staff`).value,a=document.getElementById(`m_note`).value.trim(),o=Array.from(document.querySelectorAll(`.work-item`)).map(e=>({productName:e.querySelector(`.wi-name`).value.trim(),breadPanQty:v(parseFloat(e.querySelector(`.wi-bread`).value)||0),actualFrozenQty:parseInt(e.querySelector(`.wi-actual`).value)||0})).filter(e=>e.productName);if(!e){alert(`날짜를 입력해주세요.`);return}if(!t){alert(`담당자를 선택해주세요.`);return}if(o.length===0){alert(`제품을 1개 이상 입력해주세요.`);return}for(let e of o){if(e.breadPanQty<=0){alert(`${e.productName}: 출고 빵판 수가 입력되지 않았습니다.`);return}if(e.actualFrozenQty<=0){alert(`${e.productName}: 실제 산출 동결판 수가 입력되지 않았습니다.`);return}}if(await h(e))return;let c=await E(),u=[];for(let e of o){let t=v(c.filter(t=>t.productName===e.productName).reduce((e,t)=>e+t.remaining,0));e.breadPanQty>t&&u.push(`${e.productName}: 잔량 ${t}개 / 요청 ${e.breadPanQty}개`)}if(u.length>0){alert(`빵판 재고가 부족합니다.\n\n${u.join(`
`)}`);return}let d=`preprocess_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,f=new Date,p=[];try{for(let u of o){let o=b(u.breadPanQty),m=v(u.actualFrozenQty-o),h=u.breadPanQty,g=c.filter(e=>e.productName===u.productName&&e.remaining>.005).sort((e,t)=>e.date.localeCompare(t.date));for(let c of g){if(h<=.005)break;let _=v(Math.min(c.remaining,h)),y=c.remaining,b=v(y-_),x=new Date;await n(r(l,`breadPanLots`,c.id),{remaining:b,closed:b<=.005,updatedAt:x});let S=c.id===g[0].id;await s(i(l,`breadPanLogs`),{type:`preprocess`,date:e,productName:u.productName,qty:-_,before:y,after:b,lotId:c.id,lotDate:c.date,expectedFrozenQty:S?o:null,actualFrozenQty:S?u.actualFrozenQty:null,diff:S?m:null,staffName:t,uid:null,note:a||null,reason:null,batchId:d,ledgerId:null,timestamp:f}),p.push({collection:`breadPanLots`,docId:c.id,field:`remaining`,delta:-_,before:y,after:b,label:`${u.productName} 빵판 (${c.date})`,stockUpdatedAtSnapshot:x}),h=v(h-_)}let _=await s(i(l,`frozenPanLots`),{productName:u.productName,date:e,staffName:t,initialQty:u.actualFrozenQty,remaining:u.actualFrozenQty,closed:!1,source:`preprocess`,sourceRefId:d,note:a||null,createdAt:f,updatedAt:f});await s(i(l,`frozenPanLogs`),{type:`preprocess`,date:e,productName:u.productName,qty:u.actualFrozenQty,before:0,after:u.actualFrozenQty,lotId:_.id,staffName:t,uid:null,note:a||null,reason:null,batchId:d,ledgerId:null,timestamp:f}),p.push({collection:`frozenPanLots`,docId:_.id,field:`remaining`,delta:u.actualFrozenQty,before:0,after:u.actualFrozenQty,label:`${u.productName} 동결판 (신규 생성)`,stockUpdatedAtSnapshot:f,isNewDoc:!0})}await s(i(l,`stockLedger`),{actionType:`breadToFrozenPreprocess`,actionId:d,timestamp:f,date:e,status:`active`,items:p}),closeModal(),await k(),alert(`전처리 작업 저장 완료!`)}catch(e){console.error(`handleWorkRowSave 에러:`,e),alert(`저장 중 오류가 발생했습니다.\n\n${e.message}\n\n일부 데이터가 저장되었을 수 있으니 화면을 새로고침해서 확인해주세요.`)}}function U(e,t){return`
    <div class="work-item">
      <div style="display:flex;gap:8px;align-items:center;">
        <select class="wi-name cell-input" style="flex:1;min-width:0;">
          <option value="">제품 선택</option>
          ${e.map(e=>`<option value="${e.displayName}">${e.displayName}</option>`).join(``)}
        </select>
        <button class="btn-del-row wi-del" type="button">×</button>
      </div>
      <div class="wi-stock-info" style="font-size:11px;color:#888;padding-left:2px;margin:6px 0;">제품을 선택하세요</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 60px;gap:8px;align-items:end;">
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">출고 빵판 수 *</label>
          <input type="number" class="wi-bread cell-input" step="0.01" min="0.01" placeholder="빵판" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">이론 동결판 (×4/9)</label>
          <input type="number" class="wi-expected cell-input" readonly placeholder="-" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">실제 산출 동결판 *</label>
          <input type="number" class="wi-actual cell-input" step="1" min="0" placeholder="실측" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">차이</label>
          <span class="wi-diff" style="display:inline-block;line-height:32px;font-size:13px;color:#888;">-</span>
        </div>
      </div>
    </div>
  `}function W(e){document.querySelectorAll(`.wi-del`).forEach(e=>{e.onclick=()=>{e.closest(`.work-item`).remove(),G()}}),document.querySelectorAll(`.work-item`).forEach(t=>{let n=t.querySelector(`.wi-name`),r=t.querySelector(`.wi-bread`);t.querySelector(`.wi-expected`);let i=t.querySelector(`.wi-actual`);t.querySelector(`.wi-diff`);let a=t.querySelector(`.wi-stock-info`);n.onchange=()=>{let i=n.value,o=e[i];!o||o.total<=0?(a.textContent=i?`⚠️ 빵판 lot 없음`:`제품을 선택하세요`,a.style.color=i?`#e53e3e`:`#888`,r.value=``,r.max=``):(a.textContent=`현재 잔량 ${o.total}개 (가장 오래된 lot ${o.oldestRemaining}개)`,a.style.color=`#2d7a3a`,r.value=o.oldestRemaining,r.max=o.total,K(t)),G()},r.oninput=()=>{K(t)},i.oninput=()=>{K(t)}})}function G(){let e=new Set;document.querySelectorAll(`.work-item .wi-name`).forEach(t=>{t.value&&e.add(t.value)}),document.querySelectorAll(`.work-item .wi-name`).forEach(t=>{let n=t.value;Array.from(t.options).forEach(t=>{t.value&&(t.disabled=t.value!==n&&e.has(t.value))})})}function K(e){let t=e.querySelector(`.wi-bread`),n=e.querySelector(`.wi-expected`),r=e.querySelector(`.wi-actual`),i=e.querySelector(`.wi-diff`),a=b(v(parseFloat(t.value)||0));n.value=a;let o=parseInt(r.value);if(isNaN(o)||r.value===``){i.textContent=`-`,i.style.color=`#888`;return}let s=v(o-a);i.textContent=`${s>0?`+`:``}${s}`,s===0?i.style.color=`#2d7a3a`:Math.abs(s)<=.5?i.style.color=`#888`:i.style.color=`#e67e22`}async function q(e,t,a){let o=e.items||[],c=[];for(let e of o){let n=t.filter(t=>t.productName===e.productName).reduce((e,t)=>e+t.remaining,0);e.orderPanQty>n&&c.push(`${e.productName}: 현재 재고 ${n}판 / 발주 ${e.orderPanQty}판`)}if(c.length>0){alert(`재고가 부족하여 발주 확인할 수 없습니다.\n\n${c.join(`
`)}\n\n발주를 삭제하거나 작업 행을 먼저 추가하세요.`);return}let u=[];for(let e of o){let i=e.orderPanQty,a=t.filter(t=>t.productName===e.productName).sort((e,t)=>e.date.localeCompare(t.date));for(let t of a){if(i<=0)break;let a=Math.min(t.remaining,i),o=t.remaining,s=o-a,c=new Date;await n(r(l,`frozenPanLots`,t.id),{remaining:s,closed:s<=0,updatedAt:c}),u.push({collection:`frozenPanLots`,docId:t.id,field:`remaining`,delta:-a,before:o,after:s,label:`${e.productName} (${t.date||`-`})`,stockUpdatedAtSnapshot:c}),i-=a}}let d=null;u.length>0&&(d=(await s(i(l,`stockLedger`),{actionType:`frozenPanOrder`,actionId:e.id,timestamp:new Date,date:e.date||``,status:`active`,items:u})).id),await n(r(l,`frozenPanStock`,e.id),{status:`confirmed`,ledgerId:d,confirmStaff:a,confirmedAt:new Date,updatedAt:new Date});let f=o.map(e=>`${e.productName} ${e.orderPanQty}판`).join(`, `);await m({action:`frozenPan`,subAction:`orderConfirm`,date:e.date||p(),staff:a,message:`동결판 발주 확인 — ${f} / 담당: ${a}`,details:{frozenPanStockId:e.id,orderDate:e.date||null,items:o,ledgerId:d}}),await k(),alert(`발주 확인 완료!`)}async function J(e,t,i){if(d!==`admin`&&d!==`office`){alert(`발주 취소는 대표/사무실 계정만 가능합니다.`);return}let o=await u({title:`발주 취소`,message:`취소 후에는 차감된 동결판 재고가 복원됩니다.`,label:`취소 사유`,placeholder:`예: 재고 부족, 일정 변경`,required:!0,multiline:!0});if(o===null)return;if(e.ledgerId){let t=await a(r(l,`stockLedger`,e.ledgerId));if(t.exists()&&t.data().status===`active`){let i=t.data().items||[];for(let e of i){let t=await a(r(l,e.collection,e.docId));if(!t.exists())continue;let i=t.data()[e.field]||0;if(i!==e.after&&!await f({title:`로그아웃 확인`,message:`오늘 아직 마감되지 않았습니다.
로그아웃해도 자동으로 마감되지 않습니다.

로그아웃 하시겠습니까?`,confirmText:`로그아웃`}))return;let o=i-e.delta;await n(r(l,e.collection,e.docId),{[e.field]:o,closed:o<=0,updatedAt:new Date})}await n(r(l,`stockLedger`,e.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}}else{let i=e.items||[];for(let e of i){let i=t.filter(t=>t.productName===e.productName&&t.sourceRowId).sort((e,t)=>t.date.localeCompare(e.date)),a=e.orderPanQty;for(let t of i){if(a<=0)break;let i=Math.min(e.orderPanQty,a);await n(r(l,`frozenPanLots`,t.id),{remaining:t.remaining+i,closed:!1,updatedAt:new Date}),a-=i}}}await n(r(l,`frozenPanStock`,e.id),{status:`pending`,cancelReason:o,cancelStaff:i,cancelledAt:new Date,updatedAt:new Date});let s=e.items||[],c=s.map(e=>`${e.productName} ${e.orderPanQty}판`).join(`, `);await m({action:`frozenPan`,subAction:`orderCancel`,date:e.date||p(),staff:i,message:`동결판 발주 취소 — ${c} / 사유: ${o} / 담당: ${i}`,details:{frozenPanStockId:e.id,orderDate:e.date||null,items:s,reason:o}}),await k(),alert(`발주 취소 완료!`)}async function Y({title:e,message:t,groups:n}){return await Z(),new Promise(r=>{let i=document.getElementById(`modalOverlay`);i&&i.remove();let a=document.createElement(`div`);a.id=`modalOverlay`,a.className=`modal-overlay`,a.innerHTML=`
      <div class="modal-box" style="max-width:400px;padding:24px;">
        <h3 style="margin:0 0 12px 0;font-size:18px;font-weight:600;">${e}</h3>
        <p style="font-size:13px;color:#666;margin:0 0 20px 0;">${t}</p>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:13px;font-weight:500;color:#333;margin-bottom:8px;">담당자 *</label>
          <select id="sp_staff" style="width:100%;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;">
            <option value="">선택</option>
            ${Q(n)}
          </select>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn-secondary" id="sp_cancel">취소</button>
          <button class="btn-primary" id="sp_ok">확인</button>
        </div>
      </div>
    `,document.body.appendChild(a);let o=e=>{a.remove(),r(e)};document.getElementById(`sp_cancel`).addEventListener(`click`,()=>o(null)),document.getElementById(`sp_ok`).addEventListener(`click`,()=>{let e=document.getElementById(`sp_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}o(e)})})}var X={};async function Z(){Object.keys(X).length>0||await Promise.all([`senior`,`lead`,`office`].map(async e=>{let t=await a(r(l,`staffGroups`,e));t.exists()&&(X[e]=t.data().members||[])}))}function Q(e){let t=``;for(let n of e)(X[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n)}window.closeModal=function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()};export{C as renderFrozenPan};