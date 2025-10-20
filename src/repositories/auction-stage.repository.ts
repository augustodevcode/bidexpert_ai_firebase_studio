// src/repositories/auction-stage.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, AuctionStage } from '@prisma/client';

export class AuctionStageRepository {
  async create(data: Prisma.AuctionStageCreateInput): Promise<AuctionStage> {
    return prisma.auctionStage.create({ data });
  }

  async findById(id: string): Promise<AuctionStage | null> {
    return prisma.auctionStage.findUnique({ where: { id } });
  }

  async findMany(where: Prisma.AuctionStageWhereInput): Promise<AuctionStage[]> {
    return prisma.auctionStage.findMany({ where });
  }

  async deleteMany(where: Prisma.AuctionStageWhereInput): Promise<Prisma.BatchPayload> {
    return prisma.auctionStage.deleteMany({ where });
  }
}
