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

// This function ensures the Admin SDK is initialized, and returns the services.
// It's designed to be a singleton pattern, initializing only once.
export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  auth: Auth;
} {
  if (getApps().length === 0) {
    console.log('[Admin SDK] LOG: Initializing new Firebase Admin app...');
    
    // Initialize using Application Default Credentials, which is standard for Firebase environments.
    // The emulator environment variables, if set via the npm script, will be automatically picked up.
    app = initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');
    
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch(error: any) {
        if (!error.message.includes('settings() has already been called')) {
            throw error;
        }
    }
    
  } else {
    // If already initialized, just get the existing instances.
    app = getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }

  return { app, db, storage, auth };
}

// Immediately initialize on module load to ensure singletons are ready.
const services = ensureAdminInitialized();

// Export the initialized singletons for use throughout the application
app = services.app;
db = services.db;
auth = services.auth;
storage = services.storage;

export { app, db, auth, storage };
