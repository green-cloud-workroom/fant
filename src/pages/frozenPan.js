import { fingerprint } from '../services/actionGateway.js';
import { atomicStockOperation, stockOperationId } from '../services/atomicStockOperation.js';
import {openPanReceipt} from './frozenPanReceipt.js';
import {groupLots, productGroups, productBoard, stockTotals, lotTotal, movements, historyTable} from './frozenPanDesk.js';
import { escapeHtml } from '../utils/html.js';
import {showStatus} from '../utils/statusToast.js';
import {movementLabel} from '../services/manualMovementLogic.js';
import {movementFields,bindMovementForm,readMovementForm} from '../utils/movementForm.js';
import {saveManualMovement} from '../services/manualMovements.js';
import {currentUser} from '../app.js';
import { registerCloseModal } from '../utils/modalManager.js';
import { db } from '../firebase.js';
import {
  collection, getDocsFromServer as getDocs, doc, addDoc, updateDoc, query, orderBy, getDocFromServer as getDoc, writeBatch
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { getActiveFreezeDryRecipes } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { round2, breadToFrozenPan } from '../utils/number.js';
import { showConfirmModal } from '../utils/modal.js';
import { recordActivity } from '../services/activityLogs.js';
import { renderFreezeOpInTab,disposeFreezeOpTab } from './freezeOp.js';


let freezeDryRecipes = [];
const defaultDesk = () => ({tab:'stock', name:'', detail:false, kind:'all', today:false, limit:60, lots:false});
let desk = defaultDesk();
let receiptDrafts = new Map();
let historyPage;
let historyRequest;

export async function renderFrozenPan({force=false}={}) {
 desk=defaultDesk();
 receiptDrafts=new Map();
 document.getElementById('mainContent').innerHTML='<p style="padding:24px">동결판 재고 로딩 중...</p>';
 await refreshFrozenPanLayout({force});
}

async function loadFrozenPanRows(scope={getDocs,getDoc}) {
  const q = query(collection(db, 'frozenPanStock'), orderBy('date', 'desc'));
  const snap = await scope.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadFrozenPanLots(scope={getDocs,getDoc}, includeEmpty=false) {
  const snap = await scope.getDocs(collection(db, 'frozenPanLots'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(l => includeEmpty ? ((!l.closed || Number(l.remaining) === 0) && Number(l.remaining) >= 0) : !l.closed && Number(l.remaining || 0) > 0);
}

async function loadBreadPanLots(scope={getDocs,getDoc}, includeEmpty=false) {
  const snap = await scope.getDocs(collection(db, 'breadPanLots'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => includeEmpty ? ((!l.closed || Number(l.remaining) === 0) && Number(l.remaining) >= 0) : !l.closed);
}

async function loadBreadPanLogs(scope={getDocs,getDoc}) {
  const snap = await scope.getDocs(collection(db, 'breadPanLogs'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadFrozenPanLogs(scope={getDocs,getDoc}) {
  const snap = await scope.getDocs(collection(db, 'frozenPanLogs'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function refreshFrozenPanLayout({force=false}={}) {
 const content=document.getElementById('mainContent');
 const page=getPageContext();
 const onChange=pageRefresh(frozenPanResource,refreshFrozenPanLayout);
 if(historyPage!==page) {
   historyPage=page;
   registerPageCleanup(()=>{historyPage=null;historyRequest=null;});
 }
 // Freeze orders have their own read permission. Keep their optional read out of
 // the stock resource, whose permission guard must still protect all stock rows.
 if (!historyRequest || force) historyRequest=loadFreezeHistory({getDocs});
 const requestedHistory=historyRequest;
 const [data,history]=await Promise.all([
   frozenPanResource.load(scope=>loadInitialModel(scope),{force,onChange}),
   requestedHistory,
 ]);
 if(!data||requestedHistory!==historyRequest||!content?.isConnected||(page&&!page.isCurrent()))return;
 freezeDryRecipes=data.recipes;staffCache=data.staff;
 const groups=groupLots(data.breadPanLots), frozen=groupLots(data.lots);
 const model={...data,...history,breadGroups:groups,frozenGroups:frozen,
   groups:productGroups(data.recipes,groups,frozen),
   records:movements(data.breadPanLogs,data.frozenPanLogs,history.freezeOrders)};
 renderFrozenPanLayout(model);
}

function renderFrozenPanLayout(data) {
  const root = document.getElementById('mainContent');
  const {breadGroups:bread,frozenGroups:frozen,groups,records} = data;
  const names = groups.flatMap(([,items])=>items);
  if (!names.includes(desk.name)) desk.name = names[0] || '';
  const orders = data.rows.filter(row=>row.type !== 'work' && row.status !== 'cancelled');
  const tabs = [['stock','품목별 재고'],['history','전체 이력'],['frozenPan','동결판 발주 확인'],['freezeOp','동결가동']];
  const history = rows => historyTable(rows, desk.limit, renderBreadPanLogRow, renderFrozenPanLogRow, data.freezeHistoryUnavailable);
  const name = desk.name;
  const redraw = () => renderFrozenPanLayout(data);
  let body;
  if (desk.tab === 'stock') {
    const lotsHtml = renderBreadPanTab(bread, name) + renderFrozenPanTab(frozen, name);
    const count = (bread[name]?.length || 0) + (frozen[name]?.length || 0);
    body = '<div class="pan-split '+(desk.detail?'show-detail':'')+'">'+productBoard(groups,name,bread,frozen)
      +'<div class="pan-detail"><section class="pan-box"><button class="btn-secondary pan-back" data-back>‹ 품목 목록</button>'
      +'<header><h3>'+escapeHtml(name || '품목 없음')+'</h3><small>현재 재고</small></header>'
      +'<div class="pan-numbers"><span>빵판 <b>'+lotTotal(bread[name])+'개</b></span><span>동결판 <b>'+lotTotal(frozen[name])+'판</b></span></div>'
      +'<details '+(desk.lots?'open':'')+'><summary>입고일별 잔량 · '+count+'건</summary>'+lotsHtml+'</details></section>'
      +'<section class="pan-box"><header><h3>품목 이력</h3><button class="btn-secondary" data-history>전체 이력 보기 ›</button></header>'
      +history(records.filter(r=>r.log.productName===name))+'</section></div></div>';
  } else if (desk.tab === 'history') {
    const shown = records.filter(r=>(desk.kind==='all'||desk.kind===r.kind)&&(!desk.today||r.log.date===getToday()));
    body = '<section class="pan-box"><header><h3>전체 이력</h3><small>전체 품목 · '+shown.length+'건</small></header>'
      +'<div class="pan-filters">'+[['all','전체'],['bread','빵판'],['frozen','동결판']].map(([key,label])=>
        '<button class="btn-secondary" data-kind="'+key+'" aria-pressed="'+(key===desk.kind)+'">'+label+'</button>').join('')
      +'<label>기간 <select id="panPeriod"><option value="all">전체 기간</option><option value="today" '+(desk.today?'selected':'')+'>오늘</option></select></label></div>'+history(shown)+'</section>';
  } else if (desk.tab === 'frozenPan') {
    body = '<section class="pan-box"><header><h3>동결판 발주 확인</h3></header><div class="table-wrap"><table class="data-table"><thead><tr><th>날짜</th><th>구분</th><th>담당자</th><th>내용</th><th>상태</th><th>작업</th></tr></thead><tbody>'
      +orders.map(renderPanRow).join('')+'</tbody></table></div>'+(!orders.length?'<p>발주 내역이 없습니다.</p>':'')+'</section>';
  } else body = '<div id="freezeOpContent">동결가동 자료 로딩 중…</div>';
  root.innerHTML = '<div class="frozen-pan-page pan-desk"><header class="pan-heading"><h2>동결판 재고</h2><div>'
    +'<button id="panWork" class="btn-secondary">전처리 기록</button><button id="panAdjust" class="btn-secondary">수동조정</button><button id="panIncoming" class="btn-primary">＋ 입고</button></div></header>'
    +stockTotals(data.breadPanLots,data.lots)+'<nav class="pan-tabs">'+tabs.map(([key,label])=>
      '<button class="tab-btn '+(desk.tab===key?'active':'')+'" data-tab="'+key+'" aria-pressed="'+(desk.tab===key)+'">'+label+'</button>').join('')+'</nav>'+body+'</div>';

  root.querySelector('#panIncoming').addEventListener('click',openReceiptPicker);
  root.querySelector('#panWork').addEventListener('click',()=>showWorkRowModal(orders,data.lots));
  root.querySelector('#panAdjust').addEventListener('click',()=>{
    showModal('<h3 class="modal-title">수동조정</h3><div class="pan-adjust-options"><button id="breadAdjust" class="btn-secondary">빵판 조정 (개)</button><button id="frozenAdjust" class="btn-secondary">동결판 조정 (판)</button></div><div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button></div>');
    document.getElementById('breadAdjust').onclick=showBreadPanAdjustModal;
    document.getElementById('frozenAdjust').onclick=showFrozenPanAdjustModal;
  });
  function switchTab(tab) {
    const leavingFreeze = desk.tab === 'freezeOp' && tab !== desk.tab;
    desk.tab=tab; desk.limit=60;
    if (tab==='stock') desk.detail=false;
    if (leavingFreeze) { disposeFreezeOpTab(); return refreshFrozenPanLayout({force:true}); }
    redraw();
    if (tab==='history') {
      historyRequest=null;
      return refreshFrozenPanLayout();
    }
  }
  root.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));
  root.querySelector('[data-history]')?.addEventListener('click',()=>{desk.kind='all';desk.today=false;switchTab('history');});
  root.querySelectorAll('[data-product]').forEach(btn=>btn.addEventListener('click',()=>{
    desk.name=btn.dataset.product; desk.detail=true; desk.lots=false; desk.limit=60;
    redraw();
    if (window.matchMedia?.('(max-width:700px)').matches) {
      root.querySelector('.pan-back')?.focus({preventScroll:true});
      root.scrollTop=0;
    }
  }));
  root.querySelector('[data-back]')?.addEventListener('click',()=>{
    desk.detail=false; redraw();
    root.querySelector('.pan-board [aria-pressed="true"]')?.focus();
  });
  const details = root.querySelector('.pan-detail details');
  details?.addEventListener('toggle',()=>{if(details.isConnected)desk.lots=details.open;});
  root.querySelectorAll('[data-kind]').forEach(btn=>btn.addEventListener('click',()=>{desk.kind=btn.dataset.kind;desk.limit=60;redraw();}));
  root.querySelector('#panPeriod')?.addEventListener('change',event=>{desk.today=event.target.value==='today';desk.limit=60;redraw();});
  root.querySelector('[data-more]')?.addEventListener('click',()=>{desk.limit+=60;redraw();});
  if (desk.tab === 'frozenPan') bindFrozenPanTabEvents(orders,data.lots);
  if (desk.tab === 'freezeOp') {
    const page=getPageContext();
    renderFreezeOpInTab().catch(error=>{
      const host=document.getElementById('freezeOpContent');
      if(host&&(!page||page.isCurrent())){host.textContent='동결가동 자료를 불러오지 못했습니다. 탭을 다시 선택해주세요.';console.error(error);}
    });
  } else disposeFreezeOpTab();
}

function getSourceBadge(source) {
  if (!source) return '';

  const config = {
    tenderIn:    { label: '텐더', color: '#1f6fb2', bg: '#e8f3fc' },
    preprocess:  { label: '전처리', color: '#6E655C', bg: '#EFECE8' },
    adjust:      { label: '조정', color: '#b97a1f', bg: '#fdf3e0' },
  }[source];

  if (!config) return '';

  return `<span style="display:inline-block;font-size:10px;background:${config.bg};color:${config.color};padding:1px 6px;border-radius:3px;margin-left:4px;font-weight:500;vertical-align:middle;">${config.label}</span>`;
}

function lotDetail(groups, name, kind) {
  const entries = name === undefined ? Object.entries(groups) : [[name, groups[name] || []]];
  return entries.filter(([,lots])=>lots.length).map(([product,lots])=>
    '<div class="stat-item"><span class="stat-label">'+escapeHtml(product)+'</span><div>'
    +lots.map(lot=>'<div>'+escapeHtml(lot.date)+' · '+(kind==='bread'?'빵판':'동결판')+' '+escapeHtml(lot.remaining)+(kind==='bread'?'개':'판')
      +(kind==='frozen'?getSourceBadge(lot.source):'')+'</div>').join('')+'</div></div>').join('');
}
function renderBreadPanTab(groups, name) { return lotDetail(groups,name,'bread'); }
function renderFrozenPanTab(groups, name) { return lotDetail(groups,name,'frozen'); }

function renderBreadPanLogRow(log) {
  const typeLabel = movementLabel(log,{
    incoming: '입고',
    preprocess: '전처리 사용',
    adjust: '수동조정',
    rollback: '롤백',
  }[log.type] || log.type);

  const qtyClass = log.qty > 0 ? 'stock-quantity--increase' : 'stock-quantity--decrease';
  const qtySign = log.qty > 0 ? '+' : '';

  // 비고 — preprocess는 expected/actual 표시, 아니면 note/reason
  let noteText = '-';
  if (log.type === 'preprocess' && log.expectedFrozenQty != null && log.actualFrozenQty != null) {
    const diffText = log.diff > 0 ? `+${log.diff}` : log.diff < 0 ? `${log.diff}` : '0';
    noteText = `이론 ${log.expectedFrozenQty} / 실측 ${log.actualFrozenQty} (차 ${diffText})`;
    if (log.note || log.reason) noteText += ' · '+(log.note || log.reason);
  } else if (log.note) {
    noteText = log.note;
  } else if (log.reason) {
    noteText = log.reason;
  }

  // 제품명 옆에 차감/조정 대상 lot 입고일 표시 (입고 자기 자신은 제외)
  const lotDateLabel = (log.lotDate && log.type !== 'incoming')
    ? `<span style="font-size:11px;color:#999;margin-left:4px;">(입고 ${escapeHtml(log.lotDate)})</span>`
    : '';

  return `
    <tr>
      <td>${escapeHtml(log.date || '-')}</td>
      <td><span class="tag stock-movement-badge" data-movement-label="${escapeHtml(typeLabel)}">${escapeHtml(typeLabel)}</span></td>
      <td>${escapeHtml(log.productName || '-')}${lotDateLabel}</td>
      <td class="${qtyClass}" style="font-weight:500;">${qtySign}${escapeHtml(log.qty || 0)}개</td>
      <td>${escapeHtml(log.staffName || '-')}</td>
      <td style="font-size:12px;color:#666;">${escapeHtml(noteText)}</td>
    </tr>
  `;
}

function renderFrozenPanLogRow(log) {
  const typeLabel = movementLabel(log,{
    tenderIn: '텐더동결 입고',
    preprocess: '전처리 입고',
    orderDeduct: '발주 차감',
    orderRollback: '발주 복원',
    freezeDeduct: '동결가동 차감',
    freezeRestore: '동결가동 복원',
    adjust: '수동조정',
  }[log.type] || log.type);

  const qtyClass = log.qty > 0 ? 'stock-quantity--increase' : 'stock-quantity--decrease';
  const qtySign = log.qty > 0 ? '+' : '';

  // 비고
  let noteText = '-';
  if (log.note) {
    noteText = log.note;
  } else if (log.reason) {
    noteText = log.reason;
  }

  return `
    <tr>
      <td>${escapeHtml(log.date || '-')}</td>
      <td><span class="tag stock-movement-badge" data-movement-label="${escapeHtml(typeLabel)}">${escapeHtml(typeLabel)}</span></td>
      <td>${escapeHtml(log.productName || '-')}</td>
      <td class="${qtyClass}" style="font-weight:500;">${qtySign}${escapeHtml(log.qty || 0)}판</td>
      <td>${escapeHtml(log.staffName || '-')}</td>
      <td style="font-size:12px;color:#666;">${escapeHtml(noteText)}</td>
    </tr>
  `;
}

function bindFrozenPanTabEvents(rows, lots) {
  // 발주 확인 버튼
  document.querySelectorAll('.btn-order-confirm').forEach(btn => {
    btn.addEventListener('click', async () => {
      const rowId = btn.dataset.id;
      const row = rows.find(r => r.id === rowId);
      if (!row) return;
      if (await blockIfClosed(row.date)) return;

      // [묶음 5B] 발주 확인 담당자 입력 받기
      const staff = await showStaffPickerModal({
        title: '발주 확인 — 담당자 선택',
        message: '발주 확인을 진행할 담당자를 선택해주세요.',
        groups: ['senior', 'office'],
      });
      if (!staff) return;  // 취소 또는 미선택 시 중단

      await confirmOrder(row, lots, staff);
    });
  });

  // 발주 삭제 버튼
  document.querySelectorAll('.btn-order-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
 return runPageCommand(frozenPanResource,async command=>{
  const {updateDoc}=commandWrites(command);

      const __c = await showConfirmModal({ title:'발주 행 삭제', message:'발주 행을 삭제하시겠습니까?', confirmText:'삭제', danger:true }); if (!__c) return;
      const targetRow = rows.find(r => r.id === btn.dataset.id);
      if (targetRow && await blockIfClosed(targetRow.date, command)) return;
      await updateDoc(doc(db, 'frozenPanStock', btn.dataset.id), { status: 'cancelled' });
      if(!command.isCurrent())return;
      await refreshFrozenPanLayout();

 },{roles:['admin','office']});
});
  });

  // 담당자·사유·복원 안내를 한 화면에서 확인한다.
  document.querySelectorAll('.btn-order-cancel').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = rows.find(r => r.id === btn.dataset.id);
      if (!row || await blockIfClosed(row.date)) return;
      const entry = await showStaffPickerModal({
        title: '발주 확인 취소',
        message: '확인 취소 시 이 발주에서 차감한 동결판 재고가 복원됩니다.',
        groups: ['senior', 'office'], requireReason: true,
      });
      if (entry) await cancelOrder(row, lots, entry.staff, entry.reason);
    });
  });
}


function openReceiptPicker() {
  openPanReceipt({recipes:freezeDryRecipes, drafts:receiptDrafts, showModal,
    openBread:showBreadPanIncomingModal, openTender:showTenderInModal});
}

function clearReceiptDraft(productName) {
  const recipe = freezeDryRecipes.find(r=>r.displayName===productName);
  if (recipe) receiptDrafts.delete(recipe.id);
}

function showTenderInModal() {
  // 동결텐더 = 분리 작업 불필요한 동결건조 레시피 (requiresSeparation === false)
  const tenderRecipes = freezeDryRecipes.filter(r => r.requiresSeparation !== true);

  if (tenderRecipes.length === 0) {
    alert('동결텐더 레시피가 없습니다.\n\n레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 끈 레시피를 추가해주세요.');
    return;
  }

  showModal(`
    <h3 class="modal-title">텐더동결 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>제품 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${tenderRecipes.map(r => `<option value="${escapeHtml(r.displayName)}">${escapeHtml(r.displayName)}</option>`).join('')}
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
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${getStaffOptions(['senior', 'office'])}
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
  `);

  document.getElementById('btnSaveTenderIn').addEventListener('click', async () => {
 return runPageCommand(frozenPanResource,async command=>{
  const {addDoc,updateDoc}=commandWrites(command);

    const productName = document.getElementById('m_recipe').value.trim();
    const qty = parseInt(document.getElementById('m_qty').value) || 0;
    const date = document.getElementById('m_date').value;
    const staffName = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value.trim();

    if (!productName) { alert('제품을 선택해주세요.'); return; }
    if (qty <= 0) { alert('동결판 수는 0보다 커야 합니다.'); return; }
    if (!date) { alert('날짜를 입력해주세요.'); return; }
    if (!staffName) { alert('담당자를 선택해주세요.'); return; }

    if (await blockIfClosed(date, command)) return;

    const now = new Date();

    try {
      await atomicStockOperation({db,command,operationId:stockOperationId(db,document.getElementById('btnSaveTenderIn')),
        actionType:'frozenPanTenderIn',date,request:{productName,qty,staffName,note},build:async ({writer})=>{
        const {addDoc,updateDoc}=writer;
      // 1. frozenPanLots 신규 lot
      const lotRef = await addDoc(collection(db, 'frozenPanLots'), {
        productName,
        date,
        staffName,
        initialQty: qty,
        remaining: qty,
        closed: false,
        source: 'tenderIn',
        sourceRefId: null,  // tenderIn은 logId로 대체 (아래 setUpdate)
        note: note || null,
        createdAt: now,
        updatedAt: now,
      });

      // 2. frozenPanLogs 기록
      const logRef = await addDoc(collection(db, 'frozenPanLogs'), {
        type: 'tenderIn',
        date,
        productName,
        qty,
        before: 0,
        after: qty,
        lotId: lotRef.id,
        staffName,
        uid: null,
        note: note || null,
        reason: null,
        batchId: null,
        ledgerId: null,
        timestamp: now,
      });

      // 3. lot의 sourceRefId를 logId로 갱신 (추적용)
      await updateDoc(doc(db, 'frozenPanLots', lotRef.id), {
        sourceRefId: logRef.id,
      });

      // 4. stockLedger 저장
      await addDoc(collection(db, 'stockLedger'), {
        actionType: 'frozenPanTenderIn',
        actionId: logRef.id,
        timestamp: now,
        date,
        status: 'active',
        items: [{
          collection: 'frozenPanLots',
          docId: lotRef.id,
          field: 'remaining',
          delta: qty,
          before: 0,
          after: qty,
          label: `${productName} 동결판 (텐더동결 입고)`,
          stockUpdatedAtSnapshot: now,
          isNewDoc: true,
        }],
      });

      }});

      if(!command.isCurrent())return;
      clearReceiptDraft(productName);
      closeModal();
      if(!command.isCurrent())return;
      await refreshFrozenPanLayout();
      showStatus('텐더동결 입고 완료!');

    } catch (err) {
      console.error('showTenderInModal 저장 에러:', err);
      alert(`저장 중 오류가 발생했습니다.\n\n${err.message}`);
    }

 },{roles:['admin','office','production']});
});
}

function showBreadPanIncomingModal() {
  const breadPanRecipes = freezeDryRecipes.filter(r => r.requiresSeparation === true);

  if (breadPanRecipes.length === 0) {
    alert('동결생식 레시피가 없습니다.\n\n레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.');
    return;
  }

  showModal(`
    ${movementFields({incoming:true,reasonField:false})}
    <h3 class="modal-title">빵판 입고</h3>
    <div class="form-row">
      <div class="form-group">
        <label>레시피 *</label>
        <select id="m_recipe">
          <option value="">선택</option>
          ${breadPanRecipes.map(r => `<option value="${escapeHtml(r.displayName)}">${escapeHtml(r.displayName)}</option>`).join('')}
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
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${getStaffOptions(['senior', 'office'])}
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
  `);

  const getMovement=bindMovementForm({db,name:'breadPanLogs',filter:()=>({lotId:document.getElementById('m_lot')?.value||''}),filterInputs:[document.getElementById('m_lot')],onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);document.getElementById('m_adjustType').value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_note')});
  document.getElementById('btnSaveBreadPanIncoming').addEventListener('click', async () => {
 return runPageCommand(frozenPanResource,async command=>{
  const {addDoc}=commandWrites(command);

    const selection=readMovementForm(getMovement);if(!selection)return;
    const productName = document.getElementById('m_recipe').value.trim();
    const qty = round2(parseFloat(document.getElementById('m_qty').value) || 0);
    const date = document.getElementById('m_date').value;
    const staffName = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value.trim();

    if (!productName) { alert('레시피를 선택해주세요.'); return; }
    if (qty <= 0) { alert('빵판 수는 0보다 커야 합니다.'); return; }
    if (!date) { alert('날짜를 입력해주세요.'); return; }
    if (!staffName) { alert('담당자를 선택해주세요.'); return; }

    if (await blockIfClosed(date, command)) return;

    const now = new Date();

    const lotRef=doc(collection(db,'breadPanLots'));
    await saveManualMovement({db,command,name:'breadPanLogs',stockId:lotRef.id,selection,uid:currentUser?.uid||null,
      stockData:{productName,date,staffName,initialQty:qty,remaining:0,closed:false,note:note||null,createdAt:now},
      log:{type:'incoming',date,productName,qty,lotId:lotRef.id,lotDate:date,staffName,note:note||null}});

    if(!command.isCurrent())return;
    clearReceiptDraft(productName);
    closeModal();
    if(!command.isCurrent())return;
    await refreshFrozenPanLayout();
    showStatus('빵판 입고 완료!');

 },{roles:['admin','office','production']});
});
}

async function showBreadPanAdjustModal() {
  // 실사 보정/사용 취소는 잔량 0인 원본도 선택할 수 있어야 한다.
  const allBreadLots = await loadBreadPanLots({getDocs,getDoc}, true);

  if (allBreadLots.length === 0) {
    alert('조정할 빵판 lot이 없습니다.\n빵판 입고를 먼저 진행해주세요.');
    return;
  }

  // 제품별 lot 그룹핑 (드롭다운에 lot ID + 잔량 표시)
  const lotOptions = allBreadLots
    .sort((a, b) => {
      const nameDiff = a.productName.localeCompare(b.productName);
      if (nameDiff !== 0) return nameDiff;
      return a.date.localeCompare(b.date);
    })
    .map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.productName)} / ${escapeHtml(l.date)} / 잔량 ${escapeHtml(l.remaining)}개</option>`)
    .join('');

  showModal(`
    ${movementFields({incoming:false,reasonField:false})}
    <h3 class="modal-title">빵판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${lotOptions}
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
        ${getStaffOptions(['senior', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBreadPanAdjust">저장</button>
    </div>
  `);

  const getMovement=bindMovementForm({db,name:'breadPanLogs',filter:()=>({lotId:document.getElementById('m_lot')?.value||''}),filterInputs:[document.getElementById('m_lot')],onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);document.getElementById('m_adjustType').value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_reason')});
  document.getElementById('btnSaveBreadPanAdjust').addEventListener('click', async () => {
 return runPageCommand(frozenPanResource,async command=>{
  const {getDoc,addDoc,updateDoc}=commandWrites(command);

    const selection=readMovementForm(getMovement);if(!selection)return;
    const lotId = document.getElementById('m_lot').value;
    const adjustType = document.getElementById('m_adjustType').value;
    const qtyInput = round2(parseFloat(document.getElementById('m_qty').value) || 0);
    const reason = selection.reason;
    const staffName = document.getElementById('m_staff').value;

    if (!lotId) { alert('대상 lot을 선택해주세요.'); return; }
    if (qtyInput <= 0) { alert('수량은 0보다 커야 합니다.'); return; }
    if (!staffName) { alert('담당자를 선택해주세요.'); return; }

    // 부호 적용
    const delta = adjustType === 'plus' ? qtyInput : -qtyInput;

    // lot 현재값 조회
    const lotSnap = await getDoc(doc(db, 'breadPanLots', lotId));
    if (!lotSnap.exists()) { alert('lot을 찾을 수 없습니다.'); return; }
    const lot = lotSnap.data();
    const lotDate = lot.date;

    if (await blockIfClosed(getToday(), command)) return;

    const before = lot.remaining || 0;
    const after = round2(before + delta);

    // [음수 차단] 정책 변경 — 모든 수동조정에서 음수 잔량 불허
    if (after < 0 && selection.kind!=='test') {
      alert(`조정 후 잔량이 ${after}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${before}개에서 최대 ${before}개까지만 감소 가능합니다.`);
      return;
    }

    const now = new Date();
    const today = getToday();

    await saveManualMovement({db,command,name:'breadPanLogs',stockId:lotId,selection,expectedBefore:before,uid:currentUser?.uid||null,
      log:{type:'adjust',date:today,productName:lot.productName,qty:delta,before,after,lotId,lotDate:lot.date||null,staffName,reason}});

    if(!command.isCurrent())return;
    closeModal();
    if(!command.isCurrent())return;
    await refreshFrozenPanLayout();
    showStatus('수동 조정 완료!');

 },{roles:['admin','office','production']});
});
}

async function showFrozenPanAdjustModal() {
  const allFrozenLots = await loadFrozenPanLots({getDocs,getDoc}, true);

  if (allFrozenLots.length === 0) {
    alert('조정할 동결판 lot이 없습니다.\n동결판 입고를 먼저 진행해주세요.');
    return;
  }

  const lotOptions = allFrozenLots
    .sort((a, b) => {
      const nameDiff = a.productName.localeCompare(b.productName);
      if (nameDiff !== 0) return nameDiff;
      return a.date.localeCompare(b.date);
    })
    .map(l => `<option value="${escapeHtml(l.id)}">${escapeHtml(l.productName)} / ${escapeHtml(l.date)} / 잔량 ${escapeHtml(l.remaining)}개</option>`)
    .join('');

  showModal(`
    ${movementFields({incoming:false,reasonField:false})}
    <h3 class="modal-title">동결판 수동 조정</h3>
    <div class="form-group">
      <label>대상 lot *</label>
      <select id="m_lot">
        <option value="">선택</option>
        ${lotOptions}
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
        ${getStaffOptions(['senior', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveFrozenPanAdjust">저장</button>
    </div>
  `);

  const getMovement=bindMovementForm({db,name:'frozenPanLogs',filter:()=>({lotId:document.getElementById('m_lot')?.value||''}),filterInputs:[document.getElementById('m_lot')],onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);document.getElementById('m_adjustType').value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_reason')});
  document.getElementById('btnSaveFrozenPanAdjust').addEventListener('click', async () => {
 return runPageCommand(frozenPanResource,async command=>{
  const {getDoc,writeBatch}=commandWrites(command);

    const selection=readMovementForm(getMovement);if(!selection)return;
    const lotId = document.getElementById('m_lot').value;
    const adjustType = document.getElementById('m_adjustType').value;
    const qtyInput = parseInt(document.getElementById('m_qty').value, 10);
    const reason = selection.reason;
    const staffName = document.getElementById('m_staff').value;

    if (!lotId) { alert('대상 lot을 선택해주세요.'); return; }
    if (!Number.isInteger(qtyInput) || qtyInput <= 0) { alert('수량은 0보다 큰 정수여야 합니다.'); return; }
    if (!staffName) { alert('담당자를 선택해주세요.'); return; }

    const delta = adjustType === 'plus' ? qtyInput : -qtyInput;
    const lotSnap = await getDoc(doc(db, 'frozenPanLots', lotId));
    if (!lotSnap.exists()) { alert('lot을 찾을 수 없습니다.'); return; }

    const lot = lotSnap.data();
    if (await blockIfClosed(getToday(), command)) return;

    const before = Number(lot.remaining || 0);
    const after = before + delta;
    if (after < 0 && selection.kind!=='test') {
      alert(`조정 후 잔량이 ${after}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${before}개에서 최대 ${before}개까지만 감소 가능합니다.`);
      return;
    }

    const now = new Date();
    const today = getToday();
    await saveManualMovement({db,command,name:'frozenPanLogs',stockId:lotId,selection,expectedBefore:before,uid:currentUser?.uid||null,
      log:{type:'adjust',date:today,productName:lot.productName,qty:delta,before,after,lotId,lotDate:lot.date||null,staffName,reason}});

    if(!command.isCurrent())return;
    closeModal();
    if(!command.isCurrent())return;
    await refreshFrozenPanLayout();
    showStatus('수동 조정 완료!');

 },{roles:['admin','office','production']});
});
}

function renderPanRow(r) {
  if (r.status === 'cancelled') return '';
  const canCancelOrder = currentUserRole === 'admin' || currentUserRole === 'office';

  // 묶음 3 정책: 발주 행만 표시 (옛 work 행은 renderFrozenPanLayout에서 필터링됨)
  const isConfirmed = r.status === 'confirmed';

  const total = (r.items || []).reduce((sum, i) => sum + (i.orderPanQty || 0), 0);
  const color = total === 45 ? 'var(--ui-success-color)' : total > 45 ? '#e53e3e' : '#e67e22';
  const contentHtml = `
    ${(r.items || []).map(i => `<span style="font-size:11px;margin-right:8px">${escapeHtml(i.productName)}: ${escapeHtml(i.orderPanQty)}판</span>`).join('')}
    <span style="font-weight:600;color:${color}">총 ${escapeHtml(total)}판</span>
  `;

  let actionHtml = '';
  if (!isConfirmed) {
    actionHtml = `
      <button class="btn-primary btn-order-confirm" data-id="${escapeHtml(r.id)}" style="font-size:11px;padding:3px 10px;">발주 확인</button>
      <button class="btn-del-row btn-order-delete" data-id="${escapeHtml(r.id)}">삭제</button>
    `;
  } else {
    actionHtml = canCancelOrder
      ? `<button class="btn-secondary btn-order-cancel" data-id="${escapeHtml(r.id)}" style="font-size:11px;padding:3px 10px;">발주 취소</button>`
      : '';
  }

  return `
    <tr style="background:#fffdf0">
      <td>${escapeHtml(r.date)}</td>
      <td><span class="tag tag-cat">발주</span></td>
      <td>${escapeHtml(r.staffName || '-')}</td>
      <td>${contentHtml}</td>
      <td>
        ${isConfirmed ? '<span class="ui-success" style="font-size:12px">✅ 확인완료</span>' :
          '<span style="color:#e67e22;font-size:12px">⏳ 대기중</span>'}
      </td>
      <td style="white-space:nowrap">${actionHtml}</td>
    </tr>
  `;
}

async function showWorkRowModal(rows, lots) {
  // 빵판 lot 다시 로드 (최신 잔량 반영)
  const allBreadLots = await loadBreadPanLots();

  // 동결생식 레시피만 (분리 작업 필요한 것만)
  const breadPanRecipes = freezeDryRecipes.filter(r => r.requiresSeparation === true);

  if (breadPanRecipes.length === 0) {
    alert('동결생식 레시피가 없습니다.\n\n레시피 관리 메뉴에서 동결건조 레시피의 "분리 작업 필요" 옵션을 켜주세요.');
    return;
  }

  // 제품별 잔량 합계 + 가장 오래된 lot의 잔량 (default 채울 용)
  const productSummary = Object.create(null);
  breadPanRecipes.forEach(r => {
    const productLots = allBreadLots
      .filter(l => l.productName === r.displayName && l.remaining > 0.005)
      .sort((a, b) => a.date.localeCompare(b.date));
    const total = round2(productLots.reduce((sum, l) => sum + l.remaining, 0));
    const oldestRemaining = productLots.length > 0 ? productLots[0].remaining : 0;
    productSummary[r.displayName] = { total, oldestRemaining };
  });

  showModal(`
    <h3 class="modal-title">작업 행 추가 (빵판 → 동결판 전처리)</h3>
    <div class="form-row">
      <div class="form-group">
        <label>날짜 *</label>
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        <select id="m_staff">
          <option value="">선택</option>
          ${getStaffOptions(['senior', 'office'])}
        </select>
      </div>
    </div>

    <div style="font-size:12px;color:#666;background:#f9f9f9;padding:10px;border-radius:6px;margin-bottom:12px;">
      <strong>환산</strong>: 빵판 1개 → 동결판 4/9개 (≈0.44)<br>
      <strong>FIFO 적용</strong>: 같은 제품에 여러 lot이 있으면 오래된 lot부터 차감됩니다.<br>
      <strong>실측</strong>: 이론값과 실제 산출 동결판 수가 다르면 차이가 별도 기록됩니다.
    </div>

    <div id="workItems">
      ${renderWorkItemRow(breadPanRecipes, productSummary)}
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
  `);

  bindWorkItemEvents(productSummary);
  refreshAvailableProducts();

  document.getElementById('btnAddWorkItem').addEventListener('click', () => {
    document.getElementById('workItems').insertAdjacentHTML(
      'beforeend',
      renderWorkItemRow(breadPanRecipes, productSummary)
    );
    bindWorkItemEvents(productSummary);
    refreshAvailableProducts();
  });

  document.getElementById('btnSaveWorkRow').addEventListener('click', async () => {
    await handleWorkRowSave();
  });
}

async function handleWorkRowSave() {
 return runPageCommand(frozenPanResource,async command=>{
  const {addDoc,updateDoc}=commandWrites(command);

  const date = document.getElementById('m_date').value;
  const staffName = document.getElementById('m_staff').value;
  const note = document.getElementById('m_note').value.trim();

  // 입력 수집
  const items = Array.from(document.querySelectorAll('.work-item')).map(row => ({
    productName: row.querySelector('.wi-name').value.trim(),
    breadPanQty: round2(parseFloat(row.querySelector('.wi-bread').value) || 0),
    actualFrozenQty: row.querySelector('.wi-actual').value === '' ? null : Number(row.querySelector('.wi-actual').value),
  })).filter(i => i.productName);

  // 1. 기본 검증
  if (!date) { alert('날짜를 입력해주세요.'); return; }
  if (!staffName) { alert('담당자를 선택해주세요.'); return; }
  if (items.length === 0) { alert('제품을 1개 이상 입력해주세요.'); return; }

  for (const item of items) {
    if (item.breadPanQty <= 0) {
      alert(`${item.productName}: 출고 빵판 수가 입력되지 않았습니다.`);
      return;
    }
    if (!Number.isInteger(item.actualFrozenQty) || item.actualFrozenQty <= 0) {
      alert(item.actualFrozenQty === null
        ? `${item.productName}: 실제 산출 동결판 수를 입력해주세요.`
        : `${item.productName}: 실제 산출 동결판 수는 1 이상의 정수로 입력해주세요.`);
      return;
    }
  }

  // 2. 마감 가드
  if (await blockIfClosed(date, command)) return;

  // 3. 빵판 lot 재로드 (저장 직전 최신 잔량 확인)
  const allBreadLots = await loadBreadPanLots();

  try {
    await atomicStockOperation({db,command,operationId:stockOperationId(db,document.getElementById('btnSaveWorkRow')),
      actionType:'breadToFrozenPreprocess',date,request:{items,staffName,note},inputs:{breadPanLots:allBreadLots.filter(l=>items.some(i=>i.productName===l.productName))},
      build:async ({writer,fresh})=>{
      const {addDoc,updateDoc}=writer;
      const allBreadLots=fresh.breadPanLots;
      if(new Set(items.map(i=>i.productName)).size!==items.length)throw Error('같은 제품은 한 행으로 입력해주세요.');
  // 4. 재고 부족 검증
  const shortages = [];
  for (const item of items) {
    const productLots = allBreadLots.filter(l => l.productName === item.productName);
    const totalAvail = round2(productLots.reduce((sum, l) => sum + l.remaining, 0));
    if (item.breadPanQty > totalAvail) {
      shortages.push(`${item.productName}: 잔량 ${totalAvail}개 / 요청 ${item.breadPanQty}개`);
    }
  }
  if (shortages.length > 0) {
    throw Error(`빵판 재고가 부족합니다.\n\n${shortages.join('\n')}`);
  }

  // 5. batchId 생성 (이 트랜잭션 전체를 묶는 ID)
  const batchId = `preprocess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const ledgerItems = [];

    // 6. 각 item 처리
    for (const item of items) {
      const expectedFrozenQty = breadToFrozenPan(item.breadPanQty);
      const diff = round2(item.actualFrozenQty - expectedFrozenQty);

      // 6-1. 빵판 lot FIFO 차감
      let toDeduct = item.breadPanQty;
      const productLots = allBreadLots
        .filter(l => l.productName === item.productName && l.remaining > 0.005)
        .sort((a, b) => a.date.localeCompare(b.date));

      for (const lot of productLots) {
        if (toDeduct <= 0.005) break;

        const deduct = round2(Math.min(lot.remaining, toDeduct));
        const before = lot.remaining;
        const after = round2(before - deduct);
        const stockUpdatedAt = new Date();

        // breadPanLots 갱신
        await updateDoc(doc(db, 'breadPanLots', lot.id), {
          remaining: after,
          closed: after <= 0.005,
          updatedAt: stockUpdatedAt,
        });

        // breadPanLogs 기록 (preprocess) — 한 lot당 1건
        // 첫 lot에만 expected/actual/diff 정보 (이론값은 item 전체 단위 기록)
        const isFirstLot = (lot.id === productLots[0].id);
        await addDoc(collection(db, 'breadPanLogs'), {
          type: 'preprocess',
          date,
          productName: item.productName,
          qty: -deduct,
          before,
          after,
          lotId: lot.id,
          lotDate: lot.date,  // ★ 신규 — 차감 대상 lot의 입고일 (어느 날 입고된 빵판이 빠졌는지)
          expectedFrozenQty: isFirstLot ? expectedFrozenQty : null,
          actualFrozenQty: isFirstLot ? item.actualFrozenQty : null,
          diff: isFirstLot ? diff : null,
          staffName,
          uid: null,
          note: note || null,
          reason: null,
          batchId,
          ledgerId: null,  // 아래 ledger 저장 후 일괄 갱신은 안 함 (단순화)
          timestamp: now,
        });

        // ledger items 누적
        ledgerItems.push({
          collection: 'breadPanLots',
          docId: lot.id,
          field: 'remaining',
          delta: -deduct,
          before,
          after,
          label: `${item.productName} 빵판 (${lot.date})`,
          stockUpdatedAtSnapshot: stockUpdatedAt,
        });

        toDeduct = round2(toDeduct - deduct);
      }

      // 6-2. 동결판 lot 신규 생성 (실측값으로)
      const newFrozenLotRef = await addDoc(collection(db, 'frozenPanLots'), {
        productName: item.productName,
        date,
        staffName,
        initialQty: item.actualFrozenQty,
        remaining: item.actualFrozenQty,
        closed: false,
        source: 'preprocess',
        sourceRefId: batchId,
        note: note || null,
        createdAt: now,
        updatedAt: now,
      });

      // frozenPanLogs 기록 (preprocess 입고)
      await addDoc(collection(db, 'frozenPanLogs'), {
        type: 'preprocess',
        date,
        productName: item.productName,
        qty: item.actualFrozenQty,
        before: 0,
        after: item.actualFrozenQty,
        lotId: newFrozenLotRef.id,
        staffName,
        uid: null,
        note: note || null,
        reason: null,
        batchId,
        ledgerId: null,
        timestamp: now,
      });

      // ledger items 누적 (frozenPanLots 신규 생성)
      ledgerItems.push({
        collection: 'frozenPanLots',
        docId: newFrozenLotRef.id,
        field: 'remaining',
        delta: item.actualFrozenQty,
        before: 0,
        after: item.actualFrozenQty,
        label: `${item.productName} 동결판 (신규 생성)`,
        stockUpdatedAtSnapshot: now,
        isNewDoc: true,
      });
    }

    // 7. stockLedger 1건 저장
    const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
      actionType: 'breadToFrozenPreprocess',
      actionId: batchId,
      timestamp: now,
      date,
      status: 'active',
      items: ledgerItems,
    });

    }});

    if(!command.isCurrent())return;
    closeModal();
    if(!command.isCurrent())return;
    await refreshFrozenPanLayout();
    showStatus('전처리 작업 저장 완료!');

  } catch (err) {
    console.error('handleWorkRowSave 에러:', err);
    alert(`저장 중 오류가 발생했습니다.\n\n${err.message}`);
  }

 },{roles:['admin','office','production']});
}

