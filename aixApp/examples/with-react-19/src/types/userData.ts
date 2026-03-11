import type { Timestamp } from 'firebase/firestore';

/** Supported value types for user data items. */
export type UserDataType = 'text' | 'number' | 'media' | 'link' | 'boolean' | 'post' | 'saved_answer';

/** Source from AI search (for saved_answer). */
export interface SavedAnswerSource {
  id: string;
  name: string;
  url: string;
  snippet: string;
}

/** Related question (for saved_answer). */
export interface SavedAnswerRelate {
  question: string;
}

/** Metadata for type === 'saved_answer'. */
export interface SavedAnswerMetadata {
  query: string;
  markdown: string;
  sources: SavedAnswerSource[];
  relates: SavedAnswerRelate[];
}

/** One item in the user's data subcollection (e.g. a feed post). */
export interface UserDataItem {
  id: string;
  type: UserDataType;
  name: string;
  value: string | number | boolean;
  createdAt: Timestamp | null;
  /** For posts: 'public' (all users) or 'private' (only author's page). */
  visibility?: PostVisibility;
  /** For posts: optional image/video URL. */
  mediaUrl?: string;
  /** 'image' | 'video' so we can render correctly (Storage URLs often have no extension). */
  mediaType?: 'image' | 'video';
  /** Author info (set for public posts; used when listing public feed). */
  authorId?: string;
  authorName?: string;
  authorUserid?: string;
  /** When listing public feed: the document owner's userId (users/{ownerId}/data/...). Enables edit/delete. */
  ownerId?: string;
  /** Optional extra key-value data. For saved_answer: SavedAnswerMetadata. */
  metadata?: Record<string, unknown> | SavedAnswerMetadata;
}

/** Input when creating or updating an item. */
export interface UserDataItemInput {
  type: UserDataType;
  name: string;
  value: string | number | boolean;
  visibility?: PostVisibility;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  authorId?: string;
  authorName?: string;
  authorUserid?: string;
  metadata?: Record<string, unknown> | SavedAnswerMetadata;
}

/** Who can see the post. */
export type PostVisibility = 'public' | 'private';

/** Input for creating a feed post (content + optional media). */
export interface PostInput {
  content: string;
  /** If 'public', post appears in the public feed for all users; if 'private', only on the author's page. */
  visibility?: PostVisibility;
  mediaUrl?: string;
  /** Set from file.type when uploading so we know how to display (video vs image). */
  mediaType?: 'image' | 'video';
}
