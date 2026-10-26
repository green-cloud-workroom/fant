import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
const title='고양이 검증 큐브';
const methods={bag:'showBagIncomingModal,showBagAdjustModal',egg:'showEggModal,showEggAdjustModal',supplement:'openIncomingModal,openAdjustModal',meat:'showAddFrozenModal,showAddProcessedModal,showAddRepackedModal,showAdjustModal',frozenProduct:'showIncomingModal',equipment:'showIncomingModal,showAdjustModal',schedule:'showCompleteModal',frozenPan:'showTenderInModal,showBreadPanIncomingModal,showBreadPanAdjustModal,showFrozenPanAdjustModal',frozenSep:'showIncomingModal,showSeparateModal,showOutModal,showAdjustModal'};
async function setup(route){
 const e=await pageEnvironment(route,{instantRoutes:[route],instrument:`\nexport {${methods[route]}};`});e.context.Date=Date;
 Object.assign(e.state.rows,{
  eggStock:[{id:'global',currentQty:100,minimumQty:0}],
  equipments:[{id:'eq',category:'민서기',alias:'1호',sortOrder:0,active:true}],
  equipmentParts:[{id:'part',equipmentId:'eq',equipmentCategory:'민서기',equipmentAlias:'1호',name:'날',currentQty:10,minimumQty:1,cycleValue:1,cycleUnit:'month',lastReplacedAt:'2026-09-01',nextDueAt:'2026-10-01',sortOrder:0,active:true}],
  breadPanLots:[{id:'bread',date:e.today,productName:title,initialQty:20,remaining:20,closed:false}],
  frozenSeparation:[{id:'unseparated',date:e.today,productName:title,stockType:'notSeparated',remaining:20,initialQty:20,closed:false},{id:'separated',date:e.today,productName:title,stockType:'separated',remaining:20,initialQty:20,closed:false}],
  frozenSeparationLogs:[],confirmRequests:[{id:'protected',status:'confirmed',acknowledged:true,replies:[{text:'기존 대화'}]}],
 });
 e.state.rows.bagTypes.push({...e.state.rows.bagTypes[0],id:'b2',name:'두번째 봉투',sortOrder:1});
 e.state.rows.meatTypes.push({...e.state.rows.meatTypes[0],id:'m2',name:'소',sortOrder:1});
 e.state.rows.meatStocks.push({...e.state.rows.meatStocks[0],id:'ms2',meatTypeId:'m2'});
 for(const [id,type]of [['processed1','m1'],['processed2','m2']])e.state.rows.meatStocks.push({id,meatTypeId:type,meatNameSnapshot:type==='m1'?'닭':'소',stage:'processed',incomingDate:e.today,processedDate:e.today,remaining:10000,initialQtyG:10000,unitWeightG:500,unitCount:20,closed:false});
 e.state.rows.recipes.push({...e.state.rows.recipes[1],id:'tender',name:'텐더',displayName:'고양이 텐더',requiresSeparation:false,sortOrder:3});
 const logNames=['meatLogs','bagLogs','eggLogs','supplementLogs','frozenLogs','breadPanLogs','frozenPanLogs','frozenSeparationLogs','equipmentPartLogs','activityLogs'];
 e.capture=()=>Object.fromEntries(logNames.map(name=>[name,JSON.parse(JSON.stringify(e.state.rows[name]||[]))]));
 const confirms=JSON.stringify(e.state.rows.confirmRequests);
 e.preserve=before=>{for(const [name,rows]of Object.entries(before))for(const old of rows)assert.equal(JSON.stringify(e.state.rows[name].find(row=>row.id===old.id)),JSON.stringify(old),name+'/'+old.id);assert.equal(JSON.stringify(e.state.rows.confirmRequests),confirms);assert.equal(e.state.rows.equipmentParts[0].nextDueAt,'2026-10-01');};
 await e.page['render'+route[0].toUpperCase()+route.slice(1)]();return e;
}
function staff(e,id='#m_staff'){e.document.querySelector(id).innerHTML='<option selected value="검증 담당자">검증 담당자</option>';}
async function classify(e,kind){e.fill('#movement_kind',kind);await e.fire('#movement_kind','change');}

