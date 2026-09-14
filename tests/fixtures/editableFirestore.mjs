// Explicitly isolated editing fixture. Never imports Firebase or opens a network.
import {makeFirestore} from './firestore.mjs';
export function makeEditableFirestore(options={}){
  const fake=makeFirestore(options),{state}=fake;let nextId=0;
  state.commits=[];
  const ref=(path)=>({path,id:path.split('/').at(-1),conditions:[]});
  const collection=(parent,...parts)=>ref([parent?.path,...parts].filter(Boolean).join('/'));
  const doc=(parent,...parts)=>ref([parent?.path,...(parts.length?parts:['fixture-'+(++nextId)])].filter(Boolean).join('/'));
  const commit=async operations=>{
    const failure=state.failNextCommit;state.failNextCommit=null;
    if(failure==='before')throw Error('fixture failure before commit');
    if(failure==='hang')return new Promise(()=>{});
    const next=structuredClone(state.rows);
    for(const {kind,target,data,options}of operations){
      const pieces=target.path.split('/'),id=pieces.pop(),path=pieces.join('/');const list=next[path]||=[];const i=list.findIndex(row=>row.id===id);
      if(kind==='delete'){if(i>=0)list.splice(i,1);continue;}
      if(kind==='update'&&i<0)throw Error('fixture missing update target');
      const row={...(kind==='update'||options?.merge?list[i]||{}:{}),id,...structuredClone(data)};
      if(i<0)list.push(row);else list[i]=row;
    }
    state.rows=next;state.commits.push(operations);state.writes.push(...operations.map(o=>o.target.path));
    for(const path of new Set(operations.map(o=>o.target.path.split('/').slice(0,-1).join('/'))))await state.notify(path);
    if(failure==='after')throw Error('fixture acknowledgement lost after commit');
  };
  const writeBatch=()=>{const operations=[];let used=false;const batch={set:(target,data,options)=>{operations.push({kind:'set',target,data,options});return batch;},update:(target,data)=>{operations.push({kind:'update',target,data});return batch;},delete:target=>{operations.push({kind:'delete',target});return batch;},commit:()=>{if(used)throw Error('fixture batch reused');used=true;return commit(operations);}};return batch;};
  const api={...fake.api,collection,doc,writeBatch,
    runTransaction:async(_db,callback)=>{const batch=writeBatch();const result=await callback({...batch,get:fake.api.getDocFromServer});await batch.commit();return result;},
    setDoc:(target,data,options)=>writeBatch().set(target,data,options).commit(),updateDoc:(target,data)=>writeBatch().update(target,data).commit(),deleteDoc:target=>writeBatch().delete(target).commit(),
    addDoc:async(parent,data)=>{const target=doc(parent);await writeBatch().set(target,data).commit();return target;},
  };
  return {...fake,api};
}
export const fixture=makeEditableFirestore({latencyMs:50});
fixture.state.rows.bagTypes=[{id:'b1',name:'검증 봉투',category:'raw',active:true,sortOrder:0,currentQty:100,minimumQty:0}];
Object.assign(fixture.state.rows.recipes[0],{bagTypeId:'b1',productionMethods:[{methodKey:'manual',label:'수동',unitToBox:1,effectiveDate:'2026-01-01',active:true}]});
export const Timestamp={fromMillis:millis=>({toMillis:()=>millis})};
export const increment=value=>({increment:value});
export const {collection,doc,documentId,where,orderBy,limit,startAfter,query,queryEqual,getDoc,getDocs,getDocFromServer,getDocsFromServer,onSnapshot,serverTimestamp,runTransaction,setDoc,addDoc,updateDoc,deleteDoc,writeBatch}=fixture.api;
