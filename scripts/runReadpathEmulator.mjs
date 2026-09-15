import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
const inventory=process.env.INVENTORY_RULES_REPO || 'C:/dev/fantapet-inventory';
const rules=execFileSync('git',['show','HEAD:firestore.rules.draft'],{cwd:inventory,encoding:'utf8'});
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:inventory,encoding:'utf8'}).trim();
mkdirSync('output/readpath/emulator',{recursive:true});writeFileSync('output/readpath/emulator/firestore.rules',rules);
writeFileSync('output/readpath/emulator/firebase.json',JSON.stringify({firestore:{rules:'firestore.rules'},emulators:{firestore:{host:'127.0.0.1',port:8088},singleProjectMode:true}}));
const env={...process.env,READPATH_RULES_REVISION:revision,READPATH_INVENTORY_REPO:inventory};
const java='C:/Program Files/Android/Android Studio/jbr/bin';
if(existsSync(java+'/java.exe')) {env.JAVA_HOME=dirname(java);const key=Object.keys(env).find(k=>k.toLowerCase()==='path')||'PATH';env[key]=java+';'+env[key];}
const npx=join(dirname(process.execPath),'node_modules/npm/bin/npx-cli.js');
execFileSync(process.execPath,[npx,'--yes','firebase-tools','emulators:exec','--project','demo-fant-readpath','--config',resolve('output/readpath/emulator/firebase.json'),'--only','firestore','node --experimental-vm-modules --test tests/readpath.integration.mjs'],{env,stdio:'inherit'});
