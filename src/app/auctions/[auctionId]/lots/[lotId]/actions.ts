
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { Lot, BidInfo, IDatabaseAdapter, Review, LotQuestion, SellerProfileInfo } from '@/types';
import { revalidatePath } from 'next/cache';
import { sampleLotQuestions, sampleLotReviews, sampleLots } from '@/lib/sample-data'; // Import sampleLots

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
  // Esta action ainda falhará se o lotId for de sample-data e não existir no DB,
  // pois precisa encontrar e atualizar o lote no DB.
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
  // Usando sampleLotReviews para fins de teste, conforme solicitado.
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
  let lotAuctionId: string | undefined;

  // Tenta buscar do banco de dados primeiro
  const dbLot = await db.getLot(lotId);
  if (dbLot) {
    lotAuctionId = dbLot.auctionId;
  } else {
    // Fallback para sampleLots se não encontrar no DB (para fins de teste)
    const sampleLot = sampleLots.find(l => l.id === lotId);
    if (sampleLot) {
      lotAuctionId = sampleLot.auctionId;
      console.warn(`[createReview] Lote ${lotId} não encontrado no DB, usando auctionId de sample-data: ${lotAuctionId}`);
    } else {
      return { success: false, message: 'Lote não encontrado nem no banco de dados nem nos dados de exemplo.' };
    }
  }
  
  // A escrita da review ainda vai para o banco de dados.
  // Em um cenário de teste puro com sample-data, isso seria simulado ou não persistido.
  const result = await db.createReview({
    lotId,
    auctionId: lotAuctionId, // Usa o auctionId obtido
    userId,
    userDisplayName,
    rating,
    comment,
  });

  if (result.success) {
    // Revalidação pode não ter efeito visual imediato se a leitura de reviews também for de sample-data
    revalidatePath(`/auctions/${lotAuctionId}/lots/${lotId}`);
  }
  return result;
}

// --- Questions Actions ---
export async function getQuestionsForLot(lotId: string): Promise<LotQuestion[]> {
  if (!lotId) return [];
  // Usando sampleLotQuestions para fins de teste, conforme solicitado.
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
  let lotAuctionId: string | undefined;

  const dbLot = await db.getLot(lotId);
  if (dbLot) {
    lotAuctionId = dbLot.auctionId;
  } else {
    const sampleLot = sampleLots.find(l => l.id === lotId);
    if (sampleLot) {
      lotAuctionId = sampleLot.auctionId;
      console.warn(`[askQuestionOnLot] Lote ${lotId} não encontrado no DB, usando auctionId de sample-data: ${lotAuctionId}`);
    } else {
      return { success: false, message: 'Lote não encontrado nem no banco de dados nem nos dados de exemplo.' };
    }
  }
  
  const result = await db.createQuestion({
    lotId,
    auctionId: lotAuctionId, // Usa o auctionId obtido
    userId,
    userDisplayName,
    questionText,
  });

  if (result.success) {
    revalidatePath(`/auctions/${lotAuctionId}/lots/${lotId}`);
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
  // A implementação de db.answerQuestion nos adapters SQL/Firestore precisará do lotId para formar o caminho correto.
  // Se o adapter já está esperando isso, ótimo.
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

