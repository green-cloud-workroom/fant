import { auth } from '../firebase.js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { sessionStore } from '../state/sessionStore.js';
import { getPageContext } from '../utils/pageLifecycle.js';
import { getTodayKST } from '../utils/date.js';
import { newProductionWriteToken } from '../utils/productionWriteToken.js';

const invokeServer = async payload => {
  const command = httpsCallable(getFunctions(auth.app, 'asia-northeast3'), 'productionClosingCommand', {timeout: 120000});
  return (await command(payload)).data;
};
const session = () => ({uid: auth.currentUser?.uid, epoch: sessionStore.epoch, day: getTodayKST()});

// Prepare while opening the confirmation modal, not after the user confirms.
// An unknown response is never retried with a newly generated command ID.
export async function prepareProductionClosing(date, action, {
  invoke = invokeServer, readSession = session, makeId = newProductionWriteToken,
  isCurrent = (() => { const page = getPageContext(); return () => !page || page.isCurrent(); })(),
} = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !['close', 'release'].includes(action)) throw new Error('마감 날짜·명령을 확인해주세요.');
  const opened = readSession();
  if (!opened.uid) throw new Error('로그인 상태를 다시 확인해주세요.');
  const check = () => {
    const current = readSession();
    if (!isCurrent() || current.uid !== opened.uid || current.epoch !== opened.epoch || current.day !== opened.day) {
      throw new Error('세션이나 날짜 또는 화면이 변경되었습니다. 다시 열어주세요.');
    }
  };
  const context = await invoke({action: 'context', date});
  check();
  if (!context || !(context.version === null || typeof context.version === 'string' && /^\d+:\d{1,9}$/.test(context.version))
    || ![null, 'closed', 'released'].includes(context.status)) throw new Error('마감 원본 상태를 확인하지 못했습니다.');
  if (action === 'close' && context.status === 'closed') throw new Error('이미 마감된 날짜입니다.');
  if (action === 'release' && context.status !== 'closed') throw new Error('마감되지 않은 날짜는 해제할 수 없습니다.');
  const operationId = makeId();
  let dispatched = false;
  return {
    operationId,
    async submit(staffName, reason = '') {
      check();
      if (dispatched) throw new Error('이미 전송한 마감 요청입니다. 화면에서 저장 결과를 확인해주세요.');
      if (typeof staffName !== 'string' || !staffName.trim() || staffName.length > 120) throw new Error('담당자를 확인해주세요.');
      if (action === 'release' && (typeof reason !== 'string' || !reason.trim() || reason.length > 1000)) throw new Error('해제 사유를 확인해주세요.');
      dispatched = true;
      try {
        const result = await invoke({action, date, staffName: staffName.trim(), ...(action === 'release' ? {reason: reason.trim()} : {}),
          operationId, expectedVersion: context.version});
        check();
        if (!result || result.operationId !== operationId || result.date !== date || result.status !== (action === 'close' ? 'closed' : 'released')
          || typeof result.replayed !== 'boolean') throw new Error('서버 마감 결과가 요청과 일치하지 않습니다.');
        return result;
      } catch (error) {
        // The server may have committed before a connection failure. Preserve
        // its ID for support/reconciliation; do not issue another write here.
        error.closingOperationId = operationId;
        error.closingResponseUnknown = true;
        throw error;
      }
    },
  };
}
