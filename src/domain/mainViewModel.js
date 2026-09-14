// Pure read model; rows keep Firestore Timestamp values for existing sorting.
export function buildMainViewModel({ today, nextBizDay, overdueNextBizDay, allProds,
  recipeRows, meatTypeRows, meatRows, eggStock, equipmentAlerts, completionDoc,
  overdueCompletionDoc, overdueClosing, blocks, calendar, logs }) {
  const overdueDate = overdueClosing?.date || null;
  const forDate = date => date ? allProds.filter(p => p.date === date && p.status !== 'deleted') : [];
  return {
    productions: forDate(today), nextProductions: forDate(nextBizDay), recipes: recipeRows,
    meatTypeRows, meatStocks: meatRows.filter(s => !s.closed), eggStock, equipmentAlerts,
    completionDoc, overdueCompletionDoc, blockingData: blocks,
    overdueClosingDate: overdueDate, overdueClosingAlreadyClosed: Boolean(overdueClosing?.closed),
    overdueProductions: forDate(overdueDate), overdueNextProductions: forDate(overdueNextBizDay),
    ...calendar, combinedLogs: logs,
  };
}
export function copyMainModel(model) {
  // Preserve SDK immutable Timestamp instances but detach every editable nested row.
  if (model == null || typeof model !== 'object' || typeof model.toMillis === 'function') return model;
  if (model instanceof Date) return new Date(model.getTime());
  if (Array.isArray(model)) return model.map(copyMainModel);
  return Object.fromEntries(Object.entries(model).map(([key,value]) => [key, copyMainModel(value)]));
}
