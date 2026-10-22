import { collection, getDocsFromServer } from 'firebase/firestore';
import { db } from '../firebase.js';
import { currentUser, currentUserRole } from '../app.js';
import { sessionStore } from '../state/sessionStore.js';
import { evaluateStatsAutomation, AUTOMATION_SOURCES } from './statsAutomation.js';
import { getTodayKST } from '../utils/date.js';

export { AUTOMATION_SOURCES };

// Manual verification only: no listener, writes, background evaluation, or delivery.
export async function loadAutomationPreview(isPageCurrent = () => true) {
  const epoch = sessionStore.epoch, uid = currentUser?.uid, today = getTodayKST();
  const current = () => !!uid && currentUser?.uid === uid && sessionStore.epoch === epoch
    && ['admin', 'office'].includes(currentUserRole) && getTodayKST() === today && isPageCurrent();
  if (!current()) throw Error('권한 또는 화면이 변경되었습니다.');
  const rows = await Promise.all(AUTOMATION_SOURCES.map(async name => {
    if (!current()) throw Error('세션이 변경되었습니다.');
    const snapshot = await getDocsFromServer(collection(db, name));
    if (!current()) throw Error('세션이 변경되었습니다.');
    return [name, snapshot.docs.map(d => ({ ...d.data(), id: d.id }))];
  }));
  if (!current()) throw Error('세션이 변경되었습니다.');
  return { ...evaluateStatsAutomation(Object.fromEntries(rows), { today, complete: true }),
    observedAt: new Date().toISOString(), snapshotNote: '서버 원본 순차 관측. 검증용이며 동시점 트랜잭션 스냅샷은 아닙니다.' };
}
