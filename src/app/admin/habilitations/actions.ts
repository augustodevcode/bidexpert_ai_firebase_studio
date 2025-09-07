// src/app/admin/habilitations/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { UserProfileData, UserDocument } from '@/types';
import { HabilitationService } from '@/services/habilitation.service';

const habilitationService = new HabilitationService();

/**
 * Fetches users whose documents are pending review.
 */
export async function getHabilitationRequests(): Promise<UserProfileData[]> {
  return habilitationService.getHabilitationRequests();
}

/**
 * Habilitates a user for a specific auction.
 * @param {string} userId - The ID of the user.
 * @param {string} auctionId - The ID of the auction.
 * @returns {Promise<{success: boolean; message: string}>} Result of the operation.
 */
export async function habilitateForAuctionAction(userId: string, auctionId: string): Promise<{ success: boolean; message: string }> {
    const result = await habilitationService.habilitateForAuction(userId, auctionId);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath(`/auctions/${auctionId}`);
    }
    return result;
}

/**
 * Checks if a user is habilitated for a specific auction.
 * @param {string} userId - The ID of the user.
 * @param {string} auctionId - The ID of the auction.
 * @returns {Promise<boolean>} True if the user is habilitated, false otherwise.
 */
export async function checkHabilitationForAuctionAction(userId: string, auctionId: string): Promise<boolean> {
  return habilitationService.isUserHabilitatedForAuction(userId, auctionId);
}

/**
 * Fetches all submitted documents for a specific user.
 */
export async function getUserDocumentsForReview(userId: string): Promise<UserDocument[]> {
  return habilitationService.getUserDocuments(userId);
}

export async function approveDocument(documentId: string, analystId: string): Promise<{ success: boolean; message: string }> {
    const result = await habilitationService.approveDocument(documentId, analystId);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        // A revalidação da página específica do usuário será feita no serviço após encontrar o userId
    }
    return result;
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const result = await habilitationService.rejectDocument(documentId, reason);
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath('/admin/habilitations');
        // A revalidação da página específica do usuário será feita no serviço após encontrar o userId
    }
    return result;
}