// src/repositories/seller.repository.ts
import { prisma } from '@/lib/prisma';
import type { SellerFormData, SellerProfileInfo, Lot } from '@/types';
import type { Prisma } from '@prisma/client';

export class SellerRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(tenantId: string, limit?: number): Promise<SellerProfileInfo[]> {
    return this.prisma.seller.findMany({ 
        where: { tenantId }, 
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
  }

  async findById(tenantId: string, id: string): Promise<SellerProfileInfo | null> {
    return this.prisma.seller.findFirst({ where: { id, tenantId } });
  }
  
  async findByName(tenantId: string, name: string): Promise<SellerProfileInfo | null> {
    return this.prisma.seller.findFirst({ where: { name, tenantId } });
  }

  async findBySlug(tenantId: string, slugOrId: string): Promise<SellerProfileInfo | null> {
      return this.prisma.seller.findFirst({
        where: {
            tenantId: tenantId,
            OR: [{ slug: slugOrId }, { id: slugOrId }, { publicId: slugOrId }]
        }
    });
  }

  async findLotsBySellerId(tenantId: string, sellerId: string): Promise<Lot[]> {
      // @ts-ignore
      return this.prisma.lot.findMany({
        where: { sellerId, tenantId },
        include: { auction: true }
      });
  }

  async create(data: Prisma.SellerCreateInput & { judicialBranchId?: string }): Promise<SellerProfileInfo> {
    const { judicialBranchId, ...restData } = data;

    const createData: Prisma.SellerCreateInput = {
      ...restData,
    };

    if (judicialBranchId) {
      createData.judicialBranch = {
        connect: {
          id: judicialBranchId,
        },
      };
    }

    return this.prisma.seller.create({ data: createData });
  }

  async update(tenantId: string, id: string, data: Partial<SellerFormData>): Promise<SellerProfileInfo> {
    // @ts-ignore
    return this.prisma.seller.update({ where: { id, tenantId }, data });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.seller.delete({ where: { id, tenantId } });
  }
}
