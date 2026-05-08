import { db } from '../firebase.js';
import {
  collection, getDocs, doc, addDoc, updateDoc, getDoc, query, orderBy, setDoc, where, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { getTodayKST as getToday, getNextBusinessDay, loadHolidaysCache, getHolidaysCache } from '../utils/date.js';
import { getAllBlockingItems } from '../services/closingChecks.js';
import { setCurrentMenu, currentUserRole } from '../app.js';
import { renderLayout } from '../layout.js';
import { renderPage } from '../router.js';
import { recordMeatLog } from '../services/meatLogs.js';
import { showPromptModal, showConfirmModal } from '../utils/modal.js';

let productions = [];
let nextProductions = [];
let recipes = [];
let meatStocks = [];
let eggStock = { currentQty: 0, minimumQty: 0 };
let completionDoc = null;
let blockingData = { totalBlocked: 0, items: [] };

// [묶음 6B-1] 캘린더 데이터 — 14일치만 별도 보관 (productions/nextProductions는 오늘+다음영업일만)
let calendarSchedules = [];
let calendarProductions = [];
let calendarEvents = [];
let calendarWeekOffset = 0;  // 0=오늘 포함 주, +1=한 주 앞으로, -1=뒤로

export async function renderMain() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>메인 로딩 중...</p></div>`;
  await loadAllData();
  renderMainLayout();
}

async function loadAllData() {
  const today = getToday();

  // [묶음 6B-1] 휴일 캐시 먼저 로드해야 다음 영업일 계산이 휴일 반영
  await loadHolidaysCache();

  const nextBizDay = getNextBusinessDay(today);

  const prodSnap = await getDocs(query(collection(db, 'productions'), orderBy('sortOrder')));
  const allProds = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  productions = allProds.filter(p => p.date === today && p.status !== 'deleted');
  nextProductions = allProds.filter(p => p.date === nextBizDay && p.status !== 'deleted');

  const recipeSnap = await getDocs(collection(db, 'recipes'));
  recipes = recipeSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const meatSnap = await getDocs(collection(db, 'meatStocks'));
  meatStocks = meatSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !s.closed);

  const eggSnap = await getDoc(doc(db, 'eggStock', 'global'));
  if (eggSnap.exists()) eggStock = eggSnap.data();

  const compSnap = await getDoc(doc(db, 'productionCompletion', today));
  completionDoc = compSnap.exists() ? { id: compSnap.id, ...compSnap.data() } : null;

  blockingData = await getAllBlockingItems(today);

  // [묶음 6B-1] 캘린더 14일치 데이터 (현재 weekOffset 기준)
  await loadCalendarData(calendarWeekOffset);
}



function renderMainLayout() {
  const content = document.getElementById('mainContent');
  const today = getToday();
  const nextBizDay = getNextBusinessDay(today);
  const isCompleted = completionDoc?.status === 'completed';
  const activeProductions = isCompleted ? nextProductions : productions;
  const activeDateLabel = isCompleted ? `불러온 다음 영업일 생산 (${nextBizDay})` : '오늘 생산';
  const meatNeedsTitle = isCompleted ? '🥩 불러온 생산 원육 출고' : '🥩 오늘 원육 출고';

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const displayDate = isCompleted ? nextBizDay : today;
  const displayDateObj = new Date(displayDate + 'T00:00:00');
  const todayStr = `${displayDateObj.getMonth()+1}/${displayDateObj.getDate()} (${days[displayDateObj.getDay()]})`;

  content.innerHTML = `
    <div class="main-layout">
      <div class="main-panel-left">
        <div class="main-panel-header">
          <span class="main-panel-title">📅 ${todayStr} 생산</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-secondary" id="btnBigView" style="font-size:11px;padding:3px 10px;">크게보기</button>
            ${isCompleted
              ? `<button class="btn-secondary" id="btnCancelCompletion" style="font-size:11px;padding:3px 10px;color:#e53e3e;">내일생산취소</button>`
              : `<button class="btn-primary" id="btnTomorrowLoad" style="font-size:12px;padding:5px 14px;" ${nextProductions.length === 0 ? 'disabled title="다음 영업일에 등록된 생산이 없습니다"' : ''}>내일생산불러오기</button>`
            }
          </div>
        </div>
        <div class="main-production-area">
          <div class="main-production-label">
            <span>${activeDateLabel}</span>
            ${isCompleted ? '<span class="main-completed-pill">내일생산불러오기 완료</span>' : ''}
          </div>
          <div class="main-production-grid">
            ${activeProductions.length === 0
              ? `<div class="main-empty">${isCompleted ? '불러온 다음 영업일 생산 없음' : '오늘 생산 없음'}</div>`
              : activeProductions.map(p => renderProductionTableCard(p)).join('')}
          </div>
        </div>
      </div>

      <!-- [묶음 6A] 우상단 = 2번(원육) + 3번(로그 임시) 가로 분할 -->
      <div class="main-panel-right-top">
        <div class="main-panel-2">
          <div class="main-panel-header">
            <span class="main-panel-title">${meatNeedsTitle}</span>
          </div>
          <div style="padding:12px;font-size:12px;">
            ${renderMeatNeeds(activeProductions, isCompleted)}
          </div>
        </div>

        <div class="main-panel-3">
          <div class="main-panel-header">
            <span class="main-panel-title">🔔 알림 <span style="font-size:10px;color:#999;font-weight:400;">(묶음 6C에서 로그 패널로 교체 예정)</span></span>
          </div>
          <div style="padding:12px;">
            ${renderQuickInfo(isCompleted)}
          </div>
        </div>
      </div>

      <!-- [묶음 6B-1] 우하단 = 4번 캘린더 -->
      <div class="main-panel-right-bottom">
        <div class="main-panel-header">
          <span class="main-panel-title">📆 2주 캘린더</span>
        </div>
        <div class="main-calendar-body">
          ${renderCalendar()}
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnBigView')?.addEventListener('click', showBigView);
  document.getElementById('btnTomorrowLoad')?.addEventListener('click', handleTomorrowLoad);
  document.getElementById('btnCancelCompletion')?.addEventListener('click', handleCancelCompletion);

  // 알림 카드 점프 버튼들
  document.querySelectorAll('.alert-card-jump').forEach(btn => {
    btn.addEventListener('click', () => {
      const menuId = btn.dataset.jump;
      setCurrentMenu(menuId);
      renderLayout();
      renderPage(menuId);
    });
  });

  // [묶음 6B-1] 캘린더 좌우 이동 + 날짜 클릭 바인딩
  bindCalendarEvents();
}

