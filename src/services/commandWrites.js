import {doc,setDoc,updateDoc,deleteDoc,writeBatch} from 'firebase/firestore';
import {recordActivity} from './activityLogs.js';
import {recordMeatLog} from './meatLogs.js';

// Preserve existing multi-step write order; every step has a server read set.
// Use commandBatch when the entire change can be published atomically.
export function commandWrites(command) {
  const writer={
    getDoc:command.getDoc,getDocs:command.getDocs,
    setDoc:(ref,...args)=>command.commit({commit:()=>setDoc(ref,...args)},{targets:[ref],atomic:true}),
    updateDoc:(ref,...args)=>command.commit({commit:()=>updateDoc(ref,...args)},{targets:[ref],atomic:true}),
    deleteDoc:ref=>command.commit({commit:()=>deleteDoc(ref)},{targets:[ref],atomic:true}),
    addDoc:async(parent,data)=>{const ref=doc(parent);await command.commit({commit:()=>setDoc(ref,data)},{targets:[ref],atomic:true});return ref;},
    runTransaction:(db,callback)=>{
      const targets=[];
      return command.transaction(db,transaction=>{
        const tracked={get:ref=>transaction.get(ref)};
        for(const kind of ['set','update','delete'])tracked[kind]=(ref,...args)=>{
          targets.push(ref);transaction[kind](ref,...args);return tracked;
        };
        return callback(tracked);
      },{targets});
    },
    writeBatch:db=>{const native=writeBatch(db),targets=[],batch={};for(const kind of ['set','update','delete'])batch[kind]=(ref,...args)=>{targets.push(ref);native[kind](ref,...args);return batch;};batch.commit=()=>command.commit({commit:()=>native.commit()},{targets,atomic:true});return batch;},
  };
  writer.recordActivity=entry=>recordActivity(entry,{writer});
  writer.recordMeatLog=entry=>recordMeatLog(entry,{writer});
  return writer;
}