function renderWorkItemRow(breadPanRecipes, productSummary) {
  const recipeOptions = breadPanRecipes
    .map(r => `<option value="${escapeHtml(r.displayName)}">${escapeHtml(r.displayName)}</option>`)
    .join('');

  return `
    <div class="work-item">
      <div style="display:flex;gap:8px;align-items:center;">
        <select class="wi-name cell-input" style="flex:1;min-width:0;">
          <option value="">제품 선택</option>
          ${recipeOptions}
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
  `;
}

function bindWorkItemEvents(productSummary) {
  document.querySelectorAll('.wi-del').forEach(btn => {
    btn.onclick = () => {
      btn.closest('.work-item').remove();
      refreshAvailableProducts();
    };
  });

  document.querySelectorAll('.work-item').forEach(item => {
    const nameEl = item.querySelector('.wi-name');
    const breadEl = item.querySelector('.wi-bread');
    const expectedEl = item.querySelector('.wi-expected');
    const actualEl = item.querySelector('.wi-actual');
    const diffEl = item.querySelector('.wi-diff');
    const stockInfoEl = item.querySelector('.wi-stock-info');

    // 제품 선택 시 잔량 표시 + default 빵판 수 채우기
    nameEl.onchange = () => {
      const productName = nameEl.value;
      const summary = productSummary[productName];
      actualEl.value = '';
      expectedEl.value = '';
      diffEl.textContent = '-';
      diffEl.style.color = '#888';

      if (!summary || summary.total <= 0) {
        stockInfoEl.textContent = productName ? '⚠️ 빵판 lot 없음' : '제품을 선택하세요';
        stockInfoEl.style.color = productName ? '#e53e3e' : '#888';
        breadEl.value = '';
        breadEl.max = '';
      } else {
        stockInfoEl.textContent = `현재 잔량 ${summary.total}개 (가장 오래된 lot ${summary.oldestRemaining}개)`;
        stockInfoEl.style.color = 'var(--ui-success-color)';
        // default: 가장 오래된 lot의 잔량 (B안 — 99% batch 전체 사용)
        breadEl.value = summary.oldestRemaining;
        breadEl.max = summary.total;
        recalcRow(item);
      }

      // 다른 카드에서 같은 제품 선택 못하도록 옵션 갱신
      refreshAvailableProducts();
    };

    // 빵판 수 변경 시 이론값 자동 계산
    breadEl.oninput = () => {
      recalcRow(item);
    };

    // 실측값 변경 시 차이 계산
    actualEl.oninput = () => {
      recalcRow(item);
    };
  });
}

