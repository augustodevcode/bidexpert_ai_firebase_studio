// src/lib/firebase.ts

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;

const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'YOUR_API_KEY_HERE';

if (isFirebaseConfigured && getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else if (getApps().length > 0) {
  app = getApps()[0];
} else {
  console.warn("Firebase configuration is missing or incomplete. Some Firebase services might not be available.");
  app = {} as FirebaseApp; 
}

// NOTE: We are no longer using Firebase Auth for user management.
// This is kept here temporarily for any other Firebase services that might be used
// on the client-side, but it's not the primary auth system.
const auth: Auth = isFirebaseConfigured ? getAuth(app) : {} as Auth;
const db: Firestore = isFirebaseConfigured ? getFirestore(app) : {} as Firestore;

export { app, auth, db };