test('bag receipts and usage/reconciliation alternate across products without refresh',async()=>{
 const e=await setup('bag');try{
  for(const id of ['b1','b2','b1']){const before=e.capture();e.page.showBagIncomingModal(e.state.rows.bagTypes.find(row=>row.id===id));e.fill('#m_qty','10');staff(e);await e.fire('#btnSaveBagIncoming');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  for(const kind of ['usage','reconciliation','usage']){const before=e.capture();e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);await classify(e,kind);e.fill('#m_qty','2');e.fill('#m_adjustType','minus');e.fill('#m_reason','실사 확인');staff(e);await e.fire('#btnSaveAdjust');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  assert.equal(e.state.rows.bagTypes[0].currentQty,114);assert.equal(e.state.rows.bagTypes[1].currentQty,110);
 }finally{await e.cleanup();}
});

test('egg receipt, outflow and manual adjustment can be alternated repeatedly',async()=>{
 const e=await setup('egg');try{
  for(const action of ['in','out','adjust','in','out']){const before=e.capture();
   if(action==='adjust'){e.page.showEggAdjustModal(e.state.rows.eggStock[0]);await classify(e,'reconciliation');e.fill('#m_qty','2');e.fill('#m_adjustType','plus');e.fill('#m_reason','실사 확인');}
   else{e.page.showEggModal(action,e.state.rows.eggStock[0]);e.fill(action==='in'?'#m_qty':'#m_usageQty',action==='in'?'10':'3');}
   staff(e);await e.fire(action==='adjust'?'#btnSaveAdjust':'#btnSaveEgg');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);
  }assert.equal(e.state.rows.eggStock[0].currentQty,116);
 }finally{await e.cleanup();}
});

test('supplement receipts and manual uses across SKUs retain earlier records',async()=>{
 const e=await setup('supplement');try{
  for(const [id,kind]of [['r1_1','in'],['r1_2','in'],['r1_1','usage'],['r1_2','reconciliation'],['r1_1','in']]){const before=e.capture();
   if(kind==='in'){e.page.openIncomingModal(id,'검증 영양제');e.fill('#sup_in_qty','3');staff(e,'#sup_in_staff');await e.fire('#btnSaveSupIn');}
   else{e.page.openAdjustModal(id,'검증 영양제');await classify(e,kind);e.fill('#sup_adj_qty','2');e.fill('#sup_adj_reason','실사 확인');staff(e,'#sup_adj_staff');await e.fire('#btnSaveSupAdj');}
   assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);
  }assert.equal(e.state.rows.supplementStock.find(row=>row.id==='r1_1').currentQty,24);assert.equal(e.state.rows.supplementStock.find(row=>row.id==='r1_2').currentQty,25);
 }finally{await e.cleanup();}
});

