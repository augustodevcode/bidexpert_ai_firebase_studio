
'use server';

import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';
// Use named imports for Firestore functions
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  // FieldValue // Not used if serverTimestamp is used directly
} from 'firebase-admin/firestore';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv';

config();

// --- INÍCIO: Lógica de Inicialização do Firebase Admin SDK ---
// Esta lógica garante que o Admin SDK seja inicializado apenas uma vez.
if (admin.apps.length === 0) {
  try {
    // Tenta inicializar com GOOGLE_APPLICATION_CREDENTIALS se estiver definida
    admin.initializeApp();
    console.log("Firebase Admin SDK inicializado usando GOOGLE_APPLICATION_CREDENTIALS (settings/actions).");
  } catch (error: any) {
    // Se GOOGLE_APPLICATION_CREDENTIALS não estiver definida ou falhar, tenta com o caminho do .env
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
    if (serviceAccountPath) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK inicializado usando FIREBASE_ADMIN_SDK_PATH (settings/actions).");
      } catch (e: any)        {
        console.error("Falha ao inicializar Firebase Admin SDK com FIREBASE_ADMIN_SDK_PATH (settings/actions):", (e as Error).message);
        // Não encerra o processo aqui, pode ser que o erro original fosse por outro motivo
      }
    } else if (error.code === 'app/no-app' && error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
        // Este erro específico é comum se as credenciais não forem encontradas.
        console.warn("Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS não definida e FIREBASE_ADMIN_SDK_PATH não fornecida (settings/actions). As operações do Admin SDK provavelmente falharão.");
    } else if (error.code !== 'app/app-already-exists'){ // Não mostrar erro se já estiver inicializado por outro meio
      console.error("Falha ao inicializar Firebase Admin SDK (settings/actions). Verifique suas credenciais.", error);
    }
  }
}
// --- FIM: Lógica de Inicialização do Firebase Admin SDK ---

const db = getFirestore(); // Use a função importada para obter a instância do Firestore

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  // Check for Firestore Timestamp object (admin SDK might return this directly)
  if (timestampField instanceof admin.firestore.Timestamp) { // Use admin.firestore.Timestamp
    return timestampField.toDate();
  }
  // Check for client-side Timestamp-like object (comum após serialização)
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  // Check if it's already a Date object
  if (timestampField instanceof Date) {
    return timestampField;
  }
  // Try to parse if it's a string or number that can be converted
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`Could not convert platform settings timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/',
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data()!;
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath || defaultSettings.galleryImageBasePath,
        updatedAt: safeConvertToDate(data.updatedAt), // Use o helper para updatedAt
      } as PlatformSettings;
    } else {
      console.log('No global settings found, creating with defaults (settings/actions).');
      const initialSettingsForFirestore = {
        ...defaultSettings,
        updatedAt: serverTimestamp(), // Use a função importada
      };
      await setDoc(settingsDocRef, initialSettingsForFirestore);
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), // Representação imediata, Firestore terá o serverTimestamp
      };
    }
  } catch (error: any) {
    console.error("[Server Action - getPlatformSettings] Error:", error);
    // No caso de erro, retorne os padrões para que a UI não quebre completamente
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
  if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
    return { success: false, message: 'O caminho base da galeria de imagens deve começar e terminar com uma barra "/" (ex: /uploads/media/).' };
  }

  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: serverTimestamp(), // Use a função importada
    };

    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        await updateDoc(settingsDocRef, updateData);
    } else {
        // Se não existir, criamos com setDoc (merge: true é o comportamento padrão se o documento não existe)
        await setDoc(settingsDocRef, updateData, { merge: true });
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
