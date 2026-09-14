const env = import.meta.env || {};
export function performanceDisabled() {
  try { return sessionStorage.getItem('fant:perf:disable') === '1'; } catch { return false; }
}
export const flags = Object.freeze({
  shell: env.VITE_PERF_SHELL === 'true',
  store: env.VITE_PERF_STORE === 'true',
  routes: (env.VITE_PERF_ROUTES || '').split(',').filter(Boolean),
  viewMode: env.VITE_PRODUCTION_VIEW_MODE || 'legacy',
});
export function useSessionReads(route) {
  return flags.shell && flags.store && flags.routes.includes(route) && !performanceDisabled();
}