// ============================================================
// [묶음 6B-1] 캘린더 — 2주 표시 + 좌우 이동 + 날짜 클릭 모달
// ============================================================

// 캘린더 표시 14일 범위 계산. weekOffset 0=오늘 포함 주의 월요일부터, +1=한 주 뒤로...
function getCalendarRange(weekOffset = 0) {
  const today = new Date(getToday() + 'T00:00:00');
  const dow = (today.getDay() + 6) % 7;  // 월=0, 화=1, ..., 일=6
  const monday = new Date(today);
  monday.setDate(monday.getDate() - dow + weekOffset * 7);

  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return { dates, startDate: dates[0], endDate: dates[13] };
}

// 14일치 schedules / productions / events 한 번에 로드
async function loadCalendarData(weekOffset = 0) {
  const { startDate, endDate } = getCalendarRange(weekOffset);

  // schedules — status='scheduled'만 표시
  const schedSnap = await getDocs(query(
    collection(db, 'schedules'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  ));
  calendarSchedules = schedSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(s => s.status === 'scheduled');

  // productions — deleted 제외
  const prodSnap = await getDocs(query(
    collection(db, 'productions'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  ));
  calendarProductions = prodSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.status !== 'deleted');

  // events — 컬렉션 없을 수도 있어 안전 가드
  try {
    const evSnap = await getDocs(query(
      collection(db, 'events'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
    ));
    calendarEvents = evSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[캘린더] events 컬렉션 로드 실패 (정상 — 6B-2 전):', err.message);
    calendarEvents = [];
  }
}

// 캘린더 HTML 생성. main-calendar-body 안에 들어감.
function renderCalendar() {
  const { dates } = getCalendarRange(calendarWeekOffset);
  const today = getToday();
  const holidays = getHolidaysCache();

  // 월요일 시작 요일 헤더
  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  const headerLabel = formatCalendarRangeLabel(dates[0], dates[13]);

  return `
    <div class="cal-container">
      <div class="cal-toolbar">
        <button class="cal-nav-btn" id="btnCalPrev" title="이전 주">◀</button>
        <span class="cal-range-label">${headerLabel}</span>
        <button class="cal-nav-btn" id="btnCalNext" title="다음 주">▶</button>
        ${calendarWeekOffset !== 0 ? '<button class="cal-today-btn" id="btnCalToday">오늘로</button>' : ''}
      </div>
      <div class="cal-weekday-row">
        ${weekdays.map((w, i) => `<div class="cal-weekday ${i >= 5 ? 'cal-weekday-weekend' : ''}">${w}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${dates.map(date => renderCalendarCell(date, today, holidays)).join('')}
      </div>
    </div>
  `;
}

// 캘린더 셀 1개 (= 1일)
function renderCalendarCell(date, today, holidays) {
  const d = new Date(date + 'T00:00:00');
  const dow = (d.getDay() + 6) % 7;  // 월=0, ..., 일=6
  const isWeekend = dow >= 5;
  const isHoliday = isWeekend || holidays.includes(date);
  const isToday = (date === today);

  const events = calendarEvents.filter(e => e.date === date);
  const schedules = calendarSchedules.filter(s => s.date === date);
  const productions = calendarProductions.filter(p => p.date === date);

  // 태그: 이벤트 → 입고예정 → 생산 (스펙 5절 4번 화면 순서)
  // [묶음 6B-1 보강] truncate 제거 — CSS line-clamp가 셀 폭 맞춰 자동 줄바꿈/말줄임 처리
  const tagBlocks = [];
  events.forEach(e => {
    const label = e.title || '';
    tagBlocks.push(`<div class="cal-tag cal-tag-event" title="${escapeHtmlMain(label)}">📌 ${escapeHtmlMain(label)}</div>`);
  });
  schedules.forEach(s => {
    const label = formatScheduleLabel(s);
    tagBlocks.push(`<div class="cal-tag cal-tag-schedule" title="${escapeHtmlMain(label)}">📦 ${escapeHtmlMain(label)}</div>`);
  });
  const prodCap = 3;
  productions.slice(0, prodCap).forEach(p => {
    const qtyPart = p.productionUnitQty != null
      ? ` ${formatQty(p.productionUnitQty)}${p.productionUnitName || ''}`
      : '';
    const label = `${p.recipeName || ''}${qtyPart}`;
    tagBlocks.push(`<div class="cal-tag cal-tag-production" title="${escapeHtmlMain(label)}">🏭 ${escapeHtmlMain(label)}</div>`);
  });
  if (productions.length > prodCap) {
    tagBlocks.push(`<div class="cal-tag-more">+${productions.length - prodCap}</div>`);
  }

  // 날짜 라벨 — 월 1일이면 "5/1" 식으로 월 같이
  const parts = date.split('-');
  const dayNum = parseInt(parts[2], 10);
  const dateLabel = dayNum === 1 ? `${parseInt(parts[1], 10)}/${dayNum}` : String(dayNum);

  const cls = [
    'cal-cell',
    isHoliday ? 'cal-cell-holiday' : '',
    isToday ? 'cal-cell-today' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${cls}" data-date="${date}">
      <div class="cal-cell-date-row">
        <span class="cal-cell-date">${dateLabel}</span>
      </div>
      <div class="cal-cell-tags">${tagBlocks.join('')}</div>
    </div>
  `;
}

// 캘린더 좌우 이동 + 셀 클릭 바인딩
function bindCalendarEvents() {
  document.getElementById('btnCalPrev')?.addEventListener('click', () => {
    calendarWeekOffset -= 1;
    refreshCalendar();
  });
  document.getElementById('btnCalNext')?.addEventListener('click', () => {
    calendarWeekOffset += 1;
    refreshCalendar();
  });
  document.getElementById('btnCalToday')?.addEventListener('click', () => {
    calendarWeekOffset = 0;
    refreshCalendar();
  });
  document.querySelectorAll('.cal-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      if (date) showDateModal(date);
    });
  });
}

