import test from 'node:test';
import assert from 'node:assert/strict';
import {environment} from './helpers/modules.mjs';
async function fixture(status=null){
  const e=await environment();const module=await e.load('src/services/productionClosingCommand.js');
  let state={uid:'office',epoch:1,day:'2026-09-14'},current=true;const calls=[];
  const options={readSession:()=>state,makeId:()=> 'closing-00000000000001',isCurrent:()=>current,
    invoke:async payload=>{calls.push(payload);if(payload.action==='context')return {version:status?'1790000000:123':null,status};return {operationId:payload.operationId,date:payload.date,status:payload.action==='close'?'closed':'released',replayed:false};}};
  return {module,calls,options,change:value=>state={...state,...value},leave:()=>current=false};
}
test('modal-open context is bound to one exact server request',async()=>{
  const f=await fixture(),command=await f.module.prepareProductionClosing('2026-09-14','close',f.options);
  assert.equal(f.calls.length,1);const result=await command.submit(' 담당 ');assert.equal(result.status,'closed');
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls[1])),{action:'close',date:'2026-09-14',staffName:'담당',operationId:command.operationId,expectedVersion:null});
  await assert.rejects(command.submit('담당'),/이미 전송/);assert.equal(f.calls.length,2);
});
test('released date and reason stay bound to captured version',async()=>{
  const f=await fixture('closed'),command=await f.module.prepareProductionClosing('2026-09-14','release',f.options);
  await assert.rejects(command.submit('담당',''),/사유/);assert.equal(f.calls.length,1);
  await command.submit('담당',' 검토 ');assert.equal(f.calls[1].expectedVersion,'1790000000:123');assert.equal(f.calls[1].reason,'검토');
});
for(const [label,change]of [['uid',{uid:'other'}],['epoch',{epoch:2}],['day',{day:'2026-09-15'}]])test('changed '+label+' prevents dispatch',async()=>{
  const f=await fixture(),command=await f.module.prepareProductionClosing('2026-09-14','close',f.options);f.change(change);
  await assert.rejects(command.submit('담당'),/변경/);assert.equal(f.calls.length,1);
});
test('page change prevents dispatch',async()=>{
  const f=await fixture(),command=await f.module.prepareProductionClosing('2026-09-14','close',f.options);f.leave();
  await assert.rejects(command.submit('담당'),/변경/);assert.equal(f.calls.length,1);
});
test('response loss preserves operation ID and never resends',async()=>{
  const f=await fixture(),invoke=f.options.invoke;f.options.invoke=payload=>payload.action==='context'?invoke(payload):(f.calls.push(payload),Promise.reject(new Error('ACK_LOST')));
  const command=await f.module.prepareProductionClosing('2026-09-14','close',f.options);
  await assert.rejects(command.submit('담당'),error=>error.message==='ACK_LOST'&&error.closingResponseUnknown&&error.closingOperationId===command.operationId);
  await assert.rejects(command.submit('담당'),/이미 전송/);assert.equal(f.calls.length,2);
});
test('invalid context and opposite transition are rejected before write',async()=>{
  const f=await fixture('closed');await assert.rejects(f.module.prepareProductionClosing('2026-09-14','close',f.options),/이미 마감/);
  const g=await fixture();await assert.rejects(g.module.prepareProductionClosing('2026-09-14','release',g.options),/해제/);
  g.options.invoke=async()=>({version:undefined,status:null});await assert.rejects(g.module.prepareProductionClosing('2026-09-14','close',g.options),/원본 상태/);
});
