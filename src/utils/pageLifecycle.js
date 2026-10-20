let active = null;
let sequence = 0;
export function beginPage(host, menuId) {
  disposePage();
  const context = { host, menuId, epoch: ++sequence, disposed: false, cleanups: new Set() };
  context.isCurrent = () => active === context && !context.disposed && host.isConnected;
  active = context;
  return context;
}
export function registerPageCleanup(cleanup) {
  const owner = active;
  owner?.cleanups.add(cleanup);
  return () => owner?.cleanups.delete(cleanup);
}
export function disposePage() {
  const old = active; active = null;
  if (!old) return;
  old.disposed = true;
  for (const cleanup of old.cleanups) {
    try { cleanup(); } catch (error) { console.error('[화면 정리]', error); }
  }
  old.cleanups.clear();
}
export function getPageContext() { return active; }
