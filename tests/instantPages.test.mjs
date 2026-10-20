import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { environment } from './helpers/modules.mjs';
import { pageEnvironment } from './helpers/pageDom.mjs';

async function setup() {
  const routes = ['production','meat','egg','bag','supplement','frozenProduct','frozenPan','frozenSep','schedule','equipment','recipe','stats','settings','freezeOp'];
  const e = await environment({ session: true, instantRoutes: routes });
  e.synthetic(resolve('src/firebase.js'), { db: {}, auth: { currentUser: { uid: 'fixture', getIdTokenResult: async () => ({ claims: { roles: { production: 'office' } } }) } } });
  const lifecycle = await e.load('src/utils/pageLifecycle.js');
  const resources = await e.load('src/state/pageResources.js');
  const ref = e.api.collection({}, 'recipes');
  const loader = async scope => (await scope.getDocs(ref)).docs.map(d => ({ id: d.id, ...d.data() }));
  return { ...e, routes, lifecycle, resources, ref, loader };
}

test('a change during the first read schedules a fresh model', async () => {
  const e = await setup(), resource = e.resources.pageResource('production');
  e.lifecycle.beginPage(e.nodes.mainContent, 'production');
  let changed = false, refreshed;
  const refreshedPromise = new Promise(resolve => { refreshed = resolve; });
  const loader = async scope => {
    const rows = (await scope.getDocs(e.ref)).docs.map(d => ({ id: d.id, ...d.data() }));
    if (!changed) {
      changed = true;
      e.state.rows.recipes[0].name = 'new server value';
      await e.state.notify('recipes');
    }
    return rows;
  };
  const first = await resource.load(loader, { onChange: refreshed });
  assert.notEqual(first[0].name, 'new server value');
  await refreshedPromise;
  assert.equal((await resource.load(loader))[0].name, 'new server value');
});

test('repeated equal reads compare once while distinct date queries remain separate', async () => {
  const e=await setup(),resource=e.resources.pageResource('production');
  e.lifecycle.beginPage(e.nodes.mainContent,'production');
  await resource.load(async scope=>{
    await Promise.all(Array.from({length:61},()=>scope.getDocs(e.api.collection({},'recipes'))));
    await scope.getDocs(e.api.query(e.api.collection({},'productions'),e.api.where('date','==','2026-09-01')));
    await scope.getDocs(e.api.query(e.api.collection({},'productions'),e.api.where('date','==','2026-09-02')));
    return {ok:true};
  });
  assert.equal(resource.observations.length,3);
  assert.equal(e.state.reads.length,3);
});

test('active preparation above budget survives activation and trims once inactive',async()=>{
  const e=await setup(),resource=e.resources.pageResource('production');
  e.state.rows.recipes[0].payload='x'.repeat(34*1024*1024);
  e.lifecycle.beginPage(e.nodes.mainContent,'production');
  await resource.load(e.loader);
  assert.ok(resource.entries.get('default')?.revision);
  await resource.load(e.loader,{key:'another-date'});
  assert.equal(resource.entries.has('default'),false);
  assert.ok(resource.entries.get('another-date')?.revision);
  e.lifecycle.beginPage({isConnected:true},'other');
  assert.equal(resource.entries.size,0);
});
test('every basic menu survives a full loop without extra reads or mutable cache contamination', async () => {
  const e = await setup();
  for (const route of e.routes) {
    e.lifecycle.beginPage(e.nodes.mainContent, route);
    const model = await e.resources.pageResource(route).load(e.loader);
    model[0].name = 'unsaved';
  }
  const reads = e.state.reads.length;
  for (const route of e.routes) {
    e.lifecycle.beginPage(e.nodes.mainContent, route);
    const model = await e.resources.pageResource(route).load(e.loader);
    assert.notEqual(model[0].name, 'unsaved');
  }
  assert.equal(e.state.reads.length, reads);
  assert.equal(e.resources.inspectPageResources().filter(r => r.cached).length, e.routes.length);
});
test('background preparation cannot replace the active form comparison baseline', async () => {
  const e = await setup(), resource = e.resources.pageResource('recipe');
  e.lifecycle.beginPage(e.nodes.mainContent, 'recipe');
  const shown = await resource.load(e.loader);
  const baseline = resource.observations;
  e.state.rows.recipes[0].name = 'external B';
  await resource.prepare('default', e.loader, { force: true });
  assert.equal(resource.observations, baseline);
  assert.equal(resource.model[0].name, shown[0].name);
  let writes = 0;
  const commands = await e.load('src/services/readCommand.js');
  await assert.rejects(() => commands.withReadCommand(resource, command => command.commit({ commit: async () => writes++ })), /원본이 변경/);
  assert.equal(writes, 0);
});

