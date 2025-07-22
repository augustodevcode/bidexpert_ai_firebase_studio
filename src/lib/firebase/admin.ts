// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import path from 'path';

console.log("[firebase/admin.ts] LOG: File loaded.");

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let adminApp: App | undefined;

function initializeAdminApp(): App {
  console.log("[firebase/admin.ts] LOG: initializeAdminApp() called.");
  if (getApps().length > 0) {
    console.log("[firebase/admin.ts] LOG: Found existing Firebase Admin app.");
    return getApp();
  }

  try {
    // Corrected to use the exact and absolute path provided by the user.
    const serviceAccountPath = '/home/user/studio/bidexpert-630df-firebase-adminsdk-fbsvc-4c89838d15.json';
    
    console.log(`[Admin SDK] LOG: Attempting to initialize with service account file: ${serviceAccountPath}`);
    
    const serviceAccount = require(serviceAccountPath);

    const app = initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] LOG: Firebase Admin SDK initialized successfully via service account file.');
    return app;

  } catch (error: any) {
    console.error('[Admin SDK Error] FATAL: Failed to initialize Firebase Admin SDK:', error);
    // Provide a more helpful error message if the file is not found
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error("Erro ao inicializar o Admin SDK: Arquivo de credenciais não encontrado. Verifique o caminho em /src/lib/firebase/admin.ts");
    }
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
  console.log("[firebase/admin.ts] LOG: ensureAdminInitialized() called.");
  const alreadyInitialized = getApps().length > 0;
  
  if (!adminApp || !alreadyInitialized) { // Re-initialize if no apps are present
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
