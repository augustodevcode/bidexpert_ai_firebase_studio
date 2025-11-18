// src/repositories/bid.repository.ts
import prisma from '@/lib/prisma';
import type { Prisma, Bid } from '@prisma/client';

export class BidRepository {
  async create(data: Prisma.BidCreateInput): Promise<Bid> {
    return prisma.bid.create({ data });
  }

  async deleteMany(where: Prisma.BidWhereInput): Promise<Prisma.BatchPayload> {
    return prisma.bid.deleteMany({ where });
  }

  async count(): Promise<number> {
    return prisma.bid.count();
  }
}
