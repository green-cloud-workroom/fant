import {withReadWorkflow} from './readCommand.js';
import {getPageContext} from '../utils/pageLifecycle.js';

// Existing multi-step operations retain their write order. A failed or unknown
// step blocks this page until an explicit server refresh; it is never replayed.
export async function runPageCommand(resource,callback,{roles=['admin','office'],refresh}={}) {
  const page=getPageContext();
  let committed=false;
  try {
    const result=await withReadWorkflow(resource,async command=>{
      command.isCurrent=()=>!page||page.isCurrent();
      try { return await callback(command); }
      finally { committed=command.committed; }
    },{roles});
    if(committed && !resource.blocked && (!page||page.isCurrent()) && !document.querySelector('.modal-overlay'))await (refresh||resource.refresh)?.({force:true});
    return result;
  } catch(error) {
    console.error(`[${resource.route} 저장]`,error);
    alert(error.message);
  }
}
