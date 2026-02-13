// src/services/category.service.ts
/**
 * @fileoverview Este arquivo contém a classe CategoryService, responsável por
 * encapsular a lógica de negócio para o gerenciamento de Categorias de Lotes.
 * Atua como um intermediário entre as server actions (controllers) e o repositório
 * de categorias, aplicando regras como a geração de `slug` e validação de
 * unicidade de nomes.
 */
import { CategoryRepository } from '@/repositories/category.repository';
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import prisma from '@/lib/prisma'; // Import prisma directly
import type { Prisma } from '@prisma/client';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  private static cachedCategories = new Map<string, LotCategory[]>();
  private static categoriesPromise = new Map<string, Promise<LotCategory[]>>();

  async getCategories(tenantId: string): Promise<LotCategory[]> {
    const cached = CategoryService.cachedCategories.get(tenantId);
    if (cached) {
      return cached;
    }

    if (!CategoryService.categoriesPromise.has(tenantId)) {
      CategoryService.categoriesPromise.set(
        tenantId,
        this.categoryRepository.findAll(tenantId)
        .then(categories => categories.map(c => ({
          ...c,
          id: c.id.toString(),
          logoMediaId: c.logoMediaId?.toString(),
          coverImageMediaId: c.coverImageMediaId?.toString(),
          megaMenuImageMediaId: c.megaMenuImageMediaId?.toString(),
          _count: { lots: c._count.lots }
        })))
        .then(mapped => {
          CategoryService.cachedCategories.set(tenantId, mapped);
          return mapped;
        })
        .catch(error => {
          CategoryService.categoriesPromise.delete(tenantId);
          throw error;
        })
        .finally(() => {
          CategoryService.categoriesPromise.delete(tenantId);
        })
      );
    }

    return CategoryService.categoriesPromise.get(tenantId)!;
  }

  async getCategoryById(id: bigint, tenantId: string): Promise<LotCategory | null> {
    const category = await this.categoryRepository.findById(id, tenantId);
    if (!category) return null;
    return {...category, id: category.id.toString()};
  }

  async getCategoryByName(name: string, tenantId: string): Promise<LotCategory | null> {
    const category = await this.categoryRepository.findByName(name, tenantId);
    if (!category) return null;
    return {...category, id: category.id.toString()};
  }

  async createCategory(data: Pick<LotCategory, 'name' | 'description'>, tenantId: string): Promise<{ success: boolean; message: string; category?: LotCategory; }> {
    try {
      const slug = slugify(data.name);

      const existingCategory = await this.categoryRepository.findByName(data.name, tenantId);
      if (existingCategory) {
        return { success: false, message: 'Já existe uma categoria com este nome no tenant atual.' };
      }
      
      const newCategory = await prisma.lotCategory.create({
        data: { ...data, slug, hasSubcategories: false, tenantId: BigInt(tenantId) },
      });

      CategoryService.cachedCategories.delete(tenantId);

      return { success: true, message: 'Categoria criada com sucesso.', category: { ...newCategory, id: newCategory.id.toString() } };
    } catch (error: any) {
      return { success: false, message: `Falha ao criar categoria: ${error.message}` };
    }
  }

  async updateCategory(id: bigint, data: Partial<Pick<LotCategory, 'name' | 'description'>>, tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<Prisma.LotCategoryUpdateInput> = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }

      await this.categoryRepository.update(id, tenantId, dataToUpdate);
      CategoryService.cachedCategories.delete(tenantId);
      return { success: true, message: 'Categoria atualizada com sucesso.' };
    } catch (error: any) {
      return { success: false, message: `Falha ao atualizar categoria: ${error.message}` };
    }
  }

  async deleteCategory(id: bigint, tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.categoryRepository.delete(id, tenantId);
      CategoryService.cachedCategories.delete(tenantId);
      return { success: true, message: 'Categoria excluída com sucesso.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir categoria. Verifique se ela não está em uso.' };
    }
  }

  async deleteAllCategories(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.categoryRepository.deleteAll(tenantId);
      CategoryService.cachedCategories.delete(tenantId);
      return { success: true, message: 'Todas as categorias foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as categorias.' };
    }
  }
}