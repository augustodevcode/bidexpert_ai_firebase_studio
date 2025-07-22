// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import serviceAccount from '../../../bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json'; 

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

function initializeAdminApp(): App {
  console.log("[firebase/admin.ts] LOG: initializeAdminApp() called.");
  const existingApps = getApps();
  if (existingApps.length > 0) {
    console.log("[firebase/admin.ts] LOG: Found existing Firebase Admin app.");
    return existingApps[0];
  }

  try {
    console.log(`[Admin SDK] LOG: Attempting to initialize with imported service account object.`);
    
    // As credenciais agora são um objeto importado diretamente
    const app = initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via service account file.');
    return app;

  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK:', error);
    throw new Error(`Erro ao inicializar o Admin SDK: ${error.message}`);
  }
}

// Singleton pattern to ensure SDK is initialized only once.
const adminApp = initializeAdminApp();

export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
  error?: null;
} {
  console.log("[firebase/admin.ts] LOG: ensureAdminInitialized() called.");
  return {
    app: adminApp,
    db: getFirestore(adminApp),
    storage: getStorage(adminApp),
  };
}

// For compatibility with legacy code that might be using this named export.
const { db } = ensureAdminInitialized();
export { db };
