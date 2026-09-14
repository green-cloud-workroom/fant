import test from 'node:test';
import assert from 'node:assert/strict';
import { assertArtifacts, validateFlags } from '../scripts/readpathRelease.mjs';
test('release refuses missing, extra or changed assets',()=>{
  assert.doesNotThrow(()=>assertArtifacts({a:'1',b:'2'},{b:'2',a:'1'}));
  for(const files of [{a:'1'},{a:'1',b:'2',c:'3'},{a:'changed',b:'2'}])assert.throws(()=>assertArtifacts({a:'1',b:'2'},files));
});
test('release refuses missing flags and unverified routes or summary activation',()=>{
  const flags={VITE_PERF_SHELL:'true',VITE_PERF_STORE:'true',VITE_PERF_ROUTES:'main',VITE_PRODUCTION_VIEW_MODE:'session'};
  validateFlags(flags);assert.throws(()=>validateFlags({}));assert.throws(()=>validateFlags({...flags,VITE_PERF_ROUTES:'main,meat'}));assert.throws(()=>validateFlags({...flags,VITE_PRODUCTION_VIEW_MODE:'summary'}));
});
