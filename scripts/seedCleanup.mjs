// 시드 직전 정리. handoff_v28 §"시드 입력 전 정리 필요" 사양 + 호두 2026-05-20 확정.
// dry-run 기본. --execute 는 호두가 직접 누름.
// 백업 사전 조건: backup_pre_wipe_adc_20260520_210654 존재(2026-05-20).
// 보존 대상(절대 건드리지 않음): users, staffGroups, holidays, 운영 recipes 4개,
//   meatTypes, bagTypes, frozenProducts, settings/closingFlags,
//   supplementTypes/yEhV7xTxX8giuDtSnFmQ_60·_100.
//   supplementStock orphan은 step 7에서 정리. 그 외 모든 stock/log/schedule/closingCheck/forecast 보존.
// 신규 wipe scripts/wipeFirestoreOperationalData* 는 collection-단위라 부적합 → 이 스크립트가 대체.

import fs from 'node:fs/promises';
import process from 'node:process';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseArgs } from './firestoreConfig.mjs';

const DEFAULT_PROJECT_ID = 'fant-e5ae5';
const BATCH_LIMIT = 450;

const TEST_RECIPE_IDS = [
  'VNGOvGiefHOXm8ldZkSP', // Codex 프리셋 검증
  'iD7fHlCGzzFwTCqef6Hn', // 단위4_검증_A_v2
  'codex_raw_no_conversion_smoke', // 환산값 미등록 raw
];
const SETTINGS_DOC_IDS = ['systemValues', 'menuStaffGroups', 'copySheetOrder'];
const SUPPLEMENT_TEST_PREFIX = 'VNGOvGiefHOXm8ldZkSP_';
const CONVERSION_HISTORY_RECIPE_ID = 'yEhV7xTxX8giuDtSnFmQ'; // 고양이 치킨
const PRODUCTIONS_STATUS_REQUIRED = 'deleted';
const BACKUP_REMINDER = 'backup_pre_wipe_adc_20260520_210654';

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

function formatDocPath(docRef) {
  return docRef.path;
}

async function listCollectionDocs(collectionRef) {
  const snap = await collectionRef.get();
  return snap.docs;
}

async function listRecursiveDescendants(docRef) {
  const descendants = [];
  const subcollections = await docRef.listCollections();

  for (const subcollection of subcollections) {
    const docs = await listCollectionDocs(subcollection);
    for (const docSnap of docs) {
      descendants.push(docSnap.ref);
      descendants.push(...(await listRecursiveDescendants(docSnap.ref)));
    }
  }

  return descendants;
}

async function collectRecursiveDeleteTarget(docRef) {
  const snap = await docRef.get();
  if (!snap.exists) {
    return { exists: false, refs: [], subcollections: [] };
  }

  const subcollections = await docRef.listCollections();
  const descendants = await listRecursiveDescendants(docRef);
  return {
    exists: true,
    refs: [docRef, ...descendants],
    subcollections: subcollections.map((subcollection) => subcollection.id),
  };
}

function logRefs(refs) {
  if (refs.length === 0) {
    console.log('    (none)');
    return;
  }

  for (const ref of refs) {
    console.log(`    - ${formatDocPath(ref)}`);
  }
}

