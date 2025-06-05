
'use server';

import admin from 'firebase-admin'; // Importar o namespace principal
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
            db = admin.firestore(); // Usar admin.firestore()
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
        db = admin.firestore(); // Usar admin.firestore()
        console.log("Firestore Admin DB instance obtained (settings/actions).");
    } catch (e: any) {
        console.error("Failed to obtain Firestore Admin DB instance even after SDK initialization (settings/actions):", e.message);
        adminInitialized = false; 
    }
  }
  
  if (!adminInitialized || !db) {
    const errorMessage = "CRITICAL: Firebase Admin SDK or Firestore DB could not be initialized in settings/actions.ts. Platform settings operations WILL FAIL. Check server logs for credential errors (GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_SDK_PATH).";
    console.error(errorMessage);
    // Para tornar claro na UI também se isso rodar durante uma requisição:
    // throw new Error(errorMessage); 
  }
}

initializeAdminSDK(); // Chamar a inicialização quando o módulo é carregado

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  
  // Check for Firestore Timestamp from firebase-admin (might have _seconds, _nanoseconds, or toDate method)
  if (timestampField instanceof admin.firestore.Timestamp) {
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


const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/',
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!db) { // Verificação adicional para garantir que db está inicializado
    console.error("[Server Action - getPlatformSettings] Firestore DB not initialized. Returning default settings.");
    return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
  }
  try {
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await settingsDocRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) { // Adicionado para cobrir o caso onde o documento existe mas está vazio
        console.warn('Global settings document exists but contains no data (settings/actions). Returning default settings.');
        return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
      }
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath ?? defaultSettings.galleryImageBasePath,
        updatedAt: safeConvertToDate(data.updatedAt), // data.updatedAt virá como admin.firestore.Timestamp
      } as PlatformSettings;
    } else {
      console.log('No global settings found, creating with defaults (settings/actions).');
      const initialSettingsForFirestore = {
        ...defaultSettings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Usar admin.firestore.FieldValue
      };
      await settingsDocRef.set(initialSettingsForFirestore);
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), // Approximate for immediate return
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
  if (!db) { // Verificação adicional
    return { success: false, message: 'Erro de Configuração: Banco de dados não inicializado. Verifique os logs do servidor.' };
  }
  if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
    return { success: false, message: 'O caminho base da galeria de imagens deve começar e terminar com uma barra "/" (ex: /uploads/media/).' };
  }

  try {
    const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Usar admin.firestore.FieldValue
    };

    // Em vez de get() then set/update, podemos usar set com {merge: true} ou diretamente update
    // Se o documento não existir, update falhará. set com merge:true criará ou mesclará.
    // Para este caso, getPlatformSettings já deve ter criado o doc se não existia, então update é seguro.
    const docSnap = await settingsDocRef.get();
    if (docSnap.exists()) {
        await settingsDocRef.update(updateData);
    } else {
        // Este caso não deveria acontecer se getPlatformSettings foi chamado antes,
        // mas como fallback, criamos o documento.
        await settingsDocRef.set(updateData, { merge: true });
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
