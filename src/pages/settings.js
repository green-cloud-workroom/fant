import { showPromptModal, showConfirmModal } from '../utils/modal.js';
import { db } from '../firebase.js';
import {
  collection, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import { currentUser, currentUserRole } from '../app.js';
import { getTodayKST, loadHolidaysCache } from '../utils/date.js';
import { DEFAULT_CLOSING_FLAGS } from '../services/closingChecksLogic.js';
import { loadSystemValues, SYSTEM_VALUE_FIELDS } from '../services/systemValues.js';
import {
  loadMenuStaffGroups, MENU_STAFF_GROUP_FIELDS, STAFF_GROUP_KEYS, STAFF_GROUP_LABELS
} from '../services/menuStaffGroups.js';
import { getKoreanPublicHolidaysForYears, PUBLIC_HOLIDAY_SOURCE } from '../services/holidayMaster.js';
import Sortable from 'sortablejs';

const COPY_SHEET_ORDER_DEFAULT = ['rawCat', 'rawDog', 'freezeCat', 'freezeDog', 'freezeCommon'];

const COPY_SHEET_ORDER_LABELS = {
  rawCat: '생식 - 고양이',
  rawDog: '생식 - 강아지',
  freezeCat: '동결건조 - 고양이',
  freezeDog: '동결건조 - 강아지',
  freezeCommon: '동결건조 - 공용',
};

let copySheetOrderSortable = null;

const CLOSING_FLAG_BLOCKS = [
  { key: 'blockTomorrowProd', label: '내일생산불러오기 미완료 시 마감 차단', desc: '다음 영업일 생산이 있는데 내일생산불러오기를 안 했으면 차단' },
  { key: 'blockFrozenOrder', label: '동결건조 발주 미확인 시 마감 차단', desc: '오늘 등록된 발주 행이 확인/취소되지 않으면 차단' },
  { key: 'blockScheduleDue', label: '입고예정 미처리 시 마감 차단', desc: '오늘 도착 예정 입고가 완료/취소 처리되지 않으면 차단' },
  { key: 'blockAutoRepack', label: '자동 재포장 미확인 시 마감 차단', desc: '자동 재포장 trigger/diff 로그가 확인되지 않으면 차단' },
  { key: 'blockProdLog', label: '생산 로그 미확인 시 마감 차단', desc: '생산 카테고리 로그 (생산/재포장/전처리 등) 미확인 시 차단' },
  { key: 'blockOfficeLog', label: '사무 로그 미확인 시 마감 차단', desc: '사무 카테고리 로그 (봉투/계란/원육/입고예정 등) 미확인 시 차단' },
  { key: 'blockEggOut', label: '계란 출고 미입력 시 마감 차단', desc: '노른자 사용 생산이 있는데 계란 출고가 입력되지 않으면 차단' },
];

const CLOSING_FLAG_WARNS = [
  { key: 'warnNoTomorrowProd', label: '내일 생산 입력 없을 시 마감 경고', desc: '다음 영업일 생산이 0건이면 마감 시 확인 모달' },
  { key: 'warnBagMin', label: '봉투 최소재고 미달 시 마감 경고', desc: '봉투 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달' },
  { key: 'warnMeatMin', label: '원육 최소재고 미달 시 마감 경고', desc: '원육 종류별 현재 재고가 최소재고 미만이면 마감 시 확인 모달' },
  { key: 'warnSupplementMin', label: '영양제 최소재고 미달 시 마감 경고', desc: '영양제 SKU 중 5봉 미만이 있으면 마감 시 확인 모달 (임계값 추후 변경 가능)' },
];

export async function renderSettings() {
  if (currentUserRole === 'production') {
    alert('설정은 대표/사무 계정만 가능합니다.');
    return;
  }

  const content = document.getElementById('mainContent');
  content.innerHTML = `<div style="padding:24px;"><p>설정 로딩 중...</p></div>`;

  const staffGroups = await loadStaffGroups();
  const holidays = await loadHolidays();
  const closingFlags = await loadClosingFlags();
  const systemValues = await loadSystemValues();
  const menuStaffGroups = await loadMenuStaffGroups();
  const copySheetOrder = await loadCopySheetOrder();
  const isWriter = currentUserRole === 'admin' || currentUserRole === 'office';

  content.innerHTML = `
    <div class="settings-wrap">
      <h2 class="settings-title">설정</h2>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">담당자 관리</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <div class="staff-groups">
          ${renderStaffGroup('senior', '선임', staffGroups.senior, isWriter)}
          ${renderStaffGroup('lead', '주임', staffGroups.lead, isWriter)}
          ${renderStaffGroup('office', '사무', staffGroups.office, isWriter)}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">메뉴별 담당자 그룹</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">
          각 메뉴의 담당자 선택에 어떤 그룹을 노출할지 설정합니다. 최소 1개 그룹을 선택해야 합니다.
        </p>
        <div class="menu-staff-group-list">
          ${MENU_STAFF_GROUP_FIELDS.map(field =>
            renderMenuStaffGroupRow(field, menuStaffGroups[field.key], isWriter)
          ).join('')}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">마감 차단/경고 설정</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">
          ON인 항목만 마감 시 차단/경고로 동작합니다. OFF로 두면 해당 항목을 무시하고 마감 가능합니다.
        </p>

        <h4 class="closing-flag-subtitle">차단 항목 (마감 자체를 막음)</h4>
        <div class="closing-flag-list">
          ${CLOSING_FLAG_BLOCKS.map(flag => renderFlagRow(flag, closingFlags[flag.key], isWriter)).join('')}
        </div>

        <h4 class="closing-flag-subtitle">경고 항목 (마감 시 확인 모달만 표시)</h4>
        <div class="closing-flag-list">
          ${CLOSING_FLAG_WARNS.map(flag => renderFlagRow(flag, closingFlags[flag.key], isWriter)).join('')}
        </div>
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">공휴일 관리</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">토/일은 자동 처리됩니다. 추가 공휴일만 등록하세요.</p>
        ${renderHolidaysSection(holidays)}
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">생산지시서 카테고리 순서</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
          <p class="settings-section-desc">생산지시서 복사 시 카테고리 출력 순서입니다.</p>
          ${renderCopySheetOrderSection(copySheetOrder, isWriter)}
        </div>
      </details>

      <details class="settings-section">
        <summary class="settings-section-summary">
          <span class="settings-section-title">시스템 설정값</span>
          <span class="settings-section-toggle">펼치기</span>
        </summary>
        <div class="settings-section-body">
        <p class="settings-section-desc">
          생산/재고 계산에 쓰이는 기준값입니다. 변경 시 이후 계산부터 적용됩니다.
        </p>
        <div class="system-value-list">
          ${SYSTEM_VALUE_FIELDS.map(field => renderSystemValueRow(field, systemValues[field.key], isWriter)).join('')}
        </div>
        </div>
      </details>
    </div>
  `;

  if (isWriter) bindStaffEvents(staffGroups);
  if (isWriter) bindClosingFlagEvents(closingFlags);
  if (isWriter) bindSystemValueEvents(systemValues);
  if (isWriter) bindMenuStaffGroupEvents(menuStaffGroups);
  bindCopySheetOrderEvents(isWriter);
  bindHolidayEvents();
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
    console.warn('[settings] copySheetOrder load failed:', err);
    return [...COPY_SHEET_ORDER_DEFAULT];
  }
}

