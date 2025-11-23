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

  private static cachedCategories: LotCategory[] | null = null;
  private static categoriesPromise: Promise<LotCategory[]> | null = null;

  async getCategories(): Promise<LotCategory[]> {
    if (CategoryService.cachedCategories) {
      return CategoryService.cachedCategories;
    }

    if (!CategoryService.categoriesPromise) {
      CategoryService.categoriesPromise = this.categoryRepository.findAll()
        .then(categories => categories.map(c => ({
          ...c,
          id: c.id.toString(),
          logoMediaId: c.logoMediaId?.toString(),
          coverImageMediaId: c.coverImageMediaId?.toString(),
          megaMenuImageMediaId: c.megaMenuImageMediaId?.toString(),
          _count: { lots: c._count.lots }
        })))
        .then(mapped => {
          CategoryService.cachedCategories = mapped;
          return mapped;
        })
        .catch(error => {
          CategoryService.categoriesPromise = null;
          throw error;
        })
        .finally(() => {
          CategoryService.categoriesPromise = null;
        });
    }

    return CategoryService.categoriesPromise;
  }

  async getCategoryById(id: bigint): Promise<LotCategory | null> {
    const category = await this.categoryRepository.findById(id);
    if (!category) return null;
    return {...category, id: category.id.toString()};
  }

  async getCategoryByName(name: string): Promise<LotCategory | null> {
    const category = await this.categoryRepository.findByName(name);
    if (!category) return null;
    return {...category, id: category.id.toString()};
  }

  async createCategory(data: Pick<LotCategory, 'name' | 'description'>): Promise<{ success: boolean; message: string; category?: LotCategory; }> {
    try {
      const slug = slugify(data.name);
      
      const newCategory = await prisma.lotCategory.upsert({
        where: { name: data.name },
        update: { ...data, slug },
        create: { ...data, slug, hasSubcategories: false },
      });

      return { success: true, message: 'Categoria criada/atualizada com sucesso.', category: { ...newCategory, id: newCategory.id.toString() } };
    } catch (error: any) {
      return { success: false, message: `Falha ao criar categoria: ${error.message}` };
    }
  }

  async updateCategory(id: bigint, data: Partial<Pick<LotCategory, 'name' | 'description'>>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<Prisma.LotCategoryUpdateInput> = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      await this.categoryRepository.update(id, dataToUpdate);
      return { success: true, message: 'Categoria atualizada com sucesso.' };
    } catch (error: any) {
      return { success: false, message: `Falha ao atualizar categoria: ${error.message}` };
    }
  }

  async deleteCategory(id: bigint): Promise<{ success: boolean; message: string; }> {
    try {
      await this.categoryRepository.delete(id);
      return { success: true, message: 'Categoria excluída com sucesso.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir categoria. Verifique se ela não está em uso.' };
    }
  }

  async deleteAllCategories(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.categoryRepository.deleteAll();
      return { success: true, message: 'Todas as categorias foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as categorias.' };
    }
  }
}