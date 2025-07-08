
// src/app/admin/categories/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';
import type { CategoryFormValues } from './category-form-schema';
import { slugify } from '@/lib/sample-data-helpers';

export async function createLotCategory(
  data: CategoryFormValues
): Promise<{ success: boolean; message: string; categoryId?: string; }> {
  try {
    const newCategory = await prisma.lotCategory.create({
      data: {
        ...data,
        slug: slugify(data.name),
        hasSubcategories: false, // Default value
        itemCount: 0,
      }
    });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: newCategory.id };
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return { success: false, message: 'Já existe uma categoria com este nome (slug).' };
    }
    return { success: false, message: 'Falha ao criar categoria.' };
  }
}

export async function getLotCategories(): Promise<LotCategory[]> {
  try {
    return await prisma.lotCategory.findMany({
      orderBy: { name: 'asc' },
    }) as unknown as LotCategory[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  try {
    const category = await prisma.lotCategory.findUnique({ where: { id } });
    return category as unknown as LotCategory | null;
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    return null;
  }
}

export async function getLotCategoryBySlug(slug: string): Promise<LotCategory | null> {
  try {
    const category = await prisma.lotCategory.findUnique({ where: { slug } });
    return category as unknown as LotCategory | null;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    return null;
  }
}

export async function getLotCategoryByName(name: string): Promise<LotCategory | null> {
  try {
    const category = await prisma.lotCategory.findFirst({ where: { name } });
    return category as unknown as LotCategory | null;
  } catch (error) {
    console.error(`Error fetching category by name ${name}:`, error);
    return null;
  }
}

export async function updateLotCategory(
  id: string,
  data: CategoryFormValues
): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.lotCategory.update({
      where: { id },
      data: {
        ...data,
        slug: slugify(data.name),
      },
    });
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
    revalidatePath(`/category/${slugify(data.name)}`);
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating category ${id}:`, error);
    return { success: false, message: 'Falha ao atualizar categoria.' };
  }
}

export async function deleteLotCategory(
  id: string
): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.lotCategory.delete({ where: { id } });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria excluída com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting category ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Esta categoria está sendo usada por subcategorias ou lotes.' };
    }
    return { success: false, message: 'Falha ao excluir categoria.' };
  }
}
