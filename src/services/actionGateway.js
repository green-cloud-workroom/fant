import { auth, db } from '../firebase.js';
import { doc } from 'firebase/firestore';
import { createServerReadScope } from './serverReadScope.js';
import { getTodayKST } from '../utils/date.js';
import { sessionStore } from '../state/sessionStore.js';
import { getPageContext } from '../utils/pageLifecycle.js';

export function fingerprint(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (typeof value.toMillis === 'function') return String(value.toMillis());
  if (value instanceof Date) return String(value.getTime());
  if (Array.isArray(value)) return '[' + value.map(fingerprint).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + fingerprint(value[k])).join(',') + '}';
}
export async function openAction({ refs = [], roles = ['admin', 'office', 'production'] } = {}) {
  const user = auth.currentUser;
  const day = getTodayKST();
  const epoch = sessionStore.epoch;
  const page = getPageContext();
  if (!user) throw new Error('로그인 상태를 다시 확인해주세요.');
  async function read() {
    if ((page && !page.isCurrent()) || sessionStore.epoch !== epoch || auth.currentUser?.uid !== user.uid || getTodayKST() !== day) throw new Error('세션이나 날짜 또는 화면이 변경되었습니다. 다시 열어주세요.');
    const token = await user.getIdTokenResult();
    if (!roles.includes(token.claims.roles?.production)) throw new Error('처리 권한이 없습니다.');
    const scope = createServerReadScope();
    const snapshots = await Promise.all(refs.map(path => scope.getDoc(doc(db, path))));
    if ((page && !page.isCurrent()) || sessionStore.epoch !== epoch || auth.currentUser?.uid !== user.uid || getTodayKST() !== day) throw new Error('세션 또는 화면이 변경되었습니다.');
    return snapshots.map(s => s.exists() ? { id: s.id, ...s.data() } : null);
  }
  const values = await read();
  const original = fingerprint(values);
  let submitting = false;
  return {
    values,
    async confirm() {
      const latest = await read();
      if (fingerprint(latest) !== original) throw new Error('다른 작업으로 원본이 변경되었습니다. 입력을 확인하고 화면을 다시 열어주세요.');
      return latest;
    },
    async submit(callback) {
      if (submitting) throw new Error('이미 처리 중입니다.');
      submitting = true;
      try { const latest = await this.confirm(); return await callback(latest); }
      finally { submitting = false; }
    },
  };
}
