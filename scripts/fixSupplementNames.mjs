// op-bound supplementTypes name mojibake 정정(2026-05-21). canonical=makeSupplementName 규칙.
// dry-run 기본. --execute 호두 직접. name+updatedAt 필드만 갱신, 그 외 보존.

import fs from 'node:fs/promises';
import process from 'node:process';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { makeSupplementName } from '../src/utils/supplement.js';
import { parseArgs } from './firestoreConfig.mjs';

const DEFAULT_PROJECT_ID = 'fant-e5ae5';

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

function getRecipeDisplayName(recipe) {
  const targetPrefix = recipe.target === 'cat' ? '고양이 ' : recipe.target === 'dog' ? '강아지 ' : '';
  return recipe.displayName || `${targetPrefix}${recipe.name || ''}`;
}

async function collectPlan(db) {
  const recipeSnap = await db.collection('recipes').get();
  const recipeMap = new Map(recipeSnap.docs.map((docSnap) => [docSnap.id, docSnap.data()]));
  const supplementSnap = await db.collection('supplementTypes').get();
  const plan = [];

  console.log(`[supplement-names] recipes: ${recipeSnap.size}`);
  console.log(`[supplement-names] supplementTypes: ${supplementSnap.size}`);
  console.log('[supplement-names] scan:');

  for (const docSnap of supplementSnap.docs) {
    const data = docSnap.data() || {};
    const recipe = recipeMap.get(data.recipeId);
    if (!recipe) {
      console.log(`  - ${docSnap.id}: recipe not found, skip`);
      continue;
    }

    const recipeName = getRecipeDisplayName(recipe);
    const canonical = makeSupplementName(recipeName, data.unit);
    if (data.name === canonical) {
      console.log(`  - ${docSnap.id}: no change (${canonical})`);
      continue;
    }

    console.log(`  - ${docSnap.id}: ${JSON.stringify(data.name || '')} -> ${JSON.stringify(canonical)}`);
    plan.push({
      id: docSnap.id,
      ref: docSnap.ref,
      from: data.name || '',
      to: canonical,
    });
  }

  return plan;
}

async function executePlan(plan) {
  let changed = 0;
  for (const item of plan) {
    await item.ref.update({
      name: item.to,
      updatedAt: FieldValue.serverTimestamp(),
    });
    changed += 1;
    console.log(`[supplement-names] updated: supplementTypes/${item.id}`);
  }
  return changed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const execute = args.has('execute');
  const serviceAccount = await loadServiceAccount(args);
  const projectId = resolveProjectId(args, serviceAccount);

  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId,
  });

  const db = getFirestore();

  console.log(`[supplement-names] mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`[supplement-names] project: ${projectId}`);
  console.log(`[supplement-names] credential: ${serviceAccount ? 'service-account-key' : 'application-default'}`);
  console.log('[supplement-names] scope: supplementTypes name + updatedAt only.');

  const plan = await collectPlan(db);
  console.log(`[supplement-names] intended changes: ${plan.length}`);

  if (!execute) {
    console.log('[supplement-names] dry-run only. No documents updated.');
    return;
  }

  const changed = await executePlan(plan);
  console.log(`[supplement-names] actual changes: ${changed}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[supplement-names] failed:', err);
    process.exit(1);
  });
