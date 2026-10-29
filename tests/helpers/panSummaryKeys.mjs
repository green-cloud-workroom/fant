import {pageEnvironment} from './pageDom.mjs';import {serializeView} from './settingsBagXssViews.mjs';
export const reservedNames=['__proto__','constructor','toString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','toLocaleString','__defineGetter__','__defineSetter__','__lookupGetter__','__lookupSetter__'];
export const ordinaryNames=['10','2','01',`한글 & <제품> " '`, 'prototype','undefined','é','e\u0301'];
export const allNames=[...reservedNames,...ordinaryNames];
export async function summaryEnvironment(options={}){return pageEnvironment('frozenPan',{...options,instrument:`
export {showWorkRowModal,showBreadPanIncomingModal,showTenderInModal};
let __bread,__frozen,__work;
const __renderBread=renderBreadPanTab;renderBreadPanTab=(...a)=>{__bread=a[0];return __renderBread(...a);};
const __renderFrozen=renderFrozenPanTab;renderFrozenPanTab=(...a)=>{__frozen=a[1];return __renderFrozen(...a);};
const __bindWork=bindWorkItemEvents;bindWorkItemEvents=(...a)=>{__work=a[0];return __bindWork(...a);};
export function __dicts(){return {bread:__bread,frozen:__frozen,work:__work};}
export function __recipes(names,separation=true){freezeDryRecipes=names.map((displayName,i)=>({id:'r'+i,displayName,requiresSeparation:separation}));staffCache={senior:[{name:'담당'}]};}
export function __prototypeIntact(){return !Object.hasOwn(Object.prototype,'total')&&!Object.hasOwn(Object.prototype,'oldestRemaining');}
`});}
export function seedSummaries(e,names=allNames){e.state.rows.frozenPanStock=[];e.state.rows.breadPanLogs=[];e.state.rows.frozenPanLogs=[];
 e.state.rows.breadPanLots=names.flatMap((productName,i)=>[{id:'b'+i+'new',productName,date:'2026-09-13',remaining:18,closed:false},{id:'b'+i+'old',productName,date:'2026-09-12',remaining:9,closed:false}]);
 e.state.rows.frozenPanLots=names.flatMap((productName,i)=>[{id:'f'+i+'new',productName,date:'2026-09-13',remaining:3,source:'manual',closed:false},{id:'f'+i+'old',productName,date:'2026-09-12',remaining:2,source:'manual',closed:false}]);
 e.state.rows.recipes=names.map((name,i)=>({id:'r'+i,name,target:'common',category:'freezeDry',active:true,sortOrder:i,requiresSeparation:true}));}
export function selectWork(e,name){const select=e.fill('.wi-name',name);select.onchange({target:select});}
export async function captureSummaryScenes({role='office',sourceFiles,names=allNames}={}){const e=await summaryEnvironment({role,sourceFiles});try{seedSummaries(e,names);const scenes=[];await e.page.renderFrozenPan();scenes.push({name:'bread',role,html:serializeView(e.document.querySelector('#mainContent')),names});await e.fire('[data-tab="frozenPan"]');scenes.push({name:'frozen',role,html:serializeView(e.document.querySelector('#mainContent')),names});await e.page.showWorkRowModal([],[]);for(const name of names){selectWork(e,name);scenes.push({name:'work',role,selected:name,html:serializeView(e.document.querySelector('#modalOverlay'))});}if(e.state.writes.length)throw Error('Capture wrote data');return scenes;}finally{await e.cleanup();}}
