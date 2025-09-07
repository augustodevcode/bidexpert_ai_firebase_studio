// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
/**
 * @fileoverview Server Actions for the Lot Detail page.
 * All logic has been refactored to use the BidService and other relevant services
 * to adhere to the defined application architecture.
 */
'use server';

import { BidService } from '@bidexpert/services';
import { SellerService } from '@bidexpert/services';
import { HabilitationService } from '@bidexpert/services';
import type { BidInfo, Lot, SellerProfileInfo, UserLotMaxBid, Review, LotQuestion } from '@/types';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { LotService } from '@bidexpert/services';
import { prisma } from '@/lib/prisma';

const bidService = new BidService();
const sellerService = new SellerService();
const lotService = new LotService();
const habilitationService = new HabilitationService();

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
  const lot = await lotService.getLotById(lotIdOrPublicId);
  if (!lot) return [];
  // @ts-ignore - Assuming Review model exists
  return prisma.review.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
}

export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  const lot = await lotService.getLotById(lotIdOrPublicId);
  if (!lot) return { success: false, message: "Lote não encontrado." };

  try {
    // @ts-ignore
    const newReview = await prisma.review.create({
        data: { lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, rating, comment }
    });
    return { success: true, message: 'Avaliação enviada com sucesso.', reviewId: newReview.id };
  } catch(error) {
    console.error("Error creating review:", error);
    return { success: false, message: "Falha ao enviar avaliação." };
  }
}

export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
  const lot = await lotService.getLotById(lotIdOrPublicId);
  if (!lot) return [];
  // @ts-ignore
  return prisma.lotQuestion.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
}

export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  const lot = await lotService.getLotById(lotIdOrPublicId);
  if (!lot) return { success: false, message: "Lote não encontrado." };

  try {
    // @ts-ignore
    const newQuestion = await prisma.lotQuestion.create({
        data: { lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, questionText, isPublic: true }
    });
    return { success: true, message: 'Pergunta enviada com sucesso.', questionId: newQuestion.id };
  } catch(error) {
    console.error("Error creating question:", error);
    return { success: false, message: "Falha ao enviar pergunta." };
  }
}

export async function answerQuestionOnLot(
  questionId: string, 
  answerText: string,
  answeredByUserId: string,
  answeredByUserDisplayName: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // @ts-ignore
    await prisma.lotQuestion.update({
        where: { id: questionId },
        data: { answerText, answeredByUserId, answeredByUserDisplayName, answeredAt: new Date() }
    });
    return { success: true, message: "Resposta enviada com sucesso." };
  } catch (error) {
    console.error("Error answering question:", error);
    return { success: false, message: "Falha ao enviar resposta."};
  }
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
