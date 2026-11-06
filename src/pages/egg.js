import {staffError} from '../utils/staffText.js';
import {movementNote} from '../utils/movementNote.js';
import {showStatus} from '../utils/statusToast.js';
import {movementLabel,movementReason} from '../services/manualMovementLogic.js';
import {currentUser} from '../app.js';
import {movementFields,bindMovementForm,readMovementForm} from '../utils/movementForm.js';
import {saveManualMovement} from '../services/manualMovements.js';
import { registerCloseModal } from '../utils/modalManager.js';
import { checkQuantityBeforeSave } from '../services/statsAutomationRuntime.js';
import { db } from '../firebase.js';
import {
  collection, getDocsFromServer as getDocs, doc, getDocFromServer as getDoc, query, orderBy, limit
} from 'firebase/firestore';
import { getTodayKST as getToday } from '../utils/date.js';
import { blockIfClosed } from '../utils/closingGuard.js';
import { recordActivity } from '../services/activityLogs.js';

import {pageResource} from '../state/pageResources.js';
import {withReadCommand} from '../services/readCommand.js';
import {pageRefresh} from '../utils/pageRefresh.js';
import {getPageContext,registerPageCleanup} from '../utils/pageLifecycle.js';
import {canLeavePage,markFieldsSaved} from '../utils/formDraft.js';
const eggResource=pageResource('egg');

async function saveEggChange(previous,patch,log=null,activity=null,date=null,selection=null) {
  return withReadCommand(eggResource,async command=>{
    if(date && await blockIfClosed(date,command))return false;
    if(log){await saveManualMovement({db,command,name:'eggLogs',stockId:'global',log,selection,expectedBefore:Number(previous.currentQty||0),uid:currentUser?.uid||null});}
    else {
    const stockRef=doc(db,'eggStock','global'),logRef=log?doc(collection(db,'eggLogs')):null;
    await command.transaction(db,async transaction=>{
      const snap=await transaction.get(stockRef),fresh=snap.exists()?snap.data():{currentQty:0,minimumQty:0};
      if(Number(fresh.currentQty||0)!==Number(previous.currentQty||0) || Number(fresh.minimumQty||0)!==Number(previous.minimumQty||0))throw new Error('다른 작업으로 계란 재고가 변경되었습니다. 최신 자료를 다시 확인해주세요.');
      transaction.set(stockRef,patch);
      if(log)transaction.set(logRef,log);
      if(activity)await recordActivity(activity,{batch:transaction});
    },{targets:[stockRef,...(logRef?[logRef]:[])]});
    }
    return true;
  },{roles:['admin','office','production']});
}
async function runEggSave(callback) {
  try{return await callback();}catch(error){console.error('[계란 저장]',error);alert(staffError(error));}
}

let eggFifoExpanded = false;
let eggFifoLogs = null;
let eggEntryType = 'out';
let eggEntryStaff = '';
let eggEntryDate = '';

