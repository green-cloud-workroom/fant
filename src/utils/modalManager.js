const handlers = new Map();
let owner = null;
const dismissals = new Set();
export function registerCloseModal(menuId, close) { handlers.set(menuId, close); }
export function setModalOwner(menuId) { owner = menuId; }
export function registerModalDismiss(dismiss) { dismissals.add(dismiss); return () => dismissals.delete(dismiss); }
export function dismissAllModals() {
  for (const dismiss of [...dismissals]) dismiss();
  handlers.get(owner)?.();
  document.querySelectorAll('.modal-overlay').forEach(node => node.remove());
}
if (typeof window !== 'undefined') window.closeModal = () => handlers.get(owner)?.();
