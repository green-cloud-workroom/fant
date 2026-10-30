import { escapeHtml, recipeColor } from '../utils/html.js';
import {showStatus} from '../utils/statusToast.js';
import { registerCloseModal } from '../utils/modalManager.js';
import { db } from '../firebase.js';
import {
  collection, getDocsFromServer as getDocs, doc, query, orderBy, getDocFromServer as getDoc, where, serverTimestamp
} from 'firebase/firestore';
import { getTodayKST as getToday, getHolidayInfo, getHolidayInfoCache } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUser, currentUserRole } from '../app.js';
import { showConfirmModal } from '../utils/modal.js';
import { formatIngredientQtyValue, round2 } from '../utils/number.js';
import { buildChickenOrderText } from '../utils/orderCopy.js';
import Sortable from '../utils/sortable.js';
import {pageResource} from '../state/pageResources.js';
import {withReadWorkflow} from '../services/readCommand.js';
import {commandWrites} from '../services/commandWrites.js';
import {fingerprint} from '../services/actionGateway.js';
import {newProductionWriteToken} from '../utils/productionWriteToken.js';
import {runProductionOrderTransaction,productionOrderView,anchorRevision} from '../services/productionOrderTransaction.js';
import {refundEvidenceFingerprint} from '../utils/refundEvidence.js';
import {readSupplementReservation} from '../services/productionSupplementReservation.js';
import {pageRefresh} from '../utils/pageRefresh.js';
import {getPageContext,registerPageCleanup} from '../utils/pageLifecycle.js';
import {canLeavePage,markFieldsSaved} from '../utils/formDraft.js';
const productionResource=pageResource('production');
let productionResourceDate='';
async function runProductionCommand(callback) {
  const page=getPageContext();let committed=false,continueWith=null;
  try{return await withReadWorkflow(productionResource,async command=>{command.isCurrent=()=>!page||page.isCurrent();try{const result=await callback(command);continueWith=result?.continueWith||null;return result;}finally{committed=command.committed;}});}
  catch(error){console.error('[생산 저장]',error);alert((committed?'일부 저장이 완료되었습니다. 중복 저장하지 말고 최신 자료를 확인해주세요. ':'')+error.message);}
  finally{if(committed && (!page||page.isCurrent()) && !productionResource.blocked){
    await renderProduction({force:true});
    if(continueWith&&(!page||page.isCurrent())&&selectedDate===continueWith.date){
      selectedProductionId=null;await showProductionForm(null,continueWith);
    }
  }}
}

let recipes = [];
let productions = [];
let selectedDate = getToday();
let selectedProductionId = null;
const conversionHistoryCache = new Map();
let refreshProductionFormConversion = null;
let productionCardsSortable = null;

const PRODUCTION_METHOD_LABELS = {
  rotary: '로터리',
  manual: '수동',
};

const COPY_SHEET_ORDER_DEFAULT = ['rawCat', 'rawDog', 'freezeCat', 'freezeDog', 'freezeCommon'];

const COPY_SHEET_CATEGORY_LABELS = {
  rawCat: '고양이 생식',
  rawDog: '강아지 생식',
  freezeCat: '동결건조 - 고양이',
  freezeDog: '동결건조 - 강아지',
  freezeCommon: '동결건조 - 공용',
};

function isTenderFreezeDry(item) {
  return item?.category === 'freezeDry' && item.requiresSeparation === false;
}

function renderFreezeDryQtyLine(item) {
  const parts = [`${item.freezeDryBagQty || 0}봉`];
  if (!isTenderFreezeDry(item)) parts.push(`${round2(item.breadPanQty || 0)}빵판`);
  parts.push(`${item.freezePanQty || 0}동결판`);
  return parts.join(' / ');
}

function getUnitPresets(recipe) {
  return Array.isArray(recipe?.unitPresets) ? recipe.unitPresets : [];
}

function getProductionUnitName(recipe) {
  const productionUnitIng = recipe?.ingredients?.find(i => i.isProductionUnit);
  return productionUnitIng?.unitName || productionUnitIng?.weightDisplayUnit || '';
}

function normalizeProductionMethods(methods) {
  if (!Array.isArray(methods)) return [];
  return methods
    .map(method => {
      const methodKey = method?.methodKey;
      const unitToBox = Number(method?.unitToBox);
      if (!methodKey || !Number.isFinite(unitToBox)) return null;
      return {
        methodKey,
        label: method.label || PRODUCTION_METHOD_LABELS[methodKey] || methodKey,
        unitToBox,
        effectiveDate: method.effectiveDate || '',
        active: method.active !== false,
      };
    })
    .filter(Boolean);
}

async function loadConversionHistory(recipeId) {
  if (!recipeId) return [];
  if (conversionHistoryCache.has(recipeId)) return conversionHistoryCache.get(recipeId);
  const page=getPageContext();
  const snap = await getDocs(collection(db, 'recipes', recipeId, 'conversionHistory'));
  const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if(!page||page.isCurrent())conversionHistoryCache.set(recipeId, history);
  return history;
}

function getApplicableConversion(recipe, methodKey, productionDate, history = []) {
  const candidates = [];
  normalizeProductionMethods(recipe?.productionMethods)
    .filter(method => method.methodKey === methodKey && method.active && method.effectiveDate && method.effectiveDate <= productionDate)
    .forEach(method => candidates.push({ unitToBox: method.unitToBox, effectiveDate: method.effectiveDate, sourceRank: 1, createdAtMs: Number.MAX_SAFE_INTEGER }));
  history
    .filter(item => item.methodKey === methodKey && item.effectiveDate && item.effectiveDate <= productionDate && Number.isFinite(Number(item.unitToBox)))
    .forEach(item => candidates.push({
      unitToBox: Number(item.unitToBox),
      effectiveDate: item.effectiveDate,
      sourceRank: 0,
      createdAtMs: typeof item.createdAt?.toMillis === 'function'
        ? item.createdAt.toMillis()
        : Date.parse(item.createdAt || '') || 0,
    }));
  candidates.sort((a, b) => {
    const dateCompare = b.effectiveDate.localeCompare(a.effectiveDate);
    return dateCompare || b.sourceRank - a.sourceRank || b.createdAtMs - a.createdAtMs;
  });
  return candidates[0] || null;
}

function getCurrentProductionMethod(recipe, methodKey) {
  return normalizeProductionMethods(recipe?.productionMethods)
    .find(method => method.methodKey === methodKey && method.active) || null;
}

function getExpectedBox(qty, unitToBox) {
  return Math.round(qty * unitToBox * 10) / 10;
}

function getSupplementSaveErrorMessage(code, supplementName) {
  if (code === 'SKU_NOT_FOUND') {
    return '이 (레시피, 생산단위) 조합의 영양제가 등록되어 있지 않습니다. 레시피 관리에서 프리셋을 확인해주세요.';
  }
  if (code === 'SKU_INACTIVE') {
    return '이 영양제는 비활성 상태입니다.';
  }
  if (code === 'STOCK_INSUFFICIENT') {
    return `${supplementName || '영양제'} 재고가 부족합니다. 영양제 재고를 먼저 입고해주세요.`;
  }
  if (code === 'STOCK_INVALID') {
    return `${supplementName || '영양제'} 재고 수량이 비정상입니다. 관리자에게 확인해주세요.`;
  }
  return '저장 중 오류가 발생했습니다. 다시 시도해주세요.';
}

