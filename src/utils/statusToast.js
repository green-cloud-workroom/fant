export function showStatus(message) {
  document.getElementById('actionStatus')?.remove();
  const node=document.createElement('div');
  node.id='actionStatus';node.setAttribute('role','status');node.setAttribute('aria-live','polite');
  node.textContent=message;
  node.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:30000;background:#315c40;color:white;padding:12px 20px;border-radius:8px;max-width:90vw;pointer-events:none;box-shadow:0 2px 10px #0003';
  document.body.appendChild(node);
  const timer=setTimeout(()=>node.remove(),3000);timer.unref?.();
}
