// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

interface FirebaseAdminInstances {
  app: App;
  db: Firestore;
  storage: Storage;
  auth: Auth;
}

let instances: FirebaseAdminInstances | undefined;

function initializeAdminSDK(): FirebaseAdminInstances {
  if (getApps().length > 0) {
      const app = getApp();
      if (instances) {
        console.log("[firebase/admin.ts] LOG: Returning existing Firebase Admin instances.");
        return instances;
      }
      const db = getFirestore(app);
      db.settings({ ignoreUndefinedProperties: true });
      instances = {
          app,
          db,
          storage: getStorage(app),
          auth: getAuth(app),
      };
      return instances;
  }

  try {
    console.log('[Admin SDK] LOG: Initializing with Application Default Credentials...');
    const app = initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    const db = getFirestore(app);
    // This setting is crucial for the emulator to work correctly with composite indexes.
    db.settings({ ignoreUndefinedProperties: true });
    
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully.');
    instances = {
        app,
        db,
        storage: getStorage(app),
        auth: getAuth(app),
    };
    return instances;
  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

// Initialize and export the singletons. All other files will import these.
const { app, db, storage, auth } = initializeAdminSDK();
export { app, db, storage, auth };