export async function renderEgg({force=false}={}) {
  registerPageCleanup(()=>{eggEntryDate='';eggEntryStaff='';eggEntryType='out';});
  const content=document.getElementById('mainContent');
  content.innerHTML='<div style="padding:24px;"><p>계란 로딩 중...</p></div>';
  const data=await eggResource.load(scope=>loadInitialModel(scope),{force,onChange:pageRefresh(eggResource,renderEgg,{draftSelector:'.egg-entry-form'})});
  if(!data||!content.isConnected)return;
  eggFifoLogs = null;
  if (eggFifoExpanded) eggFifoLogs = await loadEggLogs({getDocs},null);
  if (!getPageContext()?.isCurrent()) return;
  staffCache=data.staff;renderEggLayout(data.stock,data.logs);
}
async function loadEggStock(scope={getDoc}) {
  const snap=await scope.getDoc(doc(db,'eggStock','global'));
  return snap.exists()?snap.data():{currentQty:0,minimumQty:0};
}
async function loadEggLogs(scope={getDocs}, maxRows=50) {
  const constraints=[orderBy('timestamp','desc')];
  if(maxRows!==null)constraints.push(limit(maxRows));
  const snap=await scope.getDocs(query(collection(db,'eggLogs'),...constraints));
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

function renderEggLayout(eggStock, logs) {
  const content = document.getElementById('mainContent');
  const currentQty = Number(eggStock.currentQty || 0);
  const minimumQty = Number(eggStock.minimumQty || 0);
  const isLow = currentQty < minimumQty;
  const fifo = eggFifoExpanded ? buildEggFifoBreakdown(eggFifoLogs, currentQty) : null;
  const recentLogs = sortEggLogsDesc(logs).slice(0, 50);
  const todayLogs = recentLogs.filter(log=>log.date===getToday());

  content.innerHTML = `
    <div class="page-wrap egg-page egg-workspace-page">
      <div class="page-header">
        <div class="egg-page-heading"><h2 class="page-title">계란</h2><span>오늘 ${escapeHtml(getToday())}</span></div>
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
          <div class="egg-current-label">현재 재고 <span class="egg-status egg-status--${currentQty <= 0 ? 'empty' : isLow ? 'low' : 'normal'}">${currentQty<=0?'재고 없음':isLow?'최소 미달':'정상'}</span></div>
          <div class="egg-current-quantity"><strong>${escapeHtml(currentQty.toLocaleString())}</strong><span>개</span></div>
          <div class="egg-minimum-line">최소재고 <b>${escapeHtml(formatEggQty(minimumQty))}</b><button type="button" class="egg-link" id="btnSetMinEgg">설정</button></div>
          <p class="egg-threshold-text">${currentQty===minimumQty?'최소재고와 같음':`최소재고보다 ${escapeHtml(formatEggQty(Math.abs(currentQty-minimumQty)))} ${isLow?'부족':'많음'}`}</p>
          <button class="egg-link egg-lots-button" id="btnToggleEggFifo" type="button" aria-controls="eggFifoHost" aria-expanded="${eggFifoExpanded}">${eggFifoExpanded?'입고별 잔량 접기 ▲':'입고별 잔량 · 참고 ▼'}</button>
        </section>
        <section class="egg-entry-card" id="eggEntryHost" aria-label="계란 사용·입고 입력"></section>
      </div>
      <div id="eggFifoHost" ${eggFifoExpanded?'':'hidden'}>${eggFifoExpanded ? renderEggFifoPanel(fifo, currentQty) : ''}</div>
      <section class="egg-today-card" aria-label="오늘 계란 기록">
        <div class="egg-record-heading"><h3>오늘 기록</h3><span>최근 50건 중 오늘 날짜 기록 ${todayLogs.length}건</span><div id="eggTodayPaging"></div></div>
        <div class="table-wrap"><table class="data-table egg-today-table"><thead><tr><th>구분</th><th>수량(개)</th><th>변경 전 → 후</th><th>담당자</th><th>비고</th></tr></thead><tbody id="eggTodayRows"></tbody></table></div>
      </section>
      <details class="egg-history-card">
        <summary>입출고 이력 <span>최근 ${recentLogs.length}건 · 펼쳐보기</span></summary>
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
              ${recentLogs.length === 0 ? `<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">이력 없음</td></tr>` :
                recentLogs.map(l => `
                  <tr>
                    <td>${escapeHtml(l.date || '-')}</td>
                    <td>
                      <span class="tag stock-movement-badge" data-movement-label="${escapeHtml(movementLabel(l,l.type === 'in' ? '입고' : l.type === 'out' ? '출고' : '수동조정'))}">
                        ${movementLabel(l,l.type === 'in' ? '입고' : l.type === 'out' ? '출고' : '수동조정')}
                      </span>
                    </td>
                    <td class="stock-quantity--${l.qty > 0 ? 'increase' : l.qty < 0 ? 'decrease' : 'zero'}" style="font-weight:600">
                      ${l.qty > 0 ? '+' : ''}${escapeHtml(l.qty)}
                    </td>
                    <td>${escapeHtml(l.before ?? '-')}</td>
                    <td>${escapeHtml(l.after ?? '-')}</td>
                    <td>${escapeHtml(l.staffName || '-')}</td>
                    <td>${escapeHtml(movementNote(l.note || l.reason || '-', 'eggLogs', logs, row => row.type === 'in' ? '입고' : row.type === 'out' ? '출고' : '수동조정'))}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  `;

  renderEggEntry(eggStock);
  renderEggTodayRecords(todayLogs,logs);
  const openDialog=async callback=>{
    const page=getPageContext();
    if(!await canLeavePage() || page&&!page.isCurrent())return;
    renderEggEntry(eggStock);
    callback();
  };
  document.getElementById('btnEggIn').addEventListener('click', () => openDialog(()=>showEggModal('in', eggStock)));
  document.getElementById('btnEggOut').addEventListener('click', () => openDialog(()=>showEggModal('out', eggStock)));
  document.getElementById('btnAdjustEgg').addEventListener('click', () => openDialog(()=>showEggAdjustModal(eggStock)));
  document.getElementById('btnSetMinEgg').addEventListener('click', () => openDialog(()=>showSetMinModal(eggStock)));
  document.getElementById('btnToggleEggFifo').addEventListener('click', async event => {
    const button=event.currentTarget;
    if (!eggFifoExpanded) {
      if (button.disabled) return;
      button.disabled=true;
      const page=getPageContext();
      try {
        eggFifoLogs = await loadEggLogs({getDocs},null);
        if (!page?.isCurrent()) return;
        eggFifoExpanded=true;
      } catch(error) {
        button.disabled=false;
        console.error('[계란 FIFO 이력]',error);
        alert('잔량 이력을 불러오지 못했습니다. 다시 시도해주세요.');
        return;
      }
    } else eggFifoExpanded=false;
    const host=document.getElementById('eggFifoHost');
    host.hidden=!eggFifoExpanded;
    host.innerHTML=eggFifoExpanded?renderEggFifoPanel(buildEggFifoBreakdown(eggFifoLogs,currentQty),currentQty):'';
    button.disabled=false;
    button.setAttribute('aria-expanded',String(eggFifoExpanded));
    button.textContent=eggFifoExpanded?'입고별 잔량 접기 ▲':'입고별 잔량 · 참고 ▼';
  });
}

function renderEggTodayRecords(todayLogs,logs) {
  let page=0;
  const draw=()=>{
    document.getElementById('eggTodayRows').innerHTML=todayLogs.length?todayLogs.slice(page*5,page*5+5).map(log=>`<tr>
      <td><span class="tag stock-movement-badge" data-movement-label="${escapeHtml(movementLabel(log,log.type==='in'?'입고':log.type==='out'?'출고':'수동조정'))}">${escapeHtml(movementLabel(log,log.type==='in'?'입고':log.type==='out'?'출고':'수동조정'))}</span></td>
      <td class="stock-quantity--${log.qty>0?'increase':log.qty<0?'decrease':'zero'}">${log.qty>0?'+':''}${escapeHtml(log.qty)}</td>
      <td>${escapeHtml(log.before??'-')} → <b>${escapeHtml(log.after??'-')}</b></td>
      <td>${escapeHtml(log.staffName||'-')}</td><td>${escapeHtml(movementNote(log.note||log.reason||'-','eggLogs',logs,row=>row.type==='in'?'입고':row.type==='out'?'출고':'수동조정'))}</td>
    </tr>`).join(''):'<tr><td colspan="5" class="egg-empty-records">최근 조회한 이력에 오늘 기록이 없습니다.</td></tr>';
    const pager=document.getElementById('eggTodayPaging');
    pager.innerHTML=todayLogs.length>5?`<button type="button" class="btn-secondary" data-egg-prev ${page===0?'disabled':''}>이전</button><span>${page+1} / ${Math.ceil(todayLogs.length/5)}</span><button type="button" class="btn-secondary" data-egg-next ${(page+1)*5>=todayLogs.length?'disabled':''}>다음</button>`:'';
    pager.querySelector('[data-egg-prev]')?.addEventListener('click',()=>{page--;draw();});
    pager.querySelector('[data-egg-next]')?.addEventListener('click',()=>{page++;draw();});
  };
  draw();
}

function renderEggEntry(eggStock) {
  const host=document.getElementById('eggEntryHost');
  const isIn=eggEntryType==='in',currentQty=Number(eggStock.currentQty||0);
  host.innerHTML=`<div class="egg-entry-heading"><h3 id="eggEntryTitle">오늘 입력</h3><div class="egg-entry-tabs" role="group" aria-label="입력 종류">
    <button type="button" data-egg-mode="out" aria-pressed="${!isIn}">사용 기록</button><button type="button" data-egg-mode="in" aria-pressed="${isIn}">입고 기록</button>
  </div></div>
  <form class="egg-entry-form">
    <div class="egg-entry-fields">
      <div class="form-group"><label for="eggEntryQty">이번 ${isIn?'입고량':'사용량'} (개) *</label><input id="eggEntryQty" type="number" min="1" step="1" inputmode="numeric" placeholder="개수 입력" autocomplete="off" required></div>
      <div class="form-group"><label for="eggEntryDate">기록 날짜 *</label><input id="eggEntryDate" type="date" value="${escapeHtml(eggEntryDate||getToday())}" required></div>
      <div class="form-group"><label for="eggEntryStaff">담당자 *</label><select id="eggEntryStaff" required><option value="">담당자 선택</option>${getStaffOptions(['senior','office'])}</select></div>
    </div>
    <p class="egg-entry-help">${isIn?'실제로 들어온 개수만 입력':'이미 기록한 수량을 제외하고, 추가로 사용한 개수만 입력'}</p>
    <div class="egg-entry-savebar"><div id="eggEntryPreview" aria-live="polite"></div><button type="submit" class="btn-primary" id="btnSaveEggEntry">${isIn?'입고':'사용'} 기록 저장</button></div>
    <details class="egg-entry-note"><summary>비고 추가 (선택)</summary><div class="form-group"><label for="eggEntryNote">비고</label><input id="eggEntryNote" maxlength="200" placeholder="필요한 경우에만 입력해주세요"></div></details>
  </form>`;
  const form=host.querySelector('form'),qty=document.getElementById('eggEntryQty'),date=document.getElementById('eggEntryDate'),staff=document.getElementById('eggEntryStaff'),note=document.getElementById('eggEntryNote'),button=document.getElementById('btnSaveEggEntry');
  if([...staff.options].some(option=>option.value===eggEntryStaff))staff.value=eggEntryStaff;
  const operationId=doc(collection(db,'eggLogs')).id;
  let saving=false;
  const update=()=>{
    const amount=Number(qty.value),after=currentQty+(isIn?amount:-amount);
    const valid=qty.value!==''&&Number.isInteger(amount)&&amount>0&&after>=0;
    document.getElementById('eggEntryTitle').textContent=date.value===getToday()?'오늘 입력':'기록 입력';
    document.getElementById('eggEntryPreview').innerHTML=`<span>저장 후 현재 재고</span><div>${escapeHtml(formatEggQty(currentQty))} → <strong>${valid?escapeHtml(formatEggQty(after)):'—'}</strong></div>${qty.value!==''&&!valid?'<small class="egg-entry-warning">수량을 확인해주세요.</small>':valid&&after<Number(eggStock.minimumQty||0)?'<small class="egg-entry-warning">최소재고 미만</small>':''}`;
    button.disabled=saving||!valid||!date.value||!staff.value;
  };
  for(const input of [qty,date,staff]){input.addEventListener('input',update);input.addEventListener('change',update);}
  for(const tab of host.querySelectorAll('[data-egg-mode]'))tab.addEventListener('click',async()=>{
    if(saving||tab.dataset.eggMode===eggEntryType)return;
    const page=getPageContext();
    if(!await canLeavePage()||page&&!page.isCurrent()||!host.isConnected)return;
    eggEntryStaff=staff.value;eggEntryDate=date.value;eggEntryType=tab.dataset.eggMode;renderEggEntry(eggStock);
  });
  const save=async event=>{
    event.preventDefault();if(saving||button.disabled)return;
    saving=true;update();
    const controls=[...host.querySelectorAll('input,select,button'),...document.querySelectorAll('.egg-page-actions button,#btnSetMinEgg')];
    controls.forEach(control=>control.disabled=true);
    try {
      // Normalize number-input exponent notation before the legacy receipt parser.
      await runEggSave(()=>saveEggEntry({type:eggEntryType,eggStock,selection:{kind:isIn?'receipt':'usage',reason:movementReason(isIn?'receipt':'usage',note.value),cancelOf:null,operationId},qtyValue:Number(qty.value).toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:0}),date:date.value,staff:staff.value,note:note.value,onSaved:()=>{
        eggEntryStaff=staff.value;eggEntryDate=date.value;
      }}));
    } finally {
      saving=false;
      if(form.isConnected){controls.forEach(control=>control.disabled=false);update();}
    }
  };
  form.addEventListener('submit',save);
  button.addEventListener('click',save);
  update();markFieldsSaved(form);
}

