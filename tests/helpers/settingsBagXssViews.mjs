import {pageEnvironment} from './pageDom.mjs';
import {escapeHtml} from '../../src/utils/html.js';
export const attackText = `한글 "'><img src=x onerror="window.__xss=(window.__xss||0)+1"> &amp; </textarea></option></select><img src=x onerror="window.__xss=(window.__xss||0)+1"><select><option>`;
export const ordinaryText = `닭 & 오리 <특선> "큰" '작은' &amp;`;
export function serializeView(node){
 if(node.nodeType===3)return escapeHtml(node.textContent);
 if(node.nodeType!==1)return '';
 const tag=node.localName,attrs=[...node.attributes].map(a=>` ${a.name}="${escapeHtml(a.value)}"`).join('');
 const open='<'+tag+attrs+'>';return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)?open:open+[...node.childNodes].map(serializeView).join('')+'</'+tag+'>';
}
export async function captureSettingsBagViews({sourceFiles,role='office',text=attackText}={}){
 const views=[];const add=(name,html,selector,expected=text,attribute)=>views.push({name,role,html,selector,expected,attribute});
 const idText=text===attackText?'x"><img src=x onerror="window.__xss=(window.__xss||0)+1">':text.slice(0,200);
 const settings=await pageEnvironment('settings',{role,sourceFiles,instrument:'\nexport {renderStaffGroup,renderStaffList,renderHolidaysSection,renderSystemValueRow};'});
 try{
  if(role==='production'){await settings.page.renderSettings();if(settings.document.querySelector('.settings-wrap'))throw Error('Production role reached privileged settings');}
  else{
   add('settings-staff-group',settings.page.renderStaffGroup('senior','선임',[{name:text}],true),'.staff-item span');
   add('settings-staff-refresh',settings.page.renderStaffList('senior',[{name:text}],true),'.staff-item span');
   add('settings-holiday-title',settings.page.renderHolidaysSection([{id:'2026-10-28',title:text}]),'.holiday-label');
   add('settings-holiday-label',settings.page.renderHolidaysSection([{id:'2026-10-28',label:text}]),'.holiday-label');
   add('settings-holiday-id',settings.page.renderHolidaysSection([{id:idText,title:'정상'}]),'.holiday-item',idText,'data-id');
   const field={key:'example',type:'integer',label:'수량',desc:'설명'};
   add('settings-number',settings.page.renderSystemValueRow(field,text,true),'input',text,'value');
   add('settings-numerator',settings.page.renderSystemValueRow({...field,type:'fraction'},{numerator:text,denominator:1},true),'input[data-frac-part="numerator"]',text,'value');
   add('settings-denominator',settings.page.renderSystemValueRow({...field,type:'fraction'},{numerator:1,denominator:text},true),'input[data-frac-part="denominator"]',text,'value');
  }
  if(settings.state.writes.length)throw Error('Display fixture wrote data');
 }finally{await settings.cleanup();}
 const e=await pageEnvironment('bag',{role,sourceFiles,instrument:'\nexport {renderBagItem,showBagModal,showBagIncomingModal,showBagAdjustModal,showBagDetail};\nexport function __bagFixture(types,staff,selected){bagTypes=types;staffCache=staff;selectedBagId=selected;}'});
 try{
  const bag={...e.state.rows.bagTypes[0],piecesPerBox:10,minimumBoxQty:2};
  e.page.__bagFixture([bag],{lead:[{name:'담당'}],office:[]},bag.id);
  for(const field of ['name','id','category','currentQty']){
   const value=field==='id'?idText:text,row={...bag,[field]:value};
   const attribute={category:'data-category',id:'data-id'}[field];
   add('bag-list-'+field,e.page.renderBagItem(row),'.bag-row',value,attribute);
  }
  const root=e.document.querySelector('#mainContent');
  async function detail(name,row,log,selector,expected=text){
   e.state.rows.bagLogs=log?[{id:'bl1',bagTypeId:bag.id,date:e.today,qty:1,staffName:'담당',type:'incoming',timestamp:new Date(),...log}]:[];
   root.innerHTML='<div id="bagDetail"></div>';await e.page.showBagDetail(row);add(name,serializeView(e.document.querySelector('#bagDetail')),selector,expected);
  }
  await detail('bag-detail-name',{...bag,name:text},null,'.detail-title');
  for(const field of ['currentQty','piecesPerBox'])await detail('bag-detail-'+field,{...bag,[field]:text},null,'.detail-body');
  for(const field of ['date','qty','staffName','note','reason'])await detail('bag-log-'+field,bag,{[field]:text},'tbody');
  for(const field of ['name','piecesPerBox','minimumBoxQty']){
   e.page.showBagModal({...bag,[field]:text});const selector=field==='name'?'#m_bagName':field==='piecesPerBox'?'#m_piecesPerBox':'#m_minBox';
   add('bag-edit-'+field,serializeView(e.document.querySelector('#modalOverlay')),selector,text,field==='name'?undefined:'value');
  }
  e.page.showBagIncomingModal({...bag,name:text});add('bag-incoming-name',serializeView(e.document.querySelector('#modalOverlay')),'.modal-title');
  e.page.showBagAdjustModal({...bag,name:text});add('bag-adjust-name',serializeView(e.document.querySelector('#modalOverlay')),'.modal-title');
  e.page.__bagFixture([bag],{lead:[{name:text}],office:[]},bag.id);e.page.showBagIncomingModal(bag);
  add('bag-staff-option',serializeView(e.document.querySelector('#modalOverlay')),'#m_staff option',text,'value');
  // Empty option precedes the stored name; select its explicit second option.
  views.at(-1).selector='#m_staff option:nth-child(2)';
  if(e.state.writes.length)throw Error('Display fixture wrote data');
 }finally{await e.cleanup();}
 return views;
}
