import {escapeHtml as h} from '../utils/html.js';
import {round2} from '../utils/number.js';
import {productGroups,lotTotal} from './frozenPanDesk.js';

export const DEFAULT_PAN_CATEGORIES=[{id:'main',label:'주식'},{id:'tender',label:'텐더'},{id:'treat',label:'생식트릿'},{id:'other',label:'기타 보유 재고'}];
export function validatePanCategories(config){
 if(config?.version!==1||!Array.isArray(config.categories)||!config.categories.length||config.categories.length>20||!Array.isArray(config.assignments)||config.assignments.length>1000)throw Error('카테고리 설정을 확인해주세요.');
 const ids=new Set(),labels=new Set(),names=new Set();
 const categories=config.categories.map(c=>{
  const label=String(c.label||'').trim();
  if(typeof c.id!=='string'||!/^[-\w]{1,80}$/.test(c.id)||ids.has(c.id)||!label||label.length>40||labels.has(label))throw Error('카테고리 이름은 중복 없이 40자 이내로 입력해주세요.');
  ids.add(c.id);labels.add(label);return {id:c.id,label};
 });
 const assignments=config.assignments.map(a=>{
  if(typeof a.productName!=='string'||!a.productName||a.productName.length>300||names.has(a.productName)||!ids.has(a.categoryId))throw Error('품목의 카테고리를 확인해주세요.');
  names.add(a.productName);return {productName:a.productName,categoryId:a.categoryId};
 });
 return {version:1,categories,assignments};
}
export function panStockGridModel(recipes,bread,frozen,stored){
 const config=stored?validatePanCategories(stored):{version:1,categories:DEFAULT_PAN_CATEGORIES.map(c=>({...c})),assignments:[]};
 const names=productGroups(recipes,bread,frozen).flatMap(([,items])=>items),active=new Set(recipes.map(r=>r.displayName));
 const assignment=new Map(config.assignments.map(a=>[a.productName,a.categoryId]));
 const categories=config.categories.map(c=>({...c,names:[]}));
 for(const name of names){
  const fallback=!active.has(name)?'other':name.includes('주식')?'main':/텐더|텐터/.test(name)?'tender':'treat';
  const id=assignment.get(name)||fallback;
  if(!categories.some(c=>c.id===id))categories.push({...DEFAULT_PAN_CATEGORIES.find(c=>c.id===fallback),names:[]});
  categories.find(c=>c.id===id).names.push(name);
 }
 const dates=new Set(),amounts=new Map();
 for(const [kind,groups] of [['bread',bread],['frozen',frozen]])for(const [name,lots]of Object.entries(groups))for(const lot of lots){
  const qty=Number(lot.remaining||0);if(!qty)continue;
  const date=String(lot.date||'날짜 미상');dates.add(date);
  const key=JSON.stringify([name,kind,date]);amounts.set(key,(amounts.get(key)||0)+qty);
 }
 return {categories:categories.filter(c=>c.names.length||c.id!=='other'),names,
  dates:[...dates].sort((a,b)=>a==='날짜 미상'?1:b==='날짜 미상'?-1:b.localeCompare(a)),
  quantity:(name,kind,date)=>round2(amounts.get(JSON.stringify([name,kind,date]))||0),
  total:(name,kind)=>lotTotal((kind==='bread'?bread:frozen)[name]),
  editorConfig:{version:1,categories:categories.map(({id,label})=>({id,label})),assignments:[...config.assignments.filter(a=>!names.includes(a.productName)),...categories.flatMap(c=>c.names.map(productName=>({productName,categoryId:c.id})))]}};
}
export function renderPanStockGrid(model,collapsed=new Set(),canEdit=false){
 const closed=c=>collapsed.has(c.id)||!c.names.length;
 const columns=model.categories.reduce((n,c)=>n+(closed(c)?1:c.names.length*2),0);
 const cell=(q,kind,total)=>'<td class="'+(kind==='frozen'?'pan-grid-frozen pan-grid-edge ':'')+(!q?'pan-grid-zero':'')+'">'+(!q&&!total?'—':h(q))+'</td>';
 const cells=date=>model.categories.map(c=>closed(c)?'<td class="pan-grid-collapsed pan-grid-edge"></td>':c.names.map(name=>['bread','frozen'].map(kind=>cell(date?model.quantity(name,kind,date):model.total(name,kind),kind,!date)).join('')).join('')).join('');
 const width=100+model.categories.reduce((n,c)=>n+(closed(c)?52:c.names.length*100),0);
 const head=model.categories.map(c=>'<th class="pan-grid-category pan-grid-edge" colspan="'+(closed(c)?1:c.names.length*2)+'" '+(closed(c)?'rowspan="3"':'')+'><button type="button" data-pan-fold="'+h(c.id)+'" aria-expanded="'+!closed(c)+'" aria-label="'+h(c.label)+(closed(c)?' 펼치기':' 가로 접기')+'">'+(closed(c)?'▸ ':'◂ ')+h(c.label)+' <small>'+c.names.length+'종</small></button></th>').join('');
 const expanded=model.categories.filter(c=>!closed(c)).flatMap(c=>c.names);
 return '<section class="pan-grid"><header class="pan-grid-toolbar"><small>입고일별 현재 잔량 · 카테고리별 가로 접기</small>'+(canEdit?'<button class="btn-secondary" id="panCategories">카테고리 편집</button>':'')+'</header><div class="pan-grid-scroll"><table class="pan-stock-grid" style="min-width:'+width+'px" aria-label="입고일별 품목별 빵판 동결판 잔량"><colgroup><col style="width:100px">'+model.categories.map(c=>closed(c)?'<col style="width:52px">':c.names.map(()=>'<col style="width:50px"><col style="width:50px">').join('')).join('')+'</colgroup><thead><tr><th rowspan="3" scope="col" class="pan-grid-date pan-grid-edge">입고일 ↓</th>'+head+'</tr><tr>'+expanded.map(name=>'<th colspan="2" scope="colgroup" class="pan-grid-edge"><button class="pan-grid-product" data-product="'+h(name)+'">'+h(name)+'</button></th>').join('')+'</tr><tr>'+expanded.map(()=>'<th scope="col" class="pan-grid-unit">빵(개)</th><th scope="col" class="pan-grid-unit pan-grid-edge">동결(판)</th>').join('')+'</tr></thead><tbody><tr class="pan-grid-total"><th scope="row" class="pan-grid-date pan-grid-edge">잔량 합계</th>'+cells(null)+'</tr>'+model.dates.map(date=>'<tr><th scope="row" class="pan-grid-date pan-grid-edge">'+h(date)+'</th>'+cells(date)+'</tr>').join('')+(!model.dates.length?'<tr><td colspan="'+(columns+1)+'">현재 남은 재고가 없습니다.</td></tr>':'')+'</tbody></table></div><small class="pan-grid-legend">날짜는 입고일 · 숫자는 해당 입고분의 현재 잔량 · — 잔량 없음 · 품목명을 누르면 상세 이력</small></section>';
}
