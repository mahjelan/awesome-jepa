import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Use env vars so API keys are not committed. Add to .env when running the Algorythm app.
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

if (!apiKey || !projectId) {
  throw new Error(
    'Algorythm app: missing Firebase config. Set REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_PROJECT_ID (and other REACT_APP_FIREBASE_* vars) in .env.'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app, 'algorythmdb');
export const auth = getAuth(app);
export default app;

