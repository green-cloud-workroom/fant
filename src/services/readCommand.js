import { openAction } from './actionGateway.js';
import { createServerReadScope } from './serverReadScope.js';
import { snapshotFingerprint } from '../state/pageResources.js';
import { runTransaction } from 'firebase/firestore';

// Display snapshots are comparison baselines, never authority to write.
export async function withReadCommand(resource, callback, {
  roles = ['admin', 'office'], readBack = [], timeoutMs = 15000, maxCommits = 1,
} = {}) {
  if (resource.busy) throw new Error('이미 처리 중입니다.');
  if (resource.blocked) throw new Error('직전 저장 결과를 확인해야 합니다. 입력을 복사한 뒤 화면을 다시 불러와주세요.');
  resource.busy = true;
  const baseline = [...(resource.getCommandBaseline?.() || resource.observations)];
  const view = resource.viewRevision;
  let completed = 0, dispatching = false, attempted = false, failure = null;
  try {
    const gate = await openAction({ roles, reusableConfirm:true });
    let observations = baseline;
    let reader = createServerReadScope();
    const verify = async () => {
      if(view && resource.viewRevision!==view)throw new Error('표시된 화면이 변경되었습니다. 현재 자료를 확인한 뒤 다시 저장해주세요.');
      await gate.confirm();
      const fresh = createServerReadScope();
      const compared = await Promise.all(observations.map(async item => {
        const snapshot = await fresh[item.kind](item.ref);
        return snapshotFingerprint(snapshot) === item.fingerprint;
      }));
      if (compared.some(equal => !equal)) throw new Error('다른 작업으로 원본이 변경되었습니다. 입력을 보존한 뒤 최신 자료를 다시 불러와주세요.');
      if(view && resource.viewRevision!==view)throw new Error('표시된 화면이 변경되었습니다. 현재 자료를 확인한 뒤 다시 저장해주세요.');
      await gate.confirm();
    };
    await verify();
    const track = kind => async ref => {
      const snapshot = await reader[kind](ref);
      observations.push({ kind, ref, fingerprint: snapshotFingerprint(snapshot) });
      return snapshot;
    };
    const command = {
      getDoc: track('getDoc'), getDocs: track('getDocs'),
      get committed() { return completed > 0; },
      async transaction(db, callback, { targets = [] } = {}) {
        let validationError;
        try {
          return await this.commit({ commit: () => runTransaction(db, async transaction => {
            try { return await callback(transaction); }
            catch (error) { validationError = error; throw error; }
          }) }, { targets });
        } catch (error) {
          // A callback exception aborts the SDK transaction before publication.
          if (validationError && error.cause === validationError) {
            resource.blocked = completed > 0;
            throw validationError;
          }
          throw error;
        }
      },
      async commit(batch, { targets = [] } = {}) {
        if (dispatching) throw new Error('이미 처리 중입니다.');
        if (failure) throw failure;
        if (attempted && completed >= maxCommits) throw new Error('이 저장 요청은 이미 전송되었습니다.');
        dispatching = true;
        let timer, result;
        try {
          await verify();
          attempted = true;
          const pending = Promise.resolve().then(() => batch.commit());
          resource.pending = pending;
          const settled = () => { if (resource.pending === pending) resource.pending = null; };
          pending.then(settled, settled);
          try {
            result = await Promise.race([pending, new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error('write-timeout')), timeoutMs);
            })]);
          } catch (error) {
            resource.blocked = true;
            resource.invalidate();
            // Diagnostic read-back cannot trigger another dispatch.
            const fresh = createServerReadScope();
            const observed = await Promise.allSettled([...readBack, ...targets].map(ref => fresh.getDoc(ref)));
            failure = new Error('저장 결과를 확정하지 못했습니다. 자동 재전송하지 않습니다. 입력을 보존한 뒤 최신 자료를 다시 확인해주세요.', { cause: error });
            failure.code = 'outcome-unknown';
            failure.readBack = observed.map(result => ({ serverObserved: result.status === 'fulfilled', exists: result.status === 'fulfilled' ? result.value.exists() : null }));
            throw failure;
          }
          completed++;
          resource.invalidate();
          // Existing multi-step workflows read new authoritative state after
          // each confirmed step. Earlier writes are never replayed on failure.
          if (maxCommits > 1) { observations = []; reader = createServerReadScope(); }
          return result;
        } catch (error) {
          if (completed > 0) { resource.blocked = true; resource.invalidate(); }
          failure ||= error;
          throw error;
        } finally {
          clearTimeout(timer);
          dispatching = false;
        }
      },
    };
    return await callback(command);
  } finally {
    resource.busy = false;
  }
}

// Keep existing transaction/batch boundaries for workflows such as production
// plus round recalculation. This does not claim the whole workflow is atomic.
export function withReadWorkflow(resource, callback, options = {}) {
  return withReadCommand(resource, callback, { ...options, maxCommits: 1000 });
}
