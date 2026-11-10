import {collection} from 'firebase/firestore';
import {atomicStockOperation} from './atomicStockOperation.js';
import {round2} from '../utils/number.js';

// Create-only receipts using the existing atomic stock operation/closing guard.
// All selected products commit together; existing lot balances are untouched.
export async function saveBreadPanIncoming({db,command,operationId,date,staffName,note='',items,uid=null}){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('유효한 입고일을 선택해주세요.');
 if(!staffName?.trim()||note.length>200||!Array.isArray(items)||!items.length||items.length>100)throw Error('담당자·입고 품목·비고(200자 이내)를 확인해주세요.');
 const seen=new Set();
 for(const item of items){if(!item.productName||seen.has(item.productName)||!Number.isFinite(item.qty)||item.qty<=0||round2(item.qty)!==item.qty)throw Error('입고 수량은 0보다 큰 소수 두 자리 이내로 입력해주세요.');seen.add(item.productName);}
 return atomicStockOperation({db,command,operationId,actionType:'breadPanIncoming',date,request:{items,staffName,note,uid},build:async({writer})=>{
  const now=new Date(),ledgerItems=[];
  for(const {productName,qty}of items){
   const lot=await writer.addDoc(collection(db,'breadPanLots'),{productName,date,staffName,initialQty:qty,remaining:qty,closed:false,note:note||null,createdAt:now,updatedAt:now});
   const metadata={version:1,kind:'receipt',reason:note,enteredAmount:qty,operationId,cancelOf:null,originalKind:null,changesStock:true,scheduleId:null};
   const log=await writer.addDoc(collection(db,'breadPanLogs'),{type:'incoming',date,productName,qty,before:0,after:qty,lotId:lot.id,lotDate:date,staffName,note:note||null,reason:note,manualMovement:metadata,uid,timestamp:now});
   ledgerItems.push({collection:'breadPanLots',docId:lot.id,field:'remaining',delta:qty,before:0,after:qty,sourceCollection:'breadPanLogs',sourceLogId:log.id,isNewDoc:true});
   await writer.recordActivity({action:'breadPan',subAction:'incoming',date,staff:staffName,message:`실제 입고 — ${productName} ${qty}개 / ${note}`,details:{sourceCollection:'breadPanLogs',sourceLogId:log.id,manualMovement:metadata,delta:qty,before:0,after:qty}});
  }
  await writer.addDoc(collection(db,'stockLedger'),{actionType:'manualMovement',actionId:operationId,date,status:'active',timestamp:now,items:ledgerItems});
 }});
}
