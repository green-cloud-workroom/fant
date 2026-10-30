import {doc, serverTimestamp} from 'firebase/firestore';
import {atomicStockOperation} from './atomicStockOperation.js';
import {fingerprint} from './actionGateway.js';

export async function confirmAutoRepack({db,logId,log,actualCount,staffName,date,uid}) {
  const logRef=doc(db,'activityLogs',logId), lotRef=doc(db,'meatStocks',log.details?.repackedStockId);
  return atomicStockOperation({db,operationId:`autoRepack_${logId}`,actionType:'autoRepackConfirm',date,
    request:{logId,actualCount,staffName,uid},readRefs:[logRef,lotRef],build:async({writer})=>{
      const current=(await writer.getDoc(logRef)).data();
      if(current.acknowledged===true)throw Error('이미 확인된 자동 재포장입니다.');
      if(fingerprint(current.details)!==fingerprint(log.details))throw Error('자동 재포장 원본이 변경되었습니다.');
      const d=current.details, lot=(await writer.getDoc(lotRef)).data();
      if(!Number.isSafeInteger(actualCount)||actualCount<0 || !Number.isFinite(d.processedUnitWeightG)||d.processedUnitWeightG<=0
        || !Number.isFinite(d.surplusG)||d.surplusG<0 || !staffName)throw Error('재포장 실측값과 원본 중량을 확인해주세요.');
      if(lot.meatTypeId!==d.meatTypeId || lot.stage!=='repacked' || lot.status==='deleted'
        || !Number.isFinite(lot.remaining)||lot.remaining<0)throw Error('재포장 lot 원본이 비정상입니다.');
      const actualG=actualCount*d.processedUnitWeightG, diffG=actualG-d.surplusG, before=lot.remaining, after=before+diffG;
      if(!Number.isFinite(after)||after<0)throw Error('보정 후 자동 재포장 잔량이 음수가 됩니다.');
      if(diffG!==0){
        await writer.updateDoc(lotRef,{remaining:after,closed:actualCount===0&&after===0,updatedAt:serverTimestamp()});
        await writer.recordMeatLog({type:'adjust',date,meatTypeId:d.meatTypeId,meatNameSnapshot:d.meatName,
          stage:'repacked',meatStockId:lotRef.id,delta:diffG,before,after,staff:staffName,reason:'자동 재포장 실측 차이 확인',batchId:`autoRepack_${logId}`});
        await writer.recordActivity({action:'autoRepack',subAction:'diff',date,staff:staffName,
          message:`자동 재포장 차이 — ${d.meatName} 시스템 ${d.surplusG}g / 실제 ${actualG}g (${diffG>0?'+':''}${diffG}g) — 담당: ${staffName}`,
          details:{meatTypeId:d.meatTypeId,meatName:d.meatName,repackedStockId:lotRef.id,processedUnitWeightG:d.processedUnitWeightG,
            systemG:d.surplusG,actualCount,actualG,diffG,sourceLogId:logId}});
      }
      await writer.updateDoc(logRef,{acknowledged:true,acknowledgedAt:serverTimestamp(),acknowledgedBy:staffName,acknowledgedByUid:uid});
    }});
}
