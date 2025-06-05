
'use server';

import admin from 'firebase-admin';
// Use CJS require and destructuring for Firestore functions
const { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp // Import Timestamp for type checking and direct use if needed
} = require('firebase-admin/firestore');

import { revalidatePath } from 'next/cache';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv';

config(); // Load .env file

let db: admin.firestore.Firestore;
let adminInitialized = false;

function initializeAdminSDK() {
  if (adminInitialized) {
    if (!db) {
        console.warn("Admin SDK was marked initialized but Firestore DB instance is missing (settings/actions). Attempting to re-obtain.");
        try {
            db = getFirestore(); // Uses destructured getFirestore
            console.log("Re-obtained Firestore Admin DB instance (settings/actions).");
        } catch (e:any) {
            console.error("Failed to re-obtain Firestore Admin DB instance after re-check (settings/actions):", e.message);
        }
    }
    return;
  }

  if (admin.apps.length === 0) {
    console.log("Attempting to initialize Firebase Admin SDK (settings/actions)...");
    try {
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
      } else if (error.code !== 'app/app-already-exists') {
        console.error("Falha desconhecida ao inicializar Firebase Admin SDK (settings/actions).", error);
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
        db = getFirestore(); // Uses destructured getFirestore
        console.log("Firestore Admin DB instance obtained (settings/actions).");
    } catch (e: any) {
        console.error("Failed to obtain Firestore Admin DB instance even after SDK initialization (settings/actions):", e.message);
        adminInitialized = false; 
    }
  }

  if (!adminInitialized || !db) {
    const errorMessage = "CRITICAL: Firebase Admin SDK or Firestore DB could not be initialized in settings/actions.ts. Platform settings operations WILL FAIL. Check server logs for credential errors (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_SDK_PATH).";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

initializeAdminSDK();

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof Timestamp || (timestampField && typeof timestampField.toDate === 'function')) {
    return timestampField.toDate();
  }
  if (timestampField instanceof Date) return timestampField;
  if (typeof timestampField === 'object' && timestampField !== null &&
      (typeof timestampField.seconds === 'number' || typeof (timestampField as any)._seconds === 'number') && 
      (typeof timestampField.nanoseconds === 'number' || typeof (timestampField as any)._nanoseconds === 'number')
  ) {
    const seconds = typeof timestampField.seconds === 'number' ? timestampField.seconds : (timestampField as any)._seconds;
    const nanoseconds = typeof timestampField.nanoseconds === 'number' ? timestampField.nanoseconds : (timestampField as any)._nanoseconds;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
  }
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
    // doc and getDoc are now from the CJS require and destructured
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);

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
        updatedAt: serverTimestamp(), // Uses destructured serverTimestamp
      };
      await setDoc(settingsDocRef, initialSettingsForFirestore); // Uses destructured setDoc
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
    // doc is now from the CJS require and destructured
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: serverTimestamp(), // Uses destructured serverTimestamp
    };

    const docSnap = await getDoc(settingsDocRef); // Uses destructured getDoc
    if (docSnap.exists()) {
        await updateDoc(settingsDocRef, updateData); // Uses destructured updateDoc
    } else {
        await setDoc(settingsDocRef, updateData, { merge: true }); // Uses destructured setDoc
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
