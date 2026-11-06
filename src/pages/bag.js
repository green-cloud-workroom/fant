import {staffError} from '../utils/staffText.js';
import {movementNote} from '../utils/movementNote.js';
import {escapeHtml} from '../utils/html.js';
import {showStatus} from '../utils/statusToast.js';
import {movementLabel} from '../services/manualMovementLogic.js';
import {movementFields,bindMovementForm,readMovementForm} from '../utils/movementForm.js';
import {saveManualMovement} from '../services/manualMovements.js';
import { registerCloseModal } from '../utils/modalManager.js';
import { checkQuantityBeforeSave } from '../services/statsAutomationRuntime.js';
import { db } from '../firebase.js';
import {
  collection, getDocsFromServer as getDocs, doc, query, orderBy, limit, getDocFromServer as getDoc, where, writeBatch
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { currentUser, currentUserRole } from '../app.js';
import { recordActivity } from '../services/activityLogs.js';
import { showConfirmModal } from '../utils/modal.js';
import Sortable from '../utils/sortable.js';

import {pageResource} from '../state/pageResources.js';
import {withReadCommand} from '../services/readCommand.js';
import {pageRefresh} from '../utils/pageRefresh.js';
import {getPageContext} from '../utils/pageLifecycle.js';
const bagResource=pageResource('bag');
async function runBagCommand(callback,roles=['admin','office']) {
  const page=getPageContext();
  try{return await withReadCommand(bagResource,command=>{command.isCurrent=()=>!page||page.isCurrent();return callback(command);},{roles});}
  catch(error){console.error('[봉투 저장]',error);alert(staffError(error));}
}
async function saveBagStockChange(bag,patch,log,activity,date,selection) {
  return runBagCommand(async command=>{
    if(await blockIfClosed(date,command))return false;
    await saveManualMovement({db,command,name:'bagLogs',stockId:bag.id,log,selection,expectedBefore:Number(bag.currentQty||0),uid:currentUser?.uid||null});
    return true;
  },['admin','office','production']);
}

let bagTypes = [];

export async function renderBag({force=false}={}) {
  const content=document.getElementById('mainContent');
  const existing=content.querySelector('.bag-workspace');
  const previousModel=bagResource.model;
  if(!existing) content.innerHTML='<p class="list-empty">봉투 재고를 불러오는 중입니다.</p>';
  const data=await bagResource.load(loadInitialModel,{force,onChange:pageRefresh(bagResource,renderBag)});
  if(!data||!content.isConnected) return;
  if(!force&&existing?.isConnected&&existing.dataset.role===currentUserRole&&previousModel===bagResource.model) return;
  bagTypes=data.bags;
  staffCache=data.staff;
  await renderBagLayout();
}
async function loadBagTypes(scope={getDocs}) {
  const snap=await scope.getDocs(query(collection(db,'bagTypes'),orderBy('sortOrder')));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

let selectedBagId=null;
let bagCategory='all';
let bagManaging=false;
let detailRequest=0;

function visibleBags(filter=bagCategory) {
  return bagTypes.filter(bag=>filter==='inactive'?bag.active===false:
    bag.active!==false&&(filter==='all'||bag.category===filter));
}

function formatBagNumber(value) {
  const number=Number(value);
  return value!=null&&Number.isFinite(number)?number.toLocaleString('ko-KR'):String(value??'—');
}

function renderBagLayout({keepDetail=false}={}) {
  const content=document.getElementById('mainContent');
  const canManage=['admin','office'].includes(currentUserRole);
  const rows=visibleBags();
  const selected=rows.find(bag=>bag.id===selectedBagId)||rows[0];
  const previousDetail=keepDetail&&selected&&selected.id===selectedBagId?document.getElementById('bagDetail'):null;
  selectedBagId=selected?.id??null;
  const filters=[['all','전체'],['raw','생식'],['freezeDry','동결건조'],['inactive','비활성']];
  content.innerHTML=`
    <section class="bag-workspace" data-role="${escapeHtml(currentUserRole)}">
      <header class="bag-page-heading"><h2>봉투 재고</h2>
        ${canManage?`<button type="button" id="btnBagManage" class="btn-secondary" aria-pressed="${bagManaging}">${bagManaging?'관리 끝내기':'품목 관리'}</button>`:''}
      </header>
      <div class="bag-columns">
        <aside class="bag-catalog" aria-label="봉투 목록">
          <div class="bag-filters" role="group" aria-label="봉투 종류">
            ${filters.map(([key,label])=>`<button type="button" data-bag-filter="${key}" aria-pressed="${key===bagCategory}">${label} <b>${visibleBags(key).length}</b></button>`).join('')}
          </div>
          <div class="bag-catalog-heading"><strong>봉투명</strong><span>현재 재고 (장)</span></div>
          ${canManage&&bagManaging?'<div class="bag-manage-tools"><span>품목 관리</span><button type="button" class="btn-secondary" id="btnNewBag">+ 추가</button></div>':''}
          <div id="bagList">${renderBagList(rows)}</div>
        </aside>
        <section id="bagDetail" aria-label="선택 봉투 이력">
          ${selected?'':'<p class="list-empty">이 종류에 등록된 봉투가 없습니다.</p>'}
        </section>
      </div>
    </section>`;
  if(previousDetail) document.getElementById('bagDetail').replaceWith(previousDetail);
  for(const button of content.querySelectorAll('[data-bag-filter]')){
    button.addEventListener('click',()=>{
      if(bagCategory===button.dataset.bagFilter) return;
      bagCategory=button.dataset.bagFilter;
      const ready=renderBagLayout({keepDetail:true});
      content.querySelector('[data-bag-filter][aria-pressed="true"]').focus({preventScroll:true});
      return ready;
    });
  }
  document.getElementById('btnBagManage')?.addEventListener('click',()=>{
    bagManaging=!bagManaging;
    return renderBagLayout();
  });
  document.getElementById('btnNewBag')?.addEventListener('click',showNewBagModal);
  bindBagListEvents();
  if(canManage&&bagManaging) initBagSortables();
  if(selected&&!previousDetail) return showBagDetail(selected);
}

function renderBagList(rows) {
  if(!rows.length) return '<p class="list-empty">표시할 봉투가 없습니다.</p>';
  if(bagCategory==='inactive') return rows.map(renderBagItem).join('');
  return [['raw','생식','bagListRaw'],['freezeDry','동결건조','bagListFreezeDry']].map(([key,label,id])=>{
    const group=rows.filter(bag=>bag.category===key);
    if(!group.length) return '';
    return `<div class="bag-group-name">${label} <span>${group.length}</span></div>
      <div id="${id}" class="sortable-master-list" data-category="${key}">${group.map(renderBagItem).join('')}</div>`;
  }).join('');
}

function renderBagItem(bag) {
  const manage=bagManaging&&['admin','office'].includes(currentUserRole);
  const active=bag.active!==false;
  const selected=bag.id===selectedBagId;
  const low=Number(bag.currentQty)<Number(bag.minimumQty||0);
  return `<div class="recipe-list-item bag-row${selected?' active':''}" data-id="${escapeHtml(bag.id)}" data-category="${escapeHtml(bag.category)}">
    ${manage&&active?'<span class="drag-handle" aria-label="순서 변경" title="순서 변경">≡</span>':''}
    <button type="button" class="bag-pick" aria-pressed="${selected}">
      <span class="bag-item-name">${escapeHtml(bag.name)}</span>
      <strong class="bag-item-qty${low?' bag-low':''}" aria-label="현재 ${escapeHtml(formatBagNumber(bag.currentQty))}장">${escapeHtml(formatBagNumber(bag.currentQty))}</strong>
    </button>
    ${manage?`<label class="toggle-switch" title="${active?'활성':'비활성'}" onclick="event.stopPropagation()"><input type="checkbox" class="bag-active-toggle" aria-label="${escapeHtml(bag.name)} 활성" data-id="${escapeHtml(bag.id)}" ${active?'checked':''}><span class="toggle-slider"></span></label>`:''}
  </div>`;
}

function initBagSortables() {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') return;

  [
    ['bagListRaw', 'raw'],
    ['bagListFreezeDry', 'freezeDry'],
  ].forEach(([elementId, category]) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: async (evt) => {
        if (evt.oldIndex === evt.newIndex) return;
        await persistBagOrder(category);
      },
    });
  });
}

