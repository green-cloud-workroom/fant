import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { environment } from './helpers/modules.mjs';
import { makeEditableFirestore } from './fixtures/editableFirestore.mjs';

async function setup({ units = [1], oldUnits = [1], stockQty = 0,
  withType = true, withStock = true, withLog = false, withProduction = false } = {}) {
  const fake = makeEditableFirestore();
  const recipe = { id:'r1', name:'검증 레시피', category:'freezeDry', target:'cat',
    unitPresets:oldUnits, active:true, sortOrder:2 };
  fake.state.rows.recipes = [recipe];
  fake.state.rows.supplementTypes = withType ? [{ id:'r1_1', recipeId:'r1', unit:1 }] : [];
  fake.state.rows.supplementStock = withStock ? [{ id:'r1_1', supplementTypeId:'r1_1', currentQty:stockQty }] : [];
  fake.state.rows.supplementLogs = withLog ? [{ id:'old-log', supplementTypeId:'r1_1', qty:-1 }] : [];
  fake.state.rows.productions = withProduction ? [{ id:'old-production', recipeId:'r1', status:'deleted' }] : [];
  const e = await environment({ session:true, firestore:fake,
    instrument:{ 'src/pages/recipe.js':'\nexport {saveRecipeWithCommand,deleteRecipeWithCommand}; export function seedRecipeTest(rows,units){recipes=rows;currentUnitPresets=units;}' } });
  e.synthetic(resolve('src/firebase.js'), { db:{}, auth:{ currentUser:{ uid:'fixture',
    getIdTokenResult:async()=>({claims:{roles:{production:'office'}}}) } } });
  const values = { recipeName:'changed', recipeCategory:'freezeDry', recipeTarget:'cat',
    recipeColor:'#123456', recipeNote:'memo', requiresSeparation:'false',
    freezeDryBagCount:'2', freezePanCount:'3' };
  for (const [id,value] of Object.entries(values)) e.nodes[id] = {value};
  e.nodes.recipeUsesSupplement = {checked:true};
  e.context.document.querySelectorAll = () => [];
  const alerts=[];
  e.context.alert = message => alerts.push(String(message));
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.nodes.mainContent,'recipe');
  const resource = (await e.load('src/state/pageResources.js')).pageResource('recipe');
  await resource.load(async scope => (await scope.getDocs(e.api.collection({},'recipes')))
    .docs.map(d => ({id:d.id,...d.data()})));
  const page = await e.load('src/pages/recipe.js');
  page.seedRecipeTest(fake.state.rows.recipes,units);
  const commands = await e.load('src/services/readCommand.js');
  const call = fn => commands.withReadCommand(resource, command => {
    command.isCurrent = () => false;
    return fn(command);
  });
  return {e,alerts,save:()=>call(c=>page.saveRecipeWithCommand('r1',c)),
    remove:()=>call(c=>page.deleteRecipeWithCommand(recipe,c))};
}

for (const options of [
  { name:'zero stock SKU',withType:true,withStock:true },
  { name:'history without stock',withType:false,withStock:false,withLog:true },
  { name:'old production reference',withType:false,withStock:false,withProduction:true },
]) test(`unit preset removal holds ${options.name} before any write`, async () => {
  const {e,alerts,save} = await setup({units:[],oldUnits:[1],...options});
  await save();
  assert.equal(e.state.commits.length,0);
  assert.equal(e.state.rows.recipes[0].unitPresets.length,1);
  assert.match(alerts.at(-1),/생산단위를 삭제할 수 없습니다/);
});

test('whole recipe deletion holds a SKU even with zero stock and no logs', async () => {
  const {e,alerts,remove} = await setup({stockQty:0});
  await remove();
  assert.equal(e.state.commits.length,0);
  assert.equal(e.state.rows.recipes.length,1);
  assert.match(alerts.at(-1),/레시피를 삭제할 수 없습니다/);
});

test('whole recipe deletion uses current server presets when the display is stale', async () => {
  const {e,remove} = await setup({oldUnits:[],withType:false,withStock:false});
  e.state.rows.recipes[0] = {...e.state.rows.recipes[0], unitPresets:[1]};
  await assert.rejects(remove(),/원본이 변경/);
  assert.equal(e.state.commits.length,0);
});

test('metadata edit keeps existing SKU and stock', async () => {
  const {e,save} = await setup({units:[1],oldUnits:[1],stockQty:0});
  await save();
  assert.equal(e.state.commits.length,1);
  assert.equal(e.state.rows.recipes[0].name,'changed');
  assert.equal(e.state.rows.supplementStock[0].currentQty,0);
});

test('newly introduced preset still creates zero stock', async () => {
  const {e,save} = await setup({units:[1],oldUnits:[],withType:false,withStock:false});
  await save();
  assert.equal(e.state.commits.length,1);
  assert.equal(e.state.rows.supplementStock.find(row=>row.id==='r1_1').currentQty,0);
});
