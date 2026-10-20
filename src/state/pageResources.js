import { createDisplayScope, displayPool } from './displayReads.js';
import { sessionStore } from './sessionStore.js';
import { useSessionReads, flags } from '../config/performanceFlags.js';
import { instantPageResource, inspectInstantResources } from './instantPageResources.js';
import { createServerReadScope } from '../services/serverReadScope.js';
import { fingerprint } from '../services/actionGateway.js';
import { getPageContext, registerPageCleanup } from '../utils/pageLifecycle.js';

export const snapshotFingerprint = snapshot => fingerprint(snapshot.docs
  ? snapshot.docs.map(doc=>({id:doc.id,...doc.data()}))
  : snapshot.exists()?{id:snapshot.id,...snapshot.data()}:null);

const resources=new Map();
const MAX_MODELS=3, MAX_INACTIVE=2, MAX_BYTES=64*1024*1024;
let access=0;
function copyModel(value){if(value==null||typeof value!=='object'||typeof value.toMillis==='function')return value;if(value instanceof Date)return new Date(value.getTime());if(Array.isArray(value))return value.map(copyModel);return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,copyModel(item)]));}
function trim(){
  const inactive=[...resources.values()].filter(r=>!r.active).sort((a,b)=>b.access-a.access);
  inactive.slice(MAX_INACTIVE).forEach(r=>r.disconnect());
  const models=[...resources.values()].filter(r=>r.model).sort((a,b)=>a.access-b.access);
  let bytes=models.reduce((n,r)=>n+r.bytes,0),count=models.length;
  for(const r of models){if(count<=MAX_MODELS&&bytes<=MAX_BYTES)break;if(r.active)continue;bytes-=r.bytes;count--;r.model=null;r.observations=[];r.bytes=0;r.disconnect();}
}
sessionStore.onClear(()=>{for(const r of resources.values()){r.disconnect();r.model=null;r.observations=[];r.blocked=!!r.pending;r.active=false;} });

export function pageResource(route){
  if(useSessionReads(route) && flags.instantRoutes?.includes(route))return instantPageResource(route);
  if(resources.has(route))return resources.get(route);
  const owner='page:'+route;
  const resource={route,owner,active:false,access:0,bytes:0,model:null,dirty:true,observations:[],blocked:false,busy:false,timer:null,context:null,boundContext:null,revision:0,loadId:0,
    disconnect(){clearTimeout(this.timer);this.timer=null;this.dirty=true;displayPool.releaseOwner(owner,true);},
    invalidate(){this.dirty=true;},
    async load(loader,{onChange,force=false}={}){
      const context=getPageContext(),epoch=sessionStore.epoch,loadId=++this.loadId;
      this.context=context;this.active=true;this.access=++access;clearTimeout(this.timer);
      const retained=useSessionReads(route);
      if(force||this.blocked)this.disconnect();
      if(this.boundContext!==context){this.boundContext=context;registerPageCleanup(()=>{if(this.context!==context)return;this.active=false;this.timer=setTimeout(()=>this.disconnect(),30000);this.timer.unref?.();trim();});}
      if(retained){
        displayPool.onChange(owner,event=>{this.revision++;this.dirty=true;if(this.active&&context?.isCurrent())onChange?.(event);});
      }
      if(retained&&!force&&!this.dirty&&this.model){trim();return copyModel(this.model);}
      const revision=this.revision,reader=retained?createDisplayScope(owner):createServerReadScope(),observations=[];
      const track=kind=>async ref=>{const snapshot=await reader[kind](ref);observations.push({kind,ref,fingerprint:snapshotFingerprint(snapshot)});return snapshot;};
      const scope={...reader,getDoc:track('getDoc'),getDocs:track('getDocs')};
      const model=await loader(scope);
      if(loadId!==this.loadId||epoch!==sessionStore.epoch||(context&&!context.isCurrent()))return null;
      this.model=copyModel(model);this.observations=observations;this.dirty=this.revision!==revision;this.blocked=!!this.pending;
      this.bytes=JSON.stringify(model).length*2+observations.reduce((n,o)=>n+o.fingerprint.length*4,0);trim();return model;
    },
  };
  resources.set(route,resource);return resource;
}
export function inspectPageResources(){return [...resources.values()].map(r=>({route:r.route,active:r.active,cached:!!r.model,dirty:r.dirty,bytes:r.bytes})).concat(inspectInstantResources());}
