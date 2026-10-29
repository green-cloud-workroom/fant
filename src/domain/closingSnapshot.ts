type Row = {id: string; data: Record<string, any>}
export type ClosingStocks = {egg: Record<string, any> | undefined; bags: Row[]; meats: Row[]; pans: Row[]; separations: Row[]}

// Keep the v2 row schema: user supplied names are values, never field keys.
export function closingSnapshot(stocks: ClosingStocks) {
  const qty = (value: unknown, path: string): number => {
    if (value == null) return 0
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${path}: finite number required`)
    return value
  }
  const add = (a: number, b: number): number => {
    const total = a + b
    if (!Number.isFinite(total)) throw new Error('Snapshot sum overflow')
    return total
  }
  const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0
  const stages = ['frozen', 'processed', 'repacked']
  const meatTotals = new Map(stages.map(stage => [stage, new Map<string, number>()]))
  for (const {id, data} of stocks.meats) {
    if (data.closed) continue
    const remaining = qty(data.remaining, `meatStocks/${id}`)
    if (remaining <= 0) continue
    const stage = meatTotals.get(data.stage)
    if (!stage || typeof data.meatTypeId !== 'string' || !data.meatTypeId) throw new Error(`Invalid meat stock ${id}`)
    stage.set(data.meatTypeId, add(stage.get(data.meatTypeId) ?? 0, remaining))
  }
  let panTotal = 0
  for (const {id, data} of stocks.pans) {
    const remaining = qty(data.remaining, `frozenPanLots/${id}`)
    if (remaining > 0) panTotal = add(panTotal, remaining)
  }
  const types = ['notSeparated', 'separated', 'noSplit']
  const sepTotals = new Map<string, Map<string, number>>()
  for (const {id, data} of stocks.separations) {
    const remaining = qty(data.remaining, `frozenSeparation/${id}`)
    if (remaining <= 0) continue
    const product = data.productName ?? '미지정'
    if (typeof product !== 'string' || !product || !types.includes(data.stockType)
      || data.separationType != null && data.separationType !== data.stockType) throw new Error(`Invalid separated stock ${id}`)
    const byType = sepTotals.get(product) ?? new Map<string, number>()
    byType.set(data.stockType, add(byType.get(data.stockType) ?? 0, remaining))
    sepTotals.set(product, byType)
  }
  return {
    egg: {currentQty: qty(stocks.egg?.currentQty, 'eggStock/global.currentQty')},
    bagRows: stocks.bags.map(({id, data}) => ({bagTypeId: id, currentQty: qty(data.currentQty, `bagTypes/${id}`)}))
      .sort((a, b) => compare(a.bagTypeId, b.bagTypeId)),
    meatRows: stages.flatMap(stage => [...meatTotals.get(stage)!].sort(([a], [b]) => compare(a, b))
      .map(([meatTypeId, remaining]) => ({stage, meatTypeId, remaining}))),
    frozenPan: panTotal > 0 ? {'미지정': panTotal} : {},
    frozenSepRows: [...sepTotals].sort(([a], [b]) => compare(a, b)).flatMap(([productName, byType]) => types
      .filter(stockType => byType.has(stockType)).map(stockType => ({productName, stockType, remaining: byType.get(stockType)!}))),
  }
}
