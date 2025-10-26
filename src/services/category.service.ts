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
import { prisma } from '@/lib/prisma'; // Import prisma directly
import type { Prisma } from '@prisma/client';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategories(): Promise<LotCategory[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map(c => ({
      ...c, 
      id: c.id, // Keep BigInt as is
      _count: { lots: c._count.lots }
    }));
  }

  async getCategoryById(id: bigint): Promise<LotCategory | null> {
    const category = await this.categoryRepository.findById(id);
    if (!category) return null;
    return {...category, id: category.id};
  }

  async getCategoryByName(name: string): Promise<LotCategory | null> {
    const category = await this.categoryRepository.findByName(name);
    if (!category) return null;
    return {...category, id: category.id};
  }

  async createCategory(data: Pick<LotCategory, 'name' | 'description'>): Promise<{ success: boolean; message: string; category?: LotCategory; }> {
    try {
      const slug = slugify(data.name);
      
      const newCategory = await prisma.lotCategory.upsert({
        where: { name: data.name },
        update: { ...data, slug },
        create: { ...data, slug, hasSubcategories: false },
      });

      return { success: true, message: 'Categoria criada/atualizada com sucesso.', category: { ...newCategory, id: newCategory.id } };
    } catch (error: any) {
      return { success: false, message: `Falha ao criar categoria: ${error.message}` };
    }
  }

  async updateCategory(id: bigint, data: Partial<Pick<LotCategory, 'name' | 'description'>>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<LotCategory> = { ...data };
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