import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (!apiKey || !projectId) {
  throw new Error(
    'Missing Firebase config. Add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID (and other VITE_FIREBASE_* vars) to .env. ' +
    'Get them from Firebase Console → Project settings → Your apps.'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** Google OAuth 2.0 client ID. Configure this same ID in Firebase Console → Authentication → Sign-in method → Google (Web SDK). */
export const googleClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

export function getGoogleProvider() {
  return new GoogleAuthProvider();
}
