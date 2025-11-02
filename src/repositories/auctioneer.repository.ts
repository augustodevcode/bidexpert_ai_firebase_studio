// src/repositories/auctioneer.repository.ts
import { prisma } from '@/lib/prisma';
import type { AuctioneerFormData, AuctioneerProfileInfo } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctioneerRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(tenantId: string, limit?: number): Promise<any[]> {
    return this.prisma.auctioneer.findMany({ 
        where: { tenantId: tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
  }

  async findById(tenantId: string, id: string): Promise<any | null> {
    return this.prisma.auctioneer.findFirst({ where: { id, tenantId } });
  }

  async findBySlug(tenantId: string, slugOrId: string): Promise<any | null> {
      let whereClause: Prisma.AuctioneerWhereInput = { tenantId };
      whereClause.OR = [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }];

      return this.prisma.auctioneer.findFirst({
        where: whereClause
    });
  }

  async findByName(tenantId: string, name: string): Promise<any | null> {
    return this.prisma.auctioneer.findFirst({ where: { name, tenantId } });
  }

  async create(data: Prisma.AuctioneerCreateInput): Promise<any> {
    return this.prisma.auctioneer.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<AuctioneerFormData>): Promise<any> {
    return this.prisma.auctioneer.update({ where: { id, tenantId }, data: data as any });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.auctioneer.delete({ where: { id, tenantId } });
  }
}
