// Additive, exact-base publication. Importing this module never publishes.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {readdir,readFile,writeFile,rename,mkdir,lstat,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join,dirname,basename,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';

const ref='refs/heads/gh-pages',oid=/^[a-f0-9]{40}$/;
const digest=b=>createHash('sha256').update(b).digest('hex');
export function publisherGitEnvironment(protocol,inherited=process.env){
  const env={...inherited};for(const k of Object.keys(env))if(k.startsWith('GIT_'))delete env[k];
  if(protocol!=='file')for(const k of ['GIT_ASKPASS','GIT_SSH','GIT_SSH_COMMAND','GIT_SSH_VARIANT','GIT_SSL_CAINFO','GIT_SSL_CAPATH'])if(inherited[k])env[k]=inherited[k];
  Object.assign(env,{GIT_ALLOW_PROTOCOL:protocol,GIT_TERMINAL_PROMPT:'0',GIT_AUTHOR_NAME:'Fant verified release',GIT_AUTHOR_EMAIL:'release@localhost',GIT_COMMITTER_NAME:'Fant verified release',GIT_COMMITTER_EMAIL:'release@localhost'});
  if(protocol==='file'){env.GIT_CONFIG_NOSYSTEM='1';env.GIT_CONFIG_GLOBAL=process.platform==='win32'?'NUL':'/dev/null';}
  return env;
}
export function assertPublisherRouting(text,remote){
  assert.equal(text(['ls-remote','--get-url',remote]),remote,'Git URL rewrite detected');
  let rewrites='';try{rewrites=text(['config','--get-regexp','^url\\..*\\.pushinsteadof$']);}catch(error){if(error.status!==1)throw error;}
  assert.equal(rewrites,'','Git pushInsteadOf rewrite is not supported');
}
export function safePublishPath(path,{inherited=false}={}){
  return typeof path==='string'&&path.length<240&&path.split('/').every(p=>
    /^[A-Za-z0-9_.-]+$/.test(p)&&!['.','..','.git','.gitmodules',...(!inherited?['.gitattributes']:[])].includes(p.toLowerCase())&&
    !/[. ]$/.test(p)&&! /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p));
}
function transport(remote){
  assert.equal(typeof remote,'string');assert.ok(remote&&!/[\r\n\0]/.test(remote));
  if(isAbsolute(remote)){assert.ok(!/^[\\/]{2}/.test(remote),'UNC/network path is not a local rehearsal remote');return 'file';}
  if(remote.startsWith('https://')){const u=new URL(remote);assert.ok(!u.username&&!u.password);return 'https';}
  if(/^git@[A-Za-z0-9.-]+:[A-Za-z0-9_./-]+$/.test(remote))return 'ssh';
  throw Error('Explicit local path, HTTPS or git@ SSH remote required');
}
export function verifiedOriginRemote(cwd=process.cwd()){
  const read=args=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim().split(/\r?\n/);
  const fetch=read(['remote','get-url','--all','origin']),push=read(['remote','get-url','--push','--all','origin']);
  assert.ok(fetch.length===1&&push.length===1&&fetch[0]===push[0],'Origin fetch/push URLs differ or are multiple');
  transport(fetch[0]);return fetch[0];
}
export async function publishVerifiedAssets({remote,base,dist='dist',assets,message,receiptDir='output/readpath/publications',rehearsalHooks={}}){
  const protocol=transport(remote);assert.match(base,oid);assert.equal(typeof message,'string');
  assert.ok(message.length>0&&message.length<500&&!message.includes('\0'));
  assert.ok(protocol==='file'||Object.keys(rehearsalHooks).length===0,'Rehearsal hooks require local transport');
  const names=Object.keys(assets||{}).sort();assert.ok(names.length>0&&names.length<=10000,'Invalid artifact count');
  assert.ok(names.includes('index.html')&&names.includes('release.json'),'Release entry/metadata required');
  const folded=new Set();for(const p of names){assert.ok(safePublishPath(p),`Unsafe artifact path: ${p}`);assert.match(assets[p],/^[a-f0-9]{64}$/);assert.ok(!folded.has(p.toLowerCase()),'Case-fold artifact collision');folded.add(p.toLowerCase());}
  const root=resolve(dist);assert.ok(!(await lstat(root)).isSymbolicLink(),'Symlink dist');
  const actual=[];let size=0;
  async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name),stat=await lstat(path);assert.ok(!stat.isSymbolicLink(),'Symlink artifact');
    if(stat.isDirectory())await walk(path);else{assert.ok(stat.isFile(),'Non-file artifact');const name=path.slice(root.length+1).replaceAll('\\','/');assert.ok(safePublishPath(name),'Unsafe dist path');actual.push(name);size+=stat.size;assert.ok(size<=100*1024*1024,'Artifact byte limit');assert.equal(digest(await readFile(path)),assets[name],`Artifact hash mismatch: ${name}`);}
  }}
  await walk(root);assert.deepEqual(actual.sort(),names,'Artifact file list differs');
  const temp=await mkdtemp(join(tmpdir(),'fant-pages-publish-'));
  const env=publisherGitEnvironment(protocol);
  const git=(args,input)=>execFileSync('git',['-c','commit.gpgSign=false','-c','core.hooksPath='+join(temp,'no-hooks'),...args],{cwd:temp,env,input,encoding:null,timeout:120000,maxBuffer:128*1024*1024,stdio:['pipe','pipe','pipe']});
  const text=(args,input)=>git(args,input).toString('utf8').trim();
  const tip=()=>{const lines=text(['ls-remote',remote,ref]).split(/\r?\n/);assert.equal(lines.length,1,'Remote branch missing/ambiguous');const [sha,name]=lines[0].split(/\s+/);assert.equal(name,ref);assert.match(sha,oid);return sha;};
  try{
    git(['init','--template=']);assertPublisherRouting(text,remote);assert.equal(tip(),base,'Remote baseline changed');
    git(['fetch','--depth=1','--no-tags',remote,ref]);assert.equal(text(['rev-parse','FETCH_HEAD']),base,'Fetched baseline changed');
    let retainedBytes=0;
    const previous=new Map();for(const entry of git(['ls-tree','-r','-l','-z',base]).toString('utf8').split('\0').filter(Boolean)){
      const m=/^(100644|100755) blob ([a-f0-9]{40}) +(\d+)\t(.+)$/.exec(entry);assert.ok(m,'Unsupported remote tree entry');
      const bytes=Number(m[3]);assert.ok(Number.isSafeInteger(bytes)&&bytes>=0);retainedBytes+=bytes;
      assert.ok(safePublishPath(m[4],{inherited:true}),'Unsafe remote tree path');assert.ok(!previous.has(m[4].toLowerCase()),'Remote case-fold collision');previous.set(m[4].toLowerCase(),{path:m[4],blob:m[2],bytes,mode:m[1]});
    }
    assert.ok(previous.size+names.filter(p=>!previous.has(p.toLowerCase())).length<=10000,'Combined artifact count limit');
    const prefixes=new Map();
    for(const p of [...previous.values()].map(v=>v.path).concat(names)){
      const parts=p.split('/');for(let n=1;n<=parts.length;n++){const prefix=parts.slice(0,n).join('/'),fold=prefix.toLowerCase();assert.ok(!prefixes.has(fold)||prefixes.get(fold)===prefix,'Case-fold path prefix collision');prefixes.set(fold,prefix);}
      const old=previous.get(p.toLowerCase());assert.ok(!old||old.path===p,'Remote case-fold artifact collision');
    }
    await rehearsalHooks.beforeObjectRead?.();
    const paths=names.map(p=>JSON.stringify(resolve(root,p).replaceAll('\\','/'))).join('\n')+'\n';
    const blobs=text(['hash-object','-w','--no-filters','--stdin-paths'],paths).split(/\r?\n/);assert.equal(blobs.length,names.length);blobs.forEach(b=>assert.match(b,oid));
    const data=git(['cat-file','--batch'],blobs.join('\n')+'\n');let offset=0,storedBytes=0,combinedBytes=retainedBytes;
    for(let i=0;i<names.length;i++){
      const end=data.indexOf(10,offset);assert.ok(end>=offset);const [blob,type,bytes]=data.subarray(offset,end).toString().split(' ');assert.equal(blob,blobs[i]);assert.equal(type,'blob');const n=Number(bytes);assert.ok(Number.isSafeInteger(n)&&n>=0&&n<=100*1024*1024);offset=end+1;const contents=data.subarray(offset,offset+n);assert.equal(contents.length,n);assert.equal(digest(contents),assets[names[i]],'Stored artifact hash differs');offset+=n;assert.equal(data[offset++],10);
      storedBytes+=n;combinedBytes+=n-(previous.get(names[i].toLowerCase())?.bytes||0);assert.ok(storedBytes<=100*1024*1024,'Stored artifact byte limit');
      const old=previous.get(names[i].toLowerCase());if(old&&names[i].startsWith('assets/'))assert.equal(old.blob,blobs[i],'Immutable asset collision');
    }
    assert.ok(combinedBytes<=100*1024*1024,'Combined artifact byte limit');size=storedBytes;
    assert.equal(offset,data.length);git(['read-tree',base]);
    git(['update-index','-z','--index-info'],names.map((p,i)=>`100644 ${blobs[i]}\t${p}\0`).join(''));
    const tree=text(['write-tree']),candidate=new Map();
    for(const entry of git(['ls-tree','-r','-z',tree]).toString('utf8').split('\0').filter(Boolean)){
      const m=/^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/.exec(entry);assert.ok(m,'Invalid candidate entry');candidate.set(m[3],{mode:m[1],blob:m[2]});
    }
    const expected=new Map([...previous.values()].map(v=>[v.path,{mode:v.mode,blob:v.blob}]));names.forEach((p,i)=>expected.set(p,{mode:'100644',blob:blobs[i]}));
    assert.equal(candidate.size,expected.size,'Non-additive candidate tree: file count');for(const [p,v]of expected)assert.deepEqual(candidate.get(p),v,`Non-additive candidate tree: ${p}`);
    const commit=text(['commit-tree',tree,'-p',base],message+'\n');assert.match(commit,oid);assert.equal(text(['rev-parse',commit+'^']),base);
    await mkdir(resolve(receiptDir),{recursive:true});const receiptFile=join(resolve(receiptDir),randomUUID()+'.json');
    const receipt={base,commit,remote,verifiedFiles:names.length,bytes:size,message,assets,phase:'candidate-verified',createdAt:new Date().toISOString()};
    const record=async()=>{receipt.updatedAt=new Date().toISOString();await writeFile(receiptFile+'.tmp',JSON.stringify(receipt,null,2));await rename(receiptFile+'.tmp',receiptFile);};
    await record();
    try{
      assertPublisherRouting(text,remote);assert.equal(tip(),base,'Remote changed before push');await rehearsalHooks.beforePush?.({commit,base,receiptFile});
      receipt.phase='push-requesting';await record();
      // Explicit expected SHA is essential: background fetch cannot loosen this lease.
      git(['push','--porcelain',`--force-with-lease=${ref}:${base}`,remote,`${commit}:${ref}`]);
      await rehearsalHooks.afterPush?.({commit,base,receiptFile});
      const observed=tip();receipt.observed=observed;assert.equal(observed,commit,'Push outcome superseded/unknown; inspect remote, do not auto-retry');
      receipt.phase='confirmed';await record();
      return {base,commit,observed,receiptFile,verifiedFiles:names.length,bytes:size,mode:'additive exact-base lease',retainedPreviousFiles:previous.size};
    }catch(error){
      receipt.phase='failed-or-unknown';receipt.error=error.message;
      try{receipt.observed=tip();}catch{receipt.observed=null;}
      try{await record();}catch{ /* Candidate receipt already exists; never retry publication. */ }
      throw error;
    }
  }finally{
    assert.equal(dirname(resolve(temp)),resolve(tmpdir()));assert.ok(basename(temp).startsWith('fant-pages-publish-'));assert.ok(!(await lstat(temp)).isSymbolicLink());await rm(temp,{recursive:true,force:true});
  }
}