function renderCopySheetOrderSection(order, isWriter) {
  const normalized = normalizeCopySheetOrder(order);
  return `
    <ul id="copySheetOrderList" class="copy-sheet-order-list sortable-master-list">
      ${normalized.map(key => `
        <li class="copy-sheet-order-item" data-key="${key}">
          ${isWriter ? '<span class="drag-handle">≡</span>' : ''}
          <span>${COPY_SHEET_ORDER_LABELS[key] || key}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function bindCopySheetOrderEvents(isWriter) {
  if (copySheetOrderSortable) {
    copySheetOrderSortable.destroy();
    copySheetOrderSortable = null;
  }
  if (!isWriter) return;

  const listEl = document.getElementById('copySheetOrderList');
  if (!listEl) return;

  copySheetOrderSortable = Sortable.create(listEl, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: async (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      await persistCopySheetOrder();
    },
  });
}

async function persistCopySheetOrder() {
  const listEl = document.getElementById('copySheetOrderList');
  if (!listEl) return;

  const order = Array.from(listEl.querySelectorAll('.copy-sheet-order-item'))
    .map(item => item.dataset.key)
    .filter(key => COPY_SHEET_ORDER_DEFAULT.includes(key));

  try {
    await setDoc(doc(db, 'settings', 'copySheetOrder'), {
      order: normalizeCopySheetOrder(order),
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
    });
  } catch (err) {
    console.error('[settings] copySheetOrder save failed:', err);
    alert('카테고리 순서 저장 실패: ' + err.message);
    await renderSettings();
  }
}

