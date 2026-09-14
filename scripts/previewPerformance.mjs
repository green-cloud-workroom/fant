// Local UI fixture only. It cannot authenticate or connect to production Firebase.
// Usage: node scripts/previewPerformance.mjs [baseline-ref]
import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';

const root=process.cwd();
const baselineRef=process.argv[2];
const variants=baselineRef?['baseline','optimized']:['optimized'];
const fixture=resolve('tests/fixtures/firestore.mjs');
const output=resolve('output/performance-ui');
await mkdir(output,{recursive:true});
for(const variant of variants) {
  const dir=resolve(output,variant);
  const sourceOverride={
    name:'local-performance-fixture',enforce:'pre',
    load(id) {
      if(id.replaceAll('\\','/').endsWith('/src/firebase.js'))return `import {fixtureAuth} from '${resolve('tests/fixtures/auth.mjs').replaceAll('\\','/')}';export const db = {}; export const auth = fixtureAuth;`;
    },
    transform(code,id) {
      const file=relative(root,id).replaceAll('\\','/');
      if(file.startsWith('src/')&&file.endsWith('.js')&&file!=='src/firebase.js') {
        if(variant==='baseline')code=execFileSync('git',['show',baselineRef+':'+file],{encoding:'utf8'});
        if(file==='src/utils/date.js')code=code.replace('return formatKstDate(new Date());',"return '2026-09-14';");
        return code;
      }
    },
    transformIndexHtml: { order:'pre', handler(html) {
      // No remote fonts or other external resources in the fixture page.
      html=html.replace(/<link[^>]+href="https:[^>]+>/g,'');
      return html.replace('<div id="app"></div>',`<aside style="padding:6px;background:#fff3cd;font:12px monospace">LOCAL FIXTURE — ${variant} — 합성 데이터 / DB 요청당 50ms / 운영 DB 연결 없음 <span id="fixtureTiming">로딩 중</span><button id="measureWarm">재방문 20회 측정</button><button id="changeEgg">외부 계란 변경</button><button id="denyReads">조회 오류 전환</button><pre id="warmResults"></pre></aside><div id="app"></div>
<script type="module">
import { fixture } from '${fixture.replaceAll('\\','/')}';
let start=performance.now(),initialReads=0,measured=false;
let measureResolve;
document.getElementById('changeEgg').onclick=()=>{fixture.state.rows.eggStock[0].currentQty++;fixture.state.notify('eggStock/global');};
document.getElementById('denyReads').onclick=()=>{fixture.state.failures.add('eggStock/global');fixture.state.notify('eggStock/global');};
document.getElementById('measureWarm').onclick=async()=>{
 const samples=[];const move=menu=>new Promise(resolve=>{measureResolve=resolve;document.querySelector('[data-menu="'+menu+'"]').click();});
 for(let i=0;i<20;i++){await move('settings');samples.push(await move('main'));}
 const sorted=samples.map(s=>s.ms).sort((a,b)=>a-b);
 document.getElementById('warmResults').textContent=JSON.stringify({p50:sorted[9],p95:sorted[18],samples});
};
document.addEventListener('click',e=>{if(e.target.closest('.nav-btn')){start=performance.now();initialReads=fixture.state.reads.length;measured=false;}},true);
new MutationObserver(()=>{
 const content=document.getElementById('mainContent');
 if(!measured && content && content.children.length && !content.textContent.includes('로딩 중') && !content.textContent.includes('불러오지 못했습니다')) {
   measured=true;const began=start,reads=fixture.state.reads.length-initialReads;
   requestAnimationFrame(()=>requestAnimationFrame(()=>{
     const result={ms:Math.round(performance.now()-began),reads,writes:fixture.state.writes.length};
     document.getElementById('fixtureTiming').textContent=JSON.stringify(result);
     const done=measureResolve;measureResolve=null;done?.(result);
   }));
 }
}).observe(document.getElementById('app'),{childList:true,subtree:true});
</script>`);
    } },
  };
  await build({root,logLevel:'error',base:'/fant/',plugins:[sourceOverride],resolve:{alias:{'firebase/firestore':fixture,'firebase/auth':resolve('tests/fixtures/auth.mjs')}},build:{outDir:dir,emptyOutDir:false}});
  const port=variant==='baseline'?4301:4302;
  createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://localhost');
      const path=url.pathname.replace(/^\/fant\/?/,'')||'index.html';
      const file=resolve(dir,path);
      if(!file.startsWith(dir+ '\\')&&!file.startsWith(dir+'/'))throw Error('Outside fixture');
      const data=await readFile(file);res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':'text/html');res.end(data);
    } catch {res.statusCode=404;res.end('Not found');}
  }).listen(port,'127.0.0.1',()=>console.log(`${variant}: http://127.0.0.1:${port}/fant/`));
}