// 좌우 이동 시 캘린더만 다시 그림 (전체 메인 재로드 안 함 — 빠르게)
async function refreshCalendar() {
  await loadCalendarData(calendarWeekOffset);
  const body = document.querySelector('.main-calendar-body');
  if (!body) return;
  body.innerHTML = renderCalendar();
  bindCalendarEvents();
}

// 캘린더 헤더 라벨: "5/4 ~ 5/17"
function formatCalendarRangeLabel(startDate, endDate) {
  const s = startDate.split('-');
  const e = endDate.split('-');
  return `${parseInt(s[1])}/${parseInt(s[2])} ~ ${parseInt(e[1])}/${parseInt(e[2])}`;
}

// 입고예정 라벨 — schedules 데이터 구조에 맞춤
function formatScheduleLabel(s) {
  const itemName = s.itemNameSnapshot || '';
  const qty = s.orderedQty != null ? s.orderedQty : '';
  const unit = s.orderedUnit || '';
  if (s.type === 'egg') return `계란 ${qty}${unit}`;
  if (s.type === 'meat') return `${itemName || '원육'} ${qty}${unit}`;
  if (s.type === 'bag') return `${itemName || '봉투'} ${qty}${unit}`;
  return `${itemName} ${qty}${unit}`;
}

// 날짜 클릭 시 요약 모달
function showDateModal(date) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(date + 'T00:00:00');
  const dateLabel = `${parseInt(date.split('-')[1])}월 ${parseInt(date.split('-')[2])}일 (${dayNames[d.getDay()]})`;

  const holidays = getHolidaysCache();
  const dow = d.getDay();
  const isWeekend = (dow === 0 || dow === 6);
  const isManualHoliday = holidays.includes(date);
  const isHoliday = isWeekend || isManualHoliday;
  const holidayPill = isHoliday ? '<span class="cal-modal-holiday-pill">휴일</span>' : '';

  const events = calendarEvents.filter(e => e.date === date);
  const schedules = calendarSchedules.filter(s => s.date === date);
  const productions = calendarProductions.filter(p => p.date === date);

  // [묶음 6B-2] 이벤트 항목마다 수정/삭제 버튼
  const eventsHtml = events.length === 0
    ? '<div class="cal-modal-empty">등록된 이벤트 없음</div>'
    : events.map(e => `
        <div class="cal-modal-list-item cal-event-item" data-event-id="${e.id}">
          <div class="cal-event-row">
            <span class="cal-event-title">📌 ${escapeHtmlMain(e.title || '')}</span>
            <span class="cal-event-actions">
              <button class="cal-event-btn" data-event-act="edit" data-event-id="${e.id}">수정</button>
              <button class="cal-event-btn cal-event-btn-danger" data-event-act="delete" data-event-id="${e.id}">삭제</button>
            </span>
          </div>
          ${e.content ? `<div class="cal-modal-list-sub">${escapeHtmlMain(e.content)}</div>` : ''}
        </div>
      `).join('');

  const schedulesHtml = schedules.length === 0
    ? '<div class="cal-modal-empty">예정 없음</div>'
    : schedules.map(s => `<div class="cal-modal-list-item">📦 ${escapeHtmlMain(formatScheduleLabel(s))}</div>`).join('');

  const productionsHtml = productions.length === 0
    ? '<div class="cal-modal-empty">생산 없음</div>'
    : productions.map(p => {
        const badge = p.batchNo ? ` <span style="color:#888;">(${p.batchNo}차)</span>`
                    : (p.round > 1 ? ` <span style="color:#888;">(${p.round}회차)</span>` : '');
        return `<div class="cal-modal-list-item">🏭 ${escapeHtmlMain(p.recipeName || '')}${badge}</div>`;
      }).join('');

  // [묶음 6B-2] 휴일 토글 — 토/일은 자동이라 잠금 (체크박스 disabled). 평일만 토글 가능.
  const holidayToggleHtml = isWeekend
    ? `<label class="cal-holiday-toggle" style="opacity:0.5;cursor:not-allowed;">
         <input type="checkbox" checked disabled> 휴일 (토/일은 자동)
       </label>`
    : `<label class="cal-holiday-toggle">
         <input type="checkbox" id="chkManualHoliday" ${isManualHoliday ? 'checked' : ''}> 이 날을 휴일로 지정
       </label>`;

  showModal(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${dateLabel} ${holidayPill}</h3>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">📌 이벤트</div>
      ${eventsHtml}
    </div>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">📦 입고 예정</div>
      ${schedulesHtml}
    </div>

    <div class="cal-modal-section">
      <div class="cal-modal-section-title">🏭 생산</div>
      ${productionsHtml}
    </div>

    <div class="cal-modal-section" style="border-top:1px solid #eee;padding-top:8px;">
      ${holidayToggleHtml}
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap;">
      <button class="btn-secondary" id="btnAddEvent">+ 이벤트 추가</button>
      <button class="btn-secondary" disabled title="묶음 6E에서 활성화" style="opacity:0.5;cursor:not-allowed;">이 날짜로 보기</button>
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);

  // [묶음 6B-2] 이벤트 추가 / 수정 / 삭제 / 휴일 토글 바인딩
  document.getElementById('btnAddEvent')?.addEventListener('click', () => {
    showEventEditModal(date, null);
  });
  document.querySelectorAll('[data-event-act]').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const act = btn.dataset.eventAct;
      const id = btn.dataset.eventId;
      if (act === 'edit') {
        showEventEditModal(date, id);
      } else if (act === 'delete') {
        await deleteEvent(id, date);
      }
    });
  });
  document.getElementById('chkManualHoliday')?.addEventListener('change', async (ev) => {
    await toggleManualHoliday(date, ev.target.checked);
  });
}

