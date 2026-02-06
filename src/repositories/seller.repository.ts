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
    // @ts-ignore
    return this.prisma.seller.findMany({ 
        where: { tenantId }, 
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
  }

  async findById(tenantId: string, id: string): Promise<SellerProfileInfo | null> {
    // @ts-ignore
    return this.prisma.seller.findFirst({ where: { id, tenantId } });
  }
  
  async findByName(tenantId: string, name: string): Promise<SellerProfileInfo | null> {
    // @ts-ignore
    return this.prisma.seller.findFirst({ where: { name, tenantId: BigInt(tenantId) } });
  }

  async findBySlug(tenantId: string, slugOrId: string): Promise<SellerProfileInfo | null> {
      const isNumericId = /^\d+$/.test(slugOrId);
      // @ts-ignore
      return this.prisma.seller.findFirst({
        where: {
            tenantId: BigInt(tenantId),
            OR: [
                { slug: slugOrId }, 
                { publicId: slugOrId },
                ...(isNumericId ? [{ id: BigInt(slugOrId) }] : []),
            ]
        }
    });
  }

  async findFirst(where: Prisma.SellerWhereInput): Promise<SellerProfileInfo | null> {
    // @ts-ignore
    return this.prisma.seller.findFirst({ where });
  }

  async findLotsBySellerId(tenantId: string, sellerId: string): Promise<Lot[]> {
      // @ts-ignore
      return this.prisma.lot.findMany({
        where: { sellerId: BigInt(sellerId), tenantId: BigInt(tenantId) },
        include: { Auction: true }
      });
  }

  async create(data: Prisma.SellerCreateInput): Promise<SellerProfileInfo> {
    // @ts-ignore
    return this.prisma.seller.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<SellerFormData>): Promise<SellerProfileInfo> {
    // @ts-ignore
    return this.prisma.seller.update({ where: { id: BigInt(id), tenantId: BigInt(tenantId) }, data });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.seller.delete({ where: { id: BigInt(id), tenantId: BigInt(tenantId) } });
  }

  async deleteMany(where: Prisma.SellerWhereInput): Promise<Prisma.BatchPayload> {
    return this.prisma.seller.deleteMany({ where });
  }}
