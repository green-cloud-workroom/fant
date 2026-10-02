// Serializes auto-log evaluation independently of DOM rendering.
export function createAutoLogCoordinator() {
  const pending = new Map();
  return {
    run(key, evaluate) {
      if (!pending.has(key)) {
        const task = Promise.resolve().then(evaluate);
        pending.set(key, task);
        task.finally(() => { if (pending.get(key) === task) pending.delete(key); }).catch(() => {});
      }
      return pending.get(key);
    },
    clear() { pending.clear(); },
  };
}
