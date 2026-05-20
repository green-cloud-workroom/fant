// 시드 #3 마스터 데이터 입력. 호두 2026-05-20 확정값:
//   고양이 치킨(yEhV7xTxX8giuDtSnFmQ): unitPresets [60,100] 유지, productionMethods label rotary→로터리/manual→수동
//   치킨텐더 / 고양이 주식치킨캣 / 고양이 주식 덕캣: unitPresets [1] 설정
//   supplementTypes: 고양이치킨 op-bound 2개 보존(이번 미변경), freeze-dry 3개 _1 신규 생성 (stock=0)
// dry-run 기본. --execute 는 호두 직접.
// 사전조건: scripts/seedCleanup.mjs --execute 완료(2026-05-20). post-cleanup 상태가 fallback.

import fs from 'node:fs/promises';
import process from 'node:process';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { parseArgs } from './firestoreConfig.mjs';

const DEFAULT_PROJECT_ID = 'fant-e5ae5';

const RAW_RECIPE_ID = 'yEhV7xTxX8giuDtSnFmQ';
const RAW_RECIPE_UNIT_PRESETS = [60, 100];
const FREEZE_DRY_RECIPE_NAMES = [
  '치킨텐더',
  '고양이 주식치킨캣',
  '고양이 주식 덕캣',
];
const FREEZE_DRY_UNIT_PRESETS = [1];
const NEW_SUPPLEMENT_DEFAULT_STOCK = 0;
const PRODUCTION_METHOD_LABEL_MAP = {
  rotary: '로터리',
  manual: '수동',
};

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

