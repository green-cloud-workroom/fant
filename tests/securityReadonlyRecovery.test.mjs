import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {buildReadonlyRecovery,readonlyRecoveryCsp} from '../scripts/securityReadonlyRecovery.mjs';
const input={releaseId:'security-20261029-integrated',expectedProtectedRulesSha256:'a'.repeat(64),sourceCommit:'b'.repeat(40)};
test('recovery entry has no writer, script, form, embedded or outbound resource',()=>{
  const {html,manifest}=buildReadonlyRecovery(input),{document}=parseHTML(html);
  assert.equal(document.querySelectorAll('script,form,iframe,object,embed,a,link,img,video,audio,source,[src],[href],[action]').length,0);
  assert.equal([...document.querySelectorAll('*')].flatMap(el=>[...el.attributes]).some(a=>/^on/i.test(a.name)),false);
  assert.match(document.body.textContent,/応答|응답/);
  assert.equal(document.querySelector('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),readonlyRecoveryCsp);
  assert.match(readonlyRecoveryCsp,/script-src 'none'/);assert.match(readonlyRecoveryCsp,/connect-src 'none'/);
  assert.equal(manifest.assetHashes['index.html'],createHash('sha256').update(html).digest('hex'));
  assert.equal(manifest.applicationWriterIncluded,false);assert.equal(manifest.activeRulesVerified,false);assert.equal(manifest.databaseRestorePerformed,false);
});
test('static preparation never claims protected Rules have actually been activated',()=>{
  const {manifest}=buildReadonlyRecovery(input);
  assert.equal(manifest.expectedProtectedRulesSha256,input.expectedProtectedRulesSha256);
  assert.equal(manifest.requiresExplicitProtectedRulesVerification,true);
  assert.equal(manifest.firebaseClientIncluded,false);assert.equal(manifest.operatingWrites,0);
});
test('unbound or injectable release metadata is rejected',()=>{
  for(const releaseId of ['',null,'security-<script>','other-release','security-a'.repeat(100)])assert.throws(()=>buildReadonlyRecovery({...input,releaseId}));
  assert.throws(()=>buildReadonlyRecovery({...input,expectedProtectedRulesSha256:'latest'}));
  assert.throws(()=>buildReadonlyRecovery({...input,sourceCommit:'main'}));
});