async function persistBagOrder(category) {return runBagCommand(command=>persistBagOrderWithCommand(category,command));}
async function persistBagOrderWithCommand(category,command) {
  const listEl = document.getElementById(category === 'raw' ? 'bagListRaw' : 'bagListFreezeDry');
  if (!listEl) return;

  const orderedIds = Array.from(listEl.querySelectorAll('.recipe-list-item'))
    .map(item => item.dataset.id)
    .filter(Boolean);
  const rawCount = bagTypes.filter(b => b.category === 'raw').length;
  const offset = category === 'freezeDry' ? rawCount : 0;
  const now = new Date();
  const batch = writeBatch(db);

  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'bagTypes', id), {
      sortOrder: offset + idx,
      updatedAt: now,
    });
  });

  try {
    await command.commit(batch,{targets:orderedIds.map(id=>doc(db,'bagTypes',id))});
    if(!command.isCurrent())return;
    const orderMap = new Map(orderedIds.map((id, idx) => [id, offset + idx]));
    bagTypes = bagTypes
      .map(b => orderMap.has(b.id) ? { ...b, sortOrder: orderMap.get(b.id), updatedAt: now } : b)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    await renderBag({force:true});
  } catch (err) {
    console.error('[bag] reorder save failed:', err);
    alert('순번 저장 실패: ' + (staffError(err) || err));
    const latest=await loadBagTypes();
    if(!command.isCurrent())return;
    bagTypes=latest;
    await renderBagLayout();
  }
}

function bindBagListEvents() {
const list=document.getElementById('bagList');
  for(const button of list.querySelectorAll('.bag-pick')){
    button.addEventListener('click',()=>{
      const item=button.closest('.bag-row');
      const bag=bagTypes.find(row=>row.id===item.dataset.id);
      if(!bag||selectedBagId===bag.id) return;
      selectedBagId=bag.id;
      for(const row of list.querySelectorAll('.bag-row')){
        const selected=row===item;
        row.classList.toggle('active',selected);
        row.querySelector('.bag-pick').setAttribute('aria-pressed',String(selected));
      }
      const ready=showBagDetail(bag);
      if(window.matchMedia?.('(max-width:700px)').matches) document.getElementById('bagDetail').scrollIntoView({block:'start'});
      return ready;
    });
  }

  document.querySelectorAll('.bag-active-toggle').forEach(cb => {
    cb.addEventListener('click', (e) => e.stopPropagation());
    cb.addEventListener('change', async (e) => {
      if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
        alert('봉투 종류 활성 변경은 대표/사무실 계정만 가능합니다.');
        e.target.checked = !e.target.checked;
        return;
      }
      const id = e.target.dataset.id;
      const active = e.target.checked;
      const target = bagTypes.find(b => b.id === id);
      const previousActive = target?.active !== false;
      try {
        await withReadCommand(bagResource,async command=>{
        const page=getPageContext(),batch=writeBatch(db);
        batch.update(doc(db, 'bagTypes', id), {
          active,
          updatedAt: new Date(),
        });
        if (previousActive !== active) {
          await recordActivity({
            action: 'bag',
            subAction: 'activeToggle',
            date: getToday(),
            staff: getRoleStaffLabel(),
            message: `봉투 종류 ${active ? '활성' : '비활성'} — ${target?.name || '봉투 품목명 확인 필요'}`,
            details: {
              bagTypeId: id,
              bagName: target?.name || null,
              active,
            },
          },{batch});
        }
        await command.commit(batch,{targets:[doc(db,'bagTypes',id)]});
        if (target) target.active = active;
        if(page&&!page.isCurrent())return;
        await renderBag({force:true});
        });
      } catch (err) {
        console.error('[bag] active save failed:', err);
        alert(staffError(err)||'활성 상태 저장 중 오류가 발생했습니다.');
        e.target.checked = !active;
      }
    });
  });
}

let bagHistoryIndexAvailable = true;
async function loadBagDetailLogs(bagTypeId, read=getDocs) {
  let snap;
  if (bagHistoryIndexAvailable) {
    try {
      snap=await read(query(collection(db, 'bagLogs'), where('bagTypeId','==',bagTypeId),
        orderBy('timestamp','desc'), limit(30)));
    } catch(error) {
      if (error.code !== 'failed-precondition') throw error;
      bagHistoryIndexAvailable=false;
    }
  }
  if (!snap) snap=await read(query(collection(db, 'bagLogs'), where('bagTypeId','==',bagTypeId)));
  const ms=v=>v?.toMillis?.()??(v?.seconds? v.seconds*1000:new Date(v).getTime()||0);
  return snap.docs.map(d=>({id:d.id,...d.data()})).filter(row=>row.timestamp !== undefined)
    .sort((a,b)=>ms(b.timestamp)-ms(a.timestamp)||b.id.localeCompare(a.id)).slice(0,30);
}

