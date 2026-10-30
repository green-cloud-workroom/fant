import {inventoryReceiptCorrectionLink} from './inventoryReceiptCorrection.js';
import {getFunctions,httpsCallable} from 'firebase/functions';
import {doc} from 'firebase/firestore';
import {auth,db} from '../firebase.js';
import {openAction} from './actionGateway.js';
import {sessionStore} from '../state/sessionStore.js';
import {getPageContext} from '../utils/pageLifecycle.js';
import {getTodayKST} from '../utils/date.js';

const ownRoles=['admin','office'];
const validId=value=>typeof value==='string'&&value.length>0&&value.length<=220&&!/[\/\u0000-\u001f]/.test(value)&&!['.','..'].includes(value);
function sorted(value){if(Array.isArray(value))return value.map(sorted);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,sorted(v)]));return value;}
async function inputHash(value){const data=new TextEncoder().encode(JSON.stringify(sorted(value)));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');}
function frozenJson(value){const result=JSON.parse(JSON.stringify(value));const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};return freeze(result);}
export function frozenSourceHoldMessage(blockers=[]){
  if(blockers.some(code=>code.includes('COMPONENT')))return '구성품 snapshot·자식 원장 근거를 확인해야 합니다.';
  if(blockers.some(code=>code.includes('HANDOFF')||code.includes('INVENTORY')||code.includes('WORKFLOW')||code.includes('REQUEST_NOT_PENDING')))return '재고앱 처리 필요: 인계·입고·사용·실사 기록이 연결되어 있습니다. 재고앱 입고 관리에 원본 ID와 수정 항목을 전달해주세요.';
  if(blockers.includes('SOURCE_DATE_CLOSED'))return '마감된 날짜의 입고입니다. 마감 및 재고앱 기록을 먼저 확인해 주세요.';
  return '입고 요청·원본·봉투 근거가 일치하지 않아 정정·취소를 보류합니다. 원본을 유지하고 재고앱 입고 관리에서 확인해 주세요.';
}
export async function prepareFrozenSourceCommand(sourceId,{expectedProductId}={}){
  if(!validId(sourceId))throw Error('입고 기록 ID를 확인해주세요.');
  const user=auth.currentUser,epoch=sessionStore.epoch,page=getPageContext(),day=getTodayKST();
  if(!user)throw Error('로그인 상태를 확인해주세요.');
  const checkSession=()=>{if(auth.currentUser?.uid!==user.uid||sessionStore.epoch!==epoch||getTodayKST()!==day||page&&!page.isCurrent())throw Error('로그인·화면 또는 날짜가 변경되었습니다. 입고를 다시 열어주세요.');};
  const gate=await openAction({refs:['frozenLogs/'+sourceId],roles:ownRoles,reusableConfirm:true});
  const call=async payload=>{checkSession();const response=await httpsCallable(getFunctions(auth.app,'asia-northeast3'),'productionReceiptCommand')(payload);checkSession();return response.data;};
  let identity,response;
  try{[identity,response]=await Promise.all([call({action:'identity'}),call({action:'frozenSourceContext',sourceId})]);}
  catch(cause){if(cause.code==='functions/permission-denied')throw new Error('본인 계정·회사·창고 권한을 관리자에게 확인해주세요.',{cause});throw cause;}
  identity=frozenJson(identity);response=frozenJson(response);
  checkSession();await gate.confirm();
  if(!identity?.production||identity.sharedQc||!validId(identity.employeeId)||response?.context?.sourceId!==sourceId||response?.source?.sourceId!==sourceId)throw Error('본인 생산 대표·사무의 입고 정보를 확인해주세요.');
  if(expectedProductId&&response.source.productId!==expectedProductId)throw Error('선택한 제품과 실제 입고 원본이 다릅니다. 다시 불러와주세요.');
  const context=frozenJson(response.context),operationId=crypto.randomUUID();
  let busy=false,dispatched=false,request=null,requestHash=null;
  async function inspectResult(){
    checkSession();const token=await user.getIdTokenResult();if(!ownRoles.includes(token.claims.roles?.production))throw Error('처리 권한이 변경되었습니다.');
    if(!request||!requestHash)return {confirmed:false};
    const observed=await call({action:'frozenSourceContext',sourceId,employeeId:identity.employeeId,operationId});checkSession();
    const saved=observed.operation;if(!saved)return {confirmed:false};
    const result=saved.result;
    if(saved.status!=='completed'||saved.actorUid!==user.uid||saved.actorEmployeeId!==identity.employeeId||saved.sourceId!==sourceId||saved.inputHash!==requestHash
      ||result?.sourceId!==sourceId||result?.operationId!==operationId||result?.revision!==(result.metadataOnly?context.revision:context.revision+1)||result?.receiptId!==`frozenLogs:${sourceId}:${result.metadataOnly?context.revision:context.revision+1}`
      ||result?.status!==(request.action==='correctFrozenSource'?'corrected':'cancelled'))throw Error('이 작업의 서버 결과가 요청과 일치하지 않습니다. 재고앱에서 확인해주세요.');
    return {confirmed:true,result:{...result,recovered:true}};
  }
  return {inventoryCorrection:inventoryReceiptCorrectionLink(response.source.receiptId,sourceId),source:response.source,context,actor:identity,operationId,eligible:response.eligible===true,metadataEligible:response.metadataEligible===true,holdMessage:frozenSourceHoldMessage(response.blockers),
    get dispatched(){return dispatched;},inspectResult,
    async submit(kind,{quantity,expiryDate,staffName,note,allowComponentShortage=false,reason,command}={}){
      checkSession();if(busy||dispatched)throw Error('이미 전송한 작업입니다. 서버 결과를 확인해주세요.');
      const metadataOnly=kind==='correct'&&quantity===response.source.quantity&&(expiryDate===undefined||expiryDate===response.source.expiryDate);
      if(response.eligible!==true&&!(metadataOnly&&response.metadataEligible===true))throw Error(frozenSourceHoldMessage(response.blockers));
      if(!['correct','cancel'].includes(kind))throw Error('입고 처리 구분을 확인해주세요.');
      const cleanReason=typeof reason==='string'?reason.trim():'';
      if(!cleanReason||cleanReason.length>500)throw Error('정정·취소 사유를 1~500자로 입력해주세요.');
      if(kind==='correct'&&(!Number.isSafeInteger(quantity)||quantity<=0))throw Error('1봉 이상의 안전한 정수를 입력해주세요.');
      const changes=kind==='correct'?{expiryDate,staffName,note}:{};
      Object.keys(changes).forEach(key=>{if(changes[key]===undefined)delete changes[key];});
      const extra=Object.keys(changes).length?{changes}:{};
      const confirmation=allowComponentShortage===true?{allowComponentShortage:true}:{};
      busy=true;
      try{
      request=frozenJson({action:kind==='correct'?'correctFrozenSource':'cancelFrozenSource',sourceId,employeeId:identity.employeeId,operationId,reason:cleanReason,...changes,...confirmation,...(kind==='correct'?{quantity}:{}),expectedContext:context});
      requestHash=await inputHash({...extra,...confirmation,action:request.action,sourceId,employeeId:identity.employeeId,quantity:kind==='correct'?quantity:null,reason:cleanReason,expectedContext:context});
      const invoke=()=>gate.submit(async()=>{
        dispatched=true;
        try{return await call(request);}catch(cause){
          try{const actual=await inspectResult();if(actual.confirmed)return actual.result;}catch{}
          const error=new Error('서버 결과를 확인하지 못했습니다. 자동으로 다시 보내지 않습니다. 원래 작업의 서버 결과를 확인해주세요.',{cause});error.code='outcome-unknown';throw error;
        }
      });
      return await (command?command.commit({commit:invoke},{targets:[doc(db,'frozenLogs',sourceId)],atomic:false}):invoke());}
      finally{busy=false;}
    },
  };
}
