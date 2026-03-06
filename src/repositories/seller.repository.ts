// src/repositories/seller.repository.ts
import { prisma } from '@/lib/prisma';
import type { SellerFormData, SellerProfileInfo, Lot } from '@/types';
import type { Prisma } from '@prisma/client';

export class SellerRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  private toBigInt(value: string, fieldName: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new Error(`[SellerRepository] ${fieldName} inválido: "${value}"`);
    }
  }

  async findAll(tenantId: string, limit?: number): Promise<SellerProfileInfo[]> {
    return this.prisma.seller.findMany({
      where: { tenantId: this.toBigInt(tenantId, 'tenantId') },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findById(tenantId: string, id: string): Promise<SellerProfileInfo | null> {
    return this.prisma.seller.findFirst({
      where: {
        id: this.toBigInt(id, 'id'),
        tenantId: this.toBigInt(tenantId, 'tenantId'),
      },
    });
  }
  
  async findByName(tenantId: string, name: string): Promise<SellerProfileInfo | null> {
    return this.prisma.seller.findFirst({
      where: { name, tenantId: this.toBigInt(tenantId, 'tenantId') },
    });
  }

  async findBySlug(tenantId: string, slugOrId: string): Promise<SellerProfileInfo | null> {
      const isNumericId = /^\d+$/.test(slugOrId);
      return this.prisma.seller.findFirst({
        where: {
            tenantId: this.toBigInt(tenantId, 'tenantId'),
            OR: [
                { slug: slugOrId }, 
                { publicId: slugOrId },
                ...(isNumericId ? [{ id: this.toBigInt(slugOrId, 'id') }] : []),
            ]
        }
    });
  }

  async findFirst(where: Prisma.SellerWhereInput): Promise<SellerProfileInfo | null> {
    return this.prisma.seller.findFirst({ where });
  }

  async findLotsBySellerId(tenantId: string, sellerId: string): Promise<Lot[]> {
      return this.prisma.lot.findMany({
        where: {
          sellerId: this.toBigInt(sellerId, 'sellerId'),
          tenantId: this.toBigInt(tenantId, 'tenantId'),
        },
        include: { Auction: true }
      });
  }

  async create(data: Prisma.SellerCreateInput): Promise<SellerProfileInfo> {
    return this.prisma.seller.create({ data });
  }

  async update(tenantId: string, id: string, data: Partial<SellerFormData>): Promise<SellerProfileInfo> {
    return this.prisma.seller.update({
      where: {
        id: this.toBigInt(id, 'id'),
        tenantId: this.toBigInt(tenantId, 'tenantId'),
      },
      data,
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.seller.delete({
      where: {
        id: this.toBigInt(id, 'id'),
        tenantId: this.toBigInt(tenantId, 'tenantId'),
      },
    });
  }

  async deleteMany(where: Prisma.SellerWhereInput): Promise<Prisma.BatchPayload> {
    return this.prisma.seller.deleteMany({ where });
  }
}
