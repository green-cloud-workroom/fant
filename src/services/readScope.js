import { getDoc, getDocs, queryEqual } from 'firebase/firestore';

// A single screen refresh owns this scope. Never retain it across saves or
// navigations: stock/closing actions must create a fresh scope when validating.
export function createReadScope() {
  const documents = new Map();
  const queries = [];
  const tasks = new Map();

  function once(key, load) {
    if (!tasks.has(key)) {
      const pending = Promise.resolve().then(load);
      tasks.set(key, pending);
      pending.catch(() => { if (tasks.get(key) === pending) tasks.delete(key); });
    }
    return tasks.get(key);
  }

  return {
    once,
    getDoc(ref) {
      if (!documents.has(ref.path)) {
        const pending = getDoc(ref);
        documents.set(ref.path, pending);
        pending.catch(() => documents.delete(ref.path));
      }
      return documents.get(ref.path);
    },
    getDocs(ref) {
      const existing = queries.find(entry => queryEqual(entry.ref, ref));
      if (existing) return existing.pending;
      const entry = { ref, pending: getDocs(ref) };
      queries.push(entry);
      entry.pending.catch(() => {
        const index = queries.indexOf(entry);
        if (index !== -1) queries.splice(index, 1);
      });
      return entry.pending;
    },
  };
}
