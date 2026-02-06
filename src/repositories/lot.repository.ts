
// src/repositories/lot.repository.ts
import prisma from '@/lib/prisma';
import type { Lot, LotFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class LotRepository {
    
  async findAll(tenantId: string | undefined, where: Prisma.LotWhereInput = {}, limit?: number): Promise<any[]> {
    const finalWhere: Prisma.LotWhereInput = {
      ...where,
      ...(tenantId && { tenantId: BigInt(tenantId) }),
    };

    // For non-public calls (admin view), we fetch everything without status filtering.
    return prisma.lot.findMany({
        where: finalWhere,
        take: limit,
        include: {
            AssetsOnLots: { include: { Asset: true } },
            Auction: { select: { title: true, status: true } },
            LotCategory: { select: { name: true } },
            Subcategory: { select: { name: true } },
            Seller: { select: { name: true } },
        },
        orderBy: { number: 'asc' }
    });
  }

  async findById(id: string, tenantId?: string): Promise<any | null> {
    const whereClause: Prisma.LotWhereInput = {
        ...(tenantId && { tenantId: BigInt(tenantId) }),
    };

    const isNumericId = /^\d+$/.test(id);
    if (!isNumericId) {
        whereClause.publicId = id;
    } else {
        whereClause.id = BigInt(id);
    }

    return prisma.lot.findFirst({
      where: whereClause,
      include: {
        AssetsOnLots: { include: { Asset: true } },
        Auction: true,
        Seller: { select: { name: true } },
        LotCategory: { select: { name: true } },
        Subcategory: { select: { name: true } },
      },
    });
  }
  
  async findByIds(ids: bigint[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    return prisma.lot.findMany({
        where: { id: { in: ids } },
        include: { Auction: true }
    });
  }

  async create(lotData: Prisma.LotCreateInput, assetIds: bigint[], creatorId: string): Promise<Lot> {
    return prisma.$transaction(async (tx) => {
      // 1. Create the Lot
      const newLot = await tx.lot.create({
        data: lotData,
      });

      // 2. If there are assetIds, create the entries in the join table
      if (assetIds && assetIds.length > 0) {
        await tx.assetsOnLots.createMany({
          data: assetIds.map(assetId => ({
            lotId: newLot.id,
            assetId: assetId,
            assignedBy: creatorId,
          })),
        });
      }

      return newLot as Lot;
    });
  }

  async update(id: string, lotData: Prisma.LotUpdateInput, assetIds?: bigint[], creatorId: string = 'system'): Promise<Lot> {
    return prisma.$transaction(async (tx) => {
      const lotIdAsBigInt = BigInt(id);
      
      if (assetIds !== undefined) {
        await tx.assetsOnLots.deleteMany({
          where: { lotId: lotIdAsBigInt },
        });
        
        if (assetIds.length > 0) {
          await tx.assetsOnLots.createMany({
            data: assetIds.map(assetId => ({
              lotId: lotIdAsBigInt,
              assetId: assetId,
              assignedBy: creatorId,
            })),
          });
        }
      }
      
      const updatedLot = await tx.lot.update({
        where: { id: lotIdAsBigInt },
        data: lotData,
      });

      return updatedLot as Lot;
    });
  }

  async delete(id: string): Promise<void> {
     await prisma.$transaction(async (tx) => {
        const lotIdAsBigInt = BigInt(id);
        await tx.assetsOnLots.deleteMany({
            where: { lotId: lotIdAsBigInt },
        });
        await tx.lot.delete({ where: { id: lotIdAsBigInt } });
    });
  }
}
