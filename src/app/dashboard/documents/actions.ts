// src/app/dashboard/documents/actions.ts
/**
 * @fileoverview Server Actions for managing user documents and habilitation status from the user dashboard.
 */
'use server';

import type { UserDocument, DocumentType } from '@/types';
import { HabilitationService } from '@bidexpert/services';
import { DocumentTypeService } from '@bidexpert/services';

const habilitationService = new HabilitationService();
const documentTypeService = new DocumentTypeService();

/**
 * Fetches all available document types from the database.
 * @returns {Promise<DocumentType[]>} A promise that resolves to an array of DocumentType objects.
 */
export async function getDocumentTypes(): Promise<DocumentType[]> {
  return documentTypeService.getDocumentTypes();
}

/**
 * Fetches all documents submitted by a specific user.
 * @param {string} userId - The ID of the user whose documents to fetch.
 * @returns {Promise<UserDocument[]>} A promise that resolves to an array of the user's documents.
 */
export async function getUserDocuments(userId: string): Promise<UserDocument[]> {
  return habilitationService.getUserDocuments(userId);
}

/**
 * Creates or updates a user's document submission.
 * This action calls the service layer which handles the business logic.
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
  return habilitationService.saveUserDocument(userId, documentTypeId, fileUrl, fileName);
}
