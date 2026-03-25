/**
 * Firebase Client Initialization — ديوان الصوفية
 *
 * Loads Firebase configuration from meta tags injected by the backend,
 * or falls back to environment-specific defaults for local development.
 *
 * Usage (in any page module):
 *   import { db, auth, app } from './firebase-config.js';
 *
 * Firebase SDK is loaded via CDN — no build step required.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ---------------------------------------------------------------------------
// Configuration
// Replace the placeholder values below with your actual Firebase project
// credentials from:
//   Firebase Console → Project Settings → General → Your apps → Web app
//
// For production, inject these via server-side rendering or a build step
// rather than hard-coding them here.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            window.__FIREBASE_API_KEY__            || 'YOUR_API_KEY',
  authDomain:        window.__FIREBASE_AUTH_DOMAIN__        || 'your-project-id.firebaseapp.com',
  projectId:         window.__FIREBASE_PROJECT_ID__         || 'your-project-id',
  storageBucket:     window.__FIREBASE_STORAGE_BUCKET__     || 'your-project-id.firebasestorage.app',
  messagingSenderId: window.__FIREBASE_MESSAGING_SENDER_ID__ || 'YOUR_SENDER_ID',
  appId:             window.__FIREBASE_APP_ID__             || 'YOUR_APP_ID',
  measurementId:     window.__FIREBASE_MEASUREMENT_ID__     || 'G-XXXXXXXXXX',
};

// ---------------------------------------------------------------------------
// Initialize Firebase
// ---------------------------------------------------------------------------
export const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);

// ---------------------------------------------------------------------------
// Firestore helpers — Poems
// ---------------------------------------------------------------------------

/** Fetch a paginated list of poems with optional filters */
export async function getPoems({ maqamId, poetId, category, searchText, pageSize = 20 } = {}) {
  let q = collection(db, 'poems');
  const constraints = [orderBy('title')];

  if (maqamId)  constraints.push(where('maqamId',  '==', maqamId));
  if (poetId)   constraints.push(where('poetId',   '==', poetId));
  if (category) constraints.push(where('category', '==', category));
  if (pageSize) constraints.push(limit(pageSize));

  const snapshot = await getDocs(query(q, ...constraints));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Fetch a single poem by ID */
export async function getPoemById(poemId) {
  const snap = await getDoc(doc(db, 'poems', poemId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Add a new poem (LeadMunshid only — enforced by Firestore rules) */
export async function addPoem(poemData) {
  const ref = await addDoc(collection(db, 'poems'), {
    ...poemData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update an existing poem */
export async function updatePoem(poemId, updates) {
  await updateDoc(doc(db, 'poems', poemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a poem */
export async function deletePoem(poemId) {
  await deleteDoc(doc(db, 'poems', poemId));
}

// ---------------------------------------------------------------------------
// Firestore helpers — Current State (real-time sharing)
// ---------------------------------------------------------------------------

const CURRENT_STATE_DOC = 'currentState/live';

/** Subscribe to live current poem/wasla updates */
export function subscribeToCurrentState(callback) {
  return onSnapshot(doc(db, 'currentState', 'live'), snap => {
    callback(snap.exists() ? snap.data() : null);
  });
}

/** Share current poem or wasla (LeadMunshid only) */
export async function shareCurrentState(type, payload) {
  await updateDoc(doc(db, 'currentState', 'live'), {
    type,
    payload,
    sharedAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Authentication helpers
// ---------------------------------------------------------------------------

/** Sign in with email and password */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Sign out the current user */
export async function signOutUser() {
  await signOut(auth);
}

/** Listen to authentication state changes */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Re-export Firestore utilities for convenience in page modules
export { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp };
