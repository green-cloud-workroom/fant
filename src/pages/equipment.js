import {recordActivity as commandBatchActivity} from '../services/activityLogs.js';
// 설비 부품 페이지
// 왼쪽: 기계 목록(종류별 묶음, 별칭으로 개별 기계 구분) / 오른쪽: 선택 기계의 부품 표 + 이력.
// 마스터(기계·부품) 추가/수정: admin·office. 교체/입고/조정 기록: production 포함 전 역할.
// 봉투 재고(bag.js) 패턴을 따름.

import { db } from '../firebase.js';
import {
  collection, getDocsFromServer as getDocs, doc, getDocFromServer as getDoc, query, where, orderBy,
} from 'firebase/firestore';
import Sortable from '../utils/sortable.js';
import { getTodayKST as getToday } from '../utils/date.js';
import { currentUserRole } from '../app.js';
import {pageResource} from '../state/pageResources.js';
import {withReadCommand} from '../services/readCommand.js';
import {commandBatch} from '../services/commandBatch.js';
import {pageRefresh} from '../utils/pageRefresh.js';
import {getPageContext} from '../utils/pageLifecycle.js';
const equipmentResource=pageResource('equipment');
async function runEquipmentCommand(callback,roles=['admin','office']) {
  const page=getPageContext();
  try{return await withReadCommand(equipmentResource,command=>{command.isCurrent=()=>!page||page.isCurrent();return callback(command);},{roles});}
  catch(error){console.error('[설비 저장]',error);alert(error.message);}
}
import { showConfirmModal } from '../utils/modal.js';
import {
  loadEquipments, loadEquipmentParts, addCycleToDate, formatCycle, getPartStatus, formatDday,
  collectPartAlerts, machineLabel, partLabel, CYCLE_UNIT_LABEL,
} from '../services/equipmentParts.js';

const ALL_ID = '__all__';

let equipments = [];
let parts = [];
let selectedEquipmentId = ALL_ID;
let selectedPartId = null;
let filterDueOnly = false;
let filterLowOnly = false;
let sortables = [];

// ─── 진입 ─────────────────────────────────────────────────────────

export async function renderEquipment(options={}) {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>설비 부품 로딩 중...</p></div>`;
  await reloadAll(options);
  if (document.getElementById('mainContent') !== content) return;
  renderLayout();
}

async function loadEquipmentRows(scope={getDocs}) {
  const snap=await scope.getDocs(query(collection(db,'equipments'),orderBy('sortOrder')));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}
async function reloadAll({force=false}={}) {
  const host=document.getElementById('mainContent');
  const result=await equipmentResource.load(async scope=>{
    const keys=['senior','lead','office'];
    const [equipment,parts,...groups]=await Promise.all([loadEquipmentRows(scope),loadEquipmentParts(scope),...keys.map(key=>scope.getDoc(doc(db,'staffGroups',key)))]);
    return {equipment,parts,staff:Object.fromEntries(keys.map((key,i)=>[key,groups[i].exists()?groups[i].data().members||[]:[]]))};
  },{force,onChange:pageRefresh(equipmentResource,renderEquipment)});
  if(!result||document.getElementById('mainContent')!==host)return;
  equipments=result.equipment;parts=result.parts;staffCache=result.staff;
}

function canManage() {
  return currentUserRole === 'admin' || currentUserRole === 'office';
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── 레이아웃 ─────────────────────────────────────────────────────

function renderLayout() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `
    <div class="recipe-wrap">
      <div class="recipe-list-panel">
        <div class="panel-header">
          <span class="panel-title">기계 목록</span>
          <div style="display:flex;gap:6px;">
            ${canManage() ? '<button class="btn-secondary" id="btnCategoryManage" title="종류 이름 변경">⚙</button>' : ''}
            ${canManage() ? '<button class="btn-primary" id="btnNewEquipment">+ 기계</button>' : ''}
          </div>
        </div>
        <div class="recipe-list" id="equipmentList">${renderEquipmentList()}</div>
      </div>
      <div class="recipe-detail-panel" id="equipmentDetail"></div>
    </div>
  `;
  bindListEvents();
  initSortables();
  document.getElementById('btnNewEquipment')?.addEventListener('click', () => showEquipmentModal(null));
  document.getElementById('btnCategoryManage')?.addEventListener('click', showCategoryManageModal);
  renderDetail();
}

function refreshList() {
  const list = document.getElementById('equipmentList');
  if (!list) return;
  list.innerHTML = renderEquipmentList();
  bindListEvents();
  initSortables();
}

// ─── 왼쪽: 기계 목록 ──────────────────────────────────────────────

function categoriesInOrder(list) {
  const seen = [];
  list.forEach(e => { if (!seen.includes(e.category)) seen.push(e.category); });
  return seen;
}

function machineSummary(equipmentId) {
  const today = getToday();
  let worst = null;
  let lowCount = 0;
  parts.filter(p => p.equipmentId === equipmentId && p.active !== false).forEach(p => {
    const s = getPartStatus(p, today);
    if (s.dday !== null && (worst === null || s.dday < worst)) worst = s.dday;
    if (s.low) lowCount += 1;
  });
  return { worst, lowCount };
}

function ddayPill(dday) {
  if (dday === null || dday === undefined) return '<span class="eq-pill eq-pill-gray">-</span>';
  const cls = dday < 0 ? 'eq-pill-red' : dday <= 7 ? 'eq-pill-amber' : 'eq-pill-gray';
  return `<span class="eq-pill ${cls}">${formatDday(dday)}</span>`;
}

function renderEquipmentList() {
  const alerts = collectPartAlerts(parts);
  let html = `
    <div class="recipe-list-item eq-all-item ${selectedEquipmentId === ALL_ID ? 'active' : ''}" data-id="${ALL_ID}">
      <div class="recipe-list-info" style="padding-left:8px;">
        <span class="recipe-name" style="color:${alerts.length ? '#b91c1c' : '#555'}">⚠ 전체 임박·부족</span>
      </div>
      <span class="eq-pill ${alerts.length ? 'eq-pill-red' : 'eq-pill-gray'}">${alerts.length}</span>
    </div>
  `;

  if (equipments.length === 0) {
    html += '<div class="list-empty">등록된 기계 없음</div>';
    return html;
  }

  const active = equipments.filter(e => e.active !== false);
  const inactive = equipments.filter(e => e.active === false);

  categoriesInOrder(active).forEach(cat => {
    const items = active.filter(e => e.category === cat);
    html += `<div class="list-group-label">${esc(cat)}</div>`;
    html += `<div class="sortable-master-list eq-sortable" data-category="${esc(cat)}">${items.map(renderEquipmentItem).join('')}</div>`;
  });

  if (inactive.length > 0) {
    html += `<div class="list-group-label list-group-label--inactive">비활성</div>`;
    html += `<div class="master-inactive-list">${inactive.map(renderEquipmentItem).join('')}</div>`;
  }
  return html;
}

function renderEquipmentItem(e) {
  const inactive = e.active === false;
  const { worst, lowCount } = machineSummary(e.id);
  const isActive = selectedEquipmentId === e.id;
  return `
    <div class="recipe-list-item ${isActive ? 'active' : ''} ${inactive ? 'inactive-master' : ''}" data-id="${e.id}">
      ${canManage() && !inactive ? '<span class="drag-handle" title="순서 변경" aria-label="순서 변경">≡</span>' : '<span style="width:8px;display:inline-block;"></span>'}
      <div class="recipe-list-info">
        <span class="recipe-name" style="color:${inactive ? '#999' : '#1a1a1a'}">${esc(e.alias)}</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;margin-right:6px;">
        ${inactive ? '' : ddayPill(worst)}
        ${lowCount > 0 && !inactive ? `<span class="eq-pill eq-pill-amber">부족 ${lowCount}</span>` : ''}
      </div>
    </div>
  `;
}

function bindListEvents() {
  document.querySelectorAll('#equipmentList .recipe-list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.drag-handle')) return;
      selectedEquipmentId = item.dataset.id;
      selectedPartId = null;
      document.querySelectorAll('#equipmentList .recipe-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      renderDetail();
    });
  });
}

function initSortables() {
  sortables.forEach(s => s.destroy());
  sortables = [];
  if (!canManage()) return;
  document.querySelectorAll('#equipmentList .eq-sortable').forEach(el => {
    sortables.push(Sortable.create(el, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: async (evt) => {
        if (evt.oldIndex === evt.newIndex) return;
        await persistEquipmentOrder();
      },
    }));
  });
}

// 종류별 DOM 순서를 그대로 이어붙여 전체 sortOrder 재부여
async function persistEquipmentOrder() {return runEquipmentCommand(command=>persistEquipmentOrderWithCommand(command));}
async function persistEquipmentOrderWithCommand(command) {
  const staged=commandBatch(command,db),{batch,recordActivity}=staged;
  const {getDocs}=command;
  const orderedIds = Array.from(document.querySelectorAll('#equipmentList .eq-sortable .recipe-list-item'))
    .map(el => el.dataset.id).filter(Boolean);
  const now = new Date();

  orderedIds.forEach((id, idx) => batch.update(doc(db, 'equipments', id), { sortOrder: idx, updatedAt: now }));
  try {
    await staged.commit();
    if(!command.isCurrent())return;
    const orderMap = new Map(orderedIds.map((id, idx) => [id, idx]));
    equipments = equipments
      .map(e => orderMap.has(e.id) ? { ...e, sortOrder: orderMap.get(e.id) } : e)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    await reloadAll({force:true});
  } catch (err) {
    console.error('[equipment] reorder save failed:', err);
    alert('순번 저장 실패: ' + (err.message || err));
    const latest=await loadEquipmentRows();
    if(!command.isCurrent())return;
    equipments=latest;
    refreshList();
  }
}

// ─── 오른쪽: 상세 ─────────────────────────────────────────────────

function renderDetail() {
  const detail = document.getElementById('equipmentDetail');
  if (!detail) return;
  if (selectedEquipmentId === ALL_ID) {
    renderAllAlertsDetail(detail);
    return;
  }
  const eq = equipments.find(e => e.id === selectedEquipmentId);
  if (!eq) {
    detail.innerHTML = '<div class="detail-empty">기계를 선택해주세요</div>';
    return;
  }
  renderMachineDetail(detail, eq);
}

function sortByUrgency(list) {
  const today = getToday();
  return [...list].sort((a, b) => {
    const da = getPartStatus(a, today).dday ?? 99999;
    const db_ = getPartStatus(b, today).dday ?? 99999;
    if (da !== db_) return da - db_;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function renderPartRow(p, { showMachine = false } = {}) {
  const s = getPartStatus(p);
  const inactive = p.active === false;
  const rowBg = s.overdue ? 'background:#fef2f2;' : s.dueSoon ? 'background:#fffbeb;' : '';
  const stockColor = s.low ? '#e53e3e' : '#1a1a1a';
  const canAct = !inactive;
  return `
    <tr class="eq-part-row ${selectedPartId === p.id ? 'eq-part-row-selected' : ''} ${inactive ? 'inactive-master' : ''}" data-part-id="${p.id}" style="${rowBg}cursor:pointer;">
      ${showMachine ? `<td>${esc(machineLabel(p.equipmentCategory, p.equipmentAlias))}</td>` : ''}
      <td style="font-weight:500;">${esc(p.name)}${inactive ? ' <span class="tag tag-inactive">비활성</span>' : ''}</td>
      <td style="color:#666;">${esc(p.spec || '-')}</td>
      <td>${formatCycle(p)}</td>
      <td>${p.lastReplacedAt || '-'}</td>
      <td>${p.nextDueAt || '-'}</td>
      <td>${ddayPill(s.dday)}</td>
      <td style="color:${stockColor};${s.low ? 'font-weight:600;' : ''}">${Number(p.currentQty || 0)} / ${Number(p.minimumQty || 0)}</td>
      <td style="white-space:nowrap;">
        ${canAct ? `
          <button class="eq-act" data-act="replace" data-part-id="${p.id}">교체</button>
          <button class="eq-act" data-act="in" data-part-id="${p.id}">입고</button>
          <button class="eq-act" data-act="adjust" data-part-id="${p.id}">조정</button>
        ` : ''}
        ${canManage() ? `<button class="eq-act" data-act="edit" data-part-id="${p.id}" title="부품 수정">✎</button>` : ''}
      </td>
    </tr>
  `;
}

function partTableHead(showMachine) {
  return `
    <thead>
      <tr>
        ${showMachine ? '<th>기계</th>' : ''}
        <th>부품</th><th>규격</th><th>주기</th><th>마지막 교체</th><th>다음 예정</th><th>D-day</th><th>재고 / 최소</th><th></th>
      </tr>
    </thead>
  `;
}

function renderMachineDetail(detail, eq) {
  const today = getToday();
  let list = parts.filter(p => p.equipmentId === eq.id);
  const totalCount = list.length;
  if (filterDueOnly) list = list.filter(p => { const s = getPartStatus(p, today); return s.overdue || s.dueSoon; });
  if (filterLowOnly) list = list.filter(p => getPartStatus(p, today).low);
  list = sortByUrgency(list);
  const inactive = eq.active === false;

  detail.innerHTML = `
    <div class="detail-header">
      <div>
        <span class="detail-title">${esc(eq.alias)}</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">${esc(eq.category)} · 부품 ${totalCount}개${inactive ? ' · 비활성' : ''}</span>
      </div>
      <div class="detail-actions">
        <button class="btn-secondary eq-filter ${filterDueOnly ? 'eq-filter-on' : ''}" id="btnFilterDue">임박만</button>
        <button class="btn-secondary eq-filter ${filterLowOnly ? 'eq-filter-on' : ''}" id="btnFilterLow">부족만</button>
        ${canManage() ? '<button class="btn-secondary" id="btnEditEquipment">기계 수정</button>' : ''}
        ${canManage() && !inactive ? '<button class="btn-primary" id="btnNewPart">+ 부품 추가</button>' : ''}
      </div>
    </div>
    <div class="detail-body">
      ${eq.memo ? `<p style="font-size:12px;color:#666;margin:0 0 12px;">${esc(eq.memo)}</p>` : ''}
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${partTableHead(false)}
            <tbody>
              ${list.length === 0
                ? `<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px;">${totalCount === 0 ? '등록된 부품 없음' : '조건에 맞는 부품 없음'}</td></tr>`
                : list.map(p => renderPartRow(p)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `;

  document.getElementById('btnFilterDue').addEventListener('click', () => { filterDueOnly = !filterDueOnly; renderDetail(); });
  document.getElementById('btnFilterLow').addEventListener('click', () => { filterLowOnly = !filterLowOnly; renderDetail(); });
  document.getElementById('btnEditEquipment')?.addEventListener('click', () => showEquipmentModal(eq));
  document.getElementById('btnNewPart')?.addEventListener('click', () => showPartModal(null, eq));
  bindPartRowEvents();
  if (selectedPartId) renderPartHistory();
}

function renderAllAlertsDetail(detail) {
  const alerts = collectPartAlerts(parts);
  const seen = new Set();
  const list = [];
  alerts.forEach(a => { if (!seen.has(a.part.id)) { seen.add(a.part.id); list.push(a.part); } });

  detail.innerHTML = `
    <div class="detail-header">
      <div>
        <span class="detail-title">전체 임박·부족</span>
        <span style="font-size:12px;color:#888;margin-left:8px;">교체 D-7 이내·지남 또는 재고 부족 부품 ${list.length}개</span>
      </div>
    </div>
    <div class="detail-body">
      <div class="form-section" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table eq-table">
            ${partTableHead(true)}
            <tbody>
              ${list.length === 0
                ? '<tr><td colspan="9" style="text-align:center;color:#aaa;padding:20px;">확인할 부품 없음</td></tr>'
                : list.map(p => renderPartRow(p, { showMachine: true })).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div id="partHistory"></div>
    </div>
  `;
  bindPartRowEvents();
  if (selectedPartId) renderPartHistory();
}

function bindPartRowEvents() {
  document.querySelectorAll('.eq-part-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.eq-act')) return;
      selectedPartId = selectedPartId === row.dataset.partId ? null : row.dataset.partId;
      document.querySelectorAll('.eq-part-row').forEach(r => r.classList.toggle('eq-part-row-selected', r.dataset.partId === selectedPartId));
      renderPartHistory();
    });
  });
  document.querySelectorAll('.eq-act').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const part = parts.find(p => p.id === btn.dataset.partId);
      if (!part) return;
      const act = btn.dataset.act;
      if (act === 'replace') showReplaceModal(part);
      else if (act === 'in') showIncomingModal(part);
      else if (act === 'adjust') showAdjustModal(part);
      else if (act === 'edit') showPartModal(part, equipments.find(eq => eq.id === part.equipmentId));
    });
  });
}

// ─── 부품 이력 ────────────────────────────────────────────────────

const TYPE_LABEL = { replace: '교체', in: '입고', adjust: '조정' };

async function renderPartHistory() {
  const box = document.getElementById('partHistory');
  if (!box) return;
  const part = parts.find(p => p.id === selectedPartId);
  if (!part) { box.innerHTML = ''; return; }

  box.innerHTML = '<p style="font-size:12px;color:#888;padding:8px 0;">이력 로딩 중...</p>';
  let logs = [];
  try {
    const snap = await getDocs(query(collection(db, 'equipmentPartLogs'), where('partId', '==', part.id)));
    logs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
      .slice(0, 50);
  } catch (err) {
    console.error('[equipment] history load failed:', err);
  }
  if (document.getElementById('partHistory') !== box || selectedPartId !== part.id) return;

  box.innerHTML = `
    <div class="form-section">
      <div class="section-header">
        <span class="section-title">${esc(partLabel(part))} · 이력</span>
        ${part.memo ? `<span style="font-size:12px;color:#888;">${esc(part.memo)}</span>` : ''}
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>날짜</th><th>구분</th><th>수량</th><th>전→후</th><th>담당자</th><th>비고</th></tr></thead>
          <tbody>
            ${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:16px;">이력 없음</td></tr>' :
              logs.map(l => `
                <tr>
                  <td>${l.date || '-'}</td>
                  <td><span class="tag ${l.type === 'in' ? 'tag-raw' : l.type === 'replace' ? 'tag-freezeDry' : 'tag-cat'}">${TYPE_LABEL[l.type] || l.type}</span></td>
                  <td style="color:${l.qty > 0 ? '#2d7a3a' : l.qty < 0 ? '#e53e3e' : '#666'}">${l.qty > 0 ? '+' : ''}${l.qty ?? 0}</td>
                  <td style="color:#888;">${l.before ?? '-'} → ${l.after ?? '-'}</td>
                  <td>${esc(l.staffName || '-')}</td>
                  <td>${esc(l.note || '-')}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── 기계 추가/수정 ───────────────────────────────────────────────

function showEquipmentModal(eq) {
  if (!canManage()) return;
  const isNew = !eq;
  const categories = categoriesInOrder(equipments);
  const copyCandidates = equipments.filter(e => e.active !== false);

  showModal(`
    <h3 class="modal-title">${isNew ? '기계 추가' : '기계 수정'}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>종류 *</label>
        <select id="m_category">
          ${categories.map(c => `<option value="${esc(c)}" ${eq?.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
          <option value="__new__">+ 새 종류</option>
        </select>
      </div>
      <div class="form-group" id="m_newCategoryWrap" style="display:${categories.length === 0 ? 'block' : 'none'};">
        <label>새 종류 이름</label>
        <input type="text" id="m_newCategory" placeholder="예: 민서기" />
      </div>
    </div>
    <div class="form-group">
      <label>별칭 *</label>
      <input type="text" id="m_alias" value="${esc(eq?.alias || '')}" placeholder="예: 민서기 1호" />
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_memo" value="${esc(eq?.memo || '')}" placeholder="위치, 모델명 등" />
    </div>
    ${isNew && copyCandidates.length > 0 ? `
      <div class="form-group">
        <label>다른 기계 부품 구성 복사</label>
        <select id="m_copyFrom">
          <option value="">복사 안 함</option>
          ${copyCandidates.map(e => `<option value="${e.id}">${esc(machineLabel(e.category, e.alias))}</option>`).join('')}
        </select>
        <p style="font-size:11px;color:#888;margin:4px 0 0;">부품명·규격·주기·최소재고만 복사. 재고 0, 교체일 없음으로 생성.</p>
      </div>
    ` : ''}
    ${!isNew ? `
      <div class="form-group">
        <label><input type="checkbox" id="m_active" ${eq.active !== false ? 'checked' : ''} /> 활성</label>
      </div>
    ` : ''}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn-danger" id="btnDeleteEquipment" style="margin-right:auto;">삭제</button>' : ''}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveEquipment">${isNew ? '추가' : '저장'}</button>
    </div>
  `);

  const catSel = document.getElementById('m_category');
  const newWrap = document.getElementById('m_newCategoryWrap');
  if (categories.length === 0) catSel.value = '__new__';
  catSel.addEventListener('change', () => { newWrap.style.display = catSel.value === '__new__' ? 'block' : 'none'; });
  document.getElementById('btnModalCancel').addEventListener('click', closeModal);
  document.getElementById('btnDeleteEquipment')?.addEventListener('click', () => deleteEquipment(eq));

  document.getElementById('btnSaveEquipment').addEventListener('click', () => runEquipmentCommand(async command => {
    const staged=commandBatch(command,db),{batch,addDoc,updateDoc,recordActivity}=staged;
    let category = catSel.value;
    if (category === '__new__') category = document.getElementById('m_newCategory').value.trim();
    const alias = document.getElementById('m_alias').value.trim();
    const memo = document.getElementById('m_memo').value.trim();
    if (!category || !alias) { alert('종류와 별칭은 필수입니다.'); return; }
    const dup = equipments.find(e => e.id !== eq?.id && e.category === category && e.alias === alias);
    if (dup) { alert('같은 종류에 같은 별칭의 기계가 이미 있습니다.'); return; }

    let nextEquipmentId=selectedEquipmentId;
    const now = new Date();
    try {
      if (isNew) {
        const ref = await addDoc(collection(db, 'equipments'), {
          category, alias, memo, active: true, sortOrder: equipments.length, createdAt: now, updatedAt: now,
        });
        const copyFromId = document.getElementById('m_copyFrom')?.value || '';
        if (copyFromId) await copyPartsFrom(copyFromId, { id: ref.id, category, alias },batch);
        await recordActivity({
          action: 'equipment', subAction: 'create', date: getToday(), staff: getRoleStaffLabel(),
          message: `기계 추가 — ${machineLabel(category, alias)}`,
          details: { equipmentId: ref.id, category, alias, copiedFrom: copyFromId || null },
        });
        nextEquipmentId = ref.id;
      } else {
        const active = document.getElementById('m_active').checked;
        await updateDoc(doc(db, 'equipments', eq.id), { category, alias, memo, active, updatedAt: now });
        // 부품 스냅샷 동기화 (종류/별칭 변경 시)
        if (category !== eq.category || alias !== eq.alias) {

          parts.filter(p => p.equipmentId === eq.id).forEach(p => {
            batch.update(doc(db, 'equipmentParts', p.id), { equipmentCategory: category, equipmentAlias: alias, updatedAt: now });
          });

        }
        await recordActivity({
          action: 'equipment', subAction: 'update', date: getToday(), staff: getRoleStaffLabel(),
          message: `기계 수정 — ${machineLabel(category, alias)}${active ? '' : ' (비활성)'}`,
          details: { equipmentId: eq.id, category, alias, active },
        });
      }
      await staged.commit();
      if(!command.isCurrent())return;
      selectedEquipmentId=nextEquipmentId;
      closeModal();
      await reloadAll({force:true});
      if(!command.isCurrent())return;
      renderLayout();
    } catch (err) {
      console.error('[equipment] save failed:', err);
      alert('저장 중 오류가 발생했습니다: ' + (err.message || err));
    }
  }));
}

async function copyPartsFrom(sourceEquipmentId, target, batch) {
  const source = parts.filter(p => p.equipmentId === sourceEquipmentId && p.active !== false);
  if (source.length === 0) return;
  const now = new Date();
  source.forEach((p, idx) => {
    const ref = doc(collection(db, 'equipmentParts'));
    batch.set(ref, {
      equipmentId: target.id,
      equipmentCategory: target.category,
      equipmentAlias: target.alias,
      name: p.name,
      spec: p.spec || '',
      cycleValue: p.cycleValue || 0,
      cycleUnit: p.cycleUnit || 'day',
      lastReplacedAt: null,
      nextDueAt: null,
      currentQty: 0,
      minimumQty: p.minimumQty || 0,
      memo: '',
      active: true,
      sortOrder: idx,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function deleteEquipment(eq) {return runEquipmentCommand(command=>deleteEquipmentWithCommand(eq,command));}
async function deleteEquipmentWithCommand(eq,command) {
  const staged=commandBatch(command,db),{batch,recordActivity}=staged;
  const {getDocs}=command;
  if (!canManage()) return;
  const linked = parts.filter(p => p.equipmentId === eq.id);
  if (linked.length > 0) {
    alert(`부품 ${linked.length}개가 등록되어 있어 삭제할 수 없습니다.\n부품을 먼저 삭제하거나 기계를 비활성으로 바꿔주세요.`);
    return;
  }
  const ok = await showConfirmModal({ title: '기계 삭제', message: `${machineLabel(eq.category, eq.alias)}을(를) 삭제하시겠습니까?`, confirmText: '삭제', danger: true });
  if (!ok) return;
  try {

    batch.delete(doc(db, 'equipments', eq.id));
    await recordActivity({
      action: 'equipment', subAction: 'delete', date: getToday(), staff: getRoleStaffLabel(),
      message: `기계 삭제 — ${machineLabel(eq.category, eq.alias)}`,
      details: { equipmentId: eq.id, category: eq.category, alias: eq.alias },
    });
    await staged.commit();
    if(!command.isCurrent())return;
    closeModal();
    selectedEquipmentId = ALL_ID;
    await reloadAll({force:true});
    if(!command.isCurrent())return;
    renderLayout();
  } catch (err) {
    console.error('[equipment] delete failed:', err);
    alert(err.message||'삭제 중 오류가 발생했습니다.');
  }
}

// ─── 종류 이름 변경 ───────────────────────────────────────────────

function showCategoryManageModal() {
  if (!canManage()) return;
  const categories = categoriesInOrder(equipments);
  showModal(`
    <h3 class="modal-title">기계 종류 이름 변경</h3>
    ${categories.length === 0 ? '<p style="font-size:13px;color:#888;">등록된 종류가 없습니다.</p>' : categories.map((c, i) => `
      <div class="form-group">
        <label>${esc(c)} <span style="color:#aaa;font-weight:400;">(기계 ${equipments.filter(e => e.category === c).length}대)</span></label>
        <input type="text" class="m_catRename" data-index="${i}" data-original="${esc(c)}" value="${esc(c)}" />
      </div>
    `).join('')}
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveCategories">저장</button>
    </div>
  `);
  document.getElementById('btnModalCancel').addEventListener('click', closeModal);
  document.getElementById('btnSaveCategories').addEventListener('click', () => runEquipmentCommand(async command => {
    const staged=commandBatch(command,db),{batch,addDoc,updateDoc,recordActivity}=staged;
    const changes = [];
    document.querySelectorAll('.m_catRename').forEach(input => {
      const from = input.dataset.original;
      const to = input.value.trim();
      if (to && to !== from) changes.push({ from, to });
    });
    if (changes.length === 0) { closeModal(); return; }
    const now = new Date();
    try {

      changes.forEach(({ from, to }) => {
        equipments.filter(e => e.category === from).forEach(e => batch.update(doc(db, 'equipments', e.id), { category: to, updatedAt: now }));
        parts.filter(p => p.equipmentCategory === from).forEach(p => batch.update(doc(db, 'equipmentParts', p.id), { equipmentCategory: to, updatedAt: now }));
      });

      await recordActivity({
        action: 'equipment', subAction: 'renameCategory', date: getToday(), staff: getRoleStaffLabel(),
        message: `기계 종류 이름 변경 — ${changes.map(c => `${c.from}→${c.to}`).join(', ')}`,
        details: { changes },
      });
      await staged.commit();
      if(!command.isCurrent())return;
      closeModal();
      await reloadAll({force:true});
      if(!command.isCurrent())return;
      renderLayout();
    } catch (err) {
      console.error('[equipment] rename category failed:', err);
      alert(err.message||'저장 중 오류가 발생했습니다.');
    }
  }));
}

// ─── 부품 추가/수정 ───────────────────────────────────────────────

function showPartModal(part, eq) {
  if (!canManage() || !eq) return;
  const isNew = !part;
  showModal(`
    <h3 class="modal-title">${isNew ? '부품 추가' : '부품 수정'} — ${esc(machineLabel(eq.category, eq.alias))}</h3>
    <div class="form-row">
      <div class="form-group">
        <label>부품명 *</label>
        <input type="text" id="m_name" value="${esc(part?.name || '')}" placeholder="예: 날" />
      </div>
      <div class="form-group">
        <label>규격</label>
        <input type="text" id="m_spec" value="${esc(part?.spec || '')}" placeholder="예: Ø120" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>교체 주기 *</label>
        <div style="display:flex;gap:6px;">
          <input type="number" id="m_cycleValue" min="1" value="${part?.cycleValue || ''}" placeholder="숫자" style="flex:1;" />
          <select id="m_cycleUnit" style="width:90px;">
            ${Object.entries(CYCLE_UNIT_LABEL).map(([k, v]) => `<option value="${k}" ${(part?.cycleUnit || 'month') === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>마지막 교체일</label>
        <input type="date" id="m_lastReplacedAt" value="${part?.lastReplacedAt || ''}" />
      </div>
    </div>
    <div class="form-row">
      ${isNew ? `
        <div class="form-group">
          <label>현재 재고</label>
          <input type="number" id="m_currentQty" min="0" value="0" />
        </div>
      ` : ''}
      <div class="form-group">
        <label>최소 재고</label>
        <input type="number" id="m_minimumQty" min="0" value="${part?.minimumQty ?? 1}" />
      </div>
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_partMemo" value="${esc(part?.memo || '')}" placeholder="구매처, 단가 등" />
    </div>
    ${!isNew ? `
      <div class="form-group">
        <label><input type="checkbox" id="m_partActive" ${part.active !== false ? 'checked' : ''} /> 활성</label>
      </div>
    ` : ''}
    <div class="modal-actions">
      ${!isNew ? '<button class="btn-danger" id="btnDeletePart" style="margin-right:auto;">삭제</button>' : ''}
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSavePart">${isNew ? '추가' : '저장'}</button>
    </div>
  `);

  document.getElementById('btnModalCancel').addEventListener('click', closeModal);
  document.getElementById('btnDeletePart')?.addEventListener('click', () => deletePart(part));

  document.getElementById('btnSavePart').addEventListener('click', () => runEquipmentCommand(async command => {
    const staged=commandBatch(command,db),{batch,addDoc,updateDoc,recordActivity}=staged;
    const name = document.getElementById('m_name').value.trim();
    const spec = document.getElementById('m_spec').value.trim();
    const cycleValue = parseInt(document.getElementById('m_cycleValue').value) || 0;
    const cycleUnit = document.getElementById('m_cycleUnit').value;
    const lastReplacedAt = document.getElementById('m_lastReplacedAt').value || null;
    const minimumQty = Math.max(0, parseInt(document.getElementById('m_minimumQty').value) || 0);
    const memo = document.getElementById('m_partMemo').value.trim();
    if (!name) { alert('부품명은 필수입니다.'); return; }
    if (cycleValue <= 0) { alert('교체 주기를 입력해주세요.'); return; }

    const now = new Date();
    const data = {
      name, spec, cycleValue, cycleUnit, lastReplacedAt, minimumQty, memo,
      nextDueAt: addCycleToDate(lastReplacedAt, cycleValue, cycleUnit),
      updatedAt: now,
    };
    try {
      if (isNew) {
        const currentQty = Math.max(0, parseInt(document.getElementById('m_currentQty').value) || 0);
        const ref = await addDoc(collection(db, 'equipmentParts'), {
          ...data,
          equipmentId: eq.id,
          equipmentCategory: eq.category,
          equipmentAlias: eq.alias,
          currentQty,
          active: true,
          sortOrder: parts.filter(p => p.equipmentId === eq.id).length,
          createdAt: now,
        });
        await recordActivity({
          action: 'equipment', subAction: 'partCreate', date: getToday(), staff: getRoleStaffLabel(),
          message: `부품 추가 — ${machineLabel(eq.category, eq.alias)} · ${name} (재고 ${currentQty})`,
          details: { partId: ref.id, equipmentId: eq.id, name, cycleValue, cycleUnit, currentQty, minimumQty },
        });
      } else {
        data.active = document.getElementById('m_partActive').checked;
        await updateDoc(doc(db, 'equipmentParts', part.id), data);
        await recordActivity({
          action: 'equipment', subAction: 'partUpdate', date: getToday(), staff: getRoleStaffLabel(),
          message: `부품 수정 — ${machineLabel(eq.category, eq.alias)} · ${name}${data.active ? '' : ' (비활성)'}`,
          details: { partId: part.id, equipmentId: eq.id, name, cycleValue, cycleUnit, minimumQty, active: data.active },
        });
      }
      await staged.commit();
      if(!command.isCurrent())return;
      closeModal();
      await reloadAll({force:true});
      if(!command.isCurrent())return;
      refreshList();
      renderDetail();
    } catch (err) {
      console.error('[equipment] part save failed:', err);
      alert('저장 중 오류가 발생했습니다: ' + (err.message || err));
    }
  }));
}

async function deletePart(part) {return runEquipmentCommand(command=>deletePartWithCommand(part,command));}
async function deletePartWithCommand(part,command) {
  const staged=commandBatch(command,db),{batch,recordActivity}=staged;
  const {getDocs}=command;
  if (!canManage()) return;
  let logDocs = [];
  try {
    const snap = await getDocs(query(collection(db, 'equipmentPartLogs'), where('partId', '==', part.id)));
    logDocs = snap.docs;
  } catch (err) {
    throw err;
  }
  const ok = await showConfirmModal({
    title: '부품 삭제',
    message: `${partLabel(part)}을(를) 삭제하시겠습니까?${logDocs.length ? `\n이력 ${logDocs.length}건이 함께 삭제됩니다.` : ''}`,
    confirmText: '삭제',
    danger: true,
  });
  if (!ok) return;
  try {

    batch.delete(doc(db, 'equipmentParts', part.id));
    logDocs.forEach(d => batch.delete(doc(db, 'equipmentPartLogs', d.id)));
    await recordActivity({
      action: 'equipment', subAction: 'partDelete', date: getToday(), staff: getRoleStaffLabel(),
      message: `부품 삭제 — ${partLabel(part)}`,
      details: { partId: part.id, equipmentId: part.equipmentId, name: part.name, logCount: logDocs.length },
    });
    await staged.commit();
    if(!command.isCurrent())return;
    closeModal();
    if (selectedPartId === part.id) selectedPartId = null;
    await reloadAll({force:true});
    if(!command.isCurrent())return;
    refreshList();
    renderDetail();
  } catch (err) {
    console.error('[equipment] part delete failed:', err);
    alert(err.message||'삭제 중 오류가 발생했습니다.');
  }
}

// ─── 교체 / 입고 / 조정 ───────────────────────────────────────────

function staffSelectHtml(id) {
  return `
    <select id="${id}">
      <option value="">선택</option>
      ${getStaffOptions(['senior', 'lead', 'office'])}
    </select>
  `;
}

function showReplaceModal(part) {
  const currentQty = Number(part.currentQty || 0);
  showModal(`
    <h3 class="modal-title">부품 교체 — ${esc(partLabel(part))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">
      현재 재고 ${currentQty}개 · 주기 ${formatCycle(part)} · 마지막 교체 ${part.lastReplacedAt || '없음'}
      ${currentQty <= 0 ? '<br><span style="color:#e53e3e;">재고가 0이라 차감 없이 교체만 기록됩니다.</span>' : ''}
    </p>
    <div class="form-row">
      <div class="form-group">
        <label>교체일 *</label>
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${staffSelectHtml('m_staff')}
      </div>
    </div>
    <div class="form-group">
      <label>메모</label>
      <input type="text" id="m_note" placeholder="예: 마모 심함" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveReplace">교체 기록</button>
    </div>
  `);
  document.getElementById('btnModalCancel').addEventListener('click', closeModal);
  document.getElementById('btnSaveReplace').addEventListener('click', async () => {
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value.trim();
    if (!date || !staff) { alert('교체일과 담당자는 필수입니다.'); return; }

    const before = currentQty;
    const delta = before > 0 ? -1 : 0;
    const after = before + delta;
    const nextDueAt = addCycleToDate(date, part.cycleValue, part.cycleUnit);
    await applyPartChange(part, {
      type: 'replace', qty: delta, before, after, date, staff, note,
      partPatch: { currentQty: after, lastReplacedAt: date, nextDueAt },
      message: `부품 교체 — ${partLabel(part)} (재고 ${before}→${after}, 다음 ${nextDueAt || '-'}) / 담당: ${staff}`,
    });
  });
}

function showIncomingModal(part) {
  showModal(`
    <h3 class="modal-title">부품 입고 — ${esc(partLabel(part))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${Number(part.currentQty || 0)}개 · 최소 ${Number(part.minimumQty || 0)}개</p>
    <div class="form-row">
      <div class="form-group">
        <label>수량 *</label>
        <input type="number" id="m_qty" min="1" placeholder="개" />
      </div>
      <div class="form-group">
        <label>입고일 *</label>
        <input type="date" id="m_date" value="${getToday()}" />
      </div>
    </div>
    <div class="form-group">
      <label>담당자 *</label>
      ${staffSelectHtml('m_staff')}
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="예: 발주분" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveIn">입고</button>
    </div>
  `);
  document.getElementById('btnModalCancel').addEventListener('click', closeModal);
  document.getElementById('btnSaveIn').addEventListener('click', async () => {
    const qty = parseInt(document.getElementById('m_qty').value);
    const date = document.getElementById('m_date').value;
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value.trim();
    if (!qty || qty <= 0 || !date) { alert('수량과 입고일은 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    const before = Number(part.currentQty || 0);
    const after = before + qty;
    await applyPartChange(part, {
      type: 'in', qty, before, after, date, staff, note,
      partPatch: { currentQty: after },
      message: `부품 입고 — ${partLabel(part)} +${qty} (재고 ${before}→${after}) / 담당: ${staff}`,
    });
  });
}

function showAdjustModal(part) {
  const before = Number(part.currentQty || 0);
  showModal(`
    <h3 class="modal-title">재고 조정 — ${esc(partLabel(part))}</h3>
    <p style="font-size:12px;color:#888;margin:0 0 14px;">현재 재고 ${before}개. 실사 수량을 입력하면 차이만큼 조정됩니다.</p>
    <div class="form-row">
      <div class="form-group">
        <label>실제 재고 *</label>
        <input type="number" id="m_actual" min="0" value="${before}" />
      </div>
      <div class="form-group">
        <label>담당자 *</label>
        ${staffSelectHtml('m_staff')}
      </div>
    </div>
    <div class="form-group">
      <label>사유 *</label>
      <input type="text" id="m_note" placeholder="예: 실사 차이" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" id="btnModalCancel">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);
  document.getElementById('btnModalCancel').addEventListener('click', closeModal);
  document.getElementById('btnSaveAdjust').addEventListener('click', async () => {
    const actual = parseInt(document.getElementById('m_actual').value);
    const staff = document.getElementById('m_staff').value;
    const note = document.getElementById('m_note').value.trim();
    if (Number.isNaN(actual) || actual < 0) { alert('실제 재고를 입력해주세요.'); return; }
    if (!staff || !note) { alert('담당자와 사유는 필수입니다.'); return; }
    const delta = actual - before;
    if (delta === 0) { alert('현재 재고와 같습니다.'); return; }
    await applyPartChange(part, {
      type: 'adjust', qty: delta, before, after: actual, date: getToday(), staff, note,
      partPatch: { currentQty: actual },
      message: `부품 재고 조정 — ${partLabel(part)} ${delta > 0 ? '+' : ''}${delta} (${before}→${actual}) / 사유: ${note} / 담당: ${staff}`,
    });
  });
}

/**
 * 부품 문서 갱신 + 이력 기록 + 사무 로그 발행을 한 번에.
 */
async function applyPartChange(part, change) {
  const page=getPageContext();
  const saved=await runEquipmentCommand(command=>commitPartChange(part,change,command),['admin','office','production']);
  if(!saved || (page&&!page.isCurrent()))return;
  closeModal();selectedPartId=part.id;
  await reloadAll({force:true});
  if(page&&!page.isCurrent())return;
  refreshList();renderDetail();
}
async function commitPartChange(part, { type, qty, before, after, date, staff, note, partPatch, message },command) {
  const target=doc(db,'equipmentParts',part.id),logRef=doc(collection(db,'equipmentPartLogs'));
  await command.transaction(db,async transaction=>{
    const snap=await transaction.get(target);
    if(!snap.exists()||Number(snap.data().currentQty||0)!==Number(before))throw new Error('다른 작업으로 부품 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.');
    transaction.update(target, { ...partPatch, updatedAt: new Date() });
    transaction.set(logRef, {
      partId: part.id,
      partName: part.name,
      equipmentId: part.equipmentId,
      equipmentCategory: part.equipmentCategory || '',
      equipmentAlias: part.equipmentAlias || '',
      type, qty, before, after, date,
      staffName: staff,
      note: note || '',
      timestamp: new Date(),
    });
    await commandBatchActivity({
      action: 'equipment', subAction: type, date, staff, message,
      details: { partId: part.id, equipmentId: part.equipmentId, partName: part.name, qty, before, after, note: note || null },
    },{batch:transaction});
  },{targets:[target,logRef]});
  return true;
}

// ─── 유틸 ─────────────────────────────────────────────────────────

let staffCache = {};

function getStaffOptions(groups) {
  const names = [];
  groups.forEach(g => (staffCache[g] || []).forEach(m => { if (m.name && !names.includes(m.name)) names.push(m.name); }));
  return names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
}

function getRoleStaffLabel() {
  if (currentUserRole === 'admin') return '대표';
  if (currentUserRole === 'office') return '사무실';
  if (currentUserRole === 'production') return '생산실';
  return '시스템';
}

const MODAL_ID = 'equipmentModalOverlay';

function showModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  document.body.appendChild(overlay);
}

function closeModal() {
  document.getElementById(MODAL_ID)?.remove();
}