function buildEggFifoBreakdown(logs, currentQty) {
  const lots = [];
  let unallocatedOutQty = 0;

  for (const log of sortEggLogsAsc(logs)) {
    const qty = Number(log.qty || 0);
    if (!qty) continue;

    if (log.type === 'in' || (log.type === 'adjust' && qty > 0)) {
      lots.push({
        id: log.id || `${log.date || ''}-${lots.length}`,
        date: log.date || '-',
        staffName: log.staffName || '-',
        source: log.type === 'adjust' ? '조정' : '입고',
        initialQty: qty,
        remainingQty: qty,
        order: lots.length,
      });
      continue;
    }

    if (log.type === 'out' || qty < 0) {
      let consumeQty = Math.abs(qty);
      for (const lot of lots) {
        if (consumeQty <= 0) break;
        if (lot.remainingQty <= 0) continue;
        const used = Math.min(lot.remainingQty, consumeQty);
        lot.remainingQty -= used;
        consumeQty -= used;
      }
      unallocatedOutQty += consumeQty;
    }
  }

  const remainingLots = lots.filter(lot => lot.remainingQty > 0);
  const fifoTotalQty = remainingLots.reduce((sum, lot) => sum + lot.remainingQty, 0);

  return {
    lots: remainingLots,
    fifoTotalQty,
    currentQty,
    diffQty: fifoTotalQty - currentQty,
    unallocatedOutQty,
  };
}

