import {supportReference} from '../utils/correctionDisplay.js';
import {staffError} from '../utils/staffText.js';
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

const FROZEN_KIND_LABELS={product:'일반제품',sample:'샘플',sampleSet:'샘플세트'};
let selectedKind='product';
let productQuery='';
let manageProducts=false;
let entryPage=null;
const entryDrafts=new Map();
const entryDefaults=new Map();
const pendingSetChecks=new Map();

export async function renderFrozenProduct({force=false}={}) {
  bindInventoryHandoff();
  const content=document.getElementById('mainContent');
  const existing=content.querySelector('.frozen-workspace');
  const previousModel=frozenProductResource.model;
  const page=getPageContext();
  if(page!==entryPage){
    entryPage=page;
    registerPageCleanup(()=>{
      entryDrafts.clear();
      entryDefaults.clear();
      pendingSetChecks.clear();
      selectedProductId=null;
      selectedKind='product';
      productQuery='';
      manageProducts=false;
      entryPage=null;
    });
  }
  if(!existing) content.innerHTML='<p class="list-empty">동결제품을 불러오는 중입니다.</p>';
  const data=await frozenProductResource.load(loadInitialModel,{
    force,onChange:pageRefresh(frozenProductResource,renderFrozenProduct,{draftSelector:'.frozen-inline-entry'}),
  });
  if(!data||!content.isConnected) return;
  if(!force&&existing?.isConnected&&existing.dataset.role===currentUserRole&&previousModel===frozenProductResource.model) return;
  frozenCorrectionRecoveryCache.promise=null;
  frozenProducts=data.products;
  staffCache=data.staff;
  await renderFrozenProductLayout();
}

