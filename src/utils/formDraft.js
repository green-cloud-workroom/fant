import { registerModalDismiss } from './modalManager.js';
const baselines=new WeakMap();
const controls=root=>[...root.querySelectorAll('input,textarea,select')];
const values=root=>JSON.stringify(controls(root).map(field=>[field.id,field.name,field.type,field.type==='checkbox'||field.type==='radio'?field.checked:field.value]));
export function markFieldsSaved(root,{extra}={}) {
  for(const field of controls(root)){
    if(field.type==='checkbox'||field.type==='radio')field.defaultChecked=field.checked;
    else if(field.tagName==='SELECT')for(const option of field.options)option.defaultSelected=option.selected;
    else field.defaultValue=field.value;
  }
  baselines.set(root,{values:values(root),extra,extraValue:JSON.stringify(extra?.())});
}
export function hasChanged(field) {
  if (field.type === 'checkbox' || field.type === 'radio') return field.checked !== field.defaultChecked;
  if (field.tagName === 'SELECT') return field.value !== ([...field.options].find(option => option.defaultSelected) || field.options[0])?.value;
  return field.value !== field.defaultValue;
}
export function hasDirtyFields(root=document){const saved=baselines.get(root);return saved?values(root)!==saved.values||JSON.stringify(saved.extra?.())!==saved.extraValue:controls(root).some(hasChanged);}
export async function canLeavePage() {
  const roots = document.querySelectorAll('.modal-overlay,.recipe-detail-panel,#productionForm,.settings-section,.supplement-page');
  if (![...roots].some(hasDirtyFields)) return true;
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
