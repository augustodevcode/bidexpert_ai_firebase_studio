
'use server';

import admin from 'firebase-admin';
// Use require for Firestore functions to ensure compatibility with Turbopack/Next.js server environments
const firestoreFunctions = require('firebase-admin/firestore');

import { revalidatePath } from 'next/cache';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv';

config(); // Load .env file

let db: admin.firestore.Firestore;
let adminInitialized = false;

function initializeAdminSDK() {
  if (adminInitialized) {
    if (!db) {
        // This case should ideally not happen if adminInitialized is true
        console.warn("Admin SDK was marked initialized but Firestore DB instance is missing. Re-initializing.");
        try {
            db = firestoreFunctions.getFirestore();
            console.log("Re-obtained Firestore Admin DB instance (settings/actions).");
        } catch (e:any) {
            console.error("Failed to re-obtain Firestore Admin DB instance after re-check:", e.message);
            // Consider re-throwing or handling more gracefully if this state is critical
        }
    }
    return;
  }

  if (admin.apps.length === 0) {
    console.log("Attempting to initialize Firebase Admin SDK (settings/actions)...");
    try {
      // Attempt 1: GOOGLE_APPLICATION_CREDENTIALS (preferred for deployed environments)
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
          }
        } else {
          console.warn("FIREBASE_ADMIN_SDK_PATH not set. Admin SDK not initialized (settings/actions).");
        }
      } else if (error.code !== 'app/app-already-exists') { // Should not happen if admin.apps.length === 0
        console.error("Falha desconhecida ao inicializar Firebase Admin SDK (settings/actions).", error);
      } else {
         // Already initialized by another import, which is fine.
         console.log("Firebase Admin SDK already initialized (settings/actions).");
         adminInitialized = true;
      }
    }
  } else {
    console.log("Firebase Admin SDK already initialized by a previous call (settings/actions).");
    adminInitialized = true;
  }

  if (adminInitialized) {
    try {
        db = firestoreFunctions.getFirestore();
        console.log("Firestore Admin DB instance obtained (settings/actions).");
    } catch (e: any) {
        console.error("Failed to obtain Firestore Admin DB instance even after SDK initialization:", e.message);
        adminInitialized = false; // Mark as not truly initialized if db fails
    }
  }

  if (!adminInitialized || !db) {
    const errorMessage = "Firebase Admin SDK or Firestore DB could not be initialized. Platform settings operations will likely fail. Check server logs for details on credential errors (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_SDK_PATH).";
    console.error(errorMessage);
    // Not throwing here to allow the app to potentially run other parts,
    // but functions below will check `db` and fail gracefully.
  }
}

initializeAdminSDK(); // Call it once when the module loads

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof admin.firestore.Timestamp || 
      (timestampField && typeof timestampField.toDate === 'function')) { // Check for Firestore Timestamp specifically for admin SDK
    return timestampField.toDate();
  }
  // Handle cases where it might already be a Date or a string/number representation
  if (typeof timestampField === 'object' && timestampField !== null &&
      (typeof timestampField.seconds === 'number' || typeof (timestampField as any)._seconds === 'number') && 
      (typeof timestampField.nanoseconds === 'number' || typeof (timestampField as any)._nanoseconds === 'number')
  ) {
    const seconds = typeof timestampField.seconds === 'number' ? timestampField.seconds : (timestampField as any)._seconds;
    const nanoseconds = typeof timestampField.nanoseconds === 'number' ? timestampField.nanoseconds : (timestampField as any)._nanoseconds;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert platform settings timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/',
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!db) {
    console.error("[Server Action - getPlatformSettings] Firestore DB not initialized. Returning default settings.");
    return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
  }
  try {
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await firestoreFunctions.getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data) {
        console.warn('Global settings document exists but contains no data (settings/actions).');
        return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
      }
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath ?? defaultSettings.galleryImageBasePath,
        updatedAt: safeConvertToDate(data.updatedAt),
      } as PlatformSettings;
    } else {
      console.log('No global settings found, creating with defaults (settings/actions).');
      const initialSettingsForFirestore = {
        ...defaultSettings,
        updatedAt: firestoreFunctions.serverTimestamp(), 
      };
      await firestoreFunctions.setDoc(settingsDocRef, initialSettingsForFirestore);
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), 
      };
    }
  } catch (error: any) {
    console.error("[Server Action - getPlatformSettings] Error:", error);
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
    return { success: false, message: 'Erro de Configuração: Banco de dados não inicializado. Verifique os logs do servidor.' };
  }
  if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
    return { success: false, message: 'O caminho base da galeria de imagens deve começar e terminar com uma barra "/" (ex: /uploads/media/).' };
  }

  try {
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: firestoreFunctions.serverTimestamp(),
    };

    const docSnap = await firestoreFunctions.getDoc(settingsDocRef);
    if (docSnap.exists()) {
        await firestoreFunctions.updateDoc(settingsDocRef, updateData);
    } else {
        await firestoreFunctions.setDoc(settingsDocRef, updateData, { merge: true });
    }

    revalidatePath('/admin/settings');
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updatePlatformSettings] Error:", error);
    if ((error as any).code === 'permission-denied' || (error as Error).message?.includes('permission-denied')) {
        return { success: false, message: 'Erro de Permissão: Falha ao atualizar configurações. Verifique as permissões do Firebase Admin SDK (IAM) ou a configuração das credenciais no ambiente do servidor.' };
    }
    return { success: false, message: (error as Error).message || 'Falha ao atualizar configurações da plataforma.' };
  }
}

    