// Retired one-time migration: the former path inferred categories from names,
// overwrote all active products, and deleted inactive products without a
// version fence. All modes stop before imports, authentication, or reads.
// Replacement contract: docs/M0B_FROZEN_CATEGORY_MIGRATION_SEAL_20261029.md.
console.error('LEGACY_FROZEN_PRODUCT_CATEGORY_TOOL_RETIRED: this migration is disabled.');
process.exitCode = 2;
