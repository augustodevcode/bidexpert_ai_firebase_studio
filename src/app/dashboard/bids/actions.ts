/**
 * @fileoverview Server Actions for fetching a user's bidding activity.
 * Provides a function to get all bids made by a specific user, along with
 * the current status of each bid (e.g., winning, losing, won).
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
  
  try {
    const bids = await prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        lot: {
          include: {
            auction: true
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const userBids = bids.map(bid => {
      // This logic needs to be smarter in a real app, especially with winning bids
      let bidStatus: UserBid['bidStatus'] = 'PERDENDO';
      if (bid.lot.price === bid.amount) {
          bidStatus = 'GANHANDO';
      }
      if (bid.lot.status === 'VENDIDO' && (bid.lot as any).winningBidderId === userId) {
          bidStatus = 'ARREMATADO';
      } else if (bid.lot.status === 'VENDIDO' || bid.lot.status === 'NAO_VENDIDO') {
          bidStatus = 'NAO_ARREMATADO';
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

    return userBids;
  } catch (error) {
    console.error(`[Action - getBidsForUser] Error fetching bids for user ${userId}:`, error);
    return [];
  }
}
