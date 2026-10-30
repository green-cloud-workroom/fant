import {openInventoryReceiptCorrection,INVENTORY_RECEIPT_CORRECTION_ENABLED,mountInventoryCorrectionRecovery} from '../services/inventoryReceiptCorrection.js';
import {prepareFrozenSampleSetIncoming} from '../services/frozenSampleSetIncoming.js';
import { escapeHtml } from '../utils/html.js';
import { inventoryHandoffButton, bindInventoryHandoff } from '../services/inventoryHandoff.js';
import {showStatus} from '../utils/statusToast.js';
import {prepareFrozenSourceCommand} from '../services/frozenSourceCommand.js';
import { registerCloseModal } from '../utils/modalManager.js';
import { db } from '../firebase.js';
import {
  collection, documentId, getDocsFromServer as getDocs, doc, addDoc, updateDoc, query, orderBy, getDocFromServer as getDoc, writeBatch,
  deleteDoc, where, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { getTodayKST as getToday, addMonthsKST } from '../utils/date.js';
import { getActiveFreezeDryRecipes, getRecipeOptionsHtml } from '../utils/recipe.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUserRole } from '../app.js';
import { showConfirmModal } from '../utils/modal.js';
import { recordActivity } from '../services/activityLogs.js';
import Sortable from '../utils/sortable.js';

let frozenProducts = [];
let selectedProductId = null;
const frozenCorrectionRecoveryCache = {};

const FROZEN_PRODUCT_CATEGORY_STORAGE_KEY = 'frozenProductCategoryCollapsed';
const FROZEN_PRODUCT_CATEGORIES = [
  { key: 'cat-product', label: '고양이', target: 'cat', kind: 'product' },
  { key: 'dog-product', label: '강아지', target: 'dog', kind: 'product' },
  { key: 'common-product', label: '공용', target: 'common', kind: 'product' },
  { key: 'cat-sample', label: '고양이샘플', target: 'cat', kind: 'sample' },
  { key: 'dog-sample', label: '강아지샘플', target: 'dog', kind: 'sample' },
  { key: 'common-sample', label: '공용샘플', target: 'common', kind: 'sample' },
  { key: 'sample-set', label: '샘플세트', target: null, kind: 'sampleSet' },
];

export async function renderFrozenProduct({force=false}={}) {
  frozenCorrectionRecoveryCache.promise=null;
  bindInventoryHandoff();
 const content=document.getElementById('mainContent');
 content.innerHTML='<p style="padding:24px">동결제품 입고 로딩 중...</p>';
 const data=await frozenProductResource.load(scope=>loadInitialModel(scope),{force,onChange:pageRefresh(frozenProductResource,renderFrozenProduct)});
 if(!data||!content.isConnected)return;
 frozenProducts=data.products;staffCache=data.staff;renderFrozenProductLayout();
 if(selectedProductId){const selected=frozenProducts.find(p=>p.id===selectedProductId);if(selected)await showProductDetail(selected);}
 mountInventoryCorrectionRecovery({sourceCollection:'frozenLogs',role:currentUserRole,recoveryCache:frozenCorrectionRecoveryCache,showModal,closeModal:()=>window.closeModal(),onComplete:()=>renderFrozenProduct({force:true})});
}

async function loadFrozenProducts(scope={getDocs,getDoc}) {
  const q = query(collection(db, 'frozenProducts'), orderBy('sortOrder'));
  const snap = await scope.getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

async function loadFrozenLogs(productId) {
  const q = query(collection(db, 'frozenLogs'), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .filter(l => l.productId === productId && l.status !== 'deleted')
    .slice(0, 30);
}

function renderFrozenProductLayout() {
  const content = document.getElementById('mainContent');
  const canManageFrozenProduct = currentUserRole === 'admin' || currentUserRole === 'office';
  content.innerHTML = `
    <div class="recipe-wrap frozen-product-page">
      <!-- 왼쪽: 제품 목록 -->
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">제품 목록</span>
          ${canManageFrozenProduct ? '<button class="btn-secondary" id="btnNewProduct">+ 추가</button>' : ''}
        </div>
        <div class="recipe-list" id="productList">
          ${renderProductList()}
        </div>
      </div>

      <!-- 오른쪽: 입고 이력 -->
      <div class="recipe-detail-panel" id="productDetail">
        <div class="detail-empty">제품을 선택해주세요</div>
      </div>
    </div>
  `;

  bindProductListEvents();
  initFrozenProductSortable();
  document.getElementById('btnNewProduct')?.addEventListener('click', showNewProductModal);
}

function getFrozenProductTarget(product) {
  const name = product?.name || '';
  if (['cat', 'dog', 'common'].includes(product?.target)) return product.target;
  if (name.startsWith('고양이 ')) return 'cat';
  if (name.startsWith('강아지 ')) return 'dog';
  return 'common';
}

function getFrozenProductKind(product) {
  if (['product', 'sample', 'sampleSet'].includes(product?.kind)) return product.kind;
  return 'product';
}

function getProductCategoryKey(product) {
  const kind = getFrozenProductKind(product);
  if (kind === 'sampleSet') return 'sample-set';
  return `${getFrozenProductTarget(product)}-${kind}`;
}

function getFrozenProductCollapsedState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FROZEN_PRODUCT_CATEGORY_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setFrozenProductCategoryCollapsed(categoryKey, collapsed) {
  const state = getFrozenProductCollapsedState();
  state[categoryKey] = collapsed;
  localStorage.setItem(FROZEN_PRODUCT_CATEGORY_STORAGE_KEY, JSON.stringify(state));
}

function renderProductListItemCompact(p) {
  const canReorder = currentUserRole === 'admin' || currentUserRole === 'office';
  return `
    <div class="recipe-list-item ${selectedProductId === p.id ? 'active' : ''}"
      data-id="${escapeHtml(p.id)}" style="padding:3px 8px 3px 13px;min-height:28px;">
      ${canReorder ? '<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>' : ''}
      <div class="recipe-list-info" style="gap:0;">
        <span class="recipe-name" style="font-size:12.5px;line-height:1.2;">${escapeHtml(p.name)}</span>
      </div>
    </div>
  `;
}

function renderProductListByCategory() {
  const collapsedState = getFrozenProductCollapsedState();
  return FROZEN_PRODUCT_CATEGORIES
    .map(category => {
      const products = frozenProducts.filter(p => getProductCategoryKey(p) === category.key);
      const collapsed = collapsedState[category.key] === true;
      return `
        <div class="frozen-product-category" data-category="${category.key}">
          <button type="button" class="frozen-product-category-header list-category-header" data-category="${category.key}"
            >
            <span>${collapsed?'▶':'▼'} ${category.label}</span>
            <span style="font-size:11px;color:#777;">${products.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${category.key}" style="${collapsed ? 'display:none;' : ''}">
            ${products.length === 0
              ? '<div style="padding:4px 8px;color:#aaa;font-size:11.5px;">등록된 제품 없음</div>'
              : products.map(renderProductListItemCompact).join('')}
          </div>
        </div>
      `;
    }).join('');
}

function renderProductList() {
  return renderProductListByCategory();
}

function initFrozenProductSortable() {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;
  document.querySelectorAll('.frozen-product-category-items').forEach(el => {
    Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      group: {
        name: `frozenProduct-${el.dataset.category || 'group'}`,
        pull: false,
        put: false,
      },
      onEnd: async (evt) => {
        if (evt.oldIndex === evt.newIndex) return;
        await persistFrozenProductOrder();
      },
    });
  });
}

async function persistFrozenProductOrder() {
 return runPageCommand(frozenProductResource,async command=>{
  const {writeBatch}=commandWrites(command);

  const listEl = document.getElementById('productList');
  if (!listEl) return;
  const orderedIds = Array.from(listEl.querySelectorAll('.recipe-list-item'))
    .map(item => item.dataset.id)
    .filter(Boolean);
  const now = new Date();
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'frozenProducts', id), {
      sortOrder: idx,
      updatedAt: now,
    });
  });

  try {
    await batch.commit();
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    frozenProducts = frozenProducts
      .map(p => orderMap.has(p.id) ? { ...p, sortOrder: orderMap.get(p.id), updatedAt: now } : p)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (err) {
    console.error('[frozenProduct] reorder save failed:', err);
    alert('순번 저장 실패: ' + (err.message || err));
    frozenProducts = await loadFrozenProducts();
    if(!command.isCurrent())return;
    renderFrozenProductLayout();
    if (selectedProductId) {
      const selected = frozenProducts.find(p => p.id === selectedProductId);
      if (selected) await showProductDetail(selected);
    }
  }

 },{roles:['admin','office']});
}

