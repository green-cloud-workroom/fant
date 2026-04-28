import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCoSAUVO7EA6UixbPS0B_trPTc0yVdzhAA",
  authDomain: "fant-e5ae5.firebaseapp.com",
  projectId: "fant-e5ae5",
  storageBucket: "fant-e5ae5.firebasestorage.app",
  messagingSenderId: "177376833232",
  appId: "1:177376833232:web:d0b0b29a593652d27878d5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);