function renderEggFifoPanel(fifo, currentQty) {
  const isMatched = fifo.diffQty === 0;
  const rows = fifo.lots.length === 0
    ? '<div class="egg-fifo-empty">표시할 잔량 lot이 없습니다.</div>'
    : fifo.lots.map((lot, index) => `
        <div class="egg-fifo-row">
          <span class="egg-fifo-branch">${index === fifo.lots.length - 1 ? '└' : '├'}</span>
          <span class="egg-fifo-date">${escapeHtml(lot.date)}</span>
          <span class="egg-fifo-staff">${escapeHtml(lot.staffName)}</span>
          <span class="egg-fifo-source">${lot.source}</span>
          <span class="egg-fifo-qty">+${formatEggQty(lot.initialQty)} → ${formatEggQty(lot.remainingQty)} 남음</span>
        </div>
      `).join('');

  const mismatchHtml = isMatched
    ? ''
    : `<div class="egg-fifo-warning">FIFO 분해 합계 ${formatEggQty(fifo.fifoTotalQty)} / 현재 재고 ${formatEggQty(currentQty)}로 ${formatEggQty(Math.abs(fifo.diffQty))} 차이가 있습니다.</div>`;
  const unallocatedHtml = fifo.unallocatedOutQty > 0
    ? `<div class="egg-fifo-warning">입고 lot보다 먼저 기록된 출고/감소 ${formatEggQty(fifo.unallocatedOutQty)}는 분해에서 배분하지 못했습니다.</div>`
    : '';

  return `
    <div class="egg-fifo-panel">
      <div class="egg-fifo-note">FIFO 가정 표시입니다. 실제 출고 lot은 추적되지 않아 참고용으로만 봅니다.</div>
      ${rows}
      <div class="egg-fifo-total">분해 합계 ${formatEggQty(fifo.fifoTotalQty)} / 현재 재고 ${formatEggQty(currentQty)}</div>
      ${mismatchHtml}
      ${unallocatedHtml}
    </div>
  `;
}

