// Retired one-time stock repair. The former --execute path zeroed four fixed
// production lots without a current-version check or atomic commit.
console.error('LEGACY_PROCESSED_LOTS_CLEANUP_RETIRED: this repair is disabled.');
process.exitCode = 2;