function bindProductListEvents() {
  document.querySelectorAll('.frozen-product-category-header').forEach(header => {
    header.addEventListener('click', () => {
      const categoryKey = header.dataset.category;
      const body = document.querySelector(`.frozen-product-category-items[data-category="${categoryKey}"]`);
      if (!categoryKey || !body) return;
      const collapsed = body.style.display !== 'none';
      setFrozenProductCategoryCollapsed(categoryKey, collapsed);
      renderFrozenProductLayout();
      if (selectedProductId) {
        const selected = frozenProducts.find(p => p.id === selectedProductId);
        if (selected) showProductDetail(selected);
      }
    });
  });

  document.querySelectorAll('.recipe-list-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      if (e.target.closest('.drag-handle')) return;
      selectedProductId = item.dataset.id;
      document.querySelectorAll('.recipe-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const product = frozenProducts.find(p => p.id === selectedProductId);
      await showProductDetail(product);
    });
  });
}

async function getActiveFrozenLogCount(productId, scope={getDocs}) {
  const snap = await scope.getDocs(query(collection(db, 'frozenLogs'), where('productId', '==', productId)));
  return snap.docs
    .map(d => d.data())
    .filter(log => log.status !== 'deleted')
    .length;
}

async function deleteFrozenProductIfNoLogs(product) {
 return runPageCommand(frozenProductResource,async command=>{
  const {deleteDoc,recordActivity}=commandWrites(command);

  if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
    alert('동결제품 삭제는 관리자/사무 계정만 가능합니다.');
    return;
  }

  const logCount = await getActiveFrozenLogCount(product.id, command);
  if (logCount > 0) {
    alert(`사용 이력이 ${logCount}건 있어 삭제할 수 없습니다.`);
    return;
  }

  const confirmed = await showConfirmModal({
    title: '동결제품 삭제',
    message: `${product.name} 제품을 삭제하시겠습니까?\n입고 이력이 없는 제품만 완전히 삭제됩니다.`,
    confirmText: '삭제',
    danger: true,
  });
  if (!confirmed) return;

  await deleteDoc(doc(db, 'frozenProducts', product.id));
  await recordActivity({
    action: 'frozenProduct',
    subAction: 'delete',
    date: getToday(),
    staff: getRoleStaffLabel(),
    message: `동결제품 삭제 — ${product.name}`,
    details: {
      productId: product.id,
      productName: product.name,
      bagTypeId: product.bagTypeId || null,
    },
  });

  frozenProducts = frozenProducts.filter(p => p.id !== product.id);
  if (selectedProductId === product.id) selectedProductId = null;
  if(!command.isCurrent())return;
  renderFrozenProductLayout();
  alert('삭제 완료!');

 },{roles:['admin','office']});
}