function productionValidationError(message) {
  const error = new Error(message);
  error.code = 'production-validation';
  return error;
}

// Recheck the source inside every SDK attempt. Preflight checks outside the
// transaction cannot protect a retry from refunding or overwriting it twice.
async function assertProductionUnchanged(transaction, baseline, recipe = null) {
  if (!baseline?.id || !/^\d{4}-\d{2}-\d{2}$/.test(baseline.date || '')) {
    throw productionValidationError('생산 원본을 확인할 수 없습니다. 최신 자료를 다시 불러와주세요.');
  }
  const source = await transaction.get(doc(db, 'productions', baseline.id));
  if (!source.exists() || ['deleted', 'cancelled'].includes(source.data().status)
    || fingerprint({ id: source.id, ...source.data() }) !== fingerprint(baseline)) {
    throw productionValidationError('다른 작업으로 생산 원본이 변경되었습니다. 입력을 보존한 뒤 최신 자료를 다시 불러와주세요.');
  }
  const closing = await transaction.get(doc(db, 'closings', baseline.date));
  if (closing.exists() && closing.data().status === 'closed') {
    throw productionValidationError(`${baseline.date}는 이미 마감된 날짜입니다. 수정하려면 마감해제하세요.`);
  }
  if (recipe) {
    const current = await transaction.get(doc(db, 'recipes', recipe.id));
    if (!current.exists() || fingerprint({ id: current.id, ...current.data() }) !== fingerprint(recipe)) {
      throw productionValidationError('레시피가 변경되었습니다. 입력을 보존한 뒤 최신 자료를 다시 불러와주세요.');
    }
  }
  return newProductionWriteToken();
}

function calculateSupplementRefundsFromRows(rows) {
  const skuNet = new Map();
  rows.forEach(({data}) => {
    if (data.type !== 'autoDeduct') return;
    const supplementTypeId = data.supplementTypeId;
    const quantity = data.qty;
    if (!supplementTypeId || !Number.isSafeInteger(quantity)) throw new Error('INVALID_SUPPLEMENT_LOG_STATE');
    const nextQty = (skuNet.get(supplementTypeId) || 0) + quantity;
    if (!Number.isSafeInteger(nextQty)) throw new Error('INVALID_SUPPLEMENT_LOG_STATE');
    skuNet.set(supplementTypeId, nextQty);
  });

  const refunds = [];
  for (const [supplementTypeId, netQty] of skuNet.entries()) {
    if (netQty > 0) throw new Error('INVALID_SUPPLEMENT_LOG_STATE');
    if (netQty < 0) refunds.push({supplementTypeId,qty:-netQty});
  }
  return refunds.sort((a,b)=>a.supplementTypeId.localeCompare(b.supplementTypeId));
}

async function captureSupplementRefunds(productionId,date,scope={getDocs,getDoc}) {
  const anchorRef=doc(db,'productionOrderDays',date);
  const before=await scope.getDoc(anchorRef);
  const expectedRevision=anchorRevision(before,date);
  const logQuery = query(
    collection(db, 'supplementLogs'),
    where('relatedProductionId', '==', productionId)
  );
  const snap = await scope.getDocs(logQuery);
  const after=await scope.getDoc(anchorRef);
  if(before.exists()!==after.exists() || anchorRevision(after,date)!==expectedRevision) {
    throw productionValidationError('영양제 환급 근거가 변경되었습니다. 최신 자료를 다시 불러와주세요.');
  }
  if (snap.docs.length > 200) throw new Error('INVALID_SUPPLEMENT_LOG_STATE');
  const rows=snap.docs.map(logDoc=>({id:logDoc.id,data:logDoc.data()}));
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw new Error('INVALID_SUPPLEMENT_LOG_STATE');
  return {expectedRevision,evidence:rows.map(row=>({id:row.id,fingerprint:refundEvidenceFingerprint(row.id,row.data)})),
    previewRefunds:calculateSupplementRefundsFromRows(rows)};
}

export async function renderProduction({force=false}={}) {
  const content = document.getElementById('mainContent'),date=selectedDate;
  content.innerHTML = `<div style="padding:24px;"><p>생산 입력 로딩 중...</p></div>`;
  force ||= !productionResource.prepare && productionResourceDate!==date;productionResourceDate=date;
  conversionHistoryCache.clear();registerPageCleanup(()=>conversionHistoryCache.clear());
  const data=await productionResource.load(scope=>loadInitialModel(scope, date),{key:date,force,onChange:pageRefresh(productionResource,renderProduction,{draftSelector:'#productionForm'})});
  if(!data||!content.isConnected||date!==selectedDate)return;
  recipes=data.recipes;productions=data.productions;staffCache=data.staff;
  renderProductionLayout();
  const selected=productions.find(p=>p.id===selectedProductionId);if(selected)await showProductionForm(selected);
}

async function loadRecipes(scope={getDocs}) {
  const q = query(collection(db, 'recipes'), orderBy('sortOrder'));
  const snap = await scope.getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.active !== false);
}

function compareProductionOrder(a, b) {
  const rank = value => value === null ? 0 : typeof value === 'number' && Number.isFinite(value) ? 1 : 2;
  const leftRank = rank(a.sortOrder), rightRank = rank(b.sortOrder);
  if (leftRank !== rightRank) return leftRank - rightRank;
  if (leftRank === 1 && a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  const left = String(a.id ?? ''), right = String(b.id ?? '');
  return left < right ? -1 : left > right ? 1 : 0;
}

async function loadProductions(date,scope={getDocs}) {
  // Date equality needs no new composite index. Keep the former orderBy's
  // exclusion of missing sortOrder fields and sort only this day's cards.
  const q = query(collection(db, 'productions'), where('date', '==', date));
  const snap = await scope.getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.status !== 'deleted' && p.sortOrder !== undefined)
    .sort(compareProductionOrder);
}

// [묶음 4A] 회차/차수 재계산 (B안: round + batchNo 둘 다 DB 저장)
// - round: 같은 레시피의 sortOrder 순 등록 순번 (1부터)
// - batchNo: 동일 레시피 + 동일 productionUnitQty 묶음의 순번 (2건 이상일 때만 부여, 아니면 null)
function recalcRoundsAndBatches(list) {
  const sorted = [...list].sort(compareProductionOrder);
  const byRecipe = {};
  sorted.forEach(p => {
    if (!byRecipe[p.recipeId]) byRecipe[p.recipeId] = [];
    byRecipe[p.recipeId].push(p);
  });

  const updates = [];
  for (const recipeId in byRecipe) {
    const group = byRecipe[recipeId];
    group.forEach((p, idx) => {
      const newRound = idx + 1;
      const sameQty = group.filter(g => g.productionUnitQty === p.productionUnitQty);
      const newBatchNo = sameQty.length >= 2
        ? sameQty.findIndex(g => g.id === p.id) + 1
        : null;
      const oldBatchNo = p.batchNo ?? null;
      if (p.round !== newRound || oldBatchNo !== newBatchNo) {
        updates.push({ id: p.id, round: newRound, batchNo: newBatchNo });
      }
    });
  }
  return updates;
}

