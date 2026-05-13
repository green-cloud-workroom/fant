export function makeSupplementId(recipeId, unit) {
  return `${recipeId}_${unit}`;
}

export function makeSupplementName(recipeName, unit) {
  return `${recipeName} ${unit}용 영양제`;
}

export function makeSupplementSortOrder(recipeSortOrder, unitIndex) {
  return (recipeSortOrder || 0) * 100 + unitIndex;
}