async function loadClosingFlags() {
  try {
    const snap = await getDoc(doc(db, 'settings', 'closingFlags'));
    return snap.exists()
      ? { ...DEFAULT_CLOSING_FLAGS, ...snap.data() }
      : { ...DEFAULT_CLOSING_FLAGS };
  } catch (err) {
    console.warn('[settings] closingFlags load failed:', err);
    return { ...DEFAULT_CLOSING_FLAGS };
  }
}

function renderFlagRow(flag, value, isWriter) {
  const checked = value === false ? '' : 'checked';
  const disabled = isWriter ? '' : 'disabled';
  return `
    <div class="closing-flag-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${flag.label}</div>
        <div class="closing-flag-desc">${flag.desc}</div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" data-flag-key="${flag.key}" ${checked} ${disabled}>
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

function bindClosingFlagEvents(initialFlags) {
  document.querySelectorAll('.closing-flag-list input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const flagKey = e.target.dataset.flagKey;
      const before = initialFlags[flagKey] !== false;
      const after = e.target.checked;

      try {
        await setDoc(
          doc(db, 'settings', 'closingFlags'),
          { [flagKey]: after },
          { merge: true }
        );
        initialFlags[flagKey] = after;

        await addDoc(collection(db, 'activityLogs'), {
          date: getTodayKST(),
          timestamp: serverTimestamp(),
          action: 'settings',
          subAction: 'closingFlagToggle',
          details: { flagKey, before, after },
          staffName: currentUser?.email || currentUser?.uid || '',
          acknowledged: false,
        });
      } catch (err) {
        console.error('[settings] closingFlags save failed:', err);
        alert('저장 실패: ' + err.message);
        e.target.checked = before;
      }
    });
  });
}

function renderSystemValueRow(field, value, isWriter) {
  const disabled = isWriter ? '' : 'disabled';
  let inputHtml;

  if (field.type === 'fraction') {
    const v = value || { numerator: 0, denominator: 1 };
    inputHtml = `
      <div class="system-value-fraction">
        <input type="number" class="system-value-input system-value-input-frac"
          data-value-key="${field.key}" data-frac-part="numerator"
          value="${v.numerator}" step="1" min="0" ${disabled}>
        <span class="system-value-frac-sep">/</span>
        <input type="number" class="system-value-input system-value-input-frac"
          data-value-key="${field.key}" data-frac-part="denominator"
          value="${v.denominator}" step="1" min="1" ${disabled}>
      </div>
    `;
  } else {
    const step = field.type === 'decimal' ? '0.1' : '1';
    inputHtml = `
      <div class="system-value-input-wrap">
        <input type="number" class="system-value-input"
          data-value-key="${field.key}"
          value="${value ?? ''}" step="${step}" min="0" ${disabled}>
        ${field.unit ? `<span class="system-value-unit">${field.unit}</span>` : ''}
      </div>
    `;
  }

  return `
    <div class="closing-flag-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${field.label}</div>
        <div class="closing-flag-desc">${field.desc}</div>
      </div>
      ${inputHtml}
    </div>
  `;
}

function bindSystemValueEvents(initialValues) {
  document.querySelectorAll('.system-value-input').forEach(input => {
    input.addEventListener('blur', async (e) => {
      const valueKey = e.target.dataset.valueKey;
      const field = SYSTEM_VALUE_FIELDS.find(f => f.key === valueKey);
      if (!field) return;

      if (field.type === 'fraction') {
        await handleFractionBlur(e.target, field, initialValues);
      } else {
        await handleNumberBlur(e.target, field, initialValues);
      }
    });
  });
}

async function handleNumberBlur(input, field, initialValues) {
  const valueKey = field.key;
  const before = initialValues[valueKey];
  const after = field.type === 'decimal'
    ? parseFloat(input.value)
    : parseInt(input.value, 10);

  if (isNaN(after) || after < 0) {
    alert('0 이상의 숫자를 입력해주세요.');
    input.value = before;
    return;
  }
  if (after === before) return;

  try {
    await setDoc(
      doc(db, 'settings', 'systemValues'),
      { [valueKey]: after },
      { merge: true }
    );
    initialValues[valueKey] = after;
    await logSystemValueChange(valueKey, before, after);
  } catch (err) {
    console.error('[settings] systemValue save failed:', err);
    alert('저장 실패: ' + err.message);
    input.value = before;
  }
}

async function handleFractionBlur(input, field, initialValues) {
  const valueKey = field.key;
  const before = initialValues[valueKey] || { numerator: 0, denominator: 1 };

  const numInput = document.querySelector(
    `.system-value-input[data-value-key="${valueKey}"][data-frac-part="numerator"]`
  );
  const denInput = document.querySelector(
    `.system-value-input[data-value-key="${valueKey}"][data-frac-part="denominator"]`
  );

  const numerator = parseInt(numInput.value, 10);
  const denominator = parseInt(denInput.value, 10);

  if (isNaN(numerator) || numerator < 0) {
    alert('분자는 0 이상의 정수여야 합니다.');
    numInput.value = before.numerator;
    return;
  }
  if (isNaN(denominator) || denominator < 1) {
    alert('분모는 1 이상의 정수여야 합니다.');
    denInput.value = before.denominator;
    return;
  }

  const after = { numerator, denominator };
  if (after.numerator === before.numerator && after.denominator === before.denominator) return;

  try {
    await setDoc(
      doc(db, 'settings', 'systemValues'),
      { [valueKey]: after },
      { merge: true }
    );
    initialValues[valueKey] = after;
    await logSystemValueChange(valueKey, before, after);
  } catch (err) {
    console.error('[settings] systemValue save failed:', err);
    alert('저장 실패: ' + err.message);
    numInput.value = before.numerator;
    denInput.value = before.denominator;
  }
}

async function logSystemValueChange(valueKey, before, after) {
  await addDoc(collection(db, 'activityLogs'), {
    date: getTodayKST(),
    timestamp: serverTimestamp(),
    action: 'settings',
    subAction: 'systemValueChange',
    details: { valueKey, before, after },
    staffName: currentUser?.email || currentUser?.uid || '',
    acknowledged: false,
  });
}

function renderMenuStaffGroupRow(field, groupKeys = [], isWriter) {
  const disabled = isWriter ? '' : 'disabled';
  const selected = Array.isArray(groupKeys) ? groupKeys : [];

  return `
    <div class="closing-flag-row menu-staff-group-row">
      <div class="closing-flag-meta">
        <div class="closing-flag-label">${field.label}</div>
        <div class="closing-flag-desc">담당자 드롭다운에 표시할 그룹</div>
      </div>
      <div class="menu-staff-group-options" data-menu-key="${field.key}">
        ${STAFF_GROUP_KEYS.map(groupKey => `
          <label class="menu-staff-group-option">
            <input
              type="checkbox"
              class="menu-staff-group-checkbox"
              data-menu-key="${field.key}"
              data-group-key="${groupKey}"
              ${selected.includes(groupKey) ? 'checked' : ''}
              ${disabled}
            >
            <span>${STAFF_GROUP_LABELS[groupKey]}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function bindMenuStaffGroupEvents(initialGroups) {
  document.querySelectorAll('.menu-staff-group-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const menuKey = e.target.dataset.menuKey;
      const groupKey = e.target.dataset.groupKey;
      const before = Array.isArray(initialGroups[menuKey]) ? [...initialGroups[menuKey]] : [];
      const nextSet = new Set(before);

      if (e.target.checked) {
        nextSet.add(groupKey);
      } else {
        nextSet.delete(groupKey);
      }

      const after = STAFF_GROUP_KEYS.filter(key => nextSet.has(key));
      if (after.length === 0) {
        alert('담당자 그룹은 최소 1개 이상 선택해야 합니다.');
        e.target.checked = true;
        return;
      }
      if (arraysEqual(before, after)) return;

      try {
        await setDoc(
          doc(db, 'settings', 'menuStaffGroups'),
          { [menuKey]: after },
          { merge: true }
        );
        initialGroups[menuKey] = after;

        await addDoc(collection(db, 'activityLogs'), {
          date: getTodayKST(),
          timestamp: serverTimestamp(),
          action: 'settings',
          subAction: 'menuStaffGroupChange',
          details: { menuKey, before, after },
          staffName: currentUser?.email || currentUser?.uid || '',
          acknowledged: false,
        });
      } catch (err) {
        console.error('[settings] menuStaffGroups save failed:', err);
        alert('저장 실패: ' + err.message);
        e.target.checked = before.includes(groupKey);
      }
    });
  });
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

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

function bindStaffEvents(staffGroups) {
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

      staffGroups[group].push({
        id: Date.now().toString(),
        name: name.trim(),
        active: true,
        sortOrder: staffGroups[group].length,
      });
      await saveStaffGroup(group, staffGroups[group]);
      renderSettingsRefresh(staffGroups);
    });
  });

  document.querySelectorAll('.btn-del-staff').forEach(btn => {
    btn.addEventListener('click', async () => {
      const group = btn.dataset.group;
      const index = parseInt(btn.dataset.index, 10);
      const confirmed = await showConfirmModal({
        title: '담당자 삭제',
        message: '담당자를 삭제하시겠습니까?',
        confirmText: '삭제',
        danger: true,
      });
      if (!confirmed) return;

      staffGroups[group].splice(index, 1);
      await saveStaffGroup(group, staffGroups[group]);
      renderSettingsRefresh(staffGroups);
    });
  });
}

async function saveStaffGroup(groupKey, members) {
  const groupNames = { senior: '선임', lead: '주임', office: '사무' };
  await setDoc(doc(db, 'staffGroups', groupKey), {
    name: groupNames[groupKey],
    sortOrder: ['senior', 'lead', 'office'].indexOf(groupKey),
    members,
    updatedAt: new Date(),
  });
}

function renderSettingsRefresh(staffGroups) {
  const isWriter = currentUserRole === 'admin' || currentUserRole === 'office';
  document.getElementById('staffList-senior').innerHTML = renderStaffList('senior', staffGroups.senior, isWriter);
  document.getElementById('staffList-lead').innerHTML = renderStaffList('lead', staffGroups.lead, isWriter);
  document.getElementById('staffList-office').innerHTML = renderStaffList('office', staffGroups.office, isWriter);
  if (isWriter) bindStaffEvents(staffGroups);
}

function renderStaffList(key, members, isWriter = false) {
  return members.map((m, i) => `
    <div class="staff-item" data-group="${key}" data-index="${i}">
      <span>${m.name}</span>
      ${isWriter ? `<button class="btn-del-staff" data-group="${key}" data-index="${i}">삭제</button>` : ''}
    </div>
  `).join('') || '<p class="staff-empty">담당자 없음</p>';
}

async function loadHolidays() {
  const snap = await getDocs(collection(db, 'holidays'));
  const list = snap.docs
    .map(d => normalizeHolidayForSettings(d.id, d.data()))
    .filter(h => h.status !== 'deleted');
  list.sort((a, b) => b.id.localeCompare(a.id));
  return list;
}

function normalizeHolidayForSettings(id, data = {}) {
  const title = data.title || data.label || data.name || '';
  return {
    id,
    date: data.date || id,
    title,
    label: data.label || title,
    description: data.description || '',
    holidayType: data.holidayType || (data.isAutoGenerated ? 'publicHoliday' : 'internalOff'),
    affectsProduction: data.affectsProduction === undefined ? true : data.affectsProduction === true,
    affectsShipping: data.affectsShipping === undefined ? true : data.affectsShipping === true,
    shippingClosedFromEnabled: data.shippingClosedFromEnabled === undefined ? true : data.shippingClosedFromEnabled === true,
    isAutoGenerated: data.isAutoGenerated === true,
    recurrenceRule: data.recurrenceRule || null,
    status: data.status || 'active',
  };
}

function renderHolidaysSection(holidays) {
  const isWriter = currentUserRole === 'admin' || currentUserRole === 'office';
  const sourceYears = `${PUBLIC_HOLIDAY_SOURCE.startYear}~${PUBLIC_HOLIDAY_SOURCE.endYear}`;

  const formHtml = isWriter ? `
    <div class="holiday-import-row">
      <button class="btn-secondary" id="btnImportPublicHolidays">한국 공휴일 자동 등록 (${sourceYears})</button>
      <span class="settings-section-desc">이미 등록된 날짜는 덮어쓰지 않습니다.</span>
    </div>
    <div class="holiday-form">
      <div class="holiday-form-fields">
        <label class="holiday-field">시작일
          <input type="date" id="hd_start" class="cell-input" />
        </label>
        <label class="holiday-field">종료일
          <input type="date" id="hd_end" class="cell-input" />
        </label>
        <label class="holiday-field holiday-field--name">휴무일명
          <input type="text" id="hd_label" class="cell-input" placeholder="예: 회사 휴무" />
        </label>
        <label class="holiday-field holiday-field--memo">메모
          <input type="text" id="hd_desc" class="cell-input" placeholder="선택 입력" />
        </label>
      </div>
      <div class="holiday-form-actions">
        <div class="holiday-options">
          <label class="holiday-check"><input type="checkbox" id="hd_affectsProduction" checked> 생산 안 함</label>
          <label class="holiday-check"><input type="checkbox" id="hd_affectsShipping" checked> 배송 안 함</label>
          <label class="holiday-check"><input type="checkbox" id="hd_shippingAvailablePrev" checked> 휴일 전날 배송 가능</label>
        </div>
        <button class="btn-primary" id="btnAddHoliday">+ 회사 휴무일 등록</button>
      </div>
    </div>
  ` : `<p class="staff-empty">읽기 전용입니다. 등록은 대표/사무 계정에서 가능합니다.</p>`;

  const listHtml = holidays.length === 0
    ? '<p class="staff-empty">등록된 공휴일 없음</p>'
    : `
      <div class="holiday-list" id="holidayList">
        ${holidays.map(h => `
          <div class="holiday-item" data-id="${h.id}">
            <span class="holiday-date">${h.id}</span>
            <span class="holiday-label">${h.title || h.label || ''}</span>
            <span class="holiday-badge">${h.isAutoGenerated ? '자동' : '회사'}</span>
            <span class="holiday-flags">
              ${h.affectsProduction ? '생산휴무' : '생산가능'}
              · ${h.affectsShipping ? '배송휴무' : '배송가능'}
              · ${h.shippingClosedFromEnabled ? '전날배송불가' : '전날배송가능'}
            </span>
            ${isWriter ? `
              <button class="btn-edit-holiday" data-id="${h.id}">수정</button>
              <button class="btn-del-holiday" data-id="${h.id}">${h.isAutoGenerated ? '비활성' : '삭제'}</button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

  return formHtml + listHtml;
}

function bindHolidayEvents() {
  const importBtn = document.getElementById('btnImportPublicHolidays');
  if (importBtn) {
    importBtn.addEventListener('click', handleImportPublicHolidays);
  }

  const addBtn = document.getElementById('btnAddHoliday');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddHoliday);
  }

  document.querySelectorAll('.btn-del-holiday').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteHoliday(btn.dataset.id));
  });

  document.querySelectorAll('.btn-edit-holiday').forEach(btn => {
    btn.addEventListener('click', () => handleEditHoliday(btn.dataset.id));
  });
}

