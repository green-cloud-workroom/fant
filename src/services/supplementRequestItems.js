// Shared pure validator: copy this file verbatim into the recipe app. No dependencies.
export function requestItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 60) throw Error('품목은 1~60개를 선택해주세요.');
  const seen = new Set();
  return items.map(i=>{
    if (!i || ['supplementTypeId','recipeId','recipeName'].some(key=>typeof i[key]!=='string'||!i[key]) || typeof i.unit !== 'number' || !Number.isFinite(i.unit)
      || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 999 || seen.has(i.supplementTypeId)) throw Error('품목·개수(1~999)를 확인해주세요.');
    seen.add(i.supplementTypeId);
    return {supplementTypeId:i.supplementTypeId,recipeId:i.recipeId,recipeName:i.recipeName,unit:i.unit,qty:i.qty};
  });
}
