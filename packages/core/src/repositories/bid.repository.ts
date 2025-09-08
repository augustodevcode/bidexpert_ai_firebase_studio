// packages/core/src/repositories/bid.repository.ts
import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';
import type { BidInfo, UserLotMaxBid } from '@bidexpert/core';

export class BidRepository {
  async findHighestBid(lotId: string): Promise<BidInfo | null> {
    return prisma.bid.findFirst({
      where: { lotId },
      orderBy: { amount: 'desc' },
    });
  }

  async findBidsByLotId(lotId: string): Promise<BidInfo[]> {
    return prisma.bid.findMany({
      where: { lotId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async createBid(data: Prisma.BidCreateInput): Promise<BidInfo> {
    return prisma.bid.create({ data });
  }

  async findActiveMaxBid(userId: string, lotId: string): Promise<UserLotMaxBid | null> {
    return prisma.userLotMaxBid.findFirst({
      where: { userId, lotId, isActive: true },
    });
  }

  async upsertMaxBid(data: Prisma.UserLotMaxBidUncheckedCreateInput): Promise<UserLotMaxBid> {
    return prisma.userLotMaxBid.upsert({
      where: { userId_lotId: { userId: data.userId, lotId: data.lotId } },
      update: { maxAmount: data.maxAmount, isActive: true },
      create: data,
    });
  }
}
