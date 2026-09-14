import test from 'node:test';
import assert from 'node:assert/strict';
import { assertArtifacts, validateFlags, validateSummaryAcceptance, VERIFIED_ROUTES } from '../scripts/readpathRelease.mjs';
import { DASHBOARD_LOGIC_VERSION } from '../src/config/dashboardCompatibility.js';
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
