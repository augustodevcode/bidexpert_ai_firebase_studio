// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';

console.log("[firebase/admin.ts] LOG: Module loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

interface FirebaseAdminInstances {
  app: App;
  db: Firestore;
  storage: Storage;
  auth: Auth;
}

// Singleton instance holder
let instances: FirebaseAdminInstances | null = null;

/**
 * Initializes the Firebase Admin SDK using an explicit service account key
 * and ensures it only happens once.
 * This is the definitive, robust method to prevent authentication errors.
 */
function initializeAdminSDK(): FirebaseAdminInstances {
  if (getApps().length) {
    console.log("[Admin SDK] LOG: Using existing Firebase Admin app.");
    const app = getApp();
    return {
      app,
      db: getFirestore(app),
      storage: getStorage(app),
      auth: getAuth(app),
    };
  }
  
  console.log('[Admin SDK] LOG: Attempting to initialize new Firebase Admin app...');
  
  // Hardcode the path to the service account key to ensure it's always found.
  const serviceAccountPath = path.resolve(process.cwd(), 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

  if (!fs.existsSync(serviceAccountPath)) {
    const errorMessage = `FATAL: Service account key not found at ${serviceAccountPath}. The application cannot start without it.`;
    console.error(`[Admin SDK Error] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    console.log('[Admin SDK] LOG: Initializing with explicit service account credentials...');
    
    const app = initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    }, 'bidexpert-admin-app'); // Give the app a unique name

    const db = getFirestore(app);
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully.');

    return {
      app,
      db,
      storage: getStorage(app),
      auth: getAuth(app),
    };
  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK with service account key:', error);
    throw new Error(`Could not initialize Admin SDK: ${error.message}`);
  }
}

// Immediately initialize and export the singletons.
// This pattern ensures initialization happens only once when the module is first imported.
const { app, db, storage, auth } = initializeAdminSDK();
export { app, db, storage, auth };
