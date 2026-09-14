import { onSnapshot, queryEqual } from 'firebase/firestore';
import { createQueryRegistry } from './queryRegistry.js';
import { createListenerPool } from './listenerPool.js';
import { sessionStore } from './sessionStore.js';
import { createReadScope } from '../services/readScope.js';
import { recordRead } from '../perf/metrics.js';

export const displayPool = createListenerPool({
  store: sessionStore, registry: createQueryRegistry(queryEqual), onRead: recordRead,
  listen: (ref, next, error) => onSnapshot(ref, { includeMetadataChanges: true }, next, error),
});
export function createDisplayScope(owner) {
  return createReadScope({
    getDoc: ref => displayPool.getDoc(ref, owner),
    getDocs: ref => displayPool.getDocs(ref, owner),
  });
}
