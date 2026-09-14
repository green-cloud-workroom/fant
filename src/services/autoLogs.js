import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

// The caller supplies one fresh snapshot of today's logs. Existing alerts never
// need an individual document read. Missing alerts use a transaction so another
// tab's creation/acknowledgement cannot be overwritten.
export function createAutoLogBatch(existingLogs) {
  const existingIds = new Set(existingLogs.map(log => log.id));
  const pending = new Map();
  return {
    pendingIds: () => [...pending.keys()],
    enqueue({ action, subAction, date, message, details, dedupKey }) {
      const safeKey = `${action}_${subAction}_${date}_${dedupKey}`.replace(/[^\w-]/g, '_');
      const id = `auto_${safeKey}`;
      if (existingIds.has(id)) return;
      pending.set(id, {
        action, subAction, date, staff: '시스템', uid: null, message,
        details: { ...(details || {}), dedupKey, autoTriggered: true },
        read: false, acknowledged: false, acknowledgedAt: null,
        acknowledgedBy: null, acknowledgedByUid: null,
      });
    },
    async flush() {
      const entries = [...pending.entries()];
      const result = { createdIds: [], existingIds: [], failedIds: [] };
      let index = 0;
      await Promise.all(Array.from({ length: Math.min(4, entries.length) }, async () => {
        while (index < entries.length) {
          const [id, data] = entries[index++];
          try {
            const ref = doc(db, 'activityLogs', id);
            const created = await runTransaction(db, async transaction => {
              const existing = await transaction.get(ref);
              if (!existing.exists()) transaction.set(ref, { ...data, timestamp: serverTimestamp() });
              return !existing.exists();
            });
            result[created ? 'createdIds' : 'existingIds'].push(id);
          } catch (err) {
            result.failedIds.push(id);
            console.error('[자동 알림 생성 실패]', id, err);
          }
        }
      }));
      // Even a transaction no-op may have found a log created by another tab.
      return result;
    },
  };
}
