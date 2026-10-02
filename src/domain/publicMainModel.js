// Public display DTO. Commands always re-read originals through the action gateway.
const fields = {
  production: 'id batchNo breadPanQty category color date freezeDryBagQty freezePanQty productionUnitName productionUnitQty rawBoxQty received receivedBox receivedFreezeQty receivedFreezeType receivedLoosePacks receivedLotId receivedMethod receivedPlates receivedRemainder receivedRevision receivedTotalPacks recipeId recipeName requiresSeparation round sortOrder staffName status target',
  recipe: 'id active bagTypeId breadPanCountPerUnit category color displayName freezeDryBagCountPerUnit freezePanCountPerUnit name packWeightG packsPerPlate requiresSeparation sortOrder target usesSupplement version',
  ingredient: 'id name baseWeightG requiredQtyG weightDisplayUnit isProductionUnit unitName autoDeductInventory linkedToInventory meatTypeId sortOrder',
  method: 'methodKey label unitToBox effectiveDate active',
  meatType: 'id active category defaultUnitWeightG groupId groupSortOrder minimumQtyG name showInStats sortOrder',
  meatStock: 'id batchColor batchId closed incomingDate initialQtyG meatNameSnapshot meatTypeId processedDate remaining repackedDate staffName stage status unitCount unitWeightG',
  part: 'id active currentQty cycleUnit cycleValue equipmentAlias equipmentCategory equipmentId lastReplacedAt minimumQty name nextDueAt sortOrder spec',
  completion: 'id ledgerId runDate staffName status targetProductionDate',
  schedule: 'id actualQty actualQtyG actualUnit date itemId itemNameSnapshot orderedQty orderedUnit orderedUnitGrams status type',
  event: 'id date title content',
  log: 'id action subAction date staff timestamp message acknowledged acknowledgedAt acknowledgedBy',
  logDetail: 'orderedQty actualQty orderedUnit unit orderedUnitGrams itemName',
};
const pick = (value, kind) => value == null ? value : Object.fromEntries(fields[kind].split(' ').filter(key => value[key] !== undefined).map(key => [key, value[key]]));
const production = row => ({...pick(row, 'production'), ...(row.ingredientsSnapshot ? {ingredientsSnapshot: row.ingredientsSnapshot.map(ingredient => pick(ingredient, 'ingredient'))} : {})});
const recipe = row => ({...pick(row, 'recipe'), ...(row.ingredients ? {ingredients: row.ingredients.map(ingredient => pick(ingredient, 'ingredient'))} : {}), ...(row.productionMethods ? {productionMethods: row.productionMethods.map(method => pick(method, 'method'))} : {})});
export function publicMainModel(model) {
  return {
    ...Object.fromEntries(['productions','nextProductions','overdueProductions','overdueNextProductions','calendarProductions'].map(key => [key, model[key].map(production)])),
    recipes: model.recipes.map(recipe), meatTypeRows: model.meatTypeRows.map(row => pick(row,'meatType')),
    meatStocks: model.meatStocks.map(row => pick(row,'meatStock')),
    eggStock: {currentQty:model.eggStock.currentQty ?? 0, minimumQty:model.eggStock.minimumQty ?? 0},
    equipmentAlerts: model.equipmentAlerts.map(alert => ({kind:alert.kind,dday:alert.dday,overdue:alert.overdue,part:pick(alert.part,'part')})),
    completionDoc: pick(model.completionDoc,'completion'), overdueCompletionDoc: pick(model.overdueCompletionDoc,'completion'),
    blockingData:model.blockingData, overdueClosingDate:model.overdueClosingDate, overdueClosingAlreadyClosed:model.overdueClosingAlreadyClosed,
    calendarSchedules:model.calendarSchedules.map(row => pick(row,'schedule')),calendarEvents:model.calendarEvents.map(row => pick(row,'event')),
    combinedLogs:model.combinedLogs.map(row => ({...pick(row,'log'),...(row.details?{details:pick(row.details,'logDetail')}:{})})),
  };
}
export function serializePublicModel(value) {
  if(value == null || typeof value !== 'object') return value;
  if(typeof value.toMillis === 'function') return {$timestampMillis:value.toMillis()};
  if(value instanceof Date) return {$timestampMillis:value.getTime()};
  if(Array.isArray(value)) return value.map(serializePublicModel);
  return Object.fromEntries(Object.keys(value).sort().map(key=>[key,serializePublicModel(value[key])]));
}
export const canonicalPublicJson = value => JSON.stringify(serializePublicModel(value));
export function revivePublicModel(value, timestamp) {
  if(value == null || typeof value !== 'object')return value;
  if(Object.keys(value).length===1 && Number.isFinite(value.$timestampMillis))return timestamp(value.$timestampMillis);
  if(Array.isArray(value))return value.map(row=>revivePublicModel(row,timestamp));
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,revivePublicModel(item,timestamp)]));
}
