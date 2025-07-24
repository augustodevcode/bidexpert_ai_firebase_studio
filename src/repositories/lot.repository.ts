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
            auction: { select: { title: true } }
        },
        orderBy: { number: 'asc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.lot.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        bens: { include: { bem: true } }, // Include the Bem through LotBens
        auction: true,
      },
    });
  }

  async create(lotData: Omit<Lot, 'id' | 'createdAt' | 'updatedAt' | 'bens'>, bemIds: string[]): Promise<Lot> {
    return prisma.$transaction(async (tx) => {
      // 1. Create the Lot without the bens relation
      const newLot = await tx.lot.create({
        data: lotData as any,
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

      return newLot;
    });
  }

  async update(id: string, lotData: Partial<LotFormData>, bemIds?: string[]): Promise<Lot> {
    return prisma.$transaction(async (tx) => {
        // 1. Update the scalar fields of the Lot
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
        return updatedLot;
    });
  }

  async delete(id: string): Promise<void> {
     await prisma.$transaction(async (tx) => {
        // Delete from the join table first
        await tx.lotBens.deleteMany({
            where: { lotId: id },
        });
        // Then delete the lot itself
        await tx.lot.delete({ where: { id } });
    });
  }
}
