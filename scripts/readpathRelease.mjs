import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, relative } from 'node:path';
import { DASHBOARD_LOGIC_VERSION } from '../src/config/dashboardCompatibility.js';
import { captureRetainedAssets, restoreRetainedAssets } from './releaseAssets.mjs';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const source = () => execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
export const VERIFIED_ROUTES=['main','recipe','settings','production','bag','equipment','supplement','schedule','egg','frozenProduct','frozenPan','freezeOp','frozenSep','meat','stats'];
export function requireClean() {
  const paths=execFileSync('git',['status','--porcelain','-z','--untracked-files=all'],{encoding:'utf8'}).split('\0').filter(Boolean);
  if(paths.some(line=>!line.slice(3).startsWith('output/')))throw Error('Commit source changes before preparing or deploying a release.');
}
export function validateFlags(flags,{summaryVerified=false}={}) {
  const keys=['VITE_PERF_SHELL','VITE_PERF_STORE','VITE_PERF_ROUTES','VITE_PRODUCTION_VIEW_MODE'];
  if(JSON.stringify(Object.keys(flags).sort())!==JSON.stringify(keys.sort()))throw Error('Release flags missing or unknown.');
  if(!['true','false'].includes(flags.VITE_PERF_SHELL)||!['true','false'].includes(flags.VITE_PERF_STORE)||!['legacy','session','summary'].includes(flags.VITE_PRODUCTION_VIEW_MODE))throw Error('Unsupported release flags.');
  if(flags.VITE_PRODUCTION_VIEW_MODE==='summary'&&!summaryVerified)throw Error('Summary was not independently verified.');
  const routes=flags.VITE_PERF_ROUTES?flags.VITE_PERF_ROUTES.split(','):[];
  if(new Set(routes).size!==routes.length||routes.some(route=>!VERIFIED_ROUTES.includes(route)))throw Error('Unverified route activation.');
}
export function validateSummaryAcceptance(acceptance,now=Date.now()) {
  const verifiedAt=Date.parse(acceptance?.verifiedAt),hash=/^[a-f0-9]{64}$/;
  const today=new Date(now+9*3600000).toISOString().slice(0,10);
  return acceptance?.project==='fant-e5ae5'&&acceptance.readModelMode==='serve'&&acceptance.logicVersion===DASHBOARD_LOGIC_VERSION&&
    Number.isFinite(verifiedAt)&&verifiedAt<=now&&now-verifiedAt<86400000&&
    Array.isArray(acceptance.views)&&acceptance.views.length>0&&acceptance.views.some(view=>view.date===today)&&
    acceptance.views.every(view=>view.equal===true&&hash.test(view.actualHash)&&view.actualHash===view.expectedHash&&Number.isSafeInteger(view.generation)&&view.generation>0);
}
export async function artifacts(dir='dist') {
  const result={};
  async function walk(path) {for(const entry of (await readdir(path,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    const child=resolve(path,entry.name);if(entry.isDirectory())await walk(child);else result[relative(resolve(dir),child).replaceAll('\\','/')]=sha(await readFile(child));
  }}
  await walk(resolve(dir));return result;
}
export function assertArtifacts(expected,actual) {
  if(JSON.stringify(Object.entries(expected).sort())!==JSON.stringify(Object.entries(actual).sort()))throw Error('Asset hashes or file list differ; deployment stopped.');
}
export async function buildRelease(commit,flags,retainedAssets=[]) {
  let summaryVerified=false;
  if(flags.VITE_PRODUCTION_VIEW_MODE==='summary'){
    const acceptance=JSON.parse(await readFile('readpath.summary-acceptance.json','utf8'));
    summaryVerified=validateSummaryAcceptance(acceptance);
  }
  validateFlags(flags,{summaryVerified});Object.assign(process.env,flags);
  const {build}=await import('vite');await build({build:{emptyOutDir:true}});
  // Public SVGs are copied verbatim by Vite. Normalize Windows checkout line
  // endings before hashing so GitHub Pages' Git text normalization cannot
  // change the verified bytes during publication.
  for(const path of Object.keys(await artifacts()))if(path.endsWith('.svg')){
    const file=resolve('dist',path),text=await readFile(file,'utf8');
    if(text.includes('\r\n'))await writeFile(file,text.replaceAll('\r\n','\n'));
  }
  await restoreRetainedAssets(retainedAssets);
  const hashes=await artifacts();
  await writeFile('dist/release.json',JSON.stringify({schemaVersion:1,source:commit,flags,assets:hashes},null,2));
  return artifacts();
}
export async function prepare() {
  requireClean();const commit=source();const flags=JSON.parse(await readFile('readpath.release.json','utf8'));
  const retained=captureRetainedAssets();
  const hashes=await buildRelease(commit,flags,retained.files);const manifest={source:commit,flags,retained,assets:hashes};
  await mkdir('output/readpath',{recursive:true});await writeFile('output/readpath/release-manifest.json',JSON.stringify(manifest,null,2));return manifest;
}