// [묶음 4A] 회차/차수 표시 헬퍼
// - batchNo 있으면 "1차" / 없고 round>1이면 "1회차" / round==1 + batchNo null이면 표시 없음
function getRoundBadgeHtml(p) {
  if (p.batchNo) return ` <span style="font-size:10px;color:#aaa">${escapeHtml(p.batchNo)}차</span>`;
  if (p.round > 1) return ` <span style="font-size:10px;color:#aaa">${escapeHtml(p.round)}회차</span>`;
  return '';
}

function renderProductionLayout() {
  const content = document.getElementById('mainContent');
  const canManageProduction = currentUserRole === 'admin' || currentUserRole === 'office';
  content.innerHTML = `
    <div class="production-wrap">
      <!-- 왼쪽 3/4 -->
      <div class="production-left">
        <div class="production-date-bar">
          <input type="date" id="productionDate" value="${escapeHtml(selectedDate)}" />
          <span id="holidayBadge">${renderHolidayBadge(selectedDate)}</span>
          <span id="holidayMonthList">${renderHolidaysOfMonth(selectedDate)}</span>
          <button class="btn-secondary" id="btnBigView" style="margin-left:auto;">크게보기</button>
        </div>
        <div class="production-cards" id="productionCards">
          ${renderProductionCards()}
        </div>
      </div>

      <!-- 오른쪽 1/4 -->
      <div class="production-right">
        <div class="production-form-header">
          <span style="font-size:13px;font-weight:600;color:#333;">생산 입력</span>
          <button class="btn-secondary" id="btnCopySheet" style="font-size:11px;padding:3px 10px;">생산지시서 복사</button>
          <button class="btn-secondary" id="btnCopyOrder" style="font-size:11px;padding:3px 10px;">발주 복사</button>
        </div>
        <div id="productionForm">
          <div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">
            카드를 선택하거나 아래에서 새 생산을 추가하세요
          </div>
        </div>
        ${canManageProduction ? '<button class="btn-primary" id="btnNewProduction" style="width:100%;margin-top:12px;">+ 새 생산 추가</button>' : ''}
      </div>
    </div>
  `;

  // 날짜 변경
  document.getElementById('productionDate').addEventListener('change', async (e) => {
    const page=getPageContext(),input=e.target,next=input.value,previous=selectedDate;
    input.disabled=true;
    try{if(!await canLeavePage()){input.value=previous;return;}if(page&&!page.isCurrent())return;selectedDate=next;selectedProductionId=null;await renderProduction({force:true});}
    finally{input.disabled=false;}
  });

  document.getElementById('btnNewProduction')?.addEventListener('click', () => showProductionForm(null));
  document.getElementById('btnCopySheet').addEventListener('click', showCopySheetModal);
  document.getElementById('btnCopyOrder').addEventListener('click', handleCopyOrder);
  document.getElementById('btnBigView').addEventListener('click', showBigViewModal);

  bindCardEvents();
  initProductionCardsSortable();
}

