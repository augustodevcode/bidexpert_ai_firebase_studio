// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let app: App;
let auth: Auth;
let db: Firestore;
let storage: Storage;

if (getApps().length === 0) {
  console.log('[Admin SDK] LOG: Initializing with Application Default Credentials...');
  app = initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
  });
  console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');
  db = getFirestore(app);
  // This setting is crucial for the emulator to work correctly with composite indexes.
  db.settings({ ignoreUndefinedProperties: true });
} else {
  console.log('[Admin SDK] LOG: Using existing Firebase Admin app.');
  app = getApp();
  db = getFirestore(app);
}

auth = getAuth(app);
storage = getStorage(app);

/**
 * Ensures the Firebase Admin SDK is initialized and returns the singletons
 * for app, db, storage, and auth. This function now primarily acts as an accessor
 * to the already initialized services.
 */
export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  auth: Auth;
} {
  // The services are already initialized at the module level.
  // This function just returns them.
  return { app, db, storage, auth };
}


// Export the initialized singletons for use throughout the application
export { app, db, auth, storage };