function bagMovementLabel(row) {
  const fallback={incoming:'입고',in:'입고',out:'사용',autoDeduct:'자동차감',autoDeductReverse:'자동차감 복원'};
  return movementLabel(row,fallback[row.type]||'수동조정');
}

function bagMovementSource(row) {
  const note=String(row.note||row.reason||'');
  if(row.type==='autoDeductReverse') return '생산 취소·복원';
  if(/^동결제품 입고/.test(note)||row.sampleSetLogId) return '동결제품 입고';
  if(/^내일생산불러오기/.test(note)||(row.type==='autoDeduct'&&row.executionId)) return '생산 불러오기';
  if(/입고예정|입고 예정/.test(note)) return '입고 예정';
  if(row.type==='incoming'||row.type==='in') return '봉투 입고';
  if(row.type==='adjust'||row.manualMovement) return '수동조정';
  return '경로 미기록';
}

function bagHistoryRow(log,logs) {
  const kind=bagMovementLabel(log);
  const amount=log.qty??log.delta;
  const numberClass=amount>0?'stock-quantity--increase':amount<0?'stock-quantity--decrease':'';
  const note=movementNote(log.note||log.reason||log.manualMovement?.reason||'—','bagLogs',logs,bagMovementLabel);
  const hasBalance=Number.isFinite(log.before)&&Number.isFinite(log.after);
  return `<tr>
    <td>${escapeHtml(log.date||'—')}</td>
    <td><span class="tag stock-movement-badge" data-movement-label="${escapeHtml(kind)}">${escapeHtml(kind)}</span></td>
    <td class="bag-history-qty ${numberClass}">${amount>0?'+':''}${escapeHtml(formatBagNumber(amount))}</td>
    <td>${escapeHtml(bagMovementSource(log))}</td><td>${escapeHtml(log.staffName||log.staff||'—')}</td>
    <td class="bag-note">${escapeHtml(note)}${hasBalance?`<details><summary>변경 전후</summary>${escapeHtml(formatBagNumber(log.before))}장 → ${escapeHtml(formatBagNumber(log.after))}장</details>`:''}</td>
  </tr>`;
}

function renderBagHistory(host,logs) {
  const labels=[...new Set(logs.map(bagMovementLabel))];
  host.innerHTML=`<div class="bag-history-heading"><h3>입출고·변동 이력</h3><span>최근 ${logs.length}건</span>
    <div class="bag-history-filters">
      <select aria-label="이력 구분"><option value="">전체 구분</option>${labels.map(label=>`<option value="${escapeHtml(label)}">${escapeHtml(label)}</option>`).join('')}</select>
      <input type="search" aria-label="비고·담당자·처리 경로 검색" placeholder="비고·담당자·경로 검색">
    </div></div>
    <table class="bag-history-table"><thead><tr><th>날짜</th><th>구분</th><th>증감 (장)</th><th>처리 경로</th><th>담당자</th><th>비고·사유</th></tr></thead><tbody></tbody></table>
    <div class="bag-paging"><span aria-live="polite"></span><button type="button" class="btn-secondary" data-prev>이전</button><button type="button" class="btn-secondary" data-next>다음</button></div>`;
  let page=0;
  const perPage=8;
  const select=host.querySelector('select'), input=host.querySelector('input');
  const prev=host.querySelector('[data-prev]'), next=host.querySelector('[data-next]');
  function update(){
    const search=input.value.trim().toLowerCase();
    const filtered=logs.filter(log=>{
      if(select.value&&bagMovementLabel(log)!==select.value) return false;
      if(!search) return true;
      const note=movementNote(log.note||log.reason||log.manualMovement?.reason||'','bagLogs',logs,bagMovementLabel);
      return `${note} ${log.staffName||log.staff||''} ${bagMovementSource(log)}`.toLowerCase().includes(search);
    });
    const start=page*perPage;
    const shown=filtered.slice(start,start+perPage);
    host.querySelector('tbody').innerHTML=shown.map(log=>bagHistoryRow(log,logs)).join('')||'<tr><td colspan="6">표시할 이력이 없습니다.</td></tr>';
    host.querySelector('.bag-paging span').textContent=filtered.length?`${start+1}–${start+shown.length} / ${filtered.length}건`:'0건';
    prev.disabled=page===0;
    next.disabled=start+shown.length>=filtered.length;
  }
  const filter=()=>{page=0;update();};
  select.addEventListener('change',filter);
  input.addEventListener('input',filter);
  prev.addEventListener('click',()=>{page--;update();});
  next.addEventListener('click',()=>{page++;update();});
  update();
}

