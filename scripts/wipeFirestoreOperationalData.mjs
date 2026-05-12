import {
  writeBatch,
} from 'firebase/firestore';
import {
  PRESERVE_COLLECTIONS,
  WIPE_COLLECTIONS,
  initAuthedFirestore,
  parseArgs,
  readCollection,
} from './firestoreConfig.mjs';

const BATCH_LIMIT = 450;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countdown(seconds) {
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    console.log(`[wipe] execute starts in ${remaining}s... Ctrl+C to cancel`);
    await sleep(1000);
  }
}

async function deleteDocsInBatches(db, collectionName, docs) {
  let deleted = 0;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batchDocs = docs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const docSnap of batchDocs) {
      batch.delete(docSnap.ref);
    }
    await batch.commit();
    deleted += batchDocs.length;
    console.log(`[wipe] ${collectionName}: deleted ${deleted}/${docs.length}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.has('execute');
  const dryRun = !execute;
  const db = await initAuthedFirestore(args);

  console.log(`[wipe] mode: ${dryRun ? 'dry-run' : 'execute'}`);
  console.log('[wipe] preserve allowlist:');
  for (const collectionName of PRESERVE_COLLECTIONS) {
    const docs = await readCollection(db, collectionName);
    console.log(`  - ${collectionName}: preserved (${docs.length})`);
  }

  console.log('[wipe] delete whitelist:');
  const targets = [];
  for (const collectionName of WIPE_COLLECTIONS) {
    const docs = await readCollection(db, collectionName);
    targets.push({ collectionName, docs });
    console.log(`  - ${collectionName}: ${docs.length}`);
  }

  if (dryRun) {
    console.log('[wipe] dry-run only. No documents deleted.');
    console.log('[wipe] run with --execute only after backup and count review.');
    return;
  }

  console.log('[wipe] EXECUTE requested. These collections will be deleted:');
  for (const target of targets) {
    console.log(`  - ${target.collectionName}: ${target.docs.length}`);
  }
  await countdown(5);

  for (const target of targets) {
    if (target.docs.length === 0) {
      console.log(`[wipe] ${target.collectionName}: empty`);
      continue;
    }
    await deleteDocsInBatches(db, target.collectionName, target.docs);
  }

  console.log('[wipe] done');
}

main().catch((err) => {
  console.error('[wipe] failed:', err);
  process.exitCode = 1;
});
