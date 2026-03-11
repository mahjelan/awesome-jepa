# Firebase Database Enhancements

This document outlines all the Firebase database enhancements added to the Algorythm app.

## Features Implemented

### 1. Firebase Authentication
- **Anonymous Authentication**: Users are automatically signed in anonymously when they visit the app
- **User State Management**: Real-time user state tracking with Firebase Auth
- **Seamless Integration**: Works alongside existing Google OAuth authentication

### 2. Favorites/Bookmarks System
- **Save Videos**: Users can save videos to their favorites collection
- **Real-time Updates**: Favorites sync in real-time across devices
- **Persistent Storage**: Favorites are stored in Firestore under `users/{userId}/favorites`
- **Functions Available**:
  - `addToFavorites()` - Add a video to favorites
  - `removeFromFavorites()` - Remove a video from favorites
  - `getFavorites()` - Get all user favorites
  - `isFavorite()` - Check if a video is favorited
  - `subscribeToFavorites()` - Real-time subscription to favorites changes

### 3. Watch History
- **Automatic Tracking**: Videos are automatically added to watch history when opened
- **Persistent Storage**: Watch history stored in `users/{userId}/watchHistory`
- **Functions Available**:
  - `addToWatchHistory()` - Add video to watch history
  - `getWatchHistory()` - Get user's watch history (with limit)
  - `clearWatchHistory()` - Clear all watch history

### 4. Search History
- **Query Tracking**: All search queries are saved to Firebase
- **Trending Topics**: Search queries contribute to trending topics
- **Functions Available**:
  - `saveSearchQuery()` - Save a search query
  - `getSearchHistory()` - Get user's search history
  - `clearSearchHistory()` - Clear search history

### 5. User Preferences
- **Theme Sync**: Theme preferences (light/dark) sync to Firebase
- **Cross-Device Sync**: Preferences sync across all user devices
- **Real-time Updates**: Preferences update in real-time
- **Functions Available**:
  - `saveUserPreferences()` - Save user preferences
  - `getUserPreferences()` - Get user preferences
  - `subscribeToPreferences()` - Real-time subscription to preferences

### 6. Playlists/Collections
- **Create Playlists**: Users can create custom playlists
- **Add Videos**: Add videos to playlists
- **Manage Playlists**: Full CRUD operations for playlists
- **Functions Available**:
  - `createPlaylist()` - Create a new playlist
  - `getPlaylists()` - Get all user playlists
  - `addVideoToPlaylist()` - Add video to playlist
  - `removeVideoFromPlaylist()` - Remove video from playlist
  - `deletePlaylist()` - Delete a playlist

### 7. Real-time Trending Topics
- **Automatic Updates**: Trending topics update in real-time
- **Search-Based**: Topics are generated from search queries
- **Global Trends**: Shared trending topics across all users
- **Functions Available**:
  - `subscribeToTrendingTopics()` - Real-time subscription to trending topics
  - `updateTrendingTopic()` - Update trending topic count

### 8. User Statistics
- **Usage Tracking**: Track user statistics and usage patterns
- **Functions Available**:
  - `getUserStats()` - Get user statistics
  - `updateUserStats()` - Update user statistics

## Database Structure

```
users/
  {userId}/
    favorites/
      {videoId}/
        - videoId
        - title
        - channelTitle
        - thumbnail
        - addedAt
    watchHistory/
      {videoId}/
        - videoId
        - title
        - channelTitle
        - thumbnail
        - watchedAt
        - watchDuration
        - completed
    searchHistory/
      {query}/
        - query
        - searchedAt
        - resultCount
    playlists/
      {playlistId}/
        - name
        - description
        - videos[]
        - createdAt
        - updatedAt
        - isPublic
    preferences/
      settings/
        - themeMode
        - autoplay
        - defaultVolume
        - videoQuality
        - notificationsEnabled
        - language
        - updatedAt
    stats/
      summary/
        - totalVideosWatched
        - totalWatchTime
        - favoriteChannels[]
        - mostWatchedCategory

trendingTopics/
  {topic}/
    - topic
    - count
    - lastUpdated
```

## Integration Points

### Component Integration
- **YouTubeAPIComponent.tsx**: Main component with Firebase hooks integration
- **firebase-hooks.ts**: Custom React hooks for Firebase features
- **database.ts**: All Firebase database functions

### Key Integration Points:
1. **Search**: Search queries are automatically saved to Firebase
2. **Video Opening**: Videos are automatically added to watch history
3. **Theme Changes**: Theme preferences sync to Firebase
4. **Trending Topics**: Real-time updates from Firebase

## Usage Examples

### Adding a Video to Favorites
```typescript
import { addToFavorites } from './database';

await addToFavorites({
    videoId: 'abc123',
    title: 'Video Title',
    channelTitle: 'Channel Name',
    thumbnail: 'https://...'
});
```

### Getting User Preferences
```typescript
import { getUserPreferences } from './database';

const preferences = await getUserPreferences();
if (preferences?.themeMode) {
    // Apply theme
}
```

### Subscribing to Real-time Updates
```typescript
import { subscribeToFavorites } from './database';

const unsubscribe = subscribeToFavorites((favorites) => {
    console.log('Favorites updated:', favorites);
});

// Later, to unsubscribe:
unsubscribe();
```

## Security Rules

Make sure to set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Trending topics are readable by all, writable by authenticated users
    match /trendingTopics/{topic} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Benefits

1. **Cross-Device Sync**: All user data syncs across devices
2. **Real-time Updates**: Changes reflect immediately
3. **Offline Support**: Firebase provides offline persistence
4. **Scalability**: Firebase handles scaling automatically
5. **Analytics**: Built-in analytics and monitoring
6. **Security**: Firebase handles authentication and authorization

## Next Steps

To fully utilize these features:
1. Set up Firestore security rules in Firebase Console
2. Enable anonymous authentication in Firebase Console
3. Configure Firestore indexes if needed for complex queries
4. Add UI components for favorites, playlists, and history
5. Implement user statistics dashboard

## Notes

- Anonymous authentication is used by default for seamless user experience
- All Firebase operations are non-blocking and won't break the app if they fail
- Search history and watch history are saved silently in the background
- Preferences sync automatically when changed

