// packages/core/src/repositories/auction.repository.ts
import { prisma } from '../lib/prisma';
import type { Auction } from '@bidexpert/core';
import type { Prisma } from '@prisma/client';

export class AuctionRepository {
  async findAll(): Promise<any[]> {
    return prisma.auction.findMany({
      orderBy: { auctionDate: 'desc' },
      include: { 
        _count: { select: { lots: true } },
        seller: true, // Include full seller object
        auctioneer: true, // Include full auctioneer object
        category: { select: { name: true } },
        stages: true, 
      },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.auction.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        lots: { include: { bens: { include: { bem: true } } } },
        auctioneer: true,
        seller: true, // Full seller object
        category: true,
        stages: true,
      },
    });
  }
  
  async findByIds(ids: string[]): Promise<any[]> {
    return prisma.auction.findMany({
        where: {
            OR: [
                { id: { in: ids } },
                { publicId: { in: ids } }
            ]
        },
        include: {
            _count: { select: { lots: true } },
            seller: true,
            auctioneer: true,
            category: { select: { name: true } },
            stages: true,
        }
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
        _count: { select: { lots: true } },
        seller: true,
        auctioneer: true,
        category: true,
        stages: true,
        lots: {
          include: {
            bens: { include: { bem: true } },
          },
        },
      },
      orderBy: { auctionDate: 'desc' },
    });
  }

  async findBySellerSlug(sellerSlugOrId: string): Promise<any[]> {
    return prisma.auction.findMany({
        where: {
            seller: {
                OR: [{ slug: sellerSlugOrId }, { id: sellerSlugOrId }, { publicId: sellerSlugOrId }]
            }
        },
        include: { 
            _count: { select: { lots: true } }, 
            seller: true,
            auctioneer: true,
            category: true,
            stages: true,
            lots: {
                include: {
                    bens: { include: { bem: true } },
                },
            },
        }
    });
  }
}
