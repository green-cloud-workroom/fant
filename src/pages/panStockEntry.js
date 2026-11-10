import {escapeHtml as h} from '../utils/html.js';

export function mountPanStockEntry({root,grid,collapsed,entry,breadNames,staffOptions,onAdd,onCancel,onSave,onChange,onConvert}){
 const toolbar=root.querySelector('.pan-grid-toolbar');if(!toolbar)return;
 toolbar.insertAdjacentHTML('beforeend','<button type="button" class="btn-primary" id="panAddDate">＋ 날짜 추가 · 빵판 입고</button>');
 root.querySelector('#panAddDate').addEventListener('click',onAdd);
 // Original rows remain read-only. Frozen cells open the original work/receipt form.
 for(const row of root.querySelectorAll('.pan-stock-grid tbody tr')){
  if(row.children.length<2||row.children[0].hasAttribute('colspan'))continue;
  let index=1;
  for(const c of grid.categories){
   if(collapsed.has(c.id)||!c.names.length){index++;continue;}
   for(const name of c.names){
    const cell=row.children[index+1];index+=2;if(!cell)continue;
    const label=cell.textContent.trim();
    cell.innerHTML='<button type="button" class="pan-grid-convert" data-pan-convert="'+h(name)+'" aria-label="'+h(name)+' 전처리 또는 동결판 입고">'+(label==='—'||label==='0'?'＋':h(label))+'</button>';
   }
  }
 }
 root.querySelectorAll('[data-pan-convert]').forEach(button=>button.addEventListener('click',()=>onConvert(button.dataset.panConvert)));
 if(!entry)return;
 const controls=document.createElement('div');controls.className='pan-inline-controls';
 controls.innerHTML='<label>입고일 <input type="date" id="panEntryDate" value="'+h(entry.date)+'"></label><label>담당자 <select id="panEntryStaff"><option value="">선택</option>'+staffOptions+'</select></label><label>비고 <input id="panEntryNote" maxlength="200" value="'+h(entry.note)+'"></label><button type="button" class="btn-primary" id="panEntrySave" data-operation-id="'+h(entry.operationId)+'">입고 저장</button><button type="button" class="btn-secondary" id="panEntryCancel">취소</button><small>필요한 빵 칸만 클릭 · 입력한 품목만 입고</small>';
 toolbar.insertAdjacentElement('afterend',controls);
 controls.querySelector('#panEntryStaff').value=entry.staffName;
 for(const [id,key]of [['panEntryDate','date'],['panEntryStaff','staffName'],['panEntryNote','note']])controls.querySelector('#'+id).addEventListener('change',event=>{entry[key]=event.target.value;if(key==='date')onChange();});
 for(const [id,key]of [['panEntryStaff','staffName'],['panEntryNote','note']])controls.querySelector('#'+id).addEventListener('input',event=>{entry[key]=event.target.value;});
 const tbody=root.querySelector('.pan-stock-grid tbody');
 const html='<tr class="pan-inline-row"><th class="pan-grid-date pan-grid-edge">'+h(entry.date)+'<small>입고 입력 중</small></th>'+grid.categories.map(c=>collapsed.has(c.id)||!c.names.length?'<td class="pan-grid-collapsed pan-grid-edge"></td>':c.names.map(name=>'<td>'+(breadNames.has(name)?entry.active===name?'<input type="number" min="0.01" step="0.01" data-pan-bread-input="'+h(name)+'" aria-label="'+h(name)+' 빵판 입고 수량" placeholder="수량" value="'+h(entry.amounts.get(name)||'')+'">':'<button type="button" class="pan-inline-cell" data-pan-bread-edit="'+h(name)+'" aria-label="'+h(name)+' 빵판 입고 수량 입력">'+h(entry.amounts.get(name)||'—')+'</button>':'—')+'</td><td class="pan-grid-edge">—</td>').join('')).join('')+'</tr>';
 tbody.querySelector('.pan-grid-total').insertAdjacentHTML('afterend',html);
 root.querySelectorAll('[data-pan-bread-edit]').forEach(button=>button.addEventListener('click',()=>{entry.active=button.dataset.panBreadEdit;onChange();[...root.querySelectorAll('[data-pan-bread-input]')].find(input=>input.dataset.panBreadInput===entry.active)?.focus();}));
 root.querySelectorAll('[data-pan-bread-input]').forEach(input=>input.addEventListener('input',()=>entry.amounts.set(input.dataset.panBreadInput,input.value)));
 controls.querySelector('#panEntryCancel').addEventListener('click',onCancel);
 controls.querySelector('#panEntrySave').addEventListener('click',async()=>{
  // Capture even a field whose change event has not fired yet.
  entry.date=controls.querySelector('#panEntryDate').value;entry.staffName=controls.querySelector('#panEntryStaff').value;entry.note=controls.querySelector('#panEntryNote').value;
  const button=controls.querySelector('#panEntrySave');if(entry.saving)return;entry.saving=true;
  const locked=[...controls.querySelectorAll('input,select,button'),...root.querySelectorAll('.pan-inline-row input,.pan-inline-row button')].map(node=>[node,node.disabled]);locked.forEach(([node])=>node.disabled=true);
  try{await onSave(button);}finally{entry.saving=false;locked.forEach(([node,disabled])=>{if(node.isConnected)node.disabled=disabled;});}
 });
 if(entry.saving)[...controls.querySelectorAll('input,select,button'),...root.querySelectorAll('.pan-inline-row input,.pan-inline-row button')].forEach(node=>node.disabled=true);
}
