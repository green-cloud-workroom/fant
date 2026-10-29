import { collection, doc, query, where, getDocFromServer, getDocsFromServer, serverTimestamp } from 'firebase/firestore';
import { fingerprint } from './actionGateway.js';
import { commandWrites } from './commandWrites.js';
import { newProductionWriteToken } from '../utils/productionWriteToken.js';
import {planProductionSupplementChanges} from './productionSupplementReservation.js';

const MAX_DATE_ROWS = 400;
const MAX_WRITES = 450;

function conflict(message = '생산 순서가 다른 작업으로 변경되었습니다. 최신 자료를 다시 불러와주세요.') {
  const error = new Error(message);
  error.code = 'production-order-conflict';
  return error;
}

export function anchorRevision(snapshot, date) {
  if (!snapshot.exists()) return 0;
  const data = snapshot.data();
  if (data.date !== date || !Number.isSafeInteger(data.revision) || data.revision < 1) {
    throw conflict('생산 순서 기준이 비정상입니다. 관리자에게 문의해주세요.');
  }
  return data.revision;
}

function rowFingerprint(snapshot) {
  return fingerprint({ ...snapshot.data(), id: snapshot.id });
}

export function productionOrderView(rows) {
  return rows.filter(row=>row.status!=='deleted').map(row=>({id:row.id,
    sortOrder:row.sortOrder,round:row.round,batchNo:row.batchNo??null,
    recipeId:row.recipeId,productionUnitQty:row.productionUnitQty,
    orderRevision:row.orderRevision??null,
  })).sort((a,b)=>a.id.localeCompare(b.id));
}

export async function captureProductionOrderDate(db, date, scope = {}) {
  const readDoc = scope.getDoc || getDocFromServer;
  const readDocs = scope.getDocs || getDocsFromServer;
  const anchorRef = doc(db, 'productionOrderDays', date);
  const before = await readDoc(anchorRef);
  const revision = anchorRevision(before, date);
  const result = await readDocs(query(collection(db, 'productions'), where('date', '==', date)));
  if (result.docs.length > MAX_DATE_ROWS) throw conflict('이 날짜의 생산 건수가 안전 처리 한도를 넘었습니다. 관리자에게 문의해주세요.');
  const after = await readDoc(anchorRef);
  if (anchorRevision(after, date) !== revision || before.exists() !== after.exists()) throw conflict();
  const rows = result.docs.map(snapshot => ({
    id: snapshot.id, data: snapshot.data(), fingerprint: rowFingerprint(snapshot),
  }));
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw conflict();
  return { date, anchorRef, anchorExists: before.exists(), revision, rows };
}

