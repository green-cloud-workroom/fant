import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';

const safePath=path=>/^assets\/[A-Za-z0-9_.-]+$/.test(path);
export function selectRetainedAssets(trees){
  const files=new Map();
  for(const tree of trees)for(const line of tree.split('\n').filter(Boolean)){
    const match=/^100644 blob ([a-f0-9]{40})\t(.+)$/.exec(line);
    if(!match||!safePath(match[2]))throw Error('Invalid retained asset entry');
    const [,blob,path]=match;
    if(files.has(path)&&files.get(path).blob!==blob)throw Error('Immutable asset collision: '+path);
    files.set(path,{path,blob});
  }
  return [...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
}
export function captureRetainedAssets(){
  execFileSync('git',['fetch','origin','gh-pages'],{stdio:'pipe'});
  const refs=execFileSync('git',['rev-list','--max-count=7','origin/gh-pages'],{encoding:'utf8'}).trim().split('\n');
  const files=selectRetainedAssets(refs.map(ref=>execFileSync('git',['ls-tree','-r',ref,'--','assets'],{encoding:'utf8',maxBuffer:8*1024*1024})));
  return {base:refs[0],files};
}
export async function restoreRetainedAssets(files,dir='dist',readBlob=blob=>execFileSync('git',['cat-file','blob',blob],{maxBuffer:16*1024*1024})){
  let bytes=0;
  for(const {path,blob} of files){
    if(!safePath(path)||!/^[a-f0-9]{40}$/.test(blob))throw Error('Invalid retained asset');
    const data=await readBlob(blob);bytes+=data.length;
    if(bytes>100*1024*1024)throw Error('Retained assets exceed 100 MiB; review retention before publishing');
    const target=resolve(dir,path);
    let current;
    try{current=await readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;}
    if(current){if(!current.equals(data))throw Error('Immutable asset collision: '+path);continue;}
    await mkdir(dirname(target),{recursive:true});await writeFile(target,data);
  }
}
