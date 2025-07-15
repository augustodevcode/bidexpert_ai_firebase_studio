
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
 * Initializes the Firebase Admin SDK and returns the instances.
 * This function ensures that initialization happens only once.
 */
function initializeAdminSDK(): FirebaseAdminInstances {
  if (getApps().length > 0) {
    console.log("[Admin SDK] LOG: Using existing Firebase Admin app.");
    const app = getApp();
    return {
      app,
      db: getFirestore(app),
      storage: getStorage(app),
      auth: getAuth(app),
    };
  }

  try {
    console.log('[Admin SDK] LOG: Initializing with Application Default Credentials...');
    const app = initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    const db = getFirestore(app);
    // This setting is crucial and must only be called once.
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully.');
    
    return {
        app,
        db,
        storage: getStorage(app),
        auth: getAuth(app),
    };
  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

// Initialize and export the singletons immediately when the module is first imported.
const { app, db, storage, auth } = initializeAdminSDK();
export { app, db, storage, auth };
