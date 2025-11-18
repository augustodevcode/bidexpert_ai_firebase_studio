// src/services/bid.service.ts
import { BidRepository } from '@/repositories/bid.repository';
import type { Prisma, Bid } from '@prisma/client';
import { bidEventEmitter } from '@/services/realtime-bids.service';
import logger from '@/lib/logger';

export class BidService {
  private repository: BidRepository;

  constructor() {
    this.repository = new BidRepository();
  }

  async createBid(data: Prisma.BidCreateInput): Promise<Bid> {
    const bid = await this.repository.create(data);
    try {
      bidEventEmitter.emitBid({
        lotId: bid.lotId,
        amount: Number(bid.amount),
        bidderId: bid.bidderId,
        bidderDisplay: bid.bidderDisplay || 'Anônimo',
        timestamp: bid.timestamp,
        tenantId: bid.tenantId,
        auctionId: bid.auctionId,
      });
    } catch (e) {
      logger.warn('[BidService] Falha ao emitir evento realtime:', { error: String(e) });
    }
    return bid;
  }

  async deleteMany(where: Prisma.BidWhereInput): Promise<Prisma.BatchPayload> {
    return this.repository.deleteMany(where);
  }

  async countBids(): Promise<number> {
    return this.repository.count();
  }
}