function arraysEqual(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function makeSupplementId(recipeId, unit) {
  return `${recipeId}_${unit}`;
}

function makeSupplementName(recipeName, unit) {
  return `${recipeName} ${unit}용 영양제`;
}

function makeSupplementSortOrder(recipeSortOrder, unitIndex) {
  return (recipeSortOrder || 0) * 100 + unitIndex;
}

function recipeLabel(recipe) {
  return recipe.displayName || recipe.name || recipe.id;
}

function compactRecipe(recipe) {
  return {
    id: recipe.id,
    name: recipe.name || null,
    displayName: recipe.displayName || null,
    category: recipe.category || null,
    unitPresets: Array.isArray(recipe.unitPresets) ? recipe.unitPresets : [],
    productionMethods: Array.isArray(recipe.productionMethods) ? recipe.productionMethods : [],
    sortOrder: recipe.sortOrder ?? null,
  };
}

function normalizeProductionMethods(methods) {
  if (!Array.isArray(methods)) return [];
  return methods.map((method) => {
    if (!method || typeof method !== 'object') return method;
    const label = PRODUCTION_METHOD_LABEL_MAP[method.methodKey];
    if (!label || method.label === label) return method;
    return {
      ...method,
      label,
    };
  });
}

function findRecipeByConfiguredName(recipes, configuredName) {
  const matches = recipes
    .map((recipe) => {
      if (recipe.name === configuredName) return { recipe, matchedField: 'name' };
      if (recipe.displayName === configuredName) return { recipe, matchedField: 'displayName' };
      return null;
    })
    .filter(Boolean);

  if (matches.length !== 1) {
    return { matches };
  }
  return matches[0];
}

function printRecipeDiscovery(recipes) {
  console.log('[seed-data] discovered recipes:');
  for (const recipe of recipes) {
    console.log(`  - ${JSON.stringify(compactRecipe(recipe))}`);
  }
}

function printSupplementDiscovery(supplements) {
  console.log(`[seed-data] raw recipe supplementTypes (${RAW_RECIPE_ID}_*):`);
  const rawSupplements = supplements.filter((supplement) => supplement.id.startsWith(`${RAW_RECIPE_ID}_`));
  if (rawSupplements.length === 0) {
    console.log('  - (none)');
    return;
  }
  for (const supplement of rawSupplements) {
    console.log(`  - ${JSON.stringify(supplement)}`);
  }
}

function printSupplementStockDiscovery(supplementStocks) {
  console.log(`[seed-data] raw recipe supplementStock (${RAW_RECIPE_ID}_*):`);
  const rawStocks = supplementStocks.filter((stock) => stock.id.startsWith(`${RAW_RECIPE_ID}_`));
  if (rawStocks.length === 0) {
    console.log('  - (none)');
    return;
  }
  for (const stock of rawStocks) {
    console.log(`  - ${JSON.stringify(stock)}`);
  }
}

function validateFreezeDryRecipe(recipe, configuredName) {
  const current = Array.isArray(recipe.unitPresets) ? recipe.unitPresets : [];
  if (arraysEqual(current, FREEZE_DRY_UNIT_PRESETS)) return;
  if (current.length === 0) return;
  throw new Error(
    `${configuredName} (${recipe.id}) has unexpected unitPresets ${JSON.stringify(current)}; expected [] or ${JSON.stringify(FREEZE_DRY_UNIT_PRESETS)}.`,
  );
}

async function collectPlan(db) {
  const recipeSnap = await db.collection('recipes').get();
  const recipes = recipeSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  recipes.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));

  const supplementSnap = await db.collection('supplementTypes').get();
  const supplements = supplementSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  supplements.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const supplementStockSnap = await db.collection('supplementStock').get();
  const supplementStocks = supplementStockSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  supplementStocks.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  printRecipeDiscovery(recipes);
  printSupplementDiscovery(supplements);
  printSupplementStockDiscovery(supplementStocks);

  const rawRecipe = recipes.find((recipe) => recipe.id === RAW_RECIPE_ID);
  if (!rawRecipe) throw new Error(`RAW_RECIPE_ID not found: ${RAW_RECIPE_ID}`);

  const freezeDryMatches = [];
  for (const configuredName of FREEZE_DRY_RECIPE_NAMES) {
    const result = findRecipeByConfiguredName(recipes, configuredName);
    if (!result.recipe) {
      console.error(`[seed-data] abort: expected exactly one recipe for ${configuredName}, got ${result.matches.length}`);
      for (const match of result.matches) {
        console.error(`  - ${match.recipe.id} matched by ${match.matchedField}: ${recipeLabel(match.recipe)}`);
      }
      throw new Error(`Recipe match failed for ${configuredName}.`);
    }
    validateFreezeDryRecipe(result.recipe, configuredName);
    freezeDryMatches.push({ configuredName, ...result });
  }

  console.log('[seed-data] matched freeze-dry recipes:');
  for (const match of freezeDryMatches) {
    console.log(`  - ${match.configuredName}: ${match.recipe.id} (${match.matchedField})`);
  }

  const plan = [];

  const rawUpdates = {};
  const rawCurrentPresets = Array.isArray(rawRecipe.unitPresets) ? rawRecipe.unitPresets : [];
  if (!arraysEqual(rawCurrentPresets, RAW_RECIPE_UNIT_PRESETS)) {
    rawUpdates.unitPresets = RAW_RECIPE_UNIT_PRESETS;
  }
  const rawCurrentMethods = Array.isArray(rawRecipe.productionMethods) ? rawRecipe.productionMethods : [];
  const rawNextMethods = normalizeProductionMethods(rawCurrentMethods);
  const methodLabelChanges = rawCurrentMethods
    .map((method, index) => ({
      index,
      methodKey: method?.methodKey,
      from: method?.label,
      to: rawNextMethods[index]?.label,
      known: Boolean(PRODUCTION_METHOD_LABEL_MAP[method?.methodKey]),
    }))
    .filter((change) => change.known && change.from !== change.to);

  if (methodLabelChanges.length > 0) {
    rawUpdates.productionMethods = rawNextMethods;
  }

  console.log('[seed-data] plan: raw recipe');
  console.log(`  - recipes/${RAW_RECIPE_ID} ${recipeLabel(rawRecipe)}`);
  console.log(`    unitPresets: ${JSON.stringify(rawCurrentPresets)} -> ${JSON.stringify(RAW_RECIPE_UNIT_PRESETS)}${rawUpdates.unitPresets ? '' : ' (no change)'}`);
  if (rawCurrentMethods.length === 0) {
    console.log('    productionMethods: [] (no change)');
  } else {
    for (const method of rawCurrentMethods) {
      const mapped = PRODUCTION_METHOD_LABEL_MAP[method?.methodKey];
      if (!mapped) {
        console.log(`    productionMethods.${method?.methodKey}: skip (unknown key), label=${JSON.stringify(method?.label)}`);
      } else {
        const suffix = method.label === mapped ? ' (no change)' : '';
        console.log(`    productionMethods.${method.methodKey}.label: ${JSON.stringify(method.label)} -> ${JSON.stringify(mapped)}${suffix}`);
      }
    }
  }
  if (Object.keys(rawUpdates).length > 0) {
    plan.push({ type: 'update', path: `recipes/${RAW_RECIPE_ID}`, ref: db.collection('recipes').doc(RAW_RECIPE_ID), data: rawUpdates });
  }

  console.log('[seed-data] plan: freeze-dry unitPresets and _1 supplementTypes');
  for (const match of freezeDryMatches) {
    const recipe = match.recipe;
    const currentPresets = Array.isArray(recipe.unitPresets) ? recipe.unitPresets : [];
    const recipeUpdates = {};
    if (!arraysEqual(currentPresets, FREEZE_DRY_UNIT_PRESETS)) {
      recipeUpdates.unitPresets = FREEZE_DRY_UNIT_PRESETS;
    }

    console.log(`  - recipes/${recipe.id} ${recipeLabel(recipe)}`);
    console.log(`    unitPresets: ${JSON.stringify(currentPresets)} -> ${JSON.stringify(FREEZE_DRY_UNIT_PRESETS)}${recipeUpdates.unitPresets ? '' : ' (no change)'}`);
    if (Object.keys(recipeUpdates).length > 0) {
      plan.push({ type: 'update', path: `recipes/${recipe.id}`, ref: db.collection('recipes').doc(recipe.id), data: recipeUpdates });
    }

    const supplementId = makeSupplementId(recipe.id, 1);
    const supplementRef = db.collection('supplementTypes').doc(supplementId);
    const supplementDoc = supplements.find((supplement) => supplement.id === supplementId);
    if (supplementDoc) {
      console.log(`    supplementTypes/${supplementId}: exists, skip`);
      continue;
    }

    const supplementData = {
      id: supplementId,
      recipeId: recipe.id,
      recipeName: recipeLabel(recipe),
      unit: 1,
      name: makeSupplementName(recipeLabel(recipe), 1),
      active: recipe.active !== false,
      sortOrder: makeSupplementSortOrder(recipe.sortOrder, 0),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: null,
    };
    console.log(`    supplementTypes/${supplementId}: create ${JSON.stringify({
      ...supplementData,
      updatedAt: '<serverTimestamp>',
      createdAt: '<serverTimestamp>',
    })}`);
    plan.push({ type: 'set', path: `supplementTypes/${supplementId}`, ref: supplementRef, data: supplementData });

    const stockRef = db.collection('supplementStock').doc(supplementId);
    const stockDoc = supplementStocks.find((stock) => stock.id === supplementId);
    if (stockDoc) {
      console.log(`    supplementStock/${supplementId}: exists, skip`);
      continue;
    }

    const stockData = {
      id: supplementId,
      supplementTypeId: supplementId,
      currentQty: NEW_SUPPLEMENT_DEFAULT_STOCK,
      updatedAt: FieldValue.serverTimestamp(),
    };
    console.log(`    supplementStock/${supplementId}: create ${JSON.stringify({
      ...stockData,
      updatedAt: '<serverTimestamp>',
    })}`);
    plan.push({ type: 'set', path: `supplementStock/${supplementId}`, ref: stockRef, data: stockData });
  }

  return plan;
}

async function executePlan(plan) {
  let actualWrites = 0;
  for (const item of plan) {
    if (item.type === 'update') {
      await item.ref.update(item.data);
    } else if (item.type === 'set') {
      await item.ref.set(item.data);
    } else {
      throw new Error(`Unknown plan item type: ${item.type}`);
    }
    actualWrites += 1;
    console.log(`[seed-data] wrote: ${item.path}`);
  }
  return actualWrites;
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

  console.log(`[seed-data] mode: ${execute ? 'execute' : 'dry-run'}`);
  console.log(`[seed-data] project: ${projectId}`);
  console.log(`[seed-data] credential: ${serviceAccount ? 'service-account-key' : 'application-default'}`);

  const plan = await collectPlan(db);
  console.log(`[seed-data] total intended write ops: ${plan.length}`);

  if (!execute) {
    console.log('[seed-data] dry-run only. No documents written.');
    return;
  }

  const totalWritten = await executePlan(plan);
  console.log(`[seed-data] total actual write ops: ${totalWritten}`);
  console.log('[seed-data] backup reminder: no pre-seed value backup; post-cleanup state is the natural fallback.');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[seed-data] failed:', err);
    process.exit(1);
  });
