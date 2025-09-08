// packages/core/src/repositories/category.repository.ts
import { prisma } from '../lib/prisma';
import type { LotCategory } from '@bidexpert/core';
import type { Prisma } from '@prisma/client';

export class CategoryRepository {
  async findAll(): Promise<any[]> {
    return prisma.lotCategory.findMany({ 
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { lots: true, bens: true }
            }
        }
    });
  }

  async findById(id: string): Promise<LotCategory | null> {
    return prisma.lotCategory.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<LotCategory | null> {
    return prisma.lotCategory.findUnique({ where: { slug } });
  }

  async create(data: Prisma.LotCategoryCreateInput): Promise<LotCategory> {
    return prisma.lotCategory.create({ data });
  }

  async update(id: string, data: Prisma.LotCategoryUpdateInput): Promise<LotCategory> {
    return prisma.lotCategory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.lotCategory.delete({ where: { id } });
  }
}
