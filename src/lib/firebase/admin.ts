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
  
  const serviceAccountPath = path.resolve(process.cwd(), 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

  try {
    if (fs.existsSync(serviceAccountPath)) {
        console.log('[Admin SDK] LOG: Initializing with local service account key...');
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const app = initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
        });
        const db = getFirestore(app);
        db.settings({ ignoreUndefinedProperties: true });
        console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via local key.');
        return { app, db, storage: getStorage(app), auth: getAuth(app) };
    } else {
        console.warn('[Admin SDK] WARNING: Service account key not found at path. Falling back to ADC.', serviceAccountPath);
        console.log('[Admin SDK] LOG: Initializing with Application Default Credentials...');
        const app = initializeApp({
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
        });
        const db = getFirestore(app);
        db.settings({ ignoreUndefinedProperties: true });
        console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');
        return { app, db, storage: getStorage(app), auth: getAuth(app) };
    }
  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

// Initialize and export the singletons immediately when the module is first imported.
const { app, db, storage, auth } = initializeAdminSDK();
export { app, db, storage, auth };
