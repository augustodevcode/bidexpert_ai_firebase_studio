// src/repositories/asset.repository.ts
import { prisma } from '@/lib/prisma';
import type { Asset, AssetFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class AssetRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(filter?: { judicialProcessId?: string; sellerId?: string; tenantId?: string }): Promise<any[]> {
    const whereClause: Prisma.AssetWhereInput = {};
    if (filter?.judicialProcessId) {
      whereClause.judicialProcessId = filter.judicialProcessId;
    }
    if (filter?.sellerId) {
      whereClause.sellerId = filter.sellerId;
    }
    if (filter?.tenantId) {
      whereClause.tenantId = filter.tenantId;
    }
    
    return this.prisma.asset.findMany({ 
        where: whereClause,
        include: {
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            judicialProcess: { select: { processNumber: true } },
            seller: { select: { name: true } }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.asset.findFirst({ 
        where: { OR: [{ id }, { publicId: id }] },
        include: {
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            judicialProcess: { select: { processNumber: true } },
            seller: { select: { name: true } }
        }
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    return this.prisma.asset.findMany({ 
        where: { id: { in: ids } },
        include: {
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            judicialProcess: { select: { processNumber: true } },
            seller: { select: { name: true } }
        }
    });
  }

  async create(data: Prisma.AssetCreateInput): Promise<Asset> {
    // @ts-ignore
    return this.prisma.asset.create({ data });
  }

  async update(id: string, data: Partial<Prisma.AssetUpdateInput>): Promise<Asset> {
    // @ts-ignore
    return this.prisma.asset.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetsOnLots.deleteMany({ where: { assetId: id } });
    await this.prisma.asset.delete({ where: { id } });
  }
}
