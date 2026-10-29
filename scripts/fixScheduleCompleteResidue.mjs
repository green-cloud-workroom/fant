// Retired one-time repair. The former --apply path made separate lot, log,
// and ledger writes without an atomic rollback or current-version fence.
console.error('LEGACY_SCHEDULE_RESIDUE_FIX_RETIRED: this repair is disabled.');
process.exitCode = 2;
