import { DELIVERY_RELEASED, quantityAssessment, automationRange } from './statsAutomation.js';
import { supplyEvents, usageEvents } from './statsLogic.js';
import { currentUser } from '../app.js';
import { sessionStore } from '../state/sessionStore.js';
import { getTodayKST } from '../utils/date.js';

// Both the handler and caller path are gated, not just the visible button.
export async function checkQuantityBeforeSave(candidate, isPageCurrent = () => true) {
  if (!DELIVERY_RELEASED) return { approved: true, review: null };
  const uid = currentUser?.uid, epoch = sessionStore.epoch;
  const current = () => !!uid && uid === currentUser?.uid && epoch === sessionStore.epoch && isPageCurrent();
  if (!current()) return { approved: false, review: null };
  const [{ collection, getDocsFromServer }, { db }] = await Promise.all([import('firebase/firestore'), import('../firebase.js')]);
  if (!current()) return { approved: false, review: null };
  const name = candidate.itemId.split(':')[0];
  if (!['meatLogs', 'eggLogs', 'bagLogs', 'supplementLogs'].includes(name)) throw Error('수량 검증 품목 오류');
  const snap = await getDocsFromServer(collection(db, name));
  if (!current()) return { approved: false, review: null };
  const data = { [name]: snap.docs.map(d => ({ ...d.data(), id: d.id })) }, range = automationRange(getTodayKST());
  const events = candidate.direction === 'usage' ? usageEvents(data, range).events : supplyEvents(data, range).events;
  const assessment = quantityAssessment({ ...candidate, source: 'unsaved' }, events);
  if (assessment.state !== 'review') return { approved: true, review: null };
  const { showPromptModal } = await import('../utils/modal.js');
  if (!current()) return { approved: false, review: null };
  const reason = await showPromptModal({ title: '수량 확인', label: '이 수량으로 등록하는 사유', required: true,
    message: `이전 기록 중앙값(${assessment.baseline.toLocaleString('ko-KR')}${assessment.unit})과 차이가 큽니다. 입력 수량과 g/kg 단위를 확인해주세요.`,
    confirmText: '수량 확인 후 저장' });
  if (!current() || !reason) return { approved: false, review: null };
  return { approved: true, review: { version: 'stats-shadow-v1', reason, baseline: assessment.baseline,
    ratio: assessment.ratio, samples: assessment.samples, unit: assessment.unit, confirmedByUid: uid } };
}
