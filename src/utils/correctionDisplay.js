import {escapeHtml as h} from './html.js';
import {itemName,quantityText,unitText} from './staffText.js';
export function supportReference(value) {
  return '<details class="support-reference"><summary>문의용 번호 보기</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;user-select:all">'+h(value)+'</pre></details>';
}
export function correctionSummary(request, {lots=[],context={},createdAt}={}) {
  if(!request)return '';
  const lines=(request.lines||[]).map((line,index)=>{
    const lot=lots.find(l=>l.productId===line.productId&&l.lotKey===line.lotKey);
    const name=itemName(lot?.productName||line.productName||context.productName||context.recipeName,'품목 '+(index+1)+' · 품목명 확인 필요');
    return name+' · '+quantityText(line.qty)+(lot?.unit||line.unit?unitText(lot?.unit||line.unit):' (단위 확인 필요)');
  });
  const date=createdAt?new Date(createdAt):null;
  const when=date&&!Number.isNaN(date.getTime())?date.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'저장 시각 확인 필요';
  return '<p>미확정 '+(request.mode==='cancel'?'입고 취소':'입고 수량 정정')+' · '+h(when)+'</p><p>'+h(request.mode==='cancel'?'전체 수량 취소':lines.join(' / '))+'</p><p>사유: '+h(request.reason)+'</p>'
    +supportReference([request.operationId,...(request.lines||[]).map(l=>l.productId+' / '+l.lotKey)].join('\n'));
}
