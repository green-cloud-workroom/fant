// Narrow, explicit installation into the existing shared backend. Never deploys.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const target = resolve('../fantapet-inventory/functions/src/productionStats');
const check = process.argv.includes('--check');
const files = ['statsAutomation', 'statsLogic', 'incomingCorrections', 'statsCorrections', 'manualMovementLogic', 'receiptIntegrity'];
if (!check) await mkdir(target, { recursive: true });
for (const file of files) {
  const source = '// @ts-nocheck\n// Generated from fant-production; syncStatsAutomationBackend.mjs --check guards drift.\n'
    + await readFile('src/services/' + file + '.js', 'utf8');
  const path = resolve(target, file + '.ts');
  if (check) { if (await readFile(path, 'utf8') !== source) throw Error('Backend source drift: ' + file); }
  else await writeFile(path, source);
}
const server = await readFile('integrations/productionStats/server.ts', 'utf8');
if (check) { if (await readFile(resolve(target, 'server.ts'), 'utf8') !== server) throw Error('Backend server drift'); }
else await writeFile(resolve(target, 'server.ts'), server);
const entry = resolve(target, '../index.ts'), text = await readFile(entry, 'utf8');
const exported = "export { productionStatsShadowDaily, onProductionStatsAdjustmentCreated } from './productionStats/server.js'";
const legacy = "export { previewProductionStatsAutomation, productionStatsShadowDaily, productionStatsInbox, acknowledgeProductionStatsPopup } from './productionStats/server.js'";
const updated = text.replace(legacy, exported).replace("export { previewProductionStatsAutomation, productionStatsShadowDaily } from './productionStats/server.js'", exported)
  .replace("export { productionStatsShadowDaily } from './productionStats/server.js'", exported);
if (updated !== text || !text.includes(exported)) {
  if (check) throw Error('Missing isolated statistics exports');
  await writeFile(entry, updated.includes(exported) ? updated : updated.trimEnd() + '\n\n' + exported + '\n');
}
console.log(check ? 'Backend sources match canonical production code.' : 'Installed statistics backend sources. No deployment, config writes or delivery.');
