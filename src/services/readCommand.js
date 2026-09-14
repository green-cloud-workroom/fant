import { openAction } from './actionGateway.js';
import { createServerReadScope } from './serverReadScope.js';
import { snapshotFingerprint } from '../state/pageResources.js';
import {runTransaction} from 'firebase/firestore';

// A command owns its read set, including queries used to build a confirmation.
// It never executes a write from a display snapshot without server comparison.
export async function withReadCommand(resource,callback,{roles=['admin','office'],readBack=[],timeoutMs=15000}={}){
  if(resource.busy)throw new Error('이미 처리 중입니다.');
  if(resource.blocked)throw new Error('직전 저장 결과를 확인해야 합니다. 입력을 복사한 뒤 화면을 다시 불러와주세요.');
  resource.busy=true;
  let sent=false,completed=false;
  try{
    const gate=await openAction({roles}),observations=[...resource.observations];
    const verify=async()=>{await gate.confirm();const reader=createServerReadScope();for(const item of observations){const snapshot=await reader[item.kind](item.ref);if(snapshotFingerprint(snapshot)!==item.fingerprint)throw new Error('다른 작업으로 원본이 변경되었습니다. 입력을 보존한 뒤 최신 자료를 다시 불러와주세요.');}await gate.confirm();};
    await verify();
    const reader=createServerReadScope();
    const track=kind=>async ref=>{const snapshot=await reader[kind](ref);observations.push({kind,ref,fingerprint:snapshotFingerprint(snapshot)});return snapshot;};
    const command={getDoc:track('getDoc'),getDocs:track('getDocs'),get committed(){return completed;},
      async transaction(db,callback,{targets=[]}={}){
        let validationError;
        try{return await this.commit({commit:()=>runTransaction(db,async transaction=>{
          try{return await callback(transaction);}catch(error){validationError=error;throw error;}
        })},{targets});}
        catch(error){if(validationError && error.cause===validationError){resource.blocked=false;throw validationError;}throw error;}
      },
      async commit(batch,{targets=[]}={}){
        if(sent)throw new Error('이 저장 요청은 이미 전송되었습니다.');
        await verify();if(sent)throw new Error('이 저장 요청은 이미 전송되었습니다.');sent=true;
        let timer;
        try{await Promise.race([batch.commit(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('write-timeout')),timeoutMs);})]);completed=true;resource.invalidate();}
        catch(error){
          resource.blocked=true;resource.invalidate();
          // Read-back is diagnostic only. An ambiguous write is never replayed.
          const fresh=createServerReadScope();
          const observed=await Promise.allSettled([...readBack,...targets].map(ref=>fresh.getDoc(ref)));
          const failure=new Error('저장 결과를 확정하지 못했습니다. 자동 재전송하지 않습니다. 입력을 보존한 뒤 최신 자료를 다시 확인해주세요.',{cause:error});
          failure.code='outcome-unknown';failure.readBack=observed.map(r=>({serverObserved:r.status==='fulfilled',exists:r.status==='fulfilled'?r.value.exists():null}));throw failure;
        }finally{clearTimeout(timer);}
      },
    };
    return await callback(command);
  }finally{resource.busy=false;if(sent&&completed)resource.invalidate();}
}
