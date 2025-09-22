// src/repositories/auctioneer.repository.ts
import { getPrismaInstance } from '@/lib/prisma';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctioneerRepository {
  private prisma;

  constructor() {
    this.prisma = getPrismaInstance();
  }

  async findAll(tenantId: string, limit?: number): Promise<AuctioneerProfileInfo[]> {
    return this.prisma.auctioneer.findMany({ 
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
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
