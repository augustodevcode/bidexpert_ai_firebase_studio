
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { CityInfo, CityFormData } from '@/types';
import { slugify } from '@/lib/sample-data-helpers';

export async function createCity(
  data: CityFormData
): Promise<{ success: boolean; message: string; cityId?: string }> {
  const state = await prisma.state.findUnique({ where: { id: data.stateId }});
  if (!state) {
    return { success: false, message: 'Estado selecionado não é válido.' };
  }
  
  try {
    const newCity = await prisma.city.create({
      data: {
        name: data.name,
        slug: slugify(data.name),
        stateId: data.stateId,
        stateUf: state.uf,
        ibgeCode: data.ibgeCode,
      }
    });
    revalidatePath('/admin/cities');
    revalidatePath('/admin/states');
    return { success: true, message: 'Cidade criada com sucesso!', cityId: newCity.id };
  } catch (error: any) {
    console.error("Error creating city:", error);
    return { success: false, message: 'Falha ao criar cidade.' };
  }
}

export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
  try {
    const cities = await prisma.city.findMany({
      where: stateIdFilter ? { stateId: stateIdFilter } : {},
      orderBy: { name: 'asc' },
    });
    return cities as unknown as CityInfo[];
  } catch (error) {
    console.error("Error fetching cities:", error);
    return [];
  }
}

export async function getCity(id: string): Promise<CityInfo | null> {
  try {
    const city = await prisma.city.findUnique({ where: { id } });
    return city as unknown as CityInfo | null;
  } catch (error) {
    console.error(`Error fetching city ${id}:`, error);
    return null;
  }
}

export async function updateCity(
  id: string,
  data: Partial<CityFormData>
): Promise<{ success: boolean; message: string }> {
  const updateData: any = { ...data };
  if (data.name) {
    updateData.slug = slugify(data.name);
  }
  if (data.stateId) {
    const state = await prisma.state.findUnique({ where: { id: data.stateId }});
    if (state) updateData.stateUf = state.uf;
  }

  try {
    await prisma.city.update({
      where: { id },
      data: updateData,
    });
    revalidatePath('/admin/cities');
    revalidatePath(`/admin/cities/${id}/edit`);
    return { success: true, message: 'Cidade atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`Error updating city ${id}:`, error);
    return { success: false, message: 'Falha ao atualizar cidade.' };
  }
}

export async function deleteCity(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.city.delete({ where: { id } });
    revalidatePath('/admin/cities');
    return { success: true, message: 'Cidade excluída com sucesso!' };
  } catch (error: any) {
    console.error(`Error deleting city ${id}:`, error);
    if (error.code === 'P2003') {
        return { success: false, message: 'Não é possível excluir. Esta cidade está em uso.' };
    }
    return { success: false, message: 'Falha ao excluir cidade.' };
  }
}