async function batchDeleteRefs(db, refs) {
  let deleted = 0;
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    const chunk = refs.slice(i, i + BATCH_LIMIT);
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

async function collectPlan(db) {
  const plan = [];

  console.log('[seed-cleanup] step 1/7: test recipes recursive delete targets');
  const recipeTargets = [];
  for (const recipeId of TEST_RECIPE_IDS) {
    const docRef = db.collection('recipes').doc(recipeId);
    const target = await collectRecursiveDeleteTarget(docRef);
    if (!target.exists) {
      console.log(`  - recipes/${recipeId}: not found, skip`);
      continue;
    }

    console.log(`  - would recursively delete recipes/${recipeId}`);
    if (target.subcollections.length > 0) {
      console.log(`    subcollections: ${target.subcollections.join(', ')}`);
    } else {
      console.log('    subcollections: none');
    }
    logRefs(target.refs);
    recipeTargets.push(...target.refs);
  }
  plan.push({ label: 'test recipes recursive delete', refs: recipeTargets, recursive: true });

  console.log('[seed-cleanup] step 2/7: settings verification docs');
  const settingsTargets = [];
  for (const docId of SETTINGS_DOC_IDS) {
    const docRef = db.collection('settings').doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.log(`  - settings/${docId}: not found, skip`);
      continue;
    }
    console.log(`  - would delete settings/${docId}`);
    settingsTargets.push(docRef);
  }
  plan.push({ label: 'settings verification docs', refs: settingsTargets });

  console.log('[seed-cleanup] step 3/7: supplementTypes test prefix');
  const supplementDocs = await listCollectionDocs(db.collection('supplementTypes'));
  const supplementTargets = supplementDocs
    .map((docSnap) => docSnap.ref)
    .filter((ref) => ref.id.startsWith(SUPPLEMENT_TEST_PREFIX));
  console.log(`  - matched count: ${supplementTargets.length}`);
  logRefs(supplementTargets);
  plan.push({ label: 'supplementTypes test prefix', refs: supplementTargets });

  console.log('[seed-cleanup] step 4/7: conversionHistory verification entries');
  const conversionTargets = (
    await listCollectionDocs(
      db.collection('recipes').doc(CONVERSION_HISTORY_RECIPE_ID).collection('conversionHistory'),
    )
  ).map((docSnap) => docSnap.ref);
  console.log(`  - matched count: ${conversionTargets.length}`);
  logRefs(conversionTargets);
  plan.push({ label: 'conversionHistory verification entries', refs: conversionTargets });

  console.log('[seed-cleanup] step 5/7: activityLogs all docs');
  const activityTargets = (await listCollectionDocs(db.collection('activityLogs'))).map(
    (docSnap) => docSnap.ref,
  );
  console.log(`  - matched count: ${activityTargets.length}`);
  logRefs(activityTargets);
  plan.push({ label: 'activityLogs all docs', refs: activityTargets });

  console.log('[seed-cleanup] step 6/7: productions all docs with status guard');
  const productionDocs = await listCollectionDocs(db.collection('productions'));
  const invalidProductions = productionDocs.filter(
    (docSnap) => docSnap.data().status !== PRODUCTIONS_STATUS_REQUIRED,
  );
  if (invalidProductions.length > 0) {
    console.error('  - abort: productions status guard failed. No deletes are safe.');
    for (const docSnap of invalidProductions) {
      console.error(
        `    - productions/${docSnap.id}: status=${JSON.stringify(docSnap.data().status)}`,
      );
    }
    throw new Error(
      `productions status guard failed (${invalidProductions.length} docs not '${PRODUCTIONS_STATUS_REQUIRED}').`,
    );
  }
  const productionTargets = productionDocs.map((docSnap) => docSnap.ref);
  console.log(`  - guard passed: all ${productionTargets.length} docs have status='deleted'`);
  logRefs(productionTargets);
  plan.push({ label: 'productions deleted docs', refs: productionTargets });

  console.log('[seed-cleanup] step 7/7: orphan supplementStock (no matching supplementTypes)');
  const allSupplements = await listCollectionDocs(db.collection('supplementTypes'));
  const supplementTypeIds = new Set(allSupplements.map((docSnap) => docSnap.id));
  const allStocks = await listCollectionDocs(db.collection('supplementStock'));
  const orphanStockDocs = allStocks.filter((docSnap) => !supplementTypeIds.has(docSnap.id));
  const orphanStockTargets = orphanStockDocs.map((docSnap) => docSnap.ref);
  console.log(`  - matched count: ${orphanStockTargets.length}`);
  for (const docSnap of orphanStockDocs) {
    const data = docSnap.data() || {};
    console.log(`    - supplementStock/${docSnap.id} currentQty=${data.currentQty ?? '<none>'}`);
  }
  plan.push({ label: 'orphan supplementStock', refs: orphanStockTargets });

  return plan;
}

async function executePlan(db, plan) {
  let totalDeleted = 0;

  for (const step of plan) {
    if (step.refs.length === 0) {
      console.log(`[seed-cleanup] execute: ${step.label}: empty`);
      continue;
    }

    if (step.recursive) {
      for (const ref of step.refs.filter((candidate) => candidate.parent.id === 'recipes')) {
        await db.recursiveDelete(ref);
      }
      totalDeleted += step.refs.length;
      console.log(`[seed-cleanup] execute: ${step.label}: deleted ${step.refs.length}`);
      continue;
    }

    const deleted = await batchDeleteRefs(db, step.refs);
    totalDeleted += deleted;
    console.log(`[seed-cleanup] execute: ${step.label}: deleted ${deleted}`);
  }

  return totalDeleted;
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

  console.log(`[seed-cleanup] mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`[seed-cleanup] project: ${projectId}`);
  console.log(`[seed-cleanup] credential: ${serviceAccount ? 'service-account-key' : 'application-default'}`);
  console.log('[seed-cleanup] scope: targeted handoff_v28 cleanup only.');

  const plan = await collectPlan(db);
  const totalIntended = plan.reduce((sum, step) => sum + step.refs.length, 0);
  console.log(`[seed-cleanup] total intended delete docs: ${totalIntended}`);

  if (!execute) {
    console.log('[seed-cleanup] dry-run only. No documents deleted.');
    console.log('[seed-cleanup] run npm run seed-cleanup:execute only after Hodoo review.');
    return;
  }

  const totalDeleted = await executePlan(db, plan);
  console.log(`[seed-cleanup] total actual deleted docs: ${totalDeleted}`);
  console.log(`[seed-cleanup] backup reminder: ${BACKUP_REMINDER}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[seed-cleanup] failed:', err);
    process.exit(1);
  });
