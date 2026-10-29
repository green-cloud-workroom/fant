import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {readLegacyMaintenanceTarget,assertLegacyProjectBinding} from '../scripts/legacyMaintenanceReadOnly.mjs';
import {PRESERVE_COLLECTIONS,WIPE_COLLECTIONS,firebaseConfig,parseArgs} from '../scripts/firestoreConfig.mjs';
const run=promisify(execFile),tools=['wipeFirestoreOperationalData','wipeFirestoreOperationalDataAdmin','seedCleanup','seedDataInput'];
const target=['--project','demo-safety-test','--database','(default)'];

test('legacy target parser requires explicit identities and accepts only inspection',()=>{
 for(const tool of tools){
  assert.throws(()=>readLegacyMaintenanceTarget([],tool),{code:'LEGACY_TARGET_REQUIRED'});
  for(const args of [['--execute'],[...target,'--execute'],['--execute=false'],[...target,'--dry-run','--execute']])assert.throws(()=>readLegacyMaintenanceTarget(args,tool),{code:'LEGACY_WRITES_RETIRED'});
  const parsed=readLegacyMaintenanceTarget(target,tool);assert.equal(parsed.target.projectId,'demo-safety-test');assert.equal(parsed.target.databaseId,'(default)');assert.equal(parsed.target.mode,'dry-run');assert.equal(parsed.args.has('execute'),false);
  const equals=readLegacyMaintenanceTarget(['--project=demo-safety-test','--database=(default)','--dry-run'],tool);assert.deepEqual(equals.target,parsed.target);
  assert.deepEqual(readLegacyMaintenanceTarget(['--help'],tool),{help:true});
 }
});
test('ambiguous or unsupported arguments never select a hidden default',()=>{
 for(const args of [
  ['--project','demo-safety-test'],['--database','(default)'],
  [...target,'--project','fant-e5ae5'],[...target,'--database','backup-db'],[...target,'--dry-run=true'],[...target,'--dry-run','false'],
  ['--project','177376833232','--database','(default)'],['--project','projects/fant-e5ae5','--database','(default)'],['--project','FANT-e5ae5','--database','(default)'],['--project','demo-safety-test\n','--database','(default)'],[...target,'--dry-run\n'],['--project','demo-safety-test','--database','recovery-check'],['--project=','--database=(default)'],['--help',...target],
 ])assert.throws(()=>readLegacyMaintenanceTarget(args,'seedCleanup'));
 const p=readLegacyMaintenanceTarget(target,'seedCleanup');assert.throws(()=>assertLegacyProjectBinding(p.target,'fant-e5ae5'),{code:'LEGACY_PROJECT_MISMATCH'});assert.doesNotThrow(()=>assertLegacyProjectBinding(p.target,'demo-safety-test'));
});

