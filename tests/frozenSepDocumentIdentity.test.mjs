import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('stock body id cannot redirect FIFO or deletion to another document',async()=>{
  const e=await pageEnvironment('frozenSep',{instrument:'\nexport {loadFrozenSepStocks,loadFrozenSepLogs};'});
  try{
    const docs=[{id:'actual-a',data:()=>({id:'forged-b',productName:'검증',remaining:2,stockType:'separated'})},
      {id:'actual-b',data:()=>({id:'forged-b',productName:'검증',remaining:3,stockType:'separated'})},
      {id:'closed',data:()=>({id:'actual-a',closed:true,remaining:4})}];
    const before=JSON.stringify(docs.map(doc=>doc.data()));
    const result=await e.page.loadFrozenSepStocks({getDocs:async()=>({docs})});
    assert.deepEqual(Array.from(result,doc=>doc.id),['actual-a','actual-b']);
    assert.deepEqual(Array.from(result,doc=>doc.remaining),[2,3]);
    assert.equal(JSON.stringify(docs.map(doc=>doc.data())),before);assert.equal(e.state.writes.length,0);
  }finally{await e.cleanup();}
});
test('log body id cannot replace the server document identity',async()=>{
  const e=await pageEnvironment('frozenSep',{instrument:'\nexport {loadFrozenSepLogs};'});
  try{
    const result=await e.page.loadFrozenSepLogs({getDocs:async()=>({docs:[{id:'real-log',data:()=>({id:'other-log',qty:2,type:'outgoing'})}]})});
    assert.equal(result[0].id,'real-log');assert.equal(result[0].qty,2);assert.equal(result[0].type,'outgoing');assert.equal(e.state.writes.length,0);
  }finally{await e.cleanup();}
});
