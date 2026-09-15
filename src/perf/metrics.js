import { sessionStore } from '../state/sessionStore.js';
const samples = [];
const requests = new Map();
const reads = [];
let sequence = 0;
sessionStore.onClear(()=>{samples.length=0;reads.length=0;requests.clear();});
const now = () => typeof performance === 'undefined' ? Date.now() : performance.now();
export function requestNavigation(route) { requests.set(route, now()); }
export function startNavigation(route) {
  const sample = { id: ++sequence, route, start: requests.get(route) ?? now(), reads: 0, cacheHits: 0, status:'loading' };
  requests.delete(route);
  samples.push(sample);
  if (samples.length > 200) samples.shift();
  return sample;
}
export function finishNavigation(sample, isCurrent) {
  if (!sample || !isCurrent()) return;
  sample.dataReadyMs = now() - sample.start;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (isCurrent()) {
      sample.firstContentMs = now() - sample.start;
      sample.status = 'ready';
      const host = document.getElementById('mainContent');
      if(host?.dataset){host.dataset.pageReady=sample.route;host.dataset.pageTiming=JSON.stringify(sample);}
      if(host?.dataset?.viewStale==='true' && !host.querySelector('[data-view-freshness]')) {
        const status=document.createElement('p');status.dataset.viewFreshness='true';status.setAttribute('role','status');
        status.style.cssText='font-size:12px;color:#666;padding:4px 12px;margin:0';
        status.textContent='이전에 확인한 자료입니다. 최신 자료를 확인하고 있습니다.';
        host.prepend(status);
      }
    } else sample.status='cancelled';
  }));
}
export function failNavigation(sample) { if(sample)sample.status='failed'; }
export function recordRead(hit = false, detail = {}) {
  reads.push({at:now(),hit,...detail});
  if(reads.length>2000)reads.shift();
  const sample = samples.at(-1);
  if (sample?.status==='loading' && !String(detail.owner||'').startsWith('prepare:')) sample[hit ? 'cacheHits' : 'reads']++;
}
export function exportMetrics() { return samples.map(sample => ({ ...sample })); }
export function exportReadMetrics() { return reads.map(read=>({...read})); }
if (typeof window !== 'undefined') window.__fantPerformance = { export: exportMetrics, reads:exportReadMetrics };
