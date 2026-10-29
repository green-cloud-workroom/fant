import test from 'node:test';
import assert from 'node:assert/strict';
import {pageEnvironment} from './helpers/pageDom.mjs';
test('ingredient-name synchronization adds a fresh token and preserves locked production quantities',async()=>{
 const e=await pageEnvironment('settings',{instrument:'\nexport {mergeIngredientNames};'});
 try{
  e.state.rows.productions=[{id:'p',date:e.today,status:'active',recipeId:'r1',lockedByCompletion:true,mutationToken:'previous-token-000000000000',productionUnitQty:1,ingredientsSnapshot:[{name:'닭',requiredQtyG:1000,meatTypeId:'m1'}]}];
  await e.page.renderSettings();await e.page.mergeIngredientNames(['닭'],'새 닭','검증 담당자',()=>{});
  assert.deepEqual(e.alerts,[]);
  const p=e.state.rows.productions[0];assert.equal(p.ingredientsSnapshot[0].name,'새 닭');assert.equal(p.ingredientsSnapshot[0].requiredQtyG,1000);assert.equal(p.productionUnitQty,1);assert.equal(p.lockedByCompletion,true);
  assert.equal(typeof p.mutationToken,'string');assert.notEqual(p.mutationToken,'previous-token-000000000000');
  assert.equal(e.state.rows.recipes[0].ingredients[0].name,'새 닭');
 }finally{await e.cleanup();}
});
