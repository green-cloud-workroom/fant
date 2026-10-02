// Isolated browser fixture: no Firebase authentication or operational database connection.
import {build} from 'vite';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {makeFirestore} from '../tests/fixtures/firestore.mjs';
import {publicMainModel,serializePublicModel} from '../src/domain/publicMainModel.js';
import {DASHBOARD_LOGIC_VERSION} from '../src/config/dashboardCompatibility.js';
const backend=resolve('C:/dev/fant-inventory-dashboard/functions/lib/productionDashboard');
const {dayFact,buildOverview}=await import(pathToFileURL(resolve(backend,'domain.js')));
const {createCalendar}=await import(pathToFileURL(resolve(backend,'generated/calendar.js')));
const {payloadHash}=await import(pathToFileURL(resolve(backend,'chunks.js')));
const fake=makeFirestore(),rows=fake.state.rows;
// Firestore's default query order is document ID, including equal-time log ties.
for(const list of Object.values(rows))list.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
const calendar=createCalendar(rows.holidays),dates=new Set([fake.today,...rows.productions.map(p=>p.date)]);
for(const date of [...dates])dates.add(calendar.getNextBusinessDayByType(date));
const facts=[...dates].map(date=>({...dayFact(date,rows),appliedGeneration:1,logicVersion:DASHBOARD_LOGIC_VERSION}));
const lastClosed=rows.closings.filter(r=>r.status==='closed').map(r=>r.id).sort().at(-1)||null;
const model=serializePublicModel(publicMainModel(buildOverview(fake.today,rows,facts,lastClosed)));
const root={id:'v1__'+fake.today,schemaVersion:1,logicVersion:DASHBOARD_LOGIC_VERSION,date:fake.today,readModelMode:'serve',controlRevision:1,generation:1,requestedGeneration:1,buildId:'fixture',rebuildState:'ready',model,modelHash:payloadHash(model),chunks:[]};
const output=resolve('output/summary-ui');await mkdir(output,{recursive:true});
const fixture=resolve('tests/fixtures/firestore.mjs').replaceAll('\\','/'),wrapper=resolve(output,'firestore-fixture.mjs');
await writeFile(wrapper,`import {fixture} from '${fixture}';export * from '${fixture}';export const Timestamp={fromMillis:ms=>({toMillis:()=>ms})};fixture.state.rows.productionDashboardViews=[${JSON.stringify(root)}];document.getElementById('summaryOff').onclick=()=>{fixture.state.rows.productionDashboardViews[0].readModelMode='off';fixture.state.notify('productionDashboardViews/v1__2026-09-14');};document.getElementById('summaryCorrupt').onclick=()=>{fixture.state.rows.productionDashboardViews[0].modelHash='invalid';fixture.state.notify('productionDashboardViews/v1__2026-09-14');};setInterval(()=>{document.getElementById('summaryReads').textContent=JSON.stringify({reads:fixture.state.reads,writes:fixture.state.writes.length})},500);`);
Object.assign(process.env,{VITE_PERF_SHELL:'true',VITE_PERF_STORE:'true',VITE_PERF_ROUTES:'main',VITE_PRODUCTION_VIEW_MODE:'summary'});
await build({base:'/fant/',logLevel:'error',resolve:{alias:{'firebase/firestore':wrapper,'firebase/auth':resolve('tests/fixtures/auth.mjs')}},plugins:[{name:'summary-fixture',enforce:'pre',load(id){if(id.replaceAll('\\','/').endsWith('/src/firebase.js'))return `import {fixtureAuth} from '${resolve('tests/fixtures/auth.mjs').replaceAll('\\','/')}';export const db={};export const auth=fixtureAuth;`;},transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/utils/date.js'))return code.replace('return formatKstDate(new Date());',"return '2026-09-14';");},transformIndexHtml(html){return html.replace(/<link[^>]+href="https:[^>]+>/g,'').replace('<div id="app"></div>',`<aside>LOCAL SUMMARY FIXTURE — 운영 DB 연결 없음 <button id="summaryOff">요약 끄기</button><button id="summaryCorrupt">요약 변조</button><pre id="summaryReads"></pre></aside><div id="app"></div>`);}}],build:{outDir:resolve(output,'dist'),emptyOutDir:true}});
const dir=resolve(output,'dist');createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname.replace(/^\/fant\/?/,'')||'index.html',file=resolve(dir,path);if(!file.startsWith(dir+'/')&&!file.startsWith(dir+'\\'))throw Error('Outside fixture');res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':'text/html');res.end(await readFile(file))}catch{res.statusCode=404;res.end('Not found')}}).listen(4303,'127.0.0.1',()=>console.log('http://127.0.0.1:4303/fant/'));
