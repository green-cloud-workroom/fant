import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';

test('same-name products and samples keep distinct input and histories',async()=>{
  const e=await pageEnvironment('frozenProduct');
  try{
    const product=e.state.rows.frozenProducts[0];
    e.state.rows.frozenProducts.push({...product,id:'sample',kind:'sample',sortOrder:1});
    e.state.rows.frozenLogs=Array.from({length:7},(_,i)=>({
      id:'r'+i,productId:product.id,timestamp:i+1,date:e.today,qty:i+1,staffName:'담당',
    }));
    await e.page.renderFrozenProduct();
    e.fill('#frozen_inline_m_qty','12');await e.fire('#frozen_inline_m_qty','input');
    await e.fire('[data-frozen-kind="sample"]');
    assert.equal(e.document.querySelector('#frozen_inline_m_qty').value,'');
    assert.match(e.document.querySelector('.frozen-history').textContent,/최근 기록이 없습니다/);
    await e.fire('[data-frozen-kind="product"]');
    assert.equal(e.document.querySelector('#frozen_inline_m_qty').value,'12');
    assert.match(e.document.querySelector('#frozen_inline_m_bagPreview').textContent,/예상 잔량 88장/);
    assert.equal(e.document.querySelectorAll('[data-log-date]').length,5);
    await e.fire('[data-next]');
    assert.equal(e.document.querySelectorAll('[data-log-date]').length,2);
    await e.fire('[data-log-details="0"]');
    assert.equal(e.document.querySelector('[data-detail-index="0"]').hidden,false);
    assert.ok(e.document.querySelector('[data-inventory-handoff]'));
    assert.equal(e.state.writes.length,0);
  }finally{await e.cleanup();}
});

test('inline double click writes one receipt, deduction and pending handoff',async()=>{
  const e=await pageEnvironment('frozenProduct');
  try{
    e.state.rows.staffGroups=[{id:'senior',members:[{name:'담당',active:true}]}];
    await e.page.renderFrozenProduct();
    e.fill('#frozen_inline_m_qty','4');await e.fire('#frozen_inline_m_qty','input');
    e.fill('#frozen_inline_m_staff','담당');await e.fire('#frozen_inline_m_staff','change');
    await Promise.all([e.fire('#frozen_inline_btnSaveIncoming'),e.fire('#frozen_inline_btnSaveIncoming')]);
    assert.equal(e.state.rows.frozenLogs.length,1,e.alerts.join('\n'));
    assert.equal(e.state.rows.bagTypes[0].currentQty,96);
    assert.equal(e.state.rows.bagLogs.length,1);assert.equal(e.state.rows.bagLogs[0].qty,-4);
    assert.equal(e.state.rows.productTransferRequests.length,1);
    assert.equal(e.state.rows.productTransferRequests[0].status,'pending');
    assert.equal(e.document.querySelector('#frozen_inline_m_qty').value,'');
    assert.equal(e.document.querySelector('.frozen-workspace').dataset.hasDrafts,'false');
    assert.equal(e.document.querySelector('#frozen_inline_m_staff').value,'담당');
    assert.match(e.document.querySelector('#frozen_inline_m_bagPreview').textContent,/96장/);
  }finally{await e.cleanup();}
});

test('a dispatched sample-set operation stays in result lookup when reselected',async()=>{
  const e=await pageEnvironment('frozenProduct');
  try{
    e.context.TextEncoder=TextEncoder;
    const p=e.state.rows.frozenProducts[0];
    e.state.rows.frozenProducts.push({...p,id:'set',kind:'sampleSet',sortOrder:1});
    const calls=[];
    e.cache.get('firebase/functions').setExport('getFunctions',()=>({}));
    e.cache.get('firebase/functions').setExport('httpsCallable',()=>async payload=>{
      calls.push(payload.action);
      if(payload.action==='identity') return {data:{production:true,employeeId:'actor',name:'담당'}};
      if(payload.action==='sampleSetIncomingContext') return {data:{stocks:[],context:{version:1}}};
      throw Error('응답 유실');
    });
    await e.page.renderFrozenProduct();
    await e.fire('[data-frozen-kind="sampleSet"]');
    e.fill('#frozen_inline_m_qty','2');await e.fire('#frozen_inline_m_qty','input');
    e.fill('#frozen_inline_m_staff','actor');await e.fire('#frozen_inline_m_staff','change');
    await e.fire('#frozen_inline_btnSaveIncoming');
    await e.fire('[data-frozen-kind="product"]');await e.fire('[data-frozen-kind="sampleSet"]');
    assert.equal(e.document.querySelector('#frozen_inline_btnSaveIncoming'),null);
    assert.match(e.document.querySelector('.frozen-inline-entry').textContent,/원래 작업 결과 확인/);
    assert.equal(calls.filter(action=>action==='createSampleSetIncoming').length,1);
    assert.equal(e.state.writes.length,0);
  }finally{await e.cleanup();}
});