// 캘린더용 안전 처리 헬퍼 — 다른 페이지의 동명 함수와 충돌 방지 위해 Main 접미
function escapeHtmlMain(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
  }[c]));
}
function truncateMain(s, n) {
  if (!s) return '';
  return s.length > n ? s.substring(0, n) + '…' : s;
}

// ============================================================
// [묶음 6B-2] 이벤트 등록/수정/삭제 + 휴일 토글
// ============================================================

// 이벤트 등록(eventId=null) 또는 수정(eventId 지정) 모달
function showEventEditModal(date, eventId) {
  const isEdit = !!eventId;
  const existing = isEdit ? calendarEvents.find(e => e.id === eventId) : null;
  const title = existing?.title || '';
  const content = existing?.content || '';

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(date + 'T00:00:00');
  const dateLabel = `${parseInt(date.split('-')[1])}월 ${parseInt(date.split('-')[2])}일 (${dayNames[d.getDay()]})`;

  showModal(`
    <h3 style="margin:0 0 12px 0;font-size:16px;">${isEdit ? '이벤트 수정' : '이벤트 등록'} — ${dateLabel}</h3>

    <div style="margin-bottom:10px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">제목 (필수)</label>
      <input type="text" id="evTitle" maxlength="50" value="${escapeHtmlMain(title)}"
             style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;">
    </div>

    <div style="margin-bottom:12px;">
      <label style="display:block;font-size:12px;color:#555;margin-bottom:4px;">내용 (선택)</label>
      <textarea id="evContent" rows="3" maxlength="300"
                style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;box-sizing:border-box;resize:vertical;">${escapeHtmlMain(content)}</textarea>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      ${isEdit ? `<button class="btn-secondary" id="btnEvDelete" style="color:#c92a2a;border-color:#ffc9c9;">삭제</button>` : ''}
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnEvSave">${isEdit ? '저장' : '등록'}</button>
    </div>
  `);

  // 제목 인풋에 자동 포커스
  setTimeout(() => document.getElementById('evTitle')?.focus(), 50);

  document.getElementById('btnEvSave')?.addEventListener('click', async () => {
    const newTitle = document.getElementById('evTitle').value.trim();
    const newContent = document.getElementById('evContent').value.trim();
    if (!newTitle) {
      alert('제목을 입력해주세요.');
      return;
    }
    await saveEvent({ id: eventId, date, title: newTitle, content: newContent });
  });

  if (isEdit) {
    document.getElementById('btnEvDelete')?.addEventListener('click', async () => {
      const ok = await showConfirmModal({
        title: '이벤트 삭제',
        message: `"${title}" 이벤트를 삭제하시겠습니까?`,
        confirmText: '삭제',
        cancelText: '취소',
      });
      if (!ok) return;
      await deleteEvent(eventId, date);
    });
  }
}

// 이벤트 저장 (신규/수정 공용)
async function saveEvent({ id, date, title, content }) {
  try {
    if (id) {
      await updateDoc(doc(db, 'events', id), {
        title,
        content: content || '',
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'events'), {
        date,
        title,
        content: content || '',
        createdAt: serverTimestamp(),
      });
    }
    closeModal();
    // 캘린더 데이터 다시 로드 + 화면 갱신 + 같은 날짜 모달 다시 열기
    await loadCalendarData(calendarWeekOffset);
    refreshCalendarUI();
    showDateModal(date);
  } catch (err) {
    console.error('[6B-2] 이벤트 저장 실패:', err);
    alert('저장 중 오류가 발생했습니다.');
  }
}

// 이벤트 삭제
async function deleteEvent(eventId, date) {
  const target = calendarEvents.find(e => e.id === eventId);
  if (!target) return;
  const ok = await showConfirmModal({
    title: '이벤트 삭제',
    message: `"${target.title || '(제목 없음)'}" 이벤트를 삭제하시겠습니까?`,
    confirmText: '삭제',
    cancelText: '취소',
  });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, 'events', eventId));
    closeModal();
    await loadCalendarData(calendarWeekOffset);
    refreshCalendarUI();
    showDateModal(date);
  } catch (err) {
    console.error('[6B-2] 이벤트 삭제 실패:', err);
    alert('삭제 중 오류가 발생했습니다.');
  }
}

