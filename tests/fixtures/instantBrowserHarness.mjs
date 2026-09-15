import { fixture } from './firestore.mjs';
const frame = () => new Promise(resolve=>requestAnimationFrame(resolve));
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
const quantile = (values,p) => [...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
const panel=document.createElement('aside');
panel.style.cssText='padding:8px;background:#e9f4ec;font:12px monospace';
panel.innerHTML='<button id="measureAllPages">전체 메뉴 50회 순환 측정</button> <button id="measureIdlePages">31초 휴지 후 순환 측정</button><pre id="allPageResults">측정 대기</pre>';
document.body.prepend(panel);
async function move(route) {
 const button=document.querySelector('[data-menu="'+route+'"]'),old=document.getElementById('mainContent');
 const start=performance.now(),before=fixture.state.reads.length;
 button.click();
 const end=performance.now()+15000;
 while(performance.now()<end){
  const host=document.getElementById('mainContent');
  if(host!==old && host?.textContent.trim() && !/로딩 중|불러오는 중/.test(host.textContent)) {
   if(/화면을 불러오지 못|로드 실패/.test(host.textContent))throw Error(route+': '+host.textContent);
   await frame();await frame();
   return {route,ms:performance.now()-start,reads:fixture.state.reads.length-before,chars:host.textContent.length};
  }
  await delay(5);
 }
 throw Error(route+': timeout');
}
async function run(rounds,idle=false){
 const result=document.getElementById('allPageResults'),samples=[],startedAt=new Date().toISOString();
 const routes=[...document.querySelectorAll('.nav-btn')].map(b=>b.dataset.menu);
 const initialRoute=document.querySelector('.nav-btn.active')?.dataset.menu;
 const initialReads=fixture.state.reads.length,initialWrites=fixture.state.writes.length;
 try {
  if(idle){result.textContent='31초 휴지 대기';await delay(31000);}
  for(let i=0;i<rounds;i++) {
   for(const route of routes){
    if(document.querySelector('.nav-btn.active')?.dataset.menu===route)continue;
    samples.push({...await move(route),round:i});
   }
   result.textContent='측정 중 '+(i+1)+'/'+rounds;
  }
  if(rounds>1 && initialRoute && samples.filter(s=>s.route===initialRoute).length<rounds)samples.push({...await move(initialRoute),round:rounds});
  const byRoute=Object.fromEntries(routes.map(route=>{
   const rows=samples.filter(s=>s.route===route),values=rows.map(s=>s.ms);
   return [route,{samples:rows.length,p50:quantile(values,.5),p95:quantile(values,.95),max:Math.max(...values),reads:rows.reduce((n,s)=>n+s.reads,0)}];
  }));
  const report={startedAt,finishedAt:new Date().toISOString(),fixture:'synthetic browser, 50ms/request, 30 types/300 meat lots',idle,
   byRoute,totalReads:fixture.state.reads.length-initialReads,writes:fixture.state.writes.length-initialWrites,samples};
  await fetch('/__instant-results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
  result.textContent=JSON.stringify({...report,samples:undefined},null,2);
 }catch(error){result.textContent='측정 실패: '+error.message;}
}
document.getElementById('measureAllPages').onclick=()=>run(50);
document.getElementById('measureIdlePages').onclick=()=>run(1,true);

const subButton=document.createElement('button');subButton.id='measureSubScreens';subButton.textContent='하위 탭·설정 내용 50회 측정';panel.prepend(subButton);
async function contentAfter(action,select,label){
 const start=performance.now();action();
 for(let i=0;i<3000;i++){
  const body=select(),text=body?.textContent||'';
  if(text.trim()&&!/로딩 중|불러오는 중/.test(text)){
   if(/불러오지 못|로드 실패/.test(text))throw Error(label+': '+text);
   await frame();await frame();return {route:label,ms:performance.now()-start,chars:text.length};
  }
  await delay(5);
 }
 throw Error(label+': timeout');
}
subButton.onclick=async()=>{
 const result=document.getElementById('allPageResults'),samples=[],startedAt=new Date().toISOString();
 const before=fixture.state.reads.length,writes=fixture.state.writes.length;
 try{
  for(let round=0;round<50;round++){
   for(const [route,selector,bodyId] of [['meat','#mainContent .tab-btn','#tabContent'],['stats','.stats-tab','#mainContent'],['frozenPan','#mainContent .tab-btn','#mainContent']]){
    if(document.querySelector('.nav-btn.active')?.dataset.menu!==route)await move(route);
    const tabs=[...document.querySelectorAll(selector)].map(button=>button.dataset.tab);
    for(const tab of tabs){
     samples.push({...await contentAfter(()=>document.querySelector(selector+'[data-tab="'+tab+'"]').click(),()=>document.querySelector(bodyId),route+':'+tab),round});
    }
   }
   await move('settings');
   const sections=[...document.querySelectorAll('.settings-section')];
   for(let index=0;index<sections.length;index++){
    const section=sections[index];
    samples.push({...await contentAfter(()=>section.querySelector('summary').click(),()=>section.querySelector('.settings-section-body'),'settings:'+index),round});
   }
   result.textContent='하위 화면 측정 '+(round+1)+'/50';
  }
  const labels=[...new Set(samples.map(s=>s.route))];
  const byRoute=Object.fromEntries(labels.map(route=>{const rows=samples.filter(s=>s.route===route),ms=rows.map(s=>s.ms);return [route,{samples:rows.length,p95:quantile(ms,.95),max:Math.max(...ms)}];}));
  const report={startedAt,finishedAt:new Date().toISOString(),subScreens:true,byRoute,samples,totalReads:fixture.state.reads.length-before,writes:fixture.state.writes.length-writes};
  await fetch('/__instant-results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(report)});
  result.textContent=JSON.stringify({...report,samples:undefined},null,2);
 }catch(error){result.textContent='하위 화면 측정 실패: '+error.message;}
};