async function showProductDetail(product) {
  const detail = document.getElementById('productDetail');
  const logs = await loadFrozenLogs(product.id);
  if(!detail?.isConnected||selectedProductId!==product.id)return;
  const canManageFrozenProduct = currentUserRole === 'admin' || currentUserRole === 'office';

  detail.innerHTML = `
    <div class="detail-header">
      <span class="detail-title">${escapeHtml(product.name)}</span>
      <div class="detail-actions">
        ${canManageFrozenProduct ? '<button class="btn-secondary" id="btnEditProduct">수정</button>' : ''}
        ${canManageFrozenProduct ? '<button class="btn-secondary" id="btnDeleteProduct">삭제</button>' : ''}
        <button class="btn-primary" id="btnAddIncoming">+ \uC785\uACE0 \uB4F1\uB85D</button>
      </div>
    </div>
    <div class="detail-body">
      <!-- 입고 이력 -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-title">입고 이력</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>유통기한</th>
                <th>수량(개)</th>
                <th>차감봉투(장)</th>
                <th>담당자</th>
                <th>비고</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
                logs.map(l => `
                  <tr>
                    <td>${escapeHtml(l.date || '-')}</td>
                    <td>${escapeHtml(l.expiryDate || '-')}</td>
                    <td>${escapeHtml(l.qty)}</td>
                    <td>${escapeHtml(l.deductedBagQty || '-')}</td>
                    <td>${escapeHtml(l.staffName || '-')}</td>
                    <td>${escapeHtml(l.note || '-')}</td>
                    <td>
                      ${inventoryHandoffButton(`frozenLogs:${l.id}:${Number.isSafeInteger(l.receiptRevision)&&l.receiptRevision>0?l.receiptRevision:1}`)}
                      ${canManageFrozenProduct ? `
                        <button class="btn-edit-row" data-logid="${escapeHtml(l.id)}" style="margin-right:4px;">수정</button>
                        <button class="btn-del-row" data-logid="${escapeHtml(l.id)}" data-qty="${escapeHtml(l.qty)}" data-bagqty="${escapeHtml(l.deductedBagQty || 0)}" data-bagid="${escapeHtml(product.bagTypeId || '')}">취소</button>
                      ` : (INVENTORY_RECEIPT_CORRECTION_ENABLED?'<span>입고 정정·취소는 대표·사무실 계정에서 가능합니다.</span>':'')}
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  mountInventoryCorrectionRecovery({sourceCollection:'frozenLogs',role:currentUserRole,recoveryCache:frozenCorrectionRecoveryCache,showModal,closeModal:()=>window.closeModal(),onComplete:()=>renderFrozenProduct({force:true})});
  document.getElementById('btnAddIncoming')?.addEventListener('click', () => showIncomingModal(product));
  document.getElementById('btnEditProduct')?.addEventListener('click', () => showEditProductModal(product));
  document.getElementById('btnDeleteProduct')?.addEventListener('click', () => deleteFrozenProductIfNoLogs(product));

  document.querySelectorAll('.btn-edit-row').forEach(btn => {
    btn.addEventListener('click', () => openIncomingAction(product,btn.dataset.logid,'correct').catch(error=>alert(error.message)));
  });
  document.querySelectorAll('.btn-del-row').forEach(btn => {
    btn.addEventListener('click', () => openIncomingAction(product,btn.dataset.logid,'cancel').catch(error=>alert(error.message)));
  });
}

async function openIncomingAction(product,logId,kind) {
  if(!['admin','office'].includes(currentUserRole))throw Error('입고 정정·취소는 대표·사무실 계정만 가능합니다.');
  const page=getPageContext(),snap=await getDoc(doc(db,'frozenLogs',logId));
  if(page&&!page.isCurrent())return;
  if(!snap.exists())throw Error('입고 원본을 찾을 수 없습니다.');
  const log={...snap.data(),id:snap.id};
  if(log.productId!==product.id)throw Error('선택한 제품과 입고 원본이 다릅니다. 다시 불러와주세요.');
  if(INVENTORY_RECEIPT_CORRECTION_ENABLED){
    const receiptId=`frozenLogs:${log.id}:${log.receiptRevision??1}`;
    const receipt=await getDoc(doc(db,'productTransferRequests',receiptId));
    if(page&&!page.isCurrent())return;
    if(['completed','입고완료'].includes(receipt.data()?.status)){
      await openInventoryReceiptCorrection({sourceCollection:'frozenLogs',sourceId:log.id,mode:kind==='cancel'?'cancel':'edit',showModal,closeModal:()=>window.closeModal(),onComplete:()=>renderFrozenProduct({force:true}),onMetadata:kind==='correct'?async()=>{
        try{const metadata=await prepareFrozenSourceCommand(log.id,{expectedProductId:product.id});showEditIncomingModal(product,log,metadata,'correct');}catch(error){alert(error.message);}
      }:undefined});
      return;
    }
  }
  const flow=await prepareFrozenSourceCommand(log.id,{expectedProductId:product.id});
  if(page&&!page.isCurrent())return;
  if(!flow.eligible&&!(kind==='correct'&&flow.metadataEligible)){
    showModal(`<h3 class="modal-title">재고앱 처리 필요 / 근거 확인</h3><p>${escapeHtml(flow.holdMessage)}</p><p>원본 ID: ${escapeHtml(log.id)} · 요청 버전: ${escapeHtml(flow.source.revision)}</p><p>원본 수량과 봉투 재고를 자동으로 바꾸지 않습니다.</p><div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button></div>`);
    return;
  }
  showEditIncomingModal(product,log,flow,kind);
}

