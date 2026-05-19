import fs from 'node:fs/promises';
import process from 'node:process';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { parseArgs } from './firestoreConfig.mjs';

const DEFAULT_PROJECT_ID = 'fant-e5ae5';

const DEFAULT_TARGETS = [
  {
    email: 'alice@fantapet.com',
    claims: {
      app: ['inventory', 'production'],
      roles: { inventory: 'owner', production: 'admin' },
    },
  },
  {
    email: 'admin@fantapet.com',
    claims: {
      app: ['inventory', 'production'],
      roles: { inventory: 'admin', production: 'office' },
    },
  },
  {
    email: 'qc@fantapet.com',
    claims: {
      app: ['inventory', 'production'],
      roles: { inventory: 'qc', production: 'production' },
    },
  },
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

function mergeClaims(existingClaims, nextClaims) {
  const { role: _legacyRole, app: _legacyApp, roles: _legacyRoles, ...rest } = existingClaims;
  return {
    ...rest,
    ...nextClaims,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.has('execute');
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

  const auth = getAuth();
  console.log(`[claims] mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`[claims] project: ${projectId}`);
  console.log(`[claims] credential: ${serviceAccount ? 'service-account-key' : 'application-default'}`);
  console.log(`[claims] target count: ${DEFAULT_TARGETS.length}`);
  console.log('[claims] scope: only configured target users are queried or modified.');
  console.log('[claims] skipped: all non-target Firebase Auth users.');
  console.log('[claims] targets:');

  for (const target of DEFAULT_TARGETS) {
    const user = await auth.getUserByEmail(target.email);
    const before = user.customClaims || {};
    const after = mergeClaims(before, target.claims);
    const byteLength = claimsByteLength(after);

    if (byteLength > 1000) {
      throw new Error(`${target.email} custom claims exceed 1000 bytes (${byteLength}).`);
    }

    console.log(`  - ${target.email}`);
    console.log('    target: yes');
    console.log(`    uid: ${user.uid}`);
    console.log(`    before: ${JSON.stringify(before)}`);
    console.log(`    after:  ${JSON.stringify(after)} (${byteLength} bytes)`);

    if (execute) {
      await auth.setCustomUserClaims(user.uid, after);
      await auth.revokeRefreshTokens(user.uid);
      console.log('    updated: yes');
    } else {
      console.log('    updated: no (dry-run)');
    }
  }

  if (!execute) {
    console.log('[claims] dry-run only. Re-run with --execute after reviewing the output.');
  } else {
    console.log('[claims] done. Users must sign out/sign in again, or force token refresh.');
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[claims] failed:', err);
    process.exit(1);
  });
