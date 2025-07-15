
// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

function initializeAdminApp(): App {
  console.log("[firebase/admin.ts] LOG: initializeAdminApp() called.");
  
  if (getApps().length > 0) {
    console.log("[firebase/admin.ts] LOG: Found existing Firebase Admin app. Returning it.");
    return getApp();
  }

  try {
    console.log('[Admin SDK] LOG: Initializing with Application Default Credentials...');
    const app = initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via ADC.');
    return app;
  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

let adminAppInstance: App | undefined;

export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
} {
  if (!adminAppInstance) {
    adminAppInstance = initializeAdminApp();
  }
  
  const db = getFirestore(adminAppInstance);
  // This setting is crucial for the emulator to work correctly with composite indexes.
  db.settings({ ignoreUndefinedProperties: true });

  return {
    app: adminAppInstance,
    db: db,
    storage: getStorage(adminAppInstance),
  };
}

// For compatibility with any legacy code that might still be importing this named export.
// This ensures it's initialized through the central function.
const { db } = ensureAdminInitialized();
export { db };
