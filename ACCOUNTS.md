# Turning on accounts

Locktober works without accounts: each person's goals and check-ins save on their own device. Turn on accounts and people can sign in with Google or email, and their goals and check-ins follow them to any phone or laptop.

Accounts use **Firebase**, Google's free service for sign-in and storage. The free plan covers far more than a college ministry will use. Setup takes about 10 minutes and you only do it once.

## 1. Create a Firebase project
1. Go to https://console.firebase.google.com and sign in with a Google account. Use one you and your friend can both get into.
2. Click **Create a project** (or **Add project**) and name it something like `locktober`. You can turn Google Analytics off.

## 2. Turn on sign-in
1. In the left menu, open **Build → Authentication** and click **Get started**.
2. On the **Sign-in method** tab, enable **Google**: pick a support email and save.
3. Enable **Email/Password** too (just the first switch) and save. This one matters because Google sign-in doesn't work inside the Instagram app's browser.
4. Open the **Settings** tab → **Authorized domains** → **Add domain**, and add `jack-norby.github.io`.

## 3. Create the database
1. In the left menu, open **Build → Firestore Database** and click **Create database**.
2. Pick a location near you (for Iowa, `us-central1`) and choose **Start in production mode**.
3. Open the **Rules** tab, replace everything with the rules below and click **Publish**. They make sure each person can only ever read and write their own data.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4. Connect the website
1. Click the **gear icon → Project settings**. Under **Your apps**, click the **`</>`** (web) button.
2. Give it a nickname like `locktober-web`, skip Firebase Hosting, and click **Register app**.
3. Firebase shows a block of code containing `const firebaseConfig = { ... }`. Copy just the part in curly braces.
4. Open `firebase-config.js` in this repo (on GitHub: click the file, then the pencil icon). Replace `null` in the last line with what you copied, so it looks like this:

```js
window.LOCKTOBER_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "locktober-xxxx.firebaseapp.com",
  projectId: "locktober-xxxx",
  storageBucket: "locktober-xxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

5. Commit. A minute later a **Sign in** button appears in the site's header.

These config values are not secret. Every Firebase website publishes them, and the database rules from step 3 are what keep everyone's data private.

## How it works
- Signing in saves that person's goals and check-ins to their account. If they already had check-ins on that device, those get combined with their account.
- Changes save automatically and show up on their other devices.
- Signing out removes Locktober from that device (handy on shared computers). The data stays in their account.
- You can see who has signed up under **Authentication → Users**, and each person's saved data under **Firestore Database** (one document per person, in `users`).

## Privacy
Signing in collects each person's email address, and only you two (the Firebase project owners) can see it. Don't use it for anything else, and delete someone's account in the Firebase console if they ask.
