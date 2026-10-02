import {doc} from 'firebase/firestore';
import {db} from '../firebase.js';

export async function loadPageStaff(scope) {
  const keys=['senior','lead','office'];
  const snapshots=await Promise.all(keys.map(key=>scope.getDoc(doc(db,'staffGroups',key))));
  return Object.fromEntries(keys.map((key,i)=>[key,snapshots[i].exists()?snapshots[i].data().members||[]:[]]));
}
