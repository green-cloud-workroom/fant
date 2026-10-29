// Offline fallback entrypoint. This intentionally contains no application or
// Firebase client: protected Rules must remain in place while operators repair
// or roll forward a failed release. This is not a database restore tool.
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const escape=value=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const readonlyRecoveryCsp="default-src 'none'; script-src 'none'; connect-src 'none'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'";

export function buildReadonlyRecovery({releaseId,expectedProtectedRulesSha256,sourceCommit}){
  if(typeof releaseId!=='string'||!/^security-[a-zA-Z0-9-]{8,80}$/.test(releaseId))throw Error('Explicit security release ID required');
  if(!/^[a-f0-9]{64}$/.test(expectedProtectedRulesSha256??'')||!/^[a-f0-9]{40}$/.test(sourceCommit??''))throw Error('Exact expected Rules and source fingerprints required');
  const html=`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${readonlyRecoveryCsp}"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>판타펫 생산관리 · 점검 중</title><style>body{margin:0;background:#f5f6fa;color:#202838;font:17px/1.7 system-ui,sans-serif}main{max-width:640px;margin:12vh auto;padding:32px;background:#fff;border-radius:12px}h1{font-size:26px}small{color:#657084}p{margin:18px 0}</style></head>
<body><main><h1>판타펫 생산관리 점검 중</h1><p>안전한 운영 재개를 위해 생산관리 화면을 잠시 점검하고 있습니다.</p><p>지금은 이 화면에서 등록·수정·삭제할 수 없습니다. 이미 열어 둔 생산관리 화면에서도 저장을 멈추고 담당 관리자에게 확인해주세요.</p><p>화면의 응답을 확인하지 못한 작업은 다시 저장하지 말고, 담당 관리자에게 결과 확인을 요청해주세요.</p><small>점검 식별자: ${escape(releaseId)}</small></main></body></html>
`;
  const manifest={kind:'STATIC_SECURITY_READONLY_RECOVERY',version:1,releaseId,target:'https://green-cloud-workroom.github.io/fant/',sourceCommit,expectedProtectedRulesSha256,
    activeRulesVerified:false,requiresExplicitProtectedRulesVerification:true,applicationWriterIncluded:false,firebaseClientIncluded:false,
    databaseRestorePerformed:false,operatingWrites:0,assetHashes:{'index.html':sha(html)},cspSha256:sha(readonlyRecoveryCsp)};
  return {html,manifest};
}

export async function prepareReadonlyRecovery(directory,options){
  const bundle=buildReadonlyRecovery(options);
  await mkdir(directory,{recursive:false});
  await writeFile(resolve(directory,'index.html'),bundle.html,{flag:'wx'});
  await writeFile(resolve(directory,'recovery-manifest.json'),JSON.stringify(bundle.manifest,null,2)+'\n',{flag:'wx'});
  return bundle.manifest;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==2)throw Error('No execute/deploy arguments accepted');
  const directory=resolve('output/security-release-20261029/readonly-recovery');
  const manifest=await prepareReadonlyRecovery(directory,{releaseId:'security-20261029-integrated',expectedProtectedRulesSha256:'4737183c382e904c7477b5def59d6e45205914844d5d3cce45f96f998d81b988',sourceCommit:'3deff9dbb9fe6578d91685cb056f773676966dd9'});
  console.log(JSON.stringify({directory,...manifest}));
}
