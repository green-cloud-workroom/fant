// 2026-10-27: initialization complete; inspection-only. Historical notes below are not execution/backup approval.
import { readLegacyMaintenanceTarget, assertLegacyProjectBinding, legacyMaintenanceUsage } from './legacyMaintenanceReadOnly.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {
  PRESERVE_COLLECTIONS,
  WIPE_COLLECTIONS,
} from './firestoreConfig.mjs';

const ADMIN_WIPE_COLLECTIONS = WIPE_COLLECTIONS;

const DATABASE = '(default)';
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function loadServiceAccount(args) {
  const keyPath = args.get('key') || process.env.FANT_ADMIN_KEY_PATH;
  if (!keyPath) {
    throw new Error('Missing service account key path. Set FANT_ADMIN_KEY_PATH or pass --key.');
  }
  const raw = await fs.readFile(keyPath, 'utf8');
  const key = JSON.parse(raw);
  for (const field of ['client_email', 'private_key', 'project_id']) {
    if (!key[field]) throw new Error(`Service account key is missing ${field}.`);
  }
  return key;
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  const claim = {
    iss: serviceAccount.client_email,
    scope: FIRESTORE_SCOPE,
    aud: serviceAccount.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(signingInput)
    .sign(serviceAccount.private_key);
  const assertion = `${signingInput}.${base64Url(signature)}`;

  const response = await fetch(claim.aud, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload.access_token;
}

function collectionUrl(projectId, collectionName, pageToken = '') {
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${DATABASE}/documents/${collectionName}`,
  );
  url.searchParams.set('pageSize', '1000');
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  return url;
}

async function listCollectionDocs(projectId, collectionName, token) {
  const docs = [];
  let pageToken = '';
  do {
    const response = await fetch(collectionUrl(projectId, collectionName, pageToken), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`List ${collectionName} failed: ${response.status} ${JSON.stringify(payload)}`);
    }
    docs.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);
  return docs;
}

async function main() {
  const parsed = readLegacyMaintenanceTarget(process.argv.slice(2), 'wipeFirestoreOperationalDataAdmin');
  if (parsed.help) { console.log(legacyMaintenanceUsage('wipeFirestoreOperationalDataAdmin')); return; }
  const { args, target } = parsed;

  const serviceAccount = await loadServiceAccount(args);
  assertLegacyProjectBinding(target, serviceAccount.project_id);
  const projectId = target.projectId;
  const token = await getAccessToken(serviceAccount);
  console.log('[admin-wipe] mode: dry-run (retired initialization tool)');
  console.log('[admin-wipe] target:', projectId, target.databaseId);
  for (const collectionName of PRESERVE_COLLECTIONS) {
    const docs = await listCollectionDocs(projectId, collectionName, token);
    console.log('  -', collectionName, ': preserved', docs.length);
  }
  let total = 0;
  for (const collectionName of ADMIN_WIPE_COLLECTIONS) {
    const docs = await listCollectionDocs(projectId, collectionName, token);
    total += docs.length;
    console.log('  -', collectionName, ': inspection target', docs.length);
  }
  console.log('[admin-wipe] total inspection targets:', total);
  console.log('[admin-wipe] read-only inspection complete. Execution is retired.');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[admin-wipe] failed:', err);
    process.exit(1);
  });