function showEditIncomingModal(product,log,flow,kind='correct') {
  const page=getPageContext();
  const cancelling=kind==='cancel';
  showModal(`<h3 class="modal-title">입고 ${cancelling?'취소':'수정'} — ${escapeHtml(product.name)}</h3>
    <input id="m_date" type="date" value="${escapeHtml(flow.source.date)}" disabled>
    <p>제조 ${escapeHtml(flow.source.date)} · 현재 ${escapeHtml(flow.source.quantity)}봉 · 입고 버전 ${escapeHtml(flow.source.revision)}</p>
    <p>담당자: ${escapeHtml(flow.actor.name)} (본인 계정)</p>
    ${!flow.eligible?`<p>${escapeHtml(flow.holdMessage)} 메모·표시 담당자는 여기서 수정할 수 있습니다.</p>`:''}
    ${cancelling?'<p>미인계 입고를 취소하고 확인된 봉투 차감분만 원자적으로 환급합니다. 과거 원장·로그는 보존합니다.</p>':`<div class="form-group"><label>정정할 절대 수량(봉)</label><input id="m_source_qty" type="number" min="1" step="1" value="${escapeHtml(flow.source.quantity)}"></div>
    <div class="form-group"><label>유통기한</label><input id="m_source_expiry" type="date" value="${escapeHtml(flow.source.expiryDate)}"></div>
    <div class="form-group"><label>표시 담당자</label><select id="m_source_staff"><option value="">선택</option>${getStaffOptions(['senior','lead','office'],flow.source.staffName)}</select></div>
    <div class="form-group"><label>메모</label><input id="m_source_note" maxlength="2000" value="${escapeHtml(flow.source.note)}"></div>`}
    ${flow.source.components?.length?`<p>저장 당시 구성비로 함께 정정합니다. ${flow.source.components.map(c=>`${escapeHtml(c.productId)}: 현재 ${escapeHtml(c.before)}봉, 세트당 ${escapeHtml(c.ratio)}봉`).join(' / ')}</p><label><input id="m_component_shortage" type="checkbox">구성품이 부족해 음수가 되어도 진행할 것을 확인합니다.</label>`:''}
    <div class="form-group"><label>${cancelling?'취소':'정정'} 사유</label><input id="m_source_reason" maxlength="500" type="text"></div>
    <p id="m_source_status" role="status"></p>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button><button id="btnInspectFrozenSource" class="btn-secondary" hidden>서버 결과 확인</button><button id="btnSubmitFrozenSource" class="btn-primary">${cancelling?'입고 취소':'수정 저장'}</button></div>`);
  const save=document.getElementById('btnSubmitFrozenSource'),inspect=document.getElementById('btnInspectFrozenSource'),status=document.getElementById('m_source_status');
  let busy=false;
  const finish=async()=>{if(page&&!page.isCurrent())return;closeModal();await renderFrozenProduct({force:true});showStatus(cancelling?'입고 취소를 확인했습니다.':'입고 수정을 확인했습니다.');};
  inspect.addEventListener('click',async()=>{
    if(busy)return;busy=true;inspect.disabled=true;
    try{const actual=await flow.inspectResult();if(page&&!page.isCurrent())return;if(actual.confirmed)await finish();else status.textContent='아직 이 작업의 서버 결과를 확인하지 못했습니다. 새 요청을 만들지 말고 잠시 후 다시 확인해주세요.';}
    catch(error){if(!page||page.isCurrent())status.textContent=error.message;}
    finally{busy=false;inspect.disabled=false;}
  });
  save.addEventListener('click',async()=>{
    if(busy||flow.dispatched)return;
    const reason=document.getElementById('m_source_reason').value.trim(),quantity=cancelling?undefined:parsePositiveWholeQty(document.getElementById('m_source_qty').value);
    if(!reason||reason.length>500){status.textContent='사유를 1~500자로 입력해주세요.';return;}
    if(!cancelling&&(!Number.isSafeInteger(quantity))){status.textContent='1봉 이상의 안전한 정수를 입력해주세요.';return;}
    busy=true;save.disabled=true;document.querySelectorAll('#modalOverlay input').forEach(input=>input.disabled=true);
    await runPageCommand(frozenProductResource,async command=>{
      try{
        if(await blockIfClosed(flow.source.date,command))return;
        await flow.submit(kind,{quantity,reason,command,...(!cancelling?{expiryDate:document.getElementById('m_source_expiry').value,staffName:document.getElementById('m_source_staff').value,note:document.getElementById('m_source_note').value}:{}),allowComponentShortage:document.getElementById('m_component_shortage')?.checked===true});
        if(command.isCurrent())await finish();
      }catch(error){if(!page||page.isCurrent()){status.textContent=error.message;inspect.hidden=false;}}
    },{roles:['admin','office']});
    busy=false;
    if(!flow.dispatched&&(!page||page.isCurrent()))status.textContent||='입고 상태를 다시 확인한 뒤 창을 새로 열어주세요.';
  });
}

function showNewProductModal() {
  showProductModal(null);
}

function showEditProductModal(product) {
  showProductModal(product);
}

function normalizeComponents(components) {
  if (!Array.isArray(components)) return [];
  return components
    .map(c => ({
      frozenProductId: c?.frozenProductId || '',
      qty: Number(c?.qty) || 0,
    }))
    .filter(c => c.frozenProductId && c.qty > 0);
}

function parsePositiveWholeQty(value) {
  if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) return null;
  const qty = Number(value);
  return Number.isSafeInteger(qty) && qty > 0 ? qty : null;
}

function getSampleProductsForComponents(currentProductId) {
  return frozenProducts.filter(p => getFrozenProductKind(p) === 'sample' && p.id !== currentProductId);
}

function renderComponentOptions(selectedId = '', currentProductId = null) {
  const samples = getSampleProductsForComponents(currentProductId);
  return [
    '<option value="">샘플 선택</option>',
    ...samples.map(p => `<option value="${escapeHtml(p.id)}" ${selectedId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>`),
  ].join('');
}

