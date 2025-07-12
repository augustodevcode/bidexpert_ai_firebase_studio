/**
 * @fileoverview Server Actions for the Lot Detail page.
 * Contains logic for placing bids, managing max bids, and fetching related data
 * like bid history, reviews, and questions for a specific lot.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, BidInfo, Review, LotQuestion, SellerProfileInfo, UserLotMaxBid } from '@/types';

/**
 * Result type for the placeBidOnLot action.
 */
interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status' | 'endDate'>>;
  newBid?: BidInfo;
}

/**
 * Places a manual bid on a lot.
 * It validates the bid against the lot's current status and price.
 * On success, it creates a new bid record, updates the lot's price, and notifies the previous high bidder.
 * @param lotIdOrPublicId - The ID or publicId of the lot.
 * @param auctionIdOrPublicId - The ID or publicId of the auction (for revalidation).
 * @param userId - The ID of the bidding user.
 * @param userDisplayName - The display name of the user for the bid history.
 * @param bidAmount - The amount of the bid.
 * @returns {Promise<PlaceBidResult>} The result of the bidding operation.
 */
export async function placeBidOnLot(
  lotIdOrPublicId: string,
  auctionIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
    try {
        const db = getDatabaseAdapter();
        const lot = await db.getLot(lotIdOrPublicId);
        
        if (!lot) return { success: false, message: 'Lote não encontrado.'};
        if (lot.status !== 'ABERTO_PARA_LANCES') return { success: false, message: 'Este lote não está aberto para lances.'};
        if (bidAmount <= lot.price) return { success: false, message: `O lance deve ser maior que R$ ${lot.price.toLocaleString('pt-BR')}.`};

        // Get previous high bidder before creating the new bid
        // @ts-ignore
        const currentBids = await db.getBidsForLot ? await db.getBidsForLot(lot.id) : [];
        const previousHighBid = currentBids[0];

        // @ts-ignore
        const newBidResult = await db.createBid({
            lotId: lot.id,
            auctionId: lot.auctionId,
            bidderId: userId,
            bidderDisplay: userDisplayName,
            amount: bidAmount,
        });

        // After creating the new bid, check if we need to send a notification
        if (previousHighBid && previousHighBid.bidderId !== userId) {
            // @ts-ignore
            if (db.createNotification) {
                // @ts-ignore
                await db.createNotification({
                    userId: previousHighBid.bidderId,
                    message: `Seu lance no lote "${lot.title}" foi superado.`,
                    link: `/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`,
                });
            }
        }

        const updatedLot = await db.updateLot(lot.id, {
            price: bidAmount,
            bidsCount: (lot.bidsCount || 0) + 1
        });
        
        // Revalidate paths to update UI across the app
        revalidatePath(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
        revalidatePath(`/auctions/${auctionIdOrPublicId}/live`);
        revalidatePath(`/live-dashboard`);
        
        return {
            success: true,
            message: "Lance realizado com sucesso!",
            updatedLot: {
                price: lot.price + 100, // Placeholder
                bidsCount: (lot.bidsCount || 0) + 1,
            },
            newBid: newBidResult.bid as BidInfo,
        };
    } catch (error: any) {
        console.error("Error placing bid:", error);
        return { success: false, message: "Ocorreu um erro ao registrar seu lance."};
    }
}

/**
 * Creates or updates a user's maximum bid (proxy bid) for a lot.
 * @param lotId - The ID of the lot.
 * @param userId - The ID of the user.
 * @param maxAmount - The maximum amount the user is willing to bid.
 * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
 */
export async function placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean, message: string }> {
  try {
    const db = getDatabaseAdapter();
    const lot = await db.getLot(lotId);
    if (!lot) return { success: false, message: 'Lote não encontrado.' };
    
    // @ts-ignore
    await db.upsertUserLotMaxBid({ userId, lotId, maxAmount, isActive: true });
    
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    return { success: true, message: "Lance máximo definido com sucesso!" };
  } catch (error) {
    console.error("Error setting max bid:", error);
    return { success: false, message: "Falha ao definir lance máximo." };
  }
}

/**
 * Fetches the active maximum bid for a user on a specific lot.
 * @param lotIdOrPublicId - The ID or publicId of the lot.
 * @param userId - The ID of the user.
 * @returns {Promise<UserLotMaxBid | null>} The active max bid record or null.
 */
export async function getActiveUserLotMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
  if (!userId) return null;
  const db = getDatabaseAdapter();
  const lot = await db.getLot(lotIdOrPublicId);
  if (!lot) return null;

  try {
    // @ts-ignore
    return db.getActiveUserLotMaxBid ? db.getActiveUserLotMaxBid(userId, lot.id) : null;
  } catch (error) {
    console.error("Error fetching active max bid:", error);
    return null;
  }
}

/**
 * Fetches the entire bid history for a lot.
 * @param lotIdOrPublicId - The ID or publicId of the lot.
 * @returns {Promise<BidInfo[]>} An array of bid records, ordered by most recent first.
 */
