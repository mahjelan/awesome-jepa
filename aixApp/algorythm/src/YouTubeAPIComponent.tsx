import React, { useEffect, useCallback, useMemo, useReducer, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import apiRequest from "./api";
import { useFirebaseAuth, useFavorites, useUserPreferences, useTrendingTopics } from "./firebase-hooks";
import {
    saveSearchQuery,
    addToWatchHistory,
    addToFavorites,
    removeFromFavorites,
    isFavorite as checkIsFavorite,
    saveUserPreferences as savePrefs,
    updateTrendingTopic,
    getSearchHistory,
    getWatchHistory,
    getPlaylists,
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    FavoriteVideo,
    Playlist
} from "./database";
import {
    getLocalFavorites,
    saveLocalFavorite,
    removeLocalFavorite,
    getLocalWatchHistory,
    saveLocalWatchHistory,
    getLocalSearchHistory,
    saveLocalSearchHistory,
    getLocalPreferences,
    saveLocalPreferences
} from "./localStorage-fallback";

declare const google: any;
import { mobileStyles, baseStyles } from "./styles/YouTubeAPIComponent.styles";

// Official YouTube Icon Component - Compliant with YouTube Branding Guidelines
// Source: https://developers.google.com/youtube/terms/branding-guidelines
// This uses the official YouTube Icon for content attribution
const YouTubeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = "#FF0000" }) => {
    // Create a data URI for the SVG to bypass any rendering issues
    const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="${color}"/>
        </svg>`
    )}`;

    return (
        <img
            src= { svgDataUri }
    alt = "YouTube"
    className = "youtube-icon-wrapper"
    style = {{
        display: 'inline-block',
            width: '20px',
                height: '20px',
                    minWidth: '20px',
                        minHeight: '20px',
                            maxWidth: '20px',
                                maxHeight: '20px',
                                    flexShrink: 0,
                                        flexGrow: 0,
                                            flexBasis: '20px',
                                                aspectRatio: '1 / 1',
                                                    boxSizing: 'border-box',
                                                        verticalAlign: 'middle',
                                                            objectFit: 'contain',
                                                                border: 'none',
                                                                    outline: 'none',
                                                                        padding: 0,
                                                                            margin: 0,
            } as React.CSSProperties
}
        />
    );
};

// Ensure global styles are injected once
const ensureGlobalStylesInjected = () => {
    const STYLE_ID_BASE = 'yt-api-base-styles';
    const STYLE_ID_RESP = 'yt-api-mobile-styles';
    if (!document.getElementById(STYLE_ID_BASE)) {
        const style = document.createElement('style');
        style.id = STYLE_ID_BASE;
        style.textContent = baseStyles;
        document.head.appendChild(style);
    }
    if (!document.getElementById(STYLE_ID_RESP)) {
        const style = document.createElement('style');
        style.id = STYLE_ID_RESP;
        style.textContent = mobileStyles;
        document.head.appendChild(style);
    }
};

// Theme helpers
type ThemeMode = 'light' | 'dark';
const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    localStorage.setItem('theme-mode', mode);
};
const loadTheme = (): ThemeMode => {
    const saved = localStorage.getItem('theme-mode') as ThemeMode | null;
    return saved || 'light';
};

// Types
interface VideoItem {
    id: { videoId: string };
    snippet: {
        title: string;
        description: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: {
            default: { url: string };
            medium: { url: string };
            high: { url: string };
        };
    };
}

interface OpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

// Google API types
declare global {
    interface Window {
        gapi: any;
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

// State Management
interface AppState {
    searchQuery: string;
    videoItems: any[];
    modalVisible: boolean;
    selectedVideoId: string | null;
    selectedVideoType: 'youtube' | null;
    authToken: string | null;
    transcript: string;
    transcriptLoading: boolean;
    openAIContent: string;
    selectedVideoTitle: string;
    selectedVideoDescription: string;
    selectedVideoChannel: string;
    selectedVideoDate: string;
    modalAIContent: string;
    isLoading: boolean;
    contentReady: boolean;
    currentVideoIndex: number;
    touchStartY: number;
    touchStartX: number;
    isTransitioning: boolean;
    isFullscreen: boolean;
    currentVideoPlaying: boolean;
    // recommendedVideos removed to comply with YouTube API policy
    videoSummaries: { [key: string]: string };
    topicClusters: { [key: string]: any[] };
    gapiInitialized: boolean;
    dataFetchTime: number;
    dataRefreshInterval: NodeJS.Timeout | null;
    player: any;
    showSearchBar: boolean;
    youtubeAPILoaded: boolean;
    youtubeAPILoading: boolean;
    warningDismissed: boolean;
    defaultSearchExecuted: boolean;
    trendingTopics: string[];
    showTrendingTopics: boolean;
    isAuthenticated: boolean;
    sessionPersisted: boolean;
    tokenClient: any;
    authError: string;
    apiKeyWarning: boolean;
    sidebarTrending: string[];
    sidebarTrendingLoading: boolean;
    sidebarVisible: boolean;
    sidebarScrollPosition: number;
    sidebarTouchStart: number;
    sidebarIsScrolling: boolean;
    modalTouchStartY: number;
    modalTouchStartX: number;
    modalIsSwiping: boolean;
    swipeInteractionCount: number;
    isVideoPlaying: boolean;
    themeMode: ThemeMode;
    error: string | null;
    isMobileMode: boolean;
    nextPageToken: string | null;
    paginationClickCount: number;
    videoInfoCollapsed: boolean;
    isMuted: boolean;
    playbackSpeed: number;
    showSpeedControls: boolean;
    showShareMenu: boolean;
    pictureInPictureEnabled: boolean;
}

type Action =
    | { type: 'SET_SEARCH_QUERY'; payload: string }
    | { type: 'SET_VIDEO_ITEMS'; payload: any[] }
    | { type: 'SET_MODAL_VISIBLE'; payload: boolean }
    | { type: 'SET_SELECTED_VIDEO'; payload: { id: string | null; type: 'youtube' | null, title: string, description: string, channel: string, date: string } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_API_KEY_WARNING'; payload: boolean }
    | { type: 'SET_AUTH_TOKEN'; payload: string | null }
    | { type: 'SET_GAPI_INITIALIZED'; payload: boolean }
    | { type: 'SET_YOUTUBE_API_LOADED'; payload: boolean }
    | { type: 'SET_YOUTUBE_API_LOADING'; payload: boolean }
    | { type: 'SET_PLAYER'; payload: any }
    // SET_RECOMMENDED_VIDEOS removed to comply with YouTube API policy
    | { type: 'SET_VIDEO_SUMMARIES'; payload: { [key: string]: string } }
    | { type: 'SET_TOPIC_CLUSTERS'; payload: { [key: string]: any[] } }
    | { type: 'SET_TRENDING_TOPICS'; payload: string[] }
    | { type: 'SET_SHOW_TRENDING_TOPICS'; payload: boolean }
    | { type: 'SET_AUTHENTICATED'; payload: boolean }
    | { type: 'SET_AUTH_ERROR'; payload: string }
    | { type: 'SET_SIDEBAR_TRENDING'; payload: string[] }
    | { type: 'SET_SIDEBAR_VISIBLE'; payload: boolean }
    | { type: 'SET_THEME_MODE'; payload: ThemeMode }
    | { type: 'SET_CURRENT_VIDEO_INDEX'; payload: number }
    | { type: 'SET_OPENAI_CONTENT'; payload: string }
    | { type: 'SET_MODAL_AI_CONTENT'; payload: string }
    | { type: 'SET_DEFAULT_SEARCH_EXECUTED'; payload: boolean }
    | { type: 'SET_DATA_FETCH_TIME'; payload: number }
    | { type: 'SET_TRANSCRIPT'; payload: string }
    | { type: 'SET_TRANSCRIPT_LOADING'; payload: boolean }
    | { type: 'SET_CONTENT_READY'; payload: boolean }
    | { type: 'SET_DATA_REFRESH_INTERVAL'; payload: NodeJS.Timeout | null }
    | { type: 'SET_TOKEN_CLIENT'; payload: any }
    | { type: 'SET_SHOW_SEARCH_BAR'; payload: boolean }
    | { type: 'SET_SESSION_PERSISTED'; payload: boolean }
    | { type: 'SET_IS_TRANSITIONING'; payload: boolean }
    | { type: 'SET_TOUCH_START_Y'; payload: number }
    | { type: 'SET_TOUCH_START_X'; payload: number }
    | { type: 'SET_SIDEBAR_TRENDING_LOADING'; payload: boolean }
    | { type: 'SET_SIDEBAR_SCROLL_POSITION'; payload: number }
    | { type: 'SET_SIDEBAR_TOUCH_START'; payload: number }
    | { type: 'SET_SIDEBAR_IS_SCROLLING'; payload: boolean }
    | { type: 'SET_MODAL_TOUCH_START_Y'; payload: number }
    | { type: 'SET_MODAL_TOUCH_START_X'; payload: number }
    | { type: 'SET_MODAL_IS_SWIPING'; payload: boolean }
    | { type: 'SET_SWIPE_INTERACTION_COUNT'; payload: number }
    | { type: 'SET_IS_VIDEO_PLAYING'; payload: boolean }
    | { type: 'SET_WARNING_DISMISSED'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_MOBILE_MODE'; payload: boolean }
    | { type: 'APPEND_VIDEO_ITEMS'; payload: any[] }
    | { type: 'SET_NEXT_PAGE_TOKEN'; payload: string | null }
    | { type: 'INCREMENT_PAGINATION_CLICK'; }
    | { type: 'RESET_PAGINATION_CLICK'; }
    | { type: 'SET_VIDEO_INFO_COLLAPSED'; payload: boolean }
    | { type: 'SET_MUTED'; payload: boolean }
    | { type: 'SET_PLAYBACK_SPEED'; payload: number }
    | { type: 'SET_SHOW_SPEED_CONTROLS'; payload: boolean }
    | { type: 'SET_SHOW_SHARE_MENU'; payload: boolean }
    | { type: 'SET_PICTURE_IN_PICTURE_ENABLED'; payload: boolean };


const initialState: AppState = {
    searchQuery: "",
    videoItems: [],
    modalVisible: false,
    selectedVideoId: null,
    selectedVideoType: null,
    authToken: null,
    transcript: "",
    transcriptLoading: false,
    openAIContent: "",
    selectedVideoTitle: "",
    selectedVideoDescription: "",
    selectedVideoChannel: "",
    selectedVideoDate: "",
    modalAIContent: "",
    isLoading: false,
    contentReady: false,
    currentVideoIndex: 0,
    touchStartY: 0,
    touchStartX: 0,
    isTransitioning: false,
    isFullscreen: false,
    currentVideoPlaying: false,
    // recommendedVideos removed to comply with YouTube API policy
    videoSummaries: {},
    topicClusters: {},
    gapiInitialized: false,
    dataFetchTime: 0,
    dataRefreshInterval: null,
    player: null,
    showSearchBar: false,
    youtubeAPILoaded: false,
    youtubeAPILoading: false,
    warningDismissed: true,
    defaultSearchExecuted: false,
    trendingTopics: [],
    showTrendingTopics: false,
    isAuthenticated: false,
    sessionPersisted: false,
    tokenClient: null,
    authError: '',
    apiKeyWarning: false,
    sidebarTrending: [],
    sidebarTrendingLoading: false,
    sidebarVisible: false,
    sidebarScrollPosition: 0,
    sidebarTouchStart: 0,
    sidebarIsScrolling: false,
    modalTouchStartY: 0,
    modalTouchStartX: 0,
    modalIsSwiping: false,
    swipeInteractionCount: 0,
    isVideoPlaying: false,
    themeMode: loadTheme(),
    error: null,
    isMobileMode: false,
    nextPageToken: null,
    paginationClickCount: 0,
    videoInfoCollapsed: true,
    isMuted: false,
    playbackSpeed: 1.0,
    showSpeedControls: false,
    showShareMenu: false,
    pictureInPictureEnabled: false,
};

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.payload };
        case 'SET_VIDEO_ITEMS':
            return { ...state, videoItems: action.payload };
        case 'SET_MODAL_VISIBLE':
            return { ...state, modalVisible: action.payload };
        case 'SET_SELECTED_VIDEO':
            return { ...state, selectedVideoId: action.payload.id, selectedVideoType: action.payload.type, selectedVideoTitle: action.payload.title, selectedVideoDescription: action.payload.description, selectedVideoChannel: action.payload.channel, selectedVideoDate: action.payload.date };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_API_KEY_WARNING':
            return { ...state, apiKeyWarning: action.payload };
        case 'SET_AUTH_TOKEN':
            return { ...state, authToken: action.payload };
        case 'SET_GAPI_INITIALIZED':
            return { ...state, gapiInitialized: action.payload };
        case 'SET_YOUTUBE_API_LOADED':
            return { ...state, youtubeAPILoaded: action.payload };
        case 'SET_YOUTUBE_API_LOADING':
            return { ...state, youtubeAPILoading: action.payload };
        case 'SET_PLAYER':
            return { ...state, player: action.payload };
        // SET_RECOMMENDED_VIDEOS case removed to comply with YouTube API policy
        case 'SET_VIDEO_SUMMARIES':
            return { ...state, videoSummaries: action.payload };
        case 'SET_TOPIC_CLUSTERS':
            return { ...state, topicClusters: action.payload };
        case 'SET_TRENDING_TOPICS':
            return { ...state, trendingTopics: action.payload };
        case 'SET_SHOW_TRENDING_TOPICS':
            return { ...state, showTrendingTopics: action.payload };
        case 'SET_AUTHENTICATED':
            return { ...state, isAuthenticated: action.payload };
        case 'SET_AUTH_ERROR':
            return { ...state, authError: action.payload };
        case 'SET_SIDEBAR_TRENDING':
            return { ...state, sidebarTrending: action.payload };
        case 'SET_SIDEBAR_VISIBLE':
            return { ...state, sidebarVisible: action.payload };
        case 'SET_THEME_MODE':
            return { ...state, themeMode: action.payload };
        case 'SET_CURRENT_VIDEO_INDEX':
            return { ...state, currentVideoIndex: action.payload };
        case 'SET_OPENAI_CONTENT':
            return { ...state, openAIContent: action.payload };
        case 'SET_MODAL_AI_CONTENT':
            return { ...state, modalAIContent: action.payload };
        case 'SET_DEFAULT_SEARCH_EXECUTED':
            return { ...state, defaultSearchExecuted: action.payload };
        case 'SET_DATA_FETCH_TIME':
            return { ...state, dataFetchTime: action.payload };
        case 'SET_TRANSCRIPT':
            return { ...state, transcript: action.payload };
        case 'SET_TRANSCRIPT_LOADING':
            return { ...state, transcriptLoading: action.payload };
        case 'SET_CONTENT_READY':
            return { ...state, contentReady: action.payload };
        case 'SET_DATA_REFRESH_INTERVAL':
            return { ...state, dataRefreshInterval: action.payload };
        case 'SET_TOKEN_CLIENT':
            return { ...state, tokenClient: action.payload };
        case 'SET_SHOW_SEARCH_BAR':
            return { ...state, showSearchBar: action.payload };
        case 'SET_SESSION_PERSISTED':
            return { ...state, sessionPersisted: action.payload };
        case 'SET_IS_TRANSITIONING':
            return { ...state, isTransitioning: action.payload };
        case 'SET_TOUCH_START_Y':
            return { ...state, touchStartY: action.payload };
        case 'SET_TOUCH_START_X':
            return { ...state, touchStartX: action.payload };
        case 'SET_SIDEBAR_TRENDING_LOADING':
            return { ...state, sidebarTrendingLoading: action.payload };
        case 'SET_SIDEBAR_SCROLL_POSITION':
            return { ...state, sidebarScrollPosition: action.payload };
        case 'SET_SIDEBAR_TOUCH_START':
            return { ...state, sidebarTouchStart: action.payload };
        case 'SET_SIDEBAR_IS_SCROLLING':
            return { ...state, sidebarIsScrolling: action.payload };
        case 'SET_MODAL_TOUCH_START_Y':
            return { ...state, modalTouchStartY: action.payload };
        case 'SET_MODAL_TOUCH_START_X':
            return { ...state, modalTouchStartX: action.payload };
        case 'SET_MODAL_IS_SWIPING':
            return { ...state, modalIsSwiping: action.payload };
        case 'SET_SWIPE_INTERACTION_COUNT':
            return { ...state, swipeInteractionCount: action.payload };
        case 'SET_IS_VIDEO_PLAYING':
            return { ...state, isVideoPlaying: action.payload };
        case 'SET_WARNING_DISMISSED':
            return { ...state, warningDismissed: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_MOBILE_MODE':
            return { ...state, isMobileMode: action.payload };
        case 'APPEND_VIDEO_ITEMS':
            return { ...state, videoItems: [...state.videoItems, ...action.payload] };
        case 'SET_NEXT_PAGE_TOKEN':
            return { ...state, nextPageToken: action.payload };
        case 'INCREMENT_PAGINATION_CLICK':
            return { ...state, paginationClickCount: state.paginationClickCount + 1 };
        case 'RESET_PAGINATION_CLICK':
            return { ...state, paginationClickCount: 0 };
        case 'SET_VIDEO_INFO_COLLAPSED':
            return { ...state, videoInfoCollapsed: action.payload };
        case 'SET_MUTED':
            return { ...state, isMuted: action.payload };
        case 'SET_PLAYBACK_SPEED':
            return { ...state, playbackSpeed: action.payload };
        case 'SET_SHOW_SPEED_CONTROLS':
            return { ...state, showSpeedControls: action.payload };
        case 'SET_SHOW_SHARE_MENU':
            return { ...state, showShareMenu: action.payload };
        case 'SET_PICTURE_IN_PICTURE_ENABLED':
            return { ...state, pictureInPictureEnabled: action.payload };
        default:
            return state;
    }
}


// Constants
const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY || "YOUR_YOUTUBE_API_KEY";
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";

// ========== OPENAI API OPTIMIZATION ==========
// Feature flag to completely disable OpenAI features and minimize API costs
// Set to false to make ZERO OpenAI API calls (saves quota/money)
// Set to true only if you have OpenAI credits and want AI summaries/analysis features
const ENABLE_OPENAI_FEATURES = false;
// ============================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Performance optimization constants
const SEARCH_DEBOUNCE_MS = 300; // Reduced from 500ms for faster response
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const LONG_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for trending/popular content
const MAX_CONCURRENT_REQUESTS = 3; // Limit concurrent API calls
const RATE_LIMIT_DELAY = 100; // 100ms between requests
const MAX_REQUESTS_PER_MINUTE = 50; // YouTube API quota management

// Enhanced cache implementation with different TTLs
const apiCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const pendingRequests = new Map<string, Promise<any>>();
const requestQueue: Array<() => Promise<any>> = [];
const requestTimestamps: number[] = [];

// Note: Cache is shared between YouTube and OpenAI APIs (if OpenAI is enabled)
// Since OpenAI is disabled by default, cache mainly stores YouTube API responses
apiCache.clear();

// Add cache version to invalidate old cached responses
const CACHE_VERSION = 'v3-optimized';
const getCacheKey = (endpoint: string, method: string, body: any): string => {
    return `${CACHE_VERSION}:${method}:${endpoint}:${JSON.stringify(body || {})}`;
};

// Rate limiting and request queue management
const rateLimiter = {
    async waitForSlot(): Promise<void> {
        const now = Date.now();
        // Remove timestamps older than 1 minute
        while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
            requestTimestamps.shift();
        }

        // If we're at the limit, wait
        if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
            const waitTime = 60000 - (now - requestTimestamps[0]);
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        // Add current timestamp
        requestTimestamps.push(now);

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
};

// Smart cache with different TTLs based on content type
const getCacheTTL = (endpoint: string): number => {
    if (endpoint.includes('trending') || endpoint.includes('mostPopular')) {
        return LONG_CACHE_DURATION; // Trending content changes less frequently
    }
    if (endpoint.includes('search')) {
        return CACHE_DURATION; // Search results change more frequently
    }
    return CACHE_DURATION; // Default cache duration
};

// Cache management utilities
const cacheManager = {
    // Clean expired cache entries
    cleanupExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of apiCache.entries()) {
            if (now - value.timestamp > value.ttl) {
                apiCache.delete(key);
            }
        }
    },

    // Get cache statistics
    getCacheStats(): { size: number; hitRate: number } {
        return {
            size: apiCache.size,
            hitRate: 0 // Could be implemented with hit/miss counters
        };
    },

    // Clear all cache
    clearAllCache(): void {
        apiCache.clear();
        pendingRequests.clear();
    }
};

// Periodic cache cleanup
setInterval(() => {
    cacheManager.cleanupExpiredCache();
}, 60000); // Clean every minute

