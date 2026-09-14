// No disk persistence: every identity/claims/day transition invalidates all data.
export function createSessionStore() {
  let epoch = 0;
  let identity = null;
  const values = new Map();
  const observers = new Map();
  const clearObservers = new Set();
  return {
    get epoch() { return epoch; },
    get identity() { return identity; },
    peek: key => values.get(key),
    publish(key, value, expectedEpoch = epoch) {
      if (expectedEpoch !== epoch) return false;
      values.set(key, Object.freeze(value));
      observers.get(key)?.forEach(callback => callback(value));
      return true;
    },
    subscribe(key, callback) {
      if (!observers.has(key)) observers.set(key, new Set());
      observers.get(key).add(callback);
      if (values.has(key)) callback(values.get(key));
      return () => { const set = observers.get(key); set?.delete(callback); if (!set?.size) observers.delete(key); };
    },
    onClear(callback) { clearObservers.add(callback); return () => clearObservers.delete(callback); },
    delete(key) { values.delete(key); },
    clear(nextIdentity = null) {
      epoch++;
      identity = nextIdentity;
      values.clear(); observers.clear();
      clearObservers.forEach(callback => callback());
    },
    inspect: () => ({ epoch, entries: values.size, subscriptions: observers.size }),
  };
}
export const sessionStore = createSessionStore();
