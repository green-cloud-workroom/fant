import { doc,getDocFromServer,Timestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { flags,performanceDisabled } from '../config/performanceFlags.js';
import { DASHBOARD_LOGIC_VERSION } from '../config/dashboardCompatibility.js';
import { displayPool } from '../state/displayReads.js';
import { sessionStore } from '../state/sessionStore.js';
import { eligibleSummary,assembleSummary } from '../domain/summaryContract.js';
export function summaryEnabled(){return flags.viewMode==='summary'&&!performanceDisabled()&&!!DASHBOARD_LOGIC_VERSION;}
const versions=new WeakMap();
export async function summaryStillCurrent(model){
  const version=versions.get(model);if(!version||version.epoch!==sessionStore.epoch)return false;
  const snapshot=await displayPool.getDoc(doc(db,'productionDashboardViews','v1__'+version.date),'main-summary');
  const latest=snapshot.exists()?snapshot.data():null;
  return version.epoch===sessionStore.epoch&&eligibleSummary(latest,{date:version.date,logicVersion:DASHBOARD_LOGIC_VERSION})&&latest.generation===version.generation&&latest.buildId===version.buildId&&latest.controlRevision===version.controlRevision;
}
export async function loadSummary(date) {
  if(!summaryEnabled())return null;
  const epoch=sessionStore.epoch;
  try {
    const snap=await displayPool.getDoc(doc(db,'productionDashboardViews','v1__'+date),'main-summary');
    if(epoch!==sessionStore.epoch)return null;
    const root=snap.exists()?snap.data():null;
    if(!eligibleSummary(root,{date,logicVersion:DASHBOARD_LOGIC_VERSION}))return null;
    const model=await assembleSummary(root,async id=>{
      const chunk=await getDocFromServer(doc(db,'productionDashboardViews','v1__'+date,'chunks',id));
      return chunk.exists()?chunk.data():null;
    },millis=>Timestamp.fromMillis(millis));
    const current=await displayPool.getDoc(doc(db,'productionDashboardViews','v1__'+date),'main-summary');
    const latest=current.exists()?current.data():null;
    if(!eligibleSummary(latest,{date,logicVersion:DASHBOARD_LOGIC_VERSION})||latest.generation!==root.generation||latest.buildId!==root.buildId||latest.controlRevision!==root.controlRevision)return null;
    versions.set(model,{epoch,date,generation:root.generation,buildId:root.buildId,controlRevision:root.controlRevision});
    return epoch===sessionStore.epoch?model:null;
  }catch(error){
    if(error.code==='permission-denied')throw error;
    console.warn('[메인 요약 대체]',error.code||error.message);return null;
  }
}
