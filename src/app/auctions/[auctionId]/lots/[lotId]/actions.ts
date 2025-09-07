// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
/**
 * @fileoverview Server Actions for the Lot Detail page.
 * All logic has been refactored to use the BidService and other relevant services
 * to adhere to the defined application architecture.
 */
'use server';

import { BidService } from '@bidexpert/services';
import { SellerService } from '@bidexpert/services';
import type { BidInfo, Lot, SellerProfileInfo, UserLotMaxBid, Review, LotQuestion } from '@/types';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { LotService } from '@bidexpert/services';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { prisma } from '@/lib/prisma';

const bidService = new BidService();
const sellerService = new SellerService();
const lotService = new LotService();


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
  // Logic remains simple, can be moved to a ReviewService later if it grows.
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
  // This logic is simple enough to stay here for now, or move to a dedicated ReviewService.
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
    try {
        return sellerService.getSellerBySlug(sellerIdOrPublicIdOrSlug);
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
    
    // This logic is complex and involves multiple entities, so it remains here for now,
    // but could be moved to a "DocumentGenerationService" in the future.
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
            currentDate: format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
        },
        });

        if (result.pdfBase64 && result.fileName) {
            await lotService.updateLot(lotId, { winningBidTermUrl: `/${result.fileName}` }); // Placeholder URL
            return { ...result, success: true, message: 'Documento gerado com sucesso!' };
        } else {
            throw new Error("A geração do PDF não retornou os dados esperados.");
        }
    } catch (error: any) {
        console.error("Error generating winning bid term PDF:", error);
        return { success: false, message: `Falha ao gerar documento: ${error.message}` };
    }
}
