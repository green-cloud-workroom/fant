import {getFunctions,httpsCallable} from 'firebase/functions';
import {doc,getDocFromServer} from 'firebase/firestore';
import {auth,db} from '../firebase.js';
import {openAction} from './actionGateway.js';
import {sessionStore} from '../state/sessionStore.js';
import {getPageContext} from '../utils/pageLifecycle.js';
import {getTodayKST} from '../utils/date.js';
const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,sorted(x)])):v;
async function hash(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(sorted(v)))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function prepareFrozenSampleSetIncoming(productId){
 const user=auth.currentUser,epoch=sessionStore.epoch,page=getPageContext(),day=getTodayKST();if(!user)throw Error('로그인 상태를 확인해주세요.');
 const check=()=>{if(auth.currentUser?.uid!==user.uid||sessionStore.epoch!==epoch||getTodayKST()!==day||page&&!page.isCurrent())throw Error('로그인·화면 또는 날짜가 변경되었습니다. 다시 열어주세요.');};
 const gate=await openAction({refs:['frozenProducts/'+productId],roles:['admin','office','production'],reusableConfirm:true}),operationId=crypto.randomUUID();
 const call=async payload=>{check();const r=await httpsCallable(getFunctions(auth.app,'asia-northeast3'),'productReceiptWorkflow')(payload);check();return r.data;};
 let actor;try{actor=await call({action:'identity'});}catch(cause){if(cause.code==='functions/permission-denied')throw new Error('샘플세트 입고 워크플로 활성화와 본인·QC 계정 설정을 관리자에게 확인해주세요.',{cause});throw cause;}
 if(!actor?.production)throw Error('생산 권한을 확인해주세요.');
 let busy=false,dispatched=false,request=null,inputHash=null;
 async function inspectResult(){check();if(!request)return {confirmed:false};const snap=await getDocFromServer(doc(db,'frozenSampleSetOperations',operationId));check();if(!snap.exists())return {confirmed:false};const d=snap.data(),r=d.result;if(d.status!=='completed'||d.actorUid!==user.uid||d.actorEmployeeId!==request.employeeId||d.inputHash!==inputHash||r?.status!=='created'||r?.operationId!==operationId||r?.quantity!==request.quantity||r?.productId!==productId)throw Error('본인 작업 결과가 요청과 일치하지 않습니다.');return {confirmed:true,result:{...r,recovered:true}};}
 return {actor,operationId,inspectResult,get dispatched(){return dispatched;},async submit({date,expiry,quantity,employeeId,command}){
  check();if(busy||dispatched)throw Error('이미 전송한 작업입니다. 서버 결과를 확인해주세요.');
  if(actor.sharedQc?!actor.staffOptions?.some(s=>s.employeeId===employeeId):employeeId!==actor.employeeId)throw Error('본인 또는 등록된 QC 실제 담당자를 선택해주세요.');
  busy=true;try{const context=await call({action:'sampleSetIncomingContext',productId,date,expiry,quantity,employeeId});
   request={action:'createSampleSetIncoming',productId,date,expiry,quantity,employeeId,operationId,expectedContext:JSON.parse(JSON.stringify(context.context))};inputHash=await hash({productId,date,expiry,quantity,employeeId,expectedContext:request.expectedContext});
   const invoke=()=>gate.submit(async()=>{dispatched=true;try{return await call(request);}catch(cause){try{const observed=await inspectResult();if(observed.confirmed)return observed.result;}catch{}throw new Error('샘플세트 서버 결과를 확인하지 못했습니다. 자동 재전송하지 않습니다. 원래 작업 결과를 확인해주세요.',{cause});}});
   return await (command?command.commit({commit:invoke},{targets:[doc(db,'frozenProducts',productId)],atomic:false}):invoke());
  }finally{busy=false;}
 }};
}
