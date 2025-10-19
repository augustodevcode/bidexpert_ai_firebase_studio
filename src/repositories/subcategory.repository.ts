// src/repositories/subcategory.repository.ts
import { prisma } from '@/lib/prisma';
import type { Subcategory } from '@/types';
import type { Prisma } from '@prisma/client';

export class SubcategoryRepository {
  async findAllByParentId(parentCategoryId: BigInt): Promise<any[]> {
    return prisma.subcategory.findMany({
      where: { parentCategoryId },
      orderBy: { displayOrder: 'asc' },
      include: {
        parentCategory: { select: { name: true } },
      },
    });
  }

  async findById(id: BigInt): Promise<Subcategory | null> {
    return prisma.subcategory.findUnique({ where: { id } });
  }

  async create(data: Prisma.SubcategoryCreateInput): Promise<Subcategory> {
    return prisma.subcategory.create({ data });
  }

  async update(id: BigInt, data: Prisma.SubcategoryUpdateInput): Promise<Subcategory> {
    return prisma.subcategory.update({ where: { id }, data });
  }

  async delete(id: BigInt): Promise<void> {
    await prisma.subcategory.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await prisma.subcategory.deleteMany({});
  }
}
