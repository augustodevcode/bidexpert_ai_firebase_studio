
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { Court, CourtFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

export async function createCourt(data: CourtFormData): Promise<{ success: boolean; message: string; courtId?: string; }> {
  try {
    const newCourt = await prisma.court.create({
      data: {
        ...data,
        slug: slugify(data.name),
      }
    });
    revalidatePath('/admin/courts');
    return { success: true, message: 'Tribunal criado com sucesso!', courtId: newCourt.id };
  } catch (error: any) {
    console.error("Error creating court:", error);
    if (error.code === 'P2002') {
      return { success: false, message: 'Já existe um tribunal com este nome (slug).' };
    }
    return { success: false, message: error.message || 'Falha ao criar tribunal.' };
  }
}

export async function getCourts(): Promise<Court[]> {
  try {
    return await prisma.court.findMany({ orderBy: { name: 'asc' } }) as unknown as Court[];
  } catch (error) {
    console.error("Error fetching courts:", error);
    return [];
  }
}

export async function getCourt(id: string): Promise<Court | null> {
  try {
    const court = await prisma.court.findUnique({ where: { id } });
    return court as unknown as Court | null;
  } catch (error) {
    console.error(`Error fetching court with ID ${id}:`, error);
    return null;
  }
}

export async function updateCourt(id: string, data: Partial<CourtFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    const updateData: any = {...data};
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.court.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/courts');
    revalidatePath(`/admin/courts/${id}/edit`);
    return { success: true, message: 'Tribunal atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating court ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar tribunal.' };
  }
}

export async function deleteCourt(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.court.delete({ where: { id } });
    revalidatePath('/admin/courts');
    return { success: true, message: 'Tribunal excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting court ${id}:`, error);
     if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Este tribunal tem comarcas vinculadas.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir tribunal.' };
  }
}
