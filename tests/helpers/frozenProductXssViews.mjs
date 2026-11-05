import {sourceFlow} from './frozenSourceFlow.mjs';
import {pageEnvironment} from './pageDom.mjs';import {attackText,ordinaryText,serializeView} from './settingsBagXssViews.mjs';export {attackText,ordinaryText};
export async function captureFrozenProductViews({sourceFiles,role='office',text=attackText}={}){
 const e=await pageEnvironment('frozenProduct',{role,sourceFiles,instrument:'\nexport {renderProductListItemCompact,showProductDetail,renderComponentOptions,showProductModal,showEditIncomingModal,showIncomingModal};\nexport function __fixture(products,staff={},selected=null){frozenProducts=products;staffCache=staff;selectedProductId=selected;}'});const views=[],id=text===attackText?'x"><img src=x onerror="window.__xss=(window.__xss||0)+1">':text.slice(0,200),base={...e.state.rows.frozenProducts[0]},root=e.document.querySelector('#mainContent');
 const edit=(product,log)=>e.page.showEditIncomingModal(product,log,sourceFlow(e,log));
 const add=(name,html,selector,expected=text,attribute)=>views.push({name,role,html,selector,expected,attribute}),modal=()=>serializeView(e.document.querySelector('#modalOverlay'));
 async function detail(name,product,log,selector,expected=text,attribute){root.innerHTML='<div id="productDetail"></div>';e.page.__fixture([product],{},product.id);e.state.rows.frozenLogs=log?[{id:'log',productId:product.id,status:'active',date:e.today,timestamp:1,expiryDate:'2027-10-28',qty:4,deductedBagQty:4,staffName:'담당',note:'',...log}]:[];await e.page.showProductDetail(product);add(name,serializeView(e.document.querySelector('#productDetail')),selector,expected,attribute);}
 try{
  for(const field of ['name','id'])add('list-'+field,e.page.renderProductListItemCompact({...base,[field]:field==='id'?id:text}),field==='name'?'.recipe-name':'.recipe-list-item',field==='id'?id:text,field==='id'?'data-id':undefined);
  await detail('detail-name',{...base,name:text},null,'.detail-title');
  for(const[field,attr]of [['date','date'],['expiryDate','expiry'],['qty','qty'],['deductedBagQty','bags'],['staffName','staff'],['note','note']])await detail('history-'+field,base,{[field]:text},'[data-log-'+attr+']');
  if(role!=='production'){
   for(const[field,attr]of [['id','data-logid'],['qty','data-qty'],['deductedBagQty','data-bagqty']])await detail('row-'+field,base,{[field]:field==='id'?id:text},'.btn-del-row',field==='id'?id:text,attr);
   await detail('row-bag-id',{...base,bagTypeId:id},{},'.btn-del-row',id,'data-bagid');
  }
  const sample={id:'s1',name:'샘플',kind:'sample',target:'cat'};
  for(const field of ['name','id']){const row={...sample,[field]:field==='id'?id:text};e.page.__fixture([row]);add('component-'+field,'<select>'+e.page.renderComponentOptions(row.id)+'</select>','option:nth-child(2)',row[field],field==='id'?'value':undefined);}
  const util=await e.load('src/utils/recipe.js');add('recipe-option','<select>'+util.getRecipeOptionsHtml([{displayName:text}],text)+'</select>','option:nth-child(2)',text,'value');
  if(role!=='production'){
   for(const field of ['name','id']){e.state.rows.bagTypes=[{id:'b1',name:'봉투',category:'freezeDry',active:true,sortOrder:0,[field]:field==='id'?id:text}];e.page.__fixture([base]);await e.page.showProductModal(base);add('bag-'+field,modal(),'#m_bagType option:nth-child(2)',field==='id'?id:text,field==='id'?'value':undefined);}
   for(const field of ['date','expiryDate','qty','note']){e.page.__fixture([base]);edit(base,{date:e.today,expiryDate:'2027-10-28',qty:4,staffName:'담당',note:'',[field]:text});const selector=field==='date'?'#m_date':field==='expiryDate'?'#m_source_expiry':field==='qty'?'#m_source_qty':'#m_source_note';add('edit-'+field,modal(),selector,text,'value');}
   edit({...base,name:text},{date:e.today,qty:4});add('edit-name',modal(),'.modal-title');
   e.page.__fixture([base],{senior:[{name:text}]});edit(base,{date:e.today,qty:4,staffName:text});add('edit-staff',modal(),'#m_source_staff option:nth-child(2)',text,'value');
  }
  e.state.rows.bagTypes=[{id:'b1',name:'봉투',category:'freezeDry',currentQty:100}];e.page.__fixture([base],{senior:[{name:'담당'}]});await e.page.showIncomingModal({...base,name:text});add('incoming-name',modal(),'.modal-title');
  e.page.__fixture([base],{senior:[{name:text}]});await e.page.showIncomingModal(base);add('incoming-staff',modal(),'#m_staff option:nth-child(2)',text,'value');
  // Display-only identity fixture; no server command is submitted here.
  e.cache.get('firebase/functions').setExport('getFunctions',()=>({}));e.cache.get('firebase/functions').setExport('httpsCallable',()=>async()=>({data:{production:true,sharedQc:false,employeeId:'fixture-employee',name:'담당'}}));
  const set={...base,kind:'sampleSet',bagTypeId:null,components:[{frozenProductId:'s1',qty:2}]};e.page.__fixture([set,{...sample,name:text}],{senior:[{name:'담당'}]});e.state.rows.frozenLogs=[];await e.page.showIncomingModal(set);e.fill('#m_qty',3);await e.fire('#m_qty','input');add('component-preview',modal(),'#m_compPreview');
  if(e.state.writes.length)throw Error('Display fixture wrote data');
 }finally{await e.cleanup();}return views;
}