async function showBagDetail(bag) {
  const detail=document.getElementById('bagDetail');
  if(!detail?.isConnected||selectedBagId!==bag.id) return;
  const request=++detailRequest;
  const current=Number(bag.currentQty??0),minimum=Number(bag.minimumQty??0),pieces=Number(bag.piecesPerBox);
  const status=current<=0?'empty':current<minimum?'low':'normal';
  const canManage=bagManaging&&['admin','office'].includes(currentUserRole);
  detail.innerHTML=`<div class="bag-selected-card">
    <div class="bag-selected-heading"><div><span class="bag-category">${bag.active===false?'비활성':bag.category==='raw'?'생식':'동결건조'}</span>
      <h3 class="detail-title">${escapeHtml(bag.name)}</h3></div><div class="bag-actions">
      ${canManage?'<button type="button" class="btn-secondary" id="btnEditBag">수정</button><button type="button" class="btn-danger" id="btnDeleteBag">삭제</button>':''}
      <button type="button" class="btn-secondary" id="btnAdjustBag">수동조정</button><button type="button" class="btn-primary" id="btnAddBagIncoming">+ 입고 등록</button>
    </div></div>
    <div class="detail-body bag-balance"><span>현재 재고 <b>${escapeHtml(formatBagNumber(bag.currentQty??0))}</b>장</span>
      <span class="egg-status egg-status--${status}">${status==='empty'?'0장':status==='low'?'부족':'정상'}</span>
      <span>${pieces>0?`환산 ${escapeHtml(formatBagNumber(Math.floor(current/pieces)))}박스분 + ${escapeHtml(formatBagNumber(current%pieces))}장`:'박스 환산 기준 없음'}</span>
      <span>1박스 ${escapeHtml(formatBagNumber(bag.piecesPerBox))}장 · 최소 ${escapeHtml(formatBagNumber(minimum))}장${minimum>0?` (기준 대비 ${current>=minimum?'+':''}${escapeHtml(formatBagNumber(current-minimum))}장)`:''}</span>
    </div></div><section class="bag-history"><p role="status">이력을 불러오는 중입니다.</p></section>`;
  detail.querySelector('#btnAddBagIncoming').addEventListener('click',()=>showBagIncomingModal(bag));
  detail.querySelector('#btnAdjustBag').addEventListener('click',()=>showBagAdjustModal(bag));
  detail.querySelector('#btnEditBag')?.addEventListener('click',()=>showEditBagModal(bag));
  detail.querySelector('#btnDeleteBag')?.addEventListener('click',()=>deleteBagType(bag));
  const history=detail.querySelector('.bag-history');
  try {
    const logs=await loadBagDetailLogs(bag.id);
    if(request===detailRequest&&history.isConnected&&selectedBagId===bag.id) renderBagHistory(history,logs);
  } catch(error) {
    if(request!==detailRequest||!history.isConnected||selectedBagId!==bag.id) return;
    console.error('[봉투 이력]',error);
    history.innerHTML='<p role="status">이력을 불러오지 못했습니다. <button type="button" class="btn-secondary">다시 불러오기</button></p>';
    history.querySelector('button').addEventListener('click',()=>showBagDetail(bag));
  }
}

async function loadBagDeleteContext(bag,scope={getDocs}) {
  const {getDocs}=scope;
  const [recipeSnap, frozenProductSnap, logSnap] = await Promise.all([
    getDocs(query(collection(db, 'recipes'), where('bagTypeId', '==', bag.id))),
    getDocs(query(collection(db, 'frozenProducts'), where('bagTypeId', '==', bag.id))),
    getDocs(query(collection(db, 'bagLogs'), where('bagTypeId', '==', bag.id))),
  ]);

  return {
    linkedRecipes: recipeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    linkedProducts: frozenProductSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    logDocs: logSnap.docs,
  };
}

