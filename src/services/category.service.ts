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

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategories(): Promise<LotCategory[]> {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: BigInt): Promise<LotCategory | null> {
    return this.categoryRepository.findById(id);
  }

  async createCategory(data: Pick<LotCategory, 'name' | 'description'>): Promise<{ success: boolean; message: string; categoryId?: BigInt; }> {
    try {
      const slug = slugify(data.name);
      const existing = await this.categoryRepository.findBySlug(slug);
      if (existing) {
        return { success: false, message: 'Já existe uma categoria com este nome.' };
      }
      
      const newCategory = await this.categoryRepository.create({ ...data, slug, hasSubcategories: false });
      return { success: true, message: 'Categoria criada com sucesso.', categoryId: newCategory.id };
    } catch (error: any) {
      return { success: false, message: `Falha ao criar categoria: ${error.message}` };
    }
  }

  async updateCategory(id: BigInt, data: Partial<Pick<LotCategory, 'name' | 'description'>>): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<LotCategory> = { ...data };
      if (data.name) {
        dataToUpdate.slug = slugify(data.name);
      }
      // @ts-ignore
      await this.categoryRepository.update(id, dataToUpdate);
      return { success: true, message: 'Categoria atualizada com sucesso.' };
    } catch (error: any) {
      return { success: false, message: `Falha ao atualizar categoria: ${error.message}` };
    }
  }

  async deleteCategory(id: BigInt): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, you might want to check for subcategories or lots before deleting.
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