// 수동 휴일 토글 — holidays 컬렉션 doc id = 'YYYY-MM-DD' 패턴 (utils/date.js 캐시와 동일)
// 수동 휴일 토글 — holidays 컬렉션 doc id = 'YYYY-MM-DD' 패턴 (utils/date.js 캐시와 동일)
async function toggleManualHoliday(date, makeHoliday) {
  try {
    if (makeHoliday) {
      await setDoc(doc(db, 'holidays', date), {
        date,
        createdAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, 'holidays', date));
    }
    // 캐시 다시 로드 → 캘린더 셀 색 즉시 반영
    await loadHolidaysCache();
    refreshCalendarUI();
  } catch (err) {
    console.error('[6B-2] 휴일 토글 실패:', err);
    alert('휴일 설정 중 오류가 발생했습니다.');
  }
}

// 캘린더 본문만 다시 그림 (모달 외부 갱신용. refreshCalendar와 달리 데이터 재로드 안 함)
function refreshCalendarUI() {
  const body = document.querySelector('.main-calendar-body');
  if (!body) return;
  body.innerHTML = renderCalendar();
  bindCalendarEvents();
}


function renderProductionTableCard(p) {
  const ingredients = p.ingredientsSnapshot || [];
  const unitRowName = getProductionUnitRowName(p, ingredients);

  // [묶음 4A] batchNo 우선 → 없으면 round → 둘 다 없거나 round==1이면 표시 없음
  const roundBadge = p.batchNo
    ? ` <span>${p.batchNo}차</span>`
    : (p.round > 1 ? ` <span>${p.round}회차</span>` : '');

  return `
    <div class="main-production-card" style="--recipe-color:${p.color || '#ef7bd0'}">
      <div class="main-production-card-title">
        ${p.recipeName}${roundBadge}
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
            <td>${unitRowName}</td>
            <td>${formatQty(p.productionUnitQty)}</td>
            <td>${p.productionUnitName || ''}</td>
          </tr>
          ${ingredients.map(ing => `
            <tr>
              <td>${ing.name}</td>
              <td>${formatIngredientQty(ing)}</td>
              <td>${getIngredientUnit(ing)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="main-production-meta">
        ${p.category === 'raw' ? `<span>${p.rawBoxQty || 0}박스</span>` : ''}
        ${p.category === 'freezeDry' ? `<span>${p.freezeDryBagQty || 0}봉</span><span>${p.breadPanQty || 0}빵판</span><span>${p.freezePanQty || 0}동결판</span>` : ''}
      </div>
    </div>
  `;
}

function getProductionUnitRowName(p, ingredients) {
  const unitName = (p.productionUnitName || '').trim();
  const matched = ingredients.find(ing => ing.name === unitName);
  if (matched) return matched.name;
  const inventoryIngredient = ingredients.find(ing => ing.meatTypeId);
  return inventoryIngredient?.name || unitName || '생산단위';
}

function formatIngredientQty(ing) {
  const grams = Number(ing.requiredQtyG || 0);
  if (ing.meatTypeId) return formatQty(grams / 1000, 1);
  return formatQty(Math.round(grams));
}

function getIngredientUnit(ing) {
  return ing.meatTypeId ? 'kg' : 'g';
}

function formatQty(value, maxDecimals = 1) {
  const num = Number(value || 0);
  if (Number.isInteger(num)) return String(num);
  return num.toLocaleString('ko-KR', { maximumFractionDigits: maxDecimals });
}

function renderMeatNeeds(targetProductions = productions, isCompleted = false) {
  if (targetProductions.length === 0) return `<div style="color:#aaa;">${isCompleted ? '불러온 생산 없음' : '오늘 생산 없음'}</div>`;
  const needs = [];
  targetProductions.forEach(p => {
    (p.ingredientsSnapshot || []).forEach(ing => {
      if (ing.autoDeductInventory && ing.linkedToInventory) {
        needs.push({ name: ing.name, requiredG: ing.requiredQtyG });
      }
    });
  });
  if (needs.length === 0) return '<div style="color:#aaa;">원육 출고 없음</div>';
  return needs.map(n => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f5f5f5;">
      <span>${n.name}</span>
      <span style="font-weight:600;">${(n.requiredG / 1000).toFixed(1)}kg</span>
    </div>
  `).join('');
}

function renderQuickInfo(isCompleted) {
  const cards = [];

  // 1. 차단 항목 (빨강) — getAllBlockingItems 결과
  blockingData.items.forEach(it => {
    cards.push(`
      <div class="alert-card alert-card-blocker">
        <span class="alert-card-label">⛔ ${it.reason || it.label}</span>
        <button class="alert-card-jump" data-jump="${it.jumpMenu}">처리하러 가기 →</button>
      </div>
    `);
  });

  // 2. 경고 항목 (노랑) — 계란 부족
  if (eggStock.minimumQty > 0 && eggStock.currentQty < eggStock.minimumQty) {
    cards.push(`
      <div class="alert-card alert-card-warning">
        <span class="alert-card-label">⚠️ 계란 부족 (현재: ${eggStock.currentQty}개 / 최소: ${eggStock.minimumQty}개)</span>
        <button class="alert-card-jump" data-jump="egg">처리하러 가기 →</button>
      </div>
    `);
  }

  // 3. 정보 항목 (초록) — 내일생산불러오기 완료
  if (isCompleted) {
    cards.push(`
      <div class="alert-card alert-card-info">
        <span class="alert-card-label">✅ 내일생산불러오기 완료</span>
      </div>
    `);
  }

  if (cards.length === 0) {
    return '<div class="alert-empty">오늘 처리할 항목 없음</div>';
  }

  return cards.join('');
}

