// src/app/admin/habilitations/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { UserProfileData, UserDocument, UserHabilitationStatus } from '@/types';

/**
 * Fetches users whose documents are pending review.
 */
export async function getHabilitationRequests(): Promise<UserProfileData[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  return db.getHabilitationRequests ? db.getHabilitationRequests() : [];
}

/**
 * Fetches all submitted documents for a specific user.
 */
export async function getUserDocumentsForReview(userId: string): Promise<UserDocument[]> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  return db.getUserDocuments ? db.getUserDocuments(userId) : [];
}

export async function approveDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (!db.approveDocument) return { success: false, message: "Função não implementada."};
  // @ts-ignore
  const result = await db.approveDocument(documentId);
  if (result.success) {
    revalidatePath('/admin/habilitations');
  }
  return result;
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason) {
    return { success: false, message: 'O motivo da rejeição é obrigatório.' };
  }
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (!db.rejectDocument) return { success: false, message: "Função não implementada."};
  // @ts-ignore
  const result = await db.rejectDocument(documentId, reason);
  if (result.success) {
    revalidatePath('/admin/habilitations');
  }
  return result;
}
