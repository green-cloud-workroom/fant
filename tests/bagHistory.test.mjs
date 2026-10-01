import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

const instrument='\nexport function reviewBagLogs(id,read){return loadBagDetailLogs(id,read);}';

test('bag detail reads only the selected bag newest 30 logs when index is available',async()=>{
 const e=await pageEnvironment('bag',{instrument});
 try{
  e.state.rows.bagLogs=Array.from({length:135},(_,i)=>({id:`baglog${String(i).padStart(3,'0')}`,bagTypeId:i<100?'other':'b1',timestamp:135-i,date:e.today,type:'in',qty:1}));
  const rows=await e.page.reviewBagLogs('b1');
  assert.equal(rows.length,30);
  assert.deepEqual(Array.from(rows,row=>row.id),Array.from({length:30},(_,i)=>`baglog${String(i+100).padStart(3,'0')}`));
  const reads=e.state.reads.filter(read=>read.path==='bagLogs');
  assert.equal(reads.length,1);
  assert.ok(reads[0].conditions.some(condition=>condition.type==='where'&&condition.field==='bagTypeId'&&condition.value==='b1'));
  assert.ok(reads[0].conditions.some(condition=>condition.type==='order'&&condition.field==='timestamp'&&condition.direction==='desc'));
  assert.ok(reads[0].conditions.some(condition=>condition.type==='limit'&&condition.n===30));
 }finally{await e.cleanup();}
});

test('bag detail falls back to selected bag query after missing-index error',async()=>{
 const e=await pageEnvironment('bag',{instrument});
 try{
  e.state.rows.bagLogs=Array.from({length:35},(_,i)=>({id:`baglog${String(i).padStart(3,'0')}`,bagTypeId:'b1',timestamp:i+1,date:e.today,type:'in',qty:1}));
  let indexedAttempts=0;
  const read=ref=>{
   if(ref.conditions.some(condition=>condition.type==='order')){
    indexedAttempts++;
    throw Object.assign(new Error('missing index'),{code:'failed-precondition'});
   }
   return e.api.getDocs(ref);
  };
  const first=await e.page.reviewBagLogs('b1',read);
  const second=await e.page.reviewBagLogs('b1',read);
  assert.equal(indexedAttempts,1);
  assert.deepEqual(Array.from(first,row=>row.id),Array.from({length:30},(_,i)=>`baglog${String(34-i).padStart(3,'0')}`));
  assert.deepEqual(Array.from(second,row=>row.id),Array.from(first,row=>row.id));
  const reads=e.state.reads.filter(item=>item.path==='bagLogs');
  assert.equal(reads.length,2);
  assert.ok(reads.every(item=>item.conditions.some(condition=>condition.type==='where'&&condition.field==='bagTypeId'&&condition.value==='b1')));
  assert.ok(reads.every(item=>!item.conditions.some(condition=>condition.type==='order')));
 }finally{await e.cleanup();}
});
