// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Path to your service account key file relative to this module file
// Adjust the number of '../' based on the actual location of the key file relative to src/lib/firebase/
const serviceAccountPath = path.resolve(__dirname, '/home/user/studio/bidexpert-630df-firebase-adminsdk-fbsvc-a827189ca4.json');

let dbAdmin: admin.firestore.Firestore | undefined;
let authAdmin: admin.auth.Auth | undefined;
let storageAdmin: admin.storage.Storage | undefined;
let isInitializing = false;

export async function ensureAdminInitialized(): Promise<{ dbAdmin: admin.firestore.Firestore | undefined, authAdmin: admin.auth.Auth | undefined, storageAdmin: admin.storage.Storage | undefined }> {
    // Check if an app is already initialized
    if (admin.apps.length > 0) {
        console.log('[Admin SDK] Firebase Admin SDK already initialized.');
        const app = admin.apps[0];
        dbAdmin = app.firestore();
        authAdmin = app.auth();
        try {
            storageAdmin = app.storage();
        } catch (e) {
            console.warn('[Admin SDK] Storage Admin not available:', e);
            storageAdmin = undefined;
        }
        return { dbAdmin, authAdmin, storageAdmin };
    }

    // If initialization is already in progress, wait for it to complete
    if (isInitializing) {
        console.log('[Admin SDK] Initialization already in progress. Waiting...');
        // Simple polling mechanism to wait for initialization to finish
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
        return ensureAdminInitialized(); // Check again
    }

    // Start initialization
    isInitializing = true;
    console.log('[Admin SDK] Initializing Firebase Admin SDK...');

    // Verify service account file exists
    if (!fs.existsSync(serviceAccountPath)) {
        console.error(`[Admin SDK] CRITICAL ERROR: Service account key file NOT FOUND at: ${serviceAccountPath}`);
        console.error('[Admin SDK] Please ensure the file name is correct and it exists relative to this module.');
        isInitializing = false; // Reset flag
        return { dbAdmin: undefined, authAdmin: undefined, storageAdmin: undefined };
    }

    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: 'YOUR_DATABASE_URL', // Add if using Realtime Database
            // storageBucket: 'YOUR_STORAGE_BUCKET_URL' // Add if using Cloud Storage and need default bucket
        });
        console.log('[Admin SDK] Firebase Admin SDK initialized successfully.');

        dbAdmin = app.firestore();
        authAdmin = app.auth();
         try {
            storageAdmin = app.storage();
        } catch (e) {
            console.warn('[Admin SDK] Storage Admin not available after init:', e);
            storageAdmin = undefined;
        }


        isInitializing = false; // Reset flag
        return { dbAdmin, authAdmin, storageAdmin };

    } catch (error: any) {
        console.error('[Admin SDK] CRITICAL ERROR during Admin SDK initialization:', error);
        isInitializing = false; // Reset flag
        return { dbAdmin: undefined, authAdmin: undefined, storageAdmin: undefined };
    }
}

// Export the variables. They will be undefined initially and populated after ensureAdminInitialized is called.
export { dbAdmin, authAdmin, storageAdmin };