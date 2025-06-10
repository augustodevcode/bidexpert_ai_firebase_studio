
// src/lib/firebase/admin.ts
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue as FirebaseAdminFieldValue,
  Timestamp as FirebaseAdminTimestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

let adminAppInternalInstance: App | undefined;
let dbAdminInternalInstance: Firestore | undefined;
let authAdminInternalInstance: Auth | undefined;
let storageAdminInternalInstance: Storage | undefined;
let sdkInitializationError: Error | null = null;

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';

export function ensureAdminInitialized(): {
  app?: App;
  db?: Firestore;
  auth?: Auth;
  storage?: Storage;
  error?: Error | null;
} {
  if (sdkInitializationError) {
    console.warn('[Admin SDK] Returning previous initialization error:', sdkInitializationError.message);
    return { error: sdkInitializationError };
  }

  if (!adminAppInternalInstance) {
    console.log('[Admin SDK] No cached app instance. Attempting to get or initialize.');
    if (!getApps().length) {
      console.log('[Admin SDK] No Firebase app initialized. Attempting to initialize a new one.');
      let serviceAccount: object | undefined;
      let usedPath: string | undefined;
      
      const credentialsPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log(`[Admin SDK] Raw GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPathFromEnv}`);

      if (credentialsPathFromEnv) {
        const resolvedEnvPath = path.resolve(credentialsPathFromEnv);
        console.log(`[Admin SDK] Attempting to load from GOOGLE_APPLICATION_CREDENTIALS (resolved path: ${resolvedEnvPath})`);
        if (fs.existsSync(resolvedEnvPath)) {
          try {
            const serviceAccountJsonString = fs.readFileSync(resolvedEnvPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountJsonString);
            usedPath = resolvedEnvPath;
            console.log(`[Admin SDK] Successfully loaded service account from GOOGLE_APPLICATION_CREDENTIALS: ${usedPath}`);
          } catch (e: any) {
            console.error(`[Admin SDK] Failed to load/parse service account from GOOGLE_APPLICATION_CREDENTIALS ('${resolvedEnvPath}'): ${e.message}. Will try manual path.`);
            // Não definir sdkInitializationError aqui ainda, permitir fallback.
          }
        } else {
          console.warn(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${resolvedEnvPath}. Will attempt manual path.`);
        }
      }

      if (!serviceAccount) {
        const currentCwd = process.cwd();
        const manualPath = path.resolve(currentCwd, serviceAccountKeyFileName);
        console.log(`[Admin SDK] Current working directory (process.cwd()): ${currentCwd}`);
        console.log(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS not used or failed. Attempting manual path: ${manualPath}`);
        if (fs.existsSync(manualPath)) {
          try {
            const serviceAccountJsonString = fs.readFileSync(manualPath, 'utf8');
            serviceAccount = JSON.parse(serviceAccountJsonString);
            usedPath = manualPath;
            console.log(`[Admin SDK] Successfully loaded service account from manual path: ${usedPath}`);
          } catch (e: any) {
            sdkInitializationError = new Error(`Failed to load/parse service account from manual path ('${manualPath}'): ${e.message}`);
            console.error(`[Admin SDK] ${sdkInitializationError.message}`);
            return { error: sdkInitializationError };
          }
        } else {
          sdkInitializationError = new Error(`Service account key file not found. Checked GOOGLE_APPLICATION_CREDENTIALS ('${credentialsPathFromEnv}' -> resolved to '${resolvedEnvPath}') and manual path ('${manualPath}'). CWD: ${currentCwd}`);
          console.error(`[Admin SDK] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError };
        }
      }
      
      if (!serviceAccount) { 
          sdkInitializationError = new Error(`CRITICAL: Service account JSON could not be loaded. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly or '${serviceAccountKeyFileName}' is in the project root.`);
          console.error(`[Admin SDK] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError };
      }

      try {
        console.log(`[Admin SDK] Initializing app with service account from: ${usedPath}`);
        adminAppInternalInstance = initializeApp({ credential: cert(serviceAccount) });
        console.log('[Admin SDK] Firebase Admin SDK initialized successfully (new app).');
        sdkInitializationError = null; 
      } catch (initError: any) {
        const detailedError = initError.message ? initError.message : JSON.stringify(initError, Object.getOwnPropertyNames(initError));
        console.error(`[Admin SDK] CRITICAL ERROR during initializeApp(): ${detailedError}`);
        sdkInitializationError = new Error(`Failed Firebase Admin SDK initialization: ${detailedError}`);
        return { error: sdkInitializationError };
      }
    } else {
      adminAppInternalInstance = getApp();
      console.log('[Admin SDK] Using existing Firebase app.');
      sdkInitializationError = null; 
    }
  }

  if (adminAppInternalInstance) {
    dbAdminInternalInstance ??= getFirestore(adminAppInternalInstance);
    authAdminInternalInstance ??= getAuth(adminAppInternalInstance);
    try {
      storageAdminInternalInstance ??= getStorage(adminAppInternalInstance);
    } catch (storageError: any) {
      console.warn('[Admin SDK] Could not initialize Storage Admin (OK if not used):', storageError.message);
      storageAdminInternalInstance = undefined; 
    }
  } else {
    if (!sdkInitializationError) {
        sdkInitializationError = new Error('Admin app instance is unexpectedly undefined after initialization block.');
        console.error(`[Admin SDK] ${sdkInitializationError.message}`);
    }
    return { error: sdkInitializationError };
  }
  
  return { 
    app: adminAppInternalInstance, 
    db: dbAdminInternalInstance, 
    auth: authAdminInternalInstance, 
    storage: storageAdminInternalInstance,
    error: null 
  };
}

export const FieldValue = FirebaseAdminFieldValue;
export const Timestamp = FirebaseAdminTimestamp;

export { 
    adminAppInternalInstance as adminApp,
    dbAdminInternalInstance as dbAdmin,
    authAdminInternalInstance as authAdmin,
    storageAdminInternalInstance as storageAdmin
};
