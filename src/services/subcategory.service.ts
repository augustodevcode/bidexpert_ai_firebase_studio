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
import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

export class SubcategoryService {
  private repository: SubcategoryRepository;
  private categoryRepository: CategoryRepository;
  private prisma: PrismaClient;

  constructor() {
    this.repository = new SubcategoryRepository();
    this.categoryRepository = new CategoryRepository();
    this.prisma = prisma;
  }

  async getSubcategoriesByParentId(parentCategoryId: BigInt): Promise<Subcategory[]> {
    const subcategories = await this.repository.findAllByParentId(parentCategoryId);
    return subcategories.map(s => ({
      ...s,
      parentCategoryName: s.parentCategory?.name,
    }));
  }

  async getSubcategoryById(id: BigInt): Promise<Subcategory | null> {
    return this.repository.findById(id);
  }

  async createSubcategory(data: SubcategoryFormData): Promise<{ success: boolean; message: string; subcategoryId?: BigInt; }> {
    try {
      const parentCategory = await this.categoryRepository.findById(data.parentCategoryId);
      if (!parentCategory) {
        return { success: false, message: 'A categoria principal selecionada não existe.' };
      }
      if (!parentCategory.hasSubcategories) {
        await this.categoryRepository.update(parentCategory.id, { hasSubcategories: true });
      }
      
      const dataToUpsert: Prisma.SubcategoryCreateInput = {
        name: data.name,
        slug: slugify(data.name),
        description: data.description,
        displayOrder: data.displayOrder,
        iconUrl: data.iconUrl,
        iconMediaId: data.iconMediaId,
        dataAiHintIcon: data.dataAiHintIcon,
        parentCategory: { connect: { id: data.parentCategoryId } },
      };

      const newSubcategory = await prisma.subCategory.upsert({
        where: { slug_parentCategoryId: { slug: dataToUpsert.slug, parentCategoryId: data.parentCategoryId } },
        update: dataToUpsert,
        create: dataToUpsert,
      });
      return { success: true, message: 'Subcategoria criada/atualizada com sucesso.', subcategoryId: newSubcategory.id };
    } catch (error: any) {
      console.error("Error in SubcategoryService.create:", error);
      return { success: false, message: `Falha ao criar subcategoria: ${error.message}` };
    }
  }

  async updateSubcategory(id: BigInt, data: Partial<SubcategoryFormData>): Promise<{ success: boolean; message: string; }> {
    try {
        const dataToUpdate: Prisma.SubcategoryUpdateInput = { ...data };
        if (data.name) {
            dataToUpdate.slug = slugify(data.name);
        }
        if (data.parentCategoryId) {
             dataToUpdate.parentCategory = { connect: { id: data.parentCategoryId } };
        }
      
      await this.repository.update(id, dataToUpdate);
      return { success: true, message: 'Subcategoria atualizada com sucesso.' };
    } catch (error: any)
        {
      console.error(`Error in SubcategoryService.update for id ${id}:`, error);
      return { success: false, message: `Falha ao atualizar subcategoria: ${error.message}` };
    }
  }

  async deleteSubcategory(id: BigInt): Promise<{ success: boolean; message: string; }> {
    try {
      // In a real app, check for lots linked to this subcategory
      await this.repository.delete(id);
      return { success: true, message: 'Subcategoria excluída com sucesso.' };
    } catch (error: any) {
      console.error(`Error in SubcategoryService.delete for id ${id}:`, error);
      return { success: false, message: `Falha ao excluir subcategoria: ${error.message}` };
    }
  }

  async deleteAllSubcategories(): Promise<{ success: boolean; message: string; }> {
    try {
      await this.repository.deleteAll();
      return { success: true, message: 'Todas as subcategorias foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as subcategorias.' };
    }
  }
}