function refreshAvailableProducts() {
  // 현재 선택된 제품 목록
  const selectedProducts = new Set();
  document.querySelectorAll('.work-item .wi-name').forEach(sel => {
    if (sel.value) selectedProducts.add(sel.value);
  });

  // 각 select의 옵션 disabled 처리
  document.querySelectorAll('.work-item .wi-name').forEach(sel => {
    const currentValue = sel.value;
    Array.from(sel.options).forEach(opt => {
      if (!opt.value) return; // 빈 placeholder 옵션은 항상 활성
      // 본인이 선택한 옵션은 활성, 다른 카드가 이미 선택한 옵션은 비활성
      opt.disabled = opt.value !== currentValue && selectedProducts.has(opt.value);
    });
  });
}

function recalcRow(item) {
  const breadEl = item.querySelector('.wi-bread');
  const expectedEl = item.querySelector('.wi-expected');
  const actualEl = item.querySelector('.wi-actual');
  const diffEl = item.querySelector('.wi-diff');

  const breadQty = round2(parseFloat(breadEl.value) || 0);
  const expected = breadToFrozenPan(breadQty);
  expectedEl.value = expected;

  const actual = parseInt(actualEl.value);
  if (isNaN(actual) || actualEl.value === '') {
    diffEl.textContent = '-';
    diffEl.style.color = '#888';
    return;
  }

  const diff = round2(actual - expected);
  const sign = diff > 0 ? '+' : '';
  diffEl.textContent = `${sign}${diff}`;

  if (diff === 0) {
    diffEl.style.color = 'var(--ui-success-color)';
  } else if (Math.abs(diff) <= 0.5) {
    diffEl.style.color = '#888';
  } else {
    diffEl.style.color = '#e67e22';
  }
}



