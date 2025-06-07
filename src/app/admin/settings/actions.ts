
'use server';

import admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase/admin'; // Importa a instância centralizada
import { revalidatePath } from 'next/cache';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { config } from 'dotenv';

config(); // Load .env file

const SETTINGS_COLLECTION = 'platformSettings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

const defaultSettings: Omit<PlatformSettings, 'id' | 'updatedAt'> = {
  galleryImageBasePath: '/media/gallery/',
};

// A inicialização do Admin SDK foi movida para @/lib/firebase/admin.ts

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof admin.firestore.Timestamp) {
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new admin.firestore.Timestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert platform settings timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!dbAdmin) {
    console.error("[Server Action - getPlatformSettings] Firestore Admin DB (dbAdmin) não inicializado. Retornando configurações padrão.");
    return { id: GLOBAL_SETTINGS_DOC_ID, ...defaultSettings, updatedAt: new Date() };
  }
  try {
    const settingsDocRef = dbAdmin.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    console.error("[Server Action - getPlatformSettings] Erro na operação do Firestore:", error);
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
  if (!dbAdmin) {
    const errMsg = 'Erro de Configuração: Admin SDK Firestore não disponível para updatePlatformSettings.';
    console.error(`[Server Action - updatePlatformSettings] ${errMsg}`);
    return { success: false, message: errMsg };
  }
  if (!data.galleryImageBasePath || !data.galleryImageBasePath.startsWith('/') || !data.galleryImageBasePath.endsWith('/')) {
    return { success: false, message: 'O caminho base da galeria de imagens deve começar e terminar com uma barra "/" (ex: /uploads/media/).' };
  }

  try {
    const settingsDocRef = dbAdmin.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
    
    const updateData: Partial<Omit<PlatformSettings, 'id' | 'createdAt'>> = {
      galleryImageBasePath: data.galleryImageBasePath,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await settingsDocRef.set(updateData, { merge: true }); 
    
    revalidatePath('/admin/settings');
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updatePlatformSettings] Erro na operação do Firestore:", error);
    return { success: false, message: (error as Error).message || 'Falha ao atualizar configurações da plataforma.' };
  }
}
