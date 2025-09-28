// src/app/dashboard/bids/actions.ts
/**
 * @fileoverview Server Actions para a página "Meus Lances".
 * Contém a lógica de backend para buscar todos os lances feitos por um usuário
 * específico, enriquecendo os dados com o status atual de cada lance (ganhando,
 * perdendo, arrematado, etc.) para exibição no painel do usuário.
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { UserBid } from '@/types';

/**
 * Fetches all bids placed by a specific user.
 * It enriches the bid data with details from the associated lot and auction,
 * and determines the current status of each bid.
 * @param {string} userId - The ID of the user whose bids are to be fetched.
 * @returns {Promise<UserBid[]>} A promise that resolves to an array of UserBid objects.
 */
export async function getBidsForUserAction(userId: string): Promise<UserBid[]> {
  if (!userId) {
    console.warn("[Action - getBidsForUser] No userId provided.");
    return [];
  }
  
  const userBidsRaw = await prisma.bid.findMany({
    where: { bidderId: userId },
    orderBy: { timestamp: 'desc' },
    distinct: ['lotId'], // Get only the latest bid from the user for each lot
    include: {
        lot: {
            include: {
                auction: {
                    select: { title: true }
                }
            }
        }
    }
  });

  return userBidsRaw.map(bid => {
    let bidStatus: UserBid['bidStatus'] = 'PERDENDO';

    if (bid.lot.status === 'ABERTO_PARA_LANCES') {
        if (bid.amount === bid.lot.price) {
            bidStatus = 'GANHANDO';
        } else {
            bidStatus = 'PERDENDO';
        }
    } else if (bid.lot.status === 'VENDIDO') {
        if (bid.lot.winnerId === userId) {
            bidStatus = 'ARREMATADO';
        } else {
            bidStatus = 'NAO_ARREMATADO';
        }
    } else if (bid.lot.status === 'ENCERRADO' || bid.lot.status === 'NAO_VENDIDO') {
        bidStatus = 'ENCERRADO';
    } else if (bid.lot.status === 'CANCELADO') {
        bidStatus = 'CANCELADO';
    }

    return {
        id: bid.id,
        user: {} as any, // User data is not needed here
        amount: bid.amount,
        date: bid.timestamp,
        // @ts-ignore
        lot: { ...bid.lot, auctionName: bid.lot.auction.title },
        bidStatus: bidStatus,
        userBidAmount: bid.amount,
    };
  });
}
