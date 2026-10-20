import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8088'||!process.env.GCLOUD_PROJECT?.startsWith('demo-'))throw Error('Isolated emulator required.');
execFileSync(process.execPath,['--experimental-vm-modules','--test','tests/readpath.integration.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','tests/duplicateReceiptResolution.integration.mjs'],{stdio:'inherit'});
if(process.env.READPATH_CHECK_INVENTORY==='true'){
 const inventory=process.env.READPATH_INVENTORY_REPO;
 execFileSync(process.execPath,[resolve(inventory,'node_modules/vitest/vitest.mjs'),'run','src/features/productReceipts/productReceiptService.rules.emulator.test.ts'],{
  cwd:inventory,stdio:'inherit',env:{...process.env,RECEIPT_REVIEW_RULES:resolve('output/readpath/emulator/firestore.rules')},
 });
}
