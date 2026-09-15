import { onSnapshot, queryEqual } from 'firebase/firestore';
import { createQueryRegistry } from './queryRegistry.js';
import { createListenerPool } from './listenerPool.js';
import { sessionStore } from './sessionStore.js';
import { createReadScope } from '../services/readScope.js';
import { recordRead } from '../perf/metrics.js';
import { fingerprint } from '../services/actionGateway.js';

export const displayPool = createListenerPool({
  store: sessionStore, registry: createQueryRegistry(queryEqual), onRead: recordRead,
  sameData(previous,next) {
    if(!previous)return false;
    if(typeof next.docChanges==='function')return next.docChanges({includeMetadataChanges:false}).length===0;
    const value=snapshot=>snapshot.docs?snapshot.docs.map(d=>({id:d.id,...d.data()})):snapshot.exists()?snapshot.data():null;
    return fingerprint(value(previous))===fingerprint(value(next));
  },
  listen: (ref, next, error) => onSnapshot(ref, { includeMetadataChanges: true }, next, error),
});
export function createDisplayScope(owner) {
  return Object.assign(createReadScope({
    getDoc: ref => displayPool.getDoc(ref, owner),
    getDocs: ref => displayPool.getDocs(ref, owner),
  }),{displayOwner:owner});
}
