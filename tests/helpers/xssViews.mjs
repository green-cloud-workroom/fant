import {pageEnvironment} from './pageDom.mjs';
import {escapeHtml} from '../../src/utils/html.js';

// LinkeDOM's HTML serializer leaves ampersands raw in attributes. Serialize the
// rendered DOM with normal HTML escaping so a second browser parse is faithful.
function serialize(node) {
 if(node.nodeType===3)return escapeHtml(node.textContent);
 if(node.nodeType!==1)return '';
 const tag=node.localName,attrs=[...node.attributes].map(a=>` ${a.name}="${escapeHtml(a.value)}"`).join('');
 const open='<'+tag+attrs+'>';
 return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)?open:open+[...node.childNodes].map(serialize).join('')+'</'+tag+'>';
}

export const attackText = `한글 "'><img src="/xss-probe" onerror="window.__xss=(window.__xss||0)+1"> &amp; </textarea><img src="/xss-probe" onerror="window.__xss=(window.__xss||0)+1">`;
export const ordinaryText = `고양이 닭 & 오리 <특선> "큰" '작은' &amp;`;
export async function captureXssViews({sourceFiles,role='office',text=attackText}={}) {
 const views=[];
 const add=(name,e,selector,expected)=>views.push({name,role,html:[...e.document.body.childNodes].map(serialize).join(''),selector,expected});
 const instruments={
  recipe:'\nexport {showRecipeDetail};',
  production:'\nexport {showProductionForm,showBigViewModal,showCopySheetModal,handleCopyOrder};',
  main:'\nexport {renderProductionTableCard,showReceiptSummaryModal,openProductReceiptModal,openFreezeDryReceiptModal,renderMeatNeeds};',
  schedule:'',
 };
 const prod={id:'p1',date:'2026-09-14',sortOrder:0,recipeId:'r1',recipeName:text,category:'raw',target:'cat',status:'active',color:'#12aB34',productionUnitQty:1,productionUnitName:text,rawBoxQty:1,ingredientsSnapshot:[{name:text,isProductionUnit:true,unitName:text,baseWeightG:1000,meatTypeId:'m1',totalG:1000}]};
 for(const route of ['recipe','production','main','schedule']) {
  const e=await pageEnvironment(route,{role,sourceFiles,instrument:instruments[route],instantRoutes:[route]});
  try {
   e.context.navigator.clipboard={writeText:async value=>{e.context.copied=value;}};
   Object.assign(e.state.rows.recipes[0],{name:text,note:text,productionUnitName:text,unitPresets:[1,2],ingredients:[{name:text,isProductionUnit:true,unitName:text,baseWeightG:1000,meatTypeId:'m1'}]});
   e.state.rows.meatTypes[0].name=text;e.state.rows.bagTypes[0].name=text;
   for(const group of e.state.rows.staffGroups)group.members=[{name:text}];
   e.state.rows.productions=[structuredClone(prod)];
   if(route==='recipe') {
    await e.page.renderRecipe();add('recipe-list',e,'.recipe-name','고양이 '+text);
    e.page.showRecipeDetail(e.state.rows.recipes[0]);add('recipe-edit',e,'#recipeName',text);
   } else if(route==='production') {
    await e.page.renderProduction();add('production-card',e,'.card-title',text);
    await e.page.showProductionForm(e.state.rows.productions[0]);add('production-edit',e,'#pf_recipe option[value="r1"]','고양이 '+text);
    e.page.showBigViewModal();add('production-preview',e,'.modal-box',text);
    await e.page.showCopySheetModal();add('production-copy',e,'#sheetText',null);
    e.page.handleCopyOrder();add('production-order-copy',e,'#orderSheetText',null);
   } else if(route==='main') {
    const root=e.document.getElementById('mainContent');
    root.innerHTML=e.page.renderProductionTableCard(prod,e.state.rows.recipes);add('main-card',e,'.main-production-card-title',text);
    e.page.showReceiptSummaryModal([prod],e.today);add('main-receipt-summary',e,'.modal-box',text);
    e.document.getElementById('modalOverlay')?.remove();
    e.state.rows.recipes[0].packsPerPlate=100;
    e.state.rows.recipes[0].productionMethods=[{methodKey:'test',label:text,unitToBox:1,active:true}];
    await e.page.openProductReceiptModal('p1');add('main-raw-receipt',e,'#productReceiptModal .modal-title',text);
    e.document.getElementById('productReceiptModal')?.remove();
    Object.assign(e.state.rows.recipes[1],{name:text,displayName:text});
    e.state.rows.productions.push({...prod,id:'pf1',recipeId:'fd1',category:'freezeDry',requiresSeparation:true,breadPanQty:1});
    await e.page.openFreezeDryReceiptModal('pf1');add('main-freeze-receipt',e,'#freezeDryReceiptModal .modal-title',text);
    root.innerHTML=e.page.renderMeatNeeds([prod],false);add('main-meat-needs',e,'#mainContent',null);
   } else {
    e.state.rows.schedules=[{id:'sc1',date:e.today,type:'bag',itemId:'b1',itemNameSnapshot:text,orderMemo:text,orderStaffName:text,orderedQty:2,orderedUnit:'박스',status:'scheduled'},
     {id:'sc2',date:e.today,type:'bag',itemId:'b1',itemNameSnapshot:text,incomingStaffName:text,completeMemo:text,orderedQty:2,orderedUnit:'박스',status:'completed'}];
    await e.page.renderSchedule();add('schedule-active',e,'.btn-complete',null);
    await e.fire('#btnToggleDone');add('schedule-done',e,'#mainContent',text);
    if(role!=='production') {await e.fire('.btn-edit-schedule');add('schedule-edit',e,'#m_memo',text);await e.fire('.btn-cancel-schedule');add('schedule-cancel',e,'.modal-title',null);}
    await e.fire('.btn-complete');add('schedule-complete',e,'.modal-title',null);
   }
   if(e.state.writes.length)throw Error('XSS display tests must not write data: '+route);
  } finally {await e.cleanup();}
 }
 return views;
}
