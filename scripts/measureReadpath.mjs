// Synthetic source data only, no production Firebase connection.
import { environment } from '../tests/helpers/modules.mjs';
import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
const samples=[];
for(const latencyMs of [50,150]) for(const variant of ['baseline','session']) {
  for(let i=0;i<20;i++) {
    const env=await environment({latencyMs,baselineRef:variant==='baseline'?'dddae06':undefined,session:variant==='session'});
    const main=await env.load('src/pages/main.js');
    const reads=variant==='session'?await env.load('src/state/displayReads.js'):null;
    const begin=performance.now();await main.loadAllData(reads?.createDisplayScope('main'));
    samples.push({variant,latencyMs,kind:'cold-data-ready',ms:performance.now()-begin,reads:env.state.reads.length,writes:env.state.writes.length});
    const count=env.state.reads.length,start=performance.now();await main.loadAllData(reads?.createDisplayScope('main'));
    samples.push({variant,latencyMs,kind:'warm-model-rebuild',ms:performance.now()-start,reads:env.state.reads.length-count,writes:env.state.writes.length});
    reads?.displayPool.dispose();
  }
}
const groups=[];
for(const latencyMs of [50,150])for(const variant of ['baseline','session'])for(const kind of ['cold-data-ready','warm-model-rebuild']){
  const rows=samples.filter(s=>s.latencyMs===latencyMs&&s.variant===variant&&s.kind===kind);const times=rows.map(s=>s.ms).sort((a,b)=>a-b);
  groups.push({variant,latencyMs,kind,count:rows.length,p50:Math.round(times[9]),p95:Math.round(times[18]),reads:[...new Set(rows.map(s=>s.reads))],writes:[...new Set(rows.map(s=>s.writes))]});
}
await mkdir('output/readpath',{recursive:true});await writeFile('output/readpath/measurement.json',JSON.stringify({environment:'Node VM synthetic data, no DOM paint, no production DB',baseline:'dddae06',groups,samples},null,2));
console.log(JSON.stringify(groups,null,2));
