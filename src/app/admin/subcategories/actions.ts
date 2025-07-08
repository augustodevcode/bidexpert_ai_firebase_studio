
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Subcategory, SubcategoryFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

export async function createSubcategoryAction(
  data: SubcategoryFormData
): Promise<{ success: boolean; message: string; subcategoryId?: string }> {
  try {
    const newSubcategory = await prisma.subcategory.create({
      data: {
        ...data,
        slug: slugify(data.name),
        displayOrder: data.displayOrder || 0,
      }
    });

    // Update parent category
    await prisma.lotCategory.update({
      where: { id: data.parentCategoryId },
      data: { hasSubcategories: true }
    });
    
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/categories`);
    return { success: true, message: 'Subcategoria criada com sucesso!', subcategoryId: newSubcategory.id };
  } catch (error: any) {
    console.error("Error creating subcategory:", error);
    return { success: false, message: 'Falha ao criar subcategoria.' };
  }
}

export async function getSubcategoriesByParentIdAction(parentCategoryId: string): Promise<Subcategory[]> {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: { parentCategoryId },
      orderBy: { displayOrder: 'asc' }
    });
    return subcategories as unknown as Subcategory[];
  } catch (error) {
    console.error(`Error fetching subcategories for parent ${parentCategoryId}:`, error);
    return [];
  }
}

export async function getSubcategoryByIdAction(subcategoryId: string): Promise<Subcategory | null> {
  try {
    const subcategory = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
    return subcategory as unknown as Subcategory | null;
  } catch (error) {
    console.error(`Error fetching subcategory ${subcategoryId}:`, error);
    return null;
  }
}

export async function updateSubcategoryAction(
  subcategoryId: string,
  data: Partial<SubcategoryFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: any = {...data};
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.subcategory.update({
      where: { id: subcategoryId },
      data: updateData,
    });
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/subcategories/${subcategoryId}/edit`);
    revalidatePath(`/admin/categories`);
    return { success: true, message: 'Subcategoria atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating subcategory ${subcategoryId}:`, error);
    return { success: false, message: 'Falha ao atualizar subcategoria.' };
  }
}

export async function deleteSubcategoryAction(
  subcategoryId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.subcategory.delete({ where: { id: subcategoryId } });
    revalidatePath('/admin/subcategories');
    revalidatePath(`/admin/categories`);
    return { success: true, message: 'Subcategoria excluída com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting subcategory ${subcategoryId}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Esta subcategoria está sendo usada por lotes.' };
    }
    return { success: false, message: 'Falha ao excluir subcategoria.' };
  }
}
