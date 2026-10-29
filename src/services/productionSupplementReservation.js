import {collection,doc,serverTimestamp} from 'firebase/firestore';
import {makeSupplementId} from '../utils/supplement.js';

function invalid(message) {
  const error=new Error(message);error.code='production-validation';return error;
}
export function readSupplementReservation(row) {
  const value=row?.supplementReservation;
  if(!value)throw invalid('기존 생산의 영양제 예약 근거가 없습니다. 검증된 이전 절차가 필요합니다. 관리자에게 문의해주세요.');
  if(value.version!==1 || ![0,1].includes(value.quantity)
    || (value.quantity===0 ? value.skuId!==null : typeof value.skuId!=='string'||!value.skuId||value.skuId.includes('/'))
    || Object.keys(value).some(key=>!['version','skuId','quantity'].includes(key))) {
    throw invalid('생산 영양제 예약 근거가 비정상입니다. 관리자에게 문의해주세요.');
  }
  return {version:1,skuId:value.skuId,quantity:value.quantity};
}

// Own the stock arithmetic. UI plans may request production changes, never
// decide refund amounts or provide independent supplement stock/log writes.
export async function planProductionSupplementChanges({db,date,transaction,rows,changes,actorUid,logRefs,nextRevision}) {
  const businessWrites=[],stockTargets=new Set(),result=[];
  for(const change of changes) {
    const previous=rows.find(row=>row.id===change.id),next={...previous,...change.data};
    const deleting=next.status==='deleted' && previous?.status!=='deleted';
    const entering=change.kind==='create';
    const quantityChanged=previous && (previous.recipeId!==next.recipeId || previous.productionUnitQty!==next.productionUnitQty);
    if(!entering && !deleting && !quantityChanged) {
      // Preserve historical unreserved rows for non-stock metadata/order work.
      const data={...change.data};
      for(const key of ['supplementReservation','supplementMovement']) {
        if(previous && Object.hasOwn(previous,key))data[key]=previous[key];else delete data[key];
      }
      result.push({...change,data});continue;
    }
    if(previous?.status==='deleted' || entering && next.status==='deleted')throw invalid('삭제된 생산의 영양제 예약은 변경할 수 없습니다.');
    const old=entering?{version:1,skuId:null,quantity:0}:readSupplementReservation(previous);
    if(!actorUid || typeof actorUid!=='string')throw invalid('영양제 예약 저장 계정을 확인해주세요.');
    const proofRef=doc(db,'supplementContractProofs','p_'+change.id),proof=await transaction.get(proofRef);
    const proofData=proof.exists()?proof.data():null;
    if(entering ? proof.exists() : !proofData || proofData.kind!=='production' || proofData.version!==1
      || proofData.productionId!==change.id || proofData.skuId!==old.skuId || proofData.quantity!==old.quantity) {
      throw invalid('생산의 신뢰된 영양제 예약 증거가 없습니다. 검증된 이전 절차가 필요합니다. 관리자에게 문의해주세요.');
    }
    let desired={version:1,skuId:null,quantity:0};
    if(!deleting) {
      if(typeof next.recipeId!=='string'||!next.recipeId||next.recipeId.includes('/')||!Number.isFinite(next.productionUnitQty)||next.productionUnitQty<=0)throw invalid('생산 레시피·수량을 확인해주세요.');
      const recipe=await transaction.get(doc(db,'recipes',next.recipeId));
      if(!recipe.exists())throw invalid('생산 레시피를 다시 확인해주세요.');
      if(recipe.data().usesSupplement!==false) {
        if(!Array.isArray(recipe.data().unitPresets)||!recipe.data().unitPresets.includes(next.productionUnitQty))throw invalid('레시피에 등록된 영양제 생산단위를 확인해주세요.');
        const skuId=makeSupplementId(next.recipeId,next.productionUnitQty);
        const type=await transaction.get(doc(db,'supplementTypes',skuId));
        if(!type.exists() || type.data().active===false || type.data().recipeId!==next.recipeId || type.data().unit!==next.productionUnitQty)throw invalid('생산 수량에 맞는 영양제 SKU를 확인해주세요.');
        desired={version:1,skuId,quantity:1};
      }
    }
    const same=old.skuId===desired.skuId && old.quantity===desired.quantity;
    const movement=same && !entering ? {...previous.supplementMovement} : {version:1,refundLogId:null,deductLogId:null};
    const operations=same?[]:[...(old.quantity?[{kind:'refund',skuId:old.skuId,qty:1}]:[]),...(desired.quantity?[{kind:'deduct',skuId:desired.skuId,qty:-1}]:[])];
    for(const operation of operations) {
      if(!actorUid || typeof actorUid!=='string')throw invalid('영양제 저장 계정을 확인해주세요.');
      if(stockTargets.has(operation.skuId))throw invalid('같은 영양제 SKU의 여러 생산 변경을 한 요청으로 처리할 수 없습니다.');
      stockTargets.add(operation.skuId);
      const key=change.id+':'+operation.kind;
      if(!logRefs.has(key))logRefs.set(key,doc(collection(db,'supplementLogs')));
      const logRef=logRefs.get(key),stockRef=doc(db,'supplementStock',operation.skuId);
      const [stock,existingLog]=await Promise.all([transaction.get(stockRef),transaction.get(logRef)]);
      if(existingLog.exists())throw invalid('영양제 이동 요청 ID가 이미 사용됐습니다.');
      if(!stock.exists())throw invalid(operation.qty>0?'환급할 영양제 재고 근거가 없습니다. 관리자에게 문의해주세요.':'영양제 재고를 확인할 수 없습니다. 최신 자료를 다시 불러와주세요.');
      const before=stock.data().currentQty,after=before+operation.qty;
      if(!Number.isSafeInteger(before)||before<0||!Number.isSafeInteger(after))throw invalid('영양제 재고 수량이 비정상입니다. 관리자에게 문의해주세요.');
      if(after<0)throw invalid('영양제 재고가 부족합니다. 영양제 재고를 먼저 입고해주세요.');
      movement[operation.kind==='refund'?'refundLogId':'deductLogId']=logRef.id;
      businessWrites.push({kind:'update',ref:stockRef,data:{currentQty:after,lastMovementId:logRef.id,updatedAt:serverTimestamp()}});
      businessWrites.push({kind:'set',ref:logRef,data:{date,type:'autoDeduct',supplementTypeId:operation.skuId,
        qty:operation.qty,before,after,uid:actorUid,timestamp:serverTimestamp(),movementSchemaVersion:3,
        relatedProductionId:change.id,productionOrderRevision:nextRevision,staffName:next.staffName||'',
        ...(operation.kind==='refund'?{reason:deleting?'production deleted':'production edited'}:{})}});
    }
    result.push({...change,data:{...change.data,supplementReservation:desired,supplementMovement:movement}});
    businessWrites.push({kind:entering?'set':'update',ref:proofRef,data:{kind:'production',version:1,
      productionId:change.id,skuId:desired.skuId,quantity:desired.quantity,orderRevision:nextRevision,
      updatedBy:actorUid,updatedAt:serverTimestamp()}});
  }
  return {changes:result,businessWrites};
}