test('leaving a page keeps only data and releases the old DOM context and callback',async()=>{
 const e=await setup(),resource=e.resources.pageResource('recipe');
 e.lifecycle.beginPage(e.nodes.mainContent,'recipe');await resource.load(e.loader,{onChange:()=>{}});
 e.lifecycle.beginPage({isConnected:true},'other');
 assert.equal(resource.context,null);assert.equal(resource.onChange,null);
 assert.ok(resource.entries.get('default').revision);
});

test('changing the displayed key inside one page cancels the previous form command',async()=>{
 const e=await setup(),resource=e.resources.pageResource('production');
 e.lifecycle.beginPage(e.nodes.mainContent,'production');await resource.load(e.loader,{key:'today'});
 const {withReadCommand}=await e.load('src/services/readCommand.js');let writes=0;
 await assert.rejects(()=>withReadCommand(resource,async command=>{
  await resource.load(e.loader,{key:'tomorrow'});
  await command.commit({commit:async()=>writes++});
 }),/표시된 화면이 변경/);
 assert.equal(writes,0);
});
test('preparation is independent of current DOM and discarded on session transition', async () => {
  const e = await setup(), resource = e.resources.pageResource('production');
  e.lifecycle.beginPage(e.nodes.mainContent, 'recipe');
  let finish;
  const pending = resource.prepare('today', () => new Promise(resolve => finish = resolve));
  e.lifecycle.beginPage(e.nodes.mainContent, 'egg');
  finish([{ id: 'ready' }]);
  assert.equal((await pending).model[0].id, 'ready');
  assert.equal(resource.viewRevision, null);
  const late = resource.prepare('tomorrow', () => new Promise(resolve => finish = resolve));
  (await e.load('src/state/sessionStore.js')).sessionStore.clear();
  finish([{ id: 'old user' }]);
  assert.equal(await late, null);
  assert.equal(resource.entries.size, 0);
});
test('disconnected models display immediately and refresh without rebasing the displayed revision', async () => {
  const e = await setup(), resource = e.resources.pageResource('recipe');
  e.lifecycle.beginPage(e.nodes.mainContent, 'recipe');
  await resource.load(e.loader);
  const old = resource.viewRevision;
  resource.disconnect();
  let finish, changed = 0;
  const cached = await resource.load(() => new Promise(resolve => finish = resolve), { onChange: () => changed++ });
  assert.equal(cached[0].id, old.model[0].id);
  finish([{ id: 'new' }]);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(resource.viewRevision, old);
  assert.equal(changed, 1);
  assert.equal((await resource.load(e.loader))[0].id, 'new');
});
test('date keys stay separate and concurrent preparation joins one read', async () => {
  const e = await setup(), resource = e.resources.pageResource('production');
  let finish, calls = 0;
  const loader = () => { calls++; return new Promise(resolve => finish = resolve); };
  const first = resource.prepare('2026-09-15', loader);
  const second = resource.prepare('2026-09-15', loader);
  finish(['today']);
  assert.equal((await first).id, (await second).id);
  assert.equal(calls, 1);
  await resource.prepare('2026-09-16', async () => ['tomorrow']);
  e.lifecycle.beginPage(e.nodes.mainContent, 'production');
  assert.equal((await resource.load(loader, { key: '2026-09-15' }))[0], 'today');
});

test('cache-only preparation never starts a missing query or changes the current view', async()=>{
 const e=await setup(),resource=e.resources.pageResource('recipe');
 await assert.rejects(()=>resource.prepare('default',e.loader,{cacheOnly:true}),error=>error.code==='cache-miss');
 assert.equal(e.state.reads.length,0);
 assert.equal(resource.viewRevision,null);
 assert.equal(resource.entries.size,0);
});

test('a foreground visit retries a joined cache-only miss through the normal reader',async()=>{
 const e=await setup(),resource=e.resources.pageResource('recipe');
 let release;
 const warming=resource.prepare('default',async scope=>{await new Promise(resolve=>release=resolve);return e.loader(scope);},{cacheOnly:true});
 const rejected=assert.rejects(()=>warming,error=>error.code==='cache-miss');
 e.lifecycle.beginPage(e.nodes.mainContent,'recipe');
 const foreground=resource.load(e.loader);
 release();await rejected;
 assert.ok((await foreground).length);
 assert.equal(e.state.reads.length,1);
});

