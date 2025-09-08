// src/app/admin/habilitations/actions.ts
'use server';

import type { UserProfileData, UserDocument } from '@bidexpert/core';
import { HabilitationService } from '@bidexpert/core';

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
    return habilitationService.habilitateForAuction(userId, auctionId);
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
    return habilitationService.approveDocument(documentId, analystId);
}

export async function rejectDocument(documentId: string, reason: string): Promise<{ success: boolean; message: string }> {
    return habilitationService.rejectDocument(documentId, reason);
}
