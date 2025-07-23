// src/app/admin/states/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { StateInfo, StateFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import { slugify } from '@/lib/sample-data-helpers';


export async function getStates(): Promise<StateInfo[]> {
  const states = await prisma.state.findMany({
    include: {
        _count: {
            select: { cities: true }
        }
    },
    orderBy: { name: 'asc' }
  });
  return states.map(s => ({ ...s, cityCount: s._count.cities }));
}

export async function getState(id: string): Promise<StateInfo | null> {
  return prisma.state.findUnique({ where: { id } });
}

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  try {
    const newState = await prisma.state.create({
        data: {
            ...data,
            slug: slugify(data.name),
        }
    });
    revalidatePath('/admin/states');
    return { success: true, message: "Estado criado com sucesso.", stateId: newState.id };
  } catch(error: any) {
    if (error.code === 'P2002') { // Unique constraint violation
        return { success: false, message: `Já existe um estado com a UF '${data.uf}'.` };
    }
    return { success: false, message: `Falha ao criar estado: ${error.message}` };
  }
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  try {
     await prisma.state.update({
        where: { id },
        data: {
            ...data,
            slug: data.name ? slugify(data.name) : undefined,
        }
     });
    revalidatePath('/admin/states');
    revalidatePath(`/admin/states/${id}/edit`);
    return { success: true, message: "Estado atualizado com sucesso." };
  } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: false, message: `Já existe um estado com a UF '${data.uf}'.` };
    }
    return { success: false, message: `Falha ao atualizar estado: ${error.message}` };
  }
}

export async function deleteState(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.state.delete({ where: { id } });
    revalidatePath('/admin/states');
    return { success: true, message: "Estado excluído com sucesso." };
  } catch (error: any) {
    return { success: false, message: "Falha ao excluir estado. Verifique se ele não possui cidades vinculadas." };
  }
}
