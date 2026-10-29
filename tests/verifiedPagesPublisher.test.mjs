import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,truncate} from 'node:fs/promises';
import {resolve,join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {publishVerifiedAssets,verifiedOriginRemote,publisherGitEnvironment,assertPublisherRouting} from '../scripts/verifiedPagesPublisher.mjs';
const parent=resolve('output/d0-20261028');
const env={...process.env,GIT_ALLOW_PROTOCOL:'file',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@localhost',GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@localhost'};
for(const k of Object.keys(env))if(k.startsWith('GIT_')&&!['GIT_ALLOW_PROTOCOL','GIT_CONFIG_NOSYSTEM','GIT_CONFIG_GLOBAL','GIT_AUTHOR_NAME','GIT_AUTHOR_EMAIL','GIT_COMMITTER_NAME','GIT_COMMITTER_EMAIL'].includes(k))delete env[k];
const git=(cwd,args,input)=>execFileSync('git',args,{cwd,env,input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const sha=b=>createHash('sha256').update(b).digest('hex');
async function fixture(run){
 await mkdir(parent,{recursive:true});const root=await mkdtemp(join(parent,'rehearsal-'));
 try{
  const remote=join(root,'remote.git'),work=join(root,'seed'),dist=join(root,'candidate dist');
  await mkdir(remote);await mkdir(work);await mkdir(dist);git(remote,['init','--bare','--template=']);git(work,['init','--template=']);
  await mkdir(join(work,'assets'));await writeFile(join(work,'assets/retained-old.js'),'old asset');await writeFile(join(work,'index.html'),'old entry');
  git(work,['add','--all']);git(work,['commit','-m','seed']);git(work,['push',remote,'HEAD:refs/heads/gh-pages']);git(work,['remote','add','origin',remote]);
  const base=git(work,['rev-parse','HEAD']);const assets={};
  async function put(name,bytes){await mkdir(dirname(join(dist,name)),{recursive:true});await writeFile(join(dist,name),bytes);assets[name]=sha(bytes);}
  await put('index.html','new entry');await put('release.json',JSON.stringify({source:'fixture'}));await put('assets/new.js',Buffer.from('crlf\r\n\0binary'));
  const tip=()=>git(remote,['rev-parse','refs/heads/gh-pages']);
  const contender=(from=base)=>git(remote,['commit-tree',git(remote,['rev-parse',from+'^{tree}']),'-p',from],`other ${Math.random()}\n`);
  await run({root,remote,work,dist,base,assets,put,tip,contender,receiptDir:join(root,"receipts")});
 }finally{
  assert.equal(dirname(resolve(root)),parent);assert.ok(basename(root).startsWith('rehearsal-'));await rm(root,{recursive:true,force:true});
 }
}
test('1300-file additive publication preserves prior assets and exact binary bytes',async()=>fixture(async f=>{
 for(let i=0;i<1300;i++)await f.put(`assets/long-asset-name-${String(i).padStart(4,'0')}-verification-chunk.js`,`export const n=${i};`);
 const result=await publishVerifiedAssets({...f,message:'local rehearsal'});assert.equal(f.tip(),result.commit);assert.equal(result.verifiedFiles,1303);
 assert.equal(JSON.parse(await readFile(result.receiptFile,'utf8')).phase,'confirmed');
 assert.equal(git(f.remote,['show',`${result.commit}:assets/retained-old.js`]),'old asset');assert.equal(git(f.remote,['rev-parse',result.commit+'^']),f.base);
 const actual=execFileSync('git',['--git-dir',f.remote,'show',`${result.commit}:assets/new.js`],{env});assert.equal(sha(actual),f.assets['assets/new.js']);
}));
test('stale baseline refuses publication',async()=>fixture(async f=>{
 const other=f.contender();git(f.remote,['update-ref','refs/heads/gh-pages',other,f.base]);await assert.rejects(()=>publishVerifiedAssets({...f,message:'stale'}),/Remote baseline changed/);assert.equal(f.tip(),other);
}));
test('competing publish after final check is rejected by explicit lease',async()=>fixture(async f=>{
 const other=f.contender();await assert.rejects(()=>publishVerifiedAssets({...f,message:'race',rehearsalHooks:{beforePush:()=>git(f.remote,['update-ref','refs/heads/gh-pages',other,f.base])}}));assert.equal(f.tip(),other);
}));
test('remote rewind after final check is rejected too',async()=>fixture(async f=>{
 const next=f.contender();git(f.remote,['update-ref','refs/heads/gh-pages',next,f.base]);await assert.rejects(()=>publishVerifiedAssets({...f,base:next,message:'rewind',rehearsalHooks:{beforePush:()=>git(f.remote,['update-ref','refs/heads/gh-pages',f.base,next])}}));assert.equal(f.tip(),f.base);
}));
test('hash mismatch and extra dist file refuse without remote update',async()=>fixture(async f=>{
 await writeFile(join(f.dist,'index.html'),'tampered');await assert.rejects(()=>publishVerifiedAssets({...f,message:'tamper'}),/Artifact hash mismatch/);assert.equal(f.tip(),f.base);
 await f.put('index.html','new entry');await writeFile(join(f.dist,'extra.js'),'extra');await assert.rejects(()=>publishVerifiedAssets({...f,message:'extra'}),/hash mismatch|file list/i);assert.equal(f.tip(),f.base);
}));
test('post-check source mutation is caught against stored Git blob',async()=>fixture(async f=>{
 await assert.rejects(()=>publishVerifiedAssets({...f,message:'TOCTOU',rehearsalHooks:{beforeObjectRead:()=>writeFile(join(f.dist,'index.html'),'changed after check')}}),/Stored artifact hash differs/);assert.equal(f.tip(),f.base);
}));
test('immutable retained asset collision refuses',async()=>fixture(async f=>{
 await f.put('assets/retained-old.js','overwritten');await assert.rejects(()=>publishVerifiedAssets({...f,message:'collision'}),/Immutable asset collision/);assert.equal(f.tip(),f.base);
}));
test('paths, case-fold collisions and remote aliases are refused before network',async()=>fixture(async f=>{
 for(const path of ['../outside','.git/config','assets/../../x','assets/NUL.js'])await assert.rejects(()=>publishVerifiedAssets({...f,message:'unsafe',assets:{...f.assets,[path]:'a'.repeat(64)}}),/Unsafe artifact/);
 await assert.rejects(()=>publishVerifiedAssets({...f,message:'case',assets:{...f.assets,'INDEX.HTML':'a'.repeat(64)}}),/Case-fold/);
 await assert.rejects(()=>publishVerifiedAssets({...f,remote:'origin',message:'alias'}),/Explicit local path/);assert.equal(f.tip(),f.base);
}));
test('junction/symlink is refused',async()=>fixture(async f=>{
 const target=join(f.root,'outside dist');await mkdir(target);await writeFile(join(target,'escape.js'),'outside');await symlink(target,join(f.dist,'linked'),'junction');await assert.rejects(()=>publishVerifiedAssets({...f,message:'link'}),/Symlink artifact/);assert.equal(f.tip(),f.base);
}));
test('origin fetch/push disagreement is rejected',async()=>fixture(async f=>{
 assert.equal(verifiedOriginRemote(f.work),f.remote);git(f.work,['remote','set-url','--push','origin',join(f.root,'other.git')]);assert.throws(()=>verifiedOriginRemote(f.work),/URLs differ/);
}));
test('production transport cannot accept rehearsal callbacks',async()=>{
 await assert.rejects(()=>publishVerifiedAssets({remote:'https://example.invalid/repo.git',base:'a'.repeat(40),message:'no network',assets:{},rehearsalHooks:{beforePush:()=>{throw Error('must not run');}}}),/Rehearsal hooks require local/);
});
test('superseded acknowledgement preserves receipt and never rolls back another publish',async()=>fixture(async f=>{
 let other,receiptFile,calls=0;
 await assert.rejects(()=>publishVerifiedAssets({...f,message:'superseded',rehearsalHooks:{afterPush:args=>{
   calls++;receiptFile=args.receiptFile;other=f.contender(args.commit);git(f.remote,['update-ref','refs/heads/gh-pages',other,args.commit]);
 }}}),/superseded\/unknown/);
 assert.equal(calls,1);assert.equal(f.tip(),other);const receipt=JSON.parse(await readFile(receiptFile,'utf8'));assert.equal(receipt.phase,'failed-or-unknown');assert.equal(receipt.observed,other);
 assert.equal(git(f.remote,['rev-parse',other+'^']),receipt.commit);
}));
test('byte and file limits refuse locally',async()=>fixture(async f=>{
 await f.put('large.bin','');await truncate(join(f.dist,'large.bin'),101*1024*1024);
 await assert.rejects(()=>publishVerifiedAssets({...f,message:'large'}),/Artifact byte limit/);assert.equal(f.tip(),f.base);
 const many=Object.fromEntries(Array.from({length:10001},(_,i)=>[`x${i}`, 'a'.repeat(64)]));await assert.rejects(()=>publishVerifiedAssets({...f,assets:many,message:'many'}),/artifact count/);
}));
test('inherited plus candidate file count is bounded',async()=>fixture(async f=>{
 const blob=git(f.work,['rev-parse','HEAD:assets/retained-old.js']);
 const input=Array.from({length:9997},(_,i)=>`100644 ${blob}\tassets/retained-${i}.js\0`).join('');
 git(f.work,['update-index','-z','--index-info'],input);const tree=git(f.work,['write-tree']);const base=git(f.work,['commit-tree',tree,'-p',f.base],'many retained\n');git(f.work,['push',f.remote,`${base}:refs/heads/gh-pages`]);
 await assert.rejects(()=>publishVerifiedAssets({...f,base,message:'combined limit'}),/Combined artifact count limit/);assert.equal(f.tip(),base);
}));
test('directory-to-file replacement cannot remove inherited files',async()=>fixture(async f=>{
 const dist=join(f.root,'conflict');await mkdir(dist);const assets={};for(const [p,b]of Object.entries({'index.html':'new','release.json':'{}',assets:'replace directory'})){await writeFile(join(dist,p),b);assets[p]=sha(b);}
 await assert.rejects(()=>publishVerifiedAssets({...f,dist,assets,message:'directory replace'}),/Non-additive candidate tree|directory\/file conflict/);assert.equal(f.tip(),f.base);
}));
test('file-to-directory replacement cannot remove inherited files',async()=>fixture(async f=>{
 const blob=git(f.work,['rev-parse','HEAD:index.html']);git(f.work,['update-index','--add','--cacheinfo',`100644,${blob},legacy.config`]);const tree=git(f.work,['write-tree']);const base=git(f.work,['commit-tree',tree,'-p',f.base],'file baseline\n');git(f.work,['push',f.remote,`${base}:refs/heads/gh-pages`]);await f.put('legacy.config/nested.json','new');
 await assert.rejects(()=>publishVerifiedAssets({...f,base,message:'file replace'}),/Non-additive candidate tree|directory\/file conflict/);assert.equal(f.tip(),base);
}));
test('network transports preserve authentication configuration but discard repository overrides',()=>{
 const inherited={PATH:'safe',GIT_ASKPASS:'askpass-fixture',GIT_SSH_COMMAND:'ssh-fixture',GIT_SSL_CAINFO:'ca-fixture',GIT_DIR:'wrong',GIT_CONFIG_COUNT:'1',GIT_CONFIG_NOSYSTEM:'1'};
 const https=publisherGitEnvironment('https',inherited);assert.equal(https.GIT_ASKPASS,'askpass-fixture');assert.equal(https.GIT_SSL_CAINFO,'ca-fixture');assert.equal(https.GIT_DIR,undefined);assert.equal(https.GIT_CONFIG_COUNT,undefined);assert.equal(https.GIT_CONFIG_NOSYSTEM,undefined);
 const local=publisherGitEnvironment('file',inherited);assert.equal(local.GIT_ASKPASS,undefined);assert.equal(local.GIT_CONFIG_NOSYSTEM,'1');
});
test('URL rewriting is refused before any transport',()=>{
 const remote='https://example.invalid/project.git';const none=args=>{if(args[0]==='ls-remote')return remote;throw Object.assign(Error('none'),{status:1});};assert.doesNotThrow(()=>assertPublisherRouting(none,remote));
 assert.throws(()=>assertPublisherRouting(()=> 'https://rewritten.invalid/repo',remote),/URL rewrite/);
 assert.throws(()=>assertPublisherRouting(args=>args[0]==='ls-remote'?remote:'url.x.pushinsteadof https://example.invalid',remote),/pushInsteadOf/);
});
test('real Git URL rewrite configuration is rejected without transport',async()=>fixture(async f=>{
 const text=args=>git(f.work,args);git(f.work,['config','url.https://example.invalid/.insteadOf',f.remote]);
 assert.throws(()=>assertPublisherRouting(text,f.remote),/URL rewrite/);git(f.work,['config','--unset-all','url.https://example.invalid/.insteadOf']);
 git(f.work,['config','url.https://example.invalid/.pushInsteadOf','unused-prefix']);assert.throws(()=>assertPublisherRouting(text,f.remote),/pushInsteadOf/);assert.equal(f.tip(),f.base);
}));
test('existing attributes are retained unchanged without applying byte filters',async()=>fixture(async f=>{
 await writeFile(join(f.work,'.gitattributes'),'* text eol=lf\n');git(f.work,['add','.gitattributes']);git(f.work,['commit','-m','attributes']);git(f.work,['push',f.remote,'HEAD:refs/heads/gh-pages']);const base=git(f.work,['rev-parse','HEAD']);const before=git(f.remote,['rev-parse',base+':.gitattributes']);
 const result=await publishVerifiedAssets({...f,base,message:'preserve attributes'});assert.equal(git(f.remote,['rev-parse',result.commit+':.gitattributes']),before);
 const bytes=execFileSync('git',['--git-dir',f.remote,'show',result.commit+':assets/new.js'],{env});assert.equal(sha(bytes),f.assets['assets/new.js']);
 await f.put('.gitattributes','* filter=arbitrary');await assert.rejects(()=>publishVerifiedAssets({...f,base:result.commit,message:'forbidden attributes change'}),/Unsafe artifact path/);
}));
test('all four callers retain clean/source/hash gates and reject unknown arguments',async t=>{
 const paths=['scripts/deployReadpathRelease.mjs','scripts/publishMeatMasterEdit.mjs','scripts/publishMeatMasterFollowup.mjs','scripts/publishMovementSaving.mjs'];
 for(const path of paths)for(const scenario of ['success','dirty','source','hash','arguments'])await t.test(`${path} ${scenario}`,async()=>{
  const sourceCode=(await readFile(path,'utf8')).replace(/^import .*;\r?\n/gm,'');let calls=0,originReads=0;
  const manifest={source:'verified-source',flags:{},retained:{base:'a'.repeat(40),files:[]},assets:{'index.html':'a'}};
  const fn=new (Object.getPrototypeOf(async function(){}).constructor)('readFile','prepare','requireClean','source','buildRelease','assertArtifacts','artifacts','publishVerifiedAssets','verifiedOriginRemote','process','console',sourceCode);
  const current=()=>scenario==='hash'?{}:manifest.assets;
  const run=()=>fn(async()=>JSON.stringify(manifest),async()=>manifest,()=>{if(scenario==='dirty')throw Error('dirty');},()=>scenario==='source'?'changed':manifest.source,async()=>current(),(expected,actual)=>assert.deepEqual(actual,expected),async()=>current(),async options=>{calls++;assert.equal(options.base,manifest.retained.base);assert.equal(options.remote,'local-frozen-origin');return {commit:'b'.repeat(40)};},()=>{originReads++;return 'local-frozen-origin';},{argv:['node',path,...(scenario==='arguments'?['--typo']:[])]},{log:()=>{}});
  if(scenario==='success'){await run();assert.equal(calls,1);assert.equal(originReads,1);}else{await assert.rejects(run);assert.equal(calls,0);assert.equal(originReads,0);}
 });
 const deploy=await readFile(paths[0],'utf8');assert.ok(deploy.includes("if(process.argv.includes('--verify-only'))"));
});
