// A successful production registration is audit history, not staff follow-up.
// Match the writer's exact action pair; all other/unknown work stays actionable.
export function isHistoryOnlyActivity(log) {
  return log?.action === 'production' && log.subAction === 'create';
}
