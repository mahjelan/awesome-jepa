/**
 * Google OAuth 2.0 sign-in via Firebase Auth.
 * Ensures a Firestore user document exists so the app's FirestoreUser flow works.
 */
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, getGoogleProvider } from '../firebase';
import type { FirestoreUser } from '../types/user';
import { isUseridTaken } from './userProfile';

const USERS_COLLECTION = 'users';

/** Create or update Firestore user doc from Firebase Auth user; return FirestoreUser. */
export async function ensureFirestoreUserFromAuthUser(fbUser: User): Promise<FirestoreUser> {
  const uid = fbUser.uid;
  const email = fbUser.email ?? '';
  const displayName = fbUser.displayName ?? fbUser.email ?? 'User';

  const userRef = doc(db, USERS_COLLECTION, uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    let userid = email || uid;
    if (await isUseridTaken(db, userid)) {
      userid = uid;
    }
    await setDoc(userRef, {
      id: uid,
      userid,
      name: displayName,
      authProvider: 'google',
    });
  } else {
    const data = existing.data();
    await setDoc(
      userRef,
      {
        id: uid,
        userid: data?.userid ?? (email || uid),
        name: data?.name || displayName,
        authProvider: 'google',
      },
      { merge: true }
    );
  }

  const snap = await getDoc(userRef);
  const d = snap.data();
  return {
    id: uid,
    userid: (d?.userid as string) ?? (email || uid),
    name: (d?.name as string) ?? displayName,
  };
}

/** Sign in with Google popup. Use signInWithGoogleRedirect() if popup is blocked. */
export async function signInWithGoogle(): Promise<FirestoreUser> {
  const result = await signInWithPopup(auth, getGoogleProvider());
  return ensureFirestoreUserFromAuthUser(result.user);
}

/** Start redirect flow (call when popup is blocked). User will land back on app; use checkRedirectResult() on load. */
export function signInWithGoogleRedirect(): void {
  signInWithRedirect(auth, getGoogleProvider());
}

/** Call once on app load to complete redirect sign-in. Returns FirestoreUser if redirect just completed, else null. */
export async function checkRedirectResult(): Promise<FirestoreUser | null> {
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;
  return ensureFirestoreUserFromAuthUser(result.user);
}

/** User-friendly message for Firebase Auth error. */
export function getGoogleSignInErrorMessage(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Allow popups for this site, or try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/cancelled-popup-request':
      return 'Please try again (only one sign-in at a time).';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return err instanceof Error ? err.message : 'Google sign-in failed.';
  }
}