// Component to display the YouTube API search functionality
const YouTubeAPIComponent: React.FC = () => {
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(reducer, initialState);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const mobileScrollRef = useRef<HTMLDivElement>(null);
    const desktopScrollRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(window.innerWidth <= 768 ? 0 : 164);
    const [isLoadingMore, setIsLoadingMore] = useState(false);


    // Firebase hooks (after state destructuring)
    const { user, signIn: signInFirebase, authEnabled } = useFirebaseAuth();
    const { favorites: firebaseFavorites } = useFavorites();
    const { preferences: firebasePreferences } = useUserPreferences();
    const { topics: trendingTopicsFirebase } = useTrendingTopics(10);
    const [favoriteVideoIds, setFavoriteVideoIds] = useState<Set<string>>(new Set());

    // Use Firebase data if available, otherwise fallback to localStorage
    const favorites = authEnabled && user ? firebaseFavorites : getLocalFavorites();
    const preferences = authEnabled && user ? firebasePreferences : getLocalPreferences();

    // Firebase UI state
    const [firebaseDrawerOpen, setFirebaseDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'favorites' | 'history' | 'playlists'>('favorites');
    const [searchHistory, setSearchHistory] = useState<any[]>([]);
    const [watchHistory, setWatchHistory] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const [mainMenuOpen, setMainMenuOpen] = useState(false);
    const [menuSection, setMenuSection] = useState<'main' | 'favorites' | 'history' | 'playlists' | 'search-history' | 'settings'>('main');
    const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [showPlaylistDropdown, setShowPlaylistDropdown] = useState<string | null>(null);
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
    const [selectedVideosForPlaylist, setSelectedVideosForPlaylist] = useState<Set<string>>(new Set());
    const [playlistVideoSource, setPlaylistVideoSource] = useState<'recent' | 'recommended'>('recent');

    // Refs for touch handling to avoid re-renders
    const modalTouchStartYRef = useRef<number>(0);
    const modalTouchStartXRef = useRef<number>(0);
    const modalIsSwipingRef = useRef<boolean>(false);

    // Add CSS for horizontal scroll styling
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .horizontal-scroll-content::-webkit-scrollbar {
                display: none;
            }
            .horizontal-scroll-content {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            .mobile-video-grid .horizontal-scroll-content {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                -webkit-overflow-scrolling: touch !important;
                touch-action: pan-x pan-y !important;
            }
            .desktop-video-container .horizontal-scroll-content {
                display: flex !important;
                flex-direction: row !important;
                overflow-x: auto !important;
                overflow-y: hidden !important;
                -webkit-overflow-scrolling: touch !important;
                touch-action: pan-x !important;
            }
            .mobile-video-grid .horizontal-scroll-content > *,
            .desktop-video-container .horizontal-scroll-content > * {
                flex-shrink: 0 !important;
            }
            .desktop-video-container .horizontal-scroll-content::-webkit-scrollbar {
                height: 8px;
            }
            .desktop-video-container .horizontal-scroll-content::-webkit-scrollbar-track {
                background: rgba(0,0,0,0.05);
                border-radius: 4px;
            }
            .desktop-video-container .horizontal-scroll-content::-webkit-scrollbar-thumb {
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
            }
            .desktop-video-container .horizontal-scroll-content::-webkit-scrollbar-thumb:hover {
                background: rgba(0,0,0,0.3);
            }
            .scroll-btn {
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }
            .scroll-btn:hover {
                background-color: rgba(255, 255, 255, 1) !important;
            }
            @media (max-width: 768px) {
                .scroll-btn {
                    width: 35px !important;
                    height: 35px !important;
                }
                .horizontal-scroll-container .grid-video-card {
                    width: 100vw !important;
                    min-width: 100vw !important;
                    max-width: 100vw !important;
                    height: calc(100vh - 140px) !important;
                    border-radius: 0 !important;
                }
            }
            @media (max-width: 480px) {
                .scroll-btn {
                    width: 30px !important;
                    height: 30px !important;
                }
                .horizontal-scroll-container .grid-video-card {
                    width: 100vw !important;
                    min-width: 100vw !important;
                    max-width: 100vw !important;
                    height: calc(100vh - 120px) !important;
                    border-radius: 0 !important;
                }
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const {
        searchQuery,
        videoItems,
        modalVisible,
        selectedVideoId,
        selectedVideoType,
        authToken,
        transcript,
        transcriptLoading,
        openAIContent,
        selectedVideoTitle,
        selectedVideoDescription,
        selectedVideoChannel,
        selectedVideoDate,
        modalAIContent,
        isLoading,
        contentReady,
        currentVideoIndex,
        touchStartY,
        touchStartX,
        isTransitioning,
        isFullscreen,
        currentVideoPlaying,
        // recommendedVideos removed to comply with YouTube API policy
        videoSummaries,
        topicClusters,
        gapiInitialized,
        dataFetchTime,
        dataRefreshInterval,
        player,
        showSearchBar,
        youtubeAPILoaded,
        youtubeAPILoading,
        warningDismissed,
        defaultSearchExecuted,
        error,
        trendingTopics,
        showTrendingTopics,
        isAuthenticated,
        sessionPersisted,
        tokenClient,
        authError,
        apiKeyWarning,
        sidebarTrending,
        sidebarTrendingLoading,
        sidebarVisible,
        sidebarScrollPosition,
        sidebarTouchStart,
        sidebarIsScrolling,
        modalTouchStartY,
        modalTouchStartX,
        modalIsSwiping,
        swipeInteractionCount,
        isVideoPlaying,
        themeMode,
        isMobileMode,
        nextPageToken,
        paginationClickCount,
        videoInfoCollapsed,
        isMuted,
        playbackSpeed,
        showSpeedControls,
        showShareMenu,
        pictureInPictureEnabled
    } = state;

    // Firebase integration effects - graceful fallback if auth fails
    useEffect(() => {
        if (!user) {
            signInFirebase().catch(err => {
                // Error already handled in firebase-hooks.ts
                // App will continue to work without Firebase auth
                console.log('Firebase authentication unavailable. App will work with local storage only.');
            });
        }
    }, [user, signInFirebase]);

    // Sync favorites from Firebase or localStorage
    useEffect(() => {
        if (authEnabled && user) {
            // Use Firebase favorites
            const ids = new Set(firebaseFavorites.map((fav: any) => fav.videoId));
            setFavoriteVideoIds(ids);
        } else {
            // Use localStorage favorites
            const localFavs = getLocalFavorites();
            const ids = new Set(localFavs.map((fav: any) => fav.videoId));
            setFavoriteVideoIds(ids);
        }
    }, [firebaseFavorites, authEnabled, user]);

    // Load preferences from Firebase or localStorage (only on mount or when user/auth changes)
    const preferencesLoadedRef = useRef(false);
    useEffect(() => {
        // Only load preferences once on mount or when user/auth state changes
        if (preferencesLoadedRef.current) return;

        if (authEnabled && user && firebasePreferences?.themeMode) {
            dispatch({ type: 'SET_THEME_MODE', payload: firebasePreferences.themeMode });
            preferencesLoadedRef.current = true;
        } else if (!authEnabled || !user) {
            // Load from localStorage
            const localPrefs = getLocalPreferences();
            if (localPrefs?.themeMode) {
                dispatch({ type: 'SET_THEME_MODE', payload: localPrefs.themeMode });
            }
            preferencesLoadedRef.current = true;
        }
    }, [user, authEnabled, firebasePreferences]);

    // Reset preferences loaded flag when user/auth changes
    useEffect(() => {
        preferencesLoadedRef.current = false;
    }, [user, authEnabled]);

    // Sync theme to Firebase or localStorage when it changes (debounced to prevent flashing)
    const themeSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        // Clear any pending sync
        if (themeSyncTimeoutRef.current) {
            clearTimeout(themeSyncTimeoutRef.current);
        }

        // Debounce the sync to prevent rapid updates
        themeSyncTimeoutRef.current = setTimeout(() => {
            if (authEnabled && user && themeMode) {
                savePrefs({ themeMode }).catch(() => {
                    // Fallback to localStorage
                    saveLocalPreferences({ themeMode });
                });
            } else if (themeMode) {
                // Use localStorage fallback
                saveLocalPreferences({ themeMode });
            }
        }, 100);

        return () => {
            if (themeSyncTimeoutRef.current) {
                clearTimeout(themeSyncTimeoutRef.current);
            }
        };
    }, [user, authEnabled, themeMode]);

    useEffect(() => {
        if (trendingTopicsFirebase.length > 0) {
            const topics = trendingTopicsFirebase.map(t => t.topic);
            dispatch({ type: 'SET_TRENDING_TOPICS', payload: topics });
        }
    }, [trendingTopicsFirebase]);

    // Load search history, watch history, and playlists
    useEffect(() => {
        if (authEnabled && user) {
            // Use Firebase
            getSearchHistory(10).then(setSearchHistory).catch(() => {
                // Fallback to localStorage on error
                setSearchHistory(getLocalSearchHistory(10));
            });
            getWatchHistory(20).then(setWatchHistory).catch(() => {
                setWatchHistory(getLocalWatchHistory(20));
            });
            getPlaylists().then((playlists) => {
                // Deduplicate playlists by ID to prevent duplicates
                const uniquePlaylists = playlists.filter((playlist, index, self) =>
                    index === self.findIndex((p) => p.id === playlist.id)
                );
                setPlaylists(uniquePlaylists);
            }).catch(console.error);
        } else {
            // Use localStorage fallback
            setSearchHistory(getLocalSearchHistory(10));
            setWatchHistory(getLocalWatchHistory(20));
            setPlaylists([]);
        }
    }, [user, authEnabled]);

    const resolveYouTubeWatchUrl = useCallback((videoItem: any): string => {
        const videoId =
            videoItem?.id?.videoId ||
            videoItem?.contentDetails?.videoId ||
            videoItem?.snippet?.resourceId?.videoId ||
            (typeof videoItem?.id === 'string' ? videoItem.id : null);

        if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
        }

        if (videoItem?.snippet?.channelId) {
            return `https://www.youtube.com/channel/${videoItem.snippet.channelId}`;
        }

        return 'https://www.youtube.com/';
    }, []);


    // Memoized functions with optimized timing
    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            if (query.trim()) {
                executeSearch();
            }
        }, SEARCH_DEBOUNCE_MS),
        []
    );

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
    }, []);

    // Optimized cached API request function with rate limiting
    const cachedApiRequest = async (endpoint: string, method: string, body: any, customHeaders?: any): Promise<any> => {
        const cacheKey = getCacheKey(endpoint, method, body);
        const ttl = getCacheTTL(endpoint);

        // Check cache first
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < ttl) {
            logDebug(`Cache hit for: ${endpoint}`, "info");
            return cached.data;
        }

        // Check if request is already pending to avoid duplicates
        if (pendingRequests.has(cacheKey)) {
            logDebug(`Request already pending for: ${endpoint}`, "info");
            return pendingRequests.get(cacheKey);
        }

        // Apply rate limiting
        await rateLimiter.waitForSlot();

        // Make the request
        const requestPromise = apiRequest(endpoint, method, body, customHeaders)
            .then(data => {
                // Cache successful responses with appropriate TTL
                apiCache.set(cacheKey, { data, timestamp: Date.now(), ttl });
                pendingRequests.delete(cacheKey);
                logDebug(`Cached response for: ${endpoint} (TTL: ${ttl}ms)`, "success");
                return data;
            })
            .catch(error => {
                pendingRequests.delete(cacheKey);
                throw error;
            });

        pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
    };

    // Retry mechanism for API calls
    const retryOperation = async <T,>(
        operation: () => Promise<T>,
        retries: number = MAX_RETRIES
    ): Promise<T> => {
        try {
            return await operation();
        } catch (error) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return retryOperation(operation, retries - 1);
            }
            throw error;
        }
    };

    const logDebug = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
        const safeMessage = message.replace(/[^\x20-\x7E]/g, '');
        console.log(`[${type.toUpperCase()}] ${safeMessage}`);
    };

    // Helper function to extract JSON from OpenAI responses
    const extractJSONFromResponse = (content: string): any => {
        try {
            logDebug(`Attempting to extract JSON from: ${content.substring(0, 100)}...`, "info");

            // Remove markdown code blocks - handle both single and triple backticks
            let cleanContent = content.replace(/```json\s*|\s*```|`json\s*|\s*`/g, '').trim();

            // Remove markdown headers and other formatting
            cleanContent = cleanContent.replace(/^#+\s+.*$/gm, '').trim();

            // Remove markdown bold/italic formatting
            cleanContent = cleanContent.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim();

            // Remove any remaining backticks at start/end
            cleanContent = cleanContent.replace(/^`+|`+$/g, '').trim();

            logDebug(`Cleaned content: ${cleanContent.substring(0, 100)}...`, "info");

            // Try to find JSON array or object - use non-greedy matching
            const jsonArrayMatch = cleanContent.match(/\[[\s\S]*?\]/);
            const jsonObjectMatch = cleanContent.match(/\{[\s\S]*?\}/);

            if (jsonArrayMatch) {
                logDebug(`Found JSON array: ${jsonArrayMatch[0].substring(0, 50)}...`, "info");
                return JSON.parse(jsonArrayMatch[0]);
            } else if (jsonObjectMatch) {
                logDebug(`Found JSON object: ${jsonObjectMatch[0].substring(0, 50)}...`, "info");
                return JSON.parse(jsonObjectMatch[0]);
            } else {
                // Try parsing the whole cleaned content
                logDebug(`Attempting to parse entire content as JSON`, "info");
                return JSON.parse(cleanContent);
            }
        } catch (error) {
            logDebug(`JSON extraction failed for content: "${content.substring(0, 200)}..." Error: ${error}`, "error");
            return null;
        }
    };

    // Add fetchOpenAIContent function
    const fetchOpenAIContent = async (inputValue: string): Promise<OpenAIResponse> => {
        const payload = {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: `100 word paragraph only with subject title for ${inputValue}`,
                },
            ],
        };

        return await makeOpenAIRequest("chat/completions", payload);
    };

    // Inject styles and apply theme on mount
    useEffect(() => {
        ensureGlobalStylesInjected();
        applyTheme(themeMode);

        // Ensure Google API is initialized
        // Initialize app with API key only (no OAuth)
        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Simplified useEffect for auto-search
    useEffect(() => {
        console.log("🔍 Auto-search useEffect triggered:", {
            gapiInitialized,
            videoItemsLength: videoItems.length,
            isLoading,
            defaultSearchExecuted
        });

        if (gapiInitialized && !videoItems.length && !isLoading && !defaultSearchExecuted) {
            console.log("✅ GAPI initialized, executing default search");
            dispatch({ type: 'SET_DEFAULT_SEARCH_EXECUTED', payload: true });
            executeSearch();
        }
    }, [gapiInitialized, videoItems.length, isLoading, defaultSearchExecuted]);

    // Update theme on change
    useEffect(() => {
        applyTheme(themeMode);
    }, [themeMode]);

    // YouTube Data Management - Policy III.E.4.a-g compliance
    useEffect(() => {
        // Set up data refresh interval
        const refreshInterval = setInterval(() => {
            refreshYouTubeData();
            clearExpiredYouTubeData();
        }, YOUTUBE_DATA_REFRESH_INTERVAL);

        dispatch({ type: 'SET_DATA_REFRESH_INTERVAL', payload: refreshInterval });

        // Clean up on unmount
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [dataFetchTime, searchQuery]);

    // Clean up data on component unmount
    useEffect(() => {
        return () => {
            if (dataRefreshInterval) {
                clearInterval(dataRefreshInterval);
            }
            // Clear YouTube data on unmount to comply with storage policies
            logDebug("Component unmounting, clearing YouTube data", "info");
            dispatch({ type: 'SET_VIDEO_ITEMS', payload: [] });
            // Recommended videos removed to comply with YouTube API policy
            dispatch({ type: 'SET_VIDEO_SUMMARIES', payload: {} });
            dispatch({ type: 'SET_TOPIC_CLUSTERS', payload: {} });
        };
    }, []);

    // Reset scroll position and collapsed state of video info display when modal opens
    useEffect(() => {
        if (modalVisible && selectedVideoId) {
            // Reset to collapsed state on modal open (mobile full-screen by default)
            dispatch({ type: 'SET_VIDEO_INFO_COLLAPSED', payload: true });
            // Reset to unmuted state on modal open
            dispatch({ type: 'SET_MUTED', payload: false });

            // Small delay to ensure the DOM is rendered
            setTimeout(() => {
                // Reset scroll for the scrollable content area (second child div)
                const videoInfoDisplay = document.querySelector('.video-info-display > div:last-child');
                if (videoInfoDisplay) {
                    videoInfoDisplay.scrollTop = 0;
                    console.log('🔝 Reset video info display scroll to top');
                }
            }, 100);
        }
    }, [modalVisible, selectedVideoId]);

    const toggleTheme = useCallback(() => {
        const newTheme = themeMode === 'light' ? 'dark' : 'light';
        dispatch({ type: 'SET_THEME_MODE', payload: newTheme });
        // Apply theme immediately
        applyTheme(newTheme);
    }, [themeMode]);

    // Playlist helper functions
    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim() || isCreatingPlaylist) return;

        setIsCreatingPlaylist(true);
        try {
            if (authEnabled && user) {
                // Get selected videos
                const selectedVideos: FavoriteVideo[] = [];

                if (playlistVideoSource === 'recent' && watchHistory.length > 0) {
                    // Add selected videos from watch history
                    watchHistory.forEach(item => {
                        if (selectedVideosForPlaylist.has(item.videoId)) {
                            selectedVideos.push({
                                videoId: item.videoId,
                                title: item.title,
                                channelTitle: item.channelTitle,
                                thumbnail: item.thumbnail,
                                description: item.description,
                                addedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
                            });
                        }
                    });
                } else if (playlistVideoSource === 'recommended' && videoItems.length > 0) {
                    // Add selected videos from current video items
                    videoItems.forEach(item => {
                        if (selectedVideosForPlaylist.has(item.id.videoId)) {
                            selectedVideos.push({
                                videoId: item.id.videoId,
                                title: item.snippet.title,
                                channelTitle: item.snippet.channelTitle,
                                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
                                description: item.snippet.description,
                                addedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
                            });
                        }
                    });
                }

                const playlistId = await createPlaylist({
                    name: newPlaylistName.trim(),
                    description: newPlaylistDescription.trim() || undefined,
                    videos: selectedVideos,
                    isPublic: false
                });

                // Small delay to ensure Firebase has processed the write
                await new Promise(resolve => setTimeout(resolve, 500));
                // Refresh playlists and deduplicate
                const updatedPlaylists = await getPlaylists();
                const uniquePlaylists = updatedPlaylists.filter((playlist, index, self) =>
                    index === self.findIndex((p) => p.id === playlist.id)
                );
                setPlaylists(uniquePlaylists);
            }
            setNewPlaylistName('');
            setNewPlaylistDescription('');
            setSelectedVideosForPlaylist(new Set());
            setPlaylistVideoSource('recent');
            setShowCreatePlaylistModal(false);
        } catch (error) {
            console.error('Error creating playlist:', error);
            alert('Failed to create playlist. Please try again.');
        } finally {
            setIsCreatingPlaylist(false);
        }
    };

    const handleAddToPlaylist = async (playlistId: string, video: FavoriteVideo | any) => {
        try {
            if (authEnabled && user) {
                // Convert LocalFavorite to FavoriteVideo format if needed
                const favoriteVideo: FavoriteVideo = {
                    videoId: video.videoId,
                    title: video.title,
                    channelTitle: video.channelTitle,
                    thumbnail: video.thumbnail,
                    description: video.description,
                    addedAt: video.addedAt || { seconds: Date.now() / 1000, nanoseconds: 0 } as any
                };
                await addVideoToPlaylist(playlistId, favoriteVideo);
                // Refresh playlists and deduplicate
                getPlaylists().then((playlists) => {
                    const uniquePlaylists = playlists.filter((playlist, index, self) =>
                        index === self.findIndex((p) => p.id === playlist.id)
                    );
                    setPlaylists(uniquePlaylists);
                }).catch(console.error);
            }
            setShowPlaylistDropdown(null);
        } catch (error) {
            console.error('Error adding to playlist:', error);
            alert('Failed to add video to playlist. Please try again.');
        }
    };

    const handleRemoveFromFavorites = async (videoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleFavorite(videoId, '', '', '');
        } catch (error) {
            console.error('Error removing from favorites:', error);
        }
    };

    const handleRemoveFromPlaylist = async (playlistId: string, video: FavoriteVideo, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (authEnabled && user) {
                await removeVideoFromPlaylist(playlistId, video);
                // Refresh playlists and deduplicate
                getPlaylists().then((playlists) => {
                    const uniquePlaylists = playlists.filter((playlist, index, self) =>
                        index === self.findIndex((p) => p.id === playlist.id)
                    );
                    setPlaylists(uniquePlaylists);
                }).catch(console.error);
            }
        } catch (error) {
            console.error('Error removing from playlist:', error);
            alert('Failed to remove video from playlist.');
        }
    };

    const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this playlist?')) return;

        try {
            if (authEnabled && user) {
                // Delete from Firebase
                await deletePlaylist(playlistId);

                // Immediately update UI by filtering out the deleted playlist
                setPlaylists(prevPlaylists => {
                    const filtered = prevPlaylists.filter(p => p.id !== playlistId);
                    // Deduplicate
                    return filtered.filter((playlist, index, self) =>
                        index === self.findIndex((p) => p.id === playlist.id)
                    );
                });

                // Refresh from Firebase after a short delay to ensure consistency
                setTimeout(async () => {
                    try {
                        const refreshedPlaylists = await getPlaylists();
                        const uniquePlaylists = refreshedPlaylists.filter((playlist, index, self) =>
                            index === self.findIndex((p) => p.id === playlist.id)
                        );
                        setPlaylists(uniquePlaylists);
                    } catch (refreshError) {
                        console.error('Error refreshing playlists after delete:', refreshError);
                        // UI already updated, so this is just for consistency
                    }
                }, 500);
            } else {
                // Handle localStorage fallback (if playlists are stored locally)
                // For now, just show an error since localStorage playlists aren't implemented
                alert('Playlist deletion requires authentication. Please sign in.');
            }
        } catch (error) {
            console.error('Error deleting playlist:', error);
            alert('Failed to delete playlist. Please try again.');
        }
    };

    // Simplified authentication - API key only (no OAuth warnings)
    const initializeApp = () => {
        console.log('🚀 Initializing app with API key authentication only');

        // Check if YouTube API key is available
        if (!YOUTUBE_API_KEY) {
            console.error('❌ Missing YOUTUBE_API_KEY. Define it in your environment (e.g. .env).');
            dispatch({ type: 'SET_ERROR', payload: 'Missing YouTube API key. Please add YOUTUBE_API_KEY to your environment variables.' });
            return;
        }

        // Set authenticated state immediately (no OAuth required)
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Initialize GAPI client directly
        const initGapi = () => {
            if (typeof window.gapi !== 'undefined' && window.gapi.load) {
                window.gapi.load('client', () => {
                    window.gapi.client.init({
                        apiKey: YOUTUBE_API_KEY,
                        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"]
                    }).then(() => {
                        console.log("✅ GAPI client initialized successfully");
                        dispatch({ type: 'SET_GAPI_INITIALIZED', payload: true });
                    }).catch((error: any) => {
                        console.error("❌ GAPI initialization failed:", error);
                    });
                });
            } else {
                // Wait for gapi to load
                setTimeout(initGapi, 500);
            }
        };

        // Start GAPI initialization
        initGapi();

        console.log("✅ App initialized successfully with API key authentication");
    };

    // Removed OAuth login - using API key only
    const handleGoogleLogin = () => {
        console.log("ℹ️ OAuth login removed - using API key authentication only");
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
    };

    // Mode functions removed - app is always in public mode


    // Enhanced loadGapiScript with better error handling and retry logic
    const loadGapiScript = (retryCount = 0, maxRetries = 3) => {
        return new Promise<void>((resolve, reject) => {
            if (window.gapi && window.gapi.client && gapiInitialized) {
                logDebug("Google API already initialized", "success");
                resolve();
                return;
            }

            // Check if script already exists
            const existingScript = document.querySelector('script[src*="apis.google.com/js/api.js"]');
            if (existingScript) {
                logDebug("Google API script already exists, waiting for load...", "info");
                // Wait a bit and check if gapi is available
                setTimeout(() => {
                    if (window.gapi && window.gapi.load) {
                        initializeGapiClient().then(resolve).catch(reject);
                    } else {
                        reject(new Error("Google API script exists but gapi not available"));
                    }
                }, 1000);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';

            script.onload = () => {
                logDebug("Google API script loaded successfully", "success");
                initializeGapiClient().then(resolve).catch((error) => {
                    if (retryCount < maxRetries) {
                        logDebug(`GAPI initialization failed, retrying... (${retryCount + 1}/${maxRetries})`, "warning");
                        setTimeout(() => {
                            loadGapiScript(retryCount + 1, maxRetries).then(resolve).catch(reject);
                        }, 2000 * (retryCount + 1)); // Exponential backoff
                    } else {
                        reject(error);
                    }
                });
            };

            script.onerror = (error) => {
                logDebug(`Failed to load Google API script: ${error}`, "error");
                if (retryCount < maxRetries) {
                    logDebug(`Script load failed, retrying... (${retryCount + 1}/${maxRetries})`, "warning");
                    setTimeout(() => {
                        loadGapiScript(retryCount + 1, maxRetries).then(resolve).catch(reject);
                    }, 2000 * (retryCount + 1));
                } else {
                    reject(new Error("Failed to load Google API script after multiple attempts"));
                }
            };

            // Add timeout
            setTimeout(() => {
                if (!window.gapi) {
                    logDebug("Google API script load timeout", "error");
                    if (retryCount < maxRetries) {
                        logDebug(`Script load timeout, retrying... (${retryCount + 1}/${maxRetries})`, "warning");
                        loadGapiScript(retryCount + 1, maxRetries).then(resolve).catch(reject);
                    } else {
                        reject(new Error("Google API script load timeout"));
                    }
                }
            }, 10000); // 10 second timeout

            document.head.appendChild(script);
        });
    };

    // Separate function to initialize GAPI client
    const initializeGapiClient = () => {
        return new Promise<void>((resolve, reject) => {
            if (!window.gapi || !window.gapi.load) {
                reject(new Error("Google API not available"));
                return;
            }

            window.gapi.load('client', () => {
                if (!YOUTUBE_API_KEY) {
                    logDebug("YouTube API key missing during initialization", "error");
                    reject(new Error("YouTube API key not configured"));
                    return;
                }

                window.gapi.client.init({
                    apiKey: YOUTUBE_API_KEY,
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"]
                }).then(() => {
                    logDebug("GAPI client initialized successfully", "success");
                    dispatch({ type: 'SET_GAPI_INITIALIZED', payload: true });
                    resolve();
                }).catch((error: any) => {
                    logDebug(`GAPI initialization error: ${error.message}`, "error");
                    reject(error);
                });
            });
        });
    };

    // Modify loadYouTubeAPI to handle CORS and tracking prevention with more strategies
    const loadYouTubeAPI = () => {
        return new Promise<void>((resolve, reject) => {
            if (window.YT && window.YT.Player) {
                logDebug("YouTube IFrame API already loaded", "success");
                dispatch({ type: 'SET_YOUTUBE_API_LOADED', payload: true });
                dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: false });
                resolve();
                return;
            }

            dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: true });

            // Check if script already exists
            if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
                logDebug("YouTube IFrame API script already present, waiting for API...", "info");
                // Wait for the API to be ready
                const checkReady = setInterval(() => {
                    if (window.YT && window.YT.Player) {
                        clearInterval(checkReady);
                        logDebug("YouTube IFrame API Ready (from existing script)", "success");
                        dispatch({ type: 'SET_YOUTUBE_API_LOADED', payload: true });
                        dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: false });
                        resolve();
                    }
                }, 100);

                // Add timeout for existing script
                const timeout = setTimeout(() => {
                    clearInterval(checkReady);
                    logDebug("YouTube IFrame API loading timeout (existing script)", "error");
                    dispatch({ type: 'SET_YOUTUBE_API_LOADED', payload: false });
                    dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: false });
                    reject(new Error("YouTube IFrame API loading timeout (existing script)"));
                }, 10000);

                return;
            }

            // Try multiple loading strategies
            const loadStrategies = [
                // Strategy 1: Standard loading
                () => {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.async = true;
                    tag.defer = true;
                    tag.crossOrigin = "anonymous";
                    return tag;
                },
                // Strategy 2: With no-cache headers
                () => {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.async = true;
                    tag.defer = true;
                    tag.crossOrigin = "anonymous";
                    tag.setAttribute('data-no-cache', 'true');
                    return tag;
                },
                // Strategy 3: Alternative domain
                () => {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.async = true;
                    tag.defer = true;
                    tag.crossOrigin = "anonymous";
                    return tag;
                },
                // Strategy 4: With different loading approach
                () => {
                    const tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/iframe_api";
                    tag.async = false;
                    tag.defer = false;
                    tag.crossOrigin = "anonymous";
                    return tag;
                },
                // Strategy 5: Using fetch to load script content
                () => {
                    const tag = document.createElement('script');
                    tag.textContent = `
                        // Inline YouTube IFrame API loader
                        (function() {
                            var tag = document.createElement('script');
                            tag.src = "https://www.youtube.com/iframe_api";
                            var firstScriptTag = document.getElementsByTagName('script')[0];
                            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                        })();
                    `;
                    return tag;
                }
            ];

            let currentStrategy = 0;
            let attempts = 0;
            const maxAttempts = 5;

            const tryLoadStrategy = () => {
                if (attempts >= maxAttempts) {
                    logDebug("All YouTube API loading strategies failed", "error");
                    dispatch({ type: 'SET_YOUTUBE_API_LOADED', payload: false });
                    dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: false });
                    reject(new Error("All YouTube API loading strategies failed"));
                    return;
                }

                attempts++;
                logDebug(`Trying YouTube API loading strategy ${currentStrategy + 1} (attempt ${attempts})`, "info");

                try {
                    const tag = loadStrategies[currentStrategy]();

                    window.onYouTubeIframeAPIReady = () => {
                        logDebug(`YouTube IFrame API Ready (strategy ${currentStrategy + 1})`, "success");
                        logDebug(`YT object available: ${!!window.YT}`, "info");
                        logDebug(`YT.Player available: ${!!window.YT?.Player}`, "info");
                        dispatch({ type: 'SET_YOUTUBE_API_LOADED', payload: true });
                        dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: false });
                        resolve();
                    };

                    tag.onerror = () => {
                        logDebug(`Strategy ${currentStrategy + 1} failed, trying next...`, "warning");
                        currentStrategy = (currentStrategy + 1) % loadStrategies.length;
                        setTimeout(tryLoadStrategy, 1000);
                    };

                    // Add timeout for this strategy
                    const timeout = setTimeout(() => {
                        logDebug(`Strategy ${currentStrategy + 1} timeout`, "warning");
                        currentStrategy = (currentStrategy + 1) % loadStrategies.length;
                        setTimeout(tryLoadStrategy, 1000);
                    }, 8000);

                    // Remove any existing scripts first
                    const existingScripts = document.querySelectorAll('script[src*="youtube.com/iframe_api"]');
                    existingScripts.forEach(script => script.remove());

                    // Add the script to the document
                    document.body.appendChild(tag);

                    // Clear timeout if API loads successfully
                    window.onYouTubeIframeAPIReady = () => {
                        clearTimeout(timeout);
                        logDebug(`YouTube IFrame API Ready (strategy ${currentStrategy + 1})`, "success");
                        logDebug(`YT object available: ${!!window.YT}`, "info");
                        logDebug(`YT.Player available: ${!!window.YT?.Player}`, "info");
                        dispatch({ type: 'SET_YOUTUBE_API_LOADED', payload: true });
                        dispatch({ type: 'SET_YOUTUBE_API_LOADING', payload: false });
                        resolve();
                    };

                } catch (error) {
                    logDebug(`Error in strategy ${currentStrategy + 1}: ${error}`, "error");
                    currentStrategy = (currentStrategy + 1) % loadStrategies.length;
                    setTimeout(tryLoadStrategy, 1000);
                }
            };

            tryLoadStrategy();
        });
    };

    // Add initializeYouTube function
    const initializeYouTube = async () => {
        if (!YOUTUBE_API_KEY) {
            logDebug("YouTube API key is not configured", "error");
            return;
        }

        try {
            // Try to load saved authentication session first
            const sessionLoaded = loadAuthSession();

            if (!sessionLoaded) {
                // Fallback to the old method if no session exists
                const storedToken = localStorage.getItem('youtubeAuthToken');
                if (storedToken) {
                    try {
                        const tokenData = JSON.parse(storedToken);
                        if (tokenData.access_token) {
                            dispatch({ type: 'SET_AUTH_TOKEN', payload: tokenData.access_token });
                            dispatch({ type: 'SET_AUTHENTICATED', payload: true });
                            logDebug("Authentication token loaded successfully", "success");
                        }
                    } catch (error) {
                        logDebug("Failed to parse stored token", "error");
                        localStorage.removeItem('youtubeAuthToken');
                    }
                }
            }

            // REMOVED: executeSearch() call here to prevent duplicate searches
            // The auto-search useEffect (line 754-767) handles the initial search
            logDebug("YouTube initialization complete - auto-search useEffect will trigger search", "success");
        } catch (error) {
            logDebug(`Failed to initialize YouTube API: ${error}`, "error");
        }
    };

    // Modify the useEffect for API initialization
    useEffect(() => {
        const initializeAPI = async () => {
            try {
                // Load GAPI first
                await loadGapiScript();
                logDebug("GAPI loaded successfully", "success");

                // Then load YouTube IFrame API
                try {
                    await loadYouTubeAPI();
                    logDebug("YouTube IFrame API loaded successfully", "success");
                } catch (error) {
                    logDebug(`YouTube IFrame API failed to load: ${error}`, "error");
                    logDebug("This might be due to tracking prevention or network issues", "warning");
                    logDebug("Videos will not be able to play in the modal", "warning");
                }

                // Initialize YouTube
                await initializeYouTube();
                logDebug("YouTube initialization complete", "success");
            } catch (error) {
                logDebug(`API initialization error: ${error}`, "error");
            }
        };

        initializeAPI();

        return () => {
            if (player) {
                player.destroy();
            }
        };
    }, []);

    // Initialize player when video is selected
    useEffect(() => {
        // Check if mobile device - improved detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);

        if (isMobile) {
            console.log("📱 Mobile device detected, using iframe fallback", {
                userAgent: navigator.userAgent,
                windowWidth: window.innerWidth,
                hasTouch: 'ontouchstart' in window,
                maxTouchPoints: navigator.maxTouchPoints,
                selectedVideoId,
                modalVisible,
                currentMobileMode: isMobileMode
            });
            // On mobile, we don't use the YouTube API player, just the iframe fallback
            // Set a flag to indicate mobile mode is active
            dispatch({ type: 'SET_MOBILE_MODE', payload: true });
            console.log("📱 Mobile mode set to true");
            return;
        } else {
            // Ensure mobile mode is false for desktop
            if (isMobileMode) {
                dispatch({ type: 'SET_MOBILE_MODE', payload: false });
                console.log("🖥️ Desktop detected, mobile mode disabled");
            }
        }

        if (selectedVideoId && modalVisible) {
            logDebug(`Attempting to create player for video: ${selectedVideoId}`, "info");
            logDebug(`YT available: ${!!window.YT}`, "info");
            logDebug(`YT.Player available: ${!!window.YT?.Player}`, "info");
            logDebug(`YouTube API loaded state: ${youtubeAPILoaded}`, "info");
            logDebug(`YouTube API loading state: ${youtubeAPILoading}`, "info");

            // Wait until YT is loaded with multiple retry attempts
            if (!window.YT || !window.YT.Player) {
                logDebug("YouTube IFrame API not ready yet, retrying...", "warning");

                let retryCount = 0;
                const maxRetries = 5;

                const retryPlayerCreation = () => {
                    retryCount++;
                    logDebug(`Player creation retry ${retryCount}/${maxRetries}`, "info");

                    if (window.YT && window.YT.Player) {
                        logDebug("YouTube API now available, creating player", "success");
                        dispatch({ type: 'SET_SELECTED_VIDEO', payload: { id: selectedVideoId, type: 'youtube', title: selectedVideoTitle, description: selectedVideoDescription, channel: selectedVideoChannel, date: selectedVideoDate } });
                        return;
                    }

                    if (retryCount < maxRetries) {
                        setTimeout(retryPlayerCreation, 2000);
                    } else {
                        logDebug("Max retries reached, YouTube API not available", "error");
                        logDebug("This is likely due to tracking prevention blocking the YouTube IFrame API", "warning");
                        // Don't retry anymore, show fallback in modal
                    }
                };

                setTimeout(retryPlayerCreation, 1000);
                return;
            }

            // Wait for the DOM element to be available
            const playerElement = document.getElementById('player');
            if (!playerElement) {
                logDebug("Player element not found, waiting...", "warning");
                // Retry a few times to find the player element
                let retryCount = 0;
                const maxRetries = 10;
                const retryFindElement = () => {
                    retryCount++;
                    const element = document.getElementById('player');
                    if (element) {
                        logDebug("Player element found after retry", "success");
                        // Continue with player creation
                        return;
                    }
                    if (retryCount < maxRetries) {
                        setTimeout(retryFindElement, 100);
                    } else {
                        logDebug("Player element not found after max retries", "error");
                    }
                };
                setTimeout(retryFindElement, 100);
                return;
            }

            if (player) {
                try {
                    logDebug("Destroying previous player", "info");
                    player.destroy();
                } catch (error) {
                    logDebug("Error destroying previous player", "warning");
                }
            }

            try {
                console.log("🎥 Creating new YouTube player (desktop)", {
                    videoId: selectedVideoId
                });
                const newPlayer = new window.YT.Player('player', {
                    host: 'https://www.youtube.com', // Prevents privacy-safe mode notification
                    height: '100%',
                    width: '100%',
                    videoId: selectedVideoId,
                    playerVars: {
                        'autoplay': 1, // Enable autoplay on desktop
                        'controls': 1,
                        'modestbranding': 1,
                        'playsinline': 1, // Essential for mobile - prevents fullscreen takeover
                        'rel': 0, // Don't show related videos from other channels
                        'mute': 1, // Start muted for better UX
                        'enablejsapi': 1,
                        'origin': window.location.origin,
                        'iv_load_policy': 3, // Hide annotations
                        'fs': 1, // Allow fullscreen
                        'cc_load_policy': 0, // Don't show captions by default
                        'disablekb': 0, // Keep keyboard controls
                        'hl': 'en', // Interface language
                        'start': 0, // Start from beginning
                        'widget_referrer': window.location.origin // Policy compliance
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange,
                        'onError': onPlayerError
                    }
                });

                // Store player reference immediately as fallback
                dispatch({ type: 'SET_PLAYER', payload: newPlayer });
                logDebug(`Player created successfully for video: ${selectedVideoId}`, "success");

                // Fallback: Set player reference after a short delay if onPlayerReady doesn't fire
                setTimeout(() => {
                    if (!player) {
                        logDebug("onPlayerReady didn't fire, using fallback player reference", "warning");
                        dispatch({ type: 'SET_PLAYER', payload: newPlayer });
                    }
                }, 2000);
            } catch (error) {
                logDebug(`Error creating player: ${error}`, "error");
            }
        }
    }, [selectedVideoId, modalVisible, youtubeAPILoaded, youtubeAPILoading]);

    const onPlayerReady = (event: any) => {
        console.log("🎥 Player Ready event fired (desktop)", {
            videoId: selectedVideoId,
            playerTarget: !!event.target,
            playerMethods: {
                playVideo: typeof event.target.playVideo,
                getPlayerState: typeof event.target.getPlayerState,
                unMute: typeof event.target.unMute
            }
        });
        try {
            // Store player reference
            dispatch({ type: 'SET_PLAYER', payload: event.target });
            logDebug("Player reference stored in onPlayerReady", "success");

            // Attempt to play video with user interaction fallback
            const attemptPlay = () => {
                try {
                    const currentState = event.target.getPlayerState();
                    logDebug(`Current player state: ${currentState}`, "info");

                    if (currentState === window.YT.PlayerState.UNSTARTED ||
                        currentState === window.YT.PlayerState.PAUSED) {
                        event.target.playVideo();
                        logDebug("Video play initiated", "success");
                    }
                } catch (error) {
                    logDebug(`Error playing video: ${error}`, "warning");
                }
            };

            // Try to play immediately
            attemptPlay();

            // Unmute after a short delay
            setTimeout(() => {
                try {
                    event.target.unMute();
                    logDebug("Video unmuted", "success");
                } catch (error) {
                    logDebug(`Error unmuting: ${error}`, "warning");
                }
            }, 300);

        } catch (error) {
            logDebug(`Error in onPlayerReady: ${error}`, "error");
        }
    };

    const onPlayerStateChange = (event: any) => {
        const states: { [key: number]: string } = {
            [-1]: 'unstarted',
            [0]: 'ended',
            [1]: 'playing',
            [2]: 'paused',
            [3]: 'buffering',
            [5]: 'video cued'
        };
        logDebug(`Player state changed to: ${states[event.data] || 'unknown'}`, "info");

        // Update playing state
        dispatch({ type: 'SET_IS_VIDEO_PLAYING', payload: event.data === window.YT.PlayerState.PLAYING });

        if (event.data === window.YT.PlayerState.ENDED) {
            // Auto-play next video when current video ends
            if (currentVideoIndex < videoItems.length - 1) {
                navigateVideo('down');
            }
        }
    };

    const onPlayerError = (event: any) => {
        logDebug(`Player Error: ${event.data}`, "error");
    };

    // Search bar is now always visible - no toggle needed

    // Add trending sidebar toggle handler
    const toggleTrendingSidebar = () => {
        dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: !sidebarVisible });
    };

    // Modify executeSearch to prevent default search override
    const executeSearch = async () => {
        if (isLoading) return;

        const currentQuery = searchQuery || await generateRandomReelsQuery();
        console.log(`🔍 Executing search with query: ${currentQuery}`);
        console.log(`🔍 Current searchQuery: "${searchQuery}"`);
        await searchVideos(currentQuery);
    };

    // Fetch the OpenAI content - Controlled by feature flag
    const getYouTubeContent = async (inputValue: string) => {
        if (!ENABLE_OPENAI_FEATURES) {
            logDebug(`OpenAI content generation disabled (ENABLE_OPENAI_FEATURES=false)`, "info");
            dispatch({ type: 'SET_OPENAI_CONTENT', payload: "" });
            return;
        }

        try {
            logDebug(`Generating main content for: ${inputValue}`);
            const response = await fetchOpenAIContent(inputValue);
            const content = response.choices[0].message.content;
            logDebug(`Fetched main content: ${content.substring(0, 50)}...`);
            dispatch({ type: 'SET_OPENAI_CONTENT', payload: content });
        } catch (error) {
            logDebug(`getYouTubeInfo failed: ${error}`, "error");
        }
    };

    // New function to get AI analysis for a specific video - Controlled by feature flag
    const getVideoAnalysis = async (videoTitle: string, videoDescription: string) => {
        if (!ENABLE_OPENAI_FEATURES) {
            logDebug(`OpenAI video analysis disabled (ENABLE_OPENAI_FEATURES=false)`, "info");
            dispatch({ type: 'SET_MODAL_AI_CONTENT', payload: "" });
            return;
        }

        try {
            logDebug(`Generating AI analysis for video: ${videoTitle}`);
            const response = await fetchOpenAIContent(`Analyze this YouTube video: "${videoTitle}". Description: "${videoDescription}"`);
            const content = response.choices[0].message.content;
            logDebug(`Generated video analysis: ${content.substring(0, 50)}...`);
            dispatch({ type: 'SET_MODAL_AI_CONTENT', payload: content });
        } catch (error) {
            logDebug(`Video analysis failed: ${error}`, "error");
            dispatch({ type: 'SET_MODAL_AI_CONTENT', payload: "Unable to generate analysis for this video." });
        }
    };

    // Optimized OpenAI request with caching - Controlled by feature flag
    const makeOpenAIRequest = async (endpoint: string, payload: any) => {
        if (!ENABLE_OPENAI_FEATURES) {
            logDebug("OpenAI API calls disabled (ENABLE_OPENAI_FEATURES=false)", "info");
            throw new Error("OpenAI API disabled to minimize costs");
        }

        if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY") {
            throw new Error("OpenAI API key is not configured");
        }

        const headers = {
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        };

        return await cachedApiRequest(`https://api.openai.com/v1/${endpoint}`, "POST", payload, headers);
    };

    // Fetch transcript for a video
    const fetchTranscript = async (videoId: string) => {
        if (!authToken) {
            logDebug("Cannot fetch transcript: No authentication token available", "error");
            dispatch({ type: 'SET_TRANSCRIPT', payload: "" });
            return;
        }

        dispatch({ type: 'SET_TRANSCRIPT_LOADING', payload: true });
        logDebug(`Fetching transcript for video: ${videoId}`);

        try {
            // ... existing transcript fetching code ...
        } catch (error: any) {
            const errorMessage = error?.message || "Unknown error occurred";
            const errorDetails = error ? JSON.stringify(error) : "No error details available";
            logDebug(`Error fetching transcript: ${errorMessage}`, "error");
            logDebug(`Error details: ${errorDetails}`, "error");
            dispatch({ type: 'SET_TRANSCRIPT', payload: "" });
        } finally {
            dispatch({ type: 'SET_TRANSCRIPT_LOADING', payload: false });
        }
    };

    // Helper function to format time in MM:SS format
    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // User interaction detection for enabling unmuted autoplay
    const [userHasInteracted, setUserHasInteracted] = React.useState(false);

    // Global interaction detection
    React.useEffect(() => {
        const handleUserInteraction = () => {
            if (!userHasInteracted) {
                setUserHasInteracted(true);
                console.log('🎯 User interaction detected - unmuted autoplay now possible');
            }
        };

        // Listen for any user interaction
        document.addEventListener('touchstart', handleUserInteraction, { once: true });
        document.addEventListener('click', handleUserInteraction, { once: true });
        document.addEventListener('keydown', handleUserInteraction, { once: true });

        return () => {
            document.removeEventListener('touchstart', handleUserInteraction);
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
    }, [userHasInteracted]);

    // Modal handling
    const openModal = async (videoId: string, videoType: 'youtube', videoTitle: string, videoDescription: string, channelTitle: string, publishedAt: string) => {
        // Improved mobile detection
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);

        console.log(`📱 Opening modal for video: ${videoId}`, {
            videoTitle,
            isMobile,
            windowWidth: window.innerWidth,
            hasTouch: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints,
            userAgent: navigator.userAgent,
            currentMobileMode: isMobileMode,
            modalVisible: modalVisible,
            selectedVideoId: selectedVideoId
        });

        // Force update mobile mode if detection changed
        if (isMobile !== isMobileMode) {
            console.log(`📱 Mobile detection changed: ${isMobileMode} -> ${isMobile}, updating state`);
            dispatch({ type: 'SET_MOBILE_MODE', payload: isMobile });
        }

        // Find the index of the video being opened
        const videoIndex = videoItems.findIndex(item => item.id.videoId === videoId);
        if (videoIndex !== -1) {
            dispatch({ type: 'SET_CURRENT_VIDEO_INDEX', payload: videoIndex });
        }

        dispatch({ type: 'SET_SELECTED_VIDEO', payload: { id: videoId, type: videoType, title: videoTitle, description: videoDescription, channel: channelTitle, date: publishedAt } });
        dispatch({ type: 'SET_MODAL_VISIBLE', payload: true });

        // ROBUST AUTOPLAY STRATEGY: Always start muted for mobile browsers
        if (isMobile) {
            // Always start muted to guarantee autoplay across all mobile browsers
            dispatch({ type: 'SET_MUTED', payload: true });
            console.log('🎯 Mobile: Starting muted for guaranteed autoplay - will unmute on user gesture');
        }

        console.log(`🎬 Modal state updated:`, {
            videoId,
            modalVisible: true,
            isMobileMode: isMobile,
            selectedVideoId: videoId
        });

        fetchTranscript(videoId);
        getVideoAnalysis(videoTitle, videoDescription);
        // getSmartRecommendations removed - recommendations panel no longer needed

        // Save to watch history (Firebase or localStorage)
        const videoData = {
            videoId,
            title: videoTitle,
            channelTitle: channelTitle,
            thumbnail: videoItems.find(v => v.id.videoId === videoId)?.snippet?.thumbnails?.high?.url || '',
        };

        if (authEnabled && user) {
            addToWatchHistory(videoData).catch(() => {
                // Fallback to localStorage
                saveLocalWatchHistory(videoData);
            });
        } else {
            // Use localStorage fallback
            saveLocalWatchHistory(videoData);
        }
    };

    const closeModal = () => {
        dispatch({ type: 'SET_SELECTED_VIDEO', payload: { id: null, type: null, title: '', description: '', channel: '', date: '' } });
        dispatch({ type: 'SET_MODAL_VISIBLE', payload: false });
        dispatch({ type: 'SET_TRANSCRIPT', payload: "" });
        dispatch({ type: 'SET_MODAL_AI_CONTENT', payload: "" });
    };

    // Toggle favorite video (Firebase or localStorage)
    const toggleFavorite = async (videoId: string, videoTitle: string, channelTitle: string, thumbnail: string) => {
        const isFav = favoriteVideoIds.has(videoId);

        if (authEnabled && user) {
            // Use Firebase
            try {
                if (isFav) {
                    await removeFromFavorites(videoId);
                    removeLocalFavorite(videoId); // Also update localStorage as backup
                } else {
                    await addToFavorites({
                        videoId,
                        title: videoTitle,
                        channelTitle,
                        thumbnail,
                    });
                    saveLocalFavorite({ videoId, title: videoTitle, channelTitle, thumbnail }); // Backup
                }
            } catch (error) {
                // Fallback to localStorage on error
                if (isFav) {
                    removeLocalFavorite(videoId);
                } else {
                    saveLocalFavorite({ videoId, title: videoTitle, channelTitle, thumbnail });
                }
            }
        } else {
            // Use localStorage fallback
            if (isFav) {
                removeLocalFavorite(videoId);
            } else {
                saveLocalFavorite({ videoId, title: videoTitle, channelTitle, thumbnail });
            }
        }

        // Update local state immediately for instant UI feedback
        const newIds = new Set(favoriteVideoIds);
        if (isFav) {
            newIds.delete(videoId);
        } else {
            newIds.add(videoId);
        }
        setFavoriteVideoIds(newIds);
    };

    // Optimized function to handle modal click for play/pause toggle
    const handleModalClick = (e?: React.MouseEvent) => {
        // Don't handle clicks on buttons
        if (e && e.target instanceof HTMLElement && e.target.closest('button')) {
            return;
        }

        console.log('handleModalClick called', {
            player: !!player,
            selectedVideoId,
            youtubeAPILoaded,
            playerState: player ? player.getPlayerState() : 'no player'
        });

        if (player && selectedVideoId) {
            try {
                const currentState = player.getPlayerState();
                console.log(`Current player state: ${currentState}`, "info");
                console.log(`YT.PlayerState.PLAYING: ${window.YT?.PlayerState?.PLAYING}`);
                console.log(`YT.PlayerState.PAUSED: ${window.YT?.PlayerState?.PAUSED}`);

                if (currentState === window.YT.PlayerState.PLAYING) {
                    console.log("Attempting to pause video");
                    player.pauseVideo();
                    console.log("Video pause command sent", "success");
                } else if (currentState === window.YT.PlayerState.PAUSED ||
                    currentState === window.YT.PlayerState.UNSTARTED) {
                    console.log("Attempting to play video");
                    player.playVideo();
                    console.log("Video play command sent", "success");
                } else {
                    console.log(`Unknown player state: ${currentState}`);
                }
            } catch (error) {
                console.log(`Error toggling video play/pause: ${error}`, "error");
            }
        } else {
            console.log('Player or video ID not available for tap-to-pause', {
                hasPlayer: !!player,
                hasVideoId: !!selectedVideoId,
                youtubeAPILoaded
            });
        }
    };

    // Optimized function to fetch trending videos with caching
    const fetchTrendingVideos = async () => {
        // Get user's country code for region-specific caching
        const countryCode = await getUserCountryCode();
        const regionCode = countryCode || 'US';
        const cacheKey = `trending:videos:${regionCode}`;
        const cached = apiCache.get(cacheKey);

        // Show cached results immediately if available
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            logDebug("Loading cached trending videos", "info");
            dispatch({ type: 'SET_VIDEO_ITEMS', payload: cached.data });
            dispatch({ type: 'SET_CONTENT_READY', payload: true });
            return;
        }

        logDebug("Fetching fresh trending videos...");
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_CONTENT_READY', payload: false });

        try {
            const headers: any = {};
            if (authToken) {
                headers.Authorization = `Bearer ${authToken}`;
                logDebug("Using authentication token for request", "info");
            }

            const response = await cachedApiRequest(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=${regionCode}&maxResults=20&videoCategoryId=24&key=${YOUTUBE_API_KEY}`,
                "GET",
                null,
                headers
            );

            logDebug("Trending videos fetched successfully", "success");

            if (response.result?.items && response.result.items.length > 0) {
                const transformedItems = response.result.items.map((item: { id: string; snippet: any }) => ({
                    id: { videoId: item.id },
                    snippet: item.snippet
                }));

                // Cache the results
                apiCache.set(cacheKey, { data: transformedItems, timestamp: Date.now(), ttl: LONG_CACHE_DURATION });

                dispatch({ type: 'SET_VIDEO_ITEMS', payload: transformedItems });
                logDebug(`Found ${transformedItems.length} trending videos`);

                // Show content immediately, load additional data in background
                dispatch({ type: 'SET_CONTENT_READY', payload: true });
                dispatch({ type: 'SET_LOADING', payload: false });

                // Background content loading - immediate for faster experience
                getYouTubeContent("Trending reels").catch(err =>
                    logDebug(`Background trending content failed: ${err}`, "warning")
                );
            } else {
                logDebug("No trending videos found", "warning");
                dispatch({ type: 'SET_VIDEO_ITEMS', payload: [] });
                dispatch({ type: 'SET_CONTENT_READY', payload: true });
            }
        } catch (err: any) {
            logDebug(`Error fetching trending videos: ${err.message}`, "error");
            dispatch({ type: 'SET_VIDEO_ITEMS', payload: [] });
            dispatch({ type: 'SET_OPENAI_CONTENT', payload: "Unable to load trending videos. Please try again later." });
            dispatch({ type: 'SET_CONTENT_READY', payload: true });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Function to handle video navigation - optimized for swipe
    const navigateVideo = (direction: 'up' | 'down') => {
        let newIndex = currentVideoIndex;

        if (direction === 'up' && currentVideoIndex > 0) {
            newIndex = currentVideoIndex - 1;
        } else if (direction === 'down' && currentVideoIndex < videoItems.length - 1) {
            newIndex = currentVideoIndex + 1;
        } else {
            return; // No navigation possible
        }

        const targetVideo = videoItems[newIndex];
        if (!targetVideo) return;

        // Update the current video index
        dispatch({ type: 'SET_CURRENT_VIDEO_INDEX', payload: newIndex });

        // Update the selected video without reopening modal
        dispatch({
            type: 'SET_SELECTED_VIDEO',
            payload: {
                id: targetVideo.id.videoId,
                type: 'youtube',
                title: targetVideo.snippet.title,
                description: targetVideo.snippet.description,
                channel: targetVideo.snippet.channelTitle,
                date: targetVideo.snippet.publishedAt
            }
        });

        // Get analysis for the new video
        getVideoAnalysis(targetVideo.snippet.title, targetVideo.snippet.description);
        // getSmartRecommendations removed - recommendations panel no longer needed
    };

    // Function to handle main content video navigation - for full-screen swipe
    const navigateMainContentVideo = (direction: 'up' | 'down') => {
        let newIndex = currentVideoIndex;

        if (direction === 'up' && currentVideoIndex > 0) {
            newIndex = currentVideoIndex - 1;
        } else if (direction === 'down' && currentVideoIndex < videoItems.length - 1) {
            newIndex = currentVideoIndex + 1;
        } else {
            return; // No navigation possible
        }

        const targetVideo = videoItems[newIndex];
        if (!targetVideo) return;

        // Update the current video index
        dispatch({ type: 'SET_CURRENT_VIDEO_INDEX', payload: newIndex });

        // For main content navigation, we can scroll to the video or highlight it
        // For now, just update the index - the UI will reflect the change
        console.log(`Navigated to video ${newIndex + 1} of ${videoItems.length}: ${targetVideo.snippet.title}`);
    };

    // Playback speed control function
    const changePlaybackSpeed = useCallback((speed: number) => {
        if (player) {
            try {
                player.setPlaybackRate(speed);
                dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
                logDebug(`Playback speed changed to ${speed}x`, "info");
            } catch (error) {
                logDebug(`Error changing playback speed: ${error}`, "error");
            }
        }
    }, [player]);

    // Share functionality
    const shareVideo = useCallback(async () => {
        const videoUrl = `https://www.youtube.com/watch?v=${selectedVideoId}`;
        const shareData = {
            title: selectedVideoTitle,
            text: `Check out this video: ${selectedVideoTitle}`,
            url: videoUrl
        };

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(videoUrl);
                alert('Video URL copied to clipboard!');
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                try {
                    await navigator.clipboard.writeText(videoUrl);
                    alert('Video URL copied to clipboard!');
                } catch (clipboardError) {
                    prompt('Copy this URL:', videoUrl);
                }
            }
        }
    }, [selectedVideoId, selectedVideoTitle]);

    // Picture-in-picture support
    const togglePictureInPicture = useCallback(async () => {
        if (!player) return;

        try {
            const iframe = document.querySelector('#player iframe') as HTMLIFrameElement;
            if (!iframe) return;

            if (pictureInPictureEnabled) {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                }
                dispatch({ type: 'SET_PICTURE_IN_PICTURE_ENABLED', payload: false });
            } else {
                if (document.pictureInPictureEnabled) {
                    const requestPiP = (iframe as unknown as { requestPictureInPicture?: () => Promise<void> })
                        .requestPictureInPicture;
                    if (requestPiP) {
                        await requestPiP.call(iframe);
                        dispatch({ type: 'SET_PICTURE_IN_PICTURE_ENABLED', payload: true });
                    } else {
                        alert('Picture-in-picture is not supported in your browser');
                    }
                } else {
                    alert('Picture-in-picture is not supported in your browser');
                }
            }
        } catch (error) {
            logDebug(`Error toggling picture-in-picture: ${error}`, "error");
        }
    }, [player, pictureInPictureEnabled]);

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (!modalVisible || !selectedVideoId) return;

            switch (e.key) {
                case ' ': // Spacebar - play/pause
                    e.preventDefault();
                    if (player) {
                        const state = player.getPlayerState();
                        if (state === window.YT.PlayerState.PLAYING) {
                            player.pauseVideo();
                        } else {
                            player.playVideo();
                        }
                    }
                    break;
                case 'ArrowUp': // Up arrow - previous video
                    e.preventDefault();
                    if (currentVideoIndex > 0) {
                        navigateVideo('up');
                    }
                    break;
                case 'ArrowDown': // Down arrow - next video
                    e.preventDefault();
                    if (currentVideoIndex < videoItems.length - 1) {
                        navigateVideo('down');
                    }
                    break;
                case 'ArrowLeft': // Left arrow - rewind 10 seconds
                    e.preventDefault();
                    if (player) {
                        const currentTime = player.getCurrentTime();
                        player.seekTo(Math.max(0, currentTime - 10), true);
                    }
                    break;
                case 'ArrowRight': // Right arrow - forward 10 seconds
                    e.preventDefault();
                    if (player) {
                        const currentTime = player.getCurrentTime();
                        player.seekTo(currentTime + 10, true);
                    }
                    break;
                case 'm': // M key - mute/unmute
                case 'M':
                    e.preventDefault();
                    if (player) {
                        if (isMuted) {
                            player.unMute();
                            dispatch({ type: 'SET_MUTED', payload: false });
                        } else {
                            player.mute();
                            dispatch({ type: 'SET_MUTED', payload: true });
                        }
                    }
                    break;
                case 'f': // F key - fullscreen
                case 'F':
                    e.preventDefault();
                    if (player) {
                        const iframe = document.querySelector('#player iframe') as HTMLIFrameElement;
                        if (iframe && iframe.requestFullscreen) {
                            iframe.requestFullscreen();
                        }
                    }
                    break;
                case 'Escape': // Escape - close modal
                    e.preventDefault();
                    closeModal();
                    break;
                case '>': // > key - increase speed
                case '.':
                    e.preventDefault();
                    changePlaybackSpeed(Math.min(2.0, playbackSpeed + 0.25));
                    break;
                case '<': // < key - decrease speed
                case ',':
                    e.preventDefault();
                    changePlaybackSpeed(Math.max(0.25, playbackSpeed - 0.25));
                    break;
                case 's': // S key - toggle speed controls
                case 'S':
                    e.preventDefault();
                    dispatch({ type: 'SET_SHOW_SPEED_CONTROLS', payload: !showSpeedControls });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [modalVisible, selectedVideoId, player, currentVideoIndex, videoItems.length, isMuted, playbackSpeed, showSpeedControls, navigateVideo, closeModal, changePlaybackSpeed]);

    // Touch handlers for main content video navigation
    const handleMainContentTouchStart = useCallback((e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
            return;
        }

        const touch = e.touches[0];
        console.log('🎯 Main content touch start detected:', {
            x: touch.clientX,
            y: touch.clientY,
            target: e.target,
            timestamp: Date.now()
        });

        dispatch({ type: 'SET_MODAL_TOUCH_START_Y', payload: touch.clientY });
        dispatch({ type: 'SET_MODAL_TOUCH_START_X', payload: touch.clientX });
        dispatch({ type: 'SET_MODAL_IS_SWIPING', payload: true });
    }, []);

    const handleMainContentTouchMove = useCallback((e: React.TouchEvent) => {
        // Always prevent default when swiping for reliable detection
        if (modalIsSwiping) {
            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches[0];
            console.log('🔄 Main content touch move detected:', {
                x: touch.clientX,
                y: touch.clientY,
                deltaY: modalTouchStartY - touch.clientY
            });
        }
    }, [modalIsSwiping, modalTouchStartY]);

    const handleMainContentTouchEnd = useCallback((e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) {
            return;
        }

        if (!modalTouchStartY || !modalTouchStartX) {
            console.log('❌ No touch start data available');
            return;
        }

        const touch = e.changedTouches[0];
        const touchEndY = touch.clientY;
        const touchEndX = touch.clientX;
        const diffY = modalTouchStartY - touchEndY;
        const diffX = Math.abs(modalTouchStartX - touchEndX);

        console.log('🏁 Main content touch end detected:', {
            startY: modalTouchStartY,
            endY: touchEndY,
            diffY: diffY,
            startX: modalTouchStartX,
            endX: touchEndX,
            diffX: diffX,
            absDiffY: Math.abs(diffY),
            threshold: 30
        });

        // Only handle vertical swipes (ignore horizontal swipes)
        if (Math.abs(diffY) > 30 && diffX < 100) {
            console.log('✅ Swipe detected, navigating video in main content');

            if (diffY > 0) {
                // Swipe up - next video
                console.log('⬆️ Swipe up - going to next video');
                navigateMainContentVideo('down');
            } else {
                // Swipe down - previous video
                console.log('⬇️ Swipe down - going to previous video');
                navigateMainContentVideo('up');
            }
        } else {
            console.log('❌ Swipe not detected:', {
                reason: Math.abs(diffY) <= 30 ? 'insufficient vertical movement' : 'too much horizontal movement',
                verticalMovement: Math.abs(diffY),
                horizontalMovement: diffX
            });
        }

        dispatch({ type: 'SET_MODAL_IS_SWIPING', payload: false });
        dispatch({ type: 'SET_MODAL_TOUCH_START_Y', payload: 0 });
        dispatch({ type: 'SET_MODAL_TOUCH_START_X', payload: 0 });
    }, [modalTouchStartY, modalTouchStartX, navigateMainContentVideo]);

    // Legacy touch handlers removed - using new TikTok-style handlers below

    // Modify the modal rendering with better fallback handling
    const renderModalContent = () => {
        if (!selectedVideoId || !selectedVideoType) return null;

        logDebug("Rendering modal content for video: " + selectedVideoId, "info");
        logDebug("YouTube API loaded: " + youtubeAPILoaded + ", loading: " + youtubeAPILoading, "info");
        logDebug("Mobile mode: " + isMobileMode, "info");

        const iframeUrl = "https://www.youtube.com/embed/" + selectedVideoId + "?controls=1&playsinline=1&rel=0&autoplay=1&mute=1&enablejsapi=1&modestbranding=1&origin=" + window.location.origin;

        return (
            <div
                style= {{
            width: isMobileMode ? "100vw" : "100%",
                height: isMobileMode ? "100vh" : "100%",
                    aspectRatio: isMobileMode ? "unset" : "16/9",
                        minWidth: isMobileMode ? "100vw" : "480px",
                            minHeight: isMobileMode ? "50vh" : "270px",
                                maxWidth: "100%",
                                    maxHeight: "100%",
                                        backgroundColor: "#000",
                                            display: "flex",
                                                alignItems: "center",
                                                    justifyContent: "center",
                                                        position: "relative",
                                                            pointerEvents: "auto",
                                                                zIndex: 1,
                                                                    boxSizing: "border-box",
                                                                        overflow: "hidden",
                                                                            margin: 0,
                                                                                padding: 0,
                }
    }
            >
        <button
            onClick={ closeModal }
    style = {{
        position: "absolute",
            top: isMobileMode ? "12px" : "16px",
                left: isMobileMode ? "12px" : "16px",
                    zIndex: 6,
                        background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(255,255,255,0.3)",
                                color: "#fff",
                                    padding: "8px 12px",
                                        borderRadius: "10px",
                                            cursor: "pointer",
                                                fontSize: "12px",
                                                    fontWeight: 600,
                                                        letterSpacing: "0.3px",
                                                            backdropFilter: "blur(6px)",
            }
}
        >
    Return to menu
        </button>
{
    isMobileMode ? (
        <div
                        id = "player"
                        style = {{
        position: "absolute",
            top: 0,
                left: 0,
                    right: 0,
                        bottom: 0,
                            width: "100%",
                                height: "100%",
                                    backgroundColor: "#000",
                                        minHeight: "300px",
                                            minWidth: "100%",
                                                display: "flex",
                                                    alignItems: "center",
                                                        justifyContent: "center",
                                                            pointerEvents: "auto",
                                                                borderRadius: "8px",
                                                                    overflow: "hidden",
                                                                        margin: "auto",
            }
}
onTouchStart = { handleModalTouchStart }
onTouchMove = { handleModalTouchMove }
onTouchEnd = { handleModalTouchEnd }
    >
    <iframe
                            key={ "mobile-player-" + selectedVideoId }
id = { "mobile-player-iframe-" + selectedVideoId }
src = { iframeUrl }
referrerPolicy = "origin"
style = {{
    width: "100%",
        height: "100%",
            border: "none",
                backgroundColor: "#000",
                    display: "block",
                        minHeight: "300px",
                            minWidth: "100%",
                                pointerEvents: "auto",
                                    zIndex: 1,
                                        flex: "1 1 auto",
                                            borderRadius: "8px",
                                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                                                    margin: "auto",
                                                        position: "relative",
                            }
}
allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
allowFullScreen
title = "YouTube video player"
onLoad = {() => {
    if (!isMuted) {
        dispatch({ type: "SET_MUTED", payload: true });
    }
}}
                        />
    </div>
                ) : (
    <>
    <div
                            id= "player"
style = {{ width: "100%", height: "100%" }}
onTouchStart = { handleModalTouchStart }
onTouchEnd = { handleModalTouchEnd }
    />
    { youtubeAPILoading && !window.apiLoadingStatus?.fallbackMode && (
        <div
                                style={
    {
        color: "white",
            fontSize: "16px",
                textAlign: "center",
                    position: "absolute",
                        top: "50%",
                            left: "50%",
                                transform: "translate(-50%, -50%)",
                                    maxWidth: "80%",
                                        padding: "20px",
                                }
}
onTouchStart = { handleModalTouchStart }
onTouchEnd = { handleModalTouchEnd }
    >
    <div style={ { fontSize: "16px", marginBottom: "10px" } }>
        Loading YouTube Player...
</div>
    < div
style = {{
    width: "30px",
        height: "30px",
            border: "3px solid #fff",
                borderTop: "3px solid transparent",
                    borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                            margin: "0 auto",
                                    }}
                                />
    < div style = {{ fontSize: "12px", marginTop: "10px", opacity: 0.7 }}>
        This may take a moment...
</div>
    </div>
                        )}
{
    !youtubeAPILoaded && !youtubeAPILoading && (
        <div
                                style={
        {
            width: "100%",
                height: "100%",
                    backgroundColor: "#000",
                        display: "flex",
                            alignItems: "center",
                                justifyContent: "center",
                                }
    }
                            >
        <iframe
                                    key={ "fallback-player-" + selectedVideoId }
    src = {
        "https://www.youtube.com/embed/" +
            selectedVideoId +
            "?autoplay=1&mute=1&playsinline=1&origin=" +
            window.location.origin
    }
    style = {{ width: "100%", height: "100%", border: "none" }
}
allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
allowFullScreen
title = "YouTube video player"
    />
    </div>
    )}
</>
                )
    }
{
    player && selectedVideoId && (
        <div
                                style={
        {
            position: "absolute",
                top: "20px",
                    right: "20px",
                        display: "flex",
                            flexDirection: "column",
                                gap: "10px",
                                    zIndex: 10000,
                                }
    }
                            >
        <button
                                    onClick={
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedVideoTitle && selectedVideoChannel) {
                toggleFavorite(
                    selectedVideoId,
                    selectedVideoTitle,
                    selectedVideoChannel,
                    videoItems.find(v => v.id.videoId === selectedVideoId)?.snippet?.thumbnails?.high?.url || ""
                );
            }
        }
    }
    style = {{
        width: "48px",
            height: "48px",
                borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                            display: "flex",
                                alignItems: "center",
                                    justifyContent: "center",
                                        cursor: "pointer",
                                            transition: "all 0.2s ease",
                                                backdropFilter: "blur(10px)",
                                                    WebkitBackdropFilter: "blur(10px)",
                                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                                            pointerEvents: "auto",
                                                                fontSize: "24px",
                                    }
}
onMouseEnter = {(e) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 1)";
    e.currentTarget.style.transform = "scale(1.1)";
    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
}}
onMouseLeave = {(e) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
}}
title = { favoriteVideoIds.has(selectedVideoId || "") ? "Remove from favorites" : "Add to favorites" }
    >
    { favoriteVideoIds.has(selectedVideoId || "") ? "❤️" : "🤍" }
    </button>
    < button
