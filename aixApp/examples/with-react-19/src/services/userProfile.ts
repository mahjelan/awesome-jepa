import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { FirestoreUser } from '../types/user';
import { deleteAllUserData, deleteUserDocument } from './userData';

const USERS_COLLECTION = 'users';

/** Return true if another user (optionally excluding excludeUserId) already has this userid. */
export async function isUseridTaken(
  db: Firestore,
  userid: string,
  excludeUserId?: string
): Promise<boolean> {
  const trimmed = userid.trim();
  if (!trimmed) return false;
  const q = query(
    collection(db, USERS_COLLECTION),
    where('userid', '==', trimmed),
    limit(2)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    if (d.id !== excludeUserId) return true;
  }
  return false;
}

/** Return true if another user (optionally excluding excludeUserId) already has this display name. */
export async function isDisplayNameTaken(
  db: Firestore,
  name: string,
  excludeUserId?: string
): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const q = query(
    collection(db, USERS_COLLECTION),
    where('name', '==', trimmed),
    limit(10)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    if (d.id !== excludeUserId) return true;
  }
  return false;
}

/** Update the user's display name in Firestore. Returns updated FirestoreUser. Fails if display name is already taken by another user. */
export async function updateUserDisplayName(
  db: Firestore,
  userId: string,
  name: string
): Promise<FirestoreUser> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name is required.');
  const taken = await isDisplayNameTaken(db, trimmed, userId);
  if (taken) throw new Error('This display name is already in use by another account.');
  const userRef = doc(db, USERS_COLLECTION, userId);
  const snap = await getDoc(userRef);
  const data = snap.data();
  await setDoc(
    userRef,
    { name: trimmed, id: userId, userid: data?.userid ?? userId },
    { merge: true }
  );
  const updated = (await getDoc(userRef)).data();
  return {
    id: userId,
    userid: (updated?.userid as string) ?? userId,
    name: (updated?.name as string) ?? trimmed,
  };
}

/** Delete all user data and the user document, then sign out. Call signOut() and clear localStorage after this. */
export async function deleteAccountData(db: Firestore, userId: string): Promise<void> {
  await deleteAllUserData(db, userId);
  await deleteUserDocument(db, userId);
}
