import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {environment} from './helpers/modules.mjs';
import {makeEditableFirestore} from './fixtures/editableFirestore.mjs';

async function setup({units=[1],oldUnits=[1],stock=true,fault}={}) {
  const fake=makeEditableFirestore();
  fake.state.rows.recipes=[{id:'r1',name:'old',category:'freezeDry',target:'cat',unitPresets:oldUnits,active:true,sortOrder:2}];
  fake.state.rows.supplementTypes=[{id:'r1_1',recipeId:'r1',unit:1,sortOrder:200}];
  fake.state.rows.supplementStock=stock?[{id:'r1_1',supplementTypeId:'r1_1',currentQty:37}]:[];
  const e=await environment({session:true,firestore:fake,instrument:{'src/pages/recipe.js':'\nexport { saveRecipeWithCommand }; export function seedRecipeTest(rows,units){recipes=rows;currentUnitPresets=units;}'}});
  e.synthetic(resolve('src/firebase.js'),{db:{},auth:{currentUser:{uid:'fixture',getIdTokenResult:async()=>({claims:{roles:{production:'office'}}})}}});
  const values={recipeName:'changed',recipeCategory:'freezeDry',recipeTarget:'cat',recipeColor:'#123456',recipeNote:'memo',requiresSeparation:'false',freezeDryBagCount:'2',freezePanCount:'3'};
  for(const [id,value] of Object.entries(values))e.nodes[id]={value};
  e.nodes.recipeUsesSupplement={checked:true};
  e.context.document.querySelectorAll=()=>[];
  const alerts=[];e.context.alert=message=>alerts.push(message);
  (await e.load('src/utils/pageLifecycle.js')).beginPage(e.nodes.mainContent,'recipe');
  const resource=(await e.load('src/state/pageResources.js')).pageResource('recipe');
  await resource.load(async scope=>(await scope.getDocs(e.api.collection({},'recipes'))).docs.map(d=>({id:d.id,...d.data()})));
  const recipe=await e.load('src/pages/recipe.js');recipe.seedRecipeTest(fake.state.rows.recipes,units);
  const command=await e.load('src/services/readCommand.js');
  if(fault)fake.state.failNextCommit=fault;
  const save=()=>command.withReadCommand(resource,c=>{c.isCurrent=()=>false;return recipe.saveRecipeWithCommand('r1',c);});
  return {...e,resource,save,alerts};
}

test('recipe edit keeps existing supplement stock and writes the recipe/SKU together',async()=>{
  const e=await setup();await e.save();assert.equal(e.state.rows.recipes[0].name,'changed');assert.equal(e.state.rows.recipes[0].sortOrder,2);assert.equal(e.state.rows.supplementStock[0].currentQty,37);assert.equal(e.state.commits.length,1);assert.equal(e.state.commits[0].filter(w=>w.target.path==='supplementStock/r1_1').length,0);
});
test('reintroduced preset preserves an existing stock document; missing stock starts at zero',async()=>{
  for(const stock of [true,false]){const e=await setup({oldUnits:[],stock});await e.save();assert.equal(e.state.rows.supplementStock.find(row=>row.id==='r1_1').currentQty,stock?37:0);assert.equal(e.state.commits.length,1);}
});
test('a recipe write with lost acknowledgement is not automatically repeated',async()=>{
  const e=await setup({fault:'after'});await e.save();assert.equal(e.resource.blocked,true);assert.equal(e.state.rows.recipes[0].name,'changed');assert.equal(e.state.commits.length,1);await assert.rejects(e.save,/직전 저장 결과/);assert.equal(e.state.commits.length,1);
});
test('changed displayed recipe aborts the real save handler before a batch is sent',async()=>{
  const e=await setup();e.state.rows.recipes[0].name='external';await assert.rejects(e.save,/원본이 변경/);assert.equal(e.state.commits.length,0);assert.equal(e.nodes.recipeName.value,'changed');
});
