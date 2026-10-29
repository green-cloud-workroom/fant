// Legacy shared Firestore Rules CLI is retired. The pure receipt patch module remains available for isolated review.
// Do not initialize Firebase, read credentials, load evidence, or write files from this entry point.
console.error('RECEIPT_RULES_CLI_RETIRED: shared Rules ownership and deployed-app compatibility are unresolved.');
process.exitCode = 2;
