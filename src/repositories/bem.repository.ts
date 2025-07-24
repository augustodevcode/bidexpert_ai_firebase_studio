// src/repositories/bem.repository.ts
import { prisma } from '@/lib/prisma';
import type { Bem, BemFormData } from '@/types';
import type { Prisma } from '@prisma/client';

export class BemRepository {
  async findAll(filter?: { judicialProcessId?: string; sellerId?: string }): Promise<Bem[]> {
    const whereClause: Prisma.BemWhereInput = {};
    if (filter?.judicialProcessId) {
      whereClause.judicialProcessId = filter.judicialProcessId;
    }
    if (filter?.sellerId) {
      whereClause.sellerId = filter.sellerId;
    }
    // @ts-ignore
    return prisma.bem.findMany({ where: whereClause });
  }

  async findById(id: string): Promise<Bem | null> {
    return prisma.bem.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Bem[]> {
    if (!ids || ids.length === 0) return [];
    // @ts-ignore
    return prisma.bem.findMany({ where: { id: { in: ids } } });
  }

  async create(data: Prisma.BemCreateInput): Promise<Bem> {
    // @ts-ignore
    return prisma.bem.create({ data });
  }

  async update(id: string, data: Partial<BemFormData>): Promise<Bem> {
    // @ts-ignore
    return prisma.bem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.bem.delete({ where: { id } });
  }
}
