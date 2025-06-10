
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
const DEFAULT_APP_NAME = '[DEFAULT]'; // Nome padrão do Firebase Admin App

export function ensureAdminInitialized(): {
  app?: App;
  db?: Firestore;
  auth?: Auth;
  storage?: Storage;
  error?: Error | null;
} {
  console.log('[Admin SDK ensureAdminInitialized] Called.');
  if (sdkInitializationError) {
    console.warn('[Admin SDK ensureAdminInitialized] Returning previous initialization error:', sdkInitializationError.message);
    return { error: sdkInitializationError };
  }

  if (getApps().length > 0) {
    try {
      adminAppInternalInstance = getApp(DEFAULT_APP_NAME); // Tenta pegar o app padrão
      console.log(`[Admin SDK ensureAdminInitialized] Using existing default Firebase app "${DEFAULT_APP_NAME}". Apps count: ${getApps().length}`);
      sdkInitializationError = null; // Reset error if we successfully got an app
    } catch (e) {
      // Se o app padrão não existe, mas outros apps existem, isso pode ser um problema.
      // Por ora, tentaremos inicializar o padrão.
      console.warn(`[Admin SDK ensureAdminInitialized] Default app not found, but other apps exist (count: ${getApps().length}). Attempting to initialize default app.`);
      // Prosseguir para a inicialização
    }
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
        console.log(`[Admin SDK ensureAdminInitialized] Attempting to load from GOOGLE_APPLICATION_CREDENTIALS (resolved path: ${resolvedEnvPath})`);
        if (fs.existsSync(resolvedEnvPath)) {
            try {
                const serviceAccountJsonString = fs.readFileSync(resolvedEnvPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountJsonString);
                usedPath = resolvedEnvPath;
                console.log(`[Admin SDK ensureAdminInitialized] Successfully loaded service account from GOOGLE_APPLICATION_CREDENTIALS: ${usedPath}`);
            } catch (e: any) {
                console.warn(`[Admin SDK ensureAdminInitialized] Failed to load/parse service account from GOOGLE_APPLICATION_CREDENTIALS ('${resolvedEnvPath}'): ${e.message}. Will try manual path next.`);
            }
        } else {
             console.warn(`[Admin SDK ensureAdminInitialized] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${resolvedEnvPath}. Will attempt manual path next.`);
        }
    } else {
      console.log(`[Admin SDK ensureAdminInitialized] GOOGLE_APPLICATION_CREDENTIALS is NOT set. Attempting manual path.`);
    }

    if (!serviceAccount) {
      const manualPath = path.resolve(currentCwd, serviceAccountKeyFileName);
      console.log(`[Admin SDK ensureAdminInitialized] Attempting manual path: ${manualPath}`);
      if (fs.existsSync(manualPath)) {
        try {
          const serviceAccountJsonString = fs.readFileSync(manualPath, 'utf8');
          serviceAccount = JSON.parse(serviceAccountJsonString);
          usedPath = manualPath;
          console.log(`[Admin SDK ensureAdminInitialized] Successfully loaded service account from manual path: ${usedPath}`);
        } catch (e: any) {
          sdkInitializationError = new Error(`Failed to load/parse service account from manual path ('${manualPath}'): ${e.message}`);
          console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
          return { error: sdkInitializationError };
        }
      } else {
        sdkInitializationError = new Error(`Service account key file not found. Checked GOOGLE_APPLICATION_CREDENTIALS and manual path ('${manualPath}'). CWD: ${currentCwd}`);
        console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
        return { error: sdkInitializationError };
      }
    }
    
    if (!serviceAccount) { 
        sdkInitializationError = new Error(`CRITICAL: Service account JSON could not be loaded after all attempts. Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly OR '${serviceAccountKeyFileName}' is in the project root.`);
        console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
        return { error: sdkInitializationError };
    }

    try {
      console.log(`[Admin SDK ensureAdminInitialized] Initializing default app with service account from: ${usedPath}`);
      // Sempre tenta inicializar o app PADRÃO. Se já existir (pego acima), não fará nada.
      // Se não existir, irá criar.
      adminAppInternalInstance = initializeApp({ credential: cert(serviceAccount) });
      console.log(`[Admin SDK ensureAdminInitialized] Firebase Admin SDK initialized successfully (default app). Apps count: ${getApps().length}`);
      sdkInitializationError = null; 
    } catch (initError: any) {
      if (initError.code === 'app/duplicate-app') {
        console.warn(`[Admin SDK ensureAdminInitialized] Attempted to initialize default app but it already exists. Trying to get it.`);
        adminAppInternalInstance = getApp(DEFAULT_APP_NAME);
        sdkInitializationError = null; // Se conseguimos pegar, o erro de duplicata não é fatal.
      } else {
        const detailedError = initError.message ? initError.message : JSON.stringify(initError, Object.getOwnPropertyNames(initError));
        console.error(`[Admin SDK ensureAdminInitialized] CRITICAL ERROR during initializeApp(): ${detailedError}`);
        sdkInitializationError = new Error(`Failed Firebase Admin SDK initialization: ${detailedError}`);
        return { error: sdkInitializationError };
      }
    }
  }


  if (adminAppInternalInstance) {
    console.log(`[Admin SDK ensureAdminInitialized] Using app: ${adminAppInternalInstance.name}`);
    dbAdminInternalInstance = getFirestore(adminAppInternalInstance);
    authAdminInternalInstance = getAuth(adminAppInternalInstance);
    try {
      storageAdminInternalInstance = getStorage(adminAppInternalInstance);
    } catch (storageError: any) {
      console.warn('[Admin SDK ensureAdminInitialized] Could not initialize Storage Admin (OK if not used):', storageError.message);
      storageAdminInternalInstance = undefined; 
    }
    console.log('[Admin SDK ensureAdminInitialized] Service instances (db, auth, storage) obtained/verified.');
  } else {
    if (!sdkInitializationError) {
        sdkInitializationError = new Error('Admin app instance is unexpectedly undefined after initialization block, and no prior error was set.');
        console.error(`[Admin SDK ensureAdminInitialized] ${sdkInitializationError.message}`);
    }
    return { error: sdkInitializationError };
  }
  
  return { 
    app: adminAppInternalInstance, 
    db: dbAdminInternalInstance, 
    auth: authAdminInternalInstance, 
    storage: storageAdminInternalInstance,
    error: sdkInitializationError 
  };
}

export const FieldValue = FirebaseAdminFieldValue;
export const Timestamp = FirebaseAdminTimestamp;

// Export as potentially undefined if initialization fails
export let dbAdmin: Firestore | undefined = dbAdminInternalInstance;
export let authAdmin: Auth | undefined = authAdminInternalInstance;
export let storageAdmin: Storage | undefined = storageAdminInternalInstance;

// Re-assign after initialization attempt to ensure exports are up-to-date
(() => {
  const result = ensureAdminInitialized();
  dbAdmin = result.db;
  authAdmin = result.auth;
  storageAdmin = result.storage;
})();
