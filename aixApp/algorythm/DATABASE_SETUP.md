# Database Setup Guide

## Option 1: Firebase Firestore (Recommended - Already Using Firebase)

### Setup Steps:

1. **Install Firebase SDK:**
   ```bash
   npm install firebase
   ```

2. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Follow the setup wizard

3. **Enable Firestore:**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create Database"
   - Start in "Test Mode" for development (you can secure it later)
   - Choose a location close to your users

4. **Get Your Config:**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the web icon (`</>`)
   - Copy the `firebaseConfig` object
   - Paste it into `src/firebase.ts`

5. **Update `src/firebase.ts`:**
   Replace the placeholder values with your actual Firebase config.

### Usage Example:
```typescript
import { saveVideo, getVideos } from './database';

// Save a video
const videoId = await saveVideo({
  title: 'My Video',
  channelTitle: 'My Channel',
  videoId: 'abc123'
});

// Get all videos
const videos = await getVideos();
```

---

## Option 2: Supabase (PostgreSQL)

### Setup Steps:

1. **Install Supabase:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for free
   - Create a new project

3. **Get Your Credentials:**
   - Go to Project Settings → API
   - Copy "Project URL" and "anon public" key
   - Update `src/supabase-example.ts` with these values

4. **Create Tables:**
   - Go to SQL Editor in Supabase dashboard
   - Create your tables (example for videos):
   ```sql
   CREATE TABLE videos (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     channel_title TEXT,
     video_id TEXT UNIQUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

---

## Option 3: MongoDB Atlas

### Setup Steps:

1. **Install MongoDB:**
   ```bash
   npm install mongodb
   ```

2. **Create MongoDB Atlas Account:**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free
   - Create a free cluster (M0)

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Create Connection File:**
   ```typescript
   import { MongoClient } from 'mongodb';
   
   const uri = 'YOUR_MONGODB_CONNECTION_STRING';
   const client = new MongoClient(uri);
   
   export const connectDB = async () => {
     await client.connect();
     return client.db('algorythm');
   };
   ```

---

## Comparison

| Feature | Firebase | Supabase | MongoDB Atlas |
|---------|----------|----------|---------------|
| **Database Type** | NoSQL (Firestore) | PostgreSQL (SQL) | NoSQL (MongoDB) |
| **Free Tier** | 50K reads/day | 500MB storage | 512MB storage |
| **Real-time** | ✅ Built-in | ✅ Built-in | ❌ Requires setup |
| **Auth** | ✅ Built-in | ✅ Built-in | ❌ Separate service |
| **Best For** | Quick setup, real-time apps | SQL queries, relational data | Complex document structures |

---

## Recommendation

Since you're already using Firebase for hosting, **Firebase Firestore** is the easiest option:
- ✅ Already configured
- ✅ No additional services needed
- ✅ Great React integration
- ✅ Real-time updates out of the box
- ✅ Generous free tier