async function handleTomorrowLoad() {
  const today = getToday();
  if (currentUserRole !== 'production') {
    alert('내일생산불러오기는 생산실 계정만 가능합니다.');
    return;
  }
  if (nextProductions.length === 0) {
    alert('다음 영업일에 등록된 생산이 없습니다.');
    return;
  }
  if (completionDoc?.status === 'completed') {
    alert('오늘 내일생산불러오기는 이미 완료되었습니다.');
    return;
  }

  const staffSnap = await getDoc(doc(db, 'staffGroups', 'lead'));
  const members = staffSnap.exists() ? staffSnap.data().members || [] : [];

  showModal(`
    <h3 class="modal-title">내일생산불러오기</h3>
    <p style="font-size:12px;color:#888;margin-bottom:16px;">
      다음 영업일(${getNextBusinessDay(today)}) 생산 기준으로 원육/봉투 재고가 차감됩니다.
    </p>
    <div class="form-group">
      <label>담당자 *</label>
      <select id="m_staff">
        <option value="">선택</option>
        ${members.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">취소</button>
      <button class="btn-primary" id="btnConfirmLoad">확인</button>
    </div>
  `);

  document.getElementById('btnConfirmLoad').addEventListener('click', async () => {
    const staff = document.getElementById('m_staff').value;
    if (!staff) { alert('담당자를 선택해주세요.'); return; }
    closeModal();
    await executeProductionLoad(today, staff);
  });
}

