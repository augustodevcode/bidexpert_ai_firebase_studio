// src/repositories/auction.repository.ts
import { prisma } from '@/lib/prisma';
import type { Auction } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctionRepository {
  async findAll(): Promise<any[]> {
    return prisma.auction.findMany({
      orderBy: { auctionDate: 'desc' },
      include: { 
        lots: { select: { id: true } },
        seller: true // Include full seller object
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.auction.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        lots: { include: { bens: true } },
        auctioneer: true,
        seller: true, // Full seller object
        category: true,
        // auctionStages is a JSON field, not a relation, so it's returned by default.
      },
    });
  }
  
  async create(data: Prisma.AuctionCreateInput): Promise<Auction> {
    // @ts-ignore
    return prisma.auction.create({ data });
  }

  async update(id: string, data: Prisma.AuctionUpdateInput): Promise<Auction> {
    // @ts-ignore
    return prisma.auction.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.auction.delete({ where: { id } });
  }

  async countLots(auctionId: string): Promise<number> {
    return prisma.lot.count({ where: { auctionId } });
  }
  
  async findByAuctioneerSlug(auctioneerSlug: string): Promise<any[]> {
    return prisma.auction.findMany({
      where: {
        auctioneer: {
          OR: [
            { slug: auctioneerSlug },
            { id: auctioneerSlug },
            { publicId: auctioneerSlug },
          ],
        },
      },
      include: {
        lots: { select: { id: true } },
        seller: true,
      },
      orderBy: { auctionDate: 'desc' },
    });
  }
}
