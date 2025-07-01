
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

// This function will run once when the module is first imported.
function initialize() {
    console.log('[Admin SDK] Initialize function called.');
    if (getApps().length > 0) {
        console.log('[Admin SDK] App already initialized. Getting default app.');
        adminApp = getApp();
        return;
    }

    const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
    const manualPath = path.join(process.cwd(), serviceAccountKeyFileName);

    if (!fs.existsSync(manualPath)) {
        initError = new Error(`Service account key file not found at: ${manualPath}`);
        console.error(`[Admin SDK] ${initError.message}`);
        return;
    }

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bidexpert-630df.appspot.com',
        });
        console.log('[Admin SDK] Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
        if (error.code === 'app/duplicate-app') {
            console.warn('[Admin SDK] App already exists, getting instance.');
            adminApp = getApp();
        } else {
            initError = new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
            console.error(`[Admin SDK] ${initError.message}`);
        }
    }
}

// Initialize on module load
initialize();

export function ensureAdminInitialized(): {
  app?: App;
  db?: Firestore;
  auth?: Auth;
  storage?: Storage;
  error?: Error | null;
  alreadyInitialized: boolean;
} {
    if (initError) {
        return { error: initError, alreadyInitialized: false };
    }
    if (!adminApp) {
        const noAppError = new Error("Firebase Admin App is not available after initialization attempt.");
        return { error: noAppError, alreadyInitialized: false };
    }
    
    const alreadyInitialized = getApps().length > 0;

    return {
        app: adminApp,
        db: getFirestore(adminApp),
        auth: getAuth(adminApp),
        storage: getStorage(adminApp),
        error: null,
        alreadyInitialized: alreadyInitialized,
    };
}

// For direct, simpler access in scripts
export const dbAdmin = adminApp ? getFirestore(adminApp) : undefined;
export const authAdmin = adminApp ? getAuth(adminApp) : undefined;
export const storageAdmin = adminApp ? getStorage(adminApp) : undefined;
