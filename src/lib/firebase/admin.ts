
// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

// Types are safe to export, as they don't execute code.
export type { FieldValue as AdminFieldValue, Timestamp as ServerTimestamp } from 'firebase-admin/firestore';

let adminApp: App | undefined;
let initError: Error | null = null;

function _initializeAdminApp(): App {
    if (getApps().length > 0) {
        console.log('[Admin SDK] App already initialized. Getting default app.');
        return getApp();
    }

    const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
    const manualPath = path.join(process.cwd(), serviceAccountKeyFileName);

    if (!fs.existsSync(manualPath)) {
        throw new Error(`Service account key file not found at: ${manualPath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
    const app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
    });
    console.log('[Admin SDK] Firebase Admin SDK initialized on-demand.');
    return app;
}

export function ensureAdminInitialized(): {
  app?: App;
  db?: Firestore;
  auth?: Auth;
  storage?: Storage;
  error?: Error | null;
  alreadyInitialized: boolean;
} {
    // If there was a permanent error during the first attempt, return it.
    if (initError) {
        return { error: initError, alreadyInitialized: getApps().length > 0 };
    }

    // If the app isn't initialized yet, try to initialize it.
    if (!adminApp) {
        try {
            adminApp = _initializeAdminApp();
        } catch (error: any) {
            initError = error; // Cache the initialization error
            console.error(`[Admin SDK] Caching initialization error: ${initError.message}`);
            return { error: initError, alreadyInitialized: getApps().length > 0 };
        }
    }
    
    // If adminApp is still not available after trying, something is wrong.
    if (!adminApp) {
      const finalError = new Error("Firebase Admin App is not available after initialization attempt.");
      return { error: finalError, alreadyInitialized: false };
    }

    return {
        app: adminApp,
        db: getFirestore(adminApp),
        auth: getAuth(adminApp),
        storage: getStorage(adminApp),
        error: null,
        alreadyInitialized: true,
    };
}
