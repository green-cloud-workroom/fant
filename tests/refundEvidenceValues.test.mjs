import test from 'node:test';
import assert from 'node:assert/strict';
import {Timestamp,GeoPoint,Bytes,doc,getFirestore} from 'firebase/firestore';
import {initializeApp,deleteApp} from 'firebase/app';
import vm from 'node:vm';
import {refundEvidenceFingerprint as fp} from '../src/utils/refundEvidence.js';
test('refund evidence preserves typed SDK data and timestamp nanoseconds without network',async()=>{
  assert.notEqual(fp('a',{t:new Timestamp(1,1)}),fp('a',{t:new Timestamp(1,2)}));
  assert.notEqual(fp('a',{t:new Timestamp(1,1)}),fp('a',{t:{seconds:1,nanoseconds:1}}));
  assert.notEqual(fp('a',{g:new GeoPoint(1,2)}),fp('a',{g:new GeoPoint(1,3)}));
  assert.notEqual(fp('a',{b:Bytes.fromBase64String('AA==')}),fp('a',{b:'AA=='}));
  assert.equal(fp('a',{z:1,a:[null,true]}),fp('a',{a:[null,true],z:1}));
  assert.equal(fp('a',vm.runInNewContext('({x:1})')),fp('a',{x:1}));
  assert.throws(()=>fp('a',new (class Unsupported {constructor(){this.x=1;}})()),/INVALID/);
  assert.notEqual(fp('a',{id:'spoofed'}),fp('b',{id:'spoofed'}));
  const app=initializeApp({projectId:'demo-refund-values'},'refund-values');
  try{const db=getFirestore(app);assert.notEqual(fp('a',{r:doc(db,'x','one')}),fp('a',{r:doc(db,'x','two')}));}
  finally{await deleteApp(app);}
  assert.throws(()=>fp('a',{bad:undefined}),/INVALID/);
});
