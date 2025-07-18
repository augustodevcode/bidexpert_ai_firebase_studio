// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getAuth, type Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

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
    
    // This is the key change: Detect if we're running a script via tsx.
    // If so, force the use of the Firestore emulator. This fixes the UNAUTHENTICATED error.
    if (process.env.npm_config_user_agent?.includes('tsx')) {
      console.log('[Admin SDK] SCRIPT environment detected. Setting FIRESTORE_EMULATOR_HOST.');
      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    }

    // Try to initialize using Application Default Credentials, which is standard for Firebase environments.
    try {
      console.log('[Admin SDK] LOG: Attempting to initialize with Application Default Credentials...');
      app = initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
      });
      console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');
    } catch (e: any) {
        console.warn(`[Admin SDK] WARN: ADC initialization failed: ${e.message}. Falling back to local key file.`);
        
        const serviceAccountPath = path.resolve(process.cwd(), 'bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json');
        
        if (!fs.existsSync(serviceAccountPath)) {
            console.error(`[Admin SDK] FATAL: Service account key not found at ${serviceAccountPath}. ADC failed and no fallback is available.`);
            throw new Error(`Service account key is missing and Application Default Credentials failed.`);
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        app = initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
        }, `bidexpert-admin-app-${Date.now()}`); 
        console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via local service account file.');
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    // This setting is crucial for the emulator to work correctly with composite indexes.
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
