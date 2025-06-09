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
    // If already successfully initialized, return services from the stored app instance
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
            return { // Still return db and auth
                dbAdmin: adminAppInstance.firestore(),
                authAdmin: adminAppInstance.auth(),
                storageAdmin: undefined,
                error: null, // Not an initialization error per se
            };
        }
    }

    // If a fatal initialization error occurred previously, don't retry, return the error
    if (sdkInitializationError) {
        console.warn('[Admin SDK] Initialization previously failed. Returning stored error:', sdkInitializationError.message);
        return { error: sdkInitializationError };
    }

    // Check if Firebase Admin SDK already has an initialized app (e.g., by another part of the system or a previous call)
    if (admin.apps.length > 0) {
        console.log('[Admin SDK] Found existing Firebase app(s). Using the first one.');
        adminAppInstance = admin.apps[0]!; // Use the first initialized app
        sdkInitializationError = null; // Clear any potential previous error state if an app is found
        return ensureAdminInitialized(); // Recurse once to get services from the now-set adminAppInstance
    }

    console.log('[Admin SDK] No Firebase app initialized. Attempting to initialize...');
    try {
        const credentialsEnvPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        let serviceAccountJsonString;
        let usingEnvVar = false;

        if (credentialsEnvPath) {
            console.log(`[Admin SDK] Attempting to use GOOGLE_APPLICATION_CREDENTIALS: ${credentialsEnvPath}`);
            if (!fs.existsSync(credentialsEnvPath)) {
                const errorMsg = `GOOGLE_APPLICATION_CREDENTIALS path does not exist: ${credentialsEnvPath}. Current working directory: ${process.cwd()}`;
                console.error(`[Admin SDK] ERROR: ${errorMsg}`);
                // Don't set sdkInitializationError here, allow fallback to manual path if desired
            } else {
                serviceAccountJsonString = fs.readFileSync(credentialsEnvPath, 'utf8');
                usingEnvVar = true;
                console.log('[Admin SDK] Successfully read service account from GOOGLE_APPLICATION_CREDENTIALS.');
            }
        }
        
        if (!serviceAccountJsonString) {
            console.log(`[Admin SDK] GOOGLE_APPLICATION_CREDENTIALS not used or failed. Attempting manual path: ${serviceAccountPath}`);
            if (!fs.existsSync(serviceAccountPath)) {
                const errorMsg = `Manual service account key file NOT FOUND at: ${serviceAccountPath}. Current working directory: ${process.cwd()}`;
                console.error(`[Admin SDK] CRITICAL ERROR: ${errorMsg}`);
                sdkInitializationError = new Error(errorMsg); // Set permanent error
                return { error: sdkInitializationError };
            }
            serviceAccountJsonString = fs.readFileSync(serviceAccountPath, 'utf8');
            console.log('[Admin SDK] Successfully read service account from manual path.');
        }
        
        const serviceAccount = JSON.parse(serviceAccountJsonString);

        adminAppInstance = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // If you use Firebase Storage, uncomment and set your bucket name:
            // storageBucket: "bidexpert-630df.appspot.com",
        });
        
        console.log('[Admin SDK] Firebase Admin SDK initialized successfully via', usingEnvVar ? 'env variable.' : 'manual path.');
        sdkInitializationError = null; // Clear any prior error state on successful init
        
        // Call itself again to get the services from the now initialized adminAppInstance
        return ensureAdminInitialized();

    } catch (error: any) {
        const detailedError = JSON.stringify(error, Object.getOwnPropertyNames(error));
        console.error(`[Admin SDK] CRITICAL ERROR during Firebase Admin SDK initialization: ${detailedError}`);
        sdkInitializationError = error; // Set permanent error
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
