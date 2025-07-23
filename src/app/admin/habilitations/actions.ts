// src/app/admin/habilitations/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { UserProfileData, UserDocument, UserHabilitationStatus } from '@/types';

/**
 * Fetches users whose documents are pending review.
 */
export async function getHabilitationRequests(): Promise<UserProfileData[]> {
  return prisma.user.findMany({
    where: {
      habilitationStatus: { in: ['PENDING_ANALYSIS', 'REJECTED_DOCUMENTS'] }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Fetches all submitted documents for a specific user.
 */
export async function getUserDocumentsForReview(userId: string): Promise<UserDocument[]> {
  const documents = await prisma.userDocument.findMany({
    where: { userId },
    include: { documentType: true }
  });
  return documents as UserDocument[];
}

export async function approveDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.userDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED', rejectionReason: null }
    });
    revalidatePath('/admin/habilitations');
    return { success: true, message: 'Documento aprovado.' };
  } catch(e) {
    return { success: false, message: 'Falha ao aprovar documento.' };
  }
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason) {
    return { success: false, message: 'O motivo da rejeição é obrigatório.' };
  }
   try {
    await prisma.userDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', rejectionReason: reason }
    });
    revalidatePath('/admin/habilitations');
    return { success: true, message: 'Documento rejeitado.' };
  } catch(e) {
    return { success: false, message: 'Falha ao rejeitar documento.' };
  }
}