async function confirmOrder(row, lots, staff) {
 return runPageCommand(frozenPanResource,async command=>{
  const {addDoc,updateDoc,recordActivity}=commandWrites(command);

  await atomicStockOperation({db,command,operationId:`frozenPanOrder_${row.id}_${row.ledgerId||'initial'}`,actionType:'frozenPanOrder',date:row.date,
    request:{orderId:row.id,items:row.items,staff},inputs:{frozenPanLots:lots.filter(l=>(row.items||[]).some(i=>i.productName===l.productName))},readRefs:[doc(db,'frozenPanStock',row.id)],
    build:async ({writer,fresh})=>{
    const {addDoc,updateDoc,recordActivity,getDoc}=writer;
    const current=(await getDoc(doc(db,'frozenPanStock',row.id))).data();
    if(current.status!=='pending' || fingerprint(current.items)!==fingerprint(row.items))throw Error('발주 내용이나 상태가 변경되었습니다.');
    const items=current.items||[], lots=fresh.frozenPanLots;
    if(!items.length || items.some(i=>!Number.isFinite(i.orderPanQty)||i.orderPanQty<=0) || new Set(items.map(i=>i.productName)).size!==items.length)throw Error('발주 수량이나 품목이 비정상입니다.');


  // 발주 확인 시점 재고 재검증 (등록 후 시간 경과로 재고 변동 가능)
  const shortages = [];
  for (const item of items) {
    const productLots = lots.filter(l => l.productName === item.productName);
    const totalAvail = productLots.reduce((sum, l) => sum + l.remaining, 0);
    if (item.orderPanQty > totalAvail) {
      shortages.push(`${item.productName}: 현재 재고 ${totalAvail}판 / 발주 ${item.orderPanQty}판`);
    }
  }
  if (shortages.length > 0) {
    throw Error(`재고가 부족하여 발주 확인할 수 없습니다.\n\n${shortages.join('\n')}\n\n발주를 삭제하거나 작업 행을 먼저 추가하세요.`);
  }

  // FIFO 차감 + ledger items 누적
  const ledgerItems = [];
  for (const item of items) {
    let remaining = item.orderPanQty;
    const productLots = lots
      .filter(l => l.productName === item.productName)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (const lot of productLots) {
      if (remaining <= 0) break;
      const deduct = Math.min(lot.remaining, remaining);
      const before = lot.remaining;
      const after = before - deduct;
      const stockUpdatedAt = new Date();

      await updateDoc(doc(db, 'frozenPanLots', lot.id), {
        remaining: after,
        closed: after <= 0,
        updatedAt: stockUpdatedAt,
      });

      await addDoc(collection(db,'frozenPanLogs'),{type:'orderDeduct',date:row.date||getToday(),productName:item.productName,
        qty:-deduct,before,after,lotId:lot.id,staffName:staff,uid:null,note:null,reason:null,
        batchId:`frozenPanOrder_${row.id}`,ledgerId:null,timestamp:new Date()});

      ledgerItems.push({
        collection: 'frozenPanLots',
        docId: lot.id,
        field: 'remaining',
        delta: -deduct,
        before,
        after,
        label: `${item.productName} (${lot.date || '-'})`,
        stockUpdatedAtSnapshot: stockUpdatedAt,
      });

      remaining -= deduct;
    }
  }

  // ledger 저장
  let ledgerId = null;
  if (ledgerItems.length > 0) {
    const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
      actionType: 'frozenPanOrder',
      actionId: row.id,
      timestamp: new Date(),
      date: row.date || '',
      status: 'active',
      items: ledgerItems,
    });
    ledgerId = ledgerRef.id;
  }

  // [묶음 5B] confirmStaff 필드 추가 — 누가 발주 확인했는지 frozenPanStock에 영구 저장
  await updateDoc(doc(db, 'frozenPanStock', row.id), {
    status: 'confirmed',
    ledgerId,
    confirmStaff: staff,
    confirmedAt: new Date(),
    updatedAt: new Date(),
  });

  // [묶음 5B] 사무 로그 발행 — 동결판 발주 확인 (표준 recordActivity 통일)
  const itemsLabel = items.map(it => `${it.productName} ${it.orderPanQty}판`).join(', ');
  await recordActivity({
    action: 'frozenPan',
    subAction: 'orderConfirm',
    date: row.date || getToday(),
    staff,
    message: `동결판 발주 확인 — ${itemsLabel} / 담당: ${staff}`,
    details: {
      frozenPanStockId: row.id,
      orderDate: row.date || null,
      items,
      ledgerId,
    },
  });

  }});

  if(!command.isCurrent())return;
  await refreshFrozenPanLayout();
  showStatus('발주 확인 완료!');

 },{roles:['admin','office','production']});
}

