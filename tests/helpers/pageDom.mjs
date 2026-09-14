import {parseHTML} from 'linkedom';
import {resolve} from 'node:path';
import {environment} from './modules.mjs';
import {makeEditableFirestore} from '../fixtures/editableFirestore.mjs';

export async function pageEnvironment(route,{baselineRef,instrument='',role='office',latencyMs=0,retained=true}={}) {
 const fake=makeEditableFirestore({latencyMs,alertCount:0});
 Object.assign(fake.state.rows,{
  productions:[],activityLogs:[],
  recipes:[{id:'r1',name:'검증 레시피',category:'raw',target:'cat',active:true,sortOrder:0,unitPresets:[1,2],packWeightG:100,
   ingredients:[{name:'닭',isProductionUnit:true,unitName:'kg',weightDisplayUnit:'kg',baseWeightG:1000,meatTypeId:'m1'}],productionMethods:[]},
   {id:'fd1',name:'검증 큐브',category:'freezeDry',target:'cat',active:true,sortOrder:1,unitPresets:[1],requiresSeparation:true,ingredients:[]}],
  supplementTypes:[{id:'r1_1',active:true,name:'영양제 1',sortOrder:0},{id:'r1_2',active:true,name:'영양제 2',sortOrder:1}],
  supplementStock:[{id:'r1_1',currentQty:20},{id:'r1_2',currentQty:20}],
  meatTypes:[{id:'m1',name:'닭',category:'meat',sortOrder:0,active:true,defaultUnitWeightG:1000}],
  meatStocks:[{id:'ms1',meatTypeId:'m1',meatNameSnapshot:'닭',stage:'frozen',incomingDate:fake.today,remaining:10000,initialQtyG:10000,closed:false}],
  bagTypes:[{id:'b1',name:'검증 봉투',category:'freezeDry',sortOrder:0,active:true,currentQty:100,piecesPerBox:10}],
  frozenProducts:[{id:'fp1',name:'고양이 검증 큐브',kind:'product',target:'cat',category:'freezeDry',bagTypeId:'b1',active:true,sortOrder:0}],
  frozenPanLots:[{id:'lot1',date:fake.today,productName:'고양이 검증 큐브',remaining:10,closed:false,source:'manual'}],
  frozenPanStock:[{id:'order1',date:fake.today,status:'pending',items:[{productName:'고양이 검증 큐브',orderPanQty:3}]}],
  breadPanLots:[],frozenSeparation:[],frozenSeparationLogs:[],freezeOrders:[],
 });
 const e=await environment({session:true,firestore:fake,baselineRef,instrument:{[`src/pages/${route}.js`]:instrument}});
 const {document,Event,HTMLElement}=parseHTML('<html><body><div id="mainContent"></div></body></html>');
 const events=new WeakMap(),pending=new Set(),alerts=[];
 const native=document.defaultView.EventTarget.prototype.addEventListener;
 // Intercept registration only in this document, so tests can await actual
 // asynchronous UI callbacks instead of guessing when a write completed.
 const decorate=node=>{
  if(node.__testEvents)return node;
  node.__testEvents=true;
  if(node.tagName==='SELECT'){
    Object.defineProperty(node,'selectedIndex',{configurable:true,get(){return [...this.options].findIndex(option=>option.selected);}});
    Object.defineProperty(node,'value',{configurable:true,
      get(){return [...this.options].find(option=>option.selected)?.value||this.options[0]?.value||'';},
      set(value){for(const option of this.options)option.removeAttribute('selected');[...this.options].find(option=>option.value===String(value))?.setAttribute('selected','');},
    });
  }
  if(node.tagName==='OPTION'&&!('text' in node))Object.defineProperty(node,'text',{get(){return this.textContent;}});
  node.addEventListener=(kind,callback)=>{let byKind=events.get(node);if(!byKind)events.set(node,byKind=new Map());if(!byKind.has(kind))byKind.set(kind,[]);byKind.get(kind).push(callback);};
  return node;
 };
 const create=document.createElement.bind(document);document.createElement=(...args)=>decorate(create(...args));
 const get=document.getElementById.bind(document);document.getElementById=id=>{const n=get(id);return n?decorate(n):n;};
 for(const proto of [document,HTMLElement.prototype]){
  const all=proto.querySelectorAll,one=proto.querySelector;
  if(all)proto.querySelectorAll=function(...args){const list=all.apply(this,args);list.forEach(decorate);return list;};
  if(one)proto.querySelector=function(...args){const n=one.apply(this,args);return n?decorate(n):n;};
 }
 e.context.document=document;e.nodes.mainContent=document.getElementById('mainContent');
 e.context.window=e.context;e.context.innerWidth=1280;e.context.innerHeight=900;
 e.context.Math=Object.assign(Object.create(Math),{random:()=>0.5});
 e.context.navigator={onLine:true};e.context.requestAnimationFrame=callback=>setTimeout(callback,0);
 e.context.alert=message=>alerts.push(String(message));e.context.getComputedStyle=()=>({display:'block'});
 e.synthetic(resolve('src/firebase.js'),{db:{},auth:{currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:role}}})}}});
 e.synthetic(resolve('src/app.js'),{currentUser:{uid:'fixture',email:'fixture@example.invalid'},currentUserRole:role,currentMenu:route,setCurrentMenu:()=>{},MENUS:[]});
 e.synthetic(resolve('src/utils/modal.js'),{showConfirmModal:async()=>true,showPromptModal:async()=> '검증 사유'});
 e.synthetic('sortablejs',{default:class Sortable{static create(...args){return new this(...args);}destroy(){}}});
 if(!retained)e.synthetic(resolve('src/config/performanceFlags.js'),{useSessionReads:()=>false,flags:{shell:false,store:false}});
 const lifecycle=await e.load('src/utils/pageLifecycle.js');lifecycle.beginPage(e.nodes.mainContent,route);
 (await e.load('src/utils/modalManager.js')).setModalOwner(route);
 const page=await e.load(`src/pages/${route}.js`);
 const fill=(selector,value)=>{const n=document.querySelector(selector);if(!n)throw Error(`missing ${selector}`);n.value=String(value);return n;};
 const fire=async(selector,type='click')=>{const n=typeof selector==='string'?document.querySelector(selector):selector;if(!n)throw Error(`missing ${selector}`);const event={target:n,currentTarget:n,preventDefault(){},stopPropagation(){}};for(const callback of events.get(n)?.get(type)||[])await callback(event);};
 const cleanup=async()=>{lifecycle.disposePage();(await e.load('src/state/sessionStore.js')).sessionStore.clear();};
 return {...e,page,document,fill,fire,alerts,cleanup};
}
