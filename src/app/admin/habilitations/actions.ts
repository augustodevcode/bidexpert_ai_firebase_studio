// src/app/admin/habilitations/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { UserProfileData, UserDocument, UserHabilitationStatus, Role } from '@/types';
import { RoleRepository } from '@/repositories/role.repository';
import { UserService } from '@/services/user.service';

const roleRepository = new RoleRepository();
const userService = new UserService();

/**
 * Fetches users whose documents are pending review.
 */
export async function getHabilitationRequests(): Promise<UserProfileData[]> {
  const users = await prisma.user.findMany({
    where: {
      habilitationStatus: { in: ['PENDING_ANALYSIS', 'REJECTED_DOCUMENTS', 'PENDING_DOCUMENTS'] }
    },
    orderBy: { updatedAt: 'desc' }
  });
  // @ts-ignore
  return users;
}

/**
 * Updates a user's habilitation status to 'HABILITADO' and assigns the BIDDER role.
 * @param {string} userId - The ID of the user to habilitate.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function habilitateUserAction(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    await userService.checkAndHabilitateUser(userId);

    if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${userId}`);
    }
    return { success: true, message: "Status do usuário verificado e atualizado com sucesso." };
  } catch (e: any) {
    console.error(`Failed to habilitate user ${userId}:`, e);
    return { success: false, message: `Erro ao habilitar usuário: ${e.message}`};
  }
}

/**
 * Habilitates a user for a specific auction.
 * @param {string} userId - The ID of the user.
 * @param {string} auctionId - The ID of the auction.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function habilitateForAuctionAction(userId: string, auctionId: string): Promise<{ success: boolean; message: string }> {
    try {
        await prisma.auctionHabilitation.upsert({
            where: { userId_auctionId: { userId, auctionId }},
            update: {},
            create: { userId, auctionId }
        });
        if (process.env.NODE_ENV !== 'test') {
            revalidatePath(`/auctions/${auctionId}`);
        }
        return { success: true, message: 'Você foi habilitado para este leilão com sucesso!' };
    } catch (e: any) {
        console.error(`Failed to habilitate user ${userId} for auction ${auctionId}:`, e);
        return { success: false, message: `Não foi possível completar sua habilitação para este leilão. ${e.message}` };
    }
}

/**
 * Checks if a user is habilitated for a specific auction.
 * @param {string} userId - The ID of the user.
 * @param {string} auctionId - The ID of the auction.
 * @returns {Promise<boolean>} True if the user is habilitated, false otherwise.
 */
export async function checkHabilitationForAuctionAction(userId: string, auctionId: string): Promise<boolean> {
  if (!userId || !auctionId) {
    return false;
  }
  try {
    const habilitation = await prisma.auctionHabilitation.findUnique({
      where: {
        userId_auctionId: {
          userId,
          auctionId,
        },
      },
    });
    return !!habilitation;
  } catch (error) {
    console.error(`Error checking habilitation for user ${userId} in auction ${auctionId}:`, error);
    return false;
  }
}


/**
 * Fetches all submitted documents for a specific user.
 */
export async function getUserDocumentsForReview(userId: string): Promise<UserDocument[]> {
  const documents = await prisma.userDocument.findMany({
    where: { userId },
    include: { documentType: true }
  });
  // @ts-ignore
  return documents;
}

export async function approveDocument(documentId: string, analystId: string): Promise<{ success: boolean; message: string }> {
  try {
    const docToUpdate = await prisma.userDocument.findUnique({ where: {id: documentId}});
    if (!docToUpdate) {
      throw new Error("Documento não encontrado.");
    }

    await prisma.userDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED', rejectionReason: null }
    });
    
    // After approval, check if the user is now fully habilitated
    await userService.checkAndHabilitateUser(docToUpdate.userId);

    if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
    }
    return { success: true, message: 'Documento aprovado.' };
  } catch(e: any) {
    console.error(`Error approving document ${documentId}:`, e);
    return { success: false, message: `Falha ao aprovar documento: ${e.message}` };
  }
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason) {
    return { success: false, message: 'O motivo da rejeição é obrigatório.' };
  }
   try {
    const docToUpdate = await prisma.userDocument.findUnique({ where: {id: documentId}});
    if (!docToUpdate) {
      throw new Error("Documento não encontrado.");
    }

    await prisma.userDocument.update({
      where: { id: documentId },
      data: { status: 'REJECTED', rejectionReason: reason }
    });

    await prisma.user.update({
        where: { id: docToUpdate.userId },
        data: { habilitationStatus: 'REJECTED_DOCUMENTS' }
    });

    if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${docToUpdate.userId}`);
    }
    return { success: true, message: 'Documento rejeitado.' };
  } catch(e: any) {
    return { success: false, message: 'Falha ao rejeitar documento.' };
  }
}