function handleCopyOrder() {
  const today = new Date(selectedDate);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${String(today.getFullYear()).slice(2)}/${today.getMonth() + 1}/${today.getDate()} ${days[today.getDay()]}`;

  const orderText = buildChickenOrderText(productions, recipes);
  const sheet = orderText
    ? `📌${dateStr} 발주\n${orderText}`
    : `📌${dateStr} 발주\n(발주 품목 없음)`;

  showModal(`
    <h3 class="modal-title">발주 복사</h3>
    <textarea id="orderSheetText" style="width:100%;height:100px;font-size:13px;padding:12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;resize:none;">${escapeHtml(sheet)}</textarea>
    <div class="form-group" style="margin-top:10px;">
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px;">비고</label>
      <input type="text" id="orderSheetNote" placeholder="입력 시 끝줄에 자동 추가됩니다 (비어 있으면 생략)"
        style="width:100%;font-size:13px;padding:8px 12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
      <button class="btn-primary" id="btnCopyOrder2">복사하기</button>
    </div>
  `);

  document.getElementById('btnCopyOrder2').addEventListener('click', () => {
    let text = document.getElementById('orderSheetText').value;
    const note = document.getElementById('orderSheetNote').value.trim();
    if (note) {
      text = text.replace(/\n+$/, '') + '\n' + note;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('복사 완료!');
      closeModal();
    });
  });
}

// [Phase 7B-2] 휴일 배지 렌더 (read-only)
// 선택한 날짜가 holidays 캐시에 있으면 휴일명 배지 표시. 토/일은 자동 처리되므로 별도 표시 안 함.
function renderHolidayBadge(dateStr) {
  if (!dateStr) return '';

  // 토/일 자동 표시
  const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return `<span class="holiday-badge holiday-badge-weekend">${dayOfWeek === 0 ? '일요일' : '토요일'}</span>`;
  }

  // 등록된 공휴일 표시
  const holiday = getHolidayInfo(dateStr);
  if (holiday?.affectsProduction === true) {
    return `<span class="holiday-badge holiday-badge-registered">🔴 등록 공휴일</span>`;
  }

  return '';
}

// [Phase 7B-2] 선택한 날짜의 같은 달 공휴일 목록 표시
function renderHolidaysOfMonth(dateStr) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const prefix = `${year}-${month}-`;
  const all = getHolidayInfoCache();
  const monthly = Object.entries(all)
    .filter(([d, h]) => d.startsWith(prefix) && h.status !== 'deleted' && h.affectsProduction === true)
    .map(([d]) => d)
    .sort();

  if (monthly.length === 0) return '';

  const items = monthly.map(d => {
    const day = parseInt(d.split('-')[2], 10);
    return `${month}/${day}`;
  }).join(', ');

  return `<span class="holiday-month-list">이번 달 공휴일: ${items}</span>`;
}
function renderProductionCards() {
  const canManageProduction = currentUserRole === 'admin' || currentUserRole === 'office';
  if (productions.length === 0) {
    return '<div style="color:#aaa;font-size:13px;padding:20px;text-align:center;">오늘 생산 없음</div>';
  }
  return productions.map(p => `
    <div class="production-card ${selectedProductionId === p.id ? 'active' : ''}"
         data-id="${escapeHtml(p.id)}"
         style="border-left:4px solid ${recipeColor(p.color)}">
      ${canManageProduction ? '<span class="drag-handle production-card-drag-handle">≡</span>' : ''}
      <div class="card-title">${escapeHtml(p.recipeName)}${getRoundBadgeHtml(p)}</div>
      <div class="card-info">${escapeHtml(p.productionUnitQty)} ${escapeHtml(getProductionCardUnitName(p))}</div>
      ${p.category === 'raw' ? `<div class="card-sub">${escapeHtml(p.rawBoxQty || 0)}박스</div>` : ''}
      ${p.category === 'freezeDry' ? `<div class="card-sub">${escapeHtml(renderFreezeDryQtyLine(p))}</div>` : ''}
      ${canManageProduction ? `<button class="card-del" data-id="${escapeHtml(p.id)}" ${p.lockedByCompletion ? 'disabled title="완료 취소를 먼저 진행해주세요"' : ''}>✕</button>` : ''}
      ${p.lockedByCompletion ? '<div class="card-sub">완료 차감됨 · 수정·삭제하려면 메인에서 완료 취소를 먼저 진행해주세요.</div>' : ''}
    </div>
  `).join('');
}

function getProductionCardUnitName(production) {
  if (production.productionUnitName) return production.productionUnitName;
  const recipe = recipes.find(r => r.id === production.recipeId);
  return getProductionUnitName(recipe);
}

function refreshProductionCardsView() {
  const cardsEl = document.getElementById('productionCards');
  if (!cardsEl) return;
  cardsEl.innerHTML = renderProductionCards();
  bindCardEvents();
  initProductionCardsSortable();
}

function bindCardEvents() {
  document.querySelectorAll('.production-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-del')) return;
      if (e.target.closest('.drag-handle')) return;
      selectedProductionId = card.dataset.id;
      const p = productions.find(pr => pr.id === selectedProductionId);
      showProductionForm(p);
      document.querySelectorAll('.production-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  document.querySelectorAll('.card-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();return runProductionCommand(async command=>{
      if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
        alert('생산 카드 삭제는 대표/사무실 계정만 가능합니다.');
        return;
      }
      if(productions.find(p=>p.id===btn.dataset.id)?.lockedByCompletion){alert('완료 취소를 먼저 진행해주세요.');return;}
      const __c = await showConfirmModal({ title:'삭제 확인', message:'정말 삭제하시겠습니까?', confirmText:'삭제', danger:true }); if (!__c) return;
      if (await blockIfClosed(selectedDate,command)) return;
      const deletedId = btn.dataset.id;
      const targetProduction = productions.find(p => p.id === deletedId);
      let refundEvidence;
      try {
        refundEvidence = await captureSupplementRefunds(deletedId,selectedDate,command);
      } catch (err) {
        if (err.message === 'INVALID_SUPPLEMENT_LOG_STATE') {
          console.error('[production] invalid supplement log state:', err);
          alert('영양제 로그 상태가 비정상입니다. 관리자에게 문의해주세요.');
          return;
        }
        throw err;
      }

      await runProductionOrderTransaction({db,date:selectedDate,command,actorUid:currentUser?.uid,expectedRevision:refundEvidence.expectedRevision,prepare:async ({transaction}) => {
        const mutationToken = await assertProductionUnchanged(transaction, targetProduction);
        const logSnaps=await Promise.all(refundEvidence.evidence.map(item=>transaction.get(doc(db,'supplementLogs',item.id))));
        const logRows=logSnaps.map((snapshot,index)=>{
          const expected=refundEvidence.evidence[index];
          if(!snapshot.exists()||snapshot.id!==expected.id||refundEvidenceFingerprint(snapshot.id,snapshot.data())!==expected.fingerprint){
            throw productionValidationError('영양제 환급 로그가 변경되었습니다. 최신 자료를 다시 불러와주세요.');
          }
          return {id:snapshot.id,data:snapshot.data()};
        });
        const refunds=calculateSupplementRefundsFromRows(logRows);
        const reserved=readSupplementReservation(targetProduction);
        if(refunds.length!==reserved.quantity || reserved.quantity===1 && (refunds[0].supplementTypeId!==reserved.skuId || refunds[0].qty!==1))throw productionValidationError('영양제 예약과 차감 이력이 일치하지 않습니다. 관리자에게 문의해주세요.');
        return {changes:[{id:deletedId,kind:'update',data:{status:'deleted',mutationToken,updatedAt:serverTimestamp()}}]};
      }});
      if(!command.isCurrent())return;
      refreshProductionCardsView();
      if (selectedProductionId === deletedId) {
        selectedProductionId = null;
        document.getElementById('productionForm').innerHTML = `<div style="color:#aaa;font-size:12px;text-align:center;padding:20px;">카드를 선택하거나 아래에서 새 생산을 추가하세요</div>`;
      }
      });
    });
  });
}

function initProductionCardsSortable() {
  if (productionCardsSortable) {
    productionCardsSortable.destroy();
    productionCardsSortable = null;
  }
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;

  const containerEl = document.getElementById('productionCards');
  if (!containerEl) return;
  if (containerEl.querySelectorAll('.production-card').length < 2) return;

  productionCardsSortable = Sortable.create(containerEl, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      await persistProductionCardOrder();
    },
  });
}

async function persistProductionCardOrder() {return runProductionCommand(command=>persistProductionCardOrderWithCommand(command));}
async function persistProductionCardOrderWithCommand(command) {
  if(await blockIfClosed(selectedDate,command))return;
  const containerEl = document.getElementById('productionCards');
  if (!containerEl) return;

  const items = Array.from(containerEl.querySelectorAll('.production-card'));
  const orderedIds=items.map(item=>item.dataset.id);
  const expectedOrder=productionOrderView(productions);

  try {
    await runProductionOrderTransaction({db,date:selectedDate,command,expectedOrder,prepare:async ({rows})=>{
      const active=rows.filter(row=>row.status!=='deleted');
      const ids=new Set(active.map(row=>row.id));
      if(orderedIds.length!==ids.size||new Set(orderedIds).size!==ids.size||orderedIds.some(id=>!ids.has(id))) {
        throw productionValidationError('생산 카드 목록이 변경되었습니다. 최신 자료를 다시 불러와주세요.');
      }
      const pool=active.map(row=>row.sortOrder).sort((a,b)=>a-b);
      return {changes:orderedIds.map((id,index)=>({id,kind:'update',data:{
        sortOrder:pool[index],mutationToken:newProductionWriteToken(),updatedAt:serverTimestamp(),
      }}))};
    }});
    if(!command.isCurrent())return;
    refreshProductionCardsView();
  } catch (err) {
    console.error('[production] card reorder failed:', err);
    alert('카드 순서 저장 실패: ' + err.message);
    const rows=await loadProductions(selectedDate);
    if(!command.isCurrent())return;
    productions=rows;
    if(!command.isCurrent())return;
    refreshProductionCardsView();
  }
}

async function showProductionForm(production, draft=null) {
  const isNew = !production;
  const canManageProduction = currentUserRole === 'admin' || currentUserRole === 'office';
  const form = document.getElementById('productionForm');

  form.innerHTML = `
    <div style="padding:16px 0;">
      <div class="form-group" style="margin-bottom:12px;">
        <label>레시피 *</label>
        <select id="pf_recipe" ${!isNew ? 'disabled' : ''}>
          <option value="">선택</option>
          ${recipes.map(r => `
            <option value="${escapeHtml(r.id)}"
              data-name="${escapeHtml(getRecipeDisplayName(r))}"
              data-category="${escapeHtml(r.category)}"
              data-color="${recipeColor(r.color)}"
              ${(production?.recipeId||draft?.recipeId) === r.id ? 'selected' : ''}>
              ${escapeHtml(getRecipeDisplayName(r))}
            </option>
          `).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label>생산단위 *</label>
        <div class="production-unit-control">
          <select id="pf_qty_select" disabled>
            <option value="">레시피 선택</option>
          </select>
          <input type="number" id="pf_qty_direct" value="" placeholder="직접 입력" style="display:none;" />
          <span id="pf_unitName" style="font-size:12px;color:#888;min-width:30px;">${escapeHtml(production?.productionUnitName || '')}</span>
        </div>
        <div class="production-unit-message" id="pf_qty_message" style="display:none;"></div>
      </div>
      <div class="production-conversion-control" id="pf_conversion_block" style="display:none;">
        <div class="production-conversion-row">
          <label>예상 박스</label>
          <span class="production-conversion-expected" id="pf_expectedBox">-</span>
        </div>
        <div class="production-conversion-hint" style="font-size:11px;color:#888;">방식·실제 박스는 메인 화면에서 생산 완료(제품 입고) 시 입력합니다.</div>
        <div class="production-unit-message" id="pf_conversion_message" style="display:none;"></div>
      </div>

      <!-- 원료 목록 -->
      <div id="pf_ingredients" style="margin-bottom:12px;max-height:200px;overflow-y:auto;font-size:12px;"></div>

      <!-- 참고 수치 -->
      <div id="pf_refs" style="font-size:11px;color:#888;margin-bottom:12px;"></div>

      ${isNew&&canManageProduction?`<label style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><input type="checkbox" id="pf_continue" ${draft?'checked':''} />저장 후 같은 제품 계속 입력</label>`:''}
      ${canManageProduction ? `<button class="btn-primary" id="btnSaveProduction" ${production?.lockedByCompletion ? 'disabled title="완료 취소를 먼저 진행해주세요"' : ''} style="width:100%;">${isNew ? '저장' : '수정'}</button>` : ''}
    </div>
  `;

  // 레시피 선택 시 원료 자동 계산
  const recipeSelect = document.getElementById('pf_recipe');
  const qtySelect = document.getElementById('pf_qty_select');
  const qtyDirectInput = document.getElementById('pf_qty_direct');
  const qtyMessage = document.getElementById('pf_qty_message');
  const saveButton = document.getElementById('btnSaveProduction');
  if(production?.lockedByCompletion && saveButton)saveButton.disabled=true;
  const methodSelect = document.getElementById('pf_methodKey');
  const conversionBlock = document.getElementById('pf_conversion_block');
  const conversionMessage = document.getElementById('pf_conversion_message');
  const conversionFutureNotice = document.getElementById('pf_conversion_future_notice');
  const expectedBoxEl = document.getElementById('pf_expectedBox');
  let unitBlocked = false;
  let conversionBlocked = false;

  function updateSaveButtonState() {
    if (saveButton) saveButton.disabled = !!production?.lockedByCompletion || unitBlocked || conversionBlocked;
  }

  function getSelectedQty() {
    if (!qtySelect || qtySelect.disabled) return 0;
    if (qtySelect.value === 'custom') {
      return parseFloat(qtyDirectInput.value) || 0;
    }
    return parseFloat(qtySelect.value) || 0;
  }

  function renderProductionUnitControl(recipe) {
    const presets = getUnitPresets(recipe);
    const currentQty = production?.productionUnitQty ?? draft?.qty;
    const hasCurrentQty = currentQty !== undefined && currentQty !== null && currentQty !== '';
    const allowLegacyEdit = !isNew && hasCurrentQty;
    const unitName = getProductionUnitName(recipe);

    document.getElementById('pf_unitName').textContent = unitName;
    qtyDirectInput.value = '';
    qtyDirectInput.style.display = 'none';
    qtyMessage.style.display = 'none';
    qtyMessage.textContent = '';

    if (!recipe) {
      qtySelect.innerHTML = '<option value="">레시피 선택</option>';
      qtySelect.disabled = true;
      unitBlocked = false;
      setConversionFutureNotice(null, null);
      updateSaveButtonState();
      return;
    }

    if (presets.length === 0 && !allowLegacyEdit) {
      qtySelect.innerHTML = '<option value="">선택 불가</option>';
      qtySelect.disabled = true;
      qtyMessage.textContent = '⚠ 레시피 관리에서 생산단위 프리셋을 먼저 설정해주세요.';
      qtyMessage.style.display = '';
      unitBlocked = true;
      updateSaveButtonState();
      return;
    }

    const options = presets.map(unit => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`).join('');
    qtySelect.innerHTML = `${options}<option value="custom">직접 입력...</option>`;
    qtySelect.disabled = false;
    unitBlocked = false;
    updateSaveButtonState();

    if(draft?.direct&&recipe?.id===draft.recipeId){
      qtySelect.value='custom';qtyDirectInput.value=draft.qty;qtyDirectInput.style.display='';return;
    }
    if (allowLegacyEdit && !presets.includes(Number(currentQty))) {
      qtySelect.value = 'custom';
      qtyDirectInput.value = currentQty;
      qtyDirectInput.style.display = '';
      return;
    }

    if (hasCurrentQty && presets.includes(Number(currentQty))) {
      qtySelect.value = String(currentQty);
      return;
    }

    qtySelect.value = presets.length > 0 ? String(presets[0]) : 'custom';
    if (qtySelect.value === 'custom') {
      qtyDirectInput.style.display = '';
    }
  }

  function setConversionMessage(message) {
    if (!conversionMessage) return;
    conversionMessage.textContent = message || '';
    conversionMessage.style.display = message ? '' : 'none';
  }

  function setConversionFutureNotice(currentMethod, applied) {
    if (!conversionFutureNotice) return;
    const usingFallback = currentMethod
      && currentMethod.effectiveDate
      && currentMethod.effectiveDate > selectedDate
      && applied
      && applied.effectiveDate !== currentMethod.effectiveDate;

    if (!usingFallback) {
      conversionFutureNotice.textContent = '';
      conversionFutureNotice.style.display = 'none';
      return;
    }

    conversionFutureNotice.textContent =
      `⚠ 이 환산값은 ${currentMethod.effectiveDate}부터 적용됩니다. 현재 생산일에는 이전 값(${Number(applied.unitToBox)})을 사용 중입니다.`;
    conversionFutureNotice.style.display = '';
  }

  function renderProductionConversionControl(recipe) {
    if (!conversionBlock || !expectedBoxEl) return;
    if (recipe?.category !== 'raw') {
      conversionBlock.style.display = 'none';
      expectedBoxEl.textContent = '-';
      return;
    }
    conversionBlock.style.display = '';
    updateConversionCalculation(recipe);
  }

  // [spec_v27] 예상 박스 = 레시피에 등록된 방식별(로터리/수동) unitToBox로 환산해 읽기전용 표시.
  // 방식 선택·실제 박스는 입력 시점에 받지 않음(메인 생산완료 모달에서 입력).
  function updateConversionCalculation(recipe) {
    if (!expectedBoxEl || recipe?.category !== 'raw') return;
    const qty = getSelectedQty();
    const methods = normalizeProductionMethods(recipe.productionMethods).filter(method => method.active);
    if (methods.length === 0) {
      expectedBoxEl.textContent = '환산값 미등록';
      return;
    }
    if (!(qty > 0)) {
      expectedBoxEl.textContent = '-';
      return;
    }
    expectedBoxEl.textContent = methods
      .map(method => `${method.label} ${getExpectedBox(qty, method.unitToBox).toFixed(1)}`)
      .join(' / ') + '박스';
  }

  refreshProductionFormConversion = async () => {
    await updateConversionCalculation(recipes.find(r => r.id === recipeSelect.value));
  };

  function handleQtyModeChange() {
    qtyDirectInput.style.display = qtySelect.value === 'custom' ? '' : 'none';
    updateIngredients();
    updateConversionCalculation(recipes.find(r => r.id === recipeSelect.value));
  }

  const abnormalProductionUnitWarningShown = new Set();

  function updateIngredients() {
    const recipeId = recipeSelect.value;
    const recipe = recipes.find(r => r.id === recipeId);
    const qty = getSelectedQty();
    if (!recipe || !qty) {
      document.getElementById('pf_ingredients').innerHTML = '';
      document.getElementById('pf_refs').innerHTML = '';
      return;
    }

    document.getElementById('pf_unitName').textContent = getProductionUnitName(recipe);

    const productionUnitIng = recipe.ingredients?.find(i => i.isProductionUnit);

    // 생산단위의 "1 qty 단위당 g" 환산.
    // - 단위명이 마리/봉 등 count 단위: PU baseWeightG (= 1개당 g)
    // - 단위명이 비어있거나 kg/g: weightDisplayUnit 기준 (1000 if kg, 1 if g)
    //   (qty 자체가 무게 단위로 해석됨)
    const puUnitName = (productionUnitIng?.unitName || '').trim().toLowerCase();
    const puIsCountUnit = puUnitName !== '' && puUnitName !== 'kg' && puUnitName !== 'g';
    const puGramsPerQty = puIsCountUnit
      ? Number(productionUnitIng?.baseWeightG) || 0
      : (productionUnitIng?.weightDisplayUnit === 'kg' ? 1000 : 1);
    const productionUnitTotalG = qty * puGramsPerQty;

    // 비정상 PU 경고: count 단위인데 baseWeightG가 너무 작은 경우만
    if (recipe.category === 'raw'
      && puIsCountUnit
      && puGramsPerQty > 0
      && puGramsPerQty < 50
      && !abnormalProductionUnitWarningShown.has(recipe.id)) {
      abnormalProductionUnitWarningShown.add(recipe.id);
      alert('⚠ 이 레시피의 생산단위 중량이 비정상입니다. 레시피 관리에서 확인해주세요.');
    }

    // ratio 기반: 각 ingredient의 총합은 (그 ingredient의 baseWeightG / PU의 baseWeightG) × totalProductionG.
    // PU 자기 자신은 ratio=1이므로 자연스럽게 totalProductionG.
    const puBaseWeightForRatio = Number(productionUnitIng?.baseWeightG) || 1;

    const ingHtml = (recipe.ingredients || []).map(ing => {
      const ratio = (Number(ing.baseWeightG) || 0) / puBaseWeightForRatio;
      const totalG = ratio * productionUnitTotalG;
      let displayText;
      if (ing.isProductionUnit && puIsCountUnit) {
        // 생산단위가 count 단위(마리/봉 등): 단위명으로 표시
        displayText = `${Number.isInteger(qty) ? qty : qty.toFixed(1)} ${productionUnitIng.unitName}`;
      } else if (ing.weightDisplayUnit === 'kg') {
        displayText = `${formatIngredientQtyValue(totalG, 'kg')} kg`;
      } else {
        displayText = `${formatIngredientQtyValue(totalG, 'g')} g`;
      }
      return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f5f5f5;">
        <span>${escapeHtml(ing.name)}</span>
        <span style="color:#333;font-weight:500">${escapeHtml(displayText)}</span>
      </div>`;
    }).join('');
    document.getElementById('pf_ingredients').innerHTML = ingHtml;

    // 참고 수치
    let refs = '';
    if (recipe.category === 'raw' && recipe.packWeightG) {
      const boxes = Math.ceil(productionUnitTotalG / recipe.packWeightG / 20);
      refs = `📦 박스수: ${boxes}박스`;
    } else if (recipe.category === 'freezeDry') {
      const parts = [`봉지: ${(recipe.freezeDryBagCountPerUnit || 0) * qty}`];
      if (!isTenderFreezeDry(recipe)) parts.push(`빵판: ${round2((recipe.breadPanCountPerUnit || 0) * qty)}`);
      parts.push(`동결판: ${(recipe.freezePanCountPerUnit || 0) * qty}`);
      refs = parts.join(' / ');
    }
    document.getElementById('pf_refs').textContent = refs;
  }

  recipeSelect.addEventListener('change', async () => {
    const recipe = recipes.find(r => r.id === recipeSelect.value);
    renderProductionUnitControl(recipe);
    renderProductionConversionControl(recipe);
    updateIngredients();
  });
  qtySelect.addEventListener('change', handleQtyModeChange);
  qtyDirectInput.addEventListener('input', () => {
    updateIngredients();
    updateConversionCalculation(recipes.find(r => r.id === recipeSelect.value));
  });
  methodSelect?.addEventListener('change', () => {
    updateConversionCalculation(recipes.find(r => r.id === recipeSelect.value));
  });

  renderProductionUnitControl(recipes.find(r => r.id === recipeSelect.value));
  renderProductionConversionControl(recipes.find(r => r.id === recipeSelect.value));
  updateIngredients();
  markFieldsSaved(form);

  document.getElementById('btnSaveProduction')?.addEventListener('click', () => runProductionCommand(async command => {
    if(production?.lockedByCompletion){alert('완료 취소를 먼저 진행해주세요.');return;}
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('생산 입력은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const recipeId = recipeSelect.value;
    const recipe = recipes.find(r => r.id === recipeId);
    const qty = getSelectedQty();
    const staff = '';

    if (!recipeId) { alert('레시피와 생산단위는 필수입니다.'); return; }
    if (isNew && recipe && getUnitPresets(recipe).length === 0) {
      alert('레시피 관리에서 생산단위 프리셋을 먼저 설정해주세요.');
      return;
    }
    if (qtySelect.value === 'custom' && (!qty || qty <= 0)) {
      alert('0보다 큰 생산단위를 입력해주세요.');
      return;
    }
    if (!qty || qty <= 0) { alert('레시피와 생산단위는 필수입니다.'); return; }
    if (await blockIfClosed(selectedDate,command)) return;

    // [spec_v27] 입력 시점엔 방식/실제박스를 받지 않음. 방식·판수·실제박스는 메인 생산완료(제품입고) 모달에서 기록.

    const unitName = getProductionUnitName(recipe);
    const displayName = getRecipeDisplayName(recipe);
    const productionUnitIng = recipe.ingredients?.find(i => i.isProductionUnit);

    // PU의 "1 qty 단위당 g" 환산 (위 updateIngredients와 동일 규칙).
    const savePuUnitName = (productionUnitIng?.unitName || '').trim().toLowerCase();
    const savePuIsCountUnit = savePuUnitName !== '' && savePuUnitName !== 'kg' && savePuUnitName !== 'g';
    const savePuGramsPerQty = savePuIsCountUnit
      ? Number(productionUnitIng?.baseWeightG) || 0
      : (productionUnitIng?.weightDisplayUnit === 'kg' ? 1000 : 1);
    const savePuTotalG = qty * savePuGramsPerQty;

    // 재고 부족 경고
    const shortages = checkShortages(recipe, qty);
    if (shortages.length > 0) {
      const msg = shortages.map(s => `⚠️ ${s}`).join('\n');
      const __c = await showConfirmModal({ title:'재고 부족 경고', message:`재고가 부족합니다:\n${msg}\n\n그래도 저장하시겠습니까?`, confirmText:'저장', danger:true }); if (!__c) return;
    }

    // 단일 순서 거래에서 서버 날짜 집합을 기준으로 최종 회차/차수를 계산한다.
    const sameRecipe = productions.filter(p => p.recipeId === recipeId);
    const round = isNew ? sameRecipe.length + 1 : (production.round || 1);
    const batchNo = isNew ? null : (production.batchNo ?? null);

    const data = {
      date: selectedDate,
      recipeId,
      recipeName: displayName,
      category: recipe.category,
      requiresSeparation: recipe.requiresSeparation === true,
      target: recipe.target,
      color: recipe.color || '#4A7C59',
      round,
      batchNo,
      productionUnitQty: qty,
      productionUnitName: unitName,
      ingredientsSnapshot: (function() {
        const savePuBaseWeight = Number(productionUnitIng?.baseWeightG) || 1;
        return (recipe.ingredients || []).map(ing => ({
          name: ing.name,
          meatTypeId: ing.meatTypeId || null,
          weightDisplayUnit: ing.weightDisplayUnit === 'kg' ? 'kg' : 'g',
          isProductionUnit: !!ing.isProductionUnit,
          unitName: ing.unitName || '',
          baseWeightG: Number(ing.baseWeightG) || 0,
          // ratio 기반 계산. PU는 ratio=1이므로 savePuTotalG와 같음.
          requiredQtyG: ((Number(ing.baseWeightG) || 0) / savePuBaseWeight) * savePuTotalG,
          autoDeductInventory: ing.autoDeductInventory !== false,
          linkedToInventory: ing.linkedToInventory !== false,
        }));
      })(),
      staffName: staff,
      sortOrder: isNew ? productions.length : production.sortOrder,
      ...(isNew ? {lockedByCompletion:false} : {}),
      status: 'active',
      updatedAt: new Date(),
    };

    // 참고 수치
    if (recipe.category === 'raw' && recipe.packWeightG) {
      data.rawBoxQty = Math.ceil(savePuTotalG / recipe.packWeightG / 20);
    }
    // [spec_v27] raw 방식/예상/실제 박스는 생산완료 모달에서 기록 (입력 저장엔 미포함)
    if (recipe.category === 'freezeDry') {
      data.freezeDryBagQty = (recipe.freezeDryBagCountPerUnit || 0) * qty;
      data.breadPanQty = isTenderFreezeDry(recipe) ? 0 : (recipe.breadPanCountPerUnit || 0) * qty;
      data.freezePanQty = (recipe.freezePanCountPerUnit || 0) * qty;
    }

    if (isNew) {
      data.createdAt = new Date();
      data.mutationToken = newProductionWriteToken();
      const productionRef = doc(collection(db, 'productions'));
      const activityLogRef = doc(collection(db, 'activityLogs'));
      try {
        await runProductionOrderTransaction({db,date:selectedDate,command,actorUid:currentUser?.uid,prepare:async ({rows})=>({
          changes:[{id:productionRef.id,kind:'create',data:{...data,
            sortOrder:Math.max(-1,...rows.filter(row=>row.status!=='deleted').map(row=>row.sortOrder))+1,
          }}],
          businessWrites:[{kind:'set',ref:activityLogRef,data:{
            action:'production',subAction:'create',date:selectedDate,staff,uid:currentUser?.uid||null,
            timestamp:serverTimestamp(),message:`생산 추가 — ${displayName} ${qty}${unitName} / 담당: ${staff}`,
            details:{productionId:productionRef.id,recipeId,recipeName:displayName,category:recipe.category,
              target:recipe.target,productionUnitQty:qty,productionUnitName:unitName},
            read:false,acknowledged:false,acknowledgedAt:null,acknowledgedBy:null,acknowledgedByUid:null,
          }}],
        })});
      } catch(err) {
        if(['permission-denied','production-order-conflict','production-validation','outcome-unknown'].includes(err.code))throw err;
        console.error('[production] save failed:',err);
        alert(getSupplementSaveErrorMessage(err.message,err.supplementName));return;
      }
    } else {
      await runProductionOrderTransaction({db,date:selectedDate,command,actorUid:currentUser?.uid,prepare:async ({transaction,rows})=>{
        const mutationToken=await assertProductionUnchanged(transaction,production,recipe);
        const current=rows.find(row=>row.id===production.id);
        if(!current)throw productionValidationError('생산 원본을 찾을 수 없습니다. 최신 자료를 다시 불러와주세요.');
        return {changes:[{id:production.id,kind:'update',data:{...data,sortOrder:current.sortOrder,mutationToken}}]};
      }});
    }

    // 날짜 순서와 회차/차수는 위 단일 거래에서 함께 확정한다.
    if(!command.isCurrent())return;
    refreshProductionCardsView();
    showStatus(isNew ? '저장 완료!' : '수정 완료!');
    if(isNew&&document.getElementById('pf_continue')?.checked){
      return {continueWith:{date:selectedDate,recipeId,qty,direct:qtySelect.value==='custom'}};
    }
  }));
}

function checkShortages(recipe, qty) {
  // 간단한 경고만 (실제 차감은 내일생산불러오기에서)
  return [];
}

function getRecipeDisplayName(recipe) {
  const prefix = recipe.target === 'cat' ? '고양이 ' : recipe.target === 'dog' ? '강아지 ' : '';
  return prefix + recipe.name;
}

function normalizeCopySheetOrder(order) {
  const valid = Array.isArray(order)
    ? order.filter(key => COPY_SHEET_ORDER_DEFAULT.includes(key))
    : [];
  const missing = COPY_SHEET_ORDER_DEFAULT.filter(key => !valid.includes(key));
  return [...valid, ...missing];
}

async function loadCopySheetOrder() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'copySheetOrder'));
    return snap.exists()
      ? normalizeCopySheetOrder(snap.data().order)
      : [...COPY_SHEET_ORDER_DEFAULT];
  } catch (err) {
    console.warn('[production] copySheetOrder load failed:', err);
    return [...COPY_SHEET_ORDER_DEFAULT];
  }
}

async function showCopySheetModal() {
  const today = new Date(selectedDate);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${String(today.getFullYear()).slice(2)}/${today.getMonth()+1}/${today.getDate()} ${days[today.getDay()]}`;
  const copySheetOrder = await loadCopySheetOrder();

  // [묶음 4B] sortOrder 순으로 정렬하여 묶음 첫 등장 순서 보장
  const sorted = [...productions].sort(compareProductionOrder);

  const rawCat = sorted.filter(p => p.category === 'raw' && p.target === 'cat');
  const rawDog = sorted.filter(p => p.category === 'raw' && p.target === 'dog');
  const freezeCat = sorted.filter(p => p.category === 'freezeDry' && p.target === 'cat');
  const freezeDog = sorted.filter(p => p.category === 'freezeDry' && p.target === 'dog');
  const freezeCommon = sorted.filter(p => p.category === 'freezeDry' && p.target === 'common');

  // [묶음 4B] 동일 (recipeId, productionUnitQty) 묶음 그룹핑
  // 첫 등장 위치를 묶음 위치로 사용. count로 차수 추적.
  function groupForSheet(list) {
    const seen = new Map();
    const ordered = [];
    list.forEach(p => {
      const key = `${p.recipeId}|${p.productionUnitQty}`;
      if (seen.has(key)) {
        seen.get(key).count += 1;
      } else {
        const obj = {
          recipeName: p.recipeName,
          productionUnitQty: p.productionUnitQty,
          count: 1,
        };
        seen.set(key, obj);
        ordered.push(obj);
      }
    });
    return ordered;
  }

  // [묶음 4B] 묶음 단위 텍스트 포맷
  // namePrefix: 출력에 붙일 prefix ("고양이 " / "강아지 " / "")
  // count >= 2면 N번 반복 + " (1차, 2차, ...)" 접미사
  function formatGroup(g, namePrefix) {
    const cleaned = g.recipeName.replace(/^(고양이 |강아지 )/, '');
    const single = `${namePrefix}${cleaned}${g.productionUnitQty}`;
    if (g.count === 1) return single;
    const repeated = Array(g.count).fill(single).join(', ');
    const batches = Array.from({ length: g.count }, (_, i) => `${i + 1}차`).join(', ');
    return `${repeated} (${batches})`;
  }

  let sheet = `※ ${dateStr} 생산\n`;

  if (rawCat.length > 0) {
    const items = groupForSheet(rawCat).map(g => formatGroup(g, '')).join(', ');
    sheet += `- 고양이 생식 : ${items}\n`;
  }
  if (rawDog.length > 0) {
    const items = groupForSheet(rawDog).map(g => formatGroup(g, '')).join(', ');
    sheet += `- 강아지 생식 : ${items}\n`;
  }
  if (freezeCat.length > 0 || freezeDog.length > 0 || freezeCommon.length > 0) {
    const catItems = groupForSheet(freezeCat).map(g => formatGroup(g, '고양이 '));
    const dogItems = groupForSheet(freezeDog).map(g => formatGroup(g, '강아지 '));
    const commonItems = groupForSheet(freezeCommon).map(g => formatGroup(g, ''));
    const allFreeze = [...catItems, ...dogItems, ...commonItems].join(', ');
    sheet += `- 동결건조 : ${allFreeze}\n`;
  }

  const sheetGroups = {
    rawCat: groupForSheet(rawCat).map(g => formatGroup(g, '')),
    rawDog: groupForSheet(rawDog).map(g => formatGroup(g, '')),
    freezeCat: groupForSheet(freezeCat).map(g => formatGroup(g, '')),
    freezeDog: groupForSheet(freezeDog).map(g => formatGroup(g, '')),
    freezeCommon: groupForSheet(freezeCommon).map(g => formatGroup(g, '')),
  };

  sheet = `📌${dateStr} 생산\n`;
  copySheetOrder.forEach(key => {
    const items = sheetGroups[key] || [];
    if (items.length === 0) return;
    sheet += `- ${COPY_SHEET_CATEGORY_LABELS[key]} : ${items.join(', ')}\n`;
  });

  showModal(`
    <h3 class="modal-title">생산지시서 복사</h3>
    <textarea id="sheetText" style="width:100%;height:140px;font-size:13px;padding:12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;resize:none;">${escapeHtml(sheet)}</textarea>
    <!-- [묶음 4C] 비고 입력 UI: textarea와 분리. 복사 시 끝줄에 합성. 비어있으면 줄 생략 -->
    <div class="form-group" style="margin-top:10px;">
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px;">비고</label>
      <input type="text" id="sheetNote" placeholder="입력 시 끝줄에 자동 추가됩니다 (비어 있으면 비고줄 생략)"
        style="width:100%;font-size:13px;padding:8px 12px;border:1px solid #e0e0e0;border-radius:6px;font-family:'Noto Sans KR',sans-serif;" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
      <button class="btn-primary" id="btnCopy">복사하기</button>
    </div>
  `);

  document.getElementById('btnCopy').addEventListener('click', () => {
    let text = document.getElementById('sheetText').value;
    const note = document.getElementById('sheetNote').value.trim();
    // [묶음 4C] 비고 합성: 본문 끝의 개행 정리 후 비고 줄 추가
    if (note) {
      text = text.replace(/\n+$/, '') + '\n' + note;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('복사 완료!');
      closeModal();
    });
  });
}

function showBigViewModal() {
  showModal(`
    <h3 class="modal-title">${escapeHtml(selectedDate)} 생산 현황</h3>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;">
      ${productions.length === 0 ? '<p style="color:#aaa">생산 없음</p>' :
        productions.map(p => `
          <div style="border:1px solid #e8e8e8;border-radius:8px;padding:16px;min-width:160px;border-left:4px solid ${recipeColor(p.color)}">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${escapeHtml(p.recipeName)}${getRoundBadgeHtml(p)}</div>
            <div style="font-size:12px;color:#555;">${escapeHtml(p.productionUnitQty)} ${escapeHtml(getProductionCardUnitName(p))}</div>
            ${p.category === 'raw' ? `<div style="font-size:11px;color:#888;">${escapeHtml(p.rawBoxQty || 0)}박스</div>` : ''}
            ${p.category === 'freezeDry' ? `<div style="font-size:11px;color:#888;">${escapeHtml(renderFreezeDryQtyLine(p))}</div>` : ''}
          </div>
        `).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);
}

// 유틸

let staffCache = {};

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
  overlay.innerHTML = `<div class="modal-box" style="width:600px;max-width:90vw;">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });
}

registerCloseModal('production', function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
});

// Read-only model construction shared by activation and idle preparation.
async function loadInitialModel(scope, date) {
    const keys=['senior','lead','office'];
    const [recipes,productions,...groups]=await Promise.all([loadRecipes(scope),loadProductions(date,scope),...keys.map(key=>scope.getDoc(doc(db,'staffGroups',key)))]);
    const completions=await scope.getDocs(query(collection(db,'productionCompletion'),where('targetProductionDate','==',date)));
    if(completions.docs.some(s=>s.data().status==='completed'))productions.forEach(p=>{p.lockedByCompletion=true;});
    return {recipes,productions,staff:Object.fromEntries(keys.map((key,i)=>[key,groups[i].exists()?groups[i].data().members||[]:[]]))};
}
export function preparePage({cacheOnly=true,date=getToday()}={}) { return productionResource.prepare?.(date,scope=>loadInitialModel(scope,date),{cacheOnly}); }
