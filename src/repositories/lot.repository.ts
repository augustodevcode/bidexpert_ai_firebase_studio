// src/repositories/lot.repository.ts
import { prisma } from '@/lib/prisma';
import type { Lot, LotFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class LotRepository {
    
  async findAll(auctionId?: string): Promise<any[]> {
    return prisma.lot.findMany({
        where: auctionId ? { auctionId } : {},
        include: {
            bens: { include: { bem: true } }, // Include the Bem through LotBens
            auction: { select: { title: true } },
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            stagePrices: true,
        },
        orderBy: { number: 'asc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.lot.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        bens: { include: { bem: true } }, // Include the Bem through LotBens
        auction: { include: { stages: true, seller: true } }, // Include auction stages
        stagePrices: true,
      },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    return prisma.lot.findMany({
      where: { id: { in: ids } },
      include: { 
        auction: { include: { stages: true, seller: true } },
        stagePrices: true,
      }
    });
  }

  async create(lotData: Prisma.LotCreateInput, bemIds: string[]): Promise<Lot> {
    return prisma.$transaction(async (tx) => {
      // 1. Create the Lot without the bens relation
      const newLot = await tx.lot.create({
        data: lotData,
      });

      // 2. If there are bemIds, create the entries in the join table
      if (bemIds && bemIds.length > 0) {
        await tx.lotBens.createMany({
          data: bemIds.map(bemId => ({
            lotId: newLot.id,
            bemId: bemId,
          })),
        });
      }

      return newLot as Lot;
    });
  }

  async update(id: string, lotData: Prisma.LotUpdateInput, bemIds?: string[], stageDetails?: any[]): Promise<Lot> {
    return prisma.$transaction(async (tx) => {
        // 1. Update the scalar fields and direct relations of the Lot
        const updatedLot = await tx.lot.update({
            where: { id },
            data: lotData,
        });

        // 2. If bemIds are provided, sync the join table
        if (bemIds !== undefined) {
            // Delete existing relations
            await tx.lotBens.deleteMany({
                where: { lotId: id },
            });
            // Create new relations
            if (bemIds.length > 0) {
                await tx.lotBens.createMany({
                    data: bemIds.map(bemId => ({
                        lotId: id,
                        bemId: bemId,
                    })),
                });
            }
        }
        
        // 3. Sync stage prices if provided
        if (stageDetails) {
            await tx.lotStagePrice.deleteMany({ where: { lotId: id }});
            if (stageDetails.length > 0) {
                await tx.lotStagePrice.createMany({
                    data: stageDetails.map(detail => ({
                        lotId: id,
                        auctionStageId: detail.stageId,
                        initialBid: detail.initialBid,
                        bidIncrement: detail.bidIncrement,
                    }))
                });
            }
        }
        
        return updatedLot as Lot;
    });
  }

  async delete(id: string): Promise<void> {
     await prisma.$transaction(async (tx) => {
        // Delete from the join table first to respect foreign key constraints
        await tx.lotBens.deleteMany({
            where: { lotId: id },
        });
        // Delete stage-specific prices
        await tx.lotStagePrice.deleteMany({
            where: { lotId: id }
        });
        // Then delete the lot itself
        await tx.lot.delete({ where: { id } });
    });
  }
}
