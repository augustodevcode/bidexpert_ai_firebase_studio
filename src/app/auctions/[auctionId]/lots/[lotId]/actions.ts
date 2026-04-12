// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
/**
 * @fileoverview Server Actions para a página de detalhes de um Lote.
 * Este arquivo contém a lógica de backend que pode ser chamada diretamente do
 * cliente. As responsabilidades incluem: registrar um lance (`placeBidOnLot`),
 * definir um lance máximo (`placeMaxBid`), buscar o histórico de lances e
 * gerenciar o sistema de perguntas e respostas. As ações interagem com a
 * camada de serviço (`LotService`) para executar a lógica de negócio principal.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { LotService } from '@/services/lot.service';
import { SellerService } from '@/services/seller.service';
import { AuctioneerService } from '@/services/auctioneer.service';
import type { Auction, AuctioneerProfileInfo, BidInfo, Lot, LotQuestion, PlatformSettings, Review, SellerProfileInfo, UserLotMaxBid } from '@/types';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { nowInSaoPaulo, formatInSaoPaulo } from '@/lib/timezone'; 

const lotService = new LotService();
const sellerService = new SellerService();
const auctioneerService = new AuctioneerService();

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
        // As páginas públicas sempre buscam dados do tenant "Landlord"
        return sellerService.getSellerBySlug('1', sellerIdOrPublicIdOrSlug);
    } catch(error) {
        console.error("Error fetching seller details:", error);
        return null;
    }
}

export async function getLotDetailsForV2(lotIdOrPublicId: string): Promise<{
  lot: Lot;
  auction: Auction;
  seller: SellerProfileInfo | null;
  auctioneer: AuctioneerProfileInfo | null;
  bids: BidInfo[];
  questions: LotQuestion[];
  reviews: Review[];
  platformSettings: PlatformSettings | null;
} | null> {
  return lotService.getLotDetailsForV2(lotIdOrPublicId);
}

export async function generateWinningBidTermAction(lotId: string): Promise<{ success: boolean; message: string; pdfBase64?: string; fileName?: string; }> {
    const lot = await lotService.getLotById(lotId);
    if (!lot || !lot.winnerId || !lot.auction) {
        return { success: false, message: 'Dados insuficientes para gerar o termo. Verifique se o lote foi finalizado e possui um vencedor.' };
    }
    
    const { prisma } = await import('@/lib/prisma');
    const userWin = await prisma.userWin.findFirst({
      where: { lotId: BigInt(lot.id) },
      select: {
        winningBidAmount: true,
        userId: true,
      },
    });

    const winnerId = userWin?.userId ? String(userWin.userId) : lot.winnerId;
    const winner = await prisma.user.findUnique({ where: { id: BigInt(winnerId) } });
    if (!winner) {
        return { success: false, message: 'Arrematante não encontrado.'};
    }

    const { auction } = lot;
    const tenantId = String(lot.tenantId ?? auction.tenantId ?? '1');

    const seller = auction.sellerId
      ? await sellerService.getSellerById(tenantId, String(auction.sellerId)).catch(() => auction.seller ?? null)
      : auction.seller ?? null;
    const auctioneer = auction.auctioneerId
      ? await auctioneerService.getAuctioneerById(tenantId, String(auction.auctioneerId)).catch(() => auction.auctioneer ?? null)
      : auction.auctioneer ?? null;

    try {
        const result = await generateDocument({
        documentType: 'WINNING_BID_TERM',
        data: {
            lot: {
              ...lot,
              price: Number(userWin?.winningBidAmount ?? lot.price ?? 0),
            },
            auction: auction,
            winner: winner,
            auctioneer: auctioneer,
            seller: seller,
            currentDate: formatInSaoPaulo(new Date(), 'dd/MM/yyyy'),
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

export async function getLotDocuments(lotId: string) {
    return lotService.getLotDocuments(lotId);
}