onClick = {(e) => {
    e.preventDefault();
    e.stopPropagation();
    shareVideo();
}}
style = {{
    width: "48px",
        height: "48px",
            borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                        display: "flex",
                            alignItems: "center",
                                justifyContent: "center",
                                    cursor: "pointer",
                                        transition: "all 0.2s ease",
                                            backdropFilter: "blur(10px)",
                                                WebkitBackdropFilter: "blur(10px)",
                                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                                        pointerEvents: "auto",
                                                            fontSize: "20px",
                                    }}
onMouseEnter = {(e) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 1)";
    e.currentTarget.style.transform = "scale(1.1)";
    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
}}
onMouseLeave = {(e) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
}}
title = "Share video"
    >
                                    📤
</button>
    < button
onClick = {(e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_SHOW_SPEED_CONTROLS", payload: !showSpeedControls });
}}
style = {{
    width: "48px",
        height: "48px",
            borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                        display: "flex",
                            alignItems: "center",
                                justifyContent: "center",
                                    cursor: "pointer",
                                        transition: "all 0.2s ease",
                                            backdropFilter: "blur(10px)",
                                                WebkitBackdropFilter: "blur(10px)",
                                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                                        pointerEvents: "auto",
                                                            fontSize: "14px",
                                                                fontWeight: "600",
                                                                    color: "#333",
                                    }}
