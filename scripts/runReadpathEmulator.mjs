import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
const inventory=process.env.INVENTORY_RULES_REPO || 'C:/dev/fantapet-inventory';
const rulesIndex=process.argv.indexOf('--rules');
const rulesPath=rulesIndex>=0?process.argv[rulesIndex+1]:process.env.READPATH_RULES_FILE;
if(rulesIndex>=0&&!rulesPath)throw Error('--rules requires a file path.');
let rules, rulesSource;
if(rulesPath){rules=readFileSync(resolve(rulesPath),'utf8');rulesSource=resolve(rulesPath);}
else {
  const app=initializeApp({credential:applicationDefault(),projectId:'fant-e5ae5'});
  try {
    const live=await getSecurityRules(app).getFirestoreRuleset();
    if(live.source.length!==1)throw Error('Unexpected shared rules source structure.');
    rules=live.source[0].content;rulesSource='live:fant-e5ae5:'+live.name;
  } finally {await deleteApp(app);}
}
const rulesSha=createHash('sha256').update(rules).digest('hex');
const revision=rulesSource+':sha256:'+rulesSha;
mkdirSync('output/readpath/emulator',{recursive:true});writeFileSync('output/readpath/emulator/firestore.rules',rules);
writeFileSync('output/readpath/emulator/firebase.json',JSON.stringify({firestore:{rules:'firestore.rules'},emulators:{firestore:{host:'127.0.0.1',port:8088},singleProjectMode:true}}));
const env={...process.env,READPATH_RULES_REVISION:revision,READPATH_INVENTORY_REPO:inventory};
const java='C:/Program Files/Android/Android Studio/jbr/bin';
if(existsSync(java+'/java.exe')) {env.JAVA_HOME=dirname(java);const key=Object.keys(env).find(k=>k.toLowerCase()==='path')||'PATH';env[key]=java+';'+env[key];}
const npx=join(dirname(process.execPath),'node_modules/npm/bin/npx-cli.js');
env.READPATH_CHECK_INVENTORY=String(process.argv.includes('--inventory-tests'));
console.log('Emulator rules:',rulesSource,rulesSha);
let passed=false;
try {
  execFileSync(process.execPath,[npx,'--yes','firebase-tools','emulators:exec','--project','demo-fant-readpath','--config',resolve('output/readpath/emulator/firebase.json'),'--only','firestore','node scripts/runReadpathEmulatorTests.mjs'],{env,stdio:'inherit'});
  passed=true;
} finally {
  writeFileSync('output/readpath/emulator/verification.json',JSON.stringify({checkedAt:new Date().toISOString(),rulesSource,rulesSha,passed,inventoryTests:env.READPATH_CHECK_INVENTORY==='true'},null,2));
}
