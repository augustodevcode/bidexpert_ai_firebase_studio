// src/repositories/seller.repository.ts
import { prisma } from '@/lib/prisma';
import type { SellerFormData, SellerProfileInfo, Lot } from '@/types';

export class SellerRepository {
  async findAll(): Promise<SellerProfileInfo[]> {
    return prisma.seller.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<SellerProfileInfo | null> {
    return prisma.seller.findUnique({ where: { id } });
  }
  
  async findBySlug(slugOrId: string): Promise<SellerProfileInfo | null> {
      return prisma.seller.findFirst({
        where: {
            OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
        }
    });
  }

  async findLotsBySellerId(sellerId: string): Promise<Lot[]> {
      // @ts-ignore
      return prisma.lot.findMany({
        where: { sellerId: sellerId },
        include: { auction: true }
      });
  }

  async create(data: SellerFormData): Promise<SellerProfileInfo> {
    // @ts-ignore
    return prisma.seller.create({ data });
  }

  async update(id: string, data: Partial<SellerFormData>): Promise<SellerProfileInfo> {
    // @ts-ignore
    return prisma.seller.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.seller.delete({ where: { id } });
  }
}