async function handleAddHoliday() {
  const startInput = document.getElementById('hd_start');
  const endInput = document.getElementById('hd_end');
  const labelInput = document.getElementById('hd_label');
  const descInput = document.getElementById('hd_desc');
  const affectsProductionInput = document.getElementById('hd_affectsProduction');
  const affectsShippingInput = document.getElementById('hd_affectsShipping');
  const shippingAvailablePrevInput = document.getElementById('hd_shippingAvailablePrev');
  const startDate = startInput.value;
  const endDate = endInput.value || startDate;
  const label = labelInput.value.trim();
  const description = descInput.value.trim();

  if (!startDate) {
    alert('시작일을 선택해주세요.');
    startInput.focus();
    return;
  }
  if (endDate < startDate) {
    alert('종료일은 시작일 이후여야 합니다.');
    endInput.focus();
    return;
  }
  if (!label) {
    alert('휴무일명을 입력해주세요.');
    labelInput.focus();
    return;
  }

  const dates = getDateRangeInclusive(startDate, endDate);

  try {
    let created = 0;
    let skipped = 0;

    for (const date of dates) {
      const ref = doc(db, 'holidays', date);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        skipped += 1;
        continue;
      }

      await setDoc(ref, {
        date,
        holidayType: 'internalOff',
        title: label,
        label,
        description,
        affectsProduction: affectsProductionInput.checked,
        affectsShipping: affectsShippingInput.checked,
        shippingClosedFromEnabled: !shippingAvailablePrevInput.checked,
        isAutoGenerated: false,
        recurrenceRule: null,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || null,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null,
      });
      created += 1;
    }

    await logHolidayChange('create', {
      startDate,
      endDate,
      title: label,
      created,
      skipped,
      total: dates.length,
    });
    await loadHolidaysCache();
    if (created === 0 && skipped > 0) {
      alert(`등록된 날짜가 없습니다. 선택한 ${skipped}개 날짜가 이미 등록되어 있습니다.`);
      return;
    }
    alert(`회사 휴무일 등록 완료: ${created}건${skipped ? ` / 기존 항목 건너뜀 ${skipped}건` : ''}`);
    await renderSettings();
  } catch (err) {
    console.error(err);
    alert('등록 실패: ' + err.message);
  }
}

