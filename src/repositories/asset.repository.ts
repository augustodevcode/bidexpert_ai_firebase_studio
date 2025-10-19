// src/repositories/asset.repository.ts
/**
 * @fileoverview Repositório para a entidade Ativo (Asset/Bem), encapsulando
 * todas as interações diretas com o banco de dados relacionadas a ativos.
 * Garante que as consultas sejam consistentes e otimizadas.
 */
import { prisma } from '@/lib/prisma';
import type { Asset, AssetFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class AssetRepository {
  private prisma;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(filter?: { judicialProcessId?: string; sellerId?: string; tenantId?: string; status?: string }): Promise<any[]> {
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
    if (filter?.status) {
      whereClause.status = filter.status as any;
    }
    
    return this.prisma.asset.findMany({ 
        where: whereClause,
        include: {
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            judicialProcess: { select: { processNumber: true } },
            seller: { select: { name: true } },
            lots: {
              include: {
                lot: {
                  select: {
                    id: true,
                    number: true,
                    title: true,
                  }
                }
              }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.asset.findFirst({ 
        where: { OR: [{ id: BigInt(id) }, { publicId: id }] },
        include: {
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            judicialProcess: { select: { processNumber: true } },
            seller: { select: { name: true } },
            lots: {
              include: {
                lot: {
                  select: { id: true, number: true, title: true }
                }
              }
            }
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
            seller: { select: { name: true } },
            lots: {
              include: {
                lot: {
                  select: { id: true, number: true, title: true }
                }
              }
            }
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
