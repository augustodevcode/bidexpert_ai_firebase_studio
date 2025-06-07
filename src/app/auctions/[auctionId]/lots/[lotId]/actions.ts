// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
'use server';

import type { Lot, BidInfo } from '@/types';
import { sampleLots, sampleLotBids, getAuctionStatusText } from '@/lib/sample-data'; // getAuctionStatusText para simular atualização de status
import { Timestamp } from 'firebase-admin/firestore'; // Para simular timestamp

interface PlaceBidResult {
  success: boolean;
  message: string;
  updatedLot?: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>>; // Apenas os campos que podem mudar
  newBid?: BidInfo;
}

// Simulação de uma "base de dados" em memória para os lances, já que sampleLotBids é estático.
// Em uma aplicação real, isso seria uma operação no Firestore.
let dynamicLotBids: BidInfo[] = [...sampleLotBids];
let dynamicSampleLots: Lot[] = JSON.parse(JSON.stringify(sampleLots)); // Deep copy para simular DB

export async function placeBidOnLot(
  lotId: string,
  auctionId: string,
  userId: string,
  userDisplayName: string,
  bidAmount: number
): Promise<PlaceBidResult> {
  console.log(`[Server Action - placeBidOnLot] Recebido lance para lotId: ${lotId}, auctionId: ${auctionId}, userId: ${userId}, amount: ${bidAmount}`);

  const lotIndex = dynamicSampleLots.findIndex(l => l.id === lotId && l.auctionId === auctionId);
  if (lotIndex === -1) {
    return { success: false, message: 'Lote não encontrado.' };
  }
  const lot = dynamicSampleLots[lotIndex];

  if (lot.status !== 'ABERTO_PARA_LANCES') {
    return { success: false, message: `Lances não estão abertos para este lote. Status atual: ${getAuctionStatusText(lot.status)}` };
  }

  const bidIncrement = lot.price > 10000 ? 500 : (lot.price > 1000 ? 100 : 50);
  const nextMinimumBid = lot.price + bidIncrement;

  if (bidAmount < lot.price + bidIncrement && bidAmount !== nextMinimumBid) {
     if (bidAmount < lot.price) {
        return { success: false, message: `Seu lance de R$ ${bidAmount.toLocaleString('pt-BR')} é menor que o lance atual de R$ ${lot.price.toLocaleString('pt-BR')}.` };
     }
     // Permitir lance igual ao próximo mínimo se não for menor que o preço atual.
     if (bidAmount < nextMinimumBid ) {
        return { success: false, message: `Seu lance deve ser de pelo menos R$ ${nextMinimumBid.toLocaleString('pt-BR')}.` };
     }
  }


  // Simular atualização do lote
  const updatedLotData: Partial<Pick<Lot, 'price' | 'bidsCount'>> = {
    price: bidAmount,
    bidsCount: (lot.bidsCount || 0) + 1,
  };
  dynamicSampleLots[lotIndex] = { ...lot, ...updatedLotData };

  // Simular adição ao histórico de lances
  const newBid: BidInfo = {
    id: `BID${Date.now()}`,
    lotId: lotId,
    bidderId: userId,
    bidderDisplay: userDisplayName.substring(0, 7) + '****', // Mascarar parte do nome
    amount: bidAmount,
    timestamp: new Date(), // Em app real, serverTimestamp
  };
  dynamicLotBids.unshift(newBid); // Adiciona no início para aparecer primeiro no histórico

  console.log(`[Server Action - placeBidOnLot] Lance de R$ ${bidAmount} para "${lot.title}" registrado com sucesso para ${userDisplayName}. Novo preço: ${updatedLotData.price}, Lances: ${updatedLotData.bidsCount}`);
  
  return {
    success: true,
    message: 'Seu lance foi registrado com sucesso!',
    updatedLot: updatedLotData,
    newBid: newBid,
  };
}