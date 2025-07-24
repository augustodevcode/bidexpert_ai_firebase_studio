// src/repositories/lot.repository.ts
import { prisma } from '@/lib/prisma';
import type { Lot } from '@/types';
import type { Prisma } from '@prisma/client';

export class LotRepository {
    
  async findAll(auctionId?: string): Promise<any[]> {
    return prisma.lot.findMany({
        where: auctionId ? { auctionId } : {},
        include: {
            bens: true,
            auction: { select: { title: true } }
        },
        orderBy: { number: 'asc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.lot.findFirst({
      where: { OR: [{ id }, { publicId: id }] },
      include: {
        bens: true,
        auction: true,
      },
    });
  }

  async create(data: Prisma.LotCreateInput): Promise<Lot> {
    // @ts-ignore
    return prisma.lot.create({ data });
  }

  async update(id: string, data: Prisma.LotUpdateInput): Promise<Lot> {
    // @ts-ignore
    return prisma.lot.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    const lotToDelete = await prisma.lot.findFirst({ where: { OR: [{id}, {publicId: id}]}});
    if (!lotToDelete) throw new Error("Lot to delete not found.");
    await prisma.lot.delete({ where: { id: lotToDelete.id } });
  }
}
