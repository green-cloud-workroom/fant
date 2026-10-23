// Read-only checks. Similar receipts are review requests, never automatic stock corrections.
import { validDate, daysBetween } from './statsLogic.js';
import { manualMovementIndex } from './manualMovementLogic.js';

const collections = ['meatLogs', 'bagLogs', 'eggLogs', 'supplementLogs'];
const active = r => !['deleted', 'cancelled', 'canceled'].includes(r.status);
export function cancellationChecks(data, range) {
  const issues = [], invalid = [];
  for (const collection of collections) for (const row of data[collection] || []) {
    if (row.manualMovement?.kind !== 'cancel') continue;
    const sourcePath = collection + '/' + row.id;
    try {
      manualMovementIndex({ [collection]: (data[collection] || []).filter(r => r === row || r.id === row.manualMovement.cancelOf) });
    } catch (error) {
      invalid.push(sourcePath);
      if (!validDate(row.date) || row.date < range.startDate || row.date > range.endDate) continue;
      const original = (data[collection] || []).find(r => r.id === row.manualMovement.cancelOf);
      const amount = r => collection === 'meatLogs' ? r?.delta : r?.qty;
      const scale = collection === 'meatLogs' ? 0.001 : 1;
      const qty = amount(original), cancelQty = amount(row);
      issues.push({ kind: 'cancellation', identity: sourcePath, title: '오입력 취소 연결·수량 확인',
        evidence: { source: sourcePath, originalSource: collection + '/' + (row.manualMovement.cancelOf || '미연결'),
          date: row.date, originalDate: original?.date || '미확인',
          qty: Number.isFinite(qty) ? qty * scale : null,
          cancelQty: Number.isFinite(cancelQty) ? cancelQty * scale : null,
          remainingQty: Number.isFinite(qty) && Number.isFinite(cancelQty) ? (qty + cancelQty) * scale : null,
          unit: ({ meatLogs: 'kg', bagLogs: '장', eggLogs: '개', supplementLogs: '봉' })[collection],
          reason: row.manualMovement.reason || row.reason || '미기재', problem: error.message } });
    }
  }
  return { issues, invalid };
}

function scheduleLinks(data, event) {
  const [collection, id] = event.source.split('/');
  const row = data[collection]?.find(r => r.id === id), ids = new Set();
  if (row?.manualMovement?.scheduleId) ids.add(row.manualMovement.scheduleId);
  for (const ledger of data.stockLedger || []) {
    if (ledger.actionType !== 'scheduleComplete' || !ledger.actionId) continue;
    if (ledger.items?.some(i => collection === 'bagLogs' ? i.bagLogId === id
      : collection === 'eggLogs' ? i.eggLogId === id
        : collection === 'meatLogs' && i.docId === row?.meatStockId && row?.meatStockId
          && (data.meatLogs || []).filter(r => r.type === 'frozenIncoming' && r.meatStockId === row.meatStockId).length === 1)) ids.add(ledger.actionId);
  }
  // A schedule must exist and identify this same item. Cross-item IDs are not duplicate proof.
  return [...ids].filter(id => (data.schedules || []).some(s => s.id === id
    && ({ meat: 'meatLogs:', bag: 'bagLogs:', egg: 'eggLogs:' })[s.type]
      + (s.type === 'egg' ? 'egg' : s.itemId) === event.itemId));
}

export function duplicateReceiptChecks(data, events, startDate = '') {
  const rows = [...new Map(events.map(e => [e.source, e])).values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.source.localeCompare(b.source));
  const links = new Map(rows.map(e => [e.source, scheduleLinks(data, e)]));
  return rows.flatMap((event, index) => {
    if (event.date < startDate) return [];
    const prior = rows.slice(0, index).filter(e => e.itemId === event.itemId && e.stage === event.stage && e.unit === event.unit);
    const linked = prior.find(e => links.get(e.source).some(id => links.get(event.source).includes(id)));
    const similar = prior.find(e => e.qty === event.qty && daysBetween(e.date, event.date) <= 3
      // Distinct known schedules are affirmative evidence of separate deliveries.
      && !(links.get(e.source).length && links.get(event.source).length));
    const original = linked || similar;
    if (!original) return [];
    return [{ kind: 'duplicateReceipt', identity: event.source,
      title: event.name + (linked ? ' 같은 입고예정 중복 기록 확인' : ' 중복입고 의심 확인'),
      evidence: { source: event.source, originalSource: original.source, itemId: event.itemId,
        date: event.date, originalDate: original.date, qty: event.qty, originalQty: original.qty,
        unit: event.unit, scheduleIds: links.get(event.source).filter(id => links.get(original.source).includes(id)),
        basis: linked ? '같은 입고예정에 입고 기록이 여러 건 연결됨' : '중복입고 의심: 3일 이내 같은 품목·단계·단위·수량 반복. 별도 정상 입고일 수도 있습니다.',
        stage: event.stage } }];
  });
}

export function explicitlyRemovedReceipt(data, supply, path) {
  const [collection, id] = path.split('/');
  const row = data[collection]?.find(r => r.id === id);
  return !!row && (!active(row) || supply.adjustments.some(c => c.kind === 'excludeSupply' && c.source === path)
    || manualMovementIndex(data).has(path));
}
