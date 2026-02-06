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
            LotCategory: { select: { name: true } },
            Subcategory: { select: { name: true } },
            JudicialProcess: { select: { processNumber: true } },
            Seller: { select: { name: true } },
            AssetsOnLots: {
              include: {
                Lot: {
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
    const whereClause: Prisma.AssetWhereInput = {};
    if (id.includes('-')) {
        whereClause.publicId = id;
    } else {
        whereClause.id = id;
    }
    
    return this.prisma.asset.findFirst({ 
        where: whereClause,
        include: {
            LotCategory: { select: { name: true } },
            Subcategory: { select: { name: true } },
            JudicialProcess: { select: { processNumber: true } },
            Seller: { select: { name: true } },
            AssetsOnLots: {
              include: {
                Lot: {
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
            LotCategory: { select: { name: true } },
            Subcategory: { select: { name: true } },
            JudicialProcess: { select: { processNumber: true } },
            Seller: { select: { name: true } },
            AssetsOnLots: {
              include: {
                Lot: {
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

  async deleteManyAssetsOnLots(where: Prisma.AssetsOnLotsWhereInput): Promise<Prisma.BatchPayload> {
    return this.prisma.assetsOnLots.deleteMany({ where });
  }}
