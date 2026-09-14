import { registerModalDismiss } from './modalManager.js';
export function hasChanged(field) {
  if (field.type === 'checkbox' || field.type === 'radio') return field.checked !== field.defaultChecked;
  if (field.tagName === 'SELECT') return field.value !== ([...field.options].find(option => option.defaultSelected) || field.options[0])?.value;
  return field.value !== field.defaultValue;
}
export function hasDirtyFields(root=document){return [...root.querySelectorAll('input,textarea,select')].some(hasChanged);}
export async function canLeavePage() {
  const fields = document.querySelectorAll('.modal-overlay input,.modal-overlay textarea,.modal-overlay select,.recipe-detail-panel input,.recipe-detail-panel textarea,.recipe-detail-panel select,.settings-section input,.settings-section textarea,.settings-section select');
  if (![...fields].some(field => hasChanged(field))) return true;
  // Keep the form and its values mounted until the user chooses to leave.
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay'; overlay.id = 'navigationConfirm'; overlay.style.zIndex = '20000';
    overlay.innerHTML = '<div class="modal-box"><h3>작성 중인 내용</h3><p>저장하지 않은 입력이 있습니다. 화면을 이동하시겠습니까?</p><div class="modal-actions"><button class="btn-secondary" data-stay>계속 작성</button><button class="btn-primary" data-leave>이동</button></div></div>';
    const finish = value => { unregister(); overlay.remove(); resolve(value); };
    const unregister = registerModalDismiss(() => finish(false));
    overlay.querySelector('[data-stay]').addEventListener('click', () => finish(false));
    overlay.querySelector('[data-leave]').addEventListener('click', () => finish(true));
    document.body.appendChild(overlay);
  });
}