onMouseEnter = {(e) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 1)";
    e.currentTarget.style.transform = "scale(1.1)";
    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.4)";
}}
onMouseLeave = {(e) => {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
}}
title = { "Playback speed: " + playbackSpeed + "x (Press S to toggle, <o decrease, > to increase)" }
    >
    { playbackSpeed }x
        </button>
{
    showSpeedControls && (
        <div
                                        style={
        {
            position: "absolute",
                top: "160px",
                    right: "0",
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                            borderRadius: "8px",
                                padding: "10px",
                                    display: "flex",
                                        flexDirection: "column",
                                            gap: "5px",
                                                minWidth: "120px",
                                                    backdropFilter: "blur(10px)",
                                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
                                                            zIndex: 10001,
                                        }
    }
    onClick = {(e) => e.stopPropagation()
}
                                    >
{
    [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((speed) => (
        <button
                                                key= { speed }
                                                onClick = {(e) => {
        e.preventDefault();
        e.stopPropagation();
        changePlaybackSpeed(speed);
                                                    dispatch({ type: "SET_SHOW_SPEED_CONTROLS", payload: false });
    }}
style = {{
    padding: "8px 12px",
        backgroundColor: playbackSpeed === speed ? "rgba(119, 76, 175, 0.8)" : "transparent",
            border: "none",
                borderRadius: "4px",
                    color: "white",
                        cursor: "pointer",
                            fontSize: "14px",
                                textAlign: "left",
                                    transition: "all 0.2s ease",
                                                }}
onMouseEnter = {(e) => {
    if (playbackSpeed !== speed) {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    }
}}
onMouseLeave = {(e) => {
    if (playbackSpeed !== speed) {
        e.currentTarget.style.backgroundColor = "transparent";
    }
}}
                                            >
    { speed }x { playbackSpeed === speed ? "✓" : "" }
</button>
                                        ))}
</div>
                                )}
</div>
                        )}