async function cancelOrder(row, lots, staff, reason) {
 return runPageCommand(frozenPanResource,async command=>{
  const {getDoc,writeBatch}=commandWrites(command);
  const batch = writeBatch(db);

  // [권한 매트릭스] production은 발주 취소 불가
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
    alert('발주 취소는 대표/사무실 계정만 가능합니다.');
    return;
  }

  reason = reason?.trim();
  if (!staff || !reason) { alert('담당자와 취소 사유를 입력해주세요.'); return; }
  if (await blockIfClosed(row.date, command)) return;
  const latestRow = await getDoc(doc(db, 'frozenPanStock', row.id));
  if (!latestRow.exists() || latestRow.data().status !== 'confirmed') {
    alert('이미 취소됐거나 변경된 발주입니다. 최신 자료를 확인해주세요.'); return;
  }

  // ledger 기반 정확 복원
  if (row.ledgerId) {
    const ledgerSnap = await getDoc(doc(db, 'stockLedger', row.ledgerId));
    if (ledgerSnap.exists() && ledgerSnap.data().status === 'active') {
      const ledgerItems = ledgerSnap.data().items || [];
      const restorations = [];
      for (const item of ledgerItems) {
        const ref = doc(db, item.collection, item.docId);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error('복원할 재고 원본이 없습니다. 사무팀 확인이 필요합니다.');
        const current = Number(snap.data()[item.field]);
        if (!Number.isFinite(current) || !Number.isFinite(item.delta) || current-item.delta < 0) throw new Error('복원 수량을 확인할 수 없습니다.');
        restorations.push({ref,item,current,after:current-item.delta});
      }
      const changed = restorations.filter(r => r.current !== r.item.after);
      if (changed.length && !await showConfirmModal({
        title: '재고 변경 후 발주 취소',
        message: '발주 확인 이후 재고가 변경되었습니다. 현재 재고에 이 발주의 차감 수량만 되돌립니다.\n\n'
          + changed.map(r => `${r.item.label || '동결판'}: 현재 ${r.current} → 복원 후 ${r.after}`).join('\n'),
        confirmText: '재고 복원 후 취소', danger: true,
      })) return;
      for (const r of restorations) batch.update(r.ref, {
        [r.item.field]: r.after, closed:r.after <= 0, updatedAt:new Date(),
      });
      batch.update(doc(db, 'stockLedger', row.ledgerId), {
        status: 'rolledBack',
        rolledBackAt: new Date(),
      });
    } else {
      throw new Error('이미 복원됐거나 유효하지 않은 발주 원장입니다. 최신 자료를 확인해주세요.');
    }
  } else {
    // fallback: ledger 없는 기존 데이터 — 옛 분배 로직 (lot capacity 무시) 그대로 사용
    const items = row.items || [];
    for (const item of items) {
      const productLots = lots
        .filter(l => l.productName === item.productName && l.sourceRowId)
        .sort((a, b) => b.date.localeCompare(a.date));

      let toRestore = item.orderPanQty;
      for (const lot of productLots) {
        if (toRestore <= 0) break;
        const restore = Math.min(item.orderPanQty, toRestore);
        batch.update(doc(db, 'frozenPanLots', lot.id), {
          remaining: lot.remaining + restore,
          closed: false,
          updatedAt: new Date(),
        });
        toRestore -= restore;
      }
    }
  }

  // [묶음 5B] cancelStaff 필드 추가 — 누가 발주 취소했는지 frozenPanStock에 영구 저장
  batch.update(doc(db, 'frozenPanStock', row.id), {
    status: 'pending',
    cancelReason: reason,
    cancelStaff: staff,
    cancelledAt: new Date(),
    updatedAt: new Date(),
  });

  // [묶음 5B] 사무 로그 발행 — 동결판 발주 취소 (표준 recordActivity 통일)
  const items = row.items || [];
  const itemsLabel = items.map(it => `${it.productName} ${it.orderPanQty}판`).join(', ');
  await recordActivity({
    action: 'frozenPan',
    subAction: 'orderCancel',
    date: row.date || getToday(),
    staff,
    message: `동결판 발주 취소 — ${itemsLabel} / 사유: ${reason} / 담당: ${staff}`,
    details: {
      frozenPanStockId: row.id,
      orderDate: row.date || null,
      items,
      reason,
    },
  }, {batch});

  await batch.commit();

  if(!command.isCurrent())return;
  await refreshFrozenPanLayout();
  showStatus('발주 취소 완료!');

 },{roles:['admin','office']});
}

