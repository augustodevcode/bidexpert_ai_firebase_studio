// src/repositories/auctioneer.repository.ts
import { getPrismaInstance } from '@/lib/prisma';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctioneerRepository {
  private prisma;

  constructor() {
    this.prisma = getPrismaInstance();
  }

  async findAll(tenantId: string): Promise<AuctioneerProfileInfo[]> {
    return this.prisma.auctioneer.findMany({ 
        where: { tenantId },
        orderBy: { name: 'asc' } 
    });
  }

  async findById(tenantId: string, id: string): Promise<AuctioneerProfileInfo | null> {
    return this.prisma.auctioneer.findFirst({ where: { id, tenantId } });
  }

  async findBySlug(tenantId: string, slugOrId: string): Promise<AuctioneerProfileInfo | null> {
      return this.prisma.auctioneer.findFirst({
        where: {
            tenantId,
            OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
        }
    });
  }

  async findAuctionsBySlug(tenantId: string, auctioneerSlug: string): Promise<any[]> {
    return this.prisma.auction.findMany({
        where: {
            tenantId,
            auctioneer: {
                OR: [{ slug: auctioneerSlug }, { id: auctioneerSlug }, { publicId: auctioneerSlug }]
            }
        },
        include: { 
            _count: { select: { lots: true } },
            seller: true 
        },
        orderBy: { auctionDate: 'desc' }
    });
  }

  async create(data: Prisma.AuctioneerCreateInput): Promise<AuctioneerProfileInfo> {
    return this.prisma.auctioneer.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<AuctioneerFormData>): Promise<AuctioneerProfileInfo> {
    // @ts-ignore
    return this.prisma.auctioneer.update({ where: { id, tenantId }, data });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.auctioneer.delete({ where: { id, tenantId } });
  }
}
