const samples = [];
let sequence = 0;
export function startNavigation(route) {
  const sample = { id: ++sequence, route, start: performance.now(), reads: 0, cacheHits: 0 };
  samples.push(sample);
  if (samples.length > 200) samples.shift();
  return sample;
}
export function finishNavigation(sample, isCurrent) {
  if (!sample || !isCurrent()) return;
  sample.dataReadyMs = performance.now() - sample.start;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (isCurrent()) sample.firstContentMs = performance.now() - sample.start;
  }));
}
export function recordRead(hit = false) {
  const sample = samples.at(-1);
  if (sample) sample[hit ? 'cacheHits' : 'reads']++;
}
export function exportMetrics() { return samples.map(sample => ({ ...sample })); }
if (typeof window !== 'undefined') window.__fantPerformance = { export: exportMetrics };
