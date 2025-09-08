// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
/**
 * @fileoverview Server Actions for the Lot Detail page.
 * All logic has been refactored to use the BidService and other relevant services
 * to adhere to the defined application architecture.
 */
'use server';

import { BidService, SellerService, HabilitationService, LotService, DocumentTemplateService } from '@bidexpert/services';
import type { BidInfo, UserLotMaxBid, Review, LotQuestion, SellerProfileInfo, UserProfileWithPermissions } from '@bidexpert/core';

const bidService = new BidService();
const sellerService = new SellerService();
const lotService = new LotService();
const habilitationService = new HabilitationService();
const documentTemplateService = new DocumentTemplateService();

export async function placeBidOnLot(
  lotIdOrPublicId: string,
  auctionIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
) {
  return bidService.placeBid(lotIdOrPublicId, auctionIdOrPublicId, userId, userDisplayName, bidAmount);
}

export async function placeMaxBid(lotId: string, userId: string, maxAmount: number) {
  return bidService.placeMaxBid(lotId, userId, maxAmount);
}

export async function getActiveUserLotMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
  return bidService.getActiveUserLotMaxBid(lotIdOrPublicId, userId);
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
  return bidService.getBidsForLot(lotIdOrPublicId);
}

export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
  return lotService.getReviewsForLot(lotIdOrPublicId);
}

export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  return lotService.createReview(lotIdOrPublicId, userId, userDisplayName, rating, comment);
}

export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
  return lotService.getQuestionsForLot(lotIdOrPublicId);
}

export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  return lotService.askQuestionOnLot(lotIdOrPublicId, userId, userDisplayName, questionText);
}

export async function answerQuestionOnLot(
  questionId: string, 
  answerText: string,
  answeredByUser: UserProfileWithPermissions
): Promise<{ success: boolean; message: string }> {
 return lotService.answerQuestionOnLot(questionId, answerText, answeredByUser);
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicIdOrSlug?: string): Promise<SellerProfileInfo | null> {
    if (!sellerIdOrPublicIdOrSlug) return null;
    return sellerService.getSellerBySlug(sellerIdOrPublicIdOrSlug);
}

export async function generateWinningBidTermAction(lotId: string): Promise<{ success: boolean; message: string; pdfBase64?: string; fileName?: string; }> {
    return lotService.generateWinningBidTerm(lotId);
}

export async function checkHabilitationForAuctionAction(userId: string, auctionId: string): Promise<boolean> {
  return habilitationService.isUserHabilitatedForAuction(userId, auctionId);
}
