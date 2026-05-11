import { showPromptModal, showConfirmModal } from '../utils/modal.js';
import { db } from '../firebase.js';
import {
  collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { currentUser, currentUserRole } from '../app.js';
import { loadHolidaysCache } from '../utils/date.js';

// 설정 페이지 렌더
export async function renderSettings() {
  if (currentUserRole === 'production') {
    alert('설정은 대표/사무실 계정만 가능합니다.');
    return;
  }

  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>설정 로딩 중...</p></div>`;

  const staffGroups = await loadStaffGroups();
  const holidays = await loadHolidays();
  const isWriter = currentUserRole === 'admin' || currentUserRole === 'office';
  
  content.innerHTML = `
    <div class="settings-wrap">
      <h2 class="settings-title">설정</h2>

      <!-- 담당자 관리 -->
      <div class="settings-section">
        <h3 class="settings-section-title">담당자 관리</h3>
        <div class="staff-groups">
          ${renderStaffGroup('senior', '선임', staffGroups.senior, isWriter)}
          ${renderStaffGroup('lead', '주임', staffGroups.lead, isWriter)}
          ${renderStaffGroup('office', '사무', staffGroups.office, isWriter)}
        </div>
      </div>

      <!-- 공휴일 관리 -->
      <div class="settings-section">
        <h3 class="settings-section-title">공휴일 관리</h3>
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${renderHolidaysSection(holidays)}
      </div>
    </div>
  `;

  // 이벤트 바인딩
  if (isWriter) bindStaffEvents(staffGroups);
  bindHolidayEvents(holidays);
}

// 담당자 그룹 로드
async function loadStaffGroups() {
  const groups = { senior: [], lead: [], office: [] };
  for (const key of Object.keys(groups)) {
    const snap = await getDoc(doc(db, 'staffGroups', key));
    if (snap.exists()) {
      groups[key] = snap.data().members || [];
    }
  }
  return groups;
}

// 담당자 그룹 렌더
function renderStaffGroup(key, label, members, isWriter = false) {
  return `
    <div class="staff-group" data-group="${key}">
      <div class="staff-group-header">
        <span class="staff-group-label">${label}</span>
        ${isWriter ? `<button class="btn-add-staff" data-group="${key}">+ 추가</button>` : ''}
      </div>
      <div class="staff-list" id="staffList-${key}">
        ${members.map((m, i) => `
          <div class="staff-item" data-group="${key}" data-index="${i}">
            <span>${m.name}</span>
            ${isWriter ? `<button class="btn-del-staff" data-group="${key}" data-index="${i}">삭제</button>` : ''}
          </div>
        `).join('')}
        ${members.length === 0 ? '<p class="staff-empty">담당자 없음</p>' : ''}
      </div>
    </div>
  `;
}

// 이벤트 바인딩
function bindStaffEvents(staffGroups) {
  // 추가 버튼
  document.querySelectorAll('.btn-add-staff').forEach(btn => {
    btn.addEventListener('click', async () => {
      const group = btn.dataset.group;
      const name = await showPromptModal({
        title: '담당자 추가',
        label: '담당자 이름',
        placeholder: '예: 홍길동',
        required: true,
      });
      if (name === null) return;
      if (!name || !name.trim()) return;

      staffGroups[group].push({ id: Date.now().toString(), name: name.trim(), active: true, sortOrder: staffGroups[group].length });
      await saveStaffGroup(group, staffGroups[group]);
      renderSettingsRefresh(staffGroups);
    });
  });

  // 삭제 버튼
  document.querySelectorAll('.btn-del-staff').forEach(btn => {
    btn.addEventListener('click', async () => {
      const group = btn.dataset.group;
      const index = parseInt(btn.dataset.index);
      const __c = await showConfirmModal({ title:'담당자 삭제', message:'담당자를 삭제하시겠습니까?', confirmText:'삭제', danger:true }); if (!__c) return;

      staffGroups[group].splice(index, 1);
      await saveStaffGroup(group, staffGroups[group]);
      renderSettingsRefresh(staffGroups);
    });
  });
}

// 담당자 저장
async function saveStaffGroup(groupKey, members) {
  const groupNames = { senior: '선임', lead: '주임', office: '사무' };
  await setDoc(doc(db, 'staffGroups', groupKey), {
    name: groupNames[groupKey],
    sortOrder: ['senior', 'lead', 'office'].indexOf(groupKey),
    members,
    updatedAt: new Date()
  });
}

// 새로고침
function renderSettingsRefresh(staffGroups) {
  const isWriter = currentUserRole === 'admin' || currentUserRole === 'office';
  document.getElementById('staffList-senior').innerHTML = renderStaffList('senior', staffGroups.senior, isWriter);
  document.getElementById('staffList-lead').innerHTML = renderStaffList('lead', staffGroups.lead, isWriter);
  document.getElementById('staffList-office').innerHTML = renderStaffList('office', staffGroups.office, isWriter);
  bindStaffEvents(staffGroups);
}

function renderStaffList(key, members, isWriter = false) {
  return members.map((m, i) => `
    <div class="staff-item" data-group="${key}" data-index="${i}">
      <span>${m.name}</span>
      ${isWriter ? `<button class="btn-del-staff" data-group="${key}" data-index="${i}">삭제</button>` : ''}
    </div>
  `).join('') || '<p class="staff-empty">담당자 없음</p>';
}
// ===== 공휴일 관리 (Phase 7B-1) =====

// 휴일 목록 로드 (날짜 오름차순)
async function loadHolidays() {
  const snap = await getDocs(collection(db, 'holidays'));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => b.id.localeCompare(a.id));
  return list;
}

// 휴일 섹션 렌더 (등록 폼 + 목록)
function renderHolidaysSection(holidays) {
  const isWriter = currentUserRole === 'admin' || currentUserRole === 'office';

  const formHtml = isWriter ? `
    <div class="holiday-form">
      <input type="date" id="hd_date" class="cell-input" />
      <input type="text" id="hd_label" class="cell-input" placeholder="휴일명 (예: 근로자의 날)" />
      <button class="btn-primary" id="btnAddHoliday">+ 등록</button>
    </div>
  ` : `<p class="staff-empty">읽기 전용입니다. 등록은 대표/사무실 계정에서 가능합니다.</p>`;

  const listHtml = holidays.length === 0
    ? '<p class="staff-empty">등록된 공휴일 없음</p>'
    : `
      <div class="holiday-list" id="holidayList">
        ${holidays.map(h => `
          <div class="holiday-item" data-id="${h.id}">
            <span class="holiday-date">${h.id}</span>
            <span class="holiday-label">${h.label || ''}</span>
            ${isWriter ? `<button class="btn-del-holiday" data-id="${h.id}">삭제</button>` : ''}
          </div>
        `).join('')}
      </div>
    `;

  return formHtml + listHtml;
}

// 휴일 이벤트 바인딩
function bindHolidayEvents() {
  const addBtn = document.getElementById('btnAddHoliday');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddHoliday);
  }

  document.querySelectorAll('.btn-del-holiday').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteHoliday(btn.dataset.id));
  });
}

// 휴일 등록
async function handleAddHoliday() {
  const dateInput = document.getElementById('hd_date');
  const labelInput = document.getElementById('hd_label');
  const date = dateInput.value;
  const label = labelInput.value.trim();

  if (!date) { alert('날짜를 선택해주세요.'); return; }
  if (!label) { alert('휴일명을 입력해주세요.'); return; }

  // 같은 날짜 중복 체크
  const existing = await getDoc(doc(db, 'holidays', date));
  if (existing.exists()) {
    alert(`${date}는 이미 등록된 공휴일입니다.`);
    return;
  }

  try {
    await setDoc(doc(db, 'holidays', date), {
      date,
      label,
      createdAt: new Date(),
      createdBy: currentUser?.uid || null,
    });
    await loadHolidaysCache();  // 캐시 즉시 갱신
    alert('공휴일 등록 완료!');
    await renderSettings();
  } catch (err) {
    console.error(err);
    alert('등록 실패: ' + err.message);
  }
}

// 휴일 삭제
async function handleDeleteHoliday(holidayId) {
  const __c = await showConfirmModal({ title:'공휴일 삭제', message:`${holidayId} 공휴일을 삭제하시겠습니까?`, confirmText:'삭제', danger:true }); if (!__c) return;

  try {
    await deleteDoc(doc(db, 'holidays', holidayId));
    await loadHolidaysCache();  // 캐시 즉시 갱신
    alert('공휴일 삭제 완료!');
    await renderSettings();
  } catch (err) {
    console.error(err);
    alert('삭제 실패: ' + err.message);
  }
}
