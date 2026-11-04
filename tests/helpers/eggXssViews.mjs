import {pageEnvironment} from './pageDom.mjs';
import {attackText,ordinaryText,serializeView} from './settingsBagXssViews.mjs';
export {attackText,ordinaryText};
export async function captureEggViews({sourceFiles,role='office',text=attackText}={}){
 const e=await pageEnvironment('egg',{role,sourceFiles,instrument:'\nexport {renderEggLayout,showEggModal,showEggAdjustModal,showSetMinModal,buildEggFifoBreakdown,renderEggFifoPanel};\nexport function __staff(name){staffCache={senior:[{name}],office:[]};}'}),views=[];
 const stock={currentQty:100,minimumQty:20},log={id:'log',date:'2026-10-28',timestamp:1,type:'in',qty:10,before:90,after:100,staffName:'담당',note:''};
 const add=(name,html,selector,expected=text,attribute)=>views.push({name,role,html,selector,expected,attribute});
 const modal=()=>serializeView(e.document.querySelector('#modalOverlay'));
 try{
  for(const[field,col]of [['date',1],['qty',3],['before',4],['after',5],['staffName',6],['note',7],['reason',7]]){
   e.page.renderEggLayout(stock,[{...log,[field]:text}]);add('history-'+field,serializeView(e.document.querySelector('#mainContent')),'.egg-history-table tbody td:nth-child('+col+')');
  }
  e.page.showEggAdjustModal({...stock,currentQty:text});add('adjust-currentQty',modal(),'.modal-box p:has(+ .form-row)');
  e.page.showSetMinModal({...stock,minimumQty:text});add('settings-minimumQty',modal(),'#m_minQty',text,'value');
  e.page.__staff(text);
  for(const kind of ['in','out','adjust']){
   if(kind==='adjust')e.page.showEggAdjustModal(stock);else e.page.showEggModal(kind,stock);
   add('staff-'+kind,modal(),'#m_staff option:nth-child(2)',text,'value');
  }
  if(e.state.writes.length)throw Error('Display fixture wrote data');
 }finally{await e.cleanup();}return views;
}
