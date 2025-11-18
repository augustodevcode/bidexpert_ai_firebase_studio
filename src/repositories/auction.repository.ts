// src/repositories/auction.repository.ts
import prisma from '@/lib/prisma';
import type { Auction } from '@/types';
import type { Prisma } from '@prisma/client';

export class AuctionRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }
  
  async findAll(tenantId: string, where?: Prisma.AuctionWhereInput, limit?: number): Promise<any[]> {
    return this.prisma.auction.findMany({
      where: { ...where, tenantId: BigInt(tenantId) },
      orderBy: { auctionDate: 'desc' },
      take: limit,
      include: {
        _count: { select: { lots: true } },
        seller: true, // Corrected from 'Seller'
        stages: true,
      },
    });
  }

  async findById(tenantId: string | undefined, id: string): Promise<any | null> {
    const whereClause: Prisma.AuctionWhereInput = {
        ...(tenantId && { tenantId: BigInt(tenantId) }),
    };

    const isNumericId = /^\d+$/.test(id);

    if (!isNumericId) {
        whereClause.publicId = id;
    } else {
        whereClause.id = BigInt(id);
    }
    
    return this.prisma.auction.findFirst({
      where: whereClause,
      include: {
        lots: { include: { assets: { include: { asset: true } } } }, 
        auctioneer: true,
        seller: true, // Corrected from 'Seller'
        stages: true,
      },
    });
  }
  
  async findByIds(tenantId: string, ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    const numericIds = ids.filter(id => /^\d+$/.test(id)).map(id => BigInt(id));
    const publicIds = ids.filter(id => !/^\d+$/.test(id));

    return this.prisma.auction.findMany({
      where: { 
          OR: [
              { id: { in: numericIds } },
              { publicId: { in: publicIds } }
          ],
          tenantId: BigInt(tenantId)
      },
      include: { 
          _count: { select: { lots: true } },
          seller: true, // Corrected from 'Seller'
          stages: true,
      }
    });
  }

  async create(data: Prisma.AuctionCreateInput): Promise<Auction> {
    // @ts-ignore
    return this.prisma.auction.create({ data });
  }

  async update(tenantId: string, id: bigint, data: Prisma.AuctionUpdateInput): Promise<Auction> {
    // @ts-ignore
    return this.prisma.auction.update({ where: { id, tenantId: BigInt(tenantId) }, data });
  }

  async delete(tenantId: string, id: bigint): Promise<void> {
    await this.prisma.auction.delete({ where: { id, tenantId: BigInt(tenantId) } });
  }

  async countLots(tenantId: string, auctionId: string): Promise<number> {
    return this.prisma.lot.count({ where: { auctionId: BigInt(auctionId), tenantId: BigInt(tenantId) } });
  }

  async findByAuctioneerSlug(tenantId: string, auctioneerSlug: string): Promise<any[]> {
    const isNumericId = /^\d+$/.test(auctioneerSlug);
    return this.prisma.auction.findMany({
      where: {
        tenantId: BigInt(tenantId),
        auctioneer: {
          OR: [
            { slug: auctioneerSlug },
            { publicId: auctioneerSlug },
             ...(isNumericId ? [{ id: BigInt(auctioneerSlug) }] : []),
          ],
        },
      },
      include: {
        _count: { select: { lots: true } },
        seller: true, // Corrected from 'Seller'
        stages: true,
      },
      orderBy: { auctionDate: 'desc' },
    });
  }

  async findBySellerSlug(tenantId: string, sellerSlugOrPublicId: string): Promise<any[]> {
    const isNumericId = /^\d+$/.test(sellerSlugOrPublicId);
    return this.prisma.auction.findMany({
        where: {
            tenantId: BigInt(tenantId),
            seller: { // Corrected from 'Seller'
                OR: [
                    { slug: sellerSlugOrPublicId }, 
                    { publicId: sellerSlugOrPublicId },
                    ...(isNumericId ? [{ id: BigInt(sellerSlugOrPublicId) }] : []),
                ]
            }
        },
        include: { 
            _count: { select: { lots: true } },
            seller: true, // Corrected from 'Seller'
            stages: true,
        }
    });
  }
}