function sortEggLogsAsc(logs) {
  return [...logs].sort((a, b) => {
    const timeDiff = getEggLogTime(a) - getEggLogTime(b);
    if (timeDiff !== 0) return timeDiff;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

function sortEggLogsDesc(logs) {
  return [...logs].sort((a, b) => {
    const timeDiff = getEggLogTime(b) - getEggLogTime(a);
    if (timeDiff !== 0) return timeDiff;
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

function getEggLogTime(log) {
  const ts = log.timestamp;
  if (ts?.toMillis) return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const parsed = Date.parse(log.date || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEggQty(qty) {
  return `${Number(qty || 0).toLocaleString()}개`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function showEggModal(type, eggStock) {
  const isIn = type === 'in';
  const currentQty = Number(eggStock.currentQty || 0);

  const outQtyFormGroup = isIn ? `
    <div class="form-group">
      <label>수량(개) *</label>
      <input type="number" id="m_qty" placeholder="개수 입력" />
    </div>
  ` : `
    <div class="form-group" id="m_usageGroup">
      <label>사용량(개) *</label>
      <input type="number" id="m_usageQty" min="1" step="1" placeholder="사용한 개수 입력" />
    </div>
    <div class="form-group" id="m_remainingGroup" hidden style="display:none">
      <label>남은 재고(개) *</label>
      <input type="number" id="m_remaining" placeholder="남은 개수 입력" min="0" max="${currentQty}" />
    </div>
    <div id="m_outPreview" style="font-size:12px;color:#888;margin-top:4px;">출고량: -</div>
  `;

  showModal(`
    <h3 class="modal-title">계란 ${isIn ? '입고' : '출고'}</h3>
    ${movementFields({incoming:isIn,allowed:isIn?['receipt','test']:['usage','reconciliation','test'],defaultKind:isIn?'receipt':'usage',reasonField:false})}
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${currentQty}개</p>
    ${outQtyFormGroup}
    <div class="form-group">
      <label>날짜</label>
      <input type="date" id="m_date" value="${getToday()}" />
    </div>
    <div class="form-group">
      <label>담당자</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${getStaffOptions(['senior', 'office'])}
      </select>
    </div>
    <div class="form-group">
      <label>비고</label>
      <input type="text" id="m_note" placeholder="비고" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveEgg">${isIn ? '입고' : '출고'}</button>
    </div>
  `);

  if (!isIn) {
    const mode=document.getElementById('movement_kind');
    const update=()=>{
      const usage=mode.value==='usage';
      for(const [id,visible] of [['m_usageGroup',usage],['m_remainingGroup',!usage]]){
        const group=document.getElementById(id);group.hidden=!visible;group.style.display=visible?'block':'none';
      }
      const amount=Number(document.getElementById(usage?'m_usageQty':'m_remaining').value);
      const blank=document.getElementById(usage?'m_usageQty':'m_remaining').value==='';
      const remaining=usage?currentQty-amount:amount;
      document.getElementById('m_outPreview').textContent=blank?'출고량: -':remaining<0||remaining>currentQty?'수량을 확인해주세요':`사용량: ${currentQty-remaining}개 · 남은 재고: ${remaining}개`;
    };
    mode.addEventListener('change',update);
    document.getElementById('m_usageQty').addEventListener('input',update);
    document.getElementById('m_remaining').addEventListener('input',update);
  }

  const getMovement=bindMovementForm({db,name:'eggLogs',filter:{},onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);const direction=document.getElementById('m_adjustType');if(direction)direction.value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_note')});
  document.getElementById('btnSaveEgg').addEventListener('click', () => runEggSave(async () => {
    const selection=readMovementForm(getMovement);if(!selection)return;
    return saveEggEntry({type,eggStock,selection,
      qtyValue:document.getElementById(isIn?'m_qty':'m_usageQty')?.value,
      remainingValue:document.getElementById('m_remaining')?.value,
      date:document.getElementById('m_date').value,
      staff:document.getElementById('m_staff').value,
      note:document.getElementById('m_note').value,
    });
  }));
}

// Both entry surfaces use the same validation, closing guard and stock command.
async function saveEggEntry({type,eggStock,selection,qtyValue,remainingValue,date,staff,note,onSaved}) {
    const isIn=type==='in',currentQty=Number(eggStock.currentQty||0),page=getPageContext();
    let qty;
    if (isIn) {
      qty = parseInt(qtyValue);
      if (!qty) { alert('수량을 입력해주세요.'); return; }
    } else if(selection.kind==='usage') {
      qty=Number(qtyValue);
      if(!Number.isInteger(qty)||qty<=0){alert('사용량은 1 이상의 정수로 입력해주세요.');return;}
      if(qty>currentQty){alert(`사용량이 현재 재고(${currentQty}개)보다 많을 수 없습니다.`);return;}
    } else {
      const remaining = parseInt(remainingValue);
      if (isNaN(remaining) || remaining < 0) { alert('남은 재고를 입력해주세요.'); return; }
      if (remaining > currentQty) { alert(`남은 재고가 현재 재고(${currentQty}개)보다 많을 수 없습니다.`); return; }
      qty = currentQty - remaining;
      if (qty === 0) { alert('변동이 없습니다. (출고량 0개)'); return; }
    }
    if (!date) { alert('날짜는 필수입니다.'); return; }
    if (!staff) { alert('담당자는 필수입니다.'); return; }
    if (await blockIfClosed(date)) return;
    if(page&&!page.isCurrent())return;

    const delta = isIn ? qty : -qty;
    const quantityReview = selection.kind==='test'?{approved:true}:await checkQuantityBeforeSave({ itemId: 'eggLogs:egg', name: '계란', date,
      qty, unit: '개', stage: isIn ? '계란' : '계란 출고', direction: isIn ? 'supply' : 'usage' }, () => !page || page.isCurrent());
    if (!quantityReview.approved || (page && !page.isCurrent())) return;
    const before = eggStock.currentQty;
    const after = before + delta;

    const patch = {
      currentQty: after,
      minimumQty: eggStock.minimumQty,
      updatedAt: new Date(),
    };

    const log = {
      date,
      timestamp: new Date(),
      type: isIn ? 'in' : 'out',
      ...(quantityReview.review ? { statsQuantityReview: quantityReview.review } : {}),
      qty: delta,
      before,
      after,
      staffName: staff,
      note,
    };

    // [묶음 5A] 사무 로그 발행 — 계란 입고/출고 (운영자가 메인 화면에서 변동 추적 가능하게)
    const sign = isIn ? '+' : '-';
    const activity = {
      action: 'egg',
      subAction: isIn ? 'in' : 'out',
      date,
      staff,
      message: `계란 ${isIn ? '입고' : '출고'} — ${sign}${qty}개 / 담당: ${staff}`,
      details: {
        delta,
        before,
        after,
        note: note || null,
      },
    };

    if(!await saveEggChange(eggStock,patch,log,activity,date,selection))return;
    if(page&&!page.isCurrent())return;
    if(onSaved)onSaved();else closeModal();
    await renderEgg({force:true});
    showStatus(`${isIn ? '입고' : '출고'} 완료!`);
}


function showEggAdjustModal(eggStock) {
  showModal(`
    <h3 class="modal-title">수동 재고 조정</h3>
    ${movementFields({reasonField:false})}
    <p style="font-size:12px;color:#888;margin-bottom:16px;">현재 재고: ${escapeHtml(eggStock.currentQty)}개</p>
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
        ${getStaffOptions(['senior', 'office'])}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveAdjust">조정</button>
    </div>
  `);

  const getMovement=bindMovementForm({db,name:'eggLogs',filter:{},onCancel:delta=>{document.getElementById('m_qty').value=Math.abs(delta);const direction=document.getElementById('m_adjustType');if(direction)direction.value=delta>0?'plus':'minus';},reasonInput:document.getElementById('m_reason')});
  document.getElementById('btnSaveAdjust').addEventListener('click', () => runEggSave(async () => {
    const page=getPageContext();
    const selection=readMovementForm(getMovement);if(!selection)return;
    const type = document.getElementById('m_adjustType').value;
    const qty = parseInt(document.getElementById('m_qty').value);
    const reason = selection.reason;
    const staff = document.getElementById('m_staff').value;

    if (!qty || !staff) { alert('조정량과 담당자는 필수입니다.'); return; }
    const today = getToday();
    if (await blockIfClosed(today)) return;

    const delta = type === 'plus' ? qty : -qty;
    const before = eggStock.currentQty;
    const after = before + delta;

    // [음수 차단]
    if (after < 0 && selection.kind!=='test') {
      alert(`조정 후 잔량이 ${after}개가 됩니다.\n수동조정으로 음수 재고를 만들 수 없습니다.\n현재 ${before}개에서 최대 ${before}개까지만 감소 가능합니다.`);
      return;
    }

    const patch = {
      currentQty: after,
      minimumQty: eggStock.minimumQty,
      updatedAt: new Date(),
    };

    const log = {
      date: getToday(),
      timestamp: new Date(),
      type: 'adjust',
      qty: delta,
      before,
      after,
      staffName: staff,
      reason,
    };
    const sign = delta >= 0 ? '+' : '';
    const activity = {
      action: 'egg',
      subAction: 'adjust',
      date: today,
      staff,
      message: `계란 수동조정 — ${sign}${delta}개 / 사유: ${reason} / 담당: ${staff}`,
      details: {
        delta,
        before,
        after,
        reason,
      },
    };

    if(!await saveEggChange(eggStock,patch,log,activity,today,selection))return;
    if(page&&!page.isCurrent())return;
    closeModal();
    await renderEgg({force:true});
    showStatus('조정 완료!');
  }));
}

function showSetMinModal(eggStock) {
  showModal(`
    <h3 class="modal-title">최소재고 설정</h3>
    <div class="form-group">
      <label>최소재고(개) *</label>
      <input type="number" id="m_minQty" value="${escapeHtml(eggStock.minimumQty || 0)}" />
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnSaveMin">저장</button>
    </div>
  `);

  document.getElementById('btnSaveMin').addEventListener('click', () => runEggSave(async () => {
    const page=getPageContext();
    const minQty = parseInt(document.getElementById('m_minQty').value) || 0;
    const patch = {
      currentQty: eggStock.currentQty,
      minimumQty: minQty,
      updatedAt: new Date(),
    };
    if(!await saveEggChange(eggStock,patch))return;
    if(page&&!page.isCurrent())return;
    closeModal();
    await renderEgg({force:true});
    alert('설정 완료!');
  }));
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

registerCloseModal('egg', function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
});

// Read-only model construction shared by activation and idle preparation.
async function loadInitialModel(scope) {
    const [stock,logs,...groups]=await Promise.all([loadEggStock(scope),loadEggLogs(scope),...['senior','lead','office'].map(key=>scope.getDoc(doc(db,'staffGroups',key)))]);
    return {stock,logs,staff:Object.fromEntries(['senior','lead','office'].map((key,i)=>[key,groups[i].exists()?groups[i].data().members||[]:[]]))};
}
export function preparePage({cacheOnly=true}={}) { return eggResource.prepare?.('default',loadInitialModel,{cacheOnly}); }
