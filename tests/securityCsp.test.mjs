import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,basename} from 'node:path';
import {build} from 'vite';
import {REVIEWED_INLINE_HANDLERS,inspectInlineHandlers,productionCsp,injectProductionCsp,inspectProjectInlineHandlers,productionCspPlugin} from '../scripts/securityCsp.mjs';

test('only the five reviewed static handler byte strings have pinned SHA256 hashes',()=>{
  assert.deepEqual(Object.keys(REVIEWED_INLINE_HANDLERS),['closeModal()','event.stopPropagation()','updateSepGuide()','updateOutType()','updateScheduleItem()']);
  for(const [code,hash]of Object.entries(REVIEWED_INLINE_HANDLERS))assert.equal(hash,'sha256-'+createHash('sha256').update(code).digest('base64'));
  const files=Object.fromEntries(Object.keys(REVIEWED_INLINE_HANDLERS).map((code,i)=>['fixture'+i,`<button onclick="${code}">synthetic</button>`]));
  assert.equal(inspectInlineHandlers(files).reviewedHandlerCount,5);assert.equal(inspectInlineHandlers(files).occurrenceCount,5);
});
test('unknown, changed, dynamic, unquoted and encoded handler additions fail closed',()=>{
  for(const source of ['<img onerror="alert(1)">','<button onclick="closeModal();alert(1)">',
    '<select onchange="${handler}">','<img onerror=alert(1)>','<button onclick="closeModal&#40;&#41;">',
    '<button ONCLICK=" closeModal()">','<button data-text="a>b" onclick="alert(1)">'])assert.throws(()=>inspectInlineHandlers({fixture:source},{requireAll:false}),/Unreviewed/);
  assert.throws(()=>inspectInlineHandlers({fixture:'<button onclick="closeModal()">'}),/set changed/);
});
test('trusted script property assignment is not an HTML handler exception',()=>{
  const result=inspectInlineHandlers({fixture:'const onChange=({error}={})=>{}; button.onclick = close; select.onchange = () => update(); element.oninput = function () {};'}, {requireAll:false});
  assert.equal(result.occurrenceCount,0);
});
test('production policy forbids arbitrary scripts, eval, objects and unlisted cloud origins',()=>{
  const policy=productionCsp(),directives=Object.fromEntries(policy.split('; ').map(value=>{const [name,...sources]=value.split(' ');return [name,sources];}));
  assert.deepEqual(directives['script-src-elem'],["'self'"]);
  assert.ok(directives['script-src'].includes("'unsafe-hashes'"));
  assert.equal(directives['script-src'].filter(value=>value.startsWith("'sha256-")).length,5);
  assert.ok(!directives['script-src'].includes("'unsafe-inline'"));assert.ok(!policy.includes('unsafe-eval'));
  assert.deepEqual(directives['object-src'],["'none'"]);
  assert.deepEqual(directives['base-uri'],["'self'"]);assert.deepEqual(directives['form-action'],["'self'"]);
  assert.ok(!policy.includes('*'));assert.ok(!policy.includes('localhost'));assert.ok(!policy.includes('127.0.0.1'));assert.ok(!policy.includes('http:'));
  assert.deepEqual(directives['connect-src'],["'self'",'https://firestore.googleapis.com','https://identitytoolkit.googleapis.com','https://securetoken.googleapis.com','https://asia-northeast3-fant-e5ae5.cloudfunctions.net']);
  assert.deepEqual(directives['frame-src'],['https://fant-e5ae5.firebaseapp.com']);
  assert.ok(!policy.includes('frame-ancestors'),'meta CSP cannot enforce framing policy');
});
test('CSP meta is inserted after charset and before the first active resource',()=>{
  const html='<!DOCTYPE html><html><head><meta charset="UTF-8" /><link href="style.css"><script src="main.js"></script></head><body></body></html>';
  const result=injectProductionCsp(html),at=result.indexOf('http-equiv="Content-Security-Policy"');
  assert.ok(at>result.indexOf('charset="UTF-8"'));assert.ok(at<result.indexOf('<link'));assert.ok(at<result.indexOf('<script'));
  assert.equal((result.match(/http-equiv="Content-Security-Policy"/g)||[]).length,1);
  assert.throws(()=>injectProductionCsp(result),/Existing CSP/);
  assert.throws(()=>injectProductionCsp('<head><script src="main.js"></script><meta charset="UTF-8"></head>'),/charset/);
  assert.throws(()=>injectProductionCsp('<head></head>'),/charset/);
  assert.throws(()=>injectProductionCsp('<body></body>'),/head/);
});
test('build-only plugin leaves development HMR policy unchanged and scans current source',async()=>{
  const plugin=productionCspPlugin();assert.equal(plugin.apply,'build');assert.equal(plugin.transformIndexHtml.order,'pre');
  const result=await inspectProjectInlineHandlers(resolve('.'));
  assert.equal(result.reviewedHandlerCount,5);assert.ok(result.occurrenceCount>=5);
});
test('actual isolated Vite build inserts CSP and fails on a new handler instead of expanding hashes',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'fant-csp-build-'));
  try{
    await mkdir(join(temp,'src'));
    await writeFile(join(temp,'index.html'),'<!DOCTYPE html><html><head><meta charset="UTF-8"><title>synthetic</title></head><body><script type="module" src="/src/main.js"></script></body></html>');
    const html=Object.keys(REVIEWED_INLINE_HANDLERS).map(code=>`<button onclick="${code}"></button>`).join('');
    // Use a template literal like the app's source, so the literal attribute
    // values are visible to the conservative build-time source inventory.
    await writeFile(join(temp,'src','main.js'),'document.body.innerHTML=`'+html+'`;');
    const options={root:temp,configFile:false,logLevel:'silent',plugins:[productionCspPlugin()],build:{write:false}};
    const result=await build(options),bundle=Array.isArray(result)?result[0]:result;
    const entry=bundle.output.find(item=>item.fileName==='index.html');assert(entry);
    assert.match(entry.source,/http-equiv="Content-Security-Policy"/);
    assert.ok(entry.source.indexOf('Content-Security-Policy')<entry.source.indexOf('<script'));
    await writeFile(join(temp,'src','main.js'),'document.body.innerHTML=`'+html+'<img onerror="unreviewed()">`;');
    await assert.rejects(build(options),/Unreviewed inline handler/);
  }finally{
    assert.equal(dirname(resolve(temp)),resolve(tmpdir()));assert.match(basename(temp),/^fant-csp-build-/);
    await rm(temp,{recursive:true,force:true});
  }
});
