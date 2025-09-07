// src/repositories/auctioneer.repository.ts
import { prisma } from '@/lib/prisma';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctioneerRepository {
  async findAll(): Promise<AuctioneerProfileInfo[]> {
    return prisma.auctioneer.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<AuctioneerProfileInfo | null> {
    return prisma.auctioneer.findFirst({ where: { OR: [{id}, {publicId: id}]} });
  }

  async findBySlug(slugOrId: string): Promise<AuctioneerProfileInfo | null> {
    return prisma.auctioneer.findFirst({
        where: {
            OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
        }
    });
  }

  async create(data: Prisma.AuctioneerCreateInput): Promise<AuctioneerProfileInfo> {
    return prisma.auctioneer.create({ data });
  }

  async update(id: string, data: Partial<AuctioneerFormData>): Promise<AuctioneerProfileInfo> {
    // @ts-ignore
    return prisma.auctioneer.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.auctioneer.delete({ where: { id } });
  }
}
