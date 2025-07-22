// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import serviceAccount from '../../../bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json'; 

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

/**
 * Ensures the Firebase Admin app is initialized and returns the app, db, and storage instances.
 * This function uses a singleton pattern to avoid re-initializing the app on every call,
 * which is a common source of errors in serverless environments.
 * @returns An object containing the Firebase Admin app, Firestore, and Storage instances.
 */
export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  error?: null;
} {
  const existingApps = getApps();
  const app = existingApps.length > 0 ? existingApps[0] : initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
  });

  return {
    app,
    db: getFirestore(app),
    storage: getStorage(app),
  };
}

// For compatibility with legacy code that might be using this named export.
const { db } = ensureAdminInitialized();
export { db };