// 유틸

// 발주 확인 담당자 / 발주 취소 담당자와 사유를 받는 모달
// 프로젝트 표준 패턴: id="modalOverlay" + class="modal-box"
async function showStaffPickerModal({ title, message, groups, requireReason=false }) {
  // staffCache 보장 (드롭다운이 비어있는 문제 방지)
  await loadStaffCache();

  return new Promise(resolve => {
    // 기존 모달 있으면 제거
    const existing = document.getElementById('modalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:400px;padding:24px;">
        <h3 style="margin:0 0 12px 0;font-size:18px;font-weight:600;">${escapeHtml(title)}</h3>
        <p style="font-size:13px;color:#666;margin:0 0 20px 0;">${escapeHtml(message)}</p>
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:13px;font-weight:500;color:#333;margin-bottom:8px;">담당자 *</label>
          <select id="sp_staff" style="width:100%;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;">
            <option value="">선택</option>
            ${getStaffOptions(groups)}
          </select>
        </div>
        ${requireReason ? '<div class="form-group"><label for="sp_reason">취소 사유 *</label><textarea id="sp_reason" maxlength="200" placeholder="취소 사유를 입력해주세요"></textarea></div>' : ''}
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn-secondary" id="sp_cancel">닫기</button>
          <button class="btn-primary" id="sp_ok">${requireReason ? '재고 복원 후 취소' : '확인'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    document.getElementById('sp_cancel').addEventListener('click', () => close(null));
    document.getElementById('sp_ok').addEventListener('click', () => {
      const staff = document.getElementById('sp_staff').value;
      if (!staff) { alert('담당자를 선택해주세요.'); return; }
      const reason = document.getElementById('sp_reason')?.value.trim();
      if (requireReason && !reason) { alert('취소 사유를 입력해주세요.'); return; }
      close(requireReason ? {staff,reason} : staff);
    });
  });
}

let staffCache = {};
async function loadStaffCache() {
  if (Object.keys(staffCache).length > 0) return;
  await Promise.all(['senior', 'lead', 'office'].map(async key => {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) staffCache[key] = snap.data().members || [];
  }));
}

function getStaffOptions(groups) {
  let options = '';
  for (const g of groups) {
    const members = staffCache[g] || [];
    members.forEach(m => {
      options += `<option value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</option>`;
    });
  }
  return options;
}

function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);

  // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  // 명시적인 취소/저장 버튼으로만 닫힘
}

