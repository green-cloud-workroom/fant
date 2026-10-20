import { sessionStore } from '../state/sessionStore.js';
const samples = [];
const requests = new Map();
const reads = [];
const readResponses = [];
const phases = [];
let sequence = 0;
sessionStore.onClear(()=>{samples.length=0;reads.length=0;readResponses.length=0;phases.length=0;requests.clear();});
const now = () => typeof performance === 'undefined' ? Date.now() : performance.now();
export function recordPhase(name, start, status = 'ready', detail = {}) {
  phases.push({ name, start, durationMs: now() - start, status, ...detail });
  if (phases.length > 200) phases.shift();
}
export async function measurePhase(name, task, detail = {}) {
  const start = now(), epoch = sessionStore.epoch;
  try {
    const value = await task();
    if (epoch === sessionStore.epoch) recordPhase(name, start, 'ready', detail);
    return value;
  } catch (error) {
    if (epoch === sessionStore.epoch) recordPhase(name, start, 'failed', detail);
    throw error;
  }
}
export function recordReadResult(detail) {
  readResponses.push({ at: now(), ...detail });
  if (readResponses.length > 2000) readResponses.shift();
}
export function requestNavigation(route) { requests.set(route, now()); }
export function startNavigation(route) {
  const sample = { id: ++sequence, route, start: requests.get(route) ?? now(), reads: 0, cacheHits: 0,
    visibilityAtStart: typeof document === 'undefined' ? 'unknown' : document.visibilityState, status:'loading' };
  requests.delete(route);
  samples.push(sample);
  if (samples.length > 200) samples.shift();
  return sample;
}
export function observeNavigationContent(sample, host, isCurrent) {
  if (!sample || !host || typeof MutationObserver === 'undefined') return;
  const mark = () => {
    if (!isCurrent()) { observer.disconnect(); return; }
    if (sample.domReadyMs !== undefined) return;
    // Headers and empty controls can precede the actual view model.
    if (host.querySelector('table, canvas, .production-card, .stock-summary-cell, .detail-body, .stats-detail-area table')) {
      sample.domReadyMs = now() - sample.start;
      observer.disconnect();
    }
  };
  const observer = new MutationObserver(mark);
  observer.observe(host,{childList:true,subtree:true});
  sample.markContent = mark;
  sample.stopContentObserver = () => observer.disconnect();
}
export function finishNavigation(sample, isCurrent) {
  if (!sample || !isCurrent()) return;
  sample.markContent?.();
  sample.stopContentObserver?.();
  delete sample.markContent;
  delete sample.stopContentObserver;
  sample.dataReadyMs = now() - sample.start;
  sample.domReadyMs ??= sample.dataReadyMs;
  const host = document.getElementById('mainContent');
  if (host?.querySelector?.('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')) {
    sample.interactionReadyMs = sample.dataReadyMs;
  }
  sample.status = 'ready';
  if(host?.dataset){host.dataset.pageReady=sample.route;host.dataset.pageTiming=JSON.stringify(sample);}
  if(host?.dataset?.viewStale==='true' && !host.querySelector('[data-view-freshness]')) {
    const status=document.createElement('p');status.dataset.viewFreshness='true';status.setAttribute('role','status');
    status.style.cssText='font-size:12px;color:#666;padding:4px 12px;margin:0';
    status.textContent='이전에 확인한 자료입니다. 최신 자료를 확인하고 있습니다.';
    host.prepend(status);
  }
  if (sample.visibilityAtStart === 'hidden' || document.visibilityState === 'hidden') { sample.frameStatus = 'background'; return; }
  const frameStart = now();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (isCurrent() && document.visibilityState !== 'hidden') {
      sample.firstContentMs = now() - sample.start;
      sample.frameWaitMs = now() - frameStart;
      sample.frameStatus = 'foreground';
      if(host?.dataset)host.dataset.pageTiming=JSON.stringify(sample);
    } else sample.frameStatus = 'background-or-navigated';
  }));
}
export function failNavigation(sample) { if(sample){sample.stopContentObserver?.();delete sample.markContent;delete sample.stopContentObserver;sample.status='failed';} }
export function recordRead(hit = false, detail = {}) {
  reads.push({at:now(),hit,...detail});
  if(reads.length>2000)reads.shift();
  const sample = samples.at(-1);
  if (sample?.status==='loading' && !String(detail.owner||'').startsWith('prepare:')) sample[hit ? 'cacheHits' : 'reads']++;
}
export function exportMetrics() { return samples.map(sample => ({ ...sample })); }
export function exportReadMetrics() { return reads.map(read=>({...read})); }
export function exportReadResponseMetrics() { return readResponses.map(read=>({...read})); }
export function exportPhaseMetrics() { return phases.map(phase=>({...phase})); }
if (typeof window !== 'undefined') window.__fantPerformance = { export: exportMetrics, reads:exportReadMetrics, responses:exportReadResponseMetrics, phases:exportPhaseMetrics };
