# Firebase Integration Setup Guide

> **ديوان الصوفية** — Sufi Chanting App

This guide explains how to configure Firebase for the **ديوان الصوفية** project, enabling cloud Firestore, Firebase Authentication, and optional Firebase Hosting as an alternative to the ASP.NET Core backend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create a Firebase Project](#create-a-firebase-project)
3. [Configure Environment Variables](#configure-environment-variables)
4. [Frontend Integration](#frontend-integration)
5. [Firestore Database](#firestore-database)
6. [Firebase Authentication](#firebase-authentication)
7. [Backend (C# Admin SDK)](#backend-c-admin-sdk)
8. [Deploy to Firebase Hosting](#deploy-to-firebase-hosting)
9. [Local Emulators](#local-emulators)
10. [Security Rules](#security-rules)

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- A Google account with access to [Firebase Console](https://console.firebase.google.com/)

---

## Create a Firebase Project

1. Open [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Enter a project name (e.g., `divan-sufi`) and complete the wizard.
3. In the left sidebar go to **Build → Firestore Database** and click **Create database**.
   - Choose **Start in production mode** (the `firestore.rules` file in this repo restricts access by role).
   - Select a region close to your users.
4. Go to **Build → Authentication** → **Get started** and enable the **Email/Password** provider.
5. Go to **Project Settings → General → Your apps**, click the **Web** icon (`</>`), register an app name, and copy the `firebaseConfig` snippet.

---

## Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values from the Firebase Console snippet:

```bash
cp .env.example .env
```

```dotenv
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=divan-sufi.firebaseapp.com
FIREBASE_PROJECT_ID=divan-sufi
FIREBASE_STORAGE_BUCKET=divan-sufi.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **Never commit `.env` to version control.** It is already listed in `.gitignore`.

Update the Firebase project alias in `.firebaserc`:

```json
{
  "projects": {
    "default": "divan-sufi"
  }
}
```

---

## Frontend Integration

The frontend uses the **Firebase JS SDK v10 (modular)** loaded via CDN — no build tools required.

### Using `firebase-config.js`

`frontend/js/firebase-config.js` exports the initialized `app`, `db`, and `auth` objects, plus convenience helpers for common operations.

To inject credentials at runtime (recommended for production), add a small inline script **before** loading your modules:

```html
<!-- In any HTML page, before module scripts -->
<script>
  window.__FIREBASE_API_KEY__            = 'AIza...';
  window.__FIREBASE_AUTH_DOMAIN__        = 'your-project.firebaseapp.com';
  window.__FIREBASE_PROJECT_ID__         = 'your-project';
  window.__FIREBASE_STORAGE_BUCKET__     = 'your-project.firebasestorage.app';
  window.__FIREBASE_MESSAGING_SENDER_ID__ = '123456789';
  window.__FIREBASE_APP_ID__             = '1:123456789:web:abc123';
</script>
```

Alternatively, replace the placeholder strings directly in `firebase-config.js` for local development.

### Example — Read poems in a page module

```js
import { getPoems } from '../firebase-config.js';

const poems = await getPoems({ category: 'إلهيات', pageSize: 10 });
poems.forEach(poem => console.log(poem.title));
```

### Example — Subscribe to live current poem (real-time)

```js
import { subscribeToCurrentState } from '../firebase-config.js';

const unsubscribe = subscribeToCurrentState(state => {
  if (state?.type === 'poem') {
    document.getElementById('current-poem-title').textContent = state.payload.title;
  }
});

// Call unsubscribe() when the page unmounts to stop listening.
```

---

## Firestore Database

### Data Model

| Collection      | Document fields |
|-----------------|----------------|
| `users`         | `uid`, `username`, `role` (`Munshid` \| `LeadMunshid`), `createdAt` |
| `poems`         | `title`, `text`, `maqamId`, `poetId`, `category`, `hadraSection`, `createdAt`, `updatedAt` |
| `poets`         | `name`, `bio`, `createdAt` |
| `maqamat`       | `name`, `description`, `createdAt` |
| `waslat`        | `name`, `createdBy`, `createdAt`; sub-collection `items/{itemId}` |
| `currentState`  | `live` → `{ type, payload, sharedAt }` |
| `shareHistory`  | `type`, `payload`, `sharedAt`, `sharedBy` |

### Seed data

Use the Firebase Console **Firestore** tab or the Admin SDK to import initial data.
A sample seed script for Node.js:

```js
// scripts/seed-firestore.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

await db.collection('poets').add({ name: 'ابن عربي', bio: 'شيخ الأكبر', createdAt: FieldValue.serverTimestamp() });
console.log('Seeded successfully');
```

---

## Firebase Authentication

The app uses **Email/Password** authentication.

### Sign in example

```js
import { signIn, onAuthChange } from './firebase-config.js';

// Listen to auth state
onAuthChange(user => {
  if (user) {
    console.log('Signed in as', user.email);
  } else {
    window.location.href = '/login.html';
  }
});

// Sign in
try {
  const user = await signIn('ahmad@example.com', 'password123');
  console.log('Welcome', user.email);
} catch (err) {
  console.error('Login failed:', err.message);
}
```

### Creating users

Create users through the Firebase Console (**Authentication → Users → Add user**), or programmatically via the Admin SDK (see [Backend section](#backend-c-admin-sdk)).

---

## Backend (C# Admin SDK)

The ASP.NET Core backend can interact with Firebase using the [Firebase Admin .NET SDK](https://github.com/firebase/firebase-admin-dotnet).

### Install the NuGet package

```bash
cd src/DivanSufi.WebApi
dotnet add package FirebaseAdmin
```

### Initialize the Admin SDK

```csharp
// Program.cs or a dedicated Firebase setup class
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

FirebaseApp.Create(new AppOptions
{
    Credential = GoogleCredential.FromFile(
        builder.Configuration["Firebase:CredentialFile"]
        ?? "serviceAccountKey.json"),
    ProjectId = builder.Configuration["Firebase:ProjectId"],
});
```

Add to `appsettings.json` (do **not** commit the actual key file):

```json
{
  "Firebase": {
    "ProjectId": "your-project-id",
    "CredentialFile": "serviceAccountKey.json"
  }
}
```

### Verify ID tokens from the frontend

```csharp
using FirebaseAdmin.Auth;

// In an API controller or middleware:
var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);
string uid = decoded.Uid;
```

> **Security**: Keep `serviceAccountKey.json` out of version control.
> It is already excluded in `.gitignore`.

---

## Deploy to Firebase Hosting

Firebase Hosting can serve the `frontend/` directory as a static site.

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Log in
firebase login

# Deploy everything (hosting + firestore rules)
npm run firebase:deploy

# Deploy hosting only
npm run firebase:deploy:hosting
```

---

## Local Emulators

Use the Firebase Emulator Suite for local development without touching production data:

```bash
# Install dependencies
npm install

# Start all emulators (auth, firestore, hosting)
npm run firebase:emulators
```

Emulator ports (configured in `firebase.json`):

| Emulator  | Port |
|-----------|------|
| Auth      | 9099 |
| Firestore | 8080 |
| Hosting   | 5001 |
| UI        | 4000 |

Open [http://localhost:4000](http://localhost:4000) to view the Emulator UI.

Connect the frontend to emulators by adding this before calling any Firebase SDK methods:

```js
import { connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { db, auth } from './firebase-config.js';

if (location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

---

## Security Rules

`firestore.rules` defines access control aligned with the app's role model:

| Operation            | Munshid | LeadMunshid |
|----------------------|---------|-------------|
| Read poems/poets/maqamat | ✅  | ✅         |
| Create/Edit/Delete poems  | ❌  | ✅         |
| Manage waslat             | ❌  | ✅         |
| Share current state       | ❌  | ✅         |
| Read share history        | ✅  | ✅         |

Deploy rules with:

```bash
npm run firebase:deploy:firestore
```

---

## Summary of New Files

| File | Purpose |
|------|---------|
| `.env.example` | Template for Firebase credentials |
| `.gitignore` | Updated to exclude `.env` and service account keys |
| `firebase.json` | Firebase project configuration (hosting, firestore, emulators) |
| `.firebaserc` | Firebase project alias |
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Firestore composite indexes |
| `frontend/js/firebase-config.js` | Firebase JS SDK initialization + helper functions |
| `package.json` | npm scripts and Firebase dependency declarations |
| `FIREBASE_SETUP.md` | This setup guide |
