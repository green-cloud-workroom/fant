// Notification state only. These functions never change stock or closing decisions.
export const stockAlertKinds = {egg:'계란',meat:'원료',bag:'봉투',supplement:'영양제',part:'설비 부품'};
export const isStockAlert = log => log.action === 'minStock' && log.subAction === 'alert';
const number = value => Number.isFinite(Number(value)) ? Number(value) : null;
const status = item => item.current === null || item.minimum === null ? 'unknown'
  : item.minimum > 0 && item.current < item.minimum ? (item.current <= 0 ? 'empty' : 'low') : 'normal';
export function stockAlertCatalog(data) {
  const items=[];
  const add=(kind,id,name,current,minimum,unit,route)=>{
    const item={key:kind+':'+id,kind,itemId:id,name:name||stockAlertKinds[kind]+' 품목명 확인 필요',current:number(current),minimum:number(minimum),unit,route};
    item.status=status(item);items.push(item);
  };
  add('egg','global','계란',data.eggStock?.currentQty??0,data.eggStock?.minimumQty??0,'개','egg');
  for(const m of data.meatTypes) add('meat',m.id,m.name,data.meatStocks.filter(s=>!s.closed&&s.meatTypeId===m.id).reduce((n,s)=>n+Number(s.remaining||0),0)/1000,Number(m.minimumQtyG||0)/1000,'kg','meat');
  for(const b of data.bagTypes) add('bag',b.id,b.name,b.currentQty??0,b.minimumQty??0,'장','bag');
  for(const t of data.supplementTypes.filter(t=>t.active===true)) add('supplement',t.id,t.name,data.supplementStock.find(s=>s.id===t.id)?.currentQty??0,5,'봉','supplement');
  for(const p of data.equipmentParts.filter(p=>p.active!==false)) add('part',p.id,[p.equipmentAlias||p.equipmentCategory,p.name].filter(Boolean).join(' · '),p.currentQty??0,p.minimumQty??0,'개','equipment');
  for(const item of items) item.schedules=data.schedules.filter(s=>s.status==='scheduled'&&s.type===item.kind&&(item.kind==='egg'||s.itemId===item.itemId)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  return items;
}
function legacyKey(log,catalog) {
  const d=log.details||{};
  if(d.stockAlert?.version===1)return d.stockAlert.key;
  const id=({egg:'global',meat:d.meatTypeId,bag:d.bagTypeId,supplement:d.supplementTypeId,part:d.partId})[d.kind];
  if(id)return d.kind+':'+id;
  // Older logs may omit details but retain the original deterministic daily ID.
  return catalog.find(item=>{
    const suffix=(item.kind==='supplement'?'supplementMin:alert:':item.kind==='egg'?'minStock:egg':'minStock:'+item.kind+':')+(item.kind==='egg'?'':item.itemId);
    return d.dedupKey===suffix||log.id?.endsWith('_'+suffix.replace(/[^\w-]/g,'_'));
  })?.key;
}
const millis=log=>log.timestamp?.toMillis?.()||Number(log.timestamp?.seconds||0)*1000;
export function stockAlertModel(catalog,logs,today) {
  const heads=new Map();
  for(const log of logs.filter(isStockAlert)) {
    const key=legacyKey(log,catalog);if(!key)continue;
    const old=heads.get(key),v=log.details?.stockAlert?.sequence||0,ov=old?.details?.stockAlert?.sequence||0;
    if(!old||v>ov||v===ov&&(String(log.date)>String(old.date)||log.date===old.date&&(millis(log)>millis(old)||millis(log)===millis(old)&&log.id>old.id)))heads.set(key,log);
  }
  const plans=[],items=[];
  // A removed/inactive catalog item ends its observed shortage without changing stock.
  const all=[...catalog,...[...heads.keys()].filter(key=>!catalog.some(i=>i.key===key)).map(key=>({key,status:'normal',name:heads.get(key).details?.name||'품목',kind:key.split(':')[0]}))];
  for(const item of all) {
    if(item.status==='unknown')continue;
    const head=heads.get(item.key),saved=head?.details?.stockAlert;
    const previous=saved?.status||(head?(Number(head.details?.current??item.current)<=0?'empty':'low'):'normal');
    const low=['low','empty'].includes(item.status);
    const transition=low?(previous==='normal'||previous==='low'&&item.status==='empty'):previous!=='normal';
    let eventId=head?.id;
    if(transition) {
      const sequence=(saved?.sequence||0)+1;
      eventId='stock_alert_v1_'+encodeURIComponent(item.key)+'_'+sequence;
      plans.push({eventId,action:'minStock',subAction:'alert',date:today,acknowledged:!low,
        message:low?`${item.name} 부족 — 현재 ${item.current}${item.unit} / 최소 ${item.minimum}${item.unit}`:`${item.name} 부족 상태 해제`,
        details:{kind:item.kind,name:item.name,
          ...(item.itemId&&item.kind!=='egg'?{[{meat:'meatTypeId',bag:'bagTypeId',supplement:'supplementTypeId',part:'partId'}[item.kind]]:item.itemId}:{}),
          // Legacy meat alert details use grams; the displayed catalog uses kg.
          current:item.current==null?null:item.current*(item.kind==='meat'?1000:1),
          minimum:item.minimum==null?null:item.minimum*(item.kind==='meat'?1000:1),unit:item.kind==='meat'?'g':item.unit||'',
          stockAlert:{version:1,key:item.key,sequence,status:item.status,previousId:head?.id||null}},dedupKey:item.key});
    }
    if(low) items.push({...item,eventId,unseen:transition||head?.acknowledged!==true,transition,
      shortage:Math.max(0,item.minimum-item.current)});
  }
  items.sort((a,b)=>Number(b.unseen)-Number(a.unseen)||Number(b.current<=0)-Number(a.current<=0)||a.name.localeCompare(b.name,'ko'));
  return {items,plans,heads,unknown:catalog.filter(i=>i.status==='unknown')};
}
export const stockAlertFingerprint = item => JSON.stringify([item.key,item.eventId,item.current,item.minimum,item.status]);
