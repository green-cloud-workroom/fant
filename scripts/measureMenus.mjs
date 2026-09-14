import {performance} from 'node:perf_hooks';
import {mkdir,writeFile} from 'node:fs/promises';
import {pageEnvironment} from '../tests/helpers/pageDom.mjs';

const routes={production:'renderProduction',schedule:'renderSchedule',frozenProduct:'renderFrozenProduct',frozenPan:'renderFrozenPan',frozenSep:'renderFrozenSep',freezeOp:'renderFreezeOp',meat:'renderMeat'};
const report={measuredAt:new Date().toISOString(),environment:'Node VM + DOM fixture, 50 ms per Firestore request, no CPU throttle; not production browser timing',baseline:'61af19a2d1e48f81877ab2f28fbe07774ebeca84',samples:20,routes:{}};
const p95=values=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1];
for(const [route,render]of Object.entries(routes)){
 const byMode={};
 for(const mode of ['baseline','retained']){
  const cold=[],warm=[],coldReads=[],warmReads=[];
  for(let i=0;i<20;i++){
   const e=await pageEnvironment(route,{baselineRef:mode==='baseline'?report.baseline:undefined,latencyMs:50});
   try{
    let count=e.state.reads.length,start=performance.now();await e.page[render]({force:true});
    if(route==='meat')while(e.document.getElementById('tabContent')?.textContent.includes('로딩 중'))await new Promise(r=>setTimeout(r,2));
    cold.push(performance.now()-start);coldReads.push(e.state.reads.length-count);
    count=e.state.reads.length;start=performance.now();await e.page[render]();
    if(route==='meat')while(e.document.getElementById('tabContent')?.textContent.includes('로딩 중'))await new Promise(r=>setTimeout(r,2));
    warm.push(performance.now()-start);warmReads.push(e.state.reads.length-count);
   }finally{await e.cleanup();}
  }
  byMode[mode]={coldP95Ms:Math.round(p95(cold)),warmP95Ms:Math.round(p95(warm)),coldReadsP95:p95(coldReads),warmReadsP95:p95(warmReads),cold,warm};
 }
 report.routes[route]=byMode;console.log(route,JSON.stringify(Object.fromEntries(Object.entries(byMode).map(([mode,data])=>[mode,{...data,cold:undefined,warm:undefined}]))));
}
await mkdir('output/readpath',{recursive:true});await writeFile('output/readpath/menu-performance.json',JSON.stringify(report,null,2));
