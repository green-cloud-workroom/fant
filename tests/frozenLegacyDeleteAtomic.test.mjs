// The former client refund/soft-delete path is intentionally retired. These
// VM callbacks verify HOLD/no-write routing; they are not a real callable SDK.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
for (const variant of ['ordinary','sampleSet','noBag','missingLedger','bagDrift','lookupFailure']) test(`legacy ${variant} cancellation keeps all business documents unchanged`,async()=>{
  const e=await pageEnvironment('frozenProduct');
  try{
    const product=e.state.rows.frozenProducts[0];
    if(variant==='sampleSet')product.kind='sampleSet';
    e.state.rows.frozenLogs=[{id:'receipt-1',productId:product.id,date:e.today,timestamp:new Date(),qty:4,status:'active',bagTypeId:variant==='noBag'?null:'b1',deductedBagQty:variant==='noBag'?0:4,ledgerId:'ledger-1'}];
    e.state.rows.stockLedger=variant==='missingLedger'?[]:[{id:'ledger-1',status:'active',actionId:'receipt-1'}];
    if(variant==='bagDrift')e.state.rows.bagTypes[0].currentQty=90;
    const calls=[];
    const functions=e.cache.get('firebase/functions');functions.setExport('getFunctions',()=>({}));functions.setExport('httpsCallable',()=>async payload=>{
      calls.push(payload.action);
      if(variant==='lookupFailure')throw Error('synthetic context unavailable');
      return {data:payload.action==='identity'?{production:true,sharedQc:false,employeeId:'employee'}:{eligible:false,blockers:['REQUEST_NOT_PENDING'],context:{sourceId:'receipt-1'},source:{sourceId:'receipt-1',productId:product.id}}};
    });
    const before=JSON.stringify(e.state.rows);
    await e.page.renderFrozenProduct();await e.fire(`.recipe-list-item[data-id="${product.id}"]`);await e.fire('.btn-del-row');
    assert.equal(JSON.stringify(e.state.rows),before);
    assert.deepEqual(e.state.writes,[]);assert.equal(e.state.commits.length,0);
    assert.equal(calls.some(x=>x==='cancelFrozenSource'),false);
    assert.equal(e.document.querySelector('#btnSubmitFrozenSource'),null);
  }finally{await e.cleanup();}
});