registerCloseModal('frozenPan', function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    const receipt = overlay.classList.contains('pan-receipt-overlay');
    overlay.remove();
    if (receipt) document.getElementById('panIncoming')?.focus();
  }
});

import {pageResource} from '../state/pageResources.js';
import {pageRefresh} from '../utils/pageRefresh.js';
import {getPageContext,registerPageCleanup} from '../utils/pageLifecycle.js';
import {loadPageStaff} from '../services/pageStaff.js';
const frozenPanResource=pageResource('frozenPan');
frozenPanResource.refresh=refreshFrozenPanLayout;

import {runPageCommand} from '../services/pageCommand.js';
import {commandWrites} from '../services/commandWrites.js';

async function loadFreezeHistory(scope) {
  try {
    const snapshot = await scope.getDocs(collection(db,'freezeOrders'));
    return {freezeOrders:snapshot.docs.map(d=>({...d.data(),id:d.id})),freezeHistoryUnavailable:false};
  } catch (error) {
    console.warn('동결가동 이력 조회 실패',error);
    return {freezeOrders:[],freezeHistoryUnavailable:true};
  }
}

// Read-only model construction shared by activation and idle preparation.
async function loadInitialModel(scope) {
  const [rows,lots,breadPanLots,breadPanLogs,frozenPanLogs,recipes,staff]=await Promise.all([
   loadFrozenPanRows(scope),loadFrozenPanLots(scope),loadBreadPanLots(scope),loadBreadPanLogs(scope),loadFrozenPanLogs(scope),getActiveFreezeDryRecipes(scope),loadPageStaff(scope)]);
  return {rows,lots,breadPanLots,breadPanLogs,frozenPanLogs,recipes,staff};
}
export function preparePage({cacheOnly=true}={}) { return frozenPanResource.prepare?.('default',loadInitialModel,{cacheOnly}); }
