// src/repositories/category.repository.ts
import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';
import type { Prisma } from '@prisma/client';

function parseTenantId(tenantId: string): bigint {
  return BigInt(tenantId);
}

export class CategoryRepository {
  async findAll(tenantId: string): Promise<any[]> {
    try {
      return await prisma.lotCategory.findMany({ 
        where: { tenantId: parseTenantId(tenantId) },
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { Lot: true }
          }
        }
      });
    } catch (error) {
      console.error('[CategoryRepository.findAll]', error);
      throw error;
    }
  }

  async findById(id: bigint, tenantId: string): Promise<LotCategory | null> {
    try {
      return await prisma.lotCategory.findFirst({ where: { id: id, tenantId: parseTenantId(tenantId) } });
    } catch (error) {
      console.error('[CategoryRepository.findById]', error);
      throw error;
    }
  }

  async findBySlug(slug: string, tenantId: string): Promise<LotCategory | null> {
    try {
      return await prisma.lotCategory.findFirst({ where: { slug, tenantId: parseTenantId(tenantId) } });
    } catch (error) {
      console.error('[CategoryRepository.findBySlug]', error);
      throw error;
    }
  }

  async findByName(name: string, tenantId: string): Promise<LotCategory | null> {
    try {
      return await prisma.lotCategory.findFirst({ where: { name, tenantId: parseTenantId(tenantId) } });
    } catch (error) {
      console.error('[CategoryRepository.findByName]', error);
      throw error;
    }
  }

  async create(data: Prisma.LotCategoryCreateInput): Promise<LotCategory> {
    try {
      return await prisma.lotCategory.create({ data });
    } catch (error) {
      console.error('[CategoryRepository.create]', error);
      throw error;
    }
  }

  async update(id: bigint, tenantId: string, data: Prisma.LotCategoryUpdateInput): Promise<LotCategory> {
    try {
      const category = await prisma.lotCategory.findFirst({ where: { id: id, tenantId: parseTenantId(tenantId) }, select: { id: true } });
      if (!category) {
        throw new Error('Categoria não encontrada para o tenant informado.');
      }
      return await prisma.lotCategory.update({ where: { id: category.id }, data });
    } catch (error) {
      console.error('[CategoryRepository.update]', error);
      throw error;
    }
  }

  async delete(id: bigint, tenantId: string): Promise<void> {
    try {
      await prisma.lotCategory.deleteMany({ where: { id: id, tenantId: parseTenantId(tenantId) } });
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