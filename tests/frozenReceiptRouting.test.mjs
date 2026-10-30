import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
test('production handoff routes context to productionReceiptCommand',async()=>{
 const e=await pageEnvironment('frozenProduct');
 try {
  const calls=[];
  e.cache.get('firebase/functions').setExport('getFunctions',(_app,region)=>{assert.equal(region,'asia-northeast3');return {};});
  e.cache.get('firebase/functions').setExport('httpsCallable',(_functions,name)=>{assert.equal(name,'productionReceiptCommand');return async data=>{calls.push(data);return {data:{receiptStatus:'completed'}};};});
  const service=await e.load('src/services/inventoryHandoff.js');
  await assert.rejects(service.showHandoff('synthetic-receipt'),/이미 처리된/);
  assert.equal(calls.length,1);assert.equal(calls[0].action,'context');assert.equal(calls[0].receiptId,'synthetic-receipt');
 } finally {await e.cleanup();}
});