function renderComponentRow(component = {}, currentProductId = null) {
  const qty = Number(component.qty) > 0 ? Number(component.qty) : 1;
  return `
    <div class="sample-set-component-row" style="display:grid;grid-template-columns:1fr 80px auto;gap:8px;align-items:center;margin-bottom:6px;">
      <select class="component-product-id">
        ${renderComponentOptions(component.frozenProductId || '', currentProductId)}
      </select>
      <input type="number" class="component-qty" min="1" step="1" value="${qty}" />
      <button type="button" class="btn-secondary btn-remove-component">삭제</button>
    </div>
  `;
}

function escapeAttribute(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function frozenProductReceiptTransfer({ product, frozenLogId, date, expiry, qty, staff }) {
  const kind = getFrozenProductKind(product);
  if (kind !== 'product' && kind !== 'sample') return null;

  const revision = 1;
  const idempotencyKey = `frozenLogs:${frozenLogId}:${revision}`;
  return {
      idempotencyKey,
      sourceApp: 'production',
      sourceCollection: 'frozenLogs',
      sourceId: frozenLogId,
      eventType: 'productReceipt',
      category: 'freezeDry',
      revision,
      supersedesRevision: null,
      status: 'pending',
      frozenProductId: product.id,
      productName: product.name,
      recipeName: product.recipeTitleRef || product.name,
      unitType: kind === 'sample' ? 'sample' : 'main',
      quantity: qty,
      expiryDate: expiry,
      producedDate: date,
      staff,
      createdAt: serverTimestamp(),
  };
}

async function hasFrozenReceiptTransfer(frozenLogId, {getDoc,getDocs}) {
  const request=await getDoc(doc(db,'productTransferRequests',`frozenLogs:${frozenLogId}:1`));
  if(request.exists())return true;
  const prefix=`frozenLogs:${frozenLogId}:`;
  const byId=await getDocs(query(collection(db,'productTransferRequests'),where(documentId(),'>=',prefix),where(documentId(),'<',`frozenLogs:${frozenLogId};`)));
  if(byId.size>0)return true;
  const related=await getDocs(query(collection(db,'productTransferRequests'),where('sourceId','==',frozenLogId)));
  return related.docs.some(row=>row.data().sourceCollection==='frozenLogs');
}
async function blockIfFrozenReceiptTransferred(frozenLogId, reader) {
  if(!await hasFrozenReceiptTransfer(frozenLogId,reader))return false;
  alert('재고앱으로 보낸 입고는 서버 정정·취소로 확인해주세요. 직접 수정하지 않습니다.');return true;
}

async function showProductModal(product) {
  const isNew = !product;

  // 봉투 목록 로드
  const bagSnap = await getDocs(query(collection(db, 'bagTypes'), orderBy('sortOrder')));
  const bags = bagSnap.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .filter(b => b.category === 'freezeDry' && (b.active !== false || (!isNew && b.id === product?.bagTypeId)));
  const recipes = await getActiveFreezeDryRecipes();
  const target = getFrozenProductTarget(product);
  const kind = getFrozenProductKind(product);
  const components = normalizeComponents(product?.components);
  const renderNameInput = (inputKind, value = '') => {
    if (inputKind === 'sampleSet') {
      return `<input type="text" id="m_name" value="${escapeAttribute(value)}" placeholder="샘플세트 이름 입력" />`;
    }
    return `
      <select id="m_name">
        ${getRecipeOptionsHtml(recipes, value)}
      </select>
    `;
  };

  showModal(`
    <h3 class="modal-title">${isNew ? '동결제품 추가' : '동결제품 수정'}</h3>
    <div class="form-group">
      <label>제품명 *</label>
      <div id="m_name_wrap">
        ${renderNameInput(kind, product?.name || '')}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종 *</label>
        <select id="m_target">
          <option value="cat" ${target === 'cat' ? 'selected' : ''}>고양이</option>
          <option value="dog" ${target === 'dog' ? 'selected' : ''}>강아지</option>
          <option value="common" ${target === 'common' ? 'selected' : ''}>공용</option>
        </select>
      </div>
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_kind">
          <option value="product" ${kind === 'product' ? 'selected' : ''}>본품</option>
          <option value="sample" ${kind === 'sample' ? 'selected' : ''}>샘플</option>
          <option value="sampleSet" ${kind === 'sampleSet' ? 'selected' : ''}>샘플세트</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>연결 봉투 *</label>
      <select id="m_bagType">
        <option value="">선택</option>
        ${bags.map(b => `<option value="${escapeHtml(b.id)}" ${product?.bagTypeId === b.id ? 'selected' : ''}>${escapeHtml(b.name)}${b.active === false ? ' (\uBE44\uD65C\uC131)' : ''}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>분리작업 필요</label>
      <select id="m_separation">
        <option value="false" ${!product?.requiresSeparation ? 'selected' : ''}>아니오</option>
        <option value="true" ${product?.requiresSeparation ? 'selected' : ''}>예</option>
      </select>
    </div>
    <div class="form-group" id="m_components_section" style="${kind === 'sampleSet' ? '' : 'display:none;'}">
      <label>샘플세트 구성</label>
      <div id="m_components_rows">
        ${(components.length > 0 ? components : [{}]).map(c => renderComponentRow(c, product?.id || null)).join('')}
      </div>
      <button type="button" class="btn-secondary" id="btnAddComponentRow">+ 구성 샘플 추가</button>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveProduct">${isNew ? '추가' : '저장'}</button>
    </div>
  `);

  const updateComponentsVisibility = () => {
    const isSampleSet = document.getElementById('m_kind').value === 'sampleSet';
    document.getElementById('m_components_section').style.display = isSampleSet ? '' : 'none';
  };
  const updateNameInput = () => {
    const currentValue = document.getElementById('m_name')?.value || '';
    const nextKind = document.getElementById('m_kind').value;
    document.getElementById('m_name_wrap').innerHTML = renderNameInput(nextKind, currentValue);
  };
  document.getElementById('m_kind')?.addEventListener('change', () => {
    updateComponentsVisibility();
    updateNameInput();
  });
  document.getElementById('btnAddComponentRow')?.addEventListener('click', () => {
    document.getElementById('m_components_rows').insertAdjacentHTML('beforeend', renderComponentRow({}, product?.id || null));
  });
  document.getElementById('m_components_rows')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-component');
    if (!btn) return;
    const row = btn.closest('.sample-set-component-row');
    const rows = document.querySelectorAll('.sample-set-component-row');
    if (rows.length <= 1) {
      row.querySelector('.component-product-id').value = '';
      row.querySelector('.component-qty').value = '1';
      return;
    }
    row.remove();
  });

  document.getElementById('btnSaveProduct').addEventListener('click', async () => {
 return runPageCommand(frozenProductResource,async command=>{
  const {addDoc,updateDoc}=commandWrites(command);

    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('동결제품 등록/수정은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const name = document.getElementById('m_name').value.trim();
    const recipeRef = name;
    const target = document.getElementById('m_target').value;
    const kind = document.getElementById('m_kind').value;
    const bagTypeId = document.getElementById('m_bagType').value;
    const requiresSeparation = document.getElementById('m_separation').value === 'true';
    const nextActive = isNew ? true : product.active !== false;

    if (!name || !bagTypeId) { alert('제품명과 연결 봉투는 필수입니다.'); return; }
    const nextComponents = kind === 'sampleSet'
      ? Array.from(document.querySelectorAll('.sample-set-component-row')).map(row => ({
          frozenProductId: row.querySelector('.component-product-id').value,
          qty: Number(row.querySelector('.component-qty').value) || 0,
        })).filter(c => c.frozenProductId && c.qty > 0)
      : [];

    if (kind === 'sampleSet' && nextComponents.length === 0) {
      alert('샘플세트 구성 샘플을 1개 이상 입력해주세요.');
      return;
    }

    const data = {
      name,
      recipeTitleRef: recipeRef,
      target,
      kind,
      components: nextComponents,
      bagTypeId,
      requiresSeparation,
      active: nextActive,
      sortOrder: isNew ? frozenProducts.length : product.sortOrder,
      updatedAt: new Date(),
    };

    if (isNew) {
      data.createdAt = new Date();
      await addDoc(collection(db, 'frozenProducts'), data);
    } else {
      await updateDoc(doc(db, 'frozenProducts', product.id), data);
    }

    frozenProducts = await loadFrozenProducts();
    if(!command.isCurrent())return;
    closeModal();
    if(!command.isCurrent())return;
    renderFrozenProductLayout();
    alert(isNew ? '추가 완료!' : '수정 완료!');

 },{roles:['admin','office']});
});
}
// 제품별 현재 재고 (frozenLogs 합산, deleted 제외)
async function getFrozenStockByProduct() {
  const snap = await getDocs(collection(db, 'frozenLogs'));
  const map = {};
  snap.docs.forEach(d => {
    const l = d.data();
    if (l.status === 'deleted') return;
    if (!l.productId) return;
    map[l.productId] = (map[l.productId] || 0) + Number(l.qty || 0);
  });
  return map;
}

async function showIncomingModal(product) {
  const page=getPageContext();
  const today = getToday();
  const futureStr = addMonthsKST(18);
  let previewBag=null;
  if(product.bagTypeId){
    try{const snap=await getDoc(doc(db,'bagTypes',product.bagTypeId));
      if(snap.exists()&&Number.isFinite(Number(snap.data().currentQty)))previewBag={name:snap.data().name||'연결 봉투',qty:Number(snap.data().currentQty)};
    }catch{/* Preview is optional; the existing save-time server check remains authoritative. */}
  }

  // 샘플세트: 구성품 자동차감 준비
  const isSampleSet = getFrozenProductKind(product) === 'sampleSet';
  const components = isSampleSet ? normalizeComponents(product.components) : [];
  let sampleSetServerFlow=null;
  if(isSampleSet){try{sampleSetServerFlow=await prepareFrozenSampleSetIncoming(product.id);}catch(error){alert(error.message);return;}}
  const stockMap = components.length > 0 ? await getFrozenStockByProduct() : {};
  if(page&&!page.isCurrent())return;
  const getComponentName = (id) => frozenProducts.find(p => p.id === id)?.name || '(삭제된 제품)';

  showModal(`
    <h3 class="modal-title">입고 등록 — ${escapeHtml(product.name)}</h3>
    <div class="form-group">
      <label>날짜 *</label>
      <input type="date" id="m_date" value="${today}" max="${today}" />
    </div>
    <div class="form-group">
      <label>유통기한 *</label>
      <input type="date" id="m_expiry" value="${futureStr}" />
    </div>
    <div class="form-group">
      <label>봉지수 *</label>
      <input type="number" id="m_qty" placeholder="봉지수 입력" />
    </div>
    ${product.bagTypeId?'<p id="m_bagPreview" role="status" aria-live="polite" style="font-size:12px;margin:8px 0"></p>':''}
    ${components.length > 0 ? `
      <div class="form-group" id="m_compPreview" style="background:#f7f7f7;border-radius:6px;padding:10px 12px;font-size:12.5px;color:#555;">
        세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.
      </div>
    ` : ''}
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${sampleSetServerFlow ? (sampleSetServerFlow.actor.sharedQc ? sampleSetServerFlow.actor.staffOptions : [{employeeId:sampleSetServerFlow.actor.employeeId,name:sampleSetServerFlow.actor.name}]).map(s=>`<option value="${escapeAttribute(s.employeeId)}">${escapeHtml(s.name)}</option>`).join('') : getStaffOptions(['senior', 'lead', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveIncoming">입고</button>
    </div>
  `);

  const updateBagPreview=()=>{
    const el=document.getElementById('m_bagPreview');if(!el)return;
    if(!previewBag){el.textContent='봉투 재고를 확인하지 못했습니다. 저장 시 다시 확인합니다.';return;}
    const qty=parsePositiveWholeQty(document.getElementById('m_qty').value) || 0;
    el.textContent=qty>0?`${previewBag.name} · 현재 ${previewBag.qty}장 · 필요 ${qty}장 · 예상 잔량 ${previewBag.qty-qty}장${qty>previewBag.qty?' (부족)':''}`:`${previewBag.name} · 현재 ${previewBag.qty}장 (저장 시 최신 재고 재확인)`;
    el.style.color=qty>previewBag.qty?'#b33333':'#555';
  };
  document.getElementById('m_qty').addEventListener('input',updateBagPreview);
  updateBagPreview();

  // 구성품 차감 미리보기
  if (components.length > 0) {
    document.getElementById('m_qty').addEventListener('input', (e) => {
      const setQty = parsePositiveWholeQty(e.target.value) || 0;
      const el = document.getElementById('m_compPreview');
      if (!el) return;
      if (setQty <= 0) {
        el.innerHTML = '세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.';
        el.style.color = '#555';
        return;
      }
      el.innerHTML = components.map(c => {
        const need = setQty * c.qty;
        const cur = stockMap[c.frozenProductId] || 0;
        const after = cur - need;
        const short = after < 0;
        return `<div style="margin-bottom:2px;${short ? 'color:#e53e3e;font-weight:600;' : ''}">
          ${escapeHtml(getComponentName(c.frozenProductId))} -${need}개 (현재 ${cur} → ${after})${short ? ' ⚠️ 재고 부족' : ''}
        </div>`;
      }).join('');
    });
  }

  document.getElementById('btnSaveIncoming').addEventListener('click', async () => {
 return runPageCommand(frozenProductResource,async command=>{
  const {runTransaction}=commandWrites(command);

    const date = document.getElementById('m_date').value;
    const expiry = document.getElementById('m_expiry').value;
    const qty = parsePositiveWholeQty(document.getElementById('m_qty').value);
    const staff = document.getElementById('m_staff').value;
    const note = '';

    if (!date) { alert('날짜를 입력해주세요.'); return; }
    if (date > today) { alert('미래 날짜는 입력할 수 없습니다.'); return; }
    if (!expiry) { alert('유통기한을 입력해주세요.'); return; }
    if (expiry < date) { alert('유통기한이 입고일보다 빠릅니다.'); return; }
    if (!Number.isSafeInteger(qty) || qty <= 0) { alert('봉지수는 1봉 이상의 안전한 정수로 입력해주세요.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date, command)) return;

    if(sampleSetServerFlow){
      try{await sampleSetServerFlow.submit({date,expiry,quantity:qty,employeeId:staff,command});if(!command.isCurrent())return;closeModal();await showProductDetail(product);showStatus('샘플세트 입고 완료!');}
      catch(error){alert(error.message);if(sampleSetServerFlow.dispatched){document.getElementById('btnSaveIncoming').disabled=true;const inspect=document.createElement('button');inspect.className='btn-secondary';inspect.textContent='원래 작업 결과 확인';inspect.addEventListener('click',async()=>{try{const result=await sampleSetServerFlow.inspectResult();if(result.confirmed&&command.isCurrent()){closeModal();await showProductDetail(product);}else alert('아직 결과를 확인하지 못했습니다. 자동 재전송하지 않습니다.');}catch(e){alert(e.message);}});document.getElementById('btnSaveIncoming').after(inspect);}}
      return;
    }

    if (components.length > 440 || components.some(c => !Number.isSafeInteger(qty * c.qty))) {
      throw new Error('구성품 수량 또는 거래 크기가 허용 범위를 벗어났습니다.');
    }

    const frozenLogRef = doc(collection(db, 'frozenLogs'));
    const activityRef = doc(collection(db, 'activityLogs'));
    const componentRefs = components.map(() => doc(collection(db, 'frozenLogs')));
    const bagLogRef = product.bagTypeId ? doc(collection(db, 'bagLogs')) : null;
    const ledgerRef = product.bagTypeId ? doc(collection(db, 'stockLedger')) : null;
    const transfer = frozenProductReceiptTransfer({ product, frozenLogId: frozenLogRef.id, date, expiry, qty, staff });
    const transferRef = transfer ? doc(db, 'productTransferRequests', transfer.idempotencyKey) : null;
    const productRef = doc(db, 'frozenProducts', product.id);
    const closingRef = doc(db, 'closings', date);
    const bagRef = product.bagTypeId ? doc(db, 'bagTypes', product.bagTypeId) : null;
    const createdAt = new Date();
    const expectedProduct = JSON.stringify({
      name: product.name, kind: getFrozenProductKind(product), bagTypeId: product.bagTypeId || null,
      recipeTitleRef: product.recipeTitleRef || null, components,
    });
    // All document reads precede all writes. Generated IDs are stable across SDK retries.
    await runTransaction(db, async tx => {
      const [productSnap, closingSnap, bagSnap, ...newSnaps] = await Promise.all([
        tx.get(productRef), tx.get(closingRef),
        bagRef ? tx.get(bagRef) : Promise.resolve(null),
        ...[frozenLogRef, ...componentRefs, bagLogRef, ledgerRef, transferRef, activityRef]
          .filter(Boolean).map(ref => tx.get(ref)),
      ]);
      if (newSnaps.some(snap => snap.exists())) throw new Error('입고 문서 ID가 이미 사용 중입니다. 저장을 중단했습니다.');
      if (closingSnap.exists() && closingSnap.data().status === 'closed') throw new Error(`${date}는 이미 마감된 날짜입니다.`);
      if (!productSnap.exists() || productSnap.data().active === false) throw new Error('제품이 변경되거나 비활성화되었습니다. 다시 불러와주세요.');
      const liveProduct = productSnap.data();
      if (JSON.stringify({
        name: liveProduct.name, kind: getFrozenProductKind(liveProduct), bagTypeId: liveProduct.bagTypeId || null,
        recipeTitleRef: liveProduct.recipeTitleRef || null,
        components: getFrozenProductKind(liveProduct) === 'sampleSet' ? normalizeComponents(liveProduct.components) : [],
      }) !== expectedProduct) throw new Error('제품 구성이 변경되었습니다. 다시 불러와주세요.');
      if (bagRef && !bagSnap?.exists()) throw new Error('연결된 봉투 문서가 없습니다. 입고를 중단하고 봉투 마스터를 확인해주세요.');
      let deductedBagQty = 0;
      if (bagSnap?.exists()) {
        const bagData = bagSnap.data();
        const currentBag = Number(bagData.currentQty ?? 0);
        if (!Number.isFinite(currentBag) || currentBag < qty) throw new Error(`봉투 재고가 부족하거나 유효하지 않습니다. 현재 ${bagData.currentQty}장, 필요 ${qty}장`);
        const newQty = currentBag - qty;
        tx.update(bagRef, { currentQty: newQty, updatedAt: createdAt });
        tx.set(bagLogRef, {
          date, timestamp: createdAt, bagTypeId: product.bagTypeId, bagNameSnapshot: bagData.name,
          type: 'autoDeduct', qty: -qty, before: currentBag, after: newQty, staffName: staff,
          note: `동결제품 입고 자동차감 - ${product.name}`,
        });
        tx.set(ledgerRef, {
          actionType: 'frozenProductIncoming', actionId: frozenLogRef.id, timestamp: createdAt,
          date, status: 'active', items: [{
            collection: 'bagTypes', docId: product.bagTypeId, field: 'currentQty', delta: -qty,
            before: currentBag, after: newQty, label: `${bagData.name} 봉투`,
            stockUpdatedAtSnapshot: createdAt, bagLogId: bagLogRef.id,
          }],
        });
        deductedBagQty = qty;
      }
      tx.set(frozenLogRef, {
        date, timestamp: createdAt, productId: product.id, productNameSnapshot: product.name,
        componentsSnapshot: getFrozenProductKind(product) === 'sampleSet' ? components : null, expiryDate: expiry, qty,
        bagTypeId: product.bagTypeId || null, deductedBagQty, staffName: staff, note,
        status: 'active', ledgerId: deductedBagQty ? ledgerRef.id : null,
        ...(componentRefs.length ? { componentDeductLogIds: componentRefs.map(ref => ref.id) } : {}),
      });
      components.forEach((c, index) => {
        tx.set(componentRefs[index], {
          date, timestamp: createdAt, productId: c.frozenProductId,
          productNameSnapshot: getComponentName(c.frozenProductId), componentsSnapshot: null,
          expiryDate: null, qty: -(qty * c.qty), bagTypeId: null, deductedBagQty: 0,
          staffName: staff, note: `샘플세트 제작 자동차감 - ${product.name} ${qty}세트`,
          status: 'active', ledgerId: null, sampleSetLogId: frozenLogRef.id,
        });
      });
      if (transferRef) tx.set(transferRef, transfer);
      await recordActivity({
      action: 'frozenProduct',
      subAction: 'incoming',
      date,
      staff,
      message: `동결제품 입고 — ${product.name} +${qty}봉 / 담당: ${staff}`,
      details: {
        frozenLogId: frozenLogRef.id,
        productId: product.id,
        productName: product.name,
        componentsSnapshot: getFrozenProductKind(product) === 'sampleSet' ? normalizeComponents(product.components) : null,
        qty,
        expiryDate: expiry || null,
        deductedBagQty,
        bagTypeId: product.bagTypeId || null,
        note: note || null,
      },
      }, { batch: tx, ref: activityRef });
    });

    if(!command.isCurrent())return;
    closeModal();
    if(!command.isCurrent())return;
    await showProductDetail(product);
    showStatus('입고 등록 완료!');

 },{roles:['admin','office','production']});
});
}

// 유틸

let staffCache = {};
async function loadStaffCache() {
  if (Object.keys(staffCache).length > 0) return;
  await Promise.all(['senior', 'lead', 'office'].map(async key => {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) staffCache[key] = snap.data().members || [];
  }));
}

function getStaffOptions(groups, selectedName = null) {
  let options = '';
  for (const g of groups) {
    const members = staffCache[g] || [];
    members.forEach(m => {
      options += `<option value="${escapeHtml(m.name)}"${selectedName !== null && selectedName === m.name ? ' selected' : ''}>${escapeHtml(m.name)}</option>`;
    });
  }
  return options;
}

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '\uB300\uD45C';
  if (currentUserRole === 'office') return '\uC0AC\uBB34\uC2E4';
  if (currentUserRole === 'production') return '\uC0DD\uC0B0\uC2E4';
  return '\uC2DC\uC2A4\uD15C';
}

function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });
}

registerCloseModal('frozenProduct', function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
});

import {pageResource} from '../state/pageResources.js';
import {pageRefresh} from '../utils/pageRefresh.js';
import {getPageContext} from '../utils/pageLifecycle.js';
import {loadPageStaff} from '../services/pageStaff.js';
const frozenProductResource=pageResource('frozenProduct');
frozenProductResource.refresh=renderFrozenProduct;

import {runPageCommand} from '../services/pageCommand.js';
import {commandWrites} from '../services/commandWrites.js';

// Read-only model construction shared by activation and idle preparation.
async function loadInitialModel(scope) {
   const [products,staff]=await Promise.all([loadFrozenProducts(scope),loadPageStaff(scope)]);
   return {products,staff};
}
export function preparePage({cacheOnly=true}={}) { return frozenProductResource.prepare?.('default',loadInitialModel,{cacheOnly}); }