function activeRows(rows) {
  const active = rows.filter(row => row.status !== 'deleted');
  const order = new Set();
  for (const row of active) {
    if (!Number.isSafeInteger(row.sortOrder) || row.sortOrder < 0 || order.has(row.sortOrder)) {
      throw conflict('생산 순서에 누락·중복·비정상 값이 있어 저장을 보류했습니다. 관리자에게 문의해주세요.');
    }
    order.add(row.sortOrder);
  }
  return active.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

function roundsFor(rows) {
  const groups = new Map();
  for (const row of rows) {
    const group = groups.get(row.recipeId) || [];
    group.push(row);
    groups.set(row.recipeId, group);
  }
  const values = new Map();
  for (const group of groups.values()) {
    for (const [index, row] of group.entries()) {
      const sameQuantity = group.filter(item => item.productionUnitQty === row.productionUnitQty);
      values.set(row.id, {
        round: index + 1,
        batchNo: sameQuantity.length >= 2 ? sameQuantity.findIndex(item => item.id === row.id) + 1 : null,
      });
    }
  }
  return values;
}

// The caller reads every additional document in prepare() before returning a
// write plan. No transaction write occurs until all reads and checks finish.
export async function runProductionOrderTransaction({ db, date, command, prepare, expectedOrder, expectedRevision, actorUid }) {
  const captured = await captureProductionOrderDate(db, date, command);
  if(expectedRevision !== undefined && captured.revision !== expectedRevision) throw conflict('영양제 환급 근거가 변경되었습니다. 최신 자료를 다시 불러와주세요.');
  if(expectedOrder && fingerprint(productionOrderView(captured.rows.map(row=>({...row.data,id:row.id})))) !== fingerprint(expectedOrder)) {
    throw conflict('화면의 생산 순서가 변경되었습니다. 최신 자료를 다시 불러온 뒤 정렬해주세요.');
  }
  const { runTransaction } = commandWrites(command);
  const logRefs=new Map();
  return runTransaction(db, async transaction => {
    const anchor = await transaction.get(captured.anchorRef);
    if (anchor.exists() !== captured.anchorExists || anchorRevision(anchor, date) !== captured.revision) throw conflict();
    const closing = await transaction.get(doc(db, 'closings', date));
    if (closing.exists() && closing.data().status === 'closed') throw conflict(`${date}는 이미 마감된 날짜입니다. 수정하려면 마감해제하세요.`);
    const snapshots = await Promise.all(captured.rows.map(row => transaction.get(doc(db, 'productions', row.id))));
    const rows = snapshots.map((snapshot, index) => {
      if (!snapshot.exists() || rowFingerprint(snapshot) !== captured.rows[index].fingerprint) throw conflict();
      return { ...snapshot.data(), id: snapshot.id };
    });
    const plan = await prepare({ transaction, rows: rows.map(row => ({ ...row })), revision: captured.revision });
    let changes = plan?.changes || [];
    const suppliedWrites = plan?.businessWrites || [];
    if(suppliedWrites.some(write=>write.ref?.path?.split('/')[0]!=='activityLogs'))throw conflict('생산 영양제 재고·로그는 예약 거래에서만 계산할 수 있습니다.');
    if (changes.length === 0) throw conflict('생산 순서 변경 내용이 없습니다.');
    const newRefs = changes.filter(change => change.kind === 'create').map(change => doc(db, 'productions', change.id));
    const newSnapshots = await Promise.all(newRefs.map(ref => transaction.get(ref)));
    if (newSnapshots.some(snapshot => snapshot.exists())) throw conflict('이미 존재하는 생산 ID입니다.');
    const nextRevision = captured.revision + 1;
    if (!Number.isSafeInteger(nextRevision)) throw conflict('생산 순서 기준이 범위를 넘었습니다.');
    const supplementPlan=await planProductionSupplementChanges({db,date,transaction,rows,changes,actorUid,logRefs,nextRevision});
    changes=supplementPlan.changes;
    const businessWrites=[...suppliedWrites,...supplementPlan.businessWrites];
    const projected = new Map(rows.map(row => [row.id, row]));
    const patches = new Map();
    for (const change of changes) {
      const { id, kind, data } = change;
      if (patches.has(id) || !id || !['create', 'update'].includes(kind)) throw conflict('생산 변경 목록이 비정상입니다.');
      if (kind === 'create' && projected.has(id)) throw conflict('이미 존재하는 생산 ID입니다.');
      if (kind === 'update' && !projected.has(id)) throw conflict('수정할 생산 원본이 없습니다.');
      if (data.date !== undefined && data.date !== date) throw conflict('생산 날짜를 이 거래에서 변경할 수 없습니다.');
      const existing = projected.get(id) || {};
      const next = { ...existing, ...data, id, date };
      projected.set(id, next);
      patches.set(id, { kind, data });
    }
    const businessPaths = new Set();
    for (const write of businessWrites) {
      const path = write.ref?.path;
      if (!path || !['supplementStock','supplementLogs','activityLogs','supplementContractProofs'].includes(path.split('/')[0])
        || path.split('/').length !== 2
        || businessPaths.has(path) || !['set', 'update'].includes(write.kind)) {
        throw conflict('생산 부가 기록 대상이 비정상입니다.');
      }
      businessPaths.add(path);
      if(path.split('/')[0]==='supplementLogs' && write.data.relatedProductionId) {
        const parentId=write.data.relatedProductionId;
        const parentChange=patches.get(parentId), previous=rows.find(row=>row.id===parentId);
        if(write.kind!=='set' || !parentChange || (previous && previous.status==='deleted')
          || (!previous && (parentChange.kind!=='create' || parentChange.data.status==='deleted'))) throw conflict('영양제 로그와 생산 변경 근거가 일치하지 않습니다.');
        write.data={...write.data,productionOrderRevision:nextRevision};
      }
    }
    const sorted = activeRows([...projected.values()]);
    const computed = roundsFor(sorted);
    for (const row of sorted) {
      const values = computed.get(row.id);
      const previous = rows.find(item => item.id === row.id);
      const patch = patches.get(row.id);
      if (patch || !previous || previous.round !== values.round || (previous.batchNo ?? null) !== values.batchNo) {
        row.round = values.round;
        row.batchNo = values.batchNo;
        patches.set(row.id, { kind: patch?.kind || 'update', data: {
          ...(patch?.data || {}), ...values, mutationToken:patch?.data?.mutationToken || newProductionWriteToken(),
        } });
      }
    }
    if (patches.size + businessWrites.length + 1 > MAX_WRITES) throw conflict('생산 변경 건수가 안전 처리 한도를 넘었습니다. 관리자에게 문의해주세요.');
    const anchorData = { date, revision: nextRevision, updatedAt: serverTimestamp() };
    if (captured.anchorExists) transaction.update(captured.anchorRef, anchorData);
    else transaction.set(captured.anchorRef, anchorData);
    for (const [id, patch] of patches) {
      const ref = doc(db, 'productions', id);
      const data = { ...patch.data, orderRevision: nextRevision };
      if (patch.kind === 'create') transaction.set(ref, data);
      else transaction.update(ref, data);
    }
    for (const write of businessWrites) {
      if (write.kind === 'set') transaction.set(write.ref, write.data);
      else if (write.kind === 'update') transaction.update(write.ref, write.data);
      else throw conflict('지원하지 않는 생산 부가 기록입니다.');
    }
    return plan.result;
  });
}
