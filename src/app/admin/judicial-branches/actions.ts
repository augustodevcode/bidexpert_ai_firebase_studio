
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { JudicialBranch, JudicialBranchFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

export async function createJudicialBranch(data: JudicialBranchFormData): Promise<{ success: boolean; message: string; branchId?: string; }> {
  try {
    const newBranch = await prisma.judicialBranch.create({
      data: {
        ...data,
        slug: slugify(data.name),
      }
    });
    revalidatePath('/admin/judicial-branches');
    return { success: true, message: 'Vara criada com sucesso!', branchId: newBranch.id };
  } catch (error: any) {
    console.error("Error creating judicial branch:", error);
     if (error.code === 'P2002') {
      return { success: false, message: 'Já existe uma vara com este nome nesta comarca.' };
    }
    return { success: false, message: error.message || 'Falha ao criar vara.' };
  }
}

export async function getJudicialBranches(): Promise<JudicialBranch[]> {
  try {
    const branches = await prisma.judicialBranch.findMany({
      include: {
        district: {
          select: { name: true, stateUf: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return branches.map(b => ({
      ...b,
      districtName: `${b.district.name} - ${b.district.stateUf}`
    })) as unknown as JudicialBranch[];
  } catch (error) {
    console.error("Error fetching judicial branches:", error);
    return [];
  }
}

export async function getJudicialBranch(id: string): Promise<JudicialBranch | null> {
  try {
    const branch = await prisma.judicialBranch.findUnique({ where: { id } });
    return branch as unknown as JudicialBranch | null;
  } catch (error) {
    console.error(`Error fetching judicial branch with ID ${id}:`, error);
    return null;
  }
}

export async function updateJudicialBranch(id: string, data: Partial<JudicialBranchFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    const updateData: any = {...data};
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.judicialBranch.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/judicial-branches');
    revalidatePath(`/admin/judicial-branches/${id}/edit`);
    return { success: true, message: 'Vara atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating judicial branch ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar vara.' };
  }
}

export async function deleteJudicialBranch(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.judicialBranch.delete({ where: { id } });
    revalidatePath('/admin/judicial-branches');
    return { success: true, message: 'Vara excluída com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting judicial branch ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Esta vara tem processos vinculados.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir vara.' };
  }
}
