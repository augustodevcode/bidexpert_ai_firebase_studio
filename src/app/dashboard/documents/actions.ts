// src/app/dashboard/documents/actions.ts
/**
 * @fileoverview Server Actions for managing user documents and habilitation status.
 * Provides functions to fetch required document types, user's submitted documents,
 * and to save a newly uploaded document, linking it to the user.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { DocumentService } from '@/services/document.service';
import type { DocumentType, UserDocument } from '@/types';

const documentService = new DocumentService();

/**
 * Fetches all available document types from the database.
 * These types define what documents users can upload (e.g., CPF, RG, etc.).
 * @returns {Promise<DocumentType[]>} A promise that resolves to an array of DocumentType objects.
 */
export async function getDocumentTypes(): Promise<DocumentType[]> {
  return documentService.getDocumentTypes();
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
  return documentService.getUserDocuments(userId);
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
  const result = await documentService.saveUserDocument(userId, documentTypeId, fileUrl, fileName);

  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/dashboard/documents');
    revalidatePath(`/admin/habilitations/${userId}`);
  }

  return result;
}
