# Example for React FirebaseUI PRO — AI-X
React 19 + TypeScript + Vite. **AI-X** combines AI-powered search (ask anything, get answers) with a personal feed: save discoveries to your feed and post your own updates.

## Getting started

```shell
npm install
npm run dev
```

### AI search (Discover)
Set `VITE_OPENAI_API_KEY` in a `.env` file (and optionally `VITE_OPENAI_MODEL`, default `gpt-4o-mini`) to enable the “Ask anything” search. Without it, search will show an error when you submit a query.

### Fix "Missing or insufficient permissions"

This app uses Firestore for login/register and for **user data** (text, numbers, media URLs). You must allow access:

**Firestore:**  
1. Open [Firebase Console](https://console.firebase.google.com) → your project → **Build** → **Firestore Database** → **Rules**.  
2. Replace the rules with the contents of `firestore.rules` in this folder, then click **Publish**.

**Storage (for media uploads):**  
1. In Firebase Console → **Build** → **Storage** → **Rules**.  
2. Replace with the contents of `storage.rules` in this folder, then click **Publish**.

> For production, restrict access (e.g. use a backend to handle auth and limit what the client can read/write).

<img src="../../../src/assets/firebaseAuthUI-icon.png" alt="Style with className='firebaseui-icon'" width="80%" />

> Style with className="firebaseui-icon"

<img src="../../../src/assets/firebaseAuthUI-icon-round.png" alt="Style with className='firebaseui-icon round'" width="80%" />

> Style with className="firebaseui-icon round"

## License

[MIT](https://opensource.org/licenses/MIT)
