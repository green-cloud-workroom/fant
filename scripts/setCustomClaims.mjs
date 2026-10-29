// Retired: this legacy claims command cannot safely infer a live Auth target.
// A future reclaim needs a separately reviewed, exact-user plan and rollback evidence.
console.error('LEGACY_CUSTOM_CLAIMS_TOOL_RETIRED: setCustomClaims is disabled.');
process.exitCode = 2;
