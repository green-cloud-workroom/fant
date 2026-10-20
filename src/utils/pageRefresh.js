import {getPageContext,registerPageCleanup} from './pageLifecycle.js';
import {canLeavePage,hasDirtyFields} from './formDraft.js';
import {dismissAllModals} from './modalManager.js';

export function pageRefresh(resource,refresh,{draftSelector}={}) {
  const page=getPageContext(),host=page?.host || document.getElementById('mainContent');
  let timer;
  registerPageCleanup(()=>clearTimeout(timer));
  return ({error}={})=>{
    clearTimeout(timer);
    if(!host?.isConnected || (page&&!page.isCurrent()))return;
    if(error?.code==='permission-denied'){host.replaceChildren();return;}
    const draft = draftSelector ? [...host.querySelectorAll(draftSelector)].some(hasDirtyFields) : resource.prepare && hasDirtyFields(host);
    if(error || resource.busy || draft || host.contains(document.activeElement) || document.querySelector('.modal-overlay')) {
      if(host.querySelector('[data-refresh-notice]'))return;
      const notice=document.createElement('p');notice.dataset.refreshNotice='true';
      notice.textContent=error?'최신 자료를 확인하지 못했습니다. 입력은 유지됩니다.':'자료가 변경되었습니다. 작성 중인 입력은 유지됩니다.';
      const button=document.createElement('button');button.className='btn-secondary';button.textContent='최신 자료 다시 불러오기';
      button.addEventListener('click',async()=>{if(await canLeavePage()){if(page&&!page.isCurrent())return;dismissAllModals();await refresh({force:true});}});
      notice.append(button);host.prepend(notice);return;
    }
    timer=setTimeout(()=>refresh().catch(error=>{if(host.isConnected){const notice=document.createElement('p');notice.textContent=error.message;host.prepend(notice);}}),120);
  };
}