async function handleImportPublicHolidays() {
  const holidays = getKoreanPublicHolidaysForYears();
  const confirmed = await showConfirmModal({
    title: '한국 공휴일 자동 등록',
    message: `${PUBLIC_HOLIDAY_SOURCE.startYear}~${PUBLIC_HOLIDAY_SOURCE.endYear}년 한국 공휴일 ${holidays.length}건을 등록합니다.\n이미 등록된 날짜는 덮어쓰지 않습니다.`,
    confirmText: '등록',
  });
  if (!confirmed) return;

  try {
    let created = 0;
    let skipped = 0;

    for (const holiday of holidays) {
      const ref = doc(db, 'holidays', holiday.date);
      const existing = await getDoc(ref);
      if (existing.exists() && existing.data().status !== 'deleted') {
        skipped += 1;
        continue;
      }

      await setDoc(ref, {
        ...holiday,
        label: holiday.title,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || null,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null,
      });
      created += 1;
    }

    await logHolidayChange('autoImport', {
      startYear: PUBLIC_HOLIDAY_SOURCE.startYear,
      endYear: PUBLIC_HOLIDAY_SOURCE.endYear,
      created,
      skipped,
      total: holidays.length,
    });
    await loadHolidaysCache();
    alert(`한국 공휴일 자동 등록 완료: 신규 ${created}건 / 기존 유지 ${skipped}건`);
    await renderSettings();
  } catch (err) {
    console.error(err);
    alert('자동 등록 실패: ' + err.message);
  }
}

