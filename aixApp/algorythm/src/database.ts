import { db, auth } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
    setDoc,
    serverTimestamp,
    writeBatch,
    arrayUnion,
    arrayRemove,
    increment
} from 'firebase/firestore';
import { User } from 'firebase/auth';

let firestoreDisabled = false;

const isFirestoreDisabledError = (error: any) =>
    error?.code === 'failed-precondition' &&
    error?.message?.includes('Firestore API data access is disabled');

const handleFirestoreDisabled = () => {
    if (firestoreDisabled) return;
    firestoreDisabled = true;
    console.warn('Firestore Native API is disabled. Please enable it in Firebase Console.');
    console.warn('See ENABLE_FIRESTORE_API.md for instructions.');
};

// Example: Save video data
export const saveVideo = async (videoData: any) => {
    try {
        const docRef = await addDoc(collection(db, 'videos'), {
            ...videoData,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving video:', error);
        throw error;
    }
};

// Example: Get all videos
export const getVideos = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'videos'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting videos:', error);
        throw error;
    }
};

// Example: Get video by ID
export const getVideoById = async (videoId: string) => {
    try {
        const docRef = doc(db, 'videos', videoId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            throw new Error('Video not found');
        }
    } catch (error) {
        console.error('Error getting video:', error);
        throw error;
    }
};

// Example: Update video
export const updateVideo = async (videoId: string, updates: any) => {
    try {
        const docRef = doc(db, 'videos', videoId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error updating video:', error);
        throw error;
    }
};

// Example: Delete video
export const deleteVideo = async (videoId: string) => {
    try {
        await deleteDoc(doc(db, 'videos', videoId));
    } catch (error) {
        console.error('Error deleting video:', error);
        throw error;
    }
};

// Example: Query videos with filters
export const searchVideos = async (searchTerm: string) => {
    try {
        const q = query(
            collection(db, 'videos'),
            where('title', '>=', searchTerm),
            where('title', '<=', searchTerm + '\uf8ff'),
            orderBy('title'),
            limit(10)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error searching videos:', error);
        throw error;
    }
};

// ========== USER-SPECIFIC FEATURES ==========

// Get current user ID helper
const getUserId = (): string | null => {
    return auth.currentUser?.uid || null;
};

// ========== FAVORITES/BOOKMARKS ==========

export interface FavoriteVideo {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    description?: string;
    publishedAt?: string;
    addedAt: Timestamp;
}

// Add video to favorites
export const addToFavorites = async (videoData: Omit<FavoriteVideo, 'addedAt'>) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const favoritesRef = doc(db, 'users', userId, 'favorites', videoData.videoId);
        await setDoc(favoritesRef, {
            ...videoData,
            addedAt: serverTimestamp(),
        });
        return favoritesRef.id;
    } catch (error) {
        console.error('Error adding to favorites:', error);
        throw error;
    }
};

// Remove video from favorites
export const removeFromFavorites = async (videoId: string) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        await deleteDoc(doc(db, 'users', userId, 'favorites', videoId));
    } catch (error) {
        console.error('Error removing from favorites:', error);
        throw error;
    }
};

