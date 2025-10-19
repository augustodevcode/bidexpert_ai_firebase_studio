// src/repositories/bid.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, Bid } from '@prisma/client';

export class BidRepository {
  async create(data: Prisma.BidCreateInput): Promise<Bid> {
    return prisma.bid.create({ data });
  }
}
