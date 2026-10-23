// Isolated source package: only the two statistics handlers, no other shared functions.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const dir=resolve('output/stats-confirm-backend'), source=resolve('../fantapet-inventory/functions');
await mkdir(resolve(dir,'functions/src'),{recursive:true});
const pkg=JSON.parse(await readFile(resolve(source,'package.json'),'utf8'));
await writeFile(resolve(dir,'functions/package.json'),JSON.stringify({name:'production-stats-confirm-only',private:true,type:'module',main:'lib/index.js',engines:{node:'22'},dependencies:{'firebase-admin':pkg.dependencies['firebase-admin'],'firebase-functions':pkg.dependencies['firebase-functions']}},null,2));
await copyFile(resolve(source,'tsconfig.json'),resolve(dir,'functions/tsconfig.json'));
await copyFile(resolve('integrations/productionStats/server.ts'),resolve(dir,'functions/src/server.ts'));
for(const file of ['statsAutomation','statsLogic','incomingCorrections','statsCorrections','manualMovementLogic']) {
  await writeFile(resolve(dir,'functions/src/'+file+'.ts'),'// @ts-nocheck\n'+await readFile('src/services/'+file+'.js','utf8'));
}
await writeFile(resolve(dir,'functions/src/index.ts'),"import { initializeApp } from 'firebase-admin/app';\ninitializeApp();\nexport { productionStatsShadowDaily, onProductionStatsAdjustmentCreated } from './server.js';\n");
await writeFile(resolve(dir,'firebase.json'),JSON.stringify({functions:[{source:'functions',codebase:'default',runtime:'nodejs22',ignore:['node_modules','.git','src','tsconfig.json','*.log']}]},null,2));
const enabled=process.argv.includes('--confirm-delivery-enabled');
await writeFile(resolve(dir,'functions/.env.fant-e5ae5'),'PRODUCTION_STATS_CONFIRM_DELIVERY='+(enabled?'enabled':'disabled')+'\n');
try { await readFile(resolve(dir,'functions/node_modules/typescript/package.json')); } catch { execFileSync('cmd.exe',['/d','/c','mklink','/J',resolve(dir,'functions/node_modules'),resolve(source,'node_modules')],{stdio:'pipe'}); }
execFileSync(process.execPath,[resolve(source,'node_modules/typescript/bin/tsc'),'-p',resolve(dir,'functions/tsconfig.json')],{stdio:'inherit'});
// SDK-supported manifest generation avoids an unreliable Windows discovery server.
execFileSync(process.execPath,[resolve(source,'node_modules/firebase-functions/lib/bin/firebase-functions.js')],{
  cwd:resolve(dir,'functions'),env:{...process.env,FUNCTIONS_MANIFEST_OUTPUT_PATH:resolve(dir,'functions/functions.yaml')},stdio:'inherit'});
const manifest=JSON.parse(await readFile(resolve(dir,'functions/functions.yaml'),'utf8'));
if(JSON.stringify(Object.keys(manifest.endpoints).sort())!==JSON.stringify(['productionStatsShadowDaily','onProductionStatsAdjustmentCreated'].sort()))throw Error('Unexpected deployable handlers');
console.log('Built isolated confirm-only backend. Server release environment: '+(enabled?'enabled':'disabled')+'. Admin control is separately required. No deployment performed.');
