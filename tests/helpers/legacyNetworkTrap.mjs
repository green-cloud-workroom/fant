// Child-process tripwire: never allow a maintenance safety test onto a network.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import http2 from 'node:http2';
const result={networkAttempts:0,keyReads:0,bootstrapComplete:false};
process.on('exit',()=>fs.writeFileSync(process.env.MAINTENANCE_TRAP_RESULT,JSON.stringify(result)));
const deny=()=>{result.networkAttempts++;throw Error('TEST_NETWORK_FORBIDDEN');};
globalThis.fetch=deny;http.request=deny;http.get=deny;https.request=deny;https.get=deny;http2.connect=deny;net.connect=deny;net.createConnection=deny;net.Socket.prototype.connect=deny;tls.connect=deny;dns.lookup=deny;
const credentialPath=path=>String(path)===process.env.MAINTENANCE_TRAP_KEY||/application_default_credentials\.json$/i.test(String(path));
const read=fsp.readFile.bind(fsp);
fsp.readFile=async(path,...args)=>{if(credentialPath(path)){result.keyReads++;throw Error('TEST_KEY_READ_FORBIDDEN');}return read(path,...args);};
for(const key of ['readFile','readFileSync','open','openSync']){const original=fs[key].bind(fs);fs[key]=(path,...args)=>{if(credentialPath(path)){result.keyReads++;throw Error('TEST_KEY_READ_FORBIDDEN');}return original(path,...args);};}
result.bootstrapComplete=true;