</div>
        );
    };
// getSmartRecommendations function removed to comply with YouTube API policy
// No overlays, frames, or visual elements in front of YouTube embedded player

// Batch request optimization for video details
const batchGetVideoDetails = async (videoIds: string[]) => {
    if (videoIds.length === 0) return [];
    try {
        const ids = videoIds.join(',');
        const response = await cachedApiRequest(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`,
            "GET",
            null
        );
        return response.items || [];
    } catch (error) {
        logDebug(`Batch video details failed: ${error}`, "error");
        return [];
    }
};

// Add function to fetch trending topics from OpenAI
const fetchTrendingTopics = async () => {
    try {
        logDebug("Fetching current trends in reels from OpenAI");
        const prompt = `Provide 10 current trending reels or memes in reels/short-form video content. 
                Focus on viral trends, popular challenges, trending hashtags, and current events that are popular in short-form video.
                Format the response as a JSON array of strings, each being a specific trending topic.
                Make them specific and searchable terms that would work well for YouTube searches.`;

        const response = await fetchOpenAIContent(prompt);
        const content = response.choices[0].message.content;

        const topics = extractJSONFromResponse(content);
        if (!topics) {
            throw new Error('Failed to parse topics from OpenAI response');
        }

        dispatch({ type: 'SET_TRENDING_TOPICS', payload: topics });
        dispatch({ type: 'SET_SHOW_TRENDING_TOPICS', payload: true });
        logDebug(`Fetched ${topics.length} trending topics`);
    } catch (error) {
        logDebug(`Failed to fetch trending topics: ${error}`, "error");
        // Fallback to some default trending topics
        const fallbackTopics = [
            "viral dance challenges 2024",
            "trending food recipes",
            "comedy skits trending",
            "life hacks viral",
            "beauty trends 2024",
            "fitness challenges trending",
            "pet videos viral",
            "travel vlogs trending",
            "tech reviews viral",
            "music covers trending"
        ];
        dispatch({ type: 'SET_TRENDING_TOPICS', payload: fallbackTopics });
        dispatch({ type: 'SET_SHOW_TRENDING_TOPICS', payload: true });
    }
};

// Add function to handle trending topic click
const handleTrendingTopicClick = (topic: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: topic });
    dispatch({ type: 'SET_SHOW_TRENDING_TOPICS', payload: false });
    executeSearch().catch(err => {
        console.error("Error executing search:", err);
    });
};

// YouTube API Data Refresh and Storage Policy - III.E.4.a-g compliance
const YOUTUBE_DATA_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const YOUTUBE_DATA_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

const refreshYouTubeData = () => {
    const now = Date.now();
    // Only refresh if page is visible and user is actively using the app
    // Prevent clearing videos when browser is idle/inactive
    if (document.visibilityState === 'visible' && now - dataFetchTime > YOUTUBE_DATA_REFRESH_INTERVAL) {
        // Only clear and refresh if there's a search query to re-execute
        // This prevents videos from disappearing when browser is left idle
        if (searchQuery && searchQuery.trim().length > 0) {
            logDebug("YouTube data refresh interval reached, refreshing data", "info");
            // Re-execute search to get fresh data without clearing first
            executeSearch().catch(err => {
                console.error("Error refreshing data:", err);
            });
            dispatch({ type: 'SET_DATA_FETCH_TIME', payload: now });
        }
        // If no search query, don't clear videos - keep them visible
    }
};

const clearExpiredYouTubeData = () => {
    const now = Date.now();
    // Only clear expired data if page is visible and user is actively using the app
    // Prevent clearing videos when browser is idle/inactive
    if (document.visibilityState === 'visible' && now - dataFetchTime > YOUTUBE_DATA_MAX_AGE) {
        // Only clear if there's a search query to re-execute
        // This prevents videos from disappearing when browser is left idle
        if (searchQuery && searchQuery.trim().length > 0) {
            logDebug("YouTube data expired (24h), refreshing data", "info");
            // Re-execute search to get fresh data instead of clearing
            executeSearch();
            dispatch({ type: 'SET_DATA_FETCH_TIME', payload: now });
        }
        // If no search query, don't clear videos - keep them visible
    }
};

// Session persistence functions
const saveAuthSession = (tokenData: any) => {
    try {
        const sessionData = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: tokenData.expires_at || (Date.now() + 3600000), // 1 hour default
            timestamp: Date.now()
        };
        localStorage.setItem('youtubeAuthSession', JSON.stringify(sessionData));
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        dispatch({ type: 'SET_SESSION_PERSISTED', payload: true });
        logDebug("Authentication session saved to localStorage", "success");
    } catch (error) {
        logDebug(`Failed to save auth session: ${error}`, "error");
    }
};

const loadAuthSession = () => {
    try {
        const sessionData = localStorage.getItem('youtubeAuthSession');
        if (sessionData) {
            const parsed = JSON.parse(sessionData);
            const now = Date.now();

            // Check if session is still valid (not expired)
            if (parsed.expires_at && parsed.expires_at > now) {
                dispatch({ type: 'SET_AUTH_TOKEN', payload: parsed.access_token });
                dispatch({ type: 'SET_AUTHENTICATED', payload: true });
                dispatch({ type: 'SET_SESSION_PERSISTED', payload: true });
                logDebug("Authentication session restored from localStorage", "success");
                return true;
            } else {
                // Session expired, clear it
                clearAuthSession();
                logDebug("Authentication session expired, cleared", "warning");
                return false;
            }
        }
        return false;
    } catch (error) {
        logDebug(`Failed to load auth session: ${error}`, "error");
        clearAuthSession();
        return false;
    }
};

const clearAuthSession = () => {
    try {
        localStorage.removeItem('youtubeAuthSession');
        dispatch({ type: 'SET_AUTH_TOKEN', payload: null });
        dispatch({ type: 'SET_AUTHENTICATED', payload: false });
        dispatch({ type: 'SET_SESSION_PERSISTED', payload: false });
        logDebug("Authentication session cleared", "info");
    } catch (error) {
        logDebug(`Failed to clear auth session: ${error}`, "error");
    }
};

const refreshAuthToken = async (refreshToken: string) => {
    try {
        logDebug("Attempting to refresh authentication token", "info");
        // This would typically call the OAuth refresh endpoint
        // For now, we'll just clear the session and require re-auth
        clearAuthSession();
        logDebug("Token refresh not implemented, session cleared", "warning");
    } catch (error) {
        logDebug(`Failed to refresh token: ${error}`, "error");
        clearAuthSession();
    }
};

// Function to handle successful authentication
const handleAuthSuccess = (tokenData: any) => {
    dispatch({ type: 'SET_AUTH_TOKEN', payload: tokenData.access_token });
    dispatch({ type: 'SET_AUTHENTICATED', payload: true });
    saveAuthSession(tokenData);
    logDebug("Authentication successful, session saved", "success");
};

// Function to handle authentication failure
const handleAuthFailure = (error: any) => {
    logDebug(`Authentication failed: ${error}`, "error");
    dispatch({ type: 'SET_AUTHENTICATED', payload: false });
    clearAuthSession();
};

// Logout function removed - no authentication required

// Function to show app information (logout functionality removed)
const showPreferences = () => {
    alert(
        `Algorythms - YouTube Content Discovery\n\n` +
        `This app uses YouTube Data API v3 to access public video data.\n` +
        `No user authentication is required.\n\n` +
        `Features:\n` +
        `• Search YouTube videos\n` +
        `• Browse trending content\n` +
        `• View video details\n` +
        `• No login required\n\n` +
        `All data is public and no personal information is accessed.`
    );
};

// Add new function to generate video summaries - Controlled by feature flag
const generateVideoSummary = async (videoId: string, title: string, description: string) => {
    if (!ENABLE_OPENAI_FEATURES) {
        logDebug(`OpenAI video summary disabled (ENABLE_OPENAI_FEATURES=false)`, "info");
        return;
    }

    try {
        logDebug(`Generating summary for: ${title}`);
        const prompt = `Create a concise 2-3 sentence summary of this YouTube video: "${title}". 
                Description: "${description}". Focus on the main points and value proposition.`;

        const response = await fetchOpenAIContent(prompt);
        const summary = response.choices[0].message.content;

        dispatch({ type: 'SET_VIDEO_SUMMARIES', payload: { ...videoSummaries, [videoId]: summary } });

        logDebug(`Generated summary for ${title}`);
    } catch (error) {
        logDebug(`Failed to generate summary: ${error}`, "error");
    }
};

// Add new function to cluster videos by topic - Controlled by feature flag
const clusterVideosByTopic = async (videos: any[]) => {
    if (!ENABLE_OPENAI_FEATURES) {
        logDebug('OpenAI video clustering disabled (ENABLE_OPENAI_FEATURES=false)', "info");
        dispatch({ type: 'SET_TOPIC_CLUSTERS', payload: {} });
        return;
    }

    try {
        logDebug('Clustering videos by topic');
        const videoData = videos.map(video => ({
            id: video.id.videoId,
            title: video.snippet.title,
            description: video.snippet.description
        }));

        const prompt = `Analyze these YouTube videos and group them into 3-4 main topics or themes based on the search query "${searchQuery}". 
                For each video, provide a single topic that best describes its content.
                Format the response as a JSON object where keys are topics and values are arrays of video IDs.
                Limit each topic to a maximum of 8 videos.
                Videos: ${JSON.stringify(videoData)}`;

        const response = await fetchOpenAIContent(prompt);
        const content = response.choices[0].message.content;

        const clusters = extractJSONFromResponse(content);
        if (!clusters) {
            throw new Error('Failed to parse clusters from OpenAI response');
        }

        // Map video IDs back to full video objects and limit to 8 per topic
        const topicClusters = Object.entries(clusters).reduce((acc: any, [topic, videoIds]: [string, any]) => {
            acc[topic] = videoIds
                .slice(0, 8) // Limit to 8 videos per topic
                .map((id: string) =>
                    videos.find((v: any) => v.id.videoId === id)
                )
                .filter(Boolean);
            return acc;
        }, {});

        dispatch({ type: 'SET_TOPIC_CLUSTERS', payload: topicClusters });
        logDebug(`Created ${Object.keys(topicClusters).length} topic clusters`);
    } catch (error) {
        logDebug(`Failed to cluster videos: ${error}`, "error");
    }
};

// Add new section to render topic clusters and recommendations
const renderTopicClusters = () => {
    return Object.entries(topicClusters).map(([topic, videos]) => (
        <div
            key= { topic }
            style = {{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}
        >
    <h3 style={
    {
        margin: '0 0 10px 0',
            color: '#495057',
                fontSize: '18px',
                    fontWeight: '600',}
}>
    { topic }
    </h3>
    < div style = {{
    display: 'flex',
        gap: '10px',
            overflowX: 'auto',
                padding: '5px',
            }}>
{
    videos.map((video) => (
        <div
                        key= { video.id.videoId }
                        onClick = {() => openModal(
            video.id.videoId,
            'youtube',
            video.snippet.title,
            video.snippet.description,
            video.snippet.channelTitle,
            video.snippet.publishedAt
        )}
style = {{
    cursor: 'pointer',
        backgroundColor: 'white',
            borderRadius: '8px',
                overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s ease-in-out',
                        }}
                    >
    <img
                            src={ `https://img.youtube.com/vi/${video.id.videoId}/mqdefault.jpg` }
alt = { video.snippet.title }
style = {{
    width: '100%',
        aspectRatio: '16/9',
            objectFit: 'cover',
                borderRadius: '4px',
                            }}
                        />
    < h4 style = {{
    margin: '8px 0',
        fontSize: '14px',
            lineHeight: '1.3',
                        }}>
    { video.snippet.title }
    </h4>
{
    videoSummaries[video.id.videoId] && (
        <p style={
        {
            fontSize: '12px',
                color: '#666',
                    margin: 0,}
    }>
        { videoSummaries[video.id.videoId]}
        </p>
                        )
}
</div>
                ))}
</div>
    </div>
    ));
};

// Recommendations function removed to comply with YouTube API policy
// No overlays, frames, or visual elements in front of YouTube embedded player

// Add new function to handle search submission
const handleSearchSubmit = useCallback(() => {
    // Execute search if query is provided and not loading
    if (searchQuery.trim() && !isLoading) {
        executeSearch();
    }
}, [searchQuery, isLoading]);

