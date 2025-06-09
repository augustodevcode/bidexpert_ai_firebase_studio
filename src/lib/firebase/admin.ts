// src/lib/firebase/admin.ts
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue as FirebaseAdminFieldValue, // Renomeado para evitar conflito de exportação direta
  Timestamp as FirebaseAdminTimestamp,    // Renomeado para evitar conflito de exportação direta
  type Firestore,
} from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;
let dbAdminInstance: Firestore;
let authAdminInstance: Auth;
let storageAdminInstance: Storage | undefined; // Storage é opcional
let sdkInitializationError: Error | null = null;

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
const serviceAccountPathFromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const manualServiceAccountPath = path.resolve(process.cwd(), serviceAccountKeyFileName);

export function ensureAdminInitialized(): {
  adminAppInstance?: App;
  dbAdmin?: Firestore;
  authAdmin?: Auth;
  storageAdmin?: Storage;
  error?: Error | null;
} {
  if (sdkInitializationError) {
    // console.warn('[Admin SDK] Returning previous initialization error:', sdkInitializationError.message);
    return { error: sdkInitializationError };
  }

  if (!getApps().length) {
    let serviceAccount: object | undefined;
    let loadedFrom: string | null = null;

    console.log(`[Admin SDK] No Firebase app initialized. Attempting to initialize... CWD: ${process.cwd()}`);

    if (serviceAccountPathFromEnv) {
      console.log(`[Admin SDK] Attempting to load from GOOGLE_APPLICATION_CREDENTIALS: ${serviceAccountPathFromEnv}`);
      try {
        if (fs.existsSync(serviceAccountPathFromEnv)) {
          const serviceAccountJsonString = fs.readFileSync(serviceAccountPathFromEnv, 'utf8');
          serviceAccount = JSON.parse(serviceAccountJsonString);
          loadedFrom = `GOOGLE_APPLICATION_CREDENTIALS (${serviceAccountPathFromEnv})`;
        } else {
          console.warn(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${serviceAccountPathFromEnv}`);
        }
      } catch (envError: any) {
        console.warn(`[Admin SDK] Error loading/parsing from GOOGLE_APPLICATION_CREDENTIALS (${serviceAccountPathFromEnv}): ${envError.message}`);
      }
    } else {
      console.log('[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS not set. Attempting manual path.');
      try {
        if (fs.existsSync(manualServiceAccountPath)) {
          const serviceAccountJsonString = fs.readFileSync(manualServiceAccountPath, 'utf8');
          serviceAccount = JSON.parse(serviceAccountJsonString);
          loadedFrom = `manual path (${manualServiceAccountPath})`;
        } else {
          const errorMsg = `Manual service account key file NOT FOUND at: ${manualServiceAccountPath}. process.env.GOOGLE_APPLICATION_CREDENTIALS was also not set or invalid.`;
          console.error(`[Admin SDK] CRITICAL ERROR: ${errorMsg}`);
          sdkInitializationError = new Error(errorMsg);
          return { error: sdkInitializationError };
        }
      } catch (manualPathError: any) {
        const errorMsg = `Error loading/parsing from manual path (${manualServiceAccountPath}): ${manualPathError.message}`;
        console.error(`[Admin SDK] CRITICAL ERROR: ${errorMsg}`);
        sdkInitializationError = new Error(errorMsg);
        return { error: sdkInitializationError };
      }
    }
    
    if (!serviceAccount) {
        const errorMsg = `CRITICAL: Service account key JSON could not be loaded from any source. GOOGLE_APPLICATION_CREDENTIALS: '${serviceAccountPathFromEnv}', Manual Path: '${manualServiceAccountPath}'.`;
        console.error(`[Admin SDK] ${errorMsg}`);
        sdkInitializationError = new Error(errorMsg);
        return { error: sdkInitializationError };
    }

    try {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        // storageBucket: "bidexpert-630df.appspot.com", // Uncomment if you use Storage
      });
      console.log(`[Admin SDK] Firebase Admin SDK initialized successfully via ${loadedFrom}.`);
      sdkInitializationError = null; // Clear any previous error on success
    } catch (initError: any) {
      const detailedError = JSON.stringify(initError, Object.getOwnPropertyNames(initError));
      console.error(`[Admin SDK] CRITICAL ERROR during initializeApp(): ${detailedError}`);
      sdkInitializationError = initError;
      return { error: sdkInitializationError };
    }
  } else {
    adminApp = getApp();
    // console.log('[Admin SDK] Using existing Firebase app.');
  }

  // Lazy initialization of services
  dbAdminInstance ??= getFirestore(adminApp);
  authAdminInstance ??= getAuth(adminApp);
  try {
    storageAdminInstance ??= getStorage(adminApp);
  } catch (storageError: any) {
    // Storage might not be enabled for the project, which is fine if not used.
    // console.warn('[Admin SDK] Could not initialize Storage service (this is OK if Storage is not used):', storageError.message);
    storageAdminInstance = undefined; 
  }

  return { 
    adminAppInstance: adminApp, 
    dbAdmin: dbAdminInstance, 
    authAdmin: authAdminInstance, 
    storageAdmin: storageAdminInstance,
    error: null 
  };
}

// Export FieldValue and Timestamp directly for use in server actions
export const FieldValue = FirebaseAdminFieldValue;
export const Timestamp = FirebaseAdminTimestamp;

// Export the lazily-initialized instances
// Note: These will be undefined until ensureAdminInitialized() is called successfully at least once.
// Server actions should always call ensureAdminInitialized() and use the returned instances.
export { dbAdminInstance as dbAdmin, authAdminInstance as authAdmin, storageAdminInstance as storageAdmin };
