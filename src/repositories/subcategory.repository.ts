// src/repositories/subcategory.repository.ts
import { prisma } from '@/lib/prisma';
import type { Subcategory } from '@/types';
import type { Prisma } from '@prisma/client';

function parseTenantId(tenantId: string): bigint {
  return BigInt(tenantId);
}

function withTenantConnection(
  data: Prisma.SubcategoryCreateInput,
  tenantId: bigint,
): Prisma.SubcategoryCreateInput {
  return {
    ...data,
    Tenant: {
      connect: { id: tenantId },
    },
  };
}

export class SubcategoryRepository {
  async findAllByParentId(parentCategoryId: string, tenantId: string): Promise<any[]> {
    return prisma.subcategory.findMany({
      where: { parentCategoryId: BigInt(parentCategoryId), tenantId: parseTenantId(tenantId) },
      orderBy: { displayOrder: 'asc' },
      include: {
        LotCategory: { select: { name: true } },
      },
    });
  }

  async findById(id: string, tenantId: string): Promise<Subcategory | null> {
    return prisma.subcategory.findFirst({ where: { id: BigInt(id), tenantId: parseTenantId(tenantId) } });
  }

  async create(data: Prisma.SubcategoryCreateInput): Promise<Subcategory> {
    return prisma.subcategory.create({ data });
  }

  async update(id: string, tenantId: string, data: Prisma.SubcategoryUpdateInput): Promise<Subcategory> {
    const subcategory = await prisma.subcategory.findFirst({ where: { id: BigInt(id), tenantId: parseTenantId(tenantId) }, select: { id: true } });
    if (!subcategory) {
      throw new Error('Subcategoria não encontrada para o tenant informado.');
    }
    return prisma.subcategory.update({ where: { id: subcategory.id }, data });
  }

  async upsert(data: Prisma.SubcategoryCreateInput, tenantId: string): Promise<Subcategory> {
    const parentId = data.LotCategory?.connect?.id;
    const currentTenant = parseTenantId(tenantId);

    if (!parentId) {
      throw new Error('Categoria principal obrigatória para criar subcategoria.');
    }

    const existing = await prisma.subcategory.findFirst({
      where: { name: data.name, parentCategoryId: parentId, tenantId: currentTenant },
      select: { id: true },
    });

    if (existing) {
      return prisma.subcategory.update({ where: { id: existing.id }, data });
    }

    return prisma.subcategory.create({
      data: withTenantConnection(data, currentTenant),
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.subcategory.deleteMany({ where: { id: BigInt(id), tenantId: parseTenantId(tenantId) } });
  }

  async deleteAll(tenantId: string): Promise<void> {
    await prisma.subcategory.deleteMany({ where: { tenantId: parseTenantId(tenantId) } });
  }
}