export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    const db = getDatabaseAdapter();
    const lot = await db.getLot(lotIdOrPublicId);
    if (!lot) return [];

    try {
        // @ts-ignore
        return db.getBidsForLot ? await db.getBidsForLot(lot.id) : [];
    } catch (error) {
        console.error("Error fetching bids:", error);
        return [];
    }
}

/**
 * Fetches all reviews for a lot.
 * @param lotIdOrPublicId - The ID or publicId of the lot.
 * @returns {Promise<Review[]>} An array of review records.
 */
export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    const db = getDatabaseAdapter();
    const lot = await db.getLot(lotIdOrPublicId);
    if (!lot) return [];
    try {
        // @ts-ignore
        return db.getReviewsForLot ? db.getReviewsForLot(lot.id) : [];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}

/**
 * Creates a new review for a lot.
 * @param lotIdOrPublicId - The ID or publicId of the lot being reviewed.
 * @param userId - The ID of the user submitting the review.
 * @param userDisplayName - The user's display name.
 * @param rating - The star rating (1-5).
 * @param comment - The review text.
 * @returns {Promise<{ success: boolean; message: string; reviewId?: string }>} Result of the operation.
 */
export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  const db = getDatabaseAdapter();
  const lot = await db.getLot(lotIdOrPublicId);
  if (!lot) return { success: false, message: "Lote não encontrado." };

  try {
    // @ts-ignore
    const result = await db.createReview({ lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, rating, comment });
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    return result;
  } catch(error) {
    console.error("Error creating review:", error);
    return { success: false, message: "Falha ao enviar avaliação." };
  }
}

/**
 * Fetches all questions for a lot.
 * @param lotIdOrPublicId - The ID or publicId of the lot.
 * @returns {Promise<LotQuestion[]>} An array of question records.
 */
export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    const db = getDatabaseAdapter();
    const lot = await db.getLot(lotIdOrPublicId);
    if (!lot) return [];
    try {
        // @ts-ignore
        return db.getQuestionsForLot ? db.getQuestionsForLot(lot.id) : [];
    } catch (error) {
        console.error("Error fetching questions:", error);
        return [];
    }
}

/**
 * Submits a new question about a lot.
 * @param lotIdOrPublicId - The ID or publicId of the lot.
 * @param userId - The ID of the user asking the question.
 * @param userDisplayName - The user's display name.
 * @param questionText - The text of the question.
 * @returns {Promise<{ success: boolean; message: string; questionId?: string }>} Result of the operation.
 */
export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  const db = getDatabaseAdapter();
  const lot = await db.getLot(lotIdOrPublicId);
  if (!lot) return { success: false, message: "Lote não encontrado." };

  try {
    // @ts-ignore
    const result = await db.createQuestion({ lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, questionText, isPublic: true });
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    return result;
  } catch(error) {
    console.error("Error creating question:", error);
    return { success: false, message: "Falha ao enviar pergunta." };
  }
}

/**
 * Submits an answer to a question on a lot.
 * Typically called by an admin or the lot's seller.
 * @param questionId - The ID of the question being answered.
 * @param answerText - The text of the answer.
 * @param answeredByUserId - The ID of the user providing the answer.
 * @param answeredByUserDisplayName - The display name of the answering user.
 * @param lotId - The ID of the lot (for revalidation).
 * @param auctionId - The ID of the auction (for revalidation).
 * @returns {Promise<{ success: boolean; message: string }>} Result of the operation.
 */
export async function answerQuestionOnLot(
  questionId: string, 
  answerText: string,
  answeredByUserId: string,
  answeredByUserDisplayName: string,
  lotId: string,
  auctionId: string 
): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDatabaseAdapter();
    // @ts-ignore
    const result = await db.answerQuestion(questionId, { answerText, answeredByUserId, answeredByUserDisplayName });
    revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
    return result;
  } catch (error) {
    console.error("Error answering question:", error);
    return { success: false, message: "Falha ao enviar resposta."};
  }
}

/**
 * Fetches the seller's profile information for display on the lot page.
 * @param sellerIdOrPublicIdOrSlug - The ID, public ID, or slug of the seller.
 * @returns {Promise<SellerProfileInfo | null>} The seller's profile or null.
 */
export async function getSellerDetailsForLotPage(sellerIdOrPublicIdOrSlug?: string): Promise<SellerProfileInfo | null> {
    if (!sellerIdOrPublicIdOrSlug) return null;
    try {
        const db = getDatabaseAdapter();
        // @ts-ignore
        if (db.getSellerBySlug) {
             // @ts-ignore
             return db.getSellerBySlug(sellerIdOrPublicIdOrSlug);
        }
        const allSellers = await db.getSellers();
        return allSellers.find(s => s.id === sellerIdOrPublicIdOrSlug || s.publicId === sellerIdOrPublicIdOrSlug || s.slug === sellerIdOrPublicIdOrSlug) || null;
    } catch(error) {
        console.error("Error fetching seller details:", error);
        return null;
    }
}
