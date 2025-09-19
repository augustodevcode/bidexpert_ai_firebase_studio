// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
/**
 * @fileoverview Server Actions for the Lot Detail page.
 * Contains logic for placing bids, managing max bids, and fetching related data
 * like bid history, reviews, and questions for a specific lot.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { SellerService } from '@/services/seller.service';
import type { Lot, BidInfo, Review, LotQuestion, SellerProfileInfo, UserLotMaxBid } from '@/types';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone'; 

const lotService = new LotService();
const sellerService = new SellerService();

interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status' | 'endDate'>>;
  newBid?: BidInfo;
}

export async function placeBidOnLot(
  lotIdOrPublicId: string,
  auctionIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
    const result = await lotService.placeBid(lotIdOrPublicId, userId, bidAmount, userDisplayName);
    
    if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
        revalidatePath(`/auctions/${auctionIdOrPublicId}/live`);
        revalidatePath(`/live-dashboard`);
    }
    
    return result as PlaceBidResult;
}

export async function placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean, message: string }> {
  const result = await lotService.placeMaxBid(lotId, userId, maxAmount);
  if (result.success && process.env.NODE_ENV !== 'test') {
      const lot = await lotService.getLotById(lotId);
      if (lot) {
          revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
      }
  }
  return result;
}

export async function getActiveUserLotMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
  return lotService.getActiveUserMaxBid(lotIdOrPublicId, userId);
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    return lotService.getBidHistory(lotIdOrPublicId);
}

export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    return lotService.getReviews(lotIdOrPublicId);
}

export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  const result = await lotService.createReview(lotIdOrPublicId, userId, userDisplayName, rating, comment);
  if (result.success && process.env.NODE_ENV !== 'test') {
    const lot = await lotService.getLotById(lotIdOrPublicId);
    if(lot) revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
  }
  return result;
}

export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    return lotService.getQuestions(lotIdOrPublicId);
}

export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  const result = await lotService.createQuestion(lotIdOrPublicId, userId, userDisplayName, questionText);
  if (result.success && process.env.NODE_ENV !== 'test') {
      const lot = await lotService.getLotById(lotIdOrPublicId);
      if(lot) revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
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
  const result = await lotService.answerQuestion(questionId, answerText, answeredByUserId, answeredByUserDisplayName);
   if (result.success && process.env.NODE_ENV !== 'test') {
        revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
    }
  return result;
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicIdOrSlug?: string): Promise<SellerProfileInfo | null> {
    if (!sellerIdOrPublicIdOrSlug) return null;
    try {
        return sellerService.getSellerBySlug('1', sellerIdOrPublicIdOrSlug); // Always public data
    } catch(error) {
        console.error("Error fetching seller details:", error);
        return null;
    }
}

export async function generateWinningBidTermAction(lotId: string): Promise<{ success: boolean; message: string; pdfBase64?: string; fileName?: string; }> {
    const lot = await lotService.getLotById(lotId);
    if (!lot || !lot.winnerId || !lot.auction) {
        return { success: false, message: 'Dados insuficientes para gerar o termo. Verifique se o lote foi finalizado e possui um vencedor.' };
    }
    
    // Using prisma directly here is acceptable as it's a one-off query for a supporting entity.
    // Ideally, this would be in a UserService, but for simplicity, we keep it here.
    const { prisma } = await import('@/lib/prisma');
    const winner = await prisma.user.findUnique({ where: { id: lot.winnerId } });
    if (!winner) {
        return { success: false, message: 'Arrematante não encontrado.'};
    }

    const { auction } = lot;
    const auctioneer = auction.auctioneer;
    const seller = auction.seller;

    try {
        const result = await generateDocument({
        documentType: 'WINNING_BID_TERM',
        data: {
            lot: lot,
            auction: auction,
            winner: winner,
            auctioneer: auctioneer,
            seller: seller,
            currentDate: formatInSaoPaulo(nowInSaoPaulo(), 'dd/MM/yyyy'),
        },
        });

        if (result.pdfBase64 && result.fileName) {
            await lotService.updateLot(lotId, { winningBidTermUrl: `/${result.fileName}` }); 
            return { ...result, success: true, message: 'Documento gerado com sucesso!' };
        } else {
            throw new Error("A geração do PDF não retornou os dados esperados.");
        }
    } catch (error: any) {
        console.error("Error generating winning bid term:", error);
        return { success: false, message: `Falha ao gerar documento: ${error.message}` };
    }
}
