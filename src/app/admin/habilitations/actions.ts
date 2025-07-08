
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { UserProfileData, UserDocument } from '@/types';

/**
 * Fetches users whose documents are pending review.
 */
export async function getHabilitationRequests(): Promise<UserProfileData[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        habilitationStatus: {
          in: ['PENDING_ANALYSIS', 'REJECTED_DOCUMENTS']
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });
    return users as unknown as UserProfileData[];
  } catch (error) {
    console.error("Error fetching habilitation requests:", error);
    return [];
  }
}

/**
 * Fetches all submitted documents for a specific user.
 */
export async function getUserDocumentsForReview(userId: string): Promise<UserDocument[]> {
  try {
    const documents = await prisma.userDocument.findMany({
      where: { userId },
      include: { documentType: true },
      orderBy: { documentType: { displayOrder: 'asc' } },
    });
    return documents as unknown as UserDocument[];
  } catch (error) {
    console.error(`Error fetching documents for user ${userId}:`, error);
    return [];
  }
}

/**
 * Updates the status of a single user document.
 */
async function updateUserDocumentStatus(
  documentId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string | null
): Promise<{ success: boolean, userId?: string }> {
  const updatedDoc = await prisma.userDocument.update({
    where: { id: documentId },
    data: {
      status,
      rejectionReason: rejectionReason,
      analysisDate: new Date(),
      // analystId could be added here if we track who performed the action
    }
  });
  return { success: true, userId: updatedDoc.userId };
}

/**
 * Checks if a user can be fully habilitated after a document status change.
 */
async function checkAndFinalizeHabilitation(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountType: true }
  });

  if (!user) return;
  
  const requiredDocTypes = await prisma.documentType.findMany({ 
      where: { 
          isRequired: true,
          appliesTo: {
            has: user.accountType || 'PHYSICAL'
          }
      }
  });
  const userDocs = await prisma.userDocument.findMany({ where: { userId } });

  const allRequiredApproved = requiredDocTypes.every(reqDoc =>
    userDocs.some(userDoc => userDoc.documentTypeId === reqDoc.id && userDoc.status === 'APPROVED')
  );

  if (allRequiredApproved) {
    await prisma.user.update({
      where: { id: userId },
      data: { habilitationStatus: 'HABILITADO' }
    });
  } else {
    // If not all are approved, but none are pending analysis, set status to reflect that.
    const anyRejected = userDocs.some(doc => doc.status === 'REJECTED');
    if (anyRejected) {
      await prisma.user.update({
        where: { id: userId },
        data: { habilitationStatus: 'REJECTED_DOCUMENTS' }
      });
    }
  }
}

export async function approveDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await updateUserDocumentStatus(documentId, 'APPROVED');
    if (result.userId) {
      await checkAndFinalizeHabilitation(result.userId);
      revalidatePath('/admin/habilitations');
      revalidatePath(`/admin/habilitations/${result.userId}`);
      return { success: true, message: 'Documento aprovado.' };
    }
    return { success: false, message: 'Usuário não encontrado após aprovação.' };
  } catch (error: any) {
    console.error("Error approving document:", error);
    return { success: false, message: 'Falha ao aprovar documento.' };
  }
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason) {
    return { success: false, message: 'O motivo da rejeição é obrigatório.' };
  }
  try {
    const result = await updateUserDocumentStatus(documentId, 'REJECTED', reason);
    if (result.userId) {
      await checkAndFinalizeHabilitation(result.userId);
      revalidatePath('/admin/habilitations');
      revalidatePath(`/admin/habilitations/${result.userId}`);
      return { success: true, message: 'Documento rejeitado.' };
    }
    return { success: false, message: 'Usuário não encontrado após rejeição.' };
  } catch (error: any) {
    console.error("Error rejecting document:", error);
    return { success: false, message: 'Falha ao rejeitar documento.' };
  }
}