test('a swallowed cache miss cannot become a confirmed empty model',async()=>{
 const e=await setup(),resource=e.resources.pageResource('recipe');
 await assert.rejects(()=>resource.prepare('default',async scope=>{
  try{return await e.loader(scope);}catch{return [];}
 },{cacheOnly:true}),error=>error.code==='cache-miss');
 assert.equal(resource.entries.size,0);
});

test('main pure preparation matches the original full model and never flushes automatic logs',async()=>{
 const e=await environment({session:true,instantRoutes:['main'],instrument:{'src/pages/main.js':'\nexport {prepareMainModel};'}});
 const page=await e.load('src/pages/main.js');
 const scope=(await e.load('src/services/serverReadScope.js')).createServerReadScope();
 const prepared=await page.prepareMainModel(scope);
 assert.equal(e.state.reads.filter(r=>r.path==='productions'&&r.kind==='query'&&r.conditions.length===0).length,0);
 assert.ok(e.state.reads.some(r=>r.path==='productions'&&r.conditions.some(c=>c.type==='where'&&c.field==='date'&&c.op==='in')));
 assert.equal(e.state.reads.filter(r=>r.path==='productions'&&r.conditions.some(c=>c.type==='order'&&c.field==='sortOrder')).length,0);
 await page.loadAllData((await e.load('src/services/serverReadScope.js')).createServerReadScope(),{autoLogsEnabled:false});
 const expected=page.testState();
 for(const [key,value] of Object.entries(expected))assert.equal(JSON.stringify(prepared[key]),JSON.stringify(value),key);
 assert.equal(e.state.writes.length,0);
});

test('production preview is available before logs but does not install an incomplete model',async()=>{
 const e=await environment({session:true,instantRoutes:['main'],instrument:{'src/pages/main.js':
  '\nexport {prepareMainModel}; export function deferLogs(task){fetchCombinedLogs=task;}'}});
 const page=await e.load('src/pages/main.js');
 let finishLogs,previewReady;
 page.deferLogs(()=>new Promise(resolve=>{finishLogs=resolve;}));
 const preview=new Promise(resolve=>{previewReady=resolve;});
 const before=JSON.stringify(page.testState());let completed=false;
 const pending=page.prepareMainModel((await e.load('src/services/serverReadScope.js')).createServerReadScope(),{
  onProductionReady:previewReady,
 }).then(model=>{completed=true;return model;});
 const data=await preview;
 assert.equal(completed,false);assert.equal(JSON.stringify(page.testState()),before);
 assert.ok(Array.isArray(data.allProds));assert.equal(e.state.writes.length,0);
 finishLogs([]);const model=await pending;
 assert.equal(model.overdueClosingDate,data.overdueClosing?.date||null);
 assert.equal(e.state.writes.length,0);
});

test('an auxiliary read failure after preview still rejects the full model',async()=>{
 const e=await environment({session:true,instantRoutes:['main'],instrument:{'src/pages/main.js':
  '\nexport {prepareMainModel}; export function deferLogs(task){fetchCombinedLogs=task;}'}});
 const page=await e.load('src/pages/main.js');let failLogs,previewReady;
 page.deferLogs(()=>new Promise((resolve,reject)=>{failLogs=reject;}));
 const preview=new Promise(resolve=>{previewReady=resolve;});
 const before=JSON.stringify(page.testState());
 const pending=page.prepareMainModel((await e.load('src/services/serverReadScope.js')).createServerReadScope(),{onProductionReady:previewReady});
 const rejected=assert.rejects(()=>pending,/logs offline/);
 await preview;failLogs(new Error('logs offline'));await rejected;
 assert.equal(JSON.stringify(page.testState()),before);assert.equal(e.state.writes.length,0);
});

test('production preview selects the overdue date and exposes no receipt controls',async()=>{
 const e=await pageEnvironment('main',{instantRoutes:['main'],instrument:'\nexport {renderProductionPreview};'});
 try {
  const before=JSON.stringify(e.page.testState()),date='2026-09-01';
  e.page.renderProductionPreview({today:e.today,nextBizDay:'2026-09-15',recipeRows:[],
   completionDoc:{status:'completed'},overdueClosing:{date,closed:true},allProds:[
    {id:'past',date,category:'raw',recipeName:'과거 생산',productionUnitQty:1},
    {id:'deleted',date,status:'deleted',recipeName:'삭제 생산'},
    {id:'today',date:e.today,recipeName:'오늘 생산'},
   ]});
  const host=e.document.getElementById('mainContent');
  assert.ok(host.textContent.includes(date));assert.ok(host.textContent.includes('과거 생산'));
  assert.equal(host.textContent.includes('삭제 생산'),false);assert.equal(host.textContent.includes('오늘 생산'),false);
  assert.equal(host.querySelector('.receivable,button,input,select,textarea'),null);
  assert.equal(JSON.stringify(e.page.testState()),before);assert.equal(e.state.writes.length,0);
 } finally {await e.cleanup();}
});

