import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { parseArgs } from './firestoreConfig.mjs';

const DEFAULT_PROJECT_ID = 'fant-e5ae5';

// Legacy reference only. Restore authority is always the backup JSON file:
// alice@={role:'admin',app:['production','inventory']}
// admin@={role:'office',app:['production','inventory']}
// qc@={role:'production',app:['production','inventory']}
const DEFAULT_TARGETS = [
  { email: 'alice@fantapet.com' },
  { email: 'admin@fantapet.com' },
  { email: 'qc@fantapet.com' },
];

async function loadServiceAccount(args) {
  const keyPath = args.get('key') || process.env.FANT_ADMIN_KEY_PATH;
  if (!keyPath) return null;

  const raw = await fs.readFile(keyPath, 'utf8');
  const key = JSON.parse(raw);
  for (const field of ['client_email', 'private_key', 'project_id']) {
    if (!key[field]) throw new Error(`Service account key is missing ${field}.`);
  }
  return key;
}

function resolveProjectId(args, serviceAccount) {
  return (
    args.get('project') ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    serviceAccount?.project_id ||
    DEFAULT_PROJECT_ID
  );
}

function claimsByteLength(claims) {
  return Buffer.byteLength(JSON.stringify(claims), 'utf8');
}

function defaultBackupPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `claims-backup-${stamp}.json`;
}

function resolveBackupPath(args) {
  const value = args.get('backup');
  return typeof value === 'string' ? value : defaultBackupPath();
}

function resolveRestorePath(args) {
  const value = args.get('restore');
  if (typeof value !== 'string') {
    throw new Error('Missing restore path. Usage: --restore <path>');
  }
  return value;
}

async function initAdminAuth(args) {
  const serviceAccount = await loadServiceAccount(args);
  const projectId = resolveProjectId(args, serviceAccount);

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  console.log(`[claims-rollback] project: ${projectId}`);
  console.log(
    `[claims-rollback] credential: ${serviceAccount ? 'service-account-key' : 'application-default'}`,
  );
  return getAuth();
}

function assertBackupRows(rows) {
  if (!Array.isArray(rows)) {
    throw new Error('Backup JSON must be an array.');
  }

  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`Backup row ${index} must be an object.`);
    }
    if (typeof row.email !== 'string' || !row.email) {
      throw new Error(`Backup row ${index} is missing email.`);
    }
    if (typeof row.uid !== 'string' || !row.uid) {
      throw new Error(`Backup row ${index} is missing uid.`);
    }
    if (!Object.prototype.hasOwnProperty.call(row, 'claims')) {
      throw new Error(`Backup row ${index} is missing claims.`);
    }
  }
}

function assertClaimsSize(email, claims) {
  const byteLength = claimsByteLength(claims);
  if (byteLength > 1000) {
    throw new Error(`${email} custom claims exceed 1000 bytes (${byteLength}).`);
  }
  return byteLength;
}

async function runBackup(args) {
  const outPath = resolveBackupPath(args);
  const auth = await initAdminAuth(args);
  const rows = [];

  console.log('[claims-rollback] mode: backup');
  console.log(`[claims-rollback] output: ${outPath}`);
  console.log(`[claims-rollback] target count: ${DEFAULT_TARGETS.length}`);

  for (const target of DEFAULT_TARGETS) {
    const user = await auth.getUserByEmail(target.email);
    const claims = user.customClaims ?? null;
    const byteLength = assertClaimsSize(target.email, claims);
    rows.push({
      email: target.email,
      uid: user.uid,
      claims,
    });

    console.log(`  - ${target.email}`);
    console.log(`    uid: ${user.uid}`);
    console.log(`    claims: ${JSON.stringify(claims)} (${byteLength} bytes)`);
  }

  await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`[claims-rollback] backup written: ${outPath}`);
  console.log('[claims-rollback] writes: 0 (backup only)');
}

async function loadBackupRows(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const rows = JSON.parse(raw);
  assertBackupRows(rows);
  return rows;
}

async function runRestore(args) {
  const execute = args.has('execute');
  const inPath = resolveRestorePath(args);
  const rows = await loadBackupRows(inPath);
  const auth = execute ? await initAdminAuth(args) : null;

  console.log(`[claims-rollback] mode: restore ${execute ? 'execute' : 'dry-run'}`);
  console.log(`[claims-rollback] input: ${inPath}`);
  console.log(`[claims-rollback] target count: ${rows.length}`);
  console.log('[claims-rollback] intended writes:');

  let writeCount = 0;
  for (const row of rows) {
    const byteLength = assertClaimsSize(row.email, row.claims);
    console.log(`  - ${row.email}`);
    console.log(`    uid: ${row.uid}`);
    console.log(`    setCustomUserClaims: ${JSON.stringify(row.claims)} (${byteLength} bytes)`);

    if (execute) {
      await auth.setCustomUserClaims(row.uid, row.claims);
      writeCount += 1;
      console.log('    updated: yes');
    } else {
      console.log('    updated: no (dry-run)');
    }
  }

  console.log(`[claims-rollback] writes: ${writeCount}`);
  if (!execute) {
    console.log('[claims-rollback] dry-run only. Re-run with --execute only during approved rollback.');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const hasBackup = args.has('backup');
  const hasRestore = args.has('restore');

  if (hasBackup === hasRestore) {
    throw new Error('Choose exactly one mode: --backup [path] or --restore <path>.');
  }

  if (hasBackup) {
    await runBackup(args);
  } else {
    await runRestore(args);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[claims-rollback] failed:', err);
    process.exit(1);
  });
