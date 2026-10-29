import {pageEnvironment} from './pageDom.mjs';
import {attackText,ordinaryText,serializeView} from './settingsBagXssViews.mjs';
export {attackText,ordinaryText};
export async function captureMeatViews({sourceFiles,role='office',text=attackText}={}){
 const e=await pageEnvironment('meat',{role,sourceFiles,instrument:`\nexport {renderStockSummaryCell,renderStockSummary,renderMeatStockCategoryRows,showMeatTypesModal,showAddFrozenModal,showAddProcessedModal,showAddRepackedModal,showAdjustModal,getStaffOptions};\nexport function __fixture(types,categories=[],staff={},tab='frozen'){meatTypes=types;meatStockCategories=categories;staffCache=staff;currentTab=tab;}`});
 const views=[],id=text===attackText?'x"><img src=x onerror="window.__xss=(window.__xss||0)+1">':text.slice(0,200);
 const base={id:'m1',name:'닭',category:'meat',defaultUnitWeightG:1000,minimumQtyG:100,active:true};
 const add=(name,html,selector,expected=text,attribute)=>views.push({name,role,html,selector,expected,attribute});
 const modal=()=>serializeView(e.document.querySelector('#modalOverlay'));
 try{
  e.page.__fixture([base]);
  add('summary-type-id',e.page.renderStockSummaryCell({meatTypeId:id,name:'닭',totalG:1000,lots:[]}),'.stock-summary-cell',id,'data-meat-type-id');
  for(const field of ['id','remaining']){
   const lot={id:'lot',remaining:1000,[field]:field==='id'?id:text};
   add('summary-lot-'+field,e.page.renderStockSummaryCell({meatTypeId:'m1',name:'닭',totalG:1000,lots:[lot]}),'.btn-adjust',lot[field],'data-'+(field==='id'?'id':'remaining'));
  }
  e.page.__fixture([{...base,groupId:id}],[{id,name:'범주',scope:'meat'}]);
  add('summary-category-id',e.page.renderStockSummary([{id:'lot',meatTypeId:'m1',meatNameSnapshot:'닭',remaining:1000}]),'.stock-summary-category-column',id,'data-category-id');
  if(role!=='production'){
   add('category-edit-id','<table><tbody>'+e.page.renderMeatStockCategoryRows()+'</tbody></table>','.stock-category-name',id,'data-id');
   for(const field of ['name','id','defaultUnitWeightG','minimumQtyG']){
    const row={...base,category:'produce',[field]:field==='id'?id:text};e.page.__fixture([row],[],{},'produce');e.page.showMeatTypesModal({categoryFilter:'produce'});
    add('master-'+field,modal(),field==='name'?'#meatTypesList td:nth-child(2)':field==='id'?'#meatTypesList tr':field==='defaultUnitWeightG'?'.m-unit-weight':'.m-min-qty',row[field],field==='name'?undefined:field==='id'?'data-id':'value');
   }
  }
  for(const method of ['showAddFrozenModal','showAddProcessedModal','showAddRepackedModal'])for(const field of ['name','id','defaultUnitWeightG']){
   const row={...base,[field]:field==='id'?id:text};e.page.__fixture([row]);e.page[method]();
   add(method+'-'+field,modal(),'#m_meatType option:nth-child(2)',row[field],field==='id'?'value':field==='defaultUnitWeightG'?'data-weight':undefined);
  }
  e.page.__fixture([base],[],{lead:[{name:text}]});e.page.showAddFrozenModal();
  add('staff-option',modal(),'#m_staff option:nth-child(2)',text,'value');
  e.page.showAdjustModal('lot',text,1000);add('adjust-name',modal(),'.modal-title');
  e.page.showAdjustModal('lot','닭',text);add('adjust-remaining',modal(),'.modal-box p:has(strong)');
  if(e.state.writes.length)throw Error('Rendering wrote data');
 }finally{await e.cleanup();}return views;
}

