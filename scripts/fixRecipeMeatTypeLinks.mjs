// Retired one-time migration. The former script could alter every recipe and
// meat stock, then hard-delete meat types by setting DRY_RUN=false.
// A replacement needs a reviewed, version-bound migration and rollback plan.
console.error('LEGACY_RECIPE_MEAT_LINKS_TOOL_RETIRED: this migration is disabled.');
process.exitCode = 2;
