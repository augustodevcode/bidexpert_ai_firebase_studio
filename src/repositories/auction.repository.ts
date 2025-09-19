// src/repositories/auction.repository.ts
import { getPrismaInstance } from '@/lib/prisma';
import type { Auction } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctionRepository {
  private prisma;

  constructor() {
    this.prisma = getPrismaInstance();
  }
  
  async findAll(tenantId: string): Promise<any[]> {
    return this.prisma.auction.findMany({
      where: { tenantId },
      orderBy: { auctionDate: 'desc' },
      include: {
        _count: { select: { lots: true } },
        seller: true,
        auctioneer: true,
        category: { select: { name: true } },
        stages: true,
      },
    });
  }

  async findById(tenantId: string | undefined, id: string): Promise<any | null> {
    return this.prisma.auction.findFirst({
      where: {
        OR: [{ id }, { publicId: id }],
        ...(tenantId && { tenantId }), // Only apply tenantId if it exists
      },
      include: {
        lots: { include: { bens: { include: { bem: true } } } },
        auctioneer: true,
        seller: true,
        category: true,
        stages: true,
      },
    });
  }
  
  async findByIds(tenantId: string, ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    return this.prisma.auction.findMany({
      where: { 
          OR: [{id: {in: ids}}, {publicId: {in: ids}}],
          tenantId: tenantId
      },
      include: { 
          _count: { select: { lots: true } },
          seller: true,
      }
    });
  }

  async create(data: Prisma.AuctionCreateInput): Promise<Auction> {
    // @ts-ignore
    return this.prisma.auction.create({ data });
  }

  async update(tenantId: string, id: string, data: Prisma.AuctionUpdateInput): Promise<Auction> {
    // @ts-ignore
    return this.prisma.auction.update({ where: { id, tenantId }, data });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.auction.delete({ where: { id, tenantId } });
  }

  async countLots(tenantId: string, auctionId: string): Promise<number> {
    return this.prisma.lot.count({ where: { auctionId, tenantId } });
  }

  async findByAuctioneerSlug(tenantId: string, auctioneerSlug: string): Promise<any[]> {
    return this.prisma.auction.findMany({
      where: {
        tenantId,
        auctioneer: {
          OR: [
            { slug: auctioneerSlug },
            { id: auctioneerSlug },
            { publicId: auctioneerSlug },
          ],
        },
      },
      include: {
        _count: { select: { lots: true } },
        seller: true,
      },
      orderBy: { auctionDate: 'desc' },
    });
  }

  async findBySellerSlug(tenantId: string, sellerSlugOrPublicId: string): Promise<any[]> {
    return this.prisma.auction.findMany({
        where: {
            tenantId,
            seller: {
                OR: [{ slug: sellerSlugOrPublicId }, { id: sellerSlugOrPublicId }, { publicId: sellerSlugOrPublicId }]
            }
        },
        include: { 
            _count: { select: { lots: true } },
            seller: true 
        }
    });
  }
}
