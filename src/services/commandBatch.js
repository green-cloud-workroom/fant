import {doc,writeBatch} from 'firebase/firestore';
import {recordActivity} from './activityLogs.js';
import {recordMeatLog} from './meatLogs.js';

// Stage related documents and activity logs; publish exactly once through the
// command's server verification and ambiguous-outcome protection.
export function commandBatch(command,db) {
  const native=writeBatch(db),targets=[];
  const batch={};
  for(const kind of ['set','update','delete'])batch[kind]=(ref,...args)=>{
    if(targets.length>=500)throw new Error('한 번에 저장할 수 있는 항목 수를 초과했습니다. 관리자에게 문의해주세요.');
    targets.push(ref);native[kind](ref,...args);return batch;
  };
  const staged={
    batch,
    addDoc:(parent,data)=>{const ref=doc(parent);batch.set(ref,data);return ref;},
    setDoc:(...args)=>batch.set(...args),updateDoc:(...args)=>batch.update(...args),deleteDoc:(...args)=>batch.delete(...args),
    recordActivity:entry=>recordActivity(entry,{batch}),
    commit:()=>command.commit({commit:()=>native.commit()},{targets}),
  };
  staged.recordMeatLog=entry=>recordMeatLog(entry,{writer:staged});
  return staged;
}
