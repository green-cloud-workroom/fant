import { escapeHtml as h } from '../utils/html.js';
import { formatKstDate } from '../utils/date.js';
import { round2, breadToSilicon } from '../utils/number.js';

export function groupLots(lots) {
  const groups = Object.create(null);
  for (const lot of lots) (groups[lot.productName] ??= []).push(lot);
  for (const group of Object.values(groups)) group.sort((a,b) => String(a.date).localeCompare(String(b.date)));
  return groups;
}

export function sectionName(name) {
  return name.includes('주식') ? '주식' : '간식';
}

export function productGroups(recipes, bread, frozen) {
  const groups = new Map();
  const add = (group, name) => {
    if (!groups.has(group)) groups.set(group, new Set());
    groups.get(group).add(name);
  };
  const active = new Set(recipes.map(recipe => recipe.displayName));
  for (const name of active) add(sectionName(name), name);
  for (const name of [...Object.keys(bread), ...Object.keys(frozen)]) {
    if (!active.has(name)) add('기타 보유 재고', name);
  }
  return ['주식','간식','기타 보유 재고'].filter(group => groups.has(group))
    .map(group => [group, [...groups.get(group)]]);
}

function millis(value) {
  if (value?.toMillis) return value.toMillis();
  if (Number.isFinite(value?.seconds)) return value.seconds * 1000;
  if (value == null || value === '') return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

// Freeze operations store the actual FIFO deductions on the order, not in frozenPanLogs.
function freezeMovements(orders) {
  const records = [];
  for (const order of orders) {
    const byProduct = new Map();
    for (const deduction of order.deductions || []) {
      if (deduction.productName && Number.isFinite(deduction.amount) && deduction.amount > 0)
        byProduct.set(deduction.productName, (byProduct.get(deduction.productName) || 0) + deduction.amount);
    }
    for (const [productName, qty] of byProduct) {
      const base = {productName, note: '동결가동 · ' + (order.date || '날짜 미상') + ' 발주서'};
      const created = millis(order.createdAt);
      records.push({...base, type:'freezeDeduct', qty:-qty, staffName:order.createdBy,
        timestamp:created, date:created ? formatKstDate(new Date(created)) : order.date});
      if (order.status === 'cancelled') {
        const cancelled = millis(order.cancelledAt);
        records.push({...base, type:'freezeRestore', qty, staffName:order.cancelledBy,
          timestamp:cancelled, date:cancelled ? formatKstDate(new Date(cancelled)) : ''});
      }
    }
  }
  return records;
}

export function movements(breadLogs, frozenLogs, orders) {
  const tag = (rows, kind) => rows.map(log => ({log, kind}));
  return [...tag(breadLogs,'bread'), ...tag([...frozenLogs, ...freezeMovements(orders)],'frozen')]
    .sort((a,b) => String(b.log.date || '').localeCompare(String(a.log.date || ''))
      || millis(b.log.timestamp) - millis(a.log.timestamp));
}

export const lotTotal = lots => round2((lots || []).reduce((n,lot) => n + Number(lot.remaining || 0), 0));

export function stockTotals(bread, frozen) {
  const count = lotTotal(bread);
  return '<div class="pan-totals"><span>빵판 <b>'+count+'개</b> <small>실리콘 환산 '+breadToSilicon(count)+'판</small></span>'
    + '<span>동결판 <b class="'+(lotTotal(frozen)<10?'pan-low':'')+'">'+lotTotal(frozen)+'판</b></span></div>';
}

export function productBoard(groups, selected, bread, frozen) {
  return '<section class="pan-box pan-board"><header><h3>품목별 현재고</h3><small>'
    +groups.reduce((n,[,names])=>n+names.length,0)+'종</small></header>'
    +'<div class="pan-columns"><span>품목</span><span>빵판</span><span>동결판</span></div>'
    +groups.map(([group,names])=>'<div class="pan-group"><h4>'+h(group)+' <small>'+names.length+'종</small></h4><div>'
      +names.map(name=>'<button type="button" data-product="'+h(name)+'" aria-pressed="'+(selected===name)+'">'
        +'<b>'+h(name)+'</b><span>'+lotTotal(bread[name])+'개</span><span>'+lotTotal(frozen[name])+'판</span></button>').join('')+'</div></div>').join('')
    +(!groups.length?'<p>조회할 품목이 없습니다.</p>':'')+'</section>';
}

export function historyTable(rows, limit, renderBread, renderFrozen, warning) {
  return (warning?'<p class="pan-warning" role="status">동결가동 발주서 이력을 불러오지 못했습니다. 빵판·동결판 기록만 표시합니다.</p>':'')
    +'<table class="data-table pan-log"><thead><tr><th>날짜</th><th>구분</th><th>품목</th><th>변동 수량</th><th>담당자</th><th>비고</th></tr></thead><tbody>'
    +rows.slice(0,limit).map(({log,kind})=>kind==='bread'?renderBread(log):renderFrozen(log)).join('')
    +'</tbody></table>'+(!rows.length?'<p>해당하는 이력이 없습니다.</p>':'')
    +(rows.length>limit?'<button class="btn-secondary" data-more>이력 더 보기 ('+limit+' / '+rows.length+'건)</button>':'');
}
