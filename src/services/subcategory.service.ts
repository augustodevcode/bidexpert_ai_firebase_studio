// src/services/subcategory.service.ts
/**
 * @fileoverview Este arquivo contém a classe SubcategoryService, responsável por
 * gerenciar a lógica de negócio das Subcategorias de Lotes. Ele interage com o
 * repositório para criar, buscar e atualizar subcategorias, e garante que uma
 * categoria principal seja marcada como `hasSubcategories` quando a primeira
 * subcategoria é adicionada a ela.
 */
import { SubcategoryRepository } from '@/repositories/subcategory.repository';
import type { Subcategory, SubcategoryFormData } from '@/types';
import { slugify } from '@/lib/ui-helpers';
import type { Prisma } from '@prisma/client';
import { CategoryRepository } from '@/repositories/category.repository';

export class SubcategoryService {
  private repository: SubcategoryRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.repository = new SubcategoryRepository();
    this.categoryRepository = new CategoryRepository();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido';
  }

  async getSubcategoriesByParentId(parentCategoryId: string, tenantId: string): Promise<Subcategory[]> {
    const subcategories = await this.repository.findAllByParentId(parentCategoryId, tenantId);
    return subcategories.map(s => ({
      ...s,
      id: s.id.toString(),
      parentCategoryId: s.parentCategoryId.toString(),
      parentCategoryName: s.parentCategory?.name,
    }));
  }

  async getSubcategoryById(id: string, tenantId: string): Promise<Subcategory | null> {
    const subcategory = await this.repository.findById(id, tenantId);
    if (!subcategory) return null;
    return { ...subcategory, id: subcategory.id.toString(), parentCategoryId: subcategory.parentCategoryId.toString() };
  }

  async createSubcategory(data: SubcategoryFormData, tenantId: string): Promise<{ success: boolean; message: string; subcategoryId?: string; }> {
    try {
      const parentCategory = await this.categoryRepository.findById(BigInt(data.parentCategoryId), tenantId);
      if (!parentCategory) {
        return { success: false, message: 'A categoria principal selecionada não existe.' };
      }
      if (!parentCategory.hasSubcategories) {
        await this.categoryRepository.update(BigInt(parentCategory.id), tenantId, { hasSubcategories: true });
      }
      
      const dataToUpsert: Prisma.SubcategoryCreateInput = {
        name: data.name,
        slug: slugify(data.name),
        description: data.description,
        displayOrder: data.displayOrder,
        iconUrl: data.iconUrl,
        iconMediaId: data.iconMediaId,
        dataAiHintIcon: data.dataAiHintIcon,
        LotCategory: { connect: { id: BigInt(data.parentCategoryId) } },
      };

      const newSubcategory = await this.repository.upsert(dataToUpsert, tenantId);
      return { success: true, message: 'Subcategoria criada/atualizada com sucesso.', subcategoryId: newSubcategory.id.toString() };
    } catch (error: unknown) {
      console.error("Error in SubcategoryService.create:", error);
      return { success: false, message: `Falha ao criar subcategoria: ${this.getErrorMessage(error)}` };
    }
  }

  async updateSubcategory(id: string, data: Partial<SubcategoryFormData>, tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
        const dataToUpdate: Prisma.SubcategoryUpdateInput = { ...data };
        if (data.name) {
            dataToUpdate.slug = slugify(data.name);
        }
        if (data.parentCategoryId) {
             const parentCategory = await this.categoryRepository.findById(BigInt(data.parentCategoryId), tenantId);
             if (!parentCategory) {
              return { success: false, message: 'A categoria principal selecionada não existe para o tenant atual.' };
             }
             dataToUpdate.LotCategory = { connect: { id: BigInt(data.parentCategoryId) } };
        }
      
      await this.repository.update(id, tenantId, dataToUpdate);
      return { success: true, message: 'Subcategoria atualizada com sucesso.' };
    } catch (error: unknown)
        {
      console.error(`Error in SubcategoryService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar subcategoria: ${this.getErrorMessage(error)}` };
    }
  }

  async deleteSubcategory(id: string, tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, check for lots linked to this subcategory
      await this.repository.delete(id, tenantId);
      return { success: true, message: 'Subcategoria excluída com sucesso.' };
    } catch (error: unknown) {
      console.error(`Error in SubcategoryService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir subcategoria: ${this.getErrorMessage(error)}` };
    }
  }

  async deleteAllSubcategories(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAll(tenantId);
      return { success: true, message: 'Todas as subcategorias foram excluídas.' };
    } catch (_error: unknown) {
      return { success: false, message: 'Falha ao excluir todas as subcategorias.' };
    }
  }
}
