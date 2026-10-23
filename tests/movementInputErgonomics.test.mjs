import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const cases=[
 ['meat','renderMeat','showAddFrozenModal',()=>[],true],
 ['meat','renderMeat','showAdjustModal',()=>['ms1','닭',10000]],
 ['bag','renderBag','showBagIncomingModal',e=>[e.state.rows.bagTypes[0]],true],
 ['bag','renderBag','showBagAdjustModal',e=>[e.state.rows.bagTypes[0]]],
 ['egg','renderEgg','showEggModal',e=>['in',e.state.rows.eggStock[0]],true],
 ['egg','renderEgg','showEggModal',e=>['out',e.state.rows.eggStock[0]]],
 ['egg','renderEgg','showEggAdjustModal',e=>[e.state.rows.eggStock[0]]],
 ['supplement','renderSupplement','openIncomingModal',e=>['r1_1','영양제',e.today]],
 ['supplement','renderSupplement','openAdjustModal',e=>['r1_1','영양제',e.today]],
 ['frozenPan','renderFrozenPan','showBreadPanIncomingModal',()=>[],true],
 ['frozenPan','renderFrozenPan','showBreadPanAdjustModal',()=>[]],
 ['frozenPan','renderFrozenPan','showFrozenPanAdjustModal',()=>[]],
 ['schedule','renderSchedule','showCompleteModal',e=>[{id:'s1',type:'egg',itemNameSnapshot:'계란',orderedQty:30,orderedUnit:'개'}],true],
];
for(const [route,render,fn,args,merged] of cases)test(`${route} ${fn}: classification controls reason and direction without duplicate receipt text`,async()=>{
 const e=await pageEnvironment(route,{instrument:`\nexport {${fn}};`});
 try{
  e.state.rows.eggStock=[{id:'global',currentQty:100,minimumQty:0}];
  e.state.rows.breadPanLots=[{id:'bread1',date:e.today,productName:'고양이 검증 큐브',remaining:10,closed:false}];
  await e.page[render]();await e.page[fn](...args(e));
  assert(e.document.querySelector('#movement_kind'));
  if(merged){assert.equal(e.document.querySelector('#movement_reason'),null);assert(e.document.querySelector('#m_note,#m_memo'));}
  for(const kind of ['receipt','usage','reconciliation','cancel','test']){
   const option=e.document.querySelector(`#movement_kind option[value="${kind}"]`);
   if(!option||option.hasAttribute('disabled'))continue;
   e.fill('#movement_kind',kind);await e.fire('#movement_kind','change');
   const reason=e.document.querySelector('#movement_reason,#m_reason,#m_adjustReason,#sup_adj_reason,#m_note,#m_memo');
   assert.equal(reason.required,['reconciliation','cancel','test'].includes(kind),kind);
   const direction=e.document.querySelector('#m_adjustType');
   if(direction){assert.equal(direction.disabled,['receipt','usage','cancel'].includes(kind));if(kind==='usage')assert.equal(direction.value,'minus');if(kind==='receipt')assert.equal(direction.value,'plus');}
  }
  assert.equal(e.state.writes.length,0);
 }finally{await e.cleanup();}
});
test('supplement positive usage quantity deducts once and retains optional reason',async()=>{
 const e=await pageEnvironment('supplement',{instrument:'\nexport {openAdjustModal};'});
 try{await e.page.renderSupplement();e.page.openAdjustModal('r1_1','영양제',e.today);
 e.fill('#movement_kind','usage');await e.fire('#movement_kind','change');e.fill('#sup_adj_qty','3');
 e.document.querySelector('#sup_adj_staff').innerHTML='<option value="검증" selected>검증</option>';
 await e.fire('#btnSaveSupAdj');assert.equal(e.state.rows.supplementStock[0].currentQty,17,e.alerts.join('\n'));
 assert.equal(e.state.rows.supplementLogs.at(-1).qty,-3);assert.equal(e.state.commits.length,1);
 }finally{await e.cleanup();}
});
test('bag use picks decrease automatically, and a merged test memo is required without inventory change',async()=>{
 const e=await pageEnvironment('bag',{instrument:'\nexport {showBagAdjustModal,showBagIncomingModal};'});
 try{await e.page.renderBag();e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);
 e.fill('#movement_kind','usage');await e.fire('#movement_kind','change');e.fill('#m_qty','2');
 e.document.querySelector('#m_staff').innerHTML='<option value="검증" selected>검증</option>';
 await e.fire('#btnSaveAdjust');assert.equal(e.state.rows.bagTypes[0].currentQty,98,e.alerts.join('\n'));
 e.page.showBagIncomingModal(e.state.rows.bagTypes[0]);e.fill('#movement_kind','test');await e.fire('#movement_kind','change');
 e.fill('#m_qty','20');e.document.querySelector('#m_staff').innerHTML='<option value="검증" selected>검증</option>';
 const writes=e.state.writes.length;await e.fire('#btnSaveBagIncoming');assert.match(e.alerts.at(-1),/사유/);assert.equal(e.state.writes.length,writes);
 e.fill('#m_note','화면 테스트');await e.fire('#btnSaveBagIncoming');assert.equal(e.state.rows.bagTypes[0].currentQty,98);
 const log=e.state.rows.bagLogs.at(-1);assert.equal(log.manualMovement.kind,'test');assert.equal(log.manualMovement.reason,'화면 테스트');assert.equal(log.note,'화면 테스트');assert.equal(log.qty,0);
 }finally{await e.cleanup();}
});
