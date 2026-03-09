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

type CategoryMutationInput = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  logoMediaId?: string | bigint | null;
  dataAiHintLogo?: string | null;
  coverImageUrl?: string | null;
  coverImageMediaId?: string | bigint | null;
  dataAiHintCover?: string | null;
  megaMenuImageUrl?: string | null;
  megaMenuImageMediaId?: string | bigint | null;
  dataAiHintMegaMenu?: string | null;
};

function toOptionalString(value: string | null | undefined): string | null | undefined {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toOptionalBigInt(value: string | bigint | null | undefined): bigint | null | undefined {
  if (value == null || value === '') return null;
  if (typeof value === 'bigint') return value;
  return BigInt(value);
}

function normalizeCategoryMutationInput(data: CategoryMutationInput) {
  return {
    name: data.name.trim(),
    description: toOptionalString(data.description),
    logoUrl: toOptionalString(data.logoUrl),
    logoMediaId: toOptionalBigInt(data.logoMediaId),
    dataAiHintLogo: toOptionalString(data.dataAiHintLogo),
    coverImageUrl: toOptionalString(data.coverImageUrl),
    coverImageMediaId: toOptionalBigInt(data.coverImageMediaId),
    dataAiHintCover: toOptionalString(data.dataAiHintCover),
    megaMenuImageUrl: toOptionalString(data.megaMenuImageUrl),
    megaMenuImageMediaId: toOptionalBigInt(data.megaMenuImageMediaId),
    dataAiHintMegaMenu: toOptionalString(data.dataAiHintMegaMenu),
  };
}

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategories(tenantId: string): Promise<LotCategory[]> {
    const categories = await this.categoryRepository.findAll(tenantId);
    return categories.map(c => ({
      ...c,
      id: c.id.toString(),
      logoMediaId: c.logoMediaId?.toString(),
      coverImageMediaId: c.coverImageMediaId?.toString(),
      megaMenuImageMediaId: c.megaMenuImageMediaId?.toString(),
      _count: { lots: c._count.lots }
    }));
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

  async createCategory(data: CategoryMutationInput, tenantId: string): Promise<{ success: boolean; message: string; category?: LotCategory; }> {
    try {
      const normalizedData = normalizeCategoryMutationInput(data);
      const slug = slugify(normalizedData.name);

      const existingCategory = await this.categoryRepository.findByName(normalizedData.name, tenantId);
      if (existingCategory) {
        return { success: false, message: 'Já existe uma categoria com este nome no tenant atual.' };
      }
      
      const newCategory = await prisma.lotCategory.create({
        data: { ...normalizedData, slug, hasSubcategories: false, tenantId: BigInt(tenantId) },
      });

      return { success: true, message: 'Categoria criada com sucesso.', category: { ...newCategory, id: newCategory.id.toString() } };
    } catch (error: any) {
      return { success: false, message: `Falha ao criar categoria: ${error.message}` };
    }
  }

  async updateCategory(id: bigint, data: Partial<CategoryMutationInput>, tenantId: string): Promise<{ success: boolean; message: string }> {
    try {
      const dataToUpdate: Partial<Prisma.LotCategoryUpdateInput> = normalizeCategoryMutationInput({
        name: data.name ?? '',
        description: data.description,
        logoUrl: data.logoUrl,
        logoMediaId: data.logoMediaId,
        dataAiHintLogo: data.dataAiHintLogo,
        coverImageUrl: data.coverImageUrl,
        coverImageMediaId: data.coverImageMediaId,
        dataAiHintCover: data.dataAiHintCover,
        megaMenuImageUrl: data.megaMenuImageUrl,
        megaMenuImageMediaId: data.megaMenuImageMediaId,
        dataAiHintMegaMenu: data.dataAiHintMegaMenu,
      });
      if (data.name?.trim()) {
        dataToUpdate.name = data.name.trim();
        dataToUpdate.slug = slugify(data.name);
      } else {
        delete dataToUpdate.name;
      }

      await this.categoryRepository.update(id, tenantId, dataToUpdate);
      return { success: true, message: 'Categoria atualizada com sucesso.' };
    } catch (error: any) {
      return { success: false, message: `Falha ao atualizar categoria: ${error.message}` };
    }
  }

  async deleteCategory(id: bigint, tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.categoryRepository.delete(id, tenantId);
      return { success: true, message: 'Categoria excluída com sucesso.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir categoria. Verifique se ela não está em uso.' };
    }
  }

  async deleteAllCategories(tenantId: string): Promise<{ success: boolean; message: string; }> {
    try {
      await this.categoryRepository.deleteAll(tenantId);
      return { success: true, message: 'Todas as categorias foram excluídas.' };
    } catch (error: any) {
      return { success: false, message: 'Falha ao excluir todas as categorias.' };
    }
  }
}