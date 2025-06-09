
// src/app/auctions/[auctionId]/lots/[lotId]/actions.ts
'use server';

import { dbAdmin, ensureAdminInitialized, FieldValue, Timestamp as AdminTimestamp } from '@/lib/firebase/admin';
import type { Lot, BidInfo, Auction } from '@/types';
import { getAuctionStatusText } from '@/lib/sample-data'; 

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
  console.log(`[Server Action - placeBidOnLot] Lance para lotId: ${lotId}, auctionId: ${auctionId}, userId: ${userId}, amount: ${bidAmount}`);
  
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized(); 

  if (sdkError || !currentDbAdmin) {
    console.error("[Server Action - placeBidOnLot] dbAdmin não inicializado.", sdkError?.message);
    return { success: false, message: `Erro de configuração do servidor (dbAdmin ausente). Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }

  if (!userId || !userDisplayName) {
    return { success: false, message: 'Usuário não autenticado ou informações do usuário ausentes.' };
  }

  try {
    const lotDocRef = currentDbAdmin.collection('lots').doc(lotId);
    const auctionDocRef = currentDbAdmin.collection('auctions').doc(auctionId);

    const lotDoc = await lotDocRef.get();
    const auctionDoc = await auctionDocRef.get();

    if (!lotDoc.exists) {
      return { success: false, message: 'Lote não encontrado.' };
    }
    if (!auctionDoc.exists) {
      return { success: false, message: 'Leilão não encontrado.' };
    }

    const lot = lotDoc.data() as Lot;
    const auction = auctionDoc.data() as Auction;

    if (auction.status !== 'ABERTO' && auction.status !== 'ABERTO_PARA_LANCES') {
        return { success: false, message: `Leilão ${getAuctionStatusText(auction.status)}.` };
    }
    if (lot.status !== 'ABERTO_PARA_LANCES') {
      return { success: false, message: `Lances não estão abertos para este lote. Status atual: ${getAuctionStatusText(lot.status)}` };
    }

    const currentLotPrice = lot.price || 0;
    const bidIncrement = currentLotPrice > 10000 ? 500 : (currentLotPrice > 1000 ? 100 : 50);
    const nextMinimumBid = currentLotPrice + bidIncrement;

    if (bidAmount < currentLotPrice + bidIncrement && bidAmount !== nextMinimumBid) {
        if (bidAmount < currentLotPrice) {
            return { success: false, message: `Seu lance de R$ ${bidAmount.toLocaleString('pt-BR')} é menor que o lance atual de R$ ${currentLotPrice.toLocaleString('pt-BR')}.` };
        }
        if (bidAmount < nextMinimumBid ) {
            return { success: false, message: `Seu lance deve ser de pelo menos R$ ${nextMinimumBid.toLocaleString('pt-BR')}.` };
        }
    }
    
    const newBidRef = currentDbAdmin.collection('lots').doc(lotId).collection('bids').doc();
    const newBidData: Omit<BidInfo, 'id'> = {
      lotId: lotId,
      auctionId: auctionId,
      bidderId: userId,
      bidderDisplay: userDisplayName.substring(0, Math.min(7, userDisplayName.length)) + '****',
      amount: bidAmount,
      timestamp: FieldValue.serverTimestamp() as any, 
    };

    await newBidRef.set(newBidData);

    const updatedLotFirestoreData = {
      price: bidAmount,
      bidsCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await lotDocRef.update(updatedLotFirestoreData);
    
    const simulatedTimestamp = new Date();
    const newBidForUI: BidInfo = {
        ...newBidData,
        id: newBidRef.id,
        timestamp: simulatedTimestamp,
    };
    const updatedLotForUI: Partial<Pick<Lot, 'price' | 'bidsCount' | 'status'>> = {
        price: bidAmount,
        bidsCount: (lot.bidsCount || 0) + 1,
    };

    console.log(`[Server Action - placeBidOnLot] Lance de R$ ${bidAmount} para "${lot.title}" registrado. Novo preço: ${updatedLotFirestoreData.price}, Lances incrementados.`);
    
    return {
      success: true,
      message: 'Seu lance foi registrado com sucesso!',
      updatedLot: updatedLotForUI,
      newBid: newBidForUI,
    };
  } catch (error: any) {
    console.error(`[Server Action - placeBidOnLot] Error placing bid for lot ${lotId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao registrar o lance.' };
  }
}

export async function getBidsForLot(lotId: string): Promise<BidInfo[]> {
  if (!lotId) {
    console.warn("[Server Action - getBidsForLot] Lot ID is required.");
    return [];
  }
  
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    console.error("[Server Action - getBidsForLot] dbAdmin não inicializado.", sdkError?.message);
    return [];
  }
  try {
    const bidsSnapshot = await currentDbAdmin.collection('lots').doc(lotId).collection('bids')
      .orderBy('timestamp', 'desc')
      .get();

    if (bidsSnapshot.empty) {
      return [];
    }
    return bidsSnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const timestamp = data.timestamp as AdminTimestamp;
      return {
        id: docSnap.id,
        lotId: data.lotId,
        auctionId: data.auctionId,
        bidderId: data.bidderId,
        bidderDisplay: data.bidderDisplay,
        amount: data.amount,
        timestamp: timestamp.toDate(),
      } as BidInfo;
    });
  } catch (error: any) {
    console.error(`[Server Action - getBidsForLot] Error fetching bids for lot ${lotId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return []; 
  }
}

