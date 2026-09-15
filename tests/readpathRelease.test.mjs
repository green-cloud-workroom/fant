import test from 'node:test';
import assert from 'node:assert/strict';
import { assertArtifacts, validateFlags, validateSummaryAcceptance, VERIFIED_ROUTES } from '../scripts/readpathRelease.mjs';
import { DASHBOARD_LOGIC_VERSION } from '../src/config/dashboardCompatibility.js';
import {selectRetainedAssets,restoreRetainedAssets} from '../scripts/releaseAssets.mjs';
import {isModuleLoadError} from '../src/utils/moduleLoadError.js';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('deploy keeps old lazy modules and rejects changed bytes or unsafe paths',async()=>{
  const a='a'.repeat(40),b='b'.repeat(40),line=(blob,path)=>`100644 blob ${blob}\t${path}`;
  const files=selectRetainedAssets([line(a,'assets/old.js'),line(a,'assets/old.js')+'\n'+line(b,'assets/new.js')]);
  assert.equal(files.length,2);
  assert.throws(()=>selectRetainedAssets([line(a,'../index.html')]));
  assert.throws(()=>selectRetainedAssets([line(a,'assets/old.js'),line(b,'assets/old.js')]));
  const dir=await mkdtemp(join(tmpdir(),'fant-assets-'));
  try{
    await mkdir(join(dir,'assets'));await writeFile(join(dir,'index.html'),'current entry');
    const readBlob=blob=>Buffer.from(blob===a?'export const old=true':'export const current=true');
    await restoreRetainedAssets(files,dir,readBlob);
    assert.equal(await readFile(join(dir,'assets/old.js'),'utf8'),'export const old=true');
    assert.equal(await readFile(join(dir,'index.html'),'utf8'),'current entry');
    await restoreRetainedAssets(files,dir,readBlob);
    await writeFile(join(dir,'assets/old.js'),'overwritten');
    await assert.rejects(()=>restoreRetainedAssets(files,dir,readBlob),/collision/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('module load failures require document reload; data failures retain in-page retry',()=>{
  for(const message of ['Failed to fetch dynamically imported module: https://example.invalid/old.js','Importing a module script failed.','Unable to preload CSS for /assets/old.css'])assert.equal(isModuleLoadError(new Error(message)),true);
  for(const message of ['permission-denied','서버 응답을 확인하지 못했습니다.'])assert.equal(isModuleLoadError(new Error(message)),false);
});
test('release refuses missing, extra or changed assets',()=>{
  assert.doesNotThrow(()=>assertArtifacts({a:'1',b:'2'},{b:'2',a:'1'}));
  for(const files of [{a:'1'},{a:'1',b:'2',c:'3'},{a:'changed',b:'2'}])assert.throws(()=>assertArtifacts({a:'1',b:'2'},files));
});
test('summary release requires fresh serving evidence for today with real matching hashes',()=>{
  const now=Date.parse('2026-09-14T07:00:00Z');
  const evidence={project:'fant-e5ae5',readModelMode:'serve',logicVersion:DASHBOARD_LOGIC_VERSION,verifiedAt:'2026-09-14T06:00:00Z',views:[{date:'2026-09-14',equal:true,generation:1,actualHash:'a'.repeat(64),expectedHash:'a'.repeat(64)}]};
  assert.equal(validateSummaryAcceptance(evidence,now),true);
  for(const change of [{views:[]},{readModelMode:'shadow'},{verifiedAt:'2026-09-12T06:00:00Z'},{logicVersion:'old'},{views:[{date:'2026-09-14',equal:true}]},{views:[{...evidence.views[0],date:'2026-09-13'}]}])assert.equal(validateSummaryAcceptance({...evidence,...change},now),false);
});
test('release refuses missing flags and unverified routes or summary activation',()=>{
  const flags={VITE_PERF_SHELL:'true',VITE_PERF_STORE:'true',VITE_PERF_ROUTES:'main',VITE_PRODUCTION_VIEW_MODE:'session'};
  validateFlags(flags);validateFlags({...flags,VITE_PERF_ROUTES:VERIFIED_ROUTES.join(',')});assert.throws(()=>validateFlags({}));assert.throws(()=>validateFlags({...flags,VITE_PERF_ROUTES:'main,unknown'}));assert.throws(()=>validateFlags({...flags,VITE_PERF_ROUTES:'main,main'}));assert.throws(()=>validateFlags({...flags,VITE_PRODUCTION_VIEW_MODE:'summary'}));
});
