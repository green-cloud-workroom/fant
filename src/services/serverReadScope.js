import { getDocFromServer, getDocsFromServer } from 'firebase/firestore';
import { createReadScope } from './readScope.js';

// Commands must never accept a display cache as proof of server state.
export function createServerReadScope() {
  return createReadScope({ getDoc: getDocFromServer, getDocs: getDocsFromServer, serverOnly: true });
}