// Helper function to enhance search queries with reels/shorts focus
const enhanceQueryForReelsShorts = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // If the query already contains reels/shorts keywords, return as is
    if (lowerQuery.includes('reels') || lowerQuery.includes('shorts') ||
        lowerQuery.includes('short') || lowerQuery.includes('reel')) {
        return query;
    }

    // Add reels and shorts keywords to focus on short-form content
    return `${query} reels shorts`;
};

const searchVideos = async (query: string) => {
    console.log(`🔍 Starting search for: ${query}`);

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CONTENT_READY', payload: false });
    dispatch({ type: 'RESET_PAGINATION_CLICK' });

    try {
        if (!YOUTUBE_API_KEY) {
            throw new Error("YouTube API key is not configured");
        }

        // Enhance query to focus on reels and shorts
        const enhancedQuery = enhanceQueryForReelsShorts(query);
        console.log(`🔍 Enhanced query for reels/shorts focus: ${enhancedQuery}`);

        // Get user's country code for region-specific results
        const countryCode = await getUserCountryCode();
        const regionParam = countryCode ? `&regionCode=${countryCode}` : '';

        // Use optimized cached API request instead of direct fetch
        const data = await cachedApiRequest(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(enhancedQuery)}&maxResults=20&type=video&order=viewCount${regionParam}&key=${YOUTUBE_API_KEY}`,
            "GET",
            null
        );
        console.log(`📺 API response for "${enhancedQuery}":`, data);

        if (data.items && data.items.length > 0) {
            dispatch({ type: 'SET_VIDEO_ITEMS', payload: data.items });
            dispatch({ type: 'SET_NEXT_PAGE_TOKEN', payload: data.nextPageToken || null });
            console.log(`✅ Found ${data.items.length} videos for query: ${query}`);

            // Save search query to Firebase or localStorage
            if (authEnabled && user) {
                saveSearchQuery(query, data.items.length).catch(() => {
                    // Fallback to localStorage
                    saveLocalSearchHistory(query, data.items.length);
                });
                // Update trending topics
                updateTrendingTopic(query).catch(() => {
                    // Silently fail - trending topics are optional
                });
            } else {
                // Use localStorage fallback
                saveLocalSearchHistory(query, data.items.length);
            }

            // Show videos immediately, load additional content in background
            dispatch({ type: 'SET_CONTENT_READY', payload: true });
            dispatch({ type: 'SET_LOADING', payload: false });

            // Background content loading - non-blocking
            Promise.all([
                getYouTubeContent(query).catch(err =>
                    logDebug(`Background YouTube content failed: ${err}`, "warning")
                ),
                Promise.all(data.items.slice(0, 10).map((video: VideoItem) =>
                    generateVideoSummary(
                        video.id.videoId,
                        video.snippet.title,
                        video.snippet.description
                    ).catch(err =>
                        logDebug(`Background summary failed for ${video.id.videoId}: ${err}`, "warning")
                    )
                )),
                clusterVideosByTopic(data.items).catch(err =>
                    logDebug(`Background clustering failed: ${err}`, "warning")
                )
            ]).catch(err =>
                logDebug(`Background processing failed: ${err}`, "warning")
            );
        } else {
            console.log(`⚠️ No videos found for query: ${query}`);
            dispatch({ type: 'SET_VIDEO_ITEMS', payload: [] });
            dispatch({ type: 'SET_OPENAI_CONTENT', payload: "No results found. Please try a different search query." });
            dispatch({ type: 'SET_CONTENT_READY', payload: true });
            dispatch({ type: 'SET_LOADING', payload: false });
        }

    } catch (error) {
        console.error("Search error:", error);
        let errorMessage = "Error occurred during search. Please try again.";

        if (error instanceof Error) {
            // Check for quota exceeded error (check both the specific message and generic patterns)
            const isQuotaExceeded = error.message.includes("YouTube quota exceeded - please come back tomorrow!") ||
                (error.message.includes("403") &&
                    (error.message.toLowerCase().includes("quota") ||
                        error.message.toLowerCase().includes("quotaexceeded") ||
                        error.message.toLowerCase().includes("quota exceeded") ||
                        error.message.toLowerCase().includes("queries per day")));

            if (isQuotaExceeded) {
                console.error("YouTube quota exceeded error detected:", error.message);
                errorMessage = "YouTube quota exceeded - please come back tomorrow!";
            } else if (error.message.includes("403 Forbidden")) {
                errorMessage = `YouTube API 403 Forbidden Error

Current API Key: ${YOUTUBE_API_KEY.substring(0, 10)}...

To fix this:
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new API key or check your existing one
3. Enable YouTube Data API v3 in your project
4. Create a .env file with: REACT_APP_YOUTUBE_API_KEY=your_actual_api_key
5. Restart your development server

Common causes:
- API key is invalid or expired
- Daily quota exceeded (10,000 requests/day)
- API key restrictions prevent this usage
- Billing not enabled on Google Cloud project`;
            } else if (error.message.includes("API key")) {
                errorMessage = "YouTube API key is not configured. Please check your environment variables.";
            } else if (error.message.includes("quota")) {
                errorMessage = "YouTube quota exceeded - please come back tomorrow!";
            } else if (error.message.includes("not initialized")) {
                errorMessage = "YouTube API is not initialized. Please refresh the page.";
            } else {
                errorMessage = `Search error: ${error.message}`;
            }
        }

        dispatch({ type: 'SET_VIDEO_ITEMS', payload: [] });
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_CONTENT_READY', payload: true });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

// Get user's country code from browser
const getUserCountryCode = async (): Promise<string | null> => {
    try {
        // Try to get country from browser's Intl API
        const locale = navigator.language || (navigator as any).userLanguage;
        const countryCode = locale.split('-')[1]?.toUpperCase() || null;

        // Fallback: Try to get from timezone (less accurate but works)
        if (!countryCode) {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Map common timezones to country codes (simplified mapping)
            const timezoneToCountry: { [key: string]: string } = {
                'America/New_York': 'US',
                'America/Los_Angeles': 'US',
                'America/Chicago': 'US',
                'America/Denver': 'US',
                'Europe/London': 'GB',
                'Europe/Paris': 'FR',
                'Europe/Berlin': 'DE',
                'Europe/Rome': 'IT',
                'Europe/Madrid': 'ES',
                'Asia/Tokyo': 'JP',
                'Asia/Shanghai': 'CN',
                'Asia/Dubai': 'AE',
                'Asia/Mumbai': 'IN',
                'Australia/Sydney': 'AU',
                'America/Mexico_City': 'MX',
                'America/Sao_Paulo': 'BR',
                'America/Buenos_Aires': 'AR',
                'Africa/Cairo': 'EG',
                'Africa/Johannesburg': 'ZA'
            };
            return timezoneToCountry[timezone] || null;
        }

        return countryCode;
    } catch (error) {
        console.log('Could not determine country code:', error);
        return null;
    }
};

// Convert country code to country name
const getCountryName = (countryCode: string | null): string | null => {
    if (!countryCode) return null;

    const countryNames: { [key: string]: string } = {
        'US': 'United States',
        'GB': 'United Kingdom',
        'CA': 'Canada',
        'AU': 'Australia',
        'IN': 'India',
        'BR': 'Brazil',
        'MX': 'Mexico',
        'FR': 'France',
        'DE': 'Germany',
        'IT': 'Italy',
        'ES': 'Spain',
        'JP': 'Japan',
        'CN': 'China',
        'KR': 'South Korea',
        'AE': 'United Arab Emirates',
        'SA': 'Saudi Arabia',
        'EG': 'Egypt',
        'ZA': 'South Africa',
        'AR': 'Argentina',
        'CL': 'Chile',
        'CO': 'Colombia'
    };

    return countryNames[countryCode] || null;
};

// Get location-based trending topics for fallback
const getLocationBasedTrendingTopics = (countryCode: string | null): string[] => {
    const globalTopics = [
        "viral dance trends",
        "comedy skits",
        "food recipes",
        "travel destinations",
        "fitness workouts",
        "life hacks",
        "pet videos",
        "music covers",
        "art tutorials",
        "gaming highlights"
    ];

    if (!countryCode) {
        return globalTopics;
    }

    // Location-specific trending topics (without geographic identifiers in names)
    const locationTopics: { [key: string]: string[] } = {
        'US': [
            "viral dance",
            "comedy trends",
            "food hacks",
            "travel vlogs",
            "fitness",
            "life hacks",
            "pet moments",
            "music trends",
            "art",
            "gaming"
        ],
        'GB': [
            "viral trends",
            "comedy",
            "food recipes",
            "travel",
            "fitness",
            "life hacks",
            "pet videos",
            "music",
            "art trends",
            "gaming"
        ],
        'CA': [
            "viral",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'AU': [
            "viral trends",
            "comedy",
            "food",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'IN': [
            "viral trends",
            "comedy",
            "recipes",
            "travel vlogs",
            "fitness",
            "life hacks",
            "pet videos",
            "music",
            "art",
            "gaming"
        ],
        'BR': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'MX': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'FR': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'DE': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'IT': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'ES': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'JP': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'CN': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ],
        'KR': [
            "viral trends",
            "comedy",
            "recipes",
            "travel",
            "fitness",
            "life hacks",
            "pets",
            "music",
            "art",
            "gaming"
        ]
    };

    return locationTopics[countryCode] || globalTopics;
};

// Generate location-based popular reels/shorts search queries
const generateRandomReelsQuery = async (): Promise<string> => {
    const countryCode = await getUserCountryCode();

    // Base popular topics (universal)
    const popularReelsTopics = [
        'funny shorts',
        'viral reels',
        'trending shorts',
        'comedy reels',
        'dance shorts',
        'cooking shorts',
        'life hacks',
        'quick tips',
        'amazing tricks',
        'funny moments',
        'cute animals',
        'fitness shorts',
        'beauty tips',
        'travel shorts',
        'food hacks',
        'DIY shorts',
        'prank videos',
        'fail compilation',
        'satisfying videos',
        'oddly satisfying',
        'ASMR shorts',
        'relaxing videos',
        'motivational shorts',
        'success stories',
        'transformation videos',
        'before and after',
        'magic tricks',
        'illusion videos',
        'mind blowing',
        'unbelievable moments',
        'funny reels',
        'viral shorts',
        'trending reels',
        'comedy shorts',
        'dance reels',
        'cooking reels',
        'life hack shorts',
        'quick tip reels',
        'amazing trick shorts',
        'funny moment reels'
    ];

    // Add location-specific topics if country code is available
    if (countryCode) {
        const locationTopics: { [key: string]: string[] } = {
            'US': ['American trends', 'US viral', 'trending USA'],
            'GB': ['UK trends', 'British viral', 'trending UK'],
            'CA': ['Canadian trends', 'Canada viral'],
            'AU': ['Australian trends', 'Aussie viral'],
            'IN': ['India trends', 'Indian viral', 'trending India'],
            'BR': ['Brazil trends', 'Brasil viral'],
            'MX': ['Mexico trends', 'Mexican viral'],
            'FR': ['France trends', 'French viral', 'trending France'],
            'DE': ['Germany trends', 'German viral'],
            'IT': ['Italy trends', 'Italian viral'],
            'ES': ['Spain trends', 'Spanish viral'],
            'JP': ['Japan trends', 'Japanese viral', 'trending Japan'],
            'CN': ['China trends', 'Chinese viral'],
            'KR': ['Korea trends', 'Korean viral', 'K-pop'],
            'AE': ['UAE trends', 'Dubai viral'],
            'SA': ['Saudi trends', 'Saudi viral'],
            'EG': ['Egypt trends', 'Egyptian viral'],
            'ZA': ['South Africa trends', 'SA viral'],
            'AR': ['Argentina trends', 'Argentine viral'],
            'CL': ['Chile trends', 'Chilean viral'],
            'CO': ['Colombia trends', 'Colombian viral']
        };

        const countryTopics = locationTopics[countryCode] || [];
        if (countryTopics.length > 0) {
            // Add location-specific topics to the pool
            popularReelsTopics.push(...countryTopics);
        }
    }

    const randomIndex = Math.floor(Math.random() * popularReelsTopics.length);
    return popularReelsTopics[randomIndex];
};

// Generate a related search query based on current videos
const generateRelatedQuery = async () => {
    if (videoItems.length === 0) {
        return await generateRandomReelsQuery();
    }

    // Extract common keywords from the first few videos
    const topVideos = videoItems.slice(0, 5);
    const keywords: string[] = [];

    topVideos.forEach(video => {
        const title = video.snippet.title.toLowerCase();
        const description = video.snippet.description.toLowerCase();

        // Extract words (excluding common stop words)
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
        const words = (title + ' ' + description).split(/\W+/).filter(word =>
            word.length > 3 && !stopWords.includes(word)
        );
        keywords.push(...words);
    });

    // Find most common keywords
    const wordCounts: { [key: string]: number } = {};
    keywords.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    const fallbackQuery = await generateRandomReelsQuery();
    return sortedWords.join(' ') || fallbackQuery;
};

// Load more videos using pagination or refresh with similar content
const loadMoreVideos = async (isInfiniteScroll: boolean = false) => {
    if (isLoading) {
        console.log('Already loading');
        return;
    }

    // For infinite scroll, always use pagination (don't refresh)
    if (!isInfiniteScroll) {
        // Check if this is the second click (after pagination)
        if (paginationClickCount >= 1) {
            console.log('🔄 Refreshing with random popular reels');
            const randomQuery = await generateRandomReelsQuery();
            console.log(`🔍 Generated random reels query: ${randomQuery}`);

            // Reset and perform new search
            dispatch({ type: 'RESET_PAGINATION_CLICK' });
            dispatch({ type: 'SET_SEARCH_QUERY', payload: randomQuery });
            await searchVideos(randomQuery);
            return;
        }
        dispatch({ type: 'INCREMENT_PAGINATION_CLICK' });
    }

    // Paginate if token exists
    if (!nextPageToken) {
        console.log('No more videos to load');
        return;
    }

    console.log(`🔍 Loading more videos with pageToken: ${nextPageToken}`);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
        if (!YOUTUBE_API_KEY) {
            throw new Error("YouTube API key is not configured");
        }

        const query = searchQuery || await generateRandomReelsQuery();
        const enhancedQuery = enhanceQueryForReelsShorts(query);
        // Get user's country code for region-specific results
        const countryCode = await getUserCountryCode();
        const regionParam = countryCode ? `&regionCode=${countryCode}` : '';
        // Load more videos for infinite scroll (18 = 3 rows of 6 videos)
        const maxResults = isInfiniteScroll ? 18 : 10;
        const data = await cachedApiRequest(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(enhancedQuery)}&maxResults=${maxResults}&type=video&order=viewCount&pageToken=${nextPageToken}${regionParam}&key=${YOUTUBE_API_KEY}`,
            "GET",
            null
        );
        console.log(`📺 Loaded ${data.items?.length || 0} more videos`);

        if (data.items && data.items.length > 0) {
            dispatch({ type: 'APPEND_VIDEO_ITEMS', payload: data.items });
            dispatch({ type: 'SET_NEXT_PAGE_TOKEN', payload: data.nextPageToken || null });
            console.log(`✅ Appended ${data.items.length} more videos`);
        } else {
            console.log(`⚠️ No more videos found`);
            dispatch({ type: 'SET_NEXT_PAGE_TOKEN', payload: null });
        }

    } catch (error) {
        console.error("Load more error:", error);
        let errorMessage = 'Error loading more videos. Please try again.';

        if (error instanceof Error) {
            // Check for quota exceeded error (check both the specific message and generic patterns)
            const isQuotaExceeded = error.message.includes("YouTube quota exceeded - please come back tomorrow!") ||
                (error.message.includes("403") &&
                    (error.message.toLowerCase().includes("quota") ||
                        error.message.toLowerCase().includes("quotaexceeded") ||
                        error.message.toLowerCase().includes("quota exceeded") ||
                        error.message.toLowerCase().includes("queries per day")));

            if (isQuotaExceeded) {
                console.error("YouTube quota exceeded error detected:", error.message);
                errorMessage = "YouTube quota exceeded - please come back tomorrow!";
            } else if (error.message.toLowerCase().includes("quota")) {
                errorMessage = "YouTube quota exceeded - please come back tomorrow!";
            }
        }

        dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
};

// Infinite scroll handler for both mobile and desktop views
useEffect(() => {
    const handleScroll = (scrollRef: React.RefObject<HTMLDivElement | null>) => {
        if (!scrollRef.current || isLoading || isLoadingMore || !nextPageToken) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Load more when within 300px of bottom
        if (distanceFromBottom < 300) {
            setIsLoadingMore(true);
            loadMoreVideos(true).finally(() => {
                setIsLoadingMore(false);
            });
        }
    };

    const mobileHandler = () => {
        if (windowWidth <= 768) {
            handleScroll(mobileScrollRef);
        }
    };

    const desktopHandler = () => {
        if (windowWidth > 768) {
            handleScroll(desktopScrollRef);
        }
    };

    const mobileContainer = mobileScrollRef.current;
    const desktopContainer = desktopScrollRef.current;

    if (mobileContainer && windowWidth <= 768) {
        mobileContainer.addEventListener('scroll', mobileHandler, { passive: true });
    }
    if (desktopContainer && windowWidth > 768) {
        desktopContainer.addEventListener('scroll', desktopHandler, { passive: true });
    }

    return () => {
        if (mobileContainer) {
            mobileContainer.removeEventListener('scroll', mobileHandler);
        }
        if (desktopContainer) {
            desktopContainer.removeEventListener('scroll', desktopHandler);
        }
    };
}, [windowWidth, videoItems.length, isLoading, isLoadingMore, nextPageToken, loadMoreVideos]);

// Refresh videos - reload with random popular reels/shorts
const refreshVideos = async () => {
    console.log('🔄 Refresh button clicked!', { isLoading, searchQuery, videoItemsCount: videoItems.length });

    if (isLoading) {
        console.log('Already loading, skipping refresh');
        return;
    }

    // Generate a random reels query for fresh content
    const randomQuery = await generateRandomReelsQuery();
    console.log(`🔄 Refreshing with random popular reels using query: ${randomQuery}`);

    // Reset pagination state
    dispatch({ type: 'RESET_PAGINATION_CLICK' });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: randomQuery });

    // Use the existing searchVideos function to perform the search
    await searchVideos(randomQuery);
};

const renderError = () => {
    if (!error) return null;

    const isApiKeyError = error.includes('Missing YouTube API key') ||
        error.includes('YouTube API key not configured');
    const isQuotaExceeded = error.includes('YouTube quota exceeded - please come back tomorrow!');

    return (
        <div
            style= {{
        paddingTop: windowWidth <= 768 ? '0' : '0',
            paddingBottom: '20px',
                paddingLeft: '0',
                    paddingRight: '0',
                        width: '100%',
                            boxSizing: 'border-box',
                                marginTop: windowWidth <= 768 ? '0' : '0',
            }
}
        >
    <div
                style={
    {
        paddingTop: windowWidth <= 768 ? '40px' : '20px',
            paddingBottom: '20px',
                paddingLeft: '20px',
                    paddingRight: '20px',
                        textAlign: 'center',
                            backgroundColor: isApiKeyError ? '#fff3cd' : isQuotaExceeded ? '#fff3cd' : '#f8d7da',
                                border: `1px solid ${isApiKeyError ? '#ffeaa7' : isQuotaExceeded ? '#ffc107' : '#f5c6cb'}`,
                                    borderRadius: '8px',
                                        margin: '0 auto',
                                            maxWidth: '600px',
                                                fontFamily: 'Arial, sans-serif',
                }
}
            >
    <h2 style={ { color: isApiKeyError ? '#856404' : isQuotaExceeded ? '#856404' : '#721c24' } }>
        { isApiKeyError? 'Configuration Issue': isQuotaExceeded ? 'Quota Exceeded' : 'Error' }
        </h2>
        < p
style = {{
    color: isApiKeyError ? '#856404' : isQuotaExceeded ? '#856404' : '#721c24',
        marginBottom: '20px',
            whiteSpace: 'pre-line',
                textAlign: isQuotaExceeded ? 'center' : 'left',
                    maxWidth: '600px',
                        margin: '0 auto 20px auto',
                            fontSize: isQuotaExceeded ? '18px' : 'inherit',
                                fontWeight: isQuotaExceeded ? '600' : 'inherit',
                    }}
                >
    { error }
    </p>
{
    isApiKeyError && (
        <div style={ { marginBottom: '20px' } }>
            <div
                            style={
        {
            marginBottom: '15px',
                padding: '10px',
                    backgroundColor: '#e7f3ff',
                        borderRadius: '5px',
                            border: '1px solid #b3d9ff',
                            }
    }
                        >
        <strong>🔑 API Key Required: </strong>
            < p style = {{ margin: '5px 0', fontSize: '14px' }
}>
    This app uses YouTube Data API v3 to access public video data.{ ' ' }
<strong>No user authentication required - no unverified app warnings! </strong> The API
                                key is used server - side and does not require user consent.
                            </p>
    </div>
    < strong > Setup Instructions: </strong>
        < ul style = {{ textAlign: 'left', maxWidth: '600px', margin: '10px auto' }}>
            <li>Get a YouTube Data API v3 key from Google Cloud Console </li>
                < li > Add it to your environment variables as YOUTUBE_API_KEY</ li >
                    <li>No OAuth setup required - API key only </li>
                        < li > No unverified app warnings for users </li>
                            </ul>
                            </div>
                )}
<div style={ { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } }>
    <button
                        onClick={ () => window.location.reload() }
style = {{
    padding: '10px 20px',
        backgroundColor: '#007bff',
            color: 'white',
                border: 'none',
                    borderRadius: '4px',
                        cursor: 'pointer',
                        }}
                    >
    Retry Loading
        </button>
        < button
onClick = {() => dispatch({ type: 'SET_ERROR', payload: null })}
style = {{
    padding: '10px 20px',
        backgroundColor: isApiKeyError ? '#856404' : '#721c24',
            color: 'white',
                border: 'none',
                    borderRadius: '4px',
                        cursor: 'pointer',
                        }}
                    >
    Close
    </button>
    </div>
    </div>
    </div>
    );
};

