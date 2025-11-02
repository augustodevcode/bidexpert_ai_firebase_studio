
// src/repositories/lot.repository.ts
import { prisma } from '@/lib/prisma';
import type { Lot, LotFormData } from '@/types';
import type { Prisma } from '@prisma/client';

const NON_PUBLIC_AUCTION_STATUSES: Prisma.AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];


export class LotRepository {
    
  async findAll(tenantId: string | undefined, where: Prisma.LotWhereInput = {}, limit?: number, isPublicCall = false): Promise<any[]> {
    const finalWhere: Prisma.LotWhereInput = {
      ...where,
      ...(tenantId && { tenantId: BigInt(tenantId) }),
    };
    
    if (isPublicCall) {
        finalWhere.auction = {
            is: { // Correção aqui
                status: { notIn: NON_PUBLIC_AUCTION_STATUSES }
            }
        }
    }
    
    return prisma.lot.findMany({
        where: finalWhere,
        take: limit,
        include: {
            assets: { include: { asset: true } },
            auction: { select: { title: true, status: true } }, // Incluindo status do leilão
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
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
        assets: { include: { asset: true } },
        auction: true,
      },
    });
  }
  
  async findByIds(ids: bigint[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    return prisma.lot.findMany({
        where: { id: { in: ids } },
        include: { auction: true }
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

  async update(id: string, lotData: Prisma.LotUpdateInput, assetIds?: bigint[]): Promise<Lot> {
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
                        assignedBy: 'system-update', // Or get user from context
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
