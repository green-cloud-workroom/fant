// 공통 모달 유틸 (묶음 1B)
//
// 브라우저 기본 prompt() / confirm() 대체용.
// 디자인 통일 + Promise 기반 비동기 호출.
//
// 사용 예시:
//   const reason = await showPromptModal({
//     title: '발주 취소',
//     label: '취소 사유',
//     placeholder: '예: 재고 부족',
//     required: true,
//   });
//   if (reason === null) return; // 취소
//   // reason은 입력된 문자열

const OVERLAY_ID = 'commonPromptModal';

/**
 * 텍스트 입력을 받는 모달.
 *
 * @param {object} opts
 * @param {string} opts.title          - 모달 제목 (예: "발주 취소")
 * @param {string} [opts.message]      - 부가 설명 (선택)
 * @param {string} [opts.label]        - 입력 필드 라벨 (예: "사유")
 * @param {string} [opts.placeholder]  - 입력 필드 placeholder
 * @param {string} [opts.defaultValue] - 입력 필드 초기값
 * @param {boolean} [opts.required]    - 필수 입력 여부 (기본 true)
 * @param {boolean} [opts.multiline]   - true면 textarea, false면 input (기본 false)
 * @param {string} [opts.confirmText]  - 확인 버튼 텍스트 (기본 "확인")
 * @param {string} [opts.cancelText]   - 취소 버튼 텍스트 (기본 "취소")
 *
 * @returns {Promise<string|null>}  - 입력값 or null (취소 시)
 */
export function showPromptModal(opts = {}) {
  const {
    title = '',
    message = '',
    label = '',
    placeholder = '',
    defaultValue = '',
    required = true,
    multiline = false,
    confirmText = '확인',
    cancelText = '취소',
  } = opts;

  return new Promise((resolve) => {
    // 기존 모달 제거 (idempotent)
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();

    const inputHtml = multiline
      ? `<textarea id="commonPromptInput" rows="3" style="width:100%;padding:8px;font-size:13px;font-family:inherit;box-sizing:border-box;border:1px solid #d0d0d0;border-radius:4px;resize:vertical;outline:none;" placeholder="${placeholder}">${defaultValue}</textarea>`
      : `<input type="text" id="commonPromptInput" style="width:100%;padding:8px;font-size:13px;box-sizing:border-box;border:1px solid #d0d0d0;border-radius:4px;outline:none;" placeholder="${placeholder}" value="${defaultValue}" />`;

    const html = `
      <div class="modal-overlay" id="${OVERLAY_ID}">
        <div class="modal-box" style="width:420px;">
          <h3 class="modal-title">${title}</h3>
          ${message ? `<p style="font-size:13px;color:#555;margin:0 0 16px;line-height:1.6;">${message}</p>` : ''}
          ${label ? `<label style="display:block;font-size:12px;color:#555;margin-bottom:6px;font-weight:500;">${label}${required ? ' *' : ''}</label>` : ''}
          ${inputHtml}
          <div class="modal-actions">
            <button class="btn-secondary" id="commonPromptCancel">${cancelText}</button>
            <button class="btn-primary" id="commonPromptConfirm">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById(OVERLAY_ID);
    const input = document.getElementById('commonPromptInput');
    const btnCancel = document.getElementById('commonPromptCancel');
    const btnConfirm = document.getElementById('commonPromptConfirm');

    // 입력 필드 자동 포커스
    setTimeout(() => input.focus(), 50);

    const cleanup = () => {
      if (overlay) overlay.remove();
    };

    btnCancel.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    btnConfirm.addEventListener('click', () => {
      const val = input.value.trim();
      if (required && !val) {
        alert(`${label || '값'}을(를) 입력해주세요.`);
        input.focus();
        return;
      }
      cleanup();
      resolve(val);
    });

    // ESC = 취소, Enter = 확인 (textarea 제외)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      } else if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        btnConfirm.click();
      }
    });
  });
}

/**
 * 확인/취소만 받는 모달 (confirm 대체).
 * 묶음 1C에서 사용 예정.
 *
 * @param {object} opts
 * @param {string} opts.title          - 모달 제목
 * @param {string} opts.message        - 본문 (필수)
 * @param {string} [opts.confirmText]  - 확인 버튼 (기본 "확인")
 * @param {string} [opts.cancelText]   - 취소 버튼 (기본 "취소")
 * @param {boolean} [opts.danger]      - true면 확인 버튼 빨간색
 *
 * @returns {Promise<boolean>}  - true (확인) or false (취소/ESC)
 */
export function showConfirmModal(opts = {}) {
  const {
    title = '확인',
    message = '',
    confirmText = '확인',
    cancelText = '취소',
    danger = false,
  } = opts;

  return new Promise((resolve) => {
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();

    const confirmBtnClass = danger ? 'btn-danger' : 'btn-primary';

    const html = `
      <div class="modal-overlay" id="${OVERLAY_ID}">
        <div class="modal-box" style="width:420px;">
          <h3 class="modal-title">${title}</h3>
          <p style="font-size:13px;color:#333;margin:0 0 16px;line-height:1.6;white-space:pre-wrap;">${message}</p>
          <div class="modal-actions">
            <button class="btn-secondary" id="commonPromptCancel">${cancelText}</button>
            <button class="${confirmBtnClass}" id="commonPromptConfirm">${confirmText}</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    const overlay = document.getElementById(OVERLAY_ID);
    const btnCancel = document.getElementById('commonPromptCancel');
    const btnConfirm = document.getElementById('commonPromptConfirm');

    setTimeout(() => btnConfirm.focus(), 50);

    const cleanup = () => {
      if (overlay) overlay.remove();
    };

    btnCancel.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    btnConfirm.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    // 키 처리
    document.addEventListener('keydown', function escHandler(e) {
      if (!document.getElementById(OVERLAY_ID)) {
        document.removeEventListener('keydown', escHandler);
        return;
      }
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
        document.removeEventListener('keydown', escHandler);
      } else if (e.key === 'Enter') {
        cleanup();
        resolve(true);
        document.removeEventListener('keydown', escHandler);
      }
    });
  });
}