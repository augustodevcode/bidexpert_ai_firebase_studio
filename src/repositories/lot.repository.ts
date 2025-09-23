// src/repositories/lot.repository.ts
import { getPrismaInstance } from '@/lib/prisma';
import type { Lot, LotFormData } from '@/types';
import type { Prisma } from '@prisma/client';

const NON_PUBLIC_AUCTION_STATUSES: Prisma.AuctionStatus[] = ['RASCUNHO', 'EM_PREPARACAO'];


export class LotRepository {
    
  async findAll(tenantId: string | undefined, where: Prisma.LotWhereInput = {}, limit?: number, isPublicCall = false): Promise<any[]> {
    const finalWhere: Prisma.LotWhereInput = {
      ...where,
      ...(tenantId && { tenantId }),
    };
    
    if (isPublicCall) {
        finalWhere.auction = {
            status: { notIn: NON_PUBLIC_AUCTION_STATUSES }
        }
    }
    
    return getPrismaInstance().lot.findMany({
        where: finalWhere,
        take: limit,
        include: {
            bens: { include: { bem: true } },
            auction: { select: { title: true, status: true } }, // Incluindo status do leilão
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
        },
        orderBy: { number: 'asc' }
    });
  }

  async findById(id: string, tenantId?: string): Promise<any | null> {
    const prisma = getPrismaInstance();
    const whereClause: Prisma.LotWhereInput = {
        OR: [{ id }, { publicId: id }],
    };
    if (tenantId) {
        whereClause.tenantId = tenantId;
    }
    return prisma.lot.findFirst({
      where: whereClause,
      include: {
        bens: { include: { bem: true } },
        auction: true,
      },
    });
  }
  
  async findByIds(ids: string[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    return getPrismaInstance().lot.findMany({
        where: { id: { in: ids } },
        include: { auction: true }
    });
  }

  async create(lotData: Prisma.LotCreateInput, bemIds: string[]): Promise<Lot> {
    return getPrismaInstance().$transaction(async (tx) => {
      // 1. Create the Lot
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

  async update(id: string, lotData: Prisma.LotUpdateInput, bemIds?: string[]): Promise<Lot> {
    return getPrismaInstance().$transaction(async (tx) => {
        const updatedLot = await tx.lot.update({
            where: { id },
            data: lotData,
        });

        if (bemIds !== undefined) {
            await tx.lotBens.deleteMany({
                where: { lotId: id },
            });
            if (bemIds.length > 0) {
                await tx.lotBens.createMany({
                    data: bemIds.map(bemId => ({
                        lotId: id,
                        bemId: bemId,
                    })),
                });
            }
        }
        return updatedLot as Lot;
    });
  }

  async delete(id: string): Promise<void> {
     await getPrismaInstance().$transaction(async (tx) => {
        await tx.lotBens.deleteMany({
            where: { lotId: id },
        });
        await tx.lot.delete({ where: { id } });
    });
  }
}
