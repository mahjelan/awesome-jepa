# Enable Firestore Native API

## Error Message
```
Firestore API data access is disabled. Please enable it if you want to access the database through Firestore API.
```

## Problem
Your Firestore database has **MongoDB Compatibility API** enabled, but the **Firestore Native API** is disabled. The app uses the Firestore Native API (not MongoDB), so you need to enable it.

## Solution: Enable Firestore Native API

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **algorythms-3aaac**

### Step 2: Navigate to Firestore Database
1. Click on **Firestore Database** in the left sidebar
2. You should see your database `algorythmdb`

### Step 3: Enable Firestore Native API
1. Look for **"API Access"** or **"Data Access"** settings
2. You may see tabs like:
   - **Native API** (Firestore)
   - **MongoDB Compatibility API**
3. **Enable the Native API** (Firestore API)
4. You can keep MongoDB Compatibility API enabled or disabled - it doesn't matter for your app

### Alternative: Check Google Cloud Console
If you don't see the option in Firebase Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **algorythms-3aaac**
3. Navigate to **Firestore** → **Databases**
4. Click on your database: **algorythmdb**
5. Look for **"API Access"** or **"Data Access"** section
6. Enable **"Firestore Native API"** or **"Firestore API"**

### Step 4: Verify
After enabling:
1. Refresh your app
2. The errors should stop
3. Firebase features should work correctly

## Important Notes

- **MongoDB Compatibility API** and **Firestore Native API** are separate
- Your app uses **Firestore Native API** (the standard Firebase SDK)
- You can have both enabled if you want to use MongoDB tools
- The app will automatically fall back to localStorage if Firestore is unavailable

## Troubleshooting

If you still see errors after enabling:

1. **Wait a few minutes** - API changes can take time to propagate
2. **Check API is enabled** - Verify in both Firebase Console and Google Cloud Console
3. **Check database name** - Make sure `algorythmdb` exists and is accessible
4. **Check permissions** - Ensure your Firebase project has proper permissions

## Current Status

Your app will:
- ✅ Work with localStorage fallback (already implemented)
- ✅ Automatically use Firestore when API is enabled
- ✅ Show errors in console but continue functioning

Once you enable the Firestore Native API, all Firebase features will work seamlessly!