// Actual CLI bootstraps, no test rewrites. Even configured environment credentials
// and a key path must not be touched for rejected commands.
test('all four direct CLI entrypoints reject old and ambiguous commands before key/network I/O',async()=>{
 await mkdir('output/maintenance-seal-20261027',{recursive:true});const temp=await mkdtemp(resolve('output/maintenance-seal-20261027/cli-'));
 assert.equal(dirname(temp),resolve('output/maintenance-seal-20261027'));
 const startedAt=new Date().toISOString(),sourceHashes={};
 for(const file of [...tools.map(t=>'scripts/'+t+'.mjs'),'scripts/legacyMaintenanceReadOnly.mjs'])sourceHashes[file]=createHash('sha256').update(await readFile(file)).digest('hex');
 const results=[];
 try {
  for(const tool of tools)for(const args of [[],['--execute'],[...target,'--execute'],['--project','fant-e5ae5','--database','(default)','--execute=false'],[...target,'--project','fant-e5ae5'],['--project','177376833232','--database','(default)'],['--project','demo-safety-test','--database','recovery-check'],[...target,'--dry-run=true'],['--help']]) {
   const out=resolve(temp,results.length+'.json'),key=resolve(temp,'DO_NOT_READ_KEY.json');let code=0,stdout='',stderr='';
   try{({stdout,stderr}=await run(process.execPath,['--import',pathToFileURL(resolve('tests/helpers/legacyNetworkTrap.mjs')).href,resolve('scripts/'+tool+'.mjs'),...args],{env:{...process.env,GOOGLE_CLOUD_PROJECT:'fant-e5ae5',GCLOUD_PROJECT:'fant-e5ae5',FANT_ADMIN_KEY_PATH:key,GOOGLE_APPLICATION_CREDENTIALS:key,FANT_FIREBASE_EMAIL:'fixture@example.invalid',FANT_FIREBASE_PASSWORD:'fixture-only',MAINTENANCE_TRAP_RESULT:out,MAINTENANCE_TRAP_KEY:key},timeout:15000,maxBuffer:1024*1024}));}
   catch(error){code=error.code;stdout=error.stdout||'';stderr=error.stderr||'';}
   assert.equal(typeof code,'number',tool+': child timed out or failed to spawn');
   assert.equal(code,args[0]==='--help'?0:1,tool+': '+stderr);
   const trap=JSON.parse(await readFile(out,'utf8'));assert.deepEqual(trap,{networkAttempts:0,keyReads:0,bootstrapComplete:true},tool+': '+args.join(' '));
   if(args[0]!=='--help')assert.match(stderr,/LEGACY_[A-Z_]+/);else assert.match(stdout,/read-only inspection/);
   if(args.includes('--execute')||args.includes('--execute=false'))assert.match(stderr,/LEGACY_WRITES_RETIRED/);
   results.push({tool,args,exitCode:code,...trap});
  }
  for(const [file,hash]of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(await readFile(file)).digest('hex'),hash,'Source changed during CLI proof');
  await writeFile('output/maintenance-seal-20261027/cli-result.json',JSON.stringify({startedAt,checkedAt:new Date().toISOString(),passed:true,sourceHashes,scenarios:results},null,2));
 }finally{await rm(temp,{recursive:true,force:true});}
});

