export function createListenerPool({ store, registry, listen, graceMs = 30_000, timeoutMs = 15_000, onRead = () => {} }) {
  const entries = new Map();
  const owners = new Map();
  const notifications = new Map();
  function remove(entry) {
    if (entries.get(entry.key) !== entry) return;
    clearTimeout(entry.timer);
    clearTimeout(entry.initialTimer);
    entry.unsubscribe?.();
    const error = Object.assign(new Error('읽기 세션이 종료되었습니다.'), { code: 'session-ended' });
    entry.waiters.splice(0).forEach(w => w.reject(error));
    entries.delete(entry.key);
    registry.forget?.(entry.key);
    store.delete(entry.key);
    for (const owner of entry.owners) {
      const set = owners.get(owner); set?.delete(entry); if (!set?.size) owners.delete(owner);
    }
  }
  function notify(entry) { entry.owners.forEach(owner => notifications.get(owner)?.({ error: entry.error || null })); }
  function acquire(ref, kind, owner) {
    const { key } = registry.resolve(ref, kind);
    let entry = entries.get(key);
    if (entry?.error) { remove(entry); entry = null; }
    if (!entry) {
      entry = { key, ref, kind, owners: new Set(), waiters: [], epoch: store.epoch, revision: 0 };
      entries.set(key, entry);
      onRead(false);
      entry.unsubscribe = listen(ref, snapshot => {
        if (entry.epoch !== store.epoch || entries.get(key) !== entry) return;
        const previous = store.peek(key);
        const server = !snapshot.metadata?.fromCache && !snapshot.metadata?.hasPendingWrites;
        const value = { snapshot, revision: ++entry.revision, fromCache: !server,
          serverObservedAt: server ? Date.now() : previous?.serverObservedAt || null, status: 'ready' };
        store.publish(key, value, entry.epoch);
        // A first cache-only empty result is not an authoritative empty screen.
        if (server || previous?.serverObservedAt) {
          clearTimeout(entry.initialTimer);
          entry.waiters.splice(0).forEach(w => w.resolve(snapshot));
        }
        if (previous) notify(entry);
      }, error => {
        if (entry.epoch !== store.epoch || entries.get(key) !== entry) return;
        entry.error = error;
        clearTimeout(entry.initialTimer);
        store.publish(key, { status: 'error', error }, entry.epoch);
        entry.waiters.splice(0).forEach(w => w.reject(error));
        notify(entry);
      });
      entry.initialTimer = setTimeout(() => {
        if (store.peek(key)?.serverObservedAt || entries.get(key) !== entry) return;
        entry.error = Object.assign(new Error('서버 응답을 확인하지 못했습니다. 연결 후 다시 시도해주세요.'), { code: 'unavailable' });
        entry.waiters.splice(0).forEach(w => w.reject(entry.error));
        store.publish(key, { status: 'error', error: entry.error }, entry.epoch);
        notify(entry);
      }, timeoutMs);
      entry.initialTimer.unref?.();
    } else onRead(true);
    clearTimeout(entry.timer);
    entry.owners.add(owner);
    if (!owners.has(owner)) owners.set(owner, new Set());
    owners.get(owner).add(entry);
    const cached = store.peek(key);
    if (cached?.status === 'ready' && cached.serverObservedAt) return Promise.resolve(cached.snapshot);
    if (entry.error) return Promise.reject(entry.error);
    return new Promise((resolve, reject) => entry.waiters.push({ resolve, reject }));
  }
  function releaseOwner(owner, immediate = false) {
    notifications.delete(owner);
    for (const entry of owners.get(owner) || []) {
      entry.owners.delete(owner);
      if (!entry.owners.size) {
        if (immediate) remove(entry);
        else entry.timer = setTimeout(() => { if (!entry.owners.size) remove(entry); }, graceMs);
      }
    }
    owners.delete(owner);
  }
  function dispose() {
    for (const entry of entries.values()) remove(entry);
    owners.clear(); notifications.clear(); registry.clear();
  }
  store.onClear(dispose);
  return {
    getDoc: (ref, owner) => acquire(ref, 'doc', owner),
    getDocs: (ref, owner) => acquire(ref, 'query', owner),
    onChange(owner, callback) { notifications.set(owner, callback); return () => notifications.delete(owner); },
    releaseOwner, dispose,
    inspect: () => ({ listeners: entries.size, owners: owners.size, waiting: [...entries.values()].reduce((n,e)=>n+e.waiters.length,0) }),
  };
}
