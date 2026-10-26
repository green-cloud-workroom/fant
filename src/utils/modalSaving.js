// Lock only the currently submitted modal; a continuation may mount a new one.
// Restore original disabled/inert states rather than enabling every control.
export function lockModalWhileSaving() {
  const overlay = document.getElementById?.('modalOverlay')
    || document.getElementById?.('equipmentModalOverlay');
  if (!overlay) return () => {};
  const box = overlay.querySelector('.modal-box') || overlay;
  const fields = [...box.querySelectorAll('input,select,textarea,button')]
    .map(field => [field, field.hasAttribute('disabled')]);
  const wasInert = box.hasAttribute('inert');
  const busy = overlay.getAttribute('aria-busy');
  box.setAttribute('inert', '');
  overlay.setAttribute('aria-busy', 'true');
  for (const [field] of fields) field.setAttribute('disabled', '');
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.className = 'modal-saving-status';
  status.textContent = '저장 중입니다. 잠시 기다려주세요.';
  overlay.appendChild(status);
  return () => {
    status.remove();
    if (!wasInert) box.removeAttribute('inert');
    if (busy === null) overlay.removeAttribute('aria-busy');
    else overlay.setAttribute('aria-busy', busy);
    for (const [field, disabled] of fields) {
      if (!disabled) field.removeAttribute('disabled');
    }
  };
}
