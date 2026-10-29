// Retired initialization tools are inspection-only. This is an accident guard,
// not an IAM boundary or authorization to perform recovery/maintenance writes.
const FLAGS = Object.freeze({
  wipeFirestoreOperationalData: ['email', 'password'],
  wipeFirestoreOperationalDataAdmin: ['key'],
  seedCleanup: ['key'],
  seedDataInput: ['key'],
});

function reject(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

export function legacyMaintenanceUsage(tool) {
  return `Retired initialization tool: read-only inspection.\nnode scripts/${tool}.mjs --project <project-id> --database "(default)" [--dry-run]\n--execute is disabled for every target. Recovery and claims tools are separate.`;
}

export function readLegacyMaintenanceTarget(argv, tool) {
  if (!Object.hasOwn(FLAGS, tool)) reject('LEGACY_TOOL_UNKNOWN', 'Unknown legacy initialization tool.');
  // Reject old execute syntax before even reading a key, credentials or target.
  if (argv.some(arg => arg === '--execute' || arg.startsWith('--execute='))) {
    reject('LEGACY_WRITES_RETIRED', 'This initialization tool is read-only. --execute is retired for every project/database; use a separately reviewed maintenance procedure.');
  }
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  const allowed = new Set(['project', 'database', 'dry-run', ...FLAGS[tool]]);
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
    const match = /^--([a-z][a-z-]*)(?:=(.*))?$/.exec(argv[i]);
    if (!match || match[0] !== argv[i] || !allowed.has(match[1])) reject('LEGACY_ARGS_INVALID', 'Unknown or positional argument. Use --help.');
    const [, key, inline] = match;
    if (args.has(key)) reject('LEGACY_ARGS_INVALID', `Duplicate --${key} is not allowed.`);
    if (key === 'dry-run') {
      if (inline !== undefined) reject('LEGACY_ARGS_INVALID', '--dry-run takes no value.');
      args.set(key, true);
      continue;
    }
    const value = inline === undefined ? argv[++i] : inline;
    if (!value || value.startsWith('--')) reject('LEGACY_ARGS_INVALID', `--${key} requires a value.`);
    args.set(key, value);
  }
  const projectId = args.get('project'), databaseId = args.get('database');
  if (!projectId || !databaseId) reject('LEGACY_TARGET_REQUIRED', 'Explicit --project and --database are required; credential/environment/default target inference is disabled.');
  if (projectId !== projectId.trim() || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)) reject('LEGACY_TARGET_INVALID', '--project must be a lowercase project ID, not a number, alias, URL or resource path.');
  // These old tools only implement default-DB reads. Never accept a named DB
  // while the underlying client/REST/SDK still points to (default).
  if (databaseId !== '(default)') reject('LEGACY_TARGET_INVALID', 'This legacy inspector supports only explicit --database "(default)".');
  return { args, target: Object.freeze({ projectId, databaseId, mode: 'dry-run' }) };
}

export function assertLegacyProjectBinding(target, actualProjectId) {
  if (!target || actualProjectId !== target.projectId) {
    reject('LEGACY_PROJECT_MISMATCH', 'Configured/credential project does not match the explicit --project.');
  }
}