function getBagDeleteMessage(bag, logCount) {
  const currentQty = Number(bag.currentQty || 0);
  if (currentQty > 0) {
    return `${bag.name} 재고 ${currentQty}장이 남아있습니다.\n봉투 재고 및 이력 ${logCount}건이 모두 삭제됩니다.\n진행하시겠습니까?`;
  }
  if (logCount > 0) {
    return `입고/조정 이력 ${logCount}건이 함께 삭제됩니다.\n진행하시겠습니까?`;
  }
  return `${bag.name} 봉투를 삭제하시겠습니까?`;
}

async function deleteBagType(bag) {return runBagCommand(command=>deleteBagTypeWithCommand(bag,command));}
async function deleteBagTypeWithCommand(bag,command) {
  if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
    alert('봉투 삭제는 대표/사무실 계정만 가능합니다.');
    return;
  }

  try {
    const { linkedRecipes, linkedProducts, logDocs } = await loadBagDeleteContext(bag,command);
    const linkedNames = [
      ...linkedRecipes.map(r => r.displayName || r.name || '레시피명 확인 필요'),
      ...linkedProducts.map(p => p.name || '제품명 확인 필요'),
    ];
    if (linkedNames.length > 0) {
      alert(`${linkedNames.join(', ')}에 연결되어 있어 삭제할 수 없습니다.\n연결을 먼저 해제해주세요.`);
      return;
    }

    const logCount = logDocs.length;
    const confirmed = await showConfirmModal({
      title: '봉투 삭제',
      message: getBagDeleteMessage(bag, logCount),
      confirmText: '삭제',
      danger: true,
    });
    if (!confirmed) return;

    if(logDocs.length>498)throw new Error('삭제할 이력이 너무 많습니다. 관리자에게 문의해주세요.');
    const batch = writeBatch(db);
    batch.delete(doc(db, 'bagTypes', bag.id));
    logDocs.forEach(logDoc => batch.delete(doc(db, 'bagLogs', logDoc.id)));

    await recordActivity({
      action: 'bag',
      subAction: 'delete',
      date: getToday(),
      staff: getRoleStaffLabel(),
      message: `봉투 삭제 — ${bag.name}`,
      details: {
        bagTypeId: bag.id,
        bagName: bag.name,
        bagType: bag.category === 'freezeDry' ? 'dried' : 'raw',
        currentQty: Number(bag.currentQty || 0),
        logCount,
      },
    },{batch});
    await command.commit(batch,{targets:[doc(db,'bagTypes',bag.id)]});
    if(!command.isCurrent())return;

    selectedBagId = null;
    await renderBag({force:true});
    alert('봉투가 삭제되었습니다.');
  } catch (err) {
    console.error('[bag] delete failed:', err);
    alert(staffError(err)||'봉투 삭제 중 오류가 발생했습니다.');
  }
}

function showNewBagModal() {
  showBagModal(null);
}

