// src/repositories/direct-sale-offer.repository.ts
import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';
import type { Prisma } from '@prisma/client';

export class DirectSaleOfferRepository {
  async findAll(): Promise<DirectSaleOffer[]> {
    // @ts-ignore
    return prisma.directSaleOffer.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<DirectSaleOffer | null> {
    // @ts-ignore
    return prisma.directSaleOffer.findFirst({
      where: {
        OR: [{ id }, { publicId: id }]
      }
    });
  }
  
  async create(data: Prisma.DirectSaleOfferCreateInput): Promise<DirectSaleOffer> {
    // @ts-ignore
    return prisma.directSaleOffer.create({ data });
  }

  async update(id: string, data: Prisma.DirectSaleOfferUpdateInput): Promise<DirectSaleOffer> {
    // @ts-ignore
    return prisma.directSaleOffer.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.directSaleOffer.delete({ where: { id } });
  }
}
