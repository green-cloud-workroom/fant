const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/productionSupplementLoad-DEzF9wR-.js","assets/index.esm-eiUBzuYc.js","assets/rolldown-runtime-lhHHWwHU.js","assets/productionLoadPlan-DLQEWoVb.js","assets/index-Bq6M1Pnz.js","assets/firebase-Dpb5TxpT.js","assets/modal-5yNlUCJi.js","assets/modalManager-D53QKIlh.js","assets/staffText-DBRrEFyl.js","assets/index-Ew5QcNgl.css","assets/productionCoverage-B_UCz0VJ.js"])))=>i.map(i=>d[i]);
import{_ as e,a as t,b as n,c as r,d as i,f as a,g as o,h as s,l as c,m as l,n as u,p as d,r as f,s as p,u as m,v as h,w as g,y as _}from"./index.esm-eiUBzuYc.js";import{n as v}from"./firebase-Dpb5TxpT.js";import{i as y}from"./staffText-DBRrEFyl.js";import{n as ee}from"./modalManager-D53QKIlh.js";import{n as b,r as x}from"./modal-5yNlUCJi.js";import{$ as te,A as S,B as C,D as w,E as T,F as ne,G as E,H as D,I as re,J as ie,K as ae,M as O,N as oe,O as k,P as se,Q as ce,R as le,U as A,W as ue,X as de,_ as fe,a as pe,ct as me,dt as he,et as j,f as ge,h as _e,it as ve,j as ye,k as M,lt as be,n as N,nt as xe,r as Se,st as P,t as Ce,tt as F,ut as I,v as we,x as Te}from"./index-Bq6M1Pnz.js";import{r as Ee}from"./closing-JFBgTtk8.js";import{t as De}from"./closingGuard-CNdQ9qwc.js";import{t as Oe}from"./pageRefresh-CkCjUEx0.js";import{t as ke}from"./meatLogs-BSUvaNNp.js";import{t as Ae}from"./atomicStockOperation-DNVhs4px.js";import{i as je,r as Me}from"./number-Dwuf17we.js";import{a as Ne,i as Pe,n as Fe,t as Ie}from"./inventoryHandoff-xYRtWHNk.js";import{mountStockAlertSummary as Le,stockAlertSummaryHtml as Re}from"./stockAlertsView-BxcRGbc9.js";import{t as ze}from"./activityDisplay-DKUvzoas.js";import{_ as Be,r as Ve}from"./closingChecksLogic-6nkG4QVk.js";import"./productionCoverage-B_UCz0VJ.js";import{findActionableClosingDate as He,getAllBlockingItems as Ue}from"./closingChecks-dphX6rLp.js";import{a as We,i as Ge,r as Ke,t as qe}from"./productionLoadPlan-DLQEWoVb.js";async function Je({db:e,logId:t,log:r,actualCount:i,staffName:a,date:o,uid:s}){let c=n(e,`activityLogs`,t),l=n(e,`meatStocks`,r.details?.repackedStockId);return Ae({db:e,operationId:`autoRepack_${t}`,actionType:`autoRepackConfirm`,date:o,request:{logId:t,actualCount:i,staffName:a,uid:s},readRefs:[c,l],build:async({writer:e})=>{let n=(await e.getDoc(c)).data();if(n.acknowledged===!0)throw Error(`이미 확인된 자동 재포장입니다.`);if(k(n.details)!==k(r.details))throw Error(`자동 재포장 원본이 변경되었습니다.`);let u=n.details,d=(await e.getDoc(l)).data();if(!Number.isSafeInteger(i)||i<0||!Number.isFinite(u.processedUnitWeightG)||u.processedUnitWeightG<=0||!Number.isFinite(u.surplusG)||u.surplusG<0||!a)throw Error(`재포장 실측값과 원본 중량을 확인해주세요.`);if(d.meatTypeId!==u.meatTypeId||d.stage!==`repacked`||d.status===`deleted`||!Number.isFinite(d.remaining)||d.remaining<0)throw Error(`재포장 lot 원본이 비정상입니다.`);let f=i*u.processedUnitWeightG,p=f-u.surplusG,m=d.remaining,h=m+p;if(!Number.isFinite(h)||h<0)throw Error(`보정 후 자동 재포장 잔량이 음수가 됩니다.`);p!==0&&(await e.updateDoc(l,{remaining:h,closed:i===0&&h===0,updatedAt:g()}),await e.recordMeatLog({type:`adjust`,date:o,meatTypeId:u.meatTypeId,meatNameSnapshot:u.meatName,stage:`repacked`,meatStockId:l.id,delta:p,before:m,after:h,staff:a,reason:`자동 재포장 실측 차이 확인`,batchId:`autoRepack_${t}`}),await e.recordActivity({action:`autoRepack`,subAction:`diff`,date:o,staff:a,message:`자동 재포장 차이 — ${u.meatName} 시스템 ${u.surplusG}g / 실제 ${f}g (${p>0?`+`:``}${p}g) — 담당: ${a}`,details:{meatTypeId:u.meatTypeId,meatName:u.meatName,repackedStockId:l.id,processedUnitWeightG:u.processedUnitWeightG,systemG:u.surplusG,actualCount:i,actualG:f,diffG:p,sourceLogId:t}})),await e.updateDoc(c,{acknowledged:!0,acknowledgedAt:g(),acknowledgedBy:a,acknowledgedByUid:s})}})}function Ye({today:e,nextBizDay:t,overdueNextBizDay:n,allProds:r,recipeRows:i,meatTypeRows:a,meatRows:o,eggStock:s,equipmentAlerts:c,completionDoc:l,overdueCompletionDoc:u,overdueClosing:d,blocks:f,calendar:p,logs:m}){let h=d?.date||null,g=e=>e?r.filter(t=>t.date===e&&t.status!==`deleted`):[];return{productions:g(e),nextProductions:g(t),recipes:i,meatTypeRows:a,meatStocks:o.filter(e=>!e.closed),eggStock:s,equipmentAlerts:c,completionDoc:l,overdueCompletionDoc:u,blockingData:f,overdueClosingDate:h,overdueClosingAlreadyClosed:!!d?.closed,overdueProductions:g(h),overdueNextProductions:g(n),...p,combinedLogs:m}}function Xe(e){return typeof e!=`object`||!e||typeof e.toMillis==`function`?e:e instanceof Date?new Date(e.getTime()):Array.isArray(e)?e.map(Xe):Object.fromEntries(Object.entries(e).map(([e,t])=>[e,Xe(t)]))}function Ze(){let e=new Map;return{run(t,n){if(!e.has(t)){let r=Promise.resolve().then(n);e.set(t,r),r.finally(()=>{e.get(t)===r&&e.delete(t)}).catch(()=>{})}return e.get(t)},clear(){e.clear()}}}function Qe(e){return typeof e!=`object`||!e?e:typeof e.toMillis==`function`?{$timestampMillis:e.toMillis()}:e instanceof Date?{$timestampMillis:e.getTime()}:Array.isArray(e)?e.map(Qe):Object.fromEntries(Object.keys(e).sort().map(t=>[t,Qe(e[t])]))}var $e=e=>JSON.stringify(Qe(e));function et(e,t){return typeof e!=`object`||!e?e:Object.keys(e).length===1&&Number.isFinite(e.$timestampMillis)?t(e.$timestampMillis):Array.isArray(e)?e.map(e=>et(e,t)):Object.fromEntries(Object.entries(e).map(([e,n])=>[e,et(n,t)]))}var tt=[`productions`,`nextProductions`,`overdueProductions`,`overdueNextProductions`,`calendarProductions`,`recipes`,`meatTypeRows`,`meatStocks`,`equipmentAlerts`,`calendarSchedules`,`calendarEvents`,`combinedLogs`];async function nt(e){let t=await crypto.subtle.digest(`SHA-256`,new TextEncoder().encode($e(e)));return Array.from(new Uint8Array(t),e=>e.toString(16).padStart(2,`0`)).join(``)}function rt(e,{date:t,logicVersion:n,allowShadow:r=!1}){return!!e&&e.schemaVersion===1&&!!n&&e.logicVersion===n&&e.date===t&&(e.readModelMode===`serve`||r&&e.readModelMode===`shadow`)&&e.rebuildState===`ready`&&Number.isSafeInteger(e.generation)&&e.generation>0&&typeof e.buildId==`string`&&e.requestedGeneration===e.generation&&Array.isArray(e.chunks)&&e.chunks.length<=100&&!!e.model}async function it(e,t,n){let r={...e.model},i=new Set,a=new Map;for(let e of tt)if(!Array.isArray(r[e]))throw Error(`summary-missing-section`);for(let n of e.chunks){if(!tt.includes(n.section)||typeof n.id!=`string`||n.id.includes(`/`)||n.id!==`${e.generation}__${e.buildId}__${n.section}__${n.index}`||i.has(n.id)||n.index!==(a.get(n.section)||0))throw Error(`summary-invalid-manifest`);i.add(n.id),a.set(n.section,n.index+1);let o=await t(n.id);if(!o||o.schemaVersion!==1||o.logicVersion!==e.logicVersion||o.buildId!==e.buildId||o.generation!==e.generation||o.section!==n.section||o.index!==n.index||!Array.isArray(o.payload)||o.payload.length!==n.rowCount||await nt(o.payload)!==n.payloadHash)throw Error(`summary-invalid-chunk`);r[n.section]=[...r[n.section],...o.payload]}if(await nt(r)!==e.modelHash)throw Error(`summary-invalid-model`);return et(r,n)}function at(){return se.viewMode===`summary`&&!ne()&&!0}var ot=new WeakMap;async function st(e){let t=ot.get(e);if(!t||t.epoch!==P.epoch)return!1;let r=await w.getDoc(n(v,`productionDashboardViews`,`v1__`+t.date),`main-summary`),i=r.exists()?r.data():null;return t.epoch===P.epoch&&rt(i,{date:t.date,logicVersion:`ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`})&&i.generation===t.generation&&i.buildId===t.buildId&&i.controlRevision===t.controlRevision}async function ct(e){if(!at())return null;let r=P.epoch;try{let i=await w.getDoc(n(v,`productionDashboardViews`,`v1__`+e),`main-summary`);if(r!==P.epoch)return null;let a=i.exists()?i.data():null;if(!rt(a,{date:e,logicVersion:`ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`}))return null;let o=await it(a,async r=>{let i=await t(n(v,`productionDashboardViews`,`v1__`+e,`chunks`,r));return i.exists()?i.data():null},e=>h.fromMillis(e)),s=await w.getDoc(n(v,`productionDashboardViews`,`v1__`+e),`main-summary`),c=s.exists()?s.data():null;return!rt(c,{date:e,logicVersion:`ac3cd78d47f19528409da0373f8bff9688e39e738e45eeb0060ad433fe8ae151`})||c.generation!==a.generation||c.buildId!==a.buildId||c.controlRevision!==a.controlRevision?null:(ot.set(o,{epoch:r,date:e,generation:a.generation,buildId:a.buildId,controlRevision:a.controlRevision}),r===P.epoch?o:null)}catch(e){if(e.code===`permission-denied`)throw e;return console.warn(`[메인 요약 대체]`,e.code||e.message),null}}async function lt({action:e,refs:t,p:r,target:i,result:o,method:s,emergency:c,staff:l,correctionReason:u}){if(c&&!c.reason?.trim())throw Error(`긴급 수정 사유를 입력해주세요.`);return e.submit(async e=>(c&&await M({roles:[`admin`,`office`]}),a(v,async a=>{let d=(await Promise.all(t.map(e=>a.get(n(v,e))))).map(e=>e.exists()?{id:e.id,...e.data()}:null);if(k(d)!==k(e))throw Error(`생산·입고·마감 조건이 변경되었습니다. 화면을 다시 열어주세요.`);if(d[3]?.status===`closed`&&!c)throw Error(`마감된 날짜입니다. 화면을 다시 열어주세요.`);let f=d.slice(4).filter(e=>e?.status===`completed`||e?.status===`입고완료`),p={};if(f.length){let e=[...f].sort((e,t)=>(t.revision||0)-(e.revision||0))[0],t=e.id,n=new Set,r=e;for(;r&&!n.has(r.id);)n.add(r.id),r=r.receiptMode===`adjustment`?f.find(e=>e.id===r.correctionOf):null;if(!e||f.some(e=>!n.has(e.id))||!Number.isFinite(e.actualBoxes??e.boxes))throw Error(`중복 완료되었거나 입고 이력이 불완전합니다. 재고앱에서 이력 확인·되돌리기 또는 중복 정리를 먼저 진행해주세요.`);let i=u||c?.reason;if(!i?.trim())throw Error(`입고 정정 사유를 입력해주세요.`);p={receiptMode:`adjustment`,correctionOf:t,basisBoxes:e.actualBoxes??e.boxes,basisRemainderPacks:e.actualRemainderPacks??e.remainderPacks??0,correctionReason:i.trim()}}let m=(r.receivedRevision||0)+1,h=`productions:${r.id}:${m}`,_=n(v,`productTransferRequests`,h);if((await a.get(_)).exists())throw Error(`이미 전송된 입고입니다. 저장 결과를 다시 확인해주세요.`);a.update(n(v,`productions`,r.id),{mutationToken:pe(),received:!0,receivedMethod:s,receivedPlates:o.plates,receivedLoosePacks:o.loose,receivedTotalPacks:o.totalPacks,receivedBox:o.boxes,receivedRemainder:o.remainder,receivedRevision:m,receivedAt:g(),updatedAt:g()}),a.set(_,{idempotencyKey:h,sourceApp:`production`,sourceCollection:`productions`,sourceId:r.id,eventType:`productReceipt`,revision:m,supersedesRevision:m>1?m-1:null,...p,status:`pending`,category:`raw`,recipeId:r.recipeId,recipeName:r.recipeName,target:i,plates:o.plates,packs:o.totalPacks,boxes:o.boxes,remainderPacks:o.remainder,producedDate:r.date,staff:r.staffName||``,createdAt:g()}),c&&await A({action:`production`,subAction:`receiptEmergencyEdit`,date:F(),staff:l,message:`마감된 입고 수량 긴급 수정 — ${r.date} ${r.recipeName} ${r.receivedTotalPacks??`-`}팩 → ${o.totalPacks}팩 / 사유: ${c.reason} / 담당: ${l}`,details:{productionId:r.id,producedDate:r.date,recipeId:r.recipeId,recipeName:r.recipeName,beforeTotalPacks:r.receivedTotalPacks??null,afterTotalPacks:o.totalPacks,beforePlates:r.receivedPlates??null,afterPlates:o.plates,beforeLoosePacks:r.receivedLoosePacks??null,afterLoosePacks:o.loose,beforeMethod:r.receivedMethod??null,afterMethod:s,revision:m,reason:c.reason}},{batch:a})})))}async function ut({db:e,productionId:t,date:r,productName:i,qty:o,staffName:s,isTender:c,mutationToken:l}){if(!Number.isFinite(o)||o<=0)throw Error(`입고 수량은 유한한 양수여야 합니다.`);if([t,r,i,s,l].some(e=>typeof e!=`string`||!e.trim()))throw Error(`생산 정보와 입고 날짜, 품목, 담당자, 저장 정보를 확인해주세요.`);let u=new Date,d=n(e,`productions`,t),f=n(e,`closings`,r),p=n(_(e,c?`frozenPanLots`:`breadPanLots`)),m=n(_(e,c?`frozenPanLogs`:`breadPanLogs`)),h=c?n(_(e,`stockLedger`)):null;return a(e,async e=>{let t=await e.get(d),n=t.data();if(!t.exists()||n.status===`deleted`||n.date!==r)throw Error(`생산 정보가 변경되었습니다. 화면을 다시 열어주세요.`);if(n.received===!0){if(n.receivedLotId===p.id)return{lotId:p.id,alreadyCompleted:!0};throw Object.assign(Error(`이미 다른 화면에서 입고 처리된 생산입니다. 화면을 새로고침해 입고 내용을 확인해주세요.`),{code:`freezeDryReceipt/already-received`})}let a=await e.get(f);if(a.exists()&&a.data().status===`closed`)throw Error(`마감된 날짜에는 입력할 수 없습니다.`);return e.set(p,{productName:i,date:r,staffName:s,initialQty:o,remaining:o,closed:!1,...c?{source:`tenderIn`,sourceRefId:m.id}:{},note:null,createdAt:u,updatedAt:u}),e.set(m,{type:c?`tenderIn`:`incoming`,date:r,productName:i,qty:o,before:0,after:o,lotId:p.id,...c?{}:{lotDate:r,expectedFrozenQty:null,actualFrozenQty:null,diff:null},staffName:s,uid:null,note:null,reason:null,batchId:null,ledgerId:null,timestamp:u}),c&&e.set(h,{actionType:`frozenPanTenderIn`,actionId:m.id,timestamp:u,date:r,status:`active`,items:[{collection:`frozenPanLots`,docId:p.id,field:`remaining`,delta:o,before:0,after:o,label:`${i} 동결판(텐더동결 입고)`,stockUpdatedAtSnapshot:u,isNewDoc:!0}]}),e.update(d,{received:!0,receivedFreezeType:c?`frozenPan`:`breadPan`,mutationToken:l,receivedFreezeQty:o,receivedLotId:p.id,receivedAt:g(),updatedAt:g()}),{lotId:p.id,alreadyCompleted:!1}})}var L=we(`main`),dt=null,ft=Ze(),pt,mt=!0;P.onClear(()=>{mt=!0,gt=[],ft.clear(),clearTimeout(pt)});var ht=[],R=[],z=[],gt=[],_t=[],vt=new Map,yt={currentQty:0,minimumQty:0},B=null,bt={totalBlocked:0,items:[]},V=null,xt=!1,St=[],Ct=[],wt=null,Tt=[],Et=[],Dt=[],H=0,U=null,W=[],Ot=null,kt=0,At=null,G=null,K=null,jt=null;function q(e){e&&(e.closed=!0,e.unsubscribe?.(),G===e&&(G=null),K===e&&(K=null))}function Mt(e,t,n){let r={date:e,closed:!1,version:0,loading:!0,displayedSignature:null,latestSignature:null};return r.unsubscribe=c(i(_(v,`productions`),o(`date`,`==`,e)),{includeMetadataChanges:!1},e=>{r.closed||n!==P.epoch||!t?.isCurrent()||e.metadata.fromCache||e.metadata.hasPendingWrites||(r.latestSignature=k(e.docs.map(e=>({id:e.id,...e.data()}))),r.version++,G===r&&!r.loading&&r.latestSignature!==r.displayedSignature&&jt?.({}))},e=>{if(r.closed||n!==P.epoch||!t?.isCurrent())return;let i=G===r;r.error=e,q(r),e.code===`permission-denied`?(P.clear(),t.host.replaceChildren(),t.host.textContent=`접근 권한을 다시 확인하려면 새로고침해주세요.`):i&&jt?.({error:e})}),r}P.onClear(()=>{kt++,q(K),q(G),U=null,W=[],Ot=null});async function Nt(e){if(!/^\d{4}-\d{2}-\d{2}$/.test(e)||!Number.isFinite(Date.parse(e))||new Date(e).toISOString().slice(0,10)!==e)throw Error(`날짜를 확인해주세요.`);let t=++kt,n=S(),r=P.epoch,a=()=>t===kt&&r===P.epoch&&(!n||n.isCurrent())&&me===`main`;q(K);let s=G?.date===e?G:Mt(e,n,r),c=s!==G;c&&(K=s);let l=s.version,u=E(),d,f;try{[d,f]=await Promise.all([u.getDocs(i(_(v,`productions`),o(`date`,`==`,e))),Ue(e,u)])}catch(e){if(c&&q(s),!a())return!1;throw e}if(!a())return c&&q(s),!1;if(s.closed)throw s.error||Error(`선택 날짜 조회를 다시 시도해주세요.`);return c&&(q(G),G=s,K=null),s.displayedSignature=k(d.docs.map(e=>({id:e.id,...e.data()}))),s.loading=!1,U=e,W=d.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status!==`deleted`).sort((e,t)=>(e.sortOrder||0)-(t.sortOrder||0)||e.id.localeCompare(t.id)),Ot=f,Y(),s.version>l&&s.latestSignature!==s.displayedSignature&&setTimeout(()=>{G===s&&jt?.({})},0),!0}function Pt(){if(me!==`main`)return;$(`<h3 class="modal-title">생산 날짜 선택</h3>
    <p>선택한 날짜의 생산과 입고 내역을 조회합니다. 마감과 상단 재고 현황은 오늘 기준입니다.</p>
    <input type="date" id="productionDateInput" value="${U||F()}" aria-label="생산 조회 날짜" />
    <p id="productionDateError" role="alert"></p>
    <div class="modal-actions"><button class="btn-secondary" id="productionDateCancel">취소</button><button class="btn-primary" id="productionDateConfirm">조회</button></div>`);let e=document.getElementById(`modalOverlay`);document.getElementById(`productionDateCancel`).addEventListener(`click`,()=>{kt++,q(K),e.remove()}),document.getElementById(`productionDateConfirm`).addEventListener(`click`,async t=>{let n=t.currentTarget;if(!n.disabled){n.disabled=!0;try{await Nt(document.getElementById(`productionDateInput`).value)&&e.remove()}catch(t){e.isConnected&&(document.getElementById(`productionDateError`).textContent=y(t))}finally{n.disabled=!1}}})}function Ft(e){return e?.category===`freezeDry`&&e.requiresSeparation===!1}function It(e){let t=[`<span>${N(e.freezeDryBagQty||0)}봉</span>`];return Ft(e)||t.push(`<span>${N(e.breadPanQty||0)}빵판</span>`),t.push(`<span>${N(e.freezePanQty||0)}동결판</span>`),t.join(``)}var Lt=[],Rt=[];async function zt({scope:e=ae()}={}){if(L.prepare)return qr();let t=re(`main`);t&&(e=T(`main`));let n=document.getElementById(`mainContent`);n.innerHTML=`<div style="padding:24px;"><p>메인 로딩 중...</p></div>`,U=null,W=[],Ot=null;let r=t&&!mt&&P.peek(`main:model`);if(r)Kt(r.model);else if(!await J(e))return;if(t){let e=({error:e}={})=>{if(mt=!0,clearTimeout(pt),e){e.code===`permission-denied`?(P.clear(),n.innerHTML=`<p>접근 권한을 다시 확인하려면 새로고침해주세요.</p>`):Bt(n);return}pt=setTimeout(async()=>{if(!(me!==`main`||document.getElementById(`mainContent`)!==n)&&!(document.querySelector(`.modal-overlay`)||U))try{await J(T(`main`))&&Y()}catch(e){e.code===`permission-denied`?(P.clear(),n.replaceChildren()):(console.error(`[메인 갱신 실패]`,e),Bt(n))}},120)};w.onChange(`main`,e),w.onChange(`main-summary`,e);let t=new MutationObserver(()=>{mt&&!document.querySelector(`.modal-overlay`)&&e()});t.observe(document.body,{childList:!0}),ye(()=>{t.disconnect(),clearTimeout(pt)})}me!==`main`||document.getElementById(`mainContent`)!==n||(Y(),kr())}function Bt(e){if(!e.isConnected||e.querySelector(`[data-refresh-error]`))return;let t=document.createElement(`div`);t.dataset.refreshError=`true`,t.textContent=`최신 정보를 확인하지 못했습니다. 표시된 내용은 이전 자료입니다. `;let n=document.createElement(`button`);n.className=`btn-secondary`,n.textContent=`다시 불러오기`,n.addEventListener(`click`,async()=>{if(!n.disabled){n.disabled=!0;try{mt=!0,L.prepare?await qr({force:!0}):Ce()}catch(e){t.isConnected&&(t.firstChild.textContent=`최신 정보를 확인하지 못했습니다: ${y(e)} `)}finally{n.disabled=!1}}}),t.appendChild(n),e.prepend(t)}var Vt=0;function Ht(e){return e.filter(e=>e.sortOrder!==void 0).sort((e,t)=>e.sortOrder<t.sortOrder?-1:e.sortOrder>t.sortOrder?1:e.id<t.id?-1:+(e.id>t.id))}async function Ut(e,t){let n=[...new Set(e.filter(Boolean))];return n.length?Ht((await t.getDocs(i(_(v,`productions`),o(`date`,`in`,n)))).docs.map(e=>({id:e.id,...e.data()}))):[]}function Wt(...e){return Ht([...new Map(e.flat().map(e=>[e.id,e])).values()])}async function Gt(){let e=E(),t=F(),[r,a,s]=await Promise.all([e.getDocs(i(_(v,`activityLogs`),o(`date`,`==`,t))),e.getDoc(n(v,`eggStock`,`global`)),_e(t,e)]),c=ue(r.docs.map(e=>({id:e.id,...e.data()})));if(await ir(t,c,e,{eggStock:a.exists()?a.data():{},equipmentAlerts:s}),c.pendingIds().length)throw Error(`새 자동 알림을 확인해야 합니다. 메인을 다시 불러온 후 처리해주세요.`)}async function J(e=E(),{autoLogsEnabled:t=!0}={}){L.prepare&&L.invalidate();let r=++Vt,a=document.getElementById(`mainContent`),s=()=>r===Vt&&a===document.getElementById(`mainContent`),c=F();if(await ie(e),e.displayOwner===`main`&&H===0&&at()){let r=await ct(c);if(!s())return!1;if(r){let[a,l,u]=await Promise.all([e.getDocs(i(_(v,`activityLogs`),o(`date`,`==`,c))),e.getDoc(n(v,`eggStock`,`global`)),_e(c,e)]),d={eggStock:l.exists()?l.data():{},equipmentAlerts:u},f=ue(a.docs.map(e=>({id:e.id,...e.data()}))),p=t?await ft.run(`main:`+c,async()=>(await ir(c,f,e,d),s()?f.flush():{createdIds:[],existingIds:[],failedIds:[]})):{createdIds:[],existingIds:[],failedIds:[]};if(!s())return!1;if(p.failedIds.length)throw Error(`일부 자동 알림을 저장하지 못했습니다. 다시 불러와주세요.`);return p.createdIds.length||p.existingIds.length||!await st(r)?J(E(),{autoLogsEnabled:!1}):s()?(r.supplementTypeRows=d.supplementTypeRows||[],Kt(r),mt=!1,P.publish(`main:model`,{model:r}),!0):!1}}let l=Sn(e);l.catch(()=>{}),e.getDocs(i(_(v,`events`),o(`date`,`==`,c))).catch(()=>{}),e.getDocs(i(_(v,`schedules`),o(`date`,`==`,c))).catch(()=>{});let u=e.getDocs(i(_(v,`supplementTypes`),o(`active`,`==`,!0))).catch(()=>null);e.getDocs(_(v,`supplementStock`)).catch(()=>{});let d=j(c),f=Ut([c,d],e),p=He(c,null,e),[m,h,g,y,ee,b,x,te,S]=await Promise.all([f,e.getDocs(_(v,`recipes`)),e.getDocs(_(v,`meatTypes`)),e.getDocs(_(v,`meatStocks`)),e.getDoc(n(v,`eggStock`,`global`)),e.getDoc(n(v,`productionCompletion`,c)),p,Xt(H,e),e.once(`equipmentAlerts:`+c,()=>_e(c,e))]);if(!s())return!1;let C=x?.date||null,[w,T,ne]=await Promise.all([C?e.getDoc(n(v,`productionCompletion`,C)):null,x?.blockingData||Ue(c,e),C?Ut([C,j(C)],e):[]]),D=Wt(m,ne);if(!s())return!1;let ae={eggStock:ee.exists()?ee.data():{currentQty:0,minimumQty:0},equipmentAlerts:S},O=ue((await e.getDocs(i(_(v,`activityLogs`),o(`date`,`==`,c)))).docs.map(e=>({id:e.id,...e.data()})));if(!s())return!1;let oe=t?await ft.run(`main:`+c,async()=>(await ir(c,O,e,ae),s()?O.flush():{createdIds:[],existingIds:[],failedIds:[]})):{createdIds:[],existingIds:[],failedIds:[]};if(oe.failedIds.length)throw Error(`일부 자동 알림을 저장하지 못했습니다. 다시 불러와주세요.`);let k=await l;(oe.createdIds.length||oe.existingIds.length)&&(k=[...(await E().getDocs(i(_(v,`activityLogs`),o(`date`,`==`,c)))).docs.map(e=>({id:e.id,...e.data()})),...k.filter(e=>e.date!==c)].sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0)));let se=await u;if(!s())return!1;let ce=e=>e.docs.map(e=>({id:e.id,...e.data()})),le=e=>e?.exists()?{id:e.id,...e.data()}:null,A=Ye({today:c,nextBizDay:d,overdueNextBizDay:C?j(C):null,allProds:D,recipeRows:ce(h),meatTypeRows:ce(g),meatRows:ce(y),eggStock:ae.eggStock,equipmentAlerts:S,completionDoc:le(b),overdueCompletionDoc:le(w),overdueClosing:x,blocks:T,calendar:te,logs:k});return A.supplementTypeRows=se?ce(se):[],Kt(A),mt=!1,re(`main`)&&P.publish(`main:model`,{model:A}),!0}function Kt(e,{detached:t=!1}={}){let n=t?e:Xe(e);gt=n.supplementTypeRows||[],{productions:ht,nextProductions:R,recipes:z,meatStocks:_t,eggStock:yt,completionDoc:B,blockingData:bt,overdueClosingDate:V,overdueClosingAlreadyClosed:xt,overdueProductions:St,overdueNextProductions:Ct,overdueCompletionDoc:wt,calendarSchedules:Tt,calendarProductions:Et,calendarEvents:Dt,combinedLogs:Lt,equipmentAlerts:Rt}=n,vt=new Map(n.meatTypeRows.map(e=>[e.id,e.category===`produce`?`produce`:`meat`]))}function Y(){if(Ie(),me!==`main`)return;let e=document.getElementById(`mainContent`),t=F(),n=j(t),r=B?.status===`completed`,i=I===`admin`||I===`office`,a=U!==null,o=!a&&V!==null,s=a&&Ot?Ot:bt,c=xt?`마감 후 미처리 확인 필요`:`미마감 처리 필요`,l=a?W:o?St:r?R:ht,u=a?`${U} 생산 (선택 날짜)`:o?`${V} 생산 (${c})`:r?`불러온 다음 영업일 생산 (${n})`:`오늘 생산`,d=a?`🥩 ${U} 출고원료`:o?`🥩 ${V} 출고원료`:`🥩 금일 출고원료`,f=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],p=a?U:o?V:r?n:t,m=new Date(p+`T00:00:00`),h=`${m.getMonth()+1}/${m.getDate()} (${f[m.getDay()]})`;e.innerHTML=`
    ${qt()}
    <div class="main-layout">
      <div class="main-panel-left">
        <div class="main-panel-header">
          <button type="button" id="btnProductionDate" class="main-panel-title main-date-button" title="생산 날짜 선택">📅 ${h} 생산${a?` <span style="font-size:11px;color:#3182ce;font-weight:normal;">(선택 날짜)</span>`:``}${o?` <span style="font-size:11px;color:#c53030;font-weight:normal;">(${c})</span>`:``}</button>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-secondary" id="btnBigView" style="font-size:11px;padding:3px 10px;">크게보기</button>
            <button class="btn-secondary" id="btnTodayReceiptSummary" style="font-size:11px;padding:3px 10px;">입고 현황 전체 보기</button>
            ${a?`
                <button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;opacity:0.5;cursor:not-allowed;" disabled title="오늘 화면에서만 가능">내일생산불러오기</button>
                <button class="btn-secondary" id="btnBackToToday" style="font-size:11px;padding:3px 10px;color:#3182ce;">↩ 오늘로 돌아가기</button>
              `:o?wt?.status===`completed`?`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;opacity:0.5;cursor:not-allowed;" disabled title="이미 처리되었습니다">이미 처리됨</button>`:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${Ct.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기 (${V} 소급)</button>`:r?`
                  ${i?`<button class="btn-secondary" id="btnRefreshCompletion" style="font-size:11px;padding:3px 10px;color:#3182ce;" title="차감 복원 후 변경된 생산 기준으로 다시 차감">새로고침</button>`:``}
                  <button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>
                `:`<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${R.length===0?`disabled title="다음 영업일에 등록된 생산이 없습니다"`:``}>내일생산불러오기</button>`}
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${u}</span>
            ${r&&!a&&!o?`<span class="main-completed-pill">내일생산불러오기 완료</span>`:``}
          </div>
          <div class="main-production-grid">
            ${l.length===0?`<div class="main-empty">${a?`선택한 날짜에 생산 없음`:o?`처리 필요 날짜에 생산 없음`:r?`불러온 다음 영업일 생산 없음`:`오늘 생산 없음`}</div>`:l.map(e=>or(e)).join(``)}
          </div>
        </div>
      </div>

      <!-- [묶음 6A] 우상단 = 2번(원육) + 3번(로그) 가로 분할 -->
      <div class="main-panel-right-top">
        <div class="main-panel-2">
          <div class="main-panel-header">
            <span class="main-panel-title">${d}</span>
          </div>
          <div style="padding:8px;font-size:12px;">
            ${Dr(l,r&&!a)}
          </div>
        </div>

        <!-- 3번 화면 = 차단 영역 + 생산 로그 + 사무 로그 -->
        <div class="main-panel-3">
          ${Cn(s)}
          <div class="main-log-columns">
            ${wn(`production`)}
            ${wn(`office`)}
          </div>
        </div>
      </div>

      <!-- [묶음 6B-1] 우하단 = 4번 캘린더 -->
      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">📆 2주 캘린더</span>
        </div>
        <div class="main-calendar-body">
          ${Zt()}
        </div>
      </div>
    </div>
  `,document.getElementById(`btnBigView`)?.addEventListener(`click`,Hr),Pe({sourceCollection:`productions`,role:I,showModal:$,closeModal:()=>window.closeModal(),onComplete:()=>zt()}),document.querySelectorAll(`[data-receipt-edit]`).forEach(e=>e.addEventListener(`click`,t=>{t.stopPropagation(),pr(e.dataset.receiptEdit).catch(e=>alert(y(e)))})),document.querySelectorAll(`[data-receipt-cancel]`).forEach(e=>e.addEventListener(`click`,t=>{t.stopPropagation(),Ne({sourceCollection:`productions`,sourceId:e.dataset.receiptCancel,mode:`cancel`,showModal:$,closeModal:()=>window.closeModal(),onComplete:()=>zt()}).catch(e=>alert(y(e)))})),document.getElementById(`btnTodayReceiptSummary`)?.addEventListener(`click`,()=>cr(l,p)),document.getElementById(`btnTomorrowLoad`)?.addEventListener(`click`,()=>Pr(o?V:void 0)),document.getElementById(`btnCancelCompletion`)?.addEventListener(`click`,zr),document.getElementById(`btnRefreshCompletion`)?.addEventListener(`click`,Br),document.getElementById(`btnProductionDate`)?.addEventListener(`click`,Pt),document.getElementById(`btnBackToToday`)?.addEventListener(`click`,Vr),(I===`admin`||I===`office`||I===`production`)&&(o||a||!r)&&document.querySelectorAll(`.main-production-card.receivable`).forEach(e=>{e.style.cursor=`pointer`,e.title=`클릭하여 제품 입고`,e.addEventListener(`click`,()=>{[...W,...St,...ht,...R].find(t=>t.id===e.dataset.id)?.category===`freezeDry`?hr(e.dataset.id):pr(e.dataset.id)})}),document.querySelectorAll(`.alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{if(e.dataset.supplementIds){gn(e.dataset.supplementIds.split(`,`));return}if(e.dataset.refreshDate){Br(e.dataset.refreshDate);return}if([4,5,6].includes(Number(e.dataset.blocker))){Wn(e.dataset.date,Number(e.dataset.blocker));return}let t=e.dataset.jump;he(t),Ce()})}),en(),jn()}function qt(){if(I===`production`)return``;let e=de(F());return e?`
    <div class="holiday-data-notice holiday-data-notice--${e.level}">
      ${e.message}
    </div>
  `:``}function Jt(e=0){let t=new Date(F()+`T00:00:00`),n=(t.getDay()+6)%7,r=new Date(t);r.setDate(r.getDate()-n+e*7);let i=[];for(let e=0;e<14;e++){let t=new Date(r);t.setDate(t.getDate()+e);let n=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,`0`),o=String(t.getDate()).padStart(2,`0`);i.push(`${n}-${a}-${o}`)}return{dates:i,startDate:i[0],endDate:i[13]}}async function Yt(e=0){let t=await Xt(e);({calendarSchedules:Tt,calendarProductions:Et,calendarEvents:Dt}=t)}async function Xt(e=0,t=ae()){let{startDate:n,endDate:r}=Jt(e),a=e=>i(_(v,e),o(`date`,`>=`,n),o(`date`,`<=`,r)),[s,c,l]=await Promise.all([t.getDocs(a(`schedules`)),t.getDocs(a(`productions`)),t.getDocs(a(`events`)).catch(e=>(e.code!==`cache-miss`&&console.warn(`[캘린더] events 컬렉션 로드 실패:`,e.message),null))]);return{calendarSchedules:s.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status===`scheduled`),calendarProductions:c.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.status!==`deleted`),calendarEvents:l?l.docs.map(e=>({id:e.id,...e.data()})):[]}}function Zt(){let{dates:e}=Jt(H),t=F(),n=te(),r=ce();return`
    <div class="cal-container">
      <div class="cal-toolbar">
        <button class="cal-nav-btn" id="btnCalPrev" title="이전 주">◀</button>
        <span class="cal-range-label">${nn(e[0],e[13])}</span>
        <button class="cal-nav-btn" id="btnCalNext" title="다음 주">▶</button>
        ${H===0?``:`<button class="cal-today-btn" id="btnCalToday">오늘로</button>`}
      </div>
      <div class="cal-weekday-row">
        ${[`월`,`화`,`수`,`목`,`금`,`토`,`일`].map((e,t)=>`<div class="cal-weekday ${t>=5?`cal-weekday-weekend`:``}">${e}</div>`).join(``)}
      </div>
      <div class="cal-grid">
        ${e.map(e=>Qt(e,t,n,r)).join(``)}
      </div>
    </div>
  `}function Qt(e,t,n,r){let i=(new Date(e+`T00:00:00`).getDay()+6)%7>=5,a=r[e]||null,o=r[$t(e,1)]||null,s=!i&&a?.affectsProduction!==!0&&(a?.affectsShipping===!0||o?.affectsShipping===!0&&o.shippingClosedFromEnabled===!0),c=!s&&(i||a?.affectsProduction===!0||!a&&n.includes(e)),l=e===t,u=Dt.filter(t=>t.date===e),d=Tt.filter(t=>t.date===e),f=Et.filter(t=>t.date===e),p=[];u.forEach(e=>{let t=e.title||``;p.push(`<div class="cal-tag cal-tag-event" title="${X(t)}">📌 ${X(t)}</div>`)}),d.forEach(e=>{let t=rn(e);p.push(`<div class="cal-tag cal-tag-schedule" title="${X(t)}">📦 ${X(t)}</div>`)}),f.slice(0,3).forEach(e=>{let t=e.productionUnitQty==null?``:` ${wr(e.productionUnitQty)}${br(e)}`,n=`${e.recipeName||``}${t}`;p.push(`<div class="cal-tag cal-tag-production" title="${X(n)}">🏭 ${X(n)}</div>`)}),f.length>3&&p.push(`<div class="cal-tag-more">+${f.length-3}</div>`);let m=e.split(`-`),h=parseInt(m[2],10),g=h===1?`${parseInt(m[1],10)}/${h}`:String(h),_=s?`배송불가일`:``;return`
    <div class="${[`cal-cell`,c?`cal-cell-holiday`:``,s?`cal-cell-shipping-closed`:``,l?`cal-cell-today`:``].filter(Boolean).join(` `)}" data-date="${e}">
      <div class="cal-cell-date-row">
        <span class="cal-cell-date">${g}</span>
        ${_?`<span class="cal-shipping-closed-label">(${_})</span>`:``}
      </div>
      <div class="cal-cell-tags">${p.join(``)}</div>
    </div>
  `}function $t(e,t){let n=new Date(e+`T00:00:00`);return n.setDate(n.getDate()+t),`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,`0`)}-${String(n.getDate()).padStart(2,`0`)}`}function en(){document.getElementById(`btnCalPrev`)?.addEventListener(`click`,()=>{--H,tn()}),document.getElementById(`btnCalNext`)?.addEventListener(`click`,()=>{H+=1,tn()}),document.getElementById(`btnCalToday`)?.addEventListener(`click`,()=>{H=0,tn()}),document.querySelectorAll(`.cal-cell`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.date;t&&an(t)})})}async function tn(){await Yt(H);let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=Zt(),en())}function nn(e,t){let n=e.split(`-`),r=t.split(`-`);return`${parseInt(n[1])}/${parseInt(n[2])} ~ ${parseInt(r[1])}/${parseInt(r[2])}`}function rn(e){let t=e.itemNameSnapshot||``,n=e.orderedQty==null?``:e.orderedQty,r=e.orderedUnit||``;return e.type===`egg`?`계란 ${n}${r}`:e.type===`meat`?`${t||`원육`} ${n}${r}`:e.type===`bag`?`${t||`봉투`} ${n}${r}`:`${t} ${n}${r}`}function an(e){let t=I===`admin`||I===`office`,n=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],r=new Date(e+`T00:00:00`),i=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${n[r.getDay()]})`,a=te(),o=r.getDay(),s=o===0||o===6,c=a.includes(e),l=s||c?`<span class="cal-modal-holiday-pill">휴일</span>`:``,u=Dt.filter(t=>t.date===e),d=Tt.filter(t=>t.date===e),f=Et.filter(t=>t.date===e),p=u.length===0?`<div class="cal-modal-empty">등록된 이벤트 없음</div>`:u.map(e=>`
        <div class="cal-modal-list-item cal-event-item" data-event-id="${N(e.id)}">
          <div class="cal-event-row">
            <span class="cal-event-title">📌 ${X(e.title||``)}</span>
            ${t?`
              <span class="cal-event-actions">
                <button class="cal-event-btn" data-event-act="edit" data-event-id="${N(e.id)}">수정</button>
                <button class="cal-event-btn cal-event-btn-danger" data-event-act="delete" data-event-id="${N(e.id)}">삭제</button>
              </span>
            `:``}
          </div>
          ${e.content?`<div class="cal-modal-list-sub">${X(e.content)}</div>`:``}
        </div>
      `).join(``),m=d.length===0?`<div class="cal-modal-empty">예정 없음</div>`:d.map(e=>`<div class="cal-modal-list-item">📦 ${X(rn(e))}</div>`).join(``),h=f.length===0?`<div class="cal-modal-empty">생산 없음</div>`:f.map(e=>{let t=e.batchNo?` <span style="color:#888;">(${N(e.batchNo)}차)</span>`:e.round>1?` <span style="color:#888;">(${N(e.round)}회차)</span>`:``;return`<div class="cal-modal-list-item">🏭 ${X(e.recipeName||``)}${t}</div>`}).join(``),g;g=s?`<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;">
         <input type="checkbox" checked disabled> 휴일 (토/일은 자동)
       </label>`:t?`<label class="cal-holiday-toggle">
         <input type="checkbox" id="chkManualHoliday" ${c?`checked`:``}> 이 날을 휴일로 지정
       </label>`:`<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;" title="대표/사무실만 변경 가능">
         <input type="checkbox" ${c?`checked`:``} disabled> 이 날을 휴일로 지정
       </label>`,$(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${i} ${l}</h3>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">📌 이벤트</div>
      ${p}
    </div>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">📦 입고 예정</div>
      ${m}
    </div>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">🏭 생산</div>
      ${h}
    </div>

    <div class="cal-modal-section" style="border-top:1px solid #eee;padding-top:8px;">
      ${g}
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;">
      ${t?`<button class="btn-secondary" id="btnAddEvent">+ 이벤트 추가</button>`:`<span style="color:#888;font-size:12px;align-self:center;">이벤트 등록은 대표/사무실만 가능</span>`}
      ${f.length>0?`<button class="btn-secondary" id="btnViewThisDate">이 날짜로 보기</button>`:`<button class="btn-secondary" disabled title="생산 없음" style="opacity:0.5;cursor:not-allowed;">이 날짜로 보기</button>`}
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.getElementById(`btnAddEvent`)?.addEventListener(`click`,()=>{sn(e,null)}),document.querySelectorAll(`[data-event-act]`).forEach(t=>{t.addEventListener(`click`,async n=>{let r=t.dataset.eventAct,i=t.dataset.eventId;r===`edit`?sn(e,i):r===`delete`&&await ln(i,e)})}),document.getElementById(`chkManualHoliday`)?.addEventListener(`change`,async t=>{await un(e,t.target.checked)}),document.getElementById(`btnViewThisDate`)?.addEventListener(`click`,async()=>{try{await Nt(e)&&closeModal()}catch(e){alert(y(e))}})}function X(e){return String(e??``).replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function on(e){return Number(e||0).toLocaleString(`ko-KR`)}async function sn(e,t){let n;try{n=await M({refs:t?[`events/`+t]:[`holidays/`+e],roles:[`admin`,`office`]})}catch(e){alert(y(e));return}let r=!!t,i=r?n.values[0]:null;if(r&&!i){alert(`삭제된 이벤트입니다. 다시 불러와주세요.`);return}let a=i?.title||``,o=i?.content||``,s=[`일`,`월`,`화`,`수`,`목`,`금`,`토`],c=new Date(e+`T00:00:00`),l=`${parseInt(e.split(`-`)[1])}월 ${parseInt(e.split(`-`)[2])}일 (${s[c.getDay()]})`;$(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${r?`이벤트 수정`:`이벤트 등록`} — ${l}</h3>

    <div style="margin-bottom:10px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">제목 (필수)</label>
      <input type="text" id="evTitle" maxlength="50" value="${X(a)}"
             style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">내용 (선택)</label>
      <textarea id="evContent" rows="3" maxlength="300"
                style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;resize:vertical;">${X(o)}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      ${r?`<button class="btn-secondary" id="btnEvDelete" style="color:#c92a2a;border-color:#ffc9c9;">삭제</button>`:``}
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnEvSave">${r?`저장`:`등록`}</button>
    </div>
  `),setTimeout(()=>document.getElementById(`evTitle`)?.focus(),50),document.getElementById(`btnEvSave`)?.addEventListener(`click`,async()=>{let r=document.getElementById(`evTitle`).value.trim(),i=document.getElementById(`evContent`).value.trim();if(!r){alert(`제목을 입력해주세요.`);return}let a=document.getElementById(`btnEvSave`);a.disabled=!0;try{await n.submit(()=>cn({id:t,date:e,title:r,content:i}))}catch(e){alert(y(e))}finally{a.disabled=!1}}),r&&document.getElementById(`btnEvDelete`)?.addEventListener(`click`,async()=>{await b({title:`이벤트 삭제`,message:`"${a}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`})&&await ln(t,e)})}async function cn({id:e,date:t,title:r,content:i}){try{e?await s(n(v,`events`,e),{title:r,content:i||``,updatedAt:g()}):await u(_(v,`events`),{date:t,title:r,content:i||``,createdAt:g()}),closeModal(),await Yt(H),dn(),an(t)}catch(e){console.error(`[6B-2] 이벤트 저장 실패:`,e),alert(`저장 중 오류가 발생했습니다.`)}}async function ln(e,t){let r;try{r=await M({refs:[`events/`+e],roles:[`admin`,`office`]})}catch(e){alert(y(e));return}let i=r.values[0];if(i&&await b({title:`이벤트 삭제`,message:`"${i.title||`(제목 없음)`}" 이벤트를 삭제하시겠습니까?`,confirmText:`삭제`,cancelText:`취소`}))try{await r.confirm(),await f(n(v,`events`,e)),closeModal(),await Yt(H),dn(),an(t)}catch(e){console.error(`[6B-2] 이벤트 삭제 실패:`,e),alert(`삭제 중 오류가 발생했습니다.`)}}async function un(e,t){try{await(await M({refs:[`holidays/`+e],roles:[`admin`,`office`]})).confirm(),t?await d(n(v,`holidays`,e),{date:e,holidayType:`internalOff`,title:`수동 휴일`,label:`수동 휴일`,affectsProduction:!0,affectsShipping:!0,shippingClosedFromEnabled:!0,isAutoGenerated:!1,status:`active`,createdAt:g(),updatedAt:g()}):await d(n(v,`holidays`,e),{date:e,status:`deleted`,updatedAt:g(),deletedAt:g()},{merge:!0}),await ve(),dn()}catch(e){console.error(`[6B-2] 휴일 토글 실패:`,e),alert(`휴일 설정 중 오류가 발생했습니다.`)}}function dn(){let e=document.querySelector(`.main-calendar-body`);e&&(e.innerHTML=Zt(),en())}var fn=[`bag`,`egg`,`meat`,`frozenProduct`,`frozenSep`,`schedule`,`frozenPan`,`closing`,`supplementStock`,`recipe`,`settings`,`holiday`,`conversion`,`equipment`],pn=[`production`,`repackaging`,`pretreat`,`event`,`scheduleDue`,`autoRepack`,`minStock`,`frozenStockLow`,`partDue`],mn={"production:receiptEmergencyEdit":`office`,"meat:adjust":`production`},hn=!1;async function gn(e){if(!hn){hn=!0;try{try{await ur()}catch(e){alert(y(e));return}let t=P.epoch,n=be?.uid,r=async()=>{if(!n||be?.uid!==n||P.epoch!==t)throw Error(`로그인 상태가 변경됐습니다. 새로고침해주세요.`)},i=0,a=0,o=[];for(let t of[...new Set(e)])try{let e=[...ht,...R,...St,...Ct,...W].find(e=>e.id===t),{runProductionSupplement:s}=await Te(async()=>{let{runProductionSupplement:e}=await import(`./productionSupplementLoad-DEzF9wR-.js`);return{runProductionSupplement:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10])),c=await s({db:v,productionId:t,today:F(),staffName:e?.staffName||fr(),uid:n,assertCurrent:r,recordMeatLog:ke,recordActivity:A});c.alreadyCovered?a++:c.executionId&&c.ledgerId?i++:c.skipped===`shortage`?o.push(c.message):c.skipped===`run-day-closed`?o.push(`오늘 날짜가 이미 마감되어 자동 차감을 하지 못했습니다. 오늘 마감을 해제한 뒤 [다시 시도]를 눌러주세요.`):c.skipped===`no-completion`?o.push(`내일생산불러오기가 취소된 상태입니다. [내일생산불러오기]를 다시 해주세요.`):o.push(`자동 차감을 하지 못했습니다. 잠시 뒤 [다시 시도]를 눌러주세요.`)}catch(e){console.error(`[main] supplement failed:`,e),o.push(y(e))}alert([`자동 차감 완료 ${i}건, 이미 차감됨 ${a}건`,...o].join(`
`));try{if(!await J())throw Error(`화면이 변경되었습니다.`);Y()}catch(e){console.error(`보충 후 화면 갱신 실패:`,e),alert(`화면을 최신 상태로 갱신하지 못했습니다. 브라우저를 새로고침해 현재 상태를 확인해주세요.`)}}finally{hn=!1}}}var _n=new Set([`scheduleDue:trigger`,`autoRepack:trigger`,`autoRepack:diff`,`minStock:alert`,`frozenStockLow:alert`,`partDue:alert`,`schedule:completeDiff`,`closing:refresh`,`production:receiptEmergencyEdit`]);function vn(e){let t=`${e.action}:${e.subAction}`;return mn[t]?mn[t]:pn.includes(e.action)?`production`:fn.includes(e.action)?`office`:`ignore`}function yn(e){return _n.has(`${e.action}:${e.subAction}`)}function bn(e){let t=new Date(new Date().getTime()-e*24*60*60*1e3);return new Date(t.getTime()+540*60*1e3).toISOString().split(`T`)[0]}async function xn(){Lt=await Sn()}async function Sn(e=ae()){let t=F(),n=bn(10),[r,a]=await Promise.all([e.getDocs(i(_(v,`activityLogs`),o(`date`,`==`,t))).catch(e=>{throw e.code!==`cache-miss`&&console.error(`[6C-1] 당일 로그 로드 실패:`,e),e}),e.getDocs(i(_(v,`activityLogs`),o(`date`,`>=`,n),o(`date`,`<`,t))).catch(e=>{throw e.code!==`cache-miss`&&console.error(`[6C-1] 과거 로그 로드 실패:`,e),e})]),s=r?r.docs.map(e=>({id:e.id,...e.data()})):[],c=a?a.docs.map(e=>({id:e.id,...e.data()})).filter(e=>e.acknowledged!==!0&&yn(e)):[];return[...s,...c].sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}function Cn(e=bt){let t=[];(e.items||[]).forEach(n=>{if(n.code===`late-cards`){t.push(`
      <div class="alert-card alert-card-blocker alert-card-stack">
        <span class="alert-card-label">${n.title?`<strong>⛔ ${N(n.title)}</strong>`:`⛔ ${N(n.reason||n.label)}`}</span>
        ${n.title?`<div>${N(n.reason)}</div>`:``}
        ${(n.details||[]).map(e=>`<div>· ${N(e)}</div>`).join(``)}
        ${n.changedProductionIds?.length?`<div>수량이 바뀐 생산은 대표·사무실 계정이 전체를 다시 차감해야 합니다.</div>`:``}
        ${n.missingProductionIds?.length?`<button class="alert-card-jump" data-jump="${N(n.jumpMenu)}" data-blocker="${n.id}" data-date="${N(e.date||F())}" data-supplement-ids="${N(n.missingProductionIds.join(`,`))}">다시 시도 →</button>`:``}
        ${n.changedProductionIds?.length&&!n.missingProductionIds?.length?`<button class="alert-card-jump" data-jump="${N(n.jumpMenu)}" data-blocker="${n.id}" data-date="${N(e.date||F())}" data-refresh-date="${N(n.runDate||e.date||F())}">전체 다시 차감 →</button>`:``}
      </div>
      `);return}t.push(`
      <div class="alert-card alert-card-blocker">
        <span class="alert-card-label">⛔ ${N(n.reason||n.label)}</span>
        <button class="alert-card-jump" data-jump="${N(n.jumpMenu)}" data-blocker="${n.id}" data-date="${N(e.date||F())}">처리하러 가기 →</button>
      </div>
    `)});let n=Or();return n&&t.push(n),t.length===0?Re:`
    ${Re}<div class="log-blocker-area">
      ${t.join(``)}
    </div>
  `}function wn(e){let t=e===`production`?`🏭 생산 로그`:`🗒️ 사무 로그`,n=Lt.filter(t=>vn(t)===e&&!C(t)&&!Be(t));n.sort((e,t)=>{let n=yn(e)&&e.acknowledged!==!0?1:0,r=yn(t)&&t.acknowledged!==!0?1:0;if(n!==r)return r-n;let i=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-i});let r=n.some(e=>e.acknowledged!==!0&&!yn(e)),i=n.length===0?`<div class="log-empty">${e===`production`?`오늘 생산 로그 없음`:`오늘 사무 로그 없음`}</div>`:n.map(e=>Tn(e)).join(``);return`
    <div class="log-section">
      <div class="log-section-header">
        <span class="log-section-title">${t}</span>
        <div class="log-section-actions">
          <button class="log-action-btn" data-log-act="ackAll" data-log-cat="${e}" ${r?``:`disabled`}>모두 확인</button>
          <button class="log-action-btn" data-log-act="all" data-log-cat="${e}">전체보기</button>
          <button class="log-action-btn" data-log-act="history" data-log-cat="${e}">히스토리</button>
        </div>
      </div>
      <div class="log-section-body">
        ${i}
      </div>
    </div>
  `}function Tn(e){let t=e.acknowledged!==!0,n=yn(e),r=F(),i=xe(),a;if(e.date===r)a=kn(e.timestamp);else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[1])}/${parseInt(t[2])}`:e.date||``}let o=[`log-row`,t?`log-row-unack`:``,n?`log-row-critical`:``,e.subAction===`alert`&&[`minStock`,`frozenStockLow`].includes(e.action)?`log-row-stock-warning`:``].filter(Boolean).join(` `),s=t?`<button class="log-ack-btn" data-log-act="ack" data-log-id="${N(e.id)}">확인</button>`:`<span class="log-ack-done" title="${N(e.acknowledgedBy||``)} 확인">✓</span>`,c=n&&t?`<span class="log-critical-badge">⚠️</span>`:``,l=On(e);return`
    <div class="${o}">
      <span class="log-row-time">${a}</span>
      <span class="log-row-msg">${c}${X(l)}</span>
      <span class="log-row-action">${s}</span>
    </div>
  `}function En(e){let t=Number(e||0);return t>9999?`${(t/1e3).toFixed(2)}kg`:`${t.toLocaleString()}g`}function Dn(e,t,n){if(t===`g`)return En(e);let r=`${e}${t}`;return t!==`마리`||!n?r:`${r} (${En(Number(e||0)*Number(n||0))})`}function On(e){if(e.action!==`schedule`||e.subAction!==`completeDiff`)return ze(e,gt);let t=e.details||{};if(t.orderedQty==null||t.actualQty==null)return e.message||`(메시지 없음)`;let n=t.orderedUnit||t.unit||``,r=t.unit||n,i=Dn(t.orderedQty,n,t.orderedUnitGrams),a=Dn(t.actualQty,r,t.orderedUnitGrams),o=t.itemName||`입고 예정`,s=e.staff||``;return`${o} 입고 완료 ⚠️ 발주 ${i} → 실제 ${a}${s?` / 담당: ${s}`:``}`}function kn(e){if(!e||!e.toMillis)return`—`;let t=new Date(e.toMillis()),n=new Date(t.getTime()+540*60*1e3);return`${String(n.getUTCHours()).padStart(2,`0`)}:${String(n.getUTCMinutes()).padStart(2,`0`)}`}function An(){return I===`admin`?`대표`:I===`office`?`사무실`:I===`production`?`생산실`:`운영자`}function jn(){Le(),document.querySelectorAll(`[data-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;await Mn(t)})}),document.querySelectorAll(`[data-log-act="ackAll"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logCat;await In(t)})}),document.querySelectorAll(`[data-log-act="all"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;Gn(t)})}),document.querySelectorAll(`[data-log-act="history"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.logCat;Kn(t)})})}async function Mn(e){try{let r=await M({refs:[`activityLogs/`+e]}),i=await t(n(v,`activityLogs`,e));if(!i.exists()){alert(`로그를 찾을 수 없습니다.`);return}let a={id:e,...i.data()};if(a.action===`autoRepack`&&a.subAction===`trigger`&&a.acknowledged!==!0){await Pn(e,a);return}await r.submit(()=>D(e,An())),await xn(),Ln()}catch(e){console.error(`[6C-1] 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}}async function Nn(){let e=await t(n(v,`staffGroups`,`lead`));return(e.exists()&&e.data().members||[]).filter(e=>e&&e.active!==!1&&e.name).sort((e,t)=>(e.sortOrder||0)-(t.sortOrder||0)).map(e=>e.name)}async function Pn(e,t){let n=await M({refs:[`activityLogs/`+e,`meatStocks/`+t.details?.repackedStockId],roles:[`admin`,`production`]});if(t=n.values[0],!t||t.acknowledged===!0){alert(`이미 처리되었거나 삭제된 로그입니다.`);return}if(I===`office`){alert(`자동 재포장 확인은 생산실/대표 계정에서만 처리할 수 있습니다.`);return}let r=t.details||{},i=r.meatName||`?`,a=Number(r.surplusG)||0,o=Number(r.processedUnitWeightG)||0,s=r.repackedStockId,c=r.mode;if(!s||!o){alert(`자동 재포장 로그 데이터가 손상되어 처리할 수 없습니다. (운영자에게 문의)`);return}let l=a/o,u=Number.isInteger(l)?`${l}개`:`약 ${l.toFixed(2)}개`,d=await Nn();if(d.length===0){alert(`주임 그룹 담당자가 등록되어 있지 않습니다. 설정에서 추가해주세요.`);return}$(`
    <div style="padding:16px; min-width:440px; max-width:560px;">
      <h3 style="margin:0 0 12px;">자동 재포장 확인 — ${X(i)}</h3>
      <div style="background:#f5f5f5; padding:12px; border-radius:4px; margin-bottom:16px; line-height:1.7;">
        <div><b>시스템 자동 재포장 수량 (수정 불가)</b></div>
        <div style="font-size:15px; font-weight:600; color:#1f2937;">${on(a)}g (${(a/1e3).toFixed(2)}kg)</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">
          단위중량 ${on(o)}g 기준 ${u}<br>
          모드: ${c===`merged`?`기존 lot 합산`:`신규 lot 생성`}
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block; margin-bottom:4px;"><b>실제 재포장 수량 (개)</b></label>
        <input type="number" id="ar-actual-count" min="0" step="1" value="" placeholder="실제 만든 개수 입력" style="width:100%; padding:8px; box-sizing:border-box;">
        <div id="ar-actual-g" style="font-size:13px; color:#6b7280; margin-top:4px;">→ 개수 입력 시 환산 g 자동 표시</div>
      </div>
      <div style="margin-bottom:16px;">
        <label style="display:block; margin-bottom:4px;"><b>실제 재포장 담당자 (주임)</b></label>
        <select id="ar-staff" style="width:100%; padding:8px; box-sizing:border-box;">
          <option value="">담당자 선택...</option>
          ${d.map(e=>`<option value="${X(e)}">${X(e)}</option>`).join(``)}
        </select>
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="ar-cancel" style="padding:8px 16px; background:#e5e7eb; border:none; border-radius:4px; cursor:pointer;">취소</button>
        <button id="ar-confirm" style="padding:8px 16px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">확인</button>
      </div>
    </div>
  `);let f=document.getElementById(`ar-actual-count`),p=document.getElementById(`ar-actual-g`);f.addEventListener(`input`,()=>{let e=parseInt(f.value,10);if(isNaN(e)||e<0){p.textContent=`→ 개수 입력 시 환산 g 자동 표시`;return}let t=e*o,n=t-a,r=n===0?` (시스템과 동일)`:` (차이 ${n>0?`+`:``}${on(n)}g)`;p.textContent=`→ ${on(t)}g (${(t/1e3).toFixed(2)}kg)${r}`}),document.getElementById(`ar-cancel`).addEventListener(`click`,()=>{closeModal()}),document.getElementById(`ar-confirm`).addEventListener(`click`,async()=>{let r=parseInt(f.value,10),i=document.getElementById(`ar-staff`).value;if(!i){alert(`담당자를 선택해주세요.`);return}if(isNaN(r)||r<0){alert(`실제 수량은 0 이상의 정수여야 합니다.`);return}if(r===0&&!await b({title:`실제 재포장 수량 0개`,message:`실제 재포장 수량이 0개입니다.
자동 재포장 재고를 0g으로 만들고 마감 처리합니다.
진행할까요?`,confirmText:`진행`,cancelText:`취소`,danger:!0}))return;let s=document.getElementById(`ar-confirm`);s.disabled=!0;try{await n.submit(()=>Fn({logId:e,log:t,actualCount:r,surplusG:a,processedUnitWeightG:o,staffName:i})),closeModal()}catch(e){console.error(`[묶음 9 #9] 자동 재포장 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다: `+(y(e)||e))}finally{s.disabled=!1}})}async function Fn({logId:e,log:t,actualCount:n,surplusG:r,processedUnitWeightG:i,staffName:a}){await Je({db:v,logId:e,log:t,actualCount:n,staffName:a,date:F(),uid:be?.uid||null}),await xn(),Ln()}async function In(e){try{await xn()}catch(e){alert(y(e));return}let t=Lt.filter(t=>vn(t)===e&&!Be(t)&&t.acknowledged!==!0&&!yn(t));if(t.length!==0&&await b({title:`모두 확인`,message:`${e===`production`?`생산`:`사무`} 로그 ${t.length}건을 모두 확인 처리하시겠습니까?\n(확인 필수 항목은 제외됩니다)`,confirmText:`확인 처리`,cancelText:`취소`}))try{let e=await M({refs:t.map(e=>`activityLogs/`+e.id)}),n=An();await e.submit(e=>Promise.all(e.filter(e=>e&&!Be(e)&&e.acknowledged!==!0&&!yn(e)).map(e=>D(e.id,n)))),await xn(),Ln()}catch(e){console.error(`[6C-1] 모두 확인 실패:`,e),alert(`일괄 확인 중 오류가 발생했습니다.`)}}function Ln(){let e=document.querySelector(`.main-panel-3`);e&&(e.innerHTML=`
    ${Cn()}
    ${wn(`production`)}
    ${wn(`office`)}
  `,document.querySelectorAll(`.main-panel-3 .alert-card-jump`).forEach(e=>{e.addEventListener(`click`,()=>{if(e.dataset.supplementIds){gn(e.dataset.supplementIds.split(`,`));return}if(e.dataset.refreshDate){Br(e.dataset.refreshDate);return}if([4,5,6].includes(Number(e.dataset.blocker))){Wn(e.dataset.date,Number(e.dataset.blocker));return}let t=e.dataset.jump;he(t),Ce()})}),jn())}var Z=[],Rn=null,zn=``,Bn=``,Vn=null,Q=`all`,Hn=null,Un=!1;async function Wn(e,t){if(!/^\d{4}-\d{2}-\d{2}$/.test(e)||![4,5,6].includes(Number(t)))return;let n=S();Bn=e,Vn=Number(t),Rn=Vn===6?`office`:`production`,Q=`date`,zn=``,Z=[],$(`<h3>기록 확인 · `+N(e)+`</h3><p role="status">해당 날짜 기록을 불러오고 있습니다.</p><button class="btn-secondary" onclick="closeModal()">닫기</button>`);let r=document.getElementById(`modalOverlay`);try{let t=await p(i(_(v,`activityLogs`),o(`date`,`==`,e)));if(!r?.isConnected||n&&!n.isCurrent())return;Z=t.docs.map(e=>({...e.data(),id:e.id})).filter(t=>Ve(t,e,Vn)).sort((e,t)=>(t.timestamp?.toMillis?.()||0)-(e.timestamp?.toMillis?.()||0)),Yn()}catch(e){r?.isConnected&&(!n||n.isCurrent())&&(r.querySelector(`[role="status"]`).textContent=`해당 날짜 기록을 불러오지 못했습니다. 창을 닫고 다시 열어주세요.`,console.error(`[날짜별 기록 조회]`,e))}}async function Gn(e){Rn=e,Q=`all`,zn=``,Z=[],await qn(),Yn()}async function Kn(e){Rn=e,Q=`history`,zn=``,Z=[],Hn=null,Un=!1,await Jn(),Yn()}async function qn(){let e=F(),t=bn(10);try{Z=(await p(i(_(v,`activityLogs`),o(`date`,`>=`,t),o(`date`,`<=`,e)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>vn(e)===Rn).sort((e,t)=>{let n=e.timestamp?.toMillis?e.timestamp.toMillis():0;return(t.timestamp?.toMillis?t.timestamp.toMillis():0)-n})}catch(e){console.error(`[6C-1B] 전체보기 로드 실패:`,e),alert(`전체보기 로드 실패: 관리자에게 문의해주세요.`)}}async function Jn(){if(!Un)try{let e=[m(`timestamp`,`desc`),r(100)];Hn&&e.push(l(Hn));let t=await p(i(_(v,`activityLogs`),...e));t.docs.length<100&&(Un=!0),t.docs.length>0&&(Hn=t.docs[t.docs.length-1]);let n=t.docs.map(e=>({id:e.id,...e.data()})).filter(e=>vn(e)===Rn);Z=[...Z,...n]}catch(e){console.error(`[6C-1B] 히스토리 로드 실패:`,e),alert(`히스토리 로드 실패: 관리자에게 문의해주세요.`)}}function Yn(){let e=Q===`date`?Bn+` 미확인 기록`:Q===`all`?`전체보기 (10일)`:`히스토리 (전체)`;$(`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
      <h3 style="margin:0;font-size:15px;">${Vn===4&&Q===`date`?`자동 재포장 확인`:Rn===`production`?`생산 기록`:`사무 기록`} — ${e}</h3>
      ${Q===`all`?`<button class="btn-secondary" id="btnLogModalSwitch" style="font-size:11px;">히스토리로 전환 →</button>`:``}
    </div>

    <div style="margin-bottom:8px;">
      <input type="text" id="logModalSearch" placeholder="메시지 검색 (담당자명, 품목명 등)"
             style="width:100%;padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:12px;box-sizing:border-box;"
             value="${X(zn)}">
    </div>

    <div id="logModalList" class="log-modal-list">
      ${Qn()}
    </div>

    <div id="logModalFooter" style="display:flex;gap:8px;justify-content:space-between;margin-top:12px;">
      <div>
        ${Q===`history`&&!Un?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
      </div>
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `),document.getElementById(`logModalSearch`)?.addEventListener(`input`,e=>{zn=e.target.value,Xn()}),document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await Jn(),Xn(),Zn()}),document.getElementById(`btnLogModalSwitch`)?.addEventListener(`click`,async()=>{Q=`history`,zn=``,Z=[],Hn=null,Un=!1,await Jn(),Yn()}),er()}function Xn(){let e=document.getElementById(`logModalList`);e&&(e.innerHTML=Qn(),er())}function Zn(){let e=document.getElementById(`logModalFooter`);e&&(e.innerHTML=`
    <div>
      ${Q===`history`&&!Un?`<button class="btn-secondary" id="btnLogMore" style="font-size:11px;">+ 더 보기 (100건)</button>`:``}
    </div>
    <button class="btn-secondary" onclick="closeModal()">닫기</button>
  `,document.getElementById(`btnLogMore`)?.addEventListener(`click`,async()=>{await Jn(),Xn(),Zn()}))}function Qn(){let e=zn.trim().toLowerCase(),t=e?Z.filter(t=>(On(t)+` `+(t.staff||``)).toLowerCase().includes(e)):Z;if(t.length===0)return`<div class="log-empty" style="padding:24px 8px;">${e?`검색 결과 없음`:Q===`date`?`해당 날짜에 남은 미확인 기록이 없습니다.`:`표시할 기록 없음`}</div>`;let n=null,r=[];return t.forEach(e=>{if(e.date!==n){n=e.date;let t=F(),i=xe(),a;if(e.date===t)a=`오늘`;else if(e.date===i)a=`어제`;else{let t=(e.date||``).split(`-`);a=t.length===3?`${parseInt(t[0])}.${parseInt(t[1])}.${parseInt(t[2])}`:e.date||``}r.push(`<div class="log-modal-date-header">${a}</div>`)}r.push($n(e))}),r.join(``)}function $n(e){let t=Be(e),n=!t&&e.acknowledged!==!0,r=yn(e),i=kn(e.timestamp),a=[`log-modal-row`,n?`log-row-unack`:``,r?`log-row-critical`:``,e.subAction===`alert`&&[`minStock`,`frozenStockLow`].includes(e.action)?`log-row-stock-warning`:``].filter(Boolean).join(` `),o=t?`<span class="log-history-only" title="생산 등록 이력 · 확인 불필요">이력</span>`:n?`<button class="log-ack-btn" data-modal-log-act="ack" data-log-id="${N(e.id)}">확인</button>`:`<span class="log-ack-done" title="${N(e.acknowledgedBy||``)} 확인">✓ ${X(e.acknowledgedBy||``)}</span>`;return`
    <div class="${a}">
      <span class="log-row-time">${i}</span>
      <span class="log-row-msg">${r&&n?`<span class="log-critical-badge">⚠️</span>`:``}${X(On(e))}</span>
      <span class="log-row-action">${o}</span>
    </div>
  `}function er(){document.querySelectorAll(`[data-modal-log-act="ack"]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.logId;try{let e=Z.find(e=>e.id===t);if(e&&e.action===`autoRepack`&&e.subAction===`trigger`&&e.acknowledged!==!0){await Pn(t,e);return}await D(t,An()),e&&(e.acknowledged=!0,e.acknowledgedBy=An()),await xn(),Ln(),Xn()}catch(e){console.error(`[6C-1B] 모달 확인 처리 실패:`,e),alert(`확인 처리 중 오류가 발생했습니다.`)}})})}async function tr(e,t,n,r){try{let r=await n.getDocs(i(_(v,`events`),o(`date`,`==`,e)));for(let n of r.docs){let r={id:n.id,...n.data()};t.enqueue({action:`event`,subAction:`dueToday`,date:e,message:`📅 오늘 일정 — ${r.title||`(제목 없음)`}`,details:{eventId:r.id,title:r.title||``},dedupKey:`event:${r.id}`})}}catch(e){throw console.warn(`[6C-3] 이벤트 자동 발행 실패:`,e.message),e}}async function nr(e,t,n,r){try{let r=await n.getDocs(i(_(v,`schedules`),o(`date`,`==`,e)));for(let n of r.docs){let r={id:n.id,...n.data()};if(r.status!==`scheduled`)continue;let i=r.type===`egg`?`계란`:r.itemNameSnapshot||`(품목)`;t.enqueue({action:`scheduleDue`,subAction:`trigger`,date:e,message:`📦 입고 예정일 도래 — ${i} ${r.orderedQty}${r.orderedUnit}`,details:{scheduleId:r.id,type:r.type,itemName:r.itemNameSnapshot,orderedQty:r.orderedQty,orderedUnit:r.orderedUnit},dedupKey:`scheduleDue:${r.id}`})}}catch(e){throw console.error(`[6C-3] 입고 예정 자동 발행 실패:`,e),e}}async function rr(e,t,n,r){let i=await le(n,e);r.supplementTypeRows=i.supplementTypes,i.plans.forEach(e=>t.enqueue(e))}async function ir(e,t,n,r){await Promise.all([tr(e,t,n,r),nr(e,t,n,r),rr(e,t,n,r),ar(e,t,n,r)])}async function ar(e,t,n,r){for(let n of r.equipmentAlerts){let r=n.part;n.kind===`due`&&t.enqueue({action:`partDue`,subAction:`alert`,date:e,message:`🔧 ${fe(r)} 교체 ${n.overdue?`예정일 ${Math.abs(n.dday)}일 지남`:ge(n.dday)} (예정 ${r.nextDueAt})`,details:{kind:`part`,partId:r.id,equipmentId:r.equipmentId,name:r.name,nextDueAt:r.nextDueAt,dday:n.dday},dedupKey:`partDue:${r.id}`})}}function or(e,t=z,n=!0){let r=e.ingredientsSnapshot||[],i=yr(e,r,t),a=e.batchNo?` <span>${N(e.batchNo)}차</span>`:e.round>1?` <span>${N(e.round)}회차</span>`:``;return`
    <div class="main-production-card${n&&(e.category===`raw`||e.category===`freezeDry`)?` receivable`:``}${e.received?` received`:``}" data-id="${N(e.id)}" style="--recipe-color:${Se(e.color,`#ef7bd0`)}">
      ${e.received?`<div class="main-received-stamp">입고완료</div>`:``}
      <div class="main-production-card-title">
        ${N(e.recipeName)}${a}
      </div>
      <table class="main-ingredient-table">
        <thead>
          <tr>
            <th>부위</th>
            <th>생산수량</th>
            <th>단위</th>
          </tr>
        </thead>
        <tbody>
          <tr class="unit-row">
            <td>${N(i)}</td>
            <td>${wr(e.productionUnitQty)}</td>
            <td>${N(br(e,t))}</td>
          </tr>
          ${r.map(n=>`
            <tr>
              <td>${N(n.name)}</td>
              <td>${N(Sr(e,n,t))}</td>
              <td>${N(Cr(e,n,t))}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${e.category===`raw`?`<span>${N(e.rawBoxQty||0)}박스</span>`:``}
        ${e.category===`freezeDry`?It(e):``}
        ${e.received?sr(e):``}
      </div>
    </div>
  `}function sr(e){if(e.category===`freezeDry`){let t=e.receivedFreezeType===`breadPan`?`빵판`:`동결판`;return`<span class="main-received-badge">✅ 입고완료 ${N(e.receivedFreezeQty||0)}${t}</span>`}let t=e.receivedRevision?Fe(`productions:${e.id}:${e.receivedRevision}`):``;return`<span class="main-received-badge">✅ 입고완료 ${N(e.receivedBox||0)}박스${e.receivedRemainder?` +${N(e.receivedRemainder)}낱개`:``}</span>${t}`}function cr(e,t){let n=(e||[]).filter(e=>e.category===`raw`||e.category===`freezeDry`),r=0,i=0,a=0,o=0,s=n.length===0?`<div style="color:#aaa;text-align:center;padding:18px;">입고 대상 생산이 없습니다.</div>`:n.map(e=>{let t=`<span style="color:#c53030;">미입고</span>`;if(e.received)if(e.category===`raw`){let n=Number(e.receivedBox||0),a=Number(e.receivedRemainder||0);r+=n,i+=a,t=`${n}박스${a?` + ${a}낱개`:``}`}else{let n=Number(e.receivedFreezeQty||0);e.receivedFreezeType===`breadPan`?(a=je(a+n),t=`${n}빵판`):(o+=n,t=`${n}동결판`)}return`
        <div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eee;">
          <span>${N(e.recipeName||`생산 품목명 확인 필요`)}</span>
          <span style="font-weight:600;">${t}</span>
        </div>
      `}).join(``);$(`
    <h3 class="modal-title">생산 입고 현황 — ${t}</h3>
    <div style="background:#f8f9fa;border:1px solid #e5e5e5;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;">
      <div>생식 합계: <b>${r}</b>박스${i?` + <b>${i}</b>낱개`:``}</div>
      <div>빵판 합계: <b>${a}</b>빵판</div>
      <div>동결판 합계: <b>${o}</b>동결판</div>
    </div>
    <div style="font-size:13px;max-height:420px;overflow:auto;">
      ${s}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}async function lr(e){try{let t=await E().getDoc(n(v,`productions`,e));if(!t.exists())throw Error(`생산 자료가 삭제되었습니다.`);let r=t.data(),a=[`productions/`+e,`recipes/`+r.recipeId,`settings/systemValues`,`closings/`+r.date];r.receivedRevision&&a.push(`productTransferRequests/productions:${e}:${r.receivedRevision}`);let s=await E().getDocs(i(_(v,`productTransferRequests`),o(`sourceId`,`==`,e)));for(let e of s.docs){let t=e.data(),n=`productTransferRequests/${e.id}`;t.sourceApp===`production`&&t.sourceCollection===`productions`&&!a.includes(n)&&a.push(n)}let c=await M({refs:a}),[l,u,d]=c.values;if(!l||l.status===`deleted`||l.recipeId!==r.recipeId||l.date!==r.date||(l.receivedRevision||0)!==(r.receivedRevision||0))throw Error(`생산 정보가 변경되었습니다. 다시 열어주세요.`);return{action:c,refs:a,p:l,recipe:u,sysVals:d||{}}}catch(e){return alert(y(e)),null}}async function ur(e){let t=await M({roles:e});if(!await J(E(),{autoLogsEnabled:!1}))throw Error(`화면이 변경되었습니다.`);let n=()=>k({nextProductions:R,overdueNextProductions:Ct,recipes:z,completionDoc:B,overdueCompletionDoc:wt,blockingData:bt,meatStocks:_t,eggStock:yt}),r=n();return async()=>{if(await t.confirm(),!await J(E(),{autoLogsEnabled:!1}))throw Error(`화면이 변경되었습니다.`);if(n()!==r)throw Error(`생산·재고·마감 조건이 변경되었습니다. 입력을 확인하고 다시 시도해주세요.`)}}async function dr(e){let t;try{t=await Ee(e)}catch(e){return console.error(`[receipt] 마감 상태 확인 실패:`,e),alert(`마감 상태를 서버에서 확인하지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.`),{allowed:!1,emergency:null}}if(!t)return{allowed:!0,emergency:null};if(I!==`admin`&&I!==`office`)return alert(`${e}는 이미 마감된 날짜입니다.
수정하려면 마감해제하세요.`),{allowed:!1,emergency:null};let n=await x({title:`마감된 입고 수량 긴급 수정`,message:`${e}는 마감된 날짜입니다. 마감 해제 없이 입고 수량만 고칩니다.
재고 스냅샷에는 영향이 없고, 사무 로그에 긴급 수정으로 남습니다.
재고앱에 이미 입고 완료된 건이면 재고앱에서 기존 입고와의 차이만 정정 처리해야 합니다.`,label:`사유`,placeholder:`예: 판수 오입력 정정`,required:!0,confirmText:`긴급 수정 진행`});return n===null?{allowed:!1,emergency:null}:{allowed:!0,emergency:{reason:n}}}function fr(){return I===`admin`?`대표`:I===`office`?`사무실`:I===`production`?`생산실`:`시스템`}async function pr(e){let t=await lr(e);if(!t)return;let{action:n,refs:r,p:i,recipe:a,sysVals:o}=t;if(!i||i.category!==`raw`)return;if(i.date>F()){alert(`미래 날짜의 제품 입고는 입력할 수 없습니다.`);return}i.received;let s=await dr(i.date);if(!s.allowed)return;let c=s.emergency,l=c?.reason;if(!l&&n.values.slice(4).some(e=>e?.status===`completed`||e?.status===`입고완료`)&&(l=await x({title:`입고 수량 정정`,message:`재고앱에서 이미 입고된 생산입니다. 정정 수량과 기존 입고의 차이만 재고앱에 반영합니다.`,label:`사유`,required:!0,confirmText:`정정 진행`}),l===null)||i.received&&!await b({title:`입고완료 수정`,message:`현재 입력: 판수 ${i.receivedPlates??`-`} / 낱개 ${i.receivedLoosePacks??0} → 총 ${i.receivedTotalPacks??`-`}팩 = ${i.receivedBox??`-`}박스 + ${i.receivedRemainder??0}낱개

입고완료 내용을 수정하시겠습니까?
저장하면 수정 이력이 재고앱으로 다시 전송됩니다.`,confirmText:`수정하기`}))return;let u=a?.target||i.target||``,d=Number(a?.packsPerPlate),f=Number.isFinite(d)&&d>0,p=u===`cat`?`packsPerPlateCat`:u===`dog`?`packsPerPlateDog`:null,m=f?d:Number(p?o[p]:NaN);if(!Number.isFinite(m)||m<=0){alert(`설정 > 시스템 설정값에서 ${u===`cat`?`고양이`:u===`dog`?`강아지`:`대상`} 판당 팩수를 먼저 등록해주세요.`);return}let h=Array.isArray(a?.productionMethods)?a.productionMethods.filter(e=>e&&e.methodKey&&e.active!==!1):[],g=h.length>0?h.map(e=>`<option value="${N(e.methodKey)}" ${i.receivedMethod===e.methodKey?`selected`:``}>${N(e.label||e.methodKey)}</option>`).join(``):`<option value="">방식 없음</option>`;document.getElementById(`productReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="productReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">제품 입고 — ${N(i.recipeName)}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">판당 팩수 ${m}팩/판${f?` (레시피 지정)`:``} · 1박스 = 20팩</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">생산방식 (기록용)</label>
          <select id="pr_method" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">${g}</select>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">판수 *</label>
            <input type="number" id="pr_plates" min="0" step="1" value="${N(i.receivedPlates??``)}" placeholder="판수" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
          <div class="form-group" style="flex:1;">
            <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">낱개(자투리 팩)</label>
            <input type="number" id="pr_loose" min="0" step="1" value="${N(i.receivedLoosePacks??0)}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
          </div>
        </div>
        <div id="pr_result" style="font-size:13px;color:#1a1a1a;background:#f5f7f5;border-radius:6px;padding:10px;margin-bottom:14px;">판수를 입력하세요.</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="pr_cancel">취소</button>
          <button class="btn-primary" id="pr_confirm">제품 입고</button>
        </div>
      </div>
    </div>
  `);let _=document.getElementById(`productReceiptModal`),v=document.getElementById(`pr_plates`),ee=document.getElementById(`pr_loose`),te=document.getElementById(`pr_result`),S=()=>_?.remove();function C(){let e=v.value.trim()===``?NaN:Number(v.value),t=Number(ee.value||0);if(!Number.isInteger(e)||e<0||!Number.isInteger(t)||t<0)return te.textContent=`판수와 낱개는 0 이상의 정수로 입력하세요.`,null;let n=e*m+t;if(!Number.isSafeInteger(n))return te.textContent=`총 팩수를 확인해주세요.`,null;let r=Math.floor(n/10)/2,i=n%10;return te.innerHTML=`총 <b>${n}</b>팩 → <b>${r}</b>박스 + <b>${i}</b>낱개`,{plates:e,loose:t,totalPacks:n,boxes:r,remainder:i}}v.addEventListener(`input`,C),ee.addEventListener(`input`,C),C(),document.getElementById(`pr_cancel`).addEventListener(`click`,S),document.getElementById(`pr_confirm`).addEventListener(`click`,async e=>{let t=C();if(!t){v.focus();return}let a=document.getElementById(`pr_method`).value||null,o=e.currentTarget;if(o.disabled)return;o.disabled=!0;let s=!1;try{await lt({action:n,refs:r,p:i,target:u,result:t,method:a,emergency:c,correctionReason:l,staff:fr()}),s=!0,S(),await J(),U&&await Nt(U),Y()}catch(e){console.error(`[receipt] save failed:`,e),alert((s?`제품 입고 저장은 완료됐지만 화면을 갱신하지 못했습니다. 다시 불러와주세요: `:`제품 입고 저장 중 오류가 발생했습니다: `)+(y(e)||e))}finally{o.disabled=!1}})}async function mr(e=[`senior`,`office`]){let r=[];for(let i of e){let e=await t(n(v,`staffGroups`,i));e.exists()&&(e.data().members||[]).forEach(e=>{e?.name&&r.push(`<option value="${N(e.name)}">${N(e.name)}</option>`)})}return r.join(``)}async function hr(e){let t=await lr(e);if(!t)return;let{action:n,refs:r,p:i,recipe:a,sysVals:o}=t;if(!i||i.category!==`freezeDry`)return;if(i.date>F()){alert(`미래 날짜의 동결건조 입고는 입력할 수 없습니다.`);return}if(await De(i.date))return;let s=a?.displayName||i.recipeName||a?.name||`동결건조`,c=i.received?i.receivedFreezeType===`frozenPan`:i.requiresSeparation===!1||a?.requiresSeparation===!1,l=c?`동결판`:`빵판`;if(i.received){if(!await b({title:`입고완료 수정`,message:`현재 입력된 수량: ${i.receivedFreezeQty??`-`}${l}\n\n입고완료 내용을 수정하시겠습니까?\n수정 차이만큼 ${l} 재고 건을 조정합니다.`,confirmText:`수정하기`}))return;if(!i.receivedLotId){alert(`원본 입고 건을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`);return}}let u=c?Math.round(Number(i.received?i.receivedFreezeQty:i.freezePanQty||0)):je(Number(i.received?i.receivedFreezeQty:i.breadPanQty||0)),d=await mr([`senior`,`office`]);document.getElementById(`freezeDryReceiptModal`)?.remove(),document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="freezeDryReceiptModal">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title">동결건조 입고 — ${N(s)}</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">${c?`분리작업 불필요 → 동결판 재고 입고`:`분리작업 필요 → 빵판 재고 입고`}</p>
        <div class="form-group" style="margin-bottom:10px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">${l} 수량 *</label>
          <input type="number" id="fd_qty" min="${c?`1`:`0.01`}" step="${c?`1`:`0.01`}" value="${u||``}" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;box-sizing:border-box;" />
        </div>
        <div class="form-group" style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">담당자 *</label>
          <select id="fd_staff" style="width:100%;padding:8px;border:1px solid #d0d0d0;border-radius:4px;">
            <option value="">선택</option>
            ${d}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="fd_cancel">취소</button>
          <button class="btn-primary" id="fd_confirm">${i.received?`수정 저장`:`입고`}</button>
        </div>
      </div>
    </div>
  `);let f=document.getElementById(`freezeDryReceiptModal`),p=()=>f?.remove();document.getElementById(`fd_cancel`).addEventListener(`click`,p),document.getElementById(`fd_confirm`).addEventListener(`click`,async()=>{let e=c?parseInt(document.getElementById(`fd_qty`).value,10):je(parseFloat(document.getElementById(`fd_qty`).value)||0),t=document.getElementById(`fd_staff`).value;if(!Number.isFinite(e)||e<=0){alert(`${l} 수량은 0보다 커야 합니다.`);return}if(!t){alert(`담당자를 선택해주세요.`);return}if(await De(i.date))return;let r=document.getElementById(`fd_confirm`);if(!r.disabled){r.disabled=!0;try{if(await n.confirm(),i.received&&i.receivedLotId){if(!await gr({p:i,productName:s,qty:e,staffName:t,isTender:c}))return}else c?await vr({p:i,productName:s,qty:e,staffName:t}):await _r({p:i,productName:s,qty:e,staffName:t});p(),await J(),U&&await Nt(U),Y()}catch(e){console.error(`[freezeDryReceipt] save failed:`,e),alert(`동결건조 입고 저장 중 오류가 발생했습니다: `+(y(e)||e))}finally{r.disabled=!1}}})}async function gr({p:r,productName:i,qty:a,staffName:o,isTender:s}){let c=s?`frozenPanLots`:`breadPanLots`,l=s?`frozenPanLogs`:`breadPanLogs`,u=n(v,c,r.receivedLotId),d=await t(u);if(!d.exists())return alert(`원본 입고 건을 찾을 수 없습니다. 빵판/동결판 수동 조정을 이용해주세요.`),!1;let f=d.data(),p=Number(f.remaining||0),m=Number(r.receivedFreezeQty||0),h=s?a-m:je(a-m);if(h===0)return alert(`변경된 수량이 없습니다.`),!1;let y=s?p+h:je(p+h);if(y<0){let e=je(Number(f.initialQty||0)-p);return alert(`이미 ${e}개가 사용되어 ${a}${s?`동결판`:`빵판`}으로 줄일 수 없습니다.`),!1}let ee=new Date,b=e(v),x=n(_(v,l)),te=s?Number(f.initialQty||0)+h:je(Number(f.initialQty||0)+h);b.update(u,{initialQty:te,remaining:y,closed:s?y<=0:y<=.005,updatedAt:ee});let S={type:`adjust`,date:F(),productName:f.productName||i,qty:h,before:p,after:y,lotId:r.receivedLotId,staffName:o,uid:null,note:null,reason:`제품입고 수정`,batchId:null,ledgerId:null,timestamp:ee};return s||(S.lotDate=f.date,S.expectedFrozenQty=null,S.actualFrozenQty=null,S.diff=null),b.set(x,S),b.update(n(v,`productions`,r.id),{receivedFreezeQty:a,mutationToken:pe(),receivedAt:g(),updatedAt:g()}),await b.commit(),!0}async function _r({p:e,productName:t,qty:n,staffName:r}){return ut({db:v,productionId:e.id,date:e.date,productName:t,qty:n,staffName:r,isTender:!1,mutationToken:pe()})}async function vr({p:e,productName:t,qty:n,staffName:r}){return ut({db:v,productionId:e.id,date:e.date,productName:t,qty:n,staffName:r,isTender:!0,mutationToken:pe()})}function yr(e,t,n=z){let r=t.find(e=>e.isProductionUnit);return r?r.name:n.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit)?.name||e.productionUnitName||`생산단위`}function br(e,t=z){if(e.productionUnitName)return e.productionUnitName;let n=t.find(t=>t.id===e.recipeId)?.ingredients?.find(e=>e.isProductionUnit);return n?.unitName||n?.weightDisplayUnit||``}function xr(e,t,n=z){if(t.weightDisplayUnit===`kg`||t.weightDisplayUnit===`g`)return t.weightDisplayUnit;let r=n.find(t=>t.id===e.recipeId),i=r?.ingredients?.find(e=>e.name===t.name&&(!t.meatTypeId||e.meatTypeId===t.meatTypeId))||r?.ingredients?.find(e=>e.name===t.name);return i?.weightDisplayUnit===`kg`||i?.weightDisplayUnit===`g`?i.weightDisplayUnit:t.meatTypeId?`kg`:`g`}function Sr(e,t,n=z){return Me(Number(t.requiredQtyG||0),xr(e,t,n))}function Cr(e,t,n=z){return xr(e,t,n)}function wr(e,t=1){let n=Number(e||0);return Number.isInteger(n)?String(n):n.toLocaleString(`ko-KR`,{maximumFractionDigits:t})}function Tr(e=ht){let t=new Map;return e.forEach(e=>{(e.ingredientsSnapshot||[]).forEach(n=>{let r=n.name||``;if(r===`물`||r.includes(`노른자`))return;let i=r.trim();if(!i)return;let a=xr(e,n),o=Number(n.requiredQtyG||0),s=t.get(i);s?(s.totalG+=o,a===`kg`&&(s.unit=`kg`),!s.meatTypeId&&n.meatTypeId&&(s.meatTypeId=n.meatTypeId)):t.set(i,{name:n.name,totalG:o,unit:a,meatTypeId:n.meatTypeId||null})})}),t}function Er(e){let t=e=>e.meatTypeId&&vt.get(e.meatTypeId)===`produce`?1:0;return[...e.values()].sort((e,n)=>t(e)-t(n)||n.totalG-e.totalG)}function Dr(e=ht,t=!1){if(e.length===0)return`<div style="color:#aaa;">${t?`불러온 생산 없음`:`오늘 생산 없음`}</div>`;let n=Tr(e);return n.size===0?`<div style="color:#aaa;">원료 출고 없음</div>`:Er(n).map(e=>{let t=Me(e.totalG,e.unit);return`
    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid #f5f5f5;">
      <span>${N(e.name)}</span>
      <span style="font-weight:600;">${t} ${N(e.unit)}</span>
    </div>
  `}).join(``)}function Or(){let e=Rt.filter(e=>e.kind===`due`);if(!e.length)return``;let t=e.filter(e=>e.overdue).length,n=[t?`교체 지남 ${t}`:``,e.length-t?`교체 임박 ${e.length-t}`:``].filter(Boolean).join(` · `),r=e[0];return`
      <div class="alert-card ${t?`alert-card-blocker`:`alert-card-warning`}">
        <span class="alert-card-label">🔧 설비 부품 확인 필요 — ${n} (${X(fe(r.part))} 등)</span>
        <button class="alert-card-jump" data-jump="equipment">처리하러 가기 →</button>
      </div>
  `}function kr(){let e=Rt.filter(e=>e.kind===`due`);if(!e.length)return;let t=`equipmentPopupShown_${F()}`;try{if(sessionStorage.getItem(t))return;sessionStorage.setItem(t,`1`)}catch{}let n=document.getElementById(`equipmentAlertPopup`);n&&n.remove();let r=e.slice(0,12).map(e=>{let t=e.part,n=e.kind===`low`?`<span class="eq-pill eq-pill-amber">재고 ${Number(t.currentQty||0)}</span>`:`<span class="eq-pill ${e.overdue?`eq-pill-red`:`eq-pill-amber`}">${X(ge(e.dday))}</span>`,r=e.kind===`low`?` <span style="color:#888;">(최소 ${Number(t.minimumQty||0)})</span>`:``;return`<div>${n}${X(fe(t))}${r}</div>`}).join(``),i=e.length>12?`<div style="color:#888;font-size:12px;">외 ${e.length-12}건</div>`:``;document.body.insertAdjacentHTML(`beforeend`,`
    <div class="modal-overlay" id="equipmentAlertPopup">
      <div class="modal-box" style="width:420px;">
        <h3 class="modal-title" style="margin-bottom:4px;">🔧 설비 부품 확인 필요</h3>
        <p style="font-size:12px;color:#888;margin:0 0 12px;">교체 예정일이 7일 이내이거나 지난 부품입니다.</p>
        <div class="eq-popup-list">${r}${i}</div>
        <div class="modal-actions">
          <button class="btn-secondary" id="equipmentPopupClose">닫기</button>
          <button class="btn-primary" id="equipmentPopupGo">설비 부품으로 가기</button>
        </div>
      </div>
    </div>
  `);let a=document.getElementById(`equipmentAlertPopup`);document.getElementById(`equipmentPopupClose`).addEventListener(`click`,()=>a.remove()),document.getElementById(`equipmentPopupGo`).addEventListener(`click`,()=>{a.remove(),he(`equipment`),Ce()})}function Ar(e,t){alert(`${e}는 이미 마감된 날짜여서 ${t} 작업을 진행할 수 없습니다.\n재고는 변경되지 않았습니다.\n상단의 [마감해제]로 ${e} 마감을 해제한 뒤 다시 진행해주세요.`)}async function jr(e,t){try{if(!await Ee(e))return!1;Ar(e,t)}catch(t){console.error(`생산 실행일 마감 상태 확인 실패:`,t),alert(`${e} 마감 상태를 확인하지 못했습니다. 연결을 확인한 뒤 다시 시도해주세요.`)}return!0}async function Mr(e,t,n,r=Ar){let i=e?.code===Ke;if(!i&&e?.code===`permission-denied`)try{i=await Ee(t)}catch{}return i?(r(t,n),!0):!1}async function Nr(e,t,n){if(t?.status!==`cancelled`||!t.ledgerId)return!1;let{findActiveProductionSupplements:r}=await Te(async()=>{let{findActiveProductionSupplements:e}=await import(`./productionSupplementLoad-DEzF9wR-.js`);return{findActiveProductionSupplements:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]));return(await r({db:v,date:e,ledgerId:t.ledgerId})).length===0?!1:(await Rr(e,`취소 뒤 남은 자동 차감 되돌리기`,t.staffName||`unknown`,{completion:t,productions:n})).restored===!0}async function Pr(e){let r;try{r=await ur()}catch(e){alert(y(e));return}let i=F(),a=e||i;if(await jr(a,`내일생산불러오기`))return;let o=a!==i,s=o?Ct:R,c=o?wt:B;try{if(await Nr(a,c,s)){if(await J(),Y(),r=await ur(),o&&V!==a){alert(`남아 있던 차감은 재고로 되돌렸습니다.
그 사이 처리할 날짜가 바뀌어 불러오기를 하지 못했습니다. 메인에서 다시 해주세요.`);return}s=o?Ct:R,c=o?wt:B}}catch(e){await Mr(e,a,`내일생산불러오기`)||alert(y(e));return}if(s.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(c?.status===`completed`){alert(`내일생산불러오기는 하루 1회만 가능합니다.`);return}let l=await Fr(a,s);if(l.length>0){Ir(l);return}let u=await t(n(v,`staffGroups`,`lead`)),d=u.exists()&&u.data().members||[];$(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      ${o?`※ ${a} 소급 실행입니다. 해당일에 했어야 할 차감을 지금 수행합니다.<br>`:``}
      다음 영업일(${j(a)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
    </p>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${d.map(e=>`<option value="${N(e.name)}">${N(e.name)}</option>`).join(``)}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnConfirmLoad">확인</button>
    </div>
  `),document.getElementById(`btnConfirmLoad`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}let t=document.getElementById(`btnConfirmLoad`);if(!t.disabled){t.disabled=!0;try{await r();let t=await Fr(a,s);if(t.length){Ir(t);return}closeModal(),await Lr(a,e,s)}catch(e){alert(y(e))}finally{t.disabled=!1}}})}async function Fr(e,r=R){let a=[];bt.items.forEach(e=>{e.jumpMenu===`schedule`?a.push({kind:`schedule`,text:`📦 ${e.reason||e.label}`,jumpMenu:`schedule`}):e.jumpMenu===`egg`?a.push({kind:`egg`,text:`🥚 ${e.reason||e.label}`,jumpMenu:`egg`}):e.label===`제품입고 미완료`&&a.push({kind:`productTransfer`,text:`📦 ${e.reason||e.label}`,jumpMenu:`main`})});let s={},c={};for(let e of r){(e.ingredientsSnapshot||[]).forEach(e=>{e.autoDeductInventory&&e.meatTypeId&&(s[e.meatTypeId]||(s[e.meatTypeId]={neededG:0,name:e.name}),s[e.meatTypeId].neededG+=e.requiredQtyG)});let r=z.find(t=>t.id===e.recipeId);if(r?.category===`raw`&&r.bagTypeId){let i=e.rawBoxQty||0;(await t(n(v,`bagTypes`,r.bagTypeId))).exists()&&(c[r.bagTypeId]=(c[r.bagTypeId]||0)+i*20)}}for(let[e,r]of Object.entries(c)){let i=await t(n(v,`bagTypes`,e));if(!i.exists())continue;let o=i.data(),s=o.currentQty||0;s<r&&a.push({kind:`bag`,text:`🛍️ ${o.name||``} 봉투 재고 부족 — 필요 ${r}장 / 현재 ${s}장`,jumpMenu:`bag`})}let l={},u=Object.entries(s).filter(([,e])=>!e.name).map(([e])=>e);await Promise.all(u.map(async e=>{try{let r=await t(n(v,`meatTypes`,e));r.exists()?l[e]=r.data().name||e:l[e]=e}catch{l[e]=e}}));for(let[e,{neededG:t,name:n}]of Object.entries(s)){let r=_t.filter(t=>t.meatTypeId===e&&t.stage===`repacked`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),i=_t.filter(t=>t.meatTypeId===e&&t.stage===`processed`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),o=_t.filter(t=>t.meatTypeId===e&&t.stage===`frozen`&&t.remaining>0).reduce((e,t)=>e+t.remaining,0),s=r+i+o;if(s<t){let c=_t.find(t=>t.meatTypeId===e)?.meatNameSnapshot||n||l[e]||`원료명 확인 필요`;a.push({kind:`meat`,text:`🥩 ${c} 원료 재고 부족 — 필요 ${(t/1e3).toFixed(1)}kg / 현재 ${(s/1e3).toFixed(1)}kg (재포장 ${(r/1e3).toFixed(1)} + 전처리 ${(i/1e3).toFixed(1)} + 냉동창고 ${(o/1e3).toFixed(1)})`,jumpMenu:`meat`})}}let d=(await p(i(_(v,`activityLogs`),o(`date`,`==`,e),o(`action`,`==`,`autoRepack`)))).docs.map(e=>({id:e.id,...e.data()})).filter(e=>(e.subAction===`trigger`||e.subAction===`diff`)&&e.acknowledged!==!0);return d.length>0&&a.push({kind:`autoRepack`,text:`🔄 자동 재포장 확인 미완료 ${d.length}건`,jumpMenu:`main`}),a}function Ir(e){$(`
    <h3 class="modal-title">내일생산불러오기를 진행할 수 없습니다</h3>
    <p style="font-size:12px;color:#666;margin-bottom:12px;">
      아래 항목을 확인해주세요.
    </p>
    <div class="tload-blocker-list">
      ${e.map((e,t)=>`
      <div class="tload-blocker-row">
        <span class="tload-blocker-num">${[`①`,`②`,`③`,`④`,`⑤`,`⑥`,`⑦`,`⑧`,`⑨`,`⑩`][t]||`${t+1}.`}</span>
        <span class="tload-blocker-text">${X(e.text)}</span>
        <button class="tload-blocker-jump" data-jump="${N(e.jumpMenu)}">처리하러 →</button>
      </div>
    `).join(``)}
    </div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeModal()">확인</button>
    </div>
  `),document.querySelectorAll(`.tload-blocker-jump`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.jump;closeModal(),he(t),Ce()})})}async function Lr(e,t,n=R,r=Ar){let i=j(e),a=P.epoch,o=be?.uid,s=async()=>{if(!o||be?.uid!==o||P.epoch!==a)throw Error(`로그인 상태가 변경됐습니다. 새로고침해주세요.`)},c=!1;try{let r=await Ge({db:v,date:e,productionIds:n.map(e=>e.id),recipeIds:n.map(e=>e.recipeId),stockIds:_t.map(e=>e.id),assertCurrent:s,build:async({writer:n,executionId:r,meatStocks:a,recipes:o,targetProductions:s})=>qe({db:v,today:e,nextBizDay:i,staffName:t,writer:n,executionId:r,meatStocks:a,recipes:o,targetProductions:s,recordMeatLog:e=>ke(e,{writer:n}),recordActivity:e=>A(e,{writer:n}),notify:e=>{throw Error(e)}})});if(c=!0,r.aborted)return;await J(),Y(),alert(r.alreadyCompleted?`이미 완료된 생산입니다. 중복 차감하지 않았습니다.`:`내일생산불러오기 완료!`)}catch(t){if(console.error(t),!c&&await Mr(t,e,`내일생산불러오기`,r)){try{await J(),Y()}catch(e){console.error(`마감 거절 후 화면 갱신 실패:`,e),alert(`화면을 최신 상태로 갱신하지 못했습니다. 브라우저를 새로고침해 현재 상태를 확인해주세요.`)}return Ke}alert(`생산 저장 상태를 확인해주세요. 새로고침 후 완료 여부를 확인하면 중복 차감을 피할 수 있습니다.
`+y(t))}}async function Rr(e,t,n,r={completion:B,productions:R}){let i=P.epoch,a=be?.uid,o=r.completion?.ledgerId;if(!o)throw Error(`생산 완료 원장을 확인해주세요.`);return We({db:v,date:e,today:F(),ledgerId:o,productionIds:r.productions.map(e=>e.id),staff:n,uid:a,reason:t,assertCurrent:async()=>{if(!a||be?.uid!==a||P.epoch!==i)throw Error(`로그인 상태가 변경됐습니다.`)},confirmChanged:e=>b({title:`재고 변동 감지`,message:e.label+` 재고가 변경됐습니다. 이 작업의 차감분만 복원할까요? 모든 항목을 함께 처리합니다.`,confirmText:`복원`,danger:!0})})}async function zr(){let e;try{e=await ur()}catch(e){alert(y(e));return}if(await jr(F(),`내일생산불러오기 취소`)||!await b({title:`내일생산불러오기 취소`,message:`내일생산불러오기를 취소하시겠습니까?
차감된 재고가 복원됩니다.`,confirmText:`취소`,danger:!0}))return;let t=await x({title:`내일생산불러오기 취소`,message:`이 작업에서 차감한 재고가 복원되고 마감 차단 항목이 다시 활성화됩니다.`,label:`취소 사유`,placeholder:`예: 생산 일정 변경`,required:!0,multiline:!0});if(t===null||!t)return;let n=F();try{await e()}catch(e){alert(y(e));return}let r=B?.staffName||`unknown`;B?.executionId||`${B?.runDate||n}`;let i=!1;try{await Rr(n,`내일생산불러오기 취소 - ${t}`,r),i=!0,await J(),Y(),alert(`취소 완료! 재고가 복원되었습니다.`)}catch(e){if(console.error(e),!i&&await Mr(e,n,`내일생산불러오기 취소`))return;alert(`오류가 발생했습니다: `+y(e))}}async function Br(e){let r=F(),i=typeof e==`string`&&/^\d{4}-\d{2}-\d{2}$/.test(e)?e:r,a=i!==r,o=()=>a?V===i?{completion:wt,productions:Ct}:null:{completion:B,productions:R},s=()=>{Y(),alert(`원료·봉투는 재고로 되돌렸습니다.
그 사이 처리할 날짜가 바뀌어 다시 차감하지 못했습니다. 메인에서 [내일생산불러오기]를 다시 해주세요.`)},c=`새로고침은 대표/사무실 계정만 가능합니다.
대표/사무실 계정에 [전체 다시 차감]을 요청해주세요.`,l;try{l=await ur([`admin`,`office`])}catch(e){alert(I===`production`?c:y(e));return}if(I!==`admin`&&I!==`office`){alert(c);return}let u=o();if(!u){alert(`이 날짜는 지금 처리할 날짜가 아닙니다. 화면을 새로고침한 뒤 다시 해주세요.`);return}if(u.completion?.status!==`completed`){alert(`마감 상태에서만 새로고침이 가능합니다.`);return}if(u.productions.length===0){alert(`다음 영업일에 등록된 생산이 없습니다.`);return}if(await jr(i,`내일생산불러오기 새로고침`)||!await b({title:`내일생산불러오기 새로고침`,message:(a?`${i}에 불러온 생산입니다.\n`:``)+`기존 차감을 복원하고 변경된 다음 영업일 생산 기준으로 다시 차감합니다.
진행하시겠습니까?`,confirmText:`진행`,danger:!1}))return;let d=await x({title:`내일생산불러오기 새로고침`,message:`차감 복원 후 차단 항목이 다시 검사됩니다.`,label:`새로고침 사유`,placeholder:`예: 다음 영업일 생산 추가`,required:!0,multiline:!0});if(d===null||!d)return;try{await l()}catch(e){alert(y(e));return}let f=u.completion?.staffName||`unknown`;u.completion?.executionId||`${u.completion?.runDate||i}`;let p=!1;try{if(await Rr(i,`새로고침 롤백 - ${d}`,f,u),p=!0,await J(),u=o(),!u){s();return}a&&Y();let e=await Fr(i,u.productions);if(e.length>0){Y(),alert(`차감 복원은 완료됐습니다.
차단 항목이 발견되어 재차감을 진행할 수 없습니다.
차단 항목 처리 후 [내일생산불러오기] 버튼으로 다시 진행해주세요.`),Ir(e);return}let r=await t(n(v,`staffGroups`,`lead`)),c=r.exists()&&r.data().members||[];$(`
      <h3 class="modal-title">새로고침 — 담당자 선택</h3>
      <p style="font-size:12px;color:#888;margin-bottom:16px;">
        차감 복원 완료. 다음 영업일(${j(i)}) 생산 기준으로 재차감합니다.
        <br>여기서 취소하면 원료·봉투가 재고로 되돌아간 상태로 남습니다. [내일생산불러오기${a?` (${i} 소급)`:``}]를 다시 해야 마감할 수 있습니다.
      </p>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_refresh_staff">
          <option value="">선택</option>
          ${c.map(e=>`<option value="${N(e.name)}">${N(e.name)}</option>`).join(``)}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal()">취소 (마감 안 된 상태로 유지)</button>
        <button class="btn-primary" id="btnConfirmRefresh">재차감 진행</button>
      </div>
    `),document.getElementById(`btnConfirmRefresh`).addEventListener(`click`,async()=>{let e=document.getElementById(`m_refresh_staff`).value;if(!e){alert(`담당자를 선택해주세요.`);return}closeModal();let t=o();if(!t){s();return}if(await Lr(i,e,t.productions,e=>{alert(`차감 복원은 완료됐고, ${e}가 마감되어 재차감은 진행하지 못했습니다.\n상단의 [마감해제]로 ${e} 마감을 해제한 뒤 [내일생산불러오기]로 다시 진행해주세요.`)})!==`production/closed-day`)try{await A({action:`closing`,subAction:`refresh`,date:i,staff:e,message:`🔄 내일생산불러오기 새로고침 — 사유: ${d} / 담당: ${e} (이전 담당: ${f})`,details:{previousStaff:f,newStaff:e,reason:d,runDate:j(i)}}),await xn(),Ln()}catch(e){console.warn(`[6E-3] 새로고침 활동 로그 발행 실패:`,e)}})}catch(e){console.error(`[6E-3] 새로고침 실패:`,e),(p||!await Mr(e,i,`내일생산불러오기 새로고침`))&&alert(`오류가 발생했습니다: `+y(e)),await J(),Y()}}function Vr(){kt++,q(K),q(G),U=null,W=[],Ot=null,Y()}function Hr(){let e=B?.status===`completed`,t=U!==null,n=!t&&V!==null,r=t?W:n?St:e?R:ht;$(`
    <h3 class="modal-title">${t?`${U} 생산 현황`:n?`${V} 생산 현황`:e?`${j(F())} 불러온 생산`:`${F()} 생산 현황`}</h3>
    <div class="main-production-grid big-view">
      ${r.length===0?`<p style="color:#aaa">생산 없음</p>`:r.map(e=>or(e)).join(``)}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `)}function $(e){let t=document.getElementById(`modalOverlay`);t&&t.remove();let n=document.createElement(`div`),r=e.includes(`main-production-grid big-view`);n.id=`modalOverlay`,n.className=`modal-overlay`,n.innerHTML=`<div class="modal-box ${r?`modal-wide`:``}">${e}</div>`,document.body.appendChild(n)}ee(`main`,function(){let e=document.getElementById(`modalOverlay`);e&&e.remove()});async function Ur(e,{today:t=F(),weekOffset:r=0,onProductionReady:a}={}){let s=e=>(e.catch(()=>{}),e),c=O(`main:logs`,()=>Sn(e));c.catch(()=>{});let l=s(e.getDocs(_(v,`recipes`))),u=e.getDocs(i(_(v,`supplementTypes`),o(`active`,`==`,!0))).catch(()=>null),d=s(e.getDocs(_(v,`meatTypes`))),f=s(e.getDocs(_(v,`meatStocks`))),p=s(e.getDoc(n(v,`eggStock`,`global`))),m=s(e.getDoc(n(v,`productionCompletion`,t))),h=s(O(`main:calendar`,()=>Xt(r,e))),g=s(O(`main:equipment`,()=>e.once(`equipmentAlerts:`+t,()=>_e(t,e))));await O(`main:holidays`,()=>ie(e));let y=j(t),ee=s(O(`main:productions`,()=>Ut([t,y],e))),b=s(O(`main:closing-date`,()=>He(t,null,e))),x=Ue(t,e);x.catch(()=>{});let[te,S,C,w]=await Promise.all([ee,l,m,b]),T=w?.date||null,ne=T?s(e.getDoc(n(v,`productionCompletion`,T))):null,E=Wt(te,T?await Ut([T,j(T)],e):[]),D=e=>e.docs.map(e=>({id:e.id,...e.data()})),re=e=>e?.exists()?{id:e.id,...e.data()}:null;a?.({today:t,nextBizDay:y,overdueNextBizDay:T?j(T):null,allProds:E,recipeRows:D(S),completionDoc:re(C),overdueClosing:w});let[ae,oe,k,se,ce,le,A,ue,de]=await Promise.all([d,f,p,ne,w?.blockingData||x,h,g,c,u]),fe=Ye({today:t,nextBizDay:y,overdueNextBizDay:T?j(T):null,allProds:E,recipeRows:D(S),meatTypeRows:D(ae),meatRows:D(oe),eggStock:k.exists()?k.data():{currentQty:0,minimumQty:0},equipmentAlerts:A,completionDoc:re(C),overdueCompletionDoc:re(se),overdueClosing:w,blocks:ce,calendar:le,logs:ue});return fe.supplementTypeRows=de?D(de):[],fe}function Wr({today:e,nextBizDay:t,allProds:n,recipeRows:r,completionDoc:i,overdueClosing:a}){let o=a?.date,s=i?.status===`completed`,c=o||(s?t:e),l=o?`${c} 생산 (${a.closed?`마감 후 미처리 확인 필요`:`미마감 처리 필요`})`:s?`불러온 다음 영업일 생산 (${c})`:`${c} 생산`,u=n.filter(e=>e.date===c&&e.status!==`deleted`),d=document.getElementById(`mainContent`);d.innerHTML=`${qt()}<div class="main-layout" data-production-preview>
    <div class="main-panel-left"><div class="main-panel-header"><span class="main-panel-title">📅 ${l}</span></div>
      <div class="main-production-area"><p role="status">입고·마감 및 나머지 정보를 확인 중입니다.</p>
        <div class="main-production-grid">${u.length?u.map(e=>or(e,r,!1)).join(``):`<div class="main-empty">해당 날짜에 생산 없음</div>`}</div>
      </div></div>
    <div class="main-panel-right-top"><p role="status">출고원료와 로그 불러오는 중…</p></div>
    <div class="main-panel-right-bottom"><p role="status">캘린더 불러오는 중…</p></div>
  </div>`}function Gr({cacheOnly:e=!0}={}){let t=F();return L.prepare?.(JSON.stringify([t,0]),e=>Ur(e,{today:t,weekOffset:0}),{cacheOnly:e})}var Kr=0;async function qr({force:e=!1}={}){let t=++Kr,n=typeof performance>`u`?Date.now():performance.now(),r=document.getElementById(`mainContent`),a=F(),s=H,c=JSON.stringify([a,s]),l=S();At!==l&&(At=l,kt++,q(K),q(G),U=null,W=[],Ot=null,jt=Oe(L,()=>{let e=U;return e?Nt(e):Promise.resolve()}),ye(()=>{delete r.dataset.productionPending,delete r.dataset.productionReady,q(K),q(G),jt=null}));let u=Oe(L,qr),d=P.epoch,f=!L.model&&!U;if(f){r.dataset.productionPending=`true`;let e=document.getElementById(`subToday`);e&&(e.disabled=!0)}let p;try{p=await O(`main:complete-model`,()=>L.load(e=>Ur(e,{today:a,weekOffset:s,onProductionReady:f?e=>{t!==Kr||d!==P.epoch||!l?.isCurrent()||me!==`main`||U||document.querySelector(`.modal-overlay`)||(Wr(e),oe(`main:production-visible`,n),r.dataset.productionReady=`true`)}:void 0}),{key:c,force:e,onChange:e=>{if(e.error?.code===`permission-denied`){P.clear(),r.textContent=`접근 권한을 다시 확인하려면 새로고침해주세요.`;return}u(e)}}))}catch(e){throw t===Kr&&l?.isCurrent()&&delete r.dataset.productionReady,e}if(!p||t!==Kr||d!==P.epoch||!l?.isCurrent()||!r.isConnected||me!==`main`)return;Kt(p,{detached:!0}),U&&e&&await Nt(U),Y(),delete r.dataset.productionReady,delete r.dataset.productionPending;let m=document.getElementById(`subToday`);m&&(m.disabled=!1),oe(`main:interactive`,n),kr();let h=L.viewRevision,g=S();dt!==h.id&&(dt=h.id,ft.run(`main:`+a,async()=>{let e=T(`instant:main:`+c),t=ue((await e.getDocs(i(_(v,`activityLogs`),o(`date`,`==`,a)))).docs.map(e=>({id:e.id,...e.data()})));if(await ir(a,t,e,{eggStock:p.eggStock,equipmentAlerts:p.equipmentAlerts}),!(!g?.isCurrent()||h.epoch!==P.epoch)&&(await t.flush()).failedIds.length)throw Error(`일부 자동 알림을 확인하지 못했습니다. 다시 불러와주세요.`)}).catch(e=>{dt=null,g?.isCurrent()&&Bt(r),console.error(`[메인 자동 알림]`,e)}))}export{Gt as assertAutomaticAlertsReady,Gr as preparePage,zt as renderMain,Wn as showClosingLogsModal,Pt as showProductionDatePicker};