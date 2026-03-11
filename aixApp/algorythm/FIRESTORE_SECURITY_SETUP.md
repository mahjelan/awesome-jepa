# Firestore Security Setup Guide

## Overview

Your app uses **Firestore** (Firebase's native NoSQL database). There are two different security models:

1. **Firestore Security Rules** (What you need) - Rules that control access from your web app
2. **IAM Principals** (Optional) - For MongoDB Compatibility API, used with MongoDB tools

## Option 1: Firestore Security Rules (Recommended for Your App)

This is what you need for your React web app. These rules control who can read/write data.

### Step 1: Create Security Rules File

Create a file `firestore.rules` in your project root:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users can only access their own data
    match /users/{userId} {
      // Allow read/write only if the user ID matches the authenticated user
      allow read, write: if isOwner(userId);
      
      // Subcollections under users (favorites, watchHistory, etc.)
      match /{subcollection=**} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Trending topics - readable by all, writable by authenticated users
    match /trendingTopics/{topicId} {
      allow read: if true; // Anyone can read trending topics
      allow write: if isAuthenticated(); // Only authenticated users can write
    }
    
    // Deny all other access by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 2: Update firebase.json

Update your `firebase.json` to include Firestore rules:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 3: Deploy Rules

Deploy the rules using Firebase CLI:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore (if not already done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Step 4: Test Rules

Test your rules in Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules tab
2. Use the Rules Playground to test different scenarios
3. Verify that:
   - Authenticated users can only access their own data
   - Unauthenticated users cannot access user data
   - Anyone can read trending topics

## Option 2: IAM Principals (For MongoDB Compatibility API)

**Note:** This is only needed if you want to use MongoDB tools to connect to Firestore. For your React web app, you don't need this.

### What is MongoDB Compatibility API?

Firestore offers a MongoDB Compatibility API that allows you to:
- Connect MongoDB tools (like MongoDB Compass, Studio 3T) to Firestore
- Use MongoDB drivers and libraries
- Migrate MongoDB applications to Firestore

### When Do You Need IAM Principals?

Only if you want to:
- Use MongoDB Compass to browse your Firestore data
- Connect external MongoDB tools
- Use MongoDB drivers instead of Firebase SDK

### Setting Up IAM Principals (Optional)

If you want to use MongoDB Compatibility API:

1. **Enable MongoDB Compatibility API:**
   - Go to Firebase Console → Firestore Database
   - Click on "MongoDB Compatibility API" tab
   - Enable the API

2. **Create IAM Service Account:**
   - Go to Google Cloud Console → IAM & Admin → Service Accounts
   - Create a new service account
   - Grant it "Cloud Datastore User" role

3. **Get Connection String:**
   - The connection string will look like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

4. **Use MongoDB Tools:**
   - Connect MongoDB Compass or other tools using the connection string
   - You can now browse Firestore data using MongoDB tools

### Important Notes:

- **You don't need IAM principals for your React app** - Your app uses Firebase SDK which handles authentication automatically
- **Firestore Security Rules still apply** - Even with MongoDB Compatibility API, security rules control access
- **IAM is for external tools** - Only needed if you want to use MongoDB-specific tools

## Recommended Setup for Your App

Since you're building a React web app, follow **Option 1** (Firestore Security Rules):

1. ✅ Create `firestore.rules` file
2. ✅ Update `firebase.json` to include rules
3. ✅ Deploy rules using Firebase CLI
4. ✅ Test rules in Firebase Console

You **don't need** IAM principals unless you specifically want to use MongoDB tools.

## Security Best Practices

1. **Always authenticate users** - Use Firebase Authentication (anonymous auth is fine)
2. **Validate user ownership** - Users should only access their own data
3. **Use helper functions** - Makes rules more maintainable
4. **Test thoroughly** - Use Rules Playground before deploying
5. **Monitor access** - Check Firebase Console logs for denied requests

## Current App Security Status

Your app currently:
- ✅ Uses Firebase Authentication (anonymous)
- ✅ Has user-specific data structure (`users/{userId}/...`)
- ⚠️ **Needs security rules** - Currently may be in test mode

**Action Required:** Set up Firestore Security Rules using Option 1 above.

## Troubleshooting

### "Permission denied" errors:
- Check that security rules are deployed
- Verify user is authenticated (`request.auth != null`)
- Check that user ID matches document path

### Rules not updating:
- Make sure you deployed: `firebase deploy --only firestore:rules`
- Wait a few seconds for propagation
- Clear browser cache

### Testing rules:
- Use Firebase Console → Rules Playground
- Test with authenticated and unauthenticated users
- Test with different user IDs

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Security Rules Playground](https://console.firebase.google.com/project/_/firestore/rules)
- [MongoDB Compatibility API Docs](https://firebase.google.com/docs/firestore/mongodb-compatibility)

