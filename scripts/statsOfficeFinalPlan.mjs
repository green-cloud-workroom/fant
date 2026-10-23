import{resolveStatsCorrections,evidenceKey}from'../src/services/statsCorrections.js';
const targets=new Map([['meatLogs/7JJ1dBQB1lgAg7sRFR0b',['retainSupply','2026-07-14']],['bagLogs/N61pXro6WLvxHDUSutYZ',['retainSupply','2026-06-23']],['bagLogs/TonEUEJowFqBzE7KDqTu',['excludeSupply',null]]]);
export function statsOfficeFinalWrites(data,manifest){
 if(manifest.projectId!=='fant-e5ae5'||manifest.schemaVersion!==1||manifest.rules.length!==3||new Set(manifest.rules.map(c=>c.source)).size!==3)throw Error('Unexpected office answer manifest');
 const rules=[...data.statsCorrections],writes=[];
 for(const c of manifest.rules){const target=targets.get(c.source);if(!target||c.kind!==target[0]||(c.receiptDate||null)!==target[1]||c.changesStock!==false||!c.supersedes)throw Error('Outside confirmed source/date allowlist');const old=rules.find(r=>r.id===c.id);if(old&&evidenceKey(old)!==evidenceKey(c))throw Error('Existing decision differs; cannot overwrite');if(!old){rules.push(c);writes.push({path:'statsCorrections/'+c.id,value:c});}}
 const projected={...data,statsCorrections:rules};resolveStatsCorrections(projected);return{writes,projected};
}