async function executeProductionLoad(today, staffName) {
  const nextBizDay = getNextBusinessDay(today);
  try {
    const meatNeeds = {};
    const bagNeeds = {};

    for (const p of nextProductions) {
      const recipe = recipes.find(r => r.id === p.recipeId);
      if (!recipe) continue;
      (p.ingredientsSnapshot || []).forEach(ing => {
        if (ing.autoDeductInventory && ing.meatTypeId) {
          meatNeeds[ing.meatTypeId] = (meatNeeds[ing.meatTypeId] || 0) + ing.requiredQtyG;
        }
      });
      if (recipe.category === 'raw' && recipe.bagTypeId) {
        const boxQty = p.rawBoxQty || 0;
        const bagSnap = await getDoc(doc(db, 'bagTypes', recipe.bagTypeId));
        if (bagSnap.exists()) {
          const piecesPerBox = bagSnap.data().piecesPerBox || 1;
          bagNeeds[recipe.bagTypeId] = (bagNeeds[recipe.bagTypeId] || 0) + (boxQty * piecesPerBox);
        }
      }
    }

    // 봉투 재고 체크
    for (const [bagTypeId, needed] of Object.entries(bagNeeds)) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        if (current < needed) {
          alert(`봉투가 부족하여 내일 생산을 불러올 수 없습니다.\n${bagSnap.data().name}: 현재 ${current}장 / 필요 ${needed}장`);
          return;
        }
      }
    }

        // 원육 합계 부족 사전 체크 (재포장 + 전처리 + 냉동창고)
    // 단위중량 올림 차감 고려
    for (const [meatTypeId, neededG] of Object.entries(meatNeeds)) {
      const repackedSum = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'repacked' && s.remaining > 0)
        .reduce((sum, s) => sum + s.remaining, 0);

      const processedLots = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'processed' && s.remaining > 0)
        .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));
      const processedSum = processedLots.reduce((sum, s) => sum + s.remaining, 0);

      const frozenSum = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'frozen' && s.remaining > 0)
        .reduce((sum, s) => sum + s.remaining, 0);

      const totalAvailable = repackedSum + processedSum + frozenSum;

      if (totalAvailable < neededG) {
        const meatName = meatStocks.find(s => s.meatTypeId === meatTypeId)?.meatNameSnapshot || meatTypeId;
        alert(
          `${meatName} 재고가 부족하여 내일 생산을 불러올 수 없습니다.\n\n` +
          `필요량: ${(neededG/1000).toFixed(1)}kg\n` +
          `현재 합계: ${(totalAvailable/1000).toFixed(1)}kg\n` +
          `  - 재포장: ${(repackedSum/1000).toFixed(1)}kg\n` +
          `  - 전처리: ${(processedSum/1000).toFixed(1)}kg\n` +
          `  - 냉동창고: ${(frozenSum/1000).toFixed(1)}kg`
        );
        return;
      }
    }

    const ledgerItems = [];
    const productionBatchId = `productionCompletion:${today}`;

    // 원육 FIFO 차감
    for (const [meatTypeId, neededG] of Object.entries(meatNeeds)) {
      let remaining = neededG;

      const repackedStocks = meatStocks
        .filter(s => s.meatTypeId === meatTypeId && s.stage === 'repacked' && s.remaining > 0)
        .sort((a, b) => (a.repackedDate || '').localeCompare(b.repackedDate || ''));

      for (const s of repackedStocks) {
        if (remaining <= 0) break;
        const deduct = Math.min(s.remaining, remaining);
        const newRemaining = s.remaining - deduct;
        await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
        ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deduct, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 재포장`, stockUpdatedAtSnapshot: new Date() });

        await recordMeatLog({
          type: 'productionDeduct',
          date: today,
          meatTypeId,
          meatNameSnapshot: s.meatNameSnapshot,
          stage: 'repacked',
          meatStockId: s.id,
          delta: -deduct,
          before: s.remaining,
          after: newRemaining,
          staff: staffName,
          reason: '내일생산불러오기 차감',
          batchId: productionBatchId,
        });

        remaining -= deduct;
      }

      if (remaining > 0) {
        const processedStocks = meatStocks
          .filter(s => s.meatTypeId === meatTypeId && s.stage === 'processed' && s.remaining > 0)
          .sort((a, b) => (a.processedDate || '').localeCompare(b.processedDate || ''));

        for (const s of processedStocks) {
          if (remaining <= 0) break;
          const unitW = s.unitWeightG || 1;
          const deductG = Math.min(s.remaining, Math.ceil(remaining / unitW) * unitW);
          const newRemaining = s.remaining - deductG;
          await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
          ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deductG, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 전처리`, stockUpdatedAtSnapshot: new Date() });

          await recordMeatLog({
            type: 'productionDeduct',
            date: today,
            meatTypeId,
            meatNameSnapshot: s.meatNameSnapshot,
            stage: 'processed',
            meatStockId: s.id,
            delta: -deductG,
            before: s.remaining,
            after: newRemaining,
            staff: staffName,
            reason: '내일생산불러오기 차감',
            batchId: productionBatchId,
          });

          // 잉여분 → 재포장으로 자동 입고
          const surplusG = deductG - remaining;
          if (surplusG > 0) {
            const existingRepacked = meatStocks.find(rs =>
              rs.meatTypeId === meatTypeId && rs.stage === 'repacked' && rs.remaining > 0
            );

            if (existingRepacked) {
              const newRepackedRemaining = existingRepacked.remaining + surplusG;
              await updateDoc(doc(db, 'meatStocks', existingRepacked.id), {
                remaining: newRepackedRemaining,
                closed: false,
                updatedAt: new Date(),
              });
              ledgerItems.push({
                collection: 'meatStocks',
                docId: existingRepacked.id,
                field: 'remaining',
                delta: surplusG,
                before: existingRepacked.remaining,
                after: newRepackedRemaining,
                label: `${s.meatNameSnapshot} 재포장 자동입고`,
                stockUpdatedAtSnapshot: new Date(),
              });

              await recordMeatLog({
                type: 'repackedIn',
                date: today,
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                meatStockId: existingRepacked.id,
                delta: surplusG,
                before: existingRepacked.remaining,
                after: newRepackedRemaining,
                staff: staffName,
                reason: '생산 자동 재포장 (기존 lot 합산)',
                batchId: productionBatchId,
              });

              existingRepacked.remaining = newRepackedRemaining;
            } else {
              const newRepackedRef = await addDoc(collection(db, 'meatStocks'), {
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                incomingDate: today,
                repackedDate: today,
                unitWeightG: null,
                unitCount: null,
                initialQtyG: surplusG,
                remaining: surplusG,
                batchId: productionBatchId,
                staffName,
                note: '생산 자동 재포장',
                closed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              ledgerItems.push({
                collection: 'meatStocks',
                docId: newRepackedRef.id,
                field: 'remaining',
                delta: surplusG,
                before: 0,
                after: surplusG,
                label: `${s.meatNameSnapshot} 재포장 자동신규`,
                stockUpdatedAtSnapshot: new Date(),
                isNewDoc: true,
              });

              await recordMeatLog({
                type: 'repackedIn',
                date: today,
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                meatStockId: newRepackedRef.id,
                delta: surplusG,
                before: 0,
                after: surplusG,
                staff: staffName,
                reason: '생산 자동 재포장 (신규 lot)',
                batchId: productionBatchId,
              });

              meatStocks.push({
                id: newRepackedRef.id,
                meatTypeId,
                meatNameSnapshot: s.meatNameSnapshot,
                stage: 'repacked',
                remaining: surplusG,
                unitWeightG: null,
              });
            }
          }

          remaining -= deductG;
        }
      }

      if (remaining > 0) {
        const frozenStocks = meatStocks
          .filter(s => s.meatTypeId === meatTypeId && s.stage === 'frozen' && s.remaining > 0)
          .sort((a, b) => (a.incomingDate || '').localeCompare(b.incomingDate || ''));

        for (const s of frozenStocks) {
          if (remaining <= 0) break;
          const deduct = Math.min(s.remaining, remaining);
          const newRemaining = s.remaining - deduct;
          await updateDoc(doc(db, 'meatStocks', s.id), { remaining: newRemaining, closed: newRemaining <= 0, updatedAt: new Date() });
          ledgerItems.push({ collection: 'meatStocks', docId: s.id, field: 'remaining', delta: -deduct, before: s.remaining, after: newRemaining, label: `${s.meatNameSnapshot} 냉동창고`, stockUpdatedAtSnapshot: new Date() });

          await recordMeatLog({
            type: 'productionDeduct',
            date: today,
            meatTypeId,
            meatNameSnapshot: s.meatNameSnapshot,
            stage: 'frozen',
            meatStockId: s.id,
            delta: -deduct,
            before: s.remaining,
            after: newRemaining,
            staff: staffName,
            reason: '내일생산불러오기 차감',
            batchId: productionBatchId,
          });

          remaining -= deduct;
        }
      }
    }

    // 봉투 차감
    for (const [bagTypeId, neededPcs] of Object.entries(bagNeeds)) {
      const bagSnap = await getDoc(doc(db, 'bagTypes', bagTypeId));
      if (bagSnap.exists()) {
        const current = bagSnap.data().currentQty || 0;
        const newQty = current - neededPcs;
        await updateDoc(doc(db, 'bagTypes', bagTypeId), { currentQty: newQty, updatedAt: new Date() });
        ledgerItems.push({ collection: 'bagTypes', docId: bagTypeId, field: 'currentQty', delta: -neededPcs, before: current, after: newQty, label: `${bagSnap.data().name} 봉투`, stockUpdatedAtSnapshot: new Date() });
        await addDoc(collection(db, 'bagLogs'), { date: today, timestamp: new Date(), bagTypeId, bagNameSnapshot: bagSnap.data().name, type: 'autoDeduct', qty: -neededPcs, before: current, after: newQty, staffName, note: '내일생산불러오기 자동차감' });
      }
    }

    // ledger 저장
    const ledgerRef = await addDoc(collection(db, 'stockLedger'), {
      actionType: 'productionCompletion',
      actionId: today,
      timestamp: new Date(),
      runDate: today,
      status: 'active',
      items: ledgerItems,
    });

    // productionCompletion 저장
    await setDoc(doc(db, 'productionCompletion', today), {
      runDate: today,
      targetProductionDate: nextBizDay,
      status: 'completed',
      idempotencyKey: `productionCompletion:${today}`,
      staffName,
      ledgerId: ledgerRef.id,
      completedAt: new Date(),
    });

    for (const p of nextProductions) {
      await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: true });
    }

    await loadAllData();
    renderMainLayout();
    alert('내일생산불러오기 완료!');

  } catch (err) {
    console.error(err);
    alert('오류가 발생했습니다: ' + err.message);
  }
}

