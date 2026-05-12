import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BACKUP_COLLECTIONS,
  initAuthedFirestore,
  parseArgs,
  readCollection,
  serializeFirestoreValue,
  timestampForPath,
} from './firestoreConfig.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = args.get('out') || `backup_pre_wipe_${timestampForPath()}`;

  const db = await initAuthedFirestore(args);
  await fs.mkdir(outDir, { recursive: true });

  console.log(`[backup] output: ${outDir}`);
  console.log(`[backup] collections: ${BACKUP_COLLECTIONS.length}`);

  const summary = [];
  for (const collectionName of BACKUP_COLLECTIONS) {
    const docs = await readCollection(db, collectionName);
    const rows = docs.map((docSnap) => ({
      id: docSnap.id,
      data: serializeFirestoreValue(docSnap.data()),
    }));

    const filePath = path.join(outDir, `${collectionName}.json`);
    await fs.writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
    summary.push({ collection: collectionName, count: rows.length, file: filePath });
    console.log(`[backup] ${collectionName}: ${rows.length}`);
  }

  await fs.writeFile(
    path.join(outDir, '_summary.json'),
    `${JSON.stringify({
      createdAt: new Date().toISOString(),
      projectId: 'fant-e5ae5',
      collections: summary,
    }, null, 2)}\n`,
    'utf8',
  );

  console.log('[backup] done');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[backup] failed:', err);
    process.exit(1);
  });