for(const category of ['meat','produce'])test(`${category}: several incoming lots and repeated use/reconciliation`,async()=>{
 const e=await setup('meat');try{
  e.state.rows.meatTypes[0].category=category;await e.page.renderMeat({force:true});
  for(let n=0;n<2;n++){const before=e.capture();e.page.showAddFrozenModal({categoryFilter:category});e.fill('#m_meatType','m1');e.fill('#m_weight','1');e.fill('#m_unit','kg');staff(e);await e.fire('#btnSaveFrozen');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  for(const kind of ['usage','reconciliation','usage']){const before=e.capture(),row=e.state.rows.meatStocks.find(row=>row.id==='ms1');e.page.showAdjustModal(row.id,'닭',row.remaining);await classify(e,kind);e.fill(kind==='usage'?'#m_usageQty':'#m_actualRemaining',kind==='usage'?'100':String(row.remaining+50));e.fill('#m_adjustReason','실사 확인');staff(e);await e.fire('#btnSaveAdjust');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  assert.equal(e.state.rows.meatStocks.find(row=>row.id==='ms1').remaining,9850);
 }finally{await e.cleanup();}
});

test('frozen product receipts can be entered in three separate forms',async()=>{
 const e=await setup('frozenProduct');try{
  for(let n=0;n<3;n++){const before=e.capture();await e.page.showIncomingModal(e.state.rows.frozenProducts[0]);e.fill('#m_qty','2');staff(e);await e.fire('#btnSaveIncoming');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  assert.equal(e.state.rows.frozenLogs.length,3);assert.equal(e.state.rows.bagTypes[0].currentQty,94);
 }finally{await e.cleanup();}
});

test('equipment part receipts and count adjustments can alternate',async()=>{
 const e=await setup('equipment');try{
  for(const mode of ['in','adjust','in','adjust']){const before=e.capture();const part=e.state.rows.equipmentParts[0];e.page[mode==='in'?'showIncomingModal':'showAdjustModal'](part);e.fill(mode==='in'?'#m_qty':'#m_actual',mode==='in'?'3':String(part.currentQty-1));e.fill('#m_note','실사 확인');staff(e);await e.fire(mode==='in'?'#btnSaveIn':'#btnSaveAdjust');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  assert.equal(e.state.rows.equipmentParts[0].currentQty,14);
 }finally{await e.cleanup();}
});

for(const [name,method,button,source,field]of [['incoming','showIncomingModal','btnSaveIncoming','notSeparated','m_name'],['separate','showSeparateModal','btnSaveSeparate','notSeparated','m_product'],['out','showOutModal','btnSaveOut','separated','m_product']])test(`frozen separation ${name}: continuation for three entries`,async()=>{
 const e=await setup('frozenSep');try{
  e.page[method](e.state.rows.frozenSeparation);const date=e.document.querySelector('#m_date').value;
  for(let n=0;n<3;n++){const before=e.capture();e.fill('#'+field,title);e.fill('#m_qty','.2');staff(e);e.document.querySelector('#m_continue').checked=n<2;await e.fire('#'+button);e.preserve(before);
   if(n<2){assert.ok(e.document.querySelector('#m_qty'),e.alerts.join('\n'));assert.equal(e.document.querySelector('#m_qty').value,'');assert.equal(e.document.querySelector('#m_date').value,date);assert.equal(e.document.querySelector('#m_staff').value,'검증 담당자');}
   else assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));
  }assert.equal(e.state.rows.frozenSeparationLogs.length,3);
 }finally{await e.cleanup();}
});

test('frozen separation count correction can be repeated three times',async()=>{
 const e=await setup('frozenSep');try{
  for(const qty of [19,18,17]){const before=e.capture();e.page.showAdjustModal(e.state.rows.frozenSeparation);e.fill('#m_product',title);e.fill('#m_stockType','separated');e.fill('#m_entryMode','actual');e.fill('#m_qty',qty);e.fill('#m_reason','실사 확인');staff(e);await e.fire('#btnSaveAdjust');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
 }finally{await e.cleanup();}
});

test('bread-pan receipts and both pan adjustments repeat without refresh',async()=>{
 const e=await setup('frozenPan');try{
  for(let n=0;n<2;n++){const before=e.capture();await e.page.showBreadPanIncomingModal();e.fill('#m_recipe',title);e.fill('#m_qty','2');staff(e);await e.fire('#btnSaveBreadPanIncoming');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  for(const [show,button,lot]of [['showBreadPanAdjustModal','btnSaveBreadPanAdjust','bread'],['showFrozenPanAdjustModal','btnSaveFrozenPanAdjust','lot1'],['showBreadPanAdjustModal','btnSaveBreadPanAdjust','bread']]){const before=e.capture();await e.page[show]();await classify(e,'reconciliation');e.fill('#m_lot',lot);e.fill('#m_adjustType','minus');e.fill('#m_qty','1');e.fill('#m_reason','실사 확인');staff(e);await e.fire('#'+button);assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
 }finally{await e.cleanup();}
});

test('schedule: receive three different scheduled lots consecutively',async()=>{
 const e=await setup('schedule');try{
  e.state.rows.schedules=[1,2,3].map(n=>({id:'scheduled'+n,status:'scheduled',date:e.today,type:'meat',itemId:'m1',itemNameSnapshot:'닭',orderedQty:1000,orderedUnit:'g'}));await e.page.renderSchedule({force:true});
  for(const row of [...e.state.rows.schedules]){const before=e.capture();e.page.showCompleteModal(row);e.fill('#m_actual','1000');e.fill('#m_actual_unit','g');staff(e);await e.fire('#btnSaveComplete');assert.equal(e.state.rows.schedules.find(s=>s.id===row.id).status,'completed',e.alerts.join('\n'));e.preserve(before);}
 }finally{await e.cleanup();}
});

const forms=[
 ['bag incoming','bag','showBagIncomingModal','btnSaveBagIncoming','m_qty',null,'m_note'],
 ['bag adjust','bag','showBagAdjustModal','btnSaveAdjust','m_qty','reconciliation','m_reason'],
 ['egg incoming','egg','showEggModal','btnSaveEgg','m_qty',null,'m_note'],
 ['egg outgoing','egg','showEggModal','btnSaveEgg','m_usageQty',null,'m_note'],
 ['egg adjust','egg','showEggAdjustModal','btnSaveAdjust','m_qty','reconciliation','m_reason'],
 ['supplement incoming','supplement','openIncomingModal','btnSaveSupIn','sup_in_qty',null,'movement_reason'],
 ['supplement adjust','supplement','openAdjustModal','btnSaveSupAdj','sup_adj_qty','reconciliation','sup_adj_reason'],
 ['meat incoming','meat','showAddFrozenModal','btnSaveFrozen','m_weight',null,'m_note'],
 ['meat preprocessing','meat','showAddProcessedModal','btnSaveProcessed','m_count',null,'m_note'],
 ['meat repacking','meat','showAddRepackedModal','btnSaveRepacked','m_count',null,'m_note'],
 ['meat usage','meat','showAdjustModal','btnSaveAdjust','m_usageQty','usage','m_adjustReason'],
 ['meat count correction','meat','showAdjustModal','btnSaveAdjust','m_actualRemaining','reconciliation','m_adjustReason'],
 ['frozen product incoming','frozenProduct','showIncomingModal','btnSaveIncoming','m_qty',null,'m_note'],
 ['part incoming','equipment','showIncomingModal','btnSaveIn','m_qty',null,'m_note'],
 ['part adjust','equipment','showAdjustModal','btnSaveAdjust','m_actual',null,'m_note'],
 ['bread-pan incoming','frozenPan','showBreadPanIncomingModal','btnSaveBreadPanIncoming','m_qty',null,'m_note'],
 ['tender-pan incoming','frozenPan','showTenderInModal','btnSaveTenderIn','m_qty',null,'m_note'],
 ['bread-pan adjust','frozenPan','showBreadPanAdjustModal','btnSaveBreadPanAdjust','m_qty','reconciliation','m_reason'],
 ['frozen-pan adjust','frozenPan','showFrozenPanAdjustModal','btnSaveFrozenPanAdjust','m_qty','reconciliation','m_reason'],
 ['separation incoming','frozenSep','showIncomingModal','btnSaveIncoming','m_qty',null,'m_note'],
 ['separation outgoing','frozenSep','showOutModal','btnSaveOut','m_qty',null,'m_note'],
 ['separation processing','frozenSep','showSeparateModal','btnSaveSeparate','m_qty',null,'m_note'],
 ['separation adjust','frozenSep','showAdjustModal','btnSaveAdjust','m_qty',null,'m_reason'],
 ['schedule completion','schedule','showCompleteModal','btnSaveComplete','m_actual',null,'m_memo'],
];
async function prepareForm(spec){
 const [label,route,show,button,qty,kind,note]=spec,e=await setup(route);
 if(route==='bag')e.page[show](e.state.rows.bagTypes[0]);
 if(route==='egg')e.page[show](...(show==='showEggModal'?[label.includes('outgoing')?'out':'in',e.state.rows.eggStock[0]]:[e.state.rows.eggStock[0]]));
 if(route==='supplement')e.page[show]('r1_1','검증 영양제');
 if(route==='meat'){
  if(show==='showAddFrozenModal'){e.page[show]();e.fill('#m_meatType','m1');e.fill('#m_unit','g');}
  else if(show==='showAddProcessedModal'||show==='showAddRepackedModal'){e.page[show]();e.fill('#m_meatType','m1');e.fill('#m_unitWeight','500');}
  else e.page[show]('ms1','닭',10000);
 }
 if(route==='frozenProduct')await e.page[show](e.state.rows.frozenProducts[0]);
 if(route==='equipment')e.page[show](e.state.rows.equipmentParts[0]);
 if(route==='frozenPan'){
  await e.page[show]();
  if(show==='showBreadPanIncomingModal'||show==='showTenderInModal')e.fill('#m_recipe',show==='showTenderInModal'?'고양이 텐더':title);
  else{e.fill('#m_lot',show==='showBreadPanAdjustModal'?'bread':'lot1');e.fill('#m_adjustType','minus');}
 }
 if(route==='frozenSep'){
  e.page[show](e.state.rows.frozenSeparation);
  e.fill(label.includes('incoming')?'#m_name':'#m_product',title);
  if(show==='showAdjustModal'){e.fill('#m_stockType','separated');e.fill('#m_entryMode','actual');}
 }
 if(route==='schedule'){
  e.state.rows.schedules=[{id:'scheduled',status:'scheduled',date:e.today,type:'meat',itemId:'m1',itemNameSnapshot:'닭',orderedQty:1000,orderedUnit:'g'}];await e.page.renderSchedule({force:true});e.page[show](e.state.rows.schedules[0]);e.fill('#m_actual_unit','g');
 }
 if(kind)await classify(e,kind);
 if(note&&e.document.getElementById(note))e.fill('#'+note,'확인 메모');
 staff(e,route==='supplement'?label.includes('incoming')?'#sup_in_staff':'#sup_adj_staff':'#m_staff');
 e.fill('#'+qty,label==='meat count correction'?'9900':label==='part adjust'?'9':label==='separation adjust'?'19':'2');
 return {...e,spec,button:'#'+button,qty:'#'+qty,note:note&&e.document.getElementById(note)?'#'+note:null};
}

for(const spec of forms)test(`${spec[0]}: save failure retains quantity, memo and history and prevents replay`,async()=>{
 const e=await prepareForm(spec);try{
  const before=e.capture(),quantity=e.document.querySelector(e.qty).value,memo=e.note?e.document.querySelector(e.note).value:null;
  e.state.failNextCommit='before';await e.fire(e.button);
  assert.ok(e.document.querySelector(e.qty),'form unexpectedly closed: '+e.alerts.join('\n'));
  assert.equal(e.document.querySelector(e.qty).value,quantity);
  if(e.note)assert.equal(e.document.querySelector(e.note).value,memo);
  assert.equal(e.document.querySelector(e.qty).hasAttribute('disabled'),false,'failed save must unlock inputs');
  assert.equal(e.document.querySelector(e.qty).closest('[inert]'),null);
  assert.equal(e.document.querySelector('.modal-saving-status'),null);
  const writes=e.state.writes.length;await e.fire(e.button);assert.equal(e.state.writes.length,writes);e.preserve(before);
 }finally{await e.cleanup();}
});

for(const spec of forms)test(`${spec[0]}: live refresh preserves unfinished inputs`,async()=>{
 const e=await prepareForm(spec);try{
  e.fill(e.qty,'7');if(e.note)e.fill(e.note,'입력 중인 메모');const before=e.state.writes.length;
  await e.state.notify(spec[1]==='equipment'?'equipmentParts':spec[1]==='supplement'?'supplementStock':spec[1]==='egg'?'eggStock':spec[1]==='schedule'?'schedules':spec[1]==='frozenSep'?'frozenSeparation':spec[1]==='frozenProduct'?'frozenProducts':spec[1]==='frozenPan'?'frozenPanLots':spec[1]==='bag'?'bagTypes':'meatStocks');
  assert.equal(e.document.querySelector(e.qty)?.value,'7');if(e.note)assert.equal(e.document.querySelector(e.note)?.value,'입력 중인 메모');assert.equal(e.state.writes.length,before);
 }finally{await e.cleanup();}
});

for(const spec of forms)test(`${spec[0]}: new editable input during pending save is not discarded`,async()=>{
 const e=await prepareForm(spec);try{
  const before=e.capture();let release,started;const ready=new Promise(resolve=>{started=resolve;}),hold=new Promise(resolve=>{release=resolve;});
  const notify=e.state.notify;let intercepted=false;
  e.state.notify=async path=>{if(!intercepted){intercepted=true;started();await hold;}return notify(path);};
  const saving=e.fire(e.button);
  const reached=await Promise.race([ready.then(()=>true),saving.then(()=>false)]);
  assert.equal(reached,true,'valid form did not reach commit: '+e.alerts.join('\n'));
  const input=e.document.querySelector(e.qty),locked=input.hasAttribute('disabled')||input.hasAttribute('readonly')||!!input.closest('[inert],fieldset[disabled]');
  assert.equal(locked,true,'inputs must be locked until save finishes');
  assert.ok(e.document.querySelector('[role="status"]'));
  release();await saving;e.preserve(before);
  if(!locked)assert.equal(e.document.querySelector(e.qty)?.value,'7','new input was editable while saving but discarded');
 }finally{await e.cleanup();}
});

for(const [method,button]of [['showAddProcessedModal','btnSaveProcessed'],['showAddRepackedModal','btnSaveRepacked']])test(`${method}: three valid sequential entries across materials`,async()=>{
 const e=await setup('meat');try{
  for(const id of ['m1','m2']){const before=e.capture();e.page[method]();e.fill('#m_meatType',id);e.fill('#m_unitWeight','500');e.fill('#m_count','2');staff(e);await e.fire('#'+button);assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  if(method==='showAddRepackedModal'){
   e.page[method]();e.fill('#m_meatType','m1');e.fill('#m_unitWeight','500');e.fill('#m_count','2');staff(e);const count=e.state.writes.length;await e.fire('#'+button);assert.equal(e.state.writes.length,count);assert.match(e.alerts.at(-1),/재포장 행이 이미 존재/);
  }else{e.page[method]();e.fill('#m_meatType','m1');e.fill('#m_unitWeight','500');e.fill('#m_count','2');staff(e);await e.fire('#'+button);assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));}
 }finally{await e.cleanup();}
});

test('tender-pan incoming can be repeated three times',async()=>{
 const e=await setup('frozenPan');try{
  for(let n=0;n<3;n++){const before=e.capture();e.page.showTenderInModal();e.fill('#m_recipe','고양이 텐더');e.fill('#m_qty','2');staff(e);await e.fire('#btnSaveTenderIn');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
 }finally{await e.cleanup();}
});

test('two receipts can each be canceled using their own original without a false conflict',async()=>{
 const e=await setup('bag');try{
  const ids=[];for(const quantity of [5,6]){e.page.showBagIncomingModal(e.state.rows.bagTypes[0]);e.fill('#m_qty',quantity);staff(e);await e.fire('#btnSaveBagIncoming');ids.push(e.state.rows.bagLogs.at(-1).id);}
  for(const id of ids){const before=e.capture();e.page.showBagAdjustModal(e.state.rows.bagTypes[0]);await classify(e,'cancel');e.fill('#movement_source',id);await e.fire('#movement_source','change');e.fill('#m_reason','오입력 취소');staff(e);await e.fire('#btnSaveAdjust');assert.equal(e.document.querySelector('#modalOverlay'),null,e.alerts.join('\n'));e.preserve(before);}
  assert.equal(e.state.rows.bagTypes[0].currentQty,100);
 }finally{await e.cleanup();}
});

for(const spec of forms.filter(s=>s[0]==='separation incoming'||s[0]==='separation outgoing'||s[0]==='separation processing'))test(`${spec[0]}: pending continuation preserves newly typed quantity`,async()=>{
 const e=await prepareForm(spec);try{
  e.document.querySelector('#m_continue').checked=true;
  let release,started;const ready=new Promise(r=>started=r),hold=new Promise(r=>release=r),notify=e.state.notify;let seen=false;
  e.state.notify=async path=>{if(!seen){seen=true;started();await hold;}return notify(path);};
  const saving=e.fire(e.button);const reached=await Promise.race([ready.then(()=>true),saving.then(()=>false)]);assert.ok(reached,e.alerts.join('\n'));
  assert.ok(e.document.querySelector(e.qty).hasAttribute('disabled'),'continuation form must lock during save');
  release();await saving;
  assert.equal(e.document.querySelector(e.qty)?.value,'');
  assert.equal(e.document.querySelector(e.qty).hasAttribute('disabled'),false);
  assert.equal(e.document.querySelector(e.qty).closest('[inert]'),null);
 }finally{await e.cleanup();}
});
