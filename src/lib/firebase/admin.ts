// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function initializeAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    // Rely on Application Default Credentials.
    // This is the standard way for server-side environments like App Hosting.
    // It automatically finds the credentials from the environment.
    console.log('[Admin SDK] Initializing with Application Default Credentials...');
    const app = initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] Firebase Admin SDK initialized successfully via ADC.');
    return app;
  } catch (error: any) {
    console.error('[Admin SDK Error] Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  error?: null;
  alreadyInitialized: boolean;
} {
  const alreadyInitialized = getApps().length > 0;
  
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }
  
  return {
    app: adminApp,
    db: getFirestore(adminApp),
    storage: getStorage(adminApp),
    alreadyInitialized,
  };
}

// For compatibility with legacy code that might be using this named export.
const { db } = ensureAdminInitialized();
export { db };
