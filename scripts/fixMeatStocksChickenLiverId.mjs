import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from './firestoreConfig.mjs';

const WRONG_CHICKEN_LIVER_ID = 'LomeZ0AtYrcAAA6Qa5Hb';
const RIGHT_CHICKEN_LIVER_ID = '74eSDE8ICKo8CAQivRAB';
const DRY_RUN = process.env.DRY_RUN !== 'false';

const email = process.env.FB_EMAIL;
const password = process.env.FB_PASS;

if (!email || !password) {
  console.error('FB_EMAIL / FB_PASS environment variables are required.');
  process.exit(1);
}

console.log(`=== ${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}: chicken liver meatStocks ID migration ===`);
console.log(`from: ${WRONG_CHICKEN_LIVER_ID}`);
console.log(`to:   ${RIGHT_CHICKEN_LIVER_ID}`);
console.log('');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
await signInWithEmailAndPassword(getAuth(app), email, password);

const snap = await getDocs(query(
  collection(db, 'meatStocks'),
  where('meatTypeId', '==', WRONG_CHICKEN_LIVER_ID),
));

if (snap.empty) {
  console.log('No matching meatStocks documents found.');
  process.exit(0);
}

console.log(`Found ${snap.size} matching meatStocks documents:`);

for (const stockDoc of snap.docs) {
  const data = stockDoc.data();
  const row = {
    id: stockDoc.id,
    meatNameSnapshot: data.meatNameSnapshot || null,
    stage: data.stage || null,
    incomingDate: data.incomingDate || null,
    remaining: data.remaining ?? null,
    closed: data.closed ?? null,
  };
  console.log(JSON.stringify(row));

  if (!DRY_RUN) {
    await updateDoc(doc(db, 'meatStocks', stockDoc.id), {
      meatTypeId: RIGHT_CHICKEN_LIVER_ID,
      updatedAt: new Date(),
    });
  }
}

console.log('');
console.log(DRY_RUN
  ? `Dry-run complete. ${snap.size} documents would be updated.`
  : `Migration complete. ${snap.size} documents updated.`);
