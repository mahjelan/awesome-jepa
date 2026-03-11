// LocalStorage fallback for Firebase features when auth is not available
// This allows the app to work even without Firebase authentication enabled

export interface LocalFavorite {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    description?: string;
    addedAt: number;
}

export interface LocalWatchHistory {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    watchedAt: number;
}

export interface LocalSearchHistory {
    query: string;
    searchedAt: number;
    resultCount?: number;
}

const STORAGE_KEYS = {
    FAVORITES: 'algorythm_favorites',
    WATCH_HISTORY: 'algorythm_watch_history',
    SEARCH_HISTORY: 'algorythm_search_history',
    PREFERENCES: 'algorythm_preferences'
};

// Favorites
export const getLocalFavorites = (): LocalFavorite[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveLocalFavorite = (favorite: Omit<LocalFavorite, 'addedAt'>) => {
    try {
        const favorites = getLocalFavorites();
        const exists = favorites.findIndex(f => f.videoId === favorite.videoId);

        if (exists >= 0) {
            // Update existing
            favorites[exists] = { ...favorite, addedAt: Date.now() };
        } else {
            // Add new
            favorites.push({ ...favorite, addedAt: Date.now() });
        }

        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
        return true;
    } catch {
        return false;
    }
};

export const removeLocalFavorite = (videoId: string) => {
    try {
        const favorites = getLocalFavorites();
        const filtered = favorites.filter(f => f.videoId !== videoId);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
        return true;
    } catch {
        return false;
    }
};

// Watch History
export const getLocalWatchHistory = (limit: number = 50): LocalWatchHistory[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
        const history = stored ? JSON.parse(stored) : [];
        return history.slice(0, limit).sort((a: LocalWatchHistory, b: LocalWatchHistory) => b.watchedAt - a.watchedAt);
    } catch {
        return [];
    }
};

export const saveLocalWatchHistory = (item: Omit<LocalWatchHistory, 'watchedAt'>) => {
    try {
        const history = getLocalWatchHistory(1000); // Get more to check for duplicates
        const exists = history.findIndex(h => h.videoId === item.videoId);

        if (exists >= 0) {
            // Update existing
            history[exists] = { ...item, watchedAt: Date.now() };
        } else {
            // Add new
            history.unshift({ ...item, watchedAt: Date.now() });
        }

        // Keep only last 1000 items
        const limited = history.slice(0, 1000);
        localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(limited));
        return true;
    } catch {
        return false;
    }
};

// Search History
export const getLocalSearchHistory = (limit: number = 20): LocalSearchHistory[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
        const history = stored ? JSON.parse(stored) : [];
        return history.slice(0, limit).sort((a: LocalSearchHistory, b: LocalSearchHistory) => b.searchedAt - a.searchedAt);
    } catch {
        return [];
    }
};

export const saveLocalSearchHistory = (query: string, resultCount?: number) => {
    try {
        const history = getLocalSearchHistory(1000);
        const trimmedQuery = query.trim().toLowerCase();

        // Remove existing entry if present
        const filtered = history.filter(h => h.query.toLowerCase() !== trimmedQuery);

        // Add new entry at the beginning
        filtered.unshift({
            query: query.trim(),
            searchedAt: Date.now(),
            resultCount
        });

        // Keep only last 100 items
        const limited = filtered.slice(0, 100);
        localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limited));
        return true;
    } catch {
        return false;
    }
};

// Preferences
export const getLocalPreferences = (): any => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const saveLocalPreferences = (preferences: any) => {
    try {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
        return true;
    } catch {
        return false;
    }
};