async function handleCancelCompletion() {
  if (currentUserRole !== 'production') {
    alert('내일생산불러오기 취소는 생산실 계정만 가능합니다.');
    return;
  }
  const __c = await showConfirmModal({ title:'내일생산불러오기 취소', message:'내일생산불러오기를 취소하시겠습니까?\n차감된 재고가 복원됩니다.', confirmText:'취소', danger:true }); if (!__c) return;
  const reason = await showPromptModal({
    title: '내일생산불러오기 취소',
    message: '재고가 전부 롤백되고 마감 차단 항목이 다시 활성화됩니다.',
    label: '취소 사유',
    placeholder: '예: 생산 일정 변경',
    required: true,
    multiline: true,
  });
  if (reason === null) return;
  if (!reason) return;

  const today = getToday();
  const cancelStaffName = completionDoc?.staffName || 'unknown';
  const productionBatchId = `productionCompletion:${completionDoc?.runDate || today}`;

  try {
    if (completionDoc?.ledgerId) {
      const ledgerSnap = await getDoc(doc(db, 'stockLedger', completionDoc.ledgerId));
      if (ledgerSnap.exists()) {
        const items = ledgerSnap.data().items || [];
        for (const item of items) {
          const docSnap = await getDoc(doc(db, item.collection, item.docId));
          if (!docSnap.exists()) continue;
          const currentVal = docSnap.data()[item.field];

          if (currentVal !== item.after) {
            const __c = await showConfirmModal({
              title: '재고 변동 감지',
              message: `내일생산불러오기 이후 ${item.label} 재고가 변경된 이력이 있습니다.\n내일생산불러오기 당시 차감분만 복원됩니다.\n\n강제 복원하시겠습니까?`,
              confirmText: '강제 복원',
              danger: true,
            });
            if (!__c) continue;
          }

          // 자동 재포장 신규 lot은 remaining=0 + closed=true 처리
          if (item.isNewDoc) {
            const newRemaining = currentVal - item.delta; // 보통 0
            await updateDoc(doc(db, item.collection, item.docId), {
              [item.field]: newRemaining,
              closed: true,
              updatedAt: new Date(),
            });
          } else {
            await updateDoc(doc(db, item.collection, item.docId), {
              [item.field]: currentVal - item.delta,
              closed: false,
              updatedAt: new Date(),
            });
          }

          // meatStocks만 meatLogs 기록 (봉투/계란은 대상 아님)
          if (item.collection === 'meatStocks') {
            const docData = docSnap.data();
            await recordMeatLog({
              type: 'productionRollback',
              date: today,
              meatTypeId: docData.meatTypeId || null,
              meatNameSnapshot: docData.meatNameSnapshot || '',
              stage: docData.stage || 'frozen',
              meatStockId: item.docId,
              delta: -item.delta,
              before: currentVal,
              after: currentVal - item.delta,
              staff: cancelStaffName,
              reason: `내일생산불러오기 취소 - ${reason}`,
              batchId: productionBatchId,
            });
          }
        }
        await updateDoc(doc(db, 'stockLedger', completionDoc.ledgerId), { status: 'rolledBack', rolledBackAt: new Date() });
      }
    }

    if (completionDoc?.id) {
      await updateDoc(doc(db, 'productionCompletion', completionDoc.id), { status: 'cancelled', cancelReason: reason, cancelledAt: new Date() });
    }

    for (const p of nextProductions) {
      await updateDoc(doc(db, 'productions', p.id), { lockedByCompletion: false });
    }

    await loadAllData();
    renderMainLayout();
    alert('취소 완료! 재고가 복원되었습니다.');

  } catch (err) {
    console.error(err);
    alert('오류가 발생했습니다: ' + err.message);
  }
}

function showBigView() {
  const isCompleted = completionDoc?.status === 'completed';
  const displayProductions = isCompleted ? nextProductions : productions;
  const title = isCompleted ? `${getNextBusinessDay(getToday())} 불러온 생산` : `${getToday()} 생산 현황`;

  showModal(`
    <h3 class="modal-title">${title}</h3>
    <div class="main-production-grid big-view">
      ${displayProductions.length === 0 ? '<p style="color:#aaa">생산 없음</p>' :
        displayProductions.map(p => renderProductionTableCard(p)).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">닫기</button>
    </div>
  `);
}

function showModal(html) {
  const existing = document.getElementById('modalOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  const isWide = html.includes('main-production-grid big-view');
  overlay.id = 'modalOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box ${isWide ? 'modal-wide' : ''}">${html}</div>`;
  document.body.appendChild(overlay);
  // 외부 클릭 닫힘 비활성화 (묶음 1F: 모달 사라짐 이슈 우회)
}

window.closeModal = function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
};
