// src/repositories/direct-sale-offer.repository.ts
import { prisma } from '@/lib/prisma';
import type { DirectSaleOffer } from '@/types';
import type { Prisma } from '@prisma/client';

export class DirectSaleOfferRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.directSaleOffer.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.directSaleOffer.findFirst({
      where: {
        OR: [{ id: id }, { publicId: id }]
      }
    });
  }
  
  async create(data: Prisma.DirectSaleOfferCreateInput): Promise<any> {
    return this.prisma.directSaleOffer.create({ data });
  }

  async update(id: bigint, data: Prisma.DirectSaleOfferUpdateInput): Promise<any> {
    return this.prisma.directSaleOffer.update({ where: { id }, data });
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.directSaleOffer.delete({ where: { id } });
  }

  async deleteMany(args: Prisma.DirectSaleOfferDeleteManyArgs): Promise<Prisma.BatchPayload> {
    return this.prisma.directSaleOffer.deleteMany(args);
  }
}
