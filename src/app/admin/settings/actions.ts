
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (timestampField instanceof Date) return timestampField;
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert platform settings timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/', // Default path
  // Initialize other default settings here
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await getDoc(settingsDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath || defaultSettings.galleryImageBasePath,
        // map other fields here, falling back to defaults if necessary
        updatedAt: safeConvertToDate(data.updatedAt || serverTimestamp()),
      } as PlatformSettings;
    } else {
      // Document doesn't exist, create it with defaults
      console.log('No global settings found, creating with defaults.');
      const initialSettings = {
        ...defaultSettings,
        updatedAt: serverTimestamp(),
      };
      await setDoc(settingsDocRef, initialSettings);
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), // Approximate for initial return
      };
    }
  } catch (error: any) {
    console.error("[Server Action - getPlatformSettings] Error:", error);
    // Fallback to defaults in case of any error
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
      // map other updatable fields here
      updatedAt: serverTimestamp() as any,
    };

    // Use updateDoc if document exists, setDoc with merge if it might not (though getPlatformSettings should create it)
    const docSnap = await getDoc(settingsDocRef);
    if (docSnap.exists()) {
        await updateDoc(settingsDocRef, updateData);
    } else {
        await setDoc(settingsDocRef, updateData, { merge: true }); // Create if not exists
    }

    revalidatePath('/admin/settings');
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updatePlatformSettings] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar configurações da plataforma.' };
  }
}

