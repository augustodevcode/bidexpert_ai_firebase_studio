
// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

export type { Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;
let storageInstance: Storage | null = null;

function initializeAdminApp(): App {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  
  console.log("[firebase/admin.ts] LOG: Initializing new Firebase Admin app from environment variables.");

  // Prepare credentials from environment variables.
  const serviceAccountCredentials = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The private key needs to be parsed correctly as it contains newlines.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccountCredentials.projectId || !serviceAccountCredentials.clientEmail || !serviceAccountCredentials.privateKey) {
      throw new Error("As credenciais do Firebase Admin SDK (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) não estão definidas no arquivo .env.");
  }

  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountCredentials as admin.ServiceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
  });

  return app;
}

/**
 * Ensures that the Firebase Admin app is initialized and returns the necessary instances.
 * Utilizes a Singleton pattern to avoid re-initializations in serverless environments.
 * @returns An object containing the app, db, and storage from Firebase Admin.
 */
export function ensureAdminInitialized(): {
  app: App;
  db: Firestore;
  storage: Storage;
} {
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }
  if (!firestoreDb) {
    firestoreDb = getFirestore(adminApp);
  }
  if (!storageInstance) {
    storageInstance = getStorage(adminApp);
  }

  return {
    app: adminApp,
    db: firestoreDb,
    storage: storageInstance,
  };
}

// For legacy code that might import 'db' directly.
const { db } = ensureAdminInitialized();
export { db };
