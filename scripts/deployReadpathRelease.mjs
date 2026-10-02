import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { prepare, requireClean, source, buildRelease, assertArtifacts } from './readpathRelease.mjs';
if(process.argv.includes('--prepare')) {const manifest=await prepare();console.log('Prepared',manifest.source,Object.keys(manifest.assets).length,'files');}
else {
  requireClean();const manifest=JSON.parse(await readFile('output/readpath/release-manifest.json','utf8'));
  if(source()!==manifest.source)throw Error('Source changed after release preparation.');
  if(!manifest.retained?.base||!Array.isArray(manifest.retained.files))throw Error('Prepare a release with retained assets before deployment.');
  assertArtifacts(manifest.assets,await buildRelease(manifest.source,manifest.flags,manifest.retained.files));
  if(process.argv.includes('--verify-only'))console.log('Rebuilt asset hashes verified. No deployment.');
  else {
    const remote=execFileSync('git',['ls-remote','origin','refs/heads/gh-pages'],{encoding:'utf8'}).trim().split(/\s+/)[0];
    if(remote!==manifest.retained.base)throw Error('Another deployment changed gh-pages; prepare again to preserve its assets.');
    const require=createRequire(import.meta.url);const bin=resolve(dirname(require.resolve('gh-pages/package.json')),'bin/gh-pages.js');
    execFileSync(process.execPath,[bin,'-d','dist','-m','Deploy readpath '+manifest.source],{stdio:'inherit'});
  }
}
