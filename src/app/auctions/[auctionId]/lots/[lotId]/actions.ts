
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, BidInfo, IDatabaseAdapter, Review, LotQuestion, SellerProfileInfo } from '@/types';
import { revalidatePath } from 'next/cache';
import { sampleLotQuestions, sampleLotReviews } from '@/lib/sample-data'; // Import sample data

interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>;
  newBid?: BidInfo;
}

export async function placeBidOnLot(
  lotId: string,
  auctionId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
  const db = await getDatabaseAdapter();
  return db.placeBidOnLot(lotId, auctionId, userId, userDisplayName, bidAmount);
}

export async function getBidsForLot(lotId: string): Promise<BidInfo[]> {
  if (!lotId) {
    console.warn("[Server Action - getBidsForLot] Lot ID is required.");
    return [];
  }
  const db = await getDatabaseAdapter();
  return db.getBidsForLot(lotId);
}

// --- Reviews Actions ---
export async function getReviewsForLot(lotId: string): Promise<Review[]> {
  if (!lotId) return [];
  // TODO: Replace with DB call when ready
  // const db = await getDatabaseAdapter();
  // return db.getReviewsForLot(lotId);
  return sampleLotReviews.filter(review => review.lotId === lotId);
}

export async function createReview(
  lotId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  if (!lotId || !userId || rating < 1 || rating > 5 || !comment.trim()) {
    return { success: false, message: 'Dados inválidos para avaliação.' };
  }
  const db = await getDatabaseAdapter();
  const lot = await db.getLot(lotId);
  if (!lot) return { success: false, message: 'Lote não encontrado.' };

  const result = await db.createReview({
    lotId,
    auctionId: lot.auctionId,
    userId,
    userDisplayName,
    rating,
    comment,
  });
  if (result.success) {
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  }
  return result;
}

// --- Questions Actions ---
export async function getQuestionsForLot(lotId: string): Promise<LotQuestion[]> {
  if (!lotId) return [];
  // TODO: Replace with DB call when ready
  // const db = await getDatabaseAdapter();
  // return db.getQuestionsForLot(lotId);
  return sampleLotQuestions.filter(question => question.lotId === lotId);
}

export async function askQuestionOnLot(
  lotId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  if (!lotId || !userId || !questionText.trim()) {
    return { success: false, message: 'Dados inválidos para pergunta.' };
  }
  const db = await getDatabaseAdapter();
  const lot = await db.getLot(lotId);
  if (!lot) return { success: false, message: 'Lote não encontrado.' };
  
  const result = await db.createQuestion({
    lotId,
    auctionId: lot.auctionId,
    userId,
    userDisplayName,
    questionText,
  });
  if (result.success) {
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  }
  return result;
}

export async function answerQuestionOnLot(
  questionId: string,
  answerText: string,
  answeredByUserId: string,
  answeredByUserDisplayName: string,
  lotId: string, 
  auctionId: string 
): Promise<{ success: boolean; message: string }> {
  if (!questionId || !answerText.trim() || !answeredByUserId) {
    return { success: false, message: 'Dados inválidos para resposta.' };
  }
  const db = await getDatabaseAdapter();
  const result = await db.answerQuestion(questionId, answerText, answeredByUserId, answeredByUserDisplayName);
  if (result.success) {
    revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
  }
  return result;
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicId?: string): Promise<SellerProfileInfo | null> {
    if (!sellerIdOrPublicId) return null;
    const db = await getDatabaseAdapter();
    return db.getSeller(sellerIdOrPublicId);
}
