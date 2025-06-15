
'use server';

import { revalidatePath } from 'next/cache';
import { sampleLots, sampleAuctions, sampleLotCategories, sampleStates, sampleCities, slugify } from '@/lib/sample-data';
import type { Lot, LotFormData, LotDbData, BidInfo, Review, LotQuestion } from '@/types';
// Actions from other modules might still be called to get names if IDs are not directly in sample data.
// These should eventually also be mocked if true isolation is needed, but for now, they might hit DB for roles/platform_settings.
import { getLotCategoryByName } from '@/app/admin/categories/actions'; // This will use sample-data for categories
import { getAuction } from '@/app/admin/auctions/actions'; // This will use sample-data for auctions
import { getState } from '@/app/admin/states/actions'; // This will use sample-data for states
import { getCity } from '@/app/admin/cities/actions';   // This will use sample-data for cities

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string; lotPublicId?: string; }> {
  console.log(`[Action - createLot - SampleData Mode] Simulating creation for: ${data.title}`);
  await delay(100);
  revalidatePath('/admin/lots');
  if (data.auctionId) {
    revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
  }
  return { success: true, message: `Lote "${data.title}" (simulado) criado!`, lotId: `sample-lot-${Date.now()}`, lotPublicId: `LOT-PUB-SAMP-${Date.now()}` };
}

export async function getLots(auctionIdParam?: string): Promise<Lot[]> {
  console.log(`[Action - getLots - SampleData Mode] Fetching from sample-data.ts. Auction filter: ${auctionIdParam}`);
  await delay(50);
  let lotsToReturn = JSON.parse(JSON.stringify(sampleLots));
  if (auctionIdParam) {
    // auctionIdParam could be the numeric ID or public ID
    const auction = sampleAuctions.find(a => a.id === auctionIdParam || a.publicId === auctionIdParam);
    if (auction) {
        lotsToReturn = lotsToReturn.filter((lot: Lot) => lot.auctionId === auction.id);
    } else {
        lotsToReturn = []; // No matching auction found
    }
  }
  // Enrich with names if IDs are present (simulating joins)
  for (const lot of lotsToReturn) {
    if (lot.categoryId && !lot.type) {
        const cat = sampleLotCategories.find(c => c.id === lot.categoryId || c.slug === lot.categoryId);
        if (cat) lot.type = cat.name;
    }
    if (lot.auctionId && !lot.auctionName) {
        const auc = sampleAuctions.find(a => a.id === lot.auctionId || a.publicId === lot.auctionId);
        if (auc) lot.auctionName = auc.title;
    }
     if (lot.stateId && !lot.stateUf) {
        const st = sampleStates.find(s => s.id === lot.stateId || s.slug === lot.stateId);
        if (st) lot.stateUf = st.uf;
    }
    if (lot.cityId && !lot.cityName) {
        const ci = sampleCities.find(c => String(c.id) === lot.cityId || `${c.stateId}-${c.slug}` === lot.cityId);
        if (ci) lot.cityName = ci.name;
    }
  }
  return Promise.resolve(lotsToReturn);
}

export async function getLot(idOrPublicId: string): Promise<Lot | null> {
  console.log(`[Action - getLot - SampleData Mode] Fetching ID/publicId: ${idOrPublicId}`);
  await delay(50);
  const lot = sampleLots.find(l => l.id === idOrPublicId || l.publicId === idOrPublicId);
  if (lot) {
    const enrichedLot = JSON.parse(JSON.stringify(lot));
    if (enrichedLot.categoryId && !enrichedLot.type) {
        const cat = sampleLotCategories.find(c => c.id === enrichedLot.categoryId || c.slug === enrichedLot.categoryId);
        if (cat) enrichedLot.type = cat.name;
    }
    if (enrichedLot.auctionId && !enrichedLot.auctionName) {
        const auc = sampleAuctions.find(a => a.id === enrichedLot.auctionId || a.publicId === enrichedLot.auctionId);
        if (auc) enrichedLot.auctionName = auc.title;
    }
    if (enrichedLot.stateId && !enrichedLot.stateUf) {
        const st = sampleStates.find(s => s.id === enrichedLot.stateId || s.slug === enrichedLot.stateId);
        if (st) enrichedLot.stateUf = st.uf;
    }
    if (enrichedLot.cityId && !enrichedLot.cityName) {
        const ci = sampleCities.find(c => String(c.id) === enrichedLot.cityId || `${c.stateId}-${c.slug}` === enrichedLot.cityId);
        if (ci) enrichedLot.cityName = ci.name;
    }
    return Promise.resolve(enrichedLot);
  }
  return Promise.resolve(null);
}

