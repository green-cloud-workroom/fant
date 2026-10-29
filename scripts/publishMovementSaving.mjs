import {publishVerifiedAssets,verifiedOriginRemote} from './verifiedPagesPublisher.mjs';
// Historical fallback, now using the common exact-base additive publisher.
// Publish the exact previously built manifest additively; never remove assets.
import {readFile} from 'node:fs/promises';
import {requireClean,source,assertArtifacts,artifacts} from './readpathRelease.mjs';
if(process.argv.length>2)throw Error('Unexpected publisher arguments');
requireClean();
const manifest=JSON.parse(await readFile('output/readpath/release-manifest.json','utf8'));
if(source()!==manifest.source)throw Error('Source changed since verified build');
assertArtifacts(manifest.assets,await artifacts());
const publication=await publishVerifiedAssets({remote:verifiedOriginRemote(),base:manifest.retained.base,dist:'dist',assets:manifest.assets,message:'Deploy readpath '+manifest.source});
console.log(JSON.stringify({source:manifest.source,...publication},null,2));
