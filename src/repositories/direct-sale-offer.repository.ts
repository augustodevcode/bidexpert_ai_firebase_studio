// src/repositories/direct-sale-offer.repository.ts
import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';
import type { Prisma } from '@prisma/client';

export class DirectSaleOfferRepository {
  async findAll(): Promise<DirectSaleOffer[]> {
    return prisma.directSaleOffer.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<DirectSaleOffer | null> {
    return prisma.directSaleOffer.findFirst({
      where: {
        OR: [{ id }, { publicId: id }]
      }
    });
  }
  
  async create(data: Prisma.DirectSaleOfferCreateInput): Promise<DirectSaleOffer> {
    return prisma.directSaleOffer.create({ data });
  }

  async update(id: string, data: Prisma.DirectSaleOfferUpdateInput): Promise<DirectSaleOffer> {
    return prisma.directSaleOffer.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.directSaleOffer.delete({ where: { id } });
  }

  async deleteMany(args: Prisma.DirectSaleOfferDeleteManyArgs): Promise<Prisma.BatchPayload> {
    return prisma.directSaleOffer.deleteMany(args);
  }
}
