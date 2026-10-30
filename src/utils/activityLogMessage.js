// Display only. Return raw text; each HTML renderer must escape the result.
export function displaySupplementLogMessage(log, types = []) {
  const message = log.message || '(메시지 없음)';
  const id = log.details?.supplementTypeId;
  const candidates = !id && (log.details?.sourceCollection === 'supplementLogs' || log.action === 'supplementStock')
    ? types
    : typeof id === 'string' && /^[A-Za-z0-9_-]+_\d+(?:\.\d+)?$/.test(id)
      ? types.filter(type => type.id === id)
      : [];
  const names = new Map(candidates
    .filter(type => typeof type.id === 'string' && type.id && typeof type.name === 'string' && type.name.trim())
    .map(type => [type.id, type.name]));
  if (!names.size) return message;
  const ids = [...names.keys()].sort((a, b) => b.length - a.length)
    .map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const token = new RegExp(`(?<![A-Za-z0-9_-])(?:${ids.join('|')})(?![A-Za-z0-9_-])`, 'g');
  return message.replace(token, matched => names.get(matched));
}
