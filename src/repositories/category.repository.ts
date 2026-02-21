/**
 * src/repositories/category.repository.ts
 * Repositório de categorias de lotes com serialização de IDs para string.
 */
import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';
import type { Prisma } from '@prisma/client';

type LotCategoryWithCounts = Prisma.LotCategory & {
  _count?: {
    Lot?: number;
    Subcategory?: number;
  };
};

function parseTenantId(tenantId: string): bigint {
  return BigInt(tenantId);
}

function serializeCategory(category: LotCategoryWithCounts): LotCategory {
  return {
    ...category,
    id: category.id.toString(),
    _count: category._count
      ? {
          lots: category._count.Lot ?? 0,
          subcategories: category._count.Subcategory ?? 0,
        }
      : undefined,
    itemCount: category._count?.Lot,
  };
}

export class CategoryRepository {
  async findAll(tenantId: string): Promise<LotCategory[]> {
    try {
      const categories = await prisma.lotCategory.findMany({
        where: { tenantId: parseTenantId(tenantId) },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { Lot: true, Subcategory: true },
          },
        },
      });
      return categories.map((category) => serializeCategory(category));
    } catch (error) {
      console.error('[CategoryRepository.findAll]', error);
      throw error;
    }
  }

  async findById(id: bigint, tenantId: string): Promise<LotCategory | null> {
    try {
      const category = await prisma.lotCategory.findFirst({
        where: { id, tenantId: parseTenantId(tenantId) },
        include: {
          _count: { select: { Lot: true, Subcategory: true } },
        },
      });
      return category ? serializeCategory(category) : null;
    } catch (error) {
      console.error('[CategoryRepository.findById]', error);
      throw error;
    }
  }

  async findBySlug(slug: string, tenantId: string): Promise<LotCategory | null> {
    try {
      const category = await prisma.lotCategory.findFirst({
        where: { slug, tenantId: parseTenantId(tenantId) },
        include: {
          _count: { select: { Lot: true, Subcategory: true } },
        },
      });
      return category ? serializeCategory(category) : null;
    } catch (error) {
      console.error('[CategoryRepository.findBySlug]', error);
      throw error;
    }
  }

  async findByName(name: string, tenantId: string): Promise<LotCategory | null> {
    try {
      const category = await prisma.lotCategory.findFirst({
        where: { name, tenantId: parseTenantId(tenantId) },
        include: {
          _count: { select: { Lot: true, Subcategory: true } },
        },
      });
      return category ? serializeCategory(category) : null;
    } catch (error) {
      console.error('[CategoryRepository.findByName]', error);
      throw error;
    }
  }

  async create(data: Prisma.LotCategoryCreateInput): Promise<LotCategory> {
    try {
      const category = await prisma.lotCategory.create({ data });
      return serializeCategory(category);
    } catch (error) {
      console.error('[CategoryRepository.create]', error);
      throw error;
    }
  }

  async update(id: bigint, tenantId: string, data: Prisma.LotCategoryUpdateInput): Promise<LotCategory> {
    try {
      const category = await prisma.lotCategory.findFirst({
        where: { id, tenantId: parseTenantId(tenantId) },
        select: { id: true },
      });
      if (!category) {
        throw new Error('Categoria não encontrada para o tenant informado.');
      }
      const updated = await prisma.lotCategory.update({ where: { id: category.id }, data });
      return serializeCategory(updated);
    } catch (error) {
      console.error('[CategoryRepository.update]', error);
      throw error;
    }
  }

  async delete(id: bigint, tenantId: string): Promise<void> {
    try {
      await prisma.lotCategory.deleteMany({ where: { id, tenantId: parseTenantId(tenantId) } });
    } catch (error) {
      console.error('[CategoryRepository.delete]', error);
      throw error;
    }
  }

  async deleteAll(tenantId: string): Promise<void> {
    try {
      await prisma.lotCategory.deleteMany({ where: { tenantId: parseTenantId(tenantId) } });
    } catch (error) {
      console.error('[CategoryRepository.deleteAll]', error);
      throw error;
    }
  }
}