const renderTrendingTopics = () => {
    if (!showTrendingTopics || trendingTopics.length === 0) return null;

    const overlay = React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 998,
            animation: 'fadeIn 0.3s ease-out'
        },
        onClick: () => dispatch({ type: 'SET_SHOW_TRENDING_TOPICS', payload: false })
    });

    const header = React.createElement(
        'div',
        {
            className: 'trending-bar-header',
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(0,0,0,0.08)'
            }
        },
        React.createElement(
            'div',
            null,
            React.createElement(
                'h2',
                {
                    className: 'trending-bar-title',
                    style: {
                        margin: 0,
                        color: '#1a1a1a',
                        fontSize: '22px',
                        fontWeight: '700'
                    }
                },
                'Trending Topics'
            ),
            React.createElement(
                'p',
                {
                    style: {
                        margin: '4px 0 0',
                        color: '#666',
                        fontSize: '13px'
                    }
                },
                'Tap a topic to search'
            )
        ),
        React.createElement(
            'button',
            {
                onClick: () => dispatch({ type: 'SET_SHOW_TRENDING_TOPICS', payload: false }),
                style: {
                    background: 'none',
                    border: 'none',
                    fontSize: '22px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '4px 8px'
                },
                'aria-label': 'Close trending topics'
            },
            '✕'
        )
    );

    const grid = React.createElement(
        'div',
        {
            className: 'trending-topics-grid',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px'
            }
        },
        trendingTopics.map((topic, idx) =>
            React.createElement(
                'button',
                {
                    key: `${topic}-${idx}`,
                    className: 'trending-topic-button',
                    onClick: () => handleTrendingTopicClick(topic),
                    style: {
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                        color: '#333'
                    }
                },
                topic
            )
        )
    );

    const popup = React.createElement(
        'div',
        {
            className: 'trending-bar-popup',
            style: {
                position: 'fixed',
                top: '85px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'min(95vw, 800px)',
                maxWidth: '800px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                zIndex: 999,
                maxHeight: '70vh',
                overflowY: 'auto',
                animation: 'slideDown 0.3s ease-out'
            }
        },
        header,
        grid
    );

    return React.createElement(React.Fragment, null, overlay, popup);
};

const isDesktopTrendingPanel = windowWidth > 1024;
const trendingSidebarItems = Array.isArray(sidebarTrending)
    ? (isDesktopTrendingPanel ? sidebarTrending.slice(0, 15) : sidebarTrending.slice(0, 14))
    : [];

const trendingSidebarContentStyle: React.CSSProperties = isDesktopTrendingPanel
    ? {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridAutoRows: 'minmax(140px, auto)',
        gap: '16px',
        padding: '20px',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y',
        alignContent: 'start',
        justifyItems: 'stretch',
        minHeight: '0',
        height: '100%'
    }
    : {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: '0px',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        overscrollBehavior: 'contain',
        minHeight: '0',
        height: '100%',
        maxHeight: '100%'
    };

const getTrendingSidebarItemStyle = (idx: number): React.CSSProperties =>
    isDesktopTrendingPanel
        ? {
            position: 'relative',
            cursor: 'pointer',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'all 0.35s ease',
            animation: `fadeInUp 0.6s ease-out ${idx * 0.05}s both`,
            background: `linear-gradient(145deg,
                rgba(15, 23, 42, 0.95) 0%,
                rgba(30, 41, 59, 0.95) 55%,
                hsl(${(idx * 28 + 210) % 360}, 60%, 35%) 100%)`,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            flexDirection: 'column',
            padding: '12px',
            minHeight: '160px',
            width: '100%',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
            flexShrink: 0
        }
        : {
            height: windowWidth <= 768 ? '56px' : windowWidth <= 1024 ? '120px' : '160px',
            minHeight: windowWidth <= 768 ? '56px' : windowWidth <= 1024 ? '120px' : '160px',
            position: 'relative',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            background: `linear-gradient(145deg,
                rgba(15, 23, 42, 0.95) 0%,
                rgba(30, 41, 59, 0.95) 55%,
                hsl(${(idx * 28 + 210) % 360}, 60%, 30%) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'all 0.35s ease',
            animation: `fadeInUp 0.6s ease-out ${idx * 0.08}s both`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            flexShrink: 0,
            touchAction: 'pan-y'
        };

const renderTrendingSidebar = () => {
    if (modalVisible || selectedVideoId || !sidebarVisible) return null;

    const header = React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 60%, rgba(59, 130, 246, 0.35) 100%)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
            }
        },
        React.createElement(
            'div',
            {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    position: 'relative',
                    zIndex: 2,
                }
            },
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }
                },
                React.createElement('span', {
                    style: {
                        width: '8px',
                        height: '8px',
                        borderRadius: '999px',
                        background: '#22c55e',
                        boxShadow: '0 0 10px rgba(34,197,94,0.8)',
                    }
                }),
                React.createElement(
                    'h1',
                    {
                        style: {
                            fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
                            fontSize: isDesktopTrendingPanel ? '22px' : '20px',
                            fontWeight: '600',
                            color: 'white',
                            margin: 0,
                            letterSpacing: '-0.4px',
                            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        }
                    },
                    'Trending Now'
                ),
                React.createElement(
                    'span',
                    {
                        style: {
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(59,130,246,0.25)',
                            border: '1px solid rgba(148,163,184,0.25)',
                            color: 'rgba(226,232,240,0.9)',
                            fontSize: '10px',
                            fontWeight: '600',
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase'
                        }
                    },
                    'Live'
                )
            ),
            React.createElement(
                'span',
                {
                    style: {
                        fontSize: '12px',
                        color: 'rgba(226,232,240,0.7)',
                        letterSpacing: '0.2px'
                    }
                },
                'Fresh picks for you'
            )
        ),
        React.createElement(
            'button',
            {
                onClick: () => dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: false }),
                style: {
                    width: '34px',
                    height: '34px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(148,163,184,0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 2,
                },
                onMouseOver: (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.4)';
                },
                onMouseOut: (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                }
            },
            React.createElement(
                'svg',
                { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
                React.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
            )
        )
    );

    const loading = React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'white',
                padding: '40px 20px',
            }
        },
        React.createElement(
            'div',
            {
                style: {
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    marginBottom: '24px',
                }
            },
            React.createElement('div', {
                style: {
                    width: '60px',
                    height: '60px',
                    border: '4px solid rgba(255,255,255,0.1)',
                    borderTop: '4px solid #38bdf8',
                    borderRight: '4px solid #22d3ee',
                    borderRadius: '50%',
                    animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }
            }),
            React.createElement('div', {
                style: {
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(255,255,255,0.05)',
                    borderBottom: '3px solid #0ea5e9',
                    borderRadius: '50%',
                    animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse',
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                }
            })
        ),
        React.createElement(
            'div',
            {
                style: {
                    textAlign: 'center',
                    animation: 'fadeInUp 0.6s ease-out',
                }
            },
            React.createElement(
                'span',
                {
                    style: {
                        fontSize: '16px',
                        fontWeight: '600',
                        opacity: 0.9,
                        display: 'block',
                        marginBottom: '8px',
                    }
                },
                'Loading trending topics'
            ),
            React.createElement(
                'span',
                {
                    style: {
                        fontSize: '12px',
                        opacity: 0.6,
                        display: 'block',
                    }
                },
                'Curating the latest picks'
            )
        )
    );

    const iconSet = [
        {
            keywords: ['music', 'song', 'artist', 'album', 'concert', 'live', 'dj'],
            paths: ['M12 5v14', 'M7 9h10', 'M7 15h10'],
            color: '#38bdf8'
        },
        {
            keywords: ['sports', 'sport', 'game', 'match', 'nba', 'nfl', 'soccer', 'football', 'tennis', 'golf'],
            paths: ['M12 4l3 6-3 10-3-10 3-6'],
            color: '#f59e0b'
        },
        {
            keywords: ['news', 'update', 'breaking', 'politics', 'election', 'headline'],
            paths: ['M6 6h12', 'M6 12h12', 'M6 18h12'],
            color: '#a855f7'
        },
        {
            keywords: ['food', 'recipe', 'cook', 'kitchen', 'dining', 'restaurant'],
            paths: ['M7 6v12', 'M12 6v12', 'M17 6v12'],
            color: '#22d3ee'
        },
        {
            keywords: ['tech', 'ai', 'robot', 'code', 'coding', 'app', 'software', 'gadget'],
            paths: ['M7 7h10v10H7z', 'M12 5v14', 'M5 12h14'],
            color: '#60a5fa'
        },
        {
            keywords: ['fashion', 'style', 'beauty', 'makeup', 'design', 'art', 'travel', 'vlog'],
            paths: ['M12 4l7 4v8l-7 4-7-4V8l7-4'],
            color: '#fb7185'
        },
    ];

    const content = React.createElement(
        'div',
        { className: 'trending-sidebar-content', style: trendingSidebarContentStyle },
        trendingSidebarItems.map((topic, idx) => {
            const lowerTopic = topic.toLowerCase();
            const matchedIcon = iconSet.find((item) =>
                item.keywords.some((keyword) => lowerTopic.includes(keyword))
            );
            const icon = matchedIcon ?? iconSet[idx % iconSet.length];

            return React.createElement(
                'div',
                {
                    key: idx,
                    style: getTrendingSidebarItemStyle(idx),
                    onClick: () => handleSidebarTrendingClick(topic),
                    onMouseOver: (e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
                        e.currentTarget.style.filter = 'brightness(1.15) saturate(1.1)';
                        e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.3)';
                    },
                    onMouseOut: (e: React.MouseEvent<HTMLDivElement>) => {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                        e.currentTarget.style.filter = 'brightness(1) saturate(1)';
                        e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.1)';
                    }
                },
                React.createElement('div', {
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `
                                                radial-gradient(circle at ${20 + (idx * 30) % 60}% ${30 + (idx * 25) % 40}%,
                                                    rgba(255,255,255,0.15) 0%,
                                                    transparent 40%),
                                                radial-gradient(circle at ${80 - (idx * 20) % 60}% ${70 - (idx * 15) % 40}%,
                                                    rgba(255,255,255,0.08) 0%,
                                                    transparent 30%)
                                            `,
                        opacity: 0.8,
                    }
                }),
                React.createElement('div', {
                    style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s ease',
                    }
                }),
                React.createElement(
                    'div',
                    {
                        style: {
                            position: 'relative',
                            zIndex: 2,
                            textAlign: 'center',
                            padding: isDesktopTrendingPanel ? '12px' : '10px 10px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100%',
                        }
                    },
                    React.createElement(
                        'div',
                        {
                            style: {
                                width: '100%',
                                minHeight: isDesktopTrendingPanel ? '120px' : '48px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                background: `linear-gradient(165deg, rgba(255,255,255,0.1) 0%, rgba(15,23,42,0.92) 55%, ${icon.color}22 100%)`,
                                border: `1px solid ${icon.color}55`,
                                boxShadow: `0 14px 30px rgba(0,0,0,0.35), 0 0 20px ${icon.color}44, inset 0 1px 0 rgba(255,255,255,0.12)`,
                                position: 'relative',
                                overflow: 'hidden',
                                padding: isDesktopTrendingPanel ? '14px 16px' : '4px 6px',
                            }
                        },
                        React.createElement('div', {
                            style: {
                                position: 'absolute',
                                inset: '-20%',
                                borderRadius: '999px',
                                background: `radial-gradient(circle, ${icon.color}2d 0%, transparent 60%)`,
                                filter: 'blur(3px)',
                                opacity: 0.9,
                            }
                        }),
                        React.createElement(
                            'span',
                            {
                                style: {
                                    fontSize: isDesktopTrendingPanel ? '14px' : '11px',
                                    fontWeight: '700',
                                    color: 'white',
                                    textTransform: 'none',
                                    textShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 12px ${icon.color}55`,
                                    letterSpacing: '0.1px',
                                    lineHeight: '1.05',
                                    textAlign: 'left',
                                    width: '100%',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                }
                            },
                            topic
                        )
                    ),
                    null
                )
            );
        })
    );

    const feed = React.createElement(
        'div',
        {
            style: {
                flex: 1,
                position: 'relative',
                overflowX: 'hidden',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                minHeight: 0,
                pointerEvents: 'auto',
                touchAction: 'pan-y',
                height: '100%',
            }
        },
        sidebarTrendingLoading ? loading : content
    );

    const footer = null;

    return React.createElement(
        'div',
        {
            className: `trending-sidebar tiktok-sidebar mobile-optimized-sidebar ${isDesktopTrendingPanel ? 'desktop' : 'mobile'}`,
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                width: isDesktopTrendingPanel ? 'min(900px, 70%)' : 'min(320px, 30%)',
                height: '100vh',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 0.98) 100%)',
                zIndex: 1000,
                overflow: 'hidden',
                overflowY: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(148, 163, 184, 0.12)',
                boxShadow: '12px 0 40px rgba(0,0,0,0.4)',
            }
        },
        header,
        feed,
        footer
    );
};

// TikTok-style navigation functions
const navigateToVideo = useCallback((direction: 'up' | 'down') => {
    if (isTransitioning || !videoItems.length) return;

    dispatch({ type: 'SET_IS_TRANSITIONING', payload: true });
    const newIndex = direction === 'down'
        ? Math.min(currentVideoIndex + 1, videoItems.length - 1)
        : Math.max(currentVideoIndex - 1, 0);

    dispatch({ type: 'SET_CURRENT_VIDEO_INDEX', payload: newIndex });

    // Reset transition state after animation
    setTimeout(() => dispatch({ type: 'SET_IS_TRANSITIONING', payload: false }), 300);
}, [currentVideoIndex, videoItems.length, isTransitioning]);

// TikTok-style touch handlers
const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dispatch({ type: 'SET_TOUCH_START_Y', payload: e.touches[0].clientY });
    dispatch({ type: 'SET_TOUCH_START_X', payload: e.touches[0].clientX });
}, []);

const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartY || !touchStartX) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = touchStartY - touchEndY;
    const diffX = Math.abs(touchStartX - touchEndX);

    // Only handle vertical swipes (ignore horizontal swipes)
    if (Math.abs(diffY) > 30 && diffX < 100) {
        if (diffY > 0) {
            // Swipe up - next video
            navigateToVideo('down');
        } else {
            // Swipe down - previous video
            navigateToVideo('up');
        }
    }

    dispatch({ type: 'SET_TOUCH_START_Y', payload: 0 });
    dispatch({ type: 'SET_TOUCH_START_X', payload: 0 });
}, [touchStartY, touchStartX, navigateToVideo]);

// Sidebar touch functionality removed - using native scrolling instead

// Enhanced modal swipe functionality for video navigation
const handleModalTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;

    // Don't interfere with button clicks
    if (target.closest('button')) {
        e.stopPropagation();
        return;
    }

    const touch = e.touches[0];
    console.log('📱 Touch start detected:', { clientY: touch.clientY, clientX: touch.clientX });

    // Touch detection for swipe navigation - no automatic unmute needed since starting unmuted

    // Store touch start position and time for swipe detection
    modalTouchStartYRef.current = touch.clientY;
    modalTouchStartXRef.current = touch.clientX;
    modalIsSwipingRef.current = true;
}, [selectedVideoId]);

const handleModalTouchMove = useCallback((e: React.TouchEvent) => {
    if (modalIsSwipingRef.current && modalTouchStartYRef.current) {
        const touch = e.touches[0];
        const diffY = Math.abs(modalTouchStartYRef.current - touch.clientY);
        const diffX = Math.abs(modalTouchStartXRef.current - touch.clientX);

        // Only prevent default if significant vertical movement detected (10px threshold)
        if (diffY > 10 && diffY > diffX) {
            try {
                e.preventDefault();
            } catch (error) {
                // Ignore preventDefault errors from passive listeners
            }
            e.stopPropagation();
            console.log('📱 Swipe movement detected:', { diffY, diffX });
        }
    }
}, []);

const handleModalTouchEnd = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;

    // Don't interfere with button clicks
    if (target.closest('button')) {
        e.stopPropagation();
        modalTouchStartYRef.current = 0;
        modalTouchStartXRef.current = 0;
        modalIsSwipingRef.current = false;
        return;
    }

    if (!modalTouchStartYRef.current && !modalTouchStartXRef.current) {
        console.log('📱 Touch end: No touch start data');
        modalTouchStartYRef.current = 0;
        modalTouchStartXRef.current = 0;
        modalIsSwipingRef.current = false;
        return;
    }

    const touch = e.changedTouches[0];
    const touchEndY = touch.clientY;
    const touchEndX = touch.clientX;
    const diffY = modalTouchStartYRef.current - touchEndY;
    const diffX = modalTouchStartXRef.current - touchEndX;

    console.log('📱 Touch end:', { diffY, diffX, startY: modalTouchStartYRef.current, endY: touchEndY });

    // Detect vertical swipe (swipe threshold: 50px)
    const swipeThreshold = 50;
    const isVerticalSwipe = Math.abs(diffY) > swipeThreshold && Math.abs(diffY) > Math.abs(diffX) * 2;

    if (isVerticalSwipe) {
        console.log('📱 Vertical swipe detected!', { diffY, direction: diffY > 0 ? 'up' : 'down' });

        if (diffY > 0) {
            // Swipe up - go to next video
            const nextIndex = currentVideoIndex + 1;
            console.log('📱 Swipe up - navigating to next video', { nextIndex, total: videoItems.length });
            if (nextIndex < videoItems.length) {
                const nextVideo = videoItems[nextIndex];
                openModal(
                    nextVideo.id.videoId,
                    'youtube',
                    nextVideo.snippet.title,
                    nextVideo.snippet.description,
                    nextVideo.snippet.channelTitle,
                    nextVideo.snippet.publishedAt
                );
            } else {
                console.log('📱 Already at last video');
            }
        } else {
            // Swipe down - go to previous video
            const prevIndex = currentVideoIndex - 1;
            console.log('📱 Swipe down - navigating to previous video', { prevIndex });
            if (prevIndex >= 0) {
                const prevVideo = videoItems[prevIndex];
                openModal(
                    prevVideo.id.videoId,
                    'youtube',
                    prevVideo.snippet.title,
                    prevVideo.snippet.description,
                    prevVideo.snippet.channelTitle,
                    prevVideo.snippet.publishedAt
                );
            } else {
                console.log('📱 Already at first video');
            }
        }
    } else {
        console.log('📱 Not a vertical swipe (threshold not met or too horizontal)');
    }

    // Reset touch tracking
    modalTouchStartYRef.current = 0;
    modalTouchStartXRef.current = 0;
    modalIsSwipingRef.current = false;
}, [currentVideoIndex, videoItems, openModal]);

// Handle window resize for responsive behavior
useEffect(() => {
    const handleResize = () => {
        setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
}, []);

// Track header height to avoid mobile spacing issues
useEffect(() => {
    if (!headerRef.current) return;

    const updateHeaderHeight = () => {
        const nextHeight = headerRef.current?.getBoundingClientRect().height ?? 0;
        if (nextHeight) {
            setHeaderHeight((prev) => (prev === nextHeight ? prev : nextHeight));
        }
    };

    updateHeaderHeight();
    const observer = new ResizeObserver(() => updateHeaderHeight());
    observer.observe(headerRef.current);

    return () => {
        observer.disconnect();
    };
}, [windowWidth]);

// Function to update scroll indicators
const updateScrollIndicators = (container: HTMLElement) => {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
};

// Update scroll indicators when content changes
useEffect(() => {
    const container = document.querySelector('.horizontal-scroll-content') as HTMLElement;
    if (container && videoItems.length > 0) {
        // Small delay to ensure layout is complete
        setTimeout(() => {
            updateScrollIndicators(container);
        }, 100);
    }
}, [videoItems.length]);

// Keyboard navigation for horizontal scrolling
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const container = document.querySelector('.horizontal-scroll-content') as HTMLElement;
        if (!container || modalVisible) return;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                container.scrollBy({ left: -320, behavior: 'smooth' });
                setTimeout(() => updateScrollIndicators(container), 100);
                break;
            case 'ArrowRight':
                e.preventDefault();
                container.scrollBy({ left: 320, behavior: 'smooth' });
                setTimeout(() => updateScrollIndicators(container), 100);
                break;
            case 'Home':
                e.preventDefault();
                container.scrollTo({ left: 0, behavior: 'smooth' });
                setTimeout(() => updateScrollIndicators(container), 100);
                break;
            case 'End':
                e.preventDefault();
                container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
                setTimeout(() => updateScrollIndicators(container), 100);
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [modalVisible]);

// Global ESC handler for modal
useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && modalVisible) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        }
    };

    if (modalVisible) {
        document.addEventListener('keydown', handleEscapeKey, true); // Use capture phase
    }

    return () => {
        document.removeEventListener('keydown', handleEscapeKey, true);
    };
}, [modalVisible]);

