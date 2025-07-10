/**
 * @fileoverview Server Actions for managing user documents and habilitation status.
 * Provides functions to fetch required document types, user's submitted documents,
 * and to save a newly uploaded document, linking it to the user.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database/index';
import type { DocumentType, UserDocument, Bem } from '@/types';

/**
 * Fetches all available document types from the database.
 * These types define what documents users can upload (e.g., CPF, RG, etc.).
 * @returns {Promise<DocumentType[]>} A promise that resolves to an array of DocumentType objects.
 */
export async function getDocumentTypes(): Promise<DocumentType[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  return db.getDocumentTypes ? db.getDocumentTypes() : [];
}

/**
 * Fetches all documents submitted by a specific user.
 * @param {string} userId - The ID of the user whose documents to fetch.
 * @returns {Promise<UserDocument[]>} A promise that resolves to an array of the user's documents.
 */
export async function getUserDocuments(userId: string): Promise<UserDocument[]> {
  if (!userId) {
    console.warn("[Action - getUserDocuments] No userId provided.");
    return [];
  }
  const db = await getDatabaseAdapter();
  // @ts-ignore
  return db.getUserDocuments ? db.getUserDocuments(userId) : [];
}

/**
 * Creates or updates a user's document submission. When a user uploads a file,
 * this action links the file URL to the user and the specific document type.
 * It also updates the user's overall habilitation status if all required
 * documents have been submitted.
 * @param {string} userId - The ID of the user submitting the document.
 * @param {string} documentTypeId - The ID of the document type being submitted.
 * @param {string} fileUrl - The public URL of the uploaded file from storage.
 * @param {string} fileName - The original name of the uploaded file.
 * @returns {Promise<{ success: boolean; message: string }>} An object indicating the result of the operation.
 */
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
  // @ts-ignore
  if (!db.saveUserDocument) {
    return { success: false, message: "Função não implementada neste adaptador."};
  }
  try {
    // @ts-ignore
    const result = await db.saveUserDocument(userId, documentTypeId, fileUrl, fileName);

    if (result.success) {
        revalidatePath('/dashboard/documents');
    }
    return result;
  } catch (error: any) {
    console.error("Error saving user document:", error);
    return { success: false, message: `Falha ao salvar documento: ${error.message}`};
  }
}
