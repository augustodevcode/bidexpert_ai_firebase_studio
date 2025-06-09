
// src/lib/firebase/admin.ts
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue as FirebaseAdminFieldValue,
  Timestamp as FirebaseAdminTimestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage }from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

let adminAppInternalInstance: App | undefined;
let dbAdminInternalInstance: Firestore | undefined;
let authAdminInternalInstance: Auth | undefined;
let storageAdminInternalInstance: Storage | undefined;
let sdkInitializationError: Error | null = null;

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';

export function ensureAdminInitialized(): {
  adminApp?: App; // Renamed for clarity in return
  dbAdmin?: Firestore;
  authAdmin?: Auth;
  storageAdmin?: Storage;
  error?: Error | null;
} {
  if (sdkInitializationError) {
    console.warn('[Admin SDK] Returning previous initialization error:', sdkInitializationError.message);
    return { error: sdkInitializationError };
  }

  if (adminAppInternalInstance && dbAdminInternalInstance && authAdminInternalInstance) {
    // console.log('[Admin SDK] Returning cached instances.');
    return { 
      adminApp: adminAppInternalInstance, 
      dbAdmin: dbAdminInternalInstance, 
      authAdmin: authAdminInternalInstance, 
      storageAdmin: storageAdminInternalInstance, 
      error: null 
    };
  }
  
  console.log('[Admin SDK] Attempting to ensure admin is initialized.');

  let appToUse: App | undefined = undefined;

  if (!getApps().length) {
    console.log('[Admin SDK] No Firebase app initialized. Attempting to initialize a new one.');
    let serviceAccount: object | undefined;
    const credentialsPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    let usedPath: string | undefined = undefined;

    if (credentialsPathFromEnv) {
      console.log(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS is set to: ${credentialsPathFromEnv}`);
      if (fs.existsSync(credentialsPathFromEnv)) {
        try {
          const serviceAccountJsonString = fs.readFileSync(credentialsPathFromEnv, 'utf8');
          serviceAccount = JSON.parse(serviceAccountJsonString);
          usedPath = credentialsPathFromEnv;
          console.log(`[Admin SDK] Successfully loaded service account from GOOGLE_APPLICATION_CREDENTIALS: ${usedPath}`);
        } catch (e: any) {
          sdkInitializationError = new Error(`Failed to load/parse service account from GOOGLE_APPLICATION_CREDENTIALS ('${credentialsPathFromEnv}'): ${e.message}`);
          console.error(`[Admin SDK] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError };
        }
      } else {
        console.warn(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${credentialsPathFromEnv}. Falling back to manual path.`);
      }
    }

    if (!serviceAccount) {
      const manualPath = path.resolve(process.cwd(), serviceAccountKeyFileName);
      console.log(`[Admin SDK] Attempting to load service account from manual path: ${manualPath}`);
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
        sdkInitializationError = new Error(`Service account key file not found. Checked GOOGLE_APPLICATION_CREDENTIALS ('${credentialsPathFromEnv}') and manual path ('${manualPath}'). CWD: ${process.cwd()}`);
        console.error(`[Admin SDK] ${sdkInitializationError.message}`);
        return { error: sdkInitializationError };
      }
    }
    
    if (!serviceAccount) { 
        sdkInitializationError = new Error(`CRITICAL: Service account key JSON could not be loaded from any source. Ensure GOOGLE_APPLICATION_CREDENTIALS is set or ${serviceAccountKeyFileName} is in the project root.`);
        console.error(`[Admin SDK] ${sdkInitializationError.message}`);
        return { error: sdkInitializationError };
    }

    try {
      console.log(`[Admin SDK] Initializing app with service account from: ${usedPath}`);
      appToUse = initializeApp({ credential: cert(serviceAccount) });
      adminAppInternalInstance = appToUse; // Cache the app instance
      console.log('[Admin SDK] Firebase Admin SDK initialized successfully a new app.');
      sdkInitializationError = null; 
    } catch (initError: any) {
      const detailedError = initError.message ? initError.message : JSON.stringify(initError, Object.getOwnPropertyNames(initError));
      console.error(`[Admin SDK] CRITICAL ERROR during initializeApp(): ${detailedError}`);
      sdkInitializationError = new Error(`Firebase Admin SDK initialization failed: ${detailedError}`);
      return { error: sdkInitializationError };
    }
  } else {
    appToUse = getApp();
    adminAppInternalInstance = appToUse; // Cache the app instance
    console.log('[Admin SDK] Using existing Firebase app.');
  }

  if (!appToUse) { // This should ideally not be hit if logic above is correct
     sdkInitializationError = new Error("Firebase Admin App instance is unexpectedly undefined after initialization/getApp attempts.");
     console.error(`[Admin SDK] ${sdkInitializationError.message}`);
     return { error: sdkInitializationError };
  }

  try {
    dbAdminInternalInstance = getFirestore(appToUse);
    authAdminInternalInstance = getAuth(appToUse);
    try {
      storageAdminInternalInstance = getStorage(appToUse);
    } catch (storageError: any) {
      // console.warn('[Admin SDK] Could not initialize Storage (OK if not used):', storageError.message);
      storageAdminInternalInstance = undefined;
    }
    console.log('[Admin SDK] Firestore, Auth, and Storage services obtained.');
  } catch (serviceError: any) {
    console.error(`[Admin SDK] Error obtaining one or more Firebase services: ${serviceError.message}`);
    sdkInitializationError = new Error(`Failed to get Firebase services after app initialization: ${serviceError.message}`);
    return { error: sdkInitializationError };
  }

  return { 
    adminApp: adminAppInternalInstance, 
    dbAdmin: dbAdminInternalInstance, 
    authAdmin: authAdminInternalInstance, 
    storageAdmin: storageAdminInternalInstance,
    error: null 
  };
}

export const FieldValue = FirebaseAdminFieldValue;
export const Timestamp = FirebaseAdminTimestamp;

// These direct exports are for convenience and TYPE EXPORTS ONLY.
// Actions MUST use instances from ensureAdminInitialized() for runtime.
export { 
    adminAppInternalInstance as adminApp,
    dbAdminInternalInstance as dbAdmin,
    authAdminInternalInstance as authAdmin,
    storageAdminInternalInstance as storageAdmin,
};
