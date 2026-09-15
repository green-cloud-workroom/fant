import { exportMetrics, exportReadMetrics } from './metrics.js';
import { inspectPageResources } from '../state/pageResources.js';
import { displayPool } from '../state/displayReads.js';
import { sessionStore } from '../state/sessionStore.js';

// Explicit diagnostic URL only; no document contents, identifiers or auth tokens.
export function installDiagnostics() {
  if(!new URLSearchParams(location.search).has('diagnostics') || document.getElementById('performanceDiagnostics'))return;
  const panel=document.createElement('details');panel.id='performanceDiagnostics';
  panel.style.cssText='position:fixed;bottom:8px;right:8px;z-index:9999;max-width:640px;max-height:60vh;overflow:auto;background:#fff;border:1px solid #aaa;padding:8px;font:12px monospace';
  const summary=document.createElement('summary');summary.textContent='성능 진단';
  const button=document.createElement('button');button.textContent='측정 결과 갱신';
  const output=document.createElement('pre');output.id='performanceDiagnosticsResult';
  const refresh=()=>{output.textContent=JSON.stringify({at:new Date().toISOString(),epoch:sessionStore.epoch,
    models:inspectPageResources(),listeners:displayPool.inspect(),heapBytes:performance.memory?.usedJSHeapSize??null,
    navigation:exportMetrics(),readRequests:exportReadMetrics()},null,2);};
  button.addEventListener('click',refresh);
  panel.addEventListener('toggle',()=>{if(panel.open)refresh();});
  panel.append(summary,button,output);document.body.append(panel);
}
