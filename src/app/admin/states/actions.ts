
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { StateInfo, StateFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  try {
    const newState = await prisma.state.create({
      data: {
        ...data,
        slug: slugify(data.name)
      }
    });
    revalidatePath('/admin/states');
    return { success: true, message: 'Estado criado com sucesso!', stateId: newState.id };
  } catch (error: any) {
    console.error("Error creating state:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return { success: false, message: 'Já existe um estado com este nome (slug).' };
    }
    return { success: false, message: 'Falha ao criar estado.' };
  }
}

export async function getStates(): Promise<StateInfo[]> {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
    });
    return states as unknown as StateInfo[];
  } catch (error) {
    console.error("Error fetching states:", error);
    return [];
  }
}

export async function getState(id: string): Promise<StateInfo | null> {
  try {
    const state = await prisma.state.findUnique({ where: { id } });
    return state as unknown as StateInfo | null;
  } catch (error) {
    console.error(`Error fetching state ${id}:`, error);
    return null;
  }
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  try {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.state.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/states');
    revalidatePath(`/admin/states/${id}/edit`);
    return { success: true, message: 'Estado atualizado com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating state ${id}:`, error);
    return { success: false, message: 'Falha ao atualizar estado.' };
  }
}

export async function deleteState(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.state.delete({ where: { id } });
    revalidatePath('/admin/states');
    return { success: true, message: 'Estado excluído com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting state ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Este estado tem cidades vinculadas.' };
    }
    return { success: false, message: 'Falha ao excluir estado.' };
  }
}
