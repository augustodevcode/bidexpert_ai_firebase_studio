
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
  return prisma.user.findMany({
    where: {
      habilitationStatus: { in: ['PENDING_ANALYSIS', 'REJECTED_DOCUMENTS', 'PENDING_DOCUMENTS'] }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Updates a user's habilitation status to 'HABILITADO' and assigns the BIDDER role.
 * @param {string} userId - The ID of the user to habilitate.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function habilitateUserAction(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const bidderRole = await roleRepository.findByNormalizedName('BIDDER');
    if (!bidderRole) {
      throw new Error("O perfil 'BIDDER' não foi encontrado. Popule os dados essenciais.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { habilitationStatus: 'HABILITADO' }
    });

    // Use a service to add the role, not replace it
    await userService.updateUserRoles(userId, [bidderRole.id]);

    if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        revalidatePath(`/admin/habilitations/${userId}`);
    }
    return { success: true, message: "Usuário habilitado com sucesso e perfil de arrematante atribuído." };
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
        return { success: false, message: 'Não foi possível completar sua habilitação para este leilão.' };
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
  return documents as UserDocument[];
}

export async function approveDocument(documentId: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.userDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED', rejectionReason: null }
    });
    if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
    }
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
    if (process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
    }
    return { success: true, message: 'Documento rejeitado.' };
  } catch(e) {
    return { success: false, message: 'Falha ao rejeitar documento.' };
  }
}
