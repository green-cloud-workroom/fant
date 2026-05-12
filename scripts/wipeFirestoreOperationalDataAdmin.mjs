import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {
  PRESERVE_COLLECTIONS,
  WIPE_COLLECTIONS,
  parseArgs,
} from './firestoreConfig.mjs';

const ADMIN_WIPE_COLLECTIONS = WIPE_COLLECTIONS;

const DATABASE = '(default)';
const BATCH_LIMIT = 450;
const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countdown(seconds) {
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    console.log(`[admin-wipe] execute starts in ${remaining}s... Ctrl+C to cancel`);
    await sleep(1000);
  }
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
      if (response.status === 404) return docs;
      throw new Error(`List ${collectionName} failed: ${response.status} ${JSON.stringify(payload)}`);
    }
    docs.push(...(payload.documents || []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);
  return docs;
}

async function batchDelete(projectId, collectionName, docs, token) {
  let deleted = 0;
  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const slice = docs.slice(i, i + BATCH_LIMIT);
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${DATABASE}/documents:batchWrite`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes: slice.map((doc) => ({ delete: doc.name })),
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`Delete ${collectionName} failed: ${response.status} ${JSON.stringify(payload)}`);
    }
    deleted += slice.length;
    console.log(`[admin-wipe] ${collectionName}: deleted ${deleted}/${docs.length}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.has('execute');
  const serviceAccount = await loadServiceAccount(args);
  const projectId = serviceAccount.project_id;
  const token = await getAccessToken(serviceAccount);

  console.log(`[admin-wipe] mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`[admin-wipe] project: ${projectId}`);
  console.log('[admin-wipe] preserve allowlist:');
  for (const collectionName of PRESERVE_COLLECTIONS) {
    const docs = await listCollectionDocs(projectId, collectionName, token);
    console.log(`  - ${collectionName}: preserved (${docs.length})`);
  }

  console.log('[admin-wipe] delete whitelist:');
  const targets = [];
  for (const collectionName of ADMIN_WIPE_COLLECTIONS) {
    const docs = await listCollectionDocs(projectId, collectionName, token);
    targets.push({ collectionName, docs });
    console.log(`  - ${collectionName}: ${docs.length}`);
  }

  const total = targets.reduce((sum, target) => sum + target.docs.length, 0);
  console.log(`[admin-wipe] total delete target: ${total}`);

  if (!execute) {
    console.log('[admin-wipe] dry-run only. No documents deleted.');
    console.log('[admin-wipe] run with --execute only after count review.');
    return;
  }

  console.log('[admin-wipe] EXECUTE requested. These collections will be deleted:');
  for (const target of targets) {
    console.log(`  - ${target.collectionName}: ${target.docs.length}`);
  }
  await countdown(5);

  for (const target of targets) {
    if (target.docs.length === 0) {
      console.log(`[admin-wipe] ${target.collectionName}: empty`);
      continue;
    }
    await batchDelete(projectId, target.collectionName, target.docs, token);
  }

  console.log('[admin-wipe] done');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[admin-wipe] failed:', err);
    process.exit(1);
  });
