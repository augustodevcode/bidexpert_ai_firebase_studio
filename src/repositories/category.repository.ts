// src/repositories/category.repository.ts
import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';
import type { Prisma } from '@prisma/client';

export class CategoryRepository {
  async findAll(): Promise<any[]> {
    try {
      return await prisma.lotCategory.findMany({ 
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

  async findById(id: bigint): Promise<LotCategory | null> {
    try {
      return await prisma.lotCategory.findUnique({ where: { id: id } });
    } catch (error) {
      console.error('[CategoryRepository.findById]', error);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<LotCategory | null> {
    try {
      return await prisma.lotCategory.findUnique({ where: { slug } });
    } catch (error) {
      console.error('[CategoryRepository.findBySlug]', error);
      throw error;
    }
  }

  async findByName(name: string): Promise<LotCategory | null> {
    try {
      return await prisma.lotCategory.findUnique({ where: { name } });
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

  async update(id: bigint, data: Prisma.LotCategoryUpdateInput): Promise<LotCategory> {
    try {
      return await prisma.lotCategory.update({ where: { id: id }, data });
    } catch (error) {
      console.error('[CategoryRepository.update]', error);
      throw error;
    }
  }

  async delete(id: bigint): Promise<void> {
    try {
      await prisma.lotCategory.delete({ where: { id: id } });
    } catch (error) {
      console.error('[CategoryRepository.delete]', error);
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      await prisma.lotCategory.deleteMany({});
    } catch (error) {
      console.error('[CategoryRepository.deleteAll]', error);
      throw error;
    }
  }
}