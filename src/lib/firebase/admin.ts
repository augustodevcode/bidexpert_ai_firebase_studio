
// src/lib/firebase/admin.ts
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue as FirebaseAdminFieldValue, // Re-export
  Timestamp as FirebaseAdminTimestamp,   // Re-export
  type Firestore,
} from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

// Re-export FieldValue and Timestamp so other modules can import them without triggering full admin SDK init
export const AdminFieldValue = FirebaseAdminFieldValue;
export const ServerTimestamp = FirebaseAdminTimestamp;

let adminAppInternalInstance: App | undefined;
let sdkInitializationError: Error | null = null;

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json'; // Ensure this file is in the project root for local dev or use env vars
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

  // GUARDIAN CLAUSE: Only proceed if Firestore is the active system
  if (process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase() !== 'FIRESTORE') {
    const msg = `[Admin SDK ensureAdminInitialized] SKIPPING Firebase Admin initialization because ACTIVE_DATABASE_SYSTEM is not FIRESTORE. Current value: ${process.env.ACTIVE_DATABASE_SYSTEM || 'NOT SET'}`;
    console.warn(msg);
    return { error: new Error(msg), alreadyInitialized: false };
  }

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
         console.warn(`[Admin SDK ensureAdminInitialized] Default app not found, despite other apps existing (count: ${getApps().length}). Will attempt to initialize default app.`);
         wasAlreadyInitialized = false; 
      } else {
        console.error(`[Admin SDK ensureAdminInitialized] Error getting default app when other apps exist: ${e.message}`);
        sdkInitializationError = e;
        return { error: sdkInitializationError, alreadyInitialized: true }; 
      }
    }
  } else {
    wasAlreadyInitialized = false;
  }

  if (!adminAppInternalInstance) {
    console.log('[Admin SDK ensureAdminInitialized] No default Firebase app found or initialization needed. Loading service account...');
    let serviceAccount: object | undefined;
    let usedPath: string | undefined;
    const currentCwd = process.cwd();
    console.log(`[Admin SDK ensureAdminInitialized] Current working directory (process.cwd()): ${currentCwd}`);
    
    const credentialsPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (credentialsPathFromEnv) {
        const resolvedEnvPath = path.isAbsolute(credentialsPathFromEnv) ? credentialsPathFromEnv : path.resolve(currentCwd, credentialsPathFromEnv);
        if (fs.existsSync(resolvedEnvPath)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(resolvedEnvPath, 'utf8'));
                usedPath = resolvedEnvPath;
                console.log(`[Admin SDK ensureAdminInitialized] Service account loaded from GOOGLE_APPLICATION_CREDENTIALS: ${usedPath}`);
            } catch (e: any) {
                console.warn(`[Admin SDK ensureAdminInitialized] Failed to load/parse from GOOGLE_APPLICATION_CREDENTIALS ('${resolvedEnvPath}'): ${e.message}. Trying manual path.`);
            }
        } else {
             console.warn(`[Admin SDK ensureAdminInitialized] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${resolvedEnvPath}. Trying manual path.`);
        }
    } else {
      console.log(`[Admin SDK ensureAdminInitialized] GOOGLE_APPLICATION_CREDENTIALS not set. Trying manual path: ${serviceAccountKeyFileName}`);
    }

    if (!serviceAccount) {
      const manualPath = path.resolve(currentCwd, serviceAccountKeyFileName);
      if (fs.existsSync(manualPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(manualPath, 'utf8'));
          usedPath = manualPath;
          console.log(`[Admin SDK ensureAdminInitialized] Successfully loaded service account from manual path: ${usedPath}`);
        } catch (e: any) {
          sdkInitializationError = new Error(`Failed to load/parse service account from manual path ('${manualPath}'): ${e.message}`);
          return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
        }
      } else {
        sdkInitializationError = new Error(`Service account key file not found. CWD: ${currentCwd}, Manual Path Checked: '${manualPath}', GOOGLE_APPLICATION_CREDENTIALS: '${credentialsPathFromEnv || 'not set'}'`);
        return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
      }
    }
    
    if (!serviceAccount) {
        sdkInitializationError = new Error(`CRITICAL: Service account JSON could not be loaded.`);
        return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
    }

    try {
      console.log(`[Admin SDK ensureAdminInitialized] Initializing default app with loaded service account from: ${usedPath}`);
      adminAppInternalInstance = initializeApp({ credential: cert(serviceAccount) }, DEFAULT_APP_NAME);
      console.log(`[Admin SDK ensureAdminInitialized] Firebase Admin SDK initialized successfully (app name: ${adminAppInternalInstance.name}). Apps count: ${getApps().length}`);
      sdkInitializationError = null; 
      wasAlreadyInitialized = false; 
    } catch (initError: any) {
      if (initError.code === 'app/duplicate-app' && initError.message.includes(`"${DEFAULT_APP_NAME}"`)) {
        console.warn(`[Admin SDK ensureAdminInitialized] Default app already exists. Getting it.`);
        try {
          adminAppInternalInstance = getApp(DEFAULT_APP_NAME);
          sdkInitializationError = null;
          wasAlreadyInitialized = true;
        } catch (getAppError: any) {
            sdkInitializationError = new Error(`Failed to get already initialized default app: ${getAppError.message}`);
            return { error: sdkInitializationError, alreadyInitialized: true };
        }
      } else {
        const detailedError = initError.message ? initError.message : JSON.stringify(initError, Object.getOwnPropertyNames(initError));
        sdkInitializationError = new Error(`Failed Firebase Admin SDK initialization: ${detailedError}`);
        return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
      }
    }
  }

  if (adminAppInternalInstance) {
    try {
        const db = getFirestore(adminAppInternalInstance);
        const auth = getAuth(adminAppInternalInstance);
        let storage: Storage | undefined;
        try {
          storage = getStorage(adminAppInternalInstance);
        } catch (storageError: any) {
          console.warn('[Admin SDK ensureAdminInitialized] Could not init Storage Admin (OK if not used):', storageError.message);
          storage = undefined; 
        }
        return { app: adminAppInternalInstance, db, auth, storage, error: null, alreadyInitialized: wasAlreadyInitialized };
    } catch (serviceError: any) {
        sdkInitializationError = new Error(`Error getting Firebase services after app init: ${serviceError.message}`);
        return { app: adminAppInternalInstance, error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized};
    }
  }
  
  if (!sdkInitializationError) {
      sdkInitializationError = new Error('Admin app instance is unexpectedly undefined and no error was set.');
  }
  return { error: sdkInitializationError, alreadyInitialized: wasAlreadyInitialized };
}
