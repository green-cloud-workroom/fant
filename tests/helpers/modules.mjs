import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { makeFirestore } from '../fixtures/firestore.mjs';

export async function environment(options = {}) {
  const fake = makeFirestore(options);
  const root = resolve('.');
  const nodes = { mainContent:{isConnected:true,innerHTML:''} };
  class TestDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-09-14T01:00:00Z'])); }
    static now() { return Date.parse('2026-09-14T01:00:00Z'); }
  }
  const context=vm.createContext({console, setTimeout,clearTimeout, Map,Set,Date:TestDate,Promise,
    document:{getElementById:id=>nodes[id]||null},
    window:{}, sessionStorage:{getItem:()=>null,setItem:()=>{}},localStorage:{getItem:()=>null,setItem:()=>{}},
  });
  const cache=new Map();
  function synthetic(id,exports) {
    const module=new vm.SyntheticModule(Object.keys(exports),function(){for(const [name,value] of Object.entries(exports))this.setExport(name,value);},{context,identifier:id});
    cache.set(id,module);return module;
  }
  synthetic('firebase/firestore',fake.api);
  synthetic('sortablejs',{default:class Sortable { destroy(){} }});
  synthetic(resolve('src/firebase.js'),{db:{},auth:{}});
  synthetic(resolve('src/app.js'),{currentUser:{uid:'fixture',email:'fixture@example.invalid'},currentUserRole:'office',currentMenu:'main',setCurrentMenu:()=>{},MENUS:[]});
  synthetic(resolve('src/layout.js'),{renderLayout:()=>{}});
  const legacyRouterStub = { renderPage:()=>{} };
  if(!options.realRouter)synthetic(resolve('src/router.js'),legacyRouterStub);
  async function getModule(id) {
    if(cache.has(id))return cache.get(id);
    let source=await readFile(id,'utf8');
    if(id===resolve('src/pages/main.js'))source+='\nexport { loadAllData }; export function testState(){return {productions,nextProductions,recipes,meatStocks,eggStock,completionDoc,blockingData,overdueClosingDate,overdueClosingAlreadyClosed,overdueProductions,overdueNextProductions,overdueCompletionDoc,calendarSchedules,calendarProductions,calendarEvents,combinedLogs,equipmentAlerts};}';
    if(id===resolve('src/pages/production.js'))source+='\nexport { loadProductions };';
    const module=new vm.SourceTextModule(source,{context,identifier:id,importModuleDynamically:async specifier=>{
      const child=await getModule(resolve(dirname(id),specifier));
      if(child.status==='unlinked')await child.link(linker);
      if(child.status==='linked')await child.evaluate();
      return child;
    }});cache.set(id,module);return module;
  }
  async function linker(specifier,parent) {return getModule(specifier.startsWith('.')?resolve(dirname(parent.identifier),specifier):specifier);}
  async function load(path) {const module=await getModule(resolve(root,path));if(module.status==='unlinked')await module.link(linker);if(module.status==='linked')await module.evaluate();return module.namespace;}
  return {...fake,nodes,context,cache,synthetic,load};
}
