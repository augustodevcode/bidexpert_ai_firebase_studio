
'use server';

import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';
// Corrigido: Importar TODAS as funções necessárias de firebase-admin/firestore
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase-admin/firestore';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv'; 

config(); 

// --- INÍCIO: Lógica de Inicialização do Firebase Admin SDK ---
if (admin.apps.length === 0) { 
  try {
    admin.initializeApp();
    console.log("Firebase Admin SDK inicializado usando GOOGLE_APPLICATION_CREDENTIALS (settings/actions).");
  } catch (error: any) {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH;
    if (serviceAccountPath) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath); 
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK inicializado usando FIREBASE_ADMIN_SDK_PATH (settings/actions).");
      } catch (e: any) {
        console.error("Falha ao inicializar Firebase Admin SDK com FIREBASE_ADMIN_SDK_PATH (settings/actions):", e.message);
      }
    } else if (error.code === 'app/no-app' && error.message.includes('GOOGLE_APPLICATION_CREDENTIALS')) {
        console.warn("Firebase Admin SDK: GOOGLE_APPLICATION_CREDENTIALS não definida e FIREBASE_ADMIN_SDK_PATH não fornecida (settings/actions). As operações do Admin SDK provavelmente falharão.");
    } else if (error.code !== 'app/app-already-exists') { 
      console.error("Falha ao inicializar Firebase Admin SDK (settings/actions). Verifique suas credenciais.", error);
    }
  }
}
// --- FIM: Lógica de Inicialização do Firebase Admin SDK ---

const db = getFirestore(); // getFirestore() de firebase-admin/firestore

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate(); // Firestore Timestamp (tanto cliente quanto admin)
  }
  if (timestampField instanceof Date) return timestampField;
  // Para objetos Timestamps serializados (comuns em Server Components -> Client Components)
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  const parsedDate = new Date(timestampField); // Tenta parsear se for string/number
  if (!isNaN(parsedDate.getTime())) return parsedDate;
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
      const data = docSnap.data()!; // data() nunca será undefined se exists() for true
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath || defaultSettings.galleryImageBasePath,
        updatedAt: safeConvertToDate(data.updatedAt), // safeConvertToDate lida com timestamp nulo ou undefined
      } as PlatformSettings;
    } else {
      console.log('No global settings found, creating with defaults (settings/actions).');
      // Usar serverTimestamp() do Admin SDK para a criação inicial
      const initialSettingsForFirestore = {
        ...defaultSettings,
        updatedAt: serverTimestamp(), 
      };
      await setDoc(settingsDocRef, initialSettingsForFirestore);
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), // Para o retorno imediato, usamos new Date()
      };
    }
  } catch (error: any) {
    console.error("[Server Action - getPlatformSettings] Error:", error);
    // Retornar defaults em caso de erro, mas logar.
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
      updatedAt: serverTimestamp(), // Usar serverTimestamp() do Admin SDK
    };

    const docSnap = await getDoc(settingsDocRef); // Verificar se existe antes de update ou set
    if (docSnap.exists()) {
        await updateDoc(settingsDocRef, updateData);
    } else {
        // Se não existir (improvável após getPlatformSettings, mas seguro), cria com set e merge.
        await setDoc(settingsDocRef, updateData, { merge: true }); 
    }

    revalidatePath('/admin/settings');
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updatePlatformSettings] Error:", error);
    if (error.code === 'permission-denied' || (error.message && error.message.includes('permission-denied'))) {
        return { success: false, message: 'Erro de Permissão: Falha ao atualizar configurações. Verifique as permissões do Firebase Admin SDK (IAM) ou a configuração das credenciais no ambiente do servidor.' };
    }
    return { success: false, message: error.message || 'Falha ao atualizar configurações da plataforma.' };
  }
}