// Get all favorites for current user
export const getFavorites = async (): Promise<FavoriteVideo[]> => {
    const userId = getUserId();
    if (!userId) return [];

    try {
        const q = query(
            collection(db, 'users', userId, 'favorites'),
            orderBy('addedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FavoriteVideo & { id: string }));
    } catch (error) {
        console.error('Error getting favorites:', error);
        throw error;
    }
};

// Check if video is favorited
export const isFavorite = async (videoId: string): Promise<boolean> => {
    const userId = getUserId();
    if (!userId) return false;

    try {
        const docRef = doc(db, 'users', userId, 'favorites', videoId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists();
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
};

// Subscribe to favorites changes (real-time)
export const subscribeToFavorites = (
    callback: (favorites: FavoriteVideo[]) => void
): (() => void) => {
    const userId = getUserId();
    if (!userId) {
        callback([]);
        return () => { };
    }

    const q = query(
        collection(db, 'users', userId, 'favorites'),
        orderBy('addedAt', 'desc')
    );

    return onSnapshot(q,
        (snapshot) => {
            const favorites = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as FavoriteVideo & { id: string }));
            callback(favorites);
        },
        (error) => {
            // Handle Firestore API disabled error gracefully
            if (error?.code === 'failed-precondition' && error?.message?.includes('Firestore API data access is disabled')) {
                console.warn('Firestore Native API is disabled. Please enable it in Firebase Console.');
                console.warn('See ENABLE_FIRESTORE_API.md for instructions.');
                callback([]); // Return empty array instead of crashing
                return;
            }
            console.error('Error in favorites subscription:', error);
            callback([]); // Return empty array on any error
        }
    );
};

// ========== WATCH HISTORY ==========

export interface WatchHistoryItem {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    watchedAt: Timestamp;
    watchDuration?: number; // seconds watched
    completed?: boolean;
}

// Add video to watch history
export const addToWatchHistory = async (videoData: Omit<WatchHistoryItem, 'watchedAt'>) => {
    const userId = getUserId();
    if (!userId) return; // Silently fail if not authenticated

    try {
        const historyRef = doc(db, 'users', userId, 'watchHistory', videoData.videoId);
        await setDoc(historyRef, {
            ...videoData,
            watchedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return;
        }
        console.error('Error adding to watch history:', error);
    }
};

// Get watch history
export const getWatchHistory = async (limitCount: number = 50): Promise<WatchHistoryItem[]> => {
    const userId = getUserId();
    if (!userId) return [];

    try {
        const q = query(
            collection(db, 'users', userId, 'watchHistory'),
            orderBy('watchedAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as WatchHistoryItem & { id: string }));
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return [];
        }
        console.error('Error getting watch history:', error);
        return [];
    }
};

// Clear watch history
export const clearWatchHistory = async () => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const historySnapshot = await getDocs(
            collection(db, 'users', userId, 'watchHistory')
        );
        const batch = writeBatch(db);
        historySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error clearing watch history:', error);
        throw error;
    }
};

// ========== PLAYLISTS/COLLECTIONS ==========

export interface Playlist {
    id?: string;
    name: string;
    description?: string;
    videos: FavoriteVideo[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isPublic?: boolean;
}

// Create a new playlist
export const createPlaylist = async (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const docRef = await addDoc(collection(db, 'users', userId, 'playlists'), {
            ...playlist,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw error;
    }
};

// Get all playlists
export const getPlaylists = async (): Promise<Playlist[]> => {
    const userId = getUserId();
    if (!userId) return [];

    try {
        const querySnapshot = await getDocs(
            collection(db, 'users', userId, 'playlists')
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Playlist));
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return [];
        }
        console.error('Error getting playlists:', error);
        return [];
    }
};

// Add video to playlist
export const addVideoToPlaylist = async (playlistId: string, video: FavoriteVideo) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
        await updateDoc(playlistRef, {
            videos: arrayUnion(video),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding video to playlist:', error);
        throw error;
    }
};

// Remove video from playlist
export const removeVideoFromPlaylist = async (playlistId: string, video: FavoriteVideo) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const playlistRef = doc(db, 'users', userId, 'playlists', playlistId);
        await updateDoc(playlistRef, {
            videos: arrayRemove(video),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error removing video from playlist:', error);
        throw error;
    }
};

// Delete playlist
export const deletePlaylist = async (playlistId: string) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        await deleteDoc(doc(db, 'users', userId, 'playlists', playlistId));
    } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
    }
};

// ========== SEARCH HISTORY ==========

export interface SearchHistoryItem {
    query: string;
    searchedAt: Timestamp;
    resultCount?: number;
}

// Save search query
export const saveSearchQuery = async (query: string, resultCount?: number) => {
    const userId = getUserId();
    if (!userId) return; // Silently fail if not authenticated

    try {
        // Use query as document ID to prevent duplicates
        const searchRef = doc(db, 'users', userId, 'searchHistory', query.toLowerCase().trim());
        await setDoc(searchRef, {
            query: query.trim(),
            searchedAt: serverTimestamp(),
            resultCount,
        }, { merge: true });
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return;
        }
        console.error('Error saving search query:', error);
    }
};

