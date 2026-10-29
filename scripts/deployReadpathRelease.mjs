import {publishVerifiedAssets,verifiedOriginRemote} from './verifiedPagesPublisher.mjs';
import { readFile } from 'node:fs/promises';
import { prepare, requireClean, source, buildRelease, assertArtifacts } from './readpathRelease.mjs';
if(process.argv.slice(2).length>1||process.argv.slice(2).some(arg=>!['--prepare','--verify-only'].includes(arg)))throw Error('Unknown or conflicting release arguments');
if(process.argv.includes('--prepare')) {const manifest=await prepare();console.log('Prepared',manifest.source,Object.keys(manifest.assets).length,'files');}
else {
  requireClean();const manifest=JSON.parse(await readFile('output/readpath/release-manifest.json','utf8'));
  if(source()!==manifest.source)throw Error('Source changed after release preparation.');
  if(!manifest.retained?.base||!Array.isArray(manifest.retained.files))throw Error('Prepare a release with retained assets before deployment.');
  assertArtifacts(manifest.assets,await buildRelease(manifest.source,manifest.flags,manifest.retained.files));
  if(process.argv.includes('--verify-only'))console.log('Rebuilt asset hashes verified. No deployment.');
  else {
    await publishVerifiedAssets({remote:verifiedOriginRemote(),base:manifest.retained.base,dist:'dist',assets:manifest.assets,message:'Deploy readpath '+manifest.source});
  }
}
