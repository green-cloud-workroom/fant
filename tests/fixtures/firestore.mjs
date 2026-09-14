// In-memory fixture only. No Firebase imports or network access.
export function makeFirestore({ latencyMs = 0, alertCount = 80 } = {}) {
  const today = '2026-09-14';
  const dates = [];
  for (let cursor = new Date('2026-09-11T12:00:00Z'); dates.length < 14; cursor.setUTCDate(cursor.getUTCDate() - 1)) {
    if (![0, 6].includes(cursor.getUTCDay())) dates.unshift(cursor.toISOString().slice(0, 10));
  }
  const state = {
    latencyMs, reads: [], writes: [], transactions: 0, activeTransactions: 0, peakTransactions: 0,
    failures: new Set(), beforeTransaction: null,
    rows: {
      productions: [...dates, today].map((date, i) => ({ id: 'p'+i, date, sortOrder: i, status: 'completed', category: 'raw', received: date !== today,
        recipeId: 'r1', recipeName: '검증 레시피', productionUnitQty: 1, rawBoxQty: 1, ingredientsSnapshot: [] })),
      recipes: [{ id:'r1', name:'검증 레시피', category:'raw', target:'cat', active:true, sortOrder:0, unitPresets:[1], ingredients:[], productionMethods:[] }],
      closings: dates.map(date => ({ id:date, status:'closed' })),
      productionCompletion: dates.map(date => ({ id:date, runDate:date, status:'completed' })),
      eggStock: [{ id:'global', currentQty:100, minimumQty:0 }],
      supplementTypes: Array.from({length:alertCount},(_,i)=>({id:'s'+i, name:'검증 영양제 '+i, active:true,sortOrder:i})),
      supplementStock: Array.from({length:alertCount},(_,i)=>({id:'s'+i, currentQty:0})),
      activityLogs: Array.from({length:alertCount},(_,i)=>({id:`auto_minStock_alert_${today}_supplementMin_alert_s${i}`,date:today,action:'minStock',subAction:'alert',acknowledged:true,message:'검증 부족재고 '+i,timestamp:{seconds:1789340400}})),
      staffGroups: ['senior','lead','office'].map(id=>({id,members:[{name:'검증 담당자'}]})),
      holidays:[], meatTypes:[],meatStocks:[],bagTypes:[],settings:[],events:[],schedules:[],equipments:[],equipmentParts:[],
    },
  };
  const reference = (...parts) => ({ path:parts.filter(p=>typeof p === 'string').join('/'), conditions:[] });
  const delay = () => state.latencyMs ? new Promise(resolve=>setTimeout(resolve,state.latencyMs)) : Promise.resolve();
  const snapshot = row => ({ id:row?.id, exists:()=>Boolean(row), data:()=>row && {...row} });
  const getRow = ref => { const parts=ref.path.split('/');const id=parts.pop();return (state.rows[parts.join('/')]||[]).find(row=>row.id===id); };
  const setRow = (ref,data) => {const parts=ref.path.split('/');const id=parts.pop();const key=parts.join('/');const rows=state.rows[key]||=[];const i=rows.findIndex(r=>r.id===id);const row={id,...data};if(i<0)rows.push(row);else rows[i]=row;state.writes.push(ref.path);};
  const api = {
    collection:(_,...parts)=>reference(...parts), doc:(_,...parts)=>reference(...parts),
    where:(field,op,value)=>({type:'where',field,op,value}), orderBy:(field,direction='asc')=>({type:'order',field,direction}), limit:n=>({type:'limit',n}), startAfter:()=>({type:'cursor'}),
    query:(ref,...conditions)=>({...ref,conditions:[...(ref.conditions||[]),...conditions]}),
    queryEqual:(a,b)=>JSON.stringify(a)===JSON.stringify(b),
    async getDoc(ref) {state.reads.push({kind:'doc',...ref});await delay();if(state.failures.has(ref.path))throw Error('fixture read failed: '+ref.path);return snapshot(getRow(ref));},
    async getDocs(ref) {
      state.reads.push({kind:'query',...ref});await delay();if(state.failures.has(ref.path))throw Error('fixture read failed: '+ref.path);
      let rows=[...(state.rows[ref.path]||[])].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
      for(const c of ref.conditions||[]) {
        const fieldValue=r=>c.field==='__name__'?r.id:r[c.field];
        if(c.type==='where')rows=rows.filter(r=>{const v=fieldValue(r);return c.op==='=='?v===c.value:c.op==='>='?v>=c.value:c.op==='<='?v<=c.value:c.op==='<'?v<c.value:c.op==='>'?v>c.value:false;});
        if(c.type==='order')rows=rows.filter(r=>fieldValue(r)!==undefined).sort((a,b)=>{const av=fieldValue(a),bv=fieldValue(b);return (av<bv?-1:av>bv?1:0)*(c.direction==='desc'?-1:1);});
        if(c.type==='limit')rows=rows.slice(0,c.n);
      }
      const docs=rows.map(snapshot);return {docs,empty:docs.length===0,size:docs.length};
    },
    serverTimestamp:()=>({seconds:1789340400}),
    async runTransaction(_, callback) {
      state.transactions++;state.activeTransactions++;state.peakTransactions=Math.max(state.peakTransactions,state.activeTransactions);
      try {
        await state.beforeTransaction?.();
        const pending=[];
        const result=await callback({get:api.getDoc,set:(ref,data)=>pending.push([ref,data])});
        for(const [ref,data] of pending)setRow(ref,data);
        return result;
      } finally {state.activeTransactions--;}
    },
    setDoc:async(ref,data)=>setRow(ref,data),
    addDoc:async()=>{throw Error('fixture forbids addDoc');}, updateDoc:async()=>{throw Error('fixture forbids updateDoc');},
    deleteDoc:async()=>{throw Error('fixture forbids deleteDoc');}, writeBatch:()=>{throw Error('fixture forbids writeBatch');},
  };
  return { state, api, dates, today };
}

export const fixture = makeFirestore({latencyMs:50});
export const increment = value => ({increment:value});
export const { collection,doc,where,orderBy,limit,startAfter,query,queryEqual,getDoc,getDocs,serverTimestamp,runTransaction,setDoc,addDoc,updateDoc,deleteDoc,writeBatch } = fixture.api;
