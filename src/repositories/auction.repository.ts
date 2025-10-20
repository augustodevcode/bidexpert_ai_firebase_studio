// src/repositories/auction.repository.ts
import { prisma } from '@/lib/prisma';
import type { Auction } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctionRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }
  
  async findAll(tenantId: string, where?: Prisma.AuctionWhereInput, limit?: number): Promise<any[]> {
    return this.prisma.auction.findMany({
      where: { ...where, tenantId },
      orderBy: { auctionDate: 'desc' },
      take: limit,
      include: {
        _count: { select: { lots: true } },
        seller: true,
        auctioneer: true,
        stages: true,
      },
    });
  }

  async findById(tenantId: string | undefined, id: string): Promise<any | null> {
    const whereClause: Prisma.AuctionWhereInput = {
        ...(tenantId && { tenantId }),
    };

    // Tenta primeiro buscar por publicId se for um CUID
    if (id.includes('-')) {
        whereClause.publicId = id;
    } else {
        // Se não for um CUID, assume que é o ID numérico
        whereClause.id = id;
    }
    
    return this.prisma.auction.findFirst({
      where: whereClause,
      include: {
        lots: { include: { assets: { include: { asset: true } } } }, 
        auctioneer: true,
        seller: true,
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
