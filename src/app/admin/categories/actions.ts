/**
 * @fileoverview Server Actions for managing Lot Categories.
 * 
 * This file provides the server-side logic for creating, reading, updating,
 * and deleting lot categories. It uses Prisma for database interactions
 * and revalidates Next.js cache paths to ensure the UI stays up-to-date.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { LotCategory } from '@/types';
import type { CategoryFormData } from './category-form-schema';
import { slugify } from '@/lib/sample-data-helpers';

/**
 * Creates a new lot category.
 * @param {CategoryFormData} data - The data for the new category from the form.
 * @returns {Promise<{ success: boolean; message: string; categoryId?: string; }>} 
 * An object indicating the result of the operation.
 */
export async function createLotCategory(
  data: CategoryFormData
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

/**
 * Fetches all lot categories from the database.
 * @returns {Promise<LotCategory[]>} A promise that resolves to an array of categories.
 */
export async function getLotCategories(): Promise<LotCategory[]> {
  try {
    const categories = await prisma.lotCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return categories as unknown as LotCategory[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Fetches a single lot category by its ID.
 * @param {string} id - The ID of the category.
 * @returns {Promise<LotCategory | null>} The category object or null if not found.
 */
export async function getLotCategory(id: string): Promise<LotCategory | null> {
  try {
    const category = await prisma.lotCategory.findUnique({ where: { id } });
    return category as unknown as LotCategory | null;
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetches a single lot category by its slug.
 * @param {string} slug - The slug of the category.
 * @returns {Promise<LotCategory | null>} The category object or null if not found.
 */
export async function getLotCategoryBySlug(slug: string): Promise<LotCategory | null> {
  try {
    const category = await prisma.lotCategory.findUnique({ where: { slug } });
    return category as unknown as LotCategory | null;
  } catch (error) {
    console.error(`Error fetching category by slug ${slug}:`, error);
    return null;
  }
}

/**
 * Fetches a single lot category by its name.
 * @param {string} name - The exact name of the category.
 * @returns {Promise<LotCategory | null>} The category object or null if not found.
 */
export async function getLotCategoryByName(name: string): Promise<LotCategory | null> {
  try {
    const category = await prisma.lotCategory.findFirst({ where: { name } });
    return category as unknown as LotCategory | null;
  } catch (error: any) {
    console.error(`Error fetching category by name ${name}:`, error);
    return null;
  }
}

/**
 * Updates an existing lot category.
 * @param {string} id - The ID of the category to update.
 * @param {CategoryFormData} data - The updated category data.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
export async function updateLotCategory(
  id: string,
  data: CategoryFormData
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

/**
 * Deletes a lot category.
 * @param {string} id - The ID of the category to delete.
 * @returns {Promise<{ success: boolean; message: string; }>} An object indicating the result.
 */
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