export async function updateLot(
  idOrPublicId: string,
  data: Partial<LotFormData>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateLot - SampleData Mode] Simulating update for ID/publicId: ${idOrPublicId} with data:`, data);
  await delay(100);
  revalidatePath('/admin/lots');
  revalidatePath(`/admin/lots/${idOrPublicId}/edit`);
  if (data.auctionId) {
    revalidatePath(`/admin/auctions/${data.auctionId}/edit`);
  }
  return { success: true, message: `Lote (simulado) atualizado!` };
}

export async function deleteLot(
  idOrPublicId: string,
  auctionId?: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - deleteLot - SampleData Mode] Simulating deletion for ID/publicId: ${idOrPublicId}`);
  await delay(100);
  revalidatePath('/admin/lots');
  if (auctionId) {
    revalidatePath(`/admin/auctions/${auctionId}/edit`);
  }
  return { success: true, message: `Lote (simulado) excluído!` };
}

export async function getBidsForLot(lotIdOrPublicId: string): Promise<BidInfo[]> {
  console.log(`[Action - getBidsForLot - SampleData Mode] Fetching bids for lot ID/publicId: ${lotIdOrPublicId}`);
  await delay(50);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (lot) {
    const bids = sampleBids.filter(bid => bid.lotId === lot.id);
    return Promise.resolve(JSON.parse(JSON.stringify(bids)));
  }
  return Promise.resolve([]);
}

export async function placeBidOnLot(
  lotIdOrPublicId: string,
  auctionIdOrPublicId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<{ success: boolean; message: string; updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; newBid?: BidInfo }> {
  console.log(`[Action - placeBidOnLot - SampleData Mode] Simulating bid for lot: ${lotIdOrPublicId}, amount: ${bidAmount}`);
  await delay(100);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (!lot) {
    return { success: false, message: `Lote com ID/PublicID "${lotIdOrPublicId}" (simulado) não encontrado.` };
  }
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
  // Note: This won't actually update sampleLots in the file, just simulates the action.
  return { success: true, message: "Lance (simulado) registrado!", updatedLot: { price: bidAmount, bidsCount: (lot.bidsCount || 0) + 1 }, newBid };
}

// --- Reviews Actions ---
export async function getReviewsForLot(lotIdOrPublicId: string): Promise<Review[]> {
  console.log(`[Action - getReviewsForLot - SampleData Mode] Fetching reviews for lot ID/publicId: ${lotIdOrPublicId}`);
  await delay(50);
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
  await delay(100);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
  if (!lot) {
    return { success: false, message: `Lote com ID/PublicID "${lotIdOrPublicId}" (simulado) não encontrado para avaliação.` };
  }
  revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  return { success: true, message: "Avaliação (simulada) adicionada.", reviewId: `sample-review-${Date.now()}` };
}

// --- Questions Actions ---
export async function getQuestionsForLot(lotIdOrPublicId: string): Promise<LotQuestion[]> {
  console.log(`[Action - getQuestionsForLot - SampleData Mode] Fetching questions for lot ID/publicId: ${lotIdOrPublicId}`);
  await delay(50);
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
  await delay(100);
  const lot = sampleLots.find(l => l.id === lotIdOrPublicId || l.publicId === lotIdOrPublicId);
   if (!lot) {
    return { success: false, message: `Lote com ID/PublicID "${lotIdOrPublicId}" (simulado) não encontrado para pergunta.` };
  }
  revalidatePath(`/auctions/${lot.auctionId}/lots/${lot.id}`);
  return { success: true, message: "Pergunta (simulada) enviada.", questionId: `sample-qst-${Date.now()}` };
}

export async function answerQuestionOnLot(
  questionId: string, // This would be the sample question ID
  answerText: string,
  answeredByUserId: string,
  answeredByUserDisplayName: string,
  lotId: string, // ID do lote (pode ser publicId)
  auctionId: string // ID do leilão (pode ser publicId)
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - answerQuestionOnLot - SampleData Mode] Simulating answer for question ID: ${questionId}`);
  await delay(100);
  // In a real sample data mutation, you would find the question in sampleLotQuestions and add the answer.
  // For now, just simulate success.
  revalidatePath(`/auctions/${auctionId}/lots/${lotId}`);
  return { success: true, message: "Pergunta (simulada) respondida." };
}

export async function getSellerDetailsForLotPage(sellerIdOrPublicId?: string): Promise<SellerProfileInfo | null> {
    console.log(`[Action - getSellerDetailsForLotPage - SampleData Mode] Fetching seller ID/publicId: ${sellerIdOrPublicId}`);
    if (!sellerIdOrPublicId) return Promise.resolve(null);
    await delay(50);
    const seller = sampleSellers.find(s => s.id === sellerIdOrPublicId || s.publicId === sellerIdOrPublicId || s.slug === sellerIdOrPublicId);
    return Promise.resolve(seller ? JSON.parse(JSON.stringify(seller)) : null);
}

    