// Retired one-time migration. DRY_RUN=false formerly changed every matching
// recipe ingredient and its automatic inventory deduction setting in place.
console.error('LEGACY_RECIPE_MEAT_LINKS2_TOOL_RETIRED: this migration is disabled.');
process.exitCode = 2;
