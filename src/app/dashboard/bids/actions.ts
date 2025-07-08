/**
 * @fileoverview Server Actions for fetching a user's bidding activity.
 * Provides a function to get all bids made by a specific user, along with
 * the current status of each bid (e.g., winning, losing, won).
 */
'use server';

import { prisma } from '@/lib/prisma';
import type { UserBid, UserWin } from '@/types';

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
  
  try {
    const bids = await prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        lot: {
          include: {
            auction: true,
            bids: {
              orderBy: { amount: 'desc' },
              take: 1
            },
            wins: {
              take: 1
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Create a distinct list of lots to find winning bids for
    const lotIds = [...new Set(bids.map(b => b.lotId))];
    const winningBidsForLots = await prisma.userWin.findMany({
      where: {
        lotId: { in: lotIds },
        userId: userId
      }
    });
    const winningBidMap = new Map(winningBidsForLots.map(wb => [wb.lotId, wb]));


    const userBids = bids.map(bid => {
      let bidStatus: UserBid['bidStatus'] = 'PERDENDO';
      const highestBid = bid.lot.bids[0]?.amount;

      if (bid.lot.status === 'VENDIDO') {
        bidStatus = winningBidMap.has(bid.lotId) ? 'ARREMATADO' : 'NAO_ARREMATADO';
      } else if (bid.lot.status === 'ENCERRADO' || bid.lot.status === 'NAO_VENDIDO') {
        bidStatus = 'NAO_ARREMATADO';
      } else if (bid.lot.status === 'CANCELADO') {
        bidStatus = 'CANCELADO';
      } else if (highestBid && bid.amount >= highestBid) {
        bidStatus = 'GANHANDO';
      }

      return {
        id: bid.id,
        lotId: bid.lotId,
        auctionId: bid.lot.auctionId,
        lotTitle: bid.lot.title,
        lotImageUrl: bid.lot.imageUrl,
        lotEndDate: bid.lot.endDate,
        userBidAmount: bid.amount,
        currentLotPrice: bid.lot.price,
        bidDate: bid.timestamp,
        bidStatus: bidStatus,
        lot: { // Pass a minimal lot object
            ...bid.lot,
            auctionName: bid.lot.auction?.title
        }
      } as unknown as UserBid;
    });

    // De-duplicate to show only the highest bid per lot for the user
    const latestBidsMap = new Map<string, UserBid>();
    for (const bid of userBids) {
        if (!latestBidsMap.has(bid.lotId)) {
            latestBidsMap.set(bid.lotId, bid);
        }
    }

    return Array.from(latestBidsMap.values());
  } catch (error) {
    console.error(`[Action - getBidsForUser] Error fetching bids for user ${userId}:`, error);
    return [];
  }
}

    