function showBagModal(bag) {
  const isNew = !bag;
  showModal(`
    <h3 class="modal-title">${isNew ? '봉투 추가' : '봉투 수정'}</h3>
    <div class="form-group">
      <label>봉투명 *</label>
      <input type="text" id="m_bagName" value="${escapeHtml(bag?.name || '')}" placeholder="봉투명 입력" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_bagCategory" ${!isNew ? 'disabled' : ''}>
          <option value="">선택</option>
          <option value="raw" ${bag?.category === 'raw' ? 'selected' : ''}>생식</option>
          <option value="freezeDry" ${bag?.category === 'freezeDry' ? 'selected' : ''}>동결건조</option>
        </select>
      </div>
      <div class="form-group">
        <label>박스당 장수</label>
        <input type="number" id="m_piecesPerBox" min="0" step="1" value="${escapeHtml(bag?.piecesPerBox || '')}" placeholder="장" />
      </div>
      <div class="form-group">
        <label>최소재고(박스)</label>
        <input type="number" id="m_minBox" min="0" step="1" value="${escapeHtml(bag?.minimumBoxQty || '')}" placeholder="박스" />
      </div>
    </div>
    <p id="m_bagMinimumPreview" class="text-muted" aria-live="polite"></p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBag">${isNew ? '추가' : '저장'}</button>
    </div>
  `);

  const readBoxValues = () => {
    const piecesPerBox = Number(document.getElementById('m_piecesPerBox').value);
    const minBox = Number(document.getElementById('m_minBox').value);
    if (![piecesPerBox, minBox, piecesPerBox * minBox].every(value => Number.isSafeInteger(value) && value >= 0)) {
      return {error: '박스당 장수와 최소재고는 0 이상의 정수로 입력해주세요.'};
    }
    if (minBox > 0 && piecesPerBox === 0) return {error: '최소재고를 환산하려면 박스당 장수를 입력해주세요.'};
    return {piecesPerBox, minBox};
  };
  const updateMinimumPreview = () => {
    const values = readBoxValues();
    document.getElementById('m_bagMinimumPreview').textContent = values.error ||
      `최소재고 ${values.minBox.toLocaleString()}박스 = ${(values.minBox * values.piecesPerBox).toLocaleString()}장${isNew ? '' : ' · 현재 재고와 입출고 이력은 바뀌지 않습니다.'}`;
  };
  for (const id of ['m_piecesPerBox', 'm_minBox']) document.getElementById(id).addEventListener('input', updateMinimumPreview);
  updateMinimumPreview();

  document.getElementById('btnSaveBag').addEventListener('click', () => runBagCommand(async command => {
    const batch=writeBatch(db);
    if (currentUserRole !== 'admin' && currentUserRole !== 'office') {
      alert('봉투 등록/수정은 대표/사무실 계정만 가능합니다.');
      return;
    }
    const name = document.getElementById('m_bagName').value.trim();
    const category = document.getElementById('m_bagCategory').value;
    const values = readBoxValues();
    if (values.error) { alert(values.error); return; }
    const {piecesPerBox, minBox} = values;

    if (!name || !category) { alert('봉투명과 종류는 필수입니다.'); return; }

    const data = {
      name,
      category,
      piecesPerBox,
      minimumBoxQty: minBox,
      minimumQty: minBox * piecesPerBox,
      sortOrder: isNew ? bagTypes.length : bag.sortOrder,
      active: isNew ? true : bag.active !== false,
      updatedAt: new Date(),
    };

    const target = isNew ? doc(collection(db, 'bagTypes')) : doc(db, 'bagTypes', bag.id);
    if (isNew) {
      data.currentQty = 0;
      data.createdAt = new Date();
      batch.set(target, data);
    } else {
      batch.update(target, data);
    }

    await command.commit(batch,{targets:[target]});
    if(!command.isCurrent())return;
    closeModal();
    await renderBag({force:true});
    alert(isNew ? '봉투 추가 완료!' : '수정 완료!');
  }));
}

function showEditBagModal(bag) {
  showBagModal(bag);
}

