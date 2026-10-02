import { readFile, writeFile } from 'node:fs/promises';
import { sha } from './readpathRelease.mjs';
const manifest=JSON.parse(await readFile('output/readpath/release-manifest.json','utf8'));
const base='https://green-cloud-workroom.github.io/fant/';const results=[];const attempt=Date.now();
for(const [path,expected] of Object.entries(manifest.assets)) {
  const response=await fetch(base+path+'?verify='+manifest.source+'&attempt='+attempt,{cache:'no-store'});
  const actual=sha(Buffer.from(await response.arrayBuffer()));results.push({path,status:response.status,match:response.ok&&actual===expected});
}
await writeFile('output/readpath/live-verification.json',JSON.stringify({source:manifest.source,at:new Date().toISOString(),results},null,2));
console.log(`${results.filter(r=>r.match).length}/${results.length} live assets match ${manifest.source}`);
if(results.some(r=>!r.match)){console.error(results.filter(r=>!r.match));process.exitCode=1;}
