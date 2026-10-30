// UI command-port fixture; server transactions are exercised separately in restore/package/tests.
export function sourceFlow(e,log){return {source:{sourceId:log.id,date:log.date,quantity:log.qty,revision:1,expiryDate:log.expiryDate??'',staffName:log.staffName??'',note:log.note??''},actor:{name:'본인'},dispatched:false,async submit(kind,values){
 const row=e.state.rows.frozenLogs.find(x=>x.id===log.id);if(row)Object.assign(row,{qty:values.quantity,expiryDate:values.expiryDate,staffName:values.staffName,note:values.note});e.state.writes.push('frozenLogs/'+log.id);
},async inspectResult(){return {confirmed:false}}};}
