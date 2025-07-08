
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { JudicialDistrict, JudicialDistrictFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

export async function createJudicialDistrict(data: JudicialDistrictFormData): Promise<{ success: boolean; message: string; districtId?: string; }> {
  try {
    const newState = await prisma.judicialDistrict.create({
      data: {
        ...data,
        slug: slugify(data.name),
      }
    });
    revalidatePath('/admin/judicial-districts');
    return { success: true, message: 'Comarca criada com sucesso!', districtId: newState.id };
  } catch (error: any) {
    console.error("Error creating judicial district:", error);
    if (error.code === 'P2002') {
      return { success: false, message: 'Já existe uma comarca com este nome neste estado.' };
    }
    return { success: false, message: error.message || 'Falha ao criar comarca.' };
  }
}

export async function getJudicialDistricts(): Promise<JudicialDistrict[]> {
  try {
    const districts = await prisma.judicialDistrict.findMany({
      include: {
        court: true,
        state: true,
      },
      orderBy: { name: 'asc' }
    });
    return districts.map(d => ({
        ...d,
        courtName: d.court.name,
        stateUf: d.state.uf,
    })) as unknown as JudicialDistrict[];
  } catch (error) {
    console.error("Error fetching judicial districts:", error);
    return [];
  }
}

export async function getJudicialDistrict(id: string): Promise<JudicialDistrict | null> {
  try {
    const district = await prisma.judicialDistrict.findUnique({ where: { id } });
    return district as unknown as JudicialDistrict | null;
  } catch (error) {
    console.error(`Error fetching judicial district with ID ${id}:`, error);
    return null;
  }
}

export async function updateJudicialDistrict(id: string, data: Partial<JudicialDistrictFormData>): Promise<{ success: boolean; message: string; }> {
  try {
    const updateData: any = {...data};
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    await prisma.judicialDistrict.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/judicial-districts');
    revalidatePath(`/admin/judicial-districts/${id}/edit`);
    return { success: true, message: 'Comarca atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating judicial district ${id}:`, error);
    return { success: false, message: error.message || 'Falha ao atualizar comarca.' };
  }
}

export async function deleteJudicialDistrict(id: string): Promise<{ success: boolean; message: string; }> {
  try {
    await prisma.judicialDistrict.delete({ where: { id } });
    revalidatePath('/admin/judicial-districts');
    return { success: true, message: 'Comarca excluída com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting judicial district ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Esta comarca tem varas vinculadas.' };
    }
    return { success: false, message: error.message || 'Falha ao excluir comarca.' };
  }
}
