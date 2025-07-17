// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let adminAppInstance: App | undefined;

/**
 * Ensures the Firebase Admin SDK is initialized and returns the singletons
 * for app, db, storage, and auth. This prevents multiple initializations.
 */
export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  auth: Auth;
  error?: undefined;
} {
  if (!adminAppInstance) {
      if (getApps().length === 0) {
        console.log('[Admin SDK] LOG: Initializing with Application Default Credentials...');
        initializeApp({
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
        });
        console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');
      } else {
        console.log('[Admin SDK] LOG: Using existing Firebase Admin app.');
      }
      adminAppInstance = getApp();
  }
  
  const db = getFirestore(adminAppInstance);
  // This setting is crucial for the emulator to work correctly with composite indexes.
  db.settings({ ignoreUndefinedProperties: true });

  return {
    app: adminAppInstance,
    db: db,
    storage: getStorage(adminAppInstance),
    auth: getAuth(adminAppInstance),
  };
}

// For compatibility with any legacy code that might still be importing these named exports.
// This ensures they're initialized through the central function.
const { db, auth } = ensureAdminInitialized();
export { db, auth };
