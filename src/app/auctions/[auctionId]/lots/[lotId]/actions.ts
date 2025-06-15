
'use server';

import type { Lot, BidInfo, Review, LotQuestion, SellerProfileInfo } from '@/types';
import { revalidatePath } from 'next/cache';
import { sampleLotQuestions, sampleLotReviews, sampleLots, sampleBids, sampleSellers, sampleAuctions } from '@/lib/sample-data'; 

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
  console.log(`[Action - placeBidOnLot - SampleData Mode] Simulating bid for lot: ${lotIdOrPublicId}, amount: ${bidAmount}`);
  
  const lotIndex = sampleLots.findIndex(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (lotIndex === -1) {
    return { success: false, message: `Lote com ID/PublicID "${lotIdOrPublicId}" não encontrado nos dados de exemplo.` };
  }
  
  const lot = sampleLots[lotIndex];
  if (bidAmount <= lot.price) {
    return { success: false, message: "Lance (simulado) deve ser maior que o atual." };
  }

  const newBid: BidInfo = {
    id: `sample-bid-${Date.now()}`,
    lotId: lot.id, 
    auctionId: lot.auctionId,
    bidderId: userId,
    bidderDisplay: userDisplayName,
    amount: bidAmount,
    timestamp: new Date(),
  };
  
  sampleBids.unshift(newBid); 

  const updatedLotData = { 
    price: bidAmount, 
    bidsCount: (lot.bidsCount || 0) + 1 
  };
  
  // Simula a atualização no array sampleLots em memória (não persistirá entre reinícios de servidor)
  // Isso é principalmente para que o client-side possa refletir a mudança se ele refizer o fetch da lot.
  // @ts-ignore
  sampleLots[lotIndex] = { ...sampleLots[lotIndex], ...updatedLotData };
  
  revalidatePath(`/auctions/${auctionIdOrPublicId}/lots/${lotIdOrPublicId}`);
  console.log(`[Action - placeBidOnLot - SampleData Mode] Lance simulado para ${lotIdOrPublicId} de ${bidAmount}.`);

  return { 
    success: true, 
    message: "Lance (simulado) registrado com sucesso!", 
    updatedLot: updatedLotData, 
    newBid 
  };
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
  console.log(`[Action - getBidsForLot - SampleData Mode] Fetching bids for lot ID/PublicID: ${lotIdOrPublicId}`);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (lot) {
    const bids = sampleBids.filter(bid => bid.lotId === lot.id);
    return Promise.resolve(JSON.parse(JSON.stringify(bids)));
  }
  return Promise.resolve([]);
}

// --- Reviews Actions ---
export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
  console.log(`[Action - getReviewsForLot - SampleData Mode] Fetching reviews for lot ID/PublicID: ${lotIdOrPublicId}`);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (lot) {
    const reviews = sampleLotReviews.filter(review => review.lotId === lot.id);
    return Promise.resolve(JSON.parse(JSON.stringify(reviews)));
  }
  return Promise.resolve([]);
}

export async function createReview(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  rating: number,
  comment: string
): Promise<{ success: boolean; message: string; reviewId?: string }> {
  console.log(`[Action - createReview - SampleData Mode] Simulating review for lot: ${lotIdOrPublicId}`);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (!lot) {
    return { success: false, message: `Lote com ID/PublicID "${lotIdOrPublicId}" (simulado) não encontrado para avaliação.` };
  }
  
  const newReview: Review = {
    id: `sample-review-${Date.now()}`,
    lotId: lot.id,
    auctionId: lot.auctionId,
    userId,
    userDisplayName,
    rating,
    comment,
    createdAt: new Date(),
  };
  sampleLotReviews.unshift(newReview);
  
  revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
  return { success: true, message: "Avaliação (simulada) adicionada.", reviewId: newReview.id };
}

// --- Questions Actions ---
export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
  console.log(`[Action - getQuestionsForLot - SampleData Mode] Fetching questions for lot ID/PublicID: ${lotIdOrPublicId}`);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (lot) {
    const questions = sampleLotQuestions.filter(q => q.lotId === lot.id);
    return Promise.resolve(JSON.parse(JSON.stringify(questions)));
  }
  return Promise.resolve([]);
}

export async function askQuestionOnLot(
  lotIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  questionText: string
): Promise<{ success: boolean; message: string; questionId?: string }> {
  console.log(`[Action - askQuestionOnLot - SampleData Mode] Simulating question for lot: ${lotIdOrPublicId}`);
   const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
   if (!lot) {
    return { success: false, message: `Lote com ID/PublicID "${lotIdOrPublicId}" (simulado) não encontrado para pergunta.` };
  }

  const newQuestion: LotQuestion = {
    id: `sample-qst-${Date.now()}`,
    lotId: lot.id,
    auctionId: lot.auctionId,
    userId,
    userDisplayName,
    questionText,
    createdAt: new Date(),
    isPublic: true,
  };
  sampleLotQuestions.unshift(newQuestion);

  revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.publicId || lot.id}`);
  return { success: true, message: "Pergunta (simulada) enviada.", questionId: newQuestion.id };
}

export async function answerQuestionOnLot(
  questionId: string, 
  answerText: string,
  answeredByUserId: string,
  answeredByUserDisplayName: string,
  lotId: string, 
  auctionId: string 
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - answerQuestionOnLot - SampleData Mode] Simulating answer for question ID: ${questionId}`);
  const questionIndex = sampleLotQuestions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) {
    return { success: false, message: "Pergunta (simulada) não encontrada." };
  }
  // Simular atualização da pergunta em memória (não persistente)
  // sampleLotQuestions[questionIndex] = {
  //   ...sampleLotQuestions[questionIndex],
  //   answerText,
  //   answeredAt: new Date(),
  //   answeredByUserId,
  //   answeredByUserDisplayName,
  // };
  revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
  return { success: true, message: "Pergunta (simulada) respondida." };
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicIdOrSlug?: string): Promise<SellerProfileInfo | null> {
    console.log(`[Action - getSellerDetailsForLotPage - SampleData Mode] Fetching seller ID/publicId/slug: ${sellerIdOrPublicIdOrSlug}`);
    if (!sellerIdOrPublicIdOrSlug) return Promise.resolve(null);
    const seller = sampleSellers.find(s => s.id === sellerIdOrPublicIdOrSlug || s.publicId === sellerIdOrPublicIdOrSlug || s.slug === sellerIdOrPublicIdOrSlug);
    return Promise.resolve(seller ? JSON.parse(JSON.stringify(seller)) : null);
}