async function loadFrozenProducts(scope={getDocs,getDoc}) {
  const q = query(collection(db, 'frozenProducts'), orderBy('sortOrder'));
  const snap = await scope.getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

async function loadFrozenLogs(productId) {
  const snap=await getDocs(query(collection(db,'frozenLogs'),where('productId','==',productId)));
  const time=log=>log.timestamp?.toMillis?.()??(Number.isFinite(log.timestamp?.seconds)
    ?log.timestamp.seconds*1000+(log.timestamp.nanoseconds||0)/1e6
    :new Date(log.timestamp).getTime()||0);
  return snap.docs.map(doc=>({...doc.data(),id:doc.id}))
    .filter(log=>log.status!=='deleted'&&log.timestamp!==undefined)
    .sort((a,b)=>time(b)-time(a)||b.id.localeCompare(a.id))
    .slice(0,30);
}

function renderFrozenProductLayout() {
  const content=document.getElementById('mainContent');
  const canManage=['admin','office'].includes(currentUserRole);
  const matching=frozenProducts.filter(p=>getFrozenProductKind(p)===selectedKind);
  const selected=matching.find(p=>p.id===selectedProductId)||matching[0];
  selectedProductId=selected?.id??null;
  content.innerHTML=`<section class="frozen-workspace ${manageProducts&&canManage?'is-managing':''}" data-role="${escapeHtml(currentUserRole)}" data-has-drafts="${entryDrafts.size>0}">
    <header class="frozen-workspace-heading"><h2>동결제품 입고</h2><span>${frozenProducts.length}개 제품</span>
      ${canManage?`<button type="button" class="btn-secondary" id="btnFrozenManage" aria-pressed="${manageProducts}">${manageProducts?'관리 끝내기':'제품 관리'}</button>`:''}
    </header>
    <div class="frozen-columns"><aside class="frozen-picker" aria-label="제품 목록">
      <div class="frozen-kind-filters" role="group" aria-label="제품 종류">${Object.entries(FROZEN_KIND_LABELS).map(([kind,label])=>
        `<button type="button" data-frozen-kind="${kind}" aria-pressed="${kind===selectedKind}">${label} <b>${frozenProducts.filter(p=>getFrozenProductKind(p)===kind).length}</b></button>`).join('')}</div>
      ${manageProducts&&canManage?'<button type="button" class="btn-secondary" id="btnNewProduct">+ 제품 추가</button>':`<input type="search" id="frozenProductSearch" aria-label="제품명 검색" placeholder="제품명 검색" value="${escapeHtml(productQuery)}">`}
      <div id="productList">${renderProductList()}</div><p id="frozenNoMatches" hidden>검색 결과가 없습니다.</p>
    </aside><section id="productDetail" aria-label="선택 제품 입고와 최근 기록"></section></div></section>`;
  bindProductListEvents();
  if(manageProducts&&canManage) initFrozenProductSortable();
  document.getElementById('btnNewProduct')?.addEventListener('click',showNewProductModal);
  document.getElementById('btnFrozenManage')?.addEventListener('click',()=>{
    manageProducts=!manageProducts;
    productQuery='';
    return renderFrozenProductLayout();
  });
  applyProductFilter();
  if(selected) return showProductDetail(selected);
  document.getElementById('productDetail').textContent='이 종류에 등록된 제품이 없습니다.';
  mountFrozenRecovery();
}

function applyProductFilter() {
  const list=document.getElementById('productList');
  if(!list) return;
  const search=productQuery.trim().toLowerCase();
  let matches=0;
  for(const group of list.querySelectorAll('.frozen-product-category')){
    const sameKind=group.dataset.kind===selectedKind;
    let count=0;
    for(const item of group.querySelectorAll('.recipe-list-item')){
      item.hidden=Boolean(search)&&!item.querySelector('.recipe-name').textContent.toLowerCase().includes(search);
      if(!item.hidden) count++;
    }
    group.hidden=!sameKind||count===0;
    if(sameKind) matches+=count;
    const body=group.querySelector('.frozen-product-category-items');
    body.hidden=!search&&group.dataset.collapsed==='true';
  }
  document.getElementById('frozenNoMatches').hidden=matches>0;
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
  const selected=selectedProductId===p.id;
  return `<div class="recipe-list-item${selected?' active':''}" data-id="${escapeHtml(p.id)}">
    ${manageProducts&&['admin','office'].includes(currentUserRole)?'<span class="drag-handle" title="순서 변경" aria-label="순서 변경">☰</span>':''}
    <button type="button" class="frozen-pick" aria-pressed="${selected}"><span class="recipe-name">${escapeHtml(p.name)}</span>${p.active===false?' <small>비활성</small>':''}</button>
  </div>`;
}

function renderProductListByCategory() {
  const collapsedState = getFrozenProductCollapsedState();
  return FROZEN_PRODUCT_CATEGORIES
    .map(category => {
      const products = frozenProducts.filter(p => getProductCategoryKey(p) === category.key);
      const collapsed = collapsedState[category.key] === true;
      return `
        <div class="frozen-product-category" data-category="${category.key}" data-kind="${category.kind}" data-collapsed="${collapsed}">
          <button type="button" class="frozen-product-category-header list-category-header" data-category="${category.key}"
            >
            <span><span data-arrow>${collapsed?'▶':'▼'}</span> ${category.label}</span>
            <span style="font-size:11px;color:#777;">${products.length}</span>
          </button>
          <div class="frozen-product-category-items" data-category="${category.key}">
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
    alert('순번 저장 실패: ' + (staffError(err) || err));
    frozenProducts = await loadFrozenProducts();
    if(!command.isCurrent())return;
    await renderFrozenProductLayout();
  }

 },{roles:['admin','office']});
}

function bindProductListEvents() {
  const list=document.getElementById('productList');
  document.querySelectorAll('[data-frozen-kind]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(selectedKind===button.dataset.frozenKind) return;
      selectedKind=button.dataset.frozenKind;
      productQuery='';
      return renderFrozenProductLayout();
    });
  });
  document.getElementById('frozenProductSearch')?.addEventListener('input',event=>{
    productQuery=event.target.value;
    applyProductFilter();
  });
  list.querySelectorAll('.frozen-product-category-header').forEach(header=>{
    header.addEventListener('click',()=>{
      const group=header.closest('.frozen-product-category');
      const collapsed=group.dataset.collapsed!=='true';
      group.dataset.collapsed=String(collapsed);
      setFrozenProductCategoryCollapsed(header.dataset.category,collapsed);
      header.querySelector('[data-arrow]').textContent=collapsed?'▶':'▼';
      applyProductFilter();
    });
  });
  list.querySelectorAll('.recipe-list-item').forEach(item=>{
    item.addEventListener('click',event=>{
      if(event.target.closest('.drag-handle')||selectedProductId===item.dataset.id) return;
      const product=frozenProducts.find(p=>p.id===item.dataset.id);
      if(!product) return;
      selectedProductId=product.id;
      for(const row of list.querySelectorAll('.recipe-list-item')){
        row.classList.toggle('active',row===item);
        row.querySelector('.frozen-pick').setAttribute('aria-pressed',String(row===item));
      }
      const ready=showProductDetail(product);
      if(window.matchMedia?.('(max-width:700px)').matches) document.getElementById('productDetail').scrollIntoView({block:'start'});
      return ready;
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
  await renderFrozenProductLayout();
  alert('삭제 완료!');

 },{roles:['admin','office']});
}

function mountFrozenRecovery(){
  return mountInventoryCorrectionRecovery({
    sourceCollection:'frozenLogs',role:currentUserRole,recoveryCache:frozenCorrectionRecoveryCache,
    showModal,closeModal:()=>window.closeModal(),onComplete:()=>renderFrozenProduct({force:true}),
  });
}

function renderReceiptHistory(host,product,logs) {
  const canManage=['admin','office'].includes(currentUserRole);
  const unit=getFrozenProductKind(product)==='sampleSet'?'세트':'봉';
  let page=0;
  const size=5;
  host.innerHTML=`<div class="frozen-history-heading"><h3>최근 기록</h3><span>최근 ${logs.length}건</span></div>
    <table class="frozen-history-table"><thead><tr><th>입고일</th><th>유통기한</th><th>수량</th><th>담당자</th><th>작업</th></tr></thead><tbody></tbody></table>
    <div class="frozen-paging"><span aria-live="polite"></span><button type="button" class="btn-secondary" data-prev>이전</button><button type="button" class="btn-secondary" data-next>다음</button></div>`;
  const previous=host.querySelector('[data-prev]'), next=host.querySelector('[data-next]');
  function draw(){
    const start=page*size, rows=logs.slice(start,start+size);
    host.querySelector('tbody').innerHTML=rows.map((log,i)=>{
      const id=escapeHtml(log.id);
      const revision=Number.isSafeInteger(log.receiptRevision)&&log.receiptRevision>0?log.receiptRevision:1;
      const deduction=log.sampleSetLogId||Number(log.qty)<0;
      return `<tr><td data-log-date>${escapeHtml(log.date||'—')}</td><td data-log-expiry>${escapeHtml(log.expiryDate||'—')}</td>
        <td class="frozen-log-qty" data-log-qty>${escapeHtml(log.qty??'—')}${unit}${deduction?'<small>구성품 차감</small>':''}</td>
        <td data-log-staff>${escapeHtml(log.staffName||'—')}</td><td><button type="button" class="frozen-detail-link" data-log-details="${i}" aria-expanded="false">상세</button></td></tr>
        <tr class="frozen-log-details" data-detail-index="${i}" hidden><td colspan="5">
        <div>차감 봉투 <b data-log-bags>${escapeHtml(log.deductedBagQty??'—')}장</b> · 비고 <span data-log-note>${escapeHtml(log.note||'—')}</span></div>
        <div class="frozen-log-actions">${inventoryHandoffButton(`frozenLogs:${log.id}:${revision}`)}
        ${canManage?`<button type="button" class="btn-secondary btn-edit-row" data-logid="${id}">수정</button>
          <button type="button" class="btn-secondary btn-del-row" data-logid="${id}" data-qty="${escapeHtml(log.qty)}" data-bagqty="${escapeHtml(log.deductedBagQty||0)}" data-bagid="${escapeHtml(product.bagTypeId||'')}">입고 취소</button>`:
          (INVENTORY_RECEIPT_CORRECTION_ENABLED?'<span>입고 정정·취소는 대표·사무실 계정에서 가능합니다.</span>':'')}
        </div></td></tr>`;
    }).join('')||'<tr><td colspan="5">최근 기록이 없습니다.</td></tr>';
    host.querySelector('.frozen-paging span').textContent=rows.length?`${start+1}–${start+rows.length} / ${logs.length}건`:'0건';
    previous.disabled=page===0;
    next.disabled=start+rows.length>=logs.length;
    for(const btn of host.querySelectorAll('[data-log-details]')){
      btn.addEventListener('click',()=>{
        const detail=host.querySelector(`[data-detail-index="${btn.dataset.logDetails}"]`);
        detail.hidden=!detail.hidden;
        btn.setAttribute('aria-expanded',String(!detail.hidden));
        btn.textContent=detail.hidden?'상세':'접기';
      });
    }
    for(const btn of host.querySelectorAll('[data-logid]')){
      btn.addEventListener('click',()=>openIncomingAction(product,btn.dataset.logid,btn.classList.contains('btn-del-row')?'cancel':'correct').catch(error=>alert(staffError(error))));
    }
  }
  previous.addEventListener('click',()=>{page--;draw();});
  next.addEventListener('click',()=>{page++;draw();});
  draw();
}

async function showProductDetail(product) {
  const detail=document.getElementById('productDetail');
  if(!detail?.isConnected||selectedProductId!==product.id) return;
  const canManage=manageProducts&&['admin','office'].includes(currentUserRole);
  detail.innerHTML=`<div class="frozen-selected"><span>${FROZEN_KIND_LABELS[getFrozenProductKind(product)]}</span>
    <h3 class="detail-title">${escapeHtml(product.name)}</h3>
    ${canManage?'<div class="frozen-master-actions"><button class="btn-secondary" id="btnEditProduct">수정</button><button class="btn-danger" id="btnDeleteProduct">삭제</button></div>':''}
    </div>
    <section class="frozen-inline-entry" aria-label="입고 입력"><p role="status">입고 정보를 불러오는 중입니다.</p></section>
    <section class="frozen-history" aria-label="선택 제품 최근 기록"><p role="status">기록을 불러오는 중입니다.</p></section>`;
  detail.querySelector('#btnEditProduct')?.addEventListener('click',()=>showEditProductModal(product));
  detail.querySelector('#btnDeleteProduct')?.addEventListener('click',()=>deleteFrozenProductIfNoLogs(product));
  const entry=detail.querySelector('.frozen-inline-entry'),history=detail.querySelector('.frozen-history');
  async function loadHistory(){
    try{
      const logs=await loadFrozenLogs(product.id);
      if(history.isConnected&&product.id===selectedProductId) renderReceiptHistory(history,product,logs);
    } catch(error){
      if(!history.isConnected) return;
      history.innerHTML='<p>이력을 불러오지 못했습니다. <button type="button" class="btn-secondary">다시 불러오기</button></p>';
      history.querySelector('button').addEventListener('click',loadHistory);
    }
  }
  mountFrozenRecovery();
  if(product.active===false) entry.textContent='비활성 제품입니다.';
  await Promise.all([loadHistory(),product.active===false?null:showIncomingModal(product,entry)]);
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
        try{const metadata=await prepareFrozenSourceCommand(log.id,{expectedProductId:product.id});showEditIncomingModal(product,log,metadata,'correct');}catch(error){alert(staffError(error));}
      }:undefined});
      return;
    }
  }
  const flow=await prepareFrozenSourceCommand(log.id,{expectedProductId:product.id});
  if(page&&!page.isCurrent())return;
  if(!flow.eligible&&!(kind==='correct'&&flow.metadataEligible)){
    showModal(`<h3 class="modal-title">재고앱 처리 필요 / 근거 확인</h3><p>${escapeHtml(flow.holdMessage)}</p><p>${escapeHtml(product.name)} · ${escapeHtml(log.date)} 입고</p>${supportReference(log.id)}<p>원본 수량과 봉투 재고를 자동으로 바꾸지 않습니다.</p><div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button></div>`);
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
    ${flow.source.components?.length?`<p>저장 당시 구성비로 함께 정정합니다. ${flow.source.components.map(c=>`${escapeHtml(c.productName||c.productNameSnapshot||frozenProducts.find(p=>p.id===c.productId)?.name||'구성품명 확인 필요')}: 현재 ${escapeHtml(c.before)}봉, 세트당 ${escapeHtml(c.ratio)}봉`).join(' / ')}</p><label><input id="m_component_shortage" type="checkbox">구성품이 부족해 음수가 되어도 진행할 것을 확인합니다.</label>`:''}
    <div class="form-group"><label>${cancelling?'취소':'정정'} 사유</label><input id="m_source_reason" maxlength="500" type="text"></div>
    <p id="m_source_status" role="status"></p>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">닫기</button><button id="btnInspectFrozenSource" class="btn-secondary" hidden>서버 결과 확인</button><button id="btnSubmitFrozenSource" class="btn-primary">${cancelling?'입고 취소':'수정 저장'}</button></div>`);
  const save=document.getElementById('btnSubmitFrozenSource'),inspect=document.getElementById('btnInspectFrozenSource'),status=document.getElementById('m_source_status');
  let busy=false;
  const finish=async()=>{if(page&&!page.isCurrent())return;closeModal();await renderFrozenProduct({force:true});showStatus(cancelling?'입고 취소를 확인했습니다.':'입고 수정을 확인했습니다.');};
  inspect.addEventListener('click',async()=>{
    if(busy)return;busy=true;inspect.disabled=true;
    try{const actual=await flow.inspectResult();if(page&&!page.isCurrent())return;if(actual.confirmed)await finish();else status.textContent='아직 이 작업의 서버 결과를 확인하지 못했습니다. 새 요청을 만들지 말고 잠시 후 다시 확인해주세요.';}
    catch(error){if(!page||page.isCurrent())status.textContent=staffError(error);}
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
      }catch(error){if(!page||page.isCurrent()){status.textContent=staffError(error);inspect.hidden=false;}}
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
    await renderFrozenProductLayout();
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

function syncDraftMarker(){
  const workspace=document.querySelector('.frozen-workspace');
  if(workspace) workspace.dataset.hasDrafts=String(entryDrafts.size>0);
}

function mountSetResultCheck(host,product,flow) {
  host.innerHTML=`<h3>세트 입고</h3><p role="status">이전 입고 요청의 결과를 확인해주세요.</p>
    <button type="button" class="btn-secondary">원래 작업 결과 확인</button>`;
  const inspect=host.querySelector('button');
  inspect.addEventListener('click',async()=>{
    inspect.disabled=true;
    try{
      const result=await flow.inspectResult();
      if(result.confirmed){
        pendingSetChecks.delete(product.id);
        entryDrafts.delete(product.id);
        syncDraftMarker();
        if(host.isConnected) await renderFrozenProduct({force:true});
      }else if(host.isConnected) host.querySelector('p').textContent='아직 서버 결과를 확인하지 못했습니다. 잠시 후 다시 확인해주세요.';
    }catch(error){if(host.isConnected) host.querySelector('p').textContent=staffError(error);}
    finally{inspect.disabled=false;}
  });
}

async function showIncomingModal(product,host=null) {
  const page=getPageContext();
  const current=()=> (!page||page.isCurrent())&&(!host||host.isConnected&&product.id===selectedProductId);
  if(host&&pendingSetChecks.has(product.id)){
    mountSetResultCheck(host,product,pendingSetChecks.get(product.id));
    return;
  }
  const today=getToday(), futureStr=addMonthsKST(18);
  const isSampleSet=getFrozenProductKind(product)==='sampleSet';
  const components=isSampleSet?normalizeComponents(product.components):[];
  let previewBag=null,sampleSetServerFlow=null,stockMap={};
  if(product.bagTypeId){
    try{
      const snap=await getDoc(doc(db,'bagTypes',product.bagTypeId));
      if(snap.exists()&&Number.isFinite(Number(snap.data().currentQty))) previewBag={name:snap.data().name||'연결 봉투',qty:Number(snap.data().currentQty)};
    }catch{/* 저장할 때 트랜잭션이 최신 봉투를 다시 확인한다. */}
  }
  if(!current()) return;
  if(isSampleSet){
    try{
      sampleSetServerFlow=await prepareFrozenSampleSetIncoming(product.id);
      if(current()&&components.length) stockMap=await getFrozenStockByProduct();
    }catch(error){
      if(!current()) return;
      if(!host){alert(staffError(error));return;}
      host.innerHTML='<h3>세트 입고</h3><p role="status"></p><button type="button" class="btn-secondary">다시 확인</button>';
      host.querySelector('p').textContent=staffError(error);
      host.querySelector('button').addEventListener('click',event=>{
        event.currentTarget.disabled=true;
        return showIncomingModal(product,host);
      });
      return;
    }
  }
  if(!current()) return;
  const getComponentName=id=>frozenProducts.find(p=>p.id===id)?.name||'(삭제된 제품)';
  const fid=id=>host?'frozen_inline_'+id:id;
  const staffOptions=sampleSetServerFlow
    ? (sampleSetServerFlow.actor.sharedQc?(sampleSetServerFlow.actor.staffOptions||[]):[sampleSetServerFlow.actor])
      .map(staff=>`<option value="${escapeAttribute(staff.employeeId)}">${escapeHtml(staff.name)}</option>`).join('')
    : getStaffOptions(['senior','lead','office']);
  const formMarkup=`
    <h3 class="${host?'':'modal-title'}">${host?'입고 입력':'입고 등록 — '+escapeHtml(product.name)}</h3>
    <div class="frozen-entry-fields">
      <div class="form-group"><label for="${fid('m_qty')}">${isSampleSet?'세트 수량':'입고 수량 (봉)'} *</label>
        <input type="number" id="${fid('m_qty')}" min="1" step="1" inputmode="numeric" placeholder="${isSampleSet?'세트 수':'봉지수'} 입력"></div>
      <div class="form-group"><label for="${fid('m_staff')}">담당자 *</label>
        <select id="${fid('m_staff')}"><option value="">담당자 선택</option>${staffOptions}</select></div>
      <div class="form-group"><label for="${fid('m_date')}">입고일 *</label>
        <input type="date" id="${fid('m_date')}" value="${today}" max="${today}"></div>
      <div class="form-group"><label for="${fid('m_expiry')}">유통기한 *</label>
        <input type="date" id="${fid('m_expiry')}" value="${futureStr}"></div>
    </div>
    ${product.bagTypeId?`<p id="${fid('m_bagPreview')}" class="frozen-bag-preview" role="status" aria-live="polite"></p>`:''}
    ${components.length?`<div id="${fid('m_compPreview')}" class="frozen-component-preview" aria-live="polite">세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.</div>`:''}
    <div class="${host?'frozen-entry-actions':'modal-actions'}">
      ${host?'<span>입고 등록 후 재고앱 인계 확인</span>':'<button class="btn-secondary" onclick="closeModal()">취소</button>'}
      <button type="button" class="btn-primary" id="${fid('btnSaveIncoming')}">입고 등록</button>
    </div>`;
  if(host) host.innerHTML=formMarkup;
  else showModal(formMarkup);
  const form=host||document.getElementById('modalOverlay');
  const field=id=>form.querySelector('#'+fid(id));
  const updatePreview=()=>{
    const qty=parsePositiveWholeQty(field('m_qty').value)||0;
    const el=field('m_bagPreview');
    if(el){
      if(!previewBag) el.textContent='봉투 재고를 확인하지 못했습니다. 저장 시 다시 확인합니다.';
      else{
        const current=previewBag.qty.toLocaleString('ko-KR');
        el.textContent=qty?`${previewBag.name} · 현재 ${current}장 · 필요 ${qty.toLocaleString('ko-KR')}장 · 예상 잔량 ${(previewBag.qty-qty).toLocaleString('ko-KR')}장${qty>previewBag.qty?' (부족)':''}`:`${previewBag.name} · 현재 ${current}장 (저장 시 최신 재고 재확인)`;
        el.classList.toggle('frozen-shortage',qty>previewBag.qty);
      }
    }
    if(components.length){
      field('m_compPreview').innerHTML=qty?components.map(c=>{
        const need=qty*c.qty,cur=stockMap[c.frozenProductId]||0,after=cur-need;
        return `<div class="${after<0?'frozen-shortage':''}">${escapeHtml(getComponentName(c.frozenProductId))} -${need}개 (현재 ${cur} → ${after})${after<0?' · 재고 부족':''}</div>`;
      }).join(''):'세트 수량을 입력하면 구성품 차감 내역이 표시됩니다.';
    }
    if(host) field('btnSaveIncoming').disabled=!qty||!field('m_staff').value||!field('m_date').value||!field('m_expiry').value;
  };
  const fields=['m_qty','m_date','m_expiry','m_staff'];
  if(host){
    const defaults=entryDefaults.get(product.id);
    if(defaults) for(const [id,value] of Object.entries(defaults)) field(id).value=value;
    markFieldsSaved(form);
    const draft=entryDrafts.get(product.id);
    if(draft) for(const id of fields) field(id).value=draft[id];
  }
  const onEdit=()=>{
    if(host){
      if(hasDirtyFields(host)) entryDrafts.set(product.id,Object.fromEntries(fields.map(id=>[id,field(id).value])));
      else entryDrafts.delete(product.id);
      syncDraftMarker();
    }
    updatePreview();
  };
  for(const id of fields){
    field(id).addEventListener('input',onEdit);
    field(id).addEventListener('change',onEdit);
  }
  updatePreview();
  function finish(){
    entryDrafts.delete(product.id);
    pendingSetChecks.delete(product.id);
    syncDraftMarker();
    if(!host){closeModal();return;}
    entryDefaults.set(product.id,Object.fromEntries(['m_date','m_expiry','m_staff'].map(id=>[id,field(id).value])));
    field('m_qty').value='';
    markFieldsSaved(host);
    updatePreview();
  }
  const save=field('btnSaveIncoming');
  let submitting=false;
  save.addEventListener('click',async()=>{
    if(submitting||!current()||sampleSetServerFlow?.dispatched) return;
    const date=field('m_date').value,expiry=field('m_expiry').value;
    const qty=parsePositiveWholeQty(field('m_qty').value),staff=field('m_staff').value;
    const workspace=host?.closest('.frozen-workspace');
    submitting=true;
    save.disabled=true;
    if(workspace){workspace.inert=true;workspace.dataset.entrySaving='true';}
    try{
      await runPageCommand(frozenProductResource,async command=>{
        if(!current()) return;
        if (!date) { alert('날짜를 입력해주세요.'); return; }
        if (date > today) { alert('미래 날짜는 입력할 수 없습니다.'); return; }
        if (!expiry) { alert('유통기한을 입력해주세요.'); return; }
        if (expiry < date) { alert('유통기한이 입고일보다 빠릅니다.'); return; }
        if (!Number.isSafeInteger(qty) || qty <= 0) { alert('봉지수는 1봉 이상의 안전한 정수로 입력해주세요.'); return; }
        if (!staff) { alert('담당자는 필수입니다.'); return; }
        if (await blockIfClosed(date, command)) return;

        if(sampleSetServerFlow){
          try{
            await sampleSetServerFlow.submit({date,expiry,quantity:qty,employeeId:staff,command});
            if(!command.isCurrent()) return;
            finish();
            showStatus('샘플세트 입고 완료!');
          }catch(error){
            if(!current()) return;
            alert(staffError(error));
            if(sampleSetServerFlow.dispatched){
              if(host) pendingSetChecks.set(product.id,sampleSetServerFlow);
              if(host) mountSetResultCheck(host,product,sampleSetServerFlow);
              else{
                const inspect=document.createElement('button');
                inspect.className='btn-secondary';
                inspect.textContent='원래 작업 결과 확인';
                inspect.addEventListener('click',async()=>{
                  try{
                    const result=await sampleSetServerFlow.inspectResult();
                    if(result.confirmed&&command.isCurrent()){finish();await renderFrozenProduct({force:true});}
                    else alert('아직 결과를 확인하지 못했습니다. 자동 재전송하지 않습니다.');
                  }catch(e){alert(staffError(e));}
                });
                save.after(inspect);
              }
            }
          }
          return;
        }
        await commitFrozenReceipt(command,{product,date,expiry,qty,staff,components,getComponentName});
        if(!command.isCurrent()) return;
        finish();
        showStatus('입고 등록 완료!');
      },{roles:['admin','office','production']});
    }finally{
      submitting=false;
      if(workspace){workspace.inert=false;delete workspace.dataset.entrySaving;}
      if(form.isConnected&&current()&&(!host||host.contains(save))&&!sampleSetServerFlow?.dispatched){
        save.disabled=false;
        updatePreview();
      }
    }
  });
}

async function commitFrozenReceipt(command,{product,date,expiry,qty,staff,components,getComponentName}) {
  const {runTransaction}=commandWrites(command);
  const note='';
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
import {getPageContext,registerPageCleanup} from '../utils/pageLifecycle.js';
import {markFieldsSaved,hasDirtyFields} from '../utils/formDraft.js';
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
