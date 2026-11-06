import {requestItems} from './supplementRequestItems.js';
export {requestItems} from './supplementRequestItems.js';
// Pure contract helpers. Only production-side actions are exposed here.
export const requestStatuses = {requested:'신청 (확정 전)',preparing:'준비중 (확정 전)',done:'입고 요청',cancelled:'취소'};
// Presentation only: preserve the shared status and all stock writer decisions.
export function requestDisplayStatus(row) {
  if (row.status !== 'done') return requestStatuses[row.status] || '신청 상태 확인 필요';
  const received=(row.items||[]).filter(item=>Object.hasOwn(row.stockIn||{},item.supplementTypeId)).length;
  if (row.stockInCompletedAt || (received>0 && received===row.items.length)) return '입고 완료';
  return received>0 ? '일부 입고' : '입고 대기';
}
export function assertWriter(role) {
  if (!['admin','office'].includes(role)) throw Error('대표·사무만 신청을 변경할 수 있습니다.');
}
export function assertExpected(row, expected) {
  if (!row || row.status !== expected.status || row.version !== expected.version) {
    const error=Error(`다른 사람이 이미 변경했습니다(현재: ${requestStatuses[row?.status] || '없음'}). 목록을 확인해주세요.`);
    error.code='supplement-request-conflict';throw error;
  }
}
export function assertTransition(row, action, role) {
  assertWriter(role);
  if (!(row.status === 'requested' && ['editItems','editNote','cancel'].includes(action)
    || row.status === 'preparing' && action === 'changeRequest'
    || row.status === 'done' && action === 'stockIn')) throw Error('현재 상태에서 할 수 없는 작업입니다.');
}
function actor(by) {
  if (typeof by?.uid !== 'string' || !by.uid || typeof by?.name !== 'string' || !by.name.trim()) throw Error('신청자 표시명을 확인해주세요.');
  return {uid:by.uid,name:by.name};
}
function note(value='') {
  if (typeof value !== 'string' || value.length > 500) throw Error('메모는 500자 이내로 입력해주세요.');
  return value;
}
export function createRequest(input, by, time, at) {
  by=actor(by);
  return {status:'requested',items:requestItems(input.items),note:note(input.note),changeRequestNote:'',handlerNote:'',
    requestedBy:by,requestedAt:time,updatedAt:time,updatedBy:by,version:1};
}
export function requestPatch(row, action, input, by, time, at, role) {
  assertTransition(row,action,role); by=actor(by);
  if (!Number.isSafeInteger(row.version) || row.version<1 || !Number.isSafeInteger(row.version+1)) throw Error('이력 한도(100개) 또는 버전을 확인해주세요.');
  const patch={};
  if(action==='editItems') {patch.items=requestItems(input.items);patch.note=note(input.note);}
  if(action==='editNote') {patch.note=note(input.note);}
  if(action==='cancel') {patch.status='cancelled';patch.note=note(input.note??row.note);}
  if(action==='changeRequest') {patch.changeRequestNote=note(input.changeRequestNote);}
  // Stock fields are built separately after lock/immutable-key checks.
  return {...patch,version:row.version+1,updatedAt:time,updatedBy:by,};
}
export function canReopenRequest(row) {
  return ['done','cancelled'].includes(row.status) && Object.keys(row.stockIn || {}).length === 0;
}
export function requestEvent(row, value, action, by, time) {
  const event={at:time,by:actor(by),action,version:value.version,to:value.status||row?.status||'requested'};
  if(row)event.from=row.status;
  if(action==='editItems'){event.itemsBefore=row.items;event.itemsAfter=value.items;}
  if(action==='create')event.itemsAfter=value.items;
  if(action==='changeRequest')event.note=value.changeRequestNote;
  else if(value.note!==undefined)event.note=value.note;
  return event;
}
export const stockOperationId = (requestId, typeId) => `supreq_${encodeURIComponent(requestId)}_${encodeURIComponent(typeId)}`;
export function assertStockInReplay(item,log,proof,operationId) {
  if(!proof||proof.kind!=='manual'||proof.version!==1||proof.logId!==operationId||proof.supplementTypeId!==item.supplementTypeId
    ||proof.qty!==item.qty||proof.before!==log.before||proof.after!==log.after||proof.uid!==log.uid||!log.uid
    ||log.movementSchemaVersion!==3||log.supplementTypeId!==item.supplementTypeId||log.qty!==item.qty
    ||log.type!=='in'||log.manualMovement?.kind!=='receipt'||log.manualMovement?.version!==1
    ||log.manualMovement?.operationId!==operationId||log.manualMovement?.enteredAmount!==item.qty
    ||!Number.isSafeInteger(log.before)||log.before<0||!Number.isSafeInteger(log.after)||log.before+log.qty!==log.after)
    throw Error('기존 입고의 신뢰된 근거가 일치하지 않습니다. 관리자 확인이 필요합니다.');
}
const millis = at => at?.toMillis?.() ?? (at?.seconds != null ? at.seconds*1000 : Number(at));
export function lockAvailable(lock, now) { return !lock || now-millis(lock.at)>=120000; }
// Ownership uses the full server timestamp (including nanoseconds). Expiry is
// enforced by rules using request.time; a client clock must never gate writes.
export function assertOwnedLock(row, lock) {
  const actual=row?.stockInLock;
  const sameAt=actual?.at?.isEqual ? actual.at.isEqual(lock?.at)
    : actual?.at?.seconds!=null && lock?.at?.seconds!=null
      ? actual.at.seconds===lock.at.seconds && actual.at.nanoseconds===lock.at.nanoseconds
      : actual?.at===lock?.at;
  if(!lock || !actual || actual.uid!==lock.uid || !sameAt)
    throw Error('입고 잠금이 변경되었거나 다른 화면에서 처리 중입니다. 다시 시도해주세요.');
}
// Dependency injection keeps the existing stock writer as the sole stock path.
export async function stockInRemaining({acquire,refresh,incoming,mark,complete,release}) {
  const lock=await acquire();
  try {
    let row=await refresh(lock);
    for(const item of row.items) {
      if(Object.hasOwn(row.stockIn||{},item.supplementTypeId)) continue;
      row=await refresh(lock);
      const result=await incoming(item);
      row=await mark(item,result,lock);
    }
    await complete(lock);
  } finally { await release(lock); }
}