async function runInspector(tool,{project='demo-safety-test',keyProject,configuredProject=project,argv,restStatus=200,failRead=false,baseline=false}={}) {
 const seen={reads:[],writes:0,keyReads:0,authCalls:0,initializations:[],firestores:[],requests:[],logs:[]};
 const rows={recipes:[{id:'yEhV7xTxX8giuDtSnFmQ',name:'치킨',unitPresets:[60,100],productionMethods:[{methodKey:'rotary',label:'rotary'}]},...['치킨텐더','고양이 주식치킨캣','고양이 주식 덕캣'].map((name,i)=>({id:'fd'+i,name,category:'freezeDry',unitPresets:[]}))],productions:[{id:'p1',status:'deleted'}],settings:[{id:'systemValues'}],supplementTypes:[],supplementStock:[],activityLogs:[]};
 const mutate=()=>{seen.writes++;throw Error('Unexpected write');};
 const makeDoc=path=>({id:path.split('/').at(-1),path,parent:{id:path.split('/').at(-2)},collection:name=>makeCollection(path+'/'+name),get:async()=>{seen.reads.push(path);const parts=path.split('/'),id=parts.pop(),row=(rows[parts.join('/')]||[]).find(r=>r.id===id);return {exists:!!row,data:()=>row};},listCollections:async()=>[],set:mutate,update:mutate,delete:mutate});
 const makeCollection=path=>({id:path.split('/').at(-1),path,doc:id=>makeDoc(path+'/'+id),where(){return this;},get:async()=>{seen.reads.push(path);if(failRead)throw Error('fixture read failed');return {docs:(rows[path]||[]).map(r=>({id:r.id,ref:makeDoc(path+'/'+r.id),data:()=>r}))};}});
 const db={collection:makeCollection,batch:mutate,recursiveDelete:mutate};
 const mainArgs=argv||['--project',project,'--database','(default)',...(keyProject && tool!=='wipeFirestoreOperationalData'?['--key','fixture-key.json']:[])];
 const context=vm.createContext({Buffer,URL,URLSearchParams,Map,Set,setTimeout:fn=>fn(),console:{log:(...a)=>seen.logs.push(a.join(' ')),error:(...a)=>seen.logs.push(a.join(' '))},fetch:async(url,options={})=>{url=String(url);seen.requests.push({url,method:options.method||'GET'});if(url==='https://oauth2.googleapis.com/token'){seen.authCalls++;return {ok:true,json:async()=>({access_token:'fake-token'})};}if((options.method||'GET')!=='GET')mutate();assert.ok(url.startsWith(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/`));return {ok:restStatus===200,status:restStatus,json:async()=>({documents:[{name:`projects/${project}/databases/(default)/documents/fixture/doc`}]})};}});
 context.process={argv:['node','inspector',...mainArgs],env:{GOOGLE_CLOUD_PROJECT:'fant-e5ae5',GCLOUD_PROJECT:'fant-e5ae5'}};
 const synthetic=(name,exports)=>new vm.SyntheticModule(Object.keys(exports),function(){for(const[k,v]of Object.entries(exports))this.setExport(k,v);},{context,identifier:name});
 const deps=new Map();deps.set('node:process',synthetic('node:process',{default:{argv:['node','inspector',...mainArgs],env:{GOOGLE_CLOUD_PROJECT:'fant-e5ae5',GCLOUD_PROJECT:'fant-e5ae5'},exit(){throw Error('Unexpected process exit');}}}));
 deps.set('node:fs/promises',synthetic('node:fs/promises',{default:{readFile:async()=>{seen.keyReads++;return JSON.stringify({project_id:keyProject||project,client_email:'fixture@example.invalid',private_key:'fake-key'});}}}));
 deps.set('node:crypto',synthetic('node:crypto',{default:{createSign:()=>({update(){return this;},sign:()=>Buffer.from('fixture')})}}));
 let defaultApp;
 deps.set('firebase-admin/app',synthetic('firebase-admin/app',{applicationDefault:()=>{seen.authCalls++;return {};},cert:()=>{seen.authCalls++;return {};},initializeApp:options=>{seen.initializations.push(options.projectId);return defaultApp={options};}}));
 deps.set('firebase-admin/firestore',synthetic('firebase-admin/firestore',{getFirestore:(app=defaultApp)=>{seen.firestores.push(app.options.projectId);return db;},FieldValue:{serverTimestamp:()=>({fixtureTimestamp:true})}}));
 deps.set('firebase/firestore',synthetic('firebase/firestore',{writeBatch:mutate}));
 deps.set('config',synthetic('config',{parseArgs,firebaseConfig:{...firebaseConfig,projectId:configuredProject},PRESERVE_COLLECTIONS,WIPE_COLLECTIONS,initAuthedFirestore:async args=>{seen.authCalls++;seen.initializations.push(configuredProject);assert.equal(args.get('project'),configuredProject);return db;},readCollection:async(_,name)=>{seen.reads.push(name);if(failRead)throw Error('fixture read failed');return (rows[name]||[]).map(r=>({id:r.id,data:()=>r}));}}));
 const guard=new vm.SourceTextModule(await readFile('scripts/legacyMaintenanceReadOnly.mjs','utf8'),{context,identifier:'guard'});
 await guard.link(()=>{throw Error('Guard must remain pure');});
 let source=await readFile(baseline?'tests/fixtures/legacy-maintenance-before/'+tool+'.source.txt':'scripts/'+tool+'.mjs','utf8');
 if(baseline){const manifest=JSON.parse(await readFile('tests/fixtures/legacy-maintenance-before/manifest.json','utf8'));assert.equal(createHash('sha256').update(source.replaceAll('\r\n','\n')).digest('hex'),manifest.files[tool],'Historical source changed');}
 const start=source.lastIndexOf('\nmain()');assert.ok(start>=0);source=source.slice(0,start)+'\nexport { main };';
 const mod=new vm.SourceTextModule(source,{context,identifier:tool});await mod.link(spec=>spec==='./legacyMaintenanceReadOnly.mjs'?guard:spec==='./firestoreConfig.mjs'?deps.get('config'):deps.get(spec)||Promise.reject(Error('Unexpected import '+spec)));
 await mod.evaluate();let error;try{await mod.namespace.main();}catch(e){error=e;}
 return {seen,error};
}
for(const tool of tools)test(`${tool}: actual inspector body binds explicit project/default DB and never mutates`,async()=>{
 const keyProject=tool==='wipeFirestoreOperationalDataAdmin'?'demo-safety-test':undefined;
 const {seen,error}=await runInspector(tool,{keyProject});assert.ifError(error);assert.equal(seen.writes,0);assert.ok(seen.reads.length||seen.requests.length);
 for(const p of seen.initializations)assert.equal(p,'demo-safety-test');for(const p of seen.firestores)assert.equal(p,'demo-safety-test');
 assert.ok(seen.logs.some(l=>l.includes('read-only inspection complete')));
});
for(const tool of tools)test(`${tool}: credential/config mismatch stops before authentication or DB init`,async()=>{
 const {seen,error}=await runInspector(tool,{keyProject:'other-project',configuredProject:'other-project'});
 assert.equal(error?.code,'LEGACY_PROJECT_MISMATCH');assert.equal(seen.authCalls,0);assert.equal(seen.initializations.length,0);assert.equal(seen.requests.length,0);assert.equal(seen.writes,0);
});
for(const tool of tools)test(`${tool}: retired execute reaches no credential, initializer, read or mutation`,async()=>{
 const {seen,error}=await runInspector(tool,{argv:[...target,'--execute'],keyProject:'demo-safety-test'});
 assert.equal(error?.code,'LEGACY_WRITES_RETIRED');for(const key of ['authCalls','keyReads','writes'])assert.equal(seen[key],0);for(const key of ['reads','requests','initializations','firestores'])assert.equal(seen[key].length,0);
});
for(const tool of tools)test(`${tool}: failed inspection cannot report completion`,async()=>{
 const {seen,error}=await runInspector(tool,{failRead:true,restStatus:404,keyProject:tool==='wipeFirestoreOperationalDataAdmin'?'demo-safety-test':undefined});
 assert.ok(error);assert.equal(seen.writes,0);assert.ok(!seen.logs.some(l=>l.includes('read-only inspection complete')));
});
for(const tool of tools)test(`${tool}: pre-change execute reaches mutation in isolated positive control`,async()=>{
 const {seen,error}=await runInspector(tool,{baseline:true,argv:[...target,'--execute','--key','fixture-key.json'],keyProject:'demo-safety-test'});
 assert.ok(seen.authCalls>0,tool);assert.ok(seen.writes>0,tool);assert.match(error?.message||'',/Unexpected write/);
});
test('legacy script bodies contain no mutation APIs and dangerous npm aliases stay removed',async()=>{
 for(const tool of tools){const source=await readFile('scripts/'+tool+'.mjs','utf8');assert.doesNotMatch(source,/\b(?:db|batch|transaction|ref|item\.ref)\s*\.\s*(?:set|update|delete|commit|recursiveDelete)\s*\(|documents:batchWrite|\bwriteBatch\b|\bexecutePlan\b/);assert.doesNotMatch(source,/DEFAULT_PROJECT_ID|resolveProjectId/);}
 const pkg=JSON.parse(await readFile('package.json','utf8'));for(const key of ['wipe:execute','wipe:execute:admin','seed-cleanup:execute','seed-data-input:execute'])assert.equal(pkg.scripts[key],undefined);
 for(const name of ['claims:execute','claims:restore','backup:prewipe'])assert.ok(pkg.scripts[name]);
});
