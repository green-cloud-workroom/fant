import { initializeApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  orderBy,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyCoSAUVO7EA6UixbPS0B_trPTc0yVdzhAA',
  authDomain: 'fant-e5ae5.firebaseapp.com',
  projectId: 'fant-e5ae5',
  storageBucket: 'fant-e5ae5.firebasestorage.app',
  messagingSenderId: '177376833232',
  appId: '1:177376833232:web:d0b0b29a593652d27878d5',
};

export const PRESERVE_COLLECTIONS = [
  'users',
  'staffGroups',
  'recipes',
  'settings',
];

export const WIPE_COLLECTIONS = [
  'productions',
  'productionCompletion',
  'closings',
  'meatLogs',
  'meatStocks',
  'meatTypes',
  'bagLogs',
  'bagTypes',
  'eggLogs',
  'eggStock',
  'frozenLogs',
  'frozenProducts',
  'frozenPanStock',
  'frozenPanLogs',
  'frozenPanLots',
  'breadPanLogs',
  'breadPanLots',
  'frozenSeparation',
  'frozenSeparationLogs',
  'schedules',
  'events',
  'holidays',
  'supplementTypes',
  'supplementStock',
  'supplementLogs',
  'activityLogs',
  'stockLedger',
];

export const BACKUP_COLLECTIONS = [
  ...PRESERVE_COLLECTIONS,
  ...WIPE_COLLECTIONS,
];

export function parseArgs(argv) {
  const args = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, true);
    } else {
      args.set(key, next);
      i += 1;
    }
  }
  return args;
}

export async function initAuthedFirestore(args) {
  const email = args.get('email') || process.env.FANT_FIREBASE_EMAIL;
  const password = args.get('password') || process.env.FANT_FIREBASE_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Missing credentials. Set FANT_FIREBASE_EMAIL and FANT_FIREBASE_PASSWORD, or pass --email and --password.',
    );
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
  return getFirestore(app);
}

export async function readCollection(db, collectionName) {
  const ref = collection(db, collectionName);
  let snap;
  try {
    snap = await getDocs(query(ref, orderBy('__name__')));
  } catch {
    snap = await getDocs(ref);
  }
  return snap.docs;
}

export function serializeFirestoreValue(value) {
  if (value == null) return value;

  if (typeof value.toDate === 'function' && typeof value.toMillis === 'function') {
    return {
      __type: 'Timestamp',
      iso: value.toDate().toISOString(),
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  if (value.path && value.firestore) {
    return {
      __type: 'DocumentReference',
      path: value.path,
    };
  }

  if (typeof value.latitude === 'number' && typeof value.longitude === 'number') {
    return {
      __type: 'GeoPoint',
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeFirestoreValue(nested)]),
    );
  }

  return value;
}

export function timestampForPath(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}
