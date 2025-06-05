
'use server';

import admin from 'firebase-admin';
// Using require for firestore functions as a workaround for potential Turbopack/ESM issues
const firestoreFunctions = require('firebase-admin/firestore');
import { revalidatePath } from 'next/cache';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv';

config(); // Load .env file

let db: admin.firestore.Firestore;
let adminInitialized = false;

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/',
};

function initializeAdminSDK() {
  if (adminInitialized && db) {
    console.log("Firebase Admin SDK and Firestore DB instance already initialized (settings/actions).");
    return;
  }

  if (admin.apps.length === 0) {
    console.log("Attempting to initialize Firebase Admin SDK (settings/actions)...");
    try {
      // Try with GOOGLE_APPLICATION_CREDENTIALS (implicitly)
      admin.initializeApp();
      console.log("Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS (settings/actions).");
      adminInitialized = true;
    } catch (error: any) {
      if (error.code === 'app/no-app' && error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
        console.warn("GOOGLE_APPLICATION_CREDENTIALS not set or failed. Trying FIREBASE_ADMIN_SDK_PATH (settings/actions).");
        const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
        if (serviceAccountPath) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin SDK initialized using FIREBASE_ADMIN_SDK_PATH (settings/actions).");
            adminInitialized = true;
          } catch (e: any) {
            console.error("Falha ao inicializar Firebase Admin SDK com FIREBASE_ADMIN_SDK_PATH (settings/actions):", (e as Error).message);
            // adminInitialized remains false
          }
        } else {
          console.warn("FIREBASE_ADMIN_SDK_PATH not set. Admin SDK potentially not initialized (settings/actions).");
           // adminInitialized remains false
        }
      } else if (error.code !== 'app/app-already-exists') {
         console.error("Falha desconhecida ao inicializar Firebase Admin SDK (settings/actions).", error);
         // adminInitialized remains false
      } else {
         console.log("Firebase Admin SDK already initialized by a previous call (settings/actions).");
         adminInitialized = true; 
      }
    }
  } else {
    console.log("Firebase Admin SDK already initialized (settings/actions).");
    adminInitialized = true;
  }

  if (adminInitialized) {
    try {
        db = firestoreFunctions.getFirestore();
        if (db) {
          console.log("Firestore Admin DB instance OBTAINED successfully (settings/actions). Project ID from DB:", db.projectId, "Database ID:", db.databaseId);
        } else {
          console.error("CRITICAL: firestoreFunctions.getFirestore() returned null/undefined even after SDK init (settings/actions).");
          adminInitialized = false; 
        }
    } catch (e: any) {
        console.error("CRITICAL: Failed to obtain Firestore Admin DB instance after SDK init (settings/actions):", e.message);
        adminInitialized = false;
    }
  }
  
  if (!adminInitialized || !db) {
    const errorMessage = "CRITICAL: Firebase Admin SDK could not be initialized OR Firestore DB instance could not be obtained in settings/actions.ts. Platform settings operations WILL FAIL. Ensure Firestore is enabled in your Firebase project in Native mode, and check server logs for credential errors (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_SDK_PATH).";
    console.error(errorMessage);
    // Not throwing here to allow functions to potentially return defaults, but operations will likely fail.
  }
}

initializeAdminSDK(); // Call initialization when the module is loaded

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  
  // Check for Firestore Timestamp from firebase-admin (might have _seconds, _nanoseconds, or toDate method)
  if (timestampField instanceof admin.firestore.Timestamp || (timestampField && typeof timestampField.toDate === 'function')) {
    return timestampField.toDate();
  }
  // Handle plain objects that might represent Timestamps (less common with latest admin SDK but good for robustness)
  if (timestampField && typeof timestampField._seconds === 'number' && typeof timestampField._nanoseconds === 'number') {
    return new admin.firestore.Timestamp(timestampField._seconds, timestampField._nanoseconds).toDate();
  }
   // Check if it's already a Date object
  if (timestampField instanceof Date) return timestampField;

  // Try to parse if it's a string or number that can be converted
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  
  console.warn(`Could not convert platform settings timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!db) {
    console.error("[Server Action - getPlatformSettings] Firestore DB not initialized or initialization failed. Returning default settings. Check server startup logs for credential/initialization errors.");
    return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
  }
  try {
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await settingsDocRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) {
        console.warn('Global settings document exists but contains no data (settings/actions). Returning default settings.');
        return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
      }
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath ?? defaultSettings.galleryImageBasePath,
        updatedAt: safeConvertToDate(data.updatedAt),
      };
    } else {
      console.log('No global settings found in Firestore, creating with defaults (settings/actions).');
      const initialSettingsForFirestore = {
        ...defaultSettings,
        updatedAt: firestoreFunctions.serverTimestamp(),
      };
      await settingsDocRef.set(initialSettingsForFirestore);
      console.log('Default settings created in Firestore.');
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), // Approximate for immediate return
      };
    }
  } catch (error: any) {
    // Improved error logging
    console.error("[Server Action - getPlatformSettings] Firestore operation failed.");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Error Details:", error.details);
    // console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Add a specific check for 'NOT_FOUND' errors that might indicate database not provisioned
    if (error.code === 5 || (typeof error.message === 'string' && error.message.includes('NOT_FOUND'))) {
        console.error("This 'NOT_FOUND' error might indicate that the Firestore database is not enabled in Native Mode for your project, or the Admin SDK is not properly configured with credentials for the correct project.");
    }
    
    console.log("[Server Action - getPlatformSettings] Returning default settings due to error.");
    return {
      id: GLOBAL_SETTINGS_DOC_ID,
      ...defaultSettings,
      updatedAt: new Date(),
    };
  }
}

export async function updatePlatformSettings(
  data: PlatformSettingsFormData
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    const errMsg = 'Erro de Configuração: Banco de dados não inicializado. Verifique os logs do servidor para erros de credencial ou inicialização do Firebase Admin SDK.';
    console.error(`[Server Action - updatePlatformSettings] ${errMsg}`);
    return { success: false, message: errMsg };
  }
  if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
    return { success: false, message: 'O caminho base da galeria de imagens deve começar e terminar com uma barra "/" (ex: /uploads/media/).' };
  }

  try {
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id' | 'createdAt'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: firestoreFunctions.serverTimestamp(),
    };

    await settingsDocRef.set(updateData, { merge: true }); 
    
    revalidatePath('/admin/settings');
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updatePlatformSettings] Firestore operation failed.");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Error Details:", error.details);

    if (error.code === 7 || (typeof error.message === 'string' && error.message.toLowerCase().includes('permission denied'))) {
        return { success: false, message: 'Erro de Permissão: Falha ao atualizar configurações. Verifique as permissões da conta de serviço do Firebase Admin SDK (IAM) ou a configuração das credenciais no ambiente do servidor.' };
    }
     if (error.code === 5 || (typeof error.message === 'string' && error.message.includes('NOT_FOUND'))) {
        console.error("This 'NOT_FOUND' error during update might indicate issues with Firestore database provisioning or incorrect project configuration for the Admin SDK.");
        return { success: false, message: 'Erro: Recurso não encontrado. Verifique se o Firestore está habilitado em modo Nativo e se as credenciais do Admin SDK estão corretas.' };
    }
    return { success: false, message: (error as Error).message || 'Falha ao atualizar configurações da plataforma.' };
  }
}