// Auto-focus modal when it opens and force layout
useEffect(() => {
    if (modalVisible) {
        const modalElement = document.getElementById('videoModal');
        if (modalElement) {
            modalElement.focus();

            // Force layout recalculation to ensure proper dimensions
            setTimeout(() => {
                // Force the modal to be positioned relative to viewport
                modalElement.style.position = 'fixed';
                modalElement.style.top = '0px';
                modalElement.style.left = '0px';
                modalElement.style.right = '0px';
                modalElement.style.bottom = '0px';
                modalElement.style.width = '100vw';
                modalElement.style.height = '100vh';
                modalElement.style.zIndex = '1';

                modalElement.style.display = 'none';
                modalElement.offsetHeight; // Force reflow
                modalElement.style.display = 'flex';

                // Modal layout complete
            }, 100);
        }
    }
}, [modalVisible]);

// Initialize Google Auth when component mounts
useEffect(() => {
    // Check for Google API availability and initialize auth
    // OAuth initialization removed - using API key only
    // No need to check for Google OAuth anymore
}, []);

// Handle window resize and update windowWidth state to prevent layout shifts
useEffect(() => {
    const handleResize = debounce(() => {
        const newWidth = window.innerWidth;
        setWindowWidth(newWidth);

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (newWidth <= 768) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);

        if (isMobile && !isMobileMode) {
            console.log("📱 Window resize detected mobile, enabling mobile mode");
            dispatch({ type: 'SET_MOBILE_MODE', payload: true });
        } else if (!isMobile && isMobileMode) {
            console.log("🖥️ Window resize detected desktop, disabling mobile mode");
            dispatch({ type: 'SET_MOBILE_MODE', payload: false });
        }
    }, 150);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Initial check
    handleResize();

    return () => {
        handleResize.cancel();
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
    };
}, [isMobileMode]);

// Fetch trending reels for sidebar
const fetchSidebarTrending = async () => {
    dispatch({ type: 'SET_SIDEBAR_TRENDING_LOADING', payload: true });
    try {
        // Get user's country code for location-specific trending topics
        const countryCode = await getUserCountryCode();
        const countryName = countryCode ? getCountryName(countryCode) : null;

        if (!ENABLE_OPENAI_FEATURES) {
            const fallbackTopics = getLocationBasedTrendingTopics(countryCode);
            dispatch({ type: 'SET_SIDEBAR_TRENDING', payload: fallbackTopics });
            return;
        }

        // Skip OpenAI request if API key is not configured
        if (!OPENAI_API_KEY || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY") {
            logDebug("OpenAI API key not configured, using location-based fallback trending topics", "warning");
            const fallbackTopics = getLocationBasedTrendingTopics(countryCode);
            dispatch({ type: 'SET_SIDEBAR_TRENDING', payload: fallbackTopics });
            return;
        }

        const locationContext = countryName
            ? ` Focus on trending topics popular in ${countryName}.`
            : ' Focus on globally trending topics.';
        const prompt = `Provide exactly 10 trending topics for Instagram Reels and YouTube Shorts.${locationContext} Return ONLY a JSON array of strings, like: ["topic1", "topic2", "topic3", "topic4", "topic5", "topic6", "topic7", "topic8", "topic9", "topic10"]. No other text.`;
        const response = await fetchOpenAIContent(prompt);
        const content = response.choices[0].message.content.trim();

        // Try to parse the response as JSON
        let topics;
        try {
            // Try to extract JSON using the helper function
            topics = extractJSONFromResponse(content);
            if (topics) {
                // Successfully parsed JSON
            } else {
                // If no JSON array found, try to extract from text
                const lines = content.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith('{'))
                    .map(line => line.replace(/^[-*•\d\.\s]+/, '').trim())
                    .filter(line => line.length > 0);
                topics = lines.slice(0, 10);
            }
        } catch (parseError) {
            // If JSON parsing fails, extract topics from text
            const cleanContent = content.replace(/```json\s*|\s*```/g, '').replace(/^#+\s+.*$/gm, '').trim();
            const lines = cleanContent.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => line.replace(/^[-*•\d\.\s]+/, '').trim())
                .filter(line => line.length > 0);
            topics = lines.slice(0, 10);
        }

        // Ensure topics is an array and has content
        if (Array.isArray(topics) && topics.length > 0) {
            dispatch({ type: 'SET_SIDEBAR_TRENDING', payload: topics.slice(0, 10) });
        } else {
            throw new Error('No valid topics found in response');
        }
    } catch (error) {
        logDebug(`Error fetching sidebar trending: ${error}`, "error");
        // Fallback to location-based default topics
        const countryCode = await getUserCountryCode();
        const fallbackTopics = getLocationBasedTrendingTopics(countryCode);
        dispatch({
            type: 'SET_SIDEBAR_TRENDING', payload: fallbackTopics
        });
    } finally {
        dispatch({ type: 'SET_SIDEBAR_TRENDING_LOADING', payload: false });
    }
};

// Fetch sidebar trending on mount
useEffect(() => {
    fetchSidebarTrending();

    if (YOUTUBE_API_KEY === "YOUR_YOUTUBE_API_KEY" || OPENAI_API_KEY === "YOUR_OPENAI_API_KEY") {
        dispatch({ type: 'SET_API_KEY_WARNING', payload: true });
    }
}, []);

// Close sidebar when video is opened
useEffect(() => {
    if (modalVisible && sidebarVisible) {
        dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: false });
    }
}, [modalVisible, sidebarVisible]);

// Handle click on sidebar trending topic
const handleSidebarTrendingClick = async (topic: string) => {
    console.log("Trending topic clicked:", topic);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: topic });

    // Collapse the trending sidebar after clicking a topic
    dispatch({ type: 'SET_SIDEBAR_VISIBLE', payload: false });

    await searchVideos(topic);
};

// Prevent background scroll when modal is open
useEffect(() => {
    if (modalVisible) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => {
        document.body.style.overflow = 'auto';
    };
}, [modalVisible]);

if (apiKeyWarning) {
    return (
        <div style= {{
        padding: '20px',
            textAlign: 'center',
                backgroundColor: '#fff3cd',
                    border: '1px solid #ffeaa7',
                        borderRadius: '8px',
                            margin: '20px',
                                fontFamily: 'Arial, sans-serif'
    }
}>
    <h2 style={ { color: '#856404' } }> API Key Warning </h2>
        < p style = {{ color: '#856404', marginBottom: '20px' }}>
            Your API keys are exposed on the client - side.This is a security risk.Please move your API calls to a backend server to protect your keys.
                </p>
                </div>
        );
    }

return (
    <>

    <div
                style= {{
    minHeight: '100vh',
        display: 'flex',
            flexDirection: 'column',
                backgroundColor: 'var(--color-bg)',
                    position: 'relative',
                        width: '100%',
                            maxWidth: '100vw',
                                overflowX: 'hidden'
}}
onTouchStart = {(e) => {
    // Touch handling for main content (sidebar now uses native scrolling)
}}
onTouchMove = {(e) => {
    // Touch handling for main content (sidebar now uses native scrolling)
}}
onTouchEnd = {(e) => {
    // Touch handling for main content (sidebar now uses native scrolling)
}}
            >
    { renderError() }
{/* Header and Search Bar Container */ }
<div
                    className="header-wrapper"
ref = { headerRef }
style = {{
    position: 'fixed',
        top: 0,
            left: 0,
                right: 0,
                    zIndex: 500,
                        backgroundColor: 'var(--color-surface)',
                            height: windowWidth <= 768 ? 'auto' : '164px',
                                minHeight: windowWidth <= 768 ? 'auto' : '164px',
                                    transition: 'height 0.3s ease-in-out',
}}
                >
    {/* Header */ }
    < div className = "header-container" style = {{
    padding: windowWidth <= 768 ? "4px 15px" : "10px 15px",
        backgroundColor: 'var(--color-surface)',
            width: '100%',
                height: windowWidth <= 768 ? 'auto' : '164px',
                    minHeight: windowWidth <= 768 ? 'auto' : '164px',
                        display: 'flex',
                            flexDirection: windowWidth <= 768 ? 'column' : 'row',
                                alignItems: 'center',
                                    justifyContent: windowWidth <= 768 ? 'center' : 'space-between',
                                        position: 'relative',
                                            boxSizing: 'border-box',
                                                gap: windowWidth <= 768 ? '4px' : '15px',
}}>
    {/* Title */ }
{
    (() => {
        // Use Parcel 2's recommended approach for static assets
        let logoUrl: string;
        try {
            // Try using new URL() with import.meta.url (Parcel 2 way)
            // @ts-ignore - import.meta.url is supported in Parcel 2
            logoUrl = new URL("./algorythm-modern.png", import.meta.url).href;
        } catch (e) {
            // Fallback: use the hashed filename from dist
            // Parcel will replace this during build
            logoUrl = "/algorythm-modern.png";
        }

        return (
            <img
                                    src= { logoUrl }
        alt = "Algorythm"
        loading = "eager"
        style = {{
            height: windowWidth <= 768 ? "104px" : "207px",
                width: "auto",
                    margin: windowWidth <= 768 ? "20px 0 10px 0" : "10px 0 0 0",
                        flexShrink: 0,
                            order: 1,
                                objectFit: "contain",
                                    display: "block",
                                        WebkitBackgroundClip: "unset",
                                            WebkitTextFillColor: "unset",
                                                background: "none",
                                                    textShadow: "none",
        }
    }
                                />
                            );
}) ()}

{/* Search and buttons container */ }
<div style={
    {
        display: windowWidth <= 768 ? 'grid' : 'flex',
            gridTemplateColumns: windowWidth <= 768 ? '1fr auto 1fr' : 'none',
                alignItems: 'center',
                    justifyContent: windowWidth <= 768 ? 'center' : 'flex-start',
                        width: '100%',
                            gap: windowWidth <= 768 ? '12px' : '15px',
                                order: 2,
                                    position: 'relative',
                                        marginTop: windowWidth <= 768 ? '-14px' : '-20px',
                                            marginBottom: windowWidth <= 768 ? '0' : '0',}
}>
    {/* Left spacer for mobile grid */ }
{
    windowWidth <= 768 && (
        <div style={ { display: 'flex', justifyContent: 'flex-start' } }>
            {/* Empty left column */ }
            </div>
                            )
}

{/* Search Bar with History Dropdown */ }
<div style={ { position: 'relative', flex: windowWidth <= 768 ? '0 0 auto' : '1', width: windowWidth <= 768 ? '240px' : 'auto', maxWidth: windowWidth <= 768 ? '240px' : '400px' } }>
    <input
                                    id="search-input"
type = "text"
placeholder = "Search videos..."
value = { isAuthenticated? searchQuery: "" }
onChange = { isAuthenticated? handleSearchChange: undefined }
onFocus = {() => user && searchHistory.length > 0 && setShowSearchHistory(true)}
onBlur = {() => setTimeout(() => setShowSearchHistory(false), 200)}
onKeyDown = { isAuthenticated?(e) => {
    if (e.key === 'Enter' && !isLoading) {
        handleSearchSubmit();
        setShowSearchHistory(false);
    }
} : undefined}
disabled = {!isAuthenticated}
style = {{
    width: '100%',
        padding: windowWidth <= 768 ? "8px 12px" : "8px 12px",
            border: `1px solid ${isAuthenticated ? '#774caf' : '#ccc'}`,
                borderRadius: "8px",
                    fontSize: windowWidth <= 768 ? "14px" : "16px",
                        backgroundColor: isAuthenticated ? 'white' : '#f5f5f5',
                            color: isAuthenticated ? 'black' : '#666',
                                cursor: isAuthenticated ? 'text' : 'not-allowed',
                                    margin: windowWidth <= 768 ? '0' : '0',
                                        height: windowWidth <= 768 ? '36px' : '36px',
                                            boxSizing: 'border-box',
                                                transition: 'all 0.2s ease',
                                                    boxShadow: showSearchHistory ? '0 4px 12px rgba(119, 76, 175, 0.15)' : 'none',
}}
                                />
{/* Search History Dropdown */ }
{
    showSearchHistory && user && searchHistory.length > 0 && (
        <div style={
        {
            position: 'absolute',
                top: '100%',
                    left: 0,
                        right: 0,
                            marginTop: '4px',
                                backgroundColor: 'white',
                                    borderRadius: '12px',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                            border: '1px solid rgba(119, 76, 175, 0.2)',
                                                maxHeight: '300px',
                                                    overflowY: 'auto',
                                                        zIndex: 1000,
                                                            animation: 'slideDown 0.3s ease-out',}
    }>
        <div style={ { padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: '12px', fontWeight: '600', color: '#666' } }>
            Recent Searches
                </div>
    {
        searchHistory.map((item, idx) => (
            <div
                                                key= { idx }
                                                onClick = {() => {
            dispatch({ type: 'SET_SEARCH_QUERY', payload: item.query,
        });
        searchVideos(item.query);
        setShowSearchHistory(false);
    }
}
style = {{
    padding: '12px 16px',
        cursor: 'pointer',
            borderBottom: idx < searchHistory.length - 1 ? '1px solid #f5f5f5' : 'none',
                transition: 'background-color 0.2s ease',
                    display: 'flex',
                        alignItems: 'center',
                            gap: '12px',
}}
onMouseEnter = {(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
onMouseLeave = {(e) => e.currentTarget.style.backgroundColor = 'white'}
                                            >
    <svg width="16" height = "16" viewBox = "0 0 24 24" fill = "none" stroke = "#999" strokeWidth = "2" >
        <circle cx="11" cy = "11" r = "8" />
            <path d="m21 21-4.35-4.35" />
                </svg>
                < span style = {{ flex: 1, fontSize: '14px', color: '#333' }}> { item.query } </span>
                    </div>
                                        ))}
</div>
                                )}
</div>

{/* Header buttons */ }
<div className="header-icons-container" style = {{
    display: 'flex',
        alignItems: 'center',
            gap: windowWidth <= 768 ? '5px' : '8px',
                flexShrink: 0,
                    justifySelf: windowWidth <= 768 ? 'flex-end' : 'auto',
}}>
    {/* Search toggle button removed - search bar is always visible */ }
{/* Trending Sidebar Toggle Button */ }
<button
                                    onClick={ toggleTrendingSidebar }
style = {{
    background: sidebarVisible ? 'linear-gradient(135deg, #4a90e2 0%, #774caf 100%)'
        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: sidebarVisible ? '2px solid #4a90e2'
            : '2px solid #dee2e6',
            cursor: 'pointer',
                padding: windowWidth <= 768 ? '4px' : '8px',
                    borderRadius: '8px',
                        display: 'flex',
                            alignItems: 'center',
                                justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: sidebarVisible ? '0 2px 8px rgba(74, 144, 226, 0.3)'
                                            : '0 1px 4px rgba(0, 0, 0, 0.1)',
                                            minWidth: windowWidth <= 768 ? '28px' : '36px',
                                                minHeight: windowWidth <= 768 ? '28px' : '36px',
}}
onMouseEnter = {(e) => {
    e.currentTarget.style.background = sidebarVisible
        ? 'linear-gradient(135deg, #357abd 0%, #6a3d9e 100%)'
        : 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)';
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.boxShadow = sidebarVisible
        ? '0 6px 16px rgba(74, 144, 226, 0.4)'
        : '0 4px 12px rgba(0, 0, 0, 0.15)';
}}
onMouseLeave = {(e) => {
    e.currentTarget.style.background = sidebarVisible
        ? 'linear-gradient(135deg, #4a90e2 0%, #774caf 100%)'
        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = sidebarVisible
        ? '0 4px 12px rgba(74, 144, 226, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.1)';
}}
title = "Toggle Trending Reels Sidebar"
    >
    <svg
                                        width="20"
height = "20"
viewBox = "0 0 24 24"
fill = "none"
stroke = { sidebarVisible? "#ffffff": "#774caf" }
strokeWidth = "2.5"
strokeLinecap = "round"
strokeLinejoin = "round"
style = {{
    transition: 'all 0.3s ease-in-out',
        filter: sidebarVisible ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none'
}}
                                    >
    {/* Purple star icon */ }
    < path d = "M12 2L15.09 8.26L22 9L16.91 13.74L18.18 20.02L12 17.77L5.82 20.02L7.09 13.74L2 9L8.91 8.26L12 2Z" />
        </svg>
        </button>
{/* Theme Toggle */ }
<button
                                    onClick={ toggleTheme }
style = {{
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '2px solid #dee2e6',
            cursor: 'pointer',
                padding: windowWidth <= 768 ? '4px' : '8px',
                    borderRadius: '8px',
                        display: 'flex',
                            alignItems: 'center',
                                justifyContent: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                                            minWidth: windowWidth <= 768 ? '28px' : '36px',
                                                minHeight: windowWidth <= 768 ? '28px' : '36px',
}}
onMouseEnter = {(e) => {
    e.currentTarget.style.background = 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)';
    e.currentTarget.style.transform = 'scale(1.05)';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
}}
onMouseLeave = {(e) => {
    e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
}}
title = {`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} mode`}
                                >
    <svg
                                        width="20"
height = "20"
viewBox = "0 0 24 24"
fill = "none"
stroke = "#774caf"
strokeWidth = "2.5"
strokeLinecap = "round"
strokeLinejoin = "round"
style = {{
    transition: 'all 0.3s ease-in-out',
}}
                                    >
    { themeMode === 'light' ? (
    <>
    {/* Moon icon for light mode (shows what you can switch to) */ }
    < path d = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </>
                                        ) : (
    <>
    {/* Sun icon for dark mode (shows what you can switch to) */ }
    < circle cx = "12" cy = "12" r = "5" />
        <line x1="12" y1 = "1" x2 = "12" y2 = "3" />
            <line x1="12" y1 = "21" x2 = "12" y2 = "23" />
                <line x1="4.22" y1 = "4.22" x2 = "5.64" y2 = "5.64" />
                    <line x1="18.36" y1 = "18.36" x2 = "19.78" y2 = "19.78" />
                        <line x1="1" y1 = "12" x2 = "3" y2 = "12" />
                            <line x1="21" y1 = "12" x2 = "23" y2 = "12" />
                                <line x1="4.22" y1 = "19.78" x2 = "5.64" y2 = "18.36" />
                                    <line x1="18.36" y1 = "5.64" x2 = "19.78" y2 = "4.22" />
                                        </>
                                        )}
</svg>
    </button>

{/* Logout button removed - no authentication required */ }
</div>
    </div>
    </div>

{/* Search bar is now always visible inline with header */ }

{/* Trending Topics Display */ }
{ renderTrendingTopics() }

{/* TikTok-Style Trending Sidebar */ }
{ renderTrendingSidebar() }

{/* Main Content Container - always visible */ }
<div
                className={ `main-content${modalVisible ? ' hide-on-mobile' : ''}` }
style = {{
    position: 'fixed',
        top: windowWidth <= 768 ? `${headerHeight}px` : '164px',
            left: modalVisible ? '0' : (sidebarVisible ? 'min(280px, 25%)' : '0'),
                right: 0,
                    bottom: 0,
                        padding: windowWidth <= 768 ? '0' : '0',
                            display: 'flex',
                                flexDirection: 'column',
                                    overflowY: 'auto',
                                        backgroundColor: 'var(--color-bg)',
                                            transition: 'left 0.3s ease-in-out'
}}
ref = { windowWidth <= 768 ? mobileScrollRef : desktopScrollRef}
            >
    { renderError() }
{
    isLoading && (
        <div style={ { padding: '20px', textAlign: 'center' } }> Loading...</div>
                )
}
{
    !isLoading && videoItems.length === 0 && (
        <div style={ { padding: '20px', textAlign: 'center' } }> No videos found.</div>
                )
}
<div style={
    {
        display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
                    padding: '16px'
    }
}>
{
    videoItems.map((item, idx) => (
        <div
                            key= { `${item.id.videoId}-${idx}` }
onClick = {() => openModal(
    item.id.videoId,
    'youtube',
    item.snippet.title,
    item.snippet.description,
    item.snippet.channelTitle,
    item.snippet.publishedAt
)}
style = {{
    backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
            overflow: 'hidden',
                cursor: 'pointer',
                    border: '1px solid var(--color-border)'
}}
                        >
    <img
                                src={ item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url }
alt = { item.snippet.title }
style = {{ width: '100%', height: '140px', objectFit: 'cover' }}
                            />
    < div style = {{ padding: '12px' }}>
        <h3 style={ { margin: '0 0 6px', fontSize: '14px', lineHeight: '1.3' } }>
            { item.snippet.title }
            </h3>
            < p style = {{ margin: 0, fontSize: '12px', color: 'var(--color-muted-text)' }}>
                { item.snippet.channelTitle }
                </p>
                </div>
                </div>
                    ))}
</div>
    </div>

{/* Modal - Moved outside main content container for proper viewport coverage */ }
{
    modalVisible && selectedVideoId && (
        <div
                    id="videoModal"
    className = "video-modal"
    style = {{
        position: 'fixed',
            backgroundColor: isMobileMode ? 'rgba(0, 0, 0, 0.95)' : 'var(--color-backdrop)',
                display: 'flex',
                    flexDirection: 'column',
                        alignItems: 'center',
                            justifyContent: 'center',
                                zIndex: 1000,
                                    top: 0,
                                        left: 0,
                                            right: 0,
                                                bottom: 0,
                                                    width: '100vw',
                                                        height: '100vh'
    }
}
onClick = { handleModalClick }
    >
    { renderModalContent() }
    </div>
            )}

{/* Add animations */ }
<style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideInLeft {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>
    </div>
    </div>
    </>
    );
};

export default YouTubeAPIComponent;
