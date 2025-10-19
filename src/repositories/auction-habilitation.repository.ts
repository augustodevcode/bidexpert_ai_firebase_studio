// src/repositories/auction-habilitation.repository.ts
import { prisma } from '@/lib/prisma';
import type { Prisma, AuctionHabilitation } from '@prisma/client';

export class AuctionHabilitationRepository {
  async upsert(data: Prisma.AuctionHabilitationCreateInput): Promise<AuctionHabilitation> {
    return prisma.auctionHabilitation.upsert({
      where: { userId_auctionId: { userId: data.userId, auctionId: data.auctionId } },
      update: data,
      create: data,
    });
  }
}
