
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Lot, BidInfo, Review, LotQuestion, SellerProfileInfo, UserLotMaxBid } from '@/types';

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
    try {
        const lot = await prisma.lot.findFirst({
            where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}
        });
        if (!lot) return { success: false, message: 'Lote não encontrado.'};
        if (lot.status !== 'ABERTO_PARA_LANCES') return { success: false, message: 'Este lote não está aberto para lances.'};
        if (bidAmount <= lot.price) return { success: false, message: `O lance deve ser maior que R$ ${lot.price.toLocaleString('pt-BR')}.`};

        const newBid = await prisma.bid.create({
            data: {
                lotId: lot.id,
                auctionId: lot.auctionId,
                bidderId: userId,
                bidderDisplay: userDisplayName,
                amount: bidAmount,
            }
        });

        const updatedLot = await prisma.lot.update({
            where: { id: lot.id },
            data: {
                price: bidAmount,
                bidsCount: { increment: 1 }
            }
        });
        
        revalidatePath(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
        revalidatePath(`/auctions/${auctionIdOrPublicId}/live`);
        revalidatePath(`/live-dashboard`);
        
        return {
            success: true,
            message: "Lance realizado com sucesso!",
            updatedLot: {
                price: updatedLot.price,
                bidsCount: updatedLot.bidsCount,
            },
            newBid: newBid as unknown as BidInfo,
        };
    } catch (error: any) {
        console.error("Error placing bid:", error);
        return { success: false, message: "Ocorreu um erro ao registrar seu lance."};
    }
}

export async function placeMaxBid(lotId: string, userId: string, maxAmount: number): Promise<{ success: boolean, message: string }> {
  try {
    const lot = await prisma.lot.findUnique({ where: { id: lotId }});
    if (!lot) return { success: false, message: 'Lote não encontrado.' };
    
    await prisma.userLotMaxBid.upsert({
        where: { userId_lotId: { userId, lotId } },
        update: { maxAmount, isActive: true },
        create: { userId, lotId, maxAmount, isActive: true }
    });
    
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    return { success: true, message: "Lance máximo definido com sucesso!" };
  } catch (error) {
    console.error("Error setting max bid:", error);
    return { success: false, message: "Falha ao definir lance máximo." };
  }
}

export async function getActiveUserLotMaxBid(lotIdOrPublicId: string, userId: string): Promise<UserLotMaxBid | null> {
  if (!userId) return null;
  const lot = await prisma.lot.findFirst({ where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}});
  if (!lot) return null;

  try {
    const maxBid = await prisma.userLotMaxBid.findFirst({
        where: { userId, lotId: lot.id, isActive: true }
    });
    return maxBid as unknown as UserLotMaxBid | null;
  } catch (error) {
    console.error("Error fetching active max bid:", error);
    return null;
  }
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
    const lot = await prisma.lot.findFirst({ where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}});
    if (!lot) return [];

    try {
        const bids = await prisma.bid.findMany({
            where: { lotId: lot.id },
            orderBy: { timestamp: 'desc' }
        });
        return bids as unknown as BidInfo[];
    } catch (error) {
        console.error("Error fetching bids:", error);
        return [];
    }
}

export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
    const lot = await prisma.lot.findFirst({ where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}});
    if (!lot) return [];
    try {
        const reviews = await prisma.review.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
        return reviews as unknown as Review[];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}

export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  const lot = await prisma.lot.findFirst({ where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}});
  if (!lot) return { success: false, message: "Lote não encontrado." };

  try {
    const review = await prisma.review.create({
        data: { lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, rating, comment }
    });
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    return { success: true, message: "Avaliação enviada com sucesso!", reviewId: review.id };
  } catch(error) {
    console.error("Error creating review:", error);
    return { success: false, message: "Falha ao enviar avaliação." };
  }
}

export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
    const lot = await prisma.lot.findFirst({ where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}});
    if (!lot) return [];
    try {
        const questions = await prisma.lotQuestion.findMany({ where: { lotId: lot.id }, orderBy: { createdAt: 'desc' } });
        return questions as unknown as LotQuestion[];
    } catch (error) {
        console.error("Error fetching questions:", error);
        return [];
    }
}

export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  const lot = await prisma.lot.findFirst({ where: { OR: [{id: lotIdOrPublicId}, {publicId: lotIdOrPublicId}]}});
  if (!lot) return { success: false, message: "Lote não encontrado." };

  try {
    const question = await prisma.lotQuestion.create({
        data: { lotId: lot.id, auctionId: lot.auctionId, userId, userDisplayName, questionText, isPublic: true }
    });
    revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
    return { success: true, message: "Pergunta enviada com sucesso!", questionId: question.id };
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
  lotId: string,
  auctionId: string 
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.lotQuestion.update({
        where: { id: questionId },
        data: { answerText, answeredByUserId, answeredByUserDisplayName, answeredAt: new Date() }
    });
    revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
    return { success: true, message: "Resposta enviada."};
  } catch (error) {
    console.error("Error answering question:", error);
    return { success: false, message: "Falha ao enviar resposta."};
  }
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicIdOrSlug?: string): Promise<SellerProfileInfo | null> {
    if (!sellerIdOrPublicIdOrSlug) return null;
    try {
        const seller = await prisma.seller.findFirst({
            where: { OR: [{id: sellerIdOrPublicIdOrSlug}, {publicId: sellerIdOrPublicIdOrSlug}, {slug: sellerIdOrPublicIdOrSlug}] }
        });
        return seller as unknown as SellerProfileInfo | null;
    } catch(error) {
        console.error("Error fetching seller details:", error);
        return null;
    }
}
