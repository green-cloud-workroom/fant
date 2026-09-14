// SDK semantic equality preserves filters/order/limits and missing-field rules.
// Query internals are never serialized or parsed.
export function createQueryRegistry(equal) {
  const entries = [];
  let sequence = 0;
  return {
    resolve(ref, kind) {
      const found = entries.find(e => e.kind === kind && (kind === 'doc' ? e.ref.path === ref.path : equal(e.ref, ref)));
      if (found) return found;
      const entry = { key: `${kind}:${ref.path || 'query'}:${++sequence}`, ref, kind };
      entries.push(entry);
      return entry;
    },
    clear() { entries.length = 0; },
  };
}
