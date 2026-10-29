// 2026-10-27: initialization complete; inspection-only. Historical notes below are not execution/backup approval.
import { readLegacyMaintenanceTarget, assertLegacyProjectBinding, legacyMaintenanceUsage } from './legacyMaintenanceReadOnly.mjs';
import {
  firebaseConfig,
  PRESERVE_COLLECTIONS,
  WIPE_COLLECTIONS,
  initAuthedFirestore,
  readCollection,
} from './firestoreConfig.mjs';


async function main() {
  const parsed = readLegacyMaintenanceTarget(process.argv.slice(2), 'wipeFirestoreOperationalData');
  if (parsed.help) { console.log(legacyMaintenanceUsage('wipeFirestoreOperationalData')); return; }
  const { args, target } = parsed;

  assertLegacyProjectBinding(target, firebaseConfig.projectId);
  const db = await initAuthedFirestore(args);
  console.log('[wipe] mode: dry-run (retired initialization tool)');
  console.log('[wipe] target:', target.projectId, target.databaseId);
  for (const collectionName of PRESERVE_COLLECTIONS) {
    const docs = await readCollection(db, collectionName);
    console.log('  -', collectionName, ': preserved', docs.length);
  }
  for (const collectionName of WIPE_COLLECTIONS) {
    const docs = await readCollection(db, collectionName);
    console.log('  -', collectionName, ': inspection target', docs.length);
  }
  console.log('[wipe] read-only inspection complete. Execution is retired.');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[wipe] failed:', err);
    process.exit(1);
  });
