// Only the two receipt-related blocks are patched on top of fresh live rules.
// The production-only firestore.rules file is never used for a shared release.
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { patchReceiptRules } from './receiptRulesPatch.mjs';
const directory='output/readpath/receipt-rules-release';
const mode=process.argv[2];
if(!['--prepare','--deploy','--verify'].includes(mode))throw Error('Use --prepare, --deploy or --verify.');
const sha=value=>createHash('sha256').update(value).digest('hex');
const app=initializeApp({credential:applicationDefault(),projectId:'fant-e5ae5'});
const service=getSecurityRules(app);
async function current(){
 const rules=await service.getFirestoreRuleset();
 if(rules.source.length!==1)throw Error('Unexpected shared rules source structure.');
 return {name:rules.name,source:rules.source[0].content};
}
try {
 if(mode==='--prepare'){
  const live=await current(),candidate=patchReceiptRules(live.source);
  await mkdir(directory,{recursive:true});
  await writeFile(directory+'/before.rules',live.source);
  await writeFile(directory+'/candidate.rules',candidate);
  const manifest={project:'fant-e5ae5',preparedAt:new Date().toISOString(),base:live.name,baseSha:sha(live.source),candidateSha:sha(candidate)};
  await writeFile(directory+'/manifest.json',JSON.stringify(manifest,null,2));
  console.log(JSON.stringify(manifest));
 }else{
  const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));
  const candidate=await readFile(directory+'/candidate.rules','utf8');
  if(manifest.project!=='fant-e5ae5'||sha(candidate)!==manifest.candidateSha)throw Error('Prepared candidate changed.');
  if(mode==='--deploy'){
   const acceptance=JSON.parse(await readFile('output/readpath/emulator/verification.json','utf8'));
   const testedAt=Date.parse(acceptance.checkedAt);
   if(!acceptance.passed||acceptance.rulesSha!==manifest.candidateSha||!Number.isFinite(testedAt)||testedAt>Date.now()||Date.now()-testedAt>3600000)throw Error('The exact candidate needs a fresh successful emulator check.');
   const before=await current();
   if(before.name!==manifest.base||sha(before.source)!==manifest.baseSha)throw Error('Live rules changed; prepare and verify again.');
   if(sha(patchReceiptRules(before.source))!==manifest.candidateSha)throw Error('Candidate exceeds the allowed receipt patch.');
   const ruleset=await service.createRuleset(service.createRulesFileFromSource('firestore.rules',candidate));
   const recheck=await current();
   if(recheck.name!==manifest.base||sha(recheck.source)!==manifest.baseSha)throw Error('Concurrent rules release detected; no release applied.');
   await service.releaseFirestoreRuleset(ruleset);
  }
  const live=await current();
  const report={checkedAt:new Date().toISOString(),mode,liveRuleset:live.name,liveSha:sha(live.source),expectedSha:manifest.candidateSha,match:sha(live.source)===manifest.candidateSha};
  await writeFile(directory+'/verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));if(!report.match)throw Error('Deployed rules do not match the verified candidate.');
 }
}finally{await deleteApp(app);}
