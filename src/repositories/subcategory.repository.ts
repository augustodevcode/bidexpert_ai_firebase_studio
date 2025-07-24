// src/repositories/subcategory.repository.ts
import { prisma } from '@/lib/prisma';
import type { Subcategory } from '@/types';
import type { Prisma } from '@prisma/client';

export class SubcategoryRepository {
  async findAllByParentId(parentCategoryId: string): Promise<any[]> {
    return prisma.subcategory.findMany({
      where: { parentCategoryId },
      orderBy: { displayOrder: 'asc' },
      include: {
        parentCategory: { select: { name: true } },
      },
    });
  }

  async findById(id: string): Promise<Subcategory | null> {
    return prisma.subcategory.findUnique({ where: { id } });
  }

  async create(data: Prisma.SubcategoryCreateInput): Promise<Subcategory> {
    return prisma.subcategory.create({ data });
  }

  async update(id: string, data: Prisma.SubcategoryUpdateInput): Promise<Subcategory> {
    return prisma.subcategory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.subcategory.delete({ where: { id } });
  }
}
