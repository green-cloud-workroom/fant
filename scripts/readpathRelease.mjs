import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, relative } from 'node:path';
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const source = () => execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
export function requireClean() {
  const paths=execFileSync('git',['status','--porcelain','--untracked-files=all'],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
  if(paths.some(line=>!line.slice(3).startsWith('output/')))throw Error('Commit source changes before preparing or deploying a release.');
}
export function validateFlags(flags) {
  const keys=['VITE_PERF_SHELL','VITE_PERF_STORE','VITE_PERF_ROUTES','VITE_PRODUCTION_VIEW_MODE'];
  if(JSON.stringify(Object.keys(flags).sort())!==JSON.stringify(keys.sort()))throw Error('Release flags missing or unknown.');
  if(!['true','false'].includes(flags.VITE_PERF_SHELL)||!['true','false'].includes(flags.VITE_PERF_STORE)||!['legacy','session'].includes(flags.VITE_PRODUCTION_VIEW_MODE))throw Error('Unsupported release flags.');
  if(flags.VITE_PERF_ROUTES!==''&&flags.VITE_PERF_ROUTES!=='main')throw Error('Unverified route activation.');
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
export async function buildRelease(commit,flags) {
  validateFlags(flags);Object.assign(process.env,flags);
  const {build}=await import('vite');await build({build:{emptyOutDir:true}});
  const hashes=await artifacts();
  await writeFile('dist/release.json',JSON.stringify({schemaVersion:1,source:commit,flags,assets:hashes},null,2));
  return artifacts();
}
export async function prepare() {
  requireClean();const commit=source();const flags=JSON.parse(await readFile('readpath.release.json','utf8'));
  const hashes=await buildRelease(commit,flags);const manifest={source:commit,flags,assets:hashes};
  await mkdir('output/readpath',{recursive:true});await writeFile('output/readpath/release-manifest.json',JSON.stringify(manifest,null,2));return manifest;
}