async function handleEditHoliday(holidayId) {
  const snap = await getDoc(doc(db, 'holidays', holidayId));
  if (!snap.exists()) {
    alert('휴일 정보를 찾을 수 없습니다.');
    return;
  }

  const before = normalizeHolidayForSettings(holidayId, snap.data());
  const title = await showPromptModal({
    title: '휴일명 수정',
    label: '휴일명',
    defaultValue: before.title || before.label || '',
    required: true,
  });
  if (title === null) return;

  const description = await showPromptModal({
    title: '메모 수정',
    label: '메모',
    defaultValue: before.description || '',
    required: false,
    multiline: true,
  });
  if (description === null) return;

  const affectsProduction = await showConfirmModal({
    title: '생산 영향',
    message: `${holidayId}에 생산하지 않음으로 설정할까요?`,
    confirmText: '생산 안 함',
    cancelText: '생산 가능',
  });
  const affectsShipping = await showConfirmModal({
    title: '배송 영향',
    message: `${holidayId}에 배송하지 않음으로 설정할까요?`,
    confirmText: '배송 안 함',
    cancelText: '배송 가능',
  });
  const shippingAvailablePrev = await showConfirmModal({
    title: '전날 배송',
    message: `${holidayId} 전날 배송 가능으로 설정할까요?`,
    confirmText: '전날 배송 가능',
    cancelText: '전날 배송 불가',
  });

  const after = {
    title,
    label: title,
    description,
    affectsProduction,
    affectsShipping,
    shippingClosedFromEnabled: !shippingAvailablePrev,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser?.uid || null,
  };

  try {
    await setDoc(doc(db, 'holidays', holidayId), after, { merge: true });
    await logHolidayChange('edit', {
      date: holidayId,
      before: pickHolidayLogDetails(before),
      after: {
        title,
        description,
        affectsProduction,
        affectsShipping,
        shippingClosedFromEnabled: !shippingAvailablePrev,
      },
    });
    await loadHolidaysCache();
    alert('휴일 수정 완료!');
    await renderSettings();
  } catch (err) {
    console.error(err);
    alert('수정 실패: ' + err.message);
  }
}

