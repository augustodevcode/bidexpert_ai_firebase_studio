'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { DocumentType, UserDocument, Bem } from '@/types';

export async function getDocumentTypes(): Promise<DocumentType[]> {
  const db = await getDatabaseAdapter();
  return db.getDocumentTypes();
}

export async function getUserDocuments(userId: string): Promise<UserDocument[]> {
  if (!userId) {
    console.warn("[Action - getUserDocuments] No userId provided.");
    return [];
  }
  const db = await getDatabaseAdapter();
  return db.getUserDocuments(userId);
}

export async function saveUserDocument(
  userId: string,
  documentTypeId: string,
  fileUrl: string,
  fileName: string,
): Promise<{ success: boolean; message: string }> {
  if (!userId || !documentTypeId || !fileUrl) {
    return { success: false, message: "Dados insuficientes para salvar o documento." };
  }
  const db = await getDatabaseAdapter();
  const result = await db.saveUserDocument(userId, documentTypeId, fileUrl, fileName);

  if(result.success) {
      // Revalidar a página de documentos para que o usuário veja a mudança de status
      revalidatePath('/dashboard/documents');
  }
  
  return result;
}

