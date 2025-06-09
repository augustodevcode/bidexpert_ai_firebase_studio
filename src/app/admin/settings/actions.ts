
'use server';

import { ensureAdminInitialized, dbAdmin as adminFirestore, FieldValue, Timestamp as AdminTimestamp } from '@/lib/firebase/admin'; 
import { revalidatePath } from 'next/cache';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv';

config(); 

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/',
};

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof AdminTimestamp) {
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new AdminTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert platform settings timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function getPlatformSettings(): Promise<PlatformSettings> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    console.error(`[Server Action - getPlatformSettings] Firestore Admin DB não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}. Retornando configurações padrão.`);
    return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
  }
  try {
    const settingsDocRef = currentDbAdmin.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    const docSnap = await settingsDocRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) {
        console.warn('Documento de configurações globais existe mas não contém dados. Retornando configurações padrão.');
        return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
      }
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        galleryImageBasePath: data.galleryImageBasePath ?? defaultSettings.galleryImageBasePath,
        updatedAt: safeConvertToDate(data.updatedAt),
      };
    } else {
      console.log('Nenhuma configuração global encontrada, criando com padrões.');
      const initialSettingsForFirestore = {
        ...defaultSettings,
        updatedAt: FieldValue.serverTimestamp(),
      };
      await settingsDocRef.set(initialSettingsForFirestore);
      console.log('Configurações padrão criadas no Firestore.');
      return {
        id: GLOBAL_SETTINGS_DOC_ID,
        ...defaultSettings,
        updatedAt: new Date(), 
      };
    }
  } catch (error: any) {
    console.error("[Server Action - getPlatformSettings] Erro na operação do Firestore:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    const errMsg = `Erro de Configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - updatePlatformSettings] ${errMsg}`);
    return { success: false, message: errMsg };
  }
  if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
    return { success: false, message: 'O caminho base da galeria de imagens deve começar e terminar com uma barra "/" (ex: /uploads/media/).' };
  }

  try {
    const settingsDocRef = currentDbAdmin.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id' | 'createdAt'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await settingsDocRef.set(updateData, { merge: true }); 
    
    revalidatePath('/admin/settings');
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updatePlatformSettings] Erro na operação do Firestore:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: (error as Error).message || 'Falha ao atualizar configurações da plataforma.' };
  }
}