function showBagIncomingModal(bag) {
  showModal(`
    <h3 class="modal-title">봉투 입고 등록 — ${escapeHtml(bag.name)}</h3>
    ${movementFields({incoming:true,reasonField:false})}
    <div class="form-row">
      <div class="form-group">
        <label>수량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수 입력" />
      </div>
      <div class="form-group">
        <label>박스 환산</label>
        <span id="m_boxCalc" style="line-height:36px;font-size:12px;color:#888;">- 박스</span>
      </div>
    </div>
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['lead'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveBagIncoming">추가</button>
    </div>
  `);

  document.getElementById('m_qty').addEventListener('input', (e) => {
    const qty = parseInt(e.target.value) || 0;
    document.getElementById('m_boxCalc').textContent = `${Math.floor(qty / bag.piecesPerBox)}박스`;
  });

  const getMovement=bindMovementForm({db,name:'bagLogs',filter:{bagTypeId:bag.id},onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);document.getElementById('m_adjustType').value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_note')});
  document.getElementById('btnSaveBagIncoming').addEventListener('click', async () => {
    const page=getPageContext();
    const selection=readMovementForm(getMovement); if(!selection)return;
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value;

    if (!qty || !date) { alert('수량과 날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;
    if(page&&!page.isCurrent())return;

    const before = bag.currentQty || 0;
    const quantityReview = selection.kind==='test'?{approved:true}:await checkQuantityBeforeSave({ itemId: 'bagLogs:' + bag.id, name: bag.name,
      date, qty, unit: '장', stage: '봉투' }, () => !page || page.isCurrent());
    if (!quantityReview.approved || (page && !page.isCurrent())) return;
    const after = before + qty;

    const patch = {
      currentQty: after,
      updatedAt: new Date(),
    };

    const log = {
      date,
      timestamp: new Date(),
      bagTypeId: bag.id,
      bagNameSnapshot: bag.name,
      type: 'incoming',
      ...(quantityReview.review ? { statsQuantityReview: quantityReview.review } : {}),
      qty,
      before,
      after,
      staffName: staff,
      note,
    };

    // [묶음 5A] 사무 로그 발행 — 봉투 입고 (운영자가 메인 화면에서 변동 추적 가능하게)
    const activity = {
      action: 'bag',
      subAction: 'incoming',
      date,
      staff,
      message: `봉투 입고 — ${bag.name} +${qty}장 / 담당: ${staff}`,
      details: {
        bagTypeId: bag.id,
        bagName: bag.name,
        qty,
        before,
        after,
        note: note || null,
      },
    };

    if(!await saveBagStockChange(bag,patch,log,activity,date,selection))return;
    if(page&&!page.isCurrent())return;
    closeModal();
    await renderBag({force:true});
    showStatus('입고 등록 완료!');
  });
}

function showBagAdjustModal(bag) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정 — ${escapeHtml(bag.name)}</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${escapeHtml(bag.currentQty || 0)}장</p>
    ${movementFields({incoming:false,reasonField:false})}
    <div class="form-row">
      <div class="form-group">
        <label>조정 유형</label>
        <select id="m_adjustType">
          <option value="plus">+ 증가</option>
          <option value="minus">- 감소</option>
        </select>
      </div>
      <div class="form-group">
        <label>조정량(장) *</label>
        <input type="number" id="m_qty" placeholder="장수" />
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
        ${getStaffOptions(['lead', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);

  const getMovement=bindMovementForm({db,name:'bagLogs',filter:{bagTypeId:bag.id},onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);document.getElementById('m_adjustType').value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_reason')});
  document.getElementById('btnSaveAdjust').addEventListener('click', async () => {
    const page=getPageContext();
    const selection=readMovementForm(getMovement); if(!selection)return;
    const type = document.getElementById('m_adjustType').value;
    const qty = parseInt(document.getElementById('m_qty').value);
    const reason = selection.reason;
    const staff = document.getElementById('m_staff').value;

    if (!qty || !staff) { alert('조정량과 담당자는 필수입니다.'); return; }
    const today = getToday();
    if (await blockIfClosed(today)) return;

    const delta = type === 'plus' ? qty : -qty;
    const before = bag.currentQty || 0;
    const after = before + delta;

    // [음수 차단] 수동조정 결과가 음수면 차단. 마이너스 재고는 비현실적 + 후속 차감 검사 망가뜨림.
    if (after < 0 && selection.kind!=='test') {
      alert(`조정 후 잔량이 ${after}장이 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${before}장에서 최대 ${before}장까지만 감소 가능합니다.`);
      return;
    }

    const patch = {
      currentQty: after,
      updatedAt: new Date(),
    };

    const log = {
      date: getToday(),
      timestamp: new Date(),
      bagTypeId: bag.id,
      bagNameSnapshot: bag.name,
      type: 'adjust',
      qty: delta,
      before,
      after,
      staffName: staff,
      reason,
    };

    const sign = delta >= 0 ? '+' : '';
    const activity = {
      action: 'bag',
      subAction: 'adjust',
      date: today,
      staff,
      message: `봉투 수동조정 — ${bag.name} ${sign}${delta}장 / 사유: ${reason} / 담당: ${staff}`,
      details: {
        bagTypeId: bag.id,
        bagName: bag.name,
        delta,
        before,
        after,
        reason,
      },
    };

    if(!await saveBagStockChange(bag,patch,log,activity,today,selection))return;
    if(page&&!page.isCurrent())return;
    closeModal();
    await renderBag({force:true});
    showStatus('조정 완료!');
  });
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
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
  });
}

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '대표';
  if (currentUserRole === 'office') return '사무실';
  if (currentUserRole === 'production') return '생산실';
  return '시스템';
}

registerCloseModal('bag', function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
});

// Read-only model construction shared by activation and idle preparation.
async function loadInitialModel(scope) {
    const keys=['senior','lead','office'];
    const [bags,...groups]=await Promise.all([loadBagTypes(scope),...keys.map(key=>scope.getDoc(doc(db,'staffGroups',key)))]);
    return {bags,staff:Object.fromEntries(keys.map((key,i)=>[key,groups[i].exists()?groups[i].data().members||[]:[]]))};
}
export function preparePage({cacheOnly=true}={}) { return bagResource.prepare?.('default',loadInitialModel,{cacheOnly}); }