test('main shared production read keeps unordered historical rows in closing checks',async()=>{
 const e=await environment({session:true,instantRoutes:['main'],instrument:{'src/pages/main.js':'\nexport {prepareMainModel};'}});
 e.state.rows.productions.push({id:'old-unordered',date:e.dates[5],status:'completed',received:false,category:'raw'});
 const page=await e.load('src/pages/main.js');
 const scope=(await e.load('src/services/serverReadScope.js')).createServerReadScope();
 const model=await page.prepareMainModel(scope);
 assert.equal(model.overdueClosingDate,e.dates[5]);
 assert.equal(model.overdueProductions.some(row=>row.id==='old-unordered'),false);
 assert.equal(e.state.reads.filter(r=>r.path==='productions'&&r.kind==='query'&&r.conditions.length===0).length,0);
});

test('main keeps Firestore document order when production sort orders tie',async()=>{
 const e=await environment({session:true,instantRoutes:['main'],instrument:{'src/pages/main.js':'\nexport {prepareMainModel};'}});
 const original=e.state.rows.productions.find(row=>row.date===e.today);
 e.state.rows.productions=e.state.rows.productions.filter(row=>row.date!==e.today);
 e.state.rows.productions.push({...original,id:'Z',sortOrder:1},{...original,id:'a',sortOrder:1});
 const page=await e.load('src/pages/main.js');
 const model=await page.prepareMainModel((await e.load('src/services/serverReadScope.js')).createServerReadScope());
 assert.deepEqual(Array.from(model.productions,row=>row.id),['Z','a']);
});

test('nested events stay isolated while two DOM fixtures coexist',async()=>{
 const first=await pageEnvironment('main'),second=await pageEnvironment('settings');
 try {
  let firstClicks=0,secondClicks=0;
  for(const [e,clicked] of [[first,()=>firstClicks++],[second,()=>secondClicks++]]) {
   e.document.getElementById('mainContent').innerHTML='<section><button>nested action</button></section>';
   e.document.querySelector('section').querySelector('button').addEventListener('click',clicked);
  }
  await first.fire('button');assert.equal(firstClicks,1);assert.equal(secondClicks,0);
  await first.cleanup();await second.fire('button');assert.equal(secondClicks,1);
 } finally {await first.cleanup();await second.cleanup();}
});

test('all eight setting sections retain real values without additional reads on revisit',async()=>{
 const e=await pageEnvironment('settings',{instantRoutes:['settings']});
 try{
  async function openSections(){
   for(const section of e.document.querySelectorAll('.settings-section')){
    section.open=true;await e.fire(section,'toggle');
    assert.ok(section.querySelector('.settings-section-body').textContent.length>0);
    assert.ok(!section.textContent.includes('자료를 불러오지 못했습니다'));
   }
  }
  await e.page.renderSettings();await openSections();
  const reads=e.state.reads.length;
  await e.page.renderSettings();await openSections();
  assert.equal(e.state.reads.length,reads);
  assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});

for(const [route,render] of Object.entries({production:'renderProduction',meat:'renderMeat',bag:'renderBag',egg:'renderEgg',
 supplement:'renderSupplement',schedule:'renderSchedule',equipment:'renderEquipment',recipe:'renderRecipe',
 frozenProduct:'renderFrozenProduct',frozenPan:'renderFrozenPan',frozenSep:'renderFrozenSep',freezeOp:'renderFreezeOp'})) {
 test(route+': activated instant model preserves actual rendered content and warm reads',async()=>{
  const e=await pageEnvironment(route,{instantRoutes:[route]});
  try{
   await e.page[render]();
   const content=e.nodes.mainContent.textContent,reads=e.state.reads.length;
   await e.page[render]();
   assert.equal(e.nodes.mainContent.textContent,content);
   assert.equal(e.state.reads.length,reads);
   assert.equal(e.state.writes.length,0);
  }finally{await e.cleanup();}
 });
}

test('an unclosed frozen order can be removed through its real button',async()=>{
 const e=await pageEnvironment('frozenPan',{instantRoutes:['frozenPan']});
 try{
  await e.page.renderFrozenPan();
  await e.fire('[data-tab="frozenPan"]');
  await e.fire('.btn-order-delete');
  assert.equal(e.state.rows.frozenPanStock[0].status,'cancelled',e.alerts.join('\n'));
 }finally{await e.cleanup();}
});
