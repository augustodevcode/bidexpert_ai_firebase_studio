
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { UserProfileData, UserDocument, UserHabilitationStatus } from '@/types';
import type { Prisma } from '@prisma/client';

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
 * Checks if a user can be fully habilitated after a document status change.
 * If the user's overall status changes, a notification is created.
 * @param tx - The Prisma transaction client.
 * @param userId - The ID of the user to check.
 * @returns The new habilitation status if it changed, otherwise null.
 */
async function checkAndFinalizeHabilitation(tx: Prisma.TransactionClient, userId: string): Promise<UserHabilitationStatus | null> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { accountType: true }
  });

  if (!user) return null;
  
  const requiredDocTypes = await tx.documentType.findMany({ 
      where: { 
          isRequired: true,
          appliesTo: {
            has: user.accountType || 'PHYSICAL'
          }
      }
  });
  const userDocs = await tx.userDocument.findMany({ where: { userId } });

  const allRequiredApproved = requiredDocTypes.every(reqDoc =>
    userDocs.some(userDoc => userDoc.documentTypeId === reqDoc.id && userDoc.status === 'APPROVED')
  );

  let newHabilitationStatus: UserHabilitationStatus | null = null;
  if (allRequiredApproved) {
    newHabilitationStatus = 'HABILITADO';
  } else {
    const anyRejected = userDocs.some(doc => doc.status === 'REJECTED');
    if (anyRejected) {
      newHabilitationStatus = 'REJECTED_DOCUMENTS';
    }
  }

  if (newHabilitationStatus) {
      const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { habilitationStatus: true }});
      if (currentUser?.habilitationStatus !== newHabilitationStatus) {
          await tx.user.update({
              where: { id: userId },
              data: { habilitationStatus: newHabilitationStatus }
          });
          // Create notification for overall status change
          if (newHabilitationStatus === 'HABILITADO') {
            await tx.notification.create({
               data: {
                   userId: userId,
                   message: "Parabéns! Seu cadastro foi habilitado. Você já pode participar dos leilões.",
                   link: '/dashboard/documents'
               }
           });
          } else if (newHabilitationStatus === 'REJECTED_DOCUMENTS') {
            await tx.notification.create({
                data: {
                    userId: userId,
                    message: "Atenção: há pendências em seus documentos. Por favor, verifique e reenvie.",
                    link: '/dashboard/documents'
                }
            });
          }
          return newHabilitationStatus;
      }
  }
  return null; // No change in overall status
}


export async function approveDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.$transaction(async (tx) => {
        const docToUpdate = await tx.userDocument.findUnique({ where: {id: documentId}, include: {documentType: true}});
        if (!docToUpdate) {
            throw new Error("Documento não encontrado.");
        }

        await tx.userDocument.update({
            where: { id: documentId },
            data: { status: 'APPROVED', rejectionReason: null, analysisDate: new Date() }
        });
        
        await tx.notification.create({
            data: {
                userId: docToUpdate.userId,
                message: `Seu documento "${docToUpdate.documentType.name}" foi APROVADO.`,
                link: '/dashboard/documents'
            }
        });

        await checkAndFinalizeHabilitation(tx, docToUpdate.userId);
    });

    revalidatePath('/admin/habilitations');
    // We can't know the user ID here to revalidate their page,
    // but client-side refetching will handle it.
    return { success: true, message: 'Documento aprovado.' };
  } catch (error: any) {
    console.error("Error approving document:", error);
    return { success: false, message: error.message || 'Falha ao aprovar documento.' };
  }
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason) {
    return { success: false, message: 'O motivo da rejeição é obrigatório.' };
  }
  try {
    await prisma.$transaction(async (tx) => {
        const docToUpdate = await tx.userDocument.findUnique({ where: {id: documentId}, include: {documentType: true}});
        if (!docToUpdate) {
            throw new Error("Documento não encontrado.");
        }

        await tx.userDocument.update({
            where: { id: documentId },
            data: { status: 'REJECTED', rejectionReason: reason, analysisDate: new Date() }
        });
        
        await tx.notification.create({
            data: {
                userId: docToUpdate.userId,
                message: `Seu documento "${docToUpdate.documentType.name}" foi REJEITADO. Motivo: ${reason}`,
                link: '/dashboard/documents'
            }
        });

        await checkAndFinalizeHabilitation(tx, docToUpdate.userId);
    });
    
    revalidatePath('/admin/habilitations');
    return { success: true, message: 'Documento rejeitado.' };
  } catch (error: any) {
    console.error("Error rejecting document:", error);
    return { success: false, message: error.message || 'Falha ao rejeitar documento.' };
  }
}
