// src/services/bid.service.ts
import { BidRepository } from '@/repositories/bid.repository';
import type { Prisma, Bid } from '@prisma/client';

export class BidService {
  private repository: BidRepository;

  constructor() {
    this.repository = new BidRepository();
  }

  async createBid(data: Prisma.BidCreateInput): Promise<Bid> {
    return this.repository.create(data);
  }
}
