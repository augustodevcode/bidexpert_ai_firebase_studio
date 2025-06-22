// src/lib/firebase/admin.ts
// Esta abordagem garante que o 'firebase-admin' só seja carregado quando realmente necessário.

import * as fs from 'fs';
import * as path from 'path';
import type { App } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

// Tipos são seguros para exportar, pois não executam código.
export type { FieldValue as AdminFieldValue, Timestamp as ServerTimestamp } from 'firebase-admin/firestore';


let adminAppInternalInstance: App | undefined;
let sdkInitializationError: Error | null = null;

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
const DEFAULT_APP_NAME = '[DEFAULT]';

export function ensureAdminInitialized(): {
  app?: App;
  db?: Firestore;
  auth?: Auth;
  storage?: Storage;
  error?: Error | null;
  alreadyInitialized: boolean;
} {
  console.log('[Admin SDK ensureAdminInitialized] Called.');

  // Import 'firebase-admin' dinamicamente AQUI
  let admin: typeof import('firebase-admin');
  try {
    admin = require('firebase-admin');
  } catch (e: any) {
    sdkInitializationError = new Error(`Failed to require 'firebase-admin': ${e.message}`);
    console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
    return { error: sdkInitializationError, alreadyInitialized: false };
  }
  const { cert, getApp, getApps, initializeApp } = require('firebase-admin/app') as typeof import('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore') as typeof import('firebase-admin/firestore');
  const { getAuth } = require('firebase-admin/auth') as typeof import('firebase-admin/auth');
  const { getStorage } = require('firebase-admin/storage') as typeof import('firebase-admin/storage');


  if (sdkInitializationError) {
    console.warn('[Admin SDK ensureAdminInitialized] Returning previous initialization error:', sdkInitializationError.message);
    return { error: sdkInitializationError, alreadyInitialized: false };
  }

  let wasAlreadyInitialized = false;

  if (getApps().length > 0) {
    try {
      adminAppInternalInstance = getApp(DEFAULT_APP_NAME);
      wasAlreadyInitialized = true;
      console.log(`[Admin SDK ensureAdminInitialized] Using existing default Firebase app "${DEFAULT_APP_NAME}". Apps count: ${getApps().length}`);
      sdkInitializationError = null;
    } catch (e: any) {
      if (e.code === 'app/app-not-found') {
         console.warn(`[Admin SDK ensureAdminInitialized] Default app not found, but other apps exist (count: ${getApps().length}). Will attempt to initialize default app.`);
         wasAlreadyInitialized = false;
      } else {
        console.error(`[Admin SDK ensureAdminInitialized] Error getting default app: ${e.message}`);
        sdkInitializationError = e;
        return { error: sdkInitializationError, alreadyInitialized: true };
      }
    }
  } else {
    wasAlreadyInitialized = false;
  }

  if (!adminAppInternalInstance) {
    console.log('[Admin SDK ensureAdminInitialized] No default Firebase app found or needs initialization.');
    let serviceAccount: object | undefined;
    let usedPath: string | undefined;
    const currentCwd = process.cwd();
    console.log(`[Admin SDK ensureAdminInitialized] Current working directory (process.cwd()): ${currentCwd}`);

    const credentialsPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`[Admin SDK ensureAdminInitialized] Raw GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPathFromEnv}`);

    if (credentialsPathFromEnv) {
        const resolvedEnvPath = path.isAbsolute(credentialsPathFromEnv) ? credentialsPathFromEnv : path.resolve(currentCwd, credentialsPathFromEnv);
        if (fs.existsSync(resolvedEnvPath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(resolvedEnvPath, 'utf8'));
                usedPath = resolvedEnvPath;
                console.log(`[Admin SDK ensureAdminInitialized] Loaded service account from GOOGLE_APPLICATION_CREDENTIALS: ${usedPath}`);
            } catch (e: any) {
                console.warn(`[Admin SDK ensureAdminInitialized] Failed to load/parse service account from GOOGLE_APPLICATION_CREDENTIALS ('${resolvedEnvPath}'): ${e.message}. Trying manual path.`);
            }
        } else {
             console.warn(`[Admin SDK ensureAdminInitialized] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${resolvedEnvPath}. Trying manual path.`);
        }
    } else {
      console.log(`[Admin SDK ensureAdminInitialized] GOOGLE_APPLICATION_CREDENTIALS is NOT set. Trying manual path.`);
    }

    if (!serviceAccount) {
      const manualPath = path.join(currentCwd, serviceAccountKeyFileName);
      console.log(`[Admin SDK ensureAdminInitialized] Attempting manual path: ${manualPath}`);
      if (fs.existsSync(manualPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
          usedPath = manualPath;
          console.log(`[Admin SDK ensureAdminInitialized] Successfully loaded service account from manual path: ${usedPath}`);
        } catch (e: any) {
          sdkInitializationError = new Error(`Failed to load/parse service account from manual path ('${manualPath}'): ${e.message}`);
          console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
        }
      } else {
        sdkInitializationError = new Error(`Service account key file not found. CWD: ${currentCwd}, Manual Path Checked: '${manualPath}', GOOGLE_APPLICATION_CREDENTIALS: '${credentialsPathFromEnv || 'not set'}'`);
        console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
        return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
      }
    }

    if (!serviceAccount) {
        sdkInitializationError = new Error(`CRITICAL: Service account JSON could not be loaded.`);
        console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
        return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
    }

    try {
      console.log(`[Admin SDK ensureAdminInitialized] Initializing default app with service account from: ${usedPath}`);
      adminAppInternalInstance = initializeApp({ credential: cert(serviceAccount) }, DEFAULT_APP_NAME);
      console.log(`[Admin SDK ensureAdminInitialized] Firebase Admin SDK initialized successfully (app name: ${adminAppInternalInstance.name}). Apps count: ${getApps().length}`);
      sdkInitializationError = null;
      wasAlreadyInitialized = false;
    } catch (initError: any) {
      if (initError.code === 'app/duplicate-app' && initError.message.includes(`"${DEFAULT_APP_NAME}"`)) {
        console.warn(`[Admin SDK ensureAdminInitialized] Attempted to initialize default app but it already exists. Getting it.`);
        try {
          adminAppInternalInstance = getApp(DEFAULT_APP_NAME);
          sdkInitializationError = null;
          wasAlreadyInitialized = true;
        } catch (getAppError: any) {
            sdkInitializationError = new Error(`Failed to get already initialized default app: ${getAppError.message}`);
            console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
            return { error: sdkInitializationError, alreadyInitialized: true };
        }
      } else {
        const detailedError = initError.message ? initError.message : JSON.stringify(initError, Object.getOwnPropertyNames(initError));
        console.error(`[Admin SDK ensureAdminInitialized] CRITICAL ERROR during initializeApp(): ${detailedError}`);
        sdkInitializationError = new Error(`Failed Firebase Admin SDK initialization: ${detailedError}`);
        return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
      }
    }
  }

  if (adminAppInternalInstance) {
    console.log(`[Admin SDK ensureAdminInitialized] Using app: ${adminAppInternalInstance.name}`);
    const db = getFirestore(adminAppInternalInstance);
    const auth = getAuth(adminAppInternalInstance);
    let storage: Storage | undefined;
    try {
      storage = getStorage(adminAppInternalInstance);
    } catch (storageError: any) {
      console.warn('[Admin SDK ensureAdminInitialized] Could not initialize Storage Admin (OK if not used):', storageError.message);
      storage = undefined;
    }
    console.log('[Admin SDK ensureAdminInitialized] Service instances obtained/verified.');
    return { app: adminAppInternalInstance, db, auth, storage, error: null, alreadyInitialized: wasAlreadyInitialized };
  }

  if (!sdkInitializationError) {
      sdkInitializationError = new Error('Admin app instance is unexpectedly undefined after initialization block and no prior error was set, or Firebase Admin module was not loaded.');
      console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
  }
  return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
}
