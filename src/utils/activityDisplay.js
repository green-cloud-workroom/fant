import {displaySupplementLogMessage} from './activityLogMessage.js';
import {MOVEMENT_LABELS} from '../services/manualMovementLogic.js';
import {itemName, quantityText, stockUnit, readableNote} from './staffText.js';

const actionNames={bag:'봉투',egg:'계란',meat:'원료',frozenProduct:'동결제품',frozenSep:'분리작업',breadPan:'빵판',frozenPan:'동결판',supplementStock:'영양제',production:'생산',recipe:'레시피',settings:'설정',schedule:'입고 예정',closing:'마감',holiday:'휴무일',conversion:'환산값',equipment:'설비 부품',autoRepack:'자동 재포장'};
const collections={bag:'bagLogs',egg:'eggLogs',meat:'meatLogs',breadPan:'breadPanLogs',frozenPan:'frozenPanLogs',supplementStock:'supplementLogs'};
const requestLabels={create:'신청 생성',editItems:'품목 수정',editNote:'메모 수정',changeRequest:'변경 요청',start:'준비 시작',adjustQty:'수량 조정',complete:'입고 요청',cancel:'신청 취소',reopen:'다시 신청',stockIn:'입고'};
export function displayActivity(log, types=[]) {
  const d=log.details||{},m=d.manualMovement;
  let message=displaySupplementLogMessage(log,types);
  const category=actionNames[log.action]||'작업';
  if(log.action==='supplementRequest')return '영양제 · '+(requestLabels[log.subAction]||'신청 변경');
  if(log.subAction==='activeToggle') {
    let name=d.bagName||d.meatName||d.recipeName||message.split(' — ')[1];
    if([d.bagTypeId,d.meatTypeId,d.recipeId].filter(Boolean).includes(name))name=null;
    return category+' '+(d.active===false||/\binactive\b/.test(message)?'사용 중지':'사용 시작')+' · '+itemName(name);
  }
  const source=d.sourceCollection||collections[log.action];
  // Historical manual entries put the item name and entered amount in the message.
  const old=/^(실제 입고|사용|실사 보정|오입력 취소|테스트) — (.*?) ([+-]?\d[\d,]*(?:\.\d+)?)(?:장|개|판|봉|kg|g)?(?:\s|$)/.exec(message);
  if(source && (m||old)) {
    const entered=m?.enteredAmount??(old?Number(old[3].replaceAll(',','')):d.delta);
    const typeId=d.supplementTypeId;
    let name=d.bagName||d.meatName||d.productName||d.supplementName||old?.[2];
    if(source==='supplementLogs') {
      const matched=types.find(t=>t.id===typeId||t.id===name);
      if(matched)name=matched.name;
      else if(name===typeId||/^[A-Za-z0-9_-]+_\d+(?:\.\d+)?$/.test(name||''))name='영양제 품목명 확인 필요';
    }
    const label=MOVEMENT_LABELS[m?.kind]||old?.[1]||'재고 변동';
    const qty=source==='meatLogs'?(m?Number(entered)/1000:/kg(?:\s|$)/.test(message)?Number(entered):Number(entered)/1000):entered;
    const sign=['실사 보정','오입력 취소'].includes(label)&&Number(qty)>0?'+':'';
    const amount=['사용','실제 입고'].includes(label)?Math.abs(Number(qty)):qty;
    const reason=readableNote(m?.reason||d.reason||message.split(' / ')[1]||'');
    return itemName(name,category+' 품목명 확인 필요')+(category==='봉투'&&!String(name).includes('봉투')?' 봉투':'')+' · '+label+' '+sign+quantityText(amount)+stockUnit(source)
      +(m?.kind==='test'||label==='테스트'?' (재고 변동 없음)':'')
      +(reason?' / 사유: '+reason:'')+(log.staff?' / 담당: '+log.staff:'');
  }
  if(log.action==='supplementStock') {
    if(d.supplementTypeId&&!types.some(t=>t.id===d.supplementTypeId))message=message.replaceAll(d.supplementTypeId,'영양제 품목명 확인 필요');
    message=message.replace(/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]+_\d+(?:\.\d+)?(?![A-Za-z0-9_-])/g,'영양제 품목명 확인 필요');
  }
  message=message.replace(/^[A-Za-z]+:[A-Za-z]+\s*[—-]\s*/,'');
  return readableNote(message);
}
