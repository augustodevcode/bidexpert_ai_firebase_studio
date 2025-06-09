// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountKeyFileName = 'bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json';
// path.resolve assumes the key file is at the root of the project where `npm run dev` is executed.
// process.cwd() should typically be /home/user/studio/
const serviceAccountPath = path.resolve(process.cwd(), serviceAccountKeyFileName);

let adminAppInstance: admin.app.App | null = null;
let sdkInitializationError: Error | null = null;

export async function ensureAdminInitialized(): Promise<{ 
    dbAdmin?: admin.firestore.Firestore, 
    authAdmin?: admin.auth.Auth, 
    storageAdmin?: admin.storage.Storage, 
    error?: Error | null 
}> {
    if (adminAppInstance) {
        // console.log('[Admin SDK] Returning services from existing adminAppInstance.');
        try {
            return {
                dbAdmin: adminAppInstance.firestore(),
                authAdmin: adminAppInstance.auth(),
                storageAdmin: adminAppInstance.storage(),
                error: null,
            };
        } catch (storageAccessError: any) {
            console.warn('[Admin SDK] Error accessing storage service from existing app (OK if storage not used/configured):', storageAccessError.message);
            return {
                dbAdmin: adminAppInstance.firestore(),
                authAdmin: adminAppInstance.auth(),
                storageAdmin: undefined,
                error: null, 
            };
        }
    }

    if (sdkInitializationError) {
        console.warn('[Admin SDK] Initialization previously failed. Returning stored error:', sdkInitializationError.message);
        return { error: sdkInitializationError };
    }

    if (admin.apps.length > 0) {
        console.log('[Admin SDK] Found existing Firebase app(s). Using the first one.');
        adminAppInstance = admin.apps[0]!; // Use the first initialized app
        sdkInitializationError = null; 
        return ensureAdminInitialized(); 
    }

    console.log('[Admin SDK] No Firebase app initialized. Attempting to initialize...');
    console.log(`[Admin SDK] Current working directory (process.cwd()): ${process.cwd()}`);

    let serviceAccount: object | undefined;
    let loadedFrom: string | null = null;

    // Attempt 1: GOOGLE_APPLICATION_CREDENTIALS environment variable
    const credentialsEnvPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsEnvPath) {
        console.log(`[Admin SDK] Attempting to load service account from GOOGLE_APPLICATION_CREDENTIALS: ${credentialsEnvPath}`);
        try {
            if (fs.existsSync(credentialsEnvPath)) {
                const serviceAccountJsonString = fs.readFileSync(credentialsEnvPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountJsonString);
                loadedFrom = `GOOGLE_APPLICATION_CREDENTIALS (${credentialsEnvPath})`;
                console.log('[Admin SDK] Successfully read and parsed service account from GOOGLE_APPLICATION_CREDENTIALS.');
            } else {
                console.warn(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${credentialsEnvPath}`);
            }
        } catch (envError: any) {
            console.warn(`[Admin SDK] Error loading/parsing from GOOGLE_APPLICATION_CREDENTIALS (${credentialsEnvPath}): ${envError.message}`);
        }
    } else {
        console.log('[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS environment variable not set.');
    }

    // Attempt 2: Manual path (if not loaded via env var)
    if (!serviceAccount) {
        console.log(`[Admin SDK] Attempting to load service account from manual path: ${serviceAccountPath}`);
        try {
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccountJsonString = fs.readFileSync(serviceAccountPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountJsonString);
                loadedFrom = `manual path (${serviceAccountPath})`;
                console.log('[Admin SDK] Successfully read and parsed service account from manual path.');
            } else {
                const errorMsg = `Manual service account key file NOT FOUND at: ${serviceAccountPath}.`;
                console.error(`[Admin SDK] CRITICAL ERROR: ${errorMsg}`);
                sdkInitializationError = new Error(errorMsg);
                return { error: sdkInitializationError };
            }
        } catch (manualPathError: any) {
            const errorMsg = `Error loading/parsing from manual path (${serviceAccountPath}): ${manualPathError.message}`;
            console.error(`[Admin SDK] CRITICAL ERROR: ${errorMsg}`);
            sdkInitializationError = new Error(errorMsg);
            return { error: sdkInitializationError };
        }
    }
    
    if (!serviceAccount) {
        const errorMsg = `Service account key could not be loaded from any source.`;
        console.error(`[Admin SDK] CRITICAL ERROR: ${errorMsg}`);
        sdkInitializationError = new Error(errorMsg);
        return { error: sdkInitializationError };
    }

    try {
        adminAppInstance = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // storageBucket: "bidexpert-630df.appspot.com", // Uncomment if using Storage
        });
        
        console.log(`[Admin SDK] Firebase Admin SDK initialized successfully via ${loadedFrom}.`);
        sdkInitializationError = null;
        return ensureAdminInitialized();

    } catch (initError: any) {
        const detailedError = JSON.stringify(initError, Object.getOwnPropertyNames(initError));
        console.error(`[Admin SDK] CRITICAL ERROR during admin.initializeApp(): ${detailedError}`);
        sdkInitializationError = initError;
        return { error: sdkInitializationError };
    }
}

// Export getters that attempt to retrieve services from the initialized app.
// Actions should prefer using instances returned by ensureAdminInitialized.
export const getDbAdmin = (): admin.firestore.Firestore | undefined => {
    if (adminAppInstance) return adminAppInstance.firestore();
    console.warn('[Admin SDK Getter] getDbAdmin called but adminAppInstance is not set.');
    return undefined;
}
export const getAuthAdmin = (): admin.auth.Auth | undefined => {
    if (adminAppInstance) return adminAppInstance.auth();
    console.warn('[Admin SDK Getter] getAuthAdmin called but adminAppInstance is not set.');
    return undefined;
}
export const getStorageAdmin = (): admin.storage.Storage | undefined => {
     if (adminAppInstance) {
        try { 
            return adminAppInstance.storage(); 
        } catch (e: any) {
            console.warn('[Admin SDK Getter] getStorageAdmin: Storage service not available on app instance (OK if not using Storage):', e.message);
            return undefined;
        }
    }
    console.warn('[Admin SDK Getter] getStorageAdmin called but adminAppInstance is not set.');
    return undefined;
}

// For direct use by Server Actions - DEPRECATED in favor of ensureAdminInitialized return values
export const dbAdmin = getDbAdmin();
export const authAdmin = getAuthAdmin();
export const storageAdmin = getStorageAdmin();

