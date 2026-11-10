import {escapeHtml as h} from '../utils/html.js';
import {validatePanCategories} from './panStockGrid.js';

export function openPanCategoryEditor({config,names,showModal,onSave}){
 const draft=JSON.parse(JSON.stringify(config));
 const render=()=>{
  showModal('<h3 class="modal-title">재고표 카테고리 편집</h3><p>표시 이름과 품목 소속을 변경합니다.</p><div class="pan-category-fields">'+draft.categories.map((c,i)=>'<div><input aria-label="카테고리 이름" data-category-name="'+i+'" value="'+h(c.label)+'" maxlength="40"><button class="btn-secondary" data-category-delete="'+i+'" '+(draft.assignments.some(a=>a.categoryId===c.id)||draft.categories.length===1?'disabled':'')+'>삭제</button></div>').join('')+'</div><button class="btn-secondary" id="panCategoryAdd">＋ 카테고리 추가</button><div class="pan-category-assignments">'+names.map((name,i)=>'<label><span>'+h(name)+'</span><select aria-label="'+h(name)+' 카테고리" data-category-product="'+i+'">'+draft.categories.map(c=>'<option value="'+h(c.id)+'" '+(draft.assignments.find(a=>a.productName===name)?.categoryId===c.id?'selected':'')+'>'+h(c.label)+'</option>').join('')+'</select></label>').join('')+'</div><p id="panCategoryError" role="alert"></p><div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">취소</button><button class="btn-primary" id="panCategorySave">저장</button></div>');
  const overlay=document.getElementById('modalOverlay');
  const capture=()=>{overlay.querySelectorAll('[data-category-name]').forEach(input=>draft.categories[Number(input.dataset.categoryName)].label=input.value);};
  overlay.querySelectorAll('[data-category-product]').forEach(input=>input.addEventListener('change',()=>{capture();draft.assignments.find(a=>a.productName===names[Number(input.dataset.categoryProduct)]).categoryId=input.value;render();}));
  overlay.querySelectorAll('[data-category-name]').forEach(input=>input.addEventListener('change',()=>{capture();render();}));
  overlay.querySelectorAll('[data-category-delete]').forEach(button=>button.addEventListener('click',()=>{capture();const c=draft.categories[Number(button.dataset.categoryDelete)];if(!draft.assignments.some(a=>a.categoryId===c.id)&&draft.categories.length>1){draft.categories=draft.categories.filter(a=>a.id!==c.id);render();}}));
  overlay.querySelector('#panCategoryAdd').addEventListener('click',()=>{capture();if(draft.categories.length>=20)return;draft.categories.push({id:'category_'+Date.now()+'_'+draft.categories.length,label:'새 카테고리'});render();});
  overlay.querySelector('#panCategorySave').addEventListener('click',async()=>{capture();const button=overlay.querySelector('#panCategorySave');button.disabled=true;try{await onSave(validatePanCategories(draft));}catch(error){overlay.querySelector('#panCategoryError').textContent=error.message;}finally{if(button.isConnected)button.disabled=false;}});
 };
 render();
}