// Get search history
export const getSearchHistory = async (limitCount: number = 20): Promise<SearchHistoryItem[]> => {
    const userId = getUserId();
    if (!userId) return [];

    try {
        const q = query(
            collection(db, 'users', userId, 'searchHistory'),
            orderBy('searchedAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SearchHistoryItem & { id: string }));
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return [];
        }
        console.error('Error getting search history:', error);
        return [];
    }
};

// Clear search history
export const clearSearchHistory = async () => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const historySnapshot = await getDocs(
            collection(db, 'users', userId, 'searchHistory')
        );
        const batch = writeBatch(db);
        historySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error('Error clearing search history:', error);
        throw error;
    }
};

// ========== USER PREFERENCES ==========

export interface UserPreferences {
    themeMode?: 'light' | 'dark';
    autoplay?: boolean;
    defaultVolume?: number;
    videoQuality?: 'auto' | 'hd' | 'sd';
    notificationsEnabled?: boolean;
    language?: string;
}

// Save user preferences
export const saveUserPreferences = async (preferences: UserPreferences) => {
    const userId = getUserId();
    if (!userId) throw new Error('User must be authenticated');

    try {
        const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');
        await setDoc(prefsRef, {
            ...preferences,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return;
        }
        console.error('Error saving preferences:', error);
        throw error;
    }
};

// Get user preferences
export const getUserPreferences = async (): Promise<UserPreferences | null> => {
    const userId = getUserId();
    if (!userId) return null;

    try {
        const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');
        const docSnap = await getDoc(prefsRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserPreferences;
        }
        return null;
    } catch (error: any) {
        if (isFirestoreDisabledError(error)) {
            handleFirestoreDisabled();
            return null;
        }
        console.error('Error getting preferences:', error);
        return null;
    }
};

// Subscribe to preferences changes (real-time)
export const subscribeToPreferences = (
    callback: (preferences: UserPreferences | null) => void
): (() => void) => {
    const userId = getUserId();
    if (!userId) {
        callback(null);
        return () => { };
    }

    const prefsRef = doc(db, 'users', userId, 'preferences', 'settings');
    return onSnapshot(prefsRef,
        (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data() as UserPreferences);
            } else {
                callback(null);
            }
        },
        (error) => {
            if (isFirestoreDisabledError(error)) {
                handleFirestoreDisabled();
                callback(null);
                return;
            }
            console.error('Error in preferences subscription:', error);
            callback(null); // Return null on any error
        }
    );
};

// ========== TRENDING TOPICS (REAL-TIME) ==========

export interface TrendingTopic {
    topic: string;
    count: number;
    lastUpdated: Timestamp;
}

// Subscribe to trending topics (real-time updates)
export const subscribeToTrendingTopics = (
    callback: (topics: TrendingTopic[]) => void,
    limitCount: number = 10
): (() => void) => {
    const q = query(
        collection(db, 'trendingTopics'),
        orderBy('count', 'desc'),
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q,
        (snapshot) => {
            const topics = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TrendingTopic & { id: string }));
            callback(topics);
        },
        (error) => {
            if (isFirestoreDisabledError(error)) {
                handleFirestoreDisabled();
                callback([]);
                return;
            }
            console.error('Error in trending topics subscription:', error);
            callback([]); // Return empty array on any error
        }
    );
};

// Update trending topic count
export const updateTrendingTopic = async (topic: string) => {
    try {
        const topicRef = doc(db, 'trendingTopics', topic.toLowerCase().trim());
        await setDoc(topicRef, {
            topic: topic.trim(),
            count: increment(1),
            lastUpdated: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Error updating trending topic:', error);
    }
};

// ========== USER STATISTICS ==========

export interface UserStats {
    totalVideosWatched: number;
    totalWatchTime: number; // in seconds
    favoriteChannels: string[];
    mostWatchedCategory?: string;
}

// Get user statistics
export const getUserStats = async (): Promise<UserStats | null> => {
    const userId = getUserId();
    if (!userId) return null;

    try {
        const statsRef = doc(db, 'users', userId, 'stats', 'summary');
        const docSnap = await getDoc(statsRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserStats;
        }
        return null;
    } catch (error) {
        console.error('Error getting user stats:', error);
        return null;
    }
};

// Update user statistics
export const updateUserStats = async (updates: Partial<UserStats>) => {
    const userId = getUserId();
    if (!userId) return;

    try {
        const statsRef = doc(db, 'users', userId, 'stats', 'summary');
        await setDoc(statsRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
};