async function handleDeleteHoliday(holidayId) {
  const snap = await getDoc(doc(db, 'holidays', holidayId));
  const holiday = snap.exists() ? normalizeHolidayForSettings(holidayId, snap.data()) : { id: holidayId };
  const confirmed = await showConfirmModal({
    title: holiday.isAutoGenerated ? '자동 공휴일 비활성' : '회사 휴무일 삭제',
    message: `${holidayId} ${holiday.isAutoGenerated ? '자동 공휴일을 비활성 처리' : '회사 휴무일을 삭제 처리'}하시겠습니까?`,
    confirmText: holiday.isAutoGenerated ? '비활성' : '삭제',
    danger: true,
  });
  if (!confirmed) return;

  try {
    await setDoc(doc(db, 'holidays', holidayId), {
      date: holidayId,
      status: 'deleted',
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid || null,
      deletedAt: serverTimestamp(),
      deletedBy: currentUser?.uid || null,
    }, { merge: true });
    await logHolidayChange('delete', {
      date: holidayId,
      holiday: pickHolidayLogDetails(holiday),
      mode: holiday.isAutoGenerated ? 'disableAutoGenerated' : 'softDelete',
    });
    await loadHolidaysCache();
    alert(holiday.isAutoGenerated ? '자동 공휴일 비활성 완료!' : '회사 휴무일 삭제 완료!');
    await renderSettings();
  } catch (err) {
    console.error(err);
    alert('삭제 실패: ' + err.message);
  }
}

function getDateRangeInclusive(startDate, endDate) {
  const dates = [];
  let cursor = new Date(`${startDate}T00:00:00+09:00`);
  const end = new Date(`${endDate}T00:00:00+09:00`);
  for (let i = 0; i < 370 && cursor <= end; i += 1) {
    const kst = new Date(cursor.getTime() + 9 * 60 * 60 * 1000);
    dates.push(kst.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return dates;
}

function pickHolidayLogDetails(holiday) {
  return {
    date: holiday.date || holiday.id,
    title: holiday.title || holiday.label || '',
    holidayType: holiday.holidayType || '',
    affectsProduction: holiday.affectsProduction,
    affectsShipping: holiday.affectsShipping,
    shippingClosedFromEnabled: holiday.shippingClosedFromEnabled,
    isAutoGenerated: holiday.isAutoGenerated === true,
    status: holiday.status || 'active',
  };
}

async function logHolidayChange(subAction, details) {
  await addDoc(collection(db, 'activityLogs'), {
    date: getTodayKST(),
    timestamp: serverTimestamp(),
    action: 'holiday',
    subAction,
    details,
    staffName: currentUser?.email || currentUser?.uid || '',
    acknowledged: false,
  });
}
