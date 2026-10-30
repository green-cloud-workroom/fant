import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { fingerprint } from './actionGateway.js';
import { commandWrites } from './commandWrites.js';
import { recordActivity } from './activityLogs.js';
import { recordMeatLog } from './meatLogs.js';

const operationButtons = new Map();

// One operation per open form. Keep the ID when a failed form is retried.
export function stockOperationId(db, button) {
  const operationId = button.dataset.operationId ||= doc(collection(db, 'stockLedger')).id;
  operationButtons.set(operationId, button);
  return operationId;
}

// Scoped adapter for the existing lot workflows, following atomicProductionLoad:
// preload all inputs, run the existing calculation on fresh rows, then publish.
export async function atomicStockOperation({db, command, operationId, actionType, date, request,
  inputs = {}, readRefs = [], build}) {
  if (!operationId || operationId.includes('/')) throw Error('작업 요청 ID가 필요합니다.');
  const ledgerRef = doc(db, 'stockLedger', `stockOperation_${operationId}`);
  const requestFingerprint = fingerprint({actionType,date,request});
  const execute = async tx => {
    const saved = await tx.get(ledgerRef);
    if (saved.exists()) {
      const value = saved.data();
      if (value.operationId !== operationId || value.requestFingerprint !== requestFingerprint || value.status !== 'active')
        throw Error('같은 작업 ID의 요청 내용이나 원장 상태가 변경되었습니다. 화면을 다시 열어주세요.');
      return {alreadyCompleted:true,ledgerId:ledgerRef.id};
    }
    if (date) {
      const closing = await tx.get(doc(db,'closings',date));
      if (closing.exists() && closing.data().status === 'closed') throw Error('마감된 날짜에는 입력할 수 없습니다.');
    }
    const cache = new Map(), fresh = {};
    for (const [name, rows] of Object.entries(inputs)) {
      fresh[name] = [];
      for (const row of rows) {
        const ref = doc(db,name,row.id), snap = await tx.get(ref);
        if (!snap.exists()) throw Error('입력 lot이 삭제되었습니다. 새로고침해주세요.');
        const value = snap.data();
        for (const key of ['meatTypeId','stage','productName','stockType']) {
          if (row[key] !== undefined && value[key] !== row[key]) throw Error('입력 lot의 품목·단계가 변경되었습니다.');
        }
        if (!Number.isFinite(value.remaining) || value.remaining < 0 || value.status === 'deleted') throw Error('입력 lot 잔량이 비정상입니다.');
        cache.set(ref.path,{...value});
        if (!value.closed && value.remaining > 0) fresh[name].push({...value,id:snap.id});
      }
    }
    for (const ref of readRefs) {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw Error('작업 원본이 없습니다.');
      cache.set(ref.path,snap.data());
    }
    const staged = new Map(), movementItems = [], writable = new Set([
      'meatStocks','meatLogs','breadPanLots','breadPanLogs','frozenPanLots','frozenPanLogs',
      'frozenPanStock','frozenSeparation','frozenSeparationLogs','activityLogs','stockLedger']);
    const put = (ref,data,update) => {
      const name = ref.path.split('/')[0];
      if (!writable.has(name)) throw Error('작업 저장 범위를 벗어났습니다.');
      const old = staged.get(ref.path), beforeRow = old?.data || cache.get(ref.path);
      if (update && !beforeRow) throw Error('조회하지 않은 원본은 수정할 수 없습니다.');
      if ('remaining' in data) {
        const before = beforeRow?.remaining ?? 0, after = data.remaining;
        if (!Number.isFinite(after) || after < 0) throw Error('처리 후 재고가 음수이거나 비정상입니다.');
        if (after !== before) movementItems.push({collection:name,docId:ref.id,field:'remaining',
          delta:after-before,before,after,...(!beforeRow?{isNewDoc:true}:{})});
      }
      staged.set(ref.path,{ref,data:{...beforeRow,...data},patch:{...old?.patch,...data},update:old?old.update:update});
    };
    const writer = {
      getDoc:async ref=>({exists:()=>cache.has(ref.path),data:()=>cache.get(ref.path),id:ref.id}),
      updateDoc:async(ref,data)=>put(ref,data,true),
      addDoc:async(parent,data)=>{
        const ref = parent.path === 'stockLedger' ? ledgerRef : doc(parent);
        put(ref,{...data,operationId,...(parent.path.endsWith('Logs')?{ledgerId:ledgerRef.id}:{})},false);
        return ref;
      },
    };
    writer.recordActivity=entry=>recordActivity(entry,{writer});
    writer.recordMeatLog=entry=>recordMeatLog(entry,{writer});
    const result = await build({writer, fresh});
    if (result === false) return {aborted:true};
    const existingLedger = staged.get(ledgerRef.path);
    const ledger = existingLedger?.data || {actionType,actionId:operationId,date,status:'active',timestamp:serverTimestamp(),items:movementItems};
    // Preserve existing ledger fields and validate its quantity chain against
    // the actual staged stock updates before committing any writes.
    const expected = new Map();
    for (const item of ledger.items || []) {
      const path = `${item.collection}/${item.docId}`;
      const before = expected.has(path)?expected.get(path):cache.get(path)?.[item.field]??0;
      if (item.field !== 'remaining' || !Number.isFinite(item.before) || !Number.isFinite(item.after) || !Number.isFinite(item.delta) || Math.abs(before-item.before)>1e-6
        || Math.abs(item.before+item.delta-item.after)>1e-6 || item.after<0) throw Error('원장 수량 연결이 일치하지 않습니다.');
      expected.set(path,item.after);
    }
    for (const [path,after] of expected) {
      if (after !== staged.get(path)?.data.remaining) throw Error('최종 lot과 원장 잔량이 일치하지 않습니다.');
    }
    for (const item of movementItems) {
      const path = `${item.collection}/${item.docId}`;
      if (!expected.has(path)) throw Error('lot 변경의 원장 근거가 없습니다.');
    }
    put(ledgerRef,{...ledger,operationId,requestFingerprint},false);
    if (staged.size > 450) throw Error('작업 건수가 안전 처리 한도를 넘었습니다.');
    for (const op of staged.values()) op.update ? tx.update(op.ref,op.patch) : tx.set(op.ref,op.data);
    return {ledgerId:ledgerRef.id,result};
  };
  const button = operationButtons.get(operationId);
  try {
    const result = await (command ? commandWrites(command).runTransaction(db,execute) : runTransaction(db,execute));
    // Only a confirmed commit/replay releases the form ID. An error (including
    // a lost response) leaves it in the dataset for an idempotent retry.
    if (!result.aborted && button?.dataset.operationId === operationId) delete button.dataset.operationId;
    return result;
  } finally {
    operationButtons.delete(operationId);
  }
}
