// src/lib/firebase/admin.ts
import type { App } from 'firebase-admin/app';
import type { Firestore, FieldValue as FirebaseAdminFieldValueType, Timestamp as FirebaseAdminTimestampType } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

// LOGGING FOR DIAGNOSIS
console.log(`[Firebase Admin Module Top Level] ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}`);

let admin: typeof import('firebase-admin') | null = null;
let AdminFieldValue: typeof FirebaseAdminFieldValueType | undefined = undefined;
let ServerTimestamp: typeof FirebaseAdminTimestampType | undefined = undefined;

let adminAppInternalInstance: App | undefined;
let sdkInitializationError: Error | null = null;

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json'; // Make sure this is in your project root or update path
const DEFAULT_APP_NAME = '[DEFAULT]'; // Default app name used by Firebase Admin

// Conditionally import and initialize
if (process.env.ACTIVE_DATABASE_SYSTEM?.toUpperCase() === 'FIRESTORE') {
  console.log('[Firebase Admin Module] FIRESTORE is active, attempting to import and setup firebase-admin.');
  try {
    admin = require('firebase-admin'); // Use require for conditional import
    AdminFieldValue = admin.firestore.FieldValue;
    ServerTimestamp = admin.firestore.Timestamp;
  } catch (e: any) {
    console.error('[Firebase Admin Module] Failed to require firebase-admin:', e.message);
    sdkInitializationError = new Error(`Failed to require firebase-admin: ${e.message}`);
    admin = null; // Ensure admin is null if import fails
  }
} else {
  console.log(`[Firebase Admin Module] FIRESTORE is NOT active (ACTIVE_DATABASE_SYSTEM: ${process.env.ACTIVE_DATABASE_SYSTEM}). Firebase Admin SDK will not be initialized by this module directly.`);
  // Define stubs if not Firestore, so imports don't break type-wise if file is somehow evaluated
    AdminFieldValue = {
        serverTimestamp: () => new Date(), // Placeholder, behavior might differ
        delete: () => ({_isFieldValue: true, _methodName: 'FieldValue.delete'}), // Placeholder
        arrayUnion: (...elements: any[]) => ({_isFieldValue: true, _methodName: 'FieldValue.arrayUnion', _elements: elements}),
        arrayRemove: (...elements: any[]) => ({_isFieldValue: true, _methodName: 'FieldValue.arrayRemove', _elements: elements}),
        increment: (n: number) => ({_isFieldValue: true, _methodName: 'FieldValue.increment', _operand: n}),
    } as unknown as typeof FirebaseAdminFieldValueType;

    ServerTimestamp = {
        now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date(), isEqual: () => false, toMillis: () => Date.now(), valueOf: () => '' }),
        fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: (date.getTime() % 1000) * 1e6, toDate: () => date, isEqual: () => false, toMillis: () => date.getTime(), valueOf: () => ''  }),
        fromMillis: (milliseconds: number) => ({ seconds: Math.floor(milliseconds / 1000), nanoseconds: (milliseconds % 1000) * 1e6, toDate: () => new Date(milliseconds), isEqual: () => false, toMillis: () => milliseconds, valueOf: () => '' }),
    } as unknown as typeof FirebaseAdminTimestampType;
}

export { AdminFieldValue, ServerTimestamp };

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
    return { 
      error: new Error(msg), 
      alreadyInitialized: false 
    };
  }
  
  if (!admin) { // Check if firebase-admin module was loaded
    const noAdminModuleError = new Error('[Admin SDK ensureAdminInitialized] Firebase Admin module (firebase-admin) was not loaded. This typically means ACTIVE_DATABASE_SYSTEM is not FIRESTORE or the import failed.');
     console.error(noAdminModuleError.message);
    return { error: noAdminModuleError, alreadyInitialized: false };
  }

  if (sdkInitializationError) {
    console.warn('[Admin SDK ensureAdminInitialized] Returning previous initialization error:', sdkInitializationError.message);
    return { error: sdkInitializationError, alreadyInitialized: false };
  }

  let wasAlreadyInitialized = false;

  if (admin.apps.length > 0) {
    try {
      adminAppInternalInstance = admin.app(DEFAULT_APP_NAME);
      wasAlreadyInitialized = true;
      console.log(`[Admin SDK ensureAdminInitialized] Using existing default Firebase app "${DEFAULT_APP_NAME}". Apps count: ${admin.apps.length}`);
      sdkInitializationError = null; 
    } catch (e: any) {
      if (e.code === 'app/app-not-found') {
         console.warn(`[Admin SDK ensureAdminInitialized] Default app not found, but other apps exist (count: ${admin.apps.length}). Will attempt to initialize default app.`);
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
      const manualPath = path.join(currentCwd, serviceAccountKeyFileName); // Use path.join
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
      adminAppInternalInstance = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, DEFAULT_APP_NAME);
      console.log(`[Admin SDK ensureAdminInitialized] Firebase Admin SDK initialized successfully (app name: ${adminAppInternalInstance.name}). Apps count: ${admin.apps.length}`);
      sdkInitializationError = null;
      wasAlreadyInitialized = false;
    } catch (initError: any) {
      if (initError.code === 'app/duplicate-app' && initError.message.includes(`"${DEFAULT_APP_NAME}"`)) {
        console.warn(`[Admin SDK ensureAdminInitialized] Attempted to initialize default app but it already exists. Getting it.`);
        try {
          adminAppInternalInstance = admin.app(DEFAULT_APP_NAME);
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

  if (adminAppInternalInstance && admin) { // Check admin module again
    console.log(`[Admin SDK ensureAdminInitialized] Using app: ${adminAppInternalInstance.name}`);
    const db = admin.firestore(adminAppInternalInstance);
    const auth = admin.auth(adminAppInternalInstance);
    let storage: Storage | undefined;
    try {
      storage = admin.storage(adminAppInternalInstance);
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
