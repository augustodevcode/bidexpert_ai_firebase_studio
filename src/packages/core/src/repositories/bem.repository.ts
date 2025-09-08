// packages/core/src/repositories/bem.repository.ts
import { prisma } from '../lib/prisma';
import type { Bem, BemFormData } from '@bidexpert/core';
import type { Prisma } from '@prisma/client';

export class BemRepository {
  async findAll(filter?: { judicialProcessId?: string; sellerId?: string }): Promise<any[]> {
    const whereClause: Prisma.BemWhereInput = {};
    if (filter?.judicialProcessId) {
      whereClause.judicialProcessId = filter.judicialProcessId;
    }
    if (filter?.sellerId) {
      whereClause.sellerId = filter.sellerId;
    }
    return prisma.bem.findMany({ 
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
    return prisma.bem.findFirst({ 
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
    return prisma.bem.findMany({ 
        where: { id: { in: ids } },
        include: {
            category: { select: { name: true } },
            subcategory: { select: { name: true } },
            judicialProcess: { select: { processNumber: true } },
            seller: { select: { name: true } }
        }
    });
  }

  async create(data: Prisma.BemCreateInput): Promise<Bem> {
    // @ts-ignore
    return prisma.bem.create({ data });
  }

  async update(id: string, data: Partial<Prisma.BemUpdateInput>): Promise<Bem> {
    // @ts-ignore
    return prisma.bem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.bem.delete({ where: { id } });
  }
}
