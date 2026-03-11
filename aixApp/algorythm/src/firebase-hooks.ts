import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInAnonymously, signOut } from 'firebase/auth';
import { auth } from './firebase';
import {
    subscribeToFavorites,
    subscribeToPreferences,
    subscribeToTrendingTopics,
    FavoriteVideo,
    UserPreferences,
    TrendingTopic
} from './database';

// Hook for Firebase Auth state
export const useFirebaseAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authEnabled, setAuthEnabled] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async () => {
        try {
            // Check if user is already signed in
            if (auth.currentUser) {
                return;
            }
            await signInAnonymously(auth);
        } catch (error: any) {
            // Handle specific Firebase auth errors gracefully
            if (error?.code === 'auth/configuration-not-found') {
                console.warn('Firebase anonymous authentication not enabled in Firebase Console.');
                console.warn('To enable: Firebase Console > Authentication > Sign-in method > Enable Anonymous');
                setAuthEnabled(false);
                return null; // Return null instead of throwing
            }
            if (error?.code === 'auth/network-request-failed') {
                console.warn('Firebase network error. App will continue with local storage.');
                setAuthEnabled(false);
                return null;
            }
            // For other errors, log but don't break the app
            console.warn('Firebase authentication unavailable:', error?.code || error?.message);
            setAuthEnabled(false);
            return null;
        }
    };

    const signOutUser = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return { user, loading, signIn, signOut: signOutUser, authEnabled };
};

// Hook for favorites
export const useFavorites = () => {
    const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) {
            setFavorites([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToFavorites((favorites) => {
            setFavorites(favorites);
            setLoading(false);
        });

        return unsubscribe;
    }, [auth.currentUser]);

    return { favorites, loading };
};

// Hook for user preferences
export const useUserPreferences = () => {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) {
            setPreferences(null);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToPreferences((prefs) => {
            setPreferences(prefs);
            setLoading(false);
        });

        return unsubscribe;
    }, [auth.currentUser]);

    return { preferences, loading };
};

// Hook for trending topics (real-time)
export const useTrendingTopics = (limit: number = 10) => {
    const [topics, setTopics] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToTrendingTopics((topics) => {
            setTopics(topics);
            setLoading(false);
        }, limit);

        return unsubscribe;
    }, [limit]);

    return { topics, loading };
};

