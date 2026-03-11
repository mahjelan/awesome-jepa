import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  limit as firestoreLimit,
  collectionGroup,
  orderBy,
  where,
} from 'firebase/firestore';
import type { Firestore, Timestamp } from 'firebase/firestore';
import type {
  UserDataItem,
  UserDataItemInput,
  PostInput,
  PostVisibility,
  SavedAnswerMetadata,
  SavedAnswerSource,
  SavedAnswerRelate,
} from '../types/userData';

const DATA_COLLECTION = 'data';

function userDataCollection(db: Firestore, userId: string) {
  return collection(db, 'users', userId, DATA_COLLECTION);
}

function userDataDoc(db: Firestore, userId: string, itemId: string) {
  return doc(db, 'users', userId, DATA_COLLECTION, itemId);
}

/** List all data items for a user (newest first). */
export async function listUserData(
  db: Firestore,
  userId: string,
  limitCount = 100
): Promise<UserDataItem[]> {
  const coll = userDataCollection(db, userId);
  const q = query(coll, firestoreLimit(limitCount));
  const snapshot = await getDocs(q);
  const docs = snapshot.docs ?? [];
  const items = docs.map((d) => {
    const data = d.data();
    const mediaUrl = data.mediaUrl;
    return {
      id: d.id,
      type: (data.type as UserDataItem['type']) ?? 'text',
      name: (data.name as string) ?? '',
      value: data.value as string | number | boolean,
      createdAt: data.createdAt ?? null,
      visibility: data.visibility as UserDataItem['visibility'],
      mediaUrl: typeof mediaUrl === 'string' ? mediaUrl : undefined,
      mediaType: data.mediaType as 'image' | 'video' | undefined,
      authorId: data.authorId as string | undefined,
      authorName: data.authorName as string | undefined,
      authorUserid: data.authorUserid as string | undefined,
      ownerId: userId,
      metadata: data.metadata as UserDataItem['metadata'],
    };
  });
  items.sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return tb - ta;
  });
  return items;
}

/** Add a new data item. */
export async function addUserDataItem(
  db: Firestore,
  userId: string,
  input: UserDataItemInput
): Promise<string> {
  const itemId = crypto.randomUUID();
  const docData: Record<string, unknown> = {
    type: input.type,
    name: input.name,
    value: input.value,
    createdAt: serverTimestamp(),
  };
  if (typeof input.mediaUrl === 'string' && input.mediaUrl.trim()) {
    docData.mediaUrl = input.mediaUrl.trim();
  }
  if (input.mediaType) {
    docData.mediaType = input.mediaType;
  }
  if (input.visibility) {
    docData.visibility = input.visibility;
  }
  if (input.authorId) docData.authorId = input.authorId;
  if (input.authorName) docData.authorName = input.authorName;
  if (input.authorUserid) docData.authorUserid = input.authorUserid;
  if (input.metadata) {
    docData.metadata = input.metadata;
  }
  await setDoc(userDataDoc(db, userId, itemId), docData);
  return itemId;
}

/** Save an AI discovery to the user's feed (type saved_answer). */
export async function saveDiscovery(
  db: Firestore,
  userId: string,
  payload: {
    query: string;
    markdown: string;
    sources: SavedAnswerSource[];
    relates: SavedAnswerRelate[];
    visibility?: PostVisibility;
    author?: { id: string; name: string; userid: string };
  }
): Promise<string> {
  const visibility = payload.visibility ?? 'private';
  return addUserDataItem(db, userId, {
    type: 'saved_answer',
    name: '',
    value: payload.query,
    visibility,
    ...(visibility === 'public' && payload.author && {
      authorId: payload.author.id,
      authorName: payload.author.name,
      authorUserid: payload.author.userid,
    }),
    metadata: {
      query: payload.query,
      markdown: payload.markdown,
      sources: payload.sources,
      relates: payload.relates,
    } as SavedAnswerMetadata,
  });
}

/** Add a feed post (content + optional media URL, type, visibility). */
export async function addPost(
  db: Firestore,
  userId: string,
  input: PostInput,
  author?: { id: string; name: string; userid: string }
): Promise<string> {
  const visibility = input.visibility ?? 'private';
  return addUserDataItem(db, userId, {
    type: 'post',
    name: '',
    value: input.content,
    visibility,
    mediaUrl: input.mediaUrl,
    mediaType: input.mediaType,
    ...(visibility === 'public' && author && {
      authorId: author.id,
      authorName: author.name,
      authorUserid: author.userid,
    }),
  });
}

/** Update an existing data item (e.g. name, value, metadata, visibility). When setting visibility to 'public', include authorId, authorName, authorUserid so the feed can show who posted. */
export async function updateUserDataItem(
  db: Firestore,
  userId: string,
  itemId: string,
  updates: Partial<Pick<UserDataItemInput, 'name' | 'value' | 'metadata' | 'visibility' | 'authorId' | 'authorName' | 'authorUserid'>>
): Promise<void> {
  await setDoc(userDataDoc(db, userId, itemId), updates, { merge: true });
}

/** List public posts and public saved_answer items from all users (newest first). Requires composite indexes on collection group "data" for (type, visibility, createdAt). */
export async function listPublicPosts(
  db: Firestore,
  limitCount = 100
): Promise<UserDataItem[]> {
  const cg = collectionGroup(db, DATA_COLLECTION);
  const toItem = (d: { id: string; data: () => Record<string, unknown>; ref: { parent: { parent: { id: string } | null } | null } }) => {
    const data = d.data();
    const mediaUrl = data.mediaUrl;
    const parentUserId = d.ref?.parent?.parent?.id;
    return {
      id: d.id,
      type: (data.type as UserDataItem['type']) ?? 'post',
      name: (data.name as string) ?? '',
      value: data.value as string | number | boolean,
      createdAt: (data.createdAt as Timestamp | undefined) ?? null,
      visibility: data.visibility as UserDataItem['visibility'],
      mediaUrl: typeof mediaUrl === 'string' ? mediaUrl : undefined,
      mediaType: data.mediaType as 'image' | 'video' | undefined,
      authorId: (data.authorId as string) ?? parentUserId ?? '',
      authorName: (data.authorName as string) ?? '',
      authorUserid: (data.authorUserid as string) ?? '',
      ownerId: parentUserId ?? undefined,
      metadata: data.metadata as UserDataItem['metadata'],
    };
  };
  const [postsSnap, savedSnap] = await Promise.all([
    getDocs(
      query(
        cg,
        where('type', '==', 'post'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      )
    ),
    getDocs(
      query(
        cg,
        where('type', '==', 'saved_answer'),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      )
    ),
  ]);
  const items = [
    ...postsSnap.docs.map((d) => toItem(d)),
    ...savedSnap.docs.map((d) => toItem(d)),
  ];
  items.sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const tb = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return tb - ta;
  });
  return items.slice(0, limitCount);
}

/** Delete a data item. */
export async function deleteUserDataItem(
  db: Firestore,
  userId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(userDataDoc(db, userId, itemId));
}

const USERS_COLLECTION = 'users';

/** Delete all data items in the user's data subcollection (posts, discoveries, etc.). */
export async function deleteAllUserData(db: Firestore, userId: string): Promise<void> {
  const coll = userDataCollection(db, userId);
  const snapshot = await getDocs(coll);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}

/** Delete the user document (after deleting user data). Requires Firestore rule to allow. */
export async function deleteUserDocument(db: Firestore, userId: string): Promise<void> {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
}
