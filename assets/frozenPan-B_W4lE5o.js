import{a as e,b as t,d as n,s as r,u as i,y as a}from"./index.esm-CWp5uCwe.js";import{n as o}from"./firebase-Bm8Fqw4J.js";import{r as s}from"./pageLifecycle-_b6L3DA3.js";import{n as c}from"./modalManager-D53QKIlh.js";import{n as l}from"./modal-IG9zwovL.js";import{G as u,L as d,W as f,f as p}from"./index-Uw9lmWdC.js";import{n as m}from"./activityLogs-Dyy26KLn.js";import{t as h}from"./statusToast-DAQ_Eu62.js";import{o as g}from"./manualMovementLogic-BmrH9oK0.js";import{i as _,n as v,r as y,t as b}from"./movementForm-YdnAH_bu.js";import{t as x}from"./closingGuard-D1UC9xqW.js";import{t as S}from"./pageRefresh-D6fvLpZN.js";import{t as C}from"./pageCommand-DwFC2YOW.js";import{t as w}from"./commandWrites-C5D9qbxM.js";import{disposeFreezeOpTab as T,renderFreezeOpInTab as ee}from"./freezeOp-_4_eaUsb.js";import{t as te}from"./recipe-DZIBRSu5.js";import{i as E,n as ne,t as D}from"./number-Dwuf17we.js";import{t as re}from"./pageStaff-CCF6NjM9.js";var O=[],k=`breadPan`;async function A({force:e=!1}={}){k=`breadPan`,document.getElementById(`mainContent`).innerHTML=`<p style="padding:24px">동결판 재고 로딩 중...</p>`,await P({force:e})}async function ie(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenPanStock`),i(`date`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()}))}async function j(t={getDocs:r,getDoc:e},n=!1){return(await t.getDocs(a(o,`frozenPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>n?(!e.closed||Number(e.remaining)===0)&&Number(e.remaining)>=0:!e.closed&&Number(e.remaining||0)>0)}async function M(t={getDocs:r,getDoc:e},n=!1){return(await t.getDocs(a(o,`breadPanLots`))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>n?(!e.closed||Number(e.remaining)===0)&&Number(e.remaining)>=0:!e.closed)}async function N(t={getDocs:r,getDoc:e}){let s=n(a(o,`breadPanLogs`),i(`timestamp`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()}))}async function ae(t={getDocs:r,getDoc:e}){let s=n(a(o,`frozenPanLogs`),i(`timestamp`,`desc`));return(await t.getDocs(s)).docs.map(e=>({id:e.id,...e.data()}))}async function P({force:e=!1}={}){let t=document.getElementById(`mainContent`),n=await Q.load(e=>$(e),{force:e,onChange:S(Q,P)});!n||!t?.isConnected||(O=n.recipes,Y=n.staff,F(n.rows,n.lots,n.breadPanLots,n.breadPanLogs,n.frozenPanLogs))}function F(e,t,n,r,i){let a=document.getElementById(`mainContent`);e=e.filter(e=>e.type!==`work`);let o={};t.forEach(e=>{o[e.productName]||(o[e.productName]=[]),o[e.productName].push({date:e.date,remaining:e.remaining,source:e.source||null})});let c={};n.forEach(e=>{c[e.productName]||(c[e.productName]=[]),c[e.productName].push({date:e.date,remaining:e.remaining})});let l=E(n.reduce((e,t)=>e+(t.remaining||0),0)),u=ne(l),d=t.reduce((e,t)=>e+(t.remaining||0),0);if(a.innerHTML=`
    <div class="page-wrap">
      <div class="page-header">
        <h2 class="page-title">동결판 재고</h2>
      </div>

      <!-- 합계 요약 -->
      <div class="form-section" style="background:white;border-radius:8px;padding:16px 20px;margin-bottom:16px;border:1px solid #e8e8e8;">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">현재 빵판</span>
            <span class="stat-value" style="font-size:20px;color:#1a1a1a">${l}개</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">실리콘 환산</span>
            <span class="stat-value" style="font-size:14px;color:#888">${u}판</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">현재 총 동결판</span>
            <span class="stat-value" style="font-size:20px;color:${d<10?`#e53e3e`:`#1a1a1a`}">${d}판</span>
          </div>
        </div>
      </div>

      <!-- 탭 nav -->
      <div class="tab-nav" style="display:flex;gap:0;border-bottom:2px solid #e8e8e8;margin-bottom:16px;">
        <button class="tab-btn" data-tab="breadPan"
          style="padding:10px 20px;background:${k===`breadPan`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${k===`breadPan`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${k===`breadPan`?`600`:`400`};color:${k===`breadPan`?`#1a1a1a`:`#888`};">
          빵판 재고
        </button>
        <button class="tab-btn" data-tab="frozenPan"
          style="padding:10px 20px;background:${k===`frozenPan`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${k===`frozenPan`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${k===`frozenPan`?`600`:`400`};color:${k===`frozenPan`?`#1a1a1a`:`#888`};">
          동결판 재고
        </button>
        <button class="tab-btn" data-tab="freezeOp"
          style="padding:10px 20px;background:${k===`freezeOp`?`#fff`:`#f5f5f5`};border:1px solid #e8e8e8;border-bottom:${k===`freezeOp`?`2px solid white`:`none`};margin-bottom:-2px;font-size:14px;cursor:pointer;font-weight:${k===`freezeOp`?`600`:`400`};color:${k===`freezeOp`?`#1a1a1a`:`#888`};">
          동결가동
        </button>
      </div>

      <!-- 탭 콘텐츠 -->
      ${k===`breadPan`?se(c,r):k===`frozenPan`?le(e,o,i):`<div id="freezeOpContent" style="padding:4px 0;">로딩 중...</div>`}
    </div>
  `,document.querySelectorAll(`.tab-btn`).forEach(a=>{a.addEventListener(`click`,()=>{k=a.dataset.tab,F(e,t,n,r,i)})}),k!==`freezeOp`&&T(),k===`breadPan`)L(e,t);else if(k===`frozenPan`)R(e,t);else{let e=s();ee().catch(t=>{let n=document.getElementById(`freezeOpContent`);n&&(!e||e.isCurrent())&&(n.textContent=`동결가동 자료를 불러오지 못했습니다. 탭을 다시 선택해주세요.`,console.error(t))})}}function oe(e){if(!e)return``;let t={tenderIn:{label:`텐더`,color:`#1f6fb2`,bg:`#e8f3fc`},preprocess:{label:`전처리`,color:`#2d7a3a`,bg:`#e8f5ea`},adjust:{label:`조정`,color:`#b97a1f`,bg:`#fdf3e0`}}[e];return t?`<span style="display:inline-block;font-size:10px;background:${t.bg};color:${t.color};padding:1px 6px;border-radius:3px;margin-left:4px;font-weight:500;vertical-align:middle;">${t.label}</span>`:``}function se(e,t){let n=Object.entries(e);return`
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
                  <div style="font-size:12px;color:#555">${E(e.remaining)}개 <span style="color:#aaa">(${e.date})</span></div>
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
          ${t.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:t.map(e=>ce(e)).join(``)}
        </tbody>
      </table>
    </div>
  `}function ce(e){let t=g(e,{incoming:`입고`,preprocess:`전처리`,adjust:`수동조정`,rollback:`롤백`}[e.type]||e.type),n={incoming:`tag-raw`,preprocess:``,adjust:`tag-cat`,rollback:`tag-cat`}[e.type]||``,r=e.qty>0?`#2d7a3a`:`#e53e3e`,i=e.qty>0?`+`:``,a=`-`;if(e.type===`preprocess`&&e.expectedFrozenQty!=null&&e.actualFrozenQty!=null){let t=e.diff>0?`+${e.diff}`:e.diff<0?`${e.diff}`:`0`;a=`이론 ${e.expectedFrozenQty} / 실측 ${e.actualFrozenQty} (차 ${t})`}else e.note?a=e.note:e.reason&&(a=e.reason);let o=e.lotDate&&e.type!==`incoming`?`<span style="font-size:11px;color:#999;margin-left:4px;">(입고 ${e.lotDate})</span>`:``;return`
    <tr>
      <td>${e.date||`-`}</td>
      <td><span class="tag ${n}" style="${e.type===`preprocess`?`background:#f0f0f0;color:#666`:``}">${t}</span></td>
      <td>${e.productName||`-`}${o}</td>
      <td style="color:${r};font-weight:500;">${i}${e.qty||0}개</td>
      <td>${e.staffName||`-`}</td>
      <td style="font-size:12px;color:#666;">${a}</td>
    </tr>
  `}function le(e,t,n){let r=Object.entries(t);return`
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
                  <div style="font-size:12px;color:#555">${e.remaining}판 <span style="color:#aaa">(${e.date})</span>${oe(e.source)}</div>
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
          ${e.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">발주 내역 없음</td></tr>`:e.map(e=>U(e)).join(``)}
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
          ${n.length===0?`<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>`:n.map(e=>I(e)).join(``)}
        </tbody>
      </table>
    </div>
  `}function I(e){let t=g(e,{tenderIn:`텐더동결 입고`,preprocess:`전처리 입고`,orderDeduct:`발주 차감`,orderRollback:`발주 복원`,adjust:`수동조정`}[e.type]||e.type),n={tenderIn:`tag-raw`,preprocess:`tag-raw`,orderDeduct:``,orderRollback:`tag-cat`,adjust:`tag-cat`}[e.type]||``,r=e.qty>0?`#2d7a3a`:`#e53e3e`,i=e.qty>0?`+`:``,a=`-`;return e.note?a=e.note:e.reason&&(a=e.reason),`
    <tr>
      <td>${e.date||`-`}</td>
      <td><span class="tag ${n}" style="${e.type===`orderDeduct`?`background:#f0f0f0;color:#666`:``}">${t}</span></td>
      <td>${e.productName||`-`}</td>
      <td style="color:${r};font-weight:500;">${i}${e.qty||0}판</td>
      <td>${e.staffName||`-`}</td>
      <td style="font-size:12px;color:#666;">${a}</td>
    </tr>
  `}function L(e,t){let n=document.getElementById(`btnBreadPanIncoming`);n&&n.addEventListener(`click`,()=>B());let r=document.getElementById(`btnBreadPanAdjust`);r&&r.addEventListener(`click`,()=>V());let i=document.getElementById(`btnAddWorkRow`);i&&i.addEventListener(`click`,()=>ue(e,t))}function R(e,n){let r=document.getElementById(`btnTenderIn`);r&&r.addEventListener(`click`,()=>z());let i=document.getElementById(`btnFrozenPanAdjust`);i&&i.addEventListener(`click`,()=>H()),document.querySelectorAll(`.btn-order-confirm`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.id,i=e.find(e=>e.id===r);if(!i||await x(i.date))return;let a=await J({title:`발주 확인 — 담당자 선택`,message:`발주 확인을 진행할 담당자를 선택해주세요.`,groups:[`senior`,`office`]});a&&await fe(i,n,a)})}),document.querySelectorAll(`.btn-order-delete`).forEach(n=>{n.addEventListener(`click`,async()=>C(Q,async r=>{let{updateDoc:i}=w(r);if(!await l({title:`발주 행 삭제`,message:`발주 행을 삭제하시겠습니까?`,confirmText:`삭제`,danger:!0}))return;let a=e.find(e=>e.id===n.dataset.id);a&&await x(a.date,r)||(await i(t(o,`frozenPanStock`,n.dataset.id),{status:`cancelled`}),r.isCurrent()&&await P())},{roles:[`admin`,`office`]}))}),document.querySelectorAll(`.btn-order-cancel`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=e.find(e=>e.id===t.dataset.id);if(!r||await x(r.date))return;let i=await J({title:`발주 확인 취소`,message:`확인 취소 시 이 발주에서 차감한 동결판 재고가 복원됩니다.`,groups:[`senior`,`office`],requireReason:!0});i&&await pe(r,n,i.staff,i.reason)})})}function z(){let e=O.filter(e=>e.requiresSeparation!==!0);if(e.length===0){alert(`동결텐더 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 끈 레시피를 추가해주세요.`);return}Z(`
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
        <input type="date" id="m_date" value="${d()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${X([`senior`,`office`])}
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
  `),document.getElementById(`btnSaveTenderIn`).addEventListener(`click`,async()=>C(Q,async e=>{let{addDoc:n,updateDoc:r}=w(e),i=document.getElementById(`m_recipe`).value.trim(),s=parseInt(document.getElementById(`m_qty`).value)||0,c=document.getElementById(`m_date`).value,l=document.getElementById(`m_staff`).value,u=document.getElementById(`m_note`).value.trim();if(!i){alert(`제품을 선택해주세요.`);return}if(s<=0){alert(`동결판 수는 0보다 커야 합니다.`);return}if(!c){alert(`날짜를 입력해주세요.`);return}if(!l){alert(`담당자를 선택해주세요.`);return}if(await x(c,e))return;let d=new Date;try{let f=await n(a(o,`frozenPanLots`),{productName:i,date:c,staffName:l,initialQty:s,remaining:s,closed:!1,source:`tenderIn`,sourceRefId:null,note:u||null,createdAt:d,updatedAt:d}),p=await n(a(o,`frozenPanLogs`),{type:`tenderIn`,date:c,productName:i,qty:s,before:0,after:s,lotId:f.id,staffName:l,uid:null,note:u||null,reason:null,batchId:null,ledgerId:null,timestamp:d});if(await r(t(o,`frozenPanLots`,f.id),{sourceRefId:p.id}),await n(a(o,`stockLedger`),{actionType:`frozenPanTenderIn`,actionId:p.id,timestamp:d,date:c,status:`active`,items:[{collection:`frozenPanLots`,docId:f.id,field:`remaining`,delta:s,before:0,after:s,label:`${i} 동결판 (텐더동결 입고)`,stockUpdatedAtSnapshot:d,isNewDoc:!0}]}),!e.isCurrent()||(closeModal(),!e.isCurrent()))return;await P(),h(`텐더동결 입고 완료!`)}catch(e){console.error(`showTenderInModal 저장 에러:`,e),alert(`저장 중 오류가 발생했습니다.\n\n${e.message}`)}},{roles:[`admin`,`office`,`production`]}))}function B(){let e=O.filter(e=>e.requiresSeparation===!0);if(e.length===0){alert(`동결생식 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.`);return}Z(`
    ${v({incoming:!0,reasonField:!1})}
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
        <input type="date" id="m_date" value="${d()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${X([`senior`,`office`])}
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
  `);let n=b({db:o,name:`breadPanLogs`,filter:()=>({lotId:document.getElementById(`m_lot`)?.value||``}),filterInputs:[document.getElementById(`m_lot`)],onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_note`)});document.getElementById(`btnSaveBreadPanIncoming`).addEventListener(`click`,async()=>C(Q,async e=>{let{addDoc:r}=w(e),i=y(n);if(!i)return;let s=document.getElementById(`m_recipe`).value.trim(),c=E(parseFloat(document.getElementById(`m_qty`).value)||0),l=document.getElementById(`m_date`).value,u=document.getElementById(`m_staff`).value,d=document.getElementById(`m_note`).value.trim();if(!s){alert(`레시피를 선택해주세요.`);return}if(c<=0){alert(`빵판 수는 0보다 커야 합니다.`);return}if(!l){alert(`날짜를 입력해주세요.`);return}if(!u){alert(`담당자를 선택해주세요.`);return}if(await x(l,e))return;let p=new Date,m=t(a(o,`breadPanLots`));await _({db:o,command:e,name:`breadPanLogs`,stockId:m.id,selection:i,uid:f?.uid||null,stockData:{productName:s,date:l,staffName:u,initialQty:c,remaining:0,closed:!1,note:d||null,createdAt:p},log:{type:`incoming`,date:l,productName:s,qty:c,lotId:m.id,lotDate:l,staffName:u,note:d||null}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(await P(),h(`빵판 입고 완료!`)))},{roles:[`admin`,`office`,`production`]}))}async function V(){let n=await M({getDocs:r,getDoc:e},!0);if(n.length===0){alert(`조정할 빵판 lot이 없습니다.
빵판 입고를 먼저 진행해주세요.`);return}let i=n.sort((e,t)=>{let n=e.productName.localeCompare(t.productName);return n===0?e.date.localeCompare(t.date):n}).map(e=>`<option value="${e.id}">${e.productName} / ${e.date} / 잔량 ${e.remaining}개</option>`).join(``);Z(`
    ${v({incoming:!1,reasonField:!1})}
    <h3 class="modal-title">빵판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${i}
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
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanAdjust">저장</button>
    </div>
  `);let a=b({db:o,name:`breadPanLogs`,filter:()=>({lotId:document.getElementById(`m_lot`)?.value||``}),filterInputs:[document.getElementById(`m_lot`)],onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveBreadPanAdjust`).addEventListener(`click`,async()=>C(Q,async e=>{let{getDoc:n,addDoc:r,updateDoc:i}=w(e),s=y(a);if(!s)return;let c=document.getElementById(`m_lot`).value,l=document.getElementById(`m_adjustType`).value,u=E(parseFloat(document.getElementById(`m_qty`).value)||0),p=s.reason,m=document.getElementById(`m_staff`).value;if(!c){alert(`대상 lot을 선택해주세요.`);return}if(u<=0){alert(`수량은 0보다 커야 합니다.`);return}if(!m){alert(`담당자를 선택해주세요.`);return}let g=l===`plus`?u:-u,v=await n(t(o,`breadPanLots`,c));if(!v.exists()){alert(`lot을 찾을 수 없습니다.`);return}let b=v.data();if(b.date,await x(d(),e))return;let S=b.remaining||0,C=E(S+g);if(C<0&&s.kind!==`test`){alert(`조정 후 잔량이 ${C}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${S}개에서 최대 ${S}개까지만 감소 가능합니다.`);return}let T=d();await _({db:o,command:e,name:`breadPanLogs`,stockId:c,selection:s,expectedBefore:S,uid:f?.uid||null,log:{type:`adjust`,date:T,productName:b.productName,qty:g,before:S,after:C,lotId:c,lotDate:b.date||null,staffName:m,reason:p}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(await P(),h(`수동 조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}async function H(){let n=await j({getDocs:r,getDoc:e},!0);if(n.length===0){alert(`조정할 동결판 lot이 없습니다.
동결판 입고를 먼저 진행해주세요.`);return}let i=n.sort((e,t)=>{let n=e.productName.localeCompare(t.productName);return n===0?e.date.localeCompare(t.date):n}).map(e=>`<option value="${e.id}">${e.productName} / ${e.date} / 잔량 ${e.remaining}개</option>`).join(``);Z(`
    ${v({incoming:!1,reasonField:!1})}
    <h3 class="modal-title">동결판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${i}
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
        ${X([`senior`,`office`])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozenPanAdjust">저장</button>
    </div>
  `);let a=b({db:o,name:`frozenPanLogs`,filter:()=>({lotId:document.getElementById(`m_lot`)?.value||``}),filterInputs:[document.getElementById(`m_lot`)],onCancel:e=>{document.getElementById(`m_qty`).value=Math.abs(e),document.getElementById(`m_adjustType`).value=e>0?`plus`:`minus`},reasonInput:document.getElementById(`m_reason`)});document.getElementById(`btnSaveFrozenPanAdjust`).addEventListener(`click`,async()=>C(Q,async e=>{let{getDoc:n,writeBatch:r}=w(e),i=y(a);if(!i)return;let s=document.getElementById(`m_lot`).value,c=document.getElementById(`m_adjustType`).value,l=parseInt(document.getElementById(`m_qty`).value,10),u=i.reason,p=document.getElementById(`m_staff`).value;if(!s){alert(`대상 lot을 선택해주세요.`);return}if(!Number.isInteger(l)||l<=0){alert(`수량은 0보다 큰 정수여야 합니다.`);return}if(!p){alert(`담당자를 선택해주세요.`);return}let m=c===`plus`?l:-l,g=await n(t(o,`frozenPanLots`,s));if(!g.exists()){alert(`lot을 찾을 수 없습니다.`);return}let v=g.data();if(await x(d(),e))return;let b=Number(v.remaining||0),S=b+m;if(S<0&&i.kind!==`test`){alert(`조정 후 잔량이 ${S}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${b}개에서 최대 ${b}개까지만 감소 가능합니다.`);return}let C=d();await _({db:o,command:e,name:`frozenPanLogs`,stockId:s,selection:i,expectedBefore:b,uid:f?.uid||null,log:{type:`adjust`,date:C,productName:v.productName,qty:m,before:b,after:S,lotId:s,lotDate:v.date||null,staffName:p,reason:u}}),e.isCurrent()&&(closeModal(),e.isCurrent()&&(await P(),h(`수동 조정 완료!`)))},{roles:[`admin`,`office`,`production`]}))}function U(e){if(e.status===`cancelled`)return``;let t=u===`admin`||u===`office`,n=e.status===`confirmed`,r=(e.items||[]).reduce((e,t)=>e+(t.orderPanQty||0),0),i=r===45?`#2d7a3a`:r>45?`#e53e3e`:`#e67e22`,a=`
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
  `}async function ue(e,t){let n=await M(),r=O.filter(e=>e.requiresSeparation===!0);if(r.length===0){alert(`동결생식 레시피가 없습니다.

레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.`);return}let i={};r.forEach(e=>{let t=n.filter(t=>t.productName===e.displayName&&t.remaining>.005).sort((e,t)=>e.date.localeCompare(t.date)),r=E(t.reduce((e,t)=>e+t.remaining,0)),a=t.length>0?t[0].remaining:0;i[e.displayName]={total:r,oldestRemaining:a}}),Z(`
    <h3 class="modal-title">작업 행 추가 (빵판 → 동결판 전처리)</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜 *</label>
        <input type="date" id="m_date" value="${d()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${X([`senior`,`office`])}
        </select>
      </div>
    </div>

    <div style="font-size:12px;color:#666;background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:12px;">
      <strong>환산</strong>: 빵판 1개 → 동결판 4/9개 (≈0.44)<br>
      <strong>FIFO 적용</strong>: 같은 제품에 여러 lot이 있으면 오래된 lot부터 차감됩니다.<br>
      <strong>실측</strong>: 이론값과 실제 산출 동결판 수가 다르면 차이가 별도 기록됩니다.
    </div>

    <div id="workItems">
      ${W(r,i)}
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
  `),G(i),K(),document.getElementById(`btnAddWorkItem`).addEventListener(`click`,()=>{document.getElementById(`workItems`).insertAdjacentHTML(`beforeend`,W(r,i)),G(i),K()}),document.getElementById(`btnSaveWorkRow`).addEventListener(`click`,async()=>{await de()})}async function de(){return C(Q,async e=>{let{addDoc:n,updateDoc:r}=w(e),i=document.getElementById(`m_date`).value,s=document.getElementById(`m_staff`).value,c=document.getElementById(`m_note`).value.trim(),l=Array.from(document.querySelectorAll(`.work-item`)).map(e=>({productName:e.querySelector(`.wi-name`).value.trim(),breadPanQty:E(parseFloat(e.querySelector(`.wi-bread`).value)||0),actualFrozenQty:e.querySelector(`.wi-actual`).value===``?null:Number(e.querySelector(`.wi-actual`).value)})).filter(e=>e.productName);if(!i){alert(`날짜를 입력해주세요.`);return}if(!s){alert(`담당자를 선택해주세요.`);return}if(l.length===0){alert(`제품을 1개 이상 입력해주세요.`);return}for(let e of l){if(e.breadPanQty<=0){alert(`${e.productName}: 출고 빵판 수가 입력되지 않았습니다.`);return}if(!Number.isInteger(e.actualFrozenQty)||e.actualFrozenQty<=0){alert(e.actualFrozenQty===null?`${e.productName}: 실제 산출 동결판 수를 입력해주세요.`:`${e.productName}: 실제 산출 동결판 수는 1 이상의 정수로 입력해주세요.`);return}}if(await x(i,e))return;let u=await M(),d=[];for(let e of l){let t=E(u.filter(t=>t.productName===e.productName).reduce((e,t)=>e+t.remaining,0));e.breadPanQty>t&&d.push(`${e.productName}: 잔량 ${t}개 / 요청 ${e.breadPanQty}개`)}if(d.length>0){alert(`빵판 재고가 부족합니다.\n\n${d.join(`
`)}`);return}let f=`preprocess_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,p=new Date,m=[];try{for(let e of l){let l=D(e.breadPanQty),d=E(e.actualFrozenQty-l),h=e.breadPanQty,g=u.filter(t=>t.productName===e.productName&&t.remaining>.005).sort((e,t)=>e.date.localeCompare(t.date));for(let u of g){if(h<=.005)break;let _=E(Math.min(u.remaining,h)),v=u.remaining,y=E(v-_),b=new Date;await r(t(o,`breadPanLots`,u.id),{remaining:y,closed:y<=.005,updatedAt:b});let x=u.id===g[0].id;await n(a(o,`breadPanLogs`),{type:`preprocess`,date:i,productName:e.productName,qty:-_,before:v,after:y,lotId:u.id,lotDate:u.date,expectedFrozenQty:x?l:null,actualFrozenQty:x?e.actualFrozenQty:null,diff:x?d:null,staffName:s,uid:null,note:c||null,reason:null,batchId:f,ledgerId:null,timestamp:p}),m.push({collection:`breadPanLots`,docId:u.id,field:`remaining`,delta:-_,before:v,after:y,label:`${e.productName} 빵판 (${u.date})`,stockUpdatedAtSnapshot:b}),h=E(h-_)}let _=await n(a(o,`frozenPanLots`),{productName:e.productName,date:i,staffName:s,initialQty:e.actualFrozenQty,remaining:e.actualFrozenQty,closed:!1,source:`preprocess`,sourceRefId:f,note:c||null,createdAt:p,updatedAt:p});await n(a(o,`frozenPanLogs`),{type:`preprocess`,date:i,productName:e.productName,qty:e.actualFrozenQty,before:0,after:e.actualFrozenQty,lotId:_.id,staffName:s,uid:null,note:c||null,reason:null,batchId:f,ledgerId:null,timestamp:p}),m.push({collection:`frozenPanLots`,docId:_.id,field:`remaining`,delta:e.actualFrozenQty,before:0,after:e.actualFrozenQty,label:`${e.productName} 동결판 (신규 생성)`,stockUpdatedAtSnapshot:p,isNewDoc:!0})}if(await n(a(o,`stockLedger`),{actionType:`breadToFrozenPreprocess`,actionId:f,timestamp:p,date:i,status:`active`,items:m}),!e.isCurrent()||(closeModal(),!e.isCurrent()))return;await P(),h(`전처리 작업 저장 완료!`)}catch(e){console.error(`handleWorkRowSave 에러:`,e),alert(`저장 중 오류가 발생했습니다.\n\n${e.message}\n\n일부 데이터가 저장되었을 수 있으니 화면을 새로고침해서 확인해주세요.`)}},{roles:[`admin`,`office`,`production`]})}function W(e,t){return`
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
          <input type="number" class="wi-actual cell-input" step="1" min="1" placeholder="실측" />
        </div>
        <div>
          <label style="font-size:11px;color:#555;display:block;margin-bottom:2px;">차이</label>
          <span class="wi-diff" style="display:inline-block;line-height:32px;font-size:13px;color:#888;">-</span>
        </div>
      </div>
    </div>
  `}function G(e){document.querySelectorAll(`.wi-del`).forEach(e=>{e.onclick=()=>{e.closest(`.work-item`).remove(),K()}}),document.querySelectorAll(`.work-item`).forEach(t=>{let n=t.querySelector(`.wi-name`),r=t.querySelector(`.wi-bread`),i=t.querySelector(`.wi-expected`),a=t.querySelector(`.wi-actual`),o=t.querySelector(`.wi-diff`),s=t.querySelector(`.wi-stock-info`);n.onchange=()=>{let c=n.value,l=e[c];a.value=``,i.value=``,o.textContent=`-`,o.style.color=`#888`,!l||l.total<=0?(s.textContent=c?`⚠️ 빵판 lot 없음`:`제품을 선택하세요`,s.style.color=c?`#e53e3e`:`#888`,r.value=``,r.max=``):(s.textContent=`현재 잔량 ${l.total}개 (가장 오래된 lot ${l.oldestRemaining}개)`,s.style.color=`#2d7a3a`,r.value=l.oldestRemaining,r.max=l.total,q(t)),K()},r.oninput=()=>{q(t)},a.oninput=()=>{q(t)}})}function K(){let e=new Set;document.querySelectorAll(`.work-item .wi-name`).forEach(t=>{t.value&&e.add(t.value)}),document.querySelectorAll(`.work-item .wi-name`).forEach(t=>{let n=t.value;Array.from(t.options).forEach(t=>{t.value&&(t.disabled=t.value!==n&&e.has(t.value))})})}function q(e){let t=e.querySelector(`.wi-bread`),n=e.querySelector(`.wi-expected`),r=e.querySelector(`.wi-actual`),i=e.querySelector(`.wi-diff`),a=D(E(parseFloat(t.value)||0));n.value=a;let o=parseInt(r.value);if(isNaN(o)||r.value===``){i.textContent=`-`,i.style.color=`#888`;return}let s=E(o-a);i.textContent=`${s>0?`+`:``}${s}`,s===0?i.style.color=`#2d7a3a`:Math.abs(s)<=.5?i.style.color=`#888`:i.style.color=`#e67e22`}async function fe(e,n,r){return C(Q,async i=>{let{addDoc:s,updateDoc:c,recordActivity:l}=w(i),u=e.items||[],f=[];for(let e of u){let t=n.filter(t=>t.productName===e.productName).reduce((e,t)=>e+t.remaining,0);e.orderPanQty>t&&f.push(`${e.productName}: 현재 재고 ${t}판 / 발주 ${e.orderPanQty}판`)}if(f.length>0){alert(`재고가 부족하여 발주 확인할 수 없습니다.\n\n${f.join(`
`)}\n\n발주를 삭제하거나 작업 행을 먼저 추가하세요.`);return}let p=[];for(let e of u){let r=e.orderPanQty,i=n.filter(t=>t.productName===e.productName).sort((e,t)=>e.date.localeCompare(t.date));for(let n of i){if(r<=0)break;let i=Math.min(n.remaining,r),a=n.remaining,s=a-i,l=new Date;await c(t(o,`frozenPanLots`,n.id),{remaining:s,closed:s<=0,updatedAt:l}),p.push({collection:`frozenPanLots`,docId:n.id,field:`remaining`,delta:-i,before:a,after:s,label:`${e.productName} (${n.date||`-`})`,stockUpdatedAtSnapshot:l}),r-=i}}let m=null;p.length>0&&(m=(await s(a(o,`stockLedger`),{actionType:`frozenPanOrder`,actionId:e.id,timestamp:new Date,date:e.date||``,status:`active`,items:p})).id),await c(t(o,`frozenPanStock`,e.id),{status:`confirmed`,ledgerId:m,confirmStaff:r,confirmedAt:new Date,updatedAt:new Date});let g=u.map(e=>`${e.productName} ${e.orderPanQty}판`).join(`, `);await l({action:`frozenPan`,subAction:`orderConfirm`,date:e.date||d(),staff:r,message:`동결판 발주 확인 — ${g} / 담당: ${r}`,details:{frozenPanStockId:e.id,orderDate:e.date||null,items:u,ledgerId:m}}),i.isCurrent()&&(await P(),h(`발주 확인 완료!`))},{roles:[`admin`,`office`,`production`]})}async function pe(e,n,r,i){return C(Q,async a=>{let{getDoc:s,writeBatch:c}=w(a),f=c(o);if(u!==`admin`&&u!==`office`){alert(`발주 취소는 대표/사무실 계정만 가능합니다.`);return}if(i=i?.trim(),!r||!i){alert(`담당자와 취소 사유를 입력해주세요.`);return}if(await x(e.date,a))return;let p=await s(t(o,`frozenPanStock`,e.id));if(!p.exists()||p.data().status!==`confirmed`){alert(`이미 취소됐거나 변경된 발주입니다. 최신 자료를 확인해주세요.`);return}if(e.ledgerId){let n=await s(t(o,`stockLedger`,e.ledgerId));if(n.exists()&&n.data().status===`active`){let r=n.data().items||[],i=[];for(let e of r){let n=t(o,e.collection,e.docId),r=await s(n);if(!r.exists())throw Error(`복원할 재고 원본이 없습니다. 사무팀 확인이 필요합니다.`);let a=Number(r.data()[e.field]);if(!Number.isFinite(a)||!Number.isFinite(e.delta)||a-e.delta<0)throw Error(`복원 수량을 확인할 수 없습니다.`);i.push({ref:n,item:e,current:a,after:a-e.delta})}let a=i.filter(e=>e.current!==e.item.after);if(a.length&&!await l({title:`재고 변경 후 발주 취소`,message:`발주 확인 이후 재고가 변경되었습니다. 현재 재고에 이 발주의 차감 수량만 되돌립니다.

`+a.map(e=>`${e.item.label||`동결판`}: 현재 ${e.current} → 복원 후 ${e.after}`).join(`
`),confirmText:`재고 복원 후 취소`,danger:!0}))return;for(let e of i)f.update(e.ref,{[e.item.field]:e.after,closed:e.after<=0,updatedAt:new Date});f.update(t(o,`stockLedger`,e.ledgerId),{status:`rolledBack`,rolledBackAt:new Date})}else throw Error(`이미 복원됐거나 유효하지 않은 발주 원장입니다. 최신 자료를 확인해주세요.`)}else{let r=e.items||[];for(let e of r){let r=n.filter(t=>t.productName===e.productName&&t.sourceRowId).sort((e,t)=>t.date.localeCompare(e.date)),i=e.orderPanQty;for(let n of r){if(i<=0)break;let r=Math.min(e.orderPanQty,i);f.update(t(o,`frozenPanLots`,n.id),{remaining:n.remaining+r,closed:!1,updatedAt:new Date}),i-=r}}}f.update(t(o,`frozenPanStock`,e.id),{status:`pending`,cancelReason:i,cancelStaff:r,cancelledAt:new Date,updatedAt:new Date});let g=e.items||[],_=g.map(e=>`${e.productName} ${e.orderPanQty}판`).join(`, `);await m({action:`frozenPan`,subAction:`orderCancel`,date:e.date||d(),staff:r,message:`동결판 발주 취소 — ${_} / 사유: ${i} / 담당: ${r}`,details:{frozenPanStockId:e.id,orderDate:e.date||null,items:g,reason:i}},{batch:f}),await f.commit(),a.isCurrent()&&(await P(),h(`발주 취소 완료!`))},{roles:[`admin`,`office`]})}async function J({title:e,message:t,groups:n,requireReason:r=!1}){return await me(),new Promise(i=>{let a=document.getElementById(`modalOverlay`);a&&a.remove();let o=document.createElement(`div`);o.id=`modalOverlay`,o.className=`modal-overlay`,o.innerHTML=`
      <div class="modal-box" style="max-width:400px;padding:24px;">
        <h3 style="margin:0 0 12px 0;font-size:18px;font-weight:600;">${e}</h3>
        <p style="font-size:13px;color:#666;margin:0 0 20px 0;">${t}</p>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:13px;font-weight:500;color:#333;margin-bottom:8px;">담당자 *</label>
          <select id="sp_staff" style="width:100%;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;">
            <option value="">선택</option>
            ${X(n)}
          </select>
        </div>
        ${r?`<div class="form-group"><label for="sp_reason">취소 사유 *</label><textarea id="sp_reason" maxlength="200" placeholder="취소 사유를 입력해주세요"></textarea></div>`:``}
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn-secondary" id="sp_cancel">닫기</button>
          <button class="btn-primary" id="sp_ok">${r?`재고 복원 후 취소`:`확인`}</button>
        </div>
      </div>
    `,document.body.appendChild(o);let s=e=>{o.remove(),i(e)};document.getElementById(`sp_cancel`).addEventListener(`click`,()=>s(null)),document.getElementById(`sp_ok`).addEventListener(`click`,()=>{let e=document.getElementById(`sp_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}let t=document.getElementById(`sp_reason`)?.value.trim();if(r&&!t){alert(`취소 사유를 입력해주세요.`);return}s(r?{staff:e,reason:t}:e)})})}var Y={};async function me(){Object.keys(Y).length>0||await Promise.all([`senior`,`lead`,`office`].map(async n=>{let r=await e(t(o,`staffGroups`,n));r.exists()&&(Y[n]=r.data().members||[])}))}function X(e){let t=``;for(let n of e)(Y[n]||[]).forEach(e=>{t+=`<option value="${e.name}">${e.name}</option>`});return t}function Z(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box">${e}</div>`,document.body.appendChild(n)}c(`frozenPan`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});var Q=p(`frozenPan`);Q.refresh=P;async function $(e){let[t,n,r,i,a,o,s]=await Promise.all([ie(e),j(e),M(e),N(e),ae(e),te(e),re(e)]);return{rows:t,lots:n,breadPanLots:r,breadPanLogs:i,frozenPanLogs:a,recipes:o,staff:s}}function he({cacheOnly:e=!0}={}){return Q.prepare?.(`default`,$,{cacheOnly:e})}export{he as preparePage,A as renderFrozenPan};