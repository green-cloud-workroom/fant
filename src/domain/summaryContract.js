import { canonicalPublicJson,revivePublicModel } from './publicMainModel.js';
const arrays=['productions','nextProductions','overdueProductions','overdueNextProductions','calendarProductions','recipes','meatTypeRows','meatStocks','equipmentAlerts','calendarSchedules','calendarEvents','combinedLogs'];
export async function publicHash(value) {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalPublicJson(value)));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function eligibleSummary(root,{date,logicVersion,allowShadow=false}) {
  return !!root && root.schemaVersion===1 && !!logicVersion && root.logicVersion===logicVersion && root.date===date &&
    (root.readModelMode==='serve'||(allowShadow&&root.readModelMode==='shadow')) && root.rebuildState==='ready' &&
    Number.isSafeInteger(root.generation) && root.generation>0 && typeof root.buildId==='string' &&
    root.requestedGeneration===root.generation && Array.isArray(root.chunks) && root.chunks.length<=100 && !!root.model;
}
export async function assembleSummary(root,readChunk,makeTimestamp) {
  const model={...root.model},ids=new Set(),nextIndex=new Map();
  for(const field of arrays)if(!Array.isArray(model[field]))throw Error('summary-missing-section');
  for(const chunk of root.chunks){
    if(!arrays.includes(chunk.section)||typeof chunk.id!=='string'||chunk.id.includes('/')||chunk.id!==`${root.generation}__${root.buildId}__${chunk.section}__${chunk.index}`||ids.has(chunk.id)||chunk.index!==(nextIndex.get(chunk.section)||0))throw Error('summary-invalid-manifest');
    ids.add(chunk.id);nextIndex.set(chunk.section,chunk.index+1);
    const data=await readChunk(chunk.id);
    if(!data||data.schemaVersion!==1||data.logicVersion!==root.logicVersion||data.buildId!==root.buildId||data.generation!==root.generation||data.section!==chunk.section||data.index!==chunk.index||!Array.isArray(data.payload)||data.payload.length!==chunk.rowCount||await publicHash(data.payload)!==chunk.payloadHash)throw Error('summary-invalid-chunk');
    model[chunk.section]=[...model[chunk.section],...data.payload];
  }
  if(await publicHash(model)!==root.modelHash)throw Error('summary-invalid-model');
  return revivePublicModel(model,makeTimestamp);
}
