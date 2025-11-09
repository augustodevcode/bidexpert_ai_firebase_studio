import { BidService } from '../src/services/bid.service';
import { AuctionService } from '../src/services/auction.service';
import { LotService } from '../src/services/lot.service';
import { ServiceExtensions } from './types';
import { prisma } from '../src/lib/prisma';

export function createServiceExtensions(
    bidService: BidService,
    auctionService: AuctionService,
    lotService: LotService
): ServiceExtensions {
    return {
        async getHighestBidForLot(lotId: string | bigint) {
            const bids = await prisma.bid.findMany({
                where: { lotId: BigInt(lotId.toString()) },
                orderBy: { value: 'desc' },
                take: 1
            });
            return bids[0] || null;
        },

        async getAuctionsWithoutTenant() {
            const defaultTenantId = '1';
            return auctionService.getAuctions(defaultTenantId);
        },

        async getLotsForAuction(auctionId: string | bigint) {
            return prisma.lot.findMany({
                where: { auctionId: BigInt(auctionId.toString()) }
            });
        }
    };
}