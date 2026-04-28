import { db } from '../firebase.js';
import {
  doc, getDoc, setDoc, updateDoc
} from 'firebase/firestore';

// 설정 페이지 렌더
export async function renderSettings() {
  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>설정 로딩 중...</p></div>`;

  const staffGroups = await loadStaffGroups();
  
  content.innerHTML = `
    <div class="settings-wrap">
      <h2 class="settings-title">설정</h2>

      <!-- 담당자 관리 -->
      <div class="settings-section">
        <h3 class="settings-section-title">담당자 관리</h3>
        <div class="staff-groups">
          ${renderStaffGroup('senior', '선임', staffGroups.senior)}
          ${renderStaffGroup('lead', '주임', staffGroups.lead)}
          ${renderStaffGroup('office', '사무', staffGroups.office)}
        </div>
      </div>
    </div>
  `;

  // 이벤트 바인딩
  bindStaffEvents(staffGroups);
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
function renderStaffGroup(key, label, members) {
  return `
    <div class="staff-group" data-group="${key}">
      <div class="staff-group-header">
        <span class="staff-group-label">${label}</span>
        <button class="btn-add-staff" data-group="${key}">+ 추가</button>
      </div>
      <div class="staff-list" id="staffList-${key}">
        ${members.map((m, i) => `
          <div class="staff-item" data-group="${key}" data-index="${i}">
            <span>${m.name}</span>
            <button class="btn-del-staff" data-group="${key}" data-index="${i}">삭제</button>
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
      const name = prompt('담당자 이름을 입력해주세요:');
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
      if (!confirm('담당자를 삭제하시겠습니까?')) return;

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
  document.getElementById('staffList-senior').innerHTML = renderStaffList('senior', staffGroups.senior);
  document.getElementById('staffList-lead').innerHTML = renderStaffList('lead', staffGroups.lead);
  document.getElementById('staffList-office').innerHTML = renderStaffList('office', staffGroups.office);
  bindStaffEvents(staffGroups);
}

function renderStaffList(key, members) {
  return members.map((m, i) => `
    <div class="staff-item" data-group="${key}" data-index="${i}">
      <span>${m.name}</span>
      <button class="btn-del-staff" data-group="${key}" data-index="${i}">삭제</button>
    </div>
  `).join('') || '<p class="staff-empty">담당자 없음</p>';
}