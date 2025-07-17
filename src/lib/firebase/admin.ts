// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';

console.log("[firebase/admin.ts] LOG: Module loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

interface FirebaseAdminInstances {
  app: App;
  db: Firestore;
  storage: Storage;
  auth: Auth;
}

/**
 * Initializes the Firebase Admin SDK using Application Default Credentials (ADC)
 * and ensures it only happens once. This is the standard and robust method
 * for Google Cloud environments like Firebase Studio.
 */
function initializeAdminSDK(): FirebaseAdminInstances {
  const appName = 'bidexpert-admin-app';
  
  // Check if the specific app instance has already been initialized.
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    console.log(`[Admin SDK] LOG: Using existing Firebase Admin app "${appName}".`);
    const app = getApp(appName);
    return {
      app,
      db: getFirestore(app),
      storage: getStorage(app),
      auth: getAuth(app),
    };
  }
  
  console.log('[Admin SDK] LOG: Attempting to initialize new Firebase Admin app with Application Default Credentials...');
  
  try {
    const app = initializeApp({
        // By not providing a `credential` object, the SDK automatically
        // uses Application Default Credentials from the environment.
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    }, appName); // Give the app a unique name

    const db = getFirestore(app);
    // This setting is crucial for the emulator to work correctly with composite indexes.
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');

    return {
      app,
      db,
      storage: getStorage(app),
      auth: getAuth(app),
    };
  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK with Application Default Credentials:', error);
    throw new Error(`Could not initialize Admin SDK: ${error.message}`);
  }
}

// Immediately initialize and export the singletons.
const { app, db, storage, auth } = initializeAdminSDK();
export { app, db, storage, auth };
