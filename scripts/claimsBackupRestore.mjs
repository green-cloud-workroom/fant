import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const TARGETS = ['admin@fantapet.com', 'alice@fantapet.com', 'qc@fantapet.com'];
const MAX_PLAN_MS = 10 * 60 * 1000;
const ALLOWED = new Set(['backup', 'restore', 'project', 'key', 'execute', 'plan-hash', 'expires-at', 'receipt']);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

export function parseClaimsArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--') || !ALLOWED.has(token.slice(2))) throw new Error('Unknown or malformed option.');
    const name = token.slice(2);
    if (args.has(name)) throw new Error('Duplicate option.');
    if (name === 'execute') {
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) throw new Error('--execute does not take a value.');
      args.set(name, true);
    } else {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}.`);
      args.set(name, value);
    }
  }
  if (args.has('backup') === args.has('restore')) throw new Error('Choose --backup or --restore.');
  if (!args.get('project') || !args.get('key')) throw new Error('Explicit --project and --key are required.');
  if (args.has('backup') && (args.has('execute') || args.has('plan-hash') || args.has('expires-at') || args.has('receipt'))) {
    throw new Error('Restore options cannot be used with backup.');
  }
  if (args.has('execute') && (!args.get('plan-hash') || !args.get('expires-at') || !args.get('receipt'))) {
    throw new Error('Execute requires --plan-hash, --expires-at and --receipt.');
  }
  if (!args.has('execute') && (args.has('plan-hash') || args.has('expires-at') || args.has('receipt'))) {
    throw new Error('Plan and receipt options require --execute.');
  }
  return args;
}

function assertRows(rows) {
  if (!Array.isArray(rows) || rows.length !== TARGETS.length) throw new Error('Backup target count mismatch.');
  const emails = new Set();
  const uids = new Set();
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row) || !TARGETS.includes(row.email) ||
        typeof row.uid !== 'string' || !row.uid || !Object.hasOwn(row, 'claims') ||
        (row.claims !== null && (typeof row.claims !== 'object' || Array.isArray(row.claims))) ||
        Buffer.byteLength(JSON.stringify(row.claims) ?? '', 'utf8') > 1000 ||
        emails.has(row.email) || uids.has(row.uid)) throw new Error('Invalid backup target row.');
    emails.add(row.email);
    uids.add(row.uid);
  }
  if (TARGETS.some(email => !emails.has(email))) throw new Error('Backup target set mismatch.');
}

function normalizedRows(rows) {
  assertRows(rows);
  return [...rows].sort((a, b) => a.email.localeCompare(b.email));
}

async function observe(auth, rows) {
  const current = [];
  for (const row of rows) {
    const user = await auth.getUserByEmail(row.email);
    if (user.uid !== row.uid) throw new Error('Auth UID drift; no writes attempted.');
    current.push({ email: row.email, uid: user.uid, claims: user.customClaims ?? null });
  }
  return current;
}

function assertExpiry(expiresAt, now, execute) {
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end) || end <= now || end - now > MAX_PLAN_MS) {
    throw new Error(execute ? 'Plan expired or expiration invalid.' : 'Plan expiration invalid.');
  }
}

function planFor(project, envelope, current, expiresAt) {
  return digest({ schemaVersion: 1, project, backupDigest: digest(envelope),
    targetClaimsDigest: digest(envelope.rows), currentClaimsDigest: digest(current), expiresAt });
}

async function appendReceipt(handle, event) {
  await handle.appendFile(`${JSON.stringify(event)}\n`, 'utf8');
  await handle.sync();
}

export async function runClaimsCommand(options, auth, { fsApi = fs, now = () => Date.now(), log = console.log } = {}) {
  const { mode, project, file, execute = false, planHash, expiresAt, receipt } = options;
  if (!project || !file || !['backup', 'restore'].includes(mode)) throw new Error('Explicit mode, project and file required.');
  if (mode === 'backup') {
    const rows = [];
    for (const email of TARGETS) {
      const user = await auth.getUserByEmail(email);
      rows.push({ email, uid: user.uid, claims: user.customClaims ?? null });
    }
    const envelope = { schemaVersion: 1, project, createdAt: new Date(now()).toISOString(), rows: normalizedRows(rows) };
    const handle = await fsApi.open(file, 'wx', 0o600);
    try { await handle.writeFile(`${JSON.stringify(envelope, null, 2)}\n`, 'utf8'); await handle.sync(); }
    finally { await handle.close(); }
    log(`[claims-rollback] backup targets=${rows.length} sha256=${digest(envelope)} writes=0`);
    return { mode, backupDigest: digest(envelope), writes: 0 };
  }

  const envelope = JSON.parse(await fsApi.readFile(file, 'utf8'));
  if (envelope?.schemaVersion !== 1 || envelope.project !== project || !Number.isFinite(Date.parse(envelope.createdAt))) {
    throw new Error('Backup project or schema mismatch.');
  }
  const rows = normalizedRows(envelope.rows);
  const current = await observe(auth, rows);
  if (!execute) {
    const end = new Date(now() + MAX_PLAN_MS).toISOString();
    const hash = planFor(project, envelope, current, end);
    log(`[claims-rollback] restore plan targets=${rows.length} backupSha256=${digest(envelope)} currentSha256=${digest(current)} targetSha256=${digest(rows)} expiresAt=${end} planHash=${hash} writes=0`);
    return { mode: 'plan', planHash: hash, expiresAt: end, writes: 0 };
  }

  assertExpiry(expiresAt, now(), true);
  if (!/^[a-f0-9]{64}$/.test(planHash ?? '') || planFor(project, envelope, current, expiresAt) !== planHash) {
    throw new Error('Plan hash mismatch or Auth claims drift; no writes attempted.');
  }
  if (!receipt) throw new Error('Exclusive receipt path required.');
  const handle = await fsApi.open(receipt, 'wx', 0o600);
  let completed = 0;
  try {
    await appendReceipt(handle, { event: 'start', project, planHash, backupDigest: digest(envelope), at: new Date(now()).toISOString() });
    for (const row of rows) {
      await appendReceipt(handle, { event: 'attempt', email: row.email, uid: row.uid, at: new Date(now()).toISOString() });
      await auth.setCustomUserClaims(row.uid, row.claims);
      const verified = await auth.getUser(row.uid);
      if (verified.email !== row.email || verified.uid !== row.uid || digest(verified.customClaims ?? null) !== digest(row.claims)) {
        throw new Error('Readback mismatch.');
      }
      completed += 1;
      await appendReceipt(handle, { event: 'verified', email: row.email, uid: row.uid, at: new Date(now()).toISOString() });
    }
    await appendReceipt(handle, { event: 'complete', verified: completed, at: new Date(now()).toISOString() });
    log(`[claims-rollback] restore verified=${completed}/${rows.length} receipt=${receipt}`);
    return { mode: 'restore', writes: completed };
  } catch {
    await appendReceipt(handle, { event: 'stopped', verified: completed, outcome: 'partial-or-unknown', at: new Date(now()).toISOString() });
    throw new Error(`Restore stopped: verified=${completed}/${rows.length}; last attempt outcome unknown. Inspect receipt and Auth state; do not retry automatically.`);
  } finally { await handle.close(); }
}

async function main() {
  const args = parseClaimsArgs(process.argv.slice(2));
  const project = args.get('project');
  const key = JSON.parse(await fs.readFile(args.get('key'), 'utf8'));
  if (key?.project_id !== project || !key.client_email || !key.private_key) throw new Error('Service account key project mismatch or invalid key.');
  const [{ cert, initializeApp }, { getAuth }] = await Promise.all([
    import('firebase-admin/app'), import('firebase-admin/auth'),
  ]);
  const app = initializeApp({ credential: cert(key), projectId: project });
  await runClaimsCommand({
    mode: args.has('backup') ? 'backup' : 'restore', project,
    file: args.get('backup') ?? args.get('restore'), execute: args.has('execute'),
    planHash: args.get('plan-hash'), expiresAt: args.get('expires-at'), receipt: args.get('receipt'),
  }, getAuth(app));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`[claims-rollback] failed: ${error.message}`); process.exitCode = 1; });
}
