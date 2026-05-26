import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}

export function pickLatestMeatPrice(history, dateStr) {
  const candidates = (history || [])
    .filter(item => item.effectiveDate && (!dateStr || item.effectiveDate <= dateStr))
    .sort((a, b) => {
      const byDate = String(b.effectiveDate).localeCompare(String(a.effectiveDate));
      if (byDate !== 0) return byDate;
      return timestampMillis(b.createdAt) - timestampMillis(a.createdAt);
    });
  return candidates[0] || null;
}

export async function loadMeatPriceRows(dateStr) {
  const snap = await getDocs(query(collection(db, 'meatTypes'), orderBy('sortOrder')));
  const meatTypes = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(item => item.active !== false);

  return Promise.all(meatTypes.map(async (meatType) => {
    const historySnap = await getDocs(collection(db, 'meatTypes', meatType.id, 'priceHistory'));
    const history = historySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const latest = pickLatestMeatPrice(history, dateStr);
    return { meatType, latest, history };
  }));
}

export async function addMeatPriceHistory(meatTypeId, payload) {
  return addDoc(collection(db, 'meatTypes', meatTypeId, 'priceHistory'), {
    unitPrice: payload.unitPrice,
    effectiveDate: payload.effectiveDate,
    prevUnitPrice: payload.prevUnitPrice ?? null,
    reason: payload.reason || 'manual',
    createdAt: serverTimestamp(),
    createdBy: payload.createdBy || '',
  });
}
