
'use server';

import type { Lot, BidInfo, Review, LotQuestion, SellerProfileInfo } from '@/types';
import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';

interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>;
  newBid?: BidInfo;
}

export async function placeBidOnLot(
  lotIdOrPublicId: string,
  auctionIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
  console.log(`[Action - placeBidOnLot] Calling DB adapter for lot: ${lotIdOrPublicId}, amount: ${bidAmount}`);
  const db = await getDatabaseAdapter();
  const result = await db.placeBidOnLot(lotIdOrPublicId, auctionIdOrPublicId, userId, userDisplayName, bidAmount);
  
  if (result.success) {
    revalidatePath(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
    console.log(`[Action - placeBidOnLot] Bid successful for ${lotIdOrPublicId}.`);
  } else {
    console.error(`[Action - placeBidOnLot] Bid failed for ${lotIdOrPublicId}: ${result.message}`);
  }

  return result;
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
  console.log(`[Action - getBidsForLot] Fetching bids for lot ID/PublicID: ${lotIdOrPublicId}`);
  const db = await getDatabaseAdapter();
  const bids = await db.getBidsForLot(lotIdOrPublicId);
  // Sorting is now handled by the adapter or should be done on the client if needed
  return bids;
}

// --- Reviews Actions ---
export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
  console.log(`[Action - getReviewsForLot] Fetching reviews for lot ID/PublicID: ${lotIdOrPublicId}`);
  const db = await getDatabaseAdapter();
  return db.getReviewsForLot(lotIdOrPublicId);
}

export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  console.log(`[Action - createReview] Creating review for lot: ${lotIdOrPublicId}`);
  const db = await getDatabaseAdapter();
  
  const lot = await db.getLot(lotIdOrPublicId);
  if (!lot) {
      return { success: false, message: "Lot não encontrado para criar avaliação." };
  }
  const reviewData = { lotId: lotIdOrPublicId, auctionId: lot.auctionId, userId, userDisplayName, rating, comment };

  const result = await db.createReview(reviewData);

  if (result.success) {
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lotIdOrPublicId}`);
  }
  return result;
}

// --- Questions Actions ---
export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
  console.log(`[Action - getQuestionsForLot] Fetching questions for lot ID/PublicID: ${lotIdOrPublicId}`);
  const db = await getDatabaseAdapter();
  return db.getQuestionsForLot(lotIdOrPublicId);
}

export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  console.log(`[Action - askQuestionOnLot] Creating question for lot: ${lotIdOrPublicId}`);
  const db = await getDatabaseAdapter();
  const lot = await db.getLot(lotIdOrPublicId);
  if (!lot) {
      return { success: false, message: "Lot não encontrado para fazer pergunta." };
  }
  
  const questionData = { lotId: lotIdOrPublicId, auctionId: lot.auctionId, userId, userDisplayName, questionText };
  const result = await db.createQuestion(questionData);

  if (result.success) {
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lotIdOrPublicId}`);
  }
  return result;
}

export async function answerQuestionOnLot(
  questionId: string, 
  answerText: string,
  answeredByUserId: string,
  answeredByUserDisplayName: string,
  lotId: string, // Assuming we get this from the client now
  auctionId: string // Assuming we get this from the client now
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - answerQuestionOnLot] Answering question ID: ${questionId}`);
  const db = await getDatabaseAdapter();
  const result = await db.answerQuestion(lotId, questionId, answerText, answeredByUserId, answeredByUserDisplayName);
  
  if (result.success) {
    revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
  }
  return result;
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicIdOrSlug?: string): Promise<SellerProfileInfo | null> {
    console.log(`[Action - getSellerDetailsForLotPage] Fetching seller ID/publicId/slug: ${sellerIdOrPublicIdOrSlug}`);
    if (!sellerIdOrPublicIdOrSlug) return Promise.resolve(null);
    const db = await getDatabaseAdapter();
    const seller = await db.getSellerBySlug(sellerIdOrPublicIdOrSlug);
    return seller;
}
