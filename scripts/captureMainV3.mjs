import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const html=execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-sandbox','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check','--disable-sync','--allow-file-access-from-files','--user-data-dir=C:/dev/fant-production-ui2/output/ui3-chrome-verify','--window-size=1600,960','--hide-scrollbars','--screenshot=C:/dev/fant-production-ui2/output/ui3-main.png','--dump-dom','file:///C:/dev/fant-production-ui2/output/ui3-main.html'],{encoding:'utf8',windowsHide:true,timeout:45000,maxBuffer:8e6,stdio:['ignore','pipe','pipe']});
fs.writeFileSync('output/ui3-browser-dom.html',html);
const checks=JSON.parse(html.match(/<pre id="ui3Checks" hidden[^>]*>([\s\S]*?)<\/pre>/)[1].replaceAll('&quot;','"'));
fs.writeFileSync('output/ui3-browser-checks.json',JSON.stringify(checks,null,2));
console.log(checks);
